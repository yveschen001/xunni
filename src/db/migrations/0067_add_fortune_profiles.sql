-- Migration: 0067_add_fortune_profiles.sql
-- Add support for multiple fortune profiles per user

CREATE TABLE IF NOT EXISTS fortune_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL, -- The owner of this profile
  
  name TEXT NOT NULL, -- e.g. "我自己", "老公", "女兒"
  gender TEXT, -- 'male', 'female'
  
  -- Birth Data
  birth_date TEXT NOT NULL, -- YYYY-MM-DD
  birth_time TEXT, -- HH:mm (Optional, but recommended)
  is_birth_time_unknown INTEGER DEFAULT 0,
  
  birth_city TEXT,
  birth_location_lat REAL,
  birth_location_lng REAL,
  
  is_default INTEGER DEFAULT 0, -- 1 = default profile
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(telegram_id)
);

CREATE INDEX idx_fortune_profiles_user ON fortune_profiles(user_id);

