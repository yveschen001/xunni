/**
 * Comprehensive Smoke Test
 * Tests all bot functionality end-to-end
 */

import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKER_URL = 'https://xunni-bot-staging.yves221.workers.dev';
const TEST_USER_ID = Math.floor(Math.random() * 1000000) + 100000000; // Random test user

interface TestResult {
  category: string;
  name: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  duration?: number;
  error?: any;
}

const results: TestResult[] = [];
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let skippedTests = 0;

// ============================================================================
// Test Utilities
// ============================================================================

function createTelegramUpdate(text: string, userId: number = TEST_USER_ID) {
  return {
    update_id: Math.floor(Math.random() * 1000000),
    message: {
      message_id: Math.floor(Math.random() * 1000000),
      from: {
        id: userId,
        is_bot: false,
        first_name: 'Test',
        last_name: 'User',
        username: `testuser${userId}`,
        language_code: 'zh-TW',
      },
      chat: {
        id: userId,
        first_name: 'Test',
        username: `testuser${userId}`,
        type: 'private' as const,
      },
      date: Math.floor(Date.now() / 1000),
      text,
    },
  };
}

async function sendWebhook(text: string, userId?: number): Promise<{ status: number; data: any }> {
  const update = createTelegramUpdate(text, userId);
  
  try {
    const response = await fetch(`${WORKER_URL}/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(update),
    });

    const data = await response.text();
    return { status: response.status, data };
  } catch (error) {
    throw new Error(`Webhook request failed: ${String(error)}`);
  }
}

async function testEndpoint(
  category: string,
  name: string,
  testFn: () => Promise<void>
): Promise<void> {
  totalTests++;
  const startTime = Date.now();

  try {
    await testFn();
    const duration = Date.now() - startTime;
    passedTests++;
    results.push({
      category,
      name,
      status: 'pass',
      message: `✅ Passed in ${duration}ms`,
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    failedTests++;
    results.push({
      category,
      name,
      status: 'fail',
      message: `❌ Failed: ${error instanceof Error ? error.message : String(error)}`,
      duration,
      error: error instanceof Error ? error : String(error),
    });
  }
}

// ============================================================================
// Test Suites
// ============================================================================

async function testInfrastructure() {
  console.log('\n🔧 Testing Infrastructure...\n');

  await testEndpoint('Infrastructure', 'Health Check', async () => {
    const response = await fetch(`${WORKER_URL}/`);
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    const data = (await response.json()) as { status: string };
    if (data.status !== 'ok') {
      throw new Error('Health check failed');
    }
  });

  await testEndpoint('Infrastructure', 'Webhook Endpoint', async () => {
    const result = await sendWebhook('/help');
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
  });
}

async function testUserCommands() {
  console.log('\n👤 Testing User Commands...\n');

  const testUserId = Math.floor(Math.random() * 1000000) + 100000000;

  await testEndpoint('User Commands', '/start - New User', async () => {
    const result = await sendWebhook('/start', testUserId);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
  });

  await testEndpoint('User Commands', '/help', async () => {
    const result = await sendWebhook('/help');
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
  });

  await testEndpoint('User Commands', '/throw - Unregistered User', async () => {
    const newUserId = Math.floor(Math.random() * 1000000) + 100000000;
    const result = await sendWebhook('/throw', newUserId);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
  });

  await testEndpoint('User Commands', '/catch - Unregistered User', async () => {
    const newUserId = Math.floor(Math.random() * 1000000) + 100000000;
    const result = await sendWebhook('/catch', newUserId);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
  });
}

async function testOnboarding() {
  console.log('\n📝 Testing Onboarding Flow...\n');

  const testUserId = Math.floor(Math.random() * 1000000) + 100000000;

  await testEndpoint('Onboarding', 'Start Registration', async () => {
    const result = await sendWebhook('/start', testUserId);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
  });

  await testEndpoint('Onboarding', 'Nickname Input', async () => {
    const result = await sendWebhook('測試用戶', testUserId);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
  });

  // Note: Full onboarding requires callback queries which we can't easily test here
  // These would need to be tested manually or with a more sophisticated test framework
}

async function testErrorHandling() {
  console.log('\n⚠️ Testing Error Handling...\n');

  await testEndpoint('Error Handling', 'Invalid JSON', async () => {
    const response = await fetch(`${WORKER_URL}/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'invalid json',
    });
    
    // Should return 500 or 400
    if (response.status !== 500 && response.status !== 400) {
      throw new Error(`Expected 400 or 500, got ${response.status}`);
    }
  });

  await testEndpoint('Error Handling', 'Missing Message', async () => {
    const response = await fetch(`${WORKER_URL}/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ update_id: 1 }),
    });
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
  });

  await testEndpoint('Error Handling', 'Unknown Command', async () => {
    const result = await sendWebhook('/unknown_command_xyz');
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
  });
}

async function testDatabaseConnectivity() {
  console.log('\n🗄️ Testing Database Connectivity...\n');

  await testEndpoint('Database', 'User Creation', async () => {
    const newUserId = Math.floor(Math.random() * 1000000) + 100000000;
    const result = await sendWebhook('/start', newUserId);
    if (result.status !== 200) {
      throw new Error(`Database operation failed: ${result.status}`);
    }
  });
}

async function testPerformance() {
  console.log('\n⚡ Testing Performance...\n');

  await testEndpoint('Performance', 'Response Time < 5s', async () => {
    const startTime = Date.now();
    await sendWebhook('/help');
    const duration = Date.now() - startTime;
    
    if (duration > 5000) {
      throw new Error(`Response took ${duration}ms, expected < 5000ms`);
    }
  });

  await testEndpoint('Performance', 'Concurrent Requests', async () => {
    const promises = Array.from({ length: 5 }, (_, i) => 
      sendWebhook('/help', TEST_USER_ID + i)
    );
    
    const results = await Promise.all(promises);
    const failedRequests = results.filter(r => r.status !== 200);
    
    if (failedRequests.length > 0) {
      throw new Error(`${failedRequests.length}/5 concurrent requests failed`);
    }
  });
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runAllTests() {
  console.log('🚀 XunNi Bot - Comprehensive Smoke Test\n');
  console.log('=' .repeat(80));
  console.log(`Worker URL: ${WORKER_URL}`);
  console.log(`Test User ID: ${TEST_USER_ID}`);
  console.log('=' .repeat(80));

  const startTime = Date.now();

  try {
    await testInfrastructure();
    await testUserCommands();
    await testOnboarding();
    await testErrorHandling();
    await testDatabaseConnectivity();
    await testPerformance();
  } catch (error) {
    console.error('\n❌ Test suite error:', error);
  }

  const totalDuration = Date.now() - startTime;

  // Print Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 Test Summary\n');

  // Group by category
  const categories = [...new Set(results.map(r => r.category))];
  
  for (const category of categories) {
    const categoryResults = results.filter(r => r.category === category);
    const passed = categoryResults.filter(r => r.status === 'pass').length;
    const failed = categoryResults.filter(r => r.status === 'fail').length;
    
    console.log(`\n${category}:`);
    categoryResults.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : '❌';
      console.log(`  ${icon} ${result.name}`);
      if (result.status === 'fail') {
        console.log(`     ${result.message}`);
      }
    });
    console.log(`  ${passed}/${categoryResults.length} passed`);
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n📈 Overall Results:`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   ✅ Passed: ${passedTests}`);
  console.log(`   ❌ Failed: ${failedTests}`);
  console.log(`   ⏭️  Skipped: ${skippedTests}`);
  console.log(`   ⏱️  Duration: ${totalDuration}ms`);
  console.log(`   📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

  // Exit code
  if (failedTests > 0) {
    console.log('❌ Some tests failed. Please review the errors above.\n');
    
    // Print failed tests for easy debugging
    console.log('Failed Tests:');
    results.filter(r => r.status === 'fail').forEach(r => {
      console.log(`  - ${r.category}: ${r.name}`);
      console.log(`    ${r.message}`);
      if (r.error) {
        console.log(`    ${r.error}`);
      }
    });
    
    process.exit(1);
  } else {
    console.log('✅ All tests passed!\n');
    console.log('🎉 Bot is working correctly!\n');
    process.exit(0);
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});

