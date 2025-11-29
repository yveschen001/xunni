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
import { handleFortune, handleFortuneCallback, handleFortuneInput } from './telegram/handlers/fortune';
import { createTelegramService } from './services/telegram';
import { createDatabaseClient } from './db/client';
import { findUserByTelegramId, createUser } from './db/queries/users';
import { generateInviteCode } from './domain/user';

// ============================================================================
// Webhook Handler
// ============================================================================

export async function handleWebhook(request: Request, env: Env): Promise<Response> {
  try {
    // 🌐 Serve Legal Documents (GET requests)
    if (request.method === 'GET') {
      const url = new URL(request.url);
      const path = url.pathname;
      
      if (path === '/privacy' || path === '/privacy.html') {
        const { serveLegalDocument } = await import('~/legal/documents');
        return serveLegalDocument('privacy');
      }
      if (path === '/terms' || path === '/terms.html') {
        const { serveLegalDocument } = await import('~/legal/documents');
        return serveLegalDocument('terms');
      }
      if (path === '/community' || path === '/community.html') {
        const { serveLegalDocument } = await import('~/legal/documents');
        return serveLegalDocument('community');
      }
      
      // Default root greeting
      if (path === '/') {
        return new Response('XunNi Bot is running. Visit /privacy, /terms, or /community for legal info.', {
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    }

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

    // 🛡️ Rate Limiting
    const telegramId =
      update.message?.from?.id ||
      update.callback_query?.from?.id ||
      update.pre_checkout_query?.from?.id;

    if (telegramId) {
      const { RateLimiter } = await import('~/services/rate_limiter');
      const rateLimiter = new RateLimiter(env);
      // Limit: 60 requests per 60 seconds (1 req/sec sustained)
      // Allow bursts but cap sustained load
      const isAllowed = await rateLimiter.isAllowed(telegramId.toString(), 60, 60);

      if (!isAllowed) {
        console.warn(`[Router] Rate limit exceeded for user ${telegramId}`);
        // Return 200 OK to stop Telegram from retrying, but drop the update
        // (If we return 429, Telegram might retry, exacerbating the load)
        // Actually, Telegram webhook documentation says:
        // "If you're having problems... we will keep trying..."
        // "If we receive a 429... we will retry later."
        // So returning 200 OK is safer to drop spam.
        return new Response('OK', { status: 200 });
      }
    }

    // Route update to appropriate handler
    await routeUpdate(update, env);

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('[Router] Webhook error:', error);
    // ⚠️ Prevent Telegram retry loop by returning 200 OK even on error
    // We log the error above for debugging
    return new Response('OK', { status: 200 });
  }
}

// ============================================================================
// Update Router
// ============================================================================

export async function routeUpdate(update: TelegramUpdate, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);

  // 🌍 Pre-load translations based on user's language
  // This ensures i18n.t() works synchronously in all handlers
  let userLang = 'zh-TW'; // Default

  try {
    const fromUser =
      update.message?.from || update.callback_query?.from || update.pre_checkout_query?.from;
    if (fromUser) {
      const telegramId = fromUser.id.toString();
      // Try to get language from DB first (most accurate)
      const user = await findUserByTelegramId(db, telegramId);
      if (user?.language_pref) {
        userLang = user.language_pref;
      } else if (fromUser.language_code) {
        // Fallback to Telegram language code
        userLang = fromUser.language_code;
      }
    }

    // Load translations into memory cache (async)
    const { loadTranslations } = await import('./i18n');
    await loadTranslations(env, userLang);
  } catch (e) {
    console.error('[Router] Failed to pre-load translations:', e);
    // Continue anyway, will fallback to static core languages
  }

  // Handle successful payment FIRST (before other message processing)
  if (update.message && 'successful_payment' in update.message) {
    console.error('[Router] Payment received, processing...');
    console.error('[Router] Payment data:', JSON.stringify(update.message.successful_payment));
    const { handleSuccessfulPayment } = await import('./telegram/handlers/vip');
    await handleSuccessfulPayment(update.message, update.message.successful_payment, env);
    return;
  }

  // Handle message
  if (update.message) {
    const message = update.message;
    const text = message.text || '';
    const lowerText = text.toLowerCase(); // Define lowerText early
    const chatId = message.chat.id;
    const telegramId = message.from!.id.toString();

    // Check if message contains media (photo, document, video, etc.)
    // These are not allowed in conversations
    if (
      message.photo ||
      message.document ||
      message.video ||
      message.audio ||
      message.voice ||
      message.video_note ||
      message.sticker ||
      message.animation
    ) {
      // Get user to check if they're in a conversation
      const user = await findUserByTelegramId(db, telegramId);
      if (user && user.onboarding_step === 'completed') {
        // Check if user has active conversation
        const { getActiveConversation } = await import('~/db/queries/conversations');
        const conversation = await getActiveConversation(db, telegramId);
        if (conversation) {
          // User is in a conversation, reject media
          const { createI18n } = await import('./i18n');
          const i18n = createI18n(user.language_pref || 'zh-TW');
          await telegram.sendMessage(chatId, i18n.t('warning.text8'));
          return;
        }
      }
      // If not in conversation, ignore media messages (let other handlers process or ignore)
      return;
    }

    // Log message details for debugging
    console.error('[Router] Message details:', {
      telegramId,
      text: text.substring(0, 100), // Log first 100 chars
      hasInviteCode: text.includes('invite_'),
    });

    // Check if user exists
    const user = await findUserByTelegramId(db, telegramId);

    // New user - auto-trigger welcome flow (no /start required)
    // BUT: if it's a /start command with invite code, let the start handler process it
    if (!user) {
      const isStartCommand = text.startsWith('/start');
      const hasInviteCode = text.includes('invite_');

      // If it's /start with invite code, let the start handler process it
      if (isStartCommand && hasInviteCode) {
        console.error('[Router] New user with invite code, delegating to /start handler');
        // Don't create user here, let /start handler do it with invite info
        await handleStart(message, env);
        return;
      } else {
        // Create user record for non-invite scenarios
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
    }

    // Check if user is banned (skip for admins)
    const { getAdminIds } = await import('./telegram/handlers/admin_ban');
    const adminIds = getAdminIds(env);
    const isUserAdmin = adminIds.includes(telegramId);

    // Check maintenance mode (skip for admins)
    if (!isUserAdmin) {
      const { getMaintenanceMode } = await import('./telegram/handlers/maintenance');
      const { isInMaintenanceMode, formatMaintenanceNotification } = await import(
        './domain/maintenance'
      );
      const maintenance = await getMaintenanceMode(db);

      if (maintenance && isInMaintenanceMode(maintenance)) {
        const notificationMessage = formatMaintenanceNotification(maintenance);
        await telegram.sendMessage(chatId, notificationMessage);
        return;
      }
    }

    const { isBanned } = await import('./domain/user');
    if (!isUserAdmin && isBanned(user)) {
      const { createI18n } = await import('./i18n');
      const i18n = createI18n(user.language_pref || 'zh-TW');

      let message: string;

      if (user.banned_until) {
        // Temporary ban
        const bannedUntil = new Date(user.banned_until);
        const now = new Date();
        const msLeft = bannedUntil.getTime() - now.getTime();
        const hoursLeft = Math.ceil(msLeft / (1000 * 60 * 60));
        const daysLeft = Math.floor(hoursLeft / 24);

        let timeLeft: string;
        if (daysLeft > 0) {
          const hours = hoursLeft % 24;
          timeLeft = i18n.t('common.timeLeftDaysHours', { days: daysLeft, hours });
        } else {
          timeLeft = i18n.t('common.timeLeftHours', { hours: hoursLeft });
        }

        const unbanTime = bannedUntil.toLocaleString(
          user.language_pref === 'en' ? 'en-US' : 'zh-TW',
          {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: user.language_pref === 'en' ? 'UTC' : 'Asia/Taipei',
          }
        );

        message = i18n.t('ban.bannedTemporary', {
          timeLeft,
          unbanTime,
        });
      } else {
        // Permanent ban
        message = i18n.t('ban.bannedPermanent', {});
      }

      await telegram.sendMessage(chatId, message);
      return;
    }

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
      const _isCommand = text.startsWith('/');

      // Load i18n for router logic
      const { createI18n } = await import('./i18n');
      const routerI18n = createI18n(user.language_pref || 'zh-TW');

      // Try appeal reason input first
      if (user.session_state === 'awaiting_appeal_reason') {
        const { handleAppealReasonInput } = await import('./telegram/handlers/appeal');
        await handleAppealReasonInput(message, env);
        return;
      }

      // Try VIP refund reason input
      const { getActiveSession: getSession } = await import('./db/queries/sessions');
      const refundSession = await getSession(db, user.telegram_id, 'vip_refund_reason');
      if (refundSession) {
        const sessionData = JSON.parse(refundSession.data);
        const { handleVipRefundReasonInput } = await import('./telegram/handlers/vip_refund');
        await handleVipRefundReasonInput(message, sessionData, env);
        return;
      }

      // Check if user is replying to a message (HIGHEST PRIORITY: explicit user action!)
      if (message.reply_to_message && text) {
        const replyToText = message.reply_to_message.text || '';

        // Check if replying to throw bottle prompt (#THROW tag or ForceReply prompt)

        if (
          replyToText.includes('#THROW') ||
          replyToText.includes(routerI18n.t('router.throwPrompt'))
        ) {
          console.error('[router] Detected reply to throw bottle prompt:', {
            userId: user.telegram_id,
            contentLength: text.length,
            method: replyToText.includes('#THROW') ? 'long-press' : 'button',
          });

          const { processBottleContent } = await import('./telegram/handlers/throw');
          await processBottleContent(user, text, env);
          return;
        }

        // Check if replying to conversation-related messages
        // Try to extract conversation identifier from various message formats:
        // 1. "💬 回覆 #IDENTIFIER：" (ForceReply button)
        // 2. "💬 與 #IDENTIFIER 的對話記錄" (History post)
        // 3. "💬 來自 #IDENTIFIER 的新訊息" (New message notification)
        let conversationIdentifier: string | undefined;

        if (replyToText.includes(routerI18n.t('router.replyPrompt'))) {
          // Support both old format (💬 回覆 #ID：) and new format (💬 回覆對話 ID)
          const match = replyToText.match(/💬 回覆(?:對話)?\s*#?([A-Z0-9]+)[：]?/);
          if (match) {
            conversationIdentifier = match[1];
            console.error('[router] Detected reply to ForceReply prompt:', {
              userId: user.telegram_id,
              conversationIdentifier,
              method: 'button',
            });
          }
        } else if (replyToText.includes(routerI18n.t('conversation.historyPost'))) {
          const historyPostPattern = new RegExp(
            routerI18n.t('conversation.historyPost').replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
              '([A-Z0-9]+)' +
              routerI18n.t('conversation.historyPostSuffix').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          );
          const match = replyToText.match(historyPostPattern);
          if (match) {
            conversationIdentifier = match[1];
            console.error('[router] Detected reply to history post:', {
              userId: user.telegram_id,
              conversationIdentifier,
              method: 'long-press',
            });
          }
        } else if (replyToText.includes(routerI18n.t('conversation.newMessageNotification'))) {
          const newMessagePattern = new RegExp(
            routerI18n
              .t('conversation.newMessageNotification')
              .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
              '([A-Z0-9]+)' +
              routerI18n
                .t('conversation.newMessageNotificationSuffix')
                .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          );
          const match = replyToText.match(newMessagePattern);
          if (match) {
            conversationIdentifier = match[1];
            console.error('[router] Detected reply to new message notification:', {
              userId: user.telegram_id,
              conversationIdentifier,
              method: 'long-press',
            });
          }
        }

        // Process as conversation message
        const { handleMessageForward } = await import('./telegram/handlers/message_forward');
        const isConversationMessage = await handleMessageForward(
          message,
          env,
          conversationIdentifier
        );
        if (isConversationMessage) {
          return;
        }
      }

      // Try profile edit input (lowest priority)
      const { handleProfileEditInput } = await import('./telegram/handlers/edit_profile');
      const isEditingProfile = await handleProfileEditInput(message, env);
      if (isEditingProfile) {
        return;
      }

      // Try admin ad wizard input
      const { handleAdminAdInput } = await import('./telegram/handlers/admin_ads');
      const isAdminAdInput = await handleAdminAdInput(message, env);
      if (isAdminAdInput) {
        return;
      }

      // Try admin task wizard input
      const { handleAdminTaskInput } = await import('./telegram/handlers/admin_tasks');
      const isAdminTaskInput = await handleAdminTaskInput(message, env);
      if (isAdminTaskInput) {
        return;
      }

      // Try fortune wizard input
      const isFortuneInput = await handleFortuneInput(message, env);
      if (isFortuneInput) {
        return;
      }
    }

    // Check if user is at tutorial final page but hasn't clicked any button
    if (
      user.tutorial_step === 'start_using' &&
      user.tutorial_completed === 0 &&
      !text.startsWith('/')
    ) {
      console.error(
        '[router] User at tutorial final page but sent message instead of clicking button'
      );
      const { createI18n } = await import('./i18n');
      const i18n = createI18n(user.language_pref || 'zh-TW');
      await telegram.sendMessage(
        message.chat.id,
        i18n.t('tutorial.clickButtonHint') +
          '\n\n' +
          i18n.t('tutorial.throwBottleDesc') +
          '\n' +
          i18n.t('tutorial.catchBottleDesc') +
          '\n' +
          i18n.t('tutorial.completeTasksForBottles') +
          '\n\n' +
          i18n.t('tutorial.availableCommands') +
          '：\n' +
          i18n.t('tutorial.commandThrow') +
          '\n' +
          i18n.t('tutorial.commandCatch') +
          '\n' +
          i18n.t('tutorial.commandTasks') +
          '\n' +
          i18n.t('tutorial.commandMenu')
      );
      return;
    }

    // Route commands
    console.error('[router] Starting command routing, text:', text);

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

    if (text === '/appeal') {
      const { handleAppeal } = await import('./telegram/handlers/appeal');
      await handleAppeal(message, env);
      return;
    }

    if (text === '/appeal_status') {
      const { handleAppealStatus } = await import('./telegram/handlers/appeal');
      await handleAppealStatus(message, env);
      return;
    }

    if (text.startsWith('/admin_ban ')) {
      const { handleAdminBan } = await import('./telegram/handlers/admin_ban');
      await handleAdminBan(message, env);
      return;
    }

    if (text.startsWith('/admin_unban ')) {
      const { handleAdminUnban } = await import('./telegram/handlers/admin_ban');
      await handleAdminUnban(message, env);
      return;
    }

    if (text.startsWith('/admin_bans')) {
      const { handleAdminBans } = await import('./telegram/handlers/admin_ban');
      await handleAdminBans(message, env);
      return;
    }

    if (text.startsWith('/admin_appeals')) {
      const { handleAdminAppeals } = await import('./telegram/handlers/admin_ban');
      await handleAdminAppeals(message, env);
      return;
    }

    if (text.startsWith('/admin_approve')) {
      const { handleAdminApprove } = await import('./telegram/handlers/admin_ban');
      await handleAdminApprove(message, env);
      return;
    }

    if (text.startsWith('/admin_reject')) {
      const { handleAdminReject } = await import('./telegram/handlers/admin_ban');
      await handleAdminReject(message, env);
      return;
    }

    if (text.startsWith('/broadcast_filter ')) {
      // Check super admin permission
      const { isSuperAdmin } = await import('./telegram/handlers/admin_ban');
      if (!isSuperAdmin(telegramId, env)) {
        const { createI18n } = await import('./i18n');
        const i18n = createI18n(user?.language_pref || 'zh-TW');
        await telegram.sendMessage(chatId, i18n.t('error.admin4'));
        return;
      }

      // Filtered broadcast system
      const { handleBroadcastFilter } = await import('./telegram/handlers/broadcast');
      await handleBroadcastFilter(message, env);
      return;
    }

    if (text.startsWith('/broadcast ')) {
      // Check super admin permission
      const { isSuperAdmin } = await import('./telegram/handlers/admin_ban');
      if (!isSuperAdmin(telegramId, env)) {
        const { createI18n } = await import('./i18n');
        const i18n = createI18n(user?.language_pref || 'zh-TW');
        await telegram.sendMessage(chatId, i18n.t('error.admin4'));
        return;
      }

      // Broadcast system - will be implemented below
      const { handleBroadcast } = await import('./telegram/handlers/broadcast');
      await handleBroadcast(message, env);
      return;
    }

    if (text === '/admin_list') {
      const { handleAdminList } = await import('./telegram/handlers/admin_ban');
      await handleAdminList(message, env);
      return;
    }

    if (text === '/admin_refresh_vip_avatars') {
      const { handleAdminRefreshVipAvatars } = await import(
        './telegram/handlers/admin_refresh_vip_avatars'
      );
      await handleAdminRefreshVipAvatars(db, env, chatId, user.telegram_id);
      return;
    }

    if (text === '/admin_diagnose_avatar' || text.startsWith('/admin_diagnose_avatar ')) {
      const { handleAdminDiagnoseAvatar } = await import(
        './telegram/handlers/admin_diagnose_avatar'
      );
      const targetUserId = text.split(' ')[1];
      await handleAdminDiagnoseAvatar(db, env, chatId, user.telegram_id, targetUserId);
      return;
    }

    if (text === '/admin_test_refresh') {
      const { handleAdminTestRefresh } = await import('./telegram/handlers/admin_test_refresh');
      await handleAdminTestRefresh(db, env, chatId, user.telegram_id);
      return;
    }

    if (text.startsWith('/admin_add ')) {
      const { handleAdminAdd } = await import('./telegram/handlers/admin_ban');
      await handleAdminAdd(message, env);
      return;
    }

    if (text.startsWith('/admin_remove ')) {
      const { handleAdminRemove } = await import('./telegram/handlers/admin_ban');
      await handleAdminRemove(message, env);
      return;
    }

    if (text === '/admin_ads') {
      const { handleAdminAds } = await import('./telegram/handlers/admin_ads');
      await handleAdminAds(message, env);
      return;
    }

    if (text === '/admin_tasks') {
      const { handleAdminTasks } = await import('./telegram/handlers/admin_tasks');
      await handleAdminTasks(message, env);
      return;
    }

    if (text === '/admin_ad_create') {
      const { handleAdminAds } = await import('./telegram/handlers/admin_ads');
      // Currently handleAdminAds has the create button, but we could expose a direct create handler
      // For now, just show the menu
      await handleAdminAds(message, env);
      return;
    }

    // Maintenance mode commands (Super Admin only)
    if (text.startsWith('/maintenance_enable ')) {
      const { isSuperAdmin } = await import('./telegram/handlers/admin_ban');
      if (!isSuperAdmin(telegramId, env)) {
        const { createI18n } = await import('./i18n');
        const i18n = createI18n(user?.language_pref || 'zh-TW');
        await telegram.sendMessage(chatId, i18n.t('error.admin4'));
        return;
      }
      const { handleMaintenanceEnable } = await import('./telegram/handlers/maintenance');
      await handleMaintenanceEnable(message, env);
      return;
    }

    if (text === '/maintenance_disable') {
      const { isSuperAdmin } = await import('./telegram/handlers/admin_ban');
      if (!isSuperAdmin(telegramId, env)) {
        const { createI18n } = await import('./i18n');
        const i18n = createI18n(user?.language_pref || 'zh-TW');
        await telegram.sendMessage(chatId, i18n.t('error.admin4'));
        return;
      }
      const { handleMaintenanceDisable } = await import('./telegram/handlers/maintenance');
      await handleMaintenanceDisable(message, env);
      return;
    }

    if (text === '/maintenance_status') {
      const { isSuperAdmin } = await import('./telegram/handlers/admin_ban');
      if (!isSuperAdmin(telegramId, env)) {
        const { createI18n } = await import('./i18n');
        const i18n = createI18n('zh-TW'); // Admin messages default to zh-TW
        await telegram.sendMessage(chatId, i18n.t('admin.onlySuperAdmin'));
        return;
      }
      const { handleMaintenanceStatus } = await import('./telegram/handlers/maintenance');
      await handleMaintenanceStatus(message, env);
      return;
    }

    // Analytics commands (Super Admin only)
    if (text === '/analytics') {
      console.log(`[Router] Handling /analytics for ${telegramId}`);
      const { isSuperAdmin } = await import('./telegram/handlers/admin_ban');
      const user = await findUserByTelegramId(db, telegramId);
      const { createI18n } = await import('./i18n');
      const i18n = createI18n(user?.language_pref || 'zh-TW');

      const isUserSuperAdmin = isSuperAdmin(telegramId, env); // Check purely by ID first (fast check)
      console.log(`[Router] isSuperAdmin(${telegramId}) = ${isUserSuperAdmin}`);

      if (!isUserSuperAdmin) {
        console.warn(`[Router] /analytics blocked: User ${telegramId} is not SuperAdmin`);
        await telegram.sendMessage(chatId, i18n.t('admin.analytics.onlySuperAdmin')); // Use new key
        return;
      }
      console.log(`[Router] Delegating to handleAnalytics`);
      const { handleAnalytics } = await import('./telegram/handlers/admin_analytics');
      await handleAnalytics(message, env);
      return;
    }

    if (text === '/ad_performance') {
      const { isSuperAdmin } = await import('./telegram/handlers/admin_ban');
      const user = await findUserByTelegramId(db, telegramId);
      const { createI18n } = await import('./i18n');
      const i18n = createI18n(user?.language_pref || 'zh-TW');
      if (!isSuperAdmin(telegramId, env)) {
        await telegram.sendMessage(chatId, i18n.t('admin.onlySuperAdmin'));
        return;
      }
      const { handleAdPerformance } = await import('./telegram/handlers/admin_analytics');
      await handleAdPerformance(message, env);
      return;
    }

    if (text === '/funnel') {
      const { isSuperAdmin } = await import('./telegram/handlers/admin_ban');
      const user = await findUserByTelegramId(db, telegramId);
      const { createI18n } = await import('./i18n');
      const i18n = createI18n(user?.language_pref || 'zh-TW');
      if (!isSuperAdmin(telegramId, env)) {
        await telegram.sendMessage(chatId, i18n.t('admin.onlySuperAdmin'));
        return;
      }
      const { handleVIPFunnel } = await import('./telegram/handlers/admin_analytics');
      await handleVIPFunnel(message, env);
      return;
    }

    // Test daily reports command (Super Admin only)
    if (text === '/test_daily_reports') {
      const { isSuperAdmin } = await import('./telegram/handlers/admin_ban');
      const user = await findUserByTelegramId(db, telegramId);
      const { createI18n } = await import('./i18n');
      const i18n = createI18n(user?.language_pref || 'zh-TW');
      if (!isSuperAdmin(telegramId, env)) {
        await telegram.sendMessage(chatId, i18n.t('admin.onlySuperAdmin'));
        return;
      }
      const { handleTestDailyReports } = await import('./telegram/handlers/admin_analytics');
      await handleTestDailyReports(message, env);
      return;
    }

    // Admin Report Test
    if (text === '/admin_report_test') {
      const { isSuperAdmin } = await import('./telegram/handlers/admin_ban');
      if (!isSuperAdmin(telegramId)) {
        return;
      }
      const { handleAdminDailyReport } = await import('./telegram/handlers/admin_report');
      await telegram.sendMessage(chatId, 'Generating daily report...');
      await handleAdminDailyReport(env, telegramId);
      return;
    }

    // Test Smart Match Push (Admin only)
    if (text === '/admin_test_match_push') {
      const { isSuperAdmin } = await import('./telegram/handlers/admin_ban');
      if (!isSuperAdmin(telegramId)) {
        return;
      }

      const { handleMatchPush } = await import('./telegram/handlers/cron_match_push');
      // const { createDatabaseClient } = await import('./db/client');
      // const db = createDatabaseClient(env.DB);

      await telegram.sendMessage(chatId, 'Testing Smart Match Push for your user...');
      await handleMatchPush(env, env.DB, telegramId);
      return;
    }

    // Test Retention Push (Admin only)
    if (text === '/admin_test_retention_push') {
      const { isSuperAdmin } = await import('./telegram/handlers/admin_ban');
      if (!isSuperAdmin(telegramId)) {
        return;
      }

      const { handlePushReminders } = await import('./telegram/handlers/cron_push');

      await telegram.sendMessage(
        chatId,
        'Testing Retention Pushes (Throw/Catch/Message) for all eligible users...'
      );
      // Note: handlePushReminders processes batches of users. It doesn't target a specific user yet.
      // But we can run it to see if it triggers for anyone (including the admin if eligible).
      await handlePushReminders(env);
      await telegram.sendMessage(
        chatId,
        'Retention Pushes check completed. Check logs for details.'
      );
      return;
    }

    // Broadcast process command (Admin only) - Manual trigger
    if (text === '/broadcast_process') {
      const { isSuperAdmin } = await import('./telegram/handlers/admin_ban');
      const user = await findUserByTelegramId(db, telegramId);
      const { createI18n } = await import('./i18n');
      const i18n = createI18n(user?.language_pref || 'zh-TW');
      if (!isSuperAdmin(telegramId)) {
        await telegram.sendMessage(chatId, i18n.t('admin.onlySuperAdmin'));
        return;
      }
      const { handleBroadcastProcess } = await import('./telegram/handlers/broadcast');
      await handleBroadcastProcess(message, env);
      return;
    }

    // New Broadcast Filter command
    if (text.startsWith('/broadcast_filter')) {
      // Check super admin permission
      const { isSuperAdmin } = await import('./telegram/handlers/admin_ban');
      if (!isSuperAdmin(telegramId)) {
        const { createI18n } = await import('./i18n');
        const i18n = createI18n(user?.language_pref || 'zh-TW');
        await telegram.sendMessage(chatId, i18n.t('error.admin4'));
        return;
      }

      const { handleBroadcastFilter } = await import('./telegram/handlers/broadcast_v2');
      await handleBroadcastFilter(message, env);
      return;
    }

    // Broadcast cancel command (Admin only)
    if (text.startsWith('/broadcast_cancel ')) {
      const { isSuperAdmin } = await import('./telegram/handlers/admin_ban');
      const user = await findUserByTelegramId(db, telegramId);
      const { createI18n } = await import('./i18n');
      const i18n = createI18n(user?.language_pref || 'zh-TW');
      if (!isSuperAdmin(telegramId)) {
        await telegram.sendMessage(chatId, i18n.t('admin.onlySuperAdmin'));
        return;
      }
      const { handleBroadcastCancel } = await import('./telegram/handlers/broadcast');
      await handleBroadcastCancel(message, env);
      return;
    }

    // Broadcast cleanup command (Admin only)
    if (text.startsWith('/broadcast_cleanup')) {
      const { isSuperAdmin } = await import('./telegram/handlers/admin_ban');
      const user = await findUserByTelegramId(db, telegramId);
      const { createI18n } = await import('./i18n');
      const i18n = createI18n(user?.language_pref || 'zh-TW');
      if (!isSuperAdmin(telegramId)) {
        await telegram.sendMessage(chatId, i18n.t('admin.onlySuperAdmin'));
        return;
      }
      const { handleBroadcastCleanup } = await import('./telegram/handlers/broadcast');
      await handleBroadcastCleanup(message, env);
      return;
    }

    // Broadcast status command (Admin only)
    if (text.startsWith('/broadcast_status')) {
      console.error('[Router] /broadcast_status command received');
      const { isSuperAdmin } = await import('./telegram/handlers/admin_ban');
      const isUserSuperAdmin = isSuperAdmin(telegramId, env);
      console.error('[Router] isSuperAdmin check result:', isUserSuperAdmin);

      if (!isUserSuperAdmin) {
        console.error('[Router] User is not super admin, sending error message');
        const user = await findUserByTelegramId(db, telegramId);
        const { createI18n } = await import('./i18n');
        const i18n = createI18n(user?.language_pref || 'zh-TW');
        await telegram.sendMessage(chatId, i18n.t('admin.onlySuperAdmin'));
        return;
      }

      console.error('[Router] User is super admin, calling handleBroadcastStatus');
      const { handleBroadcastStatus } = await import('./telegram/handlers/broadcast');
      await handleBroadcastStatus(message, env);
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

    if (text === '/refresh_avatar') {
      const { handleRefreshAvatar } = await import('./telegram/handlers/refresh_avatar');
      await handleRefreshAvatar(db, env, chatId, user.telegram_id);
      return;
    }

    if (text === '/help') {
      const { handleHelp } = await import('./telegram/handlers/help');
      await handleHelp(message, env);
      return;
    }

    if (text === '/tasks') {
      const { handleTasks } = await import('./telegram/handlers/tasks');
      await handleTasks(message, env);
      return;
    }

    if (text === '/fortune') {
      await handleFortune(message, env);
      return;
    }

    if (text === '/rules') {
      const { handleRules } = await import('./telegram/handlers/help');
      await handleRules(message, env);
      return;
    }

    if (text === '/menu' || lowerText === 'menu') {
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

    if (text === '/payments') {
      const { handlePayments } = await import('./telegram/handlers/payments');
      await handlePayments(message, env);
      return;
    }

    if (text === '/vip_refund') {
      const { handleVipRefund } = await import('./telegram/handlers/vip_refund');
      await handleVipRefund(message, env);
      return;
    }

    if (text === '/admin_refunds') {
      const { handleAdminRefunds } = await import('./telegram/handlers/vip_refund');
      await handleAdminRefunds(message, env);
      return;
    }

    if (text === '/admin_report') {
      const { handleAdminReportCommand } = await import('./telegram/handlers/admin_report');
      await handleAdminReportCommand(message, env);
      return;
    }

    if (text.startsWith('/admin_approve_refund ')) {
      const requestId = text.split(' ')[1];
      if (requestId) {
        const { handleAdminApproveRefund } = await import('./telegram/handlers/vip_refund');
        await handleAdminApproveRefund(message, requestId, env);
      }
      return;
    }

    if (text.startsWith('/admin_reject_refund ')) {
      const parts = text.split(' ');
      const requestId = parts[1];
      const reason = parts.slice(2).join(' ');
      if (requestId && reason) {
        const { handleAdminRejectRefund } = await import('./telegram/handlers/vip_refund');
        await handleAdminRejectRefund(message, requestId, reason, env);
      }
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
    if (user.onboarding_step !== 'completed') {
      const { createI18n } = await import('./i18n');
      const i18n = createI18n(user.language_pref || 'zh-TW');
      const stepMessages: Record<string, string> = {
        language_selection: i18n.t('onboarding.stepLanguageSelection'),
        nickname: i18n.t('onboarding.stepNickname'),
        gender: i18n.t('onboarding.stepGender'),
        birthday: i18n.t('onboarding.stepBirthday'),
        mbti: i18n.t('onboarding.stepMbti'),
        anti_fraud: i18n.t('onboarding.stepAntiFraud'),
        terms: i18n.t('onboarding.stepTerms'),
      };

      const stepMessage = stepMessages[user.onboarding_step] || i18n.t('onboarding.stepDefault');
      await telegram.sendMessage(chatId, `💡 ${stepMessage}`);
      return;
    }

    // Unknown command for completed users - provide smart suggestions
    // lowerText is already defined at the top

    // Check if user is trying to throw a bottle
    // Note: These are keyword matches for smart suggestions, not display strings
    // They match user input in any language to provide helpful suggestions
    if (
      lowerText.includes('丟') ||
      lowerText.includes('瓶子') ||
      lowerText.includes('漂流瓶') ||
      lowerText.includes('throw') ||
      lowerText.includes('bottle') ||
      lowerText.includes('drift')
    ) {
      const { createI18n } = await import('./i18n');
      const i18n = createI18n(user.language_pref || 'zh-TW');
      await telegram.sendMessage(chatId, i18n.t('common.bottle13'), {
        reply_markup: {
          inline_keyboard: [
            [{ text: i18n.t('buttons.bottle3'), callback_data: 'throw' }],
            [{ text: i18n.t('buttons.bottle4'), callback_data: 'catch' }],
            [{ text: i18n.t('common.back3'), callback_data: 'return_to_menu' }],
          ],
        },
      });
      return;
    }

    // Check if user is trying to catch a bottle
    if (lowerText.includes('撿') || lowerText.includes('看') || lowerText.includes('catch')) {
      const { createI18n } = await import('./i18n');
      const i18n = createI18n(user.language_pref || 'zh-TW');
      await telegram.sendMessage(chatId, i18n.t('common.bottle9'), {
        reply_markup: {
          inline_keyboard: [
            [{ text: i18n.t('buttons.bottle4'), callback_data: 'catch' }],
            [{ text: i18n.t('buttons.bottle3'), callback_data: 'throw' }],
            [{ text: i18n.t('common.back3'), callback_data: 'return_to_menu' }],
          ],
        },
      });
      return;
    }

    // Check if user has an active throw_bottle session (waiting for bottle content)
    // If so, remind them to use "Reply" feature and send a message they can reply to
    const { getActiveSession } = await import('./db/queries/sessions');
    const throwSession = await getActiveSession(db, user.telegram_id, 'throw_bottle');

    if (throwSession) {
      console.error('[router] User has throw_bottle session but sent direct message:', {
        userId: user.telegram_id,
        messageLength: text.length,
      });

      // Send a prompt message that user can reply to
      const { createI18n } = await import('./i18n');
      const i18n = createI18n(user.language_pref || 'zh-TW');
      await telegram.sendMessage(chatId, i18n.t('router.suggestThrow'));
      return;
    }

    // Default unknown command
    const { createI18n } = await import('./i18n');
    const i18n = createI18n(user.language_pref || 'zh-TW');
    await telegram.sendMessage(chatId, i18n.t('router.suggestMenu'));
    return;
  }

  // Handle callback query
  if (update.callback_query) {
    const callbackQuery = update.callback_query;
    const data = callbackQuery.data || '';
    const chatId = callbackQuery.message?.chat.id;

    console.error('[Router] Callback query received:', {
      data,
      userId: callbackQuery.from.id,
      chatId,
      messageId: callbackQuery.message?.message_id,
      fullCallback: JSON.stringify(callbackQuery),
    });

    if (!chatId) {
      await telegram.answerCallbackQuery(callbackQuery.id, '錯誤：無法獲取聊天 ID');
      return;
    }

    // IMPORTANT: Answer callback immediately to prevent UI blocking
    // Individual handlers will also answer, but this ensures immediate feedback
    try {
      await telegram.answerCallbackQuery(callbackQuery.id);
    } catch (e) {
      // Ignore if already answered
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

    // Geo Onboarding
    if (data.startsWith('geo:')) {
      const { handleContinentSelection, handleCountrySelection, handleCitySelection, startGeoFlow } = 
        await import('./telegram/handlers/onboarding_geo');
        
      if (data.startsWith('geo:continent:')) {
        const continentId = data.replace('geo:continent:', '');
        await handleContinentSelection(callbackQuery, continentId, env);
        return;
      }
      if (data.startsWith('geo:country:')) {
        const countryCode = data.replace('geo:country:', '');
        await handleCountrySelection(callbackQuery, countryCode, env);
        return;
      }
      if (data.startsWith('geo:city:')) {
        const cityId = data.replace('geo:city:', '');
        await handleCitySelection(callbackQuery, cityId, env);
        return;
      }
      if (data ===('geo:back:region') || data === ('geo:back:country')) {
        await startGeoFlow(chatId, callbackQuery.from.id.toString(), env);
        return;
      }
    }

    // Language selection
    if (data.startsWith('lang_')) {
      if (data === 'lang_more') {
        await showAllLanguages(callbackQuery, env);
        return;
      }
      if (data === 'lang_back') {
        // Go back to main menu instead of popular languages if coming from menu
        // Or if coming from onboarding, show popular languages?
        // But popular languages view is onboarding only.
        // If user is accessing language settings from /settings -> lang_more -> lang_page_x -> lang_back
        // Then lang_back should go back to... popular languages? Or settings?
        // Let's assume lang_back goes back to popular languages view (page 0 essentially but formatted differently)
        // OR better: Just go back to "Popular" view which is what showLanguageSelection shows.

        const { getPopularLanguageButtons } = await import('~/i18n/languages');
        const { createI18n } = await import('./i18n');
        const { findUserByTelegramId } = await import('./db/queries/users');
        const user = await findUserByTelegramId(db, callbackQuery.from.id.toString());
        const i18n = createI18n(user?.language_pref || 'zh-TW');

        // Check if message exists to edit
        if (callbackQuery.message && callbackQuery.message.message_id) {
          await telegram.editMessageText(
            chatId,
            callbackQuery.message.message_id,
            i18n.t('onboarding.welcome'),
            {
              reply_markup: {
                inline_keyboard: getPopularLanguageButtons(i18n),
              },
            }
          );
        } else {
          // If message is missing (rare), send a new one
          await telegram.sendMessageWithButtons(
            chatId,
            i18n.t('onboarding.welcome'),
            getPopularLanguageButtons(i18n)
          );
        }
        await telegram.answerCallbackQuery(callbackQuery.id);
        return;
      }
      if (data.startsWith('lang_page_')) {
        // Handle pagination for language selection
        const page = parseInt(data.replace('lang_page_', ''), 10);
        const { getLanguageButtons } = await import('~/i18n/languages');
        const { createI18n } = await import('./i18n');
        const { findUserByTelegramId } = await import('./db/queries/users');
        const user = await findUserByTelegramId(db, callbackQuery.from.id.toString());
        const i18n = createI18n(user?.language_pref || 'zh-TW');
        await telegram.editMessageText(
          chatId,
          callbackQuery.message!.message_id,
          i18n.t('onboarding.languageSelection'),
          {
            reply_markup: {
              inline_keyboard: [
                ...getLanguageButtons(i18n, page),
                [{ text: i18n.t('common.back'), callback_data: 'lang_back' }],
              ],
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
      const { handleGenderSelection, handleGenderConfirmation, handleGenderReselection } =
        await import('./telegram/handlers/onboarding_callback');

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

      const { createI18n } = await import('./i18n');
      const { findUserByTelegramId } = await import('./db/queries/users');
      const user = await findUserByTelegramId(db, callbackQuery.from.id.toString());
      const i18n = createI18n(user?.language_pref || 'zh-TW');
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('common.unknownOption'));
      return;
    }

    if (data.startsWith('confirm_birthday_')) {
      const { handleBirthdayConfirmation } = await import(
        './telegram/handlers/onboarding_callback'
      );
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

    // Tutorial callbacks
    if (data.startsWith('tutorial_')) {
      const { handleTutorialCallback } = await import('./telegram/handlers/tutorial');
      const action = data; // Pass full action string
      await handleTutorialCallback(callbackQuery, action, env);
      return;
    }

    // Verify channel join (immediate check)
    if (data === 'verify_channel_join' || data.startsWith('verify_task_')) {
      const { handleVerifyChannelJoin } = await import('~/services/channel_membership_check');
      await handleVerifyChannelJoin(callbackQuery, env);
      return;
    }

    // Task claim callbacks
    if (data.startsWith('claim_task_')) {
      const { handleClaimTaskReward } = await import('~/services/channel_membership_check');
      const taskId = data.replace('claim_', '');
      await handleClaimTaskReward(callbackQuery, taskId, env);
      return;
    }

    // Next task callbacks
    if (data.startsWith('next_task_')) {
      console.error('[Router] Routing next_task callback:', data);
      const { handleNextTaskCallback } = await import('./telegram/handlers/tasks');
      await handleNextTaskCallback(callbackQuery, env);
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

    // Ad reward callbacks
    if (data === 'watch_ad') {
      const { handleWatchAd } = await import('./telegram/handlers/ad_reward');
      await handleWatchAd(callbackQuery, env);
      return;
    }

    // Official ad callbacks
    if (data === 'view_official_ad') {
      const { handleViewOfficialAds } = await import('./telegram/handlers/official_ad');
      await handleViewOfficialAds(callbackQuery, env);
      return;
    }

    if (data.startsWith('claim_ad_')) {
      const { handleClaimAd } = await import('./telegram/handlers/official_ad');
      const adId = parseInt(data.replace('claim_ad_', ''), 10);
      await handleClaimAd(callbackQuery, adId, env);
      return;
    }

    if (data.startsWith('verify_ad_')) {
      const { handleVerifyAd } = await import('./telegram/handlers/official_ad');
      const adId = parseInt(data.replace('verify_ad_', ''), 10);
      await handleVerifyAd(callbackQuery, adId, env);
      return;
    }

    // Conversation action callbacks
    if (data.startsWith('conv_profile_')) {
      const { handleConversationProfile } = await import(
        './telegram/handlers/conversation_actions'
      );
      const conversationId = parseInt(data.replace('conv_profile_', ''), 10);
      await handleConversationProfile(callbackQuery, conversationId, env);
      return;
    }

    if (data.startsWith('conv_block_confirm_')) {
      const { handleConversationBlockConfirm } = await import(
        './telegram/handlers/conversation_actions'
      );
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
      const { handleConversationReportConfirm } = await import(
        './telegram/handlers/conversation_actions'
      );
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

    if (data === 'report_cancel') {
      const { handleReportCancel } = await import('./telegram/handlers/report');
      await handleReportCancel(callbackQuery, env);
      return;
    }

    // Edit profile callbacks
    if (data === 'edit_nickname') {
      console.error('[Router] Routing to handleEditNickname');
      const { handleEditNickname } = await import('./telegram/handlers/edit_profile');
      await handleEditNickname(callbackQuery, env);
      return;
    }

    if (data === 'edit_bio') {
      console.error('[Router] Routing to handleEditBio');
      const { handleEditBio } = await import('./telegram/handlers/edit_profile');
      await handleEditBio(callbackQuery, env);
      return;
    }

    if (data === 'edit_region') {
      console.error('[Router] Routing to handleEditRegion');
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

    if (
      data === 'edit_profile_menu' ||
      data === 'edit_profile_back' ||
      data === 'edit_profile_callback'
    ) {
      const { handleEditProfileCallback } = await import('./telegram/handlers/edit_profile');
      await handleEditProfileCallback(callbackQuery, env);
      return;
    }

    if (data === 'retake_mbti') {
      const { handleMBTIMenuTest } = await import('./telegram/handlers/mbti');
      await handleMBTIMenuTest(callbackQuery, env);
      return;
    }

    // Country confirmation callbacks
    if (data === 'country_confirm_yes') {
      const { handleCountryConfirmYes } = await import('./telegram/handlers/country_confirmation');
      await handleCountryConfirmYes(callbackQuery, env);
      return;
    }

    if (data === 'country_select') {
      const { showCountrySelection } = await import('./telegram/handlers/country_selection');
      await showCountrySelection(
        callbackQuery.message!.chat.id,
        env,
        callbackQuery.from.id.toString()
      );
      await telegram.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data.startsWith('country_set_')) {
      const countryCode = data.replace('country_set_', '');
      const { handleCountrySet } = await import('./telegram/handlers/country_confirmation');
      await handleCountrySet(callbackQuery, countryCode, env);
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

    // Fortune Telling Callbacks
    if (data.startsWith('fortune_')) {
      await handleFortuneCallback(callbackQuery, env);
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

    if (data === 'mbti_menu_cancel' || data === 'mbti_menu_from_completion') {
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
      const { handleAntiFraudConfirmation } = await import(
        './telegram/handlers/onboarding_callback'
      );
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

    if (data === 'throw_input') {
      const { handleThrowInputButton } = await import('./telegram/handlers/throw');
      await handleThrowInputButton(callbackQuery, env);
      return;
    }

    // Handle conversation reply button
    if (data.startsWith('conv_reply_')) {
      const conversationIdentifier = data.replace('conv_reply_', '');
      const { handleConversationReplyButton } = await import('./telegram/handlers/message_forward');
      await handleConversationReplyButton(callbackQuery, conversationIdentifier, env);
      return;
    }

    // Handle conversation history button (from push notifications)
    if (data.startsWith('conv_history_')) {
      const conversationIdentifier = data.replace('conv_history_', '');
      const { handleHistory } = await import('./telegram/handlers/history');
      // Construct a fake message to invoke handleHistory
      const fakeMessage = {
        ...callbackQuery.message!,
        from: callbackQuery.from,
        text: `/history ${conversationIdentifier}`,
        chat: callbackQuery.message!.chat,
      };
      await handleHistory(fakeMessage as any, env);
      await telegram.answerCallbackQuery(callbackQuery.id);
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

    if (data === 'chats') {
      await telegram.answerCallbackQuery(callbackQuery.id);
      const { handleChats } = await import('./telegram/handlers/chats');
      // Convert callback to message format
      const fakeMessage = {
        ...callbackQuery.message!,
        from: callbackQuery.from,
        text: '/chats',
      };
      await handleChats(fakeMessage as any, env, 0);
      return;
    }

    // Handle pagination for chats
    if (data.startsWith('chats_page_')) {
      await telegram.answerCallbackQuery(callbackQuery.id);
      const { handleChats } = await import('./telegram/handlers/chats');
      const page = parseInt(data.replace('chats_page_', ''), 10);
      if (isNaN(page) || page < 0) {
        // Invalid page, go to first page
        const fakeMessage = {
          ...callbackQuery.message!,
          from: callbackQuery.from,
          text: '/chats',
        };
        await handleChats(fakeMessage as any, env, 0);
        return;
      }
      // Convert callback to message format
      const fakeMessage = {
        ...callbackQuery.message!,
        from: callbackQuery.from,
        text: '/chats',
      };
      await handleChats(fakeMessage as any, env, page);
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

    // Quiet Hours Grid Callbacks
    if (data.startsWith('quiet_start_')) {
      const { handleQuietHoursStartSelection } = await import('./telegram/handlers/settings_quiet');
      const startHour = parseInt(data.replace('quiet_start_', ''), 10);
      await handleQuietHoursStartSelection(callbackQuery, startHour, env);
      return;
    }

    if (data.startsWith('quiet_save_')) {
      const { handleQuietHoursSave } = await import('./telegram/handlers/settings_quiet');
      const parts = data.replace('quiet_save_', '').split('_');
      const startHour = parseInt(parts[0], 10);
      const endHour = parseInt(parts[1], 10);
      await handleQuietHoursSave(callbackQuery, startHour, endHour, env);
      return;
    }

    if (data === 'quiet_disable') {
      const { handleQuietHoursDisable } = await import('./telegram/handlers/settings_quiet');
      await handleQuietHoursDisable(callbackQuery, env);
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

    // VIP purchase callback
    if (data === 'vip_purchase') {
      const { handleVipPurchase } = await import('./telegram/handlers/vip');
      await handleVipPurchase(callbackQuery, env);
      return;
    }

    // VIP menu callback (return to VIP main menu)
    if (data === 'vip_menu') {
      // Create a fake message object to reuse handleVip
      const fakeMessage = {
        ...callbackQuery.message!,
        from: callbackQuery.from,
        text: '/vip',
      };
      const { handleVip } = await import('./telegram/handlers/vip');
      await handleVip(fakeMessage as any, env);
      // Delete the previous message to clean up UI (optional, but handleVip sends new message)
      // Actually handleVip sends a NEW message.
      // If we want to replace, we should modify handleVip or just delete old one here.
      // Let's delete old one to keep chat clean.
      await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);
      return;
    }

    // Payment history pagination
    if (data.startsWith('payments_page_')) {
      const { handlePaymentsCallback } = await import('./telegram/handlers/payments');
      await handlePaymentsCallback(callbackQuery, env);
      return;
    }

    // VIP cancel callback
    if (data === 'vip_cancel') {
      const db = createDatabaseClient(env.DB);
      const user = await findUserByTelegramId(db, callbackQuery.from.id.toString());
      const { createI18n } = await import('./i18n');
      const i18n = createI18n(user?.language_pref || 'zh-TW');
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('common.cancel'));
      await telegram.sendMessage(
        callbackQuery.message!.chat.id,
        i18n.t('vip.purchaseCancelled') + '\n\n' + i18n.t('vip.viewVipCommand')
      );
      return;
    }

    // VIP renewal callback
    if (data === 'vip_renew') {
      // Redirect to /vip command
      const mockMessage = {
        ...callbackQuery.message!,
        from: callbackQuery.from,
        text: '/vip',
      };
      const { handleVip } = await import('./telegram/handlers/vip');
      await handleVip(mockMessage as any, env);
      const { createI18n } = await import('./i18n');
      const { findUserByTelegramId } = await import('./db/queries/users');
      const user = await findUserByTelegramId(db, callbackQuery.from.id.toString());
      const i18n = createI18n(user?.language_pref || 'zh-TW');
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('vip.renewalProcessing'));
      return;
    }

    // VIP cancel reminder callback
    if (data === 'vip_cancel_reminder') {
      const { createI18n } = await import('./i18n');
      const { findUserByTelegramId } = await import('./db/queries/users');
      const user = await findUserByTelegramId(db, callbackQuery.from.id.toString());
      const i18n = createI18n(user?.language_pref || 'zh-TW');
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('vip.reminderCancelled'));
      await telegram.sendMessage(
        callbackQuery.message!.chat.id,
        i18n.t('vip.reminderCancelled') + '\n\n' + i18n.t('vip.viewVipCommand')
      );
      return;
    }

    // Admin Ad Callbacks
    if (
      data.startsWith('admin_ad_') ||
      (data.startsWith('wizard_') &&
        !data.startsWith('wizard_icon_') &&
        !data.startsWith('wizard_verify_') &&
        !data.startsWith('wizard_confirm_task') &&
        !data.startsWith('wizard_cancel_task'))
    ) {
      const { handleAdminAdCallback } = await import('./telegram/handlers/admin_ads');
      await handleAdminAdCallback(callbackQuery, env);
      return;
    }

    // Admin Task Callbacks
    if (
      data.startsWith('admin_task_') ||
      data.startsWith('wizard_icon_') ||
      data.startsWith('wizard_verify_') ||
      data === 'wizard_confirm_task' ||
      data === 'wizard_cancel_task'
    ) {
      const { handleAdminTaskCallback } = await import('./telegram/handlers/admin_tasks');
      await handleAdminTaskCallback(callbackQuery, env);
      return;
    }

    // ✨ NEW: Admin Ops Callbacks (Optimization)
    if (data.startsWith('admin_ops_')) {
      const { handleAdminOpsCallback } = await import('./telegram/handlers/admin_ops');
      const parts = data.replace('admin_ops_', '').split('_');
      // format: admin_ops_action_targetId
      // parts[0] is action, parts[1] is targetId
      const action = parts[0];
      const targetId = parts[1];

      if (action && targetId) {
        await handleAdminOpsCallback(callbackQuery, action, targetId, env);
        return;
      }
    }

    // ✨ NEW: Match Push Callbacks
    if (data.startsWith('match_vip_')) {
      const { handleMatchVip } = await import('./telegram/handlers/match_callback');
      // Format: match_vip_TOPIC_TARGET
      const parts = data.replace('match_vip_', '').split('_');
      // parts[0] is topic, parts[1] is target
      // WARNING: If target contains underscores, this split is dangerous.
      // Zodiac/MBTI/Blood targets usually don't have underscores.
      // zodiac: aries, leo...
      // mbti: INTJ, NF...
      // blood: A, B...
      const topic = parts[0];
      const target = parts.slice(1).join('_'); // Rejoin rest in case target has _ (unlikely but safe)

      await handleMatchVip(callbackQuery, topic, target, env);
      return;
    }

    if (data === 'match_throw') {
      const { handleMatchThrow } = await import('./telegram/handlers/match_callback');
      await handleMatchThrow(callbackQuery, env);
      return;
    }

    // Unknown callback
    console.error('[Router] Unknown callback data:', data);
    await telegram.answerCallbackQuery(callbackQuery.id, '未知的操作');
    return;
  }

  // Handle pre-checkout query (Telegram Stars payment)
  if (update.pre_checkout_query) {
    // Answer pre-checkout query (approve payment)
    await telegram.answerPreCheckoutQuery(update.pre_checkout_query.id, true);
    return;
  }

  // Debug: Log update structure
  console.error('[Router] Update structure:', {
    hasMessage: !!update.message,
    hasCallbackQuery: !!update.callback_query,
    hasPreCheckoutQuery: !!update.pre_checkout_query,
    messageKeys: update.message ? Object.keys(update.message) : [],
  });

  console.error('[Router] Unhandled update type');
}
