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

  // Use i18n for welcome message (bilingual zh-TW + en)
  const { createI18n } = await import('~/i18n');
  const i18n = createI18n('zh-TW'); // Default to zh-TW for welcome

  // Show welcome message with popular languages
  await telegram.sendMessageWithButtons(
    chatId,
    i18n.t('onboarding.welcome'),
    getPopularLanguageButtons()
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
  const i18n = createI18n('zh-TW');

  // Edit message to show all languages
  await telegram.editMessageText(chatId, messageId, i18n.t('onboarding.languageSelection'), {
    reply_markup: {
      inline_keyboard: [
        ...getLanguageButtons(),
        [{ text: '⬅️ 返回 / Back', callback_data: 'lang_back' }],
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

  try {
    // Validate language code
    if (!isValidLanguage(languageCode)) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 無效的語言代碼');
      return;
    }

    // Check if user exists first
    const user = await findUserByTelegramId(db, telegramId);

    if (!user) {
      // This shouldn't happen, but handle it gracefully
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
      await telegram.sendMessage(chatId, `❌ 發生錯誤，請重新開始：/start`);
      return;
    }

    // Check if this is a new user (still in language_selection step)
    const isNewUser = user.onboarding_step === 'language_selection';

    // Update user language preference
    await updateUserProfile(db, telegramId, {
      language_pref: languageCode,
    });

    // Update onboarding step to nickname for new users
    if (isNewUser) {
      const { updateOnboardingStep } = await import('~/db/queries/users');
      await updateOnboardingStep(db, telegramId, 'nickname');
    }

    // Answer callback query
    await telegram.answerCallbackQuery(callbackQuery.id, `✅ ${getLanguageDisplay(languageCode)}`);

    // Delete language selection message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    if (isNewUser) {
      // New user - start onboarding immediately
      await startOnboarding(
        chatId,
        telegram,
        languageCode,
        callbackQuery.from.username,
        callbackQuery.from.first_name
      );
    } else {
      // Existing user - just confirm language change
      await telegram.sendMessage(chatId, `✅ 語言已更新為：${getLanguageDisplay(languageCode)}`);
    }
  } catch (error) {
    console.error('[handleLanguageSelection] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤，請稍後再試');
  }
}

/**
 * Start onboarding after language selection
 */
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
    await telegram.sendMessageWithButtons(
      chatId,
      `✏️ 請選擇你的暱稱：\n\n` +
        `⚠️ 注意：\n` +
        `• 暱稱長度限制 36 個字\n` +
        `• 對方最多顯示 18 個字\n` +
        `• 請勿使用暱稱發送廣告`,
      [
        [
          {
            text: `✅ 使用 Telegram 暱稱：${suggestedNickname.substring(0, 18)}`,
            callback_data: `nickname_use_telegram`,
          },
        ],
        [{ text: '✍️ 自訂暱稱', callback_data: 'nickname_custom' }],
      ]
    );
  } else {
    // No Telegram nickname, ask for custom nickname
    await telegram.sendMessage(
      chatId,
      `✏️ 請輸入你的暱稱：\n\n` +
        `⚠️ 注意：\n` +
        `• 暱稱長度限制 36 個字\n` +
        `• 對方最多顯示 18 個字\n` +
        `• 請勿使用暱稱發送廣告`
    );
  }
}
