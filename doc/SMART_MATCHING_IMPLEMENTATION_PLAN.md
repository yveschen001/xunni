# 智能配對系統實現計劃

## 階段 1：數據庫準備（第 1-2 天）

### 1.1 Migration 腳本

```sql
-- 0040_add_matching_fields.sql
-- 為用戶表添加配對相關欄位
ALTER TABLE users ADD COLUMN last_active_at TEXT DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN matching_enabled INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN matching_preferences TEXT; -- JSON: 配對偏好

CREATE INDEX idx_users_last_active ON users(last_active_at);
CREATE INDEX idx_users_matching_enabled ON users(matching_enabled);
```

```sql
-- 0041_create_matching_history.sql
-- 配對歷史記錄表
CREATE TABLE IF NOT EXISTS matching_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  bottle_id INTEGER NOT NULL,
  match_score REAL NOT NULL,
  score_breakdown TEXT, -- JSON: 各維度分數詳情
  is_accepted INTEGER DEFAULT 0,
  is_replied INTEGER DEFAULT 0,
  feedback_type TEXT, -- 'like', 'dislike', 'block', NULL
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(telegram_id),
  FOREIGN KEY (bottle_id) REFERENCES bottles(id)
);

CREATE INDEX idx_matching_history_user ON matching_history(user_id);
CREATE INDEX idx_matching_history_bottle ON matching_history(bottle_id);
CREATE INDEX idx_matching_history_score ON matching_history(match_score DESC);
```

```sql
-- 0042_create_matching_feedback.sql
-- 配對反饋表
CREATE TABLE IF NOT EXISTS matching_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  target_user_id TEXT NOT NULL,
  feedback_type TEXT NOT NULL, -- 'like', 'dislike', 'block'
  reason TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(telegram_id),
  FOREIGN KEY (target_user_id) REFERENCES users(telegram_id)
);

CREATE INDEX idx_matching_feedback_user ON matching_feedback(user_id);
CREATE INDEX idx_matching_feedback_target ON matching_feedback(target_user_id);
```

---

## 階段 2：Domain 層實現（第 3-5 天）

### 2.1 配對分數計算

**文件**：`src/domain/matching_score.ts`

