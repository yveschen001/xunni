import type { Translations } from '../types';

/**
 * nl translations
 * Auto-generated from i18n_for_translation.csv
 */
export const translations: Translations = {
  ad: {
    ad: `💡 繼續觀看廣告可獲得更多額度！（已修正）`,
    bottle: `[需要翻译]`,
    bottle2: `[需要翻译]`,
    bottle: `[需要翻译]`,
    bottle2: `[需要翻译]`,
  },
  adPrompt: {
    completeTask: `• ✨ 完成任務（獲得永久配額）`,
    inviteFriends: `• 🎁 邀請好友（每人 +1 配額）`,
    quotaExhausted: `❌ 今日漂流瓶配額已用完（\${quotaDisplay}）`,
    taskButton: `✨ \${taskName} 🎁`,
    upgradeVip: `• 💎 升級 VIP（每天 30 個配額）`,
    watchAd: `• 📺 觀看廣告（剩餘 \${remaining}/20 次）`,
    watchAdLimit: `• 📺 觀看廣告（今日已達上限）`,
    waysToGetMore: `💡 獲得更多配額的方式：`,
  },
  adProvider: {
    'health.good': `良好`,
    'health.needsAttention': `需要關注`,
  },
  adReward: {
    adCompleted: `廣告完成！獲得 +\${quota} 個配額`,
    cannotSelectProvider: `⚠️ 無法選擇廣告提供商`,
    cannotWatchMore: `⚠️ 無法觀看更多廣告`,
    clickButtonHint: `✅ 請點擊按鈕開始觀看`,
    completedEarned: `🎁 今日已獲得：**\${earned}** 個額度`,
    completedRemaining: `📈 剩餘次數：**\${remaining}** 次`,
    completedReward: `✅ 獲得 **+1 個額度**`,
    completedTitle: `🎉 **廣告觀看完成！**`,
    completedWatched: `📊 今日已觀看：**\${watched}/20** 次`,
    continueWatching: `💡 繼續觀看廣告可獲得更多額度！`,
    dailyLimitReached: `今日廣告已達上限（\${max}/\${max}）`,
    getStatusFailed: `❌ 獲取廣告狀態失敗`,
    noProviders: `⚠️ 暫無可用的廣告提供商`,
    pendingAd: `⚠️ 請先完成上一支廣告，再開始新的廣告`,
    startWatchButton: `📺 開始觀看廣告`,
    vipNoAds: `💎 VIP 用戶無需觀看廣告`,
    vipNoAdsReason: `VIP 用戶擁有無限配額，無需觀看廣告`,
    watchAdClickButton: `👇 點擊下方按鈕開始觀看`,
    watchAdRemaining: `📊 今日剩餘：**\${remaining}/20** 次`,
    watchAdReward: `🎁 完成觀看可獲得 **+1 個額度**`,
    watchAdTitle: `📺 **觀看廣告獲得額度**`,
  },
  admin: {
    ad: `使用 /official_ads 查看所有廣告`,
    ad2: `請使用資料庫腳本添加廣告提供商：
`,
    ad3: `📺 **廣告提供商列表**

`,
    ad4: `請使用資料庫腳本添加官方廣告：
`,
    ad5: `📢 **官方廣告列表**

`,
    'adConfig.adIdMustBeNumber': `❌ 廣告 ID 必須是數字`,
    'adConfig.addOfficialAdScript': `請使用資料庫腳本添加官方廣告：`,
    'adConfig.addProviderScript': `請使用資料庫腳本添加廣告提供商：`,
    'adConfig.clicks': `• 點擊: \${count} 次`,
    'adConfig.correctFormat': `**正確格式：**`,
    'adConfig.disableCommand': `• \`/ad_provider_disable <id>\` - 停用`,
    'adConfig.disableFailed': `❌ 停用廣告提供商失敗`,
    'adConfig.disableOfficialAdCommand': `• \`/official_ad_disable <id>\` - 停用`,
    'adConfig.disableOfficialAdFailed': `❌ 停用官方廣告失敗`,
    'adConfig.disabled': `❌ 停用`,
    'adConfig.enableCommand': `• \`/ad_provider_enable <id>\` - 啟用`,
    'adConfig.enableFailed': `❌ 啟用廣告提供商失敗`,
    'adConfig.enableOfficialAdCommand': `• \`/official_ad_enable <id>\` - 啟用`,
    'adConfig.enableOfficialAdFailed': `❌ 啟用官方廣告失敗`,
    'adConfig.enabled': `✅ 啟用`,
    'adConfig.example': `**範例：**`,
    'adConfig.getListFailed': `❌ 獲取廣告提供商列表失敗`,
    'adConfig.getOfficialAdListFailed': `❌ 獲取官方廣告列表失敗`,
    'adConfig.id': `• ID: \${id}`,
    'adConfig.impressions': `• 展示: \${count} 次`,
    'adConfig.managementCommands': `**管理命令：**`,
    'adConfig.noOfficialAds': `⚠️ 目前沒有官方廣告`,
    'adConfig.noProviders': `⚠️ 目前沒有配置任何廣告提供商`,
    'adConfig.officialAdDisabled': `✅ 已停用官方廣告 #\${id}`,
    'adConfig.officialAdEnabled': `✅ 已啟用官方廣告 #\${id}`,
    'adConfig.officialAdList': `📢 **官方廣告列表**`,
    'adConfig.priority': `• 優先級: \${priority}`,
    'adConfig.priorityCommand': `• \`/ad_provider_priority <id> <priority>\` - 設置優先級`,
    'adConfig.priorityMustBeNonNegative': `❌ 優先級必須是非負整數`,
    'adConfig.prioritySet': `✅ 已設置廣告提供商優先級`,
    'adConfig.priorityValue': `優先級：\${priority}`,
    'adConfig.provider': `提供商：\${name}`,
    'adConfig.providerDisabled': `✅ 已停用廣告提供商：\${name}`,
    'adConfig.providerEnabled': `✅ 已啟用廣告提供商：\${name}`,
    'adConfig.providerList': `📺 **廣告提供商列表**`,
    'adConfig.reward': `• 獎勵: \${reward} 額度`,
    'adConfig.setPriorityFailed': `❌ 設置優先級失敗`,
    'adConfig.status': `• 狀態: \${status}`,
    'adConfig.testMode': `• 🧪 測試模式`,
    'adConfig.type': `• 類型: \${type}`,
    'adConfig.usageError': `❌ 使用方法錯誤`,
    'adConfig.viewAllOfficialAds': `使用 /official_ads 查看所有廣告`,
    'adConfig.viewAllProviders': `使用 /ad_providers 查看所有提供商`,
    'adConfig.viewStatsCommand': `• \`/ad_stats <id>\` - 查看詳細統計`,
    'adConfig.weight': `• 權重: \${weight}`,
    addAlreadyAdmin: `❌ 此用戶已經是管理員。`,
    addAlreadySuperAdmin: `❌ 此用戶已經是超級管理員，無需添加。`,
    addCommand: `\`/admin_add <user_id>\`

`,
    addExample: `\`/admin_add 123456789\` - 添加為普通管理員

`,
    addInstructions: `⚠️ **注意**

此命令需要手動修改配置文件。

**步驟：**
1. 編輯 \`wrangler.toml\`
2. 找到 \`ADMIN_USER_IDS\` 變數
3. 添加用戶 ID：\`{userId}\`
4. 格式：\`ADMIN_USER_IDS = "ID1,ID2,{userId}"\`
5. 重新部署：\`pnpm deploy:staging\`

**用戶資訊：**
• ID: \`{userId}\`
• 暱稱: {nickname}
• 用戶名: @{username}

💡 或在 Cloudflare Dashboard 中修改環境變數`,
    addUsageError: `❌ 使用方法錯誤

`,
    addUserNotFound: `❌ 用戶不存在或未註冊。`,
    admin: `💡 使用 /admin_list 查看當前管理員列表`,
    admin2: `管理員封禁 / Admin ban`,
    admin3: `- 添加為普通管理員

`,
    admin4: `- 移除普通管理員

`,
    admin5: `\`/admin_add 123456789\` - 添加為普通管理員

`,
    admin6: `\`/admin_remove 123456789\` - 移除普通管理員

`,
    'analytics.getAdDataFailed': `❌ 獲取廣告數據失敗`,
    'analytics.getDataFailed': `❌ 獲取分析數據失敗`,
    'analytics.getVipDataFailed': `❌ 獲取 VIP 漏斗數據失敗`,
    'analytics.noPermission': `❌ 你沒有權限查看分析數據`,
    'analytics.noPermissionAd': `❌ 你沒有權限查看廣告數據`,
    'analytics.noPermissionVip': `❌ 你沒有權限查看 VIP 數據`,
    'analytics.onlySuperAdmin': `❌ 只有超級管理員可以使用此命令。`,
    'analytics.sendReportFailed': `❌ 發送每日報表失敗：\${error}`,
    'analytics.userNotFound': `❌ 用戶不存在：\${userId}`,
    appeal: `申訴 ID: \${appeal.id}
`,
    appeal2: `💡 使用以下命令審核申訴：
`,
    appeal3: `📋 待審核申訴列表

`,
    appeal4: `申訴已批准`,
    appeal5: `申訴被拒絕`,
    appealAlreadyReviewed: `❌ 申訴 {id} 已經被審核過了`,
    appealApproveUsageError: `❌ 請提供申訴 ID

用法: /admin_approve <appeal_id> [備註]`,
    appealApproved: `✅ 申訴 {id} 已批准，用戶已解封`,
    appealApprovedDefault: `申訴已批准`,
    appealDivider: `━━━━━━━━━━━━━━━━
`,
    appealId: `申訴 ID: {id}
`,
    appealNotFound: `❌ 找不到申訴 ID: {id}`,
    appealReason: `理由: {reason}
`,
    appealRejectUsageError: `❌ 請提供申訴 ID

用法: /admin_reject <appeal_id> [備註]`,
    appealRejected: `✅ 申訴 {id} 已拒絕`,
    appealRejectedDefault: `申訴被拒絕`,
    appealReviewCommands: `/admin_approve <appeal_id> [備註]
/admin_reject <appeal_id> [備註]`,
    appealReviewHint: `💡 使用以下命令審核申訴：
`,
    appealSubmittedAt: `提交時間: {time}

`,
    appealUser: `用戶: {user}
`,
    appealsTitle: `📋 待審核申訴列表

`,
    ban: `💡 使用 /admin_bans <user_id> 查看特定用戶的封禁歷史`,
    'ban.appealAlreadyReviewed': `❌ 申訴 {id} 已經被審核過了`,
    'ban.appealApproved': `申訴已批准`,
    'ban.appealApprovedUnbanned': `✅ 申訴 {id} 已批准，用戶已解封`,
    'ban.appealId': `申訴 ID: {id}
`,
    'ban.appealList': `📋 待審核申訴列表

`,
    'ban.appealNotFound': `❌ 找不到申訴 ID: {id}`,
    'ban.appealReason': `理由: {reason}
`,
    'ban.appealRejected': `申訴被拒絕`,
    'ban.appealRejectedMessage': `✅ 申訴 {id} 已拒絕`,
    'ban.appealSubmittedAt': `提交時間: {time}

`,
    'ban.appealUser': `用戶: {user}
`,
    'ban.banEnd': `結束: \${end}`,
    'ban.banId': `ID: \${id}`,
    'ban.banReason': `原因: \${reason}`,
    'ban.banStart': `開始: \${start}`,
    'ban.banUser': `用戶: \${user}`,
    'ban.durationDays': `{days} 天`,
    'ban.durationHours': `{hours} 小時`,
    'ban.durationMustBePositive': `❌ 時長必須是正整數或 "permanent"。`,
    'ban.noAppeals': `✅ 目前沒有待審核的申訴`,
    'ban.noBanRecords': `❌ 用戶 \${userId} 沒有封禁記錄`,
    'ban.noBanRecordsList': `📊 目前沒有封禁記錄`,
    'ban.noPermission': `❌ 你沒有權限使用此命令。`,
    'ban.notAdmin': `❌ 此用戶不是管理員。`,
    'ban.permanent': `永久`,
    'ban.provideAppealId': `❌ 請提供申訴 ID

`,
    'ban.reason': `管理員封禁 / Admin ban`,
    'ban.recentBans': `📊 最近 10 條封禁記錄`,
    'ban.riskScore': `風險分數: \${score}`,
    'ban.temporaryBan': `🚫 你已被暫時封禁

封禁時長：{duration}
解封時間：{unbanTime}

封禁原因：多次被舉報

如有疑問，請使用 /appeal 提出申訴。`,
    'ban.totalBans': `總封禁次數: \${count}`,
    'ban.usageApprove': `用法: /admin_approve <appeal_id> [備註]`,
    'ban.usageReject': `用法: /admin_reject <appeal_id> [備註]`,
    'ban.user': `用戶: \${user}`,
    'ban.userBanHistory': `📊 用戶封禁歷史`,
    'ban.viewHistory': `💡 使用 /admin_bans <user_id> 查看特定用戶的封禁歷史`,
    ban2: `總封禁次數: \${userBans.results.length}

`,
    ban3: `📊 最近 10 條封禁記錄

`,
    ban4: `📊 用戶封禁歷史

`,
    ban5: `📊 目前沒有封禁記錄`,
    banUsageError: `使用方式错误`,
    banUserNotFound: `用户不存在`,
    cannotBanAdmin: `无法封禁管理员`,
    conversation: `💡 對話歷史帖子只在有新消息時創建
`,
    conversation2: `所有 VIP 用戶的對話歷史都是最新的！`,
    conversation3: `
💬 **對話歷史帖子：**
`,
    conversation4: `請檢查對話歷史是否已更新為清晰頭像。`,
    conversation5: `🔄 開始刷新您的對話歷史...`,
    conversation6: `• 無對話歷史帖子
`,
    'diagnose.allUpToDateFree': `✅ 所有帖子都是最新的（免費用戶狀態正確）`,
    'diagnose.allUpToDateVip': `✅ 所有帖子都是最新的（VIP 狀態正確）`,
    'diagnose.analysis': `🔎 **分析：**`,
    'diagnose.avatarCache': `📸 **頭像緩存：**`,
    'diagnose.blurredUrl': `• 模糊 URL：\${status}`,
    'diagnose.createdWithVip': `  • 創建時 VIP：\${status}`,
    'diagnose.error': `錯誤：\${error}`,
    'diagnose.failed': `❌ **診斷失敗**`,
    'diagnose.fileId': `• File ID：\${fileId}...`,
    'diagnose.hasAvatar': `  • 有頭像：\${status}`,
    'diagnose.historyPosts': `💬 **對話歷史帖子：**`,
    'diagnose.historyPostsHint': `💡 對話歷史帖子只在有新消息時創建`,
    'diagnose.isLatest': `  • 最新：\${status}`,
    'diagnose.morePosts': `...還有 \${count} 個帖子`,
    'diagnose.nickname': `• 暱稱：\${nickname}`,
    'diagnose.no': `❌ 否`,
    'diagnose.noCache': `• 無緩存`,
    'diagnose.noHistoryPosts': `• 無對話歷史帖子`,
    'diagnose.noHistoryPostsWarning': `⚠️ 此用戶沒有對話歷史帖子`,
    'diagnose.none': `無`,
    'diagnose.originalUrl': `• 原始 URL：\${status}`,
    'diagnose.outdatedPostsFound': `⚠️ 發現 \${count} 個過時帖子需要刷新`,
    'diagnose.postId': `  • ID：\${id}`,
    'diagnose.postTitle': `📝 **帖子 #\${identifier}-H\${postNumber}**`,
    'diagnose.postUpdatedAt': `  • 更新時間：\${date}`,
    'diagnose.refreshHint': `💡 使用 /admin_refresh_vip_avatars 批量刷新`,
    'diagnose.title': `🔍 **頭像診斷報告**`,
    'diagnose.totalPosts': `• 總數：\${count}`,
    'diagnose.unknown': `未知`,
    'diagnose.updatedAt': `• 更新時間：\${date}`,
    'diagnose.userId': `• ID：\${userId}`,
    'diagnose.userInfo': `👤 **用戶信息：**`,
    'diagnose.username': `• 用戶名：@\${username}`,
    'diagnose.vipExpire': `• VIP 到期：\${date}`,
    'diagnose.vipStatus': `• VIP 狀態：\${status}`,
    'diagnose.yes': `✅ 是`,
    end: `結束: \${banEnd}

`,
    error: `错误`,
    failed: `• 失敗帖子：\${results.totalPostsFailed}

`,
    failed2: `• 失敗：\${results.failedUsers}
`,
    failed3: `• 失敗：\${result.failed} 個帖子

`,
    insufficientPermission: `❌ **權限不足**

此命令僅限超級管理員使用。`,
    listFooter: `---`,
    listNotRegistered: `未注册`,
    listRoleAdmin: `管理员`,
    listRoleSuperAdmin: `超级管理员`,
    listTitle: `管理员列表`,
    message: `• 更新時間：\${new Date(post.updated_at).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}

`,
    message10: `• 有頭像：\${post.partner_avatar_url ? '✅' : '❌'}
`,
    message11: `...還有 \${historyPosts.results.length - 5} 個帖子
`,
    message12: `用戶: \${targetUser?.nickname || targetUserId}
`,
    message13: `• 用戶名: @\${targetUser}

`,
    message14: `用戶: \${appeal.nickname || appeal.user_id}
`,
    message15: `
...還有 \${results.details.length - 10} 個用戶`,
    message16: `• 用戶名: @\${targetUser.username}

`,
    message17: `• 總數：\${historyPosts.results.length}

`,
    message18: `💡 使用 /admin_refresh_vip_avatars 批量刷新
`,
    message19: `• 最新：\${post.is_latest ? '✅' : '❌'}
`,
    message2: `• 更新時間：\${avatarInfo.avatar_updated_at ? new Date(avatarInfo.avatar_updated_at).toLocaleString('zh-TW') : '未知'}
`,
    message20: `• 過時帖子：\${stats.totalOutdatedPosts}

`,
    message21: `/ad_provider_priority <id> <priority>`,
    message22: `• 需要刷新：\${stats.usersNeedingRefresh}
`,
    message23: `• 更新帖子：\${results.totalPostsUpdated}
`,
    message24: `用戶: \${ban.nickname || ban.user_id}
`,
    message25: `/ad_provider_disable <provider_id>`,
    message26: `💡 或在 Cloudflare Dashboard 中修改環境變數`,
    message27: `/ad_provider_enable <provider_id>`,
    message28: `• 用戶名: @\${targetUser?.username ||`,
    message29: `/admin_approve <appeal_id> [備註]
`,
    message3: `• \${username}: \${detail.postsUpdated} 更新, \${detail.postsFailed} 失敗
`,
    message30: `• 展示: \${ad.impression_count} 次
`,
    message31: `• 用戶名: @\${targetUser.username}
`,
    message33: `/admin_reject <appeal_id> [備註]`,
    message34: `• 處理用戶：\${results.totalUsers}
`,
    message35: `• \`/ad_provider_enable <id>\` - 啟用
`,
    message36: `• \`/ad_provider_disable <id>\` - 停用
`,
    message37: `• \`/ad_provider_priority <id> <priority>\` - 設置優先級`,
    message38: `• \`/official_ad_enable <id>\` - 啟用
`,
    message39: `• \`/official_ad_disable <id>\` - 停用
`,
    message4: `新到期：\${new Date(data.expire_date).toLocaleDateString('zh-TW')}
`,
    message40: `• 更新時間：\${new Date(post.updated_at).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour:`,
    message5: `到期：\${new Date(data.expire_date).toLocaleDateString('zh-TW')}
`,
    message6: `錯誤：\${error instanceof Error ? error.message : String(error)}`,
    message7: `• 原始 URL：\${avatarInfo.avatar_original_url ? '✅' : '❌'}
`,
    message8: `• 模糊 URL：\${avatarInfo.avatar_blurred_url ? '✅' : '❌'}
`,
    message9: `📝 **帖子 #\${post.identifier}-H\${post.post_number}**
`,
    nickname: `• 暱稱: \${targetUser?.nickname ||`,
    nickname2: `• 暱稱: \${targetUser.nickname ||`,
    noPendingAppeals: `✅ 目前沒有待審核的申訴`,
    noPermission: `❌ 你沒有權限使用此命令。`,
    onlyAdmin: `❌ 只有管理員可以使用此命令。`,
    onlySuperAdmin: `❌ 只有超級管理員可以使用此命令。`,
    operationFailed: `❌ 發生錯誤，請稍後再試。`,
    'refresh.allUpToDate': `所有 VIP 用戶的對話歷史都是最新的！`,
    'refresh.batchComplete': `✅ **批量刷新完成**`,
    'refresh.checkHint': `請檢查對話歷史是否已更新為清晰頭像。`,
    'refresh.complete': `✅ **刷新完成**`,
    'refresh.details': `📝 **詳細結果：**`,
    'refresh.duration': `⏱️ **耗時：** \${duration} 秒`,
    'refresh.error': `錯誤：\${error}`,
    'refresh.errorOccurred': `處理過程中發生錯誤，請查看日誌。`,
    'refresh.failed': `❌ **刷新失敗**`,
    'refresh.failedPosts': `• 失敗帖子：\${count}`,
    'refresh.failedUsers': `• 失敗：\${count}`,
    'refresh.moreUsers': `
...還有 \${count} 個用戶`,
    'refresh.noRefreshNeeded': `✅ **無需刷新**`,
    'refresh.outdatedPosts': `• 過時帖子：\${count}`,
    'refresh.processedUsers': `• 處理用戶：\${count}`,
    'refresh.processing': `⏳ 正在處理，請稍候...`,
    'refresh.startingBatchRefresh': `🔄 **開始批量刷新 VIP 頭像**`,
    'refresh.startingRefresh': `🔄 開始刷新您的對話歷史...`,
    'refresh.stats': `📊 **統計：**`,
    'refresh.successUsers': `• 成功：\${count}`,
    'refresh.summary': `📊 **總結：**`,
    'refresh.totalVipUsers': `• 總 VIP 用戶：\${count}`,
    'refresh.updated': `• 更新：\${count} 個帖子`,
    'refresh.updatedPosts': `• 更新帖子：\${count}`,
    'refresh.userDetail': `• \${username}: \${updated} 更新, \${failed} 失敗`,
    'refresh.usersNeedingRefresh': `• 需要刷新：\${count}`,
    removeCannotRemoveSuperAdmin: `❌ 無法移除超級管理員。`,
    removeCommand: `\`/admin_remove <user_id>\`

`,
    removeExample: `\`/admin_remove 123456789\` - 移除普通管理員

`,
    removeInstructions: `⚠️ **注意**

此命令需要手動修改配置文件。

**步驟：**
1. 編輯 \`wrangler.toml\`
2. 找到 \`ADMIN_USER_IDS\` 變數
3. 移除用戶 ID：\`{userId}\`
4. 格式：\`ADMIN_USER_IDS = "ID1,ID2"\`（移除 {userId}）
5. 重新部署：\`pnpm deploy:staging\`

**用戶資訊：**
• ID: \`{userId}\`
• 暱稱: {nickname}
• 用戶名: @{username}

💡 或在 Cloudflare Dashboard 中修改環境變數`,
    removeNotAdmin: `❌ 此用戶不是管理員。`,
    removeUsageError: `❌ 使用方法錯誤

`,
    settings: `• 暱稱: \${targetUser}
`,
    settings2: `• 暱稱: \${targetUser.nickname}
`,
    settings3: `• 暱稱：\${user.nickname}
`,
    settings4: `未設定`,
    settings5: `未設定`,
    settings6: `未設定`,
    short: `**範例：**
`,
    short10: `支付 ID：\\`,
    short11: `變數
`,
    short12: `用戶：\\`,
    short2: `**示例：**
`,
    short3: `**步驟：**
`,
    short4: `5. 重新部署：\\`,
    short5: `4. 重新部署：\\`,
    short6: `1. 編輯 \\`,
    short7: `2. 找到 \\`,
    short8: `4. 格式：\\`,
    short9: `• 無緩存
`,
    start: `開始: \${banStart}
`,
    stats: `📊 **統計：**
`,
    stats2: `• \`/ad_stats <id>\` - 查看詳細統計`,
    success: `• 成功：\${results.successUsers}
`,
    text: `• 優先級: \${provider.priority}
`,
    text10: `金額：\${data.amount_stars} ⭐
`,
    text11: `請求 ID：#\${data.request_id}
`,
    text12: `• 權重: \${provider.weight}
`,
    text13: `原因：\${data.error_message}
`,
    text14: `/ad_provider_disable <id>`,
    text15: `/official_ad_disable <id>`,
    text16: `💡 使用 /admin_refunds 查看詳情`,
    text17: `/ad_provider_enable <id>`,
    text18: `使用 /ad_providers 查看所有提供商`,
    text19: `/official_ad_enable <id>`,
    text2: `• 獎勵: \${ad.quota_reward} 額度
`,
    text20: `剩餘：\${data.days_left} 天
`,
    text21: `/admin_remove 123456789`,
    text22: `理由: \${appeal.reason}
`,
    text23: `提交時間: \${createdAt}

`,
    text24: `提供商：\${providerName}
`,
    text25: `• 類型: \${ad.ad_type}
`,
    text26: `/admin_add 123456789`,
    text27: `處理過程中發生錯誤，請查看日誌。

`,
    text28: `優先級：\${priority}

`,
    text29: `原因: \${ban.reason}
`,
    text3: `/official_ad_disable <ad_id>`,
    text30: `原因：\${data.reason}
`,
    text31: `時間：\${timestamp}

`,
    text32: `此命令需要手動修改配置文件。

`,
    text33: `• 狀態: \${status}
`,
    text34: `🔍 **頭像診斷報告**

`,
    text35: `
📸 **頭像緩存：**
`,
    text36: `時間：\${timestamp}`,
    text37: `🔴 **退款請求**

`,
    text38: `📢 **系統通知**

`,
    text39: `/ad_stats <id>`,
    text4: `風險分數: \${ban.risk_snapshot}
`,
    text40: `👤 **用戶信息：**
`,
    text41: `
🔎 **分析：**
`,
    text42: `📝 **詳細結果：**
`,
    text43: `⏳ 正在處理，請稍候...`,
    text44: `3. 添加用戶 ID：\\`,
    text45: `3. 移除用戶 ID：\\`,
    text46: `📊 **總結：**
`,
    text47: `類型：\${type}
`,
    text48: `• 🧪 測試模式
`,
    text49: `**管理命令：**
`,
    text5: `⏱️ **耗時：** \${duration} 秒

`,
    text50: `**正確格式：**
`,
    text51: `\${hours} 小時`,
    text52: `**用戶資訊：**
`,
    text6: `• 更新：\${result.updated} 個帖子
`,
    text7: `數據：\${JSON.stringify(data)}
`,
    text8: `• 點擊: \${ad.click_count} 次
`,
    text9: `/official_ad_enable <ad_id>`,
    unbanNotBanned: `用户未被封禁`,
    unbanUsageError: `解封使用方式错误`,
    unbanUserNotFound: `解封用户不存在`,
    userNotFound: `❌ 用戶不存在。`,
    vip: `• VIP 到期：\${new Date(user.vip_expire_at).toLocaleString('zh-TW')}
`,
    vip2: `• 創建時 VIP：\${post.created_with_vip_status ? '✅' : '❌'}
`,
    vip3: `• VIP 狀態：\${isVip ? '✅ 是' : '❌ 否'}
`,
    vip4: `• 總 VIP 用戶：\${stats.totalVipUsers}
`,
    vip5: `🔄 **開始批量刷新 VIP 頭像**

`,
    vip6: `⏰ **VIP 到期提醒已發送**

`,
    vip7: `🎉 **新 VIP 購買**

`,
    vip8: `⬇️ **VIP 自動降級**

`,
    vip9: `🔄 **VIP 續費**

`,
  },
  adminNotification: {
    amount: `金額：\${stars} ⭐`,
    data: `數據：\${data}`,
    daysLeft: `剩餘：\${days} 天`,
    expireDate: `到期：\${date}`,
    newExpireDate: `新到期：\${date}`,
    paymentFailed: `❌ **支付失敗**`,
    paymentId: `支付 ID：\`\${id}\``,
    reason: `原因：\${reason}`,
    refundRequest: `🔴 **退款請求**`,
    requestId: `請求 ID：#\${id}`,
    systemNotification: `📢 **系統通知**`,
    time: `時間：\${time}`,
    type: `類型：\${type}`,
    user: `用戶：\`\${userId}\``,
    viewRefundsHint: `💡 使用 /admin_refunds 查看詳情`,
    vipDowngraded: `⬇️ **VIP 自動降級**`,
    vipPurchased: `🎉 **新 VIP 購買**`,
    vipReminderSent: `⏰ **VIP 到期提醒已發送**`,
    vipRenewed: `🔄 **VIP 續費**`,
  },
  age: {
    daysAgo: `\${days} 天前`,
    hoursAgo: `\${hours} 小時前`,
    justNow: `剛剛`,
  },
  analytics: {
    ad: `• 官方廣告：
  - 展示：{officialImpressions} 次
  - 點擊：{officialClicks} 次
  - CTR：{officialCtr}%
  - 獎勵發放：{officialRewardsGranted} 個額度

• VIP 頁面訪問：{vipPageViews} 次
• 購買意向：{vipPurchaseIntents} 次
• 成功轉化：{vipConversions} 次
• 轉化率：{vipConversionRate}%
• 收入：\\\\\\\\\\\${vipRevenue}`,
    ad2: `📊 **廣告效果報表**
📅 期間：{start} ~ {end}

• 總展示：{thirdPartyImpressions} 次
• 總完成：{thirdPartyCompletions} 次
• 完成率：{thirdPartyCompletionRate}%
• 總獎勵：{thirdPartyRewardsGranted} 個額度

• 總展示：{officialImpressions} 次
• 總點擊：{officialClicks} 次
• CTR：{officialCtr}%
• 總獎勵：{officialRewardsGranted} 個額度`,
    ad3: `📊 **廣告效果報表**
📅 期間：{start} ~ {end}

⚠️ **目前還沒有廣告數據**

這可能是因為：
• 廣告提供商尚未配置
• 還沒有用戶觀看廣告
• 選定的時間範圍內沒有廣告活動

💡 **數據何時會出現？**
• 需要完成以下配置：
  1. 配置廣告提供商（GigaPub 等）
  2. 創建官方廣告
  3. 用戶開始觀看廣告

• 建議先配置廣告提供商
• 然後等待用戶開始使用廣告功能`,
    complete: `
• 完成率：\${provider.completion_rate.toFixed(1)}%`,
    complete2: `
• 完成：\${provider.total_completions} 次`,
    completion: `
• 完成：{completions} 次`,
    completionRate: `
• 完成率：{rate}%`,
    conversionStepsTitle: `[需要从 zh-TW.ts 获取翻译]`,
    invite: `• 發起邀請：{initiated} 次
• 接受邀請：{accepted} 次
• 激活邀請：{activated} 次
• 轉化率：{conversionRate}%

• 丟瓶子：{bottlesThrown} 個
• 撿瓶子：{bottlesCaught} 個
• 新對話：{conversationsStarted} 個
• 平均對話輪次：{avgConversationRounds}

💡 詳細數據：/analytics`,
    message: `📊 **每日運營報表**
📅 日期：{date}

**👥 用戶數據**
• 新增用戶：{newUsers} 人
• 活躍用戶（DAU）：{dau} 人
• 留存率（D1）：{d1Retention}%
• 平均使用時長：{avgSessionDuration} 分鐘

**📺 廣告數據**
• 第三方廣告：
  - 展示：{thirdPartyImpressions} 次
  - 完成：{thirdPartyCompletions} 次
  - 完成率：{thirdPartyCompletionRate}%
  - 獎勵發放：{thirdPartyRewardsGranted} 個額度`,
    message2: `📊 **每日運營報表**
📅 日期：{date}

⚠️ **今日還沒有數據**

這可能是因為：
• 系統剛部署，還沒有用戶活動
• 今天還沒有用戶使用 Bot
• 數據追蹤功能尚未啟用

💡 **數據何時會出現？**
• 需要用戶執行以下任一操作：
  - 發送 /start 註冊
  - 丟瓶子或撿瓶子
  - 觀看廣告
  - 購買 VIP

• 建議等待用戶開始使用後再查看
• 或者在測試環境中模擬用戶行為`,
    message3: `

**📈 總轉化率：\${report.overall_conversion_rate.toFixed(1)}%**`,
    message4: `
• 轉化率：\${step.conversion_rate.toFixed(1)}%`,
    message5: `
• 錯誤率：\${provider.error_rate.toFixed(1)}%`,
    message6: `
• 請求：\${provider.total_requests} 次`,
    providerComparisonTitle: `[需要从 zh-TW.ts 获取翻译]`,
    purchaseSuccess: `[需要从 zh-TW.ts 获取翻译]`,
    request: `
• 請求：{requests} 次`,
    text: `
• 用戶數：\${step.user_count}`,
    text2: `購買意向（點擊購買）`,
    vip: `📊 **VIP 轉化漏斗**
📅 期間：{start} ~ {end}

⚠️ **目前還沒有數據**

這可能是因為：
• 系統剛部署，還沒有用戶活動
• 選定的時間範圍內沒有 VIP 相關事件
• 數據追蹤功能尚未啟用

💡 **數據何時會出現？**
• VIP 轉化數據需要用戶執行以下操作：
  1. 查看 VIP 功能介紹
  2. 點擊購買 VIP
  3. 完成 VIP 購買

• 建議等待 24-48 小時後再查看
• 或者先在測試環境中模擬用戶行為`,
    vip2: `📊 **VIP 轉化漏斗**
📅 期間：{start} ~ {end}`,
    vip3: `認知（看到 VIP 提示）`,
    vip4: `考慮（查看 VIP 詳情）`,
    vip5: `興趣（點擊查看 VIP）`,
  },
  appeal: {
    alreadyExists: `⏳ 你已有一個待處理的申訴（編號：#\${appealId}）

狀態：\${status}
提交時間：\${time}

請耐心等待管理員審核。`,
    notBanned: `✅ 你的帳號未被封禁，無需申訴。`,
    notFound: `❌ 找不到你的申訴記錄。`,
    notes: `備註：`,
    prompt: `📝 **提交申訴**

請說明你認為帳號被封禁的原因，以及你希望如何解決這個問題。

💡 請詳細描述你的情況，這有助於管理員更快地處理你的申訴。`,
    reasonTooLong: `❌ 申訴原因太長，請控制在 500 字以內。`,
    reasonTooShort: `❌ 申訴原因太短，請至少輸入 10 個字。`,
    reviewedAt: `審核時間：`,
    status: `📋 **申訴狀態**

申訴編號：#\${appealId}
狀態：\${status}
提交時間：\${createdAt}\${reviewInfo ? '

' + reviewInfo : ''}`,
    statusApproved: `已批准`,
    statusPending: `待審核`,
    statusRejected: `已拒絕`,
    submitted: `✅ **申訴已提交**

申訴編號：#\${appealId}
狀態：待審核

我們會在 1-3 個工作日內處理你的申訴。
處理結果會通過 Bot 通知你。`,
  },
  block: {
    cannotIdentify: `⚠️ 無法識別對話對象`,
    catchNewBottle: `💡 使用 /catch 撿新的漂流瓶開始新對話。`,
    conversationInfoError: `⚠️ 對話資訊錯誤。`,
    conversationMayEnded: `對話可能已結束或不存在。`,
    conversationNotFound: `⚠️ 找不到此對話`,
    ensureReply: `請確保回覆的是對方發送的訊息（帶有 # 標識符）。`,
    hint: `💡 這樣可以準確指定要封鎖的對象。`,
    replyRequired: `⚠️ 請長按你要封鎖的訊息後回覆指令`,
    step1: `1️⃣ 長按對方的訊息`,
    step2: `2️⃣ 選擇「回覆」`,
    step3: `3️⃣ 輸入 /block`,
    steps: `**操作步驟：**`,
    success: `✅ 已封鎖此使用者 (#\${identifier})`,
    willNotMatch: `你們將不會再被匹配到對方的漂流瓶。`,
  },
  bottle: {
    bottle13: `瓶子内容`,
    cancelled: `❌ 已取消 \${zodiac}`,
    'catch.anonymousUser': `匿名用戶`,
    'catch.back': `🏠 返回主選單：/menu`,
    'catch.banned': `❌ 你的帳號已被封禁，無法撿漂流瓶。

如有疑問，請使用 /appeal 申訴。`,
    'catch.block': `• 不想再聊可使用 /block 封鎖
`,
    'catch.bottle': `😔 目前沒有適合你的漂流瓶

`,
    'catch.bottle2': `• 或者自己丟一個瓶子：/throw`,
    'catch.bottle3': `🎣 有人撿到你的漂流瓶了！

`,
    'catch.bottle4': `🧴 你撿到了一個漂流瓶！

`,
    'catch.bottle5': `💡 明天再來撿更多瓶子吧！`,
    'catch.bottleTaken': `❌ 這個瓶子已經被其他人撿走了，請試試其他瓶子！`,
    'catch.catch': `📊 今日已撿：\\\${newCatchesCount}/\\\${quota}

`,
    'catch.conversation': `已為你們建立了匿名對話，快來開始聊天吧～

`,
    'catch.conversation2': `• 這是匿名對話，請保護個人隱私
`,
    'catch.conversation3': `📊 查看所有對話`,
    'catch.language': `🗣️ 語言：\\\${language}

`,
    'catch.mbti': `🧠 MBTI：\\\${mbti}
`,
    'catch.message': `💫 配對度：\\\${Math.round(matchScore)}分 (智能配對)

`,
    'catch.message2': `\\\${catcherGender} | 📅 \\\${catcherAge}歲

`,
    'catch.message3': `conv_reply_\\\${conversationIdentifier}`,
    'catch.message4': `2️⃣ 長按此訊息，選擇「回覆」後輸入內容

`,
    'catch.message5': `1️⃣ 點擊下方「💬 回覆訊息」按鈕
`,
    'catch.message6': `2️⃣ 長按此訊息，選擇「回覆」後輸入內容`,
    'catch.nickname': `📝 暱稱：\\\${ownerMaskedNickname}
`,
    'catch.nickname2': `📝 暱稱：\\\${catcherNickname}
`,
    'catch.notRegistered': `❌ 請先完成註冊流程才能撿漂流瓶。

使用 /start 繼續註冊。`,
    'catch.originalContent': `原文：{content}`,
    'catch.originalLanguage': `原文語言：{language}`,
    'catch.quotaExhausted': `❌ 今日漂流瓶配額已用完（\\\${quotaDisplay}）`,
    'catch.replyButton': `💬 回覆訊息`,
    'catch.replyMethods': `💡 **兩種回覆方式**：
`,
    'catch.report': `• 遇到不當內容請使用 /report 舉報
`,
    'catch.safetyTips': `⚠️ 安全提示：
`,
    'catch.settings': `🧠 MBTI：\\\${bottle.mbti_result}
`,
    'catch.settings10': `未設定`,
    'catch.settings11': `未設定`,
    'catch.settings2': `未設定`,
    'catch.settings3': `未設定`,
    'catch.settings4': `未設定`,
    'catch.settings5': `未設定`,
    'catch.settings6': `未設定`,
    'catch.settings7': `未設定`,
    'catch.settings8': `未設定`,
    'catch.settings9': `未設定`,
    'catch.short': `💡 提示：
`,
    'catch.short2': `• 稍後再試
`,
    'catch.short3': `匿名用戶`,
    'catch.short4': `♂️ 男`,
    'catch.short5': `♀️ 女`,
    'catch.text': `翻譯語言：\\\${catcherLangDisplay}
`,
    'catch.text2': `原文語言：\\\${bottleLangDisplay}
`,
    'catch.text3': `🗣️ 語言：\\\${ownerLanguage}

`,
    'catch.text4': `• 不想再聊可使用 /block 封鎖

`,
    'catch.text5': `原文：\\\${bottle.content}
`,
    'catch.text6': `💬 翻譯服務暫時有問題，已使用備援翻譯
`,
    'catch.text7': `翻譯：\\\${bottleContent}
`,
    'catch.text8': `💡 **兩種回覆方式**：
`,
    'catch.translatedContent': `翻譯：{content}`,
    'catch.translatedLanguage': `翻譯語言：{language}`,
    'catch.translationServiceFallback': `💬 翻譯服務暫時有問題，已使用備援翻譯`,
    'catch.translationServiceUnavailable': `⚠️ 翻譯服務暫時無法使用，以下為原文`,
    'catch.unknown': `未知`,
    'catch.zodiac': `⭐ 星座：\\\${bottle.zodiac}
`,
    'catch.zodiac2': `⭐ 星座：\\\${catcherZodiac}
`,
    containsUrl: `瓶子內容不允許包含任何連結`,
    empty: `瓶子內容不能為空`,
    friendlyContent: `• 友善、尊重的內容更容易被撿到哦～`,
    inappropriate: `瓶子內容包含不適當的內容，請修改後重新提交`,
    selected: `已選擇：\${selected}`,
    selectedItem: `✅ 已選擇 \${zodiac}`,
    'throw.age': `• 年齡區間相近 ✓`,
    'throw.aiModerationFailed': `AI 内容审核失败`,
    'throw.back': `↩️ 返回篩選選單`,
    'throw.bloodType': `🩸 **血型篩選**

`,
    'throw.bloodType2': `• 血型：篩選特定血型
`,
    'throw.bloodType3': `選擇你想要配對的血型：`,
    'throw.bloodType4': `🩸 血型篩選`,
    'throw.bloodType5': `🌈 任何血型`,
    'throw.bottle': `
💡 這個瓶子和你非常合拍！
\\\${highlights.join('
')}
`,
    'throw.bottle10': `🍾 漂流瓶已丟出！

`,
    'throw.bottle11': `🍾 丟漂流瓶`,
    'throw.bottle2': `🎯 你的瓶子已發送給 **3 個對象**：
`,
    'throw.bottle3': `🍾 **正在丟出你的漂流瓶...**

`,
    'throw.bottle4': `🍾 **丟漂流瓶** #THROW

`,
    'throw.bottle5': `瓶子 ID：#\\\${bottleId}

`,
    'throw.bottle6': `📝 **請輸入你的漂流瓶內容**

`,
    'throw.bottle7': `1️⃣ 點擊下方「🍾 丟漂流瓶」按鈕
`,
    'throw.bottle8': `📝 請輸入你的漂流瓶內容：

`,
    'throw.bottle9': `📝 請輸入你的漂流瓶內容：`,
    'throw.cancel': `💡 點擊選擇或取消 MBTI 類型：`,
    'throw.cancel2': `💡 點擊選擇或取消星座：`,
    'throw.catch': `• 槽位 3：公共池（等待撿起）

`,
    'throw.catch2': `• 槽位 2：公共池（等待撿起）
`,
    'throw.catch3': `• 槽位 1：公共池（等待撿起）
`,
    'throw.catch4': `🌊 等待有緣人撿起...
`,
    'throw.complete': `⚙️ **進階篩選**

\\\${summary}
💡 繼續調整或完成篩選：`,
    'throw.complete2': `🎯 **第 1 個配對已完成：**
`,
    'throw.complete3': `📝 你有一個未完成的草稿

`,
    'throw.complete4': `⏳ 預計 3-5 秒完成`,
    'throw.complete5': `⏳ 預計 2-3 秒完成`,
    'throw.complete6': `⏳ 預計 1-2 秒完成`,
    'throw.conversation': `💬 對話標識符：\\\${vipMatchInfo.conversationIdentifier}

`,
    'throw.conversation2': `💡 提示：每個對話都是獨立的，可以同時進行

`,
    'throw.conversation3': `💡 你可能會收到 **最多 3 個對話**！
`,
    'throw.conversation4': `💬 你可能會收到 **最多 3 個對話**！
`,
    'throw.conversation5': `使用 /chats 查看所有對話

`,
    'throw.conversation6': `📊 使用 /chats 查看所有對話`,
    'throw.conversation7': `使用 /chats 查看所有對話`,
    'throw.currentSelection': `當前選擇：{genderText}`,
    'throw.gender': `• 性別：\\\${selectedGender}
`,
    'throw.gender2': `👤 **性別篩選**

`,
    'throw.gender3': `• 性別：篩選性別

`,
    'throw.gender4': `💡 選擇你想要的性別：`,
    'throw.gender5': `👤 性別篩選`,
    'throw.genderLabel': `• 性別：{gender}
`,
    'throw.mbti': `• MBTI：\\\${selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '無限制'}
`,
    'throw.mbti2': `已選擇：\\\${selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '無'}

`,
    'throw.mbti3': `已選擇：\\\${selectedMBTI.length > 0 ? selectedMBTI.join(`,
    'throw.mbti4': `🧠 **MBTI 篩選**

`,
    'throw.mbti5': `• MBTI：篩選特定性格類型
`,
    'throw.mbti6': `• MBTI 高度配對 ✓`,
    'throw.mbti7': `🧠 MBTI 篩選`,
    'throw.mbtiLabel': `• MBTI：{mbti}
`,
    'throw.message': `已選擇：\\\${selectedZodiac.length > 0 ? selectedZodiac.map((z) => ZODIAC_NAMES[z]).join(', ') : '無'}

`,
    'throw.message2': `當前選擇：\\\${currentGender}

`,
    'throw.message3': `已選擇：\\\${selectedZodiac.length > 0 ? selectedZodiac.map((z) => ZODIAC_NAMES[z]).join(`,
    'throw.message4': `當前選擇：\\\${bloodTypeDisplay[currentBloodType]}

`,
    'throw.message5': `👤 對方：\\\${vipMatchInfo.matcherNickname}
`,
    'throw.message6': `「你好！我是一個喜歡音樂和電影的人，希望認識志同道合的朋友～」

`,
    'throw.message7': `💡 可在 /edit_profile 中修改匹配偏好

`,
    'throw.message8': `💬 直接按 /reply 回覆訊息開始聊天
`,
    'throw.nickname': `📝 對方暱稱：\\\${matchedUserMaskedNickname}
`,
    'throw.quota': `• 更多配額（30 個/天）
`,
    'throw.quota2': `🎁 邀請好友可增加配額：
`,
    'throw.settings': `🧠 MBTI：\\\${matchResult.user.mbti_result}
`,
    'throw.settings2': `⭐ 星座：\\\${matchResult.user.zodiac}
`,
    'throw.settings3': `🧠 MBTI：\\\${user.mbti_result}
`,
    'throw.settings4': `⭐ 星座：\\\${user.zodiac_sign}
`,
    'throw.settings5': `未設定`,
    'throw.settings6': `未設定`,
    'throw.settings7': `未設定`,
    'throw.settings8': `未設定`,
    'throw.short': `• 語言相同 ✓`,
    'throw.short10': `♋ 巨蟹座`,
    'throw.short11': `♌ 獅子座`,
    'throw.short12': `♍ 處女座`,
    'throw.short13': `♎ 天秤座`,
    'throw.short14': `♏ 天蠍座`,
    'throw.short15': `♐ 射手座`,
    'throw.short16': `♑ 摩羯座`,
    'throw.short17': `♒ 水瓶座`,
    'throw.short18': `♓ 雙魚座`,
    'throw.short19': `違規行為`,
    'throw.short2': `🩸 AB 型`,
    'throw.short20': `無限制`,
    'throw.short21': `無限制`,
    'throw.short22': `無限制`,
    'throw.short23': `無限制`,
    'throw.short3': `🌈 任何人`,
    'throw.short4': `🩸 A 型`,
    'throw.short5': `🩸 B 型`,
    'throw.short6': `🩸 O 型`,
    'throw.short7': `♈ 白羊座`,
    'throw.short8': `♉ 金牛座`,
    'throw.short9': `♊ 雙子座`,
    'throw.start': `✍️ 重新開始`,
    'throw.success': `一次丟瓶子 = 3 個對象，大幅提升配對成功率

`,
    'throw.success2': `✨ **VIP 特權啟動！智能配對成功！**

`,
    'throw.success3': `🎯 你的漂流瓶已被配對成功！

`,
    'throw.text': `💝 匹配度：\\\${matchPercentage}%
`,
    'throw.text10': `🎯 正在為你尋找最佳配對對象

`,
    'throw.text11': `
💬 等待對方回覆中...
`,
    'throw.text12': `• 免費用戶：最多 +7 個
`,
    'throw.text13': `• 不要包含個人聯絡方式

`,
    'throw.text14': `💡 **兩種輸入方式**：
`,
    'throw.text15': `📊 免費用戶：3 個/天
`,
    'throw.text16': `選擇你想要篩選的條件：

`,
    'throw.text17': `• 進階篩選和翻譯

`,
    'throw.text18': `創建時間：\\\${age}
`,
    'throw.text19': `使用 /vip 立即升級`,
    'throw.text2': `• 🆕 三倍曝光機會（1 次 = 3 個對象）
`,
    'throw.text20': `💬 **範例**：
`,
    'throw.text21': `使用 /vip 了解更多`,
    'throw.text22': `要繼續編輯這個草稿嗎？`,
    'throw.text23': `💡 可以組合多個條件`,
    'throw.text24': `當前篩選條件：

`,
    'throw.text3': `💡 這可能需要幾秒鐘，我們正在為你找到最合適的人`,
    'throw.text4': `當前選擇：\\\${currentGender ===`,
    'throw.text5': `🎯 尋找對象：\\\${targetText}
`,
    'throw.text6': `🎯 正在為你尋找 3 個最佳配對對象

`,
    'throw.text7': `📨 **另外 2 個槽位等待中：**
`,
    'throw.text8': `🔍 正在智能匹配最佳對象...

`,
    'throw.text9': `內容預覽：\\\${preview}

`,
    'throw.throw': `📊 今日已丟：\\\${quotaDisplay}

`,
    'throw.unlimited': `無限制`,
    'throw.vip': `💎 VIP 用戶：30 個/天（三倍曝光）

`,
    'throw.vip2': `💎 **升級 VIP 可獲得三倍曝光機會！**
`,
    'throw.vip3': `⚙️ **進階篩選（VIP 專屬）**

`,
    'throw.vip4': `• VIP 用戶：最多 +70 個

`,
    'throw.vip5': `✨ **VIP 特權啟動！**

`,
    'throw.vip6': `💡 升級 VIP 獲得：
`,
    'throw.vip7': `✨ VIP 特權啟動中
`,
    'throw.zodiac': `• 星座：\\\${selectedZodiac.length > 0 ? selectedZodiac.map((z) => ZODIAC_NAMES[z]).join(', ') : '無限制'}
`,
    'throw.zodiac2': `⭐ 星座：\\\${matchResult.user.zodiac ||`,
    'throw.zodiac3': `⭐ 星座：\\\${user.zodiac_sign ||`,
    'throw.zodiac4': `⭐ **星座篩選**

`,
    'throw.zodiac5': `• 星座：篩選特定星座
`,
    'throw.zodiac6': `• 星座高度相容 ✓`,
    'throw.zodiac7': `⭐ 星座篩選`,
    'throw.zodiacLabel': `• 星座：{zodiac}
`,
    tips: `💡 提示：`,
    tooLong: `瓶子內容太長，最多 \${max} 個字符（目前 \${current} 個字符）`,
    tooShort: `瓶子內容太短，至少需要 \${min} 個字符（目前 \${current} 個字符）`,
  },
  broadcast: {
    admin: `管理員手動取消`,
    admin2: `管理員手動清理（廣播卡住）`,
    allBroadcastsNormal: `所有廣播狀態正常。`,
    broadcastNotFound: `❌ 找不到該廣播記錄`,
    cancelCommand: `/broadcast_cancel <廣播ID>

`,
    cancelCorrectFormat: `**正確格式：**
`,
    cancelExample: `**示例：**
`,
    cancelExampleCommand: `/broadcast_cancel 1`,
    cancelFailed: `❌ 取消廣播失敗：{error}`,
    cancelUsageError: `❌ 使用方法錯誤

`,
    cancelled: `✅ 廣播已取消

`,
    cancelledId: `ID: {id}
`,
    cancelledStatus: `狀態: 已取消

`,
    checkProgressLater: `
請稍後使用 /broadcast_status 查看進度。`,
    cleanupFailed: `❌ 清理廣播失敗：{error}`,
    cleanupIds: `廣播 ID: {ids}

`,
    cleanupMarkedFailed: `這些廣播已標記為「失敗」狀態
`,
    cleanupSuccess: `✅ 已清理 {count} 個卡住的廣播

`,
    cleanupViewStatus: `使用 /broadcast_status 查看更新後的記錄。`,
    completedAt: `完成時間: {time}
`,
    correctFormat: `**正確格式：**
`,
    createFailed: `❌ 創建廣播失敗，請稍後再試。`,
    createFailedShort: `❌ 創建廣播失敗。`,
    created: `✅ 廣播已創建

`,
    empty: `廣播訊息不能為空`,
    error: `錯誤: {error}`,
    'estimate.immediate': `立即發送（約 1-2 秒）`,
    'estimate.minutes': `約 \\\${minutes} 分鐘`,
    'estimate.seconds': `約 \\\${seconds} 秒`,
    estimatedTime: `預計時間: {time}

`,
    example: `**示例：**
`,
    exampleMessage: `系統將於今晚 22:00 進行維護`,
    failed: `失敗: {count}
`,
    'filter.age': `年齡：{min}-{max} 歲`,
    'filter.atLeastOneRequired': `至少需要一個過濾器`,
    'filter.birthdayToday': `當天生日`,
    'filter.country': `國家：{country}`,
    'filter.genderFemale': `女性`,
    'filter.genderMale': `男性`,
    'filter.genderOther': `其他性別`,
    'filter.invalidAgeFormat': `無效的年齡範圍：{value}（格式必須是 min-max，如 18-25）`,
    'filter.invalidAgeMinMax': `無效的年齡範圍：{value}（最小年齡不能大於最大年齡）`,
    'filter.invalidAgeRange': `無效的年齡範圍：{value}（年齡必須在 18-99 之間）`,
    'filter.invalidCountry': `無效的國家代碼：{value}（必須是 2 個大寫字母，如 TW, US, JP）`,
    'filter.invalidFormat': `無效的過濾器格式：{pair}`,
    'filter.invalidGender': `無效的性別值：{value}（必須是 male, female 或 other）`,
    'filter.invalidMbti': `無效的 MBTI 類型：{value}（必須是以下之一：{mbtis}）`,
    'filter.invalidZodiac': `無效的星座：{value}（必須是以下之一：{zodiacs}）`,
    'filter.mbti': `MBTI：{mbti}`,
    'filter.nonVipUsers': `非 VIP 用戶`,
    'filter.unknownFilter': `未知的過濾器：{key}`,
    'filter.vipUsers': `VIP 用戶`,
    'filter.zodiacAquarius': `水瓶座`,
    'filter.zodiacAries': `白羊座`,
    'filter.zodiacCancer': `巨蟹座`,
    'filter.zodiacCapricorn': `摩羯座`,
    'filter.zodiacGemini': `雙子座`,
    'filter.zodiacLeo': `獅子座`,
    'filter.zodiacLibra': `天秤座`,
    'filter.zodiacPisces': `雙魚座`,
    'filter.zodiacSagittarius': `射手座`,
    'filter.zodiacScorpio': `天蠍座`,
    'filter.zodiacTaurus': `金牛座`,
    'filter.zodiacVirgo': `處女座`,
    filterAge: `• age=18-25
`,
    filterCommand: `/broadcast_filter <過濾器> <訊息內容>

`,
    filterConfirmConditions: `**過濾條件：**
{conditions}

`,
    filterConfirmMessage: `**訊息內容：**
{message}

`,
    filterConfirmTitle: `🔍 **廣播過濾器確認**

`,
    filterCorrectFormat: `**正確格式：**
`,
    filterCountry: `• country=TW|US|JP|...
`,
    filterCreateFailed: `❌ 創建過濾廣播失敗

{error}`,
    filterCreated: `✅ 過濾廣播已創建

`,
    filterCreatedConditions: `過濾條件: {conditions}
`,
    filterCreatedEstimatedTime: `預計時間: {time}

`,
    filterCreatedId: `ID: {id}
`,
    filterCreatedSending: `廣播將在後台發送，使用 /broadcast_status {id} 查看進度。`,
    filterCreatedUserCount: `符合用戶數: {count} 人
`,
    filterExample1: `/broadcast_filter gender=female,age=18-25,country=TW 大家好！
`,
    filterExample2: `/broadcast_filter vip=true,mbti=INTJ VIP 專屬活動通知
`,
    filterExample3: `/broadcast_filter zodiac=Scorpio 天蠍座專屬訊息`,
    filterExamples: `**示例：**
`,
    filterFormat: `**過濾器格式：**
`,
    filterFormatError: `❌ 過濾器格式錯誤

{error}

`,
    filterGender: `• gender=male|female|other
`,
    filterMbti: `• mbti=INTJ|ENFP|...
`,
    filterQueryingUsers: `正在查詢符合條件的用戶...`,
    filterUsageError: `❌ 使用方法錯誤

`,
    filterViewFormat: `請使用 /broadcast_filter 查看正確格式。`,
    filterVip: `• vip=true|false

`,
    filterZodiac: `• zodiac=Aries|Taurus|...
`,
    foundStuckBroadcasts: `⚠️ 發現 {count} 個卡住的廣播

`,
    id: `ID: {id}
`,
    idMustBeNumber: `❌ 廣播 ID 必須是數字`,
    maxUsersExceeded: `❌ 當前廣播系統僅支持 \${max} 個用戶以內的廣播。

目標用戶數：\${current}`,
    messageContent: `訊息內容`,
    noPendingBroadcasts: `目前沒有待處理或卡住的廣播。

`,
    noRecords: `📊 目前沒有廣播記錄`,
    noStuckBroadcasts: `✅ 沒有需要清理的廣播

`,
    processQueueFailed: `❌ 處理廣播隊列失敗：{error}`,
    processingBroadcast: `正在處理廣播 #{id}
`,
    progress: `進度: {sent}/{total} ({percentage}%)
`,
    queryStatusFailed: `❌ 查詢廣播狀態失敗：{error}`,
    queueProcessed: `✅ 廣播隊列處理完成

`,
    queueRemaining: `
隊列中還有 {count} 個廣播待處理
`,
    queueTriggered: `{emoji} 廣播隊列處理已觸發

`,
    recentRecords: `📊 最近 5 條廣播記錄

`,
    recordId: `ID: {id}
`,
    recordProgress: `進度: {sent}/{total}
`,
    recordStatus: `狀態: {status}
`,
    recordTarget: `目標: {type}
`,
    recordTime: `時間: {time}

`,
    sendingInBackground: `廣播將在後台發送，使用 /broadcast_status {id} 查看進度。`,
    short: `待處理`,
    short2: `等待中`,
    startedAt: `開始時間: {time}
`,
    status: `狀態：{status}
`,
    'status.cancelled': `已取消`,
    'status.completed': `已完成`,
    'status.failed': `失敗`,
    'status.pending': `等待中`,
    'status.sending': `發送中`,
    statusPending: `待處理`,
    statusStuck: `卡住（重試中）`,
    statusTitle: `📊 廣播狀態`,
    stuckBroadcastConfirm: `**確認清理？**
`,
    stuckBroadcastConfirmCommand: `使用 \`/broadcast_cleanup confirm\` 確認`,
    stuckBroadcastDivider: `━━━━━━━━━━━━━━━━
`,
    stuckBroadcastId: `**ID: {id}**
`,
    stuckBroadcastMessage: `訊息: {message}
`,
    stuckBroadcastNoRetry: `不會再被自動處理或重新發送

`,
    stuckBroadcastProgress: `進度: {sent}/{total}
`,
    stuckBroadcastStartTime: `開始時間: {time}

`,
    stuckBroadcastTarget: `目標: {type}
`,
    stuckBroadcastWillMarkFailed: `這些廣播將被標記為「失敗」狀態
`,
    target: `目標: {target}
`,
    'target.all': `所有用戶`,
    'target.nonVip': `非 VIP 用戶`,
    'target.unknown': `未知`,
    'target.vip': `VIP 用戶`,
    targetAll: `所有用戶`,
    targetNonVip: `非 VIP 用戶`,
    targetType: `目標：{type}
`,
    targetVip: `VIP 用戶`,
    tooLong: `廣播訊息不能超過 \${max} 個字符（目前 \${current} 個字符）`,
    upgradeRequired: `大規模廣播需要升級系統架構，請參考 BROADCAST_SYSTEM_REDESIGN.md`,
    usageError: `❌ 使用方法錯誤

`,
    userCount: `用戶數: {count} 人
`,
    userCount2: `用戶數：{count} 人
`,
    viewAllRecords: `使用 /broadcast_status 查看所有廣播記錄。`,
    viewDetailsHint: `💡 使用 /broadcast_status <id> 查看詳細信息`,
    viewUpdatedStatus: `使用 /broadcast_status 查看更新後的狀態。`,
  },
  buttons: {
    ad: `➡️ 下一個廣告`,
    back: `⬅️ 返回 / Back`,
    bottle: `📺 看廣告獲取更多瓶子 🎁 (\${remaining}/20)`,
    bottle2: `💎 升級 VIP 獲得更多瓶子`,
    bottle3: `🌊 丟出漂流瓶`,
    bottle4: `🎣 撿起漂流瓶`,
    cancel: `取消`,
    help: `❓ 幫助`,
    invite: `👥 查看邀請碼`,
    invite2: `🎁 邀請好友`,
    mbtiMenu: `🧠 MBTI 選單`,
    message: `💬 回覆訊息`,
    profile: `✏️ 編輯個人資料`,
    profile2: `👤 個人資料`,
    returnToMenu: `🏠 返回主選單`,
    settings: `⚙️ 設定`,
    short: `🇲🇾 馬來西亞`,
    short10: `🇺🇸 美國`,
    short11: `🇯🇵 日本`,
    short12: `🇰🇷 韓國`,
    short13: `🇬🇧 英國`,
    short14: `🇫🇷 法國`,
    short15: `🇩🇪 德國`,
    short16: `🇹🇭 泰國`,
    short17: `🇦🇺 澳洲`,
    short18: `💬 聊天記錄`,
    short19: `🌐 變更語言`,
    short2: `🇺🇳 聯合國旗`,
    short20: `🎁 領取獎勵`,
    short21: `🔄 清除選擇`,
    short22: `跳過`,
    short3: `📢 加入官方頻道`,
    short4: `🇸🇬 新加坡`,
    short5: `🇨🇦 加拿大`,
    short6: `🇳🇿 紐西蘭`,
    short7: `🇹🇼 台灣`,
    short8: `🇨🇳 中國`,
    short9: `🇭🇰 香港`,
    stats: `📊 統計數據`,
    targetAdvanced: `⚙️ 進階篩選（MBTI/星座）`,
    targetAny: `🌈 任何人都可以`,
    targetFemale: `👩 女生`,
    targetMale: `👨 男生`,
    text: `👤 查看對方資料卡`,
    vip: `💎 升級 VIP`,
  },
  catch: {
    anonymousUser: `匿名用戶`,
    back: `🏠 返回主選單：/menu`,
    banned: `❌ 你的帳號已被封禁，無法撿漂流瓶。

如有疑問，請使用 /appeal 申訴。`,
    block: `• 不想再聊可使用 /block 封鎖
`,
    bottle: `😔 目前沒有適合你的漂流瓶

`,
    bottle2: `• 或者自己丟一個瓶子：/throw`,
    bottle3: `🎣 有人撿到你的漂流瓶了！

`,
    bottle4: `🧴 你撿到了一個漂流瓶！

`,
    bottle5: `💡 明天再來撿更多瓶子吧！`,
    bottleTaken: `❌ 這個瓶子已經被其他人撿走了，請試試其他瓶子！`,
    catch: `📊 今日已撿：\${newCatchesCount}/\${quota}

`,
    conversation: `已為你們建立了匿名對話，快來開始聊天吧～

`,
    conversation2: `• 這是匿名對話，請保護個人隱私
`,
    conversation3: `📊 查看所有對話`,
    conversationError: `对话创建失败`,
    language: `🗣️ 語言：\${language}

`,
    mbti: `🧠 MBTI：\${mbti}
`,
    message: `💫 配對度：\${Math.round(matchScore)}分 (智能配對)

`,
    message2: `\${catcherGender} | 📅 \${catcherAge}歲

`,
    message3: `conv_reply_\${conversationIdentifier}`,
    message4: `2️⃣ 長按此訊息，選擇「回覆」後輸入內容

`,
    message5: `1️⃣ 點擊下方「💬 回覆訊息」按鈕
`,
    message6: `2️⃣ 長按此訊息，選擇「回覆」後輸入內容`,
    nickname: `📝 暱稱：\${ownerMaskedNickname}
`,
    nickname2: `📝 暱稱：\${catcherNickname}
`,
    notRegistered: `❌ 請先完成註冊流程才能撿漂流瓶。

使用 /start 繼續註冊。`,
    originalContent: `原文：{content}`,
    originalLanguage: `原文語言：{language}`,
    quotaExhausted: `❌ 今日漂流瓶配額已用完（\${quotaDisplay}）`,
    replyButton: `💬 回覆訊息`,
    replyMethods: `💡 **兩種回覆方式**：
`,
    report: `• 遇到不當內容請使用 /report 舉報
`,
    safetyTips: `⚠️ 安全提示：
`,
    settings: `🧠 MBTI：\${bottle.mbti_result}
`,
    settings10: `未設定`,
    settings11: `未設定`,
    settings2: `未設定`,
    settings3: `未設定`,
    settings4: `未設定`,
    settings5: `未設定`,
    settings6: `未設定`,
    settings7: `未設定`,
    settings8: `未設定`,
    settings9: `未設定`,
    short: `💡 提示：
`,
    short2: `• 稍後再試
`,
    short3: `匿名用戶`,
    short4: `♂️ 男`,
    short5: `♀️ 女`,
    text: `翻譯語言：\${catcherLangDisplay}
`,
    text2: `原文語言：\${bottleLangDisplay}
`,
    text3: `🗣️ 語言：\${ownerLanguage}

`,
    text4: `• 不想再聊可使用 /block 封鎖

`,
    text5: `原文：\${bottle.content}
`,
    text6: `💬 翻譯服務暫時有問題，已使用備援翻譯
`,
    text7: `翻譯：\${bottleContent}
`,
    text8: `💡 **兩種回覆方式**：
`,
    translatedContent: `翻譯：{content}`,
    translatedLanguage: `翻譯語言：{language}`,
    translationServiceFallback: `💬 翻譯服務暫時有問題，已使用備援翻譯`,
    translationServiceUnavailable: `⚠️ 翻譯服務暫時無法使用，以下為原文`,
    unknown: `未知`,
    zodiac: `⭐ 星座：{zodiac}
`,
    zodiac2: `⭐ 星座：\${catcherZodiac}
`,
  },
  channelMembership: {
    claimButton: `✅ 領取獎勵`,
    claimReward: `點擊下方按鈕領取獎勵：+1 瓶子`,
    joined: `🎉 檢測到你已加入官方頻道！`,
    leftChannel: `❌ 檢測到你已離開頻道，無法領取獎勵。`,
    notJoined: `❌ 未檢測到你加入頻道，請先加入後再試`,
    oneTimeReward: `💡 這是一次性獎勵，領取後會追加到今天的額度中。`,
    rewardAdded: `獎勵：+1 瓶子（已追加到今天的額度）`,
    rewardGranted: `✅ 獎勵已發放！+1 瓶子`,
    taskCompleted: `🎉 恭喜完成任務：加入官方頻道！`,
    viewMoreTasks: `💡 使用 /tasks 查看更多任務`,
    viewTaskCenter: `[📋 查看任務中心] → /tasks`,
  },
  common: {
    ad: `📺 今日廣告：\${adsWatched}/\${AD_REWARD_CONSTANTS.MAX_ADS_PER_DAY} | 已獲得 \${quotaEarned} 個額度 | 剩餘 \${remaining} 次`,
    ad2: `📺 今日廣告：\${adsWatched}/\${AD_REWARD_CONSTANTS.MAX_ADS_PER_DAY} ✅ 已達上限 | 已獲得 \${quotaEarned} 個額度`,
    ad3: `📺 今日廣告：0/\${AD_REWARD_CONSTANTS.MAX_ADS_PER_DAY} | 已獲得 0 個額度`,
    ad4: `• 📺 觀看廣告（剩餘 \${remaining}/20 次）
`,
    ad5: `• 📺 觀看廣告（今日已達上限）
`,
    ad6: `• 避免廣告或不當內容

`,
    ad7: `📊 暫無官方廣告`,
    ad8: `📢 垃圾廣告`,
    ad9: `💡 還有更多官方廣告可以觀看！`,
    admin: `請稍後再試，或聯繫管理員。`,
    age: `無效的年齡範圍：\${trimmedValue}（格式必須是 min-max，如 18-25）`,
    age2: `年齡：\${filters.age.min}-\${filters.age.max} 歲`,
    age3: `無效的年齡範圍：\${trimmedValue}（年齡必須在 18-99 之間）`,
    age4: `無效的年齡範圍：\${trimmedValue}（最小年齡不能大於最大年齡）`,
    anonymous: `匿名`,
    anonymousUser: `[需要从 zh-TW.ts 获取翻译]`,
    anyBloodType: `🌈 任何血型`,
    anyone: `🌈 任何人`,
    back: `💡 輸入 /menu 可隨時返回主選單`,
    back2: `↩️ 返回編輯資料`,
    back3: `🏠 返回主選單`,
    prev: `⬅️ Vorige`,
    next: `Volgende ➡️`,
    back4: `↩️ 返回`,
    backToMainMenu: `返回主选单`,
    birthday: `🎂 生日：\${updatedUser.birthday}
`,
    birthday2: `🎂 生日：\${user.birthday}
`,
    birthday3: `當天生日`,
    bloodType: `🩸 血型：\${bloodTypeText}

`,
    bloodType2: `🩸 **編輯血型**

`,
    bloodType3: `請選擇你的血型：`,
    bloodType4: `🩸 編輯血型`,
    bloodTypeA: `🩸 A 型`,
    bloodTypeAB: `🩸 AB 型`,
    bloodTypeB: `🩸 B 型`,
    bloodTypeO: `🩸 O 型`,
    bottle: `瓶子內容太短，至少需要 \${MIN_BOTTLE_LENGTH} 個字符（目前 \${trimmedContent.length} 個字符）`,
    bottle10: `獎勵：+1 瓶子（已追加到今天的額度）

`,
    bottle11: `你們將不會再被匹配到對方的漂流瓶。

`,
    bottle12: `你想在丟漂流瓶時尋找什麼樣的對象？

`,
    bottle13: `使用 /throw 丟出漂流瓶開始聊天吧！`,
    bottle14: `瓶子內容包含不適當的內容，請修改後重新提交`,
    bottle15: `點擊下方按鈕領取獎勵：+1 瓶子

`,
    bottle16: `💡 下次丟漂流瓶時將自動使用此設置。`,
    bottle17: `🌊 丟出漂流瓶 - /throw
`,
    bottle18: `🎣 撿起漂流瓶 - /catch
`,
    bottle19: `🎉 確認後可獲得 +1 瓶子獎勵！`,
    bottle2: `瓶子內容太長，最多 \${MAX_BOTTLE_LENGTH} 個字符（目前 \${content.length} 個字符）`,
    bottle20: `✏️ 請輸入新的漂流瓶內容：

`,
    bottle21: `• 使用 /catch 撿新的漂流瓶`,
    bottle22: `• /throw - 丟出漂流瓶
`,
    bottle23: `• /catch - 撿起漂流瓶
`,
    bottle24: `• /throw - 丟漂流瓶
`,
    bottle25: `• /catch - 撿漂流瓶
`,
    bottle26: `• 發送草稿內容來丟出漂流瓶`,
    bottle27: `📦 **丟出漂流瓶**
`,
    bottle28: `🎣 **撿起漂流瓶**
`,
    bottle29: `💡 完成任務可獲得額外瓶子`,
    bottle3: `• 漂流瓶: \${bottlesCount?.count || 0}
`,
    bottle30: `瓶子內容不允許包含任何連結`,
    bottle31: `🍾 丟漂流瓶

`,
    bottle32: `瓶子內容不能為空`,
    bottle33: `丟出第一個瓶子`,
    bottle34: `撿起第一個瓶子`,
    bottle4: `匿名漂流瓶交友平台，透過 MBTI 和星座幫你找到志同道合的朋友

`,
    bottle5: `⏰ 對話已超時

對方可能已離開。使用 /catch 撿新的瓶子吧！`,
    bottle6: `💡 使用 /catch 撿新的漂流瓶開始新對話。`,
    bottle7: `🍾 丟漂流瓶

你想要尋找什麼樣的聊天對象？`,
    bottle8: `快去丟瓶子認識新朋友吧！ /throw

`,
    bottle9: `看看別人的漂流瓶，有興趣就回覆開始聊天

`,
    broadcast: `廣播將在後台發送，使用 /broadcast_status \${broadcastId} 查看進度。`,
    broadcast10: `📊 最近 5 條廣播記錄

`,
    broadcast11: `維護通知已廣播給所有用戶。
`,
    broadcast12: `恢復通知已廣播給所有用戶。`,
    broadcast13: `📊 目前沒有廣播記錄`,
    broadcast14: `📊 廣播狀態

`,
    broadcast15: `所有廣播狀態正常。`,
    broadcast2: `大規模廣播需要升級系統架構，請參考 BROADCAST_SYSTEM_REDESIGN.md`,
    broadcast3: `使用 /broadcast_status 查看所有廣播記錄。`,
    broadcast4: `\${statusEmoji} 廣播隊列處理已觸發

`,
    broadcast5: `/broadcast_cancel <廣播ID>

`,
    broadcast6: `廣播 ID: \${ids.join(', ')}

`,
    broadcast7: `正在處理廣播 #\${broadcast.id}
`,
    broadcast8: `目前沒有待處理或卡住的廣播。

`,
    broadcast9: `廣播 ID: \${ids.join(`,
    cancel: `請移除這些連結後重新輸入或取消編輯：`,
    cancel2: `狀態: 已取消

`,
    cancel3: `請重新輸入或取消編輯：`,
    cancelled: `已取消`,
    catch: `⏰ 撿瓶流程已超時

請使用 /catch 重新開始。`,
    catch2: `你撿瓶回覆 → 對方也回覆 → 開始匿名聊天`,
    catch3: `• 友善、尊重的內容更容易被撿到哦～`,
    catch4: `撿瓶流程`,
    close: `❌ 關閉`,
    complete: `🎉 **廣告觀看完成！**

✅ 獲得 **+1 個額度**
📊 今日已觀看：**\${updated.ads_watched}/20** 次
🎁 今日已獲得：**\${updated.quota_earned}** 個額度
📈 剩餘次數：**\${result.remaining_ads}** 次

\${result.remaining_ads > 0 ? '💡 繼續觀看廣告可獲得更多額度！' : '✅ 今日廣告已達上限'}`,
    complete2: `📺 **觀看廣告獲得額度**

🎁 完成觀看可獲得 **+1 個額度**
📊 今日剩餘：**\${remainingAds}/20** 次

👇 點擊下方按鈕開始觀看`,
    complete3: `完成時間: \${new Date(broadcast.completedAt).toLocaleString('zh-TW')}
`,
    complete4: `預計完成：\${new Date(maintenance.endTime).toLocaleString('zh-TW')}
`,
    complete5: `🎉 \${testTitle}完成！

`,
    complete6: `接近截止日期才完成`,
    complete7: `即將完成`,
    complete8: `盡早完成`,
    confirm: `為了保護所有使用者的安全，請確認你了解以下事項：

`,
    confirm2: `🌍 **確認你的國家/地區**

`,
    confirm3: `🛡️ 最後一步：反詐騙安全確認

`,
    confirm4: `🔍 **廣播過濾器確認**

`,
    confirm5: `🌍 確認你的國家/地區`,
    confirm6: `**確認清理？**
`,
    confirm7: `請確認：`,
    conversation: `📨 \${formatIdentifier(conv.identifier)} 的對話（\${conv.message_count} 則訊息）
`,
    conversation10: `💡 **沒有找到對話歷史**

`,
    conversation11: `部分對話歷史可能未能更新，請稍後再試。`,
    conversation12: `
📨 **最近對話：**

`,
    conversation13: `💬 你還沒有任何對話記錄

`,
    conversation14: `💬 繼續對話：/reply
`,
    conversation15: `您還沒有任何對話記錄。

`,
    conversation16: `對話可能已結束或不存在。`,
    conversation17: `💬 繼續對話`,
    conversation18: `開始第一次對話`,
    conversation2: `💬 **與 \${formatIdentifier(identifier)} 的對話**

`,
    conversation3: `• 對話開始：\${formatDate(stats.first_message_time)}
`,
    conversation4: `• 對話: \${conversationsCount?.count || 0}
`,
    conversation5: `💬 回覆對話 \${conversationIdentifier}`,
    conversation6: `您的頭像緩存已刷新，下次查看對話歷史時將顯示最新頭像。

`,
    conversation7: `💡 為了保護隱私和安全，對話中只允許純文字訊息。

`,
    conversation8: `使用 /history 查看所有對話

`,
    conversation9: `🔄 正在刷新所有對話歷史...

`,
    country: `無效的國家代碼：\${trimmedValue}（必須是 2 個大寫字母，如 TW, US, JP）`,
    country2: `🌍 **請選擇你的國家/地區**

`,
    country3: `國家：\${filters.country}`,
    end: `結束：\${endTime.toLocaleString('zh-TW')}

`,
    end2: `結束：\${endTime.toLocaleString}
`,
    gender2: `無效的性別值：\${trimmedValue}（必須是 male, female 或 other）`,
    gender3: `👤 性別：\${user.gender}
`,
    gender4: `👤 性別：\${updatedUser.gender ===`,
    gender5: `👤 性別：\${user.gender ===`,
    gender6: `現在請選擇你的性別：

`,
    gender7: `其他性別`,
    help: `MBTI 性格測驗可以幫助我們為你找到更合適的聊天對象～

`,
    help2: `❓ 查看幫助 - /help`,
    help3: `• /help - 查看幫助`,
    invite: `• 邀請記錄總數: \${inviteStats?.total || 0}
`,
    invite2: `邀請碼: \${user.invite_code}
`,
    invite3: `被誰邀請: \${user.invited_by}

`,
    loading: `✅ 正在加載......`,
    login: `一般用戶將無法使用服務，只有管理員可以登入。`,
    male: `男`,
    mbti: `無效的 MBTI 類型：\${trimmedValue}（必須是以下之一：\${VALID_MBTI.join(', ')}）`,
    mbti10: `✍️ 手動輸入 MBTI`,
    mbti11: `🧠 MBTI 選單`,
    mbti12: `MBTI 完整測驗`,
    mbti13: `MBTI 快速測驗`,
    mbti2: `你的 MBTI 類型是：**\${result.type}**

`,
    mbti3: `當前 MBTI：**\${user.mbti_result}**
`,
    mbti4: `🧠 **選擇 MBTI 測驗版本**

`,
    mbti5: `🧠 **MBTI 性格類型管理**

`,
    mbti6: `⚙️ 進階篩選（MBTI/星座）`,
    mbti7: `• 手動修改你的 MBTI 類型`,
    mbti8: `請選擇你的 MBTI 類型：`,
    mbti9: `🧠 重新測試 MBTI`,
    message: `\${typeEmoji} **\${ad.title}**
\${statusEmoji} 狀態: \${ad.is_enabled ? '啟用' : '停用'}

📊 **統計數據**
• 展示次數: \${stats.total_views}
• 點擊次數: \${stats.total_clicks}
• 點擊率 (CTR): \${stats.ctr}%`,
    message10: `/broadcast_filter gender=female,age=18-25,country=TW 大家好！
`,
    message11: `\${banHours} \${user.language_pref}`,
    message12: `時間: \${new Date(b.created_at).toLocaleString('zh-TW')}

`,
    message13: `
隊列中還有 \${pendingBroadcasts.results.length - 1} 個廣播待處理
`,
    message14: `進度: \${broadcast.sent_count}/\${broadcast.total_users}
`,
    message15: `\${days} \${user.language_pref}`,
    message16: `目標: \${getBroadcastTargetName(broadcast.targetType)}
`,
    message17: `狀態：\${maintenance.isActive ? '✅ 維護中' : '❌ 未啟用'}
`,
    message18: `🚫 禁止的網址：
\${urlCheck.blockedUrls?.map((url) =>`,
    message19: `• 最後訊息：\${formatDate(stats.last_message_time)}
`,
    message2: `birthday = '2000-01-01',
        age = 25,
        zodiac_sign = 'Capricorn',
        anti_fraud_score = 100,
        terms_agreed = 1`,
    message20: `時間：\${formatDate(conv.last_message_time)}

`,
    message21: `預計時長：\${maintenance.estimatedDuration} 分鐘
`,
    message22: `使用 /broadcast_status \${broadcastId} 查看進度。`,
    message23: `💡 請長按你要回復的消息，在出現的選單中選擇「回覆」後，在聊天框中輸入回復內容。`,
    message24: `📊 今日已發送：\${usedToday + 1}/\${dailyLimit} 則`,
    message25: `/broadcast_filter zodiac=Scorpio 天蠍座專屬訊息`,
    message26: `• 已激活: \${inviteStats?.activated || 0}
`,
    message27: `• 待激活: \${inviteStats?.pending || 0}

`,
    message28: `/maintenance_enable <時長(分鐘)> [維護訊息]

`,
    message29: `進度: \${b.sent_count}/\${b.total_users}
`,
    message3: `進度: \${broadcast.sentCount}/\${broadcast.totalUsers} (\${progress.percentage}%)
`,
    message30: `• 訊息: \${messagesCount?.count || 0}

`,
    message31: `• 對方發送：\${stats.partner_messages} 則
`,
    message32: `指揮官 - 大膽、富有想像力且意志強大的領導者，總能找到或創造解決方法。`,
    message33: `💡 使用 /broadcast_status <id> 查看詳細信息`,
    message34: `🏷️ 興趣標籤：\${updatedUser.interests ||`,
    message35: `執政官 - 極有同情心、受歡迎且樂於助人的人，總是渴望為社群做出貢獻。`,
    message36: `/broadcast_filter <過濾器> <訊息內容>

`,
    message37: `**訊息內容：**
\${broadcastMessage}

`,
    message38: `• 總訊息數：\${stats.total_messages} 則
`,
    message39: `競選者 - 熱情、有創造力且社交能力強的自由精神，總能找到理由微笑。`,
    message4: `💡 使用 /history \${formatIdentifier(conversations[0].identifier)} 查看完整對話

`,
    message40: `剩餘時間：\${remaining.remainingText}
`,
    message41: `表演者 - 自發、精力充沛且熱情的表演者，生活在他們周圍從不無聊。`,
    message42: `用戶數：\${broadcast.total_users} 人
`,
    message43: `• 你發送：\${stats.user_messages} 則
`,
    message44: `調停者 - 詩意、善良的利他主義者，總是熱情地為正義事業而努力。`,
    message45: `
請稍後使用 /broadcast_status 查看進度。`,
    message46: `昵稱: \${user.nickname}
`,
    message47: `• 獎勵：\${stats.total_rewards}

`,
    message48: `企業家 - 聰明、精力充沛且善於洞察的人，真正享受生活在邊緣。`,
    message49: `🎁 獎勵：+\${ad.reward_quota} 個永久額度`,
    message5: `時間：\${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
`,
    message50: `時間：\${new Date().toLocaleString(`,
    message51: `使用 /broadcast_status 查看更新後的狀態。`,
    message52: `目標: \${broadcast.target_type}
`,
    message53: `使用 /broadcast_status 查看更新後的記錄。`,
    message54: `• 如果您更換了 Telegram 頭像，系統會自動檢測
`,
    message55: `約 \${Math.ceil(totalSeconds)} 秒`,
    message56: `啟用者：\${maintenance.enabledBy}
`,
    message57: `邏輯學家 - 具有創新精神的發明家，對知識有著止不住的渴望。`,
    message58: `提倡者 - 安靜而神秘，同時鼓舞人心且不知疲倦的理想主義者。`,
    message59: `守衛者 - 非常專注且溫暖的守護者，時刻準備著保護所愛之人。`,
    message6: `• 展示：\${stats.total_views} | 點擊：\${stats.total_clicks} (\${stats.ctr}%)
`,
    message60: `探險家 - 靈活且迷人的藝術家，時刻準備著探索和體驗新事物。`,
    message61: `• 長按對方訊息回覆 /block 可封鎖此使用者
`,
    message62: `請確保回覆的是對方發送的訊息（帶有 # 標識符）。`,
    message63: `/broadcast_non_vip <訊息內容>`,
    message64: `建立你的第一個連接（長按訊息 → 選擇「回覆」）`,
    message65: `訊息: \${messagePreview}
`,
    message66: `3. 遇到可疑訊息時，你會提高警覺嗎？

`,
    message67: `💡 VIP 用戶每日可發送 100 則訊息。`,
    message68: `/broadcast <訊息內容>

`,
    message69: `/broadcast_vip <訊息內容>`,
    message7: `
• 驗證次數: \${stats.total_verified}
• 驗證率: \${stats.verification_rate}%`,
    message70: `最後訊息：\${preview}
`,
    message71: `廣播訊息不能超過 4000 個字符`,
    message72: `1️⃣ 長按對方的訊息
`,
    message73: `請使用文字訊息與對方交流。`,
    message74: `(尚無訊息)

`,
    message75: `獲取最新消息和活動`,
    message76: `廣播訊息不能為空`,
    message77: `(無訊息)`,
    message8: `
• 獎勵發放: \${stats.total_rewards}
• 獎勵率: \${stats.reward_rate}%`,
    message9: `
• 剩餘展示: \${ad.max_views - ad.current_views}/\${ad.max_views}`,
    newUser: `新用戶`,
    nickname: `💡 請輸入一個簡單的暱稱，不要包含 http:// 或 https:// 等連結。

`,
    nickname10: `請輸入新的暱稱：

`,
    nickname11: `• 請勿使用暱稱發送廣告`,
    nickname12: `📝 編輯暱稱`,
    nickname13: `✍️ 自訂暱稱`,
    nickname2: `很好！你的暱稱是：\${truncatedNickname}

`,
    nickname3: `📝 暱稱：\${updatedUser.nickname}
`,
    nickname4: `📝 暱稱：\${user.nickname}
`,
    nickname5: `• 暱稱長度限制 36 個字
`,
    nickname6: `📝 **編輯暱稱**

`,
    nickname7: `✏️ 請選擇你的暱稱：

`,
    nickname8: `✏️ 請輸入你的暱稱：

`,
    nickname9: `請告訴我你的暱稱（顯示名稱）：`,
    no: `否`,
    none: `無`,
    notRegistered: `未注册`,
    notSet: `未設定`,
    operationFailed: `❌ 發生錯誤`,
    profile: `👤 查看個人資料 - /profile
`,
    profile2: `✏️ **編輯個人資料**

`,
    profile3: `（你也可以稍後在個人資料中設置）`,
    quota: `💡 升級 VIP 可獲得更多配額（100 則/天）：/vip`,
    quota2: `• 💎 升級 VIP（每天 30 個配額）`,
    quota3: `• 🎁 邀請好友（每人 +1 配額）
`,
    quota4: `• ✨ 完成任務（獲得永久配額）
`,
    register: `

💡 這是快速測驗（\${testInfo}），結果僅供參考。
完成註冊後，可使用 /mbti 重新測驗。

`,
    register10: `🎉 恭喜完成註冊！

`,
    register2: `

💡 這是完整測驗（\${testInfo}），結果更準確。
完成註冊後，可使用 /mbti 重新測驗。

`,
    register3: `註冊步驟: \${user.onboarding_step}
`,
    register4: `⏰ 註冊流程已超時

請使用 /start 重新開始註冊。`,
    register5: `或使用：/dev_restart（自動開始註冊）

`,
    register6: `💡 現在可以重新開始測試註冊流程。

`,
    register7: `🔄 重新註冊：/start
`,
    register8: `💡 完成註冊後，你可以：
`,
    register9: `已自動完成註冊流程。

`,
    report: `🚨 **舉報不當內容** (#\${conversationIdentifier})

`,
    report2: `多次被舉報 / Multiple reports`,
    report3: `💡 這樣可以準確指定要舉報的對象。`,
    report4: `請選擇舉報原因：`,
    selected: `已選擇`,
    settings: `🧠 MBTI：\${updatedUser.mbti_result}（可重新測試）`,
    settings10: `你還沒有設定 MBTI 類型。

`,
    settings11: `設定地區`,
    settings12: `未設定`,
    settings13: `未設定`,
    settings14: `未設定`,
    settings15: `未設定`,
    settings16: `未設定`,
    settings17: `未設定`,
    settings18: `未設定`,
    settings19: `未設定`,
    settings2: `🏷️ 興趣標籤：\${updatedUser.interests}
`,
    settings20: `未設定`,
    settings21: `未設定`,
    settings22: `未設定`,
    settings23: `未設定`,
    settings24: `未設定`,
    settings25: `未設定`,
    settings26: `未設定`,
    settings27: `未設定`,
    settings28: `未設定`,
    settings29: `未設定`,
    settings3: `🧠 MBTI：\${user.mbti_result}（可重新測試）`,
    settings30: `未設定`,
    settings31: `未設定`,
    settings32: `未設定`,
    settings33: `未設定`,
    settings34: `未設定`,
    settings35: `未設定`,
    settings4: `🏷️ 興趣標籤：\${user.interests}
`,
    settings5: `📖 個人簡介：\${updatedUser.bio}
`,
    settings6: `🌍 地區：\${updatedUser.city}
`,
    settings7: `📖 個人簡介：\${user.bio}
`,
    settings8: `🌍 地區：\${user.city}
`,
    settings9: `你可以隨時使用 /mbti 指令重新設定。`,
    short: `💡 你可以：
`,
    short10: `工作時，你更喜歡：`,
    short100: `情感和故事`,
    short101: `效率和結果`,
    short102: `共識和團結`,
    short103: `自由和彈性`,
    short104: `保留選擇權`,
    short105: `加line`,
    short106: `測驗結果`,
    short107: `先聽後說`,
    short108: `小而親密`,
    short109: `團隊合作`,
    short11: `閱讀時，你更喜歡：`,
    short110: `獨立工作`,
    short111: `邊說邊想`,
    short112: `獨自消化`,
    short113: `實際應用`,
    short114: `創新想法`,
    short115: `新的嘗試`,
    short116: `是否合理`,
    short117: `是否有益`,
    short118: `堅持原則`,
    short119: `維持關係`,
    short12: `工作中，你更重視：`,
    short120: `公正果斷`,
    short121: `體貼關懷`,
    short122: `整齊有序`,
    short123: `隨性自在`,
    short124: `快速決定`,
    short125: `感到不安`,
    short126: `感到興奮`,
    short127: `訪問鏈接`,
    short128: `訂閱頻道`,
    short129: `銀行帳號`,
    short13: `規劃未來時，你會：`,
    short130: `備註：`,
    short131: `發送中`,
    short132: `信用卡`,
    short133: `比特币`,
    short134: `加微信`,
    short135: `加qq`,
    short136: `手机号`,
    short137: `联系我`,
    short138: `一夜情`,
    short139: `性服务`,
    short14: `分析問題並提供建議`,
    short140: `騙錢`,
    short141: `投資`,
    short142: `賺錢`,
    short143: `匯款`,
    short144: `轉帳`,
    short145: `密碼`,
    short146: `传销`,
    short147: `金融`,
    short148: `理财`,
    short149: `股票`,
    short15: `面對變化，你通常：`,
    short150: `期货`,
    short151: `外汇`,
    short152: `电话`,
    short153: `约炮`,
    short154: `援交`,
    short155: `自杀`,
    short156: `跳楼`,
    short157: `暴力`,
    short158: `未設置`,
    short159: `未生成`,
    short16: `感謝你的支持！❤️`,
    short160: `測試用戶`,
    short161: `測試用戶`,
    short162: `結果更準確`,
    short163: `需要關注`,
    short164: `加入群組`,
    short165: `查看詳情`,
    short17: `讓其他用戶更了解你`,
    short18: `這正確嗎？

`,
    short19: `🗑️ 刪除草稿`,
    short2: `🌈 任何人都可以`,
    short20: `🏷️ 編輯興趣`,
    short21: `請選擇測驗版本：`,
    short22: `你的工作方式是：`,
    short23: `有明確的截止日期`,
    short24: `很快就能熟絡起來`,
    short25: `需要時間慢慢熟悉`,
    short26: `壓力大時，你會：`,
    short27: `列清單按計劃購買`,
    short28: `卡住（重試中）`,
    short29: `✏️ 修改內容`,
    short3: `✏️ 繼續編輯資料`,
    short30: `📖 編輯簡介`,
    short31: `🌍 編輯地區`,
    short32: `💝 匹配偏好`,
    short33: `正在更新...`,
    short34: `🔞 色情內容`,
    short35: `主動與他人交談`,
    short36: `等待他人來找我`,
    short37: `週末你更喜歡：`,
    short38: `實際經驗和事實`,
    short39: `按部就班的方法`,
    short4: `📝 重新進行測驗`,
    short40: `探索創新的方式`,
    short41: `邏輯和客觀分析`,
    short42: `情感和人際和諧`,
    short43: `提前計劃和準備`,
    short44: `隨機應變和靈活`,
    short45: `保持開放的選擇`,
    short46: `使用比喻和類比`,
    short47: `傾聽並給予安慰`,
    short48: `你的房間通常：`,
    short49: `購物時，你會：`,
    short5: `📝 進行快速測驗`,
    short50: `讓別人更了解你`,
    short51: `找到同城的朋友`,
    short52: `看看別人的故事`,
    short53: `至少 20 字`,
    short54: `: 主動配對,`,
    short55: `女生（默認）`,
    short56: `男生（默認）`,
    short57: `結果僅供參考`,
    short58: `你可以：
`,
    short59: `和朋友出去玩`,
    short6: `至少需要一個過濾器`,
    short60: `在家獨處休息`,
    short61: `感到充滿活力`,
    short62: `感到需要休息`,
    short63: `直覺和可能性`,
    short64: `關注具體細節`,
    short65: `關注整體概念`,
    short66: `直接指出問題`,
    short67: `考慮對方感受`,
    short68: `制定詳細行程`,
    short69: `隨心所欲探索`,
    short7: `新用戶******`,
    short70: `積極發表意見`,
    short71: `你的朋友圈：`,
    short72: `廣泛但不深入`,
    short73: `未來和可能性`,
    short74: `使用具體例子`,
    short75: `已驗證的方法`,
    short76: `基於現實條件`,
    short77: `想像各種可能`,
    short78: `有規律和結構`,
    short79: `包含敏感詞彙`,
    short8: `批評他人時，你會：`,
    short80: `填寫興趣標籤`,
    short81: `完善自我介紹`,
    short82: `加入官方頻道`,
    short83: `寫下你的故事`,
    short84: `👨 男生`,
    short85: `👩 女生`,
    short86: `👨 男性`,
    short87: `👩 女性`,
    short88: `審核時間：`,
    short89: `❓ 不確定`,
    short9: `旅行時，你傾向於：`,
    short90: `你更看重：`,
    short91: `公平和正義`,
    short92: `同情和理解`,
    short93: `先想好再說`,
    short94: `找朋友聊天`,
    short95: `實用的指南`,
    short96: `理論和概念`,
    short97: `現在和過去`,
    short98: `你更信任：`,
    short99: `事實和數據`,
    start: `開始時間：\${new Date(maintenance.startTime).toLocaleString('zh-TW')}
`,
    start10: `開始使用 →`,
    start2: `開始時間: \${new Date(broadcast.startedAt).toLocaleString('zh-TW')}
`,
    start3: `開始：\${startTime.toLocaleString('zh-TW')}
`,
    start4: `開始時間: \${broadcast.started_at}

`,
    start5: `開始：\${startTime.toLocaleString(`,
    start6: `🎉 **準備好了！開始交朋友吧～**

`,
    start7: `• 使用 /throw 重新開始
`,
    start8: `📺 開始觀看廣告`,
    start9: `開始你的交友之旅`,
    stats: `💡 使用 /ad_stats {id} 查看詳細統計`,
    stats2: `• /stats - 查看統計

`,
    stats3: `📊 查看統計 - /stats
`,
    stats4: `📊 **官方廣告統計**

`,
    stats5: `邀請統計:
`,
    stats6: `統計:
`,
    success: `購買成功`,
    systemError: `❌ 系統發生錯誤`,
    task: `🎉 恭喜完成任務：加入官方頻道！

`,
    task2: `[📋 查看任務中心] → /tasks`,
    task3: `• /tasks - 查看任務中心
`,
    task4: `💡 使用 /tasks 查看更多任務`,
    task5: `處理任務時，你會：`,
    task6: `📋 查看任務`,
    text: `目標：\${broadcast.target_type}
`,
    text10: `📖 個人簡介：\${updatedUser.bio ||`,
    text100: `💡 請在下方輸入框輸入內容`,
    text101: `這可能需要一些時間，請稍候。`,
    text102: `你可以隨時使用以下命令：
`,
    text103: `🛠️ 系統維護通知

`,
    text104: `🛠️ 維護模式狀態

`,
    text105: `評價一個想法時，你首先考慮：`,
    text106: `⏱️ 約 2-3 分鐘
`,
    text107: `⏱️ 約 5-8 分鐘
`,
    text108: `📚 我想了解更多安全知識`,
    text109: `立即發送（約 1-2 秒）`,
    text11: `\${Math.floor(hours / 24)} 天前`,
    text110: `2️⃣ 選擇「回覆」
`,
    text111: `**過濾器格式：**
`,
    text112: `• 最短 5 個字符
`,
    text113: `• 不能包含網址連結
`,
    text114: `請輸入你的地區：

`,
    text115: `• 你可以隨時修改此設置`,
    text116: `• 最多 5 個標籤
`,
    text117: `📋 快速版（12 題）`,
    text118: `📚 完整版（36 題）`,
    text119: `• 進行更詳細的測驗
`,
    text12: `總經理 - 出色的管理者，在管理事務或人員方面無與倫比。`,
    text120: `💡 **提示：**
`,
    text121: `學習新事物時，你更喜歡：`,
    text122: `**操作步驟：**
`,
    text123: `🇺🇳 使用聯合國旗`,
    text124: `要直接發送這個草稿嗎？`,
    text125: `這可能需要幾秒鐘時間。`,
    text126: `
感謝您的耐心等待！`,
    text127: `維護時長最少 5 分鐘`,
    text128: `在社交場合中，你通常：`,
    text129: `解決問題時，你更依賴：`,
    text13: `💡 這將顯示在你的資料卡上，讓其他用戶更了解你。
`,
    text130: `在團隊中，你更傾向於：`,
    text131: `思考問題時，你傾向於：`,
    text132: `描述事物時，你傾向於：`,
    text133: `朋友向你傾訴時，你會：`,
    text134: `團隊決策時，你更關注：`,
    text135: `你認為好的領導者應該：`,
    text136: `目標: 所有用戶
`,
    text137: `✏️ 請輸入新的內容`,
    text138: `💰 詐騙 / 釣魚`,
    text139: `😡 騷擾 / 辱罵`,
    text14: `語言: \${user.language_pref}
`,
    text140: `參加聚會後，你通常：`,
    text141: `做決定時，你更重視：`,
    text142: `遇到新朋友時，你會：`,
    text143: `衝突中，你更傾向於：`,
    text144: `你更容易被說服通過：`,
    text145: `你更喜歡的生活方式：`,
    text146: `做決定時，你傾向於：`,
    text147: `隨意逛逛看到喜歡就買`,
    text148: `)} 到期。

`,
    text149: `📋 法律文檔僅提供英文版本。`,
    text15: `🌍 地區：\${updatedUser.city ||`,
    text150: `📋 法的文書は英語版のみ提供されています。`,
    text16: `

✅ 需要驗證：加入群組/頻道後點擊「驗證」按鈕`,
    text17: `目標用戶數：\${userIds.length}

`,
    text18: `預計時間: \${estimatedTime}

`,
    text19: `/broadcast_cleanup confirm`,
    text2: `請使用 /broadcast_filter 查看正確格式。`,
    text20: `💝 匹配偏好：\${matchPrefText}
`,
    text21: `辯論家 - 聰明好奇的思想家，無法抗拒智力上的挑戰。`,
    text22: `寫下你的心情或想法，系統會幫你找到合適的人

`,
    text23: `物流師 - 實際且注重事實的個人，可靠性不容懷疑。`,
    text24: `鑒賞家 - 大膽而實際的實驗者，擅長使用各種工具。`,
    text25: `💡 這是一次性獎勵，領取後會追加到今天的額度中。`,
    text26: `符合用戶數: \${totalUsers} 人
`,
    text27: `• 默認為異性（男生尋找女生，女生尋找男生）
`,
    text28: `狀態: \${progress.status}
`,
    text29: `\${Math.floor(hours)} 小時前`,
    text3: `**過濾條件：**
\${filtersDesc}

`,
    text30: `約 \${remainingMinutes} 分鐘`,
    text31: `約 \${hours} 小時 \${mins} 分鐘`,
    text32: `維護時長不能超過 24 小時（1440 分鐘）`,
    text33: `用戶數: \${totalUsers} 人
`,
    text34: `目標: \${b.target_type}
`,
    text35: `過濾條件: \${filtersDesc}
`,
    text36: `• 最少 4 個字符，最多 36 個字符
`,
    text37: `🇺🇳 如果找不到，可以選擇「聯合國旗」`,
    text38: `📖 個人簡介：\${user.bio ||`,
    text39: `請輸入你的興趣標籤（用逗號分隔）：

`,
    text4: `/maintenance_enable 60 系統升級維護`,
    text40: `• 例如：音樂, 電影, 旅行, 美食
`,
    text41: `服務已恢復正常，感謝您的耐心等待！

`,
    text42: `🌍 地區：\${user.city ||`,
    text43: `來源：\${sourceText}

`,
    text44: `未知的過濾器：\${trimmedKey}`,
    text45: `系統正在進行維護，暫時無法使用。

`,
    text46: `我們根據你的語言設置，推測你來自：
`,
    text47: `• 每個標籤最多 20 個字符

`,
    text48: `時長：\${duration} 分鐘
`,
    text49: `1. 你了解網路交友的安全風險嗎？
`,
    text5: `👋 歡迎回來，\${user.nickname}！

`,
    text50: `2. 你會保護好自己的個人資訊嗎？
`,
    text51: `很好！現在請上傳你的頭像照片：

`,
    text52: `🌊 **XunNi 是什麼？**
`,
    text53: `🎉 檢測到你已加入官方頻道！

`,
    text54: `💡 這樣可以準確指定要封鎖的對象。`,
    text55: `狀態：\${statusText}
`,
    text56: `💡 現在可以直接測試核心功能：
`,
    text57: `你想要尋找什麼樣的聊天對象？

`,
    text58: `• 介紹你的興趣、性格或想說的話
`,
    text59: `🏷️ **編輯興趣標籤**

`,
    text6: `建築師 - 富有想像力和戰略性的思想家，一切皆在計劃之中。`,
    text60: `為了安全，只允許以下網域的連結：
`,
    text61: `📋 **快速版（12 題）**
`,
    text62: `📚 **完整版（36 題）**
`,
    text63: `• 頭像會自動每 7 天更新一次
`,
    text64: `3️⃣ 輸入 /report

`,
    text65: `3️⃣ 輸入 /block

`,
    text66: `狀態: \${b.status}
`,
    text67: `不會再被自動處理或重新發送

`,
    text68: `📖 **編輯個人簡介**

`,
    text69: `💝 **設置匹配偏好**

`,
    text7: `主人公 - 富有魅力且鼓舞人心的領導者，有能力使聽眾著迷。`,
    text70: `💬 **你的聊天記錄**

`,
    text71: `• 您也可以隨時使用此命令手動刷新`,
    text72: `📊 **每日數據分析報表**
`,
    text73: `你的帳號已恢復為免費會員。

`,
    text74: `💡 這將顯示在你的資料卡上
`,
    text75: `🔧 開發模式：用戶信息

`,
    text76: `• 直接輸入新內容來替換草稿
`,
    text77: `• 不允許連結、圖片、多媒體
`,
    text78: `• 顯示時最多 18 個字符
`,
    text79: `• 對方最多顯示 18 個字
`,
    text8: `/broadcast 系統將於今晚 22:00 進行維護`,
    text80: `💡 請移除這些連結後重新發送。`,
    text81: `🔄 正在刷新頭像...

`,
    text82: `• 免費用戶看到的是模糊頭像
`,
    text83: `💬 **如何成為朋友？**
`,
    text84: `無效的過濾器格式：\${pair}`,
    text85: `你的所有數據已被刪除。

`,
    text86: `📝 **草稿內容**

`,
    text87: `🌍 **編輯地區**

`,
    text88: `• 例如：台北、香港、東京
`,
    text89: `• 最多 50 個字符

`,
    text9: `🏷️ 興趣標籤：\${user.interests ||`,
    text90: `約 \${minutes} 分鐘`,
    text91: `寫下你的故事（至少 20 字）`,
    text92: `正在查詢符合條件的用戶...`,
    text93: `• 最多 250 個字符
`,
    text94: `• 不要包含個人聯絡方式
`,
    text95: `請選擇要編輯的項目：

`,
    text96: `請輸入你的個人簡介：

`,
    text97: `• 最多 200 個字符
`,
    text98: `• 避免包含聯絡方式

`,
    text99: `現在可以正常使用所有功能了。`,
    throw: `⏰ 丟瓶流程已超時

請使用 /throw 重新開始。`,
    throw2: `丟瓶流程`,
    uncertain: `❓ 不確定`,
    unknownOption: `⚠️ 未知的選項`,
    unlimited: `無限制`,
    userNotFound: `❌ 用戶不存在`,
    vip: `你的 VIP 訂閱已於 \${new Date(user.vip_expire_at).toLocaleDateString('zh-TW')} 到期。

`,
    vip10: `😢 **VIP 訂閱已到期**

`,
    vip11: `• 升級 VIP 後會自動刷新歷史帖子`,
    vip12: `⭐ 升級 VIP - /vip
`,
    vip13: `💎 VIP 用戶無需觀看廣告`,
    vip14: `目標: 非 VIP 用戶
`,
    vip15: `目標: VIP 用戶
`,
    vip16: `非 VIP 用戶`,
    vip17: `VIP 用戶`,
    vip2: `你的 VIP 訂閱已於 \${new Date(user.vip_expire_at).toLocaleDateString(`,
    vip3: `/broadcast_filter vip=true,mbti=INTJ VIP 專屬活動通知
`,
    vip4: `每邀請 1 人，每日額度永久 +1（免費最多 10 人，VIP 最多 100 人）`,
    vip5: `VIP: \${user.is_vip ? '是' : '否'}
`,
    vip6: `💡 升級 VIP 可使用進階篩選（MBTI/星座）：/vip`,
    vip7: `💡 隨時可以重新訂閱 VIP：/vip

`,
    vip8: `💡 血型可用於 VIP 血型配對功能

`,
    vip9: `• VIP 用戶可以看到清晰的對方頭像
`,
    yes: `是`,
    zodiac: `無效的星座：\${trimmedValue}（必須是以下之一：\${VALID_ZODIACS.join(', ')}）`,
  },
  conversation: {
    age: `🎂 年齡範圍：\${ageRange} 歲
`,
    anonymousCardHint: `💡 這是匿名資料卡，不會顯示對方的真實身份資訊。`,
    backToMenuCommand: `🏠 返回主選單：/menu`,
    ban: `• 多次被舉報會導致封禁
`,
    blockConfirmButton: `✅ 確定封鎖`,
    blockConfirmMessage: `封鎖後：
• 對方無法再向你發送訊息
• 你們不會再被匹配到
• 此對話將立即結束

💡 這不會舉報對方，只是不想再聊天。`,
    blockConfirmTitle: `🚫 **確定要封鎖這位用戶嗎？**`,
    blockSuccessMessage: `對方已被封鎖，你們不會再被匹配到。

💡 想要開始新的對話嗎？
• 使用 /catch 撿起新的漂流瓶`,
    blockSuccessNewConversation: `💬 **對話已結束**

對方結束了這個對話。

💡 想要開始新的對話嗎？
• 使用 /catch 撿起新的漂流瓶`,
    blockSuccessTitle: `✅ **已封鎖此用戶**`,
    blocked: `✅ 已封鎖`,
    bloodType: `🩸 血型：\${partnerInfo.bloodType}
`,
    bloodType2: `🩸 血型：\${bloodTypeText}
`,
    bottle: `使用 /catch 撿漂流瓶開始聊天吧！

`,
    bottle2: `• 使用 /catch 撿起新的漂流瓶`,
    cancelButton: `❌ 取消`,
    cancelSuccess: `已取消`,
    conversation: `💬 與 #\${identifier} 的對話記錄（第 \${postNumber} 頁）

`,
    conversation10: `目前沒有任何對話。

`,
    conversation11: `• 此對話將立即結束
`,
    conversation2: `💬 **我的對話列表** (\${conversations.length})

`,
    conversation3: `💡 點擊對方訊息的「回覆」按鈕即可繼續對話
`,
    conversation4: `💬 **對話已結束**

`,
    conversation5: `💬 **我的對話**

`,
    conversation6: `💡 想要開始新的對話嗎？
`,
    conversation7: `• 此對話將立即結束

`,
    conversation8: `對方結束了這個對話。

`,
    conversation9: `💡 這是對話的歷史記錄
`,
    conversationEnded: `❌ 此對話已結束。

使用 /catch 撿新的漂流瓶開始新對話。`,
    conversationInfoError: `[需要从 zh-TW.ts 获取翻译]`,
    editProfileCommand: `✏️ 編輯個人資料：/edit_profile`,
    endedMessage: `對方結束了這個對話。

💡 想要開始新的對話嗎？
• 使用 /catch 撿起新的漂流瓶`,
    endedNewConversation: `💬 **對話已結束**

對方結束了這個對話。

💡 想要開始新的對話嗎？
• 使用 /catch 撿起新的漂流瓶`,
    endedTitle: `💬 **對話已結束**`,
    gender: `👤 性別：\${otherUser.gender}
`,
    mediaRestriction: `⚠️ **不允許發送圖片、影片或多媒體**

💡 為了保護隱私和安全，對話中只允許純文字訊息。

請使用文字訊息與對方交流。`,
    message: `💫 配對度：\${Math.round(partnerInfo.matchScore)}分
`,
    message10: `conv_profile_\${conversationId}`,
    message11: `• 最後訊息：\${lastMessageTime}

`,
    message12: `📊 總訊息數：\${totalMessages} 則
`,
    message13: `💬 直接按 /reply 回覆訊息聊天
`,
    message14: `• 對方無法再向你發送訊息
`,
    message2: `
📜 繼續查看：#\${identifier}-H\${newPostNumber}`,
    message3: `📅 最後更新：\${formatDateTime(new Date())}

`,
    message4: `[\${timeStr}] 對方：
\${messageContent}

`,
    message5: `conv_report_confirm_\${conversationId}`,
    message6: `conv_block_confirm_\${conversationId}`,
    message7: `• 訊息數：\${conv.message_count} 則
`,
    message77: `💬 使用 /reply 回覆訊息`,
    message8: `🏷️ 興趣：\${otherUser.interests}
`,
    message9: `💬 來自 #\${identifier} 的新訊息：

`,
    nickname: `📝 暱稱：\${partnerInfo.maskedNickname}
`,
    nickname2: `📝 暱稱：\${displayNickname}
`,
    noHistory: `💬 你還沒有任何對話記錄

快去丟瓶子認識新朋友吧！ /throw

🏠 返回主選單：/menu`,
    profile: `✏️ 編輯個人資料：/edit_profile
`,
    profileCardTitle: `👤 **對方的資料卡**`,
    replyButton: `💬 回覆訊息`,
    replyConversation: `💬 回覆對話 {identifier}`,
    replyHint: `💡 請在下方輸入框輸入內容`,
    replyMethod1: `1️⃣ 點擊下方「💬 回覆訊息」按鈕`,
    replyMethod2: `2️⃣ 長按此訊息，選擇「回覆」後輸入內容`,
    replyMethodsTitle: `💡 **兩種回覆方式**：`,
    report: `🚨 **確定要舉報這位用戶嗎？**

`,
    report2: `💡 這不會舉報對方，只是不想再聊天。`,
    report3: `感謝你的舉報，我們會盡快審核。

`,
    report4: `舉報後：
`,
    reportConfirmButton: `✅ 確定舉報`,
    reportConfirmMessage: `舉報後：
• 我們會審核此用戶的行為
• 多次被舉報會導致封禁
• 此對話將立即結束
• 24小時內不會再匹配到此用戶

💡 請確保對方確實有不當行為。`,
    reportConfirmTitle: `🚨 **確定要舉報這位用戶嗎？**`,
    reportSuccessMessage: `感謝你的舉報，我們會盡快審核。

💡 想要開始新的對話嗎？
• 使用 /catch 撿起新的漂流瓶`,
    reportSuccessNewConversation: `💬 **對話已結束**

對方結束了這個對話。

💡 想要開始新的對話嗎？
• 使用 /catch 撿起新的漂流瓶`,
    reportSuccessTitle: `✅ **已舉報此用戶**`,
    reported: `✅ 已舉報`,
    separator: `━━━━━━━━━━━━━━━━`,
    settings: `🧠 MBTI：\${otherUser.mbti_result}
`,
    settings2: `未設定`,
    settings3: `未設定`,
    settings4: `未設定`,
    settings5: `未設定`,
    short: `封鎖後：
`,
    short2: `未知用戶`,
    short3: `剛剛`,
    stats: `📊 使用 /stats 查看詳細統計
`,
    text: `💡 這是匿名資料卡，不會顯示對方的真實身份資訊。

`,
    text10: `💎 使用 /vip 了解更多

`,
    text11: `👤 **對方的資料卡**

`,
    text12: `\${diffHours} 小時前`,
    text13: `💡 請確保對方確實有不當行為。`,
    text14: `\${diffMins} 分鐘前`,
    text15: `• 我們會審核此用戶的行為
`,
    text16: `💎 使用 /vip 了解更多`,
    text17: `\${diffDays} 天前`,
    text18: `• 你們不會再被匹配到
`,
    text19: `👤 對方資料：
`,
    text2: `📜 查看歷史記錄：#\${identifier}
`,
    text3: `🗣️ 語言：\${languageLabel}
`,
    text4: `🌍 地區：\${otherUser.city}
`,
    text5: `📖 簡介：\${otherUser.bio}
`,
    text6: `conv_reply_\${identifier}`,
    text7: `🚫 **確定要封鎖這位用戶嗎？**

`,
    text8: `對方已被封鎖，你們不會再被匹配到。

`,
    text9: `• 24小時內不會再匹配到此用戶

`,
    vip: `
🔒 升級 VIP 解鎖對方清晰頭像
`,
    vip2: `🔒 升級 VIP 解鎖對方清晰頭像
`,
    vipLearnMore: `💎 使用 /vip 了解更多`,
    vipUnlockAvatar: `🔒 升級 VIP 解鎖對方清晰頭像`,
    zodiac: `⭐ 星座：\${partnerInfo.zodiac}
`,
    zodiac2: `⭐ 星座：\${zodiacLabel}
`,
  },
  conversationHistory: {
    backToMenu: `🏠 返回主選單：/menu`,
    bloodType: `🩸 血型：\${bloodType}`,
    continueView: `📜 繼續查看：#\${identifier}-H\${postNumber}`,
    historyNote: `💡 這是對話的歷史記錄`,
    lastUpdated: `📅 最後更新：\${time}`,
    matchScore: `💫 配對度：\${score}分`,
    mbti: `🧠 MBTI：\${mbti}`,
    messageEntry: `[\${time}] 對方：
\${content}`,
    newMessage: `💬 來自 #\${identifier} 的新訊息：`,
    nickname: `📝 暱稱：\${nickname}`,
    other: `對方`,
    partnerInfo: `👤 對方資料：`,
    replyButton: `💬 回覆訊息`,
    replyHint: `💬 直接按 /reply 回覆訊息聊天`,
    title: `💬 與 #\${identifier} 的對話記錄（第 \${postNumber} 頁）`,
    totalMessages: `📊 總訊息數：\${count} 則`,
    viewAllConversations: `📊 查看所有對話`,
    viewHistory: `📜 查看歷史記錄：#\${identifier}`,
    viewProfileCard: `👤 查看對方資料卡`,
    vipLearnMore: `💎 使用 /vip 了解更多`,
    vipUnlockAvatar: `🔒 升級 VIP 解鎖對方清晰頭像`,
    you: `你`,
    zodiac: `⭐ 星座：\${zodiac}`,
  },
  countries: {
    ae: `阿聯酋`,
    al: `阿爾巴尼亞`,
    am: `亞美尼亞`,
    ar: `阿根廷`,
    at: `奧地利`,
    au: `澳洲`,
    az: `亞塞拜然`,
    ba: `波斯尼亞`,
    bb: `巴貝多`,
    bd: `孟加拉`,
    be: `比利時`,
    bg: `保加利亞`,
    bh: `巴林`,
    bo: `玻利維亞`,
    br: `巴西`,
    ca: `加拿大`,
    ch: `瑞士`,
    ci: `象牙海岸`,
    cl: `智利`,
    cm: `喀麥隆`,
    cn: `中國`,
    co: `哥倫比亞`,
    cr: `哥斯大黎加`,
    cu: `古巴`,
    cz: `捷克`,
    de: `德國`,
    dk: `丹麥`,
    do: `多明尼加`,
    dz: `阿爾及利亞`,
    ec: `厄瓜多`,
    ee: `愛沙尼亞`,
    eg: `埃及`,
    es: `西班牙`,
    et: `衣索比亞`,
    fi: `芬蘭`,
    fr: `法國`,
    gb: `英國`,
    ge: `喬治亞`,
    gh: `迦納`,
    gr: `希臘`,
    gt: `瓜地馬拉`,
    hk: `香港`,
    hn: `宏都拉斯`,
    hr: `克羅地亞`,
    hu: `匈牙利`,
    id: `印尼`,
    ie: `愛爾蘭`,
    il: `以色列`,
    in: `印度`,
    iq: `伊拉克`,
    ir: `伊朗`,
    is: `冰島`,
    it: `意大利`,
    jm: `牙買加`,
    jo: `約旦`,
    jp: `日本`,
    ke: `肯亞`,
    kh: `柬埔寨`,
    kr: `韓國`,
    kw: `科威特`,
    kz: `哈薩克`,
    la: `寮國`,
    lb: `黎巴嫩`,
    lk: `斯里蘭卡`,
    lt: `立陶宛`,
    lv: `拉脫維亞`,
    ly: `利比亞`,
    ma: `摩洛哥`,
    mk: `北馬其頓`,
    mm: `緬甸`,
    mn: `蒙古`,
    mo: `澳門`,
    mt: `馬爾他`,
    mx: `墨西哥`,
    my: `馬來西亞`,
    ng: `奈及利亞`,
    ni: `尼加拉瓜`,
    nl: `荷蘭`,
    no: `挪威`,
    np: `尼泊爾`,
    nz: `紐西蘭`,
    om: `阿曼`,
    pa: `巴拿馬`,
    pe: `秘魯`,
    ph: `菲律賓`,
    pk: `巴基斯坦`,
    pl: `波蘭`,
    pt: `葡萄牙`,
    py: `巴拉圭`,
    qa: `卡達`,
    ro: `羅馬尼亞`,
    rs: `塞爾維亞`,
    ru: `俄羅斯`,
    rw: `盧安達`,
    sa: `沙特阿拉伯`,
    sd: `蘇丹`,
    se: `瑞典`,
    sg: `新加坡`,
    si: `斯洛維尼亞`,
    sk: `斯洛伐克`,
    sn: `塞內加爾`,
    sv: `薩爾瓦多`,
    sy: `敘利亞`,
    th: `泰國`,
    tn: `突尼西亞`,
    tr: `土耳其`,
    tt: `千里達`,
    tw: `台灣`,
    tz: `坦尚尼亞`,
    ua: `烏克蘭`,
    ug: `烏干達`,
    un: `聯合國`,
    us: `美國`,
    uy: `烏拉圭`,
    uz: `烏茲別克`,
    ve: `委內瑞拉`,
    vn: `越南`,
    ye: `葉門`,
    za: `南非`,
    zw: `辛巴威`,
  },
  country: {
    buttonAU: `🇦🇺 澳洲`,
    buttonCA: `🇨🇦 加拿大`,
    buttonCN: `🇨🇳 中國`,
    buttonDE: `🇩🇪 德國`,
    buttonFR: `🇫🇷 法國`,
    buttonGB: `🇬🇧 英國`,
    buttonHK: `🇭🇰 香港`,
    buttonJP: `🇯🇵 日本`,
    buttonKR: `🇰🇷 韓國`,
    buttonMY: `🇲🇾 馬來西亞`,
    buttonNZ: `🇳🇿 紐西蘭`,
    buttonSG: `🇸🇬 新加坡`,
    buttonTH: `🇹🇭 泰國`,
    buttonTW: `🇹🇼 台灣`,
    buttonUS: `🇺🇸 美國`,
    confirmButton: `✅ 正確`,
    confirmDetected: `我們根據你的語言設置，推測你來自：
`,
    confirmFailed: `❌ 確認失敗`,
    confirmHint: `💡 這將顯示在你的資料卡上，讓其他用戶更了解你。
`,
    confirmQuestion: `這正確嗎？

`,
    confirmReward: `🎉 確認後可獲得 +1 瓶子獎勵！`,
    confirmTitle: `🌍 **確認你的國家/地區**

`,
    confirmed: `✅ 已確認！`,
    notCorrectButton: `❌ 不正確`,
    selectHint: `💡 這將顯示在你的資料卡上
`,
    selectTitle: `🌍 **請選擇你的國家/地區**

`,
    selectUnFlagHint: `🇺🇳 如果找不到，可以選擇「聯合國旗」`,
    setFailed: `❌ 設置失敗`,
    setTo: `✅ 已設置為 {flag} {country}`,
    unFlagButton: `🇺🇳 聯合國旗`,
    useUnFlagButton: `🇺🇳 使用聯合國旗`,
  },
  dailyReports: {
    header: `📊 **每日數據分析報表**`,
    time: `時間：\${time}`,
  },
  dev: {
    autoCompleted: `已自動完成註冊流程。

`,
    bottles: `• 漂流瓶: {count}
`,
    catchCommand: `• /catch - 撿漂流瓶
`,
    conversations: `• 對話: {count}
`,
    dataReset: `✅ 開發模式：數據已重置

你的所有數據已被刪除。

💡 現在可以重新開始測試註冊流程。

🔄 重新註冊：/start
或使用：/dev_restart（自動開始註冊）

⚠️ 注意：此功能僅在 Staging 環境可用。`,
    getUserInfoFailed: `❌ 獲取信息失敗`,
    inviteActivated: `• 已激活: {count}
`,
    inviteCode: `邀請碼: {code}
`,
    invitePending: `• 待激活: {count}

`,
    inviteStats: `邀請統計:
`,
    inviteTotal: `• 邀請記錄總數: {count}
`,
    invitedBy: `被誰邀請: {invitedBy}

`,
    language: `語言: {lang}
`,
    messages: `• 訊息: {count}

`,
    nickname: `昵稱: {nickname}
`,
    no: `否`,
    none: `無`,
    notAvailableInProduction: `❌ 此命令在生產環境中不可用。

This command is not available in production.`,
    notGenerated: `未生成`,
    notSet: `未設置`,
    onboardingStep: `註冊步驟: {step}
`,
    resetFailed: `❌ 重置失敗：{error}

請稍後再試。`,
    skipFailed: `❌ 跳過失敗`,
    skipRegistration: `✅ 開發模式：跳過註冊

`,
    stagingOnly: `⚠️ 此功能僅在 Staging 環境可用。`,
    stats: `統計:
`,
    statsCommand: `• /stats - 查看統計

`,
    successfulInvites: `• successful_invites: {count}
`,
    telegramId: `Telegram ID: {id}
`,
    testCoreFeatures: `💡 現在可以直接測試核心功能：
`,
    testUser: `測試用戶`,
    throwCommand: `• /throw - 丟漂流瓶
`,
    userInfo: `🔧 開發模式：用戶信息

`,
    userNotFound: `❌ 用戶不存在`,
    vip: `VIP: {status}
`,
    yes: `是`,
  },
  draft: {
    'age.daysAgo': `\\\${days} 天前`,
    'age.hoursAgo': `\\\${hours} 小時前`,
    'age.justNow': `剛剛`,
    contentHint: `💡 你可以：
• 直接輸入新內容來替換草稿
• 使用 /throw 重新開始
• 發送草稿內容來丟出漂流瓶`,
    contentTitle: `📝 **草稿內容**

`,
    continueEditing: `✅ 繼續編輯草稿`,
    deleteButton: `🗑️ 刪除草稿`,
    deleted: `✅ 草稿已刪除`,
    editButton: `✏️ 修改內容`,
    editInput: `✏️ 請輸入新的漂流瓶內容：

💡 提示：
• 最短 5 個字符
• 最多 250 個字符
• 不允許連結、圖片、多媒體
• 不要包含個人聯絡方式
• 友善、尊重的內容更容易被撿到哦～`,
    editPrompt: `✏️ 請輸入新的內容`,
    newBottle: `✅ 開始新的漂流瓶`,
    notFound: `⚠️ 草稿不存在或已過期`,
    sendButton: `✅ 發送草稿`,
    sendQuestion: `要直接發送這個草稿嗎？`,
    sending: `✅ 正在發送...`,
    targetGender: `你想要尋找什麼樣的聊天對象？

`,
    targetGenderHint: `💡 升級 VIP 可使用進階篩選（MBTI/星座）：/vip`,
    throwBottle: `🍾 丟漂流瓶

你想要尋找什麼樣的聊天對象？`,
  },
  edit_profile: {
    nickname: `👤 昵称：\\\\\\\\\\\\\\\${ownerMaskedNickname}`,
    short19: `✏️ 編輯個人資料`,
  },
  error: {
    ad: `❌ 此廣告不需要驗證`,
    ad2: `❌ 暫無可用的廣告`,
    ad3: `❌ 無法領取此廣告`,
    ad4: `❌ 廣告不存在`,
    ad5: `❌ 廣告 ID 必須是數字`,
    ad6: `❌ 你沒有權限查看廣告數據`,
    admin: `❌ 系統發生錯誤，請稍後再試。

如果問題持續，請聯繫管理員。`,
    admin2: `❌ **權限不足**

此命令僅限超級管理員使用。`,
    admin3: `❌ 此用戶已經是超級管理員，無需添加。`,
    admin4: `❌ 只有超級管理員可以使用此命令。`,
    admin5: `❌ 此用戶已經是管理員。`,
    admin6: `❌ 無法移除超級管理員。`,
    admin7: `❌ 此用戶不是管理員。`,
    appeal: `❌ 請提供申訴 ID

用法: /admin_approve <appeal_id> [備註]`,
    appeal2: `❌ 請提供申訴 ID

用法: /admin_reject <appeal_id> [備註]`,
    appeal3: `❌ 申訴 \${appealId} 已經被審核過了`,
    appeal4: `❌ 找不到申訴 ID: \${appealId}`,
    ban: `❌ 用戶 \${targetUserId} 沒有封禁記錄`,
    birthday: `❌ \${validation.error}

請重新輸入生日（格式：YYYY-MM-DD）：`,
    birthday2: `❌ 生日格式錯誤

請重新輸入（格式：YYYY-MM-DD）：`,
    birthday3: `❌ 生日格式錯誤`,
    bottle: `❌ 此對話已結束。

使用 /catch 撿新的漂流瓶開始新對話。`,
    bottle2: `❌ 你的帳號已被封禁，無法撿漂流瓶。

如有疑問，請使用 /appeal 申訴。`,
    bottle3: `❌ 這個瓶子已經被其他人撿走了，請試試其他瓶子！`,
    broadcast: `❌ 當前廣播系統僅支持 \${MAX_SAFE_USERS} 個用戶以內的廣播。

`,
    broadcast2: `❌ 廣播 ID 必須是數字`,
    broadcast3: `❌ 找不到該廣播記錄`,
    cancel: `❌ 暱稱太長，請輸入不超過 36 個字符的暱稱。

請重新輸入或取消編輯：`,
    cancel2: `❌ 個人簡介太長，請輸入不超過 200 個字符。

請重新輸入或取消編輯：`,
    cancel3: `❌ 地區名稱太長，請輸入不超過 50 個字符。

請重新輸入或取消編輯：`,
    cancel4: `❌ 暱稱太短，至少需要 4 個字符。

請重新輸入或取消編輯：`,
    cancel5: `❌ 每個標籤最多 20 個字符。

請重新輸入或取消編輯：`,
    cancel6: `❌ 取消編輯`,
    cancel7: `❌ 已取消 \${ZODIAC_NAMES[zodiacSign]}`,
    cancel8: `❌ 已取消 \${mbtiType}`,
    cancel9: `❌ 取消`,
    conversation: `❌ 找不到標識符 \${formatIdentifier(identifier)} 的對話

`,
    conversation2: `❌ 對話資訊錯誤。`,
    conversation3: `❌ 對話資訊錯誤`,
    conversation4: `❌ 對話不存在`,
    conversationInfoError: `❌ 對話資訊錯誤`,
    conversationNotFound: `❌ 對話不存在`,
    failed: `❌ **廣告加載失敗**

很抱歉，廣告無法正常播放。

💡 **可能的原因：**
• 網絡連接不穩定
• 廣告提供商暫時不可用
• 瀏覽器不支持

🔄 **建議：**
• 檢查網絡連接
• 稍後再試
• 或使用其他方式獲得額度（邀請朋友）`,
    failed10: `❌ 查詢維護模式狀態失敗。`,
    failed11: `❌ 刷新頭像失敗

`,
    failed12: `❌ 驗證失敗，請稍後再試`,
    failed13: `❌ 啟用維護模式失敗。`,
    failed14: `❌ 關閉維護模式失敗。`,
    failed15: `❌ 獲取廣告狀態失敗`,
    failed16: `❌ 獲取統計數據失敗`,
    failed17: `❌ 創建廣播失敗。`,
    failed18: `❌ 獲取信息失敗`,
    failed19: `❌ 領取獎勵失敗`,
    failed2: `❌ 創建過濾廣播失敗

\${error instanceof Error ? error.message : String(error)}`,
    failed20: `❌ 確認失敗`,
    failed21: `❌ 設置失敗`,
    failed22: `❌ 跳過失敗`,
    failed23: `❌ 操作失敗`,
    failed24: `❌ 發送每日報表失敗：\${error instanceof Error ? error.message : String(error)}`,
    failed25: `❌ 獲取 VIP 漏斗數據失敗`,
    failed26: `❌ **診斷失敗**

`,
    failed27: `❌ **刷新失敗**

`,
    failed28: `❌ **支付失敗**

`,
    failed29: `❌ 獲取廣告提供商列表失敗`,
    failed3: `❌ 處理廣播隊列失敗：\${error instanceof Error ? error.message : String(error)}`,
    failed30: `❌ 獲取官方廣告列表失敗`,
    failed31: `❌ 啟用廣告提供商失敗`,
    failed32: `❌ 停用廣告提供商失敗`,
    failed33: `❌ 啟用官方廣告失敗`,
    failed34: `❌ 停用官方廣告失敗`,
    failed35: `❌ 獲取分析數據失敗`,
    failed36: `❌ 獲取廣告數據失敗`,
    failed37: `❌ 設置優先級失敗`,
    failed38: `❌ 退款失敗：\${error instanceof Error ? error.message : String(error)}`,
    failed39: `❌ 操作失敗：\${error instanceof Error ? error.message : String(error)}`,
    failed4: `❌ 查詢廣播狀態失敗：\${error instanceof Error ? error.message : String(error)}`,
    failed40: `❌ 提交失敗，請稍後再試。`,
    failed41: `❌ 建立對話失敗，請稍後再試。`,
    failed5: `❌ 取消廣播失敗：\${error instanceof Error ? error.message : String(error)}`,
    failed6: `❌ 清理廣播失敗：\${error instanceof Error ? error.message : String(error)}`,
    failed7: `❌ 重置失敗：\${errorMessage}

請稍後再試。`,
    failed8: `❌ 創建廣播失敗，請稍後再試。`,
    failed9: `❌ 刷新對話歷史失敗

`,
    mbti: `❌ 無效的 MBTI 類型`,
    message: `❌ 過濾器格式錯誤

\${error instanceof Error ? error.message : String(error)}

`,
    message2: `❌ 此命令在生產環境中不可用。

This command is not available in production.`,
    message3: `❌ 發生錯誤，請稍後再試。

錯誤信息：\${error instanceof Error ? error.message : String(error)}`,
    message4: `❌ 很抱歉，你必須年滿 18 歲才能使用本服務。

請成年後再來！`,
    nickname: `❌ 無法獲取 Telegram 暱稱`,
    nickname2: `❌ 暱稱不能包含網址連結

`,
    nickname3: `❌ \${validation.error}

請重新輸入暱稱：`,
    quota: `❌ 今日漂流瓶配額已用完（\${quotaDisplay}）

💡 獲得更多配額的方式：
`,
    quota2: `❌ 今日對話訊息配額已用完（\${usedToday}/\${dailyLimit}）

`,
    quota3: `❌ 今日漂流瓶配額已用完（\${quotaDisplay}）

`,
    register: `❌ 請先完成註冊流程。

使用 /start 繼續註冊。`,
    register2: `❌ 找不到用戶資料，請先使用 /start 註冊。`,
    register3: `❌ 請先完成註冊流程才能撿漂流瓶。

使用 /start 繼續註冊。`,
    settings: `❌ 最多只能設定 5 個興趣標籤。

請重新輸入或取消編輯：`,
    short: `❌ 無效的語言代碼`,
    short10: `❌ 權限不足`,
    short11: `❌ 稍後再說`,
    short12: `❌ 重新選擇`,
    short13: `❌ 重新輸入`,
    short14: `❌ 關閉`,
    short15: `❌ 未啟用`,
    short2: `❌ 找不到用戶資料`,
    short3: `❌ 未知的教學步驟`,
    short4: `❌ 系統發生錯誤`,
    short5: `❌ 頻道配置錯誤`,
    short6: `❌ 未知操作`,
    short7: `❌ 不正確`,
    short8: `❌ 否`,
    short9: `❌ 發生錯誤`,
    start: `❌ 發生錯誤，請重新開始：/start`,
    stats: `❌ 你沒有權限查看廣告統計`,
    task: `❌ 查看任務中心時系統發生錯誤，請稍後再試。`,
    text: `❌ 計算結果時系統發生錯誤，請稍後再試。

`,
    text10: `❌ 發送者資訊錯誤。`,
    text11: `❌ 你沒有權限查看分析數據`,
    text12: `❌ 發生錯誤，請稍後再試。`,
    text13: `❌ 你沒有權限使用此命令。`,
    text14: `❌ 使用方法錯誤

`,
    text15: `❌ 優先級必須是非負整數`,
    text16: `❌ 時長必須是正整數或`,
    text17: `❌ 處理支付時系統發生錯誤，請聯繫客服。

`,
    text18: `❌ 退款原因至少需要 10 個字，請重新輸入：`,
    text19: `❌ **退款申請已被拒絕**

`,
    text2: `❌ 個人簡介包含不允許的連結。

`,
    text20: `❌ 退款申請超過時限

`,
    text21: `❌ 退款請求不存在或已處理`,
    text22: `❌ 找不到支付記錄。`,
    text23: `❌ 很抱歉，你必須年滿 18 歲才能使用本服務。

`,
    text24: `❌ 發生錯誤，請重新輸入。`,
    text25: `❌ 請認真回答問題

`,
    text3: `❌ 未檢測到你加入頻道，請先加入後再試`,
    text4: `❌ 檢測到你已離開頻道，無法領取獎勵。`,
    text5: `❌ 啟動教學時發生錯誤，請稍後再試。`,
    text6: `❌ 系統發生錯誤，請稍後再試。`,
    text7: `❌ 時長必須是數字（分鐘）`,
    text8: `❌ 發生錯誤，請稍後再試`,
    text9: `❌ 無法獲取維護模式狀態`,
    userNotFound: `❌ 用戶不存在，請先使用 /start 註冊。`,
    userNotFound2: `❌ 用戶不存在，請先註冊`,
    userNotFound3: `❌ 對方用戶不存在。`,
    userNotFound4: `❌ 用戶不存在`,
    userNotFound5: `❌ 用戶不存在：\${userId}`,
    userNotFound6: `❌ 用戶不存在或未註冊。`,
    userNotFound7: `❌ 用戶不存在。`,
    vip: `❌ 你沒有權限查看 VIP 數據`,
    vip2: `❌ 你不是 VIP 用戶，無法申請退款。`,
  },
  errors: {
    channelConfigError: `❌ 頻道配置錯誤`,
    claimRewardFailed: `❌ 領取獎勵失敗`,
    completeOnboarding: `⚠️ 請先完成註冊流程。`,
    conversationInfoError: `❌ 對話資訊錯誤。`,
    conversationNotFound: `❌ 找不到此對話`,
    'error.ad': `❌ 此廣告不需要驗證`,
    'error.ad2': `❌ 暫無可用的廣告`,
    'error.ad3': `❌ 無法領取此廣告`,
    'error.ad4': `❌ 廣告不存在`,
    'error.ad5': `❌ 廣告 ID 必須是數字`,
    'error.ad6': `❌ 你沒有權限查看廣告數據`,
    'error.admin': `❌ 系統發生錯誤，請稍後再試。

如果問題持續，請聯繫管理員。`,
    'error.admin2': `❌ **權限不足**

此命令僅限超級管理員使用。`,
    'error.admin3': `❌ 此用戶已經是超級管理員，無需添加。`,
    'error.admin4': `❌ 只有超級管理員可以使用此命令。`,
    'error.admin5': `❌ 此用戶已經是管理員。`,
    'error.admin6': `❌ 無法移除超級管理員。`,
    'error.admin7': `❌ 此用戶不是管理員。`,
    'error.appeal': `❌ 請提供申訴 ID

用法: /admin_approve <appeal_id> [備註]`,
    'error.appeal2': `❌ 請提供申訴 ID

用法: /admin_reject <appeal_id> [備註]`,
    'error.appeal3': `❌ 申訴 \\\${appealId} 已經被審核過了`,
    'error.appeal4': `❌ 找不到申訴 ID: \\\${appealId}`,
    'error.ban': `❌ 用戶 \\\${targetUserId} 沒有封禁記錄`,
    'error.birthday': `❌ \\\${validation.error}

請重新輸入生日（格式：YYYY-MM-DD）：`,
    'error.birthday2': `❌ 生日格式錯誤

請重新輸入（格式：YYYY-MM-DD）：`,
    'error.birthday3': `❌ 生日格式錯誤`,
    'error.bottle': `❌ 此對話已結束。

使用 /catch 撿新的漂流瓶開始新對話。`,
    'error.bottle2': `❌ 你的帳號已被封禁，無法撿漂流瓶。

如有疑問，請使用 /appeal 申訴。`,
    'error.bottle3': `❌ 這個瓶子已經被其他人撿走了，請試試其他瓶子！`,
    'error.broadcast': `❌ 當前廣播系統僅支持 \\\${MAX_SAFE_USERS} 個用戶以內的廣播。

`,
    'error.broadcast2': `❌ 廣播 ID 必須是數字`,
    'error.broadcast3': `❌ 找不到該廣播記錄`,
    'error.cancel': `❌ 暱稱太長，請輸入不超過 36 個字符的暱稱。

請重新輸入或取消編輯：`,
    'error.cancel2': `❌ 個人簡介太長，請輸入不超過 200 個字符。

請重新輸入或取消編輯：`,
    'error.cancel3': `❌ 地區名稱太長，請輸入不超過 50 個字符。

請重新輸入或取消編輯：`,
    'error.cancel4': `❌ 暱稱太短，至少需要 4 個字符。

請重新輸入或取消編輯：`,
    'error.cancel5': `❌ 每個標籤最多 20 個字符。

請重新輸入或取消編輯：`,
    'error.cancel6': `❌ 取消編輯`,
    'error.cancel7': `❌ 已取消 \\\${ZODIAC_NAMES[zodiacSign]}`,
    'error.cancel8': `❌ 已取消 \\\${mbtiType}`,
    'error.cancel9': `❌ 取消`,
    'error.conversation': `❌ 找不到標識符 \\\${formatIdentifier(identifier)} 的對話

`,
    'error.conversation2': `❌ 對話資訊錯誤。`,
    'error.conversation3': `❌ 對話資訊錯誤`,
    'error.conversation4': `❌ 對話不存在`,
    'error.conversationInfoError': `❌ 對話資訊錯誤`,
    'error.conversationNotFound': `❌ 對話不存在`,
    'error.failed': `❌ **廣告加載失敗**

很抱歉，廣告無法正常播放。

💡 **可能的原因：**
• 網絡連接不穩定
• 廣告提供商暫時不可用
• 瀏覽器不支持

🔄 **建議：**
• 檢查網絡連接
• 稍後再試
• 或使用其他方式獲得額度（邀請朋友）`,
    'error.failed10': `❌ 查詢維護模式狀態失敗。`,
    'error.failed11': `❌ 刷新頭像失敗

`,
    'error.failed12': `❌ 驗證失敗，請稍後再試`,
    'error.failed13': `❌ 啟用維護模式失敗。`,
    'error.failed14': `❌ 關閉維護模式失敗。`,
    'error.failed15': `❌ 獲取廣告狀態失敗`,
    'error.failed16': `❌ 獲取統計數據失敗`,
    'error.failed17': `❌ 創建廣播失敗。`,
    'error.failed18': `❌ 獲取信息失敗`,
    'error.failed19': `❌ 領取獎勵失敗`,
    'error.failed2': `❌ 創建過濾廣播失敗

\\\${error instanceof Error ? error.message : String(error)}`,
    'error.failed20': `❌ 確認失敗`,
    'error.failed21': `❌ 設置失敗`,
    'error.failed22': `❌ 跳過失敗`,
    'error.failed23': `❌ 操作失敗`,
    'error.failed24': `❌ 發送每日報表失敗：\\\${error instanceof Error ? error.message : String(error)}`,
    'error.failed25': `❌ 獲取 VIP 漏斗數據失敗`,
    'error.failed26': `❌ **診斷失敗**

`,
    'error.failed27': `❌ **刷新失敗**

`,
    'error.failed28': `❌ **支付失敗**

`,
    'error.failed29': `❌ 獲取廣告提供商列表失敗`,
    'error.failed3': `❌ 處理廣播隊列失敗：\\\${error instanceof Error ? error.message : String(error)}`,
    'error.failed30': `❌ 獲取官方廣告列表失敗`,
    'error.failed31': `❌ 啟用廣告提供商失敗`,
    'error.failed32': `❌ 停用廣告提供商失敗`,
    'error.failed33': `❌ 啟用官方廣告失敗`,
    'error.failed34': `❌ 停用官方廣告失敗`,
    'error.failed35': `❌ 獲取分析數據失敗`,
    'error.failed36': `❌ 獲取廣告數據失敗`,
    'error.failed37': `❌ 設置優先級失敗`,
    'error.failed38': `❌ 退款失敗：\\\${error instanceof Error ? error.message : String(error)}`,
    'error.failed39': `❌ 操作失敗：\\\${error instanceof Error ? error.message : String(error)}`,
    'error.failed4': `❌ 查詢廣播狀態失敗：\\\${error instanceof Error ? error.message : String(error)}`,
    'error.failed40': `❌ 提交失敗，請稍後再試。`,
    'error.failed41': `❌ 建立對話失敗，請稍後再試。`,
    'error.failed5': `❌ 取消廣播失敗：\\\${error instanceof Error ? error.message : String(error)}`,
    'error.failed6': `❌ 清理廣播失敗：\\\${error instanceof Error ? error.message : String(error)}`,
    'error.failed7': `❌ 重置失敗：\\\${errorMessage}

請稍後再試。`,
    'error.failed8': `❌ 創建廣播失敗，請稍後再試。`,
    'error.failed9': `❌ 刷新對話歷史失敗

`,
    'error.mbti': `❌ 無效的 MBTI 類型`,
    'error.message': `❌ 過濾器格式錯誤

\\\${error instanceof Error ? error.message : String(error)}

`,
    'error.message2': `❌ 此命令在生產環境中不可用。

This command is not available in production.`,
    'error.message3': `❌ 發生錯誤，請稍後再試。

錯誤信息：\\\${error instanceof Error ? error.message : String(error)}`,
    'error.message4': `❌ 很抱歉，你必須年滿 18 歲才能使用本服務。

請成年後再來！`,
    'error.nickname': `❌ 無法獲取 Telegram 暱稱`,
    'error.nickname2': `❌ 暱稱不能包含網址連結

`,
    'error.nickname3': `❌ \\\${validation.error}

請重新輸入暱稱：`,
    'error.quota': `❌ 今日漂流瓶配額已用完（\\\${quotaDisplay}）

💡 獲得更多配額的方式：
`,
    'error.quota2': `❌ 今日對話訊息配額已用完（\\\${usedToday}/\\\${dailyLimit}）

`,
    'error.quota3': `❌ 今日漂流瓶配額已用完（\\\${quotaDisplay}）

`,
    'error.register': `❌ 請先完成註冊流程。

使用 /start 繼續註冊。`,
    'error.register2': `❌ 找不到用戶資料，請先使用 /start 註冊。`,
    'error.register3': `❌ 請先完成註冊流程才能撿漂流瓶。

使用 /start 繼續註冊。`,
    'error.settings': `❌ 最多只能設定 5 個興趣標籤。

請重新輸入或取消編輯：`,
    'error.short': `❌ 無效的語言代碼`,
    'error.short10': `❌ 權限不足`,
    'error.short11': `❌ 稍後再說`,
    'error.short12': `❌ 重新選擇`,
    'error.short13': `❌ 重新輸入`,
    'error.short14': `❌ 關閉`,
    'error.short15': `❌ 未啟用`,
    'error.short2': `❌ 找不到用戶資料`,
    'error.short3': `❌ 未知的教學步驟`,
    'error.short4': `❌ 系統發生錯誤`,
    'error.short5': `❌ 頻道配置錯誤`,
    'error.short6': `❌ 未知操作`,
    'error.short7': `❌ 不正確`,
    'error.short8': `❌ 否`,
    'error.short9': `❌ 發生錯誤`,
    'error.start': `❌ 發生錯誤，請重新開始：/start`,
    'error.stats': `❌ 你沒有權限查看廣告統計`,
    'error.task': `❌ 查看任務中心時系統發生錯誤，請稍後再試。`,
    'error.text': `❌ 計算結果時系統發生錯誤，請稍後再試。

`,
    'error.text10': `❌ 發送者資訊錯誤。`,
    'error.text11': `❌ 你沒有權限查看分析數據`,
    'error.text12': `❌ 發生錯誤，請稍後再試。`,
    'error.text13': `❌ 你沒有權限使用此命令。`,
    'error.text14': `❌ 使用方法錯誤

`,
    'error.text15': `❌ 優先級必須是非負整數`,
    'error.text16': `❌ 時長必須是正整數或`,
    'error.text17': `❌ 處理支付時系統發生錯誤，請聯繫客服。

`,
    'error.text18': `❌ 退款原因至少需要 10 個字，請重新輸入：`,
    'error.text19': `❌ **退款申請已被拒絕**

`,
    'error.text2': `❌ 個人簡介包含不允許的連結。

`,
    'error.text20': `❌ 退款申請超過時限

`,
    'error.text21': `❌ 退款請求不存在或已處理`,
    'error.text22': `❌ 找不到支付記錄。`,
    'error.text23': `❌ 很抱歉，你必須年滿 18 歲才能使用本服務。

`,
    'error.text24': `❌ 發生錯誤，請重新輸入。`,
    'error.text25': `❌ 請認真回答問題

`,
    'error.text3': `❌ 未檢測到你加入頻道，請先加入後再試`,
    'error.text4': `❌ 檢測到你已離開頻道，無法領取獎勵。`,
    'error.text5': `❌ 啟動教學時發生錯誤，請稍後再試。`,
    'error.text6': `❌ 系統發生錯誤，請稍後再試。`,
    'error.text7': `❌ 時長必須是數字（分鐘）`,
    'error.text8': `❌ 發生錯誤，請稍後再試`,
    'error.text9': `❌ 無法獲取維護模式狀態`,
    'error.userNotFound': `❌ 用戶不存在，請先使用 /start 註冊。`,
    'error.userNotFound2': `❌ 用戶不存在，請先註冊`,
    'error.userNotFound3': `❌ 對方用戶不存在。`,
    'error.userNotFound4': `❌ 用戶不存在`,
    'error.userNotFound5': `❌ 用戶不存在：\\\${userId}`,
    'error.userNotFound6': `❌ 用戶不存在或未註冊。`,
    'error.userNotFound7': `❌ 用戶不存在。`,
    'error.vip': `❌ 你沒有權限查看 VIP 數據`,
    'error.vip2': `❌ 你不是 VIP 用戶，無法申請退款。`,
    errorDetails: `錯誤信息：{error}`,
    failed: `失敗: \${broadcast.failedCount}
`,
    failed2: `失敗：\${result.failed} 個

`,
    failed3: `這些廣播將被標記為「失敗」狀態
`,
    failed4: `這些廣播已標記為「失敗」狀態
`,
    generic: `❌ 發生錯誤，請稍後再試。`,
    invalidRequest: `❌ 無效的請求`,
    message: `\${statusEmoji} **\${provider.provider_display_name}**
\${healthEmoji} 健康狀態: \${health.is_healthy ? '良好' : '需要關注'}
📊 完成率: \${stats.completion_rate}%
❌ 錯誤率: \${stats.error_rate}%
📈 總請求: \${stats.total_requests}
✅ 總完成: \${stats.total_completions}
💡 建議: \${health.recommendation}`,
    message2: `錯誤信息：\${error instanceof Error ? error.message : String(error)}`,
    message3: `
錯誤: \${broadcast.errorMessage}`,
    operationFailed: `❌ 操作失敗`,
    processError: `❌ 處理過程中發生錯誤`,
    sessionExpired: `❌ 會話已過期，請重新開始`,
    systemError: `系统错误`,
    systemErrorRetry: `❌ 系統發生錯誤，請稍後再試。`,
    unknownAction: `❌ 未知操作`,
    unknownError: `🎨 UX: 友善的錯誤提示`,
    userNotFound: `用戶不存在`,
    userNotFoundRegister: `⚠️ 用戶不存在，請先使用 /start 註冊。`,
    verificationFailed: `❌ 驗證失敗，請稍後再試`,
  },
  estimate: {
    immediate: `立即發送（約 1-2 秒）`,
    minutes: `約 \${minutes} 分鐘`,
    seconds: `約 \${seconds} 秒`,
  },
  help: {
    ad: `• 觀看廣告：每次 +1 額度（每日最多 20 次）
`,
    ad2: `/ad_performance - 廣告效果報表
`,
    ad3: `• 觀看廣告獲得額度（額度用完時顯示）
`,
    ad4: `• 查看官方廣告獲得永久額度

`,
    ad5: `• 官方廣告：永久額度獎勵
`,
    ad6: `• 無廣告體驗

`,
    admin: `/admin_remove <user_id> - 移除管理員

`,
    admin2: `/admin_add <user_id> - 添加管理員
`,
    admin3: `/admin_list - 查看管理員列表
`,
    admin4: `🔱 **超級管理員功能**

`,
    admin5: `👮 **管理員功能**

`,
    admin6: `**管理員管理**
`,
    appeal: `/admin_reject <id> [備註] - 拒絕申訴

`,
    appeal2: `/admin_approve <id> [備註] - 批准申訴
`,
    appeal3: `/appeal_status - 查詢申訴狀態

`,
    appeal4: `/admin_appeals - 查看待審核申訴
`,
    appeal5: `🛡️ **安全與申訴**
`,
    appeal6: `**申訴審核**
`,
    ban: `/admin_ban <user_id> [hours|permanent] - 封禁用戶
`,
    ban2: `/admin_bans <user_id> - 查看用戶封禁歷史

`,
    ban3: `/admin_unban <user_id> - 解除封禁
`,
    ban4: `/admin_bans - 查看封禁記錄
`,
    ban5: `/appeal - 申訴封禁
`,
    ban6: `• 違規將被封禁

`,
    birthday: `• 今天生日：is_birthday=true

`,
    bottle: `• 完成任務：獲得額外瓶子（使用 /tasks 查看）
`,
    bottle2: `/tasks - 任務中心（完成任務獲得額外瓶子）
`,
    bottle3: `• 每天可以丟出和撿起有限數量的漂流瓶
`,
    bottle4: `• VIP 用戶：每天 30 個瓶子
`,
    bottle5: `• 瓶子在 24 小時內有效

`,
    bottle6: `• 免費用戶：每天 3 個瓶子
`,
    bottle7: `/throw - 丟出漂流瓶
`,
    bottle8: `/catch - 撿起漂流瓶
`,
    bottle9: `🍾 **漂流瓶系統**
`,
    broadcast: `/broadcast_status <id> - 查看廣播詳情
`,
    broadcast2: `/broadcast_process - 手動處理廣播隊列
`,
    broadcast3: `/broadcast_cleanup - 清理卡住的廣播
`,
    broadcast4: `/broadcast_status - 查看廣播列表
`,
    broadcast5: `**廣播監控**
`,
    broadcast6: `**廣播發送**
`,
    cancel: `/broadcast_cancel <id> - 取消廣播

`,
    conversation: `/chats - 我的對話列表

`,
    conversation2: `• 所有對話都是匿名的
`,
    help2: `💡 使用 /help 查看幫助`,
    invite: `• 邀請好友：每人 +1 額度（最多 10/100）
`,
    invite2: `/invite - 邀請好友獲得額度
`,
    mbti: `• 可篩選 MBTI、星座、血型
`,
    mbti2: `/mbti - MBTI 管理
`,
    message: `/maintenance_enable <分鐘> <訊息> - 啟用維護模式
`,
    message2: `/broadcast_non_vip <訊息> - 群發給非 VIP 用戶
`,
    message3: `• 18-25歲女性：gender=female,age=18-25
`,
    message4: `/broadcast_filter <過濾器> <訊息> - 精準廣播
`,
    message5: `/broadcast_vip <訊息> - 群發給 VIP 用戶
`,
    message6: `/maintenance_disable - 關閉維護模式

`,
    message7: `/maintenance_status - 查看維護狀態
`,
    message8: `/broadcast <訊息> - 群發給所有用戶
`,
    profile: `/edit_profile - 編輯個人資料
`,
    profile2: `/profile - 查看個人資料
`,
    profile3: `👤 **個人資料**
`,
    quota: `• 邀請好友可增加配額（最多 10/100）
`,
    quota2: `• 每天 30 個漂流瓶配額
`,
    register: `/start - 開始使用 / 繼續註冊
`,
    report: `/report - 舉報不當內容
`,
    settings: `/settings - 推送設定`,
    settings2: `📖 **幫助與設定**
`,
    stats: `/stats - 我的統計數據

`,
    success: `└ 大幅提升配對成功率
`,
    text: `/maintenance_status - 查看維護狀態`,
    text10: `📖 **XunNi 指令列表**

`,
    text11: `/analytics - 每日運營報表
`,
    text12: `/dev_restart - 完全重置帳號`,
    text13: `📜 **XunNi 遊戲規則**

`,
    text14: `• 只能發送文字和官方 Emoji
`,
    text15: `/dev_info - 系統信息
`,
    text16: `/quota - 查看額度狀態
`,
    text17: `/rules - 查看遊戲規則
`,
    text18: `/block - 封鎖使用者
`,
    text19: `/help - 顯示此列表
`,
    text2: `/refresh_avatar - 刷新頭像緩存
`,
    text20: `• 尊重對方，友善交流

`,
    text21: `🎁 **額度獲取方式**
`,
    text22: `• 不要分享個人聯絡方式
`,
    text23: `🛡️ **安全規則**
`,
    text24: `🎮 **核心功能**
`,
    text25: `/menu - 主選單
`,
    text26: `💬 **匿名聊天**
`,
    text27: `• 禁止騷擾、辱罵他人
`,
    text28: `• 禁止發送不當內容
`,
    text29: `• 解鎖對方清晰頭像
`,
    text3: `• 只發給女性：gender=female
`,
    text30: `• 禁止詐騙、釣魚
`,
    text31: `**用戶管理**
`,
    text32: `**系統維護**
`,
    text33: `**數據分析**
`,
    text34: `**開發工具**
`,
    text4: `• 34 種語言自動翻譯（OpenAI 優先）
`,
    text5: `/profile_card - 查看資料卡片
`,
    text6: `/dev_reset - 重置帳號（測試用）
`,
    text7: `• 只發給男性：gender=male
`,
    text8: `💡 遇到問題？使用 /help 查看指令列表`,
    text9: `• 使用 /quota 查看額度狀態

`,
    throw: `• 🆕 三倍曝光機會（1 次丟瓶 = 3 個對象）
`,
    vip: `• 台灣的VIP：country=TW,vip=true
`,
    vip2: `• 每日免費額度：3 個（VIP：30 個）
`,
    vip3: `/funnel - VIP 轉化漏斗

`,
    vip4: `🎁 **額度與 VIP**
`,
    vip5: `/vip - VIP 訂閱
`,
    vip6: `💎 **VIP 權益**
`,
  },
  history: {
    chatHistory: `💬 **你的聊天記錄**

`,
    continueChatButton: `💬 繼續對話`,
    continueConversation: `💬 繼續對話：/reply
`,
    conversationEnd: `• 最後訊息：{time}
`,
    conversationNotFound: `❌ 找不到標識符 {identifier} 的對話

使用 /history 查看所有對話

🏠 返回主選單：/menu`,
    conversationStart: `• 對話開始：{time}
`,
    conversationTitle: `📨 {identifier} 的對話（{count} 則訊息）
`,
    conversationWith: `💬 **與 {identifier} 的對話**

`,
    daysAgo: `{days} 天前`,
    errorRetry: `❌ 發生錯誤，請稍後再試。`,
    hoursAgo: `{hours} 小時前`,
    justNow: `剛剛`,
    lastMessage: `最後訊息：{preview}
`,
    messageSender: `{sender}：{content}

`,
    messageTime: `📨 {time}
`,
    minutesAgo: `{minutes} 分鐘前`,
    noHistory: `💬 你還沒有任何對話記錄

快去丟瓶子認識新朋友吧！ /throw

🏠 返回主選單：/menu`,
    noMessages: `(無訊息)`,
    partnerMessages: `• 對方發送：{count} 則
`,
    recentMessages: `
📨 **最近對話：**

`,
    returnToMenu: `🏠 返回主選單：/menu`,
    returnToMenuButton: `🏠 返回主選單`,
    stats: `📊 **統計：**
`,
    time: `時間：{time}

`,
    totalMessages: `• 總訊息數：{total} 則
`,
    userMessages: `• 你發送：{count} 則
`,
    viewFull: `💡 使用 /history {identifier} 查看完整對話

`,
    you: `你`,
  },
  invite: {
    inviteeSuccess: `[需要翻译: invite.inviteeSuccess]`,
    selfInviteError: `[需要翻译: invite.selfInviteError]`,
    upgradePrompt: `[需要翻译: invite.upgradePrompt]`,
    userType: `{type}`,
  },
  maintenance: {
    allFeaturesAvailable: `現在可以正常使用所有功能了。`,
    completed: `✅ 系統維護已完成`,
    completingSoon: `即將完成`,
    correctFormat: `**正確格式：**
/maintenance_enable <時長(分鐘)> [維護訊息]

`,
    defaultMessage: `系統正在進行維護，暫時無法使用。`,
    disableFailed: `❌ 關閉維護模式失敗。`,
    disableSuccess: `✅ 維護模式已關閉

恢復通知已廣播給所有用戶。`,
    durationMax: `維護時長不能超過 24 小時（1440 分鐘）`,
    durationMin: `維護時長最少 5 分鐘`,
    durationMustBeNumber: `❌ 時長必須是數字（分鐘）`,
    enableFailed: `❌ 啟用維護模式失敗。`,
    enableSuccess: `✅ 維護模式已啟用

時長：{duration} 分鐘
開始：{startTime}
結束：{endTime}

維護通知已廣播給所有用戶。
一般用戶將無法使用服務，只有管理員可以登入。`,
    enabledBy: `啟用者：{user}
`,
    estimatedDuration: `預計時長：{duration} 分鐘
`,
    estimatedEnd: `預計完成：{time}
`,
    example: `**示例：**
/maintenance_enable 60 系統升級維護`,
    notificationTitle: `🛠️ 系統維護通知`,
    remainingHours: `約 {hours} 小時 {minutes} 分鐘`,
    remainingMinutes: `約 {minutes} 分鐘`,
    remainingTime: `剩餘時間：{time}
`,
    serviceRestored: `服務已恢復正常，感謝您的耐心等待！`,
    startTime: `開始時間：{time}
`,
    status: `狀態：{status}
`,
    statusActive: `✅ 維護中`,
    statusFailed: `❌ 無法獲取維護模式狀態`,
    statusInactive: `❌ 未啟用`,
    statusTitle: `🛠️ 維護模式狀態`,
    thanks: `感謝您的耐心等待！`,
    unknown: `未知`,
    usageError: `❌ 使用方法錯誤

`,
  },
  mbtiTest: {
    afterRegistration: `💡 完成註冊後，你可以：
`,
    answerRecorded: `✅ 已記錄`,
    completion: `🎉 {testTitle}完成！

`,
    fullAccuracy: `結果更準確`,
    fullQuestions: `36 題`,
    fullTest: `MBTI 完整測驗`,
    fullTestInfo: `

💡 這是完整測驗（{questions}），結果更準確。
完成註冊後，可使用 /mbti 重新測驗。

`,
    fullTestTitle: `完整測驗`,
    manualModify: `• 手動修改你的 MBTI 類型`,
    moreDetailedTest: `• 進行更詳細的測驗
`,
    note: `⚠️ 注意：這是 {testInfo}{testTitle}，{accuracy}。

`,
    questionOrderError: `⚠️ 問題順序錯誤`,
    questions12: `12 題`,
    questions36: `36 題`,
    quickAccuracy: `結果僅供參考`,
    quickQuestions: `12 題`,
    quickTest: `MBTI 快速測驗`,
    quickTestInfo: `

💡 這是快速測驗（{questions}），結果僅供參考。
完成註冊後，可使用 /mbti 重新測驗。

`,
    quickTestTitle: `快速測驗`,
    yourMbtiType: `你的 MBTI 類型是：**{type}**

`,
  },
  menu: {
    bottle: `• 好友丟出第一個瓶子後激活
`,
    buttonCatch: `🎣 撿起漂流瓶`,
    buttonChats: `💬 我的對話`,
    buttonHelp: `❓ 幫助`,
    buttonInvite: `👥 邀請好友`,
    buttonProfile: `👤 個人資料`,
    buttonSettings: `⚙️ 設定`,
    buttonStats: `📊 統計`,
    buttonThrow: `🌊 丟出漂流瓶`,
    buttonVip: `💎 VIP`,
    invite: `🎁 **邀請好友**

`,
    invite2: `📋 你的邀請碼：{inviteCode}`,
    invite3: `📤 分享邀請碼`,
    levelFree: `🆓 免費會員`,
    levelVip: `💎 VIP 會員`,
    message: `https://t.me/share/url?url=https://t.me/\${botUsername}?start=invite_\${inviteCode}&text=來 XunNi 一起丟漂流瓶吧！🍾 使用我的邀請碼加入，我們都能獲得更多配額！`,
    message2: `https://t.me/share/url?url=https://t.me/\${botUsername}?start=invite_\${inviteCode}&text=來 XunNi 一起丟漂流`,
    notRegistered: `未注册`,
    notSet: `未设定`,
    quota: `• 你們都獲得每日配額 +1

`,
    register: `• 好友使用你的邀請碼註冊
`,
    selectFeature: `請選擇功能：`,
    settings: `• MBTI：\${user.mbti_result}
`,
    settings2: `• 星座：\${user.zodiac_sign}

`,
    settings3: `未設定`,
    settings4: `未設定`,
    short: `免費會員`,
    stats: `📊 查看邀請統計：/profile`,
    stats2: `📊 查看邀請統計`,
    task: `🎯 **下一個任務**
⏳ \${nextTask.name} (+\${nextTask.reward_amount} 瓶子)
💡 \${nextTask.description}

`,
    text: `🏠 **主選單** \${vipBadge}

`,
    text2: `👋 嗨，\${user.nickname}！

`,
    text3: `💡 點擊下方按鈕分享給好友：
`,
    text4: `💡 選擇你想要的功能：`,
    text5: `📊 你的狀態：
`,
    title: `🏠 **主選單**`,
    userNotFound: `用戶不存在`,
    vip: `• 等級：\${isVip ? 'VIP 會員 💎' : '免費會員'}
`,
    vip2: `VIP 會員 💎`,
    yourStatus: `你的狀態`,
  },
  messageForward: {
    dailyQuota: `📊 今日已發送：{used}/{limit} 則`,
    messageSent: `✅ 訊息已發送給 {identifier}

`,
    removeLinks: `[需要从 zh-TW.ts 获取翻译]`,
    replyHint: `[需要从 zh-TW.ts 获取翻译]`,
    upgradeVip: `[需要从 zh-TW.ts 获取翻译]`,
    urlNotAllowed: `[需要从 zh-TW.ts 获取翻译]`,
    urlNotAllowedDesc: `[需要从 zh-TW.ts 获取翻译]`,
    vipDailyLimit: `[需要从 zh-TW.ts 获取翻译]`,
  },
  nickname: {
    cannotGetNickname: `❌ 無法獲取 Telegram 暱稱`,
    customHint: `⚠️ 注意：
• 暱稱長度限制 36 個字
• 對方最多顯示 18 個字
• 請勿使用暱稱發送廣告`,
    customPrompt: `✏️ 請輸入你的暱稱：

`,
    genderHint: `⚠️ 注意：性別設定後無法修改，請謹慎選擇！`,
    genderSelection: `很好！你的暱稱是：{nickname}

現在請選擇你的性別：

`,
    nicknameSet: `✅ 暱稱已設定`,
    userNotFound: `❌ 用戶不存在`,
  },
  officialAd: {
    adNotFound: `❌ 廣告不存在`,
    allAdsViewed: `✅ 你已經看過所有官方廣告了`,
    alreadyViewed: `你已經看過此廣告`,
    buttonClaimReward: `領取獎勵`,
    buttonJoinGroup: `加入群組`,
    buttonSubscribeChannel: `訂閱頻道`,
    buttonVerifyAndClaim: `✅ 驗證並領取`,
    buttonViewDetails: `查看詳情`,
    buttonVisitLink: `訪問鏈接`,
    cannotClaim: `❌ 無法領取此廣告`,
    claimReward: `✅ 領取獎勵`,
    claimRewardButton: `✅ 領取獎勵`,
    claimRewardSuccess: `✅ 領取獎勵成功！獲得 +{quota} 個永久額度！`,
    errorRetry: `❌ 發生錯誤，請稍後再試`,
    moreAdsAvailable: `💡 還有更多官方廣告可以觀看！`,
    nextAd: `➡️ 下一個廣告`,
    noAdsAvailable: `❌ 暫無可用的廣告`,
    noVerificationRequired: `❌ 此廣告不需要驗證`,
    requiresVerification: `

✅ 需要驗證：加入群組/頻道後點擊「驗證」按鈕`,
    reward: `🎁 獎勵：+{quota} 個永久額度`,
    statsAdNotFound: `❌ 廣告不存在`,
    statsClicks: `• 點擊次數: {count}
`,
    statsCtr: `• 點擊率 (CTR): {rate}%
`,
    statsHint: `💡 使用 /ad_stats {id} 查看詳細統計`,
    statsNoAds: `📊 暫無官方廣告`,
    statsNoPermission: `❌ 你沒有權限查看廣告統計`,
    statsRemainingViews: `• 剩餘展示: {remaining}/{total}
`,
    statsRewardGranted: `• 獎勵發放: {count}
`,
    statsRewardRate: `• 獎勵率: {rate}%
`,
    statsRewardSummary: `• 獎勵：{rewards}

`,
    statsSummary: `• 展示：{views} | 點擊：{clicks} ({ctr}%)
`,
    statsTitle: `📊 **官方廣告統計**

`,
    statsVerificationCount: `• 驗證次數: {count}
`,
    statsVerificationRate: `• 驗證率: {rate}%
`,
    statsViews: `• 展示次數: {count}
`,
    statusDisabled: `停用`,
    statusEnabled: `啟用`,
    unlimited: `無限`,
    userNotFound: `❌ 用戶不存在`,
    verifySuccess: `✅ 驗證成功！獲得 +{quota} 個永久額度！`,
  },
  onboarding: {
    age: `• 年齡：\${updatedUser.age} 歲
`,
    age2: `你的年齡：\${age} 歲
`,
    age3: `年齡：\${age} 歲
`,
    ageRestriction: `❌ 很抱歉，你必須年滿 18 歲才能使用本服務。

`,
    agreeTerms: `點擊下方按鈕表示你已閱讀並同意上述條款。`,
    'antiFraud.confirm_button': `[需要翻译: onboarding.antiFraud.confirm_button]`,
    'antiFraud.learn_button': `[需要翻译: onboarding.antiFraud.learn_button]`,
    'antiFraud.question1': `[需要翻译: onboarding.antiFraud.question1]`,
    'antiFraud.question2': `[需要翻译: onboarding.antiFraud.question2]`,
    'antiFraud.question3': `[需要翻译: onboarding.antiFraud.question3]`,
    antiFraudConfirm: `請確認：`,
    antiFraudFinalStep: `🛡️ 最後一步：反詐騙安全確認

`,
    antiFraudLearn: `📚 我想了解更多安全知識`,
    antiFraudPassed: `✅ 反詐騙測驗通過！

`,
    antiFraudQuestion1: `1. 你了解網路交友的安全風險嗎？
`,
    antiFraudQuestion2: `2. 你會保護好自己的個人資訊嗎？
`,
    antiFraudQuestion3: `3. 遇到可疑訊息時，你會提高警覺嗎？

`,
    antiFraudQuestions: `為了保護所有使用者的安全，請確認你了解以下事項：

`,
    antiFraudYes: `✅ 是的，我了解並會注意安全`,
    back: `⬅️ 返回`,
    birthday: `如果你認為這是錯誤，請檢查你的生日格式是否正確（YYYY-MM-DD）。`,
    birthday2: `請重新輸入你的生日（格式：YYYY-MM-DD）：

`,
    birthday3: `請輸入你的生日（格式：YYYY-MM-DD）：

`,
    birthday4: `生日：\${birthday}
`,
    birthdayCheck: `如果你認為這是錯誤，請檢查你的生日格式是否正確（YYYY-MM-DD）。`,
    birthdayError: `❌ {error}

`,
    birthdayFormatError: `❌ 生日格式錯誤

請重新輸入（格式：YYYY-MM-DD）：`,
    birthdayRetry: `請重新輸入生日（格式：YYYY-MM-DD）：`,
    birthdayWarning: `⚠️ 生日設定後無法修改，請確認無誤！`,
    bloodType: `🩸 **請選擇你的血型**

`,
    'bloodType.select': `[需要翻译: onboarding.bloodType.select]`,
    complete: `請輸入「是」完成測驗：`,
    confirm: `為了保護所有使用者的安全，請確認你了解網路交友的風險。

`,
    confirm2: `🛡️ 現在進行反詐騙安全確認

`,
    confirm3: `了解後，請確認：`,
    confirmBirthday: `⚠️ 請確認你的生日資訊：

`,
    customNickname: `[需要翻译: onboarding.customNickname]`,
    enterYes: `請輸入「是」完成測驗：`,
    errorRetry: `❌ 發生錯誤，請重新輸入。`,
    gender: `• 性別：\${updatedUser.gender}
`,
    'gender.female': `女`,
    'gender.male': `男`,
    gender2: `• 性別：\${updatedUser.gender ===`,
    gender3: `請選擇你的性別：

`,
    genderFemale: `👩 女性`,
    genderMale: `👨 男性`,
    genderWarning: `⚠️ 注意：性別設定後無法修改，請謹慎選擇！`,
    help: `這將幫助我們為你找到更合適的聊天對象～

`,
    iHaveRead: `✅ 我已閱讀並同意`,
    languageSelection: `🌐 **Kies taal**

Selecteer uw voorkeurstaal：`,
    lastStep: `最後一步：請閱讀並同意我們的服務條款

`,
    legalDocuments: `📋 Legal documents are provided in English only.

`,
    mbti: `請選擇你的 MBTI 類型：

`,
    mbti2: `✍️ 我已經知道我的 MBTI`,
    message: `2. 🚨 識別詐騙訊息
`,
    message2: `• 警惕索要金錢的訊息
`,
    nickname: `• 暱稱：\${updatedUser.nickname}
`,
    nickname2: `很好！你的暱稱是：\${nickname}

`,
    nicknameError: `❌ {error}

請重新輸入暱稱：`,
    nicknameGood: `很好！你的暱稱是：{nickname}

`,
    notCompleted: `[需要翻译: onboarding.notCompleted]`,
    nowSelectGender: `現在請選擇你的性別：

`,
    otherUserNotFound: `❌ 對方用戶不存在。`,
    pleaseAnswer: `❌ 請認真回答問題

`,
    pleaseComeBack: `請成年後再來！

`,
    privacyPolicy: `📋 隱私權政策
`,
    profile: `• 隱私權政策：我們如何保護你的個人資料
`,
    profile2: `你的個人資料：
`,
    retry: `❌ 重新輸入`,
    senderInfoError: `❌ 發送者資訊錯誤。`,
    settings: `💡 提示：你可以隨時使用 /mbti 指令來設定或測驗你的 MBTI 類型。

`,
    settings2: `🧠 現在讓我們設定你的 MBTI 性格類型！

`,
    settings3: `好的，你可以稍後再設定 MBTI。

`,
    settings4: `如果不確定，可以先進行測驗或稍後再設定。`,
    settings5: `🎉 恭喜！你已經完成所有設定！

`,
    settings6: `• 生日設定後無法修改
`,
    settings7: `你想要如何設定？`,
    short: `⏭️ 稍後再說`,
    start: `在開始使用前，請閱讀並同意我們的服務條款：

`,
    start2: `現在你可以開始使用 XunNi 了！`,
    startRegistration: `[需要翻译: onboarding.startRegistration]`,
    stats: `📊 統計`,
    stepAntiFraud: `🛡️ 請點擊上方按鈕確認反詐騙安全事項`,
    stepBirthday: `📅 請輸入你的生日（格式：YYYY-MM-DD，例如：1995-06-15）`,
    stepDefault: `請按照提示完成註冊`,
    stepGender: `👤 請點擊上方按鈕選擇你的性別`,
    stepLanguageSelection: `🌍 請點擊上方按鈕選擇你的語言`,
    stepMbti: `🧠 請點擊上方按鈕選擇 MBTI 設定方式`,
    stepNickname: `✏️ 請輸入你的暱稱`,
    stepTerms: `📜 請點擊上方按鈕同意服務條款`,
    'terms.agree_button': `[需要翻译: onboarding.terms.agree_button]`,
    'terms.english_only_note': `[需要翻译: onboarding.terms.english_only_note]`,
    'terms.privacy_policy_button': `[需要翻译: onboarding.terms.privacy_policy_button]`,
    'terms.terms_of_service_button': `[需要翻译: onboarding.terms.terms_of_service_button]`,
    termsOfService: `📋 使用者條款

`,
    text: `confirm_birthday_\${birthday}`,
    text10: `例如：1995-06-15

`,
    text11: `🛡️ 網路交友安全小貼士

`,
    text12: `📋 最後一步：服務條款

`,
    text13: `• 第一次見面選擇公共場所
`,
    text14: `1. 🔒 保護個人資訊
`,
    text15: `• 不要分享財務資訊

`,
    text16: `• 不要點擊可疑連結

`,
    text17: `• 告訴朋友你的行程

`,
    text18: `3. 🤝 安全交友
`,
    text19: `📋 使用者條款

`,
    text2: `💡 你可以隨時使用 /mbti 指令重新測驗或修改。`,
    text20: `請成年後再來！

`,
    text21: `📋 隱私權政策
`,
    text3: `gender_confirm_\${gender}`,
    text4: `最後一步：請閱讀並同意我們的服務條款

`,
    text5: `📝 進行快速測驗（12 題，僅供參考）`,
    text6: `• 使用者條款：使用本服務的規範

`,
    text7: `點擊下方按鈕表示你已閱讀並同意上述條款。`,
    text8: `• 不要輕易透露真實姓名、地址、電話
`,
    text9: `• 必須年滿 18 歲才能使用本服務`,
    understandRisks: `為了保護所有使用者的安全，請確認你了解網路交友的風險。

`,
    viewPrivacyPolicy: `📋 View Privacy Policy`,
    viewTermsOfService: `📋 View Terms of Service`,
    vip: `💡 填寫血型可用於未來的血型配對功能（VIP 專屬）

`,
    welcome: `[需要翻译: onboarding.welcome]`,
    yourAge: `你的年齡：{age} 歲
`,
    zodiac: `• 星座：\${updatedUser.zodiac_sign}
`,
    zodiac2: `星座：\${zodiacSign}

`,
  },
  profile: {
    activatedInvites: `✅ 已激活邀請：{successfulInvites} / {inviteLimit} 人
`,
    age: `🎂 年齡：\${age}
`,
    anonymousUser: `匿名用戶`,
    bloodType: `🩸 血型：\${bloodType}
`,
    bottle: `: permanentQuota} 個瓶子

`,
    cardAge: `{age} 歲`,
    cardBio: `📝 簡介：
{bio}

`,
    cardFooter: `💡 這是你在對話中展示給對方的資料卡片

`,
    cardGenderFemale: `♀️ 女`,
    cardGenderMale: `♂️ 男`,
    cardInterests: `🏷️ 興趣：{interests}

`,
    cardLanguage: `🌍 語言：{language}

`,
    cardMbti: `🧠 MBTI：{mbti}
`,
    cardSeparator: `━━━━━━━━━━━━━━━━
`,
    cardTitle: `┌─────────────────────────┐
│   📇 個人資料卡片       │
└─────────────────────────┘

`,
    cardZodiac: `⭐ 星座：{zodiac}
`,
    completeOnboarding: `⚠️ 請先完成註冊流程。

使用 /start 繼續註冊。`,
    conversation: `💡 這是你在對話中展示給對方的資料卡片

`,
    editProfile: `📝 編輯資料`,
    gender: `👤 性別：\${gender}
`,
    hints: `💡 提示：
`,
    invite: `⏳ 待激活邀請：\${inviteStats.pending} 人
`,
    invite2: `🎁 **邀請資訊**

`,
    inviteCodeLabel: `📋 你的邀請碼：\`{inviteCode}\`
`,
    manual: `手動設定`,
    mbti: `• 使用 /mbti 重新測驗或修改 MBTI
`,
    mbtiWithSource: `🧠 MBTI：{mbti}{source}
`,
    message: `https://t.me/share/url?url=https://t.me/\${botUsername}?start=invite_\${inviteCode}&text=來 XunNi 一起丟漂流瓶吧！🍾 使用我的邀請碼：\${inviteCode}`,
    message2: `\${!user.is_vip && successfulInvites >= inviteLimit ? '⚠️ 已達免費用戶邀請上限，升級 VIP 可解鎖 100 人上限！' : ''}

`,
    message3: `🌍 語言：\${user.language_pref}

`,
    message4: `🌍 語言：\${user.language_pref}
`,
    message5: `📈 轉化率：\${inviteStats.conversionRate}%
`,
    message6: `\${gender} • \${age} 歲 • \${city}

`,
    message7: `https://t.me/share/url?url=https://t.me/\${botUsername}?start=invite_\${inviteCode}&text=來 XunNi 一起丟漂流`,
    mysterious: `這個人很神秘，什麼都沒有留下～`,
    nickname: `📛 暱稱：\${displayNickname}
`,
    notSet: `未設定`,
    profile: `│   📇 個人資料卡片       │
`,
    profile2: `👤 **個人資料**

`,
    quota: `💡 完成任務可獲得當日額外配額（使用 /tasks 查看）
`,
    quota2: `📦 當前每日配額：\${taskBonus > 0 ?`,
    quotaBottles: `{taskBonus} 個瓶子`,
    quotaTotal: `📦 當前每日配額：{quota}

`,
    returnToMenu: `🏠 返回主選單：/menu`,
    separator: `━━━━━━━━━━━━━━━━

`,
    settings: `未設定`,
    settings2: `未設定`,
    settings3: `未設定`,
    settings4: `未設定`,
    settings5: `未設定`,
    settings6: `未設定`,
    settings7: `未設定`,
    settings8: `未設定`,
    shareInviteCode: `📤 分享邀請碼`,
    short: `📝 編輯資料`,
    short2: `免費會員`,
    stats: `• 使用 /stats 查看統計數據

`,
    success: `💡 每成功邀請 1 人，每日配額永久 +1
`,
    systemError: `❌ 系統發生錯誤，請稍後再試。`,
    test: `測驗結果`,
    text: `• 使用 /profile_card 查看完整資料卡片
`,
    text2: `🏷️ 興趣：\${interests}

`,
    text3: `💎 會員：\${vipStatus}

`,
    text4: `📝 簡介：
\${bio}

`,
    text5: `這個人很神秘，什麼都沒有留下～`,
    userNotFound: `⚠️ 用戶不存在，請先使用 /start 註冊。`,
    vip: `VIP 會員（到期：\${new Date(user.vip_expire_at).toLocaleDateString('zh-TW')}）`,
    vip2: `• 使用 /vip 升級 VIP 會員
`,
    vipUpgrade: `• 使用 /vip 升級 VIP 會員
`,
    zodiac: `⭐ 星座：\${zodiac}
`,
  },
  refreshAvatar: {
    failed: `❌ 刷新頭像失敗

請稍後再試，或聯繫管理員。`,
    processing: `🔄 正在刷新頭像...

這可能需要幾秒鐘時間。`,
    success: `✅ **頭像已更新！**

您的頭像緩存已刷新，下次查看對話歷史時將顯示最新頭像。

💡 **提示：**
• 頭像會自動每 7 天更新一次
• 如果您更換了 Telegram 頭像，系統會自動檢測
• 您也可以隨時使用此命令手動刷新`,
    userNotFound: `❌ 用戶不存在，請先註冊`,
  },
  refreshConversations: {
    clickButtonHint: `💡 **提示**：請點擊上方的按鈕來開始使用`,
    commandHelp: `• /help - 查看幫助`,
    commandMenu: `• /menu - 主選單`,
    commandTasks: `• /tasks - 查看任務中心`,
    failed: `❌ 刷新對話歷史失敗

請稍後再試，或聯繫管理員。`,
    noHistory: `💡 **沒有找到對話歷史**

您還沒有任何對話記錄。

使用 /throw 丟出漂流瓶開始聊天吧！`,
    partialSuccess: `⚠️ **對話歷史部分更新**

成功刷新：{updated} 個
失敗：{failed} 個

部分對話歷史可能未能更新，請稍後再試。`,
    processing: `🔄 正在刷新所有對話歷史...

這可能需要一些時間，請稍候。`,
    success: `✅ **對話歷史已更新！**

成功刷新 {updated} 個對話的歷史帖子。

💡 **提示：**
• VIP 用戶可以看到清晰的對方頭像
• 免費用戶看到的是模糊頭像
• 升級 VIP 後會自動刷新歷史帖子`,
    userNotFound: `❌ 用戶不存在，請先註冊`,
  },
  report: {
    blockHint: `• 長按對方訊息回覆 /block 可封鎖此使用者
`,
    cancel: `❌ 取消`,
    cancelled: `已取消`,
    cannotIdentify: `⚠️ 無法識別對話對象

`,
    catchHint: `• 使用 /catch 撿新的漂流瓶`,
    completeOnboarding: `⚠️ 請先完成註冊流程。

使用 /start 繼續註冊。`,
    conversationInfoError: `⚠️ 對話資訊錯誤。`,
    conversationInfoError2: `⚠️ 對話資訊錯誤`,
    conversationNotExists: `⚠️ 對話不存在`,
    conversationNotFound: `⚠️ 找不到此對話

對話可能已結束或不存在。`,
    ensureReply: `請確保回覆的是對方發送的訊息（帶有 # 標識符）。`,
    hint: `💡 這樣可以準確指定要舉報的對象。`,
    multipleReports: `多次被舉報 / Multiple reports`,
    reasonHarassment: `😡 騷擾 / 辱罵`,
    reasonNsfw: `🔞 色情內容`,
    reasonOther: `⚠️ 其他違規`,
    reasonScam: `💰 詐騙 / 釣魚`,
    reasonSpam: `📢 垃圾廣告`,
    replyRequired: `⚠️ 請長按你要舉報的訊息後回覆指令

`,
    selectReason: `請選擇舉報原因：`,
    sessionExpired: `⚠️ 會話已過期，請重新操作`,
    step1: `1️⃣ 長按對方的訊息
`,
    step2: `2️⃣ 選擇「回覆」
`,
    step3: `3️⃣ 輸入 /report

`,
    steps: `**操作步驟：**
`,
    submitted: `✅ **舉報已提交** (#{identifier})

`,
    systemError: `❌ 系統發生錯誤`,
    thanks: `感謝你的舉報，我們會盡快審核。

`,
    tips: `💡 提示：
`,
    title: `🚨 **舉報不當內容** (#{identifier})

`,
    userNotFound: `⚠️ 用戶不存在，請先使用 /start 註冊。`,
  },
  risk: {
    containsSensitiveWords: `包含敏感詞彙`,
  },
  router: {
    replyPrompt: `💬 回覆`,
    suggestCatch: `❓ 要撿漂流瓶？

使用 /catch 撿起漂流瓶

💡 **常用命令**：
• /throw - 丟出漂流瓶
• /catch - 撿起漂流瓶
• /menu - 主選單
• /tasks - 任務中心`,
    suggestMenu: `❓ 找不到此命令

💡 **常用命令**：
• /throw - 丟出漂流瓶
• /catch - 撿起漂流瓶
• /menu - 主選單
• /tasks - 任務中心`,
    suggestThrow: `❓ 要丟漂流瓶？

請長按上一則訊息，或本訊息，
選單上選擇「回覆」後，
輸入要發送的漂流瓶內容

💡 **常用命令**：
• /throw - 丟出漂流瓶
• /catch - 撿起漂流瓶
• /menu - 主選單
• /tasks - 任務中心

#THROW`,
    throwPrompt: `📝 請輸入你的漂流瓶內容：`,
  },
  session: {
    timeoutCatchBottle: `⏰ 撿瓶流程已超時

請使用 /catch 重新開始。`,
    timeoutConversation: `⏰ 對話已超時

對方可能已離開。使用 /catch 撿新的瓶子吧！`,
    timeoutEditProfile: `⏰ 編輯資料流程已超時

請重新開始編輯。`,
    timeoutOnboarding: `⏰ 註冊流程已超時

請使用 /start 重新開始註冊。`,
    timeoutThrowBottle: `⏰ 丟瓶流程已超時

請使用 /throw 重新開始。`,
    typeCatchBottle: `撿瓶流程`,
    typeConversation: `對話`,
    typeEditProfile: `編輯資料`,
    typeOnboarding: `註冊流程`,
    typeThrowBottle: `丟瓶流程`,
  },
  settings: {
    back: `返回`,
    changeLanguage: `🌐 Taal wijzigen`,
    languageLabel: `🌐 Taal：{language}`,
    languageUpdated: `✅ Taal bijgewerkt naar {language}`,
    currentSettings: `⚙️ **當前設定**`,
    message: `🌐 **選擇語言 / Choose Language**

請選擇你的偏好語言：`,
    returnToMenu: `[需要翻译: settings.returnToMenu]`,
    selectOption: `[需要翻译: settings.selectOption]`,
    settings: `💡 選擇你想要修改的設定：`,
    settings2: `⚙️ **設定**

`,
    settings3: `🏠 返回設定`,
    settings4: `當前設定：
`,
    text: `• 語言：\${languageName} 🇹🇼

`,
    title: `🏠 **主選單**`,
  },
  stats: {
    activeUsers: `• 昨日活躍：{active}

`,
    age: `🎂 **年齡**：\${age} 歲
`,
    avgMatches: `• 平均每次配對：\${avg} 個對象
`,
    bottle: `
💎 **VIP 三倍瓶子統計**（近 30 天）
`,
    bottle2: `🍾 **漂流瓶**
`,
    bottle3: `🎈 漂流瓶統計
`,
    bottles: `🍾 **漂流瓶**
`,
    bottlesCaught: `• 撿到：\${count} 個
`,
    bottlesThrown: `• 丟出：\${count} 個
`,
    catch: `• 昨日被撿：\${stats.caughtBottles}

`,
    catch2: `• 撿到：\${stats.bottlesCaught} 個
`,
    caught: `• 昨日被撿：{caught}

`,
    conversation: `• 活躍對話：\${stats.activeConversations}
`,
    conversation2: `• 總對話數：\${stats.totalConversations}
`,
    conversation3: `• 總對話數：\${stats.totalConversations}`,
    conversation4: `💬 **對話**
`,
    conversation5: `💬 對話統計
`,
    conversations: `💬 **對話**
`,
    conversationsActive: `• 活躍對話：\${count}
`,
    conversationsTotal: `• 總對話數：\${count}
`,
    date: `日期：{date}

`,
    dateFormatError: `日期格式錯誤，應為 YYYY-MM-DD`,
    match: `🎯 **匹配**
`,
    matchRate: `• 匹配成功率：\${rate}%
`,
    matchRateValue: `• 配對率：\${rate}%
`,
    matchedSlots: `• 成功配對：\${count}
`,
    mbti: `🧠 **MBTI**：\${mbti}
`,
    message: `• 到期時間：\${new Date(user.vip_expire_at!).toLocaleDateString('zh-TW')}
`,
    message10: `• 總訊息數：\${stats.totalMessages}`,
    message2: `\${used}/\${permanentQuota}+\${taskBonus} (剩餘 \${remaining})`,
    message3: `報告生成時間：\${new Date().toLocaleString('zh-TW')}`,
    message4: `\${used}/\${permanentQuota} (剩餘 \${remaining})`,
    message5: `• 總訊息數：\${stats.totalMessages}

`,
    message6: `• 昨日新增訊息：\${stats.newMessages}

`,
    message7: `• 總配對槽位：\${vipStats.totalSlots}
`,
    message8: `• 平均回覆率：\${stats.replyRate}%

`,
    message9: `• 昨日活躍：\${stats.activeUsers}

`,
    messages: `💬 對話統計`,
    messagesTotal: `• 總訊息數：\${count}
`,
    new: `• 昨日新增：{new}`,
    newMessages: `• 昨日新增訊息：{new}

`,
    newUsers: `• 昨日新增：{new}`,
    newVip: `• 昨日新增：{new}

`,
    notSet: `未設定`,
    quota: `• 今日配額：\${stats.todayQuota.display}

`,
    register: `📅 **註冊時間**：\${new Date(user.created_at).toLocaleDateString('zh-TW')}
`,
    register2: `• 總註冊數：\${stats.totalUsers}`,
    registerTime: `📅 **註冊時間**：\${date}
`,
    replyRate: `• 平均回覆率：\${rate}%
`,
    reportTime: `報告生成時間：{time}`,
    separator: `---
`,
    settings: `🧠 **MBTI**：\${user.mbti_result}

`,
    settings2: `未設定`,
    short: `免費會員`,
    statDateEmpty: `統計日期不能為空`,
    stats: `📊 **我的統計數據**

`,
    stats2: `💎 VIP 統計
`,
    stats3: `👥 用戶統計
`,
    stats4: `統計日期不能為空`,
    success: `• 成功配對：\${vipStats.matchedSlots}
`,
    success2: `• 匹配成功率：\${stats.matchRate}%
`,
    text: `• 平均每次配對：\${avgMatches} 個對象
`,
    text10: `🎯 **匹配**
`,
    text2: `• 昨日新增：\${stats.newBottles}
`,
    text3: `• 總數：\${stats.totalBottles}`,
    text4: `• 昨日新增：\${stats.newUsers}
`,
    text5: `• 昨日新增：\${stats.newVip}

`,
    text6: `• 配對率：\${matchRate}%
`,
    text7: `📊 XunNi Bot 每日數據報告
`,
    text8: `日期格式錯誤，應為 YYYY-MM-DD`,
    text9: `日期：\${dateStr}

`,
    throw: `• 丟出：\${stats.bottlesThrown} 個
`,
    throw2: `• 丟出次數：\${vipStats.throws}
`,
    throws: `• 丟出次數：\${count}
`,
    timeLeftDaysHours: `\${days} 天 \${hours} 小時`,
    timeLeftHours: `\${hours} 小時`,
    title: `📊 **我的統計數據**

`,
    todayQuota: `• 今日配額：\${display}

`,
    total: `• 總數：{total}`,
    totalConversations: `• 總對話數：{total}`,
    totalMessages: `• 總訊息數：{total}`,
    totalSlots: `• 總配對槽位：\${count}
`,
    totalUsers: `• 總註冊數：{total}`,
    totalVip: `• 總 VIP 數：{total}`,
    totalWithDiff: `• 總數：{total} ({diff})`,
    users: `👥 用戶統計`,
    vip: `⭐ **VIP 狀態**
`,
    vip2: `⭐ **VIP 狀態**
`,
    vip3: `VIP 會員 💎`,
    vipAvgMatches: `• 平均每次配對：{avg} 個對象`,
    vipExpire: `• 到期時間：\${date}
`,
    vipFree: `免費會員`,
    vipMatchRate: `• 配對率：{rate}%`,
    vipMatchedSlots: `• 成功配對：{count}`,
    vipMember: `VIP 會員 💎`,
    vipThrows: `• 丟出次數：{count}`,
    vipTotalSlots: `• 總配對槽位：{count}`,
    vipTriple: `💎 **VIP 三倍瓶子統計**（近 \${days} 天）`,
    vipTripleTitle: `💎 **VIP 三倍瓶子統計**（近 {days} 天）`,
    zodiac: `🔮 **星座**：\${zodiac}
`,
  },
  status: {
    cancelled: `已取消`,
    completed: `已完成`,
    failed: `失敗`,
    pending: `等待中`,
    sending: `發送中`,
  },
  subscription: {
    downgradedToFree: `你的帳號已恢復為免費會員。`,
    expired: `😢 **VIP 訂閱已到期**`,
    expiredDate: `你的 VIP 訂閱已於 \${date} 到期。`,
    renewVipHint: `💡 隨時可以重新訂閱 VIP：/vip`,
    thankYou: `感謝你的支持！❤️`,
  },
  success: {
    ad: `✅ 你已經看過所有官方廣告了！`,
    ad2: `✅ 已啟用廣告提供商：\${providerName}

`,
    ad3: `✅ 已停用廣告提供商：\${providerName}

`,
    ad4: `✅ 已啟用官方廣告 #\${adId}

`,
    ad5: `✅ 已停用官方廣告 #\${adId}

`,
    ad6: `✅ 已設置廣告提供商優先級

`,
    ad7: `✅ 今日廣告已達上限`,
    appeal: `✅ 申訴 \${appealId} 已批准，用戶已解封`,
    appeal2: `✅ 申訴 \${appealId} 已拒絕`,
    appeal3: `✅ 目前沒有待審核的申訴`,
    birthday: `✅ 生日已保存`,
    bloodType: `✅ 血型已更新為 \${getBloodTypeDisplay(bloodType as any)}`,
    bloodType2: `✅ 血型已清除`,
    bottle: `✅ 獎勵已發放！+1 瓶子`,
    bottle2: `✅ 開始新的漂流瓶`,
    bottle3: `✅ 瓶子已創建
`,
    broadcast: `✅ 已清理 \${ids.length} 個卡住的廣播

`,
    broadcast2: `✅ 沒有需要清理的廣播

`,
    broadcast3: `✅ 過濾廣播已創建

`,
    broadcast4: `✅ 廣播已創建

`,
    cancel: `✅ 廣播已取消

`,
    complete: `✅ 廣播隊列處理完成

`,
    complete2: `✅ 系統維護已完成

`,
    complete3: `✅ 教學已完成！`,
    complete4: `✅ **批量刷新完成**

`,
    complete5: `✅ **刷新完成**

`,
    complete6: `✅ 完成篩選，輸入內容`,
    complete7: `✅ 篩選完成`,
    confirm: `✅ 已確認！`,
    confirm2: `✅ 安全確認完成`,
    confirm3: `✅ 確認`,
    conversation: `✅ **對話歷史已更新！**

`,
    gender: `✅ 性別已保存`,
    invite: `✅ 已激活邀請：\${successfulInvites} / \${inviteLimit} 人
`,
    mbti: `✅ 你的 MBTI 類型已更新為：**\${mbtiType}**

`,
    mbti2: `✅ 你的 MBTI 類型已清除。

`,
    mbti3: `✅ MBTI 已清除`,
    mbti4: `✅ 已清除 MBTI 選擇`,
    mbti5: `✅ 你的 MBTI 類型：\${mbtiType}

`,
    message: `✅ 訊息已發送給 \${formatIdentifier(receiverIdentifier)}

`,
    message2: `✅ 語言已更新為：\${getLanguageDisplay(languageCode)}`,
    message3: `✅ 已封鎖此使用者 (#\${conversationIdentifier})

`,
    message4: `✅ 獲得 +\${ad.reward_quota} 個永久額度！`,
    message5: `✅ 已選擇 \${gender}`,
    message6: `✅ 已選擇 \${bloodTypeDisplay[bloodType]}`,
    message7: `✅ 已選擇 \${ZODIAC_NAMES[zodiacSign]}`,
    message8: `✅ 你選擇了：\${gender}

`,
    nickname: `✅ 使用 Telegram 暱稱：\${suggestedNickname.substring(0, 18)}`,
    nickname2: `✅ 暱稱已更新為：\${text}

`,
    register: `✅ 開發模式：跳過註冊

`,
    register2: `✅ 我了解了，繼續註冊`,
    register3: `✅ 註冊完成！`,
    report: `✅ **舉報已提交** (#\${conversationIdentifier})

`,
    report2: `✅ 舉報已提交`,
    report3: `✅ **已舉報此用戶**

`,
    report4: `✅ 確定舉報`,
    report5: `✅ 已舉報`,
    reportSubmitted: `[需要从 zh-TW.ts 获取翻译]`,
    settings: `✅ MBTI 已設定為 \${mbtiType}`,
    settings2: `✅ 暱稱已設定`,
    settings3: `✅ 篩選條件已設定：

`,
    settings4: `✅ 血型已設定為 \${getBloodTypeDisplay(bloodType as any)}`,
    settings5: `✅ MBTI 類型已設定：\${mbtiType}

`,
    settings6: `✅ 已跳過血型設定`,
    short: `✅ 正在發送...`,
    short10: `✅ 正在加載...`,
    short11: `✅ 🌈 任何人`,
    short12: `✅ 👨 男生`,
    short13: `✅ 👩 女生`,
    short14: `✅ 繼續編輯`,
    short15: `✅ 確定封鎖`,
    short16: `✅ 已封鎖`,
    short17: `✅ 我已閱讀並同意`,
    short18: `✅ 已跳過`,
    short19: `✅ 領取獎勵`,
    short2: `✅ 繼續編輯草稿`,
    short20: `✅ 維護中`,
    short3: `✅ 草稿已刪除`,
    short4: `✅ 驗證並領取`,
    short5: `✅ 發送草稿`,
    short6: `✅ 已記錄`,
    short7: `✅ 正確`,
    short8: `✅ 啟用`,
    short9: `✅ 是`,
    start: `✅ 請點擊按鈕開始觀看`,
    start2: `✅ 開始快速版測驗`,
    start3: `✅ 開始完整版測驗`,
    start4: `✅ 開始測驗`,
    success: `✅ 驗證成功！獲得 +\${ad.reward_quota} 個永久額度！`,
    'success.ad': `✅ 你已經看過所有官方廣告了！`,
    'success.ad2': `✅ 已啟用廣告提供商：\\\${providerName}

`,
    'success.ad3': `✅ 已停用廣告提供商：\\\${providerName}

`,
    'success.ad4': `✅ 已啟用官方廣告 #\\\${adId}

`,
    'success.ad5': `✅ 已停用官方廣告 #\\\${adId}

`,
    'success.ad6': `✅ 已設置廣告提供商優先級

`,
    'success.ad7': `✅ 今日廣告已達上限`,
    'success.appeal': `✅ 申訴 \\\${appealId} 已批准，用戶已解封`,
    'success.appeal2': `✅ 申訴 \\\${appealId} 已拒絕`,
    'success.appeal3': `✅ 目前沒有待審核的申訴`,
    'success.birthday': `✅ 生日已保存`,
    'success.bloodType': `✅ 血型已更新為 \\\${getBloodTypeDisplay(bloodType as any)}`,
    'success.bloodType2': `✅ 血型已清除`,
    'success.bottle': `✅ 獎勵已發放！+1 瓶子`,
    'success.bottle2': `✅ 開始新的漂流瓶`,
    'success.bottle3': `✅ 瓶子已創建
`,
    'success.broadcast': `✅ 已清理 \\\${ids.length} 個卡住的廣播

`,
    'success.broadcast2': `✅ 沒有需要清理的廣播

`,
    'success.broadcast3': `✅ 過濾廣播已創建

`,
    'success.broadcast4': `✅ 廣播已創建

`,
    'success.cancel': `✅ 廣播已取消

`,
    'success.complete': `✅ 廣播隊列處理完成

`,
    'success.complete2': `✅ 系統維護已完成

`,
    'success.complete3': `✅ 教學已完成！`,
    'success.complete4': `✅ **批量刷新完成**

`,
    'success.complete5': `✅ **刷新完成**

`,
    'success.complete6': `✅ 完成篩選，輸入內容`,
    'success.complete7': `✅ 篩選完成`,
    'success.confirm': `✅ 已確認！`,
    'success.confirm2': `✅ 安全確認完成`,
    'success.confirm3': `✅ 確認`,
    'success.conversation': `✅ **對話歷史已更新！**

`,
    'success.gender': `✅ 性別已保存`,
    'success.invite': `✅ 已激活邀請：\\\${successfulInvites} / \\\${inviteLimit} 人
`,
    'success.mbti': `✅ 你的 MBTI 類型已更新為：**\\\${mbtiType}**

`,
    'success.mbti2': `✅ 你的 MBTI 類型已清除。

`,
    'success.mbti3': `✅ MBTI 已清除`,
    'success.mbti4': `✅ 已清除 MBTI 選擇`,
    'success.mbti5': `✅ 你的 MBTI 類型：\\\${mbtiType}

`,
    'success.message': `✅ 訊息已發送給 \\\${formatIdentifier(receiverIdentifier)}

`,
    'success.message2': `✅ 語言已更新為：\\\${getLanguageDisplay(languageCode)}`,
    'success.message3': `✅ 已封鎖此使用者 (#\\\${conversationIdentifier})

`,
    'success.message4': `✅ 獲得 +\\\${ad.reward_quota} 個永久額度！`,
    'success.message5': `✅ 已選擇 \\\${gender}`,
    'success.message6': `✅ 已選擇 \\\${bloodTypeDisplay[bloodType]}`,
    'success.message7': `✅ 已選擇 \\\${ZODIAC_NAMES[zodiacSign]}`,
    'success.message8': `✅ 你選擇了：\\\${gender}

`,
    'success.nickname': `✅ 使用 Telegram 暱稱：\\\${suggestedNickname.substring(0, 18)}`,
    'success.nickname2': `✅ 暱稱已更新為：\\\${text}

`,
    'success.register': `✅ 開發模式：跳過註冊

`,
    'success.register2': `✅ 我了解了，繼續註冊`,
    'success.register3': `✅ 註冊完成！`,
    'success.report': `✅ **舉報已提交** (#\\\${conversationIdentifier})

`,
    'success.report2': `✅ 舉報已提交`,
    'success.report3': `✅ **已舉報此用戶**

`,
    'success.report4': `✅ 確定舉報`,
    'success.report5': `✅ 已舉報`,
    'success.settings': `✅ MBTI 已設定為 \\\${mbtiType}`,
    'success.settings2': `✅ 暱稱已設定`,
    'success.settings3': `✅ 篩選條件已設定：

`,
    'success.settings4': `✅ 血型已設定為 \\\${getBloodTypeDisplay(bloodType as any)}`,
    'success.settings5': `✅ MBTI 類型已設定：\\\${mbtiType}

`,
    'success.settings6': `✅ 已跳過血型設定`,
    'success.short': `✅ 正在發送...`,
    'success.short10': `✅ 正在加載...`,
    'success.short11': `✅ 🌈 任何人`,
    'success.short12': `✅ 👨 男生`,
    'success.short13': `✅ 👩 女生`,
    'success.short14': `✅ 繼續編輯`,
    'success.short15': `✅ 確定封鎖`,
    'success.short16': `✅ 已封鎖`,
    'success.short17': `✅ 我已閱讀並同意`,
    'success.short18': `✅ 已跳過`,
    'success.short19': `✅ 領取獎勵`,
    'success.short2': `✅ 繼續編輯草稿`,
    'success.short20': `✅ 維護中`,
    'success.short3': `✅ 草稿已刪除`,
    'success.short4': `✅ 驗證並領取`,
    'success.short5': `✅ 發送草稿`,
    'success.short6': `✅ 已記錄`,
    'success.short7': `✅ 正確`,
    'success.short8': `✅ 啟用`,
    'success.short9': `✅ 是`,
    'success.start': `✅ 請點擊按鈕開始觀看`,
    'success.start2': `✅ 開始快速版測驗`,
    'success.start3': `✅ 開始完整版測驗`,
    'success.start4': `✅ 開始測驗`,
    'success.success': `✅ 驗證成功！獲得 +\\\${ad.reward_quota} 個永久額度！`,
    'success.text': `✅ 已設置為 \\\${flag} \\\${countryName}`,
    'success.text10': `✅ 是的，我了解並會注意安全`,
    'success.text11': `✅ 維護模式已啟用

`,
    'success.text12': `✅ 維護模式已關閉

`,
    'success.text13': `✅ 更準確的性格分析
`,
    'success.text14': `✅ 已跳過教學

`,
    'success.text15': `✅ 所有帖子都是最新的（免費用戶狀態正確）
`,
    'success.text16': `✅ **無需刷新**

`,
    'success.text17': `✅ 已選擇 \\\${gender ===`,
    'success.text18': `✅ 已選擇 \\\${mbtiType}`,
    'success.text19': `✅ **規則**：
`,
    'success.text2': `✅ 興趣標籤已更新：

\\\${interestsStr}`,
    'success.text20': `✅ **已封鎖此用戶**

`,
    'success.text21': `✅ **退款申請已提交**

`,
    'success.text22': `✅ **退款已批准**

`,
    'success.text23': `✅ 沒有待處理的退款請求。`,
    'success.text24': `✅ 正在準備支付...`,
    'success.text25': `✅ 退款已批准

`,
    'success.text26': `✅ 退款已拒絕

`,
    'success.text27': `✅ 我已加入，領取獎勵`,
    'success.text28': `✅ 你選擇了：\\\${gender ===`,
    'success.text29': `✅ 反詐騙測驗通過！

`,
    'success.text3': `✅ 匹配偏好已更新為：\\\${prefText}

`,
    'success.text30': `✅ 語言已變更為 \\\${newLanguageName}`,
    'success.text4': `✅ 個人簡介已更新！

\\\${text}`,
    'success.text5': `✅ 開發模式：數據已重置

`,
    'success.text6': `✅ 地區已更新為：\\\${text}`,
    'success.text7': `✅ 快速了解基本性格類型

`,
    'success.text8': `✅ **頭像已更新！**

`,
    'success.text9': `✅ 推薦用於重新測試

`,
    'success.vip': `✅ 所有帖子都是最新的（VIP 狀態正確）
`,
    'success.zodiac': `✅ 已清除星座選擇`,
    success2: `🎉 **驗證成功！**

✅ 獲得 **+\${ad.reward_quota} 個永久額度**
💎 感謝你加入我們的社群！

📊 **你的額度：**
• 基礎額度：\${user.is_vip ? '無限' : '10'}/天
• 永久額度：+\${ad.reward_quota}

💡 在社群中你可以：
• 與其他用戶交流
• 獲得最新功能更新
• 參與活動獲得更多獎勵`,
    success3: `成功刷新 \${result.updated} 個對話的歷史帖子。

`,
    success4: `成功刷新：\${result.updated} 個
`,
    text: `✅ 已設置為 \${flag} \${countryName}`,
    text10: `✅ 是的，我了解並會注意安全`,
    text11: `✅ 維護模式已啟用

`,
    text12: `✅ 維護模式已關閉

`,
    text13: `✅ 更準確的性格分析
`,
    text14: `✅ 已跳過教學

`,
    text15: `✅ 所有帖子都是最新的（免費用戶狀態正確）
`,
    text16: `✅ **無需刷新**

`,
    text17: `✅ 已選擇 \${gender ===`,
    text18: `✅ 已選擇 \${mbtiType}`,
    text19: `✅ **規則**：
`,
    text2: `✅ 興趣標籤已更新：

\${interestsStr}`,
    text20: `✅ **已封鎖此用戶**

`,
    text21: `✅ **退款申請已提交**

`,
    text22: `✅ **退款已批准**

`,
    text23: `✅ 沒有待處理的退款請求。`,
    text24: `✅ 正在準備支付...`,
    text25: `✅ 退款已批准

`,
    text26: `✅ 退款已拒絕

`,
    text27: `✅ 我已加入，領取獎勵`,
    text28: `✅ 你選擇了：\${gender ===`,
    text29: `✅ 反詐騙測驗通過！

`,
    text3: `✅ 匹配偏好已更新為：\${prefText}

`,
    text30: `✅ 語言已變更為 \${newLanguageName}`,
    text4: `✅ 個人簡介已更新！

\${text}`,
    text5: `✅ 開發模式：數據已重置

`,
    text6: `✅ 地區已更新為：\${text}`,
    text7: `✅ 快速了解基本性格類型

`,
    text8: `✅ **頭像已更新！**

`,
    text9: `✅ 推薦用於重新測試

`,
    vip: `✅ 所有帖子都是最新的（VIP 狀態正確）
`,
    zodiac: `✅ 已清除星座選擇`,
  },
  target: {
    all: `所有用戶`,
    nonVip: `非 VIP 用戶`,
    unknown: `未知`,
    vip: `VIP 用戶`,
  },
  tasks: {
    bottle: `獎勵：+\${task.reward_amount} 瓶子（\${task.reward_type}）

`,
    bottle2: `獎勵：+\${task.reward_amount} 瓶子（\${task.reward_type ===`,
    bottle3: `\${icon} \${task.name} (+\${task.reward_amount} 瓶子)
`,
    bottle4: `• 永久獎勵：\${inviteProgress.current} 個瓶子（每天發放）
`,
    bottle5: `• 一次性獎勵：\${todayRewardCount} 個瓶子（當天有效）
`,
    bottle6: `📋 **任務中心**

完成任務獲得額外瓶子！

`,
    'description.bio': `寫下你的故事（至少 20 字）`,
    'description.city': `找到同城的朋友`,
    'description.first_bottle': `開始你的交友之旅`,
    'description.first_catch': `看看別人的故事`,
    'description.first_conversation': `建立你的第一個連接（長按訊息 → 選擇「回覆」）`,
    'description.interests': `讓別人更了解你`,
    'description.invite_progress': `每邀請 1 人，每日額度永久 +1（免費最多 10 人，VIP 最多 100 人）`,
    'description.join_channel': `獲取最新消息和活動`,
    invite: `🔄 邀請好友 (\${inviteProgress.current}/\${inviteProgress.max})
`,
    invite2: `每邀請 1 人 → 每日額度永久 +1
`,
    message: `\${icon} \${task.name} \${status} (+\${task.reward_amount} 瓶子)
`,
    message2: `點擊下方按鈕加入 XunNi 官方頻道，獲取最新消息和活動！

`,
    'name.bio': `完善自我介紹`,
    'name.city': `設定地區`,
    'name.first_bottle': `丟出第一個瓶子`,
    'name.first_catch': `撿起第一個瓶子`,
    'name.first_conversation': `開始第一次對話`,
    'name.interests': `填寫興趣標籤`,
    'name.invite_progress': `邀請好友`,
    'name.join_channel': `加入官方頻道`,
    profile: `👤 **個人資料任務** (\${completedCount}/\${profileTasks.length})
`,
    quota: `當前每日配額：\${calculateDailyQuota(user)} 個
`,
    short: `(待領取)`,
    short2: `當天有效`,
    short3: `永久有效`,
    task: `• 邀請任務：\${inviteProgress.current}/\${inviteProgress.max} 進行中

`,
    task2: `📱 **社交媒體任務** (\${completedCount}/\${socialTasks.length})
`,
    task3: `🎯 **行為任務** (\${completedCount}/\${actionTasks.length})
`,
    task4: `• 一次性任務：\${oneTimeCompleted}/\${oneTimeTotal} 已完成
`,
    task5: `🎉 恭喜完成任務「\${task.name}」！

`,
    task6: `👥 **邀請任務** (持續進行中)
`,
    task7: `💡 使用 /tasks 查看任務中心`,
    text: `加入後點擊「我已加入」按鈕領取獎勵 🎁`,
    text2: `📢 **加入官方頻道**

`,
    text3: `📊 **總進度**
`,
    text4: `🎁 **已獲得**
`,
  },
  throw: {
    age: `• 年齡區間相近 ✓`,
    back: `↩️ 返回篩選選單`,
    bloodType: `🩸 **血型篩選**

`,
    bloodType2: `• 血型：篩選特定血型
`,
    bloodType3: `選擇你想要配對的血型：`,
    bloodType4: `🩸 血型篩選`,
    bloodType5: `🌈 任何血型`,
    bottle: `
💡 這個瓶子和你非常合拍！
\${highlights.join('
')}
`,
    bottle10: `🍾 漂流瓶已丟出！

`,
    bottle11: `🍾 丟漂流瓶`,
    bottle2: `🎯 你的瓶子已發送給 **3 個對象**：
`,
    bottle3: `🍾 **正在丟出你的漂流瓶...**

`,
    bottle4: `🍾 **丟漂流瓶** #THROW

`,
    bottle5: `瓶子 ID：#\${bottleId}

`,
    bottle6: `📝 **請輸入你的漂流瓶內容**

`,
    bottle7: `1️⃣ 點擊下方「🍾 丟漂流瓶」按鈕
`,
    bottle8: `📝 請輸入你的漂流瓶內容：

`,
    bottle9: `📝 請輸入你的漂流瓶內容：`,
    cancel: `💡 點擊選擇或取消 MBTI 類型：`,
    cancel2: `💡 點擊選擇或取消星座：`,
    catch: `• 槽位 3：公共池（等待撿起）

`,
    catch2: `• 槽位 2：公共池（等待撿起）
`,
    catch3: `• 槽位 1：公共池（等待撿起）
`,
    catch4: `🌊 等待有緣人撿起...
`,
    complete: `⚙️ **進階篩選**

\${summary}
💡 繼續調整或完成篩選：`,
    complete2: `🎯 **第 1 個配對已完成：**
`,
    complete3: `📝 你有一個未完成的草稿

`,
    complete4: `⏳ 預計 3-5 秒完成`,
    complete5: `⏳ 預計 2-3 秒完成`,
    complete6: `⏳ 預計 1-2 秒完成`,
    conversation: `💬 對話標識符：\${vipMatchInfo.conversationIdentifier}

`,
    conversation2: `💡 提示：每個對話都是獨立的，可以同時進行

`,
    conversation3: `💡 你可能會收到 **最多 3 個對話**！
`,
    conversation4: `💬 你可能會收到 **最多 3 個對話**！
`,
    conversation5: `使用 /chats 查看所有對話

`,
    conversation6: `📊 使用 /chats 查看所有對話`,
    conversation7: `使用 /chats 查看所有對話`,
    currentSelection: `當前選擇：{genderText}`,
    friendlyContent: `[需要从 zh-TW.ts 获取翻译]`,
    gender: `• 性別：\${selectedGender}
`,
    gender2: `👤 **性別篩選**

`,
    gender3: `• 性別：篩選性別

`,
    gender4: `💡 選擇你想要的性別：`,
    gender5: `👤 性別篩選`,
    genderLabel: `• 性別：{gender}
`,
    mbti: `• MBTI：\${selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '無限制'}
`,
    mbti2: `已選擇：\${selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '無'}

`,
    mbti3: `已選擇：\${selectedMBTI.length > 0 ? selectedMBTI.join(`,
    mbti4: `🧠 **MBTI 篩選**

`,
    mbti5: `• MBTI：篩選特定性格類型
`,
    mbti6: `• MBTI 高度配對 ✓`,
    mbti7: `🧠 MBTI 篩選`,
    mbtiLabel: `• MBTI：{mbti}
`,
    message: `已選擇：\${selectedZodiac.length > 0 ? selectedZodiac.map((z) => ZODIAC_NAMES[z]).join(', ') : '無'}

`,
    message2: `當前選擇：\${currentGender}

`,
    message3: `已選擇：\${selectedZodiac.length > 0 ? selectedZodiac.map((z) => ZODIAC_NAMES[z]).join(`,
    message4: `當前選擇：\${bloodTypeDisplay[currentBloodType]}

`,
    message5: `👤 對方：\${vipMatchInfo.matcherNickname}
`,
    message6: `「你好！我是一個喜歡音樂和電影的人，希望認識志同道合的朋友～」

`,
    message7: `💡 可在 /edit_profile 中修改匹配偏好

`,
    message8: `💬 直接按 /reply 回覆訊息開始聊天
`,
    nickname: `📝 對方暱稱：\${matchedUserMaskedNickname}
`,
    quota: `• 更多配額（30 個/天）
`,
    quota2: `🎁 邀請好友可增加配額：
`,
    settings: `🧠 MBTI：\${matchResult.user.mbti_result}
`,
    settings2: `⭐ 星座：\${matchResult.user.zodiac}
`,
    settings3: `🧠 MBTI：\${user.mbti_result}
`,
    settings4: `⭐ 星座：\${user.zodiac_sign}
`,
    settings5: `未設定`,
    settings6: `未設定`,
    settings7: `未設定`,
    settings8: `未設定`,
    short: `• 語言相同 ✓`,
    short10: `♋ 巨蟹座`,
    short11: `♌ 獅子座`,
    short12: `♍ 處女座`,
    short13: `♎ 天秤座`,
    short14: `♏ 天蠍座`,
    short15: `♐ 射手座`,
    short16: `♑ 摩羯座`,
    short17: `♒ 水瓶座`,
    short18: `♓ 雙魚座`,
    short19: `違規行為`,
    short2: `🩸 AB 型`,
    short20: `無限制`,
    short21: `無限制`,
    short22: `無限制`,
    short23: `無限制`,
    short3: `🌈 任何人`,
    short4: `🩸 A 型`,
    short5: `🩸 B 型`,
    short6: `🩸 O 型`,
    short7: `♈ 白羊座`,
    short8: `♉ 金牛座`,
    short9: `♊ 雙子座`,
    start: `✍️ 重新開始`,
    success: `一次丟瓶子 = 3 個對象，大幅提升配對成功率

`,
    success2: `✨ **VIP 特權啟動！智能配對成功！**

`,
    success3: `🎯 你的漂流瓶已被配對成功！

`,
    text: `💝 匹配度：\${matchPercentage}%
`,
    text10: `🎯 正在為你尋找最佳配對對象

`,
    text11: `
💬 等待對方回覆中...
`,
    text12: `• 免費用戶：最多 +7 個
`,
    text13: `• 不要包含個人聯絡方式

`,
    text14: `💡 **兩種輸入方式**：
`,
    text15: `📊 免費用戶：3 個/天
`,
    text16: `選擇你想要篩選的條件：

`,
    text17: `• 進階篩選和翻譯

`,
    text18: `創建時間：\${age}
`,
    text19: `使用 /vip 立即升級`,
    text2: `• 🆕 三倍曝光機會（1 次 = 3 個對象）
`,
    text20: `💬 **範例**：
`,
    text21: `使用 /vip 了解更多`,
    text22: `要繼續編輯這個草稿嗎？`,
    text23: `💡 可以組合多個條件`,
    text24: `當前篩選條件：

`,
    text3: `💡 這可能需要幾秒鐘，我們正在為你找到最合適的人`,
    text4: `當前選擇：\${currentGender ===`,
    text5: `🎯 尋找對象：\${targetText}
`,
    text6: `🎯 正在為你尋找 3 個最佳配對對象

`,
    text7: `📨 **另外 2 個槽位等待中：**
`,
    text8: `🔍 正在智能匹配最佳對象...

`,
    text9: `內容預覽：\${preview}

`,
    throw: `📊 今日已丟：\${quotaDisplay}

`,
    tips: `[需要从 zh-TW.ts 获取翻译]`,
    unlimited: `無限制`,
    vip: `💎 VIP 用戶：30 個/天（三倍曝光）

`,
    vip2: `💎 **升級 VIP 可獲得三倍曝光機會！**
`,
    vip3: `⚙️ **進階篩選（VIP 專屬）**

`,
    vip4: `• VIP 用戶：最多 +70 個

`,
    vip5: `✨ **VIP 特權啟動！**

`,
    vip6: `💡 升級 VIP 獲得：
`,
    vip7: `✨ VIP 特權啟動中
`,
    zodiac: `• 星座：\${selectedZodiac.length > 0 ? selectedZodiac.map((z) => ZODIAC_NAMES[z]).join(', ') : '無限制'}
`,
    zodiac2: `⭐ 星座：\${matchResult.user.zodiac ||`,
    zodiac3: `⭐ 星座：\${user.zodiac_sign ||`,
    zodiac4: `⭐ **星座篩選**

`,
    zodiac5: `• 星座：篩選特定星座
`,
    zodiac6: `• 星座高度相容 ✓`,
    zodiac7: `⭐ 星座篩選`,
    zodiacLabel: `• 星座：{zodiac}
`,
  },
  tutorial: {
    availableCommands: `你可以隨時使用以下命令：`,
    catchBottle: `🎣 **撿起漂流瓶**`,
    catchBottleDesc: `看看別人的漂流瓶，有興趣就回覆開始聊天`,
    clickButtonHint: `[需要翻译: tutorial.clickButtonHint]`,
    commandCatch: `• /catch - 撿起漂流瓶`,
    commandHelp: `• /help - 查看幫助`,
    commandMenu: `[需要翻译: tutorial.commandMenu]`,
    commandTasks: `• /tasks - 查看任務`,
    commandThrow: `• /throw - 丟出漂流瓶`,
    completeTasksForBottles: `💡 完成任務可獲得額外瓶子`,
    completed: `✅ 教學已完成！`,
    howToBecomeFriends: `💬 **如何成為朋友？**`,
    howToBecomeFriendsDesc: `你撿瓶回覆 → 對方也回覆 → 開始匿名聊天`,
    readyToStart: `🎉 **準備好了！開始交朋友吧～**`,
    skip: `跳過`,
    skipped: `✅ 已跳過教學`,
    startUsing: `開始使用 →`,
    throwBottle: `📦 **丟出漂流瓶**`,
    throwBottleDesc: `寫下你的心情或想法，系統會幫你找到合適的人`,
    unknownStep: `❌ 未知的教學步驟`,
    viewTasks: `📋 查看任務`,
    welcome: `🎉 恭喜完成註冊！`,
    whatIsXunNi: `🌊 **XunNi 是什麼？**`,
    whatIsXunNiDesc: `匿名漂流瓶交友平台，透過 MBTI 和星座幫你找到志同道合的朋友`,
  },
  vip: {
    admin: `⏳ 你已有待處理的退款請求，請耐心等待管理員審核。`,
    bottle: `📝 瓶子內容：\${bottle.content.substring(0, 50)}\${bottle.content.length > 50 ? '...' : ''}

`,
    bottle2: `📝 瓶子內容：\${bottle.content.substring(0, 50)}\${bottle.content.length > 50 ?`,
    bottle3: `你的瓶子已被 \${maskedMatcherNickname} 撿起！

`,
    bottle4: `系統為你找到了 \${maskedOwnerNickname} 的瓶子！

`,
    bottle5: `📝 瓶子內容：\${bottle.content}

`,
    bottle6: `• 🆕 三倍曝光機會！一次丟瓶子觸發 3 個對象
`,
    cancelReminderButton: `❌ 稍後再說`,
    conversation: `💬 對話標識符：\${conversationIdentifier}
`,
    conversation2: `🔄 正在更新您的對話歷史，清晰頭像即將顯示...

`,
    mbti: `• 可篩選配對對象的 MBTI、星座、血型
`,
    mbti2: `• 可篩選配對對象的 MBTI 和星座
`,
    mbti3: `• 可篩選 MBTI 和星座
`,
    message: `到期時間：\${new Date(sub.expire_date).toLocaleDateString('zh-TW')}

`,
    message10: `申請編號：#\${result.meta.last_row_id}
`,
    message11: `退款金額：\${request.amount_stars} ⭐
`,
    message12: `💬 **請長按此訊息，選擇「回覆」後輸入內容和對方開始聊天**`,
    message13: `💡 使用 Telegram Stars 安全便捷支付

`,
    message14: `💡 這是你的第 1 個配對，還有 2 個槽位等待中

`,
    message2: `申請時間：\${new Date(req.requested_at).toLocaleString('zh-TW')}
`,
    message3: `新到期時間：\${newExpire.toLocaleDateString('zh-TW')}

`,
    message4: `到期時間：\${newExpire.toLocaleDateString('zh-TW')}

`,
    message5: `支付時間：\${paymentDate.toLocaleDateString('zh-TW')}
`,
    message6: `📋 **待處理退款請求** (\${requests.results.length})

`,
    message7: `支付 ID：\${payment.telegram_payment_charge_id}`,
    message8: `價格：\${priceStars} ⭐ Telegram Stars / 月
`,
    message9: `支付時間：\${paymentDate.toLocaleDateString(`,
    purchaseCancelled: `✅ 已取消購買`,
    quota: `• 每天 30 個漂流瓶配額（邀請好友可增加，最高 100 個/天）
`,
    quota2: `• 每天 30 個漂流瓶配額（最高 100 個/天）
`,
    refundAdminCommands: `💡 使用以下命令處理：
• 批准：\`/admin_approve_refund <ID>\`
• 拒絕：\`/admin_reject_refund <ID> <原因>\``,
    refundApproved: `✅ **退款已批准**

退款金額：\${amount} ⭐
退款將在 1-3 個工作日內到帳。

你的 VIP 會員已取消。

感謝你的理解！`,
    refundApprovedAdmin: `✅ 退款已批准

請求 ID：#\${requestId}
用戶 ID：\${userId}
金額：\${amount} ⭐`,
    refundExpired: `❌ 退款申請超過時限

支付時間：\${paymentDate}
退款時限：支付後 7 天內

💡 如有特殊情況，請聯繫客服。`,
    refundFailed: `❌ 退款失敗：\${error}`,
    refundNoPayment: `❌ 找不到支付記錄。`,
    refundNoPending: `✅ 沒有待處理的退款請求。`,
    refundPending: `⏳ 你已有待處理的退款請求，請耐心等待管理員審核。`,
    refundPendingList: `📋 **待處理退款請求** (\${count})`,
    refundReasonTooShort: `❌ 退款原因至少需要 10 個字，請重新輸入：`,
    refundRejected: `❌ **退款申請已被拒絕**

原因：\${reason}

如有疑問，請聯繫客服。`,
    refundRejectedAdmin: `✅ 退款已拒絕

請求 ID：#\${requestId}
用戶 ID：\${userId}`,
    refundRequestItem: `**#\${id}** - \${nickname}
用戶 ID：\`\${userId}\`
金額：\${amount} ⭐
原因：\${reason}
申請時間：\${requestedAt}`,
    refundRequestNotFound: `❌ 退款請求不存在或已處理`,
    refundRequestReason: `📝 **申請退款**

請輸入退款原因（至少 10 個字）：`,
    refundSubmitFailed: `❌ 提交失敗，請稍後再試。`,
    refundSubmitted: `✅ **退款申請已提交**

申請編號：#\${requestId}
狀態：待審核

我們會在 1-3 個工作日內處理你的申請。
處理結果會通過 Bot 通知你。

感謝你的耐心等待！`,
    reminderCancelled: `✅ 已取消提醒`,
    reminderDaysLeft: `你的 VIP 會員將在 \${days} 天後到期。`,
    reminderExpireDate: `到期時間：\${date}`,
    reminderExpiringToday: `⚠️ **VIP 今天到期**`,
    reminderExpiringTodayDesc: `你的 VIP 會員今天到期。`,
    reminderGracePeriod: `📌 寬限期：到期後 3 天內續費不會中斷服務。`,
    reminderRenewHint: `💡 立即續費，享受不間斷的 VIP 服務！`,
    reminderRenewHint2: `💡 立即續費，繼續享受 VIP 權益！`,
    reminderTitle: `⏰ **VIP 到期提醒**`,
    renewButton: `💳 立即續費 (\${stars} ⭐)`,
    renewalProcessing: `正在處理續費...`,
    settings: `💡 如需取消訂閱，請前往 Telegram 設定 > 訂閱管理

`,
    settings2: `💡 如需取消訂閱，請前往 Telegram 設定 > 訂閱管理`,
    settings3: `💡 可隨時在 Telegram 設定中取消訂閱`,
    short: `（約 5 USD）`,
    short2: `感謝你的耐心等待！`,
    short3: `感謝你的理解！`,
    short4: `• 批准：\\`,
    short5: `• 拒絕：\\`,
    start: `🚀 立即開始使用：/throw`,
    success: `🎯 **VIP 智能配對成功！**

`,
    success2: `🎉 **自動續費成功！**

`,
    success3: `🎉 **智能配對成功！**

`,
    success4: `🎉 **訂閱成功！**

`,
    text: `- 優先使用 OpenAI GPT 模型翻譯（高品質）
`,
    text10: `我們會在 1-3 個工作日內處理你的申請。
`,
    text11: `到期時間：\${expireDate}

`,
    text12: `退款將在 1-3 個工作日內到帳。

`,
    text13: `請求 ID：#\${requestId}
`,
    text14: `└ 1 個智能配對 + 2 個公共池
`,
    text15: `處理結果會通過 Bot 通知你。

`,
    text16: `請輸入退款原因（至少 10 個字）：`,
    text17: `原因：\${req.reason}
`,
    text18: `退款時限：支付後 7 天內

`,
    text19: `你的帳號已恢復為免費用戶。

`,
    text2: `• 34 種語言自動翻譯（OpenAI GPT 優先）
`,
    text20: `💡 想要續訂或升級嗎？

`,
    text21: `💡 如有特殊情況，請聯繫客服。`,
    text22: `原因：\${reason}

`,
    text23: `• 解鎖對方清晰頭像 🆕
`,
    text24: `這可能需要幾秒鐘時間，請稍候。`,
    text25: `📝 **申請退款**

`,
    text26: `• 34 種語言自動翻譯
`,
    text27: `💡 使用以下命令處理：
`,
    text28: `（Staging 測試價）`,
    text29: `如有疑問，請聯繫客服。`,
    text3: `金額：\${request.amount_stars} ⭐`,
    text30: `狀態：待審核

`,
    text4: `🔄 **自動續費**：每月自動扣款，無需手動續費
`,
    text5: `金額：\${req.amount_stars} ⭐
`,
    text6: `用戶 ID：\${request.user_id}
`,
    text7: `💳 立即續費 (\${priceStars} ⭐)`,
    text8: `用戶 ID：\${request.user_id}`,
    text9: `📌 寬限期：到期後 3 天內續費不會中斷服務。`,
    viewVipCommand: `你可以隨時使用 /vip 命令查看 VIP 權益。`,
    vip: `你的 VIP 會員已於 \${new Date(sub.expire_date).toLocaleDateString('zh-TW')} 到期。

`,
    vip10: `💎 **升級 VIP 會員**

`,
    vip11: `😢 **VIP 會員已到期**

`,
    vip12: `升級 VIP 會員，享受以下權益：
`,
    vip13: `⏰ **VIP 到期提醒**

`,
    vip14: `你的 VIP 會員今天到期。

`,
    vip15: `你的 VIP 訂閱已自動續費！
`,
    vip16: `你的 VIP 會員已取消。

`,
    vip17: `XunNi VIP 訂閱（月費）`,
    vip18: `✨ VIP 權益持續啟用：
`,
    vip19: `你已成為 VIP 會員！
`,
    vip2: `你的 VIP 會員已於 \${new Date(sub.expire_date).toLocaleDateString(`,
    vip20: `✨ VIP 權益已啟用：
`,
    vip21: `VIP 會員 (30 天)`,
    vip22: `🎁 VIP 權益：
`,
    vip23: `XunNi VIP 續訂`,
    vip24: `XunNi VIP 購買`,
    vip25: `VIP 訂閱`,
    vip3: `你的 VIP 會員將在 \${daysLeft} 天後到期。

`,
    vip4: `🔄 續訂 VIP (\${priceStars} ⭐)`,
    vip5: `💳 購買 VIP (\${priceStars} ⭐)`,
    vip6: `訂閱 XunNi VIP 會員，每月自動續費！

`,
    vip7: `💡 立即續費，享受不間斷的 VIP 服務！`,
    vip8: `💡 立即續費，繼續享受 VIP 權益！
`,
    vip9: `✨ **你已經是 VIP 會員**

`,
  },
  vipTripleBottle: {
    bottleContent: `📝 瓶子內容：{content}

`,
    bottlePicked: `你的瓶子已被 {maskedMatcherNickname} 撿起！

`,
    conversationIdentifier: `💬 對話標識符：{conversationIdentifier}
`,
    firstMatch: `💡 這是你的第 1 個配對，還有 2 個槽位等待中

`,
    foundBottle: `系統為你找到了 {maskedOwnerNickname} 的瓶子！

`,
    matchSuccess: `🎯 **VIP 智能配對成功！**

`,
    replyHint: `💬 **請長按此訊息，選擇「回覆」後輸入內容和對方開始聊天**`,
    slotsWaiting: `還有 {remaining} 個槽位等待中

`,
    smartMatch: `🎉 **智能配對成功！**

`,
    viewChats: `使用 /chats 查看所有對話

`,
  },
  warning: {
    ad: `⚠️ 目前沒有配置任何廣告提供商

`,
    ad2: `⚠️ 目前沒有官方廣告

`,
    ad3: `⚠️ 暫無可用的廣告提供商`,
    ad4: `⚠️ 無法選擇廣告提供商`,
    ad5: `⚠️ 無法觀看更多廣告`,
    birthday: `⚠️ 當前不在生日輸入步驟`,
    bloodType: `⚠️ 當前不在血型選擇步驟`,
    broadcast: `⚠️ 發現 \${stuckBroadcasts.results.length} 個卡住的廣播

`,
    complete: `⚠️ 請先完成上一支廣告，再開始新的廣告`,
    confirm: `⚠️ 請確認你的生日資訊：

`,
    conversation: `⚠️ 對話資訊錯誤。`,
    conversation10: `⚠️ 對話不存在`,
    conversation2: `⚠️ 對話資訊錯誤`,
    conversation3: `⚠️ 此用戶沒有對話歷史帖子
`,
    conversation4: `⚠️ 找不到指定的對話，可能已結束或過期。`,
    conversation5: `⚠️ **對話歷史部分更新**

`,
    conversation6: `⚠️ 無法識別對話對象

`,
    conversation7: `⚠️ 找不到此對話

`,
    conversation8: `⚠️ 對話不存在或已結束`,
    conversation9: `⚠️ 此對話已結束`,
    end: `⚠️ 測驗已結束或不存在`,
    failed: `⚠️ 支付驗證失敗，請稍後再試`,
    gender: `⚠️ 當前不在性別選擇步驟`,
    invite: `⚠️ 無法獲取邀請碼`,
    mbti: `⚠️ 當前不在 MBTI 測驗步驟`,
    mbti2: `⚠️ 無效的 MBTI 類型`,
    message: `⚠️ 發現 \${outdatedPosts.length} 個過時帖子需要刷新
`,
    message2: `⚠️ 注意：這是 \${testInfo}\${testTitle}，\${accuracy}。

`,
    message3: `⚠️ 請長按你要封鎖的訊息後回覆指令

`,
    message4: `⚠️ 請長按你要舉報的訊息後回覆指令

`,
    message5: `⚠️ **訊息包含不允許的連結**

`,
    register: `⚠️ 找不到用戶資料，請先使用 /start 註冊。`,
    register2: `⚠️ 請先完成註冊流程。

使用 /start 繼續註冊。`,
    register3: `⚠️ 註冊流程出現問題，請重新開始：/start`,
    register4: `⚠️ 請先完成註冊流程`,
    settings: `⚠️ 再次提醒：性別設定後將**永遠不能修改**！

`,
    settings2: `⚠️ 生日設定後無法修改，請確認無誤！`,
    settings3: `⚠️ 注意：性別設定後無法修改，請謹慎選擇！`,
    short: `⚠️ 問題順序錯誤`,
    short2: `⚠️ 未知的選項`,
    short3: `⚠️ 無效的請求`,
    short4: `⚠️ 注意：
`,
    short5: `⚠️ 其他違規`,
    start: `⚠️ 會話已過期，請重新開始：/throw`,
    start2: `⚠️ 會話已過期，請重新開始`,
    task: `⚠️ 未知的任務類型`,
    text: `⚠️ **注意**

`,
    text10: `⚠️ **不可修改項目**：
`,
    text11: `⚠️ 會話已過期，請重新操作`,
    text12: `⚠️ 草稿不存在或已過期`,
    text2: `⚠️ 無效的支付類型`,
    text3: `⚠️ 翻譯服務暫時無法使用，以下為原文
`,
    text4: `⚠️ 安全提示：
`,
    text5: `⚠️ 當前不在反詐騙測驗步驟`,
    text6: `⚠️ 當前不在服務條款步驟`,
    text7: `⚠️ 注意：此功能僅在 Staging 環境可用。`,
    text8: `⚠️ **不允許發送圖片、影片或多媒體**

`,
    text9: `⚠️ 此功能僅在 Staging 環境可用。`,
    userNotFound: `⚠️ 用戶不存在，請先使用 /start 註冊。`,
    userNotFound2: `⚠️ 用戶不存在`,
    vip: `⚠️ 已達免費用戶邀請上限，升級 VIP 可解鎖 100 人上限！`,
    vip2: `⚠️ 此功能僅限 VIP 會員使用`,
    vip3: `⚠️ **VIP 今天到期**
    pageInfo: `📄 Page {page}/{totalPages}`,
    end2: `[需要翻译]`,
    female: `[需要翻译]`,
    free: `[需要翻译]`,
    rewardPermanent: `[需要翻译]`,
    communityThanks: `[需要翻译]`,
    languageUpdated: `[需要翻译]`,

`,
  },
  warnings: {
    birthday: `[需要翻译: warnings.birthday]`,
    bloodType: `🩸 血型`,
    gender: `👤 性別：{otherUser.gender}`,
    mbti: `🧠 MBTI：\\\\\\\\\\\${mbti}`,
    register2: `[需要翻译: warnings.register2]`,
    register4: `[需要翻译: warnings.register4]`,
    settings: `🧠 MBTI：\\\\\\\\\\\${bottle.mbti_result}`,
    text5: `📖 簡介：{otherUser.bio}`,
    text6: `[需要翻译: warnings.text6]`,
    userNotFound: `用戶不存在`,
    'warning.ad': `⚠️ 目前沒有配置任何廣告提供商

`,
    'warning.ad2': `⚠️ 目前沒有官方廣告

`,
    'warning.ad3': `⚠️ 暫無可用的廣告提供商`,
    'warning.ad4': `⚠️ 無法選擇廣告提供商`,
    'warning.ad5': `⚠️ 無法觀看更多廣告`,
    'warning.birthday': `⚠️ 當前不在生日輸入步驟`,
    'warning.bloodType': `⚠️ 當前不在血型選擇步驟`,
    'warning.broadcast': `⚠️ 發現 \\\${stuckBroadcasts.results.length} 個卡住的廣播

`,
    'warning.complete': `⚠️ 請先完成上一支廣告，再開始新的廣告`,
    'warning.confirm': `⚠️ 請確認你的生日資訊：

`,
    'warning.conversation': `⚠️ 對話資訊錯誤。`,
    'warning.conversation10': `⚠️ 對話不存在`,
    'warning.conversation2': `⚠️ 對話資訊錯誤`,
    'warning.conversation3': `⚠️ 此用戶沒有對話歷史帖子
`,
    'warning.conversation4': `⚠️ 找不到指定的對話，可能已結束或過期。`,
    'warning.conversation5': `⚠️ **對話歷史部分更新**

`,
    'warning.conversation6': `⚠️ 無法識別對話對象

`,
    'warning.conversation7': `⚠️ 找不到此對話

`,
    'warning.conversation8': `⚠️ 對話不存在或已結束`,
    'warning.conversation9': `⚠️ 此對話已結束`,
    'warning.end': `⚠️ 測驗已結束或不存在`,
    'warning.failed': `⚠️ 支付驗證失敗，請稍後再試`,
    'warning.gender': `⚠️ 當前不在性別選擇步驟`,
    'warning.invite': `⚠️ 無法獲取邀請碼`,
    'warning.mbti': `⚠️ 當前不在 MBTI 測驗步驟`,
    'warning.mbti2': `⚠️ 無效的 MBTI 類型`,
    'warning.message': `⚠️ 發現 \\\${outdatedPosts.length} 個過時帖子需要刷新
`,
    'warning.message2': `⚠️ 注意：這是 \\\${testInfo}\\\${testTitle}，\\\${accuracy}。

`,
    'warning.message3': `⚠️ 請長按你要封鎖的訊息後回覆指令

`,
    'warning.message4': `⚠️ 請長按你要舉報的訊息後回覆指令

`,
    'warning.message5': `⚠️ **訊息包含不允許的連結**

`,
    'warning.register': `⚠️ 找不到用戶資料，請先使用 /start 註冊。`,
    'warning.register2': `⚠️ 請先完成註冊流程。

使用 /start 繼續註冊。`,
    'warning.register3': `⚠️ 註冊流程出現問題，請重新開始：/start`,
    'warning.register4': `⚠️ 請先完成註冊流程`,
    'warning.settings': `⚠️ 再次提醒：性別設定後將**永遠不能修改**！

`,
    'warning.settings2': `⚠️ 生日設定後無法修改，請確認無誤！`,
    'warning.settings3': `⚠️ 注意：性別設定後無法修改，請謹慎選擇！`,
    'warning.short': `⚠️ 問題順序錯誤`,
    'warning.short2': `⚠️ 未知的選項`,
    'warning.short3': `⚠️ 無效的請求`,
    'warning.short4': `⚠️ 注意：
`,
    'warning.short5': `⚠️ 其他違規`,
    'warning.start': `⚠️ 會話已過期，請重新開始：/throw`,
    'warning.start2': `⚠️ 會話已過期，請重新開始`,
    'warning.task': `⚠️ 未知的任務類型`,
    'warning.text': `⚠️ **注意**

`,
    'warning.text10': `⚠️ **不可修改項目**：
`,
    'warning.text11': `⚠️ 會話已過期，請重新操作`,
    'warning.text12': `⚠️ 草稿不存在或已過期`,
    'warning.text2': `⚠️ 無效的支付類型`,
    'warning.text3': `⚠️ 翻譯服務暫時無法使用，以下為原文
`,
    'warning.text4': `⚠️ 安全提示：
`,
    'warning.text5': `⚠️ 當前不在反詐騙測驗步驟`,
    'warning.text6': `⚠️ 當前不在服務條款步驟`,
    'warning.text7': `⚠️ 注意：此功能僅在 Staging 環境可用。`,
    'warning.text8': `⚠️ **不允許發送圖片、影片或多媒體**

`,
    'warning.text9': `⚠️ 此功能僅在 Staging 環境可用。`,
    'warning.userNotFound': `⚠️ 用戶不存在，請先使用 /start 註冊。`,
    'warning.userNotFound2': `⚠️ 用戶不存在`,
    'warning.vip': `⚠️ 已達免費用戶邀請上限，升級 VIP 可解鎖 100 人上限！`,
    'warning.vip2': `⚠️ 此功能僅限 VIP 會員使用`,
    'warning.vip3': `⚠️ **VIP 今天到期**

`,
  },
};
