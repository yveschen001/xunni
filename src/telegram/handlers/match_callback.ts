import type { Env, TelegramCallbackQuery } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { createI18n } from '~/i18n';
import { handleThrow } from './throw';
import { handleVip } from './vip';

/**
 * Handle VIP Target Throw from Match Push
 * Callback format: match_vip_TOPIC_TARGET (e.g., match_vip_zodiac_leo)
 */
export async function handleMatchVip(
  callbackQuery: TelegramCallbackQuery,
  topic: string,
  target: string,
  env: Env
): Promise<void> {
  const telegramId = callbackQuery.from.id.toString();
  const { createDatabaseClient } = await import('~/db/client');
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);

  const user = await findUserByTelegramId(db, telegramId);
  if (!user) return;

  const i18n = createI18n(user.language_pref || 'zh-TW');

  // Check if user is VIP
  const isVip = !!(user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > new Date());

  if (isVip) {
    // VIP: Proceed to locked throw
    // Construct options based on topic
    const options: any = {};
    if (topic === 'zodiac') options.target_zodiac = target;
    if (topic === 'mbti') options.target_mbti = target;
    if (topic === 'blood') options.target_blood = target;

    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('success.saved')); // Or some affirmation

    // Call handleThrow with options
    // We need to construct a message-like object
    const fakeMessage = {
      ...callbackQuery.message!,
      from: callbackQuery.from,
      text: '/throw',
    };

    await handleThrow(fakeMessage as any, env, options);
  } else {
    // Non-VIP: Upsell
    // Translate target for better message
    let targetDisplay = target;
    if (topic === 'zodiac') {
      const { getZodiacDisplay } = await import('~/domain/zodiac');
      targetDisplay = getZodiacDisplay(target, i18n);
    }

    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('common.vipRequired'));

    // Send Upsell Message
    await telegram.sendMessage(
      callbackQuery.message!.chat.id,
      i18n.t('match.btn.vip_upsell', { target: targetDisplay })
    );

    // Show VIP menu
    const fakeMessage = {
      ...callbackQuery.message!,
      from: callbackQuery.from,
      text: '/vip',
    };
    await handleVip(fakeMessage as any, env);
  }
}

/**
 * Handle Standard Throw from Match Push
 * Callback format: match_throw
 */
export async function handleMatchThrow(
  callbackQuery: TelegramCallbackQuery,
  env: Env
): Promise<void> {
  const { createDatabaseClient } = await import('~/db/client');
  const db = createDatabaseClient(env.DB);
  const user = await findUserByTelegramId(db, callbackQuery.from.id.toString());
  const i18n = createI18n(user?.language_pref || 'zh-TW');

  const telegram = createTelegramService(env);
  await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('common.loading'));

  // Simply call standard handleThrow
  const fakeMessage = {
    ...callbackQuery.message!,
    from: callbackQuery.from,
    text: '/throw',
  };

  await handleThrow(fakeMessage as any, env);
}
