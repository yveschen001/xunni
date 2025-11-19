/**
 * Official Ad Domain Logic
 *
 * Purpose:
 *   Business logic for XunNi's official ads
 *   Text/Link/Group/Channel promotions
 *   One-time display with permanent quota rewards
 *
 * Ad Types:
 *   1. Text: Simple announcement, click to claim
 *   2. Link: External link (Mini App, website, features)
 *   3. Group: Telegram group invitation (with optional verification)
 *   4. Channel: Telegram channel subscription (with optional verification)
 *
 * Business Rules:
 *   - Each user sees each ad only once
 *   - Rewards are permanent (not temporary like video ads)
 *   - No daily limit (unlike third-party ads)
 *   - Group/Channel ads can require verification
 *
 * Future Extensions:
 *   - Targeting rules (user age, language, VIP status)
 *   - A/B testing variants
 *   - Scheduling (day of week, time of day)
 *   - Priority/weight for display order
 */

// ============================================================================
// Constants
// ============================================================================

export const OFFICIAL_AD_CONSTANTS = {
  MIN_REWARD_QUOTA: 1,
  MAX_REWARD_QUOTA: 10,
  DEFAULT_REWARD_QUOTA: 1,
  VERIFICATION_TIMEOUT_SECONDS: 300, // 5 minutes to verify
} as const;

// ============================================================================
// Types
// ============================================================================

export type OfficialAdType = 'text' | 'link' | 'group' | 'channel';

export interface OfficialAd {
  id: number;
  ad_type: OfficialAdType;
  title: string;
  content: string;
  url?: string;
  target_entity_id?: string; // Group ID or Channel username
  reward_quota: number;
  requires_verification: boolean;
  is_enabled: boolean;
  start_date?: string;
  end_date?: string;
  max_views?: number;
  current_views: number;
  created_at: string;
  updated_at: string;
}

export interface OfficialAdView {
  id: number;
  telegram_id: string;
  ad_id: number;
  viewed_at: string;
  clicked: boolean;
  clicked_at?: string;
  verified: boolean;
  verified_at?: string;
  reward_granted: boolean;
  reward_granted_at?: string;
}

export interface OfficialAdEligibility {
  is_eligible: boolean;
  reason?: string;
  ad?: OfficialAd;
}

export interface OfficialAdRewardResult {
  success: boolean;
  quota_earned: number;
  message: string;
  requires_verification: boolean;
}

// ============================================================================
// Ad Selection Logic
// ============================================================================

/**
 * Get available official ads for user
 *
 * @param allAds - All official ads
 * @param viewedAdIds - Ad IDs user has already viewed
 * @returns Available ads for user
 *
 * @example
 * const availableAds = getAvailableAds(allAds, [1, 2, 3]);
 * console.log(`${availableAds.length} ads available`);
 */
export function getAvailableAds(allAds: OfficialAd[], viewedAdIds: number[]): OfficialAd[] {
  const today = getTodayDateString();

  return allAds.filter((ad) => {
    // Must be enabled
    if (!ad.is_enabled) {
      return false;
    }

    // Must not have been viewed by user
    if (viewedAdIds.includes(ad.id)) {
      return false;
    }

    // Check date range
    if (ad.start_date && ad.start_date > today) {
      return false;
    }
    if (ad.end_date && ad.end_date < today) {
      return false;
    }

    // Check max views
    if (ad.max_views && ad.current_views >= ad.max_views) {
      return false;
    }

    return true;
  });
}

/**
 * Check if user is eligible to see an ad
 *
 * @param ad - Official ad
 * @param hasViewedAd - Whether user has viewed this ad
 * @returns Eligibility result
 */
export function checkAdEligibility(ad: OfficialAd, hasViewedAd: boolean): OfficialAdEligibility {
  // Check if already viewed
  if (hasViewedAd) {
    return {
      is_eligible: false,
      reason: 'You have already viewed this ad',
    };
  }

  // Check if enabled
  if (!ad.is_enabled) {
    return {
      is_eligible: false,
      reason: 'This ad is no longer available',
    };
  }

  // Check date range
  const today = getTodayDateString();
  if (ad.start_date && ad.start_date > today) {
    return {
      is_eligible: false,
      reason: 'This ad is not yet available',
    };
  }
  if (ad.end_date && ad.end_date < today) {
    return {
      is_eligible: false,
      reason: 'This ad has expired',
    };
  }

  // Check max views
  if (ad.max_views && ad.current_views >= ad.max_views) {
    return {
      is_eligible: false,
      reason: 'This ad has reached its view limit',
    };
  }

  return {
    is_eligible: true,
    ad: ad,
  };
}

