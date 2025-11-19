/**
 * Draft Domain Logic
 *
 * Pure functions for bottle draft management.
 */

export interface BottleDraft {
  id: number;
  telegram_id: string;
  content: string;
  target_gender: 'male' | 'female' | 'any';
  target_mbti_filter?: string; // JSON array
  target_zodiac_filter?: string; // JSON array
  created_at: string;
  expires_at: string;
}

// Draft expiration time (24 hours)
export const DRAFT_EXPIRATION_HOURS = 24;

/**
 * Calculate draft expiration time
 */
export function calculateDraftExpiration(): Date {
  const now = new Date();
  return new Date(now.getTime() + DRAFT_EXPIRATION_HOURS * 60 * 60 * 1000);
}

/**
 * Check if draft is expired
 */
export function isDraftExpired(draft: BottleDraft): boolean {
  return new Date(draft.expires_at) < new Date();
}

/**
 * Get draft age in hours
 */
export function getDraftAgeHours(draft: BottleDraft): number {
  const now = new Date();
  const created = new Date(draft.created_at);
  return (now.getTime() - created.getTime()) / (1000 * 60 * 60);
}

/**
 * Format draft age for display
 */
export function formatDraftAge(draft: BottleDraft, language: string = 'zh-TW'): string {
  const hours = getDraftAgeHours(draft);

  if (language === 'zh-TW') {
    if (hours < 1) {
      return '剛剛';
    } else if (hours < 24) {
      return `${Math.floor(hours)} 小時前`;
    } else {
      return `${Math.floor(hours / 24)} 天前`;
    }
  } else {
    // English
    if (hours < 1) {
      return 'Just now';
    } else if (hours < 24) {
      return `${Math.floor(hours)} hours ago`;
    } else {
      return `${Math.floor(hours / 24)} days ago`;
    }
  }
}

/**
 * Get draft preview (first 50 characters)
 */
export function getDraftPreview(content: string): string {
  if (content.length <= 50) {
    return content;
  }
  return content.substring(0, 50) + '...';
}
