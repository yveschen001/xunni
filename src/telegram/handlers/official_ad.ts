/**
 * Official Ad Handler
 *
 * Purpose:
 *   Handle XunNi's official ads (text/link/group/channel)
 *   One-time display with permanent quota rewards
 *
 * Commands:
 *   - Callback: view_official_ad - User clicks to view official ads
 *   - Callback: claim_ad_{adId} - User claims ad reward
 *   - Callback: verify_ad_{adId} - User verifies group/channel membership
 */

import type { Env, CallbackQuery } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import {
  getActiveOfficialAds,
  getOfficialAdById,
  getViewedAdIds,
  createAdView,
  markAdClicked,
  markAdVerified,
  markRewardGranted,
  incrementAdViewCount,
  getAdStatistics,
} from '~/db/queries/official_ads';
import {
  getAvailableAds,
  selectNextAd,
  checkAdEligibility,
  processAdClick,
  processAdVerification,
  formatAdMessage,
  formatAdButtonText,
  formatVerificationButtonText,
  formatAdStats,
} from '~/domain/official_ad';
import { grantPermanentQuota } from '~/db/queries/users';

// ============================================================================
// View Official Ads
// ============================================================================

/**
 * Handle view official ads button click
 *
 * Flow:
 *   1. Get available ads for user
 *   2. Select next ad to display
 *   3. Show ad with appropriate buttons
 */
export async function handleViewOfficialAds(callbackQuery: CallbackQuery, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);

  const chatId = callbackQuery.message?.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  if (!chatId) {
    return;
  }

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      await telegram.answerCallbackQuery(callbackQuery.id, {
        text: '❌ 用戶不存在',
        show_alert: true,
      });
      return;
    }

    // Get all active ads
    const allAds = await getActiveOfficialAds(db);

    // Get user's viewed ad IDs
    const viewedAdIds = await getViewedAdIds(db, telegramId);

    // Get available ads
    const availableAds = getAvailableAds(allAds, viewedAdIds);

    if (availableAds.length === 0) {
      await telegram.answerCallbackQuery(callbackQuery.id, {
        text: '✅ 你已經看過所有官方廣告了！',
        show_alert: true,
      });
      return;
    }

    // Select next ad
    const ad = selectNextAd(availableAds);

    if (!ad) {
      await telegram.answerCallbackQuery(callbackQuery.id, {
        text: '❌ 暫無可用的廣告',
        show_alert: true,
      });
      return;
    }

    // Create ad view record
    await createAdView(db, telegramId, ad.id);

    // Increment ad view count
    await incrementAdViewCount(db, ad.id);

    // Format ad message
    const message = formatAdMessage(ad);

    // Build inline keyboard
    const buttons: any[] = [];

    // Main action button
    if (ad.ad_type === 'text') {
      buttons.push([
        {
          text: formatAdButtonText(ad),
          callback_data: `claim_ad_${ad.id}`,
        },
      ]);
    } else if (ad.url) {
      buttons.push([
        {
          text: formatAdButtonText(ad),
          url: ad.url,
        },
      ]);

      // Add claim/verify button
      if (ad.requires_verification) {
        buttons.push([
          {
            text: formatVerificationButtonText(),
            callback_data: `verify_ad_${ad.id}`,
          },
        ]);
      } else {
        buttons.push([
          {
            text: '✅ 領取獎勵',
            callback_data: `claim_ad_${ad.id}`,
          },
        ]);
      }
    }

    // Next ad button
    if (availableAds.length > 1) {
      buttons.push([
        {
          text: '➡️ 下一個廣告',
          callback_data: 'view_official_ad',
        },
      ]);
    }

    // Cancel button
    buttons.push([
      {
        text: '❌ 關閉',
        callback_data: 'cancel',
      },
    ]);

    await telegram.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: buttons,
      },
    });

    await telegram.answerCallbackQuery(callbackQuery.id);
  } catch (error) {
    console.error('[handleViewOfficialAds] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, {
      text: '❌ 發生錯誤，請稍後再試',
      show_alert: true,
    });
  }
}

// ============================================================================
// Claim Ad Reward
// ============================================================================

/**
 * Handle claim ad reward button click
 *
 * Flow:
 *   1. Check ad eligibility
 *   2. Process ad click
 *   3. Grant reward if no verification required
 */
export async function handleClaimAd(
  callbackQuery: CallbackQuery,
  adId: number,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);

  const chatId = callbackQuery.message?.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  if (!chatId) {
    return;
  }

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      await telegram.answerCallbackQuery(callbackQuery.id, {
        text: '❌ 用戶不存在',
        show_alert: true,
      });
      return;
    }

    // Get ad
    const ad = await getOfficialAdById(db, adId);
    if (!ad) {
      await telegram.answerCallbackQuery(callbackQuery.id, {
        text: '❌ 廣告不存在',
        show_alert: true,
      });
      return;
    }

    // Check eligibility (should already be viewed)
    const viewedAdIds = await getViewedAdIds(db, telegramId);
    const eligibility = checkAdEligibility(ad, viewedAdIds.includes(adId));

    if (!eligibility.is_eligible) {
      await telegram.answerCallbackQuery(callbackQuery.id, {
        text: eligibility.reason || '❌ 無法領取此廣告',
        show_alert: true,
      });
      return;
    }

    // Mark as clicked
    await markAdClicked(db, telegramId, adId);

    // Process ad click
    const result = processAdClick(ad, null);

    if (!result.success) {
      await telegram.answerCallbackQuery(callbackQuery.id, {
        text: result.message,
        show_alert: true,
      });
      return;
    }

    // Grant reward
    await grantPermanentQuota(db, telegramId, ad.reward_quota);

    // Mark reward as granted
    await markRewardGranted(db, telegramId, adId);

    // Send success message
    const successMessage = `
🎉 **獎勵領取成功！**

✅ 獲得 **+${ad.reward_quota} 個永久額度**
💎 這些額度不會過期，可以永久使用！

📊 **你的額度：**
• 基礎額度：${user.is_vip ? '無限' : '10'}/天
• 永久額度：+${ad.reward_quota}

${availableAds.length > 0 ? '💡 還有更多官方廣告可以觀看！' : '✅ 你已經看過所有官方廣告了'}
    `.trim();

    await telegram.sendMessage(chatId, successMessage);

    await telegram.answerCallbackQuery(callbackQuery.id, {
      text: `✅ 獲得 +${ad.reward_quota} 個永久額度！`,
    });
  } catch (error) {
    console.error('[handleClaimAd] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, {
      text: '❌ 發生錯誤，請稍後再試',
      show_alert: true,
    });
  }
}

