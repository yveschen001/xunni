import { Env, TelegramMessage, TelegramCallbackQuery, FortuneType } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { createI18n } from '~/i18n';
import { FortuneService } from '~/services/fortune';
import { findUserByTelegramId } from '~/db/queries/users';
import { drawCards, getCardDisplay } from '~/domain/tarot';

export class TarotHandler {
  constructor(
    private service: FortuneService,
    private i18n: any,
    private env: Env
  ) {}

  async handleTarotMenu(chatId: number, telegram: ReturnType<typeof createTelegramService>) {
    const text = this.i18n.t('fortune.tarot_ui.intro'); // "Think of a question..."
    const buttons = [
      [{ text: `🃏 ${this.i18n.t('fortune.tarot_ui.draw')}`, callback_data: 'fortune_tarot_draw' }],
      [{ text: this.i18n.t('fortune.back_to_menu'), callback_data: 'menu_fortune' }],
      [{ text: this.i18n.t('common.back3'), callback_data: 'return_to_menu' }]
    ];
    await telegram.sendMessageWithButtons(chatId, text, buttons);
  }

  async handleTarotDraw(chatId: number, telegramId: string, telegram: ReturnType<typeof createTelegramService>) {
    const db = createDatabaseClient(this.env.DB);
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) return;

    // 1. Deduct Quota (Tarot uses 1 bottle)
    const isVip = !!(user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > new Date());
    const hasQuota = await this.service.deductQuota(telegramId, isVip);
    
    if (!hasQuota) {
      await telegram.sendMessageWithButtons(
        chatId,
        this.i18n.t('fortune.quotaExceeded'),
        [
          [{ text: `🛒 ${this.i18n.t('fortune.getMore')}`, callback_data: 'fortune_get_more' }]
        ]
      );
      return;
    }

    // 2. Draw Cards
    const msg = await telegram.sendMessageAndGetId(chatId, `🃏 ${this.i18n.t('fortune.tarot_ui.shuffling')}`);
    await new Promise(r => setTimeout(r, 2000)); // Increased shuffle time to 2s
    
    const cards = drawCards(3);
    const cardDisplay = cards.map((c, i) => `${i + 1}. ${getCardDisplay(c.card, c.reversed, this.i18n)}`).join('\n');
    
    await telegram.editMessageText(chatId, msg.message_id, 
      `${this.i18n.t('fortune.tarot_ui.drawn')}\n\n${cardDisplay}\n\n${this.i18n.t('common.analyzing')}`
    );
    // Keep the "drawn" state visible for a moment before dispatching or just let it stay until queue picks up
    await new Promise(r => setTimeout(r, 1500)); // Show drawn cards for 1.5s

    try {
      // 3. Dispatch Job
      const today = new Date().toISOString().split('T')[0];
      const profiles = await this.service.getProfiles(telegramId);
      const profile = profiles.find(p => p.is_default) || profiles[0];

      if (!profile) {
         await telegram.sendMessage(chatId, this.i18n.t('fortune.noProfile'));
         return;
      }

      const { dispatchFortuneJob } = await import('~/queue/dispatcher');
      const jobResult = await dispatchFortuneJob(this.env, {
          userId: telegramId,
          chatId,
          userProfile: profile,
          fortuneType: 'tarot',
          targetDate: today,
          context: { cards }, // Pass cards
          messageId: msg.message_id,
          lang: user.language_pref || 'zh-TW',
          skipQuota: true // Already deducted
      }, db.d1);

      if (jobResult.status === 'completed' && jobResult.result) {
          // Sync Fallback
          const { handleReportDetail } = await import('./fortune_reports');
          await handleReportDetail(chatId, jobResult.result.id, this.env);
      } else if (jobResult.status === 'queued') {
          // Queued
          if (jobResult.message) {
             try { await telegram.editMessageText(chatId, msg.message_id, jobResult.message); } catch(e){}
          }
      }

    } catch (e: any) {
      console.error('[Tarot] Error:', e);
      await telegram.sendMessage(chatId, this.i18n.t('errors.systemError'));
    }
  }
}

