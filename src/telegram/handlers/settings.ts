// src/telegram/handlers/settings.ts
// Add Push Notification settings

import type { Env, TelegramMessage, TelegramCallbackQuery } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { UserPreferencesService, DEFAULT_PREFERENCES } from '~/services/user_preferences';

/**
 * Show settings menu
 */
export async function handleSettings(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // Update user activity
    try {
      const { updateUserActivity } = await import('~/services/user_activity');
      await updateUserActivity(db, telegramId);
    } catch (activityError) {
      console.error('[handleSettings] Failed to update user activity:', activityError);
    }

    // Get user and preferences
    const user = await findUserByTelegramId(db, telegramId);
    const prefsService = new UserPreferencesService(db.d1);
    const prefs = await prefsService.getPreferences(telegramId);

    // Use i18n
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    if (!user) {
      await telegram.sendMessage(chatId, i18n.t('common.userNotFound'));
      return;
    }

    if (user.onboarding_step !== 'completed') {
      await telegram.sendMessage(chatId, i18n.t('common.notRegistered'));
      return;
    }

    // Build settings message
    const languageName = await getLanguageName(user.language_pref || 'zh-TW');

    // Check VIP status
    const isVip = !!(
      user.is_vip &&
      user.vip_expire_at &&
      new Date(user.vip_expire_at) > new Date()
    );

    const settingsMessage =
      i18n.t('settings.currentSettings') +
      '\n\n' +
      i18n.t('settings.languageLabel', { language: languageName }) +
      '\n' +
      `🌙 ${i18n.t('settings.quietHours', { defaultValue: '安靜時段' })}: ${prefs.quiet_hours_start}:00 - ${prefs.quiet_hours_end}:00` +
      '\n   ' +
      i18n.t('settings.quietHoursHint', { defaultValue: '在此時段內不會收到非緊急通知' }) +
      '\n\n' +
      i18n.t('settings.selectOption') +
      i18n.t('vip.retentionNotice'); // Added data retention notice

    // Build settings buttons
    const quietHoursButton = isVip
      ? {
        text: i18n.t('settings.editQuietHours', { defaultValue: '✏️ 修改安靜時段' }),
        callback_data: 'settings_edit_quiet_hours',
      }
      : {
        text: i18n.t('settings.quietHoursVipOnly', { defaultValue: '🔒 安靜時段 (VIP 專屬)' }),
        callback_data: 'settings_quiet_hours_locked',
      };

    const buttons = [
      [{ text: i18n.t('settings.changeLanguage'), callback_data: 'settings_language' }],
      [{ text: i18n.t('settings.blocklist.title', { defaultValue: '🛡️ 隱私與黑名單' }), callback_data: 'settings_blocklist' }],
      [quietHoursButton],
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
export async function handleSettingsCallback(
  callbackQuery: TelegramCallbackQuery,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();
  const data = callbackQuery.data!;

  try {
    // Get user and prefs
    const user = await findUserByTelegramId(db, telegramId);
    const prefsService = new UserPreferencesService(db.d1);
    const prefs = await prefsService.getPreferences(telegramId);

    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    if (data === 'settings_language') {
      // ... (Language logic remains same)
      const { getLanguageButtons } = await import('~/i18n/languages');
      await telegram.answerCallbackQuery(callbackQuery.id);
      await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);
      await telegram.sendMessageWithButtons(chatId, i18n.t('onboarding.languageSelection'), [
        ...getLanguageButtons(i18n, 0),
        [{ text: i18n.t('settings.back'), callback_data: 'back_to_settings' }],
      ]);
      return;
    }

    // Blocklist Menu
    if (data === 'settings_blocklist') {
      const { handleBlocklistMenu } = await import('./settings_blocklist');
      await handleBlocklistMenu(chatId, telegramId, env);
      await telegram.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // Blocklist Page
    if (data.startsWith('settings_blocklist_page:')) {
      const page = parseInt(data.split(':')[1], 10);
      const { handleBlocklistMenu } = await import('./settings_blocklist');
      await handleBlocklistMenu(chatId, telegramId, env, page);
      await telegram.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // Unblock Action
    if (data.startsWith('settings_unblock:')) {
      const parts = data.split(':');
      const blockedId = parts[1];
      const page = parseInt(parts[2], 10);
      const { handleUnblock } = await import('./settings_blocklist');
      await handleUnblock(callbackQuery, blockedId, page, env);
      return;
    }

    // Manual Block Start
    if (data === 'settings_block_manual_start') {
      const { handleManualBlockStart } = await import('./settings_blocklist');
      await handleManualBlockStart(chatId, telegramId, env);
      await telegram.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // Quiet hours editing
    if (data === 'settings_edit_quiet_hours') {
      const { showQuietHoursStartSelection } = await import('./settings_quiet');
      await showQuietHoursStartSelection(callbackQuery, env);
      return;
    }

    // VIP locked quiet hours
    if (data === 'settings_quiet_hours_locked') {
      const upgradeMessage = i18n.t('settings.upgradeForQuietHours', {
        defaultValue: '升級 VIP 即可設定安靜時段，避免在休息時間被打擾！',
      });
      await telegram.answerCallbackQuery(callbackQuery.id, upgradeMessage);

      await telegram.sendMessageWithButtons(chatId, upgradeMessage, [
        [
          {
            text: i18n.t('menu.buttonVip', { defaultValue: '💎 升級 VIP' }),
            callback_data: 'menu_vip',
          },
        ],
        [
          {
            text: i18n.t('common.back', { defaultValue: '返回' }),
            callback_data: 'back_to_settings',
          },
        ],
      ]);
      return;
    }
  } catch (error) {
    console.error('[handleSettingsCallback] Error:', error);
    const { createI18n } = await import('~/i18n');
    const { findUserByTelegramId } = await import('~/db/queries/users');
    const user = await findUserByTelegramId(db, telegramId);
    const errorI18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.systemErrorRetry'));
  }
}

// refreshSettingsMenu removed as toggles are no longer available in UI

// ... existing code for handleLanguageChange, handleBackToSettings, getLanguageName ...
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

    // Debug: Verify language was saved
    const { findUserByTelegramId } = await import('~/db/queries/users');
    const updatedUser = await findUserByTelegramId(db, telegramId);
    console.error('[handleLanguageChange] Updated user language_pref:', updatedUser?.language_pref);

    const { createI18n } = await import('~/i18n');
    const newI18n = createI18n(languageCode);
    const newLanguageName = await getLanguageName(languageCode);
    await telegram.answerCallbackQuery(
      callbackQuery.id,
      newI18n.t('settings.languageUpdated', { language: newLanguageName })
    );

    // Delete language selection message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Send confirmation message
    const confirmMessage = newI18n.t('settings.languageUpdated', { language: newLanguageName });
    const sentMessage = await telegram.sendMessage(chatId, confirmMessage);

    // Wait 2 seconds, then automatically return to menu
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Delete confirmation message and show menu
    try {
      await telegram.deleteMessage(chatId, sentMessage.message_id);
    } catch (error) {
      // Ignore if message already deleted
      console.error('[handleLanguageChange] Failed to delete confirmation message:', error);
    }

    // Return to main menu
    const { handleMenu } = await import('./menu');
    const fakeMessage = {
      ...callbackQuery.message!,
      from: callbackQuery.from,
      text: '/menu',
    };
    await handleMenu(fakeMessage as any, env);
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
