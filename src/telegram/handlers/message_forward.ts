/**
 * Message Forward Handler
 *
 * Handles anonymous message forwarding between conversation participants.
 */

import type { Env, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { getActiveConversation, saveConversationMessage } from '~/db/queries/conversations';
import {
  validateMessageContent,
  getOtherUserId,
  isConversationActive,
} from '~/domain/conversation';
import { checkUrlWhitelist } from '~/utils/url-whitelist';
import { getOrCreateIdentifier } from '~/db/queries/conversation_identifiers';
import { formatIdentifier } from '~/domain/conversation_identifier';

/**
 * Handle message forwarding in active conversation
 */
export async function handleMessageForward(message: TelegramMessage, env: Env): Promise<boolean> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();
  const messageText = message.text || '';
  const replyToId = message.reply_to_message?.message_id;

  try {
    // ✨ NEW: Update user activity (non-blocking)
    try {
      const { updateUserActivity } = await import('~/services/user_activity');
      await updateUserActivity(db, telegramId);
    } catch (activityError) {
      console.error('[handleMessageForward] Failed to update user activity:', activityError);
    }

    // If it's a command, let router handle it
    if (messageText.startsWith('/')) {
      console.error('[handleMessageForward] Command detected, returning false:', messageText);
      return false;
    }

    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      return false;
    }

    // Get active conversation
    const conversation = await getActiveConversation(db, telegramId);
    if (!conversation) {
      // No active conversation
      return false;
    }

    // Check for duplicate message (防止重複處理)
    // Use message_id as deduplication key
    const messageId = message.message_id;
    const recentMessage = await db.d1
      .prepare(
        `SELECT id FROM conversation_messages 
         WHERE conversation_id = ? 
         AND sender_telegram_id = ? 
         AND created_at > datetime('now', '-10 seconds')
         ORDER BY created_at DESC 
         LIMIT 1`
      )
      .bind(conversation.id, telegramId)
      .first<{ id: number }>();

    // If we just processed a message from this user in the last 10 seconds, skip
    if (recentMessage) {
      console.error('[handleMessageForward] Skipping duplicate message:', {
        messageId,
        conversationId: conversation.id,
        telegramId,
      });
      return true; // Return true to prevent further processing
    }

    // Check if conversation is active
    if (!isConversationActive(conversation)) {
      await telegram.sendMessage(
        chatId,
        '❌ 此對話已結束。\n\n使用 /catch 撿新的漂流瓶開始新對話。'
      );
      return true;
    }

    if (!replyToId) {
      // If message is too short (< 5 chars), ignore it (likely emoji or random text)
      if (messageText.length < 5) {
        return false; // Let other handlers process it or ignore it
      }
      
      await telegram.sendMessage(
        chatId,
        '💡 請長按你要回復的消息，在出現的選單中選擇「回覆」後，在聊天框中輸入回復內容。'
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
          `🚫 禁止的網址：\n${urlCheck.blockedUrls?.map((url) => `• ${url}`).join('\n')}\n\n` +
          '請移除這些連結後重新發送。'
      );
      return true;
    }

    // Check daily message quota
    const { getConversationDailyLimit, getTodayDate } = await import('~/domain/usage');
    const today = getTodayDate();

    // Count today's messages from this user in this conversation
    const todayMessageCount = await db.d1
      .prepare(
        `SELECT COUNT(*) as count FROM conversation_messages 
         WHERE conversation_id = ? 
         AND sender_telegram_id = ? 
         AND DATE(created_at) = DATE(?)`
      )
      .bind(conversation.id, telegramId, today)
      .first<{ count: number }>();

    const dailyLimit = getConversationDailyLimit(user);
    const usedToday = todayMessageCount?.count || 0;

    if (usedToday >= dailyLimit) {
      await telegram.sendMessage(
        chatId,
        `❌ 今日對話訊息配額已用完（${usedToday}/${dailyLimit}）\n\n` +
          (user.is_vip
            ? '💡 VIP 用戶每日可發送 100 則訊息。'
            : '💡 升級 VIP 可獲得更多配額（100 則/天）：/vip')
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
    let translationProvider: string | undefined;

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
      } catch (error) {
        console.error('[Translation error]:', error);
        // Translation failed, use original message
      }
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

    // Check and complete "first conversation" task
    try {
      const { checkAndCompleteTask } = await import('./tasks');
      const conversationCount = await db.d1
        .prepare(
          `SELECT COUNT(DISTINCT conversation_id) as count 
           FROM conversation_messages 
           WHERE sender_id = ?`
        )
        .bind(telegramId)
        .first<{ count: number }>();
      await checkAndCompleteTask(db, telegram, user, 'task_first_conversation', {
        conversationCount: conversationCount?.count || 0,
      });
    } catch (taskError) {
      console.error('[handleMessageForward] Task check error:', taskError);
    }

    // Get or create identifiers for both users
    const receiverIdentifier = await getOrCreateIdentifier(
      db,
      receiverId,
      telegramId,
      conversation.id
    );
    const senderIdentifier = await getOrCreateIdentifier(
      db,
      telegramId,
      receiverId,
      conversation.id
    );

    // Prepare partner info for history posts
    const { maskNickname } = await import('~/domain/invite');

    // For sender's history: partner is receiver
    const receiverNickname = receiver.nickname || receiver.username || '匿名用戶';
    const receiverPartnerInfo = {
      partnerTelegramId: receiverId,
      maskedNickname: maskNickname(receiverNickname),
      mbti: receiver.mbti_result || '未設定',
      bloodType: receiver.blood_type || '未設定',
      zodiac: receiver.zodiac_sign || '未設定',
    };

    // For receiver's history: partner is sender
    const senderNickname = sender.nickname || sender.username || '匿名用戶';
    const senderPartnerInfo = {
      partnerTelegramId: telegramId,
      maskedNickname: maskNickname(senderNickname),
      mbti: sender.mbti_result || '未設定',
      bloodType: sender.blood_type || '未設定',
      zodiac: sender.zodiac_sign || '未設定',
    };

    // Update conversation history posts
    const messageTime = new Date();
    const { updateConversationHistory, updateNewMessagePost } = await import(
      '~/services/conversation_history'
    );

    // Update sender's history (sent message) - show receiver's info
    await updateConversationHistory(
      db,
      env,
      conversation.id,
      telegramId,
      senderIdentifier,
      messageText,
      messageTime,
      'sent',
      receiverPartnerInfo
    );

    // Update receiver's history (received message) - show sender's info
    await updateConversationHistory(
      db,
      env,
      conversation.id,
      receiverId,
      receiverIdentifier,
      finalMessage,
      messageTime,
      'received',
      senderPartnerInfo
    );

    // Update receiver's new message post - show sender's info
    await updateNewMessagePost(
      db,
      env,
      conversation.id,
      receiverId,
      receiverIdentifier,
      finalMessage,
      messageTime,
      senderPartnerInfo
    );

    // Note: Message forwarding is now handled by conversation history system
    // The receiver will get:
    // 1. History post (updated with all messages)
    // 2. New message post (showing latest message)

    // Confirm to sender with receiver's identifier
    await telegram.sendMessage(
      chatId,
      `✅ 訊息已發送給 ${formatIdentifier(receiverIdentifier)}\n\n` +
        `📊 今日已發送：${usedToday + 1}/${dailyLimit} 則`
    );

    return true;
  } catch (error) {
    console.error('[handleMessageForward] Error:', error);
    return false;
  }
}
