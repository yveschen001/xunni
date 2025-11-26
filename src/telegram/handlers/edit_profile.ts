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
import { createI18n } from '~/i18n';

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
      const i18n = createI18n('zh-TW');
      await telegram.sendMessage(chatId, i18n.t('errors.userNotFoundRegister'));
      return;
    }

    const i18n = createI18n(user.language_pref || 'zh-TW');

    if (user.onboarding_step !== 'completed') {
      await telegram.sendMessage(chatId, i18n.t('warnings.register2'));
      return;
    }

    // Clear any existing session
    await deleteSession(db, telegramId, SESSION_TYPE);

    // Get match preference text
    const matchPrefText = user.match_preference
      ? user.match_preference === 'male'
        ? i18n.t('common.short84')
        : user.match_preference === 'female'
          ? i18n.t('common.short85')
          : i18n.t('common.short2')
      : user.gender === 'male'
        ? i18n.t('common.short55')
        : i18n.t('common.short56');

    // Get blood type display
    const { getBloodTypeDisplay } = await import('~/domain/blood_type');
    const bloodTypeText = getBloodTypeDisplay(user.blood_type as any, i18n);

    const notSetText = i18n.t('common.notSet');
    
    // Format all values before passing to i18n (handle fallbacks and translations)
    const bioDisplay = user.bio || notSetText;
    const cityDisplay = user.city || notSetText;
    const interestsDisplay = user.interests || notSetText;
    const genderDisplay = user.gender === 'male' ? i18n.t('common.male') : i18n.t('common.female');
    const mbtiDisplay = user.mbti_result || notSetText;

    // Show profile editing menu
    await telegram.sendMessageWithButtons(
      chatId,
      i18n.t('common.profile2') +
        '\n\n' +
        i18n.t('common.text95') +
        '\n\n' +
        i18n.t('common.nickname3', { updatedUser: { nickname: user.nickname } }) +
        '\n' +
        i18n.t('common.settings5', { updatedUser: { bio: bioDisplay } }) +
        '\n' +
        i18n.t('common.settings6', { updatedUser: { city: cityDisplay } }) +
        '\n' +
        i18n.t('common.settings2', { updatedUser: { interests: interestsDisplay } }) +
        '\n' +
        i18n.t('common.text20', { matchPrefText }) +
        '\n' +
        i18n.t('common.bloodType', { bloodTypeText }) +
        '\n\n' +
        i18n.t('common.text27') +
        '\n' +
        i18n.t('common.gender', { gender: genderDisplay }) +
        '\n' +
        i18n.t('common.birthday', { updatedUser: { birthday: user.birthday } }) +
        '\n' +
        i18n.t('common.settings', { updatedUser: { mbti_result: mbtiDisplay } }),
      [
        [
          { text: i18n.t('common.nickname12'), callback_data: 'edit_nickname' },
          { text: i18n.t('common.short30'), callback_data: 'edit_bio' },
        ],
        [
          { text: i18n.t('common.short31'), callback_data: 'edit_region' },
          { text: i18n.t('common.short20'), callback_data: 'edit_interests' },
        ],
        [
          { text: i18n.t('common.short32'), callback_data: 'edit_match_pref' },
          { text: i18n.t('common.bloodType4'), callback_data: 'edit_blood_type' },
        ],
        [{ text: i18n.t('common.mbti9'), callback_data: 'retake_mbti' }],
        [{ text: i18n.t('buttons.back'), callback_data: 'return_to_menu' }],
      ]
    );
  } catch (error) {
    console.error('[handleEditProfile] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.sendMessage(chatId, errorI18n.t('errors.systemErrorRetry'));
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
      const errorI18n = createI18n('zh-TW');
      await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.userNotFound4'));
      return;
    }

    const i18n = createI18n(user.language_pref || 'zh-TW');

    if (user.onboarding_step !== 'completed') {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('warnings.register4'));
      return;
    }

    await telegram.answerCallbackQuery(callbackQuery.id);
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Clear any existing session
    await deleteSession(db, telegramId, SESSION_TYPE);

    // Get match preference text
    const matchPrefText = user.match_preference
      ? user.match_preference === 'male'
        ? i18n.t('common.short84')
        : user.match_preference === 'female'
          ? i18n.t('common.short85')
          : i18n.t('common.short2')
      : user.gender === 'male'
        ? i18n.t('common.short55')
        : i18n.t('common.short56');

    // Get blood type display
    const { getBloodTypeDisplay } = await import('~/domain/blood_type');
    const bloodTypeText = getBloodTypeDisplay(user.blood_type as any, i18n);

    const notSetText = i18n.t('common.notSet');
    
    // Format all values before passing to i18n (handle fallbacks and translations)
    const bioDisplay = user.bio || notSetText;
    const cityDisplay = user.city || notSetText;
    const interestsDisplay = user.interests || notSetText;
    const genderDisplay = user.gender === 'male' ? i18n.t('common.male') : i18n.t('common.female');
    const mbtiDisplay = user.mbti_result || notSetText;

    // Show profile editing menu
    await telegram.sendMessageWithButtons(
      chatId,
      i18n.t('common.profile2') +
        '\n\n' +
        i18n.t('common.text95') +
        '\n\n' +
        i18n.t('common.nickname3', { updatedUser: { nickname: user.nickname } }) +
        '\n' +
        i18n.t('common.settings5', { updatedUser: { bio: bioDisplay } }) +
        '\n' +
        i18n.t('common.settings6', { updatedUser: { city: cityDisplay } }) +
        '\n' +
        i18n.t('common.settings2', { updatedUser: { interests: interestsDisplay } }) +
        '\n' +
        i18n.t('common.text20', { matchPrefText }) +
        '\n' +
        i18n.t('common.bloodType', { bloodTypeText }) +
        '\n\n' +
        i18n.t('common.text27') +
        '\n' +
        i18n.t('common.gender', { gender: genderDisplay }) +
        '\n' +
        i18n.t('common.birthday', { updatedUser: { birthday: user.birthday } }) +
        '\n' +
        i18n.t('common.settings', { updatedUser: { mbti_result: mbtiDisplay } }),
      [
        [
          { text: i18n.t('common.nickname12'), callback_data: 'edit_nickname' },
          { text: i18n.t('common.short30'), callback_data: 'edit_bio' },
        ],
        [
          { text: i18n.t('common.short31'), callback_data: 'edit_region' },
          { text: i18n.t('common.short20'), callback_data: 'edit_interests' },
        ],
        [
          { text: i18n.t('common.short32'), callback_data: 'edit_match_pref' },
          { text: i18n.t('common.bloodType4'), callback_data: 'edit_blood_type' },
        ],
        [{ text: i18n.t('common.mbti9'), callback_data: 'retake_mbti' }],
        [{ text: i18n.t('buttons.back'), callback_data: 'return_to_menu' }],
      ]
    );
  } catch (error) {
    console.error('[handleEditProfileCallback] Error:', error);
    console.error('[handleEditProfileCallback] Error stack:', error instanceof Error ? error.stack : 'No stack');
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short4'));
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
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    await telegram.answerCallbackQuery(callbackQuery.id);
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Create session
    console.error('[handleEditNickname] Creating session for user:', telegramId);
    await upsertSession(db, telegramId, SESSION_TYPE, { data: { editing: 'nickname' } });
    console.error('[handleEditNickname] Session created successfully');

    await telegram.sendMessageWithButtons(
      chatId,
      i18n.t('common.nickname6') +
        '\n\n' +
        i18n.t('common.nickname10') +
        '\n\n' +
        i18n.t('common.nickname11') +
        '\n' +
        i18n.t('common.nickname5') +
        '\n' +
        i18n.t('common.text79') +
        '\n' +
        i18n.t('common.nickname') +
        '\n' +
        i18n.t('common.ad6') +
        '\n\n' +
        i18n.t('common.back'),
      [
        [{ text: i18n.t('buttons.back'), callback_data: 'edit_profile_callback' }],
      ]
    );
  } catch (error) {
    console.error('[handleEditNickname] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short4'));
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
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    await telegram.answerCallbackQuery(callbackQuery.id);
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Create session
    await upsertSession(db, telegramId, SESSION_TYPE, { data: { editing: 'bio' } });

    await telegram.sendMessageWithButtons(
      chatId,
      i18n.t('common.text68') +
        '\n\n' +
        i18n.t('common.text96') +
        '\n\n' +
        i18n.t('common.text68') +
        '\n' +
        i18n.t('common.text97') +
        '\n' +
        i18n.t('common.text58') +
        '\n' +
        i18n.t('common.text98') +
        '\n\n' +
        i18n.t('common.back'),
      [
        [{ text: i18n.t('buttons.back'), callback_data: 'edit_profile_callback' }],
      ]
    );
  } catch (error) {
    console.error('[handleEditBio] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short4'));
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

  console.error('[handleEditRegion] Called with callback data:', callbackQuery.data);

  try {
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    await telegram.answerCallbackQuery(callbackQuery.id);
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Create session
    await upsertSession(db, telegramId, SESSION_TYPE, { data: { editing: 'region' } });

    await telegram.sendMessageWithButtons(
      chatId,
      i18n.t('common.text87') +
        '\n\n' +
        i18n.t('common.text114') +
        '\n\n' +
        i18n.t('common.text68') +
        '\n' +
        i18n.t('common.text88') +
        '\n' +
        i18n.t('common.text89') +
        '\n\n' +
        i18n.t('common.back'),
      [
        [{ text: i18n.t('buttons.back'), callback_data: 'edit_profile_callback' }],
      ]
    );
  } catch (error) {
    console.error('[handleEditRegion] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short4'));
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
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      const errorI18n = createI18n('zh-TW');
      await telegram.sendMessage(chatId, errorI18n.t('errors.userNotFound7'));
      return;
    }

    const i18n = createI18n(user.language_pref || 'zh-TW');

    await telegram.answerCallbackQuery(callbackQuery.id);
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    await telegram.sendMessageWithButtons(
      chatId,
      i18n.t('common.short32') +
        '\n\n' +
        i18n.t('common.bottle12') +
        '\n\n' +
        i18n.t('common.text68') +
        '\n' +
        i18n.t('common.text27') +
        '\n' +
        i18n.t('common.bottle16'),
      [
        [
          { text: i18n.t('common.short84'), callback_data: 'match_pref_male' },
          { text: i18n.t('common.short85'), callback_data: 'match_pref_female' },
        ],
        [{ text: i18n.t('common.short2'), callback_data: 'match_pref_any' }],
        [{ text: i18n.t('buttons.back'), callback_data: 'edit_profile_back' }],
      ]
    );
  } catch (error) {
    console.error('[handleEditMatchPref] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short4'));
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
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('common.short33'));

    await db.d1
      .prepare('UPDATE users SET match_preference = ? WHERE telegram_id = ?')
      .bind(preference, telegramId)
      .run();

    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    const prefText = preference === 'male' ? i18n.t('common.short84') : preference === 'female' ? i18n.t('common.short85') : i18n.t('common.short2');
    await telegram.sendMessageWithButtons(
      chatId,
      i18n.t('success.text3', { prefText }) +
        '\n\n' +
        i18n.t('common.bottle16'),
      [
        [{ text: i18n.t('common.short3'), callback_data: 'edit_profile_callback' }],
        [{ text: i18n.t('common.back3'), callback_data: 'return_to_menu' }],
      ]
    );
  } catch (error) {
    console.error('[handleMatchPrefSelection] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short4'));
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
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    await telegram.answerCallbackQuery(callbackQuery.id);
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Create session
    await upsertSession(db, telegramId, SESSION_TYPE, { data: { editing: 'interests' } });

    await telegram.sendMessageWithButtons(
      chatId,
      i18n.t('common.text59') +
        '\n\n' +
        i18n.t('common.text39') +
        '\n\n' +
        i18n.t('common.text68') +
        '\n' +
        i18n.t('common.text40') +
        '\n' +
        i18n.t('common.text116') +
        '\n' +
        i18n.t('common.text47') +
        '\n\n' +
        i18n.t('common.back'),
      [
        [{ text: i18n.t('buttons.back'), callback_data: 'edit_profile_callback' }],
      ]
    );
  } catch (error) {
    console.error('[handleEditInterests] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short4'));
  }
}

