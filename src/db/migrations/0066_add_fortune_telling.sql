-- Migration: 0066_add_fortune_telling.sql
-- Add support for AI Fortune Telling feature
--
-- 1. Add birth time and location to users table
-- 2. Create fortune_history table for storing results
-- 3. Create fortune_quota table for managing fortune bottles

-- 1. Add columns to users table
ALTER TABLE users ADD COLUMN birth_time TEXT;
ALTER TABLE users ADD COLUMN birth_city TEXT;
ALTER TABLE users ADD COLUMN birth_location_lat REAL;
ALTER TABLE users ADD COLUMN birth_location_lng REAL;

-- 2. Create fortune_history table
CREATE TABLE IF NOT EXISTS fortune_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT NOT NULL,
  
  -- Fortune type
  type TEXT NOT NULL CHECK(type IN ('daily', 'deep', 'match', 'celebrity')),
  
  -- Context
  target_date TEXT, -- YYYY-MM-DD (for daily/deep)
  target_person_name TEXT, -- (for match)
  target_person_birth TEXT, -- (for match)
  
  -- Result (AI Generated)
  content TEXT NOT NULL,
  
  -- Metadata
  provider TEXT DEFAULT 'openai',
  model TEXT,
  tokens_used INTEGER,
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
);

CREATE INDEX idx_fortune_history_user ON fortune_history(telegram_id);
CREATE INDEX idx_fortune_history_type_date ON fortune_history(telegram_id, type, target_date);

-- 3. Create fortune_quota table (User's Fortune Bottles)
CREATE TABLE IF NOT EXISTS fortune_quota (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT NOT NULL UNIQUE,
  
  -- Quota types
  weekly_free_quota INTEGER DEFAULT 0, -- Resets weekly (Max 1 for free, 7 for VIP)
  additional_quota INTEGER DEFAULT 0,  -- Accumulates (Paid + Rewards)
  
  last_reset_at TEXT, -- Timestamp of last weekly reset
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
);

CREATE INDEX idx_fortune_quota_user ON fortune_quota(telegram_id);
