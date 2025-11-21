/**
 * Birthday Greetings Cron Job
 * Automatically sends birthday greetings to users on their birthday
 * 
 * Schedule: Runs daily at 09:00 UTC (17:00 Taiwan Time)
 * 
 * 參考文檔：doc/BROADCAST_SYSTEM_DESIGN.md 第 12 節
 */

import type { Env } from '~/types';
import { createFilteredBroadcast } from '~/services/broadcast';

/**
 * Birthday greeting message template
 * 
 * Note: This is a simple template. In production, you might want to:
 * - Use i18n for multi-language support
 * - Personalize with user's nickname
 * - Add special birthday offers or rewards
 */
const BIRTHDAY_MESSAGE = `🎂 **生日快樂！**

今天是你的特別日子！
祝你生日快樂，願你的每一天都充滿陽光和歡笑！

🎁 **生日驚喜**
作為生日禮物，我們為你準備了特別的祝福！

願你在 XunNi 找到更多有趣的靈魂，
遇見更多美好的緣分！

再次祝你生日快樂！🎉`;

/**
 * System admin ID for birthday greetings
 * This is used as the "created_by" field in broadcasts
 */
const SYSTEM_ADMIN_ID = 'system_birthday_bot';

/**
 * Handle birthday greetings cron job
 * 
 * This function:
 * 1. Uses the broadcast filter system to find users with birthdays today
 * 2. Sends birthday greetings using createFilteredBroadcast
 * 3. Logs the results
 * 
 * @param env - Cloudflare environment
 */
export async function handleBirthdayGreetings(env: Env): Promise<void> {
  console.log('[BirthdayGreetings] Starting birthday greetings cron job...');

  try {
    // Create filtered broadcast for birthday users
    // The filter system will automatically match users whose birthday is today
    const { broadcastId, totalUsers } = await createFilteredBroadcast(
      env,
      BIRTHDAY_MESSAGE,
      { is_birthday: true }, // Filter: users with birthday today
      SYSTEM_ADMIN_ID
    );

    console.log(
      `[BirthdayGreetings] Birthday greetings broadcast created: ` +
        `ID=${broadcastId}, Users=${totalUsers}`
    );

    // If no users have birthdays today, log it
    if (totalUsers === 0) {
      console.log('[BirthdayGreetings] No users with birthdays today.');
    } else {
      console.log(`[BirthdayGreetings] Sent birthday greetings to ${totalUsers} users.`);
    }
  } catch (error) {
    console.error('[BirthdayGreetings] Error sending birthday greetings:', error);
    
    // Don't throw error - we don't want to fail the entire cron job
    // Just log it and continue
  }

  console.log('[BirthdayGreetings] Birthday greetings cron job completed.');
}

/**
 * Optional: Send birthday greetings with custom message
 * 
 * This can be used for special occasions or testing
 * 
 * @param env - Cloudflare environment
 * @param customMessage - Custom birthday message
 */
export async function sendCustomBirthdayGreetings(
  env: Env,
  customMessage: string
): Promise<{ broadcastId: number; totalUsers: number }> {
  console.log('[BirthdayGreetings] Sending custom birthday greetings...');

  const result = await createFilteredBroadcast(
    env,
    customMessage,
    { is_birthday: true },
    SYSTEM_ADMIN_ID
  );

  console.log(
    `[BirthdayGreetings] Custom birthday greetings sent: ` +
      `ID=${result.broadcastId}, Users=${result.totalUsers}`
  );

  return result;
}

