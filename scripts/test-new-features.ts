/**
 * Automated Testing Script for New Features
 * Tests: Broadcast System, Maintenance Mode, Daily Stats
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration?: number;
}

const results: TestResult[] = [];
let totalTests = 0;
let passedTests = 0;

/**
 * Execute command and return output
 */
function exec(command: string): string {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
  } catch (error: any) {
    return error.stdout || error.message;
  }
}

/**
 * Log test result
 */
function logTest(name: string, passed: boolean, message: string, duration?: number) {
  totalTests++;
  if (passed) passedTests++;
  
  results.push({ name, passed, message, duration });
  
  const icon = passed ? '✅' : '❌';
  const durationStr = duration ? ` (${duration}ms)` : '';
  console.log(`${icon} ${name}${durationStr}`);
  if (!passed) {
    console.log(`   ${message}`);
  }
}

/**
 * Test 1: Check code quality
 */
async function testCodeQuality() {
  console.log('\n📊 測試 1: 代碼質量檢查');
  const startTime = Date.now();
  
  try {
    const output = exec('pnpm lint 2>&1');
    const hasErrors = output.includes('error') && !output.includes('0 errors');
    
    if (hasErrors) {
      logTest('Lint 檢查', false, 'Lint 發現錯誤', Date.now() - startTime);
    } else {
      logTest('Lint 檢查', true, 'Lint 通過（0 錯誤）', Date.now() - startTime);
    }
  } catch (error: any) {
    logTest('Lint 檢查', false, error.message, Date.now() - startTime);
  }
}

/**
 * Test 2: Check database schema
 */
async function testDatabaseSchema() {
  console.log('\n🗄️ 測試 2: 數據庫 Schema 檢查');
  const startTime = Date.now();
  
  try {
    // Check if migration file exists
    const migrationPath = 'src/db/migrations/0020_create_broadcast_and_maintenance_tables.sql';
    
    if (!existsSync(migrationPath)) {
      logTest('Migration 文件存在', false, '找不到 migration 文件', Date.now() - startTime);
      return;
    }
    
    logTest('Migration 文件存在', true, 'Migration 文件已創建', Date.now() - startTime);
    
    // Check schema.sql
    const schemaContent = readFileSync('src/db/schema.sql', 'utf-8');
    
    const hasBroadcasts = schemaContent.includes('CREATE TABLE IF NOT EXISTS broadcasts');
    const hasMaintenance = schemaContent.includes('CREATE TABLE IF NOT EXISTS maintenance_mode');
    const hasStats = schemaContent.includes('CREATE TABLE IF NOT EXISTS daily_stats');
    
    logTest('broadcasts 表定義', hasBroadcasts, hasBroadcasts ? '表定義已添加' : '表定義缺失');
    logTest('maintenance_mode 表定義', hasMaintenance, hasMaintenance ? '表定義已添加' : '表定義缺失');
    logTest('daily_stats 表定義', hasStats, hasStats ? '表定義已添加' : '表定義缺失');
    
  } catch (error: any) {
    logTest('數據庫 Schema 檢查', false, error.message, Date.now() - startTime);
  }
}

/**
 * Test 3: Check domain layer
 */
async function testDomainLayer() {
  console.log('\n🧩 測試 3: Domain 層檢查');
  const startTime = Date.now();
  
  try {
    const files = [
      'src/domain/broadcast.ts',
      'src/domain/maintenance.ts',
      'src/domain/stats.ts',
    ];
    
    for (const file of files) {
      const exists = existsSync(file);
      const name = file.split('/').pop();
      logTest(`${name} 存在`, exists, exists ? '文件已創建' : '文件缺失');
      
      if (exists) {
        const content = readFileSync(file, 'utf-8');
        const hasExports = content.includes('export');
        logTest(`${name} 有導出`, hasExports, hasExports ? '包含導出函數' : '缺少導出');
      }
    }
    
  } catch (error: any) {
    logTest('Domain 層檢查', false, error.message, Date.now() - startTime);
  }
}

/**
 * Test 4: Check service layer
 */
async function testServiceLayer() {
  console.log('\n⚙️ 測試 4: Service 層檢查');
  const startTime = Date.now();
  
  try {
    
    const files = [
      'src/services/broadcast.ts',
      'src/services/stats.ts',
    ];
    
    for (const file of files) {
      const exists = existsSync(file);
      const name = file.split('/').pop();
      logTest(`${name} 存在`, exists, exists ? '文件已創建' : '文件缺失');
      
      if (exists) {
        const content = readFileSync(file, 'utf-8');
        const hasExports = content.includes('export');
        logTest(`${name} 有導出`, hasExports, hasExports ? '包含導出函數' : '缺少導出');
      }
    }
    
  } catch (error: any) {
    logTest('Service 層檢查', false, error.message, Date.now() - startTime);
  }
}

/**
 * Test 5: Check handler layer
 */
async function testHandlerLayer() {
  console.log('\n🎮 測試 5: Handler 層檢查');
  const startTime = Date.now();
  
  try {
    const files = [
      'src/telegram/handlers/broadcast.ts',
      'src/telegram/handlers/maintenance.ts',
    ];
    
    for (const file of files) {
      const exists = existsSync(file);
      const name = file.split('/').pop();
      logTest(`${name} 存在`, exists, exists ? '文件已創建' : '文件缺失');
      
      if (exists) {
        const content = readFileSync(file, 'utf-8');
        const hasHandlers = content.includes('export async function handle');
        logTest(`${name} 有處理函數`, hasHandlers, hasHandlers ? '包含處理函數' : '缺少處理函數');
      }
    }
    
  } catch (error: any) {
    logTest('Handler 層檢查', false, error.message, Date.now() - startTime);
  }
}