/**
 * Handle edit blood type callback
 */
export async function handleEditBloodType(
  callbackQuery: TelegramCallbackQuery,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    await telegram.answerCallbackQuery(callbackQuery.id);
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Get blood type options
    const { getBloodTypeOptions } = await import('~/domain/blood_type');
    const options = getBloodTypeOptions(i18n);

    await telegram.sendMessageWithButtons(
      chatId,
      i18n.t('common.bloodType2') +
        '\n\n' +
        i18n.t('common.vip8') +
        '\n\n' +
        i18n.t('common.bloodType3'),
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
        [{ text: i18n.t('buttons.back'), callback_data: 'edit_profile_callback' }],
      ]
    );
  } catch (error) {
    console.error('[handleEditBloodType] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short4'));
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

    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    // Get display text
    const { getBloodTypeDisplay } = await import('~/domain/blood_type');
    const bloodTypeDisplay = bloodType ? getBloodTypeDisplay(bloodType as any, i18n) : '';
    const displayText = bloodType
      ? i18n.t('success.bloodType').replace(/\$\{getBloodTypeDisplay\(bloodType as any\)\}/, bloodTypeDisplay)
      : i18n.t('success.bloodType2');

    await telegram.answerCallbackQuery(callbackQuery.id, displayText);
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Show success message with buttons
    await telegram.sendMessageWithButtons(chatId, displayText, [
      [{ text: i18n.t('common.short3'), callback_data: 'edit_profile_callback' }],
      [{ text: i18n.t('common.back3'), callback_data: 'return_to_menu' }],
    ]);
  } catch (error) {
    console.error('[handleEditBloodTypeSelection] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short4'));
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

    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Handle different edit types
    switch (editing) {
      case 'nickname': {
        // Validate nickname length (4-36 characters)
        if (text.length < 4) {
          await telegram.sendMessageWithButtons(
            chatId,
            i18n.t('errors.error.cancel4') +
              '\n\n' +
              i18n.t('common.cancel3'),
            [[{ text: i18n.t('errors.error.cancel6'), callback_data: 'edit_profile_callback' }]]
          );
          return true;
        }

        if (text.length > 36) {
          await telegram.sendMessageWithButtons(
            chatId,
            i18n.t('errors.error.cancel') +
              '\n\n' +
              i18n.t('common.cancel3'),
            [[{ text: i18n.t('errors.error.cancel6'), callback_data: 'edit_profile_callback' }]]
          );
          return true;
        }

        // Check for URLs in nickname
        const { checkUrlWhitelist } = await import('~/utils/url-whitelist');
        const urlCheck = checkUrlWhitelist(text);
        if (!urlCheck.allowed) {
          await telegram.sendMessageWithButtons(
            chatId,
            i18n.t('errors.error.nickname2') +
              '\n\n' +
              i18n.t('common.nickname') +
              '\n\n' +
              i18n.t('common.cancel3'),
            [[{ text: i18n.t('errors.error.cancel6'), callback_data: 'edit_profile_callback' }]]
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
          await telegram.sendMessage(chatId, i18n.t('errors.systemErrorRetry'));
          return true;
        }

        const updatedI18n = createI18n(updatedUser.language_pref || 'zh-TW');

        // Get match preference text
        const matchPrefText = updatedUser.match_preference
          ? updatedUser.match_preference === 'male'
            ? updatedI18n.t('common.short84')
            : updatedUser.match_preference === 'female'
              ? updatedI18n.t('common.short85')
              : updatedI18n.t('common.short2')
          : updatedUser.gender === 'male'
            ? updatedI18n.t('common.short55')
            : updatedI18n.t('common.short56');

        // Get blood type display
        const { getBloodTypeDisplay } = await import('~/domain/blood_type');
        const bloodTypeText = getBloodTypeDisplay(updatedUser.blood_type as any, updatedI18n);

        const notSetText = updatedI18n.t('common.notSet');
        
        // Format all values before passing to i18n (handle fallbacks and translations)
        const bioDisplay = updatedUser.bio || notSetText;
        const cityDisplay = updatedUser.city || notSetText;
        const interestsDisplay = updatedUser.interests || notSetText;
        const genderDisplay = updatedUser.gender === 'male' ? updatedI18n.t('common.male') : updatedI18n.t('common.female');
        const mbtiDisplay = updatedUser.mbti_result || notSetText;

        // Show success message and editing menu
        await telegram.sendMessageWithButtons(
          chatId,
          updatedI18n.t('success.nickname2', { text }) +
            '\n\n' +
            '━━━━━━━━━━━━━━━━\n\n' +
            updatedI18n.t('common.profile2') +
            '\n\n' +
            updatedI18n.t('common.nickname3', { updatedUser: { nickname: updatedUser.nickname } }) +
            '\n' +
            updatedI18n.t('common.settings5', { updatedUser: { bio: bioDisplay } }) +
            '\n' +
            updatedI18n.t('common.settings6', { updatedUser: { city: cityDisplay } }) +
            '\n' +
            updatedI18n.t('common.settings2', { updatedUser: { interests: interestsDisplay } }) +
            '\n' +
            updatedI18n.t('common.text20', { matchPrefText }) +
            '\n' +
            updatedI18n.t('common.bloodType', { bloodTypeText }) +
            '\n\n' +
            updatedI18n.t('common.text27') +
            '\n' +
            updatedI18n.t('common.gender', { gender: genderDisplay }) +
            '\n' +
            updatedI18n.t('common.birthday', { updatedUser: { birthday: updatedUser.birthday } }) +
            '\n' +
            updatedI18n.t('common.settings', { updatedUser: { mbti_result: mbtiDisplay } }),
          [
            [
              { text: updatedI18n.t('common.nickname12'), callback_data: 'edit_nickname' },
              { text: updatedI18n.t('common.short30'), callback_data: 'edit_bio' },
            ],
            [
              { text: updatedI18n.t('common.short31'), callback_data: 'edit_region' },
              { text: updatedI18n.t('common.short20'), callback_data: 'edit_interests' },
            ],
            [
              { text: updatedI18n.t('common.short32'), callback_data: 'edit_match_pref' },
              { text: updatedI18n.t('common.bloodType4'), callback_data: 'edit_blood_type' },
            ],
            [{ text: updatedI18n.t('common.mbti9'), callback_data: 'retake_mbti' }],
            [{ text: updatedI18n.t('common.back3'), callback_data: 'return_to_menu' }],
          ]
        );
        return true;
      }

      case 'bio': {
        if (text.length > 200) {
          await telegram.sendMessageWithButtons(
            chatId,
            i18n.t('errors.error.cancel2') +
              '\n\n' +
              i18n.t('common.cancel3'),
            [[{ text: i18n.t('errors.error.cancel6'), callback_data: 'edit_profile_callback' }]]
          );
          return true;
        }

        // Check for URLs
        const { checkUrlWhitelist } = await import('~/utils/url-whitelist');
        const urlCheck = checkUrlWhitelist(text);
        if (!urlCheck.allowed) {
          const blockedUrls = urlCheck.blockedUrls?.map((url) => `• ${url}`).join('\n') || '';
          await telegram.sendMessageWithButtons(
            chatId,
            i18n.t('errors.error.text2') +
              '\n\n' +
              i18n.t('common.text60') +
              '\n' +
              '• t.me (Telegram)\n' +
              '• telegram.org\n' +
              '• telegram.me\n\n' +
              i18n.t('common.message18', { blockedUrls }) +
              '\n\n' +
              i18n.t('common.cancel'),
            [[{ text: i18n.t('errors.error.cancel6'), callback_data: 'edit_profile_callback' }]]
          );
          return true;
        }

        await db.d1
          .prepare('UPDATE users SET bio = ? WHERE telegram_id = ?')
          .bind(text, telegramId)
          .run();

        // Check and complete "bio" task
        try {
          const updatedUser = await findUserByTelegramId(db, telegramId);
          if (updatedUser) {
            const { checkAndCompleteTask } = await import('./tasks');
            await checkAndCompleteTask(db, telegram, updatedUser, 'task_bio');
          }
        } catch (taskError) {
          console.error('[handleProfileEditInput] Task check error:', taskError);
        }

        await deleteSession(db, telegramId, SESSION_TYPE);
        await telegram.sendMessageWithButtons(chatId, i18n.t('success.text4', { text }), [
          [{ text: i18n.t('common.short3'), callback_data: 'edit_profile_callback' }],
          [{ text: i18n.t('common.back3'), callback_data: 'return_to_menu' }],
        ]);
        return true;
      }

      case 'region': {
        if (text.length > 50) {
          await telegram.sendMessageWithButtons(
            chatId,
            i18n.t('errors.error.cancel3') +
              '\n\n' +
              i18n.t('common.cancel3'),
            [[{ text: i18n.t('errors.error.cancel6'), callback_data: 'edit_profile_callback' }]]
          );
          return true;
        }

        await db.d1
          .prepare('UPDATE users SET city = ? WHERE telegram_id = ?')
          .bind(text, telegramId)
          .run();

        // Check and complete "city" task
        try {
          const updatedUser = await findUserByTelegramId(db, telegramId);
          if (updatedUser) {
            const { checkAndCompleteTask } = await import('./tasks');
            await checkAndCompleteTask(db, telegram, updatedUser, 'task_city');
          }
        } catch (taskError) {
          console.error('[handleProfileEditInput] Task check error:', taskError);
        }

        await deleteSession(db, telegramId, SESSION_TYPE);
        await telegram.sendMessageWithButtons(chatId, i18n.t('success.text6', { text }), [
          [{ text: i18n.t('common.short3'), callback_data: 'edit_profile_callback' }],
          [{ text: i18n.t('common.back3'), callback_data: 'return_to_menu' }],
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
            i18n.t('errors.error.cancel5') +
              '\n\n' +
              i18n.t('common.cancel3'),
            [[{ text: i18n.t('errors.error.cancel6'), callback_data: 'edit_profile_callback' }]]
          );
          return true;
        }

        if (interests.some((i) => i.length > 20)) {
          await telegram.sendMessageWithButtons(
            chatId,
            i18n.t('errors.error.cancel5') +
              '\n\n' +
              i18n.t('common.cancel3'),
            [[{ text: i18n.t('errors.error.cancel6'), callback_data: 'edit_profile_callback' }]]
          );
          return true;
        }

        const interestsStr = interests.join(', ');
        await db.d1
          .prepare('UPDATE users SET interests = ? WHERE telegram_id = ?')
          .bind(interestsStr, telegramId)
          .run();

        // Check and complete "interests" task
        try {
          const updatedUser = await findUserByTelegramId(db, telegramId);
          if (updatedUser) {
            const { checkAndCompleteTask } = await import('./tasks');
            await checkAndCompleteTask(db, telegram, updatedUser, 'task_interests');
          }
        } catch (taskError) {
          console.error('[handleProfileEditInput] Task check error:', taskError);
        }

        await deleteSession(db, telegramId, SESSION_TYPE);
        await telegram.sendMessageWithButtons(chatId, i18n.t('success.text2', { interestsStr }), [
          [{ text: i18n.t('common.short3'), callback_data: 'edit_profile_callback' }],
          [{ text: i18n.t('common.back3'), callback_data: 'return_to_menu' }],
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
