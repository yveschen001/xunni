-- Migration 0013: Add blood_type filter to bottles and bottle_drafts tables
ALTER TABLE bottles ADD COLUMN target_blood_type_filter TEXT DEFAULT NULL;
ALTER TABLE bottle_drafts ADD COLUMN target_blood_type_filter TEXT DEFAULT NULL;

-- Valid values: 'A', 'B', 'AB', 'O', 'any', NULL
-- NULL or 'any' means no blood type filter

