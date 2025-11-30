import type { Env, TelegramMessage, TelegramCallbackQuery } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { I18n, createI18n } from '~/i18n';
import { findUserByTelegramId } from '~/db/queries/users';
import { MatchRequestService } from '~/services/match_request';
import { RelationshipType } from '~/domain/match_request';
import { upsertSession, getActiveSession } from '~/db/queries/sessions';
import { SessionType } from '~/domain/session';
import { FortuneService } from '~/services/fortune';
import { getMatchRequest } from '~/db/queries/match_requests';

export class LoveFortuneHandler {
  constructor(
    private service: FortuneService, 
    private i18n: I18n,
    private env: Env
  ) {}

  /**
   * Step 1: Show Love Menu (Single vs Match)
   */
  async handleLoveMenu(chatId: number, telegram: ReturnType<typeof createTelegramService>) {
    console.log(`[LoveFortune] handleLoveMenu called for ${chatId}`);
    
    const text = this.i18n.t('fortune.menu.attribute_desc'); // "Select mode..."
      const buttons = [
      // Featured (Row 1)
      [
        { text: `👤 ${this.i18n.t('fortune.love.mode_single')}`, callback_data: 'fortune_love_ideal' },
        { text: `💞 ${this.i18n.t('fortune.love.mode_match')}`, callback_data: 'fortune_love_match_start' }
      ],
      [
        { text: this.i18n.t('fortune.backToMenu'), callback_data: 'menu_fortune' }
      ],
      [
        { text: this.i18n.t('common.back3'), callback_data: 'return_to_menu' }
      ]
    ];

      await telegram.sendMessageWithButtons(chatId, text, buttons);
  }

  /**
   * Step 1.5: Single Mode (Placeholder for now)
   */
  async handleIdealMode(chatId: number, telegram: ReturnType<typeof createTelegramService>) {
    console.log(`[LoveFortune] handleIdealMode called for ${chatId}`);
    
    // Check standards: Using plain text, no markdown if not needed, consistent emoji.
    const text = `🧚‍♀️ ${this.i18n.t('fortune.type.love_ideal')} (Coming Soon)\n\n` +
                 this.i18n.t('fortune.love.attribute_desc') + '\n\n' +
                 'This feature is currently under construction. Please check back later!';

    const buttons = [
      [{ text: this.i18n.t('common.back'), callback_data: 'fortune_love_menu' }],
      [{ text: this.i18n.t('common.back3'), callback_data: 'return_to_menu' }]
    ];

    await telegram.sendMessageWithButtons(chatId, text, buttons);
  }

  /**
   * Step 2: Start Match Flow - Select Relationship Type
   */
  async handleMatchStart(chatId: number, telegram: ReturnType<typeof createTelegramService>) {
    console.log(`[LoveFortune] handleMatchStart called for ${chatId}`);
    
    try {
      const text = this.i18n.t('fortune.love.select_rel_type');
      if (!text) {
        console.error('[LoveFortune] i18n key missing: fortune.love.select_rel_type');
        await telegram.sendMessage(chatId, 'System Error: i18n missing');
        return;
      }

      const buttons = [
        [
          { text: this.i18n.t('fortune.relationship.love'), callback_data: 'fortune_love_type:love' },
          { text: this.i18n.t('fortune.relationship.friend'), callback_data: 'fortune_love_type:friend' }
        ],
        [
          { text: this.i18n.t('fortune.relationship.family'), callback_data: 'fortune_love_type:family' },
          { text: this.i18n.t('fortune.relationship.work'), callback_data: 'fortune_love_type:work' }
        ],
        [
          { text: this.i18n.t('common.back'), callback_data: 'fortune_love_menu' }
        ],
        [
          { text: this.i18n.t('common.back3'), callback_data: 'return_to_menu' }
        ]
      ];

      await telegram.sendMessageWithButtons(chatId, text, buttons);
    } catch (e) {
      console.error('[LoveFortune] handleMatchStart Error:', e);
      await telegram.sendMessage(chatId, this.i18n.t('errors.systemErrorRetry'));
    }
  }
  
