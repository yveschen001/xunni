/**
 * Onboarding Input Handler
 * Based on @doc/ONBOARDING_FLOW.md
 *
 * Handles user input during onboarding process.
 */

import type { Env, TelegramMessage, User } from '~/types';
import { createDatabaseClient } from '~/db/client';
import {
  findUserByTelegramId,
  updateUserProfile,
  updateOnboardingStep,
  updateAntiFraudScore,
} from '~/db/queries/users';
import {
  validateNickname,
  validateBirthday,
  calculateAge,
  calculateZodiacSign,
} from '~/domain/user';
import { createTelegramService } from '~/services/telegram';
import { LEGAL_URLS } from '~/config/legal_urls';
import { createI18n } from '~/i18n';

// ============================================================================
// Onboarding Input Handler
// ============================================================================

export async function handleOnboardingInput(message: TelegramMessage, env: Env): Promise<boolean> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();
  const text = message.text || '';

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      return false; // Not in onboarding
    }

    // Check if user is in onboarding
    if (user.onboarding_step === 'completed') {
      return false; // Already completed onboarding
    }

    const step = user.onboarding_step;

    // Handle input based on current step
    switch (step) {
      case 'nickname':
        return await handleNicknameInput(user, text, chatId, telegram, db);
      
      case 'city_search':
        const { handleCitySearchInput } = await import('./onboarding_geo');
        await handleCitySearchInput(message, env);
        return true;

      case 'birthday':
        return await handleBirthdayInput(user, text, chatId, telegram, db);

      case 'mbti':
        // MBTI is now handled via buttons only, no text input
        // If user somehow sends text, ignore it
        return false;

      case 'anti_fraud':
        return await handleAntiFraudInput(user, text, chatId, telegram, db, env);

      default:
        return false; // Not expecting text input
    }
  } catch (error) {
    console.error('[handleOnboardingInput] Error:', error);
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.sendMessage(chatId, i18n.t('onboarding.errorRetry'));
    return true;
  }
}

// ============================================================================
// Nickname Input
// ============================================================================

async function handleNicknameInput(
  user: User,
  nickname: string,
  chatId: number,
  telegram: ReturnType<typeof createTelegramService>,
  db: ReturnType<typeof createDatabaseClient>
): Promise<boolean> {
  // Validate nickname
  const validation = validateNickname(nickname);
  if (!validation.valid) {
    const i18n = createI18n(user.language_pref || 'zh-TW');
    await telegram.sendMessage(
      chatId,
      i18n.t('onboarding.nicknameError', { error: validation.error })
    );
    return true;
  }

  // Save nickname
  await updateUserProfile(db, user.telegram_id, { nickname });

  // Move to next step
  await updateOnboardingStep(db, user.telegram_id, 'gender');

  // Show gender selection
  const i18n = createI18n(user.language_pref || 'zh-TW');
  await telegram.sendMessageWithButtons(
    chatId,
    i18n.t('onboarding.nicknameGood', { nickname }) +
      i18n.t('onboarding.nowSelectGender') +
      i18n.t('onboarding.genderWarning'),
    [
      [
        { text: i18n.t('onboarding.genderMale'), callback_data: 'gender_male' },
        { text: i18n.t('onboarding.genderFemale'), callback_data: 'gender_female' },
      ],
    ]
  );

  return true;
}

// ============================================================================
// Birthday Input
// ============================================================================

async function handleBirthdayInput(
  user: User,
  birthday: string,
  chatId: number,
  telegram: ReturnType<typeof createTelegramService>,
  _db: ReturnType<typeof createDatabaseClient>
): Promise<boolean> {
  const i18n = createI18n(user.language_pref || 'zh-TW');

  // Validate birthday
  const validation = validateBirthday(birthday);
  if (!validation.valid) {
    await telegram.sendMessage(
      chatId,
      i18n.t('onboarding.birthdayError', { error: validation.error }) +
        i18n.t('onboarding.birthdayRetry')
    );
    return true;
  }

  // Calculate age and zodiac sign
  const age = calculateAge(birthday);
  const zodiacSign = calculateZodiacSign(birthday);

  if (age === null || zodiacSign === null) {
    await telegram.sendMessage(chatId, i18n.t('onboarding.birthdayFormatError'));
    return true;
  }

  // Check age restriction (must be 18 or older)
  if (age < 18) {
    await telegram.sendMessage(
      chatId,
      i18n.t('onboarding.ageRestriction') +
        i18n.t('onboarding.yourAge', { age }) +
        i18n.t('onboarding.pleaseComeBack') +
        i18n.t('onboarding.birthdayCheck')
    );
    return true;
  }

  // Confirm birthday (second confirmation)
  await telegram.sendMessageWithButtons(
    chatId,
    i18n.t('onboarding.confirmBirthday') +
      `\n生日：${birthday}\n` +
      i18n.t('onboarding.age', { updatedUser: { age } }) +
      i18n.t('onboarding.zodiac', { updatedUser: { zodiac_sign: i18n.t(`zodiac.${zodiacSign}` as any) } }) +
      '\n\n' +
      i18n.t('onboarding.birthdayWarning'),
    [
      [
        { text: i18n.t('success.confirm3'), callback_data: `confirm_birthday_${birthday}` },
        { text: i18n.t('onboarding.retry'), callback_data: 'retry_birthday' },
      ],
    ]
  );

  return true;
}

// ============================================================================
// MBTI Input (REMOVED - now handled via buttons only)
// ============================================================================
// MBTI is now handled entirely through button callbacks in onboarding_callback.ts
// Users select from 3 options: manual entry, take test, or skip
// No text input is accepted for MBTI during onboarding

// ============================================================================
// Anti-Fraud Input
// ============================================================================

async function handleAntiFraudInput(
  user: User,
  answer: string,
  chatId: number,
  telegram: ReturnType<typeof createTelegramService>,
  db: ReturnType<typeof createDatabaseClient>,
  env: Env
): Promise<boolean> {
  // Simple check (in production, this would be a proper quiz)
  if (answer.includes('是') || answer.toLowerCase().includes('yes')) {
    // Pass the test
    await updateAntiFraudScore(db, user.telegram_id, 80);

    // Move to next step
    await updateOnboardingStep(db, user.telegram_id, 'terms');

    // Show terms agreement
    const i18n = createI18n(user.language_pref || 'zh-TW');
    await telegram.sendMessageWithButtons(
      chatId,
      i18n.t('onboarding.start') +
        '\n\n' +
        i18n.t('onboarding.text21') +
        '\n' +
        i18n.t('onboarding.text19') +
        '\n\n' +
        i18n.t('onboarding.terms.english_only_note') +
        '\n\n' +
        i18n.t('onboarding.text7'),
      [
        [{ text: i18n.t('onboarding.terms.agree_button'), callback_data: 'agree_terms' }],
        [
          {
            text: i18n.t('onboarding.terms.privacy_policy_button'),
            url: LEGAL_URLS.getPRIVACY_POLICY(env),
          },
        ],
        [
          {
            text: i18n.t('onboarding.terms.terms_of_service_button'),
            url: LEGAL_URLS.getTERMS_OF_SERVICE(env),
          },
        ],
      ]
    );

    return true;
  }

  const i18n = createI18n(user.language_pref || 'zh-TW');
  await telegram.sendMessage(
    chatId,
    i18n.t('onboarding.pleaseAnswer') +
      i18n.t('onboarding.understandRisks') +
      i18n.t('onboarding.enterYes')
  );

  return true;
}
