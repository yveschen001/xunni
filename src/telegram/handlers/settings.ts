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
  const db = createDatabaseClient(env);
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
    const settingsMessage = 
      `⚙️ **設定**\n\n` +
      `當前設定：\n` +
      `• 語言：${getLanguageName(user.language_pref || 'zh-TW')}\n` +
      `• 通知：${user.notification_enabled ? '開啟 ✅' : '關閉 ❌'}\n\n` +
      `💡 選擇你想要修改的設定：`;

    // Build settings buttons
    const buttons = [
      [
        { text: '🌐 變更語言', callback_data: 'settings_language' },
      ],
      [
        { text: user.notification_enabled ? '🔕 關閉通知' : '🔔 開啟通知', callback_data: 'settings_notification' },
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
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();
  const data = callbackQuery.data;

  try {
    if (data === 'settings_language') {
      // Show language selection
      await telegram.answerCallbackQuery(callbackQuery.id);
      await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);
      
      await telegram.sendMessageWithButtons(
        chatId,
        '🌐 **選擇語言 / Choose Language**\n\n請選擇你的偏好語言：',
        [
          [{ text: '🇹🇼 繁體中文', callback_data: 'set_lang_zh-TW' }],
          [{ text: '🇺🇸 English', callback_data: 'set_lang_en' }],
          [{ text: '🇯🇵 日本語', callback_data: 'set_lang_ja' }],
          [{ text: '🇰🇷 한국어', callback_data: 'set_lang_ko' }],
          [{ text: '🇪🇸 Español', callback_data: 'set_lang_es' }],
          [{ text: '🏠 返回設定', callback_data: 'back_to_settings' }],
        ]
      );
    } else if (data === 'settings_notification') {
      // Toggle notification
      const user = await findUserByTelegramId(db, telegramId);
      if (!user) {
        await telegram.answerCallbackQuery(callbackQuery.id, '❌ 用戶不存在');
        return;
      }

      const newValue = !user.notification_enabled;
      await db.d1.prepare(`
        UPDATE users
        SET notification_enabled = ?
        WHERE telegram_id = ?
      `).bind(newValue ? 1 : 0, telegramId).run();

      await telegram.answerCallbackQuery(
        callbackQuery.id,
        newValue ? '✅ 通知已開啟' : '❌ 通知已關閉'
      );

      // Refresh settings menu
      await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);
      const fakeMessage = {
        ...callbackQuery.message!,
        from: callbackQuery.from,
        text: '/settings',
      };
      await handleSettings(fakeMessage as any, env);
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
  const db = createDatabaseClient(env);
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

    await telegram.answerCallbackQuery(
      callbackQuery.id,
      `✅ 語言已變更為 ${getLanguageName(languageCode)}`
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
function getLanguageName(languageCode: string): string {
  const names: Record<string, string> = {
    'zh-TW': '繁體中文 🇹🇼',
    'en': 'English 🇺🇸',
    'ja': '日本語 🇯🇵',
    'ko': '한국어 🇰🇷',
    'es': 'Español 🇪🇸',
  };
  return names[languageCode] || languageCode;
}

