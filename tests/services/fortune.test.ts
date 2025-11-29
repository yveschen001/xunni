import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FortuneService } from '../../src/services/fortune';
import { FortuneType } from '../../src/types';

// Mock dependencies
const mockDb = {
  prepare: vi.fn(),
  batch: vi.fn(),
};

const mockEnv = {
  GOOGLE_GEMINI_API_KEY: 'mock-api-key',
} as any;

describe('FortuneService', () => {
  let service: FortuneService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new FortuneService(mockEnv, mockDb as any);
  });

  describe('calculateChart', () => {
    it('should calculate Western and Chinese chart data correctly', async () => {
      // 2000-01-01 12:00
      const dateStr = '2000-01-01';
      const timeStr = '12:00';
      
      const result = await service.calculateChart(dateStr, timeStr);
      
      expect(result.solar_date).toBe('2000-1-1 12:0');
      expect(result.western.sun_sign).toBe('Capricorn'); // Jan 1 is Capricorn
      expect(result.chinese.animals.year).toBeDefined(); // Dragon/Rabbit etc.
      expect(result.chinese.wuxing).toBeDefined();
    });
  });

  describe('Quota Management', () => {
    it('should initialize quota if not exists', async () => {
      const userId = '123';
      
      // Mock getQuota returns null first
      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({
          id: 1,
          telegram_id: userId,
          weekly_free_quota: 0,
          additional_quota: 0
        }),
        run: vi.fn().mockResolvedValue({ success: true }),
      };
      mockDb.prepare.mockReturnValue(mockStmt);

      const quota = await service.refreshQuota(userId, false);
      
      // Should have called insert
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO fortune_quota'));
      expect(quota).toBeDefined();
    });

    it('should reset weekly quota for free user if expired', async () => {
      const userId = '123';
      const lastWeek = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(); // 8 days ago
      
      const mockQuota = {
        id: 1,
        telegram_id: userId,
        weekly_free_quota: 0,
        additional_quota: 0,
        last_reset_at: lastWeek
      };

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockQuota),
        run: vi.fn().mockResolvedValue({ success: true }),
      };
      mockDb.prepare.mockReturnValue(mockStmt);

      const quota = await service.refreshQuota(userId, false);
      
      // Should have called update
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE fortune_quota'));
      expect(quota.weekly_free_quota).toBe(1); // Reset to 1
    });

    it('should NOT reset weekly quota if same week', async () => {
      const userId = '123';
      // Assume test runs on non-Monday, or just same day
      const today = new Date().toISOString();
      
      const mockQuota = {
        id: 1,
        telegram_id: userId,
        weekly_free_quota: 0, 
        additional_quota: 0,
        last_reset_at: today
      };

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockQuota),
        run: vi.fn().mockResolvedValue({ success: true }),
      };
      mockDb.prepare.mockReturnValue(mockStmt);

      const quota = await service.refreshQuota(userId, false);
      
      // Should NOT have called update (except the initial SELECTs)
      expect(mockDb.prepare).not.toHaveBeenCalledWith(expect.stringContaining('UPDATE fortune_quota'));
      expect(quota.weekly_free_quota).toBe(0);
    });

    it('should deduct quota correctly (prefer weekly)', async () => {
      const userId = '123';
      const mockQuota = {
        id: 1,
        telegram_id: userId,
        weekly_free_quota: 1,
        additional_quota: 5,
        last_reset_at: new Date().toISOString()
      };

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockQuota),
        run: vi.fn().mockResolvedValue({ success: true }),
      };
      mockDb.prepare.mockReturnValue(mockStmt);

      const result = await service.deductQuota(userId, false);
      
      expect(result).toBe(true);
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('weekly_free_quota = weekly_free_quota - 1'));
    });

    it('should deduct additional quota if weekly is empty', async () => {
      const userId = '123';
      const mockQuota = {
        id: 1,
        telegram_id: userId,
        weekly_free_quota: 0,
        additional_quota: 5,
        last_reset_at: new Date().toISOString()
      };

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockQuota),
        run: vi.fn().mockResolvedValue({ success: true }),
      };
      mockDb.prepare.mockReturnValue(mockStmt);

      const result = await service.deductQuota(userId, false);
      
      expect(result).toBe(true);
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('additional_quota = additional_quota - 1'));
    });

    it('should fail if no quota', async () => {
      const userId = '123';
      const mockQuota = {
        id: 1,
        telegram_id: userId,
        weekly_free_quota: 0,
        additional_quota: 0,
        last_reset_at: new Date().toISOString()
      };

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockQuota),
        run: vi.fn().mockResolvedValue({ success: true }),
      };
      mockDb.prepare.mockReturnValue(mockStmt);

      const result = await service.deductQuota(userId, false);
      
      expect(result).toBe(false);
    });
  });

  describe('generateFortune', () => {
    it('should return cached result if available', async () => {
      const user = { telegram_id: '123', is_vip: 0 } as any;
      const profile = { name: 'Test', birth_date: '2000-01-01' } as any;
      const type: FortuneType = 'daily';
      const date = '2023-10-01';

      const mockCached = { id: 99, content: 'Cached Fortune' };
      
      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockCached), // First call is check cache
      };
      mockDb.prepare.mockReturnValue(mockStmt);

      const result = await service.generateFortune(user, profile, type, date);
      
      expect(result).toEqual(mockCached);
      // Should not call API or Deduct Quota
      expect(mockDb.prepare).toHaveBeenCalledTimes(1); 
    });
  });
});

