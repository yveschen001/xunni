-- Migration: Create task_reminders table
-- Description: Track task reminder history
-- Date: 2025-11-19

CREATE TABLE IF NOT EXISTS task_reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,                    -- FK -> users.telegram_id
  reminded_at TEXT NOT NULL,                -- Reminder time
  scenario TEXT NOT NULL,                   -- Reminder scenario (e.g., 'quota_low', 'first_bottle')
  created_at TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (user_id) REFERENCES users(telegram_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_reminders_user_id ON task_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_task_reminders_reminded_at ON task_reminders(reminded_at);
CREATE INDEX IF NOT EXISTS idx_task_reminders_user_scenario ON task_reminders(user_id, scenario, reminded_at);

