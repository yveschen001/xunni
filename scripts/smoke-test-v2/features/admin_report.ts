import { TestSuite, TestContext } from '../runner';
import { handleAdminDailyReport } from '../../../src/telegram/handlers/admin_report';
import { TranslationLogService } from '../../../src/services/translation_log';

export const adminReportTests: TestSuite = {
  name: 'Admin Daily Report System',
  tests: [
    {
      name: 'Log Translation Stats',
      fn: async (ctx: TestContext) => {
        // We can't easily mock D1 here without complex setup
        // But we can verify the service logic works without throwing
        
        // Mock DB is tricky here because TranslationLogService takes a D1Database
        // In this smoke test env, we might be running against a real local worker/DB via wrangler?
        // No, we are running node code.
        // We need to rely on the "unit test" style mocking if we want to test service logic.
        
        // Let's assume we can import the service and run it against a mock DB object
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
        // This requires the worker to be running and DB to have data
        
        // 1. Send webhook with /admin_report_test
        // We use the SUPER_ADMIN_ID from admin_ban.ts which is '396943893'
        // This ensures the isAdmin check passes.
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

        // Even if not admin, it should return 200 OK (silent fail or unauthorized msg)
        // We just want to ensure no crash in the handler import/execution path
        if (response.status !== 200) {
          throw new Error(`Webhook failed with status ${response.status}`);
        }
        
        console.log('✅ Admin report command triggered');
      }
    }
  ]
};

