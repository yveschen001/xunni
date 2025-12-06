import type { D1Database } from '@cloudflare/workers-types';
import type { Env } from '~/types';
import { UserPushPreferences, isQuietHours } from '~/domain/user_preferences';
import { UserPreferencesService } from '~/services/user_preferences';
import { NotificationService } from '~/services/notification';
import { createI18n, loadTranslations } from '~/i18n';

export enum PushType {
  THROW_REMINDER = 'throw_reminder',
  CATCH_REMINDER = 'catch_reminder',
  MESSAGE_REMINDER = 'message_reminder',
  ONBOARDING_REMINDER = 'onboarding_reminder',
  MBTI_SHARE_REMINDER = 'mbti_share_reminder',
}

export enum UserActivityLevel {
  VERY_ACTIVE = 'very_active', // Active within 24h
  ACTIVE = 'active', // Active within 3 days
  MODERATE = 'moderate', // Active within 7 days
  INACTIVE = 'inactive', // Active within 30 days
  DORMANT = 'dormant', // Inactive > 30 days
}

export class PushStrategyService {
  private prefsService: UserPreferencesService;
  private notificationService: NotificationService;

  constructor(
    private db: D1Database,
    private env: Env
  ) {
    this.prefsService = new UserPreferencesService(db);
    this.notificationService = new NotificationService(env, db);
  }

  /**
   * Determine user activity level based on last_active_at
   */
  getUserActivityLevel(lastActiveAt: string | null): UserActivityLevel {
    if (!lastActiveAt) return UserActivityLevel.DORMANT;

    const lastActive = new Date(lastActiveAt).getTime();
    const now = Date.now();
    const diffHours = (now - lastActive) / (1000 * 60 * 60);

    if (diffHours <= 24) return UserActivityLevel.VERY_ACTIVE;
    if (diffHours <= 72) return UserActivityLevel.ACTIVE; // 3 days
    if (diffHours <= 168) return UserActivityLevel.MODERATE; // 7 days
    if (diffHours <= 720) return UserActivityLevel.INACTIVE; // 30 days
    return UserActivityLevel.DORMANT;
  }

  /**
   * Check if we should send a push notification
   */
  async shouldSendPush(
    userId: string,
    type: PushType,
    lastActiveAt: string | null,
    userLanguage: string = 'zh-TW'
  ): Promise<boolean> {
    const prefs = await this.prefsService.getPreferences(userId);
    const now = new Date();

    // 1. Check User Toggle
    if (!this.isTypeEnabled(prefs, type)) {
      return false;
    }

    // 2. Check Quiet Hours
    // Use user's preferred timezone if set, otherwise default to UTC+8 (Taiwan/China)
    // The isQuietHours function now handles timezone parsing from prefs.timezone
    if (this.isInQuietHours(now, prefs)) {
      return false;
    }

    // 3. Check Frequency Limits (Global & Per Type)
    // Global limit: Max 3 pushes per day
    const dailyCount = await this.getDailyPushCount(userId);
    if (dailyCount >= 3) return false;

    // Per type interval limit (e.g. 24h for throw reminder)
    const lastSent = await this.getLastSentTime(userId, type);
    if (lastSent) {
      const hoursSinceLast = (now.getTime() - new Date(lastSent).getTime()) / (1000 * 60 * 60);
      const minInterval = this.getMinIntervalHours(type, this.getUserActivityLevel(lastActiveAt));
      if (hoursSinceLast < minInterval) return false;
    }

    // 4. Activity Level Rules (Don't bug very active users with basic reminders)
    const level = this.getUserActivityLevel(lastActiveAt);
    if (level === UserActivityLevel.VERY_ACTIVE) {
      // Don't remind very active users to throw/catch, they know
      if (type === PushType.THROW_REMINDER || type === PushType.CATCH_REMINDER) return false;
    }
    if (level === UserActivityLevel.DORMANT) {
      // Don't bug dormant users too much (maybe once a month re-engagement campaign is better)
      return false;
    }

    return true;
  }

  /**
   * Execute the push logic
   */
  async sendPush(
    userId: string,
    type: PushType,
    messageKey: string,
    params: any = {},
    language: string = 'zh-TW',
    extra?: any
  ): Promise<boolean> {
    // Load translations from KV before creating I18n instance
    await loadTranslations(this.env, language);
    const i18n = createI18n(language);
    const content = i18n.t(messageKey, params);

    // Use SafeSender
    const result = await this.notificationService.sendText(userId, content, extra);

    // Log the attempt
    await this.logPush(userId, type, content, result.success ? 'sent' : 'failed');

    return result.success;
  }

  // --- Helpers ---

  private isTypeEnabled(prefs: UserPushPreferences, type: PushType): boolean {
    switch (type) {
      case PushType.THROW_REMINDER:
        return prefs.throw_reminder_enabled;
      case PushType.CATCH_REMINDER:
        return prefs.catch_reminder_enabled;
      case PushType.MESSAGE_REMINDER:
        return prefs.message_reminder_enabled;
      case PushType.ONBOARDING_REMINDER:
        return true; // Always enabled for onboarding
      default:
        return true;
    }
  }

  private isInQuietHours(now: Date, prefs: UserPushPreferences): boolean {
    // Determine timezone offset using domain logic
    // Default to +8 (Asia/Taipei) if not set
    return isQuietHours(now, prefs, 8);
  }

  private async getDailyPushCount(userId: string): Promise<number> {
    const result = await this.db
      .prepare(
        `
        SELECT COUNT(*) as count 
        FROM push_notifications 
        WHERE user_id = ? 
          AND sent_at >= datetime('now', '-1 day')
          AND status = 'sent'
    `
      )
      .bind(userId)
      .first<{ count: number }>();
    return result?.count || 0;
  }

  private async getLastSentTime(userId: string, type: PushType): Promise<string | null> {
    const result = await this.db
      .prepare(
        `
        SELECT sent_at 
        FROM push_notifications 
        WHERE user_id = ? AND notification_type = ? AND status = 'sent'
        ORDER BY sent_at DESC LIMIT 1
    `
      )
      .bind(userId, type)
      .first<{ sent_at: string }>();
    return result?.sent_at || null;
  }

  private async logPush(userId: string, type: PushType, content: string, status: string) {
    await this.db
      .prepare(
        `
        INSERT INTO push_notifications (user_id, notification_type, content, status)
        VALUES (?, ?, ?, ?)
    `
      )
      .bind(userId, type, content, status)
      .run();
  }

  private getMinIntervalHours(type: PushType, activity: UserActivityLevel): number {
    // Base intervals
    switch (type) {
      case PushType.THROW_REMINDER:
        return 24; // Once a day
      case PushType.CATCH_REMINDER:
        return 12; // Twice a day
      case PushType.MESSAGE_REMINDER:
        return 72; // Every 3 days (per spec)
      case PushType.ONBOARDING_REMINDER:
        return 24;
      default:
        return 24;
    }
  }
}
