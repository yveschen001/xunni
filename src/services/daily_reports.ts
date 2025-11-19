/**
 * Daily Reports Service
 * 
 * Purpose:
 *   Send daily analytics reports to super admins
 *   - Daily analytics report
 *   - Ad performance report
 *   - VIP conversion funnel
 */

import type { Env } from '~/types';
import { createTelegramService } from '~/services/telegram';
import { createDatabaseClient } from '~/db/client';

/**
 * Send daily analytics reports to all super admins
 */
export async function sendDailyReportsToSuperAdmins(env: Env): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('[sendDailyReportsToSuperAdmins] Starting daily report generation...');

  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);

  try {
    // Get super admin IDs
    const { getSuperAdminIds } = await import('../telegram/handlers/admin_ban');
    const superAdminIds = getSuperAdminIds(env);

    // eslint-disable-next-line no-console
    console.log(`[sendDailyReportsToSuperAdmins] Found ${superAdminIds.length} super admins`);

    if (superAdminIds.length === 0) {
      // eslint-disable-next-line no-console
      console.log('[sendDailyReportsToSuperAdmins] No super admins configured');
      return;
    }

    // eslint-disable-next-line no-console
    console.log(`[sendDailyReportsToSuperAdmins] Sending reports to ${superAdminIds.length} super admins`);

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    // eslint-disable-next-line no-console
    console.log(`[sendDailyReportsToSuperAdmins] Generating reports for date: ${dateStr}`);

    // Generate reports
    const {
      generateDailyReport,
      formatDailyReport,
      generateAdPerformanceReport,
      formatAdPerformanceReport,
      generateVIPFunnelReport,
      formatVIPFunnelReport,
    } = await import('./analytics_reports');

    const dailyReportData = await generateDailyReport(db.d1, dateStr);
    const dailyReport = formatDailyReport(dailyReportData);

    const adReportData = await generateAdPerformanceReport(db.d1, dateStr, dateStr);
    const adReport = formatAdPerformanceReport(adReportData);

    const funnelReportData = await generateVIPFunnelReport(db.d1, dateStr, dateStr);
    const funnelReport = formatVIPFunnelReport(funnelReportData);

    // Send to each super admin
    for (const adminId of superAdminIds) {
      try {
        // Send header
        await telegram.sendMessage(
          parseInt(adminId),
          `📊 **每日數據分析報表**\n` +
            `時間：${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}\n` +
            `━━━━━━━━━━━━━━━━`
        );

        // Delay to avoid rate limiting
        await sleep(500);

        // 1. Daily Analytics
        await telegram.sendMessage(parseInt(adminId), dailyReport);
        await sleep(500);

        // 2. Ad Performance
        await telegram.sendMessage(parseInt(adminId), adReport);
        await sleep(500);

        // 3. VIP Funnel
        await telegram.sendMessage(parseInt(adminId), funnelReport);

        // eslint-disable-next-line no-console
        console.log(`[sendDailyReportsToSuperAdmins] Sent reports to admin ${adminId}`);
      } catch (error) {
        console.error(`[sendDailyReportsToSuperAdmins] Failed to send to admin ${adminId}:`, error);
      }
    }

    // eslint-disable-next-line no-console
    console.log('[sendDailyReportsToSuperAdmins] Daily reports sent successfully');
  } catch (error) {
    console.error('[sendDailyReportsToSuperAdmins] Error:', error);
    throw error;
  }
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

