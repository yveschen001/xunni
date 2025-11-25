/**
 * Refresh Conversation History Service
 *
 * Handles refreshing conversation history posts when user upgrades to VIP
 */

import type { Env } from '~/types';
import type { DatabaseClient } from '~/db/client';
import { createTelegramService } from './telegram';
import { buildHistoryPostContent } from '~/domain/conversation_history';
import { maskNickname } from '~/domain/invite';

/**
 * Refresh all conversation history posts for a user
 * Called when user upgrades to VIP to show clear avatars
 */
export async function refreshAllConversationHistoryPosts(
  db: DatabaseClient,
  env: Env,
  userId: string
): Promise<{ updated: number; failed: number }> {
  const telegram = createTelegramService(env);
  let updated = 0;
  let failed = 0;

  try {
    console.error('[RefreshHistory] Starting refresh for user:', userId);

    // Get user info
    const { findUserByTelegramId } = await import('~/db/queries/users');
    const user = await findUserByTelegramId(db, userId);

    if (!user) {
      console.error('[RefreshHistory] User not found:', userId);
      return { updated: 0, failed: 0 };
    }

    // Check VIP status
    const isVip = !!(
      user.is_vip &&
      user.vip_expire_at &&
      new Date(user.vip_expire_at) > new Date()
    );

    // Get all latest history posts for this user
    const historyPosts = await db.d1
      .prepare(
        `SELECT chp.*, c.user_a_telegram_id, c.user_b_telegram_id
         FROM conversation_history_posts chp
         JOIN conversations c ON chp.conversation_id = c.id
         WHERE chp.user_telegram_id = ? AND chp.is_latest = 1
         ORDER BY chp.updated_at DESC`
      )
      .bind(userId)
      .all<{
        id: number;
        conversation_id: number;
        user_telegram_id: string;
        identifier: string;
        post_number: number;
        telegram_message_id: number;
        content: string;
        user_a_telegram_id: string;
        user_b_telegram_id: string;
      }>();

    if (!historyPosts.results || historyPosts.results.length === 0) {
      console.error('[RefreshHistory] No history posts found for user:', userId);
      return { updated: 0, failed: 0 };
    }

    console.error(`[RefreshHistory] Found ${historyPosts.results.length} history posts to refresh`);

    // Refresh each history post
    for (const post of historyPosts.results) {
      try {
        // Determine partner ID
        const partnerId =
          post.user_a_telegram_id === userId ? post.user_b_telegram_id : post.user_a_telegram_id;

        // Get partner info
        const partner = await findUserByTelegramId(db, partnerId);

        if (!partner) {
          console.error('[RefreshHistory] Partner not found:', partnerId);
          failed++;
          continue;
        }

        // Get partner's avatar file_id for sending photo
        console.error('[RefreshHistory] Getting avatar for partner:', partnerId, 'VIP:', isVip);

        // Get avatar cache to access file_id
        const { getUserAvatarCache } = await import('~/services/avatar');
        const avatarCache = await getUserAvatarCache(db, partnerId);
        const partnerAvatarFileId = avatarCache?.fileId || null;

        console.error(
          '[RefreshHistory] Got avatar file_id:',
          partnerAvatarFileId?.substring(0, 50)
        );

        // Parse existing content to extract messages
        const { extractMessages } = await import('~/domain/conversation_history');
        const messages = extractMessages(post.content);

        // Rebuild content with partner info
        const { formatNicknameWithFlag } = await import('~/utils/country_flag');
        const { createI18n } = await import('~/i18n');
        const i18n = createI18n(user.language_pref || 'zh-TW');
        const partnerInfo = {
          maskedNickname: formatNicknameWithFlag(
            maskNickname(partner.nickname || partner.username || i18n.t('common.anonymous')),
            partner.country_code
          ),
          mbti: partner.mbti_result || i18n.t('common.notSet'),
          bloodType: partner.blood_type || i18n.t('common.notSet'),
          zodiac: partner.zodiac_sign || 'Virgo',
        };

        const newContent = buildHistoryPostContent(
          post.identifier,
          post.post_number,
          messages,
          messages.length,
          partnerInfo,
          isVip, // Use current VIP status for VIP hint
          i18n
        );

        // Delete old message
        try {
          await telegram.deleteMessage(parseInt(userId), post.telegram_message_id);
        } catch (deleteError) {
          console.error('[RefreshHistory] Failed to delete old message:', deleteError);
          // Continue anyway, will send new message
        }

        // Send new message with updated avatar
        let newMessageId: number;

        console.error(
          '[RefreshHistory] Preparing to send message. Avatar file_id:',
          partnerAvatarFileId?.substring(0, 50)
        );

        if (partnerAvatarFileId) {
          // Send with photo using file_id
          try {
            console.error('[RefreshHistory] Sending photo message with file_id...');
            const sentMessage = await telegram.sendPhoto(parseInt(userId), partnerAvatarFileId, {
              caption: newContent,
              parse_mode: 'Markdown',
            });
            newMessageId = sentMessage.message_id;
            console.error('[RefreshHistory] Photo message sent successfully:', newMessageId);
          } catch (photoError) {
            console.error(
              '[RefreshHistory] Failed to send photo, falling back to text:',
              photoError
            );
            // Fallback to text
            const sentMessage = await telegram.sendMessageAndGetId(parseInt(userId), newContent);
            newMessageId = sentMessage.message_id;
            console.error('[RefreshHistory] Text message sent successfully:', newMessageId);
          }
        } else {
          // Send as text (no avatar)
          console.error('[RefreshHistory] Sending text message (no avatar file_id)...');
          const sentMessage = await telegram.sendMessageAndGetId(parseInt(userId), newContent);
          newMessageId = sentMessage.message_id;
          console.error('[RefreshHistory] Text message sent successfully:', newMessageId);
        }

        // Update database with new message ID
        // Note: We keep partner_avatar_url as NULL since we're using file_id for sending
        await db.d1
          .prepare(
            `UPDATE conversation_history_posts 
             SET telegram_message_id = ?, 
                 content = ?, 
                 partner_avatar_url = NULL,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`
          )
          .bind(newMessageId, newContent, post.id)
          .run();

        console.error('[RefreshHistory] Successfully refreshed post:', post.id);
        updated++;

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error('[RefreshHistory] Failed to refresh post:', post.id, error);
        failed++;
      }
    }

    console.error(`[RefreshHistory] Completed: ${updated} updated, ${failed} failed`);
    return { updated, failed };
  } catch (error) {
    console.error('[RefreshHistory] Error:', error);
    return { updated, failed };
  }
}

/**
 * Refresh conversation history in background (non-blocking)
 */
export async function refreshConversationHistoryInBackground(
  db: DatabaseClient,
  env: Env,
  userId: string
): Promise<void> {
  // Run in background, don't block
  refreshAllConversationHistoryPosts(db, env, userId)
    .then((result) => {
      console.log(
        `[RefreshHistoryBg] Successfully refreshed ${result.updated} posts for user ${userId}`
      );
    })
    .catch((error) => {
      console.error(`[RefreshHistoryBg] Failed to refresh posts for user ${userId}:`, error);
    });
}
