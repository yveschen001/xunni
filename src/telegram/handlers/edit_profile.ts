/**
 * Edit Profile Handler
 *
 * Handles profile editing functionality
 */

import type { Env, TelegramMessage, TelegramCallbackQuery } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { upsertSession, getActiveSession, deleteSession } from '~/db/queries/sessions';
import { parseSessionData } from '~/domain/session';

const SESSION_TYPE = 'edit_profile';

/**
 * Handle /edit_profile command - show profile editing menu
 */
export async function handleEditProfile(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      await telegram.sendMessage(chatId, '❌ 用戶不存在，請先使用 /start 註冊。');
      return;
    }

    if (user.onboarding_step !== 'completed') {
      await telegram.sendMessage(chatId, '❌ 請先完成註冊流程。\n\n使用 /start 繼續註冊。');
      return;
    }

    // Clear any existing session
    await deleteSession(db, telegramId, SESSION_TYPE);

    // Get match preference text
    const matchPrefText = user.match_preference
      ? user.match_preference === 'male'
        ? '男生'
        : user.match_preference === 'female'
          ? '女生'
          : '任何人'
      : user.gender === 'male'
        ? '女生（默認）'
        : '男生（默認）';

    // Get blood type display
    const { getBloodTypeDisplay } = await import('~/domain/blood_type');
    const bloodTypeText = getBloodTypeDisplay(user.blood_type as any);

    // Show profile editing menu
    await telegram.sendMessageWithButtons(
      chatId,
      `✏️ **編輯個人資料**\n\n` +
        `請選擇要編輯的項目：\n\n` +
        `📝 暱稱：${user.nickname}\n` +
        `📖 個人簡介：${user.bio || '未設定'}\n` +
        `🌍 地區：${user.city || '未設定'}\n` +
        `🏷️ 興趣標籤：${user.interests || '未設定'}\n` +
        `💝 匹配偏好：${matchPrefText}\n` +
        `🩸 血型：${bloodTypeText}\n\n` +
        `⚠️ **不可修改項目**：\n` +
        `👤 性別：${user.gender === 'male' ? '男' : '女'}\n` +
        `🎂 生日：${user.birthday}\n` +
        `🧠 MBTI：${user.mbti_result || '未設定'}（可重新測試）`,
      [
        [
          { text: '📝 編輯暱稱', callback_data: 'edit_nickname' },
          { text: '📖 編輯簡介', callback_data: 'edit_bio' },
        ],
        [
          { text: '🌍 編輯地區', callback_data: 'edit_region' },
          { text: '🏷️ 編輯興趣', callback_data: 'edit_interests' },
        ],
        [
          { text: '💝 匹配偏好', callback_data: 'edit_match_pref' },
          { text: '🩸 編輯血型', callback_data: 'edit_blood_type' },
        ],
        [{ text: '🧠 重新測試 MBTI', callback_data: 'retake_mbti' }],
        [{ text: '↩️ 返回', callback_data: 'return_to_menu' }],
      ]
    );
  } catch (error) {
    console.error('[handleEditProfile] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤，請稍後再試。');
  }
}

/**
 * Handle edit profile callback - show profile editing menu from callback
 */
