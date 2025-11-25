/**
 * Broadcast Filters Domain Logic
 * Pure functions for parsing and validating broadcast filters
 *
 * 參考文檔：doc/BROADCAST_SYSTEM_DESIGN.md 第 7.2 節
 */

import type { createI18n } from '~/i18n';

/**
 * 廣播過濾器接口
 *
 * 支援的過濾維度：
 * - gender: 性別過濾
 * - zodiac: 星座過濾
 * - country: 國家過濾
 * - age: 年齡層過濾
 * - mbti: MBTI 類型過濾
 * - vip: VIP 狀態過濾
 * - is_birthday: 生日過濾（自動化系統使用）
 */
export interface BroadcastFilters {
  gender?: 'male' | 'female' | 'other';
  zodiac?: string; // 'Aries', 'Taurus', etc.
  country?: string; // 'TW', 'US', etc. (ISO 3166-1 alpha-2)
  age?: { min: number; max: number };
  mbti?: string; // 'INTJ', 'ENFP', etc.
  vip?: boolean; // true = VIP only, false = non-VIP only

  // 自動化擴展接口
  is_birthday?: boolean; // 篩選當天生日的用戶
}

/**
 * 有效的星座列表（12 星座）
 */
const VALID_ZODIACS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
] as const;

/**
 * 有效的 MBTI 類型列表（16 種）
 */
const VALID_MBTI = [
  'INTJ',
  'INTP',
  'ENTJ',
  'ENTP',
  'INFJ',
  'INFP',
  'ENFJ',
  'ENFP',
  'ISTJ',
  'ISFJ',
  'ESTJ',
  'ESFJ',
  'ISTP',
  'ISFP',
  'ESTP',
  'ESFP',
] as const;

/**
 * 解析過濾器字串
 *
 * @param filtersStr - 過濾器字串（格式：key=value,key=value）
 * @param i18n - 可選的 i18n 實例
 * @returns 解析後的過濾器對象
 * @throws Error 如果過濾器格式無效
 *
 * @example
 * parseFilters('gender=female,age=18-25,country=TW')
 * // => { gender: 'female', age: { min: 18, max: 25 }, country: 'TW' }
 */
export function parseFilters(filtersStr: string, i18n?: ReturnType<typeof createI18n>): BroadcastFilters {
  const filters: BroadcastFilters = {};

  // 分割過濾器（逗號分隔）
  const filterPairs = filtersStr.split(',');

  for (const pair of filterPairs) {
    const [key, value] = pair.split('=');

    if (!key || !value) {
      throw new Error(i18n?.t('broadcast.filter.invalidFormat', { pair }) || `無效的過濾器格式：${pair}`);
    }

    const trimmedKey = key.trim();
    const trimmedValue = value.trim();

    switch (trimmedKey) {
      case 'gender':
        if (!['male', 'female', 'other'].includes(trimmedValue)) {
          throw new Error(i18n?.t('broadcast.filter.invalidGender', { value: trimmedValue }) || `無效的性別值：${trimmedValue}（必須是 male, female 或 other）`);
        }
        filters.gender = trimmedValue as 'male' | 'female' | 'other';
        break;

      case 'zodiac': {
        if (!VALID_ZODIACS.includes(trimmedValue as (typeof VALID_ZODIACS)[number])) {
          throw new Error(
            i18n?.t('broadcast.filter.invalidZodiac', { value: trimmedValue, zodiacs: VALID_ZODIACS.join(', ') }) ||
            `無效的星座：${trimmedValue}（必須是以下之一：${VALID_ZODIACS.join(', ')}）` // Fallback only, should use i18n.t('broadcast.filter.invalidZodiac')
          );
        }
        filters.zodiac = trimmedValue;
        break;
      }

      case 'country':
        // 驗證國家代碼（2 個大寫字母）
        if (!/^[A-Z]{2}$/.test(trimmedValue)) {
          throw new Error(i18n?.t('broadcast.filter.invalidCountry', { value: trimmedValue }) || `無效的國家代碼：${trimmedValue}（必須是 2 個大寫字母，如 TW, US, JP）`);
        }
        filters.country = trimmedValue;
        break;

      case 'age': {
        // 解析年齡範圍：18-25
        const [minStr, maxStr] = trimmedValue.split('-');
        const min = parseInt(minStr);
        const max = parseInt(maxStr);

        if (isNaN(min) || isNaN(max)) {
          throw new Error(i18n?.t('broadcast.filter.invalidAgeFormat', { value: trimmedValue }) || `無效的年齡範圍：${trimmedValue}（格式必須是 min-max，如 18-25）`);
        }

        if (min < 18 || max > 99) {
          throw new Error(i18n?.t('broadcast.filter.invalidAgeRange', { value: trimmedValue }) || `無效的年齡範圍：${trimmedValue}（年齡必須在 18-99 之間）`);
        }

        if (min > max) {
          throw new Error(i18n?.t('broadcast.filter.invalidAgeMinMax', { value: trimmedValue }) || `無效的年齡範圍：${trimmedValue}（最小年齡不能大於最大年齡）`);
        }

        filters.age = { min, max };
        break;
      }

      case 'mbti': {
        const upperMBTI = trimmedValue.toUpperCase();
        if (!VALID_MBTI.includes(upperMBTI as (typeof VALID_MBTI)[number])) {
          throw new Error(
            i18n?.t('broadcast.filter.invalidMbti', { value: trimmedValue, mbtis: VALID_MBTI.join(', ') }) ||
            `無效的 MBTI 類型：${trimmedValue}（必須是以下之一：${VALID_MBTI.join(', ')}）` // Fallback only, should use i18n.t('broadcast.filter.invalidMbti')
          );
        }
        filters.mbti = upperMBTI;
        break;
      }

      case 'vip':
        filters.vip = trimmedValue === 'true' || trimmedValue === '1';
        break;

      case 'is_birthday':
        filters.is_birthday = trimmedValue === 'true' || trimmedValue === '1';
        break;

      default:
        throw new Error(i18n?.t('broadcast.filter.unknownFilter', { key: trimmedKey }) || `未知的過濾器：${trimmedKey}`);
    }
  }

  return filters;
}

