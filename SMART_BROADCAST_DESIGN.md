# 智能廣播系統設計

## 🎯 **核心理念**

> **只推送給活躍用戶，自動過濾無效用戶，提高送達率和用戶體驗**

---

## 📊 **Telegram API 錯誤碼**

### **常見錯誤及處理**

| 錯誤碼 | 描述 | 原因 | 處理方式 |
|--------|------|------|----------|
| `403 Forbidden` | Bot was blocked by the user | 用戶封鎖了 Bot | ✅ 標記為 `bot_blocked` |
| `400 Bad Request: chat not found` | Chat doesn't exist | 用戶刪除了帳號 | ✅ 標記為 `deleted` |
| `400 Bad Request: user is deactivated` | User account deactivated | 用戶帳號被停用 | ✅ 標記為 `deactivated` |
| `429 Too Many Requests` | Rate limit exceeded | 發送過快 | ⏸️ 暫停並重試 |
| `400 Bad Request: PEER_ID_INVALID` | Invalid user ID | ID 無效 | ✅ 標記為 `invalid` |

### **錯誤處理邏輯**

```typescript
interface TelegramError {
  ok: false;
  error_code: number;
  description: string;
}

function parseErrorType(error: TelegramError): 'blocked' | 'deleted' | 'deactivated' | 'invalid' | 'rate_limit' | 'other' {
  if (error.error_code === 403) return 'blocked';
  if (error.description.includes('chat not found')) return 'deleted';
  if (error.description.includes('user is deactivated')) return 'deactivated';
  if (error.description.includes('PEER_ID_INVALID')) return 'invalid';
  if (error.error_code === 429) return 'rate_limit';
  return 'other';
}
```

---

## 🗄️ **數據庫 Schema**

### **1. 用戶狀態表（新增欄位）**

```sql
-- 在 users 表中添加以下欄位
ALTER TABLE users ADD COLUMN last_active_at TEXT DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN bot_status TEXT DEFAULT 'active' 
  CHECK(bot_status IN ('active', 'blocked', 'deleted', 'deactivated', 'invalid'));
ALTER TABLE users ADD COLUMN bot_status_updated_at TEXT;
ALTER TABLE users ADD COLUMN failed_delivery_count INTEGER DEFAULT 0;

-- 索引
CREATE INDEX idx_users_bot_status ON users(bot_status);
CREATE INDEX idx_users_last_active ON users(last_active_at);
```

### **2. 用戶活躍度定義**

```sql
-- 活躍用戶：最近 30 天有活動
CREATE VIEW active_users AS
SELECT * FROM users
WHERE bot_status = 'active'
  AND last_active_at >= datetime('now', '-30 days')
  AND onboarding_step = 'completed';

-- 休眠用戶：30-90 天沒活動
CREATE VIEW dormant_users AS
SELECT * FROM users
WHERE bot_status = 'active'
  AND last_active_at < datetime('now', '-30 days')
  AND last_active_at >= datetime('now', '-90 days')
  AND onboarding_step = 'completed';

-- 流失用戶：90 天以上沒活動
CREATE VIEW churned_users AS
SELECT * FROM users
WHERE bot_status = 'active'
  AND last_active_at < datetime('now', '-90 days')
  AND onboarding_step = 'completed';
```

---

## 🎯 **智能目標用戶選擇**

### **廣播目標類型（擴展）**

```typescript
type BroadcastTargetType = 
  | 'all'              // 所有活躍用戶
  | 'vip'              // VIP 用戶
  | 'non_vip'          // 非 VIP 用戶
  | 'active'           // 活躍用戶（30 天內）
  | 'dormant'          // 休眠用戶（30-90 天）
  | 'churned'          // 流失用戶（90 天以上）
  | 'new'              // 新用戶（7 天內註冊）
  | 'custom';          // 自定義條件

interface BroadcastOptions {
  targetType: BroadcastTargetType;
  minLastActive?: string;  // 最小活躍時間
  maxLastActive?: string;  // 最大活躍時間
  excludeBlocked?: boolean; // 排除已封鎖用戶（默認 true）
  onlyCompleted?: boolean;  // 只包含完成註冊的（默認 true）
}
```

### **獲取目標用戶（優化版）**

