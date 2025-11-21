-- Migration 0042: Add partner_avatar_url to conversation_history_posts
-- Purpose: Store partner's avatar URL in history posts for display

-- Add partner_avatar_url column to conversation_history_posts table
ALTER TABLE conversation_history_posts 
ADD COLUMN partner_avatar_url TEXT DEFAULT NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_history_posts_avatar 
ON conversation_history_posts(partner_avatar_url) 
WHERE partner_avatar_url IS NOT NULL;

