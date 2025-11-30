/**
 * i18n/index.ts
 */

import { translations as zhTW } from './locales/zh-TW';

export class I18n {
  private locale: string;
  private translations: Record<string, any>;

  constructor(locale: string = 'zh-TW') {
    this.locale = locale;
    this.translations = zhTW; // Load others based on locale if needed
  }

  t(key: string, params: Record<string, any> = {}): string {
    const value = this.getNestedValue(this.translations, key);
    if (!value) return key;
    return this.replaceParams(value, params);
  }

  private getNestedValue(obj: any, key: string): string | undefined {
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

export function createI18n(locale: string = 'zh-TW'): I18n {
  return new I18n(locale);
}

// Dummy loadTranslations for compatibility with Router
export async function loadTranslations(env: any, locale: string): Promise<void> {
  // In a real app, this might load from KV or DB.
  // For now, it does nothing as we bundle translations.
  // This prevents the "loadTranslations is not a function" error.
}
