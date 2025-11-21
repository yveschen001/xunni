/**
 * Bottle Domain Logic
 *
 * Pure functions for bottle business logic.
 */

import { performLocalModeration } from '~/domain/risk';

export interface Bottle {
  id: number;
  owner_telegram_id: string;
  content: string;
  created_at: string;
  expires_at: string;
  status: 'pending' | 'matched' | 'expired' | 'deleted';
  target_gender: 'male' | 'female' | 'any';
  target_min_age?: number;
  target_max_age?: number;
  target_region?: string;
  target_zodiac_filter?: string; // JSON array
  target_mbti_filter?: string; // JSON array
}

export interface ThrowBottleInput {
  content: string;
  target_gender: 'male' | 'female' | 'any';
  target_min_age?: number;
  target_max_age?: number;
  target_region?: string;
  target_zodiac_filter?: string[];
  target_mbti_filter?: string[];
  target_blood_type_filter?: string | null;
}

const MIN_BOTTLE_LENGTH = 5;
const MAX_BOTTLE_LENGTH = 250;

/**
 * Validate bottle content
 * Includes length check, URL check, and sensitive word detection
 */
export function validateBottleContent(content: string): {
  valid: boolean;
  error?: string;
  riskScore?: number;
} {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: '瓶子內容不能為空' };
  }

  const trimmedContent = content.trim();

  // Length check
  if (trimmedContent.length < MIN_BOTTLE_LENGTH) {
    return {
      valid: false,
      error: `瓶子內容太短，至少需要 ${MIN_BOTTLE_LENGTH} 個字符（目前 ${trimmedContent.length} 個字符）`,
    };
  }

  if (content.length > MAX_BOTTLE_LENGTH) {
    return {
      valid: false,
      error: `瓶子內容太長，最多 ${MAX_BOTTLE_LENGTH} 個字符（目前 ${content.length} 個字符）`,
    };
  }

  // URL check (禁止所有链接)
  const urlPattern = /https?:\/\/|www\.|t\.me|telegram\.me|\.com|\.net|\.org|\.io|\.co/i;
  if (urlPattern.test(content)) {
    return {
      valid: false,
      error: '瓶子內容不允許包含任何連結',
      riskScore: 10, // URL risk score
    };
  }

  // Sensitive word detection (本地敏感词检测)
  const moderationResult = performLocalModeration(content);
  
  if (!moderationResult.is_safe) {
    return {
      valid: false,
      error: '瓶子內容包含不適當的內容，請修改後重新提交',
      riskScore: moderationResult.risk_score,
    };
  }

  return { valid: true, riskScore: 0 };
}

/**
 * Check if bottle has expired
 */
export function isBottleExpired(bottle: Bottle): boolean {
  const now = new Date();
  const expiresAt = new Date(bottle.expires_at);
  return now > expiresAt;
}

/**
 * Calculate bottle expiration time (24 hours from now)
 */
export function calculateBottleExpiration(): string {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24 hours
  return expiresAt.toISOString();
}

/**
 * Check if user can throw bottle (quota check)
 */
export function canThrowBottle(throwsToday: number, isVip: boolean, inviteBonus: number, taskBonus: number = 0, adBonus: number = 0): boolean {
  const baseQuota = isVip ? 30 : 3;
  const maxQuota = isVip ? 100 : 10;
  const quota = Math.min(baseQuota + inviteBonus, maxQuota) + taskBonus + adBonus;

  return throwsToday < quota;
}

/**
 * Check if user can catch bottle (quota check)
 */
export function canCatchBottle(catchesToday: number, isVip: boolean, inviteBonus: number, taskBonus: number = 0, adBonus: number = 0): boolean {
  const baseQuota = isVip ? 30 : 3;
  const maxQuota = isVip ? 100 : 10;
  const quota = Math.min(baseQuota + inviteBonus, maxQuota) + taskBonus + adBonus;

  return catchesToday < quota;
}

/**
 * Get bottle quota info
 */
export function getBottleQuota(
  isVip: boolean,
  inviteBonus: number,
  taskBonus: number = 0,
  adBonus: number = 0
): {
  quota: number;
  maxQuota: number;
} {
  const baseQuota = isVip ? 30 : 3;
  const maxQuota = isVip ? 100 : 10;
  const quota = Math.min(baseQuota + inviteBonus, maxQuota) + taskBonus + adBonus;

  return { quota, maxQuota };
}
