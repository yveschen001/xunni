/**
 * Bottle Database Queries
 */

import type { DatabaseClient } from '../client';
import type { Bottle, ThrowBottleInput } from '~/domain/bottle';
import { calculateBottleExpiration } from '~/domain/bottle';

/**
 * Create a new bottle
 */
export async function createBottle(
  db: DatabaseClient,
  ownerId: string,
  input: ThrowBottleInput
): Promise<number> {
  const expiresAt = calculateBottleExpiration();
  
  const result = await db.d1.prepare(`
    INSERT INTO bottles (
      owner_telegram_id,
      content,
      mood_tag,
      created_at,
      expires_at,
      status,
      target_gender,
      target_age_range,
      target_region,
      target_zodiac_filter,
      target_mbti_filter,
      language
    ) VALUES (?, ?, ?, datetime('now'), ?, 'pending', ?, ?, ?, ?, ?, ?)
  `).bind(
    ownerId,
    input.content,
    input.mood_tag || null,
    expiresAt,
    input.target_gender,
    input.target_age_range || null,
    input.target_region || null,
    input.target_zodiac_filter ? JSON.stringify(input.target_zodiac_filter) : null,
    input.target_mbti_filter ? JSON.stringify(input.target_mbti_filter) : null,
    input.language || null
  ).run();

  return result.meta.last_row_id as number;
}

/**
 * Find matching bottle for user
 */
export async function findMatchingBottle(
  db: DatabaseClient,
  userId: string,
  userGender: string,
  userAge: number,
  userZodiac: string,
  userMbti: string
): Promise<Bottle | null> {
  // Find bottles that:
  // 1. Are pending
  // 2. Not expired
  // 3. Not owned by user
  // 4. Match target_gender
  // 5. Not from blocked users
  // 6. Not from users who blocked this user
  // 7. Not from users who were reported by this user (within 24h)
  
  const result = await db.d1.prepare(`
    SELECT b.* FROM bottles b
    WHERE b.status = 'pending'
      AND datetime(b.expires_at) > datetime('now')
      AND b.owner_telegram_id != ?
      AND (b.target_gender = ? OR b.target_gender = 'any')
      AND NOT EXISTS (
        SELECT 1 FROM user_blocks ub
        WHERE (ub.blocker_id = ? AND ub.blocked_id = b.owner_telegram_id)
           OR (ub.blocker_id = b.owner_telegram_id AND ub.blocked_id = ?)
      )
      AND NOT EXISTS (
        SELECT 1 FROM reports r
        WHERE r.reporter_id = ?
          AND r.target_id = b.owner_telegram_id
          AND datetime(r.created_at) > datetime('now', '-24 hours')
      )
    ORDER BY RANDOM()
    LIMIT 1
  `).bind(userId, userGender, userId, userId, userId).first();

  return result as Bottle | null;
}

/**
 * Update bottle status
 */
export async function updateBottleStatus(
  db: DatabaseClient,
  bottleId: number,
  status: 'pending' | 'matched' | 'expired' | 'deleted'
): Promise<void> {
  await db.d1.prepare(`
    UPDATE bottles
    SET status = ?
    WHERE id = ?
  `).bind(status, bottleId).run();
}

/**
 * Get bottle by ID
 */
export async function getBottleById(
  db: DatabaseClient,
  bottleId: number
): Promise<Bottle | null> {
  const result = await db.d1.prepare(`
    SELECT * FROM bottles WHERE id = ?
  `).bind(bottleId).first();

  return result as Bottle | null;
}

/**
 * Get user's daily throw count
 */
export async function getDailyThrowCount(
  db: DatabaseClient,
  userId: string
): Promise<number> {
  const result = await db.d1.prepare(`
    SELECT throws_count FROM daily_usage
    WHERE telegram_id = ?
      AND date = date('now')
  `).bind(userId).first();

  return (result?.throws_count as number) || 0;
}

/**
 * Get user's daily catch count
 */
export async function getDailyCatchCount(
  db: DatabaseClient,
  userId: string
): Promise<number> {
  const result = await db.d1.prepare(`
    SELECT catches_count FROM daily_usage
    WHERE telegram_id = ?
      AND date = date('now')
  `).bind(userId).first();

  return (result?.catches_count as number) || 0;
}

/**
 * Increment daily throw count
 */
export async function incrementDailyThrowCount(
  db: DatabaseClient,
  userId: string
): Promise<void> {
  await db.d1.prepare(`
    INSERT INTO daily_usage (telegram_id, date, throws_count, catches_count)
    VALUES (?, date('now'), 1, 0)
    ON CONFLICT(telegram_id, date) DO UPDATE SET
      throws_count = throws_count + 1
  `).bind(userId).run();
}

/**
 * Increment daily catch count
 */
export async function incrementDailyCatchCount(
  db: DatabaseClient,
  userId: string
): Promise<void> {
  await db.d1.prepare(`
    INSERT INTO daily_usage (telegram_id, date, throws_count, catches_count)
    VALUES (?, date('now'), 0, 1)
    ON CONFLICT(telegram_id, date) DO UPDATE SET
      catches_count = catches_count + 1
  `).bind(userId).run();
}
