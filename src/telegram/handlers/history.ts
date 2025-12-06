/**
 * History Handler
 *
 * Handles /history command - View conversation history with identifiers.
 */

import type { Env, TelegramMessage } from '~/types';
import type { DatabaseClient } from '~/db/client';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import {
  getAllConversationsWithIdentifiers,
  getPartnerByIdentifier,
  getConversationMessages,
  getConversationStats,
  getConversationMessagesPaginated,
} from '~/db/queries/conversation_identifiers';
import { formatIdentifier, parseIdentifier } from '~/domain/conversation_identifier';
import { createI18n } from '~/i18n';
import { formatNicknameWithFlag } from '~/utils/country_flag';
import { maskNickname } from '~/utils/nickname';

/**
 * Handle /history command
 */
export async function handleHistory(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    if (!user) {
      await telegram.sendMessage(chatId, i18n.t('errors.userNotFoundRegister'));
      return;
    }

    // Check if user completed onboarding
    if (user.onboarding_step !== 'completed') {
      await telegram.sendMessage(chatId, i18n.t('errors.completeOnboarding'));
      return;
    }

    // Parse command arguments
    const args = message.text?.split(' ');
    const searchIdentifier = args && args.length > 1 ? parseIdentifier(args[1]) : null;

    if (searchIdentifier) {
      // Show specific conversation
      await showConversationByIdentifier(db, telegram, chatId, telegramId, searchIdentifier, i18n);
    } else {
      // Show all conversations (Interactive List via /chats handler)
      const { handleChats } = await import('./chats');
      await handleChats(message, env);
    }
  } catch (error) {
    console.error('[handleHistory] Error:', error);
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.sendMessage(chatId, i18n.t('history.errorRetry'));
  }
}

/**
 * Handle history read pagination
 * Callback format: history_read:{identifier}:{page}
 */