  /**
   * Step 3: Handle Type Selection & Ask for Target ID
   */
  async handleMatchTypeSelection(chatId: number, userId: string, type: string, telegram: ReturnType<typeof createTelegramService>, db: any) {
    console.log(`[LoveFortune] handleMatchTypeSelection called: ${userId}, ${type}`);
    
    const relType = type.split(':')[1] as RelationshipType;
    
    // Check if Family Role Selection is needed
    if (relType === 'family') {
        // Need to check user gender to show correct roles
        const user = await findUserByTelegramId(db, userId);
        const gender = user?.gender || 'male'; // Default to male if unknown
        
        // Define roles based on gender
        // Male: Wife, Children, Parents, Grandchildren, Grandparents
        // Female: Husband, Children, Parents, Grandchildren, Grandparents
        const spouseRole = gender === 'male' ? 'wife' : 'husband';
        const roles = [spouseRole, 'children', 'parents', 'grandchildren', 'grandparents'];
        
        const buttons = [];
        let row = [];
        for (const role of roles) {
            row.push({ 
                text: this.i18n.t(`fortune.role.${role}` as any), 
                callback_data: `fortune_love_role:${role}` 
            });
            if (row.length === 2) {
                buttons.push(row);
                row = [];
            }
        }
        if (row.length > 0) buttons.push(row);
        
        buttons.push([{ text: this.i18n.t('common.back'), callback_data: 'fortune_love_match_start' }]);
        buttons.push([{ text: this.i18n.t('common.back3'), callback_data: 'return_to_menu' }]);
        
        await telegram.sendMessageWithButtons(chatId, this.i18n.t('fortune.love.select_family_role'), buttons);
        return;
    }

    // Direct to Target ID for non-family types
    await this.startTargetIdInput(chatId, userId, relType, undefined, db, telegram);
  }

  /**
   * Step 3.5: Handle Family Role Selection
   */
  async handleFamilyRoleSelection(chatId: number, userId: string, roleData: string, telegram: ReturnType<typeof createTelegramService>, db: any) {
      const role = roleData.split(':')[1];
      await this.startTargetIdInput(chatId, userId, 'family' as RelationshipType, role, db, telegram);
  }

  /**
   * Helper: Start Target ID Input Session
   */
  private async startTargetIdInput(chatId: number, userId: string, relType: RelationshipType, familyRole: string | undefined, db: any, telegram: ReturnType<typeof createTelegramService>) {
    // Save session
    await upsertSession(
      db, 
      userId, 
      'fortune_input', 
      { 
        step: 'match_target_id',
        relationship_type: relType, 
        family_role: familyRole 
      }
    );

    const text = this.i18n.t('fortune.love.input_target_id_msg');
    const buttons = [
      [{ text: this.i18n.t('common.cancel'), callback_data: 'fortune_love_menu' }],
      [{ text: this.i18n.t('common.back3'), callback_data: 'return_to_menu' }]
    ];

    await telegram.sendMessageWithButtons(chatId, text, buttons);
  }
  
