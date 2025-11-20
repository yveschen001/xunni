/**
 * VIP Handler
 *
 * Handles /vip command - VIP subscription via Telegram Stars.
 */

import type { Env, TelegramMessage, PreCheckoutQuery, SuccessfulPayment, CallbackQuery } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { handleMenu } from './menu';
import { notifySuperAdmin } from '~/services/admin_notification';
import { createOrUpdateSubscription } from '~/services/vip_subscription';

// VIP pricing (Telegram Stars)
const DEFAULT_VIP_PRICE_STARS = 150; // ~5 USD
const VIP_DURATION_DAYS = 30;

function resolveVipPrice(env: Env): number {
  const value = Number(env.VIP_PRICE_STARS ?? DEFAULT_VIP_PRICE_STARS);
  if (Number.isFinite(value) && value > 0) {
    return value;
  }
  return DEFAULT_VIP_PRICE_STARS;
}

export async function handleVip(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // ✨ NEW: Update user activity (non-blocking)
    try {
      const { updateUserActivity } = await import('~/services/user_activity');
      await updateUserActivity(db, telegramId);
    } catch (activityError) {
      console.error('[handleVip] Failed to update user activity:', activityError);
    }

    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      await telegram.sendMessage(chatId, '❌ 用戶不存在，請先使用 /start 註冊。');
      return;
    }

    const priceStars = resolveVipPrice(env);
    const priceNote =
      priceStars === DEFAULT_VIP_PRICE_STARS ? '（約 5 USD）' : '（Staging 測試價）';

    // Check if user completed onboarding
    if (user.onboarding_step !== 'completed') {
      await telegram.sendMessage(chatId, '❌ 請先完成註冊流程。\n\n使用 /start 繼續註冊。');
      return;
    }

    // Check current VIP status
    const isVip = user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > new Date();

    if (isVip) {
      const expireDate = new Date(user.vip_expire_at!).toLocaleDateString('zh-TW');
      await telegram.sendMessageWithButtons(
        chatId,
        `✨ **你已經是 VIP 會員**\n\n` +
          `到期時間：${expireDate}\n\n` +
          `🎁 VIP 權益：\n` +
          `• 每天 30 個漂流瓶配額\n` +
          `• 可篩選 MBTI 和星座\n` +
          `• 34 種語言自動翻譯（OpenAI 優先）\n` +
          `• 無廣告體驗\n\n` +
          `💡 想要續訂或升級嗎？\n\n` +
          `🏠 返回主選單：/menu`,
        [
          [{ text: `🔄 續訂 VIP (${priceStars} ⭐)`, callback_data: 'vip_renew' }],
          [{ text: '❌ 取消', callback_data: 'vip_cancel' }],
        ]
      );
    } else {
      await telegram.sendMessageWithButtons(
        chatId,
        `💎 **升級 VIP 會員**\n\n` +
          `價格：${priceStars} ⭐ Telegram Stars / 月\n` +
          `${priceNote}\n\n` +
          `🎁 VIP 權益：\n` +
          `• 每天 30 個漂流瓶配額（邀請好友可增加，最高 100 個/天）\n` +
          `• 可篩選配對對象的 MBTI 和星座類型\n` +
          `• 34 種語言自動翻譯\n` +
          `  - 優先使用 OpenAI GPT 模型翻譯（高品質）\n` +
          `• 無廣告體驗\n\n` +
          `💡 使用 Telegram Stars 安全便捷支付\n\n` +
          `🏠 返回主選單：/menu`,
        [
          [{ text: `💳 購買 VIP (${priceStars} ⭐)`, callback_data: 'vip_purchase' }],
          [{ text: '❌ 取消', callback_data: 'vip_cancel' }],
        ]
      );
    }
  } catch (error) {
    console.error('[handleVip] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤，請稍後再試。');
  }
}

/**
 * Handle VIP purchase callback
 */
