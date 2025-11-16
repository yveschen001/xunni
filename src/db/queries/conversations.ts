/**
 * Conversation Database Queries
 */

import type { DatabaseClient } from '../client';
import type { Conversation } from '~/domain/conversation';

/**
 * Create a new conversation
 */
export async function createConversation(
  db: DatabaseClient,
  bottleId: number,
  userAId: string,
  userBId: string
): Promise<number> {
  const result = await db.d1.prepare(`
    INSERT INTO conversations (
      bottle_id,
      user_a_id,
      user_b_id,
      created_at,
      last_message_at,
      status,
      a_blocked,
      b_blocked
    ) VALUES (?, ?, ?, datetime('now'), datetime('now'), 'active', 0, 0)
  `).bind(bottleId, userAId, userBId).run();

  return result.meta.last_row_id as number;
}

/**
 * Get active conversation for user
 */
export async function getActiveConversation(
  db: DatabaseClient,
  userId: string
): Promise<Conversation | null> {
  const result = await db.d1.prepare(`
    SELECT * FROM conversations
    WHERE (user_a_id = ? OR user_b_id = ?)
      AND status = 'active'
    ORDER BY last_message_at DESC
    LIMIT 1
  `).bind(userId, userId).first();

  return result as Conversation | null;
}

/**
 * Get conversation by ID
 */
export async function getConversationById(
  db: DatabaseClient,
  conversationId: number
): Promise<Conversation | null> {
  const result = await db.d1.prepare(`
    SELECT * FROM conversations WHERE id = ?
  `).bind(conversationId).first();

  return result as Conversation | null;
}

/**
 * End conversation
 */
export async function endConversation(
  db: DatabaseClient,
  conversationId: number
): Promise<void> {
  await db.d1.prepare(`
    UPDATE conversations
    SET status = 'ended',
        ended_at = datetime('now')
    WHERE id = ?
  `).bind(conversationId).run();
}

/**
 * Save conversation message
 */
export async function saveConversationMessage(
  db: DatabaseClient,
  conversationId: number,
  senderId: string,
  receiverId: string,
  messageText: string,
  isTranslated: boolean = false,
  originalLanguage?: string,
  translatedLanguage?: string
): Promise<number> {
  const result = await db.d1.prepare(`
    INSERT INTO conversation_messages (
      conversation_id,
      sender_id,
      receiver_id,
      message_text,
      is_translated,
      original_language,
      translated_language,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(
    conversationId,
    senderId,
    receiverId,
    messageText,
    isTranslated ? 1 : 0,
    originalLanguage || null,
    translatedLanguage || null
  ).run();

  // Update last_message_at
  await db.d1.prepare(`
    UPDATE conversations
    SET last_message_at = datetime('now')
    WHERE id = ?
  `).bind(conversationId).run();

  return result.meta.last_row_id as number;
}

/**
 * Create bottle chat history record
 */
export async function createBottleChatHistory(
  db: DatabaseClient,
  bottleId: number,
  conversationId: number,
  userAId: string,
  userBId: string,
  bottleContent: string
): Promise<void> {
  await db.d1.prepare(`
    INSERT INTO bottle_chat_history (
      bottle_id,
      conversation_id,
      user_a_id,
      user_b_id,
      bottle_content,
      first_message_at,
      last_message_at,
      total_messages,
      status,
      created_at
    ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'), 0, 'active', datetime('now'))
  `).bind(bottleId, conversationId, userAId, userBId, bottleContent).run();
}

/**
 * Update bottle chat history
 */
export async function updateBottleChatHistory(
  db: DatabaseClient,
  conversationId: number
): Promise<void> {
  await db.d1.prepare(`
    UPDATE bottle_chat_history
    SET last_message_at = datetime('now'),
        total_messages = total_messages + 1
    WHERE conversation_id = ?
  `).bind(conversationId).run();
}
