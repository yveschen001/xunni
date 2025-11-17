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
    console.error('[Router] Received update:', update.update_id);

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
      const isCommand = text.startsWith('/');

      // Try profile edit input first
      const { handleProfileEditInput } = await import('./telegram/handlers/edit_profile');
      const isEditingProfile = await handleProfileEditInput(message, env);
      if (isEditingProfile) {
        return;
      }

      // Try conversation message (priority over throw bottle)
      const { handleMessageForward } = await import('./telegram/handlers/message_forward');
      const isConversationMessage = await handleMessageForward(message, env);
      if (isConversationMessage) {
        return;
      }

      // Try throw bottle content input
      const { processBottleContent } = await import('./telegram/handlers/throw');
      const { getActiveSession, deleteSession } = await import('./db/queries/sessions');
      const throwSession = await getActiveSession(db, user.telegram_id, 'throw_bottle');

      console.error('[router] Checking throw session:', {
        userId: user.telegram_id,
        hasSession: !!throwSession,
        hasText: !!text,
        hasPhoto: !!message.photo,
        messageType: text ? 'text' : message.photo ? 'photo' : 'other',
      });

      if (throwSession) {
        // If user sends a command (starts with '/'), treat it as aborting the throw flow
        if (isCommand) {
          console.error('[router] Command received during throw flow, clearing session:', {
            userId: user.telegram_id,
            command: text,
          });
          await deleteSession(db, user.telegram_id, 'throw_bottle');
          // Do NOT return here – let command routing below handle it
        } else if (text) {
          // Text message - process as bottle content
          console.error('[router] Processing bottle content:', {
            userId: user.telegram_id,
            contentLength: text.length,
          });
          await processBottleContent(user, text, env);
          return;
        } else if (message.photo || message.video || message.document || message.sticker) {
          // Non-text message - reject
          console.error('[router] Rejecting non-text message during throw flow:', {
            userId: user.telegram_id,
            messageType: message.photo ? 'photo' : message.video ? 'video' : 'other',
          });
          await telegram.sendMessage(
            message.chat.id,
            '❌ 漂流瓶只允許文字內容\n\n' +
              '💡 請輸入文字訊息（最短 12 字符，最多 500 字符）\n\n' +
              '如果不想繼續，請輸入 /menu 返回主選單'
          );
          return;
        }
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

    if (text === '/mbti') {
      const { handleMBTI } = await import('./telegram/handlers/mbti');
      await handleMBTI(message, env);
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

    if (text === '/menu') {
      const { handleMenu } = await import('./telegram/handlers/menu');
      await handleMenu(message, env);
      return;
    }

    if (text === '/settings') {
      const { handleSettings } = await import('./telegram/handlers/settings');
      await handleSettings(message, env);
      return;
    }

    if (text === '/edit_profile') {
      const { handleEditProfile } = await import('./telegram/handlers/edit_profile');
      await handleEditProfile(message, env);
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

    if (text.startsWith('/history')) {
      const { handleHistory } = await import('./telegram/handlers/history');
      await handleHistory(message, env);
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

    if (text === '/dev_restart') {
      const { handleDevRestart } = await import('./telegram/handlers/dev');
      await handleDevRestart(message, env);
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
    // Nickname selection
    if (data === 'nickname_use_telegram') {
      const { handleNicknameUseTelegram } = await import('./telegram/handlers/nickname_callback');
      await handleNicknameUseTelegram(callbackQuery, env);
      return;
    }

    if (data === 'nickname_custom') {
      const { handleNicknameCustom } = await import('./telegram/handlers/nickname_callback');
      await handleNicknameCustom(callbackQuery, env);
      return;
    }

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

    // Blood type selection handlers
    if (data.startsWith('blood_type_')) {
      const { handleBloodTypeSelection } = await import('./telegram/handlers/onboarding_callback');
      const bloodTypeValue = data.replace('blood_type_', '');
      await handleBloodTypeSelection(callbackQuery, bloodTypeValue, env);
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

    // Throw bottle advanced filter
    if (data === 'throw_advanced') {
      const { handleThrowAdvanced } = await import('./telegram/handlers/throw_advanced');
      await handleThrowAdvanced(callbackQuery, env);
      return;
    }

    // Filter callbacks
    if (data === 'filter_mbti') {
      const { handleFilterMBTI } = await import('./telegram/handlers/throw_advanced');
      await handleFilterMBTI(callbackQuery, env);
      return;
    }

    if (data === 'filter_zodiac') {
      const { handleFilterZodiac } = await import('./telegram/handlers/throw_advanced');
      await handleFilterZodiac(callbackQuery, env);
      return;
    }

    if (data === 'filter_blood_type') {
      const { handleFilterBloodType } = await import('./telegram/handlers/throw_advanced');
      await handleFilterBloodType(callbackQuery, env);
      return;
    }

    if (data === 'filter_gender') {
      const { handleFilterGender } = await import('./telegram/handlers/throw_advanced');
      await handleFilterGender(callbackQuery, env);
      return;
    }

    if (data === 'filter_done') {
      const { handleFilterDone } = await import('./telegram/handlers/throw_advanced');
      await handleFilterDone(callbackQuery, env);
      return;
    }

    if (data === 'back_to_filter') {
      const { handleBackToFilter } = await import('./telegram/handlers/throw_advanced');
      await handleBackToFilter(callbackQuery, env);
      return;
    }

    // MBTI filter selection
    if (data.startsWith('select_mbti_')) {
      const { handleSelectMBTI } = await import('./telegram/handlers/throw_advanced');
      const mbtiType = data.replace('select_mbti_', '');
      await handleSelectMBTI(callbackQuery, mbtiType, env);
      return;
    }

    if (data === 'clear_mbti') {
      const { handleClearMBTI } = await import('./telegram/handlers/throw_advanced');
      await handleClearMBTI(callbackQuery, env);
      return;
    }

    // Zodiac filter selection
    if (data.startsWith('select_zodiac_')) {
      const { handleSelectZodiac } = await import('./telegram/handlers/throw_advanced');
      const zodiacSign = data.replace('select_zodiac_', '');
      await handleSelectZodiac(callbackQuery, zodiacSign, env);
      return;
    }

    if (data === 'clear_zodiac') {
      const { handleClearZodiac } = await import('./telegram/handlers/throw_advanced');
      await handleClearZodiac(callbackQuery, env);
      return;
    }

    // Blood type filter selection
    if (data.startsWith('blood_type_')) {
      const { handleBloodTypeSelect } = await import('./telegram/handlers/throw_advanced');
      const bloodType = data.replace('blood_type_', '');
      await handleBloodTypeSelect(callbackQuery, bloodType, env);
      return;
    }

    // Gender filter selection
    if (data.startsWith('set_gender_')) {
      const { handleSetGender } = await import('./telegram/handlers/throw_advanced');
      const gender = data.replace('set_gender_', '') as 'male' | 'female' | 'any';
      await handleSetGender(callbackQuery, gender, env);
      return;
    }

    // Conversation action callbacks
    if (data.startsWith('conv_profile_')) {
      const { handleConversationProfile } = await import('./telegram/handlers/conversation_actions');
      const conversationId = parseInt(data.replace('conv_profile_', ''), 10);
      await handleConversationProfile(callbackQuery, conversationId, env);
      return;
    }

    if (data.startsWith('conv_block_confirm_')) {
      const { handleConversationBlockConfirm } = await import('./telegram/handlers/conversation_actions');
      const conversationId = parseInt(data.replace('conv_block_confirm_', ''), 10);
      await handleConversationBlockConfirm(callbackQuery, conversationId, env);
      return;
    }

    if (data.startsWith('conv_block_')) {
      const { handleConversationBlock } = await import('./telegram/handlers/conversation_actions');
      const conversationId = parseInt(data.replace('conv_block_', ''), 10);
      await handleConversationBlock(callbackQuery, conversationId, env);
      return;
    }

    if (data.startsWith('conv_report_confirm_')) {
      const { handleConversationReportConfirm } = await import('./telegram/handlers/conversation_actions');
      const conversationId = parseInt(data.replace('conv_report_confirm_', ''), 10);
      await handleConversationReportConfirm(callbackQuery, conversationId, env);
      return;
    }

    if (data.startsWith('conv_report_')) {
      const { handleConversationReport } = await import('./telegram/handlers/conversation_actions');
      const conversationId = parseInt(data.replace('conv_report_', ''), 10);
      await handleConversationReport(callbackQuery, conversationId, env);
      return;
    }

    if (data === 'conv_cancel') {
      const { handleConversationCancel } = await import('./telegram/handlers/conversation_actions');
      await handleConversationCancel(callbackQuery, env);
      return;
    }

    // Edit profile callbacks
    if (data === 'edit_nickname') {
      const { handleEditNickname } = await import('./telegram/handlers/edit_profile');
      await handleEditNickname(callbackQuery, env);
      return;
    }

    if (data === 'edit_bio') {
      const { handleEditBio } = await import('./telegram/handlers/edit_profile');
      await handleEditBio(callbackQuery, env);
      return;
    }

    if (data === 'edit_region') {
      const { handleEditRegion } = await import('./telegram/handlers/edit_profile');
      await handleEditRegion(callbackQuery, env);
      return;
    }

    if (data === 'edit_interests') {
      const { handleEditInterests } = await import('./telegram/handlers/edit_profile');
      await handleEditInterests(callbackQuery, env);
      return;
    }

    if (data === 'edit_blood_type') {
      const { handleEditBloodType } = await import('./telegram/handlers/edit_profile');
      await handleEditBloodType(callbackQuery, env);
      return;
    }

    if (data.startsWith('edit_blood_type_')) {
      const { handleEditBloodTypeSelection } = await import('./telegram/handlers/edit_profile');
      const bloodTypeValue = data.replace('edit_blood_type_', '');
      await handleEditBloodTypeSelection(callbackQuery, bloodTypeValue, env);
      return;
    }

    if (data === 'edit_match_pref') {
      const { handleEditMatchPref } = await import('./telegram/handlers/edit_profile');
      await handleEditMatchPref(callbackQuery, env);
      return;
    }

    if (data.startsWith('match_pref_')) {
      const { handleMatchPrefSelection } = await import('./telegram/handlers/edit_profile');
      const preference = data.replace('match_pref_', '') as 'male' | 'female' | 'any';
      await handleMatchPrefSelection(callbackQuery, preference, env);
      return;
    }

    if (data === 'edit_profile_menu' || data === 'edit_profile_back') {
      const { handleEditProfileCallback } = await import('./telegram/handlers/edit_profile');
      await handleEditProfileCallback(callbackQuery, env);
      return;
    }

    if (data === 'retake_mbti') {
      const { handleMBTI } = await import('./telegram/handlers/mbti');
      await handleMBTI(callbackQuery.message as any, env);
      await telegram.answerCallbackQuery(callbackQuery.id, '開始 MBTI 測試');
      return;
    }

    // Draft callbacks
    if (data === 'draft_continue') {
      const { handleDraftContinue } = await import('./telegram/handlers/draft');
      await handleDraftContinue(callbackQuery, env);
      return;
    }

    if (data === 'draft_delete') {
      const { handleDraftDelete } = await import('./telegram/handlers/draft');
      await handleDraftDelete(callbackQuery, env);
      return;
    }

    if (data === 'draft_new') {
      const { handleDraftNew } = await import('./telegram/handlers/draft');
      await handleDraftNew(callbackQuery, env);
      return;
    }

    if (data === 'draft_send') {
      const { handleDraftSend } = await import('./telegram/handlers/draft');
      await handleDraftSend(callbackQuery, env);
      return;
    }

    if (data === 'draft_edit') {
      const { handleDraftEdit } = await import('./telegram/handlers/draft');
      await handleDraftEdit(callbackQuery, env);
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

    // MBTI test version selection
    if (data === 'mbti_test_quick') {
      const { handleMBTITestQuick } = await import('./telegram/handlers/mbti');
      await handleMBTITestQuick(callbackQuery, env);
      return;
    }

    if (data === 'mbti_test_full') {
      const { handleMBTITestFull } = await import('./telegram/handlers/mbti');
      await handleMBTITestFull(callbackQuery, env);
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

    // Quick action buttons after registration
    if (data === 'throw') {
      await telegram.answerCallbackQuery(callbackQuery.id);
      const { handleThrow } = await import('./telegram/handlers/throw');
      // Convert callback to message format
      const fakeMessage = {
        ...callbackQuery.message!,
        from: callbackQuery.from,
        text: '/throw',
      };
      await handleThrow(fakeMessage as any, env);
      return;
    }

    if (data === 'catch') {
      await telegram.answerCallbackQuery(callbackQuery.id);
      const { handleCatch } = await import('./telegram/handlers/catch');
      // Convert callback to message format
      const fakeMessage = {
        ...callbackQuery.message!,
        from: callbackQuery.from,
        text: '/catch',
      };
      await handleCatch(fakeMessage as any, env);
      return;
    }

    if (data === 'profile') {
      await telegram.answerCallbackQuery(callbackQuery.id);
      const { handleProfile } = await import('./telegram/handlers/profile');
      // Convert callback to message format
      const fakeMessage = {
        ...callbackQuery.message!,
        from: callbackQuery.from,
        text: '/profile',
      };
      await handleProfile(fakeMessage as any, env);
      return;
    }

    if (data === 'stats') {
      await telegram.answerCallbackQuery(callbackQuery.id);
      const { handleStats } = await import('./telegram/handlers/stats');
      // Convert callback to message format
      const fakeMessage = {
        ...callbackQuery.message!,
        from: callbackQuery.from,
        text: '/stats',
      };
      await handleStats(fakeMessage as any, env);
      return;
    }

    // Menu callbacks
    if (data.startsWith('menu_')) {
      const { handleMenuCallback } = await import('./telegram/handlers/menu');
      await handleMenuCallback(callbackQuery, env);
      return;
    }

    if (data === 'return_to_menu') {
      const { handleReturnToMenu } = await import('./telegram/handlers/menu');
      await handleReturnToMenu(callbackQuery, env);
      return;
    }

    // Settings callbacks
    if (data.startsWith('settings_')) {
      const { handleSettingsCallback } = await import('./telegram/handlers/settings');
      await handleSettingsCallback(callbackQuery, env);
      return;
    }

    if (data.startsWith('set_lang_')) {
      const { handleLanguageChange } = await import('./telegram/handlers/settings');
      await handleLanguageChange(callbackQuery, env);
      return;
    }

    if (data === 'back_to_settings') {
      const { handleBackToSettings } = await import('./telegram/handlers/settings');
      await handleBackToSettings(callbackQuery, env);
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
    interface SuccessfulPaymentMessage {
      successful_payment?: unknown;
    }
    console.error('[Router] Payment received:', (update.message as SuccessfulPaymentMessage).successful_payment);
    return;
  }

  console.error('[Router] Unhandled update type');
}

