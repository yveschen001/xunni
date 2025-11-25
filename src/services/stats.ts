/**
 * Statistics Service
 * Handles statistics calculation and daily reports
 */

import type { Env } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import type { DailyStats } from '~/domain/stats';
import { formatDailyStatsReport, getYesterdayDateString } from '~/domain/stats';

/**
 * Generate daily statistics
 */
export async function generateDailyStats(env: Env): Promise<DailyStats> {
  const db = createDatabaseClient(env.DB);
  const yesterday = getYesterdayDateString();

  try {
    // Calculate statistics
    const stats = await calculateDailyStats(db, yesterday);

    // Save to database
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
 * Calculate daily statistics
 */
async function calculateDailyStats(
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
