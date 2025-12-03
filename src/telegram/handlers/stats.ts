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

  // Get user for i18n (needed in both try and catch)
  const user = await findUserByTelegramId(db, telegramId);
  const { createI18n } = await import('~/i18n');
  const i18n = createI18n(user?.language_pref || 'zh-TW');

  try {
    if (!user) {
      await telegram.sendMessage(chatId, i18n.t('errors.userNotFound'));
      return;
    }

    // Check if user completed onboarding
    if (user.onboarding_step !== 'completed') {
      await telegram.sendMessage(chatId, i18n.t('common.notRegistered'));
      return;
    }

    // Get statistics
    const stats = await getUserStats(db, telegramId);

    // 🆕 Check if user is VIP
    const isVip = !!(
      user.is_vip &&
      user.vip_expire_at &&
      new Date(user.vip_expire_at) > new Date()
    );

    // 🆕 Get Fortune Stats
    const { FortuneService } = await import('~/services/fortune');
    const fortuneService = new FortuneService(env, db.d1);
    // Refresh quota to ensure accuracy
    const fortuneQuota = await fortuneService.refreshQuota(telegramId, isVip);
    
    // Count total readings
    const fortuneReadings = await db.d1.prepare('SELECT COUNT(*) as count FROM fortune_history WHERE telegram_id = ?').bind(telegramId).first<{count: number}>();
    const totalReadings = fortuneReadings?.count || 0;
    
    const fortuneTotal = fortuneQuota.weekly_free_quota + fortuneQuota.additional_quota;
    const fortuneWeeklyLimit = isVip ? 7 : 1;
    
    // Use i18n safely
    const weeklyFreeLabel = i18n.t('common.weeklyFree') || '本週免費';
    const additionalLabel = i18n.t('common.additional') || '額外';
    const fortuneQuotaValue = `${fortuneTotal} (${weeklyFreeLabel}: ${fortuneQuota.weekly_free_quota}/${fortuneWeeklyLimit} | ${additionalLabel}: ${fortuneQuota.additional_quota})`;
    
    const fortuneStatsText = 
      i18n.t('stats.fortuneTitle', { fortuneBottle: i18n.t('common.fortuneBottle') }) +
      i18n.t('stats.fortuneReadings', { count: totalReadings }) +
      i18n.t('stats.fortuneQuota', { quota: fortuneQuotaValue }) + '\n';

    // 🆕 Get VIP triple bottle stats if user is VIP
    let vipStatsText = '';
    if (isVip) {
      const { getVipTripleBottleStats } = await import('~/db/queries/bottle_match_slots');
      const vipStats = await getVipTripleBottleStats(db, telegramId, 30);

      if (vipStats.throws > 0) {
        const avgMatches =
          vipStats.throws > 0 ? (vipStats.matchedSlots / vipStats.throws).toFixed(1) : '0.0';
        const matchRate =
          vipStats.totalSlots > 0
            ? ((vipStats.matchedSlots / vipStats.totalSlots) * 100).toFixed(1)
            : '0.0';

        vipStatsText =
          i18n.t('stats.vipTripleTitle', { days: 30 }) +
          '\n' +
          i18n.t('stats.vipThrows', { count: vipStats.throws }) +
          '\n' +
          i18n.t('stats.vipTotalSlots', { count: vipStats.totalSlots }) +
          '\n' +
          i18n.t('stats.vipMatchedSlots', { count: vipStats.matchedSlots }) +
          '\n' +
          i18n.t('stats.vipMatchRate', { rate: matchRate }) +
          '\n' +
          i18n.t('stats.vipAvgMatches', { avg: avgMatches }) +
          '\n';
      }
    }

    // Format message
    const message_text =
      i18n.t('stats.title') +
      i18n.t('stats.bottles') +
      i18n.t('stats.bottlesThrown', { count: stats.bottlesThrown }) +
      '\n' +
      i18n.t('stats.bottlesCaught', { count: stats.bottlesCaught }) +
      '\n' +
      i18n.t('stats.todayQuota', { display: stats.todayQuota.display }) +
      fortuneStatsText +
      '\n' +
      i18n.t('stats.conversations') +
      i18n.t('stats.conversationsTotal', { count: stats.totalConversations }) +
      '\n' +
      i18n.t('stats.conversationsActive', { count: stats.activeConversations }) +
      '\n' +
      i18n.t('stats.messagesTotal', { count: stats.totalMessages }) +
      '\n' +
      i18n.t('stats.match') +
      i18n.t('stats.matchRate', { rate: stats.matchRate }) +
      '\n' +
      i18n.t('stats.replyRate', { rate: stats.replyRate }) +
      '\n' +
      i18n.t('stats.vip') +
      `• ${isVip ? i18n.t('stats.vipMember') : i18n.t('stats.vipFree')}\n` +
      (isVip
        ? i18n.t('stats.vipExpire', {
          date: new Date(user.vip_expire_at!).toLocaleDateString(user.language_pref || 'zh-TW'),
        }) + '\n'
        : '') +
      vipStatsText +
      '\n' +
      i18n.t('stats.registerTime', {
        date: new Date(user.created_at).toLocaleDateString(user.language_pref || 'zh-TW'),
      }) +
      '\n' +
      i18n.t('stats.age', { age: calculateAge(user.birthday!) }) +
      '\n' +
      i18n.t('stats.zodiac', { zodiac: user.zodiac_sign }) +
      '\n' +
      i18n.t('stats.mbti', { mbti: user.mbti_result || i18n.t('stats.notSet') });

    // Send message with return to menu button
    await telegram.sendMessageWithButtons(chatId, message_text, [
      [{ text: i18n.t('common.back3'), callback_data: 'return_to_menu' }],
    ]);
  } catch (error) {
    console.error('[handleStats] Error:', error);
    console.error('[handleStats] Error stack:', error instanceof Error ? error.stack : 'No stack');
    await telegram.sendMessage(chatId, i18n.t('errors.systemErrorRetry'));
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
  const _remaining = Math.max(0, totalQuota - used);

  // Format quota display (used/permanent+task)
  // Note: Remaining will be added in handleStats using i18n
  const quotaDisplay =
    taskBonus > 0 ? `${used}/${permanentQuota}+${taskBonus}` : `${used}/${permanentQuota}`;

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
