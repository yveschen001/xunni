import type { Env } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { PushStrategyService, PushType } from '~/services/push_strategy';
import { maskNickname } from '~/domain/invite';
import { createI18n } from '~/i18n';
import { getOrCreateIdentifier } from '~/db/queries/conversation_identifiers';
import { formatIdentifier } from '~/domain/conversation_identifier';

/**
 * Handle Push Reminders Cron Job
 * Triggered every hour by Cloudflare Workers
 */
export async function handlePushReminders(env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const pushService = new PushStrategyService(db.d1, env);

  console.log('[Cron] Starting Push Reminders check...');

  // 1. Throw Reminders (Users who haven't thrown in 24h)
  await processThrowReminders(db, pushService);

  // 2. Catch Reminders (Users who haven't caught in 12h)
  await processCatchReminders(db, pushService);

  // 3. Onboarding Reminders (Users stuck in onboarding)
  await processOnboardingReminders(db, pushService);

  // 4. Message Reminders (Unreplied conversations)
  await processMessageReminders(db, pushService, env);

  console.log('[Cron] Push Reminders check completed.');
}

async function processThrowReminders(db: any, pushService: PushStrategyService) {
  // Find users active in last 3 days but haven't thrown today
  // And have quota remaining (simplified: assumes quota > 0 if not thrown)
  const users = await db.d1
    .prepare(
      `
    SELECT u.telegram_id, u.language_pref, u.last_active_at
    FROM users u
    LEFT JOIN daily_usage d ON u.telegram_id = d.telegram_id AND d.date = date('now')
    WHERE u.onboarding_step = 'completed'
      AND u.bot_status = 'active'
      AND u.deleted_at IS NULL
      AND u.last_active_at >= datetime('now', '-3 days')
      AND (d.throws_count IS NULL OR d.throws_count = 0)
    LIMIT 50 -- Batch limit for safety
  `
    )
    .all();

  if (!users.results) return;

  for (const user of users.results) {
    const shouldSend = await pushService.shouldSendPush(
      user.telegram_id,
      PushType.THROW_REMINDER,
      user.last_active_at,
      user.language_pref
    );

    if (shouldSend) {
      await pushService.sendPush(
        user.telegram_id,
        PushType.THROW_REMINDER,
        'push.throwReminder', // i18n key needed
        { remaining: 3 }, // Simplified placeholder
        user.language_pref
      );
    }
  }
}

async function processCatchReminders(db: any, pushService: PushStrategyService) {
  // Similar logic for catch
  // Find users active in last 3 days but haven't caught today
  const users = await db.d1
    .prepare(
      `
      SELECT u.telegram_id, u.language_pref, u.last_active_at
      FROM users u
      LEFT JOIN daily_usage d ON u.telegram_id = d.telegram_id AND d.date = date('now')
      WHERE u.onboarding_step = 'completed'
        AND u.bot_status = 'active'
        AND u.deleted_at IS NULL
        AND u.last_active_at >= datetime('now', '-3 days')
        AND (d.catches_count IS NULL OR d.catches_count = 0)
      LIMIT 50
    `
    )
    .all();

  if (!users.results) return;

  for (const user of users.results) {
    const shouldSend = await pushService.shouldSendPush(
      user.telegram_id,
      PushType.CATCH_REMINDER,
      user.last_active_at,
      user.language_pref
    );

    if (shouldSend) {
      await pushService.sendPush(
        user.telegram_id,
        PushType.CATCH_REMINDER,
        'push.catchReminder', // i18n key needed
        { count: 1 }, // Placeholder
        user.language_pref
      );
    }
  }
}

async function processOnboardingReminders(db: any, pushService: PushStrategyService) {
  // Find users stuck in onboarding for > 24h but < 7 days
  const users = await db.d1
    .prepare(
      `
        SELECT telegram_id, language_pref, last_active_at, onboarding_step
        FROM users
        WHERE onboarding_step != 'completed'
          AND bot_status = 'active'
          AND created_at < datetime('now', '-24 hours')
          AND created_at > datetime('now', '-7 days')
        LIMIT 20
    `
    )
    .all();

  if (!users.results) return;

  for (const user of users.results) {
    const shouldSend = await pushService.shouldSendPush(
      user.telegram_id,
      PushType.ONBOARDING_REMINDER,
      user.last_active_at, // might be null or old
      user.language_pref
    );

    if (shouldSend) {
      await pushService.sendPush(
        user.telegram_id,
        PushType.ONBOARDING_REMINDER,
        'push.onboardingReminder',
        { step: user.onboarding_step },
        user.language_pref
      );
    }
  }
}

