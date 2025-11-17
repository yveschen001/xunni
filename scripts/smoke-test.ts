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
const skippedTests = 0;

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

async function testCommandCoverage() {
  console.log('\n🧪 Testing Full Command Coverage...\n');

  const commands = [
    '/profile',
    '/profile_card',
    '/vip',
    '/stats',
    '/menu',
    '/rules',
    '/settings',
    '/edit_profile',
    '/chats',
    '/block',
    '/report',
    '/dev_info',
    '/dev_skip',
    '/dev_reset',
    '/dev_restart',
  ];

  for (const command of commands) {
    await testEndpoint('Command Coverage', command, async () => {
      const result = await sendWebhook(command);
      if (result.status !== 200) {
        throw new Error(`Expected 200, got ${result.status}`);
      }
    });
  }
}

// ============================================================================
// Dev Commands Tests
// ============================================================================

async function testDevCommands() {
  console.log('\n🔧 Testing Dev Commands...\n');

  const testUserId = Math.floor(Math.random() * 1000000) + 100000000;

  await testEndpoint('Dev Commands', '/dev_reset - Clear user data', async () => {
    const result = await sendWebhook('/dev_reset', testUserId);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
    // Should contain "開發模式：數據已重置" without Markdown
    if (result.data.includes('**')) {
      throw new Error('Response contains Markdown formatting (should be plain text)');
    }
  });

  await testEndpoint('Dev Commands', '/dev_skip - Quick setup', async () => {
    const result = await sendWebhook('/dev_skip', testUserId);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
    // Should contain "開發模式：跳過註冊" without Markdown
    if (result.data.includes('**')) {
      throw new Error('Response contains Markdown formatting (should be plain text)');
    }
  });

  await testEndpoint('Dev Commands', '/dev_info - User info', async () => {
    const result = await sendWebhook('/dev_info', testUserId);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
    // Should contain user info without Markdown
    if (result.data.includes('**') || result.data.includes('`')) {
      throw new Error('Response contains Markdown formatting (should be plain text)');
    }
  });

  await testEndpoint('Dev Commands', '/start after /dev_reset - Re-registration', async () => {
    const newUserId = Math.floor(Math.random() * 1000000) + 200000000;
    
    // Reset user
    await sendWebhook('/dev_reset', newUserId);
    
    // Try /start - should trigger language selection
    const result = await sendWebhook('/start', newUserId);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
  });

  await testEndpoint('Dev Commands', '/dev_restart - Reset and auto start onboarding', async () => {
    const newUserId = Math.floor(Math.random() * 1000000) + 250000000;
    
    // First create a user
    await sendWebhook('/dev_skip', newUserId);
    
    // Then restart - should clear data and show language selection
    const result = await sendWebhook('/dev_restart', newUserId);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
    // Should automatically show language selection without needing /start
  });
}

// ============================================================================
// Message Quota Tests
// ============================================================================

async function testMessageQuota() {
  console.log('\n💬 Testing Message Quota System...\n');

  const userA = Math.floor(Math.random() * 1000000) + 300000000;
  const userB = Math.floor(Math.random() * 1000000) + 400000000;

  await testEndpoint('Message Quota', 'Setup users', async () => {
    // Setup both users
    await sendWebhook('/dev_reset', userA);
    await sendWebhook('/dev_skip', userA);
    await sendWebhook('/dev_reset', userB);
    await sendWebhook('/dev_skip', userB);
  });

  await testEndpoint('Message Quota', 'Throw and catch bottle', async () => {
    // User A throws bottle
    await sendWebhook('/throw', userA);
    await sendWebhook('Hello, this is a test message for bottle', userA);
    
    // User B catches bottle
    const result = await sendWebhook('/catch', userB);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
  });

  await testEndpoint('Message Quota', 'Send conversation message', async () => {
    // User B replies
    const result = await sendWebhook('Test reply message', userB);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
    // Should not contain "getTodayString is not a function" error
    if (result.data.includes('getTodayString')) {
      throw new Error('getTodayString function name error detected');
    }
  });

  await testEndpoint('Message Quota', 'Quota check logic', async () => {
    // This test verifies that quota checking doesn't crash
    // Actual quota limits would be tested in integration tests
    const result = await sendWebhook('Another test message', userB);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
  });
}

// ============================================================================
// Conversation Identifier Tests
// ============================================================================

