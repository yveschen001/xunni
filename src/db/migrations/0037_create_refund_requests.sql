-- Migration: 0037_create_refund_requests.sql
-- Purpose: Create refund requests table
-- Date: 2025-11-19

CREATE TABLE IF NOT EXISTS refund_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  payment_id TEXT NOT NULL,
  subscription_id INTEGER,
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_id TEXT,
  admin_note TEXT,
  requested_at TEXT DEFAULT CURRENT_TIMESTAMP,
  processed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(telegram_id),
  FOREIGN KEY (subscription_id) REFERENCES vip_subscriptions(id)
);

CREATE INDEX IF NOT EXISTS idx_refund_requests_user_id ON refund_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refund_requests_payment_id ON refund_requests(payment_id);

