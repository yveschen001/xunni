# 智能配對系統全面檢查報告

## ✅ 檢查完成時間
**2025-11-20 16:30 (UTC+8)**

---

## 📋 檢查項目清單

### ✅ 1. 智能配對服務實現
**檔案**: `src/services/smart_matching.ts`

**檢查結果**: ✅ 已實現

**功能**:
- ✅ `findActiveMatchForBottle()` - 主動配對（丟瓶子時）
- ✅ `findSmartBottleForUser()` - 被動配對（撿瓶子時）
- ✅ 分層查詢策略（Tier 1/2/3）
- ✅ 配對分數計算
- ✅ Top 10 候選隨機選擇

---

### ✅ 2. 丟瓶子主動配對邏輯
**檔案**: `src/telegram/handlers/throw.ts` (Line 292-378)

**檢查結果**: ✅ 已實現並修復

**流程**:
```javascript
// Line 294-295: 調用智能配對
const { findActiveMatchForBottle } = await import('~/services/smart_matching');
const matchResult = await findActiveMatchForBottle(db.d1, bottleId);

if (matchResult && matchResult.user) {
  // ✅ 找到配對！
  // Line 298-302: 更新瓶子狀態為 'matched'
  // Line 305-318: 記錄配對歷史
  // Line 320-359: 發送通知給配對用戶
  
  console.log(`[Smart Matching] Bottle ${bottleId} matched to user ${matchResult.user.telegram_id} with score ${matchResult.score.total}`);
} else {
  // ❌ 沒找到配對
  // Line 364-367: 更新瓶子狀態為 'active'（進入公共池）
  
  console.log(`[Smart Matching] Bottle ${bottleId} enters public pool (no active match found)`);
}
```

**修復內容**:
- ✅ 添加性別過濾（`target_gender`）
- ✅ 添加日誌記錄

---

### ✅ 3. 撿瓶子被動配對邏輯
**檔案**: `src/telegram/handlers/catch.ts` (Line 136-167)

**檢查結果**: ✅ 已實現

**流程**:
```javascript
// Line 142-154: 優先嘗試智能配對
const { findSmartBottleForUser } = await import('~/services/smart_matching');
const smartMatch = await findSmartBottleForUser(db.d1, telegramId);

if (smartMatch && smartMatch.bottle) {
  bottle = smartMatch.bottle;
  matchScore = smartMatch.score.total;
  matchType = smartMatch.matchType; // 'smart' or 'random'
  
  console.log(`[Smart Matching] User ${telegramId} got ${matchType} match with score ${matchScore}`);
}

// Line 156-167: 如果智能配對沒找到，使用舊的隨機配對
if (!bottle) {
  bottle = await findMatchingBottle(...);
}
```

---

### ✅ 4. 數據庫 Schema 和索引
**檔案**: 
- `src/db/migrations/0040_add_smart_matching_fields.sql`
- `src/db/migrations/0041_create_matching_history.sql`

**檢查結果**: ✅ 已部署到 Remote

**驗證命令**:
```bash
# 檢查 matching_history 表
pnpm wrangler d1 execute xunni-db-staging --remote --command \
  "SELECT name FROM sqlite_master WHERE type='table' AND name='matching_history'"
# ✅ 結果: matching_history 存在

# 檢查 users 表欄位
pnpm wrangler d1 execute xunni-db-staging --remote --command \
  "PRAGMA table_info(users)" | grep -E "age_range|last_active_at"
# ✅ 結果: age_range, last_active_at 存在

# 檢查 bottles 表欄位
pnpm wrangler d1 execute xunni-db-staging --remote --command \
  "PRAGMA table_info(bottles)" | grep "match_status"
# ✅ 結果: match_status 存在
```

**索引**:
- ✅ `idx_users_age_range` - 年齡區間索引
- ✅ `idx_users_active_status` - 活躍狀態索引
- ✅ `idx_users_language` - 語言索引
- ✅ `idx_bottles_match_status_created` - 瓶子狀態索引
- ✅ `idx_matching_history_user` - 配對歷史用戶索引
- ✅ `idx_matching_history_bottle` - 配對歷史瓶子索引
- ✅ `idx_matching_history_score` - 配對分數索引

---

