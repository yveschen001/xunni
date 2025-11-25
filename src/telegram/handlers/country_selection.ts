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

/**
 * Show country selection menu
 */
export async function showCountrySelection(chatId: number, env: Env, telegramId?: string): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  
  // Get user for i18n
  let user = null;
  if (telegramId) {
    user = await findUserByTelegramId(db, telegramId);
  }
  const i18n = createI18n(user?.language_pref || 'zh-TW');

  const message =
    i18n.t('country.selectTitle') +
    i18n.t('country.selectHint') +
    i18n.t('country.selectUnFlagHint');

  const buttons = [
    [
      { text: i18n.t('country.buttonTW'), callback_data: 'country_set_TW' },
      { text: i18n.t('country.buttonCN'), callback_data: 'country_set_CN' },
      { text: i18n.t('country.buttonHK'), callback_data: 'country_set_HK' },
    ],
    [
      { text: i18n.t('country.buttonUS'), callback_data: 'country_set_US' },
      { text: i18n.t('country.buttonJP'), callback_data: 'country_set_JP' },
      { text: i18n.t('country.buttonKR'), callback_data: 'country_set_KR' },
    ],
    [
      { text: i18n.t('country.buttonGB'), callback_data: 'country_set_GB' },
      { text: i18n.t('country.buttonFR'), callback_data: 'country_set_FR' },
      { text: i18n.t('country.buttonDE'), callback_data: 'country_set_DE' },
    ],
    [
      { text: i18n.t('country.buttonSG'), callback_data: 'country_set_SG' },
      { text: i18n.t('country.buttonMY'), callback_data: 'country_set_MY' },
      { text: i18n.t('country.buttonTH'), callback_data: 'country_set_TH' },
    ],
    [
      { text: i18n.t('country.buttonAU'), callback_data: 'country_set_AU' },
      { text: i18n.t('country.buttonCA'), callback_data: 'country_set_CA' },
      { text: i18n.t('country.buttonNZ'), callback_data: 'country_set_NZ' },
    ],
    [{ text: i18n.t('country.unFlagButton'), callback_data: 'country_set_UN' }],
  ];

  await telegram.sendMessageWithButtons(chatId, message, buttons);
}
