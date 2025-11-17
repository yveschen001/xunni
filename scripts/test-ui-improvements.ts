/**
 * Test UI Improvements
 * 
 * Verifies that all message cards include proper prompts:
 * - /reply prompt on replyable messages
 * - /menu prompt on secondary messages
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface TestResult {
  file: string;
  passed: boolean;
  issues: string[];
}

const results: TestResult[] = [];

function checkFile(filePath: string, checks: { pattern: RegExp; description: string }[]): void {
  const fullPath = join(process.cwd(), filePath);
  const content = readFileSync(fullPath, 'utf-8');
  
  const issues: string[] = [];
  
  for (const check of checks) {
    if (!check.pattern.test(content)) {
      issues.push(`Missing: ${check.description}`);
    }
  }
  
  results.push({
    file: filePath,
    passed: issues.length === 0,
    issues,
  });
}

console.log('🧪 Testing UI Improvements...\n');

// Test catch.ts - should have /reply and /menu prompts
checkFile('src/telegram/handlers/catch.ts', [
  { pattern: /直接按 \/reply 回覆訊息聊天/, description: '/reply prompt' },
  { pattern: /返回主選單：\/menu/, description: '/menu prompt' },
]);

// Test message_forward.ts - should have /reply and /menu prompts
checkFile('src/telegram/handlers/message_forward.ts', [
  { pattern: /直接按 \/reply 回覆訊息聊天/, description: '/reply prompt (receiver)' },
  { pattern: /返回主選單：\/menu/, description: '/menu prompt (receiver)' },
  { pattern: /直接按 \/reply 回覆訊息聊天/, description: '/reply prompt (sender)' },
  { pattern: /返回主選單：\/menu/, description: '/menu prompt (sender)' },
]);

// Test conversation_actions.ts - should have /reply and /menu prompts
checkFile('src/telegram/handlers/conversation_actions.ts', [
  { pattern: /直接按 \/reply 回覆訊息聊天/, description: '/reply prompt' },
  { pattern: /返回主選單：\/menu/, description: '/menu prompt' },
]);

// Test profile.ts - should have /menu prompt
checkFile('src/telegram/handlers/profile.ts', [
  { pattern: /返回主選單：\/menu/, description: '/menu prompt in profile' },
  { pattern: /返回主選單：\/menu/, description: '/menu prompt in profile_card' },
]);

// Test stats.ts - should have /menu prompt
checkFile('src/telegram/handlers/stats.ts', [
  { pattern: /返回主選單：\/menu/, description: '/menu prompt' },
]);

// Test vip.ts - should have /menu prompt
checkFile('src/telegram/handlers/vip.ts', [
  { pattern: /返回主選單：\/menu/, description: '/menu prompt (VIP)' },
  { pattern: /返回主選單：\/menu/, description: '/menu prompt (non-VIP)' },
]);

// Test menu.ts - should have invite button
checkFile('src/telegram/handlers/menu.ts', [
  { pattern: /🎁 邀請好友/, description: 'Invite button in menu' },
  { pattern: /menu_invite/, description: 'Invite callback handler' },
]);

// Print results
console.log('📊 Test Results:\n');

let allPassed = true;
for (const result of results) {
  const status = result.passed ? '✅' : '❌';
  console.log(`${status} ${result.file}`);
  
  if (!result.passed) {
    allPassed = false;
    for (const issue of result.issues) {
      console.log(`   - ${issue}`);
    }
  }
}

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('✅ All UI improvements tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed. Please review the issues above.');
  process.exit(1);
}

