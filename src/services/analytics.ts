/**
 * Analytics Service
 *
 * Purpose:
 *   Centralized service for tracking user events and behavior
 *   Provides high-level API for analytics operations
 *
 * Usage:
 *   const analytics = new AnalyticsService(db, env);
 *   await analytics.trackEvent({ ... });
 */

import type { D1Database } from '@cloudflare/workers-types';
import type { Env } from '~/types';
import type { AllEventTypes } from '~/domain/analytics_events';
import { getEventCategory, generateSessionId } from '~/domain/analytics_events';
import {
  createAnalyticsEvent,
  createUserSession,
  updateUserSession,
  getUserSession,
  getActiveSessions,
  upsertDailyUserSummary,
  createFunnelEvent,
  getFunnelEventsByUser,
} from '~/db/queries/analytics';

// ============================================================================
// Analytics Service
// ============================================================================

export class AnalyticsService {
  constructor(
    private db: D1Database,
    private env: Env
  ) {}

  // ==========================================================================
  // Event Tracking
  // ==========================================================================

  /**
   * Track an analytics event
   *
   * @param event - Event data
   * @returns Event ID
   *
   * @example
   * await analytics.trackEvent({
   *   event_type: UserLifecycleEvent.USER_REGISTERED,
   *   event_category: EventCategory.USER,
   *   user_id: '123456789',
   *   event_data: { source: 'invite' },
   * });
   */
  async trackEvent(event: {
    event_type: AllEventTypes;
    user_id: string;
    user_type?: 'free' | 'vip';
    user_age_days?: number;
    event_data?: Record<string, any>;
    ad_provider?: string;
    ad_id?: number;
    ad_type?: 'third_party' | 'official';
    session_id?: string;
    user_language?: string;
    user_timezone?: string;
  }): Promise<number> {
    try {
      // Get event category automatically
      const event_category = getEventCategory(event.event_type);

      // Create event
      const eventId = await createAnalyticsEvent(this.db, {
        ...event,
        event_category,
      });

      // Update daily user summary
      await this.updateDailySummary(event.user_id, event.event_type);

      return eventId;
    } catch (error) {
      console.error('[AnalyticsService] trackEvent error:', error);
      throw error;
    }
  }

  /**
   * Track multiple events in batch
   */
  async trackEvents(events: Parameters<typeof this.trackEvent>[0][]): Promise<void> {
    for (const event of events) {
      await this.trackEvent(event);
    }
  }

  // ==========================================================================
  // Session Management
  // ==========================================================================

  /**
   * Start a new user session
   *
   * @param userId - User's Telegram ID
   * @param language - User's language
   * @param timezone - User's timezone
   * @returns Session ID
   */
  async startSession(userId: string, language?: string, timezone?: string): Promise<string> {
    try {
      const sessionId = generateSessionId(userId);

      await createUserSession(this.db, {
        session_id: sessionId,
        user_id: userId,
        session_start: new Date().toISOString(),
        events_count: 0,
        bottles_thrown: 0,
        bottles_caught: 0,
        ads_watched: 0,
        conversations_started: 0,
        messages_sent: 0,
        vip_converted: false,
        invite_sent: false,
        ad_completed: false,
        user_language: language,
        user_timezone: timezone,
      });

      return sessionId;
    } catch (error) {
      console.error('[AnalyticsService] startSession error:', error);
      throw error;
    }
  }

  /**
   * End a user session
   *
   * @param sessionId - Session ID
   */
  async endSession(sessionId: string): Promise<void> {
    try {
      const session = await getUserSession(this.db, sessionId);
      if (!session) {
        return;
      }

      const sessionEnd = new Date();
      const sessionStart = new Date(session.session_start);
      const durationSeconds = Math.floor((sessionEnd.getTime() - sessionStart.getTime()) / 1000);

      await updateUserSession(this.db, sessionId, {
        session_end: sessionEnd.toISOString(),
        session_duration_seconds: durationSeconds,
      });

      // Update daily summary with session duration
      const summaryDate = sessionEnd.toISOString().split('T')[0];
      await upsertDailyUserSummary(this.db, session.user_id, summaryDate, {
        total_duration_seconds: durationSeconds,
      });
    } catch (error) {
      console.error('[AnalyticsService] endSession error:', error);
      throw error;
    }
  }

  /**
   * Update session statistics
   *
   * @param sessionId - Session ID
   * @param updates - Statistics to update
   */
  async updateSession(
    sessionId: string,
    updates: {
      events_count?: number;
      bottles_thrown?: number;
      bottles_caught?: number;
      ads_watched?: number;
      conversations_started?: number;
      messages_sent?: number;
      vip_converted?: boolean;
      invite_sent?: boolean;
      ad_completed?: boolean;
    }
  ): Promise<void> {
    try {
      await updateUserSession(this.db, sessionId, updates);
    } catch (error) {
      console.error('[AnalyticsService] updateSession error:', error);
      throw error;
    }
  }

