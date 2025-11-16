/**
 * Throw Bottle Handler
 * 
 * Handles /throw command - create and throw a bottle.
 */

import type { Env, TelegramMessage, User } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import {
  createBottle,
  getDailyThrowCount,
  incrementDailyThrowCount,
} from '~/db/queries/bottles';
import {
  validateBottleContent,
  canThrowBottle,
  getBottleQuota,
} from '~/domain/bottle';
import type { ThrowBottleInput } from '~/domain/bottle';
import { createI18n } from '~/i18n';

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
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    console.log('[handleThrow] Starting for user:', telegramId);
    
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      await telegram.sendMessage(chatId, '❌ 用戶不存在，請先使用 /start 註冊。');
      return;
    }

    console.log('[handleThrow] User found:', user.nickname);
    const i18n = createI18n(user.language_pref || 'zh-TW');

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
    const inviteBonus = 0; // TODO: Calculate from invites table
    const isVip = !!(user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > new Date());
    
    if (!canThrowBottle(throwsToday, isVip, inviteBonus)) {
      const { quota } = getBottleQuota(isVip, inviteBonus);
      await telegram.sendMessage(
        chatId,
        `❌ 今日漂流瓶配額已用完（${throwsToday}/${quota}）\n\n` +
          `💡 升級 VIP 可獲得更多配額：/vip`
      );
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
          [
            { text: '✍️ 重新開始', callback_data: 'draft_new' },
          ],
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

    // Directly ask for bottle content
    const targetText = targetGender === 'male' ? '男生' : targetGender === 'female' ? '女生' : '任何人';
    await telegram.sendMessage(
      chatId,
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
        `⚠️ **注意**：YouTube 等外部連結會被拦截`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('[handleThrow] Error:', error);
    console.error('[handleThrow] Error stack:', error instanceof Error ? error.stack : 'No stack');
    await telegram.sendMessage(
      chatId, 
      `❌ 發生錯誤，請稍後再試。\n\n錯誤信息：${error instanceof Error ? error.message : String(error)}`
    );
  }
}


/**
 * Process bottle content (called from message handler)
 */
export async function processBottleContent(
  user: User,
  content: string,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = parseInt(user.telegram_id);

  try {
    // Validate content
    const validation = validateBottleContent(content);
    if (!validation.valid) {
      await telegram.sendMessage(
        chatId,
        `❌ ${validation.error}\n\n請重新輸入瓶子內容。`
      );
      return;
    }

    // Check URL whitelist
    const { checkUrlWhitelist } = await import('~/utils/url-whitelist');
    const urlCheck = checkUrlWhitelist(content);
    if (!urlCheck.allowed) {
      await telegram.sendMessage(
        chatId,
        `❌ 瓶子內容包含不允許的網址\n\n` +
          `🚫 禁止的網址：\n${urlCheck.blockedUrls?.map(url => `• ${url}`).join('\n')}\n\n` +
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
    
    if (session) {
      const sessionData = parseSessionData(session);
      target_gender = sessionData.data?.target_gender || 'any';
      target_mbti_filter = sessionData.data?.target_mbti || [];
      target_zodiac_filter = sessionData.data?.target_zodiac || [];
    }

    const bottleInput: ThrowBottleInput = {
      content,
      target_gender,
      target_mbti_filter: target_mbti_filter.length > 0 ? target_mbti_filter : undefined,
      target_zodiac_filter: target_zodiac_filter.length > 0 ? target_zodiac_filter : undefined,
      language: user.language_pref,
    };

    // Create bottle
    const bottleId = await createBottle(db, user.telegram_id, bottleInput);

    // Increment daily count
    await incrementDailyThrowCount(db, user.telegram_id);

    // Get updated quota info
    const throwsToday = await getDailyThrowCount(db, user.telegram_id);
    const inviteBonus = 0; // TODO: Calculate from invites
    const isVip = !!(user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > new Date());
    const { quota } = getBottleQuota(isVip, inviteBonus);

    // Send success message
    await telegram.sendMessage(
      chatId,
      `🎉 漂流瓶已丟出！\n\n` +
        `瓶子 ID：#${bottleId}\n` +
        `今日已丟：${throwsToday}/${quota}\n\n` +
        `💡 你的瓶子將在 24 小時內等待有緣人撿起～\n\n` +
        `想要撿別人的瓶子嗎？使用 /catch`
    );
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
