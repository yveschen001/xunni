CREATE TABLE IF NOT EXISTS ai_cost_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    feature_type TEXT,
    sub_type TEXT,
    provider TEXT,
    model TEXT,
    input_tokens INTEGER,
    output_tokens INTEGER,
    cost_usd REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ai_cost_date ON ai_cost_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_cost_type ON ai_cost_logs(feature_type);

CREATE TABLE IF NOT EXISTS daily_financial_reports (
    date TEXT PRIMARY KEY,
    total_revenue REAL,
    total_cost REAL,
    gross_profit REAL,
    dau INTEGER,
    fortune_count INTEGER,
    fortune_cost REAL,
    translation_cost REAL,
    model_breakdown TEXT,
    feature_breakdown TEXT
);
