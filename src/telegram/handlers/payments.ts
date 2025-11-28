import type { Env, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { createI18n } from '~/i18n';
import { findUserByTelegramId } from '~/db/queries/users';

const PAGE_SIZE = 12;

export async function handlePayments(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const telegramId = message.from!.id.toString();
  await showPaymentHistory(telegram, telegramId, message.chat.id, 1, env);
}

export async function handlePaymentsCallback(callbackQuery: any, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const telegramId = callbackQuery.from.id.toString();
  const data = callbackQuery.data as string;
  const page = parseInt(data.replace('payments_page_', ''), 10) || 1;

  await showPaymentHistory(telegram, telegramId, callbackQuery.message.chat.id, page, env, callbackQuery.message.message_id);
  await telegram.answerCallbackQuery(callbackQuery.id);
}

async function showPaymentHistory(
  telegram: ReturnType<typeof createTelegramService>,
  telegramId: string,
  chatId: number,
  page: number,
  env: Env,
  messageId?: number
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const user = await findUserByTelegramId(db, telegramId);
  const i18n = createI18n(user?.language_pref || 'zh-TW');

  // Count total records
  const countResult = await db.d1.prepare(
    'SELECT COUNT(*) as count FROM payments WHERE telegram_id = ?'
  ).bind(telegramId).first<{ count: number }>();
  
  const totalRecords = countResult?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  
  // Validate page
  const currentPage = Math.max(1, Math.min(page, totalPages));

  if (totalRecords === 0) {
    const text = `💳 **${i18n.t('buttons.viewPayments')}**\n\n${i18n.t('payments.empty')}\n\n${i18n.t('common.back3')}`;
    const buttons = [[{ text: i18n.t('common.back4'), callback_data: 'vip_menu' }]];
    
    if (messageId) {
      await telegram.editMessageText(chatId, messageId, text, { reply_markup: { inline_keyboard: buttons } });
    } else {
      await telegram.sendMessageWithButtons(chatId, text, buttons);
    }
    return;
  }

  // Fetch records
  const offset = (currentPage - 1) * PAGE_SIZE;
  const records = await db.d1.prepare(`
    SELECT * FROM payments 
    WHERE telegram_id = ? 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `).bind(telegramId, PAGE_SIZE, offset).all<any>();

  // Build message
  let text = i18n.t('payments.title', { page: currentPage, total: totalPages }) + '\n\n';

  for (const record of records.results) {
    const date = new Date(record.created_at).toLocaleString(user?.language_pref || 'zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    let statusText = '';
    switch (record.status) {
      case 'completed':
        statusText = i18n.t('payments.status.paid');
        break;
      case 'refunded':
        statusText = i18n.t('payments.status.refunded');
        break;
      case 'failed':
        statusText = i18n.t('payments.status.failed');
        break;
      case 'pending':
        statusText = i18n.t('payments.status.pending');
        break;
      default:
        statusText = record.status;
    }

    // Determine product name (currently mostly VIP Monthly)
    // Could check vip_duration_days or amount, but for now simple mapping
    const productName = i18n.t('payments.product.VIP_MONTHLY');

    text += `📅 ${date}\n`;
    text += `${productName}\n`;
    text += `💰 ${record.amount_stars} Stars\n`;
    text += `${statusText}\n\n`;
  }

  text += '━━━━━━━━━━━━━━━━';

  // Build buttons
  const buttons: any[][] = [];
  const paginationButtons: any[] = [];

  if (currentPage > 1) {
    paginationButtons.push({ text: i18n.t('common.prev'), callback_data: `payments_page_${currentPage - 1}` });
  }
  if (currentPage < totalPages) {
    paginationButtons.push({ text: i18n.t('common.next'), callback_data: `payments_page_${currentPage + 1}` });
  }

  if (paginationButtons.length > 0) {
    buttons.push(paginationButtons);
  }

  buttons.push([{ text: i18n.t('buttons.backToVip'), callback_data: 'vip_menu' }]);
  buttons.push([{ text: i18n.t('common.back3'), callback_data: 'return_to_menu' }]);

  if (messageId) {
    await telegram.editMessageText(chatId, messageId, text, { reply_markup: { inline_keyboard: buttons } });
  } else {
    await telegram.sendMessageWithButtons(chatId, text, buttons);
  }
}

