-- Migration: 0062_create_daily_translation_stats.sql
-- Create table for aggregated daily translation statistics
-- This replaces the granular translation_costs table to save space

CREATE TABLE IF NOT EXISTS daily_translation_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stat_date TEXT NOT NULL,  -- YYYY-MM-DD
  provider TEXT NOT NULL,   -- 'openai', 'gemini', 'google'
  total_tokens INTEGER DEFAULT 0,
  total_characters INTEGER DEFAULT 0,
  request_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  cost_usd REAL DEFAULT 0.0, -- Estimated cost
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(stat_date, provider)
);

CREATE INDEX idx_daily_translation_stats_date ON daily_translation_stats(stat_date);

-- Ensure translation_fallbacks exists (from original plan, but verify)
CREATE TABLE IF NOT EXISTS translation_fallbacks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  from_provider TEXT,
  to_provider TEXT,
  error_message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_translation_fallbacks_created_at ON translation_fallbacks(created_at);
