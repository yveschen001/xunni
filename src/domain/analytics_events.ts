/**
 * Analytics Events Type Definitions
 *
 * Purpose:
 *   Centralized event type definitions for analytics system
 *   Ensures type safety across the application
 *   Documents all trackable events
 *
 * Usage:
 *   import { UserLifecycleEvent, AdEvent } from '~/domain/analytics_events';
 *   analytics.trackEvent({ event_type: UserLifecycleEvent.USER_REGISTERED, ... });
 */

// ============================================================================
// Event Categories
// ============================================================================

export enum EventCategory {
  USER = 'user',
  AD = 'ad',
  VIP = 'vip',
  INVITE = 'invite',
  CONTENT = 'content',
}

// ============================================================================
// User Lifecycle Events
// ============================================================================

export enum UserLifecycleEvent {
  // Registration
  USER_REGISTERED = 'user_registered',

  // First-time actions
  USER_FIRST_THROW = 'user_first_throw',
  USER_FIRST_CATCH = 'user_first_catch',
  USER_FIRST_CONVERSATION = 'user_first_conversation',
  USER_FIRST_AD = 'user_first_ad',
  USER_FIRST_INVITE = 'user_first_invite',

  // Activity status changes
  USER_BECAME_ACTIVE = 'user_became_active', // 3+ days active
  USER_BECAME_INACTIVE = 'user_became_inactive', // 7+ days no activity
  USER_RETURNED = 'user_returned', // Returned after being inactive
}

// ============================================================================
// Ad Events
// ============================================================================

export enum AdEvent {
  // Third-party video ads
  AD_IMPRESSION = 'ad_impression', // Ad option displayed
  AD_CLICK = 'ad_click', // User clicked "watch ad"
  AD_START = 'ad_start', // Ad started playing
  AD_PROGRESS_25 = 'ad_progress_25', // 25% watched
  AD_PROGRESS_50 = 'ad_progress_50', // 50% watched
  AD_PROGRESS_75 = 'ad_progress_75', // 75% watched
  AD_COMPLETE = 'ad_complete', // Ad completed successfully
  AD_ERROR = 'ad_error', // Ad failed to load/play
  AD_SKIP = 'ad_skip', // Ad skipped (if allowed)

  // Official ads
  OFFICIAL_AD_IMPRESSION = 'official_ad_impression',
  OFFICIAL_AD_CLICK = 'official_ad_click',
  OFFICIAL_AD_COMPLETE = 'official_ad_complete',
  OFFICIAL_AD_VERIFY = 'official_ad_verify', // Group/channel verification
}

// ============================================================================
// VIP Events
// ============================================================================

export enum VIPEvent {
  VIP_AWARENESS = 'vip_awareness', // Saw VIP prompt
  VIP_INTEREST = 'vip_interest', // Clicked to view VIP
  VIP_CONSIDERATION = 'vip_consideration', // Viewed VIP details
  VIP_PURCHASE_INTENT = 'vip_purchase_intent', // Clicked purchase
  VIP_PURCHASE_SUCCESS = 'vip_purchase_success', // Purchase completed
  VIP_PURCHASE_FAILED = 'vip_purchase_failed', // Purchase failed
  VIP_RENEWAL = 'vip_renewal', // VIP renewed
  VIP_EXPIRED = 'vip_expired', // VIP expired
  VIP_CANCELLED = 'vip_cancelled', // VIP cancelled
}

// ============================================================================
// Invite Events
// ============================================================================

export enum InviteEvent {
  INVITE_INITIATED = 'invite_initiated', // Sent invite
  INVITE_LINK_CLICKED = 'invite_link_clicked', // Invite link clicked
  INVITE_ACCEPTED = 'invite_accepted', // Invite accepted (registration)
  INVITE_ACTIVATED = 'invite_activated', // Invite activated (first throw)
  INVITE_REWARD_GRANTED = 'invite_reward_granted', // Invite reward granted
}

// ============================================================================
// Content Events
// ============================================================================

