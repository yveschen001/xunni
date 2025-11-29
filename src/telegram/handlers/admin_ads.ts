import type { Env, TelegramMessage, TelegramCallbackQuery } from '~/types';
import type { OfficialAdType, OfficialAd } from '~/domain/official_ad';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { AdminAdsService } from '~/domain/admin/ads';
import { upsertSession, getActiveSession, deleteSession } from '~/db/queries/sessions';
import { parseSessionData } from '~/domain/session';
import { createI18n } from '~/i18n';
import { isAdmin } from '~/domain/admin/auth';
import { formatAdStats } from '~/domain/official_ad';
import { getAdStatistics } from '~/db/queries/official_ads';
import { AdminLogService } from '~/services/admin_log'; // Import Log Service

const SESSION_TYPE = 'admin_ad_wizard';

interface WizardData {
  step: 'type' | 'title' | 'content' | 'url' | 'target_id' | 'reward' | 'verification' | 'confirm';
  ad_data: Partial<OfficialAd>;
  edit_id?: number;
}

/**
 * Handle /admin_ads command - List ads and show menu
 */
export async function handleAdminAds(message: TelegramMessage, env: Env): Promise<void> {
  const telegramId = message.from!.id.toString();

  if (!isAdmin(env, telegramId)) {
    return; // Silent fail for non-admins
  }

  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const service = new AdminAdsService(db.d1, env, telegramId);
  // const i18n = createI18n('zh-TW'); // Admin interface in Traditional Chinese

  try {
    const ads = await service.getAds();

    let text = '📢 **官方廣告管理**\n\n';
    text += `共 ${ads.length} 則廣告\n\n`;

    const buttons: any[][] = [];

    // List ads
    for (const ad of ads) {
      const statusEmoji = ad.is_enabled ? '✅' : '⏸️';
      const typeEmoji = getAdTypeEmoji(ad.ad_type);

      buttons.push([
        {
          text: `${statusEmoji} ${typeEmoji} ${ad.title}`,
          callback_data: `admin_ad_view_${ad.id}`,
        },
      ]);
    }

    // Actions
    buttons.push([{ text: '➕ 創建新廣告', callback_data: 'admin_ad_create' }]);
    buttons.push([{ text: '🔄 刷新列表', callback_data: 'admin_ad_refresh' }]);

    await telegram.sendMessageWithButtons(message.chat.id, text, buttons);
  } catch (error) {
    console.error('[handleAdminAds] Error:', error);
    await telegram.sendMessage(message.chat.id, `❌ 錯誤: ${(error as Error).message}`);
  }
}

/**
 * Handle admin ad callbacks
 */
