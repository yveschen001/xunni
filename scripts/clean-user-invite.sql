-- Clean user invite data for testing
-- Usage: wrangler d1 execute xunni-db-staging --file=scripts/clean-user-invite.sql

-- Replace 7788737902 with the actual user ID

-- 1. Delete invite records
DELETE FROM invites WHERE invitee_telegram_id = '7788737902';
DELETE FROM invites WHERE inviter_telegram_id = '7788737902';

-- 2. Clear user's invited_by
UPDATE users SET invited_by = NULL WHERE telegram_id = '7788737902';

-- 3. Reset inviter's successful_invites (if needed)
-- UPDATE users SET successful_invites = 0 WHERE telegram_id = '396943893';

-- Verify
SELECT telegram_id, nickname, invited_by, successful_invites FROM users WHERE telegram_id IN ('7788737902', '396943893');
SELECT * FROM invites WHERE invitee_telegram_id = '7788737902' OR inviter_telegram_id = '7788737902';

