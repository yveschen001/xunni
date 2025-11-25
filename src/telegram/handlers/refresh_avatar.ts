/**
 * Refresh Avatar Handler
 *
 * Allows users to manually refresh their cached avatar
 */

import type { Env } from '~/types';
import type { DatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { getAvatarUrlWithCache } from '~/services/avatar';
import { updateUserActivity } from '~/services/user_activity';
import { createI18n } from '~/i18n';

/**
 * Handle /refresh_avatar command
 */
export async function handleRefreshAvatar(
  db: DatabaseClient,
  env: Env,
  chatId: number,
  telegramId: string
): Promise<void> {
  const telegram = createTelegramService(env);

  try {
    // Update user activity
    await updateUserActivity(db, telegramId);

    // Get user info
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    if (!user) {
      await telegram.sendMessage(chatId, i18n.t('refreshAvatar.userNotFound'));
      return;
    }

    // Send processing message
    const processingMsg = await telegram.sendMessage(chatId, i18n.t('refreshAvatar.processing'));

    // Check VIP status
    const isVip = !!(
      user.is_vip &&
      user.vip_expire_at &&
      new Date(user.vip_expire_at) > new Date()
    );

    // Force refresh avatar
    await getAvatarUrlWithCache(
      db,
      env,
      telegramId,
      isVip,
      user.gender || undefined,
      true // Force refresh
    );

    // Delete processing message
    await telegram.deleteMessage(chatId, processingMsg.message_id);

    // Send success message
    await telegram.sendMessage(chatId, i18n.t('refreshAvatar.success'), {
      parse_mode: 'Markdown',
    });
  } catch (error) {
    console.error('[RefreshAvatar] Error:', error);
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.sendMessage(chatId, i18n.t('refreshAvatar.failed'));
  }
}
