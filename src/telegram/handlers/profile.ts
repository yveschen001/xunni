/**
 * Profile Handler
 *
 * Handles /profile command - view and edit user profile.
 */

import type { Env, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { calculateAge } from '~/domain/user';
import { getInviteStats } from '~/db/queries/invites';
import { calculateDailyQuota, getInviteLimit } from '~/domain/invite';
import { createI18n } from '~/i18n';

export async function handleProfile(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // ✨ NEW: Update user activity (non-blocking)
    try {
      const { updateUserActivity } = await import('~/services/user_activity');
      await updateUserActivity(db, telegramId);
    } catch (activityError) {
      console.error('[handleProfile] Failed to update user activity:', activityError);
    }

    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      const i18n = createI18n('zh-TW');
      await telegram.sendMessage(chatId, i18n.t('profile.userNotFound'));
      return;
    }

    // Debug: Log user language preference
    console.error('[handleProfile] User language_pref:', user.language_pref);
    const i18n = createI18n(user.language_pref || 'zh-TW');
    console.error('[handleProfile] Using i18n language:', user.language_pref || 'zh-TW');

    // Check if user completed onboarding
    if (user.onboarding_step !== 'completed') {
      await telegram.sendMessage(chatId, i18n.t('profile.completeOnboarding'));
      return;
    }

    // Build profile message
    const age = user.birthday ? calculateAge(user.birthday) : i18n.t('profile.settings');
    const gender = user.gender === 'male' ? i18n.t('common.male') : user.gender === 'female' ? i18n.t('common.female') : i18n.t('profile.settings');
    const mbti = user.mbti_result || i18n.t('profile.settings');
    const mbtiSource =
      user.mbti_source === 'manual' ? ` (${i18n.t('profile.manual')})` : user.mbti_source === 'test' ? ` (${i18n.t('profile.test')})` : '';
    const zodiac = user.zodiac_sign || 'Virgo';
    const { getBloodTypeDisplay } = await import('~/domain/blood_type');
    const { createI18n: createI18nForBloodType } = await import('~/i18n');
    const bloodTypeI18n = createI18nForBloodType(user.language_pref || 'zh-TW');
    const bloodType = getBloodTypeDisplay(user.blood_type as any, bloodTypeI18n);
    const vipStatus =
      user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > new Date()
        ? i18n.t('profile.vip', { expireDate: new Date(user.vip_expire_at).toLocaleDateString(user.language_pref || 'zh-TW') })
        : i18n.t('profile.short2');
    const inviteCode = user.invite_code || i18n.t('profile.settings');

    // Format nickname with country flag
    const { formatNicknameWithFlag } = await import('~/utils/country_flag');
    const displayNickname = formatNicknameWithFlag(user.nickname || i18n.t('profile.notSet'), user.country_code);

    // Get invite statistics
    const inviteStats = await getInviteStats(db, telegramId);
    const permanentQuota = calculateDailyQuota(user);
    const inviteLimit = getInviteLimit(user);
    const successfulInvites = user.successful_invites || 0;

    // Calculate task bonus
    const { calculateTaskBonus } = await import('./tasks');
    const taskBonus = await calculateTaskBonus(db, telegramId);
    // const totalQuota = permanentQuota + taskBonus;

    const quotaDisplay = taskBonus > 0 ? `${permanentQuota}+${taskBonus}` : permanentQuota.toString();
    const profileMessage =
      i18n.t('profile.profile2') +
      i18n.t('profile.nickname', { displayNickname }) +
      i18n.t('profile.age', { age }) +
      i18n.t('profile.gender', { gender }) +
      i18n.t('profile.bloodType', { bloodType }) +
      i18n.t('profile.mbtiWithSource', { mbti, source: mbtiSource }) +
      i18n.t('profile.zodiac', { zodiac }) +
      i18n.t('profile.message3', { user: { language_pref: user.language_pref || 'zh-TW' } }) +
      i18n.t('profile.text3', { vipStatus }) +
      i18n.t('profile.separator') +
      i18n.t('profile.invite2') +
      i18n.t('profile.inviteCodeLabel', { inviteCode }) +
      i18n.t('profile.activatedInvites', { successfulInvites, inviteLimit }) +
      i18n.t('profile.invite', { inviteStats: { pending: inviteStats.pending } }) +
      i18n.t('profile.message5', { inviteStats: { conversionRate: inviteStats.conversionRate } }) +
      i18n.t('profile.quotaTotal', { quota: quotaDisplay }) +
      i18n.t('profile.success') +
      i18n.t('profile.quota') +
      (!user.is_vip && successfulInvites >= inviteLimit ? i18n.t('profile.message2', { user: { is_vip: false }, successfulInvites, inviteLimit }) : '') +
      i18n.t('profile.separator') +
      i18n.t('profile.hints') +
      i18n.t('profile.text') +
      i18n.t('profile.mbti') +
      i18n.t('profile.vipUpgrade') +
      i18n.t('profile.stats') +
      i18n.t('profile.returnToMenu');

    const botUsername = env.ENVIRONMENT === 'production' ? 'xunnibot' : 'xunni_dev_bot';
    const shareUrl = i18n.t('profile.message', { botUsername, inviteCode });

    await telegram.sendMessageWithButtons(chatId, profileMessage, [
      [{ text: i18n.t('profile.shareInviteCode'), url: shareUrl }],
      [{ text: i18n.t('profile.editProfile'), callback_data: 'edit_profile_menu' }],
    ]);
  } catch (error) {
    console.error('[handleProfile] Error:', error);
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.sendMessage(chatId, i18n.t('profile.systemError'));
  }
}

