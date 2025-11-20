# 智能配對系統設計文檔

## 1. 系統概述

### 1.1 目標
為用戶自動推薦最合適的漂流瓶，提升配對成功率和用戶滿意度。

### 1.2 核心理念
- **主動推送**：每天自動為用戶撿一個最合適的漂流瓶
- **智能匹配**：基於多維度數據計算配對分數
- **優先活躍**：優先匹配最近上線的用戶
- **持續優化**：根據用戶反饋不斷優化算法

---

## 2. 配對權重系統

### 2.1 權重分配

| 維度 | 權重 | 說明 |
|------|------|------|
| 語言匹配 | 40% | 最重要，直接影響溝通 |
| MBTI 配對 | 25% | 性格互補或相似 |
| 星座配對 | 15% | 文化認同感 |
| 血型配對 | 10% | 輔助參考 |
| 年齡相近 | 10% | 生活經驗相似 |

### 2.2 計算公式

```
總分 = 語言分數 × 0.4 + MBTI分數 × 0.25 + 星座分數 × 0.15 + 血型分數 × 0.1 + 年齡分數 × 0.1
```

**額外加分項**：
- 最近 24 小時內上線：+10 分
- 最近 1 小時內上線：+20 分
- 當前在線：+30 分

---

## 3. 語言匹配規則

### 3.1 完全匹配（100 分）
```
用戶語言 = 瓶子語言
```

### 3.2 部分匹配（70 分）
```
同語系：
- 中文變體：zh-TW, zh-CN, zh-HK
- 英語變體：en-US, en-GB, en-AU
- 西班牙語變體：es-ES, es-MX
```

### 3.3 無匹配（30 分）
```
不同語言，但用戶是 VIP（可使用翻譯）
```

### 3.4 不推薦（0 分）
```
不同語言且用戶非 VIP
```

---

## 4. MBTI 配對規則

### 4.1 MBTI 配對表（基於心理學研究）

#### **最佳配對（100 分）**

| 類型 | 最佳配對 | 說明 |
|------|---------|------|
| INTJ | ENFP, ENTP | 直覺互補 |
| INTP | ENFJ, ENTJ | 思考與情感平衡 |
| ENTJ | INFP, INTP | 領導與支持 |
| ENTP | INFJ, INTJ | 創新與洞察 |
| INFJ | ENFP, ENTP | 理想主義共鳴 |
| INFP | ENFJ, ENTJ | 價值觀互補 |
| ENFJ | INFP, ISFP | 同理心與真誠 |
| ENFP | INTJ, INFJ | 熱情與深度 |
| ISTJ | ESFP, ESTP | 穩定與活力 |
| ISFJ | ESFP, ESTP | 關懷與行動 |
| ESTJ | ISFP, ISTP | 組織與靈活 |
| ESFJ | ISFP, ISTP | 社交與獨立 |
| ISTP | ESFJ, ESTJ | 實用與規劃 |
| ISFP | ENFJ, ESFJ | 藝術與表達 |
| ESTP | ISFJ, ISTJ | 冒險與穩定 |
| ESFP | ISFJ, ISTJ | 樂趣與責任 |

#### **良好配對（80 分）**
- 相同類型：如 INTJ + INTJ
- 2 個字母相同：如 INTJ + INFJ

#### **普通配對（60 分）**
- 1 個字母相同：如 INTJ + ENTJ

#### **未知配對（50 分）**
- 其中一方未設定 MBTI

#### **不推薦配對（30 分）**
- 4 個字母完全相反：如 INTJ + ESFP（但這也可能產生互補）

### 4.2 MBTI 功能配對理論

**基於認知功能堆疊**：
- **Ni-Ne 軸**：INTJ/INFJ ↔ ENFP/ENTP
- **Si-Se 軸**：ISTJ/ISFJ ↔ ESFP/ESTP
- **Ti-Te 軸**：INTP/ISTP ↔ ENTJ/ESTJ
- **Fi-Fe 軸**：INFP/ISFP ↔ ENFJ/ESFJ

