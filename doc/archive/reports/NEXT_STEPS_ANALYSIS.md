# 下一步工作分析

## ✅ **封鎖和舉報修復已部署**

- ✅ **已部署到 Staging**
- ✅ **Version**: 264aadcb-8c85-4318-bdea-9f7fe804365a
- ✅ **可以立即測試**

---

## 📊 **上上一個工作狀態檢查**

你問的兩個待辦事項：

### **1. ❌ 測試未完成 - 建議創建獨立測試文件**

**狀態：✅ 可以繼續**

**原因：**
- ✅ 這是一個獨立的測試任務
- ✅ 不依賴其他功能
- ✅ 可以隨時創建

**建議方案：**
```bash
# 創建兩個獨立測試文件
scripts/test-broadcast.ts      # 廣播功能專項測試
scripts/test-maintenance.ts    # 維護模式專項測試

# 添加測試命令到 package.json
pnpm test:broadcast    # 測試廣播功能
pnpm test:maintenance  # 測試維護模式
```

**優先級：** 🟡 中等（建議先完成智能廣播）

---

### **2. ⏳ 智能廣播待實現 - 活躍用戶過濾等功能**

**狀態：⚠️ 需要先執行數據庫 Migration**

**原因：**
- ⚠️ 需要先執行 `0021_add_user_activity_tracking.sql`
- ⚠️ 這個 Migration 添加了必要的欄位：
  - `last_active_at` - 最後活躍時間
  - `bot_status` - Bot 狀態（active/blocked/deleted）
  - `bot_status_updated_at` - 狀態更新時間
  - `failed_delivery_count` - 失敗次數

**依賴關係：**
```
執行 Migration
  ↓
實現用戶活躍度追蹤
  ↓
實現錯誤解析和標記
  ↓
優化廣播目標選擇
  ↓
更新廣播處理邏輯
```

**優先級：** 🔴 高（建議優先完成）

---

## 🎯 **建議的執行順序**

### **方案 A：優先智能廣播** ⭐ **推薦**

**理由：**
- ✅ 智能廣播是核心功能
- ✅ 可以節省 28% 的推送資源
- ✅ 避免推送給無效用戶
- ✅ 符合 Telegram 規定

**步驟：**
1. ✅ 執行數據庫 Migration（5 分鐘）
2. ✅ 實現用戶活躍度追蹤（2 天）
3. ✅ 實現錯誤解析和標記（1 天）
4. ✅ 優化廣播目標選擇（1 天）
5. ✅ 更新廣播處理邏輯（1 天）
6. ✅ 測試和驗證（1 天）

**預計時間：** 6 天

---

### **方案 B：優先測試文件**

**理由：**
- ✅ 快速完成
- ✅ 提高測試覆蓋率
- ✅ 方便後續驗證

**步驟：**
1. ✅ 創建 `scripts/test-broadcast.ts`（2 小時）
2. ✅ 創建 `scripts/test-maintenance.ts`（2 小時）
3. ✅ 更新 `package.json`（10 分鐘）
4. ✅ 測試和驗證（1 小時）

**預計時間：** 0.5 天

---

### **方案 C：並行執行** 🚀 **最快**

**理由：**
- ✅ 測試文件和智能廣播可以並行
- ✅ 測試文件不依賴智能廣播
- ✅ 可以同時推進

**步驟：**
1. ✅ 執行數據庫 Migration（5 分鐘）
2. 🔄 **並行執行：**
   - 左線：實現智能廣播（5 天）
   - 右線：創建測試文件（0.5 天）
3. ✅ 集成測試和驗證（1 天）

**預計時間：** 6 天（但測試文件會提前完成）

---

## 📋 **智能廣播詳細計劃**

### **Phase 1: 數據庫準備（5 分鐘）**

```bash
# 執行 Migration
pnpm wrangler d1 execute xunni-db-staging \
  --remote \
  --file=src/db/migrations/0021_add_user_activity_tracking.sql
```

**添加的欄位：**
- `last_active_at` - 最後活躍時間
- `bot_status` - Bot 狀態
- `bot_status_updated_at` - 狀態更新時間
- `failed_delivery_count` - 失敗次數