export async function handleAdminAdCallback(
  callbackQuery: TelegramCallbackQuery,
  env: Env
): Promise<void> {
  const telegramId = callbackQuery.from.id.toString();

  if (!isAdmin(env, telegramId)) {
    return;
  }

  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const service = new AdminAdsService(db.d1, env, telegramId);
  const chatId = callbackQuery.message!.chat.id;
  const data = callbackQuery.data!;

  try {
    await telegram.answerCallbackQuery(callbackQuery.id);

    if (data === 'admin_ad_create') {
      await startAdWizard(chatId, telegramId, env);
      return;
    }

    if (data === 'admin_ad_refresh') {
      // Redirect to main handler logic but update existing message
      // For simplicity, just send new message or delete old and send new
      await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);
      await handleAdminAds(callbackQuery.message!, env);
      return;
    }

    if (data.startsWith('admin_ad_view_')) {
      const adId = parseInt(data.replace('admin_ad_view_', ''), 10);
      const ads = await service.getAds();
      const ad = ads.find((a) => a.id === adId);

      if (!ad) {
        await telegram.sendMessage(chatId, '❌ 廣告不存在');
        return;
      }

      const stats = await getAdStatistics(db.d1, adId);
      // Re-calculate stats including daily/unique logic if needed, or trust DB stats
      // Use formatting helper
      const text = formatAdStats(ad, stats as any, createI18n('zh-TW'));

      const buttons = [
        [
          {
            text: ad.is_enabled ? '⏸️ 暫停' : '▶️ 啟用',
            callback_data: `admin_ad_toggle_${ad.id}`,
          },
          { text: '✏️ 編輯', callback_data: `admin_ad_edit_${ad.id}` },
        ],
        [
          { text: '📋 複製', callback_data: `admin_ad_duplicate_${ad.id}` },
          { text: '🗑️ 刪除', callback_data: `admin_ad_delete_${ad.id}` },
        ],
        [{ text: '🔙 返回列表', callback_data: 'admin_ad_refresh' }],
      ];

      await telegram.editMessageText(chatId, callbackQuery.message!.message_id, text, {
        reply_markup: { inline_keyboard: buttons },
      });
      return;
    }

    if (data.startsWith('admin_ad_toggle_')) {
      const adId = parseInt(data.replace('admin_ad_toggle_', ''), 10);
      const ads = await service.getAds();
      const ad = ads.find((a) => a.id === adId);

      if (ad) {
        const newStatus = !ad.is_enabled;
        await service.toggleAdStatus(adId, newStatus);
        
        // Log to Admin Group
        const log = new AdminLogService(env);
        await log.logEvent(
          '📢 **Ad Status Changed**',
          `Admin \`${telegramId}\` changed ad \`${ad.title}\` (ID: ${adId}) to ${newStatus ? 'Active ✅' : 'Paused ⏸️'}`
        );

        // Refresh view
        // Re-trigger view logic
        const newCallback = { ...callbackQuery, data: `admin_ad_view_${adId}` };
        await handleAdminAdCallback(newCallback, env);
      }
      return;
    }

    if (data.startsWith('admin_ad_delete_')) {
      const adId = parseInt(data.replace('admin_ad_delete_', ''), 10);
      await service.deleteAd(adId);
      
      // Log to Admin Group
      const log = new AdminLogService(env);
      await log.logEvent(
        '🗑️ **Ad Deleted**',
        `Admin \`${telegramId}\` deleted ad ID: ${adId}`
      );

      await telegram.sendMessage(chatId, '✅ 廣告已刪除');
      await telegram.deleteMessage(chatId, callbackQuery.message!.message_id);
      await handleAdminAds(callbackQuery.message!, env);
      return;
    }

    if (data.startsWith('admin_ad_duplicate_')) {
      const adId = parseInt(data.replace('admin_ad_duplicate_', ''), 10);
      const newId = await service.duplicateAd(adId);
      
      // Log to Admin Group
      const log = new AdminLogService(env);
      await log.logEvent(
        '📋 **Ad Duplicated**',
        `Admin \`${telegramId}\` duplicated ad ${adId} to new ID: ${newId}`
      );

      await telegram.sendMessage(chatId, `✅ 廣告已複製 (ID: ${newId})，目前為暫停狀態`);
      // Go to new ad view
      const newCallback = { ...callbackQuery, data: `admin_ad_view_${newId}` };
      await handleAdminAdCallback(newCallback, env);
      return;
    }

    if (data.startsWith('admin_ad_edit_')) {
      const adId = parseInt(data.replace('admin_ad_edit_', ''), 10);
      await startEditWizard(chatId, telegramId, adId, env);
      return;
    }

    // Wizard callbacks
    if (data.startsWith('wizard_type_')) {
      const type = data.replace('wizard_type_', '') as OfficialAdType;
      await updateWizardStep(
        chatId,
        telegramId,
        { step: 'title', ad_data: { ad_type: type } },
        env
      );
      return;
    }

    if (data.startsWith('wizard_verify_')) {
      const verify = data === 'wizard_verify_yes';
      await updateWizardStep(
        chatId,
        telegramId,
        { step: 'confirm', ad_data: { requires_verification: verify } },
        env
      );
      return;
    }

    if (data === 'wizard_confirm') {
      await finalizeWizard(chatId, telegramId, env);
      return;
    }

    if (data === 'wizard_cancel') {
      await deleteSession(db, telegramId, SESSION_TYPE);
      await telegram.sendMessage(chatId, '🚫 操作已取消');
      return;
    }

    if (data === 'wizard_skip') {
      // Handle skip logic for editing
      await handleWizardSkip(chatId, telegramId, env);
      return;
    }
  } catch (error) {
    console.error('[handleAdminAdCallback] Error:', error);
    await telegram.sendMessage(chatId, `❌ 錯誤: ${(error as Error).message}`);
  }
}

/**
 * Handle admin ad text input
 */
export async function handleAdminAdInput(message: TelegramMessage, env: Env): Promise<boolean> {
  const telegramId = message.from!.id.toString();

  if (!isAdmin(env, telegramId)) {
    return false;
  }

  const db = createDatabaseClient(env.DB);
  const session = await getActiveSession(db, telegramId, SESSION_TYPE);

  if (!session) {
    return false;
  }

  const text = message.text || '';
  if (text.startsWith('/')) {
    // Command aborts wizard
    await deleteSession(db, telegramId, SESSION_TYPE);
    return false;
  }

  await handleWizardInput(message.chat.id, telegramId, text, env, session);
  return true;
}

// ============================================================================
// Wizard Logic
// ============================================================================

