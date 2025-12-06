import type { Env } from '~/types';
import type { D1Database } from '@cloudflare/workers-types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { createI18n, loadTranslations } from '~/i18n';
import {
  CompatibilityEngine,
  type MatchTopic,
  type MatchRecommendation,
} from '~/domain/compatibility/engine';
import { createNotificationService } from '~/services/notification';
import { findUserByTelegramId } from '~/db/queries/users';
import { UserActivityLevel } from '~/domain/user';
import { getUserActivityLevel } from '~/services/user_activity';
import { getUserPushPreferences } from '~/db/queries/user_preferences';
import { isQuietHours } from '~/domain/user_preferences';

/**
 * Handle Smart Match Push Cron Job
 * Frequency: Every Monday at 09:00 (UTC+8) -> 01:00 (UTC)
 *
 * @param targetUserId Optional. If provided, only pushes to this user (for testing).
 */
export async function handleMatchPush(
  env: Env,
  db: D1Database,
  targetUserId?: string
): Promise<void> {
  const notificationService = createNotificationService(env, db);
  const dbClient = createDatabaseClient(db); // Create wrapper for query functions
  const now = new Date();

  // 1. Determine this week's topic
  // Use week number to rotate topics: Zodiac -> MBTI -> Blood -> Zodiac...
  // Epoch week number
  const oneJan = new Date(now.getFullYear(), 0, 1);
  const numberOfDays = Math.floor((now.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((now.getDay() + 1 + numberOfDays) / 7);

  const topics: MatchTopic[] = ['zodiac', 'mbti', 'blood'];
  const topicIndex = weekNumber % topics.length;
  const currentTopic = topics[topicIndex];

  console.log(
    `[MatchPush] Starting weekly match push. Topic: ${currentTopic} (Week ${weekNumber})`
  );
  if (targetUserId) {
    console.log(`[MatchPush] ⚠️ TEST MODE: Targeting single user ${targetUserId}`);
  }

  // 2. Find eligible users
  // If targetUserId is set, verify eligibility but skip batch loop
  if (targetUserId) {
    const user = await findUserByTelegramId(dbClient, targetUserId); // Use dbClient here
    if (!user) {
      console.log(`[MatchPush] Target user ${targetUserId} not found.`);
      return;
    }
    // We can skip check activity/quiet hours if forcing test, OR we can respect them to test logic.
    // Let's respect them to test "Real World" scenario.

    // Check activity level
    const activityLevel = await getUserActivityLevel(user.telegram_id, db);
    if (activityLevel === UserActivityLevel.DORMANT) {
      console.log(`[MatchPush] Target user ${targetUserId} is DORMANT.`);
      // return; // Uncomment to strict test
    }

    // Check quiet hours
    const preferences = await getUserPushPreferences(user.telegram_id, db);
    if (isQuietHours(now, preferences)) {
      console.log(
        `[MatchPush] ⚠️ TEST MODE: User ${user.telegram_id} is in QUIET HOURS but proceeding anyway.`
      );
      console.log(`[MatchPush] Debug Prefs: ${JSON.stringify(preferences)}`);
    }

    const recommendation = CompatibilityEngine.getRecommendation(user, currentTopic);
    if (!recommendation.isValid) {
      console.log(
        `[MatchPush] Target user ${targetUserId} has no valid recommendation for ${currentTopic}.`
      );
      return;
    }

    await sendMatchNotification(env, user, recommendation, notificationService);
    console.log(`[MatchPush] Test notification sent to ${targetUserId}.`);
    return;
  }

  // Batch processing (Standard Cron Mode)
  const BATCH_SIZE = 100;
  let offset = 0;
  let processedCount = 0;

  while (true) {
    const users = await db
      .prepare(
        `
      SELECT u.* 
      FROM users u
      LEFT JOIN bans b ON u.telegram_id = b.user_id AND b.is_active = 1
      WHERE u.onboarding_completed_at IS NOT NULL
        AND u.deleted_at IS NULL
        AND b.id IS NULL
      LIMIT ? OFFSET ?
    `
      )
      .bind(BATCH_SIZE, offset)
      .all();

    if (!users.results || users.results.length === 0) {
      break;
    }

    for (const userRecord of users.results) {
      const user = userRecord as any; // Type casting

      try {
        // Check activity level - Skip DORMANT users (>30 days inactive)
        const activityLevel = await getUserActivityLevel(user.telegram_id, db);
        if (activityLevel === UserActivityLevel.DORMANT) {
          continue;
        }

        // Check quiet hours (although this cron runs at 9am, some users might set weird quiet hours)
        const preferences = await getUserPushPreferences(user.telegram_id, db);
        if (isQuietHours(now, preferences)) {
          console.log(`[MatchPush] Skipping user ${user.telegram_id} due to quiet hours`);
          continue;
        }

        // 3. Generate recommendation
        const recommendation = CompatibilityEngine.getRecommendation(user, currentTopic);

        if (!recommendation.isValid) {
          // User might be missing required attribute (e.g. blood type not set)
          // Skip this user
          continue;
        }

        // 4. Send notification
        await sendMatchNotification(env, user, recommendation, notificationService);
        processedCount++;
      } catch (error) {
        console.error(`[MatchPush] Error processing user ${user.telegram_id}:`, error);
      }
    }

    offset += BATCH_SIZE;

    // Safety break
    if (offset > 100000) break;
  }

  console.log(`[MatchPush] Completed. Sent ${processedCount} notifications.`);
}

async function sendMatchNotification(
  env: Env,
  user: any,
  recommendation: MatchRecommendation,
  notificationService: any
): Promise<void> {
  const userLang = user.language_pref || 'zh-TW';
  // Load translations from KV before creating I18n instance
  await loadTranslations(env, userLang);
  const i18n = createI18n(userLang);

  // Format message
  const headerKey = `match.header.${recommendation.topic}`;
  const header = i18n.t(headerKey as any);

  // Translate attributes
  // Note: userAttribute and recommendedAttributes are raw values (e.g., 'aries', 'INTJ')
  // We need to translate them for display if they are keys (zodiac), or keep as is (MBTI/Blood)

  let userAttrDisplay = recommendation.userAttribute;
  let recAttrDisplay = recommendation.recommendedAttributes.join(' / ');

  if (recommendation.topic === 'zodiac') {
    const { getZodiacDisplay } = await import('~/domain/zodiac');
    userAttrDisplay = getZodiacDisplay(recommendation.userAttribute, i18n);
    recAttrDisplay = recommendation.recommendedAttributes
      .map((z) => getZodiacDisplay(z, i18n))
      .join(' / ');
  }

  const reason = i18n.t(recommendation.reasonKey as any);

  const message = i18n.t('match.template.body', {
    userAttribute: userAttrDisplay,
    recommendedAttributes: recAttrDisplay,
    reason: reason,
  });

  const fullMessage = `${header}\n${message}`;

  // Prepare buttons
  // VIP Button: Direct throw to specific target (take the first recommendation)
  const primaryTarget = recommendation.recommendedAttributes[0];

  // We pass target info in callback data
  // Limit callback data length (64 chars max)
  // Format: match_vip_TOPIC_TARGET (e.g., match_vip_zodiac_leo)
  const vipCallbackData = `match_vip_${recommendation.topic}_${primaryTarget}`;
  const freeCallbackData = `match_throw`; // Just opens throw menu or does random throw

  const targetDisplay =
    recommendation.topic === 'zodiac'
      ? (await import('~/domain/zodiac')).getZodiacDisplay(primaryTarget, i18n)
      : primaryTarget;

  const buttons = [
    [
      {
        text: i18n.t('match.btn.throw'),
        callback_data: freeCallbackData,
      },
    ],
    [
      {
        text: i18n.t('match.btn.vip_throw', { target: targetDisplay }),
        callback_data: vipCallbackData,
      },
    ],
  ];

  await notificationService.sendImmediate(user.telegram_id, fullMessage, {
    inline_keyboard: buttons,
  });
}
