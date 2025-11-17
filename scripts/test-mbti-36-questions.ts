/**
 * Test MBTI 36-Question Version
 * 
 * Validates the 36-question MBTI test implementation
 */

async function testMBTI36Questions() {
  console.log('🧪 測試 MBTI 36 題版本...\n');

  let passed = 0;
  let failed = 0;

  try {
    // Import MBTI functions
    const {
      MBTI_QUESTIONS_FULL,
      getMBTIQuestions,
      getTotalQuestionsByVersion,
      calculateMBTIResult,
    } = await import('../src/domain/mbti_test');

    // Test 1: Full version should have 36 questions
    console.log('📝 測試 1: 完整版本題目數量');
    if (MBTI_QUESTIONS_FULL.length === 36) {
      console.log(`✅ 完整版本有 36 題`);
      passed++;
    } else {
      console.log(`❌ 完整版本題目數量錯誤：${MBTI_QUESTIONS_FULL.length}`);
      failed++;
    }

    // Test 2: getMBTIQuestions('full') should return full version
    console.log('\n📝 測試 2: getMBTIQuestions("full")');
    const fullQuestions = getMBTIQuestions('full');
    if (fullQuestions === MBTI_QUESTIONS_FULL) {
      console.log(`✅ getMBTIQuestions('full') 返回完整版本`);
      passed++;
    } else {
      console.log(`❌ getMBTIQuestions('full') 返回錯誤`);
      failed++;
    }

    // Test 3: getTotalQuestionsByVersion('full') should return 36
    console.log('\n📝 測試 3: getTotalQuestionsByVersion("full")');
    const fullTotal = getTotalQuestionsByVersion('full');
    if (fullTotal === 36) {
      console.log(`✅ getTotalQuestionsByVersion('full') 返回 36`);
      passed++;
    } else {
      console.log(`❌ getTotalQuestionsByVersion('full') 返回錯誤：${fullTotal}`);
      failed++;
    }

    // Test 4: Dimension distribution (9 questions per dimension)
    console.log('\n📝 測試 4: 維度分布（每個維度 9 題）');
    const dimensionCounts = { EI: 0, SN: 0, TF: 0, JP: 0 };
    MBTI_QUESTIONS_FULL.forEach(q => {
      dimensionCounts[q.dimension]++;
    });
    if (
      dimensionCounts.EI === 9 &&
      dimensionCounts.SN === 9 &&
      dimensionCounts.TF === 9 &&
      dimensionCounts.JP === 9
    ) {
      console.log(`✅ 每個維度都有 9 題`);
      console.log(`   EI: ${dimensionCounts.EI}, SN: ${dimensionCounts.SN}, TF: ${dimensionCounts.TF}, JP: ${dimensionCounts.JP}`);
      passed++;
    } else {
      console.log(`❌ 維度分布錯誤：`, dimensionCounts);
      failed++;
    }

    // Test 5: All questions have correct structure
    console.log('\n📝 測試 5: 題目結構完整性');
    let structureValid = true;
    for (let i = 0; i < 36; i++) {
      const q = MBTI_QUESTIONS_FULL[i];
      if (!q || !q.dimension || !q.question_zh_TW || !q.question_en || !q.options || q.options.length !== 2) {
        structureValid = false;
        console.log(`❌ 題目 ${i + 1} 結構錯誤`);
        break;
      }
      // Check options structure
      for (const opt of q.options) {
        if (!opt.text_zh_TW || !opt.text_en || typeof opt.score !== 'number') {
          structureValid = false;
          console.log(`❌ 題目 ${i + 1} 選項結構錯誤`);
          break;
        }
      }
      if (!structureValid) break;
    }
    if (structureValid) {
      console.log(`✅ 所有 36 題結構完整`);
      passed++;
    } else {
      failed++;
    }

    // Test 6: Question IDs are sequential (1-36)
    console.log('\n📝 測試 6: 題目 ID 連續性');
    let idsValid = true;
    for (let i = 0; i < 36; i++) {
      if (MBTI_QUESTIONS_FULL[i].id !== i + 1) {
        idsValid = false;
        console.log(`❌ 題目 ${i + 1} 的 ID 錯誤：${MBTI_QUESTIONS_FULL[i].id}`);
        break;
      }
    }
    if (idsValid) {
      console.log(`✅ 題目 ID 從 1 到 36 連續`);
      passed++;
    } else {
      failed++;
    }

    // Test 7: calculateMBTIResult should work with 36 answers
    console.log('\n📝 測試 7: calculateMBTIResult 函數（36 題）');
    try {
      // Simulate 36 answers (all option 0)
      const answers = Array(36).fill(0);
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

    // Test 8: All questions have both Chinese and English text
    console.log('\n📝 測試 8: 中英文內容完整性');
    let i18nValid = true;
    for (let i = 0; i < 36; i++) {
      const q = MBTI_QUESTIONS_FULL[i];
      if (!q.question_zh_TW || !q.question_en) {
        i18nValid = false;
        console.log(`❌ 題目 ${i + 1} 缺少中英文問題`);
        break;
      }
      for (const opt of q.options) {
        if (!opt.text_zh_TW || !opt.text_en) {
          i18nValid = false;
          console.log(`❌ 題目 ${i + 1} 選項缺少中英文`);
          break;
        }
      }
      if (!i18nValid) break;
    }
    if (i18nValid) {
      console.log(`✅ 所有題目和選項都有中英文`);
      passed++;
    } else {
      failed++;
    }

    // Test 9: Score values are valid (+2 or -2)
    console.log('\n📝 測試 9: 分數值有效性');
    let scoresValid = true;
    for (let i = 0; i < 36; i++) {
      const q = MBTI_QUESTIONS_FULL[i];
      for (const opt of q.options) {
        if (opt.score !== 2 && opt.score !== -2) {
          scoresValid = false;
          console.log(`❌ 題目 ${i + 1} 選項分數無效：${opt.score}`);
          break;
        }
      }
      if (!scoresValid) break;
    }
    if (scoresValid) {
      console.log(`✅ 所有選項分數都是 +2 或 -2`);
      passed++;
    } else {
      failed++;
    }

    // Test 10: Each question has exactly 2 options
    console.log('\n📝 測試 10: 每題選項數量');
    let optionsValid = true;
    for (let i = 0; i < 36; i++) {
      if (MBTI_QUESTIONS_FULL[i].options.length !== 2) {
        optionsValid = false;
        console.log(`❌ 題目 ${i + 1} 選項數量錯誤：${MBTI_QUESTIONS_FULL[i].options.length}`);
        break;
      }
    }
    if (optionsValid) {
      console.log(`✅ 所有題目都有 2 個選項`);
      passed++;
    } else {
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
      console.log('🎉 36 題版本測試全部通過！');
      console.log('✅ 題庫準備完成，可以進入下一階段');
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
testMBTI36Questions()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ 測試崩潰：', error);
    process.exit(1);
  });