/**
 * 驗證過濾器
 *
 * @param filters - 過濾器對象
 * @returns 驗證結果
 */
export function validateFilters(filters: BroadcastFilters, i18n?: ReturnType<typeof createI18n>): {
  valid: boolean;
  error?: string;
} {
  // 至少要有一個過濾器
  if (Object.keys(filters).length === 0) {
    return { valid: false, error: i18n?.t('broadcast.filter.atLeastOneRequired') || '至少需要一個過濾器' };
  }

  return { valid: true };
}

/**
 * 格式化過濾器描述（用於顯示）
 *
 * @param filters - 過濾器對象
 * @param i18n - 可選的 i18n 實例
 * @returns 中文描述字串
 *
 * @example
 * formatFiltersDescription({ gender: 'female', age: { min: 18, max: 25 } })
 * // => "女性、年齡：18-25 歲"
 */
export function formatFiltersDescription(filters: BroadcastFilters, i18n?: ReturnType<typeof createI18n>): string {
  const parts: string[] = [];

  if (filters.gender) {
    const genderMap: Record<string, string> = {
      male: i18n?.t('broadcast.filter.genderMale') || '男性',
      female: i18n?.t('broadcast.filter.genderFemale') || '女性',
      other: i18n?.t('broadcast.filter.genderOther') || '其他性別',
    };
    parts.push(genderMap[filters.gender]);
  }

  if (filters.zodiac) {
    const zodiacMap: Record<string, string> = {
      Aries: i18n?.t('broadcast.filter.zodiacAries') || '白羊座',
      Taurus: i18n?.t('broadcast.filter.zodiacTaurus') || '金牛座',
      Gemini: i18n?.t('broadcast.filter.zodiacGemini') || '雙子座',
      Cancer: i18n?.t('broadcast.filter.zodiacCancer') || '巨蟹座',
      Leo: i18n?.t('broadcast.filter.zodiacLeo') || '獅子座',
      Virgo: i18n?.t('broadcast.filter.zodiacVirgo') || '處女座',
      Libra: i18n?.t('broadcast.filter.zodiacLibra') || '天秤座',
      Scorpio: i18n?.t('broadcast.filter.zodiacScorpio') || '天蠍座',
      Sagittarius: i18n?.t('broadcast.filter.zodiacSagittarius') || '射手座',
      Capricorn: i18n?.t('broadcast.filter.zodiacCapricorn') || '摩羯座',
      Aquarius: i18n?.t('broadcast.filter.zodiacAquarius') || '水瓶座',
      Pisces: i18n?.t('broadcast.filter.zodiacPisces') || '雙魚座',
    };
    parts.push(zodiacMap[filters.zodiac] || filters.zodiac);
  }

  if (filters.country) {
    parts.push(i18n?.t('broadcast.filter.country', { country: filters.country }) || `國家：${filters.country}`);
  }

  if (filters.age) {
    parts.push(i18n?.t('broadcast.filter.age', { min: filters.age.min, max: filters.age.max }) || `年齡：${filters.age.min}-${filters.age.max} 歲`);
  }

  if (filters.mbti) {
    parts.push(i18n?.t('broadcast.filter.mbti', { mbti: filters.mbti }) || `MBTI：${filters.mbti}`);
  }

  if (filters.vip !== undefined) {
    parts.push(filters.vip ? (i18n?.t('broadcast.filter.vipUsers') || 'VIP 用戶') : (i18n?.t('broadcast.filter.nonVipUsers') || '非 VIP 用戶'));
  }

  if (filters.is_birthday) {
    parts.push(i18n?.t('broadcast.filter.birthdayToday') || '當天生日');
  }

  return parts.join('、');
}
