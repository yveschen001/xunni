/**
 * Tracking Helper
 *
 * Purpose:
 *   Helper functions for integrating analytics tracking
 *   Can be called from any handler without breaking existing code
 *
 * Usage:
 *   import { trackUserRegistration, trackBottleThrow } from '~/services/tracking_helper';
 *   await trackUserRegistration(env, user);
 */

import type { Env, User } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createAnalyticsService } from './analytics';
import {
  UserLifecycleEvent,
  AdEvent,
  VIPEvent,
  InviteEvent,
  ContentEvent,
  FunnelType,
  VIPFunnelStep,
  AdFunnelStep,
  InviteFunnelStep,
} from '~/domain/analytics_events';

// ============================================================================
// User Lifecycle Tracking
// ============================================================================

/**
 * Track user registration
 */
export async function trackUserRegistration(
  env: Env,
  user: User,
  invitedBy?: string
): Promise<void> {
  if (!env.ENABLE_ANALYTICS) return;

  try {
    const db = createDatabaseClient(env.DB);
    const analytics = createAnalyticsService(db.d1, env);

    await analytics.trackEvent({
      event_type: UserLifecycleEvent.USER_REGISTERED,
      user_id: user.telegram_id,
      user_type: 'free',
      user_age_days: 0,
      event_data: {
        nickname: user.nickname,
        gender: user.gender,
        language: user.language_pref,
        invited_by: invitedBy || null,
        registration_source: invitedBy ? 'invite' : 'organic',
      },
    });
  } catch (error) {
    console.error('[trackUserRegistration] Error:', error);
  }
}

/**
 * Track first bottle throw
 */
export async function trackFirstBottleThrow(env: Env, userId: string): Promise<void> {
  if (!env.ENABLE_ANALYTICS) return;

  try {
    const db = createDatabaseClient(env.DB);
    const analytics = createAnalyticsService(db.d1, env);

    await analytics.trackEvent({
      event_type: UserLifecycleEvent.USER_FIRST_THROW,
      user_id: userId,
    });
  } catch (error) {
    console.error('[trackFirstBottleThrow] Error:', error);
  }
}

// ============================================================================
// Ad Tracking
// ============================================================================

/**
 * Track ad impression
 */
export async function trackAdImpression(
  env: Env,
  userId: string,
  providerName: string,
  remainingAds: number
): Promise<void> {
  if (!env.ENABLE_ANALYTICS) return;

  try {
    const db = createDatabaseClient(env.DB);
    const analytics = createAnalyticsService(db.d1, env);

    await analytics.trackEvent({
      event_type: AdEvent.AD_IMPRESSION,
      user_id: userId,
      ad_provider: providerName,
      ad_type: 'third_party',
      event_data: {
        remaining_ads: remainingAds,
        total_daily_limit: 20,
      },
    });

    // Track funnel
    await analytics.trackFunnelStep(userId, FunnelType.AD_COMPLETION, AdFunnelStep.IMPRESSION, 1);
  } catch (error) {
    console.error('[trackAdImpression] Error:', error);
  }
}

/**
 * Track ad completion
 */
export async function trackAdCompletion(
  env: Env,
  userId: string,
  providerName: string,
  totalAdsWatched: number
): Promise<void> {
  if (!env.ENABLE_ANALYTICS) return;

  try {
    const db = createDatabaseClient(env.DB);
    const analytics = createAnalyticsService(db.d1, env);

    await analytics.trackEvent({
      event_type: AdEvent.AD_COMPLETE,
      user_id: userId,
      ad_provider: providerName,
      ad_type: 'third_party',
      event_data: {
        quota_earned: 1,
        total_ads_watched: totalAdsWatched,
      },
    });

    // Track funnel completion
    await analytics.trackFunnelStep(
      userId,
      FunnelType.AD_COMPLETION,
      AdFunnelStep.COMPLETE,
      5,
      undefined,
      true
    );
  } catch (error) {
    console.error('[trackAdCompletion] Error:', error);
  }
}

/**
 * Track ad failure/error
 */
