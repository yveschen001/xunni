/**
 * Nickname Selection Callback Handler
 * Handles nickname selection during onboarding
 */

import type { Env, CallbackQuery } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { findUserByTelegramId, updateUserProfile, updateOnboardingStep } from '~/db/queries/users';
import { createTelegramService } from '~/services/telegram';
import { validateNickname } from '~/domain/user';
import { createI18n } from '~/i18n';

/**
 * Handle using Telegram nickname
 */
export async function handleNicknameUseTelegram(
  callbackQuery: CallbackQuery,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    if (!user) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('nickname.userNotFound'));
      return;
    }

    // Get Telegram nickname
    const nickname = callbackQuery.from.username || callbackQuery.from.first_name || '';

    if (!nickname) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('nickname.cannotGetNickname'));
      return;
    }

    // Truncate to 36 characters
    const truncatedNickname = nickname.substring(0, 36);

    // Validate nickname
    const validation = validateNickname(truncatedNickname);
    if (!validation.valid) {
      await telegram.answerCallbackQuery(
        callbackQuery.id,
        i18n.t('error.nickname3', { error: validation.error })
      );
      return;
    }

    // Save nickname
    await updateUserProfile(db, telegramId, { nickname: truncatedNickname });

    // Move to next step
    await updateOnboardingStep(db, telegramId, 'gender');

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('nickname.nicknameSet'));

    // Delete nickname selection message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Show gender selection
    await telegram.sendMessageWithButtons(
      chatId,
      i18n.t('nickname.genderSelection', { nickname: truncatedNickname }) +
        i18n.t('nickname.genderHint'),
      [
        [
          { text: `👨 ${i18n.t('gender.male')}`, callback_data: 'gender_male' },
          { text: `👩 ${i18n.t('gender.female')}`, callback_data: 'gender_female' },
        ],
      ]
    );
  } catch (error) {
    console.error('[handleNicknameUseTelegram] Error:', error);
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('common.operationFailed'));
  }
}

/**
 * Handle custom nickname
 */
export async function handleNicknameCustom(callbackQuery: CallbackQuery, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;

  try {
    const db = createDatabaseClient(env.DB);
    const telegramId = callbackQuery.from.id.toString();
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id);

    // Delete nickname selection message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Ask for custom nickname
    await telegram.sendMessage(
      chatId,
      i18n.t('nickname.customPrompt') + i18n.t('nickname.customHint')
    );
  } catch (error) {
    console.error('[handleNicknameCustom] Error:', error);
    const db = createDatabaseClient(env.DB);
    const telegramId = callbackQuery.from.id.toString();
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('common.operationFailed'));
  }
}
