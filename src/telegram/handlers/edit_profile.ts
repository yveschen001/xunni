import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { upsertSession, getActiveSession, deleteSession, updateSessionData } from '~/db/queries/sessions';
import { parseSessionData, SessionType } from '~/domain/session';
import { createI18n } from '~/i18n';
import { TelegramCallbackQuery, TelegramMessage, Env } from '~/types';
import { INTEREST_STRUCTURE, MAX_INTERESTS, InterestCategory } from '~/domain/interests';
import { JOB_ROLES, INDUSTRIES, INDUSTRY_CATEGORIES } from '~/domain/career';
import { REGIONS, getFlagEmoji } from './onboarding_geo';

const SESSION_TYPE: SessionType = 'edit_profile';

/**
 * Handle edit nickname callback
 */
export async function handleEditNickname(
  callbackQuery: TelegramCallbackQuery,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    await telegram.answerCallbackQuery(callbackQuery.id);
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Create session
    await upsertSession(db, telegramId, SESSION_TYPE, { data: { editing: 'nickname' } });

    await telegram.sendMessageWithButtons(
      chatId,
      i18n.t('edit_profile.nicknameInstruction', { nickname: user?.username || i18n.t('common.unknown') }),
      [[{ text: i18n.t('buttons.back'), callback_data: 'edit_profile_callback' }]]
    );
  } catch (error) {
    console.error('[handleEditNickname] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short4'));
  }
}

/**
 * Handle edit bio callback
 */
export async function handleEditBio(
  callbackQuery: TelegramCallbackQuery,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    await telegram.answerCallbackQuery(callbackQuery.id);
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Create session
    await upsertSession(db, telegramId, SESSION_TYPE, { data: { editing: 'bio' } });

    await telegram.sendMessageWithButtons(
      chatId,
      i18n.t('edit_profile.bioInstruction', { bio: user?.bio || i18n.t('common.none') }),
      [[{ text: i18n.t('buttons.back'), callback_data: 'edit_profile_callback' }]]
    );
  } catch (error) {
    console.error('[handleEditBio] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short4'));
  }
}

/**
 * Handle edit region callback
 */
export async function handleEditRegion(
  callbackQuery: TelegramCallbackQuery,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    await telegram.answerCallbackQuery(callbackQuery.id);
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Create session
    await upsertSession(db, telegramId, SESSION_TYPE, { data: { editing: 'city' } });

    // Show continent selection directly
    const continents = ['asia', 'europe', 'north_america', 'south_america', 'africa', 'oceania'];
    const buttons = [];
    
    // Add continent buttons (2 per row)
    for (let i = 0; i < continents.length; i += 2) {
      const row = [];
      row.push({
        text: i18n.t(`geo.continent.${continents[i]}` as any),
        callback_data: `edit_geo:continent:${continents[i]}`
      });
      if (i + 1 < continents.length) {
        row.push({
          text: i18n.t(`geo.continent.${continents[i + 1]}` as any),
          callback_data: `edit_geo:continent:${continents[i + 1]}`
        });
      }
      buttons.push(row);
    }
    
    // Add back button
    buttons.push([{ text: i18n.t('buttons.back'), callback_data: 'edit_profile_callback' }]);

    const currentRegion = user?.country ? `\n(目前: ${user.country})` : '';

    await telegram.sendMessageWithButtons(
      chatId,
      i18n.t('geo.select_continent') + currentRegion,
      buttons
    );
  } catch (error) {
    console.error('[handleEditRegion] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short4'));
  }
}

/**
 * Handle edit match preference callback
 */
export async function handleEditMatchPref(
  callbackQuery: TelegramCallbackQuery,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    await telegram.answerCallbackQuery(callbackQuery.id);
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    const buttons = [
      [{ text: i18n.t('common.male'), callback_data: 'match_pref_male' }],
      [{ text: i18n.t('common.female'), callback_data: 'match_pref_female' }],
      [{ text: i18n.t('common.text60'), callback_data: 'match_pref_any' }],
      [{ text: i18n.t('buttons.back'), callback_data: 'edit_profile_callback' }],
    ];

    await telegram.sendMessageWithButtons(chatId, i18n.t('edit_profile.matchPrefInstruction'), buttons);
  } catch (error) {
    console.error('[handleEditMatchPref] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short4'));
  }
}