---

### **Phase 2: 用戶活躍度追蹤（2 天）**

**創建文件：** `src/services/user_activity.ts`

**功能：**
```typescript
// 更新用戶活躍時間
async function updateUserActivity(db, telegramId) {
  await db.d1
    .prepare(`
      UPDATE users 
      SET last_active_at = CURRENT_TIMESTAMP,
          bot_status = 'active'
      WHERE telegram_id = ?
    `)
    .bind(telegramId)
    .run();
}
```

**集成點：**
- ✅ `/start` - 註冊時
- ✅ `/menu` - 主選單
- ✅ `/catch` - 撿瓶子
- ✅ `/throw` - 丟瓶子
- ✅ `/reply` - 回覆訊息
- ✅ 所有其他用戶互動點

---

### **Phase 3: 錯誤解析和標記（1 天）**

**創建文件：** `src/services/telegram_error_handler.ts`

**功能：**
```typescript
// 解析 Telegram 錯誤類型
function parseErrorType(error: any): 'blocked' | 'deleted' | 'deactivated' | 'other' {
  const errorCode = error.error_code;
  const description = error.description?.toLowerCase() || '';

  // 403: Bot was blocked by the user
  if (errorCode === 403 && description.includes('blocked')) {
    return 'blocked';
  }

  // 400: User not found / Chat not found
  if (errorCode === 400 && (description.includes('not found') || description.includes('deactivated'))) {
    return 'deleted';
  }

  return 'other';
}

// 處理廣播錯誤
async function handleBroadcastError(db, telegramId, error) {
  const errorType = parseErrorType(error);
  
  if (errorType === 'blocked' || errorType === 'deleted') {
    await db.d1
      .prepare(`
        UPDATE users
        SET bot_status = ?,
            bot_status_updated_at = CURRENT_TIMESTAMP,
            failed_delivery_count = failed_delivery_count + 1
        WHERE telegram_id = ?
      `)
      .bind(errorType, telegramId)
      .run();
  }
}
```

---

### **Phase 4: 優化廣播目標選擇（1 天）**

**修改文件：** `src/services/broadcast.ts`

**功能：**
```typescript
// 優化後的目標用戶選擇
async function getTargetUserIds(db, targetType) {
  let query = `
    SELECT telegram_id 
    FROM users 
    WHERE deleted_at IS NULL
      AND bot_status = 'active'
      AND last_active_at >= datetime('now', '-30 days')
  `;

  if (targetType === 'vip') {
    query += ` AND is_vip = 1 AND vip_expires_at > datetime('now')`;
  } else if (targetType === 'non_vip') {
    query += ` AND (is_vip = 0 OR vip_expires_at <= datetime('now'))`;
  }

  const results = await db.d1.prepare(query).all();
  return results.results.map((r: any) => r.telegram_id);
}
```

**優化效果：**
- ✅ 只推送給活躍用戶（30 天內）
- ✅ 跳過已封鎖/刪除的用戶
- ✅ 節省約 28% 的推送資源

---

### **Phase 5: 更新廣播處理邏輯（1 天）**

**修改文件：** `src/services/broadcast.ts`

**功能：**
```typescript
// 發送單條廣播訊息（帶錯誤處理）
async function sendBroadcastMessage(telegram, db, userId, message) {
  try {
    await telegram.sendMessage(userId, message);
    return { success: true };
  } catch (error) {
    // 處理錯誤並標記用戶
    await handleBroadcastError(db, userId, error);
    
    const errorType = parseErrorType(error);
    return { 
      success: false, 
      errorType,
      error: error.description 
    };
  }
}

// 處理廣播（帶統計）
async function processBroadcast(env, broadcastId) {
  // ... 獲取目標用戶 ...
  
  let sentCount = 0;
  let blockedCount = 0;
  let deletedCount = 0;
  let failedCount = 0;

  for (const userId of userIds) {
    const result = await sendBroadcastMessage(telegram, db, userId, message);
    
    if (result.success) {
      sentCount++;
    } else {
      if (result.errorType === 'blocked') blockedCount++;
      else if (result.errorType === 'deleted') deletedCount++;
      else failedCount++;
    }
  }

  // 更新廣播記錄
  await db.d1
    .prepare(`
      UPDATE broadcasts
      SET sent_count = ?,
          blocked_count = ?,
          deleted_count = ?,
          failed_count = ?,
          status = 'completed'
      WHERE id = ?
    `)
    .bind(sentCount, blockedCount, deletedCount, failedCount, broadcastId)
    .run();
}
```

