/**
 * Conversation Identifiers Database Queries
 *
 * Database operations for managing conversation partner identifiers.
 */

import type { DatabaseClient } from '~/db/client';
import { generateNextIdentifier } from '~/domain/conversation_identifier';

export interface ConversationIdentifier {
  id: number;
  user_telegram_id: string;
  partner_telegram_id: string;
  identifier: string;
  first_conversation_id: number;
  created_at: string;
}

export interface ConversationWithIdentifier {
  identifier: string;
  partner_telegram_id: string;
  message_count: number;
  last_message_time: string;
  last_message_preview: string;
}

/**
 * Get or create an identifier for a conversation partner
 *
 * @param db - Database client
 * @param userTelegramId - User's Telegram ID
 * @param partnerTelegramId - Partner's Telegram ID
 * @param conversationId - Conversation ID (used only if creating new identifier)
 * @returns The identifier (e.g., 'A', 'B', 'C')
 */
export async function getOrCreateIdentifier(
  db: DatabaseClient,
  userTelegramId: string,
  partnerTelegramId: string,
  conversationId: number
): Promise<string> {
  // 1. Check if identifier already exists
  const existing = await db.d1
    .prepare(
      'SELECT identifier FROM conversation_identifiers WHERE user_telegram_id = ? AND partner_telegram_id = ?'
    )
    .bind(userTelegramId, partnerTelegramId)
    .first<{ identifier: string }>();

  if (existing) {
    return existing.identifier;
  }

  // 2. Generate new identifier
  const { results: allIdentifiers } = await db.d1
    .prepare(
      'SELECT identifier FROM conversation_identifiers WHERE user_telegram_id = ? ORDER BY identifier'
    )
    .bind(userTelegramId)
    .all<{ identifier: string }>();

  const currentIdentifiers = allIdentifiers.map((r) => r.identifier);
  const newIdentifier = generateNextIdentifier(currentIdentifiers);

  // 3. Save to database
  await db.d1
    .prepare(
      'INSERT INTO conversation_identifiers (user_telegram_id, partner_telegram_id, identifier, first_conversation_id) VALUES (?, ?, ?, ?)'
    )
    .bind(userTelegramId, partnerTelegramId, newIdentifier, conversationId)
    .run();

  return newIdentifier;
}

/**
 * Get identifier by partner Telegram ID
 *
 * @param db - Database client
 * @param userTelegramId - User's Telegram ID
 * @param partnerTelegramId - Partner's Telegram ID
 * @returns The identifier or null if not found
 */
export async function getIdentifierByPartner(
  db: DatabaseClient,
  userTelegramId: string,
  partnerTelegramId: string
): Promise<string | null> {
  const result = await db.d1
    .prepare(
      'SELECT identifier FROM conversation_identifiers WHERE user_telegram_id = ? AND partner_telegram_id = ?'
    )
    .bind(userTelegramId, partnerTelegramId)
    .first<{ identifier: string }>();

  return result?.identifier || null;
}

/**
 * Get partner Telegram ID by identifier
 *
 * @param db - Database client
 * @param userTelegramId - User's Telegram ID
 * @param identifier - Identifier (e.g., 'A', 'B')
 * @returns Partner's Telegram ID or null if not found
 */
export async function getPartnerByIdentifier(
  db: DatabaseClient,
  userTelegramId: string,
  identifier: string
): Promise<string | null> {
  const result = await db.d1
    .prepare(
      'SELECT partner_telegram_id FROM conversation_identifiers WHERE user_telegram_id = ? AND identifier = ?'
    )
    .bind(userTelegramId, identifier.toUpperCase())
    .first<{ partner_telegram_id: string }>();

  return result?.partner_telegram_id || null;
}

/**
 * Get all conversations with identifiers for a user
 *
 * @param db - Database client
 * @param userTelegramId - User's Telegram ID
 * @returns Array of conversations with identifiers and statistics
 */
export async function getAllConversationsWithIdentifiers(
  db: DatabaseClient,
  userTelegramId: string
): Promise<ConversationWithIdentifier[]> {
  const query = `
    SELECT 
      ci.identifier,
      ci.partner_telegram_id,
      COUNT(cm.id) as message_count,
      MAX(cm.created_at) as last_message_time,
      (
        SELECT original_text 
        FROM conversation_messages 
        WHERE conversation_id IN (
          SELECT id FROM conversations 
          WHERE (user_a_telegram_id = ? AND user_b_telegram_id = ci.partner_telegram_id)
             OR (user_b_telegram_id = ? AND user_a_telegram_id = ci.partner_telegram_id)
        )
        ORDER BY created_at DESC 
        LIMIT 1
      ) as last_message_preview
    FROM conversation_identifiers ci
    LEFT JOIN conversations c ON (
      (c.user_a_telegram_id = ? AND c.user_b_telegram_id = ci.partner_telegram_id)
      OR (c.user_b_telegram_id = ? AND c.user_a_telegram_id = ci.partner_telegram_id)
    )
    LEFT JOIN conversation_messages cm ON cm.conversation_id = c.id
    WHERE ci.user_telegram_id = ?
    GROUP BY ci.identifier, ci.partner_telegram_id
    ORDER BY last_message_time DESC
  `;

  const { results } = await db.d1
    .prepare(query)
    .bind(userTelegramId, userTelegramId, userTelegramId, userTelegramId, userTelegramId)
    .all<ConversationWithIdentifier>();

  return results || [];
}