/**
 * Process Unreplied Message Reminders
 *
 * Logic:
 * 1. Find ACTIVE conversations where:
 *    - Last message was > 24 hours ago
 *    - Last message was NOT sent by the current user (last_sender_id != current_user)
 *    - Conversation is still active (status = 'active')
 *    - User hasn't been active in last 24h (don't bug active users too much?) - No, per spec, 24h trigger.
 * 2. Check PushStrategy (frequency, quiet hours)
 * 3. Send notification with Masked Nickname + Deep Link
 */
async function processMessageReminders(db: any, pushService: PushStrategyService, env: Env) {
  // We need to find conversations where it's "your turn" to reply
  // i.e., you are NOT the last_sender_id
  // And it's been > 24 hours since last_message_at

  // We query conversations directly. Since we need to join with user table to get language/active status,
  // we iterate conversations.
  // Optimization: Use index on (status, last_message_at)

  const conversations = await db.d1
    .prepare(
      `
        SELECT 
            c.id as conversation_id,
            c.user_a_telegram_id,
            c.user_b_telegram_id,
            c.last_message_at,
            c.last_sender_id,
            ua.nickname as ua_nickname,
            ub.nickname as ub_nickname,
            ua.language_pref as ua_lang,
            ub.language_pref as ub_lang,
            ua.last_active_at as ua_active,
            ub.last_active_at as ub_active
        FROM conversations c
        JOIN users ua ON c.user_a_telegram_id = ua.telegram_id
        JOIN users ub ON c.user_b_telegram_id = ub.telegram_id
        WHERE c.status = 'active'
          AND c.last_message_at < datetime('now', '-24 hours')
          AND c.last_message_at > datetime('now', '-30 days') -- Don't remind for very old abandoned chats
          AND c.last_sender_id IS NOT NULL -- Must have at least one message
        LIMIT 50
    `
    )
    .all();

  if (!conversations.results) return;

  for (const conv of conversations.results) {
    // Determine who needs to reply
    let targetUserId: string;
    let partnerUserId: string;
    let partnerNickname: string;
    let targetLang: string;
    let targetLastActive: string;

    if (conv.last_sender_id === conv.user_a_telegram_id) {
      // A sent last, B needs to reply
      targetUserId = conv.user_b_telegram_id;
      partnerUserId = conv.user_a_telegram_id;
      partnerNickname = conv.ua_nickname;
      targetLang = conv.ub_lang;
      targetLastActive = conv.ub_active;
    } else {
      // B sent last, A needs to reply
      targetUserId = conv.user_a_telegram_id;
      partnerUserId = conv.user_b_telegram_id;
      partnerNickname = conv.ub_nickname;
      targetLang = conv.ua_lang;
      targetLastActive = conv.ua_active;
    }

    // Check if we should send push
    const shouldSend = await pushService.shouldSendPush(
      targetUserId,
      PushType.MESSAGE_REMINDER,
      targetLastActive,
      targetLang
    );

    if (shouldSend) {
      // Prepare content
      const i18n = createI18n(targetLang || 'zh-TW');

      // Mask partner nickname (Privacy)
      // Note: maskNickname function might need update to support country flag if not passed
      // We'll import a helper or just use maskNickname as is.
      const maskedName = maskNickname(partnerNickname || i18n.t('common.anonymousUser'));

      // Get conversation identifier for deep linking
      const identifier = await getOrCreateIdentifier(
        db,
        targetUserId,
        partnerUserId,
        conv.conversation_id
      );
      const formattedId = formatIdentifier(identifier);

      // Get last message content for preview (Context)
      const lastMsg = await db.d1
        .prepare(
          `
                SELECT original_text FROM conversation_messages 
                WHERE conversation_id = ? 
                ORDER BY created_at DESC LIMIT 1
            `
        )
        .bind(conv.conversation_id)
        .first<{ original_text: string }>();

      const preview = lastMsg?.original_text
        ? lastMsg.original_text.substring(0, 15) + (lastMsg.original_text.length > 15 ? '...' : '')
        : '...';

      // Randomize message variation (A, B, C)
      const variations = ['A', 'B', 'C'];
      const variation = variations[Math.floor(Math.random() * variations.length)];
      const messageKey = `push.messageReminder${variation}`;

      // Send Push with Action Buttons
      await pushService.sendPush(
        targetUserId,
        PushType.MESSAGE_REMINDER,
        messageKey,
        {
          masked_partner_name: maskedName,
          last_message_preview: preview,
        },
        targetLang,
        {
          // Action Buttons (Interactive)
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: i18n.t('push.actionReply', { masked_partner_name: maskedName }),
                  callback_data: `conv_reply_${formattedId}`,
                },
              ],
              [
                {
                  text: i18n.t('push.actionHistory'),
                  callback_data: `conv_history_${formattedId}`, // Needs router support
                },
              ],
            ],
          },
        }
      );
    }
  }
}
