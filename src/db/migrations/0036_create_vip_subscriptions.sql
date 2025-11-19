-- Migration: 0036_create_vip_subscriptions.sql
-- Purpose: Create VIP subscriptions management table
-- Date: 2025-11-19

CREATE TABLE IF NOT EXISTS vip_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('active', 'expiring', 'expired', 'cancelled')),
  start_date TEXT NOT NULL,
  expire_date TEXT NOT NULL,
  last_payment_date TEXT,
  last_payment_id TEXT,
  auto_renew_enabled INTEGER DEFAULT 0,
  reminder_sent_7d INTEGER DEFAULT 0,
  reminder_sent_3d INTEGER DEFAULT 0,
  reminder_sent_1d INTEGER DEFAULT 0,
  reminder_sent_0d INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(telegram_id)
);

CREATE INDEX IF NOT EXISTS idx_vip_subscriptions_user_id ON vip_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_vip_subscriptions_status ON vip_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_vip_subscriptions_expire_date ON vip_subscriptions(expire_date);

