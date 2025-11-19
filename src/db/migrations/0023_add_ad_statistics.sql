-- Migration: 0023_add_ad_statistics.sql
-- Add ad statistics to daily_stats table
--
-- Purpose:
--   Enhance daily_stats with comprehensive ad performance metrics
--   Enable business decision making based on ad performance
--
-- Future Extensions:
--   - Add per-provider statistics
--   - Add hourly breakdown
--   - Add user segment analysis (new vs returning)

-- Third-party video ad statistics
ALTER TABLE daily_stats ADD COLUMN total_ad_views INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN total_ad_completions INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN ad_completion_rate REAL DEFAULT 0.0;
ALTER TABLE daily_stats ADD COLUMN total_ad_quota_earned INTEGER DEFAULT 0;

-- Official ad statistics
ALTER TABLE daily_stats ADD COLUMN official_ad_impressions INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN official_ad_clicks INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN official_ad_completions INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN official_ad_ctr REAL DEFAULT 0.0;

-- Ad revenue estimation (for future monetization tracking)
ALTER TABLE daily_stats ADD COLUMN estimated_ad_revenue REAL DEFAULT 0.0;

-- Comments for calculation formulas
--
-- ad_completion_rate = (total_ad_completions / total_ad_views) * 100
-- official_ad_ctr = (official_ad_clicks / official_ad_impressions) * 100
-- estimated_ad_revenue = total_ad_completions * CPM_RATE / 1000
--
-- Extension Ideas:
--   - Add ad_error_rate for quality monitoring
--   - Add avg_ad_duration for engagement analysis
--   - Add unique_ad_viewers for reach analysis

