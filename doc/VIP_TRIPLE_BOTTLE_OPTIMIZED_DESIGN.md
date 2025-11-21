# VIP 三倍瓶子功能 - 優化設計方案 v2.0

**設計日期**: 2025-11-21  
**版本**: v2.0 - 優化版  
**狀態**: 📋 設計階段  
**優先級**: 🔴 P1 - VIP 核心權益

---

## 🔄 設計方案對比

### **方案 A：複製瓶子法（初版）**

```
一次丟瓶子 = 創建 3 個 bottle 記錄（內容相同）
```

**優點**: ✅ 最簡單，完全復用現有邏輯  
**缺點**: ⚠️ 數據冗餘（3 倍存儲）

---

### **方案 B：狀態標記法（優化版）** ⭐⭐⭐⭐⭐

```
一次丟瓶子 = 創建 1 個 bottle 記錄 + 3 個配對狀態標記
```

**優點**: 
- ✅ 無數據冗餘
- ✅ 存儲效率高
- ✅ 邏輯更清晰
- ✅ 易於擴展

**缺點**: 
- ⚠️ 需要新表（但很簡單）

---

## 🎯 推薦方案：狀態標記法

### **核心思路**

**1 個瓶子 + 3 個配對槽位（slots）**

```
VIP 用戶丟 1 次瓶子
    ↓
創建 1 個 bottle 記錄
    ↓
創建 3 個 bottle_match_slots 記錄
    ├─ Slot #1: role='primary', status='pending'
    ├─ Slot #2: role='secondary', status='pending'
    └─ Slot #3: role='secondary', status='pending'
    ↓
Slot #1 主動智能匹配 → 配對成功 → status='matched'
Slot #2 進入公共池 → 等待被撿 → status='matched'
Slot #3 進入公共池 → 等待被撿 → status='matched'
    ↓
最多產生 3 個對話
```

---

## 📊 數據庫設計（優化版）

### **新增表：bottle_match_slots**

```sql
-- Migration: 0047_create_bottle_match_slots.sql

CREATE TABLE IF NOT EXISTS bottle_match_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bottle_id INTEGER NOT NULL,
  slot_role TEXT NOT NULL,  -- 'primary' (主動) or 'secondary' (被動)
  slot_index INTEGER NOT NULL,  -- 1, 2, 3
  status TEXT DEFAULT 'pending',  -- pending, matched, expired
  matched_with_telegram_id TEXT,
  conversation_id INTEGER,
  matched_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (bottle_id) REFERENCES bottles(id),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

-- 索引
CREATE INDEX idx_slots_bottle_id ON bottle_match_slots(bottle_id);
CREATE INDEX idx_slots_status ON bottle_match_slots(status);
CREATE INDEX idx_slots_matched_with ON bottle_match_slots(matched_with_telegram_id);
CREATE INDEX idx_slots_bottle_status ON bottle_match_slots(bottle_id, status);
```

---

### **bottles 表（不需要大改）**

```sql
-- 只需添加一個欄位
ALTER TABLE bottles 
ADD COLUMN is_vip_triple INTEGER DEFAULT 0;  -- 0: 普通瓶子, 1: VIP 三倍瓶子
```

---

## 🛠️ 核心邏輯實現

### **1. 創建 VIP 三倍瓶子**

**文件**: `src/domain/bottle.ts`

