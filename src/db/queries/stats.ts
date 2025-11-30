import type { DatabaseClient } from '../client';

export async function getDailyStats(db: DatabaseClient, date: string): Promise<any> {
  const sql = `SELECT * FROM daily_stats WHERE date = ?`;
  return await db.queryOne(sql, [date]);
}

export async function getDailyTranslationStats(db: DatabaseClient, date: string): Promise<any> {
  const sql = `SELECT * FROM daily_translation_stats WHERE date = ?`;
  return await db.queryOne(sql, [date]);
}