export async function handleEditProfileCallback(
  callbackQuery: TelegramCallbackQuery,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 用戶不存在');
      return;
    }

    if (user.onboarding_step !== 'completed') {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 請先完成註冊流程');
      return;
    }

    await telegram.answerCallbackQuery(callbackQuery.id);
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Clear any existing session
    await deleteSession(db, telegramId, SESSION_TYPE);

    // Get match preference text
    const matchPrefText = user.match_preference
      ? user.match_preference === 'male'
        ? '男生'
        : user.match_preference === 'female'
          ? '女生'
          : '任何人'
      : user.gender === 'male'
        ? '女生（默認）'
        : '男生（默認）';

    // Get blood type display
    const { getBloodTypeDisplay } = await import('~/domain/blood_type');
    const bloodTypeText = getBloodTypeDisplay(user.blood_type as any);

    // Show profile editing menu
    await telegram.sendMessageWithButtons(
      chatId,
      `✏️ **編輯個人資料**\n\n` +
        `請選擇要編輯的項目：\n\n` +
        `📝 暱稱：${user.nickname}\n` +
        `📖 個人簡介：${user.bio || '未設定'}\n` +
        `🌍 地區：${user.city || '未設定'}\n` +
        `🏷️ 興趣標籤：${user.interests || '未設定'}\n` +
        `💝 匹配偏好：${matchPrefText}\n` +
        `🩸 血型：${bloodTypeText}\n\n` +
        `⚠️ **不可修改項目**：\n` +
        `👤 性別：${user.gender === 'male' ? '男' : '女'}\n` +
        `🎂 生日：${user.birthday}\n` +
        `🧠 MBTI：${user.mbti_result || '未設定'}（可重新測試）`,
      [
        [
          { text: '📝 編輯暱稱', callback_data: 'edit_nickname' },
          { text: '📖 編輯簡介', callback_data: 'edit_bio' },
        ],
        [
          { text: '🌍 編輯地區', callback_data: 'edit_region' },
          { text: '🏷️ 編輯興趣', callback_data: 'edit_interests' },
        ],
        [
          { text: '💝 匹配偏好', callback_data: 'edit_match_pref' },
          { text: '🩸 編輯血型', callback_data: 'edit_blood_type' },
        ],
        [{ text: '🧠 重新測試 MBTI', callback_data: 'retake_mbti' }],
        [{ text: '↩️ 返回', callback_data: 'return_to_menu' }],
      ]
    );
  } catch (error) {
    console.error('[handleEditProfileCallback] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle edit nickname callback
 */
export async function handleEditNickname(
  callbackQuery: TelegramCallbackQuery,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    await telegram.answerCallbackQuery(callbackQuery.id);
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Create session
    console.error('[handleEditNickname] Creating session for user:', telegramId);
    await upsertSession(db, telegramId, SESSION_TYPE, { data: { editing: 'nickname' } });
    console.error('[handleEditNickname] Session created successfully');

    await telegram.sendMessage(
      chatId,
      '📝 **編輯暱稱**\n\n' +
        '請輸入新的暱稱：\n\n' +
        '💡 提示：\n' +
        '• 最少 4 個字符，最多 36 個字符\n' +
        '• 顯示時最多 18 個字符\n' +
        '• 不能包含網址連結\n' +
        '• 避免廣告或不當內容'
    );
  } catch (error) {
    console.error('[handleEditNickname] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle edit bio callback
 */
export async function handleEditBio(callbackQuery: TelegramCallbackQuery, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    await telegram.answerCallbackQuery(callbackQuery.id);
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Create session
    await upsertSession(db, telegramId, SESSION_TYPE, { data: { editing: 'bio' } });

    await telegram.sendMessage(
      chatId,
      '📖 **編輯個人簡介**\n\n' +
        '請輸入你的個人簡介：\n\n' +
        '💡 提示：\n' +
        '• 最多 200 個字符\n' +
        '• 介紹你的興趣、性格或想說的話\n' +
        '• 避免包含聯絡方式'
    );
  } catch (error) {
    console.error('[handleEditBio] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle edit region callback
 */
export async function handleEditRegion(
  callbackQuery: TelegramCallbackQuery,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    await telegram.answerCallbackQuery(callbackQuery.id);
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Create session
    await upsertSession(db, telegramId, SESSION_TYPE, { data: { editing: 'region' } });

    await telegram.sendMessage(
      chatId,
      '🌍 **編輯地區**\n\n' +
        '請輸入你的地區：\n\n' +
        '💡 提示：\n' +
        '• 例如：台北、香港、東京\n' +
        '• 最多 50 個字符'
    );
  } catch (error) {
    console.error('[handleEditRegion] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle edit match preference callback
 */
export async function handleEditMatchPref(
  callbackQuery: TelegramCallbackQuery,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    await telegram.answerCallbackQuery(callbackQuery.id);
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      await telegram.sendMessage(chatId, '❌ 用戶不存在。');
      return;
    }

    await telegram.sendMessageWithButtons(
      chatId,
      '💝 **設置匹配偏好**\n\n' +
        '你想在丟漂流瓶時尋找什麼樣的對象？\n\n' +
        '💡 提示：\n' +
        '• 默認為異性（男生尋找女生，女生尋找男生）\n' +
        '• 你可以隨時修改此設置',
      [
        [
          { text: '👨 男生', callback_data: 'match_pref_male' },
          { text: '👩 女生', callback_data: 'match_pref_female' },
        ],
        [{ text: '🌈 任何人都可以', callback_data: 'match_pref_any' }],
        [{ text: '↩️ 返回', callback_data: 'edit_profile_back' }],
      ]
    );
  } catch (error) {
    console.error('[handleEditMatchPref] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle match preference selection
 */
export async function handleMatchPrefSelection(
  callbackQuery: TelegramCallbackQuery,
  preference: 'male' | 'female' | 'any',
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    await telegram.answerCallbackQuery(callbackQuery.id, '正在更新...');

    await db.d1
      .prepare('UPDATE users SET match_preference = ? WHERE telegram_id = ?')
      .bind(preference, telegramId)
      .run();

    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    const prefText = preference === 'male' ? '男生' : preference === 'female' ? '女生' : '任何人';
    await telegram.sendMessageWithButtons(
      chatId,
      `✅ 匹配偏好已更新為：${prefText}\n\n` + `💡 下次丟漂流瓶時將自動使用此設置。`,
      [
        [{ text: '✏️ 繼續編輯資料', callback_data: 'edit_profile_callback' }],
        [{ text: '🏠 返回主選單', callback_data: 'return_to_menu' }],
      ]
    );
  } catch (error) {
    console.error('[handleMatchPrefSelection] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle edit interests callback
 */
export async function handleEditInterests(
  callbackQuery: TelegramCallbackQuery,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    await telegram.answerCallbackQuery(callbackQuery.id);
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Create session
    await upsertSession(db, telegramId, SESSION_TYPE, { data: { editing: 'interests' } });

    await telegram.sendMessage(
      chatId,
      '🏷️ **編輯興趣標籤**\n\n' +
        '請輸入你的興趣標籤（用逗號分隔）：\n\n' +
        '💡 提示：\n' +
        '• 例如：音樂, 電影, 旅行, 美食\n' +
        '• 最多 5 個標籤\n' +
        '• 每個標籤最多 20 個字符'
    );
  } catch (error) {
    console.error('[handleEditInterests] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle edit blood type callback
 */
export async function handleEditBloodType(
  callbackQuery: TelegramCallbackQuery,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;

  try {
    await telegram.answerCallbackQuery(callbackQuery.id);
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Get blood type options
    const { getBloodTypeOptions } = await import('~/domain/blood_type');
    const options = getBloodTypeOptions();

    await telegram.sendMessageWithButtons(
      chatId,
      `🩸 **編輯血型**\n\n` + `💡 血型可用於 VIP 血型配對功能\n\n` + `請選擇你的血型：`,
      [
        [
          { text: options[0].display, callback_data: 'edit_blood_type_A' },
          { text: options[1].display, callback_data: 'edit_blood_type_B' },
        ],
        [
          { text: options[2].display, callback_data: 'edit_blood_type_AB' },
          { text: options[3].display, callback_data: 'edit_blood_type_O' },
        ],
        [{ text: options[4].display, callback_data: 'edit_blood_type_skip' }],
        [{ text: '↩️ 返回', callback_data: 'edit_profile' }],
      ]
    );
  } catch (error) {
    console.error('[handleEditBloodType] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle blood type selection in edit mode
 */
export async function handleEditBloodTypeSelection(
  callbackQuery: TelegramCallbackQuery,
  bloodTypeValue: string,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Parse blood type (skip means null)
    const bloodType = bloodTypeValue === 'skip' ? null : bloodTypeValue;

    // Update blood type
    await db.d1
      .prepare('UPDATE users SET blood_type = ? WHERE telegram_id = ?')
      .bind(bloodType, telegramId)
      .run();

    // Get display text
    const { getBloodTypeDisplay } = await import('~/domain/blood_type');
    const displayText = bloodType
      ? `✅ 血型已更新為 ${getBloodTypeDisplay(bloodType as any)}`
      : '✅ 血型已清除';

    await telegram.answerCallbackQuery(callbackQuery.id, displayText);
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Show success message with buttons
    await telegram.sendMessageWithButtons(chatId, displayText, [
      [{ text: '✏️ 繼續編輯資料', callback_data: 'edit_profile_callback' }],
      [{ text: '🏠 返回主選單', callback_data: 'return_to_menu' }],
    ]);
  } catch (error) {
    console.error('[handleEditBloodTypeSelection] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle profile edit text input
 */
export async function handleProfileEditInput(message: TelegramMessage, env: Env): Promise<boolean> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();
  const text = message.text || '';

  try {
    // Check if user has an active edit session
    console.error('[handleProfileEditInput] Checking session for user:', telegramId);
    const session = await getActiveSession(db, telegramId, SESSION_TYPE);
    console.error('[handleProfileEditInput] Session found:', !!session);

    if (!session) {
      return false; // Not in edit mode
    }

    // If user sends a command, clear the session and let router handle it
    if (text.startsWith('/')) {
      console.error('[handleProfileEditInput] Command detected, clearing session:', text);
      await deleteSession(db, telegramId, SESSION_TYPE);
      return false; // Let router handle the command
    }

    const sessionData = parseSessionData(session);
    const editing = sessionData.data?.editing;
    console.error('[handleProfileEditInput] Editing type:', editing);

    if (!editing) {
      return false;
    }

    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      return false;
    }

    // Handle different edit types
    switch (editing) {
      case 'nickname': {
        // Validate nickname length (4-36 characters)
        if (text.length < 4) {
          await telegram.sendMessageWithButtons(
            chatId,
            '❌ 暱稱太短，至少需要 4 個字符。\n\n請重新輸入或取消編輯：',
            [[{ text: '❌ 取消編輯', callback_data: 'edit_profile_callback' }]]
          );
          return true;
        }

        if (text.length > 36) {
          await telegram.sendMessageWithButtons(
            chatId,
            '❌ 暱稱太長，請輸入不超過 36 個字符的暱稱。\n\n請重新輸入或取消編輯：',
            [[{ text: '❌ 取消編輯', callback_data: 'edit_profile_callback' }]]
          );
          return true;
        }

        // Check for URLs in nickname
        const { checkUrlWhitelist } = await import('~/utils/url-whitelist');
        const urlCheck = checkUrlWhitelist(text);
        if (!urlCheck.allowed) {
          await telegram.sendMessageWithButtons(
            chatId,
            '❌ 暱稱不能包含網址連結\n\n' +
              '💡 請輸入一個簡單的暱稱，不要包含 http:// 或 https:// 等連結。\n\n' +
              '請重新輸入或取消編輯：',
            [[{ text: '❌ 取消編輯', callback_data: 'edit_profile_callback' }]]
          );
          return true;
        }

        // Update nickname
        await db.d1
          .prepare('UPDATE users SET nickname = ? WHERE telegram_id = ?')
          .bind(text, telegramId)
          .run();

        // Delete session
        await deleteSession(db, telegramId, SESSION_TYPE);

        // Get updated user info
        const updatedUser = await findUserByTelegramId(db, telegramId);
        if (!updatedUser) {
          await telegram.sendMessage(chatId, '❌ 發生錯誤，請稍後再試。');
          return true;
        }

        // Get match preference text
        const matchPrefText = updatedUser.match_preference
          ? updatedUser.match_preference === 'male'
            ? '男生'
            : updatedUser.match_preference === 'female'
              ? '女生'
              : '任何人'
          : updatedUser.gender === 'male'
            ? '女生（默認）'
            : '男生（默認）';

        // Get blood type display
        const { getBloodTypeDisplay } = await import('~/domain/blood_type');
        const bloodTypeText = getBloodTypeDisplay(updatedUser.blood_type as any);

        // Show success message and editing menu
        await telegram.sendMessageWithButtons(
          chatId,
          `✅ 暱稱已更新為：${text}\n\n` +
            `━━━━━━━━━━━━━━━━\n\n` +
            `✏️ **編輯個人資料**\n\n` +
            `📝 暱稱：${updatedUser.nickname}\n` +
            `📖 個人簡介：${updatedUser.bio || '未設定'}\n` +
            `🌍 地區：${updatedUser.city || '未設定'}\n` +
            `🏷️ 興趣標籤：${updatedUser.interests || '未設定'}\n` +
            `💝 匹配偏好：${matchPrefText}\n` +
            `🩸 血型：${bloodTypeText}\n\n` +
            `⚠️ **不可修改項目**：\n` +
            `👤 性別：${updatedUser.gender === 'male' ? '男' : '女'}\n` +
            `🎂 生日：${updatedUser.birthday}\n` +
            `🧠 MBTI：${updatedUser.mbti_result || '未設定'}（可重新測試）`,
          [
            [
              { text: '📝 編輯暱稱', callback_data: 'edit_nickname' },
              { text: '📖 編輯簡介', callback_data: 'edit_bio' },
            ],
            [
              { text: '🌍 編輯地區', callback_data: 'edit_region' },
              { text: '🏷️ 編輯興趣', callback_data: 'edit_interests' },
            ],
            [
              { text: '💝 匹配偏好', callback_data: 'edit_match_pref' },
              { text: '🩸 編輯血型', callback_data: 'edit_blood_type' },
            ],
            [{ text: '🧠 重新測試 MBTI', callback_data: 'retake_mbti' }],
            [{ text: '🏠 返回主選單', callback_data: 'return_to_menu' }],
          ]
        );
        return true;
      }

      case 'bio': {
        if (text.length > 200) {
          await telegram.sendMessageWithButtons(
            chatId,
            '❌ 個人簡介太長，請輸入不超過 200 個字符。\n\n請重新輸入或取消編輯：',
            [[{ text: '❌ 取消編輯', callback_data: 'edit_profile_callback' }]]
          );
          return true;
        }

        // Check for URLs
        const { checkUrlWhitelist } = await import('~/utils/url-whitelist');
        const urlCheck = checkUrlWhitelist(text);
        if (!urlCheck.allowed) {
          await telegram.sendMessageWithButtons(
            chatId,
            '❌ 個人簡介包含不允許的連結。\n\n' +
              '為了安全，只允許以下網域的連結：\n' +
              '• t.me (Telegram)\n' +
              '• telegram.org\n' +
              '• telegram.me\n\n' +
              `🚫 禁止的網址：\n${urlCheck.blockedUrls?.map((url) => `• ${url}`).join('\n')}\n\n` +
              '請移除這些連結後重新輸入或取消編輯：',
            [[{ text: '❌ 取消編輯', callback_data: 'edit_profile_callback' }]]
          );
          return true;
        }

        await db.d1
          .prepare('UPDATE users SET bio = ? WHERE telegram_id = ?')
          .bind(text, telegramId)
          .run();

        await deleteSession(db, telegramId, SESSION_TYPE);
        await telegram.sendMessageWithButtons(chatId, `✅ 個人簡介已更新！\n\n${text}`, [
          [{ text: '✏️ 繼續編輯資料', callback_data: 'edit_profile_callback' }],
          [{ text: '🏠 返回主選單', callback_data: 'return_to_menu' }],
        ]);
        return true;
      }

      case 'region': {
        if (text.length > 50) {
          await telegram.sendMessageWithButtons(
            chatId,
            '❌ 地區名稱太長，請輸入不超過 50 個字符。\n\n請重新輸入或取消編輯：',
            [[{ text: '❌ 取消編輯', callback_data: 'edit_profile_callback' }]]
          );
          return true;
        }

        await db.d1
          .prepare('UPDATE users SET city = ? WHERE telegram_id = ?')
          .bind(text, telegramId)
          .run();

        await deleteSession(db, telegramId, SESSION_TYPE);
        await telegram.sendMessageWithButtons(chatId, `✅ 地區已更新為：${text}`, [
          [{ text: '✏️ 繼續編輯資料', callback_data: 'edit_profile_callback' }],
          [{ text: '🏠 返回主選單', callback_data: 'return_to_menu' }],
        ]);
        return true;
      }

      case 'interests': {
        const interests = text
          .split(',')
          .map((i) => i.trim())
          .filter((i) => i.length > 0);

        if (interests.length > 5) {
          await telegram.sendMessageWithButtons(
            chatId,
            '❌ 最多只能設定 5 個興趣標籤。\n\n請重新輸入或取消編輯：',
            [[{ text: '❌ 取消編輯', callback_data: 'edit_profile_callback' }]]
          );
          return true;
        }

        if (interests.some((i) => i.length > 20)) {
          await telegram.sendMessageWithButtons(
            chatId,
            '❌ 每個標籤最多 20 個字符。\n\n請重新輸入或取消編輯：',
            [[{ text: '❌ 取消編輯', callback_data: 'edit_profile_callback' }]]
          );
          return true;
        }

        const interestsStr = interests.join(', ');
        await db.d1
          .prepare('UPDATE users SET interests = ? WHERE telegram_id = ?')
          .bind(interestsStr, telegramId)
          .run();

        await deleteSession(db, telegramId, SESSION_TYPE);
        await telegram.sendMessageWithButtons(chatId, `✅ 興趣標籤已更新：\n\n${interestsStr}`, [
          [{ text: '✏️ 繼續編輯資料', callback_data: 'edit_profile_callback' }],
          [{ text: '🏠 返回主選單', callback_data: 'return_to_menu' }],
        ]);
        return true;
      }

      default:
        return false;
    }
  } catch (error) {
    console.error('[handleProfileEditInput] Error:', error);
    return false;
  }
}
