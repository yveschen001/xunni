/**
 * History Handler
 *
 * Handles /history command - View conversation history with identifiers.
 */

import type { Env, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import {
  getAllConversationsWithIdentifiers,
  getPartnerByIdentifier,
  getConversationMessages,
  getConversationStats,
} from '~/db/queries/conversation_identifiers';
import { formatIdentifier, parseIdentifier } from '~/domain/conversation_identifier';
import { createI18n } from '~/i18n';

/**
 * Handle /history command
 */
export async function handleHistory(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      await telegram.sendMessage(chatId, '❌ 用戶不存在，請先使用 /start 註冊。');
      return;
    }

    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Check if user completed onboarding
    if (user.onboarding_step !== 'completed') {
      await telegram.sendMessage(chatId, '❌ 請先完成註冊流程。\n\n使用 /start 繼續註冊。');
      return;
    }

    // Parse command arguments
    const args = message.text?.split(' ');
    const searchIdentifier = args && args.length > 1 ? parseIdentifier(args[1]) : null;

    if (searchIdentifier) {
      // Show specific conversation
      await showConversationByIdentifier(db, telegram, chatId, telegramId, searchIdentifier, i18n);
    } else {
      // Show all conversations
      await showAllConversations(db, telegram, chatId, telegramId, i18n);
    }
  } catch (error) {
    console.error('[handleHistory] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤，請稍後再試。');
  }
}

/**
 * Show all conversations with identifiers
 */
async function showAllConversations(
  db: DatabaseClient,
  telegram: ReturnType<typeof createTelegramService>,
  chatId: number,
  telegramId: string,
  _i18n: ReturnType<typeof createI18n>
): Promise<void> {
  const conversations = await getAllConversationsWithIdentifiers(db, telegramId);

  if (conversations.length === 0) {
    await telegram.sendMessage(
      chatId,
      '💬 你還沒有任何對話記錄\n\n' + '快去丟瓶子認識新朋友吧！ /throw\n\n' + '🏠 返回主選單：/menu'
    );
    return;
  }

  let message = '💬 **你的聊天記錄**\n\n';

  for (const conv of conversations) {
    const preview = conv.last_message_preview
      ? conv.last_message_preview.substring(0, 30) +
        (conv.last_message_preview.length > 30 ? '...' : '')
      : '(無訊息)';

    message += `📨 ${formatIdentifier(conv.identifier)} 的對話（${conv.message_count} 則訊息）\n`;
    message += `最後訊息：${preview}\n`;
    message += `時間：${formatDate(conv.last_message_time)}\n\n`;
  }

  message += `💡 使用 /history ${formatIdentifier(conversations[0].identifier)} 查看完整對話\n\n`;
  message += `🏠 返回主選單：/menu`;

  await telegram.sendMessage(chatId, message);
}

/**
 * Show conversation by identifier
 */
async function showConversationByIdentifier(
  db: DatabaseClient,
  telegram: ReturnType<typeof createTelegramService>,
  chatId: number,
  telegramId: string,
  identifier: string,
  _i18n: ReturnType<typeof createI18n>
): Promise<void> {
  // Get partner by identifier
  const partnerTelegramId = await getPartnerByIdentifier(db, telegramId, identifier);

  if (!partnerTelegramId) {
    await telegram.sendMessage(
      chatId,
      `❌ 找不到標識符 ${formatIdentifier(identifier)} 的對話\n\n` +
        '使用 /history 查看所有對話\n\n' +
        '🏠 返回主選單：/menu'
    );
    return;
  }

  // Get conversation statistics
  const stats = await getConversationStats(db, telegramId, partnerTelegramId);

  // Get conversation messages (last 10)
  const messages = await getConversationMessages(db, telegramId, partnerTelegramId, 10);

  let message = `💬 **與 ${formatIdentifier(identifier)} 的對話**\n\n`;
  message += `📊 **統計：**\n`;
  message += `• 總訊息數：${stats.total_messages} 則\n`;
  message += `• 你發送：${stats.user_messages} 則\n`;
  message += `• 對方發送：${stats.partner_messages} 則\n`;

  if (stats.first_message_time) {
    message += `• 對話開始：${formatDate(stats.first_message_time)}\n`;
  }
  if (stats.last_message_time) {
    message += `• 最後訊息：${formatDate(stats.last_message_time)}\n`;
  }

  message += `\n📨 **最近對話：**\n\n`;

  if (messages.length === 0) {
    message += '(尚無訊息)\n\n';
  } else {
    for (const msg of messages) {
      const time = formatTime(msg.created_at);
      const sender = msg.sender_telegram_id === telegramId ? '你' : formatIdentifier(identifier);
      const content = msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : '');
      message += `📨 ${time}\n${sender}：${content}\n\n`;
    }
  }

  message += `💬 繼續對話：/reply\n`;
  message += `🏠 返回主選單：/menu`;

  await telegram.sendMessageWithButtons(chatId, message, [
    [{ text: '💬 繼續對話', callback_data: 'menu_chats' }],
    [{ text: '🏠 返回主選單', callback_data: 'menu' }],
  ]);
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return '剛剛';
  } else if (diffMins < 60) {
    return `${diffMins} 分鐘前`;
  } else if (diffHours < 24) {
    return `${diffHours} 小時前`;
  } else if (diffDays < 7) {
    return `${diffDays} 天前`;
  } else {
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }
}

/**
 * Format time for display
 */
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
