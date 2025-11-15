/**
 * Cloudflare Worker Entry Point
 * Based on @doc/SPEC.md
 */

import type { Env } from '~/types';
import { handleWebhook } from './router';

export default {
  /**
   * Handle HTTP requests
   */
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    try {
      // Webhook endpoint
      if (url.pathname === '/webhook' && request.method === 'POST') {
        return await handleWebhook(request, env);
      }

      // Health check
      if (url.pathname === '/' || url.pathname === '/health') {
        return new Response(
          JSON.stringify({
            status: 'ok',
            service: 'xunni-bot',
            version: '1.0.0',
            environment: env.ENVIRONMENT,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // API endpoints
      if (url.pathname.startsWith('/api/')) {
        return new Response(
          JSON.stringify({
            error: 'API endpoints not yet implemented',
          }),
          {
            status: 501,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // 404
      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('[Worker] Error:', error);
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },

  /**
   * Handle scheduled events (Cron)
   */
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    console.log('[Worker] Scheduled event:', event.cron);

    try {
      // Horoscope push (Every Monday at 9:00 UTC)
      if (event.cron === '0 9 * * 1') {
        console.log('[Worker] Running horoscope push...');
        // TODO: Implement horoscope push
      }

      // Broadcast queue (Every 5 minutes)
      if (event.cron === '*/5 * * * *') {
        console.log('[Worker] Processing broadcast queue...');
        // TODO: Implement broadcast queue processing
      }
    } catch (error) {
      console.error('[Worker] Scheduled event error:', error);
    }
  },
};