export async function trackAdFailure(
  env: Env,
  userId: string,
  providerName: string,
  errorMessage: string
): Promise<void> {
  if (!env.ENABLE_ANALYTICS) return;

  try {
    const db = createDatabaseClient(env.DB);
    const analytics = createAnalyticsService(db.d1, env);

    await analytics.trackEvent({
      event_type: AdEvent.AD_ERROR,
      user_id: userId,
      ad_provider: providerName,
      ad_type: 'third_party',
      event_data: {
        error_message: errorMessage,
      },
    });
  } catch (error) {
    console.error('[trackAdFailure] Error:', error);
  }
}

/**
 * Track official ad impression
 */
export async function trackOfficialAdImpression(
  env: Env,
  userId: string,
  adId: number,
  adTitle: string,
  adType: string,
  rewardQuota: number
): Promise<void> {
  if (!env.ENABLE_ANALYTICS) return;

  try {
    const db = createDatabaseClient(env.DB);
    const analytics = createAnalyticsService(db.d1, env);

    await analytics.trackEvent({
      event_type: AdEvent.OFFICIAL_AD_IMPRESSION,
      user_id: userId,
      ad_id: adId,
      ad_type: 'official',
      event_data: {
        ad_title: adTitle,
        ad_type: adType,
        reward_quota: rewardQuota,
      },
    });
  } catch (error) {
    console.error('[trackOfficialAdImpression] Error:', error);
  }
}

/**
 * Track official ad completion
 */
export async function trackOfficialAdCompletion(
  env: Env,
  userId: string,
  adId: number,
  rewardAmount: number
): Promise<void> {
  if (!env.ENABLE_ANALYTICS) return;

  try {
    const db = createDatabaseClient(env.DB);
    const analytics = createAnalyticsService(db.d1, env);

    await analytics.trackEvent({
      event_type: AdEvent.OFFICIAL_AD_COMPLETE,
      user_id: userId,
      ad_id: adId,
      ad_type: 'official',
      event_data: {
        reward_granted: true,
        reward_amount: rewardAmount,
      },
    });
  } catch (error) {
    console.error('[trackOfficialAdCompletion] Error:', error);
  }
}

// ============================================================================
// VIP Tracking
// ============================================================================

/**
 * Track VIP awareness (saw VIP prompt)
 */
export async function trackVIPAwareness(env: Env, userId: string, context: string): Promise<void> {
  if (!env.ENABLE_ANALYTICS) return;

  try {
    const db = createDatabaseClient(env.DB);
    const analytics = createAnalyticsService(db.d1, env);

    await analytics.trackEvent({
      event_type: VIPEvent.VIP_AWARENESS,
      user_id: userId,
      event_data: {
        context: context,
      },
    });

    // Track funnel
    await analytics.trackFunnelStep(userId, FunnelType.VIP_CONVERSION, VIPFunnelStep.AWARENESS, 1, {
      context,
    });
  } catch (error) {
    console.error('[trackVIPAwareness] Error:', error);
  }
}

/**
 * Track VIP interest (clicked to view VIP)
 */
export async function trackVIPInterest(env: Env, userId: string, source: string): Promise<void> {
  if (!env.ENABLE_ANALYTICS) return;

  try {
    const db = createDatabaseClient(env.DB);
    const analytics = createAnalyticsService(db.d1, env);

    await analytics.trackEvent({
      event_type: VIPEvent.VIP_INTEREST,
      user_id: userId,
      event_data: {
        source: source,
      },
    });

    // Track funnel
    await analytics.trackFunnelStep(userId, FunnelType.VIP_CONVERSION, VIPFunnelStep.INTEREST, 2, {
      source,
    });
  } catch (error) {
    console.error('[trackVIPInterest] Error:', error);
  }
}

// ============================================================================
// Invite Tracking
// ============================================================================

/**
 * Track invite initiated
 */
