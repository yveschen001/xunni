/**
 * Draft Handler
 *
 * Handles draft-related callbacks.
 */

import type { Env } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { getDraft, deleteDraft, deleteUserDrafts } from '~/db/queries/drafts';
import { createI18n } from '~/i18n';

/**
 * Handle draft continue
 */
export async function handleDraftContinue(callbackQuery: any, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('draft.continueEditing'));
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Get draft
    const draft = await getDraft(db, telegramId);
    if (!draft) {
      await telegram.sendMessage(chatId, i18n.t('draft.notFound'));
      return;
    }

    // Show draft content for editing
    await telegram.sendMessage(
      chatId,
      i18n.t('draft.contentTitle') +
        `${draft.content}\n\n` +
        `━━━━━━━━━━━━━━━━\n\n` +
        i18n.t('draft.contentHint')
    );

    // Show send draft button
    await telegram.sendMessageWithButtons(chatId, i18n.t('draft.sendQuestion'), [
      [
        { text: i18n.t('draft.sendButton'), callback_data: 'draft_send' },
        { text: i18n.t('draft.editButton'), callback_data: 'draft_edit' },
      ],
      [{ text: i18n.t('draft.deleteButton'), callback_data: 'draft_delete' }],
    ]);
  } catch (error) {
    console.error('[handleDraftContinue] Error:', error);
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.operationFailed'));
  }
}

/**
 * Handle draft delete
 */
export async function handleDraftDelete(callbackQuery: any, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    if (!user) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.userNotFound'));
      return;
    }

    // Delete draft
    await deleteUserDrafts(db, telegramId);

    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('draft.deleted'));
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    const isVip = !!(
      user.is_vip &&
      user.vip_expire_at &&
      new Date(user.vip_expire_at) > new Date()
    );

    if (isVip) {
      await telegram.sendMessageWithButtons(chatId, i18n.t('draft.throwBottle'), [
        [
          { text: i18n.t('buttons.targetMale'), callback_data: 'throw_target_male' },
          { text: i18n.t('buttons.targetFemale'), callback_data: 'throw_target_female' },
        ],
        [{ text: i18n.t('buttons.targetAny'), callback_data: 'throw_target_any' }],
        [{ text: i18n.t('buttons.targetAdvanced'), callback_data: 'throw_advanced' }],
      ]);
    } else {
      await telegram.sendMessageWithButtons(
        chatId,
        i18n.t('draft.throwBottle') +
          '\n\n' +
          i18n.t('draft.targetGender') +
          i18n.t('draft.targetGenderHint'),
        [
          [
            { text: i18n.t('buttons.targetMale'), callback_data: 'throw_target_male' },
            { text: i18n.t('buttons.targetFemale'), callback_data: 'throw_target_female' },
          ],
          [{ text: i18n.t('buttons.targetAny'), callback_data: 'throw_target_any' }],
        ]
      );
    }
  } catch (error) {
    console.error('[handleDraftDelete] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('common.operationFailed'));
  }
}

/**
 * Handle draft new (start fresh)
 */
export async function handleDraftNew(callbackQuery: any, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Delete existing draft
    await deleteUserDrafts(db, telegramId);

    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    if (!user) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.userNotFound'));
      return;
    }

    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('draft.newBottle'));
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    const isVip = !!(
      user.is_vip &&
      user.vip_expire_at &&
      new Date(user.vip_expire_at) > new Date()
    );

    if (isVip) {
      await telegram.sendMessageWithButtons(chatId, i18n.t('draft.throwBottle'), [
        [
          { text: i18n.t('buttons.targetMale'), callback_data: 'throw_target_male' },
          { text: i18n.t('buttons.targetFemale'), callback_data: 'throw_target_female' },
        ],
        [{ text: i18n.t('buttons.targetAny'), callback_data: 'throw_target_any' }],
        [{ text: i18n.t('buttons.targetAdvanced'), callback_data: 'throw_advanced' }],
      ]);
    } else {
      await telegram.sendMessageWithButtons(
        chatId,
        i18n.t('draft.throwBottle') +
          '\n\n' +
          i18n.t('draft.targetGender') +
          i18n.t('draft.targetGenderHint'),
        [
          [
            { text: i18n.t('buttons.targetMale'), callback_data: 'throw_target_male' },
            { text: i18n.t('buttons.targetFemale'), callback_data: 'throw_target_female' },
          ],
          [{ text: i18n.t('buttons.targetAny'), callback_data: 'throw_target_any' }],
        ]
      );
    }
  } catch (error) {
    console.error('[handleDraftNew] Error:', error);
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('common.operationFailed'));
  }
}

/**
 * Handle draft send
 */
export async function handleDraftSend(callbackQuery: any, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    if (!user) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.userNotFound'));
      return;
    }

    // Get draft
    const draft = await getDraft(db, telegramId);
    if (!draft) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('draft.notFound'));
      return;
    }

    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('draft.sending'));
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Import and call processBottleContent
    const { processBottleContent } = await import('./throw');
    await processBottleContent(user, draft.content, env);

    // Delete draft after successful send
    await deleteDraft(db, draft.id);
  } catch (error) {
    console.error('[handleDraftSend] Error:', error);
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('common.operationFailed'));
  }
}

/**
 * Handle draft edit
 */
export async function handleDraftEdit(callbackQuery: any, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;

  try {
    const db = createDatabaseClient(env.DB);
    const telegramId = callbackQuery.from.id.toString();
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('draft.editPrompt'));
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    await telegram.sendMessage(chatId, i18n.t('draft.editInput'));
  } catch (error) {
    console.error('[handleDraftEdit] Error:', error);
    const db = createDatabaseClient(env.DB);
    const telegramId = callbackQuery.from.id.toString();
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.operationFailed'));
  }
}
