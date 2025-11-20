# 智能配對系統實現計劃

> **核心改動**：
> - 從「每日自動推送」改為「即時配對」
> - 丟瓶子時：主動為其找 1 小時內活躍的合適用戶，一對一配對
> - 撿瓶子時：優先智能配對 > 隨機配對 > 無瓶子
> - 年齡區間匹配權重提升至 15%
> - 避免競爭條件，一個瓶子只配對給一個用戶

## 階段 1：數據庫準備（第 1-2 天）

### 1.1 Migration 腳本

```sql
-- 0040_add_matching_fields.sql
-- 為用戶表添加配對相關欄位
ALTER TABLE users ADD COLUMN last_active_at TEXT DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN age_range TEXT; -- 冗餘欄位，用於性能優化

-- 性能優化索引（關鍵！）
CREATE INDEX IF NOT EXISTS idx_users_active_status 
ON users(last_active_at DESC, is_banned);

CREATE INDEX IF NOT EXISTS idx_users_language 
ON users(language);

CREATE INDEX IF NOT EXISTS idx_users_age_range 
ON users(age_range);

-- 為瓶子表添加配對狀態
ALTER TABLE bottles ADD COLUMN match_status TEXT DEFAULT 'pending'; 
-- 'pending': 剛丟出，等待配對
-- 'matched': 已配對給特定用戶
-- 'active': 進入公共池，等待撿取
-- 'caught': 已被撿走

-- 性能優化索引
CREATE INDEX IF NOT EXISTS idx_bottles_match_status_created 
ON bottles(match_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bottles_status_owner 
ON bottles(match_status, owner_id);
```

