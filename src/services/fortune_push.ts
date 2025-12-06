import type { Env } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { createI18n, loadTranslations } from '~/i18n';
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
  // 4. Respect Timezone: Only push at 9 AM local time.
  
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
  
  console.log(`[DailyFortunePush] Found ${profiles.results.length} candidates.`);

  const now = new Date();
  const utcHour = now.getUTCHours();

  for (const record of profiles.results as any[]) {
    try {
      // Check Activity Level
      const activityLevel = await getUserActivityLevel(record.user_telegram_id, db.d1);
      // Skip if Dormant (>30 days inactive)
      if (activityLevel === UserActivityLevel.DORMANT) {
        continue;
      }

      // Check Timezone (Target: 09:00 Local Time)
      // Default to Asia/Taipei (UTC+8) if not set
      const userTimezone = record.timezone || 'Asia/Taipei';
      
      // Calculate local hour
      let localHour;
      try {
        // Use Intl.DateTimeFormat to get hour in specific timezone
        const parts = new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          hour12: false,
          timeZone: userTimezone,
        }).formatToParts(now);
        const hourPart = parts.find(p => p.type === 'hour');
        localHour = hourPart ? parseInt(hourPart.value, 10) : -1;
        
        // Handle 24h format weirdness (sometimes returns 24 instead of 0)
        if (localHour === 24) localHour = 0;
      } catch (e) {
        // Fallback to UTC+8 if timezone is invalid
        console.warn(`[DailyFortunePush] Invalid timezone ${userTimezone} for user ${record.user_telegram_id}, falling back to UTC+8`);
        localHour = (utcHour + 8) % 24;
      }

      // Only push if it's 9 AM (allow a small window if needed, but cron is hourly)
      if (localHour !== 9) {
        // console.debug(`[DailyFortunePush] Skipping user ${record.user_telegram_id}: Local hour is ${localHour} (Target: 9)`);
        continue;
      }

      // Prepare I18n
      const userLang = record.language_pref || 'zh-TW';
      // Load translations from KV before creating I18n instance
      await loadTranslations(env, userLang);
      const i18n = createI18n(userLang);
      
      console.log(`[DailyFortunePush] Sending to ${record.user_telegram_id} (Lang: ${userLang}, Timezone: ${userTimezone})`);

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
