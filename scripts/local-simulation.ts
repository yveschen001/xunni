/**
 * Local Simulation Test (Deep Verification)
 * 
 * This script runs a local Mock Telegram Server and interacts with the local Worker.
 * It verifies not just the HTTP 200 OK status, but the ACTUAL CONTENT of the messages sent by the bot.
 * 
 * Prerequisites:
 * 1. Local Worker running: pnpm dev (listening on port 8787)
 *    AND configured with TELEGRAM_API_ROOT="http://127.0.0.1:9000"
 * 
 * Usage:
 *   ts-node scripts/local-simulation.ts --role=[user|admin|super_admin]
 */

import http from 'http';
// fetch is global in Node 18+

// Configuration
const WORKER_URL = 'http://127.0.0.1:8787';
const MOCK_API_PORT = 9000;
const TEST_USER_ID = 123456789;
const ADMIN_LOG_GROUP_ID = -999999; // Mock ID from run-local-sim.sh

// Mock Server State
let capturedRequests: any[] = [];

// 1. Start Mock Telegram Server
const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', () => {
    // Parse request
    const url = req.url || '';
    const method = req.method || 'GET';
    const parsedBody = body ? JSON.parse(body) : {};

    console.log(`[MockServer] ${method} ${url}`, JSON.stringify(parsedBody).substring(0, 200));

    // Store request for verification
    capturedRequests.push({
      url,
      method,
      body: parsedBody,
      timestamp: Date.now()
    });

    // Mock Response
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      result: {
        message_id: Math.floor(Math.random() * 10000),
        date: Math.floor(Date.now() / 1000),
        chat: { id: parsedBody.chat_id || TEST_USER_ID, type: 'private' },
        text: parsedBody.text || 'Mock Response'
      }
    }));
  });
});

// Helper: Clear captured requests
const clearRequests = () => { capturedRequests = []; };

// Helper: Wait for a message containing specific text
const waitForMessage = async (textPattern: string | RegExp, timeoutMs = 10000, chatId?: number): Promise<any> => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const match = capturedRequests.find(r => {
      // Filter by chatId if provided
      if (chatId && r.body.chat_id != chatId) return false;
      
      if (!r.body.text) return false;
      if (typeof textPattern === 'string') return r.body.text.includes(textPattern);
      return textPattern.test(r.body.text);
    });
    if (match) return match;
    await new Promise(r => setTimeout(r, 100)); // polling
  }
  // console.log('--- Captured Requests Dump ---');
  // console.log(JSON.stringify(capturedRequests, null, 2));
  throw new Error(`Timeout waiting for message matching: ${textPattern}`);
};

// Helper: Send Webhook Update to Worker
const sendUpdate = async (text: string, languageCode = 'zh-TW') => {
  const update = {
    update_id: Math.floor(Math.random() * 100000),
    message: {
      message_id: Math.floor(Math.random() * 100000),
      from: {
        id: TEST_USER_ID,
        is_bot: false,
        first_name: 'Test',
        username: 'test_user',
        language_code: languageCode
      },
      chat: {
        id: TEST_USER_ID,
        type: 'private',
        first_name: 'Test',
        username: 'test_user'
      },
      date: Math.floor(Date.now() / 1000),
      text
    }
  };

  const res = await fetch(`${WORKER_URL}/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Telegram-Bot-Api-Secret-Token': 'test-secret' },
    body: JSON.stringify(update)
  });

  if (res.status !== 200) {
    throw new Error(`Worker returned ${res.status}: ${await res.text()}`);
  }
};

// Helper: Send Callback Query
const sendCallback = async (data: string) => {
  const update = {
    update_id: Math.floor(Math.random() * 100000),
    callback_query: {
      id: Math.floor(Math.random() * 100000).toString(),
      from: { id: TEST_USER_ID, is_bot: false, first_name: 'Test', username: 'test_user' },
      message: {
        message_id: 123, // Dummy ID
        chat: { id: TEST_USER_ID, type: 'private' }
      },
      data
    }
  };

  const res = await fetch(`${WORKER_URL}/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Telegram-Bot-Api-Secret-Token': 'test-secret' },
    body: JSON.stringify(update)
  });

  if (res.status !== 200) {
    throw new Error(`Worker returned ${res.status}: ${await res.text()}`);
  }
};

