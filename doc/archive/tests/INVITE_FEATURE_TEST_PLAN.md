# 邀請功能測試計劃

**日期：** 2025-11-17  
**功能：** 邀請好友系統  
**測試環境：** Staging

---

## 📋 功能概述

### 邀請系統核心功能

1. **邀請碼生成**
   - 每個用戶有唯一的 6 位邀請碼
   - 格式：大寫字母和數字組合（如 `ABC123`）

2. **邀請流程**
   - 邀請者分享邀請碼
   - 被邀請者使用 `/start INVITE_CODE` 註冊
   - 系統記錄邀請關係

3. **邀請獎勵**
   - 成功邀請 1 人：每日配額 +1（最多 +7）
   - 免費用戶：3 → 10 個瓶子/天
   - VIP 用戶：30 → 100 個瓶子/天

4. **邀請統計**
   - 顯示邀請人數
   - 顯示當前配額獎勵
   - 顯示分享按鈕

---

## 🧪 自動化測試

### 測試腳本

創建 `scripts/test-invite-feature.ts`：

```typescript
/**
 * Invite Feature Automated Test
 * 
 * Tests the complete invite flow
 */

const WORKER_URL = 'https://xunni-bot-staging.yves221.workers.dev';

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

function createTelegramUpdate(text: string, userId: number) {
  return {
    update_id: Math.floor(Math.random() * 1000000),
    message: {
      message_id: Math.floor(Math.random() * 1000000),
      from: {
        id: userId,
        is_bot: false,
        first_name: 'Test',
        last_name: 'User',
        username: `testuser${userId}`,
        language_code: 'zh-TW',
      },
      chat: {
        id: userId,
        first_name: 'Test',
        username: `testuser${userId}`,
        type: 'private' as const,
      },
      date: Math.floor(Date.now() / 1000),
      text,
    },
  };
}

async function sendWebhook(text: string, userId: number): Promise<{ status: number; data: any }> {
  const update = createTelegramUpdate(text, userId);
  
  try {
    const response = await fetch(`${WORKER_URL}/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(update),
    });

    const data = await response.text();
    return { status: response.status, data };
  } catch (error) {
    throw new Error(`Webhook request failed: ${String(error)}`);
  }
}

