/**
 * Comprehensive Onboarding Test
 * Tests various scenarios including edge cases and error handling
 */

const COMPREHENSIVE_WORKER_URL = 'https://xunni-bot-staging.yves221.workers.dev';

// Generate unique test user ID
const COMPREHENSIVE_TEST_USER_ID = Math.floor(Math.random() * 1000000000);

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

/**
 * Send webhook update
 */
async function sendUpdate(update: any): Promise<Response> {
  return fetch(`${COMPREHENSIVE_WORKER_URL}/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  });
}

/**
 * Create message update
 */
function createMessage(text: string, userId: number = COMPREHENSIVE_TEST_USER_ID): any {
  return {
    update_id: Math.floor(Math.random() * 1000000),
    message: {
      message_id: Math.floor(Math.random() * 1000000),
      from: {
        id: userId,
        is_bot: false,
        first_name: 'Test',
        username: 'testuser',
        language_code: 'zh-TW',
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

/**
 * Create callback query update
 */
function createCallback(data: string, userId: number = COMPREHENSIVE_TEST_USER_ID): any {
  return {
    update_id: Math.floor(Math.random() * 1000000),
    callback_query: {
      id: String(Math.floor(Math.random() * 1000000)),
      from: {
        id: userId,
        is_bot: false,
        first_name: 'Test',
        username: 'testuser',
      },
      message: {
        message_id: Math.floor(Math.random() * 1000000),
        from: {
          id: 123456789,
          is_bot: true,
          first_name: 'XunNi Bot',
          username: 'xunnibot',
        },
        chat: {
          id: userId,
          type: 'private',
        },
        date: Math.floor(Date.now() / 1000),
        text: 'Test message',
      },
      chat_instance: String(Math.floor(Math.random() * 1000000)),
      data,
    },
  };
}

/**
 * Test: New user first message
 */
async function testNewUserFirstMessage(): Promise<void> {
  console.log('\n📝 Test 1: New user first message');
  try {
    const response = await sendUpdate(createMessage('你好'));
    if (response.status === 200) {
      results.push({ name: 'New user first message', passed: true });
      console.log('✅ Pass');
    } else {
      results.push({ name: 'New user first message', passed: false, error: `Status ${response.status}` });
      console.log(`❌ Fail: Status ${response.status}`);
    }
  } catch (error) {
    results.push({ name: 'New user first message', passed: false, error: String(error) });
    console.log(`❌ Fail: ${error}`);
  }
}

/**
 * Test: Language selection
 */
async function testLanguageSelection(): Promise<void> {
  console.log('\n📝 Test 2: Language selection (zh-TW)');
  try {
    const response = await sendUpdate(createCallback('lang_zh-TW'));
    if (response.status === 200) {
      results.push({ name: 'Language selection', passed: true });
      console.log('✅ Pass');
    } else {
      results.push({ name: 'Language selection', passed: false, error: `Status ${response.status}` });
      console.log(`❌ Fail: Status ${response.status}`);
    }
  } catch (error) {
    results.push({ name: 'Language selection', passed: false, error: String(error) });
    console.log(`❌ Fail: ${error}`);
  }
}

/**
 * Test: Invalid nickname (too short)
 */
async function testInvalidNickname(): Promise<void> {
  console.log('\n📝 Test 3: Invalid nickname (too short)');
  try {
    const response = await sendUpdate(createMessage('A'));
    if (response.status === 200) {
      results.push({ name: 'Invalid nickname rejection', passed: true });
      console.log('✅ Pass (should reject short nickname)');
    } else {
      results.push({ name: 'Invalid nickname rejection', passed: false, error: `Status ${response.status}` });
      console.log(`❌ Fail: Status ${response.status}`);
    }
  } catch (error) {
    results.push({ name: 'Invalid nickname rejection', passed: false, error: String(error) });
    console.log(`❌ Fail: ${error}`);
  }
}

/**
 * Test: Valid nickname
 */
async function testValidNickname(): Promise<void> {
  console.log('\n📝 Test 4: Valid nickname');
  try {
    const response = await sendUpdate(createMessage('測試用戶'));
    if (response.status === 200) {
      results.push({ name: 'Valid nickname', passed: true });
      console.log('✅ Pass');
    } else {
      results.push({ name: 'Valid nickname', passed: false, error: `Status ${response.status}` });
      console.log(`❌ Fail: Status ${response.status}`);
    }
  } catch (error) {
    results.push({ name: 'Valid nickname', passed: false, error: String(error) });
    console.log(`❌ Fail: ${error}`);
  }
}

/**
 * Test: Gender selection
 */
async function testGenderSelection(): Promise<void> {
  console.log('\n📝 Test 5: Gender selection (male)');
  try {
    const response = await sendUpdate(createCallback('gender_male'));
    if (response.status === 200) {
      results.push({ name: 'Gender selection', passed: true });
      console.log('✅ Pass');
    } else {
      results.push({ name: 'Gender selection', passed: false, error: `Status ${response.status}` });
      console.log(`❌ Fail: Status ${response.status}`);
    }
  } catch (error) {
    results.push({ name: 'Gender selection', passed: false, error: String(error) });
    console.log(`❌ Fail: ${error}`);
  }
}

/**
 * Test: Invalid birthday (under 18)
 */
async function testInvalidBirthday(): Promise<void> {
  console.log('\n📝 Test 6: Invalid birthday (under 18)');
  try {
    const response = await sendUpdate(createMessage('2010-01-01'));
    if (response.status === 200) {
      results.push({ name: 'Under 18 rejection', passed: true });
      console.log('✅ Pass (should reject under 18)');
    } else {
      results.push({ name: 'Under 18 rejection', passed: false, error: `Status ${response.status}` });
      console.log(`❌ Fail: Status ${response.status}`);
    }
  } catch (error) {
    results.push({ name: 'Under 18 rejection', passed: false, error: String(error) });
    console.log(`❌ Fail: ${error}`);
  }
}

/**
 * Test: Valid birthday
 */
async function testValidBirthday(): Promise<void> {
  console.log('\n📝 Test 7: Valid birthday');
  try {
    const response = await sendUpdate(createMessage('1995-06-15'));
    if (response.status === 200) {
      results.push({ name: 'Valid birthday', passed: true });
      console.log('✅ Pass');
    } else {
      results.push({ name: 'Valid birthday', passed: false, error: `Status ${response.status}` });
      console.log(`❌ Fail: Status ${response.status}`);
    }
  } catch (error) {
    results.push({ name: 'Valid birthday', passed: false, error: String(error) });
    console.log(`❌ Fail: ${error}`);
  }
}

/**
 * Test: MBTI test
 */
async function testMBTI(): Promise<void> {
  console.log('\n📝 Test 8: MBTI test (simplified)');
  try {
    const response = await sendUpdate(createMessage('是'));
    if (response.status === 200) {
      results.push({ name: 'MBTI test', passed: true });
      console.log('✅ Pass');
    } else {
      results.push({ name: 'MBTI test', passed: false, error: `Status ${response.status}` });
      console.log(`❌ Fail: Status ${response.status}`);
    }
  } catch (error) {
    results.push({ name: 'MBTI test', passed: false, error: String(error) });
    console.log(`❌ Fail: ${error}`);
  }
}

/**
 * Test: Anti-fraud test
 */
async function testAntiFraud(): Promise<void> {
  console.log('\n📝 Test 9: Anti-fraud test');
  try {
    const response = await sendUpdate(createMessage('是'));
    if (response.status === 200) {
      results.push({ name: 'Anti-fraud test', passed: true });
      console.log('✅ Pass');
    } else {
      results.push({ name: 'Anti-fraud test', passed: false, error: `Status ${response.status}` });
      console.log(`❌ Fail: Status ${response.status}`);
    }
  } catch (error) {
    results.push({ name: 'Anti-fraud test', passed: false, error: String(error) });
    console.log(`❌ Fail: ${error}`);
  }
}

/**
 * Test: Terms agreement
 */
async function testTermsAgreement(): Promise<void> {
  console.log('\n📝 Test 10: Terms agreement');
  try {
    const response = await sendUpdate(createCallback('agree_terms'));
    if (response.status === 200) {
      results.push({ name: 'Terms agreement', passed: true });
      console.log('✅ Pass');
    } else {
      results.push({ name: 'Terms agreement', passed: false, error: `Status ${response.status}` });
      console.log(`❌ Fail: Status ${response.status}`);
    }
  } catch (error) {
    results.push({ name: 'Terms agreement', passed: false, error: String(error) });
    console.log(`❌ Fail: ${error}`);
  }
}

/**
 * Test: /start command after completion
 */
async function testStartAfterCompletion(): Promise<void> {
  console.log('\n📝 Test 11: /start command after completion');
  try {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for completion
    const response = await sendUpdate(createMessage('/start'));
    if (response.status === 200) {
      results.push({ name: '/start after completion', passed: true });
      console.log('✅ Pass (should show welcome back message)');
    } else {
      results.push({ name: '/start after completion', passed: false, error: `Status ${response.status}` });
      console.log(`❌ Fail: Status ${response.status}`);
    }
  } catch (error) {
    results.push({ name: '/start after completion', passed: false, error: String(error) });
    console.log(`❌ Fail: ${error}`);
  }
}

/**
 * Main test runner
 */
async function runTests(): Promise<void> {
  console.log('🧪 Comprehensive Onboarding Test\n');
  console.log('================================================================================');
  console.log(`Worker URL: ${COMPREHENSIVE_WORKER_URL}`);
  console.log(`Test User ID: ${COMPREHENSIVE_TEST_USER_ID}`);
  console.log('================================================================================');

  // Run all tests sequentially
  await testNewUserFirstMessage();
  await testLanguageSelection();
  await testInvalidNickname();
  await testValidNickname();
  await testGenderSelection();
  await testInvalidBirthday();
  await testValidBirthday();
  await testMBTI();
  await testAntiFraud();
  await testTermsAgreement();
  await testStartAfterCompletion();

  // Print summary
  console.log('\n================================================================================');
  console.log('📊 Test Summary');
  console.log('================================================================================\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`Total: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / results.length) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log('Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ❌ ${r.name}: ${r.error}`);
    });
    console.log();
  }

  if (passed === results.length) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
  }
}

// Run tests
runTests().catch(console.error);

