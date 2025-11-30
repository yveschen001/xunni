export type MatchRequestStatus = 'pending' | 'accepted' | 'rejected' | 'expired';
export type RelationshipType = 'love' | 'family' | 'friend' | 'work';

export interface MatchRequest {
  id: string;
  requester_id: string;
  target_id: string;
  status: MatchRequestStatus;
  relationship_type: RelationshipType;
  family_role?: string;
  rejection_count: number;
  last_rejected_at?: string;
  created_at: string;
  expires_at: string;
}

export interface UserBlocklist {
  user_id: string;
  blocked_user_id: string;
  reason: string;
  created_at: string;
}

export const MATCH_REQUEST_EXPIRY_DAYS = 30;
export const COOLDOWN_HOURS = {
  FIRST_REJECTION: 24,
  SECOND_REJECTION: 72,
  THIRD_REJECTION: 'BLOCK', // Special case handled in logic
};

