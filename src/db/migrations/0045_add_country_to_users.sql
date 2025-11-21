-- Migration: Add country_code to users table
-- Description: Add country code field for country flag display feature
-- Date: 2025-11-21

-- Add country_code column to users table
ALTER TABLE users 
ADD COLUMN country_code TEXT DEFAULT NULL;

-- Create index for country queries
CREATE INDEX IF NOT EXISTS idx_users_country_code ON users(country_code);

