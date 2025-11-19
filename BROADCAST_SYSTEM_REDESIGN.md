# 廣播系統重新設計方案

## 📋 **目標**
1. 支持成千上萬用戶的大規模廣播
2. 符合 Telegram API 限制（30 msg/sec）
3. 不影響正常漂流瓶推送
4. 可靠、可恢復、可監控

---

## 🏗️ **架構設計**

### 1. **分離式隊列系統**

```
┌─────────────────────────────────────────────────────────┐
│                     Telegram Bot API                     │
│                  (30 messages/second)                    │
└─────────────────────────────────────────────────────────┘
                            ▲
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
┌───────┴────────┐                   ┌─────────┴────────┐
│  High Priority │                   │  Low Priority    │
│  Queue (漂流瓶)│                   │  Queue (廣播)    │
│  Max: 20/sec   │                   │  Max: 10/sec     │
└────────────────┘                   └──────────────────┘
```

### 2. **隊列優先級**

| 優先級 | 類型 | 配額 | 說明 |
|--------|------|------|------|
| **High** | 漂流瓶通知 | 20 msg/sec | 用戶互動，需要即時 |
| **Medium** | 系統通知 | 5 msg/sec | VIP 到期、配額重置 |
| **Low** | 廣播訊息 | 5 msg/sec | 管理員廣播，可延遲 |

### 3. **數據庫 Schema 更新**

```sql
-- 通知隊列表
CREATE TABLE notification_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL CHECK(priority IN ('high', 'medium', 'low')),
  notification_type TEXT NOT NULL, -- 'bottle', 'system', 'broadcast'
  broadcast_id INTEGER, -- 關聯到 broadcasts 表（如果是廣播）
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sending', 'sent', 'failed')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  scheduled_at TEXT, -- 預定發送時間
  sent_at TEXT,
  error_message TEXT,
  FOREIGN KEY (broadcast_id) REFERENCES broadcasts(id)
);

CREATE INDEX idx_queue_status_priority ON notification_queue(status, priority, scheduled_at);
CREATE INDEX idx_queue_broadcast ON notification_queue(broadcast_id);
CREATE INDEX idx_queue_user ON notification_queue(user_id);

-- 廣播表更新（添加分片支持）
ALTER TABLE broadcasts ADD COLUMN chunk_size INTEGER DEFAULT 100;
ALTER TABLE broadcasts ADD COLUMN chunks_total INTEGER DEFAULT 0;
ALTER TABLE broadcasts ADD COLUMN chunks_processed INTEGER DEFAULT 0;
```

---

## 🔄 **工作流程**

### **階段 1：廣播創建**

```typescript
async function createBroadcast(message: string, targetType: string) {
  // 1. 創建廣播記錄
  const broadcastId = await db.insert('broadcasts', {
    message,
    target_type: targetType,
    status: 'pending',
    chunk_size: 100, // 每次處理 100 個用戶
  });

  // 2. 觸發分片處理（異步）
  await triggerBroadcastChunking(broadcastId);
  
  return broadcastId;
}
```

### **階段 2：分片處理（Cron Job）**

```typescript
// 每分鐘執行一次
async function processBroadcastChunking() {
  // 獲取待處理的廣播
  const broadcasts = await db.query(`
    SELECT * FROM broadcasts 
    WHERE status = 'pending' 
    AND chunks_processed < chunks_total
    LIMIT 1
  `);

  for (const broadcast of broadcasts) {
    // 獲取下一批用戶（100 個）
    const offset = broadcast.chunks_processed * broadcast.chunk_size;
    const users = await getTargetUsers(broadcast.target_type, offset, broadcast.chunk_size);

    // 將用戶添加到通知隊列（低優先級）
    for (const user of users) {
      await db.insert('notification_queue', {
        user_id: user.telegram_id,
        message: broadcast.message,
        priority: 'low',
        notification_type: 'broadcast',
        broadcast_id: broadcast.id,
        status: 'pending',
      });
    }

    // 更新進度
    await db.update('broadcasts', broadcast.id, {
      chunks_processed: broadcast.chunks_processed + 1,
      status: broadcast.chunks_processed + 1 >= broadcast.chunks_total ? 'sending' : 'pending',
    });
  }
}
```

### **階段 3：統一發送隊列（Cron Job）**

