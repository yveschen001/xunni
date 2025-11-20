# 智能配對系統性能優化方案

## 1. 性能挑戰分析

### 1.1 潛在性能瓶頸

**場景**：10 萬+ 用戶在線

| 操作 | 潛在問題 | 影響 |
|------|---------|------|
| 主動配對 | 查詢所有活躍用戶 | 查詢時間過長 |
| 被動配對 | 查詢所有瓶子 | 查詢時間過長 |
| 配對分數計算 | 對每個候選計算分數 | CPU 密集 |
| 數據庫查詢 | 無索引、全表掃描 | I/O 瓶頸 |

### 1.2 性能目標

| 指標 | 目標 | 最大可接受 |
|------|------|-----------|
| 主動配對響應時間 | < 300ms | < 500ms |
| 被動配對響應時間 | < 200ms | < 300ms |
| 數據庫查詢時間 | < 100ms | < 150ms |
| 配對分數計算 | < 50ms | < 100ms |
| 並發處理能力 | 1000 req/s | 500 req/s |

---

## 2. 查詢優化策略

### 2.1 限制查詢筆數（關鍵！）

#### **主動配對查詢限制**

```typescript
// ❌ 錯誤：無限制查詢
const candidates = await db
  .prepare(`
    SELECT *
    FROM users
    WHERE last_active_at > datetime('now', '-1 hour')
      AND is_banned = 0
  `)
  .all();

// ✅ 正確：限制查詢筆數
const MAX_CANDIDATES = 100; // 最多查詢 100 個候選用戶

const candidates = await db
  .prepare(`
    SELECT *
    FROM users
    WHERE last_active_at > datetime('now', '-1 hour')
      AND is_banned = 0
    ORDER BY last_active_at DESC
    LIMIT ?
  `)
  .bind(MAX_CANDIDATES)
  .all();
```

**優化效果**：
- 查詢時間從 O(n) 降低到 O(100)
- 即使有 10 萬用戶在線，只查詢前 100 個

#### **被動配對查詢限制**

```typescript
// ❌ 錯誤：無限制查詢
const candidates = await db
  .prepare(`
    SELECT b.*, u.birthday as owner_birthday
    FROM bottles b
    JOIN users u ON b.owner_id = u.telegram_id
    WHERE b.match_status = 'active'
      AND b.owner_id != ?
  `)
  .bind(userId)
  .all();

// ✅ 正確：限制查詢筆數
const MAX_BOTTLES = 50; // 最多查詢 50 個瓶子

const candidates = await db
  .prepare(`
    SELECT b.*, u.birthday as owner_birthday
    FROM bottles b
    JOIN users u ON b.owner_id = u.telegram_id
    WHERE b.match_status = 'active'
      AND b.owner_id != ?
    ORDER BY b.created_at DESC
    LIMIT ?
  `)
  .bind(userId, MAX_BOTTLES)
  .all();
```

---

### 2.2 分頁查詢策略

當候選數量仍然很大時，使用分頁查詢：

```typescript
interface PaginationConfig {
  pageSize: number;
  maxPages: number;
}

const PAGINATION_CONFIG: PaginationConfig = {
  pageSize: 50,    // 每頁 50 筆
  maxPages: 2,     // 最多查詢 2 頁（共 100 筆）
};

async function findCandidatesWithPagination(
  db: D1Database,
  offset: number,
  limit: number
): Promise<any[]> {
  return await db
    .prepare(`
      SELECT *
      FROM users
      WHERE last_active_at > datetime('now', '-1 hour')
        AND is_banned = 0
      ORDER BY last_active_at DESC
      LIMIT ? OFFSET ?
    `)
    .bind(limit, offset)
    .all();
}
```

---

### 2.3 索引優化

#### **必要索引**

