/**
 * User Database Queries
 * Based on @doc/MODULE_DESIGN.md
 */

import type { User } from '~/types';
import type { DatabaseClient } from '../client';

// ============================================================================
// User Queries
// ============================================================================

/**
 * Find user by Telegram ID
 */
export async function findUserByTelegramId(
  db: DatabaseClient,
  telegramId: string
): Promise<User | null> {
  const sql = `
    SELECT * FROM users
    WHERE telegram_id = ?
    LIMIT 1
  `;

  return db.queryOne<User>(sql, [telegramId]);
}

/**
 * Find user by Username (New)
 */
export async function findUserByUsername(
  db: any, // Use any or D1Database if not using DatabaseClient wrapper
  username: string
): Promise<User | null> {
  // If db is DatabaseClient wrapper
  if (db.queryOne) {
    const sql = `
      SELECT * FROM users
      WHERE username = ? COLLATE NOCASE
      LIMIT 1
    `;
    return db.queryOne(sql, [username]);
  } 
  
  // If db is raw D1Database
  const result = await db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE LIMIT 1').bind(username).first();
  return result as User | null;
}

/**
 * Find user by Nickname
 */
export async function findUserByNickname(
  db: any,
  nickname: string
): Promise<User | null> {
  // If db is DatabaseClient wrapper
  if (db.queryOne) {
    const sql = `
      SELECT * FROM users
      WHERE nickname = ? COLLATE NOCASE
      LIMIT 1
    `;
    return db.queryOne(sql, [nickname]);
  } 
  
  // If db is raw D1Database
  const result = await db.prepare('SELECT * FROM users WHERE nickname = ? COLLATE NOCASE LIMIT 1').bind(nickname).first();
  return result as User | null;
}

/**
 * Find user by invite code
 */
export async function findUserByInviteCode(
  db: DatabaseClient,
  inviteCode: string
): Promise<User | null> {
  const sql = `
    SELECT * FROM users
    WHERE invite_code = ?
    LIMIT 1
  `;

  return db.queryOne<User>(sql, [inviteCode]);
}

/**
 * Create a new user
 */
export async function createUser(
  db: DatabaseClient,
  data: {
    telegram_id: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    language_pref?: string;
    country_code?: string;
    invite_code: string;
    invited_by?: string;
    onboarding_step?: string;
  }
): Promise<User> {
  const sql = `
    INSERT INTO users (
      telegram_id, username, first_name, last_name,
      language_pref, country_code, invite_code, invited_by, onboarding_step
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING *
  `;

  const result = await db.queryOne<User>(sql, [
    data.telegram_id,
    data.username || null,
    data.first_name || null,
    data.last_name || null,
    data.language_pref || 'zh-TW',
    data.country_code || null,
    data.invite_code,
    data.invited_by || null,
    data.onboarding_step || 'language_selection',
  ]);

  if (!result) {
    throw new Error('Failed to create user');
  }

  // 🧹 Ensure clean state for re-registration (Dev/Staging mostly)
  // Clear daily usage if any exists for this ID (prevents "Used Up" error for new users)
  try {
    await db.execute('DELETE FROM daily_usage WHERE telegram_id = ?', [data.telegram_id]);
    await db.execute('DELETE FROM fortune_quota WHERE telegram_id = ?', [data.telegram_id]);
  } catch (e) {
    console.warn('[createUser] Failed to clear legacy usage data:', e);
  }

  return result;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  db: DatabaseClient,
  telegramId: string,
  updates: Partial<{
    nickname: string;
    avatar_url: string;
    gender: string;
    birthday: string;
    age: number;
    city: string;
    bio: string;
    interests: string;
    zodiac_sign: string;
    language_pref: string;
    blood_type: string | null;
  }>
): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    fields.push(`${key} = ?`);
    values.push(value);
  });

  if (fields.length === 0) return;

  values.push(telegramId);

  const sql = `
    UPDATE users
    SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE telegram_id = ?
    `;

  await db.execute(sql, values);
}

/**
 * Update user onboarding step
 */
export async function updateOnboardingStep(
  db: DatabaseClient,
  telegramId: string,
  step: string
): Promise<void> {
  const sql = `
    UPDATE users
    SET onboarding_step = ?, updated_at = CURRENT_TIMESTAMP
    WHERE telegram_id = ?
  `;

  await db.execute(sql, [step, telegramId]);
}

/**
 * Complete user onboarding
 */
export async function completeOnboarding(db: DatabaseClient, telegramId: string): Promise<void> {
  const sql = `
    UPDATE users
    SET onboarding_step = 'completed',
        onboarding_completed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE telegram_id = ?
  `;

  await db.execute(sql, [telegramId]);
}

/**
 * Update MBTI result
 */
export async function updateMBTIResult(
  db: DatabaseClient,
  telegramId: string,
  mbtiResult: string
): Promise<void> {
  const sql = `
    UPDATE users
    SET mbti_result = ?,
        mbti_completed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE telegram_id = ?
  `;

  await db.execute(sql, [mbtiResult, telegramId]);
}

