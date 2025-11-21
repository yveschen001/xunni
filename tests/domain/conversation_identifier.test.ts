import { describe, it, expect } from 'vitest';
import {
  generateNextIdentifier,
  validateIdentifier,
  formatIdentifier,
  parseIdentifier,
} from '~/domain/conversation_identifier';

describe('Conversation Identifier Domain Functions', () => {
  describe('generateNextIdentifier', () => {
    it('should generate identifier in MMDDXXXX format', () => {
      const identifier = generateNextIdentifier();
      expect(identifier).toMatch(/^\d{4}[A-Z]{4}$/);
    });

    it('should include today\'s month and day', () => {
      const identifier = generateNextIdentifier();
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      expect(identifier.startsWith(`${month}${day}`)).toBe(true);
    });

    it('should generate different identifiers on multiple calls', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 5; i++) {
        ids.add(generateNextIdentifier());
      }
      expect(ids.size).toBeGreaterThan(1);
    });
  });

  describe('validateIdentifier', () => {
    it('should validate MMDD + 4 letters pattern', () => {
      expect(validateIdentifier('0117ABCD')).toBe(true);
      expect(validateIdentifier('1231WXYZ')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(validateIdentifier('111ABC')).toBe(false); // too short
      expect(validateIdentifier('0117ABC')).toBe(false); // only 3 letters
      expect(validateIdentifier('0117abcD')).toBe(false); // lowercase
      expect(validateIdentifier('ABCD1234')).toBe(false); // letters first
      expect(validateIdentifier('')).toBe(false); // empty
    });
  });

  describe('formatIdentifier', () => {
    it('should add # prefix to single character', () => {
      expect(formatIdentifier('A')).toBe('#A');
    });

    it('should add # prefix to multiple characters', () => {
      expect(formatIdentifier('AA')).toBe('#AA');
      expect(formatIdentifier('ABC')).toBe('#ABC');
    });
  });

  describe('parseIdentifier', () => {
    it('should remove # prefix', () => {
      expect(parseIdentifier('#0117ABCD')).toBe('0117ABCD');
    });

    it('should handle input without # prefix', () => {
      expect(parseIdentifier('0117ABCD')).toBe('0117ABCD');
    });

    it('should convert to uppercase', () => {
      expect(parseIdentifier('#0117abcd')).toBe('0117ABCD');
      expect(parseIdentifier('0117abcd')).toBe('0117ABCD');
    });
  });
});
