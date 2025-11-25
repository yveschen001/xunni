/**
 * Ad Reward Domain Logic
 *
 * Purpose:
 *   Business logic for third-party video ad rewards
 *   Pure functions with no side effects
 *   Easy to test and maintain
 *
 * Business Rules:
 *   - Free users can watch up to 20 ads per day
 *   - Each ad completion grants +1 temporary quota
 *   - VIP users cannot watch ads (they have unlimited quota)
 *   - Quota resets daily at midnight
 *
 * Future Extensions:
 *   - Dynamic daily limit based on user behavior
 *   - Bonus rewards for consecutive days
 *   - Special events with higher rewards
 */

// ============================================================================
// Constants
// ============================================================================

export const AD_REWARD_CONSTANTS = {
  MAX_ADS_PER_DAY: 20,
  QUOTA_PER_AD: 1,
  MIN_AD_DURATION_SECONDS: 15, // Minimum ad duration to count as "watched"
} as const;

// ============================================================================
// Types
// ============================================================================

export interface AdReward {
  telegram_id: string;
  reward_date: string; // YYYY-MM-DD
  ads_watched: number;
  quota_earned: number;
  ad_views: number;
  ad_completions: number;
  created_at: string;
  updated_at: string;
}

export interface AdRewardCheckResult {
  can_watch: boolean;
  remaining_ads: number;
  reason?: string;
}

export interface AdRewardUpdateResult {
  success: boolean;
  new_quota_earned: number;
  total_ads_watched: number;
  remaining_ads: number;
  message: string;
}

// ============================================================================
// Core Business Logic
// ============================================================================

/**
 * Check if user can watch more ads today
 *
 * @param adReward - User's ad reward record for today (null if none)
 * @param isVIP - Whether user is VIP
 * @returns Check result with can_watch flag and remaining ads
 *
 * @example
 * const result = canWatchAd(adReward, false);
 * if (result.can_watch) {
 *   console.log(`You can watch ${result.remaining_ads} more ads`);
 * }
 */
export function canWatchAd(adReward: AdReward | null, isVIP: boolean, i18n?: any): AdRewardCheckResult {
  // VIP users cannot watch ads (they don't need quota)
  if (isVIP) {
    return {
      can_watch: false,
      remaining_ads: 0,
      reason: i18n?.t('adReward.vipNoAdsReason') || 'VIP users have unlimited quota and cannot watch ads',
    };
  }

  // If no record, user can watch all ads
  if (!adReward) {
    return {
      can_watch: true,
      remaining_ads: AD_REWARD_CONSTANTS.MAX_ADS_PER_DAY,
    };
  }

  // Check if daily limit reached
  const adsWatched = adReward.ads_watched || 0;
  const remainingAds = AD_REWARD_CONSTANTS.MAX_ADS_PER_DAY - adsWatched;

  if (remainingAds <= 0) {
    return {
      can_watch: false,
      remaining_ads: 0,
      reason: i18n?.t('adReward.dailyLimitReached', { max: AD_REWARD_CONSTANTS.MAX_ADS_PER_DAY }) || 'Daily ad limit reached (20/20)',
    };
  }

  return {
    can_watch: true,
    remaining_ads: remainingAds,
  };
}

/**
 * Calculate quota earned from ad completion
 *
 * @param currentQuotaEarned - Current quota earned today
 * @param adsWatched - Number of ads watched today
 * @returns New quota earned (capped at MAX_ADS_PER_DAY)
 *
 * @example
 * const newQuota = calculateQuotaEarned(5, 5);
 * console.log(newQuota); // 6
 */
export function calculateQuotaEarned(currentQuotaEarned: number, _adsWatched: number): number {
  const newQuota = currentQuotaEarned + AD_REWARD_CONSTANTS.QUOTA_PER_AD;

  // Cap at MAX_ADS_PER_DAY (safety check)
  return Math.min(newQuota, AD_REWARD_CONSTANTS.MAX_ADS_PER_DAY);
}

