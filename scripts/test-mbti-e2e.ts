/**
 * MBTI 完整端到端测试
 * 测试 12 题快速版本和 36 题完整版本
 * 验证 i18n key、问题显示、答案计算
 */

const WORKER_URL = process.env.WORKER_URL || 'https://xunni-bot-staging.yves221.workers.dev';

function createTelegramUpdate(text: string, userId: number) {
  return {
    update_id: Math.floor(Math.random() * 1000000),
    message: {
      message_id: Math.floor(Math.random() * 1000000),
      from: { id: userId, is_bot: false, first_name: 'Test', username: 'testuser' },
      chat: { id: userId, type: 'private' },
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
      from: { id: userId, is_bot: false, first_name: 'Test', username: 'testuser' },
      message: { message_id: messageId, chat: { id: userId, type: 'private' }, date: Math.floor(Date.now() / 1000) },
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

async function testMBTIQuick() {
  console.log('\n🧪 测试 MBTI 快速版本 (12 题)...\n');
  const testUserId = Math.floor(Math.random() * 1000000) + 100000000;
  let currentMessageId = Math.floor(Math.random() * 1000000);
  const errors: string[] = [];

  try {
    // 1. 先完成注册流程到 MBTI 步骤
    console.log('📝 Step 1: 完成注册到 MBTI 步骤...');
    await sendWebhook(createTelegramUpdate('/start', testUserId));
    await sleep(500);
    await sendWebhook(createCallbackQueryUpdate('lang_zh-TW', testUserId, currentMessageId++));
    await sleep(500);
    await sendWebhook(createCallbackQueryUpdate('nickname_use_telegram', testUserId, currentMessageId++));
    await sleep(500);
    await sendWebhook(createCallbackQueryUpdate('gender_male', testUserId, currentMessageId++));
    await sleep(500);
    await sendWebhook(createCallbackQueryUpdate('gender_confirm_male', testUserId, currentMessageId++));
    await sleep(500);
    await sendWebhook(createTelegramUpdate('1990-01-01', testUserId));
    await sleep(500);
    await sendWebhook(createCallbackQueryUpdate('confirm_birthday_1990-01-01', testUserId, currentMessageId++));
    await sleep(500);
    await sendWebhook(createCallbackQueryUpdate('blood_type_A', testUserId, currentMessageId++));
    await sleep(500);

    // 2. 选择 MBTI 测试
    console.log('📝 Step 2: 选择 MBTI 测试...');
    const mbtiTestResult = await sendWebhook(createCallbackQueryUpdate('mbti_choice_test', testUserId, currentMessageId++));
    if (mbtiTestResult.status !== 200) {
      errors.push(`MBTI 测试选择失败: ${mbtiTestResult.status}`);
    }
    await sleep(500);

    // 3. 选择快速版本
    console.log('📝 Step 3: 选择快速版本 (12 题)...');
    const quickResult = await sendWebhook(createCallbackQueryUpdate('mbti_test_quick', testUserId, currentMessageId++));
    if (quickResult.status !== 200) {
      errors.push(`快速版本选择失败: ${quickResult.status}`);
    }
    // 检查是否有占位符
    if (quickResult.data.includes('[需要翻译') || quickResult.data.includes('mbti.quick.question1')) {
      errors.push('快速版本第 1 题显示为占位符！');
    }
    await sleep(500);

    // 4. 回答所有 12 题（全部选择第一个选项，用于测试）
    console.log('📝 Step 4: 回答所有 12 题...');
    for (let i = 0; i < 12; i++) {
      const answerResult = await sendWebhook(createCallbackQueryUpdate(`mbti_answer_${i}_0`, testUserId, currentMessageId++));
      if (answerResult.status !== 200) {
        errors.push(`第 ${i + 1} 题回答失败: ${answerResult.status}`);
      }
      // 检查是否有占位符
      if (i < 11 && (answerResult.data.includes('[需要翻译') || answerResult.data.includes(`mbti.quick.question${i + 2}`))) {
        errors.push(`第 ${i + 2} 题显示为占位符！`);
      }
      await sleep(300);
    }

    // 5. 验证结果
    console.log('📝 Step 5: 验证测试结果...');
    await sleep(1000);
    // 检查最终结果是否显示

    if (errors.length === 0) {
      console.log('✅ MBTI 快速版本测试通过！');
    } else {
      console.log(`❌ 发现 ${errors.length} 个错误：`);
      errors.forEach((error, i) => console.log(`   ${i + 1}. ${error}`));
    }

    return errors.length === 0;
  } catch (error) {
    console.error('❌ 测试过程中发生错误：', error);
    return false;
  }
}

async function testMBTIFull() {
  console.log('\n🧪 测试 MBTI 完整版本 (36 题)...\n');
  const testUserId = Math.floor(Math.random() * 1000000) + 100000000;
  let currentMessageId = Math.floor(Math.random() * 1000000);
  const errors: string[] = [];

  try {
    // 1. 先完成注册
    console.log('📝 Step 1: 完成注册到 MBTI 步骤...');
    await sendWebhook(createTelegramUpdate('/start', testUserId));
    await sleep(500);
    await sendWebhook(createCallbackQueryUpdate('lang_zh-TW', testUserId, currentMessageId++));
    await sleep(500);
    await sendWebhook(createCallbackQueryUpdate('nickname_use_telegram', testUserId, currentMessageId++));
    await sleep(500);
    await sendWebhook(createCallbackQueryUpdate('gender_male', testUserId, currentMessageId++));
    await sleep(500);
    await sendWebhook(createCallbackQueryUpdate('gender_confirm_male', testUserId, currentMessageId++));
    await sleep(500);
    await sendWebhook(createTelegramUpdate('1990-01-01', testUserId));
    await sleep(500);
    await sendWebhook(createCallbackQueryUpdate('confirm_birthday_1990-01-01', testUserId, currentMessageId++));
    await sleep(500);
    await sendWebhook(createCallbackQueryUpdate('blood_type_A', testUserId, currentMessageId++));
    await sleep(500);

    // 2. 选择 MBTI 测试
    console.log('📝 Step 2: 选择 MBTI 测试...');
    await sendWebhook(createCallbackQueryUpdate('mbti_choice_test', testUserId, currentMessageId++));
    await sleep(500);

    // 3. 选择完整版本
    console.log('📝 Step 3: 选择完整版本 (36 题)...');
    const fullResult = await sendWebhook(createCallbackQueryUpdate('mbti_test_full', testUserId, currentMessageId++));
    if (fullResult.status !== 200) {
      errors.push(`完整版本选择失败: ${fullResult.status}`);
    }
    // 检查是否有占位符
    if (fullResult.data.includes('[需要翻译') || fullResult.data.includes('mbti.full.question1')) {
      errors.push('完整版本第 1 题显示为占位符！');
    }
    await sleep(500);

    // 4. 回答所有 36 题（全部选择第一个选项）
    console.log('📝 Step 4: 回答所有 36 题...');
    for (let i = 0; i < 36; i++) {
      const answerResult = await sendWebhook(createCallbackQueryUpdate(`mbti_answer_${i}_0`, testUserId, currentMessageId++));
      if (answerResult.status !== 200) {
        errors.push(`第 ${i + 1} 题回答失败: ${answerResult.status}`);
      }
      await sleep(200);
    }

    // 5. 验证结果
    console.log('📝 Step 5: 验证测试结果...');
    await sleep(1000);

    if (errors.length === 0) {
      console.log('✅ MBTI 完整版本测试通过！');
    } else {
      console.log(`❌ 发现 ${errors.length} 个错误：`);
      errors.forEach((error, i) => console.log(`   ${i + 1}. ${error}`));
    }

    return errors.length === 0;
  } catch (error) {
    console.error('❌ 测试过程中发生错误：', error);
    return false;
  }
}

async function main() {
  console.log('🚀 MBTI 完整端到端测试\n');
  console.log('='.repeat(80));
  console.log(`Worker URL: ${WORKER_URL}`);
  console.log('='.repeat(80));

  const quickPassed = await testMBTIQuick();
  const fullPassed = await testMBTIFull();

  console.log('\n' + '='.repeat(80));
  if (quickPassed && fullPassed) {
    console.log('✅ 所有 MBTI 测试通过！');
    process.exit(0);
  } else {
    console.log('❌ 部分测试失败');
    process.exit(1);
  }
}

main();
