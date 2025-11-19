-- Migration: Create tasks table
-- Description: Task definitions for the mission system
-- Date: 2025-11-19

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,                      -- Task ID (e.g., 'task_interests')
  category TEXT NOT NULL,                   -- 'profile' / 'social' / 'action' / 'invite'
  name TEXT NOT NULL,                       -- Task name
  description TEXT NOT NULL,                -- Task description
  reward_amount INTEGER NOT NULL,           -- Reward amount (bottles)
  reward_type TEXT NOT NULL,                -- 'daily' (one-time) / 'permanent' (recurring)
  sort_order INTEGER DEFAULT 0,             -- Display order
  is_enabled INTEGER DEFAULT 1,             -- Is task enabled (0/1)
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_enabled ON tasks(is_enabled);
CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON tasks(sort_order);

-- Insert initial task data
-- Profile tasks
INSERT INTO tasks (id, category, name, description, reward_amount, reward_type, sort_order) VALUES
('task_interests', 'profile', '填寫興趣標籤', '讓別人更了解你', 1, 'daily', 1),
('task_bio', 'profile', '完善自我介紹', '寫下你的故事（至少 20 字）', 1, 'daily', 2),
('task_city', 'profile', '設定地區', '找到同城的朋友', 1, 'daily', 3);

-- Social media tasks
INSERT INTO tasks (id, category, name, description, reward_amount, reward_type, sort_order) VALUES
('task_join_channel', 'social', '加入官方頻道', '獲取最新消息和活動', 1, 'daily', 4);

-- Action tasks
INSERT INTO tasks (id, category, name, description, reward_amount, reward_type, sort_order) VALUES
('task_first_bottle', 'action', '丟出第一個瓶子', '開始你的交友之旅', 1, 'daily', 5),
('task_first_catch', 'action', '撿起第一個瓶子', '看看別人的故事', 1, 'daily', 6),
('task_first_conversation', 'action', '開始第一次對話', '建立你的第一個連接（長按訊息 → 選擇「回覆」）', 1, 'daily', 7);

-- Invite task (continuous task)
INSERT INTO tasks (id, category, name, description, reward_amount, reward_type, sort_order) VALUES
('task_invite_progress', 'invite', '邀請好友', '每邀請 1 人，每日額度永久 +1（免費最多 10 人，VIP 最多 100 人）', 1, 'permanent', 8);

