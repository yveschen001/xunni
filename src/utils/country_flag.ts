/**
 * Country Flag Utilities
 * 
 * Convert language codes to country flags based on Telegram user's language_code
 */

/**
 * Language code to country code mapping
 */
const LANGUAGE_TO_COUNTRY: Record<string, string> = {
  // Chinese
  'zh': 'CN',
  'zh-tw': 'TW',
  'zh-hk': 'HK',
  'zh-cn': 'CN',
  'zh-sg': 'SG',
  'zh-mo': 'MO',
  
  // English
  'en-us': 'US',
  'en-gb': 'GB',
  'en-au': 'AU',
  'en-ca': 'CA',
  'en-nz': 'NZ',
  'en-ie': 'IE',
  'en-za': 'ZA',
  'en-in': 'IN',
  'en-sg': 'SG',
  
  // Japanese
  'ja-jp': 'JP',
  'ja': 'JP',
  
  // Korean
  'ko-kr': 'KR',
  'ko': 'KR',
  
  // Spanish
  'es': 'ES',
  'es-es': 'ES',
  'es-mx': 'MX',
  'es-ar': 'AR',
  'es-cl': 'CL',
  'es-co': 'CO',
  
  // French
  'fr': 'FR',
  'fr-fr': 'FR',
  'fr-ca': 'CA',
  'fr-be': 'BE',
  'fr-ch': 'CH',
  
  // German
  'de': 'DE',
  'de-de': 'DE',
  'de-at': 'AT',
  'de-ch': 'CH',
  
  // Italian
  'it': 'IT',
  'it-it': 'IT',
  'it-ch': 'CH',
  
  // Portuguese
  'pt': 'PT',
  'pt-br': 'BR',
  'pt-pt': 'PT',
  
  // Russian
  'ru-ru': 'RU',
  'ru': 'RU',
  
  // Arabic
  'ar-sa': 'SA',
  'ar-ae': 'AE',
  'ar-eg': 'EG',
  'ar': 'SA',
  
  // Other major languages
  'th-th': 'TH',
  'th': 'TH',
  'vi-vn': 'VN',
  'vi': 'VN',
  'id-id': 'ID',
  'id': 'ID',
  'tr-tr': 'TR',
  'tr': 'TR',
  'pl-pl': 'PL',
  'pl': 'PL',
  'nl-nl': 'NL',
  'nl': 'NL',
  'nl-be': 'BE',
  'sv-se': 'SE',
  'sv': 'SE',
  'da-dk': 'DK',
  'da': 'DK',
  'fi-fi': 'FI',
  'fi': 'FI',
  'no-no': 'NO',
  'no': 'NO',
  'nb-no': 'NO',
  'nn-no': 'NO',
  'cs-cz': 'CZ',
  'cs': 'CZ',
  'el-gr': 'GR',
  'el': 'GR',
  'he-il': 'IL',
  'he': 'IL',
  'hi-in': 'IN',
  'hi': 'IN',
  'ms-my': 'MY',
  'ms': 'MY',
  'fa-ir': 'IR',
  'fa': 'IR',
  'uk-ua': 'UA',
  'uk': 'UA',
  'ro-ro': 'RO',
  'ro': 'RO',
  'hu-hu': 'HU',
  'hu': 'HU',
  'bg-bg': 'BG',
  'bg': 'BG',
  'sk-sk': 'SK',
  'sk': 'SK',
  'hr-hr': 'HR',
  'hr': 'HR',
  'sr-rs': 'RS',
  'sr': 'RS',
  'sl-si': 'SI',
  'sl': 'SI',
  'lt-lt': 'LT',
  'lt': 'LT',
  'lv-lv': 'LV',
  'lv': 'LV',
  'et-ee': 'EE',
  'et': 'EE',
  'is-is': 'IS',
  'is': 'IS',
  'ga-ie': 'IE',
  'ga': 'IE',
  'mt-mt': 'MT',
  'mt': 'MT',
  'sq-al': 'AL',
  'sq': 'AL',
  'mk-mk': 'MK',
  'mk': 'MK',
  'bs-ba': 'BA',
  'bs': 'BA',
  'ka-ge': 'GE',
  'ka': 'GE',
  'hy-am': 'AM',
  'hy': 'AM',
  'az-az': 'AZ',
  'az': 'AZ',
  'kk-kz': 'KZ',
  'kk': 'KZ',
  'uz-uz': 'UZ',
  'uz': 'UZ',
  'mn-mn': 'MN',
  'mn': 'MN',
  'ne-np': 'NP',
  'ne': 'NP',
  'si-lk': 'LK',
  'si': 'LK',
  'my-mm': 'MM',
  'my': 'MM',
  'km-kh': 'KH',
  'km': 'KH',
  'lo-la': 'LA',
  'lo': 'LA',
  'bn-bd': 'BD',
  'bn': 'BD',
  'ur-pk': 'PK',
  'ur': 'PK',
  'ta-in': 'IN',
  'ta': 'IN',
  'te-in': 'IN',
  'te': 'IN',
  'ml-in': 'IN',
  'ml': 'IN',
  'kn-in': 'IN',
  'kn': 'IN',
  'mr-in': 'IN',
  'mr': 'IN',
  'gu-in': 'IN',
  'gu': 'IN',
  'pa-in': 'IN',
  'pa': 'IN',
  'sw-ke': 'KE',
  'sw-tz': 'TZ',
  'sw': 'KE',
  'am-et': 'ET',
  'am': 'ET',
  'zu-za': 'ZA',
  'zu': 'ZA',
  'af-za': 'ZA',
  'af': 'ZA',
  'tl-ph': 'PH',
  'tl': 'PH',
  'fil-ph': 'PH',
  'fil': 'PH',
};

