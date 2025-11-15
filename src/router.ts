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
import { createTelegramService } from './services/telegram';

// ============================================================================
// Webhook Handler
// ============================================================================

export async function handleWebhook(request: Request, env: Env): Promise<Response> {
  try {
    // Verify webhook secret
    const secretToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
    if (secretToken !== env.TELEGRAM_WEBHOOK_SECRET) {
      console.warn('[Router] Invalid webhook secret');
      return new Response('Unauthorized', { status: 401 });
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

  // Handle message
  if (update.message) {
    const message = update.message;
    const text = message.text || '';
    const chatId = message.chat.id;

    // Check if user is banned
    // TODO: Implement ban check

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

    // Handle onboarding input
    const isOnboardingInput = await handleOnboardingInput(message, env);
    if (isOnboardingInput) {
      return;
    }

    // Handle conversation messages
    await handleMessageForward(message, env);

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
    if (data.startsWith('gender_')) {
      // TODO: Implement gender selection handler
      await telegram.answerCallbackQuery(callbackQuery.id, '性別選擇功能開發中...');
      return;
    }

    if (data === 'agree_terms') {
      // TODO: Implement terms agreement handler
      await telegram.answerCallbackQuery(callbackQuery.id, '條款同意功能開發中...');
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
  if (update.message?.successful_payment) {
    // TODO: Implement payment success handler
    console.log('[Router] Payment received:', update.message.successful_payment);
    return;
  }

  console.log('[Router] Unhandled update type');
}

