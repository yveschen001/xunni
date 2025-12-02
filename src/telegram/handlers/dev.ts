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
import { getAdminIds, isSuperAdmin } from './admin_ban';

/**
 * Check if dev commands are allowed in current environment AND user is allowed
 * SECURITY: Must be staging/dev AND user must be Admin/SuperAdmin
 */
function isDevCommandAllowed(env: Env, telegramId: string): boolean {
  // 1. Environment Check
  const environment = env.ENVIRONMENT || 'development';
  if (environment === 'production') return false;

  // 2. Admin Role Check
  // Allow Super Admins and regular Admins to use dev tools in staging
  const adminIds = getAdminIds(env);
  const isUserSuperAdmin = isSuperAdmin(telegramId, env);
  
  return isUserSuperAdmin || adminIds.includes(telegramId);
}

/**
 * /dev_reset - Reset user data for testing
 * Usage: /dev_reset [target_id]
 *
 * ⚠️ DEVELOPMENT ONLY - Remove in production!
 * ⚠️ SECURITY: Only works in staging/development environment & Admin only
 */
export async function handleDevReset(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const senderId = message.from!.id.toString();

  // SECURITY CHECK
  if (!isDevCommandAllowed(env, senderId)) {
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n('en');
    await telegram.sendMessage(chatId, i18n.t('dev.notAvailableInProduction'));
    return;
  }

  const db = createDatabaseClient(env.DB);
  // Determine target ID: argument or sender
  const args = message.text?.split(' ').slice(1) || [];
  const targetId = args[0] || senderId;

  // Get sender's language for response
  const senderUser = await findUserByTelegramId(db, senderId);
  const { createI18n } = await import('~/i18n');
  const i18n = createI18n(senderUser?.language_pref || 'en');

  try {
    // Check if target user exists
    const targetUser = await findUserByTelegramId(db, targetId);
    if (!targetUser && targetId !== senderId) {
        await telegram.sendMessage(chatId, i18n.t('dev.userNotFound'));
        return;
    }

    // Delete user data - ignore errors for non-existent tables
    // 按照外鍵依賴順序刪除
    const tables = [
      // 1. Dependencies (Children)
      // Delete ALL messages in conversations involving the user (including partner's messages) to allow conversation deletion
      {
        sql: `DELETE FROM conversation_messages WHERE conversation_id IN (
          SELECT id FROM conversations WHERE user_a_telegram_id = ? OR user_b_telegram_id = ?
        )`,
        params: [targetId, targetId],
      },
      {
        sql: 'DELETE FROM conversation_identifiers WHERE user_telegram_id = ? OR partner_telegram_id = ?',
        params: [targetId, targetId],
      },
      {
        sql: 'DELETE FROM conversation_history_posts WHERE user_telegram_id = ?',
        params: [targetId],
      },
      {
        sql: 'DELETE FROM conversation_new_message_posts WHERE user_telegram_id = ?',
        params: [targetId],
      },

      // Level 1: Deepest
      { sql: 'DELETE FROM refund_requests WHERE user_id = ?', params: [targetId] },
      { sql: 'DELETE FROM matching_history WHERE matched_user_id = ?', params: [targetId] },
      { 
        sql: `DELETE FROM matching_history WHERE bottle_id IN (
          SELECT id FROM bottles WHERE owner_telegram_id = ?
        )`, 
        params: [targetId] 
      },
      
      // Bottle Match Slots (FK to Bottles, Conversations)
      {
        sql: `DELETE FROM bottle_match_slots WHERE bottle_id IN (
            SELECT id FROM bottles WHERE owner_telegram_id = ?
        ) OR conversation_id IN (
            SELECT id FROM conversations WHERE user_a_telegram_id = ? OR user_b_telegram_id = ?
        ) OR matched_with_telegram_id = ?`,
        params: [targetId, targetId, targetId, targetId]
      },
      
      // Reports (FK to conversations OR user)
      {
        sql: `DELETE FROM reports WHERE conversation_id IN (
          SELECT id FROM conversations WHERE user_a_telegram_id = ? OR user_b_telegram_id = ?
        ) OR reporter_telegram_id = ? OR reported_telegram_id = ?`,
        params: [targetId, targetId, targetId, targetId],
      },

      // Level 3: Parents (conversations, bottles)
      {
        sql: 'DELETE FROM conversation_identifiers WHERE user_telegram_id = ? OR partner_telegram_id = ?',
        params: [targetId, targetId],
      },
      {
        sql: 'DELETE FROM conversations WHERE user_a_telegram_id = ? OR user_b_telegram_id = ?',
        params: [targetId, targetId],
      },
      // Only delete bottles OWNED by user. For matches, just unmatch.
      {
        sql: 'DELETE FROM bottles WHERE owner_telegram_id = ?',
        params: [targetId],
      },
      {
        sql: "UPDATE bottles SET matched_with_telegram_id = NULL, status = 'pending', matched_at = NULL WHERE matched_with_telegram_id = ?",
        params: [targetId],
      },

      // Level 4: Others
      {
        sql: 'DELETE FROM invites WHERE inviter_telegram_id = ? OR invitee_telegram_id = ?',
        params: [targetId, targetId],
      },
      { sql: 'DELETE FROM daily_usage WHERE telegram_id = ?', params: [targetId] },
      { sql: 'DELETE FROM bans WHERE user_id = ?', params: [targetId] },
      {
        sql: 'DELETE FROM user_blocks WHERE blocker_telegram_id = ? OR blocked_telegram_id = ?',
        params: [targetId, targetId],
      },
      { sql: 'DELETE FROM mbti_test_progress WHERE telegram_id = ?', params: [targetId] },
      { sql: 'DELETE FROM payments WHERE telegram_id = ?', params: [targetId] },
      { sql: 'DELETE FROM user_sessions WHERE telegram_id = ?', params: [targetId] },
      { sql: 'DELETE FROM bottle_drafts WHERE telegram_id = ?', params: [targetId] },
      { sql: 'DELETE FROM appeals WHERE telegram_id = ?', params: [targetId] },
      { sql: 'DELETE FROM broadcast_queue WHERE admin_telegram_id = ?', params: [targetId] },
      { sql: 'DELETE FROM admin_logs WHERE admin_telegram_id = ?', params: [targetId] },

      // Push & Ads
      { sql: 'DELETE FROM push_notifications WHERE user_id = ?', params: [targetId] },
      { sql: 'DELETE FROM user_push_preferences WHERE user_id = ?', params: [targetId] },
      { sql: 'DELETE FROM ad_sessions WHERE telegram_id = ?', params: [targetId] },

      // Fortune Telling
      { sql: 'DELETE FROM fortune_history WHERE telegram_id = ?', params: [targetId] },
      { sql: 'DELETE FROM fortune_quota WHERE telegram_id = ?', params: [targetId] },
      { sql: 'DELETE FROM fortune_profiles WHERE user_id = ?', params: [targetId] },

      // Ad rewards and analytics
      { sql: 'DELETE FROM ad_rewards WHERE telegram_id = ?', params: [targetId] },
      { sql: 'DELETE FROM ad_provider_logs WHERE telegram_id = ?', params: [targetId] },
      { sql: 'DELETE FROM analytics_events WHERE user_id = ?', params: [targetId] },
      { sql: 'DELETE FROM funnel_events WHERE user_id = ?', params: [targetId] },
      { sql: 'DELETE FROM daily_user_summary WHERE user_id = ?', params: [targetId] },

      // Tasks
      { sql: 'DELETE FROM user_tasks WHERE user_id = ?', params: [targetId] },
      { sql: 'DELETE FROM task_reminders WHERE user_id = ?', params: [targetId] },

      // VIP subscriptions (after refund_requests)
      { sql: 'DELETE FROM vip_subscriptions WHERE user_id = ?', params: [targetId] },

      // Level 5: Lastly delete user
      // IMPORTANT: Remove all potential FK references first
      { sql: 'DELETE FROM match_requests WHERE requester_id = ? OR target_id = ?', params: [targetId, targetId] },
      { sql: 'DELETE FROM user_blocklist WHERE user_id = ? OR blocked_user_id = ?', params: [targetId, targetId] },
      { sql: 'DELETE FROM official_ad_views WHERE telegram_id = ?', params: [targetId] },
      // Try both column names for appeals as there seems to be a schema mismatch in staging
      { sql: 'DELETE FROM appeals WHERE telegram_id = ?', params: [targetId] },
      { sql: 'DELETE FROM appeals WHERE user_id = ?', params: [targetId] },
      
      { sql: 'DELETE FROM users WHERE telegram_id = ?', params: [targetId] },
    ];

    console.error(`[handleDevReset] Starting data deletion for user ${targetId}...`);

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
      .bind(targetId)
      .first();

    if (existingUser) {
      console.error('[handleDevReset] User still exists after deletion, force deleting...');
      await db.d1.prepare('DELETE FROM users WHERE telegram_id = ?').bind(targetId).run();
    }

    console.error('[handleDevReset] Reset complete');

    await telegram.sendMessage(chatId, i18n.t('dev.dataReset') + ` (ID: ${targetId})`);
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
  const senderId = message.from!.id.toString();

  // SECURITY CHECK
  const db = createDatabaseClient(env.DB);
  const tempUser = await findUserByTelegramId(db, senderId);
  const { createI18n } = await import('~/i18n');
  const i18n = createI18n(tempUser?.language_pref || 'en');

  if (!isDevCommandAllowed(env, senderId)) {
    await telegram.sendMessage(chatId, i18n.t('dev.notAvailableInProduction'));
    return;
  }

  try {
    const telegramId = senderId; // Currently only shows info for self, could expand to target_id like reset
    
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
  const senderId = message.from!.id.toString();

  // SECURITY CHECK
  if (!isDevCommandAllowed(env, senderId)) {
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n('en'); // Dev messages default to zh-TW
    await telegram.sendMessage(chatId, i18n.t('dev.notAvailableInProduction'));
    return;
  }

  const db = createDatabaseClient(env.DB);
  const telegramId = message.from!.id.toString(); // Restart is always self for now to restart onboarding

  try {
    // Delete user data - use same logic as /dev_reset
    // 按照外鍵依賴順序刪除（從最深的子表到父表）
    const tables = [
      // 1. Dependencies (Children)
      // Delete ALL messages in conversations involving the user (including partner's messages) to allow conversation deletion
      {
        sql: `DELETE FROM conversation_messages WHERE conversation_id IN (
          SELECT id FROM conversations WHERE user_a_telegram_id = ? OR user_b_telegram_id = ?
        )`,
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

      // Level 1: Deepest
      { sql: 'DELETE FROM refund_requests WHERE user_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM matching_history WHERE matched_user_id = ?', params: [telegramId] },
      { 
        sql: `DELETE FROM matching_history WHERE bottle_id IN (
          SELECT id FROM bottles WHERE owner_telegram_id = ?
        )`, 
        params: [telegramId] 
      },
      
      // Bottle Match Slots (FK to Bottles, Conversations)
      {
        sql: `DELETE FROM bottle_match_slots WHERE bottle_id IN (
            SELECT id FROM bottles WHERE owner_telegram_id = ?
        ) OR conversation_id IN (
            SELECT id FROM conversations WHERE user_a_telegram_id = ? OR user_b_telegram_id = ?
        ) OR matched_with_telegram_id = ?`,
        params: [telegramId, telegramId, telegramId, telegramId]
      },
      
      // Reports (FK to conversations OR user)
      {
        sql: `DELETE FROM reports WHERE conversation_id IN (
          SELECT id FROM conversations WHERE user_a_telegram_id = ? OR user_b_telegram_id = ?
        ) OR reporter_telegram_id = ? OR reported_telegram_id = ?`,
        params: [telegramId, telegramId, telegramId, telegramId],
      },

      // Level 3: Parents (conversations, bottles)
      {
        sql: 'DELETE FROM conversation_identifiers WHERE user_telegram_id = ? OR partner_telegram_id = ?',
        params: [telegramId, telegramId],
      },
      {
        sql: 'DELETE FROM conversations WHERE user_a_telegram_id = ? OR user_b_telegram_id = ?',
        params: [telegramId, telegramId],
      },
      // Only delete bottles OWNED by user. For matches, just unmatch.
      {
        sql: 'DELETE FROM bottles WHERE owner_telegram_id = ?',
        params: [telegramId],
      },
      {
        sql: "UPDATE bottles SET matched_with_telegram_id = NULL, status = 'pending', matched_at = NULL WHERE matched_with_telegram_id = ?",
        params: [telegramId],
      },

      // Level 4: Others
      {
        sql: 'DELETE FROM invites WHERE inviter_telegram_id = ? OR invitee_telegram_id = ?',
        params: [telegramId, telegramId],
      },
      { sql: 'DELETE FROM daily_usage WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM bans WHERE user_id = ?', params: [telegramId] },
      {
        sql: 'DELETE FROM user_blocks WHERE blocker_telegram_id = ? OR blocked_telegram_id = ?',
        params: [telegramId, telegramId],
      },
      { sql: 'DELETE FROM mbti_test_progress WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM payments WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM user_sessions WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM bottle_drafts WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM appeals WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM broadcast_queue WHERE admin_telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM admin_logs WHERE admin_telegram_id = ?', params: [telegramId] },

      // Push & Ads
      { sql: 'DELETE FROM push_notifications WHERE user_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM user_push_preferences WHERE user_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM ad_sessions WHERE telegram_id = ?', params: [telegramId] },

      // Fortune Telling
      { sql: 'DELETE FROM fortune_history WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM fortune_quota WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM fortune_profiles WHERE user_id = ?', params: [telegramId] },

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

      // Level 5: Lastly delete user
      // IMPORTANT: Remove all potential FK references first
      { sql: 'DELETE FROM match_requests WHERE requester_id = ? OR target_id = ?', params: [telegramId, telegramId] },
      { sql: 'DELETE FROM user_blocklist WHERE user_id = ? OR blocked_user_id = ?', params: [telegramId, telegramId] },
      { sql: 'DELETE FROM official_ad_views WHERE telegram_id = ?', params: [telegramId] },
      // Try both column names for appeals as there seems to be a schema mismatch in staging
      { sql: 'DELETE FROM appeals WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM appeals WHERE user_id = ?', params: [telegramId] },

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
      language_pref: message.from!.language_code || 'en',
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
    const i18n = createI18n('en'); // Dev messages default to zh-TW
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
  const senderId = message.from!.id.toString();

  // SECURITY CHECK
  if (!isDevCommandAllowed(env, senderId)) {
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n('en'); // Dev messages default to zh-TW
    await telegram.sendMessage(chatId, i18n.t('dev.notAvailableInProduction'));
    return;
  }

  const db = createDatabaseClient(env.DB);
  const telegramId = message.from!.id.toString();

  const { createI18n } = await import('~/i18n');
  const i18n = createI18n('en'); // Dev messages default to zh-TW

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
        'en',
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