  /**
   * Step 4: Handle Target ID Input & Send Request
   */
  async handleMatchInputGeneric(message: TelegramMessage, env: Env, text: string) {
    console.log(`[LoveFortune] handleMatchInputGeneric called: ${text}`);
    
    const db = createDatabaseClient(env.DB);
    const telegram = createTelegramService(env);
    const userId = message.from!.id.toString();
    const chatId = message.chat.id;

    // Get Session Data
    const session = await getActiveSession(db, userId, 'fortune_input');
    if (!session || session.step !== 'match_target_id') {
      return; // Should not happen if routed correctly
    }

    const relType = session.data.relationship_type as RelationshipType;
    const familyRole = session.data.family_role;
    const targetInput = text.trim();

    // Initialize Services
    const user = await findUserByTelegramId(db, userId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    const matchService = new MatchRequestService(env, env.DB, i18n, telegram);

    try {
      await telegram.sendMessage(chatId, i18n.t('common.processing'));

      const result = await matchService.requestMatch(userId, targetInput, relType, familyRole);

      if (result.success) {
        await telegram.sendMessage(chatId, i18n.t('fortune.love.request_sent_success'));
        await telegram.sendMessageWithButtons(chatId, i18n.t('common.continue_op'), [
           [{ text: i18n.t('common.back'), callback_data: 'fortune_love_menu' }],
           [{ text: i18n.t('common.back3'), callback_data: 'return_to_menu' }]
        ]);
        // Clear session
        // await clearSession... (Optional, or overwrite)
      } else {
        // Handle Error
        const errorMsg = result.message || i18n.t('errors.systemError');
        if (result.code === 'QUOTA_INSUFFICIENT') {
          // Show get quota button
          const buttons = [
            [{ text: i18n.t('fortune.get_more_bottles'), callback_data: 'menu_vip' }]
          ];
          await telegram.sendMessageWithButtons(chatId, i18n.t('tasks.quota.insufficient'), buttons);
          return;
        }

        await telegram.sendMessage(chatId, `❌ ${errorMsg}`);
      }

    } catch (e) {
      console.error('[LoveFortune] Error:', e);
      await telegram.sendMessage(chatId, i18n.t('errors.systemErrorRetry'));
    }
  }

  /**
   * Handle Match Report Generation (after consent accepted)
   */
  async handleGenerateMatchReport(chatId: number, userId: string, requestId: string, telegram: ReturnType<typeof createTelegramService>) {
    const db = createDatabaseClient(this.env.DB);
      
    // 1. Validate Request
    const request = await getMatchRequest(db.d1, requestId);
    if (!request || request.requester_id !== userId || request.status !== 'accepted') {
      await telegram.sendMessage(chatId, this.i18n.t('fortune.love.error_request_invalid'));
      return;
    }

    await telegram.sendMessage(chatId, this.i18n.t('common.generating'));

    try {
      // 2. Fetch Profiles
      // We need FortuneProfiles for both users.
      // Assumption: Users have a "Self" profile (is_default=1).
      // If not, we might need to create one or fallback.
          
      const userProfile = await this.service.getProfiles(userId).then(ps => ps.find(p => p.is_default));
      const targetProfile = await this.service.getProfiles(request.target_id).then(ps => ps.find(p => p.is_default));

      if (!userProfile || !targetProfile) {
        await telegram.sendMessage(chatId, 'Error: Profile missing for one of the users.');
        return;
      }

      // 3. Check Quota (before generation)
      const user = await findUserByTelegramId(db.db, userId);
      if (!user) return;

      const hasQuota = await this.service.checkQuota(userId, !!user.is_vip);
      if (!hasQuota) {
        const buttons = [
          [{ text: this.i18n.t('fortune.get_more_bottles'), callback_data: 'fortune_get_more' }]
        ];
        await telegram.sendMessageWithButtons(chatId, this.i18n.t('tasks.quota.insufficient'), buttons);
        return;
      }

      // 4. Generate Report
      const today = new Date().toISOString().split('T')[0];

      // Call generateFortune with correct type and snapshot data
      // Type: 'love_match' (or 'match' based on existing enums)
      // We use 'love_match' for this new flow.
          
      const report = await this.service.generateFortune(
        user,
        userProfile,
        'love_match',
        today,
        targetProfile,
        request.target_id // Pass target user ID for history/snapshot
      );

      // 4. Show Result
      // Use standard result display or custom?
      // Let's assume plain text message.
      const text = `🧬 ${this.i18n.t('fortune.type.love_match')}\n\n${report.content}`;
      await telegram.sendMessage(chatId, text);

      // Add buttons (Back to Menu, My Reports)
      const buttons = [
        [{ text: this.i18n.t('fortune.menu.my_reports'), callback_data: 'fortune_my_reports' }],
        [{ text: this.i18n.t('common.back'), callback_data: 'fortune_love_menu' }],
        [{ text: this.i18n.t('common.back3'), callback_data: 'return_to_menu' }]
      ];
      await telegram.sendMessageWithButtons(chatId, this.i18n.t('common.saved_to_history'), buttons);

    } catch (e) {
      console.error('[LoveFortune] Generate Error:', e);
      await telegram.sendMessage(chatId, this.i18n.t('errors.systemErrorRetry'));
    }
  }
}
