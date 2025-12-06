/**
 * Gift Handler
 *
 * Handles gifting flow (VIP, Fortune Bottle).
 */

import type { Env, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { createI18n } from '~/i18n';
import { formatNicknameWithFlag } from '~/utils/country_flag';
import { maskNickname } from '~/utils/nickname';
import { DEFAULT_VIP_PRICE_STARS } from './vip';

// Constants for Fortune Bottle Prices
const FORTUNE_PACK_SMALL_STARS = 100;
const FORTUNE_PACK_LARGE_STARS = 385;
const FORTUNE_PACK_SMALL_AMOUNT = 10;
const FORTUNE_PACK_LARGE_AMOUNT = 50;

/**
 * Handle Gift VIP selection
 */
export async function handleGiftVip(
  callbackQuery: any,
  targetId: string,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = callbackQuery.message.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    const user = await findUserByTelegramId(db, telegramId);
    const targetUser = await findUserByTelegramId(db, targetId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    if (!targetUser) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.userNotFound'));
      return;
    }

    const targetName = formatNicknameWithFlag(
      maskNickname(targetUser.nickname || targetUser.username || i18n.t('profile.anonymousUser')),
      targetUser.country_code
    );

    // Show VIP packages for gifting
    const prices = [
      { label: `1 ${i18n.t('vip.month')}`, amount: DEFAULT_VIP_PRICE_STARS, payload: `gift_vip_1m_${targetId}` },
      { label: `3 ${i18n.t('vip.months')}`, amount: DEFAULT_VIP_PRICE_STARS * 3, payload: `gift_vip_3m_${targetId}` },
      { label: `12 ${i18n.t('vip.months')}`, amount: DEFAULT_VIP_PRICE_STARS * 10, payload: `gift_vip_12m_${targetId}` }, // 12 months for price of 10
    ];

    await telegram.sendInvoice(
      chatId,
      i18n.t('gift.vipTitle', { name: targetName }),
      i18n.t('gift.vipDescription', { name: targetName }),
      prices[0].payload, // Default payload (handled by pre_checkout_query)
      env.TELEGRAM_PAYMENT_PROVIDER_TOKEN || '', // Empty for Stars
      'XTR',
      prices.map(p => ({ label: p.label, amount: p.amount }))
    );

    await telegram.answerCallbackQuery(callbackQuery.id);
  } catch (error) {
    console.error('[handleGiftVip] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ Error');
  }
}

/**
 * Handle Gift Fortune Bottle selection
 */
export async function handleGiftBottle(
  callbackQuery: any,
  targetId: string,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = callbackQuery.message.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    const user = await findUserByTelegramId(db, telegramId);
    const targetUser = await findUserByTelegramId(db, targetId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    if (!targetUser) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.userNotFound'));
      return;
    }

    const targetName = formatNicknameWithFlag(
      maskNickname(targetUser.nickname || targetUser.username || i18n.t('profile.anonymousUser')),
      targetUser.country_code
    );

    // Show Bottle packages for gifting
    // Using simple buttons for now as invoice only supports one price? 
    // Actually sendInvoice takes `prices` array which sums up.
    // For selection, we usually show buttons first, then invoice.
    
    const buttons = [
      [
        { 
          text: `${FORTUNE_PACK_SMALL_AMOUNT} ${i18n.t('common.fortuneBottle')} (${FORTUNE_PACK_SMALL_STARS} Stars)`, 
          callback_data: `invoice_gift_bottle_small_${targetId}` 
        }
      ],
      [
        { 
          text: `${FORTUNE_PACK_LARGE_AMOUNT} ${i18n.t('common.fortuneBottle')} (${FORTUNE_PACK_LARGE_STARS} Stars)`, 
          callback_data: `invoice_gift_bottle_large_${targetId}` 
        }
      ],
      [{ text: i18n.t('common.cancel'), callback_data: `conv_profile_card_${targetId}` }] // Back to profile card (logic needs to handle this callback)
    ];

    await telegram.sendMessageWithButtons(
      chatId,
      i18n.t('gift.bottleSelectTitle', { name: targetName }),
      buttons
    );

    await telegram.answerCallbackQuery(callbackQuery.id);
  } catch (error) {
    console.error('[handleGiftBottle] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ Error');
  }
}

/**
 * Handle Invoice Creation for Gift Bottle
 */
export async function handleInvoiceGiftBottle(
  callbackQuery: any,
  packType: 'small' | 'large',
  targetId: string,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = callbackQuery.message.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    const user = await findUserByTelegramId(db, telegramId);
    const targetUser = await findUserByTelegramId(db, targetId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    if (!targetUser) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.userNotFound'));
      return;
    }

    const targetName = formatNicknameWithFlag(
      maskNickname(targetUser.nickname || targetUser.username || i18n.t('profile.anonymousUser')),
      targetUser.country_code
    );

    const amount = packType === 'small' ? FORTUNE_PACK_SMALL_STARS : FORTUNE_PACK_LARGE_STARS;
    const count = packType === 'small' ? FORTUNE_PACK_SMALL_AMOUNT : FORTUNE_PACK_LARGE_AMOUNT;
    const payload = `gift_bottle_${packType}_${targetId}`;

    await telegram.sendInvoice(
      chatId,
      i18n.t('gift.bottleTitle', { count, name: targetName }),
      i18n.t('gift.bottleDescription', { count, name: targetName }),
      payload,
      env.TELEGRAM_PAYMENT_PROVIDER_TOKEN || '',
      'XTR',
      [{ label: `${count} ${i18n.t('common.fortuneBottle')}`, amount }]
    );

    await telegram.answerCallbackQuery(callbackQuery.id);
  } catch (error) {
    console.error('[handleInvoiceGiftBottle] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ Error');
  }
}

