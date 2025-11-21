/**
 * Risk Domain Logic
 * Based on @doc/SPEC.md and @doc/MODULE_DESIGN.md
 *
 * Manages risk scoring, content moderation, and ban logic.
 */

import type { RiskCheckResult } from '~/types';

// ============================================================================
// Constants
// ============================================================================

// Risk score thresholds
export const RISK_SCORE_LOW = 20;
export const RISK_SCORE_MEDIUM = 50;
export const RISK_SCORE_HIGH = 80;
export const RISK_SCORE_AUTO_BAN = 100;

// Risk score increments
export const RISK_INCREMENT_URL_BLOCKED = 10;
export const RISK_INCREMENT_SENSITIVE_WORD = 15;
export const RISK_INCREMENT_AI_BLOCKED = 20;
export const RISK_INCREMENT_REPORTED = 25;
export const RISK_INCREMENT_MULTIPLE_REPORTS = 50;

// Sensitive words (categorized for better management)

// 1. Scam & Financial (诈骗金融类)
const SCAM_WORDS = [
  // 中文
  '詐騙', '騙錢', '投資', '賺錢', '匯款', '轉帳',
  '銀行帳號', '信用卡', '密碼', '传销', '金融',
  '理财', '股票', '期货', '外汇', '比特币',
  // 英文
  'password', 'scam', 'fraud', 'bitcoin', 'crypto',
  'investment', 'money', 'transfer', 'bank account',
];

// 2. Contact Information (联系方式类)
const CONTACT_WORDS = [
  // 中文
  '加line', '加微信', '加qq', 'line:', 'wechat:', 'qq:',
  '手机号', '电话', '联系我',
  // 英文
  'whatsapp', 'telegram', 'phone', 'email', 'contact me',
];

// 3. Sexual Content (色情低俗类)
const SEXUAL_WORDS = [
  // 中文
  '约炮', '一夜情', '性服务', '援交', '色情',
  // 英文
  'sex', 'porn', 'xxx', 'nude', 'hookup',
  // 日文
  'エロ', 'セックス',
  // 韩文
  '섹스', '야동',
];

// 4. Violence & Threats (暴力威胁类)
const VIOLENCE_WORDS = [
  // 中文
  '杀', '死', '自杀', '跳楼', '暴力',
  // 英文
  'kill', 'die', 'suicide', 'murder', 'violence',
];

// Combined sensitive words list
export const SENSITIVE_WORDS = [
  ...SCAM_WORDS,
  ...CONTACT_WORDS,
  ...SEXUAL_WORDS,
  ...VIOLENCE_WORDS,
];

/**
 * Get risk score for a specific sensitive word based on its category
 */
export function getSensitiveWordRiskScore(word: string): number {
  const lowerWord = word.toLowerCase();
  
  if (VIOLENCE_WORDS.some(w => w.toLowerCase() === lowerWord)) return 30;
  if (SEXUAL_WORDS.some(w => w.toLowerCase() === lowerWord)) return 25;
  if (SCAM_WORDS.some(w => w.toLowerCase() === lowerWord)) return 20;
  if (CONTACT_WORDS.some(w => w.toLowerCase() === lowerWord)) return 15;
  
  return 15; // Default
}

// URL whitelist (allowed domains)
export const URL_WHITELIST = [
  'telegram.me',
  't.me',
  'youtube.com',
  'youtu.be',
  'spotify.com',
  'instagram.com',
  'twitter.com',
  'x.com',
];

// ============================================================================
// URL Detection & Validation
// ============================================================================

/**
 * Extract URLs from text
 */
export function extractURLs(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-z0-9-]+\.[a-z]{2,}[^\s]*)/gi;
  const matches = text.match(urlRegex);
  return matches || [];
}

/**
 * Check if URL is in whitelist
 */
export function isURLWhitelisted(url: string): boolean {
  const normalizedURL = url.toLowerCase();

  return URL_WHITELIST.some((domain) => {
    return (
      normalizedURL.includes(domain) ||
      normalizedURL.includes(`www.${domain}`) ||
      normalizedURL.includes(`https://${domain}`) ||
      normalizedURL.includes(`http://${domain}`)
    );
  });
}

/**
 * Check if text contains non-whitelisted URLs
 */
export function containsBlockedURL(text: string): boolean {
  const urls = extractURLs(text);

  for (const url of urls) {
    if (!isURLWhitelisted(url)) {
      return true;
    }
  }

  return false;
}

// ============================================================================
// Sensitive Word Detection
// ============================================================================

/**
 * Check if text contains sensitive words
 * Returns found words and calculated risk score
 */
export function containsSensitiveWords(text: string): { 
  found: boolean; 
  words: string[];
  riskScore: number;
} {
  const lowerText = text.toLowerCase();
  const foundWords: string[] = [];
  let totalRiskScore = 0;

  for (const word of SENSITIVE_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      foundWords.push(word);
      totalRiskScore += getSensitiveWordRiskScore(word);
    }
  }

  return {
    found: foundWords.length > 0,
    words: foundWords,
    riskScore: Math.min(totalRiskScore, 50), // Cap at 50 per check
  };
}

