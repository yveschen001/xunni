import type { Env } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { createI18n } from '~/i18n';
import { FortuneService } from '~/services/fortune';
import { UserActivityLevel } from '~/domain/user';
import { getUserActivityLevel } from '~/services/user_activity';

export async function sendDailyFortunePush(env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  
  // Strategy: Mandatory push for active users
  // Rules:
  // 1. User must have a Fortune Profile.
  // 2. User must not be deleted or blocked.
  // 3. User must be "Active" (not DORMANT).
  // 4. (Future) Respect Timezone. Current implementation assumes Worker triggers at appropriate global time (e.g. 9 AM UTC+8).
  
  // Select unique users with profiles
  // Optimization: Join with bans table to filter blocked users
  const profiles = await db.d1.prepare(`
    SELECT DISTINCT 
      p.user_id, 
      p.name as profile_name,
      u.timezone, 
      u.language_pref, 
      u.telegram_id as user_telegram_id,
      fq.additional_quota,
      fq.weekly_free_quota
    FROM fortune_profiles p
    JOIN users u ON p.user_id = u.telegram_id
    LEFT JOIN fortune_quota fq ON p.user_id = fq.telegram_id
    LEFT JOIN bans b ON u.telegram_id = b.user_id AND b.is_active = 1
    WHERE u.deleted_at IS NULL
      AND b.id IS NULL
      AND p.is_default = 1
  `).all();
  
  if (!profiles.results) return;

  console.log(`[DailyFortunePush] Found ${profiles.results.length} candidates.`);

  for (const record of profiles.results as any[]) {
    // Check Activity Level
    try {
      const activityLevel = await getUserActivityLevel(record.user_telegram_id, db.d1);
      // Skip if Dormant (>30 days inactive)
      if (activityLevel === UserActivityLevel.DORMANT) {
        continue;
      }

      // Prioritize active users or those with quota
      // (Actually we push to all active users as per "operational strategy")
      
      const i18n = createI18n(record.language_pref || 'zh-TW');
      
      await telegram.sendMessage(record.user_telegram_id, 
        `📅 *${i18n.t('fortune.dailyPushTitle')}*\n\n` +
        `${i18n.t('fortune.dailyPushBody', { name: record.profile_name })}\n\n` +
        `👇 ${i18n.t('fortune.clickToView')}`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: `🔮 ${i18n.t('fortune.viewDaily')}`, callback_data: 'fortune_daily' }
            ]]
          }
        }
      );
    } catch (e) {
      console.error(`Failed to push fortune to ${record.user_telegram_id}:`, e);
      // If forbidden (user blocked bot), mark as deleted or handle appropriately
      if (String(e).includes('Forbidden')) {
        // Maybe mark user as inactive/deleted in future
      }
    }
  }
}
