/**
 * Legal Documents URLs Configuration
 *
 * All legal documents are provided in English only and are the legally binding version.
 *
 * Update this file to modify all legal document URLs across the application.
 */

/**
 * Base URL for legal documents
 *
 * Options:
 * 1. Use Workers URL (default, free, immediate):
 *    'https://xunni-bot-staging.your-subdomain.workers.dev' (staging)
 *    'https://xunni-bot.your-subdomain.workers.dev' (production)
 *
 * 2. Use custom domain (if configured):
 *    'https://xunni.app'
 *
 * 3. Use Cloudflare Pages URL:
 *    'https://xunni-legal.pages.dev'
 */

// Base URL for legal documents (hosted on GitHub Pages)
const BASE_URL = 'https://yveschen001.github.io/xunni-web/en';

/**
 * Legal document URLs
 *
 * These URLs point to the English-only legal documents.
 * All documents are hosted as static HTML files in the public/ directory.
 */
export const LEGAL_URLS = {
  /**
   * Privacy Policy
   * Explains data collection, usage, and user rights (GDPR/CCPA compliant)
   */
  PRIVACY_POLICY: `${BASE_URL}/privacy.html`,

  /**
   * Terms of Service
   * Defines service rules, disclaimers, and limitation of liability
   */
  TERMS_OF_SERVICE: `${BASE_URL}/terms.html`,

  /**
   * Community Guidelines
   * Outlines acceptable behavior, prohibited conduct, and penalties
   */
  COMMUNITY_GUIDELINES: `${BASE_URL}/community.html`,
} as const;

/**
 * Legal notice text for different languages
 * Informs users that legal documents are in English only
 */
export const LEGAL_NOTICE = {
  en: '📋 Legal documents are provided in English only.',
  zh: '📋 法律文檔僅提供英文版本。',
  ja: '📋 法的文書は英語版のみ提供されています。',
  ko: '📋 법적 문서는 영어로만 제공됩니다.',
  es: '📋 Los documentos legales se proporcionan solo en inglés.',
  fr: '📋 Les documents juridiques sont fournis en anglais uniquement.',
  de: '📋 Rechtsdokumente werden nur auf Englisch bereitgestellt.',
  it: '📋 I documenti legali sono forniti solo in inglese.',
  pt: '📋 Os documentos legais são fornecidos apenas em inglês.',
  ru: '📋 Юридические документы предоставляются только на английском языке.',
  ar: '📋 يتم توفير الوثائق القانونية باللغة الإنجليزية فقط.',
  hi: '📋 कानूनी दस्तावेज़ केवल अंग्रेज़ी में उपलब्ध हैं।',
  id: '📋 Dokumen hukum hanya tersedia dalam bahasa Inggris.',
  th: '📋 เอกสารทางกฎหมายมีให้เฉพาะภาษาอังกฤษเท่านั้น',
  vi: '📋 Tài liệu pháp lý chỉ được cung cấp bằng tiếng Anh.',
  tr: '📋 Yasal belgeler yalnızca İngilizce olarak sağlanmaktadır.',
  pl: '📋 Dokumenty prawne są dostępne tylko w języku angielskim.',
  uk: '📋 Юридичні документи надаються лише англійською мовою.',
  nl: '📋 Juridische documenten worden alleen in het Engels verstrekt.',
  sv: '📋 Juridiska dokument tillhandahålls endast på engelska.',
  cs: '📋 Právní dokumenty jsou poskytovány pouze v angličtině.',
  ro: '📋 Documentele juridice sunt furnizate doar în limba engleză.',
  hu: '📋 A jogi dokumentumok csak angol nyelven állnak rendelkezésre.',
  el: '📋 Τα νομικά έγγραφα παρέχονται μόνο στα αγγλικά.',
  fa: '📋 اسناد حقوقی فقط به زبان انگلیسی ارائه می‌شوند.',
  he: '📋 המסמכים המשפטיים מסופקים באנגלית בלבד.',
  bn: '📋 আইনি নথি শুধুমাত্র ইংরেজিতে প্রদান করা হয়।',
  ms: '📋 Dokumen undang-undang disediakan dalam bahasa Inggeris sahaja.',
  tl: '📋 Ang mga legal na dokumento ay ibinibigay sa Ingles lamang.',
  sw: '📋 Hati za kisheria zinapatikana kwa Kiingereza tu.',
  ta: '📋 சட்ட ஆவணங்கள் ஆங்கிலத்தில் மட்டுமே வழங்கப்படுகின்றன.',
  te: '📋 చట్టపరమైన పత్రాలు ఆంగ్లంలో మాత్రమే అందించబడతాయి.',
  ur: '📋 قانونی دستاویزات صرف انگریزی میں فراہم کی جاتی ہیں۔',
  ml: '📋 നിയമപരമായ രേഖകൾ ഇംഗ്ലീഷിൽ മാത്രമേ ലഭ്യമാകൂ.',
} as const;

/**
 * Type for supported languages
 */
export type SupportedLanguage = keyof typeof LEGAL_NOTICE;

/**
 * Get legal notice text for a specific language
 * Falls back to English if language not supported
 */
export function getLegalNotice(language: string): string {
  const lang = language.toLowerCase() as SupportedLanguage;
  return LEGAL_NOTICE[lang] || LEGAL_NOTICE.en;
}

/**
 * Social Media and Contact Links Configuration
 *
 * Update these links when you have official social media accounts.
 * Set to null or empty string to hide the link.
 */
export const SOCIAL_LINKS = {
  /**
   * Support Bot (Telegram)
   * Example: '@xunni_support' or 'https://t.me/xunni_support'
   */
  SUPPORT_BOT: '@xunni_support',

  /**
   * Official Channel (Telegram)
   * Example: '@xunni_official' or 'https://t.me/xunni_official'
   */
  OFFICIAL_CHANNEL: null as string | null,

  /**
   * Official Group (Telegram)
   * Example: '@xunni_group' or 'https://t.me/xunni_group'
   */
  OFFICIAL_GROUP: null as string | null,

  /**
   * Twitter/X Account
   * Example: 'https://twitter.com/xunni_bot'
   */
  TWITTER: null as string | null,

  /**
   * Instagram Account
   * Example: 'https://instagram.com/xunni_bot'
   */
  INSTAGRAM: null as string | null,

  /**
   * Facebook Page
   * Example: 'https://facebook.com/xunni.bot'
   */
  FACEBOOK: null as string | null,

  /**
   * Discord Server
   * Example: 'https://discord.gg/xunni'
   */
  DISCORD: null as string | null,

  /**
   * GitHub Repository
   * Example: 'https://github.com/xunni/bot'
   */
  GITHUB: null as string | null,

  /**
   * Support Email
   * Example: 'support@xunni.app'
   */
  SUPPORT_EMAIL: 'support@xunni.app',

  /**
   * Privacy Email
   * Example: 'privacy@xunni.app'
   */
  PRIVACY_EMAIL: 'privacy@xunni.app',

  /**
   * Official Website
   * Example: 'https://xunni.app'
   */
  WEBSITE: null as string | null,
} as const;

/**
 * Check if a social link is configured
 */
export function hasSocialLink(key: keyof typeof SOCIAL_LINKS): boolean {
  const link = SOCIAL_LINKS[key];
  return link !== null && link !== '';
}

/**
 * Get a social link (returns null if not configured)
 */
export function getSocialLink(key: keyof typeof SOCIAL_LINKS): string | null {
  return SOCIAL_LINKS[key];
}
