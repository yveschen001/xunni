import type { Env, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { createI18n } from '~/i18n';

/**
 * Handle admin daily report
 * Usually triggered by cron, but can be triggered manually by admin command
 */
export async function handleAdminDailyReport(
  env: Env,
  targetChatId?: string // Optional: force send to specific chat (for testing)
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const i18n = createI18n('zh-TW'); // Admin reports in Traditional Chinese

  try {
    // 1. Get yesterday's stats
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Translation stats
    const translationStats = await db.d1
      .prepare(
        `
      SELECT 
        provider,
        SUM(total_tokens) as tokens,
        SUM(total_characters) as chars,
        SUM(request_count) as requests,
        SUM(error_count) as errors,
        SUM(cost_usd) as cost
      FROM daily_translation_stats
      WHERE stat_date = ?
      GROUP BY provider
    `
      )
      .bind(yesterday)
      .all<any>();

    // Activity stats (reusing existing daily_stats table)
    const activityStats = await db.d1
      .prepare(
        `
      SELECT * FROM daily_stats WHERE stat_date = ?
    `
      )
      .bind(yesterday)
      .first<any>();

    // Fallbacks count
    const fallbackCount = await db.d1
      .prepare(
        `
      SELECT COUNT(*) as count FROM translation_fallbacks 
      WHERE date(created_at) = ?
    `
      )
      .bind(yesterday)
      .first<{ count: number }>();

    // 2. Format Report
    let report = `📊 **昨日運營日報** (${yesterday})\n\n`;

    // Cost Section
    let totalCost = 0;
    report += `💰 **翻譯成本估算**：\n`;
    if (translationStats.results.length > 0) {
      for (const stat of translationStats.results) {
        const cost = stat.cost || 0;
        totalCost += cost;
        const usage =
          stat.provider === 'openai'
            ? `${(stat.tokens / 1000).toFixed(1)}k Tokens`
            : `${(stat.chars / 1000).toFixed(1)}k Chars`;

        report += `• ${stat.provider.toUpperCase()}: $${cost.toFixed(4)} (${usage})\n`;
      }
      report += `👉 **總計**: $${totalCost.toFixed(4)}\n\n`;
    } else {
      report += `(無翻譯數據)\n\n`;
    }

    // Monitoring Section
    report += `⚠️ **異常監控**：\n`;
    report += `• 翻譯降級次數：${fallbackCount?.count || 0} 次\n`;
    const totalErrors = translationStats.results.reduce((sum, s) => sum + s.errors, 0);
    report += `• 翻譯失敗次數：${totalErrors} 次\n\n`;

    // Growth Section
    report += `📈 **活躍數據**：\n`;
    if (activityStats) {
      report += `• 新增用戶：+${activityStats.new_users || 0}\n`;
      report += `• 活躍用戶：${activityStats.active_users || 0}\n`;
      report += `• 新增對話：${activityStats.new_conversations || 0}\n`;
      report += `• 總訊息數：${activityStats.new_messages || 0}\n`;
    } else {
      report += `(無活躍數據)\n`;
    }

    // 3. Send to Admin(s)
    // If targetChatId provided (manual test), send there
    if (targetChatId) {
      await telegram.sendMessage(targetChatId, report);
      return;
    }

    // Otherwise send to all GOD users
    // Need to find god users. For now, use env var or query users table
    const gods = await db.d1
      .prepare(
        `
      SELECT telegram_id FROM users WHERE role = 'god'
    `
      )
      .all<{ telegram_id: string }>();

    if (gods.results.length > 0) {
      for (const god of gods.results) {
        await telegram.sendMessage(god.telegram_id, report);
      }
    } else {
      console.warn('[AdminReport] No GOD users found to receive report');
    }
  } catch (error) {
    console.error('[AdminReport] Failed to generate report:', error);
    if (targetChatId) {
      await telegram.sendMessage(targetChatId, `❌ 生成日報失敗: ${error}`);
    }
  }
}

/**
 * Handle /admin_report command (Super Admin only)
 */
export async function handleAdminReportCommand(message: TelegramMessage, env: Env): Promise<void> {
  const telegramId = message.from!.id.toString();
  // Dynamic import to avoid circular dependency if any
  const { isSuperAdmin } = await import('~/domain/admin/auth');
  
  if (!isSuperAdmin(env, telegramId)) {
    const telegram = createTelegramService(env);
    const i18n = createI18n('zh-TW');
    await telegram.sendMessage(message.chat.id, i18n.t('admin.onlySuperAdmin'));
    return;
  }

  // Trigger report generation for this chat
  await handleAdminDailyReport(env, message.chat.id.toString());
}
