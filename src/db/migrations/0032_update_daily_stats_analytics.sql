-- Migration: 0032_update_daily_stats_analytics.sql
-- Add comprehensive analytics dimensions to daily_stats
-- FIXED: Comment out columns that might already exist due to schema merges or partial applies

-- User engagement metrics
ALTER TABLE daily_stats ADD COLUMN total_sessions INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN avg_session_duration_seconds INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN dau INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN wau INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN mau INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN stickiness_ratio REAL DEFAULT 0.0;  -- DAU/MAU

-- Third-party ad metrics (enhanced)
ALTER TABLE daily_stats ADD COLUMN total_ad_impressions INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN total_ad_clicks INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN total_ad_starts INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN total_ad_errors INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN ad_ctr REAL DEFAULT 0.0;  -- Click-Through Rate
ALTER TABLE daily_stats ADD COLUMN ad_start_rate REAL DEFAULT 0.0;  -- Start / Impressions

-- Official ad metrics
-- ALTER TABLE daily_stats ADD COLUMN official_ad_impressions INTEGER DEFAULT 0;
-- ALTER TABLE daily_stats ADD COLUMN official_ad_clicks INTEGER DEFAULT 0;
-- ALTER TABLE daily_stats ADD COLUMN official_ad_completions INTEGER DEFAULT 0;
-- ALTER TABLE daily_stats ADD COLUMN official_ad_ctr REAL DEFAULT 0.0;

-- VIP conversion funnel metrics
ALTER TABLE daily_stats ADD COLUMN vip_awareness_count INTEGER DEFAULT 0;  -- Saw VIP prompt
ALTER TABLE daily_stats ADD COLUMN vip_interest_count INTEGER DEFAULT 0;   -- Clicked VIP
ALTER TABLE daily_stats ADD COLUMN vip_page_views INTEGER DEFAULT 0;       -- Viewed details
ALTER TABLE daily_stats ADD COLUMN vip_purchase_intents INTEGER DEFAULT 0; -- Clicked purchase
ALTER TABLE daily_stats ADD COLUMN vip_conversions INTEGER DEFAULT 0;      -- Completed purchase
ALTER TABLE daily_stats ADD COLUMN vip_conversion_rate REAL DEFAULT 0.0;   -- Conversions / Awareness
ALTER TABLE daily_stats ADD COLUMN vip_revenue REAL DEFAULT 0.0;

-- Invite metrics (enhanced)
ALTER TABLE daily_stats ADD COLUMN invites_sent INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN invites_link_clicked INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN invites_accepted INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN invites_activated INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN invite_conversion_rate REAL DEFAULT 0.0;  -- Activated / Sent
ALTER TABLE daily_stats ADD COLUMN k_factor REAL DEFAULT 0.0;  -- Viral coefficient

-- Content engagement metrics (enhanced)
ALTER TABLE daily_stats ADD COLUMN avg_bottles_per_user REAL DEFAULT 0.0;
ALTER TABLE daily_stats ADD COLUMN avg_conversations_per_user REAL DEFAULT 0.0;
ALTER TABLE daily_stats ADD COLUMN avg_messages_per_conversation REAL DEFAULT 0.0;
ALTER TABLE daily_stats ADD COLUMN conversation_rate REAL DEFAULT 0.0;  -- Conversations / Catches

-- Retention metrics
ALTER TABLE daily_stats ADD COLUMN d1_retention_rate REAL DEFAULT 0.0;
ALTER TABLE daily_stats ADD COLUMN d7_retention_rate REAL DEFAULT 0.0;
ALTER TABLE daily_stats ADD COLUMN d30_retention_rate REAL DEFAULT 0.0;

-- Health metrics
ALTER TABLE daily_stats ADD COLUMN report_rate REAL DEFAULT 0.0;  -- Reports / Messages
ALTER TABLE daily_stats ADD COLUMN ban_rate REAL DEFAULT 0.0;     -- Bans / Active Users
ALTER TABLE daily_stats ADD COLUMN churn_rate REAL DEFAULT 0.0;   -- Inactive / Total