---

## 5. 星座配對規則

### 5.1 星座元素分類

| 元素 | 星座 | 特質 |
|------|------|------|
| 火象 | 牡羊座、獅子座、射手座 | 熱情、主動、衝動 |
| 土象 | 金牛座、處女座、摩羯座 | 穩定、務實、可靠 |
| 風象 | 雙子座、天秤座、水瓶座 | 理性、溝通、社交 |
| 水象 | 巨蟹座、天蠍座、雙魚座 | 感性、直覺、情感 |

### 5.2 星座配對表

#### **最佳配對（100 分）**

**火象星座**：
- 牡羊座 ↔ 獅子座、射手座、雙子座、水瓶座
- 獅子座 ↔ 牡羊座、射手座、雙子座、天秤座
- 射手座 ↔ 牡羊座、獅子座、天秤座、水瓶座

**土象星座**：
- 金牛座 ↔ 處女座、摩羯座、巨蟹座、雙魚座
- 處女座 ↔ 金牛座、摩羯座、天蠍座、巨蟹座
- 摩羯座 ↔ 金牛座、處女座、天蠍座、雙魚座

**風象星座**：
- 雙子座 ↔ 天秤座、水瓶座、牡羊座、獅子座
- 天秤座 ↔ 雙子座、水瓶座、獅子座、射手座
- 水瓶座 ↔ 雙子座、天秤座、牡羊座、射手座

**水象星座**：
- 巨蟹座 ↔ 天蠍座、雙魚座、金牛座、處女座
- 天蠍座 ↔ 巨蟹座、雙魚座、處女座、摩羯座
- 雙魚座 ↔ 巨蟹座、天蠍座、金牛座、摩羯座

#### **良好配對（80 分）**
- 同元素：火+火、土+土、風+風、水+水

#### **普通配對（60 分）**
- 火+風、土+水（互補但需磨合）

#### **挑戰配對（40 分）**
- 火+土、火+水、風+土、風+水

#### **未知配對（50 分）**
- 其中一方未設定星座

### 5.3 星座配對原理

1. **同元素**：價值觀相似，容易理解
2. **火+風**：火需要風助燃，風需要火激發
3. **土+水**：土提供穩定，水提供滋養
4. **對立元素**：需要更多溝通和理解

---

## 6. 血型配對規則

### 6.1 血型配對表（基於日韓文化）

#### **最佳配對（100 分）**

| 血型 | 最佳配對 | 說明 |
|------|---------|------|
| A 型 | O 型、AB 型 | A 型謹慎，O 型包容，AB 型理解 |
| B 型 | AB 型、O 型 | B 型自由，AB 型欣賞，O 型支持 |
| O 型 | A 型、B 型、O 型 | O 型適應力強，與多數血型合拍 |
| AB 型 | A 型、B 型、AB 型、O 型 | AB 型兼具 A/B 特質，最具包容性 |

#### **良好配對（80 分）**
- A + A：相互理解，但可能過於謹慎
- B + B：自由奔放，但可能缺乏規劃
- O + O：開朗大方，但可能競爭
- AB + AB：理性溝通，但可能過於理智

#### **普通配對（60 分）**
- A + B：差異較大，需要磨合

#### **未知配對（50 分）**
- 其中一方未設定血型

### 6.2 血型性格特質（參考）

| 血型 | 特質 | 優點 | 缺點 |
|------|------|------|------|
| A 型 | 謹慎、細心、完美主義 | 可靠、負責 | 焦慮、固執 |
| B 型 | 自由、創意、樂觀 | 靈活、有趣 | 衝動、散漫 |
| O 型 | 開朗、領導、現實 | 自信、包容 | 強勢、固執 |
| AB 型 | 理性、矛盾、獨特 | 聰明、適應 | 複雜、矛盾 |

**注意**：血型與性格的關聯缺乏科學證據，僅作為文化參考和娛樂性質。

---

## 7. 年齡配對規則

### 7.1 年齡差距評分

