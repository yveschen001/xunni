
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminAdsService } from '../src/domain/admin/ads';
import type { Env } from '../src/types';
import type { D1Database } from '@cloudflare/workers-types';

// Mock TranslationService
vi.mock('../src/services/translation', () => ({
  TranslationService: vi.fn().mockImplementation(() => ({
    batchTranslate: vi.fn().mockResolvedValue({
      'en': 'Translated Title',
      'zh-TW': '翻譯標題'
    })
  }))
}));

// Mock D1Database and Stmt
const mockRun = vi.fn().mockResolvedValue({ meta: { last_row_id: 123, changes: 1 } });
const mockFirst = vi.fn().mockResolvedValue(null);
const mockAll = vi.fn().mockResolvedValue({ results: [] });

const mockStmt = {
  bind: vi.fn().mockReturnThis(),
  run: mockRun,
  first: mockFirst,
  all: mockAll,
};

const mockDb = {
  prepare: vi.fn().mockReturnValue(mockStmt),
} as unknown as D1Database;

const mockEnv = {
  SUPER_ADMIN_USER_ID: '123456789',
  ADMIN_USER_IDS: '987654321',
  OPENAI_API_KEY: 'sk-mock-key',
} as unknown as Env;

describe('Official Ads Smoke Test', () => {
  let service: AdminAdsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AdminAdsService(mockDb, mockEnv, '123456789'); // Use Super Admin ID
  });

  it('should allow Super Admin to create an ad', async () => {
    const params = {
      ad_type: 'text' as const,
      title: 'Test Ad',
      content: 'Content',
      reward_quota: 1
    };

    const adId = await service.createAd(params);

    expect(adId).toBe(123);
    expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO official_ads'));
    expect(mockStmt.bind).toHaveBeenCalledWith(
      'text',
      'Test Ad',
      'Content',
      null,
      null,
      1, // reward_quota
      0, // requires_verification
      1, // is_enabled (fixed to number)
      null,
      null,
      null,
      expect.stringContaining('"en":"Translated Title"'), // title_i18n
      expect.stringContaining('"en":"Translated Title"')  // content_i18n
    );
  });

  it('should allow Configured Admin (Angel) to create an ad', async () => {
    service = new AdminAdsService(mockDb, mockEnv, '987654321'); // Configured Admin ID
    const adId = await service.createAd({
      ad_type: 'link',
      title: 'Link Ad',
      content: 'Click me',
      url: 'https://example.com',
      reward_quota: 1
    });
    expect(adId).toBe(123);
  });

  it('should DENY unknown user to create an ad', async () => {
    service = new AdminAdsService(mockDb, mockEnv, '111111111'); // Random ID
    await expect(service.createAd({
      ad_type: 'text',
      title: 'Unauthorized',
      content: 'Hack',
      reward_quota: 1
    })).rejects.toThrow('Permission denied');
  });

  it('should soft delete an ad', async () => {
    await service.deleteAd(123);
    expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE official_ads'));
    // deleteAd sets is_enabled=false (0) and deleted_at=ISOString
    expect(mockStmt.bind).toHaveBeenCalledWith(
        0, // is_enabled
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T/), // deleted_at
        123 // id
    ); 
  });

  it('should duplicate an ad', async () => {
    // Mock getOfficialAdById response
    mockFirst.mockResolvedValueOnce({
      id: 123,
      ad_type: 'text',
      title: 'Original',
      content: 'Content',
      reward_quota: 1,
      requires_verification: 0,
      is_enabled: 1,
      created_at: '2023-01-01'
    });

    const newId = await service.duplicateAd(123);
    expect(newId).toBe(123); // Mocked return
    expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO official_ads'));
  });
});
