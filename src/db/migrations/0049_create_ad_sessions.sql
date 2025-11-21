-- Migration: Create ad_sessions table for tracking third-party ad playback
-- Date: 2025-11-21

CREATE TABLE IF NOT EXISTS ad_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  token TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | playing | completed | failed
  started_at TEXT DEFAULT NULL,
  completed_at TEXT DEFAULT NULL,
  duration_ms INTEGER DEFAULT NULL,
  error_message TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ad_sessions_token
  ON ad_sessions(token);

CREATE INDEX IF NOT EXISTS idx_ad_sessions_user
  ON ad_sessions(telegram_id);