```typescript
/**
 * 語言匹配分數計算
 */
export function calculateLanguageScore(
  userLang: string,
  bottleLang: string
): number {
  // 完全匹配
  if (userLang === bottleLang) return 100;
  
  // 同語系匹配
  const languageFamilies = {
    chinese: ['zh-TW', 'zh-CN', 'zh-HK'],
    english: ['en-US', 'en-GB', 'en-AU'],
    spanish: ['es-ES', 'es-MX'],
  };
  
  for (const family of Object.values(languageFamilies)) {
    if (family.includes(userLang) && family.includes(bottleLang)) {
      return 70;
    }
  }
  
  // 無匹配
  return 30;
}

/**
 * MBTI 配對分數計算
 */
export function calculateMBTIScore(
  userMBTI: string | null,
  bottleMBTI: string | null
): number {
  // 未設定
  if (!userMBTI || !bottleMBTI) return 50;
  
  // 最佳配對表
  const bestMatches: Record<string, string[]> = {
    INTJ: ['ENFP', 'ENTP'],
    INTP: ['ENFJ', 'ENTJ'],
    ENTJ: ['INFP', 'INTP'],
    ENTP: ['INFJ', 'INTJ'],
    INFJ: ['ENFP', 'ENTP'],
    INFP: ['ENFJ', 'ENTJ'],
    ENFJ: ['INFP', 'ISFP'],
    ENFP: ['INTJ', 'INFJ'],
    ISTJ: ['ESFP', 'ESTP'],
    ISFJ: ['ESFP', 'ESTP'],
    ESTJ: ['ISFP', 'ISTP'],
    ESFJ: ['ISFP', 'ISTP'],
    ISTP: ['ESFJ', 'ESTJ'],
    ISFP: ['ENFJ', 'ESFJ'],
    ESTP: ['ISFJ', 'ISTJ'],
    ESFP: ['ISFJ', 'ISTJ'],
  };
  
  // 最佳配對
  if (bestMatches[userMBTI]?.includes(bottleMBTI)) {
    return 100;
  }
  
  // 相同類型
  if (userMBTI === bottleMBTI) {
    return 80;
  }
  
  // 計算相同字母數量
  let sameLetters = 0;
  for (let i = 0; i < 4; i++) {
    if (userMBTI[i] === bottleMBTI[i]) sameLetters++;
  }
  
  // 2個字母相同
  if (sameLetters === 2) return 60;
  
  // 1個字母相同
  if (sameLetters === 1) return 40;
  
  // 完全相反（可能互補）
  return 30;
}

/**
 * 星座配對分數計算
 */
export function calculateZodiacScore(
  userZodiac: string | null,
  bottleZodiac: string | null
): number {
  // 未設定
  if (!userZodiac || !bottleZodiac) return 50;
  
  // 星座元素分類
  const elements = {
    fire: ['Aries', 'Leo', 'Sagittarius'],
    earth: ['Taurus', 'Virgo', 'Capricorn'],
    air: ['Gemini', 'Libra', 'Aquarius'],
    water: ['Cancer', 'Scorpio', 'Pisces'],
  };
  
  // 最佳配對表
  const bestMatches: Record<string, string[]> = {
    Aries: ['Leo', 'Sagittarius', 'Gemini', 'Aquarius'],
    Taurus: ['Virgo', 'Capricorn', 'Cancer', 'Pisces'],
    Gemini: ['Libra', 'Aquarius', 'Aries', 'Leo'],
    Cancer: ['Scorpio', 'Pisces', 'Taurus', 'Virgo'],
    Leo: ['Aries', 'Sagittarius', 'Gemini', 'Libra'],
    Virgo: ['Taurus', 'Capricorn', 'Scorpio', 'Cancer'],
    Libra: ['Gemini', 'Aquarius', 'Leo', 'Sagittarius'],
    Scorpio: ['Cancer', 'Pisces', 'Virgo', 'Capricorn'],
    Sagittarius: ['Aries', 'Leo', 'Libra', 'Aquarius'],
    Capricorn: ['Taurus', 'Virgo', 'Scorpio', 'Pisces'],
    Aquarius: ['Gemini', 'Libra', 'Aries', 'Sagittarius'],
    Pisces: ['Cancer', 'Scorpio', 'Taurus', 'Capricorn'],
  };
  
  // 最佳配對
  if (bestMatches[userZodiac]?.includes(bottleZodiac)) {
    return 100;
  }
  
  // 同元素
  for (const element of Object.values(elements)) {
    if (element.includes(userZodiac) && element.includes(bottleZodiac)) {
      return 80;
    }
  }
  
  // 互補元素（火+風、土+水）
  const userElement = Object.keys(elements).find(key =>
    elements[key as keyof typeof elements].includes(userZodiac)
  );
  const bottleElement = Object.keys(elements).find(key =>
    elements[key as keyof typeof elements].includes(bottleZodiac)
  );
  
  if (
    (userElement === 'fire' && bottleElement === 'air') ||
    (userElement === 'air' && bottleElement === 'fire') ||
    (userElement === 'earth' && bottleElement === 'water') ||
    (userElement === 'water' && bottleElement === 'earth')
  ) {
    return 60;
  }
  
  // 其他組合
  return 40;
}

/**
 * 血型配對分數計算
 */
export function calculateBloodTypeScore(
  userBloodType: string | null,
  bottleBloodType: string | null
): number {
  // 未設定
  if (!userBloodType || !bottleBloodType) return 50;
  
  // 最佳配對表
  const bestMatches: Record<string, string[]> = {
    A: ['O', 'AB'],
    B: ['AB', 'O'],
    O: ['A', 'B', 'O'],
    AB: ['A', 'B', 'AB', 'O'],
  };
  
  // 最佳配對
  if (bestMatches[userBloodType]?.includes(bottleBloodType)) {
    return 100;
  }
  
  // 相同血型
  if (userBloodType === bottleBloodType) {
    return 80;
  }
  
  // A + B（需磨合）
  if (
    (userBloodType === 'A' && bottleBloodType === 'B') ||
    (userBloodType === 'B' && bottleBloodType === 'A')
  ) {
    return 60;
  }
  
  return 50;
}

/**
 * 年齡配對分數計算
 */
export function calculateAgeScore(
  userBirthday: string,
  bottleBirthday: string
): number {
  const userAge = calculateAge(userBirthday);
  const bottleAge = calculateAge(bottleBirthday);
  const ageDiff = Math.abs(userAge - bottleAge);
  
  if (ageDiff <= 2) return 100;
  if (ageDiff <= 5) return 90;
  if (ageDiff <= 8) return 70;
  if (ageDiff <= 12) return 50;
  return 30;
}

function calculateAge(birthday: string): number {
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * 活躍度加分計算
 */
export function calculateActivityBonus(lastActiveAt: string): number {
  const now = new Date();
  const lastActive = new Date(lastActiveAt);
  const hoursDiff = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
  
  if (hoursDiff < 0.1) return 30; // 當前在線（6分鐘內）
  if (hoursDiff <= 1) return 20; // 1小時內
  if (hoursDiff <= 24) return 10; // 24小時內
  if (hoursDiff <= 72) return 5; // 3天內
  return 0;
}

/**
 * 計算總配對分數
 */
export interface MatchScoreBreakdown {
  language: number;
  mbti: number;
  zodiac: number;
  bloodType: number;
  age: number;
  activity: number;
  total: number;
}

export function calculateTotalMatchScore(
  user: {
    language: string;
    mbti_result: string | null;
    zodiac: string | null;
    blood_type: string | null;
    birthday: string;
    last_active_at: string;
  },
  bottle: {
    language: string;
    mbti_result: string | null;
    zodiac: string | null;
    blood_type: string | null;
    owner_birthday: string;
  }
): MatchScoreBreakdown {
  const languageScore = calculateLanguageScore(user.language, bottle.language);
  const mbtiScore = calculateMBTIScore(user.mbti_result, bottle.mbti_result);
  const zodiacScore = calculateZodiacScore(user.zodiac, bottle.zodiac);
  const bloodTypeScore = calculateBloodTypeScore(user.blood_type, bottle.blood_type);
  const ageScore = calculateAgeScore(user.birthday, bottle.owner_birthday);
  const activityBonus = calculateActivityBonus(user.last_active_at);
  
  const total =
    languageScore * 0.4 +
    mbtiScore * 0.25 +
    zodiacScore * 0.15 +
    bloodTypeScore * 0.1 +
    ageScore * 0.1 +
    activityBonus;
  
  return {
    language: languageScore,
    mbti: mbtiScore,
    zodiac: zodiacScore,
    bloodType: bloodTypeScore,
    age: ageScore,
    activity: activityBonus,
    total: Math.round(total * 10) / 10, // 保留1位小數
  };
}
```

