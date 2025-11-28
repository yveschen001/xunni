import { createDatabaseClient } from '../src/db/client';
import { handlePushReminders } from '../src/telegram/handlers/cron_push';
import { Env } from '../src/types';

// Mock Env
const env: Env = {
  DB: process.env.DB as any,
  TELEGRAM_BOT_TOKEN: 'mock_token',
} as any;

// Mock Telegram Service
jest.mock('../src/services/telegram', () => ({
  createTelegramService: () => ({
    sendMessage: jest.fn(async (chatId, text, extra) => {
      console.log(`[MockTelegram] Sending to ${chatId}: ${text}`);
      if (extra) console.log('Extra:', JSON.stringify(extra));
      return { message_id: 123 };
    }),
  }),
}));

// We can't easily mock imports in a standalone script without Jest/Vitest runner.
// So I will create a new test file in `tests/` and run it with `pnpm test`.

console.log('Use `pnpm test tests/message_reminder.test.ts` instead.');

