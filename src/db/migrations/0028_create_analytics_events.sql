-- Migration: 0028_create_analytics_events.sql
-- Core analytics events table for tracking all user behaviors
--
-- Purpose:
--   Single source of truth for all user events
--   Enable comprehensive user journey analysis
--   Support data-driven business decisions
--
-- Design Philosophy:
--   - Event-driven architecture
--   - Flexible event_data JSON field for extensibility
--   - Optimized for both real-time queries and batch analysis
--
-- Future Extensions:
--   - Add event_version for schema evolution
--   - Add correlation_id for cross-event tracking
--   - Add experiment_id for A/B test analysis

CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Event identification
  event_type TEXT NOT NULL,                     -- e.g., 'user_registered', 'ad_complete'
  event_category TEXT NOT NULL,                 -- 'user' | 'ad' | 'vip' | 'invite' | 'content'
  
  -- User information
  user_id TEXT NOT NULL,                        -- telegram_id
  user_type TEXT,                               -- 'free' | 'vip'
  user_age_days INTEGER,                        -- Days since registration
  
  -- Event details (JSON for flexibility)
  event_data TEXT,                              -- JSON string with event-specific data
  
  -- Ad-specific fields (nullable for non-ad events)
  ad_provider TEXT,
  ad_id INTEGER,
  ad_type TEXT,                                 -- 'third_party' | 'official'
  
  -- Session tracking
  session_id TEXT,                              -- For user journey analysis
  
  -- Device and environment
  user_language TEXT,
  user_timezone TEXT,
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  event_date TEXT,                              -- YYYY-MM-DD (for fast date queries)
  event_hour INTEGER                            -- 0-23 (for hourly analysis)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_type 
  ON analytics_events(event_type);

CREATE INDEX IF NOT EXISTS idx_analytics_events_category 
  ON analytics_events(event_category);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user 
  ON analytics_events(user_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_date 
  ON analytics_events(event_date);

CREATE INDEX IF NOT EXISTS idx_analytics_events_hour 
  ON analytics_events(event_hour);

CREATE INDEX IF NOT EXISTS idx_analytics_events_session 
  ON analytics_events(session_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_ad_provider 
  ON analytics_events(ad_provider);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_date 
  ON analytics_events(user_id, event_date);

CREATE INDEX IF NOT EXISTS idx_analytics_events_category_date 
  ON analytics_events(event_category, event_date);

-- Comments for event types
--
-- User Lifecycle Events:
--   - user_registered: New user registration
--   - user_first_throw: First bottle thrown
--   - user_first_catch: First bottle caught
--   - user_first_conversation: First conversation started
--   - user_first_ad: First ad watched
--   - user_first_invite: First invite sent
--   - user_became_active: Became active user (3+ days)
--   - user_became_inactive: Became inactive (7+ days no activity)
--   - user_returned: Returned after being inactive
--
-- Ad Events:
--   - ad_impression: Ad display triggered
--   - ad_click: User clicked watch ad
--   - ad_start: Ad started playing
--   - ad_progress_25/50/75: Ad playback progress
--   - ad_complete: Ad completed successfully
--   - ad_error: Ad failed to load/play
--   - official_ad_impression/click/complete: Official ad events
--
-- VIP Events:
--   - vip_awareness: Saw VIP prompt
--   - vip_interest: Clicked to view VIP
--   - vip_consideration: Viewed VIP details
--   - vip_purchase_intent: Clicked purchase
--   - vip_purchase_success: Purchase completed
--   - vip_renewal: VIP renewed
--
-- Invite Events:
--   - invite_initiated: Sent invite
--   - invite_link_clicked: Invite link clicked
--   - invite_accepted: Invite accepted (registration)
--   - invite_activated: Invite activated (first throw)
--
-- Content Events:
--   - bottle_throw: Threw a bottle
--   - bottle_catch: Caught a bottle
--   - conversation_start: Started conversation
--   - conversation_message: Sent message
--   - conversation_end: Ended conversation
--   - report_submitted: Submitted report
--
-- Example Queries:
--
-- 1. Daily active users:
--    SELECT event_date, COUNT(DISTINCT user_id) as dau
--    FROM analytics_events
--    WHERE event_date >= '2025-01-01'
--    GROUP BY event_date;
--
-- 2. Ad completion rate:
--    SELECT 
--      COUNT(CASE WHEN event_type = 'ad_start' THEN 1 END) as starts,
--      COUNT(CASE WHEN event_type = 'ad_complete' THEN 1 END) as completions,
--      ROUND(COUNT(CASE WHEN event_type = 'ad_complete' THEN 1 END) * 100.0 / 
--            COUNT(CASE WHEN event_type = 'ad_start' THEN 1 END), 2) as completion_rate
--    FROM analytics_events
--    WHERE event_category = 'ad'
--      AND event_date = '2025-01-18';
--
-- 3. User journey (last 10 events):
--    SELECT event_type, event_data, created_at
--    FROM analytics_events
--    WHERE user_id = '123456789'
--    ORDER BY created_at DESC
--    LIMIT 10;
--
-- Extension Ideas:
--   - Add event_source ('telegram' | 'mini_app' | 'web')
--   - Add referrer_url for web traffic analysis
--   - Add ab_test_variant for experiment tracking
--   - Add revenue_amount for monetization events

