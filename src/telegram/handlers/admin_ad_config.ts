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
import {
  getAllAdProviders,
  updateAdProviderStatus,
  updateAdProviderPriority,
} from '~/db/queries/ad_providers';
import {
  getAllOfficialAds,
  updateOfficialAdStatus,
} from '~/db/queries/official_ads';

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

    if (providers.length === 0) {
      await telegram.sendMessage(
        chatId,
        '⚠️ 目前沒有配置任何廣告提供商\n\n' +
          '請使用資料庫腳本添加廣告提供商：\n' +
          '`scripts/init-ad-providers-test.sql`'
      );
      return;
    }

    let message_text = '📺 **廣告提供商列表**\n\n';

    for (const provider of providers) {
      const status = provider.is_enabled ? '✅ 啟用' : '❌ 停用';
      const config = JSON.parse(provider.config);

      message_text += `**${provider.provider_display_name}**\n`;
      message_text += `• ID: ${provider.provider_name}\n`;
      message_text += `• 狀態: ${status}\n`;
      message_text += `• 優先級: ${provider.priority}\n`;
      message_text += `• 權重: ${provider.weight}\n`;

      if (config.test_mode) {
        message_text += `• 🧪 測試模式\n`;
      }

      message_text += `\n`;
    }

    message_text += '━━━━━━━━━━━━━━━━\n';
    message_text += '**管理命令：**\n';
    message_text += '• `/ad_provider_enable <id>` - 啟用\n';
    message_text += '• `/ad_provider_disable <id>` - 停用\n';
    message_text += '• `/ad_provider_priority <id> <priority>` - 設置優先級';

    await telegram.sendMessage(chatId, message_text);
  } catch (error) {
    console.error('[handleAdProviders] Error:', error);
    await telegram.sendMessage(chatId, '❌ 獲取廣告提供商列表失敗');
  }
}

/**
 * Handle /ad_provider_enable command
 * 
 * Enable an ad provider
 */
export async function handleAdProviderEnable(
  message: TelegramMessage,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id;
  const text = message.text || '';

  try {
    const parts = text.split(' ');
    if (parts.length < 2) {
      await telegram.sendMessage(
        chatId,
        '❌ 使用方法錯誤\n\n' + '**正確格式：**\n' + `/ad_provider_enable <provider_id>`
      );
      return;
    }

    const providerName = parts[1];

    // Update provider status
    await updateAdProviderStatus(db, providerName, true);

    await telegram.sendMessage(
      chatId,
      `✅ 已啟用廣告提供商：${providerName}\n\n` + `使用 /ad_providers 查看所有提供商`
    );
  } catch (error) {
    console.error('[handleAdProviderEnable] Error:', error);
    await telegram.sendMessage(chatId, '❌ 啟用廣告提供商失敗');
  }
}

/**
 * Handle /ad_provider_disable command
 * 
 * Disable an ad provider
 */
export async function handleAdProviderDisable(
  message: TelegramMessage,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id;
  const text = message.text || '';

  try {
    const parts = text.split(' ');
    if (parts.length < 2) {
      await telegram.sendMessage(
        chatId,
        '❌ 使用方法錯誤\n\n' + '**正確格式：**\n' + `/ad_provider_disable <provider_id>`
      );
      return;
    }

    const providerName = parts[1];

    // Update provider status
    await updateAdProviderStatus(db, providerName, false);

    await telegram.sendMessage(
      chatId,
      `✅ 已停用廣告提供商：${providerName}\n\n` + `使用 /ad_providers 查看所有提供商`
    );
  } catch (error) {
    console.error('[handleAdProviderDisable] Error:', error);
    await telegram.sendMessage(chatId, '❌ 停用廣告提供商失敗');
  }
}

/**
 * Handle /ad_provider_priority command
 * 
 * Set ad provider priority
 */