```sql
-- 用戶活躍度索引（最重要！）
CREATE INDEX IF NOT EXISTS idx_users_active_status 
ON users(last_active_at DESC, is_banned);

-- 瓶子狀態索引
CREATE INDEX IF NOT EXISTS idx_bottles_match_status_created 
ON bottles(match_status, created_at DESC);

-- 複合索引：瓶子狀態 + 擁有者
CREATE INDEX IF NOT EXISTS idx_bottles_status_owner 
ON bottles(match_status, owner_id);

-- 用戶語言索引（用於語言預過濾）
CREATE INDEX IF NOT EXISTS idx_users_language 
ON users(language);

-- 用戶年齡索引（用於年齡預過濾）
CREATE INDEX IF NOT EXISTS idx_users_birthday 
ON users(birthday);
```

**索引效果**：
- 查詢時間從 O(n) 降低到 O(log n)
- 10 萬用戶：從 1000ms 降低到 10ms

---

## 3. 預過濾策略

### 3.1 語言預過濾

在計算配對分數前，先按語言過濾：

```typescript
// 優先查找同語言用戶
const sameLanguageCandidates = await db
  .prepare(`
    SELECT *
    FROM users
    WHERE last_active_at > datetime('now', '-1 hour')
      AND is_banned = 0
      AND language = ?
    ORDER BY last_active_at DESC
    LIMIT 50
  `)
  .bind(bottleLanguage)
  .all();

// 如果同語言用戶不足，再查找其他語言
if (sameLanguageCandidates.results.length < 20) {
  const otherLanguageCandidates = await db
    .prepare(`
      SELECT *
      FROM users
      WHERE last_active_at > datetime('now', '-1 hour')
        AND is_banned = 0
        AND language != ?
      ORDER BY last_active_at DESC
      LIMIT 30
    `)
    .bind(bottleLanguage)
    .all();
  
  candidates = [...sameLanguageCandidates.results, ...otherLanguageCandidates.results];
}
```

**優化效果**：
- 優先匹配同語言用戶（100 分）
- 減少不必要的配對分數計算

---

### 3.2 年齡區間預過濾

```typescript
// 計算瓶子擁有者的年齡區間
const ownerAgeRange = getAgeRange(calculateAge(bottle.owner_birthday));

// 優先查找同年齡區間或相鄰區間的用戶
const targetAgeRanges = [ownerAgeRange, ...getAdjacentAgeRanges(ownerAgeRange)];

const candidates = await db
  .prepare(`
    SELECT *
    FROM users
    WHERE last_active_at > datetime('now', '-1 hour')
      AND is_banned = 0
      AND age_range IN (?, ?, ?)
    ORDER BY last_active_at DESC
    LIMIT 50
  `)
  .bind(...targetAgeRanges)
  .all();
```

**注意**：需要在用戶表添加 `age_range` 欄位（冗餘但提高性能）

---

## 4. 緩存策略

### 4.1 活躍用戶池緩存

**問題**：每次主動配對都要查詢活躍用戶

**解決方案**：緩存活躍用戶池

```typescript
interface ActiveUserPool {
  users: User[];
  lastUpdated: number;
  ttl: number; // Time to live (秒)
}

class ActiveUserCache {
  private pool: ActiveUserPool | null = null;
  private readonly TTL = 60; // 60 秒緩存

  async getActiveUsers(db: D1Database): Promise<User[]> {
    const now = Date.now();
    
    // 檢查緩存是否有效
    if (this.pool && (now - this.pool.lastUpdated) < this.pool.ttl * 1000) {
      console.log('[Cache] Using cached active users');
      return this.pool.users;
    }
    
    // 緩存失效，重新查詢
    console.log('[Cache] Refreshing active users');
    const users = await db
      .prepare(`
        SELECT *
        FROM users
        WHERE last_active_at > datetime('now', '-1 hour')
          AND is_banned = 0
        ORDER BY last_active_at DESC
        LIMIT 100
      `)
      .all();
    
    // 更新緩存
    this.pool = {
      users: users.results as User[],
      lastUpdated: now,
      ttl: this.TTL,
    };
    
    return this.pool.users;
  }
  
  // 當用戶活動時，更新緩存
  invalidate() {
    this.pool = null;
  }
}
```

**優化效果**：
- 減少 95% 的數據庫查詢
- 響應時間從 100ms 降低到 5ms

**注意**：Cloudflare Workers 是無狀態的，需要使用 Durable Objects 或 KV 存儲

---

### 4.2 配對分數緩存

