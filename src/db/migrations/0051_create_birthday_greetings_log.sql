-- Migration: Create birthday greetings log table
-- Purpose: Track sent birthday greetings to prevent duplicate sends
-- Date: 2025-11-21

-- Create birthday_greetings_log table
CREATE TABLE IF NOT EXISTS birthday_greetings_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT NOT NULL,
  sent_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Create index for fast lookup (check if greeting was sent today)
CREATE INDEX IF NOT EXISTS idx_birthday_greetings_log_telegram_id_sent_at 
  ON birthday_greetings_log(telegram_id, sent_at);

-- Create index for cleanup (delete old logs)
CREATE INDEX IF NOT EXISTS idx_birthday_greetings_log_sent_at 
  ON birthday_greetings_log(sent_at);

-- Comments:
-- telegram_id: User's Telegram ID
-- sent_at: When the greeting was sent (used to check if already sent today)
-- created_at: Record creation timestamp

-- Cleanup strategy:
-- Old logs (>1 year) can be deleted periodically to save space:
-- DELETE FROM birthday_greetings_log WHERE sent_at < date('now', '-1 year');