```sql
-- 0041_create_matching_history.sql
-- 配對歷史記錄表
CREATE TABLE IF NOT EXISTS matching_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bottle_id INTEGER NOT NULL,
  matched_user_id TEXT NOT NULL, -- 被配對的用戶
  match_score REAL NOT NULL,
  score_breakdown TEXT, -- JSON: 各維度分數詳情
  match_type TEXT NOT NULL, -- 'active': 主動配對, 'passive': 被動撿取
  is_replied INTEGER DEFAULT 0,
  replied_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (matched_user_id) REFERENCES users(telegram_id),
  FOREIGN KEY (bottle_id) REFERENCES bottles(id)
);

CREATE INDEX idx_matching_history_user ON matching_history(matched_user_id);
CREATE INDEX idx_matching_history_bottle ON matching_history(bottle_id);
CREATE INDEX idx_matching_history_score ON matching_history(match_score DESC);
CREATE INDEX idx_matching_history_type ON matching_history(match_type);
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
 * 年齡區間配對分數計算
 */
export function calculateAgeRangeScore(
  userBirthday: string,
  bottleBirthday: string
): number {
  const userAge = calculateAge(userBirthday);
  const bottleAge = calculateAge(bottleBirthday);
  
  const userRange = getAgeRange(userAge);
  const bottleRange = getAgeRange(bottleAge);
  
  // 同年齡區間
  if (userRange === bottleRange) return 100;
  
  // 相鄰區間
  const ranges = ['18-22', '23-28', '29-35', '36-45', '46+'];
  const userIndex = ranges.indexOf(userRange);
  const bottleIndex = ranges.indexOf(bottleRange);
  const rangeDiff = Math.abs(userIndex - bottleIndex);
  
  if (rangeDiff === 1) return 70; // 相鄰區間
  if (rangeDiff === 2) return 40; // 跨1個區間
  return 20; // 跨2+個區間
}

function getAgeRange(age: number): string {
  if (age >= 18 && age <= 22) return '18-22';
  if (age >= 23 && age <= 28) return '23-28';
  if (age >= 29 && age <= 35) return '29-35';
  if (age >= 36 && age <= 45) return '36-45';
  return '46+';
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
 * 年齡差距加分計算
 */
export function calculateAgeDifferenceBonus(
  userBirthday: string,
  bottleBirthday: string
): number {
  const userAge = calculateAge(userBirthday);
  const bottleAge = calculateAge(bottleBirthday);
  const ageDiff = Math.abs(userAge - bottleAge);
  
  if (ageDiff <= 3) return 5; // 非常接近
  if (ageDiff <= 6) return 2; // 接近
  return 0;
}

/**
 * 活躍度檢查（主動配對必要條件）
 */
export function isActiveWithin1Hour(lastActiveAt: string): boolean {
  const now = new Date();
  const lastActive = new Date(lastActiveAt);
  const hoursDiff = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
  
  return hoursDiff <= 1;
}

/**
 * 活躍度加分計算
 */
export function calculateActivityBonus(lastActiveAt: string): number {
  if (isActiveWithin1Hour(lastActiveAt)) {
    return 20; // 1小時內活躍
  }
  return 0;
}

/**
 * 計算總配對分數
 */
export interface MatchScoreBreakdown {
  language: number;
  mbti: number;
  zodiac: number;
  ageRange: number;
  bloodType: number;
  activityBonus: number;
  ageDifferenceBonus: number;
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
  const ageRangeScore = calculateAgeRangeScore(user.birthday, bottle.owner_birthday);
  const bloodTypeScore = calculateBloodTypeScore(user.blood_type, bottle.blood_type);
  const activityBonus = calculateActivityBonus(user.last_active_at);
  const ageDifferenceBonus = calculateAgeDifferenceBonus(user.birthday, bottle.owner_birthday);
  
  const total =
    languageScore * 0.35 +
    mbtiScore * 0.25 +
    zodiacScore * 0.15 +
    ageRangeScore * 0.15 +
    bloodTypeScore * 0.1 +
    activityBonus +
    ageDifferenceBonus;
  
  return {
    language: languageScore,
    mbti: mbtiScore,
    zodiac: zodiacScore,
    ageRange: ageRangeScore,
    bloodType: bloodTypeScore,
    activityBonus,
    ageDifferenceBonus,
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
import { calculateTotalMatchScore, isActiveWithin1Hour } from '~/domain/matching_score';

/**
 * 配對配置參數（性能優化）
 */
const MATCHING_CONFIG = {
  activeMatching: {
    maxCandidates: 100,        // 最多查詢 100 個候選用戶
    topCandidates: 5,          // 從前 5 名中隨機選擇
    activeWindowMinutes: 60,   // 1 小時內活躍
  },
  passiveMatching: {
    maxBottles: 50,            // 最多查詢 50 個瓶子
    smartMatchThreshold: 70,   // 智能推薦閾值
  },
  preFiltering: {
    languageEnabled: true,     // 啟用語言預過濾
    ageRangeEnabled: true,     // 啟用年齡區間預過濾
    minLanguageScore: 30,      // 語言分數最低 30
    minAgeRangeScore: 40,      // 年齡區間分數最低 40
  },
};

/**
 * 主動配對：當用戶丟瓶子時，立即為其找到最合適的活躍用戶
 */
export async function findActiveMatchForBottle(
  db: D1Database,
  bottleId: number
): Promise<{
  user: any;
  score: any;
} | null> {
  // 1. 獲取瓶子信息（JOIN 優化，一次查詢）
  const bottle = await db
    .prepare(`
      SELECT 
        b.*,
        u.birthday as owner_birthday,
        u.language as owner_language
      FROM bottles b
      JOIN users u ON b.owner_id = u.telegram_id
      WHERE b.id = ?
    `)
    .bind(bottleId)
    .first();
  
  if (!bottle) return null;
  
  // 2. 查找候選用戶（必須 1 小時內活躍）
  // 性能優化：LIMIT 100，使用索引，只查詢需要的欄位
  const candidates = await db
    .prepare(`
      SELECT 
        telegram_id,
        language,
        mbti_result,
        zodiac,
        blood_type,
        birthday,
        last_active_at,
        is_vip
      FROM users
      WHERE telegram_id != ?
        AND is_banned = 0
        AND last_active_at > datetime('now', '-1 hour')
      ORDER BY last_active_at DESC
      LIMIT ?
    `)
    .bind(bottle.owner_id, MATCHING_CONFIG.activeMatching.maxCandidates)
    .all();
  
  if (!candidates.results || candidates.results.length === 0) {
    return null;
  }
  
  // 3. 計算每個候選的配對分數
  const scoredCandidates = candidates.results.map((user: any) => {
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
    
    return { user, score };
  });
  
  // 4. 過濾掉分數太低的候選（提前終止優化）
  const validCandidates = scoredCandidates.filter(c => c.score !== null);
  
  if (validCandidates.length === 0) {
    return null;
  }
  
  // 5. 排序並選擇前 5 名
  validCandidates.sort((a, b) => b.score!.total - a.score!.total);
  const topCandidates = validCandidates.slice(0, MATCHING_CONFIG.activeMatching.topCandidates);
  
  // 6. 從前 5 名中隨機選擇 1 個（避免總是同一人）
  const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)];
  
  return selected;
}

/**
 * 被動配對：當用戶撿瓶子時，優先推薦高分配對
 */
export async function findSmartBottleForUser(
  db: D1Database,
  userId: string
): Promise<{
  bottle: any;
  score: any;
  matchType: 'smart' | 'random';
} | null> {
  // 1. 獲取用戶信息
  const user = await db
    .prepare('SELECT * FROM users WHERE telegram_id = ?')
    .bind(userId)
    .first();
  
  if (!user) return null;
  
  // 2. 查找候選瓶子（只查找公共池中的瓶子）
  // 性能優化：LIMIT 50，使用索引，只查詢需要的欄位
  const candidates = await db
    .prepare(`
      SELECT 
        b.id,
        b.content,
        b.owner_id,
        b.language,
        b.mbti_result,
        b.zodiac,
        b.blood_type,
        b.created_at,
        u.birthday as owner_birthday,
        u.nickname as owner_nickname
      FROM bottles b
      JOIN users u ON b.owner_id = u.telegram_id
      WHERE b.match_status = 'active'
        AND b.owner_id != ?
        AND b.id NOT IN (
          SELECT bottle_id FROM catches WHERE catcher_id = ?
        )
        AND u.is_banned = 0
      ORDER BY b.created_at DESC
      LIMIT ?
    `)
    .bind(userId, userId, MATCHING_CONFIG.passiveMatching.maxBottles)
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
  
  // 4. 排序
  scoredCandidates.sort((a, b) => b.score.total - a.score.total);
  
  // 5. 如果有高分配對（> 閾值），返回智能配對
  if (scoredCandidates[0].score.total > MATCHING_CONFIG.passiveMatching.smartMatchThreshold) {
    return {
      ...scoredCandidates[0],
      matchType: 'smart',
    };
  }
  
  // 6. 否則隨機選擇
  const randomIndex = Math.floor(Math.random() * scoredCandidates.length);
  return {
    ...scoredCandidates[randomIndex],
    matchType: 'random',
  };
}

/**
 * 性能監控包裝器
 */
async function trackPerformance<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: any
): Promise<T> {
  const start = Date.now();
  
  try {
    const result = await fn();
    const duration = Date.now() - start;
    
    console.log(`[Performance] ${operation}: ${duration}ms`, context);
    
    // 如果超過閾值，記錄警告
    if (duration > 500) {
      console.warn(`[Performance] Slow operation: ${operation} took ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`[Performance] ${operation} failed after ${duration}ms:`, error);
    throw error;
  }
}

