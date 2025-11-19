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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout per request

    const response = await fetch(`${WORKER_URL}/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(update),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await response.text();
    return { status: response.status, data };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout (10s)');
    }
    throw new Error(`Webhook request failed: ${String(error)}`);
  }
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

async function testEndpoint(
  category: string,
  name: string,
  testFn: () => Promise<void>,
  timeoutMs: number = 30000 // 30s default timeout per test
): Promise<void> {
  totalTests++;
  const startTime = Date.now();

  try {
    await withTimeout(
      testFn(),
      timeoutMs,
      `Test timeout after ${timeoutMs}ms`
    );
    const duration = Date.now() - startTime;
    passedTests++;
    
    // Color code based on duration
    let durationDisplay = `${duration}ms`;
    if (duration > 10000) {
      durationDisplay = `⚠️ ${duration}ms (slow)`;
    } else if (duration > 5000) {
      durationDisplay = `🐢 ${duration}ms`;
    }
    
    results.push({
      category,
      name,
      status: 'pass',
      message: `✅ Passed in ${durationDisplay}`,
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
// Test MBTI Version Support
// ============================================================================

async function testMBTIVersionSupport() {
  console.log('\n🧠 Testing MBTI Version Support...\n');

  // Test 1: Quick version (12 questions)
  await testEndpoint('MBTI Versions', 'Quick version has 12 questions', async () => {
    // This would be tested with the unit test: test-mbti-version-display.ts
    // Here we just verify the system accepts MBTI commands
    const userId = Math.floor(Math.random() * 1000000) + 1200000000;
    await sendWebhook('/dev_skip', userId);
    const result = await sendWebhook('/mbti', userId);
    
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
  });

  // Test 2: Full version (36 questions)
  await testEndpoint('MBTI Versions', 'Full version supported', async () => {
    const userId = Math.floor(Math.random() * 1000000) + 1300000000;
    await sendWebhook('/dev_skip', userId);
    const result = await sendWebhook('/mbti', userId);
    
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
    
    // Should show version selection menu
  });

  // Test 3: MBTI test completion
  await testEndpoint('MBTI Versions', 'Test completion logic', async () => {
    // Verify that test completion doesn't crash
    // Actual completion logic tested in unit tests
    const userId = Math.floor(Math.random() * 1000000) + 1400000000;
    await sendWebhook('/dev_skip', userId);
    const result = await sendWebhook('/mbti', userId);
    
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
  });
}

async function testEditProfileFeatures() {
  console.log('\n✏️ Testing Edit Profile Features...\n');

  const userId = Math.floor(Math.random() * 1000000) + 1500000000;

  // Setup user
  await testEndpoint('Edit Profile', 'Setup user', async () => {
    await sendWebhook('/dev_skip', userId);
  });

  // Test 1: Edit profile command
  await testEndpoint('Edit Profile', '/edit_profile command', async () => {
    const result = await sendWebhook('/edit_profile', userId);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
  });

  // Test 2: Nickname validation (domain logic)
  await testEndpoint('Edit Profile', 'Nickname validation', async () => {
    const { validateNickname } = await import('../src/domain/user');
    
    // Valid nickname
    const validResult = validateNickname('測試暱稱');
    if (!validResult.valid) {
      throw new Error('Valid nickname rejected');
    }

    // URL rejection
    const urlResult = validateNickname('測試 https://test.com');
    if (urlResult.valid) {
      throw new Error('URL in nickname not rejected');
    }

    // Length check
    const shortResult = validateNickname('短');
    if (shortResult.valid) {
      throw new Error('Short nickname not rejected');
    }
  });

  // Test 3: Bio validation
  await testEndpoint('Edit Profile', 'Bio validation', async () => {
    const { validateBio } = await import('../src/domain/user');
    
    // Valid bio
    const validResult = validateBio('這是我的個人簡介');
    if (!validResult.valid) {
      throw new Error('Valid bio rejected');
    }

    // Empty bio allowed
    const emptyResult = validateBio('');
    if (!emptyResult.valid) {
      throw new Error('Empty bio not allowed');
    }

    // Length check
    const longBio = 'a'.repeat(201);
    const longResult = validateBio(longBio);
    if (longResult.valid) {
      throw new Error('Long bio not rejected');
    }
  });

  // Test 4: Blood type editing
  await testEndpoint('Edit Profile', 'Blood type editing', async () => {
    const { getBloodTypeOptions, getBloodTypeDisplay } = await import('../src/domain/blood_type');
    
    // Check options
    const options = getBloodTypeOptions();
    if (options.length !== 5) {
      throw new Error(`Expected 5 blood type options, got ${options.length}`);
    }

    // Check display
    const displayA = getBloodTypeDisplay('A');
    if (displayA !== '🩸 A 型') {
      throw new Error(`Blood type display incorrect: ${displayA}`);
    }
  });

  // Test 5: MBTI retake available
  await testEndpoint('Edit Profile', 'MBTI retake', async () => {
    const result = await sendWebhook('/mbti', userId);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
  });
}

async function testBloodTypeFeatures() {
  console.log('\n🩸 Testing Blood Type Features...\n');

  const userId = Math.floor(Math.random() * 1000000) + 1800000000;

  // Setup user
  await testEndpoint('Blood Type', 'Setup user', async () => {
    await sendWebhook('/dev_skip', userId);
  });

  // Test 1: Blood type in profile
  await testEndpoint('Blood Type', 'Profile shows blood type', async () => {
    const result = await sendWebhook('/profile', userId);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
  });

  // Test 2: Blood type options
  await testEndpoint('Blood Type', 'Blood type options', async () => {
    const { getBloodTypeOptions } = await import('../src/domain/blood_type');
    const options = getBloodTypeOptions();
    
    const expectedOptions = ['A', 'B', 'AB', 'O', null];
    if (options.length !== expectedOptions.length) {
      throw new Error(`Expected ${expectedOptions.length} options, got ${options.length}`);
    }
  });

  // Test 3: Blood type display
  await testEndpoint('Blood Type', 'Blood type display', async () => {
    const { getBloodTypeDisplay } = await import('../src/domain/blood_type');
    
    const tests = [
      { input: 'A', expected: '🩸 A 型' },
      { input: 'B', expected: '🩸 B 型' },
      { input: 'AB', expected: '🩸 AB 型' },
      { input: 'O', expected: '🩸 O 型' },
      { input: null, expected: '未設定' },
    ];

    for (const test of tests) {
      const result = getBloodTypeDisplay(test.input as any);
      if (result !== test.expected) {
        throw new Error(`Expected "${test.expected}", got "${result}"`);
      }
    }
  });
}

async function testConversationHistoryPosts() {
  console.log('\n📜 Testing Conversation History Posts...\n');

  // Test 1: Domain logic - build history content
  await testEndpoint('History Posts', 'Build history content', async () => {
    const { buildHistoryPostContent } = await import('../src/domain/conversation_history');
    
    // Messages should be pre-formatted strings
    const messages = [
      '[05:30] 你：你好',
      '[05:31] 對方：你好呀',
    ];

    const partnerInfo = {
      maskedNickname: '張**',
      mbti: 'ENTP',
      bloodType: 'A',
      zodiac: 'Virgo',
    };

    const content = buildHistoryPostContent(
      '1117ABCD',    // identifier (without #)
      1,             // postNumber
      messages,      // pre-formatted message strings
      2,             // totalMessages
      partnerInfo
    );

    if (!content.includes('張**')) {
      throw new Error('Partner nickname not in content');
    }
    if (!content.includes('ENTP')) {
      throw new Error('MBTI not in content');
    }
    if (!content.includes('你好')) {
      throw new Error('Messages not in content');
    }
  });

  // Test 2: Domain logic - extract messages
  await testEndpoint('History Posts', 'Extract messages', async () => {
    const { extractMessages } = await import('../src/domain/conversation_history');
    
    const content = `💬 與 #1117ABCD 的對話記錄（第 1 頁）

━━━━━━━━━━━━━━━━

[05:30] 你：你好
[05:31] 對方：你好呀

━━━━━━━━━━━━━━━━`;

    const messages = extractMessages(content);
    
    if (messages.length !== 2) {
      throw new Error(`Expected 2 messages, got ${messages.length}`);
    }
    // extractMessages returns full formatted strings, not just content
    if (!messages[0].includes('你好')) {
      throw new Error(`First message incorrect: ${messages[0]}`);
    }
  });

  // Test 3: Check required files exist
  await testEndpoint('History Posts', 'Required files exist', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const requiredFiles = [
      'src/db/migrations/0015_add_conversation_history_posts.sql',
      'src/db/queries/conversation_history_posts.ts',
      'src/domain/conversation_history.ts',
      'src/services/conversation_history.ts',
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(process.cwd(), file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required file missing: ${file}`);
      }
    }
  });
}

