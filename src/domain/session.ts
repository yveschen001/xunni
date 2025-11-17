/**
 * Session Domain Logic
 * 
 * Pure functions for session management, timeout, and state handling.
 */

export type SessionType = 'onboarding' | 'throw_bottle' | 'catch_bottle' | 'conversation' | 'edit_profile';

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
export function getTimeoutMessage(sessionType: SessionType, language: string = 'zh-TW'): string {
  const messages: Record<SessionType, Record<string, string>> = {
    onboarding: {
      'zh-TW': '⏰ 註冊流程已超時\n\n請使用 /start 重新開始註冊。',
      'en': '⏰ Registration timeout\n\nPlease use /start to restart.',
    },
    throw_bottle: {
      'zh-TW': '⏰ 丟瓶流程已超時\n\n請使用 /throw 重新開始。',
      'en': '⏰ Throw bottle timeout\n\nPlease use /throw to restart.',
    },
    catch_bottle: {
      'zh-TW': '⏰ 撿瓶流程已超時\n\n請使用 /catch 重新開始。',
      'en': '⏰ Catch bottle timeout\n\nPlease use /catch to restart.',
    },
    conversation: {
      'zh-TW': '⏰ 對話已超時\n\n對方可能已離開。使用 /catch 撿新的瓶子吧！',
      'en': '⏰ Conversation timeout\n\nThe other person may have left. Use /catch to find a new bottle!',
    },
  };
  
  return messages[sessionType][language] || messages[sessionType]['zh-TW'];
}

/**
 * Get session type display name
 */
export function getSessionTypeName(sessionType: SessionType, language: string = 'zh-TW'): string {
  const names: Record<SessionType, Record<string, string>> = {
    onboarding: {
      'zh-TW': '註冊流程',
      'en': 'Registration',
    },
    throw_bottle: {
      'zh-TW': '丟瓶流程',
      'en': 'Throw Bottle',
    },
    catch_bottle: {
      'zh-TW': '撿瓶流程',
      'en': 'Catch Bottle',
    },
    conversation: {
      'zh-TW': '對話',
      'en': 'Conversation',
    },
  };
  
  return names[sessionType][language] || names[sessionType]['zh-TW'];
}

