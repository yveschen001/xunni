/**
 * Conversation History Service
 *
 * Manages history posts and new message posts for conversations
 */

import type { DatabaseClient } from '~/db/client';
import type { Env } from '~/types';
import { createTelegramService } from './telegram';
import {
  getLatestHistoryPost,
  createHistoryPost,
  updateHistoryPost,
  getNewMessagePost,
  upsertNewMessagePost,
} from '~/db/queries/conversation_history_posts';
import {
  formatMessageEntry,
  buildHistoryPostContent,
  buildNewMessagePostContent,
  wouldExceedLimit,
  extractMessages,
} from '~/domain/conversation_history';

/**
 * Update history post with a new message
 */
export async function updateConversationHistory(
  db: DatabaseClient,
  env: Env,
  conversationId: number,
  userTelegramId: string,
  identifier: string,
  messageContent: string,
  messageTime: Date,
  direction: 'sent' | 'received',
  partnerInfo?: {
    partnerTelegramId: string;
    maskedNickname: string;
    mbti: string;
    bloodType: string;
    zodiac: string;
    matchScore?: number;
  }
): Promise<void> {
  const telegram = createTelegramService(env);

  console.error('[updateConversationHistory] Starting:', {
    conversationId,
    userTelegramId,
    identifier,
    direction,
    messageLength: messageContent.length,
  });

  try {
    // Get viewer (current user) to check VIP status
    const { findUserByTelegramId } = await import('~/db/queries/users');
    const viewer = await findUserByTelegramId(db, userTelegramId);
    const isVip = !!(
      viewer?.is_vip &&
      viewer.vip_expire_at &&
      new Date(viewer.vip_expire_at) > new Date()
    );

    // Get partner's avatar URL (only for first message) with smart caching
    let partnerAvatarUrl: string | null = null;

    if (partnerInfo?.partnerTelegramId) {
      const { getAvatarUrlWithCache } = await import('~/services/avatar');

      // Get partner's user info to determine gender
      const partner = await findUserByTelegramId(db, partnerInfo.partnerTelegramId);
      const partnerGender = partner?.gender || undefined;

      // Get avatar with smart caching (automatically handles updates)
      partnerAvatarUrl = await getAvatarUrlWithCache(
        db,
        env,
        partnerInfo.partnerTelegramId,
        isVip,
        partnerGender,
        false // Don't force refresh
      );

      console.error(
        '[updateConversationHistory] Partner avatar:',
        partnerAvatarUrl,
        'VIP:',
        isVip,
        'Gender:',
        partnerGender
      );
    }

    // Get latest history post
    const latestPost = await getLatestHistoryPost(db, conversationId, userTelegramId);
    console.error(
      '[updateConversationHistory] Latest post:',
      latestPost ? `Post #${latestPost.post_number}` : 'None'
    );

    // Get user for i18n (viewer already fetched above)
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(viewer?.language_pref || 'zh-TW');

    // Format new message entry
    const newMessageEntry = formatMessageEntry(messageTime, direction, messageContent, i18n);
    console.error('[updateConversationHistory] New entry:', newMessageEntry);

    // Build buttons
    const buttons = [
      [{ text: i18n.t('conversationHistory.replyButton'), callback_data: `conv_reply_${identifier}` }],
      [{ text: i18n.t('conversationHistory.viewAllConversations'), callback_data: 'chats' }],
    ];

    // Add ad/task button for non-VIP users
    if (!isVip && viewer) {
      const { getNextIncompleteTask } = await import('../telegram/handlers/tasks');
      const { getAdPrompt } = await import('~/domain/ad_prompt');
      const { getTodayAdReward } = await import('~/db/queries/ad_rewards');

      const nextTask = await getNextIncompleteTask(db, viewer);
      const adReward = await getTodayAdReward(db.d1, userTelegramId);

      const prompt = getAdPrompt(
        {
          user: viewer,
          ads_watched_today: adReward?.ads_watched || 0,
          has_incomplete_tasks: !!nextTask,
          next_task_name: nextTask?.name,
          next_task_id: nextTask?.id,
        },
        i18n
      );

      if (prompt.show_button) {
        buttons.push([{ text: prompt.button_text, callback_data: prompt.button_callback }]);
      }
    }

    if (!latestPost) {
      // No history post exists, create first one with avatar
      const messages = [newMessageEntry];
      const content = buildHistoryPostContent(identifier, 1, messages, 1, partnerInfo, isVip, i18n);

      // Send history post to user (with photo if avatar available)
      console.error('[updateConversationHistory] Creating first history post');
      let sentMessage;

      if (partnerAvatarUrl && !partnerAvatarUrl.startsWith('data:')) {
        // Send as photo message
        try {
          sentMessage = await telegram.sendPhoto(parseInt(userTelegramId), partnerAvatarUrl, {
            caption: content,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: buttons,
            },
          });
          console.error(
            '[updateConversationHistory] History post with photo sent:',
            sentMessage.message_id
          );
        } catch (photoError) {
          console.error(
            '[updateConversationHistory] Failed to send photo, falling back to text:',
            photoError
          );
          // Fallback to text message
          sentMessage = await telegram.sendMessageWithButtonsAndGetId(
            parseInt(userTelegramId),
            content,
            buttons
          );
        }
      } else {
        // Send as text message
        sentMessage = await telegram.sendMessageWithButtonsAndGetId(
          parseInt(userTelegramId),
          content,
          buttons
        );
        console.error('[updateConversationHistory] History post sent:', sentMessage.message_id);
      }

      // Save to database
      await createHistoryPost(
        db,
        conversationId,
        userTelegramId,
        identifier,
        1,
        sentMessage.message_id,
        content,
        content.length,
        1,
        partnerAvatarUrl,
        isVip
      );
      console.error('[updateConversationHistory] History post saved to DB');
    } else {
      // Check if adding new message would exceed limit
      if (wouldExceedLimit(latestPost.content, newMessageEntry)) {
        // Create new history post
        const messages = [newMessageEntry];
        const newPostNumber = latestPost.post_number + 1;
        const content = buildHistoryPostContent(
          identifier,
          newPostNumber,
          messages,
          latestPost.message_count + 1,
          partnerInfo,
          isVip,
          i18n
        );

        // Update old post to add "continue to next page" hint
        const oldContent = latestPost.content + '\n' + i18n.t('conversationHistory.continueView', { identifier, postNumber: newPostNumber });
        await telegram.editMessageText(
          parseInt(userTelegramId),
          latestPost.telegram_message_id,
          oldContent
        );
        await updateHistoryPost(
          db,
          latestPost.id,
          oldContent,
          oldContent.length,
          latestPost.message_count
        );

        // Send new history post
        const sentMessage = await telegram.sendMessageAndGetId(parseInt(userTelegramId), content);

        // Save to database
        await createHistoryPost(
          db,
          conversationId,
          userTelegramId,
          identifier,
          newPostNumber,
          sentMessage.message_id,
          content,
          content.length,
          latestPost.message_count + 1,
          partnerAvatarUrl,
          isVip
        );
      } else {
        // Check if VIP status has changed since post creation
        const vipStatusChanged = (latestPost.created_with_vip_status === 1) !== isVip;

        if (vipStatusChanged) {
          console.error(
            '[updateConversationHistory] VIP status changed! Refreshing post with new avatar...'
          );

          // VIP status changed - need to refresh the post with new avatar
          const messages = extractMessages(latestPost.content);
          messages.push(newMessageEntry);
          const newMessageCount = latestPost.message_count + 1;

          // Get fresh avatar with new VIP status
          if (partnerInfo?.partnerTelegramId) {
            const { getAvatarUrlWithCache } = await import('~/services/avatar');
            const partner = await findUserByTelegramId(db, partnerInfo.partnerTelegramId);
            const partnerGender = partner?.gender || undefined;

            partnerAvatarUrl = await getAvatarUrlWithCache(
              db,
              env,
              partnerInfo.partnerTelegramId,
              isVip,
              partnerGender,
              true // Force refresh to get new avatar
            );
          }

          const content = buildHistoryPostContent(
            identifier,
            latestPost.post_number,
            messages,
            newMessageCount,
            partnerInfo,
            isVip,
            i18n
          );

          // Delete old message and send new one with updated avatar
          try {
            await telegram.deleteMessage(parseInt(userTelegramId), latestPost.telegram_message_id);
          } catch (deleteError) {
            console.error('[updateConversationHistory] Failed to delete old message:', deleteError);
          }

          // Send new message with updated avatar
          let sentMessage;
          if (partnerAvatarUrl && !partnerAvatarUrl.startsWith('data:')) {
            try {
              sentMessage = await telegram.sendPhoto(parseInt(userTelegramId), partnerAvatarUrl, {
                caption: content,
                parse_mode: 'Markdown',
              });
            } catch (photoError) {
              console.error(
                '[updateConversationHistory] Failed to send photo, falling back to text:',
                photoError
              );
              sentMessage = await telegram.sendMessageAndGetId(parseInt(userTelegramId), content);
            }
          } else {
            sentMessage = await telegram.sendMessageAndGetId(parseInt(userTelegramId), content);
          }

          // Update database with new message ID and VIP status
          await db.d1
            .prepare(
              `UPDATE conversation_history_posts 
               SET telegram_message_id = ?, 
                   content = ?, 
                   char_count = ?, 
                   message_count = ?,
                   partner_avatar_url = ?,
                   created_with_vip_status = ?,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`
            )
            .bind(
              sentMessage.message_id,
              content,
              content.length,
              newMessageCount,
              partnerAvatarUrl || null,
              isVip ? 1 : 0,
              latestPost.id
            )
            .run();

          console.error('[updateConversationHistory] Post refreshed with new VIP status');
        } else {
          // VIP status unchanged - normal update
          console.error(
            '[updateConversationHistory] Updating existing post (VIP status unchanged)'
          );
          const messages = extractMessages(latestPost.content);
          console.error(
            '[updateConversationHistory] Extracted messages:',
            messages.length,
            'messages'
          );
          console.error(
            '[updateConversationHistory] Extracted messages content:',
            JSON.stringify(messages)
          );
          console.error(
            '[updateConversationHistory] Old content length:',
            latestPost.content.length
          );
          console.error('[updateConversationHistory] New message entry:', newMessageEntry);

          messages.push(newMessageEntry);
          console.error(
            '[updateConversationHistory] After adding new message:',
            messages.length,
            'messages'
          );
          console.error('[updateConversationHistory] All messages:', JSON.stringify(messages));

          const newMessageCount = latestPost.message_count + 1;
          const content = buildHistoryPostContent(
            identifier,
            latestPost.post_number,
            messages,
            newMessageCount,
            partnerInfo,
            isVip,
            i18n
          );
          console.error('[updateConversationHistory] New content length:', content.length);

          // Edit Telegram message
          try {
            if (
              latestPost.partner_avatar_url &&
              !latestPost.partner_avatar_url.startsWith('data:')
            ) {
              // It's a photo message, update caption
              await telegram.editMessageCaption(
                parseInt(userTelegramId),
                latestPost.telegram_message_id,
                content,
                {
                  reply_markup: {
                    inline_keyboard: buttons,
                  },
                }
              );
            } else {
              // It's a text message, update text
              await telegram.editMessageText(
                parseInt(userTelegramId),
                latestPost.telegram_message_id,
                content,
                {
                  reply_markup: {
                    inline_keyboard: buttons,
                  },
                }
              );
            }
            console.error('[updateConversationHistory] Telegram message edited');
          } catch (editError) {
            console.error('[updateConversationHistory] Failed to edit message:', editError);
          }

          // Update database
          await updateHistoryPost(db, latestPost.id, content, content.length, newMessageCount);
          console.error('[updateConversationHistory] Database updated');
        }
      }
    }
  } catch (error) {
    console.error('[updateConversationHistory] Error:', error);
    console.error('[updateConversationHistory] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      conversationId,
      userTelegramId,
      identifier,
    });
    // Don't throw - history post failure shouldn't break the main flow
  }
}

