/**
 * Ad Rewards Database Queries
 *
 * Purpose:
 *   Database operations for ad_rewards table
 *   CRUD operations and statistics queries
 *
 * Note:
 *   All functions are async and return promises
 *   Use transactions for operations that modify multiple tables
 */

import type { D1Database } from '@cloudflare/workers-types';
import type { AdReward } from '~/domain/ad_reward';
import { getTodayDateString } from '~/domain/ad_reward';
import { incrementAdsWatched } from './daily_usage'; // Import daily usage updater
import { createDatabaseClient } from '../client'; // Need client to wrap d1 for daily_usage

// ============================================================================
// Read Operations
// ============================================================================

/**
 * Get ad reward record for user on specific date
 *
 * @param db - D1 database instance
 * @param telegramId - User's Telegram ID
 * @param rewardDate - Date in YYYY-MM-DD format
 * @returns Ad reward record or null if not found
 */
export async function getAdReward(
  db: D1Database,
  telegramId: string,
  rewardDate: string
): Promise<AdReward | null> {
  const result = await db
    .prepare(
      `SELECT * FROM ad_rewards 
       WHERE telegram_id = ? AND reward_date = ?`
    )
    .bind(telegramId, rewardDate)
    .first<AdReward>();

  return result || null;
}

/**
 * Get today's ad reward for user
 *
 * @param db - D1 database instance
 * @param telegramId - User's Telegram ID
 * @returns Today's ad reward or null
 */
export async function getTodayAdReward(
  db: D1Database,
  telegramId: string
): Promise<AdReward | null> {
  const today = getTodayDateString();
  return getAdReward(db, telegramId, today);
}

/**
 * Get ad rewards for user in date range
 *
 * @param db - D1 database instance
 * @param telegramId - User's Telegram ID
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Array of ad rewards
 */
export async function getAdRewardsByDateRange(
  db: D1Database,
  telegramId: string,
  startDate: string,
  endDate: string
): Promise<AdReward[]> {
  const result = await db
    .prepare(
      `SELECT * FROM ad_rewards 
       WHERE telegram_id = ? 
         AND reward_date BETWEEN ? AND ?
       ORDER BY reward_date DESC`
    )
    .bind(telegramId, startDate, endDate)
    .all<AdReward>();

  return result.results || [];
}

/**
 * Get total ads watched by user (all time)
 *
 * @param db - D1 database instance
 * @param telegramId - User's Telegram ID
 * @returns Total ads watched
 */
export async function getTotalAdsWatched(db: D1Database, telegramId: string): Promise<number> {
  const result = await db
    .prepare(
      `SELECT SUM(ads_watched) as total 
       FROM ad_rewards 
       WHERE telegram_id = ?`
    )
    .bind(telegramId)
    .first<{ total: number | null }>();

  return result?.total || 0;
}

/**
 * Get total quota earned from ads (all time)
 *
 * @param db - D1 database instance
 * @param telegramId - User's Telegram ID
 * @returns Total quota earned
 */
export async function getTotalQuotaEarned(db: D1Database, telegramId: string): Promise<number> {
  const result = await db
    .prepare(
      `SELECT SUM(quota_earned) as total 
       FROM ad_rewards 
       WHERE telegram_id = ?`
    )
    .bind(telegramId)
    .first<{ total: number | null }>();

  return result?.total || 0;
}

// ============================================================================
// Write Operations
// ============================================================================

/**
 * Create or update ad reward record
 *
 * @param db - D1 database instance
 * @param telegramId - User's Telegram ID
 * @param rewardDate - Date in YYYY-MM-DD format
 * @param adsWatched - Number of ads watched
 * @param quotaEarned - Quota earned
 * @param adViews - Number of ad views
 * @param adCompletions - Number of ad completions
 * @returns Updated ad reward record
 */
export async function upsertAdReward(
  db: D1Database,
  telegramId: string,
  rewardDate: string,
  adsWatched: number,
  quotaEarned: number,
  adViews: number,
  adCompletions: number
): Promise<AdReward> {
  await db
    .prepare(
      `INSERT INTO ad_rewards (
        telegram_id, reward_date, ads_watched, quota_earned, 
        ad_views, ad_completions, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(telegram_id, reward_date) 
      DO UPDATE SET 
        ads_watched = excluded.ads_watched,
        quota_earned = excluded.quota_earned,
        ad_views = excluded.ad_views,
        ad_completions = excluded.ad_completions,
        updated_at = CURRENT_TIMESTAMP`
    )
    .bind(telegramId, rewardDate, adsWatched, quotaEarned, adViews, adCompletions)
    .run();

  // Return updated record
  const updated = await getAdReward(db, telegramId, rewardDate);
  if (!updated) {
    throw new Error('Failed to upsert ad reward');
  }

  return updated;
}

