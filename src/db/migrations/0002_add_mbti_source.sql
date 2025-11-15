-- Migration: Add MBTI source tracking
-- Date: 2025-01-15
-- Purpose: Track whether MBTI was set manually or via test

-- Add mbti_source column to users table
ALTER TABLE users ADD COLUMN mbti_source TEXT CHECK(mbti_source IN ('manual', 'test'));

-- Create mbti_test_progress table for conversational test state
CREATE TABLE IF NOT EXISTS mbti_test_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT NOT NULL,
  current_question INTEGER DEFAULT 0,
  answers TEXT,  -- JSON array of answers
  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (telegram_id) REFERENCES users(telegram_id) ON DELETE CASCADE
);

CREATE INDEX idx_mbti_test_progress_telegram_id ON mbti_test_progress(telegram_id);

-- Note: Existing users with mbti_result will have NULL mbti_source
-- This is intentional - we don't know how they got their MBTI

