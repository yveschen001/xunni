import type { Env, TelegramCallbackQuery, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { createI18n } from '~/i18n';
import { findUserByTelegramId, findUserByUsername } from '~/db/queries/users';
import { getBlockedUsers, removeBlock, createBlock, isBlocked } from '~/db/queries/match_requests';

const PAGE_SIZE = 10;

/**
 * Show Blocklist Management Menu
 */
export async function handleBlocklistMenu(
  chatId: number,
  userId: string,
  env: Env,
  page = 0
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  
  const user = await findUserByTelegramId(db, userId);
  const i18n = createI18n(user?.language_pref || 'zh-TW');

  // Fetch blocked users
  const offset = page * PAGE_SIZE;
  const blockedList = await getBlockedUsers(db.d1, userId, PAGE_SIZE + 1, offset); // Fetch one extra to check next page
  
  const hasNextPage = blockedList.length > PAGE_SIZE;
  const displayList = blockedList.slice(0, PAGE_SIZE);

  let text = `🛡️ <b>${i18n.t('settings.blocklist.title')}</b>\n\n`;
  text += i18n.t('settings.blocklist.desc') + '\n\n';

  const buttons: any[][] = [];

  if (displayList.length === 0) {
    text += i18n.t('settings.blocklist.empty');
  } else {
    for (const block of displayList) {
      // Resolve nickname if possible (might need a join query in reality, but here we query or just show ID)
      // Optimally, getBlockedUsers should JOIN users table. 
      // For now, let's fetch individual or assume ID. 
      // To be safe and fast, we should probably update getBlockedUsers to return nickname. 
      // But let's look up user briefly or just show ID.
      const blockedUser = await findUserByTelegramId(db, block.blocked_user_id);
      const name = blockedUser?.nickname || blockedUser?.username || block.blocked_user_id;
         
      buttons.push([{
        text: `🔓 ${i18n.t('common.unblock')}: ${name}`,
        callback_data: `settings_unblock:${block.blocked_user_id}:${page}`
      }]);
    }
  }

  // Pagination
  const paginationRow: any[] = [];
  if (page > 0) {
    paginationRow.push({ text: '⬅️', callback_data: `settings_blocklist_page:${page - 1}` });
  }
  if (hasNextPage) {
    paginationRow.push({ text: '➡️', callback_data: `settings_blocklist_page:${page + 1}` });
  }
  if (paginationRow.length > 0) buttons.push(paginationRow);

  // Actions
  buttons.push([
    { text: `➕ ${i18n.t('settings.blocklist.add_manual')}`, callback_data: 'settings_block_manual_start' }
  ]);
  buttons.push([
    { text: i18n.t('common.back'), callback_data: 'menu_settings' }
  ]);

  // Using HTML for bold title
  // Note: Design said Plain Text, but title often uses bold. 
  // If plain text strictly:
  if (text.includes('<b>')) text = text.replace(/<b>|<\/b>/g, '**'); // Simple markdown fallback or just plain
  
  // Design doc said "Plain Text + Emojis". 
  text = text.replace('<b>', '').replace('</b>', '');

  await telegram.sendMessageWithButtons(chatId, text, buttons);
}

/**
 * Handle Unblock Action
 */
export async function handleUnblock(
  callbackQuery: TelegramCallbackQuery, 
  blockedId: string, 
  page: number, 
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const userId = callbackQuery.from.id.toString();
  const chatId = callbackQuery.message!.chat.id;

  const user = await findUserByTelegramId(db, userId);
  const i18n = createI18n(user?.language_pref || 'zh-TW');

  await removeBlock(db.d1, userId, blockedId);
    
  await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('settings.blocklist.unblock_success'));
    
  // Refresh menu
  await handleBlocklistMenu(chatId, userId, env, page);
}

/**
 * Handle Manual Block Input (Step 1: Ask ID)
 */
export async function handleManualBlockStart(
  chatId: number, 
  userId: string, 
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const user = await findUserByTelegramId(db, userId);
  const i18n = createI18n(user?.language_pref || 'zh-TW');

  const { upsertSession } = await import('~/db/queries/sessions');
  await upsertSession(db, {
    telegram_id: userId,
    type: 'fortune_input', // Reuse this session type or create new
    step: 'block_manual_input',
    data: {},
    updated_at: new Date().toISOString()
  });

  await telegram.sendMessageWithButtons(
    chatId, 
    i18n.t('settings.blocklist.manual_prompt'),
    [[{ text: i18n.t('common.cancel'), callback_data: 'settings_blocklist' }]]
  );
}

/**
 * Handle Manual Block Input (Step 2: Process Input)
 */
export async function handleManualBlockInput(
  message: TelegramMessage, 
  env: Env,
  input: string
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const userId = message.from!.id.toString();
  const chatId = message.chat.id;

  const user = await findUserByTelegramId(db, userId);
  const i18n = createI18n(user?.language_pref || 'zh-TW');

  // Resolve Target
  let targetUser = await findUserByTelegramId(db, input);
  if (!targetUser) {
    const username = input.replace('@', '');
    targetUser = await findUserByUsername(db, username);
  }

  if (!targetUser) {
    await telegram.sendMessage(chatId, i18n.t('errors.userNotFound'));
    // Ask again or offer back
    return; 
  }

  if (targetUser.telegram_id === userId) {
    await telegram.sendMessage(chatId, i18n.t('settings.blocklist.error_self'));
    return;
  }

  await createBlock(db.d1, userId, targetUser.telegram_id, 'manual');

  await telegram.sendMessage(chatId, i18n.t('settings.blocklist.block_success', { name: targetUser.nickname || input }));
    
  // Return to list
  await handleBlocklistMenu(chatId, userId, env);
}

