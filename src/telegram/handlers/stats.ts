/**
 * Stats Handler
 *
 * Handles /stats command - User statistics.
 */

import type { Env, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';

export async function handleStats(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      await telegram.sendMessage(chatId, '❌ 用戶不存在，請先使用 /start 註冊。');
      return;
    }

    // Check if user completed onboarding
    if (user.onboarding_step !== 'completed') {
      await telegram.sendMessage(chatId, '❌ 請先完成註冊流程。\n\n使用 /start 繼續註冊。');
      return;
    }

    // Get statistics
    const stats = await getUserStats(db, telegramId);

    // Format message
    const message_text =
      `📊 **我的統計數據**\n\n` +
      `🍾 **漂流瓶**\n` +
      `• 丟出：${stats.bottlesThrown} 個\n` +
      `• 撿到：${stats.bottlesCaught} 個\n` +
      `• 今日配額：${stats.todayQuota.display}\n\n` +
      `💬 **對話**\n` +
      `• 總對話數：${stats.totalConversations}\n` +
      `• 活躍對話：${stats.activeConversations}\n` +
      `• 總訊息數：${stats.totalMessages}\n\n` +
      `🎯 **匹配**\n` +
      `• 匹配成功率：${stats.matchRate}%\n` +
      `• 平均回覆率：${stats.replyRate}%\n\n` +
      `⭐ **VIP 狀態**\n` +
      `• ${user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > new Date() ? `VIP 會員 💎` : `免費會員`}\n` +
      (user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > new Date()
        ? `• 到期時間：${new Date(user.vip_expire_at).toLocaleDateString('zh-TW')}\n`
        : '') +
      `\n` +
      `📅 **註冊時間**：${new Date(user.created_at).toLocaleDateString('zh-TW')}\n` +
      `🎂 **年齡**：${calculateAge(user.birthday!)} 歲\n` +
      `🔮 **星座**：${user.zodiac_sign}\n` +
      `🧠 **MBTI**：${user.mbti_result || '未設定'}\n\n` +
      `🏠 返回主選單：/menu`;

    await telegram.sendMessage(chatId, message_text);
  } catch (error) {
    console.error('[handleStats] Error:', error);
    console.error('[handleStats] Error stack:', error instanceof Error ? error.stack : 'No stack');
    await telegram.sendMessage(
      chatId,
      `❌ 發生錯誤，請稍後再試。\n\n錯誤信息：${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get user statistics
 */
async function getUserStats(
  db: ReturnType<typeof createDatabaseClient>,
  telegramId: string
): Promise<{
  bottlesThrown: number;
  bottlesCaught: number;
  todayQuota: { display: string };
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  matchRate: number;
  replyRate: number;
}> {
  // Get bottles thrown
  const bottlesThrown = await db.d1
    .prepare(
      `
    SELECT COUNT(*) as count
    FROM bottles
    WHERE owner_telegram_id = ?
  `
    )
    .bind(telegramId)
    .first<{ count: number }>();

  // Get bottles caught
  const bottlesCaught = await db.d1
    .prepare(
      `
    SELECT COUNT(*) as count
    FROM conversations
    WHERE (user_a_telegram_id = ? OR user_b_telegram_id = ?)
      AND status = 'active'
  `
    )
    .bind(telegramId, telegramId)
    .first<{ count: number }>();

  // Get today's quota
  const today = new Date().toISOString().split('T')[0];
  const dailyUsage = await db.d1
    .prepare(
      `
    SELECT throws_count, catches_count
    FROM daily_usage
    WHERE telegram_id = ? AND date = ?
  `
    )
    .bind(telegramId, today)
    .first<{ throws_count: number; catches_count: number }>();

  const user = await db.d1
    .prepare(
      `
    SELECT is_vip, vip_expire_at, successful_invites FROM users WHERE telegram_id = ?
  `
    )
    .bind(telegramId)
    .first<{ is_vip: number; vip_expire_at: string | null; successful_invites: number }>();

  const isVip = !!(user?.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > new Date());
  const inviteBonus = user?.successful_invites || 0;
  
  // Calculate task bonus
  const { calculateTaskBonus } = await import('./tasks');
  const taskBonus = await calculateTaskBonus(db, telegramId);
  
  // Calculate permanent quota (base + invite)
  const baseQuota = isVip ? 30 : 3;
  const maxQuota = isVip ? 100 : 10;
  const permanentQuota = Math.min(baseQuota + inviteBonus, maxQuota);
  const totalQuota = permanentQuota + taskBonus;
  
  const used = dailyUsage?.throws_count || 0;
  const remaining = Math.max(0, totalQuota - used);
  
  // Format quota display (used/permanent+task)
  const quotaDisplay = taskBonus > 0 
    ? `${used}/${permanentQuota}+${taskBonus} (剩餘 ${remaining})`
    : `${used}/${permanentQuota} (剩餘 ${remaining})`;

  // Get total conversations
  const totalConversations = await db.d1
    .prepare(
      `
    SELECT COUNT(*) as count
    FROM conversations
    WHERE user_a_telegram_id = ? OR user_b_telegram_id = ?
  `
    )
    .bind(telegramId, telegramId)
    .first<{ count: number }>();

  // Get active conversations
  const activeConversations = await db.d1
    .prepare(
      `
    SELECT COUNT(*) as count
    FROM conversations
    WHERE (user_a_telegram_id = ? OR user_b_telegram_id = ?)
      AND status = 'active'
  `
    )
    .bind(telegramId, telegramId)
    .first<{ count: number }>();

  // Get total messages
  const totalMessages = await db.d1
    .prepare(
      `
    SELECT COUNT(*) as count
    FROM conversation_messages
    WHERE sender_telegram_id = ?
  `
    )
    .bind(telegramId)
    .first<{ count: number }>();

  // Calculate match rate (conversations / bottles thrown)
  // Match rate = percentage of thrown bottles that led to conversations
  const thrown = bottlesThrown?.count || 0;
  const caught = bottlesCaught?.count || 0;
  const conversations = totalConversations?.count || 0;
  const matchRate = thrown > 0 ? Math.min(100, Math.round((conversations / thrown) * 100)) : 0;

  // Calculate reply rate (messages per conversation average)
  // Reply rate = average messages per conversation (capped at 100%)
  const messages = totalMessages?.count || 0;
  const replyRate =
    conversations > 0 ? Math.min(100, Math.round((messages / conversations) * 10)) : 0;

  return {
    bottlesThrown: thrown,
    bottlesCaught: caught,
    todayQuota: { display: quotaDisplay },
    totalConversations: conversations,
    activeConversations: activeConversations?.count || 0,
    totalMessages: messages,
    matchRate, // Capped at 100%
    replyRate, // Capped at 100%
  };
}

/**
 * Calculate age from birthday
 */
function calculateAge(birthday: string): number {
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}
