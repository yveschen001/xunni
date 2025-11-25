/**
 * 智能填入缺失的 i18n 翻译
 * 根据代码上下文和功能实现，自动填入正确的中文翻译
 */

import * as fs from 'fs';
import * as path from 'path';

// 翻译映射表（根据代码上下文智能推测）
const translations: Record<string, string> = {
  // adPrompt
  'adPrompt.waysToGetMore': '💡 獲得更多配額的方式：',
  'adPrompt.watchAdLimit': '• 📺 觀看廣告（今日已達上限）',
  'adPrompt.completeTask': '• ✨ 完成任務（獲得永久配額）',
  'adPrompt.inviteFriends': '• 🎁 邀請好友（每人 +1 配額）',
  'adPrompt.upgradeVip': '• 💎 升級 VIP（每天 30 個配額）',

  // adReward
  'adReward.vipNoAds': '💎 VIP 用戶無需觀看廣告',
  'adReward.pendingAd': '⏳ 廣告正在處理中，請稍候...',
  'adReward.cannotWatchMore': '❌ 今日已達觀看上限（20/20）',
  'adReward.noProviders': '❌ 目前沒有可用的廣告提供商',
  'adReward.cannotSelectProvider': '❌ 無法選擇廣告提供商',
  'adReward.watchAdTitle': '📺 觀看廣告',
  'adReward.watchAdReward': '完成觀看可獲得 +1 個額度',
  'adReward.watchAdClickButton': '點擊按鈕開始觀看',
  'adReward.startWatchButton': '開始觀看',
  'adReward.clickButtonHint': '💡 點擊下方按鈕開始觀看廣告',
  'adReward.completedReward': '✅ 已獲得 +1 個額度',
  'adReward.completedTitle': '🎉 廣告觀看完成！',
  'adReward.continueWatching': '繼續觀看',
  'adReward.dailyLimitReached': '今日已達觀看上限（20/20）',

  // admin.adConfig
  'admin.adConfig.noProviders': '⚠️ 目前沒有配置任何廣告提供商',
  'admin.adConfig.addProviderScript': '請使用資料庫腳本添加廣告提供商：',
  'admin.adConfig.providerList': '📢 **廣告提供商列表**',
  'admin.adConfig.enabled': '✅ 啟用',
  'admin.adConfig.disabled': '❌ 停用',
  'admin.adConfig.testMode': '🧪 測試模式',
  'admin.adConfig.managementCommands': '**管理命令：**',
  'admin.adConfig.enableCommand': '`/ad_provider_enable <provider_id>` - 啟用提供商',
  'admin.adConfig.disableCommand': '`/ad_provider_disable <provider_id>` - 停用提供商',
  'admin.adConfig.priorityCommand': '`/ad_provider_priority <provider_id> <priority>` - 設置優先級',
  'admin.adConfig.usageError': '❌ 使用方法錯誤',
  'admin.adConfig.correctFormat': '**正確格式：**',
  'admin.adConfig.example': '**示例：**',
  'admin.adConfig.enableFailed': '❌ 啟用廣告提供商失敗',
  'admin.adConfig.disableFailed': '❌ 停用廣告提供商失敗',
  'admin.adConfig.setPriorityFailed': '❌ 設置優先級失敗',
  'admin.adConfig.getListFailed': '❌ 獲取廣告提供商列表失敗',
  'admin.adConfig.priorityMustBeNonNegative': '❌ 優先級必須是非負整數',
  'admin.adConfig.providerEnabled': '✅ 已啟用廣告提供商',
  'admin.adConfig.providerDisabled': '✅ 已停用廣告提供商',
  'admin.adConfig.prioritySet': '✅ 優先級已設置',
  'admin.adConfig.viewAllProviders': '使用 `/ad_providers` 查看所有提供商',
  'admin.adConfig.noOfficialAds': '⚠️ 目前沒有官方廣告',
  'admin.adConfig.addOfficialAdScript': '請使用資料庫腳本添加官方廣告：',
  'admin.adConfig.officialAdList': '📢 **官方廣告列表**',
  'admin.adConfig.enableOfficialAdCommand': '`/official_ad_enable <ad_id>`',
  'admin.adConfig.disableOfficialAdCommand': '`/official_ad_disable <ad_id>`',
  'admin.adConfig.enableOfficialAdFailed': '❌ 啟用官方廣告失敗',
  'admin.adConfig.disableOfficialAdFailed': '❌ 停用官方廣告失敗',
  'admin.adConfig.getOfficialAdListFailed': '❌ 獲取官方廣告列表失敗',
  'admin.adConfig.viewAllOfficialAds': '使用 `/official_ads` 查看所有廣告',
  'admin.adConfig.adIdMustBeNumber': '❌ 廣告 ID 必須是數字',
  'admin.adConfig.officialAdEnabled': '✅ 已啟用官方廣告',
  'admin.adConfig.officialAdDisabled': '✅ 已停用官方廣告',
  'admin.adConfig.id': 'ID',
  'admin.adConfig.status': '狀態',
  'admin.adConfig.priority': '優先級',
  'admin.adConfig.weight': '權重',
  'admin.adConfig.type': '類型',
  'admin.adConfig.reward': '獎勵',
  'admin.adConfig.impressions': '展示次數',
  'admin.adConfig.clicks': '點擊次數',
  'admin.adConfig.provider': '提供商',
  'admin.adConfig.priorityValue': '優先級',
  'admin.adConfig.viewStatsCommand': '`/official_ad_stats <ad_id>` - 查看統計',

  // adminNotification
  'adminNotification.vipPurchased': '🎉 **新 VIP 購買**',
  'adminNotification.vipRenewed': '🔄 **VIP 續費**',
  'adminNotification.paymentFailed': '❌ **支付失敗**',
  'adminNotification.refundRequest': '💰 **退款申請**',
  'adminNotification.viewRefundsHint': '使用 `/vip_refunds` 查看所有退款申請',
  'adminNotification.vipReminderSent': '⏰ **VIP 到期提醒已發送**',
  'adminNotification.vipDowngraded': '😢 **VIP 會員已到期**',
  'adminNotification.systemNotification': '📢 **系統通知**',
  'adminNotification.user': '用戶',
  'adminNotification.amount': '金額',
  'adminNotification.expireDate': '到期',
  'adminNotification.newExpireDate': '新到期',
  'adminNotification.time': '時間',
  'adminNotification.reason': '原因',
  'adminNotification.requestId': '申請 ID',
  'adminNotification.paymentId': '支付 ID',
  'adminNotification.daysLeft': '剩餘天數',
  'adminNotification.type': '類型',
  'adminNotification.data': '數據',

  // appeal
  'appeal.statusPending': '待審核',
  'appeal.statusApproved': '已批准',
  'appeal.statusRejected': '已拒絕',
  'appeal.reviewedAt': '審核時間：',
  'appeal.notes': '備註：',

  // block
  'block.replyRequired': '⚠️ 請先完成註冊流程。',
  'block.steps': '**操作步驟：**',
  'block.step1': '1. 長按對方的訊息',
  'block.step2': '2. 選擇「回覆」',
  'block.step3': '3. 輸入 /block',
  'block.hint': '這樣可以準確指定要封鎖的對象。',
  'block.cannotIdentify': '❌ 無法識別對話對象',
  'block.ensureReply': '請確保回覆的是對方發送的訊息（帶有 # 標識符）。',
  'block.conversationNotFound': '❌ 找不到此對話',
  'block.conversationMayEnded': '對話可能已結束或不存在。',
  'block.conversationInfoError': '❌ 對話資訊錯誤。',
  'block.success': '✅ 已封鎖此使用者',
  'block.willNotMatch': '你們將不會再被匹配到對方的漂流瓶。',
  'block.catchNewBottle': '使用 /catch 撿新的漂流瓶開始新對話。',

  // broadcast
  'broadcast.messageEmpty': '❌ 廣播訊息不能為空',
  'broadcast.messageTooLong': '❌ 廣播訊息不能超過 4000 個字符',
  'broadcast.status.completed': '已完成',
  'broadcast.status.sending': '發送中',
  'broadcast.status.failed': '失敗',
  'broadcast.status.cancelled': '已取消',
  'broadcast.status.pending': '等待中',
  'broadcast.status.title': '📊 廣播狀態',
  'broadcast.status.id': 'ID',
  'broadcast.status.status': '狀態',
  'broadcast.status.target': '目標',
  'broadcast.status.progress': '進度',
  'broadcast.status.failedCount': '失敗',
  'broadcast.status.startedAt': '開始時間',
  'broadcast.status.completedAt': '完成時間',
  'broadcast.status.error': '錯誤',
  'broadcast.target.all': '所有用戶',
  'broadcast.target.vip': 'VIP 用戶',
  'broadcast.target.nonVip': '非 VIP 用戶',
  'broadcast.target.unknown': '未知',
  'broadcast.usageError': '❌ 使用方法錯誤',
  'broadcast.example': '**示例：**',
  'broadcast.created': '✅ 廣播已創建',
  'broadcast.users': '用戶數',
  'broadcast.estimatedTime': '預計時間',
  'broadcast.backgroundSend': '廣播將在後台發送，使用 /broadcast_status {broadcastId} 查看進度。',
  'broadcast.createFailed': '❌ 創建廣播失敗，請稍後再試。',
  'broadcast.vipUsageError': '❌ 使用方法錯誤\n\n**正確格式：**\n`/broadcast_vip <訊息內容>`',
  'broadcast.nonVipUsageError': '❌ 使用方法錯誤\n\n**正確格式：**\n`/broadcast_non_vip <訊息內容>`',
  'broadcast.filteredUsageError': '❌ 使用方法錯誤\n\n**正確格式：**\n`/broadcast_filtered <訊息內容> <過濾條件>`',
  'broadcast.filteredCreated': '✅ 過濾廣播已創建',
  'broadcast.filteredNoUsers': '⚠️ 沒有符合條件的用戶',
  'broadcast.filteredCreateFailed': '❌ 創建過濾廣播失敗',
  'broadcast.statusNotFound': '❌ 找不到廣播記錄',
  'broadcast.cancelSuccess': '✅ 廣播已取消',
  'broadcast.cancelFailed': '❌ 取消廣播失敗',
  'broadcast.cancelNotCancellable': '❌ 此廣播無法取消（已完成或已取消）',
  'broadcast.cancelConfirm': '⚠️ 確定要取消此廣播嗎？',
  'broadcast.cancelConfirmButton': '確認取消',
  'broadcast.cancelCancelled': '已取消操作',
  'broadcast.cancelError': '❌ 取消廣播時發生錯誤',
  'broadcast.estimate.immediate': '立即發送（約 1-2 秒）',
  'estimate.seconds': '約 {seconds} 秒',
  'estimate.minutes': '約 {minutes} 分鐘',

  // channelMembership
  'channelMembership.channelConfigError': '❌ 頻道配置錯誤',
  'channelMembership.notJoined': '❌ 未檢測到你加入頻道',
  'channelMembership.rewardGranted': '✅ 獎勵已發放',
  'channelMembership.taskCompleted': '🎉 恭喜完成任務！',
  'channelMembership.taskCompletedReward': '已為你增加 +1 個永久配額',
  'channelMembership.taskCompletedHint': '使用 /tasks 查看其他任務',
  'channelMembership.verificationFailed': '❌ 驗證失敗',
  'channelMembership.leftChannel': '❌ 已離開頻道',
  'channelMembership.claimRewardFailed': '❌ 領取獎勵失敗',
  'channelMembership.joined': '🎉 檢測到你已加入官方頻道！',
  'channelMembership.claimReward': '點擊下方按鈕領取獎勵：',
  'channelMembership.oneTimeReward': '💡 這是一次性獎勵，完成後不會再收到此通知。',
  'channelMembership.claimButton': '🎁 領取獎勵',
  'channelMembership.rewardAdded': '已為你增加 +1 個永久配額',
  'channelMembership.viewMoreTasks': '使用 /tasks 查看其他任務',
  'channelMembership.viewTaskCenter': '使用 /tasks 查看任務中心',

  // conversation
  'conversation.profileCardTitle': '👤 **匿名資料卡**',
  'conversation.nickname2': '📝 暱稱：{displayNickname}',
  'conversation.text3': '🗣️ 語言：{languageLabel}',
  'conversation.settings': '🧠 MBTI：{otherUser.mbti_result}',
  'conversation.zodiac2': '⭐ 星座：{zodiacLabel}',
  'conversation.bloodType2': '🩸 血型：{bloodTypeText}',
  'conversation.gender': '👤 性別：{otherUser.gender}',
  'conversation.age': '🎂 年齡：{ageRange}',
  'conversation.text4': '📍 城市：{otherUser.city}',
  'conversation.message8': '💭 興趣：{otherUser.interests}',
  'conversation.text5': '📖 簡介：{otherUser.bio}',
  'conversation.separator': '━━━━━━━━━━━━━━━━',
  'conversation.anonymousCardHint': '💡 這是匿名資料卡，不會顯示真實身份',
  'conversation.vipUnlockAvatar': '🔒 升級 VIP 解鎖對方清晰頭像',
  'conversation.vipLearnMore': '💎 使用 /vip 了解更多',
  'conversation.replyMethodsTitle': '💡 **兩種回覆方式**：',
  'conversation.replyMethod1': '• 直接發送訊息回覆',
  'conversation.replyMethod2': '• 點擊「💬 回覆訊息」按鈕',
  'conversation.editProfileCommand': '✏️ 編輯個人資料：/edit_profile',
  'conversation.backToMenuCommand': '🏠 返回主選單：/menu',
  'conversation.replyButton': '💬 回覆訊息',
  'conversation.blockConfirmTitle': '⚠️ **確認封鎖**',
  'conversation.blockConfirmMessage': '確定要封鎖此使用者嗎？封鎖後將無法再與對方匹配。',
  'conversation.blockConfirmButton': '確認封鎖',
  'conversation.cancelButton': '取消',
  'conversation.reportConfirmTitle': '⚠️ **確認舉報**',
  'conversation.reportConfirmMessage': '確定要舉報此使用者嗎？管理員將審核你的舉報。',
  'conversation.reportConfirmButton': '確認舉報',
  'conversation.blocked': '✅ 已封鎖',
  'conversation.blockSuccessTitle': '✅ **封鎖成功**',
  'conversation.blockSuccessMessage': '已封鎖此使用者，你們將不會再被匹配。',
  'conversation.blockSuccessNewConversation': '💬 對話已結束，使用 /catch 開始新對話。',
  'conversation.reported': '✅ 已舉報',
  'conversation.reportSuccessTitle': '✅ **舉報成功**',
  'conversation.reportSuccessMessage': '已收到你的舉報，管理員將盡快處理。',
  'conversation.reportSuccessNewConversation': '💬 對話已結束，使用 /catch 開始新對話。',
  'conversation.cancelSuccess': '✅ 已取消',
  'conversation.endedTitle': '💬 **對話已結束**',
  'conversation.endedMessage': '此對話已結束，使用 /catch 開始新對話。',
  'conversation.endedNewConversation': '💬 使用 /catch 開始新對話。',

  // conversationHistory
  'conversationHistory.you': '你',
  'conversationHistory.other': '對方',
  'conversationHistory.historyTitle': '💬 與 #{identifier} 的對話記錄（第 {postNumber} 頁）',
  'conversationHistory.partnerInfo': '👤 對方資料',
  'conversationHistory.nickname': '📝 暱稱',
  'conversationHistory.mbti': '🧠 MBTI',
  'conversationHistory.bloodType': '🩸 血型',
  'conversationHistory.zodiac': '⭐ 星座',
  'conversationHistory.matchScore': '💫 配對度',
  'conversationHistory.historyNote': '💡 這是對話的歷史記錄',
  'conversationHistory.totalMessages': '📊 總訊息數',
  'conversationHistory.lastUpdated': '📅 最後更新',
  'conversationHistory.replyHint': '💬 直接按 /reply 回覆訊息聊天',
  'conversationHistory.vipUnlockAvatar': '🔒 升級 VIP 解鎖對方清晰頭像',
  'conversationHistory.vipLearnMore': '💎 使用 /vip 了解更多',
  'conversationHistory.newMessageTitle': '💬 來自 #{identifier} 的新訊息：',
  'conversationHistory.replyCommandHint': '💬 直接按 /reply 回覆訊息聊天',
  'conversationHistory.historyCommandHint': '📜 查看歷史記錄：#{identifier}',
  'conversationHistory.menuCommandHint': '🏠 返回主選單：/menu',

  // dailyReports
  'dailyReports.header': '📊 **每日數據分析報表**',
  'dailyReports.time': '時間：{time}',

  // draft
  'draft.justNow': '剛剛',
  'draft.hoursAgo': '{hours} 小時前',
  'draft.daysAgo': '{days} 天前',
  'draft.age.justNow': '剛剛',
  'draft.age.hoursAgo': '{hours} 小時前',
  'draft.age.daysAgo': '{days} 天前',

  // maintenance
  'maintenance.completed': '✅ 系統維護已完成',
  'maintenance.serviceRestored': '服務已恢復正常，感謝您的耐心等待！',
  'maintenance.allFeaturesAvailable': '現在可以正常使用所有功能了。',

  // subscription
  'subscription.expired': '😢 **VIP 訂閱已到期**',
  'subscription.expiredDate': '你的 VIP 訂閱已於 {date} 到期。',
  'subscription.downgradedToFree': '你的帳號已恢復為免費會員。',
  'subscription.renewVipHint': '💡 隨時可以重新訂閱 VIP：/vip',
  'subscription.thankYou': '感謝你的支持！❤️',

  // tutorial
  'tutorial.welcome': '🎉 恭喜完成註冊！',
  'tutorial.whatIsXunNi': '🌊 **XunNi 是什麼？**',
  'tutorial.whatIsXunNiDesc': 'XunNi 是一個匿名漂流瓶交友平台，讓你可以通過丟瓶子和撿瓶子來認識新朋友。',
  'tutorial.throwBottle': '📦 **丟瓶子**',
  'tutorial.throwBottleDesc': '寫下你想說的話，丟出漂流瓶，等待有緣人撿到。',
  'tutorial.catchBottle': '🎣 **撿瓶子**',
  'tutorial.catchBottleDesc': '撿起別人的漂流瓶，開始一段新的對話。',
  'tutorial.howToBecomeFriends': '💬 **如何成為朋友？**',
  'tutorial.howToBecomeFriendsDesc': '通過對話建立聯繫，如果聊得來，可以繼續深入交流。',
  'tutorial.startUsing': '開始使用',
  'tutorial.skip': '跳過',
  'tutorial.readyToStart': '🎉 準備開始了嗎？',
  'tutorial.completeTasksForBottles': '完成任務可以獲得更多瓶子配額！',
  'tutorial.viewTasks': '查看任務',
  'tutorial.completed': '✅ 教程已完成',
  'tutorial.unknownStep': '❌ 未知的教程步驟',
  'tutorial.skipped': '⏭️ 已跳過教程',
  'tutorial.availableCommands': '**可用指令：**',
  'tutorial.commandThrow': '• /throw - 丟瓶子',
  'tutorial.commandCatch': '• /catch - 撿瓶子',
  'tutorial.commandTasks': '• /tasks - 查看任務',
  'tutorial.commandHelp': '• /help - 查看幫助',

  // vip (部分缺失的)
  'vip.conversation2': '🔄 正在刷新你的對話歷史...',
  'vip.text24': '升級 VIP 後，所有對話歷史將顯示清晰頭像。',
};