### 2.2 單元測試

**文件**：`tests/domain/matching_score.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  calculateLanguageScore,
  calculateMBTIScore,
  calculateZodiacScore,
  calculateBloodTypeScore,
  calculateAgeScore,
  calculateActivityBonus,
  calculateTotalMatchScore,
} from '~/domain/matching_score';

describe('Matching Score Calculation', () => {
  describe('Language Score', () => {
    it('should return 100 for exact match', () => {
      expect(calculateLanguageScore('zh-TW', 'zh-TW')).toBe(100);
    });
    
    it('should return 70 for same language family', () => {
      expect(calculateLanguageScore('zh-TW', 'zh-CN')).toBe(70);
    });
    
    it('should return 30 for different languages', () => {
      expect(calculateLanguageScore('zh-TW', 'en-US')).toBe(30);
    });
  });
  
  describe('MBTI Score', () => {
    it('should return 100 for best matches', () => {
      expect(calculateMBTIScore('INTJ', 'ENFP')).toBe(100);
      expect(calculateMBTIScore('INFJ', 'ENTP')).toBe(100);
    });
    
    it('should return 80 for same type', () => {
      expect(calculateMBTIScore('INTJ', 'INTJ')).toBe(80);
    });
    
    it('should return 50 for unknown', () => {
      expect(calculateMBTIScore(null, 'INTJ')).toBe(50);
    });
  });
  
  // ... 更多測試
});
```

