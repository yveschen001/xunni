-- Migration 0047: Create Bottle Match Slots for VIP Triple Bottle Feature
-- Adds bottle_match_slots table and is_vip_triple field to bottles table

-- ============================================================================
-- 1. Create bottle_match_slots table
-- ============================================================================
CREATE TABLE IF NOT EXISTS bottle_match_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bottle_id INTEGER NOT NULL,
  slot_role TEXT NOT NULL CHECK(slot_role IN ('primary', 'secondary')),
  slot_index INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'matched', 'expired')),
  matched_with_telegram_id TEXT,
  conversation_id INTEGER,
  matched_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (bottle_id) REFERENCES bottles(id),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

-- Create indexes for bottle_match_slots
CREATE INDEX idx_slots_bottle_id ON bottle_match_slots(bottle_id);
CREATE INDEX idx_slots_status ON bottle_match_slots(status);
CREATE INDEX idx_slots_matched_with ON bottle_match_slots(matched_with_telegram_id);
CREATE INDEX idx_slots_bottle_status ON bottle_match_slots(bottle_id, status);
CREATE INDEX idx_slots_role ON bottle_match_slots(slot_role);

-- ============================================================================
-- 2. Add is_vip_triple field to bottles table
-- ============================================================================
ALTER TABLE bottles ADD COLUMN is_vip_triple INTEGER DEFAULT 0;

-- Create index for is_vip_triple
CREATE INDEX idx_bottles_is_vip_triple ON bottles(is_vip_triple);

