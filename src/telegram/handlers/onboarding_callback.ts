/**
 * Onboarding Callback Handler
 * Handles callback queries during onboarding (gender, terms, etc.)
 */

import type { Env, CallbackQuery } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { findUserByTelegramId, updateUserProfile, updateOnboardingStep } from '~/db/queries/users';
import { createTelegramService } from '~/services/telegram';

// ============================================================================
// Gender Selection
// ============================================================================

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

    // Check if user is in gender selection step
    if (user.onboarding_step !== 'gender') {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 當前不在性別選擇步驟');
      return;
    }

    // Show confirmation
    await telegram.answerCallbackQuery(callbackQuery.id);
    await telegram.editMessageText(
      chatId,
      callbackQuery.message!.message_id,
      `✅ 你選擇了：${gender === 'male' ? '👨 男性' : '👩 女性'}\n\n` +
        `⚠️ 再次提醒：性別設定後將**永遠不能修改**！\n\n` +
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
  } catch (error) {
    console.error('[handleGenderSelection] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

// ============================================================================
// Gender Confirmation
// ============================================================================

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
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 用戶不存在');
      return;
    }

    // Save gender
    await updateUserProfile(db, telegramId, { gender });

    // Move to next step
    await updateOnboardingStep(db, telegramId, 'birthday');

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id, '✅ 性別已保存');

    // Delete confirmation message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Ask for birthday
    await telegram.sendMessage(
      chatId,
      `請輸入你的生日（格式：YYYY-MM-DD）：\n\n` +
        `例如：1995-06-15\n\n` +
        `⚠️ 注意：\n` +
        `• 生日設定後無法修改\n` +
        `• 必須年滿 18 歲才能使用本服務`
    );
  } catch (error) {
    console.error('[handleGenderConfirmation] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

// ============================================================================
// Gender Reselection
// ============================================================================

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

// ============================================================================
// Birthday Confirmation
// ============================================================================

export async function handleBirthdayConfirmation(
  callbackQuery: CallbackQuery,
  birthday: string,
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

    // Check if user is in birthday step
    if (user.onboarding_step !== 'birthday') {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 當前不在生日輸入步驟');
      return;
    }

    // Import domain functions
    const { calculateAge, calculateZodiacSign } = await import('~/domain/user');
    
    // Calculate age and zodiac
    const age = calculateAge(birthday);
    const zodiacSign = calculateZodiacSign(birthday);

    if (age === null || zodiacSign === null) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 生日格式錯誤');
      return;
    }

    // Check age restriction
    if (age < 18) {
      await telegram.answerCallbackQuery(callbackQuery.id);
      await telegram.editMessageText(
        chatId,
        callbackQuery.message!.message_id,
        `❌ 很抱歉，你必須年滿 18 歲才能使用本服務。\n\n請成年後再來！`
      );
      return;
    }

    // Save birthday, age, and zodiac
    await updateUserProfile(db, telegramId, {
      birthday,
      age,
      zodiac_sign: zodiacSign,
    });

    // Move to next step
    await updateOnboardingStep(db, telegramId, 'mbti');

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id, '✅ 生日已保存');

    // Delete confirmation message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Ask for MBTI
    await telegram.sendMessage(
      chatId,
      `現在讓我們進行 MBTI 性格測驗！\n\n` +
        `這將幫助我們為你找到更合適的聊天對象～\n\n` +
        `準備好了嗎？請回答「是」開始測驗。`
    );
  } catch (error) {
    console.error('[handleBirthdayConfirmation] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

// ============================================================================
// Birthday Retry
// ============================================================================

export async function handleBirthdayRetry(
  callbackQuery: CallbackQuery,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;

  try {
    // Delete confirmation message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Ask for birthday again
    await telegram.sendMessage(
      chatId,
      `請重新輸入你的生日（格式：YYYY-MM-DD）：\n\n` +
        `例如：1995-06-15\n\n` +
        `⚠️ 注意：\n` +
        `• 生日設定後無法修改\n` +
        `• 必須年滿 18 歲才能使用本服務`
    );

    await telegram.answerCallbackQuery(callbackQuery.id);
  } catch (error) {
    console.error('[handleBirthdayRetry] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

// ============================================================================
// Terms Agreement
// ============================================================================

export async function handleTermsAgreement(
  callbackQuery: CallbackQuery,
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

    // Check if user is in terms step
    if (user.onboarding_step !== 'terms') {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 當前不在服務條款步驟');
      return;
    }

    // Mark onboarding as completed
    await updateOnboardingStep(db, telegramId, 'completed');

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id, '✅ 註冊完成！');

    // Delete terms message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Get updated user profile
    const updatedUser = await findUserByTelegramId(db, telegramId);
    if (!updatedUser) {
      await telegram.sendMessage(chatId, '❌ 發生錯誤');
      return;
    }

    // Show completion message
    await telegram.sendMessageWithButtons(
      chatId,
      `🎉 恭喜！你已經完成所有設定！\n\n` +
        `你的個人資料：\n` +
        `• 暱稱：${updatedUser.nickname}\n` +
        `• 性別：${updatedUser.gender === 'male' ? '男性' : '女性'}\n` +
        `• 年齡：${updatedUser.age} 歲\n` +
        `• 星座：${updatedUser.zodiac_sign}\n` +
        `• MBTI：${updatedUser.mbti_result}\n\n` +
        `現在你可以開始使用 XunNi 了！`,
      [
        [
          { text: '🌊 丟出漂流瓶', callback_data: 'throw' },
          { text: '🎣 撿起漂流瓶', callback_data: 'catch' },
        ],
        [
          { text: '👤 個人資料', callback_data: 'profile' },
          { text: '📊 統計', callback_data: 'stats' },
        ],
      ]
    );
  } catch (error) {
    console.error('[handleTermsAgreement] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