### ✅ 5. 配對分數計算函數
**檔案**: `src/domain/matching.ts`

**檢查結果**: ✅ 已實現

**函數清單**:
- ✅ `calculateLanguageScore()` - 語言分數 (35%)
- ✅ `calculateMBTIScore()` - MBTI 分數 (25%)
- ✅ `calculateZodiacScore()` - 星座分數 (15%)
- ✅ `calculateAgeRangeScore()` - 年齡區間分數 (15%)
- ✅ `calculateBloodTypeScore()` - 血型分數 (10%)
- ✅ `calculateActivityBonus()` - 活躍度加分
- ✅ `calculateAgeDifferenceBonus()` - 年齡差異加分
- ✅ `calculateTotalMatchScore()` - 總分計算

**權重分配**:
```javascript
total = 
  languageScore * 0.35 +
  mbtiScore * 0.25 +
  zodiacScore * 0.15 +
  ageRangeScore * 0.15 +
  bloodTypeScore * 0.1 +
  activityBonus +
  ageDifferenceBonus;
```

---

### ✅ 6. 性別配對邏輯（新增）
**檔案**: `src/services/smart_matching.ts`

**檢查結果**: ✅ 已修復並實現

**問題**:
- ❌ 原本沒有考慮性別偏好
- ❌ `target_gender` 欄位存在但未使用

**修復內容**:

#### **主動配對（丟瓶子）**:
```javascript
// 獲取瓶子的目標性別
const targetGender = bottle.target_gender || 'any';
const genderFilter = targetGender === 'any' 
  ? '' 
  : `AND gender = '${targetGender}'`;

console.log(`[Smart Matching] Bottle ${bottleId} looking for gender: ${targetGender}`);

// 在所有 3 層查詢中添加性別過濾
SELECT * FROM users
WHERE ...
  ${genderFilter}  // ← 新增
```

**示例**:
- 瓶子 `target_gender = 'female'` → 只配對女性用戶
- 瓶子 `target_gender = 'male'` → 只配對男性用戶
- 瓶子 `target_gender = 'any'` → 配對所有性別

#### **被動配對（撿瓶子）**:
```javascript
// 獲取用戶性別
const userGender = user.gender || 'any';
const genderFilter = `AND (b.target_gender = 'any' OR b.target_gender = '${userGender}')`;

console.log(`[Smart Matching] User ${userId} (gender: ${userGender}) looking for bottles`);

// 在所有 3 層查詢中添加性別過濾
SELECT * FROM bottles b
WHERE ...
  ${genderFilter}  // ← 新增
```

**示例**:
- 用戶性別 = `male` → 只撿 `target_gender = 'male'` 或 `'any'` 的瓶子
- 用戶性別 = `female` → 只撿 `target_gender = 'female'` 或 `'any'` 的瓶子

---

## 🔍 如何驗證配對是否生效

### **方法 1：查看 Cloudflare Logs**

1. 打開 Cloudflare Dashboard
2. Workers & Pages → xunni-bot-staging → Logs
3. 搜尋：`Smart Matching`

#### **預期日誌**：

**丟瓶子時（主動配對）**:
```
[Smart Matching] Bottle 123 looking for gender: female
[Smart Matching] Bottle 123 matched to user 7788737902 with score 85.5
```
或
```
[Smart Matching] Bottle 123 looking for gender: male
[Smart Matching] Bottle 123 enters public pool (no active match found)
```

**撿瓶子時（被動配對）**:
```
[Smart Matching] User 7788737902 (gender: male) looking for bottles
[Smart Matching] User 7788737902 got smart match with score 78.2
```

---

### **方法 2：查詢數據庫**

```sql
-- 查看配對歷史（包含性別信息）
SELECT 
  mh.bottle_id,
  mh.matched_user_id,
  mh.match_score,
  mh.match_type,
  mh.score_breakdown,
  b.target_gender as bottle_target_gender,
  u.gender as matched_user_gender,
  mh.created_at
FROM matching_history mh
JOIN bottles b ON mh.bottle_id = b.id
JOIN users u ON mh.matched_user_id = u.telegram_id
ORDER BY mh.created_at DESC
LIMIT 10;
```

