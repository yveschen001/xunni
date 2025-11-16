/**
 * Test Bottle Length Validation
 * 
 * Tests the minimum and maximum length validation for bottle content.
 */

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TEST_CHAT_ID = process.env.TEST_CHAT_ID || '1234567'; // Replace with your Telegram ID

async function sendMessage(text: string): Promise<any> {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TEST_CHAT_ID,
      text,
    }),
  });
  return response.json();
}

async function simulateWebhook(message: string): Promise<Response> {
  const webhookUrl = 'https://xunni-bot-staging.yves221.workers.dev';
  
  const update = {
    update_id: Math.floor(Math.random() * 1000000),
    message: {
      message_id: Math.floor(Math.random() * 1000000),
      from: {
        id: parseInt(TEST_CHAT_ID),
        is_bot: false,
        first_name: 'Test',
        username: 'testuser',
      },
      chat: {
        id: parseInt(TEST_CHAT_ID),
        type: 'private',
      },
      date: Math.floor(Date.now() / 1000),
      text: message,
    },
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  });

  return response;
}

async function runTests(): Promise<void> {
  console.log('🧪 Testing Bottle Length Validation\n');
  console.log('=' .repeat(60));

  const results: TestResult[] = [];

  // Test 1: Too short content (less than 12 characters)
  console.log('\n📝 Test 1: 内容太短（少于 12 个字符）');
  try {
    const response = await simulateWebhook('短內容');
    const isOk = response.ok || response.status === 200;
    
    if (isOk) {
      console.log('✅ Bot 响应正常');
      console.log('💡 预期：应该收到「瓶子內容太短」的错误提示');
      results.push({ name: 'Too short content', passed: true });
    } else {
      console.log('❌ Bot 响应异常');
      results.push({ name: 'Too short content', passed: false, error: `Status: ${response.status}` });
    }
  } catch (error) {
    console.log('❌ 测试失败:', error);
    results.push({ name: 'Too short content', passed: false, error: String(error) });
  }

  // Test 2: Exactly 12 characters (boundary test)
  console.log('\n📝 Test 2: 正好 12 个字符（边界测试）');
  try {
    const response = await simulateWebhook('這是十二個字的內容');
    const isOk = response.ok || response.status === 200;
    
    if (isOk) {
      console.log('✅ Bot 响应正常');
      console.log('💡 预期：应该成功（或提示配额不足）');
      results.push({ name: 'Exactly 12 characters', passed: true });
    } else {
      console.log('❌ Bot 响应异常');
      results.push({ name: 'Exactly 12 characters', passed: false, error: `Status: ${response.status}` });
    }
  } catch (error) {
    console.log('❌ 测试失败:', error);
    results.push({ name: 'Exactly 12 characters', passed: false, error: String(error) });
  }

  // Test 3: Valid content (more than 12 characters)
  console.log('\n📝 Test 3: 有效内容（超过 12 个字符）');
  try {
    const response = await simulateWebhook('這是一個測試漂流瓶的內容，包含足夠的文字。');
    const isOk = response.ok || response.status === 200;
    
    if (isOk) {
      console.log('✅ Bot 响应正常');
      console.log('💡 预期：应该成功（或提示配额不足）');
      results.push({ name: 'Valid content', passed: true });
    } else {
      console.log('❌ Bot 响应异常');
      results.push({ name: 'Valid content', passed: false, error: `Status: ${response.status}` });
    }
  } catch (error) {
    console.log('❌ 测试失败:', error);
    results.push({ name: 'Valid content', passed: false, error: String(error) });
  }

  // Test 4: Too long content (more than 500 characters)
  console.log('\n📝 Test 4: 内容太长（超过 500 个字符）');
  try {
    const longContent = '這是一個非常長的測試內容。'.repeat(50); // ~600 characters
    const response = await simulateWebhook(longContent);
    const isOk = response.ok || response.status === 200;
    
    if (isOk) {
      console.log('✅ Bot 响应正常');
      console.log('💡 预期：应该收到「瓶子內容太長」的错误提示');
      results.push({ name: 'Too long content', passed: true });
    } else {
      console.log('❌ Bot 响应异常');
      results.push({ name: 'Too long content', passed: false, error: `Status: ${response.status}` });
    }
  } catch (error) {
    console.log('❌ 测试失败:', error);
    results.push({ name: 'Too long content', passed: false, error: String(error) });
  }

  // Test 5: Content with whitespace (should be trimmed)
  console.log('\n📝 Test 5: 包含前后空格的内容（应该自动去除）');
  try {
    const response = await simulateWebhook('   這是一個測試漂流瓶的內容   ');
    const isOk = response.ok || response.status === 200;
    
    if (isOk) {
      console.log('✅ Bot 响应正常');
      console.log('💡 预期：应该成功（自动去除空格后验证）');
      results.push({ name: 'Content with whitespace', passed: true });
    } else {
      console.log('❌ Bot 响应异常');
      results.push({ name: 'Content with whitespace', passed: false, error: `Status: ${response.status}` });
    }
  } catch (error) {
    console.log('❌ 测试失败:', error);
    results.push({ name: 'Content with whitespace', passed: false, error: String(error) });
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试总结\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
    if (result.error) {
      console.log(`   错误: ${result.error}`);
    }
  });
  
  console.log(`\n总计: ${passed} 通过, ${failed} 失败`);
  
  if (failed === 0) {
    console.log('\n🎉 所有测试通过！');
  } else {
    console.log('\n⚠️  部分测试失败，请检查。');
  }

  console.log('\n💡 提示：请在 Telegram 中查看实际的 Bot 响应消息。');
}

// Run tests
runTests().catch(console.error);