async function startAdWizard(chatId: number, telegramId: string, env: Env) {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);

  const initialData: WizardData = {
    step: 'type',
    ad_data: {},
  };

  await upsertSession(db, telegramId, SESSION_TYPE, { data: initialData });

  await telegram.sendMessageWithButtons(chatId, '🆕 **創建新廣告**\n\n請選擇廣告類型：', [
    [
      { text: '📢 文字 (Text)', callback_data: 'wizard_type_text' },
      { text: '🔗 連結 (Link)', callback_data: 'wizard_type_link' },
    ],
    [
      { text: '👥 群組 (Group)', callback_data: 'wizard_type_group' },
      { text: '📣 頻道 (Channel)', callback_data: 'wizard_type_channel' },
    ],
    [{ text: '🚫 取消', callback_data: 'wizard_cancel' }],
  ]);
}

async function startEditWizard(chatId: number, telegramId: string, adId: number, env: Env) {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const service = new AdminAdsService(db.d1, env, telegramId);

  const ads = await service.getAds();
  const ad = ads.find((a) => a.id === adId);
  if (!ad) throw new Error('Ad not found');

  // Start from title since type cannot be changed easily
  const initialData: WizardData = {
    step: 'title',
    ad_data: { ...ad },
    edit_id: adId,
  };

  await upsertSession(db, telegramId, SESSION_TYPE, { data: initialData });

  await telegram.sendMessageWithButtons(
    chatId,
    `✏️ **編輯廣告** (ID: ${adId})\n\n當前標題：\n${ad.title}\n\n請輸入新標題，或點擊跳過：`,
    [
      [{ text: '⏭️ 跳過 (保持不變)', callback_data: 'wizard_skip' }],
      [{ text: '🚫 取消', callback_data: 'wizard_cancel' }],
    ]
  );
}

async function updateWizardStep(
  chatId: number,
  telegramId: string,
  updates: { step?: WizardData['step']; ad_data?: Partial<OfficialAd> },
  env: Env
) {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);

  const session = await getActiveSession(db, telegramId, SESSION_TYPE);
  if (!session) return;

  const currentData = parseSessionData(session).data as WizardData;
  const newData: WizardData = {
    ...currentData,
    step: updates.step || currentData.step,
    ad_data: { ...currentData.ad_data, ...updates.ad_data },
  };

  await upsertSession(db, telegramId, SESSION_TYPE, { data: newData });

  // Show next step prompt
  switch (newData.step) {
    case 'title':
      await telegram.sendMessage(chatId, '請輸入廣告 **標題** (Max 40字):\n(系統將自動翻譯)');
      break;
    case 'content':
      await telegram.sendMessageWithButtons(
        chatId,
        '請輸入廣告 **內文** (Max 300字):\n(系統將自動翻譯)',
        newData.edit_id ? [[{ text: '⏭️ 跳過', callback_data: 'wizard_skip' }]] : []
      );
      break;
    case 'url':
      if (newData.ad_data.ad_type === 'text') {
        // Skip URL for text ads
        await updateWizardStep(chatId, telegramId, { step: 'reward' }, env);
      } else {
        await telegram.sendMessageWithButtons(
          chatId,
          '請輸入 **URL** (https://...):',
          newData.edit_id ? [[{ text: '⏭️ 跳過', callback_data: 'wizard_skip' }]] : []
        );
      }
      break;
    case 'target_id':
      if (['group', 'channel'].includes(newData.ad_data.ad_type!)) {
        await telegram.sendMessageWithButtons(
          chatId,
          '請輸入 **Target ID** (@channel 或 Chat ID):',
          newData.edit_id ? [[{ text: '⏭️ 跳過', callback_data: 'wizard_skip' }]] : []
        );
      } else {
        await updateWizardStep(chatId, telegramId, { step: 'reward' }, env);
      }
      break;
    case 'reward':
      await telegram.sendMessageWithButtons(
        chatId,
        '請輸入 **獎勵額度** (1-10):',
        newData.edit_id ? [[{ text: '⏭️ 跳過', callback_data: 'wizard_skip' }]] : []
      );
      break;
    case 'verification':
      if (['group', 'channel'].includes(newData.ad_data.ad_type!)) {
        await telegram.sendMessageWithButtons(
          chatId,
          '是否需要 **強制驗證** (用戶必須加入群組/頻道)?',
          [
            [
              { text: '✅ 是', callback_data: 'wizard_verify_yes' },
              { text: '❌ 否', callback_data: 'wizard_verify_no' },
            ],
            ...(newData.edit_id ? [[{ text: '⏭️ 跳過', callback_data: 'wizard_skip' }]] : []),
          ]
        );
      } else {
        await updateWizardStep(
          chatId,
          telegramId,
          { step: 'confirm', ad_data: { requires_verification: false } },
          env
        );
      }
      break;
    case 'confirm': {
      const ad = newData.ad_data;
      const typeEmoji = getAdTypeEmoji(ad.ad_type!);
      const msg = `
🔍 **確認內容**

類型: ${typeEmoji} ${ad.ad_type}
標題: ${ad.title}
內文: ${ad.content}
URL: ${ad.url || '無'}
Target: ${ad.target_entity_id || '無'}
獎勵: ${ad.reward_quota} 瓶 (當日有效)
驗證: ${ad.requires_verification ? '✅' : '❌'}

確認發布?
`;
      await telegram.sendMessageWithButtons(chatId, msg, [
        [{ text: '🚀 確認發布', callback_data: 'wizard_confirm' }],
        [{ text: '🚫 取消', callback_data: 'wizard_cancel' }],
      ]);
      break;
    }
  }
}

