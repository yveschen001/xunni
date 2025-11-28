import { SmartRunner } from './runner';
import { createHmac, randomBytes } from 'node:crypto';
import { broadcastTests } from './features/broadcast';
import { pushSystemTests } from './features/push_system';
import { pushInteractionTests } from './features/push_interaction';
import { settingsQuietTests } from './features/settings_quiet';
import { mbtiShareTests } from './features/mbti_share';

// Reusing the logic from verified script
function generateMoonPacketHeaders(secret: string, body: object = {}) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(8).toString('hex');
  const payload = JSON.stringify(body) + timestamp + nonce;
  const signature = createHmac('sha256', secret).update(payload).digest('hex');

  return {
    'Content-Type': 'application/json',
    'X-API-KEY': 'mock-api-key', // Adjust if needed
    'X-API-TIMESTAMP': timestamp,
    'X-API-NONCE': nonce,
    'X-API-SIGNATURE': signature
  };
}

export async function runFeatureSuites(runner: SmartRunner, baseUrl: string, config: any) {
  // 1. MoonPacket API
  await runner.runSuite('feature', 'MoonPacket API (Mode A)', async () => {
      // Use the secret from .dev.vars
      const secret = process.env.MOONPACKET_API_SECRET || 'your_secret_here'; 
      
      const res = await fetch(`${baseUrl}/api/moonpacket/check`, {
          method: 'GET',
          headers: generateMoonPacketHeaders(secret, {})
      });
      
      if (res.status === 401) {
           // Allow 401 if we suspect environment mismatch, but warn
           // In local dev, we set "your_secret_here", so it SHOULD pass if correct.
           // If it fails, maybe API Key mismatch?
           // Let's print body to debug
           const body = await res.text();
           throw new Error(`Unauthorized (401): ${body}`);
      }

      if (res.status !== 200) {
          throw new Error(`Mode A failed with status ${res.status}: ${await res.text()}`);
      }

      const data = await res.json() as any;
      if (!data.data || !data.data.level || !data.data.level.gte) {
          throw new Error('Invalid Mode A response structure');
      }
  });

  await runner.runSuite('feature', 'MoonPacket API (Mode B)', async () => {
      const secret = process.env.MOONPACKET_API_SECRET || 'your_secret_here';
      const userId = '123456789';
      
      const res = await fetch(`${baseUrl}/api/moonpacket/check?user_id=${userId}`, {
          method: 'GET',
          headers: generateMoonPacketHeaders(secret, {})
      });

      if (res.status !== 200) {
          throw new Error(`Mode B failed with status ${res.status}: ${await res.text()}`);
      }

      const data = await res.json() as any;
      if (!data.data || typeof data.data.level !== 'number') {
           throw new Error('Invalid Mode B response structure');
      }
  });

  // 2. Broadcast System V2
  // We can iterate over the tests exported from broadcastTests
  for (const test of broadcastTests.tests) {
      await runner.runSuite('feature', `${broadcastTests.name}: ${test.name}`, async (ctx) => {
          await test.fn({
            ...ctx,
            sendWebhook: async (payload: any) => {
                const secret = process.env.TELEGRAM_WEBHOOK_SECRET || 'xunni_webhook_secret_staging_2025';
                const res = await fetch(`${baseUrl}/webhook`, {
                    method: 'POST',
                    body: JSON.stringify(payload),
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-Telegram-Bot-Api-Secret-Token': secret
                    }
                });
                return { status: res.status, body: await res.text() };
            }
          });
      });
  }

  // 3. Push System
  for (const test of pushSystemTests.tests) {
      await runner.runSuite('feature', `${pushSystemTests.name}: ${test.name}`, async (ctx) => {
          await test.fn({
            ...ctx,
            sendWebhook: async (payload: any) => {
                const secret = process.env.TELEGRAM_WEBHOOK_SECRET || 'xunni_webhook_secret_staging_2025';
                const res = await fetch(`${baseUrl}/webhook`, {
                    method: 'POST',
                    body: JSON.stringify(payload),
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-Telegram-Bot-Api-Secret-Token': secret
                    }
                });
                return { status: res.status, body: await res.text() };
            }
          });
      });
  }

  // 4. Push Interaction
  for (const test of pushInteractionTests.tests) {
      await runner.runSuite('feature', `${pushInteractionTests.name}: ${test.name}`, async (ctx) => {
          await test.fn(ctx);
      });
  }

  // 5. Settings Quiet Hours
  for (const test of settingsQuietTests.tests) {
      await runner.runSuite('feature', `${settingsQuietTests.name}: ${test.name}`, async (ctx) => {
          await test.fn(ctx);
      });
  }

  // 6. MBTI Share Deep Link
  for (const test of mbtiShareTests.tests) {
      await runner.runSuite('feature', `${mbtiShareTests.name}: ${test.name}`, async (ctx) => {
          await test.fn({
            ...ctx,
            sendWebhook: async (payload: any) => {
                const secret = process.env.TELEGRAM_WEBHOOK_SECRET || 'xunni_webhook_secret_staging_2025';
                const res = await fetch(`${baseUrl}/webhook`, {
                    method: 'POST',
                    body: JSON.stringify(payload),
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-Telegram-Bot-Api-Secret-Token': secret
                    }
                });
                return { status: res.status, body: await res.text() };
            }
          });
      });
  }
}
