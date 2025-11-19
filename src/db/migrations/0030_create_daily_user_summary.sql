-- Migration: 0030_create_daily_user_summary.sql
-- Daily user behavior summary for fast queries
--
-- Purpose:
--   Pre-aggregate daily user metrics for performance
--   Enable fast cohort analysis and retention calculations
--   Reduce load on analytics_events table
--
-- Update Strategy:
--   - Updated in real-time as events occur
--   - Or batch updated at end of day via cron job
--
-- Future Extensions:
--   - Add revenue_generated for monetization tracking
--   - Add engagement_score (weighted metric)
--   - Add churn_risk_score for prediction

CREATE TABLE IF NOT EXISTS daily_user_summary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- User and date
  user_id TEXT NOT NULL,
  summary_date TEXT NOT NULL,                   -- YYYY-MM-DD
  
  -- User profile
  user_type TEXT,                               -- 'free' | 'vip'
  user_age_days INTEGER,                        -- Days since registration
  
  -- Activity metrics
  is_active INTEGER DEFAULT 0 CHECK(is_active IN (0, 1)),
  session_count INTEGER DEFAULT 0,
  total_duration_seconds INTEGER DEFAULT 0,
  
  -- Content interaction
  bottles_thrown INTEGER DEFAULT 0,
  bottles_caught INTEGER DEFAULT 0,
  conversations_started INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  
  -- Ad interaction
  ads_viewed INTEGER DEFAULT 0,
  ads_completed INTEGER DEFAULT 0,
  official_ads_clicked INTEGER DEFAULT 0,
  
  -- Invite behavior
  invites_sent INTEGER DEFAULT 0,
  invites_accepted INTEGER DEFAULT 0,
  
  -- VIP interaction
  vip_page_views INTEGER DEFAULT 0,
  vip_converted INTEGER DEFAULT 0 CHECK(vip_converted IN (0, 1)),
  
  -- Quota usage
  quota_used INTEGER DEFAULT 0,
  quota_from_ads INTEGER DEFAULT 0,
  quota_from_invites INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  UNIQUE(user_id, summary_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_user_summary_user 
  ON daily_user_summary(user_id);

CREATE INDEX IF NOT EXISTS idx_daily_user_summary_date 
  ON daily_user_summary(summary_date);

CREATE INDEX IF NOT EXISTS idx_daily_user_summary_active 
  ON daily_user_summary(is_active);

CREATE INDEX IF NOT EXISTS idx_daily_user_summary_type 
  ON daily_user_summary(user_type);

CREATE INDEX IF NOT EXISTS idx_daily_user_summary_user_age 
  ON daily_user_summary(user_age_days);

-- Composite indexes for retention analysis
CREATE INDEX IF NOT EXISTS idx_daily_user_summary_user_date_active 
  ON daily_user_summary(user_id, summary_date, is_active);

-- Comments for key queries
--
-- 1. Daily Active Users (DAU):
--    SELECT summary_date, COUNT(*) as dau
--    FROM daily_user_summary
--    WHERE is_active = 1
--    GROUP BY summary_date;
--
-- 2. Retention Rate (Day 1):
--    WITH cohort AS (
--      SELECT user_id, MIN(summary_date) as registration_date
--      FROM daily_user_summary
--      GROUP BY user_id
--    )
--    SELECT 
--      c.registration_date,
--      COUNT(DISTINCT c.user_id) as cohort_size,
--      COUNT(DISTINCT CASE WHEN d.is_active = 1 THEN d.user_id END) as d1_retained,
--      ROUND(COUNT(DISTINCT CASE WHEN d.is_active = 1 THEN d.user_id END) * 100.0 / 
--            COUNT(DISTINCT c.user_id), 2) as d1_retention_rate
--    FROM cohort c
--    LEFT JOIN daily_user_summary d 
--      ON c.user_id = d.user_id 
--      AND d.summary_date = date(c.registration_date, '+1 day')
--    GROUP BY c.registration_date;
--
-- 3. Average engagement by user age:
--    SELECT 
--      user_age_days,
--      AVG(bottles_thrown) as avg_throws,
--      AVG(session_count) as avg_sessions,
--      AVG(total_duration_seconds) / 60.0 as avg_minutes
--    FROM daily_user_summary
--    WHERE is_active = 1
--    GROUP BY user_age_days
--    ORDER BY user_age_days;
--
-- 4. VIP conversion by user age:
--    SELECT 
--      user_age_days,
--      COUNT(*) as users,
--      SUM(vip_converted) as conversions,
--      ROUND(SUM(vip_converted) * 100.0 / COUNT(*), 2) as conversion_rate
--    FROM daily_user_summary
--    GROUP BY user_age_days
--    ORDER BY user_age_days;
--
-- Update Example (real-time):
--   INSERT INTO daily_user_summary (user_id, summary_date, bottles_thrown)
--   VALUES ('123456789', '2025-01-18', 1)
--   ON CONFLICT(user_id, summary_date) 
--   DO UPDATE SET 
--     bottles_thrown = bottles_thrown + 1,
--     is_active = 1;
--
-- Extension Ideas:
--   - Add first_action_time and last_action_time
--   - Add most_active_hour for time-of-day analysis
--   - Add feature_usage_flags (JSON) for feature adoption tracking
--   - Add social_interactions (replies, reactions) for community health

