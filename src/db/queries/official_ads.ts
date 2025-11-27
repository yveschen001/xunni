/**
 * Official Ads Database Queries
 *
 * Purpose:
 *   Database operations for official_ads and official_ad_views tables
 *   Ad management and user view tracking
 */

import type { D1Database } from '@cloudflare/workers-types';
import type { OfficialAd, OfficialAdView, OfficialAdType } from '~/domain/official_ad';

// ============================================================================
// Read Operations - Ads
// ============================================================================

/**
 * Get all official ads
 *
 * @param db - D1 database instance
 * @param enabledOnly - Only return enabled ads
 * @returns Array of official ads
 */
export async function getAllOfficialAds(
  db: D1Database,
  enabledOnly: boolean = false
): Promise<OfficialAd[]> {
  const query = enabledOnly
    ? `SELECT * FROM official_ads WHERE is_enabled = 1 AND deleted_at IS NULL ORDER BY created_at ASC`
    : `SELECT * FROM official_ads WHERE deleted_at IS NULL ORDER BY created_at ASC`;

  const result = await db.prepare(query).all<OfficialAd>();

  return result.results || [];
}

/**
 * Get official ad by ID
 *
 * @param db - D1 database instance
 * @param adId - Ad ID
 * @returns Official ad or null
 */
export async function getOfficialAdById(db: D1Database, adId: number): Promise<OfficialAd | null> {
  const result = await db
    .prepare(`SELECT * FROM official_ads WHERE id = ?`)
    .bind(adId)
    .first<OfficialAd>();

  return result || null;
}

/**
 * Get active official ads (within date range and not at max views)
 *
 * @param db - D1 database instance
 * @returns Array of active ads
 */
export async function getActiveOfficialAds(db: D1Database): Promise<OfficialAd[]> {
  const today = new Date().toISOString().split('T')[0];

  const result = await db
    .prepare(
      `SELECT * FROM official_ads 
       WHERE is_enabled = 1
         AND deleted_at IS NULL
         AND (start_date IS NULL OR start_date <= ?)
         AND (end_date IS NULL OR end_date >= ?)
         AND (max_views IS NULL OR current_views < max_views)
       ORDER BY created_at ASC`
    )
    .bind(today, today)
    .all<OfficialAd>();

  return result.results || [];
}

// ============================================================================
// Write Operations - Ads
// ============================================================================

/**
 * Create official ad
 *
 * @param db - D1 database instance
 * @param ad - Ad data
 * @returns Created ad ID
 */