export async function handleHistoryRead(
  chatId: number,
  userId: string,
  identifier: string,
  page: number,
  env: Env,
  messageIdToEdit?: number,
  callbackQueryId?: string
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const telegramId = userId;

  try {
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');

    // Get partner info
    const partnerTelegramId = await getPartnerByIdentifier(db, telegramId, identifier);
    if (!partnerTelegramId) {
      if (callbackQueryId) {
        await telegram.answerCallbackQuery(callbackQueryId, i18n.t('history.conversationNotFound', { identifier }));
      } else {
        await telegram.sendMessage(chatId, i18n.t('history.conversationNotFound', { identifier }));
      }
      return;
    }

    const partner = await findUserByTelegramId(db, partnerTelegramId);
    const partnerNickname = partner 
      ? formatNicknameWithFlag(maskNickname(partner.nickname || partner.username || ''), partner.country_code, partner.gender)
      : `#${identifier}`;

    // Get paginated messages
    const pageSize = 20;
    const { messages, total, totalPages } = await getConversationMessagesPaginated(
      db,
      telegramId,
      partnerTelegramId,
      page,
      pageSize
    );

    // Build message content
    // Header: 💬 與 🇯🇵 CoolJa**** 的對話記錄 (第 1/3 頁)
    let content = i18n.t('conversationHistory.title', { 
      identifier: partnerNickname, // Use nickname instead of ID
      postNumber: `${page}/${Math.max(1, totalPages)}` 
    }) + '\n';
    
    content += '━━━━━━━━━━━━━━━━\n';

    let lastDate = '';
    
    if (messages.length === 0) {
      content += i18n.t('history.noMessages') + '\n';
    } else {
      for (const msg of messages) {
        const msgDate = new Date(msg.created_at);
        const dateStr = msgDate.toLocaleDateString(user?.language_pref || 'zh-TW');
        
        // Date Separator
        if (dateStr !== lastDate) {
          content += `\n📅 ${dateStr}\n`;
          lastDate = dateStr;
        }

        const timeStr = formatTime(msg.created_at, user?.language_pref || 'zh-TW');
        const isMe = msg.sender_telegram_id === telegramId;
        const senderLabel = isMe 
          ? i18n.t('conversationHistory.you') 
          : i18n.t('conversationHistory.other');
        
        // Show translated text if available, otherwise original
        // User requested: "Only display translated content"
        const textToShow = msg.translated_text || msg.content;
        
        content += `[${timeStr}] ${senderLabel}：${textToShow}\n`;
      }
    }

    content += '\n━━━━━━━━━━━━━━━━\n';
    content += '💡 ' + i18n.t('conversationHistory.translatedContent') + '\n'; // "Only translated content" hint (reuse translatedContent key or similar)

    // Build buttons
    const buttons: any[][] = [];

    // Navigation buttons
    const navRow: any[] = [];
    if (page > 1) {
      navRow.push({ 
        text: i18n.t('common.prev'), 
        callback_data: `history_read:${identifier}:${page - 1}` 
      });
    }
    if (page < totalPages) {
      navRow.push({ 
        text: i18n.t('common.next'), 
        callback_data: `history_read:${identifier}:${page + 1}` 
      });
    }
    if (navRow.length > 0) {
      buttons.push(navRow);
    }

    // Action buttons
    buttons.push([
      { text: i18n.t('conversationHistory.replyButton'), callback_data: `conv_reply_${identifier}` },
      { text: i18n.t('common.back'), callback_data: 'chats' } 
    ]);

    // Ad button (Non-VIP)
    if (user && !user.is_vip) {
      const { getTodayAdReward } = await import('~/db/queries/ad_rewards');
      const adReward = await getTodayAdReward(db.d1, telegramId);
      const adsWatched = adReward?.ads_watched || 0;
      const MAX_DAILY_ADS = 20; // Should import constant but 20 is standard
      
      if (adsWatched < MAX_DAILY_ADS) {
        const remaining = MAX_DAILY_ADS - adsWatched;
        buttons.push([{
          text: i18n.t('buttons.bottle', { remaining }),
          callback_data: 'watch_ad'
        }]);
      }
    }

    // Edit or Send?
    if (messageIdToEdit) {
      try {
        await telegram.editMessageText(chatId, messageIdToEdit, content, {
          reply_markup: { inline_keyboard: buttons }
        });
      } catch (e) {
        // If edit fails (e.g. content same), just ignore or send new
        console.error('[handleHistoryRead] Edit failed, sending new message', e);
        await telegram.sendMessageWithButtons(chatId, content, buttons);
      }
    } else {
      // Send new message
      await telegram.sendMessageWithButtons(chatId, content, buttons);
    }

  } catch (error) {
    console.error('[handleHistoryRead] Error:', error);
  }
}

/**
 * Show all conversations with identifiers
 */
async function showAllConversations(
  db: DatabaseClient,
  telegram: ReturnType<typeof createTelegramService>,
  chatId: number,
  telegramId: string,
  _i18n: ReturnType<typeof createI18n>
): Promise<void> {
  const user = await findUserByTelegramId(db, telegramId);
  const i18n = createI18n(user?.language_pref || 'zh-TW');
  const conversations = await getAllConversationsWithIdentifiers(db, telegramId);

  if (conversations.length === 0) {
    await telegram.sendMessage(chatId, i18n.t('history.noHistory'));
    return;
  }

  let message = i18n.t('history.chatHistory');

  for (const conv of conversations) {
    const preview = conv.last_message_preview
      ? conv.last_message_preview.substring(0, 30) +
        (conv.last_message_preview.length > 30 ? '...' : '')
      : i18n.t('history.noMessages');

    message += i18n.t('history.conversationTitle', {
      identifier: formatIdentifier(conv.identifier),
      count: conv.message_count,
    });
    message += i18n.t('history.lastMessage', { preview });
    message += i18n.t('history.time', {
      time: formatDate(conv.last_message_time, user?.language_pref || 'zh-TW', i18n),
    });
  }

  message += i18n.t('history.viewFull', {
    identifier: formatIdentifier(conversations[0].identifier),
  });
  message += i18n.t('history.returnToMenu');

  await telegram.sendMessage(chatId, message);
}

/**
 * Show conversation by identifier
 */
