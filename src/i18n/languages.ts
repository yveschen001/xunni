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
  {
    code: 'zh-TW',
    name: 'Traditional Chinese (Taiwan)',
    nativeName: '繁體中文（臺灣）',
    flag: '🇹🇼',
  },
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
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴' },
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
 * Supports pagination to avoid exceeding Telegram's 8-row limit
 * 
 * @param i18n - Optional i18n instance for button text (e.g., "Back" button)
 * @param page - Page number (0-based, 14 languages per page)
 */
export function getLanguageButtons(
  i18n?: { t: (key: string) => string },
  page: number = 0
): Array<Array<{ text: string; callback_data: string }>> {
  const LANGUAGES_PER_PAGE = 14; // 7 rows (2 languages per row) to stay under 8-row limit
  const start = page * LANGUAGES_PER_PAGE;
  const end = Math.min(start + LANGUAGES_PER_PAGE, SUPPORTED_LANGUAGES.length);
  
  const buttons: Array<Array<{ text: string; callback_data: string }>> = [];

  // Group languages in rows of 2
  for (let i = start; i < end; i += 2) {
    const row = [];

    const lang1 = SUPPORTED_LANGUAGES[i];
    row.push({
      text: `${lang1.flag} ${lang1.nativeName}`,
      callback_data: `lang_${lang1.code}`,
    });

    if (i + 1 < end) {
      const lang2 = SUPPORTED_LANGUAGES[i + 1];
      row.push({
        text: `${lang2.flag} ${lang2.nativeName}`,
        callback_data: `lang_${lang2.code}`,
      });
    }

    buttons.push(row);
  }

  // Add pagination buttons if needed
  const navRow: Array<{ text: string; callback_data: string }> = [];
  if (page > 0) {
    const prevText = i18n?.t('common.prev') || '⬅️ 上一页';
    navRow.push({ text: prevText, callback_data: `lang_page_${page - 1}` });
  }
  if (end < SUPPORTED_LANGUAGES.length) {
    const nextText = i18n?.t('common.next') || '下一页 ➡️';
    navRow.push({ text: nextText, callback_data: `lang_page_${page + 1}` });
  }
  if (navRow.length > 0) {
    buttons.push(navRow);
  }

  return buttons;
}

/**
 * Get top 6 popular languages for quick selection
 * 
 * @param i18n - Optional i18n instance for "More languages" button text
 */
export function getPopularLanguageButtons(
  i18n?: { t: (key: string) => string }
): Array<Array<{ text: string; callback_data: string }>> {
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
  const moreText = i18n?.t('onboarding.moreLanguages') || '🌍 更多語言 / More Languages';
  buttons.push([{ text: moreText, callback_data: 'lang_more' }]);

  return buttons;
}