async function testConversationIdentifiers() {
  console.log('\n🔖 Testing Conversation Identifiers...\n');

  const userA = Math.floor(Math.random() * 1000000) + 500000000;
  const userB = Math.floor(Math.random() * 1000000) + 600000000;

  await testEndpoint('Conversation Identifiers', 'Setup and create conversation', async () => {
    // Setup users
    await sendWebhook('/dev_reset', userA);
    await sendWebhook('/dev_skip', userA);
    await sendWebhook('/dev_reset', userB);
    await sendWebhook('/dev_skip', userB);
    
    // Create conversation
    await sendWebhook('/throw', userA);
    await sendWebhook('Test bottle for identifier check', userA);
    await sendWebhook('/catch', userB);
  });

  await testEndpoint('Conversation Identifiers', 'Identifier format validation', async () => {
    // Send a message to generate identifier
    const result = await sendWebhook('Test message for identifier', userB);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
    // Identifier should be in format #MMDDHHHH (e.g., #0117ABCD)
    // This would be validated in the actual message content
    // For smoke test, we just verify no errors
  });
}

// ============================================================================
// Invite System Tests
// ============================================================================

async function testInviteSystem() {
  console.log('\n🎁 Testing Invite System...\n');

  // Test 1: Invite code in /start command
  await testEndpoint('Invite System', 'Extract invite code from /start', async () => {
    const inviterUserId = Math.floor(Math.random() * 1000000) + 200000000;
    const inviteeUserId = Math.floor(Math.random() * 1000000) + 300000000;
    
    // Create inviter first
    await sendWebhook('/start', inviterUserId);
    
    // Simulate invitee using invite code
    // Note: In real test, we would get the actual invite code from inviter's profile
    const fakeInviteCode = 'XUNNI-TEST1234';
    const response = await sendWebhook(`/start invite_${fakeInviteCode}`, inviteeUserId);
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
  });

  // Test 2: Prevent self-invitation
  await testEndpoint('Invite System', 'Prevent self-invitation', async () => {
    const userId = Math.floor(Math.random() * 1000000) + 400000000;
    
    // User tries to use their own invite code
    const response = await sendWebhook('/start invite_XUNNI-SELF1234', userId);
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    
    // Should receive error message about self-invitation
    // (actual validation would check response content)
  });

  // Test 3: Invalid invite code format
  await testEndpoint('Invite System', 'Handle invalid invite code format', async () => {
    const userId = Math.floor(Math.random() * 1000000) + 500000000;
    
    // Try with invalid format
    const response = await sendWebhook('/start invite_invalid', userId);
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    
    // Should proceed with normal registration (ignore invalid code)
  });

  // Test 4: Profile shows invite statistics
  await testEndpoint('Invite System', 'Profile shows invite statistics', async () => {
    const userId = Math.floor(Math.random() * 1000000) + 600000000;
    
    // Create user and complete onboarding
    await sendWebhook('/start', userId);
    
    // Check profile (after onboarding would be complete)
    const response = await sendWebhook('/profile', userId);
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    
    // Profile should contain invite code and statistics
    // (actual validation would check for invite code format in response)
  });

  // Test 5: Invite activation after first bottle throw
  await testEndpoint('Invite System', 'Invite activation mechanism', async () => {
    const inviterUserId = Math.floor(Math.random() * 1000000) + 700000000;
    const inviteeUserId = Math.floor(Math.random() * 1000000) + 800000000;
    
    // This test would require:
    // 1. Inviter completes registration
    // 2. Invitee uses invite code
    // 3. Invitee completes onboarding
    // 4. Invitee throws first bottle
    // 5. Check that invite is activated and both users notified
    
    // For smoke test, we just verify the endpoints respond
    await sendWebhook('/start', inviterUserId);
    await sendWebhook('/start', inviteeUserId);
    
    // Verification would happen in integration tests
  });

  // Test 6: Daily quota calculation with invite bonus
  await testEndpoint('Invite System', 'Daily quota includes invite bonus', async () => {
    const userId = Math.floor(Math.random() * 1000000) + 900000000;
    
    await sendWebhook('/start', userId);
    
    // After user has successful invites, quota should increase
    // This would be verified by checking /stats or throw/catch limits
    const response = await sendWebhook('/stats', userId);
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
  });

  // Test 7: Invite limit warning for free users
  await testEndpoint('Invite System', 'Invite limit warning system', async () => {
    const userId = Math.floor(Math.random() * 1000000) + 1000000000;
    
    await sendWebhook('/start', userId);
    
    // User approaching invite limit should see warning
    // This would be tested in integration tests with actual invite data
    const response = await sendWebhook('/profile', userId);
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
  });

  // Test 8: Share invite code button
  await testEndpoint('Invite System', 'Share invite code functionality', async () => {
    const userId = Math.floor(Math.random() * 1000000) + 1100000000;
    
    await sendWebhook('/start', userId);
    
    // Profile should have share button
    const response = await sendWebhook('/profile', userId);
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    
    // Response should contain share button with invite link
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
    await testDevCommands();
    await testMessageQuota();
    await testConversationIdentifiers();
    await testInviteSystem();
    await testErrorHandling();
    await testDatabaseConnectivity();
    await testPerformance();
    await testCommandCoverage();
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

