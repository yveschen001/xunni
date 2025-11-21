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

/**
 * Show country confirmation dialog
 */
export async function showCountryConfirmation(
  chatId: number,
  user: User,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const currentFlag = getCountryFlagEmoji(user.country_code || 'UN');
  const currentCountry = getCountryName(user.country_code || 'UN');
  
  const message = 
    `🌍 **確認你的國家/地區**\n\n` +
    `我們根據你的語言設置，推測你來自：\n` +
    `${currentFlag} **${currentCountry}**\n\n` +
    `這正確嗎？\n\n` +
    `💡 這將顯示在你的資料卡上，讓其他用戶更了解你。\n` +
    `🎉 確認後可獲得 +1 瓶子獎勵！`;
  
  await telegram.sendMessageWithButtons(chatId, message, [
    [
      { text: '✅ 正確', callback_data: 'country_confirm_yes' },
      { text: '❌ 不正確', callback_data: 'country_select' },
    ],
    [
      { text: '🇺🇳 使用聯合國旗', callback_data: 'country_set_UN' },
    ],
  ]);
}

/**
 * Handle country confirmation (user confirms current country)
 */
export async function handleCountryConfirmYes(
  callbackQuery: any,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const telegramId = callbackQuery.from.id.toString();
  const chatId = callbackQuery.message!.chat.id;
  
  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 用戶不存在');
      return;
    }
    
    // Use existing checkAndCompleteTask function
    // country_code already has value, so isTaskCompleted will return true
    const completed = await checkAndCompleteTask(
      db,
      telegram,
      user,
      'task_confirm_country'
    );
    
    if (completed) {
      await telegram.answerCallbackQuery(callbackQuery.id, '✅ 已確認！');
      await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);
    } else {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 確認失敗');
    }
  } catch (error) {
    console.error('[handleCountryConfirmYes] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
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
    // Update country_code
    await db.d1
      .prepare(`UPDATE users SET country_code = ? WHERE telegram_id = ?`)
      .bind(countryCode, telegramId)
      .run();
    
    // Get updated user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 用戶不存在');
      return;
    }
    
    // Use existing checkAndCompleteTask function
    const completed = await checkAndCompleteTask(
      db,
      telegram,
      user,
      'task_confirm_country'
    );
    
    if (completed) {
      const flag = getCountryFlagEmoji(countryCode);
      const countryName = getCountryName(countryCode);
      await telegram.answerCallbackQuery(callbackQuery.id, `✅ 已設置為 ${flag} ${countryName}`);
      await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);
    } else {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 設置失敗');
    }
  } catch (error) {
    console.error('[handleCountrySet] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

