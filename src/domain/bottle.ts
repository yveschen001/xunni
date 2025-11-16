/**
 * Bottle Domain Logic
 * 
 * Pure functions for bottle business logic.
 */

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
  target_mbti_filter?: string;   // JSON array
}

export interface ThrowBottleInput {
  content: string;
  target_gender: 'male' | 'female' | 'any';
  target_min_age?: number;
  target_max_age?: number;
  target_region?: string;
  target_zodiac_filter?: string[];
  target_mbti_filter?: string[];
}

const MIN_BOTTLE_LENGTH = 12;
const MAX_BOTTLE_LENGTH = 500;

/**
 * Validate bottle content
 */
export function validateBottleContent(content: string): {
  valid: boolean;
  error?: string;
} {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: '瓶子內容不能為空' };
  }

  const trimmedContent = content.trim();

  if (trimmedContent.length < MIN_BOTTLE_LENGTH) {
    return { 
      valid: false, 
      error: `瓶子內容太短，至少需要 ${MIN_BOTTLE_LENGTH} 個字符（目前 ${trimmedContent.length} 個字符）` 
    };
  }

  if (content.length > MAX_BOTTLE_LENGTH) {
    return { 
      valid: false, 
      error: `瓶子內容太長，最多 ${MAX_BOTTLE_LENGTH} 個字符（目前 ${content.length} 個字符）` 
    };
  }

  return { valid: true };
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
export function canThrowBottle(
  throwsToday: number,
  isVip: boolean,
  inviteBonus: number
): boolean {
  const baseQuota = isVip ? 30 : 3;
  const maxQuota = isVip ? 100 : 10;
  const quota = Math.min(baseQuota + inviteBonus, maxQuota);
  
  return throwsToday < quota;
}

/**
 * Check if user can catch bottle (quota check)
 */
export function canCatchBottle(
  catchesToday: number,
  isVip: boolean,
  inviteBonus: number
): boolean {
  const baseQuota = isVip ? 30 : 3;
  const maxQuota = isVip ? 100 : 10;
  const quota = Math.min(baseQuota + inviteBonus, maxQuota);
  
  return catchesToday < quota;
}

/**
 * Get bottle quota info
 */
export function getBottleQuota(
  isVip: boolean,
  inviteBonus: number
): {
  quota: number;
  maxQuota: number;
} {
  const baseQuota = isVip ? 30 : 3;
  const maxQuota = isVip ? 100 : 10;
  const quota = Math.min(baseQuota + inviteBonus, maxQuota);
  
  return { quota, maxQuota };
}
