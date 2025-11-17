-- Migration 0012: Add blood_type column to users table
-- Purpose: Store user's blood type for matching (VIP feature)

ALTER TABLE users ADD COLUMN blood_type TEXT;

-- Valid values: 'A', 'B', 'AB', 'O', NULL (not set)
-- NULL means user hasn't set blood type or chose "不確定"

