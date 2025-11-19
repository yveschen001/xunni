-- Migration: 0031_create_funnel_events.sql
-- Funnel analysis for conversion tracking
--
-- Purpose:
--   Track multi-step conversion funnels
--   Identify drop-off points in user journeys
--   Optimize conversion rates based on data
--
-- Supported Funnels:
--   - vip_conversion: Awareness → Interest → Consideration → Intent → Purchase
--   - ad_completion: Impression → Click → Start → Progress → Complete
--   - invite_flow: Initiate → Link Click → Accept → Activate
--
-- Future Extensions:
--   - Add funnel_variant for A/B testing
--   - Add user_segment for cohort-specific funnels
--   - Add attribution_source for channel analysis

CREATE TABLE IF NOT EXISTS funnel_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Funnel identification
  user_id TEXT NOT NULL,
  funnel_type TEXT NOT NULL,                    -- 'vip_conversion' | 'ad_completion' | 'invite_flow'
  funnel_step TEXT NOT NULL,                    -- Step name (e.g., 'awareness', 'interest')
  step_order INTEGER NOT NULL,                  -- Step sequence (1, 2, 3...)
  
  -- Step details (JSON for flexibility)
  step_data TEXT,
  
  -- Timing
  step_timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
  time_from_previous_step_seconds INTEGER,     -- Time since previous step
  time_from_funnel_start_seconds INTEGER,      -- Time since funnel start
  
  -- Funnel outcome
  completed INTEGER DEFAULT 0 CHECK(completed IN (0, 1)),
  dropped_off INTEGER DEFAULT 0 CHECK(dropped_off IN (0, 1)),
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_funnel_events_user 
  ON funnel_events(user_id);

CREATE INDEX IF NOT EXISTS idx_funnel_events_type 
  ON funnel_events(funnel_type);

CREATE INDEX IF NOT EXISTS idx_funnel_events_step 
  ON funnel_events(funnel_step);

CREATE INDEX IF NOT EXISTS idx_funnel_events_completed 
  ON funnel_events(completed);

-- Composite indexes for funnel analysis
CREATE INDEX IF NOT EXISTS idx_funnel_events_type_step 
  ON funnel_events(funnel_type, funnel_step);

CREATE INDEX IF NOT EXISTS idx_funnel_events_user_type 
  ON funnel_events(user_id, funnel_type);

-- Comments for funnel definitions
--
-- Funnel 1: VIP Conversion
--   Step 1: awareness (saw VIP prompt)
--   Step 2: interest (clicked to view VIP)
--   Step 3: consideration (viewed VIP details)
--   Step 4: purchase_intent (clicked purchase button)
--   Step 5: purchase_success (completed payment)
--
-- Funnel 2: Ad Completion
--   Step 1: impression (saw ad option)
--   Step 2: click (clicked watch ad)
--   Step 3: start (ad started playing)
--   Step 4: progress (watched 50%+)
--   Step 5: complete (finished ad, got reward)
--
-- Funnel 3: Invite Flow
--   Step 1: initiate (clicked invite button)
--   Step 2: link_click (invite link clicked by invitee)
--   Step 3: accept (invitee registered)
--   Step 4: activate (invitee threw first bottle)
--
-- Key Queries:
--
-- 1. Funnel conversion rates:
--    WITH funnel_steps AS (
--      SELECT 
--        funnel_type,
--        funnel_step,
--        step_order,
--        COUNT(DISTINCT user_id) as users
--      FROM funnel_events
--      WHERE created_at >= '2025-01-01'
--      GROUP BY funnel_type, funnel_step, step_order
--    )
--    SELECT 
--      funnel_type,
--      funnel_step,
--      step_order,
--      users,
--      LAG(users) OVER (PARTITION BY funnel_type ORDER BY step_order) as previous_step_users,
--      ROUND(users * 100.0 / LAG(users) OVER (PARTITION BY funnel_type ORDER BY step_order), 2) as step_conversion_rate
--    FROM funnel_steps
--    ORDER BY funnel_type, step_order;
--
-- 2. Average time between steps:
--    SELECT 
--      funnel_type,
--      funnel_step,
--      AVG(time_from_previous_step_seconds) / 60.0 as avg_minutes_from_previous,
--      AVG(time_from_funnel_start_seconds) / 60.0 as avg_minutes_from_start
--    FROM funnel_events
--    WHERE time_from_previous_step_seconds IS NOT NULL
--    GROUP BY funnel_type, funnel_step;
--
-- 3. Drop-off analysis:
--    SELECT 
--      funnel_type,
--      funnel_step,
--      COUNT(*) as total_users,
--      SUM(dropped_off) as dropped_users,
--      ROUND(SUM(dropped_off) * 100.0 / COUNT(*), 2) as drop_off_rate
--    FROM funnel_events
--    GROUP BY funnel_type, funnel_step
--    ORDER BY drop_off_rate DESC;
--
-- 4. Successful conversion paths:
--    SELECT 
--      user_id,
--      funnel_type,
--      GROUP_CONCAT(funnel_step, ' -> ') as path,
--      MAX(step_order) as steps_completed,
--      MAX(time_from_funnel_start_seconds) / 60.0 as total_minutes
--    FROM funnel_events
--    WHERE completed = 1
--    GROUP BY user_id, funnel_type;
--
-- Usage Example:
--   -- User sees VIP prompt
--   INSERT INTO funnel_events (user_id, funnel_type, funnel_step, step_order, step_data)
--   VALUES ('123456789', 'vip_conversion', 'awareness', 1, '{"context": "quota_exhausted"}');
--
--   -- User clicks to view VIP
--   INSERT INTO funnel_events (user_id, funnel_type, funnel_step, step_order, 
--                              time_from_previous_step_seconds, time_from_funnel_start_seconds)
--   VALUES ('123456789', 'vip_conversion', 'interest', 2, 30, 30);
--
-- Extension Ideas:
--   - Add device_type for platform-specific analysis
--   - Add entry_source (where user came from)
--   - Add exit_reason for drop-offs (timeout, error, manual)
--   - Add recovery_attempts (how many times user re-entered funnel)

