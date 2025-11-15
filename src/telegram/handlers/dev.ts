/**
 * Development Commands
 * 
 * ⚠️ WARNING: These commands should be REMOVED in production!
 * Only for development/staging testing.
 */

import type { Env, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';

/**
 * /dev_reset - Reset user data for testing
 * 
 * ⚠️ DEVELOPMENT ONLY - Remove in production!
 */
export async function handleDevReset(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // Delete user data
    await db.d1.prepare('DELETE FROM conversation_messages WHERE sender_id = ? OR receiver_id = ?')
      .bind(telegramId, telegramId).run();
    
    await db.d1.prepare('DELETE FROM bottle_chat_history WHERE user_a_id = ? OR user_b_id = ?')
      .bind(telegramId, telegramId).run();
    
    await db.d1.prepare('DELETE FROM conversations WHERE user_a_id = ? OR user_b_id = ?')
      .bind(telegramId, telegramId).run();
    
    await db.d1.prepare('DELETE FROM bottles WHERE owner_id = ?')
      .bind(telegramId).run();
    
    await db.d1.prepare('DELETE FROM daily_usage WHERE user_id = ?')
      .bind(telegramId).run();
    
    await db.d1.prepare('DELETE FROM reports WHERE reporter_id = ? OR target_id = ?')
      .bind(telegramId, telegramId).run();
    
    await db.d1.prepare('DELETE FROM bans WHERE user_id = ?')
      .bind(telegramId).run();
    
    await db.d1.prepare('DELETE FROM user_blocks WHERE blocker_id = ? OR blocked_id = ?')
      .bind(telegramId, telegramId).run();
    
    await db.d1.prepare('DELETE FROM mbti_test_progress WHERE telegram_id = ?')
      .bind(telegramId).run();
    
    await db.d1.prepare('DELETE FROM payments WHERE user_id = ?')
      .bind(telegramId).run();
    
    await db.d1.prepare('DELETE FROM users WHERE telegram_id = ?')
      .bind(telegramId).run();

    await telegram.sendMessage(
      chatId,
      '✅ **開發模式：數據已重置**\n\n' +
        '你的所有數據已被刪除。\n\n' +
        '💡 現在可以重新開始測試註冊流程。\n\n' +
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
 */
export async function handleDevInfo(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
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
    const bottlesCount = await db.d1.prepare('SELECT COUNT(*) as count FROM bottles WHERE owner_id = ?')
      .bind(telegramId).first<{ count: number }>();
    
    const conversationsCount = await db.d1.prepare('SELECT COUNT(*) as count FROM conversations WHERE user_a_id = ? OR user_b_id = ?')
      .bind(telegramId, telegramId).first<{ count: number }>();
    
    const messagesCount = await db.d1.prepare('SELECT COUNT(*) as count FROM conversation_messages WHERE sender_id = ?')
      .bind(telegramId).first<{ count: number }>();

    const info = 
      '🔧 **開發模式：用戶信息**\n\n' +
      `**Telegram ID**: \`${user.telegram_id}\`\n` +
      `**昵稱**: ${user.nickname || '未設置'}\n` +
      `**註冊步驟**: ${user.onboarding_step}\n` +
      `**VIP**: ${user.is_vip ? '是' : '否'}\n` +
      `**語言**: ${user.language_pref}\n\n` +
      `**統計**:\n` +
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
 * /dev_skip - Skip to completed onboarding (for testing)
 * 
 * ⚠️ DEVELOPMENT ONLY - Remove in production!
 */
export async function handleDevSkip(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
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
        onboarding_step,
        anti_fraud_score,
        terms_agreed,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(telegram_id) DO UPDATE SET
        onboarding_step = 'completed',
        nickname = COALESCE(nickname, '測試用戶'),
        gender = COALESCE(gender, 'male'),
        birthday = COALESCE(birthday, '2000-01-01'),
        age = COALESCE(age, 25),
        zodiac_sign = COALESCE(zodiac_sign, 'Capricorn'),
        anti_fraud_score = COALESCE(anti_fraud_score, 100),
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
      'completed',
      100,
      1
    ).run();

    await telegram.sendMessage(
      chatId,
      '✅ **開發模式：跳過註冊**\n\n' +
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

