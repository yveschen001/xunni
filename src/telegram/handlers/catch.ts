/**
 * /catch Handler
 * Based on @doc/SPEC.md
 *
 * Handles catching bottles (matching with pending bottles).
 */

import type { Env, TelegramMessage, User, Bottle } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { findUserByTelegramId } from '~/db/queries/users';
import { findPendingBottles, markBottleAsMatched } from '~/db/queries/bottles';
import { createConversation } from '~/db/queries/conversations';
import { hasBlocked, isBlockedBy } from '~/db/queries/user_blocks';
import { hasReported } from '~/db/queries/reports';
import { hasChatHistory } from '~/db/queries/conversations';
import { incrementCatchesCount } from '~/db/queries/daily_usage';
import { canUseBottleFeatures } from '~/domain/user';
import { getTodayDate } from '~/domain/usage';
import { rankBottlesForUser, selectBestBottle, checkMatchExclusion } from '~/domain/match';
import { createTelegramService } from '~/services/telegram';

// ============================================================================
// /catch Handler
// ============================================================================

export async function handleCatch(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      await telegram.sendMessage(chatId, '❌ 請先使用 /start 註冊');
      return;
    }

    // Check if user can use bottle features
    if (!canUseBottleFeatures(user)) {
      if (user.is_banned) {
        await telegram.sendMessage(
          chatId,
          '🚫 你的帳號已被封禁，無法使用此功能。\n\n' + '如有疑問，請使用 /appeal 申訴。'
        );
        return;
      }

      await telegram.sendMessage(
        chatId,
        '❌ 請先完成註冊流程。\n\n' + '使用 /start 繼續完成註冊。'
      );
      return;
    }

    // Find matching bottle
    await telegram.sendMessage(chatId, '🔍 正在尋找適合你的漂流瓶...');

    const matchedBottle = await findMatchingBottle(user, db);

    if (!matchedBottle) {
      await telegram.sendMessage(
        chatId,
        '😔 目前沒有適合你的漂流瓶\n\n' +
          `💡 提示：\n` +
          `• 稍後再試，可能會有新的瓶子\n` +
          `• 或者你可以先丟出自己的瓶子：/throw`
      );
      return;
    }

    // Create conversation
    const conversation = await createConversation(db, {
      user_a_telegram_id: matchedBottle.owner_telegram_id,
      user_b_telegram_id: telegramId,
      bottle_id: matchedBottle.id,
    });

    // Mark bottle as matched
    await markBottleAsMatched(db, matchedBottle.id, telegramId);

    // Increment usage count
    const today = getTodayDate();
    await incrementCatchesCount(db, telegramId, today);

    // Send message to catcher
    await telegram.sendMessageWithButtons(
      chatId,
      `🎉 你撿到了一個漂流瓶！\n\n` +
        `瓶子內容：\n「${matchedBottle.content}」\n\n` +
        `💬 現在你可以開始和對方聊天了！\n` +
        `• 直接發送訊息即可\n` +
        `• 對話完全匿名\n` +
        `• 使用 /block 可以結束對話\n` +
        `• 使用 /report 可以舉報不當內容`,
      [
        [{ text: '👤 查看對方資料卡片', callback_data: `profile_card_${conversation.id}` }],
        [
          { text: '🚫 封鎖', callback_data: `block_${conversation.id}` },
          { text: '🚨 舉報', callback_data: `report_${conversation.id}` },
        ],
      ]
    );

    // Notify bottle owner
    await telegram.sendMessageWithButtons(
      parseInt(matchedBottle.owner_telegram_id),
      `🎉 有人撿到你的漂流瓶了！\n\n` +
        `瓶子內容：\n「${matchedBottle.content.substring(0, 50)}${matchedBottle.content.length > 50 ? '...' : ''}」\n\n` +
        `💬 已為你們建立匿名對話，快來開始聊天吧～`,
      [
        [{ text: '👤 查看對方資料卡片', callback_data: `profile_card_${conversation.id}` }],
        [
          { text: '🚫 封鎖', callback_data: `block_${conversation.id}` },
          { text: '🚨 舉報', callback_data: `report_${conversation.id}` },
        ],
      ]
    );
  } catch (error) {
    console.error('[handleCatch] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤，請稍後再試。');
  }
}

// ============================================================================
// Find Matching Bottle
// ============================================================================

async function findMatchingBottle(
  user: User,
  db: ReturnType<typeof createDatabaseClient>
): Promise<Bottle | null> {
  // Get pending bottles
  const pendingBottles = await findPendingBottles(db, 100);

  if (pendingBottles.length === 0) {
    return null;
  }

  // Filter bottles with exclusion rules
  const eligibleBottles: Bottle[] = [];

  for (const bottle of pendingBottles) {
    const ownerTelegramId = bottle.owner_telegram_id;

    // Check exclusion rules
    const exclusion = await checkMatchExclusion(
      user,
      bottle,
      {
        isBottleOwner: user.telegram_id === ownerTelegramId,
        hasBlockedOwner: await hasBlocked(db, user.telegram_id, ownerTelegramId),
        isBlockedByOwner: await isBlockedBy(db, user.telegram_id, ownerTelegramId),
        hasReportedOwner: await hasReported(db, user.telegram_id, ownerTelegramId, 24),
        isReportedByOwner: await hasReported(db, ownerTelegramId, user.telegram_id, 24),
        hasChatHistoryWithOwner: await hasChatHistory(db, user.telegram_id, ownerTelegramId),
      }
    );

    if (!exclusion.shouldExclude) {
      eligibleBottles.push(bottle);
    }
  }

  if (eligibleBottles.length === 0) {
    return null;
  }

  // Rank bottles by match score
  const rankedBottles = rankBottlesForUser(user, eligibleBottles);

  // Select best bottle
  return selectBestBottle(rankedBottles);
}

