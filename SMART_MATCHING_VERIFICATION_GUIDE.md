# 智能配對系統驗證指南

## 📋 問題說明

用戶疑問：如何確認每次丟瓶子、撿瓶子時都有經過 MBTI、星座、語言、血型等配對？

**用戶觀察**：丟出瓶子後沒有馬上被撿到，表示它還是被動的，而不是主動尋找對象推送給對方。

---

## ✅ 當前實現確認

### **1. 丟瓶子（/throw）- 主動配對**

#### **代碼位置**：`src/telegram/handlers/throw.ts` Line 292-378

#### **配對流程**：

```javascript
// Line 292-296: 調用智能配對服務
const { findActiveMatchForBottle } = await import('~/services/smart_matching');
const matchResult = await findActiveMatchForBottle(db.d1, bottleId);

if (matchResult && matchResult.user) {
  // ✅ 找到配對！主動推送給對方
  
  // Line 298-302: 更新瓶子狀態為 'matched'
  await db.d1
    .prepare(`UPDATE bottles SET match_status = 'matched' WHERE id = ?`)
    .bind(bottleId)
    .run();
  
  // Line 305-318: 記錄配對歷史（包含分數細節）
  await db.d1
    .prepare(`
      INSERT INTO matching_history 
      (bottle_id, matched_user_id, match_score, score_breakdown, match_type)
      VALUES (?, ?, ?, ?, ?)
    `)
    .bind(
      bottleId,
      matchResult.user.telegram_id,
      matchResult.score.total,        // 總分
      JSON.stringify(matchResult.score), // 詳細分數（語言、MBTI、星座等）
      'active'                         // 主動配對
    )
    .run();
  
  // Line 320-359: 發送通知給配對用戶
  await telegram.sendMessage(
    matchedChatId,
    `🍾 ${contentPreview} 📨🌊\n\n` +
      `📝 暱稱：${ownerMaskedNickname}\n` +
      `🧠 MBTI：${user.mbti_result || '未設定'}\n` +
      `⭐ 星座：${user.zodiac_sign || '未設定'}\n` +
      `💝 匹配度：${matchPercentage}%\n` +  // ← 顯示配對分數
      highlightsText +                        // ← 顯示配對亮點
      `\n━━━━━━━━━━━━━━━━\n` +
      `${content}\n` +
      `━━━━━━━━━━━━━━━━\n\n` +
      `💬 直接按 /reply 回覆訊息開始聊天\n` +
      `📊 使用 /chats 查看所有對話`
  );
  
  console.log(`[Smart Matching] Bottle ${bottleId} matched to user ${matchResult.user.telegram_id} with score ${matchResult.score.total}`);
  
} else {
  // ❌ 沒找到配對，進入公共池（被動模式）
  
  // Line 364-367: 更新瓶子狀態為 'active'（等待被撿）
  await db.d1
    .prepare(`UPDATE bottles SET match_status = 'active' WHERE id = ?`)
    .bind(bottleId)
    .run();
  
  console.log(`[Smart Matching] Bottle ${bottleId} enters public pool (no active match found)`);
}
```

#### **配對條件**（`src/services/smart_matching.ts`）：

