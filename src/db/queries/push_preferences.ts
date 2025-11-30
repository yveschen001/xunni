import type { DatabaseClient } from '../client';

export async function getUsersWithPushEnabled(db: DatabaseClient, type: string): Promise<any[]> {
  const sql = `
    SELECT u.* 
    FROM users u 
    JOIN user_push_preferences p ON u.telegram_id = p.user_id 
    WHERE p.preference_type = ? AND p.is_enabled = 1
  `;
  return await db.query(sql, [type]);
}

export async function getUserPushPreferences(db: DatabaseClient, telegramId: string): Promise<any> {
  const sql = `SELECT * FROM user_push_preferences WHERE user_id = ?`;
  const prefs = await db.query(sql, [telegramId]);
  
  // Return default if no prefs found, or transform array to object
  if (!prefs || prefs.length === 0) return {};

  return prefs.reduce((acc: any, curr: any) => {
    acc[curr.preference_type] = curr.is_enabled === 1;
    return acc;
  }, {});
}

export async function updateUserPushPreference(db: DatabaseClient, telegramId: string, type: string, enabled: boolean): Promise<void> {
  const sql = `
    INSERT INTO user_push_preferences (user_id, preference_type, is_enabled)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, preference_type) DO UPDATE SET is_enabled = ?
  `;
  const val = enabled ? 1 : 0;
  await db.execute(sql, [telegramId, type, val, val]);
}

