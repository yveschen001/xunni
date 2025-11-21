/**
 * VIP Triple Bottle Feature
 * Core logic for creating and managing VIP triple bottles
 */

import type { DatabaseClient } from '~/db/client';
import type { Env, User } from '~/types';
import type { ThrowBottleInput } from '~/domain/bottle';
import { createBottle } from '~/db/queries/bottles';
import {
  createMatchSlots,
  getSlotByIndex,
  updateSlotMatched,
} from '~/db/queries/bottle_match_slots';
import { createConversation } from '~/db/queries/conversations';
import { createTelegramService } from '~/services/telegram';

/**
 * Create VIP triple bottle with 3 match slots
 */
export async function createVipTripleBottle(
  db: DatabaseClient,
  user: User,
  bottleInput: ThrowBottleInput,
  env: Env
): Promise<number> {
  console.error('[VipTripleBottle] Creating triple bottle for user:', user.telegram_id);

  // 1. 創建 1 個瓶子記錄（標記為 VIP 三倍瓶子）
  const bottleId = await createBottle(db, user.telegram_id, bottleInput, true);
  console.error('[VipTripleBottle] Bottle created:', bottleId);

  // 2. 創建 3 個配對槽位
  await createMatchSlots(db, bottleId, 3);
  console.error('[VipTripleBottle] 3 slots created');

  // 3. 主動配對第一個槽位（智能匹配）
  try {
    await matchPrimarySlot(db, env, bottleId, user);
  } catch (error) {
    console.error('[VipTripleBottle] Failed to match primary slot:', error);
    // 不阻塞流程，繼續執行
  }

  // 4. 另外 2 個槽位進入公共池（自動）
  // 不需要額外操作，它們的 status='pending' 會被 /catch 找到

  return bottleId;
}

/**
 * Match primary slot (smart matching)
 */
async function matchPrimarySlot(
  db: DatabaseClient,
  env: Env,
  bottleId: number,
  bottleOwner: User
): Promise<void> {
  console.error('[VipTripleBottle] Attempting primary slot matching for bottle:', bottleId);

  // 使用智能匹配找到最佳對象
  const { findActiveMatchForBottle } = await import('~/services/smart_matching');
  const matchResult = await findActiveMatchForBottle(db.d1, bottleId);

  if (matchResult && matchResult.user) {
    console.error('[VipTripleBottle] Smart match found:', matchResult.user.telegram_id);

    // 獲取第一個槽位
    const slot = await getSlotByIndex(db, bottleId, 1);
    if (!slot) {
      console.error('[VipTripleBottle] Slot #1 not found');
      return;
    }

    // 創建對話
    const conversationId = await createConversation(
      db,
      bottleOwner.telegram_id,
      matchResult.user.telegram_id,
      bottleId
    );
    console.error('[VipTripleBottle] Conversation created:', conversationId);

    // 更新槽位狀態
    await updateSlotMatched(db, slot.id, matchResult.user.telegram_id, conversationId);
    console.error('[VipTripleBottle] Slot #1 matched');

    // 發送通知給雙方
    await sendMatchNotifications(db, env, bottleId, bottleOwner, matchResult.user, conversationId);
  } else {
    console.error('[VipTripleBottle] No smart match found, slot #1 will enter public pool');
  }
}

/**
 * Send match notifications to both users
 */
async function sendMatchNotifications(
  db: DatabaseClient,
  env: Env,
  bottleId: number,
  bottleOwner: User,
  matcher: User,
  conversationId: number
): Promise<void> {
  const telegram = createTelegramService(env);
  const { getBottleById } = await import('~/db/queries/bottles');
  const { buildConversationIdentifier } = await import('~/domain/conversation');
  const { maskNickname } = await import('~/domain/invite');
  const { formatNicknameWithFlag } = await import('~/utils/country_flag');

  const bottle = await getBottleById(db, bottleId);
  if (!bottle) return;

  const conversationId = buildConversationIdentifier(conversationId);

  // 通知瓶子主人
  try {
    const maskedMatcherNickname = formatNicknameWithFlag(
      maskNickname(matcher.nickname || '匿名'),
      matcher.country_code
    );

    await telegram.sendMessage(
      parseInt(bottleOwner.telegram_id),
      `🎯 **VIP 智能配對成功！**\n\n` +
        `你的瓶子已被 ${maskedMatcherNickname} 撿起！\n\n` +
        `💬 對話標識符：${conversationId}\n` +
        `📝 瓶子內容：${bottle.content.substring(0, 50)}${bottle.content.length > 50 ? '...' : ''}\n\n` +
        `💡 這是你的第 1 個配對，還有 2 個槽位等待中\n\n` +
        `使用 /chats 查看所有對話`
    );
  } catch (error) {
    console.error('[VipTripleBottle] Failed to notify bottle owner:', error);
  }

  // 通知撿瓶子的人
  try {
    const maskedOwnerNickname = formatNicknameWithFlag(
      maskNickname(bottleOwner.nickname || '匿名'),
      bottleOwner.country_code
    );

    await telegram.sendMessage(
      parseInt(matcher.telegram_id),
      `🎉 **智能配對成功！**\n\n` +
        `系統為你找到了 ${maskedOwnerNickname} 的瓶子！\n\n` +
        `💬 對話標識符：${conversationId}\n` +
        `📝 瓶子內容：${bottle.content}\n\n` +
        `💡 回覆此訊息開始對話`
    );
  } catch (error) {
    console.error('[VipTripleBottle] Failed to notify matcher:', error);
  }
}

