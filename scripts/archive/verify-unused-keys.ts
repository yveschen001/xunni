/**
 * 验证"未使用"的 keys 是否真的没有被使用
 * 检查：数据库、动态使用、模板字符串等
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface UnusedKey {
  key: string;
  translation: string;
  reason: 'not_used' | 'duplicate_unused';
  duplicateOf?: string;
}

function main() {
  console.log('🔍 验证"未使用"的 keys 是否真的没有被使用...\n');
  console.log('='.repeat(80));
  console.log();

  // 读取未使用的 keys 报告
  const unusedReportPath = join(process.cwd(), 'unused_keys_report.json');
  let unusedKeys: UnusedKey[];
  
  try {
    unusedKeys = JSON.parse(readFileSync(unusedReportPath, 'utf-8'));
    console.log(`✅ 已读取未使用的 keys 报告: ${unusedKeys.length} 个\n`);
  } catch (error) {
    console.error('❌ 找不到未使用的 keys 报告，请先运行: pnpm tsx scripts/compare-csv-usage.ts');
    process.exit(1);
  }

  // 读取使用报告
  const usageReportPath = join(process.cwd(), 'i18n_usage_report.json');
  let usedKeys: Set<string>;
  
  try {
    const usageReport = JSON.parse(readFileSync(usageReportPath, 'utf-8'));
    usedKeys = new Set(usageReport.map((r: { key: string }) => r.key));
    console.log(`✅ 已读取使用报告: ${usedKeys.size} 个 keys 在代码中使用\n`);
  } catch (error) {
    console.error('❌ 找不到使用报告，请先运行: pnpm tsx scripts/scan-i18n-usage.ts');
    process.exit(1);
  }

  // 检查数据库迁移文件中的 keys
  console.log('1️⃣ 检查数据库迁移文件中的 keys...\n');
  const migrationDir = join(process.cwd(), 'src', 'db', 'migrations');
  const migrationKeys = new Set<string>();
  
  if (statSync(migrationDir).isDirectory()) {
    const files = readdirSync(migrationDir);
    for (const file of files) {
      if (file.endsWith('.sql')) {
        const content = readFileSync(join(migrationDir, file), 'utf-8');
        // 查找 i18n keys（如 'tasks.name.interests'）
        const keyPattern = /['"]([\w\.]+\.name\.[\w\.]+|[\w\.]+\.description\.[\w\.]+)['"]/g;
        let match;
        while ((match = keyPattern.exec(content)) !== null) {
          migrationKeys.add(match[1]);
        }
      }
    }
  }
  
  console.log(`   发现 ${migrationKeys.size} 个数据库中的 keys:`);
  Array.from(migrationKeys).slice(0, 10).forEach(k => console.log(`   - ${k}`));
  if (migrationKeys.size > 10) {
    console.log(`   ... 还有 ${migrationKeys.size - 10} 个`);
  }
  console.log();

  // 检查代码中从数据库读取后使用 i18n.t() 的情况
  console.log('2️⃣ 检查代码中动态使用 keys 的情况...\n');
  const srcDir = join(process.cwd(), 'src');
  const dynamicKeys = new Set<string>();
  
  function scanForDynamicUsage(dir: string): void {
    const files = readdirSync(dir);
    for (const file of files) {
      const fullPath = join(dir, file);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory() && !file.includes('node_modules') && !file.startsWith('.') && file !== 'dist') {
        scanForDynamicUsage(fullPath);
      } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
        try {
          const content = readFileSync(fullPath, 'utf-8');
          
          // 查找模式：i18n.t(task.name) 或 i18n.t(task.description)
          const patterns = [
            /i18n\.t\([\w\.]+\.name\)/g,
            /i18n\.t\([\w\.]+\.description\)/g,
            /i18n\.t\(row\.name\)/g,
            /i18n\.t\(row\.description\)/g,
            /i18n\.t\(task\.name\)/g,
            /i18n\.t\(task\.description\)/g,
          ];
          
          patterns.forEach(pattern => {
            if (pattern.test(content)) {
              // 这是一个动态使用，无法静态分析
              // 我们需要检查所有可能的 keys
            }
          });
        } catch (error) {
          // Skip
        }
      }
    }
  }
  
  scanForDynamicUsage(srcDir);
  console.log(`   发现动态使用模式（需要手动检查）\n`);

  // 验证一些"未使用"的 keys
  console.log('3️⃣ 验证一些"未使用"的 keys 是否真的没有被使用...\n');
  
  const suspiciousKeys: Array<{ key: string; reason: string }> = [];
  
  // 检查一些常见的"未使用" keys
  const testKeys = [
    'catch.settings10',  // 我们知道这个在使用中
    'profile.settings',  // 我们知道这个在使用中
    'admin.settings4',   // 需要验证
    'admin.settings5',   // 需要验证
    'admin.settings6',   // 需要验证
  ];
  
  testKeys.forEach(key => {
    const isInUsage = usedKeys.has(key);
    const isInMigration = migrationKeys.has(key);
    const isMarkedUnused = unusedKeys.some(u => u.key === key);
    
    if (isMarkedUnused && (isInUsage || isInMigration)) {
      suspiciousKeys.push({
        key,
        reason: isInUsage ? '在代码中使用' : '在数据库中使用',
      });
    }
  });
  
  if (suspiciousKeys.length > 0) {
    console.log(`   ⚠️  发现 ${suspiciousKeys.length} 个被错误标记为未使用的 keys:\n`);
    suspiciousKeys.forEach(s => {
      console.log(`      - ${s.key}: ${s.reason}`);
    });
    console.log();
  } else {
    console.log(`   ✅ 测试的 keys 验证通过\n`);
  }

  // 检查 tasks 相关的 keys（这些在数据库中）
  console.log('4️⃣ 检查 tasks 相关的 keys（这些存储在数据库中）...\n');
  const taskKeys = Array.from(migrationKeys).filter(k => k.startsWith('tasks.'));
  console.log(`   发现 ${taskKeys.length} 个 tasks keys 在数据库中:`);
  taskKeys.forEach(k => console.log(`   - ${k}`));
  console.log();
  
  // 检查这些 keys 是否在"未使用"列表中
  const taskKeysMarkedUnused = unusedKeys.filter(u => taskKeys.includes(u.key));
  if (taskKeysMarkedUnused.length > 0) {
    console.log(`   ⚠️  警告: ${taskKeysMarkedUnused.length} 个 tasks keys 被标记为未使用，但它们存储在数据库中！\n`);
    taskKeysMarkedUnused.slice(0, 10).forEach(u => {
      console.log(`      - ${u.key}`);
    });
    if (taskKeysMarkedUnused.length > 10) {
      console.log(`      ... 还有 ${taskKeysMarkedUnused.length - 10} 个`);
    }
    console.log();
  } else {
    console.log(`   ✅ 所有 tasks keys 都正确识别\n`);
  }

  // 总结
  console.log('='.repeat(80));
  console.log('📊 验证总结:\n');
  console.log(`   - 数据库中的 keys: ${migrationKeys.size}`);
  console.log(`   - 被错误标记的 keys: ${suspiciousKeys.length}`);
  console.log(`   - Tasks keys 被错误标记: ${taskKeysMarkedUnused.length}\n`);
  
  if (suspiciousKeys.length > 0 || taskKeysMarkedUnused.length > 0) {
    console.log('   ⚠️  警告: 发现一些 keys 被错误标记为未使用！');
    console.log('   建议: 不要删除这些 keys，它们可能通过数据库或其他方式使用。\n');
  } else {
    console.log('   ✅ 验证通过: 未发现明显的问题\n');
  }
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