export async function handleAdProviderPriority(
  message: TelegramMessage,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id;
  const text = message.text || '';

  try {
    const parts = text.split(' ');
    if (parts.length < 3) {
      await telegram.sendMessage(
        chatId,
        '❌ 使用方法錯誤\n\n' +
          '**正確格式：**\n' +
          `/ad_provider_priority <provider_id> <priority>\n\n` +
          '**範例：**\n' +
          `/ad_provider_priority gigapub_test 100`
      );
      return;
    }

    const providerName = parts[1];
    const priority = parseInt(parts[2]);

    if (isNaN(priority) || priority < 0) {
      await telegram.sendMessage(chatId, '❌ 優先級必須是非負整數');
      return;
    }

    // Update provider priority
    await updateAdProviderPriority(db, providerName, priority);

    await telegram.sendMessage(
      chatId,
      `✅ 已設置廣告提供商優先級\n\n` +
        `提供商：${providerName}\n` +
        `優先級：${priority}\n\n` +
        `使用 /ad_providers 查看所有提供商`
    );
  } catch (error) {
    console.error('[handleAdProviderPriority] Error:', error);
    await telegram.sendMessage(chatId, '❌ 設置優先級失敗');
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

    if (ads.length === 0) {
      await telegram.sendMessage(
        chatId,
        '⚠️ 目前沒有官方廣告\n\n' +
          '請使用資料庫腳本添加官方廣告：\n' +
          '`scripts/create-official-ads.sql`'
      );
      return;
    }

    let message_text = '📢 **官方廣告列表**\n\n';

    for (const ad of ads) {
      const status = ad.is_enabled ? '✅ 啟用' : '❌ 停用';
      const typeEmoji = {
        text: '📝',
        link: '🔗',
        group: '👥',
        channel: '📢',
      }[ad.ad_type] || '📄';

      message_text += `${typeEmoji} **${ad.title}**\n`;
      message_text += `• ID: ${ad.id}\n`;
      message_text += `• 類型: ${ad.ad_type}\n`;
      message_text += `• 狀態: ${status}\n`;
      message_text += `• 獎勵: ${ad.quota_reward} 額度\n`;
      message_text += `• 展示: ${ad.impression_count} 次\n`;
      message_text += `• 點擊: ${ad.click_count} 次\n`;
      message_text += `\n`;
    }

    message_text += '━━━━━━━━━━━━━━━━\n';
    message_text += '**管理命令：**\n';
    message_text += '• `/official_ad_enable <id>` - 啟用\n';
    message_text += '• `/official_ad_disable <id>` - 停用\n';
    message_text += '• `/ad_stats <id>` - 查看詳細統計';

    await telegram.sendMessage(chatId, message_text);
  } catch (error) {
    console.error('[handleOfficialAds] Error:', error);
    await telegram.sendMessage(chatId, '❌ 獲取官方廣告列表失敗');
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
    const parts = text.split(' ');
    if (parts.length < 2) {
      await telegram.sendMessage(
        chatId,
        '❌ 使用方法錯誤\n\n' + '**正確格式：**\n' + `/official_ad_enable <ad_id>`
      );
      return;
    }

    const adId = parseInt(parts[1]);
    if (isNaN(adId)) {
      await telegram.sendMessage(chatId, '❌ 廣告 ID 必須是數字');
      return;
    }

    // Update ad status
    await updateOfficialAdStatus(db, adId, true);

    await telegram.sendMessage(
      chatId,
      `✅ 已啟用官方廣告 #${adId}\n\n` + `使用 /official_ads 查看所有廣告`
    );
  } catch (error) {
    console.error('[handleOfficialAdEnable] Error:', error);
    await telegram.sendMessage(chatId, '❌ 啟用官方廣告失敗');
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
    const parts = text.split(' ');
    if (parts.length < 2) {
      await telegram.sendMessage(
        chatId,
        '❌ 使用方法錯誤\n\n' + '**正確格式：**\n' + `/official_ad_disable <ad_id>`
      );
      return;
    }

    const adId = parseInt(parts[1]);
    if (isNaN(adId)) {
      await telegram.sendMessage(chatId, '❌ 廣告 ID 必須是數字');
      return;
    }

    // Update ad status
    await updateOfficialAdStatus(db, adId, false);

    await telegram.sendMessage(
      chatId,
      `✅ 已停用官方廣告 #${adId}\n\n` + `使用 /official_ads 查看所有廣告`
    );
  } catch (error) {
    console.error('[handleOfficialAdDisable] Error:', error);
    await telegram.sendMessage(chatId, '❌ 停用官方廣告失敗');
  }
}

