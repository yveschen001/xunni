-- Migration: Add invites table for invite fission feature
-- Date: 2025-11-16
-- Description: Create invites table to track user invitations and rewards

-- Create invites table
CREATE TABLE IF NOT EXISTS invites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inviter_telegram_id TEXT NOT NULL,
  invitee_telegram_id TEXT NOT NULL,
  invite_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'activated', 'expired')),
  activated_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (inviter_telegram_id) REFERENCES users(telegram_id),
  FOREIGN KEY (invitee_telegram_id) REFERENCES users(telegram_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invites_inviter ON invites(inviter_telegram_id);
CREATE INDEX IF NOT EXISTS idx_invites_invitee ON invites(invitee_telegram_id);
CREATE INDEX IF NOT EXISTS idx_invites_status ON invites(status);
CREATE INDEX IF NOT EXISTS idx_invites_invite_code ON invites(invite_code);

-- Add successful_invites column to users table if not exists
-- This tracks the number of successfully activated invites
ALTER TABLE users ADD COLUMN successful_invites INTEGER DEFAULT 0;

