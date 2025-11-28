-- Add filters column to broadcasts table for precise targeting
-- This allows storing complex JSON filter conditions like {"gender": "female", "min_age": 18}

ALTER TABLE broadcasts ADD COLUMN filters TEXT;

-- Create index for performance if we ever query by filters (optional but good practice)
-- CREATE INDEX IF NOT EXISTS idx_broadcasts_filters ON broadcasts(filters);

