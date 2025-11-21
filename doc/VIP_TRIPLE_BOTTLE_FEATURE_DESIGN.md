# VIP 三倍瓶子功能設計方案

**設計日期**: 2025-11-21  
**狀態**: 📋 設計階段  
**優先級**: 🔴 P1 - VIP 核心權益

---

## 📋 需求概述

### **核心需求**

**VIP 用戶丟一次瓶子，可以觸發 3 個對象：**
1. **1 個主動配對** - 智能匹配最合適的對象
2. **2 個被動等待** - 進入公共池等待被撿

**免費用戶保持不變：** 1 對 1 配對

---

## 🔍 現有系統分析

### **1. 當前瓶子流程**

```
用戶丟瓶子 (/throw)
    ↓
創建 1 個 bottle 記錄
    ↓
status = 'pending'
    ↓
智能匹配（可選）
    ↓
進入公共池等待被撿
    ↓
被撿走後 status = 'matched'
    ↓
創建 conversation 記錄
```

### **2. 核心數據表**

#### **bottles 表**
```sql
CREATE TABLE bottles (
  id INTEGER PRIMARY KEY,
  owner_telegram_id TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending',  -- pending, matched, expired, deleted
  matched_with_telegram_id TEXT,
  match_status TEXT DEFAULT 'pending',  -- pending, matched, active, caught
  created_at TEXT,
  expires_at TEXT
);
```

#### **conversations 表**
```sql
CREATE TABLE conversations (
  id INTEGER PRIMARY KEY,
  user_a_telegram_id TEXT NOT NULL,
  user_b_telegram_id TEXT NOT NULL,
  bottle_id INTEGER NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TEXT
);
```

### **3. 現有 VIP 權益**

| 權益 | 免費用戶 | VIP 用戶 |
|------|---------|---------|
| 每日瓶子配額 | 3 個 | 30 個 |
| MBTI/星座篩選 | ❌ | ✅ |
| 血型配對 | ❌ | ✅ |
| 自動翻譯 | Gemini | OpenAI 優先 |
| 清晰頭像 | ❌ | ✅ |
| 無廣告 | ❌ | ✅ |

---

## 🎯 設計方案

### **方案選擇：複製瓶子法（推薦）** ⭐

#### **核心思路**

**一次丟瓶子 = 創建 3 個瓶子記錄（內容相同）**

```
VIP 用戶丟 1 次瓶子
    ↓
創建 3 個 bottle 記錄（相同內容）
    ↓
Bottle #1: 主動智能匹配 → 立即配對
Bottle #2: 進入公共池 → 等待被撿
Bottle #3: 進入公共池 → 等待被撿
    ↓
最多產生 3 個對話
```

---

### **方案優勢** ✅

1. **最小改動** - 完全復用現有系統
2. **邏輯清晰** - 每個瓶子獨立，互不影響
3. **易於追蹤** - 每個對話對應一個瓶子
4. **穩定可靠** - 不改變核心配對邏輯
5. **易於回滾** - 可以隨時關閉功能
6. **數據一致** - 不需要新的數據表

---

### **方案劣勢** ⚠️

1. **配額消耗** - 需要特殊處理（見下方解決方案）
2. **數據冗餘** - 3 個瓶子存儲相同內容（可接受）

---

## 🛠️ 詳細實施方案

### **Phase 1: 數據庫設計**

#### **1.1 添加瓶子分組標識**

```sql
-- Migration: 0047_add_bottle_group_id.sql
ALTER TABLE bottles 
ADD COLUMN bottle_group_id TEXT DEFAULT NULL;

-- 索引
CREATE INDEX idx_bottles_group_id ON bottles(bottle_group_id);
```

**說明**：
- `bottle_group_id`: UUID，標識同一次丟瓶子產生的多個瓶子
- 免費用戶：`bottle_group_id = NULL`
- VIP 用戶：3 個瓶子共享同一個 `bottle_group_id`

#### **1.2 添加瓶子角色標識**

```sql
-- Migration: 0047_add_bottle_group_id.sql (續)
ALTER TABLE bottles 
ADD COLUMN bottle_role TEXT DEFAULT 'single';

-- bottle_role 可能值：
-- 'single': 單一瓶子（免費用戶）
-- 'primary': 主動配對瓶子（VIP 第 1 個）
-- 'secondary': 被動等待瓶子（VIP 第 2、3 個）
```

---

### **Phase 2: 核心邏輯修改**

#### **2.1 修改 `handleThrow` 函數**

