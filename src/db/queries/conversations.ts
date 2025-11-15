/**
 * Conversation Database Queries
 * Based on @doc/MODULE_DESIGN.md
 */

import type { Conversation, ConversationMessage } from '~/types';
import type { DatabaseClient } from '../client';

// ============================================================================
// Conversation Queries
// ============================================================================

/**
 * Create a new conversation
 */
export async function createConversation(
  db: DatabaseClient,
  data: {
    user_a_telegram_id: string;
    user_b_telegram_id: string;
    bottle_id: number;
  }
): Promise<Conversation> {
  const sql = `
    INSERT INTO conversations (
      user_a_telegram_id, user_b_telegram_id, bottle_id
    )
    VALUES (?, ?, ?)
    RETURNING *
  `;

  const result = await db.queryOne<Conversation>(sql, [
    data.user_a_telegram_id,
    data.user_b_telegram_id,
    data.bottle_id,
  ]);

  if (!result) {
    throw new Error('Failed to create conversation');
  }

  return result;
}

/**
 * Find conversation by ID
 */
export async function findConversationById(
  db: DatabaseClient,
  id: number
): Promise<Conversation | null> {
  const sql = `
    SELECT * FROM conversations
    WHERE id = ?
    LIMIT 1
  `;

  return db.queryOne<Conversation>(sql, [id]);
}

/**
 * Find active conversation between two users
 */
export async function findActiveConversation(
  db: DatabaseClient,
  userATelegramId: string,
  userBTelegramId: string
): Promise<Conversation | null> {
  const sql = `
    SELECT * FROM conversations
    WHERE status = 'active'
      AND (
        (user_a_telegram_id = ? AND user_b_telegram_id = ?)
        OR
        (user_a_telegram_id = ? AND user_b_telegram_id = ?)
      )
    LIMIT 1
  `;

  return db.queryOne<Conversation>(sql, [
    userATelegramId,
    userBTelegramId,
    userBTelegramId,
    userATelegramId,
  ]);
}

/**
 * Find all conversations for a user
 */
export async function findUserConversations(
  db: DatabaseClient,
  telegramId: string,
  status?: string
): Promise<Conversation[]> {
  let sql = `
    SELECT * FROM conversations
    WHERE (user_a_telegram_id = ? OR user_b_telegram_id = ?)
  `;

  const params: unknown[] = [telegramId, telegramId];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY last_message_at DESC, created_at DESC';

  return db.query<Conversation>(sql, params);
}

/**
 * Check if two users have chat history
 */
export async function hasChatHistory(
  db: DatabaseClient,
  userATelegramId: string,
  userBTelegramId: string
): Promise<boolean> {
  const sql = `
    SELECT COUNT(*) as count
    FROM conversations
    WHERE (
      (user_a_telegram_id = ? AND user_b_telegram_id = ?)
      OR
      (user_a_telegram_id = ? AND user_b_telegram_id = ?)
    )
  `;

  const result = await db.queryOne<{ count: number }>(sql, [
    userATelegramId,
    userBTelegramId,
    userBTelegramId,
    userATelegramId,
  ]);

  return (result?.count || 0) > 0;
}

/**
 * Update conversation status
 */
export async function updateConversationStatus(
  db: DatabaseClient,
  conversationId: number,
  status: string
): Promise<void> {
  const sql = `
    UPDATE conversations
    SET status = ?,
        ended_at = CASE WHEN ? IN ('ended', 'blocked') THEN CURRENT_TIMESTAMP ELSE ended_at END
    WHERE id = ?
  `;

  await db.execute(sql, [status, status, conversationId]);
}

/**
 * Update last message time
 */
