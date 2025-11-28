import { TestSuite, TestContext } from '../runner';

export const mbtiShareTests: TestSuite = {
  name: 'MBTI Share Deep Link',
  tests: [
    {
      name: 'Handle share_mbti_ link',
      fn: async (ctx: TestContext) => {
        const telegramId = '999999999';
        const shareCode = 'TEST_SHARE_CODE';
        
        // 1. Send webhook with /start share_mbti_...
        const response = await ctx.sendWebhook({
          update_id: 123456,
          message: {
            message_id: 1,
            from: { id: parseInt(telegramId), is_bot: false, first_name: 'TestUser', language_code: 'zh-TW' },
            chat: { id: parseInt(telegramId), type: 'private' },
            text: `/start share_mbti_${shareCode}`,
            date: Math.floor(Date.now() / 1000),
          },
        });

        if (response.status !== 200) {
          throw new Error(`Webhook failed with status ${response.status}`);
        }

        console.log('✅ Webhook accepted MBTI share link');
      }
    }
  ]
};
