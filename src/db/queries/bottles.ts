/**
 * Bottle Database Queries
 * Based on @doc/MODULE_DESIGN.md
 */

import type { Bottle } from '~/types';
import type { DatabaseClient } from '../client';

// ============================================================================
// Bottle Queries
// ============================================================================

/**
 * Create a new bottle
 */
export async function createBottle(
  db: DatabaseClient,
  data: {
    owner_telegram_id: string;
    content: string;
    target_gender?: string;
    target_min_age?: number;
    target_max_age?: number;
    target_zodiac_filter?: string; // JSON
    target_mbti_filter?: string; // JSON
    target_region?: string;
    require_anti_fraud?: boolean;
    expires_at: string;
  }
): Promise<Bottle> {
  const sql = `
    INSERT INTO bottles (
      owner_telegram_id, content, target_gender,
      target_min_age, target_max_age,
      target_zodiac_filter, target_mbti_filter,
      target_region, require_anti_fraud, expires_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING *
  `;

  const result = await db.queryOne<Bottle>(sql, [
    data.owner_telegram_id,
    data.content,
    data.target_gender || null,
    data.target_min_age || null,
    data.target_max_age || null,
    data.target_zodiac_filter || null,
    data.target_mbti_filter || null,
    data.target_region || null,
    data.require_anti_fraud ? 1 : 0,
    data.expires_at,
  ]);

  if (!result) {
    throw new Error('Failed to create bottle');
  }

  return result;
}

/**
 * Find pending bottles for matching
 */
export async function findPendingBottles(db: DatabaseClient, limit = 100): Promise<Bottle[]> {
  const sql = `
    SELECT * FROM bottles
    WHERE status = 'pending'
      AND expires_at > CURRENT_TIMESTAMP
      AND deleted_at IS NULL
    ORDER BY created_at ASC
    LIMIT ?
  `;

  return db.query<Bottle>(sql, [limit]);
}

/**
 * Find bottle by ID
 */
export async function findBottleById(db: DatabaseClient, id: number): Promise<Bottle | null> {
  const sql = `
    SELECT * FROM bottles
    WHERE id = ?
    LIMIT 1
  `;

  return db.queryOne<Bottle>(sql, [id]);
}

/**
 * Update bottle status to matched
 */
export async function markBottleAsMatched(
  db: DatabaseClient,
  bottleId: number,
  matchedWithTelegramId: string
): Promise<void> {
  const sql = `
    UPDATE bottles
    SET status = 'matched',
        matched_with_telegram_id = ?,
        matched_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  await db.execute(sql, [matchedWithTelegramId, bottleId]);
}

/**
 * Mark expired bottles
 */
export async function markExpiredBottles(db: DatabaseClient): Promise<number> {
  const sql = `
    UPDATE bottles
    SET status = 'expired'
    WHERE status = 'pending'
      AND expires_at <= CURRENT_TIMESTAMP
  `;

  const result = await db.execute(sql);
  return result.meta.changes;
}

/**
 * Soft delete old bottles (90 days)
 */
export async function softDeleteOldBottles(db: DatabaseClient, daysAgo = 90): Promise<number> {
  const sql = `
    UPDATE bottles
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE created_at < datetime('now', '-${daysAgo} days')
      AND deleted_at IS NULL
  `;

  const result = await db.execute(sql);
  return result.meta.changes;
}

/**
 * Get total bottle count
 */
export async function getTotalBottleCount(db: DatabaseClient): Promise<number> {
  const sql = `
    SELECT COUNT(*) as count
    FROM bottles
    WHERE deleted_at IS NULL
  `;

  const result = await db.queryOne<{ count: number }>(sql);
  return result?.count || 0;
}

/**
 * Get new bottles count (yesterday)
 */
export async function getNewBottlesCount(db: DatabaseClient, date: string): Promise<number> {
  const sql = `
    SELECT COUNT(*) as count
    FROM bottles
    WHERE DATE(created_at) = ?
  `;

  const result = await db.queryOne<{ count: number }>(sql, [date]);
  return result?.count || 0;
}