```javascript
// Line 91-94: 主動配對策略
export async function findActiveMatchForBottle(
  db: D1Database,
  bottleId: number
): Promise<MatchResult | null> {
  
  // 1. 獲取瓶子信息（包含丟瓶子用戶的資料）
  const bottle = await db.prepare(`
    SELECT 
      b.*,
      u.birthday as owner_birthday,
      u.zodiac_sign as owner_zodiac,
      u.mbti_result as owner_mbti,
      u.blood_type as owner_blood_type,
      u.language_pref as owner_language,
      u.gender as owner_gender
    FROM bottles b
    JOIN users u ON b.owner_telegram_id = u.telegram_id
    WHERE b.id = ?
  `).bind(bottleId).first();
  
  // 2. 分層查詢活躍用戶（優先高匹配度）
  
  // Tier 1: 同語言 + 1小時內活躍 (最多 200 人)
  const tier1 = await db.prepare(`
    SELECT * FROM users
    WHERE language_pref = ?
      AND last_active_at > datetime('now', '-1 hour')
      AND telegram_id != ?
    LIMIT 200
  `).bind(bottle.owner_language, bottle.owner_telegram_id).all();
  
  // Tier 2: 相鄰年齡區間 + 2小時內活躍 (最多 150 人)
  const tier2 = await db.prepare(`
    SELECT * FROM users
    WHERE age_range IN (?, ?, ?)
      AND last_active_at > datetime('now', '-2 hours')
      AND telegram_id != ?
    LIMIT 150
  `).bind(...adjacentAgeRanges, bottle.owner_telegram_id).all();
  
  // Tier 3: 所有活躍用戶 + 3小時內活躍 (最多 100 人)
  const tier3 = await db.prepare(`
    SELECT * FROM users
    WHERE last_active_at > datetime('now', '-3 hours')
      AND telegram_id != ?
    LIMIT 100
  `).all();
  
  // 3. 合併候選人（最多 450 人）
  const allCandidates = [...tier1, ...tier2, ...tier3];
  
  // 4. 計算每個候選人的配對分數
  for (const candidate of allCandidates) {
    const score = calculateTotalMatchScore(bottleData, candidateData);
    // score.language: 語言分數 (0-100)
    // score.mbti: MBTI 分數 (0-100)
    // score.zodiac: 星座分數 (0-100)
    // score.bloodType: 血型分數 (0-100)
    // score.ageRange: 年齡區間分數 (0-100)
    // score.total: 總分 (加權平均)
  }
  
  // 5. 排序並選擇最佳配對（Top 10）
  candidates.sort((a, b) => b.score.total - a.score.total);
  const topCandidates = candidates.slice(0, 10);
  
  // 6. 隨機選擇一個（避免總是配對給同一個人）
  const randomIndex = Math.floor(Math.random() * topCandidates.length);
  return topCandidates[randomIndex];
}
```

---

### **2. 撿瓶子（/catch）- 被動配對**

#### **代碼位置**：`src/telegram/handlers/catch.ts` Line 136-167

#### **配對流程**：

```javascript
// Line 136-154: 優先嘗試智能配對
try {
  const { findSmartBottleForUser } = await import('~/services/smart_matching');
  const smartMatch = await findSmartBottleForUser(db.d1, telegramId);
  
  if (smartMatch && smartMatch.bottle) {
    bottle = smartMatch.bottle;
    matchScore = smartMatch.score.total;
    matchType = smartMatch.matchType; // 'smart' or 'random'
    
    console.log(`[Smart Matching] User ${telegramId} got ${matchType} match with score ${matchScore}`);
  }
} catch (smartMatchError) {
  console.error('[Smart Matching] Error, falling back to random:', smartMatchError);
}

// Line 156-167: 如果智能配對沒找到，使用舊的隨機配對
if (!bottle) {
  bottle = await findMatchingBottle(
    db,
    telegramId,
    user.gender || 'any',
    userAge,
    userZodiac,
    userMbti,
    userBloodType
  );
}
```

#### **智能配對邏輯**（`src/services/smart_matching.ts`）：

