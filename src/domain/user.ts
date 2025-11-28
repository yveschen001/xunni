/**
 * User Domain Logic
 * Based on @doc/SPEC.md and @doc/MODULE_DESIGN.md
 *
 * This module contains pure functions for user-related business logic.
 * No side effects, no database calls, easy to test.
 */

import type { User, Role } from '~/types';

// ============================================================================
// Constants
// ============================================================================

export const MIN_AGE = 18;
export const MAX_NICKNAME_LENGTH = 36; // Max 36 chars, display max 18 chars
export const MAX_BIO_LENGTH = 500;

export const ZODIAC_SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
] as const;

export const MBTI_TYPES = [
  'INTJ',
  'INTP',
  'ENTJ',
  'ENTP',
  'INFJ',
  'INFP',
  'ENFJ',
  'ENFP',
  'ISTJ',
  'ISFJ',
  'ESTJ',
  'ESFJ',
  'ISTP',
  'ISFP',
  'ESTP',
  'ESFP',
] as const;

// ============================================================================
// Age Calculation
// ============================================================================

/**
 * Calculate age from birthday (YYYY-MM-DD)
 * Returns null if birthday is invalid
 */
export function calculateAge(birthday: string): number | null {
  const birthdayDate = new Date(birthday);
  if (isNaN(birthdayDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthdayDate.getFullYear();
  const monthDiff = today.getMonth() - birthdayDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdayDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Check if user is old enough (>= 18 years old)
 */
export function isOldEnough(birthday: string): boolean {
  const age = calculateAge(birthday);
  return age !== null && age >= MIN_AGE;
}

// ============================================================================
// Zodiac Sign Calculation
// ============================================================================

/**
 * Calculate zodiac sign from birthday (YYYY-MM-DD)
 * Returns null if birthday is invalid
 */
export function calculateZodiacSign(birthday: string): string | null {
  const date = new Date(birthday);
  if (isNaN(date.getTime())) {
    return null;
  }

  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Pisces';

  return null;
}

// ============================================================================
// Onboarding Status
// ============================================================================

/**
 * Check if user has completed onboarding
 */
export function hasCompletedOnboarding(user: User): boolean {
  return (
    user.onboarding_step === 'completed' &&
    !!user.nickname &&
    !!user.gender &&
    !!user.birthday &&
    !!user.mbti_result &&
    user.anti_fraud_score >= 60 // Minimum passing score
  );
}

/**
 * Check if user can throw/catch bottles
 */
export function canUseBottleFeatures(user: User): boolean {
  return hasCompletedOnboarding(user) && user.is_banned === 0;
}

// ============================================================================
// VIP Status
// ============================================================================

/**
 * Check if user is currently VIP
 */
export function isVIP(user: User): boolean {
  if (!user.is_vip || !user.vip_expire_at) {
    return false;
  }

  const now = new Date();
  const expireDate = new Date(user.vip_expire_at);

  return now < expireDate;
}

/**
 * Calculate VIP expiration date from now
 */
export function calculateVIPExpiration(durationDays: number): string {
  const now = new Date();
  now.setDate(now.getDate() + durationDays);
  return now.toISOString();
}

/**
 * Extend VIP from current expiration date
 */
export function extendVIPExpiration(currentExpiration: string, durationDays: number): string {
  const expireDate = new Date(currentExpiration);
  const now = new Date();

  // If already expired, start from now
  const startDate = expireDate > now ? expireDate : now;

  startDate.setDate(startDate.getDate() + durationDays);
  return startDate.toISOString();
}

// ============================================================================
// Role & Permission Checks
// ============================================================================

/**
 * Check if user has admin privileges (angel or god)
 */
export function isAdmin(user: User): boolean {
  return user.role === 'angel' || user.role === 'god';
}

/**
 * Check if user is god (highest privilege)
 */
export function isGod(user: User): boolean {
  return user.role === 'god';
}

/**
 * Check if user can perform admin action
 */
export function canPerformAdminAction(user: User, requiredRole: Role): boolean {
  const roleHierarchy: Record<Role, number> = {
    user: 0,
    group_admin: 1,
    angel: 2,
    god: 3,
  };

  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate nickname
 */
export function validateNickname(nickname: string): { valid: boolean; error?: string } {
  if (!nickname || nickname.trim().length === 0) {
    return { valid: false, error: 'Nickname cannot be empty' };
  }

  // Check minimum length (at least 2 characters for editing, 4 for registration)
  if (nickname.trim().length < 2) {
    return { valid: false, error: 'Nickname too short (min 2 characters)' };
  }

  // Check maximum length
  if (nickname.length > 20) {
    return { valid: false, error: 'Nickname too long (max 20 characters)' };
  }

  // Check for URLs
  const urlPattern = /(https?:\/\/|www\.|\.com|\.net|\.org|\.tw|\.cn)/i;
  if (urlPattern.test(nickname)) {
    return { valid: false, error: 'Nickname cannot contain URLs' };
  }

  return { valid: true };
}

/**
 * Validate gender
 */
export function validateGender(gender: string): { valid: boolean; error?: string } {
  if (gender !== 'male' && gender !== 'female') {
    return { valid: false, error: 'Gender must be "male" or "female"' };
  }

  return { valid: true };
}

/**
 * Validate birthday
 */
export function validateBirthday(birthday: string): { valid: boolean; error?: string } {
  // Check format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(birthday)) {
    return { valid: false, error: 'Birthday must be in YYYY-MM-DD format' };
  }

  // Check if valid date
  const age = calculateAge(birthday);
  if (age === null) {
    return { valid: false, error: 'Invalid birthday date' };
  }

  // Check age requirement
  if (age < MIN_AGE) {
    return { valid: false, error: `You must be at least ${MIN_AGE} years old` };
  }

  // Check if not in future
  if (age < 0) {
    return { valid: false, error: 'Birthday cannot be in the future' };
  }

  // Check reasonable age limit (e.g., max 120 years)
  if (age > 120) {
    return { valid: false, error: 'Invalid birthday (age too high)' };
  }

  return { valid: true };
}

/**
 * Validate MBTI result
 */
export function validateMBTI(mbti: string): { valid: boolean; error?: string } {
  if (!MBTI_TYPES.includes(mbti as (typeof MBTI_TYPES)[number])) {
    return { valid: false, error: 'Invalid MBTI type' };
  }

  return { valid: true };
}

/**
 * Validate bio
 */
export function validateBio(bio: string): { valid: boolean; error?: string } {
  // Allow empty bio
  if (!bio) {
    return { valid: true };
  }

  // Check maximum length (200 characters for bio)
  if (bio.length > 200) {
    return { valid: false, error: 'Bio too long (max 200 characters)' };
  }

  return { valid: true };
}

// ============================================================================
// Invite Code Generation
// ============================================================================

/**
 * Generate a unique invite code
 * Format: XUNNI-XXXXXXXX (8 random alphanumeric characters)
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars (0, O, I, 1)
  let code = 'XUNNI-';

  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return code;
}

/**
 * Validate invite code format
 */
export function validateInviteCode(code: string): boolean {
  return /^XUNNI-[A-Z0-9]{6}$/.test(code);
}

// ============================================================================
// Trust Level Calculation
// ============================================================================

/**
 * Calculate trust level based on user activity
 */
export function calculateTrustLevel(user: User): string {
  // New user
  if (!user.onboarding_completed_at) {
    return 'new';
  }

  // Basic: completed onboarding
  if (user.successful_invites === 0 && user.risk_score === 0) {
    return 'basic';
  }

  // Trusted: has successful invites and low risk score
  if (user.successful_invites >= 3 && user.risk_score < 20) {
    return 'trusted';
  }

  // Verified: VIP or many successful invites
  if (isVIP(user) || user.successful_invites >= 10) {
    return 'verified';
  }

  return 'basic';
}

// ============================================================================
// Ban Status
// ============================================================================

/**
 * Check if user is currently banned
 */
export function isBanned(user: User): boolean {
  if (!user.is_banned) {
    return false;
  }

  // Permanent ban
  if (!user.banned_until) {
    return true;
  }

  // Temporary ban
  const now = new Date();
  const bannedUntil = new Date(user.banned_until);

  return now < bannedUntil;
}

/**
 * Calculate ban duration based on ban count
 * Returns duration in days
 */
export function calculateBanDuration(banCount: number): number | null {
  if (banCount === 1) return 1; // 1 day
  if (banCount === 2) return 7; // 1 week
  if (banCount === 3) return 30; // 1 month
  return null; // Permanent ban
}

// ============================================================================
// Match Preferences
// ============================================================================

export enum UserActivityLevel {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE', // 7-30 days
  DORMANT = 'DORMANT',   // > 30 days
}

/**
 * Get target gender based on user preference or own gender
 */
export function getTargetGender(user: User): 'male' | 'female' | 'any' {
  if (user.match_preference && user.match_preference !== 'any') {
    return user.match_preference;
  }
  // Default opposite gender
  return user.gender === 'male' ? 'female' : 'male';
}