/**
 * Country names in Traditional Chinese
 */
const COUNTRY_NAMES: Record<string, string> = {
  'TW': '台灣',
  'CN': '中國',
  'HK': '香港',
  'MO': '澳門',
  'SG': '新加坡',
  'US': '美國',
  'GB': '英國',
  'JP': '日本',
  'KR': '韓國',
  'FR': '法國',
  'DE': '德國',
  'IT': '意大利',
  'ES': '西班牙',
  'PT': '葡萄牙',
  'BR': '巴西',
  'MX': '墨西哥',
  'AR': '阿根廷',
  'CL': '智利',
  'CO': '哥倫比亞',
  'RU': '俄羅斯',
  'UA': '烏克蘭',
  'PL': '波蘭',
  'TR': '土耳其',
  'SA': '沙特阿拉伯',
  'AE': '阿聯酋',
  'EG': '埃及',
  'TH': '泰國',
  'VN': '越南',
  'ID': '印尼',
  'MY': '馬來西亞',
  'PH': '菲律賓',
  'IN': '印度',
  'PK': '巴基斯坦',
  'BD': '孟加拉',
  'AU': '澳洲',
  'NZ': '紐西蘭',
  'CA': '加拿大',
  'ZA': '南非',
  'IL': '以色列',
  'IR': '伊朗',
  'IQ': '伊拉克',
  'AT': '奧地利',
  'BE': '比利時',
  'CH': '瑞士',
  'DK': '丹麥',
  'FI': '芬蘭',
  'NO': '挪威',
  'SE': '瑞典',
  'CZ': '捷克',
  'GR': '希臘',
  'NL': '荷蘭',
  'IE': '愛爾蘭',
  'RO': '羅馬尼亞',
  'HU': '匈牙利',
  'BG': '保加利亞',
  'SK': '斯洛伐克',
  'HR': '克羅地亞',
  'RS': '塞爾維亞',
  'SI': '斯洛維尼亞',
  'LT': '立陶宛',
  'LV': '拉脫維亞',
  'EE': '愛沙尼亞',
  'IS': '冰島',
  'MT': '馬爾他',
  'AL': '阿爾巴尼亞',
  'MK': '北馬其頓',
  'BA': '波斯尼亞',
  'GE': '喬治亞',
  'AM': '亞美尼亞',
  'AZ': '亞塞拜然',
  'KZ': '哈薩克',
  'UZ': '烏茲別克',
  'MN': '蒙古',
  'NP': '尼泊爾',
  'LK': '斯里蘭卡',
  'MM': '緬甸',
  'KH': '柬埔寨',
  'LA': '寮國',
  'KE': '肯亞',
  'TZ': '坦尚尼亞',
  'ET': '衣索比亞',
  'NG': '奈及利亞',
  'GH': '迦納',
  'ZW': '辛巴威',
  'UG': '烏干達',
  'RW': '盧安達',
  'SN': '塞內加爾',
  'CI': '象牙海岸',
  'CM': '喀麥隆',
  'MA': '摩洛哥',
  'DZ': '阿爾及利亞',
  'TN': '突尼西亞',
  'LY': '利比亞',
  'SD': '蘇丹',
  'JO': '約旦',
  'LB': '黎巴嫩',
  'SY': '敘利亞',
  'YE': '葉門',
  'OM': '阿曼',
  'KW': '科威特',
  'QA': '卡達',
  'BH': '巴林',
  'PE': '秘魯',
  'VE': '委內瑞拉',
  'EC': '厄瓜多',
  'BO': '玻利維亞',
  'PY': '巴拉圭',
  'UY': '烏拉圭',
  'CR': '哥斯大黎加',
  'PA': '巴拿馬',
  'GT': '瓜地馬拉',
  'HN': '宏都拉斯',
  'SV': '薩爾瓦多',
  'NI': '尼加拉瓜',
  'CU': '古巴',
  'DO': '多明尼加',
  'JM': '牙買加',
  'TT': '千里達',
  'BB': '巴貝多',
  'UN': '聯合國',
};