  /**
   * Get or create active session for user
   *
   * @param userId - User's Telegram ID
   * @param language - User's language
   * @param timezone - User's timezone
   * @returns Session ID
   */
  async getOrCreateSession(userId: string, language?: string, timezone?: string): Promise<string> {
    try {
      // Check for active sessions
      const activeSessions = await getActiveSessions(this.db, userId);

      if (activeSessions.length > 0) {
        // Return most recent active session
        return activeSessions[0].session_id;
      }

      // Create new session
      return await this.startSession(userId, language, timezone);
    } catch (error) {
      console.error('[AnalyticsService] getOrCreateSession error:', error);
      throw error;
    }
  }

  // ==========================================================================
  // Funnel Tracking
  // ==========================================================================

  /**
   * Track funnel step
   *
   * @param userId - User's Telegram ID
   * @param funnelType - Funnel type
   * @param funnelStep - Step name
   * @param stepOrder - Step order (1, 2, 3...)
   * @param stepData - Additional step data
   * @param completed - Whether funnel was completed
   */
  async trackFunnelStep(
    userId: string,
    funnelType: string,
    funnelStep: string,
    stepOrder: number,
    stepData?: Record<string, any>,
    completed: boolean = false
  ): Promise<void> {
    try {
      // Get previous steps to calculate time differences
      const previousSteps = await getFunnelEventsByUser(this.db, userId, funnelType);

      let timeFromPreviousStep: number | undefined;
      let timeFromFunnelStart: number | undefined;

      if (previousSteps.length > 0) {
        const now = new Date();
        const previousStep = previousSteps[previousSteps.length - 1];
        const previousTime = new Date(previousStep.step_timestamp);
        timeFromPreviousStep = Math.floor((now.getTime() - previousTime.getTime()) / 1000);

        const firstStep = previousSteps[0];
        const firstTime = new Date(firstStep.step_timestamp);
        timeFromFunnelStart = Math.floor((now.getTime() - firstTime.getTime()) / 1000);
      }

      await createFunnelEvent(this.db, {
        user_id: userId,
        funnel_type: funnelType,
        funnel_step: funnelStep,
        step_order: stepOrder,
        step_data: stepData,
        time_from_previous_step_seconds: timeFromPreviousStep,
        time_from_funnel_start_seconds: timeFromFunnelStart,
        completed: completed,
        dropped_off: false,
      });
    } catch (error) {
      console.error('[AnalyticsService] trackFunnelStep error:', error);
      throw error;
    }
  }

  // ==========================================================================
  // Daily Summary
  // ==========================================================================

  /**
   * Update daily user summary based on event type
   *
   * @param userId - User's Telegram ID
   * @param eventType - Event type
   */
  private async updateDailySummary(userId: string, eventType: AllEventTypes): Promise<void> {
    try {
      const summaryDate = new Date().toISOString().split('T')[0];
      const updates: Partial<any> = { is_active: true };

      // Map event types to summary fields
      if (eventType === 'bottle_throw') {
        updates.bottles_thrown = 1;
        updates.quota_used = 1;
      } else if (eventType === 'bottle_catch') {
        updates.bottles_caught = 1;
      } else if (eventType === 'conversation_start') {
        updates.conversations_started = 1;
      } else if (eventType === 'conversation_message') {
        updates.messages_sent = 1;
      } else if (eventType === 'ad_impression' || eventType === 'ad_click') {
        updates.ads_viewed = 1;
      } else if (eventType === 'ad_complete') {
        updates.ads_completed = 1;
        updates.quota_from_ads = 1;
      } else if (eventType === 'official_ad_click') {
        updates.official_ads_clicked = 1;
      } else if (eventType === 'invite_initiated') {
        updates.invites_sent = 1;
      } else if (eventType === 'invite_accepted') {
        updates.invites_accepted = 1;
      } else if (eventType === 'invite_activated') {
        updates.quota_from_invites = 1;
      } else if (eventType === 'vip_interest' || eventType === 'vip_consideration') {
        updates.vip_page_views = 1;
      } else if (eventType === 'vip_purchase_success') {
        updates.vip_converted = true;
      }

      if (Object.keys(updates).length > 1) {
        // More than just is_active
        await upsertDailyUserSummary(this.db, userId, summaryDate, updates);
      }
    } catch (error) {
      console.error('[AnalyticsService] updateDailySummary error:', error);
      // Don't throw - summary update failure shouldn't break main flow
    }
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Get user age in days
   *
   * @param registrationDate - User's registration date
   * @returns Age in days
   */
  getUserAgeDays(registrationDate: string): number {
    const now = new Date();
    const registration = new Date(registrationDate);
    const diffMs = now.getTime() - registration.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if analytics is enabled
   */
  isEnabled(): boolean {
    return this.env.ENABLE_ANALYTICS !== 'false';
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create analytics service instance
 *
 * @param db - D1 database
 * @param env - Environment variables
 * @returns Analytics service
 */
export function createAnalyticsService(db: D1Database, env: Env): AnalyticsService {
  return new AnalyticsService(db, env);
}
