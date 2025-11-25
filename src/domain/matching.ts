/**
 * Smart Matching Domain Logic
 * Based on @doc/SMART_MATCHING_SYSTEM_DESIGN.md
 *
 * Pure functions for calculating match scores between users and bottles.
 * Reuses existing functions from user.ts for age and zodiac calculations.
 */

import { calculateAge } from './user';

// ============================================================================
// Types
// ============================================================================

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

export interface UserMatchData {
  telegram_id: string;
  nickname: string | null;
  username: string | null;
  language: string;
  mbti_result: string | null;
  zodiac: string | null;
  blood_type: string | null;
  birthday: string;
  last_active_at: string;
  is_vip: number;
  gender?: string; // 用於性別過濾
}

export interface BottleMatchData {
  language: string;
  mbti_result: string | null;
  zodiac: string | null;
  blood_type: string | null;
  owner_birthday: string;
}

// ============================================================================
// Age Range Calculation (複用 calculateAge)
// ============================================================================

export const AGE_RANGES = {
  STUDENT: '18-22',
  YOUNG_PROFESSIONAL: '23-28',
  MID_CAREER: '29-35',
  MATURE: '36-45',
  SENIOR: '46+',
} as const;

/**
 * Get age range from birthday
 * 複用 calculateAge 函數
 */
export function getAgeRange(birthday: string): string {
  const age = calculateAge(birthday);

  if (age === null) return AGE_RANGES.STUDENT; // Default

  if (age >= 18 && age <= 22) return AGE_RANGES.STUDENT;
  if (age >= 23 && age <= 28) return AGE_RANGES.YOUNG_PROFESSIONAL;
  if (age >= 29 && age <= 35) return AGE_RANGES.MID_CAREER;
  if (age >= 36 && age <= 45) return AGE_RANGES.MATURE;
  return AGE_RANGES.SENIOR;
}

/**
 * Get adjacent age ranges for a given range
 */
export function getAdjacentAgeRanges(ageRange: string): string[] {
  const ranges = Object.values(AGE_RANGES);
  const index = ranges.indexOf(ageRange as any);

  const adjacent: string[] = [ageRange]; // Include self

  if (index > 0) adjacent.push(ranges[index - 1]);
  if (index < ranges.length - 1) adjacent.push(ranges[index + 1]);

  return adjacent;
}

// ============================================================================
// Language Matching
// ============================================================================

const LANGUAGE_FAMILIES: Record<string, string[]> = {
  chinese: ['zh-TW', 'zh-CN', 'zh-HK'],
  english: ['en-US', 'en-GB', 'en-AU'],
  spanish: ['es-ES', 'es-MX'],
};

/**
 * Calculate language match score
 * 完全匹配: 100, 同語系: 85, VIP不同語言: 70, 免費不同語言: 50
 */
export function calculateLanguageScore(
  userLang: string,
  bottleLang: string,
  isVip: boolean = false
): number {
  // 完全匹配
  if (userLang === bottleLang) return 100;

  // 同語系匹配
  for (const family of Object.values(LANGUAGE_FAMILIES)) {
    if (family.includes(userLang) && family.includes(bottleLang)) {
      return 85;
    }
  }

  // 不同語言（所有用戶都有翻譯）
  return isVip ? 70 : 50;
}

// ============================================================================
// MBTI Matching
// ============================================================================

