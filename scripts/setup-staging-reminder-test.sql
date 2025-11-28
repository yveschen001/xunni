-- Insert mock partner
INSERT INTO users (telegram_id, username, nickname, language_pref, onboarding_step, bot_status, last_active_at, created_at, updated_at)
VALUES ('999999999', 'mock_partner', 'MockPartner', 'zh-TW', 'completed', 'active', datetime('now'), datetime('now'), datetime('now'))
ON CONFLICT(telegram_id) DO NOTHING;

-- Insert a dummy bottle for the conversation
INSERT INTO bottles (id, owner_telegram_id, content, status)
VALUES (99999, '999999999', 'Dummy Bottle Content', 'matched')
ON CONFLICT(id) DO NOTHING;

-- Insert active conversation (25 hours old, partner spoke last)
INSERT INTO conversations (user_a_telegram_id, user_b_telegram_id, bottle_id, status, created_at, last_message_at, last_sender_id)
VALUES ('1809685164', '999999999', 99999, 'active', datetime('now', '-30 hours'), datetime('now', '-25 hours'), '999999999');

-- Insert message
INSERT INTO conversation_messages (conversation_id, sender_telegram_id, receiver_telegram_id, original_text, created_at, is_blocked_by_ai)
SELECT id, '999999999', '1809685164', '這是一條25小時前的測試訊息，你應該收到提醒！', datetime('now', '-25 hours'), 0
FROM conversations 
WHERE user_a_telegram_id = '1809685164' AND user_b_telegram_id = '999999999' AND status = 'active'
ORDER BY created_at DESC LIMIT 1;
