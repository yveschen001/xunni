/**
 * Test MBTI Backward Compatibility
 * 
 * Ensures that the refactoring to support 36-question version
 * does not break the existing 12-question onboarding flow.
 */

async function testMBTIBackwardCompatibility() {
  console.log('🧪 測試 MBTI 向後兼容性...\n');

  let passed = 0;
  let failed = 0;

  try {
    // Import MBTI functions
    const {
      MBTI_QUESTIONS,
      MBTI_QUESTIONS_QUICK,
      MBTI_QUESTIONS_FULL,
      getMBTIQuestions,
      getTotalQuestions,
      getTotalQuestionsByVersion,
      calculateMBTIResult,
      getQuestion,
    } = await import('../src/domain/mbti_test');

    // Test 1: MBTI_QUESTIONS should equal MBTI_QUESTIONS_QUICK
    console.log('📝 測試 1: MBTI_QUESTIONS 向後兼容性');
    if (MBTI_QUESTIONS === MBTI_QUESTIONS_QUICK) {
      console.log('✅ MBTI_QUESTIONS 正確指向 MBTI_QUESTIONS_QUICK');
      passed++;
    } else {
      console.log('❌ MBTI_QUESTIONS 未正確指向 MBTI_QUESTIONS_QUICK');
      failed++;
    }

    // Test 2: Quick version should have 12 questions
    console.log('\n📝 測試 2: 快速版本題目數量');
    if (MBTI_QUESTIONS_QUICK.length === 12) {
      console.log(`✅ 快速版本有 12 題`);
      passed++;
    } else {
      console.log(`❌ 快速版本題目數量錯誤：${MBTI_QUESTIONS_QUICK.length}`);
      failed++;
    }

    // Test 3: Default MBTI_QUESTIONS should have 12 questions
    console.log('\n📝 測試 3: 默認版本題目數量');
    if (MBTI_QUESTIONS.length === 12) {
      console.log(`✅ 默認版本有 12 題`);
      passed++;
    } else {
      console.log(`❌ 默認版本題目數量錯誤：${MBTI_QUESTIONS.length}`);
      failed++;
    }

    // Test 4: getTotalQuestions() should return 12
    console.log('\n📝 測試 4: getTotalQuestions() 函數');
    const totalQuestions = getTotalQuestions();
    if (totalQuestions === 12) {
      console.log(`✅ getTotalQuestions() 返回 12`);
      passed++;
    } else {
      console.log(`❌ getTotalQuestions() 返回錯誤：${totalQuestions}`);
      failed++;
    }

    // Test 5: getMBTIQuestions() default should return quick version
    console.log('\n📝 測試 5: getMBTIQuestions() 默認版本');
    const defaultQuestions = getMBTIQuestions();
    if (defaultQuestions === MBTI_QUESTIONS_QUICK) {
      console.log(`✅ getMBTIQuestions() 默認返回快速版本`);
      passed++;
    } else {
      console.log(`❌ getMBTIQuestions() 默認版本錯誤`);
      failed++;
    }

    // Test 6: getMBTIQuestions('quick') should return quick version
    console.log('\n📝 測試 6: getMBTIQuestions("quick")');
    const quickQuestions = getMBTIQuestions('quick');
    if (quickQuestions === MBTI_QUESTIONS_QUICK) {
      console.log(`✅ getMBTIQuestions('quick') 返回快速版本`);
      passed++;
    } else {
      console.log(`❌ getMBTIQuestions('quick') 返回錯誤`);
      failed++;
    }

    // Test 7: getTotalQuestionsByVersion('quick') should return 12
    console.log('\n📝 測試 7: getTotalQuestionsByVersion("quick")');
    const quickTotal = getTotalQuestionsByVersion('quick');
    if (quickTotal === 12) {
      console.log(`✅ getTotalQuestionsByVersion('quick') 返回 12`);
      passed++;
    } else {
      console.log(`❌ getTotalQuestionsByVersion('quick') 返回錯誤：${quickTotal}`);
      failed++;
    }

    // Test 8: All 12 questions should have correct structure
    console.log('\n📝 測試 8: 題目結構完整性');
    let structureValid = true;
    for (let i = 0; i < 12; i++) {
      const q = getQuestion(i);
      if (!q || !q.dimension || !q.question_zh_TW || !q.options || q.options.length !== 2) {
        structureValid = false;
        console.log(`❌ 題目 ${i + 1} 結構錯誤`);
        break;
      }
    }
    if (structureValid) {
      console.log(`✅ 所有 12 題結構完整`);
      passed++;
    } else {
      failed++;
    }

    // Test 9: calculateMBTIResult should work with 12 answers
    console.log('\n📝 測試 9: calculateMBTIResult 函數');
    try {
      // Simulate 12 answers (all option 0)
      const answers = Array(12).fill(0);
      const result = calculateMBTIResult(answers);
      if (result && result.type && result.dimensions) {
        console.log(`✅ calculateMBTIResult 正常工作，結果：${result.type}`);
        passed++;
      } else {
        console.log(`❌ calculateMBTIResult 返回結果不完整`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ calculateMBTIResult 拋出錯誤：${error}`);
      failed++;
    }

    // Test 10: Dimension distribution (3 questions per dimension)
    console.log('\n📝 測試 10: 維度分布（每個維度 3 題）');
    const dimensionCounts = { EI: 0, SN: 0, TF: 0, JP: 0 };
    MBTI_QUESTIONS_QUICK.forEach(q => {
      dimensionCounts[q.dimension]++;
    });
    if (
      dimensionCounts.EI === 3 &&
      dimensionCounts.SN === 3 &&
      dimensionCounts.TF === 3 &&
      dimensionCounts.JP === 3
    ) {
      console.log(`✅ 每個維度都有 3 題`);
      passed++;
    } else {
      console.log(`❌ 維度分布錯誤：`, dimensionCounts);
      failed++;
    }

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 測試總結\n');
    console.log(`✅ 通過：${passed}/10`);
    console.log(`❌ 失敗：${failed}/10`);
    console.log(`📈 成功率：${((passed / 10) * 100).toFixed(1)}%`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (failed === 0) {
      console.log('🎉 所有向後兼容性測試通過！');
      console.log('✅ 現有註冊流程不會受到影響');
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
testMBTIBackwardCompatibility()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ 測試崩潰：', error);
    process.exit(1);
  });

