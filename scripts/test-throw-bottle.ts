/**
 * Test Throw Bottle Flow
 * 
 * Tests the complete throw bottle flow end-to-end
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TEST_CHAT_ID = process.env.TEST_CHAT_ID || '1234567';

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

async function runTest(): Promise<void> {
  console.log('🧪 Testing Throw Bottle Flow\n');
  console.log('=' .repeat(60));

  // Test 1: Send /throw command
  console.log('\n📝 Test 1: Send /throw command');
  try {
    const response = await simulateWebhook('/throw');
    console.log(`Response status: ${response.status}`);
    
    if (response.ok || response.status === 200) {
      console.log('✅ /throw command sent successfully');
      console.log('💡 Check Telegram for the prompt message');
    } else {
      console.log('❌ /throw command failed');
      const text = await response.text();
      console.log('Response:', text);
    }
  } catch (error) {
    console.log('❌ Error:', error);
  }

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Send valid bottle content
  console.log('\n📝 Test 2: Send valid bottle content (20 characters)');
  try {
    const validContent = '你好！我是一個喜歡音樂和電影的人，希望認識志同道合的朋友～';
    const response = await simulateWebhook(validContent);
    console.log(`Response status: ${response.status}`);
    
    if (response.ok || response.status === 200) {
      console.log('✅ Valid content sent successfully');
      console.log('💡 Check Telegram for success message');
    } else {
      console.log('❌ Valid content failed');
      const text = await response.text();
      console.log('Response:', text);
    }
  } catch (error) {
    console.log('❌ Error:', error);
  }

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 3: Send /throw again and test short content
  console.log('\n📝 Test 3: Send /throw and test short content');
  try {
    await simulateWebhook('/throw');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const shortContent = '短內容';
    const response = await simulateWebhook(shortContent);
    console.log(`Response status: ${response.status}`);
    
    if (response.ok || response.status === 200) {
      console.log('✅ Short content sent successfully');
      console.log('💡 Should receive error: "瓶子內容太短"');
    } else {
      console.log('❌ Short content failed');
    }
  } catch (error) {
    console.log('❌ Error:', error);
  }

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 4: Send /throw and test YouTube URL
  console.log('\n📝 Test 4: Send /throw and test YouTube URL');
  try {
    await simulateWebhook('/throw');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const urlContent = '看看這個影片 https://youtube.com/watch?v=123';
    const response = await simulateWebhook(urlContent);
    console.log(`Response status: ${response.status}`);
    
    if (response.ok || response.status === 200) {
      console.log('✅ URL content sent successfully');
      console.log('💡 Should receive error: "瓶子內容包含不允許的網址"');
    } else {
      console.log('❌ URL content failed');
    }
  } catch (error) {
    console.log('❌ Error:', error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary\n');
  console.log('Please check your Telegram to verify:');
  console.log('1. /throw shows the prompt with rules and example');
  console.log('2. Valid content (20+ chars) creates a bottle successfully');
  console.log('3. Short content (< 12 chars) shows error');
  console.log('4. YouTube URL shows error with blocked URL list');
  console.log('\n💡 All responses should be in Chinese (zh-TW)');
}

runTest().catch(console.error);

