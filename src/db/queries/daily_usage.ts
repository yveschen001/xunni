/**
 * Daily Usage Database Queries
 * Based on @doc/MODULE_DESIGN.md
 */

import type { DailyUsage } from '~/types';
import type { DatabaseClient } from '../client';

// ============================================================================
// Daily Usage Queries
// ============================================================================

/**
 * Get or create daily usage record
 */
export async function getOrCreateDailyUsage(
  db: DatabaseClient,
  telegramId: string,
  date: string
): Promise<DailyUsage> {
  // Try to get existing record
  let usage = await getDailyUsage(db, telegramId, date);

  if (!usage) {
    // Create new record
    usage = await createDailyUsage(db, telegramId, date);
  }

  return usage;
}

/**
 * Get daily usage record
 */
export async function getDailyUsage(
  db: DatabaseClient,
  telegramId: string,
  date: string
): Promise<DailyUsage | null> {
  const sql = `
    SELECT * FROM daily_usage
    WHERE telegram_id = ? AND date = ?
    LIMIT 1
  `;

  return db.queryOne<DailyUsage>(sql, [telegramId, date]);
}

/**
 * Create daily usage record
 */
export async function createDailyUsage(
  db: DatabaseClient,
  telegramId: string,
  date: string
): Promise<DailyUsage> {
  const sql = `
    INSERT INTO daily_usage (telegram_id, date)
    VALUES (?, ?)
    RETURNING *
  `;

  const result = await db.queryOne<DailyUsage>(sql, [telegramId, date]);

  if (!result) {
    throw new Error('Failed to create daily usage record');
  }

  return result;
}

/**
 * Increment throws count
 */
export async function incrementThrowsCount(
  db: DatabaseClient,
  telegramId: string,
  date: string
): Promise<void> {
  const sql = `
    INSERT INTO daily_usage (telegram_id, date, throws_count)
    VALUES (?, ?, 1)
    ON CONFLICT(telegram_id, date)
    DO UPDATE SET
      throws_count = throws_count + 1,
      updated_at = CURRENT_TIMESTAMP
  `;

  await db.execute(sql, [telegramId, date]);
}

/**
 * Increment catches count
 */
export async function incrementCatchesCount(
  db: DatabaseClient,
  telegramId: string,
  date: string
): Promise<void> {
  const sql = `
    INSERT INTO daily_usage (telegram_id, date, catches_count)
    VALUES (?, ?, 1)
    ON CONFLICT(telegram_id, date)
    DO UPDATE SET
      catches_count = catches_count + 1,
      updated_at = CURRENT_TIMESTAMP
  `;

  await db.execute(sql, [telegramId, date]);
}

/**
 * Increment messages sent count
 */
export async function incrementMessagesSent(
  db: DatabaseClient,
  telegramId: string,
  date: string
): Promise<void> {
  const sql = `
    INSERT INTO daily_usage (telegram_id, date, messages_sent)
    VALUES (?, ?, 1)
    ON CONFLICT(telegram_id, date)
    DO UPDATE SET
      messages_sent = messages_sent + 1,
      updated_at = CURRENT_TIMESTAMP
  `;

  await db.execute(sql, [telegramId, date]);
}

/**
 * Increment ads watched count
 */
export async function incrementAdsWatched(
  db: DatabaseClient,
  telegramId: string,
  date: string
): Promise<void> {
  const sql = `
    INSERT INTO daily_usage (telegram_id, date, ads_watched)
    VALUES (?, ?, 1)
    ON CONFLICT(telegram_id, date)
    DO UPDATE SET
      ads_watched = COALESCE(ads_watched, 0) + 1,
      updated_at = CURRENT_TIMESTAMP
  `;

  await db.execute(sql, [telegramId, date]);
}
