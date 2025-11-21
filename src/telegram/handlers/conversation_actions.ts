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
import { maskNickname } from '~/domain/invite';

/**
 * Show anonymous profile card
 */
export async function handleConversationProfile(
  callbackQuery: any,
  conversationId: number,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
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
    
    // Get viewer's VIP status
    const viewer = await findUserByTelegramId(db, telegramId);
    const isVip = !!(
      viewer?.is_vip &&
      viewer.vip_expire_at &&
      new Date(viewer.vip_expire_at) > new Date()
    );
    
    // Get partner's avatar URL (clear for VIP, blurred for free users)
    const { getAvatarUrlWithCache } = await import('~/services/avatar');
    const partnerAvatarUrl = await getAvatarUrlWithCache(
      db,
      env,
      otherUserId,
      isVip,  // VIP gets original, free users get blurred
      otherUser.gender || undefined,
      false  // Don't force refresh
    );

    // Calculate age
    const birthDate = otherUser.birthday ? new Date(otherUser.birthday) : null;
    let ageRange = '未設定';
    if (birthDate && !Number.isNaN(birthDate.getTime())) {
      const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      ageRange = `${Math.floor(age / 5) * 5}-${Math.floor(age / 5) * 5 + 4}`;
    }

    const nickname = maskNickname(otherUser.nickname || otherUser.username || '匿名');
    const languageLabel = otherUser.language_pref || '未設定';
    const zodiacLabel = otherUser.zodiac_sign || 'Virgo';

    // Get blood type display
    const { getBloodTypeDisplay } = await import('~/domain/blood_type');
    const bloodTypeText = getBloodTypeDisplay(otherUser.blood_type as any);

    // Format nickname with country flag
    const { formatNicknameWithFlag } = await import('~/utils/country_flag');
    const displayNickname = formatNicknameWithFlag(nickname, otherUser.country_code);
    
    // Build anonymous profile card
    let profileMessage = '👤 **對方的資料卡**\n\n';
    profileMessage += `━━━━━━━━━━━━━━━━\n`;
    profileMessage += `📝 暱稱：${displayNickname}\n`;
    profileMessage += `🗣️ 語言：${languageLabel}\n`;
    profileMessage += `🧠 MBTI：${otherUser.mbti_result || '未設定'}\n`;
    profileMessage += `⭐ 星座：${zodiacLabel}\n`;
    profileMessage += `🩸 血型：${bloodTypeText}\n`;
    profileMessage += `👤 性別：${otherUser.gender === 'male' ? '男' : otherUser.gender === 'female' ? '女' : '未設定'}\n`;
    profileMessage += `🎂 年齡範圍：${ageRange} 歲\n`;

    if (otherUser.city) {
      profileMessage += `🌍 地區：${otherUser.city}\n`;
    }

    if (otherUser.interests) {
      profileMessage += `🏷️ 興趣：${otherUser.interests}\n`;
    }

    if (otherUser.bio) {
      profileMessage += `📖 簡介：${otherUser.bio}\n`;
    }

    profileMessage += `━━━━━━━━━━━━━━━━\n\n`;
    profileMessage += `💡 這是匿名資料卡，不會顯示對方的真實身份資訊。\n\n`;
    
    // Add VIP hint for free users
    if (!isVip) {
      profileMessage += `🔒 升級 VIP 解鎖對方清晰頭像\n`;
      profileMessage += `💎 使用 /vip 了解更多\n\n`;
    }
    
    profileMessage += `💬 直接按 /reply 回覆訊息聊天\n`;
    profileMessage += `✏️ 編輯個人資料：/edit_profile\n`;
    profileMessage += `🏠 返回主選單：/menu`;

    // Send with avatar if available
    if (partnerAvatarUrl && !partnerAvatarUrl.includes('default-avatar')) {
      try {
        await telegram.sendPhoto(chatId, partnerAvatarUrl, {
          caption: profileMessage,
          parse_mode: 'Markdown'  // Enable Markdown to show bold text and emojis properly
        });
      } catch (photoError) {
        console.error('[handleConversationProfile] Failed to send photo, falling back to text:', photoError);
        // Fallback to text message
        await telegram.sendMessage(chatId, profileMessage);
      }
    } else {
      // No avatar, send as text
      await telegram.sendMessage(chatId, profileMessage);
    }
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
/**
 * Confirm block
 */
export async function handleConversationBlockConfirm(
  callbackQuery: any,
  conversationId: number,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
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
    await db.d1
      .prepare(
        `
      INSERT INTO user_blocks (blocker_telegram_id, blocked_telegram_id, conversation_id, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `
      )
      .bind(telegramId, otherUserId, conversationId)
      .run();

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
  const db = createDatabaseClient(env.DB);
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
    await db.d1
      .prepare(
        `
      INSERT INTO reports (
        reporter_telegram_id,
        reported_telegram_id,
        conversation_id,
        reason,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, 'pending', datetime('now'))
    `
      )
      .bind(telegramId, otherUserId, conversationId, 'inappropriate_content')
      .run();

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
export async function handleConversationCancel(callbackQuery: any, env: Env): Promise<void> {
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