**文件**: `src/telegram/handlers/throw.ts`

```typescript
// 在 processBottleContent 中
export async function processBottleContent(
  user: User, 
  content: string, 
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = parseInt(user.telegram_id);

  // ... 現有驗證邏輯 ...

  // 檢查是否為 VIP
  const isVip = !!(
    user.is_vip &&
    user.vip_expire_at &&
    new Date(user.vip_expire_at) > new Date()
  );

  // 🆕 VIP 三倍瓶子邏輯
  if (isVip) {
    await createTripleBottles(db, user, bottleInput, env);
  } else {
    // 免費用戶：單一瓶子（現有邏輯）
    await createSingleBottle(db, user, bottleInput, env);
  }

  // 只增加 1 次配額計數（重要！）
  await incrementDailyThrowCount(db, user.telegram_id);

  // 成功訊息
  await telegram.sendMessage(
    chatId,
    isVip
      ? '✨ VIP 特權！你的瓶子已發送給 3 個對象：\n\n' +
        '🎯 1 個智能配對對象\n' +
        '🌊 2 個公共池等待對象\n\n' +
        '💬 你可能會收到最多 3 個對話！'
      : '✅ 瓶子已丟出！等待有緣人撿起...'
  );
}
```

---

#### **2.2 創建三倍瓶子函數**

**文件**: `src/domain/bottle.ts`（新增）

```typescript
/**
 * Create triple bottles for VIP users
 */
export async function createTripleBottles(
  db: DatabaseClient,
  user: User,
  bottleInput: ThrowBottleInput,
  env: Env
): Promise<void> {
  const groupId = crypto.randomUUID();
  
  // 1. 創建主動配對瓶子
  const primaryBottleId = await createBottle(db, user.telegram_id, {
    ...bottleInput,
    bottle_group_id: groupId,
    bottle_role: 'primary',
  });
  
  // 2. 創建 2 個被動等待瓶子
  const secondaryBottle1Id = await createBottle(db, user.telegram_id, {
    ...bottleInput,
    bottle_group_id: groupId,
    bottle_role: 'secondary',
  });
  
  const secondaryBottle2Id = await createBottle(db, user.telegram_id, {
    ...bottleInput,
    bottle_group_id: groupId,
    bottle_role: 'secondary',
  });
  
  // 3. 主動配對第一個瓶子
  const { findActiveMatchForBottle } = await import('~/services/smart_matching');
  const matchResult = await findActiveMatchForBottle(db.d1, primaryBottleId);
  
  if (matchResult && matchResult.user) {
    // 配對成功，創建對話
    await handleSmartMatch(db, env, primaryBottleId, matchResult);
  }
  
  // 4. 另外 2 個瓶子進入公共池（自動）
  // 不需要額外操作，它們的 status = 'pending' 會自動被 /catch 找到
}
```

---

#### **2.3 修改配額檢查邏輯**

**關鍵點**: VIP 丟 1 次瓶子創建 3 個記錄，但只消耗 1 個配額

**文件**: `src/db/queries/bottles.ts`

```typescript
/**
 * Get daily throw count
 * 🆕 只計算 bottle_group_id 的唯一數量（VIP）或總數（免費）
 */
export async function getDailyThrowCount(
  db: DatabaseClient,
  userId: string
): Promise<number> {
  // 查詢今天丟的瓶子
  const result = await db.d1
    .prepare(
      `SELECT 
        CASE 
          WHEN bottle_group_id IS NOT NULL 
          THEN COUNT(DISTINCT bottle_group_id)  -- VIP: 按組計數
          ELSE COUNT(*)                         -- 免費: 按瓶子計數
        END as count
       FROM bottles
       WHERE owner_telegram_id = ?
         AND DATE(created_at) = DATE('now')
         AND deleted_at IS NULL`
    )
    .bind(userId)
    .first();

  return (result?.count as number) || 0;
}
```

---

### **Phase 3: 配對邏輯優化**

#### **3.1 避免重複配對**

**問題**: 同一個人可能撿到同一個 VIP 用戶的 3 個瓶子

**解決方案**: 在 `findMatchingBottle` 中排除已配對的用戶

**文件**: `src/db/queries/bottles.ts`