/**
 * Process ad completion and calculate new state
 *
 * @param adReward - Current ad reward record (null if none)
 * @param isVIP - Whether user is VIP
 * @returns Update result with new state
 *
 * @example
 * const result = processAdCompletion(adReward, false);
 * if (result.success) {
 *   console.log(`Earned +1 quota! Total: ${result.new_quota_earned}`);
 * }
 */
export function processAdCompletion(
  adReward: AdReward | null,
  isVIP: boolean,
  i18n?: any
): AdRewardUpdateResult {
  // Check if user can watch ads
  const checkResult = canWatchAd(adReward, isVIP, i18n);

  if (!checkResult.can_watch) {
    return {
      success: false,
      new_quota_earned: adReward?.quota_earned || 0,
      total_ads_watched: adReward?.ads_watched || 0,
      remaining_ads: 0,
      message: checkResult.reason || (i18n?.t('adReward.cannotWatchMore') || 'Cannot watch more ads'),
    };
  }

  // Calculate new state
  const currentAdsWatched = adReward?.ads_watched || 0;
  const currentQuotaEarned = adReward?.quota_earned || 0;

  const newAdsWatched = currentAdsWatched + 1;
  const newQuotaEarned = calculateQuotaEarned(currentQuotaEarned, newAdsWatched);
  const newRemainingAds = AD_REWARD_CONSTANTS.MAX_ADS_PER_DAY - newAdsWatched;

  return {
    success: true,
    new_quota_earned: newQuotaEarned,
    total_ads_watched: newAdsWatched,
    remaining_ads: newRemainingAds,
    message: i18n?.t('adReward.adCompleted', { quota: AD_REWARD_CONSTANTS.QUOTA_PER_AD }) || `Ad completed! Earned +${AD_REWARD_CONSTANTS.QUOTA_PER_AD} quota`,
  };
}

/**
 * Process ad view (user clicked "watch ad" button)
 *
 * @param adReward - Current ad reward record (null if none)
 * @returns Updated ad_views count
 */
export function processAdView(adReward: AdReward | null): number {
  const currentViews = adReward?.ad_views || 0;
  return currentViews + 1;
}

/**
 * Get today's date in YYYY-MM-DD format
 *
 * @returns Today's date string
 *
 * @example
 * const today = getTodayDateString();
 * console.log(today); // "2025-01-18"
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if ad reward record is for today
 *
 * @param adReward - Ad reward record
 * @returns True if record is for today
 */
export function isToday(adReward: AdReward): boolean {
  return adReward.reward_date === getTodayDateString();
}

/**
 * Calculate ad completion rate
 *
 * @param adReward - Ad reward record
 * @returns Completion rate (0-100)
 *
 * @example
 * const rate = calculateCompletionRate(adReward);
 * console.log(`Completion rate: ${rate}%`);
 */
export function calculateCompletionRate(adReward: AdReward): number {
  if (!adReward.ad_views || adReward.ad_views === 0) {
    return 0;
  }

  const rate = (adReward.ad_completions / adReward.ad_views) * 100;
  return Math.round(rate * 100) / 100; // Round to 2 decimal places
}

/**
 * Format ad reward status message
 *
 * @param adReward - Ad reward record (null if none)
 * @param isVIP - Whether user is VIP
 * @returns Formatted status message
 *
 * @example
 * const message = formatAdRewardStatus(adReward, false);
 * console.log(message);
 * // "📺 今日廣告：5/20 | 已獲得 5 個額度"
 */
