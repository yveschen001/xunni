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
 * @param userLang - Optional user language code for smart sorting
 */
export function getLanguageButtons(
  i18n?: { t: (key: string) => string },
  page: number = 0,
  userLang: string = 'en'
): Array<Array<{ text: string; callback_data: string }>> {
  const LANGUAGES_PER_PAGE = 14; // 7 rows (2 languages per row) to stay under 8-row limit
  
  // 1. Get priority sorting based on user language
  const priorityList = getPriorityLanguages(userLang);
  const prioritySet = new Set(priorityList);
  
  // 2. Separate languages into priority and others
  const priorityLangs: Language[] = [];
  const otherLangs: Language[] = [];
  
  // Find full Language objects for priority codes
  for (const code of priorityList) {
    const lang = getLanguage(code);
    if (lang) priorityLangs.push(lang);
  }
  
  // Add remaining languages (original order)
  for (const lang of SUPPORTED_LANGUAGES) {
    if (!prioritySet.has(lang.code)) {
      otherLangs.push(lang);
    }
  }
  
  // 3. Merge sorted list
  const allSortedLangs = [...priorityLangs, ...otherLangs];

  const start = page * LANGUAGES_PER_PAGE;
  const end = Math.min(start + LANGUAGES_PER_PAGE, allSortedLangs.length);

  const buttons: Array<Array<{ text: string; callback_data: string }>> = [];

  // Group languages in rows of 2
  for (let i = start; i < end; i += 2) {
    const row = [];

    const lang1 = allSortedLangs[i];
    row.push({
      text: `${lang1.flag} ${lang1.nativeName}`,
      callback_data: `lang_${lang1.code}`,
    });

    if (i + 1 < end) {
      const lang2 = allSortedLangs[i + 1];
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
  if (end < allSortedLangs.length) {
    const nextText = i18n?.t('common.next') || '下一页 ➡️';
    navRow.push({ text: nextText, callback_data: `lang_page_${page + 1}` });
  }
  if (navRow.length > 0) {
    buttons.push(navRow);
  }

  return buttons;
}

/**
 * Get priority languages based on user's system language
 *
 * Logic:
 * 1. User's System Language (First)
 * 2. Neighboring/Culturally Related Languages
 * 3. Global Popular Languages
 */
export function getPriorityLanguages(lang: string = 'en'): string[] {
  const baseLang = lang.split('-')[0].toLowerCase();
  let related: string[] = [];

  switch (baseLang) {
    case 'ja':
      // Japan: JP -> TW/CN/KO/EN
      related = ['ja', 'zh-TW', 'zh-CN', 'ko', 'en'];
      break;
    case 'zh':
      // Chinese: TW/CN -> EN/JA/KO
      if (lang === 'zh-CN') {
        related = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko'];
      } else {
        related = ['zh-TW', 'zh-CN', 'en', 'ja', 'ko'];
      }
      break;
    case 'ko':
      // Korea: KO -> JA/TW/CN/EN
      related = ['ko', 'ja', 'zh-TW', 'zh-CN', 'en'];
      break;
    case 'th':
      // Thailand: TH -> EN/CN
      related = ['th', 'en', 'zh-CN'];
      break;
    case 'vi':
      // Vietnam: VI -> EN/CN
      related = ['vi', 'en', 'zh-CN'];
      break;
    case 'id':
    case 'ms':
      // Indonesia/Malay
      related = ['id', 'ms', 'en', 'zh-CN'];
      break;
    case 'en':
      // English -> ES/FR/DE (Western Europe)
      related = ['en', 'es', 'fr', 'de'];
      break;
    case 'es':
      related = ['es', 'en', 'pt', 'fr'];
      break;
    case 'fr':
      related = ['fr', 'en', 'es', 'de'];
      break;
    case 'de':
      related = ['de', 'en', 'fr', 'nl'];
      break;
    case 'ru':
      related = ['ru', 'uk', 'en'];
      break;
    case 'uk':
      related = ['uk', 'ru', 'en'];
      break;
    case 'ar':
      related = ['ar', 'en', 'fr'];
      break;
    default:
      // Fallback
      related = [lang, 'en'];
  }

  // Ensure 'lang' itself is always first if valid
  if (isValidLanguage(lang) && related[0] !== lang) {
    related.unshift(lang);
  } else if (!isValidLanguage(lang) && isValidLanguage(baseLang) && related[0] !== baseLang) {
     // Try base lang if full code not found (e.g. en-US -> en)
     related.unshift(baseLang);
  }

  return related;
}

/**
 * Get top 6 popular languages for quick selection
 * Dynamic sorting based on user's system language
 *
 * @param i18n - Optional i18n instance for "More languages" button text
 * @param userLang - The user's system language code (e.g., 'ja', 'en-US')
 */
export function getPopularLanguageButtons(
  i18n?: { t: (key: string) => string },
  userLang: string = 'en'
): Array<Array<{ text: string; callback_data: string }>> {
  // 1. Default popular list (Global)
  const defaultPopular = ['zh-TW', 'en', 'ja', 'ko', 'th', 'vi'];
  
  // 2. Get priority list based on user context
  const priorityList = getPriorityLanguages(userLang);
  
  // 3. Merge: Priority + Default (Deduplicated)
  // We want to fill up to 6 slots usually, or maybe 8.
  // Let's keep it flexible but ensure we have at least the default popular ones if priority is short.
  const combinedSet = new Set([...priorityList, ...defaultPopular]);
  
  // Filter out invalid codes just in case
  const sortedCodes = Array.from(combinedSet).filter(code => isValidLanguage(code));
  
  // Take top 6 (or 8?) - Original was 6. Let's stick to 6 for the main view to keep it clean,
  // or maybe 8 if we want to show more context. 
  // User screenshot shows 10. Let's provide a good number, say 8 or 10.
  // The screenshot shows 14 buttons (7 rows)! 
  // Wait, the screenshot shows "Show All Languages" page (page 0).
  // The "Welcome" message usually shows fewer.
  // Let's limit to 8 for the "Quick Select" (Welcome) message to avoid scrolling too much.
  const displayCodes = sortedCodes.slice(0, 8);

  const buttons: Array<Array<{ text: string; callback_data: string }>> = [];

  for (let i = 0; i < displayCodes.length; i += 2) {
    const row = [];

    const lang1 = getLanguage(displayCodes[i]);
    if (lang1) {
      row.push({
        text: `${lang1.flag} ${lang1.nativeName}`,
        callback_data: `lang_${lang1.code}`,
      });
    }

    if (i + 1 < displayCodes.length) {
      const lang2 = getLanguage(displayCodes[i + 1]);
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
