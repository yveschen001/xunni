/**
 * Test Subscription Export Endpoint
 * 
 * Usage:
 *   pnpm tsx scripts/test-subscription-export.ts [staging|production] [user_id]
 * 
 * Example:
 *   pnpm tsx scripts/test-subscription-export.ts staging 396943893
 */

const args = process.argv.slice(2);
const environment = args[0] || 'staging';
const userId = args[1] || '396943893';

const URLS = {
  staging: 'https://xunni-bot-staging.yves221.workers.dev/subscription-export',
  production: 'https://xunni-bot.yves221.workers.dev/subscription-export',
};

async function testSubscriptionExport() {
  const url = URLS[environment as keyof typeof URLS];
  
  if (!url) {
    console.error('❌ Invalid environment. Use "staging" or "production"');
    process.exit(1);
  }

  console.log('🧪 Testing Subscription Export Endpoint');
  console.log('📍 Environment:', environment);
  console.log('🔗 URL:', url);
  console.log('👤 User ID:', userId);
  console.log('');

  try {
    console.log('📤 Sending request...');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
      }),
    });

    console.log('📥 Response status:', response.status);
    console.log('');

    const data = await response.json();
    console.log('📄 Response data:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');

    if (data.ok) {
      console.log('✅ Test passed!');
      console.log('📊 Summary:');
      console.log(`   - Subscriptions: ${data.result.subscriptions.length}`);
      console.log(`   - Payments: ${data.result.payments.length}`);
    } else {
      console.log('❌ Test failed:', data.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testSubscriptionExport();

