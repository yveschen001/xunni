/**
 * i18n/index.ts
 * 
 * Dynamic i18n loading from Cloudflare KV
 * 
 * Architecture:
 * 1. Runtime Memory Cache (Global Variable)
 * 2. Cloudflare KV (I18N_DATA)
 * 3. Fallback to bundled zh-TW
 */

import { translations as en } from './locales/en/index';

// Declare global cache for Worker instance
declare global {
  var LOCALE_CACHE: Record<string, any>;
}

// Initialize cache if it doesn't exist
if (typeof globalThis.LOCALE_CACHE === 'undefined') {
  globalThis.LOCALE_CACHE = {
    'en': en // Pre-load en as it's bundled
  };
}

export class I18n {
  private locale: string;
  private translations: Record<string, any>;

  constructor(locale: string = 'en') {
    this.locale = locale;
    // Try to get from cache, otherwise fallback to en
    this.translations = globalThis.LOCALE_CACHE[locale] || globalThis.LOCALE_CACHE['en'];
  }

  t(key: string, params: Record<string, any> = {}): string {
    const value = this.getNestedValue(this.translations, key);
    
    if (!value) {
      // Fallback to en if key is missing in target locale
      if (this.locale !== 'en') {
        const fallbackValue = this.getNestedValue(globalThis.LOCALE_CACHE['en'], key);
        if (fallbackValue) return this.replaceParams(fallbackValue, params);
      }
      return key; // Return key if absolutely nothing found
    }
    return this.replaceParams(value, params);
  }

  getObject(key: string): any {
    const value = this.getNestedValue(this.translations, key);
    if (!value && this.locale !== 'en') {
      return this.getNestedValue(globalThis.LOCALE_CACHE['en'], key);
    }
    return value;
  }

  private getNestedValue(obj: any, key: string): any {
    return key.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
  }

  private replaceParams(text: string, params: Record<string, any>): string {
    return text.replace(/\{([^}]+)\}/g, (match, key) => {
      // Support nested keys like {user.name}
      const value = this.getNestedValue(params, key);
      return value !== undefined ? String(value) : match;
    });
  }
}

export function createI18n(locale: string = 'en'): I18n {
  return new I18n(locale);
}

/**
 * Loads translations for a specific locale from KV into memory cache.
 * Must be called before creating I18n instance in the request lifecycle.
 */
export async function loadTranslations(env: any, locale: string): Promise<void> {
  // 1. Check Memory Cache
  if (globalThis.LOCALE_CACHE[locale]) {
    return;
  }

  // 2. Check KV
  try {
    if (env.I18N_DATA) {
      // Key format: "locale:en", "locale:ja"
      const kvKey = `locale:${locale}`;
      const data = await env.I18N_DATA.get(kvKey, 'json');
      
      if (data) {
        globalThis.LOCALE_CACHE[locale] = data;
        return;
      }
    } else {
      console.warn('[i18n] I18N_DATA binding not found');
    }
  } catch (error) {
    console.error(`[i18n] Failed to load locale ${locale} from KV:`, error);
  }

  // 3. Fallback (Logic handled in I18n class, effectively using en)
  // We don't throw here to ensure the app doesn't crash.
  // The I18n class will use en from cache if the target locale is missing.
}