對於相同的用戶對，緩存配對分數：

```typescript
interface MatchScoreCache {
  [key: string]: {
    score: MatchScoreBreakdown;
    timestamp: number;
  };
}

function getCacheKey(userId: string, bottleId: number): string {
  return `${userId}:${bottleId}`;
}

async function getMatchScoreWithCache(
  userId: string,
  bottleId: number,
  calculateFn: () => MatchScoreBreakdown
): Promise<MatchScoreBreakdown> {
  const cacheKey = getCacheKey(userId, bottleId);
  const cached = await env.KV.get(cacheKey, 'json');
  
  if (cached && Date.now() - cached.timestamp < 3600000) { // 1 小時緩存
    return cached.score;
  }
  
  const score = calculateFn();
  await env.KV.put(cacheKey, JSON.stringify({ score, timestamp: Date.now() }), {
    expirationTtl: 3600, // 1 小時後過期
  });
  
  return score;
}
```

---

## 5. 配對分數計算優化

### 5.1 提前終止策略

如果某個維度分數太低，提前終止計算：

```typescript
function calculateTotalMatchScoreOptimized(
  user: User,
  bottle: Bottle
): MatchScoreBreakdown | null {
  // 1. 先計算語言分數（權重最高）
  const languageScore = calculateLanguageScore(user.language, bottle.language);
  
  // 如果語言分數太低（< 30），直接放棄
  if (languageScore < 30) {
    return null; // 不計算其他維度
  }
  
  // 2. 計算年齡區間分數
  const ageRangeScore = calculateAgeRangeScore(user.birthday, bottle.owner_birthday);
  
  // 如果年齡區間分數太低（< 40），直接放棄
  if (ageRangeScore < 40) {
    return null;
  }
  
  // 3. 繼續計算其他維度
  const mbtiScore = calculateMBTIScore(user.mbti_result, bottle.mbti_result);
  const zodiacScore = calculateZodiacScore(user.zodiac, bottle.zodiac);
  const bloodTypeScore = calculateBloodTypeScore(user.blood_type, bottle.blood_type);
  
  // ... 計算總分
}
```

**優化效果**：
- 減少 30-50% 的計算量
- 提前過濾不合適的配對

---

### 5.2 批量計算優化

使用 SIMD（單指令多數據）思想，批量計算：

```typescript
function calculateMatchScoresBatch(
  user: User,
  bottles: Bottle[]
): Array<{ bottle: Bottle; score: MatchScoreBreakdown | null }> {
  // 預計算用戶的固定屬性
  const userAge = calculateAge(user.birthday);
  const userAgeRange = getAgeRange(userAge);
  
  return bottles.map(bottle => {
    // 批量計算，減少重複計算
    const score = calculateTotalMatchScoreOptimized(user, bottle);
    return { bottle, score };
  }).filter(item => item.score !== null); // 過濾掉不合適的
}
```

---

## 6. 數據庫查詢優化

### 6.1 使用 JOIN 減少查詢次數

```typescript
// ❌ 錯誤：多次查詢
const bottle = await db.prepare('SELECT * FROM bottles WHERE id = ?').bind(bottleId).first();
const owner = await db.prepare('SELECT * FROM users WHERE telegram_id = ?').bind(bottle.owner_id).first();

// ✅ 正確：一次 JOIN 查詢
const bottleWithOwner = await db
  .prepare(`
    SELECT 
      b.*,
      u.birthday as owner_birthday,
      u.language as owner_language,
      u.mbti_result as owner_mbti,
      u.zodiac as owner_zodiac,
      u.blood_type as owner_blood_type
    FROM bottles b
    JOIN users u ON b.owner_id = u.telegram_id
    WHERE b.id = ?
  `)
  .bind(bottleId)
  .first();
```

**優化效果**：
- 減少 50% 的數據庫查詢次數
- 減少網絡往返時間

---

### 6.2 只查詢需要的欄位

```typescript
// ❌ 錯誤：查詢所有欄位
SELECT * FROM users WHERE ...

// ✅ 正確：只查詢需要的欄位
SELECT 
  telegram_id,
  language,
  mbti_result,
  zodiac,
  blood_type,
  birthday,
  last_active_at
FROM users 
WHERE ...
```

