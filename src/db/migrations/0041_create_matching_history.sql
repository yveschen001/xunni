-- Migration 0041: Create Matching History Table
-- Records smart matching history for analytics and optimization

CREATE TABLE IF NOT EXISTS matching_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bottle_id INTEGER NOT NULL,
  matched_user_id TEXT NOT NULL,
  match_score REAL NOT NULL,
  score_breakdown TEXT, -- JSON: 各維度分數詳情
  match_type TEXT NOT NULL, -- 'active': 主動配對, 'passive': 被動撿取
  is_replied INTEGER DEFAULT 0,
  replied_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (matched_user_id) REFERENCES users(telegram_id),
  FOREIGN KEY (bottle_id) REFERENCES bottles(id)
);

CREATE INDEX IF NOT EXISTS idx_matching_history_user 
ON matching_history(matched_user_id);

CREATE INDEX IF NOT EXISTS idx_matching_history_bottle 
ON matching_history(bottle_id);

CREATE INDEX IF NOT EXISTS idx_matching_history_score 
ON matching_history(match_score DESC);

CREATE INDEX IF NOT EXISTS idx_matching_history_type 
ON matching_history(match_type);

