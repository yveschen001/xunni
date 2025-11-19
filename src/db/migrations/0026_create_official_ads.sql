-- Migration: 0026_create_official_ads.sql
-- Official ads system for XunNi's own promotions
--
-- Purpose:
--   Enable XunNi to create text/link/group/channel ads
--   Instant rewards (no video watching required)
--   One-time display per user (no spam)
--
-- Business Value:
--   - Promote official content (groups, channels, features)
--   - Increase community engagement
--   - Permanent quota rewards (better than temp ad quota)
--   - No daily limit (unlike third-party ads)
--
-- Future Extensions:
--   - Add targeting rules (user_age, user_type, language)
--   - Add A/B testing support (variant_id field)
--   - Add scheduling (day_of_week, time_of_day)

-- Official ads table
CREATE TABLE IF NOT EXISTS official_ads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Ad type and content
  ad_type TEXT NOT NULL CHECK(ad_type IN ('text', 'link', 'group', 'channel')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  
  -- URL (required for link/group/channel types)
  url TEXT,
  
  -- Target entity (for verification)
  target_entity_id TEXT,                        -- Group ID or Channel username
  
  -- Reward configuration
  reward_quota INTEGER DEFAULT 1 CHECK(reward_quota >= 1 AND reward_quota <= 10),
  requires_verification INTEGER DEFAULT 0 CHECK(requires_verification IN (0, 1)),
  
  -- Status and scheduling
  is_enabled INTEGER DEFAULT 1 CHECK(is_enabled IN (0, 1)),
  start_date TEXT,                              -- YYYY-MM-DD (optional)
  end_date TEXT,                                -- YYYY-MM-DD (optional)
  
  -- View limits
  max_views INTEGER,                            -- Max total views (optional)
  current_views INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Official ad views table (one record per user per ad)
CREATE TABLE IF NOT EXISTS official_ad_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- User and ad
  telegram_id TEXT NOT NULL,
  ad_id INTEGER NOT NULL,
  
  -- View tracking
  viewed_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  -- Click tracking
  clicked INTEGER DEFAULT 0 CHECK(clicked IN (0, 1)),
  clicked_at TEXT,
  
  -- Verification tracking (for group/channel types)
  verified INTEGER DEFAULT 0 CHECK(verified IN (0, 1)),
  verified_at TEXT,
  
  -- Reward tracking
  reward_granted INTEGER DEFAULT 0 CHECK(reward_granted IN (0, 1)),
  reward_granted_at TEXT,
  
  -- Constraints
  UNIQUE(telegram_id, ad_id),
  FOREIGN KEY (ad_id) REFERENCES official_ads(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_official_ads_enabled 
  ON official_ads(is_enabled, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_official_ads_type 
  ON official_ads(ad_type);

CREATE INDEX IF NOT EXISTS idx_official_ad_views_telegram 
  ON official_ad_views(telegram_id);

CREATE INDEX IF NOT EXISTS idx_official_ad_views_ad 
  ON official_ad_views(ad_id);

CREATE INDEX IF NOT EXISTS idx_official_ad_views_reward 
  ON official_ad_views(reward_granted);

-- Comments for ad types
--
-- Type 1: Text (純文字公告)
--   - No URL required
--   - Click to claim reward
--   - Use case: Announcements, updates
--
-- Type 2: Link (鏈接推廣)
--   - URL required
--   - Click link to claim reward
--   - Use case: Mini App, website, features
--
-- Type 3: Group (群組邀請)
--   - URL required (group invite link)
--   - Optional verification (bot checks membership)
--   - Higher reward (e.g., 2 quota)
--   - Use case: Community building
--
-- Type 4: Channel (頻道訂閱)
--   - URL required (channel link)
--   - Optional verification (bot checks subscription)
--   - Higher reward (e.g., 2 quota)
--   - Use case: Official announcements
--
-- Verification Flow:
--   1. User clicks ad
--   2. User joins group/channel
--   3. User clicks "Verify" button
--   4. Bot checks membership via Telegram API
--   5. If verified, grant reward
--
-- Extension Ideas:
--   - Add priority field for display order
--   - Add category field for grouping
--   - Add image_url for visual ads
--   - Add button_text for customization

