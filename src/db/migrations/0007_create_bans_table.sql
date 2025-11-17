-- Migration: Create bans table
-- Date: 2025-11-17
-- Description: Create bans table to track user ban history and details

-- ============================================================================
-- Create bans table
-- ============================================================================
CREATE TABLE IF NOT EXISTS bans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  risk_snapshot INTEGER DEFAULT 0,
  ban_start TEXT NOT NULL,
  ban_end TEXT,  -- NULL = permanent ban
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(telegram_id)
);

-- ============================================================================
-- Create indexes for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_bans_user_id ON bans(user_id);
CREATE INDEX IF NOT EXISTS idx_bans_ban_end ON bans(ban_end);
CREATE INDEX IF NOT EXISTS idx_bans_created_at ON bans(created_at);

