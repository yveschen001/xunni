/**
 * Appeal Database Queries
 * Based on @doc/MODULE_DESIGN.md
 */

import type { Appeal } from '~/types';
import type { DatabaseClient } from '../client';

// ============================================================================
// Appeal Queries
// ============================================================================

/**
 * Create an appeal
 */
export async function createAppeal(
  db: DatabaseClient,
  data: {
    telegram_id: string;
    reason: string;
    description?: string;
  }
): Promise<Appeal> {
  const sql = `
    INSERT INTO appeals (telegram_id, reason, description)
    VALUES (?, ?, ?)
    RETURNING *
  `;

  const result = await db.queryOne<Appeal>(sql, [
    data.telegram_id,
    data.reason,
    data.description || null,
  ]);

  if (!result) {
    throw new Error('Failed to create appeal');
  }

  return result;
}

/**
 * Find appeal by ID
 */
export async function findAppealById(db: DatabaseClient, id: number): Promise<Appeal | null> {
  const sql = `
    SELECT * FROM appeals
    WHERE id = ?
    LIMIT 1
  `;

  return db.queryOne<Appeal>(sql, [id]);
}

/**
 * Get pending appeals
 */
export async function getPendingAppeals(db: DatabaseClient, limit = 50): Promise<Appeal[]> {
  const sql = `
    SELECT * FROM appeals
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT ?
  `;

  return db.query<Appeal>(sql, [limit]);
}

/**
 * Get user's appeals
 */
export async function getUserAppeals(db: DatabaseClient, telegramId: string): Promise<Appeal[]> {
  const sql = `
    SELECT * FROM appeals
    WHERE telegram_id = ?
    ORDER BY created_at DESC
  `;

  return db.query<Appeal>(sql, [telegramId]);
}

/**
 * Check if user has pending appeal
 */
export async function hasPendingAppeal(db: DatabaseClient, telegramId: string): Promise<boolean> {
  const sql = `
    SELECT COUNT(*) as count
    FROM appeals
    WHERE telegram_id = ?
      AND status = 'pending'
  `;

  const result = await db.queryOne<{ count: number }>(sql, [telegramId]);
  return (result?.count || 0) > 0;
}

/**
 * Update appeal status
 */
export async function updateAppealStatus(
  db: DatabaseClient,
  appealId: number,
  status: string,
  reviewedBy: string,
  adminNotes?: string
): Promise<void> {
  const sql = `
    UPDATE appeals
    SET status = ?,
        reviewed_by = ?,
        reviewed_at = CURRENT_TIMESTAMP,
        admin_notes = ?
    WHERE id = ?
  `;

  await db.execute(sql, [status, reviewedBy, adminNotes || null, appealId]);
}

/**
 * Get all appeals (for admin)
 */
export async function getAllAppeals(
  db: DatabaseClient,
  status?: string,
  limit = 100,
  offset = 0
): Promise<Appeal[]> {
  let sql = 'SELECT * FROM appeals';
  const params: unknown[] = [];

  if (status) {
    sql += ' WHERE status = ?';
    params.push(status);
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return db.query<Appeal>(sql, params);
}

/**
 * Get total appeal count
 */
export async function getTotalAppealCount(db: DatabaseClient): Promise<number> {
  const sql = `
    SELECT COUNT(*) as count
    FROM appeals
  `;

  const result = await db.queryOne<{ count: number }>(sql);
  return result?.count || 0;
}
