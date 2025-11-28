-- Migration: Create Push System Tables
-- 1. user_push_preferences: Stores user settings for push notifications
-- 2. push_notifications: Log of sent push notifications for history and frequency control

-- 1. User Push Preferences
CREATE TABLE IF NOT EXISTS user_push_preferences (
  user_id TEXT PRIMARY KEY, -- FK to users.telegram_id
  
  -- Notification Toggles (1 = enabled, 0 = disabled)
  throw_reminder_enabled INTEGER DEFAULT 1,
  catch_reminder_enabled INTEGER DEFAULT 1,
  message_reminder_enabled INTEGER DEFAULT 1,
  
  -- Quiet Hours (Local Time)
  quiet_hours_start INTEGER DEFAULT 22, -- 22:00
  quiet_hours_end INTEGER DEFAULT 8,    -- 08:00
  timezone TEXT DEFAULT 'UTC',          -- Default timezone (can be updated by user)
  
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(telegram_id)
);

-- 2. Push Notification History
CREATE TABLE IF NOT EXISTS push_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  
  -- Type: 'throw_reminder', 'catch_reminder', 'message_reminder', 'onboarding_reminder'
  notification_type TEXT NOT NULL,
  
  -- Content and Status
  content TEXT,
  status TEXT DEFAULT 'sent', -- 'sent', 'failed', 'dismissed', 'clicked'
  
  -- Metadata
  sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
  clicked_at TEXT,
  dismissed_at TEXT,
  
  FOREIGN KEY (user_id) REFERENCES users(telegram_id)
);

CREATE INDEX IF NOT EXISTS idx_push_notifications_user_type_sent 
  ON push_notifications(user_id, notification_type, sent_at);

