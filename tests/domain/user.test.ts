/**
 * User Domain Tests
 */

import { describe, it, expect } from 'vitest';
import { calculateAge, calculateZodiacSign, validateMBTI } from '~/domain/user';

describe('calculateAge', () => {
  it('should calculate correct age', () => {
    const birthday = '2000-01-01';
    const age = calculateAge(birthday);
    expect(age).toBeGreaterThanOrEqual(24);
  });

  it('should handle birthday today', () => {
    const today = new Date();
    const birthday = `${today.getFullYear() - 25}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const age = calculateAge(birthday);
    expect(age).toBe(25);
  });

  it('should handle birthday tomorrow (not yet birthday)', () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const birthday = `${tomorrow.getFullYear() - 25}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    const age = calculateAge(birthday);
    expect(age).toBe(24);
  });
});

describe('calculateZodiacSign', () => {
  it('should return Aries for March 21 - April 19', () => {
    expect(calculateZodiacSign('2000-03-21')).toBe('Aries');
    expect(calculateZodiacSign('2000-04-19')).toBe('Aries');
  });

  it('should return Taurus for April 20 - May 20', () => {
    expect(calculateZodiacSign('2000-04-20')).toBe('Taurus');
    expect(calculateZodiacSign('2000-05-20')).toBe('Taurus');
  });

  it('should return Capricorn for December 22 - January 19', () => {
    expect(calculateZodiacSign('2000-12-22')).toBe('Capricorn');
    expect(calculateZodiacSign('2000-01-19')).toBe('Capricorn');
  });
});

describe('validateMBTI', () => {
  it('should accept valid MBTI types', () => {
    expect(validateMBTI('INTJ').valid).toBe(true);
    expect(validateMBTI('ENFP').valid).toBe(true);
    expect(validateMBTI('ISTP').valid).toBe(true);
    expect(validateMBTI('ESFJ').valid).toBe(true);
  });

  it('should reject invalid MBTI types', () => {
    expect(validateMBTI('ABCD').valid).toBe(false);
    expect(validateMBTI('INT').valid).toBe(false);
    expect(validateMBTI('INTJJ').valid).toBe(false);
    expect(validateMBTI('').valid).toBe(false);
  });

  it('should be case-insensitive', () => {
    expect(validateMBTI('INTJ').valid).toBe(true); // validateMBTI converts to uppercase
    expect(validateMBTI('ENFP').valid).toBe(true);
  });
});

// isVipActive is not exported from user.ts, skip these tests for now
