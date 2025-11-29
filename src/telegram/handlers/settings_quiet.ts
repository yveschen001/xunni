import type { Env, TelegramCallbackQuery, InlineKeyboardButton } from '~/types';
import { createTelegramService } from '~/services/telegram';
import { createDatabaseClient } from '~/db/client';
import { findUserByTelegramId } from '~/db/queries/users';
import { createI18n } from '~/i18n';
import { UserPreferencesService } from '~/services/user_preferences';
import { handleSettings } from './settings';

/**
 * Helper to generate 24h grid
 */
function generateHourGrid(callbackPrefix: string): InlineKeyboardButton[][] {
  const grid: InlineKeyboardButton[][] = [];
  let row: InlineKeyboardButton[] = [];

  for (let i = 0; i < 24; i++) {
    const hourStr = i.toString().padStart(2, '0');
    row.push({ text: `${hourStr}:00`, callback_data: `${callbackPrefix}${i}` });

    if (row.length === 4) {
      // 4 columns looks better on mobile
      grid.push(row);
      row = [];
    }
  }
  if (row.length > 0) grid.push(row);
  return grid;
}

/**
 * Step 1: Show Start Hour Selection
 */
export async function showQuietHoursStartSelection(
  callbackQuery: TelegramCallbackQuery,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  const user = await findUserByTelegramId(db, telegramId);
  const i18n = createI18n(user?.language_pref || 'zh-TW');

  const grid = generateHourGrid('quiet_start_');

  // Add specific control buttons
  const controls: InlineKeyboardButton[][] = [
    [
      {
        text: i18n.t('settings.quietDisable', { defaultValue: '🚫 停用安靜時段' }),
        callback_data: 'quiet_disable',
      },
    ],
    [{ text: i18n.t('common.back', { defaultValue: '返回' }), callback_data: 'back_to_settings' }],
  ];

  await telegram.editMessageText(
    chatId,
    callbackQuery.message!.message_id,
    i18n.t('settings.selectStartHour', {
      defaultValue: '🌙 請選擇安靜時段的「開始時間」：\n(例如：若要在 23:00 開始，請點選 23:00)',
    }),
    {
      reply_markup: {
        inline_keyboard: [...grid, ...controls],
      },
    }
  );
}

/**
 * Step 2: Handle Start Hour -> Show End Hour Selection
 */
export async function handleQuietHoursStartSelection(
  callbackQuery: TelegramCallbackQuery,
  startHour: number,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  const user = await findUserByTelegramId(db, telegramId);
  const i18n = createI18n(user?.language_pref || 'zh-TW');

  // Prefix for end hour selection: quiet_save_{startHour}_{endHour}
  const grid = generateHourGrid(`quiet_save_${startHour}_`);

  const controls: InlineKeyboardButton[][] = [
    [
      {
        text: i18n.t('common.back', { defaultValue: '返回' }),
        callback_data: 'settings_edit_quiet_hours',
      },
    ],
  ];

  await telegram.editMessageText(
    chatId,
    callbackQuery.message!.message_id,
    i18n.t('settings.selectEndHour', {
      defaultValue:
        '☀️ 開始時間已設定為 {start}:00。\n請選擇安靜時段的「結束時間」：\n(在此時間後恢復通知)',
      start: startHour.toString().padStart(2, '0'),
    }),
    {
      reply_markup: {
        inline_keyboard: [...grid, ...controls],
      },
    }
  );
}

/**
 * Step 3: Handle End Hour -> Save -> Return to Settings
 */
export async function handleQuietHoursSave(
  callbackQuery: TelegramCallbackQuery,
  startHour: number,
  endHour: number,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  const user = await findUserByTelegramId(db, telegramId);
  const i18n = createI18n(user?.language_pref || 'zh-TW');

  // Save to DB
  const prefsService = new UserPreferencesService(db.d1);
  await prefsService.updatePreferences(telegramId, {
    quiet_hours_start: startHour,
    quiet_hours_end: endHour,
  });

  await telegram.answerCallbackQuery(
    callbackQuery.id,
    i18n.t('settings.saved', { defaultValue: '✅ 設定已保存' })
  );

  // Return to settings
  await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

  // Invoke settings menu
  const fakeMessage = {
    ...callbackQuery.message!,
    from: callbackQuery.from,
    text: '/settings',
  };
  await handleSettings(fakeMessage as any, env);
}

/**
 * Handle Disable
 */
export async function handleQuietHoursDisable(
  callbackQuery: TelegramCallbackQuery,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  const user = await findUserByTelegramId(db, telegramId);
  const i18n = createI18n(user?.language_pref || 'zh-TW');

  // Disable by setting start = end (e.g. 0, 0)
  const prefsService = new UserPreferencesService(db.d1);
  await prefsService.updatePreferences(telegramId, {
    quiet_hours_start: 0,
    quiet_hours_end: 0,
  });

  await telegram.answerCallbackQuery(
    callbackQuery.id,
    i18n.t('settings.disabled', { defaultValue: '🚫 安靜時段已停用' })
  );

  await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

  const fakeMessage = {
    ...callbackQuery.message!,
    from: callbackQuery.from,
    text: '/settings',
  };
  await handleSettings(fakeMessage as any, env);
}