// ============================================================================
// Local Content Moderation
// ============================================================================

/**
 * Perform local content moderation (before AI check)
 * Returns risk check result
 */
export function performLocalModeration(text: string): RiskCheckResult {
  const reasons: string[] = [];
  let riskScore = 0;
  let shouldBlock = false;

  // Check for sensitive words (using category-based risk scoring)
  const sensitiveCheck = containsSensitiveWords(text);
  if (sensitiveCheck.found) {
    reasons.push('包含敏感詞彙');
    riskScore += sensitiveCheck.riskScore;
    shouldBlock = true; // Always block sensitive words
  }

  return {
    is_safe: !shouldBlock,
    risk_score: riskScore,
    reasons,
    should_block: shouldBlock,
  };
}

// ============================================================================
// Risk Score Management
// ============================================================================

/**
 * Calculate new risk score after adding increment
 */
export function addRiskScore(currentScore: number, increment: number): number {
  return Math.min(currentScore + increment, 200); // Cap at 200
}

/**
 * Check if risk score triggers auto-ban
 */
export function shouldAutoBan(riskScore: number): boolean {
  return riskScore >= RISK_SCORE_AUTO_BAN;
}

/**
 * Get risk level from score
 */
export function getRiskLevel(riskScore: number): 'safe' | 'low' | 'medium' | 'high' | 'critical' {
  if (riskScore === 0) return 'safe';
  if (riskScore < RISK_SCORE_LOW) return 'low';
  if (riskScore < RISK_SCORE_MEDIUM) return 'medium';
  if (riskScore < RISK_SCORE_HIGH) return 'high';
  return 'critical';
}

// ============================================================================
// Report & Ban Logic
// ============================================================================

/**
 * Calculate risk increment from report count
 */
export function calculateReportRiskIncrement(reportCount: number): number {
  if (reportCount === 1) return RISK_INCREMENT_REPORTED;
  if (reportCount === 2) return RISK_INCREMENT_REPORTED * 2;
  if (reportCount >= 3) return RISK_INCREMENT_MULTIPLE_REPORTS;
  return 0;
}

/**
 * Check if user should be banned based on report count
 */
export function shouldBanFromReports(reportCount: number, riskScore: number): boolean {
  // Auto-ban if 3+ reports within 24 hours
  if (reportCount >= 3) return true;

  // Auto-ban if risk score is critical
  if (shouldAutoBan(riskScore)) return true;

  return false;
}

/**
 * Calculate ban duration from ban count
 */
export function calculateBanDuration(banCount: number): number | null {
  if (banCount === 1) return 1; // 1 day
  if (banCount === 2) return 7; // 1 week
  if (banCount === 3) return 30; // 1 month
  return null; // Permanent ban
}

/**
 * Calculate ban expiration date
 */
export function calculateBanExpiration(durationDays: number | null): string | null {
  if (durationDays === null) {
    return null; // Permanent ban
  }

  const now = new Date();
  now.setDate(now.getDate() + durationDays);
  return now.toISOString();
}

// ============================================================================
// AI Moderation Result Processing
// ============================================================================

/**
 * Process AI moderation result
 * Returns risk check result
 */
export function processAIModerationResult(
  aiResult: { flagged: boolean; categories?: string[]; score?: number },
  localResult: RiskCheckResult
): RiskCheckResult {
  if (!aiResult.flagged) {
    return localResult; // AI says it's safe, use local result
  }

  // AI flagged the content
  const reasons = [...localResult.reasons];
  let riskScore = localResult.risk_score;

  if (aiResult.categories && aiResult.categories.length > 0) {
    reasons.push(`AI flagged: ${aiResult.categories.join(', ')}`);
  } else {
    reasons.push('AI flagged as inappropriate');
  }

  riskScore += RISK_INCREMENT_AI_BLOCKED;

  return {
    is_safe: false,
    risk_score: riskScore,
    reasons,
    should_block: true,
  };
}

// ============================================================================
// Anti-Fraud Test Scoring
// ============================================================================

/**
 * Calculate anti-fraud test score
 * Returns score out of 100
 */
export function calculateAntiFraudScore(answers: Record<string, string>): number {
  // This is a placeholder - actual implementation would have real questions
  // For now, return a random score between 60-100
  const correctAnswers = Object.values(answers).filter((a) => a === 'correct').length;
  const totalQuestions = Object.keys(answers).length;

  if (totalQuestions === 0) return 0;

  return Math.round((correctAnswers / totalQuestions) * 100);
}

/**
 * Check if anti-fraud score is passing
 */
export function isAntiFraudPassing(score: number): boolean {
  return score >= 60;
}
