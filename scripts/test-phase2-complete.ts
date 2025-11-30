import { Env, FortuneProfile, User } from '../src/types';
import { FortuneService } from '../src/services/fortune';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Dependencies
const mockEnv = {
  GOOGLE_GEMINI_API_KEY: 'test-key',
  GEMINI_MODELS: 'gemini-1.5-flash',
} as Env;

const mockDb = {
  prepare: vi.fn().mockReturnThis(),
  bind: vi.fn().mockReturnThis(),
  first: vi.fn(),
  run: vi.fn(),
  all: vi.fn(),
} as any;

describe('FortuneService Phase 2', () => {
  let service: FortuneService;

  beforeEach(() => {
    service = new FortuneService(mockEnv, mockDb);
    vi.clearAllMocks();
  });

  it('calculateChart should return Chinese and Western data', async () => {
    const result = await service.calculateChart('1990-01-01', '12:00');
    expect(result.chinese).toBeDefined();
    expect(result.chinese.wuxing).toBeDefined();
    expect(result.western).toBeDefined();
    expect(result.western.sun_sign).toBe('Capricorn');
  });

  it('drawTarot should return correct number of cards', () => {
    // Access private method via any
    const cards = (service as any).drawTarot(3);
    expect(cards).toHaveLength(3);
    expect(typeof cards[0]).toBe('string');
  });

  it('checkProfileConsistency should return false if snapshot differs', async () => {
    const historyId = 1;
    const profile = { 
      birth_date: '1990-01-01', 
      blood_type: 'A',
      gender: 'male',
      birth_time: '12:00'
    } as FortuneProfile;
    const user = { mbti_result: 'INTJ' } as User;

    // Mock DB returning a different snapshot
    const snapshot = JSON.stringify({
      birth_date: '1990-01-01',
      blood_type: 'B', // Changed
      mbti: 'INTJ'
    });
    
    mockDb.first.mockResolvedValueOnce({ profile_snapshot: snapshot });

    const result = await service.checkProfileConsistency(historyId, profile, user);
    expect(result).toBe(false);
  });

  it('checkProfileConsistency should return true if snapshot matches', async () => {
    const historyId = 1;
    const profile = { 
      birth_date: '1990-01-01', 
      blood_type: 'A',
      gender: 'male',
      birth_time: '12:00'
    } as FortuneProfile;
    const user = { mbti_result: 'INTJ' } as User;

    const snapshot = JSON.stringify({
      birth_date: '1990-01-01',
      blood_type: 'A',
      mbti: 'INTJ',
      birth_time: '12:00'
    });
    
    mockDb.first.mockResolvedValueOnce({ profile_snapshot: snapshot });

    const result = await service.checkProfileConsistency(historyId, profile, user);
    expect(result).toBe(true);
  });
});
