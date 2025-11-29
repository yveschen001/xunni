-- Fix payments table schema: add amount_stars if missing
-- This is required because migration 0004 might have been applied partially or schema drifted on Staging.
-- We use a simple ADD COLUMN. If it fails (column exists), the migration system usually handles it or we can ignore.
-- But since user reported "no such column: amount_stars", it is definitely missing.

ALTER TABLE payments ADD COLUMN amount_stars INTEGER NOT NULL DEFAULT 0;

