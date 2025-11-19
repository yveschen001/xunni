-- Migration: 0025_create_ad_provider_logs.sql
-- Detailed logs for each ad request
--
-- Purpose:
--   Track every ad request for debugging and optimization
--   Identify patterns in ad failures
--   Monitor provider health in real-time
--
-- Retention Policy:
--   Keep logs for 30 days, then archive or delete
--   Use for real-time monitoring and troubleshooting
--
-- Future Extensions:
--   - Add user_segment field for cohort analysis
--   - Add network_type (wifi/cellular) for quality analysis
--   - Add device_info for compatibility tracking

CREATE TABLE IF NOT EXISTS ad_provider_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- User and provider
  telegram_id TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  
  -- Request info
  request_date TEXT NOT NULL,                   -- YYYY-MM-DD HH:MM:SS
  request_type TEXT NOT NULL CHECK(request_type IN ('view', 'completion')),
  
  -- Result
  status TEXT NOT NULL CHECK(status IN ('success', 'error', 'timeout')),
  error_message TEXT,
  response_time_ms INTEGER,
  
  -- Timestamp
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ad_provider_logs_telegram 
  ON ad_provider_logs(telegram_id);

CREATE INDEX IF NOT EXISTS idx_ad_provider_logs_provider 
  ON ad_provider_logs(provider_name);

CREATE INDEX IF NOT EXISTS idx_ad_provider_logs_date 
  ON ad_provider_logs(request_date);

CREATE INDEX IF NOT EXISTS idx_ad_provider_logs_status 
  ON ad_provider_logs(status);

-- Comments for log analysis
--
-- Common Queries:
--
-- 1. Provider error rate (last 24 hours):
--    SELECT provider_name, 
--           COUNT(*) as total,
--           SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors,
--           ROUND(SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as error_rate
--    FROM ad_provider_logs
--    WHERE request_date >= datetime('now', '-1 day')
--    GROUP BY provider_name;
--
-- 2. Slow providers (avg response time):
--    SELECT provider_name,
--           AVG(response_time_ms) as avg_response_time,
--           MAX(response_time_ms) as max_response_time
--    FROM ad_provider_logs
--    WHERE status = 'success'
--      AND request_date >= datetime('now', '-1 day')
--    GROUP BY provider_name
--    ORDER BY avg_response_time DESC;
--
-- 3. User-specific issues:
--    SELECT * FROM ad_provider_logs
--    WHERE telegram_id = '123456789'
--      AND status = 'error'
--    ORDER BY request_date DESC
--    LIMIT 10;
--
-- Extension Ideas:
--   - Add session_id for user journey tracking
--   - Add previous_provider for fallback analysis
--   - Add user_quota_before/after for impact analysis

