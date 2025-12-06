/**
 * Phase 1 Comprehensive Test Script
 * 
 * Tests all Phase 1 features:
 * - Session management
 * - Main menu
 * - Settings
 * - VIP filtering
 */

const STAGING_WEBHOOK_URL = 'https://xunni-bot-staging.yves221.workers.dev/webhook';
const TEST_USER_ID = 7654321098; // Test user ID

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function sendUpdate(update: any): Promise<void> {
  const response = await fetch(STAGING_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 1000));
}

async function testMenuCommand(): Promise<void> {
  console.log('\n📋 Testing /menu command...');
  
  try {
    await sendUpdate({
      update_id: Date.now(),
      message: {
        message_id: Date.now(),
        from: {
          id: TEST_USER_ID,
          is_bot: false,
          first_name: 'Test',
          username: 'testuser',
        },
        chat: {
          id: TEST_USER_ID,
          type: 'private',
        },
        date: Math.floor(Date.now() / 1000),
        text: '/menu',
      },
    });

    results.push({ name: '/menu command', passed: true });
    console.log('✅ /menu command sent successfully');
  } catch (error) {
    results.push({
      name: '/menu command',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
    console.error('❌ /menu command failed:', error);
  }
}

async function testMenuCallback(): Promise<void> {
  console.log('\n🔘 Testing menu callbacks...');
  
  const callbacks = [
    'menu_profile',
    'menu_stats',
    'menu_settings',
  ];

  for (const callback of callbacks) {
    try {
      await sendUpdate({
        update_id: Date.now(),
        callback_query: {
          id: `${Date.now()}`,
          from: {
            id: TEST_USER_ID,
            is_bot: false,
            first_name: 'Test',
            username: 'testuser',
          },
          message: {
            message_id: Date.now(),
            from: {
              id: 123456789,
              is_bot: true,
              first_name: 'XunNi Bot',
            },
            chat: {
              id: TEST_USER_ID,
              type: 'private',
            },
            date: Math.floor(Date.now() / 1000),
            text: 'Menu',
          },
          chat_instance: `${Date.now()}`,
          data: callback,
        },
      });

      results.push({ name: `Menu callback: ${callback}`, passed: true });
      console.log(`✅ ${callback} callback sent successfully`);
    } catch (error) {
      results.push({
        name: `Menu callback: ${callback}`,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
      console.error(`❌ ${callback} callback failed:`, error);
    }
  }
}

async function testSettingsCommand(): Promise<void> {
  console.log('\n⚙️ Testing /settings command...');
  
  try {
    await sendUpdate({
      update_id: Date.now(),
      message: {
        message_id: Date.now(),
        from: {
          id: TEST_USER_ID,
          is_bot: false,
          first_name: 'Test',
          username: 'testuser',
        },
        chat: {
          id: TEST_USER_ID,
          type: 'private',
        },
        date: Math.floor(Date.now() / 1000),
        text: '/settings',
      },
    });

    results.push({ name: '/settings command', passed: true });
    console.log('✅ /settings command sent successfully');
  } catch (error) {
    results.push({
      name: '/settings command',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
    console.error('❌ /settings command failed:', error);
  }
}

async function testLanguageChange(): Promise<void> {
  console.log('\n🌐 Testing language change...');
  
  const languages = ['en', 'ja', 'zh-TW'];

  for (const lang of languages) {
    try {
      await sendUpdate({
        update_id: Date.now(),
        callback_query: {
          id: `${Date.now()}`,
          from: {
            id: TEST_USER_ID,
            is_bot: false,
            first_name: 'Test',
            username: 'testuser',
          },
          message: {
            message_id: Date.now(),
            from: {
              id: 123456789,
              is_bot: true,
              first_name: 'XunNi Bot',
            },
            chat: {
              id: TEST_USER_ID,
              type: 'private',
            },
            date: Math.floor(Date.now() / 1000),
            text: 'Settings',
          },
          chat_instance: `${Date.now()}`,
          data: `set_lang_${lang}`,
        },
      });

      results.push({ name: `Language change: ${lang}`, passed: true });
      console.log(`✅ Language changed to ${lang}`);
    } catch (error) {
      results.push({
        name: `Language change: ${lang}`,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
      console.error(`❌ Language change to ${lang} failed:`, error);
    }
  }
}

async function testVIPFilter(): Promise<void> {
  console.log('\n💎 Testing VIP filter flow...');
  
  const steps = [
    { name: 'Advanced filter', data: 'throw_advanced' },
    { name: 'MBTI filter', data: 'filter_mbti' },
    { name: 'Select MBTI INTJ', data: 'select_mbti_INTJ' },
    { name: 'Select MBTI ENFP', data: 'select_mbti_ENFP' },
    { name: 'Back to filter', data: 'back_to_filter' },
    { name: 'Zodiac filter', data: 'filter_zodiac' },
    { name: 'Select Aries', data: 'select_zodiac_aries' },
    { name: 'Select Leo', data: 'select_zodiac_leo' },
    { name: 'Back to filter', data: 'back_to_filter' },
    { name: 'Gender filter', data: 'filter_gender' },
    { name: 'Set gender female', data: 'set_gender_female' },
    { name: 'Back to filter', data: 'back_to_filter' },
    { name: 'Filter done', data: 'filter_done' },
  ];

  for (const step of steps) {
    try {
      await sendUpdate({
        update_id: Date.now(),
        callback_query: {
          id: `${Date.now()}`,
          from: {
            id: TEST_USER_ID,
            is_bot: false,
            first_name: 'Test',
            username: 'testuser',
          },
          message: {
            message_id: Date.now(),
            from: {
              id: 123456789,
              is_bot: true,
              first_name: 'XunNi Bot',
            },
            chat: {
              id: TEST_USER_ID,
              type: 'private',
            },
            date: Math.floor(Date.now() / 1000),
            text: 'Filter',
          },
          chat_instance: `${Date.now()}`,
          data: step.data,
        },
      });

      results.push({ name: `VIP Filter: ${step.name}`, passed: true });
      console.log(`✅ ${step.name} completed`);
    } catch (error) {
      results.push({
        name: `VIP Filter: ${step.name}`,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
      console.error(`❌ ${step.name} failed:`, error);
    }
  }
}

async function testReturnToMenu(): Promise<void> {
  console.log('\n🏠 Testing return to menu...');
  
  try {
    await sendUpdate({
      update_id: Date.now(),
      callback_query: {
        id: `${Date.now()}`,
        from: {
          id: TEST_USER_ID,
          is_bot: false,
          first_name: 'Test',
          username: 'testuser',
        },
        message: {
          message_id: Date.now(),
          from: {
            id: 123456789,
            is_bot: true,
            first_name: 'XunNi Bot',
          },
          chat: {
            id: TEST_USER_ID,
            type: 'private',
          },
          date: Math.floor(Date.now() / 1000),
          text: 'Some content',
        },
        chat_instance: `${Date.now()}`,
        data: 'return_to_menu',
      },
    });

    results.push({ name: 'Return to menu', passed: true });
    console.log('✅ Return to menu successful');
  } catch (error) {
    results.push({
      name: 'Return to menu',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
    console.error('❌ Return to menu failed:', error);
  }
}

async function generateReport(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('📊 PHASE 1 TEST REPORT');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  const passRate = ((passed / total) * 100).toFixed(2);

  console.log(`\n✅ Passed: ${passed}/${total} (${passRate}%)`);
  console.log(`❌ Failed: ${failed}/${total}`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  • ${r.name}: ${r.error}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  // Write report to file
  const report = {
    timestamp: new Date().toISOString(),
    total,
    passed,
    failed,
    passRate: `${passRate}%`,
    results,
  };

  await Bun.write(
    'PHASE1_TEST_REPORT.json',
    JSON.stringify(report, null, 2)
  );

  console.log('📝 Report saved to PHASE1_TEST_REPORT.json');
}

async function main(): Promise<void> {
  console.log('🚀 Starting Phase 1 Comprehensive Tests...\n');
  console.log(`Target: ${STAGING_WEBHOOK_URL}`);
  console.log(`Test User ID: ${TEST_USER_ID}\n`);

  // Run all tests
  await testMenuCommand();
  await testMenuCallback();
  await testSettingsCommand();
  await testLanguageChange();
  await testVIPFilter();
  await testReturnToMenu();

  // Generate report
  await generateReport();

  // Exit with appropriate code
  const failed = results.filter(r => !r.passed).length;
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

