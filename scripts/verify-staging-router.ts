// Verification script for Staging Router - Testing Bottle Throw Reply
// Run with: npx tsx scripts/verify-staging-router.ts

async function verify() {
  const url = 'https://xunni-bot-staging.yves221.workers.dev/webhook';
  console.log(`Verifying router stability (Throw Reply) at ${url}...`);

  const payload = {
    update_id: 888888,
    message: {
      message_id: 67890,
      from: {
        id: 396943893,
        is_bot: false,
        first_name: 'Verification',
        username: 'verify_bot',
        language_code: 'zh-TW'
      },
      chat: {
        id: 396943893,
        type: 'private'
      },
      date: Math.floor(Date.now() / 1000),
      text: '這是自動化測試漂流瓶內容',
      reply_to_message: {
        message_id: 67889,
        from: {
            id: 123456, // Bot ID
            is_bot: true,
            first_name: 'Bot'
        },
        chat: {
            id: 396943893,
            type: 'private'
        },
        date: Math.floor(Date.now() / 1000) - 10,
        text: '請輸入內容 #THROW' // Contains trigger
      }
    }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.status === 200) {
      console.log('✅ SUCCESS: Webhook returned 200 OK. processBottleContent logic executed without crash.');
    } else {
      console.error(`❌ FAILED: Webhook returned ${res.status} ${res.statusText}`);
      console.error(await res.text());
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ FAILED: Network error', error);
    process.exit(1);
  }
}

verify();
