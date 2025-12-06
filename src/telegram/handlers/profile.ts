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
import { formatNicknameWithFlag } from '~/utils/country_flag';
import { maskNickname } from '~/utils/nickname';

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
    const gender =
      user.gender === 'male'
        ? i18n.t('common.male')
        : user.gender === 'female'
          ? i18n.t('common.female')
          : i18n.t('profile.settings');
    const mbti = user.mbti_result || i18n.t('profile.settings');
    const mbtiSource =
      user.mbti_source === 'manual'
        ? ` (${i18n.t('profile.manual')})`
        : user.mbti_source === 'test'
          ? ` (${i18n.t('profile.test')})`
          : '';
    const { getZodiacDisplay } = await import('~/domain/zodiac');
    const zodiac = getZodiacDisplay(user.zodiac_sign, i18n);
    const { getBloodTypeDisplay } = await import('~/domain/blood_type');
    const { createI18n: createI18nForBloodType } = await import('~/i18n');
    const bloodTypeI18n = createI18nForBloodType(user.language_pref || 'zh-TW');
    const bloodType = getBloodTypeDisplay(user.blood_type as any, bloodTypeI18n);
    
    let vipStatus = i18n.t('profile.short2');
    if (user.is_vip && user.vip_expire_at) {
      const expireDate = new Date(user.vip_expire_at);
      const now = new Date();
      if (expireDate > now) {
        const diffTime = Math.abs(expireDate.getTime() - now.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
         
        vipStatus = i18n.t('profile.vipWithDays', {
          expireDate: expireDate.toLocaleDateString(user.language_pref || 'zh-TW'),
          days: diffDays
        });
      }
    }

    const inviteCode = user.invite_code || i18n.t('profile.settings');

    // Format nickname with country flag
    const displayNickname = formatNicknameWithFlag(
      user.nickname || i18n.t('profile.notSet'),
      user.country_code
    );

    // Get invite statistics
    const inviteStats = await getInviteStats(db, telegramId);
    
    // Calculate Quotas
    const { getDailyThrowCount } = await import('~/db/queries/bottles');
    const { getTodayAdReward } = await import('~/db/queries/ad_rewards');
    
    const permanentQuota = calculateDailyQuota(user);
    const inviteLimit = getInviteLimit(user);
    const successfulInvites = user.successful_invites || 0;

    // Calculate task bonus
    const { calculateTaskBonus } = await import('./tasks');
    const taskBonus = await calculateTaskBonus(db, telegramId);
    
    // Ad Bonus
    const adReward = await getTodayAdReward(db.d1, telegramId);
    const adBonus = adReward?.quota_earned || 0;

    // Total & Remaining
    const totalDailyQuota = permanentQuota + taskBonus + adBonus;
    const throwsToday = await getDailyThrowCount(db, telegramId);
    const remainingQuota = Math.max(0, totalDailyQuota - throwsToday);
    const temporaryQuota = taskBonus + adBonus;

    // Display string: "Remaining / Permanent + Temporary"
    let quotaDisplay = `${remainingQuota} / ${permanentQuota}`;
    if (temporaryQuota > 0) {
      quotaDisplay += ` + ${temporaryQuota}`;
    }

    // Get Fortune Quota
    const { FortuneService } = await import('~/services/fortune');
    const fortuneService = new FortuneService(env, db.d1);
    const fortuneQuota = await fortuneService.refreshQuota(telegramId, !!user.is_vip);
    
    const fortuneTotal = fortuneQuota.weekly_free_quota + fortuneQuota.additional_quota;
    const fortuneWeeklyLimit = user.is_vip ? 7 : 1; // Logic synced with service
    
    const fortuneQuotaDisplay = i18n.t('profile.fortuneQuota', {
      fortuneBottle: i18n.t('common.fortuneBottle'),
      total: fortuneTotal,
      weekly: fortuneQuota.weekly_free_quota,
      limit: fortuneWeeklyLimit,
      additional: fortuneQuota.additional_quota
    });

    const profileMessage =
      i18n.t('profile.profile2') +
      i18n.t('profile.nickname', { displayNickname }) +
      `ID: \`${telegramId}\`\n` + // ✨ NEW: Add User ID
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
      i18n.t('profile.driftBottleInfo', { remaining: remainingQuota, total: totalDailyQuota }) + '\n' + // ✨ NEW: Explicit bottle info
      fortuneQuotaDisplay + '\n' + // Add Fortune Quota here
      i18n.t('profile.success') +
      i18n.t('profile.quota') +
      (!user.is_vip && successfulInvites >= inviteLimit
        ? i18n.t('profile.message2', { user: { is_vip: false }, successfulInvites, inviteLimit })
        : '') +
      i18n.t('profile.separator') +
      i18n.t('profile.hints') +
      i18n.t('profile.text') +
      i18n.t('profile.mbti') +
      i18n.t('profile.vipUpgrade') +
      i18n.t('profile.stats') +
      i18n.t('profile.returnToMenu');

    const botUsername = env.ENVIRONMENT === 'production' ? 'xunnibot' : 'xunni_dev_bot';
    const shareText = i18n.t('profile.message', { botUsername, inviteCode });
    const botLink = `https://t.me/${botUsername}?start=${inviteCode}`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(botLink)}&text=${encodeURIComponent(shareText)}`;

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
 * Handle /profile_card command - show profile card (SELF or OTHER)
 * 
 * If context is OTHER (viewing someone else's profile):
 * - Show Main Action buttons (Reply, Fortune Match, Gift)
 * - Show "More Options" button
 */
export async function handleProfileCard(
  message: TelegramMessage, 
  env: Env,
  targetUserId?: string, // If provided, viewing other's profile
  conversationId?: number // Context for reply button
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // Viewer (Current User)
    const viewer = await findUserByTelegramId(db, telegramId);
    if (!viewer) {
      const i18n = createI18n('zh-TW');
      await telegram.sendMessage(chatId, i18n.t('profile.userNotFound'));
      return;
    }
    const i18n = createI18n(viewer.language_pref || 'zh-TW');

    // Target User (Self if not provided)
    const targetId = targetUserId || telegramId;
    const targetUser = await findUserByTelegramId(db, targetId);
    
    if (!targetUser) {
      await telegram.sendMessage(chatId, i18n.t('profile.userNotFound'));
      return;
    }

    const isSelf = targetId === telegramId;

    // Check if user completed onboarding
    if (viewer.onboarding_step !== 'completed') {
      await telegram.sendMessage(chatId, i18n.t('profile.completeOnboarding'));
      return;
    }

    // Build profile card
    const age = targetUser.birthday ? calculateAge(targetUser.birthday) : null;
    const ageDisplay = age
      ? i18n.t('profile.ageRange', {
          min: Math.floor(age / 5) * 5,
          max: Math.floor(age / 5) * 5 + 5,
        })
      : '?';
    const gender =
      targetUser.gender === 'male'
        ? i18n.t('profile.cardGenderMale')
        : targetUser.gender === 'female'
          ? i18n.t('profile.cardGenderFemale')
          : '?';

    let mbti = i18n.t('profile.notSet');
    if (targetUser.mbti_result) {
      const code = targetUser.mbti_result;
      const title = i18n.t(`mbti.titles.${code}`, { defaultValue: '' });
      mbti = title ? `${code} (${title})` : code;
    }

    const { getZodiacDisplay } = await import('~/domain/zodiac');
    const zodiac = getZodiacDisplay(targetUser.zodiac_sign, i18n);
    const interests = targetUser.interests
      ? JSON.parse(targetUser.interests as string).join(', ')
      : i18n.t('profile.notSet');
    const bio = targetUser.bio || i18n.t('profile.mysterious');
    const city = targetUser.city || i18n.t('profile.notSet');

    // Format nickname with country flag
    const displayNickname = formatNicknameWithFlag(
      targetUser.nickname || i18n.t('profile.anonymousUser'),
      targetUser.country_code
    );

    // Check if viewer gifted VIP to target (NEW)
    let giftedNote = '';
    if (!isSelf) {
      const giftRecord = await db.d1.prepare(`
        SELECT 1 FROM payments 
        WHERE telegram_id = ? AND recipient_telegram_id = ? AND is_gift = 1 AND status = 'completed'
      `).bind(telegramId, targetId).first();
      
      if (giftRecord) {
        giftedNote = `\n[ ${i18n.t('profile.giftedVipNote')} ]`; // Need to add key
      }
    }

    const cardMessage =
      i18n.t('profile.cardTitle') +
      `👤 ${displayNickname}` + giftedNote + `\n` +
      `${gender} • ${ageDisplay} • ${city}\n\n` +
      i18n.t('profile.cardMbti', { mbti }) +
      i18n.t('profile.cardZodiac', { zodiac }) +
      i18n.t('profile.cardLanguage', { language: targetUser.language_pref || 'zh-TW' }) +
      i18n.t('profile.text2', { interests }) +
      i18n.t('profile.text4', { bio }) +
      i18n.t('profile.cardSeparator') +
      i18n.t('profile.cardFooter') +
      i18n.t('profile.returnToMenu');

    const buttons: any[][] = [];

    if (isSelf) {
      // --- Self View Buttons ---
      // Ad Reward Button (only for non-VIP)
      if (!targetUser.is_vip) {
        const { getTodayAdReward } = await import('~/db/queries/ad_rewards');
        const adReward = await getTodayAdReward(db.d1, telegramId);
        const adsWatched = adReward?.ads_watched || 0;
        const remaining = Math.max(0, 20 - adsWatched);
        buttons.push([
          {
            text: i18n.t('buttons.bottle', { remaining }),
            callback_data: 'watch_ad:profile',
          },
        ]);
      }
    } else {
      // --- Other View Buttons ---
      
      // 1. Reply (if conversation context exists)
      if (conversationId) {
        // Need to get identifier to make reply button work
        const { getIdentifierByPartner } = await import('~/db/queries/conversation_identifiers');
        const identifier = await getIdentifierByPartner(db, telegramId, targetId);
        if (identifier) {
           buttons.push([{ text: i18n.t('conversationHistory.replyButton'), callback_data: `conv_reply_${identifier}` }]);
        }
      }

      // 2. Fortune Match
      // Logic: Both MUST be VIP + Data Complete (Stranger Mode assumed for now, or check if friend)
      // Actually, for "Personal Mode" (Known ID), only Initiator needs VIP.
      // But we are viewing a Profile Card, usually implies "Known ID" context if clicked from history/chat.
      // Let's implement the upsell logic.
      
      const viewerIsVip = !!(viewer.is_vip && viewer.vip_expire_at && new Date(viewer.vip_expire_at) > new Date());
      const targetIsVip = !!(targetUser.is_vip && targetUser.vip_expire_at && new Date(targetUser.vip_expire_at) > new Date());
      
      // We'll let the handler decide the final check, but button text might change
      // "Fortune Match"
      buttons.push([{ 
        text: i18n.t('profile.fortuneMatchButton'), 
        callback_data: `fortune_match:${targetId}` 
      }]);

      // 3. Gift Buttons
      buttons.push([
        { text: i18n.t('profile.giftVipButton'), callback_data: `gift_vip:${targetId}` },
        { text: i18n.t('profile.giftFortuneBottleButton'), callback_data: `gift_bottle:${targetId}` }
      ]);

      // 4. Upgrade VIP (Upsell if viewer not VIP)
      if (!viewerIsVip) {
        buttons.push([{ text: i18n.t('buttons.vip'), callback_data: 'menu_vip' }]);
      }
      
      // 5. Ad Button (if viewer not VIP)
      if (!viewerIsVip) {
        const { getTodayAdReward } = await import('~/db/queries/ad_rewards');
        const adReward = await getTodayAdReward(db.d1, telegramId);
        const adsWatched = adReward?.ads_watched || 0;
        const remaining = Math.max(0, 20 - adsWatched);
        buttons.push([
          {
            text: i18n.t('buttons.bottle', { remaining }),
            callback_data: 'watch_ad:profile',
          },
        ]);
      }

      // 6. Return to Menu (Replace More Options for now)
      buttons.push([{ text: i18n.t('buttons.returnToMenu'), callback_data: 'return_to_menu' }]);
    }

    await telegram.sendMessageWithButtons(chatId, cardMessage, buttons);
  } catch (error) {
    console.error('[handleProfileCard] Error:', error);
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.sendMessage(chatId, i18n.t('profile.systemError'));
  }
}

/**
 * Handle "More Options" menu for profile
 */
export async function handleProfileMoreOptions(
  callbackQuery: any,
  targetId: string,
  conversationId: number,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const telegramId = callbackQuery.from.id.toString();
  
  const user = await findUserByTelegramId(db, telegramId);
  const i18n = createI18n(user?.language_pref || 'zh-TW');

  const buttons = [
    [
      { text: i18n.t('profile.blockUser'), callback_data: `conv_block_confirm_${conversationId}` },
      { text: i18n.t('profile.reportUser'), callback_data: `conv_report_confirm_${conversationId}` }
    ],
    [{ text: i18n.t('common.back'), callback_data: `conv_profile_${conversationId}` }] // Back to profile
  ];

  await telegram.editMessageText(
    callbackQuery.message.chat.id, 
    callbackQuery.message.message_id, 
    i18n.t('profile.moreOptionsTitle'), 
    { reply_markup: { inline_keyboard: buttons } }
  );
}
