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

      // Subscription export endpoint (GDPR compliance)
      if (url.pathname === '/subscription-export' && request.method === 'POST') {
        const { handleSubscriptionExport } = await import('./api/subscription_export');
        return await handleSubscriptionExport(request, env);
      }

      // API endpoints
      if (url.pathname.startsWith('/api/')) {
        // Avatar blur proxy
        if (url.pathname === '/api/avatar/blur' && request.method === 'GET') {
          const { handleAvatarBlur } = await import('./api/avatar_blur');
          return await handleAvatarBlur(request, env);
        }

        // Ad start callback
        if (url.pathname === '/api/ad/start' && request.method === 'POST') {
          const { handleAdStart } = await import('./telegram/handlers/ad_reward');
          const userId = url.searchParams.get('user');
          const token = url.searchParams.get('token');
          const provider = url.searchParams.get('provider');

          if (!userId || !token || !provider) {
            return new Response(JSON.stringify({ success: false, message: 'Missing parameters' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          const result = await handleAdStart(userId, token, provider, env);
          return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

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
          const token = url.searchParams.get('token');
          const provider = url.searchParams.get('provider');
          const error = url.searchParams.get('error');

          if (!userId || !token || !provider || !error) {
            return new Response(JSON.stringify({ success: false, message: 'Missing parameters' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          await handleAdError(userId, token, provider, error, env);
          return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Avatar blur endpoint
        if (url.pathname === '/api/avatar/blur' && request.method === 'GET') {
          const { handleAvatarBlur } = await import('./api/avatar_blur');
          return await handleAvatarBlur(request);
        }

        // Development endpoints (staging only)
        if (url.pathname === '/api/dev/seed-user' && request.method === 'POST') {
          const { handleSeedUser } = await import('./api/dev');
          return await handleSeedUser(request, env);
        }

        if (url.pathname === '/api/dev/seed-conversation' && request.method === 'POST') {
          const { handleSeedConversation } = await import('./api/dev');
          return await handleSeedConversation(request, env);
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

        // MoonPacket API
        if (url.pathname === '/api/moonpacket/check' && request.method === 'GET') {
          const { handleMoonPacketCheck } = await import('./api/moonpacket');
          return await handleMoonPacketCheck(request, env);
        }

        // Public Stats API
        if (url.pathname === '/api/stats' && request.method === 'GET') {
          const { handleStats } = await import('./api/stats');
          return await handleStats(request, env);
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

      // 🚨 Smart Alerting
      try {
        const { AdminLogService } = await import('./services/admin_log');
        const adminLog = new AdminLogService(env);
        await adminLog.logError(error, {
          context: 'Global Worker Fetch',
          url: request.url,
          method: request.method,
        });
      } catch (logError) {
        console.error('[Worker] Failed to log error:', logError);
      }

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
    // eslint-disable-next-line no-console
    console.log('[Worker] Scheduled event:', event.cron);

    try {
      // Daily Data Cleanup (Every day at 00:00 UTC)
      if (event.cron === '0 0 * * *') {
        // eslint-disable-next-line no-console
        console.log('[Worker] Running daily data cleanup...');
        const { deleteOldAnalyticsEvents, deleteOldConversationMessages } = await import('./services/cleanup');
        await deleteOldAnalyticsEvents(env);
        await deleteOldConversationMessages(env);
      }

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

      // 🔍 External Service Health Check (Every 10 minutes)
      if (event.cron === '*/10 * * * *') {
        // eslint-disable-next-line no-console
        console.log('[Worker] Checking external services health...');
        const { checkExternalServices } = await import('./services/monitoring');
        await checkExternalServices(env);
      }

      // HOURLY TASKS (Trigger every hour 0 * * * *)
      if (event.cron === '0 * * * *') {
        // 1. AI Moderation Patrol
        try {
          // eslint-disable-next-line no-console
          console.log('[Worker] Running AI Moderation Patrol...');
          const { runAiModerationPatrol } = await import('./cron/ai_moderation_patrol');
          await runAiModerationPatrol(env);
        } catch (err) {
          console.error('[Worker] AI Moderation Patrol failed:', err);
        }

        // 2. Check channel membership
        try {
          // eslint-disable-next-line no-console
          console.log('[Worker] Checking channel membership...');
          const { checkChannelMembership } = await import('./services/channel_membership_check');
          await checkChannelMembership(env);
        } catch (err) {
          console.error('[Worker] Channel membership check failed:', err);
        }

        // 3. Check expired subscriptions
        try {
          // eslint-disable-next-line no-console
          console.log('[Worker] Checking expired subscriptions...');
          const { checkExpiredSubscriptions } = await import('./services/subscription_checker');
          await checkExpiredSubscriptions(env);
        } catch (err) {
          console.error('[Worker] Subscription checker failed:', err);
        }

        // 4. Push Reminders (General Retention)
        try {
          console.log('[Worker] Checking push reminders...');
          const { handlePushReminders } = await import('./telegram/handlers/cron_push');
          await handlePushReminders(env);
        } catch (err) {
          console.error('[Worker] Push reminders failed:', err);
        }

        // 5. Daily Fortune Push (Now Timezone Aware)
        try {
          console.log('[Worker] Checking Daily Fortune Push...');
          const { sendDailyFortunePush } = await import('./services/fortune_push');
          await sendDailyFortunePush(env);
        } catch (err) {
          console.error('[Worker] Daily Fortune Push failed:', err);
        }

        // 6. Smart Match Push (Now Timezone Aware)
        try {
          // eslint-disable-next-line no-console
          console.log('[Worker] Checking Smart Match Push...');
          const { handleMatchPush } = await import('./telegram/handlers/cron_match_push');
          await handleMatchPush(env, env.DB);
        } catch (err) {
          console.error('[Worker] Smart Match Push failed:', err);
        }
      }

      // Check VIP expirations (Every day at 10:00 UTC = 18:00 Taipei)
      if (event.cron === '0 10 * * *') {
        try {
          // eslint-disable-next-line no-console
          console.log('[Worker] Checking VIP expirations...');
          const { checkVipExpirations } = await import('./services/vip_subscription');
          await checkVipExpirations(env);
        } catch (err) {
          console.error('[Worker] VIP expirations check failed:', err);
        }
      }

      // Batch update expired avatar caches (Every day at 03:00 UTC = 11:00 Taipei)
      if (event.cron === '0 3 * * *') {
        // eslint-disable-next-line no-console
        console.log('[Worker] Batch updating expired avatars...');
        const { createDatabaseClient } = await import('./db/client');
        const db = createDatabaseClient(env);
        const { batchUpdateExpiredAvatars } = await import('./services/avatar_background_update');
        const result = await batchUpdateExpiredAvatars(db, env);
        // eslint-disable-next-line no-console
        console.log(
          `[Worker] Avatar batch update completed: ${result.updated} updated, ${result.failed} failed`
        );
      }

      // Send birthday greetings (Every day at 01:00 UTC = 09:00 Taipei)
      if (event.cron === '0 1 * * *') {
        // eslint-disable-next-line no-console
        console.log('[Worker] Sending birthday greetings...');
        const { handleBirthdayGreetings } = await import('./cron/birthday_greetings');
        await handleBirthdayGreetings(env);
      }

      // Admin Daily Report (Daily 09:00 UTC+8 = 01:00 UTC)
      if (event.cron === '0 1 * * *') {
        try {
          console.log('[Worker] Running Admin Daily Report...');
          const { handleAdminDailyReport } = await import('./telegram/handlers/admin_report');
          await handleAdminDailyReport(env);
        } catch (err) {
          console.error('[Worker] Admin Daily Report failed:', err);
        }
      }

    } catch (error) {
      console.error('[Worker] Scheduled event error:', error);
      // 🚨 Smart Alerting
      try {
        const { AdminLogService } = await import('./services/admin_log');
        const adminLog = new AdminLogService(env);
        await adminLog.logError(error, {
          context: 'Scheduled Event',
          cron: event.cron,
        });
      } catch (logError) {
        console.error('[Worker] Failed to log scheduled error:', logError);
      }
    }
  },
};
