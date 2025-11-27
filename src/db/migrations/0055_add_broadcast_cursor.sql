-- Add last_processed_id to broadcasts table for cursor pagination
ALTER TABLE broadcasts ADD COLUMN last_processed_id INTEGER DEFAULT 0;