/**
 * Get conversation messages between user and partner
 *
 * @param db - Database client
 * @param userTelegramId - User's Telegram ID
 * @param partnerTelegramId - Partner's Telegram ID
 * @param limit - Maximum number of messages to return (default: 50)
 * @returns Array of messages
 */
export async function getConversationMessages(
  db: DatabaseClient,
  userTelegramId: string,
  partnerTelegramId: string,
  limit: number = 50
): Promise<
  Array<{
    id: number;
    sender_telegram_id: string;
    content: string;
    translated_text: string | null;
    created_at: string;
  }>
> {
  const query = `
    SELECT cm.id, cm.sender_telegram_id, cm.original_text as content, cm.translated_text, cm.created_at
    FROM conversation_messages cm
    JOIN conversations c ON cm.conversation_id = c.id
    WHERE (
      (c.user_a_telegram_id = ? AND c.user_b_telegram_id = ?)
      OR (c.user_b_telegram_id = ? AND c.user_a_telegram_id = ?)
    )
    ORDER BY cm.created_at DESC
    LIMIT ?
  `;

  const { results } = await db.d1
    .prepare(query)
    .bind(userTelegramId, partnerTelegramId, userTelegramId, partnerTelegramId, limit)
    .all();

  return (results || []).reverse() as Array<{
    id: number;
    sender_telegram_id: string;
    content: string;
    translated_text: string | null;
    created_at: string;
  }>;
}

/**
 * Get paginated conversation messages
 */
export async function getConversationMessagesPaginated(
  db: DatabaseClient,
  userTelegramId: string,
  partnerTelegramId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{
  messages: Array<{
    id: number;
    sender_telegram_id: string;
    content: string;
    translated_text: string | null;
    created_at: string;
  }>;
  total: number;
  totalPages: number;
}> {
  const offset = (page - 1) * pageSize;
  
  // Get messages
  const query = `
    SELECT cm.id, cm.sender_telegram_id, cm.original_text as content, cm.translated_text, cm.created_at
    FROM conversation_messages cm
    JOIN conversations c ON cm.conversation_id = c.id
    WHERE (
      (c.user_a_telegram_id = ? AND c.user_b_telegram_id = ?)
      OR (c.user_b_telegram_id = ? AND c.user_a_telegram_id = ?)
    )
    ORDER BY cm.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const { results } = await db.d1
    .prepare(query)
    .bind(userTelegramId, partnerTelegramId, userTelegramId, partnerTelegramId, pageSize, offset)
    .all();

  const messages = (results || []).reverse() as Array<{
    id: number;
    sender_telegram_id: string;
    content: string;
    translated_text: string | null;
    created_at: string;
  }>;

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM conversation_messages cm
    JOIN conversations c ON cm.conversation_id = c.id
    WHERE (
      (c.user_a_telegram_id = ? AND c.user_b_telegram_id = ?)
      OR (c.user_b_telegram_id = ? AND c.user_a_telegram_id = ?)
    )
  `;

  const countResult = await db.d1
    .prepare(countQuery)
    .bind(userTelegramId, partnerTelegramId, userTelegramId, partnerTelegramId)
    .first<{ total: number }>();

  const total = countResult?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  return {
    messages,
    total,
    totalPages
  };
}

/**
 * Get conversation statistics
 *
 * @param db - Database client
 * @param userTelegramId - User's Telegram ID
 * @param partnerTelegramId - Partner's Telegram ID
 * @returns Conversation statistics
 */
export async function getConversationStats(
  db: DatabaseClient,
  userTelegramId: string,
  partnerTelegramId: string
): Promise<{
  total_messages: number;
  user_messages: number;
  partner_messages: number;
  first_message_time: string | null;
  last_message_time: string | null;
}> {
  const query = `
    SELECT 
      COUNT(*) as total_messages,
      SUM(CASE WHEN cm.sender_telegram_id = ? THEN 1 ELSE 0 END) as user_messages,
      SUM(CASE WHEN cm.sender_telegram_id = ? THEN 1 ELSE 0 END) as partner_messages,
      MIN(cm.created_at) as first_message_time,
      MAX(cm.created_at) as last_message_time
    FROM conversation_messages cm
    JOIN conversations c ON cm.conversation_id = c.id
    WHERE (
      (c.user_a_telegram_id = ? AND c.user_b_telegram_id = ?)
      OR (c.user_b_telegram_id = ? AND c.user_a_telegram_id = ?)
    )
  `;

  const result = await db.d1
    .prepare(query)
    .bind(
      userTelegramId,
      partnerTelegramId,
      userTelegramId,
      partnerTelegramId,
      userTelegramId,
      partnerTelegramId
    )
    .first<{
      total_messages: number;
      user_messages: number;
      partner_messages: number;
      first_message_time: string | null;
      last_message_time: string | null;
    }>();

  return (
    result || {
      total_messages: 0,
      user_messages: 0,
      partner_messages: 0,
      first_message_time: null,
      last_message_time: null,
    }
  );
}
