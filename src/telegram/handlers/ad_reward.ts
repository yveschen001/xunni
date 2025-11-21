/**
 * Ad Reward Handler
 *
 * Purpose:
 *   Handle third-party video ad watching and rewards
 *   Support multiple ad providers with fallback
 *
 * Commands:
 *   - Callback: watch_ad - User clicks "watch ad" button
 *   - Callback: ad_complete_{provider}_{token} - Ad completion callback
 */

import type { Env, CallbackQuery } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { getTodayAdReward, incrementAdView, incrementAdCompletion } from '~/db/queries/ad_rewards';
import {
  getAllAdProviders,
  recordAdSuccess,
  recordAdCompletion,
  recordAdError,
  createAdProviderLog,
} from '~/db/queries/ad_providers';
import {
  createAdSession,
  getActiveSessionByUser,
  getSessionByToken,
  markSessionStarted,
  markSessionCompleted,
  markSessionFailed,
} from '~/db/queries/ad_sessions';
import {
  AD_REWARD_CONSTANTS,
  canWatchAd,
  processAdCompletion,
  formatAdRewardStatus,
  getTodayDateString,
} from '~/domain/ad_reward';
import { selectAdProvider, type AdProviderStrategy } from '~/domain/ad_provider';
import { trackAdCompletion, trackAdFailure, trackAdImpression } from '~/services/tracking_helper';
// import { I18N_KEYS } from '~/i18n/keys';
// import { getTranslation } from '~/i18n';

// ============================================================================
// Constants
// ============================================================================

const AD_TOKEN_EXPIRY_SECONDS = 600; // 10 minutes

// ============================================================================
// Handle "Watch Ad" Button Click
// ============================================================================

/**
 * Handle watch ad button click
 *
 * Flow:
 *   1. Check if user can watch more ads
 *   2. Select ad provider
 *   3. Generate ad token
 *   4. Send ad page URL
 */
export async function handleWatchAd(callbackQuery: CallbackQuery, env: Env): Promise<void> {
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

    // Check if VIP
    if (user.is_vip) {
      await telegram.answerCallbackQuery(callbackQuery.id, {
        text: '💎 VIP 用戶無需觀看廣告',
        show_alert: true,
      });
      return;
    }

    // Check if there is any pending session
    const activeSession = await getActiveSessionByUser(db.d1, telegramId);
    if (activeSession) {
      await telegram.answerCallbackQuery(callbackQuery.id, {
        text: '⚠️ 請先完成上一支廣告，再開始新的廣告',
        show_alert: true,
      });
      return;
    }

    // Get today's ad reward (for remaining count display)
    const adReward = await getTodayAdReward(db.d1, telegramId);

    // Check if can watch more ads
    const checkResult = canWatchAd(adReward, user.is_vip);
    if (!checkResult.can_watch) {
      await telegram.answerCallbackQuery(callbackQuery.id, {
        text: checkResult.reason || '❌ 無法觀看更多廣告',
        show_alert: true,
      });
      return;
    }

    // Get ad providers
    const providers = await getAllAdProviders(db.d1, true);
    if (providers.length === 0) {
      await telegram.answerCallbackQuery(callbackQuery.id, {
        text: '❌ 暫無可用的廣告提供商',
        show_alert: true,
      });
      return;
    }

    // Select ad provider
    const strategy = (env.AD_PROVIDER_STRATEGY || 'priority') as AdProviderStrategy;
    const selection = selectAdProvider(providers, strategy);

    if (!selection) {
      await telegram.answerCallbackQuery(callbackQuery.id, {
        text: '❌ 無法選擇廣告提供商',
        show_alert: true,
      });
      return;
    }

    // Generate ad token
    const token = generateAdToken(telegramId);

    // Create ad session (pending)
    await createAdSession(db.d1, telegramId, selection.provider.provider_name, token);

    // Build ad page URL
    const adPageUrl = `${env.PUBLIC_URL}/ad.html?provider=${selection.provider.provider_name}&token=${token}&user=${telegramId}`;

    // Send message with ad link
    const remainingAds = checkResult.remaining_ads;
    const message = `
📺 **觀看廣告獲得額度**

🎁 完成觀看可獲得 **+1 個額度**
📊 今日剩餘：**${remainingAds}/20** 次

👇 點擊下方按鈕開始觀看
    `.trim();

    await telegram.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '📺 開始觀看廣告',
              url: adPageUrl,
            },
          ],
          [
            {
              text: '🏠 返回主選單',
              callback_data: 'return_to_menu',
            },
          ],
        ],
      },
    });

    await telegram.answerCallbackQuery(callbackQuery.id, {
      text: '✅ 請點擊按鈕開始觀看',
    });
  } catch (error) {
    console.error('[handleWatchAd] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, {
      text: '❌ 發生錯誤，請稍後再試',
      show_alert: true,
    });
  }
}