export async function handleMatchPrefSelection(
  callbackQuery: TelegramCallbackQuery,
  preference: 'male' | 'female' | 'any',
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    await db.d1
      .prepare('UPDATE users SET match_pref = ? WHERE telegram_id = ?')
      .bind(preference, telegramId)
      .run();

    await telegram.answerCallbackQuery(callbackQuery.id);
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Check and complete "match_pref" task
    try {
      const updatedUser = await findUserByTelegramId(db, telegramId);
      if (updatedUser) {
        const { checkAndCompleteTask } = await import('./tasks');
        await checkAndCompleteTask(db, telegram, updatedUser, 'task_match_pref');
      }
    } catch (taskError) {
      console.error('[handleMatchPrefSelection] Task check error:', taskError);
    }

    const prefKey = preference === 'any' ? 'common.text60' : (preference === 'male' ? 'common.male' : 'common.female');
    const prefText = i18n.t(prefKey as any);

    await telegram.sendMessageWithButtons(chatId, i18n.t('success.text3', { prefText }), [
      [{ text: i18n.t('common.short3'), callback_data: 'edit_profile_callback' }],
      [{ text: i18n.t('common.back3'), callback_data: 'return_to_menu' }],
    ]);
  } catch (error) {
    console.error('[handleMatchPrefSelection] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short4'));
  }
}

/**
 * Handle edit interests callback
 */
export async function handleEditInterests(
  callbackQuery: TelegramCallbackQuery,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    await telegram.answerCallbackQuery(callbackQuery.id);
    // await telegram.deleteMessage(chatId, callbackQuery.message!.message_id); // Edit instead of delete?

    // Load current interests
    let currentInterests: string[] = [];
    if (user?.interests) {
      currentInterests = user.interests.split(',').map(i => i.trim()).filter(i => i);
    }

    // Create session (Store draft interests in session data)
    await upsertSession(db, telegramId, SESSION_TYPE, { 
      data: { 
        editing: 'interests',
        draft_interests: currentInterests 
      } 
    });

    await renderInterestMenu(chatId, telegramId, telegram, i18n, db, callbackQuery.message!.message_id);

  } catch (error) {
    console.error('[handleEditInterests] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short4'));
  }
}

/**
 * Handle Interest Interactions (Category Select, Toggle, Save)
 */
