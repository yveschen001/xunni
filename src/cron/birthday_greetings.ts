/**
 * Birthday Greetings Cron Job
 * Automatically sends personalized birthday greetings to users on their birthday
 *
 * Schedule: Runs daily at 01:00 UTC (09:00 Taiwan Time)
 *
 * Features:
 * - Personalized messages with user's nickname and zodiac
 * - Gender-aware suggestions (他/她)
 * - Prevents duplicate sends (tracks sent greetings)
 * - Respects Telegram rate limits (25 messages/batch, 1s delay)
 * - Skips blocked/deleted users (bot_status filtering)
 *
 * 參考文檔：doc/BROADCAST_SYSTEM_DESIGN.md 第 12 節
 */

import type { Env } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { getFilteredUserIds } from '~/services/broadcast';
import { calculateBatchSize } from '~/domain/broadcast';

/**
 * System admin ID for birthday greetings
 * (Currently unused, reserved for future broadcast integration)
 */
const _SYSTEM_ADMIN_ID = 'system_birthday_bot';

/**
 * Maximum birthday greetings per day
 * 限制每天最多發送數量，避免隊列過長
 */
const MAX_BIRTHDAY_GREETINGS_PER_DAY = 10000;

/**
 * Zodiac signs in Chinese
 */
const ZODIAC_MAP: Record<string, string> = {
  Aries: '白羊座',
  Taurus: '金牛座',
  Gemini: '雙子座',
  Cancer: '巨蟹座',
  Leo: '獅子座',
  Virgo: '處女座',
  Libra: '天秤座',
  Scorpio: '天蠍座',
  Sagittarius: '射手座',
  Capricorn: '摩羯座',
  Aquarius: '水瓶座',
  Pisces: '雙魚座',
};

/**
 * Generate personalized birthday message
 *
 * @param nickname - User's nickname
 * @param zodiac - User's zodiac sign
 * @param gender - User's gender (for pronoun selection)
 * @returns Personalized birthday message
 */
function generateBirthdayMessage(nickname: string, zodiac: string | null, gender: string): string {
  // Determine pronoun based on gender
  const pronoun = gender === 'female' ? '她' : '他';

  // Get Chinese zodiac name
  const zodiacChinese = zodiac && ZODIAC_MAP[zodiac] ? ZODIAC_MAP[zodiac] : '';
  const zodiacText = zodiacChinese ? `${zodiacChinese}的` : '';

  return `🎂 **生日快樂，${nickname}！**

今天是你的特別日子！
${zodiacText}你，在這個美好的日子裡，
願你的每一天都充滿陽光和歡笑！

🎁 **生日驚喜**
作為生日禮物，我們為你準備了特別的祝福！

💌 **給自己的禮物**
不如丟個漂流瓶給遠方的${pronoun}，
祝自己生日快樂，也許會收到意外的驚喜哦！

願你在 XunNi 找到更多有趣的靈魂，
遇見更多美好的緣分！

再次祝你生日快樂！🎉`;
}

/**
 * Prioritize users for birthday greetings
 * 優先級：VIP > 活躍用戶 > 老用戶
 *
 * @param db - Database client
 * @param userIds - User IDs to prioritize
 * @returns Prioritized user IDs
 */
async function prioritizeUsers(
  db: ReturnType<typeof createDatabaseClient>,
  userIds: string[]
): Promise<string[]> {
  if (userIds.length <= MAX_BIRTHDAY_GREETINGS_PER_DAY) {
    return userIds; // 不需要過濾
  }

  console.log(
    `[BirthdayGreetings] Too many users (${userIds.length}), prioritizing to ${MAX_BIRTHDAY_GREETINGS_PER_DAY}...`
  );

  const users = await db.d1
    .prepare(
      `SELECT telegram_id
       FROM users
       WHERE telegram_id IN (${userIds.map(() => '?').join(', ')})
       ORDER BY 
         is_vip DESC,                    -- VIP 優先
         last_active_at DESC,            -- 活躍用戶優先
         created_at ASC                  -- 老用戶優先
       LIMIT ?`
    )
    .bind(...userIds, MAX_BIRTHDAY_GREETINGS_PER_DAY)
    .all<{ telegram_id: string }>();

  return users.results?.map((u) => u.telegram_id) || [];
}

/**
 * Check if birthday greeting was already sent today
 *
 * @param db - Database client
 * @param telegramId - User's telegram ID
 * @returns True if already sent today
 */
async function wasGreetingSentToday(
  db: ReturnType<typeof createDatabaseClient>,
  telegramId: string
): Promise<boolean> {
  const result = await db.d1
    .prepare(
      `SELECT id FROM birthday_greetings_log
       WHERE telegram_id = ?
         AND sent_at >= date('now')
       LIMIT 1`
    )
    .bind(telegramId)
    .first<{ id: number }>();

  return result !== null;
}