// ============================================================================
// Verify Ad (Group/Channel)
// ============================================================================

/**
 * Handle verify ad button click
 *
 * Flow:
 *   1. Check if user joined group/channel
 *   2. Process verification
 *   3. Grant reward if verified
 */
export async function handleVerifyAd(
  callbackQuery: CallbackQuery,
  adId: number,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);

  const chatId = callbackQuery.message?.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  if (!chatId) {
    return;
  }

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      await telegram.answerCallbackQuery(callbackQuery.id, {
        text: '❌ 用戶不存在',
        show_alert: true,
      });
      return;
    }

    // Get ad
    const ad = await getOfficialAdById(db, adId);
    if (!ad) {
      await telegram.answerCallbackQuery(callbackQuery.id, {
        text: '❌ 廣告不存在',
        show_alert: true,
      });
      return;
    }

    // Check if requires verification
    if (!ad.requires_verification) {
      await telegram.answerCallbackQuery(callbackQuery.id, {
        text: '❌ 此廣告不需要驗證',
        show_alert: true,
      });
      return;
    }

    // Verify membership
    let isVerified = false;

    if (ad.target_entity_id) {
      try {
        // Check if user is member of group/channel
        const chatMember = await telegram.getChatMember(
          ad.target_entity_id,
          parseInt(telegramId, 10)
        );

        // Check member status
        isVerified = ['member', 'administrator', 'creator'].includes(chatMember.status);
      } catch (error) {
        console.error('[handleVerifyAd] Verification error:', error);
        isVerified = false;
      }
    }

    // Process verification
    const result = processAdVerification(ad, isVerified);

    if (!result.success) {
      await telegram.answerCallbackQuery(callbackQuery.id, {
        text: result.message,
        show_alert: true,
      });
      return;
    }

    // Mark as verified
    await markAdVerified(db, telegramId, adId);

    // Grant reward
    await grantPermanentQuota(db, telegramId, ad.reward_quota);

    // Mark reward as granted
    await markRewardGranted(db, telegramId, adId);

    // Send success message
    const successMessage = `
🎉 **驗證成功！**

✅ 獲得 **+${ad.reward_quota} 個永久額度**
💎 感謝你加入我們的社群！

📊 **你的額度：**
• 基礎額度：${user.is_vip ? '無限' : '10'}/天
• 永久額度：+${ad.reward_quota}

💡 在社群中你可以：
• 與其他用戶交流
• 獲得最新功能更新
• 參與活動獲得更多獎勵
    `.trim();

    await telegram.sendMessage(chatId, successMessage);

    await telegram.answerCallbackQuery(callbackQuery.id, {
      text: `✅ 驗證成功！獲得 +${ad.reward_quota} 個永久額度！`,
    });
  } catch (error) {
    console.error('[handleVerifyAd] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, {
      text: '❌ 發生錯誤，請稍後再試',
      show_alert: true,
    });
  }
}

// ============================================================================
// Admin: View Ad Statistics
// ============================================================================

/**
 * Handle admin command to view ad statistics
 *
 * Command: /ad_stats [adId]
 */
export async function handleAdStats(message: any, adId: number | null, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);

  const chatId = message.chat.id;
  const telegramId = message.from.id.toString();

  try {
    // Check if user is admin
    const user = await findUserByTelegramId(db, telegramId);
    if (!user || !user.is_super_admin) {
      await telegram.sendMessage(chatId, '❌ 你沒有權限查看廣告統計');
      return;
    }

    if (adId) {
      // Show stats for specific ad
      const ad = await getOfficialAdById(db, adId);
      if (!ad) {
        await telegram.sendMessage(chatId, '❌ 廣告不存在');
        return;
      }

      const stats = await getAdStatistics(db, adId);
      const message = formatAdStats(ad, stats);

      await telegram.sendMessage(chatId, message);
    } else {
      // Show stats for all ads
      const allAds = await getActiveOfficialAds(db);

      if (allAds.length === 0) {
        await telegram.sendMessage(chatId, '📊 暫無官方廣告');
        return;
      }

      let message = '📊 **官方廣告統計**\n\n';

      for (const ad of allAds) {
        const stats = await getAdStatistics(db, ad.id);
        message += `**${ad.title}** (ID: ${ad.id})\n`;
        message += `• 展示：${stats.total_views} | 點擊：${stats.total_clicks} (${stats.ctr}%)\n`;
        message += `• 獎勵：${stats.total_rewards}\n\n`;
      }

      message += '💡 使用 /ad_stats {id} 查看詳細統計';

      await telegram.sendMessage(chatId, message);
    }
  } catch (error) {
    console.error('[handleAdStats] Error:', error);
    await telegram.sendMessage(chatId, '❌ 獲取統計數據失敗');
  }
}
