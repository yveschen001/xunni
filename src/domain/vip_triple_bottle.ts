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

export interface VipTripleBottleResult {
  bottleId: number;
  primaryMatch: {
    matched: boolean;
    conversationId?: number;
    conversationIdentifier?: string;
    matcherNickname?: string;
  };
}

/**
 * Create VIP triple bottle with 3 match slots
 */
export async function createVipTripleBottle(
  db: DatabaseClient,
  user: User,
  bottleInput: ThrowBottleInput,
  env: Env
): Promise<VipTripleBottleResult> {
  console.error('[VipTripleBottle] Creating triple bottle for user:', user.telegram_id);

  // 1. 創建 1 個瓶子記錄（標記為 VIP 三倍瓶子）
  const bottleId = await createBottle(db, user.telegram_id, bottleInput, true);
  console.error('[VipTripleBottle] Bottle created:', bottleId);

  // 2. 創建 3 個配對槽位
  await createMatchSlots(db, bottleId, 3);
  console.error('[VipTripleBottle] 3 slots created');

  // 3. 主動配對第一個槽位（智能匹配）
  let primaryMatch: VipTripleBottleResult['primaryMatch'] = { matched: false };
  try {
    primaryMatch = await matchPrimarySlot(db, env, bottleId, user);
  } catch (error) {
    console.error('[VipTripleBottle] Failed to match primary slot:', error);
    // 不阻塞流程，繼續執行
  }

  // 4. 另外 2 個槽位進入公共池（自動）
  // 不需要額外操作，它們的 status='pending' 會被 /catch 找到

  return {
    bottleId,
    primaryMatch,
  };
}

/**
 * Match primary slot (smart matching)
 */
