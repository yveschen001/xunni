/**
 * Test Bot Functionality
 * Simulates Telegram webhook requests to test the bot
 */

import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKER_URL = 'https://xunni-bot-staging.yves221.workers.dev';

interface TestResult {
  name: string;
  status: 'pass' | 'fail';
  message: string;
  response?: any;
}

const results: TestResult[] = [];

async function testEndpoint(name: string, endpoint: string, body?: any): Promise<TestResult> {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`   Endpoint: ${endpoint}`);
    
    const response = await fetch(`${WORKER_URL}${endpoint}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, data);

    if (response.ok) {
      return {
        name,
        status: 'pass',
        message: `✅ Success (${response.status})`,
        response: data,
      };
    } else {
      return {
        name,
        status: 'fail',
        message: `❌ Failed (${response.status})`,
        response: data,
      };
    }
  } catch (error) {
    console.log(`   Error:`, error);
    return {
      name,
      status: 'fail',
      message: `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function runTests() {
  console.log('🚀 Starting XunNi Bot Tests\n');
  console.log('=' .repeat(80));

  // Test 1: Health Check
  results.push(await testEndpoint('Health Check', '/'));

  // Test 2: Webhook Endpoint (simulated /start command)
  const startUpdate = {
    update_id: 1,
    message: {
      message_id: 1,
      from: {
        id: 123456789,
        is_bot: false,
        first_name: 'Test',
        username: 'testuser',
        language_code: 'zh-TW',
      },
      chat: {
        id: 123456789,
        first_name: 'Test',
        username: 'testuser',
        type: 'private',
      },
      date: Math.floor(Date.now() / 1000),
      text: '/start',
    },
  };

  results.push(await testEndpoint('Webhook - /start Command', '/webhook', startUpdate));

  // Test 3: Webhook Endpoint (simulated /help command)
  const helpUpdate = {
    ...startUpdate,
    update_id: 2,
    message: {
      ...startUpdate.message,
      message_id: 2,
      text: '/help',
    },
  };

  results.push(await testEndpoint('Webhook - /help Command', '/webhook', helpUpdate));

  // Print Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 Test Summary\n');

  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;

  results.forEach((result) => {
    console.log(`${result.status === 'pass' ? '✅' : '❌'} ${result.name}`);
    console.log(`   ${result.message}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log(`\n📈 Results: ${passed} passed, ${failed} failed out of ${results.length} tests\n`);

  if (failed > 0) {
    console.log('❌ Some tests failed. Please check the logs above.\n');
    process.exit(1);
  } else {
    console.log('✅ All tests passed!\n');
    console.log('🎉 Bot is working correctly!\n');
    console.log('📝 Next steps:');
    console.log('   1. Test the bot in Telegram by sending /start');
    console.log('   2. Complete the onboarding process');
    console.log('   3. Test /throw and /catch commands');
    console.log('   4. Test anonymous chat functionality\n');
  }
}

runTests().catch((error) => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});

