/**
 * Session Domain Logic
 *
 * Pure functions for session management, timeout, and state handling.
 */

export type SessionType =
  | 'onboarding'
  | 'throw_bottle'
  | 'catch_bottle'
  | 'conversation'
  | 'edit_profile'
  | 'admin_ad_wizard'
  | 'admin_task_wizard'
  | 'fortune_wizard';

export interface UserSession {
  id: number;
  telegram_id: string;
  session_type: SessionType;
  session_data?: string; // JSON string
  last_activity_at: string;
  expires_at: string;
  created_at: string;
}

export interface SessionData {
  step?: string;
  data?: Record<string, unknown>;
}

// Session timeout durations (in minutes)
export const SESSION_TIMEOUT = {
  onboarding: 30, // 30 minutes for registration
  throw_bottle: 10, // 10 minutes for throwing bottle
  catch_bottle: 5, // 5 minutes for catching bottle
  conversation: 60, // 60 minutes for active conversation
  edit_profile: 10, // 10 minutes for editing profile
  admin_ad_wizard: 30, // 30 minutes for admin ad wizard
  admin_task_wizard: 30, // 30 minutes for admin task wizard
  fortune_wizard: 15, // 15 minutes for fortune telling wizard
} as const;

/**
 * Calculate session expiration time
 */
export function calculateSessionExpiration(sessionType: SessionType): Date {
  const now = new Date();
  const timeoutMinutes = SESSION_TIMEOUT[sessionType];
  return new Date(now.getTime() + timeoutMinutes * 60 * 1000);
}

/**
 * Check if session is expired
 */
export function isSessionExpired(session: UserSession): boolean {
  return new Date(session.expires_at) < new Date();
}

/**
 * Check if session is about to expire (within 2 minutes)
 */
export function isSessionAboutToExpire(session: UserSession): boolean {
  const now = new Date();
  const expiresAt = new Date(session.expires_at);
  const twoMinutes = 2 * 60 * 1000;
  return expiresAt.getTime() - now.getTime() < twoMinutes;
}

/**
 * Parse session data from JSON string
 */
export function parseSessionData(session: UserSession): SessionData {
  if (!session.session_data) {
    return {};
  }

  try {
    return JSON.parse(session.session_data);
  } catch (error) {
    console.error('[parseSessionData] Failed to parse session data:', error);
    return {};
  }
}

/**
 * Serialize session data to JSON string
 */
export function serializeSessionData(data: SessionData): string {
  return JSON.stringify(data);
}

/**
 * Get user-friendly timeout message
 */
import type { createI18n } from '~/i18n';

export function getTimeoutMessage(
  sessionType: SessionType,
  i18n?: ReturnType<typeof createI18n>
): string {
  const messages: Record<SessionType, string> = {
    onboarding:
      i18n?.t('session.timeoutOnboarding') || '⏰ 註冊流程已超時\n\n請使用 /start 重新開始註冊。',
    throw_bottle:
      i18n?.t('session.timeoutThrowBottle') || '⏰ 丟瓶流程已超時\n\n請使用 /throw 重新開始。',
    catch_bottle:
      i18n?.t('session.timeoutCatchBottle') || '⏰ 撿瓶流程已超時\n\n請使用 /catch 重新開始。',
    conversation:
      i18n?.t('session.timeoutConversation') ||
      '⏰ 對話已超時\n\n對方可能已離開。使用 /catch 撿新的瓶子吧！',
    edit_profile:
      i18n?.t('session.timeoutEditProfile') || '⏰ 編輯資料流程已超時\n\n請重新開始編輯。',
    admin_ad_wizard: '⏰ 廣告管理流程已超時\n\n請使用 /admin_ads 重新開始。',
    admin_task_wizard: '⏰ 任務管理流程已超時\n\n請使用 /admin_tasks 重新開始。',
    fortune_wizard: i18n?.t('session.timeoutFortune') || '⏰ 算命流程已超時\n\n請使用 /fortune 重新開始。',
  };

  return messages[sessionType];
}

/**
 * Get session type display name
 */
export function getSessionTypeName(
  sessionType: SessionType,
  i18n?: ReturnType<typeof createI18n>
): string {
  const names: Record<SessionType, string> = {
    onboarding: i18n?.t('session.typeOnboarding') || '註冊流程',
    throw_bottle: i18n?.t('session.typeThrowBottle') || '丟瓶流程',
    catch_bottle: i18n?.t('session.typeCatchBottle') || '撿瓶流程',
    conversation: i18n?.t('session.typeConversation') || '對話',
    edit_profile: i18n?.t('session.typeEditProfile') || '編輯資料',
    admin_ad_wizard: '廣告管理',
    admin_task_wizard: '任務管理',
    fortune_wizard: '算命流程',
  };

  return names[sessionType];
}
