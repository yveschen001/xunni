-- Add i18n and soft delete columns to official_ads table
--
-- Purpose:
--   1. Support auto-translation (title_i18n, content_i18n)
--   2. Support soft delete (deleted_at)
--
-- Columns:
--   title_i18n: JSON string, e.g. {"en": "Title", "zh-TW": "標題"}
--   content_i18n: JSON string, e.g. {"en": "Content", "zh-TW": "內容"}
--   deleted_at: ISO8601 timestamp, NULL means not deleted

ALTER TABLE official_ads ADD COLUMN title_i18n TEXT;
ALTER TABLE official_ads ADD COLUMN content_i18n TEXT;
ALTER TABLE official_ads ADD COLUMN deleted_at TEXT;

