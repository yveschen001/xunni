/**
 * Quick test for extractInviteCode function
 */

import { extractInviteCode, validateInviteCode } from '../src/domain/invite';

console.log('\n🧪 測試 extractInviteCode 函數\n');
console.log('='.repeat(80));

const testCases = [
  {
    input: '/start invite_XUNNI-KX6TXS',
    expectedCode: 'XUNNI-KX6TXS',
    shouldBeValid: true,
  },
  {
    input: '/start invite_XUNNI-ABC12345',
    expectedCode: 'XUNNI-ABC12345',
    shouldBeValid: true,
  },
  {
    input: '/start',
    expectedCode: null,
    shouldBeValid: false,
  },
  {
    input: '/start hello',
    expectedCode: null,
    shouldBeValid: false,
  },
];

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  console.log(`\n測試 ${index + 1}: "${testCase.input}"`);
  
  const extractedCode = extractInviteCode(testCase.input);
  console.log(`  提取結果: ${extractedCode === null ? 'null' : `"${extractedCode}"`}`);
  console.log(`  預期結果: ${testCase.expectedCode === null ? 'null' : `"${testCase.expectedCode}"`}`);
  
  if (extractedCode === testCase.expectedCode) {
    console.log('  ✅ 提取正確');
    passed++;
  } else {
    console.log('  ❌ 提取錯誤');
    failed++;
  }
  
  if (extractedCode !== null) {
    const isValid = validateInviteCode(extractedCode);
    console.log(`  驗證結果: ${isValid ? '有效' : '無效'}`);
    console.log(`  預期驗證: ${testCase.shouldBeValid ? '有效' : '無效'}`);
    
    if (isValid === testCase.shouldBeValid) {
      console.log('  ✅ 驗證正確');
    } else {
      console.log('  ❌ 驗證錯誤');
      failed++;
    }
  }
});

console.log('\n' + '='.repeat(80));
console.log(`\n📊 測試結果: ${passed} 通過, ${failed} 失敗\n`);

if (failed > 0) {
  process.exit(1);
}