---

### **Phase 6: 測試和驗證（1 天）**

**測試內容：**
1. ✅ 活躍用戶過濾
2. ✅ 錯誤解析和標記
3. ✅ 統計數據準確性
4. ✅ 性能測試

---

## 📊 **測試文件詳細計劃**

### **1. 廣播功能測試**

**文件：** `scripts/test-broadcast.ts`

**測試內容：**
```typescript
// 測試 1: 創建廣播
test('Create broadcast', async () => {
  // 發送 /broadcast 測試訊息
  // 確認廣播創建成功
});

// 測試 2: 查詢廣播狀態
test('Check broadcast status', async () => {
  // 發送 /broadcast_status
  // 確認顯示廣播列表
});

// 測試 3: 取消廣播
test('Cancel broadcast', async () => {
  // 發送 /broadcast_cancel <id>
  // 確認廣播已取消
});

// 測試 4: 安全限制
test('Safety limit (100 users)', async () => {
  // 嘗試廣播給超過 100 用戶
  // 確認被拒絕
});
```

---

### **2. 維護模式測試**

**文件：** `scripts/test-maintenance.ts`

**測試內容：**
```typescript
// 測試 1: 啟用維護模式
test('Enable maintenance mode', async () => {
  // 發送 /maintenance_enable 5 測試
  // 確認維護模式已啟用
});

// 測試 2: 查詢維護狀態
test('Check maintenance status', async () => {
  // 發送 /maintenance_status
  // 確認顯示維護中
});

// 測試 3: 手動關閉維護
test('Disable maintenance mode', async () => {
  // 發送 /maintenance_disable
  // 確認維護模式已關閉
});

// 測試 4: 時長限制
test('Duration validation', async () => {
  // 嘗試設置 1 分鐘（應該失敗）
  // 確認錯誤提示
});

// 測試 5: 自動解除（需要等待）
test('Auto-disable after 5 minutes', async () => {
  // 啟用 5 分鐘維護
  // 等待 5 分鐘
  // 確認自動關閉
});
```

---

## 💡 **我的建議**

### **推薦方案：方案 C（並行執行）**

**理由：**
1. ✅ **智能廣播是核心功能** - 應該優先完成
2. ✅ **測試文件可以快速完成** - 不會影響主線
3. ✅ **並行執行最高效** - 節省時間

**執行計劃：**
```
第 1 天：
  - 執行 Migration（5 分鐘）
  - 創建測試文件（4 小時）
  - 開始實現用戶活躍度追蹤

第 2-3 天：
  - 完成用戶活躍度追蹤
  - 集成到所有用戶互動點

第 4 天：
  - 實現錯誤解析和標記

第 5 天：
  - 優化廣播目標選擇
  - 更新廣播處理邏輯

第 6 天：
  - 測試和驗證
  - 部署到 Staging
```

---

## 🎯 **總結**

### **你的問題回答：**

1. **❌ 測試未完成 - 建議創建獨立測試文件**
   - ✅ **可以繼續**
   - ✅ 不依賴其他功能
   - 🟡 優先級：中等

2. **⏳ 智能廣播待實現 - 活躍用戶過濾等功能**
   - ⚠️ **需要先執行 Migration**
   - ✅ 然後可以繼續
   - 🔴 優先級：高

### **建議：**
- ⭐ **立即執行 Migration**（5 分鐘）
- ⭐ **並行執行測試文件和智能廣播**（6 天）
- ⭐ **智能廣播優先級更高**

**你想要按照這個計劃繼續嗎？** 🚀


