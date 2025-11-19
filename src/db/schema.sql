-- XunNi Database Schema
-- Based on @doc/SPEC.md specifications
-- DO NOT modify this file directly - use migrations instead

-- ============================================================================
-- 1. Users Table (使用者)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT NOT NULL UNIQUE,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  language_pref TEXT DEFAULT 'zh-TW',
  
  -- Profile fields
  nickname TEXT,
  avatar_url TEXT,
  gender TEXT CHECK(gender IN ('male', 'female')),
  birthday TEXT,  -- YYYY-MM-DD format
  age INTEGER,
  city TEXT,
  bio TEXT,
  interests TEXT,  -- JSON array of interest tags
  
  -- MBTI & Tests
  mbti_result TEXT,  -- e.g., "INTJ", "ENFP"
  mbti_completed_at TEXT,
  zodiac_sign TEXT,  -- e.g., "Aries", "Taurus"
  anti_fraud_score INTEGER DEFAULT 0,
  anti_fraud_completed_at TEXT,
  
  -- Onboarding
  onboarding_step TEXT DEFAULT 'start',
  onboarding_completed_at TEXT,
  
  -- VIP status
  is_vip INTEGER DEFAULT 0,
  vip_expire_at TEXT,
  
  -- Invitation & Usage
  invite_code TEXT UNIQUE,
  invited_by TEXT,  -- telegram_id of inviter
  successful_invites INTEGER DEFAULT 0,
  
  -- Trust & Risk
  trust_level TEXT DEFAULT 'new',
  risk_score INTEGER DEFAULT 0,
  
  -- Ban status
  is_banned INTEGER DEFAULT 0,
  ban_reason TEXT,
  banned_at TEXT,
  banned_until TEXT,
  ban_count INTEGER DEFAULT 0,
  
  -- Role (user, group_admin, angel, god)
  role TEXT DEFAULT 'user' CHECK(role IN ('user', 'group_admin', 'angel', 'god')),
  
  -- User rights
  deleted_at TEXT,
  anonymized_at TEXT,
  deletion_requested_at TEXT,
  
  -- Activity tracking (for smart broadcasting)
  last_active_at TEXT DEFAULT CURRENT_TIMESTAMP,
  bot_status TEXT DEFAULT 'active' CHECK(bot_status IN ('active', 'blocked', 'deleted', 'deactivated', 'invalid')),
  bot_status_updated_at TEXT,
  failed_delivery_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_invite_code ON users(invite_code);
CREATE INDEX idx_users_invited_by ON users(invited_by);
CREATE INDEX idx_users_is_banned ON users(is_banned);
CREATE INDEX idx_users_bot_status ON users(bot_status);
CREATE INDEX idx_users_last_active ON users(last_active_at);
CREATE INDEX idx_users_activity_status ON users(last_active_at, bot_status);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- ============================================================================
-- 2. Bottles Table (漂流瓶)
-- ============================================================================
CREATE TABLE IF NOT EXISTS bottles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_telegram_id TEXT NOT NULL,
  content TEXT NOT NULL,
  
  -- Matching criteria
  target_gender TEXT,
  target_min_age INTEGER,
  target_max_age INTEGER,
  target_zodiac_filter TEXT,  -- JSON array, e.g., ["Aries", "Taurus"]
  target_mbti_filter TEXT,    -- JSON array, e.g., ["INTJ", "ENFP"]
  target_region TEXT,
  require_anti_fraud INTEGER DEFAULT 1,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'matched', 'expired', 'deleted')),
  matched_with_telegram_id TEXT,
  matched_at TEXT,
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT,
  deleted_at TEXT
);

CREATE INDEX idx_bottles_owner ON bottles(owner_telegram_id);
CREATE INDEX idx_bottles_status ON bottles(status);
CREATE INDEX idx_bottles_expires_at ON bottles(expires_at);
CREATE INDEX idx_bottles_matched_with ON bottles(matched_with_telegram_id);

-- ============================================================================
-- 3. Conversations Table (對話)
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_a_telegram_id TEXT NOT NULL,
  user_b_telegram_id TEXT NOT NULL,
  bottle_id INTEGER NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'ended', 'blocked')),
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_message_at TEXT,
  ended_at TEXT,
  
  FOREIGN KEY (bottle_id) REFERENCES bottles(id)
);

CREATE INDEX idx_conversations_user_a ON conversations(user_a_telegram_id);
CREATE INDEX idx_conversations_user_b ON conversations(user_b_telegram_id);
CREATE INDEX idx_conversations_bottle_id ON conversations(bottle_id);
CREATE INDEX idx_conversations_status ON conversations(status);

