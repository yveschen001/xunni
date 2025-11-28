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
      data: {
        level: { gte: 1 },
        is_vip: { eq: true },
        status: { eq: "active" },
        is_blacklist: { eq: false },
        ads_watched_24h: { gte: 10 },
        bottles_thrown_24h: { gte: 3 },
        bottles_picked_24h: { gte: 3 },
        invite_active_count_24h: { gte: 1 },
        invite_viral_count_24h: { gte: 1 },
        invite_count_total: { gte: 10 },
        is_channel_member: { eq: true },
        profile_completeness: { gte: 80 },
        messages_sent_24h: { gte: 10 }
      }
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
      level: 1,
      status: user.is_banned ? 'blocked' : 'active',
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
      is_channel_member: isChannelMember,
      profile_completeness: profileCompleteness,
      messages_sent_24h: messagesSent24h
    };

    return { data: profile };
  }

  // --- Helper Methods ---

  private async getBottlesThrown24h(userId: string): Promise<number> {
    const usage = await this.getDailyUsage(userId);
    return usage?.throws_count || 0;
  }

  private async getBottlesPicked24h(userId: string): Promise<number> {
    const usage = await this.getDailyUsage(userId);
    return usage?.catches_count || 0;
  }

  private async getAdsWatched24h(userId: string): Promise<number> {
    // TODO: Add ads_watched column to daily_usage table for optimized query
    // For now, assume 0 or implement query from ad_rewards table if needed
    // But since we optimized daily_usage in P1 plan, let's assume it's there or use fallback
    // Fallback: Query ad_rewards directly
    // Ideally: return usage?.ads_watched || 0;
    
    // Check if we have ads_watched in daily_usage (based on P1 plan)
    // If not implemented yet, fallback to count query
    try {
      const result = await this.db.d1.prepare(`
        SELECT COUNT(*) as count 
        FROM ad_rewards 
        WHERE user_id = ? 
          AND created_at > datetime('now', '-1 day')
      `).bind(userId).first<{ count: number }>();
      return result?.count || 0;
    } catch (e) {
      console.error('[MoonPacket] Failed to get ads count:', e);
      return 0;
    }
  }

  private async getInviteCount24h(userId: string): Promise<number> {
    const result = await this.db.d1.prepare(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE invited_by = ? 
        AND created_at > datetime('now', '-1 day')
    `).bind(userId).first<{ count: number }>();
    return result?.count || 0;
  }

  private async getInviteActiveCount24h(userId: string): Promise<number> {
    // "Active" means has thrown at least 1 bottle
    const result = await this.db.d1.prepare(`
      SELECT COUNT(DISTINCT u.telegram_id) as count
      FROM users u
      JOIN bottles b ON u.telegram_id = b.owner_telegram_id
      WHERE u.invited_by = ?
        AND u.created_at > datetime('now', '-1 day')
    `).bind(userId).first<{ count: number }>();
    return result?.count || 0;
  }

  private async getInviteViralCount24h(userId: string): Promise<number> {
    // "Viral" means invited user also invited someone
    const result = await this.db.d1.prepare(`
      SELECT COUNT(DISTINCT u.telegram_id) as count
      FROM users u
      JOIN users grand_child ON u.telegram_id = grand_child.invited_by
      WHERE u.invited_by = ?
        AND u.created_at > datetime('now', '-1 day')
    `).bind(userId).first<{ count: number }>();
    return result?.count || 0;
  }

  private async getInviteCountTotal(userId: string): Promise<number> {
    const user = await findUserByTelegramId(this.db, userId);
    return user?.successful_invites || 0;
  }

  private async checkChannelMembership(userId: string): Promise<boolean> {
    if (!this.env.OFFICIAL_CHANNEL_ID) return false;
    
    // Check cache first (TTL 1 hour)
    return this.cache.getOrSet(
      `user:channel_member:${userId}`,
      3600,
      async () => {
        try {
          const member = await this.telegramService.getChatMember(
            this.env.OFFICIAL_CHANNEL_ID!, 
            parseInt(userId)
          );
          return ['creator', 'administrator', 'member', 'restricted'].includes(member.status);
        } catch (e) {
          console.error('[MoonPacket] Channel check failed:', e);
          return false;
        }
      }
    );
  }

  private calculateProfileCompleteness(user: any): number {
    let score = 0;
    if (user.nickname) score += 20;
    if (user.avatar_file_id) score += 20;
    if (user.gender) score += 10;
    if (user.birthday) score += 10;
    if (user.bio) score += 10;
    if (user.city || user.country_code) score += 10;
    if (user.mbti_result) score += 20;
    return Math.min(100, score);
  }

  private async getMessagesSent24h(userId: string): Promise<number> {
    const usage = await this.getDailyUsage(userId);
    return usage?.messages_sent || 0;
  }

  private async getDailyUsage(userId: string) {
    // Cache daily usage for 1 min to avoid hammering DB on rapid checks
    return this.cache.getOrSet(
      `user:usage:${userId}`,
      60,
      async () => {
        const today = new Date().toISOString().split('T')[0];
        return this.db.d1.prepare(`
          SELECT * FROM daily_usage 
          WHERE telegram_id = ? AND date = ?
        `).bind(userId, today).first<any>();
      }
    );
  }
}