/**
 * 發送主動配對通知
 */
export async function sendActiveMatchNotification(
  env: any,
  userId: string,
  bottle: any,
  score: any
): Promise<void> {
  const { TelegramService } = await import('./telegram');
  const telegram = new TelegramService(env.TELEGRAM_BOT_TOKEN);
  
  const { maskNickname } = await import('~/utils/privacy');
  const maskedNickname = maskNickname(bottle.owner_nickname || '匿名');
  
  // 計算匹配度百分比
  const matchPercentage = Math.min(100, Math.round(score.total));
  
  // 構建匹配特徵列表
  const features = [];
  if (score.language >= 70) features.push('語言相同 ✓');
  if (score.mbti >= 80) features.push('MBTI 最佳配對 ✓');
  if (score.zodiac >= 80) features.push('星座高度相容 ✓');
  if (score.ageRange >= 80) features.push('年齡區間相同 ✓');
  
  const message =
    `🎁 有人為你送來了一個漂流瓶！\n\n` +
    `📝 暱稱：${maskedNickname}\n` +
    `🧠 MBTI：${bottle.mbti_result || '未設定'}\n` +
    `⭐ 星座：${bottle.zodiac || '未設定'}\n` +
    `💝 匹配度：${matchPercentage}%\n\n` +
    `💡 這個瓶子和你非常合拍！\n` +
    (features.length > 0 ? `${features.map(f => `• ${f}`).join('\n')}\n\n` : '') +
    `━━━━━━━━━━━━━━━━\n` +
    `${bottle.content}\n` +
    `━━━━━━━━━━━━━━━━\n\n` +
    `💬 直接按 /reply 回覆訊息聊天`;
  
  await telegram.sendMessage(userId, message);
}
```

---

## 階段 4：Handler 層實現（第 9-10 天）

### 4.1 丟瓶子 Handler 修改

**文件**：`src/telegram/handlers/throw.ts`

```typescript
// 在用戶成功丟出瓶子後，立即嘗試主動配對