export enum ContentEvent {
  BOTTLE_THROW = 'bottle_throw', // Threw a bottle
  BOTTLE_CATCH = 'bottle_catch', // Caught a bottle
  CONVERSATION_START = 'conversation_start', // Started conversation
  CONVERSATION_MESSAGE = 'conversation_message', // Sent message
  CONVERSATION_END = 'conversation_end', // Ended conversation
  REPORT_SUBMITTED = 'report_submitted', // Submitted report
  USER_BANNED = 'user_banned', // User banned
}

// ============================================================================
// Event Data Interfaces
// ============================================================================

/**
 * Base analytics event
 */
export interface AnalyticsEvent {
  event_type: string;
  event_category: EventCategory;
  user_id: string;
  user_type?: 'free' | 'vip';
  user_age_days?: number;
  event_data?: Record<string, any>;
  session_id?: string;
  user_language?: string;
  user_timezone?: string;
}

/**
 * User registration event data
 */
export interface UserRegisteredData {
  nickname: string;
  gender: string;
  language: string;
  invited_by?: string;
  registration_source: 'invite' | 'organic';
}

/**
 * Ad impression event data
 */
export interface AdImpressionData {
  provider_name: string;
  provider_display_name: string;
  remaining_ads: number;
  total_daily_limit: number;
}

/**
 * Ad completion event data
 */
export interface AdCompletionData {
  provider_name: string;
  reward_granted: boolean;
  quota_earned: number;
  total_ads_watched_today: number;
  completion_time: string;
}

/**
 * Ad error event data
 */
export interface AdErrorData {
  provider_name: string;
  error_type: string;
  error_message: string;
  error_stack?: string;
}

/**
 * Official ad impression event data
 */
export interface OfficialAdImpressionData {
  ad_id: number;
  ad_title: string;
  ad_type: 'text' | 'link' | 'group' | 'channel';
  reward_quota: number;
  display_context: 'quota_exhausted' | 'manual_view';
}

/**
 * Official ad click event data
 */
export interface OfficialAdClickData {
  ad_id: number;
  ad_title: string;
  ad_type: 'text' | 'link' | 'group' | 'channel';
  has_url: boolean;
  requires_verification: boolean;
}

/**
 * Official ad completion event data
 */
export interface OfficialAdCompletionData {
  ad_id: number;
  ad_title: string;
  ad_type: 'text' | 'link' | 'group' | 'channel';
  reward_granted: boolean;
  reward_amount: number;
  verified: boolean;
}

/**
 * VIP awareness event data
 */
export interface VIPAwarenessData {
  context: 'quota_exhausted' | 'profile' | 'help' | 'command';
  timestamp: string;
}

/**
 * VIP interest event data
 */
export interface VIPInterestData {
  source: 'button' | 'command' | 'link';
  timestamp: string;
}

/**
 * VIP purchase success event data
 */
export interface VIPPurchaseSuccessData {
  plan: 'monthly' | 'quarterly' | 'yearly';
  amount: number;
  user_age_days: number;
  timestamp: string;
}

/**
 * Invite initiated event data
 */
export interface InviteInitiatedData {
  inviter_is_vip: boolean;
  timestamp: string;
}

/**
 * Invite accepted event data
 */
export interface InviteAcceptedData {
  inviter_id: string;
  invitee_id: string;
  timestamp: string;
}

/**
 * Invite activated event data
 */
export interface InviteActivatedData {
  inviter_id: string;
  invitee_id: string;
  time_since_registration_seconds: number;
  timestamp: string;
}

/**
 * Bottle throw event data
 */
export interface BottleThrowData {
  content_type: 'text' | 'photo' | 'voice';
  quota_source: 'base' | 'invite' | 'ad';
  timestamp: string;
}

/**
 * Bottle catch event data
 */
export interface BottleCatchData {
  bottle_age_seconds: number;
  replied: boolean;
  timestamp: string;
}

/**
 * Conversation end event data
 */
export interface ConversationEndData {
  duration_seconds: number;
  message_count: number;
  end_reason: 'natural' | 'reported' | 'manual';
  timestamp: string;
}

