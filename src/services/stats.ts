/**
 * Statistics Service
 * Handles statistics calculation and daily reports
 */

import type { Env } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import type { DailyStats } from '~/domain/stats';
import { formatDailyStatsReport, getYesterdayDateString } from '~/domain/stats';
import { getDailyPaymentStats } from '~/db/queries/payments';
import { getDailyInviteStats } from '~/db/queries/invites';

/**
 * Extended Daily Stats for Report (includes revenue, invites, etc.)
 */
export interface ExtendedDailyStats extends DailyStats {
  revenue: number;
  inviteInitiated: number;
  inviteAccepted: number;
  inviteActivated: number;
  d1Retention: number;
  avgSessionDuration: number;
}

/**
 * Generate daily statistics
 */
export async function generateDailyStats(env: Env): Promise<DailyStats> {
  const db = createDatabaseClient(env.DB);
  const yesterday = getYesterdayDateString();

  try {
    // Calculate statistics
    const stats = await calculateDailyStats(db, yesterday);

    // Save to database (only basic stats for now)
    await saveDailyStats(db, stats);

    // Send to admins
    await sendStatsToAdmins(env, stats);

    console.log(`[generateDailyStats] Generated stats for ${yesterday}`);
    return stats;
  } catch (error) {
    console.error('[generateDailyStats] Error:', error);
    throw error;
  }
}

/**
 * Calculate detailed daily statistics (for analytics report)
 */
