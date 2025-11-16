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
          '• telegram.org\n' +
          '• telegram.me\n\n' +
          `🚫 禁止的網址：\n${urlCheck.blockedUrls?.map(url => `• ${url}`).join('\n')}\n\n` +
          '請移除這些連結後重新發送。'
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

    // Get sender user for translation
    const sender = await findUserByTelegramId(db, telegramId);
    if (!sender) {
      await telegram.sendMessage(chatId, '❌ 發送者資訊錯誤。');
      return true;
    }

    // Translate message if needed
    let finalMessage = messageText;
    let translationNote = '';
    let translationProvider: string | undefined;
    let usedFallback = false;

    const senderLanguage = sender.language_pref || 'zh-TW';
    const receiverLanguage = receiver.language_pref || 'zh-TW';

    if (senderLanguage !== receiverLanguage) {
      const { translateText } = await import('~/services/translation');
      const isVip = !!(sender.is_vip || receiver.is_vip);

      try {
        const result = await translateText(
          messageText,
          receiverLanguage,
          senderLanguage,
          isVip,
          env
        );

        finalMessage = result.text;
        translationProvider = result.provider;
        usedFallback = !!result.fallback;

        if (result.error && result.text === messageText) {
          translationNote =
            `\n\n⚠️ 翻譯服務暫時無法使用（原文語言：${senderLanguage}）`;
        } else if (result.fallback && isVip) {
          translationNote = '\n\n💬 翻譯服務暫時有問題，已使用備用翻譯';
        }
      } catch (error) {
        console.error('[Translation error]:', error);
        translationNote =
          `\n\n⚠️ 翻譯服務暫時無法使用（原文語言：${senderLanguage}）`;
      }
    } else if (senderLanguage === receiverLanguage) {
      translationNote = `\n\nℹ️ 對方使用 ${senderLanguage}，已直接顯示原文`;
    }

    // Save message to database
    const translatedUsed = finalMessage !== messageText;
    await saveConversationMessage(
      db,
      conversation.id,
      telegramId,
      receiverId,
      messageText,
      translatedUsed ? finalMessage : undefined,
      translationProvider,
      senderLanguage,
      receiverLanguage
    );

    // Update bottle chat history
    await updateBottleChatHistory(db, conversation.id);

    // Forward message to receiver with quick action buttons
    await telegram.sendMessageWithButtons(
      parseInt(receiverId),
      `💬 來自匿名對話的訊息：\n\n${finalMessage}${translationNote}`,
      [
        [
          { text: '👤 查看資料卡', callback_data: `conv_profile_${conversation.id}` },
        ],
        [
          { text: '🚫 封鎖', callback_data: `conv_block_${conversation.id}` },
          { text: '🚨 舉報', callback_data: `conv_report_${conversation.id}` },
        ],
      ]
    );

    // Confirm to sender with quick action buttons
    await telegram.sendMessageWithButtons(
      chatId,
      '✅ 訊息已發送',
      [
        [
          { text: '👤 查看對方資料卡', callback_data: `conv_profile_${conversation.id}` },
        ],
      ]
    );

    return true;
  } catch (error) {
    console.error('[handleMessageForward] Error:', error);
    return false;
  }
}
