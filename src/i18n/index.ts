/**
 * i18n System
 * Based on @doc/I18N_GUIDE.md
 * 
 * Currently supports:
 * - zh-TW (Traditional Chinese) - Complete
 * - en (English) - Complete
 * - Other languages - Use key + zh-TW fallback
 * 
 * Future: Import translations from CSV/Google Sheets
 */

import { translations as zhTW } from './locales/zh-TW';
import { translations as en } from './locales/en';
import type { Translations } from './types';

// Translation cache
const translationCache: Map<string, Translations> = new Map();

// Load translations
translationCache.set('zh-TW', zhTW);
translationCache.set('en', en);

/**
 * Get translations for a language
 * Falls back to zh-TW if language not found
 */
export function getTranslations(languageCode: string): Translations {
  // Try exact match
  if (translationCache.has(languageCode)) {
    return translationCache.get(languageCode)!;
  }

  // Try language without region (e.g., zh from zh-CN)
  const baseLanguage = languageCode.split('-')[0];
  if (translationCache.has(baseLanguage)) {
    return translationCache.get(baseLanguage)!;
  }

  // Fallback to zh-TW
  console.warn(`[i18n] Language ${languageCode} not found, falling back to zh-TW`);
  return translationCache.get('zh-TW')!;
}

/**
 * Translate a key with parameters
 */
export function t(
  languageCode: string,
  key: string,
  params?: Record<string, string | number>
): string {
  const translations = getTranslations(languageCode);
  
  // Get translation by nested key (e.g., "onboarding.welcome")
  const keys = key.split('.');
  let value: Record<string, unknown> | string = translations;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k] as Record<string, unknown> | string;
    } else {
      // Key not found, return key itself for debugging
      console.error(`[i18n] Translation key not found: ${key} for language: ${languageCode}`);
      return `[${key}]`;
    }
  }

  // Replace parameters
  if (typeof value === 'string' && params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return paramKey in params ? String(params[paramKey]) : match;
    });
  }

  return typeof value === 'string' ? value : `[${key}]`;
}

/**
 * Create i18n helper for a specific language
 */
export function createI18n(languageCode: string) {
  return {
    t: (key: string, params?: Record<string, string | number>) => 
      t(languageCode, key, params),
    translations: getTranslations(languageCode),
  };
}

/**
 * Load translations from external source (CSV/Google Sheets)
 * TODO: Implement in future
 */
export async function loadExternalTranslations(
  languageCode: string,
  source: 'csv' | 'google-sheets',
  url: string
): Promise<void> {
  console.error(`[i18n] Loading translations for ${languageCode} from ${source}: ${url}`);
  // TODO: Implement CSV/Google Sheets import
  throw new Error('External translations not yet implemented');
}

/**
 * Export translations to CSV format
 * TODO: Implement in future
 */
export function exportTranslationsToCSV(): string {
  // TODO: Implement CSV export
  throw new Error('CSV export not yet implemented');
}

