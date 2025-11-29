import type { Env, CallbackQuery, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { findUserByTelegramId, updateUserProfile, updateOnboardingStep } from '~/db/queries/users';
import { createTelegramService } from '~/services/telegram';
import { createI18n } from '~/i18n';
import { createGeoService } from '~/services/geo';

// Hardcoded Regions & Countries (MVP)
// In a full implementation, this should come from D1 or a proper config
export const REGIONS = [
  { id: 'asia', key: 'geo.continent.asia', countries: ['TW', 'CN', 'HK', 'JP', 'KR', 'VN', 'TH', 'ID', 'MY', 'SG', 'IN'] },
  { id: 'europe', key: 'geo.continent.europe', countries: ['GB', 'DE', 'FR', 'IT', 'ES', 'RU', 'UA', 'PL', 'NL', 'TR'] },
  { id: 'north_america', key: 'geo.continent.north_america', countries: ['US', 'CA', 'MX'] },
  { id: 'south_america', key: 'geo.continent.south_america', countries: ['BR', 'AR', 'CL', 'CO'] },
  { id: 'africa', key: 'geo.continent.africa', countries: ['ZA', 'EG', 'NG', 'KE'] },
  { id: 'oceania', key: 'geo.continent.oceania', countries: ['AU', 'NZ'] }
];

export function getRegionData(regionId: string) {
  return REGIONS.find(r => r.id === regionId);
}

export async function startGeoFlow(chatId: number, telegramId: string, env: Env) {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const user = await findUserByTelegramId(db, telegramId);
  if (!user) return;
  const i18n = createI18n(user.language_pref || 'zh-TW');

  await updateOnboardingStep(db, telegramId, 'region_selection');

  const buttons = REGIONS.map(r => [{
    text: i18n.t(r.key as any),
    callback_data: `geo:continent:${r.id}`
  }]);

  await telegram.sendMessageWithButtons(
    chatId,
    i18n.t('geo.select_continent'),
    buttons
  );
}

export async function handleContinentSelection(
  callbackQuery: CallbackQuery,
  continentId: string,
  env: Env
) {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();
  
  const user = await findUserByTelegramId(db, telegramId);
  const i18n = createI18n(user?.language_pref || 'zh-TW');

  const region = REGIONS.find(r => r.id === continentId);
  if (!region) return;

  await updateOnboardingStep(db, telegramId, 'country_selection');

  // Convert country codes to names using Intl.DisplayNames
  const dn = new Intl.DisplayNames([user?.language_pref || 'zh-TW'], { type: 'region' });
  
  const buttons = [];
  let row = [];
  for (const code of region.countries) {
    row.push({
      text: `${getFlagEmoji(code)} ${dn.of(code) || code}`,
      callback_data: `geo:country:${code}`
    });
    if (row.length === 2) {
      buttons.push(row);
      row = [];
    }
  }
  if (row.length > 0) buttons.push(row);
  
  buttons.push([{ text: i18n.t('common.back'), callback_data: 'geo:back:region' }]);

  await telegram.editMessageText(
    chatId,
    callbackQuery.message!.message_id,
    i18n.t('geo.select_country'),
    { reply_markup: { inline_keyboard: buttons } }
  );
  await telegram.answerCallbackQuery(callbackQuery.id);
}

export async function handleCountrySelection(
  callbackQuery: CallbackQuery,
  countryCode: string,
  env: Env
) {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();
  
  const user = await findUserByTelegramId(db, telegramId);
  const i18n = createI18n(user?.language_pref || 'zh-TW');

  // Save country code temporarily or just move to city search
  await updateUserProfile(db, telegramId, { country_code: countryCode });
  await updateOnboardingStep(db, telegramId, 'city_search');

  const dn = new Intl.DisplayNames([user?.language_pref || 'zh-TW'], { type: 'region' });
  const countryName = dn.of(countryCode);

  await telegram.editMessageText(
    chatId,
    callbackQuery.message!.message_id,
    `${getFlagEmoji(countryCode)} ${countryName}\n\n` + i18n.t('geo.search_city_prompt'),
    { reply_markup: { inline_keyboard: [[{ text: i18n.t('common.back'), callback_data: 'geo:back:country' }]] } }
  );
  await telegram.answerCallbackQuery(callbackQuery.id);
}

export async function handleCitySearchInput(
  message: TelegramMessage,
  env: Env
) {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();
  const text = message.text?.trim();
  
  if (!text) return;

  const user = await findUserByTelegramId(db, telegramId);
  const i18n = createI18n(user?.language_pref || 'zh-TW');
  const geoService = createGeoService(env.DB);

  console.log(`[Geo] User: ${user?.telegram_id}, Country: ${user?.country_code}, Search: ${text}`);

  // Search cities
  // Use country_code filter if we want strictly inside that country?
  // Our searchCities doesn't filter by country yet, but we can filter results in code.
  const allCities = await geoService.searchCities(text);
  const filteredCities = user?.country_code 
    ? allCities.filter(c => c.country_code === user.country_code)
    : allCities;

  if (filteredCities.length === 0) {
    const debugInfo = `Debug: All=${allCities.length}, Filtered=${filteredCities.length}, UserCountry=${user?.country_code}, Query=${text}`;
    await telegram.sendMessage(chatId, i18n.t('geo.city_not_found') + '\n' + debugInfo);
    return;
  }

  const buttons = filteredCities.slice(0, 10).map(c => [{
    text: `${c.name} (${c.ascii_name})`,
    callback_data: `geo:city:${c.id}`
  }]);

  await telegram.sendMessageWithButtons(
    chatId,
    i18n.t('geo.confirm_button' as any), // Use specific key
    buttons
  );
}

export async function handleCitySelection(
  callbackQuery: CallbackQuery,
  cityId: string,
  env: Env
) {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();
  
  const user = await findUserByTelegramId(db, telegramId);
  const i18n = createI18n(user?.language_pref || 'zh-TW');
  const geoService = createGeoService(env.DB);

  const city = await geoService.getCityById(parseInt(cityId));
  if (!city) {
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.error.short9'));
    return;
  }

  // Save City & Lat/Lng & Timezone
  // Note: We need columns for lat/lng/timezone in `users` table.
  // The migration 0066 added birth_* but NOT user location.
  // Wait, I updated 0066 but that was for fortune_history and users.birth_*
  // Onboarding is about "Current Location" or "Birth Location"?
  // For Onboarding, it's usually "Where are you from/Current Location" for matching.
  // The Fortune feature uses `fortune_profiles`.
  // BUT the User Table (for matching) needs `lat/lng`.
  // The existing `users` table has `city` (string).
  // I need to add `lat`, `lng`, `timezone` to `users` table if not present.
  // Let's check `0066` again.
  // 0066 added: birth_time, birth_city, birth_location_lat, birth_location_lng.
  // It DID NOT add root level `lat` / `lng` for the user (for matching).
  // I should use `birth_city` etc. if this is for fortune?
  // NO, Onboarding is "User Profile". Usually implies "Current City" or "Origin".
  // Let's store it in `city`, `birth_location_lat` (abuse?) no.
  // I should add `lat`, `lng`, `timezone` to `users` table in a new migration `0070`.
  // OR just store it in `birth_location_*` if we assume user lives where they were born? (Bad assumption).
  
  // Design says: "Onboarding Upgrade... users.lat, users.lng -> 新增欄位".
  // So I need migration `0070`.
  
  await db.d1.prepare(`
    UPDATE users SET 
      city = ?, 
      country_code = ?,
      timezone = ?, 
      lat = ?, 
      lng = ?,
      onboarding_step = 'nickname'
    WHERE telegram_id = ?
  `).bind(
    city.name, city.country_code, city.timezone, city.lat, city.lng, telegramId
  ).run();

  await telegram.answerCallbackQuery(callbackQuery.id, `Selected: ${city.name}`);
  await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

  // Next Step: Nickname
  // Logic ported from startOnboarding to maintain consistent UX
  const suggestedNickname = user.username || user.first_name || '';
  
  if (suggestedNickname) {
    const nicknameMessage =
      i18n.t('common.nickname7') +
      i18n.t('warnings.warning.short4') +
      i18n.t('common.nickname5') +
      i18n.t('common.text79') +
      i18n.t('common.nickname11');

    await telegram.sendMessageWithButtons(chatId, nicknameMessage, [
      [
        {
          text: i18n.t('onboarding.useTelegramNickname', {
            nickname: suggestedNickname.substring(0, 18),
          }),
          callback_data: `nickname_use_telegram`,
        },
      ],
      [{ text: i18n.t('onboarding.customNickname'), callback_data: 'nickname_custom' }],
    ]);
  } else {
    // No Telegram nickname, ask for custom nickname
    const nicknameMessage =
      i18n.t('common.nickname8') +
      i18n.t('warnings.warning.short4') +
      i18n.t('common.nickname5') +
      i18n.t('common.text79') +
      i18n.t('common.nickname11');

    await telegram.sendMessage(chatId, nicknameMessage);
  }
}

// Helper
export function getFlagEmoji(countryCode: string) {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

