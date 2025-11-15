/**
 * Message Forward Handler
 * Based on @doc/SPEC.md
 *
 * Handles anonymous message forwarding between conversation participants.
 */

import type { Env, TelegramMessage, User, Conversation } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { findUserByTelegramId } from '~/db/queries/users';
import {
  findUserConversations,
  updateLastMessageTime,
  createConversationMessage,
  getConversationMessageCount,
  getTodayMessageCount,
} from '~/db/queries/conversations';
import { hasBlocked } from '~/db/queries/user_blocks';
import { updateRiskScore } from '~/db/queries/users';
import { incrementMessagesSent } from '~/db/queries/daily_usage';
import { isVIP } from '~/domain/user';
import { canSendConversationMessage, getTodayDate } from '~/domain/usage';
import { performLocalModeration, processAIModerationResult } from '~/domain/risk';
import { createTelegramService } from '~/services/telegram';
import { createOpenAIService } from '~/services/openai';

// ============================================================================
// Message Forward Handler
// ============================================================================

export async function handleMessageForward(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const openai = createOpenAIService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();
  const text = message.text || '';

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      return; // Ignore messages from unregistered users
    }

    // Check if user is banned
    if (user.is_banned) {
      await telegram.sendMessage(
        chatId,
        '🚫 你的帳號已被封禁，無法發送訊息。\n\n' + '如有疑問，請使用 /appeal 申訴。'
      );
      return;
    }

    // Find active conversations
    const conversations = await findUserConversations(db, telegramId, 'active');

    if (conversations.length === 0) {
      // No active conversations
      return;
    }

    // For now, assume user is in one conversation
    // TODO: Handle multiple conversations (conversation selection UI)
    const conversation = conversations[0];

    // Get receiver telegram ID
    const receiverTelegramId =
      conversation.user_a_telegram_id === telegramId
        ? conversation.user_b_telegram_id
        : conversation.user_a_telegram_id;

    // Check if receiver has blocked sender
    const isBlocked = await hasBlocked(db, receiverTelegramId, telegramId);
    if (isBlocked) {
      await telegram.sendMessage(
        chatId,
        '❌ 無法發送訊息：對方已封鎖你。\n\n' + '對話已結束。'
      );
      return;
    }

    // Check message limits
    const totalMessageCount = await getConversationMessageCount(db, conversation.id);
    const today = getTodayDate();
    const todayMessageCount = await getTodayMessageCount(db, conversation.id, telegramId, today);

    if (!canSendConversationMessage(totalMessageCount, todayMessageCount)) {
      await telegram.sendMessage(
        chatId,
        '🚫 訊息數量已達上限\n\n' +
          `• 每個對話最多 3650 筆訊息\n` +
          `• 每日每個對話最多 100 筆訊息`
      );
      return;
    }

    // Validate message (text only)
    if (!text || text.trim().length === 0) {
      await telegram.sendMessage(chatId, '❌ 目前僅支援文字訊息');
      return;
    }

    // Local moderation (URL whitelist, sensitive words)
    const localModeration = performLocalModeration(text);

    if (localModeration.should_block) {
      // Block message
      await telegram.sendMessage(
        chatId,
        `🚫 訊息被攔截\n\n` +
          `原因：${localModeration.reasons.join('、')}\n\n` +
          `請修改後重新發送。`
      );

      // Add risk score
      await updateRiskScore(db, telegramId, localModeration.risk_score);

      return;
    }

    // AI moderation (if enabled)
    let aiModeration = { flagged: false, categories: [] as string[] };
    if (env.ENABLE_AI_MODERATION === 'true') {
      try {
        aiModeration = await openai.moderateContent(text);
      } catch (error) {
        console.error('[handleMessageForward] AI moderation error:', error);
        // Continue without AI moderation on error
      }
    }

    // Process AI moderation result
    const finalModeration = processAIModerationResult(aiModeration, localModeration);

    if (finalModeration.should_block) {
      // Block message
      await telegram.sendMessage(
        chatId,
        `🚫 訊息被 AI 審核攔截\n\n` +
          `原因：${finalModeration.reasons.join('、')}\n\n` +
          `請修改後重新發送。`
      );

      // Add risk score
      await updateRiskScore(db, telegramId, finalModeration.risk_score);

      // Record blocked message
      await createConversationMessage(db, {
        conversation_id: conversation.id,
        sender_telegram_id: telegramId,
        receiver_telegram_id: receiverTelegramId,
        original_text: text,
        is_blocked_by_ai: true,
        ai_block_reason: finalModeration.reasons.join(', '),
      });

      return;
    }

    // Translation (for VIP users)
    let translatedText: string | undefined;
    let translationProvider: 'openai' | 'google' | undefined;

    const receiverUser = await findUserByTelegramId(db, receiverTelegramId);
    if (receiverUser && isVIP(receiverUser) && env.ENABLE_TRANSLATION === 'true') {
      const targetLanguage = receiverUser.language_pref || 'zh-TW';
      const sourceLanguage = user.language_pref || 'zh-TW';

      if (targetLanguage !== sourceLanguage) {
        try {
          const translation = await openai.translate(text, targetLanguage, sourceLanguage);
          if (translation.success) {
            translatedText = translation.translated_text;
            translationProvider = translation.provider;
          }
        } catch (error) {
          console.error('[handleMessageForward] Translation error:', error);
          // Send original text on translation error
        }
      }
    }

    // Save message
    await createConversationMessage(db, {
      conversation_id: conversation.id,
      sender_telegram_id: telegramId,
      receiver_telegram_id: receiverTelegramId,
      original_text: text,
      translated_text: translatedText,
      translation_provider: translationProvider,
    });

    // Update conversation last message time
    await updateLastMessageTime(db, conversation.id);

    // Increment usage count
    await incrementMessagesSent(db, telegramId, today);

    // Send message to receiver
    const messageToSend = translatedText || text;
    let notificationText = `💬 對方：\n${messageToSend}`;

    if (translatedText && translationProvider) {
      notificationText += `\n\n📝 原文：${text}`;
      notificationText += `\n🌐 由 ${translationProvider === 'openai' ? 'OpenAI' : 'Google Translate'} 翻譯`;
    }

    await telegram.sendMessage(parseInt(receiverTelegramId), notificationText);

    // Confirm to sender
    await telegram.sendMessage(chatId, '✅ 訊息已發送');
  } catch (error) {
    console.error('[handleMessageForward] Error:', error);
    await telegram.sendMessage(chatId, '❌ 訊息發送失敗，請稍後再試。');
  }
}

