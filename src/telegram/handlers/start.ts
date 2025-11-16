/**
 * /start Handler
 * Based on @doc/SPEC.md and @doc/ONBOARDING_FLOW.md
 *
 * Handles user registration and onboarding flow.
 */

import type { Env, TelegramMessage, User } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { findUserByTelegramId, createUser } from '~/db/queries/users';
import { generateInviteCode, hasCompletedOnboarding } from '~/domain/user';
import { createTelegramService } from '~/services/telegram';
import { getPopularLanguageButtons } from '~/i18n/languages';

// ============================================================================
// /start Handler
// ============================================================================

export async function handleStart(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // Check if user exists
    let user = await findUserByTelegramId(db, telegramId);

    if (!user) {
      // New user - create account
      user = await createUser(db, {
        telegram_id: telegramId,
        username: message.from!.username,
        first_name: message.from!.first_name,
        last_name: message.from!.last_name,
        language_pref: message.from!.language_code || 'zh-TW',
        invite_code: generateInviteCode(),
      });

      const { createI18n } = await import('~/i18n');
      const i18n = createI18n(user.language_pref || 'zh-TW');
      await telegram.sendMessageWithButtons(
        chatId,
        i18n.t('onboarding.welcome'),
        getPopularLanguageButtons()
      );

      return;
    }

    // Existing user
    if (hasCompletedOnboarding(user)) {
      // Already completed onboarding
      await telegram.sendMessageWithButtons(
        chatId,
        `👋 歡迎回來，${user.nickname}！\n\n` +
          `你可以：\n` +
          `🌊 丟出漂流瓶 - /throw\n` +
          `🎣 撿起漂流瓶 - /catch\n` +
          `👤 查看個人資料 - /profile\n` +
          `📊 查看統計 - /stats\n` +
          `⭐ 升級 VIP - /vip\n` +
          `❓ 查看幫助 - /help`,
        [
          [
            { text: '🌊 丟出漂流瓶', callback_data: 'throw' },
            { text: '🎣 撿起漂流瓶', callback_data: 'catch' },
          ],
          [
            { text: '👤 個人資料', callback_data: 'profile' },
            { text: '📊 統計', callback_data: 'stats' },
          ],
        ]
      );
    } else {
      // Resume onboarding
      await resumeOnboarding(user, chatId, telegram, db);
    }
  } catch (error) {
    console.error('[handleStart] Error:', error);
    await telegram.sendMessage(
      chatId,
      '❌ 發生錯誤，請稍後再試。\n\n如果問題持續，請聯繫管理員。'
    );
  }
}

// ============================================================================
// Onboarding Flow
// ============================================================================

/**
 * Resume onboarding from where user left off
 */
async function resumeOnboarding(
  user: User,
  chatId: number,
  telegram: ReturnType<typeof createTelegramService>,
  _db: ReturnType<typeof createDatabaseClient>
): Promise<void> {
  const step = user.onboarding_step;

  switch (step) {
    case 'language_selection': {
      // Show language selection with buttons
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n('zh-TW');
      await telegram.sendMessageWithButtons(
        chatId,
        i18n.t('onboarding.welcome'),
        getPopularLanguageButtons()
      );
      break;
    }

    case 'start':
    case 'nickname':
      await telegram.sendMessage(chatId, `請告訴我你的暱稱（顯示名稱）：`);
      break;

    case 'avatar':
      await telegram.sendMessage(
        chatId,
        `很好！現在請上傳你的頭像照片：\n\n` + `（你也可以稍後在個人資料中設置）`
      );
      break;

    case 'gender':
      await telegram.sendMessageWithButtons(
        chatId,
        `請選擇你的性別：\n\n` + `⚠️ 注意：性別設定後無法修改，請謹慎選擇！`,
        [
          [
            { text: '👨 男性', callback_data: 'gender_male' },
            { text: '👩 女性', callback_data: 'gender_female' },
          ],
        ]
      );
      break;

    case 'birthday':
      await telegram.sendMessage(
        chatId,
        `請輸入你的生日（格式：YYYY-MM-DD）：\n\n` +
          `例如：1995-06-15\n\n` +
          `⚠️ 注意：\n` +
          `• 生日設定後無法修改\n` +
          `• 必須年滿 18 歲才能使用本服務`
      );
      break;

    case 'mbti':
      // Show MBTI options: manual / test / skip
      await telegram.sendMessageWithButtons(
        chatId,
        `🧠 現在讓我們設定你的 MBTI 性格類型！\n\n` +
          `這將幫助我們為你找到更合適的聊天對象～\n\n` +
          `你想要如何設定？`,
        [
          [
            { text: '✍️ 我已經知道我的 MBTI', callback_data: 'mbti_choice_manual' },
          ],
          [
            { text: '📝 進行快速測驗', callback_data: 'mbti_choice_test' },
          ],
          [
            { text: '⏭️ 稍後再說', callback_data: 'mbti_choice_skip' },
          ],
        ]
      );
      break;

    case 'anti_fraud':
      // Show anti-fraud confirmation with buttons
      await telegram.sendMessageWithButtons(
        chatId,
        `🛡️ 最後一步：反詐騙安全確認\n\n` +
          `為了保護所有使用者的安全，請確認你了解以下事項：\n\n` +
          `1. 你了解網路交友的安全風險嗎？\n` +
          `2. 你會保護好自己的個人資訊嗎？\n` +
          `3. 遇到可疑訊息時，你會提高警覺嗎？\n\n` +
          `請確認：`,
        [
          [{ text: '✅ 是的，我了解並會注意安全', callback_data: 'anti_fraud_yes' }],
          [{ text: '📚 我想了解更多安全知識', callback_data: 'anti_fraud_learn' }],
        ]
      );
      break;

    case 'terms':
      await telegram.sendMessageWithButtons(
        chatId,
        `在開始使用前，請閱讀並同意我們的服務條款：\n\n` +
          `📋 隱私權政策\n` +
          `📋 使用者條款\n\n` +
          `點擊下方按鈕表示你已閱讀並同意上述條款。`,
        [
          [{ text: '✅ 我已閱讀並同意', callback_data: 'agree_terms' }],
          [{ text: '📋 查看隱私權政策', url: 'https://xunni.example.com/privacy' }],
          [{ text: '📋 查看使用者條款', url: 'https://xunni.example.com/terms' }],
        ]
      );
      break;

    default:
      await telegram.sendMessage(
        chatId,
        `❌ 註冊流程出現問題，請重新開始：/start`
      );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract invite code from /start command
 * Format: /start invite_XXXXXX
 */
export function extractInviteCode(text: string): string | null {
  const match = text.match(/\/start\s+(invite_[A-Z0-9-]+)/i);
  return match ? match[1] : null;
}
