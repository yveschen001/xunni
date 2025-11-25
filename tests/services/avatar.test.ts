/**
 * Avatar Service Tests
 */

import { describe, it, expect } from 'vitest';
import {
  generateBlurredAvatarUrl,
  getDefaultAvatarUrl,
  getDisplayAvatarUrl,
  isAvatarCacheExpired,
} from '~/services/avatar';
import type { Env } from '~/types';

describe('Avatar Service', () => {
  const mockEnv = {
    PUBLIC_URL: 'https://example.com',
  } as Env;

  describe('generateBlurredAvatarUrl', () => {
    it('should return blur proxy URL with original encoded', () => {
      const originalUrl = 'https://cdn.telegram.org/file.jpg';
      const result = generateBlurredAvatarUrl(originalUrl, mockEnv);

      expect(result).toBe(
        `${mockEnv.PUBLIC_URL}/api/avatar/blur?url=${encodeURIComponent(originalUrl)}`
      );
    });
  });

  describe('getDefaultAvatarUrl', () => {
    it('should return gender-specific assets', () => {
      expect(getDefaultAvatarUrl(mockEnv, 'male')).toBe(
        `${mockEnv.PUBLIC_URL}/assets/default-avatar-male.png`
      );
      expect(getDefaultAvatarUrl(mockEnv, 'female')).toBe(
        `${mockEnv.PUBLIC_URL}/assets/default-avatar-female.png`
      );
      expect(getDefaultAvatarUrl(mockEnv)).toBe(
        `${mockEnv.PUBLIC_URL}/assets/default-avatar-neutral.png`
      );
    });
  });

  describe('getDisplayAvatarUrl', () => {
    const originalUrl = 'https://cdn.telegram.org/photo.jpg';

    it('should return default avatar when no original URL', () => {
      const result = getDisplayAvatarUrl(null, false, mockEnv, 'male');
      expect(result).toBe(`${mockEnv.PUBLIC_URL}/assets/default-avatar-male.png`);
    });

    it('should return original URL for VIP users', () => {
      const result = getDisplayAvatarUrl(originalUrl, true, mockEnv);
      expect(result).toBe(originalUrl);
    });

    it('should return blurred URL for free users', () => {
      const result = getDisplayAvatarUrl(originalUrl, false, mockEnv);
      expect(result).toContain('/api/avatar/blur?url=');
      expect(result).toContain(encodeURIComponent(originalUrl));
    });
  });

  describe('isAvatarCacheExpired', () => {
    it('should return true for missing updatedAt', () => {
      expect(isAvatarCacheExpired(null)).toBe(true);
    });

    it('should return false for recent cache', () => {
      const recent = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago
      expect(isAvatarCacheExpired(recent)).toBe(false);
    });

    it('should return true for cache older than 7 days', () => {
      const old = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(); // 8 days ago
      expect(isAvatarCacheExpired(old)).toBe(true);
    });
  });
});
