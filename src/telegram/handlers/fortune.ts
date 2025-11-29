import { Env, TelegramMessage, TelegramCallbackQuery, User, FortuneProfile } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { createI18n } from '~/i18n';
import { FortuneService } from '~/services/fortune';
import { upsertSession, getActiveSession, clearSession, updateSessionData } from '~/db/queries/sessions';
import { findUserByTelegramId } from '~/db/queries/users';

// ============================================================================
// Command Handler
// ============================================================================

export async function handleFortune(message: TelegramMessage, env: Env): Promise<void> {
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
    // Start Onboarding Wizard
    await startFortuneOnboarding(chatId, telegramId, env, i18n);
    return;
  }

  // Show Main Menu
  await showFortuneMenu(chatId, profiles[0], env, i18n);
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
    // [
    //   { text: `💞 ${i18n.t('fortune.match')}`, callback_data: 'fortune_match' } // Future feature
    // ],
    [
      { text: `⚙️ ${i18n.t('fortune.manageProfiles')}`, callback_data: 'fortune_profiles' }
    ]
  ];

  await telegram.sendMessageWithButtons(chatId, text, buttons);
}

// ============================================================================
// Onboarding Wizard
// ============================================================================

async function startFortuneOnboarding(chatId: number, telegramId: string, env: Env, i18n: any) {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);

  // Clear any existing session
  await clearSession(db, telegramId, 'fortune_wizard');

  // Create new session
  await upsertSession(db, telegramId, 'fortune_wizard', {});

  await telegram.sendMessage(chatId, i18n.t('fortune.onboarding.askName'));
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
      // Next: City
      await updateSessionData(db, session.id, data);
      await telegram.sendMessage(message.chat.id, i18n.t('fortune.onboarding.askCity'));
      return true;

    case 'birth_city':
      data.birth_city = text;
      // Finish
      const service = new FortuneService(env, db.d1);
      await service.createProfile(telegramId, {
        name: data.name,
        gender: data.gender,
        birth_date: data.birth_date,
        birth_time: data.birth_time,
        is_birth_time_unknown: data.is_birth_time_unknown,
        birth_city: data.birth_city,
        // TODO: Geocoding for lat/lng
        birth_location_lat: 0,
        birth_location_lng: 0
      });
      
      await clearSession(db, telegramId, 'fortune_wizard');
      
      // Fetch new profile to show menu
      const profiles = await service.getProfiles(telegramId);
      await telegram.sendMessage(message.chat.id, i18n.t('fortune.profileCreated'));
      await showFortuneMenu(message.chat.id, profiles[0], env, i18n);
      return true;
  }

  return false;
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
      await telegram.sendMessage(chatId, i18n.t('fortune.generating'));
      
      const fortune = await service.generateFortune(user, profile, type, targetDate);
      
      // Format Output
      let output = `🔮 *${i18n.t(`fortune.${type}Title`)}*\n`;
      output += `📅 ${targetDate}\n\n`;
      output += fortune.content;
      
      await telegram.sendMessage(chatId, output);
    } catch (e: any) {
      console.error('Fortune generation error:', e);
      if (e.message === 'QUOTA_EXCEEDED') {
        await telegram.sendMessage(chatId, i18n.t('fortune.quotaExceeded'));
      } else {
        await telegram.sendMessage(chatId, i18n.t('errors.systemError'));
      }
    }
    await telegram.answerCallbackQuery(callbackQuery.id);
    return;
  }
}

