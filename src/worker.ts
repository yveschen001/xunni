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
        // Development endpoints (staging only)
        if (url.pathname === '/api/dev/seed-user' && request.method === 'POST') {
          const { handleSeedUser } = await import('./api/dev');
          return await handleSeedUser(request, env);
        }
        
        if (url.pathname === '/api/dev/delete-fake-users' && request.method === 'POST') {
          const { handleDeleteFakeUsers } = await import('./api/dev');
          return await handleDeleteFakeUsers(request, env);
        }

        return new Response(
          JSON.stringify({
            error: 'API endpoint not found',
          }),
          {
            status: 404,
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
  async scheduled(event: ScheduledEvent, _env: Env): Promise<void> {
    // eslint-disable-next-line no-console
    console.log('[Worker] Scheduled event:', event.cron);

    try {
      // Horoscope push (Every Monday at 9:00 UTC)
      // Daily stats (Every day at 00:05 UTC)
      if (event.cron === '5 0 * * *') {
        // eslint-disable-next-line no-console
        console.log('[Worker] Generating daily stats...');
        const { generateDailyStats } = await import('./services/stats');
        await generateDailyStats(env);
      }

      // Broadcast queue (Every 5 minutes)
      if (event.cron === '*/5 * * * *') {
        // eslint-disable-next-line no-console
        console.log('[Worker] Processing broadcast queue...');
        const { processBroadcastQueue } = await import('./services/broadcast');
        await processBroadcastQueue(env);
      }
    } catch (error) {
      console.error('[Worker] Scheduled event error:', error);
    }
  },
};

