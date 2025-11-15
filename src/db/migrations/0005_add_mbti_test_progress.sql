-- Migration 0005: Add mbti_test_progress table
CREATE TABLE IF NOT EXISTS mbti_test_progress (
  telegram_id TEXT PRIMARY KEY,
  current_question INTEGER NOT NULL DEFAULT 0,
  answers TEXT NOT NULL DEFAULT '[]',
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
);

CREATE INDEX IF NOT EXISTS idx_mbti_test_progress_telegram_id ON mbti_test_progress(telegram_id);

