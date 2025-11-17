/**
 * Admin Ban Management Handler
 * Handles admin commands for ban management
 */

import type { TelegramMessage } from '~/types';
import type { Env } from '~/worker-configuration';
import { createTelegramService } from '~/services/telegram';
import { createDatabaseClient } from '~/db/client';
import { createI18n } from '~/i18n';
import { findUserByTelegramId } from '~/db/queries/users';

// Super Admin (God) - Has all permissions including config management
const SUPER_ADMIN_ID = '396943893';

/**
 * Get regular admin user IDs from environment
 * Format: comma-separated list of Telegram IDs
 * Example: "123456789,987654321"
 * Note: Super admin (396943893) is always included automatically
 */
export function getAdminIds(env: Env): string[] {
  const adminIdsStr = env.ADMIN_USER_IDS || '';
  const regularAdmins = adminIdsStr
    .split(',')
    .map(id => id.trim())
    .filter(id => id.length > 0 && id !== SUPER_ADMIN_ID);
  
  // Always include super admin
  return [SUPER_ADMIN_ID, ...regularAdmins];
}

/**
 * Check if user is super admin (God)
 * Super admin has all permissions including config management
 */
export function isSuperAdmin(telegramId: string): boolean {
  return telegramId === SUPER_ADMIN_ID;
}

/**
 * Check if user is admin (regular admin or super admin)
 * Admins can handle appeals and bans
 */
function isAdmin(telegramId: string, env: Env): boolean {
  const adminIds = getAdminIds(env);
  return adminIds.includes(telegramId);
}

/**
 * Handle /admin_ban command - Ban a user
 * Usage: /admin_ban <user_id> [hours|permanent]
 */
export async function handleAdminBan(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // Check admin permission
    if (!isAdmin(telegramId, env)) {
      await telegram.sendMessage(chatId, '❌ 你沒有權限使用此命令。');
      return;
    }

    // Parse command
    const text = message.text || '';
    const parts = text.split(' ').filter(p => p.length > 0);
    
    if (parts.length < 2) {
      await telegram.sendMessage(
        chatId,
        '❌ 使用方法錯誤\n\n' +
          '**正確格式：**\n' +
          '`/admin_ban <user_id> [hours|permanent]`\n\n' +
          '**示例：**\n' +
          '`/admin_ban 123456789` - 封禁 1 小時\n' +
          '`/admin_ban 123456789 24` - 封禁 24 小時\n' +
          '`/admin_ban 123456789 permanent` - 永久封禁'
      );
      return;
    }

    const targetUserId = parts[1];
    const durationArg = parts[2] || '1';

    // Check if target is admin
    const adminIds = getAdminIds(env);
    if (adminIds.includes(targetUserId)) {
      await telegram.sendMessage(chatId, '❌ 無法封禁管理員帳號。');
      return;
    }

    // Check if user exists
    const targetUser = await findUserByTelegramId(db, targetUserId);
    if (!targetUser) {
      await telegram.sendMessage(chatId, '❌ 用戶不存在。');
      return;
    }

    // Calculate ban duration
    let bannedUntil: string | null = null;
    let durationText: string;

    if (durationArg.toLowerCase() === 'permanent') {
      bannedUntil = null;
      durationText = '永久';
    } else {
      const hours = parseInt(durationArg);
      if (isNaN(hours) || hours <= 0) {
        await telegram.sendMessage(chatId, '❌ 時長必須是正整數或 "permanent"。');
        return;
      }
      const now = new Date();
      bannedUntil = new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
      durationText = `${hours} 小時`;
    }

    // Create ban record
    await db.d1.prepare(`
      INSERT INTO bans (user_id, reason, banned_by, banned_at, banned_until, is_active)
      VALUES (?, ?, ?, datetime('now'), ?, 1)
    `).bind(
      targetUserId,
      `管理員封禁 / Admin ban`,
      telegramId,
      bannedUntil
    ).run();

    // Update user status
    await db.d1.prepare(`
      UPDATE users
      SET is_banned = 1,
          ban_reason = ?,
          banned_at = datetime('now'),
          banned_until = ?,
          ban_count = ban_count + 1
      WHERE telegram_id = ?
    `).bind(
      `管理員封禁 / Admin ban`,
      bannedUntil,
      targetUserId
    ).run();

    // Send notification to banned user
    const i18n = createI18n(targetUser.language_pref || 'zh-TW');
    let banMessage: string;

    if (bannedUntil) {
      const unbanTime = new Date(bannedUntil).toLocaleString(
        targetUser.language_pref === 'en' ? 'en-US' : 'zh-TW',
        {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: targetUser.language_pref === 'en' ? 'UTC' : 'Asia/Taipei',
        }
      );
      banMessage = i18n.t('ban.temporaryBan', {
        unbanTime,
        duration: durationText,
      });
    } else {
      banMessage = i18n.t('ban.permanentBan', {});
    }

    try {
      await telegram.sendMessage(parseInt(targetUserId), banMessage);
    } catch (error) {
      console.error('[handleAdminBan] Failed to notify user:', error);
    }

    // Confirm to admin
    await telegram.sendMessage(
      chatId,
      `✅ **已封禁用戶**\n\n` +
        `用戶 ID：\`${targetUserId}\`\n` +
        `暱稱：${targetUser.nickname || '未設定'}\n` +
        `封禁時長：${durationText}\n` +
        `${bannedUntil ? `解封時間：${new Date(bannedUntil).toLocaleString('zh-TW')}` : ''}\n\n` +
        `💡 用戶可以使用 /appeal 申訴`
    );
  } catch (error) {
    console.error('[handleAdminBan] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤，請稍後再試。');
  }
}

