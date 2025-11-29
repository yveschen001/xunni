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
import { createI18n } from '~/i18n';
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
  console.log('[handleAnalytics] Triggered'); // Log entry
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);

  const chatId = message.chat.id;
  const telegramId = message.from.id.toString();
  console.log(`[handleAnalytics] User: ${telegramId}, Chat: ${chatId}`);

  try {
    const i18n = createI18n('zh-TW'); // Admin commands use Chinese

    // Check if user is super admin using centralized logic
    const { isSuperAdmin } = await import('./admin_ban');
    const user = await findUserByTelegramId(db, telegramId);
    console.log(`[handleAnalytics] Found user: ${user?.telegram_id}, Role: ${user?.role}`);

    const isSuper = isSuperAdmin(telegramId) || (user && user.role === 'god');

    if (!isSuper) {
      console.warn(`[handleAnalytics] Permission denied. Role: ${user?.role}, ID: ${telegramId}`);
      await telegram.sendMessage(chatId, i18n.t('admin.analytics.noPermission'));
      return;
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    console.log(`[handleAnalytics] Generating report for date: ${today}`);

    // Generate report
    const report = await generateDailyReport(db.d1, today);
    console.log('[handleAnalytics] Report generated');
    const message_text = await formatDailyReport(report, i18n);

    console.log('[handleAnalytics] Sending report...');
    await telegram.sendMessage(chatId, message_text);
    console.log('[handleAnalytics] Report sent successfully');
  } catch (error) {
    console.error('[handleAnalytics] Error:', error);
    const i18n = createI18n('zh-TW');
    await telegram.sendMessage(chatId, i18n.t('admin.analytics.getDataFailed'));
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
    const { isSuperAdmin } = await import('./admin_ban');
    const user = await findUserByTelegramId(db, telegramId);

    const isSuper = isSuperAdmin(telegramId) || (user && user.role === 'god');

    if (!isSuper) {
      const i18n = createI18n('zh-TW');
      await telegram.sendMessage(chatId, i18n.t('admin.analytics.noPermissionAd'));
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
    // (user already fetched above)
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    const message_text = await formatAdPerformanceReport(report, i18n);

    await telegram.sendMessage(chatId, message_text);
  } catch (error) {
    console.error('[handleAdPerformance] Error:', error);
    const i18n = createI18n('zh-TW');
    await telegram.sendMessage(chatId, i18n.t('admin.analytics.getAdDataFailed'));
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
    const { isSuperAdmin } = await import('./admin_ban');
    const user = await findUserByTelegramId(db, telegramId);
    console.error('[handleVIPFunnel] User role:', user?.role);

    const isSuper = isSuperAdmin(telegramId) || (user && user.role === 'god');

    if (!isSuper) {
      console.error('[handleVIPFunnel] Permission denied for user:', telegramId);
      const i18n = createI18n('zh-TW');
      await telegram.sendMessage(chatId, i18n.t('admin.analytics.noPermissionVip'));
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

    const i18n = createI18n(user?.language_pref || 'zh-TW');
    const message_text = formatVIPFunnelReport(report, i18n);
    console.error('[handleVIPFunnel] Message formatted, length:', message_text.length);

    await telegram.sendMessage(chatId, message_text);
    console.error('[handleVIPFunnel] Message sent successfully');
  } catch (error) {
    console.error('[handleVIPFunnel] Error:', error);
    const i18n = createI18n('zh-TW');
    await telegram.sendMessage(chatId, i18n.t('admin.analytics.getVipDataFailed'));
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
      const i18n = createI18n('zh-TW');
      await telegram.sendMessage(chatId, i18n.t('admin.analytics.onlySuperAdmin'));
      return;
    }

    // Send daily reports (no "processing" message, reports will be sent directly)
    const { sendDailyReportsToSuperAdmins } = await import('~/services/daily_reports');
    await sendDailyReportsToSuperAdmins(env);

    // No confirmation message - reports speak for themselves
  } catch (error) {
    console.error('[handleTestDailyReports] Error:', error);
    const i18n = createI18n('zh-TW');
    await telegram.sendMessage(
      chatId,
      i18n.t('admin.analytics.sendReportFailed', {
        error: error instanceof Error ? error.message : String(error),
      })
    );
  }
}
