/**
 * Comprehensive Country Flag Tests
 *
 * Tests all supported countries and languages
 */

import { describe, it, expect } from 'vitest';
import {
  getCountryFlagEmoji,
  getCountryCodeFromLanguage,
  formatNicknameWithFlag,
} from '../src/utils/country_flag';

describe('Comprehensive Country Flag Tests', () => {
  describe('All Major Regions', () => {
    it('should support East Asian countries', () => {
      const countries = ['TW', 'CN', 'HK', 'MO', 'JP', 'KR', 'MN'];
      countries.forEach((code) => {
        const flag = getCountryFlagEmoji(code);
        expect(flag).not.toBe('🌍');
        expect(flag.length).toBeGreaterThan(0);
      });
    });

    it('should support Southeast Asian countries', () => {
      const countries = ['SG', 'TH', 'VN', 'ID', 'MY', 'PH', 'MM', 'KH', 'LA'];
      countries.forEach((code) => {
        const flag = getCountryFlagEmoji(code);
        expect(flag).not.toBe('🌍');
        expect(flag.length).toBeGreaterThan(0);
      });
    });

    it('should support South Asian countries', () => {
      const countries = ['IN', 'PK', 'BD', 'NP', 'LK'];
      countries.forEach((code) => {
        const flag = getCountryFlagEmoji(code);
        expect(flag).not.toBe('🌍');
        expect(flag.length).toBeGreaterThan(0);
      });
    });

    it('should support Middle Eastern countries', () => {
      const countries = [
        'SA',
        'AE',
        'EG',
        'IR',
        'IL',
        'TR',
        'JO',
        'LB',
        'IQ',
        'SY',
        'YE',
        'OM',
        'KW',
        'QA',
        'BH',
      ];
      countries.forEach((code) => {
        const flag = getCountryFlagEmoji(code);
        expect(flag).not.toBe('🌍');
        expect(flag.length).toBeGreaterThan(0);
      });
    });

    it('should support European countries', () => {
      const countries = [
        'GB',
        'FR',
        'DE',
        'IT',
        'ES',
        'PT',
        'NL',
        'BE',
        'CH',
        'AT',
        'SE',
        'NO',
        'DK',
        'FI',
        'IS',
        'IE',
        'PL',
        'CZ',
        'SK',
        'HU',
        'RO',
        'BG',
        'GR',
        'HR',
        'SI',
        'RS',
        'BA',
        'AL',
        'MK',
        'LT',
        'LV',
        'EE',
        'MT',
        'UA',
        'RU',
      ];
      countries.forEach((code) => {
        const flag = getCountryFlagEmoji(code);
        expect(flag).not.toBe('🌍');
        expect(flag.length).toBeGreaterThan(0);
      });
    });

    it('should support North American countries', () => {
      const countries = [
        'US',
        'CA',
        'MX',
        'CR',
        'PA',
        'GT',
        'HN',
        'SV',
        'NI',
        'CU',
        'DO',
        'JM',
        'TT',
        'BB',
      ];
      countries.forEach((code) => {
        const flag = getCountryFlagEmoji(code);
        expect(flag).not.toBe('🌍');
        expect(flag.length).toBeGreaterThan(0);
      });
    });

    it('should support South American countries', () => {
      const countries = ['BR', 'AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'BO', 'PY', 'UY'];
      countries.forEach((code) => {
        const flag = getCountryFlagEmoji(code);
        expect(flag).not.toBe('🌍');
        expect(flag.length).toBeGreaterThan(0);
      });
    });

    it('should support African countries', () => {
      const countries = [
        'ZA',
        'KE',
        'TZ',
        'ET',
        'NG',
        'GH',
        'ZW',
        'UG',
        'RW',
        'SN',
        'CI',
        'CM',
        'MA',
        'DZ',
        'TN',
        'LY',
        'SD',
      ];
      countries.forEach((code) => {
        const flag = getCountryFlagEmoji(code);
        expect(flag).not.toBe('🌍');
        expect(flag.length).toBeGreaterThan(0);
      });
    });

    it('should support Oceania countries', () => {
      const countries = ['AU', 'NZ'];
      countries.forEach((code) => {
        const flag = getCountryFlagEmoji(code);
        expect(flag).not.toBe('🌍');
        expect(flag.length).toBeGreaterThan(0);
      });
    });

    it('should support Central Asian countries', () => {
      const countries = ['KZ', 'UZ', 'GE', 'AM', 'AZ'];
      countries.forEach((code) => {
        const flag = getCountryFlagEmoji(code);
        expect(flag).not.toBe('🌍');
        expect(flag.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Language to Country Mapping', () => {
    it('should map all major languages correctly', () => {
      const mappings = [
        // Chinese variants
        { lang: 'zh', country: 'CN' },
        { lang: 'zh-tw', country: 'TW' },
        { lang: 'zh-hk', country: 'HK' },
        { lang: 'zh-cn', country: 'CN' },

        // English variants
        { lang: 'en-us', country: 'US' },
        { lang: 'en-gb', country: 'GB' },
        { lang: 'en-au', country: 'AU' },
        { lang: 'en-ca', country: 'CA' },

        // Other major languages
        { lang: 'ja', country: 'JP' },
        { lang: 'ko', country: 'KR' },
        { lang: 'es', country: 'ES' },
        { lang: 'fr', country: 'FR' },
        { lang: 'de', country: 'DE' },
        { lang: 'it', country: 'IT' },
        { lang: 'pt-br', country: 'BR' },
        { lang: 'ru', country: 'RU' },
        { lang: 'ar', country: 'SA' },
        { lang: 'th', country: 'TH' },
        { lang: 'vi', country: 'VN' },
        { lang: 'id', country: 'ID' },
        { lang: 'tr', country: 'TR' },
        { lang: 'pl', country: 'PL' },
        { lang: 'nl', country: 'NL' },
        { lang: 'sv', country: 'SE' },
        { lang: 'da', country: 'DK' },
        { lang: 'fi', country: 'FI' },
        { lang: 'no', country: 'NO' },
        { lang: 'cs', country: 'CZ' },
        { lang: 'el', country: 'GR' },
        { lang: 'he', country: 'IL' },
        { lang: 'hi', country: 'IN' },
        { lang: 'ms', country: 'MY' },
        { lang: 'fa', country: 'IR' },
        { lang: 'uk', country: 'UA' },
        { lang: 'ro', country: 'RO' },
        { lang: 'hu', country: 'HU' },
        { lang: 'bg', country: 'BG' },
        { lang: 'sk', country: 'SK' },
        { lang: 'hr', country: 'HR' },
        { lang: 'sr', country: 'RS' },
        { lang: 'sl', country: 'SI' },
        { lang: 'lt', country: 'LT' },
        { lang: 'lv', country: 'LV' },
        { lang: 'et', country: 'EE' },
        { lang: 'is', country: 'IS' },
        { lang: 'ga', country: 'IE' },
        { lang: 'mt', country: 'MT' },
        { lang: 'sq', country: 'AL' },
        { lang: 'mk', country: 'MK' },
        { lang: 'bs', country: 'BA' },
        { lang: 'ka', country: 'GE' },
        { lang: 'hy', country: 'AM' },
        { lang: 'az', country: 'AZ' },
        { lang: 'kk', country: 'KZ' },
        { lang: 'uz', country: 'UZ' },
        { lang: 'mn', country: 'MN' },
        { lang: 'ne', country: 'NP' },
        { lang: 'si', country: 'LK' },
        { lang: 'my', country: 'MM' },
        { lang: 'km', country: 'KH' },
        { lang: 'lo', country: 'LA' },
        { lang: 'bn', country: 'BD' },
        { lang: 'ur', country: 'PK' },
        { lang: 'sw', country: 'KE' },
        { lang: 'am', country: 'ET' },
        { lang: 'zu', country: 'ZA' },
        { lang: 'af', country: 'ZA' },
        { lang: 'tl', country: 'PH' },
        { lang: 'fil', country: 'PH' },
      ];

      mappings.forEach(({ lang, country }) => {
        const result = getCountryCodeFromLanguage(lang);
        expect(result).toBe(country);
      });
    });
  });

  describe('Flag Emoji Generation', () => {
    it('should generate valid flag emojis for all supported countries', () => {
      const testCountries = [
        'TW',
        'CN',
        'HK',
        'US',
        'GB',
        'JP',
        'KR',
        'FR',
        'DE',
        'IT',
        'ES',
        'PT',
        'BR',
        'MX',
        'AR',
        'RU',
        'TR',
        'SA',
        'TH',
        'VN',
        'ID',
        'MY',
        'PH',
        'IN',
        'PK',
        'BD',
        'AU',
        'CA',
        'NZ',
        'ZA',
        'PL',
        'NL',
        'SE',
        'NO',
        'DK',
        'FI',
        'CZ',
        'GR',
        'IL',
        'IR',
        'UA',
        'RO',
        'HU',
        'BG',
        'SK',
        'HR',
        'RS',
        'SI',
        'LT',
        'LV',
        'EE',
        'IS',
        'IE',
        'MT',
        'AL',
        'MK',
        'BA',
        'GE',
        'AM',
        'AZ',
        'KZ',
        'UZ',
        'MN',
        'NP',
        'LK',
        'MM',
        'KH',
        'LA',
        'KE',
        'TZ',
        'ET',
        'NG',
        'GH',
        'ZW',
        'UG',
        'RW',
        'SN',
        'CI',
        'CM',
        'MA',
        'DZ',
        'TN',
        'LY',
        'SD',
        'JO',
        'LB',
        'SY',
        'YE',
        'OM',
        'KW',
        'QA',
        'BH',
        'PE',
        'VE',
        'EC',
        'BO',
        'PY',
        'UY',
        'CR',
        'PA',
        'GT',
        'HN',
        'SV',
        'NI',
        'CU',
        'DO',
        'JM',
        'TT',
        'BB',
      ];

      testCountries.forEach((code) => {
        const flag = getCountryFlagEmoji(code);
        // Flag emojis are 4 bytes (2 code points)
        expect(flag.length).toBeGreaterThan(0);
        expect(flag).not.toBe('🌍');
        // Should contain Regional Indicator Symbols
        expect(flag.codePointAt(0)).toBeGreaterThanOrEqual(127462);
        expect(flag.codePointAt(0)).toBeLessThanOrEqual(127487);
      });
    });
  });

  describe('Nickname Formatting', () => {
    it('should format nicknames with flags from different regions', () => {
      const tests = [
        { nickname: '張三', country: 'TW', expected: '🇹🇼 張三' },
        { nickname: '李四', country: 'CN', expected: '🇨🇳 李四' },
        { nickname: 'John', country: 'US', expected: '🇺🇸 John' },
        { nickname: 'Tanaka', country: 'JP', expected: '🇯🇵 Tanaka' },
        { nickname: '김철수', country: 'KR', expected: '🇰🇷 김철수' },
        { nickname: 'Pierre', country: 'FR', expected: '🇫🇷 Pierre' },
        { nickname: 'Hans', country: 'DE', expected: '🇩🇪 Hans' },
        { nickname: 'José', country: 'ES', expected: '🇪🇸 José' },
        { nickname: 'João', country: 'BR', expected: '🇧🇷 João' },
        { nickname: 'Иван', country: 'RU', expected: '🇷🇺 Иван' },
        { nickname: 'Ahmed', country: 'SA', expected: '🇸🇦 Ahmed' },
        { nickname: 'สมชาย', country: 'TH', expected: '🇹🇭 สมชาย' },
        { nickname: 'Nguyễn', country: 'VN', expected: '🇻🇳 Nguyễn' },
        { nickname: 'Budi', country: 'ID', expected: '🇮🇩 Budi' },
        { nickname: 'राज', country: 'IN', expected: '🇮🇳 राज' },
      ];

      tests.forEach(({ nickname, country, expected }) => {
        const result = formatNicknameWithFlag(nickname, country);
        expect(result).toBe(expected);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid country codes gracefully', () => {
      const invalidCodes = ['99', '12', 'A', 'ABC', ''];
      invalidCodes.forEach((code) => {
        const flag = getCountryFlagEmoji(code);
        expect(flag).toBe('🌍');
      });
    });

    it('should handle null and undefined gracefully', () => {
      expect(formatNicknameWithFlag('Test', null)).toBe('🌍 Test');
      expect(formatNicknameWithFlag('Test', undefined)).toBe('🌍 Test');
      expect(getCountryCodeFromLanguage(null)).toBeNull();
      expect(getCountryCodeFromLanguage(undefined)).toBeNull();
    });

    it('should handle case insensitivity', () => {
      expect(getCountryCodeFromLanguage('ZH-TW')).toBe('TW');
      expect(getCountryCodeFromLanguage('EN-US')).toBe('US');
      expect(getCountryCodeFromLanguage('JA')).toBe('JP');
    });
  });

  describe('Coverage Statistics', () => {
    it('should support at least 100 countries', () => {
      const allCountries = [
        'TW',
        'CN',
        'HK',
        'MO',
        'SG',
        'US',
        'GB',
        'JP',
        'KR',
        'FR',
        'DE',
        'IT',
        'ES',
        'PT',
        'BR',
        'MX',
        'AR',
        'CL',
        'CO',
        'RU',
        'UA',
        'PL',
        'TR',
        'SA',
        'AE',
        'EG',
        'TH',
        'VN',
        'ID',
        'MY',
        'PH',
        'IN',
        'PK',
        'BD',
        'AU',
        'NZ',
        'CA',
        'ZA',
        'IL',
        'IR',
        'NL',
        'BE',
        'CH',
        'AT',
        'SE',
        'NO',
        'DK',
        'FI',
        'CZ',
        'GR',
        'IE',
        'RO',
        'HU',
        'BG',
        'SK',
        'HR',
        'RS',
        'SI',
        'LT',
        'LV',
        'EE',
        'IS',
        'MT',
        'AL',
        'MK',
        'BA',
        'GE',
        'AM',
        'AZ',
        'KZ',
        'UZ',
        'MN',
        'NP',
        'LK',
        'MM',
        'KH',
        'LA',
        'KE',
        'TZ',
        'ET',
        'NG',
        'GH',
        'ZW',
        'UG',
        'RW',
        'SN',
        'CI',
        'CM',
        'MA',
        'DZ',
        'TN',
        'LY',
        'SD',
        'JO',
        'LB',
        'SY',
        'YE',
        'OM',
        'KW',
        'QA',
        'BH',
        'PE',
        'VE',
        'EC',
        'BO',
        'PY',
        'UY',
        'CR',
        'PA',
        'GT',
        'HN',
        'SV',
        'NI',
        'CU',
        'DO',
        'JM',
        'TT',
        'BB',
      ];

      expect(allCountries.length).toBeGreaterThanOrEqual(100);

      // Verify all can generate flags
      allCountries.forEach((code) => {
        const flag = getCountryFlagEmoji(code);
        expect(flag).not.toBe('🌍');
      });
    });

    it('should support at least 60 language codes', () => {
      const allLanguages = [
        'zh',
        'zh-tw',
        'zh-hk',
        'zh-cn',
        'zh-sg',
        'zh-mo',
        'en-us',
        'en-gb',
        'en-au',
        'en-ca',
        'en-nz',
        'en-ie',
        'en-za',
        'en-in',
        'en-sg',
        'ja',
        'ja-jp',
        'ko',
        'ko-kr',
        'es-es',
        'es-mx',
        'es-ar',
        'es-cl',
        'es-co',
        'fr-fr',
        'fr-ca',
        'fr-be',
        'fr-ch',
        'de-de',
        'de-at',
        'de-ch',
        'it-it',
        'it-ch',
        'pt-br',
        'pt-pt',
        'ru',
        'ru-ru',
        'ar',
        'ar-sa',
        'ar-ae',
        'ar-eg',
        'th',
        'th-th',
        'vi',
        'vi-vn',
        'id',
        'id-id',
        'tr',
        'tr-tr',
        'pl',
        'pl-pl',
        'nl',
        'nl-nl',
        'nl-be',
        'sv',
        'sv-se',
        'da',
        'da-dk',
        'fi',
        'fi-fi',
        'no',
        'no-no',
        'nb-no',
        'nn-no',
        'cs',
        'cs-cz',
        'el',
        'el-gr',
        'he',
        'he-il',
        'hi',
        'hi-in',
        'ms',
        'ms-my',
        'fa',
        'fa-ir',
        'uk',
        'uk-ua',
        'ro',
        'ro-ro',
        'hu',
        'hu-hu',
        'bg',
        'bg-bg',
        'sk',
        'sk-sk',
        'hr',
        'hr-hr',
        'sr',
        'sr-rs',
        'sl',
        'sl-si',
        'lt',
        'lt-lt',
        'lv',
        'lv-lv',
        'et',
        'et-ee',
        'is',
        'is-is',
        'ga',
        'ga-ie',
        'mt',
        'mt-mt',
        'sq',
        'sq-al',
        'mk',
        'mk-mk',
        'bs',
        'bs-ba',
        'ka',
        'ka-ge',
        'hy',
        'hy-am',
        'az',
        'az-az',
        'kk',
        'kk-kz',
        'uz',
        'uz-uz',
        'mn',
        'mn-mn',
        'ne',
        'ne-np',
        'si',
        'si-lk',
        'my',
        'my-mm',
        'km',
        'km-kh',
        'lo',
        'lo-la',
        'bn',
        'bn-bd',
        'ur',
        'ur-pk',
        'ta',
        'ta-in',
        'te',
        'te-in',
        'ml',
        'ml-in',
        'kn',
        'kn-in',
        'mr',
        'mr-in',
        'gu',
        'gu-in',
        'pa',
        'pa-in',
        'sw',
        'sw-ke',
        'sw-tz',
        'am',
        'am-et',
        'zu',
        'zu-za',
        'af',
        'af-za',
        'tl',
        'tl-ph',
        'fil',
        'fil-ph',
      ];

      expect(allLanguages.length).toBeGreaterThanOrEqual(60);

      // Verify all can map to countries
      allLanguages.forEach((lang) => {
        const country = getCountryCodeFromLanguage(lang);
        expect(country).not.toBeNull();
      });
    });
  });
});