/**
 * Select next ad to display to user
 *
 * @param availableAds - Available ads
 * @returns Selected ad or null if none available
 *
 * Strategy: Simple FIFO (first created, first displayed)
 * Future: Can add priority/weight system
 */
export function selectNextAd(availableAds: OfficialAd[]): OfficialAd | null {
  if (availableAds.length === 0) {
    return null;
  }

  // Sort by created_at (oldest first)
  const sorted = [...availableAds].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return sorted[0];
}

// ============================================================================
// Reward Logic
// ============================================================================

/**
 * Process ad view (user saw the ad)
 *
 * @param ad - Official ad
 * @returns New current_views count
 */
export function processAdView(ad: OfficialAd): number {
  return ad.current_views + 1;
}

/**
 * Process ad click (user clicked the ad)
 *
 * @param ad - Official ad
 * @param adView - User's ad view record
 * @returns Reward result
 */
export function processAdClick(
  ad: OfficialAd,
  _adView: OfficialAdView | null
): OfficialAdRewardResult {
  // Check if requires verification
  if (ad.requires_verification) {
    return {
      success: false,
      quota_earned: 0,
      message: 'Please complete verification to claim reward',
      requires_verification: true,
    };
  }

  // Grant reward immediately for non-verification ads
  return {
    success: true,
    quota_earned: ad.reward_quota,
    message: `Claimed +${ad.reward_quota} permanent quota!`,
    requires_verification: false,
  };
}

/**
 * Process ad verification (user joined group/channel)
 *
 * @param ad - Official ad
 * @param isVerified - Whether verification succeeded
 * @returns Reward result
 */
export function processAdVerification(ad: OfficialAd, isVerified: boolean): OfficialAdRewardResult {
  if (!isVerified) {
    return {
      success: false,
      quota_earned: 0,
      message: 'Verification failed. Please join the group/channel first.',
      requires_verification: true,
    };
  }

  return {
    success: true,
    quota_earned: ad.reward_quota,
    message: `Verified! Claimed +${ad.reward_quota} permanent quota!`,
    requires_verification: false,
  };
}

/**
 * Calculate total quota earned from official ads
 *
 * @param adViews - User's ad view records
 * @returns Total quota earned
 */
export function calculateTotalQuotaEarned(adViews: OfficialAdView[]): number {
  return adViews.filter((_view) => _view.reward_granted).reduce((total, _view) => total + 1, 0); // Each ad grants 1+ quota
}

// ============================================================================
// Ad Display Logic
// ============================================================================

/**
 * Format ad message for display
 *
 * @param ad - Official ad
 * @returns Formatted message
 */
export function formatAdMessage(ad: OfficialAd): string {
  const typeEmoji = getAdTypeEmoji(ad.ad_type);
  const rewardText = `🎁 獎勵：+${ad.reward_quota} 個永久額度`;

  let message = `${typeEmoji} **${ad.title}**\n\n${ad.content}\n\n${rewardText}`;

  if (ad.requires_verification) {
    message += '\n\n✅ 需要驗證：加入群組/頻道後點擊「驗證」按鈕';
  }

  return message;
}

/**
 * Get emoji for ad type
 *
 * @param adType - Ad type
 * @returns Emoji
 */
export function getAdTypeEmoji(adType: OfficialAdType): string {
  switch (adType) {
    case 'text':
      return '📢';
    case 'link':
      return '🔗';
    case 'group':
      return '👥';
    case 'channel':
      return '📣';
    default:
      return '📢';
  }
}

/**
 * Format ad button text
 *
 * @param ad - Official ad
 * @returns Button text
 */
export function formatAdButtonText(ad: OfficialAd): string {
  switch (ad.ad_type) {
    case 'text':
      return '領取獎勵';
    case 'link':
      return '訪問鏈接';
    case 'group':
      return '加入群組';
    case 'channel':
      return '訂閱頻道';
    default:
      return '查看詳情';
  }
}

/**
 * Format verification button text
 *
 * @returns Button text
 */
