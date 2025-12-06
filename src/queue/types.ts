
import { Env, User, FortuneProfile, FortuneType } from '../types';

export interface FortuneJobPayload {
  userId: string;
  chatId: number;
  userProfile: FortuneProfile;
  targetProfile?: FortuneProfile;
  targetUserId?: string; // For tracking match history
  fortuneType: FortuneType; // 'love_match', 'daily', etc.
  targetDate: string;
  context?: any; // Extra context like relationship_type, cards, etc.
  messageId?: number; // ID of the generating message to edit/delete
  lang: string; // User language for notifications
  skipQuota?: boolean; // Whether to skip quota deduction (if handled upstream)
}

export interface FortuneJobResponse {
  status: 'queued' | 'completed' | 'error';
  message?: string;
  result?: any; // The FortuneHistory object if sync
  jobId?: string;
}

