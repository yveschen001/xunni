/**
 * MBTI Flow Comprehensive Test
 * 
 * Tests the complete MBTI conversational flow:
 * 1. New user registration with MBTI choice
 * 2. Manual MBTI entry
 * 3. Take MBTI test (12 questions)
 * 4. Skip MBTI
 * 5. /mbti command for existing users
 */

const WORKER_URL = 'https://xunni-bot-staging.yves221.workers.dev';
const TEST_USER_ID_BASE = 999900000; // Base ID for test users

// ============================================================================
// Helper Functions
// ============================================================================

async function sendUpdate(update: any): Promise<any> {
  const response = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

function createMessage(userId: number, text: string, messageId: number = Date.now()): any {
  return {
    update_id: Date.now(),
    message: {
      message_id: messageId,
      from: {
        id: userId,
        is_bot: false,
        first_name: `TestUser${userId}`,
        username: `testuser${userId}`,
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

function createCallback(userId: number, data: string, messageId: number = Date.now()): any {
  return {
    update_id: Date.now(),
    callback_query: {
      id: `${Date.now()}`,
      from: {
        id: userId,
        is_bot: false,
        first_name: `TestUser${userId}`,
        username: `testuser${userId}`,
        language_code: 'zh-TW',
      },
      message: {
        message_id: messageId,
        chat: {
          id: userId,
          type: 'private',
        },
        date: Math.floor(Date.now() / 1000),
        text: 'Test message',
      },
      data,
    },
  };
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Test Scenarios
// ============================================================================

/**
 * Scenario 1: New user chooses manual MBTI entry
 */
async function testManualMBTIEntry(): Promise<void> {
  console.log('\n📝 Test 1: Manual MBTI Entry');
  console.log('─'.repeat(50));

  const userId = TEST_USER_ID_BASE + 1;

  try {
    // Step 1: Start registration
    console.log('1️⃣ Sending /start...');
    await sendUpdate(createMessage(userId, '/start'));
    await sleep(500);

    // Step 2: Select language (zh-TW)
    console.log('2️⃣ Selecting language...');
    await sendUpdate(createCallback(userId, 'lang_zh-TW'));
    await sleep(500);

    // Step 3: Enter nickname
    console.log('3️⃣ Entering nickname...');
    await sendUpdate(createMessage(userId, 'TestUser手動'));
    await sleep(500);

    // Step 4: Select gender (male)
    console.log('4️⃣ Selecting gender...');
    await sendUpdate(createCallback(userId, 'gender_male'));
    await sleep(500);

    // Step 5: Confirm gender
    console.log('5️⃣ Confirming gender...');
    await sendUpdate(createCallback(userId, 'confirm_gender_male'));
    await sleep(500);

    // Step 6: Enter birthday
    console.log('6️⃣ Entering birthday...');
    await sendUpdate(createMessage(userId, '1995-06-15'));
    await sleep(500);

    // Step 7: Confirm birthday
    console.log('7️⃣ Confirming birthday...');
    await sendUpdate(createCallback(userId, 'confirm_birthday_1995-06-15'));
    await sleep(500);

    // Step 8: Choose manual MBTI entry
    console.log('8️⃣ Choosing manual MBTI entry...');
    await sendUpdate(createCallback(userId, 'mbti_choice_manual'));
    await sleep(500);

    // Step 9: Select MBTI type (INTJ)
    console.log('9️⃣ Selecting MBTI type (INTJ)...');
    await sendUpdate(createCallback(userId, 'mbti_manual_INTJ'));
    await sleep(500);

    // Step 10: Confirm anti-fraud
    console.log('🔟 Confirming anti-fraud...');
    await sendUpdate(createCallback(userId, 'anti_fraud_yes'));
    await sleep(500);

    // Step 11: Agree to terms
    console.log('1️⃣1️⃣ Agreeing to terms...');
    await sendUpdate(createCallback(userId, 'agree_terms'));
    await sleep(500);

    console.log('✅ Test 1 PASSED: Manual MBTI entry completed');
  } catch (error) {
    console.error('❌ Test 1 FAILED:', error);
    throw error;
  }
}

/**
 * Scenario 2: New user takes MBTI test (12 questions)
 */
async function testMBTITestFlow(): Promise<void> {
  console.log('\n🧪 Test 2: MBTI Test Flow (12 Questions)');
  console.log('─'.repeat(50));

  const userId = TEST_USER_ID_BASE + 2;

  try {
    // Complete registration up to MBTI choice
    console.log('1️⃣ Starting registration...');
    await sendUpdate(createMessage(userId, '/start'));
    await sleep(500);

    await sendUpdate(createCallback(userId, 'lang_zh-TW'));
    await sleep(500);

    await sendUpdate(createMessage(userId, 'TestUser測驗'));
    await sleep(500);

    await sendUpdate(createCallback(userId, 'gender_female'));
    await sleep(500);

    await sendUpdate(createCallback(userId, 'confirm_gender_female'));
    await sleep(500);

    await sendUpdate(createMessage(userId, '1998-03-20'));
    await sleep(500);

    await sendUpdate(createCallback(userId, 'confirm_birthday_1998-03-20'));
    await sleep(500);

    // Choose to take test
    console.log('2️⃣ Choosing to take MBTI test...');
    await sendUpdate(createCallback(userId, 'mbti_choice_test'));
    await sleep(500);

    // Answer all 12 questions
    console.log('3️⃣ Answering 12 questions...');
    for (let i = 0; i < 12; i++) {
      const answerIndex = i % 2; // Alternate between 0 and 1
      console.log(`   Question ${i + 1}/12: Answer ${answerIndex}`);
      await sendUpdate(createCallback(userId, `mbti_answer_${i}_${answerIndex}`));
      await sleep(300);
    }

    // Complete anti-fraud and terms
    console.log('4️⃣ Completing anti-fraud...');
    await sendUpdate(createCallback(userId, 'anti_fraud_yes'));
    await sleep(500);

    console.log('5️⃣ Agreeing to terms...');
    await sendUpdate(createCallback(userId, 'agree_terms'));
    await sleep(500);

    console.log('✅ Test 2 PASSED: MBTI test flow completed');
  } catch (error) {
    console.error('❌ Test 2 FAILED:', error);
    throw error;
  }
}

/**
 * Scenario 3: New user skips MBTI
 */
async function testSkipMBTI(): Promise<void> {
  console.log('\n⏭️  Test 3: Skip MBTI');
  console.log('─'.repeat(50));

  const userId = TEST_USER_ID_BASE + 3;

  try {
    // Complete registration up to MBTI choice
    console.log('1️⃣ Starting registration...');
    await sendUpdate(createMessage(userId, '/start'));
    await sleep(500);

    await sendUpdate(createCallback(userId, 'lang_en'));
    await sleep(500);

    await sendUpdate(createMessage(userId, 'TestUserSkip'));
    await sleep(500);

    await sendUpdate(createCallback(userId, 'gender_male'));
    await sleep(500);

    await sendUpdate(createCallback(userId, 'confirm_gender_male'));
    await sleep(500);

    await sendUpdate(createMessage(userId, '2000-12-25'));
    await sleep(500);

    await sendUpdate(createCallback(userId, 'confirm_birthday_2000-12-25'));
    await sleep(500);

    // Skip MBTI
    console.log('2️⃣ Skipping MBTI...');
    await sendUpdate(createCallback(userId, 'mbti_choice_skip'));
    await sleep(500);

    // Complete anti-fraud and terms
    console.log('3️⃣ Completing anti-fraud...');
    await sendUpdate(createCallback(userId, 'anti_fraud_yes'));
    await sleep(500);

    console.log('4️⃣ Agreeing to terms...');
    await sendUpdate(createCallback(userId, 'agree_terms'));
    await sleep(500);

    console.log('✅ Test 3 PASSED: Skip MBTI completed');
  } catch (error) {
    console.error('❌ Test 3 FAILED:', error);
    throw error;
  }
}

/**
 * Scenario 4: Existing user uses /mbti command
 */
async function testMBTICommand(): Promise<void> {
  console.log('\n🎮 Test 4: /mbti Command');
  console.log('─'.repeat(50));

  const userId = TEST_USER_ID_BASE + 3; // Use the user who skipped MBTI

  try {
    // Send /mbti command
    console.log('1️⃣ Sending /mbti command...');
    await sendUpdate(createMessage(userId, '/mbti'));
    await sleep(500);

    // Choose to take test
    console.log('2️⃣ Choosing to take test...');
    await sendUpdate(createCallback(userId, 'mbti_menu_test'));
    await sleep(500);

    // Answer all 12 questions
    console.log('3️⃣ Answering 12 questions...');
    for (let i = 0; i < 12; i++) {
      const answerIndex = i % 2;
      console.log(`   Question ${i + 1}/12: Answer ${answerIndex}`);
      await sendUpdate(createCallback(userId, `mbti_answer_${i}_${answerIndex}`));
      await sleep(300);
    }

    console.log('✅ Test 4 PASSED: /mbti command completed');
  } catch (error) {
    console.error('❌ Test 4 FAILED:', error);
    throw error;
  }
}

/**
 * Scenario 5: Test MBTI menu options
 */
async function testMBTIMenuOptions(): Promise<void> {
  console.log('\n🔧 Test 5: MBTI Menu Options');
  console.log('─'.repeat(50));

  const userId = TEST_USER_ID_BASE + 1; // Use the user with manual MBTI

  try {
    // Send /mbti command
    console.log('1️⃣ Sending /mbti command...');
    await sendUpdate(createMessage(userId, '/mbti'));
    await sleep(500);

    // Choose manual entry
    console.log('2️⃣ Choosing manual entry...');
    await sendUpdate(createCallback(userId, 'mbti_menu_manual'));
    await sleep(500);

    // Select new MBTI type (ENFP)
    console.log('3️⃣ Selecting new MBTI type (ENFP)...');
    await sendUpdate(createCallback(userId, 'mbti_set_ENFP'));
    await sleep(500);

    // Send /mbti again to verify
    console.log('4️⃣ Verifying MBTI change...');
    await sendUpdate(createMessage(userId, '/mbti'));
    await sleep(500);

    // Cancel menu
    console.log('5️⃣ Canceling menu...');
    await sendUpdate(createCallback(userId, 'mbti_menu_cancel'));
    await sleep(500);

    console.log('✅ Test 5 PASSED: MBTI menu options completed');
  } catch (error) {
    console.error('❌ Test 5 FAILED:', error);
    throw error;
  }
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runAllTests(): Promise<void> {
  console.log('🚀 Starting MBTI Flow Comprehensive Tests');
  console.log('='.repeat(50));
  console.log(`Worker URL: ${WORKER_URL}`);
  console.log(`Test User IDs: ${TEST_USER_ID_BASE + 1} - ${TEST_USER_ID_BASE + 3}`);
  console.log('='.repeat(50));

  const startTime = Date.now();
  let passedTests = 0;
  let failedTests = 0;

  const tests = [
    { name: 'Manual MBTI Entry', fn: testManualMBTIEntry },
    { name: 'MBTI Test Flow', fn: testMBTITestFlow },
    { name: 'Skip MBTI', fn: testSkipMBTI },
    { name: '/mbti Command', fn: testMBTICommand },
    { name: 'MBTI Menu Options', fn: testMBTIMenuOptions },
  ];

  for (const test of tests) {
    try {
      await test.fn();
      passedTests++;
    } catch (error) {
      failedTests++;
      console.error(`\n❌ ${test.name} failed:`, error);
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passedTests}/${tests.length}`);
  console.log(`❌ Failed: ${failedTests}/${tests.length}`);
  console.log(`⏱️  Duration: ${duration}s`);
  console.log('='.repeat(50));

  if (failedTests > 0) {
    console.log('\n❌ Some tests failed. Please check the logs above.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed! MBTI flow is working correctly.');
    process.exit(0);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

