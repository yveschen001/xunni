import type { Env } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { ContentModerationService } from '~/services/content_moderation';
import { AdminLogService } from '~/services/admin_log';

/**
 * AI Moderation Patrol Cron Job
 * Runs every hour to review pending appeals and high-risk content
 */
export async function runAiModerationPatrol(env: Env): Promise<void> {
  console.log('[AiPatrol] Starting patrol...');

  const db = createDatabaseClient(env.DB);
  const aiService = new ContentModerationService(env);
  const logService = new AdminLogService(env);

  // 1. Review Pending Appeals
  const pendingAppeals = await db.d1
    .prepare(
      `SELECT a.id, a.user_id, a.reason, b.reason as ban_reason 
       FROM appeals a
       LEFT JOIN bans b ON a.ban_id = b.id
       WHERE a.status = 'pending'
       ORDER BY a.created_at ASC
       LIMIT 10`
    )
    .all<{ id: number; user_id: string; reason: string; ban_reason: string }>();

  if (pendingAppeals.results && pendingAppeals.results.length > 0) {
    console.log(`[AiPatrol] Reviewing ${pendingAppeals.results.length} pending appeals...`);

    for (const appeal of pendingAppeals.results) {
      try {
        // AI Analysis
        const result = await aiService.analyzeAppeal({
          user: appeal.user_id,
          banReason: appeal.ban_reason || 'Unknown',
          appealText: appeal.reason,
        });

        // Auto-Decision Logic (High Confidence Only)
        if (result.confidence > 90) {
          if (result.verdict === 'unban') {
            console.log(`[AiPatrol] Auto-approving appeal ${appeal.id}`);

            await logService.logEvent(
              '🤖 **AI Auto-Review Recommendation**',
              `Appeal ID: ${appeal.id}\nUser: \`${appeal.user_id}\`\n\nVerdict: **Unban**\nConfidence: ${result.confidence}%\nReason: ${result.reason}`,
              [
                [
                  {
                    text: '✅ Auto-Approve Now',
                    callback_data: `admin_ops_approve_${appeal.user_id}`,
                  },
                ],
              ]
            );
          } else {
            await logService.logEvent(
              '🤖 **AI Auto-Review Recommendation**',
              `Appeal ID: ${appeal.id}\nUser: \`${appeal.user_id}\`\n\nVerdict: **Keep Banned**\nConfidence: ${result.confidence}%\nReason: ${result.reason}`,
              [
                [
                  {
                    text: '❌ Auto-Reject Now',
                    callback_data: `admin_ops_reject_${appeal.user_id}`,
                  },
                ],
              ]
            );
          }
        }
      } catch (e) {
        console.error(`[AiPatrol] Error reviewing appeal ${appeal.id}:`, e);
      }
    }
  }

  console.log('[AiPatrol] Patrol completed.');
}
