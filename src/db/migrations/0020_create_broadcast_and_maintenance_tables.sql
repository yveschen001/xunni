-- Migration: Create broadcast and maintenance tables
-- Date: 2025-11-17
-- Description: Create tables for broadcast system, maintenance mode, and daily stats

-- ============================================================================
-- 1. Broadcasts Table (廣播記錄)
-- ============================================================================
CREATE TABLE IF NOT EXISTS broadcasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 廣播內容
  message TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK(target_type IN ('all', 'vip', 'non_vip')),
  
  -- 發送狀態
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sending', 'completed', 'failed', 'cancelled')),
  total_users INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  
  -- 創建者
  created_by TEXT NOT NULL,  -- admin telegram_id
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  -- 完成時間
  started_at TEXT,
  completed_at TEXT,
  
  -- 錯誤信息
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_broadcasts_status ON broadcasts(status);
CREATE INDEX IF NOT EXISTS idx_broadcasts_created_by ON broadcasts(created_by);
CREATE INDEX IF NOT EXISTS idx_broadcasts_created_at ON broadcasts(created_at);

-- ============================================================================
-- 2. Maintenance Mode Table (維護模式配置)
-- ============================================================================
CREATE TABLE IF NOT EXISTS maintenance_mode (
  id INTEGER PRIMARY KEY CHECK (id = 1),  -- 單例表
  
  -- 維護狀態
  is_active INTEGER DEFAULT 0,  -- 1 = 維護中, 0 = 正常
  
  -- 維護時間
  start_time TEXT,
  end_time TEXT,
  estimated_duration INTEGER,  -- 預計維護時長（分鐘）
  
  -- 維護訊息
  maintenance_message TEXT,
  
  -- 創建者
  enabled_by TEXT,  -- admin telegram_id
  enabled_at TEXT,
  
  -- 更新時間
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Insert default record
INSERT OR IGNORE INTO maintenance_mode (id, is_active) VALUES (1, 0);

-- ============================================================================
-- 3. Daily Stats Table (每日統計)
-- ============================================================================
CREATE TABLE IF NOT EXISTS daily_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stat_date TEXT NOT NULL UNIQUE,  -- YYYY-MM-DD
  
  -- 漂流瓶統計
  total_bottles INTEGER DEFAULT 0,
  new_bottles INTEGER DEFAULT 0,
  caught_bottles INTEGER DEFAULT 0,
  
  -- 對話統計
  total_conversations INTEGER DEFAULT 0,
  new_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  new_messages INTEGER DEFAULT 0,
  
  -- 用戶統計
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,  -- 當日活躍
  
  -- VIP 統計
  total_vip INTEGER DEFAULT 0,
  new_vip INTEGER DEFAULT 0,
  
  -- 生成時間
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(stat_date);
CREATE INDEX IF NOT EXISTS idx_daily_stats_created_at ON daily_stats(created_at);

