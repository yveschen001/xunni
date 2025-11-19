/**
 * User Activity Tracking Service
 * Tracks user activity for smart broadcasting
 */

// import type { Env } from '~/types';
import { createDatabaseClient } from '~/db/client';

/**
 * Update user's last active time and set status to active
 * Call this whenever a user interacts with the bot
 */
export async function updateUserActivity(
  db: ReturnType<typeof createDatabaseClient>,
  telegramId: string
): Promise<void> {
  try {
    await db.d1
      .prepare(
        `UPDATE users 
         SET last_active_at = CURRENT_TIMESTAMP,
             bot_status = 'active',
             bot_status_updated_at = CURRENT_TIMESTAMP
         WHERE telegram_id = ?`
      )
      .bind(telegramId)
      .run();
  } catch (error) {
    console.error('[updateUserActivity] Error:', error);
    // Don't throw - activity tracking is non-critical
  }
}

/**
 * Mark user as having bot interaction issues
 */
export async function markUserBotStatus(
  db: ReturnType<typeof createDatabaseClient>,
  telegramId: string,
  status: 'blocked' | 'deleted' | 'deactivated' | 'invalid'
): Promise<void> {
  try {
    await db.d1
      .prepare(
        `UPDATE users
         SET bot_status = ?,
             bot_status_updated_at = CURRENT_TIMESTAMP,
             failed_delivery_count = failed_delivery_count + 1
         WHERE telegram_id = ?`
      )
      .bind(status, telegramId)
      .run();

    console.log(`[markUserBotStatus] User ${telegramId} marked as ${status}`);
  } catch (error) {
    console.error('[markUserBotStatus] Error:', error);
  }
}

/**
 * Reset user's bot status to active (e.g., when they interact again)
 */
export async function resetUserBotStatus(
  db: ReturnType<typeof createDatabaseClient>,
  telegramId: string
): Promise<void> {
  try {
    await db.d1
      .prepare(
        `UPDATE users
         SET bot_status = 'active',
             bot_status_updated_at = CURRENT_TIMESTAMP,
             failed_delivery_count = 0
         WHERE telegram_id = ?
           AND bot_status != 'active'`
      )
      .bind(telegramId)
      .run();

    console.log(`[resetUserBotStatus] User ${telegramId} status reset to active`);
  } catch (error) {
    console.error('[resetUserBotStatus] Error:', error);
  }
}

/**
 * Get user activity statistics
 */
export async function getUserActivityStats(db: ReturnType<typeof createDatabaseClient>): Promise<{
  total: number;
  active: number;
  blocked: number;
  deleted: number;
  inactive: number;
}> {
  try {
    // Total users
    const totalResult = await db.d1
      .prepare('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL')
      .first<{ count: number }>();

    // Active users (active status)
    const activeResult = await db.d1
      .prepare(
        `
        SELECT COUNT(*) as count 
        FROM users 
        WHERE deleted_at IS NULL 
          AND bot_status = 'active'
      `
      )
      .first<{ count: number }>();

    // Blocked users
    const blockedResult = await db.d1
      .prepare(
        `
        SELECT COUNT(*) as count 
        FROM users 
        WHERE deleted_at IS NULL 
          AND bot_status = 'blocked'
      `
      )
      .first<{ count: number }>();

    // Deleted/deactivated users
    const deletedResult = await db.d1
      .prepare(
        `
        SELECT COUNT(*) as count 
        FROM users 
        WHERE deleted_at IS NULL 
          AND bot_status IN ('deleted', 'deactivated', 'invalid')
      `
      )
      .first<{ count: number }>();

    // Inactive users (no activity in 30 days)
    const inactiveResult = await db.d1
      .prepare(
        `
        SELECT COUNT(*) as count 
        FROM users 
        WHERE deleted_at IS NULL 
          AND bot_status = 'active'
          AND last_active_at < datetime('now', '-30 days')
      `
      )
      .first<{ count: number }>();

    return {
      total: totalResult?.count || 0,
      active: activeResult?.count || 0,
      blocked: blockedResult?.count || 0,
      deleted: deletedResult?.count || 0,
      inactive: inactiveResult?.count || 0,
    };
  } catch (error) {
    console.error('[getUserActivityStats] Error:', error);
    return {
      total: 0,
      active: 0,
      blocked: 0,
      deleted: 0,
      inactive: 0,
    };
  }
}
