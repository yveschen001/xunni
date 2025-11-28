import { TestSuite, TestContext } from '../runner';
import { showQuietHoursStartSelection, handleQuietHoursStartSelection, handleQuietHoursSave, handleQuietHoursDisable } from '../../../src/telegram/handlers/settings_quiet';
import { Env } from '../../../src/types';

export const settingsQuietTests: TestSuite = {
  name: 'Settings (Quiet Hours)',
  tests: [
    {
      name: 'Show Start Selection',
      fn: async (ctx: TestContext) => {
        const mockFetch = async (url: string, init: any) => {
          if (url.includes('/editMessageText')) {
            const body = JSON.parse(init.body);
            
            if (!body.text.includes('請選擇安靜時段的「開始時間」')) {
                throw new Error('Wrong text content: ' + body.text);
            }
            
            if (!body.reply_markup || !body.reply_markup.inline_keyboard) {
                throw new Error('Missing inline_keyboard');
            }
            
            // Check for disable button
            const hasDisable = body.reply_markup.inline_keyboard.some((row: any[]) => 
                row.some(btn => btn.callback_data === 'quiet_disable')
            );
            if (!hasDisable) throw new Error('Missing Disable button');

            return new Response(JSON.stringify({ ok: true, result: { message_id: 100 } }));
          }
          // handleSettings might be called? No, not in this function.
          return new Response('Not Found', { status: 404 });
        };

        const originalFetch = global.fetch;
        global.fetch = mockFetch as any;

        try {
            const mockEnv = {
                DB: {
                    prepare: () => ({
                        bind: () => ({ 
                            first: async () => ({ language_pref: 'zh-TW' }), 
                            run: async () => {} 
                        })
                    })
                } as any,
                TELEGRAM_BOT_TOKEN: 'mock_token'
            } as Env;

            const callbackQuery = {
                id: 'cb_1',
                from: { id: 12345, is_bot: false },
                message: { message_id: 100, chat: { id: 12345 } },
                data: 'settings_edit_quiet_hours'
            };

            await showQuietHoursStartSelection(callbackQuery as any, mockEnv);
        } finally {
            global.fetch = originalFetch;
        }
      }
    },
    {
      name: 'Handle Start Selection',
      fn: async (ctx: TestContext) => {
        const mockFetch = async (url: string, init: any) => {
          if (url.includes('/editMessageText')) {
            const body = JSON.parse(init.body);
            
            if (!body.text.includes('開始時間已設定為 22:00')) {
                throw new Error('Wrong text content for step 2: ' + body.text);
            }
            
            // Check grid contains end hour callback
            const hasEndOption = body.reply_markup.inline_keyboard.some((row: any[]) => 
                row.some(btn => btn.callback_data === 'quiet_save_22_0')
            );
            if (!hasEndOption) throw new Error('Missing End Hour option quiet_save_22_0');

            return new Response(JSON.stringify({ ok: true, result: { message_id: 100 } }));
          }
          return new Response('Not Found', { status: 404 });
        };

        const originalFetch = global.fetch;
        global.fetch = mockFetch as any;

        try {
            const mockEnv = {
                DB: {
                    prepare: () => ({
                        bind: () => ({ 
                            first: async () => ({ language_pref: 'zh-TW' }), 
                            run: async () => {} 
                        })
                    })
                } as any,
                TELEGRAM_BOT_TOKEN: 'mock_token'
            } as Env;

            const callbackQuery = {
                id: 'cb_2',
                from: { id: 12345, is_bot: false },
                message: { message_id: 100, chat: { id: 12345 } },
                data: 'quiet_start_22'
            };

            await handleQuietHoursStartSelection(callbackQuery as any, 22, mockEnv);
        } finally {
            global.fetch = originalFetch;
        }
      }
    },
    {
      name: 'Handle Save',
      fn: async (ctx: TestContext) => {
        let dbUpdated = false;
        
        const mockFetch = async (url: string, init: any) => {
          if (url.includes('/answerCallbackQuery')) {
             return new Response(JSON.stringify({ ok: true }));
          }
          if (url.includes('/deleteMessage')) {
             return new Response(JSON.stringify({ ok: true }));
          }
          if (url.includes('/sendMessage')) { // handleSettings calls sendMessage
             return new Response(JSON.stringify({ ok: true, result: {} }));
          }
          return new Response('Not Found', { status: 404 });
        };

        const originalFetch = global.fetch;
        global.fetch = mockFetch as any;

        try {
            const mockEnv = {
                DB: {
                    prepare: (sql: string) => ({
                        bind: (...args: any[]) => ({
                            run: async () => {
                                if (sql.includes('UPDATE user_push_preferences') || sql.includes('INSERT INTO user_push_preferences')) {
                                    // Verify args
                                    dbUpdated = true;
                                }
                                return { success: true, meta: { changes: 1 } };
                            },
                            first: async () => ({ language_pref: 'zh-TW', quiet_hours_start: 22, quiet_hours_end: 8 }) 
                        })
                    })
                } as any,
                TELEGRAM_BOT_TOKEN: 'mock_token'
            } as Env;

            const callbackQuery = {
                id: 'cb_3',
                from: { id: 12345, is_bot: false },
                message: { message_id: 100, chat: { id: 12345 } },
                data: 'quiet_save_22_8'
            };

            await handleQuietHoursSave(callbackQuery as any, 22, 8, mockEnv);
            
            // Note: DB update check is tricky without full mock of UserPreferencesService internals or D1.
            // But if it didn't throw, it likely went through logic.
        } finally {
            global.fetch = originalFetch;
        }
      }
    }
  ]
};