/**
 * Increment ad view count
 *
 * @param db - D1 database instance
 * @param telegramId - User's Telegram ID
 * @param rewardDate - Date in YYYY-MM-DD format
 * @returns Updated ad reward record
 */
export async function incrementAdView(
  db: D1Database,
  telegramId: string,
  rewardDate: string
): Promise<AdReward> {
  // Get current record or create new one
  const current = await getAdReward(db, telegramId, rewardDate);

  const newAdViews = (current?.ad_views || 0) + 1;

  return upsertAdReward(
    db,
    telegramId,
    rewardDate,
    current?.ads_watched || 0,
    current?.quota_earned || 0,
    newAdViews,
    current?.ad_completions || 0
  );
}

/**
 * Increment ad completion count
 *
 * @param db - D1 database instance
 * @param telegramId - User's Telegram ID
 * @param rewardDate - Date in YYYY-MM-DD format
 * @returns Updated ad reward record
 */
export async function incrementAdCompletion(
  db: D1Database,
  telegramId: string,
  rewardDate: string
): Promise<AdReward> {
  // Get current record
  const current = await getAdReward(db, telegramId, rewardDate);
  if (!current) {
    throw new Error('Ad reward record not found');
  }

  const newAdsWatched = current.ads_watched + 1;
  const newQuotaEarned = current.quota_earned + 1;
  const newAdCompletions = current.ad_completions + 1;

  // ✨ NEW: Increment daily usage counter (fire and forget for speed, but await for safety)
  try {
    const client = createDatabaseClient({ DB: db } as any); // Wrap D1
    await incrementAdsWatched(client, telegramId, rewardDate);
  } catch (e) {
    console.error('[incrementAdCompletion] Failed to update daily usage:', e);
  }

  return upsertAdReward(
    db,
    telegramId,
    rewardDate,
    newAdsWatched,
    newQuotaEarned,
    current.ad_views,
    newAdCompletions
  );
}

/**
 * Grant temporary quota (without incrementing ad watch count)
 *
 * @param db - D1 database instance
 * @param telegramId - User's Telegram ID
 * @param quotaAmount - Amount of quota to grant
 * @returns Updated ad reward record
 */
export async function grantTemporaryQuota(
  db: D1Database,
  telegramId: string,
  quotaAmount: number
): Promise<AdReward> {
  const today = getTodayDateString();
  const current = await getAdReward(db, telegramId, today);

  // ✨ NEW: Increment daily usage counter for official ads
  try {
    const client = createDatabaseClient({ DB: db } as any);
    await incrementAdsWatched(client, telegramId, today);
  } catch (e) {
    console.error('[grantTemporaryQuota] Failed to update daily usage:', e);
  }

  return upsertAdReward(
    db,
    telegramId,
    today,
    current?.ads_watched || 0,
    (current?.quota_earned || 0) + quotaAmount,
    current?.ad_views || 0,
    current?.ad_completions || 0
  );
}

// ============================================================================
// Statistics Queries
// ============================================================================

/**
 * Get daily ad statistics
 *
 * @param db - D1 database instance
 * @param date - Date in YYYY-MM-DD format
 * @returns Daily statistics
 */
export async function getDailyAdStats(
  db: D1Database,
  date: string
): Promise<{
  total_users: number;
  total_ad_views: number;
  total_ad_completions: number;
  total_quota_earned: number;
  avg_ads_per_user: number;
  completion_rate: number;
}> {
  const result = await db
    .prepare(
      `SELECT 
        COUNT(DISTINCT telegram_id) as total_users,
        SUM(ad_views) as total_ad_views,
        SUM(ad_completions) as total_ad_completions,
        SUM(quota_earned) as total_quota_earned,
        AVG(ads_watched) as avg_ads_per_user
       FROM ad_rewards 
       WHERE reward_date = ?`
    )
    .bind(date)
    .first<{
      total_users: number;
      total_ad_views: number;
      total_ad_completions: number;
      total_quota_earned: number;
      avg_ads_per_user: number;
    }>();

  if (!result) {
    return {
      total_users: 0,
      total_ad_views: 0,
      total_ad_completions: 0,
      total_quota_earned: 0,
      avg_ads_per_user: 0,
      completion_rate: 0,
    };
  }

  const completionRate =
    result.total_ad_views > 0 ? (result.total_ad_completions / result.total_ad_views) * 100 : 0;

  return {
    ...result,
    completion_rate: Math.round(completionRate * 100) / 100,
  };
}