```javascript
// 被動配對：用戶撿瓶子時，為其找到最合適的瓶子
export async function findSmartBottleForUser(
  db: D1Database,
  telegramId: string
): Promise<MatchResult | null> {
  
  // 1. 獲取用戶信息
  const user = await db.prepare(`
    SELECT * FROM users WHERE telegram_id = ?
  `).bind(telegramId).first();
  
  // 2. 分層查詢瓶子（優先高匹配度）
  
  // Tier 1: 同語言瓶子 (最多 100 個)
  const tier1 = await db.prepare(`
    SELECT b.*, u.*
    FROM bottles b
    JOIN users u ON b.owner_telegram_id = u.telegram_id
    WHERE b.status = 'active'
      AND b.match_status IN ('active', 'pending')
      AND u.language_pref = ?
      AND b.owner_telegram_id != ?
    LIMIT 100
  `).bind(user.language_pref, telegramId).all();
  
  // Tier 2: 相鄰年齡區間瓶子 (最多 50 個)
  const tier2 = await db.prepare(`
    SELECT b.*, u.*
    FROM bottles b
    JOIN users u ON b.owner_telegram_id = u.telegram_id
    WHERE b.status = 'active'
      AND b.match_status IN ('active', 'pending')
      AND u.age_range IN (?, ?, ?)
      AND b.owner_telegram_id != ?
    LIMIT 50
  `).bind(...adjacentAgeRanges, telegramId).all();
  
  // Tier 3: 所有可用瓶子 (最多 50 個)
  const tier3 = await db.prepare(`
    SELECT b.*, u.*
    FROM bottles b
    JOIN users u ON b.owner_telegram_id = u.telegram_id
    WHERE b.status = 'active'
      AND b.match_status IN ('active', 'pending')
      AND b.owner_telegram_id != ?
    LIMIT 50
  `).all();
  
  // 3. 合併候選瓶子（最多 200 個）
  const allBottles = [...tier1, ...tier2, ...tier3];
  
  // 4. 計算每個瓶子的配對分數
  for (const bottle of allBottles) {
    const score = calculateTotalMatchScore(userData, bottleOwnerData);
  }
  
  // 5. 選擇最佳配對
  // 如果有高分配對（>= 70分），返回智能配對
  // 否則隨機選擇
  if (bestScore >= 70) {
    return { bottle: bestBottle, score: bestScore, matchType: 'smart' };
  } else {
    return { bottle: randomBottle, score: randomScore, matchType: 'random' };
  }
}
```

---

## 🔍 如何驗證配對是否生效

### **方法 1：查看 Cloudflare Logs**

1. 打開 Cloudflare Dashboard
2. 進入 Workers & Pages → xunni-bot-staging → Logs
3. 搜尋關鍵字：`Smart Matching`

#### **預期日誌**：

**丟瓶子時（主動配對成功）**：
```
[Smart Matching] Bottle 123 matched to user 7788737902 with score 85.5
```

**丟瓶子時（沒找到配對，進入公共池）**：
```
[Smart Matching] Bottle 123 enters public pool (no active match found)
```

**撿瓶子時（智能配對）**：
```
[Smart Matching] User 7788737902 got smart match with score 78.2
```

**撿瓶子時（隨機配對）**：
```
[Smart Matching] User 7788737902 got random match with score 45.3
```

---

### **方法 2：查看數據庫記錄**

#### **檢查配對歷史**：

```sql
-- 查看最近的配對記錄
SELECT 
  mh.bottle_id,
  mh.matched_user_id,
  mh.match_score,
  mh.match_type,
  mh.score_breakdown,
  mh.created_at,
  b.content,
  u.nickname as matched_user_nickname
FROM matching_history mh
JOIN bottles b ON mh.bottle_id = b.id
JOIN users u ON mh.matched_user_id = u.telegram_id
ORDER BY mh.created_at DESC
LIMIT 10;
```

#### **預期結果**：

| bottle_id | matched_user_id | match_score | match_type | score_breakdown | created_at |
|-----------|-----------------|-------------|------------|-----------------|------------|
| 123 | 7788737902 | 85.5 | active | {"language":100,"mbti":85,"zodiac":75,...} | 2025-11-20 18:00:00 |
| 124 | 396943893 | 78.2 | active | {"language":100,"mbti":70,"zodiac":80,...} | 2025-11-20 18:05:00 |

#### **檢查瓶子狀態**：