---

## 階段 3：服務層實現（第 6-8 天）

### 3.1 智能配對服務

**文件**：`src/services/smart_matching.ts`

```typescript
import type { D1Database } from '@cloudflare/workers-types';
import { calculateTotalMatchScore } from '~/domain/matching_score';

/**
 * 為單個用戶找到最佳配對瓶子
 */
export async function findBestMatchForUser(
  db: D1Database,
  userId: string
): Promise<{
  bottle: any;
  score: any;
} | null> {
  // 1. 獲取用戶信息
  const user = await db
    .prepare('SELECT * FROM users WHERE telegram_id = ?')
    .bind(userId)
    .first();
  
  if (!user) return null;
  
  // 2. 查找候選瓶子
  const candidates = await db
    .prepare(`
      SELECT b.*, u.birthday as owner_birthday, u.last_active_at as owner_last_active
      FROM bottles b
      JOIN users u ON b.owner_id = u.telegram_id
      WHERE b.status = 'active'
        AND b.owner_id != ?
        AND b.id NOT IN (
          SELECT bottle_id FROM catches WHERE catcher_id = ?
        )
        AND u.last_active_at > datetime('now', '-30 days')
        AND u.is_banned = 0
      ORDER BY b.created_at DESC
      LIMIT 100
    `)
    .bind(userId, userId)
    .all();
  
  if (!candidates.results || candidates.results.length === 0) {
    return null;
  }
  
  // 3. 計算每個候選的配對分數
  const scoredCandidates = candidates.results.map((bottle: any) => {
    const score = calculateTotalMatchScore(
      {
        language: user.language,
        mbti_result: user.mbti_result,
        zodiac: user.zodiac,
        blood_type: user.blood_type,
        birthday: user.birthday,
        last_active_at: user.last_active_at,
      },
      {
        language: bottle.language,
        mbti_result: bottle.mbti_result,
        zodiac: bottle.zodiac,
        blood_type: bottle.blood_type,
        owner_birthday: bottle.owner_birthday,
      }
    );
    
    return { bottle, score };
  });
  
  // 4. 排序並選擇前10名
  scoredCandidates.sort((a, b) => b.score.total - a.score.total);
  const topCandidates = scoredCandidates.slice(0, 10);
  
  // 5. 從前10名中隨機選擇1個（避免總是同一人）
  const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)];
  
  return selected;
}

/**
 * 每日自動配對任務
 */
export async function performDailyMatching(env: any): Promise<void> {
  const db = env.DB;
  
  // 1. 獲取所有啟用配對的活躍用戶
  const users = await db
    .prepare(`
      SELECT telegram_id
      FROM users
      WHERE matching_enabled = 1
        AND is_banned = 0
        AND last_active_at > datetime('now', '-7 days')
    `)
    .all();
  
  if (!users.results) return;
  
  console.log(`[Daily Matching] Processing ${users.results.length} users`);
  
  // 2. 為每個用戶找到最佳配對
  for (const user of users.results) {
    try {
      const match = await findBestMatchForUser(db, user.telegram_id);
      
      if (match) {
        // 3. 記錄配對歷史
        await db
          .prepare(`
            INSERT INTO matching_history (user_id, bottle_id, match_score, score_breakdown)
            VALUES (?, ?, ?, ?)
          `)
          .bind(
            user.telegram_id,
            match.bottle.id,
            match.score.total,
            JSON.stringify(match.score)
          )
          .run();
        
        // 4. 發送通知
        await sendMatchNotification(env, user.telegram_id, match);
      }
    } catch (error) {
      console.error(`[Daily Matching] Error for user ${user.telegram_id}:`, error);
    }
  }
  
  console.log('[Daily Matching] Completed');
}

/**
 * 發送配對通知
 */
async function sendMatchNotification(
  env: any,
  userId: string,
  match: { bottle: any; score: any }
): Promise<void> {
  const { TelegramService } = await import('./telegram');
  const telegram = new TelegramService(env.TELEGRAM_BOT_TOKEN);
  
  const { maskNickname } = await import('~/utils/privacy');
  const maskedNickname = maskNickname(match.bottle.owner_nickname || '匿名');
  
  // 計算匹配度百分比
  const matchPercentage = Math.min(100, Math.round(match.score.total));
  
  // 構建匹配特徵列表
  const features = [];
  if (match.score.language >= 70) features.push('語言相同 ✓');
  if (match.score.mbti >= 80) features.push('MBTI 最佳配對 ✓');
  if (match.score.zodiac >= 80) features.push('星座高度相容 ✓');
  if (match.score.age >= 90) features.push('年齡相近 ✓');
  
  const message =
    `🎁 為你推薦了一個漂流瓶！\n\n` +
    `📝 暱稱：${maskedNickname}\n` +
    `🧠 MBTI：${match.bottle.mbti_result || '未設定'}\n` +
    `⭐ 星座：${match.bottle.zodiac || '未設定'}\n` +
    `💝 匹配度：${matchPercentage}%\n\n` +
    `💡 這個瓶子和你非常合拍！\n` +
    (features.length > 0 ? `${features.map(f => `• ${f}`).join('\n')}\n\n` : '') +
    `使用 /catch 查看瓶子內容`;
  
  await telegram.sendMessage(userId, message);
}
```

