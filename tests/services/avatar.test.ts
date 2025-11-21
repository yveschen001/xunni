/**
 * Avatar Service Tests
 */

import { describe, it, expect } from 'vitest';
import { getProcessedAvatarUrl, getDefaultAvatarUrl } from '~/services/avatar';

describe('Avatar Service', () => {
  describe('getProcessedAvatarUrl', () => {
    const testUrl = 'https://api.telegram.org/file/bot123/photos/file_0.jpg';

    it('should return original URL for VIP users', () => {
      const result = getProcessedAvatarUrl(testUrl, true);
      expect(result).toBe(testUrl);
    });

    it('should return blurred URL for free users', () => {
      const result = getProcessedAvatarUrl(testUrl, false);
      expect(result).toContain('images.weserv.nl');
      expect(result).toContain('blur=20');
      expect(result).toContain(encodeURIComponent(testUrl));
    });

    it('should include proper image dimensions in blur URL', () => {
      const result = getProcessedAvatarUrl(testUrl, false);
      expect(result).toContain('w=400');
      expect(result).toContain('h=400');
      expect(result).toContain('fit=cover');
    });
  });

  describe('getDefaultAvatarUrl', () => {
    it('should return a data URL', () => {
      const result = getDefaultAvatarUrl();
      expect(result).toMatch(/^data:image\/svg\+xml;base64,/);
    });

    it('should return a valid base64 encoded SVG', () => {
      const result = getDefaultAvatarUrl();
      const base64Part = result.replace('data:image/svg+xml;base64,', '');
      
      // Should be valid base64
      expect(() => {
        const decoded = Buffer.from(base64Part, 'base64').toString('utf-8');
        expect(decoded).toContain('<svg');
        expect(decoded).toContain('</svg>');
      }).not.toThrow();
    });

    it('should contain user icon elements', () => {
      const result = getDefaultAvatarUrl();
      const base64Part = result.replace('data:image/svg+xml;base64,', '');
      const decoded = Buffer.from(base64Part, 'base64').toString('utf-8');
      
      // Should have circle (head) and ellipse (body)
      expect(decoded).toContain('<circle');
      expect(decoded).toContain('<ellipse');
    });
  });
});

