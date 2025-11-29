import type { Env } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { createI18n } from '~/i18n';
import { FortuneService } from '~/services/fortune';

export async function sendDailyFortunePush(env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  
  // 1. Get all subscribed profiles
  // Optimization: In a real system, we'd query by timezone.
  // For now, we simulate a global push at 9 AM UTC+8 (Taiwan Time)
  // or just push to everyone subscribed regardless of time (MVP).
  // Better: Check current hour in each user's timezone.
  
  const currentHour = new Date().getUTCHours();
  
  // Find users who should receive push now (9 AM local time)
  // local_hour = (utc_hour + offset) % 24
  // target_local_hour = 9
  // offset = 9 - utc_hour
  // e.g. UTC=1 (9am TW), offset=8 (Asia/Taipei)
  
  // Query: Select profiles joined with users to get timezone
  const profiles = await db.d1.prepare(`
    SELECT p.*, u.timezone, u.language_pref, u.telegram_id as user_telegram_id
    FROM fortune_profiles p
    JOIN users u ON p.user_id = u.telegram_id
    WHERE p.is_subscribed = 1
  `).all();
  
  if (!profiles.results) return;

  for (const profile of profiles.results as any[]) {
    // Check timezone (simple check)
    // If timezone is null, assume UTC or skip
    // If we want to be strict about "9 AM", we need a timezone library or logic.
    // For MVP, let's just push to everyone if the Cron triggers "Daily Push Job".
    // Assuming Cron runs once a day at a specific time (e.g. 9 AM UTC+8).
    
    // Check quiet hours? (Assuming user wants it if subscribed)
    
    const i18n = createI18n(profile.language_pref || 'zh-TW');
    const today = new Date().toISOString().split('T')[0];
    
    try {
      await telegram.sendMessage(profile.user_telegram_id, 
        `📅 *${i18n.t('fortune.dailyPushTitle')}*\n\n` +
        `${i18n.t('fortune.dailyPushBody', { name: profile.name })}\n\n` +
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
      console.error(`Failed to push fortune to ${profile.user_telegram_id}:`, e);
      // Disable subscription if user blocked bot
      if (String(e).includes('Forbidden')) {
        await db.d1.prepare('UPDATE fortune_profiles SET is_subscribed = 0 WHERE id = ?').bind(profile.id).run();
      }
    }
  }
}

