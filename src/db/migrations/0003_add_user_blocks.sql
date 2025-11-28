-- Migration 0003: Add user_blocks table for blocking functionality
-- FIXED: Use column names consistent with 0001_initial_schema.sql (blocker_telegram_id, blocked_telegram_id)

CREATE TABLE IF NOT EXISTS user_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  blocker_telegram_id TEXT NOT NULL,  -- FK -> users.telegram_id (who blocked)
  blocked_telegram_id TEXT NOT NULL,  -- FK -> users.telegram_id (who was blocked)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(blocker_telegram_id, blocked_telegram_id)
);

-- Use IF NOT EXISTS for indexes to avoid errors if they were already created in 0001
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_telegram_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_telegram_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_created_at ON user_blocks(created_at);
