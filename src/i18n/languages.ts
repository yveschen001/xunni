/**
 * Language Definitions
 * Based on @doc/SPEC.md
 */

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'zh-TW', name: 'Traditional Chinese', nativeName: '繁體中文', flag: '🇹🇼' },
  { code: 'zh-CN', name: 'Simplified Chinese', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'th', name: 'Thai', nativeName: 'ภาษาไทย', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'tl', name: 'Filipino', nativeName: 'Filipino', flag: '🇵🇭' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
];

export const DEFAULT_LANGUAGE = 'zh-TW';

/**
 * Get language by code
 */
export function getLanguage(code: string): Language | undefined {
  return SUPPORTED_LANGUAGES.find((lang) => lang.code === code);
}

/**
 * Get language name with flag
 */
export function getLanguageDisplay(code: string): string {
  const lang = getLanguage(code);
  return lang ? `${lang.flag} ${lang.nativeName}` : code;
}

/**
 * Validate language code
 */
export function isValidLanguage(code: string): boolean {
  return SUPPORTED_LANGUAGES.some((lang) => lang.code === code);
}

/**
 * Get language buttons for Telegram inline keyboard
 */
export function getLanguageButtons(): Array<Array<{ text: string; callback_data: string }>> {
  const buttons: Array<Array<{ text: string; callback_data: string }>> = [];
  
  // Group languages in rows of 2
  for (let i = 0; i < SUPPORTED_LANGUAGES.length; i += 2) {
    const row = [];
    
    const lang1 = SUPPORTED_LANGUAGES[i];
    row.push({
      text: `${lang1.flag} ${lang1.nativeName}`,
      callback_data: `lang_${lang1.code}`,
    });
    
    if (i + 1 < SUPPORTED_LANGUAGES.length) {
      const lang2 = SUPPORTED_LANGUAGES[i + 1];
      row.push({
        text: `${lang2.flag} ${lang2.nativeName}`,
        callback_data: `lang_${lang2.code}`,
      });
    }
    
    buttons.push(row);
  }
  
  return buttons;
}

/**
 * Get top 6 popular languages for quick selection
 */
export function getPopularLanguageButtons(): Array<Array<{ text: string; callback_data: string }>> {
  const popularLanguages = ['zh-TW', 'en', 'ja', 'ko', 'th', 'vi'];
  const buttons: Array<Array<{ text: string; callback_data: string }>> = [];
  
  for (let i = 0; i < popularLanguages.length; i += 2) {
    const row = [];
    
    const lang1 = getLanguage(popularLanguages[i]);
    if (lang1) {
      row.push({
        text: `${lang1.flag} ${lang1.nativeName}`,
        callback_data: `lang_${lang1.code}`,
      });
    }
    
    if (i + 1 < popularLanguages.length) {
      const lang2 = getLanguage(popularLanguages[i + 1]);
      if (lang2) {
        row.push({
          text: `${lang2.flag} ${lang2.nativeName}`,
          callback_data: `lang_${lang2.code}`,
        });
      }
    }
    
    buttons.push(row);
  }
  
  // Add "More languages" button
  buttons.push([
    { text: '🌍 更多語言 / More Languages', callback_data: 'lang_more' },
  ]);
  
  return buttons;
}

