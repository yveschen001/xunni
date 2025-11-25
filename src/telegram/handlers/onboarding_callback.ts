/**
 * Onboarding Callback Handler
 * Handles callback queries during onboarding (gender, terms, etc.)
 */

import type { Env, CallbackQuery } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { findUserByTelegramId, updateUserProfile, updateOnboardingStep } from '~/db/queries/users';
import { createTelegramService } from '~/services/telegram';
import { LEGAL_URLS } from '~/config/legal_urls';
import { createI18n } from '~/i18n';

// ============================================================================
// Gender Selection
// ============================================================================

export async function handleGenderSelection(
  callbackQuery: CallbackQuery,
  gender: 'male' | 'female',
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
      const errorI18n = createI18n('zh-TW');
      await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.userNotFound4'));
      return;
    }

    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Check if user is in gender selection step
    if (user.onboarding_step !== 'gender') {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('warnings.gender'));
      return;
    }

    // Show confirmation
    await telegram.answerCallbackQuery(callbackQuery.id);
    await telegram.editMessageText(
      chatId,
      callbackQuery.message!.message_id,
      i18n.t('success.message8', { gender }) +
        '\n\n' +
        i18n.t('warnings.settings') +
        '\n\n' +
        i18n.t('common.confirm7'),
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: i18n.t('success.confirm3'), callback_data: `gender_confirm_${gender}` },
              { text: i18n.t('errors.error.short12'), callback_data: 'gender_reselect' },
            ],
          ],
        },
      }
    );
  } catch (error) {
    console.error('[handleGenderSelection] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short9'));
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
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      const errorI18n = createI18n('zh-TW');
      await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.userNotFound4'));
      return;
    }

    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Save gender
    await updateUserProfile(db, telegramId, { gender });

    // Move to next step
    await updateOnboardingStep(db, telegramId, 'birthday');

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('success.gender'));

    // Delete confirmation message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Ask for birthday
    await telegram.sendMessage(
      chatId,
      i18n.t('common.birthday3') +
        '\n\n' +
        i18n.t('common.text10') +
        '\n\n' +
        i18n.t('warnings.birthday') +
        '\n' +
        i18n.t('common.settings6') +
        '\n' +
        i18n.t('common.text9')
    );
  } catch (error) {
    console.error('[handleGenderConfirmation] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short9'));
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
    const db = createDatabaseClient(env.DB);
    const telegramId = callbackQuery.from.id.toString();
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    // Show gender selection again
    await telegram.editMessageText(
      chatId,
      callbackQuery.message!.message_id,
      i18n.t('common.gender3') +
        '\n\n' +
        i18n.t('warnings.settings'),
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: i18n.t('common.short86'), callback_data: 'gender_male' },
              { text: i18n.t('common.short87'), callback_data: 'gender_female' },
            ],
          ],
        },
      }
    );

    await telegram.answerCallbackQuery(callbackQuery.id);
  } catch (error) {
    console.error('[handleGenderReselection] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short9'));
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
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      const errorI18n = createI18n('zh-TW');
      await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.userNotFound4'));
      return;
    }

    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Check if user is in birthday step
    if (user.onboarding_step !== 'birthday') {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('warnings.birthday'));
      return;
    }

    // Import domain functions
    const { calculateAge, calculateZodiacSign } = await import('~/domain/user');

    // Calculate age and zodiac
    const age = calculateAge(birthday);
    const zodiacSign = calculateZodiacSign(birthday);

    if (age === null || zodiacSign === null) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.error.birthday3'));
      return;
    }

    // Check age restriction
    if (age < 18) {
      await telegram.answerCallbackQuery(callbackQuery.id);
      await telegram.editMessageText(
        chatId,
        callbackQuery.message!.message_id,
        i18n.t('errors.error.text23') +
          '\n\n' +
          i18n.t('common.text20')
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
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('success.birthday'));

    // Delete confirmation message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Show blood type selection
    const { getBloodTypeOptions } = await import('~/domain/blood_type');
    const options = getBloodTypeOptions();

    await telegram.sendMessageWithButtons(
      chatId,
      i18n.t('common.bloodType') +
        '\n\n' +
        i18n.t('common.vip') +
        '\n\n' +
        i18n.t('common.bloodType3'),
      [
        [
          { text: options[0].display, callback_data: 'blood_type_A' },
          { text: options[1].display, callback_data: 'blood_type_B' },
        ],
        [
          { text: options[2].display, callback_data: 'blood_type_AB' },
          { text: options[3].display, callback_data: 'blood_type_O' },
        ],
        [{ text: options[4].display, callback_data: 'blood_type_skip' }],
      ]
    );
  } catch (error) {
    console.error('[handleBirthdayConfirm] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short9'));
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
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      const errorI18n = createI18n('zh-TW');
      await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.userNotFound4'));
      return;
    }

    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Check if user is in blood_type step
    if (user.onboarding_step !== 'blood_type') {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('warnings.bloodType'));
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
    const displayText = bloodType
      ? i18n.t('success.settings4', { getBloodTypeDisplay: () => getBloodTypeDisplay(bloodType as any) }).replace(/\$\{getBloodTypeDisplay\(bloodType as any\)\}/, getBloodTypeDisplay(bloodType as any))
      : i18n.t('success.settings6');
    await telegram.answerCallbackQuery(callbackQuery.id, displayText);

    // Delete blood type message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Show MBTI options: manual / test / skip
    await telegram.sendMessageWithButtons(
      chatId,
      i18n.t('common.settings2') +
        '\n\n' +
        i18n.t('common.help') +
        '\n\n' +
        i18n.t('common.settings7'),
      [
        [{ text: i18n.t('common.mbti2'), callback_data: 'mbti_choice_manual' }],
        [{ text: i18n.t('common.text5'), callback_data: 'mbti_choice_test' }],
        [{ text: i18n.t('common.short'), callback_data: 'mbti_choice_skip' }],
      ]
    );
  } catch (error) {
    console.error('[handleBirthdayConfirmation] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short9'));
  }
}

