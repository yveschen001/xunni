-- Migration: Add country confirmation task
-- Description: Add task for users to confirm their country/region
-- Date: 2025-11-21

-- Add country confirmation task to tasks table
INSERT INTO tasks (id, category, name, description, reward_amount, reward_type, sort_order, is_enabled)
VALUES ('task_confirm_country', 'profile', '🌍 確認你的國家/地區', '讓其他用戶更了解你', 1, 'daily', 4, 1);

