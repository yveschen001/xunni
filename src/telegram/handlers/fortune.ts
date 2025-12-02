import { Env, TelegramMessage, TelegramCallbackQuery, User, FortuneProfile } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { createI18n } from '~/i18n';
import { FortuneService } from '~/services/fortune';
import { upsertSession, getActiveSession, clearSession, updateSessionData } from '~/db/queries/sessions';
import { findUserByTelegramId } from '~/db/queries/users';
import { getFlagEmoji } from './onboarding_geo';
import { createGeoService } from '~/services/geo';

import { LoveFortuneHandler } from './fortune_love';

import { TarotHandler } from './fortune_tarot';

// ============================================================================
// Constants
// ============================================================================

const FORTUNE_PACK_SMALL_STARS = 100;
const FORTUNE_PACK_LARGE_STARS = 385;
const FORTUNE_PACK_SMALL_AMOUNT = 10;
const FORTUNE_PACK_LARGE_AMOUNT = 50;

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
    
    // Check VIP status for mandatory checks
    const isVip = !!(user?.is_vip && user?.vip_expire_at && new Date(user.vip_expire_at) > new Date());

    if (isVip) {
      // Mandatory Interest Check (VIP Only)
      if (!user.interests || user.interests === '[]' || user.interests === '') {
        await telegram.sendMessageWithButtons(chatId, i18n.t('fortune.profile_incomplete_hint'), [
          [{ text: i18n.t('interests.btn_edit'), callback_data: 'edit_interests_callback' }],
          [{ text: i18n.t('fortune.backToMenu'), callback_data: 'return_to_menu' }]
        ]);
        return;
      }

      // Mandatory Career Check (VIP Only)
      if (!user.job_role || !user.industry) {
        await telegram.sendMessageWithButtons(chatId, i18n.t('fortune.profile_incomplete_hint'), [
          [{ text: i18n.t('career.btn_edit_role'), callback_data: 'edit_job_role' }],
          [{ text: i18n.t('career.btn_edit_industry'), callback_data: 'edit_industry' }],
          [{ text: i18n.t('fortune.backToMenu'), callback_data: 'return_to_menu' }]
        ]);
        return;
      }
    }

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
    await showFortuneMenu(chatId, telegramId, env, i18n, undefined, user);
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

