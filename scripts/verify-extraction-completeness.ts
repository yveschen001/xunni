/**
 * Verify Extraction Completeness
 * 验证提取的完整性，确保没有遗漏
 */

import * as fs from 'fs';
import * as path from 'path';

const CHINESE_REGEX = /[\u4e00-\u9fa5]/;

interface MissedString {
  text: string;
  file: string;
  line: number;
  reason: string;
}

const SCAN_DIRS = [
  'src/telegram/handlers',
  'src/domain',
  'src/services',
  'src/db',
];

const missedStrings: MissedString[] = [];
const scannedFiles: string[] = [];

// 读取已提取的内容
const extractedData = JSON.parse(
  fs.readFileSync('i18n_100_percent_coverage.json', 'utf-8')
);
const extractedTexts = new Set(extractedData.content.map((c: any) => c.text.trim()));

console.log(`📊 已提取内容: ${extractedTexts.size} 个\n`);

/**
 * 检查文件中是否有遗漏的中文字符串
 */
function checkFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    
    // 跳过注释
    if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('/*')) {
      continue;
    }
    
    // 跳过 console
    if (line.includes('console.log') || line.includes('console.error')) {
      continue;
    }
    
    // 跳过 import
    if (line.trim().startsWith('import ')) {
      continue;
    }
    
    // 跳过已经使用 i18n.t() 的
    if (line.includes('i18n.t(')) {
      continue;
    }
    
    // 检查是否包含中文
    if (!CHINESE_REGEX.test(line)) {
      continue;
    }
    
    // 提取所有中文字符串
    const stringMatches = [
      ...Array.from(line.matchAll(/['"]([^'"]*[\u4e00-\u9fa5][^'"]*)['"]/g)),
      ...Array.from(line.matchAll(/`([^`]*[\u4e00-\u9fa5][^`]*)`/g)),
    ];
    
    for (const match of stringMatches) {
      const text = match[1].trim();
      
      // 跳过太短的
      if (text.length < 2) continue;
      
      // 跳过 callback_data（业务逻辑标识符）
      if (line.includes('callback_data:') && !CHINESE_REGEX.test(text)) {
        continue;
      }
      
      // 检查是否已提取
      let found = false;
      
      // 精确匹配
      if (extractedTexts.has(text)) {
        found = true;
      }
      
      // 检查是否是长模板的一部分
      if (!found) {
        for (const extracted of extractedTexts) {
          if (extracted.includes(text) || text.includes(extracted)) {
            found = true;
            break;
          }
        }
      }
      
      if (!found) {
        // 确定原因
        let reason = 'unknown';
        
        if (text.includes('${')) {
          reason = 'template_string';
        } else if (text.length < 5) {
          reason = 'too_short';
        } else if (line.includes('callback_data')) {
          reason = 'callback_data';
        } else {
          reason = 'missed';
        }
        
        missedStrings.push({
          text,
          file: filePath,
          line: lineNumber,
          reason,
        });
      }
    }
  }
  
  scannedFiles.push(filePath);
}

/**
 * 递归扫描目录
 */
function scanDirectory(dir: string) {
  if (!fs.existsSync(dir)) {
    return;
  }
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.sql'))) {
      if (entry.name.includes('.test.')) continue;
      checkFile(fullPath);
    }
  }
}

/**
 * 主函数
 */
function main() {
  console.log('🔍 验证提取完整性...\n');
  
  const startTime = Date.now();
  
  for (const dir of SCAN_DIRS) {
    console.log(`📂 检查目录: ${dir}`);
    scanDirectory(dir);
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log(`\n✅ 检查完成！`);
  console.log(`📊 统计:`);
  console.log(`   - 检查文件: ${scannedFiles.length} 个`);
  console.log(`   - 发现遗漏: ${missedStrings.length} 个`);
  console.log(`   - 耗时: ${duration} 秒\n`);
  
  if (missedStrings.length === 0) {
    console.log('🎉 完美！没有遗漏的中文字符串！\n');
    console.log('✅ 提取完整性: 100%');
    return;
  }
  
  // 按原因分组
  const byReason = new Map<string, MissedString[]>();
  for (const missed of missedStrings) {
    const list = byReason.get(missed.reason) || [];
    list.push(missed);
    byReason.set(missed.reason, list);
  }
  
  console.log('📊 遗漏原因分析:');
  for (const [reason, list] of Array.from(byReason.entries()).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`   - ${reason}: ${list.length} 个`);
  }
  
  // 输出详细报告
  const report = {
    summary: {
      totalFiles: scannedFiles.length,
      extractedCount: extractedTexts.size,
      missedCount: missedStrings.length,
      coverageRate: ((extractedTexts.size / (extractedTexts.size + missedStrings.length)) * 100).toFixed(2) + '%',
    },
    missedStrings: missedStrings.sort((a, b) => b.text.length - a.text.length),
    byReason: Object.fromEntries(byReason),
  };
  
  fs.writeFileSync(
    'i18n_extraction_verification.json',
    JSON.stringify(report, null, 2),
    'utf-8'
  );
  
  console.log('\n📄 详细报告:');
  console.log('   - i18n_extraction_verification.json');
  
  console.log('\n⚠️  发现遗漏的字符串！');
  console.log(`   覆盖率: ${report.summary.coverageRate}`);
  console.log('\n前 20 个遗漏的字符串:');
  
  for (let i = 0; i < Math.min(20, missedStrings.length); i++) {
    const missed = missedStrings[i];
    console.log(`\n${i + 1}. ${missed.file}:${missed.line}`);
    console.log(`   文本: ${missed.text.substring(0, 80)}${missed.text.length > 80 ? '...' : ''}`);
    console.log(`   原因: ${missed.reason}`);
  }
}

main();

