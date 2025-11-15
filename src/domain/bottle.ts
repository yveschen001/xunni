/**
 * Bottle Domain Logic
 * Based on @doc/SPEC.md and @doc/MODULE_DESIGN.md
 *
 * Manages bottle creation, matching, and expiration logic.
 */

import type { Bottle, User, MatchCriteria } from '~/types';
import { isVIP } from './user';

// ============================================================================
// Constants
// ============================================================================

export const MAX_BOTTLE_CONTENT_LENGTH = 500;
export const BOTTLE_EXPIRATION_HOURS = 24;

// ============================================================================
// Bottle Creation Validation
// ============================================================================

/**
 * Validate bottle content
 */
export function validateBottleContent(content: string): { valid: boolean; error?: string } {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'Bottle content cannot be empty' };
  }

  if (content.length > MAX_BOTTLE_CONTENT_LENGTH) {
    return {
      valid: false,
      error: `Content too long (max ${MAX_BOTTLE_CONTENT_LENGTH} characters)`,
    };
  }

  return { valid: true };
}

/**
 * Check if user can set advanced filters (VIP only)
 */
export function canSetAdvancedFilters(user: User): boolean {
  return isVIP(user);
}

/**
 * Validate bottle matching criteria
 */
export function validateMatchCriteria(
  user: User,
  criteria: Partial<MatchCriteria>
): { valid: boolean; error?: string } {
  // Free users can only set target gender
  if (!isVIP(user)) {
    if (criteria.zodiac_signs || criteria.mbti_types || criteria.min_age || criteria.max_age) {
      return {
        valid: false,
        error: 'Advanced filters (zodiac, MBTI, age) are only available for VIP users',
      };
    }
  }

  // Validate age range
  if (criteria.min_age !== undefined && criteria.max_age !== undefined) {
    if (criteria.min_age > criteria.max_age) {
      return { valid: false, error: 'Minimum age cannot be greater than maximum age' };
    }

    if (criteria.min_age < 18) {
      return { valid: false, error: 'Minimum age must be at least 18' };
    }

    if (criteria.max_age > 120) {
      return { valid: false, error: 'Maximum age cannot exceed 120' };
    }
  }

  return { valid: true };
}

// ============================================================================
// Bottle Expiration
// ============================================================================

/**
 * Calculate bottle expiration time
 */
export function calculateBottleExpiration(): string {
  const now = new Date();
  now.setHours(now.getHours() + BOTTLE_EXPIRATION_HOURS);
  return now.toISOString();
}

/**
 * Check if bottle is expired
 */
export function isBottleExpired(bottle: Bottle): boolean {
  if (!bottle.expires_at) {
    return false;
  }

  const now = new Date();
  const expiresAt = new Date(bottle.expires_at);

  return now >= expiresAt;
}

/**
 * Check if bottle is still available for matching
 */
export function isBottleAvailable(bottle: Bottle): boolean {
  return bottle.status === 'pending' && !isBottleExpired(bottle);
}

// ============================================================================
// Bottle Matching Logic
// ============================================================================

/**
 * Check if a user matches bottle criteria
 */
export function doesUserMatchBottle(user: User, bottle: Bottle): boolean {
  // Check gender match
  if (bottle.target_gender && user.gender !== bottle.target_gender) {
    return false;
  }

  // Check age range
  if (user.age !== undefined) {
    if (bottle.target_min_age !== undefined && user.age < bottle.target_min_age) {
      return false;
    }

    if (bottle.target_max_age !== undefined && user.age > bottle.target_max_age) {
      return false;
    }
  }

  // Check zodiac filter
  if (bottle.target_zodiac_filter) {
    try {
      const zodiacFilter = JSON.parse(bottle.target_zodiac_filter);
      if (Array.isArray(zodiacFilter) && zodiacFilter.length > 0) {
        if (!user.zodiac_sign || !zodiacFilter.includes(user.zodiac_sign)) {
          return false;
        }
      }
    } catch (e) {
      // Invalid JSON, ignore filter
    }
  }

  // Check MBTI filter
  if (bottle.target_mbti_filter) {
    try {
      const mbtiFilter = JSON.parse(bottle.target_mbti_filter);
      if (Array.isArray(mbtiFilter) && mbtiFilter.length > 0) {
        if (!user.mbti_result || !mbtiFilter.includes(user.mbti_result)) {
          return false;
        }
      }
    } catch (e) {
      // Invalid JSON, ignore filter
    }
  }

  // Check anti-fraud requirement
  if (bottle.require_anti_fraud && (!user.anti_fraud_completed_at || user.anti_fraud_score < 60)) {
    return false;
  }

  return true;
}

/**
 * Calculate match score between user and bottle
 * Higher score = better match
 */
export function calculateMatchScore(user: User, bottle: Bottle): number {
  let score = 0;

  // Base score
  score += 10;

  // Gender match (high priority)
  if (bottle.target_gender && user.gender === bottle.target_gender) {
    score += 20;
  }

  // Age match (medium priority)
  if (user.age !== undefined) {
    if (bottle.target_min_age !== undefined && bottle.target_max_age !== undefined) {
      const midAge = (bottle.target_min_age + bottle.target_max_age) / 2;
      const ageDiff = Math.abs(user.age - midAge);
      score += Math.max(0, 15 - ageDiff); // Closer to mid-age = higher score
    }
  }

  // Zodiac match (low priority)
  if (bottle.target_zodiac_filter && user.zodiac_sign) {
    try {
      const zodiacFilter = JSON.parse(bottle.target_zodiac_filter);
      if (Array.isArray(zodiacFilter) && zodiacFilter.includes(user.zodiac_sign)) {
        score += 10;
      }
    } catch (e) {
      // Invalid JSON, ignore
    }
  }

  // MBTI match (low priority)
  if (bottle.target_mbti_filter && user.mbti_result) {
    try {
      const mbtiFilter = JSON.parse(bottle.target_mbti_filter);
      if (Array.isArray(mbtiFilter) && mbtiFilter.includes(user.mbti_result)) {
        score += 10;
      }
    } catch (e) {
      // Invalid JSON, ignore
    }
  }

  // Anti-fraud bonus
  if (user.anti_fraud_score >= 80) {
    score += 5;
  }

  // Trust level bonus
  if (user.trust_level === 'verified') {
    score += 5;
  } else if (user.trust_level === 'trusted') {
    score += 3;
  }

  return score;
}

// ============================================================================
// Bottle Status
// ============================================================================

/**
 * Check if bottle can be matched
 */
export function canMatchBottle(bottle: Bottle): boolean {
  return bottle.status === 'pending' && !isBottleExpired(bottle);
}

/**
 * Check if bottle should be auto-expired
 */
export function shouldAutoExpireBottle(bottle: Bottle): boolean {
  return bottle.status === 'pending' && isBottleExpired(bottle);
}