export async function handleInterestInteraction(
  callbackQuery: TelegramCallbackQuery,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();
  const data = callbackQuery.data!;
  
  try {
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    const session = await getActiveSession(db, telegramId, SESSION_TYPE);
    
    if (!session) {
      await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('errors.session_expired'));
      return;
    }

    const sessionData = parseSessionData(session);
    let draftInterests: string[] = sessionData.data?.draft_interests || [];

    // 1. Show Category List (Home)
    if (data === 'interest_home') {
      await renderInterestMenu(chatId, telegramId, telegram, i18n, db, callbackQuery.message!.message_id, undefined);
      await telegram.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // 2. Select Category
    if (data.startsWith('interest_cat:')) {
      const catId = data.split(':')[1];
      await renderInterestMenu(chatId, telegramId, telegram, i18n, db, callbackQuery.message!.message_id, catId);
      await telegram.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // 3. Toggle Item
    if (data.startsWith('interest_toggle:')) {
      const itemKey = data.split(':')[1];
      const itemLabel = i18n.t(`interests.items.${itemKey}` as any); // Get localized label to store (or store key?)
      
      const interestText = itemLabel; 
      
      // Check if exists (by text comparison)
      if (draftInterests.includes(interestText)) {
        // Remove
        draftInterests = draftInterests.filter(i => i !== interestText);
      } else {
        // Add
        if (draftInterests.length >= MAX_INTERESTS) {
          await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('interests.max_limit', { max: MAX_INTERESTS }), true);
          return;
        }
        draftInterests.push(interestText);
      }
      
      // Update Session
      sessionData.data!.draft_interests = draftInterests;
      await updateSessionData(db, session.id, sessionData);
      
      // Re-render current category view to update checks
      const category = INTEREST_STRUCTURE.find(c => c.items.includes(itemKey));
      if (category) {
        await renderInterestMenu(chatId, telegramId, telegram, i18n, db, callbackQuery.message!.message_id, category.id);
      }
      await telegram.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // 4. Save
    if (data === 'interest_save') {
      const interestsStr = draftInterests.join(', ');
      await db.d1
        .prepare('UPDATE users SET interests = ? WHERE telegram_id = ?')
        .bind(interestsStr, telegramId)
        .run();

      // Complete Task
      try {
        const updatedUser = await findUserByTelegramId(db, telegramId);
        if (updatedUser) {
          const { checkAndCompleteTask } = await import('./tasks');
          await checkAndCompleteTask(db, telegram, updatedUser, 'task_interests');
        }
      } catch (taskError) {
        console.error('[handleInterestInteraction] Task error:', taskError);
      }

      await deleteSession(db, telegramId, SESSION_TYPE);
      
      await telegram.sendMessageWithButtons(chatId, i18n.t('interests.saved'), [
        [{ text: i18n.t('common.back'), callback_data: 'edit_profile_callback' }],
        [{ text: i18n.t('common.back3'), callback_data: 'return_to_menu' }]
      ]);
      // Delete the menu message
      await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);
      await telegram.answerCallbackQuery(callbackQuery.id);
      return;
    }

  } catch (error) {
    console.error('[handleInterestInteraction] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, 'System Error');
  }
}

/**
 * Render Interest Menu (Category List or Item List)
 */
async function renderInterestMenu(
  chatId: number, 
  userId: string, 
  telegram: ReturnType<typeof createTelegramService>, 
  i18n: any, 
  db: any,
  messageId?: number,
  categoryId?: string
) {
  const session = await getActiveSession(db, userId, SESSION_TYPE);
  const sessionData = parseSessionData(session!);
  const selected: string[] = sessionData.data?.draft_interests || [];

  let text = '';
  const buttons: any[][] = [];

  // Header: Current Selection
  const listStr = selected.length > 0 ? selected.join(', ') : i18n.t('common.none');
  const header = i18n.t('interests.current', { count: selected.length, max: MAX_INTERESTS, list: listStr });

  if (!categoryId) {
    // === Level 1: Category View ===
    text = `${i18n.t('interests.title')}\n\n${header}\n\n${i18n.t('interests.subtitle')}`;
    
    // Grid of Categories (2 columns)
    let row: any[] = [];
    for (const cat of INTEREST_STRUCTURE) {
      const catLabel = i18n.t(`interests.categories.${cat.id}` as any);
      
      // Check selection
      const catItemTexts = cat.items.map(k => i18n.t(`interests.items.${k}` as any));
      const hasSelection = catItemTexts.some(text => selected.includes(text));
      const btnText = hasSelection ? `✅ ${catLabel}` : catLabel;

      row.push({ text: btnText, callback_data: `interest_cat:${cat.id}` });
      if (row.length === 2) {
        buttons.push(row);
        row = [];
      }
    }
    if (row.length > 0) buttons.push(row);

    // Save & Back
    buttons.push([{ text: i18n.t('interests.save'), callback_data: 'interest_save' }]);
    buttons.push([{ text: i18n.t('buttons.back'), callback_data: 'edit_profile_callback' }]);

  } else {
    // === Level 2: Item View ===
    const category = INTEREST_STRUCTURE.find(c => c.id === categoryId);
    if (!category) return; // Error

    const catName = i18n.t(`interests.categories.${category.id}` as any);
    text = `${i18n.t('interests.title')} > ${catName}\n\n${header}\n\n${i18n.t('interests.label_item', { category: catName })}`;

    // Grid of Items (2 columns or 3?)
    // 2 columns allows longer text
    let row: any[] = [];
    for (const itemKey of category.items) {
      const itemLabel = i18n.t(`interests.items.${itemKey}` as any);
      const isSelected = selected.includes(itemLabel);
      const btnText = isSelected ? `✅ ${itemLabel}` : itemLabel;
      
      row.push({ text: btnText, callback_data: `interest_toggle:${itemKey}` });
      
      if (row.length === 2) {
        buttons.push(row);
        row = [];
      }
    }
    if (row.length > 0) buttons.push(row);

    // Navigation
    buttons.push([{ text: `⬅️ ${i18n.t('common.back')}`, callback_data: 'interest_home' }]);
    buttons.push([{ text: i18n.t('interests.save'), callback_data: 'interest_save' }]);
  }

  if (messageId) {
    await telegram.editMessageText(chatId, messageId, text, { reply_markup: { inline_keyboard: buttons } });
  } else {
    await telegram.sendMessageWithButtons(chatId, text, buttons);
  }
}

/**
 * Handle edit career (Job Role)
 */
export async function handleEditJobRole(
  callbackQuery: TelegramCallbackQuery,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    await telegram.answerCallbackQuery(callbackQuery.id);
    
    // Create session
    await upsertSession(db, telegramId, SESSION_TYPE, { data: { editing: 'job_role' } });

    const buttons: any[][] = [];
    let row: any[] = [];
    for (const role of JOB_ROLES) {
      let label = i18n.t(`career.role.${role}` as any);
      if (user?.job_role === role) {
        label = `✅ ${label}`;
      }
      row.push({ text: label, callback_data: `career_role:${role}` });
      if (row.length === 1) { // 1 per row for long text
        buttons.push(row);
        row = [];
      }
    }
    if (row.length > 0) buttons.push(row);
    
    buttons.push([{ text: i18n.t('buttons.back'), callback_data: 'edit_profile_callback' }]);

    const text = i18n.t('career.label_role') + (user?.job_role ? `\n(目前: ${i18n.t(`career.role.${user.job_role}` as any)})` : '');

    if (callbackQuery.message) {
        await telegram.editMessageText(chatId, callbackQuery.message.message_id, text, { reply_markup: { inline_keyboard: buttons } });
    } else {
        await telegram.sendMessageWithButtons(chatId, text, buttons);
    }

  } catch (error) {
    console.error('[handleEditJobRole] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, 'System Error');
  }
}

/**
 * Handle edit career (Industry)
 */
export async function handleEditIndustry(
  callbackQuery: TelegramCallbackQuery,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    await telegram.answerCallbackQuery(callbackQuery.id);
    
    // Create session
    await upsertSession(db, telegramId, SESSION_TYPE, { data: { editing: 'industry' } });

    await renderIndustryMenu(chatId, telegram, i18n, callbackQuery.message!.message_id, undefined, user?.industry);

  } catch (error) {
    console.error('[handleEditIndustry] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, 'System Error');
  }
}

/**
 * Render Industry Menu (Category List or Item List)
 */
async function renderIndustryMenu(
  chatId: number, 
  telegram: ReturnType<typeof createTelegramService>, 
  i18n: any, 
  messageId?: number,
  categoryId?: string,
  currentValue?: string | null
) {
  let text = '';
  const buttons: any[][] = [];

  if (!categoryId) {
    // === Level 1: Category View ===
    text = `${i18n.t('career.label_industry')}\n${currentValue ? `(目前: ${currentValue})` : ''}`;
    
    // Grid of Categories (1 column)
    for (const catId of INDUSTRY_CATEGORIES) {
      let catLabel = i18n.t(`career.industry.${catId}.label` as any);
      
      // Check selection
      if (currentValue) {
         const category = INDUSTRIES.find(c => c.id === catId);
         if (category) {
             const catItemTexts = category.items.map(k => i18n.t(`career.industry.${catId}.${k}` as any));
             if (catItemTexts.includes(currentValue)) {
                 catLabel = `✅ ${catLabel}`;
             }
         }
      }

      buttons.push([{ text: catLabel, callback_data: `industry_cat:${catId}` }]);
    }

    buttons.push([{ text: i18n.t('buttons.back'), callback_data: 'edit_profile_callback' }]);

  } else {
    // === Level 2: Item View ===
    const category = INDUSTRIES.find(c => c.id === categoryId);
    if (!category) return;

    const catName = i18n.t(`career.industry.${category.id}.label` as any);
    text = `${i18n.t('career.label_industry')} > ${catName}`;

    for (const itemKey of category.items) {
      const itemLabel = i18n.t(`career.industry.${category.id}.${itemKey}` as any);
      const isSelected = currentValue === itemLabel; // Simple text match
      const btnText = isSelected ? `✅ ${itemLabel}` : itemLabel;
      
      buttons.push([{ text: btnText, callback_data: `industry_select:${category.id}:${itemKey}` }]);
    }

    // Navigation
    buttons.push([{ text: `⬅️ ${i18n.t('common.back')}`, callback_data: 'industry_home' }]);
  }

  if (messageId) {
    await telegram.editMessageText(chatId, messageId, text, { reply_markup: { inline_keyboard: buttons } });
  } else {
    await telegram.sendMessageWithButtons(chatId, text, buttons);
  }
}

/**
 * Handle Career Interactions
 */
export async function handleCareerInteraction(
  callbackQuery: TelegramCallbackQuery,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();
  const data = callbackQuery.data!;
  
  try {
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    
    // Job Role Selection
    if (data.startsWith('career_role:')) {
      const role = data.split(':')[1];
      await db.d1.prepare('UPDATE users SET job_role = ? WHERE telegram_id = ?').bind(role, telegramId).run();
      
      await telegram.sendMessageWithButtons(chatId, i18n.t('success.text4', { text: i18n.t(`career.role.${role}` as any) }), [
        [{ text: i18n.t('common.short3'), callback_data: 'edit_profile_callback' }],
        [{ text: i18n.t('common.back3'), callback_data: 'return_to_menu' }]
      ]);
      await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);
      await telegram.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // Industry Navigation
    if (data === 'industry_home') {
      await renderIndustryMenu(chatId, telegram, i18n, callbackQuery.message!.message_id, undefined, user?.industry);
      await telegram.answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data.startsWith('industry_cat:')) {
      const catId = data.split(':')[1];
      await renderIndustryMenu(chatId, telegram, i18n, callbackQuery.message!.message_id, catId, user?.industry);
      await telegram.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // Industry Selection
    if (data.startsWith('industry_select:')) {
      const parts = data.split(':');
      const catId = parts[1];
      const itemKey = parts[2];
      const itemLabel = i18n.t(`career.industry.${catId}.${itemKey}` as any);
      
      await db.d1.prepare('UPDATE users SET industry = ? WHERE telegram_id = ?').bind(itemLabel, telegramId).run();
      
      await telegram.sendMessageWithButtons(chatId, i18n.t('success.text4', { text: itemLabel }), [
        [{ text: i18n.t('common.short3'), callback_data: 'edit_profile_callback' }],
        [{ text: i18n.t('common.back3'), callback_data: 'return_to_menu' }]
      ]);
      await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);
      await telegram.answerCallbackQuery(callbackQuery.id);
      return;
    }

  } catch (error) {
    console.error('[handleCareerInteraction] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, 'System Error');
  }
}

/**
 * Handle edit blood type callback
 */
export async function handleEditBloodType(
  callbackQuery: TelegramCallbackQuery,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    await telegram.answerCallbackQuery(callbackQuery.id);
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Create session
    await upsertSession(db, telegramId, SESSION_TYPE, { data: { editing: 'blood_type' } });

    const buttons = [
      [{ text: '🅰️ A型', callback_data: 'edit_blood_type_A' }, { text: '🅱️ B型', callback_data: 'edit_blood_type_B' }],
      [{ text: '🅾️ O型', callback_data: 'edit_blood_type_O' }, { text: '🆎 AB型', callback_data: 'edit_blood_type_AB' }],
      [{ text: i18n.t('common.unknown'), callback_data: 'edit_blood_type_unknown' }],
      [{ text: i18n.t('buttons.back'), callback_data: 'edit_profile_callback' }],
    ];

    await telegram.sendMessageWithButtons(chatId, i18n.t('edit_profile.bloodTypeInstruction'), buttons);
  } catch (error) {
    console.error('[handleEditBloodType] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short4'));
  }
}

