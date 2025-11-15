/**
 * Language Template
 * Use this as a template for new language translations
 * 
 * TODO: Replace with actual translations from CSV/Google Sheets
 */

import type { Translations } from '../types';
import { translations as zhTW } from './zh-TW';

/**
 * Create a placeholder translation that uses keys + zh-TW fallback
 * This will be replaced with actual translations from external sources
 */
export function createPlaceholderTranslations(_languageCode: string): Translations {
  // For now, return zh-TW as fallback
  // In future, this will show [key] for untranslated strings
  return zhTW;
}

// Export placeholder for all other languages
export const ja = createPlaceholderTranslations('ja');
export const ko = createPlaceholderTranslations('ko');
export const th = createPlaceholderTranslations('th');
export const vi = createPlaceholderTranslations('vi');
export const id = createPlaceholderTranslations('id');
export const ms = createPlaceholderTranslations('ms');
export const tl = createPlaceholderTranslations('tl');
export const es = createPlaceholderTranslations('es');
export const pt = createPlaceholderTranslations('pt');
export const fr = createPlaceholderTranslations('fr');
export const de = createPlaceholderTranslations('de');
export const it = createPlaceholderTranslations('it');
export const ru = createPlaceholderTranslations('ru');
export const ar = createPlaceholderTranslations('ar');
export const hi = createPlaceholderTranslations('hi');
export const bn = createPlaceholderTranslations('bn');
export const tr = createPlaceholderTranslations('tr');
export const zhCN = createPlaceholderTranslations('zh-CN');

