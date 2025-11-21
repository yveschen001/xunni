/**
 * Country Selection Handler
 * 
 * Shows country selection menu for users
 */

import type { Env } from '~/types';
import { createTelegramService } from '~/services/telegram';

/**
 * Show country selection menu
 */
export async function showCountrySelection(
  chatId: number,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  
  const message = 
    `🌍 **請選擇你的國家/地區**\n\n` +
    `💡 這將顯示在你的資料卡上\n` +
    `🇺🇳 如果找不到，可以選擇「聯合國旗」`;
  
  const buttons = [
    [
      { text: '🇹🇼 台灣', callback_data: 'country_set_TW' },
      { text: '🇨🇳 中國', callback_data: 'country_set_CN' },
      { text: '🇭🇰 香港', callback_data: 'country_set_HK' },
    ],
    [
      { text: '🇺🇸 美國', callback_data: 'country_set_US' },
      { text: '🇯🇵 日本', callback_data: 'country_set_JP' },
      { text: '🇰🇷 韓國', callback_data: 'country_set_KR' },
    ],
    [
      { text: '🇬🇧 英國', callback_data: 'country_set_GB' },
      { text: '🇫🇷 法國', callback_data: 'country_set_FR' },
      { text: '🇩🇪 德國', callback_data: 'country_set_DE' },
    ],
    [
      { text: '🇸🇬 新加坡', callback_data: 'country_set_SG' },
      { text: '🇲🇾 馬來西亞', callback_data: 'country_set_MY' },
      { text: '🇹🇭 泰國', callback_data: 'country_set_TH' },
    ],
    [
      { text: '🇦🇺 澳洲', callback_data: 'country_set_AU' },
      { text: '🇨🇦 加拿大', callback_data: 'country_set_CA' },
      { text: '🇳🇿 紐西蘭', callback_data: 'country_set_NZ' },
    ],
    [
      { text: '🇺🇳 聯合國旗', callback_data: 'country_set_UN' },
    ],
  ];
  
  await telegram.sendMessageWithButtons(chatId, message, buttons);
}

