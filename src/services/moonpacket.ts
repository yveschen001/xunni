import type { DatabaseClient } from '~/db/client';
import type { IMoonPacketService, RulesResponse, UserProfileResponse, UserProfile } from '~/domain/moonpacket';
import type { Env } from '~/types'; // Import Env
import { findUserByTelegramId } from '~/db/queries/users';
import { createTelegramService } from '~/services/telegram';
import { CacheService } from '~/services/cache';

export class MoonPacketService implements IMoonPacketService {
  private db: DatabaseClient;
  private env: Env; // Store Env
  private telegramService: ReturnType<typeof createTelegramService>;
  private cache: CacheService;

  constructor(db: DatabaseClient, env: Env) {
    this.db = db;
    this.env = env; // Initialize Env
    this.telegramService = createTelegramService(env);
    this.cache = new CacheService(env);
  }

  /**
   * Get all reward rules
   */
  async getRules(): Promise<RulesResponse> {
    return {
      data: [
        {
          id: "daily_active_thrower",
          claim_amount: "10",
          currency: "BOTTLE",
          rule: {
            bottles_thrown_24h: { gte: 10 },
            is_blacklist: { eq: false },
            status: { eq: "active" }
          },
          metadata: { title: "每日丟瓶達人", desc: "24小時內丟出超過10個瓶子" }
        },
        {
          id: "daily_ad_watcher",
          claim_amount: "20",
          currency: "BOTTLE",
          rule: {
            ads_watched_24h: { gte: 10 },
            is_blacklist: { eq: false }
          },
          metadata: { title: "廣告支持者", desc: "24小時內觀看超過10則廣告" }
        },
        {
          id: "social_connector",
          claim_amount: "50",
          currency: "BOTTLE",
          rule: {
            invite_active_count_24h: { gte: 1 }, // At least 1 active friend
            is_blacklist: { eq: false }
          },
          metadata: { title: "社交達人", desc: "24小時內邀請的好友也開始玩瓶子了" }
        },
        {
          id: "social_viral_master",
          claim_amount: "100",
          currency: "BOTTLE",
          rule: {
            invite_viral_count_24h: { gte: 1 }, // At least 1 viral friend
            is_blacklist: { eq: false }
          },
          metadata: { title: "裂變大師", desc: "24小時內邀請的好友也邀請了其他人" }
        },
        {
          id: "vip_benefit",
          claim_amount: "100",
          currency: "BOTTLE",
          rule: {
            is_vip: { eq: true },
            is_blacklist: { eq: false }
          },
          metadata: { title: "VIP 專屬福利", desc: "VIP 用戶專享紅包" }
        },
        {
          id: "official_channel_fan",
          claim_amount: "50",
          currency: "BOTTLE",
          rule: {
            is_channel_member: { eq: true },
            is_blacklist: { eq: false }
          },
          metadata: { title: "官方鐵粉", desc: "加入官方頻道" }
        }
      ]
    };
  }

  /**
   * Get user profile with real-time metrics
   */
  async getUserProfile(telegramId: string): Promise<UserProfileResponse> {
    // 1. Basic User Info (Cached)
    // Cache key: user:profile:{id}
    // TTL: 1 hour (3600s) - Basic info doesn't change often
    const user = await this.cache.getOrSet(
      `user:profile:${telegramId}`,
      3600,
      async () => findUserByTelegramId(this.db, telegramId)
    );
    
    if (!user) {
      return {
        data: {
          level: 0,
          status: "inactive",
          is_blacklist: false,
          is_vip: false,
          vip_level: 0,
          bottles_thrown_24h: 0,
          bottles_picked_24h: 0,
          ads_watched_24h: 0,
          invite_count_24h: 0,
          invite_active_count_24h: 0,
          invite_viral_count_24h: 0,
          invite_count_total: 0,
          is_channel_member: false,
          profile_completeness: 0,
          messages_sent_24h: 0
        }
      };
    }

    // 2. Calculate Metrics (Parallel Queries)
    const [
      thrownCount,
      pickedCount,
      adsCount,
      inviteCount,
      inviteActiveCount,
      inviteViralCount,
      inviteTotalCount,
      isChannelMember,
      messagesSent24h
    ] = await Promise.all([
      this.getBottlesThrown24h(telegramId),
      this.getBottlesPicked24h(telegramId),
      this.getAdsWatched24h(telegramId),
      this.getInviteCount24h(telegramId),
      this.getInviteActiveCount24h(telegramId),
      this.getInviteViralCount24h(telegramId),
      this.getInviteCountTotal(telegramId),
      this.checkChannelMembership(telegramId),
      this.getMessagesSent24h(telegramId)
    ]);

    const profileCompleteness = this.calculateProfileCompleteness(user);

    const profile: UserProfile = {
      level: 1, // Default level
      status: user.is_banned ? "banned" : "active",
      is_blacklist: !!user.is_banned,
      is_vip: !!user.is_vip,
      vip_level: user.is_vip ? 1 : 0,
      
      bottles_thrown_24h: thrownCount,
      bottles_picked_24h: pickedCount,
      ads_watched_24h: adsCount,
      
      invite_count_24h: inviteCount,
      invite_active_count_24h: inviteActiveCount,
      invite_viral_count_24h: inviteViralCount,
      invite_count_total: inviteTotalCount,

      // New Metrics
      is_channel_member: isChannelMember,
      profile_completeness: profileCompleteness,
      messages_sent_24h: messagesSent24h
    };

    return { data: profile };
  }

