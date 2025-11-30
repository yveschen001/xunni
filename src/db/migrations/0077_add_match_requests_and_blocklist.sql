-- Migration: 0077_add_match_requests_and_blocklist.sql
-- Description: Add tables for attribute match requests and user blocklist

-- 1. Create match_requests table
CREATE TABLE IF NOT EXISTS match_requests (
    id TEXT PRIMARY KEY, -- UUID
    requester_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected', 'expired')),
    relationship_type TEXT NOT NULL CHECK(relationship_type IN ('love', 'family', 'friend', 'work')),
    family_role TEXT, -- Optional, e.g. 'father', 'daughter'
    rejection_count INTEGER DEFAULT 0,
    last_rejected_at TEXT, -- ISO8601 timestamp
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT NOT NULL, -- ISO8601 timestamp
    FOREIGN KEY (requester_id) REFERENCES users(telegram_id),
    FOREIGN KEY (target_id) REFERENCES users(telegram_id)
);

-- Indexes for match_requests
CREATE INDEX IF NOT EXISTS idx_match_requests_requester ON match_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_match_requests_target ON match_requests(target_id);
CREATE INDEX IF NOT EXISTS idx_match_requests_pair ON match_requests(requester_id, target_id);
CREATE INDEX IF NOT EXISTS idx_match_requests_status ON match_requests(status);

-- 2. Create user_blocklist table
CREATE TABLE IF NOT EXISTS user_blocklist (
    user_id TEXT NOT NULL, -- Initiator (who blocked)
    blocked_user_id TEXT NOT NULL, -- Target (who is blocked)
    reason TEXT DEFAULT 'manual', -- 'match_rejected', 'manual'
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, blocked_user_id),
    FOREIGN KEY (user_id) REFERENCES users(telegram_id),
    FOREIGN KEY (blocked_user_id) REFERENCES users(telegram_id)
);

-- Indexes for user_blocklist
CREATE INDEX IF NOT EXISTS idx_user_blocklist_user ON user_blocklist(user_id);
CREATE INDEX IF NOT EXISTS idx_user_blocklist_blocked ON user_blocklist(blocked_user_id);

-- 3. Update users table default for allow_matching (SQLite doesn't support changing default easily, 
-- but we can update existing nulls/false if needed, or just rely on application logic treating null as true)
-- We will handle allow_matching logic in application code (default true).