export async function calculateDetailedDailyStats(
  db: ReturnType<typeof createDatabaseClient>,
  date: string
): Promise<ExtendedDailyStats> {
  // 1. Basic Stats
  const basicStats = await calculateDailyStats(db, date);

  // 2. Payment Stats (Revenue)
  const paymentStats = await getDailyPaymentStats(db.d1, date);

  // 3. Invite Stats
  const inviteStats = await getDailyInviteStats(db, date);

  // 4. Retention (D1)
  // Logic: Users created 'date - 1 day' who were active on 'date'
  // Note: last_active_at is updated on every interaction.
  // To get exact daily retention, we should use daily_user_summary or analytics_events.
  // Using users table is an approximation (last_active_at >= date means they were active ON or AFTER date).
  // But if date is "yesterday", last_active_at >= yesterday is correct.
  // Wait, if date is yesterday (e.g. 25th), and we check today (26th), last_active_at might be 26th.
  // But user created on 24th (D1 for 25th) who is active on 26th MUST have been active on 26th.
  // But we want to know if they were active on 25th specifically.
  // If we only have `last_active_at`, we can't distinguish if they were active on 25th or 26th if date > 25th.
  // However, for "yesterday's report", we run this at 01:00 today. So last_active_at being yesterday is a good signal.
  // Query:
  //   Cohort: Users created on (date - 1 day)
  //   Retained: Cohort users where last_active_at >= date (approx)
  //   Wait, if they were active today (date+1), they are retained D1? Yes, effectively.
  //   But strictly D1 retention means "returned on Day 1".
  //   Let's use a simple query for now.
  const oneDayBefore = new Date(date);
  oneDayBefore.setDate(oneDayBefore.getDate() - 1);
  const oneDayBeforeStr = oneDayBefore.toISOString().split('T')[0];

  const cohortCountResult = await db.d1.prepare(`
    SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = ?
  `).bind(oneDayBeforeStr).first<{ count: number }>();
  
  const cohortCount = cohortCountResult?.count || 0;
  
  let d1Retention = 0;
  if (cohortCount > 0) {
    const retainedCountResult = await db.d1.prepare(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE DATE(created_at) = ? 
        AND DATE(last_active_at) >= ?
    `).bind(oneDayBeforeStr, date).first<{ count: number }>();
    
    const retainedCount = retainedCountResult?.count || 0;
    d1Retention = (retainedCount / cohortCount) * 100;
  }

  // 5. Session Duration (Placeholder for now)
  const avgSessionDuration = 0;

  return {
    ...basicStats,
    revenue: paymentStats.revenue,
    inviteInitiated: inviteStats.initiated,
    inviteAccepted: inviteStats.accepted,
    inviteActivated: inviteStats.activated,
    d1Retention,
    avgSessionDuration,
  };
}

/**
 * Calculate daily statistics
 */
export async function calculateDailyStats(
  db: ReturnType<typeof createDatabaseClient>,
  date: string
): Promise<DailyStats> {
  const nextDate = getNextDate(date);

  // Total bottles
  const totalBottlesResult = await db.d1
    .prepare(`SELECT COUNT(*) as count FROM bottles WHERE created_at < ?`)
    .bind(nextDate)
    .first<{ count: number }>();
  const totalBottles = totalBottlesResult?.count || 0;

  // New bottles (created on this date)
  const newBottlesResult = await db.d1
    .prepare(
      `SELECT COUNT(*) as count FROM bottles 
       WHERE date(created_at) = ?`
    )
    .bind(date)
    .first<{ count: number }>();
  const newBottles = newBottlesResult?.count || 0;

  // Caught bottles (matched on this date)
  const caughtBottlesResult = await db.d1
    .prepare(
      `SELECT COUNT(*) as count FROM bottles 
       WHERE status = 'matched' AND date(matched_at) = ?`
    )
    .bind(date)
    .first<{ count: number }>();
  const caughtBottles = caughtBottlesResult?.count || 0;

  // Total conversations
  const totalConversationsResult = await db.d1
    .prepare(`SELECT COUNT(*) as count FROM conversations WHERE created_at < ?`)
    .bind(nextDate)
    .first<{ count: number }>();
  const totalConversations = totalConversationsResult?.count || 0;

  // New conversations
  const newConversationsResult = await db.d1
    .prepare(
      `SELECT COUNT(*) as count FROM conversations 
       WHERE date(created_at) = ?`
    )
    .bind(date)
    .first<{ count: number }>();
  const newConversations = newConversationsResult?.count || 0;

  // Total messages
  const totalMessagesResult = await db.d1
    .prepare(`SELECT COUNT(*) as count FROM conversation_messages WHERE created_at < ?`)
    .bind(nextDate)
    .first<{ count: number }>();
  const totalMessages = totalMessagesResult?.count || 0;

  // New messages
  const newMessagesResult = await db.d1
    .prepare(
      `SELECT COUNT(*) as count FROM conversation_messages 
       WHERE date(created_at) = ?`
    )
    .bind(date)
    .first<{ count: number }>();
  const newMessages = newMessagesResult?.count || 0;

  // Total users
  const totalUsersResult = await db.d1
    .prepare(`SELECT COUNT(*) as count FROM users WHERE created_at < ?`)
    .bind(nextDate)
    .first<{ count: number }>();
  const totalUsers = totalUsersResult?.count || 0;

  // New users
  const newUsersResult = await db.d1
    .prepare(
      `SELECT COUNT(*) as count FROM users 
       WHERE date(created_at) = ?`
    )
    .bind(date)
    .first<{ count: number }>();
  const newUsers = newUsersResult?.count || 0;

  // Active users (users who sent messages on this date)
  const activeUsersResult = await db.d1
    .prepare(
      `SELECT COUNT(DISTINCT sender_telegram_id) as count 
       FROM conversation_messages 
       WHERE date(created_at) = ?`
    )
    .bind(date)
    .first<{ count: number }>();
  const activeUsers = activeUsersResult?.count || 0;

  // Total VIP
  const totalVipResult = await db.d1
    .prepare(
      `SELECT COUNT(*) as count FROM users 
       WHERE is_vip = 1 AND (vip_expire_at IS NULL OR vip_expire_at > ?)`
    )
    .bind(nextDate)
    .first<{ count: number }>();
  const totalVip = totalVipResult?.count || 0;

  // New VIP (became VIP on this date)
  const newVipResult = await db.d1
    .prepare(
      `SELECT COUNT(*) as count FROM payments 
       WHERE status = 'completed' AND date(created_at) = ?`
    )
    .bind(date)
    .first<{ count: number }>();
  const newVip = newVipResult?.count || 0;

  return {
    statDate: date,
    totalBottles,
    newBottles,
    caughtBottles,
    totalConversations,
    newConversations,
    totalMessages,
    newMessages,
    totalUsers,
    newUsers,
    activeUsers,
    totalVip,
    newVip,
  };
}

/**
 * Save daily stats to database
 */
async function saveDailyStats(
  db: ReturnType<typeof createDatabaseClient>,
  stats: DailyStats
): Promise<void> {
  await db.d1
    .prepare(
      `INSERT OR REPLACE INTO daily_stats (
        stat_date, total_bottles, new_bottles, caught_bottles,
        total_conversations, new_conversations, total_messages, new_messages,
        total_users, new_users, active_users, total_vip, new_vip
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      stats.statDate,
      stats.totalBottles,
      stats.newBottles,
      stats.caughtBottles,
      stats.totalConversations,
      stats.newConversations,
      stats.totalMessages,
      stats.newMessages,
      stats.totalUsers,
      stats.newUsers,
      stats.activeUsers,
      stats.totalVip,
      stats.newVip
    )
    .run();
}

/**
 * Send stats to all admins
 */
async function sendStatsToAdmins(env: Env, stats: DailyStats): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);

  // Get previous day stats for comparison
  const previousDate = getPreviousDate(stats.statDate);
  const previousStats = await getDailyStats(db, previousDate);

  // Format report (use zh-TW for admin reports)
  const { createI18n } = await import('~/i18n');
  const i18n = createI18n('zh-TW');
  const report = formatDailyStatsReport(stats, previousStats || undefined, i18n);

  // Get admin IDs
  const { getAdminIds } = await import('../telegram/handlers/admin_ban');
  const adminIds = getAdminIds(env);

  // Send to each admin
  for (const adminId of adminIds) {
    try {
      await telegram.sendMessage(parseInt(adminId), report);
      console.log(`[sendStatsToAdmins] Sent to admin ${adminId}`);
    } catch (error) {
      console.error(`[sendStatsToAdmins] Failed to send to admin ${adminId}:`, error);
    }
  }
}

/**
 * Get daily stats from database
 */
export async function getDailyStats(
  db: ReturnType<typeof createDatabaseClient>,
  date: string
): Promise<DailyStats | null> {
  const result = await db.d1
    .prepare(`SELECT * FROM daily_stats WHERE stat_date = ?`)
    .bind(date)
    .first<DailyStats>();

  return result || null;
}

/**
 * Get next date (YYYY-MM-DD)
 */
function getNextDate(date: string): string {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

/**
 * Get previous date (YYYY-MM-DD)
 */
function getPreviousDate(date: string): string {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}
