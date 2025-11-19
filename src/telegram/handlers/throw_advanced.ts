/**
 * Throw Bottle Advanced Filter Handler
 *
 * Handles VIP advanced filtering (MBTI/Zodiac) for bottle throwing.
 */

import type { Env } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { upsertSession, getActiveSession, updateSessionData } from '~/db/queries/sessions';
import { parseSessionData } from '~/domain/session';

// MBTI types
const MBTI_TYPES = [
  'INTJ',
  'INTP',
  'ENTJ',
  'ENTP',
  'INFJ',
  'INFP',
  'ENFJ',
  'ENFP',
  'ISTJ',
  'ISFJ',
  'ESTJ',
  'ESFJ',
  'ISTP',
  'ISFP',
  'ESTP',
  'ESFP',
];

// Zodiac signs
const ZODIAC_SIGNS = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
];

const ZODIAC_NAMES: Record<string, string> = {
  aries: '♈ 白羊座',
  taurus: '♉ 金牛座',
  gemini: '♊ 雙子座',
  cancer: '♋ 巨蟹座',
  leo: '♌ 獅子座',
  virgo: '♍ 處女座',
  libra: '♎ 天秤座',
  scorpio: '♏ 天蠍座',
  sagittarius: '♐ 射手座',
  capricorn: '♑ 摩羯座',
  aquarius: '♒ 水瓶座',
  pisces: '♓ 雙魚座',
};

/**
 * Show advanced filter menu
 */
