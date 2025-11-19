-- Migration: 0024_create_ad_providers_table.sql
-- Support multiple ad providers with priority and fallback
--
-- Purpose:
--   Enable multi-provider ad system with automatic fallback
--   Track performance of each provider for optimization
--
-- Business Value:
--   - Maximize ad fill rate (if one provider fails, try another)
--   - Optimize revenue by comparing provider performance
--   - A/B test different providers
--
-- Future Extensions:
--   - Add geo-targeting (provider_regions JSON field)
--   - Add time-based rules (active_hours JSON field)
--   - Add user-segment targeting (target_user_types JSON field)

CREATE TABLE IF NOT EXISTS ad_providers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Provider identification
  provider_name TEXT NOT NULL UNIQUE,           -- 'gigapub', 'google_adsense', 'unity_ads'
  provider_display_name TEXT NOT NULL,          -- 'GigaPub', 'Google AdSense', 'Unity Ads'
  
  -- Status
  is_enabled INTEGER DEFAULT 1 CHECK(is_enabled IN (0, 1)),
  
  -- Priority and weight for selection
  priority INTEGER DEFAULT 0,                   -- Higher = selected first (for 'priority' strategy)
  weight INTEGER DEFAULT 100,                   -- For weighted random selection
  
  -- Configuration (JSON string)
  config TEXT,                                  -- {"project_id": "xxx", "api_key": "xxx"}
  
  -- Script URLs
  script_url TEXT,                              -- Primary script URL
  fallback_script_urls TEXT,                    -- JSON array of backup URLs
  
  -- Performance statistics
  total_requests INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  total_errors INTEGER DEFAULT 0,
  completion_rate REAL DEFAULT 0.0,
  
  -- Health monitoring
  last_error TEXT,
  last_error_at TEXT,
  last_success_at TEXT,
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ad_providers_enabled 
  ON ad_providers(is_enabled);

CREATE INDEX IF NOT EXISTS idx_ad_providers_priority 
  ON ad_providers(priority DESC);

-- Comments for selection strategies
--
-- Strategy 1: Priority
--   Always select highest priority provider
--   Use case: Fixed primary provider with fallbacks
--
-- Strategy 2: Weighted Random
--   Random selection based on weight
--   Use case: A/B testing, load balancing
--   Example: weight 70 = 70% chance
--
-- Strategy 3: Round Robin
--   Rotate through providers evenly
--   Use case: Fair distribution for testing
--
-- Extension Ideas:
--   - Add cost_per_completion for ROI tracking
--   - Add min_user_age_days for new user targeting
--   - Add blacklist_regions for compliance

