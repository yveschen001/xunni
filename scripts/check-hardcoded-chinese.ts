/**
 * 檢查硬編碼中文字符串
 * 
 * 在開發新功能時，使用此腳本檢查是否有硬編碼的中文
 * 應該在提交代碼前運行
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface HardcodedIssue {
  file: string;
  line: number;
  text: string;
  context: string;
  severity: 'error' | 'warning';
}

const CHINESE_REGEX = /[\u4e00-\u9fa5]/;
const issues: HardcodedIssue[] = [];

// 跳過的文件和目錄
const SKIP_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '*.test.ts',
  '*.spec.ts',
  'i18n_complete_final.json',
  'i18n_keys_mapping.json',
  'i18n_replacement_status.json',
];

// 允許的硬編碼（技術標識符等）
const ALLOWED_PATTERNS = [
  /callback_data:\s*['"`][^'"`]*[\u4e00-\u9fa5]/,
  /['"`]lang_[^'"`]*['"`]/,
  /['"`]task_[^'"`]*['"`]/,
  /['"`]menu_[^'"`]*['"`]/,
  /['"`]gender_[^'"`]*['"`]/,
  /['"`]mbti_[^'"`]*['"`]/,
  /console\.(log|error|warn)/,
  /\/\/.*[\u4e00-\u9fa5]/,
  /\/\*.*[\u4e00-\u9fa5].*\*\//,
  /i18n\.t\(/,
  /createI18n\(/,
];

function shouldSkip(filePath: string): boolean {
  for (const pattern of SKIP_PATTERNS) {
    if (filePath.includes(pattern)) {
      return true;
    }
  }
  return false;
}

function isAllowed(text: string, line: string): boolean {
  // 檢查是否在註釋中
  if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
    return true;
  }
  
  // 檢查是否在 console.log 中
  if (line.includes('console.log') || line.includes('console.error')) {
    return true;
  }
  
  // 檢查是否已經使用 i18n.t()
  if (line.includes('i18n.t(')) {
    return true;
  }
  
  // 檢查是否匹配允許的模式
  for (const pattern of ALLOWED_PATTERNS) {
    if (pattern.test(line)) {
      return true;
    }
  }
  
  return false;
}

function checkFile(filePath: string): void {
  if (shouldSkip(filePath)) {
    return;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      
      // 檢查是否包含中文
      if (CHINESE_REGEX.test(line)) {
        // 提取中文字符串
        const chineseMatches = line.match(/['"`]([^'"`]*[\u4e00-\u9fa5]+[^'"`]*)['"`]/g);
        
        if (chineseMatches) {
          for (const match of chineseMatches) {
            const text = match.replace(/['"`]/g, '');
            
            // 檢查是否允許
            if (!isAllowed(text, line)) {
              issues.push({
                file: filePath,
                line: lineNumber,
                text: text.substring(0, 50),
                context: line.trim().substring(0, 100),
                severity: 'error',
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(`❌ 無法讀取文件: ${filePath}`, error);
  }
}

async function main() {
  console.log('🔍 檢查硬編碼中文字符串...\n');
  
  // 掃描所有 TypeScript 文件
  const files = await glob('src/**/*.ts', {
    ignore: ['**/*.test.ts', '**/*.spec.ts', 'node_modules/**'],
  });
  
  console.log(`📂 掃描 ${files.length} 個文件...\n`);
  
  for (const file of files) {
    checkFile(file);
  }
  
  // 輸出結果
  if (issues.length === 0) {
    console.log('✅ 沒有發現硬編碼的中文字符串！\n');
    process.exit(0);
  } else {
    console.log(`❌ 發現 ${issues.length} 處硬編碼中文字符串：\n`);
    
    // 按文件分組
    const byFile = new Map<string, HardcodedIssue[]>();
    for (const issue of issues) {
      if (!byFile.has(issue.file)) {
        byFile.set(issue.file, []);
      }
      byFile.get(issue.file)!.push(issue);
    }
    
    // 輸出每個文件的問題
    for (const [file, fileIssues] of byFile.entries()) {
      console.log(`📄 ${file}:`);
      for (const issue of fileIssues) {
        console.log(`   ${issue.line}: ${issue.text}...`);
        console.log(`   上下文: ${issue.context}`);
      }
      console.log('');
    }
    
    console.log('💡 修復建議：');
    console.log('   1. 將硬編碼的中文替換為 `i18n.t(\'key\')`');
    console.log('   2. 在 `src/i18n/locales/zh-TW.ts` 中添加翻譯');
    console.log('   3. 在 `src/i18n/types.ts` 中添加類型定義');
    console.log('   4. 確保已初始化 i18n: `const i18n = createI18n(user.language_pref || \'zh-TW\')`\n');
    
    console.log('📚 參考文檔：');
    console.log('   - @doc/I18N_GUIDE.md - i18n 使用指南');
    console.log('   - @doc/I18N_EXTRACTION_AND_REPLACEMENT_STANDARDS.md - i18n 規範\n');
    
    process.exit(1);
  }
}

main().catch(console.error);

