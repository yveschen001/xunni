/**
 * Report Database Queries
 * Based on @doc/MODULE_DESIGN.md
 */

import type { Report } from '~/types';
import type { DatabaseClient } from '../client';

// ============================================================================
// Report Queries
// ============================================================================

/**
 * Create a report
 */
export async function createReport(
  db: DatabaseClient,
  data: {
    reporter_telegram_id: string;
    reported_telegram_id: string;
    conversation_id?: number;
    reason: string;
    description?: string;
  }
): Promise<Report> {
  const sql = `
    INSERT INTO reports (
      reporter_telegram_id, reported_telegram_id,
      conversation_id, reason, description
    )
    VALUES (?, ?, ?, ?, ?)
    RETURNING *
  `;

  const result = await db.queryOne<Report>(sql, [
    data.reporter_telegram_id,
    data.reported_telegram_id,
    data.conversation_id || null,
    data.reason,
    data.description || null,
  ]);

  if (!result) {
    throw new Error('Failed to create report');
  }

  return result;
}

/**
 * Find report by ID
 */
export async function findReportById(db: DatabaseClient, id: number): Promise<Report | null> {
  const sql = `
    SELECT * FROM reports
    WHERE id = ?
    LIMIT 1
  `;

  return db.queryOne<Report>(sql, [id]);
}

/**
 * Get pending reports
 */
export async function getPendingReports(db: DatabaseClient, limit = 50): Promise<Report[]> {
  const sql = `
    SELECT * FROM reports
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT ?
  `;

  return db.query<Report>(sql, [limit]);
}

/**
 * Get reports against a user (within time period)
 */
export async function getReportsAgainstUser(
  db: DatabaseClient,
  reportedTelegramId: string,
  hoursAgo = 24
): Promise<Report[]> {
  const sql = `
    SELECT * FROM reports
    WHERE reported_telegram_id = ?
      AND created_at >= datetime('now', '-${hoursAgo} hours')
    ORDER BY created_at DESC
  `;

  return db.query<Report>(sql, [reportedTelegramId]);
}

/**
 * Get report count against a user (within time period)
 */
export async function getReportCountAgainstUser(
  db: DatabaseClient,
  reportedTelegramId: string,
  hoursAgo = 24
): Promise<number> {
  const sql = `
    SELECT COUNT(*) as count
    FROM reports
    WHERE reported_telegram_id = ?
      AND created_at >= datetime('now', '-${hoursAgo} hours')
  `;

  const result = await db.queryOne<{ count: number }>(sql, [reportedTelegramId]);
  return result?.count || 0;
}

/**
 * Check if user A has reported user B (within time period)
 */
export async function hasReported(
  db: DatabaseClient,
  reporterTelegramId: string,
  reportedTelegramId: string,
  hoursAgo = 24
): Promise<boolean> {
  const sql = `
    SELECT COUNT(*) as count
    FROM reports
    WHERE reporter_telegram_id = ?
      AND reported_telegram_id = ?
      AND created_at >= datetime('now', '-${hoursAgo} hours')
  `;

  const result = await db.queryOne<{ count: number }>(sql, [
    reporterTelegramId,
    reportedTelegramId,
  ]);

  return (result?.count || 0) > 0;
}

/**
 * Update report status
 */
export async function updateReportStatus(
  db: DatabaseClient,
  reportId: number,
  status: string,
  reviewedBy: string,
  actionTaken?: string
): Promise<void> {
  const sql = `
    UPDATE reports
    SET status = ?,
        reviewed_by = ?,
        reviewed_at = CURRENT_TIMESTAMP,
        action_taken = ?
    WHERE id = ?
  `;

  await db.execute(sql, [status, reviewedBy, actionTaken || null, reportId]);
}

/**
 * Get all reports (for admin)
 */
export async function getAllReports(
  db: DatabaseClient,
  status?: string,
  limit = 100,
  offset = 0
): Promise<Report[]> {
  let sql = 'SELECT * FROM reports';
  const params: unknown[] = [];

  if (status) {
    sql += ' WHERE status = ?';
    params.push(status);
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return db.query<Report>(sql, params);
}

/**
 * Get total report count
 */
export async function getTotalReportCount(db: DatabaseClient): Promise<number> {
  const sql = `
    SELECT COUNT(*) as count
    FROM reports
  `;

  const result = await db.queryOne<{ count: number }>(sql);
  return result?.count || 0;
}

