/**
 * Match Domain Logic
 * Based on @doc/SPEC.md and @doc/MODULE_DESIGN.md
 *
 * Manages bottle matching logic and exclusion rules.
 */

import type { User, Bottle } from '~/types';
import { doesUserMatchBottle, calculateMatchScore } from './bottle';

// ============================================================================
// Match Exclusion Rules
// ============================================================================

/**
 * Check if user should be excluded from matching
 * Based on blocks, bans, and reports
 */
export interface MatchExclusion {
  shouldExclude: boolean;
  reason?: string;
}

/**
 * Check if user is excluded from matching a specific bottle
 */
export function checkMatchExclusion(
  user: User,
  bottle: Bottle,
  exclusionData: {
    isBottleOwner: boolean;
    hasBlockedOwner: boolean;
    isBlockedByOwner: boolean;
    hasReportedOwner: boolean;
    isReportedByOwner: boolean;
    hasChatHistoryWithOwner: boolean;
  }
): MatchExclusion {
  // Cannot match own bottle
  if (exclusionData.isBottleOwner) {
    return {
      shouldExclude: true,
      reason: 'Cannot match your own bottle',
    };
  }

  // Cannot match if user has blocked bottle owner
  if (exclusionData.hasBlockedOwner) {
    return {
      shouldExclude: true,
      reason: 'You have blocked this user',
    };
  }

  // Cannot match if bottle owner has blocked user
  if (exclusionData.isBlockedByOwner) {
    return {
      shouldExclude: true,
      reason: 'This user has blocked you',
    };
  }

  // Cannot match if user has reported bottle owner (within 24 hours)
  if (exclusionData.hasReportedOwner) {
    return {
      shouldExclude: true,
      reason: 'You have reported this user',
    };
  }

  // Cannot match if bottle owner has reported user (within 24 hours)
  if (exclusionData.isReportedByOwner) {
    return {
      shouldExclude: true,
      reason: 'This user has reported you',
    };
  }

  // Cannot match if already had conversation with bottle owner
  if (exclusionData.hasChatHistoryWithOwner) {
    return {
      shouldExclude: true,
      reason: 'You have already chatted with this user',
    };
  }

  return {
    shouldExclude: false,
  };
}

// ============================================================================
// Bottle Matching Algorithm
// ============================================================================

/**
 * Find best matching bottle for a user
 * Returns sorted list of bottles by match score
 */
export function rankBottlesForUser(user: User, bottles: Bottle[]): Bottle[] {
  // Filter bottles that match user criteria
  const matchingBottles = bottles.filter((bottle) => doesUserMatchBottle(user, bottle));

  // Calculate match scores
  const bottlesWithScores = matchingBottles.map((bottle) => ({
    bottle,
    score: calculateMatchScore(user, bottle),
  }));

  // Sort by score (highest first)
  bottlesWithScores.sort((a, b) => b.score - a.score);

  return bottlesWithScores.map((item) => item.bottle);
}

/**
 * Select best bottle from ranked list
 * Returns the first bottle (highest score)
 */
export function selectBestBottle(rankedBottles: Bottle[]): Bottle | null {
  return rankedBottles.length > 0 ? rankedBottles[0] : null;
}

// ============================================================================
// Match Statistics
// ============================================================================

/**
 * Calculate match success rate
 */
export function calculateMatchRate(totalBottles: number, matchedBottles: number): number {
  if (totalBottles === 0) return 0;
  return Math.round((matchedBottles / totalBottles) * 100);
}

/**
 * Calculate average match time (in hours)
 */
export function calculateAverageMatchTime(bottles: Bottle[]): number {
  const matchedBottles = bottles.filter((b) => b.status === 'matched' && b.matched_at);

  if (matchedBottles.length === 0) return 0;

  let totalHours = 0;

  for (const bottle of matchedBottles) {
    const createdAt = new Date(bottle.created_at);
    const matchedAt = new Date(bottle.matched_at!);
    const diffMs = matchedAt.getTime() - createdAt.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    totalHours += diffHours;
  }

  return Math.round((totalHours / matchedBottles.length) * 10) / 10; // Round to 1 decimal
}

// ============================================================================
// Conversation Compatibility
// ============================================================================

/**
 * Calculate compatibility score between two users
 * Used for conversation recommendations
 */
export function calculateCompatibilityScore(userA: User, userB: User): number {
  let score = 0;

  // MBTI compatibility (simplified)
  if (userA.mbti_result && userB.mbti_result) {
    if (userA.mbti_result === userB.mbti_result) {
      score += 10; // Same type
    } else {
      // Check for complementary types (simplified)
      const typeA = userA.mbti_result;
      const typeB = userB.mbti_result;

      // E/I compatibility
      if (typeA[0] !== typeB[0]) score += 5;

      // N/S compatibility
      if (typeA[1] === typeB[1]) score += 5;

      // T/F compatibility
      if (typeA[2] !== typeB[2]) score += 5;

      // J/P compatibility
      if (typeA[3] !== typeB[3]) score += 5;
    }
  }

  // Zodiac compatibility (simplified)
  if (userA.zodiac_sign && userB.zodiac_sign) {
    if (userA.zodiac_sign === userB.zodiac_sign) {
      score += 5;
    }
    // Could add more complex zodiac compatibility logic here
  }

  // Age compatibility
  if (userA.age && userB.age) {
    const ageDiff = Math.abs(userA.age - userB.age);
    if (ageDiff <= 5) {
      score += 10;
    } else if (ageDiff <= 10) {
      score += 5;
    }
  }

  // Language compatibility
  if (userA.language_pref === userB.language_pref) {
    score += 5;
  }

  // Trust level compatibility
  if (userA.trust_level === userB.trust_level) {
    score += 5;
  }

  return score;
}

