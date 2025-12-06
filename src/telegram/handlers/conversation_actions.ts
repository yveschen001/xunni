/**
 * Conversation Actions Handler
 *
 * Handles quick actions during conversations (profile view, block, report, end).
 */

import type { Env, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { getConversationById, endConversation } from '~/db/queries/conversations';
import { getOtherUserId } from '~/domain/conversation';
import { handleProfileCard } from '~/telegram/handlers/profile';

/**
 * Show anonymous profile card
 */
export async function handleConversationProfile(
  callbackQuery: any,
  conversationId: number,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Get user for i18n
    const viewer = await findUserByTelegramId(db, telegramId);
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(viewer?.language_pref || 'zh-TW');

    // Get conversation
    const conversation = await getConversationById(db, conversationId);
    if (!conversation) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.conversationNotFound'));
      return;
    }

    // Get other user ID
    const otherUserId = getOtherUserId(conversation, telegramId);
    if (!otherUserId) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.conversationInfoError'));
      return;
    }

    // Acknowledge callback
    await telegram.answerCallbackQuery(callbackQuery.id);

    // Delegate to handleProfileCard
    // We construct a pseudo-message object as handleProfileCard expects TelegramMessage
    const fakeMessage: TelegramMessage = {
      message_id: callbackQuery.message?.message_id || 0,
      from: callbackQuery.from,
      chat: callbackQuery.message?.chat || { id: 0, type: 'private' },
      date: Math.floor(Date.now() / 1000),
      text: '/profile_card'
    };

    await handleProfileCard(fakeMessage, env, otherUserId, conversationId);

  } catch (error) {
    console.error('[handleConversationProfile] Error:', error);
    const viewer = await findUserByTelegramId(db, callbackQuery.from.id.toString());
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(viewer?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.systemError'));
  }
}

/**
 * Handle conversation block
 */
export async function handleConversationBlock(
  callbackQuery: any,
  conversationId: number,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;

  try {
    const user = await findUserByTelegramId(db, callbackQuery.from.id.toString());
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    await telegram.answerCallbackQuery(callbackQuery.id);

    // Show confirmation
    await telegram.sendMessageWithButtons(
      chatId,
      i18n.t('conversation.blockConfirmTitle') +
        '\n\n' +
        i18n.t('conversation.blockConfirmMessage'),
      [
        [
          {
            text: i18n.t('conversation.blockConfirmButton'),
            callback_data: `conv_block_confirm_${conversationId}`,
          },
          { text: i18n.t('conversation.cancelButton'), callback_data: 'conv_cancel' },
        ],
      ]
    );
  } catch (error) {
    console.error('[handleConversationBlock] Error:', error);
    const db = createDatabaseClient(env.DB);
    const user = await findUserByTelegramId(db, callbackQuery.from.id.toString());
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.systemError'));
  }
}

/**
 * Handle conversation report
 */
export async function handleConversationReport(
  callbackQuery: any,
  conversationId: number,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;

  try {
    const user = await findUserByTelegramId(db, callbackQuery.from.id.toString());
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    await telegram.answerCallbackQuery(callbackQuery.id);

    // Show confirmation
    await telegram.sendMessageWithButtons(
      chatId,
      i18n.t('conversation.reportConfirmTitle') +
        '\n\n' +
        i18n.t('conversation.reportConfirmMessage'),
      [
        [
          {
            text: i18n.t('conversation.reportConfirmButton'),
            callback_data: `conv_report_confirm_${conversationId}`,
          },
          { text: i18n.t('conversation.cancelButton'), callback_data: 'conv_cancel' },
        ],
      ]
    );
  } catch (error) {
    console.error('[handleConversationReport] Error:', error);
    const db = createDatabaseClient(env.DB);
    const user = await findUserByTelegramId(db, callbackQuery.from.id.toString());
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.systemError'));
  }
}

/**
 * Confirm block
 */
export async function handleConversationBlockConfirm(
  callbackQuery: any,
  conversationId: number,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    const user = await findUserByTelegramId(db, telegramId);
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    // Get conversation
    const conversation = await getConversationById(db, conversationId);
    if (!conversation) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.conversationNotFound'));
      return;
    }

    // Get other user ID
    const otherUserId = getOtherUserId(conversation, telegramId);
    if (!otherUserId) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.conversationInfoError'));
      return;
    }

    // Get other user for i18n
    const otherUser = await findUserByTelegramId(db, otherUserId);
    const _otherI18n = createI18n(otherUser?.language_pref || 'zh-TW');

    // Create block record
    await db.d1
      .prepare(
        `
      INSERT INTO user_blocks (blocker_telegram_id, blocked_telegram_id, conversation_id, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `
      )
      .bind(telegramId, otherUserId, conversationId)
      .run();

    // End conversation
    await endConversation(db, conversationId);

    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('conversation.blocked'));
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    await telegram.sendMessage(
      chatId,
      i18n.t('conversation.blockSuccessTitle') + '\n\n' + i18n.t('conversation.blockSuccessMessage')
    );

    // Notify other user (without revealing block)
    await telegram.sendMessage(
      parseInt(otherUserId),
      i18n.t('conversation.blockSuccessNewConversation')
    );
  } catch (error) {
    console.error('[handleConversationBlockConfirm] Error:', error);
    const user = await findUserByTelegramId(db, callbackQuery.from.id.toString());
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.systemError'));
  }
}

/**
 * Confirm report
 */
export async function handleConversationReportConfirm(
  callbackQuery: any,
  conversationId: number,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    const user = await findUserByTelegramId(db, telegramId);
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    // Get conversation
    const conversation = await getConversationById(db, conversationId);
    if (!conversation) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.conversationNotFound'));
      return;
    }

    // Get other user ID
    const otherUserId = getOtherUserId(conversation, telegramId);
    if (!otherUserId) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.conversationInfoError'));
      return;
    }

    // Get other user for i18n
    const otherUser = await findUserByTelegramId(db, otherUserId);
    const _otherI18n = createI18n(otherUser?.language_pref || 'zh-TW');

    // Create report record
    await db.d1
      .prepare(
        `
      INSERT INTO reports (
        reporter_telegram_id,
        reported_telegram_id,
        conversation_id,
        reason,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, 'pending', datetime('now'))
    `
      )
      .bind(telegramId, otherUserId, conversationId, 'inappropriate_content')
      .run();

    // End conversation
    await endConversation(db, conversationId);

    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('conversation.reported'));
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    await telegram.sendMessage(
      chatId,
      i18n.t('conversation.reportSuccessTitle') +
        '\n\n' +
        i18n.t('conversation.reportSuccessMessage')
    );

    // Notify other user (without revealing report)
    await telegram.sendMessage(
      parseInt(otherUserId),
      i18n.t('conversation.reportSuccessNewConversation')
    );
  } catch (error) {
    console.error('[handleConversationReportConfirm] Error:', error);
    const user = await findUserByTelegramId(db, callbackQuery.from.id.toString());
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.systemError'));
  }
}

/**
 * Cancel action
 */
export async function handleConversationCancel(callbackQuery: any, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;

  try {
    const user = await findUserByTelegramId(db, callbackQuery.from.id.toString());
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('conversation.cancelSuccess'));
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);
  } catch (error) {
    console.error('[handleConversationCancel] Error:', error);
    const user = await findUserByTelegramId(db, callbackQuery.from.id.toString());
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.systemError'));
  }
}
