/**
 * i18n 完整性验证脚本
 * 
 * 检查：
 * 1. 所有代码中使用的 i18n keys 都在 CSV 中存在
 * 2. 所有硬编码中文都已替换
 * 3. 数据库迁移已完成
 * 4. 所有 keys 在 zh-TW.ts 中存在
 * 5. 路由中的 i18n 使用正确
 * 6. 网络/API 调用中的 i18n 使用正确
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface CheckResult {
  codeKeys: Set<string>;
  csvKeys: Set<string>;
  zhTWKeys: Set<string>;
  missingInCSV: string[];
  missingInZhTW: string[];
  unusedInCSV: string[];
  hardcodedIssues: string[];
  databaseMigrationOk: boolean;
}

/**
 * 提取代码中使用的所有 i18n keys
 */
function extractI18nKeysFromCode(): Set<string> {
  const keys = new Set<string>();
  const srcDir = join(process.cwd(), 'src');
  
  function scanDirectory(dir: string) {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // 跳过 node_modules 和测试文件
        if (entry !== 'node_modules' && !entry.includes('test')) {
          scanDirectory(fullPath);
        }
      } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
        try {
          const content = readFileSync(fullPath, 'utf-8');
          // 匹配 i18n.t('key') 或 i18n.t("key")
          const matches = content.matchAll(/i18n\.t\(['"]([^'"]+)['"]\)/g);
          for (const match of matches) {
            keys.add(match[1]);
          }
        } catch (error) {
          console.error(`Error reading ${fullPath}:`, error);
        }
      }
    }
  }
  
  scanDirectory(srcDir);
  return keys;
}

/**
 * 提取 CSV 中的所有 keys
 */
function extractKeysFromCSV(): Set<string> {
  const keys = new Set<string>();
  const csvPath = join(process.cwd(), 'i18n_for_translation.csv');
  
  try {
    const content = readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n');
    
    // 跳过标题行
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const key = line.split(',')[0];
        if (key) {
          keys.add(key);
        }
      }
    }
  } catch (error) {
    console.error('Error reading CSV:', error);
  }
  
  return keys;
}

/**
 * 提取 zh-TW.ts 中的所有 keys
 */
