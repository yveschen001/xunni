import type { Env } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { createI18n } from '~/i18n';
import { FilterEngine } from '~/services/filter_engine';
import { NotificationService } from '~/services/notification';
import { parseFilters, formatFilters, BroadcastFilters } from '~/domain/broadcast_filters';

/**
 * Handle /broadcast_filter command
 * Usage: /broadcast_filter gender=female,age=18-25 MessageContent
 */
export async function handleBroadcastFilter(message: any, env: Env) {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);

  // 1. Auth Check (Super Admin Only)
  const userId = message.from.id.toString();
  if (userId !== env.SUPER_ADMIN_USER_ID) {
    return; // Silent ignore
  }

  // Load Admin's language
  const i18n = createI18n(env, 'zh-TW'); // Admin interface defaults to zh-TW
  await i18n.load();

  // 2. Parse Command
  const text = message.text?.replace('/broadcast_filter', '').trim();
  if (!text) {
    await telegram.sendMessage(
      userId,
      '❌ 格式錯誤。\n範例：`/broadcast_filter gender=female,country=TW 測試訊息`'
    );
    return;
  }

  // Split filters and message body
  // Strategy: The first part before the first space is filters, the rest is message
  const firstSpaceIndex = text.indexOf(' ');
  if (firstSpaceIndex === -1) {
    // Check if it's just a dry run check without message (e.g. "/broadcast_filter dry_run=true,gender=male")
    if (text.includes('dry_run')) {
      // Allow execution without message body for dry run stats check
    } else {
      await telegram.sendMessage(userId, '❌ 請輸入廣播內容。');
      return;
    }
  }

  const filterStr = firstSpaceIndex === -1 ? text : text.substring(0, firstSpaceIndex);
  const messageBody =
    firstSpaceIndex === -1 ? '(Dry Run No Content)' : text.substring(firstSpaceIndex + 1).trim();

  if (!messageBody && !filterStr.includes('dry_run')) {
    await telegram.sendMessage(userId, '❌ 廣播內容不能為空。');
    return;
  }

  // 3. Parse Filters & Preview
  const filters = parseFilters(filterStr);
  const filterEngine = new FilterEngine(env.DB);
  const count = await filterEngine.countMatches(filters);

  // === DRY RUN EXIT ===
  if (filters.dry_run) {
    await telegram.sendMessage(
      userId,
      `🔍 [Dry Run] 廣播預覽\n` +
        `🎯 條件：${formatFilters(filters)}\n` +
        `👥 預估人數：${count} 人\n` +
        `📝 內容預覽：${messageBody.substring(0, 50)}${messageBody.length > 50 ? '...' : ''}`
    );
    return;
  }
  // ====================

  if (count === 0) {
    await telegram.sendMessage(
      userId,
      `⚠️ 找不到符合條件的用戶。\n過濾條件：${formatFilters(filters)}`
    );
    return;
  }

  // 4. Confirm & Execute (Simplified: Immediate execution for v1, add confirmation step later if needed)
  // For safety, we limit max broadcast size in this version
  const MAX_BROADCAST_SIZE = 1000;
  if (count > MAX_BROADCAST_SIZE) {
    await telegram.sendMessage(
      userId,
      `⚠️ 目標用戶過多 (${count} 人)，目前限制單次發送 ${MAX_BROADCAST_SIZE} 人。`
    );
    return;
  }

  // 5. Create Broadcast Record
  const result = await db.d1
    .prepare(
      `
    INSERT INTO broadcasts (message, target_type, filters, created_by, status, total_users)
    VALUES (?, 'filter', ?, ?, 'processing', ?)
    RETURNING id
  `
    )
    .bind(messageBody, JSON.stringify(filters), userId, count)
    .first<{ id: number }>();

  const broadcastId = result?.id;

  await telegram.sendMessage(
    userId,
    `🚀 開始發送廣播 #${broadcastId}\n` +
      `🎯 目標：${formatFilters(filters)}\n` +
      `👥 人數：${count} 人`
  );

  // 6. Execute Sending (Async Batch Processing)
  // In a real Worker, this should be offloaded to a Queue.
  // For MVP/Smoke Test, we process inline but with `ctx.waitUntil` if available,
  // or just await it here (might timeout if > 100 users).

  // Fetch IDs
  const userIds = await filterEngine.getMatchingUserIds(filters);
  const sender = new NotificationService(env, db.d1);

  let sent = 0;
  let failed = 0;
  let blocked = 0;

  for (const targetId of userIds) {
    const res = await sender.sendText(targetId, messageBody);
    if (res.success) sent++;
    else {
      failed++;
      if (res.isBlocked) blocked++;
    }

    // Simple rate limit precaution
    if (sent % 30 === 0) await new Promise((r) => setTimeout(r, 1000));
  }

  // 7. Update Record
  await db.d1
    .prepare(
      `
    UPDATE broadcasts 
    SET status = 'completed', 
        sent_count = ?, 
        failed_count = ?, 
        blocked_count = ?, 
        completed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `
    )
    .bind(sent, failed, blocked, broadcastId)
    .run();

  await telegram.sendMessage(
    userId,
    `✅ 廣播 #${broadcastId} 完成！\n` +
      `成功：${sent}\n` +
      `失敗：${failed}\n` +
      `封鎖：${blocked}`
  );
}
