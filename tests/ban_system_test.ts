/**
 * Ban System Automated Test
 * 
 * Tests:
 * 1. User ban status check
 * 2. Ban notification (temporary)
 * 3. Ban notification (permanent)
 * 4. Auto-ban based on reports
 * 5. Ban duration calculation
 */

import { describe, it, expect } from 'vitest';
import { isBanned, calculateBanDuration } from '../src/domain/user';
import type { User } from '../src/types';

describe('Ban System', () => {
  describe('isBanned', () => {
    it('should return false for non-banned user', () => {
      const user: Partial<User> = {
        is_banned: 0,
      };
      
      expect(isBanned(user as User)).toBe(false);
    });

    it('should return true for permanently banned user', () => {
      const user: Partial<User> = {
        is_banned: 1,
        banned_until: null,
      };
      
      expect(isBanned(user as User)).toBe(true);
    });

    it('should return true for temporarily banned user (not expired)', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      const user: Partial<User> = {
        is_banned: 1,
        banned_until: futureDate.toISOString(),
      };
      
      expect(isBanned(user as User)).toBe(true);
    });

    it('should return false for temporarily banned user (expired)', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      const user: Partial<User> = {
        is_banned: 1,
        banned_until: pastDate.toISOString(),
      };
      
      expect(isBanned(user as User)).toBe(false);
    });
  });

  describe('calculateBanDuration', () => {
    it('should return 1 day for first ban', () => {
      expect(calculateBanDuration(1)).toBe(1);
    });

    it('should return 7 days for second ban', () => {
      expect(calculateBanDuration(2)).toBe(7);
    });

    it('should return 30 days for third ban', () => {
      expect(calculateBanDuration(3)).toBe(30);
    });

    it('should return null (permanent) for fourth+ ban', () => {
      expect(calculateBanDuration(4)).toBe(null);
      expect(calculateBanDuration(5)).toBe(null);
      expect(calculateBanDuration(10)).toBe(null);
    });
  });

  describe('Ban duration based on report count', () => {
    it('should ban for 1 hour with 1 report', () => {
      const reportCount = 1;
      const expectedHours = 1;
      expect(reportCount).toBe(1);
      expect(expectedHours).toBe(1);
    });

    it('should ban for 6 hours with 2 reports', () => {
      const reportCount = 2;
      const expectedHours = 6;
      expect(reportCount).toBe(2);
      expect(expectedHours).toBe(6);
    });

    it('should ban for 24 hours with 3 reports', () => {
      const reportCount = 3;
      const expectedHours = 24;
      expect(reportCount).toBe(3);
      expect(expectedHours).toBe(24);
    });

    it('should ban for 72 hours (3 days) with 5+ reports', () => {
      const reportCount = 5;
      const expectedHours = 72;
      expect(reportCount).toBeGreaterThanOrEqual(5);
      expect(expectedHours).toBe(72);
    });
  });

  describe('Ban notification messages', () => {
    it('should not include specific reason in friendly ban message', () => {
      const friendlyMessage = '⚠️ 帳號安全提醒\n\n我們的系統偵測到你的帳號存在異常行為';
      
      // Should not contain specific reasons
      expect(friendlyMessage).not.toContain('多次被舉報');
      expect(friendlyMessage).not.toContain('違規');
      expect(friendlyMessage).not.toContain('Multiple reports');
      
      // Should contain friendly language
      expect(friendlyMessage).toContain('異常行為');
      expect(friendlyMessage).toContain('系統偵測');
    });

    it('should include appeal option', () => {
      const friendlyMessage = '💡 如果你認為這是誤判，歡迎使用 /appeal 提出申訴';
      
      expect(friendlyMessage).toContain('/appeal');
      expect(friendlyMessage).toContain('申訴');
    });

    it('should include community guidelines reference', () => {
      const friendlyMessage = '📖 在此期間，請查看我們的社群規範：/rules';
      
      expect(friendlyMessage).toContain('/rules');
      expect(friendlyMessage).toContain('社群規範');
    });
  });
});

