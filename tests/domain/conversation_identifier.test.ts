import { describe, it, expect } from 'vitest';
import {
  generateNextIdentifier,
  incrementIdentifier,
  validateIdentifier,
  formatIdentifier,
  parseIdentifier,
} from '~/domain/conversation_identifier';

describe('Conversation Identifier Domain Functions', () => {
  describe('generateNextIdentifier', () => {
    it('should return "A" for empty array', () => {
      expect(generateNextIdentifier([])).toBe('A');
    });

    it('should return "B" when only "A" exists', () => {
      expect(generateNextIdentifier(['A'])).toBe('B');
    });

    it('should return "C" when "A" and "B" exist', () => {
      expect(generateNextIdentifier(['A', 'B'])).toBe('C');
    });

    it('should return "AA" when "Z" is the last', () => {
      expect(generateNextIdentifier(['Z'])).toBe('AA');
    });

    it('should handle unsorted input', () => {
      expect(generateNextIdentifier(['C', 'A', 'B'])).toBe('D');
    });

    it('should return "AB" when "AA" is the last', () => {
      expect(generateNextIdentifier(['AA'])).toBe('AB');
    });

    it('should return "BA" when "AZ" is the last', () => {
      expect(generateNextIdentifier(['AZ'])).toBe('BA');
    });

    it('should return "AAA" when "ZZ" is the last', () => {
      expect(generateNextIdentifier(['ZZ'])).toBe('AAA');
    });

    it('should handle mixed length identifiers', () => {
      expect(generateNextIdentifier(['A', 'B', 'Z', 'AA', 'AB'])).toBe('AC');
    });
  });

  describe('incrementIdentifier', () => {
    it('should increment single character A to B', () => {
      expect(incrementIdentifier('A')).toBe('B');
    });

    it('should increment B to C', () => {
      expect(incrementIdentifier('B')).toBe('C');
    });

    it('should increment Z to AA', () => {
      expect(incrementIdentifier('Z')).toBe('AA');
    });

    it('should increment AA to AB', () => {
      expect(incrementIdentifier('AA')).toBe('AB');
    });

    it('should increment AZ to BA', () => {
      expect(incrementIdentifier('AZ')).toBe('BA');
    });

    it('should increment ZZ to AAA', () => {
      expect(incrementIdentifier('ZZ')).toBe('AAA');
    });

    it('should increment BA to BB', () => {
      expect(incrementIdentifier('BA')).toBe('BB');
    });

    it('should increment BZ to CA', () => {
      expect(incrementIdentifier('BZ')).toBe('CA');
    });

    it('should increment AAA to AAB', () => {
      expect(incrementIdentifier('AAA')).toBe('AAB');
    });

    it('should increment AAZ to ABA', () => {
      expect(incrementIdentifier('AAZ')).toBe('ABA');
    });
  });

  describe('validateIdentifier', () => {
    it('should validate single uppercase letter', () => {
      expect(validateIdentifier('A')).toBe(true);
      expect(validateIdentifier('Z')).toBe(true);
    });

    it('should validate multiple uppercase letters', () => {
      expect(validateIdentifier('AA')).toBe(true);
      expect(validateIdentifier('ABC')).toBe(true);
    });

    it('should reject lowercase letters', () => {
      expect(validateIdentifier('a')).toBe(false);
      expect(validateIdentifier('Ab')).toBe(false);
    });

    it('should reject numbers', () => {
      expect(validateIdentifier('1')).toBe(false);
      expect(validateIdentifier('A1')).toBe(false);
    });

    it('should reject special characters', () => {
      expect(validateIdentifier('#A')).toBe(false);
      expect(validateIdentifier('A-B')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(validateIdentifier('')).toBe(false);
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
      expect(parseIdentifier('#A')).toBe('A');
      expect(parseIdentifier('#AA')).toBe('AA');
    });

    it('should handle input without # prefix', () => {
      expect(parseIdentifier('A')).toBe('A');
      expect(parseIdentifier('AA')).toBe('AA');
    });

    it('should convert to uppercase', () => {
      expect(parseIdentifier('#a')).toBe('A');
      expect(parseIdentifier('a')).toBe('A');
      expect(parseIdentifier('#ab')).toBe('AB');
    });

    it('should handle mixed case', () => {
      expect(parseIdentifier('#Ab')).toBe('AB');
      expect(parseIdentifier('aB')).toBe('AB');
    });
  });
});