export async function handleEditBloodTypeSelection(
  callbackQuery: TelegramCallbackQuery,
  bloodTypeValue: string,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    // Update DB
    await db.d1
      .prepare('UPDATE users SET blood_type = ? WHERE telegram_id = ?')
      .bind(bloodTypeValue, telegramId)
      .run();

    await telegram.answerCallbackQuery(callbackQuery.id);
    await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);

    // Check and complete "blood_type" task
    try {
      const updatedUser = await findUserByTelegramId(db, telegramId);
      if (updatedUser) {
        const { checkAndCompleteTask } = await import('./tasks');
        await checkAndCompleteTask(db, telegram, updatedUser, 'task_blood_type');
      }
    } catch (taskError) {
      console.error('[handleEditBloodTypeSelection] Task check error:', taskError);
    }

    await telegram.sendMessageWithButtons(chatId, i18n.t('success.bloodType', { bloodType: bloodTypeValue }), [
      [{ text: i18n.t('common.short3'), callback_data: 'edit_profile_callback' }],
      [{ text: i18n.t('common.back3'), callback_data: 'return_to_menu' }],
    ]);
  } catch (error) {
    console.error('[handleEditBloodTypeSelection] Error:', error);
    const errorI18n = createI18n('zh-TW');
    await telegram.answerCallbackQuery(callbackQuery.id, errorI18n.t('errors.error.short4'));
  }
}