/**
 * Handle /admin_unban command - Unban a user
 * Usage: /admin_unban <user_id>
 */
export async function handleAdminUnban(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // Check admin permission
    if (!isAdmin(telegramId, env)) {
      await telegram.sendMessage(chatId, '❌ 你沒有權限使用此命令。');
      return;
    }

    // Parse command
    const text = message.text || '';
    const parts = text.split(' ').filter(p => p.length > 0);
    
    if (parts.length < 2) {
      await telegram.sendMessage(
        chatId,
        '❌ 使用方法錯誤\n\n' +
          '**正確格式：**\n' +
          '`/admin_unban <user_id>`\n\n' +
          '**示例：**\n' +
          '`/admin_unban 123456789` - 解除封禁'
      );
      return;
    }

    const targetUserId = parts[1];

    // Check if user exists
    const targetUser = await findUserByTelegramId(db, targetUserId);
    if (!targetUser) {
      await telegram.sendMessage(chatId, '❌ 用戶不存在。');
      return;
    }

    // Check if user is banned
    if (!targetUser.is_banned) {
      await telegram.sendMessage(chatId, '❌ 此用戶未被封禁。');
      return;
    }

    // Unban user
    await db.d1.prepare(`
      UPDATE users
      SET is_banned = 0,
          ban_reason = NULL,
          banned_at = NULL,
          banned_until = NULL
      WHERE telegram_id = ?
    `).bind(targetUserId).run();

    // Mark all active bans as inactive
    await db.d1.prepare(`
      UPDATE bans
      SET is_active = 0
      WHERE user_id = ? AND is_active = 1
    `).bind(targetUserId).run();

    // Send notification to unbanned user
    const unbanMessage = targetUser.language_pref === 'en'
      ? '✅ **Ban Lifted**\n\n' +
        'Your account restrictions have been removed by an administrator.\n\n' +
        'You can now use all features normally.\n\n' +
        '💡 Please follow community guidelines to avoid future restrictions.'
      : '✅ **封禁已解除**\n\n' +
        '管理員已解除你的帳號限制。\n\n' +
        '你現在可以正常使用所有功能了。\n\n' +
        '💡 請遵守社群規範，避免再次被封禁。';

    try {
      await telegram.sendMessage(parseInt(targetUserId), unbanMessage);
    } catch (error) {
      console.error('[handleAdminUnban] Failed to notify user:', error);
    }

    // Confirm to admin
    await telegram.sendMessage(
      chatId,
      `✅ **已解除封禁**\n\n` +
        `用戶 ID：\`${targetUserId}\`\n` +
        `暱稱：${targetUser.nickname || '未設定'}\n\n` +
        `💡 用戶已收到解封通知`
    );
  } catch (error) {
    console.error('[handleAdminUnban] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤，請稍後再試。');
  }
}

