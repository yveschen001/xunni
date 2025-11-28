-- Clean up test data
DELETE FROM conversation_messages WHERE sender_telegram_id = '999999999' OR receiver_telegram_id = '999999999';
DELETE FROM conversations WHERE user_a_telegram_id = '999999999' OR user_b_telegram_id = '999999999';
DELETE FROM bottles WHERE owner_telegram_id = '999999999';
DELETE FROM users WHERE telegram_id = '999999999';