/**
 * Handle profile edit text input
 */
export async function handleProfileEditInput(message: TelegramMessage, env: Env): Promise<boolean> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();
  const text = message.text || '';

  try {
    // Check if user has an active edit session
    console.error('[handleProfileEditInput] Checking session for user:', telegramId);
    const session = await getActiveSession(db, telegramId, SESSION_TYPE);
    console.error('[handleProfileEditInput] Session found:', !!session);

    if (!session) {
      return false; // Not in edit mode
    }

    // If user sends a command, clear the session and let router handle it
    if (text.startsWith('/')) {
      console.error('[handleProfileEditInput] Command detected, clearing session:', text);
      await deleteSession(db, telegramId, SESSION_TYPE);
      return false; // Let router handle the command
    }

    const sessionData = parseSessionData(session);
    const editing = sessionData.data?.editing;
    console.error('[handleProfileEditInput] Editing type:', editing);

    if (!editing) {
      return false;
    }

    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      return false;
    }

    const i18n = createI18n(user.language_pref || 'zh-TW');

    // Handle different edit types
    switch (editing) {
      case 'nickname': {
        if (text.length > 20) {
          await telegram.sendMessageWithButtons(
            chatId,
            i18n.t('errors.error.cancel1') + '\n\n' + i18n.t('common.cancel3'),
            [[{ text: i18n.t('errors.error.cancel6'), callback_data: 'edit_profile_callback' }]]
          );
          return true;
        }

        await db.d1
          .prepare('UPDATE users SET username = ? WHERE telegram_id = ?')
          .bind(text, telegramId)
          .run();

        // Check and complete "nickname" task
        try {
          const updatedUser = await findUserByTelegramId(db, telegramId);
          if (updatedUser) {
            const { checkAndCompleteTask } = await import('./tasks');
            await checkAndCompleteTask(db, telegram, updatedUser, 'task_nickname');
          }
        } catch (taskError) {
          console.error('[handleProfileEditInput] Task check error:', taskError);
        }

        await deleteSession(db, telegramId, SESSION_TYPE);
        await telegram.sendMessageWithButtons(chatId, i18n.t('success.nickname2', { text }), [
          [{ text: i18n.t('common.short3'), callback_data: 'edit_profile_callback' }],
          [{ text: i18n.t('common.back3'), callback_data: 'return_to_menu' }],
        ]);
        return true;
      }

      case 'bio': {
        if (text.length > 100) {
          await telegram.sendMessageWithButtons(
            chatId,
            i18n.t('errors.error.cancel3') + '\n\n' + i18n.t('common.cancel3'),
            [[{ text: i18n.t('errors.error.cancel6'), callback_data: 'edit_profile_callback' }]]
          );
          return true;
        }

        await db.d1
          .prepare('UPDATE users SET bio = ? WHERE telegram_id = ?')
          .bind(text, telegramId)
          .run();

        // Check and complete "bio" task
        try {
          const updatedUser = await findUserByTelegramId(db, telegramId);
          if (updatedUser) {
            const { checkAndCompleteTask } = await import('./tasks');
            await checkAndCompleteTask(db, telegram, updatedUser, 'task_bio');
          }
        } catch (taskError) {
          console.error('[handleProfileEditInput] Task check error:', taskError);
        }

        await deleteSession(db, telegramId, SESSION_TYPE);
        await telegram.sendMessageWithButtons(chatId, i18n.t('success.text4', { text }), [
          [{ text: i18n.t('common.short3'), callback_data: 'edit_profile_callback' }],
          [{ text: i18n.t('common.back3'), callback_data: 'return_to_menu' }],
        ]);
        return true;
      }

      case 'interests': {
        // Legacy text handler for interests (should not be reached if using button flow)
        // But keep for fallback or hybrid
        const interests = text
          .split(',')
          .map((i) => i.trim())
          .filter((i) => i.length > 0);

        if (interests.length > 5) {
          await telegram.sendMessageWithButtons(
            chatId,
            i18n.t('errors.error.cancel5') + '\n\n' + i18n.t('common.cancel3'),
            [[{ text: i18n.t('errors.error.cancel6'), callback_data: 'edit_profile_callback' }]]
          );
          return true;
        }

        if (interests.some((i) => i.length > 20)) {
          await telegram.sendMessageWithButtons(
            chatId,
            i18n.t('errors.error.cancel5') + '\n\n' + i18n.t('common.cancel3'),
            [[{ text: i18n.t('errors.error.cancel6'), callback_data: 'edit_profile_callback' }]]
          );
          return true;
        }

        const interestsStr = interests.join(', ');
        await db.d1
          .prepare('UPDATE users SET interests = ? WHERE telegram_id = ?')
          .bind(interestsStr, telegramId)
          .run();

        // Check and complete "interests" task
        try {
          const updatedUser = await findUserByTelegramId(db, telegramId);
          if (updatedUser) {
            const { checkAndCompleteTask } = await import('./tasks');
            await checkAndCompleteTask(db, telegram, updatedUser, 'task_interests');
          }
        } catch (taskError) {
          console.error('[handleProfileEditInput] Task check error:', taskError);
        }

        await deleteSession(db, telegramId, SESSION_TYPE);
        await telegram.sendMessageWithButtons(chatId, i18n.t('success.text2', { interestsStr }), [
          [{ text: i18n.t('common.short3'), callback_data: 'edit_profile_callback' }],
          [{ text: i18n.t('common.back3'), callback_data: 'return_to_menu' }],
        ]);
        return true;
      }

      default:
        return false;
    }
  } catch (error) {
    console.error('[handleProfileEditInput] Error:', error);
    return false;
  }
}

