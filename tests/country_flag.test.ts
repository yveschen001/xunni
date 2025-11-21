/**
 * Country Flag Feature Tests
 */

import { describe, it, expect } from 'vitest';
import {
  getCountryFlagEmoji,
  getCountryCodeFromLanguage,
  getCountryFlag,
  getCountryName,
  formatNicknameWithFlag,
} from '../src/utils/country_flag';

describe('Country Flag Utils', () => {
  describe('getCountryFlagEmoji', () => {
    it('should convert country code to flag emoji', () => {
      expect(getCountryFlagEmoji('TW')).toBe('🇹🇼');
      expect(getCountryFlagEmoji('US')).toBe('🇺🇸');
      expect(getCountryFlagEmoji('JP')).toBe('🇯🇵');
      expect(getCountryFlagEmoji('CN')).toBe('🇨🇳');
    });

    it('should return earth emoji for invalid codes', () => {
      expect(getCountryFlagEmoji('')).toBe('🌍');
      expect(getCountryFlagEmoji('X')).toBe('🌍');
      expect(getCountryFlagEmoji('ABC')).toBe('🌍');
    });
  });

  describe('getCountryCodeFromLanguage', () => {
    it('should convert language code to country code', () => {
      expect(getCountryCodeFromLanguage('zh-TW')).toBe('TW');
      expect(getCountryCodeFromLanguage('zh-tw')).toBe('TW');
      expect(getCountryCodeFromLanguage('en-US')).toBe('US');
      expect(getCountryCodeFromLanguage('ja')).toBe('JP');
      expect(getCountryCodeFromLanguage('ko')).toBe('KR');
    });

    it('should handle base language codes', () => {
      expect(getCountryCodeFromLanguage('zh')).toBe('CN');
      expect(getCountryCodeFromLanguage('ru')).toBe('RU');
      expect(getCountryCodeFromLanguage('ar')).toBe('SA');
    });

    it('should return null for unknown languages', () => {
      expect(getCountryCodeFromLanguage('xyz')).toBeNull();
      expect(getCountryCodeFromLanguage('')).toBeNull();
      expect(getCountryCodeFromLanguage(null)).toBeNull();
      expect(getCountryCodeFromLanguage(undefined)).toBeNull();
    });
  });

  describe('getCountryFlag', () => {
    it('should get flag from language code', () => {
      expect(getCountryFlag('zh-TW')).toBe('🇹🇼');
      expect(getCountryFlag('en-US')).toBe('🇺🇸');
      expect(getCountryFlag('ja')).toBe('🇯🇵');
    });

    it('should return earth emoji for unknown languages', () => {
      expect(getCountryFlag('xyz')).toBe('🌍');
      expect(getCountryFlag(null)).toBe('🌍');
      expect(getCountryFlag(undefined)).toBe('🌍');
    });
  });

  describe('getCountryName', () => {
    it('should return country name in Traditional Chinese', () => {
      expect(getCountryName('TW')).toBe('台灣');
      expect(getCountryName('US')).toBe('美國');
      expect(getCountryName('JP')).toBe('日本');
      expect(getCountryName('CN')).toBe('中國');
    });

    it('should return code itself for unknown countries', () => {
      expect(getCountryName('XX')).toBe('XX');
    });
  });

  describe('formatNicknameWithFlag', () => {
    it('should format nickname with country flag', () => {
      expect(formatNicknameWithFlag('張三', 'TW')).toBe('🇹🇼 張三');
      expect(formatNicknameWithFlag('John', 'US')).toBe('🇺🇸 John');
      expect(formatNicknameWithFlag('田中', 'JP')).toBe('🇯🇵 田中');
    });

    it('should use earth emoji for null country code', () => {
      expect(formatNicknameWithFlag('匿名', null)).toBe('🌍 匿名');
      expect(formatNicknameWithFlag('匿名', undefined)).toBe('🌍 匿名');
    });

    it('should work with masked nicknames', () => {
      expect(formatNicknameWithFlag('張**', 'TW')).toBe('🇹🇼 張**');
      expect(formatNicknameWithFlag('Jo**', 'US')).toBe('🇺🇸 Jo**');
    });
  });
});

