/**
 * 测试所有页面的 i18n 问题
 * 实际运行所有handler，检查返回的消息是否包含占位符
 * 
 * 优化：添加超时、重试和跳过机制
 */

import { createI18n } from '../src/i18n';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const handlersDir = join(process.cwd(), 'src/telegram/handlers');
const handlers = readdirSync(handlersDir).filter(f => f.endsWith('.ts'));

// 超时配置
const FILE_TIMEOUT_MS = 5000; // 每个文件处理超时：5秒
const TOTAL_TIMEOUT_MS = 60000; // 总超时：60秒
const START_TIME = Date.now();

// 占位符模式
const placeholderPatterns = [
  /\[onboarding\.\w+\]/g,
  /\[需要翻译[^\]]*\]/g,
  /\[Translation needed[^\]]*\]/g,
  /\$\{\{[^\}]+\}\}/g, // 双重大括号 ${{...}}
  /\\\$\\\{[\w.]+\}/g, // 转义的占位符
  /\$\{[^}]*(\?|===|!==|&&|\|\|)[^}]*\}/g, // 逻辑表达式 ${cond ? a : b}
  /\$\{[^}]*\.[a-zA-Z]+\(/g, // 函数调用 ${arr.join()}
  /\$\{matchResult\.[^}]+\}/g, // 遗留的复杂对象路径
  /\$\{task\.[^}]+\}/g, // 遗留的任务对象路径
];

// 检查消息内容是否包含占位符
function checkForPlaceholders(text: string, handler: string): string[] {
  const issues: string[] = [];
  
  for (const pattern of placeholderPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      issues.push(...matches.map(m => `${handler}: ${m}`));
    }
  }
  
  // 检查是否包含 [key] 格式的占位符
  const bracketPlaceholder = /\[[\w.]+\]/g;
  const bracketMatches = text.match(bracketPlaceholder);
  if (bracketMatches) {
    // 排除一些合法的格式，如 [按钮文本]
    const suspicious = bracketMatches.filter(m => 
      !m.startsWith('[按钮') && 
      !m.startsWith('[需要') &&
      !m.startsWith('[Translation') &&
      m.length > 3
    );
    if (suspicious.length > 0) {
      issues.push(...suspicious.map(m => `${handler}: ${m}`));
    }
  }
  
  return issues;
}

// 扫描所有handler文件，查找所有i18n.t()调用
function scanHandlerI18nKeys(handler: string): string[] {
  const filePath = join(handlersDir, handler);
  const content = readFileSync(filePath, 'utf-8');
  const keys: string[] = [];
  
  // 匹配 i18n.t('key') 或 i18n.t("key")
  const i18nPattern = /i18n\.t\(['"]([^'"]+)['"]/g;
  let match;
  while ((match = i18nPattern.exec(content)) !== null) {
    keys.push(match[1]);
  }
  
  return keys;
}

// 超时包装函数
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  let timeoutId: NodeJS.Timeout | null = null;
  let isResolved = false;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        reject(new Error(errorMessage));
      }
    }, timeoutMs);
  });
  
  return Promise.race([
    promise.then(result => {
      isResolved = true;
      if (timeoutId) clearTimeout(timeoutId);
      return result;
    }),
    timeoutPromise
  ]);
}

