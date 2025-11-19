-- ============================================================================
-- Migration: Add User Activity Tracking
-- Date: 2025-11-18
-- Description: Add fields to track user activity and bot status for smart broadcasting
-- ============================================================================

-- Add activity tracking fields to users table
-- Note: SQLite doesn't support DEFAULT CURRENT_TIMESTAMP in ALTER TABLE
-- We'll add the column without default and then update existing rows
ALTER TABLE users ADD COLUMN last_active_at TEXT;
ALTER TABLE users ADD COLUMN bot_status TEXT DEFAULT 'active' 
  CHECK(bot_status IN ('active', 'blocked', 'deleted', 'deactivated', 'invalid'));
ALTER TABLE users ADD COLUMN bot_status_updated_at TEXT;
ALTER TABLE users ADD COLUMN failed_delivery_count INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_bot_status ON users(bot_status);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active_at);
CREATE INDEX IF NOT EXISTS idx_users_activity_status ON users(last_active_at, bot_status);

-- Update existing users' last_active_at to their created_at
UPDATE users SET last_active_at = created_at WHERE last_active_at IS NULL;

-- Add detailed broadcast statistics
ALTER TABLE broadcasts ADD COLUMN blocked_count INTEGER DEFAULT 0;
ALTER TABLE broadcasts ADD COLUMN deleted_count INTEGER DEFAULT 0;
ALTER TABLE broadcasts ADD COLUMN invalid_count INTEGER DEFAULT 0;

