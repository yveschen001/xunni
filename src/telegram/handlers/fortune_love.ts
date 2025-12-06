import type { Env, TelegramMessage, TelegramCallbackQuery } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { I18n, createI18n } from '~/i18n';
import { findUserByTelegramId } from '~/db/queries/users';
import { MatchRequestService } from '~/services/match_request';
import { RelationshipType } from '~/domain/match_request';
import { upsertSession, getActiveSession, clearSession } from '~/db/queries/sessions';
import { SessionType } from '~/domain/session';
import { FortuneService } from '~/services/fortune';
import { getMatchRequest } from '~/db/queries/match_requests';
import { dispatchFortuneJob } from '~/queue/dispatcher';

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
    
    const text = this.i18n.t('fortune.love.menu_desc'); // Correct key for "Explore your love genes..."
      const buttons = [
      // Featured (Row 1)
      [
        { text: this.i18n.t('fortune.love.mode_single'), callback_data: 'fortune_love_ideal' },
        { text: this.i18n.t('fortune.love.mode_match'), callback_data: 'fortune_love_match_start' }
      ],
      [
        { text: this.i18n.t('fortune.back_to_menu'), callback_data: 'menu_fortune' }
      ],
      [
        { text: this.i18n.t('common.back3'), callback_data: 'return_to_menu' }
      ]
    ];

      await telegram.sendMessageWithButtons(chatId, text, buttons);
  }

  /**
   * Step 1.5: Single Mode (Ideal Partner)
   */
  async handleIdealMode(chatId: number, userId: string, telegram: ReturnType<typeof createTelegramService>) {
    console.log(`[LoveFortune] handleIdealMode called for ${chatId}, user ${userId}`);
    
    await telegram.sendMessage(chatId, this.i18n.t('fortune.generating'));

    try {
      // 1. Get Profile
      const profiles = await this.service.getProfiles(userId);
      const profile = profiles.find(p => p.is_default) || profiles[0];
      
      if (!profile) {
        await telegram.sendMessage(chatId, this.i18n.t('fortune.noProfile'));
        return;
      }

      // 2. Get User
      const { createDatabaseClient } = await import('~/db/client');
      const db = createDatabaseClient(this.env.DB);
      const user = await findUserByTelegramId(db, userId);
      if (!user) return;

      // 3. Check Quota (Free or VIP)
      // Note: checkQuota logic handles free/vip logic internally based on isVip param
      // But we need to check if user is VIP to pass correct flag
      const isVip = !!(user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > new Date());
      const hasQuota = await this.service.checkQuota(userId, isVip);
      
      if (!hasQuota) {
        const buttons = [
          [{ text: `🛒 ${this.i18n.t('fortune.getMore')}`, callback_data: 'fortune_get_more' }]
        ];
        await telegram.sendMessageWithButtons(chatId, this.i18n.t('fortune.quotaExceeded'), buttons);
        return;
      }

      // 4. Generate
      const today = new Date().toISOString().split('T')[0];
      const fortune = await this.service.generateFortune(
        user,
        profile,
        'love_ideal',
        today
      );

      // 5. Show Result (Delegate to Report Viewer for consistent UI)
      const { handleReportDetail } = await import('./fortune_reports');
      await handleReportDetail(chatId, fortune.id, this.env);

    } catch (e: any) {
      console.error('[LoveFortune] Error:', e);
      if (e.message === 'QUOTA_EXCEEDED') {
        const buttons = [
          [{ text: `🛒 ${this.i18n.t('fortune.getMore')}`, callback_data: 'fortune_get_more' }]
        ];
        await telegram.sendMessageWithButtons(chatId, this.i18n.t('fortune.quotaExceeded'), buttons);
      } else {
        await telegram.sendMessage(chatId, this.i18n.t('errors.systemErrorRetry'));
      }
    }
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
          { text: this.i18n.t('fortune.back_to_menu'), callback_data: 'menu_fortune' }
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
        const roles = [spouseRole, 'children', 'parents', 'siblings', 'grandchildren', 'grandparents'];
        
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
        
        buttons.push([{ text: this.i18n.t('fortune.back_to_menu'), callback_data: 'menu_fortune' }]);
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
    // Clear potential conflicting sessions to avoid input hijacking
    await clearSession(db, userId, 'edit_profile');
    await clearSession(db, userId, 'throw_bottle');
    
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
      [{ text: this.i18n.t('fortune.back_to_menu'), callback_data: 'menu_fortune' }],
      [{ text: this.i18n.t('common.back3'), callback_data: 'return_to_menu' }]
    ];

    await telegram.sendMessageWithButtons(chatId, text, buttons);
    await telegram.sendMessage(chatId, this.i18n.t('fortune.love.input_target_id_hint'));
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
    if (!session) return;

    let sessionData: any = {};
    try {
      sessionData = typeof session.session_data === 'string' ? JSON.parse(session.session_data) : session.session_data;
    } catch (e) {
      console.error('Error parsing session data in fortune_love:', e);
      return;
    }

    if (sessionData.step !== 'match_target_id') {
      return; // Should not happen if routed correctly
    }

    const relType = sessionData.relationship_type as RelationshipType;
    const familyRole = sessionData.family_role;
    const targetInput = text.trim();

    // Initialize Services
    const user = await findUserByTelegramId(db, userId);
    const i18n = createI18n(user?.language_pref || 'zh-TW');
    const matchService = new MatchRequestService(env, env.DB, i18n, telegram);

    try {
      const processingMsg = await telegram.sendMessageAndGetId(chatId, i18n.t('common.processing'));

      const result = await matchService.requestMatch(userId, targetInput, relType, familyRole);

      // Delete processing message
      try {
        await telegram.deleteMessage(chatId, processingMsg.message_id);
      } catch (e) {
        // Ignore delete error
      }

      if (result.success && result.code === 'READY_TO_MATCH') {
        const targetName = result.data.targetName;
        const targetId = result.data.targetId;
        const familyRoleSuffix = familyRole ? `:${familyRole}` : '';
        
        // Show Disclaimer & Confirmation
        const confirmMsg = i18n.t('fortune.love.confirm_match_msg', { target: targetName });
        const disclaimerMsg = i18n.t('fortune.love.disclaimer_short'); // Need to add this key
        
        await telegram.sendMessageWithButtons(
            chatId,
            `${confirmMsg}\n\n${disclaimerMsg}`,
            [
                [{ text: i18n.t('fortune.love.confirm_deduct'), callback_data: `fortune_exec_match:${targetId}:${relType}${familyRoleSuffix}` }],
                [{ text: i18n.t('fortune.back_to_menu'), callback_data: 'menu_fortune' }]
            ]
        );
        return;
      }

      if (result.success) {
        // Fallback for old success (should not happen with new logic but safe to keep/ignore)
        await telegram.sendMessage(chatId, i18n.t('fortune.love.request_sent_success'));
        await telegram.sendMessageWithButtons(chatId, i18n.t('common.continue_op'), [
           [{ text: i18n.t('fortune.back_to_menu'), callback_data: 'menu_fortune' }],
           [{ text: i18n.t('common.back3'), callback_data: 'return_to_menu' }]
        ]);
        // Clear session
        // await clearSession... (Optional, or overwrite)
      } else {
        // Handle Error
        const errorMsg = result.message || i18n.t('errors.systemError');
        
        // Quota Error
        if (result.code === 'QUOTA_INSUFFICIENT') {
          const buttons = [
            [{ text: i18n.t('fortune.get_more_bottles'), callback_data: 'fortune_get_more' }]
          ];
          await telegram.sendMessageWithButtons(chatId, i18n.t('fortune.quotaExceeded'), buttons);
          return;
        }

        // Target Not Found -> Invite
        if (result.code === 'TARGET_NOT_FOUND') {
          // Use share url link
          const botUsername = env.ENVIRONMENT === 'staging' ? 'xunni_dev_bot' : 'XunNiBot';
          const inviteUrl = `https://t.me/${botUsername}?start=invite_${user?.invite_code || ''}`;
          const inviteText = i18n.t('fortune.love.invite_friend_text');
          const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(inviteText)}`;
          
          const buttons = [
            [{ text: i18n.t('fortune.love.invite_friend'), url: shareUrl }],
            [{ text: i18n.t('fortune.back_to_menu'), callback_data: 'menu_fortune' }]
          ];
          // errorMsg already contains the user's requested text from zh-TW.ts
          await telegram.sendMessageWithButtons(chatId, errorMsg, buttons);
          return;
        }

        // Target No Profile -> Notify
        if (result.code === 'TARGET_NO_PROFILE') {
          const shareUrl = `https://t.me/share/url?url=https://t.me/XunNiBot&text=${encodeURIComponent('嘿！我想要和你玩雙人合盤，快點建立你的命理檔案吧！')}`;
          const buttons = [
            [{ text: `📨 通知對方建立檔案`, url: shareUrl }],
            [{ text: i18n.t('fortune.back_to_menu'), callback_data: 'menu_fortune' }]
          ];
          await telegram.sendMessageWithButtons(chatId, `❌ 該用戶尚未建立命理檔案。\n\n請通知對方先點擊『🔮 AI 算命』建立檔案，才能進行合盤喔！`, buttons);
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
        await telegram.sendMessageWithButtons(chatId, this.i18n.t('fortune.quotaExceeded'), buttons);
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

  /**
   * Execute Match Report Generation (Single Opt-in Flow)
   */
  async handleMatchExecution(chatId: number, userId: string, targetId: string, relType: string, familyRole: string | undefined, telegram: ReturnType<typeof createTelegramService>) {
    console.log(`[LoveFortune] handleMatchExecution: ${userId} -> ${targetId} (${relType})`);
    
    // 1. Send Generating Msg
    const generatingMsg = await telegram.sendMessageAndGetId(chatId, this.i18n.t('common.analyzing'));

    try {
        const db = createDatabaseClient(this.env.DB);
        
        // 2. Fetch Profiles
        const userProfile = await this.service.getProfiles(userId).then(ps => ps.find(p => p.is_default));
        const targetProfile = await this.service.getProfiles(targetId).then(ps => ps.find(p => p.is_default));

        if (!userProfile || !targetProfile) {
            await telegram.sendMessage(chatId, this.i18n.t('fortune.noProfile')); // Or generic error
            return;
        }

        // 2.5 Age Logic Validation (Family Roles)
        if (relType === 'family' && familyRole) {
            const getYear = (dateStr: string) => parseInt(dateStr.split('-')[0]);
            const getFullDate = (dateStr: string) => new Date(dateStr).getTime();
            
            const userYear = getYear(userProfile.birth_date);
            const targetYear = getYear(targetProfile.birth_date);
            const ageDiff = targetYear - userYear; // + means Target is younger, - means Target is older

            let errorKey = '';
            // Rule: Parents/Grandparents must be older (User is younger -> targetYear < userYear -> ageDiff < 0)
            // Gap should be significant (e.g. > 10 years). So ageDiff < -10
            if (familyRole === 'parents' || familyRole === 'grandparents') {
                if (ageDiff > -10) { 
                    errorKey = 'fortune.love.error_age_parent_too_young'; // "Target is too young to be your parent"
                }
            }
            // Rule: Children/Grandchildren must be younger (User is older -> targetYear > userYear -> ageDiff > 0)
            // Gap > 10. So ageDiff > 10
            if (familyRole === 'children' || familyRole === 'grandchildren') {
                if (ageDiff < 10) {
                    errorKey = 'fortune.love.error_age_child_too_old'; // "Target is too old to be your child"
                }
            }

            // Logic: Auto-detect Sibling Role (Brother/Sister + Older/Younger)
            if (familyRole === 'siblings') {
                const targetGender = targetProfile.gender || 'male'; // Default to male
                const userTime = getFullDate(userProfile.birth_date);
                const targetTime = getFullDate(targetProfile.birth_date);
                
                // Determine relative age
                const isTargetOlder = targetTime < userTime; // Smaller timestamp = Older
                
                // Refine role
                if (isTargetOlder) {
                    familyRole = targetGender === 'female' ? 'older_sister' : 'older_brother';
                } else {
                    familyRole = targetGender === 'female' ? 'younger_sister' : 'younger_brother';
                }
                console.log(`[LoveFortune] Auto-refined sibling role: ${familyRole}`);
            }

            if (errorKey) {
                if (generatingMsg) await telegram.deleteMessage(chatId, generatingMsg.message_id);
                
                // Fallback message if key missing
                const msg = this.i18n.t(errorKey as any) || 
                    (errorKey.includes('parent') 
                        ? `⚠️ 年齡邏輯錯誤：您選擇了「${this.i18n.t(('fortune.role.' + familyRole) as any)}」，但對方的年齡似乎不合理（太年輕或比您小）。\n\n請確認對方生日是否正確，或重新選擇角色。`
                        : `⚠️ 年齡邏輯錯誤：您選擇了「${this.i18n.t(('fortune.role.' + familyRole) as any)}」，但對方的年齡似乎不合理（太老或比您大）。\n\n請確認對方生日是否正確，或重新選擇角色。`);

                await telegram.sendMessageWithButtons(chatId, msg, [
                    [{ text: this.i18n.t('fortune.back_to_menu'), callback_data: 'menu_fortune' }]
                ]);
                return;
            }
        }

        // 3. Check & Deduct Quota
        const user = await findUserByTelegramId(db, userId);
        if (!user) return;

        const isVip = !!(user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > new Date());
        // Note: For execution, we DEDUCT quota immediately
        const hasQuota = await this.service.deductQuota(userId, isVip);
        
        if (!hasQuota) {
            if (generatingMsg) await telegram.deleteMessage(chatId, generatingMsg.message_id);
            
            const buttons = [
                [{ text: this.i18n.t('fortune.get_more_bottles'), callback_data: 'fortune_get_more' }]
            ];
            await telegram.sendMessageWithButtons(chatId, this.i18n.t('fortune.quotaExceeded'), buttons);
            return;
        }

        // 4. Generate Report (via Dispatcher)
        const today = new Date().toISOString().split('T')[0];
        
        // 4.1 Show Animation Sequence
        const loadingMsgs = [
            '🛰️ ' + this.i18n.t('fortune.loading.astronomy'),
            '📜 ' + this.i18n.t('fortune.loading.bazi'),
            '🧬 ' + this.i18n.t('fortune.loading.analysis'),
            '🧠 ' + this.i18n.t('fortune.loading.generating')
        ];

        // Animate initial loading messages (Fake progress for UX)
        if (generatingMsg) {
            for (const msg of loadingMsgs) {
                // Skip if key is missing/fallback
                if (msg.includes('fortune.loading')) continue; 
                try {
                    await telegram.editMessageText(chatId, generatingMsg.message_id, msg);
                    await new Promise(r => setTimeout(r, 800)); // 0.8s delay
                } catch (e) {
                    // Ignore edit errors
                }
            }
        }

        const jobResult = await dispatchFortuneJob(
            this.env,
            {
                userId,
                chatId,
                userProfile,
                targetProfile,
                targetUserId: targetId,
                fortuneType: 'love_match',
                targetDate: today,
                context: { relationship_type: relType, family_role: familyRole },
                messageId: generatingMsg?.message_id,
                lang: user.language_pref || 'zh-TW'
            },
            db.d1, // Pass D1Database instance
            async (progressText) => {
                if (generatingMsg) {
                    try {
                        await telegram.editMessageText(chatId, generatingMsg.message_id, progressText);
                    } catch (e) {
                        // Ignore
                    }
                }
            }
        );

        if (jobResult.status === 'completed' && jobResult.result) {
             const report = jobResult.result;
             // 5. Delete Generating Msg
             if (generatingMsg) await telegram.deleteMessage(chatId, generatingMsg.message_id);

             // 6. Show Result (Use Report Viewer or direct text)
             const { handleReportDetail } = await import('./fortune_reports');
             await handleReportDetail(chatId, report.id, this.env);
        } else if (jobResult.status === 'queued') {
             // Queued, UI handled by dispatcher or keep generating msg?
             // Dispatcher returned "Queued..." message.
             // We can update the generating message to "Queued..."
             if (generatingMsg && jobResult.message) {
                 await telegram.editMessageText(chatId, generatingMsg.message_id, jobResult.message);
             }
        }

    } catch (e: any) {
        console.error('[LoveFortune] Exec Error:', e);
        if (generatingMsg) await telegram.deleteMessage(chatId, generatingMsg.message_id);
        
        if (e.message === 'QUOTA_EXCEEDED') {
             const buttons = [
                [{ text: this.i18n.t('fortune.get_more_bottles'), callback_data: 'fortune_get_more' }]
            ];
            await telegram.sendMessageWithButtons(chatId, this.i18n.t('fortune.quotaExceeded'), buttons);
        } else {
            await telegram.sendMessage(chatId, this.i18n.t('errors.systemErrorRetry'));
        }
    }
  }
}