/**
 * Handle /edit_profile command
 */
export async function handleEditProfile(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      const i18n = createI18n('zh-TW');
      await telegram.sendMessage(chatId, i18n.t('profile.userNotFound'));
      return;
    }
    const i18n = createI18n(user.language_pref || 'zh-TW');
    await showEditProfileMenu(chatId, telegram, i18n);
  } catch (error) {
    console.error('[handleEditProfile] Error:', error);
  }
}

/**
 * Handle edit profile menu callback
 */
export async function handleEditProfileCallback(
  callbackQuery: TelegramCallbackQuery,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    await telegram.answerCallbackQuery(callbackQuery.id);

    // If coming from another menu, we might want to edit instead of send new
    if (callbackQuery.message) {
      await showEditProfileMenu(chatId, telegram, i18n, callbackQuery.message.message_id);
    } else {
      await showEditProfileMenu(chatId, telegram, i18n);
    }
  } catch (error) {
    console.error('[handleEditProfileCallback] Error:', error);
  }
}

async function showEditProfileMenu(chatId: number, telegram: any, i18n: any, messageId?: number) {
  const text = i18n.t('edit_profile.menuTitle');
  const buttons = [
    [
      { text: i18n.t('edit_profile.nicknameButton'), callback_data: 'edit_nickname' },
      { text: i18n.t('edit_profile.bioButton'), callback_data: 'edit_bio' },
    ],
    [
      { text: i18n.t('edit_profile.regionButton'), callback_data: 'edit_region' },
      { text: i18n.t('edit_profile.interestsButton'), callback_data: 'edit_interests' },
    ],
    [
      { text: i18n.t('career.btn_edit_role'), callback_data: 'edit_job_role' },
      { text: i18n.t('career.btn_edit_industry'), callback_data: 'edit_industry' },
    ],
    [
      { text: i18n.t('edit_profile.bloodTypeButton'), callback_data: 'edit_blood_type' },
      { text: i18n.t('edit_profile.matchPrefButton'), callback_data: 'edit_match_pref' },
    ],
    [{ text: i18n.t('common.back3'), callback_data: 'return_to_menu' }],
  ];

  if (messageId) {
    await telegram.editMessageText(chatId, messageId, text, {
      reply_markup: { inline_keyboard: buttons },
    });
  } else {
    await telegram.sendMessageWithButtons(chatId, text, buttons);
  }
}

