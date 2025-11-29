import { Env, TelegramMessage, TelegramCallbackQuery, User, FortuneProfile } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { createI18n } from '~/i18n';
import { FortuneService } from '~/services/fortune';
import { upsertSession, getActiveSession, clearSession, updateSessionData } from '~/db/queries/sessions';
import { findUserByTelegramId } from '~/db/queries/users';

import { startGeoFlow, handleContinentSelection, handleCountrySelection, handleCitySearchInput, handleCitySelection, getRegionData, getFlagEmoji } from './onboarding_geo';
import { createGeoService } from '~/services/geo';

// ============================================================================
// Command Handler
// ============================================================================

export async function handleFortune(message: TelegramMessage, env: Env): Promise<void> {
  try {
    const db = createDatabaseClient(env.DB);
    const telegram = createTelegramService(env);
    const chatId = message.chat.id;
    const telegramId = message.from!.id.toString();

    // Get User
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) return;

    const i18n = createI18n(user.language_pref || 'zh-TW');
    const service = new FortuneService(env, db.d1);

    // Check if profile exists
    const profiles = await service.getProfiles(telegramId);
    
    if (profiles.length === 0) {
      // Check if user has birth info from onboarding
      if (user.birthday && user.gender) {
        await startSelfProfileWizard(chatId, telegramId, env, user, i18n);
      } else {
        await startNewProfileWizard(chatId, telegramId, env, i18n);
      }
      return;
    }

    // Show Main Menu
    await showFortuneMenu(chatId, profiles[0], env, i18n);
  } catch (error) {
    console.error('[handleFortune] Error:', error);
    const telegram = createTelegramService(env);
    // Try to send error message to user
    try {
      await telegram.sendMessage(message.chat.id, 'System error in Fortune service. Please try again later.');
    } catch (e) {
      // Ignore
    }
  }
}

// ============================================================================
// Menu & UI
// ============================================================================

async function showFortuneMenu(chatId: number, profile: FortuneProfile, env: Env, i18n: any) {
  const telegram = createTelegramService(env);
  
  const text = `🔮 *${i18n.t('fortune.menuTitle')}*\n` +
               `${i18n.t('fortune.currentProfile')}: ${profile.name}\n\n` +
               `${i18n.t('fortune.selectOption')}`;

  const buttons = [
    [
      { text: `📅 ${i18n.t('fortune.daily')}`, callback_data: 'fortune_daily' },
      { text: `🧘 ${i18n.t('fortune.deep')}`, callback_data: 'fortune_deep' }
    ],
    [
      { 
        text: profile.is_subscribed 
          ? `🔕 ${i18n.t('fortune.unsubscribe')}` 
          : `🔔 ${i18n.t('fortune.subscribe')}`, 
        callback_data: 'fortune_subscribe_toggle' 
      }
    ],
    [
      { text: `⚙️ ${i18n.t('fortune.manageProfiles')}`, callback_data: 'fortune_profiles' }
    ]
  ];

  await telegram.sendMessageWithButtons(chatId, text, buttons);
}

// ============================================================================
// Onboarding Wizard
// ============================================================================

async function startNewProfileWizard(chatId: number, telegramId: string, env: Env, i18n: any) {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);

  await clearSession(db, telegramId, 'fortune_wizard');
  await upsertSession(db, telegramId, 'fortune_wizard', {});
  await telegram.sendMessage(chatId, i18n.t('fortune.onboarding.askName'));
}

async function startSelfProfileWizard(chatId: number, telegramId: string, env: Env, user: User, i18n: any) {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);

  await clearSession(db, telegramId, 'fortune_wizard');
  
  // Pre-fill session with user data
  // Skip name, gender, birth_date
  const sessionData = {
    step: 'birth_time',
    name: user.first_name || user.username || 'User',
    gender: user.gender || 'male',
    birth_date: user.birthday // Assumed YYYY-MM-DD
  };
  
  await upsertSession(db, telegramId, 'fortune_wizard', sessionData);
  
  const msg = i18n.t('fortune.onboarding.selfWelcome', { 
    name: sessionData.name,
    date: sessionData.birth_date 
  }) + '\n\n' + i18n.t('fortune.onboarding.askTime');

  await telegram.sendMessageWithButtons(chatId, msg, [
    [{ text: i18n.t('fortune.unknownTime'), callback_data: 'fortune_time_unknown' }]
  ]);
}

