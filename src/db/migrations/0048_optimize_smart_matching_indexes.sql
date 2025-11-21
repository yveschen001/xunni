-- Migration: Optimize Smart Matching Indexes
-- Description: Add composite indexes to improve smart matching query performance
-- Date: 2025-11-21
-- Expected improvement: 10-20% faster first-time smart matching queries

-- Add composite index for active user matching
-- This covers the most common query pattern in smart matching
CREATE INDEX IF NOT EXISTS idx_users_active_matching 
ON users(
  onboarding_step,  -- Filter: completed users only
  is_banned,        -- Filter: non-banned users only
  last_active_at,   -- Sort: most recent first
  language_pref,    -- Filter: same language (tier 1)
  gender            -- Filter: target gender
);

-- Add MBTI index for MBTI filtering
-- Only index non-null values to save space
CREATE INDEX IF NOT EXISTS idx_users_mbti 
ON users(mbti_result) 
WHERE mbti_result IS NOT NULL;

-- Add zodiac index for zodiac filtering
-- Only index non-null values to save space
CREATE INDEX IF NOT EXISTS idx_users_zodiac 
ON users(zodiac_sign) 
WHERE zodiac_sign IS NOT NULL;

-- Add blood type index for blood type filtering
-- Only index non-null values to save space
CREATE INDEX IF NOT EXISTS idx_users_blood_type 
ON users(blood_type) 
WHERE blood_type IS NOT NULL;

-- Note: These indexes will improve query performance but increase database size slightly
-- Estimated size increase: < 1 MB for 10,000 users

