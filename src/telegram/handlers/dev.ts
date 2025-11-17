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
  
  const db = createDatabaseClient(env);
  const telegramId = message.from!.id.toString();

  try {
    // Delete user data - ignore errors for non-existent tables
    // 按照外鍵依賴順序刪除
    const tables = [
      // 1. 先刪除依賴其他表的數據
      { sql: 'DELETE FROM conversation_messages WHERE sender_telegram_id = ? OR receiver_telegram_id = ?', params: [telegramId, telegramId] },
      { sql: 'DELETE FROM conversation_identifiers WHERE user_telegram_id = ? OR partner_telegram_id = ?', params: [telegramId, telegramId] },
      { sql: 'DELETE FROM conversation_history_posts WHERE user_telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM conversation_new_message_posts WHERE user_telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM bottle_chat_history WHERE user_a_telegram_id = ? OR user_b_telegram_id = ?', params: [telegramId, telegramId] },
      
      // 2. 刪除對話和漂流瓶
      { sql: 'DELETE FROM conversations WHERE user_a_telegram_id = ? OR user_b_telegram_id = ?', params: [telegramId, telegramId] },
      { sql: 'DELETE FROM bottles WHERE owner_telegram_id = ? OR matched_with_telegram_id = ?', params: [telegramId, telegramId] },
      
      // 3. 刪除邀請相關數據
      { sql: 'DELETE FROM invites WHERE inviter_telegram_id = ? OR invitee_telegram_id = ?', params: [telegramId, telegramId] },
      
      // 4. 刪除用戶相關數據
      { sql: 'DELETE FROM daily_usage WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM reports WHERE reporter_telegram_id = ? OR reported_telegram_id = ?', params: [telegramId, telegramId] },
      { sql: 'DELETE FROM bans WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM user_blocks WHERE blocker_telegram_id = ? OR blocked_telegram_id = ?', params: [telegramId, telegramId] },
      { sql: 'DELETE FROM mbti_test_progress WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM payments WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM user_sessions WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM bottle_drafts WHERE telegram_id = ?', params: [telegramId] },
      
      // 5. 最後刪除用戶本身
      { sql: 'DELETE FROM users WHERE telegram_id = ?', params: [telegramId] },
    ];

    for (const { sql, params } of tables) {
      try {
        await db.d1.prepare(sql).bind(...params).run();
      } catch (err) {
        // Ignore table not found errors
        console.log(`[handleDevReset] Skipping: ${sql.split(' ')[2]}`);
      }
    }

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
    await telegram.sendMessage(chatId, '❌ 重置失敗，請稍後再試。');
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
  
  const db = createDatabaseClient(env);
  const telegramId = message.from!.id.toString();

  try {
    // Get user info
    const user = await db.d1.prepare('SELECT * FROM users WHERE telegram_id = ?')
      .bind(telegramId).first();

    if (!user) {
      await telegram.sendMessage(chatId, '❌ 用戶不存在');
      return;
    }

    // Get counts
    const bottlesCount = await db.d1.prepare('SELECT COUNT(*) as count FROM bottles WHERE owner_telegram_id = ?')
      .bind(telegramId).first<{ count: number }>();
    
    const conversationsCount = await db.d1.prepare('SELECT COUNT(*) as count FROM conversations WHERE user_a_telegram_id = ? OR user_b_telegram_id = ?')
      .bind(telegramId, telegramId).first<{ count: number }>();
    
    const messagesCount = await db.d1.prepare('SELECT COUNT(*) as count FROM conversation_messages WHERE sender_telegram_id = ?')
      .bind(telegramId).first<{ count: number }>();

    const info = 
      '🔧 開發模式：用戶信息\n\n' +
      `Telegram ID: ${user.telegram_id}\n` +
      `昵稱: ${user.nickname || '未設置'}\n` +
      `註冊步驟: ${user.onboarding_step}\n` +
      `VIP: ${user.is_vip ? '是' : '否'}\n` +
      `語言: ${user.language_pref}\n\n` +
      `統計:\n` +
      `• 漂流瓶: ${bottlesCount?.count || 0}\n` +
      `• 對話: ${conversationsCount?.count || 0}\n` +
      `• 訊息: ${messagesCount?.count || 0}\n\n` +
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
  
  const db = createDatabaseClient(env);
  const telegramId = message.from!.id.toString();

  try {
    // Delete user data - use same logic as /dev_reset
    // 按照外鍵依賴順序刪除
    const tables = [
      // 1. 先刪除依賴其他表的數據
      { sql: 'DELETE FROM conversation_messages WHERE sender_telegram_id = ? OR receiver_telegram_id = ?', params: [telegramId, telegramId] },
      { sql: 'DELETE FROM conversation_identifiers WHERE user_telegram_id = ? OR partner_telegram_id = ?', params: [telegramId, telegramId] },
      { sql: 'DELETE FROM conversation_history_posts WHERE user_telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM conversation_new_message_posts WHERE user_telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM bottle_chat_history WHERE user_a_telegram_id = ? OR user_b_telegram_id = ?', params: [telegramId, telegramId] },
      
      // 2. 刪除對話和漂流瓶
      { sql: 'DELETE FROM conversations WHERE user_a_telegram_id = ? OR user_b_telegram_id = ?', params: [telegramId, telegramId] },
      { sql: 'DELETE FROM bottles WHERE owner_telegram_id = ? OR matched_with_telegram_id = ?', params: [telegramId, telegramId] },
      
      // 3. 刪除邀請相關數據
      { sql: 'DELETE FROM invites WHERE inviter_telegram_id = ? OR invitee_telegram_id = ?', params: [telegramId, telegramId] },
      
      // 4. 刪除用戶相關數據
      { sql: 'DELETE FROM daily_usage WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM reports WHERE reporter_telegram_id = ? OR reported_telegram_id = ?', params: [telegramId, telegramId] },
      { sql: 'DELETE FROM bans WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM user_blocks WHERE blocker_telegram_id = ? OR blocked_telegram_id = ?', params: [telegramId, telegramId] },
      { sql: 'DELETE FROM mbti_test_progress WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM payments WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM user_sessions WHERE telegram_id = ?', params: [telegramId] },
      { sql: 'DELETE FROM bottle_drafts WHERE telegram_id = ?', params: [telegramId] },
      
      // 5. 最後刪除用戶本身
      { sql: 'DELETE FROM users WHERE telegram_id = ?', params: [telegramId] },
    ];

    for (const { sql, params } of tables) {
      try {
        await db.d1.prepare(sql).bind(...params).run();
      } catch (err) {
        // Ignore table not found errors
        console.log(`[handleDevRestart] Skipping: ${sql.split(' ')[2]}`);
      }
    }

    // Create user record with language_selection step
    const { generateInviteCode } = await import('~/domain/user');
    const { createUser } = await import('~/db/queries/users');
    
    await createUser(db, {
      telegram_id: telegramId,
      username: message.from!.username,
      first_name: message.from!.first_name,
      last_name: message.from!.last_name,
      language_pref: message.from!.language_code || 'zh-TW',
      invite_code: generateInviteCode(),
      onboarding_step: 'language_selection',
    });
    
    // Show language selection (start onboarding)
    const { showLanguageSelection } = await import('./language_selection');
    await showLanguageSelection(message, env);
    
  } catch (error) {
    console.error('[handleDevRestart] Error:', error);
    await telegram.sendMessage(chatId, '❌ 重置失敗，請稍後再試。');
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
  
  const db = createDatabaseClient(env);
  const telegramId = message.from!.id.toString();

  try {
    // Generate invite code
    const { generateInviteCode } = await import('~/domain/user');
    const inviteCode = generateInviteCode();
    
    // Create or update user with completed onboarding
    await db.d1.prepare(`
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
    `).bind(
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
    ).run();

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