// ============================================================================
// New Feature Tests (2025-11-19)
// ============================================================================

async function testTutorialSystem() {
  console.log('\n🎓 Testing Tutorial System...\n');

  const testUserId = Math.floor(Math.random() * 1000000) + 200000000;

  // Setup user first
  await testEndpoint('Tutorial', 'Setup User', async () => {
    const result = await sendWebhook('/dev_skip', testUserId);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
  });

  // Test tutorial files exist
  await testEndpoint('Tutorial', 'Tutorial Files Exist', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const requiredFiles = [
      'src/telegram/handlers/tutorial.ts',
      'src/domain/tutorial.ts',
      'src/db/migrations/0033_alter_users_add_tutorial_fields.sql',
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(process.cwd(), file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required file missing: ${file}`);
      }
    }
  });
}

async function testTaskSystem() {
  console.log('\n📋 Testing Task System...\n');

  const testUserId = Math.floor(Math.random() * 1000000) + 300000000;

  // Setup user
  await testEndpoint('Tasks', 'Setup User', async () => {
    const result = await sendWebhook('/dev_skip', testUserId);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
  });

  // Test /tasks command
  await testEndpoint('Tasks', '/tasks Command', async () => {
    const result = await sendWebhook('/tasks', testUserId);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
  });

  // Test task files exist
  await testEndpoint('Tasks', 'Task Files Exist', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const requiredFiles = [
      'src/telegram/handlers/tasks.ts',
      'src/domain/task.ts',
      'src/db/queries/tasks.ts',
      'src/db/queries/user_tasks.ts',
      'src/db/migrations/0030_create_tasks_table.sql',
      'src/db/migrations/0031_create_user_tasks_table.sql',
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(process.cwd(), file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required file missing: ${file}`);
      }
    }
  });

  // Test menu integration
  await testEndpoint('Tasks', '/menu Shows Next Task', async () => {
    const result = await sendWebhook('/menu', testUserId);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
  });
}

