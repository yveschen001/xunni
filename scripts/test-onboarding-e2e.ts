/**
 * 真正的端到端测试 - 模拟人类操作整个注册流程
 * 这个测试会真正发送请求到 staging 环境，模拟用户点击按钮和输入文本
 */

const WORKER_URL = process.env.WORKER_URL || 'https://xunni-bot-staging.yves221.workers.dev';
const TEST_USER_ID = Math.floor(Math.random() * 1000000) + 100000000;

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
      id: Math.floor(Math.random() * 1000000).toString(),
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

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testOnboardingFlow() {
  console.log('🧪 开始真正的端到端测试...\n');
  console.log(`Worker URL: ${WORKER_URL}`);
  console.log(`Test User ID: ${TEST_USER_ID}\n`);
  console.log('='.repeat(80));

  let currentMessageId = Math.floor(Math.random() * 1000000);
  const errors: string[] = [];

  try {
    // Step 1: 发送 /start
    console.log('\n�� Step 1: 发送 /start');
    const startUpdate = createTelegramUpdate('/start', TEST_USER_ID);
    const startResult = await sendWebhook(startUpdate);
    console.log(`   Status: ${startResult.status}`);
    if (startResult.status !== 200) {
      errors.push(`Step 1 failed: ${startResult.status}`);
    }
    // 检查所有可能的占位符格式
    const placeholderPatterns = [
      /\[需要翻译/i,
      /\[Translation needed/i,
      /\[onboarding\./,
      /\[nickname\./,
      /\[warnings\./,
      /\[success\./,
      /\[common\./,
      /\[errors\./,
    ];
    for (const pattern of placeholderPatterns) {
      if (pattern.test(startResult.data)) {
        errors.push('Step 1: 发现占位符！');
        break;
      }
    }
    await sleep(1000);

    // Step 2: 选择语言
    console.log('\n📝 Step 2: 选择语言 (zh-TW)');
    const langUpdate = createCallbackQueryUpdate('lang_zh-TW', TEST_USER_ID, currentMessageId++);
    const langResult = await sendWebhook(langUpdate);
    console.log(`   Status: ${langResult.status}`);
    if (langResult.status !== 200) {
      errors.push(`Step 2 failed: ${langResult.status}`);
    }
    // 检查所有可能的占位符格式
    for (const pattern of placeholderPatterns) {
      if (pattern.test(langResult.data)) {
        errors.push('Step 2: 发现占位符！');
        break;
      }
    }
    await sleep(1000);

    // Step 3: 使用 Telegram 昵称
    console.log('\n📝 Step 3: 使用 Telegram 昵称');
    const nicknameUpdate = createCallbackQueryUpdate('nickname_use_telegram', TEST_USER_ID, currentMessageId++);
    const nicknameResult = await sendWebhook(nicknameUpdate);
    console.log(`   Status: ${nicknameResult.status}`);
    if (nicknameResult.status !== 200) {
      errors.push(`Step 3 failed: ${nicknameResult.status}`);
    }
    // 检查所有可能的占位符格式
    for (const pattern of placeholderPatterns) {
      if (pattern.test(nicknameResult.data)) {
        errors.push('Step 3: 发现占位符！');
        break;
      }
    }
    await sleep(1000);

    // Step 4: 选择性别
    console.log('\n📝 Step 4: 选择性别 (male)');
    const genderUpdate = createCallbackQueryUpdate('gender_male', TEST_USER_ID, currentMessageId++);
    const genderResult = await sendWebhook(genderUpdate);
    console.log(`   Status: ${genderResult.status}`);
    if (genderResult.status !== 200) {
      errors.push(`Step 4 failed: ${genderResult.status}`);
    }
    // 检查是否显示 "male" 而不是"男性"
    if (genderResult.data.includes(': male') && !genderResult.data.includes('男性')) {
      errors.push('Step 4: 性别显示为 "male" 而不是"男性"！');
    }
    await sleep(1000);

    // Step 5: 确认性别
    console.log('\n📝 Step 5: 确认性别');
    const confirmGenderUpdate = createCallbackQueryUpdate('gender_confirm_male', TEST_USER_ID, currentMessageId++);
    const confirmGenderResult = await sendWebhook(confirmGenderUpdate);
    console.log(`   Status: ${confirmGenderResult.status}`);
    if (confirmGenderResult.status !== 200) {
      errors.push(`Step 5 failed: ${confirmGenderResult.status}`);
    }
    await sleep(1000);

    // Step 6: 输入生日
    console.log('\n📝 Step 6: 输入生日 (1990-01-01)');
    const birthdayUpdate = createTelegramUpdate('1990-01-01', TEST_USER_ID);
    const birthdayResult = await sendWebhook(birthdayUpdate);
    console.log(`   Status: ${birthdayResult.status}`);
    if (birthdayResult.status !== 200) {
      errors.push(`Step 6 failed: ${birthdayResult.status}`);
    }
    await sleep(1000);

    // Step 7: 确认生日
    console.log('\n📝 Step 7: 确认生日');
    const confirmBirthdayUpdate = createCallbackQueryUpdate('confirm_birthday_1990-01-01', TEST_USER_ID, currentMessageId++);
    const confirmBirthdayResult = await sendWebhook(confirmBirthdayUpdate);
    console.log(`   Status: ${confirmBirthdayResult.status}`);
    if (confirmBirthdayResult.status !== 200) {
      errors.push(`Step 7 failed: ${confirmBirthdayResult.status}`);
    }
    await sleep(1000);

    // Step 8: 选择血型
    console.log('\n📝 Step 8: 选择血型 (A)');
    const bloodTypeUpdate = createCallbackQueryUpdate('blood_type_A', TEST_USER_ID, currentMessageId++);
    const bloodTypeResult = await sendWebhook(bloodTypeUpdate);
    console.log(`   Status: ${bloodTypeResult.status}`);
    if (bloodTypeResult.status !== 200) {
      errors.push(`Step 8 failed: ${bloodTypeResult.status}`);
    }
    await sleep(1000);

    // Step 9: 跳过 MBTI
    console.log('\n📝 Step 9: 跳过 MBTI');
    const skipMBTIUpdate = createCallbackQueryUpdate('mbti_choice_skip', TEST_USER_ID, currentMessageId++);
    const skipMBTIResult = await sendWebhook(skipMBTIUpdate);
    console.log(`   Status: ${skipMBTIResult.status}`);
    if (skipMBTIResult.status !== 200) {
      errors.push(`Step 9 failed: ${skipMBTIResult.status}`);
    }
    await sleep(1000);

    // Step 10: 反诈骗确认
    console.log('\n📝 Step 10: 反诈骗确认');
    const antiFraudUpdate = createCallbackQueryUpdate('anti_fraud_yes', TEST_USER_ID, currentMessageId++);
    const antiFraudResult = await sendWebhook(antiFraudUpdate);
    console.log(`   Status: ${antiFraudResult.status}`);
    if (antiFraudResult.status !== 200) {
      errors.push(`Step 10 failed: ${antiFraudResult.status}`);
    }
    await sleep(1000);

    // Step 11: 同意条款
    console.log('\n📝 Step 11: 同意条款');
    const termsUpdate = createCallbackQueryUpdate('agree_terms', TEST_USER_ID, currentMessageId++);
    const termsResult = await sendWebhook(termsUpdate);
    console.log(`   Status: ${termsResult.status}`);
    if (termsResult.status !== 200) {
      errors.push(`Step 11 failed: ${termsResult.status}`);
    }

    // 总结
    console.log('\n' + '='.repeat(80));
    if (errors.length === 0) {
      console.log('✅ 所有步骤都通过了！');
      console.log('✅ 没有发现占位符！');
    } else {
      console.log(`❌ 发现 ${errors.length} 个错误：`);
      errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ 测试过程中发生错误：', error);
    process.exit(1);
  }
}

testOnboardingFlow();
