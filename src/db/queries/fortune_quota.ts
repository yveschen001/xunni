import type { DatabaseClient } from '../client';

export async function getFortuneQuota(db: DatabaseClient, telegramId: string): Promise<{ daily_used: number; daily_limit: number }> {
  const sql = `SELECT daily_used, daily_limit FROM fortune_quota WHERE user_id = ?`;
  const quota = await db.queryOne<{ daily_used: number; daily_limit: number }>(sql, [telegramId]);
  return quota || { daily_used: 0, daily_limit: 1 };
}

export async function decrementFortuneQuota(db: DatabaseClient, telegramId: string): Promise<void> {
  const sql = `
    UPDATE fortune_quota 
    SET daily_used = daily_used + 1 
    WHERE user_id = ?
  `;
  await db.execute(sql, [telegramId]);
}

