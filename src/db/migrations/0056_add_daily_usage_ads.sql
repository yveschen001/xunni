-- Add ads_watched to daily_usage table for MoonPacket API optimization
ALTER TABLE daily_usage ADD COLUMN ads_watched INTEGER DEFAULT 0;

