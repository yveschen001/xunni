/**
 * Age Restriction Test
 * 
 * Tests that users under 18 are prevented from registering
 */

const WORKER_URL = 'https://xunni-bot-staging.yves221.workers.dev';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, message: string) {
  results.push({ name, passed, message });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
}

function createTelegramUpdate(text: string, userId: number) {
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

async function sendWebhook(text: string, userId: number): Promise<{ status: number; data: string }> {
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

async function testAgeRestriction() {
  console.log('\n🔞 測試年齡限制功能\n');
  console.log('=' .repeat(80));

  // Test Case 1: User under 18 (17 years old)
  console.log('\n📋 測試 1: 未滿 18 歲的用戶（17 歲）');
  const underageUserId = Math.floor(Math.random() * 1000000) + 5000000000;
  
  try {
    // Calculate a birthday that makes user 17 years old
    const today = new Date();
    const seventeenYearsAgo = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate());
    const underageBirthday = seventeenYearsAgo.toISOString().split('T')[0];
    
    console.log(`   生日：${underageBirthday}（17 歲）`);
    
    // Start registration
    await sendWebhook('/start', underageUserId);
    
    // Try to input underage birthday
    // Note: In real scenario, user would go through language selection, nickname, gender first
    // For this test, we're directly testing the birthday validation
    const result = await sendWebhook(underageBirthday, underageUserId);
    
    // We expect the bot to reject this
    if (result.status === 200) {
      // Check if response contains rejection message
      if (result.data.includes('18 歲') || result.data.includes('成年')) {
        logTest('拒絕未成年用戶', true, `正確拒絕 17 歲用戶`);
      } else {
        logTest('拒絕未成年用戶', false, `未檢測到拒絕訊息`);
      }
    } else {
      logTest('拒絕未成年用戶', false, `Status: ${result.status}`);
    }
  } catch (error) {
    logTest('拒絕未成年用戶', false, String(error));
  }

  // Test Case 2: User exactly 18 years old (should be allowed)
  console.log('\n📋 測試 2: 剛滿 18 歲的用戶');
  const eighteenUserId = Math.floor(Math.random() * 1000000) + 6000000000;
  
  try {
    // Calculate a birthday that makes user exactly 18 years old
    const today = new Date();
    const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    const eighteenBirthday = eighteenYearsAgo.toISOString().split('T')[0];
    
    console.log(`   生日：${eighteenBirthday}（18 歲）`);
    
    // Start registration
    await sendWebhook('/start', eighteenUserId);
    
    // Try to input birthday
    const result = await sendWebhook(eighteenBirthday, eighteenUserId);
    
    if (result.status === 200) {
      // Should not contain rejection message
      if (!result.data.includes('很抱歉') && !result.data.includes('成年後再來')) {
        logTest('接受 18 歲用戶', true, `正確接受 18 歲用戶`);
      } else {
        logTest('接受 18 歲用戶', false, `錯誤拒絕了 18 歲用戶`);
      }
    } else {
      logTest('接受 18 歲用戶', false, `Status: ${result.status}`);
    }
  } catch (error) {
    logTest('接受 18 歲用戶', false, String(error));
  }

  // Test Case 3: User 25 years old (should be allowed)
  console.log('\n📋 測試 3: 25 歲的用戶');
  const adultUserId = Math.floor(Math.random() * 1000000) + 7000000000;
  
  try {
    const adultBirthday = '2000-01-01'; // 25 years old in 2025
    
    console.log(`   生日：${adultBirthday}（25 歲）`);
    
    // Start registration
    await sendWebhook('/start', adultUserId);
    
    // Try to input birthday
    const result = await sendWebhook(adultBirthday, adultUserId);
    
    if (result.status === 200) {
      // Should not contain rejection message
      if (!result.data.includes('很抱歉') && !result.data.includes('成年後再來')) {
        logTest('接受成年用戶', true, `正確接受 25 歲用戶`);
      } else {
        logTest('接受成年用戶', false, `錯誤拒絕了 25 歲用戶`);
      }
    } else {
      logTest('接受成年用戶', false, `Status: ${result.status}`);
    }
  } catch (error) {
    logTest('接受成年用戶', false, String(error));
  }

  // Test Case 4: Domain logic test
  console.log('\n📋 測試 4: 年齡計算邏輯');
  
  try {
    const { calculateAge } = await import('../src/domain/user');
    
    // Test various ages
    const tests = [
      { birthday: '2010-01-01', expectedAge: 15, shouldAllow: false },
      { birthday: '2007-11-17', expectedAge: 18, shouldAllow: true }, // Exactly 18 today
      { birthday: '2007-11-18', expectedAge: 17, shouldAllow: false }, // 17 years, 364 days
      { birthday: '2000-01-01', expectedAge: 25, shouldAllow: true },
      { birthday: '1990-06-15', expectedAge: 35, shouldAllow: true },
    ];
    
    let allCorrect = true;
    for (const test of tests) {
      const age = calculateAge(test.birthday);
      const isAllowed = age !== null && age >= 18;
      
      if (age !== test.expectedAge) {
        console.log(`   ❌ 年齡計算錯誤：${test.birthday} 應該是 ${test.expectedAge} 歲，但計算為 ${age} 歲`);
        allCorrect = false;
      } else if (isAllowed !== test.shouldAllow) {
        console.log(`   ❌ 年齡限制錯誤：${test.birthday}（${age} 歲）應該${test.shouldAllow ? '允許' : '拒絕'}，但結果相反`);
        allCorrect = false;
      }
    }
    
    if (allCorrect) {
      logTest('年齡計算邏輯', true, '所有年齡計算正確');
    } else {
      logTest('年齡計算邏輯', false, '年齡計算有誤');
    }
  } catch (error) {
    logTest('年齡計算邏輯', false, String(error));
  }

  // Print Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 測試總結\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`✅ 通過：${passed}/${total}`);
  console.log(`❌ 失敗：${failed}/${total}`);
  console.log(`📈 成功率：${((passed / total) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log('❌ 失敗的測試：');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
    console.log('');
  }

  console.log('='.repeat(80));

  return { passed, failed, total };
}

// Run tests
console.log('\n🚀 開始測試年齡限制功能...\n');

testAgeRestriction()
  .then(result => {
    if (result && result.failed === 0) {
      console.log('\n🎉 所有測試通過！年齡限制功能正常運作。\n');
      process.exit(0);
    } else {
      console.log('\n⚠️ 有測試失敗，請檢查上述錯誤。\n');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ 測試執行失敗：', error);
    process.exit(1);
  });

