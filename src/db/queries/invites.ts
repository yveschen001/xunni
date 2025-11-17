/**
 * Database Queries for Invites
 */

import type { DatabaseClient } from '../client';
import type { Invite } from '../../domain/invite';

/**
 * Create a new invite record
 */
export async function createInvite(
  db: DatabaseClient,
  inviterTelegramId: string,
  inviteeTelegramId: string,
  inviteCode: string
): Promise<void> {
  await db.d1
    .prepare(
      `INSERT INTO invites (
        inviter_telegram_id,
        invitee_telegram_id,
        invite_code,
        status,
        created_at
      ) VALUES (?, ?, ?, 'pending', datetime('now'))`
    )
    .bind(inviterTelegramId, inviteeTelegramId, inviteCode)
    .run();
}

/**
 * Find invite by invitee telegram_id
 */
export async function findInviteByInvitee(
  db: DatabaseClient,
  inviteeTelegramId: string
): Promise<Invite | null> {
  const result = await db.d1
    .prepare(
      `SELECT * FROM invites 
       WHERE invitee_telegram_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`
    )
    .bind(inviteeTelegramId)
    .first<Invite>();

  return result || null;
}

/**
 * Activate an invite
 */
export async function activateInvite(
  db: DatabaseClient,
  inviteeTelegramId: string
): Promise<void> {
  await db.d1
    .prepare(
      `UPDATE invites 
       SET status = 'activated', activated_at = datetime('now')
       WHERE invitee_telegram_id = ? AND status = 'pending'`
    )
    .bind(inviteeTelegramId)
    .run();
}

/**
 * Increment successful_invites count for inviter
 */
export async function incrementSuccessfulInvites(
  db: DatabaseClient,
  inviterTelegramId: string
): Promise<void> {
  await db.d1
    .prepare(
      `UPDATE users 
       SET successful_invites = successful_invites + 1 
       WHERE telegram_id = ?`
    )
    .bind(inviterTelegramId)
    .run();
}

/**
 * Get invite statistics for a user
 */
export async function getInviteStats(
  db: DatabaseClient,
  inviterTelegramId: string
): Promise<{
  total: number;
  activated: number;
  pending: number;
  conversionRate: number;
}> {
  const result = await db.d1
    .prepare(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'activated' THEN 1 ELSE 0 END) as activated,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
       FROM invites
       WHERE inviter_telegram_id = ?`
    )
    .bind(inviterTelegramId)
    .first<{ total: number; activated: number; pending: number }>();

  if (!result) {
    return { total: 0, activated: 0, pending: 0, conversionRate: 0 };
  }

  const conversionRate =
    result.total > 0 ? Math.round((result.activated / result.total) * 100) : 0;

  return {
    total: result.total || 0,
    activated: result.activated || 0,
    pending: result.pending || 0,
    conversionRate,
  };
}

/**
 * Check if an invite has already been activated
 */
export async function isInviteActivated(
  db: DatabaseClient,
  inviteeTelegramId: string
): Promise<boolean> {
  const result = await db.d1
    .prepare(
      `SELECT COUNT(*) as count 
       FROM invites 
       WHERE invitee_telegram_id = ? AND status = 'activated'`
    )
    .bind(inviteeTelegramId)
    .first<{ count: number }>();

  return (result?.count || 0) > 0;
}

/**
 * Get all invites for a user (for admin/debugging)
 */
export async function getAllInvitesForUser(
  db: DatabaseClient,
  inviterTelegramId: string
): Promise<Invite[]> {
  const result = await db.d1
    .prepare(
      `SELECT * FROM invites 
       WHERE inviter_telegram_id = ? 
       ORDER BY created_at DESC`
    )
    .bind(inviterTelegramId)
    .all<Invite>();

  return result.results || [];
}

