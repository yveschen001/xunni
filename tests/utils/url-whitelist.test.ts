import { describe, it, expect } from 'vitest';
import { checkUrlWhitelist } from '../../src/utils/url-whitelist';

describe('URL Whitelist', () => {
  it('should allow whitelisted domains for everyone', () => {
    const text = 'Check this out: https://t.me/somechannel';
    const result = checkUrlWhitelist(text, false);
    expect(result.allowed).toBe(true);
  });

  it('should block non-whitelisted domains for everyone', () => {
    const text = 'Visit https://malicious.site';
    const result = checkUrlWhitelist(text, true); // Even VIP blocked
    expect(result.allowed).toBe(false);
    expect(result.blockedUrls).toContain('https://malicious.site');
  });

  it('should block VIP domains for non-VIP users', () => {
    const text = 'Watch this: https://youtube.com/watch?v=123';
    const result = checkUrlWhitelist(text, false);
    expect(result.allowed).toBe(false);
    expect(result.vipRestrictedUrls).toContain('https://youtube.com/watch?v=123');
  });

  it('should allow VIP domains for VIP users', () => {
    const text = 'Watch this: https://youtube.com/watch?v=123';
    const result = checkUrlWhitelist(text, true);
    expect(result.allowed).toBe(true);
  });

  it('should handle mixed URLs correctly (Non-VIP)', () => {
    const text = 'https://t.me/ok and https://twitter.com/restricted';
    const result = checkUrlWhitelist(text, false);
    expect(result.allowed).toBe(false);
    expect(result.vipRestrictedUrls).toContain('https://twitter.com/restricted');
  });

  it('should handle mixed URLs correctly (VIP)', () => {
    const text = 'https://t.me/ok and https://twitter.com/allowed';
    const result = checkUrlWhitelist(text, true);
    expect(result.allowed).toBe(true);
  });
});