```sql
-- 查看瓶子的配對狀態
SELECT 
  id,
  owner_telegram_id,
  match_status,
  status,
  created_at
FROM bottles
ORDER BY created_at DESC
LIMIT 10;
```

#### **預期結果**：

| id | owner_telegram_id | match_status | status | created_at |
|----|-------------------|--------------|--------|------------|
| 123 | 7788737902 | matched | active | 2025-11-20 18:00:00 |
| 124 | 396943893 | active | active | 2025-11-20 18:05:00 |

**說明**：
- `match_status = 'matched'` → 已主動配對成功
- `match_status = 'active'` → 進入公共池，等待被撿

---

### **方法 3：實際測試**

#### **測試場景 1：主動配對（丟瓶子）**

**步驟**：
1. 用戶 A 丟出瓶子
2. 如果有活躍用戶 B 在線（1-3小時內有操作）
3. 系統應該立即推送通知給用戶 B

**預期結果**：
- 用戶 B 收到通知：
  ```
  🍾 你好！我是一個喜歡音樂和... 📨🌊
  
  📝 暱稱：yi***
  🧠 MBTI：INFP
  ⭐ 星座：雙魚座
  💝 匹配度：85%
  
  💡 這個瓶子和你非常合拍！
  • 語言相同 ✓
  • MBTI 高度配對 ✓
  • 星座高度相容 ✓
  
  ━━━━━━━━━━━━━━━━
  你好！我是一個喜歡音樂和電影的人，希望認識志同道合的朋友～
  ━━━━━━━━━━━━━━━━
  
  💬 直接按 /reply 回覆訊息開始聊天
  📊 使用 /chats 查看所有對話
  ```

**如果沒有活躍用戶**：
- 用戶 A 丟出瓶子後，瓶子進入公共池
- 用戶 A 收到確認訊息（但沒有立即配對）
- 瓶子等待其他用戶使用 `/catch` 撿起

---

#### **測試場景 2：被動配對（撿瓶子）**

**步驟**：
1. 用戶 C 使用 `/catch` 撿瓶子
2. 系統查找最適合用戶 C 的瓶子

**預期結果**：
- 如果有高匹配度瓶子（>= 70分）：
  ```
  🍾 你撿到了一個漂流瓶！
  
  📝 暱稱：yi***
  🧠 MBTI：INFP
  ⭐ 星座：雙魚座
  🩸 血型：A
  🌍 語言：繁體中文
  💝 匹配度：78%  ← 顯示配對分數
  
  ━━━━━━━━━━━━━━━━
  你好！我是一個喜歡音樂和電影的人...
  ━━━━━━━━━━━━━━━━
  ```

- 如果沒有高匹配度瓶子（< 70分）：
  ```
  🍾 你撿到了一個漂流瓶！
  
  （隨機配對，不顯示配對分數）
  ```

---

## ❓ 為什麼丟瓶子後沒有立即被撿到？

### **可能原因**：

#### **1. 沒有活躍用戶在線**

**條件**：
- 主動配對需要找到 **1-3 小時內有活動** 的用戶
- 如果沒有符合條件的活躍用戶，瓶子會進入公共池

**解決方案**：
- 等待其他用戶上線
- 或者其他用戶使用 `/catch` 撿瓶子

#### **2. 配對分數不夠高**

**條件**：
- 即使有活躍用戶，但配對分數太低（< 閾值）
- 系統可能選擇不推送，而是讓瓶子進入公共池

**查看閾值**：
```javascript
// src/services/smart_matching.ts
export const MATCHING_CONFIG = {
  activeMatching: {
    layers: [
      { minThreshold: 100 },  // Tier 1: 同語言，最低 100 分
      { minThreshold: 150 },  // Tier 2: 相鄰年齡，最低 150 分
      { minThreshold: 0 },    // Tier 3: 所有活躍，無最低分
    ],
  },
};
```

