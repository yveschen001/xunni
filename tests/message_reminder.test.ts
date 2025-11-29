import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handlePushReminders } from '../src/telegram/handlers/cron_push';
import { createDatabaseClient } from '../src/db/client';
import { PushType } from '../src/services/push_strategy';

// Mock DB
const mockDb = {
  prepare: vi.fn(() => ({
    bind: vi.fn().mockReturnThis(),
    all: vi.fn(),
    first: vi.fn(),
    run: vi.fn(),
  })),
};

vi.mock('../src/db/client', () => ({
  createDatabaseClient: () => ({ d1: mockDb }),
}));

// Mock Telegram Service
const mockSendMessage = vi.fn();
vi.mock('../src/services/telegram', () => ({
  createTelegramService: () => ({
    sendMessage: mockSendMessage,
  }),
}));

// Mock PushStrategyService
// We want to test the logic inside handlePushReminders which uses PushStrategyService
// So we should let it use the real PushStrategyService but mock its dependencies (DB, NotificationService)
// Or we can mock PushStrategyService methods to verify they are called correctly.
// Given handlePushReminders instantiates PushStrategyService internally, we can't easily mock the instance it uses unless we mock the module constructor.

// Let's mock the module.
const mockShouldSendPush = vi.fn();
const mockSendPush = vi.fn();

vi.mock('../src/services/push_strategy', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    PushStrategyService: vi.fn().mockImplementation(() => ({
      shouldSendPush: mockShouldSendPush,
      sendPush: mockSendPush,
    })),
  };
});

describe('Message Reminder Cron', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process message reminders correctly', async () => {
    // Mock conversations query result
    mockDb.prepare.mockImplementation((sql) => {
      if (sql.includes('FROM conversations c')) {
        return {
          all: vi.fn().mockResolvedValue({
            results: [
              {
                conversation_id: 101,
                user_a_telegram_id: 'userA',
                user_b_telegram_id: 'userB',
                last_message_at: '2023-01-01T10:00:00Z',
                last_sender_id: 'userA', // A sent last, B should reply
                ua_nickname: 'User A',
                ub_nickname: 'User B',
                ua_lang: 'zh-TW',
                ub_lang: 'zh-TW',
                ua_active: '2023-01-02T10:00:00Z',
                ub_active: '2023-01-02T10:00:00Z',
                ua_country: 'TW',
                ub_country: 'TW',
              },
            ],
          }),
        } as any;
      }
      if (sql.includes('FROM conversation_messages')) {
        return {
          bind: vi.fn().mockReturnThis(),
          first: vi.fn().mockResolvedValue({ original_text: 'Hello World' }),
        } as any;
      }
      // Return empty for other queries to avoid errors
      return {
        all: vi.fn().mockResolvedValue({ results: [] }),
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
        run: vi.fn(),
      } as any;
    });

    // Mock shouldSendPush to return true
    mockShouldSendPush.mockResolvedValue(true);

    const env = { DB: {} } as any;
    await handlePushReminders(env);

    // Verify shouldSendPush was called for userB (target)
    expect(mockShouldSendPush).toHaveBeenCalledWith(
      'userB',
      PushType.MESSAGE_REMINDER,
      '2023-01-02T10:00:00Z',
      'zh-TW'
    );

    // Verify sendPush was called
    expect(mockSendPush).toHaveBeenCalledWith(
      'userB',
      PushType.MESSAGE_REMINDER,
      expect.stringMatching(/push.messageReminder[ABC]/), // Key
      expect.objectContaining({
        masked_partner_name: expect.stringMatching(/User A/), // Should be masked version
        last_message_preview: 'Hello World',
      }),
      'zh-TW',
      expect.objectContaining({
        reply_markup: expect.anything(), // Buttons
      })
    );
  });
});
