/**
 * Request Router
 * Based on @doc/SPEC.md
 *
 * Routes incoming Telegram updates to appropriate handlers.
 */

import type { Env, TelegramUpdate } from '~/types';
import { handleStart } from './telegram/handlers/start';
import { handleThrow } from './telegram/handlers/throw';
import { handleCatch } from './telegram/handlers/catch';
import { handleMessageForward } from './telegram/handlers/message_forward';
import { handleOnboardingInput } from './telegram/handlers/onboarding_input';
import {
  showLanguageSelection,
  showAllLanguages,
  handleLanguageSelection,
} from './telegram/handlers/language_selection';
import { createTelegramService } from './services/telegram';
import { createDatabaseClient } from './db/client';
import { findUserByTelegramId, createUser } from './db/queries/users';
import { generateInviteCode } from './domain/user';

// ============================================================================
// Webhook Handler
// ============================================================================

export async function handleWebhook(request: Request, env: Env): Promise<Response> {
  try {
    // Verify webhook secret (if configured)
    if (env.TELEGRAM_WEBHOOK_SECRET) {
      const secretToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
      if (secretToken !== env.TELEGRAM_WEBHOOK_SECRET) {
        console.warn('[Router] Invalid webhook secret');
        return new Response('Unauthorized', { status: 401 });
      }
    }

    // Parse update
    const update: TelegramUpdate = await request.json();
    console.log('[Router] Received update:', update.update_id);

    // Route update to appropriate handler
    await routeUpdate(update, env);

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('[Router] Webhook error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// ============================================================================
// Update Router
// ============================================================================

async function routeUpdate(update: TelegramUpdate, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env);

  // Handle message
  if (update.message) {
    const message = update.message;
    const text = message.text || '';
    const chatId = message.chat.id;
    const telegramId = message.from!.id.toString();

    // Check if user exists
    const user = await findUserByTelegramId(db, telegramId);

    // New user - auto-trigger welcome flow (no /start required)
    if (!user) {
      // Create user record
      await createUser(db, {
        telegram_id: telegramId,
        username: message.from!.username,
        first_name: message.from!.first_name,
        last_name: message.from!.last_name,
        language_pref: message.from!.language_code || 'zh-TW',
        invite_code: generateInviteCode(),
        onboarding_step: 'language_selection',
      });

      // Show language selection
      await showLanguageSelection(message, env);
      return;
    }

    // Check if user is banned
    // TODO: Implement ban check

    // Check if user is in onboarding
    if (user.onboarding_step !== 'completed') {
      // Handle onboarding input first
      const isOnboardingInput = await handleOnboardingInput(message, env);
      if (isOnboardingInput) {
        return;
      }
    }

    // Route commands
    if (text.startsWith('/start')) {
      await handleStart(message, env);
      return;
    }

    if (text.startsWith('/throw')) {
      await handleThrow(message, env);
      return;
    }

    if (text.startsWith('/catch')) {
      await handleCatch(message, env);
      return;
    }

    if (text.startsWith('/profile')) {
      // TODO: Implement /profile handler
      await telegram.sendMessage(chatId, '👤 個人資料功能開發中...');
      return;
    }

    if (text.startsWith('/help')) {
      // TODO: Implement /help handler
      await telegram.sendMessage(
        chatId,
        `📖 XunNi 指令列表\n\n` +
          `🎮 核心功能\n` +
          `/start - 開始使用\n` +
          `/throw - 丟出漂流瓶\n` +
          `/catch - 撿起漂流瓶\n` +
          `/profile - 個人資料\n` +
          `/stats - 統計資料\n` +
          `/vip - VIP 訂閱\n\n` +
          `🛡️ 安全功能\n` +
          `/block - 封鎖使用者\n` +
          `/report - 舉報不當內容\n` +
          `/appeal - 申訴封禁\n\n` +
          `📖 幫助\n` +
          `/rules - 查看規則\n` +
          `/help - 顯示此列表`
      );
      return;
    }

    // Handle conversation messages (only for completed onboarding)
    if (user.onboarding_step === 'completed') {
      await handleMessageForward(message, env);
      return;
    }

    // Unknown command
    await telegram.sendMessage(
      chatId,
      `❓ 不認識的指令。\n\n` + `使用 /help 查看可用指令列表。`
    );
    return;
  }

  // Handle callback query
  if (update.callback_query) {
    const callbackQuery = update.callback_query;
    const data = callbackQuery.data || '';
    const chatId = callbackQuery.message?.chat.id;

    if (!chatId) {
      await telegram.answerCallbackQuery(callbackQuery.id, '錯誤：無法獲取聊天 ID');
      return;
    }

    // Route callback queries
    // Language selection
    if (data.startsWith('lang_')) {
      if (data === 'lang_more') {
        await showAllLanguages(callbackQuery, env);
        return;
      }
      if (data === 'lang_back') {
        // Show popular languages again
        const { getPopularLanguageButtons } = await import('~/i18n/languages');
        await telegram.editMessageText(
          chatId,
          callbackQuery.message!.message_id,
          `🎉 歡迎來到 XunNi！\n` +
            `Welcome to XunNi!\n\n` +
            `首先，請選擇你的語言：\n` +
            `First, please select your language:`,
          {
            reply_markup: {
              inline_keyboard: getPopularLanguageButtons(),
            },
          }
        );
        await telegram.answerCallbackQuery(callbackQuery.id);
        return;
      }
      const languageCode = data.replace('lang_', '');
      await handleLanguageSelection(callbackQuery, languageCode, env);
      return;
    }

    if (data.startsWith('gender_')) {
      const { handleGenderSelection, handleGenderConfirmation, handleGenderReselection } = await import('./telegram/handlers/onboarding_callback');
      
      if (data === 'gender_male' || data === 'gender_female') {
        const gender = data.replace('gender_', '') as 'male' | 'female';
        await handleGenderSelection(callbackQuery, gender, env);
        return;
      }
      
      if (data.startsWith('gender_confirm_')) {
        const gender = data.replace('gender_confirm_', '') as 'male' | 'female';
        await handleGenderConfirmation(callbackQuery, gender, env);
        return;
      }
      
      if (data === 'gender_reselect') {
        await handleGenderReselection(callbackQuery, env);
        return;
      }
      
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 未知的性別選項');
      return;
    }

    if (data.startsWith('confirm_birthday_')) {
      const { handleBirthdayConfirmation } = await import('./telegram/handlers/onboarding_callback');
      const birthday = data.replace('confirm_birthday_', '');
      await handleBirthdayConfirmation(callbackQuery, birthday, env);
      return;
    }

    if (data === 'retry_birthday') {
      const { handleBirthdayRetry } = await import('./telegram/handlers/onboarding_callback');
      await handleBirthdayRetry(callbackQuery, env);
      return;
    }

    if (data.startsWith('mbti_')) {
      const { handleMBTISelection } = await import('./telegram/handlers/onboarding_callback');
      const mbtiType = data.replace('mbti_', '');
      await handleMBTISelection(callbackQuery, mbtiType, env);
      return;
    }

    if (data === 'anti_fraud_yes') {
      const { handleAntiFraudConfirmation } = await import('./telegram/handlers/onboarding_callback');
      await handleAntiFraudConfirmation(callbackQuery, env);
      return;
    }

    if (data === 'anti_fraud_learn') {
      const { handleAntiFraudLearnMore } = await import('./telegram/handlers/onboarding_callback');
      await handleAntiFraudLearnMore(callbackQuery, env);
      return;
    }

    if (data === 'agree_terms') {
      const { handleTermsAgreement } = await import('./telegram/handlers/onboarding_callback');
      await handleTermsAgreement(callbackQuery, env);
      return;
    }

    if (data === 'throw') {
      await telegram.answerCallbackQuery(callbackQuery.id);
      await telegram.sendMessage(chatId, '🌊 丟瓶功能開發中...');
      return;
    }

    if (data === 'catch') {
      await telegram.answerCallbackQuery(callbackQuery.id);
      await telegram.sendMessage(chatId, '🎣 撿瓶功能開發中...');
      return;
    }

    // Unknown callback
    await telegram.answerCallbackQuery(callbackQuery.id, '未知的操作');
    return;
  }

  // Handle pre-checkout query (Telegram Stars payment)
  if (update.pre_checkout_query) {
    // TODO: Implement payment handler
    await telegram.answerPreCheckoutQuery(update.pre_checkout_query.id, true);
    return;
  }

  // Handle successful payment
  if (update.message && 'successful_payment' in update.message) {
    // TODO: Implement payment success handler
    // eslint-disable-next-line no-console, @typescript-eslint/no-explicit-any
    console.log('[Router] Payment received:', (update.message as any).successful_payment);
    return;
  }

  // eslint-disable-next-line no-console
  console.log('[Router] Unhandled update type');
}

