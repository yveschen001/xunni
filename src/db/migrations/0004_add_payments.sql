-- Migration 0004: Add payments table for VIP subscriptions
-- FIXED: Use telegram_id to match 0001 schema

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT NOT NULL,  -- FK -> users.telegram_id
  telegram_payment_id TEXT UNIQUE NOT NULL,  -- Telegram payment charge ID
  amount_stars INTEGER NOT NULL,  -- Amount in Telegram Stars
  currency TEXT NOT NULL DEFAULT 'XTR',  -- Currency code
  status TEXT NOT NULL DEFAULT 'pending',  -- pending / completed / refunded
  payload TEXT,  -- Invoice payload (JSON)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_telegram_id ON payments(telegram_id);
CREATE INDEX IF NOT EXISTS idx_payments_telegram_payment_id ON payments(telegram_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
