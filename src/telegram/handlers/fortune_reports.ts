import type { Env, TelegramCallbackQuery, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { createI18n } from '~/i18n';
import { findUserByTelegramId } from '~/db/queries/users';
import { FortuneType, FortuneHistory } from '~/types';
import { FortuneService } from '~/services/fortune';

const PAGE_SIZE = 5;

type ReportFilter = 'all' | 'match' | 'fortune' | 'daily';

/**
 * Show My Reports History
 */
export async function handleMyReports(
  chatId: number,
  userId: string,
  env: Env,
  filter: ReportFilter = 'all',
  page = 0
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  
  const user = await findUserByTelegramId(db, userId);
  const i18n = createI18n(user?.language_pref || 'zh-TW');

  // Build Query
  let query = `SELECT id, type, target_date, created_at, target_person_name FROM fortune_history WHERE telegram_id = ?`;
  const params: any[] = [userId];

  if (filter === 'match') {
    query += ` AND type IN ('match', 'love_match', 'love_ideal')`;
  } else if (filter === 'fortune') {
    query += ` AND type IN ('ziwei', 'astrology', 'tarot', 'bazi')`;
  } else if (filter === 'daily') {
    query += ` AND type IN ('daily', 'deep')`;
  }
  
  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(PAGE_SIZE + 1, page * PAGE_SIZE);

  const results = await db.d1.prepare(query).bind(...params).all<FortuneHistory>();
  const reports = results.results || [];
  
  const hasNextPage = reports.length > PAGE_SIZE;
  const displayReports = reports.slice(0, PAGE_SIZE);

  // Build Message
  let text = `📜 <b>${i18n.t('fortune.menu.my_reports')}</b>\n\n`;
  
  // Filter Tabs (as Top Buttons)
  const filterRow = [
    { text: (filter === 'all' ? '✅ ' : '') + i18n.t('fortune.reports.tab_all'), callback_data: 'reports_filter:all' },
    { text: (filter === 'match' ? '✅ ' : '') + i18n.t('fortune.reports.tab_match'), callback_data: 'reports_filter:match' },
    { text: (filter === 'fortune' ? '✅ ' : '') + i18n.t('fortune.reports.tab_fortune'), callback_data: 'reports_filter:fortune' },
  ];
  // Split filter row if too long? 3 items is okay.

  const buttons: any[][] = [filterRow];

  // List Items
  if (displayReports.length === 0) {
    text += i18n.t('fortune.reports.empty');
  } else {
    for (const report of displayReports) {
      let icon = '📄';
      switch (report.type) {
        case 'daily': icon = '📅'; break;
        case 'deep': icon = '🗓️'; break;
        case 'match': 
        case 'love_match': icon = '🧬'; break;
        case 'ziwei': icon = '🔮'; break;
        case 'tarot': icon = '🃏'; break;
        case 'astrology': icon = '🌠'; break;
        case 'bazi': icon = '📜'; break;
      }
          
      const dateStr = report.target_date || report.created_at.split('T')[0];
      // Determine title (needs i18n logic or stored title)
      // For now, use type + date
      const typeName = i18n.t(('fortune.type.' + report.type) as any) || report.type;
      const target = report.target_person_name ? ` (${report.target_person_name})` : '';
          
      buttons.push([{
        text: `${icon} ${typeName}${target} - ${dateStr}`,
        callback_data: `report_detail:${report.id}`
      }]);
    }
  }

  // Pagination
  const paginationRow: any[] = [];
  if (page > 0) {
    paginationRow.push({ text: '⬅️', callback_data: `reports_page:${filter}:${page - 1}` });
  }
  paginationRow.push({ text: `${page + 1}`, callback_data: 'noop' }); // Current page indicator
  if (hasNextPage) {
    paginationRow.push({ text: '➡️', callback_data: `reports_page:${filter}:${page + 1}` });
  }
  buttons.push(paginationRow);
  
  buttons.push([{ text: i18n.t('fortune.backToMenu'), callback_data: 'menu_fortune' }]);
  buttons.push([{ text: i18n.t('common.back3'), callback_data: 'return_to_menu' }]);

  text = text.replace('<b>', '').replace('</b>', '');

  await telegram.sendMessageWithButtons(chatId, text, buttons);
}

/**
 * Show Report Detail
 */
export async function handleReportDetail(
  chatId: number, 
  reportId: number, 
  env: Env,
  page: number = 0
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
    
  // Fetch Report
  const report = await db.d1.prepare('SELECT * FROM fortune_history WHERE id = ?').bind(reportId).first<FortuneHistory>();
    
  if (!report) {
    // Error
    return;
  }

  const user = await findUserByTelegramId(db, report.telegram_id);
  const i18n = createI18n(user?.language_pref || 'zh-TW');

  // Check Expiry (3 Years)
  const createdAt = new Date(report.created_at);
  const now = new Date();
  const ageDays = (now.getTime() - createdAt.getTime()) / (1000 * 3600 * 24);
  const isExpired = ageDays > 365 * 3;

  // Check Snapshot Integrity
  let integrityWarning = '';
  if (report.profile_snapshot) {
    try {
      const snapshot = JSON.parse(report.profile_snapshot);
      if (user && (
        (snapshot.user.mbti && user.mbti_result !== snapshot.user.mbti) ||
                (snapshot.user.blood_type && user.blood_type !== snapshot.user.blood_type)
      )) {
        integrityWarning = `⚠️ ${i18n.t('fortune.reports.integrity_warning')}`;
      }
    } catch (e) {
      console.error('Snapshot parse error', e);
    }
  }

  let header = `📄 <b>${i18n.t(('fortune.type.' + report.type) as any)}</b>\n`;
  header += `📅 ${i18n.t('common.date')}: ${report.target_date}\n`;
    
  if (isExpired) {
    header += `⚠️ ${i18n.t('fortune.reports.expired')}\n`;
  }
  if (integrityWarning) {
    header += `${integrityWarning}\n`;
  }
    
  // --- Content Pagination Logic ---
  const MAX_CHARS = 3500;
  const content = report.content;
  const totalPages = Math.ceil(content.length / MAX_CHARS);
  const currentPage = Math.max(0, Math.min(page, totalPages - 1));
  
  const start = currentPage * MAX_CHARS;
  const end = Math.min(start + MAX_CHARS, content.length);
  const pageContent = content.substring(start, end);

  let fullText = `${header}\n${pageContent}`.replace('<b>', '').replace('</b>', '');
  
  if (totalPages > 1) {
    fullText += `\n\n${i18n.t('fortune.reports.page_indicator', { current: currentPage + 1, total: totalPages })}`;
  }

  const buttons: any[][] = [];
  
  // Pagination Buttons
  if (totalPages > 1) {
    const navRow = [];
    if (currentPage > 0) {
      navRow.push({ text: '⬅️', callback_data: `report_read:${reportId}:${currentPage - 1}` });
    } else {
      navRow.push({ text: '⬛', callback_data: 'noop' }); // Spacer
    }
    
    navRow.push({ text: `${currentPage + 1}/${totalPages}`, callback_data: 'noop' });
    
    if (currentPage < totalPages - 1) {
      navRow.push({ text: '➡️', callback_data: `report_read:${reportId}:${currentPage + 1}` });
    } else {
      navRow.push({ text: '⬛', callback_data: 'noop' }); // Spacer
    }
    buttons.push(navRow);
  }
    
  if (integrityWarning || isExpired) {
    // Add Regenerate Button
    buttons.push([{ text: i18n.t('fortune.reports.regenerate'), callback_data: `report_regenerate:${reportId}` }]);
  }

  buttons.push([{ text: i18n.t('common.delete'), callback_data: `report_delete:${reportId}` }]);
  buttons.push([{ text: i18n.t('common.back'), callback_data: `reports_filter:all` }]);

  // Use editMessageText if it's a pagination callback, otherwise sendMessage?
  // Or always sendMessageWithButtons which uses existing message or sends new? 
  // createTelegramService usually sends new if not told to edit. 
  // Let's assume we want to render fresh or edit.
  // Since we don't have message_id passed in easily, we might just send a new message for detail view usually.
  // BUT for pagination, we MUST edit.
  // The caller needs to decide. 
  // Since handleReportDetail is called by 'report_detail:' callback (viewing from list) -> Send/Edit?
  // Ideally Edit. 
  // Let's see how `handleMyReports` does it. It calls `sendMessageWithButtons`.
  // Wait, `sendMessageWithButtons` implementation in `telegram.ts` usually sends new.
  // If we want to support "Previous/Next" effectively, we should try to edit if possible.
  // But `createTelegramService` abstraction is simple.
  // Let's rely on standard behavior: For detail view, it sends a new message (or edits if we pass message_id).
  // We don't have message_id here. 
  // The user asked for pagination buttons. If they click Next, it triggers a callback.
  // That callback will have a message_id.
  // We should modify `handleReportDetail` signature to accept optional `messageIdToEdit`.
  
  await telegram.sendMessageWithButtons(chatId, fullText, buttons);
}

export async function handleRegenerateReport(
  chatId: number, 
  reportId: number, 
  userId: string,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const user = await findUserByTelegramId(db, userId);
  const i18n = createI18n(user?.language_pref || 'zh-TW');
  const service = new FortuneService(env, db.d1);

  await telegram.sendMessage(chatId, i18n.t('common.generating'));

  try {
    // 1. Fetch old report to get Type and Target context
    const oldReport = await db.d1.prepare('SELECT * FROM fortune_history WHERE id = ?').bind(reportId).first<FortuneHistory>();
    if (!oldReport) {
      await telegram.sendMessage(chatId, i18n.t('errors.systemError'));
      return;
    }

    // 2. Determine Inputs
    const userProfile = await service.getProfiles(userId).then(ps => ps.find(p => p.is_default));
    if (!userProfile) {
      await telegram.sendMessage(chatId, 'Profile missing');
      return;
    }

    let targetProfile;
    const targetUserId = oldReport.target_user_id;

    if (targetUserId) {
      // If it was a match with a real user
      targetProfile = await service.getProfiles(targetUserId).then(ps => ps.find(p => p.is_default));
    } else if (oldReport.target_person_name) {
      // If it was a match with Celebrity or manual input? 
      // For celebrity, targetProfile might be constructed on the fly.
      // For now, only support regeneration for User Matches where we have ID.
      // If target_user_id is null but it's a match type, we might not be able to regenerate easily without asking inputs again.
      if (oldReport.type === 'love_match' || oldReport.type === 'match') {
        await telegram.sendMessage(chatId, 'Cannot regenerate this report type (missing target link).');
        return;
      }
    }

    // 3. Generate New Fortune
    const today = new Date().toISOString().split('T')[0];
    if (!user) return;

    const newReport = await service.generateFortune(
      user,
      userProfile,
        oldReport.type as FortuneType,
        today,
        targetProfile,
        targetUserId
    );

    // 4. Show Result
    const text = `🔄 ${i18n.t('fortune.reports.regenerated')}\n\n` + 
                 `📄 ${i18n.t(('fortune.type.' + newReport.type) as any)}\n` + 
                 newReport.content;
    
    await telegram.sendMessage(chatId, text);

    // 5. Back Button
    const buttons = [[{ text: i18n.t('common.back'), callback_data: `report_detail:${newReport.id}` }]];
    await telegram.sendMessageWithButtons(chatId, i18n.t('common.saved_to_history'), buttons);

    // Auto-show the new report detail
    await handleReportDetail(chatId, newReport.id, env);

  } catch (error: any) {
    console.error('[Regenerate] Error:', error);
    let msg = i18n.t('errors.systemError');
    if (error.message === 'QUOTA_EXCEEDED') {
      msg = i18n.t('tasks.quota.insufficient');
    }
    await telegram.sendMessage(chatId, msg);
  }
}

export async function handleDeleteReport(
  chatId: number, 
  reportId: number, 
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
    
  await db.d1.prepare('DELETE FROM fortune_history WHERE id = ?').bind(reportId).run();
    
  // User object for i18n? Or just generic success
  // Need user to get language... assume 'zh-TW' or fetch
  // Quick fetch user from chat context passed down? Or just use chatId to find user
  // We usually have userId available.
  // For now, simpler:
  const { createI18n } = await import('~/i18n');
  const i18n = createI18n('zh-TW'); // Fallback
    
  await telegram.sendMessage(chatId, i18n.t('common.deleted'));
  // We don't know the userId here easily unless we fetch the report first (which we deleted)
  // Or we assume the caller passed it. 
  // To be safe and simple, return to menu or just show deleted confirmation.
  // The previous menu will likely still be there but buttons might be stale.
  // Let's just return to Fortune Menu.
  // We can't easily call handleFortune without a message object.
  // Let's just show a button to go back.
  const buttons = [[{ text: i18n.t('fortune.backToMenu'), callback_data: 'menu_fortune' }]];
  await telegram.sendMessageWithButtons(chatId, i18n.t('fortune.reports.deleted_hint'), buttons);
}
