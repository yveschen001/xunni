-- Migration 0042: Add avatar URL to conversation history posts
-- Purpose: Store partner's avatar URL for display in history posts

-- Add partner_avatar_url column to conversation_history_posts table
ALTER TABLE conversation_history_posts 
ADD COLUMN partner_avatar_url TEXT DEFAULT NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_history_posts_avatar 
ON conversation_history_posts(partner_avatar_url) 
WHERE partner_avatar_url IS NOT NULL;

