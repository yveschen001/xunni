/**
 * Settings Handler
 *
 * Handles /settings command - User settings (language, notifications, etc.).
 */

import type { Env, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';

/**
 * Show settings menu
 */
export async function handleSettings(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // ✨ NEW: Update user activity (non-blocking)
    try {
      const { updateUserActivity } = await import('~/services/user_activity');
      await updateUserActivity(db, telegramId);
    } catch (activityError) {
      console.error('[handleSettings] Failed to update user activity:', activityError);
    }

    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    
    // Use i18n
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    
    if (!user) {
      await telegram.sendMessage(chatId, i18n.t('common.userNotFound'));
      return;
    }

    // Check if user completed onboarding
    if (user.onboarding_step !== 'completed') {
      await telegram.sendMessage(chatId, i18n.t('common.notRegistered'));
      return;
    }

    // Build settings message
    const languageName = await getLanguageName(user.language_pref || 'zh-TW');
    const settingsMessage =
      i18n.t('settings.title') +
      i18n.t('settings.currentSettings') +
      i18n.t('settings.languageLabel', { language: `${languageName} 🇹🇼` }) +
      i18n.t('settings.selectOption');

    // Build settings buttons
    const buttons = [
      [{ text: i18n.t('settings.changeLanguage'), callback_data: 'settings_language' }],
      [{ text: i18n.t('settings.returnToMenu'), callback_data: 'return_to_menu' }],
    ];

    await telegram.sendMessageWithButtons(chatId, settingsMessage, buttons);
  } catch (error) {
    console.error('[handleSettings] Error:', error);
    const { createI18n } = await import('~/i18n');
    const { findUserByTelegramId } = await import('~/db/queries/users');
    const db = createDatabaseClient(env.DB);
    const user = await findUserByTelegramId(db, message.from!.id.toString());
    const errorI18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.sendMessage(chatId, errorI18n.t('errors.systemErrorRetry'));
  }
}

/**
 * Handle settings callbacks
 */
export async function handleSettingsCallback(callbackQuery: any, env: Env): Promise<void> {
  const _db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const _telegramId = callbackQuery.from.id.toString();
  const data = callbackQuery.data;

  try {
    if (data === 'settings_language') {
      // Show language selection with all 34 languages
      const { getLanguageButtons } = await import('~/i18n/languages');
      await telegram.answerCallbackQuery(callbackQuery.id);
      await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

      // Show all languages
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n(user.language_pref || 'zh-TW');
      await telegram.sendMessageWithButtons(
        chatId,
        i18n.t('onboarding.languageSelection'),
        [...getLanguageButtons(i18n, 0), [{ text: i18n.t('settings.back'), callback_data: 'back_to_settings' }]]
      );
    }
  } catch (error) {
    console.error('[handleSettingsCallback] Error:', error);
    const { createI18n } = await import('~/i18n');
    const errorI18n = createI18n(user.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.systemErrorRetry'));
  }
}

/**
 * Handle language change callback
 */
export async function handleLanguageChange(callbackQuery: any, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();
  const data = callbackQuery.data;

  try {
    // Extract language code
    const languageCode = data.replace('set_lang_', '');

    // Update user language
    await db.d1
      .prepare(
        `
      UPDATE users
      SET language_pref = ?
      WHERE telegram_id = ?
    `
      )
      .bind(languageCode, telegramId)
      .run();

    const { createI18n } = await import('~/i18n');
    const newI18n = createI18n(languageCode);
    const newLanguageName = await getLanguageName(languageCode);
    await telegram.answerCallbackQuery(
      callbackQuery.id,
      newI18n.t('settings.languageUpdated', { language: newLanguageName })
    );

    // Refresh settings menu
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);
    const fakeMessage = {
      ...callbackQuery.message!,
      from: callbackQuery.from,
      text: '/settings',
    };
    await handleSettings(fakeMessage as any, env);
  } catch (error) {
    console.error('[handleLanguageChange] Error:', error);
    const { createI18n } = await import('~/i18n');
    const { findUserByTelegramId } = await import('~/db/queries/users');
    const user = await findUserByTelegramId(db, telegramId);
    const errorI18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.systemErrorRetry'));
  }
}

/**
 * Handle back to settings callback
 */
export async function handleBackToSettings(callbackQuery: any, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;

  try {
    await telegram.answerCallbackQuery(callbackQuery.id);
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    const fakeMessage = {
      ...callbackQuery.message!,
      from: callbackQuery.from,
      text: '/settings',
    };
    await handleSettings(fakeMessage as any, env);
  } catch (error) {
    console.error('[handleBackToSettings] Error:', error);
    const { createI18n } = await import('~/i18n');
    const { findUserByTelegramId } = await import('~/db/queries/users');
    const db = createDatabaseClient(env.DB);
    const user = await findUserByTelegramId(db, callbackQuery.from.id.toString());
    const errorI18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.systemErrorRetry'));
  }
}

/**
 * Get language display name
 */
async function getLanguageName(languageCode: string): Promise<string> {
  const { getLanguageDisplay } = await import('~/i18n/languages');
  return getLanguageDisplay(languageCode);
}
