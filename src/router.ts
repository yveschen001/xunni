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

export async function routeUpdate(update: TelegramUpdate, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);

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
    const chatId = message.chat.id;
    const telegramId = message.from!.id.toString();

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
          timeLeft =
            user.language_pref === 'en'
              ? `${daysLeft} day${daysLeft > 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`
              : `${daysLeft} 天 ${hours} 小時`;
        } else {
          timeLeft =
            user.language_pref === 'en'
              ? `${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}`
              : `${hoursLeft} 小時`;
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
      const isCommand = text.startsWith('/');

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
        
        // Check if replying to throw bottle prompt (#THROW tag)
        if (replyToText.includes('#THROW')) {
          console.error('[router] Detected reply to throw bottle prompt:', {
            userId: user.telegram_id,
            contentLength: text.length,
          });
          
          const { processBottleContent } = await import('./telegram/handlers/throw');
          await processBottleContent(user, text, env);
          return;
        }
        
        // Otherwise, check if it's a conversation reply
        const { handleMessageForward } = await import('./telegram/handlers/message_forward');
        const isConversationMessage = await handleMessageForward(message, env);
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
    }

    // Check if user is at tutorial final page but hasn't clicked any button
    if (
      user.tutorial_step === 'start_using' &&
      user.tutorial_completed === 0 &&
      !text.startsWith('/')
    ) {
      console.error('[router] User at tutorial final page but sent message instead of clicking button');
      await telegram.sendMessage(
        message.chat.id,
        '💡 **提示**：請點擊上方的按鈕來開始使用\n\n' +
          '• 🌊 丟出漂流瓶 - 分享你的心情\n' +
          '• 🎣 撿起漂流瓶 - 看看別人的故事\n' +
          '• 📋 查看任務 - 完成任務獲得額外瓶子\n\n' +
          '或直接使用命令：\n' +
          '• /throw - 丟出漂流瓶\n' +
          '• /catch - 撿起漂流瓶\n' +
          '• /tasks - 任務中心\n' +
          '• /menu - 主選單'
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

    if (text.startsWith('/broadcast ')) {
      // Check super admin permission
      const { isSuperAdmin } = await import('./telegram/handlers/admin_ban');
      if (!isSuperAdmin(telegramId)) {
        await telegram.sendMessage(chatId, '❌ 只有超級管理員可以使用此命令。');
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

    // Maintenance mode commands (Super Admin only)
    if (text.startsWith('/maintenance_enable ')) {
      const { isSuperAdmin } = await import('./telegram/handlers/admin_ban');
      if (!isSuperAdmin(telegramId)) {
        await telegram.sendMessage(chatId, '❌ 只有超級管理員可以使用此命令。');
        return;
      }
      const { handleMaintenanceEnable } = await import('./telegram/handlers/maintenance');
      await handleMaintenanceEnable(message, env);
      return;
    }

    if (text === '/maintenance_disable') {
      const { isSuperAdmin } = await import('./telegram/handlers/admin_ban');
      if (!isSuperAdmin(telegramId)) {
        await telegram.sendMessage(chatId, '❌ 只有超級管理員可以使用此命令。');
        return;
      }
      const { handleMaintenanceDisable } = await import('./telegram/handlers/maintenance');
      await handleMaintenanceDisable(message, env);
      return;
    }

    if (text === '/maintenance_status') {
      const adminBanModule = await import('./telegram/handlers/admin_ban');
      if (!adminBanModule.isAdmin(telegramId, env)) {
        await telegram.sendMessage(chatId, '❌ 只有管理員可以使用此命令。');
        return;
      }
      const { handleMaintenanceStatus } = await import('./telegram/handlers/maintenance');
      await handleMaintenanceStatus(message, env);
      return;
    }

    // Analytics commands (Super Admin only)
    if (text === '/analytics') {
      const { isSuperAdmin } = await import('./telegram/handlers/admin_ban');
      if (!isSuperAdmin(telegramId)) {
        await telegram.sendMessage(chatId, '❌ 只有超級管理員可以使用此命令。');
        return;
      }
      const { handleAnalytics } = await import('./telegram/handlers/admin_analytics');
      await handleAnalytics(message, env);
      return;
    }

    if (text === '/ad_performance') {
      const { isSuperAdmin } = await import('./telegram/handlers/admin_ban');
      if (!isSuperAdmin(telegramId)) {
        await telegram.sendMessage(chatId, '❌ 只有超級管理員可以使用此命令。');
        return;
      }
      const { handleAdPerformance } = await import('./telegram/handlers/admin_analytics');
      await handleAdPerformance(message, env);
      return;
    }

    if (text === '/funnel') {
      const { isSuperAdmin } = await import('./telegram/handlers/admin_ban');
      if (!isSuperAdmin(telegramId)) {
        await telegram.sendMessage(chatId, '❌ 只有超級管理員可以使用此命令。');
        return;
      }
      const { handleVIPFunnel } = await import('./telegram/handlers/admin_analytics');
      await handleVIPFunnel(message, env);
      return;
    }

    // Test daily reports command (Super Admin only)
    if (text === '/test_daily_reports') {
      const { isSuperAdmin } = await import('./telegram/handlers/admin_ban');
      if (!isSuperAdmin(telegramId)) {
        await telegram.sendMessage(chatId, '❌ 只有超級管理員可以使用此命令。');
        return;
      }
      const { handleTestDailyReports } = await import('./telegram/handlers/admin_analytics');
      await handleTestDailyReports(message, env);
      return;
    }

    // Broadcast process command (Admin only) - Manual trigger
    if (text === '/broadcast_process') {
      const adminBanModule = await import('./telegram/handlers/admin_ban');
      if (!adminBanModule.isAdmin(telegramId, env)) {
        await telegram.sendMessage(chatId, '❌ 只有管理員可以使用此命令。');
        return;
      }
      const { handleBroadcastProcess } = await import('./telegram/handlers/broadcast');
      await handleBroadcastProcess(message, env);
      return;
    }

    // Broadcast cancel command (Admin only)
    if (text.startsWith('/broadcast_cancel ')) {
      const adminBanModule = await import('./telegram/handlers/admin_ban');
      if (!adminBanModule.isAdmin(telegramId, env)) {
        await telegram.sendMessage(chatId, '❌ 只有管理員可以使用此命令。');
        return;
      }
      const { handleBroadcastCancel } = await import('./telegram/handlers/broadcast');
      await handleBroadcastCancel(message, env);
      return;
    }

    // Broadcast cleanup command (Admin only)
    if (text.startsWith('/broadcast_cleanup')) {
      const adminBanModule = await import('./telegram/handlers/admin_ban');
      if (!adminBanModule.isAdmin(telegramId, env)) {
        await telegram.sendMessage(chatId, '❌ 只有管理員可以使用此命令。');
        return;
      }
      const { handleBroadcastCleanup } = await import('./telegram/handlers/broadcast');
      await handleBroadcastCleanup(message, env);
      return;
    }

    // Broadcast status command (Admin only)
    if (text.startsWith('/broadcast_status')) {
      console.error('[Router] /broadcast_status command received');
      const adminBanModule = await import('./telegram/handlers/admin_ban');
      const isUserAdmin = adminBanModule.isAdmin(telegramId, env);
      console.error('[Router] isAdmin check result:', isUserAdmin);

      if (!isUserAdmin) {
        console.error('[Router] User is not admin, sending error message');
        await telegram.sendMessage(chatId, '❌ 只有管理員可以使用此命令。');
        return;
      }

      console.error('[Router] User is admin, calling handleBroadcastStatus');
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

    // Unknown command for completed users - provide smart suggestions
    const lowerText = text.toLowerCase();
    
    // Check if user is trying to throw a bottle
    if (lowerText.includes('丟') || lowerText.includes('瓶子') || lowerText.includes('漂流瓶')) {
      await telegram.sendMessage(
        chatId,
        '💡 **想要丟出漂流瓶？**\n\n' +
          '請先使用 `/throw` 命令啟動丟瓶子流程，\n' +
          '然後再長按該訊息，選單中選擇「回覆」後，\n' +
          '輸入您的漂流瓶內容。\n\n' +
          '或者點擊下方按鈕啟動丟瓶子流程：',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🌊 丟出漂流瓶', callback_data: 'throw' }],
              [{ text: '🎣 撿起漂流瓶', callback_data: 'catch' }],
              [{ text: '🏠 主選單', callback_data: 'return_to_menu' }],
            ],
          },
        }
      );
      return;
    }
    
    // Check if user is trying to catch a bottle
    if (lowerText.includes('撿') || lowerText.includes('看') || lowerText.includes('catch')) {
      await telegram.sendMessage(
        chatId,
        '💡 **想要撿起漂流瓶？**\n\n' +
          '請使用 `/catch` 命令來撿起別人的漂流瓶。\n\n' +
          '或者點擊下方按鈕：',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎣 撿起漂流瓶', callback_data: 'catch' }],
              [{ text: '🌊 丟出漂流瓶', callback_data: 'throw' }],
              [{ text: '🏠 主選單', callback_data: 'return_to_menu' }],
            ],
          },
        }
      );
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
      await telegram.sendMessage(
        chatId,
        '❓ 要丟漂流瓶？\n\n' +
          '請長按上一則訊息，或本訊息，\n' +
          '選單上選擇「回覆」後，\n' +
          '輸入要發送的漂流瓶內容\n\n' +
          '💡 **常用命令**：\n' +
          '• /throw - 丟出漂流瓶\n' +
          '• /catch - 撿起漂流瓶\n' +
          '• /menu - 主選單\n' +
          '• /tasks - 任務中心\n\n' +
          '#THROW'
      );
      return;
    }
    
    // Default unknown command
    await telegram.sendMessage(
      chatId,
      '❓ 未知命令\n\n' +
        '請使用 /help 查看可用命令列表。\n\n' +
        '💡 **常用命令**：\n' +
        '• /throw - 丟出漂流瓶\n' +
        '• /catch - 撿起漂流瓶\n' +
        '• /menu - 主選單\n' +
        '• /tasks - 任務中心'
    );
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
    });

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

      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 未知的性別選項');
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
    if (data === 'verify_channel_join') {
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

    // VIP purchase callback
    if (data === 'vip_purchase') {
      const { handleVipPurchase } = await import('./telegram/handlers/vip');
      await handleVipPurchase(callbackQuery, env);
      return;
    }

    // VIP cancel callback
    if (data === 'vip_cancel') {
      await telegram.answerCallbackQuery(callbackQuery.id, '已取消');
      await telegram.sendMessage(
        callbackQuery.message!.chat.id,
        '✅ 已取消購買\n\n你可以隨時使用 /vip 命令查看 VIP 權益。'
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
      await telegram.answerCallbackQuery(callbackQuery.id, '正在處理續費...');
      return;
    }

    // VIP cancel reminder callback
    if (data === 'vip_cancel_reminder') {
      await telegram.answerCallbackQuery(callbackQuery.id, '已取消提醒');
      await telegram.sendMessage(
        callbackQuery.message!.chat.id,
        '✅ 已取消提醒\n\n你可以隨時使用 /vip 命令續費。'
      );
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
