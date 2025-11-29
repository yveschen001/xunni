import type { Env } from '~/types';
import { createTelegramService } from '~/services/telegram';

/**
 * Admin Log Service
 * Sends structured log messages to the centralized Admin Group
 */
export class AdminLogService {
  private telegram: ReturnType<typeof createTelegramService>;
  private adminGroupId: string;

  constructor(env: Env) {
    this.telegram = createTelegramService(env);
    this.adminGroupId = env.ADMIN_LOG_GROUP_ID || '';
  }

  /**
   * Send a formatted log message to the admin group
   */
  async logEvent(
    title: string,
    details: string,
    buttons: { text: string; callback_data: string }[][] = []
  ): Promise<void> {
    if (!this.adminGroupId) {
      console.warn('[AdminLogService] ADMIN_LOG_GROUP_ID not configured');
      return;
    }

    const message = `
${title}

${details}
`.trim();

    try {
      if (buttons.length > 0) {
        await this.telegram.sendMessageWithButtons(this.adminGroupId, message, buttons);
      } else {
        await this.telegram.sendMessage(this.adminGroupId, message);
      }
    } catch (error) {
      console.error('[AdminLogService] Failed to send log:', error);
    }
  }

  /**
   * Log a new report with AI analysis
   */
  async logReport(data: {
    reporterId: string;
    suspectId: string;
    reason: string;
    evidence: string[];
    aiVerdict: string;
    aiConfidence: number;
    actionTaken: string;
  }): Promise<void> {
    const title = '🚨 **New Report / Incident**';
    const details = `
**Reporter**: \`${data.reporterId}\`
**Suspect**: \`${data.suspectId}\`
**Reason**: ${data.reason}

**📝 Evidence (Context):**
${data.evidence.join('\n')}

**🤖 AI Analysis:**
Verdict: ${data.aiVerdict} (Conf: ${data.aiConfidence}%)
Action: **${data.actionTaken}**
    `.trim();

    const buttons = [
      [
        { text: '🔓 Unban (False Positive)', callback_data: `admin_ops_unban_${data.suspectId}` },
        { text: '📜 History', callback_data: `admin_ops_history_${data.suspectId}` },
      ],
    ];

    await this.logEvent(title, details, buttons);
  }

  /**
   * Log a new appeal
   */
  async logAppeal(data: {
    userId: string;
    banReason: string;
    appealText: string;
    aiRecommendation: string;
    aiConfidence: number;
  }): Promise<void> {
    const title = '📝 **New Appeal Received**';
    const details = `
**User**: \`${data.userId}\`
**Ban Reason**: ${data.banReason}
**Appeal**: "${data.appealText}"

**🤖 AI Recommendation:**
${data.aiRecommendation} (Conf: ${data.aiConfidence}%)
    `.trim();

    const buttons = [
      [
        { text: '✅ Approve (Unban)', callback_data: `admin_ops_approve_${data.userId}` },
        { text: '❌ Reject', callback_data: `admin_ops_reject_${data.userId}` },
      ],
    ];

    await this.logEvent(title, details, buttons);
  }
}
