/**
 * URL Whitelist Checker
 *
 * Only allow URLs from whitelisted domains for security.
 */

const WHITELISTED_DOMAINS = ['t.me', 'telegram.org', 'telegram.me'];

const VIP_WHITELISTED_DOMAINS = [
  'youtube.com',
  'youtu.be',
  'twitter.com',
  'x.com',
  'instagram.com',
  'facebook.com',
  'fb.com',
  'tiktok.com',
  'linkedin.com',
  'medium.com',
  'twitch.tv',
  'discord.com',
  'discord.gg',
  'threads.net',
];

/**
 * Extract URLs from text
 */
function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

/**
 * Check if URL is from whitelisted domain
 */
function isWhitelistedUrl(url: string, allowedDomains: string[]): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    return allowedDomains.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Check if text contains only whitelisted URLs
 */
export function checkUrlWhitelist(
  text: string,
  isVip: boolean = false
): {
  allowed: boolean;
  blockedUrls?: string[];
  vipRestrictedUrls?: string[];
} {
  const urls = extractUrls(text);

  if (urls.length === 0) {
    return { allowed: true };
  }

  // Identify blocked URLs based on user status
  const blockedUrls: string[] = [];
  const vipRestrictedUrls: string[] = [];

  for (const url of urls) {
    const isStandard = isWhitelistedUrl(url, WHITELISTED_DOMAINS);
    const isVipOnly = isWhitelistedUrl(url, VIP_WHITELISTED_DOMAINS);

    if (isVip) {
      // VIP can use Standard + VIP domains
      if (!isStandard && !isVipOnly) {
        blockedUrls.push(url);
      }
    } else {
      // Non-VIP can only use Standard domains
      if (!isStandard) {
        if (isVipOnly) {
          vipRestrictedUrls.push(url);
        } else {
          blockedUrls.push(url);
        }
      }
    }
  }

  if (vipRestrictedUrls.length > 0) {
    return {
      allowed: false,
      blockedUrls: [...blockedUrls, ...vipRestrictedUrls], // All blocked
      vipRestrictedUrls, // Specific ones for upsell
    };
  }

  if (blockedUrls.length > 0) {
    return {
      allowed: false,
      blockedUrls,
    };
  }

  return { allowed: true };
}