/**
 * Handle /admin_freeze command - Temporarily freeze a user (alias for ban)
 * Usage: /admin_freeze <user_id> <hours>
 */
export async function handleAdminFreeze(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // Check admin permission
    if (!isAdmin(telegramId, env)) {
      await telegram.sendMessage(chatId, '❌ 你沒有權限使用此命令。');
      return;
    }

    // Parse command
    const text = message.text || '';
    const parts = text.split(' ').filter(p => p.length > 0);
    
    if (parts.length < 3) {
      await telegram.sendMessage(
        chatId,
        '❌ 使用方法錯誤\n\n' +
          '**正確格式：**\n' +
          '`/admin_freeze <user_id> <hours>`\n\n' +
          '**示例：**\n' +
          '`/admin_freeze 123456789 24` - 凍結 24 小時\n' +
          '`/admin_freeze 123456789 168` - 凍結 7 天'
      );
      return;
    }

    const targetUserId = parts[1];
    const hours = parseInt(parts[2]);

    if (isNaN(hours) || hours <= 0) {
      await telegram.sendMessage(chatId, '❌ 時長必須是正整數。');
      return;
    }

    // Check if target is admin
    const adminIds = getAdminIds(env);
    if (adminIds.includes(targetUserId)) {
      await telegram.sendMessage(chatId, '❌ 無法凍結管理員帳號。');
      return;
    }

    // Check if user exists
    const targetUser = await findUserByTelegramId(db, targetUserId);
    if (!targetUser) {
      await telegram.sendMessage(chatId, '❌ 用戶不存在。');
      return;
    }

    // Calculate freeze duration
    const now = new Date();
    const frozenUntil = new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
    const durationText = hours >= 24 
      ? `${Math.floor(hours / 24)} 天 ${hours % 24} 小時`
      : `${hours} 小時`;

    // Create ban record
    await db.d1.prepare(`
      INSERT INTO bans (user_id, reason, banned_by, banned_at, banned_until, is_active)
      VALUES (?, ?, ?, datetime('now'), ?, 1)
    `).bind(
      targetUserId,
      `管理員凍結 / Admin freeze`,
      telegramId,
      frozenUntil
    ).run();

    // Update user status
    await db.d1.prepare(`
      UPDATE users
      SET is_banned = 1,
          ban_reason = ?,
          banned_at = datetime('now'),
          banned_until = ?,
          ban_count = ban_count + 1
      WHERE telegram_id = ?
    `).bind(
      `管理員凍結 / Admin freeze`,
      frozenUntil,
      targetUserId
    ).run();

    // Send notification to frozen user
    const i18n = createI18n(targetUser.language_pref || 'zh-TW');
    const unbanTime = new Date(frozenUntil).toLocaleString(
      targetUser.language_pref === 'en' ? 'en-US' : 'zh-TW',
      {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: targetUser.language_pref === 'en' ? 'UTC' : 'Asia/Taipei',
      }
    );
    const freezeMessage = i18n.t('ban.temporaryBan', {
      unbanTime,
      duration: durationText,
    });

    try {
      await telegram.sendMessage(parseInt(targetUserId), freezeMessage);
    } catch (error) {
      console.error('[handleAdminFreeze] Failed to notify user:', error);
    }

    // Confirm to admin
    await telegram.sendMessage(
      chatId,
      `❄️ **已凍結用戶**\n\n` +
        `用戶 ID：\`${targetUserId}\`\n` +
        `暱稱：${targetUser.nickname || '未設定'}\n` +
        `凍結時長：${durationText}\n` +
        `解凍時間：${new Date(frozenUntil).toLocaleString('zh-TW')}\n\n` +
        `💡 用戶可以使用 /appeal 申訴`
    );
  } catch (error) {
    console.error('[handleAdminFreeze] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤，請稍後再試。');
  }
}

