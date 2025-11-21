-- Migration 0043: Add avatar cache fields to users table
-- Purpose: Cache avatar URLs and enable smart avatar update detection

-- Add avatar cache fields
ALTER TABLE users 
ADD COLUMN avatar_file_id TEXT DEFAULT NULL;

ALTER TABLE users 
ADD COLUMN avatar_original_url TEXT DEFAULT NULL;

ALTER TABLE users 
ADD COLUMN avatar_blurred_url TEXT DEFAULT NULL;

ALTER TABLE users 
ADD COLUMN avatar_updated_at TIMESTAMP DEFAULT NULL;

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_users_avatar_updated 
ON users(avatar_updated_at) 
WHERE avatar_updated_at IS NOT NULL;

-- Add index for file_id lookups
CREATE INDEX IF NOT EXISTS idx_users_avatar_file_id 
ON users(avatar_file_id) 
WHERE avatar_file_id IS NOT NULL;

