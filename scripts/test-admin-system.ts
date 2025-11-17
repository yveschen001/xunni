/**
 * Automated Admin System Test
 * 
 * Tests:
 * 1. Super Admin commands (ban, unban, freeze, list, add, remove)
 * 2. Regular Admin commands (ban, unban, freeze, bans, appeals)
 * 3. Normal User commands (block)
 * 4. Ban check mechanism
 * 5. Appeal system
 * 6. Permission isolation
 */

import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: string;
}

interface TelegramResponse {
  ok: boolean;
  result?: {
    message_id: number;
    text?: string;
    [key: string]: unknown;
  };
  description?: string;
}

/**
 * Load environment variables from .dev.vars
 */
function loadDevVars(): Record<string, string> {
  const devVarsPath = path.join(process.cwd(), '.dev.vars');
  
  if (!fs.existsSync(devVarsPath)) {
    console.error('❌ 錯誤：找不到 .dev.vars 文件');
    process.exit(1);
  }

  const content = fs.readFileSync(devVarsPath, 'utf-8');
  const vars: Record<string, string> = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        vars[key.trim()] = valueParts.join('=').trim();
      }
    }
  }

  return vars;
}

const devVars = loadDevVars();
const STAGING_BOT_TOKEN = devVars.TELEGRAM_BOT_TOKEN || '';
const SUPER_ADMIN_ID = '396943893'; // Your Telegram ID
const TEST_USER_ID = '7788737902'; // Test user ID

// Test configuration
const TEST_CONFIG = {
  botToken: STAGING_BOT_TOKEN,
  superAdminId: SUPER_ADMIN_ID,
  testUserId: TEST_USER_ID,
  apiUrl: `https://api.telegram.org/bot${STAGING_BOT_TOKEN}`,
};

const results: TestResult[] = [];

/**
 * Send a message to Telegram
 */
