-- Migration: 0029_create_user_sessions.sql
-- Track user sessions for journey analysis
--
-- Purpose:
--   Understand user behavior patterns within sessions
--   Calculate engagement metrics (session duration, actions per session)
--   Identify conversion paths (what leads to VIP purchase)
--
-- Session Definition:
--   A session starts when user sends first message
--   A session ends after 30 minutes of inactivity or explicit end
--
-- Future Extensions:
--   - Add entry_point (how user entered: command, button, etc.)
--   - Add exit_point (last action before leaving)
--   - Add conversion_value for revenue attribution

CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Session identification
  session_id TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  
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
CREATE INDEX IF NOT EXISTS idx_user_sessions_user 
  ON user_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_start 
  ON user_sessions(session_start);

CREATE INDEX IF NOT EXISTS idx_user_sessions_vip_converted 
  ON user_sessions(vip_converted);

CREATE INDEX IF NOT EXISTS idx_user_sessions_duration 
  ON user_sessions(session_duration_seconds);

-- Comments for session analysis
--
-- Key Metrics:
--
-- 1. Average session duration:
--    SELECT AVG(session_duration_seconds) / 60.0 as avg_minutes
--    FROM user_sessions
--    WHERE session_end IS NOT NULL;
--
-- 2. Sessions with VIP conversion:
--    SELECT COUNT(*) as conversion_sessions
--    FROM user_sessions
--    WHERE vip_converted = 1;
--
-- 3. Average actions per session:
--    SELECT 
--      AVG(events_count) as avg_events,
--      AVG(bottles_thrown) as avg_throws,
--      AVG(ads_watched) as avg_ads
--    FROM user_sessions;
--
-- 4. Conversion path analysis:
--    SELECT 
--      AVG(CASE WHEN vip_converted = 1 THEN ads_watched ELSE NULL END) as avg_ads_before_vip,
--      AVG(CASE WHEN vip_converted = 1 THEN session_duration_seconds ELSE NULL END) / 60.0 as avg_minutes_before_vip
--    FROM user_sessions;
--
-- Session ID Generation:
--   Format: {user_id}_{timestamp}_{random}
--   Example: 123456789_1705564800_a1b2c3
--
-- Extension Ideas:
--   - Add session_quality score (engagement metric)
--   - Add bounce_rate (single-action sessions)
--   - Add return_visit_count for loyalty tracking
--   - Add device_type for platform analysis

