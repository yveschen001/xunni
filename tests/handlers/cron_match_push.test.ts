import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleMatchPush } from '../../src/telegram/handlers/cron_match_push';
import { UserActivityLevel } from '../../src/domain/user';

// Mock dependencies
const mockSendImmediate = vi.fn();
vi.mock('../../src/services/notification', () => ({
  createNotificationService: vi.fn(() => ({
    sendImmediate: mockSendImmediate,
  })),
}));

vi.mock('../../src/domain/user', () => ({
  UserActivityLevel: {
    ACTIVE: 'ACTIVE',
    DORMANT: 'DORMANT',
  },
}));

vi.mock('../../src/services/user_activity', () => ({
  getUserActivityLevel: vi.fn(),
}));

vi.mock('../../src/db/queries/user_preferences', () => ({
  getUserPushPreferences: vi.fn(),
}));

vi.mock('../../src/domain/user_preferences', () => ({
  isQuietHours: vi.fn(),
}));

vi.mock('../../src/i18n', () => ({
  createI18n: vi.fn(() => ({
    t: (key: string, params?: any) => {
      if (key === 'match.template.body')
        return `Template ${params?.userAttribute} -> ${params?.recommendedAttributes}`;
      return key;
    },
  })),
}));

vi.mock('../../src/domain/zodiac', () => ({
  getZodiacDisplay: (z: string) => `Display(${z})`,
}));

// Mock CompatibilityEngine
import { CompatibilityEngine } from '../../src/domain/compatibility/engine';
vi.mock('../../src/domain/compatibility/engine', () => ({
  CompatibilityEngine: {
    getRecommendation: vi.fn(),
  },
}));

describe('handleMatchPush', () => {
  let mockDb: any;
  let mockEnv: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv = {};
    mockDb = {
      prepare: vi.fn(),
    };
  });

  it('should process active users and send notifications', async () => {
    // Setup Mock DB to return 1 user then empty
    const mockUser = {
      telegram_id: '123456',
      language_pref: 'zh-TW',
      onboarding_completed_at: '2023-01-01',
    };

    const mockStmt = {
      bind: vi.fn().mockReturnThis(),
      all: vi
        .fn()
        .mockResolvedValueOnce({ results: [mockUser] }) // First batch
        .mockResolvedValueOnce({ results: [] }), // Second batch (end)
    };
    mockDb.prepare.mockReturnValue(mockStmt);

    // Setup mocks
    const { getUserActivityLevel } = await import('../../src/services/user_activity');
    vi.mocked(getUserActivityLevel).mockResolvedValue(UserActivityLevel.ACTIVE);

    const { isQuietHours } = await import('../../src/domain/user_preferences');
    vi.mocked(isQuietHours).mockReturnValue(false);

    vi.mocked(CompatibilityEngine.getRecommendation).mockReturnValue({
      isValid: true,
      topic: 'zodiac',
      userAttribute: 'aries',
      recommendedAttributes: ['leo'],
      reasonKey: 'reason.key',
    });

    // Run handler
    await handleMatchPush(mockEnv, mockDb);

    // Assertions
    expect(mockDb.prepare).toHaveBeenCalled();
    expect(vi.mocked(getUserActivityLevel)).toHaveBeenCalledWith('123456', mockDb);
    expect(mockSendImmediate).toHaveBeenCalledTimes(1);

    // Check notification content
    const callArgs = mockSendImmediate.mock.calls[0];
    expect(callArgs[0]).toBe('123456'); // User ID
    expect(callArgs[1]).toContain('match.header.zodiac'); // Header
    expect(callArgs[1]).toContain('Display(aries)'); // Translated attribute
    expect(callArgs[2]).toHaveProperty('inline_keyboard'); // Buttons
  });

  it('should skip dormant users', async () => {
    const mockUser = { telegram_id: 'dormant_user' };
    const mockStmt = {
      bind: vi.fn().mockReturnThis(),
      all: vi
        .fn()
        .mockResolvedValueOnce({ results: [mockUser] })
        .mockResolvedValueOnce({ results: [] }),
    };
    mockDb.prepare.mockReturnValue(mockStmt);

    const { getUserActivityLevel } = await import('../../src/services/user_activity');
    vi.mocked(getUserActivityLevel).mockResolvedValue(UserActivityLevel.DORMANT);

    await handleMatchPush(mockEnv, mockDb);

    expect(mockSendImmediate).not.toHaveBeenCalled();
  });

  it('should skip users in quiet hours', async () => {
    const mockUser = { telegram_id: 'quiet_user' };
    const mockStmt = {
      bind: vi.fn().mockReturnThis(),
      all: vi
        .fn()
        .mockResolvedValueOnce({ results: [mockUser] })
        .mockResolvedValueOnce({ results: [] }),
    };
    mockDb.prepare.mockReturnValue(mockStmt);

    const { getUserActivityLevel } = await import('../../src/services/user_activity');
    vi.mocked(getUserActivityLevel).mockResolvedValue(UserActivityLevel.ACTIVE);

    const { isQuietHours } = await import('../../src/domain/user_preferences');
    vi.mocked(isQuietHours).mockReturnValue(true);

    await handleMatchPush(mockEnv, mockDb);

    expect(mockSendImmediate).not.toHaveBeenCalled();
  });
});