/**
 * Handle /profile_card command - show profile card
 */
export async function handleProfileCard(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      const i18n = createI18n('zh-TW');
      await telegram.sendMessage(chatId, i18n.t('profile.userNotFound'));
      return;
    }

    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Check if user completed onboarding
    if (user.onboarding_step !== 'completed') {
      await telegram.sendMessage(chatId, i18n.t('profile.completeOnboarding'));
      return;
    }

    // Build profile card
    const age = user.birthday ? calculateAge(user.birthday) : '?';
    const gender = user.gender === 'male' ? i18n.t('profile.cardGenderMale') : user.gender === 'female' ? i18n.t('profile.cardGenderFemale') : '?';
    const mbti = user.mbti_result || i18n.t('profile.notSet');
    const zodiac = user.zodiac_sign || 'Virgo';
    const interests = user.interests ? JSON.parse(user.interests as string).join(', ') : i18n.t('profile.notSet');
    const bio = user.bio || i18n.t('profile.mysterious');
    const city = user.city || i18n.t('profile.notSet');

    // Format nickname with country flag
    const { formatNicknameWithFlag } = await import('~/utils/country_flag');
    const displayNickname = formatNicknameWithFlag(user.nickname || i18n.t('profile.anonymousUser'), user.country_code);

    const cardMessage =
      i18n.t('profile.cardTitle') +
      `👤 ${displayNickname}\n` +
      `${gender} • ${i18n.t('profile.cardAge', { age })} • ${city}\n\n` +
      i18n.t('profile.cardMbti', { mbti }) +
      i18n.t('profile.cardZodiac', { zodiac }) +
      i18n.t('profile.cardLanguage', { language: user.language_pref || 'zh-TW' }) +
      i18n.t('profile.text2', { interests }) +
      i18n.t('profile.text4', { bio }) +
      i18n.t('profile.cardSeparator') +
      i18n.t('profile.cardFooter') +
      i18n.t('profile.returnToMenu');

    await telegram.sendMessage(chatId, cardMessage);
  } catch (error) {
    console.error('[handleProfileCard] Error:', error);
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.sendMessage(chatId, i18n.t('profile.systemError'));
  }
}
