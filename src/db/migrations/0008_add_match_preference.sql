-- Migration: Add match_preference to users table
-- Date: 2025-11-16
-- Description: Add user's preferred match gender (default to opposite gender)

ALTER TABLE users ADD COLUMN match_preference TEXT DEFAULT NULL CHECK(match_preference IN ('male', 'female', 'any'));

-- Note: NULL means "not set yet, use opposite gender as default"
-- 'male' = looking for males
-- 'female' = looking for females  
-- 'any' = looking for anyone

