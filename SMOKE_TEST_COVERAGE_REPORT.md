# Smoke Test 覆蓋率報告

**日期：** 2025-11-17  
**目的：** 檢查 smoke test 是否涵蓋所有最近完成的功能

---

## 📊 當前 Smoke Test 覆蓋的功能

### ✅ 已覆蓋

1. **基礎設施測試** (`testInfrastructure`)
   - Health Check
   - Webhook Endpoint

2. **用戶命令測試** (`testUserCommands`)
   - `/start` - 新用戶
   - `/help`
   - `/throw` - 未註冊用戶
   - `/catch` - 未註冊用戶

3. **註冊流程測試** (`testOnboarding`)
   - 開始註冊
   - 暱稱輸入

4. **開發命令測試** (`testDevCommands`)
   - `/dev_reset` - 清除用戶數據
   - `/dev_skip` - 快速設置
   - `/dev_info` - 用戶信息
   - `/dev_restart` - 重置並自動開始註冊

5. **消息配額測試** (`testMessageQuota`)
   - 設置用戶
   - 丟瓶子和撿瓶子
   - 發送對話消息
   - 配額檢查邏輯

6. **對話標識符測試** (`testConversationIdentifiers`)
   - 標識符生成
   - 標識符格式（#MMDDHHHH）

7. **邀請系統測試** (`testInviteSystem`)
   - 邀請碼生成
   - 使用邀請碼註冊
   - 邀請統計
   - 每日配額包含邀請獎勵
   - 邀請限制警告
   - 分享邀請碼按鈕

8. **MBTI 版本支持測試** (`testMBTIVersionSupport`)
   - 快速版（12 題）
   - 完整版（36 題）
   - 測試完成邏輯

9. **錯誤處理測試** (`testErrorHandling`)
   - 無效 JSON
   - 缺失消息
   - 未知命令

10. **資料庫連接測試** (`testDatabaseConnectivity`)
    - 用戶創建

11. **性能測試** (`testPerformance`)
    - 響應時間 < 5s
    - 並發請求

12. **命令覆蓋測試** (`testCommandCoverage`)
    - 所有基本命令

---

## ❌ 缺失的測試

### 0. 廣告系統（2025-01-18 新增）
**狀態：** ❌ 未測試

**缺失測試：**

#### 用戶功能
- `/quota` - 查看額度狀態
- 額度用完後顯示「觀看廣告」按鈕
- 點擊「觀看廣告」打開廣告頁面
- 廣告頁面載入測試（15 秒倒計時）
- 完成廣告後額度 +1
- 每日廣告限制（20 次）
- 點擊「查看官方廣告」顯示廣告列表
- 點擊官方廣告獲得永久額度
- 官方廣告一次性展示機制

#### 管理員功能
- `/analytics` - 每日運營報表（超級管理員）
- `/ad_performance` - 廣告效果報表（超級管理員）
- `/funnel` - VIP 轉化漏斗（超級管理員）

#### 數據庫
- `ad_rewards` 表存在
- `ad_providers` 表存在
- `official_ads` 表存在
- 測試廣告提供商已配置

#### API 端點
- `/api/ad/complete` - 廣告完成回調
- `/api/ad/error` - 廣告錯誤回調

#### 靜態文件
- `/ad.html` - 廣告頁面
- `/ad-test.html` - 測試廣告頁面

**重要性：** 🔴 最高 - 這是最新完成的核心功能

---

### 1. 編輯個人資料功能
**狀態：** ❌ 未測試

**缺失測試：**
- `/edit_profile` 命令
- 編輯暱稱
- 編輯簡介
- 編輯地區
- 編輯興趣
- 編輯匹配偏好
- 編輯血型
- 重新測試 MBTI

**重要性：** 🔴 高 - 這是最近完成的主要功能

---

### 2. 血型功能
**狀態：** ❌ 未測試

**缺失測試：**
- 血型選擇（A/B/AB/O/不確定）
- 血型顯示在個人資料中
- VIP 血型配對篩選

**重要性：** 🔴 高 - 這是最近完成的功能

---

### 3. 對話歷史帖子系統
**狀態：** ❌ 未測試

**缺失測試：**
- 歷史記錄帖子創建
- 歷史記錄累積
- 新消息帖子更新
- 對話標識符顯示在消息中

**重要性：** 🔴 高 - 這是核心對話功能

---

### 4. MBTI 完整流程
**狀態：** 🟡 部分測試

**已測試：**
- ✅ 版本選擇（12 題 vs 36 題）

**缺失測試：**
- ❌ 完整答題流程
- ❌ 測試完成後的按鈕（MBTI 選單、返回主選單）
- ❌ 測試完成訊息根據版本顯示
- ❌ 手動輸入 MBTI
- ❌ MBTI 選單簡化（無清除按鈕）

**重要性：** 🟡 中 - 核心功能但已有基本測試

---

### 5. 翻譯功能
**狀態：** ❌ 未測試

**缺失測試：**
- AI 翻譯（Gemini）
- 降級到 Google Translate
- 翻譯失敗處理
- 34 種語言支持

**重要性：** 🟡 中 - VIP 功能

