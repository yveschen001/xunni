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
// import { handleMBTI } from './telegram/handlers/mbti';
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

    // Try to handle as conversation message (anonymous chat)
    if (user.onboarding_step === 'completed') {
      const isConversationMessage = await handleMessageForward(message, env);
      if (isConversationMessage) {
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

    if (text === '/profile') {
      const { handleProfile } = await import('./telegram/handlers/profile');
      await handleProfile(message, env);
      return;
    }

    if (text === '/profile_card') {
      const { handleProfileCard } = await import('./telegram/handlers/profile');
      await handleProfileCard(message, env);
      return;
    }

    if (text === '/help') {
      const { handleHelp } = await import('./telegram/handlers/help');
      await handleHelp(message, env);
      return;
    }

    if (text === '/rules') {
      const { handleRules } = await import('./telegram/handlers/help');
      await handleRules(message, env);
      return;
    }

    if (text === '/block') {
      const { handleBlock } = await import('./telegram/handlers/block');
      await handleBlock(message, env);
      return;
    }

    if (text === '/report') {
      const { handleReport } = await import('./telegram/handlers/report');
      await handleReport(message, env);
      return;
    }

    if (text === '/vip') {
      const { handleVip } = await import('./telegram/handlers/vip');
      await handleVip(message, env);
      return;
    }

    if (text === '/stats') {
      const { handleStats } = await import('./telegram/handlers/stats');
      await handleStats(message, env);
      return;
    }

    if (text === '/chats') {
      const { handleChats } = await import('./telegram/handlers/chats');
      await handleChats(message, env);
      return;
    }

    // Development commands (⚠️ REMOVE IN PRODUCTION!)
    if (text === '/dev_reset') {
      const { handleDevReset } = await import('./telegram/handlers/dev');
      await handleDevReset(message, env);
      return;
    }

    if (text === '/dev_info') {
      const { handleDevInfo } = await import('./telegram/handlers/dev');
      await handleDevInfo(message, env);
      return;
    }

    if (text === '/dev_skip') {
      const { handleDevSkip } = await import('./telegram/handlers/dev');
      await handleDevSkip(message, env);
      return;
    }

    // Handle conversation messages (only for completed onboarding)
    if (user.onboarding_step === 'completed') {
      await handleMessageForward(message, env);
      return;
    }

    // User is in onboarding but sent unrecognized text
    // Provide friendly guidance instead of "unknown command"
    const stepMessages: Record<string, string> = {
      language_selection: '🌍 請點擊上方按鈕選擇你的語言',
      nickname: '✏️ 請輸入你的暱稱',
      gender: '👤 請點擊上方按鈕選擇你的性別',
      birthday: '📅 請輸入你的生日（格式：YYYY-MM-DD，例如：1995-06-15）',
      mbti: '🧠 請點擊上方按鈕選擇 MBTI 設定方式',
      anti_fraud: '🛡️ 請點擊上方按鈕確認反詐騙安全事項',
      terms: '📜 請點擊上方按鈕同意服務條款',
    };

    const stepMessage = stepMessages[user.onboarding_step] || '請按照提示完成註冊';
    await telegram.sendMessage(chatId, `💡 ${stepMessage}`);
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

    // MBTI choice handlers
    if (data === 'mbti_choice_manual') {
      const { handleMBTIChoiceManual } = await import('./telegram/handlers/onboarding_callback');
      await handleMBTIChoiceManual(callbackQuery, env);
      return;
    }

    if (data === 'mbti_choice_test') {
      const { handleMBTIChoiceTest } = await import('./telegram/handlers/onboarding_callback');
      await handleMBTIChoiceTest(callbackQuery, env);
      return;
    }

    if (data === 'mbti_choice_skip') {
      const { handleMBTIChoiceSkip } = await import('./telegram/handlers/onboarding_callback');
      await handleMBTIChoiceSkip(callbackQuery, env);
      return;
    }

    if (data === 'mbti_choice_back') {
      const { handleMBTIChoiceBack } = await import('./telegram/handlers/onboarding_callback');
      await handleMBTIChoiceBack(callbackQuery, env);
      return;
    }

    // MBTI manual selection
    if (data.startsWith('mbti_manual_')) {
      const { handleMBTIManualSelection } = await import('./telegram/handlers/onboarding_callback');
      const mbtiType = data.replace('mbti_manual_', '');
      await handleMBTIManualSelection(callbackQuery, mbtiType, env);
      return;
    }

    // Throw bottle target gender selection
    if (data.startsWith('throw_target_')) {
      const { handleThrowTargetGender } = await import('./telegram/handlers/throw');
      const gender = data.replace('throw_target_', '') as 'male' | 'female' | 'any';
      await handleThrowTargetGender(callbackQuery, gender, env);
      return;
    }

    // MBTI test answer
    if (data.startsWith('mbti_answer_')) {
      const { handleMBTIAnswer } = await import('./telegram/handlers/mbti_test');
      const parts = data.replace('mbti_answer_', '').split('_');
      const questionIndex = parseInt(parts[0], 10);
      const answerIndex = parseInt(parts[1], 10);
      await handleMBTIAnswer(callbackQuery, questionIndex, answerIndex, env);
      return;
    }

    // MBTI menu handlers
    if (data === 'mbti_menu_test') {
      const { handleMBTIMenuTest } = await import('./telegram/handlers/mbti');
      await handleMBTIMenuTest(callbackQuery, env);
      return;
    }

    if (data === 'mbti_menu_manual') {
      const { handleMBTIMenuManual } = await import('./telegram/handlers/mbti');
      await handleMBTIMenuManual(callbackQuery, env);
      return;
    }

    if (data === 'mbti_menu_clear') {
      const { handleMBTIMenuClear } = await import('./telegram/handlers/mbti');
      await handleMBTIMenuClear(callbackQuery, env);
      return;
    }

    if (data === 'mbti_menu_cancel') {
      const { handleMBTIMenuCancel } = await import('./telegram/handlers/mbti');
      await handleMBTIMenuCancel(callbackQuery, env);
      return;
    }

    // MBTI set (from /mbti menu)
    if (data.startsWith('mbti_set_')) {
      const { handleMBTISet } = await import('./telegram/handlers/mbti');
      const mbtiType = data.replace('mbti_set_', '');
      await handleMBTISet(callbackQuery, mbtiType, env);
      return;
    }

    // Legacy MBTI selection (kept for backward compatibility)
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

