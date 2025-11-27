-- Add dynamic columns to tasks table for Social Task Management
--
-- New Columns:
--   action_url: URL to open (e.g. Twitter link)
--   verification_type: 'none' (click-only) or 'telegram_chat' (check member)
--   target_id: Telegram Chat ID/Username for verification
--   name_i18n: JSON string for multilingual names
--   description_i18n: JSON string for multilingual descriptions
--   icon: Emoji icon
--   deleted_at: Soft delete timestamp

ALTER TABLE tasks ADD COLUMN action_url TEXT;
ALTER TABLE tasks ADD COLUMN verification_type TEXT CHECK(verification_type IN ('none', 'telegram_chat'));
ALTER TABLE tasks ADD COLUMN target_id TEXT;
ALTER TABLE tasks ADD COLUMN name_i18n TEXT;
ALTER TABLE tasks ADD COLUMN description_i18n TEXT;
ALTER TABLE tasks ADD COLUMN icon TEXT;
ALTER TABLE tasks ADD COLUMN deleted_at TEXT;

-- Migrate existing task_join_channel to use new structure
-- Note: We use a safe update that preserves existing behavior
UPDATE tasks 
SET 
  action_url = 'https://t.me/xunnichannel',
  verification_type = 'telegram_chat',
  target_id = '@xunnichannel', -- Default assumption, admin can update later
  icon = '📢'
WHERE id = 'task_join_channel';

