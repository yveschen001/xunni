/**
 * Analytics Database Queries
 *
 * Purpose:
 *   Database operations for analytics_events, user_sessions,
 *   daily_user_summary, and funnel_events tables
 */

import type { D1Database } from '@cloudflare/workers-types';
import type {
  AnalyticsEvent,
  UserSession,
  DailyUserSummary,
  FunnelEvent,
  EventCategory,
} from '~/domain/analytics_events';

// ============================================================================
// Analytics Events
// ============================================================================

/**
 * Create analytics event
 */
export async function createAnalyticsEvent(
  db: D1Database,
  event: Omit<AnalyticsEvent, 'created_at'>
): Promise<number> {
  const now = new Date();
  const eventDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const eventHour = now.getUTCHours();

  const result = await db
    .prepare(
      `INSERT INTO analytics_events (
        event_type, event_category, user_id, user_type, user_age_days,
        event_data, ad_provider, ad_id, ad_type, session_id,
        user_language, user_timezone, event_date, event_hour
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      event.event_type,
      event.event_category,
      event.user_id,
      event.user_type || null,
      event.user_age_days || null,
      event.event_data ? JSON.stringify(event.event_data) : null,
      event.ad_provider || null,
      event.ad_id || null,
      event.ad_type || null,
      event.session_id || null,
      event.user_language || null,
      event.user_timezone || null,
      eventDate,
      eventHour
    )
    .run();

  return result.meta?.last_row_id || 0;
}

/**
 * Get events by user
 */
export async function getEventsByUser(
  db: D1Database,
  userId: string,
  limit: number = 100
): Promise<AnalyticsEvent[]> {
  const result = await db
    .prepare(
      `SELECT * FROM analytics_events 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`
    )
    .bind(userId, limit)
    .all();

  return (result.results || []) as AnalyticsEvent[];
}

/**
 * Get events by type and date range
 */
export async function getEventsByTypeAndDateRange(
  db: D1Database,
  eventType: string,
  startDate: string,
  endDate: string
): Promise<AnalyticsEvent[]> {
  const result = await db
    .prepare(
      `SELECT * FROM analytics_events 
       WHERE event_type = ? 
         AND event_date BETWEEN ? AND ?
       ORDER BY created_at DESC`
    )
    .bind(eventType, startDate, endDate)
    .all();

  return (result.results || []) as AnalyticsEvent[];
}

/**
 * Get events by category and date
 */
export async function getEventsByCategoryAndDate(
  db: D1Database,
  category: EventCategory,
  date: string
): Promise<AnalyticsEvent[]> {
  const result = await db
    .prepare(
      `SELECT * FROM analytics_events 
       WHERE event_category = ? 
         AND event_date = ?
       ORDER BY created_at DESC`
    )
    .bind(category, date)
    .all();

  return (result.results || []) as AnalyticsEvent[];
}

/**
 * Count events by type
 */
export async function countEventsByType(
  db: D1Database,
  eventType: string,
  startDate: string,
  endDate: string
): Promise<number> {
  const result = await db
    .prepare(
      `SELECT COUNT(*) as count 
       FROM analytics_events 
       WHERE event_type = ? 
         AND event_date BETWEEN ? AND ?`
    )
    .bind(eventType, startDate, endDate)
    .first<{ count: number }>();

  return result?.count || 0;
}

// ============================================================================
// User Sessions
// ============================================================================

/**
 * Create user session
 */
export async function createUserSession(
  db: D1Database,
  session: Omit<UserSession, 'id' | 'created_at'>
): Promise<number> {
  const result = await db
    .prepare(
      `INSERT INTO user_sessions (
        session_id, user_id, session_start, user_language, user_timezone
      )
      VALUES (?, ?, ?, ?, ?)`
    )
    .bind(
      session.session_id,
      session.user_id,
      session.session_start,
      session.user_language || null,
      session.user_timezone || null
    )
    .run();

  return result.meta?.last_row_id || 0;
}

/**
 * Update user session
 */
export async function updateUserSession(
  db: D1Database,
  sessionId: string,
  updates: Partial<UserSession>
): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.session_end !== undefined) {
    fields.push('session_end = ?');
    values.push(updates.session_end);
  }
  if (updates.session_duration_seconds !== undefined) {
    fields.push('session_duration_seconds = ?');
    values.push(updates.session_duration_seconds);
  }
  if (updates.events_count !== undefined) {
    fields.push('events_count = ?');
    values.push(updates.events_count);
  }
  if (updates.bottles_thrown !== undefined) {
    fields.push('bottles_thrown = ?');
    values.push(updates.bottles_thrown);
  }
  if (updates.bottles_caught !== undefined) {
    fields.push('bottles_caught = ?');
    values.push(updates.bottles_caught);
  }
  if (updates.ads_watched !== undefined) {
    fields.push('ads_watched = ?');
    values.push(updates.ads_watched);
  }
  if (updates.conversations_started !== undefined) {
    fields.push('conversations_started = ?');
    values.push(updates.conversations_started);
  }
  if (updates.messages_sent !== undefined) {
    fields.push('messages_sent = ?');
    values.push(updates.messages_sent);
  }
  if (updates.vip_converted !== undefined) {
    fields.push('vip_converted = ?');
    values.push(updates.vip_converted ? 1 : 0);
  }
  if (updates.invite_sent !== undefined) {
    fields.push('invite_sent = ?');
    values.push(updates.invite_sent ? 1 : 0);
  }
  if (updates.ad_completed !== undefined) {
    fields.push('ad_completed = ?');
    values.push(updates.ad_completed ? 1 : 0);
  }

  if (fields.length === 0) {
    return;
  }

  values.push(sessionId);

  await db
    .prepare(
      `UPDATE user_sessions 
       SET ${fields.join(', ')} 
       WHERE session_id = ?`
    )
    .bind(...values)
    .run();
}

/**
 * Get user session by ID
 */
export async function getUserSession(
  db: D1Database,
  sessionId: string
): Promise<UserSession | null> {
  const result = await db
    .prepare(`SELECT * FROM user_sessions WHERE session_id = ?`)
    .bind(sessionId)
    .first();

  return result as UserSession | null;
}

/**
 * Get active sessions (not ended)
 */
export async function getActiveSessions(db: D1Database, userId: string): Promise<UserSession[]> {
  const result = await db
    .prepare(
      `SELECT * FROM user_sessions 
       WHERE user_id = ? 
         AND session_end IS NULL
       ORDER BY session_start DESC`
    )
    .bind(userId)
    .all();

  return (result.results || []) as UserSession[];
}

// ============================================================================
// Daily User Summary
// ============================================================================

/**
 * Upsert daily user summary
 */
export async function upsertDailyUserSummary(
  db: D1Database,
  userId: string,
  summaryDate: string,
  updates: Partial<DailyUserSummary>
): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];

  // Build SET clause for updates
  if (updates.user_type !== undefined) {
    fields.push('user_type = ?');
    values.push(updates.user_type);
  }
  if (updates.user_age_days !== undefined) {
    fields.push('user_age_days = ?');
    values.push(updates.user_age_days);
  }
  if (updates.is_active !== undefined) {
    fields.push('is_active = ?');
    values.push(updates.is_active ? 1 : 0);
  }
  if (updates.session_count !== undefined) {
    fields.push('session_count = session_count + ?');
    values.push(updates.session_count);
  }
  if (updates.total_duration_seconds !== undefined) {
    fields.push('total_duration_seconds = total_duration_seconds + ?');
    values.push(updates.total_duration_seconds);
  }
  if (updates.bottles_thrown !== undefined) {
    fields.push('bottles_thrown = bottles_thrown + ?');
    values.push(updates.bottles_thrown);
  }
  if (updates.bottles_caught !== undefined) {
    fields.push('bottles_caught = bottles_caught + ?');
    values.push(updates.bottles_caught);
  }
  if (updates.conversations_started !== undefined) {
    fields.push('conversations_started = conversations_started + ?');
    values.push(updates.conversations_started);
  }
  if (updates.messages_sent !== undefined) {
    fields.push('messages_sent = messages_sent + ?');
    values.push(updates.messages_sent);
  }
  if (updates.ads_viewed !== undefined) {
    fields.push('ads_viewed = ads_viewed + ?');
    values.push(updates.ads_viewed);
  }
  if (updates.ads_completed !== undefined) {
    fields.push('ads_completed = ads_completed + ?');
    values.push(updates.ads_completed);
  }
  if (updates.official_ads_clicked !== undefined) {
    fields.push('official_ads_clicked = official_ads_clicked + ?');
    values.push(updates.official_ads_clicked);
  }
  if (updates.invites_sent !== undefined) {
    fields.push('invites_sent = invites_sent + ?');
    values.push(updates.invites_sent);
  }
  if (updates.invites_accepted !== undefined) {
    fields.push('invites_accepted = invites_accepted + ?');
    values.push(updates.invites_accepted);
  }
  if (updates.vip_page_views !== undefined) {
    fields.push('vip_page_views = vip_page_views + ?');
    values.push(updates.vip_page_views);
  }
  if (updates.vip_converted !== undefined) {
    fields.push('vip_converted = ?');
    values.push(updates.vip_converted ? 1 : 0);
  }
  if (updates.quota_used !== undefined) {
    fields.push('quota_used = quota_used + ?');
    values.push(updates.quota_used);
  }
  if (updates.quota_from_ads !== undefined) {
    fields.push('quota_from_ads = quota_from_ads + ?');
    values.push(updates.quota_from_ads);
  }
  if (updates.quota_from_invites !== undefined) {
    fields.push('quota_from_invites = quota_from_invites + ?');
    values.push(updates.quota_from_invites);
  }

  if (fields.length === 0) {
    return;
  }

  // Use INSERT ... ON CONFLICT for upsert
  await db
    .prepare(
      `INSERT INTO daily_user_summary (user_id, summary_date, is_active)
       VALUES (?, ?, 1)
       ON CONFLICT(user_id, summary_date) 
       DO UPDATE SET ${fields.join(', ')}`
    )
    .bind(userId, summaryDate, ...values)
    .run();
}

/**
 * Get daily user summary
 */
export async function getDailyUserSummary(
  db: D1Database,
  userId: string,
  summaryDate: string
): Promise<DailyUserSummary | null> {
  const result = await db
    .prepare(
      `SELECT * FROM daily_user_summary 
       WHERE user_id = ? AND summary_date = ?`
    )
    .bind(userId, summaryDate)
    .first();

  return result as DailyUserSummary | null;
}

// ============================================================================
// Funnel Events
// ============================================================================

/**
 * Create funnel event
 */
export async function createFunnelEvent(
  db: D1Database,
  event: Omit<FunnelEvent, 'id' | 'created_at' | 'step_timestamp'>
): Promise<number> {
  const result = await db
    .prepare(
      `INSERT INTO funnel_events (
        user_id, funnel_type, funnel_step, step_order, step_data,
        time_from_previous_step_seconds, time_from_funnel_start_seconds,
        completed, dropped_off
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      event.user_id,
      event.funnel_type,
      event.funnel_step,
      event.step_order,
      event.step_data ? JSON.stringify(event.step_data) : null,
      event.time_from_previous_step_seconds || null,
      event.time_from_funnel_start_seconds || null,
      event.completed ? 1 : 0,
      event.dropped_off ? 1 : 0
    )
    .run();

  return result.meta?.last_row_id || 0;
}

/**
 * Get funnel events by user and type
 */
export async function getFunnelEventsByUser(
  db: D1Database,
  userId: string,
  funnelType: string
): Promise<FunnelEvent[]> {
  const result = await db
    .prepare(
      `SELECT * FROM funnel_events 
       WHERE user_id = ? AND funnel_type = ?
       ORDER BY step_order ASC`
    )
    .bind(userId, funnelType)
    .all();

  return (result.results || []) as FunnelEvent[];
}

/**
 * Get funnel conversion rate
 */
export async function getFunnelConversionRate(
  db: D1Database,
  funnelType: string,
  startDate: string,
  endDate: string
): Promise<
  {
    step: string;
    step_order: number;
    user_count: number;
    conversion_rate: number;
  }[]
> {
  const result = await db
    .prepare(
      `SELECT 
        funnel_step as step,
        step_order,
        COUNT(DISTINCT user_id) as user_count
       FROM funnel_events
       WHERE funnel_type = ?
         AND DATE(step_timestamp) BETWEEN ? AND ?
       GROUP BY funnel_step, step_order
       ORDER BY step_order ASC`
    )
    .bind(funnelType, startDate, endDate)
    .all();

  const steps = result.results || [];
  const firstStepCount = steps.length > 0 ? (steps[0] as any).user_count : 1;

  return steps.map((step: any) => ({
    step: step.step,
    step_order: step.step_order,
    user_count: step.user_count,
    conversion_rate: (step.user_count / firstStepCount) * 100,
  }));
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Delete old analytics events
 */
export async function deleteOldAnalyticsEvents(
  db: D1Database,
  daysToKeep: number = 90
): Promise<number> {
  const result = await db
    .prepare(
      `DELETE FROM analytics_events 
       WHERE event_date < date('now', '-' || ? || ' days')`
    )
    .bind(daysToKeep)
    .run();

  return result.meta?.changes || 0;
}
