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
    await telegram.sendMessage(
      chatId,
      '❌ 此命令在生產環境中不可用。\n\nThis command is not available in production.'
    );
    return;
  }

  const db = createDatabaseClient(env.DB);
  const telegramId = message.from!.id.toString();

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
      
      // Smart matching history (depends on bottles)
      {
        sql: 'DELETE FROM matching_history WHERE matched_user_id = ?',
        params: [telegramId],
      },

      // 2. 刪除對話和漂流瓶
      {
        sql: 'DELETE FROM conversations WHERE user_a_telegram_id = ? OR user_b_telegram_id = ?',
        params: [telegramId, telegramId],
      },
      {
        sql: 'DELETE FROM bottles WHERE owner_telegram_id = ? OR matched_with_telegram_id = ?',
        params: [telegramId, telegramId],
      },

      // 3. 刪除邀請相關數據
      {
        sql: 'DELETE FROM invites WHERE inviter_telegram_id = ? OR invitee_telegram_id = ?',
        params: [telegramId, telegramId],
      },

      // 4. 刪除用戶相關數據
      { sql: 'DELETE FROM daily_usage WHERE telegram_id = ?', params: [telegramId] },
      {
        sql: 'DELETE FROM reports WHERE reporter_telegram_id = ? OR reported_telegram_id = ?',
        params: [telegramId, telegramId],
      },
      { sql: 'DELETE FROM bans WHERE telegram_id = ?', params: [telegramId] },
      {
        sql: 'DELETE FROM user_blocks WHERE blocker_telegram_id = ? OR blocked_telegram_id = ?',
        params: [telegramId, telegramId],
      },
      { sql: 'DELETE FROM mbti_test_progress WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM payments WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM user_sessions WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM bottle_drafts WHERE telegram_id = ?', params: [telegramId] },
      
      // Ad rewards and analytics
      { sql: 'DELETE FROM ad_rewards WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM ad_provider_logs WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM analytics_events WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM funnel_events WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM daily_user_summary WHERE telegram_id = ?', params: [telegramId] },
      
      // Tasks
      { sql: 'DELETE FROM user_tasks WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM task_reminders WHERE telegram_id = ?', params: [telegramId] },
      
      // VIP subscriptions
      { sql: 'DELETE FROM vip_subscriptions WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM refund_requests WHERE telegram_id = ?', params: [telegramId] },

      // 5. 最後刪除用戶本身
      { sql: 'DELETE FROM users WHERE telegram_id = ?', params: [telegramId] },
    ];

    console.error('[handleDevReset] Starting data deletion...');
    for (const { sql, params } of tables) {
      try {
        const result = await db.d1
          .prepare(sql)
          .bind(...params)
          .run();
        console.error(`[handleDevReset] Deleted from ${sql.split(' ')[2]}: ${result.meta?.changes || 0} rows`);
      } catch (err) {
        // Ignore table not found errors
        console.error(`[handleDevReset] Skipping table: ${sql.split(' ')[2]}`, err);
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
      await db.d1
        .prepare('DELETE FROM users WHERE telegram_id = ?')
        .bind(telegramId)
        .run();
    }
    
    console.error('[handleDevReset] Reset complete');

    await telegram.sendMessage(
      chatId,
      '✅ 開發模式：數據已重置\n\n' +
        '你的所有數據已被刪除。\n\n' +
        '💡 現在可以重新開始測試註冊流程。\n\n' +
        '🔄 重新註冊：/start\n' +
        '或使用：/dev_restart（自動開始註冊）\n\n' +
        '⚠️ 注意：此功能僅在 Staging 環境可用。'
    );
  } catch (error) {
    console.error('[handleDevReset] Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    await telegram.sendMessage(chatId, `❌ 重置失敗：${errorMessage}\n\n請稍後再試。`);
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
  if (!isDevCommandAllowed(env)) {
    await telegram.sendMessage(
      chatId,
      '❌ 此命令在生產環境中不可用。\n\nThis command is not available in production.'
    );
    return;
  }

  const db = createDatabaseClient(env.DB);
  const telegramId = message.from!.id.toString();

  try {
    // Get user info
    const user = await db.d1
      .prepare('SELECT * FROM users WHERE telegram_id = ?')
      .bind(telegramId)
      .first();

    if (!user) {
      await telegram.sendMessage(chatId, '❌ 用戶不存在');
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
      '🔧 開發模式：用戶信息\n\n' +
      `Telegram ID: ${user.telegram_id}\n` +
      `昵稱: ${user.nickname || '未設置'}\n` +
      `註冊步驟: ${user.onboarding_step}\n` +
      `VIP: ${user.is_vip ? '是' : '否'}\n` +
      `語言: ${user.language_pref}\n` +
      `邀請碼: ${user.invite_code || '未生成'}\n` +
      `被誰邀請: ${user.invited_by || '無'}\n\n` +
      `統計:\n` +
      `• 漂流瓶: ${bottlesCount?.count || 0}\n` +
      `• 對話: ${conversationsCount?.count || 0}\n` +
      `• 訊息: ${messagesCount?.count || 0}\n\n` +
      `邀請統計:\n` +
      `• successful_invites: ${user.successful_invites || 0}\n` +
      `• 邀請記錄總數: ${inviteStats?.total || 0}\n` +
      `• 已激活: ${inviteStats?.activated || 0}\n` +
      `• 待激活: ${inviteStats?.pending || 0}\n\n` +
      `⚠️ 此功能僅在 Staging 環境可用。`;

    await telegram.sendMessage(chatId, info);
  } catch (error) {
    console.error('[handleDevInfo] Error:', error);
    await telegram.sendMessage(chatId, '❌ 獲取信息失敗');
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
    await telegram.sendMessage(
      chatId,
      '❌ 此命令在生產環境中不可用。\n\nThis command is not available in production.'
    );
    return;
  }

  const db = createDatabaseClient(env.DB);
  const telegramId = message.from!.id.toString();

  try {
    // Delete user data - use same logic as /dev_reset
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
      
      // Smart matching history (depends on bottles)
      {
        sql: 'DELETE FROM matching_history WHERE matched_user_id = ?',
        params: [telegramId],
      },

      // 2. 刪除對話和漂流瓶
      {
        sql: 'DELETE FROM conversations WHERE user_a_telegram_id = ? OR user_b_telegram_id = ?',
        params: [telegramId, telegramId],
      },
      {
        sql: 'DELETE FROM bottles WHERE owner_telegram_id = ? OR matched_with_telegram_id = ?',
        params: [telegramId, telegramId],
      },

      // 3. 刪除邀請相關數據
      {
        sql: 'DELETE FROM invites WHERE inviter_telegram_id = ? OR invitee_telegram_id = ?',
        params: [telegramId, telegramId],
      },

      // 4. 刪除用戶相關數據
      { sql: 'DELETE FROM daily_usage WHERE telegram_id = ?', params: [telegramId] },
      {
        sql: 'DELETE FROM reports WHERE reporter_telegram_id = ? OR reported_telegram_id = ?',
        params: [telegramId, telegramId],
      },
      { sql: 'DELETE FROM bans WHERE telegram_id = ?', params: [telegramId] },
      {
        sql: 'DELETE FROM user_blocks WHERE blocker_telegram_id = ? OR blocked_telegram_id = ?',
        params: [telegramId, telegramId],
      },
      { sql: 'DELETE FROM mbti_test_progress WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM payments WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM user_sessions WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM bottle_drafts WHERE telegram_id = ?', params: [telegramId] },
      
      // Ad rewards and analytics
      { sql: 'DELETE FROM ad_rewards WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM ad_provider_logs WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM analytics_events WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM funnel_events WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM daily_user_summary WHERE telegram_id = ?', params: [telegramId] },
      
      // Tasks
      { sql: 'DELETE FROM user_tasks WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM task_reminders WHERE telegram_id = ?', params: [telegramId] },
      
      // VIP subscriptions
      { sql: 'DELETE FROM vip_subscriptions WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM refund_requests WHERE telegram_id = ?', params: [telegramId] },

      // 5. 最後刪除用戶本身
      { sql: 'DELETE FROM users WHERE telegram_id = ?', params: [telegramId] },
    ];

    console.error('[handleDevRestart] Starting data deletion...');
    for (const { sql, params } of tables) {
      try {
        const result = await db.d1
          .prepare(sql)
          .bind(...params)
          .run();
        console.error(`[handleDevRestart] Deleted from ${sql.split(' ')[2]}: ${result.meta?.changes || 0} rows`);
      } catch (err) {
        // Ignore table not found errors
        console.error(`[handleDevRestart] Skipping table: ${sql.split(' ')[2]}`, err);
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
      await db.d1
        .prepare('DELETE FROM users WHERE telegram_id = ?')
        .bind(telegramId)
        .run();
      
      // Wait a bit to ensure deletion is committed
      await new Promise(resolve => setTimeout(resolve, 100));
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
    await telegram.sendMessage(chatId, `❌ 重置失敗：${errorMessage}\n\n請稍後再試。`);
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
    await telegram.sendMessage(
      chatId,
      '❌ 此命令在生產環境中不可用。\n\nThis command is not available in production.'
    );
    return;
  }

  const db = createDatabaseClient(env.DB);
  const telegramId = message.from!.id.toString();

  try {
    // Generate invite code
    const { generateInviteCode } = await import('~/domain/user');
    const inviteCode = generateInviteCode();

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
        nickname = '測試用戶',
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
        '測試用戶',
        'male',
        '2000-01-01',
        25,
        'Capricorn',
        'zh-TW',
        inviteCode,
        'completed',
        100,
        1
      )
      .run();

    await telegram.sendMessage(
      chatId,
      '✅ 開發模式：跳過註冊\n\n' +
        '已自動完成註冊流程。\n\n' +
        '💡 現在可以直接測試核心功能：\n' +
        '• /throw - 丟漂流瓶\n' +
        '• /catch - 撿漂流瓶\n' +
        '• /stats - 查看統計\n\n' +
        '⚠️ 此功能僅在 Staging 環境可用。'
    );
  } catch (error) {
    console.error('[handleDevSkip] Error:', error);
    await telegram.sendMessage(chatId, '❌ 跳過失敗');
  }
}
