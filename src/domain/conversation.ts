/**
 * Conversation Domain Logic
 *
 * Pure functions for conversation business logic.
 */

import type { Conversation } from '~/types';

export type { Conversation } from '~/types';

/**
 * Check if conversation is active
 */
export function isConversationActive(conversation: Conversation): boolean {
  return conversation.status === 'active';
}

/**
 * Get the other user in conversation
 */
export function getOtherUserId(
  conversation: Conversation,
  userId: string
): string | null {
  if (conversation.user_a_telegram_id === userId) {
    return conversation.user_b_telegram_id;
  }
  if (conversation.user_b_telegram_id === userId) {
    return conversation.user_a_telegram_id;
  }
  return null;
}

/**
 * Validate message content
 */
export function validateMessageContent(content: string): {
  valid: boolean;
  error?: string;
} {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  if (content.length > 1000) {
    return { valid: false, error: 'Message too long (max 1000 characters)' };
  }

  return { valid: true };
}