```typescript
export async function findMatchingBottle(
  db: DatabaseClient,
  userId: string,
  userGender: string,
  userAge: number,
  userZodiac: string,
  userMbti: string,
  userBloodType?: string | null
): Promise<Bottle | null> {
  const results = await db.d1
    .prepare(
      `SELECT b.* FROM bottles b
       WHERE b.status = 'pending'
         AND datetime(b.expires_at) > datetime('now')
         AND b.owner_telegram_id != ?
         AND (b.target_gender = ? OR b.target_gender = 'any')
         -- 🆕 排除已經配對過的用戶（同組瓶子）
         AND NOT EXISTS (
           SELECT 1 FROM conversations c
           JOIN bottles b2 ON c.bottle_id = b2.id
           WHERE c.user_a_telegram_id = ?
             AND c.user_b_telegram_id = b.owner_telegram_id
             AND b2.bottle_group_id = b.bottle_group_id
             AND b2.bottle_group_id IS NOT NULL
         )
         -- ... 其他現有條件 ...
       ORDER BY RANDOM()
       LIMIT 50`
    )
    .bind(userId, userGender, userId)
    .all();

  // ... 現有過濾邏輯 ...
}
```

---

### **Phase 4: UI/UX 優化**

#### **4.1 VIP 權益說明更新**

**文件**: `src/telegram/handlers/vip.ts`

```typescript
const vipBenefits = 
  `🎁 VIP 權益：\n` +
  `• 🆕 三倍曝光機會！一次丟瓶子觸發 3 個對象\n` +
  `  - 1 個智能配對對象（主動）\n` +
  `  - 2 個公共池對象（被動）\n` +
  `• 解鎖對方清晰頭像\n` +
  `• 每天 30 個漂流瓶配額\n` +
  `• 可篩選 MBTI 和星座\n` +
  `• 34 種語言自動翻譯（OpenAI 優先）\n` +
  `• 無廣告體驗\n`;
```

#### **4.2 丟瓶子成功訊息**

```typescript
// VIP 用戶
const vipSuccessMessage = 
  `✨ **VIP 特權啟動！**\n\n` +
  `你的瓶子已發送給 **3 個對象**：\n\n` +
  `🎯 **1 個智能配對** - 已為你找到最合適的對象\n` +
  `🌊 **2 個公共池** - 等待其他用戶撿起\n\n` +
  `💬 你可能會收到 **最多 3 個對話**！\n` +
  `📊 今日剩餘配額：${remaining} / ${quota}\n\n` +
  `💡 提示：每個對話都是獨立的，可以同時進行`;

// 免費用戶（不變）
const freeSuccessMessage = 
  `✅ 瓶子已丟出！\n\n` +
  `🌊 等待有緣人撿起...\n` +
  `📊 今日剩餘配額：${remaining} / ${quota}\n\n` +
  `💎 升級 VIP 可獲得三倍曝光機會！\n` +
  `使用 /vip 了解更多`;
```

#### **4.3 Help 命令更新**

**文件**: `src/telegram/handlers/help.ts`

```typescript
const vipFeatures = 
  `💎 **VIP 特權**\n\n` +
  `• 🆕 **三倍曝光** - 一次丟瓶子觸發 3 個對象\n` +
  `• 🎯 **智能配對** - 自動找到最合適的對象\n` +
  `• 📸 **清晰頭像** - 查看對方真實頭像\n` +
  `• 📦 **更多配額** - 每天 30 個瓶子\n` +
  `• 🎨 **進階篩選** - MBTI、星座、血型\n` +
  `• 🌍 **智能翻譯** - 34 種語言 OpenAI 翻譯\n` +
  `• 🚫 **無廣告** - 純淨體驗\n\n` +
  `使用 /vip 立即升級`;
```

---

### **Phase 5: 統計和追蹤**

#### **5.1 瓶子組統計**

**文件**: `src/telegram/handlers/stats.ts`

```typescript
// 統計 VIP 三倍瓶子效果
const bottleGroupStats = await db.d1
  .prepare(
    `SELECT 
       COUNT(DISTINCT bottle_group_id) as vip_throws,
       COUNT(*) as total_bottles,
       COUNT(CASE WHEN status = 'matched' THEN 1 END) as matched_bottles
     FROM bottles
     WHERE owner_telegram_id = ?
       AND bottle_group_id IS NOT NULL
       AND DATE(created_at) >= DATE('now', '-30 days')`
  )
  .bind(userId)
  .first();

// 顯示在統計中
const vipStats = 
  `📊 **VIP 三倍瓶子統計**（近 30 天）\n\n` +
  `🎯 丟出次數：${bottleGroupStats.vip_throws}\n` +
  `📦 總瓶子數：${bottleGroupStats.total_bottles}\n` +
  `💬 成功配對：${bottleGroupStats.matched_bottles}\n` +
  `📈 配對率：${(bottleGroupStats.matched_bottles / bottleGroupStats.total_bottles * 100).toFixed(1)}%`;
```

