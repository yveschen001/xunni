-- Migration: 0035_insert_gigapub_provider.sql
-- Insert GigaPub as the primary ad provider
--
-- Purpose:
--   Configure GigaPub (Project ID: 4406) as the main video ad provider
--
-- Business Value:
--   - Enable real video ads for users
--   - Start earning revenue from ad impressions
--
-- Configuration:
--   - Priority: 100 (highest)
--   - Weight: 100 (100% when using weighted random)
--   - Script: https://ad.gigapub.tech/script?id=4406

-- Insert GigaPub provider
INSERT INTO ad_providers (
  provider_name,
  provider_display_name,
  is_enabled,
  priority,
  weight,
  config,
  script_url,
  fallback_script_urls
) VALUES (
  'gigapub',
  'GigaPub',
  1,
  100,
  100,
  '{"project_id": "4406"}',
  'https://ad.gigapub.tech/script?id=4406',
  '["https://ru-ad.gigapub.tech/script?id=4406"]'
)
ON CONFLICT(provider_name) DO UPDATE SET
  config = '{"project_id": "4406"}',
  script_url = 'https://ad.gigapub.tech/script?id=4406',
  fallback_script_urls = '["https://ru-ad.gigapub.tech/script?id=4406"]',
  is_enabled = 1,
  priority = 100,
  weight = 100,
  updated_at = CURRENT_TIMESTAMP;

