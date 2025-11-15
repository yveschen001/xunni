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
export async function showLanguageSelection(
  message: TelegramMessage,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;

  // Show welcome message with popular languages
  await telegram.sendMessageWithButtons(
    chatId,
    `🎉 歡迎來到 XunNi！\n` +
      `Welcome to XunNi!\n\n` +
      `XunNi 是一個匿名漂流瓶交友平台，透過 MBTI 和星座幫你找到志同道合的朋友！\n` +
      `XunNi is an anonymous bottle messaging platform that helps you find like-minded friends through MBTI and zodiac signs!\n\n` +
      `首先，請選擇你的語言：\n` +
      `First, please select your language:`,
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

  // Edit message to show all languages
  await telegram.editMessageText(
    chatId,
    messageId,
    `🌍 選擇你的語言 / Select your language:`,
    {
      reply_markup: {
        inline_keyboard: [
          ...getLanguageButtons(),
          [{ text: '⬅️ 返回 / Back', callback_data: 'lang_back' }],
        ],
      },
    }
  );

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
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Validate language code
    if (!isValidLanguage(languageCode)) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 無效的語言代碼');
      return;
    }

    // Update user language preference
    await updateUserProfile(db, telegramId, {
      language_pref: languageCode,
    });

    // Answer callback query
    await telegram.answerCallbackQuery(
      callbackQuery.id,
      `✅ 語言已設定為 ${getLanguageDisplay(languageCode)}`
    );

    // Delete language selection message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Check if user exists and has completed onboarding
    const user = await findUserByTelegramId(db, telegramId);

    if (!user) {
      // This shouldn't happen, but handle it gracefully
      await telegram.sendMessage(
        chatId,
        `❌ 發生錯誤，請重新開始：/start`
      );
      return;
    }

    // Check onboarding status
    if (user.onboarding_step === 'language_selection') {
      // New user - start onboarding
      await startOnboarding(chatId, telegram, languageCode);
    } else {
      // Existing user - just confirm language change
      await telegram.sendMessage(
        chatId,
        `✅ 語言已更新為 ${getLanguageDisplay(languageCode)}\n\n` +
          `Language updated to ${getLanguageDisplay(languageCode)}`
      );
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
  languageCode: string
): Promise<void> {
  // Get localized messages (for now, use Chinese as default)
  // TODO: Implement full i18n system
  const messages = getOnboardingMessages(languageCode);

  await telegram.sendMessage(
    chatId,
    messages.welcome
  );

  // Ask for nickname
  await telegram.sendMessage(
    chatId,
    messages.askNickname
  );
}

/**
 * Get onboarding messages by language
 * TODO: Move to proper i18n system
 */
function getOnboardingMessages(languageCode: string): {
  welcome: string;
  askNickname: string;
} {
  // For now, support Chinese and English
  if (languageCode === 'en') {
    return {
      welcome:
        `Great! Let's set up your profile ✨\n\n` +
        `This will only take 3-5 minutes.\n` +
        `You can pause anytime and continue later.`,
      askNickname:
        `First, what would you like to be called?\n\n` +
        `Please enter your nickname (display name):`,
    };
  }

  // Default to Chinese
  return {
    welcome:
      `太好了！現在讓我們開始設定你的個人資料 ✨\n\n` +
      `這只需要 3-5 分鐘。\n` +
      `你可以隨時暫停，稍後繼續。`,
    askNickname:
      `首先，你希望別人怎麼稱呼你？\n\n` +
      `請輸入你的暱稱（顯示名稱）：`,
  };
}

