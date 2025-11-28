-- Migration: Add banned_by column to bans table
-- Date: 2025-11-17
-- Description: Add banned_by column to track which admin banned the user
-- DUPLICATE of 0009_add_banned_by_to_bans.sql
-- Commenting out to avoid error

-- Add banned_by column (stores admin's telegram_id)
-- ALTER TABLE bans ADD COLUMN banned_by TEXT;

-- Create index for banned_by for faster queries
-- CREATE INDEX IF NOT EXISTS idx_bans_banned_by ON bans(banned_by);
