/**
 * Throw Bottle Handler
 *
 * Handles /throw command - create and throw a bottle.
 */

import type { Env, TelegramMessage, User } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { createBottle, getDailyThrowCount, incrementDailyThrowCount } from '~/db/queries/bottles';
import { validateBottleContent, canThrowBottle, getBottleQuota } from '~/domain/bottle';
import type { ThrowBottleInput } from '~/domain/bottle';
import { canActivateInvite } from '~/domain/invite';
import {
  isInviteActivated,
  activateInvite,
  incrementSuccessfulInvites,
} from '~/db/queries/invites';

/**
 * Get target gender based on user's preference
 * Default: opposite gender (for heterosexual users)
 */
function getTargetGender(user: User): 'male' | 'female' | 'any' {
  // If user has explicitly set a preference, use it
  if (user.match_preference) {
    return user.match_preference as 'male' | 'female' | 'any';
  }

  // Default: opposite gender
  if (user.gender === 'male') {
    return 'female';
  } else if (user.gender === 'female') {
    return 'male';
  }

  // Fallback
  return 'any';
}

export async function handleThrow(message: TelegramMessage, env: Env): Promise<void> {
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
      console.error('[handleThrow] Failed to update user activity:', activityError);
    }

    console.error('[handleThrow] Starting for user:', telegramId);

    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      await telegram.sendMessage(chatId, '❌ 用戶不存在，請先使用 /start 註冊。');
      return;
    }

    console.error('[handleThrow] User found:', user.nickname);

    // Check if user completed onboarding
    if (user.onboarding_step !== 'completed') {
      await telegram.sendMessage(
        chatId,
        '❌ 請先完成註冊流程才能丟漂流瓶。\n\n使用 /start 繼續註冊。'
      );
      return;
    }

    // Check if user is banned
    if (user.is_banned) {
      await telegram.sendMessage(
        chatId,
        '❌ 你的帳號已被封禁，無法丟漂流瓶。\n\n如有疑問，請使用 /appeal 申訴。'
      );
      return;
    }

    // Check daily quota
    const throwsToday = await getDailyThrowCount(db, telegramId);
    const inviteBonus = user.successful_invites || 0;
    const isVip = !!(
      user.is_vip &&
      user.vip_expire_at &&
      new Date(user.vip_expire_at) > new Date()
    );
    
    // Calculate task bonus
    const { calculateTaskBonus } = await import('./tasks');
    const taskBonus = await calculateTaskBonus(db, telegramId);

    // Get ad reward info
    const { getTodayAdReward } = await import('~/db/queries/ad_rewards');
    const adReward = await getTodayAdReward(db.d1, telegramId);
    const adBonus = adReward?.quota_earned || 0;

    if (!canThrowBottle(throwsToday, isVip, inviteBonus, taskBonus, adBonus)) {

      // Calculate permanent quota (base + invite)
      const baseQuota = isVip ? 30 : 3;
      const maxQuota = isVip ? 100 : 10;
      const permanentQuota = Math.min(baseQuota + inviteBonus, maxQuota);
      
      // Calculate temporary bonus (task + ad)
      const temporaryBonus = taskBonus + adBonus;
      
      // Format quota display
      const quotaDisplay = temporaryBonus > 0 
        ? `${throwsToday}/${permanentQuota}+${temporaryBonus}`
        : `${throwsToday}/${permanentQuota}`;
      
      // Get smart buttons based on ad/task availability
      if (!isVip) {
        const { getNextIncompleteTask } = await import('./tasks');
        const { getQuotaExhaustedMessage, getQuotaExhaustedButtons } = await import('~/domain/ad_prompt');

        const nextTask = await getNextIncompleteTask(db, user);

        const context = {
          user,
          ads_watched_today: adReward?.ads_watched || 0,
          has_incomplete_tasks: !!nextTask,
          next_task_name: nextTask?.name,
          next_task_id: nextTask?.id,
        };

        const quotaMessage = getQuotaExhaustedMessage(quotaDisplay, context);
        const buttons = getQuotaExhaustedButtons(context);

        if (buttons.length > 0) {
          await telegram.sendMessageWithButtons(chatId, quotaMessage, buttons);
        } else {
          await telegram.sendMessage(chatId, quotaMessage);
        }
      } else {
        await telegram.sendMessage(
          chatId,
          `❌ 今日漂流瓶配額已用完（${quotaDisplay}）\n\n` +
            `💡 明天再來丟更多瓶子吧！`
        );
      }
      return;
    }

    // Check for existing draft
    const { getDraft } = await import('~/db/queries/drafts');
    const { getDraftPreview, formatDraftAge } = await import('~/domain/draft');
    const draft = await getDraft(db, telegramId);

    if (draft) {
      // Show draft recovery option
      const preview = getDraftPreview(draft.content);
      const age = formatDraftAge(draft, user.language_pref || 'zh-TW');

      await telegram.sendMessageWithButtons(
        chatId,
        `📝 你有一個未完成的草稿\n\n` +
          `創建時間：${age}\n` +
          `內容預覽：${preview}\n\n` +
          `要繼續編輯這個草稿嗎？`,
        [
          [
            { text: '✅ 繼續編輯', callback_data: 'draft_continue' },
            { text: '🗑️ 刪除草稿', callback_data: 'draft_delete' },
          ],
          [{ text: '✍️ 重新開始', callback_data: 'draft_new' }],
        ]
      );
      return;
    }

    // Determine target gender based on user's preference
    const targetGender = getTargetGender(user);

    // Create session with target gender
    const { upsertSession } = await import('~/db/queries/sessions');
    await upsertSession(db, telegramId, 'throw_bottle', {
      target_gender: targetGender,
    });

    console.error('[handleThrow] Session created:', {
      userId: telegramId,
      sessionType: 'throw_bottle',
      targetGender,
    });

    // Directly ask for bottle content
    const targetText =
      targetGender === 'male' ? '男生' : targetGender === 'female' ? '女生' : '任何人';
    const throwPrompt =
      `🍾 **丟漂流瓶**\n\n` +
      `🎯 尋找對象：${targetText}\n` +
      `💡 可在 /edit_profile 中修改匹配偏好\n\n` +
      `📝 **請輸入你的漂流瓶內容**\n\n` +
      `✅ **規則**：\n` +
      `• 最短 12 個字符\n` +
      `• 最多 500 個字符\n` +
      `• 只允許 Telegram 連結 (t.me)\n` +
      `• 不要包含個人聯絡方式\n\n` +
      `💬 **範例**：\n` +
      `「你好！我是一個喜歡音樂和電影的人，希望認識志同道合的朋友～」\n\n` +
      `⚠️ **注意**：YouTube 等外部連結會被拦截`;

    await telegram.sendMessageWithButtons(
      chatId,
      throwPrompt,
      [[{ text: '🏠 返回主選單', callback_data: 'return_to_menu' }]],
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('[handleThrow] Error:', error);
    const errorStack = error instanceof Error ? error.stack : 'No stack';
    console.error('[handleThrow] Error stack:', errorStack);
    await telegram.sendMessage(
      chatId,
      `❌ 發生錯誤，請稍後再試。\n\n錯誤信息：${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Process bottle content (called from message handler)
 */
export async function processBottleContent(user: User, content: string, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = parseInt(user.telegram_id);

  try {
    // Validate content
    const validation = validateBottleContent(content);
    if (!validation.valid) {
      await telegram.sendMessage(chatId, `❌ ${validation.error}\n\n請重新輸入瓶子內容。`);
      return;
    }

    // Check URL whitelist
    const { checkUrlWhitelist } = await import('~/utils/url-whitelist');
    const urlCheck = checkUrlWhitelist(content);
    if (!urlCheck.allowed) {
      await telegram.sendMessage(
        chatId,
        `❌ 瓶子內容包含不允許的網址\n\n` +
          `🚫 禁止的網址：\n${urlCheck.blockedUrls?.map((url) => `• ${url}`).join('\n')}\n\n` +
          `✅ 只允許以下網址：\n` +
          `• t.me (Telegram)\n` +
          `• telegram.org\n` +
          `• telegram.me\n\n` +
          `請移除這些網址後重新輸入。`
      );
      return;
    }

    // Get filter settings from session (if any)
    const { getActiveSession } = await import('~/db/queries/sessions');
    const { parseSessionData } = await import('~/domain/session');
    const session = await getActiveSession(db, user.telegram_id, 'throw_bottle');

    let target_gender: 'male' | 'female' | 'any' = 'any';
    let target_mbti_filter: string[] = [];
    let target_zodiac_filter: string[] = [];
    let target_blood_type_filter: string | null = null;

    if (session) {
      const sessionData = parseSessionData(session);
      target_gender = sessionData.data?.target_gender || 'any';
      target_mbti_filter = sessionData.data?.target_mbti || [];
      target_zodiac_filter = sessionData.data?.target_zodiac || [];
      target_blood_type_filter = sessionData.data?.target_blood_type || null;
    }

    const bottleInput: ThrowBottleInput = {
      content,
      target_gender,
      target_mbti_filter: target_mbti_filter.length > 0 ? target_mbti_filter : undefined,
      target_zodiac_filter: target_zodiac_filter.length > 0 ? target_zodiac_filter : undefined,
      target_blood_type_filter:
        target_blood_type_filter && target_blood_type_filter !== 'any'
          ? target_blood_type_filter
          : null,
      language: user.language_pref,
    };

    // Create bottle
    const bottleId = await createBottle(db, user.telegram_id, bottleInput);

    // Increment daily count
    await incrementDailyThrowCount(db, user.telegram_id);

    // ✨ NEW: Try smart matching (non-blocking, won't affect existing flow)
    try {
      const { findActiveMatchForBottle } = await import('~/services/smart_matching');
      const matchResult = await findActiveMatchForBottle(db.d1, bottleId);
      
      if (matchResult && matchResult.user) {
        // Found a match! Update bottle status and send notification
        await db.d1
          .prepare(`UPDATE bottles SET match_status = 'matched' WHERE id = ?`)
          .bind(bottleId)
          .run();
        
        // Record matching history
        await db.d1
          .prepare(`
            INSERT INTO matching_history 
            (bottle_id, matched_user_id, match_score, score_breakdown, match_type)
            VALUES (?, ?, ?, ?, ?)
          `)
          .bind(
            bottleId,
            matchResult.user.telegram_id,
            matchResult.score.total,
            JSON.stringify(matchResult.score),
            'active'
          )
          .run();
        
        // Send notification to matched user (一對一配對，直接推送)
        const matchedChatId = parseInt(matchResult.user.telegram_id);
        
        // 獲取擾碼暱稱
        const { maskNickname } = await import('~/domain/invite');
        const ownerMaskedNickname = maskNickname(user.nickname || user.username || '匿名');
        
        // 計算匹配度百分比
        const matchPercentage = Math.min(100, Math.round(matchResult.score.total));
        
        // 構建匹配亮點
        const highlights: string[] = [];
        if (matchResult.score.language >= 85) highlights.push('• 語言相同 ✓');
        if (matchResult.score.mbti >= 80) highlights.push('• MBTI 高度配對 ✓');
        if (matchResult.score.zodiac >= 80) highlights.push('• 星座高度相容 ✓');
        if (matchResult.score.ageRange >= 70) highlights.push('• 年齡區間相近 ✓');
        
        const highlightsText = highlights.length > 0 
          ? `\n💡 這個瓶子和你非常合拍！\n${highlights.join('\n')}\n`
          : '';
        
        // 獲取瓶子內容前 12 字作為預覽
        const contentPreview = content.length > 12 
          ? content.substring(0, 12) + '...'
          : content;
        
        await telegram.sendMessage(
          matchedChatId,
          `🍾 ${contentPreview} 📨🌊\n\n` +
            `📝 暱稱：${ownerMaskedNickname}\n` +
            `🧠 MBTI：${user.mbti_result || '未設定'}\n` +
            `⭐ 星座：${user.zodiac_sign || '未設定'}\n` +
            `💝 匹配度：${matchPercentage}%\n` +
            highlightsText +
            `\n━━━━━━━━━━━━━━━━\n` +
            `${content}\n` +
            `━━━━━━━━━━━━━━━━\n\n` +
            `💬 直接按 /reply 回覆訊息開始聊天\n` +
            `📊 使用 /chats 查看所有對話`
        );
        
        console.log(`[Smart Matching] Bottle ${bottleId} matched to user ${matchResult.user.telegram_id} with score ${matchResult.score.total}`);
      } else {
        // No match found, bottle enters public pool
        await db.d1
          .prepare(`UPDATE bottles SET match_status = 'active' WHERE id = ?`)
          .bind(bottleId)
          .run();
        
        console.log(`[Smart Matching] Bottle ${bottleId} enters public pool (no active match found)`);
      }
    } catch (matchError) {
      console.error('[Smart Matching] Error:', matchError);
      // Fallback: bottle enters public pool
      await db.d1
        .prepare(`UPDATE bottles SET match_status = 'active' WHERE id = ?`)
        .bind(bottleId)
        .run();
    }

    // Check and complete "first bottle" task
    try {
      const { checkAndCompleteTask } = await import('./tasks');
      const bottleCount = await db.d1
        .prepare(`SELECT COUNT(*) as count FROM bottles WHERE owner_telegram_id = ?`)
        .bind(user.telegram_id)
        .first<{ count: number }>();
      await checkAndCompleteTask(db, telegram, user, 'task_first_bottle', {
        bottleCount: bottleCount?.count || 0,
      });
    } catch (taskError) {
      console.error('[handleThrow] Task check error:', taskError);
    }

    // Check and activate invite (first bottle thrown)
    const hasThrown = true; // User just threw a bottle
    if (canActivateInvite(user, hasThrown)) {
      const alreadyActivated = await isInviteActivated(db, user.telegram_id);

      if (!alreadyActivated) {
        // Activate invite
        await activateInvite(db, user.telegram_id);
        await incrementSuccessfulInvites(db, user.invited_by!);

        // Send notification (will be implemented in next step)
        const { handleInviteActivation } = await import('./invite_activation');
        await handleInviteActivation(db, telegram, user);
      }
    }

    // Get updated quota info
    const throwsToday = await getDailyThrowCount(db, user.telegram_id);
    const inviteBonus = user.successful_invites || 0;
    const isVip = !!(
      user.is_vip &&
      user.vip_expire_at &&
      new Date(user.vip_expire_at) > new Date()
    );
    const { calculateTaskBonus } = await import('./tasks');
    const taskBonus = await calculateTaskBonus(db, user.telegram_id);
    
    // Get ad reward info
    const { getTodayAdReward } = await import('~/db/queries/ad_rewards');
    const adRewardInfo = await getTodayAdReward(db.d1, user.telegram_id);
    const adBonus = adRewardInfo?.quota_earned || 0;
    
    // Calculate permanent quota (base + invite)
    const baseQuota = isVip ? 30 : 3;
    const maxQuota = isVip ? 100 : 10;
    const permanentQuota = Math.min(baseQuota + inviteBonus, maxQuota);
    
    // Calculate temporary bonus (task + ad)
    const temporaryBonus = taskBonus + adBonus;
    
    // Format quota display
    const quotaDisplay = temporaryBonus > 0 
      ? `${throwsToday}/${permanentQuota}+${temporaryBonus}`
      : `${throwsToday}/${permanentQuota}`;

    // Send success message
    const successMessage =
      `🎉 漂流瓶已丟出！\n\n` +
      `瓶子 ID：#${bottleId}\n\n` +
      `今日已丟：${quotaDisplay}\n\n` +
      `💡 你的瓶子將在 24 小時內等待有緣人撿起～\n\n` +
      `想要撿別人的瓶子嗎？使用 /catch`;

    // Determine what button to show (ad/task/vip) for non-VIP users
    if (!isVip) {
      const { getNextIncompleteTask } = await import('./tasks');
      const { getAdPrompt } = await import('~/domain/ad_prompt');

      const nextTask = await getNextIncompleteTask(db, user);

      const prompt = getAdPrompt({
        user,
        ads_watched_today: adRewardInfo?.ads_watched || 0,
        has_incomplete_tasks: !!nextTask,
        next_task_name: nextTask?.name,
        next_task_id: nextTask?.id,
      });

      if (prompt.show_button) {
        await telegram.sendMessageWithButtons(chatId, successMessage, [
          [
            {
              text: prompt.button_text,
              callback_data: prompt.button_callback,
            },
          ],
        ]);
      } else {
        await telegram.sendMessage(chatId, successMessage);
      }
    } else {
      await telegram.sendMessage(chatId, successMessage);
    }
  } catch (error) {
    console.error('[processBottleContent] Error:', error);
    console.error('[processBottleContent] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: user.telegram_id,
      contentLength: content.length,
    });

    const errorMsg = error instanceof Error ? error.message : String(error);
    await telegram.sendMessage(
      chatId,
      `❌ 發生錯誤，請稍後再試。\n\n` +
        `錯誤信息：${errorMsg}\n\n` +
        `💡 如果問題持續，請聯繫管理員。`
    );
  }
}
