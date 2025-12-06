-- Migration: Add gift-related fields to payments table
-- Date: 2025-01-20

-- Add optional recipient_telegram_id for gifts
ALTER TABLE payments ADD COLUMN recipient_telegram_id TEXT;

-- Add optional is_gift flag (default 0)
ALTER TABLE payments ADD COLUMN is_gift INTEGER DEFAULT 0;

-- Add optional gift_message
ALTER TABLE payments ADD COLUMN gift_message TEXT;

-- Create index for faster gift lookups
CREATE INDEX IF NOT EXISTS idx_payments_recipient ON payments(recipient_telegram_id);
CREATE INDEX IF NOT EXISTS idx_payments_is_gift ON payments(is_gift);