```typescript
async function getTargetUserIds(
  db: DatabaseClient,
  options: BroadcastOptions
): Promise<string[]> {
  let query = `
    SELECT telegram_id 
    FROM users 
    WHERE 1=1
  `;
  const params: any[] = [];

  // 1. 排除無效用戶（默認）
  if (options.excludeBlocked !== false) {
    query += ` AND bot_status = 'active'`;
  }

  // 2. 只包含完成註冊的（默認）
  if (options.onlyCompleted !== false) {
    query += ` AND onboarding_step = 'completed'`;
  }

  // 3. 根據目標類型過濾
  switch (options.targetType) {
    case 'vip':
      query += ` AND is_vip = 1`;
      break;
    case 'non_vip':
      query += ` AND is_vip = 0`;
      break;
    case 'active':
      query += ` AND last_active_at >= datetime('now', '-30 days')`;
      break;
    case 'dormant':
      query += ` AND last_active_at < datetime('now', '-30 days')`;
      query += ` AND last_active_at >= datetime('now', '-90 days')`;
      break;
    case 'churned':
      query += ` AND last_active_at < datetime('now', '-90 days')`;
      break;
    case 'new':
      query += ` AND created_at >= datetime('now', '-7 days')`;
      break;
  }

  // 4. 自定義活躍時間範圍
  if (options.minLastActive) {
    query += ` AND last_active_at >= ?`;
    params.push(options.minLastActive);
  }
  if (options.maxLastActive) {
    query += ` AND last_active_at < ?`;
    params.push(options.maxLastActive);
  }

  const result = await db.d1.prepare(query).bind(...params).all<{ telegram_id: string }>();
  return result.results?.map(r => r.telegram_id) || [];
}
```

---

## 🔄 **自動更新用戶狀態**

### **1. 更新最後活躍時間**

```typescript
// 在所有用戶互動時調用
async function updateUserActivity(db: DatabaseClient, telegramId: string): Promise<void> {
  await db.d1
    .prepare(`
      UPDATE users 
      SET last_active_at = CURRENT_TIMESTAMP 
      WHERE telegram_id = ?
    `)
    .bind(telegramId)
    .run();
}

// 觸發時機：
// - 發送漂流瓶
// - 撿起漂流瓶
// - 發送對話訊息
// - 查看個人資料
// - 任何命令執行
```

### **2. 處理發送錯誤**

```typescript
async function handleBroadcastError(
  db: DatabaseClient,
  telegramId: string,
  error: TelegramError
): Promise<void> {
  const errorType = parseErrorType(error);
  
  // 根據錯誤類型更新用戶狀態
  switch (errorType) {
    case 'blocked':
      await db.d1
        .prepare(`
          UPDATE users 
          SET bot_status = 'blocked',
              bot_status_updated_at = CURRENT_TIMESTAMP,
              failed_delivery_count = failed_delivery_count + 1
          WHERE telegram_id = ?
        `)
        .bind(telegramId)
        .run();
      console.log(`[Broadcast] User ${telegramId} blocked the bot`);
      break;

    case 'deleted':
    case 'deactivated':
    case 'invalid':
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
      console.log(`[Broadcast] User ${telegramId} account ${errorType}`);
      break;

    case 'rate_limit':
      // 不更新狀態，只記錄並重試
      console.warn(`[Broadcast] Rate limit hit for user ${telegramId}`);
      throw error; // 重新拋出以觸發重試
      break;

    case 'other':
      // 累計失敗次數
      await db.d1
        .prepare(`
          UPDATE users 
          SET failed_delivery_count = failed_delivery_count + 1
          WHERE telegram_id = ?
        `)
        .bind(telegramId)
        .run();
      
      // 如果連續失敗 5 次，標記為可疑
      const user = await db.d1
        .prepare(`SELECT failed_delivery_count FROM users WHERE telegram_id = ?`)
        .bind(telegramId)
        .first<{ failed_delivery_count: number }>();
      
      if (user && user.failed_delivery_count >= 5) {
        await db.d1
          .prepare(`
            UPDATE users 
            SET bot_status = 'invalid',
                bot_status_updated_at = CURRENT_TIMESTAMP
            WHERE telegram_id = ?
          `)
          .bind(telegramId)
          .run();
        console.warn(`[Broadcast] User ${telegramId} marked as invalid after 5 failures`);
      }
      break;
  }
}
```

### **3. 自動恢復機制**