-- ============================================================================
-- 4. Conversation Messages Table (對話訊息)
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversation_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  sender_telegram_id TEXT NOT NULL,
  receiver_telegram_id TEXT NOT NULL,
  
  -- Message content
  original_text TEXT NOT NULL,
  translated_text TEXT,
  translation_provider TEXT,  -- 'openai' or 'google'
  
  -- Status
  is_blocked_by_ai INTEGER DEFAULT 0,
  ai_block_reason TEXT,
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

CREATE INDEX idx_conv_messages_conversation ON conversation_messages(conversation_id);
CREATE INDEX idx_conv_messages_sender ON conversation_messages(sender_telegram_id);
CREATE INDEX idx_conv_messages_created_at ON conversation_messages(created_at);

-- ============================================================================
-- 5. Daily Usage Table (每日使用次數)
-- ============================================================================
CREATE TABLE IF NOT EXISTS daily_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT NOT NULL,
  date TEXT NOT NULL,  -- YYYY-MM-DD
  
  -- Bottle usage
  throws_count INTEGER DEFAULT 0,
  catches_count INTEGER DEFAULT 0,
  
  -- Conversation usage
  conversations_started INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(telegram_id, date)
);

CREATE INDEX idx_daily_usage_telegram_id_date ON daily_usage(telegram_id, date);

-- ============================================================================
-- 6. User Blocks Table (使用者封鎖)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  blocker_telegram_id TEXT NOT NULL,
  blocked_telegram_id TEXT NOT NULL,
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(blocker_telegram_id, blocked_telegram_id)
);

CREATE INDEX idx_user_blocks_blocker ON user_blocks(blocker_telegram_id);
CREATE INDEX idx_user_blocks_blocked ON user_blocks(blocked_telegram_id);

-- ============================================================================
-- 7. Reports Table (舉報)
-- ============================================================================
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_telegram_id TEXT NOT NULL,
  reported_telegram_id TEXT NOT NULL,
  conversation_id INTEGER,
  
  -- Report details
  reason TEXT NOT NULL,
  description TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  reviewed_by TEXT,  -- admin telegram_id
  reviewed_at TEXT,
  action_taken TEXT,
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

CREATE INDEX idx_reports_reporter ON reports(reporter_telegram_id);
CREATE INDEX idx_reports_reported ON reports(reported_telegram_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at);

-- ============================================================================
-- 8. Appeals Table (申訴)
-- ============================================================================
CREATE TABLE IF NOT EXISTS appeals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT NOT NULL,
  
  -- Appeal details
  reason TEXT NOT NULL,
  description TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  reviewed_by TEXT,  -- admin telegram_id
  reviewed_at TEXT,
  admin_notes TEXT,
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_appeals_telegram_id ON appeals(telegram_id);
CREATE INDEX idx_appeals_status ON appeals(status);
CREATE INDEX idx_appeals_created_at ON appeals(created_at);

-- ============================================================================
-- 9. Payments Table (付款記錄)
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT NOT NULL,
  telegram_payment_id TEXT NOT NULL UNIQUE,
  
  -- Payment details
  amount INTEGER NOT NULL,  -- in Telegram Stars
  currency TEXT DEFAULT 'XTR',
  
  -- VIP details
  vip_duration_days INTEGER DEFAULT 30,
  vip_start_date TEXT,
  vip_end_date TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed', 'refunded')),
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);

CREATE INDEX idx_payments_telegram_id ON payments(telegram_id);
CREATE INDEX idx_payments_telegram_payment_id ON payments(telegram_payment_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ============================================================================
-- 10. Broadcast Queue Table (群發隊列)
-- ============================================================================
CREATE TABLE IF NOT EXISTS broadcast_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_telegram_id TEXT NOT NULL,
  
  -- Message content
  message_text TEXT NOT NULL,
  
  -- Filters
  target_gender TEXT,
  target_min_age INTEGER,
  target_max_age INTEGER,
  target_zodiac TEXT,
  target_language TEXT,
  only_vip INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
  total_targets INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  started_at TEXT,
  completed_at TEXT
);

CREATE INDEX idx_broadcast_queue_status ON broadcast_queue(status);
CREATE INDEX idx_broadcast_queue_admin ON broadcast_queue(admin_telegram_id);

-- ============================================================================
-- 11. Admin Logs Table (管理員操作日誌)
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_telegram_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_telegram_id TEXT,
  
  -- Details
  details TEXT,  -- JSON object
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_logs_admin ON admin_logs(admin_telegram_id);
CREATE INDEX idx_admin_logs_action ON admin_logs(action);
CREATE INDEX idx_admin_logs_target ON admin_logs(target_telegram_id);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at);

