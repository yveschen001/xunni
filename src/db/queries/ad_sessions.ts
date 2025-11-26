import type { D1Database } from '@cloudflare/workers-types';

export type AdSessionStatus = 'pending' | 'playing' | 'completed' | 'failed';

export interface AdSession {
  id: number;
  telegram_id: string;
  provider_name: string;
  token: string;
  status: AdSessionStatus;
  started_at?: string | null;
  completed_at?: string | null;
  duration_ms?: number | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Create a new ad session when user clicks "watch ad"
 */
export async function createAdSession(
  db: D1Database,
  telegramId: string,
  providerName: string,
  token: string
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO ad_sessions (
        telegram_id,
        provider_name,
        token,
        status
      ) VALUES (?, ?, ?, 'pending')`
    )
    .bind(telegramId, providerName, token)
    .run();
}

/**
 * Get active (pending/playing) session for a user
 */
export async function getActiveSessionByUser(
  db: D1Database,
  telegramId: string
): Promise<AdSession | null> {
  const result = await db
    .prepare(
      `SELECT * FROM ad_sessions
       WHERE telegram_id = ?
         AND status IN ('pending', 'playing')
         AND created_at > datetime('now', '-15 minutes')
       ORDER BY created_at DESC
       LIMIT 1`
    )
    .bind(telegramId)
    .first<AdSession>();

  return result || null;
}

/**
 * Get session by token
 */
export async function getSessionByToken(db: D1Database, token: string): Promise<AdSession | null> {
  const result = await db
    .prepare(`SELECT * FROM ad_sessions WHERE token = ? LIMIT 1`)
    .bind(token)
    .first<AdSession>();

  return result || null;
}

/**
 * Mark session as started/playing
 */
export async function markSessionStarted(db: D1Database, sessionId: number): Promise<void> {
  await db
    .prepare(
      `UPDATE ad_sessions
       SET status = 'playing',
           started_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = ?`
    )
    .bind(sessionId)
    .run();
}

/**
 * Mark session as completed
 */
export async function markSessionCompleted(
  db: D1Database,
  sessionId: number,
  durationMs: number | null
): Promise<void> {
  await db
    .prepare(
      `UPDATE ad_sessions
       SET status = 'completed',
           completed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
           duration_ms = ?,
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = ?`
    )
    .bind(durationMs, sessionId)
    .run();
}

/**
 * Mark session as failed
 */
export async function markSessionFailed(
  db: D1Database,
  sessionId: number,
  errorMessage: string
): Promise<void> {
  await db
    .prepare(
      `UPDATE ad_sessions
       SET status = 'failed',
           error_message = ?,
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = ?`
    )
    .bind(errorMessage, sessionId)
    .run();
}