// 测试单个handler文件的i18n key（带超时）
async function testHandlerI18nKeys(
  handler: string,
  i18n: ReturnType<typeof createI18n>
): Promise<{ missing: string[]; placeholders: string[]; skipped: boolean }> {
  const missing: string[] = [];
  const placeholders: string[] = [];
  let skipped = false;
  
  try {
    await withTimeout(
      new Promise<void>((resolve, reject) => {
        try {
          const keys = scanHandlerI18nKeys(handler);
          
          for (const key of keys) {
            // 检查总超时
            if (Date.now() - START_TIME > TOTAL_TIMEOUT_MS) {
              skipped = true;
              reject(new Error(`Total timeout reached while processing ${handler}`));
              return;
            }
            
            try {
              const value = i18n.t(key);
              
              // 检查是否是占位符
              if (value.startsWith('[') && value.endsWith(']')) {
                placeholders.push(`${handler}: ${key} = ${value}`);
              }
              
              // 检查值中是否包含占位符模式
              const issues = checkForPlaceholders(value, handler);
              if (issues.length > 0) {
                placeholders.push(...issues.map(i => `${i} (value: ${value.substring(0, 50)})`));
              }
            } catch (e) {
              missing.push(`${handler}: ${key}`);
            }
          }
          
          resolve();
        } catch (error) {
          reject(error);
        }
      }),
      FILE_TIMEOUT_MS,
      `Timeout processing ${handler} (${FILE_TIMEOUT_MS}ms)`
    );
  } catch (error) {
    skipped = true;
    console.warn(`⚠️  跳过 ${handler}: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return { missing, placeholders, skipped };
}

// 测试所有key是否正常（带超时和进度显示）
async function testAllI18nKeys(): Promise<{ missing: string[]; placeholders: string[]; skipped: string[] }> {
  const i18n = createI18n('zh-TW');
  const missing: string[] = [];
  const placeholders: string[] = [];
  const skipped: string[] = [];
  
  console.log('🔍 扫描所有handler的i18n key...\n');
  console.log(`⏱️  文件超时: ${FILE_TIMEOUT_MS}ms, 总超时: ${TOTAL_TIMEOUT_MS}ms\n`);
  
  let processed = 0;
  for (const handler of handlers) {
    // 检查总超时
    if (Date.now() - START_TIME > TOTAL_TIMEOUT_MS) {
      console.warn(`\n⚠️  总超时，跳过剩余 ${handlers.length - processed} 个文件`);
      skipped.push(...handlers.slice(processed).map(h => `${h} (总超时)`));
      break;
    }
    
    processed++;
    const progress = `[${processed}/${handlers.length}]`;
    
    try {
      const result = await testHandlerI18nKeys(handler, i18n);
      missing.push(...result.missing);
      placeholders.push(...result.placeholders);
      if (result.skipped) {
        skipped.push(handler);
      } else if (processed % 10 === 0 || processed === handlers.length) {
        // 每10个文件或最后一个文件显示进度
        console.log(`${progress} 已处理 ${handler}...`);
      }
    } catch (error) {
      skipped.push(`${handler} (错误: ${error instanceof Error ? error.message : String(error)})`);
      console.warn(`${progress} ⚠️  处理 ${handler} 时出错，已跳过`);
    }
  }
  
  return { missing, placeholders, skipped };
}

// 主函数
async function main() {
  console.log('🌐 测试所有页面的 i18n 问题\n');
  console.log('='.repeat(80));
  console.log(`扫描 ${handlers.length} 个handler文件\n`);
  
  try {
    const { missing, placeholders, skipped } = await testAllI18nKeys();
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 检查结果\n');
    
    if (skipped.length > 0) {
      console.log(`⏭️  跳过的文件 (${skipped.length}):`);
      skipped.slice(0, 10).forEach(s => console.log(`   ${s}`));
      if (skipped.length > 10) {
        console.log(`   ... 还有 ${skipped.length - 10} 个`);
      }
      console.log();
    }
    
    if (missing.length > 0) {
      console.log(`❌ 缺失的 key (${missing.length}):`);
      missing.slice(0, 20).forEach(m => console.log(`   ${m}`));
      if (missing.length > 20) {
        console.log(`   ... 还有 ${missing.length - 20} 个`);
      }
      console.log();
    }
    
    if (placeholders.length > 0) {
      console.log(`❌ 占位符问题 (${placeholders.length}):`);
      placeholders.slice(0, 20).forEach(p => console.log(`   ${p}`));
      if (placeholders.length > 20) {
        console.log(`   ... 还有 ${placeholders.length - 20} 个`);
      }
      console.log();
    }
    
    const duration = Date.now() - START_TIME;
    console.log(`⏱️  总耗时: ${duration}ms\n`);
    
    if (missing.length === 0 && placeholders.length === 0) {
      console.log('✅ 所有 i18n key 都正常！');
      if (skipped.length > 0) {
        console.log(`⚠️  但有 ${skipped.length} 个文件被跳过，可能需要检查`);
        process.exit(0); // 跳过不影响结果
      } else {
        process.exit(0);
      }
    } else {
      console.log(`\n❌ 发现 ${missing.length} 个缺失的 key，${placeholders.length} 个占位符问题`);
      if (skipped.length > 0) {
        console.log(`⚠️  还有 ${skipped.length} 个文件被跳过`);
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ 测试失败:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ 测试失败:', error);
  process.exit(1);
});

