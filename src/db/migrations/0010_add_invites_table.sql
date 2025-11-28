-- Migration: Add invites table for invite fission feature
-- FIXED: Remove ALTER TABLE if column exists (though SQLite doesn't support IF NOT EXISTS on column add)
-- Since 0001 already adds successful_invites, we can comment this out or wrap it?
-- SQLite ALTER TABLE doesn't support IF NOT EXISTS. 
-- Best practice here: Just comment out the ALTER TABLE since we know 0001 has it.

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
-- ALREADY IN 0001_initial_schema.sql
-- ALTER TABLE users ADD COLUMN successful_invites INTEGER DEFAULT 0;