// ============================================================================
// Input Handler (Text)
// ============================================================================

export async function handleFortuneInput(message: TelegramMessage, env: Env): Promise<boolean> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const telegramId = message.from!.id.toString();
  const text = message.text?.trim();

  if (!text) return false;

  // Check session
  const session = await getActiveSession(db, telegramId, 'fortune_wizard');
  if (!session) return false;

  const user = await findUserByTelegramId(db, telegramId);
  const i18n = createI18n(user?.language_pref || 'zh-TW');
  
  // session.session_data is a JSON string in db, but getActiveSession types might treat it as SessionData (object) or string depending on implementation. 
  // Looking at src/db/queries/sessions.ts, it returns UserSession where session_data is string.
  // Wait, src/domain/session.ts defines UserSession session_data as string? Let's check types.
  // Assuming session_data is string.
  
  const data = JSON.parse(session.session_data as string);

  // Use session_data to store step as well? or use separate step field?
  // The upsertSession implementation doesn't seem to have a 'step' column in the INSERT statement shown in the read_file output?
  // Let's re-read src/db/queries/sessions.ts. It has session_type, session_data.
  // It does NOT have 'step'. So we must store 'step' inside 'data'.
  
  const currentStep = data.step || 'name';

  switch (currentStep) {
    case 'name':
      data.name = text;
      data.step = 'gender';
      // Next: Gender (Buttons)
      await updateSessionData(db, session.id, data);
      await telegram.sendMessageWithButtons(message.chat.id, i18n.t('fortune.onboarding.askGender'), [
        [
          { text: i18n.t('common.male'), callback_data: 'fortune_gender_male' },
          { text: i18n.t('common.female'), callback_data: 'fortune_gender_female' }
        ]
      ]);
      return true;

    case 'birth_date':
      // Validate YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        await telegram.sendMessage(message.chat.id, i18n.t('errors.invalidDateFormat'));
        return true;
      }
      data.birth_date = text;
      data.step = 'birth_time';
      // Next: Birth Time
      await updateSessionData(db, session.id, data);
      await telegram.sendMessageWithButtons(message.chat.id, i18n.t('fortune.onboarding.askTime'), [
        [{ text: i18n.t('fortune.unknownTime'), callback_data: 'fortune_time_unknown' }]
      ]);
      return true;

    case 'birth_time':
      // Validate HH:mm
      if (!/^\d{2}:\d{2}$/.test(text)) {
        await telegram.sendMessage(message.chat.id, i18n.t('errors.invalidTimeFormat'));
        return true;
      }
      data.birth_time = text;
      data.is_birth_time_unknown = 0;
      data.step = 'birth_city';
      // Next: City (Use Geo Selector)
      await updateSessionData(db, session.id, data);
      
      // Call Geo Selector Start Logic (Reused from onboarding_geo but adapted for fortune context)
      // We can reuse startGeoFlow but we need to intercept the callback to store it in session, not user profile directly?
      // Wait, handleCitySelection in onboarding_geo updates `users` table directly (onboarding_step='nickname').
      // We don't want that for Fortune Wizard! We want to update `session_data.birth_city` etc.
      // So we can reuse the UI parts (Continent/Country Selection) but we need CUSTOM Handlers for the final City Selection in Fortune context.
      
      // Let's manually trigger the first step of Geo Flow here
      await startGeoFlowForFortune(message.chat.id, telegramId, env, i18n);
      return true;

    case 'birth_city_search':
      // Handle City Search Input
      // We reuse the search logic but return buttons with `fortune_city:{id}` callback
      await handleFortuneCitySearch(message, env);
      return true;
  }

  return false;
}

// ============================================================================
// Helper: Geo Flow for Fortune (Adapted from Onboarding)
// ============================================================================

