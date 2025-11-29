-- Migration: Add Partner Tasks (Mars2049, Moonpacket)
-- Description: Adds default social tasks for partners
-- Date: 2025-11-29

-- Task 1: Mars2049 Partner Bot
INSERT INTO tasks (
  id, category, name, description, reward_amount, reward_type, sort_order, is_enabled,
  action_url, verification_type, target_id, icon
) VALUES (
  'task_mars049_partner_bot',
  'social',
  'tasks.name.mars049_bot',
  'tasks.desc.mars049_bot',
  1,
  'daily',
  10,
  1,
  'https://t.me/Mars2049_Bot',
  'none',
  NULL,
  '🚀'
);

-- Task 2: Moonpacket Partner Bot
INSERT INTO tasks (
  id, category, name, description, reward_amount, reward_type, sort_order, is_enabled,
  action_url, verification_type, target_id, icon
) VALUES (
  'task_moonpacket_partner_bot',
  'social',
  'tasks.name.moonpacket_bot',
  'tasks.desc.moonpacket_bot',
  1,
  'daily',
  11,
  1,
  'https://t.me/moonpacket_bot',
  'none',
  NULL,
  '🧧'
);

-- Task 3: Moonpacket Group Chat
INSERT INTO tasks (
  id, category, name, description, reward_amount, reward_type, sort_order, is_enabled,
  action_url, verification_type, target_id, icon
) VALUES (
  'task_moonpacket_group_chat',
  'social',
  'tasks.name.moonpacket_group',
  'tasks.desc.moonpacket_group',
  1,
  'daily',
  12,
  1,
  'https://t.me/moonpacketchat',
  'telegram_chat',
  '@moonpacketchat',
  '🧧'
);

-- Task 4: Moonpacket Official Channel
INSERT INTO tasks (
  id, category, name, description, reward_amount, reward_type, sort_order, is_enabled,
  action_url, verification_type, target_id, icon
) VALUES (
  'task_moonpacket_channel',
  'social',
  'tasks.name.moonpacket_channel',
  'tasks.desc.moonpacket_channel',
  1,
  'daily',
  13,
  1,
  'https://t.me/moonpacketofficial',
  'telegram_chat',
  '@moonpacketofficial',
  '🧧'
);

