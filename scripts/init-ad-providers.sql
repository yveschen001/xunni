-- Initialize ad providers
-- This script sets up the default ad providers for XunNi

-- Insert GigaPub as primary provider
INSERT INTO ad_providers (
  provider_name,
  provider_display_name,
  is_enabled,
  priority,
  weight,
  config,
  script_url
) VALUES (
  'gigapub',
  'GigaPub',
  1,
  100,
  100,
  '{"project_id": "YOUR_GIGAPUB_PROJECT_ID"}',
  'https://cdn.gigapub.com/sdk/v1/gigapub.js'
);

-- Insert Google AdSense as fallback (disabled by default)
INSERT INTO ad_providers (
  provider_name,
  provider_display_name,
  is_enabled,
  priority,
  weight,
  config,
  script_url
) VALUES (
  'google_adsense',
  'Google AdSense',
  0,
  90,
  80,
  '{"client_id": "YOUR_GOOGLE_CLIENT_ID", "slot_id": "YOUR_SLOT_ID"}',
  'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'
);

-- Insert Unity Ads as fallback (disabled by default)
INSERT INTO ad_providers (
  provider_name,
  provider_display_name,
  is_enabled,
  priority,
  weight,
  config,
  script_url
) VALUES (
  'unity_ads',
  'Unity Ads',
  0,
  80,
  70,
  '{"game_id": "YOUR_UNITY_GAME_ID", "placement_id": "YOUR_PLACEMENT_ID"}',
  'https://cdn.unityads.unity3d.com/webview/2.0/unity-ads.js'
);

-- Verify insertion
SELECT 
  id,
  provider_name,
  provider_display_name,
  is_enabled,
  priority,
  weight
FROM ad_providers
ORDER BY priority DESC;