/**
 * Handle /admin_list command - List all admins (Super Admin only)
 */
export async function handleAdminList(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // Check super admin permission
    if (!isSuperAdmin(telegramId)) {
      await telegram.sendMessage(chatId, '❌ 只有超級管理員可以使用此命令。');
      return;
    }

    const adminIds = getAdminIds(env);
    
    // Get admin info from database
    const adminInfos = [];
    for (const adminId of adminIds) {
      const admin = await findUserByTelegramId(db, adminId);
      const isSuperAdminFlag = isSuperAdmin(adminId);
      adminInfos.push({
        id: adminId,
        nickname: admin?.nickname || '未註冊',
        username: admin?.username || '-',
        role: isSuperAdminFlag ? '🔱 超級管理員' : '👮 普通管理員'
      });
    }

    let listMessage = `👥 **管理員列表**\n\n`;
    listMessage += `總數：${adminInfos.length} 位\n\n`;
    
    for (const info of adminInfos) {
      listMessage += `${info.role}\n`;
      listMessage += `• ID: \`${info.id}\`\n`;
      listMessage += `• 暱稱: ${info.nickname}\n`;
      listMessage += `• 用戶名: @${info.username}\n\n`;
    }

    listMessage += `━━━━━━━━━━━━━━━━\n`;
    listMessage += `💡 使用 /admin_add 添加管理員\n`;
    listMessage += `💡 使用 /admin_remove 移除管理員`;

    await telegram.sendMessage(chatId, listMessage);
  } catch (error) {
    console.error('[handleAdminList] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤，請稍後再試。');
  }
}

/**
 * Handle /admin_add command - Add an admin (Super Admin only)
 */
export async function handleAdminAdd(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // Check super admin permission
    if (!isSuperAdmin(telegramId)) {
      await telegram.sendMessage(chatId, '❌ 只有超級管理員可以使用此命令。');
      return;
    }

    // Parse command
    const text = message.text || '';
    const parts = text.split(' ').filter(p => p.length > 0);
    
    if (parts.length < 2) {
      await telegram.sendMessage(
        chatId,
        '❌ 使用方法錯誤\n\n' +
          '**正確格式：**\n' +
          '`/admin_add <user_id>`\n\n' +
          '**示例：**\n' +
          '`/admin_add 123456789` - 添加為普通管理員\n\n' +
          '💡 使用 /admin_list 查看當前管理員列表'
      );
      return;
    }

    const targetUserId = parts[1];

    // Check if already super admin
    if (isSuperAdmin(targetUserId)) {
      await telegram.sendMessage(chatId, '❌ 此用戶已經是超級管理員，無需添加。');
      return;
    }

    // Check if already in admin list
    const currentAdminIds = getAdminIds(env);
    if (currentAdminIds.includes(targetUserId)) {
      await telegram.sendMessage(chatId, '❌ 此用戶已經是管理員。');
      return;
    }

    // Check if user exists
    const targetUser = await findUserByTelegramId(db, targetUserId);
    if (!targetUser) {
      await telegram.sendMessage(chatId, '❌ 用戶不存在或未註冊。');
      return;
    }

    await telegram.sendMessage(
      chatId,
      `⚠️ **注意**\n\n` +
        `此命令需要手動修改配置文件。\n\n` +
        `**步驟：**\n` +
        `1. 編輯 \`wrangler.toml\`\n` +
        `2. 找到 \`ADMIN_USER_IDS\` 變數\n` +
        `3. 添加用戶 ID：\`${targetUserId}\`\n` +
        `4. 格式：\`ADMIN_USER_IDS = "ID1,ID2,${targetUserId}"\`\n` +
        `5. 重新部署：\`pnpm deploy:staging\`\n\n` +
        `**用戶資訊：**\n` +
        `• ID: \`${targetUserId}\`\n` +
        `• 暱稱: ${targetUser.nickname || '未設定'}\n` +
        `• 用戶名: @${targetUser.username || '-'}\n\n` +
        `💡 或在 Cloudflare Dashboard 中修改環境變數`
    );
  } catch (error) {
    console.error('[handleAdminAdd] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤，請稍後再試。');
  }
}