/**
 * Handle Edit Geo (Continent -> Country)
 */
export async function handleEditGeoInteraction(
  callbackQuery: TelegramCallbackQuery,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();
  const data = callbackQuery.data!;

  try {
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    // 1. Continent Selected -> Show Countries
    if (data.startsWith('edit_geo:continent:')) {
      const continentId = data.split(':')[2];
      const region = REGIONS.find(r => r.id === continentId);
      
      if (!region) return;

      const dn = new Intl.DisplayNames([user?.language_pref || 'zh-TW'], { type: 'region' });
      
      const buttons = [];
      let row: any[] = [];
      for (const code of region.countries) {
        row.push({
          text: `${getFlagEmoji(code)} ${dn.of(code) || code}`,
          callback_data: `edit_geo:country:${code}`
        });
        if (row.length === 2) {
          buttons.push(row);
          row = [];
        }
      }
      if (row.length > 0) buttons.push(row);
      
      buttons.push([{ text: i18n.t('buttons.back'), callback_data: 'edit_region' }]); // Back to Continent list

      await telegram.editMessageText(
        chatId,
        callbackQuery.message!.message_id,
        i18n.t('geo.select_country'),
        { reply_markup: { inline_keyboard: buttons } }
      );
      await telegram.answerCallbackQuery(callbackQuery.id);
      return;
    }

    // 2. Country Selected -> Save & Finish
    if (data.startsWith('edit_geo:country:')) {
      const countryCode = data.split(':')[2];
      
      // Save to DB
      await db.d1.prepare('UPDATE users SET country_code = ?, city = NULL WHERE telegram_id = ?')
        .bind(countryCode, telegramId)
        .run();

      const dn = new Intl.DisplayNames([user?.language_pref || 'zh-TW'], { type: 'region' });
      const countryName = dn.of(countryCode);
      const text = `${getFlagEmoji(countryCode)} ${countryName}`;

      await telegram.sendMessageWithButtons(chatId, i18n.t('success.text6', { text }), [
        [{ text: i18n.t('common.short3'), callback_data: 'edit_profile_callback' }],
        [{ text: i18n.t('common.back3'), callback_data: 'return_to_menu' }]
      ]);
      await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);
      await telegram.answerCallbackQuery(callbackQuery.id);
      return;
    }

  } catch (error) {
    console.error('[handleEditGeoInteraction] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, 'System Error');
  }
}
