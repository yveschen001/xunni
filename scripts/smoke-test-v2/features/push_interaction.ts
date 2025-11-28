import { TestSuite, TestContext } from '../runner';
import { handleConversationReplyButton } from '../../../src/telegram/handlers/message_forward';
import { createDatabaseClient } from '../../../src/db/client';
import { Env } from '../../../src/types';

export const pushInteractionTests: TestSuite = {
  name: 'Push Interaction System',
  tests: [
    {
      name: 'Conversation Reply Button (End-to-End)',
      fn: async (ctx: TestContext) => {
        // 1. Setup Mock DB
        const mockDb = {
          prepare: (sql: string) => {
            let boundArgs: any[] = [];
            const statement = {
              bind: (...args: any[]) => {
                boundArgs = args;
                return statement;
              },
              first: async () => {
                // Mock user lookup
                if (sql.includes('FROM users')) {
                  return {
                    telegram_id: 'test_user_reply',
                    language_pref: 'en',
                    onboarding_step: 'completed',
                  };
                }
                // Mock conversation identifier lookup
                if (sql.includes('FROM conversation_identifiers')) {
                  // Expect identifier to be #TESTID
                  if (boundArgs[0] === '#TESTID') {
                    return { partner_telegram_id: 'partner_123' };
                  }
                  return null;
                }
                // Mock conversation lookup
                if (sql.includes('FROM conversations')) {
                  return {
                    id: 100,
                    status: 'active',
                    user_a_telegram_id: 'test_user_reply',
                    user_b_telegram_id: 'partner_123',
                  };
                }
                return null;
              },
              run: async () => ({ success: true }),
            };
            return statement;
          },
        };

        // 2. Setup Mock Env & Telegram API
        const mockFetch = async (url: string, init: any) => {
          if (url.includes('/sendMessage')) {
            const body = JSON.parse(init.body);
            // Verify ForceReply is sent
            if (body.reply_markup && body.reply_markup.force_reply === true) {
              // Verify correct text content
              if (body.text.includes('#TESTID')) {
                return new Response(JSON.stringify({ ok: true, result: { message_id: 999 } }));
              }
            }
            throw new Error('sendMessage called but missing force_reply or correct identifier');
          }
          if (url.includes('/answerCallbackQuery')) {
            return new Response(JSON.stringify({ ok: true }));
          }
          return new Response('Not Found', { status: 404 });
        };

        // Global fetch mock for this test
        const originalFetch = global.fetch;
        global.fetch = mockFetch as any;

        try {
          const mockEnv: Env = {
            DB: {} as any, // We mock createDatabaseClient below
            TELEGRAM_BOT_TOKEN: 'mock_token',
          } as Env;

          // Mock createDatabaseClient to return our mockDb
          // Note: Since we are importing the handler which imports createDatabaseClient,
          // we need to mock the module or rely on dependency injection.
          // The current handler uses `createDatabaseClient(env.DB)`.
          // We can hack this by mocking the DB object itself to have `prepare` if `createDatabaseClient` just returns it wrapped.
          // Looking at `src/db/client.ts`, it wraps D1Database.
          // So we need env.DB to look like a D1Database.
          mockEnv.DB = {
            prepare: mockDb.prepare,
          } as any;

          // 3. Simulate Callback Query
          const mockCallbackQuery = {
            id: 'cb_123',
            from: { id: 123456789, first_name: 'Test', is_bot: false }, // ID matches nothing in mock DB logic? No, logic uses telegram_id string
            // Wait, logic uses callbackQuery.from.id.toString()
            // Our mock DB returns user for ANY query.
            message: {
              message_id: 555,
              chat: { id: 123456789, type: 'private' },
            },
            data: 'conv_reply_#TESTID',
          };

          // Override telegramId in mock DB logic to match
          // Actually the mock DB above just returns the same user object regardless of args for 'FROM users'
          
          await handleConversationReplyButton(mockCallbackQuery as any, '#TESTID', mockEnv);

        } finally {
          global.fetch = originalFetch;
        }
      }
    }
  ]
};

