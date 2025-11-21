-- Migration: Add broadcast filters support
-- Purpose: Add filter_json column to broadcasts table for storing filter criteria
-- Date: 2025-11-21

-- Add filter_json column to broadcasts table
-- This column will store the filter criteria as JSON string
-- Example: '{"gender":"female","age":{"min":18,"max":25},"country":"TW"}'
ALTER TABLE broadcasts ADD COLUMN filter_json TEXT DEFAULT NULL;

-- Add index for faster filtering queries on broadcasts
CREATE INDEX IF NOT EXISTS idx_broadcasts_filter_json ON broadcasts(filter_json);

-- Add comments (SQLite doesn't support COMMENT, but we document here)
-- filter_json: JSON string containing filter criteria
--   - gender: 'male' | 'female' | 'other'
--   - zodiac: 'Aries' | 'Taurus' | ... (12 zodiacs)
--   - country: 'TW' | 'US' | ... (ISO 3166-1 alpha-2)
--   - age: { min: number, max: number }
--   - mbti: 'INTJ' | 'ENFP' | ... (16 types)
--   - vip: boolean
--   - is_birthday: boolean