-- ============================================================================
-- 12. Feature Flags Table (功能開關)
-- ============================================================================
CREATE TABLE IF NOT EXISTS feature_flags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  flag_name TEXT NOT NULL UNIQUE,
  is_enabled INTEGER DEFAULT 0,
  description TEXT,
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feature_flags_name ON feature_flags(flag_name);

-- ============================================================================
-- 13. Horoscope Push History Table (星座運勢推送記錄)
-- ============================================================================
CREATE TABLE IF NOT EXISTS horoscope_push_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT NOT NULL,
  zodiac_sign TEXT NOT NULL,
  week_start TEXT NOT NULL,  -- YYYY-MM-DD (Monday)
  
  -- Status
  status TEXT DEFAULT 'sent' CHECK(status IN ('sent', 'failed')),
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(telegram_id, week_start)
);

CREATE INDEX idx_horoscope_push_telegram_id ON horoscope_push_history(telegram_id);
CREATE INDEX idx_horoscope_push_week_start ON horoscope_push_history(week_start);

-- ============================================================================
-- 14. Bans Table (封禁記錄)
-- ============================================================================
CREATE TABLE IF NOT EXISTS bans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  risk_snapshot INTEGER DEFAULT 0,
  ban_start TEXT NOT NULL,
  ban_end TEXT,  -- NULL = permanent ban
  banned_by TEXT,  -- Admin's telegram_id who banned the user
  is_active INTEGER DEFAULT 1,  -- 1 = active, 0 = inactive
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(telegram_id)
);

CREATE INDEX idx_bans_user_id ON bans(user_id);
CREATE INDEX idx_bans_ban_end ON bans(ban_end);
CREATE INDEX idx_bans_created_at ON bans(created_at);
CREATE INDEX idx_bans_banned_by ON bans(banned_by);
CREATE INDEX idx_bans_is_active ON bans(is_active);

-- ============================================================================
-- 15. Appeals Table (申訴記錄)
-- ============================================================================
CREATE TABLE IF NOT EXISTS appeals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  ban_id INTEGER,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  reviewed_by TEXT,
  review_notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT
);

CREATE INDEX idx_appeals_user_id ON appeals(user_id);
CREATE INDEX idx_appeals_status ON appeals(status);
CREATE INDEX idx_appeals_created_at ON appeals(created_at);

-- ============================================================================
-- 16. Broadcasts Table (廣播記錄)
-- ============================================================================
CREATE TABLE IF NOT EXISTS broadcasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK(target_type IN ('all', 'vip', 'non_vip')),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sending', 'completed', 'failed', 'cancelled')),
  total_users INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  blocked_count INTEGER DEFAULT 0,
  deleted_count INTEGER DEFAULT 0,
  invalid_count INTEGER DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  started_at TEXT,
  completed_at TEXT,
  error_message TEXT
);
CREATE INDEX idx_broadcasts_status ON broadcasts(status);
CREATE INDEX idx_broadcasts_created_by ON broadcasts(created_by);
CREATE INDEX idx_broadcasts_created_at ON broadcasts(created_at);

-- ============================================================================
-- 17. Maintenance Mode Table (維護模式配置)
-- ============================================================================
CREATE TABLE IF NOT EXISTS maintenance_mode (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  is_active INTEGER DEFAULT 0,
  start_time TEXT,
  end_time TEXT,
  estimated_duration INTEGER,
  maintenance_message TEXT,
  enabled_by TEXT,
  enabled_at TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO maintenance_mode (id, is_active) VALUES (1, 0);

-- ============================================================================
-- 18. Daily Stats Table (每日統計)
-- ============================================================================
CREATE TABLE IF NOT EXISTS daily_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stat_date TEXT NOT NULL UNIQUE,
  total_bottles INTEGER DEFAULT 0,
  new_bottles INTEGER DEFAULT 0,
  caught_bottles INTEGER DEFAULT 0,
  total_conversations INTEGER DEFAULT 0,
  new_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  new_messages INTEGER DEFAULT 0,
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  total_vip INTEGER DEFAULT 0,
  new_vip INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_daily_stats_date ON daily_stats(stat_date);
CREATE INDEX idx_daily_stats_created_at ON daily_stats(created_at);

-- ============================================================================
-- Initial Data
-- ============================================================================

-- Insert default feature flags
INSERT OR IGNORE INTO feature_flags (flag_name, is_enabled, description) VALUES
  ('enable_ai_moderation', 1, 'Enable OpenAI content moderation'),
  ('enable_translation', 1, 'Enable message translation for VIP users'),
  ('enable_horoscope_push', 1, 'Enable weekly horoscope push notifications'),
  ('enable_mini_app', 1, 'Enable Telegram Mini App features'),
  ('enable_invite_system', 1, 'Enable user invitation system');

