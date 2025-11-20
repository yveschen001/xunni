/**
 * Test VIP Payment Webhook
 * 
 * This script simulates a successful payment webhook from Telegram
 * to test the payment processing logic without actually making a payment.
 * 
 * Usage:
 *   pnpm tsx scripts/test-vip-payment-webhook.ts [staging|production] [user_id]
 * 
 * Example:
 *   pnpm tsx scripts/test-vip-payment-webhook.ts staging 396943893
 */

const args = process.argv.slice(2);
const environment = args[0] || 'staging';
const userId = args[1] || '396943893';

const URLS = {
  staging: 'https://xunni-bot-staging.yves221.workers.dev/webhook',
  production: 'https://xunni-bot.yves221.workers.dev/webhook',
};

const WEBHOOK_SECRETS = {
  staging: process.env.TELEGRAM_WEBHOOK_SECRET || '',
  production: process.env.TELEGRAM_WEBHOOK_SECRET || '',
};

// Simulate a successful payment update from Telegram
const createPaymentUpdate = (userId: string) => {
  return {
    update_id: Math.floor(Math.random() * 1000000),
    message: {
      message_id: Math.floor(Math.random() * 1000000),
      from: {
        id: parseInt(userId),
        is_bot: false,
        first_name: 'Test',
        username: 'testuser',
        language_code: 'zh-hans',
      },
      chat: {
        id: parseInt(userId),
        first_name: 'Test',
        username: 'testuser',
        type: 'private',
      },
      date: Math.floor(Date.now() / 1000),
      successful_payment: {
        currency: 'XTR',
        total_amount: 1,
        invoice_payload: JSON.stringify({
          user_id: userId,
          type: 'vip_subscription',
          duration_days: 30,
          is_renewal: false,
          is_subscription: false,
        }),
        telegram_payment_charge_id: `test_${Date.now()}_${userId}`,
        provider_payment_charge_id: `${userId}_test`,
      },
    },
  };
};

async function testVipPaymentWebhook() {
  const url = URLS[environment as keyof typeof URLS];
  const secret = WEBHOOK_SECRETS[environment as keyof typeof WEBHOOK_SECRETS];

  if (!url) {
    console.error('❌ Invalid environment. Use "staging" or "production"');
    process.exit(1);
  }

  console.log('🧪 Testing VIP Payment Webhook');
  console.log('📍 Environment:', environment);
  console.log('🔗 URL:', url);
  console.log('👤 User ID:', userId);
  console.log('');
  console.log('⚠️  WARNING: This will simulate a real payment!');
  console.log('⚠️  Make sure you understand what this script does before running it.');
  console.log('');

  const update = createPaymentUpdate(userId);

  console.log('📤 Sending payment webhook...');
  console.log('📄 Update data:');
  console.log(JSON.stringify(update, null, 2));
  console.log('');

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (secret) {
      headers['X-Telegram-Bot-Api-Secret-Token'] = secret;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(update),
    });

    console.log('📥 Response status:', response.status);
    console.log('');

    if (response.status === 200) {
      console.log('✅ Webhook accepted!');
      console.log('');
      console.log('📊 Next steps:');
      console.log('1. Check Cloudflare logs for payment processing');
      console.log('2. Send /profile to the bot to verify VIP status');
      console.log('3. Check the database for payment record');
    } else {
      console.log('❌ Webhook failed');
      const text = await response.text();
      console.log('Response:', text);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testVipPaymentWebhook();