// 1. 創建瓶子，狀態為 'pending'
const bottleId = await createBottle(db, userId, content, 'pending');

// 2. 嘗試主動配對
const { findActiveMatchForBottle, sendActiveMatchNotification } = 
  await import('~/services/smart_matching');

const match = await findActiveMatchForBottle(db, bottleId);

if (match) {
  // 3. 找到合適的活躍用戶
  // 更新瓶子狀態為 'matched'
  await db
    .prepare('UPDATE bottles SET match_status = ? WHERE id = ?')
    .bind('matched', bottleId)
    .run();
  
  // 4. 記錄配對歷史
  await db
    .prepare(`
      INSERT INTO matching_history 
      (bottle_id, matched_user_id, match_score, score_breakdown, match_type)
      VALUES (?, ?, ?, ?, ?)
    `)
    .bind(
      bottleId,
      match.user.telegram_id,
      match.score.total,
      JSON.stringify(match.score),
      'active'
    )
    .run();
  
  // 5. 發送通知給配對用戶
  await sendActiveMatchNotification(env, match.user.telegram_id, bottle, match.score);
  
  // 6. 告訴丟瓶子的用戶
  await telegram.sendMessage(
    chatId,
    `🎉 漂流瓶已丟出並成功配對！\n\n` +
    `💝 匹配度：${Math.round(match.score.total)}%\n` +
    `⏰ 已推送給在線用戶\n\n` +
    `💡 對方很可能很快就會回覆你～`
  );
} else {
  // 7. 無合適用戶，進入公共池
  await db
    .prepare('UPDATE bottles SET match_status = ? WHERE id = ?')
    .bind('active', bottleId)
    .run();
  
  await telegram.sendMessage(
    chatId,
    `🎉 漂流瓶已丟出！\n\n` +
    `瓶子 ID：#${bottleId}\n\n` +
    `💡 你的瓶子已進入公共池，等待有緣人撿起～`
  );
}
```

### 4.2 撿瓶子 Handler 修改

**文件**：`src/telegram/handlers/catch.ts`

```typescript
// 在用戶執行 /catch 時，優先智能配對

const { findSmartBottleForUser } = await import('~/services/smart_matching');

// 1. 嘗試智能配對
const match = await findSmartBottleForUser(db, userId);

