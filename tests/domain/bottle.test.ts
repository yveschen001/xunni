/**
 * Bottle Domain Tests
 */

import { describe, it, expect } from 'vitest';
import { getBottleQuota, canThrowBottle, canCatchBottle } from '~/domain/bottle';

describe('getBottleQuota', () => {
  it('should return 3 for free users without invite bonus', () => {
    const result = getBottleQuota(false, 0);
    expect(result.quota).toBe(3);
  });

  it('should return 30 for VIP users without invite bonus', () => {
    const result = getBottleQuota(true, 0);
    expect(result.quota).toBe(30);
  });

  it('should add invite bonus for free users', () => {
    const result = getBottleQuota(false, 5);
    expect(result.quota).toBe(8); // 3 + 5
  });

  it('should add invite bonus for VIP users', () => {
    const result = getBottleQuota(true, 10);
    expect(result.quota).toBe(40); // 30 + 10
  });

  it('should cap free users at 10', () => {
    const result = getBottleQuota(false, 20);
    expect(result.quota).toBe(10); // Capped at 10
  });

  it('should cap VIP users at 100', () => {
    const result = getBottleQuota(true, 100);
    expect(result.quota).toBe(100); // Capped at 100
  });
});

describe('canThrowBottle', () => {
  it('should allow throw if under quota', () => {
    expect(canThrowBottle(0, false, 0)).toBe(true); // 0/3
    expect(canThrowBottle(2, false, 0)).toBe(true); // 2/3
    expect(canThrowBottle(29, true, 0)).toBe(true); // 29/30
  });

  it('should deny throw if at quota', () => {
    expect(canThrowBottle(3, false, 0)).toBe(false); // 3/3
    expect(canThrowBottle(30, true, 0)).toBe(false); // 30/30
  });

  it('should deny throw if over quota', () => {
    expect(canThrowBottle(4, false, 0)).toBe(false); // 4/3
    expect(canThrowBottle(31, true, 0)).toBe(false); // 31/30
  });

  it('should consider invite bonus', () => {
    expect(canThrowBottle(5, false, 5)).toBe(true); // 5/8 (3+5)
    expect(canThrowBottle(8, false, 5)).toBe(false); // 8/8 (3+5)
  });
});

describe('canCatchBottle', () => {
  it('should allow catch if under quota', () => {
    expect(canCatchBottle(0, false, 0)).toBe(true); // 0/3
    expect(canCatchBottle(2, false, 0)).toBe(true); // 2/3
    expect(canCatchBottle(29, true, 0)).toBe(true); // 29/30
  });

  it('should deny catch if at quota', () => {
    expect(canCatchBottle(3, false, 0)).toBe(false); // 3/3
    expect(canCatchBottle(30, true, 0)).toBe(false); // 30/30
  });

  it('should deny catch if over quota', () => {
    expect(canCatchBottle(4, false, 0)).toBe(false); // 4/3
    expect(canCatchBottle(31, true, 0)).toBe(false); // 31/30
  });

  it('should consider invite bonus', () => {
    expect(canCatchBottle(5, false, 5)).toBe(true); // 5/8 (3+5)
    expect(canCatchBottle(8, false, 5)).toBe(false); // 8/8 (3+5)
  });
});