---

## 🔄 完整流程圖

### **VIP 用戶流程**

```
VIP 用戶輸入瓶子內容
    ↓
檢查配額（只檢查 1 次）
    ↓
創建 3 個瓶子記錄
    ├─ Bottle #1 (primary)
    │   ↓
    │   智能匹配
    │   ↓
    │   找到對象 → 創建對話
    │
    ├─ Bottle #2 (secondary)
    │   ↓
    │   進入公共池
    │   ↓
    │   等待被撿 → 創建對話
    │
    └─ Bottle #3 (secondary)
        ↓
        進入公共池
        ↓
        等待被撿 → 創建對話
    ↓
配額 -1（只減 1 次）
    ↓
顯示成功訊息
```

### **免費用戶流程（不變）**

```
免費用戶輸入瓶子內容
    ↓
檢查配額
    ↓
創建 1 個瓶子記錄
    ↓
進入公共池
    ↓
等待被撿 → 創建對話
    ↓
配額 -1
    ↓
顯示成功訊息
```

---

## 📊 數據庫 Schema 變更

### **Migration 0047**

```sql
-- 0047_add_bottle_group_id.sql

-- 添加瓶子分組 ID
ALTER TABLE bottles 
ADD COLUMN bottle_group_id TEXT DEFAULT NULL;

-- 添加瓶子角色
ALTER TABLE bottles 
ADD COLUMN bottle_role TEXT DEFAULT 'single';
-- 'single': 單一瓶子（免費用戶）
-- 'primary': 主動配對瓶子（VIP）
-- 'secondary': 被動等待瓶子（VIP）

-- 創建索引
CREATE INDEX idx_bottles_group_id ON bottles(bottle_group_id);
CREATE INDEX idx_bottles_role ON bottles(bottle_role);
CREATE INDEX idx_bottles_group_status ON bottles(bottle_group_id, status);
```

---

## 🧪 測試計劃

### **單元測試**

1. ✅ 測試 VIP 用戶創建 3 個瓶子
2. ✅ 測試免費用戶創建 1 個瓶子
3. ✅ 測試配額只減 1 次
4. ✅ 測試 `bottle_group_id` 正確設置
5. ✅ 測試避免重複配對邏輯
6. ✅ 測試配額統計正確性

### **集成測試**

1. ✅ VIP 用戶丟瓶子 → 收到 3 個對話
2. ✅ 免費用戶丟瓶子 → 收到 1 個對話
3. ✅ 同一用戶不會撿到同組的多個瓶子
4. ✅ 配額統計正確
5. ✅ VIP 到期後恢復為單一瓶子

### **Smoke Test**

```typescript
async function testVipTripleBottle() {
  // 1. VIP 用戶丟瓶子
  const vipUser = createTestVipUser();
  await sendWebhook('/throw', vipUser.id);
  
  // 2. 驗證創建了 3 個瓶子
  const bottles = await getBottlesByUser(vipUser.id);
  expect(bottles.length).toBe(3);
  expect(bottles[0].bottle_group_id).toBe(bottles[1].bottle_group_id);
  
  // 3. 驗證配額只減 1
  const throwCount = await getDailyThrowCount(db, vipUser.id);
  expect(throwCount).toBe(1);
  
  // 4. 驗證可以收到最多 3 個對話
  // ... 測試邏輯 ...
}
```

---

## ⚠️ 風險和注意事項

### **1. 配額消耗問題** ✅ 已解決

**風險**: VIP 創建 3 個瓶子可能被計為 3 次

**解決**: 修改 `getDailyThrowCount` 使用 `COUNT(DISTINCT bottle_group_id)`

### **2. 重複配對問題** ✅ 已解決

**風險**: 同一用戶可能撿到同組的多個瓶子

**解決**: 在 `findMatchingBottle` 中排除已配對的同組瓶子

### **3. 數據冗餘** ⚠️ 可接受

**風險**: 3 個瓶子存儲相同內容

**評估**: 
- 存儲成本低（文字內容）
- 查詢性能影響小
- 邏輯清晰度高
- **結論**: 可接受的權衡

### **4. 配對率影響** ⚠️ 需監控

**風險**: VIP 瓶子增多可能影響免費用戶配對率

**緩解**: 
- 監控配對率數據
- 必要時調整配對算法權重
- 考慮限制 VIP 瓶子在公共池的比例

