/**
 * Invite Activation Handler
 *
 * Handles invite activation notifications
 */

import type { User } from '~/types';
import type { DatabaseClient } from '~/db/client';
import type { TelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import {
  maskNickname,
  calculateDailyQuota,
  shouldShowInviteLimitWarning,
  hasReachedInviteLimit,
  getInviteLimit,
} from '~/domain/invite';
import { createI18n } from '~/i18n';

/**
 * Handle invite activation - send notifications to both inviter and invitee
 */
export async function handleInviteActivation(
  db: DatabaseClient,
  telegram: TelegramService,
  invitee: User
): Promise<void> {
  if (!invitee.invited_by) return;

  try {
    // Get inviter
    const inviter = await findUserByTelegramId(db, invitee.invited_by);
    if (!inviter) return;

    // Refresh inviter data to get updated successful_invites
    const updatedInviter = await findUserByTelegramId(db, inviter.telegram_id);
    if (!updatedInviter) return;

    // Send notification to inviter
    await sendInviterNotification(telegram, updatedInviter, invitee);

    // Send notification to invitee
    await sendInviteeNotification(telegram, invitee);
  } catch (error) {
    console.error('[handleInviteActivation] Error:', error);
  }
}

/**
 * Send notification to inviter
 */
async function sendInviterNotification(
  telegram: TelegramService,
  inviter: User,
  invitee: User
): Promise<void> {
  const i18n = createI18n(inviter.language_pref || 'zh-TW');

  // Mask invitee nickname for privacy and add country flag
  const { formatNicknameWithFlag } = await import('~/utils/country_flag');
  const displayNickname = formatNicknameWithFlag(
    maskNickname(invitee.nickname || i18n.t('common.newUser')),
    invitee.country_code
  );

  // Calculate current stats
  const currentInvites = inviter.successful_invites || 0;
  const maxInvites = getInviteLimit(inviter);
  const newQuota = calculateDailyQuota(inviter);
  const userType = inviter.is_vip ? 'VIP ' : i18n.t('common.free');

  // Build message
  let message = i18n.t('invite.inviterSuccess', {
    nickname: displayNickname,
    count: currentInvites.toString(),
    userType,
    maxInvites: maxInvites.toString(),
    quota: newQuota.toString(),
  });

  // Add invite limit warning if needed
  if (shouldShowInviteLimitWarning(inviter)) {
    message +=
      '\n\n' +
      i18n.t('invite.limitWarning', {
        count: currentInvites.toString(),
      });
  } else if (hasReachedInviteLimit(inviter)) {
    message +=
      '\n\n' +
      i18n.t('invite.limitReached', {
        count: currentInvites.toString(),
      });
  } else if (!inviter.is_vip) {
    message += '\n\n' + i18n.t('invite.upgradePrompt');
  }

  await telegram.sendMessage(inviter.telegram_id, message);
}

/**
 * Send notification to invitee
 */
async function sendInviteeNotification(telegram: TelegramService, invitee: User): Promise<void> {
  const i18n = createI18n(invitee.language_pref || 'zh-TW');

  const message = i18n.t('invite.inviteeSuccess');

  await telegram.sendMessage(invitee.telegram_id, message);
}