```typescript
/**
 * Create VIP triple bottle with 3 match slots
 */
export async function createVipTripleBottle(
  db: DatabaseClient,
  user: User,
  bottleInput: ThrowBottleInput,
  env: Env
): Promise<number> {
  // 1. 創建 1 個瓶子記錄
  const bottleId = await createBottle(db, user.telegram_id, {
    ...bottleInput,
    is_vip_triple: 1,  // 標記為 VIP 三倍瓶子
  });
  
  // 2. 創建 3 個配對槽位
  await createMatchSlots(db, bottleId, 3);
  
  // 3. 主動配對第一個槽位
  await matchPrimarySlot(db, env, bottleId);
  
  // 4. 另外 2 個槽位進入公共池（自動）
  // 不需要額外操作，它們的 status='pending' 會被 /catch 找到
  
  return bottleId;
}

/**
 * Create match slots for a bottle
 */
async function createMatchSlots(
  db: DatabaseClient,
  bottleId: number,
  slotCount: number
): Promise<void> {
  for (let i = 1; i <= slotCount; i++) {
    await db.d1
      .prepare(
        `INSERT INTO bottle_match_slots 
         (bottle_id, slot_role, slot_index, status)
         VALUES (?, ?, ?, 'pending')`
      )
      .bind(
        bottleId,
        i === 1 ? 'primary' : 'secondary',  // 第 1 個是主動，其他是被動
        i
      )
      .run();
  }
}

/**
 * Match primary slot (smart matching)
 */
async function matchPrimarySlot(
  db: DatabaseClient,
  env: Env,
  bottleId: number
): Promise<void> {
  const { findActiveMatchForBottle } = await import('~/services/smart_matching');
  const matchResult = await findActiveMatchForBottle(db.d1, bottleId);
  
  if (matchResult && matchResult.user) {
    // 配對成功，更新第一個槽位
    const slot = await getSlotByIndex(db, bottleId, 1);
    if (slot) {
      await updateSlotMatched(db, slot.id, matchResult.user.telegram_id);
      await createConversationFromSlot(db, env, slot, matchResult.user);
    }
  }
}
```

---

### **2. 修改撿瓶子邏輯**

**文件**: `src/db/queries/bottles.ts`

