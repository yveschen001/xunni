/**
 * Conversation Actions Handler
 * 
 * Handles quick actions during conversations (profile view, block, report, end).
 */

import type { Env } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { getConversationById, endConversation } from '~/db/queries/conversations';
import { getOtherUserId } from '~/domain/conversation';

/**
 * Show anonymous profile card
 */
export async function handleConversationProfile(
  callbackQuery: any,
  conversationId: number,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Get conversation
    const conversation = await getConversationById(db, conversationId);
    if (!conversation) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 對話不存在');
      return;
    }

    // Get other user ID
    const otherUserId = getOtherUserId(conversation, telegramId);
    if (!otherUserId) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 對話資訊錯誤');
      return;
    }

    // Get other user info
    const otherUser = await findUserByTelegramId(db, otherUserId);
    if (!otherUser) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 用戶不存在');
      return;
    }

    await telegram.answerCallbackQuery(callbackQuery.id);

    // Calculate age
    const birthDate = new Date(otherUser.birthday);
    const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    const ageRange = `${Math.floor(age / 5) * 5}-${Math.floor(age / 5) * 5 + 4}`;

    // Build anonymous profile card
    let profileMessage = '👤 **對方的資料卡**\n\n';
    profileMessage += `━━━━━━━━━━━━━━━━\n`;
    profileMessage += `🧠 MBTI：${otherUser.mbti || '未設定'}\n`;
    profileMessage += `⭐ 星座：${otherUser.zodiac || '未設定'}\n`;
    profileMessage += `👤 性別：${otherUser.gender === 'male' ? '男' : otherUser.gender === 'female' ? '女' : '未設定'}\n`;
    profileMessage += `🎂 年齡範圍：${ageRange} 歲\n`;
    
    if (otherUser.region) {
      profileMessage += `🌍 地區：${otherUser.region}\n`;
    }
    
    profileMessage += `━━━━━━━━━━━━━━━━\n\n`;
    profileMessage += `💡 這是匿名資料卡，不會顯示對方的真實身份資訊。`;

    await telegram.sendMessage(chatId, profileMessage);
  } catch (error) {
    console.error('[handleConversationProfile] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle conversation block
 */
export async function handleConversationBlock(
  callbackQuery: any,
  conversationId: number,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;

  try {
    await telegram.answerCallbackQuery(callbackQuery.id);

    // Show confirmation
    await telegram.sendMessageWithButtons(
      chatId,
      '🚫 **確定要封鎖這位用戶嗎？**\n\n' +
        '封鎖後：\n' +
        '• 對方無法再向你發送訊息\n' +
        '• 你們不會再被匹配到\n' +
        '• 此對話將立即結束\n\n' +
        '💡 這不會舉報對方，只是不想再聊天。',
      [
        [
          { text: '✅ 確定封鎖', callback_data: `conv_block_confirm_${conversationId}` },
          { text: '❌ 取消', callback_data: 'conv_cancel' },
        ],
      ]
    );
  } catch (error) {
    console.error('[handleConversationBlock] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle conversation report
 */
export async function handleConversationReport(
  callbackQuery: any,
  conversationId: number,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;

  try {
    await telegram.answerCallbackQuery(callbackQuery.id);

    // Show confirmation
    await telegram.sendMessageWithButtons(
      chatId,
      '🚨 **確定要舉報這位用戶嗎？**\n\n' +
        '舉報後：\n' +
        '• 我們會審核此用戶的行為\n' +
        '• 多次被舉報會導致封禁\n' +
        '• 此對話將立即結束\n' +
        '• 24小時內不會再匹配到此用戶\n\n' +
        '💡 請確保對方確實有不當行為。',
      [
        [
          { text: '✅ 確定舉報', callback_data: `conv_report_confirm_${conversationId}` },
          { text: '❌ 取消', callback_data: 'conv_cancel' },
        ],
      ]
    );
  } catch (error) {
    console.error('[handleConversationReport] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle conversation end
 */
export async function handleConversationEnd(
  callbackQuery: any,
  conversationId: number,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;

  try {
    await telegram.answerCallbackQuery(callbackQuery.id);

    // Show confirmation
    await telegram.sendMessageWithButtons(
      chatId,
      '❌ **確定要結束這個對話嗎？**\n\n' +
        '結束後：\n' +
        '• 雙方都無法再發送訊息\n' +
        '• 聊天記錄會被保存\n' +
        '• 可以使用 /catch 開始新對話\n\n' +
        '💡 如果對方有不當行為，建議使用「舉報」功能。',
      [
        [
          { text: '✅ 確定結束', callback_data: `conv_end_confirm_${conversationId}` },
          { text: '❌ 取消', callback_data: 'conv_cancel' },
        ],
      ]
    );
  } catch (error) {
    console.error('[handleConversationEnd] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Confirm conversation end
 */
export async function handleConversationEndConfirm(
  callbackQuery: any,
  conversationId: number,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Get conversation
    const conversation = await getConversationById(db, conversationId);
    if (!conversation) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 對話不存在');
      return;
    }

    // End conversation
    await endConversation(db, conversationId);

    await telegram.answerCallbackQuery(callbackQuery.id, '✅ 對話已結束');
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Notify both users
    await telegram.sendMessage(
      chatId,
      '✅ **對話已結束**\n\n' +
        '感謝你的參與！\n\n' +
        '💡 想要開始新的對話嗎？\n' +
        '• 使用 /catch 撿起新的漂流瓶\n' +
        '• 使用 /throw 丟出自己的漂流瓶'
    );

    // Notify other user
    const otherUserId = getOtherUserId(conversation, telegramId);
    if (otherUserId) {
      await telegram.sendMessage(
        parseInt(otherUserId),
        '💬 **對話已結束**\n\n' +
          '對方結束了這個對話。\n\n' +
          '💡 想要開始新的對話嗎？\n' +
          '• 使用 /catch 撿起新的漂流瓶\n' +
          '• 使用 /throw 丟出自己的漂流瓶'
      );
    }
  } catch (error) {
    console.error('[handleConversationEndConfirm] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Confirm block
 */
export async function handleConversationBlockConfirm(
  callbackQuery: any,
  conversationId: number,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Get conversation
    const conversation = await getConversationById(db, conversationId);
    if (!conversation) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 對話不存在');
      return;
    }

    // Get other user ID
    const otherUserId = getOtherUserId(conversation, telegramId);
    if (!otherUserId) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 對話資訊錯誤');
      return;
    }

    // Create block record
    await db.d1.prepare(`
      INSERT INTO user_blocks (blocker_id, blocked_id, conversation_id, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).bind(telegramId, otherUserId, conversationId).run();

    // End conversation
    await endConversation(db, conversationId);

    await telegram.answerCallbackQuery(callbackQuery.id, '✅ 已封鎖');
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    await telegram.sendMessage(
      chatId,
      '✅ **已封鎖此用戶**\n\n' +
        '對方已被封鎖，你們不會再被匹配到。\n\n' +
        '💡 想要開始新的對話嗎？\n' +
        '• 使用 /catch 撿起新的漂流瓶'
    );

    // Notify other user (without revealing block)
    await telegram.sendMessage(
      parseInt(otherUserId),
      '💬 **對話已結束**\n\n' +
        '對方結束了這個對話。\n\n' +
        '💡 想要開始新的對話嗎？\n' +
        '• 使用 /catch 撿起新的漂流瓶'
    );
  } catch (error) {
    console.error('[handleConversationBlockConfirm] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Confirm report
 */
export async function handleConversationReportConfirm(
  callbackQuery: any,
  conversationId: number,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Get conversation
    const conversation = await getConversationById(db, conversationId);
    if (!conversation) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 對話不存在');
      return;
    }

    // Get other user ID
    const otherUserId = getOtherUserId(conversation, telegramId);
    if (!otherUserId) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 對話資訊錯誤');
      return;
    }

    // Create report record
    await db.d1.prepare(`
      INSERT INTO reports (
        reporter_id,
        target_id,
        conversation_id,
        reason,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, 'pending', datetime('now'))
    `).bind(telegramId, otherUserId, conversationId, 'inappropriate_content').run();

    // End conversation
    await endConversation(db, conversationId);

    await telegram.answerCallbackQuery(callbackQuery.id, '✅ 已舉報');
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    await telegram.sendMessage(
      chatId,
      '✅ **已舉報此用戶**\n\n' +
        '感謝你的舉報，我們會盡快審核。\n\n' +
        '💡 想要開始新的對話嗎？\n' +
        '• 使用 /catch 撿起新的漂流瓶'
    );

    // Notify other user (without revealing report)
    await telegram.sendMessage(
      parseInt(otherUserId),
      '💬 **對話已結束**\n\n' +
        '對方結束了這個對話。\n\n' +
        '💡 想要開始新的對話嗎？\n' +
        '• 使用 /catch 撿起新的漂流瓶'
    );
  } catch (error) {
    console.error('[handleConversationReportConfirm] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Cancel action
 */
export async function handleConversationCancel(
  callbackQuery: any,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;

  try {
    await telegram.answerCallbackQuery(callbackQuery.id, '已取消');
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);
  } catch (error) {
    console.error('[handleConversationCancel] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

