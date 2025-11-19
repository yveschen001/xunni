/**
 * Session Database Queries
 */

import type { DatabaseClient } from '../client';
import type { UserSession, SessionType, SessionData } from '~/domain/session';
import { calculateSessionExpiration, serializeSessionData } from '~/domain/session';

/**
 * Create or update user session
 */
export async function upsertSession(
  db: DatabaseClient,
  telegramId: string,
  sessionType: SessionType,
  sessionData?: SessionData
): Promise<void> {
  const expiresAt = calculateSessionExpiration(sessionType);
  const now = new Date().toISOString();

  // Delete existing sessions of the same type
  await db.d1
    .prepare(
      `
    DELETE FROM user_sessions
    WHERE telegram_id = ? AND session_type = ?
  `
    )
    .bind(telegramId, sessionType)
    .run();

  // Insert new session
  await db.d1
    .prepare(
      `
    INSERT INTO user_sessions (
      telegram_id,
      session_type,
      session_data,
      last_activity_at,
      expires_at,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `
    )
    .bind(
      telegramId,
      sessionType,
      sessionData ? serializeSessionData(sessionData) : null,
      now,
      expiresAt.toISOString(),
      now
    )
    .run();
}

/**
 * Get active session for user
 */
export async function getActiveSession(
  db: DatabaseClient,
  telegramId: string,
  sessionType: SessionType
): Promise<UserSession | null> {
  const result = await db.d1
    .prepare(
      `
    SELECT * FROM user_sessions
    WHERE telegram_id = ?
      AND session_type = ?
      AND datetime(expires_at) > datetime('now')
    ORDER BY created_at DESC
    LIMIT 1
  `
    )
    .bind(telegramId, sessionType)
    .first();

  return result as UserSession | null;
}

/**
 * Update session activity (extend timeout)
 */
export async function updateSessionActivity(
  db: DatabaseClient,
  sessionId: number,
  sessionType: SessionType
): Promise<void> {
  const expiresAt = calculateSessionExpiration(sessionType);
  const now = new Date().toISOString();

  await db.d1
    .prepare(
      `
    UPDATE user_sessions
    SET last_activity_at = ?,
        expires_at = ?
    WHERE id = ?
  `
    )
    .bind(now, expiresAt.toISOString(), sessionId)
    .run();
}

/**
 * Update session data
 */
export async function updateSessionData(
  db: DatabaseClient,
  sessionId: number,
  sessionData: SessionData
): Promise<void> {
  await db.d1
    .prepare(
      `
    UPDATE user_sessions
    SET session_data = ?
    WHERE id = ?
  `
    )
    .bind(serializeSessionData(sessionData), sessionId)
    .run();
}

/**
 * Delete session
 */
export async function deleteSession(db: DatabaseClient, sessionId: number): Promise<void> {
  await db.d1
    .prepare(
      `
    DELETE FROM user_sessions
    WHERE id = ?
  `
    )
    .bind(sessionId)
    .run();
}

/**
 * Delete all sessions for user
 */
export async function deleteUserSessions(db: DatabaseClient, telegramId: string): Promise<void> {
  await db.d1
    .prepare(
      `
    DELETE FROM user_sessions
    WHERE telegram_id = ?
  `
    )
    .bind(telegramId)
    .run();
}

/**
 * Clean up expired sessions (for cron job)
 */
export async function cleanupExpiredSessions(db: DatabaseClient): Promise<number> {
  const result = await db.d1
    .prepare(
      `
    DELETE FROM user_sessions
    WHERE datetime(expires_at) < datetime('now')
  `
    )
    .run();

  return result.meta.changes || 0;
}