/**
 * Test 6: Check router integration
 */
async function testRouterIntegration() {
  console.log('\n🔀 測試 6: Router 集成檢查');
  const startTime = Date.now();
  
  try {
    const routerContent = readFileSync('src/router.ts', 'utf-8');
    
    // Check maintenance mode check
    const hasMaintenanceCheck = routerContent.includes('getMaintenanceMode') && 
                                 routerContent.includes('isInMaintenanceMode');
    logTest('維護模式檢查', hasMaintenanceCheck, hasMaintenanceCheck ? '已集成' : '未集成');
    
    // Check broadcast routes
    const hasBroadcastRoute = routerContent.includes('/broadcast');
    logTest('廣播命令路由', hasBroadcastRoute, hasBroadcastRoute ? '已添加' : '未添加');
    
    // Check maintenance routes
    const hasMaintenanceRoute = routerContent.includes('/maintenance_enable');
    logTest('維護命令路由', hasMaintenanceRoute, hasMaintenanceRoute ? '已添加' : '未添加');
    
  } catch (error: any) {
    logTest('Router 集成檢查', false, error.message, Date.now() - startTime);
  }
}

/**
 * Test 7: Check worker integration
 */
async function testWorkerIntegration() {
  console.log('\n⏰ 測試 7: Worker 定時任務檢查');
  const startTime = Date.now();
  
  try {
    const workerContent = readFileSync('src/worker.ts', 'utf-8');
    
    // Check daily stats cron
    const hasDailyStats = workerContent.includes('generateDailyStats');
    logTest('每日統計任務', hasDailyStats, hasDailyStats ? '已添加' : '未添加');
    
    // Check broadcast queue cron
    const hasBroadcastQueue = workerContent.includes('processBroadcastQueue');
    logTest('廣播隊列任務', hasBroadcastQueue, hasBroadcastQueue ? '已添加' : '未添加');
    
  } catch (error: any) {
    logTest('Worker 集成檢查', false, error.message, Date.now() - startTime);
  }
}

/**
 * Test 8: Check wrangler.toml
 */
async function testWranglerConfig() {
  console.log('\n⚙️ 測試 8: Wrangler 配置檢查');
  const startTime = Date.now();
  
  try {
    const wranglerContent = readFileSync('wrangler.toml', 'utf-8');
    
    // Check if crons are configured
    const hasCrons = wranglerContent.includes('[triggers]') || wranglerContent.includes('crons');
    logTest('Cron Triggers 配置', hasCrons, hasCrons ? '已配置' : '未配置（需要手動添加）');
    
  } catch (error: any) {
    logTest('Wrangler 配置檢查', false, error.message, Date.now() - startTime);
  }
}

/**
 * Test 9: Deploy to staging
 */
async function deployToStaging() {
  console.log('\n🚀 測試 9: 部署到 Staging');
  const startTime = Date.now();
  
  try {
    console.log('   正在部署到 Staging...');
    const output = exec('pnpm deploy:staging 2>&1');
    
    const success = output.includes('Published') || output.includes('Deployed');
    
    if (success) {
      logTest('部署到 Staging', true, '部署成功', Date.now() - startTime);
    } else {
      logTest('部署到 Staging', false, '部署失敗，請檢查輸出', Date.now() - startTime);
      console.log('   部署輸出:', output.substring(0, 500));
    }
  } catch (error: any) {
    logTest('部署到 Staging', false, error.message, Date.now() - startTime);
  }
}

/**
 * Print summary
 */
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 測試總結');
  console.log('='.repeat(60));
  
  console.log(`\n總測試數: ${totalTests}`);
  console.log(`通過: ${passedTests} ✅`);
  console.log(`失敗: ${totalTests - passedTests} ❌`);
  console.log(`通過率: ${((passedTests / totalTests) * 100).toFixed(2)}%`);
  
  const failedTests = results.filter(r => !r.passed);
  if (failedTests.length > 0) {
    console.log('\n❌ 失敗的測試:');
    failedTests.forEach(test => {
      console.log(`   - ${test.name}: ${test.message}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (passedTests === totalTests) {
    console.log('🎉 所有測試通過！可以進行手動測試。');
  } else {
    console.log('⚠️  部分測試失敗，請檢查並修復。');
  }
  
  console.log('='.repeat(60));
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🧪 開始自動化測試...\n');
  console.log('測試範圍: 廣播系統、維護模式、每日統計');
  console.log('='.repeat(60));
  
  await testCodeQuality();
  await testDatabaseSchema();
  await testDomainLayer();
  await testServiceLayer();
  await testHandlerLayer();
  await testRouterIntegration();
  await testWorkerIntegration();
  await testWranglerConfig();
  await deployToStaging();
  
  printSummary();
  
  // Exit with appropriate code
  process.exit(passedTests === totalTests ? 0 : 1);
}

// Run tests
runTests().catch((error) => {
  console.error('❌ 測試執行失敗:', error);
  process.exit(1);
});

