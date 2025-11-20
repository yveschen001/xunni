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
    // Get latest history post
    const latestPost = await getLatestHistoryPost(db, conversationId, userTelegramId);
    console.error(
      '[updateConversationHistory] Latest post:',
      latestPost ? `Post #${latestPost.post_number}` : 'None'
    );

    // Format new message entry
    const newMessageEntry = formatMessageEntry(messageTime, direction, messageContent);
    console.error('[updateConversationHistory] New entry:', newMessageEntry);

    if (!latestPost) {
      // No history post exists, create first one
      const messages = [newMessageEntry];
      const content = buildHistoryPostContent(identifier, 1, messages, 1, partnerInfo);

      // Send history post to user
      console.error('[updateConversationHistory] Creating first history post');
      const sentMessage = await telegram.sendMessageAndGetId(parseInt(userTelegramId), content);
      console.error('[updateConversationHistory] History post sent:', sentMessage.message_id);

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
        1
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
          partnerInfo
        );

        // Update old post to add "continue to next page" hint
        const oldContent = latestPost.content + `\n📜 繼續查看：#${identifier}-H${newPostNumber}`;
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
          latestPost.message_count + 1
        );
      } else {
        // Update existing post
        console.error('[updateConversationHistory] Updating existing post');
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
        console.error('[updateConversationHistory] Old content length:', latestPost.content.length);
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
          partnerInfo
        );
        console.error('[updateConversationHistory] New content length:', content.length);

        // Edit Telegram message
        await telegram.editMessageText(
          parseInt(userTelegramId),
          latestPost.telegram_message_id,
          content
        );
        console.error('[updateConversationHistory] Telegram message edited');

        // Update database
        await updateHistoryPost(db, latestPost.id, content, content.length, newMessageCount);
        console.error('[updateConversationHistory] Database updated');
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

    // Build new message content
    const content = buildNewMessagePostContent(
      identifier,
      messageContent,
      messageTime,
      conversationId,
      partnerInfo
    );

    // Send new message with button
    const sentMessage = await telegram.sendMessageWithButtonsAndGetId(
      parseInt(userTelegramId),
      content,
      [[{ text: '👤 查看對方資料卡', callback_data: `conv_profile_${conversationId}` }]]
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
