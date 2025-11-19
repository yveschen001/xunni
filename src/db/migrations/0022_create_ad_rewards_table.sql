-- Migration: 0022_create_ad_rewards_table.sql
-- Create ad_rewards table for daily ad watching rewards
-- 
-- Purpose:
--   Track daily third-party video ad watching and quota rewards
--   Each user has one record per day (YYYY-MM-DD)
--
-- Business Rules:
--   - Max 20 ads per day per user
--   - Each ad completion grants +1 quota (temporary, resets daily)
--   - VIP users cannot watch ads
--
-- Future Extensions:
--   - Add ad_provider field to track which provider was used
--   - Add quality_score to track user satisfaction
--   - Add referral_source to track where user came from

CREATE TABLE IF NOT EXISTS ad_rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- User identification
  telegram_id TEXT NOT NULL,
  
  -- Date tracking (YYYY-MM-DD format)
  reward_date TEXT NOT NULL,
  
  -- Ad watching statistics
  ads_watched INTEGER DEFAULT 0 CHECK(ads_watched >= 0 AND ads_watched <= 20),
  quota_earned INTEGER DEFAULT 0 CHECK(quota_earned >= 0 AND quota_earned <= 20),
  
  -- Detailed ad statistics (for analytics)
  ad_views INTEGER DEFAULT 0,        -- How many times user clicked "watch ad"
  ad_completions INTEGER DEFAULT 0,  -- How many ads completed successfully
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  UNIQUE(telegram_id, reward_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ad_rewards_telegram_date 
  ON ad_rewards(telegram_id, reward_date);

CREATE INDEX IF NOT EXISTS idx_ad_rewards_date 
  ON ad_rewards(reward_date);

-- Comments for future developers
-- 
-- Usage Example:
--   SELECT * FROM ad_rewards 
--   WHERE telegram_id = '123456789' 
--     AND reward_date = '2025-01-18';
--
-- Daily Reset:
--   Records are kept forever for analytics
--   New day = new record (or reset if exists)
--
-- Extension Ideas:
--   - Add provider_stats JSON field for multi-provider tracking
--   - Add time_of_day field for hourly analysis
--   - Add device_type for platform analysis

