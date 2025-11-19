-- Migration: Create user_tasks table
-- Description: Track user task progress
-- Date: 2025-11-19

CREATE TABLE IF NOT EXISTS user_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,                    -- FK -> users.telegram_id
  task_id TEXT NOT NULL,                    -- Task ID (e.g., 'task_interests')
  status TEXT DEFAULT 'available',          -- 'available' / 'pending_claim' / 'completed'
  completed_at TEXT,                        -- Completion time
  reward_claimed INTEGER DEFAULT 0,         -- Has reward been claimed (0/1)
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  
  UNIQUE(user_id, task_id),
  FOREIGN KEY (user_id) REFERENCES users(telegram_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_status ON user_tasks(status);
CREATE INDEX IF NOT EXISTS idx_user_tasks_user_status ON user_tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_tasks_completed_at ON user_tasks(completed_at);