// ============================================================================
// Handle Ad Start Callback
// ============================================================================

/**
 * Handle ad start callback - mark session as playing and track impression
 *
 * URL: /api/ad/start?user={telegramId}&token={token}&provider={providerName}
 */
export async function handleAdStart(
  telegramId: string,
  token: string,
  providerName: string,
  env: Env
): Promise<{ success: boolean; message: string }> {
  const db = createDatabaseClient(env.DB);

  try {
    if (!verifyAdToken(token, telegramId)) {
      return { success: false, message: 'Invalid or expired token' };
    }

    const session = await getSessionByToken(db.d1, token);
    if (!session || session.telegram_id !== telegramId) {
      return { success: false, message: 'Session not found' };
    }

    if (session.status === 'completed') {
      return { success: false, message: 'Ad already completed' };
    }

    if (session.status === 'failed') {
      return { success: false, message: 'Ad session already failed, please restart' };
    }

    let shouldTrackView = false;
    if (session.status === 'pending') {
      await markSessionStarted(db.d1, session.id);
      shouldTrackView = true;
    }

    if (shouldTrackView) {
      // Increment ad view count (ensures record exists)
      const updatedReward = await incrementAdView(db.d1, telegramId, getTodayDateString());

      // Record provider stats/log
      await recordAdSuccess(db.d1, providerName);
      await createAdProviderLog(db.d1, {
        telegram_id: telegramId,
        provider_name: providerName,
        request_type: 'view',
        status: 'success',
      });

      // Track analytics
      const remainingAds =
        AD_REWARD_CONSTANTS.MAX_ADS_PER_DAY - (updatedReward.ad_views || 0);
      await trackAdImpression(env, telegramId, providerName, Math.max(remainingAds, 0));
    }

    return { success: true, message: 'Ad started' };
  } catch (error) {
    console.error('[handleAdStart] Error:', error);
    return { success: false, message: 'Internal server error' };
  }
}

// ============================================================================
// Handle Ad Completion Callback
// ============================================================================

/**
 * Handle ad completion callback from ad page
 *
 * URL: /api/ad/complete?user={telegramId}&token={token}&provider={providerName}
 *
 * Flow:
 *   1. Verify token
 *   2. Check if user can complete ad
 *   3. Grant reward
 *   4. Update statistics
 *   5. Send notification
 */
export async function handleAdComplete(
  telegramId: string,
  token: string,
  providerName: string,
  env: Env
): Promise<{ success: boolean; message: string }> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  let session: Awaited<ReturnType<typeof getSessionByToken>> = null;

  try {
    // Verify token
    if (!verifyAdToken(token, telegramId)) {
      return {
        success: false,
        message: 'Invalid or expired token',
      };
    }

    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    // Check if VIP
    if (user.is_vip) {
      return {
        success: false,
        message: 'VIP users cannot watch ads',
      };
    }

    // Get ad session
    session = await getSessionByToken(db.d1, token);
    if (!session || session.telegram_id !== telegramId) {
      return {
        success: false,
        message: 'Ad session not found, please restart',
      };
    }

    if (session.status === 'pending') {
      return {
        success: false,
        message: 'Ad has not started yet',
      };
    }

    if (session.status === 'completed') {
      return {
        success: false,
        message: 'Ad already completed',
      };
    }

    if (session.status === 'failed') {
      return {
        success: false,
        message: 'Ad session failed, please restart',
      };
    }

    // Get today's ad reward
    const adReward = await getTodayAdReward(db.d1, telegramId);

    // Process ad completion
    const result = processAdCompletion(adReward, user.is_vip);

    if (!result.success) {
      return {
        success: false,
        message: result.message,
      };
    }

    const today = getTodayDateString();

    // Increment ad completion count
    const updated = await incrementAdCompletion(db.d1, telegramId, today);

    // Mark session completed with duration
    let durationMs: number | null = null;
    if (session.started_at) {
      const startTs = new Date(session.started_at).getTime();
      durationMs = Date.now() - startTs;
    }
    await markSessionCompleted(db.d1, session.id, durationMs);

    // Record completion in provider stats
    await recordAdCompletion(db.d1, providerName);

    // Log ad completion
    await createAdProviderLog(db.d1, {
      telegram_id: telegramId,
      provider_name: providerName,
      request_type: 'completion',
      status: 'success',
    });

    // Track analytics
    await trackAdCompletion(env, telegramId, providerName, updated.ads_watched);

    // Send notification to user
    const notificationMessage = `
🎉 **廣告觀看完成！**

✅ 獲得 **+1 個額度**
📊 今日已觀看：**${updated.ads_watched}/20** 次
🎁 今日已獲得：**${updated.quota_earned}** 個額度
📈 剩餘次數：**${result.remaining_ads}** 次

${result.remaining_ads > 0 ? '💡 繼續觀看廣告可獲得更多額度！' : '✅ 今日廣告已達上限'}
    `.trim();

    await telegram.sendMessage(user.telegram_id, notificationMessage);

    return {
      success: true,
      message: 'Ad completed successfully',
    };
  } catch (error) {
    console.error('[handleAdComplete] Error:', error);

    // Record error in provider stats
    await recordAdError(db.d1, providerName, (error as Error).message);

    // Log error
    await createAdProviderLog(db.d1, {
      telegram_id: telegramId,
      provider_name: providerName,
      request_type: 'completion',
      status: 'error',
      error_message: (error as Error).message,
    });

    if (session && session.status !== 'completed' && session.status !== 'failed') {
      await markSessionFailed(db.d1, session.id, (error as Error).message || 'unknown_error');
    }

    return {
      success: false,
      message: 'Internal server error',
    };
  }
}

