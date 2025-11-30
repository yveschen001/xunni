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
      [{ text: this.i18n.t('fortune.backToMenu'), callback_data: 'menu_fortune' }],
      [{ text: this.i18n.t('common.back3'), callback_data: 'return_to_menu' }]
    ];
    await telegram.sendMessageWithButtons(chatId, text, buttons);
  }

  async handleTarotDraw(chatId: number, telegramId: string, telegram: ReturnType<typeof createTelegramService>) {
    const db = createDatabaseClient(this.env.DB);
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) return;

    // 1. Check Quota
    // Tarot uses 1 bottle
    const isVip = !!(user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > new Date());
    const hasQuota = await this.service.checkQuota(telegramId, isVip);
    
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
    // Show "Shuffling..." animation?
    const msg = await telegram.sendMessageAndGetId(chatId, `🃏 ${this.i18n.t('fortune.tarot_ui.shuffling')}`);
    await new Promise(r => setTimeout(r, 1500));
    
    const cards = drawCards(3);
    const cardDisplay = cards.map((c, i) => `${i + 1}. ${getCardDisplay(c.card, c.reversed)}`).join('\n');
    
    await telegram.editMessageText(chatId, msg.message_id, 
      `${this.i18n.t('fortune.tarot_ui.drawn')}\n\n${cardDisplay}\n\n${this.i18n.t('common.analyzing')}`
    );

    try {
      // 3. Generate Fortune
      const today = new Date().toISOString().split('T')[0];
      const profiles = await this.service.getProfiles(telegramId);
      const profile = profiles.find(p => p.is_default) || profiles[0]; // Should have profile

      if (!profile) {
         await telegram.sendMessage(chatId, this.i18n.t('fortune.noProfile'));
         return;
      }

      const fortune = await this.service.generateFortune(
        user,
        profile,
        'tarot' as FortuneType,
        today,
        undefined,
        undefined,
        { cards } // Pass cards as context
      );

      // 4. Show Result
      const resultText = `🃏 *${this.i18n.t('fortune.type.tarot')}*\n\n` +
                         `${cardDisplay}\n\n` +
                         `-------------------\n\n` +
                         fortune.content;
      
      await telegram.sendMessage(chatId, resultText, { parse_mode: 'Markdown' });

      const buttons = [
        [{ text: this.i18n.t('fortune.menu.my_reports'), callback_data: 'fortune_my_reports' }],
        [{ text: this.i18n.t('common.back'), callback_data: 'fortune_tarot_menu' }],
        [{ text: this.i18n.t('common.back3'), callback_data: 'return_to_menu' }]
      ];
      await telegram.sendMessageWithButtons(chatId, this.i18n.t('common.saved_to_history'), buttons);

    } catch (e: any) {
      console.error('[Tarot] Error:', e);
      if (e.message === 'QUOTA_EXCEEDED') {
         await telegram.sendMessageWithButtons(
          chatId,
          this.i18n.t('fortune.quotaExceeded'),
          [
            [{ text: `🛒 ${this.i18n.t('fortune.getMore')}`, callback_data: 'fortune_get_more' }]
          ]
        );
      } else {
        await telegram.sendMessage(chatId, this.i18n.t('errors.systemError'));
      }
    }
  }
}