// ============================================================================
// Birthday Retry
// ============================================================================

export async function handleBirthdayRetry(callbackQuery: CallbackQuery, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    // Delete confirmation message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Ask for birthday again
    await telegram.sendMessage(
      chatId,
      i18n.t('common.birthday2') +
        '\n\n' +
        i18n.t('common.text10') +
        '\n\n' +
        i18n.t('warnings.birthday') +
        '\n' +
        i18n.t('common.settings6') +
        '\n' +
        i18n.t('common.text9')
    );

    await telegram.answerCallbackQuery(callbackQuery.id);
  } catch (error) {
    console.error('[handleBirthdayRetry] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short9'));
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
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      const errorI18n = createI18n('zh-TW');
      await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.userNotFound4'));
      return;
    }

    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id);

    // Delete choice message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Show 16 MBTI type buttons
    await telegram.sendMessageWithButtons(
      chatId,
      i18n.t('common.mbti8') +
        '\n\n' +
        i18n.t('common.settings4'),
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
        [{ text: i18n.t('buttons.back'), callback_data: 'mbti_choice_back' }],
      ]
    );
  } catch (error) {
    console.error('[handleMBTIChoiceManual] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short9'));
  }
}

/**
 * Handle MBTI choice: take test
 */
export async function handleMBTIChoiceTest(callbackQuery: CallbackQuery, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      const errorI18n = createI18n('zh-TW');
      await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.userNotFound4'));
      return;
    }

    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Start MBTI test
    const { startMBTITest } = await import('~/services/mbti_test_service');
    await startMBTITest(db, telegramId);

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('success.start4'));

    // Delete choice message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Show first question
    const { showMBTIQuestion } = await import('../handlers/mbti_test');
    await showMBTIQuestion(chatId, telegram, db, telegramId, 0);
  } catch (error) {
    console.error('[handleMBTIChoiceTest] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short9'));
  }
}

/**
 * Handle MBTI choice: skip
 */
export async function handleMBTIChoiceSkip(callbackQuery: CallbackQuery, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      const errorI18n = createI18n('zh-TW');
      await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.userNotFound4'));
      return;
    }

    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Move to next step (anti_fraud) without setting MBTI
    await updateOnboardingStep(db, telegramId, 'anti_fraud');

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('success.short18'));

    // Delete choice message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Show anti-fraud test
    await telegram.sendMessageWithButtons(
      chatId,
      i18n.t('common.settings3') +
        '\n\n' +
        i18n.t('common.settings') +
        '\n\n' +
        i18n.t('common.confirm2') +
        '\n\n' +
        i18n.t('common.confirm') +
        '\n\n' +
        i18n.t('common.text49') +
        '\n' +
        i18n.t('common.text50') +
        '\n' +
        i18n.t('common.message66') +
        '\n\n' +
        i18n.t('common.confirm7'),
      [
        [{ text: i18n.t('success.text10'), callback_data: 'anti_fraud_yes' }],
        [{ text: i18n.t('common.text108'), callback_data: 'anti_fraud_learn' }],
      ]
    );
  } catch (error) {
    console.error('[handleMBTIChoiceSkip] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short9'));
  }
}