async function startGeoFlowForFortune(chatId: number, telegramId: string, env: Env, i18n: any) {
  const db = createDatabaseClient(env.DB);
  const user = await findUserByTelegramId(db, telegramId);
  const session = await getActiveSession(db, telegramId, 'fortune_wizard');
  
  if (session) {
    const data = JSON.parse(session.session_data as string);
    // Suggest based on user's registered country if available
    if (user?.country_code) {
      const dn = new Intl.DisplayNames([user.language_pref || 'zh-TW'], { type: 'region' });
      const countryName = dn.of(user.country_code) || user.country_code;
      const flag = getFlagEmoji(user.country_code);
      
      const message = i18n.t('fortune.onboarding.askCity') + '\n\n' +
                      `📍 ${i18n.t('fortune.onboarding.suggestCountry', { country: `${flag} ${countryName}` })}`;
      
      await createTelegramService(env).sendMessageWithButtons(chatId, message, [
        [{ text: `✅ ${i18n.t('common.yes')}`, callback_data: `fortune_geo:suggest:${user.country_code}` }],
        [{ text: `🌍 ${i18n.t('common.no_reselect')}`, callback_data: 'fortune_geo:manual' }]
      ]);
      return;
    }

    // Fallback to continent selection
    data.step = 'birth_city_continent';
    await updateSessionData(db, session.id, data);
  }

  // Reuse REGIONS from onboarding_geo (Need to export them or duplicate)
  // Duplicating for simplicity to avoid tight coupling if onboarding changes
  const REGIONS = [
    { id: 'asia', key: 'geo.continent.asia' },
    { id: 'europe', key: 'geo.continent.europe' },
    { id: 'north_america', key: 'geo.continent.north_america' },
    { id: 'south_america', key: 'geo.continent.south_america' },
    { id: 'africa', key: 'geo.continent.africa' },
    { id: 'oceania', key: 'geo.continent.oceania' }
  ];

  const buttons = REGIONS.map(r => [{
    text: i18n.t(r.key),
    callback_data: `fortune_geo:continent:${r.id}`
  }]);

  await createTelegramService(env).sendMessageWithButtons(
    chatId,
    i18n.t('fortune.onboarding.askCity') + '\n\n' + i18n.t('geo.select_continent'),
    buttons
  );
}

async function handleFortuneCitySearch(message: TelegramMessage, env: Env) {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const text = message.text?.trim();
  if (!text) return;

  const telegramId = message.from!.id.toString();
  const session = await getActiveSession(db, telegramId, 'fortune_wizard');
  if (!session) return;
  const data = JSON.parse(session.session_data as string); // { country_code: 'TW', ... }

  const geoService = createGeoService(env.DB);
  const allCities = await geoService.searchCities(text);
  
  // Filter by country if selected
  const filteredCities = data.country_code 
    ? allCities.filter(c => c.country_code === data.country_code)
    : allCities;

  const i18n = createI18n('zh-TW'); // Fallback or get from user

  if (filteredCities.length === 0) {
    await telegram.sendMessage(message.chat.id, i18n.t('geo.city_not_found'));
    return;
  }

  const buttons = filteredCities.slice(0, 10).map(c => [{
    text: `${c.name} (${c.ascii_name})`,
    callback_data: `fortune_geo:city:${c.id}`
  }]);

  await telegram.sendMessageWithButtons(
    message.chat.id,
    i18n.t('geo.confirm_button'),
    buttons
  );
}

// ============================================================================
// Callback Handler
// ============================================================================