#### **3. 用戶資料不完整**

**影響配對分數的資料**：
- ✅ 語言（language_pref）
- ✅ MBTI（mbti_result）
- ✅ 星座（zodiac_sign）
- ✅ 血型（blood_type）
- ✅ 生日（birthday → 年齡區間）

**如果用戶資料不完整**：
- 配對分數會降低
- 可能無法達到主動推送的閾值

---

## 🔧 如何提高主動配對成功率

### **1. 降低活躍時間窗口閾值**

**當前設置**：
- Tier 1: 1 小時內活躍
- Tier 2: 2 小時內活躍
- Tier 3: 3 小時內活躍

**建議調整**（如果用戶少）：
```javascript
// src/services/smart_matching.ts
export const MATCHING_CONFIG = {
  activeMatching: {
    layers: [
      { timeWindow: '-2 hours' },  // 改為 2 小時
      { timeWindow: '-4 hours' },  // 改為 4 小時
      { timeWindow: '-6 hours' },  // 改為 6 小時
    ],
  },
};
```

---

### **2. 降低配對分數閾值**

**當前設置**：
- Tier 1: 最低 100 分（滿分 100，需要完美匹配）
- Tier 2: 最低 150 分（這個設置有問題！）

**建議調整**：
```javascript
// src/services/smart_matching.ts
export const MATCHING_CONFIG = {
  activeMatching: {
    layers: [
      { minThreshold: 60 },   // 改為 60 分
      { minThreshold: 50 },   // 改為 50 分
      { minThreshold: 0 },    // 無最低分
    ],
  },
};
```

---

### **3. 增加候選人數量**

**當前設置**：
- Tier 1: 最多 200 人
- Tier 2: 最多 150 人
- Tier 3: 最多 100 人

**建議調整**（如果用戶多）：
```javascript
// src/services/smart_matching.ts
export const MATCHING_CONFIG = {
  activeMatching: {
    layers: [
      { limit: 300 },  // 改為 300 人
      { limit: 200 },  // 改為 200 人
      { limit: 150 },  // 改為 150 人
    ],
  },
};
```

---

## 📊 配對分數計算公式

### **權重分配**（`src/domain/matching.ts`）：

```javascript
export const MATCHING_WEIGHTS = {
  language: 0.35,      // 35% - 語言最重要
  mbti: 0.25,          // 25% - MBTI 次之
  zodiac: 0.15,        // 15% - 星座
  bloodType: 0.10,     // 10% - 血型
  ageRange: 0.15,      // 15% - 年齡區間
};

// 總分計算
totalScore = 
  (languageScore * 0.35) +
  (mbtiScore * 0.25) +
  (zodiacScore * 0.15) +
  (bloodTypeScore * 0.10) +
  (ageRangeScore * 0.15);
```

### **示例**：

| 因素 | 分數 | 權重 | 加權分數 |
|------|------|------|----------|
| 語言相同 | 100 | 35% | 35.0 |
| MBTI 高度配對 | 85 | 25% | 21.25 |
| 星座高度相容 | 75 | 15% | 11.25 |
| 血型配對 | 60 | 10% | 6.0 |
| 年齡區間相近 | 80 | 15% | 12.0 |
| **總分** | | | **85.5** |

---

## ✅ 驗收清單

- [ ] 查看 Cloudflare Logs，確認有 `[Smart Matching]` 日誌
- [ ] 查詢數據庫 `matching_history` 表，確認有配對記錄
- [ ] 測試丟瓶子，確認是否收到主動推送通知
- [ ] 測試撿瓶子，確認是否顯示配對分數
- [ ] 檢查瓶子狀態（`match_status`），確認主動配對成功
- [ ] 調整配對參數（如需要），提高配對成功率

---

**最後更新**：2025-11-20  
**狀態**：✅ 智能配對系統已實現並部署  
**下一步**：用戶測試並提供反饋