export async function trackInviteInitiated(
  env: Env,
  userId: string,
  isVIP: boolean
): Promise<void> {
  if (!env.ENABLE_ANALYTICS) return;

  try {
    const db = createDatabaseClient(env.DB);
    const analytics = createAnalyticsService(db.d1, env);

    await analytics.trackEvent({
      event_type: InviteEvent.INVITE_INITIATED,
      user_id: userId,
      user_type: isVIP ? 'vip' : 'free',
      event_data: {
        inviter_is_vip: isVIP,
      },
    });

    // Track funnel
    await analytics.trackFunnelStep(userId, FunnelType.INVITE_FLOW, InviteFunnelStep.INITIATE, 1);
  } catch (error) {
    console.error('[trackInviteInitiated] Error:', error);
  }
}

/**
 * Track invite accepted
 */
export async function trackInviteAccepted(
  env: Env,
  inviterId: string,
  inviteeId: string
): Promise<void> {
  if (!env.ENABLE_ANALYTICS) return;

  try {
    const db = createDatabaseClient(env.DB);
    const analytics = createAnalyticsService(db.d1, env);

    // Track on inviter's side
    await analytics.trackEvent({
      event_type: InviteEvent.INVITE_ACCEPTED,
      user_id: inviterId,
      event_data: {
        invitee_id: inviteeId,
      },
    });

    // Track funnel
    await analytics.trackFunnelStep(inviterId, FunnelType.INVITE_FLOW, InviteFunnelStep.ACCEPT, 3);
  } catch (error) {
    console.error('[trackInviteAccepted] Error:', error);
  }
}

/**
 * Track invite activated
 */
export async function trackInviteActivated(
  env: Env,
  inviterId: string,
  inviteeId: string
): Promise<void> {
  if (!env.ENABLE_ANALYTICS) return;

  try {
    const db = createDatabaseClient(env.DB);
    const analytics = createAnalyticsService(db.d1, env);

    await analytics.trackEvent({
      event_type: InviteEvent.INVITE_ACTIVATED,
      user_id: inviterId,
      event_data: {
        invitee_id: inviteeId,
      },
    });

    // Track funnel completion
    await analytics.trackFunnelStep(
      inviterId,
      FunnelType.INVITE_FLOW,
      InviteFunnelStep.ACTIVATE,
      4,
      undefined,
      true
    );
  } catch (error) {
    console.error('[trackInviteActivated] Error:', error);
  }
}

// ============================================================================
// Content Tracking
// ============================================================================

/**
 * Track bottle throw
 */
export async function trackBottleThrow(
  env: Env,
  userId: string,
  contentType: string,
  quotaSource: string
): Promise<void> {
  if (!env.ENABLE_ANALYTICS) return;

  try {
    const db = createDatabaseClient(env.DB);
    const analytics = createAnalyticsService(db.d1, env);

    await analytics.trackEvent({
      event_type: ContentEvent.BOTTLE_THROW,
      user_id: userId,
      event_data: {
        content_type: contentType,
        quota_source: quotaSource,
      },
    });
  } catch (error) {
    console.error('[trackBottleThrow] Error:', error);
  }
}

/**
 * Track bottle catch
 */
export async function trackBottleCatch(
  env: Env,
  userId: string,
  bottleAge: number,
  replied: boolean
): Promise<void> {
  if (!env.ENABLE_ANALYTICS) return;

  try {
    const db = createDatabaseClient(env.DB);
    const analytics = createAnalyticsService(db.d1, env);

    await analytics.trackEvent({
      event_type: ContentEvent.BOTTLE_CATCH,
      user_id: userId,
      event_data: {
        bottle_age_seconds: bottleAge,
        replied: replied,
      },
    });
  } catch (error) {
    console.error('[trackBottleCatch] Error:', error);
  }
}

/**
 * Track conversation start
 */
export async function trackConversationStart(
  env: Env,
  userId: string,
  partnerId: string
): Promise<void> {
  if (!env.ENABLE_ANALYTICS) return;

  try {
    const db = createDatabaseClient(env.DB);
    const analytics = createAnalyticsService(db.d1, env);

    await analytics.trackEvent({
      event_type: ContentEvent.CONVERSATION_START,
      user_id: userId,
      event_data: {
        partner_id: partnerId,
      },
    });
  } catch (error) {
    console.error('[trackConversationStart] Error:', error);
  }
}
