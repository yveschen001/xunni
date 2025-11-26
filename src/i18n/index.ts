/**
 * i18n System
 * Based on @doc/I18N_GUIDE.md
 *
 * Currently supports:
 * - zh-TW (Traditional Chinese) - 100% Complete
 * - zh-CN (Simplified Chinese) - 100% Complete
 * - en (English) - 100% Complete
 * - ar (Arabic) - 100% Complete (RTL supported)
 * - Other languages - Use key + zh-TW fallback
 */

import { translations as zhTW } from './locales/zh-TW';
import { translations as zhCN } from './locales/zh-CN';
import { translations as en } from './locales/en';
import { translations as ar } from './locales/ar';
import type { Translations } from './types';

// Translation cache
const translationCache: Map<string, Translations> = new Map();

// Load translations
translationCache.set('zh-TW', zhTW);
translationCache.set('zh-CN', zhCN);
translationCache.set('en', en);
translationCache.set('ar', ar);

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
  // Handle keys with dots in property names (e.g., "tasks.name.city" -> tasks['name.city'])
  const keys = key.split('.');
  let value: Record<string, unknown> | string = translations;

  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (value && typeof value === 'object') {
      // First try direct property access
      if (k in value) {
        const nextValue = (value as Record<string, unknown>)[k] as Record<string, unknown> | string;
        // If the value is a string but there are more keys, try combining with next key
        // This handles cases like onboarding.gender.male where gender is a string but gender.male exists
        if (typeof nextValue === 'string' && i < keys.length - 1) {
          const combinedKey = `${k}.${keys[i + 1]}`;
          if (combinedKey in value) {
            value = (value as Record<string, unknown>)[combinedKey] as Record<string, unknown> | string;
            i++; // Skip next key since we already used it
            continue;
          }
        }
        value = nextValue;
      } else if (i < keys.length - 1) {
        // If not found and there are more keys, try combining with next key (for keys like 'name.city')
        const combinedKey = `${k}.${keys[i + 1]}`;
        if (combinedKey in value) {
          value = (value as Record<string, unknown>)[combinedKey] as Record<string, unknown> | string;
          i++; // Skip next key since we already used it
        } else {
          // Key not found
          console.error(`[i18n] Translation key not found: ${key} for language: ${languageCode} (failed at: ${k})`);
          return `[${key}]`;
        }
      } else {
        // Key not found
        console.error(`[i18n] Translation key not found: ${key} for language: ${languageCode} (failed at: ${k})`);
        return `[${key}]`;
      }
    } else {
      // Key not found
      console.error(`[i18n] Translation key not found: ${key} for language: ${languageCode}`);
      return `[${key}]`;
    }
  }

  // Replace parameters
  if (typeof value === 'string' && params) {
    // Support both {variable} and ${variable} formats
    // Also support nested object access like ${updatedUser.nickname}
    let result = value;
    
    // Replace ${variable} format (template string style)
    // Note: In template strings, \${} is escaped to ${} (literal), so we need to match both \${} and ${}
    result = result.replace(/(?:\\\$\{|\$\{)([^}]+)\}/g, (match, expr) => {
      // Handle nested object access (e.g., updatedUser.nickname)
      const keys = expr.trim().split('.');
      let value: any = params;
      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          return match; // Return original if path not found
        }
      }
      return String(value ?? match);
    });
    
    // Replace {variable} format (simple style)
    result = result.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return paramKey in params ? String(params[paramKey]) : match;
    });
    
    return result;
  }

  return typeof value === 'string' ? value : `[${key}]`;
}

/**
 * Create i18n helper for a specific language
 */
export function createI18n(languageCode: string) {
  return {
    t: (key: string, params?: Record<string, string | number>) => t(languageCode, key, params),
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
