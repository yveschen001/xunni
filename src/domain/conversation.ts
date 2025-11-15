/**
 * Conversation Domain Logic
 * 
 * Pure functions for conversation business logic.
 */

export interface Conversation {
  id: number;
  bottle_id: number;
  user_a_id: string;
  user_b_id: string;
  created_at: string;
  last_message_at: string;
  status: 'active' | 'closed' | 'blocked';
  max_rounds?: number;
  a_blocked: number;
  b_blocked: number;
}

export interface ConversationMessage {
  id: number;
  conversation_id: number;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  is_translated: number;
  original_language?: string;
  translated_language?: string;
  created_at: string;
}

/**
 * Check if conversation is active
 */
export function isConversationActive(conversation: Conversation): boolean {
  return conversation.status === 'active';
}

/**
 * Check if user is blocked in conversation
 */
export function isUserBlocked(
  conversation: Conversation,
  userId: string
): boolean {
  if (conversation.user_a_id === userId && conversation.b_blocked === 1) {
    return true; // user_b blocked user_a
  }
  if (conversation.user_b_id === userId && conversation.a_blocked === 1) {
    return true; // user_a blocked user_b
  }
  return false;
}

/**
 * Get the other user in conversation
 */
export function getOtherUserId(
  conversation: Conversation,
  userId: string
): string | null {
  if (conversation.user_a_id === userId) {
    return conversation.user_b_id;
  }
  if (conversation.user_b_id === userId) {
    return conversation.user_a_id;
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

