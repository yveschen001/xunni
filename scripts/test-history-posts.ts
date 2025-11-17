/**
 * History Posts Feature Test
 * 
 * Tests the conversation history posts system
 */

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, message: string) {
  results.push({ name, passed, message });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
}

async function testHistoryPostsFeature() {
  console.log('\n🧪 測試歷史記錄帖子功能\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Test 1: Check tables exist
    console.log('📋 測試 1：檢查資料庫表');
    const tablesExist = await checkTablesExist();
    logTest(
      '資料庫表檢查',
      tablesExist,
      tablesExist ? '兩個表都已創建' : '表不存在'
    );

    // Test 2: Check indexes
    console.log('\n📋 測試 2：檢查索引');
    const indexesExist = await checkIndexesExist();
    logTest(
      '索引檢查',
      indexesExist,
      indexesExist ? '所有索引都已創建' : '索引缺失'
    );

    // Test 3: Check file structure
    console.log('\n📋 測試 3：檢查文件結構');
    const filesExist = await checkFilesExist();
    logTest(
      '文件結構檢查',
      filesExist,
      filesExist ? '所有必要文件都存在' : '文件缺失'
    );

    // Print summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 測試總結\n');
    
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const percentage = Math.round((passed / total) * 100);
    
    console.log(`通過：${passed}/${total} (${percentage}%)\n`);
    
    results.forEach(r => {
      const icon = r.passed ? '✅' : '❌';
      console.log(`${icon} ${r.name}`);
    });

    if (passed === total) {
      console.log('\n🎉 所有測試通過！準備進行手動測試。\n');
      console.log('📝 手動測試步驟：');
      console.log('1. 兩個測試帳號都執行 /dev_restart');
      console.log('2. 用戶 A 執行 /throw，輸入："你好"');
      console.log('3. 用戶 B 執行 /catch');
      console.log('4. 檢查 B 是否收到歷史記錄帖子');
      console.log('5. B 回覆："你好呀"');
      console.log('6. 檢查 A 是否收到歷史記錄帖子和新訊息帖子');
      console.log('7. 繼續對話，檢查歷史記錄是否正確累積\n');
    } else {
      console.log('\n❌ 有測試失敗，請檢查上述錯誤。\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ 測試執行失敗:', error);
    process.exit(1);
  }
}

async function checkTablesExist(): Promise<boolean> {
  const { execSync } = await import('child_process');
  
  try {
    const output = execSync(
      'pnpm wrangler d1 execute xunni-db-staging --remote --command="SELECT name FROM sqlite_master WHERE type=\'table\' AND name LIKE \'conversation_%_posts\' ORDER BY name;"',
      { encoding: 'utf-8', cwd: process.cwd() }
    );
    
    return output.includes('conversation_history_posts') && 
           output.includes('conversation_new_message_posts');
  } catch (error) {
    return false;
  }
}

async function checkIndexesExist(): Promise<boolean> {
  const { execSync } = await import('child_process');
  
  try {
    const output = execSync(
      'pnpm wrangler d1 execute xunni-db-staging --remote --command="SELECT name FROM sqlite_master WHERE type=\'index\' AND name LIKE \'idx_%_posts%\' ORDER BY name;"',
      { encoding: 'utf-8', cwd: process.cwd() }
    );
    
    const expectedIndexes = [
      'idx_history_posts_conversation',
      'idx_history_posts_latest',
      'idx_history_posts_identifier',
      'idx_new_message_posts_conversation',
      'idx_new_message_posts_identifier'
    ];
    
    return expectedIndexes.every(idx => output.includes(idx));
  } catch (error) {
    return false;
  }
}

async function checkFilesExist(): Promise<boolean> {
  const fs = await import('fs');
  const path = await import('path');
  
  const requiredFiles = [
    'src/db/migrations/0015_add_conversation_history_posts.sql',
    'src/db/queries/conversation_history_posts.ts',
    'src/domain/conversation_history.ts',
    'src/services/conversation_history.ts',
  ];
  
  return requiredFiles.every(file => {
    const filePath = path.join(process.cwd(), file);
    return fs.existsSync(filePath);
  });
}

// Run tests
testHistoryPostsFeature();