```typescript
// 每 5 秒執行一次
async function processNotificationQueue() {
  const now = Date.now();
  const rateLimits = {
    high: 20,    // 20 msg/sec
    medium: 5,   // 5 msg/sec
    low: 5,      // 5 msg/sec
  };

  // 按優先級處理
  for (const priority of ['high', 'medium', 'low']) {
    const limit = rateLimits[priority];
    
    // 獲取待發送的通知
    const notifications = await db.query(`
      SELECT * FROM notification_queue
      WHERE status = 'pending'
      AND priority = ?
      AND (scheduled_at IS NULL OR scheduled_at <= ?)
      ORDER BY created_at ASC
      LIMIT ?
    `, [priority, now, limit]);

    // 發送通知
    for (const notif of notifications) {
      try {
        await telegram.sendMessage(notif.user_id, notif.message);
        
        // 標記為已發送
        await db.update('notification_queue', notif.id, {
          status: 'sent',
          sent_at: new Date().toISOString(),
        });

        // 更新廣播進度
        if (notif.broadcast_id) {
          await updateBroadcastProgress(notif.broadcast_id);
        }
      } catch (error) {
        // 處理失敗
        if (notif.retry_count < notif.max_retries) {
          await db.update('notification_queue', notif.id, {
            retry_count: notif.retry_count + 1,
            scheduled_at: new Date(now + 60000).toISOString(), // 1 分鐘後重試
          });
        } else {
          await db.update('notification_queue', notif.id, {
            status: 'failed',
            error_message: error.message,
          });
        }
      }

      // 速率限制：每條消息之間延遲 50ms
      await sleep(50);
    }
  }
}
```

---

## 📊 **性能估算**

### **場景：10,000 用戶廣播**

| 階段 | 時間 | 說明 |
|------|------|------|
| 創建廣播 | < 1 秒 | 立即返回 |
| 分片處理 | 10 分鐘 | 100 個用戶/分鐘 × 100 批次 |
| 發送完成 | 33 分鐘 | 5 msg/sec × 10,000 = 2,000 秒 ≈ 33 分鐘 |
| **總時間** | **~43 分鐘** | 不阻塞其他功能 |

### **場景：100,000 用戶廣播**

| 階段 | 時間 | 說明 |
|------|------|------|
| 創建廣播 | < 1 秒 | 立即返回 |
| 分片處理 | 100 分鐘 | 100 個用戶/分鐘 × 1,000 批次 |
| 發送完成 | 5.5 小時 | 5 msg/sec × 100,000 = 20,000 秒 ≈ 5.5 小時 |
| **總時間** | **~7.2 小時** | 不阻塞其他功能 |

---

## 🛡️ **保護正常功能**

### 1. **優先級保證**
- 漂流瓶通知永遠優先（20 msg/sec）
- 廣播只使用剩餘配額（5 msg/sec）

### 2. **動態速率調整**
```typescript
function calculateAvailableQuota(currentLoad: number): number {
  const totalQuota = 30; // Telegram limit
  const reservedForBottles = 20;
  const availableForBroadcast = totalQuota - reservedForBottles - currentLoad;
  
  return Math.max(0, Math.min(5, availableForBroadcast));
}
```

### 3. **監控和告警**
```typescript
// 監控指標
interface QueueMetrics {
  highPriorityPending: number;
  mediumPriorityPending: number;
  lowPriorityPending: number;
  sendRate: number; // msg/sec
  errorRate: number;
  avgLatency: number; // ms
}

// 告警條件
if (metrics.highPriorityPending > 100) {
  // 暫停低優先級廣播
  pauseLowPriorityQueue();
}
```

---

## 🔧 **實現步驟**

### **Phase 1: 數據庫遷移**
1. 創建 `notification_queue` 表
2. 更新 `broadcasts` 表添加分片欄位

### **Phase 2: 隊列系統**
1. 實現 `NotificationQueue` 服務
2. 實現優先級調度器
3. 實現速率限制器

### **Phase 3: 廣播重構**
1. 重構 `createBroadcast` 使用隊列
2. 實現分片處理 Cron Job
3. 實現統一發送 Cron Job

### **Phase 4: 監控和優化**
1. 添加監控指標
2. 實現告警機制
3. 性能調優

---

## 📈 **優勢**

| 特性 | 當前實現 | 新設計 |
|------|----------|--------|
| **可擴展性** | ❌ 7 用戶 | ✅ 百萬級 |
| **不阻塞** | ❌ 阻塞式 | ✅ 異步分片 |
| **優先級** | ❌ 無 | ✅ 3 級優先級 |
| **速率限制** | ⚠️ 接近超限 | ✅ 嚴格遵守 |
| **可恢復** | ❌ 失敗即停 | ✅ 自動重試 |
| **監控** | ❌ 無 | ✅ 完整指標 |
| **影響正常功能** | ❌ 會影響 | ✅ 不影響 |

---

## 🎯 **建議**

### **短期（當前可用）**
- 保持當前實現用於小規模測試（< 100 用戶）
- 添加用戶數量檢查，超過 100 拒絕廣播

### **中期（1-2 週）**
- 實現基礎隊列系統
- 實現優先級調度

### **長期（1 個月）**
- 完整實現新設計
- 添加監控和告警
- 性能調優

---

## 📚 **參考資料**

- [Telegram Bot API Rate Limits](https://core.telegram.org/bots/faq#broadcasting-to-users)
- [Cloudflare Workers Limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Queue-based Architecture Best Practices](https://aws.amazon.com/message-queue/benefits/)