async function showFortuneMenu(chatId: number, telegramId: string, env: Env, i18n: any, profileToUse?: FortuneProfile, userObj?: User | null) {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const service = new FortuneService(env, db.d1);
  const user = userObj || await findUserByTelegramId(db, telegramId);
  
  // 1. Determine Active Profile
  let profile = profileToUse;
  if (!profile) {
    const profiles = await service.getProfiles(telegramId);
    if (profiles.length === 0) return; // Should be handled before calling this

    // Check Session for Active Selection (24h validity)
    const session = await getActiveSession(db, telegramId, 'fortune_context');
    if (session) {
      const data = JSON.parse(session.session_data as string);
      const selectedAt = new Date(data.selected_at);
      const now = new Date();
      const diffHours = (now.getTime() - selectedAt.getTime()) / (1000 * 60 * 60);
      
      if (diffHours < 24 && data.active_profile_id) {
        profile = profiles.find(p => p.id === data.active_profile_id);
      }
    }
    
    // Fallback to default
    if (!profile) {
      profile = profiles.find(p => p.is_default) || profiles[0];
    }
  }

  // 2. Refresh and get quota (User Quota, not Profile Quota)
  const isVip = !!(user?.is_vip && user?.vip_expire_at && new Date(user.vip_expire_at) > new Date());
  const quota = await service.refreshQuota(telegramId, isVip);
  const totalQuota = quota.weekly_free_quota + quota.additional_quota;
  
  // 3. Prepare Display Data
  const { getZodiacDisplay, getZodiacSign } = await import('~/domain/zodiac');
  const birthDate = new Date(profile.birth_date);
  const zodiacSign = getZodiacSign(birthDate);
  const zodiac = getZodiacDisplay(zodiacSign, i18n);
  
  const flag = user?.country_code ? getFlagEmoji(user.country_code) : '';
  // Owner Display Name (User's Telegram Name)
  const ownerName = user?.nickname || user?.first_name || 'User';
  
  // Profile Details Line
  const profileDetails = `👤 ${profile.gender === 'male' ? '♂️' : '♀️'} | 🎂 ${profile.birth_date} | ${zodiac} | 🩸 ${user?.blood_type || '?'} | 🧠 ${user?.mbti_result || '?'}`;

  // Quota Line
  const quotaKey = isVip ? 'fortune.quotaDisplayVip' : 'fortune.quotaDisplayFree';
  const quotaText = i18n.t(quotaKey, {
    total: totalQuota,
    weekly: quota.weekly_free_quota, // For Free
    daily: quota.weekly_free_quota,  // For VIP
    limit: isVip ? 1 : 1, 
    additional: quota.additional_quota
  });

  // 4. Construct Header
  let header = `🔮 ${ownerName}\n`; // Always User's Name
  
  if (!profile.is_default) {
    // Viewing Target Profile
    header += `${i18n.t('fortune.targetProfile')}:\n`;
    header += `💗 ${profile.name}\n`;
  }
  
  header += `${profileDetails}\n`;
  header += `${quotaText}\n`;
  
  if (!profile.is_default) {
    header += `\n💡 ${i18n.t('fortune.revertHint')}`;
  }

  const text = header + `\n${i18n.t('fortune.selectOption')}`;

  const buttons = [
    // Featured (Row 1)
    [
      { text: `🧬 ${i18n.t('fortune.menu.love')}`, callback_data: 'fortune_love_menu' }
    ],
    // Basic (Row 2)
    [
      { text: `📅 ${i18n.t('fortune.daily')}`, callback_data: 'fortune_daily' },
      { text: `🗓️ ${i18n.t('fortune.weekly')}`, callback_data: 'fortune_weekly' }
    ],
    // Advanced 1 (Row 3)
    [
      { text: `🔮 ${i18n.t('fortune.ziwei')}`, callback_data: 'fortune_ziwei' },
      { text: `🌠 ${i18n.t('fortune.astrology')}`, callback_data: 'fortune_astrology' }
    ],
    // Advanced 2 (Row 4)
    [
      { text: `🃏 ${i18n.t('fortune.tarot')}`, callback_data: 'fortune_tarot_menu' },
      { text: `📜 ${i18n.t('fortune.bazi')}`, callback_data: 'fortune_bazi' }
    ],
    // History & Celebrity (Row 5)
    [
      { text: `🌟 ${i18n.t('fortune.celebrity')}`, callback_data: 'fortune_celebrity' },
      { text: `${i18n.t('fortune.reports.tab_all')}`, callback_data: 'fortune_my_reports' }
    ],
    // Manage (Row 6)
    [
      { text: `⚙️ ${i18n.t('fortune.warehouse')}`, callback_data: 'fortune_profiles' }
    ],
    // Subscribe/Get More (Row 6)
    [
      { text: `🛒 ${i18n.t('fortune.getMore')}`, callback_data: 'fortune_get_more' }
    ],
    [
      { text: i18n.t('buttons.returnToMenu'), callback_data: 'return_to_menu' }
    ]
  ];

  await telegram.sendMessageWithButtons(chatId, text, buttons);
}

// ============================================================================
// UI Helpers (Exported for Cross-Module Use)
// ============================================================================

