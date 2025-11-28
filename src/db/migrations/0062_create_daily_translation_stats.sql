CREATE TABLE IF NOT EXISTS daily_translation_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,  -- YYYY-MM-DD
  provider TEXT NOT NULL, -- 'openai', 'gemini', 'google'
  total_tokens INTEGER DEFAULT 0,
  total_characters INTEGER DEFAULT 0, -- For Google Translate
  request_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, provider)
);

CREATE INDEX idx_daily_trans_stats_date ON daily_translation_stats(date);

