import type { D1Database } from '@cloudflare/workers-types';
import { DatabaseClient } from '../client';

export interface ReferralSource {
  id: number;
  user_id: string;
  source_type: string;
  source_id: string | null;
  referrer_id: string | null;
  created_at: string;
}

export async function createReferralSource(
  db: DatabaseClient,
  userId: string,
  sourceType: string,
  sourceId: string | null,
  referrerId: string | null
): Promise<void> {
  await db.d1.prepare(`
    INSERT INTO referral_sources (user_id, source_type, source_id, referrer_id)
    VALUES (?, ?, ?, ?)
  `).bind(userId, sourceType, sourceId, referrerId).run();
}

/**
 * Get referral source by user ID
 */
export async function getReferralSource(
  db: DatabaseClient,
  userId: string
): Promise<ReferralSource | null> {
  return await db.d1.prepare(`
    SELECT * FROM referral_sources WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
  `).bind(userId).first<ReferralSource>();
}

