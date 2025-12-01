-- Add job_role and industry columns to users table
ALTER TABLE users ADD COLUMN job_role TEXT;
ALTER TABLE users ADD COLUMN industry TEXT;