```typescript
// 當用戶重新互動時，自動恢復狀態
async function handleUserReactivation(db: DatabaseClient, telegramId: string): Promise<void> {
  const user = await db.d1
    .prepare(`SELECT bot_status FROM users WHERE telegram_id = ?`)
    .bind(telegramId)
    .first<{ bot_status: string }>();

  // 如果用戶之前被標記為 blocked，現在能互動了，說明解除封鎖
  if (user && user.bot_status !== 'active') {
    await db.d1
      .prepare(`
        UPDATE users 
        SET bot_status = 'active',
            bot_status_updated_at = CURRENT_TIMESTAMP,
            failed_delivery_count = 0,
            last_active_at = CURRENT_TIMESTAMP
        WHERE telegram_id = ?
      `)
      .bind(telegramId)
      .run();
    
    console.log(`[User] ${telegramId} reactivated (was ${user.bot_status})`);
  }
}
```

---

## 📊 **統計和監控**

### **用戶狀態統計**

```sql
-- 用戶狀態分布
SELECT 
  bot_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users), 2) as percentage
FROM users
GROUP BY bot_status;

-- 活躍度分布
SELECT 
  CASE 
    WHEN last_active_at >= datetime('now', '-7 days') THEN '7天內'
    WHEN last_active_at >= datetime('now', '-30 days') THEN '30天內'
    WHEN last_active_at >= datetime('now', '-90 days') THEN '90天內'
    ELSE '90天以上'
  END as activity_group,
  COUNT(*) as count
FROM users
WHERE bot_status = 'active'
GROUP BY activity_group;
```

### **廣播效果分析**

```sql
-- 添加到 broadcasts 表
ALTER TABLE broadcasts ADD COLUMN target_user_count INTEGER DEFAULT 0;
ALTER TABLE broadcasts ADD COLUMN blocked_count INTEGER DEFAULT 0;
ALTER TABLE broadcasts ADD COLUMN deleted_count INTEGER DEFAULT 0;
ALTER TABLE broadcasts ADD COLUMN invalid_count INTEGER DEFAULT 0;

-- 廣播效果報告
SELECT 
  id,
  target_type,
  total_users,
  sent_count,
  failed_count,
  blocked_count,
  deleted_count,
  ROUND(sent_count * 100.0 / total_users, 2) as success_rate,
  ROUND((blocked_count + deleted_count) * 100.0 / total_users, 2) as invalid_rate
FROM broadcasts
ORDER BY created_at DESC;
```

---

## 🎯 **實現示例**

### **優化後的廣播處理**

```typescript
async function processBroadcastSmart(env: Env, broadcastId: number): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);

  try {
    const broadcast = await getBroadcast(db, broadcastId);
    if (!broadcast) throw new Error(`Broadcast ${broadcastId} not found`);

    // 更新狀態為發送中
    await updateBroadcastStatus(db, broadcastId, 'sending', new Date().toISOString());

    // 獲取活躍用戶（自動過濾無效用戶）
    const userIds = await getTargetUserIds(db, {
      targetType: broadcast.targetType as any,
      excludeBlocked: true,  // 自動排除已封鎖用戶
      onlyCompleted: true,   // 只包含完成註冊的
    });

    const { batchSize, delayMs } = calculateBatchSize(userIds.length);

    let sentCount = 0;
    let failedCount = 0;
    let blockedCount = 0;
    let deletedCount = 0;
    let invalidCount = 0;

    // 批次發送
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (userId) => {
          try {
            await telegram.sendMessage(parseInt(userId), broadcast.message);
            sentCount++;
            
            // ✅ 成功發送，更新用戶活躍時間
            await updateUserActivity(db, userId);
            
          } catch (error: any) {
            failedCount++;
            
            // ✅ 解析錯誤並更新用戶狀態
            const errorType = parseErrorType(error);
            await handleBroadcastError(db, userId, error);
            
            // 統計不同類型的失敗
            switch (errorType) {
              case 'blocked': blockedCount++; break;
              case 'deleted':
              case 'deactivated': deletedCount++; break;
              case 'invalid': invalidCount++; break;
            }
            
            console.error(`[Broadcast] Failed to send to ${userId}: ${errorType}`);
          }
        })
      );

      // 更新進度（包含詳細統計）
      await db.d1
        .prepare(`
          UPDATE broadcasts 
          SET sent_count = ?,
              failed_count = ?,
              blocked_count = ?,
              deleted_count = ?,
              invalid_count = ?
          WHERE id = ?
        `)
        .bind(sentCount, failedCount, blockedCount, deletedCount, invalidCount, broadcastId)
        .run();

      // 延遲
      if (i + batchSize < userIds.length) {
        await sleep(delayMs);
      }
    }

    // 標記完成
    await updateBroadcastStatus(db, broadcastId, 'completed', undefined, new Date().toISOString());

    console.log(
      `[Broadcast] Completed ${broadcastId}: ` +
      `sent=${sentCount}, failed=${failedCount}, ` +
      `blocked=${blockedCount}, deleted=${deletedCount}, invalid=${invalidCount}`
    );
  } catch (error) {
    console.error(`[Broadcast] Error:`, error);
    await updateBroadcastStatus(
      db,
      broadcastId,
      'failed',
      undefined,
      undefined,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
```

