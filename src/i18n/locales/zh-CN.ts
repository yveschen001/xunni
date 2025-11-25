import type { Translations } from '../types';

/**
 * zh-CN translations
 * Auto-generated from i18n_for_translation.csv
 */
export const translations: Translations = {
  ad: {
    ad: `💡 继续观看广告可获得更多额度！ （已修正）`,
    bottle: `[需要翻译]`,
    bottle2: `[需要翻译]`,
  },
  adPrompt: {
    completeTask: `• ✨ 完成任务（获得永久配额）`,
    inviteFriends: `• 🎁 邀请好友（每人 +1 配额）`,
    quotaExhausted: `❌ 今日漂流瓶配额已用完（\${quotaDisplay}）`,
    taskButton: `✨ \${taskName} 🎁`,
    upgradeVip: `• 💎 升级 VIP（每天 30 个配额）`,
    watchAd: `• 📺 观看广告（剩余 \${remaining}/20 次）`,
    watchAdLimit: `• 📺 观看广告（今日已达上限）`,
    waysToGetMore: `💡 获得更多配额的方式：`,
  },
  adProvider: {
    'health.good': `良好`,
    'health.needsAttention': `需要关注`,
  },
  adReward: {
    adCompleted: `广告完成！获得 +\${quota} 个配额`,
    cannotSelectProvider: `⚠️ 无法选择广告提供商`,
    cannotWatchMore: `⚠️ 无法观看更多广告`,
    clickButtonHint: `✅ 请点击按钮开始观看`,
    completedEarned: `🎁 今日已获得：**\${earned}** 个额度`,
    completedRemaining: `📈 剩余次数：**\${remaining}** 次`,
    completedReward: `✅ 获得 **+1 个额度**`,
    completedTitle: `🎉 **广告观看完成！ **`,
    completedWatched: `📊 今日已观看：**\${watched}/20** 次`,
    continueWatching: `💡 继续观看广告可获得更多额度！`,
    dailyLimitReached: `今日广告已达上限（\${max}/\${max}）`,
    getStatusFailed: `❌ 获取广告状态失败`,
    noProviders: `⚠️ 暂无可用的广告提供商`,
    pendingAd: `⚠️ 请先完成上一支广告，再开始新的广告`,
    startWatchButton: `📺 开始观看广告`,
    vipNoAds: `💎 VIP 用户无需观看广告`,
    vipNoAdsReason: `VIP 用户拥有无限配额，无需观看广告`,
    watchAdClickButton: `👇 点击下方按钮开始观看`,
    watchAdRemaining: `📊 今日剩余：**\${remaining}/20** 次`,
    watchAdReward: `🎁 完成观看可获得 **+1 个额度**`,
    watchAdTitle: `📺 **观看广告获得额度**`,
  },
  admin: {
    ad: `使用 /official_ads 查看所有广告`,
    ad2: `请使用资料库脚本添加广告提供商：
`,
    ad3: `📺 **广告提供商列表**

`,
    ad4: `请使用资料库脚本添加官方广告：
`,
    ad5: `📢 **官方广告列表**

`,
    'adConfig.adIdMustBeNumber': `❌ 广告 ID 必须是数字`,
    'adConfig.addOfficialAdScript': `请使用资料库脚本添加官方广告：`,
    'adConfig.addProviderScript': `请使用资料库脚本添加广告提供商：`,
    'adConfig.clicks': `• 点击: \${count} 次`,
    'adConfig.correctFormat': `**正确格式：**`,
    'adConfig.disableCommand': `• \`/ad_provider_disable \` - 停用 \`/ad_provider_disable <id>\``,
    'adConfig.disableFailed': `❌ 停用广告提供商失败`,
    'adConfig.disableOfficialAdCommand': `• \`/official_ad_disable \` - 停用 \`/official_ad_disable <id>\``,
    'adConfig.disableOfficialAdFailed': `❌ 停用官方广告失败`,
    'adConfig.disabled': `❌ 停用`,
    'adConfig.enableCommand': `• \`/ad_provider_enable \` - 启用 \`/ad_provider_enable <id>\``,
    'adConfig.enableFailed': `❌ 启用广告提供商失败`,
    'adConfig.enableOfficialAdCommand': `• \`/official_ad_enable \` - 启用 \`/official_ad_enable <id>\``,
    'adConfig.enableOfficialAdFailed': `❌ 启用官方广告失败`,
    'adConfig.enabled': `✅ 启用`,
    'adConfig.example': `**范例：**`,
    'adConfig.getListFailed': `❌ 获取广告提供商列表失败`,
    'adConfig.getOfficialAdListFailed': `❌ 获取官方广告列表失败`,
    'adConfig.id': `• ID: \${id}`,
    'adConfig.impressions': `• 展示: \${count} 次`,
    'adConfig.managementCommands': `**管理命令：**`,
    'adConfig.noOfficialAds': `⚠️ 目前没有官方广告`,
    'adConfig.noProviders': `⚠️ 目前没有配置任何广告提供商`,
    'adConfig.officialAdDisabled': `✅ 已停用官方广告 #\${id}`,
    'adConfig.officialAdEnabled': `✅ 已启用官方广告 #\${id}`,
    'adConfig.officialAdList': `📢 **官方广告列表**`,
    'adConfig.priority': `• 优先级: \${priority}`,
    'adConfig.priorityCommand': `• \`/ad_provider_priority \` - 设置优先级 \`/ad_provider_priority <id> <priority>\``,
    'adConfig.priorityMustBeNonNegative': `❌ 优先级必须是非负整数`,
    'adConfig.prioritySet': `✅ 已设置广告提供商优先级`,
    'adConfig.priorityValue': `优先级：\${priority}`,
    'adConfig.provider': `提供商：\${name}`,
    'adConfig.providerDisabled': `✅ 已停用广告提供商：\${name}`,
    'adConfig.providerEnabled': `✅ 已启用广告提供商：\${name}`,
    'adConfig.providerList': `📺 **广告提供商列表**`,
    'adConfig.reward': `• 奖励: \${reward} 额度`,
    'adConfig.setPriorityFailed': `❌ 设置优先级失败`,
    'adConfig.status': `• 状态: \${status}`,
    'adConfig.testMode': `• 🧪 测试模式`,
    'adConfig.type': `• 类型: \${type}`,
    'adConfig.usageError': `❌ 使用方法错误`,
    'adConfig.viewAllOfficialAds': `使用 /official_ads 查看所有广告`,
    'adConfig.viewAllProviders': `使用 /ad_providers 查看所有提供商`,
    'adConfig.viewStatsCommand': `• \`/ad_stats \` - 查看详细统计 \`/ad_stats <id>\``,
    'adConfig.weight': `• 权重: \${weight}`,
    addAlreadyAdmin: `❌ 此用户已经是管理员。`,
    addAlreadySuperAdmin: `❌ 此用户已经是超级管理员，无需添加。`,
    addCommand: `\`/admin_add <user_id>\`

`,
    addExample: `\`/admin_add 123456789\` - 添加为普通管理员

`,
    addInstructions: `⚠️ **注意**

此命令需要手动修改配置文件。 

**步骤：**
1. 编辑 \`wrangler.toml\`
2. 找到 \`ADMIN_USER_IDS\` 变数
3. 添加用户 ID：\`{userId}\`
4. 格式：\`ADMIN_USER_IDS = "ID1,ID2,{userId}"\`
5. 重新部署：\`pnpm deploy:staging\`

**用户资讯：**
• ID: \`{userId}\`
• 昵称: {nickname}
• 用户名: @{username}

💡 或在 Cloudflare Dashboard 中修改环境变数`,
    addUsageError: `❌ 使用方法错误

`,
    addUserNotFound: `❌ 用户不存在或未注册。`,
    admin: `💡 使用 /admin_list 查看当前管理员列表`,
    admin2: `管理员封禁 / Admin ban`,
    admin3: `- 添加为普通管理员

`,
    admin4: `- 移除普通管理员

`,
    admin5: `\`/admin_add 123456789\` - 添加为普通管理员

`,
    admin6: `\`/admin_remove 123456789\` - 移除普通管理员

`,
    'analytics.getAdDataFailed': `❌ 获取广告数据失败`,
    'analytics.getDataFailed': `❌ 获取分析数据失败`,
    'analytics.getVipDataFailed': `❌ 获取 VIP 漏斗数据失败`,
    'analytics.noPermission': `❌ 你没有权限查看分析数据`,
    'analytics.noPermissionAd': `❌ 你没有权限查看广告数据`,
    'analytics.noPermissionVip': `❌ 你没有权限查看 VIP 数据`,
    'analytics.onlySuperAdmin': `❌ 只有超级管理员可以使用此命令。`,
    'analytics.sendReportFailed': `❌ 发送每日报表失败：\${error}`,
    'analytics.userNotFound': `❌ 用户不存在：\${userId}`,
    appeal: `申诉 ID: \${appeal.id}
`,
    appeal2: `💡 使用以下命令审核申诉：
`,
    appeal3: `📋 待审核申诉列表

`,
    appeal4: `申诉已批准`,
    appeal5: `申诉被拒绝`,
    appealAlreadyReviewed: `❌ 申诉 {id} 已经被审核过了`,
    appealApproveUsageError: `❌ 请提供申诉 ID

用法: /admin_approve <appeal_id> [备注]`,
    appealApproved: `✅ 申诉 {id} 已批准，用户已解封`,
    appealApprovedDefault: `申诉已批准`,
    appealDivider: `━━━━━━━━━━━━━━━━
`,
    appealId: `申诉 ID: {id}
`,
    appealNotFound: `❌ 找不到申诉 ID: {id}`,
    appealReason: `理由: {reason}
`,
    appealRejectUsageError: `❌ 请提供申诉 ID

用法: /admin_reject <appeal_id> [备注]`,
    appealRejected: `✅ 申诉 {id} 已拒绝`,
    appealRejectedDefault: `申诉被拒绝`,
    appealReviewCommands: `/admin_approve <appeal_id> [备注]
/admin_reject <appeal_id> [备注]`,
    appealReviewHint: `💡 使用以下命令审核申诉：
`,
    appealSubmittedAt: `提交时间: {time}

`,
    appealUser: `用户: {user}
`,
    appealsTitle: `📋 待审核申诉列表

`,
    ban: `💡 使用 /admin_bans <user_id> 查看特定用户的封禁历史`,
    'ban.appealAlreadyReviewed': `❌ 申诉 {id} 已经被审核过了`,
    'ban.appealApproved': `申诉已批准`,
    'ban.appealApprovedUnbanned': `✅ 申诉 {id} 已批准，用户已解封`,
    'ban.appealId': `申诉 ID: {id}
`,
    'ban.appealList': `📋 待审核申诉列表

`,
    'ban.appealNotFound': `❌ 找不到申诉 ID: {id}`,
    'ban.appealReason': `理由: {reason}
`,
    'ban.appealRejected': `申诉被拒绝`,
    'ban.appealRejectedMessage': `✅ 申诉 {id} 已拒绝`,
    'ban.appealSubmittedAt': `提交时间: {time}

`,
    'ban.appealUser': `用户: {user}
`,
    'ban.banEnd': `结束: \${end}`,
    'ban.banId': `ID: \${id}`,
    'ban.banReason': `原因: \${reason}`,
    'ban.banStart': `开始: \${start}`,
    'ban.banUser': `用户: \${user}`,
    'ban.durationDays': `{days} 天`,
    'ban.durationHours': `{hours} 小时`,
    'ban.durationMustBePositive': `❌ 时长必须是正整数或 "permanent"。`,
    'ban.noAppeals': `✅ 目前没有待审核的申诉`,
    'ban.noBanRecords': `❌ 用户 \${userId} 没有封禁记录`,
    'ban.noBanRecordsList': `📊 目前没有封禁记录`,
    'ban.noPermission': `❌ 你没有权限使用此命令。`,
    'ban.notAdmin': `❌ 此用户不是管理员。`,
    'ban.permanent': `永久`,
    'ban.provideAppealId': `❌ 请提供申诉 ID

`,
    'ban.reason': `管理员封禁 / Admin ban`,
    'ban.recentBans': `📊 最近 10 条封禁记录`,
    'ban.riskScore': `风险分数: \${score}`,
    'ban.temporaryBan': `🚫 你已被暂时封禁

封禁时长：{duration}
解封时间：{unbanTime}

封禁原因：多次被举报

如有疑问，请使用 /appeal 提出申诉。`,
    'ban.totalBans': `总封禁次数: \${count}`,
    'ban.usageApprove': `用法: /admin_approve <appeal_id> [备注]`,
    'ban.usageReject': `用法: /admin_reject <appeal_id> [备注]`,
    'ban.user': `用户: \${user}`,
    'ban.userBanHistory': `📊 用户封禁历史`,
    'ban.viewHistory': `💡 使用 /admin_bans <user_id> 查看特定用户的封禁历史`,
    ban2: `总封禁次数: \${userBans.results.length}

`,
    ban3: `📊 最近 10 条封禁记录

`,
    ban4: `📊 用户封禁历史

`,
    ban5: `📊 目前没有封禁记录`,
    banUsageError: `使用方式错误`,
    banUserNotFound: `用户不存在`,
    cannotBanAdmin: `无法封禁管理员`,
    conversation: `💡 对话历史帖子只在有新消息时创建
`,
    conversation2: `所有 VIP 用户的对话历史都是最新的！`,
    conversation3: `
💬 **对话历史帖子：**
`,
    conversation4: `请检查对话历史是否已更新为清晰头像。`,
    conversation5: `🔄 开始刷新您的对话历史...`,
    conversation6: `• 无对话历史帖子
`,
    'diagnose.allUpToDateFree': `✅ 所有帖子都是最新的（免费用户状态正确）`,
    'diagnose.allUpToDateVip': `✅ 所有帖子都是最新的（VIP 状态正确）`,
    'diagnose.analysis': `🔎 **分析：**`,
    'diagnose.avatarCache': `📸 **头像缓存：**`,
    'diagnose.blurredUrl': `• 模糊 URL：\${status}`,
    'diagnose.createdWithVip': `• 创建时 VIP：\${status}`,
    'diagnose.error': `错误：\${error}`,
    'diagnose.failed': `❌ **诊断失败**`,
    'diagnose.fileId': `• File ID：\${fileId}...`,
    'diagnose.hasAvatar': `• 有头像：\${status}`,
    'diagnose.historyPosts': `💬 **对话历史帖子：**`,
    'diagnose.historyPostsHint': `💡 对话历史帖子只在有新消息时创建`,
    'diagnose.isLatest': `• 最新：\${status}`,
    'diagnose.morePosts': `...还有 \${count} 个帖子`,
    'diagnose.nickname': `• 昵称：\${nickname}`,
    'diagnose.no': `❌ 否`,
    'diagnose.noCache': `• 无缓存`,
    'diagnose.noHistoryPosts': `• 无对话历史帖子`,
    'diagnose.noHistoryPostsWarning': `⚠️ 此用户没有对话历史帖子`,
    'diagnose.none': `无`,
    'diagnose.originalUrl': `• 原始 URL：\${status}`,
    'diagnose.outdatedPostsFound': `⚠️ 发现 \${count} 个过时帖子需要刷新`,
    'diagnose.postId': `• ID：\${id}`,
    'diagnose.postTitle': `📝 **帖子 #\${identifier}-H\${postNumber}**`,
    'diagnose.postUpdatedAt': `• 更新时间：\${date}`,
    'diagnose.refreshHint': `💡 使用 /admin_refresh_vip_avatars 批量刷新`,
    'diagnose.title': `🔍 **头像诊断报告**`,
    'diagnose.totalPosts': `• 总数：\${count}`,
    'diagnose.unknown': `未知`,
    'diagnose.updatedAt': `• 更新时间：\${date}`,
    'diagnose.userId': `• ID：\${userId}`,
    'diagnose.userInfo': `👤 **用户信息：**`,
    'diagnose.username': `• 用户名：@\${username}`,
    'diagnose.vipExpire': `• VIP 到期：\${date}`,
    'diagnose.vipStatus': `• VIP 状态：\${status}`,
    'diagnose.yes': `✅ 是`,
    end: `结束: \${banEnd}

`,
    error: `错误`,
    failed: `• 失败帖子：\${results.totalPostsFailed}

`,
    failed2: `• 失败：\${results.failedUsers}
`,
    failed3: `• 失败：\${result.failed} 个帖子

`,
    insufficientPermission: `❌ **权限不足**

此命令仅限超级管理员使用。`,
    listFooter: `---`,
    listNotRegistered: `未注册`,
    listRoleAdmin: `管理员`,
    listRoleSuperAdmin: `超级管理员`,
    listTitle: `管理员列表`,
    message: `• 更新时间：\${new Date(post.updated_at).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}

`,
    message10: `• 有头像：\${post.partner_avatar_url ? '✅' : '❌'}
`,
    message11: `...还有 \${historyPosts.results.length - 5} 个帖子
`,
    message12: `用户: \${targetUser?.nickname || targetUserId}
`,
    message13: `• 用户名: @\${targetUser?.username}

`,
    message14: `用户: \${appeal.nickname || appeal.user_id}
`,
    message15: `
...还有 \${results.details.length - 10} 个用户`,
    message16: `• 用户名: @\${targetUser.username}

`,
    message17: `• 总数：\${historyPosts.results.length}

`,
    message18: `💡 使用 /admin_refresh_vip_avatars 批量刷新
`,
    message19: `• 最新：\${post.is_latest ? '✅' : '❌'}
`,
    message2: `• 更新时间：\${avatarInfo.avatar_updated_at ? new Date(avatarInfo.avatar_updated_at).toLocaleString('zh-TW') : '未知'}
`,
    message20: `• 过时帖子：\${stats.totalOutdatedPosts}

`,
    message21: `/ad_provider_priority`,
    message22: `• 需要刷新：\${stats.usersNeedingRefresh}
`,
    message23: `• 更新帖子：\${results.totalPostsUpdated}
`,
    message24: `用户: \${ban.nickname || ban.user_id}
`,
    message25: `/ad_provider_disable <provider_id>`,
    message26: `💡 或在 Cloudflare Dashboard 中修改环境变数`,
    message27: `/ad_provider_enable <provider_id>`,
    message28: `• 用户名: @\${targetUser?.username ||`,
    message29: `/admin_approve <appeal_id> [备注]
`,
    message3: `• \${username}: \${detail.postsUpdated} 更新, \${detail.postsFailed} 失败
`,
    message30: `• 展示: \${ad.impression_count} 次
`,
    message31: `• 用户名: @\${targetUser.username ||`,
    message32: `• 用户名：@\${user.username}
 {user.username || '無'} \${user.username}`,
    message33: `/admin_reject <appeal_id> [备注]`,
    message34: `• 处理用户：\${results.totalUsers}
`,
    message35: `• \`/ad_provider_enable \` - 启用
 \`/ad_provider_enable <id>\``,
    message36: `• \`/ad_provider_disable \` - 停用
 \`/ad_provider_disable <id>\``,
    message37: `• \`/ad_provider_priority \` - 设置优先级 \`/ad_provider_priority <id> <priority>\``,
    message38: `• \`/official_ad_enable \` - 启用
 \`/official_ad_enable <id>\``,
    message39: `• \`/official_ad_disable \` - 停用
 \`/official_ad_disable <id>\``,
    message4: `新到期：\${new Date(data.expire_date).toLocaleDateString('zh-TW')}
`,
    message40: `• 更新时间：\${new Date(post.updated_at).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour:`,
    message5: `到期：\${new Date(data.expire_date).toLocaleDateString('zh-TW')}
`,
    message6: `错误：\${error instanceof Error ? error.message : String(error)}`,
    message7: `• 原始 URL：\${avatarInfo.avatar_original_url ? '✅' : '❌'}
`,
    message8: `• 模糊 URL：\${avatarInfo.avatar_blurred_url ? '✅' : '❌'}
`,
    message9: `📝 **帖子 #\${post.identifier}-H\${post.post_number}**
`,
    nickname: `• 昵称: \${targetUser?.nickname ||`,
    nickname2: `• 昵称: \${targetUser.nickname ||`,
    noPendingAppeals: `✅ 目前没有待审核的申诉`,
    noPermission: `❌ 你没有权限使用此命令。`,
    onlyAdmin: `❌ 只有管理员可以使用此命令。`,
    onlySuperAdmin: `❌ 只有超级管理员可以使用此命令。`,
    operationFailed: `❌ 发生错误，请稍后再试。`,
    'refresh.allUpToDate': `所有 VIP 用户的对话历史都是最新的！`,
    'refresh.batchComplete': `✅ **批量刷新完成**`,
    'refresh.checkHint': `请检查对话历史是否已更新为清晰头像。`,
    'refresh.complete': `✅ **刷新完成**`,
    'refresh.details': `📝 **详细结果：**`,
    'refresh.duration': `⏱️ **耗时：** \${duration} 秒`,
    'refresh.error': `错误：\${error}`,
    'refresh.errorOccurred': `处理过程中发生错误，请查看日志。`,
    'refresh.failed': `❌ **刷新失败**`,
    'refresh.failedPosts': `• 失败帖子：\${count}`,
    'refresh.failedUsers': `• 失败：\${count}`,
    'refresh.moreUsers': `
...还有 \${count} 个用户`,
    'refresh.noRefreshNeeded': `✅ **无需刷新**`,
    'refresh.outdatedPosts': `• 过时帖子：\${count}`,
    'refresh.processedUsers': `• 处理用户：\${count}`,
    'refresh.processing': `⏳ 正在处理，请稍候...`,
    'refresh.startingBatchRefresh': `🔄 **开始批量刷新 VIP 头像**`,
    'refresh.startingRefresh': `🔄 开始刷新您的对话历史...`,
    'refresh.stats': `📊 **统计：**`,
    'refresh.successUsers': `• 成功：\${count}`,
    'refresh.summary': `📊 **总结：**`,
    'refresh.totalVipUsers': `• 总 VIP 用户：\${count}`,
    'refresh.updated': `• 更新：\${count} 个帖子`,
    'refresh.updatedPosts': `• 更新帖子：\${count}`,
    'refresh.userDetail': `• \${username}: \${updated} 更新, \${failed} 失败`,
    'refresh.usersNeedingRefresh': `• 需要刷新：\${count}`,
    removeCannotRemoveSuperAdmin: `❌ 无法移除超级管理员。`,
    removeCommand: `\`/admin_remove <user_id>\`

`,
    removeExample: `\`/admin_remove 123456789\` - 移除普通管理员

`,
    removeInstructions: `⚠️ **注意**

此命令需要手动修改配置文件。 

**步骤：**
1. 编辑 \`wrangler.toml\`
2. 找到 \`ADMIN_USER_IDS\` 变数
3. 移除用户 ID：\`{userId}\`
4. 格式：\`ADMIN_USER_IDS = "ID1,ID2"\`（移除 {userId}）
5. 重新部署：\`pnpm deploy:staging\`

**用户资讯：**
• ID: \`{userId}\`
• 昵称: {nickname}
• 用户名: @{username}

💡 或在 Cloudflare Dashboard 中修改环境变数`,
    removeNotAdmin: `❌ 此用户不是管理员。`,
    removeUsageError: `❌ 使用方法错误

`,
    settings: `• 昵称: \${targetUser?.nickname}
 {targetUser?.nickname || '未設定'} \${targetUser?.nickname}`,
    settings2: `• 昵称: \${targetUser.nickname}
 `,
    settings3: `• 昵称：\${user.nickname}
 `,
    settings4: `未设定`,
    settings5: `未设定`,
    settings6: `未设定`,
    short: `**范例：**
`,
    short10: `支付 ID：\\`,
    short11: `变数
`,
    short12: `用户：\\`,
    short2: `**示例：**
`,
    short3: `**步骤：**
`,
    short4: `5. 重新部署：\\`,
    short5: `4. 重新部署：\\`,
    short6: `1. 编辑 \\`,
    short7: `2. 找到 \\`,
    short8: `4. 格式：\\`,
    short9: `• 无缓存
`,
    start: `开始: \${banStart}
`,
    stats: `📊 **统计：**
`,
    stats2: `• \`/ad_stats \` - 查看详细统计 \`/ad_stats <id>\``,
    success: `• 成功：\${results.successUsers}
`,
    text: `• 优先级: \${provider.priority}
`,
    text10: `金额：\${data.amount_stars} ⭐
`,
    text11: `请求 ID：#\${data.request_id}
`,
    text12: `• 权重: \${provider.weight}
`,
    text13: `原因：\${data.error_message}
`,
    text14: `/ad_provider_disable`,
    text15: `/official_ad_disable`,
    text16: `💡 使用 /admin_refunds 查看详情`,
    text17: `/ad_provider_enable`,
    text18: `使用 /ad_providers 查看所有提供商`,
    text19: `/official_ad_enable`,
    text2: `• 奖励: \${ad.quota_reward} 额度
`,
    text20: `剩余：\${data.days_left} 天
`,
    text21: `/admin_remove 123456789`,
    text22: `理由: \${appeal.reason}
`,
    text23: `提交时间: \${createdAt}

`,
    text24: `提供商：\${providerName}
`,
    text25: `• 类型: \${ad.ad_type}
`,
    text26: `/admin_add 123456789`,
    text27: `处理过程中发生错误，请查看日志。 

`,
    text28: `优先级：\${priority}

`,
    text29: `原因: \${ban.reason}
`,
    text3: `/official_ad_disable <ad_id>`,
    text30: `原因：\${data.reason}
`,
    text31: `时间：\${timestamp}

`,
    text32: `此命令需要手动修改配置文件。 

`,
    text33: `• 状态: \${status}
`,
    text34: `🔍 **头像诊断报告**

`,
    text35: `
📸 **头像缓存：**
`,
    text36: `时间：\${timestamp}`,
    text37: `🔴 **退款请求**

`,
    text38: `📢 **系统通知**

`,
    text39: `/ad_stats`,
    text4: `风险分数: \${ban.risk_snapshot}
`,
    text40: `👤 **用户信息：**
`,
    text41: `
🔎 **分析：**
`,
    text42: `📝 **详细结果：**
`,
    text43: `⏳ 正在处理，请稍候...`,
    text44: `3. 添加用户 ID：\\`,
    text45: `3. 移除用户 ID：\\`,
    text46: `📊 **总结：**
`,
    text47: `类型：\${type}
`,
    text48: `• 🧪 测试模式
`,
    text49: `**管理命令：**
`,
    text5: `⏱️ **耗时：** \${duration} 秒

`,
    text50: `**正确格式：**
`,
    text51: `\${hours} 小时`,
    text52: `**用户资讯：**
`,
    text6: `• 更新：\${result.updated} 个帖子
`,
    text7: `数据：\${JSON.stringify(data)}
`,
    text8: `• 点击: \${ad.click_count} 次
`,
    text9: `/official_ad_enable <ad_id>`,
    unbanNotBanned: `用户未被封禁`,
    unbanUsageError: `解封使用方式错误`,
    unbanUserNotFound: `解封用户不存在`,
    userNotFound: `❌ 用户不存在。`,
    vip: `• VIP 到期：\${new Date(user.vip_expire_at).toLocaleString('zh-TW')}
`,
    vip2: `• 创建时 VIP：\${post.created_with_vip_status ? '✅' : '❌'}
`,
    vip3: `• VIP 状态：\${isVip ? '✅ 是' : '❌ 否'}
`,
    vip4: `• 总 VIP 用户：\${stats.totalVipUsers}
`,
    vip5: `🔄 **开始批量刷新 VIP 头像**

`,
    vip6: `⏰ **VIP 到期提醒已发送**

`,
    vip7: `🎉 **新 VIP 购买**

`,
    vip8: `⬇️ **VIP 自动降级**

`,
    vip9: `🔄 **VIP 续费**

`,
  },
  adminNotification: {
    amount: `金额：\${stars} ⭐`,
    data: `数据：\${data}`,
    daysLeft: `剩余：\${days} 天`,
    expireDate: `到期：\${date}`,
    newExpireDate: `新到期：\${date}`,
    paymentFailed: `❌ **支付失败**`,
    paymentId: `支付 ID：\`\${id}\``,
    reason: `原因：\${reason}`,
    refundRequest: `🔴 **退款请求**`,
    requestId: `请求 ID：#\${id}`,
    systemNotification: `📢 **系统通知**`,
    time: `时间：\${time}`,
    type: `类型：\${type}`,
    user: `用户：\`\${userId}\``,
    viewRefundsHint: `💡 使用 /admin_refunds 查看详情`,
    vipDowngraded: `⬇️ **VIP 自动降级**`,
    vipPurchased: `🎉 **新 VIP 购买**`,
    vipReminderSent: `⏰ **VIP 到期提醒已发送**`,
    vipRenewed: `🔄 **VIP 续费**`,
  },
  age: {
    daysAgo: `\${days} 天前`,
    hoursAgo: `\${hours} 小时前`,
    justNow: `刚刚`,
  },
  analytics: {
    ad: `• 官方广告：
 - 展示：{officialImpressions} 次
 - 点击：{officialClicks} 次
 - CTR：{officialCtr}%
 - 奖励发放：{officialRewardsGranted} 个额度

• VIP 页面访问：{vipPageViews} 次
• 购买意向：{vipPurchaseIntents} 次
• 成功转化：{vipConversions} 次
• 转化率：{vipConversionRate}%
• 收入：\\\\\\\\\\\${vipRevenue}`,
    ad2: `📊 **广告效果报表**
📅 期间：{start} ~ {end}

• 总展示：{thirdPartyImpressions} 次
• 总完成：{thirdPartyCompletions} 次
• 完成率：{thirdPartyCompletionRate}%
• 总奖励：{thirdPartyRewardsGranted} 个额度

• 总展示：{officialImpressions} 次
• 总点击：{officialClicks} 次
• CTR：{officialCtr}%
• 总奖励：{officialRewardsGranted} 个额度`,
    ad3: `📊 **广告效果报表**
📅 期间：{start} ~ {end}

⚠️ **目前还没有广告数据**

这可能是因为：
• 广告提供商尚未配置
• 还没有用户观看广告
• 选定的时间范围内没有广告活动

💡 **数据何时会出现？ **
• 需要完成以下配置：
 1. 配置广告提供商（GigaPub 等）
 2. 创建官方广告
 3. 用户开始观看广告

• 建议先配置广告提供商
• 然后等待用户开始使用广告功能`,
    complete: `
• 完成率：\${provider.completion_rate.toFixed(1)}%`,
    complete2: `
• 完成：\${provider.total_completions} 次`,
    completion: `
• 完成：{completions} 次`,
    completionRate: `
• 完成率：{rate}%`,
    conversionStepsTitle: `[需要从 zh-TW.ts 获取翻译]`,
    invite: `• 发起邀请：{initiated} 次
• 接受邀请：{accepted} 次
• 激活邀请：{activated} 次
• 转化率：{conversionRate}%

• 丢瓶子：{bottlesThrown} 个
• 捡瓶子：{bottlesCaught} 个
• 新对话：{conversationsStarted} 个
• 平均对话轮次：{avgConversationRounds}

💡 详细数据：/analytics`,
    message: `📊 **每日运营报表**
📅 日期：{date}

**👥 用户数据**
• 新增用户：{newUsers} 人
• 活跃用户（DAU）：{dau} 人
• 留存率（D1）：{d1Retention}%
• 平均使用时长：{avgSessionDuration} 分钟

**📺 广告数据**
• 第三方广告：
 - 展示：{thirdPartyImpressions} 次
 - 完成：{thirdPartyCompletions} 次
 - 完成率：{thirdPartyCompletionRate}%
 - 奖励发放：{thirdPartyRewardsGranted} 个额度`,
    message2: `📊 **每日运营报表**
📅 日期：{date}

⚠️ **今日还没有数据**

这可能是因为：
• 系统刚部署，还没有用户活动
• 今天还没有用户使用 Bot
• 数据追踪功能尚未启用

💡 **数据何时会出现？ **
• 需要用户执行以下任一操作：
 - 发送 /start 注册
 - 丢瓶子或捡瓶子
 - 观看广告
 - 购买 VIP

• 建议等待用户开始使用后再查看
• 或者在测试环境中模拟用户行为`,
    message3: `

**📈 总转化率：\${report.overall_conversion_rate.toFixed(1)}%**`,
    message4: `
• 转化率：\${step.conversion_rate.toFixed(1)}%`,
    message5: `
• 错误率：\${provider.error_rate.toFixed(1)}%`,
    message6: `
• 请求：\${provider.total_requests} 次`,
    providerComparisonTitle: `[需要从 zh-TW.ts 获取翻译]`,
    purchaseSuccess: `[需要从 zh-TW.ts 获取翻译]`,
    request: `
• 请求：{requests} 次`,
    text: `
• 用户数：\${step.user_count}`,
    text2: `购买意向（点击购买）`,
    vip: `📊 **VIP 转化漏斗**
📅 期间：{start} ~ {end}

⚠️ **目前还没有数据**

这可能是因为：
• 系统刚部署，还没有用户活动
• 选定的时间范围内没有 VIP 相关事件
• 数据追踪功能尚未启用

💡 **数据何时会出现？ **
• VIP 转化数据需要用户执行以下操作：
 1. 查看 VIP 功能介绍
 2. 点击购买 VIP
 3. 完成 VIP 购买

• 建议等待 24-48 小时后再查看
• 或者先在测试环境中模拟用户行为`,
    vip2: `📊 **VIP 转化漏斗**
📅 期间：{start} ~ {end}`,
    vip3: `认知（看到 VIP 提示）`,
    vip4: `考虑（查看 VIP 详情）`,
    vip5: `兴趣（点击查看 VIP）`,
  },
  appeal: {
    alreadyExists: `⏳ 你已有一个待处理的申诉（编号：#\${appealId}）

状态：\${status}
提交时间：\${time}

请耐心等待管理员审核。`,
    notBanned: `✅ 你的帐号未被封禁，无需申诉。`,
    notFound: `❌ 找不到你的申诉记录。`,
    notes: `备注：`,
    prompt: `📝 **提交申诉**

请说明你认为帐号被封禁的原因，以及你希望如何解决这个问题。 

💡 请详细描述你的情况，这有助于管理员更快地处理你的申诉。`,
    reasonTooLong: `❌ 申诉原因太长，请控制在 500 字以内。`,
    reasonTooShort: `❌ 申诉原因太短，请至少输入 10 个字。`,
    reviewedAt: `审核时间：`,
    status: `📋 **申诉状态**

申诉编号：#\${appealId}
状态：\${status}
提交时间：\${createdAt}\${reviewInfo ? '

' + reviewInfo : ''}`,
    statusApproved: `已批准`,
    statusPending: `待审核`,
    statusRejected: `已拒绝`,
    submitted: `✅ **申诉已提交**

申诉编号：#\${appealId}
状态：待审核

我们会在 1-3 个工作日内处理你的申诉。 
处理结果会通过 Bot 通知你。`,
  },
  block: {
    cannotIdentify: `⚠️ 无法识别对话对象`,
    catchNewBottle: `💡 使用 /catch 捡新的漂流瓶开始新对话。`,
    conversationInfoError: `⚠️ 对话资讯错误。`,
    conversationMayEnded: `对话可能已结束或不存在。`,
    conversationNotFound: `⚠️ 找不到此对话`,
    ensureReply: `请确保回覆的是对方发送的讯息（带有 # 标识符）。`,
    hint: `💡 这样可以准确指定要封锁的对象。`,
    replyRequired: `⚠️ 请长按你要封锁的讯息后回覆指令`,
    step1: `1️⃣ 长按对方的讯息`,
    step2: `2️⃣ 选择「回覆」`,
    step3: `3️⃣ 输入 /block`,
    steps: `**操作步骤：**`,
    success: `✅ 已封锁此使用者 (#\${identifier})`,
    willNotMatch: `你们将不会再被匹配到对方的漂流瓶。`,
  },
  bottle: {
    bottle13: `瓶子内容`,
    cancelled: `❌ 已取消 \${zodiac}`,
    'catch.anonymousUser': `匿名用户`,
    'catch.back': `🏠 返回主选单：/menu`,
    'catch.banned': `❌ 你的帐号已被封禁，无法捡漂流瓶。 

如有疑问，请使用 /appeal 申诉。`,
    'catch.block': `• 不想再聊可使用 /block 封锁
`,
    'catch.bottle': `😔 目前没有适合你的漂流瓶

`,
    'catch.bottle2': `• 或者自己丢一个瓶子：/throw`,
    'catch.bottle3': `🎣 有人捡到你的漂流瓶了！ 

`,
    'catch.bottle4': `🧴 你捡到了一个漂流瓶！ 

`,
    'catch.bottle5': `💡 明天再来捡更多瓶子吧！`,
    'catch.bottleTaken': `❌ 这个瓶子已经被其他人捡走了，请试试其他瓶子！`,
    'catch.catch': `📊 今日已捡：\\\${newCatchesCount}/\\\${quota}

`,
    'catch.conversation': `已为你们建立了匿名对话，快来开始聊天吧～

`,
    'catch.conversation2': `• 这是匿名对话，请保护个人隐私
`,
    'catch.conversation3': `📊 查看所有对话`,
    'catch.language': `🗣️ 语言：\\\${language}

`,
    'catch.mbti': `🧠 MBTI：\\\${mbti}
`,
    'catch.message': `💫 配对度：\\\${Math.round(matchScore)}分 (智能配对)

`,
    'catch.message2': `\\\${catcherGender} | 📅 \\\${catcherAge}岁

`,
    'catch.message3': `conv_reply_\\\${conversationIdentifier}`,
    'catch.message4': `2️⃣ 长按此讯息，选择「回覆」后输入内容

`,
    'catch.message5': `1️⃣ 点击下方「💬 回覆讯息」按钮
`,
    'catch.message6': `2️⃣ 长按此讯息，选择「回覆」后输入内容`,
    'catch.nickname': `📝 昵称：\\\${ownerMaskedNickname}
`,
    'catch.nickname2': `📝 昵称：\\\${catcherNickname}
`,
    'catch.notRegistered': `❌ 请先完成注册流程才能捡漂流瓶。 

使用 /start 继续注册。`,
    'catch.originalContent': `原文：{content}`,
    'catch.originalLanguage': `原文语言：{language}`,
    'catch.quotaExhausted': `❌ 今日漂流瓶配额已用完（\\\${quotaDisplay}）`,
    'catch.replyButton': `💬 回覆讯息`,
    'catch.replyMethods': `💡 **两种回覆方式**：
`,
    'catch.report': `• 遇到不当内容请使用 /report 举报
`,
    'catch.safetyTips': `⚠️ 安全提示：
`,
    'catch.settings': `🧠 MBTI：\\\${bottle.mbti_result}
 `,
    'catch.settings10': `未设定`,
    'catch.settings11': `未设定`,
    'catch.settings2': `未设定`,
    'catch.settings3': `未设定`,
    'catch.settings4': `未设定`,
    'catch.settings5': `未设定`,
    'catch.settings6': `未设定`,
    'catch.settings7': `未设定`,
    'catch.settings8': `未设定`,
    'catch.settings9': `未设定`,
    'catch.short': `💡 提示：
`,
    'catch.short2': `• 稍后再试
`,
    'catch.short3': `匿名用户`,
    'catch.short4': `♂️ 男`,
    'catch.short5': `♀️ 女`,
    'catch.text': `翻译语言：\\\${catcherLangDisplay}
`,
    'catch.text2': `原文语言：\\\${bottleLangDisplay}
`,
    'catch.text3': `🗣️ 语言：\\\${ownerLanguage}

`,
    'catch.text4': `• 不想再聊可使用 /block 封锁

`,
    'catch.text5': `原文：\\\${bottle.content}
`,
    'catch.text6': `💬 翻译服务暂时有问题，已使用备援翻译
`,
    'catch.text7': `翻译：\\\${bottleContent}
`,
    'catch.text8': `💡 **两种回覆方式**：
`,
    'catch.translatedContent': `翻译：{content}`,
    'catch.translatedLanguage': `翻译语言：{language}`,
    'catch.translationServiceFallback': `💬 翻译服务暂时有问题，已使用备援翻译`,
    'catch.translationServiceUnavailable': `⚠️ 翻译服务暂时无法使用，以下为原文`,
    'catch.unknown': `未知`,
    'catch.zodiac': `⭐ 星座：\\\${bottle.zodiac}
`,
    'catch.zodiac2': `⭐ 星座：\\\${catcherZodiac}
`,
    containsUrl: `瓶子内容不允许包含任何连结`,
    empty: `瓶子内容不能为空`,
    friendlyContent: `• 友善、尊重的内容更容易被捡到哦～`,
    inappropriate: `瓶子内容包含不适当的内容，请修改后重新提交`,
    selected: `已选择：\${selected}`,
    selectedItem: `✅ 已选择 \${zodiac}`,
    'throw.age': `• 年龄区间相近 ✓`,
    'throw.aiModerationFailed': `AI 内容审核失败`,
    'throw.back': `↩️ 返回筛选选单`,
    'throw.bloodType': `🩸 **血型筛选**

`,
    'throw.bloodType2': `• 血型：筛选特定血型
`,
    'throw.bloodType3': `选择你想要配对的血型：`,
    'throw.bloodType4': `🩸 血型筛选`,
    'throw.bloodType5': `🌈 任何血型`,
    'throw.bottle': `
💡 这个瓶子和你非常合拍！ 
\\\${highlights.join('
')}
`,
    'throw.bottle10': `🍾 漂流瓶已丢出！ 

`,
    'throw.bottle11': `🍾 丢漂流瓶`,
    'throw.bottle2': `🎯 你的瓶子已发送给 **3 个对象**：
`,
    'throw.bottle3': `🍾 **正在丢出你的漂流瓶...**

`,
    'throw.bottle4': `🍾 **丢漂流瓶** #THROW

`,
    'throw.bottle5': `瓶子 ID：#\\\${bottleId}

`,
    'throw.bottle6': `📝 **请输入你的漂流瓶内容**

`,
    'throw.bottle7': `1️⃣ 点击下方「🍾 丢漂流瓶」按钮
`,
    'throw.bottle8': `📝 请输入你的漂流瓶内容：

`,
    'throw.bottle9': `📝 请输入你的漂流瓶内容：`,
    'throw.cancel': `💡 点击选择或取消 MBTI 类型：`,
    'throw.cancel2': `💡 点击选择或取消星座：`,
    'throw.catch': `• 槽位 3：公共池（等待捡起）

`,
    'throw.catch2': `• 槽位 2：公共池（等待捡起）
`,
    'throw.catch3': `• 槽位 1：公共池（等待捡起）
`,
    'throw.catch4': `🌊 等待有缘人捡起...
`,
    'throw.complete': `⚙️ **进阶筛选**

\\\${summary}
💡 继续调整或完成筛选：`,
    'throw.complete2': `🎯 **第 1 个配对已完成：**
`,
    'throw.complete3': `📝 你有一个未完成的草稿

`,
    'throw.complete4': `⏳ 预计 3-5 秒完成`,
    'throw.complete5': `⏳ 预计 2-3 秒完成`,
    'throw.complete6': `⏳ 预计 1-2 秒完成`,
    'throw.conversation': `💬 对话标识符：\\\${vipMatchInfo.conversationIdentifier}

`,
    'throw.conversation2': `💡 提示：每个对话都是独立的，可以同时进行

`,
    'throw.conversation3': `💡 你可能会收到 **最多 3 个对话**！ 
`,
    'throw.conversation4': `💬 你可能会收到 **最多 3 个对话**！ 
`,
    'throw.conversation5': `使用 /chats 查看所有对话

`,
    'throw.conversation6': `📊 使用 /chats 查看所有对话`,
    'throw.conversation7': `使用 /chats 查看所有对话`,
    'throw.currentSelection': `当前选择：{genderText}`,
    'throw.gender': `• 性别：\\\${selectedGender}
`,
    'throw.gender2': `👤 **性别筛选**

`,
    'throw.gender3': `• 性别：筛选性别

`,
    'throw.gender4': `💡 选择你想要的性别：`,
    'throw.gender5': `👤 性别筛选`,
    'throw.genderLabel': `• 性别：{gender}
`,
    'throw.mbti': `• MBTI：\\\${selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '无限制'}
 {selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '無限制'} \${selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '無限制'}`,
    'throw.mbti2': `已选择：\\\${selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '无'}

 {selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '無'} \${selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '無'}`,
    'throw.mbti3': `已选择：\\\${selectedMBTI.length > 0 ? selectedMBTI.join(`,
    'throw.mbti4': `🧠 **MBTI 筛选**

`,
    'throw.mbti5': `• MBTI：筛选特定性格类型
`,
    'throw.mbti6': `• MBTI 高度配对 ✓`,
    'throw.mbti7': `🧠 MBTI 筛选`,
    'throw.mbtiLabel': `• MBTI：{mbti}
`,
    'throw.message': `已选择：\\\${selectedZodiac.length > 0 ? selectedZodiac.map((z) => ZODIAC_NAMES[z]).join(', ') : '无'}

`,
    'throw.message2': `当前选择：\\\${currentGender}

`,
    'throw.message3': `已选择：\\\${selectedZodiac.length > 0 ? selectedZodiac.map((z) => ZODIAC_NAMES[z]).join(`,
    'throw.message4': `当前选择：\\\${bloodTypeDisplay[currentBloodType]}

`,
    'throw.message5': `👤 对方：\\\${vipMatchInfo.matcherNickname}
`,
    'throw.message6': `「你好！我是一个喜欢音乐和电影的人，希望认识志同道合的朋友～」

`,
    'throw.message7': `💡 可在 /edit_profile 中修改匹配偏好

`,
    'throw.message8': `💬 直接按 /reply 回覆讯息开始聊天
`,
    'throw.nickname': `📝 对方昵称：\\\${matchedUserMaskedNickname}
`,
    'throw.quota': `• 更多配额（30 个/天）
`,
    'throw.quota2': `🎁 邀请好友可增加配额：
`,
    'throw.settings': `🧠 MBTI：\\\${matchResult.user.mbti_result}
 `,
    'throw.settings2': `⭐ 星座：\\\${matchResult.user.zodiac}
 `,
    'throw.settings3': `🧠 MBTI：\\\${user.mbti_result}
 `,
    'throw.settings4': `⭐ 星座：\\\${user.zodiac_sign}
 `,
    'throw.settings5': `未设定`,
    'throw.settings6': `未设定`,
    'throw.settings7': `未设定`,
    'throw.settings8': `未设定`,
    'throw.short': `• 语言相同 ✓`,
    'throw.short10': `♋ 巨蟹座`,
    'throw.short11': `♌ 狮子座`,
    'throw.short12': `♍ 处女座`,
    'throw.short13': `♎ 天秤座`,
    'throw.short14': `♏ 天蝎座`,
    'throw.short15': `♐ 射手座`,
    'throw.short16': `♑ 摩羯座`,
    'throw.short17': `♒ 水瓶座`,
    'throw.short18': `♓ 双鱼座`,
    'throw.short19': `违规行为`,
    'throw.short2': `🩸 AB 型`,
    'throw.short20': `无限制`,
    'throw.short21': `无限制`,
    'throw.short22': `无限制`,
    'throw.short23': `无限制`,
    'throw.short3': `🌈 任何人`,
    'throw.short4': `🩸 A 型`,
    'throw.short5': `🩸 B 型`,
    'throw.short6': `🩸 O 型`,
    'throw.short7': `♈ 白羊座`,
    'throw.short8': `♉ 金牛座`,
    'throw.short9': `♊ 双子座`,
    'throw.start': `✍️ 重新开始`,
    'throw.success': `一次丢瓶子 = 3 个对象，大幅提升配对成功率

`,
    'throw.success2': `✨ **VIP 特权启动！智能配对成功！ **

`,
    'throw.success3': `🎯 你的漂流瓶已被配对成功！ 

`,
    'throw.text': `💝 匹配度：\\\${matchPercentage}%
`,
    'throw.text10': `🎯 正在为你寻找最佳配对对象

`,
    'throw.text11': `
💬 等待对方回覆中...
`,
    'throw.text12': `• 免费用户：最多 +7 个
`,
    'throw.text13': `• 不要包含个人联络方式

`,
    'throw.text14': `💡 **两种输入方式**：
`,
    'throw.text15': `📊 免费用户：3 个/天
`,
    'throw.text16': `选择你想要筛选的条件：

`,
    'throw.text17': `• 进阶筛选和翻译

`,
    'throw.text18': `创建时间：\\\${age}
`,
    'throw.text19': `使用 /vip 立即升级`,
    'throw.text2': `• 🆕 三倍曝光机会（1 次 = 3 个对象）
`,
    'throw.text20': `💬 **范例**：
`,
    'throw.text21': `使用 /vip 了解更多`,
    'throw.text22': `要继续编辑这个草稿吗？`,
    'throw.text23': `💡 可以组合多个条件`,
    'throw.text24': `当前筛选条件：

`,
    'throw.text3': `💡 这可能需要几秒钟，我们正在为你找到最合适的人`,
    'throw.text4': `当前选择：\\\${currentGender ===`,
    'throw.text5': `🎯 寻找对象：\\\${targetText}
`,
    'throw.text6': `🎯 正在为你寻找 3 个最佳配对对象

`,
    'throw.text7': `📨 **另外 2 个槽位等待中：**
`,
    'throw.text8': `🔍 正在智能匹配最佳对象...

`,
    'throw.text9': `内容预览：\\\${preview}

`,
    'throw.throw': `📊 今日已丢：\\\${quotaDisplay}

`,
    'throw.unlimited': `无限制`,
    'throw.vip': `💎 VIP 用户：30 个/天（三倍曝光）

`,
    'throw.vip2': `💎 **升级 VIP 可获得三倍曝光机会！ **
`,
    'throw.vip3': `⚙️ **进阶筛选（VIP 专属）**

`,
    'throw.vip4': `• VIP 用户：最多 +70 个

`,
    'throw.vip5': `✨ **VIP 特权启动！ **

`,
    'throw.vip6': `💡 升级 VIP 获得：
`,
    'throw.vip7': `✨ VIP 特权启动中
`,
    'throw.zodiac': `• 星座：\\\${selectedZodiac.length > 0 ? selectedZodiac.map((z) => ZODIAC_NAMES[z]).join(', ') : '无限制'}
`,
    'throw.zodiac2': `⭐ 星座：\\\${matchResult.user.zodiac ||`,
    'throw.zodiac3': `⭐ 星座：\\\${user.zodiac_sign ||`,
    'throw.zodiac4': `⭐ **星座筛选**

`,
    'throw.zodiac5': `• 星座：筛选特定星座
`,
    'throw.zodiac6': `• 星座高度相容 ✓`,
    'throw.zodiac7': `⭐ 星座筛选`,
    'throw.zodiacLabel': `• 星座：{zodiac}
`,
    tips: `💡 提示：`,
    tooLong: `瓶子内容太长，最多 \${max} 个字符（目前 \${current} 个字符）`,
    tooShort: `瓶子内容太短，至少需要 \${min} 个字符（目前 \${current} 个字符）`,
  },
  broadcast: {
    admin: `管理员手动取消`,
    admin2: `管理员手动清理（广播卡住）`,
    allBroadcastsNormal: `所有广播状态正常。`,
    broadcastNotFound: `❌ 找不到该广播记录`,
    cancelCommand: `/broadcast_cancel 

`,
    cancelCorrectFormat: `**正确格式：**
`,
    cancelExample: `**示例：**
`,
    cancelExampleCommand: `/broadcast_cancel 1`,
    cancelFailed: `❌ 取消广播失败：{error}`,
    cancelUsageError: `❌ 使用方法错误

`,
    cancelled: `✅ 广播已取消

`,
    cancelledId: `ID: {id}
`,
    cancelledStatus: `状态: 已取消

`,
    checkProgressLater: `
请稍后使用 /broadcast_status 查看进度。`,
    cleanupFailed: `❌ 清理广播失败：{error}`,
    cleanupIds: `广播 ID: {ids}

`,
    cleanupMarkedFailed: `这些广播已标记为「失败」状态
`,
    cleanupSuccess: `✅ 已清理 {count} 个卡住的广播

`,
    cleanupViewStatus: `使用 /broadcast_status 查看更新后的记录。`,
    completedAt: `完成时间: {time}
`,
    correctFormat: `**正确格式：**
`,
    createFailed: `❌ 创建广播失败，请稍后再试。`,
    createFailedShort: `❌ 创建广播失败。`,
    created: `✅ 广播已创建

`,
    empty: `广播讯息不能为空`,
    error: `错误: {error}`,
    'estimate.immediate': `立即发送（约 1-2 秒）`,
    'estimate.minutes': `约 \\\${minutes} 分钟`,
    'estimate.seconds': `约 \\\${seconds} 秒`,
    estimatedTime: `预计时间: {time}

`,
    example: `**示例：**
`,
    exampleMessage: `系统将于今晚 22:00 进行维护`,
    failed: `失败: {count}
`,
    'filter.age': `年龄：{min}-{max} 岁`,
    'filter.atLeastOneRequired': `至少需要一个过滤器`,
    'filter.birthdayToday': `当天生日`,
    'filter.country': `国家：{country}`,
    'filter.genderFemale': `女性`,
    'filter.genderMale': `男性`,
    'filter.genderOther': `其他性别`,
    'filter.invalidAgeFormat': `无效的年龄范围：{value}（格式必须是 min-max，如 18-25）`,
    'filter.invalidAgeMinMax': `无效的年龄范围：{value}（最小年龄不能大于最大年龄）`,
    'filter.invalidAgeRange': `无效的年龄范围：{value}（年龄必须在 18-99 之间）`,
    'filter.invalidCountry': `无效的国家代码：{value}（必须是 2 个大写字母，如 TW, US, JP）`,
    'filter.invalidFormat': `无效的过滤器格式：{pair}`,
    'filter.invalidGender': `无效的性别值：{value}（必须是 male, female 或 other）`,
    'filter.invalidMbti': `无效的 MBTI 类型：{value}（必须是以下之一：{mbtis}）`,
    'filter.invalidZodiac': `无效的星座：{value}（必须是以下之一：{zodiacs}）`,
    'filter.mbti': `MBTI：{mbti}`,
    'filter.nonVipUsers': `非 VIP 用户`,
    'filter.unknownFilter': `未知的过滤器：{key}`,
    'filter.vipUsers': `VIP 用户`,
    'filter.zodiacAquarius': `水瓶座`,
    'filter.zodiacAries': `白羊座`,
    'filter.zodiacCancer': `巨蟹座`,
    'filter.zodiacCapricorn': `摩羯座`,
    'filter.zodiacGemini': `双子座`,
    'filter.zodiacLeo': `狮子座`,
    'filter.zodiacLibra': `天秤座`,
    'filter.zodiacPisces': `双鱼座`,
    'filter.zodiacSagittarius': `射手座`,
    'filter.zodiacScorpio': `天蝎座`,
    'filter.zodiacTaurus': `金牛座`,
    'filter.zodiacVirgo': `处女座`,
    filterAge: `• age=18-25
`,
    filterCommand: `/broadcast_filter 

`,
    filterConfirmConditions: `**过滤条件：**
{conditions}

`,
    filterConfirmMessage: `**讯息内容：**
{message}

`,
    filterConfirmTitle: `🔍 **广播过滤器确认**

`,
    filterCorrectFormat: `**正确格式：**
`,
    filterCountry: `• country=TW|US|JP|...
`,
    filterCreateFailed: `❌ 创建过滤广播失败

{error}`,
    filterCreated: `✅ 过滤广播已创建

`,
    filterCreatedConditions: `过滤条件: {conditions}
`,
    filterCreatedEstimatedTime: `预计时间: {time}

`,
    filterCreatedId: `ID: {id}
`,
    filterCreatedSending: `广播将在后台发送，使用 /broadcast_status {id} 查看进度。`,
    filterCreatedUserCount: `符合用户数: {count} 人
`,
    filterExample1: `/broadcast_filter gender=female,age=18-25,country=TW 大家好！ 
`,
    filterExample2: `/broadcast_filter vip=true,mbti=INTJ VIP 专属活动通知
`,
    filterExample3: `/broadcast_filter zodiac=Scorpio 天蝎座专属讯息`,
    filterExamples: `**示例：**
`,
    filterFormat: `**过滤器格式：**
`,
    filterFormatError: `❌ 过滤器格式错误

{error}

`,
    filterGender: `• gender=male|female|other
`,
    filterMbti: `• mbti=INTJ|ENFP|...
`,
    filterQueryingUsers: `正在查询符合条件的用户...`,
    filterUsageError: `❌ 使用方法错误

`,
    filterViewFormat: `请使用 /broadcast_filter 查看正确格式。`,
    filterVip: `• vip=true|false

`,
    filterZodiac: `• zodiac=Aries|Taurus|...
`,
    foundStuckBroadcasts: `⚠️ 发现 {count} 个卡住的广播

`,
    id: `ID: {id}
`,
    idMustBeNumber: `❌ 广播 ID 必须是数字`,
    maxUsersExceeded: `❌ 当前广播系统仅支持 \${max} 个用户以内的广播。 

目标用户数：\${current}`,
    messageContent: `讯息内容`,
    noPendingBroadcasts: `目前没有待处理或卡住的广播。 

`,
    noRecords: `📊 目前没有广播记录`,
    noStuckBroadcasts: `✅ 没有需要清理的广播

`,
    processQueueFailed: `❌ 处理广播队列失败：{error}`,
    processingBroadcast: `正在处理广播 #{id}
`,
    progress: `进度: {sent}/{total} ({percentage}%)
`,
    queryStatusFailed: `❌ 查询广播状态失败：{error}`,
    queueProcessed: `✅ 广播队列处理完成

`,
    queueRemaining: `
队列中还有 {count} 个广播待处理
`,
    queueTriggered: `{emoji} 广播队列处理已触发

`,
    recentRecords: `📊 最近 5 条广播记录

`,
    recordId: `ID: {id}
`,
    recordProgress: `进度: {sent}/{total}
`,
    recordStatus: `状态: {status}
`,
    recordTarget: `目标: {type}
`,
    recordTime: `时间: {time}

`,
    sendingInBackground: `广播将在后台发送，使用 /broadcast_status {id} 查看进度。`,
    short: `待处理`,
    short2: `等待中`,
    startedAt: `开始时间: {time}
`,
    status: `状态：{status}
`,
    'status.cancelled': `已取消`,
    'status.completed': `已完成`,
    'status.failed': `失败`,
    'status.pending': `等待中`,
    'status.sending': `发送中`,
    statusPending: `待处理`,
    statusStuck: `卡住（重试中）`,
    statusTitle: `📊 广播状态`,
    stuckBroadcastConfirm: `**确认清理？ **
`,
    stuckBroadcastConfirmCommand: `使用 \`/broadcast_cleanup confirm\` 确认`,
    stuckBroadcastDivider: `━━━━━━━━━━━━━━━━
`,
    stuckBroadcastId: `**ID: {id}**
`,
    stuckBroadcastMessage: `讯息: {message}
`,
    stuckBroadcastNoRetry: `不会再被自动处理或重新发送

`,
    stuckBroadcastProgress: `进度: {sent}/{total}
`,
    stuckBroadcastStartTime: `开始时间: {time}

`,
    stuckBroadcastTarget: `目标: {type}
`,
    stuckBroadcastWillMarkFailed: `这些广播将被标记为「失败」状态
`,
    target: `目标: {target}
`,
    'target.all': `所有用户`,
    'target.nonVip': `非 VIP 用户`,
    'target.unknown': `未知`,
    'target.vip': `VIP 用户`,
    targetAll: `所有用户`,
    targetNonVip: `非 VIP 用户`,
    targetType: `目标：{type}
`,
    targetVip: `VIP 用户`,
    tooLong: `广播讯息不能超过 \${max} 个字符（目前 \${current} 个字符）`,
    upgradeRequired: `大规模广播需要升级系统架构，请参考 BROADCAST_SYSTEM_REDESIGN.md`,
    usageError: `❌ 使用方法错误

`,
    userCount: `用户数: {count} 人
`,
    userCount2: `用户数：{count} 人
`,
    viewAllRecords: `使用 /broadcast_status 查看所有广播记录。`,
    viewDetailsHint: `💡 使用 /broadcast_status 查看详细信息`,
    viewUpdatedStatus: `使用 /broadcast_status 查看更新后的状态。`,
  },
  buttons: {
    ad: `➡️ 下一个广告`,
    back: `⬅️ 返回 / Back`,
    bottle: `📺 看广告获取更多瓶子 🎁 (\${remaining}/20)`,
    bottle2: `💎 升级 VIP 获得更多瓶子`,
    bottle3: `🌊 丢出漂流瓶`,
    bottle4: `🎣 捡起漂流瓶`,
    cancel: `取消`,
    help: `❓ 帮助`,
    invite: `👥 查看邀请码`,
    invite2: `🎁 邀请好友`,
    mbtiMenu: `🧠 MBTI 选单`,
    message: `💬 回覆讯息`,
    profile: `✏️ 编辑个人资料`,
    profile2: `👤 个人资料`,
    returnToMenu: `🏠 返回主选单`,
    settings: `⚙️ 设定`,
    short: `🇲🇾 马来西亚`,
    short10: `🇺🇸 美国`,
    short11: `🇯🇵 日本`,
    short12: `🇰🇷 韩国`,
    short13: `🇬🇧 英国`,
    short14: `🇫🇷 法国`,
    short15: `🇩🇪 德国`,
    short16: `🇹🇭 泰国`,
    short17: `🇦🇺 澳洲`,
    short18: `💬 聊天记录`,
    short19: `🌐 变更语言`,
    short2: `🇺🇳 联合国旗`,
    short20: `🎁 领取奖励`,
    short21: `🔄 清除选择`,
    short22: `跳过`,
    short3: `📢 加入官方频道`,
    short4: `🇸🇬 新加坡`,
    short5: `🇨🇦 加拿大`,
    short6: `🇳🇿 纽西兰`,
    short7: `🇹🇼 台湾`,
    short8: `🇨🇳 中国`,
    short9: `🇭🇰 香港`,
    stats: `📊 统计数据`,
    targetAdvanced: `⚙️ 进阶筛选（MBTI/星座）`,
    targetAny: `🌈 任何人都可以`,
    targetFemale: `👩 女生`,
    targetMale: `👨 男生`,
    text: `👤 查看对方资料卡`,
    vip: `💎 升级 VIP`,
  },
  catch: {
    anonymousUser: `匿名用户`,
    back: `🏠 返回主选单：/menu`,
    banned: `❌ 你的帐号已被封禁，无法捡漂流瓶。 

如有疑问，请使用 /appeal 申诉。`,
    block: `• 不想再聊可使用 /block 封锁
`,
    bottle: `😔 目前没有适合你的漂流瓶

`,
    bottle2: `• 或者自己丢一个瓶子：/throw`,
    bottle3: `🎣 有人捡到你的漂流瓶了！ 

`,
    bottle4: `🧴 你捡到了一个漂流瓶！ 

`,
    bottle5: `💡 明天再来捡更多瓶子吧！`,
    bottleTaken: `❌ 这个瓶子已经被其他人捡走了，请试试其他瓶子！`,
    catch: `📊 今日已捡：\${newCatchesCount}/\${quota}

`,
    conversation: `已为你们建立了匿名对话，快来开始聊天吧～

`,
    conversation2: `• 这是匿名对话，请保护个人隐私
`,
    conversation3: `📊 查看所有对话`,
    conversationError: `对话创建失败`,
    language: `🗣️ 语言：\${language}

`,
    mbti: `🧠 MBTI：\${mbti}
`,
    message: `💫 配对度：\${Math.round(matchScore)}分 (智能配对)

`,
    message2: `\${catcherGender} | 📅 \${catcherAge}岁

`,
    message3: `conv_reply_\${conversationIdentifier}`,
    message4: `2️⃣ 长按此讯息，选择「回覆」后输入内容

`,
    message5: `1️⃣ 点击下方「💬 回覆讯息」按钮
`,
    message6: `2️⃣ 长按此讯息，选择「回覆」后输入内容`,
    nickname: `📝 昵称：\${ownerMaskedNickname}
`,
    nickname2: `📝 昵称：\${catcherNickname}
`,
    notRegistered: `❌ 请先完成注册流程才能捡漂流瓶。 

使用 /start 继续注册。`,
    originalContent: `原文：{content}`,
    originalLanguage: `原文语言：{language}`,
    quotaExhausted: `❌ 今日漂流瓶配额已用完（\${quotaDisplay}）`,
    replyButton: `💬 回覆讯息`,
    replyMethods: `💡 **两种回覆方式**：
`,
    report: `• 遇到不当内容请使用 /report 举报
`,
    safetyTips: `⚠️ 安全提示：
`,
    settings: `🧠 MBTI：\${bottle.mbti_result}
 `,
    settings10: `未设定`,
    settings11: `未设定`,
    settings2: `未设定`,
    settings3: `未设定`,
    settings4: `未设定`,
    settings5: `未设定`,
    settings6: `未设定`,
    settings7: `未设定`,
    settings8: `未设定`,
    settings9: `未设定`,
    short: `💡 提示：
`,
    short2: `• 稍后再试
`,
    short3: `匿名用户`,
    short4: `♂️ 男`,
    short5: `♀️ 女`,
    text: `翻译语言：\${catcherLangDisplay}
`,
    text2: `原文语言：\${bottleLangDisplay}
`,
    text3: `🗣️ 语言：\${ownerLanguage}

`,
    text4: `• 不想再聊可使用 /block 封锁

`,
    text5: `原文：\${bottle.content}
`,
    text6: `💬 翻译服务暂时有问题，已使用备援翻译
`,
    text7: `翻译：\${bottleContent}
`,
    text8: `💡 **两种回覆方式**：
`,
    translatedContent: `翻译：{content}`,
    translatedLanguage: `翻译语言：{language}`,
    translationServiceFallback: `💬 翻译服务暂时有问题，已使用备援翻译`,
    translationServiceUnavailable: `⚠️ 翻译服务暂时无法使用，以下为原文`,
    unknown: `未知`,
    zodiac: `⭐ 星座：{zodiac}
`,
    zodiac2: `⭐ 星座：\${catcherZodiac}
`,
  },
  channelMembership: {
    claimButton: `✅ 领取奖励`,
    claimReward: `点击下方按钮领取奖励：+1 瓶子`,
    joined: `🎉 检测到你已加入官方频道！`,
    leftChannel: `❌ 检测到你已离开频道，无法领取奖励。`,
    notJoined: `❌ 未检测到你加入频道，请先加入后再试`,
    oneTimeReward: `💡 这是一次性奖励，领取后会追加到今天的额度中。`,
    rewardAdded: `奖励：+1 瓶子（已追加到今天的额度）`,
    rewardGranted: `✅ 奖励已发放！ +1 瓶子`,
    taskCompleted: `🎉 恭喜完成任务：加入官方频道！`,
    viewMoreTasks: `💡 使用 /tasks 查看更多任务`,
    viewTaskCenter: `[📋 查看任务中心] → /tasks`,
  },
  common: {
    ad: `📺 今日广告：\${adsWatched}/\${AD_REWARD_CONSTANTS.MAX_ADS_PER_DAY} | 已获得 \${quotaEarned} 个额度 | 剩余 \${remaining} 次`,
    ad2: `📺 今日广告：\${adsWatched}/\${AD_REWARD_CONSTANTS.MAX_ADS_PER_DAY} ✅ 已达上限 | 已获得 \${quotaEarned} 个额度`,
    ad3: `📺 今日广告：0/\${AD_REWARD_CONSTANTS.MAX_ADS_PER_DAY} | 已获得 0 个额度`,
    ad4: `• 📺 观看广告（剩余 \${remaining}/20 次）
`,
    ad5: `• 📺 观看广告（今日已达上限）
`,
    ad6: `• 避免广告或不当内容

`,
    ad7: `📊 暂无官方广告`,
    ad8: `📢 垃圾广告`,
    ad9: `💡 还有更多官方广告可以观看！`,
    admin: `请稍后再试，或联系管理员。`,
    age: `无效的年龄范围：\${trimmedValue}（格式必须是 min-max，如 18-25）`,
    age2: `年龄：\${filters.age.min}-\${filters.age.max} 岁`,
    age3: `无效的年龄范围：\${trimmedValue}（年龄必须在 18-99 之间）`,
    age4: `无效的年龄范围：\${trimmedValue}（最小年龄不能大于最大年龄）`,
    anonymous: `匿名`,
    anonymousUser: `[需要从 zh-TW.ts 获取翻译]`,
    anyBloodType: `🌈 任何血型`,
    anyone: `🌈 任何人`,
    back: `💡 输入 /menu 可随时返回主选单`,
    back2: `↩️ 返回编辑资料`,
    back3: `🏠 返回主选单`,
    prev: `⬅️ 上一页`,
    next: `下一页 ➡️`,
    back4: `↩️ 返回`,
    backToMainMenu: `返回主选单`,
    birthday: `🎂 生日：\${updatedUser.birthday}
`,
    birthday2: `🎂 生日：\${user.birthday}
`,
    birthday3: `当天生日`,
    bloodType: `🩸 血型：\${bloodTypeText}

`,
    bloodType2: `🩸 **编辑血型**

`,
    bloodType3: `请选择你的血型：`,
    bloodType4: `🩸 编辑血型`,
    bloodTypeA: `🩸 A 型`,
    bloodTypeAB: `🩸 AB 型`,
    bloodTypeB: `🩸 B 型`,
    bloodTypeO: `🩸 O 型`,
    bottle: `瓶子内容太短，至少需要 \${MIN_BOTTLE_LENGTH} 个字符（目前 \${trimmedContent.length} 个字符）`,
    bottle10: `奖励：+1 瓶子（已追加到今天的额度）

`,
    bottle11: `你们将不会再被匹配到对方的漂流瓶。 

`,
    bottle12: `你想在丢漂流瓶时寻找什么样的对象？ 

`,
    bottle13: `使用 /throw 丢出漂流瓶开始聊天吧！`,
    bottle14: `瓶子内容包含不适当的内容，请修改后重新提交`,
    bottle15: `点击下方按钮领取奖励：+1 瓶子

`,
    bottle16: `💡 下次丢漂流瓶时将自动使用此设置。`,
    bottle17: `🌊 丢出漂流瓶 - /throw
`,
    bottle18: `🎣 捡起漂流瓶 - /catch
`,
    bottle19: `🎉 确认后可获得 +1 瓶子奖励！`,
    bottle2: `瓶子内容太长，最多 \${MAX_BOTTLE_LENGTH} 个字符（目前 \${content.length} 个字符）`,
    bottle20: `✏️ 请输入新的漂流瓶内容：

`,
    bottle21: `• 使用 /catch 捡新的漂流瓶`,
    bottle22: `• /throw - 丢出漂流瓶
`,
    bottle23: `• /catch - 捡起漂流瓶
`,
    bottle24: `• /throw - 丢漂流瓶
`,
    bottle25: `• /catch - 捡漂流瓶
`,
    bottle26: `• 发送草稿内容来丢出漂流瓶`,
    bottle27: `📦 **丢出漂流瓶**
`,
    bottle28: `🎣 **捡起漂流瓶**
`,
    bottle29: `💡 完成任务可获得额外瓶子`,
    bottle3: `• 漂流瓶: \${bottlesCount?.count || 0}
`,
    bottle30: `瓶子内容不允许包含任何连结`,
    bottle31: `🍾 丢漂流瓶

`,
    bottle32: `瓶子内容不能为空`,
    bottle33: `丢出第一个瓶子`,
    bottle34: `捡起第一个瓶子`,
    bottle4: `匿名漂流瓶交友平台，透过 MBT​​I 和星座帮你找到志同道合的朋友

`,
    bottle5: `⏰ 对话已超时

对方可能已离开。使用 /catch 捡新的瓶子吧！`,
    bottle6: `💡 使用 /catch 捡新的漂流瓶开始新对话。`,
    bottle7: `🍾 丢漂流瓶

你想要寻找什么样的聊天对象？`,
    bottle8: `快去丢瓶子认识新朋友吧！ /throw

`,
    bottle9: `看看别人的漂流瓶，有兴趣就回覆开始聊天

`,
    broadcast: `广播将在后台发送，使用 /broadcast_status \${broadcastId} 查看进度。`,
    broadcast10: `📊 最近 5 条广播记录

`,
    broadcast11: `维护通知已广播给所有用户。 
`,
    broadcast12: `恢复通知已广播给所有用户。`,
    broadcast13: `📊 目前没有广播记录`,
    broadcast14: `📊 广播状态

`,
    broadcast15: `所有广播状态正常。`,
    broadcast2: `大规模广播需要升级系统架构，请参考 BROADCAST_SYSTEM_REDESIGN.md`,
    broadcast3: `使用 /broadcast_status 查看所有广播记录。`,
    broadcast4: `\${statusEmoji} 广播队列处理已触发

`,
    broadcast5: `/broadcast_cancel 

`,
    broadcast6: `广播 ID: \${ids.join(', ')}

`,
    broadcast7: `正在处理广播 #\${broadcast.id}
`,
    broadcast8: `目前没有待处理或卡住的广播。 

`,
    broadcast9: `广播 ID: \${ids.join(`,
    cancel: `请移除这些连结后重新输入或取消编辑：`,
    cancel2: `状态: 已取消

`,
    cancel3: `请重新输入或取消编辑：`,
    cancelled: `已取消`,
    catch: `⏰ 捡瓶流程已超时

请使用 /catch 重新开始。`,
    catch2: `你捡瓶回覆 → 对方也回覆 → 开始匿名聊天`,
    catch3: `• 友善、尊重的内容更容易被捡到哦～`,
    catch4: `捡瓶流程`,
    close: `❌ 关闭`,
    complete: `🎉 **广告观看完成！ **

✅ 获得 **+1 个额度**
📊 今日已观看：**\${updated.ads_watched}/20** 次
🎁 今日已获得：**\${updated.quota_earned}** 个额度
📈 剩余次数：**\${result.remaining_ads}** 次

\${result.remaining_ads > 0 ? '💡 继续观看广告可获得更多额度！ ' : '✅ 今日广告已达上限'} {result.remaining_ads > 0 ? '💡 繼續觀看廣告可獲得更多額度！' : '✅ 今日廣告已達上限'} \${result.remaining_ads > 0 ? '💡 繼續觀看廣告可獲得更多額度！' : '✅ 今日廣告已達上限'}`,
    complete2: `📺 **观看广告获得额度**

🎁 完成观看可获得 **+1 个额度**
📊 今日剩余：**\${remainingAds}/20** 次

👇 点击下方按钮开始观看`,
    complete3: `完成时间: \${new Date(broadcast.completedAt).toLocaleString('zh-TW')}
`,
    complete4: `预计完成：\${new Date(maintenance.endTime).toLocaleString('zh-TW')}
`,
    complete5: `🎉 \${testTitle}完成！ 

`,
    complete6: `接近截止日期才完成`,
    complete7: `即将完成`,
    complete8: `尽早完成`,
    confirm: `为了保护所有使用者的安全，请确认你了解以下事项：

`,
    confirm2: `🌍 **确认你的国家/地区**

`,
    confirm3: `🛡️ 最后一步：反诈骗安全确认

`,
    confirm4: `🔍 **广播过滤器确认**

`,
    confirm5: `🌍 确认你的国家/地区`,
    confirm6: `**确认清理？ **
`,
    confirm7: `请确认：`,
    conversation: `📨 \${formatIdentifier(conv.identifier)} 的对话（\${conv.message_count} 则讯息）
`,
    conversation10: `💡 **没有找到对话历史**

`,
    conversation11: `部分对话历史可能未能更新，请稍后再试。`,
    conversation12: `
📨 **最近对话：**

`,
    conversation13: `💬 你还没有任何对话记录

`,
    conversation14: `💬 继续对话：/reply
`,
    conversation15: `您还没有任何对话记录。 

`,
    conversation16: `对话可能已结束或不存在。`,
    conversation17: `💬 继续对话`,
    conversation18: `开始第一次对话`,
    conversation2: `💬 **与 \${formatIdentifier(identifier)} 的对话**

`,
    conversation3: `• 对话开始：\${formatDate(stats.first_message_time)}
`,
    conversation4: `• 对话: \${conversationsCount?.count || 0}
`,
    conversation5: `💬 回覆对话 \${conversationIdentifier}`,
    conversation6: `您的头像缓存已刷新，下次查看对话历史时将显示最新头像。 

`,
    conversation7: `💡 为了保护隐私和安全，对话中只允许纯文字讯息。 

`,
    conversation8: `使用 /history 查看所有对话

`,
    conversation9: `🔄 正在刷新所有对话历史...

`,
    country: `无效的国家代码：\${trimmedValue}（必须是 2 个大写字母，如 TW, US, JP）`,
    country2: `🌍 **请选择你的国家/地区**

`,
    country3: `国家：\${filters.country}`,
    end: `结束：\${endTime.toLocaleString('zh-TW')}

`,
    end2: `结束：\${endTime.toLocaleString}
`,
    gender2: `无效的性别值：\${trimmedValue}（必须是 male, female 或 other）`,
    gender3: `👤 性别：\${user.gender}
`,
    gender4: `👤 性别：\${updatedUser.gender ===`,
    gender5: `👤 性别：\${user.gender ===`,
    gender6: `现在请选择你的性别：

`,
    gender7: `其他性别`,
    help: `MBTI 性格测验可以帮助我们为你找到更合适的聊天对象～

`,
    help2: `❓ 查看帮助 - /help`,
    help3: `• /help - 查看帮助`,
    invite: `• 邀请记录总数: \${inviteStats?.total || 0}
`,
    invite2: `邀请码: \${user.invite_code}
`,
    invite3: `被谁邀请: \${user.invited_by}

 {user.invited_by || '無'} \${user.invited_by}`,
    loading: `✅ 正在加载......`,
    login: `一般用户将无法使用服务，只有管理员可以登入。`,
    male: `男`,
    mbti: `无效的 MBTI 类型：\${trimmedValue}（必须是以下之一：\${VALID_MBTI.join(', ')}）`,
    mbti10: `✍️ 手动输入 MBTI`,
    mbti11: `🧠 MBTI 选单`,
    mbti12: `MBTI 完整测验`,
    mbti13: `MBTI 快速测验`,
    mbti2: `你的 MBTI 类型是：**\${result.type}**

`,
    mbti3: `当前 MBTI：**\${user.mbti_result}**
`,
    mbti4: `🧠 **选择 MBTI 测验版本**

`,
    mbti5: `🧠 **MBTI 性格类型管理**

`,
    mbti6: `⚙️ 进阶筛选（MBTI/星座）`,
    mbti7: `• 手动修改你的 MBTI 类型`,
    mbti8: `请选择你的 MBTI 类型：`,
    mbti9: `🧠 重新测试 MBTI`,
    message: `\${typeEmoji} **\${ad.title}**
\${statusEmoji} 状态: \${ad.is_enabled ? '启用' : '停用'}

📊 **统计数据**
• 展示次数: \${stats.total_views}
• 点击次数: \${stats.total_clicks}
• 点击率 (CTR): \${stats.ctr}% {ad.is_enabled ? '啟用' : '停用'} \${ad.is_enabled ? '啟用' : '停用'}`,
    message10: `/broadcast_filter gender=female,age=18-25,country=TW 大家好！ 
`,
    message11: `\${banHours} \${user.language_pref} {user.language_pref === 'en' ? 'hours' : '小時'} \${user.language_pref}`,
    message12: `时间: \${new Date(b.created_at).toLocaleString('zh-TW')}

`,
    message13: `
队列中还有 \${pendingBroadcasts.results.length - 1} 个广播待处理
`,
    message14: `进度: \${broadcast.sent_count}/\${broadcast.total_users}
`,
    message15: `\${days} \${user.language_pref}`,
    message16: `目标: \${getBroadcastTargetName(broadcast.targetType)}
`,
    message17: `状态：\${maintenance.isActive ? '✅ 维护中' : '❌ 未启用'}
 {maintenance.isActive ? '✅ 維護中' : '❌ 未啟用'} \${maintenance.isActive ? '✅ 維護中' : '❌ 未啟用'}`,
    message18: `🚫 禁止的网址：
\${urlCheck.blockedUrls?.map((url) =>`,
    message19: `• 最后讯息：\${formatDate(stats.last_message_time)}
`,
    message2: `birthday = '2000-01-01',
 age = 25,
 zodiac_sign = 'Capricorn',
 anti_fraud_score = 100,
 terms_agreed = 1`,
    message20: `时间：\${formatDate(conv.last_message_time)}

`,
    message21: `预计时长：\${maintenance.estimatedDuration} 分钟
`,
    message22: `使用 /broadcast_status \${broadcastId} 查看进度。`,
    message23: `💡 请长按你要回复的消息，在出现的选单中选择「回覆」后，在聊天框中输入回复内容。`,
    message24: `📊 今日已发送：\${usedToday + 1}/\${dailyLimit} 则`,
    message25: `/broadcast_filter zodiac=Scorpio 天蝎座专属讯息`,
    message26: `• 已激活: \${inviteStats?.activated || 0}
`,
    message27: `• 待激活: \${inviteStats?.pending || 0}

`,
    message28: `/maintenance_enable [维护讯息]

`,
    message29: `进度: \${b.sent_count}/\${b.total_users}
`,
    message3: `进度: \${broadcast.sentCount}/\${broadcast.totalUsers} (\${progress.percentage}%)
`,
    message30: `• 讯息: \${messagesCount?.count || 0}

`,
    message31: `• 对方发送：\${stats.partner_messages} 则
`,
    message32: `指挥官 - 大胆、富有想像力且意志强大的领导者，总能找到或创造解决方法。`,
    message33: `💡 使用 /broadcast_status 查看详细信息`,
    message34: `🏷️ 兴趣标签：\${updatedUser.interests ||`,
    message35: `执政官 - 极有同情心、受欢迎且乐于助人的人，总是渴望为社群做出贡献。`,
    message36: `/broadcast_filter 

`,
    message37: `**讯息内容：**
\${broadcastMessage}

`,
    message38: `• 总讯息数：\${stats.total_messages} 则
`,
    message39: `竞选者 - 热情、有创造力且社交能力强的自由精神，总能找到理由微笑。`,
    message4: `💡 使用 /history \${formatIdentifier(conversations[0].identifier)} 查看完整对话

`,
    message40: `剩余时间：\${remaining.remainingText}
`,
    message41: `表演者 - 自发、精力充沛且热情的表演者，生活在他们周围从不无聊。`,
    message42: `用户数：\${broadcast.total_users} 人
`,
    message43: `• 你发送：\${stats.user_messages} 则
`,
    message44: `调停者 - 诗意、善良的利他主义者，总是热情地为正义事业而努力。`,
    message45: `
请稍后使用 /broadcast_status 查看进度。`,
    message46: `昵称: \${user.nickname}
 `,
    message47: `• 奖励：\${stats.total_rewards}

`,
    message48: `企业家 - 聪明、精力充沛且善于洞察的人，真正享受生活在边缘。`,
    message49: `🎁 奖励：+\${ad.reward_quota} 个永久额度`,
    message5: `时间：\${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
`,
    message50: `时间：\${new Date().toLocaleString(`,
    message51: `使用 /broadcast_status 查看更新后的状态。`,
    message52: `目标: \${broadcast.target_type}
`,
    message53: `使用 /broadcast_status 查看更新后的记录。`,
    message54: `• 如果您更换了 Telegram 头像，系统会自动检测
`,
    message55: `约 \${Math.ceil(totalSeconds)} 秒`,
    message56: `启用者：\${maintenance.enabledBy}
`,
    message57: `逻辑学家 - 具有创新精神的发明家，对知识有着止不住的渴望。`,
    message58: `提倡者 - 安静而神秘，同时鼓舞人心且不知疲倦的理想主义者。`,
    message59: `守卫者 - 非常专注且温暖的守护者，时刻准备着保护所爱之人。`,
    message6: `• 展示：\${stats.total_views} | 点击：\${stats.total_clicks} (\${stats.ctr}%)
`,
    message60: `探险家 - 灵活且迷人的艺术家，时刻准备着探索和体验新事物。`,
    message61: `• 长按对方讯息回覆 /block 可封锁此使用者
`,
    message62: `请确保回覆的是对方发送的讯息（带有 # 标识符）。`,
    message63: `/broadcast_non_vip`,
    message64: `建立你的第一个连接（长按讯息 → 选择「回覆」）`,
    message65: `讯息: \${messagePreview}
`,
    message66: `3. 遇到可疑讯息时，你会提高警觉吗？ 

`,
    message67: `💡 VIP 用户每日可发送 100 则讯息。`,
    message68: `/broadcast 

`,
    message69: `/broadcast_vip`,
    message7: `
• 验证次数: \${stats.total_verified}
• 验证率: \${stats.verification_rate}%`,
    message70: `最后讯息：\${preview}
`,
    message71: `广播讯息不能超过 4000 个字符`,
    message72: `1️⃣ 长按对方的讯息
`,
    message73: `请使用文字讯息与对方交流。`,
    message74: `(尚无讯息)

`,
    message75: `获取最新消息和活动`,
    message76: `广播讯息不能为空`,
    message77: `(无讯息)`,
    message8: `
• 奖励发放: \${stats.total_rewards}
• 奖励率: \${stats.reward_rate}%`,
    message9: `
• 剩余展示: \${ad.max_views - ad.current_views}/\${ad.max_views}`,
    newUser: `新用户`,
    nickname: `💡 请输入一个简单的昵称，不要包含 http:// 或 https:// 等连结。 

`,
    nickname10: `请输入新的昵称：

`,
    nickname11: `• 请勿使用昵称发送广告`,
    nickname12: `📝 编辑昵称`,
    nickname13: `✍️ 自订昵称`,
    nickname2: `很好！你的昵称是：\${truncatedNickname}

`,
    nickname3: `📝 昵称：\${updatedUser.nickname}
`,
    nickname4: `📝 昵称：\${user.nickname}
`,
    nickname5: `• 昵称长度限制 36 个字
`,
    nickname6: `📝 **编辑昵称**

`,
    nickname7: `✏️ 请选择你的昵称：

`,
    nickname8: `✏️ 请输入你的昵称：

`,
    nickname9: `请告诉我你的昵称（显示名称）：`,
    no: `否`,
    none: `无`,
    notRegistered: `未注册`,
    notSet: `未设定`,
    operationFailed: `❌ 发生错误`,
    profile: `👤 查看个人资料 - /profile
`,
    profile2: `✏️ **编辑个人资料**

`,
    profile3: `（你也可以稍后在个人资料中设置）`,
    quota: `💡 升级 VIP 可获得更多配额（100 则/天）：/vip`,
    quota2: `• 💎 升级 VIP（每天 30 个配额）`,
    quota3: `• 🎁 邀请好友（每人 +1 配额）
`,
    quota4: `• ✨ 完成任务（获得永久配额）
`,
    register: `

💡 这是快速测验（\${testInfo}），结果仅供参考。 
完成注册后，可使用 /mbti 重新测验。 

`,
    register10: `🎉 恭喜完成注册！ 

`,
    register2: `

💡 这是完整测验（\${testInfo}），结果更准确。 
完成注册后，可使用 /mbti 重新测验。 

`,
    register3: `注册步骤: \${user.onboarding_step}
`,
    register4: `⏰ 注册流程已超时

请使用 /start 重新开始注册。`,
    register5: `或使用：/dev_restart（自动开始注册）

`,
    register6: `💡 现在可以重新开始测试注册流程。 

`,
    register7: `🔄 重新注册：/start
`,
    register8: `💡 完成注册后，你可以：
`,
    register9: `已自动完成注册流程。 

`,
    report: `🚨 **举报不当内容** (#\${conversationIdentifier})

`,
    report2: `多次被举报 / Multiple reports`,
    report3: `💡 这样可以准确指定要举报的对象。`,
    report4: `请选择举报原因：`,
    selected: `已选择`,
    settings: `🧠 MBTI：\${updatedUser.mbti_result}（可重新测试）`,
    settings10: `你还没有设定 MBTI 类型。 

`,
    settings11: `设定地区`,
    settings12: `未设定`,
    settings13: `未设定`,
    settings14: `未设定`,
    settings15: `未设定`,
    settings16: `未设定`,
    settings17: `未设定`,
    settings18: `未设定`,
    settings19: `未设定`,
    settings2: `🏷️ 兴趣标签：\${updatedUser.interests}
 `,
    settings20: `未设定`,
    settings21: `未设定`,
    settings22: `未设定`,
    settings23: `未设定`,
    settings24: `未设定`,
    settings25: `未设定`,
    settings26: `未设定`,
    settings27: `未设定`,
    settings28: `未设定`,
    settings29: `未设定`,
    settings3: `🧠 MBTI：\${user.mbti_result}（可重新测试） `,
    settings30: `未设定`,
    settings31: `未设定`,
    settings32: `未设定`,
    settings33: `未设定`,
    settings34: `未设定`,
    settings35: `未设定`,
    settings4: `🏷️ 兴趣标签：\${user.interests}
 `,
    settings5: `📖 个人简介：\${updatedUser.bio}
`,
    settings6: `🌍 地区：\${updatedUser.city}
 `,
    settings7: `📖 个人简介：\${user.bio}
`,
    settings8: `🌍 地区：\${user.city}
 `,
    settings9: `你可以随时使用 /mbti 指令重新设定。`,
    short: `💡 你可以：
`,
    short10: `工作时，你更喜欢：`,
    short100: `情感和故事`,
    short101: `效率和结果`,
    short102: `共识和团结`,
    short103: `自由和弹性`,
    short104: `保留选择权`,
    short105: `加line`,
    short106: `测验结果`,
    short107: `先听后说`,
    short108: `小而亲密`,
    short109: `团队合作`,
    short11: `阅读时，你更喜欢：`,
    short110: `独立工作`,
    short111: `边说边想`,
    short112: `独自消化`,
    short113: `实际应用`,
    short114: `创新想法`,
    short115: `新的尝试`,
    short116: `是否合理`,
    short117: `是否有益`,
    short118: `坚持原则`,
    short119: `维持关系`,
    short12: `工作中，你更重视：`,
    short120: `公正果断`,
    short121: `体贴关怀`,
    short122: `整齐有序`,
    short123: `随性自在`,
    short124: `快速决定`,
    short125: `感到不安`,
    short126: `感到兴奋`,
    short127: `访问链接`,
    short128: `订阅频道`,
    short129: `银行帐号`,
    short13: `规划未来时，你会：`,
    short130: `备注：`,
    short131: `发送中`,
    short132: `信用卡`,
    short133: `比特币`,
    short134: `加微信`,
    short135: `加qq`,
    short136: `手机号`,
    short137: `联系我`,
    short138: `一夜情`,
    short139: `性服务`,
    short14: `分析问题并提供建议`,
    short140: `骗钱`,
    short141: `投资`,
    short142: `赚钱`,
    short143: `汇款`,
    short144: `转帐`,
    short145: `密码`,
    short146: `传销`,
    short147: `金融`,
    short148: `理财`,
    short149: `股票`,
    short15: `面对变化，你通常：`,
    short150: `期货`,
    short151: `外汇`,
    short152: `电话`,
    short153: `约炮`,
    short154: `援交`,
    short155: `自杀`,
    short156: `跳楼`,
    short157: `暴力`,
    short158: `未设置`,
    short159: `未生成`,
    short16: `感谢你的支持！ ❤️`,
    short160: `测试用户`,
    short161: `测试用户`,
    short162: `结果更准确`,
    short163: `需要关注`,
    short164: `加入群组`,
    short165: `查看详情`,
    short17: `让其他用户更了解你`,
    short18: `这正确吗？ 

`,
    short19: `🗑️ 删除草稿`,
    short2: `🌈 任何人都可以`,
    short20: `🏷️ 编辑兴趣`,
    short21: `请选择测验版本：`,
    short22: `你的工作方式是：`,
    short23: `有明确的截止日期`,
    short24: `很快就能熟络起来`,
    short25: `需要时间慢慢熟悉`,
    short26: `压力大时，你会：`,
    short27: `列清单按计划购买`,
    short28: `卡住（重试中）`,
    short29: `✏️ 修改内容`,
    short3: `✏️ 继续编辑资料`,
    short30: `📖 编辑简介`,
    short31: `🌍 编辑地区`,
    short32: `💝 匹配偏好`,
    short33: `正在更新...`,
    short34: `🔞 色情内容`,
    short35: `主动与他人交谈`,
    short36: `等待他人来找我`,
    short37: `周末你更喜欢：`,
    short38: `实际经验和事实`,
    short39: `按部就班的方法`,
    short4: `📝 重新进行测验`,
    short40: `探索创新的方式`,
    short41: `逻辑和客观分析`,
    short42: `情感和人际和谐`,
    short43: `提前计划和准备`,
    short44: `随机应变和灵活`,
    short45: `保持开放的选择`,
    short46: `使用比喻和类比`,
    short47: `倾听并给予安慰`,
    short48: `你的房间通常：`,
    short49: `购物时，你会：`,
    short5: `📝 进行快速测验`,
    short50: `让别人更了解你`,
    short51: `找到同城的朋友`,
    short52: `看看别人的故事`,
    short53: `至少 20 字`,
    short54: `: 主动配对,`,
    short55: `女生（默认）`,
    short56: `男生（默认）`,
    short57: `结果仅供参考`,
    short58: `你可以：
`,
    short59: `和朋友出去玩`,
    short6: `至少需要一个过滤器`,
    short60: `在家独处休息`,
    short61: `感到充满活力`,
    short62: `感到需要休息`,
    short63: `直觉和可能性`,
    short64: `关注具体细节`,
    short65: `关注整体概念`,
    short66: `直接指出问题`,
    short67: `考虑对方感受`,
    short68: `制定详细行程`,
    short69: `随心所欲探索`,
    short7: `新用户******`,
    short70: `积极发表意见`,
    short71: `你的朋友圈：`,
    short72: `广泛但不深入`,
    short73: `未来和可能性`,
    short74: `使用具体例子`,
    short75: `已验证的方法`,
    short76: `基于现实条件`,
    short77: `想像各种可能`,
    short78: `有规律和结构`,
    short79: `包含敏感词汇`,
    short8: `批评他人时，你会：`,
    short80: `填写兴趣标签`,
    short81: `完善自我介绍`,
    short82: `加入官方频道`,
    short83: `写下你的故事`,
    short84: `👨 男生`,
    short85: `👩 女生`,
    short86: `👨 男性`,
    short87: `👩 女性`,
    short88: `审核时间：`,
    short89: `❓ 不确定`,
    short9: `旅行时，你倾向于：`,
    short90: `你更看重：`,
    short91: `公平和正义`,
    short92: `同情和理解`,
    short93: `先想好再说`,
    short94: `找朋友聊天`,
    short95: `实用的指南`,
    short96: `理论和概念`,
    short97: `现在和过去`,
    short98: `你更信任：`,
    short99: `事实和数据`,
    start: `开始时间：\${new Date(maintenance.startTime).toLocaleString('zh-TW')}
`,
    start10: `开始使用 →`,
    start2: `开始时间: \${new Date(broadcast.startedAt).toLocaleString('zh-TW')}
`,
    start3: `开始：\${startTime.toLocaleString('zh-TW')}
`,
    start4: `开始时间: \${broadcast.started_at}

`,
    start5: `开始：\${startTime.toLocaleString(`,
    start6: `🎉 **准备好了！开始交朋友吧～**

`,
    start7: `• 使用 /throw 重新开始
`,
    start8: `📺 开始观看广告`,
    start9: `开始你的交友之旅`,
    stats: `💡 使用 /ad_stats {id} 查看详细统计`,
    stats2: `• /stats - 查看统计

`,
    stats3: `📊 查看统计 - /stats
`,
    stats4: `📊 **官方广告统计**

`,
    stats5: `邀请统计:
`,
    stats6: `统计:
`,
    success: `购买成功`,
    systemError: `❌ 系统发生错误`,
    task: `🎉 恭喜完成任务：加入官方频道！ 

`,
    task2: `[📋 查看任务中心] → /tasks`,
    task3: `• /tasks - 查看任务中心
`,
    task4: `💡 使用 /tasks 查看更多任务`,
    task5: `处理任务时，你会：`,
    task6: `📋 查看任务`,
    text: `目标：\${broadcast.target_type}
`,
    text10: `📖 个人简介：\${updatedUser.bio ||`,
    text100: `💡 请在下方输入框输入内容`,
    text101: `这可能需要一些时间，请稍候。`,
    text102: `你可以随时使用以下命令：
`,
    text103: `🛠️ 系统维护通知

`,
    text104: `🛠️ 维护模式状态

`,
    text105: `评价一个想法时，你首先考虑：`,
    text106: `⏱️ 约 2-3 分钟
`,
    text107: `⏱️ 约 5-8 分钟
`,
    text108: `📚 我想了解更多安全知识`,
    text109: `立即发送（约 1-2 秒）`,
    text11: `\${Math.floor(hours / 24)} 天前`,
    text110: `2️⃣ 选择「回覆」
`,
    text111: `**过滤器格式：**
`,
    text112: `• 最短 5 个字符
`,
    text113: `• 不能包含网址连结
`,
    text114: `请输入你的地区：

`,
    text115: `• 你可以随时修改此设置`,
    text116: `• 最多 5 个标签
`,
    text117: `📋 快速版（12 题）`,
    text118: `📚 完整版（36 题）`,
    text119: `• 进行更详细的测验
`,
    text12: `总经理 - 出色的管理者，在管理事务或人员方面无与伦比。`,
    text120: `💡 **提示：**
`,
    text121: `学习新事物时，你更喜欢：`,
    text122: `**操作步骤：**
`,
    text123: `🇺🇳 使用联合国旗`,
    text124: `要直接发送这个草稿吗？`,
    text125: `这可能需要几秒钟时间。`,
    text126: `
感谢您的耐心等待！`,
    text127: `维护时长最少 5 分钟`,
    text128: `在社交场合中，你通常：`,
    text129: `解决问题时，你更依赖：`,
    text13: `💡 这将显示在你的资料卡上，让其他用户更了解你。 
`,
    text130: `在团队中，你更倾向于：`,
    text131: `思考问题时，你倾向于：`,
    text132: `描述事物时，你倾向于：`,
    text133: `朋友向你倾诉时，你会：`,
    text134: `团队决策时，你更关注：`,
    text135: `你认为好的领导者应该：`,
    text136: `目标: 所有用户
`,
    text137: `✏️ 请输入新的内容`,
    text138: `💰 诈骗 / 钓鱼`,
    text139: `😡 骚扰 / 辱骂`,
    text14: `语言: \${user.language_pref}
`,
    text140: `参加聚会后，你通常：`,
    text141: `做决定时，你更重视：`,
    text142: `遇到新朋友时，你会：`,
    text143: `冲突中，你更倾向于：`,
    text144: `你更容易被说服通过：`,
    text145: `你更喜欢的生活方式：`,
    text146: `做决定时，你倾向于：`,
    text147: `随意逛逛看到喜欢就买`,
    text148: `)} 到期。 

`,
    text149: `📋 法律文档仅提供英文版本。`,
    text15: `🌍 地区：\${updatedUser.city ||`,
    text150: `📋 法的文书は英语版のみ提供されています。`,
    text16: `

✅ 需要验证：加入群组/频道后点击「验证」按钮`,
    text17: `目标用户数：\${userIds.length}

`,
    text18: `预计时间: \${estimatedTime}

`,
    text19: `/broadcast_cleanup confirm`,
    text2: `请使用 /broadcast_filter 查看正确格式。`,
    text20: `💝 匹配偏好：\${matchPrefText}
`,
    text21: `辩论家 - 聪明好奇的思想家，无法抗拒智力上的挑战。`,
    text22: `写下你的心情或想法，系统会帮你找到合适的人

`,
    text23: `物流师 - 实际且注重事实的个人，可靠性不容怀疑。`,
    text24: `鉴赏家 - 大胆而实际的实验者，擅长使用各种工具。`,
    text25: `💡 这是一次性奖励，领取后会追加到今天的额度中。`,
    text26: `符合用户数: \${totalUsers} 人
`,
    text27: `• 默认为异性（男生寻找女生，女生寻找男生）
`,
    text28: `状态: \${progress.status}
`,
    text29: `\${Math.floor(hours)} 小时前`,
    text3: `**过滤条件：**
\${filtersDesc}

`,
    text30: `约 \${remainingMinutes} 分钟`,
    text31: `约 \${hours} 小时 \${mins} 分钟`,
    text32: `维护时长不能超过 24 小时（1440 分钟）`,
    text33: `用户数: \${totalUsers} 人
`,
    text34: `目标: \${b.target_type}
`,
    text35: `过滤条件: \${filtersDesc}
`,
    text36: `• 最少 4 个字符，最多 36 个字符
`,
    text37: `🇺🇳 如果找不到，可以选择「联合国旗」`,
    text38: `📖 个人简介：\${user.bio ||`,
    text39: `请输入你的兴趣标签（用逗号分隔）：

`,
    text4: `/maintenance_enable 60 系统升级维护`,
    text40: `• 例如：音乐, 电影, 旅行, 美食
`,
    text41: `服务已恢复正常，感谢您的耐心等待！ 

`,
    text42: `🌍 地区：\${user.city ||`,
    text43: `来源：\${sourceText}

`,
    text44: `未知的过滤器：\${trimmedKey}`,
    text45: `系统正在进行维护，暂时无法使用。 

`,
    text46: `我们根据你的语言设置，推测你来自：
`,
    text47: `• 每个标签最多 20 个字符

`,
    text48: `时长：\${duration} 分钟
`,
    text49: `1. 你了解网路交友的安全风险吗？ 
`,
    text5: `👋 欢迎回来，\${user.nickname}！ 

`,
    text50: `2. 你会保护好自己的个人资讯吗？ 
`,
    text51: `很好！现在请上传你的头像照片：

`,
    text52: `🌊 **XunNi 是什么？ **
`,
    text53: `🎉 检测到你已加入官方频道！ 

`,
    text54: `💡 这样可以准确指定要封锁的对象。`,
    text55: `状态：\${statusText}
`,
    text56: `💡 现在可以直接测试核心功能：
`,
    text57: `你想要寻找什么样的聊天对象？ 

`,
    text58: `• 介绍你的兴趣、性格或想说的话
`,
    text59: `🏷️ **编辑兴趣标签**

`,
    text6: `建筑师 - 富有想像力和战略性的思想家，一切皆在计划之中。`,
    text60: `为了安全，只允许以下网域的连结：
`,
    text61: `📋 **快速版（12 题）**
`,
    text62: `📚 **完整版（36 题）**
`,
    text63: `• 头像会自动每 7 天更新一次
`,
    text64: `3️⃣ 输入 /report

`,
    text65: `3️⃣ 输入 /block

`,
    text66: `状态: \${b.status}
`,
    text67: `不会再被自动处理或重新发送

`,
    text68: `📖 **编辑个人简介**

`,
    text69: `💝 **设置匹配偏好**

`,
    text7: `主人公 - 富有魅力且鼓舞人心的领导者，有能力使听众着迷。`,
    text70: `💬 **你的聊天记录**

`,
    text71: `• 您也可以随时使用此命令手动刷新`,
    text72: `📊 **每日数据分析报表**
`,
    text73: `你的帐号已恢复为免费会员。 

`,
    text74: `💡 这将显示在你的资料卡上
`,
    text75: `🔧 开发模式：用户信息

`,
    text76: `• 直接输入新内容来替换草稿
`,
    text77: `• 不允许连结、图片、多媒体
`,
    text78: `• 显示时最多 18 个字符
`,
    text79: `• 对方最多显示 18 个字
`,
    text8: `/broadcast 系统将于今晚 22:00 进行维护`,
    text80: `💡 请移除这些连结后重新发送。`,
    text81: `🔄 正在刷新头像...

`,
    text82: `• 免费用户看到的是模糊头像
`,
    text83: `💬 **如何成为朋友？ **
`,
    text84: `无效的过滤器格式：\${pair}`,
    text85: `你的所有数据已被删除。 

`,
    text86: `📝 **草稿内容**

`,
    text87: `🌍 **编辑地区**

`,
    text88: `• 例如：台北、香港、东京
`,
    text89: `• 最多 50 个字符

`,
    text9: `🏷️ 兴趣标签：\${user.interests ||`,
    text90: `约 \${minutes} 分钟`,
    text91: `写下你的故事（至少 20 字）`,
    text92: `正在查询符合条件的用户...`,
    text93: `• 最多 250 个字符
`,
    text94: `• 不要包含个人联络方式
`,
    text95: `请选择要编辑的项目：

`,
    text96: `请输入你的个人简介：

`,
    text97: `• 最多 200 个字符
`,
    text98: `• 避免包含联络方式

`,
    text99: `现在可以正常使用所有功能了。`,
    throw: `⏰ 丢瓶流程已超时

请使用 /throw 重新开始。`,
    throw2: `丢瓶流程`,
    uncertain: `❓ 不确定`,
    unknownOption: `⚠️ 未知的选项`,
    unlimited: `无限制`,
    userNotFound: `❌ 用户不存在`,
    vip: `你的 VIP 订阅已于 \${new Date(user.vip_expire_at).toLocaleDateString('zh-TW')} 到期。 

`,
    vip10: `😢 **VIP 订阅已到期**

`,
    vip11: `• 升级 VIP 后会自动刷新历史帖子`,
    vip12: `⭐ 升级 VIP - /vip
`,
    vip13: `💎 VIP 用户无需观看广告`,
    vip14: `目标: 非 VIP 用户
`,
    vip15: `目标: VIP 用户
`,
    vip16: `非 VIP 用户`,
    vip17: `VIP 用户`,
    vip2: `你的 VIP 订阅已于 \${new Date(user.vip_expire_at).toLocaleDateString(`,
    vip3: `/broadcast_filter vip=true,mbti=INTJ VIP 专属活动通知
`,
    vip4: `每邀请 1 人，每日额度永久 +1（免费最多 10 人，VIP 最多 100 人）`,
    vip5: `VIP: \${user.is_vip ? '是' : '否'}
`,
    vip6: `💡 升级 VIP 可使用进阶筛选（MBTI/星座）：/vip`,
    vip7: `💡 随时可以重新订阅 VIP：/vip

`,
    vip8: `💡 血型可用于 VIP 血型配对功能

`,
    vip9: `• VIP 用户可以看到清晰的对方头像
`,
    yes: `是`,
    zodiac: `无效的星座：\${trimmedValue}（必须是以下之一：\${VALID_ZODIACS.join(', ')}）`,
  },
  conversation: {
    age: `🎂 年龄范围：\${ageRange} 岁
`,
    anonymousCardHint: `💡 这是匿名资料卡，不会显示对方的真实身份资讯。`,
    backToMenuCommand: `🏠 返回主选单：/menu`,
    ban: `• 多次被举报会导致封禁
`,
    blockConfirmButton: `✅ 确定封锁`,
    blockConfirmMessage: `封锁后：
• 对方无法再向你发送讯息
• 你们不会再被匹配到
• 此对话将立即结束

💡 这不会举报对方，只是不想再聊天。`,
    blockConfirmTitle: `🚫 **确定要封锁这位用户吗？ **`,
    blockSuccessMessage: `对方已被封锁，你们不会再被匹配到。 

💡 想要开始新的对话吗？ 
• 使用 /catch 捡起新的漂流瓶`,
    blockSuccessNewConversation: `💬 **对话已结束**

对方结束了这个对话。 

💡 想要开始新的对话吗？ 
• 使用 /catch 捡起新的漂流瓶`,
    blockSuccessTitle: `✅ **已封锁此用户**`,
    blocked: `✅ 已封锁`,
    bloodType: `🩸 血型：\${partnerInfo.bloodType}
`,
    bloodType2: `🩸 血型：\${bloodTypeText}
`,
    bottle: `使用 /catch 捡漂流瓶开始聊天吧！ 

`,
    bottle2: `• 使用 /catch 捡起新的漂流瓶`,
    cancelButton: `❌ 取消`,
    cancelSuccess: `已取消`,
    conversation: `💬 与 #\${identifier} 的对话记录（第 \${postNumber} 页）

`,
    conversation10: `目前没有任何对话。 

`,
    conversation11: `• 此对话将立即结束
`,
    conversation2: `💬 **我的对话列表** (\${conversations.length})

`,
    conversation3: `💡 点击对方讯息的「回覆」按钮即可继续对话
`,
    conversation4: `💬 **对话已结束**

`,
    conversation5: `💬 **我的对话**

`,
    conversation6: `💡 想要开始新的对话吗？ 
`,
    conversation7: `• 此对话将立即结束

`,
    conversation8: `对方结束了这个对话。 

`,
    conversation9: `💡 这是对话的历史记录
`,
    conversationEnded: `❌ 此对话已结束。 

使用 /catch 捡新的漂流瓶开始新对话。`,
    conversationInfoError: `[需要从 zh-TW.ts 获取翻译]`,
    editProfileCommand: `✏️ 编辑个人资料：/edit_profile`,
    endedMessage: `对方结束了这个对话。 

💡 想要开始新的对话吗？ 
• 使用 /catch 捡起新的漂流瓶`,
    endedNewConversation: `💬 **对话已结束**

对方结束了这个对话。 

💡 想要开始新的对话吗？ 
• 使用 /catch 捡起新的漂流瓶`,
    endedTitle: `💬 **对话已结束**`,
    gender: `👤 性别：\${otherUser.gender}
`,
    mediaRestriction: `⚠️ **不允许发送图片、影片或多媒体**

💡 为了保护隐私和安全，对话中只允许纯文字讯息。 

请使用文字讯息与对方交流。`,
    message: `💫 配对度：\${Math.round(partnerInfo.matchScore)}分
`,
    message10: `conv_profile_\${conversationId}`,
    message11: `• 最后讯息：\${lastMessageTime}

`,
    message12: `📊 总讯息数：\${totalMessages} 则
`,
    message13: `💬 直接按 /reply 回覆讯息聊天
`,
    message14: `• 对方无法再向你发送讯息
`,
    message2: `
📜 继续查看：#\${identifier}-H\${newPostNumber}`,
    message3: `📅 最后更新：\${formatDateTime(new Date())}

`,
    message4: `[\${timeStr}] 对方：
\${messageContent}

`,
    message5: `conv_report_confirm_\${conversationId}`,
    message6: `conv_block_confirm_\${conversationId}`,
    message7: `• 讯息数：\${conv.message_count} 则
`,
    message77: `💬 使用 /reply 回覆讯息`,
    message8: `🏷️ 兴趣：\${otherUser.interests}
`,
    message9: `💬 来自 #\${identifier} 的新讯息：

`,
    nickname: `📝 昵称：\${partnerInfo.maskedNickname}
`,
    nickname2: `📝 昵称：\${displayNickname}
`,
    noHistory: `💬 你还没有任何对话记录

快去丢瓶子认识新朋友吧！ /throw

🏠 返回主选单：/menu`,
    profile: `✏️ 编辑个人资料：/edit_profile
`,
    profileCardTitle: `👤 **对方的资料卡**`,
    replyButton: `💬 回覆讯息`,
    replyConversation: `💬 回覆对话 {identifier}`,
    replyHint: `💡 请在下方输入框输入内容`,
    replyMethod1: `1️⃣ 点击下方「💬 回覆讯息」按钮`,
    replyMethod2: `2️⃣ 长按此讯息，选择「回覆」后输入内容`,
    replyMethodsTitle: `💡 **两种回覆方式**：`,
    report: `🚨 **确定要举报这位用户吗？ **

`,
    report2: `💡 这不会举报对方，只是不想再聊天。`,
    report3: `感谢你的举报，我们会尽快审核。 

`,
    report4: `举报后：
`,
    reportConfirmButton: `✅ 确定举报`,
    reportConfirmMessage: `举报后：
• 我们会审核此用户的行为
• 多次被举报会导致封禁
• 此对话将立即结束
• 24小时内不会再匹配到此用户

💡 请确保对方确实有不当行为。`,
    reportConfirmTitle: `🚨 **确定要举报这位用户吗？ **`,
    reportSuccessMessage: `感谢你的举报，我们会尽快审核。 

💡 想要开始新的对话吗？ 
• 使用 /catch 捡起新的漂流瓶`,
    reportSuccessNewConversation: `💬 **对话已结束**

对方结束了这个对话。 

💡 想要开始新的对话吗？ 
• 使用 /catch 捡起新的漂流瓶`,
    reportSuccessTitle: `✅ **已举报此用户**`,
    reported: `✅ 已举报`,
    separator: `━━━━━━━━━━━━━━━━`,
    settings: `🧠 MBTI：\${otherUser.mbti_result}
 `,
    settings2: `未设定`,
    settings3: `未设定`,
    settings4: `未设定`,
    settings5: `未设定`,
    short: `封锁后：
`,
    short2: `未知用户`,
    short3: `刚刚`,
    stats: `📊 使用 /stats 查看详细统计
`,
    text: `💡 这是匿名资料卡，不会显示对方的真实身份资讯。 

`,
    text10: `💎 使用 /vip 了解更多

`,
    text11: `👤 **对方的资料卡**

`,
    text12: `\${diffHours} 小时前`,
    text13: `💡 请确保对方确实有不当行为。`,
    text14: `\${diffMins} 分钟前`,
    text15: `• 我们会审核此用户的行为
`,
    text16: `💎 使用 /vip 了解更多`,
    text17: `\${diffDays} 天前`,
    text18: `• 你们不会再被匹配到
`,
    text19: `👤 对方资料：
`,
    text2: `📜 查看历史记录：#\${identifier}
`,
    text3: `🗣️ 语言：\${languageLabel}
`,
    text4: `🌍 地区：\${otherUser.city}
`,
    text5: `📖 简介：\${otherUser.bio}
`,
    text6: `conv_reply_\${identifier}`,
    text7: `🚫 **确定要封锁这位用户吗？ **

`,
    text8: `对方已被封锁，你们不会再被匹配到。 

`,
    text9: `• 24小时内不会再匹配到此用户

`,
    vip: `
🔒 升级 VIP 解锁对方清晰头像
`,
    vip2: `🔒 升级 VIP 解锁对方清晰头像
`,
    vipLearnMore: `💎 使用 /vip 了解更多`,
    vipUnlockAvatar: `🔒 升级 VIP 解锁对方清晰头像`,
    zodiac: `⭐ 星座：\${partnerInfo.zodiac}
`,
    zodiac2: `⭐ 星座：\${zodiacLabel}
`,
  },
  conversationHistory: {
    backToMenu: `🏠 返回主选单：/menu`,
    bloodType: `🩸 血型：\${bloodType}`,
    continueView: `📜 继续查看：#\${identifier}-H\${postNumber}`,
    historyNote: `💡 这是对话的历史记录`,
    lastUpdated: `📅 最后更新：\${time}`,
    matchScore: `💫 配对度：\${score}分`,
    mbti: `🧠 MBTI：\${mbti}`,
    messageEntry: `[\${time}] 对方：
\${content}`,
    newMessage: `💬 来自 #\${identifier} 的新讯息：`,
    nickname: `📝 昵称：\${nickname}`,
    other: `对方`,
    partnerInfo: `👤 对方资料：`,
    replyButton: `💬 回覆讯息`,
    replyHint: `💬 直接按 /reply 回覆讯息聊天`,
    title: `💬 与 #\${identifier} 的对话记录（第 \${postNumber} 页）`,
    totalMessages: `📊 总讯息数：\${count} 则`,
    viewAllConversations: `📊 查看所有对话`,
    viewHistory: `📜 查看历史记录：#\${identifier}`,
    viewProfileCard: `👤 查看对方资料卡`,
    vipLearnMore: `💎 使用 /vip 了解更多`,
    vipUnlockAvatar: `🔒 升级 VIP 解锁对方清晰头像`,
    you: `你`,
    zodiac: `⭐ 星座：\${zodiac}`,
  },
  countries: {
    ae: `阿联酋`,
    al: `阿尔巴尼亚`,
    am: `亚美尼亚`,
    ar: `阿根廷`,
    at: `奥地利`,
    au: `澳洲`,
    az: `阿塞拜疆`,
    ba: `波斯尼亚`,
    bb: `巴巴多斯`,
    bd: `孟加拉`,
    be: `比利时`,
    bg: `保加利亚`,
    bh: `巴林`,
    bo: `玻利维亚`,
    br: `巴西`,
    ca: `加拿大`,
    ch: `瑞士`,
    ci: `象牙海岸`,
    cl: `智利`,
    cm: `喀麦隆`,
    cn: `中国`,
    co: `哥伦比亚`,
    cr: `哥斯达黎加`,
    cu: `古巴`,
    cz: `捷克`,
    de: `德国`,
    dk: `丹麦`,
    do: `多米尼加`,
    dz: `阿尔及利亚`,
    ec: `厄瓜多尔`,
    ee: `爱沙尼亚`,
    eg: `埃及`,
    es: `西班牙`,
    et: `埃塞俄比亚`,
    fi: `芬兰`,
    fr: `法国`,
    gb: `英国`,
    ge: `乔治亚`,
    gh: `加纳`,
    gr: `希腊`,
    gt: `危地马拉`,
    hk: `香港`,
    hn: `洪都拉斯`,
    hr: `克罗地亚`,
    hu: `匈牙利`,
    id: `印尼`,
    ie: `爱尔兰`,
    il: `以色列`,
    in: `印度`,
    iq: `伊拉克`,
    ir: `伊朗`,
    is: `冰岛`,
    it: `意大利`,
    jm: `牙买加`,
    jo: `约旦`,
    jp: `日本`,
    ke: `肯尼亚`,
    kh: `柬埔寨`,
    kr: `韩国`,
    kw: `科威特`,
    kz: `哈萨克斯坦`,
    la: `老挝`,
    lb: `黎巴嫩`,
    lk: `斯里兰卡`,
    lt: `立陶宛`,
    lv: `拉脱维亚`,
    ly: `利比亚`,
    ma: `摩洛哥`,
    mk: `北马其顿`,
    mm: `缅甸`,
    mn: `蒙古`,
    mo: `澳门`,
    mt: `马耳他`,
    mx: `墨西哥`,
    my: `马来西亚`,
    ng: `尼日利亚`,
    ni: `尼加拉瓜`,
    nl: `荷兰`,
    no: `挪威`,
    np: `尼泊尔`,
    nz: `新西兰`,
    om: `阿曼`,
    pa: `巴拿马`,
    pe: `秘鲁`,
    ph: `菲律宾`,
    pk: `巴基斯坦`,
    pl: `波兰`,
    pt: `葡萄牙`,
    py: `巴拉圭`,
    qa: `卡塔尔`,
    ro: `罗马尼亚`,
    rs: `塞尔维亚`,
    ru: `俄罗斯`,
    rw: `卢旺达`,
    sa: `沙特阿拉伯`,
    sd: `苏丹`,
    se: `瑞典`,
    sg: `新加坡`,
    si: `斯洛文尼亚`,
    sk: `斯洛伐克`,
    sn: `塞内加尔`,
    sv: `萨尔瓦多`,
    sy: `叙利亚`,
    th: `泰国`,
    tn: `突尼斯`,
    tr: `土耳其`,
    tt: `千里达`,
    tw: `台湾`,
    tz: `坦桑尼亚`,
    ua: `乌克兰`,
    ug: `乌干达`,
    un: `联合国`,
    us: `美国`,
    uy: `乌拉圭`,
    uz: `乌兹别克斯坦`,
    ve: `委内瑞拉`,
    vn: `越南`,
    ye: `也门`,
    za: `南非`,
    zw: `津巴布韦`,
  },
  country: {
    buttonAU: `🇦🇺 澳洲`,
    buttonCA: `🇨🇦 加拿大`,
    buttonCN: `🇨🇳 中国`,
    buttonDE: `🇩🇪 德国`,
    buttonFR: `🇫🇷 法国`,
    buttonGB: `🇬🇧 英国`,
    buttonHK: `🇭🇰 香港`,
    buttonJP: `🇯🇵 日本`,
    buttonKR: `🇰🇷 韩国`,
    buttonMY: `🇲🇾 马来西亚`,
    buttonNZ: `🇳🇿 纽西兰`,
    buttonSG: `🇸🇬 新加坡`,
    buttonTH: `🇹🇭 泰国`,
    buttonTW: `🇹🇼 台湾`,
    buttonUS: `🇺🇸 美国`,
    confirmButton: `✅ 正确`,
    confirmDetected: `我们根据你的语言设置，推测你来自：
`,
    confirmFailed: `❌ 确认失败`,
    confirmHint: `💡 这将显示在你的资料卡上，让其他用户更了解你。 
`,
    confirmQuestion: `这正确吗？ 

`,
    confirmReward: `🎉 确认后可获得 +1 瓶子奖励！`,
    confirmTitle: `🌍 **确认你的国家/地区**

`,
    confirmed: `✅ 已确认！`,
    notCorrectButton: `❌ 不正确`,
    selectHint: `💡 这将显示在你的资料卡上
`,
    selectTitle: `🌍 **请选择你的国家/地区**

`,
    selectUnFlagHint: `🇺🇳 如果找不到，可以选择「联合国旗」`,
    setFailed: `❌ 设置失败`,
    setTo: `✅ 已设置为 {flag} {country}`,
    unFlagButton: `🇺🇳 联合国旗`,
    useUnFlagButton: `🇺🇳 使用联合国旗`,
  },
  dailyReports: {
    header: `📊 **每日数据分析报表**`,
    time: `时间：\${time}`,
  },
  dev: {
    autoCompleted: `已自动完成注册流程。 

`,
    bottles: `• 漂流瓶: {count}
`,
    catchCommand: `• /catch - 捡漂流瓶
`,
    conversations: `• 对话: {count}
`,
    dataReset: `✅ 开发模式：数据已重置

你的所有数据已被删除。 

💡 现在可以重新开始测试注册流程。 

🔄 重新注册：/start
或使用：/dev_restart（自动开始注册）

⚠️ 注意：此功能仅在 Staging 环境可用。`,
    getUserInfoFailed: `❌ 获取信息失败`,
    inviteActivated: `• 已激活: {count}
`,
    inviteCode: `邀请码: {code}
`,
    invitePending: `• 待激活: {count}

`,
    inviteStats: `邀请统计:
`,
    inviteTotal: `• 邀请记录总数: {count}
`,
    invitedBy: `被谁邀请: {invitedBy}

`,
    language: `语言: {lang}
`,
    messages: `• 讯息: {count}

`,
    nickname: `昵称: {nickname}
`,
    no: `否`,
    none: `无`,
    notAvailableInProduction: `❌ 此命令在生产环境中不可用。 

This command is not available in production.`,
    notGenerated: `未生成`,
    notSet: `未设置`,
    onboardingStep: `注册步骤: {step}
`,
    resetFailed: `❌ 重置失败：{error}

请稍后再试。`,
    skipFailed: `❌ 跳过失败`,
    skipRegistration: `✅ 开发模式：跳过注册

`,
    stagingOnly: `⚠️ 此功能仅在 Staging 环境可用。`,
    stats: `统计:
`,
    statsCommand: `• /stats - 查看统计

`,
    successfulInvites: `• successful_invites: {count}
`,
    telegramId: `Telegram ID: {id}
`,
    testCoreFeatures: `💡 现在可以直接测试核心功能：
`,
    testUser: `测试用户`,
    throwCommand: `• /throw - 丢漂流瓶
`,
    userInfo: `🔧 开发模式：用户信息

`,
    userNotFound: `❌ 用户不存在`,
    vip: `VIP: {status}
`,
    yes: `是`,
  },
  draft: {
    'age.daysAgo': `\\\${days} 天前`,
    'age.hoursAgo': `\\\${hours} 小时前`,
    'age.justNow': `刚刚`,
    contentHint: `💡 你可以：
• 直接输入新内容来替换草稿
• 使用 /throw 重新开始
• 发送草稿内容来丢出漂流瓶`,
    contentTitle: `📝 **草稿内容**

`,
    continueEditing: `✅ 继续编辑草稿`,
    deleteButton: `🗑️ 删除草稿`,
    deleted: `✅ 草稿已删除`,
    editButton: `✏️ 修改内容`,
    editInput: `✏️ 请输入新的漂流瓶内容：

💡 提示：
• 最短 5 个字符
• 最多 250 个字符
• 不允许连结、图片、多媒体
• 不要包含个人联络方式
• 友善、尊重的内容更容易被捡到哦～`,
    editPrompt: `✏️ 请输入新的内容`,
    newBottle: `✅ 开始新的漂流瓶`,
    notFound: `⚠️ 草稿不存在或已过期`,
    sendButton: `✅ 发送草稿`,
    sendQuestion: `要直接发送这个草稿吗？`,
    sending: `✅ 正在发送...`,
    targetGender: `你想要寻找什么样的聊天对象？ 

`,
    targetGenderHint: `💡 升级 VIP 可使用进阶筛选（MBTI/星座）：/vip`,
    throwBottle: `🍾 丢漂流瓶

你想要寻找什么样的聊天对象？`,
  },
  edit_profile: {
    nickname: `👤 昵称：\\\\\\\\\\\\\\\${ownerMaskedNickname}`,
    short19: `✏️ 编辑个人资料`,
  },
  error: {
    ad: `❌ 此广告不需要验证`,
    ad2: `❌ 暂无可用的广告`,
    ad3: `❌ 无法领取此广告`,
    ad4: `❌ 广告不存在`,
    ad5: `❌ 广告 ID 必须是数字`,
    ad6: `❌ 你没有权限查看广告数据`,
    admin: `❌ 系统发生错误，请稍后再试。 

如果问题持续，请联系管理员。`,
    admin2: `❌ **权限不足**

此命令仅限超级管理员使用。`,
    admin3: `❌ 此用户已经是超级管理员，无需添加。`,
    admin4: `❌ 只有超级管理员可以使用此命令。`,
    admin5: `❌ 此用户已经是管理员。`,
    admin6: `❌ 无法移除超级管理员。`,
    admin7: `❌ 此用户不是管理员。`,
    appeal: `❌ 请提供申诉 ID

用法: /admin_approve <appeal_id> [备注]`,
    appeal2: `❌ 请提供申诉 ID

用法: /admin_reject <appeal_id> [备注]`,
    appeal3: `❌ 申诉 \${appealId} 已经被审核过了`,
    appeal4: `❌ 找不到申诉 ID: \${appealId}`,
    ban: `❌ 用户 \${targetUserId} 没有封禁记录`,
    birthday: `❌ \${validation.error}

请重新输入生日（格式：YYYY-MM-DD）：`,
    birthday2: `❌ 生日格式错误

请重新输入（格式：YYYY-MM-DD）：`,
    birthday3: `❌ 生日格式错误`,
    bottle: `❌ 此对话已结束。 

使用 /catch 捡新的漂流瓶开始新对话。`,
    bottle2: `❌ 你的帐号已被封禁，无法捡漂流瓶。 

如有疑问，请使用 /appeal 申诉。`,
    bottle3: `❌ 这个瓶子已经被其他人捡走了，请试试其他瓶子！`,
    broadcast: `❌ 当前广播系统仅支持 \${MAX_SAFE_USERS} 个用户以内的广播。 

`,
    broadcast2: `❌ 广播 ID 必须是数字`,
    broadcast3: `❌ 找不到该广播记录`,
    cancel: `❌ 昵称太长，请输入不超过 36 个字符的昵称。 

请重新输入或取消编辑：`,
    cancel2: `❌ 个人简介太长，请输入不超过 200 个字符。 

请重新输入或取消编辑：`,
    cancel3: `❌ 地区名称太长，请输入不超过 50 个字符。 

请重新输入或取消编辑：`,
    cancel4: `❌ 昵称太短，至少需要 4 个字符。 

请重新输入或取消编辑：`,
    cancel5: `❌ 每个标签最多 20 个字符。 

请重新输入或取消编辑：`,
    cancel6: `❌ 取消编辑`,
    cancel7: `❌ 已取消 \${ZODIAC_NAMES[zodiacSign]}`,
    cancel8: `❌ 已取消 \${mbtiType}`,
    cancel9: `❌ 取消`,
    conversation: `❌ 找不到标识符 \${formatIdentifier(identifier)} 的对话

`,
    conversation2: `❌ 对话资讯错误。`,
    conversation3: `❌ 对话资讯错误`,
    conversation4: `❌ 对话不存在`,
    conversationInfoError: `❌ 对话资讯错误`,
    conversationNotFound: `❌ 对话不存在`,
    failed: `❌ **广告加载失败**

很抱歉，广告无法正常播放。 

💡 **可能的原因：**
• 网络连接不稳定
• 广告提供商暂时不可用
• 浏览器不支持

🔄 **建议：**
• 检查网络连接
• 稍后再试
• 或使用其他方式获得额度（邀请朋友）`,
    failed10: `❌ 查询维护模式状态失败。`,
    failed11: `❌ 刷新头像失败

`,
    failed12: `❌ 验证失败，请稍后再试`,
    failed13: `❌ 启用维护模式失败。`,
    failed14: `❌ 关闭维护模式失败。`,
    failed15: `❌ 获取广告状态失败`,
    failed16: `❌ 获取统计数据失败`,
    failed17: `❌ 创建广播失败。`,
    failed18: `❌ 获取信息失败`,
    failed19: `❌ 领取奖励失败`,
    failed2: `❌ 创建过滤广播失败

\${error instanceof Error ? error.message : String(error)}`,
    failed20: `❌ 确认失败`,
    failed21: `❌ 设置失败`,
    failed22: `❌ 跳过失败`,
    failed23: `❌ 操作失败`,
    failed24: `❌ 发送每日报表失败：\${error instanceof Error ? error.message : String(error)}`,
    failed25: `❌ 获取 VIP 漏斗数据失败`,
    failed26: `❌ **诊断失败**

`,
    failed27: `❌ **刷新失败**

`,
    failed28: `❌ **支付失败**

`,
    failed29: `❌ 获取广告提供商列表失败`,
    failed3: `❌ 处理广播队列失败：\${error instanceof Error ? error.message : String(error)}`,
    failed30: `❌ 获取官方广告列表失败`,
    failed31: `❌ 启用广告提供商失败`,
    failed32: `❌ 停用广告提供商失败`,
    failed33: `❌ 启用官方广告失败`,
    failed34: `❌ 停用官方广告失败`,
    failed35: `❌ 获取分析数据失败`,
    failed36: `❌ 获取广告数据失败`,
    failed37: `❌ 设置优先级失败`,
    failed38: `❌ 退款失败：\${error instanceof Error ? error.message : String(error)}`,
    failed39: `❌ 操作失败：\${error instanceof Error ? error.message : String(error)}`,
    failed4: `❌ 查询广播状态失败：\${error instanceof Error ? error.message : String(error)}`,
    failed40: `❌ 提交失败，请稍后再试。`,
    failed41: `❌ 建立对话失败，请稍后再试。`,
    failed5: `❌ 取消广播失败：\${error instanceof Error ? error.message : String(error)}`,
    failed6: `❌ 清理广播失败：\${error instanceof Error ? error.message : String(error)}`,
    failed7: `❌ 重置失败：\${errorMessage}

请稍后再试。`,
    failed8: `❌ 创建广播失败，请稍后再试。`,
    failed9: `❌ 刷新对话历史失败

`,
    mbti: `❌ 无效的 MBTI 类型`,
    message: `❌ 过滤器格式错误

\${error instanceof Error ? error.message : String(error)}

`,
    message2: `❌ 此命令在生产环境中不可用。 

This command is not available in production.`,
    message3: `❌ 发生错误，请稍后再试。 

错误信息：\${error instanceof Error ? error.message : String(error)}`,
    message4: `❌ 很抱歉，你必须年满 18 岁才能使用本服务。 

请成年后再来！`,
    nickname: `❌ 无法获取 Telegram 昵称`,
    nickname2: `❌ 昵称不能包含网址连结

`,
    nickname3: `❌ \${validation.error}

请重新输入昵称：`,
    quota: `❌ 今日漂流瓶配额已用完（\${quotaDisplay}）

💡 获得更多配额的方式：
`,
    quota2: `❌ 今日对话讯息配额已用完（\${usedToday}/\${dailyLimit}）

`,
    quota3: `❌ 今日漂流瓶配额已用完（\${quotaDisplay}）

`,
    register: `❌ 请先完成注册流程。 

使用 /start 继续注册。`,
    register2: `❌ 找不到用户资料，请先使用 /start 注册。`,
    register3: `❌ 请先完成注册流程才能捡漂流瓶。 

使用 /start 继续注册。`,
    settings: `❌ 最多只能设定 5 个兴趣标签。 

请重新输入或取消编辑：`,
    short: `❌ 无效的语言代码`,
    short10: `❌ 权限不足`,
    short11: `❌ 稍后再说`,
    short12: `❌ 重新选择`,
    short13: `❌ 重新输入`,
    short14: `❌ 关闭`,
    short15: `❌ 未启用`,
    short2: `❌ 找不到用户资料`,
    short3: `❌ 未知的教学步骤`,
    short4: `❌ 系统发生错误`,
    short5: `❌ 频道配置错误`,
    short6: `❌ 未知操作`,
    short7: `❌ 不正确`,
    short8: `❌ 否`,
    short9: `❌ 发生错误`,
    start: `❌ 发生错误，请重新开始：/start`,
    stats: `❌ 你没有权限查看广告统计`,
    task: `❌ 查看任务中心时系统发生错误，请稍后再试。`,
    text: `❌ 计算结果时系统发生错误，请稍后再试。 

`,
    text10: `❌ 发送者资讯错误。`,
    text11: `❌ 你没有权限查看分析数据`,
    text12: `❌ 发生错误，请稍后再试。`,
    text13: `❌ 你没有权限使用此命令。`,
    text14: `❌ 使用方法错误

`,
    text15: `❌ 优先级必须是非负整数`,
    text16: `❌ 时长必须是正整数或`,
    text17: `❌ 处理支付时系统发生错误，请联系客服。 

`,
    text18: `❌ 退款原因至少需要 10 个字，请重新输入：`,
    text19: `❌ **退款申请已被拒绝**

`,
    text2: `❌ 个人简介包含不允许的连结。 

`,
    text20: `❌ 退款申请超过时限

`,
    text21: `❌ 退款请求不存在或已处理`,
    text22: `❌ 找不到支付记录。`,
    text23: `❌ 很抱歉，你必须年满 18 岁才能使用本服务。 

`,
    text24: `❌ 发生错误，请重新输入。`,
    text25: `❌ 请认真回答问题

`,
    text3: `❌ 未检测到你加入频道，请先加入后再试`,
    text4: `❌ 检测到你已离开频道，无法领取奖励。`,
    text5: `❌ 启动教学时发生错误，请稍后再试。`,
    text6: `❌ 系统发生错误，请稍后再试。`,
    text7: `❌ 时长必须是数字（分钟）`,
    text8: `❌ 发生错误，请稍后再试`,
    text9: `❌ 无法获取维护模式状态`,
    userNotFound: `❌ 用户不存在，请先使用 /start 注册。`,
    userNotFound2: `❌ 用户不存在，请先注册`,
    userNotFound3: `❌ 对方用户不存在。`,
    userNotFound4: `❌ 用户不存在`,
    userNotFound5: `❌ 用户不存在：\${userId}`,
    userNotFound6: `❌ 用户不存在或未注册。`,
    userNotFound7: `❌ 用户不存在。`,
    vip: `❌ 你没有权限查看 VIP 数据`,
    vip2: `❌ 你不是 VIP 用户，无法申请退款。`,
  },
  errors: {
    channelConfigError: `❌ 频道配置错误`,
    claimRewardFailed: `❌ 领取奖励失败`,
    completeOnboarding: `⚠️ 请先完成注册流程。`,
    conversationInfoError: `❌ 对话资讯错误。`,
    conversationNotFound: `❌ 找不到此对话`,
    'error.ad': `❌ 此广告不需要验证`,
    'error.ad2': `❌ 暂无可用的广告`,
    'error.ad3': `❌ 无法领取此广告`,
    'error.ad4': `❌ 广告不存在`,
    'error.ad5': `❌ 广告 ID 必须是数字`,
    'error.ad6': `❌ 你没有权限查看广告数据`,
    'error.admin': `❌ 系统发生错误，请稍后再试。 

如果问题持续，请联系管理员。`,
    'error.admin2': `❌ **权限不足**

此命令仅限超级管理员使用。`,
    'error.admin3': `❌ 此用户已经是超级管理员，无需添加。`,
    'error.admin4': `❌ 只有超级管理员可以使用此命令。`,
    'error.admin5': `❌ 此用户已经是管理员。`,
    'error.admin6': `❌ 无法移除超级管理员。`,
    'error.admin7': `❌ 此用户不是管理员。`,
    'error.appeal': `❌ 请提供申诉 ID

用法: /admin_approve <appeal_id> [备注]`,
    'error.appeal2': `❌ 请提供申诉 ID

用法: /admin_reject <appeal_id> [备注]`,
    'error.appeal3': `❌ 申诉 \\\${appealId} 已经被审核过了`,
    'error.appeal4': `❌ 找不到申诉 ID: \\\${appealId}`,
    'error.ban': `❌ 用户 \\\${targetUserId} 没有封禁记录`,
    'error.birthday': `❌ \\\${validation.error}

请重新输入生日（格式：YYYY-MM-DD）：`,
    'error.birthday2': `❌ 生日格式错误

请重新输入（格式：YYYY-MM-DD）：`,
    'error.birthday3': `❌ 生日格式错误`,
    'error.bottle': `❌ 此对话已结束。 

使用 /catch 捡新的漂流瓶开始新对话。`,
    'error.bottle2': `❌ 你的帐号已被封禁，无法捡漂流瓶。 

如有疑问，请使用 /appeal 申诉。`,
    'error.bottle3': `❌ 这个瓶子已经被其他人捡走了，请试试其他瓶子！`,
    'error.broadcast': `❌ 当前广播系统仅支持 \\\${MAX_SAFE_USERS} 个用户以内的广播。 

`,
    'error.broadcast2': `❌ 广播 ID 必须是数字`,
    'error.broadcast3': `❌ 找不到该广播记录`,
    'error.cancel': `❌ 昵称太长，请输入不超过 36 个字符的昵称。 

请重新输入或取消编辑：`,
    'error.cancel2': `❌ 个人简介太长，请输入不超过 200 个字符。 

请重新输入或取消编辑：`,
    'error.cancel3': `❌ 地区名称太长，请输入不超过 50 个字符。 

请重新输入或取消编辑：`,
    'error.cancel4': `❌ 昵称太短，至少需要 4 个字符。 

请重新输入或取消编辑：`,
    'error.cancel5': `❌ 每个标签最多 20 个字符。 

请重新输入或取消编辑：`,
    'error.cancel6': `❌ 取消编辑`,
    'error.cancel7': `❌ 已取消 \\\${ZODIAC_NAMES[zodiacSign]}`,
    'error.cancel8': `❌ 已取消 \\\${mbtiType}`,
    'error.cancel9': `❌ 取消`,
    'error.conversation': `❌ 找不到标识符 \\\${formatIdentifier(identifier)} 的对话

`,
    'error.conversation2': `❌ 对话资讯错误。`,
    'error.conversation3': `❌ 对话资讯错误`,
    'error.conversation4': `❌ 对话不存在`,
    'error.conversationInfoError': `❌ 对话资讯错误`,
    'error.conversationNotFound': `❌ 对话不存在`,
    'error.failed': `❌ **广告加载失败**

很抱歉，广告无法正常播放。 

💡 **可能的原因：**
• 网络连接不稳定
• 广告提供商暂时不可用
• 浏览器不支持

🔄 **建议：**
• 检查网络连接
• 稍后再试
• 或使用其他方式获得额度（邀请朋友）`,
    'error.failed10': `❌ 查询维护模式状态失败。`,
    'error.failed11': `❌ 刷新头像失败

`,
    'error.failed12': `❌ 验证失败，请稍后再试`,
    'error.failed13': `❌ 启用维护模式失败。`,
    'error.failed14': `❌ 关闭维护模式失败。`,
    'error.failed15': `❌ 获取广告状态失败`,
    'error.failed16': `❌ 获取统计数据失败`,
    'error.failed17': `❌ 创建广播失败。`,
    'error.failed18': `❌ 获取信息失败`,
    'error.failed19': `❌ 领取奖励失败`,
    'error.failed2': `❌ 创建过滤广播失败

\\\${error instanceof Error ? error.message : String(error)}`,
    'error.failed20': `❌ 确认失败`,
    'error.failed21': `❌ 设置失败`,
    'error.failed22': `❌ 跳过失败`,
    'error.failed23': `❌ 操作失败`,
    'error.failed24': `❌ 发送每日报表失败：\\\${error instanceof Error ? error.message : String(error)}`,
    'error.failed25': `❌ 获取 VIP 漏斗数据失败`,
    'error.failed26': `❌ **诊断失败**

`,
    'error.failed27': `❌ **刷新失败**

`,
    'error.failed28': `❌ **支付失败**

`,
    'error.failed29': `❌ 获取广告提供商列表失败`,
    'error.failed3': `❌ 处理广播队列失败：\\\${error instanceof Error ? error.message : String(error)}`,
    'error.failed30': `❌ 获取官方广告列表失败`,
    'error.failed31': `❌ 启用广告提供商失败`,
    'error.failed32': `❌ 停用广告提供商失败`,
    'error.failed33': `❌ 启用官方广告失败`,
    'error.failed34': `❌ 停用官方广告失败`,
    'error.failed35': `❌ 获取分析数据失败`,
    'error.failed36': `❌ 获取广告数据失败`,
    'error.failed37': `❌ 设置优先级失败`,
    'error.failed38': `❌ 退款失败：\\\${error instanceof Error ? error.message : String(error)}`,
    'error.failed39': `❌ 操作失败：\\\${error instanceof Error ? error.message : String(error)}`,
    'error.failed4': `❌ 查询广播状态失败：\\\${error instanceof Error ? error.message : String(error)}`,
    'error.failed40': `❌ 提交失败，请稍后再试。`,
    'error.failed41': `❌ 建立对话失败，请稍后再试。`,
    'error.failed5': `❌ 取消广播失败：\\\${error instanceof Error ? error.message : String(error)}`,
    'error.failed6': `❌ 清理广播失败：\\\${error instanceof Error ? error.message : String(error)}`,
    'error.failed7': `❌ 重置失败：\\\${errorMessage}

请稍后再试。`,
    'error.failed8': `❌ 创建广播失败，请稍后再试。`,
    'error.failed9': `❌ 刷新对话历史失败

`,
    'error.mbti': `❌ 无效的 MBTI 类型`,
    'error.message': `❌ 过滤器格式错误

\\\${error instanceof Error ? error.message : String(error)}

`,
    'error.message2': `❌ 此命令在生产环境中不可用。 

This command is not available in production.`,
    'error.message3': `❌ 发生错误，请稍后再试。 

错误信息：\\\${error instanceof Error ? error.message : String(error)}`,
    'error.message4': `❌ 很抱歉，你必须年满 18 岁才能使用本服务。 

请成年后再来！`,
    'error.nickname': `❌ 无法获取 Telegram 昵称`,
    'error.nickname2': `❌ 昵称不能包含网址连结

`,
    'error.nickname3': `❌ \\\${validation.error}

请重新输入昵称：`,
    'error.quota': `❌ 今日漂流瓶配额已用完（\\\${quotaDisplay}）

💡 获得更多配额的方式：
`,
    'error.quota2': `❌ 今日对话讯息配额已用完（\\\${usedToday}/\\\${dailyLimit}）

`,
    'error.quota3': `❌ 今日漂流瓶配额已用完（\\\${quotaDisplay}）

`,
    'error.register': `❌ 请先完成注册流程。 

使用 /start 继续注册。`,
    'error.register2': `❌ 找不到用户资料，请先使用 /start 注册。`,
    'error.register3': `❌ 请先完成注册流程才能捡漂流瓶。 

使用 /start 继续注册。`,
    'error.settings': `❌ 最多只能设定 5 个兴趣标签。 

请重新输入或取消编辑：`,
    'error.short': `❌ 无效的语言代码`,
    'error.short10': `❌ 权限不足`,
    'error.short11': `❌ 稍后再说`,
    'error.short12': `❌ 重新选择`,
    'error.short13': `❌ 重新输入`,
    'error.short14': `❌ 关闭`,
    'error.short15': `❌ 未启用`,
    'error.short2': `❌ 找不到用户资料`,
    'error.short3': `❌ 未知的教学步骤`,
    'error.short4': `❌ 系统发生错误`,
    'error.short5': `❌ 频道配置错误`,
    'error.short6': `❌ 未知操作`,
    'error.short7': `❌ 不正确`,
    'error.short8': `❌ 否`,
    'error.short9': `❌ 发生错误`,
    'error.start': `❌ 发生错误，请重新开始：/start`,
    'error.stats': `❌ 你没有权限查看广告统计`,
    'error.task': `❌ 查看任务中心时系统发生错误，请稍后再试。`,
    'error.text': `❌ 计算结果时系统发生错误，请稍后再试。 

`,
    'error.text10': `❌ 发送者资讯错误。`,
    'error.text11': `❌ 你没有权限查看分析数据`,
    'error.text12': `❌ 发生错误，请稍后再试。`,
    'error.text13': `❌ 你没有权限使用此命令。`,
    'error.text14': `❌ 使用方法错误

`,
    'error.text15': `❌ 优先级必须是非负整数`,
    'error.text16': `❌ 时长必须是正整数或`,
    'error.text17': `❌ 处理支付时系统发生错误，请联系客服。 

`,
    'error.text18': `❌ 退款原因至少需要 10 个字，请重新输入：`,
    'error.text19': `❌ **退款申请已被拒绝**

`,
    'error.text2': `❌ 个人简介包含不允许的连结。 

`,
    'error.text20': `❌ 退款申请超过时限

`,
    'error.text21': `❌ 退款请求不存在或已处理`,
    'error.text22': `❌ 找不到支付记录。`,
    'error.text23': `❌ 很抱歉，你必须年满 18 岁才能使用本服务。 

`,
    'error.text24': `❌ 发生错误，请重新输入。`,
    'error.text25': `❌ 请认真回答问题

`,
    'error.text3': `❌ 未检测到你加入频道，请先加入后再试`,
    'error.text4': `❌ 检测到你已离开频道，无法领取奖励。`,
    'error.text5': `❌ 启动教学时发生错误，请稍后再试。`,
    'error.text6': `❌ 系统发生错误，请稍后再试。`,
    'error.text7': `❌ 时长必须是数字（分钟）`,
    'error.text8': `❌ 发生错误，请稍后再试`,
    'error.text9': `❌ 无法获取维护模式状态`,
    'error.userNotFound': `❌ 用户不存在，请先使用 /start 注册。`,
    'error.userNotFound2': `❌ 用户不存在，请先注册`,
    'error.userNotFound3': `❌ 对方用户不存在。`,
    'error.userNotFound4': `❌ 用户不存在`,
    'error.userNotFound5': `❌ 用户不存在：\\\${userId}`,
    'error.userNotFound6': `❌ 用户不存在或未注册。`,
    'error.userNotFound7': `❌ 用户不存在。`,
    'error.vip': `❌ 你没有权限查看 VIP 数据`,
    'error.vip2': `❌ 你不是 VIP 用户，无法申请退款。`,
    errorDetails: `错误信息：{error}`,
    failed: `失败: \${broadcast.failedCount}
`,
    failed2: `失败：\${result.failed} 个

`,
    failed3: `这些广播将被标记为「失败」状态
`,
    failed4: `这些广播已标记为「失败」状态
`,
    generic: `❌ 发生错误，请稍后再试。`,
    invalidRequest: `❌ 无效的请求`,
    message: `\${statusEmoji} **\${provider.provider_display_name}**
\${healthEmoji} 健康状态: \${health.is_healthy ? '良好' : '需要关注'}
📊 完成率: \${stats.completion_rate}%
❌ 错误率: \${stats.error_rate}%
📈 总请求: \${stats.total_requests}
✅ 总完成: \${stats.total_completions}
💡 建议: \${health.recommendation} {health.is_healthy ? '良好' : '需要關注'} \${health.is_healthy ? '良好' : '需要關注'}`,
    message2: `错误信息：\${error instanceof Error ? error.message : String(error)}`,
    message3: `
错误: \${broadcast.errorMessage}`,
    operationFailed: `❌ 操作失败`,
    processError: `❌ 处理过程中发生错误`,
    sessionExpired: `❌ 会话已过期，请重新开始`,
    systemError: `系统错误`,
    systemErrorRetry: `❌ 系统发生错误，请稍后再试。`,
    unknownAction: `❌ 未知操作`,
    unknownError: `🎨 UX: 友善的错误提示`,
    userNotFound: `用户不存在`,
    userNotFoundRegister: `⚠️ 用户不存在，请先使用 /start 注册。`,
    verificationFailed: `❌ 验证失败，请稍后再试`,
  },
  estimate: {
    immediate: `立即发送（约 1-2 秒）`,
    minutes: `约 \${minutes} 分钟`,
    seconds: `约 \${seconds} 秒`,
  },
  help: {
    ad: `• 观看广告：每次 +1 额度（每日最多 20 次）
`,
    ad2: `/ad_performance - 广告效果报表
`,
    ad3: `• 观看广告获得额度（额度用完时显示）
`,
    ad4: `• 查看官方广告获得永久额度

`,
    ad5: `• 官方广告：永久额度奖励
`,
    ad6: `• 无广告体验

`,
    admin: `/admin_remove <user_id> - 移除管理员

`,
    admin2: `/admin_add <user_id> - 添加管理员
`,
    admin3: `/admin_list - 查看管理员列表
`,
    admin4: `🔱 **超级管理员功能**

`,
    admin5: `👮 **管理员功能**

`,
    admin6: `**管理员管理**
`,
    appeal: `/admin_reject [备注] - 拒绝申诉

`,
    appeal2: `/admin_approve [备注] - 批准申诉
`,
    appeal3: `/appeal_status - 查询申诉状态

`,
    appeal4: `/admin_appeals - 查看待审核申诉
`,
    appeal5: `🛡️ **安全与申诉**
`,
    appeal6: `**申诉审核**
`,
    ban: `/admin_ban <user_id> [hours|permanent] - 封禁用户
`,
    ban2: `/admin_bans <user_id> - 查看用户封禁历史

`,
    ban3: `/admin_unban <user_id> - 解除封禁
`,
    ban4: `/admin_bans - 查看封禁记录
`,
    ban5: `/appeal - 申诉封禁
`,
    ban6: `• 违规将被封禁

`,
    birthday: `• 今天生日：is_birthday=true

`,
    bottle: `• 完成任务：获得额外瓶子（使用 /tasks 查看）
`,
    bottle2: `/tasks - 任务中心（完成任务获得额外瓶子）
`,
    bottle3: `• 每天可以丢出和捡起有限数量的漂流瓶
`,
    bottle4: `• VIP 用户：每天 30 个瓶子
`,
    bottle5: `• 瓶子在 24 小时内有效

`,
    bottle6: `• 免费用户：每天 3 个瓶子
`,
    bottle7: `/throw - 丢出漂流瓶
`,
    bottle8: `/catch - 捡起漂流瓶
`,
    bottle9: `🍾 **漂流瓶系统**
`,
    broadcast: `/broadcast_status - 查看广播详情
`,
    broadcast2: `/broadcast_process - 手动处理广播队列
`,
    broadcast3: `/broadcast_cleanup - 清理卡住的广播
`,
    broadcast4: `/broadcast_status - 查看广播列表
`,
    broadcast5: `**广播监控**
`,
    broadcast6: `**广播发送**
`,
    cancel: `/broadcast_cancel - 取消广播

`,
    conversation: `/chats - 我的对话列表

`,
    conversation2: `• 所有对话都是匿名的
`,
    help2: `💡 使用 /help 查看帮助`,
    invite: `• 邀请好友：每人 +1 额度（最多 10/100）
`,
    invite2: `/invite - 邀请好友获得额度
`,
    mbti: `• 可筛选 MBTI、星座、血型
`,
    mbti2: `/mbti - MBTI 管理
`,
    message: `/maintenance_enable - 启用维护模式
`,
    message2: `/broadcast_non_vip - 群发给非 VIP 用户
`,
    message3: `• 18-25岁女性：gender=female,age=18-25
`,
    message4: `/broadcast_filter - 精准广播
`,
    message5: `/broadcast_vip - 群发给 VIP 用户
`,
    message6: `/maintenance_disable - 关闭维护模式

`,
    message7: `/maintenance_status - 查看维护状态
`,
    message8: `/broadcast - 群发给所有用户
`,
    profile: `/edit_profile - 编辑个人资料
`,
    profile2: `/profile - 查看个人资料
`,
    profile3: `👤 **个人资料**
`,
    quota: `• 邀请好友可增加配额（最多 10/100）
`,
    quota2: `• 每天 30 个漂流瓶配额
`,
    register: `/start - 开始使用 / 继续注册
`,
    report: `/report - 举报不当内容
`,
    settings: `/settings - 推送设定`,
    settings2: `📖 **帮助与设定**
`,
    stats: `/stats - 我的统计数据

`,
    success: `└ 大幅提升配对成功率
`,
    text: `/maintenance_status - 查看维护状态`,
    text10: `📖 **XunNi 指令列表**

`,
    text11: `/analytics - 每日运营报表
`,
    text12: `/dev_restart - 完全重置帐号`,
    text13: `📜 **XunNi 游戏规则**

`,
    text14: `• 只能发送文字和官方 Emoji
`,
    text15: `/dev_info - 系统信息
`,
    text16: `/quota - 查看额度状态
`,
    text17: `/rules - 查看游戏规则
`,
    text18: `/block - 封锁使用者
`,
    text19: `/help - 显示此列表
`,
    text2: `/refresh_avatar - 刷新头像缓存
`,
    text20: `• 尊重对方，友善交流

`,
    text21: `🎁 **额度获取方式**
`,
    text22: `• 不要分享个人联络方式
`,
    text23: `🛡️ **安全规则**
`,
    text24: `🎮 **核心功能**
`,
    text25: `/menu - 主选单
`,
    text26: `💬 **匿名聊天**
`,
    text27: `• 禁止骚扰、辱骂他人
`,
    text28: `• 禁止发送不当内容
`,
    text29: `• 解锁对方清晰头像
`,
    text3: `• 只发给女性：gender=female
`,
    text30: `• 禁止诈骗、钓鱼
`,
    text31: `**用户管理**
`,
    text32: `**系统维护**
`,
    text33: `**数据分析**
`,
    text34: `**开发工具**
`,
    text4: `• 34 种语言自动翻译（OpenAI 优先）
`,
    text5: `/profile_card - 查看资料卡片
`,
    text6: `/dev_reset - 重置帐号（测试用）
`,
    text7: `• 只发给男性：gender=male
`,
    text8: `💡 遇到问题？使用 /help 查看指令列表`,
    text9: `• 使用 /quota 查看额度状态

`,
    throw: `• 🆕 三倍曝光机会（1 次丢瓶 = 3 个对象）
`,
    vip: `• 台湾的VIP：country=TW,vip=true
`,
    vip2: `• 每日免费额度：3 个（VIP：30 个）
`,
    vip3: `/funnel - VIP 转化漏斗

`,
    vip4: `🎁 **额度与 VIP**
`,
    vip5: `/vip - VIP 订阅
`,
    vip6: `💎 **VIP 权益**
`,
  },
  history: {
    chatHistory: `💬 **你的聊天记录**

`,
    continueChatButton: `💬 继续对话`,
    continueConversation: `💬 继续对话：/reply
`,
    conversationEnd: `• 最后讯息：{time}
`,
    conversationNotFound: `❌ 找不到标识符 {identifier} 的对话

使用 /history 查看所有对话

🏠 返回主选单：/menu`,
    conversationStart: `• 对话开始：{time}
`,
    conversationTitle: `📨 {identifier} 的对话（{count} 则讯息）
`,
    conversationWith: `💬 **与 {identifier} 的对话**

`,
    daysAgo: `{days} 天前`,
    errorRetry: `❌ 发生错误，请稍后再试。`,
    hoursAgo: `{hours} 小时前`,
    justNow: `刚刚`,
    lastMessage: `最后讯息：{preview}
`,
    messageSender: `{sender}：{content}

`,
    messageTime: `📨 {time}
`,
    minutesAgo: `{minutes} 分钟前`,
    noHistory: `💬 你还没有任何对话记录

快去丢瓶子认识新朋友吧！ /throw

🏠 返回主选单：/menu`,
    noMessages: `(无讯息)`,
    partnerMessages: `• 对方发送：{count} 则
`,
    recentMessages: `
📨 **最近对话：**

`,
    returnToMenu: `🏠 返回主选单：/menu`,
    returnToMenuButton: `🏠 返回主选单`,
    stats: `📊 **统计：**
`,
    time: `时间：{time}

`,
    totalMessages: `• 总讯息数：{total} 则
`,
    userMessages: `• 你发送：{count} 则
`,
    viewFull: `💡 使用 /history {identifier} 查看完整对话

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
    allFeaturesAvailable: `现在可以正常使用所有功能了。`,
    completed: `✅ 系统维护已完成`,
    completingSoon: `即将完成`,
    correctFormat: `**正确格式：**
/maintenance_enable [维护讯息]

`,
    defaultMessage: `系统正在进行维护，暂时无法使用。`,
    disableFailed: `❌ 关闭维护模式失败。`,
    disableSuccess: `✅ 维护模式已关闭

恢复通知已广播给所有用户。`,
    durationMax: `维护时长不能超过 24 小时（1440 分钟）`,
    durationMin: `维护时长最少 5 分钟`,
    durationMustBeNumber: `❌ 时长必须是数字（分钟）`,
    enableFailed: `❌ 启用维护模式失败。`,
    enableSuccess: `✅ 维护模式已启用

时长：{duration} 分钟
开始：{startTime}
结束：{endTime}

维护通知已广播给所有用户。 
一般用户将无法使用服务，只有管理员可以登入。`,
    enabledBy: `启用者：{user}
`,
    estimatedDuration: `预计时长：{duration} 分钟
`,
    estimatedEnd: `预计完成：{time}
`,
    example: `**示例：**
/maintenance_enable 60 系统升级维护`,
    notificationTitle: `🛠️ 系统维护通知`,
    remainingHours: `约 {hours} 小时 {minutes} 分钟`,
    remainingMinutes: `约 {minutes} 分钟`,
    remainingTime: `剩余时间：{time}
`,
    serviceRestored: `服务已恢复正常，感谢您的耐心等待！`,
    startTime: `开始时间：{time}
`,
    status: `状态：{status}
`,
    statusActive: `✅ 维护中`,
    statusFailed: `❌ 无法获取维护模式状态`,
    statusInactive: `❌ 未启用`,
    statusTitle: `🛠️ 维护模式状态`,
    thanks: `感谢您的耐心等待！`,
    unknown: `未知`,
    usageError: `❌ 使用方法错误

`,
  },
  mbtiTest: {
    afterRegistration: `💡 完成注册后，你可以：
`,
    answerRecorded: `✅ 已记录`,
    completion: `🎉 {testTitle}完成！ 

`,
    fullAccuracy: `结果更准确`,
    fullQuestions: `36 题`,
    fullTest: `MBTI 完整测验`,
    fullTestInfo: `

💡 这是完整测验（{questions}），结果更准确。 
完成注册后，可使用 /mbti 重新测验。 

`,
    fullTestTitle: `完整测验`,
    manualModify: `• 手动修改你的 MBTI 类型`,
    moreDetailedTest: `• 进行更详细的测验
`,
    note: `⚠️ 注意：这是 {testInfo}{testTitle}，{accuracy}。 

`,
    questionOrderError: `⚠️ 问题顺序错误`,
    questions12: `12 题`,
    questions36: `36 题`,
    quickAccuracy: `结果仅供参考`,
    quickQuestions: `12 题`,
    quickTest: `MBTI 快速测验`,
    quickTestInfo: `

💡 这是快速测验（{questions}），结果仅供参考。 
完成注册后，可使用 /mbti 重新测验。 

`,
    quickTestTitle: `快速测验`,
    yourMbtiType: `你的 MBTI 类型是：**{type}**

`,
  },
  menu: {
    bottle: `• 好友丢出第一个瓶子后激活
`,
    buttonCatch: `🎣 捡起漂流瓶`,
    buttonChats: `💬 我的对话`,
    buttonHelp: `❓ 帮助`,
    buttonInvite: `👥 邀请好友`,
    buttonProfile: `👤 个人资料`,
    buttonSettings: `⚙️ 设定`,
    buttonStats: `📊 统计`,
    buttonThrow: `🌊 丢出漂流瓶`,
    buttonVip: `💎 VIP`,
    invite: `🎁 **邀请好友**

`,
    invite2: `📋 你的邀请码：{inviteCode}`,
    invite3: `📤 分享邀请码`,
    levelFree: `🆓 免费会员`,
    levelVip: `💎 VIP 会员`,
    message: `https://t.me/share/url?url=https://t.me/\${botUsername}?start=invite_\${inviteCode}&text=来 XunNi 一起丢漂流瓶吧！ 🍾 使用我的邀请码加入，我们都能获得更多配额！ https://t.me/share/url?url=https://t.me/\${botUsername}?start=invite_\${inviteCode}&text=來`,
    message2: `https://t.me/share/url?url=https://t.me/\${botUsername}?start=invite_\${inviteCode}&text=来 XunNi 一起丢漂流 https://t.me/share/url?url=https://t.me/\${botUsername}?start=invite_\${inviteCode}&text=來`,
    notRegistered: `未注册`,
    notSet: `未设定`,
    quota: `• 你们都获得每日配额 +1

`,
    register: `• 好友使用你的邀请码注册
`,
    selectFeature: `请选择功能：`,
    settings: `• MBTI：\${user.mbti_result}`,
    settings2: `• 星座：\${user.zodiac_sign}`,
    settings3: `未设定`,
    settings4: `未设定`,
    short: `免费会员`,
    stats: `📊 查看邀请统计：/profile`,
    stats2: `📊 查看邀请统计`,
    task: `🎯 **下一个任务**
⏳ \${nextTask.name} (+\${nextTask.reward_amount} 瓶子)
💡 \${nextTask.description}

`,
    text: `🏠 **主选单** \${vipBadge}

`,
    text2: `👋 嗨，\${user.nickname}！ 

`,
    text3: `💡 点击下方按钮分享给好友：
`,
    text4: `💡 选择你想要的功能：`,
    text5: `📊 你的状态：
`,
    title: `🏠 **主选单**`,
    userNotFound: `用户不存在`,
    vip: `• 等级：\${isVip ? 'VIP 会员 💎' : '免费会员'}
 {isVip ? 'VIP 會員 💎' : '免費會員'} \${isVip ? 'VIP 會員 💎' : '免費會員'}`,
    vip2: `VIP 会员 💎`,
    yourStatus: `你的状态`,
  },
  messageForward: {
    dailyQuota: `📊 今日已发送：{used}/{limit} 则`,
    messageSent: `✅ 讯息已发送给 {identifier}

`,
    removeLinks: `[需要从 zh-TW.ts 获取翻译]`,
    replyHint: `[需要从 zh-TW.ts 获取翻译]`,
    upgradeVip: `[需要从 zh-TW.ts 获取翻译]`,
    urlNotAllowed: `[需要从 zh-TW.ts 获取翻译]`,
    urlNotAllowedDesc: `[需要从 zh-TW.ts 获取翻译]`,
    vipDailyLimit: `[需要从 zh-TW.ts 获取翻译]`,
  },
  nickname: {
    cannotGetNickname: `❌ 无法获取 Telegram 昵称`,
    customHint: `⚠️ 注意：
• 昵称长度限制 36 个字
• 对方最多显示 18 个字
• 请勿使用昵称发送广告`,
    customPrompt: `✏️ 请输入你的昵称：

`,
    genderHint: `⚠️ 注意：性别设定后无法修改，请谨慎选择！`,
    genderSelection: `很好！你的昵称是：{nickname}

现在请选择你的性别：

`,
    nicknameSet: `✅ 昵称已设定`,
    userNotFound: `❌ 用户不存在`,
  },
  officialAd: {
    adNotFound: `❌ 广告不存在`,
    allAdsViewed: `✅ 你已经看过所有官方广告了`,
    alreadyViewed: `你已经看过此广告`,
    buttonClaimReward: `领取奖励`,
    buttonJoinGroup: `加入群组`,
    buttonSubscribeChannel: `订阅频道`,
    buttonVerifyAndClaim: `✅ 验证并领取`,
    buttonViewDetails: `查看详情`,
    buttonVisitLink: `访问链接`,
    cannotClaim: `❌ 无法领取此广告`,
    claimReward: `✅ 领取奖励`,
    claimRewardButton: `✅ 领取奖励`,
    claimRewardSuccess: `✅ 领取奖励成功！获得 +{quota} 个永久额度！`,
    errorRetry: `❌ 发生错误，请稍后再试`,
    moreAdsAvailable: `💡 还有更多官方广告可以观看！`,
    nextAd: `➡️ 下一个广告`,
    noAdsAvailable: `❌ 暂无可用的广告`,
    noVerificationRequired: `❌ 此广告不需要验证`,
    requiresVerification: `

✅ 需要验证：加入群组/频道后点击「验证」按钮`,
    reward: `🎁 奖励：+{quota} 个永久额度`,
    statsAdNotFound: `❌ 广告不存在`,
    statsClicks: `• 点击次数: {count}
`,
    statsCtr: `• 点击率 (CTR): {rate}%
`,
    statsHint: `💡 使用 /ad_stats {id} 查看详细统计`,
    statsNoAds: `📊 暂无官方广告`,
    statsNoPermission: `❌ 你没有权限查看广告统计`,
    statsRemainingViews: `• 剩余展示: {remaining}/{total}
`,
    statsRewardGranted: `• 奖励发放: {count}
`,
    statsRewardRate: `• 奖励率: {rate}%
`,
    statsRewardSummary: `• 奖励：{rewards}

`,
    statsSummary: `• 展示：{views} | 点击：{clicks} ({ctr}%)
`,
    statsTitle: `📊 **官方广告统计**

`,
    statsVerificationCount: `• 验证次数: {count}
`,
    statsVerificationRate: `• 验证率: {rate}%
`,
    statsViews: `• 展示次数: {count}
`,
    statusDisabled: `停用`,
    statusEnabled: `启用`,
    unlimited: `无限`,
    userNotFound: `❌ 用户不存在`,
    verifySuccess: `✅ 验证成功！获得 +{quota} 个永久额度！`,
  },
  onboarding: {
    age: `• 年龄：\${updatedUser.age} 岁
`,
    age2: `你的年龄：\${age} 岁
`,
    age3: `年龄：\${age} 岁
`,
    ageRestriction: `❌ 很抱歉，你必须年满 18 岁才能使用本服务。 

`,
    agreeTerms: `点击下方按钮表示你已阅读并同意上述条款。`,
    'antiFraud.confirm_button': `[需要翻译: onboarding.antiFraud.confirm_button]`,
    'antiFraud.learn_button': `[需要翻译: onboarding.antiFraud.learn_button]`,
    'antiFraud.question1': `[需要翻译: onboarding.antiFraud.question1]`,
    'antiFraud.question2': `[需要翻译: onboarding.antiFraud.question2]`,
    'antiFraud.question3': `[需要翻译: onboarding.antiFraud.question3]`,
    antiFraudConfirm: `请确认：`,
    antiFraudFinalStep: `🛡️ 最后一步：反诈骗安全确认

`,
    antiFraudLearn: `📚 我想了解更多安全知识`,
    antiFraudPassed: `✅ 反诈骗测验通过！ 

`,
    antiFraudQuestion1: `1. 你了解网路交友的安全风险吗？ 
`,
    antiFraudQuestion2: `2. 你会保护好自己的个人资讯吗？ 
`,
    antiFraudQuestion3: `3. 遇到可疑讯息时，你会提高警觉吗？ 

`,
    antiFraudQuestions: `为了保护所有使用者的安全，请确认你了解以下事项：

`,
    antiFraudYes: `✅ 是的，我了解并会注意安全`,
    back: `⬅️ 返回`,
    birthday: `如果你认为这是错误，请检查你的生日格式是否正确（YYYY-MM-DD）。`,
    birthday2: `请重新输入你的生日（格式：YYYY-MM-DD）：

`,
    birthday3: `请输入你的生日（格式：YYYY-MM-DD）：

`,
    birthday4: `生日：\${birthday}
`,
    birthdayCheck: `如果你认为这是错误，请检查你的生日格式是否正确（YYYY-MM-DD）。`,
    birthdayError: `❌ {error}

`,
    birthdayFormatError: `❌ 生日格式错误

请重新输入（格式：YYYY-MM-DD）：`,
    birthdayRetry: `请重新输入生日（格式：YYYY-MM-DD）：`,
    birthdayWarning: `⚠️ 生日设定后无法修改，请确认无误！`,
    bloodType: `🩸 **请选择你的血型**

`,
    'bloodType.select': `[需要翻译: onboarding.bloodType.select]`,
    complete: `请输入「是」完成测验：`,
    confirm: `为了保护所有使用者的安全，请确认你了解网路交友的风险。 

`,
    confirm2: `🛡️ 现在进行反诈骗安全确认

`,
    confirm3: `了解后，请确认：`,
    confirmBirthday: `⚠️ 请确认你的生日资讯：

`,
    customNickname: `[需要翻译: onboarding.customNickname]`,
    enterYes: `请输入「是」完成测验：`,
    errorRetry: `❌ 发生错误，请重新输入。`,
    gender: `• 性别：\${updatedUser.gender}
`,
    'gender.female': `女`,
    'gender.male': `男`,
    gender2: `• 性别：\${updatedUser.gender ===`,
    gender3: `请选择你的性别：

`,
    genderFemale: `👩 女性`,
    genderMale: `👨 男性`,
    genderWarning: `⚠️ 注意：性别设定后无法修改，请谨慎选择！`,
    help: `这将帮助我们为你找到更合适的聊天对象～

`,
    iHaveRead: `✅ 我已阅读并同意`,
    languageSelection: `🌐 **选择语言**

请选择你的偏好语言：`,
    lastStep: `最后一步：请阅读并同意我们的服务条款

`,
    legalDocuments: `📋 Legal documents are provided in English only.

`,
    mbti: `请选择你的 MBTI 类型：

`,
    mbti2: `✍️ 我已经知道我的 MBTI`,
    message: `2. 🚨 识别诈骗讯息
`,
    message2: `• 警惕索要金钱的讯息
`,
    nickname: `• 昵称：\${updatedUser.nickname}
`,
    nickname2: `很好！你的昵称是：\${nickname}

`,
    nicknameError: `❌ {error}

请重新输入昵称：`,
    nicknameGood: `很好！你的昵称是：{nickname}

`,
    notCompleted: `[需要翻译: onboarding.notCompleted]`,
    nowSelectGender: `现在请选择你的性别：

`,
    otherUserNotFound: `❌ 对方用户不存在。`,
    pleaseAnswer: `❌ 请认真回答问题

`,
    pleaseComeBack: `请成年后再来！ 

`,
    privacyPolicy: `📋 隐私权政策
`,
    profile: `• 隐私权政策：我们如何保护你的个人资料
`,
    profile2: `你的个人资料：
`,
    retry: `❌ 重新输入`,
    senderInfoError: `❌ 发送者资讯错误。`,
    settings: `💡 提示：你可以随时使用 /mbti 指令来设定或测验你的 MBTI 类型。 

`,
    settings2: `🧠 现在让我们设定你的 MBTI 性格类型！ 

`,
    settings3: `好的，你可以稍后再设定 MBTI。 

`,
    settings4: `如果不确定，可以先进行测验或稍后再设定。`,
    settings5: `🎉 恭喜！你已经完成所有设定！ 

`,
    settings6: `• 生日设定后无法修改
`,
    settings7: `你想要如何设定？`,
    short: `⏭️ 稍后再说`,
    start: `在开始使用前，请阅读并同意我们的服务条款：

`,
    start2: `现在你可以开始使用 XunNi 了！`,
    startRegistration: `[需要翻译: onboarding.startRegistration]`,
    stats: `📊 统计`,
    stepAntiFraud: `🛡️ 请点击上方按钮确认反诈骗安全事项`,
    stepBirthday: `📅 请输入你的生日（格式：YYYY-MM-DD，例如：1995-06-15）`,
    stepDefault: `请按照提示完成注册`,
    stepGender: `👤 请点击上方按钮选择你的性别`,
    stepLanguageSelection: `🌍 请点击上方按钮选择你的语言`,
    stepMbti: `🧠 请点击上方按钮选择 MBTI 设定方式`,
    stepNickname: `✏️ 请输入你的昵称`,
    stepTerms: `📜 请点击上方按钮同意服务条款`,
    'terms.agree_button': `[需要翻译: onboarding.terms.agree_button]`,
    'terms.english_only_note': `[需要翻译: onboarding.terms.english_only_note]`,
    'terms.privacy_policy_button': `[需要翻译: onboarding.terms.privacy_policy_button]`,
    'terms.terms_of_service_button': `[需要翻译: onboarding.terms.terms_of_service_button]`,
    termsOfService: `📋 使用者条款

`,
    text: `confirm_birthday_\${birthday}`,
    text10: `例如：1995-06-15

`,
    text11: `🛡️ 网路交友安全小贴士

`,
    text12: `📋 最后一步：服务条款

`,
    text13: `• 第一次见面选择公共场所
`,
    text14: `1. 🔒 保护个人资讯
`,
    text15: `• 不要分享财务资讯

`,
    text16: `• 不要点击可疑连结

`,
    text17: `• 告诉朋友你的行程

`,
    text18: `3. 🤝 安全交友
`,
    text19: `📋 使用者条款

`,
    text2: `💡 你可以随时使用 /mbti 指令重新测验或修改。`,
    text20: `请成年后再来！ 

`,
    text21: `📋 隐私权政策
`,
    text3: `gender_confirm_\${gender}`,
    text4: `最后一步：请阅读并同意我们的服务条款

`,
    text5: `📝 进行快速测验（12 题，仅供参考）`,
    text6: `• 使用者条款：使用本服务的规范

`,
    text7: `点击下方按钮表示你已阅读并同意上述条款。`,
    text8: `• 不要轻易透露真实姓名、地址、电话
`,
    text9: `• 必须年满 18 岁才能使用本服务`,
    understandRisks: `为了保护所有使用者的安全，请确认你了解网路交友的风险。 

`,
    viewPrivacyPolicy: `📋 View Privacy Policy`,
    viewTermsOfService: `📋 View Terms of Service`,
    vip: `💡 填写血型可用于未来的血型配对功能（VIP 专属）

`,
    welcome: `[需要翻译: onboarding.welcome]`,
    yourAge: `你的年龄：{age} 岁
`,
    zodiac: `• 星座：\${updatedUser.zodiac_sign}
`,
    zodiac2: `星座：\${zodiacSign}

`,
  },
  profile: {
    activatedInvites: `✅ 已激活邀请：{successfulInvites} / {inviteLimit} 人
`,
    age: `🎂 年龄：\${age}
`,
    anonymousUser: `匿名用户`,
    bloodType: `🩸 血型：\${bloodType}
`,
    bottle: `: permanentQuota} 个瓶子

`,
    cardAge: `{age} 岁`,
    cardBio: `📝 简介：
{bio}

`,
    cardFooter: `💡 这是你在对话中展示给对方的资料卡片

`,
    cardGenderFemale: `♀️ 女`,
    cardGenderMale: `♂️ 男`,
    cardInterests: `🏷️ 兴趣：{interests}

`,
    cardLanguage: `🌍 语言：{language}

`,
    cardMbti: `🧠 MBTI：{mbti}
`,
    cardSeparator: `━━━━━━━━━━━━━━━━
`,
    cardTitle: `┌─────────────────────────┐
│ 📇 个人资料卡片 │
└─────────────────────────┘

`,
    cardZodiac: `⭐ 星座：{zodiac}
`,
    completeOnboarding: `⚠️ 请先完成注册流程。 

使用 /start 继续注册。`,
    conversation: `💡 这是你在对话中展示给对方的资料卡片

`,
    editProfile: `📝 编辑资料`,
    gender: `👤 性别：\${gender}
`,
    hints: `💡 提示：
`,
    invite: `⏳ 待激活邀请：\${inviteStats.pending} 人
`,
    invite2: `🎁 **邀请资讯**

`,
    inviteCodeLabel: `📋 你的邀请码：\`{inviteCode}\`
`,
    manual: `手动设定`,
    mbti: `• 使用 /mbti 重新测验或修改 MBTI
`,
    mbtiWithSource: `🧠 MBTI：{mbti}{source}
`,
    message: `https://t.me/share/url?url=https://t.me/\${botUsername}?start=invite_\${inviteCode}&text=来 XunNi 一起丢漂流瓶吧！ 🍾 使用我的邀请码：\${inviteCode} https://t.me/share/url?url=https://t.me/\${botUsername}?start=invite_\${inviteCode}&text=來`,
    message2: `\${!user.is_vip && successfulInvites >= inviteLimit ? '⚠️ 已达免费用户邀请上限，升级 VIP 可解锁 100 人上限！ ' : ''}

`,
    message3: `🌍 语言：\${user.language_pref}

`,
    message4: `🌍 语言：\${user.language_pref}
`,
    message5: `📈 转化率：\${inviteStats.conversionRate}%
`,
    message6: `\${gender} • \${age} 岁 • \${city}

`,
    message7: `https://t.me/share/url?url=https://t.me/\${botUsername}?start=invite_\${inviteCode}&text=来 XunNi 一起丢漂流 https://t.me/share/url?url=https://t.me/\${botUsername}?start=invite_\${inviteCode}&text=來`,
    mysterious: `这个人很神秘，什么都没有留下～`,
    nickname: `📛 昵称：\${displayNickname}
`,
    notSet: `未设定`,
    profile: `│ 📇 个人资料卡片 │
`,
    profile2: `👤 **个人资料**

`,
    quota: `💡 完成任务可获得当日额外配额（使用 /tasks 查看）
`,
    quota2: `📦 当前每日配额：\${taskBonus > 0 ?`,
    quotaBottles: `{taskBonus} 个瓶子`,
    quotaTotal: `📦 当前每日配额：{quota}

`,
    returnToMenu: `🏠 返回主选单：/menu`,
    separator: `━━━━━━━━━━━━━━━━

`,
    settings: `未设定`,
    settings2: `未设定`,
    settings3: `未设定`,
    settings4: `未设定`,
    settings5: `未设定`,
    settings6: `未设定`,
    settings7: `未设定`,
    settings8: `未设定`,
    shareInviteCode: `📤 分享邀请码`,
    short: `📝 编辑资料`,
    short2: `免费会员`,
    stats: `• 使用 /stats 查看统计数据

`,
    success: `💡 每成功邀请 1 人，每日配额永久 +1
`,
    systemError: `❌ 系统发生错误，请稍后再试。`,
    test: `测验结果`,
    text: `• 使用 /profile_card 查看完整资料卡片
`,
    text2: `🏷️ 兴趣：\${interests}

`,
    text3: `💎 会员：\${vipStatus}

`,
    text4: `📝 简介：
\${bio}

`,
    text5: `这个人很神秘，什么都没有留下～`,
    userNotFound: `⚠️ 用户不存在，请先使用 /start 注册。`,
    vip: `VIP 会员（到期：\${new Date(user.vip_expire_at).toLocaleDateString('zh-TW')}）`,
    vip2: `• 使用 /vip 升级 VIP 会员
`,
    vipUpgrade: `• 使用 /vip 升级 VIP 会员
`,
    zodiac: `⭐ 星座：\${zodiac}
`,
  },
  refreshAvatar: {
    failed: `❌ 刷新头像失败

请稍后再试，或联系管理员。`,
    processing: `🔄 正在刷新头像...

这可能需要几秒钟时间。`,
    success: `✅ **头像已更新！ **

您的头像缓存已刷新，下次查看对话历史时将显示最新头像。 

💡 **提示：**
• 头像会自动每 7 天更新一次
• 如果您更换了 Telegram 头像，系统会自动检测
• 您也可以随时使用此命令手动刷新`,
    userNotFound: `❌ 用户不存在，请先注册`,
  },
  refreshConversations: {
    clickButtonHint: `💡 **提示**：请点击上方的按钮来开始使用`,
    commandHelp: `• /help - 查看帮助`,
    commandMenu: `• /menu - 主选单`,
    commandTasks: `• /tasks - 查看任务中心`,
    failed: `❌ 刷新对话历史失败

请稍后再试，或联系管理员。`,
    noHistory: `💡 **没有找到对话历史**

您还没有任何对话记录。 

使用 /throw 丢出漂流瓶开始聊天吧！`,
    partialSuccess: `⚠️ **对话历史部分更新**

成功刷新：{updated} 个
失败：{failed} 个

部分对话历史可能未能更新，请稍后再试。`,
    processing: `🔄 正在刷新所有对话历史...

这可能需要一些时间，请稍候。`,
    success: `✅ **对话历史已更新！ **

成功刷新 {updated} 个对话的历史帖子。 

💡 **提示：**
• VIP 用户可以看到清晰的对方头像
• 免费用户看到的是模糊头像
• 升级 VIP 后会自动刷新历史帖子`,
    userNotFound: `❌ 用户不存在，请先注册`,
  },
  report: {
    blockHint: `• 长按对方讯息回覆 /block 可封锁此使用者
`,
    cancel: `❌ 取消`,
    cancelled: `已取消`,
    cannotIdentify: `⚠️ 无法识别对话对象

`,
    catchHint: `• 使用 /catch 捡新的漂流瓶`,
    completeOnboarding: `⚠️ 请先完成注册流程。 

使用 /start 继续注册。`,
    conversationInfoError: `⚠️ 对话资讯错误。`,
    conversationInfoError2: `⚠️ 对话资讯错误`,
    conversationNotExists: `⚠️ 对话不存在`,
    conversationNotFound: `⚠️ 找不到此对话

对话可能已结束或不存在。`,
    ensureReply: `请确保回覆的是对方发送的讯息（带有 # 标识符）。`,
    hint: `💡 这样可以准确指定要举报的对象。`,
    multipleReports: `多次被举报 / Multiple reports`,
    reasonHarassment: `😡 骚扰 / 辱骂`,
    reasonNsfw: `🔞 色情内容`,
    reasonOther: `⚠️ 其他违规`,
    reasonScam: `💰 诈骗 / 钓鱼`,
    reasonSpam: `📢 垃圾广告`,
    replyRequired: `⚠️ 请长按你要举报的讯息后回覆指令

`,
    selectReason: `请选择举报原因：`,
    sessionExpired: `⚠️ 会话已过期，请重新操作`,
    step1: `1️⃣ 长按对方的讯息
`,
    step2: `2️⃣ 选择「回覆」
`,
    step3: `3️⃣ 输入 /report

`,
    steps: `**操作步骤：**
`,
    submitted: `✅ **举报已提交** (#{identifier})

`,
    systemError: `❌ 系统发生错误`,
    thanks: `感谢你的举报，我们会尽快审核。 

`,
    tips: `💡 提示：
`,
    title: `🚨 **举报不当内容** (#{identifier})

`,
    userNotFound: `⚠️ 用户不存在，请先使用 /start 注册。`,
  },
  risk: {
    containsSensitiveWords: `包含敏感词汇`,
  },
  router: {
    replyPrompt: `💬 回覆`,
    suggestCatch: `❓ 要捡漂流瓶？ 

使用 /catch 捡起漂流瓶

💡 **常用命令**：
• /throw - 丢出漂流瓶
• /catch - 捡起漂流瓶
• /menu - 主选单
• /tasks - 任务中心`,
    suggestMenu: `❓ 找不到此命令

💡 **常用命令**：
• /throw - 丢出漂流瓶
• /catch - 捡起漂流瓶
• /menu - 主选单
• /tasks - 任务中心`,
    suggestThrow: `❓ 要丢漂流瓶？ 

请长按上一则讯息，或本讯息，
选单上选择「回覆」后，
输入要发送的漂流瓶内容

💡 **常用命令**：
• /throw - 丢出漂流瓶
• /catch - 捡起漂流瓶
• /menu - 主选单
• /tasks - 任务中心

#THROW`,
    throwPrompt: `📝 请输入你的漂流瓶内容：`,
  },
  session: {
    timeoutCatchBottle: `⏰ 捡瓶流程已超时

请使用 /catch 重新开始。`,
    timeoutConversation: `⏰ 对话已超时

对方可能已离开。使用 /catch 捡新的瓶子吧！`,
    timeoutEditProfile: `⏰ 编辑资料流程已超时

请重新开始编辑。`,
    timeoutOnboarding: `⏰ 注册流程已超时

请使用 /start 重新开始注册。`,
    timeoutThrowBottle: `⏰ 丢瓶流程已超时

请使用 /throw 重新开始。`,
    typeCatchBottle: `捡瓶流程`,
    typeConversation: `对话`,
    typeEditProfile: `编辑资料`,
    typeOnboarding: `注册流程`,
    typeThrowBottle: `丢瓶流程`,
  },
  settings: {
    back: `返回`,
    changeLanguage: `🌐 更改语言`,
    languageLabel: `🌐 语言：{language}`,
    languageUpdated: `✅ 语言已更新为 {language}`,
    currentSettings: `⚙️ **当前设定**`,
    message: `🌐 **选择语言 / Choose Language**

请选择你的偏好语言：`,
    returnToMenu: `⬅️ 返回主选单`,
    selectOption: `请选择选项：`,
    settings: `💡 选择你想要修改的设定：`,
    settings2: `⚙️ **设定**

`,
    settings3: `🏠 返回设定`,
    settings4: `当前设定：
`,
    text: `• 语言：\${languageName} 🇹🇼

`,
    title: `🏠 **主选单**`,
  },
  stats: {
    activeUsers: `• 昨日活跃：{active}

`,
    age: `🎂 **年龄**：\${age} 岁
`,
    avgMatches: `• 平均每次配对：\${avg} 个对象
`,
    bottle: `
💎 **VIP 三倍瓶子统计**（近 30 天）
`,
    bottle2: `🍾 **漂流瓶**
`,
    bottle3: `🎈 漂流瓶统计
`,
    bottles: `🍾 **漂流瓶**
`,
    bottlesCaught: `• 捡到：\${count} 个
`,
    bottlesThrown: `• 丢出：\${count} 个
`,
    catch: `• 昨日被捡：\${stats.caughtBottles}

`,
    catch2: `• 捡到：\${stats.bottlesCaught} 个
`,
    caught: `• 昨日被捡：{caught}

`,
    conversation: `• 活跃对话：\${stats.activeConversations}
`,
    conversation2: `• 总对话数：\${stats.totalConversations}
`,
    conversation3: `• 总对话数：\${stats.totalConversations}`,
    conversation4: `💬 **对话**
`,
    conversation5: `💬 对话统计
`,
    conversations: `💬 **对话**
`,
    conversationsActive: `• 活跃对话：\${count}
`,
    conversationsTotal: `• 总对话数：\${count}
`,
    date: `日期：{date}

`,
    dateFormatError: `日期格式错误，应为 YYYY-MM-DD`,
    match: `🎯 **匹配**
`,
    matchRate: `• 匹配成功率：\${rate}%
`,
    matchRateValue: `• 配对率：\${rate}%
`,
    matchedSlots: `• 成功配对：\${count}
`,
    mbti: `🧠 **MBTI**：\${mbti}
`,
    message: `• 到期时间：\${new Date(user.vip_expire_at!).toLocaleDateString('zh-TW')}
`,
    message10: `• 总讯息数：\${stats.totalMessages}`,
    message2: `\${used}/\${permanentQuota}+\${taskBonus} (剩余 \${remaining})`,
    message3: `报告生成时间：\${new Date().toLocaleString('zh-TW')}`,
    message4: `\${used}/\${permanentQuota} (剩余 \${remaining})`,
    message5: `• 总讯息数：\${stats.totalMessages}

`,
    message6: `• 昨日新增讯息：\${stats.newMessages}

`,
    message7: `• 总配对槽位：\${vipStats.totalSlots}
`,
    message8: `• 平均回覆率：\${stats.replyRate}%

`,
    message9: `• 昨日活跃：\${stats.activeUsers}

`,
    messages: `💬 对话统计`,
    messagesTotal: `• 总讯息数：\${count}
`,
    new: `• 昨日新增：{new}`,
    newMessages: `• 昨日新增讯息：{new}

`,
    newUsers: `• 昨日新增：{new}`,
    newVip: `• 昨日新增：{new}

`,
    notSet: `未设定`,
    quota: `• 今日配额：\${stats.todayQuota.display}

`,
    register: `📅 **注册时间**：\${new Date(user.created_at).toLocaleDateString('zh-TW')}
`,
    register2: `• 总注册数：\${stats.totalUsers}`,
    registerTime: `📅 **注册时间**：\${date}
`,
    replyRate: `• 平均回覆率：\${rate}%
`,
    reportTime: `报告生成时间：{time}`,
    separator: `---
`,
    settings: `🧠 **MBTI**：\${user.mbti_result}

 `,
    settings2: `未设定`,
    short: `免费会员`,
    statDateEmpty: `统计日期不能为空`,
    stats: `📊 **我的统计数据**

`,
    stats2: `💎 VIP 统计
`,
    stats3: `👥 用户统计
`,
    stats4: `统计日期不能为空`,
    success: `• 成功配对：\${vipStats.matchedSlots}
`,
    success2: `• 匹配成功率：\${stats.matchRate}%
`,
    text: `• 平均每次配对：\${avgMatches} 个对象
`,
    text10: `🎯 **匹配**
`,
    text2: `• 昨日新增：\${stats.newBottles}
`,
    text3: `• 总数：\${stats.totalBottles}`,
    text4: `• 昨日新增：\${stats.newUsers}
`,
    text5: `• 昨日新增：\${stats.newVip}

`,
    text6: `• 配对率：\${matchRate}%
`,
    text7: `📊 XunNi Bot 每日数据报告
`,
    text8: `日期格式错误，应为 YYYY-MM-DD`,
    text9: `日期：\${dateStr}

`,
    throw: `• 丢出：\${stats.bottlesThrown} 个
`,
    throw2: `• 丢出次数：\${vipStats.throws}
`,
    throws: `• 丢出次数：\${count}
`,
    timeLeftDaysHours: `\${days} 天 \${hours} 小时`,
    timeLeftHours: `\${hours} 小时`,
    title: `📊 **我的统计数据**

`,
    todayQuota: `• 今日配额：\${display}

`,
    total: `• 总数：{total}`,
    totalConversations: `• 总对话数：{total}`,
    totalMessages: `• 总讯息数：{total}`,
    totalSlots: `• 总配对槽位：\${count}
`,
    totalUsers: `• 总注册数：{total}`,
    totalVip: `• 总 VIP 数：{total}`,
    totalWithDiff: `• 总数：{total} ({diff})`,
    users: `👥 用户统计`,
    vip: `⭐ **VIP 状态**
`,
    vip2: `⭐ **VIP 状态**
`,
    vip3: `VIP 会员 💎`,
    vipAvgMatches: `• 平均每次配对：{avg} 个对象`,
    vipExpire: `• 到期时间：\${date}
`,
    vipFree: `免费会员`,
    vipMatchRate: `• 配对率：{rate}%`,
    vipMatchedSlots: `• 成功配对：{count}`,
    vipMember: `VIP 会员 💎`,
    vipThrows: `• 丢出次数：{count}`,
    vipTotalSlots: `• 总配对槽位：{count}`,
    vipTriple: `💎 **VIP 三倍瓶子统计**（近 \${days} 天）`,
    vipTripleTitle: `💎 **VIP 三倍瓶子统计**（近 {days} 天）`,
    zodiac: `🔮 **星座**：\${zodiac}
`,
  },
  status: {
    cancelled: `已取消`,
    completed: `已完成`,
    failed: `失败`,
    pending: `等待中`,
    sending: `发送中`,
  },
  subscription: {
    downgradedToFree: `你的帐号已恢复为免费会员。`,
    expired: `😢 **VIP 订阅已到期**`,
    expiredDate: `你的 VIP 订阅已于 \${date} 到期。`,
    renewVipHint: `💡 随时可以重新订阅 VIP：/vip`,
    thankYou: `感谢你的支持！ ❤️`,
  },
  success: {
    ad: `✅ 你已经看过所有官方广告了！`,
    ad2: `✅ 已启用广告提供商：\${providerName}

`,
    ad3: `✅ 已停用广告提供商：\${providerName}

`,
    ad4: `✅ 已启用官方广告 #\${adId}

`,
    ad5: `✅ 已停用官方广告 #\${adId}

`,
    ad6: `✅ 已设置广告提供商优先级

`,
    ad7: `✅ 今日广告已达上限`,
    appeal: `✅ 申诉 \${appealId} 已批准，用户已解封`,
    appeal2: `✅ 申诉 \${appealId} 已拒绝`,
    appeal3: `✅ 目前没有待审核的申诉`,
    birthday: `✅ 生日已保存`,
    bloodType: `✅ 血型已更新为 \${getBloodTypeDisplay(bloodType as any)}`,
    bloodType2: `✅ 血型已清除`,
    bottle: `✅ 奖励已发放！ +1 瓶子`,
    bottle2: `✅ 开始新的漂流瓶`,
    bottle3: `✅ 瓶子已创建
`,
    broadcast: `✅ 已清理 \${ids.length} 个卡住的广播

`,
    broadcast2: `✅ 没有需要清理的广播

`,
    broadcast3: `✅ 过滤广播已创建

`,
    broadcast4: `✅ 广播已创建

`,
    cancel: `✅ 广播已取消

`,
    complete: `✅ 广播队列处理完成

`,
    complete2: `✅ 系统维护已完成

`,
    complete3: `✅ 教学已完成！`,
    complete4: `✅ **批量刷新完成**

`,
    complete5: `✅ **刷新完成**

`,
    complete6: `✅ 完成筛选，输入内容`,
    complete7: `✅ 筛选完成`,
    confirm: `✅ 已确认！`,
    confirm2: `✅ 安全确认完成`,
    confirm3: `✅ 确认`,
    conversation: `✅ **对话历史已更新！ **

`,
    gender: `✅ 性别已保存`,
    invite: `✅ 已激活邀请：\${successfulInvites} / \${inviteLimit} 人
`,
    mbti: `✅ 你的 MBTI 类型已更新为：**\${mbtiType}**

`,
    mbti2: `✅ 你的 MBTI 类型已清除。 

`,
    mbti3: `✅ MBTI 已清除`,
    mbti4: `✅ 已清除 MBTI 选择`,
    mbti5: `✅ 你的 MBTI 类型：\${mbtiType}

`,
    message: `✅ 讯息已发送给 \${formatIdentifier(receiverIdentifier)}

`,
    message2: `✅ 语言已更新为：\${getLanguageDisplay(languageCode)}`,
    message3: `✅ 已封锁此使用者 (#\${conversationIdentifier})

`,
    message4: `✅ 获得 +\${ad.reward_quota} 个永久额度！`,
    message5: `✅ 已选择 \${gender}`,
    message6: `✅ 已选择 \${bloodTypeDisplay[bloodType]}`,
    message7: `✅ 已选择 \${ZODIAC_NAMES[zodiacSign]}`,
    message8: `✅ 你选择了：\${gender}

`,
    nickname: `✅ 使用 Telegram 昵称：\${suggestedNickname.substring(0, 18)}`,
    nickname2: `✅ 昵称已更新为：\${text}

`,
    register: `✅ 开发模式：跳过注册

`,
    register2: `✅ 我了解了，继续注册`,
    register3: `✅ 注册完成！`,
    report: `✅ **举报已提交** (#\${conversationIdentifier})

`,
    report2: `✅ 举报已提交`,
    report3: `✅ **已举报此用户**

`,
    report4: `✅ 确定举报`,
    report5: `✅ 已举报`,
    reportSubmitted: `[需要从 zh-TW.ts 获取翻译]`,
    settings: `✅ MBTI 已设定为 \${mbtiType}`,
    settings2: `✅ 昵称已设定`,
    settings3: `✅ 筛选条件已设定：

`,
    settings4: `✅ 血型已设定为 \${getBloodTypeDisplay(bloodType as any)}`,
    settings5: `✅ MBTI 类型已设定：\${mbtiType}

`,
    settings6: `✅ 已跳过血型设定`,
    short: `✅ 正在发送...`,
    short10: `✅ 正在加载...`,
    short11: `✅ 🌈 任何人`,
    short12: `✅ 👨 男生`,
    short13: `✅ 👩 女生`,
    short14: `✅ 继续编辑`,
    short15: `✅ 确定封锁`,
    short16: `✅ 已封锁`,
    short17: `✅ 我已阅读并同意`,
    short18: `✅ 已跳过`,
    short19: `✅ 领取奖励`,
    short2: `✅ 继续编辑草稿`,
    short20: `✅ 维护中`,
    short3: `✅ 草稿已删除`,
    short4: `✅ 验证并领取`,
    short5: `✅ 发送草稿`,
    short6: `✅ 已记录`,
    short7: `✅ 正确`,
    short8: `✅ 启用`,
    short9: `✅ 是`,
    start: `✅ 请点击按钮开始观看`,
    start2: `✅ 开始快速版测验`,
    start3: `✅ 开始完整版测验`,
    start4: `✅ 开始测验`,
    success: `✅ 验证成功！获得 +\${ad.reward_quota} 个永久额度！`,
    'success.ad': `✅ 你已经看过所有官方广告了！`,
    'success.ad2': `✅ 已启用广告提供商：\\\${providerName}

`,
    'success.ad3': `✅ 已停用广告提供商：\\\${providerName}

`,
    'success.ad4': `✅ 已启用官方广告 #\\\${adId}

`,
    'success.ad5': `✅ 已停用官方广告 #\\\${adId}

`,
    'success.ad6': `✅ 已设置广告提供商优先级

`,
    'success.ad7': `✅ 今日广告已达上限`,
    'success.appeal': `✅ 申诉 \\\${appealId} 已批准，用户已解封`,
    'success.appeal2': `✅ 申诉 \\\${appealId} 已拒绝`,
    'success.appeal3': `✅ 目前没有待审核的申诉`,
    'success.birthday': `✅ 生日已保存`,
    'success.bloodType': `✅ 血型已更新为 \\\${getBloodTypeDisplay(bloodType as any)}`,
    'success.bloodType2': `✅ 血型已清除`,
    'success.bottle': `✅ 奖励已发放！ +1 瓶子`,
    'success.bottle2': `✅ 开始新的漂流瓶`,
    'success.bottle3': `✅ 瓶子已创建
`,
    'success.broadcast': `✅ 已清理 \\\${ids.length} 个卡住的广播

`,
    'success.broadcast2': `✅ 没有需要清理的广播

`,
    'success.broadcast3': `✅ 过滤广播已创建

`,
    'success.broadcast4': `✅ 广播已创建

`,
    'success.cancel': `✅ 广播已取消

`,
    'success.complete': `✅ 广播队列处理完成

`,
    'success.complete2': `✅ 系统维护已完成

`,
    'success.complete3': `✅ 教学已完成！`,
    'success.complete4': `✅ **批量刷新完成**

`,
    'success.complete5': `✅ **刷新完成**

`,
    'success.complete6': `✅ 完成筛选，输入内容`,
    'success.complete7': `✅ 筛选完成`,
    'success.confirm': `✅ 已确认！`,
    'success.confirm2': `✅ 安全确认完成`,
    'success.confirm3': `✅ 确认`,
    'success.conversation': `✅ **对话历史已更新！ **

`,
    'success.gender': `✅ 性别已保存`,
    'success.invite': `✅ 已激活邀请：\\\${successfulInvites} / \\\${inviteLimit} 人
`,
    'success.mbti': `✅ 你的 MBTI 类型已更新为：**\\\${mbtiType}**

`,
    'success.mbti2': `✅ 你的 MBTI 类型已清除。 

`,
    'success.mbti3': `✅ MBTI 已清除`,
    'success.mbti4': `✅ 已清除 MBTI 选择`,
    'success.mbti5': `✅ 你的 MBTI 类型：\\\${mbtiType}

`,
    'success.message': `✅ 讯息已发送给 \\\${formatIdentifier(receiverIdentifier)}

`,
    'success.message2': `✅ 语言已更新为：\\\${getLanguageDisplay(languageCode)}`,
    'success.message3': `✅ 已封锁此使用者 (#\\\${conversationIdentifier})

`,
    'success.message4': `✅ 获得 +\\\${ad.reward_quota} 个永久额度！`,
    'success.message5': `✅ 已选择 \\\${gender}`,
    'success.message6': `✅ 已选择 \\\${bloodTypeDisplay[bloodType]}`,
    'success.message7': `✅ 已选择 \\\${ZODIAC_NAMES[zodiacSign]}`,
    'success.message8': `✅ 你选择了：\\\${gender}

`,
    'success.nickname': `✅ 使用 Telegram 昵称：\\\${suggestedNickname.substring(0, 18)}`,
    'success.nickname2': `✅ 昵称已更新为：\\\${text}

`,
    'success.register': `✅ 开发模式：跳过注册

`,
    'success.register2': `✅ 我了解了，继续注册`,
    'success.register3': `✅ 注册完成！`,
    'success.report': `✅ **举报已提交** (#\\\${conversationIdentifier})

`,
    'success.report2': `✅ 举报已提交`,
    'success.report3': `✅ **已举报此用户**

`,
    'success.report4': `✅ 确定举报`,
    'success.report5': `✅ 已举报`,
    'success.settings': `✅ MBTI 已设定为 \\\${mbtiType}`,
    'success.settings2': `✅ 昵称已设定`,
    'success.settings3': `✅ 筛选条件已设定：

`,
    'success.settings4': `✅ 血型已设定为 \\\${getBloodTypeDisplay(bloodType as any)}`,
    'success.settings5': `✅ MBTI 类型已设定：\\\${mbtiType}

`,
    'success.settings6': `✅ 已跳过血型设定`,
    'success.short': `✅ 正在发送...`,
    'success.short10': `✅ 正在加载...`,
    'success.short11': `✅ 🌈 任何人`,
    'success.short12': `✅ 👨 男生`,
    'success.short13': `✅ 👩 女生`,
    'success.short14': `✅ 继续编辑`,
    'success.short15': `✅ 确定封锁`,
    'success.short16': `✅ 已封锁`,
    'success.short17': `✅ 我已阅读并同意`,
    'success.short18': `✅ 已跳过`,
    'success.short19': `✅ 领取奖励`,
    'success.short2': `✅ 继续编辑草稿`,
    'success.short20': `✅ 维护中`,
    'success.short3': `✅ 草稿已删除`,
    'success.short4': `✅ 验证并领取`,
    'success.short5': `✅ 发送草稿`,
    'success.short6': `✅ 已记录`,
    'success.short7': `✅ 正确`,
    'success.short8': `✅ 启用`,
    'success.short9': `✅ 是`,
    'success.start': `✅ 请点击按钮开始观看`,
    'success.start2': `✅ 开始快速版测验`,
    'success.start3': `✅ 开始完整版测验`,
    'success.start4': `✅ 开始测验`,
    'success.success': `✅ 验证成功！获得 +\\\${ad.reward_quota} 个永久额度！`,
    'success.text': `✅ 已设置为 \\\${flag} \\\${countryName}`,
    'success.text10': `✅ 是的，我了解并会注意安全`,
    'success.text11': `✅ 维护模式已启用

`,
    'success.text12': `✅ 维护模式已关闭

`,
    'success.text13': `✅ 更准确的性格分析
`,
    'success.text14': `✅ 已跳过教学

`,
    'success.text15': `✅ 所有帖子都是最新的（免费用户状态正确）
`,
    'success.text16': `✅ **无需刷新**

`,
    'success.text17': `✅ 已选择 \\\${gender ===`,
    'success.text18': `✅ 已选择 \\\${mbtiType}`,
    'success.text19': `✅ **规则**：
`,
    'success.text2': `✅ 兴趣标签已更新：

\\\${interestsStr}`,
    'success.text20': `✅ **已封锁此用户**

`,
    'success.text21': `✅ **退款申请已提交**

`,
    'success.text22': `✅ **退款已批准**

`,
    'success.text23': `✅ 没有待处理的退款请求。`,
    'success.text24': `✅ 正在准备支付...`,
    'success.text25': `✅ 退款已批准

`,
    'success.text26': `✅ 退款已拒绝

`,
    'success.text27': `✅ 我已加入，领取奖励`,
    'success.text28': `✅ 你选择了：\\\${gender ===`,
    'success.text29': `✅ 反诈骗测验通过！ 

`,
    'success.text3': `✅ 匹配偏好已更新为：\\\${prefText}

`,
    'success.text30': `✅ 语言已变更为 \\\${newLanguageName}`,
    'success.text4': `✅ 个人简介已更新！ 

\\\${text}`,
    'success.text5': `✅ 开发模式：数据已重置

`,
    'success.text6': `✅ 地区已更新为：\\\${text}`,
    'success.text7': `✅ 快速了解基本性格类型

`,
    'success.text8': `✅ **头像已更新！ **

`,
    'success.text9': `✅ 推荐用于重新测试

`,
    'success.vip': `✅ 所有帖子都是最新的（VIP 状态正确）
`,
    'success.zodiac': `✅ 已清除星座选择`,
    success2: `🎉 **验证成功！ **

✅ 获得 **+\${ad.reward_quota} 个永久额度**
💎 感谢你加入我们的社群！ 

📊 **你的额度：**
• 基础额度：\${user.is_vip ? '无限' : '10'}/天
• 永久额度：+\${ad.reward_quota}

💡 在社群中你可以：
• 与其他用户交流
• 获得最新功能更新
• 参与活动获得更多奖励 {user.is_vip ? '無限' : '10'} \${user.is_vip ? '無限' : '10'}`,
    success3: `成功刷新 \${result.updated} 个对话的历史帖子。 

`,
    success4: `成功刷新：\${result.updated} 个
`,
    text: `✅ 已设置为 \${flag} \${countryName}`,
    text10: `✅ 是的，我了解并会注意安全`,
    text11: `✅ 维护模式已启用

`,
    text12: `✅ 维护模式已关闭

`,
    text13: `✅ 更准确的性格分析
`,
    text14: `✅ 已跳过教学

`,
    text15: `✅ 所有帖子都是最新的（免费用户状态正确）
`,
    text16: `✅ **无需刷新**

`,
    text17: `✅ 已选择 \${gender ===`,
    text18: `✅ 已选择 \${mbtiType}`,
    text19: `✅ **规则**：
`,
    text2: `✅ 兴趣标签已更新：

\${interestsStr}`,
    text20: `✅ **已封锁此用户**

`,
    text21: `✅ **退款申请已提交**

`,
    text22: `✅ **退款已批准**

`,
    text23: `✅ 没有待处理的退款请求。`,
    text24: `✅ 正在准备支付...`,
    text25: `✅ 退款已批准

`,
    text26: `✅ 退款已拒绝

`,
    text27: `✅ 我已加入，领取奖励`,
    text28: `✅ 你选择了：\${gender ===`,
    text29: `✅ 反诈骗测验通过！ 

`,
    text3: `✅ 匹配偏好已更新为：\${prefText}

`,
    text30: `✅ 语言已变更为 \${newLanguageName}`,
    text4: `✅ 个人简介已更新！ 

\${text}`,
    text5: `✅ 开发模式：数据已重置

`,
    text6: `✅ 地区已更新为：\${text}`,
    text7: `✅ 快速了解基本性格类型

`,
    text8: `✅ **头像已更新！ **

`,
    text9: `✅ 推荐用于重新测试

`,
    vip: `✅ 所有帖子都是最新的（VIP 状态正确）
`,
    zodiac: `✅ 已清除星座选择`,
  },
  target: {
    all: `所有用户`,
    nonVip: `非 VIP 用户`,
    unknown: `未知`,
    vip: `VIP 用户`,
  },
  tasks: {
    bottle: `奖励：+\${task.reward_amount} 瓶子（\${task.reward_type}）

 {task.reward_type === 'daily' ? '當天有效' : '永久有效'} \${task.reward_type}`,
    bottle2: `奖励：+\${task.reward_amount} 瓶子（\${task.reward_type ===`,
    bottle3: `\${icon} \${task.name} (+\${task.reward_amount} 瓶子)
`,
    bottle4: `• 永久奖励：\${inviteProgress.current} 个瓶子（每天发放）
`,
    bottle5: `• 一次性奖励：\${todayRewardCount} 个瓶子（当天有效）
`,
    bottle6: `📋 **任务中心**

完成任务获得额外瓶子！ 

`,
    'description.bio': `写下你的故事（至少 20 字）`,
    'description.city': `找到同城的朋友`,
    'description.first_bottle': `开始你的交友之旅`,
    'description.first_catch': `看看别人的故事`,
    'description.first_conversation': `建立你的第一个连接（长按讯息 → 选择「回覆」）`,
    'description.interests': `让别人更了解你`,
    'description.invite_progress': `每邀请 1 人，每日额度永久 +1（免费最多 10 人，VIP 最多 100 人）`,
    'description.join_channel': `获取最新消息和活动`,
    invite: `🔄 邀请好友 (\${inviteProgress.current}/\${inviteProgress.max})
`,
    invite2: `每邀请 1 人 → 每日额度永久 +1
`,
    message: `\${icon} \${task.name} \${status} (+\${task.reward_amount} 瓶子)
`,
    message2: `点击下方按钮加入 XunNi 官方频道，获取最新消息和活动！ 

`,
    'name.bio': `完善自我介绍`,
    'name.city': `设定地区`,
    'name.first_bottle': `丢出第一个瓶子`,
    'name.first_catch': `捡起第一个瓶子`,
    'name.first_conversation': `开始第一次对话`,
    'name.interests': `填写兴趣标签`,
    'name.invite_progress': `邀请好友`,
    'name.join_channel': `加入官方频道`,
    profile: `👤 **个人资料任务** (\${completedCount}/\${profileTasks.length})
`,
    quota: `当前每日配额：\${calculateDailyQuota(user)} 个
`,
    short: `(待领取)`,
    short2: `当天有效`,
    short3: `永久有效`,
    task: `• 邀请任务：\${inviteProgress.current}/\${inviteProgress.max} 进行中

`,
    task2: `📱 **社交媒体任务** (\${completedCount}/\${socialTask​​s.length})
 {socialTasks.length} \${socialTasks.length}`,
    task3: `🎯 **行为任务** (\${completedCount}/\${actionTasks.length})
`,
    task4: `• 一次性任务：\${oneTimeCompleted}/\${oneTimeTotal} 已完成
`,
    task5: `🎉 恭喜完成任务「\${task.name}」！ 

`,
    task6: `👥 **邀请任务** (持续进行中)
`,
    task7: `💡 使用 /tasks 查看任务中心`,
    text: `加入后点击「我已加入」按钮领取奖励 🎁`,
    text2: `📢 **加入官方频道**

`,
    text3: `📊 **总进度**
`,
    text4: `🎁 **已获得**
`,
  },
  throw: {
    age: `• 年龄区间相近 ✓`,
    back: `↩️ 返回筛选选单`,
    bloodType: `🩸 **血型筛选**

`,
    bloodType2: `• 血型：筛选特定血型
`,
    bloodType3: `选择你想要配对的血型：`,
    bloodType4: `🩸 血型筛选`,
    bloodType5: `🌈 任何血型`,
    bottle: `
💡 这个瓶子和你非常合拍！ 
\${highlights.join('
')}
`,
    bottle10: `🍾 漂流瓶已丢出！ 

`,
    bottle11: `🍾 丢漂流瓶`,
    bottle2: `🎯 你的瓶子已发送给 **3 个对象**：
`,
    bottle3: `🍾 **正在丢出你的漂流瓶...**

`,
    bottle4: `🍾 **丢漂流瓶** #THROW

`,
    bottle5: `瓶子 ID：#\${bottleId}

`,
    bottle6: `📝 **请输入你的漂流瓶内容**

`,
    bottle7: `1️⃣ 点击下方「🍾 丢漂流瓶」按钮
`,
    bottle8: `📝 请输入你的漂流瓶内容：

`,
    bottle9: `📝 请输入你的漂流瓶内容：`,
    cancel: `💡 点击选择或取消 MBTI 类型：`,
    cancel2: `💡 点击选择或取消星座：`,
    catch: `• 槽位 3：公共池（等待捡起）

`,
    catch2: `• 槽位 2：公共池（等待捡起）
`,
    catch3: `• 槽位 1：公共池（等待捡起）
`,
    catch4: `🌊 等待有缘人捡起...
`,
    complete: `⚙️ **进阶筛选**

\${summary}
💡 继续调整或完成筛选：`,
    complete2: `🎯 **第 1 个配对已完成：**
`,
    complete3: `📝 你有一个未完成的草稿

`,
    complete4: `⏳ 预计 3-5 秒完成`,
    complete5: `⏳ 预计 2-3 秒完成`,
    complete6: `⏳ 预计 1-2 秒完成`,
    conversation: `💬 对话标识符：\${vipMatchInfo.conversationIdentifier}

`,
    conversation2: `💡 提示：每个对话都是独立的，可以同时进行

`,
    conversation3: `💡 你可能会收到 **最多 3 个对话**！ 
`,
    conversation4: `💬 你可能会收到 **最多 3 个对话**！ 
`,
    conversation5: `使用 /chats 查看所有对话

`,
    conversation6: `📊 使用 /chats 查看所有对话`,
    conversation7: `使用 /chats 查看所有对话`,
    currentSelection: `当前选择：{genderText}`,
    friendlyContent: `[需要从 zh-TW.ts 获取翻译]`,
    gender: `• 性别：\${selectedGender}
`,
    gender2: `👤 **性别筛选**

`,
    gender3: `• 性别：筛选性别

`,
    gender4: `💡 选择你想要的性别：`,
    gender5: `👤 性别筛选`,
    genderLabel: `• 性别：{gender}
`,
    mbti: `• MBTI：\${selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '无限制'}
 {selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '無限制'} \${selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '無限制'}`,
    mbti2: `已选择：\${selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '无'}

 {selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '無'} \${selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '無'}`,
    mbti3: `已选择：\${selectedMBTI.length > 0 ? selectedMBTI.join(`,
    mbti4: `🧠 **MBTI 筛选**

`,
    mbti5: `• MBTI：筛选特定性格类型
`,
    mbti6: `• MBTI 高度配对 ✓`,
    mbti7: `🧠 MBTI 筛选`,
    mbtiLabel: `• MBTI：{mbti}
`,
    message: `已选择：\${selectedZodiac.length > 0 ? selectedZodiac.map((z) => ZODIAC_NAMES[z]).join(', ') : '无'}

`,
    message2: `当前选择：\${currentGender}

`,
    message3: `已选择：\${selectedZodiac.length > 0 ? selectedZodiac.map((z) => ZODIAC_NAMES[z]).join(`,
    message4: `当前选择：\${bloodTypeDisplay[currentBloodType]}

`,
    message5: `👤 对方：\${vipMatchInfo.matcherNickname}
`,
    message6: `「你好！我是一个喜欢音乐和电影的人，希望认识志同道合的朋友～」

`,
    message7: `💡 可在 /edit_profile 中修改匹配偏好

`,
    message8: `💬 直接按 /reply 回覆讯息开始聊天
`,
    nickname: `📝 对方昵称：\${matchedUserMaskedNickname}
`,
    quota: `• 更多配额（30 个/天）
`,
    quota2: `🎁 邀请好友可增加配额：
`,
    settings: `🧠 MBTI：\${matchResult.user.mbti_result}
 `,
    settings2: `⭐ 星座：\${matchResult.user.zodiac}
 `,
    settings3: `🧠 MBTI：\${user.mbti_result}
 `,
    settings4: `⭐ 星座：\${user.zodiac_sign}
 `,
    settings5: `未设定`,
    settings6: `未设定`,
    settings7: `未设定`,
    settings8: `未设定`,
    short: `• 语言相同 ✓`,
    short10: `♋ 巨蟹座`,
    short11: `♌ 狮子座`,
    short12: `♍ 处女座`,
    short13: `♎ 天秤座`,
    short14: `♏ 天蝎座`,
    short15: `♐ 射手座`,
    short16: `♑ 摩羯座`,
    short17: `♒ 水瓶座`,
    short18: `♓ 双鱼座`,
    short19: `违规行为`,
    short2: `🩸 AB 型`,
    short20: `无限制`,
    short21: `无限制`,
    short22: `无限制`,
    short23: `无限制`,
    short3: `🌈 任何人`,
    short4: `🩸 A 型`,
    short5: `🩸 B 型`,
    short6: `🩸 O 型`,
    short7: `♈ 白羊座`,
    short8: `♉ 金牛座`,
    short9: `♊ 双子座`,
    start: `✍️ 重新开始`,
    success: `一次丢瓶子 = 3 个对象，大幅提升配对成功率

`,
    success2: `✨ **VIP 特权启动！智能配对成功！ **

`,
    success3: `🎯 你的漂流瓶已被配对成功！ 

`,
    text: `💝 匹配度：\${matchPercentage}%
`,
    text10: `🎯 正在为你寻找最佳配对对象

`,
    text11: `
💬 等待对方回覆中...
`,
    text12: `• 免费用户：最多 +7 个
`,
    text13: `• 不要包含个人联络方式

`,
    text14: `💡 **两种输入方式**：
`,
    text15: `📊 免费用户：3 个/天
`,
    text16: `选择你想要筛选的条件：

`,
    text17: `• 进阶筛选和翻译

`,
    text18: `创建时间：\${age}
`,
    text19: `使用 /vip 立即升级`,
    text2: `• 🆕 三倍曝光机会（1 次 = 3 个对象）
`,
    text20: `💬 **范例**：
`,
    text21: `使用 /vip 了解更多`,
    text22: `要继续编辑这个草稿吗？`,
    text23: `💡 可以组合多个条件`,
    text24: `当前筛选条件：

`,
    text3: `💡 这可能需要几秒钟，我们正在为你找到最合适的人`,
    text4: `当前选择：\${currentGender ===`,
    text5: `🎯 寻找对象：\${targetText}
`,
    text6: `🎯 正在为你寻找 3 个最佳配对对象

`,
    text7: `📨 **另外 2 个槽位等待中：**
`,
    text8: `🔍 正在智能匹配最佳对象...

`,
    text9: `内容预览：\${preview}

`,
    throw: `📊 今日已丢：\${quotaDisplay}

`,
    tips: `[需要从 zh-TW.ts 获取翻译]`,
    unlimited: `无限制`,
    vip: `💎 VIP 用户：30 个/天（三倍曝光）

`,
    vip2: `💎 **升级 VIP 可获得三倍曝光机会！ **
`,
    vip3: `⚙️ **进阶筛选（VIP 专属）**

`,
    vip4: `• VIP 用户：最多 +70 个

`,
    vip5: `✨ **VIP 特权启动！ **

`,
    vip6: `💡 升级 VIP 获得：
`,
    vip7: `✨ VIP 特权启动中
`,
    zodiac: `• 星座：\${selectedZodiac.length > 0 ? selectedZodiac.map((z) => ZODIAC_NAMES[z]).join(', ') : '无限制'}
`,
    zodiac2: `⭐ 星座：\${matchResult.user.zodiac ||`,
    zodiac3: `⭐ 星座：\${user.zodiac_sign ||`,
    zodiac4: `⭐ **星座筛选**

`,
    zodiac5: `• 星座：筛选特定星座
`,
    zodiac6: `• 星座高度相容 ✓`,
    zodiac7: `⭐ 星座筛选`,
    zodiacLabel: `• 星座：{zodiac}
`,
  },
  tutorial: {
    availableCommands: `你可以随时使用以下命令：`,
    catchBottle: `🎣 **捡起漂流瓶**`,
    catchBottleDesc: `看看别人的漂流瓶，有兴趣就回覆开始聊天`,
    clickButtonHint: `[需要翻译: tutorial.clickButtonHint]`,
    commandCatch: `• /catch - 捡起漂流瓶`,
    commandHelp: `• /help - 查看帮助`,
    commandMenu: `[需要翻译: tutorial.commandMenu]`,
    commandTasks: `• /tasks - 查看任务`,
    commandThrow: `• /throw - 丢出漂流瓶`,
    completeTasksForBottles: `💡 完成任务可获得额外瓶子`,
    completed: `✅ 教学已完成！`,
    howToBecomeFriends: `💬 **如何成为朋友？ **`,
    howToBecomeFriendsDesc: `你捡瓶回覆 → 对方也回覆 → 开始匿名聊天`,
    readyToStart: `🎉 **准备好了！开始交朋友吧～**`,
    skip: `跳过`,
    skipped: `✅ 已跳过教学`,
    startUsing: `开始使用 →`,
    throwBottle: `📦 **丢出漂流瓶**`,
    throwBottleDesc: `写下你的心情或想法，系统会帮你找到合适的人`,
    unknownStep: `❌ 未知的教学步骤`,
    viewTasks: `📋 查看任务`,
    welcome: `🎉 恭喜完成注册！`,
    whatIsXunNi: `🌊 **XunNi 是什么？ **`,
    whatIsXunNiDesc: `匿名漂流瓶交友平台，透过 MBT​​I 和星座帮你找到志同道合的朋友`,
  },
  vip: {
    admin: `⏳ 你已有待处理的退款请求，请耐心等待管理员审核。`,
    bottle: `📝 瓶子内容：\${bottle.content.substring(0, 50)}\${bottle.content.length > 50 ? '...' : ''}

`,
    bottle2: `📝 瓶子内容：\${bottle.content.substring(0, 50)}\${bottle.content.length > 50 ?`,
    bottle3: `你的瓶子已被 \${maskedMatcherNickname} 捡起！ 

`,
    bottle4: `系统为你找到了 \${maskedOwnerNickname} 的瓶子！ 

`,
    bottle5: `📝 瓶子内容：\${bottle.content}

`,
    bottle6: `• 🆕 三倍曝光机会！一次丢瓶子触发 3 个对象
`,
    cancelReminderButton: `❌ 稍后再说`,
    conversation: `💬 对话标识符：\${conversationIdentifier}
`,
    conversation2: `🔄 正在更新您的对话历史，清晰头像即将显示...

`,
    mbti: `• 可筛选配对对象的 MBTI、星座、血型
`,
    mbti2: `• 可筛选配对对象的 MBTI 和星座
`,
    mbti3: `• 可筛选 MBTI 和星座
`,
    message: `到期时间：\${new Date(sub.expire_date).toLocaleDateString('zh-TW')}

`,
    message10: `申请编号：#\${result.meta.last_row_id}
`,
    message11: `退款金额：\${request.amount_stars} ⭐
`,
    message12: `💬 **请长按此讯息，选择「回覆」后输入内容和对方开始聊天**`,
    message13: `💡 使用 Telegram Stars 安全便捷支付

`,
    message14: `💡 这是你的第 1 个配对，还有 2 个槽位等待中

`,
    message2: `申请时间：\${new Date(req.requested_at).toLocaleString('zh-TW')}
`,
    message3: `新到期时间：\${newExpire.toLocaleDateString('zh-TW')}

`,
    message4: `到期时间：\${newExpire.toLocaleDateString('zh-TW')}

`,
    message5: `支付时间：\${paymentDate.toLocaleDateString('zh-TW')}
`,
    message6: `📋 **待处理退款请求** (\${requests.results.length})

`,
    message7: `支付 ID：\${payment.telegram_payment_charge_id}`,
    message8: `价格：\${priceStars} ⭐ Telegram Stars / 月
`,
    message9: `支付时间：\${paymentDate.toLocaleDateString(`,
    purchaseCancelled: `✅ 已取消购买`,
    quota: `• 每天 30 个漂流瓶配额（邀请好友可增加，最高 100 个/天）
`,
    quota2: `• 每天 30 个漂流瓶配额（最高 100 个/天）
`,
    refundAdminCommands: `💡 使用以下命令处理：
• 批准：\`/admin_approve_refund \`
• 拒绝：\`/admin_reject_refund \` \`/admin_approve_refund <ID>\` \`/admin_reject_refund <ID> <原因>\``,
    refundApproved: `✅ **退款已批准**

退款金额：\${amount} ⭐
退款将在 1-3 个工作日内到帐。 

你的 VIP 会员已取消。 

感谢你的理解！`,
    refundApprovedAdmin: `✅ 退款已批准

请求 ID：#\${requestId}
用户 ID：\${userId}
金额：\${amount} ⭐`,
    refundExpired: `❌ 退款申请超过时限

支付时间：\${paymentDate}
退款时限：支付后 7 天内

💡 如有特殊情况，请联系客服。`,
    refundFailed: `❌ 退款失败：\${error}`,
    refundNoPayment: `❌ 找不到支付记录。`,
    refundNoPending: `✅ 没有待处理的退款请求。`,
    refundPending: `⏳ 你已有待处理的退款请求，请耐心等待管理员审核。`,
    refundPendingList: `📋 **待处理退款请求** (\${count})`,
    refundReasonTooShort: `❌ 退款原因至少需要 10 个字，请重新输入：`,
    refundRejected: `❌ **退款申请已被拒绝**

原因：\${reason}

如有疑问，请联系客服。`,
    refundRejectedAdmin: `✅ 退款已拒绝

请求 ID：#\${requestId}
用户 ID：\${userId}`,
    refundRequestItem: `**#\${id}** - \${nickname}
用户 ID：\`\${userId}\`
金额：\${amount} ⭐
原因：\${reason}
申请时间：\${requestedAt}`,
    refundRequestNotFound: `❌ 退款请求不存在或已处理`,
    refundRequestReason: `📝 **申请退款**

请输入退款原因（至少 10 个字）：`,
    refundSubmitFailed: `❌ 提交失败，请稍后再试。`,
    refundSubmitted: `✅ **退款申请已提交**

申请编号：#\${requestId}
状态：待审核

我们会在 1-3 个工作日内处理你的申请。 
处理结果会通过 Bot 通知你。 

感谢你的耐心等待！`,
    reminderCancelled: `✅ 已取消提醒`,
    reminderDaysLeft: `你的 VIP 会员将在 \${days} 天后到期。`,
    reminderExpireDate: `到期时间：\${date}`,
    reminderExpiringToday: `⚠️ **VIP 今天到期**`,
    reminderExpiringTodayDesc: `你的 VIP 会员今天到期。`,
    reminderGracePeriod: `📌 宽限期：到期后 3 天内续费不会中断服务。`,
    reminderRenewHint: `💡 立即续费，享受不间断的 VIP 服务！`,
    reminderRenewHint2: `💡 立即续费，继续享受 VIP 权益！`,
    reminderTitle: `⏰ **VIP 到期提醒**`,
    renewButton: `💳 立即续费 (\${stars} ⭐)`,
    renewalProcessing: `正在处理续费...`,
    settings: `💡 如需取消订阅，请前往 Telegram 设定 > 订阅管理

`,
    settings2: `💡 如需取消订阅，请前往 Telegram 设定 > 订阅管理`,
    settings3: `💡 可随时在 Telegram 设定中取消订阅`,
    short: `（约 5 USD）`,
    short2: `感谢你的耐心等待！`,
    short3: `感谢你的理解！`,
    short4: `• 批准：\\`,
    short5: `• 拒绝：\\`,
    start: `🚀 立即开始使用：/throw`,
    success: `🎯 **VIP 智能配对成功！ **

`,
    success2: `🎉 **自动续费成功！ **

`,
    success3: `🎉 **智能配对成功！ **

`,
    success4: `🎉 **订阅成功！ **

`,
    text: `- 优先使用 OpenAI GPT 模型翻译（高品质）
`,
    text10: `我们会在 1-3 个工作日内处理你的申请。 
`,
    text11: `到期时间：\${expireDate}

`,
    text12: `退款将在 1-3 个工作日内到帐。 

`,
    text13: `请求 ID：#\${requestId}
`,
    text14: `└ 1 个智能配对 + 2 个公共池
`,
    text15: `处理结果会通过 Bot 通知你。 

`,
    text16: `请输入退款原因（至少 10 个字）：`,
    text17: `原因：\${req.reason}
`,
    text18: `退款时限：支付后 7 天内

`,
    text19: `你的帐号已恢复为免费用户。 

`,
    text2: `• 34 种语言自动翻译（OpenAI GPT 优先）
`,
    text20: `💡 想要续订或升级吗？ 

`,
    text21: `💡 如有特殊情况，请联系客服。`,
    text22: `原因：\${reason}

`,
    text23: `• 解锁对方清晰头像 🆕
`,
    text24: `这可能需要几秒钟时间，请稍候。`,
    text25: `📝 **申请退款**

`,
    text26: `• 34 种语言自动翻译
`,
    text27: `💡 使用以下命令处理：
`,
    text28: `（Staging 测试价）`,
    text29: `如有疑问，请联系客服。`,
    text3: `金额：\${request.amount_stars} ⭐`,
    text30: `状态：待审核

`,
    text4: `🔄 **自动续费**：每月自动扣款，无需手动续费
`,
    text5: `金额：\${req.amount_stars} ⭐
`,
    text6: `用户 ID：\${request.user_id}
`,
    text7: `💳 立即续费 (\${priceStars} ⭐)`,
    text8: `用户 ID：\${request.user_id}`,
    text9: `📌 宽限期：到期后 3 天内续费不会中断服务。`,
    viewVipCommand: `你可以随时使用 /vip 命令查看 VIP 权益。`,
    vip: `你的 VIP 会员已于 \${new Date(sub.expire_date).toLocaleDateString('zh-TW')} 到期。 

`,
    vip10: `💎 **升级 VIP 会员**

`,
    vip11: `😢 **VIP 会员已到期**

`,
    vip12: `升级 VIP 会员，享受以下权益：
`,
    vip13: `⏰ **VIP 到期提醒**

`,
    vip14: `你的 VIP 会员今天到期。 

`,
    vip15: `你的 VIP 订阅已自动续费！ 
`,
    vip16: `你的 VIP 会员已取消。 

`,
    vip17: `XunNi VIP 订阅（月费）`,
    vip18: `✨ VIP 权益持续启用：
`,
    vip19: `你已成为 VIP 会员！ 
`,
    vip2: `你的 VIP 会员已于 \${new Date(sub.expire_date).toLocaleDateString(`,
    vip20: `✨ VIP 权益已启用：
`,
    vip21: `VIP 会员 (30 天)`,
    vip22: `🎁 VIP 权益：
`,
    vip23: `XunNi VIP 续订`,
    vip24: `XunNi VIP 购买`,
    vip25: `VIP 订阅`,
    vip3: `你的 VIP 会员将在 \${daysLeft} 天后到期。 

`,
    vip4: `🔄 续订 VIP (\${priceStars} ⭐)`,
    vip5: `💳 购买 VIP (\${priceStars} ⭐)`,
    vip6: `订阅 XunNi VIP 会员，每月自动续费！ 

`,
    vip7: `💡 立即续费，享受不间断的 VIP 服务！`,
    vip8: `💡 立即续费，继续享受 VIP 权益！ 
`,
    vip9: `✨ **你已经是 VIP 会员**

`,
  },
  vipTripleBottle: {
    bottleContent: `📝 瓶子内容：{content}

`,
    bottlePicked: `你的瓶子已被 {maskedMatcherNickname} 捡起！ 

`,
    conversationIdentifier: `💬 对话标识符：{conversationIdentifier}
`,
    firstMatch: `💡 这是你的第 1 个配对，还有 2 个槽位等待中

`,
    foundBottle: `系统为你找到了 {maskedOwnerNickname} 的瓶子！ 

`,
    matchSuccess: `🎯 **VIP 智能配对成功！ **

`,
    replyHint: `💬 **请长按此讯息，选择「回覆」后输入内容和对方开始聊天**`,
    slotsWaiting: `还有 {remaining} 个槽位等待中

`,
    smartMatch: `🎉 **智能配对成功！ **

`,
    viewChats: `使用 /chats 查看所有对话

`,
  },
  warning: {
    ad: `⚠️ 目前没有配置任何广告提供商

`,
    ad2: `⚠️ 目前没有官方广告

`,
    ad3: `⚠️ 暂无可用的广告提供商`,
    ad4: `⚠️ 无法选择广告提供商`,
    ad5: `⚠️ 无法观看更多广告`,
    birthday: `⚠️ 当前不在生日输入步骤`,
    bloodType: `⚠️ 当前不在血型选择步骤`,
    broadcast: `⚠️ 发现 \${stuckBroadcasts.results.length} 个卡住的广播

`,
    complete: `⚠️ 请先完成上一支广告，再开始新的广告`,
    confirm: `⚠️ 请确认你的生日资讯：

`,
    conversation: `⚠️ 对话资讯错误。`,
    conversation10: `⚠️ 对话不存在`,
    conversation2: `⚠️ 对话资讯错误`,
    conversation3: `⚠️ 此用户没有对话历史帖子
`,
    conversation4: `⚠️ 找不到指定的对话，可能已结束或过期。`,
    conversation5: `⚠️ **对话历史部分更新**

`,
    conversation6: `⚠️ 无法识别对话对象

`,
    conversation7: `⚠️ 找不到此对话

`,
    conversation8: `⚠️ 对话不存在或已结束`,
    conversation9: `⚠️ 此对话已结束`,
    end: `⚠️ 测验已结束或不存在`,
    failed: `⚠️ 支付验证失败，请稍后再试`,
    gender: `⚠️ 当前不在性别选择步骤`,
    invite: `⚠️ 无法获取邀请码`,
    mbti: `⚠️ 当前不在 MBTI 测验步骤`,
    mbti2: `⚠️ 无效的 MBTI 类型`,
    message: `⚠️ 发现 \${outdatedPosts.length} 个过时帖子需要刷新
`,
    message2: `⚠️ 注意：这是 \${testInfo}\${testTitle}，\${accuracy}。 

`,
    message3: `⚠️ 请长按你要封锁的讯息后回覆指令

`,
    message4: `⚠️ 请长按你要举报的讯息后回覆指令

`,
    message5: `⚠️ **讯息包含不允许的连结**

`,
    register: `⚠️ 找不到用户资料，请先使用 /start 注册。`,
    register2: `⚠️ 请先完成注册流程。 

使用 /start 继续注册。`,
    register3: `⚠️ 注册流程出现问题，请重新开始：/start`,
    register4: `⚠️ 请先完成注册流程`,
    settings: `⚠️ 再次提醒：性别设定后将**永远不能修改**！ 

`,
    settings2: `⚠️ 生日设定后无法修改，请确认无误！`,
    settings3: `⚠️ 注意：性别设定后无法修改，请谨慎选择！`,
    short: `⚠️ 问题顺序错误`,
    short2: `⚠️ 未知的选项`,
    short3: `⚠️ 无效的请求`,
    short4: `⚠️ 注意：
`,
    short5: `⚠️ 其他违规`,
    start: `⚠️ 会话已过期，请重新开始：/throw`,
    start2: `⚠️ 会话已过期，请重新开始`,
    task: `⚠️ 未知的任务类型`,
    text: `⚠️ **注意**

`,
    text10: `⚠️ **不可修改项目**：
`,
    text11: `⚠️ 会话已过期，请重新操作`,
    text12: `⚠️ 草稿不存在或已过期`,
    text2: `⚠️ 无效的支付类型`,
    text3: `⚠️ 翻译服务暂时无法使用，以下为原文
`,
    text4: `⚠️ 安全提示：
`,
    text5: `⚠️ 当前不在反诈骗测验步骤`,
    text6: `⚠️ 当前不在服务条款步骤`,
    text7: `⚠️ 注意：此功能仅在 Staging 环境可用。`,
    text8: `⚠️ **不允许发送图片、影片或多媒体**

`,
    text9: `⚠️ 此功能仅在 Staging 环境可用。`,
    userNotFound: `⚠️ 用户不存在，请先使用 /start 注册。`,
    userNotFound2: `⚠️ 用户不存在`,
    vip: `⚠️ 已达免费用户邀请上限，升级 VIP 可解锁 100 人上限！`,
    vip2: `⚠️ 此功能仅限 VIP 会员使用`,
    vip3: `⚠️ **VIP 今天到期**`,
    pageInfo: `📄 Page {page}/{totalPages}`,
    end2: `[需要翻译]`,
    female: `[需要翻译]`,
    free: `[需要翻译]`,
    rewardPermanent: `[需要翻译]`,
    communityThanks: `[需要翻译]`,
    languageUpdated: `[需要翻译]`,
  },
  warnings: {
    birthday: `[需要翻译: warnings.birthday]`,
    bloodType: `🩸 血型`,
    gender: `👤 性别：{otherUser.gender}`,
    mbti: `🧠 MBTI：\\\\\\\\\\\${mbti}`,
    register2: `[需要翻译: warnings.register2]`,
    register4: `[需要翻译: warnings.register4]`,
    settings: `🧠 MBTI：\\\\\\\\\\\${bottle.mbti_result}`,
    text5: `📖 简介：{otherUser.bio}`,
    text6: `[需要翻译: warnings.text6]`,
    userNotFound: `用户不存在`,
    'warning.ad': `⚠️ 目前没有配置任何广告提供商

`,
    'warning.ad2': `⚠️ 目前没有官方广告

`,
    'warning.ad3': `⚠️ 暂无可用的广告提供商`,
    'warning.ad4': `⚠️ 无法选择广告提供商`,
    'warning.ad5': `⚠️ 无法观看更多广告`,
    'warning.birthday': `⚠️ 当前不在生日输入步骤`,
    'warning.bloodType': `⚠️ 当前不在血型选择步骤`,
    'warning.broadcast': `⚠️ 发现 \\\${stuckBroadcasts.results.length} 个卡住的广播

`,
    'warning.complete': `⚠️ 请先完成上一支广告，再开始新的广告`,
    'warning.confirm': `⚠️ 请确认你的生日资讯：

`,
    'warning.conversation': `⚠️ 对话资讯错误。`,
    'warning.conversation10': `⚠️ 对话不存在`,
    'warning.conversation2': `⚠️ 对话资讯错误`,
    'warning.conversation3': `⚠️ 此用户没有对话历史帖子
`,
    'warning.conversation4': `⚠️ 找不到指定的对话，可能已结束或过期。`,
    'warning.conversation5': `⚠️ **对话历史部分更新**

`,
    'warning.conversation6': `⚠️ 无法识别对话对象

`,
    'warning.conversation7': `⚠️ 找不到此对话

`,
    'warning.conversation8': `⚠️ 对话不存在或已结束`,
    'warning.conversation9': `⚠️ 此对话已结束`,
    'warning.end': `⚠️ 测验已结束或不存在`,
    'warning.failed': `⚠️ 支付验证失败，请稍后再试`,
    'warning.gender': `⚠️ 当前不在性别选择步骤`,
    'warning.invite': `⚠️ 无法获取邀请码`,
    'warning.mbti': `⚠️ 当前不在 MBTI 测验步骤`,
    'warning.mbti2': `⚠️ 无效的 MBTI 类型`,
    'warning.message': `⚠️ 发现 \\\${outdatedPosts.length} 个过时帖子需要刷新
`,
    'warning.message2': `⚠️ 注意：这是 \\\${testInfo}\\\${testTitle}，\\\${accuracy}。 

`,
    'warning.message3': `⚠️ 请长按你要封锁的讯息后回覆指令

`,
    'warning.message4': `⚠️ 请长按你要举报的讯息后回覆指令

`,
    'warning.message5': `⚠️ **讯息包含不允许的连结**

`,
    'warning.register': `⚠️ 找不到用户资料，请先使用 /start 注册。`,
    'warning.register2': `⚠️ 请先完成注册流程。 

使用 /start 继续注册。`,
    'warning.register3': `⚠️ 注册流程出现问题，请重新开始：/start`,
    'warning.register4': `⚠️ 请先完成注册流程`,
    'warning.settings': `⚠️ 再次提醒：性别设定后将**永远不能修改**！ 

`,
    'warning.settings2': `⚠️ 生日设定后无法修改，请确认无误！`,
    'warning.settings3': `⚠️ 注意：性别设定后无法修改，请谨慎选择！`,
    'warning.short': `⚠️ 问题顺序错误`,
    'warning.short2': `⚠️ 未知的选项`,
    'warning.short3': `⚠️ 无效的请求`,
    'warning.short4': `⚠️ 注意：
`,
    'warning.short5': `⚠️ 其他违规`,
    'warning.start': `⚠️ 会话已过期，请重新开始：/throw`,
    'warning.start2': `⚠️ 会话已过期，请重新开始`,
    'warning.task': `⚠️ 未知的任务类型`,
    'warning.text': `⚠️ **注意**

`,
    'warning.text10': `⚠️ **不可修改项目**：
`,
    'warning.text11': `⚠️ 会话已过期，请重新操作`,
    'warning.text12': `⚠️ 草稿不存在或已过期`,
    'warning.text2': `⚠️ 无效的支付类型`,
    'warning.text3': `⚠️ 翻译服务暂时无法使用，以下为原文
`,
    'warning.text4': `⚠️ 安全提示：
`,
    'warning.text5': `⚠️ 当前不在反诈骗测验步骤`,
    'warning.text6': `⚠️ 当前不在服务条款步骤`,
    'warning.text7': `⚠️ 注意：此功能仅在 Staging 环境可用。`,
    'warning.text8': `⚠️ **不允许发送图片、影片或多媒体**

`,
    'warning.text9': `⚠️ 此功能仅在 Staging 环境可用。`,
    'warning.userNotFound': `⚠️ 用户不存在，请先使用 /start 注册。`,
    'warning.userNotFound2': `⚠️ 用户不存在`,
    'warning.vip': `⚠️ 已达免费用户邀请上限，升级 VIP 可解锁 100 人上限！`,
    'warning.vip2': `⚠️ 此功能仅限 VIP 会员使用`,
    'warning.vip3': `⚠️ **VIP 今天到期**

`,
  },
};
