/**
 * Admin Test Refresh Handler
 *
 * Test refresh for a specific user
 */

import type { Env } from '~/types';
import type { DatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { createI18n } from '~/i18n';
import { refreshAllConversationHistoryPosts } from '~/services/refresh_conversation_history';

/**
 * Handle /admin_test_refresh command
 */
export async function handleAdminTestRefresh(
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

    await telegram.sendMessage(chatId, i18n.t('admin.refresh.startingRefresh'));

    console.error('[AdminTestRefresh] Starting refresh for user:', telegramId);

    const result = await refreshAllConversationHistoryPosts(db, env, telegramId);

    console.error('[AdminTestRefresh] Refresh completed:', result);

    await telegram.sendMessage(
      chatId,
      i18n.t('admin.refresh.complete') + '\n\n' +
        i18n.t('admin.refresh.updated', { count: result.updated }) + '\n' +
        i18n.t('admin.refresh.failed', { count: result.failed }) + '\n\n' +
        i18n.t('admin.refresh.checkHint'),
      {
        parse_mode: 'Markdown',
      }
    );
  } catch (error) {
    console.error('[AdminTestRefresh] Error:', error);
    await telegram.sendMessage(
      chatId,
      i18n.t('admin.refresh.failed') + '\n\n' + i18n.t('admin.refresh.error', { error: error instanceof Error ? error.message : String(error) })
    );
  }
}