**優化效果**：
- 減少數據傳輸量
- 提高查詢速度

---

## 7. 並發控制

### 7.1 限流策略

防止單個用戶頻繁觸發配對：

```typescript
interface RateLimiter {
  userId: string;
  lastRequest: number;
  requestCount: number;
}

const RATE_LIMIT = {
  maxRequests: 10,      // 最多 10 次
  windowSeconds: 60,    // 60 秒內
  cooldownSeconds: 5,   // 冷卻時間 5 秒
};

async function checkRateLimit(userId: string, env: any): Promise<boolean> {
  const key = `rate_limit:${userId}`;
  const data = await env.KV.get(key, 'json');
  
  const now = Date.now();
  
  if (!data) {
    // 第一次請求
    await env.KV.put(key, JSON.stringify({
      userId,
      lastRequest: now,
      requestCount: 1,
    }), { expirationTtl: RATE_LIMIT.windowSeconds });
    return true;
  }
  
  // 檢查冷卻時間
  if (now - data.lastRequest < RATE_LIMIT.cooldownSeconds * 1000) {
    return false; // 請求太頻繁
  }
  
  // 檢查窗口內請求次數
  if (data.requestCount >= RATE_LIMIT.maxRequests) {
    return false; // 超過限制
  }
  
  // 更新計數
  await env.KV.put(key, JSON.stringify({
    userId,
    lastRequest: now,
    requestCount: data.requestCount + 1,
  }), { expirationTtl: RATE_LIMIT.windowSeconds });
  
  return true;
}
```

---

### 7.2 並發隊列

使用 Cloudflare Queues 處理高並發：

```typescript
// 將配對請求放入隊列
async function queueMatchingRequest(bottleId: number, env: any) {
  await env.MATCHING_QUEUE.send({
    type: 'active_matching',
    bottleId,
    timestamp: Date.now(),
  });
}

// 消費者處理隊列
export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        await processMatchingRequest(message.body, env);
        message.ack();
      } catch (error) {
        console.error('[Queue] Error:', error);
        message.retry();
      }
    }
  },
};
```

---

## 8. 監控與告警

### 8.1 性能監控指標

```typescript
interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: number;
  userId?: string;
  bottleId?: number;
}

async function trackPerformance(
  operation: string,
  fn: () => Promise<any>,
  context?: any
): Promise<any> {
  const start = Date.now();
  
  try {
    const result = await fn();
    const duration = Date.now() - start;
    
    // 記錄性能指標
    await logMetrics({
      operation,
      duration,
      timestamp: start,
      ...context,
    });
    
    // 如果超過閾值，發送告警
    if (duration > 500) {
      await sendAlert({
        type: 'slow_operation',
        operation,
        duration,
        context,
      });
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    await logMetrics({
      operation,
      duration,
      timestamp: start,
      error: error.message,
      ...context,
    });
    throw error;
  }
}

// 使用範例
const match = await trackPerformance(
  'active_matching',
  () => findActiveMatchForBottle(db, bottleId),
  { bottleId }
);
```

---

### 8.2 關鍵指標

| 指標 | 閾值 | 告警級別 |
|------|------|---------|
| 主動配對響應時間 | > 500ms | 警告 |
| 主動配對響應時間 | > 1000ms | 嚴重 |
| 數據庫查詢時間 | > 150ms | 警告 |
| 配對成功率 | < 40% | 警告 |
| 錯誤率 | > 5% | 嚴重 |

---

## 9. 配置參數總結

### 9.1 查詢限制參數

```typescript
const MATCHING_CONFIG = {
  // 主動配對
  activeMatching: {
    maxCandidates: 100,        // 最多查詢 100 個候選用戶
    topCandidates: 5,          // 從前 5 名中隨機選擇
    activeWindowMinutes: 60,   // 1 小時內活躍
  },
  
  // 被動配對
  passiveMatching: {
    maxBottles: 50,            // 最多查詢 50 個瓶子
    smartMatchThreshold: 70,   // 智能推薦閾值
  },
  
  // 性能優化
  performance: {
    cacheEnabled: true,
    cacheTTLSeconds: 60,       // 緩存 60 秒
    rateLimitEnabled: true,
    maxRequestsPerMinute: 10,  // 每分鐘最多 10 次
  },
  
  // 預過濾
  preFiltering: {
    languageEnabled: true,
    ageRangeEnabled: true,
    minLanguageScore: 30,      // 語言分數最低 30
    minAgeRangeScore: 40,      // 年齡區間分數最低 40
  },
};
```

