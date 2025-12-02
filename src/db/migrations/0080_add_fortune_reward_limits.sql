-- Migration: 0079_add_fortune_reward_limits.sql
-- Add timestamps to track daily limits for fortune rewards
--
-- 1. last_bottle_reward_at: Track when the last "throw 10 bottles" reward was granted
-- 2. last_invite_reward_at: Track when the last "friend of friend" invite reward was granted

ALTER TABLE fortune_quota ADD COLUMN last_bottle_reward_at TEXT;
ALTER TABLE fortune_quota ADD COLUMN last_invite_reward_at TEXT;

