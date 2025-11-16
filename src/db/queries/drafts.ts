/**
 * Draft Database Queries
 */

import type { DatabaseClient } from '../client';
import type { BottleDraft } from '~/domain/draft';
import { calculateDraftExpiration } from '~/domain/draft';

/**
 * Save or update draft
 */
export async function saveDraft(
  db: DatabaseClient,
  telegramId: string,
  content: string,
  targetGender: 'male' | 'female' | 'any' = 'any',
  targetMbtiFilter?: string[],
  targetZodiacFilter?: string[]
): Promise<number> {
  const expiresAt = calculateDraftExpiration();
  
  // Delete existing draft for this user
  await db.d1.prepare(`
    DELETE FROM bottle_drafts
    WHERE telegram_id = ?
  `).bind(telegramId).run();
  
  // Insert new draft
  const result = await db.d1.prepare(`
    INSERT INTO bottle_drafts (
      telegram_id,
      content,
      target_gender,
      target_mbti_filter,
      target_zodiac_filter,
      created_at,
      expires_at
    ) VALUES (?, ?, ?, ?, ?, datetime('now'), ?)
  `).bind(
    telegramId,
    content,
    targetGender,
    targetMbtiFilter ? JSON.stringify(targetMbtiFilter) : null,
    targetZodiacFilter ? JSON.stringify(targetZodiacFilter) : null,
    expiresAt.toISOString()
  ).run();
  
  return result.meta.last_row_id as number;
}

/**
 * Get user's draft
 */
export async function getDraft(
  db: DatabaseClient,
  telegramId: string
): Promise<BottleDraft | null> {
  const result = await db.d1.prepare(`
    SELECT * FROM bottle_drafts
    WHERE telegram_id = ?
      AND datetime(expires_at) > datetime('now')
    ORDER BY created_at DESC
    LIMIT 1
  `).bind(telegramId).first();
  
  return result as BottleDraft | null;
}

/**
 * Delete draft
 */
export async function deleteDraft(
  db: DatabaseClient,
  draftId: number
): Promise<void> {
  await db.d1.prepare(`
    DELETE FROM bottle_drafts
    WHERE id = ?
  `).bind(draftId).run();
}

/**
 * Delete user's drafts
 */
export async function deleteUserDrafts(
  db: DatabaseClient,
  telegramId: string
): Promise<void> {
  await db.d1.prepare(`
    DELETE FROM bottle_drafts
    WHERE telegram_id = ?
  `).bind(telegramId).run();
}

/**
 * Clean up expired drafts (for cron job)
 */
export async function cleanupExpiredDrafts(
  db: DatabaseClient
): Promise<number> {
  const result = await db.d1.prepare(`
    DELETE FROM bottle_drafts
    WHERE datetime(expires_at) < datetime('now')
  `).run();
  
  return result.meta.changes || 0;
}

