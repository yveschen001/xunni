-- Migration: 0029_create_user_sessions.sql
-- FIXED: Use telegram_id instead of user_id to match 0001 schema

CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Session identification
  session_id TEXT NOT NULL UNIQUE,
  telegram_id TEXT NOT NULL,
  
  -- Session timing
  session_start TEXT DEFAULT CURRENT_TIMESTAMP,
  session_end TEXT,
  session_duration_seconds INTEGER,
  
  -- Session statistics
  events_count INTEGER DEFAULT 0,
  bottles_thrown INTEGER DEFAULT 0,
  bottles_caught INTEGER DEFAULT 0,
  ads_watched INTEGER DEFAULT 0,
  conversations_started INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  
  -- Session outcomes
  vip_converted INTEGER DEFAULT 0 CHECK(vip_converted IN (0, 1)),
  invite_sent INTEGER DEFAULT 0 CHECK(invite_sent IN (0, 1)),
  ad_completed INTEGER DEFAULT 0 CHECK(ad_completed IN (0, 1)),
  
  -- Device and environment
  user_language TEXT,
  user_timezone TEXT,
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
-- Comment out indexes if they cause trouble during migration application due to parsing quirks
-- CREATE INDEX IF NOT EXISTS idx_user_sessions_telegram_id ON user_sessions(telegram_id);
-- CREATE INDEX IF NOT EXISTS idx_user_sessions_start ON user_sessions(session_start);
-- CREATE INDEX IF NOT EXISTS idx_user_sessions_vip_converted ON user_sessions(vip_converted);
-- CREATE INDEX IF NOT EXISTS idx_user_sessions_duration ON user_sessions(session_duration_seconds);
