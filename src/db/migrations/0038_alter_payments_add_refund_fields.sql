-- Migration: 0038_alter_payments_add_refund_fields.sql
-- Purpose: Add refund-related fields to payments table
-- Date: 2025-11-19

ALTER TABLE payments ADD COLUMN subscription_id INTEGER;
ALTER TABLE payments ADD COLUMN payment_type TEXT CHECK(payment_type IN ('initial', 'renewal', 'refund'));
ALTER TABLE payments ADD COLUMN refund_reason TEXT;
ALTER TABLE payments ADD COLUMN refunded_at TEXT;

CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON payments(payment_type);

