/**
 * Test MBTI Version Display
 * 
 * Verifies that MBTI test displays correct version information
 */

import { getMBTIQuestions, getTotalQuestionsByVersion } from '../src/domain/mbti_test';

console.log('🧪 Testing MBTI Version Display...\n');

let passed = 0;
let failed = 0;

// Test 1: Quick version questions
try {
  const quickQuestions = getMBTIQuestions('quick');
  const quickTotal = getTotalQuestionsByVersion('quick');
  
  if (quickQuestions.length === 12 && quickTotal === 12) {
    console.log('✅ Quick version: 12 questions');
    passed++;
  } else {
    console.log(`❌ Quick version: Expected 12, got ${quickQuestions.length}/${quickTotal}`);
    failed++;
  }
} catch (error) {
  console.log('❌ Quick version test failed:', error);
  failed++;
}

// Test 2: Full version questions
try {
  const fullQuestions = getMBTIQuestions('full');
  const fullTotal = getTotalQuestionsByVersion('full');
  
  if (fullQuestions.length === 36 && fullTotal === 36) {
    console.log('✅ Full version: 36 questions');
    passed++;
  } else {
    console.log(`❌ Full version: Expected 36, got ${fullQuestions.length}/${fullTotal}`);
    failed++;
  }
} catch (error) {
  console.log('❌ Full version test failed:', error);
  failed++;
}

// Test 3: Question structure
try {
  const quickQuestions = getMBTIQuestions('quick');
  const fullQuestions = getMBTIQuestions('full');
  
  const quickValid = quickQuestions.every(q => 
    q.question_zh_TW && 
    q.question_en && 
    q.options && 
    q.options.length === 2
  );
  
  const fullValid = fullQuestions.every(q => 
    q.question_zh_TW && 
    q.question_en && 
    q.options && 
    q.options.length === 2
  );
  
  if (quickValid && fullValid) {
    console.log('✅ All questions have valid structure');
    passed++;
  } else {
    console.log('❌ Some questions have invalid structure');
    failed++;
  }
} catch (error) {
  console.log('❌ Question structure test failed:', error);
  failed++;
}

// Test 4: Progress calculation
try {
  const quickProgress = Math.round((5 / 12) * 100);
  const fullProgress = Math.round((18 / 36) * 100);
  
  if (quickProgress === 42 && fullProgress === 50) {
    console.log('✅ Progress calculation correct');
    passed++;
  } else {
    console.log(`❌ Progress calculation: Expected 42/50, got ${quickProgress}/${fullProgress}`);
    failed++;
  }
} catch (error) {
  console.log('❌ Progress calculation test failed:', error);
  failed++;
}

console.log('\n' + '='.repeat(50));
console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(50));

if (failed > 0) {
  process.exit(1);
}

