-- Add allow_matching to users table for Love Diagnosis viral loop
ALTER TABLE users ADD COLUMN allow_matching INTEGER DEFAULT 0;

-- Add profile_snapshot to fortune_history for data integrity check
ALTER TABLE fortune_history ADD COLUMN profile_snapshot TEXT;

-- Add target_user_id to fortune_history for Love Diagnosis dual-user tracking
ALTER TABLE fortune_history ADD COLUMN target_user_id TEXT;