// ============================================================================
// Funnel Types
// ============================================================================

export enum FunnelType {
  VIP_CONVERSION = 'vip_conversion',
  AD_COMPLETION = 'ad_completion',
  INVITE_FLOW = 'invite_flow',
}

export enum VIPFunnelStep {
  AWARENESS = 'awareness',
  INTEREST = 'interest',
  CONSIDERATION = 'consideration',
  PURCHASE_INTENT = 'purchase_intent',
  PURCHASE_SUCCESS = 'purchase_success',
}

export enum AdFunnelStep {
  IMPRESSION = 'impression',
  CLICK = 'click',
  START = 'start',
  PROGRESS = 'progress',
  COMPLETE = 'complete',
}

export enum InviteFunnelStep {
  INITIATE = 'initiate',
  LINK_CLICK = 'link_click',
  ACCEPT = 'accept',
  ACTIVATE = 'activate',
}

/**
 * Funnel event
 */
export interface FunnelEvent {
  user_id: string;
  funnel_type: FunnelType;
  funnel_step: string;
  step_order: number;
  step_data?: Record<string, any>;
  time_from_previous_step_seconds?: number;
  time_from_funnel_start_seconds?: number;
  completed?: boolean;
  dropped_off?: boolean;
}

// ============================================================================
// Session Types
// ============================================================================

export interface UserSession {
  session_id: string;
  user_id: string;
  session_start: string;
  session_end?: string;
  session_duration_seconds?: number;
  events_count: number;
  bottles_thrown: number;
  bottles_caught: number;
  ads_watched: number;
  conversations_started: number;
  messages_sent: number;
  vip_converted: boolean;
  invite_sent: boolean;
  ad_completed: boolean;
  user_language?: string;
  user_timezone?: string;
}

// ============================================================================
// Daily Summary Types
// ============================================================================

export interface DailyUserSummary {
  user_id: string;
  summary_date: string;
  user_type: 'free' | 'vip';
  user_age_days: number;
  is_active: boolean;
  session_count: number;
  total_duration_seconds: number;
  bottles_thrown: number;
  bottles_caught: number;
  conversations_started: number;
  messages_sent: number;
  ads_viewed: number;
  ads_completed: number;
  official_ads_clicked: number;
  invites_sent: number;
  invites_accepted: number;
  vip_page_views: number;
  vip_converted: boolean;
  quota_used: number;
  quota_from_ads: number;
  quota_from_invites: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all event types as a union type
 */
export type AllEventTypes = UserLifecycleEvent | AdEvent | VIPEvent | InviteEvent | ContentEvent;

/**
 * Check if event type is valid
 */
export function isValidEventType(eventType: string): eventType is AllEventTypes {
  return (
    Object.values(UserLifecycleEvent).includes(eventType as UserLifecycleEvent) ||
    Object.values(AdEvent).includes(eventType as AdEvent) ||
    Object.values(VIPEvent).includes(eventType as VIPEvent) ||
    Object.values(InviteEvent).includes(eventType as InviteEvent) ||
    Object.values(ContentEvent).includes(eventType as ContentEvent)
  );
}

/**
 * Get event category from event type
 */
export function getEventCategory(eventType: AllEventTypes): EventCategory {
  if (Object.values(UserLifecycleEvent).includes(eventType as UserLifecycleEvent)) {
    return EventCategory.USER;
  }
  if (Object.values(AdEvent).includes(eventType as AdEvent)) {
    return EventCategory.AD;
  }
  if (Object.values(VIPEvent).includes(eventType as VIPEvent)) {
    return EventCategory.VIP;
  }
  if (Object.values(InviteEvent).includes(eventType as InviteEvent)) {
    return EventCategory.INVITE;
  }
  if (Object.values(ContentEvent).includes(eventType as ContentEvent)) {
    return EventCategory.CONTENT;
  }
  throw new Error(`Unknown event type: ${eventType}`);
}

/**
 * Generate session ID
 */
export function generateSessionId(userId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${userId}_${timestamp}_${random}`;
}
