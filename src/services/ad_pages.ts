/**
 * Ad Pages Service
 * Serves static HTML pages for ad playback with server-side i18n injection
 */

import adHtml from '../../public/ad.html';
import adTestHtml from '../../public/ad-test.html';
import { createI18n, loadTranslations } from '~/i18n';

/**
 * Serve ad page
 */
export async function serveAdPage(request: Request, env: any): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  let html = pathname === '/ad-test.html' ? adTestHtml : adHtml;

  // Get language from query param
  let lang = url.searchParams.get('lang') || 'zh-TW';
  
  // Normalize lang code (e.g. en-US -> en) if exact match not found
  // Note: We use KV loading now, so simple check isn't enough without loading.
  // We assume supported languages.
  const baseLang = lang.split('-')[0];
  if (baseLang === 'zh') {
      if (lang !== 'zh-CN') lang = 'zh-TW';
  } else if (['en', 'ja', 'ko', 'vi', 'th', 'id', 'ms', 'tl', 'hi', 'ar', 'ur', 'fa', 'he', 'tr', 'ru', 'uk', 'pl', 'cs', 'ro', 'hu', 'bn', 'hr', 'sk', 'sl', 'sr', 'mk', 'sq', 'el', 'de', 'fr', 'es', 'it', 'pt', 'nl', 'sv', 'no', 'da', 'fi'].includes(baseLang)) {
      lang = baseLang;
  }
  
  // Load translations from KV
  await loadTranslations(env, lang);
  const i18n = createI18n(lang);
  
  // Get adPage translations object
  const t = i18n.getObject('adPage') || {};

  // 1. Replace static HTML placeholders
  html = html.replace(/{{LANG}}/g, lang);
  // Default values for critical fields if translation missing
  html = html.replace(/{{TITLE}}/g, t.TITLE || 'Watch Ad');
  html = html.replace(/{{SUBTITLE}}/g, t.SUBTITLE || 'Watch to earn +1 quota');
  html = html.replace(/{{LOADING}}/g, t.LOADING || 'Loading...');
  html = html.replace(/{{FOOTER}}/g, t.FOOTER || 'XunNi');

  // 2. Inject Translations JSON for JS logic
  const jsonString = JSON.stringify(t);
  html = html.replace(/{{TRANSLATIONS_JSON}}/g, jsonString);

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
