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
import { createI18n } from '~/i18n';
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
import { grantTemporaryQuota } from '~/db/queries/ad_rewards';

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
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    if (!user) {
      await telegram.answerCallbackQuery(callbackQuery.id, {
        text: i18n.t('officialAd.userNotFound'),
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
        text: i18n.t('officialAd.allAdsViewed'),
        show_alert: true,
      });
      return;
    }

    // Select next ad
    const ad = selectNextAd(availableAds);

    if (!ad) {
      await telegram.answerCallbackQuery(callbackQuery.id, {
        text: i18n.t('officialAd.noAdsAvailable'),
        show_alert: true,
      });
      return;
    }

    // Create ad view record
    await createAdView(db, telegramId, ad.id);

    // Increment ad view count
    await incrementAdViewCount(db, ad.id);

    // Format ad message
    const message = formatAdMessage(ad, i18n);

    // Build inline keyboard
    const buttons: any[] = [];

    // Main action button
    if (ad.ad_type === 'text') {
      buttons.push([
        {
          text: formatAdButtonText(ad, i18n),
          callback_data: `claim_ad_${ad.id}`,
        },
      ]);
    } else if (ad.url) {
      buttons.push([
        {
          text: formatAdButtonText(ad, i18n),
          url: ad.url,
        },
      ]);

      // Add claim/verify button
      if (ad.requires_verification) {
        buttons.push([
          {
            text: formatVerificationButtonText(i18n),
            callback_data: `verify_ad_${ad.id}`,
          },
        ]);
      } else {
        buttons.push([
          {
            text: i18n.t('officialAd.claimRewardButton'),
            callback_data: `claim_ad_${ad.id}`,
          },
        ]);
      }
    }

    // Next ad button
    if (availableAds.length > 1) {
      buttons.push([
        {
          text: i18n.t('officialAd.nextAd'),
          callback_data: 'view_official_ad',
        },
      ]);
    }

    // Cancel button
    buttons.push([
      {
        text: i18n.t('common.close'),
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
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, {
      text: i18n.t('officialAd.errorRetry'),
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
        text: i18n.t('officialAd.userNotFound'),
        show_alert: true,
      });
      return;
    }

    // Get ad
    const ad = await getOfficialAdById(db, adId);
    if (!ad) {
      await telegram.answerCallbackQuery(callbackQuery.id, {
        text: i18n.t('officialAd.adNotFound'),
        show_alert: true,
      });
      return;
    }

    // Check eligibility (should already be viewed)
    const viewedAdIds = await getViewedAdIds(db, telegramId);
    const eligibility = checkAdEligibility(ad, viewedAdIds.includes(adId));

    if (!eligibility.is_eligible) {
      await telegram.answerCallbackQuery(callbackQuery.id, {
        text: eligibility.reason || i18n.t('officialAd.cannotClaim'),
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
    await grantTemporaryQuota(db, telegramId, ad.reward_quota);

    // Mark reward as granted
    await markRewardGranted(db, telegramId, adId);

    // Send success message
    const baseQuota = user.is_vip ? i18n.t('officialAd.unlimited') : '10';
    const successMessage =
      i18n.t('officialAd.claimRewardSuccess', { quota: ad.reward_quota }) +
      '\n\n' +
      i18n.t('officialAd.rewardTemporary') +
      '\n\n' +
      i18n.t('officialAd.quotaInfo', { baseQuota, permanentQuota: ad.reward_quota }) +
      '\n\n' +
      (availableAds.length > 0
        ? i18n.t('officialAd.moreAdsAvailable')
        : i18n.t('officialAd.allAdsViewed'));

    await telegram.sendMessage(chatId, successMessage);

    await telegram.answerCallbackQuery(callbackQuery.id, {
      text: i18n.t('officialAd.claimReward', { quota: ad.reward_quota }),
    });
  } catch (error) {
    console.error('[handleClaimAd] Error:', error);
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, {
      text: i18n.t('officialAd.errorRetry'),
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
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    if (!user) {
      await telegram.answerCallbackQuery(callbackQuery.id, {
        text: i18n.t('common.userNotFound'),
        show_alert: true,
      });
      return;
    }

    // Get ad
    const ad = await getOfficialAdById(db, adId);
    if (!ad) {
      await telegram.answerCallbackQuery(callbackQuery.id, {
        text: i18n.t('officialAd.adNotFound'),
        show_alert: true,
      });
      return;
    }

    // Check if requires verification
    if (!ad.requires_verification) {
      await telegram.answerCallbackQuery(callbackQuery.id, {
        text: i18n.t('officialAd.noVerificationRequired'),
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
    await grantTemporaryQuota(db, telegramId, ad.reward_quota);

    // Mark reward as granted
    await markRewardGranted(db, telegramId, adId);

    // Send success message
    const baseQuota = user.is_vip ? i18n.t('officialAd.unlimited') : '10';
    const successMessage =
      i18n.t('officialAd.verifySuccess', { quota: ad.reward_quota }) +
      '\n\n' +
      i18n.t('officialAd.communityThanks') +
      '\n\n' +
      i18n.t('officialAd.quotaInfo', { baseQuota, permanentQuota: ad.reward_quota }) +
      '\n\n' +
      i18n.t('officialAd.communityBenefits');

    await telegram.sendMessage(chatId, successMessage);

    await telegram.answerCallbackQuery(callbackQuery.id, {
      text: i18n.t('officialAd.verifySuccess', { quota: ad.reward_quota }),
    });
  } catch (error) {
    console.error('[handleVerifyAd] Error:', error);
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, {
      text: i18n.t('officialAd.errorRetry'),
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
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    if (!user || !user.is_super_admin) {
      await telegram.sendMessage(chatId, i18n.t('officialAd.statsNoPermission'));
      return;
    }

    if (adId) {
      // Show stats for specific ad
      const ad = await getOfficialAdById(db, adId);
      if (!ad) {
        await telegram.sendMessage(chatId, i18n.t('officialAd.statsAdNotFound'));
        return;
      }

      const stats = await getAdStatistics(db, adId);
      const message = formatAdStats(ad, stats, i18n);

      await telegram.sendMessage(chatId, message);
    } else {
      // Show stats for all ads
      const allAds = await getActiveOfficialAds(db);

      if (allAds.length === 0) {
        await telegram.sendMessage(chatId, i18n.t('officialAd.statsNoAds'));
        return;
      }

      let message = i18n.t('officialAd.statsTitle');

      for (const ad of allAds) {
        const stats = await getAdStatistics(db, ad.id);
        message += `**${ad.title}** (ID: ${ad.id})\n`;
        message += i18n.t('officialAd.statsSummary', {
          views: stats.total_views,
          clicks: stats.total_clicks,
          ctr: stats.ctr,
        });
        message += i18n.t('officialAd.statsRewardSummary', {
          rewards: stats.total_rewards,
        });
      }

      message += i18n.t('officialAd.statsHint', { id: '{id}' });

      await telegram.sendMessage(chatId, message);
    }
  } catch (error) {
    console.error('[handleAdStats] Error:', error);
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.sendMessage(chatId, i18n.t('error.failed16'));
  }
}
