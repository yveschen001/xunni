/**
 * Language Selection Handler
 * Based on @doc/ONBOARDING_REDESIGN.md
 *
 * Handles language selection for new and existing users.
 */

import type { Env, TelegramMessage, CallbackQuery } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { findUserByTelegramId, updateUserProfile } from '~/db/queries/users';
import { createTelegramService } from '~/services/telegram';
import {
  getPopularLanguageButtons,
  getLanguageButtons,
  isValidLanguage,
  getLanguageDisplay,
} from '~/i18n/languages';

// ============================================================================
// Language Selection Handler
// ============================================================================

/**
 * Show language selection for first-time users
 */
export async function showLanguageSelection(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;

  // Use i18n for welcome message (default to user's client language or English)
  const { createI18n } = await import('~/i18n');
  const languageCode = message.from?.language_code || 'en';
  const i18n = createI18n(languageCode);

  // Show welcome message with popular languages
  await telegram.sendMessageWithButtons(
    chatId,
    i18n.t('onboarding.welcome'),
    getPopularLanguageButtons(i18n, languageCode)
  );
}

/**
 * Show all available languages
 */
export async function showAllLanguages(callbackQuery: CallbackQuery, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const messageId = callbackQuery.message!.message_id;

  // Use i18n
  const { createI18n } = await import('~/i18n');
  const languageCode = callbackQuery.from.language_code || 'en';
  const i18n = createI18n(languageCode);

  // Edit message to show all languages (page 0)
  // Smart Sort: Pass user's current language for sorting
  await telegram.editMessageText(chatId, messageId, i18n.t('onboarding.languageSelection'), {
    reply_markup: {
      inline_keyboard: [
        ...getLanguageButtons(i18n, 0, languageCode),
        [{ text: i18n.t('common.back'), callback_data: 'lang_back' }],
      ],
    },
  });

  await telegram.answerCallbackQuery(callbackQuery.id);
}

/**
 * Handle language selection callback
 */
export async function handleLanguageSelection(
  callbackQuery: CallbackQuery,
  languageCode: string,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  // Get user's current language for error messages
  const { createI18n } = await import('~/i18n');
  const user = await findUserByTelegramId(db, telegramId);
  const currentI18n = createI18n(user?.language_pref || 'en');

  try {
    // Validate language code
    if (!isValidLanguage(languageCode)) {
      await telegram.answerCallbackQuery(
        callbackQuery.id,
        currentI18n.t('errors.invalidLanguageCode')
      );
      return;
    }

    // Check if user exists first
    if (!user) {
      // This shouldn't happen, but handle it gracefully
      await telegram.answerCallbackQuery(callbackQuery.id, currentI18n.t('errors.systemError'));
      await telegram.sendMessage(chatId, currentI18n.t('errors.systemErrorRestart'));
      return;
    }

    // Check if this is a new user (still in language_selection step)
    const isNewUser = user.onboarding_step === 'language_selection';

    // Update user language preference
    await updateUserProfile(db, telegramId, {
      language_pref: languageCode,
    });

    // Update onboarding step to nickname for new users (Step 2: Nickname)
    if (isNewUser) {
      const { updateOnboardingStep } = await import('~/db/queries/users');
      await updateOnboardingStep(db, telegramId, 'nickname');
    }

    // 🔥 Critical: Load translations for the selected language immediately
    const { loadTranslations } = await import('~/i18n');
    await loadTranslations(env, languageCode);

    // Answer callback query (use newly selected language)
    const newI18n = createI18n(languageCode);
    await telegram.answerCallbackQuery(
      callbackQuery.id,
      `${newI18n.t('common.success')} ${getLanguageDisplay(languageCode)}`
    );

    // Delete language selection message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    if (isNewUser) {
      // New user - Ask Nickname
      const suggestedNickname = user.username || user.first_name || '';
      
      if (suggestedNickname) {
        const nicknameMessage =
          newI18n.t('common.nickname7') +
          newI18n.t('warning.short4') +
          newI18n.t('common.nickname5') +
          newI18n.t('common.text79') +
          newI18n.t('common.nickname11');

        await telegram.sendMessageWithButtons(chatId, nicknameMessage, [
          [
            {
              text: newI18n.t('onboarding.useTelegramNickname', {
                nickname: suggestedNickname.substring(0, 18),
              }),
              callback_data: `nickname_use_telegram`,
            },
          ],
          [{ text: newI18n.t('onboarding.customNickname'), callback_data: 'nickname_custom' }],
        ]);
      } else {
        // No Telegram nickname, ask for custom nickname
        const nicknameMessage =
          newI18n.t('common.nickname8') +
          newI18n.t('warning.short4') +
          newI18n.t('common.nickname5') +
          newI18n.t('common.text79') +
          newI18n.t('common.nickname11');

        await telegram.sendMessage(chatId, nicknameMessage);
      }
    } else {
      // Existing user - just confirm language change
      // Use the newly selected language for confirmation message
      const confirmI18n = createI18n(languageCode);
      const confirmMessage = confirmI18n.t('settings.languageUpdated', {
        language: getLanguageDisplay(languageCode),
      });
      const sentMessage = await telegram.sendMessage(chatId, confirmMessage);

      // Wait 2 seconds, then automatically return to menu
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Delete confirmation message and show menu
      try {
        await telegram.deleteMessage(chatId, sentMessage.message_id);
      } catch (error) {
        // Ignore if message already deleted
        console.error('[handleLanguageSelection] Failed to delete confirmation message:', error);
      }

      // Return to main menu
      const { handleMenu } = await import('./menu');
      const fakeMessage = {
        ...callbackQuery.message!,
        from: callbackQuery.from,
        text: '/menu',
      };
      await handleMenu(fakeMessage as any, env);
    }
  } catch (error) {
    console.error('[handleLanguageSelection] Error:', error);
    const errorI18n = createI18n(user?.language_pref || 'en');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.systemErrorRetry'));
  }
}

/*
 * Start onboarding after language selection
 * @deprecated - Replaced by Geo Flow in onboarding_geo.ts
 */
/*
async function startOnboarding(
  chatId: number,
  telegram: ReturnType<typeof createTelegramService>,
  languageCode: string,
  telegramUsername?: string,
  telegramFirstName?: string
): Promise<void> {
  // Use i18n system
  const { createI18n } = await import('~/i18n');
  const i18n = createI18n(languageCode);

  await telegram.sendMessage(chatId, i18n.t('onboarding.startRegistration'));

  // Offer nickname options
  const suggestedNickname = telegramUsername || telegramFirstName || '';

  if (suggestedNickname) {
    const nicknameMessage =
      i18n.t('common.nickname7') +
      i18n.t('warnings.warning.short4') +
      i18n.t('common.nickname5') +
      i18n.t('common.text79') +
      i18n.t('common.nickname11');

    await telegram.sendMessageWithButtons(chatId, nicknameMessage, [
      [
        {
          text: i18n.t('onboarding.useTelegramNickname', {
            nickname: suggestedNickname.substring(0, 18),
          }),
          callback_data: `nickname_use_telegram`,
        },
      ],
      [{ text: i18n.t('onboarding.customNickname'), callback_data: 'nickname_custom' }],
    ]);
  } else {
    // No Telegram nickname, ask for custom nickname
    const nicknameMessage =
      i18n.t('common.nickname8') +
      i18n.t('warnings.warning.short4') +
      i18n.t('common.nickname5') +
      i18n.t('common.text79') +
      i18n.t('common.nickname11');

    await telegram.sendMessage(chatId, nicknameMessage);
  }
}
*/
