/**
 * Development Commands
 *
 * ⚠️ WARNING: These commands should be REMOVED in production!
 * Only for development/staging testing.
 *
 * SECURITY: These commands are ONLY available in staging environment.
 * They will NOT work in production.
 */

import type { Env, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
// import { createI18n } from '~/i18n'; // Unused for now

/**
 * Check if dev commands are allowed in current environment
 */
function isDevCommandAllowed(env: Env): boolean {
  const environment = env.ENVIRONMENT || 'development';
  return environment === 'development' || environment === 'staging';
}

/**
 * /dev_reset - Reset user data for testing
 *
 * ⚠️ DEVELOPMENT ONLY - Remove in production!
 * ⚠️ SECURITY: Only works in staging/development environment
 */
export async function handleDevReset(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;

  // SECURITY CHECK: Only allow in staging/development
  if (!isDevCommandAllowed(env)) {
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n('zh-TW'); // Dev messages default to zh-TW
    await telegram.sendMessage(chatId, i18n.t('dev.notAvailableInProduction'));
    return;
  }

  const db = createDatabaseClient(env.DB);
  const telegramId = message.from!.id.toString();
  const user = await findUserByTelegramId(db, telegramId);
  const { createI18n } = await import('~/i18n');
  const i18n = createI18n(user?.language_pref || 'zh-TW');

  try {
    // Delete user data - ignore errors for non-existent tables
    // 按照外鍵依賴順序刪除
    const tables = [
      // 1. 先刪除依賴其他表的數據
      {
        sql: 'DELETE FROM conversation_messages WHERE sender_telegram_id = ? OR receiver_telegram_id = ?',
        params: [telegramId, telegramId],
      },
      {
        sql: 'DELETE FROM conversation_identifiers WHERE user_telegram_id = ? OR partner_telegram_id = ?',
        params: [telegramId, telegramId],
      },
      {
        sql: 'DELETE FROM conversation_history_posts WHERE user_telegram_id = ?',
        params: [telegramId],
      },
      {
        sql: 'DELETE FROM conversation_new_message_posts WHERE user_telegram_id = ?',
        params: [telegramId],
      },
      {
        sql: 'DELETE FROM bottle_chat_history WHERE user_a_telegram_id = ? OR user_b_telegram_id = ?',
        params: [telegramId, telegramId],
      },

      // Level 1: 最深層的子表（依賴其他子表）
      { sql: 'DELETE FROM refund_requests WHERE user_id = ?', params: [telegramId] },

      // Level 2: 依賴 bottles 和 conversations 的表
      {
        sql: 'DELETE FROM matching_history WHERE matched_user_id = ?',
        params: [telegramId],
      },

      // Level 3: 父表 (conversations, bottles)
      {
        sql: 'DELETE FROM conversation_identifiers WHERE user_telegram_id = ? OR partner_telegram_id = ?',
        params: [telegramId, telegramId],
      },
      {
        sql: 'DELETE FROM conversations WHERE user_a_telegram_id = ? OR user_b_telegram_id = ?',
        params: [telegramId, telegramId],
      },
      {
        sql: 'DELETE FROM bottles WHERE owner_telegram_id = ? OR matched_with_telegram_id = ?',
        params: [telegramId, telegramId],
      },

      // Level 4: 其他用戶相關數據
      {
        sql: 'DELETE FROM invites WHERE inviter_telegram_id = ? OR invitee_telegram_id = ?',
        params: [telegramId, telegramId],
      },
      { sql: 'DELETE FROM daily_usage WHERE telegram_id = ?', params: [telegramId] },
      {
        sql: 'DELETE FROM reports WHERE reporter_telegram_id = ? OR reported_telegram_id = ?',
        params: [telegramId, telegramId],
      },
      { sql: 'DELETE FROM bans WHERE user_id = ?', params: [telegramId] },
      {
        sql: 'DELETE FROM user_blocks WHERE blocker_telegram_id = ? OR blocked_telegram_id = ?',
        params: [telegramId, telegramId],
      },
      { sql: 'DELETE FROM mbti_test_progress WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM payments WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM user_sessions WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM bottle_drafts WHERE telegram_id = ?', params: [telegramId] },

      // Fortune Telling
      { sql: 'DELETE FROM fortune_history WHERE user_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM fortune_quota WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM fortune_profiles WHERE telegram_id = ?', params: [telegramId] },

      // Ad rewards and analytics
      { sql: 'DELETE FROM ad_rewards WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM ad_provider_logs WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM analytics_events WHERE user_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM funnel_events WHERE user_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM daily_user_summary WHERE user_id = ?', params: [telegramId] },

      // Tasks
      { sql: 'DELETE FROM user_tasks WHERE user_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM task_reminders WHERE user_id = ?', params: [telegramId] },

      // VIP subscriptions (after refund_requests)
      { sql: 'DELETE FROM vip_subscriptions WHERE user_id = ?', params: [telegramId] },

      // Level 5: 最後刪除用戶本身
      { sql: 'DELETE FROM users WHERE telegram_id = ?', params: [telegramId] },
    ];

    console.error('[handleDevReset] Starting data deletion...');

    // Delete in multiple passes to handle foreign key constraints
    // Pass 1: Try to delete all tables (some may fail due to FK constraints)
    const failedTables: Array<{ sql: string; params: any[] }> = [];

    for (const { sql, params } of tables) {
      try {
        const result = await db.d1
          .prepare(sql)
          .bind(...params)
          .run();
        console.error(
          `[handleDevReset] Deleted from ${sql.split(' ')[2]}: ${result.meta?.changes || 0} rows`
        );
      } catch (err: any) {
        const errorMsg = err?.message || String(err);
        // If it's a foreign key constraint error, save for retry
        if (errorMsg.includes('FOREIGN KEY') || errorMsg.includes('constraint')) {
          console.error(
            `[handleDevReset] FK constraint, will retry: ${sql.split(' ')[2]}`,
            errorMsg
          );
          failedTables.push({ sql, params });
        } else {
          // Other errors (table not found, etc.) - just log and continue
          console.error(`[handleDevReset] Skipping table: ${sql.split(' ')[2]}`, errorMsg);
        }
      }
    }

    // Pass 2: Retry failed tables (parent tables should be deleted now)
    if (failedTables.length > 0) {
      console.error(`[handleDevReset] Retrying ${failedTables.length} tables...`);
      for (const { sql, params } of failedTables) {
        try {
          const result = await db.d1
            .prepare(sql)
            .bind(...params)
            .run();
          console.error(
            `[handleDevReset] Retry success: ${sql.split(' ')[2]}: ${result.meta?.changes || 0} rows`
          );
        } catch (err: any) {
          console.error(
            `[handleDevReset] Retry failed: ${sql.split(' ')[2]}`,
            err?.message || String(err)
          );
          // Continue anyway - some tables may not exist or have no data
        }
      }
    }

    console.error('[handleDevReset] Data deletion complete, verifying user deletion...');

    // Verify user is deleted
    const existingUser = await db.d1
      .prepare('SELECT telegram_id FROM users WHERE telegram_id = ?')
      .bind(telegramId)
      .first();

    if (existingUser) {
      console.error('[handleDevReset] User still exists after deletion, force deleting...');
      await db.d1.prepare('DELETE FROM users WHERE telegram_id = ?').bind(telegramId).run();
    }

    console.error('[handleDevReset] Reset complete');

    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    await telegram.sendMessage(chatId, i18n.t('dev.dataReset'));
  } catch (error) {
    console.error('[handleDevReset] Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    await telegram.sendMessage(chatId, i18n.t('dev.resetFailed', { error: errorMessage }));
  }
}

/**
 * /dev_info - Show development info
 *
 * ⚠️ DEVELOPMENT ONLY - Remove in production!
 * ⚠️ SECURITY: Only works in staging/development environment
 */
export async function handleDevInfo(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;

  // SECURITY CHECK: Only allow in staging/development
  const db = createDatabaseClient(env.DB);
  const telegramId = message.from!.id.toString();
  const tempUser = await findUserByTelegramId(db, telegramId);
  const { createI18n } = await import('~/i18n');
  const i18n = createI18n(tempUser?.language_pref || 'zh-TW');

  if (!isDevCommandAllowed(env)) {
    await telegram.sendMessage(chatId, i18n.t('dev.notAvailableInProduction'));
    return;
  }

  try {
    // Get user info
    const user = await db.d1
      .prepare('SELECT * FROM users WHERE telegram_id = ?')
      .bind(telegramId)
      .first();

    if (!user) {
      await telegram.sendMessage(chatId, i18n.t('dev.userNotFound'));
      return;
    }

    // Get counts
    const bottlesCount = await db.d1
      .prepare('SELECT COUNT(*) as count FROM bottles WHERE owner_telegram_id = ?')
      .bind(telegramId)
      .first<{ count: number }>();

    const conversationsCount = await db.d1
      .prepare(
        'SELECT COUNT(*) as count FROM conversations WHERE user_a_telegram_id = ? OR user_b_telegram_id = ?'
      )
      .bind(telegramId, telegramId)
      .first<{ count: number }>();

    const messagesCount = await db.d1
      .prepare('SELECT COUNT(*) as count FROM conversation_messages WHERE sender_telegram_id = ?')
      .bind(telegramId)
      .first<{ count: number }>();

    // Get invite info
    const inviteStats = await db.d1
      .prepare(
        `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'activated' THEN 1 ELSE 0 END) as activated,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
       FROM invites
       WHERE inviter_telegram_id = ?`
      )
      .bind(telegramId)
      .first<{ total: number; activated: number; pending: number }>();

    const info =
      i18n.t('dev.userInfo') +
      i18n.t('dev.telegramId', { id: user.telegram_id }) +
      i18n.t('dev.nickname', { nickname: user.nickname || i18n.t('dev.notSet') }) +
      i18n.t('dev.onboardingStep', { step: user.onboarding_step }) +
      i18n.t('dev.vip', { status: user.is_vip ? i18n.t('dev.yes') : i18n.t('dev.no') }) +
      i18n.t('dev.language', { lang: user.language_pref }) +
      i18n.t('dev.inviteCode', { code: user.invite_code || i18n.t('dev.notGenerated') }) +
      i18n.t('dev.invitedBy', { invitedBy: user.invited_by || i18n.t('dev.none') }) +
      i18n.t('dev.stats') +
      i18n.t('dev.bottles', { count: bottlesCount?.count || 0 }) +
      i18n.t('dev.conversations', { count: conversationsCount?.count || 0 }) +
      i18n.t('dev.messages', { count: messagesCount?.count || 0 }) +
      i18n.t('dev.inviteStats') +
      i18n.t('dev.successfulInvites', { count: user.successful_invites || 0 }) +
      i18n.t('dev.inviteTotal', { count: inviteStats?.total || 0 }) +
      i18n.t('dev.inviteActivated', { count: inviteStats?.activated || 0 }) +
      i18n.t('dev.invitePending', { count: inviteStats?.pending || 0 }) +
      i18n.t('dev.stagingOnly');

    await telegram.sendMessage(chatId, info);
  } catch (error) {
    console.error('[handleDevInfo] Error:', error);
    await telegram.sendMessage(chatId, i18n.t('dev.getUserInfoFailed'));
  }
}

/**
 * /dev_restart - Reset user data and start onboarding
 *
 * ⚠️ DEVELOPMENT ONLY - Remove in production!
 * ⚠️ SECURITY: Only works in staging/development environment
 */
export async function handleDevRestart(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;

  // SECURITY CHECK: Only allow in staging/development
  if (!isDevCommandAllowed(env)) {
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n('zh-TW'); // Dev messages default to zh-TW
    await telegram.sendMessage(chatId, i18n.t('dev.notAvailableInProduction'));
    return;
  }

  const db = createDatabaseClient(env.DB);
  const telegramId = message.from!.id.toString();

  try {
    // Delete user data - use same logic as /dev_reset
    // 按照外鍵依賴順序刪除（從最深的子表到父表）
    const tables = [
      // Level 1: 最深層的子表（依賴其他子表）
      { sql: 'DELETE FROM refund_requests WHERE user_id = ?', params: [telegramId] },

      // Level 2: 依賴 bottles 和 conversations 的表
      {
        sql: 'DELETE FROM matching_history WHERE matched_user_id = ?',
        params: [telegramId],
      },
      {
        sql: 'DELETE FROM conversation_messages WHERE sender_telegram_id = ? OR receiver_telegram_id = ?',
        params: [telegramId, telegramId],
      },
      {
        sql: 'DELETE FROM conversation_history_posts WHERE user_telegram_id = ?',
        params: [telegramId],
      },
      {
        sql: 'DELETE FROM conversation_new_message_posts WHERE user_telegram_id = ?',
        params: [telegramId],
      },

      // Level 3: 父表 (conversations, bottles)
      {
        sql: 'DELETE FROM conversation_identifiers WHERE user_telegram_id = ? OR partner_telegram_id = ?',
        params: [telegramId, telegramId],
      },
      {
        sql: 'DELETE FROM conversations WHERE user_a_telegram_id = ? OR user_b_telegram_id = ?',
        params: [telegramId, telegramId],
      },
      {
        sql: 'DELETE FROM bottles WHERE owner_telegram_id = ? OR matched_with_telegram_id = ?',
        params: [telegramId, telegramId],
      },

      // Level 4: 其他用戶相關數據
      {
        sql: 'DELETE FROM invites WHERE inviter_telegram_id = ? OR invitee_telegram_id = ?',
        params: [telegramId, telegramId],
      },
      { sql: 'DELETE FROM daily_usage WHERE telegram_id = ?', params: [telegramId] },
      {
        sql: 'DELETE FROM reports WHERE reporter_telegram_id = ? OR reported_telegram_id = ?',
        params: [telegramId, telegramId],
      },
      { sql: 'DELETE FROM bans WHERE user_id = ?', params: [telegramId] },
      {
        sql: 'DELETE FROM user_blocks WHERE blocker_telegram_id = ? OR blocked_telegram_id = ?',
        params: [telegramId, telegramId],
      },
      { sql: 'DELETE FROM mbti_test_progress WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM payments WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM user_sessions WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM bottle_drafts WHERE telegram_id = ?', params: [telegramId] },

      // Fortune Telling
      { sql: 'DELETE FROM fortune_history WHERE user_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM fortune_quota WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM fortune_profiles WHERE telegram_id = ?', params: [telegramId] },

      // Ad rewards and analytics
      { sql: 'DELETE FROM ad_rewards WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM ad_provider_logs WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM analytics_events WHERE user_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM funnel_events WHERE user_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM daily_user_summary WHERE user_id = ?', params: [telegramId] },

      // Tasks
      { sql: 'DELETE FROM user_tasks WHERE user_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM task_reminders WHERE user_id = ?', params: [telegramId] },

      // VIP subscriptions (after refund_requests)
      { sql: 'DELETE FROM vip_subscriptions WHERE user_id = ?', params: [telegramId] },

      // Level 5: 最後刪除用戶本身
      { sql: 'DELETE FROM users WHERE telegram_id = ?', params: [telegramId] },
    ];

    console.error('[handleDevRestart] Starting data deletion...');

    // Delete in multiple passes to handle foreign key constraints
    // Pass 1: Try to delete all tables (some may fail due to FK constraints)
    const failedTables: Array<{ sql: string; params: any[] }> = [];

    for (const { sql, params } of tables) {
      try {
        const result = await db.d1
          .prepare(sql)
          .bind(...params)
          .run();
        console.error(
          `[handleDevRestart] Deleted from ${sql.split(' ')[2]}: ${result.meta?.changes || 0} rows`
        );
      } catch (err: any) {
        const errorMsg = err?.message || String(err);
        // If it's a foreign key constraint error, save for retry
        if (errorMsg.includes('FOREIGN KEY') || errorMsg.includes('constraint')) {
          console.error(
            `[handleDevRestart] FK constraint, will retry: ${sql.split(' ')[2]}`,
            errorMsg
          );
          failedTables.push({ sql, params });
        } else {
          // Other errors (table not found, etc.) - just log and continue
          console.error(`[handleDevRestart] Skipping table: ${sql.split(' ')[2]}`, errorMsg);
        }
      }
    }

    // Pass 2: Retry failed tables (parent tables should be deleted now)
    if (failedTables.length > 0) {
      console.error(`[handleDevRestart] Retrying ${failedTables.length} tables...`);
      for (const { sql, params } of failedTables) {
        try {
          const result = await db.d1
            .prepare(sql)
            .bind(...params)
            .run();
          console.error(
            `[handleDevRestart] Retry success: ${sql.split(' ')[2]}: ${result.meta?.changes || 0} rows`
          );
        } catch (err: any) {
          console.error(
            `[handleDevRestart] Retry failed: ${sql.split(' ')[2]}`,
            err?.message || String(err)
          );
          // Continue anyway - some tables may not exist or have no data
        }
      }
    }

    console.error('[handleDevRestart] Data deletion complete, verifying user deletion...');

    // Verify user is deleted
    const existingUser = await db.d1
      .prepare('SELECT telegram_id FROM users WHERE telegram_id = ?')
      .bind(telegramId)
      .first();

    if (existingUser) {
      console.error('[handleDevRestart] User still exists after deletion, force deleting...');
      await db.d1.prepare('DELETE FROM users WHERE telegram_id = ?').bind(telegramId).run();

      // Wait a bit to ensure deletion is committed
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.error('[handleDevRestart] Creating new user...');

    // Create user record with language_selection step
    const { generateInviteCode } = await import('~/domain/user');
    const { createUser } = await import('~/db/queries/users');

    const newInviteCode = generateInviteCode();
    console.error('[handleDevRestart] Generated invite code:', newInviteCode);

    await createUser(db, {
      telegram_id: telegramId,
      username: message.from!.username,
      first_name: message.from!.first_name,
      last_name: message.from!.last_name,
      language_pref: message.from!.language_code || 'zh-TW',
      invite_code: newInviteCode,
      onboarding_step: 'language_selection',
    });

    console.error('[handleDevRestart] User created, showing language selection...');

    // Show language selection (start onboarding)
    const { showLanguageSelection } = await import('./language_selection');
    await showLanguageSelection(message, env);

    console.error('[handleDevRestart] Language selection shown successfully');
  } catch (error) {
    console.error('[handleDevRestart] Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n('zh-TW'); // Dev messages default to zh-TW
    await telegram.sendMessage(chatId, i18n.t('dev.resetFailed', { error: errorMessage }));
  }
}

/**
 * /dev_skip - Skip to completed onboarding (for testing)
 *
 * ⚠️ DEVELOPMENT ONLY - Remove in production!
 * ⚠️ SECURITY: Only works in staging/development environment
 */
export async function handleDevSkip(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;

  // SECURITY CHECK: Only allow in staging/development
  if (!isDevCommandAllowed(env)) {
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n('zh-TW'); // Dev messages default to zh-TW
    await telegram.sendMessage(chatId, i18n.t('dev.notAvailableInProduction'));
    return;
  }

  const db = createDatabaseClient(env.DB);
  const telegramId = message.from!.id.toString();

  const { createI18n } = await import('~/i18n');
  const i18n = createI18n('zh-TW'); // Dev messages default to zh-TW

  try {
    // Generate invite code
    const { generateInviteCode } = await import('~/domain/user');
    const inviteCode = generateInviteCode();

    const testUserNickname = i18n.t('dev.testUser');

    // Create or update user with completed onboarding
    await db.d1
      .prepare(
        `
      INSERT INTO users (
        telegram_id,
        username,
        first_name,
        nickname,
        gender,
        birthday,
        age,
        zodiac_sign,
        language_pref,
        invite_code,
        onboarding_step,
        anti_fraud_score,
        terms_agreed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(telegram_id) DO UPDATE SET
        onboarding_step = 'completed',
        nickname = ?,
        gender = 'male',
        birthday = '2000-01-01',
        age = 25,
        zodiac_sign = 'Capricorn',
        anti_fraud_score = 100,
        terms_agreed = 1
    `
      )
      .bind(
        telegramId,
        message.from!.username || '',
        message.from!.first_name || '',
        testUserNickname,
        'male',
        '2000-01-01',
        25,
        'Capricorn',
        'zh-TW',
        inviteCode,
        'completed',
        100,
        1,
        testUserNickname
      )
      .run();

    await telegram.sendMessage(
      chatId,
      i18n.t('dev.skipRegistration') +
        i18n.t('dev.autoCompleted') +
        i18n.t('dev.testCoreFeatures') +
        i18n.t('dev.throwCommand') +
        i18n.t('dev.catchCommand') +
        i18n.t('dev.statsCommand') +
        i18n.t('dev.stagingOnly')
    );
  } catch (error) {
    console.error('[handleDevSkip] Error:', error);
    await telegram.sendMessage(chatId, i18n.t('dev.skipFailed'));
  }
}
