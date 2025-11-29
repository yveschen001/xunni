-- Migration: 0072_add_source_to_ad_sessions.sql
-- Add source column to ad_sessions to track where the ad request came from (e.g., fortune, bottle)

ALTER TABLE ad_sessions ADD COLUMN source TEXT;

