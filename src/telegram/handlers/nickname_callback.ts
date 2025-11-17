/**
 * Nickname Selection Callback Handler
 * Handles nickname selection during onboarding
 */

import type { Env, CallbackQuery } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { findUserByTelegramId, updateUserProfile, updateOnboardingStep } from '~/db/queries/users';
import { createTelegramService } from '~/services/telegram';
import { validateNickname } from '~/domain/user';

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
    if (!user) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 用戶不存在');
      return;
    }

    // Get Telegram nickname
    const nickname = callbackQuery.from.username || callbackQuery.from.first_name || '';
    
    if (!nickname) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 無法獲取 Telegram 暱稱');
      return;
    }

    // Truncate to 36 characters
    const truncatedNickname = nickname.substring(0, 36);

    // Validate nickname
    const validation = validateNickname(truncatedNickname);
    if (!validation.valid) {
      await telegram.answerCallbackQuery(callbackQuery.id, `❌ ${validation.error}`);
      return;
    }

    // Save nickname
    await updateUserProfile(db, telegramId, { nickname: truncatedNickname });

    // Move to next step
    await updateOnboardingStep(db, telegramId, 'gender');

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id, '✅ 暱稱已設定');

    // Delete nickname selection message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Show gender selection
    await telegram.sendMessageWithButtons(
      chatId,
      `很好！你的暱稱是：${truncatedNickname}\n\n` +
        `現在請選擇你的性別：\n\n` +
        `⚠️ 注意：性別設定後無法修改，請謹慎選擇！`,
      [
        [
          { text: '👨 男性', callback_data: 'gender_male' },
          { text: '👩 女性', callback_data: 'gender_female' },
        ],
      ]
    );
  } catch (error) {
    console.error('[handleNicknameUseTelegram] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle custom nickname
 */
export async function handleNicknameCustom(
  callbackQuery: CallbackQuery,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;

  try {
    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id);

    // Delete nickname selection message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Ask for custom nickname
    await telegram.sendMessage(
      chatId,
      `✏️ 請輸入你的暱稱：\n\n` +
        `⚠️ 注意：\n` +
        `• 暱稱長度限制 36 個字\n` +
        `• 對方最多顯示 18 個字\n` +
        `• 請勿使用暱稱發送廣告`
    );
  } catch (error) {
    console.error('[handleNicknameCustom] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