export async function createOfficialAd(
  db: D1Database,
  ad: {
    ad_type: OfficialAdType;
    title: string;
    content: string;
    url?: string;
    target_entity_id?: string;
    reward_quota?: number;
    requires_verification?: boolean;
    is_enabled?: boolean;
    start_date?: string;
    end_date?: string;
    max_views?: number;
    title_i18n?: string;
    content_i18n?: string;
  }
): Promise<number> {
  const result = await db
    .prepare(
      `INSERT INTO official_ads (
        ad_type, title, content, url, target_entity_id,
        reward_quota, requires_verification, is_enabled,
        start_date, end_date, max_views,
        title_i18n, content_i18n
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      ad.ad_type,
      ad.title,
      ad.content,
      ad.url || null,
      ad.target_entity_id || null,
      ad.reward_quota ?? 1,
      ad.requires_verification ? 1 : 0,
      ad.is_enabled === false ? 0 : 1,
      ad.start_date || null,
      ad.end_date || null,
      ad.max_views || null,
      ad.title_i18n || null,
      ad.content_i18n || null
    )
    .run();

  return result.meta?.last_row_id || 0;
}

/**
 * Update official ad
 *
 * @param db - D1 database instance
 * @param adId - Ad ID
 * @param updates - Fields to update
 * @returns Success boolean
 */
export async function updateOfficialAd(
  db: D1Database,
  adId: number,
  updates: Partial<OfficialAd>
): Promise<boolean> {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.content !== undefined) {
    fields.push('content = ?');
    values.push(updates.content);
  }
  if (updates.url !== undefined) {
    fields.push('url = ?');
    values.push(updates.url);
  }
  if (updates.target_entity_id !== undefined) {
    fields.push('target_entity_id = ?');
    values.push(updates.target_entity_id);
  }
  if (updates.reward_quota !== undefined) {
    fields.push('reward_quota = ?');
    values.push(updates.reward_quota);
  }
  if (updates.requires_verification !== undefined) {
    fields.push('requires_verification = ?');
    values.push(updates.requires_verification ? 1 : 0);
  }
  if (updates.is_enabled !== undefined) {
    fields.push('is_enabled = ?');
    values.push(updates.is_enabled ? 1 : 0);
  }
  if (updates.start_date !== undefined) {
    fields.push('start_date = ?');
    values.push(updates.start_date);
  }
  if (updates.end_date !== undefined) {
    fields.push('end_date = ?');
    values.push(updates.end_date);
  }
  if (updates.max_views !== undefined) {
    fields.push('max_views = ?');
    values.push(updates.max_views);
  }
  if (updates.title_i18n !== undefined) {
    fields.push('title_i18n = ?');
    values.push(updates.title_i18n);
  }
  if (updates.content_i18n !== undefined) {
    fields.push('content_i18n = ?');
    values.push(updates.content_i18n);
  }
  if (updates.deleted_at !== undefined) {
    fields.push('deleted_at = ?');
    values.push(updates.deleted_at);
  }

  if (fields.length === 0) {
    return false;
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(adId);

  const result = await db
    .prepare(
      `UPDATE official_ads 
       SET ${fields.join(', ')} 
       WHERE id = ?`
    )
    .bind(...values)
    .run();

  return (result.meta?.changes || 0) > 0;
}

/**
 * Increment ad view count
 *
 * @param db - D1 database instance
 * @param adId - Ad ID
 * @returns Success boolean
 */
export async function incrementAdViewCount(db: D1Database, adId: number): Promise<boolean> {
  const result = await db
    .prepare(
      `UPDATE official_ads 
       SET current_views = current_views + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(adId)
    .run();

  return (result.meta?.changes || 0) > 0;
}

// ============================================================================
// Read Operations - Ad Views
// ============================================================================

/**
 * Get ad view record
 *
 * @param db - D1 database instance
 * @param telegramId - User's Telegram ID
 * @param adId - Ad ID
 * @returns Ad view record or null
 */
export async function getAdView(
  db: D1Database,
  telegramId: string,
  adId: number
): Promise<OfficialAdView | null> {
  const result = await db
    .prepare(
      `SELECT * FROM official_ad_views 
       WHERE telegram_id = ? AND ad_id = ?`
    )
    .bind(telegramId, adId)
    .first<OfficialAdView>();

  return result || null;
}

/**
 * Get all ad views for user
 *
 * @param db - D1 database instance
 * @param telegramId - User's Telegram ID
 * @returns Array of ad view records
 */
export async function getUserAdViews(
  db: D1Database,
  telegramId: string
): Promise<OfficialAdView[]> {
  const result = await db
    .prepare(
      `SELECT * FROM official_ad_views 
       WHERE telegram_id = ? 
       ORDER BY viewed_at DESC`
    )
    .bind(telegramId)
    .all<OfficialAdView>();

  return result.results || [];
}

/**
 * Get viewed ad IDs for user
 *
 * @param db - D1 database instance
 * @param telegramId - User's Telegram ID
 * @returns Array of ad IDs
 */
export async function getViewedAdIds(db: D1Database, telegramId: string): Promise<number[]> {
  const result = await db
    .prepare(
      `SELECT ad_id FROM official_ad_views 
       WHERE telegram_id = ?`
    )
    .bind(telegramId)
    .all<{ ad_id: number }>();

  return (result.results || []).map((r) => r.ad_id);
}

/**
 * Get all views for an ad
 *
 * @param db - D1 database instance
 * @param adId - Ad ID
 * @returns Array of ad view records
 */
export async function getAdViews(db: D1Database, adId: number): Promise<OfficialAdView[]> {
  const result = await db
    .prepare(
      `SELECT * FROM official_ad_views 
       WHERE ad_id = ? 
       ORDER BY viewed_at DESC`
    )
    .bind(adId)
    .all<OfficialAdView>();

  return result.results || [];
}

// ============================================================================
// Write Operations - Ad Views
// ============================================================================

/**
 * Create ad view record
 *
 * @param db - D1 database instance
 * @param telegramId - User's Telegram ID
 * @param adId - Ad ID
 * @returns Created view ID
 */
export async function createAdView(
  db: D1Database,
  telegramId: string,
  adId: number
): Promise<number> {
  const result = await db
    .prepare(
      `INSERT INTO official_ad_views (telegram_id, ad_id)
       VALUES (?, ?)`
    )
    .bind(telegramId, adId)
    .run();

  return result.meta?.last_row_id || 0;
}

/**
 * Update ad view (mark as clicked)
 *
 * @param db - D1 database instance
 * @param telegramId - User's Telegram ID
 * @param adId - Ad ID
 * @returns Success boolean
 */
export async function markAdClicked(
  db: D1Database,
  telegramId: string,
  adId: number
): Promise<boolean> {
  const result = await db
    .prepare(
      `UPDATE official_ad_views 
       SET clicked = 1, clicked_at = CURRENT_TIMESTAMP
       WHERE telegram_id = ? AND ad_id = ?`
    )
    .bind(telegramId, adId)
    .run();

  return (result.meta?.changes || 0) > 0;
}

/**
 * Update ad view (mark as verified)
 *
 * @param db - D1 database instance
 * @param telegramId - User's Telegram ID
 * @param adId - Ad ID
 * @returns Success boolean
 */
export async function markAdVerified(
  db: D1Database,
  telegramId: string,
  adId: number
): Promise<boolean> {
  const result = await db
    .prepare(
      `UPDATE official_ad_views 
       SET verified = 1, verified_at = CURRENT_TIMESTAMP
       WHERE telegram_id = ? AND ad_id = ?`
    )
    .bind(telegramId, adId)
    .run();

  return (result.meta?.changes || 0) > 0;
}

/**
 * Update ad view (mark reward as granted)
 *
 * @param db - D1 database instance
 * @param telegramId - User's Telegram ID
 * @param adId - Ad ID
 * @returns Success boolean
 */
export async function markRewardGranted(
  db: D1Database,
  telegramId: string,
  adId: number
): Promise<boolean> {
  const result = await db
    .prepare(
      `UPDATE official_ad_views 
       SET reward_granted = 1, reward_granted_at = CURRENT_TIMESTAMP
       WHERE telegram_id = ? AND ad_id = ?`
    )
    .bind(telegramId, adId)
    .run();

  return (result.meta?.changes || 0) > 0;
}

// ============================================================================
// Statistics Queries
// ============================================================================

/**
 * Get ad statistics
 *
 * @param db - D1 database instance
 * @param adId - Ad ID
 * @returns Ad statistics
 */
export async function getAdStatistics(
  db: D1Database,
  adId: number
): Promise<{
  total_views: number;
  total_clicks: number;
  total_verified: number;
  total_rewards: number;
  ctr: number;
  verification_rate: number;
  reward_rate: number;
}> {
  const result = await db
    .prepare(
      `SELECT 
        COUNT(*) as total_views,
        SUM(CASE WHEN clicked = 1 THEN 1 ELSE 0 END) as total_clicks,
        SUM(CASE WHEN verified = 1 THEN 1 ELSE 0 END) as total_verified,
        SUM(CASE WHEN reward_granted = 1 THEN 1 ELSE 0 END) as total_rewards
       FROM official_ad_views 
       WHERE ad_id = ?`
    )
    .bind(adId)
    .first<{
      total_views: number;
      total_clicks: number;
      total_verified: number;
      total_rewards: number;
    }>();

  if (!result) {
    return {
      total_views: 0,
      total_clicks: 0,
      total_verified: 0,
      total_rewards: 0,
      ctr: 0,
      verification_rate: 0,
      reward_rate: 0,
    };
  }

  const ctr = result.total_views > 0 ? (result.total_clicks / result.total_views) * 100 : 0;

  const verificationRate =
    result.total_clicks > 0 ? (result.total_verified / result.total_clicks) * 100 : 0;

  const rewardRate = result.total_views > 0 ? (result.total_rewards / result.total_views) * 100 : 0;

  return {
    ...result,
    ctr: Math.round(ctr * 100) / 100,
    verification_rate: Math.round(verificationRate * 100) / 100,
    reward_rate: Math.round(rewardRate * 100) / 100,
  };
}

/**
 * Get total quota earned from official ads
 *
 * @param db - D1 database instance
 * @param telegramId - User's Telegram ID
 * @returns Total quota earned
 */
export async function getTotalOfficialAdQuota(db: D1Database, telegramId: string): Promise<number> {
  const result = await db
    .prepare(
      `SELECT COUNT(*) as count 
       FROM official_ad_views 
       WHERE telegram_id = ? AND reward_granted = 1`
    )
    .bind(telegramId)
    .first<{ count: number }>();

  // Each ad grants at least 1 quota (actual amount in official_ads.reward_quota)
  // For simplicity, we count the number of rewards granted
  // To get exact quota, we'd need to join with official_ads table
  return result?.count || 0;
}

/**
 * Get daily official ad statistics
 *
 * @param db - D1 database instance
 * @param date - Date in YYYY-MM-DD format
 * @returns Daily statistics
 */
export async function getDailyOfficialAdStats(
  db: D1Database,
  date: string
): Promise<{
  total_impressions: number;
  total_clicks: number;
  total_rewards: number;
  unique_users: number;
  ctr: number;
}> {
  const result = await db
    .prepare(
      `SELECT 
        COUNT(*) as total_impressions,
        SUM(CASE WHEN clicked = 1 THEN 1 ELSE 0 END) as total_clicks,
        SUM(CASE WHEN reward_granted = 1 THEN 1 ELSE 0 END) as total_rewards,
        COUNT(DISTINCT telegram_id) as unique_users
       FROM official_ad_views 
       WHERE DATE(viewed_at) = ?`
    )
    .bind(date)
    .first<{
      total_impressions: number;
      total_clicks: number;
      total_rewards: number;
      unique_users: number;
    }>();

  if (!result) {
    return {
      total_impressions: 0,
      total_clicks: 0,
      total_rewards: 0,
      unique_users: 0,
      ctr: 0,
    };
  }

  const ctr =
    result.total_impressions > 0 ? (result.total_clicks / result.total_impressions) * 100 : 0;

  return {
    ...result,
    ctr: Math.round(ctr * 100) / 100,
  };
}

/**
 * Update official ad status (enable/disable)
 */
export async function updateOfficialAdStatus(
  db: D1Database,
  adId: number,
  isEnabled: boolean
): Promise<void> {
  await db
    .prepare(`UPDATE official_ads SET is_enabled = ? WHERE id = ?`)
    .bind(isEnabled ? 1 : 0, adId)
    .run();
}
