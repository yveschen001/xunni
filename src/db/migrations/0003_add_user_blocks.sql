-- Migration 0003: Add user_blocks table for blocking functionality

CREATE TABLE IF NOT EXISTS user_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  blocker_id TEXT NOT NULL,  -- FK -> users.telegram_id (who blocked)
  blocked_id TEXT NOT NULL,  -- FK -> users.telegram_id (who was blocked)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX idx_user_blocks_blocker_id ON user_blocks(blocker_id);
CREATE INDEX idx_user_blocks_blocked_id ON user_blocks(blocked_id);
CREATE INDEX idx_user_blocks_created_at ON user_blocks(created_at);

