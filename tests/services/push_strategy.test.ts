import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PushStrategyService, UserActivityLevel, PushType } from '../../src/services/push_strategy';

// Mock dependencies
const mockDb = {
  prepare: vi.fn(() => ({
    bind: vi.fn(() => ({
      first: vi.fn(),
      run: vi.fn(),
      all: vi.fn(),
    })),
  })),
};

const mockEnv = {
  BOT_TOKEN: 'mock_token',
};

describe('PushStrategyService', () => {
  let service: PushStrategyService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PushStrategyService(mockDb as any, mockEnv as any);
  });

  describe('getUserActivityLevel', () => {
    it('should return VERY_ACTIVE for < 24h', () => {
      const now = new Date();
      const lastActive = new Date(now.getTime() - 1000 * 60 * 60 * 5).toISOString(); // 5 hours ago
      expect(service.getUserActivityLevel(lastActive)).toBe(UserActivityLevel.VERY_ACTIVE);
    });

    it('should return ACTIVE for < 3 days', () => {
      const now = new Date();
      const lastActive = new Date(now.getTime() - 1000 * 60 * 60 * 48).toISOString(); // 48 hours ago
      expect(service.getUserActivityLevel(lastActive)).toBe(UserActivityLevel.ACTIVE);
    });

    it('should return DORMANT for null', () => {
      expect(service.getUserActivityLevel(null)).toBe(UserActivityLevel.DORMANT);
    });
  });

  // More logic tests can be added here
});
