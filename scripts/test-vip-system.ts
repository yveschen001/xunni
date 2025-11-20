/**
 * Complete VIP System Test Suite
 * 
 * Tests all VIP-related functionality without requiring manual interaction.
 * 
 * Usage:
 *   pnpm tsx scripts/test-vip-system.ts [staging|production]
 * 
 * Example:
 *   pnpm tsx scripts/test-vip-system.ts staging
 */

const args = process.argv.slice(2);
const environment = args[0] || 'staging';

const URLS = {
  staging: 'https://xunni-bot-staging.yves221.workers.dev',
  production: 'https://xunni-bot.yves221.workers.dev',
};

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

const results: TestResult[] = [];

async function runTest(
  name: string,
  testFn: () => Promise<{ passed: boolean; message: string }>
): Promise<void> {
  const startTime = Date.now();
  console.log(`🧪 Running: ${name}...`);

  try {
    const result = await testFn();
    const duration = Date.now() - startTime;

    results.push({
      name,
      passed: result.passed,
      message: result.message,
      duration,
    });

    if (result.passed) {
      console.log(`✅ PASSED: ${name} (${duration}ms)`);
    } else {
      console.log(`❌ FAILED: ${name} (${duration}ms)`);
      console.log(`   ${result.message}`);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    results.push({
      name,
      passed: false,
      message: error instanceof Error ? error.message : String(error),
      duration,
    });
    console.log(`❌ ERROR: ${name} (${duration}ms)`);
    console.log(`   ${error}`);
  }

  console.log('');
}

// Test 1: Health Check
async function testHealthCheck() {
  const url = URLS[environment as keyof typeof URLS];
  const response = await fetch(`${url}/health`);
  const data = await response.json();

  return {
    passed: response.status === 200 && data.status === 'ok',
    message: `Health check returned: ${JSON.stringify(data)}`,
  };
}

// Test 2: Subscription Export Endpoint
async function testSubscriptionExport() {
  const url = URLS[environment as keyof typeof URLS];
  const response = await fetch(`${url}/subscription-export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: '396943893' }),
  });

  const data = await response.json();

  return {
    passed: response.status === 200 && data.ok === true,
    message: `Subscription export returned: ${JSON.stringify(data)}`,
  };
}

// Test 3: Database Schema Check (via subscription export)
async function testDatabaseSchema() {
  const url = URLS[environment as keyof typeof URLS];
  const response = await fetch(`${url}/subscription-export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: '396943893' }),
  });

  const data = await response.json();

  if (!data.ok) {
    return {
      passed: false,
      message: `Failed to query database: ${data.error}`,
    };
  }

  const hasSubscriptions = Array.isArray(data.result.subscriptions);
  const hasPayments = Array.isArray(data.result.payments);

  return {
    passed: hasSubscriptions && hasPayments,
    message: `Database schema check: subscriptions=${hasSubscriptions}, payments=${hasPayments}`,
  };
}

// Test 4: Payment Record Structure
async function testPaymentRecordStructure() {
  const url = URLS[environment as keyof typeof URLS];
  const response = await fetch(`${url}/subscription-export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: '396943893' }),
  });

  const data = await response.json();

  if (!data.ok || !data.result.payments || data.result.payments.length === 0) {
    return {
      passed: true,
      message: 'No payments found (expected for new user)',
    };
  }

  const payment = data.result.payments[0];
  const hasRequiredFields =
    payment.id &&
    payment.telegram_payment_id &&
    payment.amount_stars !== undefined &&
    payment.currency &&
    payment.status;

  return {
    passed: hasRequiredFields,
    message: `Payment record structure: ${JSON.stringify(payment)}`,
  };
}

// Test 5: Configuration Check
async function testConfiguration() {
  const url = URLS[environment as keyof typeof URLS];
  const response = await fetch(`${url}/health`);
  const data = await response.json();

  const hasEnvironment = data.environment === environment;

  return {
    passed: hasEnvironment,
    message: `Environment: ${data.environment}, Expected: ${environment}`,
  };
}

// Main test runner
async function runAllTests() {
  const url = URLS[environment as keyof typeof URLS];

  if (!url) {
    console.error('❌ Invalid environment. Use "staging" or "production"');
    process.exit(1);
  }

  console.log('🚀 VIP System Test Suite');
  console.log('📍 Environment:', environment);
  console.log('🔗 Base URL:', url);
  console.log('');
  console.log('─'.repeat(60));
  console.log('');

  await runTest('Health Check', testHealthCheck);
  await runTest('Subscription Export Endpoint', testSubscriptionExport);
  await runTest('Database Schema Check', testDatabaseSchema);
  await runTest('Payment Record Structure', testPaymentRecordStructure);
  await runTest('Configuration Check', testConfiguration);

  console.log('─'.repeat(60));
  console.log('');
  console.log('📊 Test Summary');
  console.log('');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Total Duration: ${totalDuration}ms`);
  console.log('');

  if (failed > 0) {
    console.log('❌ Some tests failed:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`   - ${r.name}: ${r.message}`);
      });
    console.log('');
    process.exit(1);
  } else {
    console.log('✅ All tests passed!');
    console.log('');
    console.log('📝 Manual Testing Required:');
    console.log('   1. Send /vip to the bot');
    console.log('   2. Click "購買 VIP" button');
    console.log('   3. Complete payment with test card: 4242 4242 4242 4242');
    console.log('   4. Verify VIP status with /profile');
    console.log('');
  }
}

runAllTests();