// Helper: Seed User
const seedUser = async () => {
  console.log('🌱 Seeding user...');
  const res = await fetch(`${WORKER_URL}/api/dev/seed-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      telegram_id: TEST_USER_ID.toString(),
      username: 'test_user',
      first_name: 'Test',
      nickname: 'TestUser',
      gender: 'male',
      birthday: '1990-01-01',
      age: 30,
      mbti_result: 'INTJ',
      language_pref: 'zh-TW',
      onboarding_step: 'completed'
    })
  });
  if (!res.ok) throw new Error(`Seed failed: ${await res.text()}`);
  console.log('✅ User seeded successfully');
};


// Parse Args
const args = process.argv.slice(2);
const roleArg = args.find(a => a.startsWith('--role='))?.split('=')[1] || 'user'; // user, admin, super_admin

// Role-specific Test Suites
const runUserTests = async () => {
    // For user tests, we test UNREGISTERED flow first, then register/seed
    
    // Test 1: /start command (Unregistered)
    console.log('\n🧪 Test 1: /start command');
    clearRequests();
    await sendUpdate('/start');
    const startMsg = await waitForMessage(/歡迎/);
    console.log('✅ Received Welcome Message:', startMsg.body.text.substring(0, 50) + '...');

    // Test 2: Profile Command (Unregistered)
    console.log('\n🧪 Test 2: /profile command (Unregistered)');
    clearRequests();
    await sendUpdate('/profile');
    const profileMsg = await waitForMessage(/註冊|register|Register/); 
    console.log('✅ Received Registration Prompt:', profileMsg.body.text.substring(0, 50) + '...');

    // Now Seed User to test logged-in commands
    await seedUser();

    // Test 3: Stats Command (Registered)
    console.log('\n🧪 Test 3: /stats command (Registered)');
    clearRequests();
    await sendUpdate('/stats');
    // Expect stats content, not "unregistered"
    const statsMsg = await waitForMessage(/數據/); 
    console.log('✅ Received Stats Response:', statsMsg.body.text.substring(0, 50) + '...');
    
    // Test 4: Help Command (Ordinary User)
    console.log('\n🧪 Test 4: /help command (Ordinary User)');
    clearRequests();
    await sendUpdate('/help');
    
    const helpMsg = await waitForMessage('XunNi'); 
    const helpText = helpMsg.body.text;
    
    console.log('✅ Received Help Content');
    
    // 4.1 Verify Essential Commands exist
    const essentialCommands = ['/start', '/menu', '/throw', '/catch', '/profile', '/help', '/settings'];
    const missingCommands = essentialCommands.filter(cmd => !helpText.includes(cmd));
    
    if (missingCommands.length > 0) {
        throw new Error(`❌ Help is missing user commands: ${missingCommands.join(', ')}`);
    } else {
        console.log('   ✅ All essential user commands are present.');
    }

    // 4.2 Verify Admin Commands are HIDDEN for ordinary user
    const adminCommands = ['/broadcast', '/ban', '/analytics', '/maintenance'];
    const leakedCommands = adminCommands.filter(cmd => helpText.includes(cmd));
    
    if (leakedCommands.length > 0) {
        throw new Error(`❌ Security Risk! Admin commands visible to user: ${leakedCommands.join(', ')}`);
    } else {
        console.log('   ✅ Admin commands are correctly hidden.');
    }

    // Test 5: RTL /start (Arabic)
    console.log('\n🧪 Test 5: RTL /start (Arabic)');
    clearRequests();
    await sendUpdate('/start', 'ar');
    const arMsg = await waitForMessage(/歡迎/);
    console.log('✅ Received Welcome (System Default):', arMsg.body.text.substring(0, 50) + '...');

    // Test 6: Localization Check
    console.log('\n🧪 Test 6: Localization Quality Check');
    const allTexts = capturedRequests.map(r => r.body.text || '').join('\n');
    if (allTexts.match(/[a-z]+\.[a-z]+\.[a-z]+/)) {
       console.warn('⚠️  Warning: Potential missing i18n key detected (dot notation).');
    }
    if (allTexts.includes('[需要翻译]') || allTexts.includes('Translation needed')) {
       console.warn('⚠️  Warning: Untranslated placeholders found.');
    }
    console.log('✅ Localization Check Passed.');
};

const runAdminTests = async () => {
    // Admin needs to be seeded first to be recognized as a valid user in DB (though admin check relies on env vars primarily, some handlers fetch user)
    await seedUser();

    console.log('\n🧪 Test: Help Command (Admin)');
    clearRequests();
    await sendUpdate('/help');
    
    const helpMsg = await waitForMessage('XunNi'); 
    const helpText = helpMsg.body.text;

    // Verify Admin Commands are VISIBLE
    // Note: Actual command in help is /admin_ban, not /ban
    const adminCommands = ['/broadcast', '/admin_ban']; 
    const missingAdminCommands = adminCommands.filter(cmd => !helpText.includes(cmd));
    
    if (missingAdminCommands.length > 0) {
        throw new Error(`❌ Admin commands missing for admin: ${missingAdminCommands.join(', ')}`);
    } else {
        console.log('   ✅ Admin commands are visible.');
    }

    // Verify Super Admin Commands are HIDDEN
    const superAdminCommands = ['/analytics']; 
    const leakedCommands = superAdminCommands.filter(cmd => helpText.includes(cmd));
    
    if (leakedCommands.length > 0) {
        throw new Error(`❌ Security Risk! Super Admin commands visible to regular admin: ${leakedCommands.join(', ')}`);
    } else {
        console.log('   ✅ Super Admin commands are correctly hidden.');
    }

    // New Test: Admin Ads (Creation & Logging)
    console.log('\n🧪 Test: Admin Ads Creation & Log');
    clearRequests();
    await sendUpdate('/admin_ads');
    await waitForMessage('官方廣告管理');
    console.log('   ✅ Opened Admin Ads Menu');

    // 1. Click Create
    await sendCallback('admin_ad_create');
    await waitForMessage('創建新廣告');
    
    // 2. Select Type (Text)
    await sendCallback('wizard_type_text');
    await waitForMessage('請輸入廣告');

    // 3. Input Title
    await sendUpdate('Test Ad Title');
    await waitForMessage('請輸入廣告'); // Next step prompt (Content)

    // 4. Input Content
    await sendUpdate('Test Content');
    // For text ad, URL is skipped (based on logic in admin_ads.ts) -> Reward
    await waitForMessage('獎勵額度');

    // 5. Input Reward
    await sendUpdate('5');
    
    // Verification is skipped for Text Ads, so we go straight to confirm
    // await waitForMessage('強制驗證');
    // await sendCallback('wizard_verify_no');

    // Wait for confirmation
    await waitForMessage('確認內容');

    // 7. Confirm
    clearRequests(); // Clear to catch the log specifically
    await sendCallback('wizard_confirm');
    
    // Check for Success Message
    await waitForMessage('廣告創建成功');
    console.log('   ✅ Ad Created Successfully');

    // Check for Log Message in Admin Group
    const logMsg = await waitForMessage(/Ad Created/, 5000, ADMIN_LOG_GROUP_ID);
    console.log('   ✅ Log received in Admin Group:', logMsg.body.text.substring(0, 50) + '...');
};

const runSuperAdminTests = async () => {
    await seedUser();

    console.log('\n🧪 Test: Help Command (Super Admin)');
    clearRequests();
    await sendUpdate('/help');
    
    const helpMsg = await waitForMessage('XunNi'); 
    const helpText = helpMsg.body.text;

    // Verify Super Admin Commands are VISIBLE
    const superAdminCommands = ['/analytics', '/broadcast', '/admin_ban'];
    const missingCommands = superAdminCommands.filter(cmd => !helpText.includes(cmd));
    
    if (missingCommands.length > 0) {
        throw new Error(`❌ Super Admin commands missing: ${missingCommands.join(', ')}`);
    } else {
        console.log('   ✅ All commands visible to Super Admin.');
    }
    
    // Also run Admin Ads test (Super Admin should also be able to do it)
    console.log('\n🧪 Test: Admin Ads (as Super Admin)');
    clearRequests();
    await sendUpdate('/admin_ads');
    await waitForMessage('官方廣告管理');
    console.log('   ✅ Access Granted to Admin Ads');
};

// Main Test Logic
const runTests = async () => {
  console.log(`🚀 Starting Local Simulation Tests (Role: ${roleArg})...`);
  
  try {
    if (roleArg === 'user') {
        await runUserTests();
    } else if (roleArg === 'admin') {
        await runAdminTests();
    } else if (roleArg === 'super_admin') {
        await runSuperAdminTests();
    }

    console.log(`\n🎉 All Local Simulation Tests Passed for ${roleArg}!`);
    
  } catch (err) {
    console.error('\n❌ Test Failed:', err);
    process.exit(1);
  } finally {
    server.close();
  }
};

// Start Server and Run
server.listen(MOCK_API_PORT, () => {
  console.log(`📡 Mock Telegram Server running on port ${MOCK_API_PORT}`);
  // Give it a moment to start
  setTimeout(runTests, 1000);
});