// ============================================================================
// Handle Ad Error Callback
// ============================================================================

/**
 * Handle ad error callback from ad page
 *
 * URL: /api/ad/error?user={telegramId}&provider={providerName}&error={errorMessage}
 */
export async function handleAdError(
  telegramId: string,
  token: string,
  providerName: string,
  errorMessage: string,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);

  try {
    const session = await getSessionByToken(db.d1, token);
    if (session && session.status !== 'completed' && session.status !== 'failed') {
      await markSessionFailed(db.d1, session.id, errorMessage);
    }

    // Record error in provider stats
    await recordAdError(db.d1, providerName, errorMessage);

    // Log error
    await createAdProviderLog(db.d1, {
      telegram_id: telegramId,
      provider_name: providerName,
      request_type: 'view',
      status: 'error',
      error_message: errorMessage,
    });

    await trackAdFailure(env, telegramId, providerName, errorMessage);

    // Send notification to user
    await telegram.sendMessage(
      telegramId,
      `
❌ **廣告加載失敗**

很抱歉，廣告無法正常播放。

💡 **可能的原因：**
• 網絡連接不穩定
• 廣告提供商暫時不可用
• 瀏覽器不支持

🔄 **建議：**
• 檢查網絡連接
• 稍後再試
• 或使用其他方式獲得額度（邀請朋友）
    `.trim()
    );
  } catch (error) {
    console.error('[handleAdError] Error:', error);
  }
}

// ============================================================================
// Token Management
// ============================================================================

/**
 * Generate ad token
 *
 * Format: {telegramId}_{timestamp}_{random}
 */
function generateAdToken(telegramId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `${telegramId}_${timestamp}_${random}`;
}

/**
 * Verify ad token
 *
 * Check:
 *   1. Token format is valid
 *   2. Telegram ID matches
 *   3. Token is not expired
 */
function verifyAdToken(token: string, telegramId: string): boolean {
  try {
    const parts = token.split('_');
    if (parts.length !== 3) {
      return false;
    }

    const [tokenUserId, timestampStr, _random] = parts;

    // Check user ID
    if (tokenUserId !== telegramId) {
      return false;
    }

    // Check expiry
    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    const age = (now - timestamp) / 1000; // seconds

    if (age > AD_TOKEN_EXPIRY_SECONDS) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get ad reward status message
 */
export async function getAdRewardStatusMessage(telegramId: string, env: Env): Promise<string> {
  const db = createDatabaseClient(env.DB);

  try {
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      return '❌ 用戶不存在';
    }

    const adReward = await getTodayAdReward(db.d1, telegramId);
    return formatAdRewardStatus(adReward, user.is_vip);
  } catch (error) {
    console.error('[getAdRewardStatusMessage] Error:', error);
    return '❌ 獲取廣告狀態失敗';
  }
}
