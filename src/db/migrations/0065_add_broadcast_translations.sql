-- Migration: Add translations column to broadcasts table
-- Description: Store translated broadcast messages for multi-language support
-- Date: 2025-11-29

ALTER TABLE broadcasts ADD COLUMN translations TEXT; -- JSON string: {"en": "...", "ja": "..."}