/**
 * Handle MBTI choice: back button (from manual selection)
 */
export async function handleMBTIChoiceBack(callbackQuery: CallbackQuery, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      const errorI18n = createI18n('zh-TW');
      await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.userNotFound4'));
      return;
    }

    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id);

    // Delete manual selection message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Show MBTI options again (3 choices)
    await telegram.sendMessageWithButtons(
      chatId,
      i18n.t('common.settings2') +
        '\n\n' +
        i18n.t('common.help') +
        '\n\n' +
        i18n.t('common.settings7'),
      [
        [{ text: i18n.t('common.mbti2'), callback_data: 'mbti_choice_manual' }],
        [{ text: i18n.t('common.text5'), callback_data: 'mbti_choice_test' }],
        [{ text: i18n.t('common.short'), callback_data: 'mbti_choice_skip' }],
      ]
    );
  } catch (error) {
    console.error('[handleMBTIChoiceBack] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short9'));
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
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      const errorI18n = createI18n('zh-TW');
      await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.userNotFound4'));
      return;
    }

    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Validate MBTI type
    const { validateMBTI } = await import('~/domain/user');
    const validation = validateMBTI(mbtiType);
    if (!validation.valid) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.error.mbti'));
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
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('success.settings', { mbtiType }));

    // Delete selection message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Get MBTI description from i18n
    const descriptionKey = `mbti.description.${mbtiType}`;
    const description = i18n.t(descriptionKey as any);

    // Show result and continue to anti-fraud
    await telegram.sendMessage(
      chatId,
      i18n.t('success.mbti', { mbtiType }) +
        '\n\n' +
        `${description}\n\n` +
        i18n.t('common.text2')
    );

    // Show anti-fraud test
    await telegram.sendMessageWithButtons(
      chatId,
      i18n.t('common.confirm3') +
        '\n\n' +
        i18n.t('common.confirm') +
        '\n\n' +
        i18n.t('common.text49') +
        '\n' +
        i18n.t('common.text50') +
        '\n' +
        i18n.t('common.message66') +
        '\n\n' +
        i18n.t('common.confirm7'),
      [
        [{ text: i18n.t('success.text10'), callback_data: 'anti_fraud_yes' }],
        [{ text: i18n.t('common.text108'), callback_data: 'anti_fraud_learn' }],
      ]
    );
  } catch (error) {
    console.error('[handleMBTIManualSelection] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short9'));
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
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      const errorI18n = createI18n('zh-TW');
      await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.userNotFound4'));
      return;
    }

    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Check if user is in MBTI step
    if (user.onboarding_step !== 'mbti') {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('warnings.mbti'));
      return;
    }

    // Save MBTI result
    const { updateMBTIResult } = await import('~/db/queries/users');
    await updateMBTIResult(db, telegramId, mbtiType);

    // Move to next step
    await updateOnboardingStep(db, telegramId, 'anti_fraud');

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('success.settings', { mbtiType }));

    // Delete MBTI selection message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Show anti-fraud test with buttons
    await telegram.sendMessageWithButtons(
      chatId,
      i18n.t('success.mbti', { mbtiType }) +
        '\n\n' +
        i18n.t('common.confirm3') +
        '\n\n' +
        i18n.t('common.confirm') +
        '\n\n' +
        i18n.t('common.text49') +
        '\n' +
        i18n.t('common.text50') +
        '\n' +
        i18n.t('common.message66') +
        '\n\n' +
        i18n.t('common.confirm7'),
      [
        [{ text: i18n.t('success.text10'), callback_data: 'anti_fraud_yes' }],
        [{ text: i18n.t('common.text108'), callback_data: 'anti_fraud_learn' }],
      ]
    );
  } catch (error) {
    console.error('[handleMBTISelection] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short9'));
  }
}

// ============================================================================
// Anti-Fraud Confirmation
// ============================================================================

export async function handleAntiFraudConfirmation(
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
      const errorI18n = createI18n('zh-TW');
      await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.userNotFound4'));
      return;
    }

    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Check if user is in anti_fraud step
    if (user.onboarding_step !== 'anti_fraud') {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('warnings.text5'));
      return;
    }

    // Save anti-fraud score
    const { updateAntiFraudScore } = await import('~/db/queries/users');
    await updateAntiFraudScore(db, telegramId, 80);

    // Move to next step
    await updateOnboardingStep(db, telegramId, 'terms');

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('success.confirm2'));

    // Delete anti-fraud message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Show terms agreement
    await telegram.sendMessageWithButtons(
      chatId,
      i18n.t('success.text29') +
        '\n\n' +
        i18n.t('common.text12') +
        '\n\n' +
        i18n.t('common.start') +
        '\n\n' +
        i18n.t('common.profile') +
        '\n' +
        i18n.t('common.text6') +
        '\n\n' +
        '📋 Legal documents are provided in English only.\n\n' +
        i18n.t('common.text7'),
      [
        [{ text: i18n.t('success.short17'), callback_data: 'agree_terms' }],
        [{ text: '📋 View Privacy Policy', url: LEGAL_URLS.PRIVACY_POLICY }],
        [{ text: '📋 View Terms of Service', url: LEGAL_URLS.TERMS_OF_SERVICE }],
      ]
    );
  } catch (error) {
    console.error('[handleAntiFraudConfirmation] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short9'));
  }
}

