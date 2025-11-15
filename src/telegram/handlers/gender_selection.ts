/**
 * Gender Selection Handler
 * Handles gender selection during onboarding
 */

import type { Env, CallbackQuery } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { findUserByTelegramId, updateUserProfile, updateOnboardingStep } from '~/db/queries/users';
import { createTelegramService } from '~/services/telegram';

/**
 * Handle gender selection callback
 */
export async function handleGenderSelection(
  callbackQuery: CallbackQuery,
  gender: 'male' | 'female',
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env);
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

    // Check if already set gender
    if (user.gender) {
      await telegram.answerCallbackQuery(callbackQuery.id, '⚠️ 性別已設定，無法修改');
      return;
    }

    // Show confirmation
    const genderText = gender === 'male' ? '男性' : '女性';
    await telegram.editMessageText(
      chatId,
      callbackQuery.message!.message_id,
      `⚠️ 再次確認：性別設定後將**永遠不能修改**！\n\n` +
        `你選擇的性別是：${genderText}\n\n` +
        `請確認：`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ 確認', callback_data: `gender_confirm_${gender}` },
              { text: '❌ 重新選擇', callback_data: 'gender_reselect' },
            ],
          ],
        },
      }
    );

    await telegram.answerCallbackQuery(callbackQuery.id);
  } catch (error) {
    console.error('[handleGenderSelection] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle gender confirmation
 */
export async function handleGenderConfirmation(
  callbackQuery: CallbackQuery,
  gender: 'male' | 'female',
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Save gender
    await updateUserProfile(db, telegramId, { gender });

    // Move to next step
    await updateOnboardingStep(db, telegramId, 'birthday');

    // Delete confirmation message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Ask for birthday
    await telegram.sendMessage(
      chatId,
      `✅ 性別已設定為：${gender === 'male' ? '男性' : '女性'}\n\n` +
        `現在請輸入你的生日（格式：YYYY-MM-DD）：\n\n` +
        `例如：1995-06-15\n\n` +
        `⚠️ 注意：\n` +
        `• 生日設定後無法修改\n` +
        `• 必須年滿 18 歲才能使用本服務`
    );

    await telegram.answerCallbackQuery(callbackQuery.id, '✅ 性別已設定');
  } catch (error) {
    console.error('[handleGenderConfirmation] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle gender reselection
 */
export async function handleGenderReselection(
  callbackQuery: CallbackQuery,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;

  try {
    // Show gender selection again
    await telegram.editMessageText(
      chatId,
      callbackQuery.message!.message_id,
      `請選擇你的性別：\n\n` + `⚠️ 注意：性別設定後無法修改，請謹慎選擇！`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '👨 男性', callback_data: 'gender_male' },
              { text: '👩 女性', callback_data: 'gender_female' },
            ],
          ],
        },
      }
    );

    await telegram.answerCallbackQuery(callbackQuery.id);
  } catch (error) {
    console.error('[handleGenderReselection] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

