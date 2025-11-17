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
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      await telegram.sendMessage(chatId, '❌ 用戶不存在，請先使用 /start 註冊。');
      return;
    }

    // Check if user completed onboarding
    if (user.onboarding_step !== 'completed') {
      await telegram.sendMessage(
        chatId,
        '❌ 請先完成註冊流程。\n\n使用 /start 繼續註冊。'
      );
      return;
    }

    // Build settings message
    const languageName = await getLanguageName(user.language_pref || 'zh-TW');
    const settingsMessage = 
      `⚙️ **設定**\n\n` +
      `當前設定：\n` +
      `• 語言：${languageName} 🇹🇼\n\n` +
      `💡 選擇你想要修改的設定：`;

    // Build settings buttons
    const buttons = [
      [
        { text: '🌐 變更語言', callback_data: 'settings_language' },
      ],
      [
        { text: '🏠 返回主選單', callback_data: 'return_to_menu' },
      ],
    ];

    await telegram.sendMessageWithButtons(chatId, settingsMessage, buttons);
  } catch (error) {
    console.error('[handleSettings] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤，請稍後再試。');
  }
}

/**
 * Handle settings callbacks
 */
export async function handleSettingsCallback(
  callbackQuery: any,
  env: Env
): Promise<void> {
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
      await telegram.sendMessageWithButtons(
        chatId,
        '🌐 **選擇語言 / Choose Language**\n\n請選擇你的偏好語言：',
        [
          ...getLanguageButtons(),
          [{ text: '🏠 返回設定', callback_data: 'back_to_settings' }],
        ]
      );
    }
  } catch (error) {
    console.error('[handleSettingsCallback] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle language change callback
 */
export async function handleLanguageChange(
  callbackQuery: any,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();
  const data = callbackQuery.data;

  try {
    // Extract language code
    const languageCode = data.replace('set_lang_', '');

    // Update user language
    await db.d1.prepare(`
      UPDATE users
      SET language_pref = ?
      WHERE telegram_id = ?
    `).bind(languageCode, telegramId).run();

    const newLanguageName = await getLanguageName(languageCode);
    await telegram.answerCallbackQuery(
      callbackQuery.id,
      `✅ 語言已變更為 ${newLanguageName}`
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
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle back to settings callback
 */
export async function handleBackToSettings(
  callbackQuery: any,
  env: Env
): Promise<void> {
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
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Get language display name
 */
async function getLanguageName(languageCode: string): Promise<string> {
  const { getLanguageDisplay } = await import('~/i18n/languages');
  return getLanguageDisplay(languageCode);
}