/**
 * Convert country code to flag emoji
 * 
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., 'TW', 'US', 'JP')
 * @returns Flag emoji (e.g., '🇹🇼', '🇺🇸', '🇯🇵')
 */
export function getCountryFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) {
    return '🌍'; // Earth emoji for unknown/invalid codes
  }
  
  // Validate that the code contains only letters
  if (!/^[A-Za-z]{2}$/.test(countryCode)) {
    return '🌍'; // Earth emoji for invalid codes
  }
  
  // Convert country code to flag emoji using Regional Indicator Symbols
  // Each letter is converted to its corresponding Regional Indicator Symbol
  // A-Z → U+1F1E6 to U+1F1FF
  const codePoints = [...countryCode.toUpperCase()].map(
    char => 127397 + char.charCodeAt(0)
  );
  
  return String.fromCodePoint(...codePoints);
}

/**
 * Get country code from Telegram language code
 * 
 * @param languageCode - Telegram language code (e.g., 'zh-TW', 'en-US', 'ja')
 * @returns ISO 3166-1 alpha-2 country code (e.g., 'TW', 'US', 'JP')
 */
export function getCountryCodeFromLanguage(languageCode: string | null | undefined): string | null {
  if (!languageCode) {
    return null;
  }
  
  // Normalize language code to lowercase
  const normalized = languageCode.toLowerCase().trim();
  
  // Try exact match first
  if (LANGUAGE_TO_COUNTRY[normalized]) {
    return LANGUAGE_TO_COUNTRY[normalized];
  }
  
  // Try base language (e.g., 'zh-TW' → 'zh')
  const baseLanguage = normalized.split('-')[0];
  if (LANGUAGE_TO_COUNTRY[baseLanguage]) {
    return LANGUAGE_TO_COUNTRY[baseLanguage];
  }
  
  return null;
}

/**
 * Get country flag emoji from Telegram language code
 * 
 * @param languageCode - Telegram language code (e.g., 'zh-TW', 'en-US', 'ja')
 * @returns Flag emoji or earth emoji for unknown languages
 */
export function getCountryFlag(languageCode: string | null | undefined): string {
  const countryCode = getCountryCodeFromLanguage(languageCode);
  
  if (!countryCode) {
    return '🌍'; // Earth emoji for unknown languages
  }
  
  return getCountryFlagEmoji(countryCode);
}

/**
 * Get country name from country code
 * 
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Country name in Traditional Chinese
 */
export function getCountryName(countryCode: string): string {
  return COUNTRY_NAMES[countryCode] || countryCode;
}

/**
 * Format nickname with country flag prefix
 * 
 * @param nickname - User's nickname
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Formatted nickname with flag prefix
 */
export function formatNicknameWithFlag(
  nickname: string,
  countryCode: string | null | undefined
): string {
  if (!countryCode) {
    return `🌍 ${nickname}`; // Default to earth emoji
  }
  
  const flag = getCountryFlagEmoji(countryCode);
  return `${flag} ${nickname}`;
}