/**
 * Handle /admin_remove command - Remove an admin (Super Admin only)
 */
export async function handleAdminRemove(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // Check super admin permission
    if (!isSuperAdmin(telegramId)) {
      await telegram.sendMessage(chatId, '❌ 只有超級管理員可以使用此命令。');
      return;
    }

    // Parse command
    const text = message.text || '';
    const parts = text.split(' ').filter(p => p.length > 0);
    
    if (parts.length < 2) {
      await telegram.sendMessage(
        chatId,
        '❌ 使用方法錯誤\n\n' +
          '**正確格式：**\n' +
          '`/admin_remove <user_id>`\n\n' +
          '**示例：**\n' +
          '`/admin_remove 123456789` - 移除普通管理員\n\n' +
          '💡 使用 /admin_list 查看當前管理員列表'
      );
      return;
    }

    const targetUserId = parts[1];

    // Cannot remove super admin
    if (isSuperAdmin(targetUserId)) {
      await telegram.sendMessage(chatId, '❌ 無法移除超級管理員。');
      return;
    }

    // Check if in admin list
    const currentAdminIds = getAdminIds(env);
    if (!currentAdminIds.includes(targetUserId)) {
      await telegram.sendMessage(chatId, '❌ 此用戶不是管理員。');
      return;
    }

    // Get user info
    const targetUser = await findUserByTelegramId(db, targetUserId);

    await telegram.sendMessage(
      chatId,
      `⚠️ **注意**\n\n` +
        `此命令需要手動修改配置文件。\n\n` +
        `**步驟：**\n` +
        `1. 編輯 \`wrangler.toml\`\n` +
        `2. 找到 \`ADMIN_USER_IDS\` 變數\n` +
        `3. 移除用戶 ID：\`${targetUserId}\`\n` +
        `4. 重新部署：\`pnpm deploy:staging\`\n\n` +
        `**用戶資訊：**\n` +
        `• ID: \`${targetUserId}\`\n` +
        `• 暱稱: ${targetUser?.nickname || '未設定'}\n` +
        `• 用戶名: @${targetUser?.username || '-'}\n\n` +
        `💡 或在 Cloudflare Dashboard 中修改環境變數`
    );
  } catch (error) {
    console.error('[handleAdminRemove] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤，請稍後再試。');
  }
}

/**
 * Handle /admin_bans command - View ban history
 */