/**
 * Record that birthday greeting was sent
 *
 * @param db - Database client
 * @param telegramId - User's telegram ID
 */
async function recordGreetingSent(
  db: ReturnType<typeof createDatabaseClient>,
  telegramId: string
): Promise<void> {
  await db.d1
    .prepare(
      `INSERT INTO birthday_greetings_log (telegram_id, sent_at)
       VALUES (?, CURRENT_TIMESTAMP)`
    )
    .bind(telegramId)
    .run();
}

/**
 * Handle birthday greetings cron job
 *
 * This function:
 * 1. Finds users with birthdays today (using filter system)
 * 2. Fetches user details (nickname, zodiac, gender)
 * 3. Generates personalized messages
 * 4. Sends messages in batches (respecting Telegram rate limits)
 * 5. Tracks sent greetings to prevent duplicates
 * 6. Handles errors gracefully
 *
 * @param env - Cloudflare environment
 */
export async function handleBirthdayGreetings(env: Env): Promise<void> {
  console.log('[BirthdayGreetings] Starting birthday greetings cron job...');

  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);

  try {
    // Get users with birthdays today
    // This automatically filters for:
    // - bot_status = 'active' (no blocked/deleted users)
    // - deleted_at IS NULL
    // - onboarding_step = 'completed'
    // - last_active_at >= datetime('now', '-30 days')
    const users = await getFilteredUserIds(db, { is_birthday: true });

    if (users.length === 0) {
      console.log('[BirthdayGreetings] No users with birthdays today.');
      return;
    }

    console.log(`[BirthdayGreetings] Found ${users.length} users with birthdays today.`);

    let userIds = users.map((u) => u.telegram_id);

    // Prioritize users if too many
    if (userIds.length > MAX_BIRTHDAY_GREETINGS_PER_DAY) {
      userIds = await prioritizeUsers(db, userIds);
      console.log(
        `[BirthdayGreetings] Prioritized to ${userIds.length} users (VIP > Active > Old)`
      );
    }

    // Fetch user details
    const userDetails = await db.d1
      .prepare(
        `SELECT telegram_id, nickname, zodiac, gender
         FROM users
         WHERE telegram_id IN (${userIds.map(() => '?').join(', ')})`
      )
      .bind(...userIds)
      .all<{
        telegram_id: string;
        nickname: string;
        zodiac: string | null;
        gender: string;
      }>();

    if (!userDetails.results || userDetails.results.length === 0) {
      console.log('[BirthdayGreetings] No user details found.');
      return;
    }

    // Filter out users who already received greeting today
    const usersToSend = [];
    for (const user of userDetails.results) {
      const alreadySent = await wasGreetingSentToday(db, user.telegram_id);
      if (!alreadySent) {
        usersToSend.push(user);
      } else {
        console.log(`[BirthdayGreetings] Skipping ${user.telegram_id} - already sent today`);
      }
    }

    if (usersToSend.length === 0) {
      console.log('[BirthdayGreetings] All greetings already sent today.');
      return;
    }

    console.log(`[BirthdayGreetings] Sending greetings to ${usersToSend.length} users...`);

    // Calculate batch size (使用低優先級，不影響瓶子推送)
    const { batchSize, delayMs } = calculateBatchSize(usersToSend.length, 'low');

    let sentCount = 0;
    let failedCount = 0;

    // Send in batches
    for (let i = 0; i < usersToSend.length; i += batchSize) {
      const batch = usersToSend.slice(i, i + batchSize);

      // Send to each user in batch (parallel)
      await Promise.all(
        batch.map(async (user) => {
          try {
            // Generate personalized message
            const message = generateBirthdayMessage(user.nickname, user.zodiac, user.gender);

            // Send message
            await telegram.sendMessage(parseInt(user.telegram_id), message);

            // Record that greeting was sent
            await recordGreetingSent(db, user.telegram_id);

            sentCount++;
            console.log(`[BirthdayGreetings] Sent to ${user.telegram_id} (${user.nickname})`);
          } catch (error) {
            console.error(`[BirthdayGreetings] Failed to send to ${user.telegram_id}:`, error);

            // Handle Telegram errors (blocked/deleted users)
            try {
              const { handleBroadcastError } = await import('../services/telegram_error_handler');
              await handleBroadcastError(db, user.telegram_id, error);
            } catch (handlerError) {
              console.error('[BirthdayGreetings] Error handler failed:', handlerError);
            }

            failedCount++;
          }
        })
      );

      // Delay between batches (except last batch)
      if (i + batchSize < usersToSend.length) {
        await sleep(delayMs);
      }
    }

    console.log(`[BirthdayGreetings] Completed: ${sentCount} sent, ${failedCount} failed`);
  } catch (error) {
    console.error('[BirthdayGreetings] Error sending birthday greetings:', error);
    // Don't throw error - we don't want to fail the entire cron job
  }

  console.log('[BirthdayGreetings] Birthday greetings cron job completed.');
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
