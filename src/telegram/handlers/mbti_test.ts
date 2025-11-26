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
import { getMBTIQuestions, getTotalQuestionsByVersion } from '~/domain/mbti_test';

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
  // Get test progress to determine version
  const testProgress = await getMBTITestProgress(db, telegramId);
  const version = testProgress?.test_version || 'quick';

  // Get user for i18n
  const user = await findUserByTelegramId(db, telegramId);
  const { createI18n } = await import('~/i18n');
  const i18n = createI18n(user?.language_pref || 'zh-TW');

  // Get questions for the version (structure only, for scores)
  const questions = getMBTIQuestions(version);
  const question = questions[questionIndex];
  if (!question) {
    throw new Error(`Invalid question index: ${questionIndex}`);
  }

  const totalQuestions = getTotalQuestionsByVersion(version);
  const progress = Math.round((questionIndex / totalQuestions) * 100);

  // Get question text from i18n
  const questionKey = version === 'full' 
    ? `mbti.full.question${question.id}` 
    : `mbti.quick.question${question.id}`;
  const questionText = i18n.t(questionKey as any);
  
  // Build answer buttons with i18n support
  const answerButtons = question.options.map((option, index) => {
    const optionKey = version === 'full'
      ? `mbti.full.question${question.id}.option${index + 1}`
      : `mbti.quick.question${question.id}.option${index + 1}`;
    return [{
      text: i18n.t(optionKey as any),
      callback_data: `mbti_answer_${questionIndex}_${index}`,
    }];
  });

  // Add progress indicator
  const progressBar =
    '▓'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10));

  // Determine test title and disclaimer based on version
  const testTitle = version === 'full' ? i18n.t('mbtiTest.fullTest') : i18n.t('mbtiTest.quickTest');
  const testInfo = version === 'full' ? i18n.t('mbtiTest.questions36') : i18n.t('mbtiTest.questions12');

  // Add disclaimer on first question
  const disclaimer =
    questionIndex === 0
      ? version === 'full'
        ? i18n.t('mbtiTest.fullTestInfo', { questions: testInfo })
        : i18n.t('mbtiTest.quickTestInfo', { questions: testInfo })
      : `\n\n`;

  await telegram.sendMessageWithButtons(
    chatId,
    `📝 ${testTitle} (${questionIndex + 1}/${totalQuestions})\n\n` +
      `${progressBar} ${progress}%${disclaimer}` +
      `${questionText}`,
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
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n('zh-TW');
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('warning.userNotFound2'));
      return;
    }
    
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Verify test is in progress
    const progress = await getMBTITestProgress(db, telegramId);
    if (!progress) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('warning.end'));
      return;
    }

    // Verify question index matches current progress
    if (questionIndex !== progress.current_question) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('mbtiTest.questionOrderError'));
      return;
    }

    // Save answer and advance
    const newProgress = await saveAnswerAndAdvance(db, telegramId, answerIndex);

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('mbtiTest.answerRecorded'));

    // Delete question message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Check if test is complete
    if (newProgress.current_question >= newProgress.total_questions) {
      // Test complete - calculate result
      await handleTestCompletion(chatId, telegram, db, telegramId);
    } else {
      // Show next question
      await showMBTIQuestion(chatId, telegram, db, telegramId, newProgress.current_question);
    }
  } catch (error) {
    console.error('[handleMBTIAnswer] Error:', error);
    console.error('[handleMBTIAnswer] Error stack:', error instanceof Error ? error.stack : 'No stack');
    const user = await findUserByTelegramId(db, telegramId);
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('common.systemError'));
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
    console.log('[handleTestCompletion] Starting test completion for user:', telegramId);

    // Get test progress to determine version
    const testProgress = await getMBTITestProgress(db, telegramId);
    const version = testProgress?.test_version || 'quick';

    // Complete test and get result
    const result = await completeMBTITest(db, telegramId);
    console.log('[handleTestCompletion] MBTI result:', result);

    // Get user to check if in onboarding
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      console.error('[handleTestCompletion] User not found:', telegramId);
      throw new Error('User not found');
    }
    console.log('[handleTestCompletion] User onboarding step:', user.onboarding_step);

    // Determine completion message based on version
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user.language_pref || 'zh-TW');
    const testTitle = version === 'full' ? i18n.t('mbtiTest.fullTestTitle') : i18n.t('mbtiTest.quickTestTitle');
    const testInfo = version === 'full' ? i18n.t('mbtiTest.fullQuestions') : i18n.t('mbtiTest.quickQuestions');
    const accuracy = version === 'full' ? i18n.t('mbtiTest.fullAccuracy') : i18n.t('mbtiTest.quickAccuracy');

    // Get description from i18n
    const descriptionKey = `mbti.description.${result.type}`;
    const description = i18n.t(descriptionKey as any);

    // Show result
    const completionMessage =
      i18n.t('mbtiTest.completion', { testTitle }) +
      i18n.t('mbtiTest.yourMbtiType', { type: result.type }) +
      `${description}\n\n` +
      i18n.t('mbtiTest.note', { testInfo, testTitle, accuracy }) +
      i18n.t('mbtiTest.afterRegistration') +
      i18n.t('mbtiTest.moreDetailedTest') +
      i18n.t('mbtiTest.manualModify');

    // If in onboarding, show message only (no buttons)
    if (user.onboarding_step === 'mbti') {
      await telegram.sendMessage(chatId, completionMessage);
    } else {
      // If not in onboarding, show buttons to navigate
      await telegram.sendMessageWithButtons(chatId, completionMessage, [
        [{ text: i18n.t('buttons.mbtiMenu'), callback_data: 'mbti_menu_from_completion' }],
        [{ text: i18n.t('buttons.returnToMenu'), callback_data: 'return_to_menu' }],
      ]);
    }

    // If in onboarding, continue to next step
    if (user.onboarding_step === 'mbti') {
      console.log('[handleTestCompletion] User in onboarding, moving to anti_fraud');
      await updateOnboardingStep(db, telegramId, 'anti_fraud');

      // Show anti-fraud test
      await telegram.sendMessageWithButtons(
        chatId,
        i18n.t('onboarding.antiFraudFinalStep') +
          i18n.t('onboarding.antiFraudQuestions') +
          i18n.t('onboarding.antiFraudQuestion1') +
          i18n.t('onboarding.antiFraudQuestion2') +
          i18n.t('onboarding.antiFraudQuestion3') +
          i18n.t('onboarding.antiFraudConfirm'),
        [
          [{ text: i18n.t('onboarding.antiFraudYes'), callback_data: 'anti_fraud_yes' }],
          [{ text: i18n.t('onboarding.antiFraudLearn'), callback_data: 'anti_fraud_learn' }],
        ]
      );
    } else {
      console.log('[handleTestCompletion] User not in onboarding, test completed');
    }
  } catch (error) {
    console.error('[handleTestCompletion] Error:', error);
    console.error(
      '[handleTestCompletion] Error stack:',
      error instanceof Error ? error.stack : 'No stack'
    );
    // Get user for i18n (fallback to zh-TW if not found)
    const user = await findUserByTelegramId(db, telegramId);
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.sendMessage(
      chatId,
      i18n.t('errors.systemErrorRetry') + '\n\n' +
        i18n.t('errors.errorDetails', { error: error instanceof Error ? error.message : String(error) })
    );
  }
}
