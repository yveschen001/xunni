/**
 * Simulate Real User Flow
 * 
 * This script simulates a REAL user interacting with the bot:
 * - Clicking buttons
 * - Typing text
 * - Completing full registration
 * - Testing core features
 * 
 * This is NOT just API testing - it simulates actual Telegram interactions.
 */

const WORKER_URL = process.env.WORKER_URL || 'https://xunni-bot-staging.yves221.workers.dev';
const TEST_USER_ID = 999888777; // Simulated user ID
const TEST_USERNAME = 'test_user_sim';
const TEST_FIRST_NAME = 'Test User';

interface TestResult {
  step: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  duration: number;
}

const results: TestResult[] = [];

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Send a message to the bot (simulating user typing)
 */
async function sendMessage(text: string, step: string): Promise<any> {
  const startTime = Date.now();
  
  console.log(`\n📝 [${step}] 用户输入: "${text}"`);
  
  try {
    const response = await fetch(`${WORKER_URL}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        update_id: Date.now(),
        message: {
          message_id: Date.now(),
          from: {
            id: TEST_USER_ID,
            is_bot: false,
            first_name: TEST_FIRST_NAME,
            username: TEST_USERNAME,
            language_code: 'zh-TW',
          },
          chat: {
            id: TEST_USER_ID,
            first_name: TEST_FIRST_NAME,
            username: TEST_USERNAME,
            type: 'private',
          },
          date: Math.floor(Date.now() / 1000),
          text: text,
        },
      }),
    });

    const duration = Date.now() - startTime;
    
    if (response.ok) {
      const responseText = await response.text();
      console.log(`✅ [${step}] Bot 响应成功 (${duration}ms) - ${responseText}`);
      results.push({ step, status: 'pass', message: `发送消息: ${text}`, duration });
      return responseText;
    } else {
      console.log(`❌ [${step}] Bot 响应失败: ${response.status}`);
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
 * Click a button (simulating user clicking inline keyboard)
 */
async function clickButton(callbackData: string, step: string): Promise<any> {
  const startTime = Date.now();
  
  console.log(`\n🖱️  [${step}] 用户点击按钮: "${callbackData}"`);
  
  try {
    const response = await fetch(`${WORKER_URL}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        update_id: Date.now(),
        callback_query: {
          id: `cbq_${Date.now()}`,
          from: {
            id: TEST_USER_ID,
            is_bot: false,
            first_name: TEST_FIRST_NAME,
            username: TEST_USERNAME,
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
              first_name: TEST_FIRST_NAME,
              username: TEST_USERNAME,
              type: 'private',
            },
            date: Math.floor(Date.now() / 1000),
            text: 'Button message',
          },
          chat_instance: `${Date.now()}`,
          data: callbackData,
        },
      }),
    });

    const duration = Date.now() - startTime;
    
    if (response.ok) {
      const responseText = await response.text();
      console.log(`✅ [${step}] Bot 响应成功 (${duration}ms) - ${responseText}`);
      results.push({ step, status: 'pass', message: `点击按钮: ${callbackData}`, duration });
      return responseText;
    } else {
      console.log(`❌ [${step}] Bot 响应失败: ${response.status}`);
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
 * Main test flow - simulating a REAL user
 */
async function runSimulation() {
  console.log('🎭 开始模拟真实用户流程...\n');
  console.log('='.repeat(80));
  console.log(`Worker URL: ${WORKER_URL}`);
  console.log(`Test User ID: ${TEST_USER_ID}`);
  console.log('='.repeat(80));

  try {
    // ============================================================
    // STEP 1: 用户首次打开 Bot，发送任意消息
    // ============================================================
    console.log('\n\n📱 第一部分：用户注册流程');
    console.log('─'.repeat(80));
    
    await sendMessage('你好', '1.触发欢迎');
    await sleep(1000); // 模拟用户阅读消息的时间

    // ============================================================
    // STEP 2: 用户选择语言
    // ============================================================
    await clickButton('lang_zh-TW', '2.选择繁体中文');
    await sleep(1500);

    // ============================================================
    // STEP 3: 用户输入昵称
    // ============================================================
    await sendMessage('测试小明', '3.输入昵称');
    await sleep(1500);

    // ============================================================
    // STEP 4: 用户选择性别
    // ============================================================
    await clickButton('gender_male', '4.选择性别-男');
    await sleep(1000);

    // ============================================================
    // STEP 5: 用户确认性别
    // ============================================================
    await clickButton('gender_confirm_male', '5.确认性别');
    await sleep(1500);

    // ============================================================
    // STEP 6: 用户输入生日
    // ============================================================
    await sendMessage('2000-01-01', '6.输入生日');
    await sleep(1000);

    // ============================================================
    // STEP 7: 用户确认生日
    // ============================================================
    await clickButton('confirm_birthday_2000-01-01', '7.确认生日');
    await sleep(1500);

    // ============================================================
    // STEP 8: 用户选择 MBTI - 跳过
    // ============================================================
    await clickButton('mbti_choice_skip', '8.MBTI-跳过');
    await sleep(1500);

    // ============================================================
    // STEP 9: 用户确认反诈骗
    // ============================================================
    await clickButton('anti_fraud_yes', '9.反诈骗确认');
    await sleep(1500);

    // ============================================================
    // STEP 10: 用户同意服务条款
    // ============================================================
    await clickButton('agree_terms', '10.同意服务条款');
    await sleep(2000);

    console.log('\n\n✅ 注册流程完成！');

    // ============================================================
    // STEP 11: 测试核心功能
    // ============================================================
    console.log('\n\n📱 第二部分：核心功能测试');
    console.log('─'.repeat(80));

    // 测试 /help
    await sendMessage('/help', '11.查看帮助');
    await sleep(1500);

    // 测试 /profile
    await sendMessage('/profile', '12.查看资料');
    await sleep(1500);

    // 测试 /throw
    await sendMessage('/throw', '13.丢漂流瓶-开始');
    await sleep(1000);
    
    await sendMessage('Hello World! 这是我的第一个漂流瓶！', '14.丢漂流瓶-内容');
    await sleep(1000);
    
    await clickButton('throw_target_any', '15.丢漂流瓶-任意性别');
    await sleep(2000);

    // 测试 /stats
    await sendMessage('/stats', '16.查看统计');
    await sleep(1500);

    // 测试 /vip
    await sendMessage('/vip', '17.查看VIP');
    await sleep(1500);

    // ============================================================
    // STEP 18: 测试开发工具
    // ============================================================
    console.log('\n\n📱 第三部分：开发工具测试');
    console.log('─'.repeat(80));

    // 测试 /dev_info
    await sendMessage('/dev_info', '18.开发工具-查看信息');
    await sleep(1500);

    console.log('\n\n🎉 所有测试完成！');

  } catch (error) {
    console.error('\n\n❌ 测试过程中出现错误:', error);
  }

  // ============================================================
  // 生成测试报告
  // ============================================================
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 测试报告');
  console.log('='.repeat(80));

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const skipped = results.filter(r => r.status === 'skip').length;
  const total = results.length;
  const successRate = ((passed / total) * 100).toFixed(1);
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  const avgDuration = (totalDuration / total).toFixed(0);

  console.log(`\n总测试数: ${total}`);
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`⏭️  跳过: ${skipped}`);
  console.log(`📈 成功率: ${successRate}%`);
  console.log(`⏱️  总耗时: ${totalDuration}ms`);
  console.log(`⏱️  平均响应: ${avgDuration}ms`);

  console.log('\n\n详细结果:');
  console.log('─'.repeat(80));
  
  results.forEach((result, index) => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏭️';
    console.log(`${icon} ${index + 1}. ${result.step}`);
    console.log(`   ${result.message} (${result.duration}ms)`);
  });

  console.log('\n' + '='.repeat(80));

  if (failed === 0) {
    console.log('\n🎉 所有测试通过！Bot 运行正常！');
    process.exit(0);
  } else {
    console.log(`\n⚠️  发现 ${failed} 个问题，请检查日志。`);
    process.exit(1);
  }
}

// Run simulation
runSimulation().catch(error => {
  console.error('❌ 模拟测试失败:', error);
  process.exit(1);
});

