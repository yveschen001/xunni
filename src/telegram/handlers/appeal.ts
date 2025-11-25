/**
 * Appeal Handler
 * Handles user ban appeals
 */

import type { TelegramMessage } from '~/types';
import type { Env } from '~/worker-configuration';
import { createTelegramService } from '~/services/telegram';
import { createDatabaseClient } from '~/db/client';
import { createI18n } from '~/i18n';
import { isBanned } from '~/domain/user';
import { findUserByTelegramId } from '~/db/queries/users';

/**
 * Handle /appeal command
 */
export async function handleAppeal(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id.toString();
  const telegramId = message.from!.id.toString();

  // Get user
  const user = await findUserByTelegramId(db, telegramId);
  if (!user) {
    const i18n = createI18n('zh-TW');
    await telegram.sendMessage(chatId, i18n.t('errors.userNotFoundRegister'));
    return;
  }

  const i18n = createI18n(user.language_pref || 'zh-TW');

  // Check if user is banned
  if (!isBanned(user)) {
    await telegram.sendMessage(chatId, i18n.t('appeal.notBanned', {}));
    return;
  }

  // Check if user already has a pending appeal
  const existingAppeal = await db.d1
    .prepare(
      `SELECT id, status, created_at 
       FROM appeals 
       WHERE user_id = ? AND status = 'pending'
       ORDER BY created_at DESC
       LIMIT 1`
    )
    .bind(telegramId)
    .first<{ id: number; status: string; created_at: string }>();

  if (existingAppeal) {
    const createdAt = new Date(existingAppeal.created_at).toLocaleString(
      user.language_pref === 'en' ? 'en-US' : 'zh-TW',
      {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: user.language_pref === 'en' ? 'UTC' : 'Asia/Taipei',
      }
    );

    await telegram.sendMessage(
      chatId,
      i18n.t('appeal.alreadyExists', {
        appealId: existingAppeal.id.toString(),
        status: i18n.t('appeal.statusPending'),
        time: createdAt,
      })
    );
    return;
  }

  // Set session to wait for appeal reason
  await db.d1
    .prepare('UPDATE users SET session_state = ? WHERE telegram_id = ?')
    .bind('awaiting_appeal_reason', telegramId)
    .run();

  // Send prompt
  await telegram.sendMessage(chatId, i18n.t('appeal.prompt', {}));
}

/**
 * Handle appeal reason input
 */
export async function handleAppealReasonInput(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id.toString();
  const telegramId = message.from!.id.toString();
  const reason = message.text?.trim() || '';

  // Get user
  const user = await findUserByTelegramId(db, telegramId);
  if (!user) {
    const i18n = createI18n('zh-TW');
    await telegram.sendMessage(chatId, i18n.t('errors.userNotFoundRegister'));
    return;
  }

  const i18n = createI18n(user.language_pref || 'zh-TW');

  // Validate reason length
  if (reason.length < 10) {
    await telegram.sendMessage(chatId, i18n.t('appeal.reasonTooShort', {}));
    return;
  }

  if (reason.length > 500) {
    await telegram.sendMessage(chatId, i18n.t('appeal.reasonTooLong', {}));
    return;
  }

  // Get latest ban_id
  const latestBan = await db.d1
    .prepare('SELECT id FROM bans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1')
    .bind(telegramId)
    .first<{ id: number }>();

  // Create appeal
  const now = new Date().toISOString();
  const result = await db.d1
    .prepare(
      `INSERT INTO appeals (user_id, ban_id, reason, status, created_at)
       VALUES (?, ?, ?, 'pending', ?)`
    )
    .bind(telegramId, latestBan?.id || null, reason, now)
    .run();

  // Clear session
  await db.d1
    .prepare('UPDATE users SET session_state = NULL WHERE telegram_id = ?')
    .bind(telegramId)
    .run();

  // Send confirmation
  const appealId = result.meta.last_row_id;
  const time = new Date(now).toLocaleString(user.language_pref === 'en' ? 'en-US' : 'zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: user.language_pref === 'en' ? 'UTC' : 'Asia/Taipei',
  });

  await telegram.sendMessage(
    chatId,
    i18n.t('appeal.submitted', {
      appealId: appealId.toString(),
      time,
    })
  );
}

/**
 * Handle /appeal_status command
 */
export async function handleAppealStatus(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id.toString();
  const telegramId = message.from!.id.toString();

  // Get user
  const user = await findUserByTelegramId(db, telegramId);
  if (!user) {
    const i18n = createI18n('zh-TW');
    await telegram.sendMessage(chatId, i18n.t('errors.userNotFoundRegister'));
    return;
  }

  const i18n = createI18n(user.language_pref || 'zh-TW');

  // Get latest appeal
  const appeal = await db.d1
    .prepare(
      `SELECT id, status, created_at, reviewed_at, review_notes
       FROM appeals
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 1`
    )
    .bind(telegramId)
    .first<{
      id: number;
      status: string;
      created_at: string;
      reviewed_at: string | null;
      review_notes: string | null;
    }>();

  if (!appeal) {
    await telegram.sendMessage(chatId, i18n.t('appeal.noAppeal', {}));
    return;
  }

  // Format status
  let statusText = '';
  if (appeal.status === 'pending') {
    statusText = i18n.t('appeal.statusPending');
  } else if (appeal.status === 'approved') {
    statusText = i18n.t('appeal.statusApproved');
  } else if (appeal.status === 'rejected') {
    statusText = i18n.t('appeal.statusRejected');
  }

  // Format dates
  const createdAt = new Date(appeal.created_at).toLocaleString(
    user.language_pref === 'en' ? 'en-US' : 'zh-TW',
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: user.language_pref === 'en' ? 'UTC' : 'Asia/Taipei',
    }
  );

  let reviewInfo = '';
  if (appeal.reviewed_at) {
    const reviewedAt = new Date(appeal.reviewed_at).toLocaleString(
      user.language_pref === 'en' ? 'en-US' : 'zh-TW',
      {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: user.language_pref === 'en' ? 'UTC' : 'Asia/Taipei',
      }
    );
    reviewInfo =
      i18n.t('appeal.reviewedAt') + reviewedAt +
      '\n' +
      (appeal.review_notes
        ? i18n.t('appeal.notes') + appeal.review_notes
        : '');
  }

  await telegram.sendMessage(
    chatId,
    i18n.t('appeal.status', {
      appealId: appeal.id.toString(),
      status: statusText,
      createdAt,
      reviewInfo,
    })
  );
}