export async function updateLastMessageTime(
  db: DatabaseClient,
  conversationId: number
): Promise<void> {
  const sql = `
    UPDATE conversations
    SET last_message_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  await db.execute(sql, [conversationId]);
}

/**
 * Get total conversation count
 */
export async function getTotalConversationCount(db: DatabaseClient): Promise<number> {
  const sql = `
    SELECT COUNT(*) as count
    FROM conversations
  `;

  const result = await db.queryOne<{ count: number }>(sql);
  return result?.count || 0;
}

// ============================================================================
// Conversation Message Queries
// ============================================================================

/**
 * Create a conversation message
 */
export async function createConversationMessage(
  db: DatabaseClient,
  data: {
    conversation_id: number;
    sender_telegram_id: string;
    receiver_telegram_id: string;
    original_text: string;
    translated_text?: string;
    translation_provider?: 'openai' | 'google';
    is_blocked_by_ai?: boolean;
    ai_block_reason?: string;
  }
): Promise<ConversationMessage> {
  const sql = `
    INSERT INTO conversation_messages (
      conversation_id, sender_telegram_id, receiver_telegram_id,
      original_text, translated_text, translation_provider,
      is_blocked_by_ai, ai_block_reason
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING *
  `;

  const result = await db.queryOne<ConversationMessage>(sql, [
    data.conversation_id,
    data.sender_telegram_id,
    data.receiver_telegram_id,
    data.original_text,
    data.translated_text || null,
    data.translation_provider || null,
    data.is_blocked_by_ai ? 1 : 0,
    data.ai_block_reason || null,
  ]);

  if (!result) {
    throw new Error('Failed to create conversation message');
  }

  return result;
}

/**
 * Get conversation messages
 */
export async function getConversationMessages(
  db: DatabaseClient,
  conversationId: number,
  limit = 100,
  offset = 0
): Promise<ConversationMessage[]> {
  const sql = `
    SELECT * FROM conversation_messages
    WHERE conversation_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;

  return db.query<ConversationMessage>(sql, [conversationId, limit, offset]);
}

/**
 * Get conversation message count
 */
export async function getConversationMessageCount(
  db: DatabaseClient,
  conversationId: number
): Promise<number> {
  const sql = `
    SELECT COUNT(*) as count
    FROM conversation_messages
    WHERE conversation_id = ?
  `;

  const result = await db.queryOne<{ count: number }>(sql, [conversationId]);
  return result?.count || 0;
}

/**
 * Get today's message count for a conversation
 */
export async function getTodayMessageCount(
  db: DatabaseClient,
  conversationId: number,
  senderTelegramId: string,
  today: string
): Promise<number> {
  const sql = `
    SELECT COUNT(*) as count
    FROM conversation_messages
    WHERE conversation_id = ?
      AND sender_telegram_id = ?
      AND DATE(created_at) = ?
  `;

  const result = await db.queryOne<{ count: number }>(sql, [
    conversationId,
    senderTelegramId,
    today,
  ]);

  return result?.count || 0;
}

/**
 * Get total message count
 */
export async function getTotalMessageCount(db: DatabaseClient): Promise<number> {
  const sql = `
    SELECT COUNT(*) as count
    FROM conversation_messages
  `;

  const result = await db.queryOne<{ count: number }>(sql);
  return result?.count || 0;
}

/**
 * Get new messages count (yesterday)
 */
export async function getNewMessagesCount(db: DatabaseClient, date: string): Promise<number> {
  const sql = `
    SELECT COUNT(*) as count
    FROM conversation_messages
    WHERE DATE(created_at) = ?
  `;

  const result = await db.queryOne<{ count: number }>(sql, [date]);
  return result?.count || 0;
}

/**
 * Delete old conversation messages (keep last 3650 per conversation)
 */
export async function deleteOldConversationMessages(
  db: DatabaseClient,
  conversationId: number,
  keepCount = 3650
): Promise<number> {
  const sql = `
    DELETE FROM conversation_messages
    WHERE conversation_id = ?
      AND id NOT IN (
        SELECT id FROM conversation_messages
        WHERE conversation_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      )
  `;

  const result = await db.execute(sql, [conversationId, conversationId, keepCount]);
  return result.meta.changes;
}

