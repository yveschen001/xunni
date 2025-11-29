/**
 * Chats Handler
 *
 * Handles /chats command - List user conversations with identifiers.
 * Optimized with pagination and batch queries.
 */

import type { Env, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { getOrCreateIdentifier } from '~/db/queries/conversation_identifiers';
import { formatIdentifier } from '~/domain/conversation_identifier';
import { maskNickname } from '~/domain/invite';
import { createI18n } from '~/i18n';

const PAGE_SIZE = 10;

export async function handleChats(
  message: TelegramMessage | { chat: { id: number }; from: { id: number } },
  env: Env,
  page: number = 0
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // Get user and i18n
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      const i18n = createI18n('zh-TW');
      await telegram.sendMessage(chatId, i18n.t('errors.userNotFoundRegister'));
      return;
    }

    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Check if user completed onboarding
    if (user.onboarding_step !== 'completed') {
      await telegram.sendMessage(chatId, i18n.t('onboarding.notCompleted'));
      return;
    }

    // Get total count for pagination
    const totalResult = await db.d1
      .prepare(
        `SELECT COUNT(*) as total 
         FROM conversations 
         WHERE user_a_telegram_id = ? OR user_b_telegram_id = ?`
      )
      .bind(telegramId, telegramId)
      .first<{ total: number }>();

    const total = totalResult?.total || 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);

    if (total === 0) {
      await telegram.sendMessageWithButtons(
        chatId,
        i18n.t('conversation.conversation5') +
          '\n\n' +
          i18n.t('conversation.conversation10') +
          '\n\n' +
          i18n.t('bottle.bottle13'),
        [[{ text: i18n.t('common.back3'), callback_data: 'return_to_menu' }]]
      );
      return;
    }

    // Get conversations with pagination
    const offset = page * PAGE_SIZE;
    const conversations = await getUserConversationsWithPartners(db, telegramId, PAGE_SIZE, offset);

    if (conversations.length === 0) {
      // If page is out of range, go to first page
      if (page > 0) {
        return handleChats(message, env, 0);
      }
      await telegram.sendMessageWithButtons(
        chatId,
        i18n.t('conversation.conversation5') +
          '\n\n' +
          i18n.t('conversation.conversation10') +
          '\n\n' +
          i18n.t('bottle.bottle13'),
        [[{ text: i18n.t('common.back3'), callback_data: 'return_to_menu' }]]
      );
      return;
    }

    // Extract partner IDs for batch query
    const partnerIds = conversations.map((conv) =>
      conv.user_a_telegram_id === telegramId ? conv.user_b_telegram_id : conv.user_a_telegram_id
    );

    // Batch query identifiers (protection: only query existing ones)
    const identifierMap = await getIdentifiersBatch(db, telegramId, partnerIds);

    // Batch query partners (protection: handle failures gracefully)
    const partnerMap = await getPartnersBatch(db, partnerIds);

    // Format conversations list
    let messageText =
      i18n.t('conversation.conversation2', { conversations: { length: total } }) + '\n\n';

    // Show page info if multiple pages
    if (totalPages > 1) {
      messageText += i18n.t('common.pageInfo', { page: page + 1, totalPages }) + '\n\n';
    }

    for (const conv of conversations) {
      const partnerTelegramId =
        conv.user_a_telegram_id === telegramId ? conv.user_b_telegram_id : conv.user_a_telegram_id;

      // Protection: Try batch query first, then create if needed
      let identifier = identifierMap.get(partnerTelegramId);
      if (!identifier) {
        identifier = await getOrCreateIdentifier(db, telegramId, partnerTelegramId, conv.id);
      }
      const formattedId = formatIdentifier(identifier);

      // Protection: Get partner from batch query, fallback to "Unknown"
      const partner = partnerMap.get(partnerTelegramId);
      const partnerNickname = partner
        ? maskNickname(partner.nickname || partner.username || '')
        : i18n.t('conversation.short2');

      const statusEmoji = conv.status === 'active' ? '✅' : '⏸️';
      const lastMessageTime = conv.last_message_at
        ? formatRelativeTime(new Date(conv.last_message_at), i18n)
        : i18n.t('conversation.message77');

      messageText +=
        `${statusEmoji} **${partnerNickname}** ${formattedId}\n` +
        i18n.t('conversation.message7', { conv: { message_count: conv.message_count } }) +
        '\n' +
        i18n.t('conversation.message11', { lastMessageTime }) +
        '\n\n';
    }

    messageText +=
      `━━━━━━━━━━━━━━━━\n` +
      i18n.t('conversation.conversation3') +
      '\n' +
      i18n.t('conversation.stats');

    // Build pagination buttons
    const buttons: Array<Array<{ text: string; callback_data: string }>> = [];
    if (totalPages > 1) {
      const pageButtons: Array<{ text: string; callback_data: string }> = [];
      if (page > 0) {
        pageButtons.push({ text: i18n.t('common.prev'), callback_data: `chats_page_${page - 1}` });
      }
      if (page < totalPages - 1) {
        pageButtons.push({
          text: i18n.t('common.next'),
          callback_data: `chats_page_${page + 1}`,
        });
      }
      if (pageButtons.length > 0) {
        buttons.push(pageButtons);
      }
    }
    buttons.push([{ text: i18n.t('common.back3'), callback_data: 'return_to_menu' }]);

    // Send message with pagination buttons
    await telegram.sendMessageWithButtons(chatId, messageText, buttons);
  } catch (error) {
    console.error('[handleChats] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.sendMessage(chatId, errorI18n.t('errors.systemErrorRetry'));
  }
}

