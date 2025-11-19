-- Migration: 0032_update_daily_stats_analytics.sql
-- Add comprehensive analytics dimensions to daily_stats
--
-- Purpose:
--   Enhance daily_stats with all key business metrics
--   Enable executive dashboard with single table query
--   Support data-driven decision making
--
-- Future Extensions:
--   - Add revenue_forecast based on trends
--   - Add health_score (composite metric)
--   - Add anomaly_detected flag for alerts

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
ALTER TABLE daily_stats ADD COLUMN official_ad_impressions INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN official_ad_clicks INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN official_ad_completions INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN official_ad_ctr REAL DEFAULT 0.0;

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

-- Comments for metric calculations
--
-- Stickiness Ratio:
--   stickiness_ratio = DAU / MAU
--   Higher is better (users come back more frequently)
--   Target: > 0.2 (20%)
--
-- Ad CTR (Click-Through Rate):
--   ad_ctr = (total_ad_clicks / total_ad_impressions) * 100
--   Industry average: 1-5%
--
-- Ad Start Rate:
--   ad_start_rate = (total_ad_starts / total_ad_impressions) * 100
--   Measures how many users actually start watching after clicking
--
-- VIP Conversion Rate:
--   vip_conversion_rate = (vip_conversions / vip_awareness_count) * 100
--   Full funnel conversion (awareness to purchase)
--
-- K-Factor (Viral Coefficient):
--   k_factor = (invites_sent / active_users) * (invites_activated / invites_sent)
--   k > 1 = viral growth (each user brings more than 1 new user)
--   k < 1 = need paid acquisition
--
-- Conversation Rate:
--   conversation_rate = (conversations_started / bottles_caught) * 100
--   Measures engagement quality
--
-- Retention Rate (Day N):
--   d1_retention_rate = (users_active_on_day_1 / users_registered_on_day_0) * 100
--   Cohort-based retention calculation
--
-- Report Rate:
--   report_rate = (reports_created / conversation_messages) * 100
--   Measures community health (lower is better)
--
-- Churn Rate:
--   churn_rate = (users_inactive_7_days / total_users) * 100
--   Measures user loss
--
-- Example Daily Stats Query:
--   SELECT 
--     stat_date,
--     dau,
--     mau,
--     stickiness_ratio,
--     vip_conversion_rate,
--     k_factor,
--     d1_retention_rate
--   FROM daily_stats
--   WHERE stat_date >= date('now', '-30 days')
--   ORDER BY stat_date DESC;
--
-- Extension Ideas:
--   - Add ltv_estimate (lifetime value projection)
--   - Add cac_estimate (customer acquisition cost)
--   - Add payback_period (days to recover CAC)
--   - Add growth_rate (MoM, WoW)

