-- Migration: 0027_create_quota_prompts.sql
-- Quota prompt variants for A/B testing
--
-- Purpose:
--   Test different quota exhausted prompts
--   Optimize conversion to ads/invites/VIP
--   Data-driven UX improvement
--
-- Future Extensions:
--   - Add multi-language support
--   - Add user segment targeting
--   - Add time-based variants (weekday vs weekend)
--
-- Note: This is OPTIONAL for now
--   Can be implemented later when we want to do A/B testing
--   For MVP, we'll use hardcoded prompts in code

CREATE TABLE IF NOT EXISTS quota_prompt_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Variant identification
  variant_name TEXT NOT NULL UNIQUE,
  variant_description TEXT,
  
  -- Target audience
  user_type TEXT NOT NULL CHECK(user_type IN ('free', 'vip', 'all')),
  quota_range TEXT,                             -- e.g., '0-5', '6-10'
  
  -- Prompt content
  message_text TEXT NOT NULL,
  button_config TEXT,                           -- JSON array of buttons
  
  -- A/B testing
  is_enabled INTEGER DEFAULT 1 CHECK(is_enabled IN (0, 1)),
  traffic_percentage INTEGER DEFAULT 100 CHECK(traffic_percentage >= 0 AND traffic_percentage <= 100),
  
  -- Performance tracking
  impressions INTEGER DEFAULT 0,
  ad_clicks INTEGER DEFAULT 0,
  invite_clicks INTEGER DEFAULT 0,
  vip_clicks INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Prompt impressions log (for detailed analysis)
CREATE TABLE IF NOT EXISTS quota_prompt_impressions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  telegram_id TEXT NOT NULL,
  variant_id INTEGER NOT NULL,
  
  -- Context
  user_quota INTEGER NOT NULL,
  user_is_vip INTEGER NOT NULL,
  
  -- Action taken
  action TEXT CHECK(action IN ('ad_click', 'invite_click', 'vip_click', 'dismiss', NULL)),
  action_at TEXT,
  
  -- Timestamp
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (variant_id) REFERENCES quota_prompt_variants(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quota_prompt_variants_enabled 
  ON quota_prompt_variants(is_enabled);

CREATE INDEX IF NOT EXISTS idx_quota_prompt_impressions_telegram 
  ON quota_prompt_impressions(telegram_id);

CREATE INDEX IF NOT EXISTS idx_quota_prompt_impressions_variant 
  ON quota_prompt_impressions(variant_id);

-- Comments for A/B testing
--
-- Example Variants:
--
-- Variant A (Control): Standard prompt
--   "❌ 今日漂流瓶配額已用完
--    💡 想要更多配額嗎？
--    [📲 邀請朋友] [📺 看廣告 +1]"
--
-- Variant B: Emphasize ad rewards
--   "❌ 配額用完了！
--    🎁 看廣告立即獲得 +1 額度
--    [📺 立即觀看] [📲 邀請朋友]"
--
-- Variant C: Emphasize VIP
--   "❌ 配額已用完
--    💎 升級 VIP 享受 30 個配額/天
--    [💎 立即升級] [📺 看廣告 +1]"
--
-- Analysis Query:
--   SELECT 
--     v.variant_name,
--     v.impressions,
--     v.ad_clicks,
--     ROUND(v.ad_clicks * 100.0 / v.impressions, 2) as ad_ctr,
--     v.vip_clicks,
--     ROUND(v.vip_clicks * 100.0 / v.impressions, 2) as vip_ctr
--   FROM quota_prompt_variants v
--   WHERE v.is_enabled = 1
--   ORDER BY ad_ctr DESC;
--
-- Extension Ideas:
--   - Add conversion_to_vip field for final conversion tracking
--   - Add avg_time_to_action for urgency analysis
--   - Add device_type for platform-specific optimization

