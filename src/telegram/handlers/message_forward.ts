/**
 * Message Forward Handler
 *
 * Handles anonymous message forwarding between conversation participants.
 */

import type { Env, TelegramMessage, TelegramCallbackQuery } from '~/types';
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
import { isVIP } from '~/domain/user';

/**
 * Handle message forwarding in active conversation
 */
export async function handleMessageForward(
  message: TelegramMessage,
  env: Env,
  targetConversationIdentifier?: string
): Promise<boolean> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();
  const messageText = message.text || '';
  const replyToId = message.reply_to_message?.message_id;

  try {
    // Get user for i18n
    const user = await findUserByTelegramId(db, telegramId);
    const { createI18n, loadTranslations } = await import('~/i18n');
    
    // Load translations
    const locale = user?.language_pref || 'zh-TW';
    await loadTranslations(env, locale);
    
    const i18n = createI18n(locale);

    // Check if message contains media (photo, document, video, etc.)
    // These are not allowed in conversations
    if (
      message.photo ||
      message.document ||
      message.video ||
      message.audio ||
      message.voice ||
      message.video_note ||
      message.sticker ||
      message.animation
    ) {
      await telegram.sendMessage(chatId, i18n.t('conversation.mediaRestriction'));
      return true; // Handled, stop processing
    }

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

    // User already fetched above for i18n
    if (!user) {
      return false;
    }

    // Get conversation
    let conversation;
    if (targetConversationIdentifier) {
      // Find conversation by identifier
      // First, get partner_telegram_id from conversation_identifiers
      const identifierInfo = await db.d1
        .prepare(
          `SELECT partner_telegram_id 
           FROM conversation_identifiers 
           WHERE identifier = ? AND user_telegram_id = ?`
        )
        .bind(targetConversationIdentifier, telegramId)
        .first<{ partner_telegram_id: string }>();

      if (!identifierInfo) {
        await telegram.sendMessage(chatId, i18n.t('warning.conversation4'));
        return true; // Handled, stop processing
      }

      // Then find the conversation between user and partner
      conversation = await db.d1
        .prepare(
          `SELECT c.* 
           FROM conversations c
           WHERE ((c.user_a_telegram_id = ? AND c.user_b_telegram_id = ?)
              OR (c.user_b_telegram_id = ? AND c.user_a_telegram_id = ?))
           AND c.status = 'active'
           ORDER BY c.created_at DESC
           LIMIT 1`
        )
        .bind(
          telegramId,
          identifierInfo.partner_telegram_id,
          telegramId,
          identifierInfo.partner_telegram_id
        )
        .first();

      if (!conversation) {
        await telegram.sendMessage(chatId, i18n.t('warning.conversation4'));
        return true; // Handled, stop processing
      }
    } else {
      // Get active conversation (default behavior)
      conversation = await getActiveConversation(db, telegramId);
    }

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
      await telegram.sendMessage(chatId, i18n.t('conversation.conversationEnded'));
      return true;
    }

    if (!replyToId) {
      // If message is too short (< 5 chars), ignore it (likely emoji or random text)
      if (messageText.length < 5) {
        return false; // Let other handlers process it or ignore it
      }

      await telegram.sendMessage(chatId, i18n.t('messageForward.replyHint'));
      return true;
    }

    // Validate message content
    const validation = validateMessageContent(messageText);
    if (!validation.valid) {
      await telegram.sendMessage(chatId, `⚠️ ${validation.error}`);
      return true;
    }

    // Check for URLs (whitelist only)
    const isVip = !!(
      user.is_vip &&
      user.vip_expire_at &&
      new Date(user.vip_expire_at) > new Date()
    );

    const urlCheck = checkUrlWhitelist(messageText, isVip);
    
    if (!urlCheck.allowed) {
      // 1. Check if it's a VIP-only URL (Upsell opportunity)
      if (urlCheck.vipRestrictedUrls && urlCheck.vipRestrictedUrls.length > 0) {
        const blockedVipUrlsText = urlCheck.vipRestrictedUrls.map((url) => `• ${url}`).join('\n');
        await telegram.sendMessage(
          chatId,
          i18n.t('messageForward.urlVipOnly') + // Using existing namespace convention
            '\n\n' +
            blockedVipUrlsText +
            '\n\n' +
            i18n.t('messageForward.upgradeVipLink') // Suggest upgrade
        );
        
        // Show upgrade button
        await telegram.sendMessageWithButtons(
          chatId, 
          i18n.t('messageForward.upgradeToUnlock'),
          [[{ text: i18n.t('buttons.vip'), callback_data: 'menu_vip' }]]
        );
        return true;
      }

      // 2. Standard blocked URLs
      const blockedUrlsText = urlCheck.blockedUrls?.map((url) => `• ${url}`).join('\n') || '';
      await telegram.sendMessage(
        chatId,
        i18n.t('messageForward.urlNotAllowed') +
          i18n.t('messageForward.urlNotAllowedDesc') +
          i18n.t('messageForward.blockedUrls', { urls: blockedUrlsText }) +
          i18n.t('messageForward.removeLinks')
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
        i18n.t('messageForward.quotaExceeded', { used: usedToday, limit: dailyLimit }) +
          (user.is_vip
            ? i18n.t('messageForward.vipDailyLimit')
            : i18n.t('messageForward.upgradeVip'))
      );
      return true;
    }

    // Get receiver ID
    const receiverId = getOtherUserId(conversation, telegramId);
    if (!receiverId) {
      await telegram.sendMessage(chatId, i18n.t('conversation.conversationInfoError'));
      return true;
    }

    // Get receiver info
    const receiver = await findUserByTelegramId(db, receiverId);
    if (!receiver) {
      await telegram.sendMessage(chatId, i18n.t('onboarding.otherUserNotFound'));
      return true;
    }

    // Get sender user for translation
    const sender = await findUserByTelegramId(db, telegramId);
    if (!sender) {
      await telegram.sendMessage(chatId, i18n.t('onboarding.senderInfoError'));
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
          env,
          telegramId // Pass userId for logging
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
           WHERE sender_telegram_id = ?`
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
    const receiverNickname =
      receiver.nickname || receiver.username || i18n.t('common.anonymousUser');
    const { formatNicknameWithFlag } = await import('~/utils/country_flag');
    const receiverPartnerInfo = {
      partnerTelegramId: receiverId,
      maskedNickname: formatNicknameWithFlag(
        maskNickname(receiverNickname),
        receiver.country_code,
        receiver.gender,
        isVIP(receiver)
      ),
      mbti: receiver.mbti_result || i18n.t('common.notSet'),
      bloodType: receiver.blood_type || i18n.t('common.notSet'),
      zodiac: receiver.zodiac_sign || 'Virgo',
    };

    // For receiver's history: partner is sender
    const senderNickname = sender.nickname || sender.username || i18n.t('common.anonymousUser');
    const senderPartnerInfo = {
      partnerTelegramId: telegramId,
      maskedNickname: formatNicknameWithFlag(
        maskNickname(senderNickname),
        sender.country_code,
        sender.gender,
        isVIP(sender)
      ),
      mbti: sender.mbti_result || i18n.t('common.notSet'),
      bloodType: sender.blood_type || i18n.t('common.notSet'),
      zodiac: sender.zodiac_sign || 'Virgo',
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
      senderPartnerInfo,
      messageText // Original message content
    );

    // Note: Message forwarding is now handled by conversation history system
    // The receiver will get:
    // 1. History post (updated with all messages)
    // 2. New message post (showing latest message)

    // Confirm to sender with receiver's identifier
    await telegram.sendMessage(
      chatId,
      i18n.t('messageForward.messageSent', { identifier: formatIdentifier(receiverIdentifier) }) +
        i18n.t('messageForward.dailyQuota', { used: usedToday + 1, limit: dailyLimit })
    );

    // ✨ NEW: Immediately show updated history to sender (User Experience Optimization)
    try {
      const { handleHistoryRead } = await import('./history');
      // Show page 1 of history for this conversation
      // This allows the user to see their sent message in context immediately
      await handleHistoryRead(
        message.chat.id,
        telegramId,
        receiverIdentifier,
        1,
        env
      );
    } catch (historyError) {
      console.error('[handleMessageForward] Failed to show updated history:', historyError);
      // Don't fail the whole operation if just the history view fails
    }

    return true;
  } catch (error) {
    console.error('[handleMessageForward] Error:', error);
    return false;
  }
}

/**
 * Handle conversation reply button click
 *
 * When user clicks "💬 回覆訊息" button, send a ForceReply message
 * to prompt them to input their reply.
 */
export async function handleConversationReplyButton(
  callbackQuery: TelegramCallbackQuery,
  conversationIdentifier: string,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  console.log(
    `[handleConversationReplyButton] Processing reply for identifier: ${conversationIdentifier}, userId: ${telegramId}`
  );

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    if (!user) {
      console.warn(`[handleConversationReplyButton] User not found: ${telegramId}`);
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.userNotFoundRegister'));
      return;
    }

    // Get conversation by identifier
    // First, get partner_telegram_id from conversation_identifiers
    const identifierInfo = await db.d1
      .prepare(
        `SELECT partner_telegram_id 
         FROM conversation_identifiers 
         WHERE identifier = ? AND user_telegram_id = ?`
      )
      .bind(conversationIdentifier, telegramId)
      .first<{ partner_telegram_id: string }>();

    if (!identifierInfo) {
      console.warn(
        `[handleConversationReplyButton] Identifier not found: ${conversationIdentifier}`
      );
      await telegram.answerCallbackQuery(
        callbackQuery.id,
        i18n.t('conversation.conversationEnded')
      );
      return;
    }

    // Then find the conversation between user and partner
    const conversation = await db.d1
      .prepare(
        `SELECT c.* 
         FROM conversations c
         WHERE ((c.user_a_telegram_id = ? AND c.user_b_telegram_id = ?)
            OR (c.user_b_telegram_id = ? AND c.user_a_telegram_id = ?))
         AND c.status = 'active'
         ORDER BY c.created_at DESC
         LIMIT 1`
      )
      .bind(
        telegramId,
        identifierInfo.partner_telegram_id,
        telegramId,
        identifierInfo.partner_telegram_id
      )
      .first();

    if (!conversation) {
      console.warn(`[handleConversationReplyButton] Conversation not found or not active`);
      await telegram.answerCallbackQuery(
        callbackQuery.id,
        i18n.t('conversation.conversationEnded')
      );
      return;
    }

    // Check if conversation is active
    if (conversation.status !== 'active') {
      console.warn(`[handleConversationReplyButton] Conversation status is ${conversation.status}`);
      await telegram.answerCallbackQuery(
        callbackQuery.id,
        i18n.t('conversation.conversationEnded')
      );
      return;
    }

    // Send ForceReply message with nickname
    const { getPartnerByIdentifier } = await import('~/db/queries/conversation_identifiers');
    const partnerId = await getPartnerByIdentifier(db, telegramId, conversationIdentifier);
    let replyText = i18n.t('conversation.replyConversation', { identifier: conversationIdentifier });
    
    if (partnerId) {
      const partner = await findUserByTelegramId(db, partnerId);
      if (partner) {
        const { formatNicknameWithFlag } = await import('~/utils/country_flag');
        const { maskNickname } = await import('~/utils/nickname');
        const nickname = formatNicknameWithFlag(
          maskNickname(partner.nickname || partner.username || ''),
          partner.country_code,
          partner.gender
        );
        // Use generic "Reply to {nickname}" format
        // We override the i18n key logic here to prioritize nickname
        // But we must store the context because we are removing the ID from text
        replyText = i18n.t('conversation.replyToUser', { nickname }); // Need to ensure key exists or use fallback
        if (replyText === 'conversation.replyToUser') {
           replyText = `💬 回覆 ${nickname}：`; // Fallback
        }
      }
    }

    // Set reply context session
    const { upsertSession } = await import('~/db/queries/sessions');
    await upsertSession(db, telegramId, 'reply_context', { conversationIdentifier });

    const response = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: replyText,
          reply_markup: {
            force_reply: true,
            selective: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[handleConversationReplyButton] Failed to send ForceReply:', error);
    }
  } catch (error) {
    console.error('[handleConversationReplyButton] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.systemError'));
  }
}