  // --- Helper Methods ---

  private async checkChannelMembership(userId: string): Promise<boolean> {
    // TODO: Configure OFFICIAL_CHANNEL_ID in wrangler.toml
    const channelId = '-1002238405682'; // Hardcoded for now, should be env var
    if (!channelId) return false;

    try {
      const telegram = createTelegramService(this.env);
      const member = await telegram.getChatMember(channelId, parseInt(userId, 10));
      return ['member', 'administrator', 'creator'].includes(member.status);
    } catch (error) {
      console.warn(`[MoonPacket] Failed to check channel membership for ${userId}:`, error);
      return false;
    }
  }

  private calculateProfileCompleteness(user: any): number {
    let score = 0;
    const weights = {
      nickname: 10,
      gender: 15,
      birthday: 15,
      bio: 15,
      city: 10,
      interests: 10, // Assuming JSON string
      avatar_url: 15,
      mbti_result: 10
    };

    if (user.nickname) score += weights.nickname;
    if (user.gender) score += weights.gender;
    if (user.birthday) score += weights.birthday;
    if (user.bio) score += weights.bio;
    if (user.city) score += weights.city;
    if (user.interests && user.interests !== '[]') score += weights.interests;
    if (user.avatar_url) score += weights.avatar_url;
    if (user.mbti_result) score += weights.mbti_result;

    return Math.min(100, score);
  }

  private async getMessagesSent24h(userId: string): Promise<number> {
    // Query daily_usage table for efficiency if available, otherwise fallback to messages table
    const result = await this.db.d1.prepare(`
      SELECT messages_sent
      FROM daily_usage
      WHERE telegram_id = ? AND date = DATE('now')
    `).bind(userId).first<{ messages_sent: number }>();

    if (result) {
      return result.messages_sent;
    }

    // Fallback to counting messages directly (slower but accurate if daily_usage not updated real-time)
    const countResult = await this.db.d1.prepare(`
      SELECT COUNT(*) as count
      FROM conversation_messages
      WHERE sender_telegram_id = ?
      AND created_at > datetime('now', '-24 hours')
    `).bind(userId).first<{ count: number }>();

    return countResult?.count || 0;
  }

  private async getInviteCountTotal(userId: string): Promise<number> {
    const result = await this.db.d1.prepare(`
      SELECT COUNT(*) as count
      FROM users
      WHERE invited_by = ?
    `).bind(userId).first<{ count: number }>();
    
    return result?.count || 0;
  }

  private async getBottlesThrown24h(userId: string): Promise<number> {
    // Try daily_usage first
    const usage = await this.db.d1.prepare(`
      SELECT throws_count
      FROM daily_usage
      WHERE telegram_id = ? AND date = DATE('now')
    `).bind(userId).first<{ throws_count: number }>();

    if (usage && usage.throws_count !== null) {
      return usage.throws_count;
    }

    const result = await this.db.d1.prepare(`
      SELECT COUNT(*) as count 
      FROM bottles 
      WHERE owner_id = ? 
      AND created_at > datetime('now', '-24 hours')
    `).bind(userId).first<{ count: number }>();
    return result?.count || 0;
  }

