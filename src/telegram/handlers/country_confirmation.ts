/**
 * Country Confirmation Handler
 *
 * Handles country confirmation dialog and user selection
 */

import type { Env, User } from '~/types';
import { createTelegramService } from '~/services/telegram';
import { createDatabaseClient } from '~/db/client';
import { getCountryFlagEmoji, getCountryName } from '~/utils/country_flag';
import { checkAndCompleteTask } from './tasks';
import { findUserByTelegramId } from '~/db/queries/users';
import { createI18n } from '~/i18n';

/**
 * Show country confirmation dialog
 */
export async function showCountryConfirmation(chatId: number, user: User, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const i18n = createI18n(user.language_pref || 'zh-TW');
  const currentFlag = getCountryFlagEmoji(user.country_code || 'UN');
  const currentCountry = getCountryName(user.country_code || 'UN');

  const message =
    i18n.t('country.confirmTitle') +
    i18n.t('country.confirmDetected') +
    `${currentFlag} **${currentCountry}**\n\n` +
    i18n.t('country.confirmQuestion') +
    i18n.t('country.confirmHint') +
    i18n.t('country.confirmReward');

  await telegram.sendMessageWithButtons(chatId, message, [
    [
      { text: i18n.t('country.confirmButton'), callback_data: 'country_confirm_yes' },
      { text: i18n.t('country.notCorrectButton'), callback_data: 'country_select' },
    ],
    [{ text: i18n.t('country.useUnFlagButton'), callback_data: 'country_set_UN' }],
  ]);
}

/**
 * Handle country confirmation (user confirms current country)
 */
export async function handleCountryConfirmYes(callbackQuery: any, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const telegramId = callbackQuery.from.id.toString();
  const chatId = callbackQuery.message!.chat.id;

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    if (!user) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.userNotFound'));
      return;
    }

    // Use existing checkAndCompleteTask function
    // country_code already has value, so isTaskCompleted will return true
    const completed = await checkAndCompleteTask(db, telegram, user, 'task_confirm_country');

    if (completed) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('country.confirmed'));
      await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);
    } else {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('country.confirmFailed'));
    }
  } catch (error) {
    console.error('[handleCountryConfirmYes] Error:', error);
    const user = await findUserByTelegramId(db, callbackQuery.from.id.toString());
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.operationFailed'));
  }
}

/**
 * Handle country selection
 */
export async function handleCountrySet(
  callbackQuery: any,
  countryCode: string,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const telegramId = callbackQuery.from.id.toString();
  const chatId = callbackQuery.message!.chat.id;

  try {
    // Get user first for i18n
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    if (!user) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.userNotFound'));
      return;
    }

    // Update country_code
    await db.d1
      .prepare(`UPDATE users SET country_code = ? WHERE telegram_id = ?`)
      .bind(countryCode, telegramId)
      .run();

    // Get updated user
    const updatedUser = await findUserByTelegramId(db, telegramId);
    if (!updatedUser) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.userNotFound'));
      return;
    }

    // Use existing checkAndCompleteTask function
    const completed = await checkAndCompleteTask(db, telegram, updatedUser, 'task_confirm_country');

    if (completed) {
      const flag = getCountryFlagEmoji(countryCode);
      const countryName = getCountryName(countryCode);
      await telegram.answerCallbackQuery(
        callbackQuery.id,
        i18n.t('country.setTo', { flag, country: countryName })
      );
      await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);
    } else {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('country.setFailed'));
    }
  } catch (error) {
    console.error('[handleCountrySet] Error:', error);
    const user = await findUserByTelegramId(db, callbackQuery.from.id.toString());
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.operationFailed'));
  }
}
