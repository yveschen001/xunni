/**
 * Ad Pages Service
 * Serves static HTML pages for ad playback
 */

import adHtml from '../../public/ad.html';
import adTestHtml from '../../public/ad-test.html';

/**
 * Serve ad page
 */
export function serveAdPage(pathname: string): Response {
  const html = pathname === '/ad-test.html' ? adTestHtml : adHtml;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
