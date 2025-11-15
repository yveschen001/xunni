/**
 * MBTI Test Handler
 * 
 * Handles conversational MBTI test flow in bot.
 * Questions are asked one by one with button options.
 */

import type { CallbackQuery } from '~/types';
import type { DatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { createDatabaseClient } from '~/db/client';
import { findUserByTelegramId, updateOnboardingStep } from '~/db/queries/users';
import {
  getMBTITestProgress,
  saveAnswerAndAdvance,
  completeMBTITest,
} from '~/services/mbti_test_service';
import {
  getQuestion,
  getTotalQuestions,
  getProgressPercentage,
  MBTI_DESCRIPTIONS,
} from '~/domain/mbti_test';

// ============================================================================
// Show MBTI Question
// ============================================================================

/**
 * Show MBTI test question with answer buttons
 */
export async function showMBTIQuestion(
  chatId: number,
  telegram: ReturnType<typeof createTelegramService>,
  db: DatabaseClient,
  telegramId: string,
  questionIndex: number
): Promise<void> {
  const question = getQuestion(questionIndex, 'zh-TW');
  if (!question) {
    throw new Error(`Invalid question index: ${questionIndex}`);
  }

  const progress = getProgressPercentage(questionIndex);
  const totalQuestions = getTotalQuestions();

  // Build answer buttons
  const answerButtons = question.options.map((option, index) => [
    {
      text: option.text_zh_TW,
      callback_data: `mbti_answer_${questionIndex}_${index}`,
    },
  ]);

  // Add progress indicator
  const progressBar = '▓'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10));

  await telegram.sendMessageWithButtons(
    chatId,
    `📝 MBTI 測驗 (${questionIndex + 1}/${totalQuestions})\n\n` +
      `${progressBar} ${progress}%\n\n` +
      `${question.question_zh_TW}`,
    answerButtons
  );
}

// ============================================================================
// Handle MBTI Answer
// ============================================================================

/**
 * Handle user's answer to MBTI question
 */
export async function handleMBTIAnswer(
  callbackQuery: CallbackQuery,
  questionIndex: number,
  answerIndex: number,
  env: any
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

    // Verify test is in progress
    const progress = await getMBTITestProgress(db, telegramId);
    if (!progress) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 測驗已結束或不存在');
      return;
    }

    // Verify question index matches current progress
    if (questionIndex !== progress.current_question) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 問題順序錯誤');
      return;
    }

    // Save answer and advance
    const newProgress = await saveAnswerAndAdvance(db, telegramId, answerIndex);

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id, '✅ 已記錄');

    // Delete question message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Check if test is complete
    if (newProgress.current_question >= getTotalQuestions()) {
      // Test complete - calculate result
      await handleTestCompletion(chatId, telegram, db, telegramId);
    } else {
      // Show next question
      await showMBTIQuestion(chatId, telegram, db, telegramId, newProgress.current_question);
    }
  } catch (error) {
    console.error('[handleMBTIAnswer] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

// ============================================================================
// Test Completion
// ============================================================================

/**
 * Handle test completion - calculate and show result
 */
async function handleTestCompletion(
  chatId: number,
  telegram: ReturnType<typeof createTelegramService>,
  db: DatabaseClient,
  telegramId: string
): Promise<void> {
  try {
    // Complete test and get result
    const result = await completeMBTITest(db, telegramId);

    // Get user to check if in onboarding
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      throw new Error('User not found');
    }

    // Show result
    await telegram.sendMessage(
      chatId,
      `🎉 測驗完成！\n\n` +
        `你的 MBTI 類型是：**${result.type}**\n\n` +
        `${result.description_zh_TW}\n\n` +
        `💡 你可以隨時使用 /mbti 指令重新測驗或手動修改。`
    );

    // If in onboarding, continue to next step
    if (user.onboarding_step === 'mbti') {
      await updateOnboardingStep(db, telegramId, 'anti_fraud');

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
    }
  } catch (error) {
    console.error('[handleTestCompletion] Error:', error);
    await telegram.sendMessage(chatId, '❌ 計算結果時發生錯誤，請稍後再試。');
  }
}

