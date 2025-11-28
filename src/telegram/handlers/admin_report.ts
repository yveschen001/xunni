import type { Env, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { createI18n } from '~/i18n';
import { TranslationLogService, DailyTranslationStats } from '~/services/translation_log';
import { isAdmin } from './admin_ban';

/**
 * Handle admin daily report request (manual or cron)
 */
export async function handleAdminDailyReport(
  env: Env,
  targetUserId?: string
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const logService = new TranslationLogService(db);

  // Get yesterday's date
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];

  // Fetch stats
  const stats = await logService.getDailyStats(dateStr);
  const fallbackCount = await logService.getFallbackCount(dateStr);

  // Fetch active data (reusing getDailyStats from domain logic if available, or simple count)
  // Simple estimation for now based on what we have in daily_stats
  const dailyStats = await db.d1.prepare('SELECT * FROM daily_stats WHERE stat_date = ?').bind(dateStr).first<any>();
  
  const newUsers = dailyStats?.new_users || 0;
  const activeConversations = dailyStats?.total_conversations || 0; // Or calculate active ones

  // Format report
  let costDetails = '';
  let errorCount = 0;

  if (stats.length === 0) {
    costDetails = '• (無翻譯記錄)';
  } else {
    for (const stat of stats) {
      errorCount += stat.error_count;
      let costDisplay = '';
      if (stat.provider === 'openai') {
        const estimatedCost = (stat.total_tokens / 1000) * 0.00015; // Approx cost for gpt-4o-mini input
        costDisplay = `~${stat.total_tokens} tokens ($${estimatedCost.toFixed(4)})`;
      } else {
        costDisplay = `${stat.request_count} reqs`;
      }
      
      const emoji = stat.provider === 'openai' ? '🟢' : (stat.provider === 'gemini' ? '🔵' : '⚪️');
      costDetails += `• ${emoji} ${stat.provider}: ${costDisplay}\n`;
    }
  }

  // Determine recipient
  let recipientId = targetUserId;
  
  if (!recipientId) {
    // Find 'god' users
    const godUsers = await db.d1.prepare("SELECT telegram_id FROM users WHERE role = 'god'").all<{telegram_id: string}>();
    if (godUsers.results.length > 0) {
      // Send to all gods
      for (const god of godUsers.results) {
        await sendReport(god.telegram_id);
      }
      return;
    } else {
      console.warn('[AdminDailyReport] No god users found to send report');
      return;
    }
  } else {
    await sendReport(recipientId);
  }

  async function sendReport(userId: string) {
    // We force zh-TW for admin report for consistency as requested
    const i18n = createI18n('zh-TW'); 
    
    const message = i18n.t('admin.dailyReport', {
      date: dateStr,
      costDetails: costDetails.trim(),
      fallbackCount,
      errorCount,
      newUsers,
      activeConversations
    });

    await telegram.sendMessage(userId, message);
  }
}

/**
 * Manual trigger command /admin_report
 */
export async function handleAdminReportCommand(message: TelegramMessage, env: Env): Promise<void> {
  const telegramId = message.from!.id.toString();
  if (!isAdmin(env, telegramId)) return;

  await handleAdminDailyReport(env, telegramId);
}

