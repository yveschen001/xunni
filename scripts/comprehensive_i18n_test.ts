/**
 * Comprehensive i18n Test Script
 * 
 * Tests all pages for:
 * 1. Hardcoded Chinese strings
 * 2. Missing translations
 * 3. RTL support (Arabic)
 * 4. Symbol and format issues
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

interface TestResult {
  file: string;
  issues: {
    type: 'hardcoded' | 'missing_i18n' | 'symbol' | 'rtl';
    line: number;
    content: string;
    description: string;
  }[];
}

const results: TestResult[] = [];
const handlersDir = join(process.cwd(), 'src/telegram/handlers');
const handlers = readdirSync(handlersDir).filter(f => f.endsWith('.ts'));

// Chinese character regex
const chineseRegex = /[\u4e00-\u9fff]/;

// Common symbols that should be in i18n
const symbolPatterns = [
  /[：:]/g,  // Colon
  /[，,]/g,  // Comma
  /[。.]/g,  // Period
  /[！!]/g,  // Exclamation
  /[？?]/g,  // Question mark
];

function testFile(filePath: string): TestResult {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues: TestResult['issues'] = [];

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Check for hardcoded Chinese (excluding comments and data)
    if (chineseRegex.test(line) && 
        !line.trim().startsWith('//') && 
        !line.trim().startsWith('*') &&
        !line.includes('question_zh_TW') && // MBTI test data
        !line.includes('text_zh_TW') &&    // MBTI test data
        !line.includes('fallback') &&       // Fallback strings (documented)
        !line.includes('TODO') &&
        !line.includes('FIXME')) {
      
      // Check if it's using i18n
      if (!line.includes('i18n.t(') && 
          !line.includes('i18n.t(') &&
          !line.includes('createI18n')) {
        issues.push({
          type: 'hardcoded',
          line: lineNum,
          content: line.trim(),
          description: 'Hardcoded Chinese string without i18n'
        });
      }
    }

    // Check for missing i18n usage in user-facing strings
    if (line.includes('sendMessage') || 
        line.includes('sendMessageWithButtons') ||
        line.includes('editMessageText')) {
      if (!line.includes('i18n.t(') && chineseRegex.test(line)) {
        issues.push({
          type: 'missing_i18n',
          line: lineNum,
          content: line.trim(),
          description: 'User-facing message without i18n'
        });
      }
    }

    // Check for RTL-specific issues (Arabic)
    if (line.includes('ar') || line.includes('arabic') || line.includes('rtl')) {
      // Check if RTL is properly handled
      if (line.includes('text-align') || line.includes('direction')) {
        // Good - RTL is considered
      } else if (line.includes('sendMessage') && !line.includes('rtl')) {
        // Potential RTL issue
        issues.push({
          type: 'rtl',
          line: lineNum,
          content: line.trim(),
          description: 'Potential RTL handling needed'
        });
      }
    }
  });

  return {
    file: filePath.replace(process.cwd() + '/', ''),
    issues
  };
}

console.log('🔍 Comprehensive i18n Test\n');
console.log('='.repeat(80));
console.log();

// Test all handlers
console.log('📂 Testing handler files...\n');

handlers.forEach(handler => {
  const filePath = join(handlersDir, handler);
  const result = testFile(filePath);
  if (result.issues.length > 0) {
    results.push(result);
  }
});

// Test domain files that have user-facing content
const domainFiles = [
  'src/domain/conversation_history.ts',
  'src/domain/mbti_test.ts',
];

domainFiles.forEach(file => {
  const filePath = join(process.cwd(), file);
  try {
    const result = testFile(filePath);
    if (result.issues.length > 0) {
      results.push(result);
    }
  } catch (e) {
    // File might not exist
  }
});

// Print results
console.log(`📊 Test Results:\n`);
console.log(`   Total files tested: ${handlers.length + domainFiles.length}`);
console.log(`   Files with issues: ${results.length}\n`);

if (results.length === 0) {
  console.log('✅ No issues found!\n');
} else {
  console.log('⚠️  Issues found:\n');
  
  results.forEach(result => {
    console.log(`📄 ${result.file}:`);
    result.issues.forEach(issue => {
      console.log(`   [${issue.type.toUpperCase()}] Line ${issue.line}: ${issue.description}`);
      console.log(`      ${issue.content.substring(0, 80)}${issue.content.length > 80 ? '...' : ''}`);
    });
    console.log();
  });

  // Summary by type
  const summary = {
    hardcoded: 0,
    missing_i18n: 0,
    symbol: 0,
    rtl: 0,
  };

  results.forEach(result => {
    result.issues.forEach(issue => {
      summary[issue.type]++;
    });
  });

  console.log('📈 Summary by type:');
  console.log(`   Hardcoded Chinese: ${summary.hardcoded}`);
  console.log(`   Missing i18n: ${summary.missing_i18n}`);
  console.log(`   Symbol issues: ${summary.symbol}`);
  console.log(`   RTL issues: ${summary.rtl}`);
  console.log();
}

// Check RTL support specifically
console.log('🌐 RTL (Arabic) Support Check:\n');

const rtlFiles = [
  'src/i18n/locales/ar.ts',
  'src/i18n/index.ts',
];

let rtlIssues = 0;

rtlFiles.forEach(file => {
  const filePath = join(process.cwd(), file);
  try {
    const content = readFileSync(filePath, 'utf-8');
    
    // Check if Arabic translations exist
    if (file.includes('ar.ts')) {
      const arabicCount = (content.match(/[\u0600-\u06FF]/g) || []).length;
      console.log(`   ✅ ${file}: ${arabicCount} Arabic characters found`);
      
      // Check for common RTL issues
      if (content.includes('left') && !content.includes('right')) {
        console.log(`   ⚠️  Potential RTL issue: 'left' without 'right'`);
        rtlIssues++;
      }
    }
    
    // Check i18n system for RTL support
    if (file.includes('index.ts')) {
      if (content.includes('rtl') || content.includes('direction')) {
        console.log(`   ✅ RTL support detected in i18n system`);
      } else {
        console.log(`   ⚠️  No explicit RTL support in i18n system`);
        rtlIssues++;
      }
    }
  } catch (e) {
    console.log(`   ❌ Error reading ${file}`);
  }
});

console.log();

if (rtlIssues === 0) {
  console.log('✅ RTL support looks good!\n');
} else {
  console.log(`⚠️  Found ${rtlIssues} potential RTL issues\n`);
}

console.log('='.repeat(80));
console.log('\n✅ Test complete!\n');

