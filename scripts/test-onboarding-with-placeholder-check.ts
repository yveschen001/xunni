/**
 * 增强的注册流程端到端测试
 * 1. 真正模拟用户操作
 * 2. 检查所有响应中是否有占位符
 * 3. 自动检测并报告问题
 */

const WORKER_URL = process.env.WORKER_URL || 'https://xunni-bot-staging.yves221.workers.dev';
const TEST_USER_ID = Math.floor(Math.random() * 1000000) + 100000000;

// 占位符检测模式
const PLACEHOLDER_PATTERNS = [
  /\[需要翻译/i,
  /\[Translation needed/i,
  /\[Translation Needed/i,
  /\[onboarding\./,
  /\[nickname\./,
  /\[warnings\./,
  /\[success\./,
  /\[common\./,
  /\[errors\./,
  /\[gender\./,
];

function createTelegramUpdate(text: string, userId: number) {
  return {
    update_id: Math.floor(Math.random() * 1000000),
    message: {
      message_id: Math.floor(Math.random() * 1000000),
      from: {
        id: userId,
        is_bot: false,
        first_name: 'Test',
        username: 'testuser',
      },
      chat: {
        id: userId,
        type: 'private',
      },
      date: Math.floor(Date.now() / 1000),
      text,
    },
  };
}

function createCallbackQueryUpdate(callbackData: string, userId: number, messageId: number) {
  return {
    update_id: Math.floor(Math.random() * 1000000),
    callback_query: {
      id: Math.floor(Math.random() * 1000000),
      from: {
        id: userId,
        is_bot: false,
        first_name: 'Test',
        username: 'testuser',
      },
      message: {
        message_id: messageId,
        chat: {
          id: userId,
          type: 'private',
        },
        date: Math.floor(Date.now() / 1000),
        text: 'Test',
      },
      data: callbackData,
    },
  };
}

async function sendWebhook(update: any): Promise<{ status: number; data: string }> {
  const response = await fetch(`${WORKER_URL}/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  });
  const data = await response.text();
  return { status: response.status, data };
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function checkPlaceholders(data: string, stepName: string): string[] {
  const errors: string[] = [];
  
  for (const pattern of PLACEHOLDER_PATTERNS) {
    const matches = data.match(pattern);
    if (matches) {
      // 提取占位符
      const placeholderMatch = data.match(/\[([^\]]+)\]/g);
      if (placeholderMatch) {
        placeholderMatch.forEach(placeholder => {
          errors.push(`${stepName}: 发现占位符 ${placeholder}`);
        });
      }
    }
  }
  
  return errors;
}

async function testOnboardingFlow() {
  console.log('🧪 开始增强的注册流程测试（包含占位符检查）...\n');
  console.log(`Worker URL: ${WORKER_URL}`);
  console.log(`Test User ID: ${TEST_USER_ID}\n`);
  console.log('='.repeat(80));

  let currentMessageId = Math.floor(Math.random() * 1000000);
  const errors: string[] = [];
  const placeholderErrors: string[] = [];

  try {
    // Step 1: 发送 /start
    console.log('\n📝 Step 1: 发送 /start');
    const startUpdate = createTelegramUpdate('/start', TEST_USER_ID);
    const startResult = await sendWebhook(startUpdate);
    console.log(`   Status: ${startResult.status}`);
    if (startResult.status !== 200) {
      errors.push(`Step 1 failed: ${startResult.status}`);
    }
    const step1Placeholders = checkPlaceholders(startResult.data, 'Step 1');
    placeholderErrors.push(...step1Placeholders);
    await sleep(1000);

    // Step 2: 选择语言
    console.log('\n📝 Step 2: 选择语言 (zh-TW)');
    const langUpdate = createCallbackQueryUpdate('lang_zh-TW', TEST_USER_ID, currentMessageId++);
    const langResult = await sendWebhook(langUpdate);
    console.log(`   Status: ${langResult.status}`);
    if (langResult.status !== 200) {
      errors.push(`Step 2 failed: ${langResult.status}`);
    }
    const step2Placeholders = checkPlaceholders(langResult.data, 'Step 2');
    placeholderErrors.push(...step2Placeholders);
    await sleep(1000);

    // Step 3: 使用 Telegram 昵称
    console.log('\n📝 Step 3: 使用 Telegram 昵称');
    const nicknameUpdate = createCallbackQueryUpdate('nickname_use_telegram', TEST_USER_ID, currentMessageId++);
    const nicknameResult = await sendWebhook(nicknameUpdate);
    console.log(`   Status: ${nicknameResult.status}`);
    if (nicknameResult.status !== 200) {
      errors.push(`Step 3 failed: ${nicknameResult.status}`);
    }
    const step3Placeholders = checkPlaceholders(nicknameResult.data, 'Step 3');
    placeholderErrors.push(...step3Placeholders);
    await sleep(1000);

    // Step 4: 选择性别
    console.log('\n📝 Step 4: 选择性别 (male)');
    const genderUpdate = createCallbackQueryUpdate('gender_male', TEST_USER_ID, currentMessageId++);
    const genderResult = await sendWebhook(genderUpdate);
    console.log(`   Status: ${genderResult.status}`);
    if (genderResult.status !== 200) {
      errors.push(`Step 4 failed: ${genderResult.status}`);
    }
    const step4Placeholders = checkPlaceholders(genderResult.data, 'Step 4');
    placeholderErrors.push(...step4Placeholders);
    await sleep(1000);

    // Step 5: 确认性别
    console.log('\n📝 Step 5: 确认性别');
    const confirmGenderUpdate = createCallbackQueryUpdate('gender_confirm_male', TEST_USER_ID, currentMessageId++);
    const confirmGenderResult = await sendWebhook(confirmGenderUpdate);
    console.log(`   Status: ${confirmGenderResult.status}`);
    if (confirmGenderResult.status !== 200) {
      errors.push(`Step 5 failed: ${confirmGenderResult.status}`);
    }
    const step5Placeholders = checkPlaceholders(confirmGenderResult.data, 'Step 5');
    placeholderErrors.push(...step5Placeholders);
    await sleep(1000);

    // Step 6: 输入生日
    console.log('\n📝 Step 6: 输入生日 (1990-01-01)');
    const birthdayUpdate = createTelegramUpdate('1990-01-01', TEST_USER_ID);
    const birthdayResult = await sendWebhook(birthdayUpdate);
    console.log(`   Status: ${birthdayResult.status}`);
    if (birthdayResult.status !== 200) {
      errors.push(`Step 6 failed: ${birthdayResult.status}`);
    }
    const step6Placeholders = checkPlaceholders(birthdayResult.data, 'Step 6');
    placeholderErrors.push(...step6Placeholders);
    await sleep(1000);

    // Step 7: 确认生日
    console.log('\n📝 Step 7: 确认生日');
    const confirmBirthdayUpdate = createCallbackQueryUpdate('confirm_birthday_1990-01-01', TEST_USER_ID, currentMessageId++);
    const confirmBirthdayResult = await sendWebhook(confirmBirthdayUpdate);
    console.log(`   Status: ${confirmBirthdayResult.status}`);
    if (confirmBirthdayResult.status !== 200) {
      errors.push(`Step 7 failed: ${confirmBirthdayResult.status}`);
    }
    const step7Placeholders = checkPlaceholders(confirmBirthdayResult.data, 'Step 7');
    placeholderErrors.push(...step7Placeholders);
    await sleep(1000);

    // 总结
    console.log('\n' + '='.repeat(80));
    if (errors.length === 0 && placeholderErrors.length === 0) {
      console.log('✅ 所有步骤都通过了！');
      console.log('✅ 没有发现占位符！');
    } else {
      if (errors.length > 0) {
        console.log(`❌ 发现 ${errors.length} 个错误：`);
        errors.forEach((error, i) => {
          console.log(`   ${i + 1}. ${error}`);
        });
      }
      if (placeholderErrors.length > 0) {
        console.log(`\n❌ 发现 ${placeholderErrors.length} 个占位符：`);
        placeholderErrors.forEach((error, i) => {
          console.log(`   ${i + 1}. ${error}`);
        });
        console.log('\n⚠️  发现占位符！运行自动修复：');
        console.log('   pnpm tsx scripts/auto-fix-i18n-placeholders.ts');
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ 测试过程中发生错误：', error);
    process.exit(1);
  }
}

testOnboardingFlow();

