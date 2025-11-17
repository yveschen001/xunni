-- Migration 0015: Add conversation history posts tables
-- Purpose: Track conversation history posts and new message posts for each conversation

-- Table: conversation_history_posts
-- Purpose: Store history posts for each conversation (editable, with 4000 char limit)
CREATE TABLE IF NOT EXISTS conversation_history_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  user_telegram_id TEXT NOT NULL,
  identifier TEXT NOT NULL,                -- 例如：1117ABCD
  post_number INTEGER NOT NULL DEFAULT 1,  -- 帖子編號：1, 2, 3...
  telegram_message_id INTEGER NOT NULL,    -- Telegram 帖子 ID
  content TEXT NOT NULL DEFAULT '',        -- 歷史記錄內容
  char_count INTEGER NOT NULL DEFAULT 0,   -- 字符數
  message_count INTEGER NOT NULL DEFAULT 0, -- 訊息數量
  is_latest BOOLEAN NOT NULL DEFAULT 1,    -- 是否為最新的歷史記錄帖子
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(conversation_id, user_telegram_id, post_number),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_telegram_id) REFERENCES users(telegram_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_history_posts_conversation ON conversation_history_posts(conversation_id, user_telegram_id);
CREATE INDEX IF NOT EXISTS idx_history_posts_latest ON conversation_history_posts(user_telegram_id, is_latest);
CREATE INDEX IF NOT EXISTS idx_history_posts_identifier ON conversation_history_posts(identifier);

-- Table: conversation_new_message_posts
-- Purpose: Track the "new message" post for each conversation (deleted and recreated on each message)
CREATE TABLE IF NOT EXISTS conversation_new_message_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  user_telegram_id TEXT NOT NULL,
  identifier TEXT NOT NULL,                -- 例如：1117ABCD
  telegram_message_id INTEGER NOT NULL,    -- Telegram 帖子 ID（會被更新）
  last_message_content TEXT,               -- 最後一條訊息內容
  last_message_time DATETIME,              -- 最後一條訊息時間
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(conversation_id, user_telegram_id),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_telegram_id) REFERENCES users(telegram_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_new_message_posts_conversation ON conversation_new_message_posts(conversation_id, user_telegram_id);
CREATE INDEX IF NOT EXISTS idx_new_message_posts_identifier ON conversation_new_message_posts(identifier);

