-- Migration: Add bottle_drafts table for draft saving
-- Created: 2025-01-16

CREATE TABLE IF NOT EXISTS bottle_drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT NOT NULL,
  content TEXT NOT NULL,
  target_gender TEXT DEFAULT 'any',
  target_mbti_filter TEXT, -- JSON array
  target_zodiac_filter TEXT, -- JSON array
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL, -- 24 hours after creation
  FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
);

CREATE INDEX IF NOT EXISTS idx_bottle_drafts_telegram_id ON bottle_drafts(telegram_id);
CREATE INDEX IF NOT EXISTS idx_bottle_drafts_expires_at ON bottle_drafts(expires_at);

