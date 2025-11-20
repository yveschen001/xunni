-- Migration: 0039_alter_payments_add_is_recurring.sql
-- Purpose: Add is_recurring field to track auto-renewal payments
-- Date: 2025-11-20

ALTER TABLE payments ADD COLUMN is_recurring INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_payments_is_recurring ON payments(is_recurring);

