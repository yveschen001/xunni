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

// Zodiac names will be translated using i18n
function getZodiacName(zodiac: string, i18n: any): string {
  const zodiacKey = `zodiac.${zodiac}`;
  return i18n.t(zodiacKey);
}

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
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n('zh-TW');
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('error.userNotFound4'));
      return;
    }

    // Check VIP status
    const isVip = !!(
      user.is_vip &&
      user.vip_expire_at &&
      new Date(user.vip_expire_at) > new Date()
    );
    if (!isVip) {
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n(user.language_pref || 'zh-TW');
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('warning.vip2'));
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
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user.language_pref || 'zh-TW');
    await telegram.sendMessageWithButtons(
      chatId,
      i18n.t('throw.vip3') +
        '\n\n' +
        i18n.t('throw.text16') +
        '\n\n' +
        i18n.t('throw.mbti5') +
        '\n' +
        i18n.t('throw.zodiac5') +
        '\n' +
        i18n.t('throw.bloodType2') +
        '\n' +
        i18n.t('throw.gender3') +
        '\n\n' +
        i18n.t('throw.text23'),
      [
        [{ text: i18n.t('throw.mbti7'), callback_data: 'filter_mbti' }],
        [{ text: i18n.t('throw.zodiac7'), callback_data: 'filter_zodiac' }],
        [{ text: i18n.t('throw.bloodType4'), callback_data: 'filter_blood_type' }],
        [{ text: i18n.t('throw.gender5'), callback_data: 'filter_gender' }],
        [{ text: i18n.t('success.complete6'), callback_data: 'filter_done' }],
        [{ text: i18n.t('buttons.back'), callback_data: 'throw' }],
      ]
    );
  } catch (error) {
    console.error('[handleThrowAdvanced] Error:', error);
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.systemError'));
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

    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n('zh-TW');
      await telegram.sendMessage(chatId, i18n.t('errors.userNotFoundRegister'));
      return;
    }

    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Get current session
    const session = await getActiveSession(db, telegramId, 'throw_bottle');
    if (!session) {
      await telegram.sendMessage(chatId, i18n.t('errors.sessionExpired'));
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
      { text: i18n.t('buttons.short21'), callback_data: 'clear_mbti' },
      { text: i18n.t('buttons.back'), callback_data: 'back_to_filter' },
    ]);

    await telegram.editMessageText(
      chatId,
      callbackQuery.message!.message_id,
      i18n.t('throw.mbti4') +
        '\n\n' +
        i18n.t('throw.selected', {
          selected: selectedMBTI.length > 0 ? selectedMBTI.join(', ') : i18n.t('common.none'),
        }) +
        '\n\n' +
        i18n.t('throw.cancel'),
      {
        reply_markup: {
          inline_keyboard: mbtiButtons,
        },
      }
    );
  } catch (error) {
    console.error('[handleFilterMBTI] Error:', error);
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.systemError'));
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
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n('zh-TW');
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.userNotFound'));
      return;
    }

    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Get current session
    const session = await getActiveSession(db, telegramId, 'throw_bottle');
    if (!session) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.sessionExpired'));
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
      index > -1 ? i18n.t('error.cancel8', { mbtiType }) : i18n.t('success.text18', { mbtiType })
    );

    // Refresh MBTI selection UI
    await handleFilterMBTI(callbackQuery, env);
  } catch (error) {
    console.error('[handleSelectMBTI] Error:', error);
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.systemError'));
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

    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n('zh-TW');
      await telegram.sendMessage(chatId, i18n.t('errors.userNotFoundRegister'));
      return;
    }

    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Get current session
    const session = await getActiveSession(db, telegramId, 'throw_bottle');
    if (!session) {
      await telegram.sendMessage(chatId, i18n.t('errors.sessionExpired'));
      return;
    }

    const sessionData = parseSessionData(session);
    const selectedZodiac = (sessionData.data?.target_zodiac || []) as string[];

    // Build Zodiac selection buttons (3x4 grid)
    const zodiacButtons: any[][] = [];
    for (let i = 0; i < ZODIAC_SIGNS.length; i += 3) {
      const row = ZODIAC_SIGNS.slice(i, i + 3).map((zodiac) => ({
        text: selectedZodiac.includes(zodiac)
          ? `✅ ${getZodiacName(zodiac, i18n)}`
          : getZodiacName(zodiac, i18n),
        callback_data: `select_zodiac_${zodiac}`,
      }));
      zodiacButtons.push(row);
    }

    // Add control buttons
    zodiacButtons.push([
      { text: i18n.t('buttons.short21'), callback_data: 'clear_zodiac' },
      { text: i18n.t('buttons.back'), callback_data: 'back_to_filter' },
    ]);

    await telegram.editMessageText(
      chatId,
      callbackQuery.message!.message_id,
      i18n.t('throw.zodiac4') +
        '\n\n' +
        i18n.t('throw.selected', {
          selected:
            selectedZodiac.length > 0
              ? selectedZodiac.map((z) => getZodiacName(z, i18n)).join(', ')
              : i18n.t('common.none'),
        }) +
        '\n\n' +
        i18n.t('throw.cancel2'),
      {
        reply_markup: {
          inline_keyboard: zodiacButtons,
        },
      }
    );
  } catch (error) {
    console.error('[handleFilterZodiac] Error:', error);
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.systemError'));
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
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n('zh-TW');
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.userNotFound'));
      return;
    }

    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Get current session
    const session = await getActiveSession(db, telegramId, 'throw_bottle');
    if (!session) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.sessionExpired'));
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

    const zodiacName = getZodiacName(zodiacSign, i18n);
    await telegram.answerCallbackQuery(
      callbackQuery.id,
      index > -1
        ? i18n.t('common.cancelled', { item: zodiacName })
        : i18n.t('common.selected', { selected: zodiacName })
    );

    // Refresh Zodiac selection UI
    await handleFilterZodiac(callbackQuery, env);
  } catch (error) {
    console.error('[handleSelectZodiac] Error:', error);
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.systemError'));
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

    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n('zh-TW');
      await telegram.sendMessage(chatId, i18n.t('errors.userNotFoundRegister'));
      return;
    }

    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Get current session
    const session = await getActiveSession(db, telegramId, 'throw_bottle');
    if (!session) {
      await telegram.sendMessage(chatId, i18n.t('errors.sessionExpired'));
      return;
    }

    const sessionData = parseSessionData(session);
    const currentGender = sessionData.data?.target_gender || 'any';

    const genderText =
      currentGender === 'male'
        ? i18n.t('onboarding.gender.male')
        : currentGender === 'female'
          ? i18n.t('onboarding.gender.female')
          : '🌈 任何人';
    const maleText =
      currentGender === 'male'
        ? `✅ ${i18n.t('onboarding.gender.male')}`
        : i18n.t('onboarding.gender.male');
    const femaleText =
      currentGender === 'female'
        ? `✅ ${i18n.t('onboarding.gender.female')}`
        : i18n.t('onboarding.gender.female');
    const anyText =
      currentGender === 'any' ? `✅ ${i18n.t('throw.short3')}` : i18n.t('throw.short3');

    await telegram.editMessageText(
      chatId,
      callbackQuery.message!.message_id,
      i18n.t('throw.gender2') +
        '\n\n' +
        i18n.t('throw.currentSelection', { genderText }) +
        '\n\n' +
        i18n.t('throw.gender4'),
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: maleText,
                callback_data: 'set_gender_male',
              },
              {
                text: femaleText,
                callback_data: 'set_gender_female',
              },
            ],
            [
              {
                text: anyText,
                callback_data: 'set_gender_any',
              },
            ],
            [{ text: i18n.t('buttons.back'), callback_data: 'back_to_filter' }],
          ],
        },
      }
    );
  } catch (error) {
    console.error('[handleFilterGender] Error:', error);
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.systemError'));
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
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n('zh-TW');
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.userNotFound'));
      return;
    }

    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Get current session
    const session = await getActiveSession(db, telegramId, 'throw_bottle');
    if (!session) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.sessionExpired'));
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
      i18n.t('success.message5', {
        gender: gender === 'male' ? 'male' : gender === 'female' ? 'female' : 'any',
      })
    );

    // Refresh gender selection UI
    await handleFilterGender(callbackQuery, env);
  } catch (error) {
    console.error('[handleSetGender] Error:', error);
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.systemError'));
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

    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n('zh-TW');
      await telegram.sendMessage(chatId, i18n.t('errors.userNotFoundRegister'));
      return;
    }

    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Get current session
    const session = await getActiveSession(db, telegramId, 'throw_bottle');
    if (!session) {
      await telegram.sendMessage(chatId, i18n.t('errors.sessionExpired'));
      return;
    }

    const sessionData = parseSessionData(session);
    const selectedMBTI = (sessionData.data?.target_mbti || []) as string[];
    const selectedZodiac = (sessionData.data?.target_zodiac || []) as string[];
    const selectedGender = sessionData.data?.target_gender || 'any';

    // Show filter summary
    const genderText =
      selectedGender === 'male'
        ? i18n.t('onboarding.gender.male')
        : selectedGender === 'female'
          ? i18n.t('onboarding.gender.female')
          : '🌈 任何人';
    const mbtiText = selectedMBTI.length > 0 ? selectedMBTI.join(', ') : i18n.t('throw.unlimited');
    const zodiacText =
      selectedZodiac.length > 0
        ? selectedZodiac.map((z) => getZodiacName(z, i18n)).join(', ')
        : i18n.t('throw.unlimited');
    const summary =
      i18n.t('throw.text24') +
      '\n\n' +
      i18n.t('throw.genderLabel', { gender: genderText }) +
      i18n.t('throw.mbtiLabel', { mbti: mbtiText }) +
      i18n.t('throw.zodiacLabel', { zodiac: zodiacText });

    await telegram.editMessageText(
      chatId,
      callbackQuery.message!.message_id,
      i18n.t('throw.vip3') + '\n\n' + summary + '\n' + i18n.t('throw.text23'),
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: i18n.t('throw.mbti7'), callback_data: 'filter_mbti' }],
            [{ text: i18n.t('throw.zodiac7'), callback_data: 'filter_zodiac' }],
            [{ text: i18n.t('throw.gender5'), callback_data: 'filter_gender' }],
            [{ text: i18n.t('success.complete6'), callback_data: 'filter_done' }],
            [{ text: i18n.t('buttons.back'), callback_data: 'throw' }],
          ],
        },
      }
    );
  } catch (error) {
    console.error('[handleBackToFilter] Error:', error);
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.systemError'));
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
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n('zh-TW');
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.userNotFound'));
      return;
    }

    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user.language_pref || 'zh-TW');

    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('success.complete7'));

    // Delete filter menu
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Get current session
    const session = await getActiveSession(db, telegramId, 'throw_bottle');
    if (!session) {
      await telegram.sendMessage(chatId, i18n.t('errors.sessionExpired'));
      return;
    }

    const sessionData = parseSessionData(session);
    const selectedMBTI = (sessionData.data?.target_mbti || []) as string[];
    const selectedZodiac = (sessionData.data?.target_zodiac || []) as string[];
    const selectedGender = sessionData.data?.target_gender || 'any';

    // Show filter summary and ask for content
    const genderText =
      selectedGender === 'male'
        ? i18n.t('onboarding.gender.male')
        : selectedGender === 'female'
          ? i18n.t('onboarding.gender.female')
          : '🌈 任何人';
    const mbtiText = selectedMBTI.length > 0 ? selectedMBTI.join(', ') : i18n.t('throw.unlimited');
    const zodiacText =
      selectedZodiac.length > 0
        ? selectedZodiac.map((z) => getZodiacName(z, i18n)).join(', ')
        : i18n.t('throw.unlimited');
    const summary =
      i18n.t('success.settings3') +
      i18n.t('throw.genderLabel', { gender: genderText }) +
      i18n.t('throw.mbtiLabel', { mbti: mbtiText }) +
      i18n.t('throw.zodiacLabel', { zodiac: zodiacText });

    await telegram.sendMessage(
      chatId,
      summary +
        '\n\n' +
        i18n.t('throw.bottle6') +
        '\n\n' +
        i18n.t('throw.tips') +
        i18n.t('common.text112') +
        '\n' +
        i18n.t('common.text93') +
        '\n' +
        i18n.t('common.text77') +
        '\n' +
        i18n.t('throw.text13') +
        '\n' +
        i18n.t('throw.friendlyContent')
    );

    // Update session step
    sessionData.step = 'waiting_content';
    await updateSessionData(db, session.id, sessionData);
  } catch (error) {
    console.error('[handleFilterDone] Error:', error);
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.systemError'));
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
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n('zh-TW');
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.userNotFound'));
      return;
    }

    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user.language_pref || 'zh-TW');

    const session = await getActiveSession(db, telegramId, 'throw_bottle');
    if (!session) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.sessionExpired'));
      return;
    }

    const sessionData = parseSessionData(session);
    sessionData.data = {
      ...sessionData.data,
      target_mbti: [],
    };
    await updateSessionData(db, session.id, sessionData);

    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('success.mbti4'));
    await handleFilterMBTI(callbackQuery, env);
  } catch (error) {
    console.error('[handleClearMBTI] Error:', error);
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.systemError'));
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
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n('zh-TW');
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.userNotFound'));
      return;
    }

    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user.language_pref || 'zh-TW');

    const session = await getActiveSession(db, telegramId, 'throw_bottle');
    if (!session) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.sessionExpired'));
      return;
    }

    const sessionData = parseSessionData(session);
    sessionData.data = {
      ...sessionData.data,
      target_zodiac: [],
    };
    await updateSessionData(db, session.id, sessionData);

    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('success.zodiac'));
    await handleFilterZodiac(callbackQuery, env);
  } catch (error) {
    console.error('[handleClearZodiac] Error:', error);
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.systemError'));
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
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n('zh-TW');
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.userNotFound'));
      return;
    }

    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user.language_pref || 'zh-TW');

    const session = await getActiveSession(db, telegramId, 'throw_bottle');
    if (!session) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.sessionExpired'));
      return;
    }

    await telegram.answerCallbackQuery(callbackQuery.id);
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    const sessionData = parseSessionData(session);
    const currentBloodType = sessionData.data?.target_blood_type || 'any';

    const bloodTypeText =
      currentBloodType === 'any' ? i18n.t('throw.bloodType5') : `🩸 ${currentBloodType} 型`;

    await telegram.sendMessageWithButtons(
      chatId,
      i18n.t('throw.bloodType4') +
        '\n\n' +
        i18n.t('throw.currentSelection', { selection: bloodTypeText }) +
        '\n\n' +
        i18n.t('throw.bloodType5'),
      [
        [
          { text: i18n.t('common.bloodTypeA'), callback_data: 'blood_type_A' },
          { text: i18n.t('common.bloodTypeB'), callback_data: 'blood_type_B' },
        ],
        [
          { text: i18n.t('common.bloodTypeAB'), callback_data: 'blood_type_AB' },
          { text: i18n.t('common.bloodTypeO'), callback_data: 'blood_type_O' },
        ],
        [{ text: i18n.t('throw.bloodType5'), callback_data: 'blood_type_any' }],
        [{ text: i18n.t('buttons.back'), callback_data: 'throw_advanced' }],
      ]
    );
  } catch (error) {
    console.error('[handleFilterBloodType] Error:', error);
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.systemError'));
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
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n('zh-TW');
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.userNotFound'));
      return;
    }

    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user.language_pref || 'zh-TW');

    const session = await getActiveSession(db, telegramId, 'throw_bottle');
    if (!session) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.sessionExpired'));
      return;
    }

    const sessionData = parseSessionData(session);
    sessionData.data = {
      ...sessionData.data,
      target_blood_type: bloodType,
    };
    await updateSessionData(db, session.id, sessionData);

    const bloodTypeText = bloodType === 'any' ? i18n.t('throw.bloodType5') : `🩸 ${bloodType} 型`;

    await telegram.answerCallbackQuery(
      callbackQuery.id,
      i18n.t('common.selected', { selected: bloodTypeText })
    );
    await handleFilterBloodType(callbackQuery, env);
  } catch (error) {
    console.error('[handleBloodTypeSelect] Error:', error);
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.systemError'));
  }
}