async function showConversationByIdentifier(
  db: DatabaseClient,
  telegram: ReturnType<typeof createTelegramService>,
  chatId: number,
  telegramId: string,
  identifier: string,
  _i18n: ReturnType<typeof createI18n>
): Promise<void> {
  // Get partner by identifier
  const partnerTelegramId = await getPartnerByIdentifier(db, telegramId, identifier);

  if (!partnerTelegramId) {
    const user = await findUserByTelegramId(db, telegramId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    await telegram.sendMessage(
      chatId,
      i18n.t('history.conversationNotFound', { identifier: formatIdentifier(identifier) })
    );
    return;
  }

  // Get conversation statistics
  const stats = await getConversationStats(db, telegramId, partnerTelegramId);

  // Get conversation messages (last 10)
  const messages = await getConversationMessages(db, telegramId, partnerTelegramId, 10);

  const user = await findUserByTelegramId(db, telegramId);
  const i18n = createI18n(user?.language_pref || 'zh-TW');

  let message = i18n.t('history.conversationWith', { identifier: formatIdentifier(identifier) });
  message += i18n.t('history.stats');
  message += i18n.t('history.totalMessages', { total: stats.total_messages });
  message += i18n.t('history.userMessages', { count: stats.user_messages });
  message += i18n.t('history.partnerMessages', { count: stats.partner_messages });

  if (stats.first_message_time) {
    message += i18n.t('history.conversationStart', {
      time: formatDate(stats.first_message_time, user?.language_pref || 'zh-TW', i18n),
    });
  }
  if (stats.last_message_time) {
    message += i18n.t('history.conversationEnd', {
      time: formatDate(stats.last_message_time, user?.language_pref || 'zh-TW', i18n),
    });
  }

  message += i18n.t('history.recentMessages');

  if (messages.length === 0) {
    message += i18n.t('history.noMessages');
  } else {
    for (const msg of messages) {
      const time = formatTime(msg.created_at, user?.language_pref || 'zh-TW');
      const sender =
        msg.sender_telegram_id === telegramId
          ? i18n.t('history.you')
          : formatIdentifier(identifier);
      const content = msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : '');
      message += i18n.t('history.messageTime', { time });
      message += i18n.t('history.messageSender', { sender, content });
    }
  }

  message += i18n.t('history.continueConversation');
  message += i18n.t('history.returnToMenu');

  await telegram.sendMessageWithButtons(chatId, message, [
    [{ text: i18n.t('history.continueChatButton'), callback_data: 'menu_chats' }],
    [{ text: i18n.t('history.returnToMenuButton'), callback_data: 'menu' }],
  ]);
}

/**
 * Format date for display
 */
function formatDate(dateString: string, locale: string = 'zh-TW', i18n?: any): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Use i18n keys for relative time
  if (i18n) {
    if (diffMins < 1) {
      return i18n.t('history.justNow');
    } else if (diffMins < 60) {
      return i18n.t('history.minutesAgo', { minutes: diffMins });
    } else if (diffHours < 24) {
      return i18n.t('history.hoursAgo', { hours: diffHours });
    } else if (diffDays < 7) {
      return i18n.t('history.daysAgo', { days: diffDays });
    }
  }

  // Fallback to locale-aware formatting (should rarely be used as i18n should always be provided)
  if (diffMins < 1) {
    return locale === 'zh-TW' ? '剛剛' : 'just now'; // Fallback only, should use i18n.t('history.justNow')
  } else if (diffMins < 60) {
    return locale === 'zh-TW' ? `${diffMins} 分鐘前` : `${diffMins} min ago`; // Fallback only, should use i18n.t('history.minutesAgo')
  } else if (diffHours < 24) {
    return locale === 'zh-TW' ? `${diffHours} 小時前` : `${diffHours} hr ago`; // Fallback only, should use i18n.t('history.hoursAgo')
  } else if (diffDays < 7) {
    return locale === 'zh-TW' ? `${diffDays} 天前` : `${diffDays} days ago`; // Fallback only, should use i18n.t('history.daysAgo')
  } else {
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }
}

/**
 * Format time for display
 */
function formatTime(dateString: string, locale: string = 'zh-TW'): string {
  const date = new Date(dateString);
  return date.toLocaleString(locale, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).split(', ')[1] || date.toLocaleTimeString(locale, {hour: '2-digit', minute:'2-digit', hour12: false});
}
