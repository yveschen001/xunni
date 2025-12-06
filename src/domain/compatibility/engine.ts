import type { User } from '~/types';
import {
  ZODIAC_ELEMENTS,
  ZODIAC_MATCH_RULES,
  getMbtiTemperament,
  MBTI_MATCH_RULES,
  BLOOD_MATCH_RULES,
  type ZodiacSign,
  type BloodType,
} from './rules';

export type MatchTopic = 'zodiac' | 'mbti' | 'blood';

export interface MatchRecommendation {
  topic: MatchTopic;
  userAttribute: string; // 用戶的屬性 (如 "aries", "INTJ")
  recommendedAttributes: string[]; // 推薦的屬性列表 (如 ["leo", "sagittarius"])
  reasonKey: string; // i18n key for reason
  isValid: boolean; // 是否成功產生推薦
}

export class CompatibilityEngine {
  /**
   * 根據指定主題產生配對推薦
   */
  static getRecommendation(user: User, topic: MatchTopic): MatchRecommendation {
    switch (topic) {
      case 'zodiac':
        return this.getZodiacRecommendation(user);
      case 'mbti':
        return this.getMbtiRecommendation(user);
      case 'blood':
        return this.getBloodRecommendation(user);
      default:
        return this.createEmptyRecommendation(topic);
    }
  }

  private static getZodiacRecommendation(user: User): MatchRecommendation {
    const zodiac = user.zodiac_sign as ZodiacSign;
    if (!zodiac || !ZODIAC_ELEMENTS[zodiac]) {
      return this.createEmptyRecommendation('zodiac');
    }

    const element = ZODIAC_ELEMENTS[zodiac];
    const rule = ZODIAC_MATCH_RULES[element];

    // 找出所有符合目標元素的星座
    const targets: string[] = [];
    for (const targetElement of rule.targets) {
      for (const [sign, elem] of Object.entries(ZODIAC_ELEMENTS)) {
        if (elem === targetElement && sign !== zodiac) {
          // 排除自己 (可選，這裡選擇排除自己增加趣味)
          targets.push(sign);
        }
      }
    }

    // 隨機選 1-3 個推薦星座，避免列表太長
    const shuffled = targets.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);

    return {
      topic: 'zodiac',
      userAttribute: zodiac,
      recommendedAttributes: selected,
      reasonKey: rule.reasonKey,
      isValid: true,
    };
  }

  private static getMbtiRecommendation(user: User): MatchRecommendation {
    if (!user.mbti_result) {
      return this.createEmptyRecommendation('mbti');
    }

    const temperament = getMbtiTemperament(user.mbti_result);
    if (!temperament) {
      return this.createEmptyRecommendation('mbti');
    }

    const rule = MBTI_MATCH_RULES[temperament];
    // 這裡我們不列出具體 MBTI 類型 (太多)，而是推薦氣質類型 (Temperament)
    // 或者可以列出該氣質下的具體類型
    // 這裡簡化：推薦目標氣質下的所有類型

    // 為了讓推薦更有具體感，我們回傳目標氣質名稱 (前端/i18n 需處理顯示)
    // 實際應用中，我們可能希望顯示 "NF 型 (ENFJ, INFJ...)"
    // 這裡我們直接回傳目標氣質代碼
    return {
      topic: 'mbti',
      userAttribute: user.mbti_result,
      recommendedAttributes: rule.targets, // e.g., ['NT', 'NF']
      reasonKey: rule.reasonKey,
      isValid: true,
    };
  }

  private static getBloodRecommendation(user: User): MatchRecommendation {
    const blood = user.blood_type as BloodType;
    // 簡單驗證血型格式
    if (!blood || !['A', 'B', 'O', 'AB'].includes(blood)) {
      return this.createEmptyRecommendation('blood');
    }

    const rule = BLOOD_MATCH_RULES[blood];
    return {
      topic: 'blood',
      userAttribute: blood,
      recommendedAttributes: rule.targets,
      reasonKey: rule.reasonKey,
      isValid: true,
    };
  }

  private static createEmptyRecommendation(topic: MatchTopic): MatchRecommendation {
    return {
      topic,
      userAttribute: '',
      recommendedAttributes: [],
      reasonKey: '',
      isValid: false,
    };
  }
}
