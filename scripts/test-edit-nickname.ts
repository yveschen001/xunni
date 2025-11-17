/**
 * Test Edit Nickname Functionality
 * 
 * Validates nickname editing with various inputs
 */

async function testEditNickname() {
  console.log('🧪 測試編輯暱稱功能...\n');

  let passed = 0;
  let failed = 0;

  try {
    // Import functions
    const { checkUrlWhitelist } = await import('../src/utils/url-whitelist');

    // Test 1: Valid nickname without URL
    console.log('📝 測試 1: 有效暱稱（無 URL）');
    const test1 = checkUrlWhitelist('大大的大大');
    if (test1.allowed === true) {
      console.log('✅ "大大的大大" 應該被允許');
      passed++;
    } else {
      console.log('❌ "大大的大大" 應該被允許，但被拒絕了');
      console.log('   返回值:', test1);
      failed++;
    }

    // Test 2: Valid nickname with Chinese characters
    console.log('\n📝 測試 2: 有效暱稱（中文字符）');
    const test2 = checkUrlWhitelist('測試暱稱123');
    if (test2.allowed === true) {
      console.log('✅ "測試暱稱123" 應該被允許');
      passed++;
    } else {
      console.log('❌ "測試暱稱123" 應該被允許，但被拒絕了');
      failed++;
    }

    // Test 3: Nickname with http URL (should be blocked)
    console.log('\n📝 測試 3: 包含 http URL 的暱稱（應該被拒絕）');
    const test3 = checkUrlWhitelist('我的網站 http://example.com');
    if (test3.allowed === false && test3.blockedUrls && test3.blockedUrls.length > 0) {
      console.log('✅ "我的網站 http://example.com" 應該被拒絕');
      console.log('   被阻擋的 URL:', test3.blockedUrls);
      passed++;
    } else {
      console.log('❌ "我的網站 http://example.com" 應該被拒絕，但被允許了');
      failed++;
    }

    // Test 4: Nickname with https URL (should be blocked)
    console.log('\n📝 測試 4: 包含 https URL 的暱稱（應該被拒絕）');
    const test4 = checkUrlWhitelist('訪問 https://example.com');
    if (test4.allowed === false && test4.blockedUrls && test4.blockedUrls.length > 0) {
      console.log('✅ "訪問 https://example.com" 應該被拒絕');
      passed++;
    } else {
      console.log('❌ "訪問 https://example.com" 應該被拒絕，但被允許了');
      failed++;
    }

    // Test 5: Whitelisted URL (t.me) should be allowed
    console.log('\n📝 測試 5: 白名單 URL（t.me）應該被允許');
    const test5 = checkUrlWhitelist('聯絡我 https://t.me/username');
    if (test5.allowed === true) {
      console.log('✅ "聯絡我 https://t.me/username" 應該被允許（白名單）');
      passed++;
    } else {
      console.log('❌ "聯絡我 https://t.me/username" 應該被允許，但被拒絕了');
      failed++;
    }

    // Test 6: Empty string
    console.log('\n📝 測試 6: 空字符串');
    const test6 = checkUrlWhitelist('');
    if (test6.allowed === true) {
      console.log('✅ 空字符串應該被允許（無 URL）');
      passed++;
    } else {
      console.log('❌ 空字符串應該被允許，但被拒絕了');
      failed++;
    }

    // Test 7: Special characters without URL
    console.log('\n📝 測試 7: 特殊字符（無 URL）');
    const test7 = checkUrlWhitelist('暱稱@#$%^&*()');
    if (test7.allowed === true) {
      console.log('✅ "暱稱@#$%^&*()" 應該被允許');
      passed++;
    } else {
      console.log('❌ "暱稱@#$%^&*()" 應該被允許，但被拒絕了');
      failed++;
    }

    // Test 8: Text with "http" but not a URL
    console.log('\n📝 測試 8: 包含 "http" 但不是 URL');
    const test8 = checkUrlWhitelist('我喜歡 http 協議');
    if (test8.allowed === true) {
      console.log('✅ "我喜歡 http 協議" 應該被允許（不是完整 URL）');
      passed++;
    } else {
      console.log('❌ "我喜歡 http 協議" 應該被允許，但被拒絕了');
      failed++;
    }

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 測試總結\n');
    console.log(`✅ 通過：${passed}/8`);
    console.log(`❌ 失敗：${failed}/8`);
    console.log(`📈 成功率：${((passed / 8) * 100).toFixed(1)}%`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (failed === 0) {
      console.log('🎉 所有測試通過！');
      console.log('✅ URL 檢查邏輯正常工作');
      return true;
    } else {
      console.log(`⚠️ 有 ${failed} 個測試失敗`);
      return false;
    }
  } catch (error) {
    console.error('❌ 測試執行失敗：', error);
    return false;
  }
}

// Run tests
testEditNickname()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ 測試崩潰：', error);
    process.exit(1);
  });