/**
 * Update anti-fraud score
 */
export async function updateAntiFraudScore(
  db: DatabaseClient,
  telegramId: string,
  score: number
): Promise<void> {
  const sql = `
    UPDATE users
    SET anti_fraud_score = ?,
        anti_fraud_completed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE telegram_id = ?
  `;

  await db.execute(sql, [score, telegramId]);
}

/**
 * Update VIP status
 */
export async function updateVIPStatus(
  db: DatabaseClient,
  telegramId: string,
  isVIP: boolean,
  expireAt?: string
): Promise<void> {
  const sql = `
    UPDATE users
    SET is_vip = ?,
        vip_expire_at = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE telegram_id = ?
  `;

  await db.execute(sql, [isVIP ? 1 : 0, expireAt || null, telegramId]);
}

/**
 * Increment successful invites
 */
export async function incrementSuccessfulInvites(
  db: DatabaseClient,
  telegramId: string
): Promise<void> {
  const sql = `
    UPDATE users
    SET successful_invites = successful_invites + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE telegram_id = ?
  `;

  await db.execute(sql, [telegramId]);
}

/**
 * Grant permanent quota to user
 * Used for official ad rewards and special promotions
 */
export async function grantPermanentQuota(
  db: DatabaseClient,
  telegramId: string,
  quotaAmount: number
): Promise<void> {
  const sql = `
    UPDATE users
    SET permanent_quota = COALESCE(permanent_quota, 0) + ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE telegram_id = ?
  `;

  await db.execute(sql, [quotaAmount, telegramId]);
}

/**
 * Update risk score
 */
export async function updateRiskScore(
  db: DatabaseClient,
  telegramId: string,
  increment: number
): Promise<void> {
  const sql = `
    UPDATE users
    SET risk_score = risk_score + ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE telegram_id = ?
  `;

  await db.execute(sql, [increment, telegramId]);
}

/**
 * Ban user
 */
export async function banUser(
  db: DatabaseClient,
  telegramId: string,
  reason: string,
  bannedUntil?: string
): Promise<void> {
  const sql = `
    UPDATE users
    SET is_banned = 1,
        ban_reason = ?,
        banned_at = CURRENT_TIMESTAMP,
        banned_until = ?,
        ban_count = ban_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE telegram_id = ?
  `;

  await db.execute(sql, [reason, bannedUntil || null, telegramId]);
}

/**
 * Unban user
 */
export async function unbanUser(db: DatabaseClient, telegramId: string): Promise<void> {
  const sql = `
    UPDATE users
    SET is_banned = 0,
        ban_reason = NULL,
        banned_at = NULL,
        banned_until = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE telegram_id = ?
  `;

  await db.execute(sql, [telegramId]);
}

/**
 * Get users by filters (for admin/broadcast)
 */
export async function getUsersByFilters(
  db: DatabaseClient,
  filters: {
    gender?: string;
    min_age?: number;
    max_age?: number;
    zodiac?: string;
    language?: string;
    only_vip?: boolean;
  }
): Promise<User[]> {
  const conditions: string[] = ['is_banned = 0', 'deleted_at IS NULL'];
  const params: unknown[] = [];

  if (filters.gender) {
    conditions.push('gender = ?');
    params.push(filters.gender);
  }

  if (filters.min_age !== undefined) {
    conditions.push('age >= ?');
    params.push(filters.min_age);
  }

  if (filters.max_age !== undefined) {
    conditions.push('age <= ?');
    params.push(filters.max_age);
  }

  if (filters.zodiac) {
    conditions.push('zodiac_sign = ?');
    params.push(filters.zodiac);
  }

  if (filters.language) {
    conditions.push('language_pref = ?');
    params.push(filters.language);
  }

  if (filters.only_vip) {
    conditions.push('is_vip = 1');
    conditions.push('vip_expire_at > CURRENT_TIMESTAMP');
  }

  const sql = `
    SELECT * FROM users
    WHERE ${conditions.join(' AND ')}
    ORDER BY created_at DESC
  `;

  return db.query<User>(sql, params);
}

/**
 * Get total user count
 */
export async function getTotalUserCount(db: DatabaseClient): Promise<number> {
  const sql = `
    SELECT COUNT(*) as count
    FROM users
    WHERE deleted_at IS NULL
  `;

  const result = await db.queryOne<{ count: number }>(sql);
  return result?.count || 0;
}

/**
 * Get new users count (yesterday)
 */
export async function getNewUsersCount(db: DatabaseClient, date: string): Promise<number> {
  const sql = `
    SELECT COUNT(*) as count
    FROM users
    WHERE DATE(created_at) = ?
  `;

  const result = await db.queryOne<{ count: number }>(sql, [date]);
  return result?.count || 0;
}
