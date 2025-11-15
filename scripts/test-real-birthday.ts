/**
 * Test Real Birthday Issue
 * 
 * Test the exact birthday that failed: 1971-02-21
 */

const WORKER_URL = process.env.WORKER_URL || 'https://xunni-bot-staging.yves221.workers.dev';
const TEST_USER_ID = 7169447162; // Your real user ID from screenshot

function createMessage(text: string) {
  return {
    update_id: Date.now(),
    message: {
      message_id: Date.now(),
      from: {
        id: TEST_USER_ID,
        is_bot: false,
        first_name: 'Test',
        username: 'test_real',
        language_code: 'zh-TW',
      },
      chat: {
        id: TEST_USER_ID,
        first_name: 'Test',
        username: 'test_real',
        type: 'private',
      },
      date: Math.floor(Date.now() / 1000),
      text,
    },
  };
}

async function sendMessage(text: string, step: string): Promise<void> {
  try {
    const response = await fetch(`${WORKER_URL}/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createMessage(text)),
    });

    const responseText = await response.text();
    console.log(`[${step}] Status: ${response.status}`);
    console.log(`[${step}] Response: ${responseText}`);
  } catch (error) {
    console.error(`[${step}] Error:`, error);
  }
}

async function runTest() {
  console.log('Testing birthday: 1971-02-21');
  console.log('User ID:', TEST_USER_ID);
  console.log('='.repeat(80));

  // Test the exact birthday that failed
  await sendMessage('1971-02-21', 'Birthday Input');
}

runTest();

