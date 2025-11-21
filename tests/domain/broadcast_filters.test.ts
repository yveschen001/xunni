/**
 * Broadcast Filters Tests
 * 測試廣播過濾器的解析、驗證和格式化功能
 */

import { describe, it, expect } from 'vitest';
import {
  parseFilters,
  validateFilters,
  formatFiltersDescription,
  type BroadcastFilters
} from '~/domain/broadcast_filters';

describe('Broadcast Filters', () => {
  describe('parseFilters', () => {
    describe('gender filter', () => {
      it('should parse male gender filter', () => {
        const filters = parseFilters('gender=male');
        expect(filters).toEqual({ gender: 'male' });
      });

      it('should parse female gender filter', () => {
        const filters = parseFilters('gender=female');
        expect(filters).toEqual({ gender: 'female' });
      });

      it('should parse other gender filter', () => {
        const filters = parseFilters('gender=other');
        expect(filters).toEqual({ gender: 'other' });
      });

      it('should throw error for invalid gender', () => {
        expect(() => parseFilters('gender=invalid')).toThrow('無效的性別值');
      });
    });

    describe('zodiac filter', () => {
      it('should parse zodiac filter', () => {
        const filters = parseFilters('zodiac=Scorpio');
        expect(filters).toEqual({ zodiac: 'Scorpio' });
      });

      it('should throw error for invalid zodiac', () => {
        expect(() => parseFilters('zodiac=InvalidSign')).toThrow('無效的星座');
      });

      it('should parse all valid zodiacs', () => {
        const zodiacs = [
          'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
          'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
        ];
        
        zodiacs.forEach(zodiac => {
          const filters = parseFilters(`zodiac=${zodiac}`);
          expect(filters.zodiac).toBe(zodiac);
        });
      });
    });

    describe('country filter', () => {
      it('should parse country filter', () => {
        const filters = parseFilters('country=TW');
        expect(filters).toEqual({ country: 'TW' });
      });

      it('should throw error for invalid country code (lowercase)', () => {
        expect(() => parseFilters('country=tw')).toThrow('無效的國家代碼');
      });

      it('should throw error for invalid country code (too long)', () => {
        expect(() => parseFilters('country=TWN')).toThrow('無效的國家代碼');
      });

      it('should throw error for invalid country code (too short)', () => {
        expect(() => parseFilters('country=T')).toThrow('無效的國家代碼');
      });

      it('should parse common country codes', () => {
        const countries = ['TW', 'US', 'JP', 'KR', 'CN', 'HK', 'SG'];
        
        countries.forEach(country => {
          const filters = parseFilters(`country=${country}`);
          expect(filters.country).toBe(country);
        });
      });
    });

    describe('age filter', () => {
      it('should parse age range filter', () => {
        const filters = parseFilters('age=18-25');
        expect(filters).toEqual({ age: { min: 18, max: 25 } });
      });

      it('should parse different age ranges', () => {
        const ranges = [
          { input: 'age=18-25', expected: { min: 18, max: 25 } },
          { input: 'age=26-35', expected: { min: 26, max: 35 } },
          { input: 'age=36-45', expected: { min: 36, max: 45 } },
          { input: 'age=46-99', expected: { min: 46, max: 99 } }
        ];
        
        ranges.forEach(({ input, expected }) => {
          const filters = parseFilters(input);
          expect(filters.age).toEqual(expected);
        });
      });

      it('should throw error for invalid age format', () => {
        expect(() => parseFilters('age=invalid')).toThrow('無效的年齡範圍');
      });

      it('should throw error for age below 18', () => {
        expect(() => parseFilters('age=10-15')).toThrow('無效的年齡範圍');
      });

      it('should throw error for age above 99', () => {
        expect(() => parseFilters('age=50-150')).toThrow('無效的年齡範圍');
      });

      it('should throw error for min > max', () => {
        expect(() => parseFilters('age=30-20')).toThrow('無效的年齡範圍');
      });
    });

    describe('mbti filter', () => {
      it('should parse mbti filter', () => {
        const filters = parseFilters('mbti=INTJ');
        expect(filters).toEqual({ mbti: 'INTJ' });
      });

      it('should parse mbti filter (lowercase input)', () => {
        const filters = parseFilters('mbti=intj');
        expect(filters).toEqual({ mbti: 'INTJ' });
      });

      it('should throw error for invalid mbti', () => {
        expect(() => parseFilters('mbti=INVALID')).toThrow('無效的 MBTI 類型');
      });

      it('should parse all valid MBTI types', () => {
        const mbtiTypes = [
          'INTJ', 'INTP', 'ENTJ', 'ENTP',
          'INFJ', 'INFP', 'ENFJ', 'ENFP',
          'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
          'ISTP', 'ISFP', 'ESTP', 'ESFP'
        ];
        
        mbtiTypes.forEach(mbti => {
          const filters = parseFilters(`mbti=${mbti}`);
          expect(filters.mbti).toBe(mbti);
        });
      });
    });

    describe('vip filter', () => {
      it('should parse vip=true', () => {
        const filters = parseFilters('vip=true');
        expect(filters).toEqual({ vip: true });
      });

      it('should parse vip=1', () => {
        const filters = parseFilters('vip=1');
        expect(filters).toEqual({ vip: true });
      });

      it('should parse vip=false', () => {
        const filters = parseFilters('vip=false');
        expect(filters).toEqual({ vip: false });
      });

      it('should parse vip=0', () => {
        const filters = parseFilters('vip=0');
        expect(filters).toEqual({ vip: false });
      });
    });

    describe('is_birthday filter', () => {
      it('should parse is_birthday=true', () => {
        const filters = parseFilters('is_birthday=true');
        expect(filters).toEqual({ is_birthday: true });
      });

      it('should parse is_birthday=1', () => {
        const filters = parseFilters('is_birthday=1');
        expect(filters).toEqual({ is_birthday: true });
      });

      it('should parse is_birthday=false', () => {
        const filters = parseFilters('is_birthday=false');
        expect(filters).toEqual({ is_birthday: false });
      });
    });

    describe('combined filters', () => {
      it('should parse multiple filters', () => {
        const filters = parseFilters('gender=female,age=18-25,country=TW');
        expect(filters).toEqual({
          gender: 'female',
          age: { min: 18, max: 25 },
          country: 'TW'
        });
      });

      it('should parse all filter types combined', () => {
        const filters = parseFilters('gender=female,zodiac=Scorpio,country=TW,age=18-25,mbti=INTJ,vip=true');
        expect(filters).toEqual({
          gender: 'female',
          zodiac: 'Scorpio',
          country: 'TW',
          age: { min: 18, max: 25 },
          mbti: 'INTJ',
          vip: true
        });
      });

      it('should handle whitespace in filters', () => {
        const filters = parseFilters(' gender = female , age = 18-25 ');
        expect(filters).toEqual({
          gender: 'female',
          age: { min: 18, max: 25 }
        });
      });
    });

    describe('error handling', () => {
      it('should throw error for unknown filter key', () => {
        expect(() => parseFilters('unknown=value')).toThrow('未知的過濾器');
      });

      it('should throw error for invalid format (missing value)', () => {
        expect(() => parseFilters('gender=')).toThrow('無效的過濾器格式');
      });

      it('should throw error for invalid format (missing key)', () => {
        expect(() => parseFilters('=female')).toThrow('無效的過濾器格式');
      });
    });
  });

  describe('validateFilters', () => {
    it('should validate non-empty filters', () => {
      const result = validateFilters({ gender: 'female' });
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty filters', () => {
      const result = validateFilters({});
      expect(result.valid).toBe(false);
      expect(result.error).toBe('至少需要一個過濾器');
    });

    it('should validate multiple filters', () => {
      const result = validateFilters({
        gender: 'female',
        age: { min: 18, max: 25 }
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('formatFiltersDescription', () => {
    it('should format gender filter', () => {
      const desc = formatFiltersDescription({ gender: 'female' });
      expect(desc).toBe('女性');
    });

    it('should format male gender', () => {
      const desc = formatFiltersDescription({ gender: 'male' });
      expect(desc).toBe('男性');
    });

    it('should format other gender', () => {
      const desc = formatFiltersDescription({ gender: 'other' });
      expect(desc).toBe('其他性別');
    });

    it('should format zodiac filter', () => {
      const desc = formatFiltersDescription({ zodiac: 'Scorpio' });
      expect(desc).toBe('天蠍座');
    });

    it('should format all zodiacs in Chinese', () => {
      const zodiacMap: Record<string, string> = {
        'Aries': '白羊座',
        'Taurus': '金牛座',
        'Gemini': '雙子座',
        'Cancer': '巨蟹座',
        'Leo': '獅子座',
        'Virgo': '處女座',
        'Libra': '天秤座',
        'Scorpio': '天蠍座',
        'Sagittarius': '射手座',
        'Capricorn': '摩羯座',
        'Aquarius': '水瓶座',
        'Pisces': '雙魚座'
      };
      
      Object.entries(zodiacMap).forEach(([english, chinese]) => {
        const desc = formatFiltersDescription({ zodiac: english });
        expect(desc).toBe(chinese);
      });
    });

    it('should format country filter', () => {
      const desc = formatFiltersDescription({ country: 'TW' });
      expect(desc).toBe('國家：TW');
    });

    it('should format age filter', () => {
      const desc = formatFiltersDescription({ age: { min: 18, max: 25 } });
      expect(desc).toBe('年齡：18-25 歲');
    });

    it('should format mbti filter', () => {
      const desc = formatFiltersDescription({ mbti: 'INTJ' });
      expect(desc).toBe('MBTI：INTJ');
    });

    it('should format vip=true filter', () => {
      const desc = formatFiltersDescription({ vip: true });
      expect(desc).toBe('VIP 用戶');
    });

    it('should format vip=false filter', () => {
      const desc = formatFiltersDescription({ vip: false });
      expect(desc).toBe('非 VIP 用戶');
    });

    it('should format is_birthday filter', () => {
      const desc = formatFiltersDescription({ is_birthday: true });
      expect(desc).toBe('當天生日');
    });

    it('should format combined filters with 、 separator', () => {
      const desc = formatFiltersDescription({
        gender: 'female',
        age: { min: 18, max: 25 },
        country: 'TW'
      });
      // 順序可能不同，檢查包含所有元素
      expect(desc).toContain('女性');
      expect(desc).toContain('年齡：18-25 歲');
      expect(desc).toContain('國家：TW');
      expect(desc.split('、').length).toBe(3);
    });

    it('should format all filter types combined', () => {
      const desc = formatFiltersDescription({
        gender: 'female',
        zodiac: 'Scorpio',
        country: 'TW',
        age: { min: 18, max: 25 },
        mbti: 'INTJ',
        vip: true
      });
      expect(desc).toBe('女性、天蠍座、國家：TW、年齡：18-25 歲、MBTI：INTJ、VIP 用戶');
    });

    it('should return empty string for empty filters', () => {
      const desc = formatFiltersDescription({});
      expect(desc).toBe('');
    });
  });
});

