/**
 * Fortune Match Handler
 *
 * Handles logic for fortune matching between users.
 */

import type { Env, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { createI18n } from '~/i18n';
import { formatNicknameWithFlag } from '~/utils/country_flag';
import { maskNickname } from '~/utils/nickname';
import { calculateMatchScore } from '~/domain/fortune_match';
import { FortuneService } from '~/services/fortune';

export async function handleFortuneMatch(
  callbackQuery: any,
  targetId: string,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = callbackQuery.message.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    const viewer = await findUserByTelegramId(db, telegramId);
    const targetUser = await findUserByTelegramId(db, targetId);
    
    if (!viewer || !targetUser) {
      const i18n = createI18n('zh-TW');
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.userNotFound'));
      return;
    }

    const i18n = createI18n(viewer.language_pref || 'zh-TW');

    // 1. Check VIP Status (Upsell Logic)
    // Personal Mode (Known ID): Initiator MUST be VIP. Target OPTIONAL but recommended.
    const viewerIsVip = !!(viewer.is_vip && viewer.vip_expire_at && new Date(viewer.vip_expire_at) > new Date());
    const targetIsVip = !!(targetUser.is_vip && targetUser.vip_expire_at && new Date(targetUser.vip_expire_at) > new Date());

    if (!viewerIsVip) {
      // Initiator not VIP -> Upsell
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('match.vipRequired'));
      await telegram.sendMessageWithButtons(chatId, i18n.t('match.upsellMessage'), [
        [{ text: i18n.t('buttons.vip'), callback_data: 'menu_vip' }]
      ]);
      return;
    }

    // 2. Check Fortune Bottle Quota
    const fortuneService = new FortuneService(env, db.d1);
    const quota = await fortuneService.refreshQuota(telegramId, viewerIsVip);
    const totalQuota = quota.weekly_free_quota + quota.additional_quota;

    if (totalQuota < 1) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('match.noQuota'));
      await telegram.sendMessageWithButtons(chatId, i18n.t('match.quotaExhausted'), [
        [{ text: i18n.t('buttons.buyFortuneBottle'), callback_data: 'menu_fortune' }] // Redirect to buy menu
      ]);
      return;
    }

    // 3. Check Data Completeness
    // Ideally check if birth time/city is set for better accuracy, but proceed with basic data if not.
    // Basic data (MBTI, Zodiac, Blood Type) is usually present from onboarding/profile.
    
    // 4. Consume Quota
    await fortuneService.consumeQuota(telegramId, viewerIsVip);

    // 5. Calculate Match
    const result = calculateMatchScore(
      {
        mbti: viewer.mbti_result || '',
        zodiac: viewer.zodiac_sign || '',
        bloodType: viewer.blood_type || '',
        birthTime: '', // TODO: Add DB fields
        birthCity: viewer.city || ''
      },
      {
        mbti: targetUser.mbti_result || '',
        zodiac: targetUser.zodiac_sign || '',
        bloodType: targetUser.blood_type || '',
        birthTime: '',
        birthCity: targetUser.city || ''
      }
    );

    // 6. Display Result
    const targetName = formatNicknameWithFlag(
      maskNickname(targetUser.nickname || targetUser.username || i18n.t('profile.anonymousUser')),
      targetUser.country_code
    );

    let message = i18n.t('match.resultTitle', { target: targetName }) + '\n\n';
    message += i18n.t('match.score', { score: result.score }) + '\n';
    message += i18n.t('match.analysis') + '\n';
    message += `🧠 MBTI: ${result.details.mbti_score}%\n`;
    message += `⭐ Zodiac: ${result.details.zodiac_score}%\n`;
    message += `🩸 Blood: ${result.details.blood_score}%\n\n`;
    message += i18n.t(result.description_key);

    // Warning if target non-VIP
    if (!targetIsVip) {
      message += '\n\n⚠️ ' + i18n.t('match.targetNonVipWarning');
    }

    const buttons: any[][] = [
      [{ text: i18n.t('profile.giftVipButton'), callback_data: `gift_vip:${targetId}` }],
      [{ text: i18n.t('common.back'), callback_data: `conv_profile_card_${targetId}` }]
    ];

    await telegram.sendMessageWithButtons(chatId, message, buttons);
    await telegram.answerCallbackQuery(callbackQuery.id);

  } catch (error) {
    console.error('[handleFortuneMatch] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ Error');
  }
}