if (!match) {
  // 無瓶子
  await telegram.sendMessage(chatId, '暫時沒有瓶子，請稍後再試～');
  return;
}

// 2. 顯示匹配類型
if (match.matchType === 'smart') {
  const matchPercentage = Math.min(100, Math.round(match.score.total));
  await telegram.sendMessage(
    chatId,
    `🎁 為你智能推薦了一個高匹配度的瓶子！\n💝 匹配度：${matchPercentage}%\n\n`
  );
}

// 3. 記錄配對歷史
await db
  .prepare(`
    INSERT INTO matching_history 
    (bottle_id, matched_user_id, match_score, score_breakdown, match_type)
    VALUES (?, ?, ?, ?, ?)
  `)
  .bind(
    match.bottle.id,
    userId,
    match.score.total,
    JSON.stringify(match.score),
    'passive'
  )
  .run();

// 4. 繼續原有的撿瓶子流程...
```

---

## 階段 5：測試與優化（第 10-12 天）

---

## 階段 6：測試與優化（第 13-14 天）

### 6.1 Smoke Test 擴展

```typescript
// scripts/smoke-test.ts

async function testSmartMatching() {
  console.log('\n🧪 Testing Smart Matching System...');
  
  // 1. 測試配對分數計算
  testMatchScoreCalculation();
  
  // 2. 測試主動配對流程
  testActiveMatching();
  
  // 3. 測試被動配對流程
  testPassiveMatching();
  
  // 4. 測試活躍度檢查
  testActivityCheck();
  
  // 5. 測試年齡區間計算
  testAgeRangeCalculation();
}
```

### 6.2 性能測試

- 測試主動配對時間（< 500ms）
- 測試被動配對時間（< 300ms）
- 優化 SQL 查詢（添加索引）
- 測試並發配對（避免競爭條件）

### 6.3 競爭條件測試

```typescript
// 測試兩個用戶同時撿同一個瓶子
// 確保只有一個成功
// 另一個獲得下一個瓶子
```

---

## 階段 7：文檔與部署（第 15 天）

### 7.1 用戶文檔

- 智能配對系統說明
- 配對算法透明度
- 隱私聲明

### 7.2 部署檢查清單

- [ ] 執行所有 migrations
- [ ] 運行 smoke tests
- [ ] 測試主動配對流程
- [ ] 測試被動配對流程
- [ ] 測試競爭條件
- [ ] 部署到 Staging
- [ ] 手動測試
- [ ] 部署到 Production
- [ ] 監控配對成功率

---

## 預期成果

### 功能指標
- ✅ 主動配對成功率 > 60%（1小時內活躍用戶）
- ✅ 被動配對智能推薦率 > 40%（分數 > 70）
- ✅ 配對分數準確率 > 85%
- ✅ 通知發送成功率 > 95%

### 性能指標
- ✅ 主動配對時間 < 500ms
- ✅ 被動配對時間 < 300ms
- ✅ 無競爭條件錯誤

### 用戶體驗指標
- ✅ 主動配對回覆率 > 50%（1小時內）
- ✅ 被動配對回覆率 > 30%
- ✅ 用戶滿意度 > 4/5

---

## 核心改進總結

### 從「每日推送」到「即時配對」
- **之前**：每天定時為所有用戶推薦瓶子
- **現在**：丟瓶子時立即配對，撿瓶子時智能推薦

### 從「多人搶瓶」到「一對一配對」
- **之前**：多人可能看到同一個瓶子，產生競爭
- **現在**：主動配對直接推送，避免競爭條件

### 從「年齡差距」到「年齡區間」
- **之前**：只看年齡差距（10%權重）
- **現在**：優先看年齡區間（15%權重），輔助看年齡差距

### 從「24小時活躍」到「1小時活躍」
- **之前**：24小時內活躍即可
- **現在**：主動配對必須1小時內活躍

---

**總開發時間**：15 天  
**優先級**：高  
**風險等級**：中  
**狀態**：設計完成，待開發

