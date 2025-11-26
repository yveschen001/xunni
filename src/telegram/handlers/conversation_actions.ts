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
    // Get user for i18n
    const viewer = await findUserByTelegramId(db, telegramId);
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(viewer?.language_pref || 'zh-TW');
    
    // Get conversation
    const conversation = await getConversationById(db, conversationId);
    if (!conversation) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.conversationNotFound'));
      return;
    }

    // Get other user ID
    const otherUserId = getOtherUserId(conversation, telegramId);
    if (!otherUserId) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.conversationInfoError'));
      return;
    }

    // Get other user info
    const otherUser = await findUserByTelegramId(db, otherUserId);
    if (!otherUser) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.userNotFound'));
      return;
    }

    await telegram.answerCallbackQuery(callbackQuery.id);

    // Get viewer's VIP status (already fetched above)
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
      isVip, // VIP gets original, free users get blurred
      otherUser.gender || undefined,
      false // Don't force refresh
    );

    // Calculate age
    const birthDate = otherUser.birthday ? new Date(otherUser.birthday) : null;
    let ageRange = i18n.t('common.notSet');
    if (birthDate && !Number.isNaN(birthDate.getTime())) {
      const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      ageRange = `${Math.floor(age / 5) * 5}-${Math.floor(age / 5) * 5 + 4}`;
    }

    const nickname = maskNickname(otherUser.nickname || otherUser.username || i18n.t('common.anonymous'));
    const languageLabel = otherUser.language_pref || i18n.t('common.notSet');
    const zodiacLabel = otherUser.zodiac_sign || 'Virgo';

    // Get blood type display
    const { getBloodTypeDisplay } = await import('~/domain/blood_type');
    const bloodTypeTextRaw = getBloodTypeDisplay(otherUser.blood_type as any);
    const bloodTypeText = otherUser.blood_type ? bloodTypeTextRaw : i18n.t('common.notSet');

    // Format nickname with country flag
    const { formatNicknameWithFlag } = await import('~/utils/country_flag');
    const displayNickname = formatNicknameWithFlag(nickname, otherUser.country_code);

    // Build anonymous profile card
    let profileMessage = i18n.t('conversation.profileCardTitle') + '\n\n';
    profileMessage += i18n.t('conversation.separator') + '\n';
    profileMessage += i18n.t('conversation.nickname2', { displayNickname }) + '\n';
    profileMessage += i18n.t('conversation.text3', { languageLabel }) + '\n';
    profileMessage += i18n.t('conversation.settings', { otherUser: { mbti_result: otherUser.mbti_result } }) + '\n';
    profileMessage += i18n.t('conversation.zodiac2', { zodiacLabel }) + '\n';
    profileMessage += i18n.t('conversation.bloodType2', { bloodTypeText }) + '\n';
    const genderText = otherUser.gender === 'male' ? i18n.t('common.male') : otherUser.gender === 'female' ? i18n.t('common.female') : i18n.t('common.notSet');
    profileMessage += i18n.t('conversation.gender', { gender: genderText }) + '\n';
    profileMessage += i18n.t('conversation.age', { ageRange }) + '\n';

    if (otherUser.city) {
      profileMessage += i18n.t('conversation.text4', { otherUser }) + '\n';
    }

    if (otherUser.interests) {
      profileMessage += i18n.t('conversation.message8', { otherUser }) + '\n';
    }

    if (otherUser.bio) {
      profileMessage += i18n.t('conversation.text5', { otherUser }) + '\n';
    }

    profileMessage += i18n.t('conversation.separator') + '\n\n';
    profileMessage += i18n.t('conversation.anonymousCardHint') + '\n\n';

    // Add VIP hint for free users
    if (!isVip) {
      profileMessage += i18n.t('conversation.vipUnlockAvatar') + '\n';
      profileMessage += i18n.t('conversation.vipLearnMore') + '\n\n';
    }

    profileMessage += i18n.t('conversation.replyMethodsTitle') + '\n';
    profileMessage += i18n.t('conversation.replyMethod1') + '\n';
    profileMessage += i18n.t('conversation.replyMethod2') + '\n\n';
    profileMessage += i18n.t('conversation.editProfileCommand') + '\n';
    profileMessage += i18n.t('conversation.backToMenuCommand');

    // Build buttons
    const buttons = [[{ text: i18n.t('conversation.replyButton'), callback_data: `conv_reply_${identifier}` }]];

    // Add ad/task button for non-VIP users
    if (!isVip) {
      const { getNextIncompleteTask } = await import('./tasks');
      const { getAdPrompt } = await import('~/domain/ad_prompt');
      const { getTodayAdReward } = await import('~/db/queries/ad_rewards');

      const nextTask = await getNextIncompleteTask(db, viewer);
      const adReward = await getTodayAdReward(db.d1, viewer.telegram_id);

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

    // Send with avatar and buttons if available
    if (partnerAvatarUrl && !partnerAvatarUrl.includes('default-avatar')) {
      try {
        await telegram.sendPhoto(chatId, partnerAvatarUrl, {
          caption: profileMessage,
          reply_markup: {
            inline_keyboard: buttons,
          },
        });
      } catch (photoError) {
        console.error(
          '[handleConversationProfile] Failed to send photo, falling back to text:',
          photoError
        );
        // Fallback to text message with buttons
        await telegram.sendMessageWithButtons(chatId, profileMessage, buttons);
      }
    } else {
      // No avatar, send as text with buttons
      await telegram.sendMessageWithButtons(chatId, profileMessage, buttons);
    }
  } catch (error) {
    console.error('[handleConversationProfile] Error:', error);
    const viewer = await findUserByTelegramId(db, callbackQuery.from.id.toString());
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(viewer?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.systemError'));
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
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;

  try {
    const user = await findUserByTelegramId(db, callbackQuery.from.id.toString());
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    await telegram.answerCallbackQuery(callbackQuery.id);

    // Show confirmation
    await telegram.sendMessageWithButtons(
      chatId,
      i18n.t('conversation.blockConfirmTitle') + '\n\n' + i18n.t('conversation.blockConfirmMessage'),
      [
        [
          { text: i18n.t('conversation.blockConfirmButton'), callback_data: `conv_block_confirm_${conversationId}` },
          { text: i18n.t('conversation.cancelButton'), callback_data: 'conv_cancel' },
        ],
      ]
    );
  } catch (error) {
    console.error('[handleConversationBlock] Error:', error);
    const db = createDatabaseClient(env.DB);
    const user = await findUserByTelegramId(db, callbackQuery.from.id.toString());
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.systemError'));
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
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;

  try {
    const user = await findUserByTelegramId(db, callbackQuery.from.id.toString());
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    await telegram.answerCallbackQuery(callbackQuery.id);

    // Show confirmation
    await telegram.sendMessageWithButtons(
      chatId,
      i18n.t('conversation.reportConfirmTitle') + '\n\n' + i18n.t('conversation.reportConfirmMessage'),
      [
        [
          { text: i18n.t('conversation.reportConfirmButton'), callback_data: `conv_report_confirm_${conversationId}` },
          { text: i18n.t('conversation.cancelButton'), callback_data: 'conv_cancel' },
        ],
      ]
    );
  } catch (error) {
    console.error('[handleConversationReport] Error:', error);
    const db = createDatabaseClient(env.DB);
    const user = await findUserByTelegramId(db, callbackQuery.from.id.toString());
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.systemError'));
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
    const user = await findUserByTelegramId(db, telegramId);
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    // Get conversation
    const conversation = await getConversationById(db, conversationId);
    if (!conversation) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.conversationNotFound'));
      return;
    }

    // Get other user ID
    const otherUserId = getOtherUserId(conversation, telegramId);
    if (!otherUserId) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.conversationInfoError'));
      return;
    }

    // Get other user for i18n
    const otherUser = await findUserByTelegramId(db, otherUserId);
    const _otherI18n = createI18n(otherUser?.language_pref || 'zh-TW');

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

    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('conversation.blocked'));
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    await telegram.sendMessage(chatId, i18n.t('conversation.blockSuccessTitle') + '\n\n' + i18n.t('conversation.blockSuccessMessage'));

    // Notify other user (without revealing block)
    await telegram.sendMessage(
      parseInt(otherUserId),
      i18n.t('conversation.blockSuccessNewConversation')
    );
  } catch (error) {
    console.error('[handleConversationBlockConfirm] Error:', error);
    const user = await findUserByTelegramId(db, callbackQuery.from.id.toString());
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.systemError'));
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
    const user = await findUserByTelegramId(db, telegramId);
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    // Get conversation
    const conversation = await getConversationById(db, conversationId);
    if (!conversation) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.conversationNotFound'));
      return;
    }

    // Get other user ID
    const otherUserId = getOtherUserId(conversation, telegramId);
    if (!otherUserId) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.conversationInfoError'));
      return;
    }

    // Get other user for i18n
    const otherUser = await findUserByTelegramId(db, otherUserId);
    const _otherI18n = createI18n(otherUser?.language_pref || 'zh-TW');

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

    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('conversation.reported'));
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    await telegram.sendMessage(chatId, i18n.t('conversation.reportSuccessTitle') + '\n\n' + i18n.t('conversation.reportSuccessMessage'));

    // Notify other user (without revealing report)
    await telegram.sendMessage(
      parseInt(otherUserId),
      i18n.t('conversation.reportSuccessNewConversation')
    );
  } catch (error) {
    console.error('[handleConversationReportConfirm] Error:', error);
    const user = await findUserByTelegramId(db, callbackQuery.from.id.toString());
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.systemError'));
  }
}

/**
 * Cancel action
 */
export async function handleConversationCancel(callbackQuery: any, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;

  try {
    const user = await findUserByTelegramId(db, callbackQuery.from.id.toString());
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('conversation.cancelSuccess'));
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);
  } catch (error) {
    console.error('[handleConversationCancel] Error:', error);
    const user = await findUserByTelegramId(db, callbackQuery.from.id.toString());
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.systemError'));
  }
}
