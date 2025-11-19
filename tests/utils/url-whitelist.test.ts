/**
 * URL Whitelist Tests
 */

import { describe, it, expect } from 'vitest';
import { checkUrlWhitelist } from '~/utils/url-whitelist';

describe('checkUrlWhitelist', () => {
  it('should allow messages without URLs', () => {
    const result = checkUrlWhitelist('Hello world!');
    expect(result.allowed).toBe(true);
  });

  it('should allow t.me links', () => {
    const result = checkUrlWhitelist('Check this: https://t.me/xunnibot');
    expect(result.allowed).toBe(true);
  });

  it('should allow telegram.org links', () => {
    const result = checkUrlWhitelist('Visit https://telegram.org');
    expect(result.allowed).toBe(true);
  });

  it('should deny other domains', () => {
    const result = checkUrlWhitelist('Visit https://google.com');
    expect(result.allowed).toBe(false);
    expect(result.blockedUrls?.length).toBeGreaterThan(0);
  });

  it('should handle multiple URLs', () => {
    const result = checkUrlWhitelist('Visit https://t.me/bot and https://evil.com');
    expect(result.allowed).toBe(false);
  });
});
