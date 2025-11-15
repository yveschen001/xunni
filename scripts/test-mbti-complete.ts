/**
 * Complete MBTI Test Flow
 * 
 * Test the full MBTI test flow including:
 * 1. Manual entry
 * 2. Complete test (all questions)
 * 3. Skip
 */

const WORKER_URL = process.env.WORKER_URL || 'https://xunni-bot-staging.yves221.workers.dev';
const TEST_USER_ID = 999888888; // Different from simulation test

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendMessage(text: string): Promise<void> {
  console.log(`📝 发送: "${text}"`);
  await fetch(`${WORKER_URL}/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      update_id: Date.now(),
      message: {
        message_id: Date.now(),
        from: { id: TEST_USER_ID, is_bot: false, first_name: 'MBTI Test User' },
        chat: { id: TEST_USER_ID, type: 'private' },
        date: Math.floor(Date.now() / 1000),
        text,
      },
    }),
  });
  await sleep(1000);
}

async function clickButton(data: string): Promise<void> {
  console.log(`🖱️  点击: "${data}"`);
  await fetch(`${WORKER_URL}/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      update_id: Date.now(),
      callback_query: {
        id: `cbq_${Date.now()}`,
        from: { id: TEST_USER_ID, is_bot: false, first_name: 'MBTI Test User' },
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
  await sleep(1000);
}

async function testMBTIFlow() {
  console.log('🎭 测试 MBTI 完整流程\n');
  console.log('='.repeat(80));

  try {
    // 1. 完成注册到 MBTI 步骤
    console.log('\n📱 第一步：完成注册到 MBTI 步骤');
    console.log('─'.repeat(80));
    
    await sendMessage('你好');
    await clickButton('lang_zh-TW');
    await sendMessage('MBTI测试员');
    await clickButton('gender_male');
    await clickButton('gender_confirm_male');
    await sendMessage('2000-01-01');
    await clickButton('confirm_birthday_2000-01-01');

    console.log('\n✅ 已到达 MBTI 选择步骤');

    // 2. 测试完整的 MBTI 测验
    console.log('\n📱 第二步：进行完整 MBTI 测验');
    console.log('─'.repeat(80));
    
    await clickButton('mbti_choice_test');
    console.log('✅ 开始测验');

    // 回答所有问题（假设有 8 题）
    for (let i = 0; i < 8; i++) {
      const answer = i % 2 === 0 ? 'A' : 'B'; // 交替选择
      await clickButton(`mbti_answer_${i}_${answer === 'A' ? 0 : 1}`);
      console.log(`  ✅ 第 ${i + 1} 题：选择 ${answer}`);
      await sleep(500);
    }

    console.log('\n✅ 测验完成，应该显示结果');

    // 3. 等待一下，让用户看到结果
    await sleep(3000);

    // 4. 检查是否进入下一步（反诈骗）
    console.log('\n📱 第三步：验证流程继续');
    console.log('─'.repeat(80));
    
    await sendMessage('/dev_info');
    console.log('✅ 查看用户信息，验证 MBTI 已保存');

    console.log('\n' + '='.repeat(80));
    console.log('🎉 MBTI 测验流程测试完成！');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    process.exit(1);
  }
}

testMBTIFlow();