async function matchPrimarySlot(
  db: DatabaseClient,
  env: Env,
  bottleId: number,
  bottleOwner: User
): Promise<VipTripleBottleResult['primaryMatch']> {
  console.error('[VipTripleBottle] Attempting primary slot matching for bottle:', bottleId);

  // 使用智能匹配找到最佳對象
  const { findActiveMatchForBottle } = await import('~/services/smart_matching');
  const matchResult = await findActiveMatchForBottle(db.d1, bottleId);

  if (matchResult && matchResult.user) {
    console.error('[VipTripleBottle] Smart match found:', matchResult.user.telegram_id);

    // 驗證匹配用戶是否存在
    const { findUserByTelegramId } = await import('~/db/queries/users');
    console.error('[VipTripleBottle] Verifying matched user exists in database...');
    const matchedUser = await findUserByTelegramId(db, matchResult.user.telegram_id);
    
    if (!matchedUser) {
      console.error('[VipTripleBottle] ❌ Matched user NOT FOUND in database:', matchResult.user.telegram_id);
      console.error('[VipTripleBottle] This user was returned by smart matching but does not exist in users table');
      return { matched: false };
    }
    
    console.error('[VipTripleBottle] ✅ Matched user verified:', {
      telegram_id: matchedUser.telegram_id,
      nickname: matchedUser.nickname,
      username: matchedUser.username,
    });

    // 獲取第一個槽位
    const slot = await getSlotByIndex(db, bottleId, 1);
    if (!slot) {
      console.error('[VipTripleBottle] Slot #1 not found');
      return { matched: false };
    }

    // 創建對話
    console.error('[VipTripleBottle] Creating conversation between:', {
      owner: bottleOwner.telegram_id,
      matcher: matchedUser.telegram_id,
      bottleId,
    });
    
    // 注意：createConversation 的參數順序是 (db, bottleId, userAId, userBId)
    const conversationId = await createConversation(
      db,
      bottleId,
      bottleOwner.telegram_id,
      matchedUser.telegram_id
    );
    
    // 驗證對話創建成功
    if (!conversationId) {
      console.error('[VipTripleBottle] ❌ Failed to create conversation - conversationId is null/undefined');
      return { matched: false };
    }
    
    console.error('[VipTripleBottle] ✅ Conversation created successfully:', conversationId);

    // 更新槽位狀態
    console.error('[VipTripleBottle] Updating slot status:', {
      slotId: slot.id,
      matchedWithTelegramId: matchedUser.telegram_id,
      conversationId,
    });
    
    try {
      await updateSlotMatched(db, slot.id, matchedUser.telegram_id, conversationId);
      console.error('[VipTripleBottle] ✅ Slot #1 matched successfully');
    } catch (updateError) {
      console.error('[VipTripleBottle] ❌ Failed to update slot status:', updateError);
      console.error('[VipTripleBottle] Error details:', {
        slotId: slot.id,
        matchedWithTelegramId: matchedUser.telegram_id,
        conversationId,
        error: updateError instanceof Error ? updateError.message : String(updateError),
      });
      // 如果更新失敗，嘗試刪除剛創建的對話以保持數據一致性
      // 但不阻塞流程
      return { matched: false };
    }

    // 發送通知給雙方
    try {
      await sendMatchNotifications(db, env, bottleId, bottleOwner, matchedUser, conversationId);
      console.error('[VipTripleBottle] Notifications sent successfully');
    } catch (notifyError) {
      console.error('[VipTripleBottle] Failed to send notifications:', notifyError);
      // 通知失敗不影響配對結果
    }

    // 返回配對信息
    const { generateNextIdentifier, formatIdentifier } = await import('~/domain/conversation_identifier');
    const { maskNickname } = await import('~/domain/invite');
    const { formatNicknameWithFlag } = await import('~/utils/country_flag');

    // 生成對話標識符
    const identifier = generateNextIdentifier();
    const formattedIdentifier = formatIdentifier(identifier);

    return {
      matched: true,
      conversationId,
      conversationIdentifier: formattedIdentifier,
      matcherNickname: formatNicknameWithFlag(
        maskNickname(matchedUser.nickname || '匿名'),
        matchedUser.country_code
      ),
    };
  } else {
    console.error('[VipTripleBottle] No smart match found, slot #1 will enter public pool');
    return { matched: false };
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
  _conversationId: number
): Promise<void> {
  const telegram = createTelegramService(env);
  const { getBottleById } = await import('~/db/queries/bottles');
  const { generateNextIdentifier, formatIdentifier } = await import('~/domain/conversation_identifier');
  const { maskNickname } = await import('~/domain/invite');
  const { formatNicknameWithFlag } = await import('~/utils/country_flag');

  const bottle = await getBottleById(db, bottleId);
  if (!bottle) return;

  // 生成對話標識符
  const identifier = generateNextIdentifier();
  const conversationIdentifier = formatIdentifier(identifier);

  // 🚀 性能優化：並行發送通知（節省 1s）
  // 準備通知內容
  const maskedMatcherNickname = formatNicknameWithFlag(
    maskNickname(matcher.nickname || '匿名'),
    matcher.country_code
  );
  const maskedOwnerNickname = formatNicknameWithFlag(
    maskNickname(bottleOwner.nickname || '匿名'),
    bottleOwner.country_code
  );

  // 並行發送兩個通知
  await Promise.allSettled([
    // 通知瓶子主人
    telegram.sendMessage(
      parseInt(bottleOwner.telegram_id),
      `🎯 **VIP 智能配對成功！**\n\n` +
        `你的瓶子已被 ${maskedMatcherNickname} 撿起！\n\n` +
        `💬 對話標識符：${conversationIdentifier}\n` +
        `📝 瓶子內容：${bottle.content.substring(0, 50)}${bottle.content.length > 50 ? '...' : ''}\n\n` +
        `💡 這是你的第 1 個配對，還有 2 個槽位等待中\n\n` +
        `使用 /chats 查看所有對話\n\n` +
        `💬 **請長按此訊息，選擇「回覆」後輸入內容和對方開始聊天**`
    ).catch(error => {
      console.error('[VipTripleBottle] Failed to notify bottle owner:', error);
    }),
    
    // 通知撿瓶子的人
    telegram.sendMessage(
      parseInt(matcher.telegram_id),
      `🎉 **智能配對成功！**\n\n` +
        `系統為你找到了 ${maskedOwnerNickname} 的瓶子！\n\n` +
        `💬 對話標識符：${conversationIdentifier}\n` +
        `📝 瓶子內容：${bottle.content}\n\n` +
        `💬 **請長按此訊息，選擇「回覆」後輸入內容和對方開始聊天**`
    ).catch(error => {
      console.error('[VipTripleBottle] Failed to notify matcher:', error);
    })
  ]);
}

