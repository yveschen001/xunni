import { D1Database } from '@cloudflare/workers-types';
import { MatchRequest, MatchRequestStatus, RelationshipType, UserBlocklist } from '../../domain/match_request';

export async function createMatchRequest(
  db: D1Database,
  data: {
    requester_id: string;
    target_id: string;
    relationship_type: RelationshipType;
    family_role?: string;
    expires_at: string;
  }
): Promise<MatchRequest> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  await db.prepare(`
    INSERT INTO match_requests (
      id, requester_id, target_id, status, relationship_type, family_role, 
      rejection_count, created_at, expires_at
    ) VALUES (?, ?, ?, 'pending', ?, ?, 0, ?, ?)
  `).bind(
    id, data.requester_id, data.target_id, data.relationship_type, data.family_role || null, now, data.expires_at
  ).run();

  return {
    id,
    requester_id: data.requester_id,
    target_id: data.target_id,
    status: 'pending',
    relationship_type: data.relationship_type,
    family_role: data.family_role,
    rejection_count: 0,
    created_at: now,
    expires_at: data.expires_at
  };
}

export async function getMatchRequest(db: D1Database, id: string): Promise<MatchRequest | null> {
  return await db.prepare('SELECT * FROM match_requests WHERE id = ?').bind(id).first<MatchRequest>();
}

export async function getActiveMatchRequest(db: D1Database, requesterId: string, targetId: string): Promise<MatchRequest | null> {
  // Check for pending requests
  const pending = await db.prepare(`
    SELECT * FROM match_requests 
    WHERE requester_id = ? AND target_id = ? AND status = 'pending'
  `).bind(requesterId, targetId).first<MatchRequest>();
  
  if (pending) return pending;

  // Check for valid accepted requests (not expired)
  const now = new Date().toISOString();
  return await db.prepare(`
    SELECT * FROM match_requests 
    WHERE requester_id = ? AND target_id = ? AND status = 'accepted' AND expires_at > ?
  `).bind(requesterId, targetId, now).first<MatchRequest>();
}

export async function getLastRejectedRequest(db: D1Database, requesterId: string, targetId: string): Promise<MatchRequest | null> {
  return await db.prepare(`
    SELECT * FROM match_requests 
    WHERE requester_id = ? AND target_id = ? AND status = 'rejected'
    ORDER BY last_rejected_at DESC LIMIT 1
  `).bind(requesterId, targetId).first<MatchRequest>();
}

export async function updateMatchRequestStatus(
  db: D1Database, 
  id: string, 
  status: MatchRequestStatus,
  rejectionInfo?: { count: number, at: string }
): Promise<void> {
  if (status === 'rejected' && rejectionInfo) {
    await db.prepare(`
      UPDATE match_requests 
      SET status = ?, rejection_count = ?, last_rejected_at = ? 
      WHERE id = ?
    `).bind(status, rejectionInfo.count, rejectionInfo.at, id).run();
  } else {
    await db.prepare('UPDATE match_requests SET status = ? WHERE id = ?').bind(status, id).run();
  }
}

export async function isBlocked(db: D1Database, userId: string, blockedUserId: string): Promise<boolean> {
  // Check if userId has blocked blockedUserId
  const block = await db.prepare(`
    SELECT 1 FROM user_blocklist WHERE user_id = ? AND blocked_user_id = ?
  `).bind(userId, blockedUserId).first();
  return !!block;
}

export async function createBlock(db: D1Database, userId: string, blockedUserId: string, reason: string): Promise<void> {
  await db.prepare(`
    INSERT OR IGNORE INTO user_blocklist (user_id, blocked_user_id, reason) VALUES (?, ?, ?)
  `).bind(userId, blockedUserId, reason).run();
}

export async function removeBlock(db: D1Database, userId: string, blockedUserId: string): Promise<void> {
  await db.prepare(`
    DELETE FROM user_blocklist WHERE user_id = ? AND blocked_user_id = ?
  `).bind(userId, blockedUserId).run();
}

export async function getBlockedUsers(db: D1Database, userId: string, limit: number, offset: number): Promise<UserBlocklist[]> {
  const { results } = await db.prepare(`
    SELECT * FROM user_blocklist WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).bind(userId, limit, offset).all<UserBlocklist>();
  return results || [];
}