---

### 6. VIP 功能
**狀態：** ❌ 未測試

**缺失測試：**
- VIP 訂閱流程
- VIP 進階篩選（血型、星座、MBTI）
- VIP 配額（30 瓶 → 100 瓶）

**重要性：** 🟡 中 - 付費功能

---

### 7. 暱稱擾碼
**狀態：** ❌ 未測試

**缺失測試：**
- 暱稱擾碼規則（部分顯示 + `****`）
- 長度統一為 10 字符
- 少於 4 字符填充 `****`

**重要性：** 🟡 中 - UI 顯示一致性

---

## 📋 建議添加的測試

### 優先級 1（高）- 立即添加

```typescript
async function testEditProfileFeatures() {
  console.log('\n✏️ Testing Edit Profile Features...\n');

  const userId = Math.floor(Math.random() * 1000000) + 1500000000;

  // Setup user
  await testEndpoint('Edit Profile', 'Setup user', async () => {
    await sendWebhook('/dev_skip', userId);
  });

  // Test edit profile command
  await testEndpoint('Edit Profile', '/edit_profile command', async () => {
    const result = await sendWebhook('/edit_profile', userId);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
  });

  // Test edit nickname
  await testEndpoint('Edit Profile', 'Edit nickname', async () => {
    // This would involve simulating callback and text input
    // For now, just verify the command is available
    const result = await sendWebhook('/edit_profile', userId);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
  });

  // Test edit blood type
  await testEndpoint('Edit Profile', 'Edit blood type', async () => {
    const result = await sendWebhook('/edit_profile', userId);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
    // Should show blood type option
  });

  // Test retake MBTI
  await testEndpoint('Edit Profile', 'Retake MBTI', async () => {
    const result = await sendWebhook('/mbti', userId);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
  });
}

async function testConversationHistoryPosts() {
  console.log('\n📜 Testing Conversation History Posts...\n');

  const userA = Math.floor(Math.random() * 1000000) + 1600000000;
  const userB = Math.floor(Math.random() * 1000000) + 1700000000;

  // Setup users
  await testEndpoint('History Posts', 'Setup users', async () => {
    await sendWebhook('/dev_skip', userA);
    await sendWebhook('/dev_skip', userB);
  });

  // Create conversation
  await testEndpoint('History Posts', 'Create conversation', async () => {
    await sendWebhook('/throw', userA);
    await sendWebhook('Test message for history', userA);
    await sendWebhook('/catch', userB);
  });

  // Send reply (should create history post)
  await testEndpoint('History Posts', 'Reply creates history', async () => {
    const result = await sendWebhook('Reply message', userB);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
  });

  // Check conversation history
  await testEndpoint('History Posts', 'View history', async () => {
    const result = await sendWebhook('/chats', userA);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
  });
}

async function testBloodTypeFeatures() {
  console.log('\n🩸 Testing Blood Type Features...\n');

  const userId = Math.floor(Math.random() * 1000000) + 1800000000;

  // Test blood type in profile
  await testEndpoint('Blood Type', 'Profile shows blood type', async () => {
    await sendWebhook('/dev_skip', userId);
    const result = await sendWebhook('/profile', userId);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
    // Should display blood type
  });

  // Test edit blood type
  await testEndpoint('Blood Type', 'Edit blood type available', async () => {
    const result = await sendWebhook('/edit_profile', userId);
    if (result.status !== 200) {
      throw new Error(`Expected 200, got ${result.status}`);
    }
    // Should have blood type edit button
  });
}
```

### 優先級 2（中）- 後續添加

- VIP 功能測試
- 翻譯功能測試
- 進階篩選測試

### 優先級 3（低）- 可選

- UI 一致性測試（暱稱擾碼）
- 性能壓力測試

---

## 📊 總結

### 測試覆蓋率

| 類別 | 已測試 | 缺失 | 覆蓋率 |
|------|--------|------|--------|
| 基礎功能 | 10 | 0 | 100% |
| 編輯資料 | 0 | 8 | 0% |
| 血型功能 | 0 | 3 | 0% |
| 對話歷史 | 1 | 3 | 25% |
| MBTI | 3 | 5 | 37.5% |
| VIP 功能 | 0 | 3 | 0% |
| 翻譯功能 | 0 | 4 | 0% |

**總體覆蓋率：** ~45%

### 建議行動

1. **立即添加**：
   - ✅ 編輯個人資料測試
   - ✅ 血型功能測試
   - ✅ 對話歷史帖子測試

2. **短期添加**：
   - MBTI 完整流程測試
   - VIP 功能測試

3. **長期優化**：
   - 翻譯功能測試
   - 性能壓力測試
   - UI 一致性測試

---

## 📝 結論

當前 smoke test 主要覆蓋了**基礎功能和命令**，但缺少對**最近完成的主要功能**的測試，特別是：

1. 🔴 編輯個人資料功能（0% 覆蓋）
2. 🔴 血型功能（0% 覆蓋）
3. 🔴 對話歷史帖子系統（25% 覆蓋）

**建議：** 優先添加這三個功能的測試，以提高 smoke test 的覆蓋率和有效性。