export async function handleVipPurchase(callbackQuery: any, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id, '✅ 正在準備支付...');

    // Delete menu
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Send invoice
    await sendVipInvoice(telegram, chatId, telegramId, false, env);
  } catch (error) {
    console.error('[handleVipPurchase] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle VIP renew callback
 */
export async function handleVipRenew(callbackQuery: any, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id, '✅ 正在準備支付...');

    // Delete menu
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Send invoice
    await sendVipInvoice(telegram, chatId, telegramId, true, env);
  } catch (error) {
    console.error('[handleVipRenew] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle VIP cancel callback
 */
export async function handleVipCancel(callbackQuery: any, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;

  await telegram.answerCallbackQuery(callbackQuery.id, '已取消');
  await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);
  await handleMenu(callbackQuery.message as TelegramMessage, env);
}

/**
 * Send VIP invoice
 */
async function sendVipInvoice(
  telegram: ReturnType<typeof createTelegramService>,
  chatId: number,
  telegramId: string,
  isRenewal: boolean,
  env: Env
): Promise<void> {
  const priceStars = resolveVipPrice(env);
  const title = 'XunNi VIP 訂閱（月費）';
  const description =
    `訂閱 XunNi VIP 會員，每月自動續費！\n\n` +
    `• 每天 30 個漂流瓶配額（最高 100 個/天）\n` +
    `• 可篩選配對對象的 MBTI 和星座\n` +
    `• 34 種語言自動翻譯（OpenAI GPT 優先）\n` +
    `• 無廣告體驗\n\n` +
    `💡 可隨時在 Telegram 設定中取消訂閱`;

  // 30 days = 2592000 seconds
  const SUBSCRIPTION_PERIOD_30_DAYS = 30 * 24 * 60 * 60;

  // Create invoice with subscription
  const invoice = {
    chat_id: chatId,
    title,
    description,
    payload: JSON.stringify({
      user_id: telegramId,
      type: 'vip_subscription',
      duration_days: VIP_DURATION_DAYS,
      is_renewal: isRenewal,
      is_subscription: true,
    }),
    provider_token: '', // Empty for Telegram Stars
    currency: 'XTR', // Telegram Stars
    prices: [
      {
        label: 'VIP 訂閱',
        amount: priceStars,
      },
    ],
    subscription_period: SUBSCRIPTION_PERIOD_30_DAYS, // Enable auto-subscription
  };

  // Send invoice via Telegram API
  const response = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendInvoice`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to send invoice');
  }
}

/**
 * Handle pre-checkout query
 */
export async function handlePreCheckout(
  preCheckoutQuery: PreCheckoutQuery,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);

  try {
    // Parse payload
    const payload = JSON.parse(preCheckoutQuery.invoice_payload);

    // Validate payload
    if (payload.type !== 'vip_subscription') {
      await telegram.answerPreCheckoutQuery(preCheckoutQuery.id, false, '❌ 無效的支付類型');
      return;
    }

    // Answer pre-checkout (approve)
    await telegram.answerPreCheckoutQuery(preCheckoutQuery.id, true);
  } catch (error) {
    console.error('[handlePreCheckout] Error:', error);
    await telegram.answerPreCheckoutQuery(
      preCheckoutQuery.id,
      false,
      '❌ 支付驗證失敗，請稍後再試'
    );
  }
}

/**
 * Handle successful payment
 */
export async function handleSuccessfulPayment(
  message: TelegramMessage,
  payment: SuccessfulPayment,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // Parse payload
    const payload = JSON.parse(payment.invoice_payload);
    
    // Check if this is an auto-renewal (recurring payment)
    const isRecurring = (payment as any).is_recurring === true;
    
    console.error('[handleSuccessfulPayment] Payment details:', {
      isRecurring,
      isSubscription: payload.is_subscription,
      telegramId,
    });

    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      await telegram.sendMessage(chatId, '❌ 用戶不存在');
      return;
    }

    // Calculate VIP expiration
    const now = new Date();
    const currentExpire =
      user.vip_expire_at && new Date(user.vip_expire_at) > now ? new Date(user.vip_expire_at) : now;
    const newExpire = new Date(
      currentExpire.getTime() + payload.duration_days * 24 * 60 * 60 * 1000
    );

    const priceStars = resolveVipPrice(env);
    const isRenewal = user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > now;
    
    // Update user VIP status
    await db.d1
      .prepare(
        `
      UPDATE users
      SET is_vip = 1,
          vip_expire_at = ?
      WHERE telegram_id = ?
    `
      )
      .bind(newExpire.toISOString(), telegramId)
      .run();

    // Create payment record with is_recurring flag
    await db.d1
      .prepare(
        `
      INSERT INTO payments (
        user_id,
        telegram_payment_id,
        amount_stars,
        currency,
        status,
        payload,
        payment_type,
        is_recurring,
        created_at
      ) VALUES (?, ?, ?, ?, 'completed', ?, ?, ?, datetime('now'))
    `
      )
      .bind(
        telegramId,
        payment.telegram_payment_charge_id,
        priceStars,
        'XTR',
        payment.invoice_payload,
        isRecurring ? 'auto_renewal' : (isRenewal ? 'renewal' : 'initial'),
        isRecurring ? 1 : 0
      )
      .run();

    // Create or update subscription record
    await createOrUpdateSubscription(
      db,
      telegramId,
      newExpire,
      payment.telegram_payment_charge_id
    );

    // Send confirmation message
    const confirmMessage = isRecurring
      ? `🎉 **自動續費成功！**\n\n` +
        `你的 VIP 訂閱已自動續費！\n` +
        `新到期時間：${newExpire.toLocaleDateString('zh-TW')}\n\n` +
        `✨ VIP 權益持續啟用：\n` +
        `• 每天 30 個漂流瓶配額\n` +
        `• 可篩選 MBTI 和星座\n` +
        `• 34 種語言自動翻譯\n` +
        `• 無廣告體驗\n\n` +
        `💡 如需取消訂閱，請前往 Telegram 設定 > 訂閱管理`
      : `🎉 **訂閱成功！**\n\n` +
        `你已成為 VIP 會員！\n` +
        `到期時間：${newExpire.toLocaleDateString('zh-TW')}\n\n` +
        `✨ VIP 權益已啟用：\n` +
        `• 每天 30 個漂流瓶配額\n` +
        `• 可篩選 MBTI 和星座\n` +
        `• 34 種語言自動翻譯\n` +
        `• 無廣告體驗\n\n` +
        `🔄 **自動續費**：每月自動扣款，無需手動續費\n` +
        `💡 如需取消訂閱，請前往 Telegram 設定 > 訂閱管理\n\n` +
        `🚀 立即開始使用：/throw`;

    await telegram.sendMessage(chatId, confirmMessage);
    
    // Notify super admin
    const notificationType = isRecurring ? 'vip_auto_renewed' : (isRenewal ? 'vip_renewed' : 'vip_purchased');
    await notifySuperAdmin(env, notificationType as any, {
      user_id: telegramId,
      amount_stars: priceStars,
      expire_date: newExpire.toISOString(),
      is_recurring: isRecurring,
    });
  } catch (error) {
    console.error('[handleSuccessfulPayment] Error:', error);
    await telegram.sendMessage(
      chatId,
      '❌ 處理支付時發生錯誤，請聯繫客服。\n\n' + `支付 ID：${payment.telegram_payment_charge_id}`
    );
  }
}
