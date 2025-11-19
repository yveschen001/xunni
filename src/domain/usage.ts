/**
 * Usage Domain Logic
 * Based on @doc/SPEC.md and @doc/MODULE_DESIGN.md
 *
 * Manages daily usage limits for bottles and conversations.
 */

import type { User, DailyUsage } from '~/types';
import { isVIP } from './user';

// ============================================================================
// Constants
// ============================================================================

// Free user limits
export const FREE_BASE_DAILY_BOTTLES = 3;
export const FREE_MAX_DAILY_BOTTLES = 10; // With invites

// VIP user limits
export const VIP_BASE_DAILY_BOTTLES = 30;
export const VIP_MAX_DAILY_BOTTLES = 100; // With invites

// Bonus per successful invite
export const BOTTLES_PER_INVITE = 1;

// Conversation limits
export const MAX_MESSAGES_PER_CONVERSATION = 3650;
export const FREE_DAILY_MESSAGES_PER_CONVERSATION = 10; // Free users: 10 messages per day per conversation
export const VIP_DAILY_MESSAGES_PER_CONVERSATION = 100; // VIP users: 100 messages per day per conversation

// ============================================================================
// Daily Bottle Limits
// ============================================================================

/**
 * Calculate daily throw limit for a user
 */
export function getDailyThrowLimit(user: User): number {
  const baseLimit = isVIP(user) ? VIP_BASE_DAILY_BOTTLES : FREE_BASE_DAILY_BOTTLES;
  const maxLimit = isVIP(user) ? VIP_MAX_DAILY_BOTTLES : FREE_MAX_DAILY_BOTTLES;

  const bonusBottles = user.successful_invites * BOTTLES_PER_INVITE;
  const totalLimit = baseLimit + bonusBottles;

  return Math.min(totalLimit, maxLimit);
}

/**
 * Check if user can throw a bottle today
 */
export function canThrowBottle(user: User, usage: DailyUsage | null): boolean {
  const limit = getDailyThrowLimit(user);
  const currentCount = usage?.throws_count ?? 0;

  return currentCount < limit;
}

/**
 * Get remaining throws for today
 */
export function getRemainingThrows(user: User, usage: DailyUsage | null): number {
  const limit = getDailyThrowLimit(user);
  const currentCount = usage?.throws_count ?? 0;

  return Math.max(0, limit - currentCount);
}

// ============================================================================
// Conversation Message Limits
// ============================================================================

/**
 * Get daily message limit for a conversation based on user VIP status
 */
export function getConversationDailyLimit(user: User): number {
  return isVIP(user) ? VIP_DAILY_MESSAGES_PER_CONVERSATION : FREE_DAILY_MESSAGES_PER_CONVERSATION;
}

/**
 * Check if user can send a message in a conversation
 */
export function canSendConversationMessage(
  user: User,
  messageCount: number,
  todayMessageCount: number
): boolean {
  // Check total message limit per conversation
  if (messageCount >= MAX_MESSAGES_PER_CONVERSATION) {
    return false;
  }

  // Check daily message limit per conversation (VIP-aware)
  const dailyLimit = getConversationDailyLimit(user);
  if (todayMessageCount >= dailyLimit) {
    return false;
  }

  return true;
}

/**
 * Get remaining messages for a conversation
 */
export function getRemainingMessages(
  user: User,
  messageCount: number,
  todayMessageCount: number
): {
  total: number;
  today: number;
} {
  const dailyLimit = getConversationDailyLimit(user);
  return {
    total: Math.max(0, MAX_MESSAGES_PER_CONVERSATION - messageCount),
    today: Math.max(0, dailyLimit - todayMessageCount),
  };
}

// ============================================================================
// Date Utilities
// ============================================================================

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Check if a date string is today
 */
export function isToday(dateString: string): boolean {
  return dateString === getTodayDate();
}

// ============================================================================
// Usage Statistics
// ============================================================================

/**
 * Calculate usage percentage
 */
export function getUsagePercentage(current: number, limit: number): number {
  if (limit === 0) return 0;
  return Math.min(100, Math.round((current / limit) * 100));
}

/**
 * Get usage status message
 */
export function getUsageStatus(
  user: User,
  usage: DailyUsage | null
): {
  limit: number;
  used: number;
  remaining: number;
  percentage: number;
  canThrow: boolean;
} {
  const limit = getDailyThrowLimit(user);
  const used = usage?.throws_count ?? 0;
  const remaining = getRemainingThrows(user, usage);
  const percentage = getUsagePercentage(used, limit);
  const canThrow = canThrowBottle(user, usage);

  return {
    limit,
    used,
    remaining,
    percentage,
    canThrow,
  };
}
