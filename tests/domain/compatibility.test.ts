import { describe, it, expect } from 'vitest';
import { CompatibilityEngine } from '../../src/domain/compatibility/engine';
import type { User } from '../../src/domain/user';

describe('CompatibilityEngine', () => {
  const mockUserBase = {
    telegram_id: '123',
    role: 'user',
    is_vip: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as User;

  describe('Zodiac Match', () => {
    it('should return fire element targets for Aries (Fire)', () => {
      const user = { ...mockUserBase, zodiac_sign: 'aries' } as User;
      const result = CompatibilityEngine.getRecommendation(user, 'zodiac');

      expect(result.isValid).toBe(true);
      expect(result.topic).toBe('zodiac');
      expect(result.userAttribute).toBe('aries');
      expect(result.reasonKey).toBe('match.reason.zodiac.fire_affinity');
      // Fire targets: Fire + Air.
      // Expect some fire/air signs in recommendation
      expect(result.recommendedAttributes.length).toBeGreaterThan(0);
    });

    it('should return invalid for missing zodiac', () => {
      const user = { ...mockUserBase, zodiac_sign: null } as User;
      const result = CompatibilityEngine.getRecommendation(user, 'zodiac');
      expect(result.isValid).toBe(false);
    });
  });

  describe('MBTI Match', () => {
    it('should return NT targets for NF type (ENFP)', () => {
      const user = { ...mockUserBase, mbti_type: 'ENFP' } as User;
      const result = CompatibilityEngine.getRecommendation(user, 'mbti');

      expect(result.isValid).toBe(true);
      expect(result.topic).toBe('mbti');
      expect(result.userAttribute).toBe('ENFP');
      expect(result.reasonKey).toBe('match.reason.mbti.nf_affinity');
      // NF targets: NT + NF
      expect(result.recommendedAttributes).toContain('NT');
    });

    it('should return invalid for missing MBTI', () => {
      const user = { ...mockUserBase, mbti_type: null } as User;
      const result = CompatibilityEngine.getRecommendation(user, 'mbti');
      expect(result.isValid).toBe(false);
    });
  });

  describe('Blood Type Match', () => {
    it('should return O targets for A type', () => {
      const user = { ...mockUserBase, blood_type: 'A' } as User;
      const result = CompatibilityEngine.getRecommendation(user, 'blood');

      expect(result.isValid).toBe(true);
      expect(result.topic).toBe('blood');
      expect(result.userAttribute).toBe('A');
      expect(result.reasonKey).toBe('match.reason.blood.a_affinity');
      expect(result.recommendedAttributes).toContain('O');
    });

    it('should return invalid for unknown blood type', () => {
      const user = { ...mockUserBase, blood_type: 'unknown' } as User;
      const result = CompatibilityEngine.getRecommendation(user, 'blood');
      expect(result.isValid).toBe(false);
    });
  });
});
