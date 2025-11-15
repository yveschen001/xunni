/**
 * Complete Onboarding Flow Test
 * Tests all paths including back button
 */

const WORKER_URL = 'https://xunni-bot-staging.yves221.workers.dev';
const TEST_USER_ID = 999988888;

async function sendUpdate(update: any): Promise<any> {
  const response = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

function createMessage(text: string): any {
  return {
    update_id: Date.now(),
    message: {
      message_id: Date.now(),
      from: {
        id: TEST_USER_ID,
        is_bot: false,
        first_name: 'TestUser',
        username: 'testuser',
        language_code: 'zh-TW',
      },
      chat: { id: TEST_USER_ID, type: 'private' },
      date: Math.floor(Date.now() / 1000),
      text,
    },
  };
}

function createCallback(data: string): any {
  return {
    update_id: Date.now(),
    callback_query: {
      id: `${Date.now()}`,
      from: {
        id: TEST_USER_ID,
        is_bot: false,
        first_name: 'TestUser',
      },
      message: {
        message_id: Date.now(),
        chat: { id: TEST_USER_ID, type: 'private' },
        date: Math.floor(Date.now() / 1000),
        text: 'Test',
      },
      data,
    },
  };
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCompleteFlow(): Promise<void> {
  console.log('🚀 Testing Complete Onboarding Flow');
  console.log('='.repeat(50));

  try {
    // 1. Start
    console.log('1️⃣  /start');
    await sendUpdate(createMessage('/start'));
    await sleep(500);

    // 2. Select language
    console.log('2️⃣  Select language (zh-TW)');
    await sendUpdate(createCallback('lang_zh-TW'));
    await sleep(500);

    // 3. Enter nickname
    console.log('3️⃣  Enter nickname');
    await sendUpdate(createMessage('測試用戶'));
    await sleep(500);

    // 4. Select gender
    console.log('4️⃣  Select gender (male)');
    await sendUpdate(createCallback('gender_male'));
    await sleep(500);

    // 5. Confirm gender
    console.log('5️⃣  Confirm gender');
    await sendUpdate(createCallback('confirm_gender_male'));
    await sleep(500);

    // 6. Enter birthday
    console.log('6️⃣  Enter birthday');
    await sendUpdate(createMessage('1995-06-15'));
    await sleep(500);

    // 7. Confirm birthday
    console.log('7️⃣  Confirm birthday');
    await sendUpdate(createCallback('confirm_birthday_1995-06-15'));
    await sleep(500);

    // 8. MBTI - Choose manual
    console.log('8️⃣  Choose manual MBTI entry');
    await sendUpdate(createCallback('mbti_choice_manual'));
    await sleep(500);

    // 9. Click back button
    console.log('9️⃣  Click BACK button');
    await sendUpdate(createCallback('mbti_choice_back'));
    await sleep(500);

    // 10. Choose test instead
    console.log('🔟 Choose MBTI test');
    await sendUpdate(createCallback('mbti_choice_test'));
    await sleep(500);

    // 11. Answer 12 questions
    console.log('1️⃣1️⃣  Answer 12 MBTI questions');
    for (let i = 0; i < 12; i++) {
      const answer = i % 2;
      console.log(`   Q${i + 1}: Answer ${answer}`);
      await sendUpdate(createCallback(`mbti_answer_${i}_${answer}`));
      await sleep(300);
    }

    // 12. Anti-fraud
    console.log('1️⃣2️⃣  Confirm anti-fraud');
    await sendUpdate(createCallback('anti_fraud_yes'));
    await sleep(500);

    // 13. Terms
    console.log('1️⃣3️⃣  Agree to terms');
    await sendUpdate(createCallback('agree_terms'));
    await sleep(500);

    console.log('\n✅ Complete flow test PASSED');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('\n❌ Complete flow test FAILED:', error);
    throw error;
  }
}

// Run test
testCompleteFlow()
  .then(() => {
    console.log('\n🎉 All tests completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });

