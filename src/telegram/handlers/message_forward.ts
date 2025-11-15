/**
 * Message Forward Handler
 * 
 * Handles anonymous message forwarding between conversation participants.
 */

import type { Env, TelegramMessage, User } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import {
  getActiveConversation,
  saveConversationMessage,
  updateBottleChatHistory,
} from '~/db/queries/conversations';
import {
  validateMessageContent,
  getOtherUserId,
  isConversationActive,
  isUserBlocked,
} from '~/domain/conversation';
import { checkUrlWhitelist } from '~/utils/url-whitelist';
import { createI18n } from '~/i18n';

/**
 * Handle message forwarding in active conversation
 */
export async function handleMessageForward(
  message: TelegramMessage,
  env: Env
): Promise<boolean> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();
  const messageText = message.text || '';

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      return false;
    }

    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Get active conversation
    const conversation = await getActiveConversation(db, telegramId);
    if (!conversation) {
      // No active conversation
      return false;
    }

    // Check if conversation is active
    if (!isConversationActive(conversation)) {
      await telegram.sendMessage(
        chatId,
        '❌ 此對話已結束。\n\n使用 /catch 撿新的漂流瓶開始新對話。'
      );
      return true;
    }

    // Check if user is blocked
    if (isUserBlocked(conversation, telegramId)) {
      await telegram.sendMessage(
        chatId,
        '❌ 對方已封鎖你，無法繼續對話。\n\n使用 /catch 撿新的漂流瓶開始新對話。'
      );
      return true;
    }

    // Validate message content
    const validation = validateMessageContent(messageText);
    if (!validation.valid) {
      await telegram.sendMessage(chatId, `❌ ${validation.error}`);
      return true;
    }

    // Check for URLs (whitelist only)
    const urlCheck = checkUrlWhitelist(messageText);
    if (!urlCheck.allowed) {
      await telegram.sendMessage(
        chatId,
        '❌ 訊息包含不允許的連結。\n\n' +
          '為了安全，只允許以下網域的連結：\n' +
          '• t.me (Telegram)\n' +
          '• telegram.org\n\n' +
          '請移除連結後重新發送。'
      );
      return true;
    }

    // Get receiver ID
    const receiverId = getOtherUserId(conversation, telegramId);
    if (!receiverId) {
      await telegram.sendMessage(chatId, '❌ 對話資訊錯誤。');
      return true;
    }

    // Get receiver info
    const receiver = await findUserByTelegramId(db, receiverId);
    if (!receiver) {
      await telegram.sendMessage(chatId, '❌ 對方用戶不存在。');
      return true;
    }

    // TODO: Translation for VIP users
    // For now, just forward the message as-is

    // Save message to database
    await saveConversationMessage(
      db,
      conversation.id,
      telegramId,
      receiverId,
      messageText,
      false // not translated
    );

    // Update bottle chat history
    await updateBottleChatHistory(db, conversation.id);

    // Forward message to receiver
    await telegram.sendMessage(
      parseInt(receiverId),
      `💬 來自匿名對話的訊息：\n\n${messageText}\n\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `💡 直接回覆即可繼續對話\n` +
        `⚠️ 不當內容請使用 /report 舉報\n` +
        `🚫 不想再聊可使用 /block 封鎖`
    );

    // Confirm to sender
    await telegram.sendMessage(
      chatId,
      '✅ 訊息已發送'
    );

    return true;
  } catch (error) {
    console.error('[handleMessageForward] Error:', error);
    return false;
  }
}