**預期結果**:
| bottle_id | matched_user_id | match_score | bottle_target_gender | matched_user_gender |
|-----------|-----------------|-------------|----------------------|---------------------|
| 123 | 7788737902 | 85.5 | female | female | ✅ 正確配對 |
| 124 | 396943893 | 78.2 | male | male | ✅ 正確配對 |
| 125 | 7788737902 | 92.1 | any | male | ✅ any 接受所有 |

---

### **方法 3：實際測試**

#### **測試場景 1：男找女**

**步驟**:
1. 用戶 A（男性）丟瓶子，`target_gender = 'female'`
2. 用戶 B（女性）在 2 小時內有活動
3. 查看 Cloudflare Logs

**預期結果**:
```
[Smart Matching] Bottle 123 looking for gender: female
[Smart Matching] Bottle 123 matched to user B with score 85.5
```

用戶 B 收到通知：
```
🍾 你好！我是一個喜歡音樂和... 📨🌊

📝 暱稱：yi***
🧠 MBTI：INFP
⭐ 星座：雙魚座
💝 匹配度：85%

💡 這個瓶子和你非常合拍！
• 語言相同 ✓
• MBTI 高度配對 ✓
```

---

#### **測試場景 2：女找男**

**步驟**:
1. 用戶 C（女性）丟瓶子，`target_gender = 'male'`
2. 用戶 D（男性）在 2 小時內有活動
3. 查看 Cloudflare Logs

**預期結果**:
```
[Smart Matching] Bottle 124 looking for gender: male
[Smart Matching] Bottle 124 matched to user D with score 78.2
```

---

#### **測試場景 3：撿瓶子（性別過濾）**

**步驟**:
1. 公共池中有 3 個瓶子：
   - 瓶子 A: `target_gender = 'male'`
   - 瓶子 B: `target_gender = 'female'`
   - 瓶子 C: `target_gender = 'any'`
2. 用戶 E（男性）使用 `/catch`
3. 查看 Cloudflare Logs

**預期結果**:
```
[Smart Matching] User E (gender: male) looking for bottles
[Smart Matching] User E got smart match with score 82.0
```

用戶 E 只會撿到瓶子 A 或瓶子 C（不會撿到瓶子 B）

---

## 📊 配對邏輯總結

### **主動配對（丟瓶子）**

```
瓶子 target_gender = 'female'
    ↓
查找活躍的女性用戶（2-6 小時內）
    ↓
計算配對分數（語言、MBTI、星座、血型、年齡）
    ↓
如果找到 60+ 分的女性用戶 ✅
    ↓
立即推送通知給該女性用戶
    ↓
瓶子狀態 = 'matched'
```

### **被動配對（撿瓶子）**

```
用戶性別 = 'male'
    ↓
查找 target_gender = 'male' 或 'any' 的瓶子
    ↓
計算配對分數
    ↓
如果有 60+ 分的瓶子 ✅
    ↓
返回該瓶子（智能配對）
    ↓
否則隨機選擇
```

---

## ✅ 驗收清單

- [x] 智能配對服務實現完整
- [x] 主動配對邏輯正確
- [x] 被動配對邏輯正確
- [x] 數據庫 schema 和索引已部署
- [x] 配對分數計算函數完整
- [x] **性別配對邏輯已修復**
- [x] 日誌記錄完整（可在 Cloudflare 查看）
- [x] 配對閾值已調整（60 分，2-6 小時活躍窗口）
- [ ] 用戶實際測試（待用戶測試）
- [ ] 查看 Cloudflare Logs 確認性別過濾生效

---

## 🎯 下一步

1. **立即測試**：
   - 丟瓶子，查看 Cloudflare Logs
   - 確認日誌中有 `Bottle X looking for gender: Y`
   - 確認配對結果符合性別偏好

2. **數據驗證**：
   - 查詢 `matching_history` 表
   - 確認 `bottle_target_gender` 和 `matched_user_gender` 匹配

3. **持續優化**：
   - 根據配對成功率調整閾值
   - 根據用戶反饋調整權重

---

**最後更新**: 2025-11-20 16:30  
**狀態**: ✅ 全面檢查完成，性別配對已修復  
**部署版本**: bc81bf5f-9747-410e-a862-1d69e20fa9f7

