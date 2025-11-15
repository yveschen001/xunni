/**
 * Onboarding Flow Test
 * Tests the complete user registration flow
 */

const WORKER_URL = 'https://xunni-bot-staging.yves221.workers.dev';
const TEST_USER_ID = Math.floor(Math.random() * 1000000) + 900000000;

console.log('🧪 Testing Onboarding Flow\n');
console.log('=' .repeat(80));
console.log(`Worker URL: ${WORKER_URL}`);
console.log(`Test User ID: ${TEST_USER_ID}`);
console.log('=' .repeat(80));

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username: string;
      language_code: string;
    };
    chat: {
      id: number;
      first_name: string;
      username: string;
      type: 'private';
    };
    date: number;
    text: string;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username: string;
      language_code: string;
    };
    message: {
      message_id: number;
      chat: {
        id: number;
        type: 'private';
      };
    };
    data: string;
  };
}

async function sendMessage(text: string): Promise<{ status: number; body: string }> {
  const update: TelegramUpdate = {
    update_id: Math.floor(Math.random() * 1000000),
    message: {
      message_id: Math.floor(Math.random() * 1000000),
      from: {
        id: TEST_USER_ID,
        is_bot: false,
        first_name: 'Test',
        username: `testuser${TEST_USER_ID}`,
        language_code: 'zh-TW',
      },
      chat: {
        id: TEST_USER_ID,
        first_name: 'Test',
        username: `testuser${TEST_USER_ID}`,
        type: 'private',
      },
      date: Math.floor(Date.now() / 1000),
      text,
    },
  };

  const response = await fetch(`${WORKER_URL}/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(update),
  });

  return {
    status: response.status,
    body: await response.text(),
  };
}

async function sendCallback(data: string, messageId: number): Promise<{ status: number; body: string }> {
  const update: TelegramUpdate = {
    update_id: Math.floor(Math.random() * 1000000),
    callback_query: {
      id: String(Math.floor(Math.random() * 1000000)),
      from: {
        id: TEST_USER_ID,
        is_bot: false,
        first_name: 'Test',
        username: `testuser${TEST_USER_ID}`,
        language_code: 'zh-TW',
      },
      message: {
        message_id: messageId,
        chat: {
          id: TEST_USER_ID,
          type: 'private',
        },
      },
      data,
    },
  };

  const response = await fetch(`${WORKER_URL}/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(update),
  });

  return {
    status: response.status,
    body: await response.text(),
  };
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function test(): Promise<void> {
  try {
    // Step 1: Send first message (should trigger language selection)
    console.log('\n📝 Step 1: Send first message');
    console.log('Sending: "你好"');
    const step1 = await sendMessage('你好');
    console.log(`✅ Status: ${step1.status}`);
    if (step1.status !== 200) {
      throw new Error(`Expected 200, got ${step1.status}`);
    }
    await sleep(1000);

    // Step 2: Select language
    console.log('\n📝 Step 2: Select language (zh-TW)');
    const step2 = await sendCallback('lang_zh-TW', 1);
    console.log(`✅ Status: ${step2.status}`);
    if (step2.status !== 200) {
      throw new Error(`Expected 200, got ${step2.status}`);
    }
    await sleep(1000);

    // Step 3: Enter nickname
    console.log('\n📝 Step 3: Enter nickname');
    console.log('Sending: "測試用戶"');
    const step3 = await sendMessage('測試用戶');
    console.log(`✅ Status: ${step3.status}`);
    if (step3.status !== 200) {
      throw new Error(`Expected 200, got ${step3.status}`);
    }
    await sleep(1000);

    // Step 4: Select gender
    console.log('\n📝 Step 4: Select gender (male)');
    const step4 = await sendCallback('gender_male', 2);
    console.log(`✅ Status: ${step4.status}`);
    if (step4.status !== 200) {
      throw new Error(`Expected 200, got ${step4.status}`);
    }
    await sleep(1000);

    // Step 5: Enter birthday
    console.log('\n📝 Step 5: Enter birthday');
    console.log('Sending: "1995-06-15"');
    const step5 = await sendMessage('1995-06-15');
    console.log(`✅ Status: ${step5.status}`);
    if (step5.status !== 200) {
      throw new Error(`Expected 200, got ${step5.status}`);
    }
    await sleep(1000);

    // Step 6: MBTI test (simplified - just send "是")
    console.log('\n📝 Step 6: MBTI test (simplified)');
    console.log('Sending: "是"');
    const step6 = await sendMessage('是');
    console.log(`✅ Status: ${step6.status}`);
    if (step6.status !== 200) {
      throw new Error(`Expected 200, got ${step6.status}`);
    }
    await sleep(1000);

    // Step 7: Anti-fraud test
    console.log('\n📝 Step 7: Anti-fraud test');
    console.log('Sending: "是"');
    const step7 = await sendMessage('是');
    console.log(`✅ Status: ${step7.status}`);
    if (step7.status !== 200) {
      throw new Error(`Expected 200, got ${step7.status}`);
    }
    await sleep(1000);

    // Step 8: Agree to terms
    console.log('\n📝 Step 8: Agree to terms');
    const step8 = await sendCallback('agree_terms', 3);
    console.log(`✅ Status: ${step8.status}`);
    if (step8.status !== 200) {
      throw new Error(`Expected 200, got ${step8.status}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎉 All steps completed successfully!');
    console.log('=' .repeat(80));
    console.log('\n✅ Onboarding flow is working correctly!\n');
  } catch (error) {
    console.error('\n' + '='.repeat(80));
    console.error('❌ Test failed:', error);
    console.error('=' .repeat(80));
    process.exit(1);
  }
}

test();

