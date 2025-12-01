-- Migration: 0078_fix_fortune_type_constraint_v2.sql
-- Fix check constraint on fortune_history.type to support weekly and other missing types

-- 1. Create new table with updated check constraint
CREATE TABLE fortune_history_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT NOT NULL,
  
  -- Fortune type (Updated to include 'weekly' and others)
  type TEXT NOT NULL CHECK(type IN ('daily', 'weekly', 'monthly', '2025', 'deep', 'match', 'celebrity', 'ziwei', 'astrology', 'tarot', 'bazi', 'love_ideal', 'love_match')),
  
  -- Context
  target_date TEXT,
  target_person_name TEXT,
  target_person_birth TEXT,
  
  -- Result (AI Generated)
  content TEXT NOT NULL,
  
  -- Metadata
  provider TEXT DEFAULT 'openai',
  model TEXT,
  tokens_used INTEGER,
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  -- New fields from 0075
  profile_snapshot TEXT,
  target_user_id TEXT,
  
  FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
);

-- 2. Copy data
INSERT INTO fortune_history_new (
  id, telegram_id, type, target_date, target_person_name, target_person_birth, 
  content, provider, model, tokens_used, created_at, profile_snapshot, target_user_id
)
SELECT 
  id, telegram_id, type, target_date, target_person_name, target_person_birth, 
  content, provider, model, tokens_used, created_at, profile_snapshot, target_user_id
FROM fortune_history;

-- 3. Drop old table
DROP TABLE fortune_history;

-- 4. Rename new table
ALTER TABLE fortune_history_new RENAME TO fortune_history;

-- 5. Recreate indexes
CREATE INDEX idx_fortune_history_user ON fortune_history(telegram_id);
CREATE INDEX idx_fortune_history_type_date ON fortune_history(telegram_id, type, target_date);

