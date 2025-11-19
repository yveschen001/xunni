/**
 * Admin Analytics Handler
 *
 * Purpose:
 *   Admin commands for viewing analytics reports
 *
 * Commands:
 *   - /analytics - Daily operations report
 *   - /ad_performance - Ad performance report
 *   - /vip_funnel - VIP conversion funnel
 */

import type { Env } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import {
  generateDailyReport,
  formatDailyReport,
  generateAdPerformanceReport,
  formatAdPerformanceReport,
  generateVIPFunnelReport,
  formatVIPFunnelReport,
} from '~/services/analytics_reports';

// ============================================================================
// Daily Analytics Report
// ============================================================================

/**
 * Handle /analytics command
 *
 * Show daily operations report
 */
export async function handleAnalytics(message: any, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);

  const chatId = message.chat.id;
  const telegramId = message.from.id.toString();

  try {
    // Check if user is super admin (role = 'god')
    const user = await findUserByTelegramId(db, telegramId);
    if (!user || user.role !== 'god') {
      await telegram.sendMessage(chatId, '❌ 你沒有權限查看分析數據');
      return;
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Generate report
    const report = await generateDailyReport(db.d1, today);
    const message_text = formatDailyReport(report);

    await telegram.sendMessage(chatId, message_text);
  } catch (error) {
    console.error('[handleAnalytics] Error:', error);
    await telegram.sendMessage(chatId, '❌ 獲取分析數據失敗');
  }
}

// ============================================================================
// Ad Performance Report
// ============================================================================

/**
 * Handle /ad_performance command
 *
 * Show ad performance report
 */
export async function handleAdPerformance(message: any, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);

  const chatId = message.chat.id;
  const telegramId = message.from.id.toString();

  try {
    // Check if user is super admin (role = 'god')
    const user = await findUserByTelegramId(db, telegramId);
    if (!user || user.role !== 'god') {
      await telegram.sendMessage(chatId, '❌ 你沒有權限查看廣告數據');
      return;
    }

    // Get date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 7);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Generate report
    const report = await generateAdPerformanceReport(db.d1, startDateStr, endDateStr);
    const message_text = formatAdPerformanceReport(report);

    await telegram.sendMessage(chatId, message_text);
  } catch (error) {
    console.error('[handleAdPerformance] Error:', error);
    await telegram.sendMessage(chatId, '❌ 獲取廣告數據失敗');
  }
}

// ============================================================================
// VIP Funnel Report
// ============================================================================

/**
 * Handle /vip_funnel command
 *
 * Show VIP conversion funnel
 */
export async function handleVIPFunnel(message: any, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);

  const chatId = message.chat.id;
  const telegramId = message.from.id.toString();

  console.error('[handleVIPFunnel] Starting VIP funnel report generation');

  try {
    // Check if user is super admin (role = 'god')
    const user = await findUserByTelegramId(db, telegramId);
    console.error('[handleVIPFunnel] User role:', user?.role);
    
    if (!user || user.role !== 'god') {
      console.error('[handleVIPFunnel] Permission denied for user:', telegramId);
      await telegram.sendMessage(chatId, '❌ 你沒有權限查看 VIP 數據');
      return;
    }
    
    console.error('[handleVIPFunnel] Permission check passed');

    // Get date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 30);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.error('[handleVIPFunnel] Date range:', startDateStr, 'to', endDateStr);

    // Generate report
    console.error('[handleVIPFunnel] Generating report...');
    const report = await generateVIPFunnelReport(db.d1, startDateStr, endDateStr);
    console.error('[handleVIPFunnel] Report generated:', report);
    
    const message_text = formatVIPFunnelReport(report);
    console.error('[handleVIPFunnel] Message formatted, length:', message_text.length);

    await telegram.sendMessage(chatId, message_text);
    console.error('[handleVIPFunnel] Message sent successfully');
  } catch (error) {
    console.error('[handleVIPFunnel] Error:', error);
    await telegram.sendMessage(chatId, '❌ 獲取 VIP 漏斗數據失敗');
  }
}

// ============================================================================
// Test Daily Reports
// ============================================================================

/**
 * Handle /test_daily_reports command
 * 
 * Manually trigger daily reports sending (for testing)
 * Super admin only
 */
export async function handleTestDailyReports(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // Check super admin permission
    const { isSuperAdmin } = await import('./admin_ban');
    if (!isSuperAdmin(telegramId)) {
      await telegram.sendMessage(chatId, '❌ 只有超級管理員可以使用此命令。');
      return;
    }

    await telegram.sendMessage(chatId, '⏳ 正在生成並發送每日報表...');

    // Send daily reports
    const { sendDailyReportsToSuperAdmins } = await import('~/services/daily_reports');
    await sendDailyReportsToSuperAdmins(env);

    await telegram.sendMessage(chatId, '✅ 每日報表已發送！');
  } catch (error) {
    console.error('[handleTestDailyReports] Error:', error);
    await telegram.sendMessage(
      chatId,
      `❌ 發送每日報表失敗：${error instanceof Error ? error.message : String(error)}`
    );
  }
}
