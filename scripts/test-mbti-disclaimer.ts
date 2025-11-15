/**
 * Test MBTI Disclaimer
 * 
 * This script tests if the MBTI disclaimer is correctly displayed
 * at various stages of the onboarding flow.
 */

const WORKER_URL = process.env.WORKER_URL || 'https://xunni-bot-staging.yves221.workers.dev';
const TEST_USER_ID = 987654321; // Test user ID

interface TestResult {
  step: string;
  status: 'pass' | 'fail';
  message: string;
  duration: number;
}

const results: TestResult[] = [];

/**
 * Helper: Create message update
 */
function createMessage(text: string) {
  return {
    update_id: Date.now(),
    message: {
      message_id: Date.now(),
      from: {
        id: TEST_USER_ID,
        is_bot: false,
        first_name: 'Test',
        username: 'test_disclaimer',
        language_code: 'zh-TW',
      },
      chat: {
        id: TEST_USER_ID,
        first_name: 'Test',
        username: 'test_disclaimer',
        type: 'private',
      },
      date: Math.floor(Date.now() / 1000),
      text,
    },
  };
}

/**
 * Helper: Create callback query
 */
function createCallback(data: string) {
  return {
    update_id: Date.now(),
    callback_query: {
      id: Date.now().toString(),
      from: {
        id: TEST_USER_ID,
        is_bot: false,
        first_name: 'Test',
        username: 'test_disclaimer',
        language_code: 'zh-TW',
      },
      message: {
        message_id: Date.now(),
        from: {
          id: 123456789,
          is_bot: true,
          first_name: 'XunNi Bot',
          username: 'xunni_bot',
        },
        chat: {
          id: TEST_USER_ID,
          first_name: 'Test',
          username: 'test_disclaimer',
          type: 'private',
        },
        date: Math.floor(Date.now() / 1000),
        text: 'Test message',
      },
      chat_instance: Date.now().toString(),
      data,
    },
  };
}

/**
 * Helper: Send message
 */
async function sendMessage(text: string, step: string): Promise<string | null> {
  const startTime = Date.now();
  try {
    const response = await fetch(`${WORKER_URL}/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createMessage(text)),
    });

    const duration = Date.now() - startTime;
    
    if (response.ok) {
      const responseText = await response.text();
      console.log(`✅ [${step}] 成功 (${duration}ms)`);
      results.push({ step, status: 'pass', message: `发送: ${text}`, duration });
      return responseText;
    } else {
      console.log(`❌ [${step}] 失败: ${response.status}`);
      results.push({ step, status: 'fail', message: `HTTP ${response.status}`, duration });
      return null;
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ [${step}] 错误:`, error);
    results.push({ step, status: 'fail', message: String(error), duration });
    return null;
  }
}

/**
 * Helper: Click button
 */
async function clickButton(callbackData: string, step: string): Promise<string | null> {
  const startTime = Date.now();
  try {
    const response = await fetch(`${WORKER_URL}/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createCallback(callbackData)),
    });

    const duration = Date.now() - startTime;
    
    if (response.ok) {
      const responseText = await response.text();
      console.log(`✅ [${step}] 成功 (${duration}ms)`);
      results.push({ step, status: 'pass', message: `点击: ${callbackData}`, duration });
      return responseText;
    } else {
      console.log(`❌ [${step}] 失败: ${response.status}`);
      results.push({ step, status: 'fail', message: `HTTP ${response.status}`, duration });
      return null;
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ [${step}] 错误:`, error);
    results.push({ step, status: 'fail', message: String(error), duration });
    return null;
  }
}

/**
 * Helper: Delay
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Print report
 */