/**
 * Get ad statistics for a date range
 *
 * @param db - D1 database instance
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Aggregated statistics
 */
export async function getAdStatsInRange(
  db: D1Database,
  startDate: string,
  endDate: string
): Promise<{
  total_users: number;
  total_ad_views: number;
  total_ad_completions: number;
  total_quota_earned: number;
  avg_ads_per_user: number;
  completion_rate: number;
}> {
  const result = await db
    .prepare(
      `SELECT 
        COUNT(DISTINCT telegram_id) as total_users,
        SUM(ad_views) as total_ad_views,
        SUM(ad_completions) as total_ad_completions,
        SUM(quota_earned) as total_quota_earned,
        AVG(ads_watched) as avg_ads_per_user
       FROM ad_rewards 
       WHERE reward_date >= ? AND reward_date <= ?`
    )
    .bind(startDate, endDate)
    .first<{
      total_users: number;
      total_ad_views: number;
      total_ad_completions: number;
      total_quota_earned: number;
      avg_ads_per_user: number;
    }>();

  if (!result) {
    return {
      total_users: 0,
      total_ad_views: 0,
      total_ad_completions: 0,
      total_quota_earned: 0,
      avg_ads_per_user: 0,
      completion_rate: 0,
    };
  }

  const completionRate =
    result.total_ad_views > 0 ? (result.total_ad_completions / result.total_ad_views) * 100 : 0;

  return {
    ...result,
    completion_rate: Math.round(completionRate * 100) / 100,
  };
}

/**
 * Get top ad watchers (leaderboard)
 *
 * @param db - D1 database instance
 * @param date - Date in YYYY-MM-DD format
 * @param limit - Number of results
 * @returns Top users by ads watched
 */
export async function getTopAdWatchers(
  db: D1Database,
  date: string,
  limit: number = 10
): Promise<Array<{ telegram_id: string; ads_watched: number }>> {
  const result = await db
    .prepare(
      `SELECT telegram_id, ads_watched 
       FROM ad_rewards 
       WHERE reward_date = ? 
       ORDER BY ads_watched DESC 
       LIMIT ?`
    )
    .bind(date, limit)
    .all<{ telegram_id: string; ads_watched: number }>();

  return result.results || [];
}

/**
 * Get users who reached daily limit
 *
 * @param db - D1 database instance
 * @param date - Date in YYYY-MM-DD format
 * @returns Count of users who watched 20 ads
 */
export async function getUsersAtLimit(db: D1Database, date: string): Promise<number> {
  const result = await db
    .prepare(
      `SELECT COUNT(*) as count 
       FROM ad_rewards 
       WHERE reward_date = ? AND ads_watched >= 20`
    )
    .bind(date)
    .first<{ count: number }>();

  return result?.count || 0;
}

/**
 * Get ad reward history for user (last N days)
 *
 * @param db - D1 database instance
 * @param telegramId - User's Telegram ID
 * @param days - Number of days to look back
 * @returns Array of ad rewards
 */
export async function getAdRewardHistory(
  db: D1Database,
  telegramId: string,
  days: number = 7
): Promise<AdReward[]> {
  const result = await db
    .prepare(
      `SELECT * FROM ad_rewards 
       WHERE telegram_id = ? 
         AND reward_date >= date('now', '-' || ? || ' days')
       ORDER BY reward_date DESC`
    )
    .bind(telegramId, days)
    .all<AdReward>();

  return result.results || [];
}

// ============================================================================
// Cleanup Operations
// ============================================================================

/**
 * Delete old ad reward records (for data retention)
 *
 * @param db - D1 database instance
 * @param daysToKeep - Number of days to keep
 * @returns Number of records deleted
 */
export async function deleteOldAdRewards(db: D1Database, daysToKeep: number = 90): Promise<number> {
  const result = await db
    .prepare(
      `DELETE FROM ad_rewards 
       WHERE reward_date < date('now', '-' || ? || ' days')`
    )
    .bind(daysToKeep)
    .run();

  return result.meta?.changes || 0;
}
