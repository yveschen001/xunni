-- Add last_sender_id to conversations table to track message turn
ALTER TABLE conversations ADD COLUMN last_sender_id TEXT;

-- Create index for efficient querying of message reminders
-- We filter by status='active', check last_message_at range, and need last_sender_id to determine who to notify
CREATE INDEX IF NOT EXISTS idx_conversations_remind_check 
ON conversations(status, last_message_at, last_sender_id);

