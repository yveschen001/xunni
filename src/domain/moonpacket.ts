/**
 * MoonPacket API Domain Definitions
 */

// --- Request Interfaces ---

export interface MoonPacketCheckRequest {
  user_id?: string; // Optional: Telegram ID
}

// --- Response Interfaces ---

/**
 * Rules List Response (when user_id is missing)
 */
export interface RulesResponse {
  data: RuleItem[];
}

export interface RuleItem {
  id: string;           // Unique ID (e.g., "daily_active_thrower")
  claim_amount: string; // Amount string
  currency: string;     // Currency unit (e.g., "BOTTLE")
  
  // Rule thresholds (must match UserProfile keys)
  rule: {
    // Operators: eq, gt, gte, lt, lte
    [key: string]: {
      eq?: string | number | boolean;
      gt?: number;
      gte?: number;
      lt?: number;
      lte?: number;
    } | undefined;
  };

  metadata?: { 
    title: string; 
    desc?: string 
  };
}

/**
 * User Profile Response (when user_id is present)
 */
export interface UserProfileResponse {
  data: UserProfile;
}

export interface UserProfile {
  // Basic Fields
  level: number;
  status: "active" | "banned" | "inactive";
  is_blacklist: boolean;
  
  // Extended Fields (Criteria)
  is_vip: boolean;
  vip_level: number;
  
  // Activity Metrics (24h) - Numeric for flexible thresholding
  bottles_thrown_24h: number;
  bottles_picked_24h: number;
  ads_watched_24h: number;
  
  // Social Metrics (24h) - Numeric for flexible thresholding
  invite_count_24h: number;        // Total invited
  invite_active_count_24h: number; // Invited friend who sent a bottle
  invite_viral_count_24h: number;  // Invited friend who invited others
  invite_count_total: number;      // Lifetime total invited friends
  
  // Deep Engagement Metrics
  is_channel_member: boolean;      // Is member of official channel
  profile_completeness: number;    // 0-100 score
  messages_sent_24h: number;       // Chat messages sent in last 24h
  
  [key: string]: any;
}

// --- Service Interface ---

export interface IMoonPacketService {
  getRules(): Promise<RulesResponse>;
  getUserProfile(telegramId: string): Promise<UserProfileResponse>;
}
