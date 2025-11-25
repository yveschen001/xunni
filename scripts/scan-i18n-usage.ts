/**
 * 扫描代码中所有 i18n.t() 调用，生成使用报告
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';

interface UsageReport {
  key: string;
  files: Array<{ file: string; line: number; context: string }>;
  count: number;
}

const usageMap = new Map<string, Array<{ file: string; line: number; context: string }>>();

function scanFile(filePath: string): void {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // 匹配 i18n.t('key') 或 i18n.t("key")
    const pattern = /i18n\.t\(['"]([^'"]+)['"]\)/g;
    
    lines.forEach((line, index) => {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const key = match[1];
        if (!usageMap.has(key)) {
          usageMap.set(key, []);
        }
        
        // 获取上下文（前后各 2 行）
        const contextStart = Math.max(0, index - 2);
        const contextEnd = Math.min(lines.length, index + 3);
        const context = lines.slice(contextStart, contextEnd).join('\n');
        
        usageMap.get(key)!.push({
          file: filePath.replace(process.cwd() + '/', ''),
          line: index + 1,
          context: context.substring(0, 200), // 限制长度
        });
      }
    });
  } catch (error) {
    // Skip files that can't be read
  }
}

function scanDirectory(dir: string): void {
  const files = readdirSync(dir);
  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      // 跳过 node_modules, .git, dist 等
      if (!file.includes('node_modules') && !file.startsWith('.') && file !== 'dist') {
        scanDirectory(fullPath);
      }
    } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
      scanFile(fullPath);
    }
  }
}

function main() {
  console.log('🔍 扫描代码中的 i18n 使用情况...\n');
  
  // 扫描 src 目录
  const srcDir = join(process.cwd(), 'src');
  scanDirectory(srcDir);
  
  // 扫描 scripts 目录（可能也有使用）
  const scriptsDir = join(process.cwd(), 'scripts');
  if (statSync(scriptsDir).isDirectory()) {
    scanDirectory(scriptsDir);
  }
  
  // 生成报告
  const report: UsageReport[] = [];
  usageMap.forEach((usages, key) => {
    report.push({
      key,
      files: usages,
      count: usages.length,
    });
  });
  
  // 按使用次数排序
  report.sort((a, b) => b.count - a.count);
  
  // 写入 JSON 文件
  const outputPath = join(process.cwd(), 'i18n_usage_report.json');
  writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
  
  console.log(`✅ 扫描完成！`);
  console.log(`   - 发现 ${report.length} 个不同的 keys`);
  console.log(`   - 总使用次数: ${report.reduce((sum, r) => sum + r.count, 0)}`);
  console.log(`   - 报告已保存: ${outputPath}\n`);
  
  // 显示使用最多的 keys
  console.log('📊 使用最多的 keys (Top 20):');
  report.slice(0, 20).forEach(r => {
    console.log(`   - ${r.key}: ${r.count} 次`);
  });
  
  if (report.length > 20) {
    console.log(`   ... 还有 ${report.length - 20} 个 keys`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