---

## 階段 4：Handler 層實現（第 9-10 天）

### 4.1 配對設置命令

**文件**：`src/telegram/handlers/matching_settings.ts`

```typescript
/**
 * /matching_settings - 配對設置
 */
export async function handleMatchingSettings(
  message: TelegramMessage,
  env: any
): Promise<void> {
  // 實現配對設置界面
  // - 啟用/禁用自動配對
  // - 選擇參與的維度
  // - 查看配對統計
}

/**
 * /matching_stats - 配對統計
 */
export async function handleMatchingStats(
  message: TelegramMessage,
  env: any
): Promise<void> {
  // 顯示配對統計
  // - 平均配對分數
  // - 最高配對分數
  // - 配對成功率
}
```

---

## 階段 5：Cron Job 集成（第 11 天）

### 5.1 Wrangler 配置

```toml
# wrangler.toml

[triggers]
crons = [
  "0 10 * * *",  # Daily reports at 10:00 UTC
  "0 2 * * *",   # Daily matching at 02:00 UTC (10:00 Asia/Taipei)
]
```

### 5.2 Worker 集成

```typescript
// src/worker.ts

if (event.cron === '0 2 * * *') {
  const { performDailyMatching } = await import('./services/smart_matching');
  await performDailyMatching(env);
  return new Response('Daily matching completed', { status: 200 });
}
```

---

## 階段 6：測試與優化（第 12-14 天）

### 6.1 Smoke Test 擴展

```typescript
// scripts/smoke-test.ts

async function testSmartMatching() {
  console.log('\n🧪 Testing Smart Matching System...');
  
  // 1. 測試配對分數計算
  // 2. 測試候選篩選
  // 3. 測試配對通知
  // 4. 測試配對設置
}
```

### 6.2 性能測試

- 測試 100 用戶配對時間
- 測試 1000 瓶子篩選時間
- 優化 SQL 查詢
- 添加必要索引

---

## 階段 7：文檔與部署（第 15 天）

### 7.1 用戶文檔

- 配對系統使用指南
- 配對算法說明
- 隱私聲明

### 7.2 部署檢查清單

- [ ] 執行所有 migrations
- [ ] 運行 smoke tests
- [ ] 檢查 Cron Job 配置
- [ ] 部署到 Staging
- [ ] 手動測試
- [ ] 部署到 Production
- [ ] 監控配對執行

---

## 預期成果

### 功能指標
- ✅ 每日自動為活躍用戶推薦 1 個瓶子
- ✅ 配對分數準確率 > 85%
- ✅ 通知發送成功率 > 95%

### 性能指標
- ✅ 單用戶配對時間 < 500ms
- ✅ 每日配對任務完成時間 < 5 分鐘（1000 用戶）

### 用戶體驗指標
- ✅ 配對接受率 > 30%
- ✅ 對話開啟率 > 50%
- ✅ 用戶滿意度 > 4/5

---

**總開發時間**：15 天  
**優先級**：中高  
**風險等級**：中

