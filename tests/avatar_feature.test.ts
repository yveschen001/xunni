/**
 * Avatar Feature Tests
 *
 * Tests for avatar display feature with caching in conversation history posts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getDisplayAvatarUrl,
  getDefaultAvatarUrl,
  isAvatarCacheExpired,
  generateBlurredAvatarUrl,
} from '~/services/avatar';

describe('Avatar Feature', () => {
  describe('getDisplayAvatarUrl', () => {
    const mockEnv = {
      PUBLIC_URL: 'https://test.example.com',
    } as any;

    it('should return male default avatar when original URL is null and gender is male', () => {
      const result = getDisplayAvatarUrl(null, false, mockEnv, 'male');
      expect(result).toBe('https://test.example.com/assets/default-avatar-male.png');
    });

    it('should return female default avatar when original URL is null and gender is female', () => {
      const result = getDisplayAvatarUrl(null, false, mockEnv, 'female');
      expect(result).toBe('https://test.example.com/assets/default-avatar-female.png');
    });

    it('should return neutral default avatar when original URL is null and gender is unknown', () => {
      const result = getDisplayAvatarUrl(null, false, mockEnv);
      expect(result).toBe('https://test.example.com/assets/default-avatar-neutral.png');
    });

    it('should return original URL for VIP users', () => {
      const originalUrl = 'https://api.telegram.org/file/bot123/photo.jpg';
      const result = getDisplayAvatarUrl(originalUrl, true, mockEnv);
      expect(result).toBe(originalUrl);
    });

    it('should return blurred URL for free users', () => {
      const originalUrl = 'https://api.telegram.org/file/bot123/photo.jpg';
      const result = getDisplayAvatarUrl(originalUrl, false, mockEnv);
      expect(result).toContain('/api/avatar/blur?url=');
      expect(result).toContain(encodeURIComponent(originalUrl));
    });

    it('should return default avatar for VIP users when no avatar', () => {
      const result = getDisplayAvatarUrl(null, true, mockEnv, 'male');
      expect(result).toBe('https://test.example.com/assets/default-avatar-male.png');
    });
  });

  describe('Avatar URL format', () => {
    const mockEnv = {
      PUBLIC_URL: 'https://test.example.com',
    } as any;

    it('should generate valid blur proxy URL', () => {
      const originalUrl = 'https://api.telegram.org/file/bot123/photo.jpg';
      const result = getDisplayAvatarUrl(originalUrl, false, mockEnv);

      // Should be a valid URL
      expect(() => new URL(result)).not.toThrow();

      // Should contain blur endpoint
      expect(result).toContain('/api/avatar/blur');

      // Should have url parameter
      const url = new URL(result);
      expect(url.searchParams.get('url')).toBe(originalUrl);
    });
  });

  describe('Default avatar handling', () => {
    const mockEnv = {
      PUBLIC_URL: 'https://test.example.com',
    } as any;

    it('should use gender-specific default avatar for both VIP and free users when no avatar', () => {
      const vipMaleResult = getDisplayAvatarUrl(null, true, mockEnv, 'male');
      const freeMaleResult = getDisplayAvatarUrl(null, false, mockEnv, 'male');
      const vipFemaleResult = getDisplayAvatarUrl(null, true, mockEnv, 'female');
      const freeFemaleResult = getDisplayAvatarUrl(null, false, mockEnv, 'female');

      expect(vipMaleResult).toBe('https://test.example.com/assets/default-avatar-male.png');
      expect(freeMaleResult).toBe('https://test.example.com/assets/default-avatar-male.png');
      expect(vipFemaleResult).toBe('https://test.example.com/assets/default-avatar-female.png');
      expect(freeFemaleResult).toBe('https://test.example.com/assets/default-avatar-female.png');
    });
  });
});

describe('Avatar Cache Management', () => {
  const mockEnv = {
    PUBLIC_URL: 'https://test.example.com',
  } as any;

  describe('isAvatarCacheExpired', () => {
    it('should return true if updatedAt is null', () => {
      expect(isAvatarCacheExpired(null)).toBe(true);
    });

    it('should return true if cache is older than 7 days', () => {
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
      expect(isAvatarCacheExpired(eightDaysAgo)).toBe(true);
    });

    it('should return false if cache is within 7 days', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      expect(isAvatarCacheExpired(threeDaysAgo)).toBe(false);
    });

    it('should return false if cache is recent', () => {
      const now = new Date().toISOString();
      expect(isAvatarCacheExpired(now)).toBe(false);
    });
  });

  describe('generateBlurredAvatarUrl', () => {
    it('should generate correct blur proxy URL', () => {
      const originalUrl = 'https://api.telegram.org/file/bot123/photo.jpg';
      const result = generateBlurredAvatarUrl(originalUrl, mockEnv);

      expect(result).toContain('/api/avatar/blur?url=');
      expect(result).toContain(encodeURIComponent(originalUrl));
    });
  });

  describe('getDefaultAvatarUrl', () => {
    it('should return male avatar for male gender', () => {
      const result = getDefaultAvatarUrl(mockEnv, 'male');
      expect(result).toBe('https://test.example.com/assets/default-avatar-male.png');
    });

    it('should return female avatar for female gender', () => {
      const result = getDefaultAvatarUrl(mockEnv, 'female');
      expect(result).toBe('https://test.example.com/assets/default-avatar-female.png');
    });

    it('should return neutral avatar for unknown gender', () => {
      const result = getDefaultAvatarUrl(mockEnv);
      expect(result).toBe('https://test.example.com/assets/default-avatar-neutral.png');
    });
  });
});

describe('Conversation History with Avatar', () => {
  describe('buildHistoryPostContent with VIP status', () => {
    it('should include VIP upgrade hint for free users', async () => {
      const { buildHistoryPostContent } = await import('~/domain/conversation_history');

      const content = buildHistoryPostContent(
        'TEST123',
        1,
        ['📤 2024-01-01 10:00 - 你好'],
        1,
        {
          maskedNickname: '匿名***',
          mbti: 'INTJ',
          bloodType: 'A',
          zodiac: '白羊座',
          matchScore: 85,
        },
        false // Free user
      );

      expect(content).toContain('🔒 升級 VIP 解鎖對方清晰頭像');
      expect(content).toContain('💎 使用 /vip 了解更多');
    });

    it('should NOT include VIP upgrade hint for VIP users', async () => {
      const { buildHistoryPostContent } = await import('~/domain/conversation_history');

      const content = buildHistoryPostContent(
        'TEST123',
        1,
        ['📤 2024-01-01 10:00 - 你好'],
        1,
        {
          maskedNickname: '匿名***',
          mbti: 'INTJ',
          bloodType: 'A',
          zodiac: '白羊座',
          matchScore: 85,
        },
        true // VIP user
      );

      expect(content).not.toContain('🔒 升級 VIP 解鎖對方清晰頭像');
      expect(content).not.toContain('💎 使用 /vip 了解更多');
    });

    it('should include partner info and match score', async () => {
      const { buildHistoryPostContent } = await import('~/domain/conversation_history');

      const content = buildHistoryPostContent(
        'TEST123',
        1,
        ['📤 2024-01-01 10:00 - 你好'],
        1,
        {
          maskedNickname: '匿名***',
          mbti: 'INTJ',
          bloodType: 'A',
          zodiac: '白羊座',
          matchScore: 85,
        },
        false
      );

      expect(content).toContain('👤 對方資料：');
      expect(content).toContain('📝 暱稱：匿名***');
      expect(content).toContain('🧠 MBTI：INTJ');
      expect(content).toContain('🩸 血型：A');
      expect(content).toContain('⭐ 星座：白羊座');
      expect(content).toContain('💫 配對度：85分');
    });
  });
});
