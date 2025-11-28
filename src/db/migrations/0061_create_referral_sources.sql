CREATE TABLE referral_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,         -- The user who clicked the link
  source_type TEXT NOT NULL,     -- 'mbti_share', 'invite_code', etc.
  source_id TEXT,                -- Specific ID (e.g. resultId or inviteCode)
  referrer_id TEXT,              -- The user who shared (if available/decodable)
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_referral_sources_user_id ON referral_sources(user_id);
CREATE INDEX idx_referral_sources_referrer_id ON referral_sources(referrer_id);
CREATE INDEX idx_referral_sources_type ON referral_sources(source_type);
CREATE INDEX idx_referral_sources_created_at ON referral_sources(created_at);

