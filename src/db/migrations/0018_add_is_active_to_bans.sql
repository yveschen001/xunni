-- Migration: Add is_active column to bans table
-- Date: 2025-11-17
-- Description: Add is_active column to track if a ban is currently active

-- Add is_active column (1 = active, 0 = inactive)
ALTER TABLE bans ADD COLUMN is_active INTEGER DEFAULT 1;

-- Create index for is_active for faster queries
CREATE INDEX IF NOT EXISTS idx_bans_is_active ON bans(is_active);

