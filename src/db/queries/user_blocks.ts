/**
 * User Block Database Queries
 * Based on @doc/MODULE_DESIGN.md
 */

import type { UserBlock } from '~/types';
import type { DatabaseClient } from '../client';

// ============================================================================
// User Block Queries
// ============================================================================

/**
 * Create a user block
 */
export async function createUserBlock(
  db: DatabaseClient,
  blockerTelegramId: string,
  blockedTelegramId: string
): Promise<UserBlock> {
  const sql = `
    INSERT INTO user_blocks (blocker_telegram_id, blocked_telegram_id)
    VALUES (?, ?)
    RETURNING *
  `;

  const result = await db.queryOne<UserBlock>(sql, [blockerTelegramId, blockedTelegramId]);

  if (!result) {
    throw new Error('Failed to create user block');
  }

  return result;
}

/**
 * Check if user A has blocked user B
 */
export async function hasBlocked(
  db: DatabaseClient,
  blockerTelegramId: string,
  blockedTelegramId: string
): Promise<boolean> {
  const sql = `
    SELECT COUNT(*) as count
    FROM user_blocks
    WHERE blocker_telegram_id = ?
      AND blocked_telegram_id = ?
  `;

  const result = await db.queryOne<{ count: number }>(sql, [
    blockerTelegramId,
    blockedTelegramId,
  ]);

  return (result?.count || 0) > 0;
}

/**
 * Check if user A is blocked by user B
 */
export async function isBlockedBy(
  db: DatabaseClient,
  userTelegramId: string,
  blockerTelegramId: string
): Promise<boolean> {
  return hasBlocked(db, blockerTelegramId, userTelegramId);
}

/**
 * Get all users blocked by a user
 */
export async function getBlockedUsers(
  db: DatabaseClient,
  blockerTelegramId: string
): Promise<UserBlock[]> {
  const sql = `
    SELECT * FROM user_blocks
    WHERE blocker_telegram_id = ?
    ORDER BY created_at DESC
  `;

  return db.query<UserBlock>(sql, [blockerTelegramId]);
}

/**
 * Remove a user block
 */
export async function removeUserBlock(
  db: DatabaseClient,
  blockerTelegramId: string,
  blockedTelegramId: string
): Promise<void> {
  const sql = `
    DELETE FROM user_blocks
    WHERE blocker_telegram_id = ?
      AND blocked_telegram_id = ?
  `;

  await db.execute(sql, [blockerTelegramId, blockedTelegramId]);
}

/**
 * Get block count for a user (how many users they blocked)
 */
export async function getBlockCount(db: DatabaseClient, blockerTelegramId: string): Promise<number> {
  const sql = `
    SELECT COUNT(*) as count
    FROM user_blocks
    WHERE blocker_telegram_id = ?
  `;

  const result = await db.queryOne<{ count: number }>(sql, [blockerTelegramId]);
  return result?.count || 0;
}