export function formatVerificationButtonText(): string {
  return '✅ 驗證並領取';
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate official ad data
 *
 * @param ad - Ad data to validate
 * @returns True if valid, throws error if invalid
 */
export function validateOfficialAd(ad: Partial<OfficialAd>): boolean {
  // Required fields
  if (!ad.ad_type) {
    throw new Error('ad_type is required');
  }

  if (!['text', 'link', 'group', 'channel'].includes(ad.ad_type)) {
    throw new Error('ad_type must be one of: text, link, group, channel');
  }

  if (!ad.title || ad.title.trim().length === 0) {
    throw new Error('title is required');
  }

  if (!ad.content || ad.content.trim().length === 0) {
    throw new Error('content is required');
  }

  // URL required for link/group/channel types
  if (['link', 'group', 'channel'].includes(ad.ad_type) && !ad.url) {
    throw new Error(`url is required for ${ad.ad_type} ads`);
  }

  // Validate URL format
  if (ad.url) {
    try {
      new URL(ad.url);
    } catch {
      throw new Error('url must be a valid URL');
    }
  }

  // Validate reward_quota
  if (ad.reward_quota !== undefined) {
    if (
      ad.reward_quota < OFFICIAL_AD_CONSTANTS.MIN_REWARD_QUOTA ||
      ad.reward_quota > OFFICIAL_AD_CONSTANTS.MAX_REWARD_QUOTA
    ) {
      throw new Error(
        `reward_quota must be between ${OFFICIAL_AD_CONSTANTS.MIN_REWARD_QUOTA} and ${OFFICIAL_AD_CONSTANTS.MAX_REWARD_QUOTA}`
      );
    }
  }

  // Validate date range
  if (ad.start_date && ad.end_date) {
    if (ad.start_date > ad.end_date) {
      throw new Error('start_date must be before end_date');
    }
  }

  // Validate max_views
  if (ad.max_views !== undefined && ad.max_views < 0) {
    throw new Error('max_views must be >= 0');
  }

  return true;
}

/**
 * Validate ad view data
 *
 * @param adView - Ad view data to validate
 * @returns True if valid, throws error if invalid
 */
export function validateAdView(adView: Partial<OfficialAdView>): boolean {
  if (!adView.telegram_id) {
    throw new Error('telegram_id is required');
  }

  if (!adView.ad_id) {
    throw new Error('ad_id is required');
  }

  return true;
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Calculate ad statistics
 *
 * @param ad - Official ad
 * @param views - All views for this ad
 * @returns Statistics object
 */
export function calculateAdStats(ad: OfficialAd, views: OfficialAdView[]) {
  const totalViews = views.length;
  const totalClicks = views.filter((v) => v.clicked).length;
  const totalVerified = views.filter((v) => v.verified).length;
  const totalRewards = views.filter((v) => v.reward_granted).length;

  const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
  const verificationRate =
    ad.requires_verification && totalClicks > 0 ? (totalVerified / totalClicks) * 100 : 100;
  const rewardRate = totalViews > 0 ? (totalRewards / totalViews) * 100 : 0;

  return {
    total_views: totalViews,
    total_clicks: totalClicks,
    total_verified: totalVerified,
    total_rewards: totalRewards,
    ctr: Math.round(ctr * 100) / 100,
    verification_rate: Math.round(verificationRate * 100) / 100,
    reward_rate: Math.round(rewardRate * 100) / 100,
  };
}

/**
 * Format ad stats for display
 *
 * @param ad - Official ad
 * @param stats - Ad statistics
 * @returns Formatted stats string
 */
export function formatAdStats(ad: OfficialAd, stats: ReturnType<typeof calculateAdStats>): string {
  const typeEmoji = getAdTypeEmoji(ad.ad_type);
  const statusEmoji = ad.is_enabled ? '✅' : '❌';

  let message = `
${typeEmoji} **${ad.title}**
${statusEmoji} 狀態: ${ad.is_enabled ? '啟用' : '停用'}

📊 **統計數據**
• 展示次數: ${stats.total_views}
• 點擊次數: ${stats.total_clicks}
• 點擊率 (CTR): ${stats.ctr}%
  `.trim();

  if (ad.requires_verification) {
    message += `\n• 驗證次數: ${stats.total_verified}\n• 驗證率: ${stats.verification_rate}%`;
  }

  message += `\n• 獎勵發放: ${stats.total_rewards}\n• 獎勵率: ${stats.reward_rate}%`;

  if (ad.max_views) {
    message += `\n• 剩餘展示: ${ad.max_views - ad.current_views}/${ad.max_views}`;
  }

  return message;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDateString(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ============================================================================
// Future Extensions (commented out for now)
// ============================================================================

/**
 * Check if user matches targeting rules
 *
 * @param ad - Official ad with targeting rules
 * @param user - User data
 * @returns True if user matches targeting
 *
 * @future
 * - Target by user age (days since registration)
 * - Target by language
 * - Target by VIP status
 * - Target by activity level
 */
export function matchesTargetingRules(_ad: OfficialAd, _user: any): boolean {
  // TODO: Implement when we add targeting rules
  return true;
}

/**
 * Select ad variant for A/B testing
 *
 * @param adVariants - Different variants of the same ad
 * @param userId - User ID for consistent variant selection
 * @returns Selected variant
 *
 * @future
 * - Test different titles
 * - Test different content
 * - Test different reward amounts
 * - Measure conversion rates
 */
export function selectAdVariant(adVariants: OfficialAd[], _userId: string): OfficialAd {
  // TODO: Implement when we add A/B testing
  return adVariants[0];
}
