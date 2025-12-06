/**
 * Country Selection Handler
 *
 * Shows country selection menu for users
 */

import type { Env } from '~/types';
import { createTelegramService } from '~/services/telegram';
import { createDatabaseClient } from '~/db/client';
import { findUserByTelegramId } from '~/db/queries/users';
import { createI18n } from '~/i18n';

interface CountryOption {
  code: string;
  i18nKey: string;
}

// Full list of supported countries
const ALL_COUNTRIES: CountryOption[] = [
  { code: 'TW', i18nKey: 'country.buttonTW' },
  { code: 'CN', i18nKey: 'country.buttonCN' },
  { code: 'HK', i18nKey: 'country.buttonHK' },
  { code: 'US', i18nKey: 'country.buttonUS' },
  { code: 'JP', i18nKey: 'country.buttonJP' },
  { code: 'KR', i18nKey: 'country.buttonKR' },
  { code: 'GB', i18nKey: 'country.buttonGB' },
  { code: 'FR', i18nKey: 'country.buttonFR' },
  { code: 'DE', i18nKey: 'country.buttonDE' },
  { code: 'SG', i18nKey: 'country.buttonSG' },
  { code: 'MY', i18nKey: 'country.buttonMY' },
  { code: 'TH', i18nKey: 'country.buttonTH' },
  { code: 'AU', i18nKey: 'country.buttonAU' },
  { code: 'CA', i18nKey: 'country.buttonCA' },
  { code: 'NZ', i18nKey: 'country.buttonNZ' },
];

/**
 * Get priority countries based on user language
 */
export function getPriorityCountries(lang: string): string[] {
  const baseLang = lang.split('-')[0];
  
  switch (baseLang) {
    case 'ja':
      return ['JP'];
    case 'ko':
      return ['KR'];
    case 'en':
      return ['US', 'GB', 'CA', 'AU', 'NZ'];
    case 'zh':
      return lang === 'zh-CN' ? ['CN', 'SG', 'MY'] : ['TW', 'HK'];
    case 'th':
      return ['TH'];
    case 'fr':
      return ['FR'];
    case 'de':
      return ['DE'];
    case 'ms':
    case 'id':
      return ['MY', 'SG', 'ID']; // ID not in list, but good context
    case 'vi':
      return ['VN']; // VN not in list, fallback
    default:
      return [];
  }
}

/**
 * Show country selection menu
 */
export async function showCountrySelection(
  chatId: number,
  env: Env,
  telegramId?: string
): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);

  // Get user for i18n
  let user = null;
  if (telegramId) {
    user = await findUserByTelegramId(db, telegramId);
  }
  const userLang = user?.language_pref || 'zh-TW';
  const i18n = createI18n(userLang);

  const message =
    i18n.t('country.selectTitle') +
    i18n.t('country.selectHint') +
    i18n.t('country.selectUnFlagHint');

  // Smart Sorting Logic
  const priorityCodes = new Set(getPriorityCountries(userLang));
  
  // 1. Extract priority countries
  const priorityList = ALL_COUNTRIES.filter(c => priorityCodes.has(c.code));
  
  // 2. Extract remaining countries (maintain original order for consistency)
  const remainingList = ALL_COUNTRIES.filter(c => !priorityCodes.has(c.code));
  
  // 3. Merge lists
  const sortedCountries = [...priorityList, ...remainingList];

  // 4. Build buttons (3 per row)
  const buttons: any[][] = [];
  let currentRow: any[] = [];

  sortedCountries.forEach((country) => {
    currentRow.push({
      text: i18n.t(country.i18nKey),
      callback_data: `country_set_${country.code}`,
    });

    if (currentRow.length === 3) {
      buttons.push(currentRow);
      currentRow = [];
    }
  });

  // Add any remaining buttons in the last row
  if (currentRow.length > 0) {
    buttons.push(currentRow);
  }

  // Add "Unknown/Other" button at the very end
  buttons.push([{ text: i18n.t('country.unFlagButton'), callback_data: 'country_set_UN' }]);

  await telegram.sendMessageWithButtons(chatId, message, buttons);
}
