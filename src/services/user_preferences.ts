import type { D1Database } from '@cloudflare/workers-types';
import type { UserPushPreferences } from '~/domain/user_preferences';

export const DEFAULT_PREFERENCES: UserPushPreferences = {
  quiet_hours_start: 0,
  quiet_hours_end: 0,
  throw_reminder_enabled: true,
  catch_reminder_enabled: true,
  message_reminder_enabled: true,
  onboarding_reminder_enabled: true,
  mbti_share_reminder_enabled: true
};

export class UserPreferencesService {
  constructor(private db: D1Database) {}

  async getPreferences(userId: string): Promise<UserPushPreferences> {
    const prefsResult = await this.db.prepare(
      'SELECT * FROM user_push_preferences WHERE user_id = ?'
    ).bind(userId).first<any>();

    return {
      ...DEFAULT_PREFERENCES,
      ...prefsResult
    };
  }

  async updatePreferences(userId: string, prefs: Partial<UserPushPreferences>): Promise<void> {
    // All preferences are now in user_push_preferences table
    const fields = [
      'quiet_hours_start',
      'quiet_hours_end',
      'throw_reminder_enabled',
      'catch_reminder_enabled',
      'message_reminder_enabled',
      'onboarding_reminder_enabled',
      'mbti_share_reminder_enabled'
    ];
    
    const updates: string[] = [];
    const params: any[] = [];
    
    for (const field of fields) {
      if ((prefs as any)[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push((prefs as any)[field]);
      }
    }
    
    if (updates.length > 0) {
      // Check if row exists
      const exists = await this.db.prepare('SELECT 1 FROM user_push_preferences WHERE user_id = ?').bind(userId).first();
      
      if (exists) {
        params.push(userId);
        await this.db.prepare(
          `UPDATE user_push_preferences SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`
        ).bind(...params).run();
      } else {
        // Insert with defaults merged
        const newPrefs = { ...DEFAULT_PREFERENCES, ...prefs };
        await this.db.prepare(`
          INSERT INTO user_push_preferences (
            user_id, 
            quiet_hours_start, quiet_hours_end,
            throw_reminder_enabled, catch_reminder_enabled, 
            message_reminder_enabled, onboarding_reminder_enabled, mbti_share_reminder_enabled
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          userId, 
          newPrefs.quiet_hours_start, newPrefs.quiet_hours_end,
          newPrefs.throw_reminder_enabled, newPrefs.catch_reminder_enabled,
          newPrefs.message_reminder_enabled, newPrefs.onboarding_reminder_enabled,
          newPrefs.mbti_share_reminder_enabled
        ).run();
      }
    }
  }
}
