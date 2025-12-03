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
  CACHE?: KVNamespace; // 🚀 智能匹配缓存（成本优化，可选）
  I18N_DATA?: KVNamespace; // 🌍 i18n Data Store (Architecture Upgrade)
  ASSETS?: Fetcher;

  // Secrets
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_WEBHOOK_SECRET: string;
  TELEGRAM_API_ROOT?: string; // Optional: Custom Telegram API Root (default: https://api.telegram.org)
  OPENAI_API_KEY: string;
  OPENAI_MODEL?: string;
  GOOGLE_TRANSLATE_API_KEY?: string;
  GOOGLE_GEMINI_API_KEY?: string;
  GEMINI_PROJECT_ID?: string;
  GEMINI_LOCATION?: string;
  GEMINI_MODELS?: string;
  MOONPACKET_API_KEY?: string; // New MoonPacket API Key

  // Environment variables
  ENVIRONMENT: 'development' | 'staging' | 'production';
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  BROADCAST_BATCH_SIZE: string;
  BROADCAST_MAX_JOBS: string;
  ENABLE_AI_MODERATION: string;
  ENABLE_TRANSLATION: string;
  ADMIN_LOG_GROUP_ID?: string; // Centralized Admin Log Group
  ADMIN_USER_IDS?: string; // Comma-separated list of admin Telegram IDs
  SUPER_ADMIN_USER_ID?: string; // Super Admin Telegram ID
  VIP_PRICE_STARS?: string; // VIP Price in Stars
  OFFICIAL_CHANNEL_ID?: string; // Official Channel ID
  PUBLIC_URL?: string; // Public URL of the worker
  ENABLE_VIP_SUBSCRIPTION?: string; // Enable VIP subscription
  ENABLE_SMART_MATCHING?: string; // Enable Smart Matching
  SMART_MATCHING_THRESHOLD?: string; // Smart Matching Threshold
  MOONPACKET_API_KEY?: string; // MoonPacket API Key
  MOONPACKET_API_SECRET?: string; // MoonPacket API Secret for signature verification
}

// ============================================================================
// User Types
// ============================================================================

export type Gender = 'male' | 'female';
export type Role = 'user' | 'group_admin' | 'angel' | 'god';
export type TrustLevel = 'new' | 'basic' | 'trusted' | 'verified';
export type OnboardingStep =
  | 'language_selection'
  | 'region_selection' // New Geo Flow
  | 'country_selection'
  | 'city_search'
  | 'city_confirm'
  | 'start'
  | 'nickname'
  | 'avatar'
  | 'gender'
  | 'birthday'
  | 'blood_type'
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
  avatar_blurred_url?: string; // Cached blurred avatar URL for free users
  avatar_file_id?: string; // Telegram file_id for smart avatar update detection
  avatar_updated_at?: string; // Last time avatar was updated
  gender?: Gender;
  birthday?: string; // YYYY-MM-DD
  birth_time?: string; // HH:mm
  birth_city?: string;
  birth_location_lat?: number;
  birth_location_lng?: number;
  age?: number;
  city?: string;
  bio?: string;
  interests?: string; // JSON array
  job_role?: string;
  industry?: string;
  region?: string;
  match_preference?: 'male' | 'female' | 'any'; // Preferred match gender
  country_code?: string; // ISO 3166-1 alpha-2 country code for flag display
  lat?: number;
  lng?: number;
  timezone?: string;
  allow_matching?: number;

  // MBTI & Tests
  mbti_result?: string;
  mbti_source?: 'manual' | 'test';
  mbti_completed_at?: string;
  zodiac_sign?: string;
  blood_type?: string; // Blood type (A, B, AB, O)
  anti_fraud_score: number;
  anti_fraud_completed_at?: string;
  tutorial_completed?: number;

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
  last_active_at?: string; // Last time user was active
}

// ============================================================================
// Fortune Telling Types
// ============================================================================

export type FortuneType =
  | 'daily'
  | 'weekly'
  | 'deep'
  | 'match'
  | 'celebrity'
  | 'ziwei'
  | 'astrology'
  | 'tarot'
  | 'bazi'
  | 'love_ideal'
  | 'love_match';

export interface FortuneHistory {
  id: number;
  telegram_id: string;
  type: FortuneType;
  target_date?: string; // YYYY-MM-DD
  target_person_name?: string;
  target_person_birth?: string;
  content: string;
  provider?: string;
  model?: string;
  tokens_used?: number;
  created_at: string;
  profile_snapshot?: string; // JSON
  target_user_id?: string;
}

export interface FortuneProfile {
  id: number;
  user_id: string;
  name: string;
  gender?: Gender;
  birth_date: string;
  birth_time?: string;
  is_birth_time_unknown: number;
  birth_city?: string;
  birth_location_lat?: number;
  birth_location_lng?: number;
  blood_type?: string;
  is_default: number;
  is_subscribed: number;
  created_at: string;
  updated_at: string;
}

export interface FortuneQuota {
  id: number;
  telegram_id: string;
  weekly_free_quota: number;
  additional_quota: number;
  last_reset_at?: string;
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
  photo?: Array<{
    file_id: string;
    file_unique_id: string;
    width: number;
    height: number;
    file_size?: number;
  }>;
  document?: {
    file_id: string;
    file_unique_id: string;
    file_name?: string;
    mime_type?: string;
    file_size?: number;
  };
  video?: {
    file_id: string;
    file_unique_id: string;
    width: number;
    height: number;
    duration: number;
    file_size?: number;
  };
  audio?: { file_id: string; file_unique_id: string; duration: number; file_size?: number };
  voice?: { file_id: string; file_unique_id: string; duration: number; file_size?: number };
  video_note?: {
    file_id: string;
    file_unique_id: string;
    length: number;
    duration: number;
    file_size?: number;
  };
  sticker?: {
    file_id: string;
    file_unique_id: string;
    width: number;
    height: number;
    is_animated: boolean;
    is_video: boolean;
  };
  animation?: {
    file_id: string;
    file_unique_id: string;
    width: number;
    height: number;
    duration: number;
    file_size?: number;
  };
  reply_to_message?: TelegramMessage;
  successful_payment?: TelegramSuccessfulPayment;
  refunded_payment?: TelegramRefundedPayment;
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface InlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
  web_app?: { url: string };
  login_url?: {
    url: string;
    forward_text?: string;
    bot_username?: string;
    request_write_access?: boolean;
  };
  switch_inline_query?: string;
  switch_inline_query_current_chat?: string;
  pay?: boolean;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
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

// Alias for convenience
export type CallbackQuery = TelegramCallbackQuery;

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

export interface TelegramRefundedPayment {
  currency: string;
  total_amount: number;
  invoice_payload: string;
  telegram_payment_charge_id: string;
  provider_payment_charge_id?: string;
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