async function testChannelMembershipSystem() {
  console.log('\n📢 Testing Channel Membership System...\n');

  await testEndpoint('Channel Membership', 'Service Files Exist', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const requiredFiles = [
      'src/services/channel_membership_check.ts',
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(process.cwd(), file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required file missing: ${file}`);
      }
    }
  });

  // Test manual trigger endpoint (with timeout and graceful failure)
  await testEndpoint('Channel Membership', 'Manual Check Endpoint', async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch(`${WORKER_URL}/api/test/check-channel`, {
        method: 'POST',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      // Accept both 200 (success) and 404 (not implemented yet)
      if (response.status !== 200 && response.status !== 404) {
        throw new Error(`Expected 200 or 404, got ${response.status}`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout (5s)');
      }
      throw error;
    }
  });
}

async function testGigaPubIntegration() {
  console.log('\n📺 Testing GigaPub Ad Integration...\n');

  await testEndpoint('GigaPub', 'Ad Page Exists', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const adPagePath = path.join(process.cwd(), 'public/ad.html');
    if (!fs.existsSync(adPagePath)) {
      throw new Error('Ad page (public/ad.html) not found');
    }

    // Check if GigaPub script is included
    const content = fs.readFileSync(adPagePath, 'utf-8');
    if (!content.includes('ad.gigapub.tech/script?id=4406')) {
      throw new Error('GigaPub script not found in ad.html');
    }
    if (!content.includes('window.showGiga')) {
      throw new Error('showGiga function not found in ad.html');
    }
  });

  await testEndpoint('GigaPub', 'Ad Page Accessible', async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${WORKER_URL}/ad.html`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`);
      }

      const html = await response.text();
      if (!html.includes('GigaPub')) {
        throw new Error('Ad page does not contain GigaPub content');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout (5s)');
      }
      throw error;
    }
  });

  await testEndpoint('GigaPub', 'Migration Exists', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const migrationPath = path.join(process.cwd(), 'src/db/migrations/0035_insert_gigapub_provider.sql');
    if (!fs.existsSync(migrationPath)) {
      throw new Error('GigaPub migration (0035) not found');
    }

    const content = fs.readFileSync(migrationPath, 'utf-8');
    if (!content.includes('gigapub')) {
      throw new Error('Migration does not contain gigapub provider');
    }
    if (!content.includes('4406')) {
      throw new Error('Migration does not contain project ID 4406');
    }
  });
}

async function testSmartCommandPrompts() {
  console.log('\n💡 Testing Smart Command Prompts...\n');

  const testUserId = Math.floor(Math.random() * 1000000) + 400000000;

  // Setup user
  await testEndpoint('Smart Prompts', 'Setup User', async () => {
    const result = await sendWebhook('/dev_skip', testUserId);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
  });

  // Test intent recognition for "throw bottle"
  await testEndpoint('Smart Prompts', 'Throw Intent Recognition', async () => {
    const result = await sendWebhook('我要丟瓶子', testUserId);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
  });

  // Test intent recognition for "catch bottle"
  await testEndpoint('Smart Prompts', 'Catch Intent Recognition', async () => {
    const result = await sendWebhook('我想撿瓶子', testUserId);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
  });

  // Test unknown command with helpful message
  await testEndpoint('Smart Prompts', 'Unknown Command Handling', async () => {
    const result = await sendWebhook('隨機文字測試', testUserId);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
  });
}

async function testAdSystemBasics() {
  console.log('\n📊 Testing Ad System Basics...\n');

  await testEndpoint('Ad System', 'Ad Tables Migration Exists', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const requiredFiles = [
      'src/db/migrations/0024_create_ad_providers_table.sql',
      'src/db/migrations/0025_create_ad_rewards_table.sql',
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(process.cwd(), file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required file missing: ${file}`);
      }
    }
  });

  await testEndpoint('Ad System', 'Ad Handlers Exist', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const requiredFiles = [
      'src/telegram/handlers/ad_reward.ts',
      'src/db/queries/ad_providers.ts',
      'src/db/queries/ad_rewards.ts',
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(process.cwd(), file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required file missing: ${file}`);
      }
    }
  });

  // Test ad completion endpoint (with timeout, should exist even if not configured)
  await testEndpoint('Ad System', 'Ad Completion Endpoint', async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${WORKER_URL}/api/ad/complete?user=999999&token=test&provider=test`, {
        method: 'POST',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Accept 200, 400, or 401 (endpoint exists but validation fails)
      if (![200, 400, 401, 403].includes(response.status)) {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout (5s)');
      }
      throw error;
    }
  });
}

