/**
 * Admin Avatar Diagnosis Handler
 *
 * Diagnose avatar and conversation history status for a user
 */

import type { Env } from '~/types';
import type { DatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { createI18n } from '~/i18n';

/**
 * Handle /admin_diagnose_avatar command
 */
export async function handleAdminDiagnoseAvatar(
  db: DatabaseClient,
  env: Env,
  chatId: number,
  telegramId: string,
  targetUserId?: string
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

    // Use target user ID or self
    const userId = targetUserId || telegramId;

    // Get user info
    const { findUserByTelegramId } = await import('~/db/queries/users');
    const user = await findUserByTelegramId(db, userId);

    if (!user) {
      await telegram.sendMessage(chatId, i18n.t('admin.userNotFound', { userId }));
      return;
    }

    // Check VIP status
    const isVip = !!(
      user.is_vip &&
      user.vip_expire_at &&
      new Date(user.vip_expire_at) > new Date()
    );

    // Get conversation history posts
    const historyPosts = await db.d1
      .prepare(
        `SELECT chp.id, chp.conversation_id, chp.identifier, chp.post_number, 
                chp.is_latest, chp.created_with_vip_status, chp.partner_avatar_url,
                chp.created_at, chp.updated_at
         FROM conversation_history_posts chp
         WHERE chp.user_telegram_id = ?
         ORDER BY chp.updated_at DESC
         LIMIT 10`
      )
      .bind(userId)
      .all<{
        id: number;
        conversation_id: number;
        identifier: string;
        post_number: number;
        is_latest: number;
        created_with_vip_status: number;
        partner_avatar_url: string | null;
        created_at: string;
        updated_at: string;
      }>();

    // Get avatar cache info
    const avatarInfo = await db.d1
      .prepare(
        `SELECT avatar_file_id, avatar_original_url, avatar_blurred_url, avatar_updated_at
         FROM users
         WHERE telegram_id = ?`
      )
      .bind(userId)
      .first<{
        avatar_file_id: string | null;
        avatar_original_url: string | null;
        avatar_blurred_url: string | null;
        avatar_updated_at: string | null;
      }>();

    // Build diagnosis message
    let message = i18n.t('admin.diagnose.title') + '\n\n';
    message += i18n.t('admin.diagnose.userInfo') + '\n';
    message += i18n.t('admin.diagnose.userId', { userId }) + '\n';
    message +=
      i18n.t('admin.diagnose.nickname', { nickname: user.nickname || i18n.t('common.notSet') }) +
      '\n';
    message +=
      i18n.t('admin.diagnose.username', {
        username: user.username || i18n.t('admin.diagnose.none'),
      }) + '\n';
    message +=
      i18n.t('admin.diagnose.vipStatus', {
        status: isVip ? i18n.t('admin.diagnose.yes') : i18n.t('admin.diagnose.no'),
      }) + '\n';

    if (user.vip_expire_at) {
      message +=
        i18n.t('admin.diagnose.vipExpire', {
          date: new Date(user.vip_expire_at).toLocaleString('zh-TW'),
        }) + '\n';
    }

    message += `\n` + i18n.t('admin.diagnose.avatarCache') + '\n';
    if (avatarInfo?.avatar_file_id) {
      message +=
        i18n.t('admin.diagnose.fileId', { fileId: avatarInfo.avatar_file_id.substring(0, 20) }) +
        '\n';
      message +=
        i18n.t('admin.diagnose.originalUrl', {
          status: avatarInfo.avatar_original_url ? '✅' : '❌',
        }) + '\n';
      message +=
        i18n.t('admin.diagnose.blurredUrl', {
          status: avatarInfo.avatar_blurred_url ? '✅' : '❌',
        }) + '\n';
      message +=
        i18n.t('admin.diagnose.updatedAt', {
          date: avatarInfo.avatar_updated_at
            ? new Date(avatarInfo.avatar_updated_at).toLocaleString('zh-TW')
            : i18n.t('admin.diagnose.unknown'),
        }) + '\n';
    } else {
      message += i18n.t('admin.diagnose.noCache') + '\n';
    }

    message += `\n` + i18n.t('admin.diagnose.historyPosts') + '\n';
    if (historyPosts.results && historyPosts.results.length > 0) {
      message +=
        i18n.t('admin.diagnose.totalPosts', { count: historyPosts.results.length }) + '\n\n';

      for (const post of historyPosts.results.slice(0, 5)) {
        message +=
          i18n.t('admin.diagnose.postTitle', {
            identifier: post.identifier,
            postNumber: post.post_number,
          }) + '\n';
        message += i18n.t('admin.diagnose.postId', { id: post.id }) + '\n';
        message +=
          i18n.t('admin.diagnose.isLatest', { status: post.is_latest ? '✅' : '❌' }) + '\n';
        message +=
          i18n.t('admin.diagnose.createdWithVip', {
            status: post.created_with_vip_status ? '✅' : '❌',
          }) + '\n';
        message +=
          i18n.t('admin.diagnose.hasAvatar', { status: post.partner_avatar_url ? '✅' : '❌' }) +
          '\n';
        message +=
          i18n.t('admin.diagnose.postUpdatedAt', {
            date: new Date(post.updated_at).toLocaleString('zh-TW', {
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            }),
          }) + '\n\n';
      }

      if (historyPosts.results.length > 5) {
        message +=
          i18n.t('admin.diagnose.morePosts', { count: historyPosts.results.length - 5 }) + '\n';
      }
    } else {
      message += i18n.t('admin.diagnose.noHistoryPosts') + '\n';
    }

    // Analysis
    message += `\n` + i18n.t('admin.diagnose.analysis') + '\n';

    if (!historyPosts.results || historyPosts.results.length === 0) {
      message += i18n.t('admin.diagnose.noHistoryPostsWarning') + '\n';
      message += i18n.t('admin.diagnose.historyPostsHint') + '\n';
    } else {
      const outdatedPosts = historyPosts.results.filter(
        (p) => p.is_latest && p.created_with_vip_status === 0 && isVip
      );

      if (outdatedPosts.length > 0) {
        message +=
          i18n.t('admin.diagnose.outdatedPostsFound', { count: outdatedPosts.length }) + '\n';
        message += i18n.t('admin.diagnose.refreshHint') + '\n';
      } else if (isVip) {
        message += i18n.t('admin.diagnose.allUpToDateVip') + '\n';
      } else {
        message += i18n.t('admin.diagnose.allUpToDateFree') + '\n';
      }
    }

    await telegram.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
    });
  } catch (error) {
    console.error('[AdminDiagnoseAvatar] Error:', error);
    await telegram.sendMessage(
      chatId,
      i18n.t('admin.diagnose.failed') +
        '\n\n' +
        i18n.t('admin.diagnose.error', {
          error: error instanceof Error ? error.message : String(error),
        })
    );
  }
}
