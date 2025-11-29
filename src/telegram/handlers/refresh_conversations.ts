/**
 * Refresh Conversations Handler
 *
 * Allows users to manually refresh all conversation history posts
 */

import type { Env } from '~/types';
import type { DatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { refreshAllConversationHistoryPosts } from '~/services/refresh_conversation_history';
import { updateUserActivity } from '~/services/user_activity';
import { createI18n } from '~/i18n';

/**
 * Handle /refresh_conversations command
 */
export async function handleRefreshConversations(
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
      await telegram.sendMessage(chatId, i18n.t('refreshConversations.userNotFound'));
      return;
    }

    // Send processing message
    const processingMsg = await telegram.sendMessage(
      chatId,
      i18n.t('refreshConversations.processing')
    );

    // Refresh all conversation history posts
    const result = await refreshAllConversationHistoryPosts(db, env, telegramId);

    // Delete processing message
    await telegram.deleteMessage(chatId, processingMsg.message_id);

    // Send result message
    if (result.updated === 0 && result.failed === 0) {
      await telegram.sendMessage(chatId, i18n.t('refreshConversations.noHistory'));
    } else if (result.failed === 0) {
      await telegram.sendMessage(
        chatId,
        i18n.t('refreshConversations.success', { updated: result.updated }),
        {
          parse_mode: 'Markdown',
        }
      );
    } else {
      await telegram.sendMessage(
        chatId,
        i18n.t('refreshConversations.partialSuccess', {
          updated: result.updated,
          failed: result.failed,
        }),
        {
          parse_mode: 'Markdown',
        }
      );
    }
  } catch (error) {
    console.error('[RefreshConversations] Error:', error);
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.sendMessage(chatId, i18n.t('refreshConversations.failed'));
  }
}
