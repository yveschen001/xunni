-- Migration 0040: Add Smart Matching Fields
-- Adds age_range field and performance indexes for smart matching system

-- Add age_range field to users table (冗餘欄位，用於性能優化)
ALTER TABLE users ADD COLUMN age_range TEXT;

-- Create performance indexes for smart matching
CREATE INDEX IF NOT EXISTS idx_users_active_status 
ON users(last_active_at DESC, is_banned);

CREATE INDEX IF NOT EXISTS idx_users_language 
ON users(language_pref);

CREATE INDEX IF NOT EXISTS idx_users_age_range 
ON users(age_range);

-- Add match_status field to bottles table
ALTER TABLE bottles ADD COLUMN match_status TEXT DEFAULT 'pending';
-- 'pending': 剛丟出，等待配對
-- 'matched': 已配對給特定用戶
-- 'active': 進入公共池，等待撿取
-- 'caught': 已被撿走

CREATE INDEX IF NOT EXISTS idx_bottles_match_status_created 
ON bottles(match_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bottles_status_owner 
ON bottles(match_status, owner_telegram_id);

