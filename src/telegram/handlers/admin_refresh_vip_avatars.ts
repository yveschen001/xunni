/**
 * Admin VIP Avatar Refresh Handler
 *
 * Allows super admin to batch refresh conversation history for VIP users
 */

import type { Env } from '~/types';
import type { DatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { createI18n } from '~/i18n';
import {
  refreshRecentVipAvatars,
  getVipAvatarRefreshStats,
} from '~/services/admin_refresh_vip_avatars';

/**
 * Handle /admin_refresh_vip_avatars command
 * Only accessible by super admin
 */
export async function handleAdminRefreshVipAvatars(
  db: DatabaseClient,
  env: Env,
  chatId: number,
  telegramId: string
): Promise<void> {
  const telegram = createTelegramService(env);

  try {
    const i18n = createI18n('zh-TW'); // Admin commands use Chinese
    // Check if user is super admin
    const superAdminId = env.SUPER_ADMIN_USER_ID;
    if (telegramId !== superAdminId) {
      await telegram.sendMessage(chatId, i18n.t('admin.insufficientPermission'));
      return;
    }

    // Get statistics first
    const stats = await getVipAvatarRefreshStats(db);

    if (stats.usersNeedingRefresh === 0) {
      await telegram.sendMessage(
        chatId,
        i18n.t('admin.refresh.noRefreshNeeded') + '\n\n' +
          i18n.t('admin.refresh.stats') + '\n' +
          i18n.t('admin.refresh.totalVipUsers', { count: stats.totalVipUsers }) + '\n' +
          i18n.t('admin.refresh.usersNeedingRefresh', { count: stats.usersNeedingRefresh }) + '\n' +
          i18n.t('admin.refresh.outdatedPosts', { count: stats.totalOutdatedPosts }) + '\n\n' +
          i18n.t('admin.refresh.allUpToDate'),
        {
          parse_mode: 'Markdown',
        }
      );
      return;
    }

    // Send initial message
    const initialMsg = await telegram.sendMessage(
      chatId,
      i18n.t('admin.refresh.startingBatchRefresh') + '\n\n' +
        i18n.t('admin.refresh.stats') + '\n' +
        i18n.t('admin.refresh.totalVipUsers', { count: stats.totalVipUsers }) + '\n' +
        i18n.t('admin.refresh.usersNeedingRefresh', { count: stats.usersNeedingRefresh }) + '\n' +
        i18n.t('admin.refresh.outdatedPosts', { count: stats.totalOutdatedPosts }) + '\n\n' +
        i18n.t('admin.refresh.processing'),
      {
        parse_mode: 'Markdown',
      }
    );

    // Perform batch refresh
    const startTime = Date.now();
    const results = await refreshRecentVipAvatars(db, env, 30); // Look back 30 days
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    // Delete initial message
    await telegram.deleteMessage(chatId, initialMsg.message_id);

    // Send detailed results
    let resultMessage = i18n.t('admin.refresh.batchComplete') + '\n\n';
    resultMessage += i18n.t('admin.refresh.duration', { duration }) + '\n\n';
    resultMessage += i18n.t('admin.refresh.summary') + '\n';
    resultMessage += i18n.t('admin.refresh.processedUsers', { count: results.totalUsers }) + '\n';
    resultMessage += i18n.t('admin.refresh.successUsers', { count: results.successUsers }) + '\n';
    resultMessage += i18n.t('admin.refresh.failedUsers', { count: results.failedUsers }) + '\n';
    resultMessage += i18n.t('admin.refresh.updatedPosts', { count: results.totalPostsUpdated }) + '\n';
    resultMessage += i18n.t('admin.refresh.failedPosts', { count: results.totalPostsFailed }) + '\n\n';

    if (results.details.length > 0) {
      resultMessage += i18n.t('admin.refresh.details') + '\n';
      for (const detail of results.details.slice(0, 10)) {
        // Show first 10
        const username = detail.username ? `@${detail.username}` : detail.userId;
        resultMessage += i18n.t('admin.refresh.userDetail', { username, updated: detail.postsUpdated, failed: detail.postsFailed }) + '\n';
      }

      if (results.details.length > 10) {
        resultMessage += i18n.t('admin.refresh.moreUsers', { count: results.details.length - 10 });
      }
    }

    await telegram.sendMessage(chatId, resultMessage, {
      parse_mode: 'Markdown',
    });
  } catch (error) {
    console.error('[AdminRefreshVipAvatars] Error:', error);
    await telegram.sendMessage(
      chatId,
      i18n.t('admin.refresh.failed') + '\n\n' +
        i18n.t('admin.refresh.errorOccurred') + '\n\n' +
        i18n.t('admin.refresh.error', { error: error instanceof Error ? error.message : String(error) })
    );
  }
}
