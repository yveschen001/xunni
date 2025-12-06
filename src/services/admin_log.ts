import type { Env } from '~/types';
import { createTelegramService } from '~/services/telegram';

/**
 * Admin Log Service
 * Sends structured log messages to the centralized Admin Group
 */
export class AdminLogService {
  private telegram: ReturnType<typeof createTelegramService>;
  private adminGroupId: string;
  private cache?: KVNamespace;

  constructor(env: Env) {
    this.telegram = createTelegramService(env);
    this.adminGroupId = env.ADMIN_LOG_GROUP_ID || '';
    this.cache = env.CACHE;
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
      let success = false;
      if (buttons.length > 0) {
        success = await this.telegram.sendMessageWithButtons(this.adminGroupId, message, buttons);
      } else {
        success = await this.telegram.sendMessage(this.adminGroupId, message);
      }

      if (!success) {
        throw new Error(`Failed to send message to admin group ${this.adminGroupId}. Check logs.`);
      }
    } catch (error) {
      console.error('[AdminLogService] Failed to send log:', error);
      throw error; // Rethrow to let caller handle it
    }
  }

  /**
   * Log a raw error with stack trace (Panic Handler)
   * Designed for critical global errors
   */
  async logError(error: unknown, context: string = ''): Promise<void> {
    const errorTitle = `🚨 CRITICAL ERROR: ${context}`;
    let errorMessage = '';
    let stackTrace = '';

    if (error instanceof Error) {
      errorMessage = error.message;
      stackTrace = error.stack || 'No stack trace';
    } else {
      errorMessage = String(error);
      stackTrace = 'Unknown error type';
    }

    // Format for Telegram (truncate if too long)
    const details = `
Error: ${errorMessage}

Stack:
${stackTrace.substring(0, 1000)}...
    `.trim();

    await this.logEvent(errorTitle, details);
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
    const title = '🚨 新的舉報報告';
    const details = `
舉報人: ${data.reporterId}
被舉報人: ${data.suspectId}
原因: ${data.reason}

證據:
${data.evidence.map((e) => `- ${e}`).join('\n')}

🤖 AI 分析:
判決: ${data.aiVerdict}
信心度: ${Math.round(data.aiConfidence * 100)}%

處置: ${data.actionTaken}
    `.trim();

    const buttons = [
      [
        {
          text: '✅ 同意 AI (維持處置)',
          callback_data: `admin_approve:${data.suspectId}`,
        },
        {
          text: '❌ 駁回 AI (撤銷處置)',
          callback_data: `admin_reject:${data.suspectId}`,
        },
      ],
      [
        {
          text: '👮‍♂️ 人工審核',
          callback_data: `admin_review:${data.suspectId}`,
        },
      ],
    ];

    await this.logEvent(title, details, buttons);
  }

  /**
   * Log an appeal
   */
  async logAppeal(data: {
    userId: string;
    banReason: string;
    appealText: string;
    aiRecommendation: string;
    aiConfidence: number;
  }): Promise<void> {
    const title = '📩 新的申訴請求';
    const details = `
用戶ID: ${data.userId}
封鎖原因: ${data.banReason}

申訴內容:
${data.appealText}

🤖 AI 建議:
${data.aiRecommendation}
(信心度: ${Math.round(data.aiConfidence * 100)}%)
    `.trim();

    const buttons = [
      [
        {
          text: '✅ 解除封鎖',
          callback_data: `admin_unban:${data.userId}`,
        },
        {
          text: '❌ 駁回申訴',
          callback_data: `admin_reject_appeal:${data.userId}`,
        },
      ],
    ];

    await this.logEvent(title, details, buttons);
  }
}