```typescript
/**
 * Find matching bottle (支持 VIP 三倍瓶子)
 */
export async function findMatchingBottle(
  db: DatabaseClient,
  userId: string,
  userGender: string,
  userAge: number,
  userZodiac: string,
  userMbti: string,
  userBloodType?: string | null
): Promise<Bottle | null> {
  // 查詢有可用槽位的瓶子
  const results = await db.d1
    .prepare(
      `SELECT DISTINCT b.* 
       FROM bottles b
       -- 🆕 JOIN 槽位表，只找有空槽位的瓶子
       LEFT JOIN bottle_match_slots s ON b.id = s.bottle_id
       WHERE (
         -- 普通瓶子：status = 'pending'
         (b.is_vip_triple = 0 AND b.status = 'pending')
         OR
         -- VIP 三倍瓶子：至少有 1 個槽位 status = 'pending'
         (b.is_vip_triple = 1 AND EXISTS (
           SELECT 1 FROM bottle_match_slots s2
           WHERE s2.bottle_id = b.id 
             AND s2.status = 'pending'
         ))
       )
       AND datetime(b.expires_at) > datetime('now')
       AND b.owner_telegram_id != ?
       AND (b.target_gender = ? OR b.target_gender = 'any')
       -- 🆕 排除已經配對過的用戶（檢查所有槽位）
       AND NOT EXISTS (
         SELECT 1 FROM bottle_match_slots s3
         WHERE s3.bottle_id = b.id
           AND s3.matched_with_telegram_id = ?
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

### **3. 修改配對成功邏輯**

**文件**: `src/telegram/handlers/catch.ts`

```typescript
/**
 * Handle bottle acceptance (支持 VIP 三倍瓶子)
 */
async function handleBottleAcceptance(
  db: DatabaseClient,
  env: Env,
  bottle: Bottle,
  catcher: User
): Promise<void> {
  // 檢查是否為 VIP 三倍瓶子
  if (bottle.is_vip_triple) {
    // 找到第一個可用槽位
    const availableSlot = await getFirstAvailableSlot(db, bottle.id);
    
    if (!availableSlot) {
      // 所有槽位都已配對
      await telegram.sendMessage(
        catcher.telegram_id,
        '❌ 這個瓶子已經被其他人撿走了，請試試其他瓶子！'
      );
      return;
    }
    
    // 更新槽位狀態
    await updateSlotMatched(db, availableSlot.id, catcher.telegram_id);
    
    // 創建對話
    const conversationId = await createConversation(
      db,
      bottle.owner_telegram_id,
      catcher.telegram_id,
      bottle.id
    );
    
    // 關聯槽位和對話
    await linkSlotToConversation(db, availableSlot.id, conversationId);
    
    // 檢查是否所有槽位都已配對
    const remainingSlots = await getRemainingSlots(db, bottle.id);
    if (remainingSlots === 0) {
      // 所有槽位都已配對，更新瓶子狀態
      await updateBottleStatus(db, bottle.id, 'matched');
    }
  } else {
    // 普通瓶子（現有邏輯）
    await updateBottleStatus(db, bottle.id, 'matched');
    await createConversation(db, bottle.owner_telegram_id, catcher.telegram_id, bottle.id);
  }
}

/**
 * Get first available slot
 */
async function getFirstAvailableSlot(
  db: DatabaseClient,
  bottleId: number
): Promise<MatchSlot | null> {
  const result = await db.d1
    .prepare(
      `SELECT * FROM bottle_match_slots
       WHERE bottle_id = ?
         AND status = 'pending'
       ORDER BY slot_index ASC
       LIMIT 1`
    )
    .bind(bottleId)
    .first();
  
  return result as MatchSlot | null;
}

/**
 * Get remaining slots count
 */
async function getRemainingSlots(
  db: DatabaseClient,
  bottleId: number
): Promise<number> {
  const result = await db.d1
    .prepare(
      `SELECT COUNT(*) as count
       FROM bottle_match_slots
       WHERE bottle_id = ?
         AND status = 'pending'`
    )
    .bind(bottleId)
    .first();
  
  return (result?.count as number) || 0;
}
```

---

### **4. 配額統計（不需要改）**

**文件**: `src/db/queries/bottles.ts`

```typescript
/**
 * Get daily throw count
 * ✅ 不需要修改！因為 1 個瓶子 = 1 次丟瓶子
 */
export async function getDailyThrowCount(
  db: DatabaseClient,
  userId: string
): Promise<number> {
  const result = await db.d1
    .prepare(
      `SELECT COUNT(*) as count
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

## 🎨 UI/UX 更新（完整列表）

### **需要更新的所有位置**

#### **1. VIP 權益說明** ⭐ 最重要

**位置 1**: `src/telegram/handlers/vip.ts` - `/vip` 命令

```typescript
// 🔴 需要更新
const vipBenefits = 
  `🎁 VIP 權益：\n` +
  `• 🆕 三倍曝光機會！一次丟瓶子觸發 3 個對象\n` +
  `  └ 1 個智能配對 + 2 個公共池\n` +
  `• 解鎖對方清晰頭像\n` +
  `• 每天 30 個漂流瓶配額\n` +
  `• 可篩選 MBTI、星座、血型\n` +
  `• 34 種語言自動翻譯（OpenAI 優先）\n` +
  `• 無廣告體驗\n`;
```

**位置 2**: `src/i18n/locales/zh-TW.ts` - 中文翻譯

```typescript
vip: {
  title: '⭐ VIP 訂閱',
  benefits:
    '🎁 VIP 權益：\n' +
    '• 🆕 三倍曝光機會（1 次丟瓶 = 3 個對象）\n' +
    '• 解鎖對方清晰頭像\n' +
    '• 每日 30 個漂流瓶（免費 3 個）\n' +
    '• 可指定星座／MBTI／血型篩選\n' +
    '• 34 種語言自動翻譯（OpenAI 優先）\n' +
    '• 無廣告',
  // ...
}
```

**位置 3**: `src/i18n/locales/en.ts` - 英文翻譯

```typescript
vip: {
  title: '⭐ VIP Subscription',
  benefits:
    '🎁 VIP Benefits:\n' +
    '• 🆕 3x Exposure (1 throw = 3 matches)\n' +
    '• Unlock clear avatars\n' +
    '• 30 bottles per day (Free: 3)\n' +
    '• Filter by zodiac/MBTI/blood type\n' +
    '• Auto-translation in 34 languages (OpenAI)\n' +
    '• Ad-free',
  // ...
}
```

---

#### **2. Help 命令** ⭐ 重要

**位置**: `src/telegram/handlers/help.ts`

```typescript
// 🔴 需要更新
const vipSection = 
  `💎 **VIP 特權**\n\n` +
  `• 🆕 **三倍曝光** - 一次丟瓶子觸發 3 個對象\n` +
  `  └ 大幅提升配對成功率\n` +
  `• 🎯 **智能配對** - 自動找到最合適的對象\n` +
  `• 📸 **清晰頭像** - 查看對方真實頭像\n` +
  `• 📦 **更多配額** - 每天 30 個瓶子\n` +
  `• 🎨 **進階篩選** - MBTI、星座、血型\n` +
  `• 🌍 **智能翻譯** - 34 種語言 OpenAI 翻譯\n` +
  `• 🚫 **無廣告** - 純淨體驗\n\n` +
  `使用 /vip 立即升級`;
```

---

#### **3. 丟瓶子成功訊息** ⭐ 重要

**位置**: `src/telegram/handlers/throw.ts`

```typescript
// 🔴 需要更新
// VIP 用戶成功訊息
const vipSuccessMessage = 
  `✨ **VIP 特權啟動！**\n\n` +
  `🎯 你的瓶子已發送給 **3 個對象**：\n` +
  `• 1 個智能配對對象（已配對）\n` +
  `• 2 個公共池對象（等待中）\n\n` +
  `💬 你可能會收到 **最多 3 個對話**！\n` +
  `📊 今日剩餘配額：${remaining} / ${quota}\n\n` +
  `💡 提示：每個對話都是獨立的，可以同時進行`;

// 免費用戶成功訊息（加上 VIP 提示）
const freeSuccessMessage = 
  `✅ 瓶子已丟出！\n\n` +
  `🌊 等待有緣人撿起...\n` +
  `📊 今日剩餘配額：${remaining} / ${quota}\n\n` +
  `💎 **升級 VIP 可獲得三倍曝光機會！**\n` +
  `一次丟瓶子 = 3 個對象，大幅提升配對成功率\n\n` +
  `使用 /vip 了解更多`;
```

---

#### **4. 配額用完提示** ⭐ 重要

**位置**: `src/telegram/handlers/throw.ts`

```typescript
// 🔴 需要更新
const quotaExhaustedMessage = 
  `❌ 你今天的漂流瓶已用完。\n\n` +
  `📊 免費用戶：3 個/天\n` +
  `💎 VIP 用戶：30 個/天（三倍曝光）\n\n` +
  `🎁 邀請好友可增加配額：\n` +
  `• 免費用戶：最多 +7 個\n` +
  `• VIP 用戶：最多 +70 個\n\n` +
  `💡 升級 VIP 獲得：\n` +
  `• 🆕 三倍曝光機會（1 次 = 3 個對象）\n` +
  `• 更多配額（30 個/天）\n` +
  `• 進階篩選和翻譯\n\n` +
  `使用 /vip 立即升級`;
```

---

#### **5. Profile 命令** ⭐ 建議

**位置**: `src/telegram/handlers/profile.ts`

```typescript
// 🔴 建議添加
const profileMessage = 
  `👤 **個人資料**\n\n` +
  `📛 暱稱：${user.nickname}\n` +
  `👥 性別：${user.gender}\n` +
  `🎂 年齡：${age} 歲\n` +
  `⭐ 星座：${user.zodiac_sign}\n` +
  `🧠 MBTI：${user.mbti_result}\n` +
  `🩸 血型：${user.blood_type}\n` +
  `🌍 語言：${user.language_pref}\n\n` +
  `💎 VIP 狀態：${isVip ? `✅ 已開通（到期：${expireDate}）` : '❌ 未開通'}\n` +
  (isVip ? 
    `🎁 VIP 特權：三倍曝光、清晰頭像、進階篩選\n` : 
    `💡 升級 VIP 可獲得三倍曝光機會！\n`
  ) +
  `\n📊 統計數據：/stats\n` +
  `✏️ 編輯資料：/edit_profile`;
```

---

#### **6. Stats 命令** ⭐ 建議

**位置**: `src/telegram/handlers/stats.ts`

```typescript
// 🔴 建議添加 VIP 三倍瓶子統計
if (isVip) {
  const vipStats = await getVipTripleBottleStats(db, userId);
  
  statsMessage += 
    `\n💎 **VIP 三倍瓶子統計**（近 30 天）\n` +
    `🎯 丟出次數：${vipStats.throws}\n` +
    `📦 總配對槽位：${vipStats.totalSlots}\n` +
    `💬 成功配對：${vipStats.matchedSlots}\n` +
    `📈 配對率：${(vipStats.matchedSlots / vipStats.totalSlots * 100).toFixed(1)}%\n` +
    `🌟 平均每次配對：${(vipStats.matchedSlots / vipStats.throws).toFixed(1)} 個對象\n`;
}
```

---

#### **7. Menu 命令** ⭐ 建議

**位置**: `src/telegram/handlers/menu.ts`

```typescript
// 🔴 建議更新
let menuMessage =
  `🏠 **主選單** ${vipBadge}\n\n` +
  `👋 嗨，${user.nickname}！\n\n` +
  `📊 你的狀態：\n` +
  `• 等級：${isVip ? 'VIP 會員 💎' : '免費會員'}\n` +
  (isVip ? 
    `• 特權：三倍曝光、清晰頭像、進階篩選\n` : 
    `• 升級 VIP 可獲得三倍曝光機會！\n`
  ) +
  `• MBTI：${user.mbti_result || '未設定'}\n` +
  `• 星座：${user.zodiac_sign || '未設定'}\n\n`;
```

---

#### **8. 廣告提示** ⭐ 建議

**位置**: `src/domain/ad_prompt.ts`

```typescript
// 🔴 建議更新
const vipPrompts = [
  '💎 升級 VIP 可獲得三倍曝光機會！一次丟瓶子 = 3 個對象',
  '🎯 VIP 用戶每次丟瓶子都能觸發 3 個配對，大幅提升成功率',
  '✨ VIP 特權：三倍曝光 + 清晰頭像 + 進階篩選',
  // ...
];
```

---

#### **9. Terms 服務條款** ⭐ 建議

**位置**: `public/terms.html`

```html
<!-- 🔴 建議更新 VIP 權益說明 -->
<h3>VIP 會員權益</h3>
<ul>
  <li><strong>🆕 三倍曝光機會</strong>：一次丟瓶子可觸發 3 個對象（1 個智能配對 + 2 個公共池）</li>
  <li><strong>解鎖清晰頭像</strong>：查看對方真實頭像</li>
  <li><strong>更多配額</strong>：每天 30 個漂流瓶</li>
  <li><strong>進階篩選</strong>：可指定 MBTI、星座、血型</li>
  <li><strong>智能翻譯</strong>：34 種語言 OpenAI 優先翻譯</li>
  <li><strong>無廣告體驗</strong></li>
</ul>
```

---

## 📋 完整更新檢查清單

### **必須更新（P0）** 🔴

- [ ] `src/telegram/handlers/vip.ts` - VIP 權益說明（2 處）
- [ ] `src/telegram/handlers/throw.ts` - 丟瓶子成功訊息（VIP + 免費）
- [ ] `src/telegram/handlers/throw.ts` - 配額用完提示
- [ ] `src/i18n/locales/zh-TW.ts` - 中文翻譯
- [ ] `src/i18n/locales/en.ts` - 英文翻譯

### **重要更新（P1）** 🟡

- [ ] `src/telegram/handlers/help.ts` - VIP 特權說明
- [ ] `src/telegram/handlers/profile.ts` - VIP 狀態顯示
- [ ] `src/telegram/handlers/menu.ts` - 主選單 VIP 提示

### **建議更新（P2）** 🟢

- [ ] `src/telegram/handlers/stats.ts` - VIP 三倍瓶子統計
- [ ] `src/domain/ad_prompt.ts` - 廣告提示
- [ ] `public/terms.html` - 服務條款

---

## 🔄 方案對比總結

### **方案 A：複製瓶子法**

| 項目 | 評分 | 說明 |
|------|------|------|
| 實現難度 | ⭐⭐⭐⭐⭐ | 最簡單 |
| 存儲效率 | ⭐⭐☆☆☆ | 3 倍冗餘 |
| 邏輯清晰度 | ⭐⭐⭐⭐☆ | 清晰 |
| 可擴展性 | ⭐⭐⭐☆☆ | 一般 |
| 維護成本 | ⭐⭐⭐⭐☆ | 低 |

**總評**: ⭐⭐⭐⭐☆ **簡單但有冗餘**

---

### **方案 B：狀態標記法（推薦）**

| 項目 | 評分 | 說明 |
|------|------|------|
| 實現難度 | ⭐⭐⭐⭐☆ | 稍複雜但可控 |
| 存儲效率 | ⭐⭐⭐⭐⭐ | 無冗餘 |
| 邏輯清晰度 | ⭐⭐⭐⭐⭐ | 非常清晰 |
| 可擴展性 | ⭐⭐⭐⭐⭐ | 優秀 |
| 維護成本 | ⭐⭐⭐⭐⭐ | 低 |

**總評**: ⭐⭐⭐⭐⭐ **最優方案** ⭐

---

## 💡 為什麼推薦方案 B？

### **1. 無數據冗餘** ✅

```
方案 A: 1 次丟瓶子 = 3 個 bottle 記錄（內容相同）
        存儲：content × 3 = 3000 字節（假設 1000 字）

方案 B: 1 次丟瓶子 = 1 個 bottle 記錄 + 3 個 slot 記錄
        存儲：content × 1 + slot × 3 = 1000 + 300 = 1300 字節
        
節省：58% 存儲空間
```

---

### **2. 邏輯更清晰** ✅

```
方案 A: 
- 如何判斷 3 個瓶子是同一組？→ 需要 bottle_group_id
- 如何統計配對率？→ 需要複雜的 GROUP BY
- 如何顯示剩餘槽位？→ 需要 JOIN 多個表

方案 B:
- 如何判斷配對狀態？→ 直接查 slots 表
- 如何統計配對率？→ COUNT(slots WHERE matched)
- 如何顯示剩餘槽位？→ COUNT(slots WHERE pending)
```

---

### **3. 易於擴展** ✅

```
未來需求：VIP 可選擇 1-5 個對象

方案 A: 需要動態創建 1-5 個瓶子記錄，邏輯複雜

方案 B: 只需修改 slot_count 參數，非常簡單
        createMatchSlots(db, bottleId, slotCount)
```

---

### **4. 性能更好** ✅

```
查詢可用瓶子：

方案 A: 
SELECT * FROM bottles 
WHERE (bottle_group_id IS NULL AND status='pending')
   OR (bottle_group_id IS NOT NULL AND ...)
→ 需要複雜的條件判斷

方案 B:
SELECT * FROM bottles b
WHERE EXISTS (
  SELECT 1 FROM bottle_match_slots s
  WHERE s.bottle_id = b.id AND s.status='pending'
)
→ 簡單的 EXISTS 查詢，有索引支持
```

---

## 🚀 實施建議

### **推薦方案：方案 B（狀態標記法）**

**理由**：
1. ✅ 無數據冗餘，節省 58% 存儲
2. ✅ 邏輯更清晰，易於理解和維護
3. ✅ 易於擴展，支持動態槽位數量
4. ✅ 性能更好，查詢效率高
5. ✅ 實現難度可控，只需新增一個表

**實施難度**：⭐⭐⭐⭐☆（稍高但完全可控）

**預計開發時間**：
- 數據庫設計：1 小時
- 核心邏輯實現：4 小時
- UI/UX 更新：2 小時
- 測試：3 小時
- **總計：10 小時**

---

## ✅ 最終推薦

### **採用方案 B：狀態標記法** ⭐⭐⭐⭐⭐

**核心優勢**：
- 🎯 **無數據冗餘** - 節省 58% 存儲
- 🎯 **邏輯清晰** - 易於理解和維護
- 🎯 **易於擴展** - 支持未來需求
- 🎯 **性能優秀** - 查詢效率高
- 🎯 **穩定可靠** - 不破壞現有功能

**實施計劃**：
1. ✅ 創建 `bottle_match_slots` 表
2. ✅ 實現 `createVipTripleBottle` 函數
3. ✅ 修改 `findMatchingBottle` 查詢邏輯
4. ✅ 修改 `handleBottleAcceptance` 配對邏輯
5. ✅ 更新所有 UI/UX 提示（11 處）
6. ✅ 完整測試

---

**準備好進入開發階段！** 🚀