---

## 📈 預期效果

### **對 VIP 用戶**

- ✅ **3 倍曝光機會** - 大幅提升配對成功率
- ✅ **更快配對** - 主動智能匹配
- ✅ **更多選擇** - 最多 3 個對話同時進行
- ✅ **價值感提升** - VIP 權益更明顯

### **對免費用戶**

- ✅ **配對機會增加** - 公共池瓶子更多
- ✅ **升級動機** - 看到 VIP 優勢
- ⚠️ **需監控** - 確保配對率不下降

### **對平台**

- ✅ **VIP 轉化率提升** - 權益更吸引人
- ✅ **用戶活躍度提升** - 更多對話
- ✅ **收入增長** - VIP 訂閱增加

---

## 🚀 實施優先級

### **P0 - 核心功能（必須）**

1. ✅ 數據庫 Migration（`bottle_group_id`, `bottle_role`）
2. ✅ 三倍瓶子創建邏輯
3. ✅ 配額統計修正
4. ✅ 避免重複配對邏輯

### **P1 - UI/UX（重要）**

5. ✅ VIP 權益說明更新
6. ✅ 成功訊息優化
7. ✅ Help 命令更新

### **P2 - 統計和監控（建議）**

8. ✅ 瓶子組統計
9. ✅ 配對率監控
10. ✅ VIP 效果分析

---

## 📝 實施檢查清單

### **開發階段**

- [ ] 創建 Migration 0047
- [ ] 修改 `createBottle` 函數支持 `bottle_group_id` 和 `bottle_role`
- [ ] 創建 `createTripleBottles` 函數
- [ ] 修改 `processBottleContent` 函數
- [ ] 修改 `getDailyThrowCount` 函數
- [ ] 修改 `findMatchingBottle` 函數（避免重複配對）
- [ ] 更新 VIP 權益說明
- [ ] 更新成功訊息
- [ ] 更新 Help 命令
- [ ] 添加瓶子組統計

### **測試階段**

- [ ] 單元測試（10 項）
- [ ] 集成測試（5 項）
- [ ] Smoke Test
- [ ] 手動測試（VIP 和免費用戶）

### **部署階段**

- [ ] Staging 部署
- [ ] Staging 測試
- [ ] Production Migration
- [ ] Production 部署
- [ ] 監控配對率
- [ ] 收集用戶反饋

---

## 🎯 成功指標

### **技術指標**

- ✅ VIP 用戶每次丟瓶子創建 3 個記錄
- ✅ 配額統計正確（只計 1 次）
- ✅ 無重複配對
- ✅ 系統穩定性 99.9%+

### **業務指標**

- 🎯 VIP 轉化率提升 30%+
- 🎯 VIP 用戶配對成功率提升 50%+
- 🎯 VIP 用戶活躍度提升 40%+
- 🎯 免費用戶配對率保持 90%+

---

## 💡 未來優化方向

### **Phase 2 功能**

1. **動態瓶子數量** - VIP 可選擇 1-5 個對象
2. **瓶子優先級** - 付費用戶瓶子優先展示
3. **配對偏好** - 用戶可設置主動/被動比例
4. **A/B 測試** - 測試不同瓶子數量的效果

### **數據分析**

1. **配對漏斗分析** - 每個瓶子的配對路徑
2. **用戶行為分析** - VIP vs 免費用戶對比
3. **收入歸因** - 三倍瓶子對 VIP 轉化的影響

---

## 📚 相關文檔

- `doc/SPEC.md` - 專案規格書
- `src/telegram/handlers/throw.ts` - 丟瓶子處理
- `src/db/queries/bottles.ts` - 瓶子查詢
- `src/services/smart_matching.ts` - 智能匹配
- `VIP_SYSTEM_COMPLETE_DESIGN.md` - VIP 系統設計

---

## ✅ 總結

### **設計優勢**

1. ✅ **最小改動** - 完全復用現有系統
2. ✅ **邏輯清晰** - 每個瓶子獨立
3. ✅ **易於測試** - 單元測試簡單
4. ✅ **易於回滾** - 可隨時關閉
5. ✅ **穩定可靠** - 不破壞現有功能

### **核心價值**

- 🎯 **VIP 權益大幅提升** - 3 倍曝光機會
- 🎯 **用戶體驗優化** - 更快配對，更多選擇
- 🎯 **商業價值提升** - VIP 轉化率和收入增長

---

**準備好進入開發階段！** 🚀

