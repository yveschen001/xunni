-- Migration: Add tutorial fields to users table
-- Description: Add fields for tutorial progress tracking
-- Date: 2025-11-19

-- Add tutorial step field
ALTER TABLE users ADD COLUMN tutorial_step TEXT DEFAULT 'not_started';

-- Add tutorial completed flag
ALTER TABLE users ADD COLUMN tutorial_completed INTEGER DEFAULT 0;

-- Add tutorial completed timestamp
ALTER TABLE users ADD COLUMN tutorial_completed_at TEXT;

-- Add task reminders enabled flag
ALTER TABLE users ADD COLUMN task_reminders_enabled INTEGER DEFAULT 1;

-- Create index for tutorial queries
CREATE INDEX IF NOT EXISTS idx_users_tutorial_step ON users(tutorial_step);
CREATE INDEX IF NOT EXISTS idx_users_tutorial_completed ON users(tutorial_completed);

