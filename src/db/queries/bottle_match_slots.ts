/**
 * Bottle Match Slots Database Queries
 * For VIP Triple Bottle Feature
 */

import type { DatabaseClient } from '../client';

export interface BottleMatchSlot {
  id: number;
  bottle_id: number;
  slot_role: 'primary' | 'secondary';
  slot_index: number;
  status: 'pending' | 'matched' | 'expired';
  matched_with_telegram_id: string | null;
  conversation_id: number | null;
  matched_at: string | null;
  created_at: string;
}

/**
 * Create match slots for a bottle
 */
export async function createMatchSlots(
  db: DatabaseClient,
  bottleId: number,
  slotCount: number
): Promise<void> {
  for (let i = 1; i <= slotCount; i++) {
    await db.d1
      .prepare(
        `INSERT INTO bottle_match_slots 
         (bottle_id, slot_role, slot_index, status)
         VALUES (?, ?, ?, 'pending')`
      )
      .bind(
        bottleId,
        i === 1 ? 'primary' : 'secondary', // 第 1 個是主動，其他是被動
        i
      )
      .run();
  }
}

/**
 * Get slot by bottle ID and index
 */
export async function getSlotByIndex(
  db: DatabaseClient,
  bottleId: number,
  slotIndex: number
): Promise<BottleMatchSlot | null> {
  const result = await db.d1
    .prepare(
      `SELECT * FROM bottle_match_slots
       WHERE bottle_id = ?
         AND slot_index = ?
       LIMIT 1`
    )
    .bind(bottleId, slotIndex)
    .first();

  return result as BottleMatchSlot | null;
}

/**
 * Get first available slot for a bottle
 */
export async function getFirstAvailableSlot(
  db: DatabaseClient,
  bottleId: number
): Promise<BottleMatchSlot | null> {
  const result = await db.d1
    .prepare(
      `SELECT * FROM bottle_match_slots
       WHERE bottle_id = ?
         AND status = 'pending'
       ORDER BY slot_index ASC
       LIMIT 1`
    )
    .bind(bottleId)
    .first();

  return result as BottleMatchSlot | null;
}

/**
 * Get remaining slots count for a bottle
 */
export async function getRemainingSlots(
  db: DatabaseClient,
  bottleId: number
): Promise<number> {
  const result = await db.d1
    .prepare(
      `SELECT COUNT(*) as count
       FROM bottle_match_slots
       WHERE bottle_id = ?
         AND status = 'pending'`
    )
    .bind(bottleId)
    .first();

  return (result?.count as number) || 0;
}

/**
 * Update slot status to matched
 */
export async function updateSlotMatched(
  db: DatabaseClient,
  slotId: number,
  matchedWithTelegramId: string,
  conversationId?: number
): Promise<void> {
  await db.d1
    .prepare(
      `UPDATE bottle_match_slots
       SET status = 'matched',
           matched_with_telegram_id = ?,
           conversation_id = ?,
           matched_at = datetime('now')
       WHERE id = ?`
    )
    .bind(matchedWithTelegramId, conversationId || null, slotId)
    .run();
}

/**
 * Check if user already matched with this bottle
 */
export async function hasUserMatchedBottle(
  db: DatabaseClient,
  bottleId: number,
  userId: string
): Promise<boolean> {
  const result = await db.d1
    .prepare(
      `SELECT COUNT(*) as count
       FROM bottle_match_slots
       WHERE bottle_id = ?
         AND matched_with_telegram_id = ?`
    )
    .bind(bottleId, userId)
    .first();

  return ((result?.count as number) || 0) > 0;
}

/**
 * Get all slots for a bottle
 */
export async function getSlotsByBottleId(
  db: DatabaseClient,
  bottleId: number
): Promise<BottleMatchSlot[]> {
  const results = await db.d1
    .prepare(
      `SELECT * FROM bottle_match_slots
       WHERE bottle_id = ?
       ORDER BY slot_index ASC`
    )
    .bind(bottleId)
    .all();

  return (results.results as BottleMatchSlot[]) || [];
}

/**
 * Get VIP triple bottle stats for a user
 */
export async function getVipTripleBottleStats(
  db: DatabaseClient,
  userId: string,
  days: number = 30
): Promise<{
  throws: number;
  totalSlots: number;
  matchedSlots: number;
  pendingSlots: number;
}> {
  const result = await db.d1
    .prepare(
      `SELECT 
         COUNT(DISTINCT b.id) as throws,
         COUNT(s.id) as total_slots,
         COUNT(CASE WHEN s.status = 'matched' THEN 1 END) as matched_slots,
         COUNT(CASE WHEN s.status = 'pending' THEN 1 END) as pending_slots
       FROM bottles b
       LEFT JOIN bottle_match_slots s ON b.id = s.bottle_id
       WHERE b.owner_telegram_id = ?
         AND b.is_vip_triple = 1
         AND DATE(b.created_at) >= DATE('now', '-' || ? || ' days')`
    )
    .bind(userId, days)
    .first();

  return {
    throws: (result?.throws as number) || 0,
    totalSlots: (result?.total_slots as number) || 0,
    matchedSlots: (result?.matched_slots as number) || 0,
    pendingSlots: (result?.pending_slots as number) || 0,
  };
}