const MBTI_BEST_MATCHES: Record<string, string[]> = {
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

/**
 * Calculate MBTI match score
 */
export function calculateMBTIScore(userMBTI: string | null, bottleMBTI: string | null): number {
  // 未設定
  if (!userMBTI || !bottleMBTI) return 50;

  // 最佳配對
  if (MBTI_BEST_MATCHES[userMBTI]?.includes(bottleMBTI)) {
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

// ============================================================================
// Zodiac Matching
// ============================================================================

const ZODIAC_ELEMENTS: Record<string, string[]> = {
  fire: ['Aries', 'Leo', 'Sagittarius'],
  earth: ['Taurus', 'Virgo', 'Capricorn'],
  air: ['Gemini', 'Libra', 'Aquarius'],
  water: ['Cancer', 'Scorpio', 'Pisces'],
};

const ZODIAC_BEST_MATCHES: Record<string, string[]> = {
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

/**
 * Calculate zodiac match score
 */
export function calculateZodiacScore(
  userZodiac: string | null,
  bottleZodiac: string | null
): number {
  // 未設定
  if (!userZodiac || !bottleZodiac) return 50;

  // 最佳配對
  if (ZODIAC_BEST_MATCHES[userZodiac]?.includes(bottleZodiac)) {
    return 100;
  }

  // 同元素
  for (const element of Object.values(ZODIAC_ELEMENTS)) {
    if (element.includes(userZodiac) && element.includes(bottleZodiac)) {
      return 80;
    }
  }

  // 互補元素（火+風、土+水）
  const userElement = Object.keys(ZODIAC_ELEMENTS).find((key) =>
    ZODIAC_ELEMENTS[key].includes(userZodiac)
  );
  const bottleElement = Object.keys(ZODIAC_ELEMENTS).find((key) =>
    ZODIAC_ELEMENTS[key].includes(bottleZodiac)
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

// ============================================================================
// Blood Type Matching
// ============================================================================

const BLOOD_TYPE_BEST_MATCHES: Record<string, string[]> = {
  A: ['O', 'AB'],
  B: ['AB', 'O'],
  O: ['A', 'B', 'O'],
  AB: ['A', 'B', 'AB', 'O'],
};

/**
 * Calculate blood type match score
 */
export function calculateBloodTypeScore(
  userBloodType: string | null,
  bottleBloodType: string | null
): number {
  // 未設定
  if (!userBloodType || !bottleBloodType) return 50;

  // 最佳配對
  if (BLOOD_TYPE_BEST_MATCHES[userBloodType]?.includes(bottleBloodType)) {
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

// ============================================================================
// Age Range Matching
// ============================================================================

/**
 * Calculate age range match score
 * 複用 calculateAge 和 getAgeRange 函數
 */
export function calculateAgeRangeScore(userBirthday: string, bottleBirthday: string): number {
  const userRange = getAgeRange(userBirthday);
  const bottleRange = getAgeRange(bottleBirthday);

  // 同年齡區間
  if (userRange === bottleRange) return 100;

  // 相鄰區間
  const ranges = Object.values(AGE_RANGES);
  const userIndex = ranges.indexOf(userRange as any);
  const bottleIndex = ranges.indexOf(bottleRange as any);
  const rangeDiff = Math.abs(userIndex - bottleIndex);

  if (rangeDiff === 1) return 70; // 相鄰區間
  if (rangeDiff === 2) return 40; // 跨1個區間
  return 20; // 跨2+個區間
}

/**
 * Calculate age difference bonus
 * 複用 calculateAge 函數
 */
export function calculateAgeDifferenceBonus(userBirthday: string, bottleBirthday: string): number {
  const userAge = calculateAge(userBirthday);
  const bottleAge = calculateAge(bottleBirthday);

  if (userAge === null || bottleAge === null) return 0;

  const ageDiff = Math.abs(userAge - bottleAge);

  if (ageDiff <= 3) return 5; // 非常接近
  if (ageDiff <= 6) return 2; // 接近
  return 0;
}

// ============================================================================
// Activity Bonus
// ============================================================================

/**
 * Check if user is active within 1 hour (主動配對必要條件)
 */
export function isActiveWithin1Hour(lastActiveAt: string): boolean {
  const now = new Date();
  const lastActive = new Date(lastActiveAt);
  const hoursDiff = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);

  return hoursDiff <= 1;
}

/**
 * Calculate activity bonus
 */
export function calculateActivityBonus(lastActiveAt: string): number {
  if (isActiveWithin1Hour(lastActiveAt)) {
    return 20; // 1小時內活躍
  }
  return 0;
}

// ============================================================================
// Total Match Score
// ============================================================================

/**
 * Calculate total match score
 * 權重：語言35% + MBTI25% + 星座15% + 年齡區間15% + 血型10% + 加分項
 */
export function calculateTotalMatchScore(
  user: UserMatchData,
  bottle: BottleMatchData
): MatchScoreBreakdown {
  const languageScore = calculateLanguageScore(user.language, bottle.language, user.is_vip === 1);
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

/**
 * Check if match score is good enough (提前終止優化)
 * 如果語言或年齡區間分數太低，返回 false
 */
export function isScoreGoodEnough(languageScore: number, ageRangeScore: number): boolean {
  // 語言分數最低 30
  if (languageScore < 30) return false;

  // 年齡區間分數最低 40
  if (ageRangeScore < 40) return false;

  return true;
}