export function formatAdRewardStatus(adReward: AdReward | null, isVIP: boolean, i18n?: any): string {
  if (isVIP) {
    return i18n?.t('adReward.vipNoAds') || '💎 VIP 用戶無需觀看廣告';
  }

  if (!adReward) {
    return i18n?.t('common.ad3', { MAX_ADS_PER_DAY: AD_REWARD_CONSTANTS.MAX_ADS_PER_DAY }) || `📺 今日廣告：0/${AD_REWARD_CONSTANTS.MAX_ADS_PER_DAY} | 已獲得 0 個額度`;
  }

  const adsWatched = adReward.ads_watched || 0;
  const quotaEarned = adReward.quota_earned || 0;
  const remaining = AD_REWARD_CONSTANTS.MAX_ADS_PER_DAY - adsWatched;

  if (remaining === 0) {
    return i18n?.t('common.ad2', { adsWatched, MAX_ADS_PER_DAY: AD_REWARD_CONSTANTS.MAX_ADS_PER_DAY, quotaEarned }) || `📺 今日廣告：${adsWatched}/${AD_REWARD_CONSTANTS.MAX_ADS_PER_DAY} ✅ 已達上限 | 已獲得 ${quotaEarned} 個額度`;
  }

  return i18n?.t('common.ad', { adsWatched, MAX_ADS_PER_DAY: AD_REWARD_CONSTANTS.MAX_ADS_PER_DAY, quotaEarned, remaining }) || `📺 今日廣告：${adsWatched}/${AD_REWARD_CONSTANTS.MAX_ADS_PER_DAY} | 已獲得 ${quotaEarned} 個額度 | 剩餘 ${remaining} 次`;
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate ad reward data
 *
 * @param adReward - Ad reward data to validate
 * @returns True if valid, throws error if invalid
 */
export function validateAdReward(adReward: Partial<AdReward>): boolean {
  if (!adReward.telegram_id) {
    throw new Error('telegram_id is required');
  }

  if (!adReward.reward_date) {
    throw new Error('reward_date is required');
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(adReward.reward_date)) {
    throw new Error('reward_date must be in YYYY-MM-DD format');
  }

  // Validate ads_watched range
  if (adReward.ads_watched !== undefined) {
    if (adReward.ads_watched < 0 || adReward.ads_watched > AD_REWARD_CONSTANTS.MAX_ADS_PER_DAY) {
      throw new Error(`ads_watched must be between 0 and ${AD_REWARD_CONSTANTS.MAX_ADS_PER_DAY}`);
    }
  }

  // Validate quota_earned range
  if (adReward.quota_earned !== undefined) {
    if (adReward.quota_earned < 0 || adReward.quota_earned > AD_REWARD_CONSTANTS.MAX_ADS_PER_DAY) {
      throw new Error(`quota_earned must be between 0 and ${AD_REWARD_CONSTANTS.MAX_ADS_PER_DAY}`);
    }
  }

  return true;
}

// ============================================================================
// Future Extensions (commented out for now)
// ============================================================================

/**
 * Calculate bonus rewards for consecutive days
 *
 * @param consecutiveDays - Number of consecutive days watching ads
 * @returns Bonus quota (0 if no bonus)
 *
 * @example
 * const bonus = calculateConsecutiveDayBonus(7);
 * console.log(bonus); // 2 (bonus for 7 days streak)
 *
 * @future
 * - Day 3: +1 bonus
 * - Day 7: +2 bonus
 * - Day 14: +3 bonus
 * - Day 30: +5 bonus
 */
export function calculateConsecutiveDayBonus(_consecutiveDays: number): number {
  // TODO: Implement when we want to add streak bonuses
  return 0;
}

/**
 * Calculate dynamic daily limit based on user behavior
 *
 * @param userEngagement - User engagement score (0-100)
 * @returns Dynamic daily limit
 *
 * @example
 * const limit = calculateDynamicLimit(80);
 * console.log(limit); // 25 (higher limit for engaged users)
 *
 * @future
 * - High engagement (80+): 25 ads/day
 * - Medium engagement (50-79): 20 ads/day
 * - Low engagement (0-49): 15 ads/day
 */
export function calculateDynamicLimit(_userEngagement: number): number {
  // TODO: Implement when we have engagement scoring
  return AD_REWARD_CONSTANTS.MAX_ADS_PER_DAY;
}