export async function handleAdminBans(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id.toString();
  const telegramId = message.from!.id.toString();

  // Check admin permission
  if (!isAdmin(telegramId, env)) {
    await telegram.sendMessage(chatId, '❌ 你沒有權限使用此命令。');
    return;
  }

  // Get user
  const user = await findUserByTelegramId(db, telegramId);
  if (!user) {
    await telegram.sendMessage(chatId, '❌ 用戶不存在。');
    return;
  }

  // Parse command for target user
  const parts = message.text?.split(' ') || [];
  const targetUserId = parts[1];

  if (!targetUserId) {
    // Show recent bans
    const recentBans = await db.d1
      .prepare(
        `SELECT b.id, b.user_id, b.reason, b.ban_start, b.ban_end, b.created_at,
                u.nickname
         FROM bans b
         LEFT JOIN users u ON b.user_id = u.telegram_id
         ORDER BY b.created_at DESC
         LIMIT 10`
      )
      .all<{
        id: number;
        user_id: string;
        reason: string;
        ban_start: string;
        ban_end: string | null;
        created_at: string;
        nickname: string | null;
      }>();

    if (!recentBans.results || recentBans.results.length === 0) {
      await telegram.sendMessage(chatId, '📊 目前沒有封禁記錄');
      return;
    }

    let message = '📊 最近 10 條封禁記錄\n\n';
    for (const ban of recentBans.results) {
      const banStart = new Date(ban.ban_start).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Taipei',
      });

      const banEnd = ban.ban_end
        ? new Date(ban.ban_end).toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Taipei',
          })
        : '永久';

      message +=
        `ID: ${ban.id}\n` +
        `用戶: ${ban.nickname || ban.user_id}\n` +
        `原因: ${ban.reason}\n` +
        `開始: ${banStart}\n` +
        `結束: ${banEnd}\n\n`;
    }

    message += '💡 使用 /admin_bans <user_id> 查看特定用戶的封禁歷史';

    await telegram.sendMessage(chatId, message);
    return;
  }

  // Show specific user's ban history
  const userBans = await db.d1
    .prepare(
      `SELECT b.id, b.reason, b.ban_start, b.ban_end, b.risk_snapshot, b.created_at
       FROM bans b
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`
    )
    .bind(targetUserId)
    .all<{
      id: number;
      reason: string;
      ban_start: string;
      ban_end: string | null;
      risk_snapshot: number;
      created_at: string;
    }>();

  if (!userBans.results || userBans.results.length === 0) {
    await telegram.sendMessage(chatId, `❌ 用戶 ${targetUserId} 沒有封禁記錄`);
    return;
  }

  const targetUser = await findUserByTelegramId(db, targetUserId);
  let responseText = `📊 用戶封禁歷史\n\n`;
  responseText += `用戶: ${targetUser?.nickname || targetUserId}\n`;
  responseText += `總封禁次數: ${userBans.results.length}\n\n`;

  for (const ban of userBans.results) {
    const banStart = new Date(ban.ban_start).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Taipei',
    });

    const banEnd = ban.ban_end
      ? new Date(ban.ban_end).toLocaleString('zh-TW', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Taipei',
        })
      : '永久';

    responseText +=
      `━━━━━━━━━━━━━━━━\n` +
      `ID: ${ban.id}\n` +
      `原因: ${ban.reason}\n` +
      `風險分數: ${ban.risk_snapshot}\n` +
      `開始: ${banStart}\n` +
      `結束: ${banEnd}\n\n`;
  }

  await telegram.sendMessage(chatId, responseText);
}

/**
 * Handle /admin_appeals command - View and manage appeals
 */
export async function handleAdminAppeals(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id.toString();
  const telegramId = message.from!.id.toString();

  // Check admin permission
  if (!isAdmin(telegramId, env)) {
    await telegram.sendMessage(chatId, '❌ 你沒有權限使用此命令。');
    return;
  }

  // Get pending appeals
  const pendingAppeals = await db.d1
    .prepare(
      `SELECT a.id, a.user_id, a.reason, a.created_at,
              u.nickname
       FROM appeals a
       LEFT JOIN users u ON a.user_id = u.telegram_id
       WHERE a.status = 'pending'
       ORDER BY a.created_at ASC
       LIMIT 10`
    )
    .all<{
      id: number;
      user_id: string;
      reason: string;
      created_at: string;
      nickname: string | null;
    }>();

  if (!pendingAppeals.results || pendingAppeals.results.length === 0) {
    await telegram.sendMessage(chatId, '✅ 目前沒有待審核的申訴');
    return;
  }

  let responseText = '📋 待審核申訴列表\n\n';
  for (const appeal of pendingAppeals.results) {
    const createdAt = new Date(appeal.created_at).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Taipei',
    });

    responseText +=
      `━━━━━━━━━━━━━━━━\n` +
      `申訴 ID: ${appeal.id}\n` +
      `用戶: ${appeal.nickname || appeal.user_id}\n` +
      `理由: ${appeal.reason}\n` +
      `提交時間: ${createdAt}\n\n`;
  }

  responseText +=
    '💡 使用以下命令審核申訴：\n' +
    '/admin_approve <appeal_id> [備註]\n' +
    '/admin_reject <appeal_id> [備註]';

  await telegram.sendMessage(chatId, responseText);
}

/**
 * Handle /admin_approve command - Approve an appeal
 */