---

## 📈 **效果預估**

### **場景：10,000 用戶系統**

| 指標 | 無優化 | 有優化 | 節省 |
|------|--------|--------|------|
| **總用戶數** | 10,000 | 10,000 | - |
| **封鎖 Bot** | 500 (5%) | 0 | -500 |
| **刪除帳號** | 300 (3%) | 0 | -300 |
| **90天未活躍** | 2,000 (20%) | 0 | -2,000 |
| **實際發送** | 10,000 | 7,200 | **-28%** |
| **發送時間** | 33 分鐘 | 24 分鐘 | **-27%** |
| **成功率** | 72% | 95%+ | **+32%** |

### **長期效益**

1. **節省資源**：減少 28% 的無效發送
2. **提高送達率**：從 72% 提升到 95%+
3. **保護 Bot 聲譽**：避免被 Telegram 標記為垃圾訊息
4. **更好的用戶體驗**：只推送給真正活躍的用戶
5. **精準營銷**：可以針對不同活躍度的用戶定制訊息

---

## 🔧 **實現步驟**

### **Phase 1: 數據庫遷移（1 天）**
1. ✅ 添加 `last_active_at`、`bot_status` 等欄位
2. ✅ 創建索引和視圖
3. ✅ 初始化現有用戶的 `last_active_at`

### **Phase 2: 用戶活躍度追蹤（2 天）**
1. ✅ 在所有用戶互動點添加 `updateUserActivity()`
2. ✅ 實現自動恢復機制
3. ✅ 測試活躍度追蹤

### **Phase 3: 智能廣播（3 天）**
1. ✅ 實現錯誤解析和處理
2. ✅ 優化目標用戶選擇
3. ✅ 添加詳細統計
4. ✅ 測試和驗證

### **Phase 4: 監控和優化（持續）**
1. ✅ 添加監控面板
2. ⚠️ ~~定期清理無效用戶~~ **違反 GDPR，禁止自動刪除**
3. ✅ 優化發送策略
4. ✅ 提供用戶自助刪除功能（需驗證）

---

## 💡 **最佳實踐**

### **1. 活躍度定義**
- **活躍用戶**：30 天內有互動
- **休眠用戶**：30-90 天沒互動（可發喚醒訊息）
- **流失用戶**：90 天以上沒互動（不推送或低頻推送）

### **2. 廣播策略**
- **重要通知**：發給所有活躍用戶
- **功能更新**：發給活躍 + 休眠用戶
- **喚醒活動**：專門發給休眠用戶
- **VIP 優惠**：只發給 VIP 或高活躍用戶

### **3. 頻率控制**
- **活躍用戶**：每週最多 2 次廣播
- **休眠用戶**：每月最多 1 次喚醒訊息
- **流失用戶**：每季度最多 1 次

### **4. 內容優化**
- **個性化**：根據用戶活躍度定制訊息
- **價值導向**：提供有價值的信息，不是純廣告
- **行動號召**：明確的 CTA（Call To Action）

---

## 📚 **參考資料**

- [Telegram Bot API - Error Codes](https://core.telegram.org/bots/api#making-requests)
- [Best Practices for Broadcasting](https://core.telegram.org/bots/faq#broadcasting-to-users)
- [User Engagement Metrics](https://mixpanel.com/blog/user-engagement-metrics/)