// ============================================================================
// Anti-Fraud Learn More
// ============================================================================

export async function handleAntiFraudLearnMore(
  callbackQuery: CallbackQuery,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    // Show safety tips
    await telegram.editMessageText(
      chatId,
      callbackQuery.message!.message_id,
      i18n.t('common.text11') +
        '\n\n' +
        i18n.t('common.text14') +
        '\n' +
        i18n.t('common.text8') +
        '\n' +
        i18n.t('common.text15') +
        '\n\n' +
        i18n.t('common.message') +
        '\n' +
        i18n.t('common.message2') +
        '\n' +
        i18n.t('common.text16') +
        '\n\n' +
        i18n.t('common.text18') +
        '\n' +
        i18n.t('common.text13') +
        '\n' +
        i18n.t('common.text17') +
        '\n\n' +
        i18n.t('common.confirm3'),
      {
        reply_markup: {
          inline_keyboard: [[{ text: i18n.t('success.register2'), callback_data: 'anti_fraud_yes' }]],
        },
      }
    );

    await telegram.answerCallbackQuery(callbackQuery.id);
  } catch (error) {
    console.error('[handleAntiFraudLearnMore] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short9'));
  }
}

// ============================================================================
// Terms Agreement
// ============================================================================

export async function handleTermsAgreement(callbackQuery: CallbackQuery, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      const errorI18n = createI18n('zh-TW');
      await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.userNotFound4'));
      return;
    }

    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Check if user is in terms step
    if (user.onboarding_step !== 'terms') {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('warnings.text6'));
      return;
    }

    // Mark onboarding as completed
    await updateOnboardingStep(db, telegramId, 'completed');

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('success.register3'));

    // Delete terms message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Get updated user profile
    const updatedUser = await findUserByTelegramId(db, telegramId);
    if (!updatedUser) {
      await telegram.sendMessage(chatId, i18n.t('errors.error.short9'));
      return;
    }

    const updatedI18n = createI18n(updatedUser.language_pref || 'zh-TW');

    // Check if tutorial should auto-trigger
    const { shouldAutoTriggerTutorial } = await import('~/domain/tutorial');
    if (shouldAutoTriggerTutorial(true, updatedUser.tutorial_completed === 1)) {
      // Auto-trigger tutorial
      const { startTutorial } = await import('./tutorial');
      await startTutorial(
        { chat: { id: chatId }, from: { id: parseInt(telegramId) } } as TelegramMessage,
        env
      );
    } else {
      // Show completion message
      await telegram.sendMessageWithButtons(
        chatId,
        updatedI18n.t('common.settings5') +
          '\n\n' +
          updatedI18n.t('common.profile2') +
          '\n' +
          updatedI18n.t('common.nickname3', { updatedUser: { nickname: updatedUser.nickname } }) +
          '\n' +
          updatedI18n.t('common.gender', { updatedUser: { gender: updatedUser.gender } }) +
          '\n' +
          updatedI18n.t('onboarding.age', { updatedUser: { age: updatedUser.age } }) +
          '\n' +
          updatedI18n.t('onboarding.zodiac', { updatedUser: { zodiac_sign: updatedUser.zodiac_sign } }) +
          '\n' +
          updatedI18n.t('common.mbti3', { user: { mbti_result: updatedUser.mbti_result } }) +
          '\n\n' +
          updatedI18n.t('common.start2'),
        [
          [
            { text: updatedI18n.t('buttons.bottle3'), callback_data: 'throw' },
            { text: updatedI18n.t('buttons.bottle4'), callback_data: 'catch' },
          ],
          [
            { text: updatedI18n.t('buttons.profile2'), callback_data: 'profile' },
            { text: updatedI18n.t('buttons.stats'), callback_data: 'stats' },
          ],
        ]
      );
    }
  } catch (error) {
    console.error('[handleTermsAgreement] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short9'));
  }
}
