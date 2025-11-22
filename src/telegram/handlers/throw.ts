/**
 * Throw Bottle Handler
 *
 * Handles /throw command - create and throw a bottle.
 */

import type { Env, TelegramMessage, TelegramCallbackQuery, User } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { createBottle, getDailyThrowCount, incrementDailyThrowCount } from '~/db/queries/bottles';
import { validateBottleContent, canThrowBottle } from '~/domain/bottle';
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
      // Fallback for unknown user language
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n('zh-TW');
      await telegram.sendMessage(chatId, i18n.t('common.userNotFound'));
      return;
    }

    const { createI18n } = await import('~/i18n');
    const i18n = createI18n(user.language_pref || 'zh-TW');

    console.error('[handleThrow] User found:', user.nickname);

    // Check if user completed onboarding
    if (user.onboarding_step !== 'completed') {
      await telegram.sendMessage(chatId, i18n.t('common.notRegistered'));
      return;
    }

    // Check if user is banned
    if (user.is_banned) {
      await telegram.sendMessage(
        chatId,
        i18n.t('errors.banned', { reason: '違規行為' }) // Generic reason if not available
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
        // 🆕 更新配額用完提示
        await telegram.sendMessage(
          chatId,
          `❌ 今日漂流瓶配額已用完（${quotaDisplay}）\n\n` +
            `📊 免費用戶：3 個/天\n` +
            `💎 VIP 用戶：30 個/天（三倍曝光）\n\n` +
            `🎁 邀請好友可增加配額：\n` +
            `• 免費用戶：最多 +7 個\n` +
            `• VIP 用戶：最多 +70 個\n\n` +
            `💡 升級 VIP 獲得：\n` +
            `• 🆕 三倍曝光機會（1 次 = 3 個對象）\n` +
            `• 更多配額（30 個/天）\n` +
            `• 進階篩選和翻譯\n\n` +
            `使用 /vip 立即升級`
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

    // Create session to store target gender and track user state
    const { upsertSession } = await import('~/db/queries/sessions');
    await upsertSession(db, telegramId, 'throw_bottle', {
      target_gender: targetGender,
    });

    console.error('[handleThrow] Created throw_bottle session:', {
      userId: telegramId,
      targetGender,
    });

    // Show prompt with #THROW tag for reply detection
    const targetText =
      targetGender === 'male' ? '男生' : targetGender === 'female' ? '女生' : '任何人';
    const throwPrompt =
      `🍾 **丟漂流瓶** #THROW\n\n` +
      `🎯 尋找對象：${targetText}\n` +
      `💡 可在 /edit_profile 中修改匹配偏好\n\n` +
      `📝 **請輸入你的漂流瓶內容**\n\n` +
      `✅ **規則**：\n` +
      `• 最短 5 個字符\n` +
      `• 最多 250 個字符\n` +
      `• 不允許連結、圖片、多媒體\n` +
      `• 不要包含個人聯絡方式\n\n` +
      `💬 **範例**：\n` +
      `「你好！我是一個喜歡音樂和電影的人，希望認識志同道合的朋友～」\n\n` +
      `💡 **兩種輸入方式**：\n` +
      `1️⃣ 點擊下方「🍾 丟漂流瓶」按鈕\n` +
      `2️⃣ 長按此訊息，選擇「回覆」後輸入內容`;

    await telegram.sendMessageWithButtons(
      chatId,
      throwPrompt,
      [
        [{ text: '🍾 丟漂流瓶', callback_data: 'throw_input' }],
        [{ text: '🏠 返回主選單', callback_data: 'return_to_menu' }],
      ],
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('[handleThrow] Error:', error);
    const errorStack = error instanceof Error ? error.stack : 'No stack';
    console.error('[handleThrow] Error stack:', errorStack);
    
    // Fallback i18n if user not found yet
    const { createI18n } = await import('~/i18n');
    const i18n = createI18n('zh-TW'); // Default to TW if we crashed before user load
    
    await telegram.sendMessage(
      chatId,
      i18n.t('errors.generic') + `\n\nError: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Handle "丟漂流瓶" button click - use ForceReply to prompt user input
 */
export async function handleThrowInputButton(
  callbackQuery: TelegramCallbackQuery,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      await telegram.answerCallbackQuery(callbackQuery.id, '⚠️ 用戶不存在');
      return;
    }

    // Check if user has active throw_bottle session
    const { getActiveSession } = await import('~/db/queries/sessions');
    const session = await getActiveSession(db, telegramId, 'throw_bottle');
    
    if (!session) {
      await telegram.answerCallbackQuery(callbackQuery.id, '⚠️ 會話已過期，請重新開始：/throw');
      return;
    }

    // Answer callback query first
    await telegram.answerCallbackQuery(callbackQuery.id, '💡 請在下方輸入框輸入內容');

    // Send a message with ForceReply to prompt user input
    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: '📝 請輸入你的漂流瓶內容：',
        reply_markup: {
          force_reply: true,
          selective: true,
        },
      }),
    });

    if (!response.ok) {
      console.error('[handleThrowInputButton] Failed to send ForceReply message:', await response.text());
    }
  } catch (error) {
    console.error('[handleThrowInputButton] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 系統發生錯誤');
  }
}

/**
 * Process bottle content (called from message handler)
 */
export async function processBottleContent(user: User, content: string, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = parseInt(user.telegram_id);
  let statusMsg: { message_id: number } | null = null;

  const { createI18n } = await import('~/i18n');
  const i18n = createI18n(user.language_pref || 'zh-TW');

  try {
    // Step 1: Basic validation (length, links, sensitive words)
    const validation = validateBottleContent(content);
    if (!validation.valid) {
      // Record risk score if validation failed due to inappropriate content
      if (validation.riskScore && validation.riskScore > 0) {
        await recordRiskScore(db, user.telegram_id, validation.riskScore);
      }
      
      // 🎨 UX: 友善的錯誤提示
      await telegram.sendMessage(
        chatId,
        i18n.t('bottle.throw.validationFailed', { error: validation.error || 'Unknown error' })
      );
      return;
    }

    // Step 2: AI moderation (optional, controlled by environment variable)
    if (env.ENABLE_AI_MODERATION === 'true') {
      try {
        const { createOpenAIService } = await import('~/services/openai');
        const openai = createOpenAIService(env);
        
        const aiResult = await openai.moderateContent(content);
        
        if (aiResult.flagged) {
          // AI detected inappropriate content
          const riskScore = 20; // AI detection risk score
          await recordRiskScore(db, user.telegram_id, riskScore);
          
          await telegram.sendMessage(
            chatId,
            i18n.t('bottle.throw.aiModerationFailed')
          );
          return;
        }
      } catch (aiError) {
        // AI moderation failed, don't block (avoid false positives)
        console.error('[AI Moderation] Error:', aiError);
      }
    }

    // Step 3: URL whitelist check (backup check, should be caught by validateBottleContent)
    const { checkUrlWhitelist } = await import('~/utils/url-whitelist');
    const urlCheck = checkUrlWhitelist(content);
    if (!urlCheck.allowed) {
      await telegram.sendMessage(
        chatId,
        i18n.t('bottle.throw.urlNotAllowed', { urls: urlCheck.blockedUrls?.map((url) => `• ${url}`).join('\n') })
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

    // 🆕 Check if user is VIP
    const isVip = !!(
      user.is_vip &&
      user.vip_expire_at &&
      new Date(user.vip_expire_at) > new Date()
    );

    // 🎨 UX: 階段 1 - 立即反饋（< 1 秒）
    const startTime = Date.now();
    try {
      statusMsg = await telegram.sendMessage(
        chatId,
        isVip
          ? `🍾 **正在丟出你的漂流瓶...**\n\n` +
            `✨ VIP 特權啟動中\n` +
            `🎯 正在為你尋找 3 個最佳配對對象\n\n` +
            `⏳ 預計 3-5 秒完成`
          : `🍾 **正在丟出你的漂流瓶...**\n\n` +
            `🎯 正在為你尋找最佳配對對象\n\n` +
            `⏳ 預計 2-3 秒完成`
      );
    } catch (sendError) {
      console.error('[handleThrow] Failed to send initial progress message:', sendError);
      // 如果發送失敗，設為 null，後續會跳過進度更新
      statusMsg = null;
    }

    // 🆕 Create bottle (VIP triple or regular)
    let bottleId: number;
    let vipMatchInfo: { matched: boolean; conversationId?: number; conversationIdentifier?: string; matcherNickname?: string } | null = null;
    if (isVip) {
      // VIP 用戶：創建三倍瓶子
      const { createVipTripleBottle } = await import('~/domain/vip_triple_bottle');
      const result = await createVipTripleBottle(db, user, bottleInput, env);
      bottleId = result.bottleId;
      vipMatchInfo = result.primaryMatch;
      console.error('[handleThrow] VIP triple bottle created:', bottleId, 'Primary match:', vipMatchInfo.matched);
    } else {
      // 免費用戶：創建普通瓶子
      bottleId = await createBottle(db, user.telegram_id, bottleInput, false);
      console.error('[handleThrow] Regular bottle created:', bottleId);
    }

    // 🎨 UX: 階段 2 - 創建瓶子完成（約 2 秒後）
    const elapsed1 = Date.now() - startTime;
    if (elapsed1 < 2000) {
      await new Promise((resolve) => setTimeout(resolve, 2000 - elapsed1));
    }
    if (statusMsg && statusMsg.message_id) {
      try {
        await telegram.editMessageText(
          chatId,
          statusMsg.message_id,
          isVip
            ? `🍾 **正在丟出你的漂流瓶...**\n\n` +
            `✅ 瓶子已創建\n` +
            `✨ VIP 特權啟動中\n` +
            `🎯 正在為你尋找 3 個最佳配對對象\n\n` +
            `⏳ 預計 2-3 秒完成`
            : `🍾 **正在丟出你的漂流瓶...**\n\n` +
            `✅ 瓶子已創建\n` +
            `🎯 正在為你尋找最佳配對對象\n\n` +
            `⏳ 預計 1-2 秒完成`
        );
      } catch (editError) {
        // 如果編輯失敗（訊息被刪除等），忽略錯誤，繼續執行
        console.error('[handleThrow] Failed to update progress (stage 2):', editError);
      }
    }

    // Increment daily count
    await incrementDailyThrowCount(db, user.telegram_id);

    // ✨ NEW: Try smart matching (non-blocking, won't affect existing flow)
    // 🆕 Skip smart matching for VIP triple bottles (already handled in createVipTripleBottle)
    if (!isVip) {
      // 🎨 UX: 階段 3 - 智能匹配進行中（約 4 秒後）
      const elapsed2 = Date.now() - startTime;
      if (elapsed2 < 4000) {
        await new Promise((resolve) => setTimeout(resolve, 4000 - elapsed2));
      }
      if (statusMsg && statusMsg.message_id) {
        try {
          await telegram.editMessageText(
            chatId,
            statusMsg.message_id,
            `🍾 **正在丟出你的漂流瓶...**\n\n` +
            `✅ 瓶子已創建\n` +
            `🔍 正在智能匹配最佳對象...\n\n` +
            `💡 這可能需要幾秒鐘，我們正在為你找到最合適的人`
          );
        } catch (editError) {
          console.error('[handleThrow] Failed to update progress (stage 3):', editError);
        }
      }

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
        
          // 發送通知給接收者
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
        
          // 發送通知給丟瓶子的人
          const matchedUserMaskedNickname = maskNickname(matchResult.user.nickname || matchResult.user.username || '匿名');
          await telegram.sendMessage(
            chatId,
            `🎯 你的漂流瓶已被配對成功！\n\n` +
            `📝 對方暱稱：${matchedUserMaskedNickname}\n` +
            `🧠 MBTI：${matchResult.user.mbti_result || '未設定'}\n` +
            `⭐ 星座：${matchResult.user.zodiac || '未設定'}\n` +
            `💝 匹配度：${matchPercentage}%\n` +
            highlightsText +
            `\n💬 等待對方回覆中...\n` +
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
    } // End of if (!isVip)

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
    // isVip already declared above
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

    // Clear throw_bottle session (bottle successfully created)
    const { clearSession } = await import('~/db/queries/sessions');
    await clearSession(db, user.telegram_id, 'throw_bottle');

    // 🎨 UX: 階段 4 - 完成，刪除進度訊息
    if (statusMsg && statusMsg.message_id) {
      try {
        await telegram.deleteMessage(chatId, statusMsg.message_id);
      } catch (deleteError) {
        // 如果刪除失敗（訊息已被刪除等），忽略錯誤，繼續執行
        console.error('[handleThrow] Failed to delete progress message:', deleteError);
      }
    }

    // 🆕 Send success message (different for VIP and free users)
    let successMessage: string;
    if (isVip) {
      // VIP 用戶成功訊息
      if (vipMatchInfo && vipMatchInfo.matched) {
        // 有智能配對成功
        successMessage =
          `✨ **VIP 特權啟動！智能配對成功！**\n\n` +
          `🎯 **第 1 個配對已完成：**\n` +
          `👤 對方：${vipMatchInfo.matcherNickname}\n` +
          `💬 對話標識符：${vipMatchInfo.conversationIdentifier}\n\n` +
          `📨 **另外 2 個槽位等待中：**\n` +
          `• 槽位 2：公共池（等待撿起）\n` +
          `• 槽位 3：公共池（等待撿起）\n\n` +
          `💡 你可能會收到 **最多 3 個對話**！\n` +
          `📊 今日已丟：${quotaDisplay}\n\n` +
          `使用 /chats 查看所有對話\n\n` +
          `💬 **請長按此訊息，選擇「回覆」後輸入內容和對方開始聊天**`;
      } else {
        // 智能配對未成功，3 個槽位都進入公共池
        successMessage =
          `✨ **VIP 特權啟動！**\n\n` +
          `🎯 你的瓶子已發送給 **3 個對象**：\n` +
          `• 槽位 1：公共池（等待撿起）\n` +
          `• 槽位 2：公共池（等待撿起）\n` +
          `• 槽位 3：公共池（等待撿起）\n\n` +
          `💬 你可能會收到 **最多 3 個對話**！\n` +
          `📊 今日已丟：${quotaDisplay}\n\n` +
          `💡 提示：每個對話都是獨立的，可以同時進行\n\n` +
          `使用 /chats 查看所有對話`;
      }
    } else {
      // 免費用戶成功訊息（加上 VIP 提示）
      successMessage =
        `🍾 漂流瓶已丟出！\n\n` +
        `瓶子 ID：#${bottleId}\n\n` +
        `🌊 等待有緣人撿起...\n` +
        `📊 今日已丟：${quotaDisplay}\n\n` +
        `💎 **升級 VIP 可獲得三倍曝光機會！**\n` +
        `一次丟瓶子 = 3 個對象，大幅提升配對成功率\n\n` +
        `使用 /vip 了解更多`;
    }

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

    // 🎨 UX: 錯誤時也要刪除進度訊息
    if (statusMsg) {
      try {
        await telegram.deleteMessage(chatId, statusMsg.message_id);
      } catch (deleteError) {
        console.error('[processBottleContent] Failed to delete progress message:', deleteError);
      }
    }

    const _errorMsg = error instanceof Error ? error.message : String(error);
    await telegram.sendMessage(
      chatId,
      i18n.t('errors.processError')
    );
  }
}

/**
 * Record risk score for user
 * Updates user's risk score and checks for auto-ban
 */
async function recordRiskScore(
  db: DatabaseClient,
  telegramId: string,
  riskScore: number
): Promise<void> {
  try {
    // Update user risk score
    const { addRiskScore, shouldAutoBan } = await import('~/domain/risk');
    const { findUserByTelegramId } = await import('~/db/queries/users');
    
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) return;
    
    const newRiskScore = addRiskScore(user.risk_score, riskScore);
    
    // Update database
    await db.d1
      .prepare('UPDATE users SET risk_score = ? WHERE telegram_id = ?')
      .bind(newRiskScore, telegramId)
      .run();
    
    // Check if auto-ban is needed
    if (shouldAutoBan(newRiskScore)) {
      const { banUser } = await import('~/db/queries/users');
      await banUser(db, telegramId, 'Auto-ban: High risk score', 24); // 24 hours
      
      console.error(`[Risk] User ${telegramId} auto-banned. Risk score: ${newRiskScore}`);
    }
  } catch (error) {
    console.error('[recordRiskScore] Error:', error);
    // Error doesn't affect main flow
  }
}