async function handleWizardInput(
  chatId: number,
  telegramId: string,
  text: string,
  env: Env,
  session: any
) {
  const data = parseSessionData(session).data as WizardData;

  switch (data.step) {
    case 'title':
      if (text.length > 40) {
        await createTelegramService(env).sendMessage(chatId, '❌ 標題太長 (Max 40字)，請重試:');
        return;
      }
      await updateWizardStep(
        chatId,
        telegramId,
        { step: 'content', ad_data: { title: text } },
        env
      );
      break;
    case 'content':
      if (text.length > 300) {
        await createTelegramService(env).sendMessage(chatId, '❌ 內文太長 (Max 300字)，請重試:');
        return;
      }
      await updateWizardStep(chatId, telegramId, { step: 'url', ad_data: { content: text } }, env);
      break;
    case 'url':
      try {
        new URL(text);
        await updateWizardStep(
          chatId,
          telegramId,
          { step: 'target_id', ad_data: { url: text } },
          env
        );
      } catch {
        await createTelegramService(env).sendMessage(chatId, '❌ 無效的 URL，請重試:');
      }
      break;
    case 'target_id':
      // Basic validation?
      await updateWizardStep(
        chatId,
        telegramId,
        { step: 'reward', ad_data: { target_entity_id: text } },
        env
      );
      break;
    case 'reward': {
      const reward = parseInt(text, 10);
      if (isNaN(reward) || reward < 1 || reward > 10) {
        await createTelegramService(env).sendMessage(chatId, '❌ 請輸入 1-10 之間的數字:');
        return;
      }
      await updateWizardStep(
        chatId,
        telegramId,
        { step: 'verification', ad_data: { reward_quota: reward } },
        env
      );
      break;
    }
  }
}

async function handleWizardSkip(chatId: number, telegramId: string, env: Env) {
  const db = createDatabaseClient(env.DB);
  const session = await getActiveSession(db, telegramId, SESSION_TYPE);
  if (!session) return;

  const data = parseSessionData(session).data as WizardData;

  // Determine next step based on current step
  let nextStep: WizardData['step'] | undefined;

  switch (data.step) {
    case 'title':
      nextStep = 'content';
      break;
    case 'content':
      nextStep = 'url';
      break;
    case 'url':
      nextStep = 'target_id';
      break;
    case 'target_id':
      nextStep = 'reward';
      break;
    case 'reward':
      nextStep = 'verification';
      break;
    case 'verification':
      nextStep = 'confirm';
      break;
  }

  if (nextStep) {
    await updateWizardStep(chatId, telegramId, { step: nextStep }, env);
  }
}

async function finalizeWizard(chatId: number, telegramId: string, env: Env) {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const service = new AdminAdsService(db.d1, env, telegramId);

  const session = await getActiveSession(db, telegramId, SESSION_TYPE);
  if (!session) return;

  const data = parseSessionData(session).data as WizardData;
  const adData = data.ad_data as any; // Cast to allow flexibility
  const log = new AdminLogService(env);

  try {
    if (data.edit_id) {
      await service.editAd(data.edit_id, adData);
      
      await log.logEvent(
        '✏️ **Ad Edited**',
        `Admin \`${telegramId}\` updated ad ID: ${data.edit_id}\nTitle: ${adData.title}`
      );

      await telegram.sendMessage(chatId, '✅ 廣告更新成功');
    } else {
      await service.createAd(adData);
      
      await log.logEvent(
        '🆕 **Ad Created**',
        `Admin \`${telegramId}\` created new ad: ${adData.title} (${adData.ad_type})`
      );

      await telegram.sendMessage(chatId, '✅ 廣告創建成功');
    }

    await deleteSession(db, telegramId, SESSION_TYPE);
    // Return to list
    const fakeMessage = { chat: { id: chatId }, from: { id: parseInt(telegramId) } } as any;
    await handleAdminAds(fakeMessage, env);
  } catch (error) {
    console.error('[finalizeWizard] Error:', error);
    await telegram.sendMessage(chatId, `❌ 錯誤: ${(error as Error).message}`);
  }
}

function getAdTypeEmoji(type: string): string {
  switch (type) {
    case 'text':
      return '📢';
    case 'link':
      return '🔗';
    case 'group':
      return '👥';
    case 'channel':
      return '📣';
    default:
      return '❓';
  }
}
