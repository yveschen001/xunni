import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoveFortuneHandler } from '../../src/telegram/handlers/fortune_love';
import { FortuneService } from '../../src/services/fortune';
import { User, Env } from '../../src/types';

// Mock Dependencies
const mockD1 = {
  prepare: vi.fn().mockReturnThis(),
  bind: vi.fn().mockReturnThis(),
  first: vi.fn(),
  run: vi.fn(),
};

const mockEnv = {
  DB: mockD1,
  GOOGLE_GEMINI_API_KEY: 'test',
} as unknown as Env;

const mockI18n = {
  t: (key: string) => key,
} as any;

const mockFortuneService = {
  getProfiles: vi.fn(),
  generateFortune: vi.fn(),
} as unknown as FortuneService;

// Mock Modules
vi.mock('../../src/services/telegram', () => ({
  createTelegramService: () => ({
    sendMessage: vi.fn(),
    sendMessageWithButtons: vi.fn(),
  }),
}));

vi.mock('../../src/db/queries/sessions', () => ({
  clearSession: vi.fn(),
  upsertSession: vi.fn(),
  getActiveSession: vi.fn(),
}));

vi.mock('../../src/db/queries/users', () => ({
  getUser: vi.fn().mockResolvedValue({ telegram_id: '111', is_vip: 0 }),
}));

describe('Love Diagnosis Flow', () => {
  let handler: LoveFortuneHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new LoveFortuneHandler(mockFortuneService, mockI18n);
  });

  it('should handle match input - User Not Found', async () => {
    // Mock DB to return null for user search
    mockD1.first.mockResolvedValue(null);

    const mockMessage = {
        chat: { id: 123 },
        from: { id: 111 }
    } as any;

    await handler.handleMatchInputGeneric(mockMessage, mockEnv, '999');
    
    // Should NOT call generateFortune
    expect(mockFortuneService.generateFortune).not.toHaveBeenCalled();
  });

  it('should handle match input - Permission Denied', async () => {
    // User Found
    const targetUser = { telegram_id: '999', allow_matching: 0 } as User;
    mockD1.first.mockResolvedValue(targetUser);

    const mockMessage = {
        chat: { id: 123 },
        from: { id: 111 }
    } as any;

    await handler.handleMatchInputGeneric(mockMessage, mockEnv, '999');
    
    expect(mockFortuneService.generateFortune).not.toHaveBeenCalled();
  });

  it('should handle match input - Success', async () => {
    // User Found & Allowed
    const targetUser = { telegram_id: '999', allow_matching: 1 } as User;
    mockD1.first.mockResolvedValue(targetUser);
    
    (mockFortuneService.getProfiles as any)
        .mockResolvedValueOnce([{ is_default: 1, name: 'Target' }]) // Target
        .mockResolvedValueOnce([{ is_default: 1, name: 'Me' }]);    // Self

    (mockFortuneService.generateFortune as any).mockResolvedValue({ content: 'Result' });

    const mockMessage = {
        chat: { id: 123 },
        from: { id: 111 }
    } as any;

    await handler.handleMatchInputGeneric(mockMessage, mockEnv, '999');
    
    expect(mockFortuneService.generateFortune).toHaveBeenCalled();
  });
});
