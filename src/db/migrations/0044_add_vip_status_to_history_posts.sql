-- Migration: Add VIP status tracking to conversation_history_posts
-- Purpose: Track VIP status when post was created to detect changes and refresh avatars
-- Date: 2025-11-21

-- Add created_with_vip_status column to track VIP status at post creation time
ALTER TABLE conversation_history_posts 
ADD COLUMN created_with_vip_status INTEGER DEFAULT 0;

-- Update existing posts: set VIP status based on current user VIP status
UPDATE conversation_history_posts
SET created_with_vip_status = (
  SELECT CASE 
    WHEN u.is_vip = 1 AND u.vip_expire_at IS NOT NULL AND u.vip_expire_at > datetime('now')
    THEN 1
    ELSE 0
  END
  FROM users u
  WHERE u.telegram_id = conversation_history_posts.user_telegram_id
);

-- Create index for efficient VIP status queries
CREATE INDEX IF NOT EXISTS idx_history_posts_vip_status 
ON conversation_history_posts(user_telegram_id, created_with_vip_status);

