/**
 * 檢查硬編碼中文字符串
 * 
 * 在開發新功能時，使用此腳本檢查是否有硬編碼的中文
 * 應該在提交代碼前運行
 */

import * as fs from 'fs';
import * as path from 'path';
import { readdirSync, statSync } from 'fs';

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
  'src/i18n/locales', // 排除所有 locale 文件（这些文件本身就应该包含翻译）
];

// 允許的硬編碼（技術標識符、數據映射等）
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
  // 數據映射（星座、MBTI 等）
  /['"`][A-Z][^'"`]*['"`]:\s*['"`][\u4e00-\u9fa5]+['"`]/,
  /:\s*['"`][\u4e00-\u9fa5]+['"`],?\s*$/,
  // 配置文件的鍵值對
  /zh:\s*['"`]/,
  /ja:\s*['"`]/,
  /ko:\s*['"`]/,
  /legal_urls\.ts/,
  /birthday_greetings\.ts/,
];

// 跳過的文件（包含數據映射的文件）
const SKIP_FILES = [
  'src/config/legal_urls.ts',
  'src/cron/birthday_greetings.ts',
];

function shouldSkip(filePath: string): boolean {
  // 檢查是否在跳過的文件列表中
  for (const skipFile of SKIP_FILES) {
    if (filePath.includes(skipFile)) {
      return true;
    }
  }
  
  // 檢查是否在跳過的目錄中
  for (const pattern of SKIP_PATTERNS) {
    if (filePath.includes(pattern)) {
      return true;
    }
  }
  return false;
}

function isAllowed(text: string, line: string, filePath: string, fileContent: string, lineNumber: number): boolean {
  // 檢查是否在註釋中
  if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
    return true;
  }
  
  // 檢查是否在 console.log 中
  if (line.includes('console.log') || line.includes('console.error')) {
    return true;
  }
  
  // 檢查是否已經使用 i18n.t() 或 i18n?.t()
  if (line.includes('i18n.t(') || line.includes('i18n?.t(')) {
    return true;
  }
  
  // Domain 層的 fallback 字符串（向后兼容）應該被允許
  // 模式1：i18n?.t('key') || 'fallback'
  // 模式2：在 if (i18n) { ... } else { ... } 的 else 分支中（fallback 邏輯）
  if (filePath.includes('src/domain/')) {
    // 檢查是否是 fallback 模式（同一行）
    if (line.includes('||') && (line.includes('i18n?.t(') || line.includes('i18n?.t('))) {
      return true;
    }
    
    // 檢查是否在 else 分支中（fallback 邏輯）
    // 查找前面的 if (i18n) 或 if (i18n) { 語句
    const lines = fileContent.split('\n');
    let inElseBranch = false;
    let ifI18nFound = false;
    
    // 從當前行向前查找
    for (let i = lineNumber - 2; i >= 0; i--) {
      const prevLine = lines[i];
      if (prevLine.includes('if (i18n') || prevLine.includes('if(i18n')) {
        ifI18nFound = true;
        // 繼續查找 else
        for (let j = i + 1; j < lineNumber - 1; j++) {
          if (lines[j].includes('else') && !lines[j].includes('if')) {
            inElseBranch = true;
            break;
          }
        }
        break;
      }
    }
    
    // 如果找到 if (i18n) 且在 else 分支中，或者是 fallback 註釋
    if (ifI18nFound && (inElseBranch || line.includes('// Fallback') || line.includes('// 向后兼容'))) {
      return true;
    }
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
            
            // 檢查是否允許（傳入文件內容和行號以檢查上下文）
            if (!isAllowed(text, line, filePath, content, lineNumber)) {
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

function getAllTsFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      // 跳過 node_modules、.git 等目錄
      if (!['node_modules', '.git', 'dist', 'build'].includes(file)) {
        getAllTsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') && !file.endsWith('.test.ts') && !file.endsWith('.spec.ts')) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

/**
 * 檢查 i18n keys 是否在 CSV 中存在
 */
function checkI18nKeysInCSV(): { missing: string[]; total: number } {
  const csvPath = path.join(process.cwd(), 'i18n_for_translation.csv');
  if (!fs.existsSync(csvPath)) {
    return { missing: [], total: 0 };
  }
  
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const csvKeys = new Set<string>();
  const lines = csvContent.split('\n');
  
  // 提取 CSV 中的所有 keys (使用 csv-parse 更可靠)
  try {
    const { parse } = require('csv-parse/sync');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
    });
    for (const record of records) {
      if (record.key) {
        csvKeys.add(record.key);
      }
    }
  } catch (error) {
    // Fallback to simple parsing
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const key = line.split(',')[0].replace(/^"|"$/g, '');
        if (key) {
          csvKeys.add(key);
        }
      }
    }
  }
  
  // 提取代碼中使用的所有 i18n keys
  const codeKeys = new Set<string>();
  const files = getAllTsFiles('src');
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      // 匹配 i18n.t('key') 或 i18n.t("key")
      const matches = content.matchAll(/i18n\.t\(['"]([^'"]+)['"]\)/g);
      for (const match of matches) {
        codeKeys.add(match[1]);
      }
    } catch (error) {
      // 忽略讀取錯誤
    }
  }
  
  // 找出缺失的 keys
  const missing: string[] = [];
  for (const key of codeKeys) {
    if (!csvKeys.has(key)) {
      missing.push(key);
    }
  }
  
  return { missing, total: codeKeys.size };
}

function main() {
  console.log('🔍 檢查硬編碼中文字符串...\n');
  
  // 掃描所有 TypeScript 文件
  const files = getAllTsFiles('src');
  
  console.log(`📂 掃描 ${files.length} 個文件...\n`);
  
  for (const file of files) {
    checkFile(file);
  }
  
  // 檢查 i18n keys 是否在 CSV 中
  console.log('\n🔍 檢查 i18n keys 是否在 CSV 中...\n');
  const keyCheck = checkI18nKeysInCSV();
  
  if (keyCheck.missing.length > 0) {
    console.log(`⚠️  發現 ${keyCheck.missing.length} 個 i18n keys 在代碼中使用但不在 CSV 中：\n`);
    // 按命名空間分組
    const byNamespace = new Map<string, string[]>();
    for (const key of keyCheck.missing) {
      const namespace = key.split('.')[0];
      if (!byNamespace.has(namespace)) {
        byNamespace.set(namespace, []);
      }
      byNamespace.get(namespace)!.push(key);
    }
    
    for (const [namespace, keys] of Array.from(byNamespace.entries()).sort()) {
      console.log(`  ${namespace} (${keys.length} 個):`);
      for (const key of keys.slice(0, 10)) {
        console.log(`    - ${key}`);
      }
      if (keys.length > 10) {
        console.log(`    ... 還有 ${keys.length - 10} 個`);
      }
    }
    console.log('\n💡 修復建議：');
    console.log('   將這些 keys 添加到 `i18n_for_translation.csv` 和 `src/i18n/locales/zh-TW.ts`\n');
  } else {
    console.log(`✅ 所有 i18n keys (${keyCheck.total} 個) 都在 CSV 中！\n`);
  }
  
  // 輸出結果
  if (issues.length === 0 && keyCheck.missing.length === 0) {
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
    console.log('   3. 在 `i18n_for_translation.csv` 中添加 key 和翻譯');
    console.log('   4. 在 `src/i18n/types.ts` 中添加類型定義');
    console.log('   5. 確保已初始化 i18n: `const i18n = createI18n(user.language_pref || \'zh-TW\')`\n');
    
    console.log('📚 參考文檔：');
    console.log('   - @doc/I18N_GUIDE.md - i18n 使用指南');
    console.log('   - @doc/I18N_EXTRACTION_AND_REPLACEMENT_STANDARDS.md - i18n 規範\n');
    
    process.exit(1);
  }
}

main();

