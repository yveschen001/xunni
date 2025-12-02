import type { Env } from '~/types';
import { I18n } from '~/i18n';
import { createTelegramService } from '~/services/telegram';
import { D1Database } from '@cloudflare/workers-types';
import {
  createMatchRequest,
  getActiveMatchRequest,
  getLastRejectedRequest,
  updateMatchRequestStatus,
  isBlocked,
  createBlock,
  getMatchRequest
} from '~/db/queries/match_requests';
import { findUserByTelegramId, findUserByUsername, findUserByNickname } from '~/db/queries/users';
import { COOLDOWN_HOURS, MATCH_REQUEST_EXPIRY_DAYS, RelationshipType } from '~/domain/match_request';
import { FortuneService } from '~/services/fortune';
import { maskNickname } from '~/domain/invite';
import { formatNicknameWithFlag } from '~/utils/country_flag';
import { createDatabaseClient } from '~/db/client';

export class MatchRequestService {
  constructor(
    private env: Env,
    private db: D1Database,
    private i18n: I18n,
    private telegram: ReturnType<typeof createTelegramService>
  ) {}

  /**
   * Request a match with another user
   */
  async requestMatch(
    requesterId: string,
    targetInput: string, // Username or ID
    relationshipType: RelationshipType,
    familyRole?: string
  ): Promise<{ success: boolean; code?: string; message?: string; data?: any }> {
    // 1. Find target user
    let targetInputClean = targetInput.trim();
    
    // Smart Input Handling: Extract username from URL
    // Supports: t.me/username, https://t.me/username, @username
    const urlMatch = targetInputClean.match(/(?:t\.me\/|@)([\w\d_]+)/i);
    if (urlMatch) {
      targetInputClean = urlMatch[1];
    }

    let targetUser = await findUserByTelegramId(createDatabaseClient(this.db), targetInputClean);
    if (!targetUser) {
      // Try by username (already cleaned)
      targetUser = await findUserByUsername(createDatabaseClient(this.db), targetInputClean);
    }
    if (!targetUser) {
      // Try by nickname (as per user request and data observation)
      targetUser = await findUserByNickname(createDatabaseClient(this.db), targetInputClean);
    }

    if (!targetUser) {
      return { success: false, code: 'TARGET_NOT_FOUND', message: this.i18n.t('fortune.love.error_not_found') };
    }

    const targetId = targetUser.telegram_id;

    // 1.5 Check Target Profile (New Requirement)
    const fortuneService = new FortuneService(this.env, this.db);
    const targetProfiles = await fortuneService.getProfiles(targetId);
    if (targetProfiles.length === 0) {
      return { success: false, code: 'TARGET_NO_PROFILE' };
    }

    // 2. Validate Target
    if (requesterId === targetId) {
      return { success: false, code: 'SELF_MATCH', message: this.i18n.t('fortune.love.error_self_match') };
    }

    // 3. Check Quota (Pre-check)
    // Determine if VIP (we need requester user object, but we assume caller checked or we fetch it)
    const requester = await findUserByTelegramId(createDatabaseClient(this.db), requesterId);
    if (!requester) return { success: false, code: 'USER_NOT_FOUND' };

    const isVip = !!(requester.is_vip && requester.vip_expire_at && new Date(requester.vip_expire_at) > new Date());
    const quota = await fortuneService.refreshQuota(requesterId, isVip);
    const totalQuota = quota.weekly_free_quota + quota.additional_quota;

    if (totalQuota < 1) {
      return { success: false, code: 'QUOTA_INSUFFICIENT' };
    }

    // 4. Check Blocklist (Bidirectional)
    if (await isBlocked(this.db, targetId, requesterId)) { // Target blocked Requester
      return { success: false, code: 'BLOCKED', message: this.i18n.t('fortune.love.error_blocked') };
    }
    if (await isBlocked(this.db, requesterId, targetId)) { // Requester blocked Target
      return { success: false, code: 'BLOCKED_BY_SELF', message: this.i18n.t('fortune.love.error_blocked_by_self') };
    }

    // 5. Check Active/Pending Requests
    // In Single Opt-in flow, we ignore pending requests from old flow.
    // We just proceed to match.
    /*
    const activeRequest = await getActiveMatchRequest(this.db, requesterId, targetId);
    if (activeRequest) {
      if (activeRequest.status === 'pending') {
        return { success: false, code: 'PENDING_EXISTS', message: this.i18n.t('fortune.love.error_pending_exists') };
      }
      // If accepted and not expired, why request again? Maybe data changed?
      // Logic: Allow re-request if data changed (handled elsewhere) or if previous request expired.
      // getActiveMatchRequest handles checking expiry.
    }
    */

    // 6. Check Cooldown (Anti-Harassment)
    const lastRejected = await getLastRejectedRequest(this.db, requesterId, targetId);
    if (lastRejected && lastRejected.last_rejected_at) {
      const rejectionTime = new Date(lastRejected.last_rejected_at).getTime();
      const now = Date.now();
      const hoursSince = (now - rejectionTime) / (1000 * 60 * 60);

      let cooldownHours = 0;
      if (lastRejected.rejection_count === 1) cooldownHours = COOLDOWN_HOURS.FIRST_REJECTION;
      else if (lastRejected.rejection_count === 2) cooldownHours = COOLDOWN_HOURS.SECOND_REJECTION;
      
      if (hoursSince < cooldownHours) {
        const remaining = Math.ceil(cooldownHours - hoursSince);
        return { 
          success: false, 
          code: 'COOLDOWN', 
          message: this.i18n.t('fortune.love.error_cooldown', { hours: remaining }) 
        };
      }
    }

    // 7. Validation Success - Return Ready State (Single Opt-in Flow)
    // No longer creating DB request or sending consent
    return { 
      success: true, 
      code: 'READY_TO_MATCH',
      message: 'Validation passed',
      // Return target info for the UI confirmation step
      data: {
        targetId,
        targetName: targetUser.nickname || targetUser.username || this.i18n.t('common.anonymousUser'),
        targetCountry: targetUser.country_code
      }
    };
  }

