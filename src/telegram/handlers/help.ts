/**
 * Help Handler
 *
 * Handles /help and /rules commands.
 */

import type { Env, TelegramMessage } from '~/types';
import { createTelegramService } from '~/services/telegram';

export async function handleHelp(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // Get user and i18n
    const { createDatabaseClient } = await import('~/db/client');
    const { findUserByTelegramId } = await import('~/db/queries/users');
    const db = createDatabaseClient(env.DB);
    const user = await findUserByTelegramId(db, telegramId);
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    // Check user role using new admin system
    const { getAdminIds, isSuperAdmin } = await import('./admin_ban');
    const adminIds = getAdminIds(env);
    const isUserSuperAdmin = isSuperAdmin(telegramId);
    const isUserAdmin = adminIds.includes(telegramId);

    // Base commands for all users
    let helpMessage =
      i18n.t('help.text10') +
      `━━━━━━━━━━━━━━━━\n` +
      i18n.t('help.text24') +
      i18n.t('help.register') +
      i18n.t('help.text25') +
      i18n.t('help.bottle7') +
      i18n.t('help.bottle8') +
      i18n.t('help.conversation') +
      i18n.t('help.profile3') +
      i18n.t('help.profile2') +
      i18n.t('help.text5') +
      i18n.t('help.profile') +
      i18n.t('help.text2') +
      i18n.t('help.mbti2') +
      i18n.t('help.stats') +
      i18n.t('help.vip4') +
      i18n.t('help.text16') +
      i18n.t('help.bottle2') +
      i18n.t('help.invite2') +
      i18n.t('help.vip5') +
      i18n.t('help.ad3') +
      i18n.t('help.ad4') +
      i18n.t('help.appeal5') +
      i18n.t('help.text18') +
      i18n.t('help.report') +
      i18n.t('help.ban5') +
      i18n.t('help.appeal3') +
      i18n.t('help.settings2') +
      i18n.t('help.text19') +
      i18n.t('help.text17') +
      i18n.t('help.settings');

    // Add admin commands (for both regular admin and super admin)
    if (isUserAdmin) {
      helpMessage +=
        `\n\n━━━━━━━━━━━━━━━━\n` +
        i18n.t('help.admin5') +
        i18n.t('help.text31') +
        i18n.t('help.ban') +
        i18n.t('help.ban3') +
        i18n.t('help.ban4') +
        i18n.t('help.ban2') +
        i18n.t('help.appeal6') +
        i18n.t('help.appeal4') +
        i18n.t('help.appeal2') +
        i18n.t('help.appeal') +
        i18n.t('help.broadcast5') +
        i18n.t('help.broadcast4') +
        i18n.t('help.broadcast') +
        i18n.t('help.broadcast2') +
        i18n.t('help.broadcast3') +
        i18n.t('help.cancel') +
        i18n.t('help.text32') +
        i18n.t('help.text') +
        i18n.t('help.admin_ads') +
        i18n.t('help.admin_tasks');
    }

    // Add super admin commands (only for super admin)
    if (isUserSuperAdmin) {
      helpMessage +=
        `\n\n━━━━━━━━━━━━━━━━\n` +
        i18n.t('help.admin4') +
        i18n.t('help.admin6') +
        i18n.t('help.admin3') +
        i18n.t('help.admin2') +
        i18n.t('help.admin') +
        i18n.t('help.broadcast6') +
        i18n.t('help.message8') +
        i18n.t('help.message5') +
        i18n.t('help.message2') +
        i18n.t('help.message4') +
        i18n.t('help.text3') +
        i18n.t('help.text7') +
        i18n.t('help.message3') +
        i18n.t('help.vip') +
        i18n.t('help.birthday') +
        i18n.t('help.text33') +
        i18n.t('help.text11') +
        i18n.t('help.ad2') +
        i18n.t('help.vip3') +
        i18n.t('help.text32') +
        i18n.t('help.text') +
        i18n.t('help.message') +
        i18n.t('help.message6') +
        i18n.t('help.text34') +
        i18n.t('help.text15') +
        i18n.t('help.text6') +
        i18n.t('help.text12');
    }

    await telegram.sendMessage(chatId, helpMessage);
  } catch (error) {
    console.error('[handleHelp] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.sendMessage(chatId, errorI18n.t('errors.systemErrorRetry'));
  }
}

export async function handleRules(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // Get user and i18n
    const { createDatabaseClient } = await import('~/db/client');
    const { findUserByTelegramId } = await import('~/db/queries/users');
    const db = createDatabaseClient(env.DB);
    const user = await findUserByTelegramId(db, telegramId);
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    const rulesMessage =
      i18n.t('help.text13') +
      i18n.t('help.bottle9') +
      i18n.t('help.bottle3') +
      i18n.t('help.bottle6') +
      i18n.t('help.bottle4') +
      i18n.t('help.quota') +
      i18n.t('help.bottle5') +
      i18n.t('help.text26') +
      i18n.t('help.conversation2') +
      i18n.t('help.text14') +
      i18n.t('help.text22') +
      i18n.t('help.text20') +
      i18n.t('help.text21') +
      i18n.t('help.vip2') +
      i18n.t('help.bottle') +
      i18n.t('help.invite') +
      i18n.t('help.ad') +
      i18n.t('help.ad5') +
      i18n.t('help.text9') +
      i18n.t('help.text23') +
      i18n.t('help.text28') +
      i18n.t('help.text27') +
      i18n.t('help.text30') +
      i18n.t('help.ban6') +
      i18n.t('help.vip6') +
      i18n.t('help.throw') +
      i18n.t('help.success') +
      i18n.t('help.text29') +
      i18n.t('help.quota2') +
      i18n.t('help.mbti') +
      i18n.t('help.text4') +
      i18n.t('help.ad6') +
      `━━━━━━━━━━━━━━━━\n` +
      i18n.t('help.text8');

    await telegram.sendMessage(chatId, rulesMessage);
  } catch (error) {
    console.error('[handleRules] Error:', error);
    const { createI18n } = await import('~/i18n');
    const errorI18n = createI18n('zh-TW');
    await telegram.sendMessage(chatId, errorI18n.t('errors.systemErrorRetry'));
  }
}