export async function handleThrowAdvanced(callbackQuery: any, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 用戶不存在');
      return;
    }

    // Check VIP status
    const isVip = !!(
      user.is_vip &&
      user.vip_expire_at &&
      new Date(user.vip_expire_at) > new Date()
    );
    if (!isVip) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 此功能僅限 VIP 會員使用');
      return;
    }

    // Answer callback
    await telegram.answerCallbackQuery(callbackQuery.id);

    // Delete previous message
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Initialize session for throw_bottle
    await upsertSession(db, telegramId, 'throw_bottle', {
      step: 'advanced_filter',
      data: {
        target_gender: 'any',
        target_mbti: [],
        target_zodiac: [],
        target_blood_type: 'any',
      },
    });

    // Show advanced filter menu
    await telegram.sendMessageWithButtons(
      chatId,
      '⚙️ **進階篩選（VIP 專屬）**\n\n' +
        '選擇你想要篩選的條件：\n\n' +
        '• MBTI：篩選特定性格類型\n' +
        '• 星座：篩選特定星座\n' +
        '• 血型：篩選特定血型\n' +
        '• 性別：篩選性別\n\n' +
        '💡 可以組合多個條件',
      [
        [{ text: '🧠 MBTI 篩選', callback_data: 'filter_mbti' }],
        [{ text: '⭐ 星座篩選', callback_data: 'filter_zodiac' }],
        [{ text: '🩸 血型篩選', callback_data: 'filter_blood_type' }],
        [{ text: '👤 性別篩選', callback_data: 'filter_gender' }],
        [{ text: '✅ 完成篩選，輸入內容', callback_data: 'filter_done' }],
        [{ text: '🏠 返回主選單', callback_data: 'return_to_menu' }],
      ]
    );
  } catch (error) {
    console.error('[handleThrowAdvanced] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Show MBTI filter selection
 */
export async function handleFilterMBTI(callbackQuery: any, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    await telegram.answerCallbackQuery(callbackQuery.id);

    // Get current session
    const session = await getActiveSession(db, telegramId, 'throw_bottle');
    if (!session) {
      await telegram.sendMessage(chatId, '❌ 會話已過期，請重新開始：/throw');
      return;
    }

    const sessionData = parseSessionData(session);
    const selectedMBTI = (sessionData.data?.target_mbti || []) as string[];

    // Build MBTI selection buttons (4x4 grid)
    const mbtiButtons: any[][] = [];
    for (let i = 0; i < MBTI_TYPES.length; i += 4) {
      const row = MBTI_TYPES.slice(i, i + 4).map((mbti) => ({
        text: selectedMBTI.includes(mbti) ? `✅ ${mbti}` : mbti,
        callback_data: `select_mbti_${mbti}`,
      }));
      mbtiButtons.push(row);
    }

    // Add control buttons
    mbtiButtons.push([
      { text: '🔄 清除選擇', callback_data: 'clear_mbti' },
      { text: '⬅️ 返回', callback_data: 'back_to_filter' },
    ]);

    await telegram.editMessageText(
      chatId,
      callbackQuery.message!.message_id,
      '🧠 **MBTI 篩選**\n\n' +
        `已選擇：${selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '無'}\n\n` +
        '💡 點擊選擇或取消 MBTI 類型：',
      {
        reply_markup: {
          inline_keyboard: mbtiButtons,
        },
      }
    );
  } catch (error) {
    console.error('[handleFilterMBTI] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle MBTI selection toggle
 */
export async function handleSelectMBTI(
  callbackQuery: any,
  mbtiType: string,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Get current session
    const session = await getActiveSession(db, telegramId, 'throw_bottle');
    if (!session) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 會話已過期');
      return;
    }

    const sessionData = parseSessionData(session);
    const selectedMBTI = (sessionData.data?.target_mbti || []) as string[];

    // Toggle MBTI selection
    const index = selectedMBTI.indexOf(mbtiType);
    if (index > -1) {
      selectedMBTI.splice(index, 1);
    } else {
      selectedMBTI.push(mbtiType);
    }

    // Update session
    sessionData.data = {
      ...sessionData.data,
      target_mbti: selectedMBTI,
    };
    await updateSessionData(db, session.id, sessionData);

    await telegram.answerCallbackQuery(
      callbackQuery.id,
      index > -1 ? `❌ 已取消 ${mbtiType}` : `✅ 已選擇 ${mbtiType}`
    );

    // Refresh MBTI selection UI
    await handleFilterMBTI(callbackQuery, env);
  } catch (error) {
    console.error('[handleSelectMBTI] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Show Zodiac filter selection
 */
export async function handleFilterZodiac(callbackQuery: any, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    await telegram.answerCallbackQuery(callbackQuery.id);

    // Get current session
    const session = await getActiveSession(db, telegramId, 'throw_bottle');
    if (!session) {
      await telegram.sendMessage(chatId, '❌ 會話已過期，請重新開始：/throw');
      return;
    }

    const sessionData = parseSessionData(session);
    const selectedZodiac = (sessionData.data?.target_zodiac || []) as string[];

    // Build Zodiac selection buttons (3x4 grid)
    const zodiacButtons: any[][] = [];
    for (let i = 0; i < ZODIAC_SIGNS.length; i += 3) {
      const row = ZODIAC_SIGNS.slice(i, i + 3).map((zodiac) => ({
        text: selectedZodiac.includes(zodiac) ? `✅ ${ZODIAC_NAMES[zodiac]}` : ZODIAC_NAMES[zodiac],
        callback_data: `select_zodiac_${zodiac}`,
      }));
      zodiacButtons.push(row);
    }

    // Add control buttons
    zodiacButtons.push([
      { text: '🔄 清除選擇', callback_data: 'clear_zodiac' },
      { text: '⬅️ 返回', callback_data: 'back_to_filter' },
    ]);

    await telegram.editMessageText(
      chatId,
      callbackQuery.message!.message_id,
      '⭐ **星座篩選**\n\n' +
        `已選擇：${selectedZodiac.length > 0 ? selectedZodiac.map((z) => ZODIAC_NAMES[z]).join(', ') : '無'}\n\n` +
        '💡 點擊選擇或取消星座：',
      {
        reply_markup: {
          inline_keyboard: zodiacButtons,
        },
      }
    );
  } catch (error) {
    console.error('[handleFilterZodiac] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle Zodiac selection toggle
 */
export async function handleSelectZodiac(
  callbackQuery: any,
  zodiacSign: string,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Get current session
    const session = await getActiveSession(db, telegramId, 'throw_bottle');
    if (!session) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 會話已過期');
      return;
    }

    const sessionData = parseSessionData(session);
    const selectedZodiac = (sessionData.data?.target_zodiac || []) as string[];

    // Toggle Zodiac selection
    const index = selectedZodiac.indexOf(zodiacSign);
    if (index > -1) {
      selectedZodiac.splice(index, 1);
    } else {
      selectedZodiac.push(zodiacSign);
    }

    // Update session
    sessionData.data = {
      ...sessionData.data,
      target_zodiac: selectedZodiac,
    };
    await updateSessionData(db, session.id, sessionData);

    await telegram.answerCallbackQuery(
      callbackQuery.id,
      index > -1 ? `❌ 已取消 ${ZODIAC_NAMES[zodiacSign]}` : `✅ 已選擇 ${ZODIAC_NAMES[zodiacSign]}`
    );

    // Refresh Zodiac selection UI
    await handleFilterZodiac(callbackQuery, env);
  } catch (error) {
    console.error('[handleSelectZodiac] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle filter gender selection
 */
export async function handleFilterGender(callbackQuery: any, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    await telegram.answerCallbackQuery(callbackQuery.id);

    // Get current session
    const session = await getActiveSession(db, telegramId, 'throw_bottle');
    if (!session) {
      await telegram.sendMessage(chatId, '❌ 會話已過期，請重新開始：/throw');
      return;
    }

    const sessionData = parseSessionData(session);
    const currentGender = sessionData.data?.target_gender || 'any';

    await telegram.editMessageText(
      chatId,
      callbackQuery.message!.message_id,
      '👤 **性別篩選**\n\n' +
        `當前選擇：${currentGender === 'male' ? '👨 男生' : currentGender === 'female' ? '👩 女生' : '🌈 任何人'}\n\n` +
        '💡 選擇你想要的性別：',
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: currentGender === 'male' ? '✅ 👨 男生' : '👨 男生',
                callback_data: 'set_gender_male',
              },
              {
                text: currentGender === 'female' ? '✅ 👩 女生' : '👩 女生',
                callback_data: 'set_gender_female',
              },
            ],
            [
              {
                text: currentGender === 'any' ? '✅ 🌈 任何人' : '🌈 任何人',
                callback_data: 'set_gender_any',
              },
            ],
            [{ text: '⬅️ 返回', callback_data: 'back_to_filter' }],
          ],
        },
      }
    );
  } catch (error) {
    console.error('[handleFilterGender] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle set gender
 */
export async function handleSetGender(
  callbackQuery: any,
  gender: 'male' | 'female' | 'any',
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Get current session
    const session = await getActiveSession(db, telegramId, 'throw_bottle');
    if (!session) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 會話已過期');
      return;
    }

    const sessionData = parseSessionData(session);
    sessionData.data = {
      ...sessionData.data,
      target_gender: gender,
    };
    await updateSessionData(db, session.id, sessionData);

    await telegram.answerCallbackQuery(
      callbackQuery.id,
      `✅ 已選擇 ${gender === 'male' ? '男生' : gender === 'female' ? '女生' : '任何人'}`
    );

    // Refresh gender selection UI
    await handleFilterGender(callbackQuery, env);
  } catch (error) {
    console.error('[handleSetGender] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle back to filter menu
 */
export async function handleBackToFilter(callbackQuery: any, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    await telegram.answerCallbackQuery(callbackQuery.id);

    // Get current session
    const session = await getActiveSession(db, telegramId, 'throw_bottle');
    if (!session) {
      await telegram.sendMessage(chatId, '❌ 會話已過期，請重新開始：/throw');
      return;
    }

    const sessionData = parseSessionData(session);
    const selectedMBTI = (sessionData.data?.target_mbti || []) as string[];
    const selectedZodiac = (sessionData.data?.target_zodiac || []) as string[];
    const selectedGender = sessionData.data?.target_gender || 'any';

    // Show filter summary
    let summary = '當前篩選條件：\n\n';
    summary += `• 性別：${selectedGender === 'male' ? '👨 男生' : selectedGender === 'female' ? '👩 女生' : '🌈 任何人'}\n`;
    summary += `• MBTI：${selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '無限制'}\n`;
    summary += `• 星座：${selectedZodiac.length > 0 ? selectedZodiac.map((z) => ZODIAC_NAMES[z]).join(', ') : '無限制'}\n`;

    await telegram.editMessageText(
      chatId,
      callbackQuery.message!.message_id,
      `⚙️ **進階篩選**\n\n${summary}\n💡 繼續調整或完成篩選：`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🧠 MBTI 篩選', callback_data: 'filter_mbti' }],
            [{ text: '⭐ 星座篩選', callback_data: 'filter_zodiac' }],
            [{ text: '👤 性別篩選', callback_data: 'filter_gender' }],
            [{ text: '✅ 完成篩選，輸入內容', callback_data: 'filter_done' }],
            [{ text: '🏠 返回主選單', callback_data: 'return_to_menu' }],
          ],
        },
      }
    );
  } catch (error) {
    console.error('[handleBackToFilter] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle filter done - proceed to content input
 */
export async function handleFilterDone(callbackQuery: any, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    await telegram.answerCallbackQuery(callbackQuery.id, '✅ 篩選完成');

    // Delete filter menu
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Get current session
    const session = await getActiveSession(db, telegramId, 'throw_bottle');
    if (!session) {
      await telegram.sendMessage(chatId, '❌ 會話已過期，請重新開始：/throw');
      return;
    }

    const sessionData = parseSessionData(session);
    const selectedMBTI = (sessionData.data?.target_mbti || []) as string[];
    const selectedZodiac = (sessionData.data?.target_zodiac || []) as string[];
    const selectedGender = sessionData.data?.target_gender || 'any';

    // Show filter summary and ask for content
    let summary = '✅ 篩選條件已設定：\n\n';
    summary += `• 性別：${selectedGender === 'male' ? '👨 男生' : selectedGender === 'female' ? '👩 女生' : '🌈 任何人'}\n`;
    summary += `• MBTI：${selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '無限制'}\n`;
    summary += `• 星座：${selectedZodiac.length > 0 ? selectedZodiac.map((z) => ZODIAC_NAMES[z]).join(', ') : '無限制'}\n`;

    await telegram.sendMessage(
      chatId,
      summary +
        '\n\n' +
        '📝 請輸入你的漂流瓶內容：\n\n' +
        '💡 提示：\n' +
        '• 只能使用文字和官方 Emoji\n' +
        '• 最多 500 字\n' +
        '• 不要包含個人聯絡方式\n' +
        '• 友善、尊重的內容更容易被撿到哦～'
    );

    // Update session step
    sessionData.step = 'waiting_content';
    await updateSessionData(db, session.id, sessionData);
  } catch (error) {
    console.error('[handleFilterDone] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Clear MBTI selection
 */
export async function handleClearMBTI(callbackQuery: any, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const telegramId = callbackQuery.from.id.toString();

  try {
    const session = await getActiveSession(db, telegramId, 'throw_bottle');
    if (!session) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 會話已過期');
      return;
    }

    const sessionData = parseSessionData(session);
    sessionData.data = {
      ...sessionData.data,
      target_mbti: [],
    };
    await updateSessionData(db, session.id, sessionData);

    await telegram.answerCallbackQuery(callbackQuery.id, '✅ 已清除 MBTI 選擇');
    await handleFilterMBTI(callbackQuery, env);
  } catch (error) {
    console.error('[handleClearMBTI] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Clear Zodiac selection
 */
export async function handleClearZodiac(callbackQuery: any, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const telegramId = callbackQuery.from.id.toString();

  try {
    const session = await getActiveSession(db, telegramId, 'throw_bottle');
    if (!session) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 會話已過期');
      return;
    }

    const sessionData = parseSessionData(session);
    sessionData.data = {
      ...sessionData.data,
      target_zodiac: [],
    };
    await updateSessionData(db, session.id, sessionData);

    await telegram.answerCallbackQuery(callbackQuery.id, '✅ 已清除星座選擇');
    await handleFilterZodiac(callbackQuery, env);
  } catch (error) {
    console.error('[handleClearZodiac] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Show blood type filter selection
 */
export async function handleFilterBloodType(callbackQuery: any, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    const session = await getActiveSession(db, telegramId, 'throw_bottle');
    if (!session) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 會話已過期');
      return;
    }

    await telegram.answerCallbackQuery(callbackQuery.id);
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    const sessionData = parseSessionData(session);
    const currentBloodType = sessionData.data?.target_blood_type || 'any';

    const bloodTypeDisplay: Record<string, string> = {
      any: '任何血型',
      A: '🩸 A 型',
      B: '🩸 B 型',
      AB: '🩸 AB 型',
      O: '🩸 O 型',
    };

    await telegram.sendMessageWithButtons(
      chatId,
      '🩸 **血型篩選**\n\n' +
        `當前選擇：${bloodTypeDisplay[currentBloodType]}\n\n` +
        '選擇你想要配對的血型：',
      [
        [
          { text: '🩸 A 型', callback_data: 'blood_type_A' },
          { text: '🩸 B 型', callback_data: 'blood_type_B' },
        ],
        [
          { text: '🩸 AB 型', callback_data: 'blood_type_AB' },
          { text: '🩸 O 型', callback_data: 'blood_type_O' },
        ],
        [{ text: '🌈 任何血型', callback_data: 'blood_type_any' }],
        [{ text: '↩️ 返回篩選選單', callback_data: 'throw_advanced' }],
      ]
    );
  } catch (error) {
    console.error('[handleFilterBloodType] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}

/**
 * Handle blood type selection
 */
export async function handleBloodTypeSelect(
  callbackQuery: any,
  bloodType: string,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const telegramId = callbackQuery.from.id.toString();

  try {
    const session = await getActiveSession(db, telegramId, 'throw_bottle');
    if (!session) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 會話已過期');
      return;
    }

    const sessionData = parseSessionData(session);
    sessionData.data = {
      ...sessionData.data,
      target_blood_type: bloodType,
    };
    await updateSessionData(db, session.id, sessionData);

    const bloodTypeDisplay: Record<string, string> = {
      any: '任何血型',
      A: '🩸 A 型',
      B: '🩸 B 型',
      AB: '🩸 AB 型',
      O: '🩸 O 型',
    };

    await telegram.answerCallbackQuery(
      callbackQuery.id,
      `✅ 已選擇 ${bloodTypeDisplay[bloodType]}`
    );
    await handleFilterBloodType(callbackQuery, env);
  } catch (error) {
    console.error('[handleBloodTypeSelect] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 發生錯誤');
  }
}
