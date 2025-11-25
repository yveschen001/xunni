/**
 * Block Handler
 *
 * Handles /block command - block users without reporting.
 */

import type { Env, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { getOtherUserId } from '~/domain/conversation';
import { createI18n } from '~/i18n';

export async function handleBlock(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      const i18n = createI18n('zh-TW');
      await telegram.sendMessage(chatId, i18n.t('errors.userNotFoundRegister'));
      return;
    }

    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Check if user completed onboarding
    if (user.onboarding_step !== 'completed') {
      await telegram.sendMessage(chatId, i18n.t('errors.completeOnboarding'));
      return;
    }

    // ✨ NEW: Check if user replied to a message
    if (!message.reply_to_message) {
      await telegram.sendMessage(
        chatId,
        i18n.t('block.replyRequired') + '\n\n' +
          i18n.t('block.steps') + '\n' +
          i18n.t('block.step1') + '\n' +
          i18n.t('block.step2') + '\n' +
          i18n.t('block.step3') + '\n\n' +
          i18n.t('block.hint')
      );
      return;
    }

    // ✨ NEW: Extract conversation identifier from replied message
    const replyText = message.reply_to_message.text || '';
    const conversationMatch = replyText.match(/#([A-Z0-9]+)/);

    if (!conversationMatch) {
      await telegram.sendMessage(
        chatId,
        i18n.t('block.cannotIdentify') + '\n\n' + i18n.t('block.ensureReply')
      );
      return;
    }

    const conversationIdentifier = conversationMatch[1];

    // Find conversation by identifier
    const conversation = await db.d1
      .prepare(
        `
        SELECT * FROM conversations
        WHERE (user1_id = ? OR user2_id = ?)
          AND conversation_identifier = ?
          AND status IN ('active', 'paused')
        ORDER BY updated_at DESC
        LIMIT 1
      `
      )
      .bind(telegramId, telegramId, conversationIdentifier)
      .first<any>();

    if (!conversation) {
      await telegram.sendMessage(chatId, i18n.t('block.conversationNotFound') + '\n\n' + i18n.t('block.conversationMayEnded'));
      return;
    }

    // Get the other user
    const otherUserId = getOtherUserId(conversation, telegramId);
    if (!otherUserId) {
      await telegram.sendMessage(chatId, i18n.t('block.conversationInfoError'));
      return;
    }

    // Block the user
    await blockUser(db, telegramId, otherUserId);

    // Close conversation
    await db.d1
      .prepare(
        `
      UPDATE conversations
      SET status = 'blocked'
      WHERE id = ?
    `
      )
      .bind(conversation.id)
      .run();

    await telegram.sendMessage(
      chatId,
      i18n.t('block.success', { identifier: conversationIdentifier }) + '\n\n' +
        i18n.t('block.willNotMatch') + '\n\n' +
        i18n.t('block.catchNewBottle')
    );
  } catch (error) {
    console.error('[handleBlock] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.sendMessage(chatId, errorI18n.t('errors.systemErrorRetry'));
  }
}

/**
 * Block a user
 */
async function blockUser(
  db: ReturnType<typeof createDatabaseClient>,
  blockerId: string,
  blockedId: string
): Promise<void> {
  await db.d1
    .prepare(
      `
    INSERT INTO user_blocks (blocker_telegram_id, blocked_telegram_id, created_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(blocker_telegram_id, blocked_telegram_id) DO NOTHING
  `
    )
    .bind(blockerId, blockedId)
    .run();
}
