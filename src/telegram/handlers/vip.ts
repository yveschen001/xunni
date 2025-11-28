/**
 * VIP Handler
 *
 * Handles /vip command - VIP subscription via Telegram Stars.
 */

import type { Env, TelegramMessage, PreCheckoutQuery, SuccessfulPayment } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { handleMenu } from './menu';
import { notifySuperAdmin } from '~/services/admin_notification';
import { createOrUpdateSubscription } from '~/services/vip_subscription';
import { createI18n } from '~/i18n';

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
      const i18n = createI18n('zh-TW');
      await telegram.sendMessage(chatId, i18n.t('errors.userNotFoundRegister'));
      return;
    }

    const i18n = createI18n(user.language_pref || 'zh-TW');
    const priceStars = resolveVipPrice(env);
    const priceNote =
      priceStars === DEFAULT_VIP_PRICE_STARS ? i18n.t('vip.short') : i18n.t('vip.text28');

    // Check if user completed onboarding
    if (user.onboarding_step !== 'completed') {
      await telegram.sendMessage(chatId, i18n.t('warnings.register2'));
      return;
    }

    // Check current VIP status
    const isVip = user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > new Date();

    if (isVip) {
      const expireDate = new Date(user.vip_expire_at!).toLocaleDateString(user.language_pref || 'zh-TW');
      await telegram.sendMessageWithButtons(
        chatId,
        i18n.t('vip.vip9') +
          '\n\n' +
          i18n.t('vip.text11', { expireDate }) +
          '\n\n' +
          i18n.t('vip.vip22') +
          '\n' +
          i18n.t('vip.bottle6') +
          '\n' +
          i18n.t('vip.text14') +
          '\n' +
          i18n.t('vip.text23') +
          '\n' +
          i18n.t('vip.quota2') +
          '\n' +
          i18n.t('vip.mbti') +
          '\n' +
          i18n.t('vip.text2') +
          '\n' +
          i18n.t('vip.text26') +
          '\n\n' +
          i18n.t('vip.text20') +
          '\n\n' +
          i18n.t('common.backToMainMenu'),
        [
          [{ text: i18n.t('vip.vip4', { priceStars }), callback_data: 'vip_renew' }],
          [{ text: i18n.t('buttons.viewPayments'), callback_data: 'payments_page_1' }],
          [{ text: i18n.t('common.back3'), callback_data: 'return_to_menu' }],
        ]
      );
    } else {
      await telegram.sendMessageWithButtons(
        chatId,
        i18n.t('vip.vip10') +
          '\n\n' +
          i18n.t('vip.message8', { priceStars }) +
          '\n' +
          priceNote +
          '\n\n' +
          i18n.t('vip.vip22') +
          '\n' +
          i18n.t('vip.bottle6') +
          '\n' +
          i18n.t('vip.text14') +
          '\n' +
          i18n.t('vip.text23') +
          '\n' +
          i18n.t('vip.quota') +
          '\n' +
          i18n.t('vip.mbti') +
          '\n' +
          i18n.t('vip.text26') +
          '\n' +
          i18n.t('vip.text') +
          '\n\n' +
          i18n.t('vip.message13') +
          '\n\n' +
          i18n.t('common.backToMainMenu'),
        [
          [{ text: i18n.t('vip.vip5', { priceStars }), callback_data: 'vip_purchase' }],
          [{ text: i18n.t('buttons.viewPayments'), callback_data: 'payments_page_1' }],
          [{ text: i18n.t('common.back3'), callback_data: 'return_to_menu' }],
        ]
      );
    }
  } catch (error) {
    console.error('[handleVip] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.sendMessage(chatId, errorI18n.t('errors.systemErrorRetry'));
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
    const db = createDatabaseClient(env.DB);
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('success.text24'));

    // Delete menu
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Send invoice
    await sendVipInvoice(telegram, chatId, telegramId, false, env, i18n);
  } catch (error) {
    console.error('[handleVipPurchase] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short4'));
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
    const db = createDatabaseClient(env.DB);
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('success.text24'));

    // Delete menu
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Send invoice
    await sendVipInvoice(telegram, chatId, telegramId, true, env, i18n);
  } catch (error) {
    console.error('[handleVipRenew] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short4'));
  }
}

/**
 * Handle VIP cancel callback
 */