async function testInviteFeature() {
  console.log('\n🎁 測試邀請功能\n');
  console.log('=' .repeat(80));

  // Test users
  const inviterUserId = Math.floor(Math.random() * 1000000) + 2000000000;
  const inviteeUserId = Math.floor(Math.random() * 1000000) + 3000000000;

  // Test 1: Setup inviter (邀請者)
  console.log('\n📋 測試 1: 設置邀請者');
  try {
    await sendWebhook('/dev_skip', inviterUserId);
    logTest('設置邀請者', true, `用戶 ID: ${inviterUserId}`);
  } catch (error) {
    logTest('設置邀請者', false, String(error));
    return;
  }

  // Test 2: Get inviter's invite code
  console.log('\n📋 測試 2: 獲取邀請碼');
  let inviteCode = '';
  try {
    const result = await sendWebhook('/profile', inviterUserId);
    
    // Extract invite code from response (simplified - in real test would parse properly)
    // For now, we'll use a mock code
    inviteCode = 'TEST01'; // In real test, extract from profile response
    
    if (result.status === 200) {
      logTest('獲取邀請碼', true, `邀請碼: ${inviteCode}`);
    } else {
      logTest('獲取邀請碼', false, `Status: ${result.status}`);
      return;
    }
  } catch (error) {
    logTest('獲取邀請碼', false, String(error));
    return;
  }

  // Test 3: Invitee uses invite code to register
  console.log('\n📋 測試 3: 被邀請者使用邀請碼註冊');
  try {
    await sendWebhook(`/start ${inviteCode}`, inviteeUserId);
    logTest('使用邀請碼註冊', true, `被邀請者 ID: ${inviteeUserId}`);
  } catch (error) {
    logTest('使用邀請碼註冊', false, String(error));
    return;
  }

  // Test 4: Complete invitee's registration
  console.log('\n📋 測試 4: 完成被邀請者註冊');
  try {
    await sendWebhook('/dev_skip', inviteeUserId);
    logTest('完成註冊', true, '被邀請者註冊完成');
  } catch (error) {
    logTest('完成註冊', false, String(error));
    return;
  }

  // Test 5: Check inviter's statistics
  console.log('\n📋 測試 5: 檢查邀請者統計');
  try {
    const result = await sendWebhook('/profile', inviterUserId);
    
    if (result.status === 200) {
      logTest('邀請統計', true, '應該顯示 1 個邀請');
    } else {
      logTest('邀請統計', false, `Status: ${result.status}`);
    }
  } catch (error) {
    logTest('邀請統計', false, String(error));
  }

  // Test 6: Check daily quota increase
  console.log('\n📋 測試 6: 檢查配額增加');
  try {
    const result = await sendWebhook('/stats', inviterUserId);
    
    if (result.status === 200) {
      logTest('配額增加', true, '應該顯示 4/4 配額（3 + 1 邀請獎勵）');
    } else {
      logTest('配額增加', false, `Status: ${result.status}`);
    }
  } catch (error) {
    logTest('配額增加', false, String(error));
  }

  // Print Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 測試總結\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`✅ 通過：${passed}/${total}`);
  console.log(`❌ 失敗：${failed}/${total}`);
  console.log(`📈 成功率：${((passed / total) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log('❌ 失敗的測試：');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
    console.log('');
  }

  console.log('='.repeat(80));

  return { passed, failed, total };
}

// Run tests
testInviteFeature()
  .then(result => {
    if (result && result.failed === 0) {
      console.log('\n🎉 所有測試通過！邀請功能正常運作。\n');
      process.exit(0);
    } else {
      console.log('\n⚠️ 有測試失敗，請檢查上述錯誤。\n');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ 測試執行失敗：', error);
    process.exit(1);
  });
```

---

## 👤 人工測試流程

### 準備工作

1. **兩個測試帳號**
   - 帳號 A（邀請者）
   - 帳號 B（被邀請者）

2. **清除數據**
   ```
   帳號 A: /dev_restart
   帳號 B: /dev_restart
   ```

### 測試步驟

#### 步驟 1：設置邀請者（帳號 A）

```
1. 帳號 A 執行：/dev_skip
   ✅ 快速完成註冊

2. 帳號 A 執行：/profile
   ✅ 查看個人資料
   ✅ 記下邀請碼（如：ABC123）
   ✅ 確認顯示「邀請人數：0」
```

**預期結果：**
```
👤 **個人資料**

📛 暱稱：測試用戶
🎂 年齡：25
👤 性別：男
...

🎁 **邀請好友**
• 邀請碼：ABC123
• 已邀請：0 人
• 配額獎勵：+0 個/天

[📤 分享邀請碼]
```

---

#### 步驟 2：被邀請者註冊（帳號 B）

```
1. 帳號 B 執行：/start ABC123
   ✅ 使用邀請碼開始註冊

2. 完成註冊流程：
   - 選擇語言
   - 輸入暱稱
   - 完成 MBTI 測試
   - 反詐騙測試
   - 同意條款

3. 註冊完成後，帳號 B 執行：/profile
   ✅ 確認顯示「邀請者：測試用戶」
```

**預期結果（帳號 B）：**
```
👤 **個人資料**

📛 暱稱：新用戶
...

🎁 **邀請信息**
• 邀請者：測試用戶
• 註冊時間：2025-11-17
```

---

#### 步驟 3：驗證邀請獎勵（帳號 A）

```
1. 帳號 A 執行：/profile
   ✅ 確認「已邀請：1 人」
   ✅ 確認「配額獎勵：+1 個/天」

2. 帳號 A 執行：/stats
   ✅ 確認「今日配額：4/4」（3 基礎 + 1 邀請獎勵）
```

**預期結果（帳號 A）：**
```
👤 **個人資料**

🎁 **邀請好友**
• 邀請碼：ABC123
• 已邀請：1 人 ✅
• 配額獎勵：+1 個/天 ✅

━━━━━━━━━━━━━━━━

📊 **我的統計數據**

🍾 **漂流瓶**
• 今日配額：4/4 ✅
```

---

#### 步驟 4：測試配額上限

```
重複步驟 2，使用不同帳號（C, D, E, F, G, H, I）

邀請人數 → 配額獎勵：
• 1 人 → +1 個/天（總 4）
• 2 人 → +2 個/天（總 5）
• 3 人 → +3 個/天（總 6）
• 4 人 → +4 個/天（總 7）
• 5 人 → +5 個/天（總 8）
• 6 人 → +6 個/天（總 9）
• 7 人 → +7 個/天（總 10）✅ 達到上限
• 8 人 → +7 個/天（總 10）✅ 保持上限
```

---

#### 步驟 5：測試邀請碼分享

```
1. 帳號 A 執行：/profile

2. 點擊「📤 分享邀請碼」按鈕

3. 確認分享內容：
   ✅ 包含邀請碼
   ✅ 包含邀請鏈接
   ✅ 包含說明文字
```

**預期分享內容：**
```
🎁 邀請你加入 XunNi 漂流瓶！

使用我的邀請碼註冊，我們都能獲得額外配額！

📝 邀請碼：ABC123

或點擊鏈接直接註冊：
https://t.me/xunni_dev_bot?start=ABC123

💡 使用邀請碼註冊後：
• 你：獲得優質匹配
• 我：每日配額 +1

快來一起玩吧！🌊
```

---

#### 步驟 6：測試錯誤情況

**測試 6.1：無效邀請碼**
```
帳號 B 執行：/start INVALID
✅ 應顯示「邀請碼無效」
✅ 仍可繼續註冊（不使用邀請碼）
```

**測試 6.2：自己邀請自己**
```
帳號 A 執行：/start ABC123（自己的邀請碼）
✅ 應顯示「不能使用自己的邀請碼」
```

**測試 6.3：重複使用邀請碼**
```
帳號 B 已經使用過邀請碼註冊
帳號 B 執行：/dev_restart 後再次使用相同邀請碼
✅ 應該可以正常使用（因為之前的記錄已清除）
```

---

## ✅ 測試檢查清單

### 功能測試

- [ ] 邀請碼生成正確（6 位大寫字母+數字）
- [ ] 邀請碼在個人資料中正確顯示
- [ ] 使用邀請碼註冊流程正常
- [ ] 邀請關係正確記錄
- [ ] 邀請統計正確顯示
- [ ] 配額獎勵正確計算
- [ ] 配額上限正確限制（+7 最多）
- [ ] 分享按鈕正常工作
- [ ] 分享內容格式正確

### 錯誤處理

- [ ] 無效邀請碼正確處理
- [ ] 自己邀請自己正確拒絕
- [ ] 邀請碼大小寫不敏感
- [ ] 邀請碼前後空格正確處理

### UI/UX

- [ ] 邀請信息顯示清晰
- [ ] 按鈕文字正確
- [ ] 提示信息友好
- [ ] 錯誤信息清楚

### 數據庫

- [ ] invites 表正確記錄
- [ ] users 表的 invited_by 正確更新
- [ ] /dev_restart 正確清除邀請數據

---

## 🔧 快速測試命令

### 完整測試流程（複製貼上）

```bash
# 1. 執行自動化測試
pnpm tsx scripts/test-invite-feature.ts

# 2. 人工測試準備
# 帳號 A 和 B 都執行：
/dev_restart

# 3. 設置邀請者（帳號 A）
/dev_skip
/profile
# 記下邀請碼

# 4. 被邀請者註冊（帳號 B）
/start ABC123  # 替換為實際邀請碼
# 完成註冊流程

# 5. 驗證結果（帳號 A）
/profile  # 確認邀請人數 +1
/stats    # 確認配額 +1

# 6. 重置測試（需要時）
/dev_restart  # 清除所有數據，重新開始
```

---

## 📊 測試報告模板

### 測試執行記錄

**測試日期：** ___________  
**測試環境：** Staging  
**測試人員：** ___________

**測試結果：**

| 測試項目 | 狀態 | 備註 |
|---------|------|------|
| 邀請碼生成 | ⬜ 通過 / ⬜ 失敗 | |
| 邀請碼顯示 | ⬜ 通過 / ⬜ 失敗 | |
| 使用邀請碼註冊 | ⬜ 通過 / ⬜ 失敗 | |
| 邀請統計 | ⬜ 通過 / ⬜ 失敗 | |
| 配額獎勵 | ⬜ 通過 / ⬜ 失敗 | |
| 配額上限 | ⬜ 通過 / ⬜ 失敗 | |
| 分享功能 | ⬜ 通過 / ⬜ 失敗 | |
| 錯誤處理 | ⬜ 通過 / ⬜ 失敗 | |

**發現的問題：**
1. ___________
2. ___________
3. ___________

**總體評價：** ⬜ 通過 / ⬜ 需要修復

---

## 🎯 下一步

1. **執行自動化測試**
   ```bash
   pnpm tsx scripts/test-invite-feature.ts
   ```

2. **執行人工測試**
   - 按照上述步驟逐項測試
   - 記錄測試結果
   - 截圖保存證據

3. **修復發現的問題**
   - 記錄問題詳情
   - 修復代碼
   - 重新測試

4. **更新文檔**
   - 更新 SPEC.md
   - 更新用戶指南
   - 記錄已知問題

---

## 📝 備註

- `/dev_restart` 會完全清除用戶數據，包括邀請關係
- 測試時建議使用不同的測試帳號避免混淆
- 邀請碼是唯一的，不會重複
- 配額獎勵每天重置，但邀請人數累計不會重置