function extractKeysFromZhTW(): Set<string> {
  const keys = new Set<string>();
  const zhTWPath = join(process.cwd(), 'src', 'i18n', 'locales', 'zh-TW.ts');
  
  try {
    const content = readFileSync(zhTWPath, 'utf-8');
    // 匹配 key: `...` 或 'key': `...`
    const matches = content.matchAll(/(?:^|\s)(?:'?([\w.]+)'?|([\w.]+)):\s*`/gm);
    for (const match of matches) {
      const key = match[1] || match[2];
      if (key && !key.includes('${')) {
        // 处理命名空间（如 common.text112）
        const fullKey = buildFullKey(content, key);
        if (fullKey) {
          keys.add(fullKey);
        }
      }
    }
  } catch (error) {
    console.error('Error reading zh-TW.ts:', error);
  }
  
  return keys;
}

/**
 * 构建完整的 key（包含命名空间）
 */
function buildFullKey(content: string, key: string): string | null {
  // 简化版本：直接返回 key，实际应该解析命名空间结构
  // 这里需要更复杂的解析逻辑
  return key;
}

/**
 * 检查硬编码中文
 */
function checkHardcodedChinese(): string[] {
  const issues: string[] = [];
  const srcDir = join(process.cwd(), 'src');
  
  // 排除的模式
  const excludePatterns = [
    /callback_data:\s*['"][^'"]*[\u4e00-\u9fa5]/,
    /regex/i,
    /console\.(log|error)/,
    /\/\/.*[\u4e00-\u9fa5]/,
    /\/\*.*[\u4e00-\u9fa5].*\*\//,
  ];
  
  function scanDirectory(dir: string) {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (entry !== 'node_modules' && !entry.includes('test')) {
          scanDirectory(fullPath);
        }
      } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
        try {
          const content = readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n');
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // 检查是否包含中文字符
            if (/[\u4e00-\u9fa5]/.test(line)) {
              // 排除注释和特定模式
              const isExcluded = excludePatterns.some(pattern => pattern.test(line));
              if (!isExcluded && !line.includes('i18n.t(')) {
                issues.push(`${fullPath}:${i + 1}: ${line.trim()}`);
              }
            }
          }
        } catch (error) {
          // 忽略读取错误
        }
      }
    }
  }
  
  scanDirectory(srcDir);
  return issues;
}

/**
 * 检查数据库迁移
 */
function checkDatabaseMigration(): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  const migrationPath = join(
    process.cwd(),
    'src',
    'db',
    'migrations',
    '0050_update_tasks_to_i18n_keys.sql'
  );
  
  try {
    const content = readFileSync(migrationPath, 'utf-8');
    // 检查是否包含 tasks.name. 和 tasks.description.
    if (!content.includes('tasks.name.')) {
      issues.push('迁移脚本缺少 tasks.name. keys');
    }
    if (!content.includes('tasks.description.')) {
      issues.push('迁移脚本缺少 tasks.description. keys');
    }
    
    // 检查是否有硬编码中文
    if (/[\u4e00-\u9fa5]/.test(content)) {
      issues.push('迁移脚本中包含硬编码中文');
    }
  } catch (error) {
    issues.push('迁移脚本不存在或无法读取');
  }
  
  // 检查所有 SQL 文件中的硬编码
  const migrationsDir = join(process.cwd(), 'src', 'db', 'migrations');
  try {
    const files = readdirSync(migrationsDir);
    for (const file of files) {
      if (file.endsWith('.sql')) {
        const filePath = join(migrationsDir, file);
        const content = readFileSync(filePath, 'utf-8');
        if (/[\u4e00-\u9fa5]/.test(content) && !file.includes('update_tasks_to_i18n')) {
          issues.push(`迁移文件 ${file} 包含硬编码中文`);
        }
      }
    }
  } catch (error) {
    // 忽略错误
  }
  
  return { ok: issues.length === 0, issues };
}

/**
 * 检查路由中的 i18n 使用
 */
function checkRouterI18n(): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  const routerPath = join(process.cwd(), 'src', 'router.ts');
  
  try {
    const content = readFileSync(routerPath, 'utf-8');
    const lines = content.split('\n');
    
    // 检查 sendMessage 调用是否使用 i18n
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('sendMessage') || line.includes('answerCallbackQuery')) {
        // 检查下一行是否包含 i18n.t
        const nextLines = lines.slice(i, i + 3).join('\n');
        if (/[\u4e00-\u9fa5]/.test(nextLines) && !nextLines.includes('i18n.t(')) {
          issues.push(`router.ts:${i + 1}: sendMessage/answerCallbackQuery 可能包含硬编码中文`);
        }
      }
    }
    
    // 检查 createI18n 调用是否使用 user.language_pref
    const createI18nMatches = content.matchAll(/createI18n\([^)]+\)/g);
    for (const match of createI18nMatches) {
      if (!match[0].includes('language_pref') && !match[0].includes('zh-TW')) {
        issues.push(`router.ts: createI18n 调用可能未使用 user.language_pref`);
      }
    }
  } catch (error) {
    issues.push('无法读取 router.ts');
  }
  
  return { ok: issues.length === 0, issues };
}

/**
 * 检查网络/API 调用中的 i18n 使用
 */
function checkNetworkI18n(): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  const servicesDir = join(process.cwd(), 'src', 'services');
  const apiDir = join(process.cwd(), 'src', 'api');
  
  function scanDirectory(dir: string) {
    try {
      const entries = readdirSync(dir);
      
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
          try {
            const content = readFileSync(fullPath, 'utf-8');
            const lines = content.split('\n');
            
            // 检查 fetch 调用附近的硬编码
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              if (line.includes('fetch(') || line.includes('axios') || line.includes('http')) {
                // 检查后续几行是否有硬编码中文
                const nextLines = lines.slice(i, i + 10).join('\n');
                if (/[\u4e00-\u9fa5]/.test(nextLines) && !nextLines.includes('i18n.t(')) {
                  issues.push(`${fullPath}:${i + 1}: API 调用附近可能包含硬编码中文`);
                }
              }
            }
          } catch (error) {
            // 忽略读取错误
          }
        }
      }
    } catch (error) {
      // 忽略目录错误
    }
  }
  
  if (statSync(servicesDir).isDirectory()) {
    scanDirectory(servicesDir);
  }
  if (statSync(apiDir).isDirectory()) {
    scanDirectory(apiDir);
  }
  
  return { ok: issues.length === 0, issues };
}

/**
 * 主函数
 */
async function main() {
  console.log('🔍 开始 i18n 完整性检查...\n');
  
  // 提取 keys
  console.log('📊 提取 keys...');
  const codeKeys = extractI18nKeysFromCode();
  const csvKeys = extractKeysFromCSV();
  const zhTWKeys = extractKeysFromZhTW();
  
  console.log(`  - 代码中使用: ${codeKeys.size} keys`);
  console.log(`  - CSV 中存在: ${csvKeys.size} keys`);
  console.log(`  - zh-TW.ts 中存在: ${zhTWKeys.size} keys\n`);
  
  // 检查缺失的 keys
  const missingInCSV = [...codeKeys].filter(k => !csvKeys.has(k));
  const missingInZhTW = [...codeKeys].filter(k => !zhTWKeys.has(k));
  const unusedInCSV = [...csvKeys].filter(k => !codeKeys.has(k));
  
  // 检查硬编码
  console.log('🔍 检查硬编码中文...');
  const hardcodedIssues = checkHardcodedChinese();
  
  // 检查数据库迁移
  console.log('🔍 检查数据库迁移...');
  const databaseMigration = checkDatabaseMigration();
  
  // 检查路由
  console.log('🔍 检查路由中的 i18n...');
  const routerCheck = checkRouterI18n();
  
  // 检查网络/API
  console.log('🔍 检查网络/API 调用中的 i18n...');
  const networkCheck = checkNetworkI18n();
  
  // 输出结果
  console.log('\n' + '='.repeat(60));
  console.log('📋 检查结果');
  console.log('='.repeat(60) + '\n');
  
  if (missingInCSV.length > 0) {
    console.log(`❌ 代码中使用但 CSV 中缺失 (${missingInCSV.length}):`);
    missingInCSV.slice(0, 20).forEach(k => console.log(`  - ${k}`));
    if (missingInCSV.length > 20) {
      console.log(`  ... 还有 ${missingInCSV.length - 20} 个`);
    }
    console.log('');
  }
  
  if (missingInZhTW.length > 0) {
    console.log(`❌ 代码中使用但 zh-TW.ts 中缺失 (${missingInZhTW.length}):`);
    missingInZhTW.slice(0, 20).forEach(k => console.log(`  - ${k}`));
    if (missingInZhTW.length > 20) {
      console.log(`  ... 还有 ${missingInZhTW.length - 20} 个`);
    }
    console.log('');
  }
  
  if (hardcodedIssues.length > 0) {
    console.log(`❌ 发现硬编码中文 (${hardcodedIssues.length}):`);
    hardcodedIssues.slice(0, 10).forEach(issue => console.log(`  - ${issue}`));
    if (hardcodedIssues.length > 10) {
      console.log(`  ... 还有 ${hardcodedIssues.length - 10} 个`);
    }
    console.log('');
  }
  
  if (!databaseMigration.ok) {
    console.log('❌ 数据库迁移问题:');
    databaseMigration.issues.forEach(issue => console.log(`  - ${issue}`));
    console.log('');
  }
  
  if (!routerCheck.ok) {
    console.log('❌ 路由中的 i18n 问题:');
    routerCheck.issues.slice(0, 10).forEach(issue => console.log(`  - ${issue}`));
    if (routerCheck.issues.length > 10) {
      console.log(`  ... 还有 ${routerCheck.issues.length - 10} 个问题`);
    }
    console.log('');
  }
  
  if (!networkCheck.ok) {
    console.log('❌ 网络/API 调用中的 i18n 问题:');
    networkCheck.issues.slice(0, 10).forEach(issue => console.log(`  - ${issue}`));
    if (networkCheck.issues.length > 10) {
      console.log(`  ... 还有 ${networkCheck.issues.length - 10} 个问题`);
    }
    console.log('');
  }
  
  // 总结
  const allOk =
    missingInCSV.length === 0 &&
    missingInZhTW.length === 0 &&
    hardcodedIssues.length === 0 &&
    databaseMigration.ok &&
    routerCheck.ok &&
    networkCheck.ok;
  
  console.log('='.repeat(60));
  if (allOk) {
    console.log('✅ 所有检查通过！');
    process.exit(0);
  } else {
    console.log('❌ 检查未通过，请修复上述问题');
    console.log('\n💡 建议：');
    if (missingInCSV.length > 0) {
      console.log('  1. 将缺失的 keys 添加到 i18n_for_translation.csv');
    }
    if (missingInZhTW.length > 0) {
      console.log('  2. 将缺失的 keys 添加到 src/i18n/locales/zh-TW.ts');
    }
    if (hardcodedIssues.length > 0) {
      console.log('  3. 将硬编码中文替换为 i18n.t() 调用');
    }
    if (!databaseMigration.ok) {
      console.log('  4. 创建或修复数据库迁移脚本');
    }
    if (!routerCheck.ok) {
      console.log('  5. 修复路由中的 i18n 使用');
    }
    if (!networkCheck.ok) {
      console.log('  6. 修复网络/API 调用中的 i18n 使用');
    }
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ 检查过程出错:', error);
  process.exit(1);
});

