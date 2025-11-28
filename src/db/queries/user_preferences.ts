import type { D1Database } from '@cloudflare/workers-types';
import type { UserPushPreferences } from '~/domain/user_preferences';

export async function getUserPushPreferences(telegramId: string, db: D1Database): Promise<UserPushPreferences> {
  const result = await db.prepare('SELECT * FROM user_push_preferences WHERE user_id = ?').bind(telegramId).first<UserPushPreferences>();
  return result || {};
}
