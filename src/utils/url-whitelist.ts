/**
 * URL Whitelist Checker
 * 
 * Only allow URLs from whitelisted domains for security.
 */

const WHITELISTED_DOMAINS = [
  't.me',
  'telegram.org',
  'telegram.me',
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
function isWhitelistedUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    return WHITELISTED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Check if text contains only whitelisted URLs
 */
export function checkUrlWhitelist(text: string): {
  allowed: boolean;
  blockedUrls?: string[];
} {
  const urls = extractUrls(text);
  
  if (urls.length === 0) {
    return { allowed: true };
  }
  
  const blockedUrls = urls.filter(url => !isWhitelistedUrl(url));
  
  if (blockedUrls.length > 0) {
    return {
      allowed: false,
      blockedUrls,
    };
  }
  
  return { allowed: true };
}

