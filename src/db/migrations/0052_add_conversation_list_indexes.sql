-- Migration 0052: Add indexes for conversation list optimization
-- Purpose: Optimize conversation list queries with pagination

-- Index for user_a_telegram_id with last_message_at for efficient sorting
CREATE INDEX IF NOT EXISTS idx_conversations_user_a_last_msg 
ON conversations(user_a_telegram_id, last_message_at DESC);

-- Index for user_b_telegram_id with last_message_at for efficient sorting
CREATE INDEX IF NOT EXISTS idx_conversations_user_b_last_msg 
ON conversations(user_b_telegram_id, last_message_at DESC);

-- Index for conversation_messages to optimize message count queries
CREATE INDEX IF NOT EXISTS idx_conv_messages_conversation_created 
ON conversation_messages(conversation_id, created_at DESC);