/**
 * Get user conversations with partner info (optimized)
 * Uses last_message_at field if available, falls back to MAX(cm.created_at)
 */
async function getUserConversationsWithPartners(
  db: ReturnType<typeof createDatabaseClient>,
  telegramId: string,
  limit: number = PAGE_SIZE,
  offset: number = 0
): Promise<
  Array<{
    id: number;
    user_a_telegram_id: string;
    user_b_telegram_id: string;
    status: string;
    message_count: number;
    last_message_at: string | null;
    created_at: string;
  }>
> {
  try {
    // Try optimized query using last_message_at field
    // Protection: This field is updated by saveConversationMessage, so it's accurate
    const result = await db.d1
      .prepare(
        `
      SELECT 
        c.id,
        c.user_a_telegram_id,
        c.user_b_telegram_id,
        c.status,
        c.last_message_at,
        c.created_at,
        (
          SELECT COUNT(*) 
          FROM conversation_messages 
          WHERE conversation_id = c.id
        ) as message_count
      FROM conversations c
      WHERE c.user_a_telegram_id = ? OR c.user_b_telegram_id = ?
      ORDER BY COALESCE(c.last_message_at, c.created_at) DESC, c.created_at DESC
      LIMIT ? OFFSET ?
    `
      )
      .bind(telegramId, telegramId, limit, offset)
      .all();

    return result.results as any[];
  } catch (error) {
    // Protection: Fallback to original query if optimized query fails
    console.error(
      '[getUserConversationsWithPartners] Optimized query failed, falling back:',
      error
    );
    return getUserConversationsWithPartnersOriginal(db, telegramId, limit, offset);
  }
}

/**
 * Original query implementation (fallback)
 */
async function getUserConversationsWithPartnersOriginal(
  db: ReturnType<typeof createDatabaseClient>,
  telegramId: string,
  limit: number = PAGE_SIZE,
  offset: number = 0
): Promise<
  Array<{
    id: number;
    user_a_telegram_id: string;
    user_b_telegram_id: string;
    status: string;
    message_count: number;
    last_message_at: string | null;
    created_at: string;
  }>
> {
  const result = await db.d1
    .prepare(
      `
    SELECT 
      c.id,
      c.user_a_telegram_id,
      c.user_b_telegram_id,
      c.status,
      COUNT(cm.id) as message_count,
      MAX(cm.created_at) as last_message_at,
      c.created_at
    FROM conversations c
    LEFT JOIN conversation_messages cm ON cm.conversation_id = c.id
    WHERE c.user_a_telegram_id = ? OR c.user_b_telegram_id = ?
    GROUP BY c.id
    ORDER BY MAX(cm.created_at) DESC, c.created_at DESC
    LIMIT ? OFFSET ?
  `
    )
    .bind(telegramId, telegramId, limit, offset)
    .all();

  return result.results as any[];
}

/**
 * Batch query identifiers (protection: only query existing ones)
 */
async function getIdentifiersBatch(
  db: ReturnType<typeof createDatabaseClient>,
  userTelegramId: string,
  partnerIds: string[]
): Promise<Map<string, string>> {
  if (partnerIds.length === 0) return new Map();

  try {
    const result = await db.d1
      .prepare(
        `
        SELECT partner_telegram_id, identifier
        FROM conversation_identifiers
        WHERE user_telegram_id = ? 
          AND partner_telegram_id IN (${partnerIds.map(() => '?').join(',')})
      `
      )
      .bind(userTelegramId, ...partnerIds)
      .all<{ partner_telegram_id: string; identifier: string }>();

    return new Map(result.results.map((r) => [r.partner_telegram_id, r.identifier]));
  } catch (error) {
    console.error('[getIdentifiersBatch] Error:', error);
    return new Map();
  }
}

/**
 * Batch query partners (protection: handle failures gracefully)
 */
async function getPartnersBatch(
  db: ReturnType<typeof createDatabaseClient>,
  partnerIds: string[]
): Promise<Map<string, any>> {
  if (partnerIds.length === 0) return new Map();

  try {
    const result = await db.d1
      .prepare(
        `
        SELECT telegram_id, nickname, username
        FROM users
        WHERE telegram_id IN (${partnerIds.map(() => '?').join(',')})
      `
      )
      .bind(...partnerIds)
      .all();

    return new Map(result.results.map((p: any) => [p.telegram_id, p]));
  } catch (error) {
    console.error('[getPartnersBatch] Error:', error);
    // Protection: Return empty Map on failure, will fallback to individual queries
    return new Map();
  }
}

/**
 * Format relative time
 */
function formatRelativeTime(date: Date, i18n: ReturnType<typeof createI18n>): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return i18n.t('conversation.short3');
  } else if (diffMins < 60) {
    return i18n.t('conversation.text14', { diffMins });
  } else if (diffHours < 24) {
    return i18n.t('conversation.text12', { diffHours });
  } else if (diffDays < 7) {
    return i18n.t('conversation.text17', { diffDays });
  } else {
    const userLang = (i18n as any).locale || 'zh-TW';
    return date.toLocaleDateString(userLang);
  }
}
