/**
 * Full Registration E2E Test
 * 
 * Complete end-to-end test from start to finish:
 * 1. Language selection
 * 2. Nickname
 * 3. Gender
 * 4. Birthday
 * 5. MBTI Test (complete all questions)
 * 6. Anti-fraud
 * 7. Terms
 * 8. Registration complete
 */

const WORKER_URL = process.env.WORKER_URL || 'https://xunni-bot-staging.yves221.workers.dev';
const TEST_USER_ID = 888777666;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendMessage(text: string, step: string): Promise<void> {
  console.log(`\n📝 [${step}] 发送: "${text}"`);
  const response = await fetch(`${WORKER_URL}/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      update_id: Date.now(),
      message: {
        message_id: Date.now(),
        from: { id: TEST_USER_ID, is_bot: false, first_name: 'Full Test User' },
        chat: { id: TEST_USER_ID, type: 'private' },
        date: Math.floor(Date.now() / 1000),
        text,
      },
    }),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  console.log(`✅ [${step}] Bot 响应成功`);
  await sleep(1500);
}

async function clickButton(data: string, step: string): Promise<void> {
  console.log(`\n🖱️  [${step}] 点击: "${data}"`);
  const response = await fetch(`${WORKER_URL}/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      update_id: Date.now(),
      callback_query: {
        id: `cbq_${Date.now()}`,
        from: { id: TEST_USER_ID, is_bot: false, first_name: 'Full Test User' },
        message: {
          message_id: Date.now(),
          from: { id: 123456789, is_bot: true, first_name: 'Bot' },
          chat: { id: TEST_USER_ID, type: 'private' },
          date: Math.floor(Date.now() / 1000),
          text: 'Button',
        },
        chat_instance: `${Date.now()}`,
        data,
      },
    }),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  console.log(`✅ [${step}] Bot 响应成功`);
  await sleep(1500);
}

async function runFullTest() {
  console.log('🎭 完整注册流程测试');
  console.log('='.repeat(80));
  console.log(`Worker URL: ${WORKER_URL}`);
  console.log(`Test User ID: ${TEST_USER_ID}`);
  console.log('='.repeat(80));

  try {
    // ============================================================
    // 第一部分：基本信息
    // ============================================================
    console.log('\n\n📱 第一部分：基本信息注册');
    console.log('─'.repeat(80));
    
    await sendMessage('开始测试', '1.触发欢迎');
    await clickButton('lang_zh-TW', '2.选择繁体中文');
    await sendMessage('完整测试用户', '3.输入昵称');
    await clickButton('gender_male', '4.选择性别');
    await clickButton('gender_confirm_male', '5.确认性别');
    await sendMessage('1999-09-09', '6.输入生日');
    await clickButton('confirm_birthday_1999-09-09', '7.确认生日');

    console.log('\n✅ 基本信息完成');

    // ============================================================
    // 第二部分：MBTI 完整测验
    // ============================================================
    console.log('\n\n📱 第二部分：MBTI 完整测验（12题）');
    console.log('─'.repeat(80));
    
    await clickButton('mbti_choice_test', '8.开始MBTI测验');
    
    // 回答所有 12 道题
    // 让我们选择一个明确的 MBTI 类型：ENFP
    // E (外向), N (直觉), F (情感), P (感知)
    const answers = [
      // E/I (题 1-3)
      { q: 0, a: 0, desc: 'E - 外向' },  // 选择 A (外向)
      { q: 1, a: 0, desc: 'E - 外向' },  // 选择 A (外向)
      { q: 2, a: 0, desc: 'E - 外向' },  // 选择 A (外向)
      // S/N (题 4-6)
      { q: 3, a: 1, desc: 'N - 直觉' },  // 选择 B (直觉)
      { q: 4, a: 1, desc: 'N - 直觉' },  // 选择 B (直觉)
      { q: 5, a: 1, desc: 'N - 直觉' },  // 选择 B (直觉)
      // T/F (题 7-9)
      { q: 6, a: 1, desc: 'F - 情感' },  // 选择 B (情感)
      { q: 7, a: 1, desc: 'F - 情感' },  // 选择 B (情感)
      { q: 8, a: 1, desc: 'F - 情感' },  // 选择 B (情感)
      // J/P (题 10-12)
      { q: 9, a: 1, desc: 'P - 感知' },  // 选择 B (感知)
      { q: 10, a: 1, desc: 'P - 感知' },  // 选择 B (感知)
      { q: 11, a: 1, desc: 'P - 感知' },  // 选择 B (感知)
    ];

    for (const { q, a, desc } of answers) {
      await clickButton(`mbti_answer_${q}_${a}`, `9.${q + 1}.回答第${q + 1}题 (${desc})`);
      console.log(`   预期: ${desc}`);
    }

    console.log('\n✅ MBTI 测验完成');
    console.log('📊 预期结果: ENFP (活跃的激励者)');
    
    // 等待一下，看结果
    await sleep(3000);

    // ============================================================
    // 第三部分：完成注册
    // ============================================================
    console.log('\n\n📱 第三部分：完成注册');
    console.log('─'.repeat(80));
    
    await clickButton('anti_fraud_yes', '10.反诈骗确认');
    await clickButton('agree_terms', '11.同意服务条款');

    console.log('\n✅ 注册流程完成！');

    // ============================================================
    // 第四部分：验证结果
    // ============================================================
    console.log('\n\n📱 第四部分：验证注册结果');
    console.log('─'.repeat(80));
    
    await sendMessage('/dev_info', '12.查看用户信息');
    await sleep(2000);
    
    await sendMessage('/profile', '13.查看个人资料');
    await sleep(2000);

    console.log('\n' + '='.repeat(80));
    console.log('🎉 完整注册流程测试完成！');
    console.log('='.repeat(80));
    console.log('\n请在 Telegram 中检查：');
    console.log('1. 用户信息是否正确');
    console.log('2. MBTI 结果是否为 ENFP');
    console.log('3. 是否显示"活跃的激励者"描述');
    console.log('4. 注册步骤是否为 completed');

  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    process.exit(1);
  }
}

runFullTest();