export async function handleFortuneCallback(callbackQuery: TelegramCallbackQuery, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const telegramId = callbackQuery.from.id.toString();
  const data = callbackQuery.data!;
  const chatId = callbackQuery.message!.chat.id;

  const user = await findUserByTelegramId(db, telegramId);
  if (!user) return;
  const i18n = createI18n(user.language_pref || 'zh-TW');
  const service = new FortuneService(env, db.d1);

  // Wizard Callbacks
  if (data.startsWith('fortune_gender_')) {
    const gender = data.replace('fortune_gender_', '');
    const session = await getActiveSession(db, telegramId, 'fortune_wizard');
    
    if (session) {
      const sessionData = JSON.parse(session.session_data as string);
      const currentStep = sessionData.step || 'name';
      
      if (currentStep === 'gender') {
        sessionData.gender = gender;
        sessionData.step = 'birth_date';
        await updateSessionData(db, session.id, sessionData);
        await telegram.sendMessage(chatId, i18n.t('fortune.onboarding.askDate'));
        await telegram.answerCallbackQuery(callbackQuery.id);
      }
    }
    return;
  }

  if (data === 'fortune_time_unknown') {
    const session = await getActiveSession(db, telegramId, 'fortune_wizard');
    if (session) {
      const sessionData = JSON.parse(session.session_data as string);
      const currentStep = sessionData.step || 'name';
      
      if (currentStep === 'birth_time') {
        sessionData.birth_time = null;
        sessionData.is_birth_time_unknown = 1;
        sessionData.step = 'birth_city';
        await updateSessionData(db, session.id, sessionData);
        await telegram.sendMessage(chatId, i18n.t('fortune.onboarding.askCity'));
        await telegram.answerCallbackQuery(callbackQuery.id);
      }
    }
    return;
  }

  // Geo Callbacks for Fortune
  if (data.startsWith('fortune_geo:')) {
    const session = await getActiveSession(db, telegramId, 'fortune_wizard');
    if (!session) return;
    const sessionData = JSON.parse(session.session_data as string);

    // Suggestion Response
    if (data.startsWith('fortune_geo:suggest:')) {
      const countryCode = data.replace('fortune_geo:suggest:', '');
      // Skip continent/country, go to City Search
      sessionData.step = 'birth_city_search';
      sessionData.country_code = countryCode; // Store for filtering
      await updateSessionData(db, session.id, sessionData);
      
      const dn = new Intl.DisplayNames([user?.language_pref || 'zh-TW'], { type: 'region' });
      const countryName = dn.of(countryCode);
      
      await telegram.sendMessage(chatId, `${getFlagEmoji(countryCode)} ${countryName}\n\n` + i18n.t('geo.search_city_prompt'));
      await telegram.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'fortune_geo:manual') {
      sessionData.step = 'birth_city_continent';
      await updateSessionData(db, session.id, sessionData);
      
      const { REGIONS } = await import('./onboarding_geo');
      const buttons = REGIONS.map(r => [{
        text: i18n.t(r.key),
        callback_data: `fortune_geo:continent:${r.id}`
      }]);
      
      await telegram.sendMessageWithButtons(
        chatId,
        i18n.t('geo.select_continent'),
        buttons
      );
      await telegram.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data.startsWith('fortune_geo:continent:')) {
      const continentId = data.replace('fortune_geo:continent:', '');
      // Show Countries
      const { getRegionData } = await import('./onboarding_geo');
      const region = getRegionData(continentId);
      
      if (!region) return;

      const dn = new Intl.DisplayNames([user?.language_pref || 'zh-TW'], { type: 'region' });
      const buttons = [];
      let row = [];
      for (const code of region.countries) {
        row.push({
          text: `${getFlagEmoji(code)} ${dn.of(code) || code}`,
          callback_data: `fortune_geo:country:${code}`
        });
        if (row.length === 2) {
          buttons.push(row);
          row = [];
        }
      }
      if (row.length > 0) buttons.push(row);
      
      // We can add "Back" button if we implement navigation stack in session_data
      
      await telegram.editMessageText(
        chatId,
        callbackQuery.message!.message_id,
        i18n.t('geo.select_country'),
        { reply_markup: { inline_keyboard: buttons } }
      );
      await telegram.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data.startsWith('fortune_geo:country:')) {
      const countryCode = data.replace('fortune_geo:country:', '');
      sessionData.step = 'birth_city_search';
      sessionData.country_code = countryCode;
      await updateSessionData(db, session.id, sessionData);
      
      const dn = new Intl.DisplayNames([user?.language_pref || 'zh-TW'], { type: 'region' });
      const countryName = dn.of(countryCode);
      
      await telegram.sendMessage(chatId, `${getFlagEmoji(countryCode)} ${countryName}\n\n` + i18n.t('geo.search_city_prompt'));
      await telegram.answerCallbackQuery(callbackQuery.id);
      return;
    }
    
    if (data.startsWith('fortune_geo:city:')) {
      const cityId = data.replace('fortune_geo:city:', '');
      const geoService = createGeoService(env.DB);
      const city = await geoService.getCityById(parseInt(cityId));
      
      if (city) {
        sessionData.birth_city = city.name;
        sessionData.birth_location_lat = city.lat;
        sessionData.birth_location_lng = city.lng;
        
        // Finish
        const service = new FortuneService(env, db.d1);
        await service.createProfile(telegramId, {
          name: sessionData.name,
          gender: sessionData.gender,
          birth_date: sessionData.birth_date,
          birth_time: sessionData.birth_time,
          is_birth_time_unknown: sessionData.is_birth_time_unknown,
          birth_city: sessionData.birth_city,
          birth_location_lat: sessionData.birth_location_lat,
          birth_location_lng: sessionData.birth_location_lng
        });
        
        await clearSession(db, telegramId, 'fortune_wizard');
        const profiles = await service.getProfiles(telegramId);
        await telegram.sendMessage(chatId, i18n.t('fortune.profileCreated'));
        await showFortuneMenu(chatId, profiles[0], env, i18n);
      }
    }
    return;
  }

  // Subscribe Toggle
  if (data === 'fortune_subscribe_toggle') {
    const profiles = await service.getProfiles(telegramId);
    if (profiles.length === 0) return;
    const profile = profiles[0];
    
    // Toggle
    const newStatus = profile.is_subscribed ? 0 : 1;
    await service.updateProfileSubscription(profile.id, newStatus);
    
    // Refresh Menu
    const updatedProfiles = await service.getProfiles(telegramId);
    await showFortuneMenu(chatId, updatedProfiles[0], env, i18n);
    
    await telegram.answerCallbackQuery(callbackQuery.id, 
      newStatus ? i18n.t('fortune.subscribed') : i18n.t('fortune.unsubscribed')
    );
    return;
  }

  // Menu Callbacks
  if (data === 'fortune_daily' || data === 'fortune_deep') {
    const type = data === 'fortune_daily' ? 'daily' : 'deep';
    const profiles = await service.getProfiles(telegramId);
    if (profiles.length === 0) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('fortune.noProfile'));
      return;
    }

    const profile = profiles[0]; // Default profile
    const targetDate = new Date().toISOString().split('T')[0];

    try {
      // Fake Loading Animation
      const loadingMsgs = [
        '🛰️ ' + i18n.t('fortune.loading.astronomy'),
        '📜 ' + i18n.t('fortune.loading.bazi'),
        '🧬 ' + i18n.t('fortune.loading.analysis'),
        '🧠 ' + i18n.t('fortune.loading.generating')
      ];

      const msg = await telegram.sendMessage(chatId, i18n.t('fortune.generating'));
      const msgId = msg.result.message_id;

      for (const loadingText of loadingMsgs) {
        await new Promise(r => setTimeout(r, 800)); // 0.8s delay
        try {
          await telegram.editMessageText(chatId, msgId, loadingText);
        } catch (e) {
          // Ignore edit errors (e.g. if same content)
        }
      }
      
      const fortune = await service.generateFortune(user, profile, type, targetDate);
      
      // Format Output
      let output = `🔮 *${i18n.t(`fortune.${type}Title`)}*\n`;
      output += `📅 ${targetDate}\n\n`;
      output += fortune.content;
      
      // Delete loading message and send new one (or edit final)
      await telegram.deleteMessage(chatId, msgId);
      await telegram.sendMessage(chatId, output, { parse_mode: 'Markdown' });

    } catch (e: any) {
      console.error('Fortune generation error:', e);
      if (e.message === 'QUOTA_EXCEEDED') {
        await telegram.sendMessageWithButtons(
          chatId,
          i18n.t('fortune.quotaExceeded'),
          [
            [{ text: i18n.t('adReward.watchAdButton'), callback_data: 'watch_ad:fortune' }]
          ]
        );
      } else {
        await telegram.sendMessage(chatId, i18n.t('errors.systemError'));
      }
    }
    await telegram.answerCallbackQuery(callbackQuery.id);
    return;
  }
}

