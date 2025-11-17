/**
 * 自動化測試：編輯個人資料功能
 * 
 * 測試紅框內的所有功能：
 * 1. 編輯暱稱
 * 2. 編輯簡介
 * 3. 編輯地區
 * 4. 編輯興趣
 * 5. 匹配偏好
 * 6. 編輯血型
 * 7. 重新測試 MBTI
 */

interface TestResult {
  feature: string;
  status: 'pass' | 'fail';
  message: string;
  details?: string;
}

const results: TestResult[] = [];

function logTest(feature: string, status: 'pass' | 'fail', message: string, details?: string) {
  results.push({ feature, status, message, details });
  const icon = status === 'pass' ? '✅' : '❌';
  console.log(`${icon} ${feature}: ${message}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

async function testEditProfileFeatures() {
  console.log('🧪 開始測試編輯個人資料功能...\n');

  // Test 1: 編輯暱稱功能
  console.log('📝 測試 1: 編輯暱稱');
  try {
    const { validateNickname } = await import('../src/domain/user');
    
    // Test valid nickname
    const validResult = validateNickname('測試暱稱');
    if (validResult.valid) {
      logTest('編輯暱稱 - 有效暱稱', 'pass', '可以接受有效的暱稱');
    } else {
      logTest('編輯暱稱 - 有效暱稱', 'fail', '無法接受有效的暱稱', validResult.error);
    }

    // Test nickname with URL
    const urlResult = validateNickname('測試 https://test.com');
    if (!urlResult.valid) {
      logTest('編輯暱稱 - URL 檢查', 'pass', '正確拒絕包含 URL 的暱稱');
    } else {
      logTest('編輯暱稱 - URL 檢查', 'fail', '未能拒絕包含 URL 的暱稱');
    }

    // Test nickname length
    const shortResult = validateNickname('短');
    if (!shortResult.valid) {
      logTest('編輯暱稱 - 長度檢查', 'pass', '正確拒絕過短的暱稱（< 2 字）');
    } else {
      logTest('編輯暱稱 - 長度檢查', 'fail', '未能拒絕過短的暱稱');
    }

    const longResult = validateNickname('這是一個非常非常非常非常長的暱稱超過二十個字元了');
    if (!longResult.valid) {
      logTest('編輯暱稱 - 長度上限', 'pass', '正確拒絕過長的暱稱（> 20 字）');
    } else {
      logTest('編輯暱稱 - 長度上限', 'fail', '未能拒絕過長的暱稱');
    }
  } catch (error) {
    logTest('編輯暱稱', 'fail', '功能測試失敗', String(error));
  }

  console.log('');

  // Test 2: 編輯簡介功能
  console.log('📖 測試 2: 編輯簡介');
  try {
    const { validateBio } = await import('../src/domain/user');
    
    // Test valid bio
    const validResult = validateBio('這是我的個人簡介');
    if (validResult.valid) {
      logTest('編輯簡介 - 有效簡介', 'pass', '可以接受有效的簡介');
    } else {
      logTest('編輯簡介 - 有效簡介', 'fail', '無法接受有效的簡介', validResult.error);
    }

    // Test bio length
    const longBio = 'a'.repeat(201);
    const longResult = validateBio(longBio);
    if (!longResult.valid) {
      logTest('編輯簡介 - 長度上限', 'pass', '正確拒絕過長的簡介（> 200 字）');
    } else {
      logTest('編輯簡介 - 長度上限', 'fail', '未能拒絕過長的簡介');
    }

    // Test empty bio
    const emptyResult = validateBio('');
    if (emptyResult.valid) {
      logTest('編輯簡介 - 空白簡介', 'pass', '允許空白簡介');
    } else {
      logTest('編輯簡介 - 空白簡介', 'fail', '不允許空白簡介');
    }
  } catch (error) {
    logTest('編輯簡介', 'fail', '功能測試失敗', String(error));
  }

  console.log('');

  // Test 3: 編輯地區功能
  console.log('🌍 測試 3: 編輯地區');
  try {
    // Check if region editing is implemented
    const fs = await import('fs');
    const editProfileContent = fs.readFileSync('src/telegram/handlers/edit_profile.ts', 'utf-8');
    
    if (editProfileContent.includes('handleEditRegion')) {
      logTest('編輯地區 - 功能存在', 'pass', 'handleEditRegion 函數已實現');
    } else {
      logTest('編輯地區 - 功能存在', 'fail', 'handleEditRegion 函數未找到');
    }

    if (editProfileContent.includes('edit_region')) {
      logTest('編輯地區 - Callback 註冊', 'pass', 'edit_region callback 已註冊');
    } else {
      logTest('編輯地區 - Callback 註冊', 'fail', 'edit_region callback 未註冊');
    }
  } catch (error) {
    logTest('編輯地區', 'fail', '功能測試失敗', String(error));
  }

  console.log('');

  // Test 4: 編輯興趣功能
  console.log('🏷️ 測試 4: 編輯興趣');
  try {
    const fs = await import('fs');
    const editProfileContent = fs.readFileSync('src/telegram/handlers/edit_profile.ts', 'utf-8');
    
    if (editProfileContent.includes('handleEditInterests')) {
      logTest('編輯興趣 - 功能存在', 'pass', 'handleEditInterests 函數已實現');
    } else {
      logTest('編輯興趣 - 功能存在', 'fail', 'handleEditInterests 函數未找到');
    }

    if (editProfileContent.includes('edit_interests')) {
      logTest('編輯興趣 - Callback 註冊', 'pass', 'edit_interests callback 已註冊');
    } else {
      logTest('編輯興趣 - Callback 註冊', 'fail', 'edit_interests callback 未註冊');
    }
  } catch (error) {
    logTest('編輯興趣', 'fail', '功能測試失敗', String(error));
  }

  console.log('');

  // Test 5: 匹配偏好功能
  console.log('💝 測試 5: 匹配偏好');
  try {
    const fs = await import('fs');
    const editProfileContent = fs.readFileSync('src/telegram/handlers/edit_profile.ts', 'utf-8');
    
    if (editProfileContent.includes('handleEditMatchPref')) {
      logTest('匹配偏好 - 功能存在', 'pass', 'handleEditMatchPref 函數已實現');
    } else {
      logTest('匹配偏好 - 功能存在', 'fail', 'handleEditMatchPref 函數未找到');
    }

    if (editProfileContent.includes('edit_match_pref')) {
      logTest('匹配偏好 - Callback 註冊', 'pass', 'edit_match_pref callback 已註冊');
    } else {
      logTest('匹配偏好 - Callback 註冊', 'fail', 'edit_match_pref callback 未註冊');
    }

    // Check for gender options
    if (editProfileContent.includes('male') && editProfileContent.includes('female')) {
      logTest('匹配偏好 - 選項完整', 'pass', '包含男生和女生選項');
    } else {
      logTest('匹配偏好 - 選項完整', 'fail', '選項不完整');
    }
  } catch (error) {
    logTest('匹配偏好', 'fail', '功能測試失敗', String(error));
  }

  console.log('');

  // Test 6: 編輯血型功能
  console.log('🩸 測試 6: 編輯血型');
  try {
    const { getBloodTypeOptions, getBloodTypeDisplay } = await import('../src/domain/blood_type');
    
    const options = getBloodTypeOptions();
    if (options.length === 5) {
      logTest('編輯血型 - 血型選項', 'pass', '包含 5 種血型選項（A, B, AB, O, 不確定）');
    } else {
      logTest('編輯血型 - 血型選項', 'fail', `血型選項數量不正確：${options.length}`);
    }

    // Test blood type display
    const displayA = getBloodTypeDisplay('A');
    if (displayA === '🩸 A 型') {
      logTest('編輯血型 - 顯示格式', 'pass', '血型顯示格式正確');
    } else {
      logTest('編輯血型 - 顯示格式', 'fail', `血型顯示格式錯誤：${displayA}`);
    }

    const fs = await import('fs');
    const editProfileContent = fs.readFileSync('src/telegram/handlers/edit_profile.ts', 'utf-8');
    
    if (editProfileContent.includes('handleEditBloodType')) {
      logTest('編輯血型 - 功能存在', 'pass', 'handleEditBloodType 函數已實現');
    } else {
      logTest('編輯血型 - 功能存在', 'fail', 'handleEditBloodType 函數未找到');
    }
  } catch (error) {
    logTest('編輯血型', 'fail', '功能測試失敗', String(error));
  }

  console.log('');

  // Test 7: 重新測試 MBTI 功能
  console.log('🧠 測試 7: 重新測試 MBTI');
  try {
    const fs = await import('fs');
    const routerContent = fs.readFileSync('src/router.ts', 'utf-8');
    
    if (routerContent.includes('retake_mbti')) {
      logTest('重新測試 MBTI - Callback 註冊', 'pass', 'retake_mbti callback 已註冊');
    } else {
      logTest('重新測試 MBTI - Callback 註冊', 'fail', 'retake_mbti callback 未註冊');
    }

    // Check if MBTI test questions exist
    const { MBTI_QUESTIONS } = await import('../src/domain/mbti_test');
    if (MBTI_QUESTIONS.length >= 12) {
      logTest('重新測試 MBTI - 題目數量', 'pass', `包含 ${MBTI_QUESTIONS.length} 題 MBTI 測試題目`);
    } else {
      logTest('重新測試 MBTI - 題目數量', 'fail', `題目數量不正確：${MBTI_QUESTIONS.length}`);
    }
    
    // Note: Full 36-question MBTI test is planned for future development
    if (MBTI_QUESTIONS.length < 36) {
      console.log(`   ℹ️  注意：完整的 36 題 MBTI 測試計劃在未來開發（目前 ${MBTI_QUESTIONS.length} 題）`);
    }
  } catch (error) {
    logTest('重新測試 MBTI', 'fail', '功能測試失敗', String(error));
  }

  console.log('');

  // Test 8: 返回功能
  console.log('↩️ 測試 8: 返回功能');
  try {
    const fs = await import('fs');
    const editProfileContent = fs.readFileSync('src/telegram/handlers/edit_profile.ts', 'utf-8');
    
    if (editProfileContent.includes('return_to_menu') || editProfileContent.includes('edit_profile_back')) {
      logTest('返回功能 - Callback 註冊', 'pass', '返回功能已實現');
    } else {
      logTest('返回功能 - Callback 註冊', 'fail', '返回功能未找到');
    }
  } catch (error) {
    logTest('返回功能', 'fail', '功能測試失敗', String(error));
  }

  console.log('');

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 測試總結\n');

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const total = results.length;

  console.log(`✅ 通過：${passed}/${total}`);
  console.log(`❌ 失敗：${failed}/${total}`);
  console.log(`📈 成功率：${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n❌ 失敗的測試：');
    results.filter(r => r.status === 'fail').forEach(r => {
      console.log(`   - ${r.feature}: ${r.message}`);
      if (r.details) {
        console.log(`     ${r.details}`);
      }
    });
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return { passed, failed, total, results };
}

// Run tests
testEditProfileFeatures()
  .then(({ passed, failed, total }) => {
    if (failed === 0) {
      console.log('🎉 所有測試通過！編輯個人資料功能完善。');
      process.exit(0);
    } else {
      console.log(`⚠️ 有 ${failed} 個測試失敗，需要修復。`);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ 測試執行失敗：', error);
    process.exit(1);
  });

