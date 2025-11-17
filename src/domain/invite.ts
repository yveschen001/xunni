/**
 * Invite Domain Logic
 * 
 * Pure functions for invite fission feature
 * No side effects, easy to test
 */

import type { User } from './user';

/**
 * Invite status
 */
export type InviteStatus = 'pending' | 'activated' | 'expired';

/**
 * Invite record
 */
export interface Invite {
  id: number;
  inviter_telegram_id: string;
  invitee_telegram_id: string;
  invite_code: string;
  status: InviteStatus;
  activated_at: string | null;
  created_at: string;
}

/**
 * Calculate daily bottle quota including invite rewards
 * 
 * @param user User object
 * @returns Daily bottle quota
 */
export function calculateDailyQuota(user: User): number {
  const baseQuota = user.is_vip ? 30 : 3;
  const maxInvites = user.is_vip ? 100 : 10;
  const actualInvites = Math.min(user.successful_invites || 0, maxInvites);
  
  return baseQuota + actualInvites;
}

/**
 * Extract invite code from /start command
 * 
 * @param text Command text (e.g., "/start invite_XUNNI-ABC123")
 * @returns Invite code or null
 * 
 * @example
 * extractInviteCode('/start invite_XUNNI-ABC123') // 'XUNNI-ABC123'
 * extractInviteCode('/start') // null
 */
export function extractInviteCode(text: string): string | null {
  const match = text.match(/^\/start\s+invite_(.+)$/);
  return match ? match[1] : null;
}

/**
 * Validate invite code format
 * 
 * @param code Invite code
 * @returns true if valid
 * 
 * @example
 * validateInviteCode('XUNNI-ABC12345') // true (8 chars)
 * validateInviteCode('XUNNI-ABC123') // true (6 chars, legacy)
 * validateInviteCode('invalid') // false
 */
export function validateInviteCode(code: string): boolean {
  // Format: XUNNI-XXXXXXXX (6-8 alphanumeric characters for backward compatibility)
  return /^XUNNI-[A-Z0-9]{6,8}$/.test(code);
}

/**
 * Mask nickname for privacy protection
 * 
 * New rules:
 * - If nickname < 4 chars: nickname + **** (pad to 10 chars total)
 * - If nickname >= 4 chars: show first part + at least 4 * (total 10 chars)
 * 
 * @param nickname Original nickname
 * @returns Masked nickname (always 10 chars)
 * 
 * @example
 * maskNickname('張') // '張*********' (1 + 9 stars = 10)
 * maskNickname('王五') // '王五********' (2 + 8 stars = 10)
 * maskNickname('張小明') // '張小明*******' (3 + 7 stars = 10)
 * maskNickname('Alice') // 'Alice*****' (5 + 5 stars = 10)
 * maskNickname('Alexander') // 'Alexan****' (6 + 4 stars = 10)
 * maskNickname('VeryLongName') // 'VeryLo****' (6 + 4 stars = 10)
 */
export function maskNickname(nickname: string): string {
  if (!nickname || nickname.length === 0) {
    return '新用戶******'; // 10 chars total
  }
  
  const TARGET_LENGTH = 10;
  const MIN_MASK_LENGTH = 4;
  
  // If nickname is less than 4 characters, show all + pad with stars to 10
  if (nickname.length < 4) {
    const starsNeeded = TARGET_LENGTH - nickname.length;
    return nickname + '*'.repeat(starsNeeded);
  }
  
  // If nickname is 4 or more characters
  // Show first part + at least 4 stars, total 10 chars
  const visibleLength = Math.min(nickname.length, TARGET_LENGTH - MIN_MASK_LENGTH); // Max 6 chars visible
  const visible = nickname.substring(0, visibleLength);
  const starsNeeded = TARGET_LENGTH - visible.length;
  return visible + '*'.repeat(starsNeeded);
}

/**
 * Check if user should receive invite limit warning
 * 
 * @param user User object
 * @returns true if should show warning (at 9/10 for free users)
 */
export function shouldShowInviteLimitWarning(user: User): boolean {
  if (user.is_vip) return false;
  
  const maxInvites = 10;
  const currentInvites = user.successful_invites || 0;
  
  return currentInvites === maxInvites - 1;
}

/**
 * Check if user has reached invite limit
 * 
 * @param user User object
 * @returns true if limit reached
 */
export function hasReachedInviteLimit(user: User): boolean {
  const maxInvites = user.is_vip ? 100 : 10;
  const currentInvites = user.successful_invites || 0;
  
  return currentInvites >= maxInvites;
}

/**
 * Check if user can activate invite
 * 
 * @param user User object
 * @param hasThrown Whether user has thrown at least one bottle
 * @returns true if can activate
 */
export function canActivateInvite(user: User, hasThrown: boolean): boolean {
  // Must complete onboarding
  if (user.onboarding_step !== 'completed') {
    return false;
  }
  
  // Must have thrown at least one bottle
  if (!hasThrown) {
    return false;
  }
  
  // Must have an inviter
  if (!user.invited_by) {
    return false;
  }
  
  return true;
}

/**
 * Get invite limit for user
 * 
 * @param user User object
 * @returns Invite limit
 */
export function getInviteLimit(user: User): number {
  return user.is_vip ? 100 : 10;
}

/**
 * Calculate invite conversion rate
 * 
 * @param totalInvites Total invites sent
 * @param activatedInvites Activated invites
 * @returns Conversion rate (0-100)
 */
export function calculateConversionRate(
  totalInvites: number,
  activatedInvites: number
): number {
  if (totalInvites === 0) return 0;
  return Math.round((activatedInvites / totalInvites) * 100);
}

