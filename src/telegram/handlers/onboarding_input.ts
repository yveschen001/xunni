/**
 * Onboarding Input Handler
 * Based on @doc/ONBOARDING_FLOW.md
 *
 * Handles user input during onboarding process.
 */

import type { Env, TelegramMessage, User } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { findUserByTelegramId, updateUserProfile, updateOnboardingStep, updateMBTIResult, updateAntiFraudScore } from '~/db/queries/users';
import { validateNickname, validateBirthday, calculateAge, calculateZodiacSign, validateMBTI } from '~/domain/user';
import { createTelegramService } from '~/services/telegram';

// ============================================================================
// Onboarding Input Handler
// ============================================================================

export async function handleOnboardingInput(
  message: TelegramMessage,
  env: Env
): Promise<boolean> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();
  const text = message.text || '';

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      return false; // Not in onboarding
    }

    // Check if user is in onboarding
    if (user.onboarding_step === 'completed') {
      return false; // Already completed onboarding
    }

    const step = user.onboarding_step;

    // Handle input based on current step
    switch (step) {
      case 'nickname':
        return await handleNicknameInput(user, text, chatId, telegram, db);

      case 'birthday':
        return await handleBirthdayInput(user, text, chatId, telegram, db);

      case 'mbti':
        return await handleMBTIInput(user, text, chatId, telegram, db);

      case 'anti_fraud':
        return await handleAntiFraudInput(user, text, chatId, telegram, db);

      default:
        return false; // Not expecting text input
    }
  } catch (error) {
    console.error('[handleOnboardingInput] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤，請重新輸入。');
    return true;
  }
}

// ============================================================================
// Nickname Input
// ============================================================================

async function handleNicknameInput(
  user: User,
  nickname: string,
  chatId: number,
  telegram: ReturnType<typeof createTelegramService>,
  db: ReturnType<typeof createDatabaseClient>
): Promise<boolean> {
  // Validate nickname
  const validation = validateNickname(nickname);
  if (!validation.valid) {
    await telegram.sendMessage(chatId, `❌ ${validation.error}\n\n請重新輸入暱稱：`);
    return true;
  }

  // Save nickname
  await updateUserProfile(db, user.telegram_id, { nickname });

  // Move to next step
  await updateOnboardingStep(db, user.telegram_id, 'gender');

  // Show gender selection
  await telegram.sendMessageWithButtons(
    chatId,
    `很好！你的暱稱是：${nickname}\n\n` +
      `現在請選擇你的性別：\n\n` +
      `⚠️ 注意：性別設定後無法修改，請謹慎選擇！`,
    [
      [
        { text: '👨 男性', callback_data: 'gender_male' },
        { text: '👩 女性', callback_data: 'gender_female' },
      ],
    ]
  );

  return true;
}

// ============================================================================
// Birthday Input
// ============================================================================

async function handleBirthdayInput(
  user: User,
  birthday: string,
  chatId: number,
  telegram: ReturnType<typeof createTelegramService>,
  _db: ReturnType<typeof createDatabaseClient>
): Promise<boolean> {
  // Validate birthday
  const validation = validateBirthday(birthday);
  if (!validation.valid) {
    await telegram.sendMessage(chatId, `❌ ${validation.error}\n\n請重新輸入生日（格式：YYYY-MM-DD）：`);
    return true;
  }

  // Calculate age and zodiac sign
  const age = calculateAge(birthday);
  const zodiacSign = calculateZodiacSign(birthday);

  if (age === null || zodiacSign === null) {
    await telegram.sendMessage(chatId, `❌ 生日格式錯誤\n\n請重新輸入（格式：YYYY-MM-DD）：`);
    return true;
  }

  // Confirm birthday (second confirmation)
  await telegram.sendMessageWithButtons(
    chatId,
    `⚠️ 請確認你的生日資訊：\n\n` +
      `生日：${birthday}\n` +
      `年齡：${age} 歲\n` +
      `星座：${zodiacSign}\n\n` +
      `⚠️ 生日設定後無法修改，請確認無誤！`,
    [
      [
        { text: '✅ 確認', callback_data: `confirm_birthday_${birthday}` },
        { text: '❌ 重新輸入', callback_data: 'retry_birthday' },
      ],
    ]
  );

  return true;
}

// ============================================================================
// MBTI Input
// ============================================================================

async function handleMBTIInput(
  user: User,
  mbti: string,
  chatId: number,
  telegram: ReturnType<typeof createTelegramService>,
  db: ReturnType<typeof createDatabaseClient>
): Promise<boolean> {
  // Validate MBTI
  const validation = validateMBTI(mbti.toUpperCase());
  if (!validation.valid) {
    await telegram.sendMessage(
      chatId,
      `❌ ${validation.error}\n\n` +
        `請輸入有效的 MBTI 類型（例如：INTJ, ENFP）：`
    );
    return true;
  }

  // Save MBTI result
  await updateMBTIResult(db, user.telegram_id, mbti.toUpperCase());

  // Move to next step
  await updateOnboardingStep(db, user.telegram_id, 'anti_fraud');

  // Show anti-fraud test
  await telegram.sendMessage(
    chatId,
    `✅ MBTI 類型已設定：${mbti.toUpperCase()}\n\n` +
      `現在進行反詐騙測驗（簡化版）：\n\n` +
      `請回答「是」或「否」：\n` +
      `1. 你了解網路交友的安全風險嗎？\n` +
      `2. 你會保護好自己的個人資訊嗎？\n` +
      `3. 遇到可疑訊息時，你會提高警覺嗎？\n\n` +
      `請輸入「是」完成測驗：`
  );

  return true;
}

// ============================================================================
// Anti-Fraud Input
// ============================================================================

async function handleAntiFraudInput(
  user: User,
  answer: string,
  chatId: number,
  telegram: ReturnType<typeof createTelegramService>,
  _db: ReturnType<typeof createDatabaseClient>
): Promise<boolean> {
  // Simple check (in production, this would be a proper quiz)
  if (answer.includes('是') || answer.toLowerCase().includes('yes')) {
    // Pass the test
    await updateAntiFraudScore(db, user.telegram_id, 80);

    // Move to next step
    await updateOnboardingStep(db, user.telegram_id, 'terms');

    // Show terms agreement
    await telegram.sendMessageWithButtons(
      chatId,
      `✅ 反詐騙測驗通過！\n\n` +
        `最後一步：請閱讀並同意我們的服務條款\n\n` +
        `📋 隱私權政策\n` +
        `📋 使用者條款\n\n` +
        `點擊下方按鈕表示你已閱讀並同意上述條款。`,
      [
        [{ text: '✅ 我已閱讀並同意', callback_data: 'agree_terms' }],
        [{ text: '📋 查看隱私權政策', url: 'https://xunni.example.com/privacy' }],
        [{ text: '📋 查看使用者條款', url: 'https://xunni.example.com/terms' }],
      ]
    );

    return true;
  }

  await telegram.sendMessage(
    chatId,
    `❌ 請認真回答問題\n\n` +
      `為了保護所有使用者的安全，請確認你了解網路交友的風險。\n\n` +
      `請輸入「是」完成測驗：`
  );

  return true;
}

