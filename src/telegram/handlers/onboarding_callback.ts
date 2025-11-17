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

    // Move to next step: blood_type
    await updateOnboardingStep(db, telegramId, 'blood_type');

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id, '✅ 生日已保存');

    // Delete confirmation message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Show blood type selection
    const { getBloodTypeOptions } = await import('~/domain/blood_type');
    const options = getBloodTypeOptions();
    
    await telegram.sendMessageWithButtons(
      chatId,
      `🩸 **請選擇你的血型**\n\n` +
        `💡 填寫血型可用於未來的血型配對功能（VIP 專屬）\n\n` +
        `請選擇你的血型：`,
      [
        [
          { text: options[0].display, callback_data: 'blood_type_A' },
          { text: options[1].display, callback_data: 'blood_type_B' },
        ],
        [
          { text: options[2].display, callback_data: 'blood_type_AB' },
          { text: options[3].display, callback_data: 'blood_type_O' },
        ],
        [
          { text: options[4].display, callback_data: 'blood_type_skip' },
        ],
      ]
    );
  } catch (error) {
    console.error('[handleBirthdayConfirm] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

// ============================================================================
// Blood Type Selection
// ============================================================================

export async function handleBloodTypeSelection(
  callbackQuery: CallbackQuery,
  bloodTypeValue: string,
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

    // Check if user is in blood_type step
    if (user.onboarding_step !== 'blood_type') {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 當前不在血型選擇步驟');
      return;
    }

    // Parse blood type (skip means null)
    const bloodType = bloodTypeValue === 'skip' ? null : bloodTypeValue;

    // Save blood type
    await updateUserProfile(db, telegramId, {
      blood_type: bloodType,
    });

    // Move to next step: mbti
    await updateOnboardingStep(db, telegramId, 'mbti');

    // Answer callback
    const { getBloodTypeDisplay } = await import('~/domain/blood_type');
    const displayText = bloodType ? `✅ 血型已設定為 ${getBloodTypeDisplay(bloodType as any)}` : '✅ 已跳過血型設定';
    await telegram.answerCallbackQuery(callbackQuery.id, displayText);

    // Delete blood type message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Show MBTI options: manual / test / skip
    await telegram.sendMessageWithButtons(
      chatId,
      `🧠 現在讓我們設定你的 MBTI 性格類型！\n\n` +
        `這將幫助我們為你找到更合適的聊天對象～\n\n` +
        `你想要如何設定？`,
      [
        [
          { text: '✍️ 我已經知道我的 MBTI', callback_data: 'mbti_choice_manual' },
        ],
        [
          { text: '📝 進行快速測驗（12 題，僅供參考）', callback_data: 'mbti_choice_test' },
        ],
        [
          { text: '⏭️ 稍後再說', callback_data: 'mbti_choice_skip' },
        ],
      ]
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
// MBTI Choice (Manual / Test / Skip)
// ============================================================================

/**
 * Handle MBTI choice: manual entry
 */
export async function handleMBTIChoiceManual(
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

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id);

    // Delete choice message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Show 16 MBTI type buttons
    await telegram.sendMessageWithButtons(
      chatId,
      `請選擇你的 MBTI 類型：\n\n` +
        `如果不確定，可以先進行測驗或稍後再設定。`,
      [
        [
          { text: 'INTJ', callback_data: 'mbti_manual_INTJ' },
          { text: 'INTP', callback_data: 'mbti_manual_INTP' },
          { text: 'ENTJ', callback_data: 'mbti_manual_ENTJ' },
          { text: 'ENTP', callback_data: 'mbti_manual_ENTP' },
        ],
        [
          { text: 'INFJ', callback_data: 'mbti_manual_INFJ' },
          { text: 'INFP', callback_data: 'mbti_manual_INFP' },
          { text: 'ENFJ', callback_data: 'mbti_manual_ENFJ' },
          { text: 'ENFP', callback_data: 'mbti_manual_ENFP' },
        ],
        [
          { text: 'ISTJ', callback_data: 'mbti_manual_ISTJ' },
          { text: 'ISFJ', callback_data: 'mbti_manual_ISFJ' },
          { text: 'ESTJ', callback_data: 'mbti_manual_ESTJ' },
          { text: 'ESFJ', callback_data: 'mbti_manual_ESFJ' },
        ],
        [
          { text: 'ISTP', callback_data: 'mbti_manual_ISTP' },
          { text: 'ISFP', callback_data: 'mbti_manual_ISFP' },
          { text: 'ESTP', callback_data: 'mbti_manual_ESTP' },
          { text: 'ESFP', callback_data: 'mbti_manual_ESFP' },
        ],
        [
          { text: '⬅️ 返回', callback_data: 'mbti_choice_back' },
        ],
      ]
    );
  } catch (error) {
    console.error('[handleMBTIChoiceManual] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle MBTI choice: take test
 */
export async function handleMBTIChoiceTest(
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

    // Start MBTI test
    const { startMBTITest } = await import('~/services/mbti_test_service');
    await startMBTITest(db, telegramId);

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id, '✅ 開始測驗');

    // Delete choice message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Show first question
    const { showMBTIQuestion } = await import('../handlers/mbti_test');
    await showMBTIQuestion(chatId, telegram, db, telegramId, 0);
  } catch (error) {
    console.error('[handleMBTIChoiceTest] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle MBTI choice: skip
 */
export async function handleMBTIChoiceSkip(
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

    // Move to next step (anti_fraud) without setting MBTI
    await updateOnboardingStep(db, telegramId, 'anti_fraud');

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id, '✅ 已跳過');

    // Delete choice message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Show anti-fraud test
    await telegram.sendMessageWithButtons(
      chatId,
      `好的，你可以稍後再設定 MBTI。\n\n` +
        `💡 提示：你可以隨時使用 /mbti 指令來設定或測驗你的 MBTI 類型。\n\n` +
        `🛡️ 現在進行反詐騙安全確認\n\n` +
        `為了保護所有使用者的安全，請確認你了解以下事項：\n\n` +
        `1. 你了解網路交友的安全風險嗎？\n` +
        `2. 你會保護好自己的個人資訊嗎？\n` +
        `3. 遇到可疑訊息時，你會提高警覺嗎？\n\n` +
        `請確認：`,
      [
        [{ text: '✅ 是的，我了解並會注意安全', callback_data: 'anti_fraud_yes' }],
        [{ text: '📚 我想了解更多安全知識', callback_data: 'anti_fraud_learn' }],
      ]
    );
  } catch (error) {
    console.error('[handleMBTIChoiceSkip] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle MBTI choice: back button (from manual selection)
 */
export async function handleMBTIChoiceBack(
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

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id);

    // Delete manual selection message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Show MBTI options again (3 choices)
    await telegram.sendMessageWithButtons(
      chatId,
      `🧠 現在讓我們設定你的 MBTI 性格類型！\n\n` +
        `這將幫助我們為你找到更合適的聊天對象～\n\n` +
        `你想要如何設定？`,
      [
        [
          { text: '✍️ 我已經知道我的 MBTI', callback_data: 'mbti_choice_manual' },
        ],
        [
          { text: '📝 進行快速測驗（12 題，僅供參考）', callback_data: 'mbti_choice_test' },
        ],
        [
          { text: '⏭️ 稍後再說', callback_data: 'mbti_choice_skip' },
        ],
      ]
    );
  } catch (error) {
    console.error('[handleMBTIChoiceBack] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

// ============================================================================
// MBTI Manual Selection
// ============================================================================

export async function handleMBTIManualSelection(
  callbackQuery: CallbackQuery,
  mbtiType: string,
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

    // Validate MBTI type
    const { validateMBTI } = await import('~/domain/user');
    const validation = validateMBTI(mbtiType);
    if (!validation.valid) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 無效的 MBTI 類型');
      return;
    }

    // Save MBTI result with source = 'manual'
    const now = new Date().toISOString();
    await db.d1
      .prepare(
        `UPDATE users
         SET mbti_result = ?, mbti_source = 'manual', mbti_completed_at = ?, updated_at = ?
         WHERE telegram_id = ?`
      )
      .bind(mbtiType, now, now, telegramId)
      .run();

    // Move to next step
    await updateOnboardingStep(db, telegramId, 'anti_fraud');

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id, `✅ MBTI 已設定為 ${mbtiType}`);

    // Delete selection message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Get MBTI description
    const { MBTI_DESCRIPTIONS } = await import('~/domain/mbti_test');
    const description = MBTI_DESCRIPTIONS[mbtiType];

    // Show result and continue to anti-fraud
    await telegram.sendMessage(
      chatId,
      `✅ 你的 MBTI 類型：${mbtiType}\n\n` +
        `${description?.zh_TW || ''}\n\n` +
        `💡 你可以隨時使用 /mbti 指令重新測驗或修改。`
    );

    // Show anti-fraud test
    await telegram.sendMessageWithButtons(
      chatId,
      `🛡️ 最後一步：反詐騙安全確認\n\n` +
        `為了保護所有使用者的安全，請確認你了解以下事項：\n\n` +
        `1. 你了解網路交友的安全風險嗎？\n` +
        `2. 你會保護好自己的個人資訊嗎？\n` +
        `3. 遇到可疑訊息時，你會提高警覺嗎？\n\n` +
        `請確認：`,
      [
        [{ text: '✅ 是的，我了解並會注意安全', callback_data: 'anti_fraud_yes' }],
        [{ text: '📚 我想了解更多安全知識', callback_data: 'anti_fraud_learn' }],
      ]
    );
  } catch (error) {
    console.error('[handleMBTIManualSelection] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

// ============================================================================
// MBTI Selection (Legacy - kept for backward compatibility)
// ============================================================================

export async function handleMBTISelection(
  callbackQuery: CallbackQuery,
  mbtiType: string,
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

    // Check if user is in MBTI step
    if (user.onboarding_step !== 'mbti') {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 當前不在 MBTI 測驗步驟');
      return;
    }

    // Save MBTI result
    const { updateMBTIResult } = await import('~/db/queries/users');
    await updateMBTIResult(db, telegramId, mbtiType);

    // Move to next step
    await updateOnboardingStep(db, telegramId, 'anti_fraud');

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id, `✅ MBTI 已設定為 ${mbtiType}`);

    // Delete MBTI selection message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Show anti-fraud test with buttons
    await telegram.sendMessageWithButtons(
      chatId,
      `✅ MBTI 類型已設定：${mbtiType}\n\n` +
        `🛡️ 最後一步：反詐騙安全確認\n\n` +
        `為了保護所有使用者的安全，請確認你了解以下事項：\n\n` +
        `1. 你了解網路交友的安全風險嗎？\n` +
        `2. 你會保護好自己的個人資訊嗎？\n` +
        `3. 遇到可疑訊息時，你會提高警覺嗎？\n\n` +
        `請確認：`,
      [
        [{ text: '✅ 是的，我了解並會注意安全', callback_data: 'anti_fraud_yes' }],
        [{ text: '📚 我想了解更多安全知識', callback_data: 'anti_fraud_learn' }],
      ]
    );
  } catch (error) {
    console.error('[handleMBTISelection] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

// ============================================================================
// Anti-Fraud Confirmation
// ============================================================================

export async function handleAntiFraudConfirmation(
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

    // Check if user is in anti_fraud step
    if (user.onboarding_step !== 'anti_fraud') {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 當前不在反詐騙測驗步驟');
      return;
    }

    // Save anti-fraud score
    const { updateAntiFraudScore } = await import('~/db/queries/users');
    await updateAntiFraudScore(db, telegramId, 80);

    // Move to next step
    await updateOnboardingStep(db, telegramId, 'terms');

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id, '✅ 安全確認完成');

    // Delete anti-fraud message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Show terms agreement
    await telegram.sendMessageWithButtons(
      chatId,
      `✅ 反詐騙測驗通過！\n\n` +
        `📋 最後一步：服務條款\n\n` +
        `在開始使用前，請閱讀並同意我們的服務條款：\n\n` +
        `• 隱私權政策：我們如何保護你的個人資料\n` +
        `• 使用者條款：使用本服務的規範\n\n` +
        `點擊下方按鈕表示你已閱讀並同意上述條款。`,
      [
        [{ text: '✅ 我已閱讀並同意', callback_data: 'agree_terms' }],
        [{ text: '📋 查看隱私權政策', url: 'https://xunni.example.com/privacy' }],
        [{ text: '📋 查看使用者條款', url: 'https://xunni.example.com/terms' }],
      ]
    );
  } catch (error) {
    console.error('[handleAntiFraudConfirmation] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

// ============================================================================
// Anti-Fraud Learn More
// ============================================================================

export async function handleAntiFraudLearnMore(
  callbackQuery: CallbackQuery,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;

  try {
    // Show safety tips
    await telegram.editMessageText(
      chatId,
      callbackQuery.message!.message_id,
      `🛡️ 網路交友安全小貼士\n\n` +
        `1. 🔒 保護個人資訊\n` +
        `   • 不要輕易透露真實姓名、地址、電話\n` +
        `   • 不要分享財務資訊\n\n` +
        `2. 🚨 識別詐騙訊息\n` +
        `   • 警惕索要金錢的訊息\n` +
        `   • 不要點擊可疑連結\n\n` +
        `3. 🤝 安全交友\n` +
        `   • 第一次見面選擇公共場所\n` +
        `   • 告訴朋友你的行程\n\n` +
        `了解後，請確認：`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '✅ 我了解了，繼續註冊', callback_data: 'anti_fraud_yes' }],
          ],
        },
      }
    );

    await telegram.answerCallbackQuery(callbackQuery.id);
  } catch (error) {
    console.error('[handleAntiFraudLearnMore] Error:', error);
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

