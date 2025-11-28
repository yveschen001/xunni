-- Backfill last_sender_id for active conversations
UPDATE conversations 
SET last_sender_id = (
  SELECT sender_telegram_id 
  FROM conversation_messages 
  WHERE conversation_messages.conversation_id = conversations.id 
  ORDER BY created_at DESC 
  LIMIT 1
)
WHERE status = 'active' AND last_sender_id IS NULL;