  /**
   * Handle user consent (Accept/Reject)
   * @deprecated No longer used in Single Opt-in Flow
   */
  async handleConsent(requestId: string, targetId: string, accepted: boolean): Promise<{ success: boolean; message?: string }> {
    const request = await getMatchRequest(this.db, requestId);
    if (!request) return { success: false, message: 'Request not found' };

    // Verify Target
    if (request.target_id !== targetId) return { success: false, message: 'Unauthorized' };

    // Check Status
    if (request.status !== 'pending') return { success: false, message: 'Request no longer pending' };

    const requesterId = request.requester_id;
    const { createI18n } = await import('~/i18n');

    if (accepted) {
      // 1. Check Requester Quota Again
      const fortuneService = new FortuneService(this.env, this.db);
      const requester = await findUserByTelegramId(createDatabaseClient(this.db), requesterId);
      if (!requester) return { success: false }; // Should not happen

      const isVip = !!(requester.is_vip && requester.vip_expire_at && new Date(requester.vip_expire_at) > new Date());
      const hasQuota = await fortuneService.deductQuota(requesterId, isVip);

      if (!hasQuota) {
        // Quota failed. 
        return { success: false, message: 'Requester has insufficient quota' }; // Internal message
      }

      // 2. Update Status
      await updateMatchRequestStatus(this.db, requestId, 'accepted');

      // 3. Notify Requester (and Trigger Report)
      const requesterI18n = createI18n(requester.language_pref || 'zh-TW');
      const targetUser = await findUserByTelegramId(createDatabaseClient(this.db), targetId);
      const targetName = targetUser?.nickname || 'Partner';
      
      await this.telegram.sendMessageWithButtons(
        requesterId,
        requesterI18n.t('fortune.love.consent_accepted_notify', { target: targetName }),
        [
          [{ text: requesterI18n.t('fortune.love.generate_report_btn'), callback_data: `fortune_gen_match:${requestId}` }]
        ]
      );

      return { success: true, message: 'Accepted' };

    } else {
      // Rejected
      // 1. Update Status & Count
      const currentCount = request.rejection_count + 1;
      const now = new Date().toISOString();
      
      await updateMatchRequestStatus(this.db, requestId, 'rejected', { 
        count: currentCount, 
        at: now 
      });

      // 2. Check for Auto-Block
      if (currentCount >= 3) {
        // Create Block
        await createBlock(this.db, targetId, requesterId, 'match_rejected_3_times');
      }

      // 3. Notify Requester
      const requester = await findUserByTelegramId(createDatabaseClient(this.db), requesterId);
      if (requester) {
        const requesterI18n = createI18n(requester.language_pref || 'zh-TW');
        await this.telegram.sendMessage(
          requesterId,
          requesterI18n.t('fortune.love.consent_rejected_notify')
        );
      }

      return { success: true, message: 'Rejected' };
    }
  }
}
