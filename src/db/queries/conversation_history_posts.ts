/**
 * Conversation History Posts Queries
 * 
 * Manages history posts and new message posts for conversations
 */

import type { DatabaseClient } from '~/db/client';

export interface HistoryPost {
  id: number;
  conversation_id: number;
  user_telegram_id: string;
  identifier: string;
  post_number: number;
  telegram_message_id: number;
  content: string;
  char_count: number;
  message_count: number;
  is_latest: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewMessagePost {
  id: number;
  conversation_id: number;
  user_telegram_id: string;
  identifier: string;
  telegram_message_id: number;
  last_message_content: string | null;
  last_message_time: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get the latest history post for a conversation
 */
export async function getLatestHistoryPost(
  db: DatabaseClient,
  conversationId: number,
  userTelegramId: string
): Promise<HistoryPost | null> {
  const result = await db.d1
    .prepare(
      `SELECT * FROM conversation_history_posts 
       WHERE conversation_id = ? AND user_telegram_id = ? AND is_latest = 1 
       ORDER BY post_number DESC LIMIT 1`
    )
    .bind(conversationId, userTelegramId)
    .first<HistoryPost>();

  return result || null;
}

/**
 * Create a new history post
 */
export async function createHistoryPost(
  db: DatabaseClient,
  conversationId: number,
  userTelegramId: string,
  identifier: string,
  postNumber: number,
  telegramMessageId: number,
  content: string,
  charCount: number,
  messageCount: number
): Promise<number> {
  // Set all existing posts for this conversation to not latest
  await db.d1
    .prepare(
      `UPDATE conversation_history_posts 
       SET is_latest = 0 
       WHERE conversation_id = ? AND user_telegram_id = ?`
    )
    .bind(conversationId, userTelegramId)
    .run();

  // Create new post
  const result = await db.d1
    .prepare(
      `INSERT INTO conversation_history_posts 
       (conversation_id, user_telegram_id, identifier, post_number, telegram_message_id, content, char_count, message_count, is_latest) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`
    )
    .bind(
      conversationId,
      userTelegramId,
      identifier,
      postNumber,
      telegramMessageId,
      content,
      charCount,
      messageCount
    )
    .run();

  return result.meta.last_row_id as number;
}

/**
 * Update an existing history post
 */
export async function updateHistoryPost(
  db: DatabaseClient,
  postId: number,
  content: string,
  charCount: number,
  messageCount: number
): Promise<void> {
  await db.d1
    .prepare(
      `UPDATE conversation_history_posts 
       SET content = ?, char_count = ?, message_count = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`
    )
    .bind(content, charCount, messageCount, postId)
    .run();
}

/**
 * Get all history posts for a conversation (for pagination)
 */
export async function getAllHistoryPosts(
  db: DatabaseClient,
  conversationId: number,
  userTelegramId: string
): Promise<HistoryPost[]> {
  const { results } = await db.d1
    .prepare(
      `SELECT * FROM conversation_history_posts 
       WHERE conversation_id = ? AND user_telegram_id = ? 
       ORDER BY post_number ASC`
    )
    .bind(conversationId, userTelegramId)
    .all<HistoryPost>();

  return results;
}

/**
 * Get new message post for a conversation
 */
export async function getNewMessagePost(
  db: DatabaseClient,
  conversationId: number,
  userTelegramId: string
): Promise<NewMessagePost | null> {
  const result = await db.d1
    .prepare(
      `SELECT * FROM conversation_new_message_posts 
       WHERE conversation_id = ? AND user_telegram_id = ?`
    )
    .bind(conversationId, userTelegramId)
    .first<NewMessagePost>();

  return result || null;
}

/**
 * Create or update new message post
 */
export async function upsertNewMessagePost(
  db: DatabaseClient,
  conversationId: number,
  userTelegramId: string,
  identifier: string,
  telegramMessageId: number,
  messageContent: string,
  messageTime: Date
): Promise<void> {
  const timeStr = messageTime.toISOString();
  
  await db.d1
    .prepare(
      `INSERT INTO conversation_new_message_posts 
       (conversation_id, user_telegram_id, identifier, telegram_message_id, last_message_content, last_message_time) 
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(conversation_id, user_telegram_id) 
       DO UPDATE SET 
         telegram_message_id = excluded.telegram_message_id,
         last_message_content = excluded.last_message_content,
         last_message_time = excluded.last_message_time,
         updated_at = CURRENT_TIMESTAMP`
    )
    .bind(conversationId, userTelegramId, identifier, telegramMessageId, messageContent, timeStr)
    .run();
}

/**
 * Delete new message post
 */
export async function deleteNewMessagePost(
  db: DatabaseClient,
  conversationId: number,
  userTelegramId: string
): Promise<void> {
  await db.d1
    .prepare(
      `DELETE FROM conversation_new_message_posts 
       WHERE conversation_id = ? AND user_telegram_id = ?`
    )
    .bind(conversationId, userTelegramId)
    .run();
}

