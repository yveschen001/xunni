import type { Env, TelegramMessage } from '~/types';
import { createTelegramService } from '~/services/telegram';

export async function handleHelp(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // Get user and i18n
    const { createDatabaseClient } = await import('~/db/client');
    const { findUserByTelegramId } = await import('~/db/queries/users');
    const db = createDatabaseClient(env.DB);
    const user = await findUserByTelegramId(db, telegramId);
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    // Check user role using new admin system
    const { getAdminIds, isSuperAdmin } = await import('./admin_ban');
    const adminIds = getAdminIds(env);
    const isUserSuperAdmin = isSuperAdmin(telegramId, env);
    const isUserAdmin = adminIds.includes(telegramId);

    // Base commands for all users
    let helpMessage =
      i18n.t('help.text10') +
      '\n\n' +
      i18n.t('help.text24') +
      i18n.t('help.register') +
      i18n.t('help.text25') +
      i18n.t('help.bottle7') +
      i18n.t('help.bottle8') +
      i18n.t('help.conversation') +
      i18n.t('help.profile3') +
      i18n.t('help.profile2') +
      i18n.t('help.text5') +
      i18n.t('help.profile') +
      i18n.t('help.text2') +
      i18n.t('help.mbti2') +
      i18n.t('help.stats') +
      i18n.t('help.vip4') +
      i18n.t('help.text16') +
      i18n.t('help.bottle2') +
      i18n.t('help.invite2') +
      i18n.t('help.vip5') +
      i18n.t('help.ad3') +
      i18n.t('help.ad4') +
      i18n.t('help.appeal5') +
      i18n.t('help.text18') +
      i18n.t('help.report') +
      i18n.t('help.ban5') +
      i18n.t('help.appeal3') +
      '\n/settings - ' + i18n.t('menu.settings') + '\n' + // Explicitly add settings command
      i18n.t('help.settings2') +
      i18n.t('help.text19') +
      i18n.t('help.text17');

    // Add admin commands (for both regular admin and super admin)
    if (isUserAdmin) {
      helpMessage +=
        `\n\n━━━━━━━━━━━━━━━━\n` +
        i18n.t('help.admin5') +
        i18n.t('help.text31') +
        i18n.t('help.ban') +
        i18n.t('help.ban3') +
        i18n.t('help.ban4') +
        i18n.t('help.ban2') +
        i18n.t('help.appeal6') +
        i18n.t('help.appeal4') +
        i18n.t('help.appeal2') +
        i18n.t('help.appeal') +
        i18n.t('help.broadcast5') +
        i18n.t('help.broadcast4') +
        i18n.t('help.broadcast') +
        i18n.t('help.broadcast2') +
        i18n.t('help.broadcast3') +
        i18n.t('help.cancel') +
        i18n.t('help.text32') +
        i18n.t('help.text') +
        // i18n.t('help.admin_ads') +
        // i18n.t('help.admin_tasks') +
        (i18n.t('help.admin_ads').startsWith('[') ? '\n/admin_ads - 管理官方廣告 (含新增)' : i18n.t('help.admin_ads')) +
        (i18n.t('help.admin_tasks').startsWith('[') ? '\n/admin_tasks - 管理社群任務 (含新增)' : i18n.t('help.admin_tasks')) +
        '\n\n/admin_report - ' +
        i18n.t('help.dailyReportTitle') +
        '\n/admin_report_test - ' +
        i18n.t('admin.ban.testDailyReport') + 
        '\n/admin_test_retention_push - ' +
        i18n.t('admin.ban.testRetentionPush') + 
        '\n/admin_test_match_push - ' +
        i18n.t('admin.ban.testMatchPush'); 
    }

    // Add super admin commands (only for super admin)
    if (isUserSuperAdmin) {
      helpMessage +=
        `\n\n━━━━━━━━━━━━━━━━\n` +
        '👑 ' +
        i18n.t('help.superAdminTitle') + // CSV: 🔱 **超級管理員功能**
        '\n' +
        '/analytics - ' +
        (i18n.t('admin.analyticsTitle').startsWith('[') ? '每日運營報表' : i18n.t('admin.analyticsTitle')) +
        '\n' +
        '/ad_performance - ' +
        (i18n.t('admin.adPerformanceTitle').startsWith('[') ? '廣告效果報表' : i18n.t('admin.adPerformanceTitle')) +
        '\n' +
        '/vip_funnel - ' +
        (i18n.t('admin.vipFunnelTitle').startsWith('[') ? 'VIP 轉化漏斗' : i18n.t('admin.vipFunnelTitle')) +
        '\n' +
        '\n' +
        i18n.t('help.superAdminMaintenance') + // CSV: **系統維護**
        '\n' + i18n.t('help.superAdminMaintenanceDisable') + // CSV: /maintenance_disable - ... (Includes command!)
        '\n' + i18n.t('help.superAdminMaintenanceEnable'); // CSV: /maintenance_enable ... (Includes command!)
        // Note: maintenance2/3/4 in code were manual strings. CSV has full lines for these.
    }

    await telegram.sendMessage(chatId, helpMessage, { parse_mode: undefined }); // Force plain text
  } catch (error) {
    console.error('Error handling help:', error);
    // Fallback if DB fails
    await telegram.sendMessage(chatId, 'System error. Please try again later.');
  }
}
