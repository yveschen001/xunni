-- Migration 0016: Add test_version to mbti_test_progress
-- Date: 2025-01-17
-- Purpose: Support 12-question (quick) and 36-question (full) MBTI test versions

-- Add test_version column to mbti_test_progress table
ALTER TABLE mbti_test_progress ADD COLUMN test_version TEXT DEFAULT 'quick' CHECK(test_version IN ('quick', 'full'));

-- Create index for test_version
CREATE INDEX IF NOT EXISTS idx_mbti_test_progress_version ON mbti_test_progress(test_version);