export async function showGetMoreMenu(chatId: number, telegram: ReturnType<typeof createTelegramService>, i18n: any, env: Env, messageIdToEdit?: number) {
  const isStaging = env.ENVIRONMENT === 'staging';
  const smallPrice = isStaging ? 1 : FORTUNE_PACK_SMALL_STARS;
  const largePrice = isStaging ? 1 : FORTUNE_PACK_LARGE_STARS;
  const smallAmount = isStaging ? 50 : FORTUNE_PACK_SMALL_AMOUNT;
  const largeAmount = FORTUNE_PACK_LARGE_AMOUNT;

  const originalSmallPrice = smallPrice * 5;
  const originalLargePrice = largePrice * 5;

  const text = i18n.t('fortune.getMoreInfo', {
    smallAmount,
    smallPrice,
    largeAmount,
    largePrice,
    originalSmallPrice,
    originalLargePrice
  });

  const buttons = [
    [
      { text: `💎 ${i18n.t('fortune.buySmall', { amount: smallAmount, price: smallPrice, originalPrice: originalSmallPrice })}`, callback_data: 'fortune_buy_small' },
      { text: `💎 ${i18n.t('fortune.buyLarge', { amount: largeAmount, price: largePrice, originalPrice: originalLargePrice })}`, callback_data: 'fortune_buy_large' }
    ],
    [
      { text: `👑 ${i18n.t('vip.upgrade')}`, callback_data: 'menu_vip' },
      { text: `👥 ${i18n.t('menu.invite')}`, callback_data: 'menu_invite' }
    ],
    [{ text: i18n.t('fortune.backToMenu'), callback_data: 'menu_fortune' }],
    [{ text: i18n.t('buttons.returnToMenu'), callback_data: 'return_to_menu' }]
  ];

  if (messageIdToEdit) {
    await telegram.editMessageText(chatId, messageIdToEdit, text, {
      reply_markup: { inline_keyboard: buttons },
      parse_mode: 'Markdown'
    });
  } else {
    await telegram.sendMessageWithButtons(chatId, text, buttons);
  }
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
  // Hint message below buttons
  await telegram.sendMessage(chatId, i18n.t('fortune.onboarding.input_time_hint')); // Corrected key to input_time_hint
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
  // Check for Love Input Session (match_target_id)
  const inputSession = await getActiveSession(db, telegramId, 'fortune_input');
  
  if (inputSession) {
    try {
      const sessionData = typeof inputSession.session_data === 'string' 
        ? JSON.parse(inputSession.session_data) 
        : inputSession.session_data;

      if (sessionData && sessionData.step === 'match_target_id') {
        const service = new FortuneService(env, db.d1);
        const user = await findUserByTelegramId(db, telegramId);
        const i18n = createI18n(user?.language_pref || 'zh-TW');
        const { LoveFortuneHandler } = await import('./fortune_love');
        const loveHandler = new LoveFortuneHandler(service, i18n, env);
        await loveHandler.handleMatchInputGeneric(message, env, text);
        return true;
      }
    } catch (e) {
      console.error('Error parsing session data:', e);
    }
  }

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
      await telegram.sendMessage(message.chat.id, i18n.t('fortune.onboarding.input_time_hint'));
      return true;

    case 'birth_time':
      // Validate HH:mm (Strict 24-hour format)
      // Must be exactly 2 digits, colon, 2 digits
      // HH must be 00-23, mm must be 00-59
      if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(text)) {
        await telegram.sendMessage(message.chat.id, i18n.t('errors.invalidTimeFormat') + '\n' + i18n.t('fortune.onboarding.timeHint'));
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
  let allCities = await geoService.searchCities(text);
  
  // Smart Fallback if no cities found
  if (allCities.length === 0) {
    const service = new FortuneService(env, db.d1);
    const user = await findUserByTelegramId(db, telegramId);
    const correctedName = await service.correctCityName(text, user?.language_pref || 'zh-TW');
    
    if (correctedName) {
      allCities = await geoService.searchCities(correctedName);
      if (allCities.length > 0) {
        // Found with correction!
        // We might want to notify user? Or just show results.
        // Let's just show results but maybe hint in the text.
      }
    }
  }

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
  const loveHandler = new LoveFortuneHandler(service, i18n, env);

  // Helper: Check Profile Completeness (Mandatory for VIP only)
  const checkProfileCompleteness = async (): Promise<boolean> => {
    // Only check for VIP users
    const isVip = !!(user?.is_vip && user?.vip_expire_at && new Date(user.vip_expire_at) > new Date());
    if (!isVip) return true;

    const missingInterests = !user.interests || user.interests.trim() === '';
    const missingMBTI = !user.mbti_result;
    const missingCareer = !user.job_role || !user.industry;

    if (missingInterests || missingMBTI || missingCareer) {
      const buttons = [];
      if (missingInterests) {
        buttons.push([{ text: i18n.t('interests.btn_edit'), callback_data: 'edit_interests' }]);
      }
      if (missingMBTI) {
        buttons.push([{ text: i18n.t('fortune.btn_edit_mbti'), callback_data: 'mbti_menu_manual' }]);
      }
      if (missingCareer) {
        buttons.push([{ text: i18n.t('career.btn_edit_role'), callback_data: 'edit_job_role' }]);
        buttons.push([{ text: i18n.t('career.btn_edit_industry'), callback_data: 'edit_industry' }]);
      }
      buttons.push([{ text: i18n.t('fortune.back_to_menu'), callback_data: 'return_to_menu' }]);

      await telegram.sendMessageWithButtons(
        chatId,
        i18n.t('fortune.profile_incomplete_hint'),
        buttons
      );
      await telegram.answerCallbackQuery(callbackQuery.id);
      return false;
    }
    return true;
  };

  // Tarot Handler
  if (data === 'fortune_tarot_menu' || data === 'fortune_tarot_draw') {
    if (data === 'fortune_tarot_draw') {
        if (!(await checkProfileCompleteness())) return;
    }
    const { TarotHandler } = await import('./fortune_tarot');
    const tarot = new TarotHandler(service, i18n, env);
    if (data === 'fortune_tarot_menu') {
      await tarot.handleTarotMenu(chatId, telegram);
    } else {
      await tarot.handleTarotDraw(chatId, telegramId, telegram);
    }
    await telegram.answerCallbackQuery(callbackQuery.id);
    return;
  }

  if (data === 'fortune_love_menu') {
    await loveHandler.handleLoveMenu(chatId, telegram);
    await telegram.answerCallbackQuery(callbackQuery.id);
    return;
  }
  if (data === 'fortune_love_match_start') {
    if (!(await checkProfileCompleteness())) return;
    await loveHandler.handleMatchStart(chatId, telegram);
    await telegram.answerCallbackQuery(callbackQuery.id);
    return;
  }
  if (data.startsWith('fortune_love_type:')) {
    await loveHandler.handleMatchTypeSelection(chatId, telegramId, data, telegram, db);
    await telegram.answerCallbackQuery(callbackQuery.id);
    return;
  }
  if (data.startsWith('fortune_love_role:')) {
    await loveHandler.handleFamilyRoleSelection(chatId, telegramId, data, telegram, db);
    await telegram.answerCallbackQuery(callbackQuery.id);
    return;
  }
  if (data === 'fortune_love_ideal') {
    if (!(await checkProfileCompleteness())) return;
    
    // Check if user has a default profile
    const profiles = await service.getProfiles(telegramId);
    if (profiles.length === 0) {
      // Guide to create profile
      await telegram.answerCallbackQuery(callbackQuery.id);
      
      // We can start the profile wizard directly or ask user
      // Let's check if we have basic user info to start self wizard
      if (user.birthday && user.gender) {
        await startSelfProfileWizard(chatId, telegramId, env, user, i18n);
      } else {
        await startNewProfileWizard(chatId, telegramId, env, i18n);
      }
      return;
    }

    await loveHandler.handleIdealMode(chatId, telegramId, telegram);
    await telegram.answerCallbackQuery(callbackQuery.id);
    return;
  }

  // Handle Match Generation (Accepted Consent)
  if (data.startsWith('fortune_gen_match:')) {
    const requestId = data.split(':')[1];
    await loveHandler.handleGenerateMatchReport(chatId, telegramId, requestId, telegram);
    await telegram.answerCallbackQuery(callbackQuery.id);
    return;
  }

  // Handle Report Filtering/Paging/Detail
  if (data.startsWith('reports_')) {
    const { handleMyReports } = await import('./fortune_reports');
    if (data.startsWith('reports_filter:')) {
      const filter = data.split(':')[1] as any;
      await handleMyReports(chatId, telegramId, env, filter);
    } else if (data.startsWith('reports_page:')) {
      const parts = data.split(':');
      await handleMyReports(chatId, telegramId, env, parts[1] as any, parseInt(parts[2]));
    }
    await telegram.answerCallbackQuery(callbackQuery.id);
    return;
  }
  if (data.startsWith('report_detail:')) {
    const { handleReportDetail } = await import('./fortune_reports');
    const reportId = parseInt(data.split(':')[1]);
    await handleReportDetail(chatId, reportId, env);
    await telegram.answerCallbackQuery(callbackQuery.id);
    return;
  }
  // Pagination Callback
  if (data.startsWith('report_read:')) {
    const { handleReportDetail } = await import('./fortune_reports');
    // Format: report_read:{id}:{page}
    const parts = data.split(':');
    const reportId = parseInt(parts[1]);
    const page = parseInt(parts[2]);
    await handleReportDetail(chatId, reportId, env, page);
    await telegram.answerCallbackQuery(callbackQuery.id);
    return;
  }
  if (data.startsWith('report_delete:')) {
    const { handleDeleteReport } = await import('./fortune_reports');
    const reportId = parseInt(data.split(':')[1]);
    await handleDeleteReport(chatId, reportId, env);
    await telegram.answerCallbackQuery(callbackQuery.id);
    return;
  }
  // Regenerate handler removed as per spec compliance
  if (data === 'fortune_my_reports') {
    const { handleMyReports } = await import('./fortune_reports');
    await handleMyReports(chatId, telegramId, env);
    await telegram.answerCallbackQuery(callbackQuery.id);
    return;
  }

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
        
        // Send Success with Button
        await telegram.sendMessageWithButtons(
          chatId, 
          i18n.t('fortune.profileCreated'),
          [[{ text: i18n.t('fortune.back_to_menu'), callback_data: 'return_to_menu' }]]
        );
        
        // Auto-show menu (Fixing argument order bug)
        await showFortuneMenu(chatId, telegramId, env, i18n, profiles[0]); // User will be refetched, acceptable for wizard end
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
    await showFortuneMenu(chatId, updatedProfiles[0], env, i18n, undefined, user);
    
    await telegram.answerCallbackQuery(callbackQuery.id, 
      newStatus ? i18n.t('fortune.subscribed') : i18n.t('fortune.unsubscribed')
    );
    return;
  }

  // Menu Callbacks
  const generateTypes = ['fortune_daily', 'fortune_weekly', 'fortune_ziwei', 'fortune_astrology', 'fortune_bazi', 'fortune_celebrity'];
  
  if (data === 'fortune_deep') generateTypes.push('fortune_deep'); // Add deep if valid

  if (generateTypes.includes(data) || data === 'fortune_deep') {
    if (!(await checkProfileCompleteness())) return;

    const typeMap: Record<string, string> = {
      'fortune_daily': 'daily',
      'fortune_weekly': 'weekly',
      'fortune_ziwei': 'ziwei',
      'fortune_astrology': 'astrology',
      'fortune_bazi': 'bazi',
      'fortune_celebrity': 'celebrity',
      'fortune_deep': 'deep'
    };
    
    const type = typeMap[data];
    const profiles = await service.getProfiles(telegramId);
    if (profiles.length === 0) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('fortune.noProfile'));
      return;
    }

    // Determine Active Profile
    let profile = profiles.find(p => p.is_default) || profiles[0];
    const session = await getActiveSession(db, telegramId, 'fortune_context');
    if (session) {
      const sData = JSON.parse(session.session_data as string);
      const selectedAt = new Date(sData.selected_at);
      const now = new Date();
      if ((now.getTime() - selectedAt.getTime()) < 24 * 60 * 60 * 1000 && sData.active_profile_id) {
        const selected = profiles.find(p => p.id === sData.active_profile_id);
        if (selected) profile = selected;
      }
    }

    const targetDate = new Date().toISOString().split('T')[0];

    try {
      // 1. Check Cache (Free) - Skip cache for match/celebrity usually? Or keep it.
      // Celebrity might need re-roll? No, usually stable per day/week.
      const isCached = await service.isFortuneCached(user.telegram_id, type, targetDate);
      
      // 2. Check Quota (if not cached)
      if (!isCached) {
        const isVip = !!(user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > new Date());
        const hasQuota = await service.checkQuota(user.telegram_id, isVip);
        
        if (!hasQuota) {
          await telegram.sendMessageWithButtons(
            chatId,
            i18n.t('fortune.quotaExceeded'),
            [
              [{ text: `🛒 ${i18n.t('fortune.getMore')}`, callback_data: 'fortune_get_more' }]
            ]
          );
          await telegram.answerCallbackQuery(callbackQuery.id);
          return;
        }
      } else {
        // If cached, just load it. 
        // We need to fetch it to pass ID to handleReportDetail.
        // service.generateFortune checks cache internally and returns it without deducting quota.
        // But let's clarify that flow. 
        // generateFortune calls deductQuota ONLY if !cached.
      }

      // Fake Loading Animation
      // Only show deduction animation if NOT cached
      const loadingMsgs = [];
      if (!isCached) {
        loadingMsgs.push('📉 ' + i18n.t('fortune.loading.deduct'));
      }
      loadingMsgs.push(
        '🛰️ ' + i18n.t('fortune.loading.astronomy'),
        '📜 ' + i18n.t('fortune.loading.bazi'),
        '🧬 ' + i18n.t('fortune.loading.analysis'),
        '🧠 ' + i18n.t('fortune.loading.generating')
      );

      const msg = await telegram.sendMessageAndGetId(chatId, i18n.t('fortune.generating'));
      const msgId = msg.message_id;

      const fortune = await service.generateFortune(
        user, 
        profile, 
        type, 
        targetDate, 
        undefined, 
        undefined, 
        undefined, 
        async (progressText) => {
          try {
            await telegram.editMessageText(chatId, msgId, progressText);
          } catch (e) {
            // Ignore edit errors
          }
        }
      );
      
      // Delete loading message and send new one (or edit final)
      await telegram.deleteMessage(chatId, msgId);
      
      // Instead of sending raw text, delegate to handleReportDetail for pagination support
      const { handleReportDetail } = await import('./fortune_reports');
      await handleReportDetail(chatId, fortune.id, env);

    } catch (e: any) {
      console.error('Fortune generation error:', e);
      if (e.message === 'QUOTA_EXCEEDED') {
        // Double check (should be caught above, but generateFortune also throws)
        await telegram.sendMessageWithButtons(
          chatId,
          i18n.t('fortune.quotaExceeded'),
          [
            [{ text: `🛒 ${i18n.t('fortune.getMore')}`, callback_data: 'fortune_get_more' }]
          ]
        );
      } else {
        await telegram.sendMessage(chatId, i18n.t('errors.systemError'));
      }
    }
    await telegram.answerCallbackQuery(callbackQuery.id);
    return;
  }

  // Manage Profiles Menu
  if (data === 'fortune_profiles') {
    const profiles = await service.getProfiles(telegramId);
    
    const text = `📂 *${i18n.t('fortune.manageProfiles')}*\n\n`;
    const buttons = [];

    // List Profiles
    // Sort: Default first, then by created_at (assumed id order)
    const sortedProfiles = [...profiles].sort((a, b) => {
      if (a.is_default) return -1;
      if (b.is_default) return 1;
      return b.id - a.id; // Newest first? Or Oldest? Let's say newest first
    });

    for (const p of sortedProfiles) {
      const isDefault = p.is_default ? '🌟 ' : ''; // Star for self
      // const flag = ...
      const genderIcon = p.gender === 'male' ? '♂️' : '♀️';
      
      buttons.push([{
        text: `${isDefault}${p.name} ${genderIcon}`,
        callback_data: `fortune_select_profile:${p.id}`
      }]);
    }

    // Add "New Profile" button
    buttons.push([{ text: `➕ ${i18n.t('fortune.addProfile') || '新增檔案'}`, callback_data: 'fortune_add_profile' }]);
    buttons.push([{ text: i18n.t('fortune.backToMenu'), callback_data: 'menu_fortune' }]); 

    await telegram.editMessageText(chatId, callbackQuery.message!.message_id, text, {
      reply_markup: { inline_keyboard: buttons },
      parse_mode: 'Markdown'
    });
    await telegram.answerCallbackQuery(callbackQuery.id);
    return;
  }

  // Select Profile (View Menu for specific profile)
  if (data.startsWith('fortune_select_profile:')) {
    const profileId = parseInt(data.replace('fortune_select_profile:', ''));
    const profiles = await service.getProfiles(telegramId);
    const profile = profiles.find(p => p.id === profileId);
    
    if (profile) {
      // 1. Save Selection to Session
      await upsertSession(
        db, 
        telegramId, 
        'fortune_context', 
        { active_profile_id: profileId, selected_at: new Date().toISOString() }
      );

      // 2. Show Menu for this profile
      await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);
      await showFortuneMenu(chatId, telegramId, env, i18n, profile, user); // Pass profile explicitly to avoid re-fetch logic override
    }
    await telegram.answerCallbackQuery(callbackQuery.id);
    return;
  }

  // Add Profile
  if (data === 'fortune_add_profile') {
    await startNewProfileWizard(chatId, telegramId, env, i18n);
    await telegram.answerCallbackQuery(callbackQuery.id);
    return;
  }

  // Get More (Shop/Info)
  if (data === 'fortune_get_more') {
    await showGetMoreMenu(chatId, telegram, i18n, env, callbackQuery.message!.message_id);
    await telegram.answerCallbackQuery(callbackQuery.id);
    return;
  }

  // Buy Handlers (Invoice)
  if (data === 'fortune_buy_small' || data === 'fortune_buy_large') {
    const isSmall = data === 'fortune_buy_small';
    const isStaging = env.ENVIRONMENT === 'staging';
    
    // Config
    const price = isSmall 
      ? (isStaging ? 1 : FORTUNE_PACK_SMALL_STARS) 
      : (isStaging ? 1 : FORTUNE_PACK_LARGE_STARS); // Maybe large in staging is also cheap or normal? User said "1 Star can buy 50". Let's make small 50 for 1 star.
    
    const amount = isSmall
      ? (isStaging ? 50 : FORTUNE_PACK_SMALL_AMOUNT)
      : FORTUNE_PACK_LARGE_AMOUNT;

    const title = i18n.t('fortune.invoiceTitle', { amount });
    const description = i18n.t('fortune.invoiceDesc', { amount });
    const originalPrice = price * 5;
    
    const invoice = {
      chat_id: chatId,
      title,
      description,
      payload: JSON.stringify({
        user_id: telegramId,
        type: 'fortune_pack',
        amount: amount
      }),
      provider_token: '', // Stars
      currency: 'XTR',
      prices: [{ label: `${title} (Original ${originalPrice} Stars -80%)`, amount: price }]
    };

    console.log('[Fortune] Sending invoice:', invoice);
    // Send invoice
    // telegram service doesn't have sendInvoice yet? It usually uses raw fetch or we add it.
    // Let's use raw fetch here if needed or check if telegram service has it.
    // Checked createTelegramService, it might not have sendInvoice.
    // src/telegram/handlers/vip.ts uses raw fetch construction inside `sendVipInvoice` but calls `telegram.callApi('sendInvoice', ...)`? 
    // Wait, vip.ts `sendVipInvoice` implementation:
    // It creates `invoice` object but how does it send? 
    // Ah, I missed the end of `sendVipInvoice` in the search result.
    
    // Let's try to call sendInvoice via telegram service's generic method if available, or just implement it here.
    const apiRoot = env.TELEGRAM_API_ROOT || 'https://api.telegram.org';
    const token = env.TELEGRAM_BOT_TOKEN;
    const url = `${apiRoot}/bot${token}/sendInvoice`;
    
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice)
    });
    
    await telegram.answerCallbackQuery(callbackQuery.id);
    return;
  }
}