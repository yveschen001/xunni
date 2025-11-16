/**
 * Test /catch translation flow
 */

const WEBHOOK_URL = 'https://xunni-bot-staging.yves221.workers.dev/webhook';
const TEST_USER_ID = Math.floor(Math.random() * 1000000) + 100000000;

async function sendWebhook(text: string, userId: number = TEST_USER_ID) {
  const payload = {
    update_id: Date.now(),
    message: {
      message_id: Date.now(),
      from: {
        id: userId,
        is_bot: false,
        first_name: 'TestUser',
        username: 'testuser',
        language_code: 'zh-TW',
      },
      chat: {
        id: userId,
        first_name: 'TestUser',
        username: 'testuser',
        type: 'private',
      },
      date: Math.floor(Date.now() / 1000),
      text: text,
    },
  };

  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return {
    status: response.status,
    body: await response.text(),
  };
}

async function main() {
  console.log('🧪 Testing /catch Translation Flow\n');
  console.log('='.repeat(80));

  // Step 1: Register user
  console.log('\n📝 Step 1: Registering user...');
  await sendWebhook('/start');
  await new Promise(resolve => setTimeout(resolve, 1000));
  await sendWebhook('TestNickname');
  await new Promise(resolve => setTimeout(resolve, 1000));
  await sendWebhook('lang_zh-TW');
  await new Promise(resolve => setTimeout(resolve, 1000));
  await sendWebhook('gender_male');
  await new Promise(resolve => setTimeout(resolve, 1000));
  await sendWebhook('gender_confirm_male');
  await new Promise(resolve => setTimeout(resolve, 1000));
  await sendWebhook('1990-01-01');
  await new Promise(resolve => setTimeout(resolve, 1000));
  await sendWebhook('confirm_birthday_1990-01-01');
  await new Promise(resolve => setTimeout(resolve, 1000));
  await sendWebhook('mbti_choice_skip');
  await new Promise(resolve => setTimeout(resolve, 1000));
  await sendWebhook('anti_fraud_yes');
  await new Promise(resolve => setTimeout(resolve, 1000));
  await sendWebhook('agree_terms');
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('✅ User registered');

  // Step 2: Throw a bottle with Chinese text
  console.log('\n🍾 Step 2: Throwing a bottle with Chinese text...');
  const throwUserId = TEST_USER_ID + 1;
  await sendWebhook('/start', throwUserId);
  await new Promise(resolve => setTimeout(resolve, 1000));
  await sendWebhook('ThrowerNickname', throwUserId);
  await new Promise(resolve => setTimeout(resolve, 1000));
  await sendWebhook('lang_zh-TW', throwUserId);
  await new Promise(resolve => setTimeout(resolve, 1000));
  await sendWebhook('gender_female', throwUserId);
  await new Promise(resolve => setTimeout(resolve, 1000));
  await sendWebhook('gender_confirm_female', throwUserId);
  await new Promise(resolve => setTimeout(resolve, 1000));
  await sendWebhook('1995-05-05', throwUserId);
  await new Promise(resolve => setTimeout(resolve, 1000));
  await sendWebhook('confirm_birthday_1995-05-05', throwUserId);
  await new Promise(resolve => setTimeout(resolve, 1000));
  await sendWebhook('mbti_choice_skip', throwUserId);
  await new Promise(resolve => setTimeout(resolve, 1000));
  await sendWebhook('anti_fraud_yes', throwUserId);
  await new Promise(resolve => setTimeout(resolve, 1000));
  await sendWebhook('agree_terms', throwUserId);
  await new Promise(resolve => setTimeout(resolve, 1000));

  await sendWebhook('/throw', throwUserId);
  await new Promise(resolve => setTimeout(resolve, 1000));
  await sendWebhook('測試翻譯英文測試翻譯英文測試翻譯英文測試翻譯英文', throwUserId);
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('✅ Bottle thrown');

  // Step 3: Catch the bottle
  console.log('\n🎣 Step 3: Catching the bottle (should trigger translation)...');
  const result = await sendWebhook('/catch');
  
  console.log('\n📊 Response:');
  console.log('Status:', result.status);
  console.log('Body:', result.body);

  console.log('\n='.repeat(80));
  console.log('\n💡 Check the Telegram bot to see if translation worked!');
}

main().catch(console.error);

