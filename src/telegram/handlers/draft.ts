/**
 * Draft Handler
 *
 * Handles draft-related callbacks.
 */

import type { Env } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { getDraft, deleteDraft, deleteUserDrafts } from '~/db/queries/drafts';

/**
 * Handle draft continue
 */
export async function handleDraftContinue(callbackQuery: any, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    await telegram.answerCallbackQuery(callbackQuery.id, '✅ 繼續編輯草稿');
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Get draft
    const draft = await getDraft(db, telegramId);
    if (!draft) {
      await telegram.sendMessage(chatId, '⚠️ 草稿不存在或已過期');
      return;
    }

    // Show draft content for editing
    await telegram.sendMessage(
      chatId,
      `📝 **草稿內容**\n\n` +
        `${draft.content}\n\n` +
        `━━━━━━━━━━━━━━━━\n\n` +
        `💡 你可以：\n` +
        `• 直接輸入新內容來替換草稿\n` +
        `• 使用 /throw 重新開始\n` +
        `• 發送草稿內容來丟出漂流瓶`
    );

    // Show send draft button
    await telegram.sendMessageWithButtons(chatId, '要直接發送這個草稿嗎？', [
      [
        { text: '✅ 發送草稿', callback_data: 'draft_send' },
        { text: '✏️ 修改內容', callback_data: 'draft_edit' },
      ],
      [{ text: '🗑️ 刪除草稿', callback_data: 'draft_delete' }],
    ]);
  } catch (error) {
    console.error('[handleDraftContinue] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle draft delete
 */
export async function handleDraftDelete(callbackQuery: any, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Delete draft
    await deleteUserDrafts(db, telegramId);

    await telegram.answerCallbackQuery(callbackQuery.id, '✅ 草稿已刪除');
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Show bottle creation UI
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      await telegram.sendMessage(chatId, '❌ 用戶不存在');
      return;
    }

    const isVip = !!(
      user.is_vip &&
      user.vip_expire_at &&
      new Date(user.vip_expire_at) > new Date()
    );

    if (isVip) {
      await telegram.sendMessageWithButtons(chatId, '🍾 丟漂流瓶\n\n你想要尋找什麼樣的聊天對象？', [
        [
          { text: '👨 男生', callback_data: 'throw_target_male' },
          { text: '👩 女生', callback_data: 'throw_target_female' },
        ],
        [{ text: '🌈 任何人都可以', callback_data: 'throw_target_any' }],
        [{ text: '⚙️ 進階篩選（MBTI/星座）', callback_data: 'throw_advanced' }],
      ]);
    } else {
      await telegram.sendMessageWithButtons(
        chatId,
        '🍾 丟漂流瓶\n\n' +
          '你想要尋找什麼樣的聊天對象？\n\n' +
          '💡 升級 VIP 可使用進階篩選（MBTI/星座）：/vip',
        [
          [
            { text: '👨 男生', callback_data: 'throw_target_male' },
            { text: '👩 女生', callback_data: 'throw_target_female' },
          ],
          [{ text: '🌈 任何人都可以', callback_data: 'throw_target_any' }],
        ]
      );
    }
  } catch (error) {
    console.error('[handleDraftDelete] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle draft new (start fresh)
 */
export async function handleDraftNew(callbackQuery: any, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Delete existing draft
    await deleteUserDrafts(db, telegramId);

    await telegram.answerCallbackQuery(callbackQuery.id, '✅ 開始新的漂流瓶');
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Show bottle creation UI
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      await telegram.sendMessage(chatId, '❌ 用戶不存在');
      return;
    }

    const isVip = !!(
      user.is_vip &&
      user.vip_expire_at &&
      new Date(user.vip_expire_at) > new Date()
    );

    if (isVip) {
      await telegram.sendMessageWithButtons(chatId, '🍾 丟漂流瓶\n\n你想要尋找什麼樣的聊天對象？', [
        [
          { text: '👨 男生', callback_data: 'throw_target_male' },
          { text: '👩 女生', callback_data: 'throw_target_female' },
        ],
        [{ text: '🌈 任何人都可以', callback_data: 'throw_target_any' }],
        [{ text: '⚙️ 進階篩選（MBTI/星座）', callback_data: 'throw_advanced' }],
      ]);
    } else {
      await telegram.sendMessageWithButtons(
        chatId,
        '🍾 丟漂流瓶\n\n' +
          '你想要尋找什麼樣的聊天對象？\n\n' +
          '💡 升級 VIP 可使用進階篩選（MBTI/星座）：/vip',
        [
          [
            { text: '👨 男生', callback_data: 'throw_target_male' },
            { text: '👩 女生', callback_data: 'throw_target_female' },
          ],
          [{ text: '🌈 任何人都可以', callback_data: 'throw_target_any' }],
        ]
      );
    }
  } catch (error) {
    console.error('[handleDraftNew] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle draft send
 */
export async function handleDraftSend(callbackQuery: any, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Get draft
    const draft = await getDraft(db, telegramId);
    if (!draft) {
      await telegram.answerCallbackQuery(callbackQuery.id, '⚠️ 草稿不存在或已過期');
      return;
    }

    await telegram.answerCallbackQuery(callbackQuery.id, '✅ 正在發送...');
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Process bottle content using draft
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      await telegram.sendMessage(chatId, '❌ 用戶不存在');
      return;
    }

    // Import and call processBottleContent
    const { processBottleContent } = await import('./throw');
    await processBottleContent(user, draft.content, env);

    // Delete draft after successful send
    await deleteDraft(db, draft.id);
  } catch (error) {
    console.error('[handleDraftSend] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle draft edit
 */
export async function handleDraftEdit(callbackQuery: any, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;

  try {
    await telegram.answerCallbackQuery(callbackQuery.id, '✏️ 請輸入新的內容');
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    await telegram.sendMessage(
      chatId,
      '✏️ 請輸入新的漂流瓶內容：\n\n' +
        '💡 提示：\n' +
        '• 最短 5 個字符\n' +
        '• 最多 250 個字符\n' +
        '• 不允許連結、圖片、多媒體\n' +
        '• 不要包含個人聯絡方式\n' +
        '• 友善、尊重的內容更容易被撿到哦～'
    );
  } catch (error) {
    console.error('[handleDraftEdit] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}