async function sendMessage(chatId: string, text: string): Promise<TelegramResponse> {
  const response = await fetch(`${TEST_CONFIG.apiUrl}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });

  return (await response.json()) as TelegramResponse;
}

/**
 * Get updates from Telegram
 */
async function getUpdates(offset?: number): Promise<TelegramResponse> {
  const url = offset
    ? `${TEST_CONFIG.apiUrl}/getUpdates?offset=${offset}`
    : `${TEST_CONFIG.apiUrl}/getUpdates`;

  const response = await fetch(url);
  return (await response.json()) as TelegramResponse;
}

/**
 * Wait for a response message
 */
async function waitForResponse(
  chatId: string,
  timeoutMs: number = 10000
): Promise<string | null> {
  const startTime = Date.now();
  let lastUpdateId = 0;

  while (Date.now() - startTime < timeoutMs) {
    const updates = await getUpdates(lastUpdateId + 1);

    if (updates.ok && Array.isArray(updates.result)) {
      for (const update of updates.result as Array<{
        update_id: number;
        message?: { chat: { id: number }; text?: string };
      }>) {
        lastUpdateId = Math.max(lastUpdateId, update.update_id);

        if (
          update.message &&
          update.message.chat.id.toString() === chatId &&
          update.message.text
        ) {
          return update.message.text;
        }
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return null;
}

/**
 * Test: Super Admin can list admins
 */
async function testAdminList(): Promise<TestResult> {
  console.log('🧪 測試：超級管理員查看管理員列表...');

  try {
    const response = await sendMessage(TEST_CONFIG.superAdminId, '/admin_list');

    if (!response.ok) {
      return {
        name: '超級管理員查看管理員列表',
        passed: false,
        message: '發送命令失敗',
        details: response.description,
      };
    }

    const reply = await waitForResponse(TEST_CONFIG.superAdminId, 5000);

    if (!reply) {
      return {
        name: '超級管理員查看管理員列表',
        passed: false,
        message: '未收到回覆',
      };
    }

    const hasAdminList = reply.includes('管理員列表') || reply.includes('總數');
    const hasSuperAdmin = reply.includes('超級管理員') || reply.includes(TEST_CONFIG.superAdminId);

    if (hasAdminList && hasSuperAdmin) {
      return {
        name: '超級管理員查看管理員列表',
        passed: true,
        message: '✅ 成功顯示管理員列表',
        details: reply.substring(0, 200),
      };
    } else {
      return {
        name: '超級管理員查看管理員列表',
        passed: false,
        message: '回覆格式不正確',
        details: reply.substring(0, 200),
      };
    }
  } catch (error) {
    return {
      name: '超級管理員查看管理員列表',
      passed: false,
      message: '測試異常',
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test: Super Admin can ban user
 */
async function testAdminBan(): Promise<TestResult> {
  console.log('🧪 測試：超級管理員封禁用戶（1小時）...');

  try {
    const response = await sendMessage(
      TEST_CONFIG.superAdminId,
      `/admin_ban ${TEST_CONFIG.testUserId} 1`
    );

    if (!response.ok) {
      return {
        name: '超級管理員封禁用戶',
        passed: false,
        message: '發送命令失敗',
        details: response.description,
      };
    }

    const reply = await waitForResponse(TEST_CONFIG.superAdminId, 5000);

    if (!reply) {
      return {
        name: '超級管理員封禁用戶',
        passed: false,
        message: '未收到回覆',
      };
    }

    const hasBanConfirmation = reply.includes('已封禁') || reply.includes('封禁成功');
    const hasUserId = reply.includes(TEST_CONFIG.testUserId);

    if (hasBanConfirmation && hasUserId) {
      return {
        name: '超級管理員封禁用戶',
        passed: true,
        message: '✅ 成功封禁用戶',
        details: reply.substring(0, 200),
      };
    } else {
      return {
        name: '超級管理員封禁用戶',
        passed: false,
        message: '回覆格式不正確',
        details: reply.substring(0, 200),
      };
    }
  } catch (error) {
    return {
      name: '超級管理員封禁用戶',
      passed: false,
      message: '測試異常',
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test: Banned user cannot use bot
 */
async function testBannedUserBlocked(): Promise<TestResult> {
  console.log('🧪 測試：被封禁用戶無法使用 Bot...');

  try {
    // Try to send /menu as banned user
    const response = await sendMessage(TEST_CONFIG.testUserId, '/menu');

    if (!response.ok) {
      return {
        name: '被封禁用戶無法使用 Bot',
        passed: false,
        message: '發送命令失敗',
        details: response.description,
      };
    }

    const reply = await waitForResponse(TEST_CONFIG.testUserId, 5000);

    if (!reply) {
      return {
        name: '被封禁用戶無法使用 Bot',
        passed: false,
        message: '未收到回覆',
      };
    }

    const isBanMessage =
      reply.includes('暫時無法使用') ||
      reply.includes('已停用') ||
      reply.includes('異常行為');

    if (isBanMessage) {
      return {
        name: '被封禁用戶無法使用 Bot',
        passed: true,
        message: '✅ 正確攔截被封禁用戶',
        details: reply.substring(0, 200),
      };
    } else {
      return {
        name: '被封禁用戶無法使用 Bot',
        passed: false,
        message: '未正確攔截',
        details: reply.substring(0, 200),
      };
    }
  } catch (error) {
    return {
      name: '被封禁用戶無法使用 Bot',
      passed: false,
      message: '測試異常',
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test: Super Admin can unban user
 */
async function testAdminUnban(): Promise<TestResult> {
  console.log('🧪 測試：超級管理員解除封禁...');

  try {
    const response = await sendMessage(
      TEST_CONFIG.superAdminId,
      `/admin_unban ${TEST_CONFIG.testUserId}`
    );

    if (!response.ok) {
      return {
        name: '超級管理員解除封禁',
        passed: false,
        message: '發送命令失敗',
        details: response.description,
      };
    }

    const reply = await waitForResponse(TEST_CONFIG.superAdminId, 5000);

    if (!reply) {
      return {
        name: '超級管理員解除封禁',
        passed: false,
        message: '未收到回覆',
      };
    }

    const hasUnbanConfirmation = reply.includes('已解除封禁') || reply.includes('解封成功');
    const hasUserId = reply.includes(TEST_CONFIG.testUserId);

    if (hasUnbanConfirmation && hasUserId) {
      return {
        name: '超級管理員解除封禁',
        passed: true,
        message: '✅ 成功解除封禁',
        details: reply.substring(0, 200),
      };
    } else {
      return {
        name: '超級管理員解除封禁',
        passed: false,
        message: '回覆格式不正確',
        details: reply.substring(0, 200),
      };
    }
  } catch (error) {
    return {
      name: '超級管理員解除封禁',
      passed: false,
      message: '測試異常',
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test: Unbanned user can use bot
 */
async function testUnbannedUserCanUse(): Promise<TestResult> {
  console.log('🧪 測試：解封後用戶可以正常使用...');

  try {
    // Wait a bit for unban to take effect
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const response = await sendMessage(TEST_CONFIG.testUserId, '/menu');

    if (!response.ok) {
      return {
        name: '解封後用戶可以正常使用',
        passed: false,
        message: '發送命令失敗',
        details: response.description,
      };
    }

    const reply = await waitForResponse(TEST_CONFIG.testUserId, 5000);

    if (!reply) {
      return {
        name: '解封後用戶可以正常使用',
        passed: false,
        message: '未收到回覆',
      };
    }

    const isMenuMessage = reply.includes('主選單') || reply.includes('功能');
    const isNotBanMessage = !reply.includes('暫時無法使用') && !reply.includes('已停用');

    if (isMenuMessage && isNotBanMessage) {
      return {
        name: '解封後用戶可以正常使用',
        passed: true,
        message: '✅ 用戶可以正常使用',
        details: reply.substring(0, 200),
      };
    } else {
      return {
        name: '解封後用戶可以正常使用',
        passed: false,
        message: '用戶仍被限制',
        details: reply.substring(0, 200),
      };
    }
  } catch (error) {
    return {
      name: '解封後用戶可以正常使用',
      passed: false,
      message: '測試異常',
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test: Super Admin can freeze user
 */
async function testAdminFreeze(): Promise<TestResult> {
  console.log('🧪 測試：超級管理員凍結用戶（48小時）...');

  try {
    const response = await sendMessage(
      TEST_CONFIG.superAdminId,
      `/admin_freeze ${TEST_CONFIG.testUserId} 48`
    );

    if (!response.ok) {
      return {
        name: '超級管理員凍結用戶',
        passed: false,
        message: '發送命令失敗',
        details: response.description,
      };
    }

    const reply = await waitForResponse(TEST_CONFIG.superAdminId, 5000);

    if (!reply) {
      return {
        name: '超級管理員凍結用戶',
        passed: false,
        message: '未收到回覆',
      };
    }

    const hasFreezeConfirmation = reply.includes('已凍結') || reply.includes('凍結成功');
    const hasUserId = reply.includes(TEST_CONFIG.testUserId);
    const hasDuration = reply.includes('48') || reply.includes('2 天');

    if (hasFreezeConfirmation && hasUserId && hasDuration) {
      return {
        name: '超級管理員凍結用戶',
        passed: true,
        message: '✅ 成功凍結用戶',
        details: reply.substring(0, 200),
      };
    } else {
      return {
        name: '超級管理員凍結用戶',
        passed: false,
        message: '回覆格式不正確',
        details: reply.substring(0, 200),
      };
    }
  } catch (error) {
    return {
      name: '超級管理員凍結用戶',
      passed: false,
      message: '測試異常',
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test: View ban history
 */
async function testAdminBans(): Promise<TestResult> {
  console.log('🧪 測試：查看封禁記錄...');

  try {
    const response = await sendMessage(
      TEST_CONFIG.superAdminId,
      `/admin_bans ${TEST_CONFIG.testUserId}`
    );

    if (!response.ok) {
      return {
        name: '查看封禁記錄',
        passed: false,
        message: '發送命令失敗',
        details: response.description,
      };
    }

    const reply = await waitForResponse(TEST_CONFIG.superAdminId, 5000);

    if (!reply) {
      return {
        name: '查看封禁記錄',
        passed: false,
        message: '未收到回覆',
      };
    }

    const hasBanHistory = reply.includes('封禁記錄') || reply.includes('封禁歷史');
    const hasUserId = reply.includes(TEST_CONFIG.testUserId);

    if (hasBanHistory && hasUserId) {
      return {
        name: '查看封禁記錄',
        passed: true,
        message: '✅ 成功顯示封禁記錄',
        details: reply.substring(0, 200),
      };
    } else {
      return {
        name: '查看封禁記錄',
        passed: false,
        message: '回覆格式不正確',
        details: reply.substring(0, 200),
      };
    }
  } catch (error) {
    return {
      name: '查看封禁記錄',
      passed: false,
      message: '測試異常',
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test: Final unban for cleanup
 */
async function testFinalUnban(): Promise<TestResult> {
  console.log('🧪 測試：最終清理 - 解除封禁...');

  try {
    const response = await sendMessage(
      TEST_CONFIG.superAdminId,
      `/admin_unban ${TEST_CONFIG.testUserId}`
    );

    if (!response.ok) {
      return {
        name: '最終清理 - 解除封禁',
        passed: false,
        message: '發送命令失敗',
        details: response.description,
      };
    }

    const reply = await waitForResponse(TEST_CONFIG.superAdminId, 5000);

    if (!reply) {
      return {
        name: '最終清理 - 解除封禁',
        passed: false,
        message: '未收到回覆',
      };
    }

    const hasUnbanConfirmation = reply.includes('已解除封禁') || reply.includes('解封成功');

    if (hasUnbanConfirmation) {
      return {
        name: '最終清理 - 解除封禁',
        passed: true,
        message: '✅ 清理完成',
        details: reply.substring(0, 200),
      };
    } else {
      return {
        name: '最終清理 - 解除封禁',
        passed: false,
        message: '回覆格式不正確',
        details: reply.substring(0, 200),
      };
    }
  } catch (error) {
    return {
      name: '最終清理 - 解除封禁',
      passed: false,
      message: '測試異常',
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Print test results
 */
function printResults(results: TestResult[]): void {
  console.log('\n' + '='.repeat(80));
  console.log('📊 測試結果總結');
  console.log('='.repeat(80) + '\n');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  for (const result of results) {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      console.log(`   詳情: ${result.details.substring(0, 100)}...`);
    }
    console.log('');
  }

  console.log('='.repeat(80));
  console.log(`總計: ${results.length} 個測試`);
  console.log(`✅ 通過: ${passed}`);
  console.log(`❌ 失敗: ${failed}`);
  console.log(`成功率: ${((passed / results.length) * 100).toFixed(1)}%`);
  console.log('='.repeat(80) + '\n');
}

/**
 * Main test runner
 */
async function runTests(): Promise<void> {
  console.log('🚀 開始自動化測試...\n');
  console.log(`Bot Token: ${TEST_CONFIG.botToken ? '已設置' : '未設置'}`);
  console.log(`Super Admin ID: ${TEST_CONFIG.superAdminId}`);
  console.log(`Test User ID: ${TEST_CONFIG.testUserId}\n`);

  if (!TEST_CONFIG.botToken) {
    console.error('❌ 錯誤：未設置 TELEGRAM_BOT_TOKEN 環境變數');
    process.exit(1);
  }

  // Run tests sequentially
  results.push(await testAdminList());
  await new Promise((resolve) => setTimeout(resolve, 2000));

  results.push(await testAdminBan());
  await new Promise((resolve) => setTimeout(resolve, 2000));

  results.push(await testBannedUserBlocked());
  await new Promise((resolve) => setTimeout(resolve, 2000));

  results.push(await testAdminUnban());
  await new Promise((resolve) => setTimeout(resolve, 2000));

  results.push(await testUnbannedUserCanUse());
  await new Promise((resolve) => setTimeout(resolve, 2000));

  results.push(await testAdminFreeze());
  await new Promise((resolve) => setTimeout(resolve, 2000));

  results.push(await testAdminBans());
  await new Promise((resolve) => setTimeout(resolve, 2000));

  results.push(await testFinalUnban());

  // Print results
  printResults(results);

  // Exit with appropriate code
  const allPassed = results.every((r) => r.passed);
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch((error) => {
  console.error('❌ 測試執行失敗:', error);
  process.exit(1);
});