| 年齡差距 | 分數 | 說明 |
|---------|------|------|
| 0-2 歲 | 100 分 | 同齡，生活經驗相似 |
| 3-5 歲 | 90 分 | 接近同齡，話題相近 |
| 6-8 歲 | 70 分 | 有代溝但可接受 |
| 9-12 歲 | 50 分 | 明顯代溝 |
| 13+ 歲 | 30 分 | 顯著代溝 |

### 7.2 年齡段分類

| 年齡段 | 分類 | 特點 |
|--------|------|------|
| 18-22 | 大學生 | 校園生活、初入社會 |
| 23-28 | 職場新人 | 事業起步、戀愛婚姻 |
| 29-35 | 職場中堅 | 事業穩定、家庭規劃 |
| 36-45 | 成熟期 | 事業有成、生活穩定 |
| 46+ | 中年期 | 人生經驗豐富 |

**同年齡段加分**：+10 分

---

## 8. 活躍度加分

### 8.1 上線時間加分

| 上線時間 | 加分 | 說明 |
|---------|------|------|
| 當前在線 | +30 分 | 最高優先級 |
| 1 小時內 | +20 分 | 很可能快速回覆 |
| 24 小時內 | +10 分 | 活躍用戶 |
| 3 天內 | +5 分 | 偶爾上線 |
| 7 天以上 | 0 分 | 不活躍 |

### 8.2 活躍度定義

```sql
last_active_at: 用戶最後活動時間
- 發送消息
- 撿瓶子
- 丟瓶子
- 回覆對話
```

---

## 9. 配對算法實現

### 9.1 配對流程

```
1. 用戶 A 丟出漂流瓶
   ↓
2. 系統查找候選用戶
   - 未撿過此瓶子
   - 符合目標性別
   - 最近 30 天內活躍
   ↓
3. 計算配對分數
   - 語言匹配：40%
   - MBTI 配對：25%
   - 星座配對：15%
   - 血型配對：10%
   - 年齡相近：10%
   - 活躍度加分
   ↓
4. 排序並選擇
   - 按分數排序
   - 選擇前 10 名
   - 隨機選擇 1 名（避免總是同一人）
   ↓
5. 自動配對
   - 創建對話
   - 發送通知
```

### 9.2 候選用戶篩選條件

```typescript
interface CandidateFilter {
  // 必須條件
  not_caught_this_bottle: boolean;
  matches_target_gender: boolean;
  active_within_30_days: boolean;
  not_blocked: boolean;
  not_banned: boolean;
  
  // 優先條件
  active_within_24_hours?: boolean;
  same_language?: boolean;
  has_mbti?: boolean;
  has_zodiac?: boolean;
}
```

### 9.3 配對分數計算

```typescript
function calculateMatchScore(user: User, bottle: Bottle): number {
  let score = 0;
  
  // 1. 語言匹配（40%）
  score += calculateLanguageScore(user.language, bottle.language) * 0.4;
  
  // 2. MBTI 配對（25%）
  score += calculateMBTIScore(user.mbti, bottle.mbti) * 0.25;
  
  // 3. 星座配對（15%）
  score += calculateZodiacScore(user.zodiac, bottle.zodiac) * 0.15;
  
  // 4. 血型配對（10%）
  score += calculateBloodTypeScore(user.blood_type, bottle.blood_type) * 0.1;
  
  // 5. 年齡相近（10%）
  score += calculateAgeScore(user.birthday, bottle.owner_birthday) * 0.1;
  
  // 6. 活躍度加分
  score += calculateActivityBonus(user.last_active_at);
  
  return score;
}
```

---

## 10. 自動推送機制

### 10.1 推送時機

**每日自動推送**：
- 時間：每天上午 10:00（用戶本地時間）
- 條件：用戶當日尚未撿瓶子
- 頻率：每天 1 次

**即時推送**（可選）：
- 當有高匹配度瓶子時（分數 > 85）
- 立即通知用戶

### 10.2 推送消息格式