export async function handleAdminApprove(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id.toString();
  const telegramId = message.from!.id.toString();

  // Check admin permission
  if (!isAdmin(telegramId, env)) {
    await telegram.sendMessage(chatId, '❌ 你沒有權限使用此命令。');
    return;
  }

  // Parse command
  const parts = message.text?.split(' ') || [];
  const appealId = parts[1];
  const notes = parts.slice(2).join(' ') || '申訴已批准';

  if (!appealId) {
    await telegram.sendMessage(chatId, '❌ 請提供申訴 ID\n\n用法: /admin_approve <appeal_id> [備註]');
    return;
  }

  // Get appeal
  const appeal = await db.d1
    .prepare('SELECT user_id, status FROM appeals WHERE id = ?')
    .bind(appealId)
    .first<{ user_id: string; status: string }>();

  if (!appeal) {
    await telegram.sendMessage(chatId, `❌ 找不到申訴 ID: ${appealId}`);
    return;
  }

  if (appeal.status !== 'pending') {
    await telegram.sendMessage(chatId, `❌ 申訴 ${appealId} 已經被審核過了`);
    return;
  }

  // Update appeal
  const now = new Date().toISOString();
  await db.d1
    .prepare(
      `UPDATE appeals 
       SET status = 'approved', 
           reviewed_by = ?, 
           review_notes = ?, 
           reviewed_at = ?
       WHERE id = ?`
    )
    .bind(telegramId, notes, now, appealId)
    .run();

  // Unban user
  await db.d1
    .prepare(
      `UPDATE users 
       SET is_banned = 0, 
           ban_reason = NULL, 
           banned_at = NULL, 
           banned_until = NULL
       WHERE telegram_id = ?`
    )
    .bind(appeal.user_id)
    .run();

  // Notify user
  const user = await findUserByTelegramId(db, appeal.user_id);
  if (user) {
    const i18n = createI18n(user.language_pref || 'zh-TW');
    try {
      await telegram.sendMessage(appeal.user_id, i18n.t('appeal.approved', {}));
    } catch (error) {
      console.error('[handleAdminApprove] Failed to notify user:', error);
    }
  }

  await telegram.sendMessage(chatId, `✅ 申訴 ${appealId} 已批准，用戶已解封`);
}

/**
 * Handle /admin_reject command - Reject an appeal
 */
export async function handleAdminReject(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id.toString();
  const telegramId = message.from!.id.toString();

  // Check admin permission
  if (!isAdmin(telegramId, env)) {
    await telegram.sendMessage(chatId, '❌ 你沒有權限使用此命令。');
    return;
  }

  // Parse command
  const parts = message.text?.split(' ') || [];
  const appealId = parts[1];
  const notes = parts.slice(2).join(' ') || '申訴被拒絕';

  if (!appealId) {
    await telegram.sendMessage(chatId, '❌ 請提供申訴 ID\n\n用法: /admin_reject <appeal_id> [備註]');
    return;
  }

  // Get appeal
  const appeal = await db.d1
    .prepare('SELECT user_id, status FROM appeals WHERE id = ?')
    .bind(appealId)
    .first<{ user_id: string; status: string }>();

  if (!appeal) {
    await telegram.sendMessage(chatId, `❌ 找不到申訴 ID: ${appealId}`);
    return;
  }

  if (appeal.status !== 'pending') {
    await telegram.sendMessage(chatId, `❌ 申訴 ${appealId} 已經被審核過了`);
    return;
  }

  // Update appeal
  const now = new Date().toISOString();
  await db.d1
    .prepare(
      `UPDATE appeals 
       SET status = 'rejected', 
           reviewed_by = ?, 
           review_notes = ?, 
           reviewed_at = ?
       WHERE id = ?`
    )
    .bind(telegramId, notes, now, appealId)
    .run();

  // Notify user
  const user = await findUserByTelegramId(db, appeal.user_id);
  if (user) {
    const i18n = createI18n(user.language_pref || 'zh-TW');
    try {
      await telegram.sendMessage(appeal.user_id, i18n.t('appeal.rejected', { notes }));
    } catch (error) {
      console.error('[handleAdminReject] Failed to notify user:', error);
    }
  }

  await telegram.sendMessage(chatId, `✅ 申訴 ${appealId} 已拒絕`);
}