export async function handleVipCancel(callbackQuery: any, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  const db = createDatabaseClient(env.DB);
  const user = await findUserByTelegramId(db, telegramId);
  const i18n = createI18n(user?.language_pref || 'zh-TW');

  await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.error.cancel9'));
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
  env: Env,
  i18n: ReturnType<typeof createI18n>
): Promise<void> {
  const priceStars = resolveVipPrice(env);

  // Check if subscription is enabled (requires BotFather setup)
  const enableSubscription = env.ENABLE_VIP_SUBSCRIPTION === 'true';

  const title = enableSubscription
    ? i18n.t('vip.vip17')
    : isRenewal
      ? i18n.t('vip.vip23')
      : i18n.t('vip.vip24');

  const description = enableSubscription
    ? i18n.t('vip.vip6') +
      '\n\n' +
      i18n.t('vip.text23') +
      '\n' +
      i18n.t('vip.quota2') +
      '\n' +
      i18n.t('vip.mbti2') +
      '\n' +
      i18n.t('vip.text2') +
      '\n\n' +
      i18n.t('vip.settings3')
    : i18n.t('vip.vip12') +
      '\n' +
      i18n.t('vip.text23') +
      '\n' +
      i18n.t('vip.quota2') +
      '\n' +
      i18n.t('vip.mbti2') +
      '\n' +
      i18n.t('vip.text2');

  // Create invoice
  const invoice: any = {
    chat_id: chatId,
    title,
    description,
    payload: JSON.stringify({
      user_id: telegramId,
      type: 'vip_subscription',
      duration_days: VIP_DURATION_DAYS,
      is_renewal: isRenewal,
      is_subscription: enableSubscription,
    }),
    provider_token: '', // Empty for Telegram Stars
    currency: 'XTR', // Telegram Stars
    prices: [
      {
        label: enableSubscription ? i18n.t('vip.vip25') : i18n.t('vip.vip21'),
        amount: priceStars,
      },
    ],
  };

  // Add subscription_period only if enabled
  if (enableSubscription) {
    const SUBSCRIPTION_PERIOD_30_DAYS = 30 * 24 * 60 * 60;
    invoice.subscription_period = SUBSCRIPTION_PERIOD_30_DAYS;
  }

  // Send invoice via Telegram API
  console.error('[sendVipInvoice] Sending invoice:', JSON.stringify(invoice, null, 2));

  const response = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendInvoice`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice),
    }
  );

  const result = await response.json();
  console.error('[sendVipInvoice] Telegram API response:', JSON.stringify(result, null, 2));

  if (!response.ok) {
    throw new Error(`Failed to send invoice: ${JSON.stringify(result)}`);
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
      const errorI18n = createI18n('zh-TW');
      await telegram.answerPreCheckoutQuery(preCheckoutQuery.id, false, errorI18n.t('errors.error.short6'));
      return;
    }

    // Answer pre-checkout (approve)
    await telegram.answerPreCheckoutQuery(preCheckoutQuery.id, true);
  } catch (error) {
    console.error('[handlePreCheckout] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerPreCheckoutQuery(
      preCheckoutQuery.id,
      false,
      errorI18n.t('warnings.failed')
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
      const errorI18n = createI18n('zh-TW');
      await telegram.sendMessage(chatId, errorI18n.t('errors.userNotFound4'));
      return;
    }

    const i18n = createI18n(user.language_pref || 'zh-TW');

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

    // Create payment record
    await db.d1
      .prepare(
        `
      INSERT INTO payments (
        telegram_id,
        telegram_payment_id,
        amount_stars,
        currency,
        status
      ) VALUES (?, ?, ?, ?, 'completed')
    `
      )
      .bind(telegramId, payment.telegram_payment_charge_id, priceStars, 'XTR')
      .run();

    // Create or update subscription record
    await createOrUpdateSubscription(db, telegramId, newExpire, payment.telegram_payment_charge_id);

    // Send confirmation message
    const confirmMessage = isRecurring
      ? i18n.t('vip.success2') +
        '\n\n' +
        i18n.t('vip.vip15') +
        '\n' +
        i18n.t('vip.message3', { expireDate: newExpire.toLocaleDateString(user.language_pref || 'zh-TW') }) +
        '\n\n' +
        i18n.t('vip.vip18') +
        '\n' +
        i18n.t('vip.text23') +
        '\n' +
        i18n.t('vip.quota2') +
        '\n' +
        i18n.t('vip.mbti3') +
        '\n' +
        i18n.t('vip.text26') +
        '\n\n' +
        i18n.t('vip.settings2')
      : i18n.t('vip.success4') +
        '\n\n' +
        i18n.t('vip.vip19') +
        '\n' +
        i18n.t('vip.message4', { expireDate: newExpire.toLocaleDateString(user.language_pref || 'zh-TW') }) +
        '\n\n' +
        i18n.t('vip.vip20') +
        '\n' +
        i18n.t('vip.text23') +
        '\n' +
        i18n.t('vip.quota2') +
        '\n' +
        i18n.t('vip.mbti3') +
        '\n' +
        i18n.t('vip.text26') +
        '\n\n' +
        i18n.t('vip.text4') +
        '\n' +
        i18n.t('vip.settings2') +
        '\n\n' +
        i18n.t('vip.start');

    await telegram.sendMessage(chatId, confirmMessage);

    // Refresh conversation history posts to show clear avatars
    if (!isRenewal) {
      // Only refresh on first purchase, not on renewals
      console.error(
        '[handleSuccessfulPayment] Refreshing conversation history for new VIP:',
        telegramId
      );
      const { refreshConversationHistoryInBackground } = await import(
        '~/services/refresh_conversation_history'
      );
      refreshConversationHistoryInBackground(db, env, telegramId);

      // Notify user that history is being refreshed
      await telegram.sendMessage(
        chatId,
        i18n.t('vip.conversation2') + '\n\n' + i18n.t('vip.text24')
      );
    }

    // Notify super admin
    const notificationType = isRecurring
      ? 'vip_auto_renewed'
      : isRenewal
        ? 'vip_renewed'
        : 'vip_purchased';
    await notifySuperAdmin(env, notificationType as any, {
      user_id: telegramId,
      amount_stars: priceStars,
      expire_date: newExpire.toISOString(),
      is_recurring: isRecurring,
    });
  } catch (error) {
    console.error('[handleSuccessfulPayment] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.sendMessage(
      chatId,
      errorI18n.t('errors.error.text17') +
        '\n\n' +
        errorI18n.t('vip.message7', { payment: { telegram_payment_charge_id: payment.telegram_payment_charge_id } })
    );
  }
}