function printReport() {
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 MBTI 免责声明测试报告');
  console.log('='.repeat(80));

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const total = results.length;

  console.log(`\n总计: ${total} 个测试`);
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`📈 通过率: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n失败的测试:');
    results
      .filter(r => r.status === 'fail')
      .forEach(r => {
        console.log(`  ❌ [${r.step}] ${r.message}`);
      });
  }

  console.log('\n' + '='.repeat(80));
}

/**
 * Main test flow
 */
async function runTest() {
  console.log('🧪 开始测试 MBTI 免责声明...');
  console.log('='.repeat(80));
  console.log(`Worker URL: ${WORKER_URL}`);
  console.log(`Test User ID: ${TEST_USER_ID}`);
  console.log('='.repeat(80));

  // Reset user
  await sendMessage('/dev_reset', '0.重置用户');
  await delay(2000);

  // Start registration
  await sendMessage('开始测试', '1.触发欢迎');
  await delay(2000);

  await clickButton('lang_zh-TW', '2.选择繁体中文');
  await delay(2000);

  await sendMessage('免责测试用户', '3.输入昵称');
  await delay(2000);

  await clickButton('gender_male', '4.选择性别');
  await delay(2000);

  await clickButton('gender_confirm_male', '5.确认性别');
  await delay(2000);

  await sendMessage('2000-05-15', '6.输入生日');
  await delay(2000);

  await clickButton('confirm_birthday_2000-05-15', '7.确认生日');
  await delay(2000);

  console.log('\n\n📝 关键测试点：MBTI 选择页面');
  console.log('─'.repeat(80));
  console.log('✅ 预期：按钮应显示「進行快速測驗（12 題，僅供參考）」');
  console.log('💡 请在 Telegram 中手动验证按钮文案');

  // Click MBTI test
  await clickButton('mbti_choice_test', '8.开始 MBTI 测验');
  await delay(2000);

  console.log('\n\n📝 关键测试点：第一题免责声明');
  console.log('─'.repeat(80));
  console.log('✅ 预期：应显示「這是快速測驗（12 題），結果僅供參考。」');
  console.log('💡 请在 Telegram 中手动验证第一题的免责声明');

  // Answer all 12 questions (targeting INTJ)
  const answers = [
    { q: 0, a: 1, desc: 'I - 内向' },
    { q: 1, a: 1, desc: 'I - 内向' },
    { q: 2, a: 1, desc: 'I - 内向' },
    { q: 3, a: 1, desc: 'N - 直觉' },
    { q: 4, a: 1, desc: 'N - 直觉' },
    { q: 5, a: 1, desc: 'N - 直觉' },
    { q: 6, a: 0, desc: 'T - 思考' },
    { q: 7, a: 0, desc: 'T - 思考' },
    { q: 8, a: 0, desc: 'T - 思考' },
    { q: 9, a: 0, desc: 'J - 判断' },
    { q: 10, a: 0, desc: 'J - 判断' },
    { q: 11, a: 0, desc: 'J - 判断' },
  ];

  for (const { q, a, desc } of answers) {
    await clickButton(`mbti_answer_${q}_${a}`, `9.${q + 1}.回答第${q + 1}题 (${desc})`);
    await delay(500);
  }

  console.log('\n\n📝 关键测试点：测验完成页面');
  console.log('─'.repeat(80));
  console.log('✅ 预期：应显示以下内容：');
  console.log('   1. 「快速測驗完成！」（不是「測驗完成！」）');
  console.log('   2. 「⚠️ 注意：這是 12 題快速測驗，結果僅供參考。」');
  console.log('   3. 「未來我們將推出 36 題標準版測驗（Mini App）」');
  console.log('💡 请在 Telegram 中手动验证完成页面的所有文案');

  await delay(2000);

  console.log('\n\n' + '='.repeat(80));
  console.log('🎉 自动化测试完成！');
  console.log('='.repeat(80));
  console.log('\n请在 Telegram 中手动验证以下 3 个关键点：');
  console.log('1. ✅ MBTI 选择按钮是否显示「（12 題，僅供參考）」');
  console.log('2. ✅ 第一题是否显示免责声明');
  console.log('3. ✅ 完成页面是否显示完整的免责声明和未来计划');
  console.log('='.repeat(80));

  printReport();
}

runTest();

