/**
 * VIP Handler
 * 
 * Handles /vip command - VIP subscription via Telegram Stars.
 */

import type { Env, TelegramMessage, PreCheckoutQuery, SuccessfulPayment } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { createI18n } from '~/i18n';

// VIP pricing (Telegram Stars)
const VIP_PRICE_STARS = 150; // ~5 USD
const VIP_DURATION_DAYS = 30;

export async function handleVip(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      await telegram.sendMessage(chatId, '❌ 用戶不存在，請先使用 /start 註冊。');
      return;
    }

    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Check if user completed onboarding
    if (user.onboarding_step !== 'completed') {
      await telegram.sendMessage(
        chatId,
        '❌ 請先完成註冊流程。\n\n使用 /start 繼續註冊。'
      );
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
          `💡 想要續訂或升級嗎？`,
        [
          [{ text: '🔄 續訂 VIP (150 ⭐)', callback_data: 'vip_renew' }],
          [{ text: '❌ 取消', callback_data: 'vip_cancel' }],
        ]
      );
    } else {
      await telegram.sendMessageWithButtons(
        chatId,
        `💎 **升級 VIP 會員**\n\n` +
          `價格：150 ⭐ Telegram Stars / 月\n` +
          `（約 5 USD）\n\n` +
          `🎁 VIP 權益：\n` +
          `• 每天 30 個漂流瓶配額（vs 免費 3 個）\n` +
          `• 可篩選 MBTI 和星座類型\n` +
          `• 34 種語言自動翻譯\n` +
          `  - 優先使用 OpenAI GPT-4o-mini（高品質）\n` +
          `  - 失敗時自動降級到 Google Translate\n` +
          `• 無廣告體驗\n` +
          `• 邀請獎勵最高可達 100 個/天\n\n` +
          `💡 使用 Telegram Stars 安全便捷支付`,
        [
          [{ text: '💳 購買 VIP (150 ⭐)', callback_data: 'vip_purchase' }],
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
export async function handleVipPurchase(
  callbackQuery: any,
  env: Env
): Promise<void> {
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
export async function handleVipRenew(
  callbackQuery: any,
  env: Env
): Promise<void> {
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
export async function handleVipCancel(
  callbackQuery: any,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;

  await telegram.answerCallbackQuery(callbackQuery.id, '已取消');
  await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);
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
  const title = isRenewal ? 'XunNi VIP 續訂' : 'XunNi VIP 訂閱';
  const description = 
    `升級 VIP 會員，享受以下權益：\n` +
    `• 每天 30 個漂流瓶配額\n` +
    `• 可篩選 MBTI 和星座\n` +
    `• 34 種語言自動翻譯\n` +
    `• 無廣告體驗`;

  // Create invoice
  const invoice = {
    chat_id: chatId,
    title,
    description,
    payload: JSON.stringify({
      user_id: telegramId,
      type: 'vip_subscription',
      duration_days: VIP_DURATION_DAYS,
      is_renewal: isRenewal,
    }),
    currency: 'XTR', // Telegram Stars
    prices: [
      {
        label: 'VIP 會員 (30 天)',
        amount: VIP_PRICE_STARS,
      },
    ],
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
      await telegram.answerPreCheckoutQuery(
        preCheckoutQuery.id,
        false,
        '❌ 無效的支付類型'
      );
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
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // Parse payload
    const payload = JSON.parse(payment.invoice_payload);
    
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      await telegram.sendMessage(chatId, '❌ 用戶不存在');
      return;
    }

    // Calculate VIP expiration
    const now = new Date();
    const currentExpire = user.vip_expire_at && new Date(user.vip_expire_at) > now
      ? new Date(user.vip_expire_at)
      : now;
    const newExpire = new Date(currentExpire.getTime() + payload.duration_days * 24 * 60 * 60 * 1000);

    // Update user VIP status
    await db.d1.prepare(`
      UPDATE users
      SET is_vip = 1,
          vip_expire_at = ?
      WHERE telegram_id = ?
    `).bind(newExpire.toISOString(), telegramId).run();

    // Create payment record
    await db.d1.prepare(`
      INSERT INTO payments (
        user_id,
        telegram_payment_id,
        amount_stars,
        currency,
        status,
        payload,
        created_at
      ) VALUES (?, ?, ?, ?, 'completed', ?, datetime('now'))
    `).bind(
      telegramId,
      payment.telegram_payment_charge_id,
      VIP_PRICE_STARS,
      'XTR',
      payment.invoice_payload
    ).run();

    // Send confirmation
    await telegram.sendMessage(
      chatId,
      `🎉 **支付成功！**\n\n` +
        `你已成為 VIP 會員！\n` +
        `到期時間：${newExpire.toLocaleDateString('zh-TW')}\n\n` +
        `✨ VIP 權益已啟用：\n` +
        `• 每天 30 個漂流瓶配額\n` +
        `• 可篩選 MBTI 和星座\n` +
        `• 34 種語言自動翻譯\n` +
        `• 無廣告體驗\n\n` +
        `💡 立即開始使用：/throw`
    );
  } catch (error) {
    console.error('[handleSuccessfulPayment] Error:', error);
    await telegram.sendMessage(
      chatId,
      '❌ 處理支付時發生錯誤，請聯繫客服。\n\n' +
        `支付 ID：${payment.telegram_payment_charge_id}`
    );
  }
}
