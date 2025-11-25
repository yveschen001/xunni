/**
 * Admin Ad Configuration Handler
 *
 * Purpose:
 *   Manage ad providers and official ads
 *   - Enable/disable ad providers
 *   - View ad provider status
 *   - Enable/disable official ads
 *   - View official ads list
 */

import type { Env, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { createI18n } from '~/i18n';
import {
  getAllAdProviders,
  updateAdProviderStatus,
  updateAdProviderPriority,
} from '~/db/queries/ad_providers';
import { getAllOfficialAds, updateOfficialAdStatus } from '~/db/queries/official_ads';

// ============================================================================
// Ad Providers Management
// ============================================================================

/**
 * Handle /ad_providers command
 *
 * Show all ad providers and their status
 */
export async function handleAdProviders(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id;

  try {
    // Get all providers (including disabled)
    const providers = await getAllAdProviders(db.d1, false);

    const i18n = createI18n('zh-TW'); // Admin commands use Chinese

    if (providers.length === 0) {
      await telegram.sendMessage(
        chatId,
        i18n.t('admin.adConfig.noProviders') + '\n\n' +
          i18n.t('admin.adConfig.addProviderScript') + '\n' +
          '`scripts/init-ad-providers-test.sql`'
      );
      return;
    }

    let message_text = i18n.t('admin.adConfig.providerList') + '\n\n';

    for (const provider of providers) {
      const status = provider.is_enabled ? i18n.t('admin.adConfig.enabled') : i18n.t('admin.adConfig.disabled');
      const config = JSON.parse(provider.config);

      message_text += `**${provider.provider_display_name}**\n`;
      message_text += i18n.t('admin.adConfig.id', { id: provider.provider_name }) + '\n';
      message_text += i18n.t('admin.adConfig.status', { status }) + '\n';
      message_text += i18n.t('admin.adConfig.priority', { priority: provider.priority }) + '\n';
      message_text += i18n.t('admin.adConfig.weight', { weight: provider.weight }) + '\n';

      if (config.test_mode) {
        message_text += i18n.t('admin.adConfig.testMode') + '\n';
      }

      message_text += `\n`;
    }

    message_text += '━━━━━━━━━━━━━━━━\n';
    message_text += i18n.t('admin.adConfig.managementCommands') + '\n';
    message_text += i18n.t('admin.adConfig.enableCommand') + '\n';
    message_text += i18n.t('admin.adConfig.disableCommand') + '\n';
    message_text += i18n.t('admin.adConfig.priorityCommand');

    await telegram.sendMessage(chatId, message_text);
  } catch (error) {
    console.error('[handleAdProviders] Error:', error);
    const i18n = createI18n('zh-TW');
    await telegram.sendMessage(chatId, i18n.t('admin.adConfig.getListFailed'));
  }
}

/**
 * Handle /ad_provider_enable command
 *
 * Enable an ad provider
 */
export async function handleAdProviderEnable(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id;
  const text = message.text || '';

  try {
    const i18n = createI18n('zh-TW');
    const parts = text.split(' ');
    if (parts.length < 2) {
      await telegram.sendMessage(
        chatId,
        i18n.t('admin.adConfig.usageError') + '\n\n' + i18n.t('admin.adConfig.correctFormat') + '\n' + `/ad_provider_enable <provider_id>`
      );
      return;
    }

    const providerName = parts[1];

    // Update provider status
    await updateAdProviderStatus(db, providerName, true);

    await telegram.sendMessage(
      chatId,
      i18n.t('admin.adConfig.providerEnabled', { name: providerName }) + '\n\n' + i18n.t('admin.adConfig.viewAllProviders')
    );
  } catch (error) {
    console.error('[handleAdProviderEnable] Error:', error);
    const i18n = createI18n('zh-TW');
    await telegram.sendMessage(chatId, i18n.t('admin.adConfig.enableFailed'));
  }
}

/**
 * Handle /ad_provider_disable command
 *
 * Disable an ad provider
 */
export async function handleAdProviderDisable(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id;
  const text = message.text || '';

  try {
    const i18n = createI18n('zh-TW');
    const parts = text.split(' ');
    if (parts.length < 2) {
      await telegram.sendMessage(
        chatId,
        i18n.t('admin.adConfig.usageError') + '\n\n' + i18n.t('admin.adConfig.correctFormat') + '\n' + `/ad_provider_disable <provider_id>`
      );
      return;
    }

    const providerName = parts[1];

    // Update provider status
    await updateAdProviderStatus(db, providerName, false);

    await telegram.sendMessage(
      chatId,
      i18n.t('admin.adConfig.providerDisabled', { name: providerName }) + '\n\n' + i18n.t('admin.adConfig.viewAllProviders')
    );
  } catch (error) {
    console.error('[handleAdProviderDisable] Error:', error);
    const i18n = createI18n('zh-TW');
    await telegram.sendMessage(chatId, i18n.t('admin.adConfig.disableFailed'));
  }
}

/**
 * Handle /ad_provider_priority command
 *
 * Set ad provider priority
 */
export async function handleAdProviderPriority(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id;
  const text = message.text || '';

  try {
    const i18n = createI18n('zh-TW');
    const parts = text.split(' ');
    if (parts.length < 3) {
      await telegram.sendMessage(
        chatId,
        i18n.t('admin.adConfig.usageError') + '\n\n' +
          i18n.t('admin.adConfig.correctFormat') + '\n' +
          `/ad_provider_priority <provider_id> <priority>\n\n` +
          i18n.t('admin.adConfig.example') + '\n' +
          `/ad_provider_priority gigapub_test 100`
      );
      return;
    }

    const providerName = parts[1];
    const priority = parseInt(parts[2]);

    if (isNaN(priority) || priority < 0) {
      await telegram.sendMessage(chatId, i18n.t('admin.adConfig.priorityMustBeNonNegative'));
      return;
    }

    // Update provider priority
    await updateAdProviderPriority(db, providerName, priority);

    await telegram.sendMessage(
      chatId,
      i18n.t('admin.adConfig.prioritySet') + '\n\n' +
        i18n.t('admin.adConfig.provider', { name: providerName }) + '\n' +
        i18n.t('admin.adConfig.priorityValue', { priority }) + '\n\n' +
        i18n.t('admin.adConfig.viewAllProviders')
    );
  } catch (error) {
    console.error('[handleAdProviderPriority] Error:', error);
    const i18n = createI18n('zh-TW');
    await telegram.sendMessage(chatId, i18n.t('admin.adConfig.setPriorityFailed'));
  }
}

// ============================================================================
// Official Ads Management
// ============================================================================

/**
 * Handle /official_ads command
 *
 * Show all official ads and their status
 */
export async function handleOfficialAds(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id;

  try {
    // Get all official ads (including disabled)
    const ads = await getAllOfficialAds(db, false);

    const i18n = createI18n('zh-TW');
    if (ads.length === 0) {
      await telegram.sendMessage(
        chatId,
        i18n.t('admin.adConfig.noOfficialAds') + '\n\n' +
          i18n.t('admin.adConfig.addOfficialAdScript') + '\n' +
          '`scripts/create-official-ads.sql`'
      );
      return;
    }

    const i18n = createI18n('zh-TW');
    let message_text = i18n.t('admin.adConfig.officialAdList') + '\n\n';

    for (const ad of ads) {
      const status = ad.is_enabled ? i18n.t('admin.adConfig.enabled') : i18n.t('admin.adConfig.disabled');
      const typeEmoji =
        {
          text: '📝',
          link: '🔗',
          group: '👥',
          channel: '📢',
        }[ad.ad_type] || '📄';

      message_text += `${typeEmoji} **${ad.title}**\n`;
      message_text += i18n.t('admin.adConfig.id', { id: ad.id }) + '\n';
      message_text += i18n.t('admin.adConfig.type', { type: ad.ad_type }) + '\n';
      message_text += i18n.t('admin.adConfig.status', { status }) + '\n';
      message_text += i18n.t('admin.adConfig.reward', { reward: ad.quota_reward }) + '\n';
      message_text += i18n.t('admin.adConfig.impressions', { count: ad.impression_count }) + '\n';
      message_text += i18n.t('admin.adConfig.clicks', { count: ad.click_count }) + '\n';
      message_text += `\n`;
    }

    message_text += '━━━━━━━━━━━━━━━━\n';
    message_text += i18n.t('admin.adConfig.managementCommands') + '\n';
    message_text += i18n.t('admin.adConfig.enableOfficialAdCommand') + '\n';
    message_text += i18n.t('admin.adConfig.disableOfficialAdCommand') + '\n';
    message_text += i18n.t('admin.adConfig.viewStatsCommand');

    await telegram.sendMessage(chatId, message_text);
  } catch (error) {
    console.error('[handleOfficialAds] Error:', error);
    const i18n = createI18n('zh-TW');
    await telegram.sendMessage(chatId, i18n.t('admin.adConfig.getOfficialAdListFailed'));
  }
}

/**
 * Handle /official_ad_enable command
 *
 * Enable an official ad
 */
export async function handleOfficialAdEnable(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id;
  const text = message.text || '';

  try {
    const i18n = createI18n('zh-TW');
    const parts = text.split(' ');
    if (parts.length < 2) {
      await telegram.sendMessage(
        chatId,
        i18n.t('admin.adConfig.usageError') + '\n\n' + i18n.t('admin.adConfig.correctFormat') + '\n' + `/official_ad_enable <ad_id>`
      );
      return;
    }

    const adId = parseInt(parts[1]);
    if (isNaN(adId)) {
      await telegram.sendMessage(chatId, i18n.t('admin.adConfig.adIdMustBeNumber'));
      return;
    }

    // Update ad status
    await updateOfficialAdStatus(db, adId, true);

    await telegram.sendMessage(
      chatId,
      i18n.t('admin.adConfig.officialAdEnabled', { id: adId }) + '\n\n' + i18n.t('admin.adConfig.viewAllOfficialAds')
    );
  } catch (error) {
    console.error('[handleOfficialAdEnable] Error:', error);
    const i18n = createI18n('zh-TW');
    await telegram.sendMessage(chatId, i18n.t('admin.adConfig.enableOfficialAdFailed'));
  }
}

/**
 * Handle /official_ad_disable command
 *
 * Disable an official ad
 */
export async function handleOfficialAdDisable(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id;
  const text = message.text || '';

  try {
    const i18n = createI18n('zh-TW');
    const parts = text.split(' ');
    if (parts.length < 2) {
      await telegram.sendMessage(
        chatId,
        i18n.t('admin.adConfig.usageError') + '\n\n' + i18n.t('admin.adConfig.correctFormat') + '\n' + `/official_ad_disable <ad_id>`
      );
      return;
    }

    const adId = parseInt(parts[1]);
    if (isNaN(adId)) {
      await telegram.sendMessage(chatId, i18n.t('admin.adConfig.adIdMustBeNumber'));
      return;
    }

    // Update ad status
    await updateOfficialAdStatus(db, adId, false);

    await telegram.sendMessage(
      chatId,
      i18n.t('admin.adConfig.officialAdDisabled', { id: adId }) + '\n\n' + i18n.t('admin.adConfig.viewAllOfficialAds')
    );
  } catch (error) {
    console.error('[handleOfficialAdDisable] Error:', error);
    const i18n = createI18n('zh-TW');
    await telegram.sendMessage(chatId, i18n.t('admin.adConfig.disableOfficialAdFailed'));
  }
}
