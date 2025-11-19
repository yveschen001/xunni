import { describe, it, expect } from 'vitest';
import {
  BLOOD_TYPES,
  isValidBloodType,
  getBloodTypeDisplay,
  getBloodTypeEmoji,
  parseBloodType,
  getBloodTypeOptions,
  type BloodType,
} from '~/domain/blood_type';

describe('Blood Type Domain Functions', () => {
  describe('BLOOD_TYPES constant', () => {
    it('should contain all 4 blood types', () => {
      expect(BLOOD_TYPES).toHaveLength(4);
      expect(BLOOD_TYPES).toContain('A');
      expect(BLOOD_TYPES).toContain('B');
      expect(BLOOD_TYPES).toContain('AB');
      expect(BLOOD_TYPES).toContain('O');
    });
  });

  describe('isValidBloodType', () => {
    it('should validate correct blood types', () => {
      expect(isValidBloodType('A')).toBe(true);
      expect(isValidBloodType('B')).toBe(true);
      expect(isValidBloodType('AB')).toBe(true);
      expect(isValidBloodType('O')).toBe(true);
    });

    it('should reject invalid blood types', () => {
      expect(isValidBloodType('C')).toBe(false);
      expect(isValidBloodType('a')).toBe(false);
      expect(isValidBloodType('AB+')).toBe(false);
      expect(isValidBloodType('')).toBe(false);
      expect(isValidBloodType('unknown')).toBe(false);
    });
  });

  describe('getBloodTypeDisplay', () => {
    it('should return display name with emoji for valid types', () => {
      expect(getBloodTypeDisplay('A')).toBe('🩸 A 型');
      expect(getBloodTypeDisplay('B')).toBe('🩸 B 型');
      expect(getBloodTypeDisplay('AB')).toBe('🩸 AB 型');
      expect(getBloodTypeDisplay('O')).toBe('🩸 O 型');
    });

    it('should return "未設定" for null', () => {
      expect(getBloodTypeDisplay(null)).toBe('未設定');
    });
  });

  describe('getBloodTypeEmoji', () => {
    it('should return blood emoji for valid types', () => {
      expect(getBloodTypeEmoji('A')).toBe('🩸');
      expect(getBloodTypeEmoji('B')).toBe('🩸');
      expect(getBloodTypeEmoji('AB')).toBe('🩸');
      expect(getBloodTypeEmoji('O')).toBe('🩸');
    });

    it('should return question mark for null', () => {
      expect(getBloodTypeEmoji(null)).toBe('❓');
    });
  });

  describe('parseBloodType', () => {
    it('should parse uppercase blood types', () => {
      expect(parseBloodType('A')).toBe('A');
      expect(parseBloodType('B')).toBe('B');
      expect(parseBloodType('AB')).toBe('AB');
      expect(parseBloodType('O')).toBe('O');
    });

    it('should parse lowercase blood types', () => {
      expect(parseBloodType('a')).toBe('A');
      expect(parseBloodType('b')).toBe('B');
      expect(parseBloodType('ab')).toBe('AB');
      expect(parseBloodType('o')).toBe('O');
    });

    it('should parse blood types with "型"', () => {
      expect(parseBloodType('A型')).toBe('A');
      expect(parseBloodType('B型')).toBe('B');
      expect(parseBloodType('AB型')).toBe('AB');
      expect(parseBloodType('O型')).toBe('O');
    });

    it('should parse blood types with spaces', () => {
      expect(parseBloodType('A 型')).toBe('A');
      expect(parseBloodType('B 型')).toBe('B');
      expect(parseBloodType('AB 型')).toBe('AB');
      expect(parseBloodType('O 型')).toBe('O');
    });

    it('should return null for invalid input', () => {
      expect(parseBloodType('C')).toBeNull();
      expect(parseBloodType('AB+')).toBeNull();
      expect(parseBloodType('')).toBeNull();
      expect(parseBloodType('unknown')).toBeNull();
    });
  });

  describe('getBloodTypeOptions', () => {
    it('should return 5 options (4 types + unknown)', () => {
      const options = getBloodTypeOptions();
      expect(options).toHaveLength(5);
    });

    it('should include all blood types', () => {
      const options = getBloodTypeOptions();
      const values = options.map((opt) => opt.value);
      expect(values).toContain('A');
      expect(values).toContain('B');
      expect(values).toContain('AB');
      expect(values).toContain('O');
      expect(values).toContain(null);
    });

    it('should have display names for all options', () => {
      const options = getBloodTypeOptions();
      options.forEach((opt) => {
        expect(opt.display).toBeTruthy();
        expect(typeof opt.display).toBe('string');
      });
    });

    it('should have emoji in display names', () => {
      const options = getBloodTypeOptions();
      options.forEach((opt) => {
        expect(opt.display).toMatch(/[🩸❓]/);
      });
    });
  });
});
