/**
 * Invite Domain Logic Tests
 */

import { describe, it, expect } from 'vitest';
import {
  calculateDailyQuota,
  extractInviteCode,
  validateInviteCode,
  maskNickname,
  shouldShowInviteLimitWarning,
  hasReachedInviteLimit,
  canActivateInvite,
  getInviteLimit,
  calculateConversionRate,
} from '../../src/domain/invite';
import type { User } from '../../src/domain/user';

describe('Invite Domain Logic', () => {
  describe('calculateDailyQuota', () => {
    it('should calculate free user quota correctly', () => {
      const user = {
        is_vip: false,
        successful_invites: 5,
      } as User;

      expect(calculateDailyQuota(user)).toBe(8); // 3 + 5
    });

    it('should respect free user invite limit', () => {
      const user = {
        is_vip: false,
        successful_invites: 15,
      } as User;

      expect(calculateDailyQuota(user)).toBe(13); // 3 + 10 (max)
    });

    it('should calculate VIP user quota correctly', () => {
      const user = {
        is_vip: true,
        successful_invites: 50,
      } as User;

      expect(calculateDailyQuota(user)).toBe(80); // 30 + 50
    });

    it('should respect VIP user invite limit', () => {
      const user = {
        is_vip: true,
        successful_invites: 120,
      } as User;

      expect(calculateDailyQuota(user)).toBe(130); // 30 + 100 (max)
    });

    it('should handle zero invites', () => {
      const user = {
        is_vip: false,
        successful_invites: 0,
      } as User;

      expect(calculateDailyQuota(user)).toBe(3); // 3 + 0
    });

    it('should handle undefined successful_invites', () => {
      const user = {
        is_vip: false,
      } as User;

      expect(calculateDailyQuota(user)).toBe(3); // 3 + 0
    });
  });

  describe('extractInviteCode', () => {
    it('should extract valid invite code', () => {
      expect(extractInviteCode('/start invite_XUNNI-ABC12345')).toBe('XUNNI-ABC12345');
    });

    it('should return null for /start without invite code', () => {
      expect(extractInviteCode('/start')).toBeNull();
    });

    it('should return null for invalid format', () => {
      expect(extractInviteCode('/start hello')).toBeNull();
    });

    it('should handle empty string', () => {
      expect(extractInviteCode('')).toBeNull();
    });
  });

  describe('validateInviteCode', () => {
    it('should validate correct format', () => {
      expect(validateInviteCode('XUNNI-ABC12345')).toBe(true);
      expect(validateInviteCode('XUNNI-12345678')).toBe(true);
      expect(validateInviteCode('XUNNI-ABCDEFGH')).toBe(true);
    });

    it('should reject invalid format', () => {
      expect(validateInviteCode('invalid')).toBe(false);
      expect(validateInviteCode('XUNNI-ABC')).toBe(false); // Too short
      expect(validateInviteCode('XUNNI-ABC123456')).toBe(false); // Too long
      expect(validateInviteCode('WRONG-ABC12345')).toBe(false); // Wrong prefix
      expect(validateInviteCode('XUNNI-abc12345')).toBe(false); // Lowercase
    });
  });

  describe('maskNickname', () => {
    it('should mask 1-character name (pad to 10)', () => {
      expect(maskNickname('張')).toBe('張*********');
      expect(maskNickname('張').length).toBe(10);
    });

    it('should mask 2-character Chinese name (pad to 10)', () => {
      expect(maskNickname('王五')).toBe('王五********');
      expect(maskNickname('王五').length).toBe(10);
    });

    it('should mask 3-character Chinese name (pad to 10)', () => {
      expect(maskNickname('張小明')).toBe('張小明*******');
      expect(maskNickname('張小明').length).toBe(10);
    });

    it('should mask 4-character name (show all + 6 stars)', () => {
      expect(maskNickname('李四四')).toBe('李四四*******');
      expect(maskNickname('李四四').length).toBe(10);
    });

    it('should mask 5-character English name (show 5 + 5 stars)', () => {
      expect(maskNickname('Alice')).toBe('Alice*****');
      expect(maskNickname('Alice').length).toBe(10);
    });

    it('should mask 3-character English name (pad to 10)', () => {
      expect(maskNickname('Bob')).toBe('Bob*******');
      expect(maskNickname('Bob').length).toBe(10);
    });

    it('should handle empty string', () => {
      expect(maskNickname('')).toBe('新用戶******');
      // 「新用戶」為 3 個中文字 + 6 個 * = 9 個字元
      expect(maskNickname('').length).toBe('新用戶******'.length);
    });

    it('should mask long names (show 6 + 4 stars)', () => {
      expect(maskNickname('Alexander')).toBe('Alexan****');
      expect(maskNickname('Alexander').length).toBe(10);
    });

    it('should mask very long names (show 6 + 4 stars)', () => {
      expect(maskNickname('VeryLongName')).toBe('VeryLo****');
      expect(maskNickname('VeryLongName').length).toBe(10);
    });
  });

  describe('shouldShowInviteLimitWarning', () => {
    it('should return true for free user at 9/10', () => {
      const user = {
        is_vip: false,
        successful_invites: 9,
      } as User;

      expect(shouldShowInviteLimitWarning(user)).toBe(true);
    });

    it('should return false for free user at 10/10', () => {
      const user = {
        is_vip: false,
        successful_invites: 10,
      } as User;

      expect(shouldShowInviteLimitWarning(user)).toBe(false);
    });

    it('should return false for VIP user', () => {
      const user = {
        is_vip: true,
        successful_invites: 99,
      } as User;

      expect(shouldShowInviteLimitWarning(user)).toBe(false);
    });
  });

  describe('hasReachedInviteLimit', () => {
    it('should return true for free user at 10/10', () => {
      const user = {
        is_vip: false,
        successful_invites: 10,
      } as User;

      expect(hasReachedInviteLimit(user)).toBe(true);
    });

    it('should return false for free user at 9/10', () => {
      const user = {
        is_vip: false,
        successful_invites: 9,
      } as User;

      expect(hasReachedInviteLimit(user)).toBe(false);
    });

    it('should return true for VIP user at 100/100', () => {
      const user = {
        is_vip: true,
        successful_invites: 100,
      } as User;

      expect(hasReachedInviteLimit(user)).toBe(true);
    });

    it('should return false for VIP user at 99/100', () => {
      const user = {
        is_vip: true,
        successful_invites: 99,
      } as User;

      expect(hasReachedInviteLimit(user)).toBe(false);
    });
  });

  describe('canActivateInvite', () => {
    it('should return true when all conditions met', () => {
      const user = {
        onboarding_step: 'completed',
        invited_by: '123456',
      } as User;

      expect(canActivateInvite(user, true)).toBe(true);
    });

    it('should return false if onboarding not completed', () => {
      const user = {
        onboarding_step: 'mbti',
        invited_by: '123456',
      } as User;

      expect(canActivateInvite(user, true)).toBe(false);
    });

    it('should return false if not thrown bottle', () => {
      const user = {
        onboarding_step: 'completed',
        invited_by: '123456',
      } as User;

      expect(canActivateInvite(user, false)).toBe(false);
    });

    it('should return false if no inviter', () => {
      const user = {
        onboarding_step: 'completed',
        invited_by: null,
      } as User;

      expect(canActivateInvite(user, true)).toBe(false);
    });
  });

  describe('getInviteLimit', () => {
    it('should return 10 for free user', () => {
      const user = { is_vip: false } as User;
      expect(getInviteLimit(user)).toBe(10);
    });

    it('should return 100 for VIP user', () => {
      const user = { is_vip: true } as User;
      expect(getInviteLimit(user)).toBe(100);
    });
  });

  describe('calculateConversionRate', () => {
    it('should calculate conversion rate correctly', () => {
      expect(calculateConversionRate(10, 5)).toBe(50);
      expect(calculateConversionRate(100, 25)).toBe(25);
      expect(calculateConversionRate(10, 8)).toBe(80);
    });

    it('should return 0 for zero total invites', () => {
      expect(calculateConversionRate(0, 0)).toBe(0);
    });

    it('should round correctly', () => {
      expect(calculateConversionRate(3, 1)).toBe(33); // 33.33... -> 33
      expect(calculateConversionRate(3, 2)).toBe(67); // 66.66... -> 67
    });
  });
});