/**
 * 更新 CSV 文件
 */
function updateCSV(): void {
  const csvPath = path.join(process.cwd(), 'i18n_for_translation.csv');
  let content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');
  
  let updated = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('[需要翻译:')) {
      const match = line.match(/^([^,]+),\[需要翻译:([^\]]+)\]/);
      if (match) {
        const key = match[1];
        const translation = translations[key];
        if (translation) {
          // 替换翻译
          lines[i] = line.replace(/\[需要翻译:[^\]]+\]/, translation);
          updated++;
        }
      }
    }
  }
  
  fs.writeFileSync(csvPath, lines.join('\n'), 'utf-8');
  console.log(`✅ 已更新 CSV 中的 ${updated} 个翻译`);
}

/**
 * 更新 zh-TW.ts 文件
 */
function updateZhTW(): void {
  const zhTWPath = path.join(process.cwd(), 'src', 'i18n', 'locales', 'zh-TW.ts');
  let content = fs.readFileSync(zhTWPath, 'utf-8');
  
  let updated = 0;
  for (const [key, translation] of Object.entries(translations)) {
    // 解析 key 路径
    const parts = key.split('.');
    const namespace = parts[0];
    const keyName = parts.slice(1).join('.');
    
    // 构建匹配模式（匹配 [需要翻译: xxx]）
    let pattern: RegExp;
    let replacement: string;
    
    if (namespace === 'admin' && keyName.startsWith('adConfig.')) {
      // admin.adConfig.* 在 admin 命名空间下的 adConfig 对象中
      const actualKey = keyName.replace('adConfig.', '');
      pattern = new RegExp(
        `adConfig\\.${actualKey.replace(/\./g, '\\.')}:\\s*\`\\[需要翻译:[^\\]]+\\]\``,
        'g'
      );
      replacement = `adConfig.${actualKey}: \`${translation}\``;
    } else if (namespace === 'draft' && keyName.startsWith('age.')) {
      // draft.age.* 在 draft 命名空间下的 age 对象中
      const actualKey = keyName.replace('age.', '');
      pattern = new RegExp(
        `age\\.${actualKey.replace(/\./g, '\\.')}:\\s*\`\\[需要翻译:[^\\]]+\\]\``,
        'g'
      );
      replacement = `age.${actualKey}: \`${translation}\``;
    } else {
      // 其他情况：直接匹配 key
      pattern = new RegExp(
        `${keyName.replace(/\./g, '\\.')}:\\s*\`\\[需要翻译:[^\\]]+\\]\``,
        'g'
      );
      replacement = `${keyName}: \`${translation}\``;
    }
    
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      updated++;
    }
  }
  
  fs.writeFileSync(zhTWPath, content, 'utf-8');
  console.log(`✅ 已更新 zh-TW.ts 中的 ${updated} 个翻译`);
}

/**
 * 主函数
 */
function main(): void {
  console.log('🔍 开始智能填入缺失的翻译...\n');
  
  updateCSV();
  updateZhTW();
  
  console.log('\n✅ 完成！');
}

main();