```
🎁 為你推薦了一個漂流瓶！

📝 暱稱：***（擾碼）
🧠 MBTI：ENFP
⭐ 星座：雙子座
💝 匹配度：92%

💡 這個瓶子和你非常合拍！
• 語言相同 ✓
• MBTI 最佳配對 ✓
• 星座高度相容 ✓

[📖 查看瓶子內容]
[❌ 不感興趣]
```

### 10.3 用戶反饋機制

用戶可以對推薦進行反饋：
- ✅ 喜歡：提升此類配對權重
- ❌ 不喜歡：降低此類配對權重
- 🚫 封鎖：永不推薦此用戶

---

## 11. 隱私與倫理考量

### 11.1 數據使用聲明

```
我們使用以下信息進行智能配對：
✓ 語言偏好
✓ MBTI 性格類型
✓ 星座
✓ 血型
✓ 年齡段

這些信息僅用於提升配對質量，
不會公開顯示完整信息。
```

### 11.2 用戶控制

用戶可以選擇：
- ✅ 啟用/禁用自動推送
- ✅ 選擇參與配對的維度
- ✅ 設置配對偏好
- ✅ 查看配對算法說明

### 11.3 科學聲明

```
⚠️ 重要聲明：

MBTI、星座、血型配對主要基於文化觀念
和心理學理論，不代表科學定律。

本系統旨在提供有趣的配對建議，
真正的人際關係需要雙方的溝通和理解。

我們鼓勵用戶保持開放心態，
給每個人機會，不要過度依賴配對分數。
```

---

## 12. 技術實現要點

### 12.1 數據庫設計

```sql
-- 添加配對相關欄位
ALTER TABLE users ADD COLUMN last_active_at DATETIME;
ALTER TABLE users ADD COLUMN matching_enabled INTEGER DEFAULT 1;

-- 配對歷史記錄
CREATE TABLE matching_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  bottle_id INTEGER NOT NULL,
  match_score REAL NOT NULL,
  is_accepted INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 配對反饋
CREATE TABLE matching_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  bottle_id INTEGER NOT NULL,
  feedback_type TEXT NOT NULL, -- 'like', 'dislike', 'block'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 12.2 Cron Job 設置

```typescript
// 每天上午 10:00 執行自動配對
if (event.cron === '0 10 * * *') {
  const { performDailyMatching } = await import('./services/smart_matching');
  await performDailyMatching(env);
}
```

### 12.3 性能優化

- **緩存**：緩存配對分數計算結果
- **批處理**：批量處理多個用戶的配對
- **索引**：為 last_active_at 添加索引
- **限制**：每次只處理活躍用戶（30 天內）

---

## 13. 測試與優化

### 13.1 A/B 測試

- **對照組**：隨機配對
- **實驗組**：智能配對
- **指標**：對話開啟率、回覆率、滿意度

### 13.2 持續優化

- 根據用戶反饋調整權重
- 分析高分配對的成功率
- 優化算法參數

### 13.3 監控指標

- 配對成功率
- 對話持續時間
- 用戶滿意度
- 系統性能

---

## 14. 未來擴展

### 14.1 機器學習優化

- 使用用戶行為數據訓練模型
- 個性化權重調整
- 預測配對成功率

### 14.2 更多維度

- 興趣愛好匹配
- 地理位置相近
- 在線時間重疊

### 14.3 社交功能

- 配對成功故事分享
- 配對統計數據
- 配對排行榜

---

## 15. 參考資料

### 15.1 MBTI 配對理論
- Jung's Cognitive Functions
- Myers-Briggs Type Compatibility
- Personality Type Relationships

### 15.2 星座配對理論
- Astrological Elements (Fire, Earth, Air, Water)
- Zodiac Compatibility Charts
- Sun Sign Relationships

### 15.3 血型配對理論
- Japanese Blood Type Personality Theory
- Korean Blood Type Dating Culture
- Blood Type Compatibility Studies

**注意**：以上理論主要基於文化觀念和心理學研究，不代表科學定律。

---

**最後更新**：2025-11-20  
**版本**：1.0  
**狀態**：設計階段

