/**
 * i18n System
 * Based on @doc/I18N_GUIDE.md
 *
 * Currently supports: Core languages + KV-loaded languages
 *
 * ⚠️ WORKER SIZE LIMIT WARNING ⚠️
 * Only core languages are statically imported.
 * All other languages must be loaded from KV via loadTranslations().
 */

import { translations as zhTW } from './locales/zh-TW';
import { translations as zhCN } from './locales/zh-CN';
import { translations as en } from './locales/en';
import { translations as ar } from './locales/ar';
import { translations as ja } from './locales/ja';
import { translations as ko } from './locales/ko';
import { translations as th } from './locales/th';
import { translations as vi } from './locales/vi';
import { translations as id } from './locales/id';

import type { Translations } from './types';
import type { Env } from '../types';

// Translation cache (Memory L1)
const translationCache: Map<string, Translations> = new Map();

// Load core translations (Static)
translationCache.set('zh-TW', zhTW);
translationCache.set('zh-CN', zhCN);
translationCache.set('en', en);
translationCache.set('ar', ar);
translationCache.set('ja', ja);
translationCache.set('ko', ko);
translationCache.set('th', th);
translationCache.set('vi', vi);
translationCache.set('id', id);

/**
 * Load translations for a specific language (Async)
 * 1. Check Memory Cache
 * 2. Check KV Storage
 * 3. Fallback to zh-TW (handled by getTranslations)
 */
export async function loadTranslations(env: Env, languageCode: string): Promise<void> {
  // 1. Check Memory Cache (Fast path)
  if (translationCache.has(languageCode)) {
    return;
  }

  // 2. Handle region codes (e.g., es-ES -> es)
  const baseLanguage = languageCode.split('-')[0];
  if (translationCache.has(baseLanguage)) {
    return; // Base language is already loaded
  }

  // 3. Load from KV (L2 Cache)
  if (env.CACHE) {
    try {
      const cacheKey = `i18n:lang:${languageCode}`;
      const translations = await env.CACHE.get<Translations>(cacheKey, 'json');

      if (translations) {
        translationCache.set(languageCode, translations);
        return;
      }

      // Try base language from KV
      if (baseLanguage !== languageCode) {
        const baseCacheKey = `i18n:lang:${baseLanguage}`;
        const baseTranslations = await env.CACHE.get<Translations>(baseCacheKey, 'json');
        if (baseTranslations) {
          translationCache.set(baseLanguage, baseTranslations);
          return;
        }
      }
    } catch (e) {
      console.error(`[i18n] Failed to load translations for ${languageCode} from KV:`, e);
    }
  }

  // If not found in KV, we will rely on fallback to zh-TW in getTranslations()
  console.warn(`[i18n] Language ${languageCode} not found in Cache or KV.`);
}

/**
 * Get translations for a language (Synchronous)
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
  // console.warn(`[i18n] Language ${languageCode} not found, falling back to zh-TW`);
  return translationCache.get('zh-TW')!;
}

function replaceParams(text: string, params: Record<string, any>): string {
  let result = text;
  result = result.replace(/(?:\\\$\{|\$\{)([^}]+)\}/g, (match, expr) => {
    const keys = expr.trim().split('.');
    let value: any = params;
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return match;
      }
    }
    return String(value ?? match);
  });
  result = result.replace(/\{(\w+)\}/g, (match, paramKey) => {
    return paramKey in params ? String(params[paramKey]) : match;
  });
  return result;
}

/**
 * Translate a key with parameters
 */
export function t(
  languageCode: string,
  key: string,
  params?: Record<string, string | number | undefined>
): string {
  const translations = getTranslations(languageCode);

  const keys = key.split('.');
  let value: Record<string, unknown> | string = translations;

  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (value && typeof value === 'object') {
      if (k in value) {
        const nextValue = (value as Record<string, unknown>)[k] as Record<string, unknown> | string;
        if (typeof nextValue === 'string' && i < keys.length - 1) {
          const combinedKey = `${k}.${keys[i + 1]}`;
          if (combinedKey in value) {
            value = (value as Record<string, unknown>)[combinedKey] as
              | Record<string, unknown>
              | string;
            i++;
            continue;
          }
        }
        value = nextValue;
      } else if (i < keys.length - 1) {
        // Check combined key for current level (e.g. settings.quietHoursHint where settings is object)
        // But here value is object and k is not in it.
        // Try next key combined?
        const combinedKey = `${k}.${keys[i + 1]}`;
        if (combinedKey in value) {
          value = (value as Record<string, unknown>)[combinedKey] as
            | Record<string, unknown>
            | string;
          i++;
          continue;
        }

        // Key not found
        if (params?.defaultValue) {
          return replaceParams(params.defaultValue as string, params);
        }
        return `[${key}]`;
      } else {
        // Key not found
        if (params?.defaultValue) {
          return replaceParams(params.defaultValue as string, params);
        }
        return `[${key}]`;
      }
    } else {
      // Key not found
      if (params?.defaultValue) {
        return replaceParams(params.defaultValue as string, params);
      }
      return `[${key}]`;
    }
  }

  if (typeof value === 'string') {
    if (params) {
      return replaceParams(value, params);
    }
    return value;
  }

  // If it's an object, it means the key path was incomplete or pointed to an object
  if (params?.defaultValue) {
    return replaceParams(params.defaultValue as string, params);
  }
  return `[${key}]`;
}

export function createI18n(languageCode: string) {
  return {
    t: (key: string, params?: Record<string, string | number | undefined>) =>
      t(languageCode, key, params),
    translations: getTranslations(languageCode),
  };
}

// Deprecated placeholder
export async function loadExternalTranslations(
  languageCode: string,
  source: 'csv' | 'google-sheets',
  url: string
): Promise<void> {
  throw new Error('Use loadTranslations(env, lang) instead.');
}

export function exportTranslationsToCSV(): string {
  throw new Error('CSV export not yet implemented');
}
