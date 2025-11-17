-- Migration 0011: Add conversation_identifiers table
-- Purpose: Track conversation partner identifiers for each user (#A, #B, #C, ...)

CREATE TABLE IF NOT EXISTS conversation_identifiers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_telegram_id TEXT NOT NULL,        -- 用戶 ID
  partner_telegram_id TEXT NOT NULL,     -- 對話對象 ID
  identifier TEXT NOT NULL,              -- 標識符 (A, B, C, ...)
  first_conversation_id INTEGER NOT NULL, -- 第一個對話 ID
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_telegram_id, partner_telegram_id),
  UNIQUE(user_telegram_id, identifier),
  FOREIGN KEY (user_telegram_id) REFERENCES users(telegram_id),
  FOREIGN KEY (partner_telegram_id) REFERENCES users(telegram_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_identifiers_user ON conversation_identifiers(user_telegram_id);
CREATE INDEX IF NOT EXISTS idx_conv_identifiers_partner ON conversation_identifiers(user_telegram_id, partner_telegram_id);
CREATE INDEX IF NOT EXISTS idx_conv_identifiers_id ON conversation_identifiers(user_telegram_id, identifier);