/**
 * Update new message post
 */
export async function updateNewMessagePost(
  db: DatabaseClient,
  env: Env,
  conversationId: number,
  userTelegramId: string,
  identifier: string,
  messageContent: string,
  messageTime: Date,
  partnerInfo?: {
    maskedNickname: string;
    mbti: string;
    bloodType: string;
    zodiac: string;
    matchScore?: number;
  }
): Promise<void> {
  const telegram = createTelegramService(env);

  try {
    // Get existing new message post
    const existingPost = await getNewMessagePost(db, conversationId, userTelegramId);

    // Delete old message if exists
    if (existingPost) {
      try {
        await telegram.deleteMessage(parseInt(userTelegramId), existingPost.telegram_message_id);
      } catch (error) {
        console.error('[updateNewMessagePost] Failed to delete old message:', error);
        // Continue anyway
      }
    }

    // Get user for i18n and VIP status
    const { findUserByTelegramId } = await import('~/db/queries/users');
    const { createI18n } = await import('~/i18n');
    const user = await findUserByTelegramId(db, userTelegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    const isVip = !!(
      user?.is_vip &&
      user?.vip_expire_at &&
      new Date(user.vip_expire_at) > new Date()
    );

    // Build new message content
    const content = buildNewMessagePostContent(
      identifier,
      messageContent,
      messageTime,
      conversationId,
      partnerInfo,
      i18n
    );

    // Build buttons based on VIP status
    const buttons = [
      [{ text: i18n.t('conversationHistory.replyButton'), callback_data: `conv_reply_${identifier}` }],
      [{ text: i18n.t('conversationHistory.viewProfileCard'), callback_data: `conv_profile_${conversationId}` }],
    ];

    // Add ad/task button for non-VIP users
    if (!isVip && user) {
      const { getNextIncompleteTask } = await import('../telegram/handlers/tasks');
      const { getAdPrompt } = await import('~/domain/ad_prompt');
      const { getTodayAdReward } = await import('~/db/queries/ad_rewards');

      const nextTask = await getNextIncompleteTask(db, user);
      const adReward = await getTodayAdReward(db.d1, userTelegramId);

      const prompt = getAdPrompt(
        {
          user,
          ads_watched_today: adReward?.ads_watched || 0,
          has_incomplete_tasks: !!nextTask,
          next_task_name: nextTask?.name,
          next_task_id: nextTask?.id,
        },
        i18n
      );

      if (prompt.show_button) {
        buttons.push([{ text: prompt.button_text, callback_data: prompt.button_callback }]);
      }
    }

    // Send new message with buttons
    const sentMessage = await telegram.sendMessageWithButtonsAndGetId(
      parseInt(userTelegramId),
      content,
      buttons
    );

    // Save to database
    await upsertNewMessagePost(
      db,
      conversationId,
      userTelegramId,
      identifier,
      sentMessage.message_id,
      messageContent,
      messageTime
    );
  } catch (error) {
    console.error('[updateNewMessagePost] Error:', error);
    // Don't throw - new message post failure shouldn't break the main flow
  }
}
