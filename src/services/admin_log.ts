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

  /**
   * Log an error with Smart Alerting (Aggregation & Throttling)
   */
  async logError(error: unknown, context: Record<string, any> = {}): Promise<void> {
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    const errorMessage = error instanceof Error ? error.message : String(error);
    const fingerprint = await this.generateFingerprint(errorName, errorMessage);

    // Track daily total errors (fire and forget)
    this.incrementDailyErrorStats().catch((e) => console.error('Failed to increment stats:', e));

    // If no cache, log directly (dev/fallback)
    if (!this.cache) {
      console.warn('[AdminLogService] No CACHE binding, skipping throttle.');
      await this.sendErrorAlert(errorName, errorMessage, context, 1);
      return;
    }

    const key = `alert:${fingerprint}`;
    const now = Date.now();
    const THROTTLE_WINDOW = 300 * 1000; // 5 minutes

    try {
      const cached = await this.cache.get<{
        first_seen: number;
        last_sent: number;
        count: number;
      }>(key, 'json');

      if (cached) {
        // Increment count
        cached.count += 1;

        // Check if we should send update
        if (now - cached.last_sent > THROTTLE_WINDOW) {
          // Window passed, send update with accumulated count
          await this.sendErrorAlert(errorName, errorMessage, context, cached.count);
          cached.last_sent = now;
          cached.count = 0; // Reset count (will be 0, effectively just sent report)
          // Ideally we want to count distinct occurrences.
          // If we report "Occurred 5 times", then we start fresh.
        }

        // Update cache
        await this.cache.put(key, JSON.stringify(cached), { expirationTtl: 3600 }); // Keep for 1 hour
      } else {
        // First time
        const data = {
          first_seen: now,
          last_sent: now,
          count: 1,
        };
        await this.sendErrorAlert(errorName, errorMessage, context, 1);
        await this.cache.put(key, JSON.stringify(data), { expirationTtl: 3600 });
      }
    } catch (err) {
      console.error('[AdminLogService] Cache error:', err);
      // Fallback to send
      await this.sendErrorAlert(errorName, errorMessage, context, 1);
    }
  }

  private async sendErrorAlert(
    name: string,
    message: string,
    context: Record<string, any>,
    count: number
  ) {
    const title = `🚨 **System Error**${count > 1 ? ` (x${count})` : ''}`;
    const contextStr = Object.entries(context)
      .map(([k, v]) => `• ${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join('\n');
    const details = `
**Error**: \`${name}\`
**Message**: ${message}
${contextStr ? `\n**Context**:\n${contextStr}` : ''}
`.trim();

    await this.logEvent(title, details);
  }

  private async generateFingerprint(name: string, message: string): Promise<string> {
    const data = new TextEncoder().encode(name + message);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .substring(0, 8);
  }

  private async incrementDailyErrorStats() {
    if (!this.cache) return;
    const today = new Date().toISOString().split('T')[0];
    const key = `stats:errors:${today}`;
    // Basic read-modify-write
    const current = await this.cache.get(key);
    const val = current ? parseInt(current) : 0;
    await this.cache.put(key, (val + 1).toString(), { expirationTtl: 86400 * 3 }); // Keep for 3 days
  }
}
