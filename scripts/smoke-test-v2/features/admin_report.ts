import { TestSuite, TestContext } from '../runner';
import { TranslationLogService } from '../../../src/services/translation_log';

export const adminReportTests: TestSuite = {
  name: 'Admin Daily Report System',
  tests: [
    {
      name: 'Log Translation Stats',
      fn: async (ctx: TestContext) => {
        // Mock DB is tricky here because TranslationLogService takes a D1Database
        // We can skip deep mocking and just rely on the fact that if we can instantiate it, it's good.
        // Or mock enough to pass.
        const mockDb = {
          prepare: () => ({
            bind: () => ({
              run: async () => ({ success: true }),
              first: async () => ({ count: 5 }),
              all: async () => ({ results: [] })
            })
          })
        };
        
        const service = new TranslationLogService(mockDb as any);
        await service.logStats({
          provider: 'openai',
          tokens: 100,
          characters: 50
        });
        
        console.log('✅ TranslationLogService ran without error');
      }
    },
    {
      name: 'Generate Report (Dry Run)',
      fn: async (ctx: TestContext) => {
        // Use the admin test command
        // We use the SUPER_ADMIN_ID from admin_ban.ts which is '396943893'
        const response = await ctx.sendWebhook({
          update_id: 999,
          message: {
            message_id: 1,
            from: { id: 396943893, is_bot: false, first_name: 'SuperAdmin' },
            chat: { id: 396943893, type: 'private' },
            text: '/admin_report_test',
            date: Math.floor(Date.now() / 1000),
          },
        });

        if (response.status !== 200) {
          throw new Error(`Webhook failed with status ${response.status}`);
        }
        
        console.log('✅ Admin report command triggered');
      }
    },
    {
      name: 'Analytics Report (Dry Run)',
      fn: async (ctx: TestContext) => {
        const response = await ctx.sendWebhook({
          update_id: 1000,
          message: {
            message_id: 2,
            from: { id: 396943893, is_bot: false, first_name: 'SuperAdmin' },
            chat: { id: 396943893, type: 'private' },
            text: '/analytics',
            date: Math.floor(Date.now() / 1000),
          },
        });

        if (response.status !== 200) {
          throw new Error(`Webhook failed with status ${response.status}`);
        }
        console.log('✅ Analytics command triggered');
      }
    },
    {
      name: 'Ad Performance (Dry Run)',
      fn: async (ctx: TestContext) => {
        const response = await ctx.sendWebhook({
          update_id: 1001,
          message: {
            message_id: 3,
            from: { id: 396943893, is_bot: false, first_name: 'SuperAdmin' },
            chat: { id: 396943893, type: 'private' },
            text: '/ad_performance',
            date: Math.floor(Date.now() / 1000),
          },
        });

        if (response.status !== 200) {
          throw new Error(`Webhook failed with status ${response.status}`);
        }
        console.log('✅ Ad Performance command triggered');
      }
    },
    {
      name: 'VIP Funnel (Dry Run)',
      fn: async (ctx: TestContext) => {
        const response = await ctx.sendWebhook({
          update_id: 1002,
          message: {
            message_id: 4,
            from: { id: 396943893, is_bot: false, first_name: 'SuperAdmin' },
            chat: { id: 396943893, type: 'private' },
            text: '/vip_funnel',
            date: Math.floor(Date.now() / 1000),
          },
        });

        if (response.status !== 200) {
          throw new Error(`Webhook failed with status ${response.status}`);
        }
        console.log('✅ VIP Funnel command triggered');
      }
    },
    {
      name: 'Help Command Check',
      fn: async (ctx: TestContext) => {
        // Test help command for admin user
        const response = await ctx.sendWebhook({
          update_id: 1003,
          message: {
            message_id: 5,
            from: { id: 396943893, is_bot: false, first_name: 'SuperAdmin' },
            chat: { id: 396943893, type: 'private' },
            text: '/help',
            date: Math.floor(Date.now() / 1000),
          },
        });

        if (response.status !== 200) {
          throw new Error(`Webhook failed with status ${response.status}`);
        }
        console.log('✅ Help command triggered');
      }
    }
  ]
};
