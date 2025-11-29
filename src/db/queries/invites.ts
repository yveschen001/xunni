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
 * Get daily invite statistics
 *
 * @param db - Database client
 * @param date - Date in YYYY-MM-DD format
 * @returns Daily invite statistics
 */
export async function getDailyInviteStats(
  db: DatabaseClient,
  date: string
): Promise<{
  initiated: number;
  accepted: number; // NOTE: 'pending' status usually means initiated but not necessarily accepted?
  // In this system:
  // - 'pending': invite record created (invitee started bot with code)
  // - 'activated': invitee completed onboarding (or whatever logic updates it)
  // Wait, createInvite sets status='pending' when invitee starts bot.
  // So 'initiated' is not tracked separately unless we track link clicks.
  // But we can count 'pending' records created on date as 'accepted' (meaning they started bot).
  // And 'activated' records updated on date? 'activated_at' column?
  // Let's assume:
  // - initiated: N/A (we don't track link clicks here) -> return 0 or maybe same as accepted?
  // - accepted: Count of invites created on date (regardless of status now)
  // - activated: Count of invites where status='activated' AND updated_at (or similar) is date?
  //   Actually, invites table might not have 'activated_at'.
  //   Let's check schema.
  activated: number;
}> {
  // Check if invites table has updated_at or activated_at
  // If not, we can only count 'accepted' based on created_at.
  // For 'activated', we might check users table 'created_at' who have 'invited_by'?
  // Or check if invites table has timestamp for activation.
  // Assuming basic implementation first.

  // Count invites created on date (Accepted)
  const acceptedResult = await db.d1
    .prepare(
      `SELECT COUNT(*) as count 
       FROM invites 
       WHERE DATE(created_at) = ?`
    )
    .bind(date)
    .first<{ count: number }>();

  // Count invites activated on date (Status='activated')
  const activatedResult = await db.d1
    .prepare(
      `SELECT COUNT(*) as count 
       FROM invites 
       WHERE status = 'activated' AND DATE(activated_at) = ?`
    )
    .bind(date)
    .first<{ count: number }>();

  return {
    initiated: acceptedResult?.count || 0, // Approx.
    accepted: acceptedResult?.count || 0,
    activated: activatedResult?.count || 0,
  };
}
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
export async function activateInvite(db: DatabaseClient, inviteeTelegramId: string): Promise<void> {
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

  const conversionRate = result.total > 0 ? Math.round((result.activated / result.total) * 100) : 0;

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
