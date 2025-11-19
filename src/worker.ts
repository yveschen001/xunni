/**
 * Cloudflare Worker Entry Point
 * Based on @doc/SPEC.md
 */

import type { Env } from '~/types';
import { handleWebhook } from './router';
import { serveLegalDocument } from './legal/documents';

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

      // Legal documents (static HTML files)
      if (url.pathname === '/privacy.html') {
        return serveLegalDocument('privacy');
      }
      if (url.pathname === '/terms.html') {
        return serveLegalDocument('terms');
      }
      if (url.pathname === '/community.html') {
        return serveLegalDocument('community');
      }

      // Ad pages (static HTML files)
      if (url.pathname === '/ad.html' || url.pathname === '/ad-test.html') {
        const { serveAdPage } = await import('./services/ad_pages');
        return serveAdPage(url.pathname);
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
        // Ad completion callback
        if (url.pathname === '/api/ad/complete' && request.method === 'POST') {
          const { handleAdComplete } = await import('./telegram/handlers/ad_reward');
          const userId = url.searchParams.get('user');
          const token = url.searchParams.get('token');
          const provider = url.searchParams.get('provider');

          if (!userId || !token || !provider) {
            return new Response(JSON.stringify({ success: false, message: 'Missing parameters' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          const result = await handleAdComplete(userId, token, provider, env);
          return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Ad error callback
        if (url.pathname === '/api/ad/error' && request.method === 'POST') {
          const { handleAdError } = await import('./telegram/handlers/ad_reward');
          const userId = url.searchParams.get('user');
          const provider = url.searchParams.get('provider');
          const error = url.searchParams.get('error');

          if (!userId || !provider || !error) {
            return new Response(JSON.stringify({ success: false, message: 'Missing parameters' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          await handleAdError(userId, provider, error, env);
          return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Development endpoints (staging only)
        if (url.pathname === '/api/dev/seed-user' && request.method === 'POST') {
          const { handleSeedUser } = await import('./api/dev');
          return await handleSeedUser(request, env);
        }

        if (url.pathname === '/api/dev/delete-fake-users' && request.method === 'POST') {
          const { handleDeleteFakeUsers } = await import('./api/dev');
          return await handleDeleteFakeUsers(request, env);
        }

        // Test channel membership check
        if (url.pathname === '/api/test/check-channel' && request.method === 'POST') {
          const { checkChannelMembership } = await import('./services/channel_membership_check');
          await checkChannelMembership(env);
          return new Response(
            JSON.stringify({
              success: true,
              message: 'Channel membership check triggered',
            }),
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
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

      // Daily reports to super admins (Every day at 09:00 UTC = 17:00 Taipei)
      if (event.cron === '0 9 * * *') {
        // eslint-disable-next-line no-console
        console.log('[Worker] Sending daily reports to super admins...');
        const { sendDailyReportsToSuperAdmins } = await import('./services/daily_reports');
        await sendDailyReportsToSuperAdmins(env);
      }

      // Broadcast queue (Every 5 minutes)
      if (event.cron === '*/5 * * * *') {
        // eslint-disable-next-line no-console
        console.log('[Worker] Processing broadcast queue...');
        const { processBroadcastQueue } = await import('./services/broadcast');
        await processBroadcastQueue(env);
      }

      // Check and auto-disable expired maintenance mode (Every minute)
      if (event.cron === '*/5 * * * *') {
        // eslint-disable-next-line no-console
        console.log('[Worker] Checking maintenance mode...');
        const { checkAndDisableExpiredMaintenance } = await import('./services/maintenance');
        await checkAndDisableExpiredMaintenance(env);
      }

      // Check channel membership (Every hour)
      if (event.cron === '0 * * * *') {
        // eslint-disable-next-line no-console
        console.log('[Worker] Checking channel membership...');
        const { checkChannelMembership } = await import('./services/channel_membership_check');
        await checkChannelMembership(env);
      }
    } catch (error) {
      console.error('[Worker] Scheduled event error:', error);
    }
  },
};
