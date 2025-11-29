import type { Env } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { isAdmin } from './admin_ban';
import { handleAdminUnban, handleAdminApprove, handleAdminReject } from './admin_ban';

/**
 * Handle Admin Ops Callbacks (from Admin Log Group)
 * Format: admin_ops_<action>_<targetId>
 */
export async function handleAdminOpsCallback(
  callbackQuery: any,
  action: string,
  targetId: string,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = callbackQuery.message.chat.id;
  const adminId = callbackQuery.from.id.toString();
  const messageId = callbackQuery.message.message_id;

  try {
    // 1. Check if user clicking is admin
    if (!isAdmin(adminId, env)) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ You are not an admin.');
      return;
    }

    // 2. Dispatch action
    switch (action) {
      case 'unban': {
        // Reuse handleAdminUnban logic
        // We need to mock a message object since handleAdminUnban expects it
        await handleAdminUnban(
          {
            chat: { id: chatId },
            from: { id: parseInt(adminId) },
            text: `/admin_unban ${targetId}`,
          } as any,
          env
        );
        await telegram.answerCallbackQuery(callbackQuery.id, '✅ User unbanned.');

        // Update message to show who actioned
        await telegram.editMessageText(
          chatId,
          messageId,
          callbackQuery.message.text + `\n\n✅ **Unbanned by ${callbackQuery.from.first_name}**`
        );
        break;
      }

      case 'approve': {
        // Approve appeal (Unban)
        // Need to find the pending appeal ID for this user first
        const appeal = await db.d1
          .prepare('SELECT id FROM appeals WHERE user_id = ? AND status = "pending"')
          .bind(targetId)
          .first<{ id: number }>();

        if (!appeal) {
          await telegram.answerCallbackQuery(callbackQuery.id, '❌ No pending appeal found.');
          return;
        }

        await handleAdminApprove(
          {
            chat: { id: chatId },
            from: { id: parseInt(adminId) },
            text: `/admin_approve ${appeal.id} Approved via Admin Ops`,
          } as any,
          env
        );
        await telegram.answerCallbackQuery(callbackQuery.id, '✅ Appeal approved.');

        await telegram.editMessageText(
          chatId,
          messageId,
          callbackQuery.message.text + `\n\n✅ **Approved by ${callbackQuery.from.first_name}**`
        );
        break;
      }

      case 'reject': {
        // Reject appeal
        const appealReject = await db.d1
          .prepare('SELECT id FROM appeals WHERE user_id = ? AND status = "pending"')
          .bind(targetId)
          .first<{ id: number }>();

        if (!appealReject) {
          await telegram.answerCallbackQuery(callbackQuery.id, '❌ No pending appeal found.');
          return;
        }

        await handleAdminReject(
          {
            chat: { id: chatId },
            from: { id: parseInt(adminId) },
            text: `/admin_reject ${appealReject.id} Rejected via Admin Ops`,
          } as any,
          env
        );
        await telegram.answerCallbackQuery(callbackQuery.id, '✅ Appeal rejected.');

        await telegram.editMessageText(
          chatId,
          messageId,
          callbackQuery.message.text + `\n\n❌ **Rejected by ${callbackQuery.from.first_name}**`
        );
        break;
      }

      case 'history': {
        // Show history (fetch last 5 bans)
        const bans = await db.d1
          .prepare(
            'SELECT reason, created_at FROM bans WHERE user_id = ? ORDER BY created_at DESC LIMIT 5'
          )
          .bind(targetId)
          .all<{ reason: string; created_at: string }>();
        const historyText =
          bans.results?.map((b) => `- ${b.created_at}: ${b.reason}`).join('\n') || 'No history';

        await telegram.sendMessage(chatId, `📜 **History for ${targetId}**:\n${historyText}`);
        await telegram.answerCallbackQuery(callbackQuery.id);
        break;
      }

      default:
        await telegram.answerCallbackQuery(callbackQuery.id, '❓ Unknown action.');
    }
  } catch (error) {
    console.error('[handleAdminOpsCallback] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '⚠️ Error executing action.');
  }
}