  private async getBottlesPicked24h(userId: string): Promise<number> {
    // Try daily_usage first
    const usage = await this.db.d1.prepare(`
      SELECT catches_count
      FROM daily_usage
      WHERE telegram_id = ? AND date = DATE('now')
    `).bind(userId).first<{ catches_count: number }>();

    if (usage && usage.catches_count !== null) {
      return usage.catches_count;
    }

    const result = await this.db.d1.prepare(`
      SELECT COUNT(*) as count 
      FROM conversations 
      WHERE (user2_id = ?) 
      AND created_at > datetime('now', '-24 hours')
    `).bind(userId).first<{ count: number }>();
    return result?.count || 0;
  }

  private async getAdsWatched24h(userId: string): Promise<number> {
    // 1. Try to get from daily_usage (Fastest - O(1))
    const result = await this.db.d1.prepare(`
      SELECT ads_watched
      FROM daily_usage
      WHERE telegram_id = ? AND date = DATE('now')
    `).bind(userId).first<{ ads_watched: number }>();

    // If available and non-zero, use it. 
    // Note: daily_usage stores today's count. 
    // To be strictly "last 24h", we might need yesterday's too if we want rolling window.
    // However, daily_usage resets at UTC 0. 
    // The original implementation used rolling 24h.
    // If we want strict 24h rolling window with daily_usage, we need today + yesterday (partial).
    // But daily_usage only stores "daily count". It doesn't store timestamps of each event.
    // So "daily_usage" approach effectively changes "24h rolling" to "Today (UTC)".
    // This is a trade-off for O(1) speed.
    // If we strictly need 24h rolling, we still need the original slow queries.
    // BUT, for game rules like "Watch 10 ads daily", usually "Today" is what we mean.
    // Let's assume "Today (UTC)" is acceptable for "daily" tasks.
    // If the rule is strictly "Rolling 24h", then daily_usage is an approximation.
    
    // To support strict rolling 24h with O(1), we would need a sliding window counter (complex).
    // Given the context "Daily Ad Watcher", resetting at 00:00 UTC is standard behavior.
    // So we will use today's count from daily_usage.
    
    if (result && result.ads_watched !== null) {
      return result.ads_watched;
    }

    // Fallback to slow query if daily_usage is missing (e.g. first time today)
    // This ensures backward compatibility and robustness
    const adRewards = await this.db.d1.prepare(`
      SELECT COUNT(*) as count 
      FROM ad_rewards 
      WHERE user_id = ? 
      AND created_at > datetime('now', '-24 hours')
    `).bind(userId).first<{ count: number }>();
    
    const officialResult = await this.db.d1.prepare(`
      SELECT COUNT(*) as count
      FROM official_ad_views
      WHERE user_id = ?
      AND viewed_at > datetime('now', '-24 hours')
    `).bind(userId).first<{ count: number }>();

    return (adRewards?.count || 0) + (officialResult?.count || 0);
  }

  private async getInviteCount24h(userId: string): Promise<number> {
    const result = await this.db.d1.prepare(`
      SELECT COUNT(*) as count
      FROM users
      WHERE invited_by = ?
      AND created_at > datetime('now', '-24 hours')
    `).bind(userId).first<{ count: number }>();
    
    return result?.count || 0;
  }

  private async getInviteActiveCount24h(userId: string): Promise<number> {
    // Count friends invited in last 24h who have thrown at least 1 bottle
    const result = await this.db.d1.prepare(`
      SELECT COUNT(DISTINCT u.telegram_id) as count
      FROM users u
      JOIN bottles b ON u.telegram_id = b.owner_id
      WHERE u.invited_by = ?
      AND u.created_at > datetime('now', '-24 hours')
      AND b.created_at > u.created_at
    `).bind(userId).first<{ count: number }>();
    
    return result?.count || 0;
  }

  private async getInviteViralCount24h(userId: string): Promise<number> {
    // Count friends invited in last 24h who have invited others
    const result = await this.db.d1.prepare(`
      SELECT COUNT(telegram_id) as count
      FROM users
      WHERE invited_by = ?
      AND created_at > datetime('now', '-24 hours')
      AND invite_count > 0
    `).bind(userId).first<{ count: number }>();
    
    return result?.count || 0;
  }
}