---

## 10. 性能測試計劃

### 10.1 負載測試

| 測試場景 | 並發數 | 目標響應時間 | 目標成功率 |
|---------|--------|-------------|-----------|
| 低負載 | 10 req/s | < 200ms | > 99% |
| 中負載 | 100 req/s | < 300ms | > 98% |
| 高負載 | 500 req/s | < 500ms | > 95% |
| 峰值負載 | 1000 req/s | < 1000ms | > 90% |

### 10.2 壓力測試

```bash
# 使用 k6 進行壓力測試
k6 run --vus 100 --duration 60s matching-load-test.js
```

```javascript
// matching-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export default function () {
  // 測試主動配對
  const res = http.post('https://api.xunni.com/throw', {
    userId: `user_${__VU}`,
    content: 'Test bottle',
  });
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
```

---

## 11. 優化效果預估

### 11.1 優化前 vs 優化後

| 指標 | 優化前 | 優化後 | 改善 |
|------|--------|--------|------|
| 主動配對響應時間 | 2000ms | 300ms | **85% ↓** |
| 被動配對響應時間 | 1500ms | 200ms | **87% ↓** |
| 數據庫查詢時間 | 500ms | 50ms | **90% ↓** |
| 並發處理能力 | 50 req/s | 1000 req/s | **20x ↑** |
| 配對成功率 | 40% | 65% | **62% ↑** |

### 11.2 成本效益

| 項目 | 成本 | 效益 |
|------|------|------|
| 索引優化 | 低（一次性） | 高（90% 查詢加速） |
| 查詢限制 | 低（代碼修改） | 高（85% 響應時間降低） |
| 緩存策略 | 中（KV 存儲費用） | 高（95% 查詢減少） |
| 預過濾 | 低（代碼修改） | 中（30% 計算減少） |
| 並發控制 | 低（代碼修改） | 高（防止過載） |

---

## 12. 實施優先級

### 🔴 第一優先級（必須實施）

1. **查詢限制**：LIMIT 100（主動）、LIMIT 50（被動）
2. **索引優化**：添加必要索引
3. **只查詢需要的欄位**：減少數據傳輸

**預期效果**：響應時間降低 70-80%

### 🟡 第二優先級（強烈建議）

4. **預過濾策略**：語言、年齡區間預過濾
5. **提前終止計算**：低分提前放棄
6. **並發控制**：限流策略

**預期效果**：響應時間再降低 10-15%

### 🟢 第三優先級（可選）

7. **緩存策略**：活躍用戶池緩存
8. **並發隊列**：Cloudflare Queues
9. **性能監控**：告警系統

**預期效果**：響應時間再降低 5-10%

---

## 13. 最終建議

### ✅ 必須做

1. **LIMIT 查詢筆數**（最重要！）
   - 主動配對：LIMIT 100
   - 被動配對：LIMIT 50

2. **添加索引**
   - `idx_users_active_status`
   - `idx_bottles_match_status_created`

3. **監控性能**
   - 響應時間
   - 配對成功率

### 💡 建議做

4. **預過濾**（語言、年齡區間）
5. **限流**（防止濫用）
6. **緩存**（活躍用戶池）

### 🚀 未來可做

7. **機器學習優化**（根據數據調整）
8. **分布式緩存**（Redis）
9. **CDN 加速**（靜態資源）

---

**結論**：通過以上優化，系統可以支持 **10 萬+ 用戶在線**，響應時間保持在 **300ms 以內**，並發處理能力達到 **1000 req/s**。

**最關鍵的優化**：**LIMIT 查詢筆數 + 索引優化**，這兩項可以帶來 **80% 的性能提升**！

