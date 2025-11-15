/**
 * XunNi Type Definitions
 * Based on @doc/SPEC.md specifications
 */

// ============================================================================
// Environment & Config Types
// ============================================================================

export interface Env {
  // Bindings
  DB: D1Database;
  RISK_CACHE?: KVNamespace;

  // Secrets
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_WEBHOOK_SECRET: string;
  OPENAI_API_KEY: string;
  OPENAI_MODEL?: string;
  GOOGLE_TRANSLATE_API_KEY?: string;

  // Environment variables
  ENVIRONMENT: 'development' | 'staging' | 'production';
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  BROADCAST_BATCH_SIZE: string;
  BROADCAST_MAX_JOBS: string;
  ENABLE_AI_MODERATION: string;
  ENABLE_TRANSLATION: string;
}

// ============================================================================
// User Types
// ============================================================================

export type Gender = 'male' | 'female';
export type Role = 'user' | 'group_admin' | 'angel' | 'god';
export type TrustLevel = 'new' | 'basic' | 'trusted' | 'verified';
export type OnboardingStep =
  | 'start'
  | 'nickname'
  | 'avatar'
  | 'gender'
  | 'birthday'
  | 'mbti'
  | 'anti_fraud'
  | 'terms'
  | 'completed';

export interface User {
  id: number;
  telegram_id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_pref: string;

  // Profile
  nickname?: string;
  avatar_url?: string;
  gender?: Gender;
  birthday?: string; // YYYY-MM-DD
  age?: number;
  city?: string;
  bio?: string;
  interests?: string; // JSON array

  // MBTI & Tests
  mbti_result?: string;
  mbti_completed_at?: string;
  zodiac_sign?: string;
  anti_fraud_score: number;
  anti_fraud_completed_at?: string;

  // Onboarding
  onboarding_step: OnboardingStep;
  onboarding_completed_at?: string;

  // VIP
  is_vip: number;
  vip_expire_at?: string;

  // Invitation
  invite_code?: string;
  invited_by?: string;
  successful_invites: number;

  // Trust & Risk
  trust_level: TrustLevel;
  risk_score: number;

  // Ban
  is_banned: number;
  ban_reason?: string;
  banned_at?: string;
  banned_until?: string;
  ban_count: number;

  // Role
  role: Role;

  // User rights
  deleted_at?: string;
  anonymized_at?: string;
  deletion_requested_at?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Bottle Types
// ============================================================================

export type BottleStatus = 'pending' | 'matched' | 'expired' | 'deleted';

export interface Bottle {
  id: number;
  owner_telegram_id: string;
  content: string;

  // Matching criteria
  target_gender?: string;
  target_min_age?: number;
  target_max_age?: number;
  target_zodiac_filter?: string; // JSON array
  target_mbti_filter?: string; // JSON array
  target_region?: string;
  require_anti_fraud: number;

  // Status
  status: BottleStatus;
  matched_with_telegram_id?: string;
  matched_at?: string;

  // Timestamps
  created_at: string;
  expires_at?: string;
  deleted_at?: string;
}

// ============================================================================
// Conversation Types
// ============================================================================

export type ConversationStatus = 'active' | 'ended' | 'blocked';

export interface Conversation {
  id: number;
  user_a_telegram_id: string;
  user_b_telegram_id: string;
  bottle_id: number;

  status: ConversationStatus;

  created_at: string;
  last_message_at?: string;
  ended_at?: string;
}

export interface ConversationMessage {
  id: number;
  conversation_id: number;
  sender_telegram_id: string;
  receiver_telegram_id: string;

  original_text: string;
  translated_text?: string;
  translation_provider?: 'openai' | 'google';

  is_blocked_by_ai: number;
  ai_block_reason?: string;

  created_at: string;
}

// ============================================================================
// Usage Types
// ============================================================================

export interface DailyUsage {
  id: number;
  telegram_id: string;
  date: string; // YYYY-MM-DD

  throws_count: number;
  catches_count: number;
  conversations_started: number;
  messages_sent: number;

  created_at: string;
  updated_at: string;
}

// ============================================================================
// Block & Report Types
// ============================================================================

export interface UserBlock {
  id: number;
  blocker_telegram_id: string;
  blocked_telegram_id: string;
  created_at: string;
}

export type ReportStatus = 'pending' | 'reviewed' | 'actioned' | 'dismissed';

export interface Report {
  id: number;
  reporter_telegram_id: string;
  reported_telegram_id: string;
  conversation_id?: number;

  reason: string;
  description?: string;

  status: ReportStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  action_taken?: string;

  created_at: string;
}

// ============================================================================
// Appeal Types
// ============================================================================

export type AppealStatus = 'pending' | 'approved' | 'rejected';

export interface Appeal {
  id: number;
  telegram_id: string;

  reason: string;
  description?: string;

  status: AppealStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  admin_notes?: string;

  created_at: string;
}

// ============================================================================
// Payment Types
// ============================================================================

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: number;
  telegram_id: string;
  telegram_payment_id: string;

  amount: number;
  currency: string;

  vip_duration_days: number;
  vip_start_date?: string;
  vip_end_date?: string;

  status: PaymentStatus;

  created_at: string;
  completed_at?: string;
}

// ============================================================================
// Broadcast Types
// ============================================================================

export type BroadcastStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface BroadcastQueue {
  id: number;
  admin_telegram_id: string;

  message_text: string;

  target_gender?: string;
  target_min_age?: number;
  target_max_age?: number;
  target_zodiac?: string;
  target_language?: string;
  only_vip: number;

  status: BroadcastStatus;
  total_targets: number;
  sent_count: number;
  failed_count: number;

  created_at: string;
  started_at?: string;
  completed_at?: string;
}

// ============================================================================
// Admin Types
// ============================================================================

export interface AdminLog {
  id: number;
  admin_telegram_id: string;
  action: string;
  target_telegram_id?: string;
  details?: string; // JSON
  created_at: string;
}

export interface FeatureFlag {
  id: number;
  flag_name: string;
  is_enabled: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Telegram Types
// ============================================================================

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
  pre_checkout_query?: TelegramPreCheckoutQuery;
  successful_payment?: TelegramSuccessfulPayment;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  entities?: TelegramMessageEntity[];
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramMessageEntity {
  type: string;
  offset: number;
  length: number;
  url?: string;
  user?: TelegramUser;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

export interface TelegramPreCheckoutQuery {
  id: string;
  from: TelegramUser;
  currency: string;
  total_amount: number;
  invoice_payload: string;
}

export interface TelegramSuccessfulPayment {
  currency: string;
  total_amount: number;
  invoice_payload: string;
  telegram_payment_charge_id: string;
  provider_payment_charge_id: string;
}

// ============================================================================
// Domain Logic Types
// ============================================================================

export interface MatchCriteria {
  gender?: Gender;
  min_age?: number;
  max_age?: number;
  zodiac_signs?: string[];
  mbti_types?: string[];
  region?: string;
  require_anti_fraud?: boolean;
}

export interface RiskCheckResult {
  is_safe: boolean;
  risk_score: number;
  reasons: string[];
  should_block: boolean;
}

export interface TranslationResult {
  translated_text: string;
  provider: 'openai' | 'google';
  success: boolean;
  error?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PublicStats {
  total_users: number;
  total_bottles: number;
  total_messages: number;
  total_conversations: number;
  yesterday_bottles: number;
  yesterday_users: number;
  yesterday_messages: number;
}

export interface EligibilityResponse {
  eligible: boolean;
  reason?: string;
  user?: {
    telegram_id: string;
    nickname?: string;
    mbti_result?: string;
    zodiac_sign?: string;
  };
}