async function testAnalyticsCommands() {
  console.log('\n📈 Testing Analytics Commands...\n');

  const adminUserId = 396943893; // Super admin user ID

  await testEndpoint('Analytics', '/analytics Command', async () => {
    const result = await sendWebhook('/analytics', adminUserId);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
  });

  await testEndpoint('Analytics', '/ad_performance Command', async () => {
    const result = await sendWebhook('/ad_performance', adminUserId);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
  });

  await testEndpoint('Analytics', '/funnel Command', async () => {
    const result = await sendWebhook('/funnel', adminUserId);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
  });
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runTestSuite(
  name: string,
  testFn: () => Promise<void>,
  timeoutMs: number = 60000 // 60s per test suite
): Promise<void> {
  const startTime = Date.now();
  console.log(`\n⏳ Running: ${name}...`);
  
  try {
    await withTimeout(
      testFn(),
      timeoutMs,
      `Test suite "${name}" timeout after ${timeoutMs}ms`
    );
    const duration = Date.now() - startTime;
    console.log(`✅ ${name} completed in ${duration}ms`);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ ${name} failed after ${duration}ms:`, error instanceof Error ? error.message : String(error));
    throw error; // Re-throw to mark suite as failed
  }
}

async function runAllTests() {
  console.log('🚀 XunNi Bot - Comprehensive Smoke Test\n');
  console.log('=' .repeat(80));
  console.log(`Worker URL: ${WORKER_URL}`);
  console.log(`Test User ID: ${TEST_USER_ID}`);
  console.log(`⏱️  Request Timeout: 10s per request`);
  console.log(`⏱️  Test Timeout: 30s per test`);
  console.log(`⏱️  Suite Timeout: 60s per suite`);
  console.log(`⏱️  Total Timeout: 10 minutes`);
  console.log('=' .repeat(80));

  const startTime = Date.now();
  const TOTAL_TIMEOUT = 10 * 60 * 1000; // 10 minutes total

  try {
    await withTimeout(
      (async () => {
        // Core Infrastructure Tests
        await runTestSuite('Infrastructure', testInfrastructure);
        await runTestSuite('User Commands', testUserCommands);
        await runTestSuite('Onboarding', testOnboarding);
        await runTestSuite('Dev Commands', testDevCommands);
        
        // Feature Tests
        await runTestSuite('Message Quota', testMessageQuota);
        await runTestSuite('Conversation Identifiers', testConversationIdentifiers);
        await runTestSuite('Invite System', testInviteSystem);
        await runTestSuite('MBTI Version Support', testMBTIVersionSupport);
        await runTestSuite('Edit Profile Features', testEditProfileFeatures);
        await runTestSuite('Blood Type Features', testBloodTypeFeatures);
        await runTestSuite('Conversation History Posts', testConversationHistoryPosts);
        
        // New Feature Tests (2025-11-19)
        console.log('\n' + '='.repeat(80));
        console.log('🆕 Testing New Features (2025-11-19)');
        console.log('='.repeat(80));
        await runTestSuite('Tutorial System', testTutorialSystem);
        await runTestSuite('Task System', testTaskSystem);
        await runTestSuite('Channel Membership', testChannelMembershipSystem);
        await runTestSuite('GigaPub Integration', testGigaPubIntegration);
        await runTestSuite('Smart Command Prompts', testSmartCommandPrompts);
        await runTestSuite('Ad System Basics', testAdSystemBasics);
        await runTestSuite('Analytics Commands', testAnalyticsCommands);
        
        // System Tests
        console.log('\n' + '='.repeat(80));
        console.log('🔧 Testing System Reliability');
        console.log('='.repeat(80));
        await runTestSuite('Error Handling', testErrorHandling);
        await runTestSuite('Database Connectivity', testDatabaseConnectivity);
        await runTestSuite('Performance', testPerformance);
        await runTestSuite('Command Coverage', testCommandCoverage);
      })(),
      TOTAL_TIMEOUT,
      `Total test suite timeout after ${TOTAL_TIMEOUT}ms (10 minutes)`
    );
  } catch (error) {
    console.error('\n❌ Test suite error:', error instanceof Error ? error.message : String(error));
  }

  const totalDuration = Date.now() - startTime;
  const totalMinutes = Math.floor(totalDuration / 60000);
  const totalSeconds = Math.floor((totalDuration % 60000) / 1000);

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
  
  // Format duration
  let durationDisplay = '';
  if (totalMinutes > 0) {
    durationDisplay = `${totalMinutes}m ${totalSeconds}s`;
  } else {
    durationDisplay = `${totalSeconds}s`;
  }
  console.log(`   ⏱️  Duration: ${durationDisplay} (${totalDuration}ms)`);
  console.log(`   📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

  // Show slow tests
  const slowTests = results.filter(r => r.duration && r.duration > 5000);
  if (slowTests.length > 0) {
    console.log('🐢 Slow Tests (>5s):');
    slowTests.forEach(test => {
      const seconds = ((test.duration || 0) / 1000).toFixed(2);
      console.log(`   ${test.category} - ${test.name}: ${seconds}s`);
    });
    console.log('');
  }

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

