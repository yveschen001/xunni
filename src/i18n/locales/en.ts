import type { Translations } from '../types';

/**
 * en translations
 * Auto-generated from i18n_for_translation.csv
 */
export const translations: Translations = {
  ad: {
    ad: `💡 Continue watching ads to earn more credits! (Fixed)`,
    failed: `❌ 廣告載入失敗，請稍後再試`,
  },
  adPrompt: {
    completeTask: `• ✨ Complete tasks (earn permanent quota)`,
    inviteFriends: `• 🎁 Invite friends (+1 quota per person)`,
    quotaExhausted: `❌ Today's message bottle quota has been used up (\${quotaDisplay})`,
    taskButton: `✨ \${taskName} 🎁`,
    upgradeVip: `• 💎 Upgrade to VIP (30 quotas daily)`,
    watchAd: `• 📺 Watch ads (remaining \${remaining}/20 times)`,
    watchAdLimit: `• 📺 Watch ads (today's limit reached)`,
    waysToGetMore: `💡 Ways to earn more quotas:`,
  },
  adProvider: {
    health: {
      good: `Good`,
      needsAttention: `Needs attention`,
    },
  },
  adReward: {
    adCompleted: `Ad completed! Gained +\${quota} quota`,
    cannotSelectProvider: `⚠️ Cannot select ad provider`,
    cannotWatchMore: `⚠️ Cannot watch more ads`,
    clickButtonHint: `✅ Please click the button to start watching`,
    completedEarned: `🎁 Earned today: **\${earned}** credits`,
    completedRemaining: `📈 Remaining attempts: **\${remaining}** times`,
    completedReward: `✅ Earn **+1 credit**`,
    completedTitle: `🎉 **Ad viewing completed!**`,
    completedWatched: `📊 Viewed today: **\${watched}/20** times`,
    continueWatching: `💡 Continue watching ads to earn more credits!`,
    dailyLimitReached: `Today's ad limit reached (\${max}/\${max})`,
    getStatusFailed: `❌ Failed to fetch ad status`,
    noProviders: `⚠️ No available ad providers at the moment`,
    pendingAd: `⚠️ Please complete the previous ad before starting a new one`,
    startWatchButton: `📺 Start watching ads`,
    vipNoAds: `💎 VIP users do not need to watch ads`,
    vipNoAdsReason: `VIP users have unlimited quota and do not need to watch ads`,
    watchAdClickButton: `👇 Click the button below to start watching`,
    watchAdRemaining: `📊 Today remaining: **\${remaining}/20** times`,
    watchAdReward: `🎁 Earn **+1 credit** upon completion of viewing`,
    watchAdTitle: `📺 **Watch ads to earn credits**`,
  },
  admin: {
    ad: `Use /official_ads to view all ads`,
    ad2: `Please use the database script to add ad providers:
`,
    ad3: `📺 **Ad Provider List**

`,
    ad4: `Please use the database script to add official ads:
`,
    ad5: `📢 **Official Ad List**

`,
    addAlreadyAdmin: `❌ This user is already an administrator.`,
    addAlreadySuperAdmin: `❌ This user is already a super administrator, no need to add.`,
    addCommand: `\`/admin_add <user_id>\`

`,
    addExample: `\`/admin_add 123456789\` - Add as a regular administrator

`,
    addInstructions: `⚠️ **Note**

This command requires manual modification of the configuration file.

**Steps:**
1. Edit \`wrangler.toml\`
2. Find the \`ADMIN_USER_IDS\` variable
3. Add user ID: \`{userId}\`
4. Format: \`ADMIN_USER_IDS = "ID1,ID2,{userId}"\`
5. Redeploy: \`pnpm deploy:staging\`

**User Information:**
• ID: \`{userId}\`
• Nickname: {nickname}
• Username: @{username}

💡 Or modify the environment variables in the Cloudflare Dashboard`,
    addUsageError: `❌ Incorrect usage

`,
    addUserNotFound: `❌ User does not exist or is not registered.`,
    admin: `💡 Use /admin_list to view the current admin list`,
    admin2: `Admin ban`,
    admin3: `- Add as a regular admin

`,
    admin4: `- Remove regular admin

`,
    admin5: `\`/admin_add 123456789\` - Add as normal administrator

`,
    admin6: `\`/admin_remove 123456789\` - Remove normal administrator

`,
    appeal: `Appeal ID: \${appeal.id}
`,
    appeal2: `💡 Use the following command to review the appeal:
`,
    appeal3: `📋 Pending appeal list

`,
    appeal4: `Appeal approved`,
    appeal5: `Appeal denied`,
    appealAlreadyReviewed: `❌ Appeal {id} has already been reviewed`,
    appealApproveUsageError: `❌ Please provide the appeal ID

Usage: /admin_approve <appeal_id> [note]`,
    appealApproved: `✅ Appeal {id} has been approved, user has been unbanned`,
    appealApprovedDefault: `Appeal approved`,
    appealDivider: `━━━━━━━━━━━━━━━━
`,
    appealId: `Appeal ID: {id}
`,
    appealNotFound: `❌ Appeal ID not found: {id}`,
    appealReason: `Reason: {reason}
`,
    appealRejectUsageError: `❌ Please provide the appeal ID

Usage: /admin_reject <appeal_id> [remarks]`,
    appealRejected: `✅ Appeal {id} has been denied`,
    appealRejectedDefault: `Appeal denied`,
    appealReviewCommands: `/admin_approve <appeal_id> [note]
/admin_reject <appeal_id> [note]`,
    appealReviewHint: `💡 Use the following commands to review appeals: 
`,
    appealSubmittedAt: `Submission Time: {time}

`,
    appealUser: `User: {user}
`,
    appealsTitle: `📋 Pending Appeals List

`,
    ban: `💡 Use /admin_bans <user_id> to view ban history for a specific user`,
    ban2: `Total bans: \${userBans.results.length}

`,
    ban3: `📊 Recent 10 Ban Records

`,
    ban4: `📊 User Ban History

`,
    ban5: `📊 No ban records currently`,
    banSuccess: `✅ 已封禁用戶 {userId} ({nickname})

封禁時長：{duration}
解封時間：{unbanTime}`,
    banSuccessPermanent: `✅ 已永久封禁用戶 {userId} ({nickname})`,
    banUsageError: `Usage error`,
    banUserNotFound: `User does not exist`,
    cannotBanAdmin: `Unable to ban admin`,
    conversation: `💡 Conversation history posts are created only when there are new messages
`,
    conversation2: `All VIP users have the latest conversation history!`,
    conversation3: `
💬 **Conversation History Posts:**
`,
    conversation4: `Please check if the conversation history has been updated to clear avatars.`,
    conversation5: `🔄 Starting to refresh your conversation history...`,
    conversation6: `• No conversation history posts
`,
    end: `End: \${banEnd}

`,
    error: `Error`,
    failed: `• Failed posts: \${results.totalPostsFailed}

`,
    failed2: `• Failed: \${results.failedUsers}
`,
    failed3: `• Failed: \${result.failed} post(s)

`,
    insufficientPermission: `❌ **Insufficient Permissions**

This command is for super admin use only.`,
    listFooter: `---`,
    listId: `ID：{id}`,
    listNickname: `暱稱：{nickname}`,
    listNotRegistered: `Not registered`,
    listRoleAdmin: `Administrator`,
    listRoleSuperAdmin: `Super Administrator`,
    listTitle: `Administrator List`,
    listTotal: `總數：{total}`,
    listUsername: `用戶名：{username}`,
    message: `• Updated at: \${new Date(post.updated_at).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}

`,
    message10: `• Has Avatar: \${post.partner_avatar_url ? '✅' : '❌'}
`,
    message11: `...and \${historyPosts.results.length - 5} more posts
`,
    message12: `User: \${targetUser?.nickname || targetUserId}
`,
    message13: `• Username: @\${targetUser?.username}

`,
    message14: `User: \${appeal.nickname || appeal.user_id}
`,
    message15: `
...and \${results.details.length - 10} more users`,
    message16: `• Username: @\${targetUser.username}

`,
    message17: `• Total: \${historyPosts.results.length}

`,
    message18: `💡 Use /admin_refresh_vip_avatars to refresh in bulk
`,
    message19: `• Latest: \${post.is_latest ? '✅' : '❌'}
`,
    message2: `• Updated at: \${avatarInfo.avatar_updated_at ? new Date(avatarInfo.avatar_updated_at).toLocaleString('zh-TW') : 'Unknown'}
`,
    message20: `• Outdated Posts: \${stats.totalOutdatedPosts}

`,
    message21: `/ad_provider_priority`,
    message22: `• Needs Refresh: \${stats.usersNeedingRefresh}
`,
    message23: `• Updated Posts: \${results.totalPostsUpdated}
`,
    message24: `User: \${ban.nickname || ban.user_id}
`,
    message25: `/ad_provider_disable <provider_id>`,
    message26: `💡 Or modify the environment variables in the Cloudflare Dashboard`,
    message27: `/ad_provider_enable <provider_id>`,
    message28: `• Username: @\${targetUser?.username ||`,
    message29: `/admin_approve <appeal_id> [Notes]
`,
    message3: `• \${username}: \${detail.postsUpdated} updated, \${detail.postsFailed} failed
`,
    message30: `• Impressions: \${ad.impression_count} times
`,
    message31: `• Username: @\${targetUser.username ||`,
    message32: `• Username: @\${user.username}
 {user.username || '無'} \${user.username}`,
    message33: `/admin_reject <appeal_id> [Notes]`,
    message34: `• Users processed: \${results.totalUsers}
`,
    message35: `• \`/ad_provider_enable \` - Enable
 \`/ad_provider_enable <id>\``,
    message36: `• \`/ad_provider_disable \` - Disable
 \`/ad_provider_disable <id>\``,
    message37: `• \`/ad_provider_priority \` - Set priority \`/ad_provider_priority <id> <priority>\``,
    message38: `• \`/official_ad_enable \` - Enable
 \`/official_ad_enable <id>\``,
    message39: `• \`/official_ad_disable \` - Disable
 \`/official_ad_disable <id>\``,
    message4: `New expiration: \${new Date(data.expire_date).toLocaleDateString('en-US')}
 {new Date(data.expire_date).toLocaleDateString('zh-TW')} \${new Date(data.expire_date).toLocaleDateString('zh-TW')}`,
    message40: `• Update time: \${new Date(post.updated_at).toLocaleString('en-US', { month: '2-digit', day: '2-digit', hour:`,
    message5: `Expiration: \${new Date(data.expire_date).toLocaleDateString('en-US')}
 {new Date(data.expire_date).toLocaleDateString('zh-TW')} \${new Date(data.expire_date).toLocaleDateString('zh-TW')}`,
    message6: `Error: \${error instanceof Error ? error.message : String(error)}`,
    message7: `• Original URL: \${avatarInfo.avatar_original_url ? '✅' : '❌'}
`,
    message8: `• Blurred URL: \${avatarInfo.avatar_blurred_url ? '✅' : '❌'}
`,
    message9: `📝 **Post #\${post.identifier}-H\${post.post_number}**
`,
    nickname: `• Nickname: \${targetUser?.nickname ||`,
    nickname2: `• Nickname: \${targetUser.nickname ||`,
    noPendingAppeals: `✅ Currently, there are no pending appeals`,
    noPermission: `❌ You do not have permission to use this command.`,
    onlyAdmin: `❌ Only admins can use this command.`,
    onlySuperAdmin: `❌ Only super admins can use this command.`,
    operationFailed: `❌ An error occurred, please try again later.`,
    removeCannotRemoveSuperAdmin: `❌ Unable to remove super administrator.`,
    removeCommand: `\`/admin_remove <user_id>\`

`,
    removeExample: `\`/admin_remove 123456789\` - Remove regular administrator

`,
    removeInstructions: `⚠️ **Note**

This command requires manual modification of the configuration file.

**Steps:**
1. Edit \`wrangler.toml\`
2. Find the \`ADMIN_USER_IDS\` variable
3. Remove user ID: \`{userId}\`
4. Format: \`ADMIN_USER_IDS = "ID1,ID2"\` (remove {userId})
5. Redeploy: \`pnpm deploy:staging\`

**User Information:**
• ID: \`{userId}\`
• Nickname: {nickname}
• Username: @{username}

💡 Or modify the environment variables in the Cloudflare Dashboard`,
    removeNotAdmin: `❌ This user is not an administrator.`,
    removeUsageError: `❌ Incorrect usage

`,
    settings: `• Nickname: \${targetUser?.nickname}
 {targetUser?.nickname || '未設定'} \${targetUser?.nickname}`,
    settings2: `• Nickname: \${targetUser.nickname}
 {targetUser.nickname || '未設定'} \${targetUser.nickname}`,
    settings3: `• Nickname: \${user.nickname}
 {user.nickname || '未設定'} \${user.nickname}`,
    settings4: `Not Set`,
    settings5: `Not Set`,
    settings6: `Not Set`,
    short: `**Example:**
`,
    short10: `Payment ID: \\`,
    short11: `Variable
`,
    short12: `User: \\`,
    short2: `**Example:**
`,
    short3: `**Steps:**
`,
    short4: `5. Redeploy: \\`,
    short5: `4. Redeploy: \\`,
    short6: `1. Edit \\`,
    short7: `2. Find \\`,
    short8: `4. Format: \\`,
    short9: `• No Cache
`,
    start: `Start: \${banStart}
`,
    stats: `📊 **Statistics:**
`,
    stats2: `• \`/ad_stats \` - View detailed statistics \`/ad_stats <id>\``,
    success: `• Success: \${results.successUsers}
`,
    text: `• Priority: \${provider.priority}
`,
    text10: `Amount: \${data.amount_stars} ⭐
`,
    text11: `Request ID: #\${data.request_id}
`,
    text12: `• Weight: \${provider.weight}
`,
    text13: `Reason: \${data.error_message}
`,
    text14: `/ad_provider_disable`,
    text15: `/official_ad_disable`,
    text16: `💡 Use /admin_refunds for details`,
    text17: `/ad_provider_enable`,
    text18: `Use /ad_providers to view all providers`,
    text19: `/official_ad_enable`,
    text2: `• Reward: \${ad.quota_reward} quota
`,
    text20: `Remaining: \${data.days_left} days
`,
    text21: `/admin_remove 123456789`,
    text22: `Reason: \${appeal.reason}
`,
    text23: `Submission time: \${createdAt}

`,
    text24: `Provider: \${providerName}
`,
    text25: `• Type: \${ad.ad_type}
`,
    text26: `/admin_add 123456789`,
    text27: `An error occurred during processing, please check the logs.

`,
    text28: `Priority: \${priority}

`,
    text29: `Reason: \${ban.reason}
`,
    text3: `/official_ad_disable <ad_id>`,
    text30: `Reason: \${data.reason}
`,
    text31: `Time: \${timestamp}

`,
    text32: `This command requires manual configuration file modification.

`,
    text33: `• Status: \${status}
`,
    text34: `🔍 **Avatar Diagnosis Report**

`,
    text35: `
📸 **Avatar Cache:**
`,
    text36: `Time: \${timestamp}`,
    text37: `🔴 **Refund Request**

`,
    text38: `📢 **System Notification**

`,
    text39: `/ad_stats`,
    text4: `Risk Score: \${ban.risk_snapshot}
`,
    text40: `👤 **User Information:**
`,
    text41: `
🔎 **Analysis:**
`,
    text42: `📝 **Detailed Result:**
`,
    text43: `⏳ Processing, please wait...`,
    text44: `3. Add User ID: \\`,
    text45: `3. Remove User ID: \\`,
    text46: `📊 **Summary:**
`,
    text47: `Type: \${type}
`,
    text48: `• 🧪 Test Mode
`,
    text49: `**Management Commands:**
`,
    text5: `⏱️ **Duration:** \${duration} seconds

`,
    text50: `**Correct Format:**
`,
    text51: `\${hours} hours`,
    text52: `**User Information:**
`,
    text6: `• Updates: \${result.updated} posts
`,
    text7: `Data: \${JSON.stringify(data)}
`,
    text8: `• Clicks: \${ad.click_count} times
`,
    text9: `/official_ad_enable <ad_id>`,
    unbanNotBanned: `User is not banned`,
    unbanSuccess: `✅ 已解封用戶 {userId}`,
    unbanUsageError: `Unban usage method is incorrect`,
    unbanUserNotFound: `User to unban does not exist`,
    userNotFound: `❌ User does not exist.`,
    vip: `• VIP Expiration: \${new Date(user.vip_expire_at).toLocaleString('en-US')}
 {new Date(user.vip_expire_at).toLocaleString('zh-TW')} \${new Date(user.vip_expire_at).toLocaleString('zh-TW')}`,
    vip2: `• Created with VIP: \${post.created_with_vip_status ? '✅' : '❌'}
`,
    vip3: `• VIP Status: \${isVip ? '✅ Yes' : '❌ No'}
 {isVip ? '✅ 是' : '❌ 否'} \${isVip ? '✅ 是' : '❌ 否'}`,
    vip4: `• Total VIP Users: \${stats.totalVipUsers}
`,
    vip5: `🔄 **Start Bulk Refresh of VIP Avatars**

`,
    vip6: `⏰ **VIP Expiry Reminder Sent**

`,
    vip7: `🎉 **New VIP Purchase**

`,
    vip8: `⬇️ **VIP Automatic Downgrade**

`,
    vip9: `🔄 **VIP Renewal**

`,
    adConfig: {
      adIdMustBeNumber: `❌ Ad ID must be a number`,
      addOfficialAdScript: `Please use the database script to add official ads:`,
      addProviderScript: `Please use the database script to add ad providers:`,
      clicks: `• Clicks: \${count} times`,
      correctFormat: `**Correct format:**`,
      disableCommand: `• \`/ad_provider_disable \` - Disable \`/ad_provider_disable <id>\``,
      disableFailed: `❌ Failed to disable ad provider`,
      disableOfficialAdCommand: `• \`/official_ad_disable \` - Disable \`/official_ad_disable <id>\``,
      disableOfficialAdFailed: `❌ Failed to disable official ad`,
      disabled: `❌ Disabled`,
      enableCommand: `• \`/ad_provider_enable \` - Enable \`/ad_provider_enable <id>\``,
      enableFailed: `❌ Failed to enable ad provider`,
      enableOfficialAdCommand: `• \`/official_ad_enable \` - Enable \`/official_ad_enable <id>\``,
      enableOfficialAdFailed: `❌ Failed to enable official ad`,
      enabled: `✅ Enabled`,
      example: `**Example:**`,
      getListFailed: `❌ Failed to retrieve the ad provider list`,
      getOfficialAdListFailed: `❌ Failed to retrieve the official ad list`,
      id: `• ID: \${id}`,
      impressions: `• Impressions: \${count} times`,
      managementCommands: `**Admin Command:**`,
      noOfficialAds: `⚠️ Currently no official ads available`,
      noProviders: `⚠️ No ad providers configured at the moment`,
      officialAdDisabled: `✅ Official advertisement disabled #\${id}`,
      officialAdEnabled: `✅ Official advertisement enabled #\${id}`,
      officialAdList: `📢 **Official Ad List**`,
      priority: `• Priority: \${priority}`,
      priorityCommand: `• \`/ad_provider_priority \` - Set priority \`/ad_provider_priority <id> <priority>\``,
      priorityMustBeNonNegative: `❌ Priority must be a non-negative integer`,
      prioritySet: `✅ Ad provider priority set`,
      priorityValue: `Priority: \${priority}`,
      provider: `Provider: \${name}`,
      providerDisabled: `✅ Advertising provider disabled: \${name}`,
      providerEnabled: `✅ Ad provider enabled: \${name}`,
      providerList: `📺 **Ad Provider List**`,
      reward: `• Reward: \${reward} amount`,
      setPriorityFailed: `❌ Failed to set priority`,
      status: `• Status: \${status}`,
      testMode: `• 🧪 Test Mode`,
      type: `• Type: \${type}`,
      usageError: `❌ Incorrect usage`,
      viewAllOfficialAds: `Use /official_ads to view all ads`,
      viewAllProviders: `Use /ad_providers to view all providers`,
      viewStatsCommand: `• \`/ad_stats \` - View detailed statistics \`/ad_stats <id>\``,
      weight: `• Weight: \${weight}`,
    },
    analytics: {
      getAdDataFailed: `❌ Failed to retrieve ad data`,
      getDataFailed: `❌ Failed to retrieve analytics data`,
      getVipDataFailed: `❌ Failed to retrieve VIP funnel data`,
      noPermission: `❌ You do not have permission to view analytics data`,
      noPermissionAd: `❌ You do not have permission to view ad data`,
      noPermissionVip: `❌ You do not have permission to view VIP data`,
      onlySuperAdmin: `❌ Only super administrators can use this command.`,
      sendReportFailed: `❌ Failed to send daily report: \${error}`,
      userNotFound: `❌ User does not exist: \${userId}`,
    },
    ban: {
      appealAlreadyReviewed: `❌ Appeal {id} has already been reviewed`,
      appealApproved: `Appeal Approved`,
      appealApprovedUnbanned: `✅ Appeal {id} has been approved, user has been unbanned`,
      appealId: `Appeal ID: {id}
`,
      appealList: `📋 Pending Appeal List

`,
      appealNotFound: `❌ Appeal ID not found: {id}`,
      appealReason: `Reason: {reason}
`,
      appealRejected: `Appeal Rejected`,
      appealRejectedMessage: `✅ Appeal {id} has been denied`,
      appealSubmittedAt: `Submission time: {time}

`,
      appealUser: `User: {user}
`,
      banEnd: `End: \${end}`,
      banId: `ID: \${id}`,
      banReason: `Reason: \${reason}`,
      banStart: `Start: \${start}`,
      banUser: `User: \${user}`,
      durationDays: `{days} days`,
      durationHours: `{hours} hours`,
      durationMustBePositive: `❌ Duration must be a positive integer or "permanent".`,
      noAppeals: `✅ No pending appeals at the moment`,
      noBanRecords: `❌ User \${userId} has no ban records`,
      noBanRecordsList: `📊 Currently no ban records`,
      noPermission: `❌ You do not have permission to use this command.`,
      notAdmin: `❌ This user is not an administrator.`,
      permanent: `Permanent`,
      provideAppealId: `❌ Please provide the appeal ID

`,
      reason: `Admin ban`,
      recentBans: `📊 Recent 10 ban records`,
      riskScore: `Risk score: \${score}`,
      temporaryBan: `🚫 You have been temporarily banned

Ban duration: {duration}
Unban time: {unbanTime}

Ban reason: Multiple reports

If you have questions, please use /appeal to submit an appeal.`,
      totalBans: `Total bans: \${count}`,
      usageApprove: `Usage: /admin_approve <appeal_id> [remarks]`,
      usageReject: `Usage: /admin_reject <appeal_id> [remarks]`,
      user: `User: \${user}`,
      userBanHistory: `📊 User Ban History`,
      viewHistory: `💡 Use /admin_bans <user_id> to view the ban history of a specific user`,
    },
    diagnose: {
      allUpToDateFree: `✅ All posts are up to date (free user status correct)`,
      allUpToDateVip: `✅ All posts are up to date (VIP status correct)`,
      analysis: `🔎 **Analysis:**`,
      avatarCache: `📸 **Avatar Cache:**`,
      blurredUrl: `• Fuzzy URL: \${status}`,
      createdWithVip: `• VIP at Creation: \${status}`,
      error: `Error: \${error}`,
      failed: `❌ **Diagnosis Failed**`,
      fileId: `• File ID: \${fileId}...`,
      hasAvatar: `• Has Avatar: \${status}`,
      historyPosts: `💬 **Conversation History Posts:**`,
      historyPostsHint: `💡 Conversation history posts are created only when there are new messages`,
      isLatest: `• Latest: \${status}`,
      morePosts: `...there are \${count} posts`,
      nickname: `• Nickname: \${nickname}`,
      no: `❌ No`,
      noCache: `• No cache`,
      noHistoryPosts: `• No conversation history posts`,
      noHistoryPostsWarning: `⚠️ This user has no conversation history posts`,
      none: `None`,
      originalUrl: `• Original URL: \${status}`,
      outdatedPostsFound: `⚠️ Found \${count} outdated posts that need refreshing`,
      postId: `• ID: \${id}`,
      postTitle: `📝 **Post #\${identifier}-H\${postNumber}**`,
      postUpdatedAt: `• Update Time: \${date}`,
      refreshHint: `💡 Use /admin_refresh_vip_avatars to batch refresh`,
      title: `🔍 **Avatar Diagnostic Report**`,
      totalPosts: `• Total: \${count}`,
      unknown: `Unknown`,
      updatedAt: `• Update Time: \${date}`,
      userId: `• ID: \${userId}`,
      userInfo: `👤 **User Information:**`,
      username: `• Username: @\${username}`,
      vipExpire: `• VIP Expiry: \${date}`,
      vipStatus: `• VIP Status: \${status}`,
      yes: `✅ Yes`,
    },
    refresh: {
      allUpToDate: `All VIP users' conversation history is up to date!`,
      batchComplete: `✅ **Batch refresh completed**`,
      checkHint: `Please check if the conversation history has been updated to clear avatars.`,
      complete: `✅ **Refresh completed**`,
      details: `📝 **Detailed results:**`,
      duration: `⏱️ **Duration:** \${duration} seconds`,
      error: `Error: \${error}`,
      errorOccurred: `An error occurred during processing, please check the logs.`,
      failed: `❌ **Refresh failed**`,
      failedPosts: `• Failed posts: \${count}`,
      failedUsers: `• Failure: \${count}`,
      moreUsers: `
...there are \${count} users`,
      noRefreshNeeded: `✅ **No refresh needed**`,
      outdatedPosts: `• Expired posts: \${count}`,
      processedUsers: `• Processing users: \${count}`,
      processing: `⏳ Processing, please wait...`,
      startingBatchRefresh: `🔄 **Starting batch refresh of VIP avatars**`,
      startingRefresh: `🔄 Starting to refresh your conversation history...`,
      stats: `📊 **Statistics:**`,
      successUsers: `• Success: \${count}`,
      summary: `📊 **Summary:**`,
      totalVipUsers: `• Total VIP users: \${count}`,
      updated: `• Updates: \${count} posts`,
      updatedPosts: `• Updated posts: \${count}`,
      userDetail: `• \${username}: \${updated} updated, \${failed} failed`,
      usersNeedingRefresh: `• Need refresh: \${count}`,
    },
  },
  adminNotification: {
    amount: `Amount: \${stars} ⭐`,
    data: `Data: \${data}`,
    daysLeft: `Remaining: \${days} days`,
    expireDate: `Expiration: \${date}`,
    newExpireDate: `New expiration: \${date}`,
    paymentFailed: `❌ **Payment Failed**`,
    paymentId: `Payment ID: \`\${id}\``,
    reason: `Reason: \${reason}`,
    refundRequest: `🔴 **Refund Request**`,
    requestId: `Request ID: #\${id}`,
    systemNotification: `📢 **System Notification**`,
    time: `Time: $\\{time} \${time}`,
    type: `Type: \${type}`,
    user: `User: \`\${userId}\``,
    viewRefundsHint: `💡 Use /admin_refunds for details`,
    vipDowngraded: `⬇️ **VIP Automatic Downgrade**`,
    vipPurchased: `🎉 **New VIP Purchase**`,
    vipReminderSent: `⏰ **VIP Expiry Reminder Sent**`,
    vipRenewed: `🔄 **VIP Renewal**`,
  },
  age: {
    daysAgo: `\${days} days ago`,
    hoursAgo: `\${hours} hours ago`,
    justNow: `Just Now`,
  },
  analytics: {
    ad: `• Official Advertisements: 
 - Impressions: {officialImpressions} times
 - Clicks: {officialClicks} times
 - CTR: {officialCtr}%
 - Rewards Granted: {officialRewardsGranted} slots

• VIP Page Views: {vipPageViews} times
• Purchase Intentions: {vipPurchaseIntents} times
• Successful Conversions: {vipConversions} times
• Conversion Rate: {vipConversionRate}%
• Revenue: \\\\\\\\\\$\${vipRevenue}`,
    ad2: `📊 **Advertising Effect Report**
📅 Period: {start} ~ {end}

• Total Impressions: {thirdPartyImpressions} times
• Total Completions: {thirdPartyCompletions} times
• Completion Rate: {thirdPartyCompletionRate}%
• Total Rewards: {thirdPartyRewardsGranted} slots

• Total Impressions: {officialImpressions} times
• Total Clicks: {officialClicks} times
• CTR: {officialCtr}%
• Total Rewards: {officialRewardsGranted} slots`,
    ad3: `📊 **Advertising Effect Report**
📅 Period: {start} ~ {end}

⚠️ **No Advertising Data Available Yet**

This could be because: 
• Advertising provider has not been configured yet
• No users have viewed advertisements yet
• No advertising campaigns within the selected time range

💡 **When Will Data Appear?**
• The following configurations need to be completed: 
 1. Configure advertising providers (like GigaPub)
 2. Create official advertisements
 3. Users start viewing advertisements

• It is recommended to configure the advertising provider first
• Then wait for users to start using the advertising feature`,
    complete: `
• Completion Rate: \${provider.completion_rate.toFixed(1)}%`,
    complete2: `
• Completions: \${provider.total_completions} times`,
    completion: `
• Completions: {completions} times`,
    completionRate: `
• Completion Rate: {rate}%`,
    conversionStepsTitle: `[Translation needed from zh-TW.ts]`,
    invite: `• Invitations Initiated: {initiated} times
• Invitations Accepted: {accepted} times
• Invitations Activated: {activated} times
• Conversion Rate: {conversionRate}%

• Bottles Thrown: {bottlesThrown} times
• Bottles Caught: {bottlesCaught} times
• New Conversations Started: {conversationsStarted} times
• Average Conversation Rounds: {avgConversationRounds}

💡 Detailed Data: /analytics`,
    message: `📊 **Daily Operation Report**
📅 Date: {date}

**👥 User Data**
• New Users: {newUsers} people
• Active Users (DAU): {dau} people
• Retention Rate (D1): {d1Retention}%
• Average Session Duration: {avgSessionDuration} minutes

**📺 Advertising Data**
• Third-Party Ads:
 - Impressions: {thirdPartyImpressions} times
 - Completions: {thirdPartyCompletions} times
 - Completion Rate: {thirdPartyCompletionRate}%
 - Rewards Granted: {thirdPartyRewardsGranted} quotas`,
    message2: `📊 **Daily Operation Report**
📅 Date: {date}

⚠️ **No Data Today**

This may be due to:
• The system has just been deployed, no user activity yet
• No users have used the Bot today
• Data tracking feature has not been enabled

💡 **When will data appear?**
• Users need to perform any of the following actions:
 - Send /start to register
 - Throw or pick a message bottle
 - Watch an ad
 - Purchase VIP

• It is recommended to wait for users to start using before checking
• Or simulate user behavior in the test environment`,
    message3: `

**📈 Overall Conversion Rate: \${report.overall_conversion_rate.toFixed(1)}%**`,
    message4: `
• Conversion Rate: \${step.conversion_rate.toFixed(1)}%`,
    message5: `
• Error Rate: \${provider.error_rate.toFixed(1)}%`,
    message6: `
• Requests: \${provider.total_requests} times`,
    providerComparisonTitle: `[Translation needed from zh-TW.ts]`,
    purchaseSuccess: `[Translation needed from zh-TW.ts]`,
    request: `
• Requests: {requests} times`,
    text: `
• User Count: \${step.user_count}`,
    text2: `Purchase Intent (click to buy)`,
    vip: `📊 **VIP Conversion Funnel**
📅 Period: {start} ~ {end}

⚠️ **No Data Available Currently**

This may be due to:
• The system has just been deployed, no user activity yet
• No VIP-related events in the selected timeframe
• Data tracking feature has not been enabled

💡 **When will data appear?**
• VIP conversion data requires users to perform the following actions:
 1. View VIP feature introduction
 2. Click to purchase VIP
 3. Complete VIP purchase

• It is recommended to wait 24-48 hours before checking
• Or simulate user behavior in the test environment`,
    vip2: `📊 **VIP Conversion Funnel**
📅 Period: {start} ~ {end}`,
    vip3: `Awareness (saw VIP prompt)`,
    vip4: `Consideration (viewed VIP details)`,
    vip5: `Interest (clicked to view VIP)`,
  },
  appeal: {
    alreadyExists: `⏳ You have a pending appeal (ID: #\${appealId})

Status: \${status}
Submitted at: \${time}

Please wait for the administrator's review.`,
    approved: `✅ 你的申訴已通過，帳號已解封`,
    noAppeal: `你目前沒有待審核的申訴`,
    notBanned: `✅ Your account is not banned, no need to appeal.`,
    notFound: `❌ Unable to find your appeal record.`,
    notes: `Remarks:`,
    prompt: `📝 **Submit Appeal**

Please explain why you believe your account was banned and how you would like to resolve this issue.

💡 Please provide detailed information about your situation to help the administrator process your appeal faster.`,
    reasonTooLong: `❌ The reason for the appeal is too long, please keep it within 500 characters.`,
    reasonTooShort: `❌ The reason for the appeal is too short, please enter at least 10 characters.`,
    rejected: `❌ 你的申訴已被拒絕`,
    reviewedAt: `Review Time:`,
    status: `📋 **Appeal Status**

Appeal ID: #\${appealId}
Status: \${status}
Submission Time: \${createdAt}\${reviewInfo}`,
    statusApproved: `Approved`,
    statusPending: `Pending Review`,
    statusRejected: `Rejected`,
    submitted: `✅ **Appeal Submitted**

Appeal ID: #\${appealId}
Status: Under Review

We will process your appeal within 1-3 business days.
The result will be notified to you via Bot.`,
  },
  block: {
    cannotIdentify: `⚠️ Unable to identify conversation partner`,
    catchNewBottle: `💡 Use /catch to pick a new message bottle to start a new conversation.`,
    conversationInfoError: `⚠️ Conversation information is incorrect.`,
    conversationMayEnded: `The conversation may have ended or does not exist.`,
    conversationNotFound: `⚠️ This conversation could not be found.`,
    ensureReply: `Please ensure you are replying to the message sent by the other party (marked with a # identifier).`,
    hint: `💡 This will accurately specify who to block.`,
    replyRequired: `⚠️ Please long press the message you want to block and reply with the command.`,
    step1: `1️⃣ Long press the other party's message.`,
    step2: `2️⃣ Select 'Reply'.`,
    step3: `3️⃣ Enter /block`,
    steps: `**Operation steps:**`,
    success: `✅ Blocked this user (#\${identifier})`,
    willNotMatch: `You will no longer be matched with each other's message bottles.`,
  },
  bottle: {
    bottle13: `Message bottle content`,
    cancelled: `❌ Canceled \${zodiac}`,
    containsUrl: `Message bottle content must not contain any links`,
    empty: `Message bottle content cannot be empty`,
    friendlyContent: `• Friendly and respectful content is more likely to be picked up!`,
    inappropriate: `Message bottle content contains inappropriate content, please modify and resubmit`,
    selected: `Selected: \${selected}`,
    selectedItem: `✅ Selected \${zodiac}`,
    tips: `💡 Tip:`,
    tooLong: `Message bottle content is too long, maximum \${max} characters allowed (currently \${current} characters)`,
    tooShort: `Message bottle content is too short, at least \${min} characters required (currently \${current} characters)`,
    catch: {
      anonymousUser: `Anonymous user`,
      back: `🏠 Return to main menu: /menu`,
      banned: `❌ Your account has been banned and cannot pick up message bottles.

For any questions, please use /appeal to appeal.`,
      block: `• To stop chatting, you can use /block to block
`,
      bottle: `😔 Currently, there are no suitable message bottles for you.

`,
      bottle2: `• Or throw a bottle yourself: /throw`,
      bottle3: `🎣 Someone has picked up your message bottle!

`,
      bottle4: `🧴 You have picked up a message bottle!

`,
      bottle5: `💡 Come back tomorrow to catch more bottles!`,
      bottleTaken: `❌ This message bottle has already been picked up by someone else, please try other message bottles!`,
      catch: `📊 Today's catches: \\\\$\${newCatchesCount}/\\\${quota}

`,
      conversation: `An anonymous conversation has been created for you, come and start chatting!

`,
      conversation2: `• This is an anonymous conversation, please protect your personal privacy
`,
      conversation3: `📊 View all conversations`,
      language: `🗣️ Language: \\\${language}

`,
      mbti: `🧠 MBTI: \\\${mbti}
`,
      message: `💫 Match score: \${score} points (Smart Match)

`,
      message2: `\${catcherGender} | 📅 \${catcherAge} years old

`,
      message3: `conv_reply_\${conversationIdentifier}`,
      message4: `2️⃣ Long press this message, select 'Reply' and enter your content

`,
      message5: `1️⃣ Click the '💬 Reply to Message' button below
`,
      message6: `2️⃣ Long press this message, select 'Reply' and enter your content`,
      nickname: `📝 Nickname: \${ownerMaskedNickname}
`,
      nickname2: `📝 Nickname: \${catcherNickname}
`,
      notRegistered: `❌ Please complete the registration process before picking up message bottles.

Use /start to continue registration.`,
      originalContent: `Original: {content}`,
      originalLanguage: `Original language: {language}`,
      quotaExhausted: `❌ Today's message bottle quota has been exhausted (\\\${quotaDisplay})`,
      replyButton: `💬 Reply message`,
      replyMethods: `💡 **Two ways to reply**: 
`,
      report: `• If you encounter inappropriate content, please report it using /report
`,
      safetyTips: `⚠️ Safety reminder: 
`,
      settings: `🧠 MBTI：\${mbti}
`,
      settings10: `Not set`,
      settings11: `Not set`,
      settings2: `Not set`,
      settings3: `Not set`,
      settings4: `Not set`,
      settings5: `Not set`,
      settings6: `Not set`,
      settings7: `Not set`,
      settings8: `Not set`,
      settings9: `Not set`,
      short: `💡 Tip:
`,
      short2: `• Please try again later
`,
      short3: `Anonymous user`,
      short4: `♂️ Male`,
      short5: `♀️ Female`,
      text: `Translation language: \\\${catcherLangDisplay}
`,
      text2: `Original language: \\\${bottleLangDisplay}
`,
      text3: `🗣️ Language: \\\${ownerLanguage}

`,
      text4: `• To stop chatting, you can use /block to block

`,
      text5: `Original text: \\\${bottle.content}
`,
      text6: `💬 Translation service is temporarily experiencing issues, backup translation has been used
`,
      text7: `Translation: \\\${bottleContent}
`,
      text8: `💡 **Two ways to reply**:
`,
      translatedContent: `Translation: {content}`,
      translatedLanguage: `Translated language: {language}`,
      translationServiceFallback: `💬 Translation service is temporarily experiencing issues, fallback translation used`,
      translationServiceUnavailable: `⚠️ Translation service is temporarily unavailable, below is the original text`,
      unknown: `Unknown`,
      zodiac: `⭐ Zodiac: \\\${bottle.zodiac}
`,
      zodiac2: `⭐ Zodiac: \\\${catcherZodiac}
`,
    },
    throw: {
      age: `• Similar age range ✓`,
      aiModerationFailed: `AI content review failed`,
      back: `↩️ Return to filter menu`,
      bloodType: `🩸 **Blood Type Filter**

`,
      bloodType2: `• Blood Type: Filter by specific blood type
`,
      bloodType3: `Select the blood type you want to match with:`,
      bloodType4: `🩸 Blood Type Filter`,
      bloodType5: `🌈 Any Blood Type`,
      bottle: `
💡 This message bottle is very compatible with you!
\\
`,
      bottle10: `🍾 Message bottle has been thrown!

`,
      bottle11: `🍾 Throw Message Bottle`,
      bottle2: `🎯 Your bottle has been sent to **3 recipients**: 
`,
      bottle3: `🍾 **Throwing your message bottle...**

`,
      bottle4: `🍾 **Throw Message Bottle** #THROW

`,
      bottle5: `Bottle ID: #\\\${bottleId}

`,
      bottle6: `📝 **Please enter the content of your message bottle**

`,
      bottle7: `1️⃣ Click the button below '🍾 Throw Message Bottle'
`,
      bottle8: `📝 Please enter the content of your message bottle: 

`,
      bottle9: `📝 Please enter the content of your message bottle:`,
      cancel: `💡 Click to select or cancel MBTI type:`,
      cancel2: `💡 Click to select or cancel Zodiac sign:`,
      catch: `• Slot 3: Public Pool (waiting to be picked up)

`,
      catch2: `• Slot 2: Public Pool (waiting to be picked up)
`,
      catch3: `• Slot 1: Public Pool (Waiting to be picked up)
`,
      catch4: `🌊 Waiting for fate to pick you up...
`,
      complete: `⚙️ **Advanced Filter**

\\\${summary}
💡 Continue adjusting or complete the filter:`,
      complete2: `🎯 **Pairing 1 Completed:**
`,
      complete3: `📝 You have an unfinished draft

`,
      complete4: `⏳ Estimated completion in 3-5 seconds`,
      complete5: `⏳ Estimated completion in 2-3 seconds`,
      complete6: `⏳ Estimated completion in 1-2 seconds`,
      conversation: `💬 Conversation Identifier: \\\\$ {vipMatchInfo.conversationIdentifier}

 \${vipMatchInfo.conversationIdentifier}`,
      conversation2: `💡 Tip: Each conversation is independent and can happen simultaneously

`,
      conversation3: `💡 You may receive **up to 3 conversations**!
`,
      conversation4: `💬 You may receive **up to 3 conversations**!
`,
      conversation5: `Use /chats to view all conversations

`,
      conversation6: `📊 Use /chats to view all conversations`,
      conversation7: `Use /chats to view all conversations`,
      currentSelection: `Current selection: {genderText}`,
      gender: `• Gender: \\\\$ {selectedGender === 'male' ? '👨 Male' : selectedGender === 'female' ? '👩 Female' : '🌈 Anyone'}
`,
      gender2: `👤 **Gender Filter**

`,
      gender3: `• Gender: Filter by gender

`,
      gender4: `💡 Select the gender you desire:`,
      gender5: `👤 Gender Filter`,
      genderLabel: `• Gender: {gender}
`,
      mbti: `• MBTI: \\\${selectedMBTI.length > 0 ? selectedMBTI.join(', ') : 'No Limit'}
 {selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '無限制'} \${selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '無限制'}`,
      mbti2: `Selected: \\\${selectedMBTI.length > 0 ? selectedMBTI.join(', ') : 'None'}

 {selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '無'} \${selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '無'}`,
      mbti3: `Selected: \\\${selectedMBTI.length > 0 ? selectedMBTI.join(`,
      mbti4: `🧠 **MBTI Filter**

`,
      mbti5: `• MBTI: Filter specific personality types
`,
      mbti6: `• High MBTI Match ✓`,
      mbti7: `🧠 MBTI Filter`,
      mbtiLabel: `• MBTI: {mbti}
`,
      message: `Selected: \\\${selectedZodiac.length > 0 ? selectedZodiac.map((z) => ZODIAC_NAMES[z]).join(', ') : 'None'}

`,
      message2: `Current selection: \\\${currentGender === 'male' ? '👨 Male' : currentGender === 'female' ? '👩 Female' : '🌈 Anyone'}

`,
      message3: `Selected: \\\${selectedZodiac.length > 0 ? selectedZodiac.map((z) => ZODIAC_NAMES[z]).join(`,
      message4: `Current selection: \\\${bloodTypeDisplay[currentBloodType]}

`,
      message5: `👤 Partner: \\\${vipMatchInfo.matcherNickname}
`,
      message6: `"Hello! I'm someone who loves music and movies, hoping to meet like-minded friends!"

`,
      message7: `💡 You can modify matching preferences in /edit_profile

`,
      message8: `💬 Click /reply to respond to the message and start chatting
`,
      nickname: `📝 Partner's Nickname: \\\${matchedUserMaskedNickname}
`,
      quota: `• More quotas (30 per day)
`,
      quota2: `🎁 Invite friends to increase quotas: 
`,
      settings: `🧠 MBTI: \\\${mbti}
 \${mbti}`,
      settings2: `⭐ Zodiac: \\\${zodiac}
 \${zodiac}`,
      settings3: `🧠 MBTI: \${mbti}
 \${mbti}`,
      settings4: `⭐ Zodiac: \${zodiac}
 \${zodiac}`,
      settings5: `Not set`,
      settings6: `Not set`,
      settings7: `Not set`,
      settings8: `Not set`,
      short: `• Same language ✓`,
      short10: `♋ Cancer`,
      short11: `♌ Leo`,
      short12: `♍ Virgo`,
      short13: `♎ Libra`,
      short14: `♏ Scorpio`,
      short15: `♐ Sagittarius`,
      short16: `♑ Capricorn`,
      short17: `♒ Aquarius`,
      short18: `♓ Pisces`,
      short19: `Violation`,
      short2: `🩸 AB Type`,
      short20: `Unlimited`,
      short21: `Unlimited`,
      short22: `Unlimited`,
      short23: `Unlimited`,
      short3: `🌈 Anyone`,
      short4: `🩸 Type A`,
      short5: `🩸 Type B`,
      short6: `🩸 Type O`,
      short7: `♈ Aries`,
      short8: `♉ Taurus`,
      short9: `♊ Gemini`,
      start: `✍️ Restart`,
      success: `One message bottle = 3 recipients, significantly increasing match success rate

`,
      success2: `✨ **VIP privilege activated! Smart matching successful!**

`,
      success3: `🎯 Your message bottle has been successfully matched!

`,
      text: `💝 Match rate: \${matchPercentage}%
`,
      text10: `🎯 Finding the best matching recipient for you

`,
      text11: `
💬 Waiting for the other party's reply...
`,
      text12: `• Free users: up to +7
`,
      text13: `• Do not include personal contact information

`,
      text14: `💡 **Two input methods**: 
`,
      text15: `📊 Free users: 3 per day
`,
      text16: `Select the conditions you want to filter by:

`,
      text17: `• Advanced filtering and translation

`,
      text18: `Creation time: \\\${age}
`,
      text19: `Use /vip to upgrade immediately`,
      text2: `• 🆕 Triple exposure opportunity (1 entry = 3 targets)
`,
      text20: `💬 **Example**:
`,
      text21: `Use /vip to learn more`,
      text22: `Do you want to continue editing this draft?`,
      text23: `💡 You can combine multiple conditions`,
      text24: `Current filter conditions:

`,
      text3: `💡 This may take a few seconds, we are finding the most suitable people for you`,
      text4: `Current selection: \\\${currentGender ===`,
      text5: `🎯 Looking for matches: \\\${targetText}
`,
      text6: `🎯 Finding 3 best match candidates for you

`,
      text7: `📨 **2 additional slots waiting:**
`,
      text8: `🔍 Smartly matching with the best candidates...

`,
      text9: `Content preview: \\\${preview}

`,
      throw: `📊 Today's sent: \\\${quotaDisplay}

`,
      unlimited: `Unlimited`,
      urlNotAllowed: `❌ 訊息包含不被允許的網址`,
      vip: `💎 VIP users: 30 per day (triple exposure)

`,
      vip2: `💎 **Upgrade to VIP for triple exposure opportunities!**
`,
      vip3: `⚙️ **Advanced Filter (VIP Exclusive)**

`,
      vip4: `• VIP Users: Up to +70

`,
      vip5: `✨ **VIP Privileges Activated!**

`,
      vip6: `💡 Upgrade to VIP to receive: 
`,
      vip7: `✨ VIP Privileges Activating
`,
      zodiac: `• Zodiac: \\\\$\\{selectedZodiac.length > 0 ? selectedZodiac.map((z) => ZODIAC_NAMES[z]).join(', ') : 'Unlimited'}
`,
      zodiac2: `⭐ Zodiac: \\\\$\\{matchResult.user.zodiac ||`,
      zodiac3: `⭐ Zodiac: \\\\$\\{user.zodiac_sign ||`,
      zodiac4: `⭐ **Zodiac Filter**

`,
      zodiac5: `• Zodiac: Filter specific zodiac signs
`,
      zodiac6: `• Zodiac Compatibility ✓`,
      zodiac7: `⭐ Zodiac Filter`,
      zodiacLabel: `• Zodiac: {zodiac}
`,
    },
  },
  broadcast: {
    admin: `Admin Manual Cancellation`,
    admin2: `Admin Manual Cleanup (Broadcast Stuck)`,
    allBroadcastsNormal: `All broadcast statuses are normal.`,
    broadcastNotFound: `❌ Broadcast record not found`,
    cancelCommand: `/broadcast_cancel 

`,
    cancelCorrectFormat: `**Correct format:**
`,
    cancelExample: `**Example:**
`,
    cancelExampleCommand: `/broadcast_cancel 1`,
    cancelFailed: `❌ Failed to cancel the broadcast: {error}`,
    cancelUsageError: `❌ Incorrect usage

`,
    cancelled: `✅ Broadcast has been cancelled

`,
    cancelledId: `ID: {id}
`,
    cancelledStatus: `Status: Cancelled

`,
    checkProgressLater: `
Please use /broadcast_status later to check the progress.`,
    cleanupFailed: `❌ Failed to clear broadcast: {error}`,
    cleanupIds: `Broadcast ID: {ids}

`,
    cleanupMarkedFailed: `These broadcasts have been marked as 'failed' status
`,
    cleanupSuccess: `✅ Cleared {count} stuck broadcasts

`,
    cleanupViewStatus: `Use /broadcast_status to see the updated records.`,
    completedAt: `Completion time: {time}
`,
    correctFormat: `**Correct format:**
`,
    createFailed: `❌ Failed to create broadcast, please try again later.`,
    createFailedShort: `❌ Failed to create broadcast.`,
    created: `✅ Broadcast has been created

`,
    empty: `Message bottle cannot be empty`,
    error: `Error: {error}`,
    estimatedTime: `Estimated Time: {time}

`,
    example: `**Example:**
`,
    exampleMessage: `The system will undergo maintenance tonight at 22:00`,
    failed: `Failed: {count}
`,
    filterAge: `• age=18-25
`,
    filterCommand: `/broadcast_filter 

`,
    filterConfirmConditions: `**Filter conditions:**
{conditions}

`,
    filterConfirmMessage: `**Message content:**
{message}

`,
    filterConfirmTitle: `🔍 **Broadcast Filter Confirmation**

`,
    filterCorrectFormat: `**Correct Format:**
`,
    filterCountry: `• country=TW|US|JP|...
`,
    filterCreateFailed: `❌ Failed to create filter broadcast

{error}`,
    filterCreated: `✅ Broadcast filter created

`,
    filterCreatedConditions: `Filter conditions: {conditions}
`,
    filterCreatedEstimatedTime: `Estimated time: {time}

`,
    filterCreatedId: `ID: {id}
`,
    filterCreatedSending: `The broadcast will be sent in the background, use /broadcast_status {id} to check the progress.`,
    filterCreatedUserCount: `Number of matching users: {count} people
`,
    filterExample1: `/broadcast_filter gender=female,age=18-25,country=TW Hello everyone!
`,
    filterExample2: `/broadcast_filter vip=true,mbti=INTJ VIP exclusive event notification
`,
    filterExample3: `/broadcast_filter zodiac=Scorpio Exclusive message for Scorpio`,
    filterExamples: `**Example:**
`,
    filterFormat: `**Filter Format:**
`,
    filterFormatError: `❌ Filter format error

{error}

`,
    filterGender: `• gender=male|female|other
`,
    filterMbti: `• mbti=INTJ|ENFP|...
`,
    filterQueryingUsers: `Querying users that match the criteria...`,
    filterUsageError: `❌ Incorrect usage

`,
    filterViewFormat: `Please use /broadcast_filter to see the correct format.`,
    filterVip: `• vip=true|false

`,
    filterZodiac: `• zodiac=Aries|Taurus|...
`,
    foundStuckBroadcasts: `⚠️ Detected {count} stuck broadcasts

`,
    id: `ID: {id}
`,
    idMustBeNumber: `❌ Broadcast ID must be a number`,
    maxUsersExceeded: `❌ The current broadcast system only supports broadcasts to \${max} users or less.

Target user count: \${current}`,
    messageContent: `Message content`,
    noPendingBroadcasts: `Currently, there are no pending or stuck broadcasts.

`,
    noRecords: `📊 No broadcast records currently`,
    noStuckBroadcasts: `✅ No broadcasts to clean up

`,
    processQueueFailed: `❌ Failed to process the broadcast queue: {error}`,
    processingBroadcast: `Processing broadcast #{id}
`,
    progress: `Progress: {sent}/{total} ({percentage}%)
`,
    queryStatusFailed: `❌ Failed to query broadcast status: {error}`,
    queueProcessed: `✅ Broadcast queue processing completed

`,
    queueRemaining: `
There are {count} broadcasts in the queue waiting to be processed
`,
    queueTriggered: `{emoji} Broadcast queue processing has been triggered

`,
    recentRecords: `📊 Recent 5 broadcast records

`,
    recordId: `ID: {id}
`,
    recordProgress: `Progress: {sent}/{total}
`,
    recordStatus: `Status: {status}
`,
    recordTarget: `Target: {type}
`,
    recordTime: `Time: {time}

`,
    sendingInBackground: `The broadcast will be sent in the background, use /broadcast_status {id} to check the progress.`,
    short: `Pending`,
    short2: `Waiting`,
    startedAt: `Start time: {time}
`,
    statusLabel: `Status: {status}
`,
    statusPending: `Pending`,
    statusStuck: `Stuck (Retrying)`,
    statusTitle: `📊 Broadcast Status`,
    stuckBroadcastConfirm: `**Confirm cleanup?**
`,
    stuckBroadcastConfirmCommand: `Use \`/broadcast_cleanup confirm\` to confirm`,
    stuckBroadcastDivider: `━━━━━━━━━━━━━━━━
`,
    stuckBroadcastId: `**ID: {id}**
`,
    stuckBroadcastMessage: `Message: {message}
`,
    stuckBroadcastNoRetry: `Will not be auto-processed or resent

`,
    stuckBroadcastProgress: `Progress: {sent}/{total}
`,
    stuckBroadcastStartTime: `Start time: {time}

`,
    stuckBroadcastTarget: `Target: {type}
`,
    stuckBroadcastWillMarkFailed: `These broadcasts will be marked as 'failed' status
`,
    targetAll: `All users`,
    targetLabel: `Target: {target}
`,
    targetNonVip: `Non-VIP users`,
    targetType: `Target: {type}
`,
    targetVip: `VIP users`,
    tooLong: `Message bottle cannot exceed \${max} characters (currently \${current} characters)`,
    upgradeRequired: `Large-scale broadcasting requires system architecture upgrade, please refer to BROADCAST_SYSTEM_REDESIGN.md`,
    usageError: `❌ Incorrect usage

`,
    userCount: `User Count: {count} people
`,
    userCount2: `Number of users: {count} people
`,
    viewAllRecords: `Use /broadcast_status to view all broadcast records.`,
    viewDetailsHint: `💡 Use /broadcast_status to view details`,
    viewUpdatedStatus: `Use /broadcast_status to check the updated status.`,
    estimate: {
      immediate: `Send Immediately (Approx. 1-2 seconds)`,
      minutes: `About \${minutes} minutes`,
      seconds: `About \${seconds} seconds`,
    },
    filter: {
      age: `Age: {min}-{max} years`,
      atLeastOneRequired: `At least one filter is required`,
      birthdayToday: `Birthday Today`,
      country: `Country: {country}`,
      genderFemale: `Female`,
      genderMale: `Male`,
      genderOther: `Other`,
      invalidAgeFormat: `Invalid age range: {value} (format must be min-max, e.g., 18-25)`,
      invalidAgeMinMax: `Invalid age range: {value} (minimum age cannot be greater than maximum age)`,
      invalidAgeRange: `Invalid age range: {value} (age must be between 18-99)`,
      invalidCountry: `Invalid country code: {value} (must be 2 uppercase letters, e.g., TW, US, JP)`,
      invalidFormat: `Invalid filter format: {pair}`,
      invalidGender: `Invalid gender value: {value} (must be male, female, or other)`,
      invalidMbti: `Invalid MBTI type: {value} (must be one of: {mbtis})`,
      invalidZodiac: `Invalid zodiac: {value} (must be one of: {zodiacs})`,
      mbti: `MBTI: {mbti}`,
      nonVipUsers: `Non-VIP User`,
      unknownFilter: `Unknown filter: {key}`,
      vipUsers: `VIP User`,
      zodiacAquarius: `Aquarius`,
      zodiacAries: `Aries`,
      zodiacCancer: `Cancer`,
      zodiacCapricorn: `Capricorn`,
      zodiacGemini: `Gemini`,
      zodiacLeo: `Leo`,
      zodiacLibra: `Libra`,
      zodiacPisces: `Pisces`,
      zodiacSagittarius: `Sagittarius`,
      zodiacScorpio: `Scorpio`,
      zodiacTaurus: `Taurus`,
      zodiacVirgo: `Virgo`,
    },
    status: {
      cancelled: `Cancelled`,
      completed: `Completed`,
      failed: `Failed`,
      pending: `Waiting`,
      sending: `Sending`,
    },
    target: {
      all: `All Users`,
      nonVip: `Non-VIP Users`,
      unknown: `Unknown`,
      vip: `VIP User`,
    },
  },
  buttons: {
    ad: `➡️ Next Ad`,
    back: `⬅️ Back`,
    backToVip: `💎 Back to VIP Menu`,
    bottle: `📺 Watch Ads to Get More Message Bottles 🎁 (\${remaining}/20)`,
    bottle2: `💎 Upgrade to VIP for More Message Bottles`,
    bottle3: `🌊 Throw Out Message Bottle`,
    bottle4: `🎣 Pick Up Message Bottle`,
    cancel: `Cancel`,
    help: `❓ Help`,
    invite: `👥 View Invitation Code`,
    invite2: `🎁 Invite Friends`,
    mbtiMenu: `🧠 MBTI menu`,
    message: `💬 Reply to Message`,
    profile: `✏️ Edit Profile`,
    profile2: `👤 Profile`,
    returnToMenu: `🏠 Return to main menu`,
    settings: `⚙️ Settings`,
    short: `🇲🇾 Malaysia`,
    short10: `🇺🇸 United States`,
    short11: `🇯🇵 Japan`,
    short12: `🇰🇷 South Korea`,
    short13: `🇬🇧 United Kingdom`,
    short14: `🇫🇷 France`,
    short15: `🇩🇪 Germany`,
    short16: `🇹🇭 Thailand`,
    short17: `🇦🇺 Australia`,
    short18: `💬 Chat History`,
    short19: `🌐 Change Language`,
    short2: `🇺🇳 United Nations Flag`,
    short20: `🎁 Claim Reward`,
    short21: `🔄 Clear Selection`,
    short22: `Skip`,
    short3: `📢 Join Official Channel`,
    short4: `🇸🇬 Singapore`,
    short5: `🇨🇦 Canada`,
    short6: `🇳🇿 New Zealand`,
    short7: `🇹🇼 Taiwan`,
    short8: `🇨🇳 China`,
    short9: `🇭🇰 Hong Kong`,
    stats: `📊 Statistics`,
    targetAdvanced: `⚙️ Advanced Filter (MBTI/Zodiac)`,
    targetAny: `🌈 Anyone can participate`,
    targetFemale: `👩 Female`,
    targetMale: `👨 Male`,
    text: `👤 View Profile`,
    viewPayments: `💰 Subscription History`,
    vip: `💎 Upgrade to VIP`,
  },
  catch: {
    anonymousUser: `Anonymous User`,
    back: `🏠 Return to Main Menu: /menu`,
    banned: `❌ Your account has been banned and cannot pick up message bottles.

If you have any questions, please use /appeal to appeal.`,
    block: `• If you no longer want to chat, you can use /block to block
`,
    bottle: `😔 Currently, there are no suitable message bottles for you

`,
    bottle2: `• Or throw a bottle yourself: /throw`,
    bottle3: `🎣 Someone has found your message bottle!

`,
    bottle4: `🧴 You have picked up a message bottle!

`,
    bottle5: `💡 Come back tomorrow to pick up more bottles!`,
    bottleTaken: `❌ This message bottle has already been picked up by someone else; please try another bottle!`,
    catch: `📊 Today caught: \${newCatchesCount}/\${quota}

`,
    conversation: `An anonymous chat has been created for you, come start chatting～

`,
    conversation2: `• This is an anonymous conversation, please protect your personal privacy
`,
    conversation3: `📊 View All Conversations`,
    conversationError: `Failed to create conversation`,
    language: `🗣️ Language: \${language}

`,
    mbti: `🧠 MBTI: \${mbti}
`,
    message: `💫 Match Score: \${score} points (Smart Matching)

`,
    message2: `\${catcherGender} | 📅 \${catcherAge} years old

`,
    message3: `conv_reply_\${conversationIdentifier}`,
    message4: `2️⃣ Long press this message, choose 'Reply' and then enter your content

`,
    message5: `1️⃣ Click the '💬 Reply Message' button below
`,
    message6: `2️⃣ Long press this message, select 'Reply' and enter content`,
    nickname: `📝 Nickname: \${ownerMaskedNickname}
`,
    nickname2: `📝 Nickname: \${catcherNickname}
`,
    notRegistered: `❌ Please complete the registration process before picking up message bottles.

Use /start to continue registration.`,
    originalContent: `Original Text: {content}`,
    originalLanguage: `Original Language: {language}`,
    quotaExhausted: `❌ Today's message bottle quota has been used up (\${quotaDisplay})`,
    replyButton: `💬 Reply Message`,
    replyMethods: `💡 **Two Ways to Reply**:
`,
    report: `• If you encounter inappropriate content, please use /report to report
`,
    safetyTips: `⚠️ Safety Reminder:
`,
    settings: `🧠 MBTI：\${mbti}
`,
    settings10: `Not set`,
    settings11: `Not Set`,
    settings2: `Not Set`,
    settings3: `Not Set`,
    settings4: `Not Set`,
    settings5: `Not Set`,
    settings6: `Not Set`,
    settings7: `Not Set`,
    settings8: `Not Set`,
    settings9: `Not Set`,
    short: `💡 Tip:
`,
    short2: `• Try again later
`,
    short3: `Anonymous user`,
    short4: `♂️ Male`,
    short5: `♀️ Female`,
    text: `Translation Language: \${catcherLangDisplay}
`,
    text2: `Original Language: \${bottleLangDisplay}
`,
    text3: `🗣️ Language: \${ownerLanguage}

`,
    text4: `• To stop chatting, you can use /block to block

`,
    text5: `Original Text: \${bottle.content}
`,
    text6: `💬 Translation service is temporarily having issues, using backup translation
`,
    text7: `Translation: \${bottleContent}
`,
    text8: `💡 **Two reply methods**:
`,
    translatedContent: `Translation: {content}`,
    translatedLanguage: `Translation Language: {language}`,
    translationServiceFallback: `💬 Translation service is temporarily having issues, fallback translation is in use`,
    translationServiceUnavailable: `⚠️ Translation service is temporarily unavailable, below is the original text`,
    unknown: `Unknown`,
    zodiac: `⭐ Zodiac: {zodiac}
`,
    zodiac2: `⭐ Zodiac: \${catcherZodiac}
`,
  },
  channelMembership: {
    claimButton: `✅ Claim reward`,
    claimReward: `Click the button below to claim your reward: +1 message bottle`,
    joined: `🎉 Detected that you have joined the official channel!`,
    leftChannel: `❌ Detected that you have left the channel, unable to claim reward.`,
    notJoined: `❌ Did not detect that you joined the channel, please join first and try again`,
    oneTimeReward: `💡 This is a one-time reward, it will be added to today's quota after claiming.`,
    rewardAdded: `Reward: +1 message bottle (added to today's quota)`,
    rewardGranted: `✅ Reward has been issued! +1 message bottle`,
    taskCompleted: `🎉 Congratulations on completing the task: Join the official channel!`,
    viewMoreTasks: `💡 Use /tasks to see more tasks`,
    viewTaskCenter: `[📋 View Task Center] → /tasks`,
  },
  common: {
    ad: `📺 Today's ads: \${adsWatched}/\${AD_REWARD_CONSTANTS.MAX_ADS_PER_DAY} | Earned \${quotaEarned} quota | Remaining \${remaining} times`,
    ad2: `📺 Today's ads: \${adsWatched}/\${AD_REWARD_CONSTANTS.MAX_ADS_PER_DAY} ✅ Limit reached | Earned \${quotaEarned} quota`,
    ad3: `📺 Today's ads: 0/\${AD_REWARD_CONSTANTS.MAX_ADS_PER_DAY} | Earned 0 quota`,
    ad4: `• 📺 Watch ads (Remaining \${remaining}/20 times)
`,
    ad5: `• 📺 Watch ads (Limit reached today)
`,
    ad6: `• Avoid ads or inappropriate content

`,
    ad7: `📊 No official ads available`,
    ad8: `📢 Spam ads`,
    ad9: `💡 More official ads are available to watch!`,
    admin: `Please try again later or contact the administrator.`,
    age: `Invalid age range: \${trimmedValue} (format must be min-max, e.g., 18-25)`,
    age2: `Age: \${filters.age.min}-\${filters.age.max} years old`,
    age3: `Invalid age range: \${trimmedValue} (age must be between 18-99)`,
    age4: `Invalid age range: \${trimmedValue} (minimum age cannot be greater than maximum age)`,
    anonymous: `Anonymous`,
    anonymousUser: `[Translation needed from zh-TW.ts]`,
    anyBloodType: `🌈 Any blood type`,
    anyone: `🌈 Anyone`,
    back: `💡 Type /menu at any time to return to the main menu`,
    back2: `↩️ Return to edit profile`,
    back3: `🏠 Return to main menu`,
    back4: `↩️ Back`,
    backToMainMenu: `Return to main menu`,
    birthday: `🎂 Birthday: \${updatedUser.birthday}
`,
    birthday2: `🎂 Birthday: \${user.birthday}
`,
    birthday3: `Birthday today`,
    bloodType: `🩸 Blood type: \${bloodTypeText}

`,
    bloodType2: `🩸 **Edit blood type**

`,
    bloodType3: `Please select your blood type:`,
    bloodType4: `🩸 Edit Blood Type`,
    bloodTypeA: `🩸 Type A`,
    bloodTypeAB: `🩸 Type AB`,
    bloodTypeB: `🩸 Type B`,
    bloodTypeO: `🩸 Type O`,
    bottle: `The message bottle content is too short, at least \${MIN_BOTTLE_LENGTH} characters required (currently \${trimmedContent.length} characters)`,
    bottle10: `Reward: +1 message bottle (added to today's quota)

`,
    bottle11: `You will no longer be matched with each other's message bottles.

`,
    bottle12: `What kind of person do you want to find when throwing a message bottle?

`,
    bottle13: `Use /throw to throw a message bottle and start chatting!`,
    bottle14: `The message bottle content contains inappropriate content, please modify it and resubmit.`,
    bottle15: `Click the button below to claim the reward: +1 message bottle

`,
    bottle16: `💡 This setting will be automatically used for your next message bottle throw.`,
    bottle17: `🌊 Throw a message bottle - /throw
`,
    bottle18: `🎣 Catch a message bottle - /catch
`,
    bottle19: `🎉 Confirming will grant you a +1 message bottle reward!`,
    bottle2: `The message bottle content is too long, up to \${MAX_BOTTLE_LENGTH} characters allowed (currently \${content.length} characters)`,
    bottle20: `✏️ Please enter new message bottle content: 

`,
    bottle21: `• Use /catch to catch a new message bottle`,
    bottle22: `• /throw - Throw a message bottle
`,
    bottle23: `• /catch - Catch a message bottle
`,
    bottle24: `• /throw - Throw a message bottle
`,
    bottle25: `• /catch - Catch a message bottle
`,
    bottle26: `• Send draft content to throw a message bottle`,
    bottle27: `📦 **Throw Message Bottle**
`,
    bottle28: `🎣 **Pick Up Message Bottle**
`,
    bottle29: `💡 Complete tasks to earn extra bottles`,
    bottle3: `• Message Bottles: \${bottlesCount?.count || 0}
`,
    bottle30: `The content of the bottle must not contain any links`,
    bottle31: `🍾 Throw Message Bottle

`,
    bottle32: `The bottle content cannot be empty`,
    bottle33: `Throw your first bottle`,
    bottle34: `Pick up your first bottle`,
    bottle4: `An anonymous message bottle social platform, helping you find like-minded friends through MBTI and zodiac signs

`,
    bottle5: `⏰ The conversation has timed out

The other party may have left. Use /catch to pick up a new bottle!`,
    bottle6: `💡 Use /catch to pick up a new message bottle to start a new conversation.`,
    bottle7: `🍾 Throw Message Bottle

What kind of chat partner are you looking for?`,
    bottle8: `Go throw a bottle to meet new friends! /throw

`,
    bottle9: `Check out others' message bottles and reply if you're interested to start chatting

`,
    broadcast: `Broadcast will be sent in the background, use /broadcast_status \${broadcastId} to check progress.`,
    broadcast10: `📊 Recent 5 Broadcast Records

`,
    broadcast11: `Maintenance notice has been broadcasted to all users.
`,
    broadcast12: `Restoration notice has been broadcasted to all users.`,
    broadcast13: `📊 Currently, there are no broadcast records.`,
    broadcast14: `📊 Broadcast Status

`,
    broadcast15: `All broadcast statuses are normal.`,
    broadcast2: `Large-scale broadcasts require system architecture upgrades, please refer to BROADCAST_SYSTEM_REDESIGN.md`,
    broadcast3: `Use /broadcast_status to view all broadcast records.`,
    broadcast4: `\${statusEmoji} Broadcast queue processing has been triggered

`,
    broadcast5: `/broadcast_cancel 

`,
    broadcast6: `Broadcast ID: \${ids.join(', ')}

`,
    broadcast7: `Processing broadcast #\${broadcast.id}
`,
    broadcast8: `Currently, there are no pending or stuck broadcasts.

`,
    broadcast9: `Broadcast ID: \${ids.join(', ')} Please remove these links before re-entering or canceling editing:`,
    cancel: `Status: Canceled

`,
    cancel2: `Please re-enter or cancel editing:`,
    cancel3: `⏰ Bottle catching process has timed out

Please use /catch to restart.`,
    cancelled: `Cancelled`,
    catch: `You caught a message bottle → The other party replied → Start anonymous chat`,
    catch2: `• Friendly and respectful content is more likely to be picked up~`,
    catch3: `Message Bottle Process`,
    catch4: `🎉 **Ad viewing completed!**

✅ Earned **+1 quota**
📊 Today watched: **\${updated.ads_watched}/20** times
🎁 Quota earned today: **\${updated.quota_earned}**
📈 Remaining chances: **\${result.remaining_ads}**

\${result.remaining_ads > 0 ? '💡 Continue watching ads for more quotas!' : '✅ Daily ad limit reached'}`,
    close: `❌ Close`,
    complete: `📺 **Watch ads to earn quotas**

🎁 Completing the watch earns **+1 quota**
📊 Remaining today: **\${remainingAds}/20** times

👇 Click the button below to start watching {updated.ads_watched} {updated.quota_earned} {result.remaining_ads} {result.remaining_ads > 0 ? '💡 繼續觀看廣告可獲得更多額度！' : '✅ 今日廣告已達上限'} \${updated.ads_watched} \${updated.quota_earned} \${result.remaining_ads} \${result.remaining_ads > 0 ? '💡 繼續觀看廣告可獲得更多額度！' : '✅ 今日廣告已達上限'}`,
    complete2: `Completion time: \${new Date(broadcast.completedAt).toLocaleString('zh-TW')}
 {remainingAds} \${remainingAds}`,
    complete3: `{new Date(broadcast.completedAt).toLocaleString('zh-TW')} \${new Date(broadcast.completedAt).toLocaleString('zh-TW')}`,
    complete4: `Estimated completion: \${new Date(maintenance.endTime).toLocaleString('zh-TW')}
`,
    complete5: `🎉 \${testTitle} completed!

`,
    complete6: `Completed just before the deadline`,
    complete7: `Almost finished`,
    complete8: `Finish as soon as possible`,
    confirm: `To ensure the safety of all users, please confirm that you understand the following: 

`,
    confirm2: `🌍 **Confirm your country/region**

`,
    confirm3: `🛡️ Last step: Anti-fraud safety confirmation

`,
    confirm4: `🔍 **Broadcast filter confirmation**

`,
    confirm5: `🌍 Confirm your country/region`,
    confirm6: `**Confirm cleanup?**
`,
    confirm7: `Please confirm:`,
    conversation: `📨 \${formatIdentifier(conv.identifier)} conversation (\${conv.message_count} messages)
`,
    conversation10: `💡 **No conversation history found**

`,
    conversation11: `Some conversation history may not have been updated, please try again later.`,
    conversation12: `
📨 **Recent conversations:**

`,
    conversation13: `💬 You have no conversation records yet

`,
    conversation14: `💬 Continue conversation: /reply
`,
    conversation15: `You have no conversation records yet.

`,
    conversation16: `The conversation may have ended or does not exist.`,
    conversation17: `💬 Continue conversation`,
    conversation18: `Start first conversation`,
    conversation2: `💬 **Conversation with \${formatIdentifier(identifier)}**

`,
    conversation3: `• Conversation started: \${formatDate(stats.first_message_time)}
`,
    conversation4: `• Conversations: \${conversationsCount?.count || 0}
`,
    conversation5: `💬 Reply to conversation \${conversationIdentifier}`,
    conversation6: `Your avatar cache has been refreshed. The latest avatar will display next time you view conversation history.

`,
    conversation7: `💡 To protect privacy and security, only plain text messages are allowed in conversations.

`,
    conversation8: `Use /history to view all conversations

`,
    conversation9: `🔄 Refreshing all conversation history...

`,
    country: `Invalid country code: \${trimmedValue} (must be 2 uppercase letters, e.g., TW, US, JP)`,
    country2: `🌍 **Please select your country/region**

`,
    country3: `Country: \${filters.country}`,
    end: `End: \${endTime.toLocaleString('zh-TW')}

`,
    end2: `End: \${endTime.toLocaleString(`,
    female: `Female`,
    free: `Free`,
    gender: `👤 Gender: \${gender}
 {updatedUser.gender === 'male' ? '男' : '女'} \${gender}`,
    gender2: `Invalid gender value: \${trimmedValue} (must be male, female, or other)`,
    gender3: `👤 Gender: \${gender}
 {user.gender === 'male' ? '男' : '女'} \${gender}`,
    gender4: `👤 Gender: \${updatedUser.gender ===`,
    gender5: `👤 Gender: \${user.gender ===`,
    gender6: `Please select your gender now:

`,
    gender7: `Other genders`,
    help: `The MBTI personality test can help us find more suitable chat partners for you～

`,
    help2: `❓ View Help - /help`,
    help3: `• /help - View Help`,
    invite: `• Total number of invites: \${inviteStats?.total || 0}
`,
    invite2: `Invite code: \${user.invite_code}
 {user.invite_code || '未生成'} \${user.invite_code}`,
    invite3: `Invited by: \${user.invited_by}

 {user.invited_by || '無'} \${user.invited_by}`,
    loading: `✅ Loading......`,
    login: `Regular users will not be able to use the service; only administrators can log in.`,
    male: `Male`,
    mbti: `Invalid MBTI type: \${trimmedValue} (Must be one of: \${VALID_MBTI.join(', ')})`,
    mbti10: `✍️ Manually enter MBTI`,
    mbti11: `🧠 MBTI Menu`,
    mbti12: `Full MBTI Test`,
    mbti13: `Quick MBTI Test`,
    mbti2: `Your MBTI type is: **\${result.type}**

`,
    mbti3: `Current MBTI: **\${mbti}**
`,
    mbti4: `🧠 **Select MBTI Test Version**

`,
    mbti5: `🧠 **MBTI Personality Type Management**

`,
    mbti6: `⚙️ Advanced Filter (MBTI/Zodiac)`,
    mbti7: `• Manually modify your MBTI type`,
    mbti8: `Please select your MBTI type:`,
    mbti9: `🧠 Retake MBTI Test`,
    message: `\${typeEmoji} **\${ad.title}**
\${statusEmoji} Status: \${status}

📊 **Statistics**
• Impressions: \${stats.total_views}
• Clicks: \${stats.total_clicks}
• Click-Through Rate (CTR): \${stats.ctr}% {ad.is_enabled ? '啟用' : '停用'} \${status}`,
    message10: `/broadcast_filter gender=female,age=18-25,country=TW Hello everyone!
`,
    message11: `\${banHours} \${user.language_pref === 'en' ? 'hours' : '小時'}`,
    message12: `Time: \${new Date(b.created_at).toLocaleString('zh-TW')}

`,
    message13: `
There are \${pendingBroadcasts.results.length - 1} broadcasts pending in the queue
`,
    message14: `Progress: \${broadcast.sent_count}/\${broadcast.total_users}
`,
    message15: `\${days} \${user.language_pref === 'en' ? 'days' : '天'}`,
    message16: `Target: \${getBroadcastTargetName(broadcast.targetType)}
`,
    message17: `Status: \${maintenance.isActive ? '✅ Under Maintenance' : '❌ Not Enabled'}
 {maintenance.isActive ? '✅ 維護中' : '❌ 未啟用'} \${maintenance.isActive ? '✅ 維護中' : '❌ 未啟用'}`,
    message18: `🚫 Blocked URLs: 
\${urlCheck.blockedUrls?.map((url) =>`,
    message19: `• Last message: \${formatDate(stats.last_message_time)}
`,
    message2: `birthday = '2000-01-01',
 age = 25,
 zodiac_sign = 'Capricorn',
 anti_fraud_score = 100,
 terms_agreed = 1`,
    message20: `Time: \${formatDate(conv.last_message_time)}

`,
    message21: `Estimated Duration: \${maintenance.estimatedDuration} minutes
`,
    message22: `Use /broadcast_status \${broadcastId} to check progress.`,
    message23: `💡 Please long press the message you want to reply to, select 'Reply' from the menu that appears, and then enter your reply content in the chat box.`,
    message24: `📊 Sent today: \${usedToday + 1}/\${dailyLimit} messages`,
    message25: `/broadcast_filter zodiac=Scorpio Exclusive messages for Scorpio`,
    message26: `• Activated: \${inviteStats?.activated || 0}
`,
    message27: `• Pending: \${inviteStats?.pending || 0}

`,
    message28: `/maintenance_enable [maintenance message]

`,
    message29: `Progress: \${b.sent_count}/\${b.total_users}
`,
    message3: `Progress: \${broadcast.sentCount}/\${broadcast.totalUsers} (\${progress.percentage}%)
`,
    message30: `• Messages: \${messagesCount?.count || 0}

`,
    message31: `• Partner sent: \${stats.partner_messages} messages
`,
    message32: `Commander - Bold, imaginative, and strong-willed leaders who always find or create solutions.`,
    message33: `💡 Use /broadcast_status to view details`,
    message34: `🏷️ Interest tags: \${updatedUser.interests ||`,
    message35: `Governor - Compassionate, popular, and helpful individuals who are always eager to contribute to the community.`,
    message36: `/broadcast_filter 

`,
    message37: `**Message content:**
\${broadcastMessage}

`,
    message38: `• Total messages: \${stats.total_messages} messages
`,
    message39: `Campaigner - Passionate, creative, and social free spirits who always find a reason to smile.`,
    message4: `💡 Use /history \${formatIdentifier(conversations[0].identifier)} to view the full conversation

`,
    message40: `Remaining time: \${remaining.remainingText}
`,
    message41: `Performer - Spontaneous, energetic, and enthusiastic individuals who never make life boring.`,
    message42: `Total users: \${broadcast.total_users} people
`,
    message43: `• You sent: \${stats.user_messages} messages
`,
    message44: `Mediator - Poetic, kind altruists, always passionately working for justice causes.`,
    message45: `
Please use /broadcast_status later to check progress.`,
    message46: `Nickname: \${user.nickname}
 {user.nickname || '未設置'} \${user.nickname}`,
    message47: `• Rewards: \${stats.total_rewards}

`,
    message48: `Entrepreneur - Smart, energetic, and insightful individuals who truly enjoy living on the edge.`,
    message49: `🎁 Reward: +\${ad.reward_quota} permanent quotas`,
    message5: `Time: \${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
`,
    message50: `Time: \${new Date().toLocaleString(`,
    message51: `Use /broadcast_status to check the updated status.`,
    message52: `Target: \${broadcast.target_type}
`,
    message53: `Use /broadcast_status to check the updated record.`,
    message54: `• If you changed your Telegram profile picture, the system will automatically detect it
`,
    message55: `About \${Math.ceil(totalSeconds)} seconds`,
    message56: `Enabled by: \${maintenance.enabledBy}
`,
    message57: `Logician - Innovative inventors with an insatiable thirst for knowledge.`,
    message58: `Advocate - Quiet and mysterious, while being an inspiring and tireless idealist.`,
    message59: `Guardian - Highly focused and warm protectors, always ready to safeguard their loved ones.`,
    message6: `• Impressions: \${stats.total_views} | Clicks: \${stats.total_clicks} (\${stats.ctr}%)
`,
    message60: `Explorer - A flexible and charming artist, always ready to explore and experience new things.`,
    message61: `• Long press on the other party's message to reply /block to block this user
`,
    message62: `Please ensure you are replying to the message sent by the other party (marked with a # identifier).`,
    message63: `/broadcast_non_vip`,
    message64: `Create your first connection (long press message → select 'Reply')`,
    message65: `Message: \${messagePreview}
`,
    message66: `3. Are you more vigilant when encountering suspicious messages?

`,
    message67: `💡 VIP users can send 100 message bottles daily.`,
    message68: `/broadcast 

`,
    message69: `/broadcast_vip`,
    message7: `
• Verification attempts: \${stats.total_verified}
• Verification rate: \${stats.verification_rate}%`,
    message70: `Last message: \${preview}
`,
    message71: `Broadcast messages cannot exceed 4000 characters`,
    message72: `1️⃣ Long press on the other party's message
`,
    message73: `Please communicate with the other party using text messages.`,
    message74: `(No messages)

`,
    message75: `Get the latest news and events`,
    message76: `Broadcast messages cannot be empty`,
    message77: `(No message)`,
    message8: `
• Rewards distributed: \${stats.total_rewards}
• Reward rate: \${stats.reward_rate}%`,
    message9: `
• Remaining views: \${ad.max_views - ad.current_views}/\${ad.max_views}`,
    newUser: `New user`,
    next: `下一頁`,
    nickname: `💡 Please enter a simple nickname, do not include links like http:// or https://.

`,
    nickname10: `Please enter a new nickname: 

`,
    nickname11: `• Do not use the nickname to send ads`,
    nickname12: `📝 Edit nickname`,
    nickname13: `✍️ Customize nickname`,
    nickname2: `Great! Your nickname is: \${truncatedNickname}

`,
    nickname3: `📝 Nickname: \${updatedUser.nickname}
`,
    nickname4: `📝 Nickname: \${user.nickname}
`,
    nickname5: `• Nickname length limit is 36 characters
`,
    nickname6: `📝 **Edit Nickname**

`,
    nickname7: `✏️ Please select your nickname: 

`,
    nickname8: `✏️ Please enter your nickname: 

`,
    nickname9: `Please tell me your nickname (display name):`,
    no: `No`,
    none: `None`,
    notRegistered: `Not registered`,
    notSet: `Not set`,
    operationFailed: `❌ An error occurred`,
    pageInfo: `第 {current} / {total} 頁`,
    prev: `上一頁`,
    profile: `👤 View profile - /profile
`,
    profile2: `✏️ **Edit Profile**

`,
    profile3: `(You can also set it in your profile later)`,
    quota: `💡 Upgrade to VIP for more quotas (100 messages/day): /vip`,
    quota2: `• 💎 Upgrade to VIP (30 messages/day)`,
    quota3: `• 🎁 Invite friends (+1 quota per person)
`,
    quota4: `• ✨ Complete tasks (gain permanent quotas)
`,
    register: `

💡 This is a quick test (\${testInfo}), results are for reference only.
After registration, you can retake with /mbti.

`,
    register10: `🎉 Congratulations on completing registration!

`,
    register2: `

💡 This is a full test (\${testInfo}), results are more accurate.
After registration, you can retake with /mbti.

`,
    register3: `Registration steps: \${user.onboarding_step}
`,
    register4: `⏰ Registration process has timed out

Please use /start to restart registration.`,
    register5: `Or use: /dev_restart (automatic registration start)

`,
    register6: `💡 You can now restart the test registration process.

`,
    register7: `🔄 Re-register: /start
`,
    register8: `💡 After completing registration, you can: 
`,
    register9: `Registration process has been completed automatically.

`,
    report: `🚨 **Report inappropriate content** (#\${conversationIdentifier})

`,
    report2: `Multiple reports`,
    report3: `💡 This helps accurately specify whom to report.`,
    report4: `Please choose a reason for the report:`,
    selected: `Selected`,
    settings: `🧠 MBTI: \${updatedUser.mbti_result} (can retest) {updatedUser.mbti_result || '未設定'} \${updatedUser.mbti_result}`,
    settings10: `You have not set your MBTI type.

`,
    settings11: `Set Region`,
    settings12: `Not Set`,
    settings13: `Not Set`,
    settings14: `Not Set`,
    settings15: `Not Set`,
    settings16: `Not Set`,
    settings17: `Not Set`,
    settings18: `Not Set`,
    settings19: `Not Set`,
    settings2: `🏷️ Interest Tags: \${updatedUser.interests}
 {updatedUser.interests || '未設定'} \${updatedUser.interests}`,
    settings20: `Not Set`,
    settings21: `Not Set`,
    settings22: `Not Set`,
    settings23: `Not Set`,
    settings24: `Not Set`,
    settings25: `Not Set`,
    settings26: `Not Set`,
    settings27: `Not Set`,
    settings28: `Not Set`,
    settings29: `Not Set`,
    settings3: `🧠 MBTI: \${mbti} (Retake Test) \${mbti}`,
    settings30: `Not Set`,
    settings31: `Not Set`,
    settings32: `Not Set`,
    settings33: `Not Set`,
    settings34: `Not Set`,
    settings35: `Not Set`,
    settings4: `🏷️ Interest Tags: \${user.interests}
 {user.interests || '未設定'} \${user.interests}`,
    settings5: `📖 Personal Bio: \${updatedUser.bio}
 {updatedUser.bio || '未設定'} \${updatedUser.bio}`,
    settings6: `🌍 Location: \${updatedUser.city}
 {updatedUser.city || '未設定'} \${updatedUser.city}`,
    settings7: `📖 Personal Bio: \${user.bio}
 {user.bio || '未設定'} \${user.bio}`,
    settings8: `🌍 Location: \${user.city}
 {user.city || '未設定'} \${user.city}`,
    settings9: `You can retake the test at any time using the /mbti command.`,
    short: `💡 You can: 
`,
    short10: `When working, you prefer:`,
    short100: `Emotions and Stories`,
    short101: `Efficiency and Results`,
    short102: `Consensus and Unity`,
    short103: `Freedom and Flexibility`,
    short104: `Retain Choice`,
    short105: `Add LINE`,
    short106: `Test Results`,
    short107: `Listen First, Speak Later`,
    short108: `Small and Intimate`,
    short109: `Teamwork`,
    short11: `When reading, you prefer:`,
    short110: `Independent Work`,
    short111: `Think While Speaking`,
    short112: `Digest Alone`,
    short113: `Practical Application`,
    short114: `Innovative Ideas`,
    short115: `New Attempts`,
    short116: `Is it reasonable?`,
    short117: `Is it beneficial?`,
    short118: `Stick to Principles`,
    short119: `Maintain Relationships`,
    short12: `In work, you value more:`,
    short120: `Fair and Decisive`,
    short121: `Thoughtful and Caring`,
    short122: `Neat and Organized`,
    short123: `Carefree`,
    short124: `Quick decision`,
    short125: `Feeling uneasy`,
    short126: `Feeling excited`,
    short127: `Visit link`,
    short128: `Subscribe to channel`,
    short129: `Bank account`,
    short13: `When planning for the future, you will:`,
    short130: `Note:`,
    short131: `Sending`,
    short132: `Credit card`,
    short133: `Bitcoin`,
    short134: `Add WeChat`,
    short135: `Add QQ`,
    short136: `Mobile number`,
    short137: `Contact me`,
    short138: `One-night stand`,
    short139: `Sex services`,
    short14: `Analyze problems and provide suggestions`,
    short140: `Scam money`,
    short141: `Invest`,
    short142: `Make Money`,
    short143: `Remittance`,
    short144: `Transfer`,
    short145: `Password`,
    short146: `Pyramid Scheme`,
    short147: `Finance`,
    short148: `Wealth Management`,
    short149: `Stocks`,
    short15: `When facing change, you usually:`,
    short150: `Futures`,
    short151: `Forex`,
    short152: `Phone`,
    short153: `Casual Sex`,
    short154: `Compensated Dating`,
    short155: `Suicide`,
    short156: `Jumping Off the Building`,
    short157: `Violence`,
    short158: `Not Set`,
    short159: `Not Generated`,
    short16: `Thank you for your support! ❤️`,
    short160: `Test User`,
    short161: `Test User`,
    short162: `Results are more accurate`,
    short163: `Need to pay attention`,
    short164: `Join the group`,
    short165: `View details`,
    short17: `Let other users know more about you`,
    short18: `Is this correct?

`,
    short19: `🗑️ Delete draft`,
    short2: `🌈 Anyone can`,
    short20: `🏷️ Edit interests`,
    short21: `Please select the test version:`,
    short22: `Your working style is:`,
    short23: `Have a clear deadline`,
    short24: `Will become familiar soon`,
    short25: `Need time to get accustomed`,
    short26: `When under stress, you will:`,
    short27: `Make a list and purchase as planned`,
    short28: `Stuck (retrying)`,
    short29: `✏️ Edit content`,
    short3: `✏️ Continue editing data`,
    short30: `📖 Edit profile`,
    short31: `🌍 Edit region`,
    short32: `💝 Match preferences`,
    short33: `Updating...`,
    short34: `🔞 Adult content`,
    short35: `Initiate conversations with others`,
    short36: `Wait for others to find me`,
    short37: `What's your weekend preference:`,
    short38: `Real experiences and facts`,
    short39: `Step-by-step approach`,
    short4: `📝 Retake the test`,
    short40: `Explore innovative ways`,
    short41: `Logical and objective analysis`,
    short42: `Emotional and interpersonal harmony`,
    short43: `Plan and prepare in advance`,
    short44: `Adapt and be flexible`,
    short45: `Keep options open`,
    short46: `Use metaphors and analogies`,
    short47: `Listen and provide comfort`,
    short48: `Your room usually:`,
    short49: `When shopping, you:`,
    short5: `📝 Take a quick quiz`,
    short50: `Help others understand you better`,
    short51: `Find friends in the same city`,
    short52: `Check out others' stories`,
    short53: `At least 20 characters`,
    short54: `: Active matching,`,
    short55: `Female (default)`,
    short56: `Male (default)`,
    short57: `Results for reference only`,
    short58: `You can:
`,
    short59: `Hang out with friends`,
    short6: `At least one filter is required`,
    short60: `Rest alone at home`,
    short61: `Feel energized`,
    short62: `Feel the need to rest`,
    short63: `Intuition and possibilities`,
    short64: `Focus on specific details`,
    short65: `Focus on the overall concept`,
    short66: `Point out issues directly`,
    short67: `Consider the feelings of others`,
    short68: `Create a detailed itinerary`,
    short69: `Explore freely`,
    short7: `New user******`,
    short70: `Express opinions actively`,
    short71: `Your friend circle:`,
    short72: `Broad but not deep`,
    short73: `Future and possibilities`,
    short74: `Use specific examples`,
    short75: `Proven methods`,
    short76: `Based on real conditions`,
    short77: `Imagine various possibilities`,
    short78: `Regularity and structure`,
    short79: `Include sensitive vocabulary`,
    short8: `When criticizing others, you will:`,
    short80: `Fill in interest tags`,
    short81: `Improve self-introduction`,
    short82: `Join the official channel`,
    short83: `Share your story`,
    short84: `👨 Male`,
    short85: `👩 Female`,
    short86: `👨 Man`,
    short87: `👩 Woman`,
    short88: `Review time:`,
    short89: `❓ Not sure`,
    short9: `When traveling, you prefer to:`,
    short90: `What you value more:`,
    short91: `Fairness and justice`,
    short92: `Compassion and understanding`,
    short93: `Think before you speak`,
    short94: `Chat with friends`,
    short95: `Practical guide`,
    short96: `Theories and concepts`,
    short97: `Now and the past`,
    short98: `Who you trust more:`,
    short99: `Facts and data`,
    start: `Start time: \${new Date(maintenance.startTime).toLocaleString('zh-TW')}
`,
    start10: `Get started →`,
    start2: `Start time: \${new Date(broadcast.startedAt).toLocaleString('zh-TW')}
`,
    start3: `Start: \${startTime.toLocaleString('zh-TW')}
`,
    start4: `Start time: \${broadcast.started_at}

`,
    start5: `Start: \${startTime.toLocaleString(`,
    start6: `🎉 **Ready! Start making friends now～**

`,
    start7: `• Use /throw to restart
`,
    start8: `📺 Start watching ads`,
    start9: `Begin your friend-making journey`,
    stats: `💡 Use /ad_stats {id} to see detailed statistics`,
    stats2: `• /stats - View statistics

`,
    stats3: `📊 View statistics - /stats
`,
    stats4: `📊 **Official Ad Statistics**

`,
    stats5: `Invitation statistics:
`,
    stats6: `Statistics:
`,
    success: `Purchase successful`,
    systemError: `❌ System error occurred`,
    task: `🎉 Congratulations on completing the task: Join the official channel!

`,
    task2: `[📋 View Task Center] → /tasks`,
    task3: `• /tasks - View Task Center
`,
    task4: `💡 Use /tasks to see more tasks`,
    task5: `When handling tasks, you will:`,
    task6: `📋 View tasks`,
    text: `Goal: \${broadcast.target_type}
`,
    text10: `📖 Profile: \${updatedUser.bio ||`,
    text100: `💡 Please enter content in the input box below`,
    text101: `This may take some time, please wait.`,
    text102: `You can use the following commands at any time: 
`,
    text103: `🛠️ System maintenance notification

`,
    text104: `🛠️ Maintenance mode status

`,
    text105: `When evaluating an idea, you first consider:`,
    text106: `⏱️ About 2-3 minutes
`,
    text107: `⏱️ About 5-8 minutes
`,
    text108: `📚 I want to learn more about safety knowledge`,
    text109: `Send immediately (about 1-2 seconds)`,
    text11: `\${daysAgo} days ago`,
    text110: `2️⃣ Select 'Reply'
`,
    text111: `**Filter format:**
`,
    text112: `• Minimum 5 characters
`,
    text113: `• Cannot contain URLs
`,
    text114: `Please enter your region: 

`,
    text115: `• You can modify this setting at any time`,
    text116: `• Up to 5 tags
`,
    text117: `📋 Quick version (12 questions)`,
    text118: `📚 Full version (36 questions)`,
    text119: `• Take a more detailed test
`,
    text12: `General Manager - An exceptional manager, unmatched in handling affairs or personnel.`,
    text120: `💡 **Tip:**
`,
    text121: `When learning new things, you prefer:`,
    text122: `**Steps to follow:**
`,
    text123: `🇺🇳 Use the United Nations flag`,
    text124: `Do you want to send this draft directly?`,
    text125: `This may take a few seconds.`,
    text126: `
Thank you for your patience!`,
    text127: `Maintenance duration is at least 5 minutes`,
    text128: `In social settings, you usually:`,
    text129: `When solving problems, you rely more on:`,
    text13: `💡 This will be displayed on your profile card to help other users understand you better.
`,
    text130: `In a team, you tend to:`,
    text131: `When thinking about problems, you tend to:`,
    text132: `When describing things, you tend to:`,
    text133: `When a friend confides in you, you:`,
    text134: `During team decision-making, you focus more on:`,
    text135: `You believe a good leader should:`,
    text136: `Goal: All users
`,
    text137: `✏️ Please enter new content`,
    text138: `💰 Fraud / Phishing`,
    text139: `😡 Harassment / Abuse`,
    text14: `Language: \${user.language_pref}
`,
    text140: `After attending a gathering, you usually:`,
    text141: `When making decisions, you value more:`,
    text142: `When meeting new friends, you:`,
    text143: `In conflicts, you tend to:`,
    text144: `You are more easily persuaded by:`,
    text145: `Your preferred lifestyle:`,
    text146: `When making decisions, you tend to:`,
    text147: `Casually browsing and buying if you like it`,
    text148: `)} expiring.

`,
    text149: `📋 Legal documents are provided in English only.`,
    text15: `🌍 Region: \${updatedUser.city ||`,
    text150: `📋 Legal documents are available in English version only.`,
    text16: `

✅ Verification needed: Click the 'Verify' button after joining the group/channel`,
    text17: `Target user count: \${userIds.length}

`,
    text18: `Estimated time: \${estimatedTime}

`,
    text19: `/broadcast_cleanup confirm`,
    text2: `Please use /broadcast_filter to view the correct format.`,
    text20: `💝 Matching preference: \${matchPrefText}
`,
    text21: `Debater - A smart and curious thinker, unable to resist intellectual challenges.`,
    text22: `Write down your feelings or thoughts, and the system will help you find the right person

`,
    text23: `Logistics Specialist - A practical and fact-focused individual with unquestionable reliability.`,
    text24: `Connoisseur - A bold and practical experimenter, skilled in using various tools.`,
    text25: `💡 This is a one-time reward that will be added to today's quota after claiming.`,
    text26: `Number of matching users: \${totalUsers} people
`,
    text27: `• Default is opposite gender (male seeking female, female seeking male)
`,
    text28: `Status: \${progress.status}
`,
    text29: `\${daysAgo} hours ago`,
    text3: `**Filter conditions:**
\${filtersDesc}

`,
    text30: `About \${remainingMinutes} minutes`,
    text31: `About \${hours} hours \${mins} minutes`,
    text32: `Maintenance duration cannot exceed 24 hours (1440 minutes)`,
    text33: `User count: \${totalUsers} people
`,
    text34: `Target: \${b.target_type}
`,
    text35: `Filter criteria: \${filtersDesc}
`,
    text36: `• At least 4 characters, up to 36 characters
`,
    text37: `🇺🇳 If you can't find it, you can choose the 'United Nations flag'`,
    text38: `📖 Personal bio: \${user.bio ||`,
    text39: `Please enter your interest tags (separated by commas):

`,
    text4: `/maintenance_enable 60 System upgrade maintenance`,
    text40: `• For example: Music, Movies, Travel, Food
`,
    text41: `Service has resumed normally, thank you for your patience!

`,
    text42: `🌍 Location: \${user.city ||`,
    text43: `Source: \${sourceText}

`,
    text44: `Unknown filter: \${trimmedKey}`,
    text45: `The system is undergoing maintenance and is temporarily unavailable.

`,
    text46: `We infer you are from: 
`,
    text47: `• Each tag can have a maximum of 20 characters

`,
    text48: `Duration: \${duration} minutes
`,
    text49: `1. Are you aware of the safety risks of online dating?
`,
    text5: `👋 Welcome back, \${user.nickname}!

`,
    text50: `2. Will you protect your personal information?
`,
    text51: `Great! Now please upload your profile picture: 

`,
    text52: `🌊 **What is XunNi?**
`,
    text53: `🎉 Detected that you have joined the official channel!

`,
    text54: `💡 This allows you to accurately specify whom to block.`,
    text55: `Status: \${statusText}
`,
    text56: `💡 You can now directly test core features: 
`,
    text57: `What kind of chat partner are you looking for?

`,
    text58: `• Introduce your interests, personality, or anything you'd like to share
`,
    text59: `🏷️ **Edit Interest Tags**

`,
    text6: `Architect - An imaginative and strategic thinker who plans everything meticulously.`,
    text60: `For safety, only links from the following domains are allowed: 
`,
    text61: `📋 **Quick Version (12 Questions)**
`,
    text62: `📚 **Full Version (36 Questions)**
`,
    text63: `• Avatar will automatically update every 7 days
`,
    text64: `3️⃣ Enter /report

`,
    text65: `3️⃣ Enter /block

`,
    text66: `Status: \${b.status}
`,
    text67: `Will no longer be automatically processed or resent

`,
    text68: `📖 **Edit Profile**

`,
    text69: `💝 **Set Matching Preferences**

`,
    text7: `Protagonist - A charismatic and inspiring leader who captivates the audience.`,
    text70: `💬 **Your Chat History**

`,
    text71: `• You can also manually refresh using this command at any time`,
    text72: `📊 **Daily Data Analysis Report**
`,
    text73: `Your account has been restored to a free membership.

`,
    text74: `💡 This will be displayed on your profile card
`,
    text75: `🔧 Developer Mode: User Information

`,
    text76: `• Directly enter new content to replace the draft
`,
    text77: `• Links, images, and multimedia are not allowed
`,
    text78: `• Up to 18 characters will be displayed
`,
    text79: `• The other party can display up to 18 characters
`,
    text8: `/broadcast system will undergo maintenance tonight at 22:00`,
    text80: `💡 Please remove these links and resend.`,
    text81: `🔄 Refreshing profile picture...

`,
    text82: `• Free users see a blurred profile picture
`,
    text83: `💬 **How to Become Friends?**
`,
    text84: `Invalid filter format: \${pair}`,
    text85: `All your data has been deleted.

`,
    text86: `📝 **Draft Content**

`,
    text87: `🌍 **Edit Location**

`,
    text88: `• For example: Taipei, Hong Kong, Tokyo
`,
    text89: `• Up to 50 characters

`,
    text9: `🏷️ Interest tags: \${user.interests ||`,
    text90: `About \${minutes} minutes`,
    text91: `Write your story (at least 20 characters)`,
    text92: `Searching for matching users...`,
    text93: `• Up to 250 characters
`,
    text94: `• Do not include personal contact information
`,
    text95: `Please select the item to edit: 

`,
    text96: `Please enter your personal profile: 

`,
    text97: `• Up to 200 characters
`,
    text98: `• Avoid including contact information

`,
    text99: `All features are now fully functional.`,
    throw: `⏰ The message bottle throwing process has timed out

Please use /throw to restart.`,
    throw2: `Message bottle throwing process`,
    uncertain: `❓ Not sure`,
    unknownOption: `⚠️ Unknown option`,
    unlimited: `No restrictions`,
    userNotFound: `❌ User does not exist`,
    vip: `Your VIP subscription expired on \${expireDate} .

`,
    vip10: `😢 **VIP subscription has expired**

`,
    vip11: `• Upgrading to VIP will automatically refresh historical posts`,
    vip12: `⭐ Upgrade to VIP - /vip
`,
    vip13: `💎 VIP users do not need to watch ads`,
    vip14: `Target: Non-VIP users
`,
    vip15: `Target: VIP users
`,
    vip16: `Non-VIP users`,
    vip17: `VIP users`,
    vip2: `Your VIP subscription will expire on \${new Date(user.vip_expire_at).toLocaleDateString(`,
    vip3: `/broadcast_filter vip=true,mbti=INTJ VIP exclusive event notification
`,
    vip4: `For each person invited, the daily quota increases permanently by +1 (free for a maximum of 10 people, VIP up to 100 people)`,
    vip5: `VIP: \${user.is_vip ? 'Yes' : 'No'}
 {user.is_vip ? '是' : '否'} \${user.is_vip ? '是' : '否'}`,
    vip6: `💡 Upgrade to VIP for advanced filtering (MBTI/Zodiac): /vip`,
    vip7: `💡 You can re-subscribe to VIP anytime: /vip

`,
    vip8: `💡 Blood type can be used for VIP blood type matching feature

`,
    vip9: `• VIP users can see clear profile pictures of others
`,
    yes: `Yes`,
    zodiac: `Invalid Zodiac: \${trimmedValue} (must be one of: \${VALID_ZODIACS.join(', ')}）`,
  },
  conversation: {
    age: `🎂 Age range: \${ageRange} years old
`,
    anonymousCardHint: `💡 This is an anonymous profile card and will not display the true identity information of others.`,
    backToMenuCommand: `🏠 Return to main menu: /menu`,
    ban: `• Multiple reports may lead to a ban
`,
    blockConfirmButton: `✅ Confirm block`,
    blockConfirmMessage: `After blocking:
• The other party will not be able to send you messages
• You will no longer be matched
• This conversation will end immediately

💡 This will not report the other party, it just means you don't want to chat anymore.`,
    blockConfirmTitle: `🚫 **Are you sure you want to block this user?**`,
    blockSuccessMessage: `The other party has been blocked, and you will no longer be matched.

💡 Want to start a new conversation?
• Use /catch to pick up a new message bottle`,
    blockSuccessNewConversation: `💬 **Conversation Ended**

The other party has ended this conversation.

💡 Want to start a new conversation?
• Use /catch to pick up a new message bottle`,
    blockSuccessTitle: `✅ **User Blocked**`,
    blocked: `✅ Blocked`,
    bloodType: `🩸 Blood Type: \${partnerInfo.bloodType}
`,
    bloodType2: `🩸 Blood Type: \${bloodTypeText}
`,
    bottle: `Use /catch to pick up a message bottle and start chatting!

`,
    bottle2: `• Use /catch to pick up a new message bottle`,
    cancelButton: `❌ Cancel`,
    cancelSuccess: `Cancelled`,
    conversation: `💬 Conversation History with #\${identifier} (Page \${postNumber})

`,
    conversation10: `Currently, there are no conversations.

`,
    conversation11: `• This conversation will end immediately
`,
    conversation2: `💬 **My Conversation List** (\${conversations.length})

`,
    conversation3: `💡 Click the 'Reply' button on the other party's message to continue the conversation
`,
    conversation4: `💬 **Conversation Ended**

`,
    conversation5: `💬 **My Conversations**

`,
    conversation6: `💡 Want to start a new conversation?
`,
    conversation7: `• This conversation will end immediately

`,
    conversation8: `The other party has ended this conversation.

`,
    conversation9: `💡 This is the conversation history
`,
    conversationEnded: `❌ This conversation has ended.

Use /catch to find a new message bottle and start a new conversation.`,
    conversationInfoError: `[Translation needed from zh-TW.ts]`,
    editProfileCommand: `✏️ Edit Profile: /edit_profile`,
    endedMessage: `The other party has ended this conversation.

💡 Want to start a new conversation?
• Use /catch to pick up a new message bottle`,
    endedNewConversation: `💬 **Conversation Ended**

The other party has ended this conversation.

💡 Want to start a new conversation?
• Use /catch to pick up a new message bottle`,
    endedTitle: `💬 **Conversation Ended**`,
    gender: `👤 Gender: \${gender}
`,
    mediaRestriction: `⚠️ **Sending images, videos, or multimedia is not allowed**

💡 To protect privacy and security, only plain text messages are permitted in conversations.

Please communicate with text messages.`,
    message: `💫 Match Score: \${score} points
`,
    message10: `conv_profile_\${conversationId}`,
    message11: `• Last Message: \${lastMessageTime}

`,
    message12: `📊 Total Messages: \${totalMessages} messages
`,
    message13: `💬 Reply directly by pressing /reply to respond in chat
`,
    message14: `• The other party can no longer send you messages
`,
    message2: `
📜 Continue viewing: #\${identifier}-H\${newPostNumber}`,
    message3: `📅 Last Updated: \${formatDateTime(new Date())}

`,
    message4: `[\${timeStr}] From: 
\${messageContent}

`,
    message5: `conv_report_confirm_\${conversationId}`,
    message6: `conv_block_confirm_\${conversationId}`,
    message7: `• Message Count: \${conv.message_count} messages
`,
    message77: `💬 Use /reply to respond to the message`,
    message8: `🏷️ Interests: \${otherUser.interests}
`,
    message9: `💬 New message from #\${identifier}: 

`,
    nickname: `📝 Nickname: \${partnerInfo.maskedNickname}
`,
    nickname2: `📝 Nickname: \${displayNickname}
`,
    noHistory: `💬 You have no conversation records yet

Go throw a message bottle to meet new friends! /throw

🏠 Return to Main Menu: /menu`,
    profile: `✏️ Edit Profile：/edit_profile
`,
    profileCardTitle: `👤 **Other User's Profile Card**`,
    replyButton: `💬 Reply to Message`,
    replyConversation: `💬 Reply to conversation {identifier}`,
    replyHint: `💡 Please enter your content in the box below`,
    replyMethod1: `1️⃣ Click the button below '💬 Reply to Message'`,
    replyMethod2: `2️⃣ Long press this message, select 'Reply', then enter your content`,
    replyMethodsTitle: `💡 **Two ways to reply**：`,
    report: `🚨 **Are you sure you want to report this user?**

`,
    report2: `💡 This will not report the other party, it's just that you don't want to chat anymore.`,
    report3: `Thank you for your report, we will review it as soon as possible.

`,
    report4: `After Report: 
`,
    reportConfirmButton: `✅ Confirm Report`,
    reportConfirmMessage: `After Report: 
• We will review this user's behavior
• Multiple reports will lead to banning
• This conversation will be ended immediately
• You will not be matched with this user again within 24 hours

💡 Please ensure that the other party has indeed exhibited inappropriate behavior.`,
    reportConfirmTitle: `🚨 **Are you sure you want to report this user?**`,
    reportSuccessMessage: `Thank you for your report, we will review it as soon as possible.

💡 Want to start a new conversation?
• Use /catch to pick up a new message bottle`,
    reportSuccessNewConversation: `💬 **Conversation Ended**

The other party has ended this conversation.

💡 Want to start a new conversation?
• Use /catch to pick up a new message bottle`,
    reportSuccessTitle: `✅ **This user has been reported**`,
    reported: `✅ Reported`,
    separator: `━━━━━━━━━━━━━━━━`,
    settings: `🧠 MBTI：\${otherUser.mbti_result}
 {otherUser.mbti_result || '未設定'} \${otherUser.mbti_result}`,
    settings2: `Not Set`,
    settings3: `Not set`,
    settings4: `Not set`,
    settings5: `Not set`,
    short: `Blocked after:
`,
    short2: `Unknown user`,
    short3: `Just now`,
    stats: `📊 Use /stats to see detailed statistics
`,
    text: `💡 This is an anonymous data card and will not reveal the other party's true identity information.

`,
    text10: `💎 Use /vip to learn more

`,
    text11: `👤 **Other party's data card**

`,
    text12: `\${diffHours} hours ago`,
    text13: `💡 Please ensure that the other party has indeed engaged in improper behavior.`,
    text14: `\${diffMins} minutes ago`,
    text15: `• We will review this user's behavior
`,
    text16: `💎 Use /vip to learn more`,
    text17: `\${diffDays} days ago`,
    text18: `• You will no longer be matched
`,
    text19: `👤 Other party's information:
`,
    text2: `📜 View history records: #\${identifier}
`,
    text3: `🗣️ Language: \${languageLabel}
`,
    text4: `🌍 Region: \${otherUser.city}
`,
    text5: `📖 Introduction: \${otherUser.bio}
`,
    text6: `conv_reply_\${identifier}`,
    text7: `🚫 **Are you sure you want to block this user?**

`,
    text8: `The other user has been blocked, and you will no longer be matched.

`,
    text9: `• You will not be matched with this user again for 24 hours

`,
    vip: `
🔒 Upgrade to VIP to unlock clearer profile picture of the other user
`,
    vip2: `🔒 Upgrade to VIP to unlock clearer profile picture of the other user
`,
    vipLearnMore: `💎 Use /vip to learn more`,
    vipUnlockAvatar: `🔒 Upgrade to VIP to unlock clearer profile picture of the other user`,
    zodiac: `⭐ Zodiac: \${partnerInfo.zodiac}
`,
    zodiac2: `⭐ Zodiac: \${zodiacLabel}
`,
  },
  conversationHistory: {
    backToMenu: `🏠 Return to main menu: /menu`,
    bloodType: `🩸 Blood type: \${bloodType}`,
    continueView: `📜 Continue Viewing: #\${identifier}-H\${postNumber}`,
    historyNote: `💡 This is the conversation history`,
    lastUpdated: `📅 Last updated: \${time}`,
    matchScore: `💫 Compatibility: \${score} points`,
    mbti: `🧠 MBTI: \${mbti}`,
    messageEntry: `[\${time}] Other party:
\${content}`,
    newMessage: `💬 New message from #\${identifier}:`,
    nickname: `📝 Nickname: \${nickname}`,
    other: `The other user`,
    partnerInfo: `👤 Other user information:`,
    replyButton: `💬 Reply message`,
    replyHint: `💬 Press /reply to reply to the message chat`,
    title: `💬 Conversation history with #\${identifier} (Page \${postNumber})`,
    totalMessages: `📊 Total messages: \${count}`,
    viewAllConversations: `📊 View all conversations`,
    viewHistory: `📜 View History: #\${identifier}`,
    viewProfileCard: `👤 View other user profile card`,
    vipLearnMore: `💎 Use /vip to learn more`,
    vipUnlockAvatar: `🔒 Upgrade to VIP to unlock clear profile pictures`,
    you: `You`,
    zodiac: `⭐ Zodiac: \${zodiac}`,
  },
  countries: {
    ae: `United Arab Emirates`,
    al: `Albania`,
    am: `Armenia`,
    ar: `Argentina`,
    at: `Austria`,
    au: `Australia`,
    az: `Azerbaijan`,
    ba: `Bosnia`,
    bb: `Barbados`,
    bd: `Bangladesh`,
    be: `Belgium`,
    bg: `Bulgaria`,
    bh: `Bahrain`,
    bo: `Bolivia`,
    br: `Brazil`,
    ca: `Canada`,
    ch: `Switzerland`,
    ci: `Ivory Coast`,
    cl: `Chile`,
    cm: `Cameroon`,
    cn: `China`,
    co: `Colombia`,
    cr: `Costa Rica`,
    cu: `Cuba`,
    cz: `Czech Republic`,
    de: `Germany`,
    dk: `Denmark`,
    do: `Dominican Republic`,
    dz: `Algeria`,
    ec: `Ecuador`,
    ee: `Estonia`,
    eg: `Egypt`,
    es: `Spain`,
    et: `Ethiopia`,
    fi: `Finland`,
    fr: `France`,
    gb: `United Kingdom`,
    ge: `Georgia`,
    gh: `Ghana`,
    gr: `Greece`,
    gt: `Guatemala`,
    hk: `Hong Kong`,
    hn: `Honduras`,
    hr: `Croatia`,
    hu: `Hungary`,
    id: `Indonesia`,
    ie: `Ireland`,
    il: `Israel`,
    in: `India`,
    iq: `Iraq`,
    ir: `Iran`,
    is: `Iceland`,
    it: `Italy`,
    jm: `Jamaica`,
    jo: `Jordan`,
    jp: `Japan`,
    ke: `Kenya`,
    kh: `Cambodia`,
    kr: `South Korea`,
    kw: `Kuwait`,
    kz: `Kazakhstan`,
    la: `Laos`,
    lb: `Lebanon`,
    lk: `Sri Lanka`,
    lt: `Lithuania`,
    lv: `Latvia`,
    ly: `Libya`,
    ma: `Morocco`,
    mk: `North Macedonia`,
    mm: `Myanmar`,
    mn: `Mongolia`,
    mo: `Macau`,
    mt: `Malta`,
    mx: `Mexico`,
    my: `Malaysia`,
    ng: `Nigeria`,
    ni: `Nicaragua`,
    nl: `Netherlands`,
    no: `Norway`,
    np: `Nepal`,
    nz: `New Zealand`,
    om: `Oman`,
    pa: `Panama`,
    pe: `Peru`,
    ph: `Philippines`,
    pk: `Pakistan`,
    pl: `Poland`,
    pt: `Portugal`,
    py: `Paraguay`,
    qa: `Qatar`,
    ro: `Romania`,
    rs: `Serbia`,
    ru: `Russia`,
    rw: `Rwanda`,
    sa: `Saudi Arabia`,
    sd: `Sudan`,
    se: `Sweden`,
    sg: `Singapore`,
    si: `Slovenia`,
    sk: `Slovakia`,
    sn: `Senegal`,
    sv: `El Salvador`,
    sy: `Syria`,
    th: `Thailand`,
    tn: `Tunisia`,
    tr: `Turkey`,
    tt: `Trinidad`,
    tw: `Taiwan`,
    tz: `Tanzania`,
    ua: `Ukraine`,
    ug: `Uganda`,
    un: `United Nations`,
    us: `United States`,
    uy: `Uruguay`,
    uz: `Uzbekistan`,
    ve: `Venezuela`,
    vn: `Vietnam`,
    ye: `Yemen`,
    za: `South Africa`,
    zw: `Zimbabwe`,
  },
  country: {
    buttonAU: `🇦🇺 Australia`,
    buttonCA: `🇨🇦 Canada`,
    buttonCN: `🇨🇳 China`,
    buttonDE: `🇩🇪 Germany`,
    buttonFR: `🇫🇷 France`,
    buttonGB: `🇬🇧 United Kingdom`,
    buttonHK: `🇭🇰 Hong Kong`,
    buttonJP: `🇯🇵 Japan`,
    buttonKR: `🇰🇷 South Korea`,
    buttonMY: `🇲🇾 Malaysia`,
    buttonNZ: `🇳🇿 New Zealand`,
    buttonSG: `🇸🇬 Singapore`,
    buttonTH: `🇹🇭 Thailand`,
    buttonTW: `🇹🇼 Taiwan`,
    buttonUS: `🇺🇸 USA`,
    confirmButton: `✅ Correct`,
    confirmDetected: `Based on your language settings, we estimate you are from: 
`,
    confirmFailed: `❌ Confirmation failed`,
    confirmHint: `💡 This will be displayed on your profile card to help other users get to know you better. 
`,
    confirmQuestion: `Is this correct? 

`,
    confirmReward: `🎉 Confirming will earn you +1 message bottle reward!`,
    confirmTitle: `🌍 **Confirm your country/region** 

`,
    confirmed: `✅ Confirmed!`,
    notCorrectButton: `❌ Incorrect`,
    selectHint: `💡 This will be displayed on your profile card 
`,
    selectTitle: `🌍 **Please select your country/region** 

`,
    selectUnFlagHint: `🇺🇳 If you can't find it, you can select 'United Nations Flag'`,
    setFailed: `❌ Setup failed`,
    setTo: `✅ Set as {flag} {country}`,
    unFlagButton: `🇺🇳 United Nations Flag`,
    useUnFlagButton: `🇺🇳 Use United Nations Flag`,
  },
  dailyReports: {
    header: `📊 **Daily Data Analysis Report**`,
    time: `Time: \${time}`,
  },
  dev: {
    autoCompleted: `Registration process has been completed automatically. 

`,
    bottles: `• Message Bottles: {count}
`,
    catchCommand: `• /catch - Catch message bottle
`,
    conversations: `• Conversations: {count}
`,
    dataReset: `✅ Development mode: Data has been reset

All your data has been deleted.

💡 You can now restart the registration process for testing.

🔄 Re-register: /start
or use: /dev_restart (automatic registration start)

⚠️ Note: This feature is only available in the Staging environment.`,
    getUserInfoFailed: `❌ Failed to retrieve information`,
    inviteActivated: `• Activated: {count}
`,
    inviteCode: `Invitation Code: {code}
`,
    invitePending: `• Pending Activation: {count}

`,
    inviteStats: `Invitation statistics:
`,
    inviteTotal: `• Total Invitation Records: {count}
`,
    invitedBy: `Invited by: {invitedBy}

`,
    language: `Language: {lang}
`,
    messages: `• Messages: {count}

`,
    nickname: `Nickname: {nickname}
`,
    no: `No`,
    none: `None`,
    notAvailableInProduction: `❌ This command is not available in production.

This command is not available in production.`,
    notGenerated: `Not generated`,
    notSet: `Not set`,
    onboardingStep: `Registration Steps: {step}
`,
    resetFailed: `❌ Reset failed: {error}

Please try again later.`,
    skipFailed: `❌ Skip failed`,
    skipRegistration: `✅ Development mode: Registration skipped

`,
    stagingOnly: `⚠️ This feature is only available in the Staging environment.`,
    stats: `Statistics:
`,
    statsCommand: `• /stats - View statistics

`,
    successfulInvites: `• Successful Invites: {count}
`,
    telegramId: `Telegram ID: {id}
`,
    testCoreFeatures: `💡 You can directly test core features now: 
`,
    testUser: `Test user`,
    throwCommand: `• /throw - Throw message bottle
`,
    userInfo: `🔧 Development mode: User information

`,
    userNotFound: `❌ User does not exist`,
    vip: `VIP: {status}
`,
    yes: `Yes`,
  },
  draft: {
    contentHint: `💡 You can:
• Directly enter new content to replace the draft
• Use /throw to start over
• Send the draft content to throw a message bottle`,
    contentTitle: `📝 **Draft Content**

`,
    continueEditing: `✅ Continue editing the draft`,
    deleteButton: `🗑️ Delete draft`,
    deleted: `✅ Draft has been deleted`,
    editButton: `✏️ Edit content`,
    editInput: `✏️ Please enter new message bottle content:

💡 Tips:
• At least 5 characters
• Up to 250 characters
• No links, images, or multimedia allowed
• Do not include personal contact information
• Friendly and respectful content is more likely to be picked up!`,
    editPrompt: `✏️ Please enter new content`,
    newBottle: `✅ Start a new message bottle`,
    notFound: `⚠️ Draft does not exist or has expired`,
    sendButton: `✅ Sending draft`,
    sendQuestion: `Do you want to send this draft directly?`,
    sending: `✅ Sending...`,
    targetGender: `What kind of chat partner are you looking for?

`,
    targetGenderHint: `💡 Upgrade to VIP for advanced filtering (MBTI/Zodiac): /vip`,
    throwBottle: `🍾 Throw message bottle

What kind of chat partner are you looking for?`,
    age: {
      daysAgo: `\\\${days} days ago`,
      hoursAgo: `\\\${hours} hours ago`,
      justNow: `Just now`,
    },
  },
  edit_profile: {
    nickname: `👤 Nickname: \\\\\\\\\\\\\\\${ownerMaskedNickname}`,
    short19: `✏️ Edit Profile`,
  },
  error: {
    ad: `❌ This ad does not require verification`,
    ad2: `❌ No available ads`,
    ad3: `❌ Unable to claim this ad`,
    ad4: `❌ Ad does not exist`,
    ad5: `❌ Ad ID must be a number`,
    ad6: `❌ You do not have permission to view advertisement data.`,
    admin: `❌ A system error has occurred, please try again later.

If the problem persists, please contact the administrator.`,
    admin2: `❌ **Insufficient Permissions**

This command is for super administrators only.`,
    admin3: `❌ This user is already a super administrator, no need to add.`,
    admin4: `❌ Only super administrators can use this command.`,
    admin5: `❌ This user is already an administrator.`,
    admin6: `❌ Cannot remove super administrator.`,
    admin7: `❌ This user is not an administrator.`,
    appeal: `❌ Please provide the appeal ID

Usage: /admin_approve <appeal_id> [note]`,
    appeal2: `❌ Please provide the appeal ID

Usage: /admin_reject <appeal_id> [note]`,
    appeal3: `❌ Appeal \${appealId} has already been reviewed.`,
    appeal4: `❌ Appeal ID not found: \${appealId}`,
    ban: `❌ User \${targetUserId} has no ban records.`,
    birthday: `❌ \${validation.error}

Please re-enter your birthdate (format: YYYY-MM-DD):`,
    birthday2: `❌ Incorrect birthdate format

Please re-enter (format: YYYY-MM-DD):`,
    birthday3: `❌ Incorrect birthdate format.`,
    bottle: `❌ This conversation has ended.

Use /catch to pick a new message bottle and start a new conversation.`,
    bottle2: `❌ Your account has been banned and you cannot pick message bottles.

If you have questions, please use /appeal to appeal.`,
    bottle3: `❌ This message bottle has already been picked up by someone else, please try another bottle!`,
    broadcast: `❌ The current broadcast system only supports broadcasts for up to \${MAX_SAFE_USERS} users.

`,
    broadcast2: `❌ Broadcast ID must be a number.`,
    broadcast3: `❌ Broadcast record not found.`,
    cancel: `❌ Nickname is too long, please enter a nickname with no more than 36 characters.

Please re-enter or cancel editing:`,
    cancel2: `❌ Personal profile is too long, please enter no more than 200 characters.

Please re-enter or cancel editing:`,
    cancel3: `❌ Location name is too long, please enter no more than 50 characters.

Please re-enter or cancel editing:`,
    cancel4: `❌ Nickname is too short, at least 4 characters are required.

Please re-enter or cancel editing:`,
    cancel5: `❌ Each tag can have a maximum of 20 characters.

Please re-enter or cancel editing:`,
    cancel6: `❌ Cancel editing`,
    cancel7: `❌ Canceled \${ZODIAC_NAMES[zodiacSign]}`,
    cancel8: `❌ Canceled \${mbtiType}`,
    cancel9: `❌ Cancel`,
    conversation: `❌ Conversation with identifier \${formatIdentifier(identifier)} not found

`,
    conversation2: `❌ Conversation information is incorrect.`,
    conversation3: `❌ Conversation information is incorrect`,
    conversation4: `❌ Conversation does not exist`,
    conversationInfoError: `❌ Conversation information is incorrect`,
    conversationNotFound: `❌ Conversation does not exist`,
    failed: `❌ **Failed to load ads**

We apologize, ads cannot be played properly.

💡 **Possible reasons:**
• Unstable internet connection
• Ad provider temporarily unavailable
• Browser not supported

🔄 **Suggestions:**
• Check your internet connection
• Try again later
• Or obtain credits through other means (invite friends)`,
    failed10: `❌ Failed to query maintenance mode status.`,
    failed11: `❌ Failed to refresh the avatar

`,
    failed12: `❌ Verification failed, please try again later`,
    failed13: `❌ Failed to enable maintenance mode.`,
    failed14: `❌ Failed to disable maintenance mode.`,
    failed15: `❌ Failed to retrieve ad status`,
    failed16: `❌ Failed to retrieve statistics.`,
    failed17: `❌ Failed to create broadcast.`,
    failed18: `❌ Failed to retrieve information.`,
    failed19: `❌ Failed to claim reward.`,
    failed2: `❌ Failed to create filtered broadcast
\${error instanceof Error ? error.message : String(error)}`,
    failed20: `❌ Confirmation failed.`,
    failed21: `❌ Setting failed.`,
    failed22: `❌ Skip failed.`,
    failed23: `❌ Operation failed.`,
    failed24: `❌ Failed to send daily report: \${error instanceof Error ? error.message : String(error)}`,
    failed25: `❌ Failed to retrieve VIP funnel data.`,
    failed26: `❌ **Diagnosis failed**

`,
    failed27: `❌ **Refresh failed**

`,
    failed28: `❌ **Payment failed**

`,
    failed29: `❌ Failed to retrieve ad provider list.`,
    failed3: `❌ Failed to process broadcast queue: \${error instanceof Error ? error.message : String(error)}`,
    failed30: `❌ Failed to retrieve official ad list.`,
    failed31: `❌ Failed to enable ad provider.`,
    failed32: `❌ Failed to disable ad provider.`,
    failed33: `❌ Failed to enable official ad.`,
    failed34: `❌ Failed to disable official ad.`,
    failed35: `❌ Failed to retrieve analysis data`,
    failed36: `❌ Failed to retrieve advertisement data`,
    failed37: `❌ Failed to set priority`,
    failed38: `❌ Refund failed: \${error instanceof Error ? error.message : String(error)}`,
    failed39: `❌ Operation failed: \${error instanceof Error ? error.message : String(error)}`,
    failed4: `❌ Failed to query broadcast status: \${error instanceof Error ? error.message : String(error)}`,
    failed40: `❌ Submission failed, please try again later.`,
    failed41: `❌ Failed to create chat, please try again later.`,
    failed5: `❌ Failed to cancel broadcast: \${error instanceof Error ? error.message : String(error)}`,
    failed6: `❌ Failed to clear broadcast: \${error instanceof Error ? error.message : String(error)}`,
    failed7: `❌ Reset failed: \${errorMessage}

Please try again later.`,
    failed8: `❌ Failed to create broadcast, please try again later.`,
    failed9: `❌ Failed to refresh chat history

`,
    mbti: `❌ Invalid MBTI type`,
    message: `❌ Filter format error

\${error instanceof Error ? error.message : String(error)}

`,
    message2: `❌ This command is not available in production.

This command is not available in production.`,
    message3: `❌ An error occurred, please try again later.

Error message: \${error instanceof Error ? error.message : String(error)}`,
    message4: `❌ Sorry, you must be at least 18 years old to use this service.

Please come back when you're of age!`,
    nickname: `❌ Unable to retrieve Telegram nickname`,
    nickname2: `❌ Nickname cannot contain website links

`,
    nickname3: `❌ \${validation.error}

Please re-enter your nickname:`,
    quota: `❌ Today's message bottle quota has been used up (\${quotaDisplay})

💡 Ways to gain more quota: 
`,
    quota2: `❌ Today's conversation message quota has been used up (\${usedToday}/\${dailyLimit})

`,
    quota3: `❌ Today's message bottle quota has been used up (\${quotaDisplay})

`,
    register: `❌ Please complete the registration process first.

Use /start to continue registration.`,
    register2: `❌ User data not found, please use /start to register first.`,
    register3: `❌ You must complete the registration process to pick up message bottles.

Use /start to continue registration.`,
    settings: `❌ You can set up to 5 interest tags.

Please re-enter or cancel editing:`,
    short: `❌ Invalid language code`,
    short10: `❌ Insufficient permissions`,
    short11: `❌ Talk later`,
    short12: `❌ Reselect`,
    short13: `❌ Re-enter`,
    short14: `❌ Close`,
    short15: `❌ Not enabled`,
    short2: `❌ User data not found`,
    short3: `❌ Unknown tutorial step`,
    short4: `❌ A system error has occurred`,
    short5: `❌ Channel configuration error`,
    short6: `❌ Unknown operation`,
    short7: `❌ Incorrect`,
    short8: `❌ No`,
    short9: `❌ An error occurred`,
    start: `❌ An error occurred, please restart: /start`,
    stats: `❌ You do not have permission to view advertisement statistics`,
    task: `❌ An error occurred while accessing the task center, please try again later.`,
    text: `❌ An error occurred while calculating results, please try again later.

`,
    text10: `❌ Sender information is incorrect.`,
    text11: `❌ You do not have permission to view analytics data`,
    text12: `❌ An error occurred, please try again later.`,
    text13: `❌ You do not have permission to use this command.`,
    text14: `❌ Incorrect usage method

`,
    text15: `❌ Priority must be a non-negative integer`,
    text16: `❌ Duration must be a positive integer or`,
    text17: `❌ An error occurred while processing payment, please contact customer support.

`,
    text18: `❌ The refund reason must be at least 10 characters, please re-enter:`,
    text19: `❌ **Refund request has been rejected**

`,
    text2: `❌ The personal profile contains disallowed links.

`,
    text20: `❌ Refund request exceeds the time limit

`,
    text21: `❌ Refund request does not exist or has been processed`,
    text22: `❌ Payment record not found.`,
    text23: `❌ We’re sorry, you must be at least 18 years old to use this service.

`,
    text24: `❌ An error occurred, please re-enter.`,
    text25: `❌ Please answer the question seriously

`,
    text3: `❌ You are not detected in the channel, please join before trying again.`,
    text4: `❌ You have been detected as having left the channel, unable to claim rewards.`,
    text5: `❌ An error occurred while starting the tutorial, please try again later.`,
    text6: `❌ An error occurred, please try again later.`,
    text7: `❌ Duration must be a number (in minutes).`,
    text8: `❌ An error occurred, please try again later.`,
    text9: `❌ Unable to retrieve maintenance mode status.`,
    userNotFound: `❌ User does not exist, please register first with /start.`,
    userNotFound2: `❌ User does not exist, please register first.`,
    userNotFound3: `❌ The other user does not exist.`,
    userNotFound4: `❌ User does not exist`,
    userNotFound5: `❌ User does not exist: \${userId}`,
    userNotFound6: `❌ User does not exist or is not registered.`,
    userNotFound7: `❌ User does not exist.`,
    vip: `❌ You do not have permission to view VIP data.`,
    vip2: `❌ You are not a VIP user and cannot apply for a refund.`,
  },
  errors: {
    banned: `❌ 你的帳號已被封禁

原因：{reason}`,
    channelConfigError: `❌ Channel configuration error`,
    claimRewardFailed: `❌ Failed to claim reward`,
    completeOnboarding: `⚠️ Please complete the registration process first.`,
    conversationInfoError: `❌ Conversation information error.`,
    conversationNotFound: `❌ Cannot find this conversation`,
    errorDetails: `Error message: {error}`,
    failed: `Failed: \${broadcast.failedCount}
`,
    failed2: `Failed: \${result.failed} items

`,
    failed3: `These broadcasts will be marked as 'failed' status
`,
    failed4: `These broadcasts have been marked as 'failed' status
`,
    generic: `❌ An error occurred, please try again later.`,
    invalidRequest: `❌ Invalid request`,
    message: `\${statusEmoji} **\${provider.provider_display_name}**
\${healthEmoji} Health Status: \${health.is_healthy ? 'Good' : 'Needs Attention'}
📊 Completion Rate: \${stats.completion_rate}%
❌ Error Rate: \${stats.error_rate}%
📈 Total Requests: \${stats.total_requests}
✅ Total Completions: \${stats.total_completions}
💡 Recommendation: \${health.recommendation} {health.is_healthy ? '良好' : '需要關注'} \${health.is_healthy ? '良好' : '需要關注'}`,
    message2: `Error message: \${error instanceof Error ? error.message : String(error)}`,
    message3: `
Error: \${broadcast.errorMessage}`,
    operationFailed: `❌ Operation failed.`,
    processError: `❌ An error occurred during processing`,
    sessionExpired: `❌ Session has expired, please restart`,
    systemError: `System error`,
    systemErrorRetry: `❌ A system error occurred, please try again later.`,
    unknownAction: `❌ Unknown operation`,
    unknownError: `🎨 UX: Friendly error message`,
    userNotFound: `User does not exist`,
    userNotFound4: `❌ User not found`,
    userNotFoundRegister: `⚠️ User does not exist, please register using /start first.`,
    verificationFailed: `❌ Verification failed, please try again later.`,
    error: {
      ad: `❌ This advertisement does not require verification`,
      ad2: `❌ No available advertisements at the moment`,
      ad3: `❌ Cannot claim this advertisement`,
      ad4: `❌ Advertisement does not exist`,
      ad5: `❌ Ad ID must be a number`,
      ad6: `❌ You do not have permission to view ad data`,
      admin: `❌ A system error occurred, please try again later.

If the problem persists, please contact the administrator.`,
      admin2: `❌ **Insufficient permissions**

This command is restricted to super administrators.`,
      admin3: `❌ This user is already a super administrator, no need to add.`,
      admin4: `❌ Only super administrators can use this command.`,
      admin5: `❌ This user is already an administrator.`,
      admin6: `❌ Cannot remove super administrator.`,
      admin7: `❌ This user is not an administrator.`,
      appeal: `❌ Please provide the appeal ID

Usage: /admin_approve <appeal_id> [notes]`,
      appeal2: `<appeal_id>`,
      appeal3: `{appealId} \${appealId}`,
      appeal4: `{appealId} \${appealId}`,
      ban: `{targetUserId} \${targetUserId}`,
      birthday: `{validation.error} \${validation.error}`,
      birthday2: `❌ Incorrect birthday format

Please re-enter (format: YYYY-MM-DD):`,
      birthday3: `❌ Incorrect birthday format`,
      bottle: `❌ This conversation has ended.

Use /catch to pick a new Drift Bottle and start a new conversation.`,
      bottle2: `❌ Your account has been banned and you cannot pick up Drift Bottles.

If you have questions, please use /appeal to appeal.`,
      bottle3: `❌ This bottle has already been picked up by someone else. Please try other bottles!`,
      broadcast: `❌ The current broadcasting system only supports broadcasting to \\\${MAX_SAFE_USERS} users or fewer.

`,
      broadcast2: `❌ Broadcast ID must be a number`,
      broadcast3: `❌ Broadcast record not found`,
      cancel: `❌ Nickname too long, please enter a nickname no more than 36 characters.

Please re-enter or cancel the edit:`,
      cancel2: `❌ Personal profile too long, please enter no more than 200 characters.

Please re-enter or cancel the edit:`,
      cancel3: `❌ Region name too long, please enter no more than 50 characters.

Please re-enter or cancel the edit:`,
      cancel4: `❌ Nickname too short, at least 4 characters required.

Please re-enter or cancel the edit:`,
      cancel5: `❌ Each tag is limited to 20 characters.

Please re-enter or cancel the edit:`,
      cancel6: `❌ Cancel edit`,
      cancel7: `❌ Canceled \\\${ZODIAC_NAMES[zodiacSign]}`,
      cancel8: `❌ Canceled \\\${mbtiType}`,
      cancel9: `❌ Cancel`,
      conversation: `❌ Conversation with identifier \\\${formatIdentifier(identifier)} not found

`,
      conversation2: `❌ Conversation information error.`,
      conversation3: `❌ Conversation information error`,
      conversation4: `❌ Conversation does not exist`,
      conversationInfoError: `❌ Conversation information is incorrect`,
      conversationNotFound: `❌ Conversation does not exist`,
      failed: `❌ **Ad failed to load**

Sorry, the ad could not play properly.

💡 **Possible reasons:**
• Unstable network connection
• Ad provider temporarily unavailable
• Browser not supported

🔄 **Suggestions:**
• Check network connection
• Try again later
• Or use other methods to gain credits (invite friends)`,
      failed10: `❌ Failed to query maintenance mode status.`,
      failed11: `❌ Failed to refresh avatar

`,
      failed12: `❌ Verification failed, please try again later.`,
      failed13: `❌ Failed to enable maintenance mode.`,
      failed14: `❌ Failed to disable maintenance mode.`,
      failed15: `❌ Failed to get advertisement status.`,
      failed16: `❌ Failed to get statistics data.`,
      failed17: `❌ Failed to create broadcast.`,
      failed18: `❌ Failed to retrieve information.`,
      failed19: `❌ Failed to claim reward.`,
      failed2: `❌ Failed to create filtered broadcast

\\\${error instanceof Error ? error.message : String(error)}`,
      failed20: `❌ Confirmation failed.`,
      failed21: `❌ Setting failed.`,
      failed22: `❌ Skipping failed.`,
      failed23: `❌ Operation failed.`,
      failed24: `❌ Failed to send daily report: \\\${error instanceof Error ? error.message : String(error)}`,
      failed25: `❌ Failed to retrieve VIP funnel data.`,
      failed26: `❌ **Diagnosis failed**

`,
      failed27: `❌ **Refresh failed**

`,
      failed28: `❌ **Payment failed**

`,
      failed29: `❌ Failed to get advertisement provider list.`,
      failed3: `❌ Failed to process broadcast queue: \\\${error instanceof Error ? error.message : String(error)}`,
      failed30: `❌ Failed to get official advertisement list.`,
      failed31: `❌ Failed to enable ad provider`,
      failed32: `❌ Failed to disable ad provider`,
      failed33: `❌ Failed to enable official ads`,
      failed34: `❌ Failed to disable official ads`,
      failed35: `❌ Failed to retrieve analytics data`,
      failed36: `❌ Failed to retrieve ad data`,
      failed37: `❌ Failed to set priority`,
      failed38: `❌ Refund failed: \${error instanceof Error ? error.message : String(error)}`,
      failed39: `❌ Operation failed: \${error instanceof Error ? error.message : String(error)}`,
      failed4: `❌ Failed to query broadcast status: \${error instanceof Error ? error.message : String(error)}`,
      failed40: `❌ Submission failed, please try again later.`,
      failed41: `❌ Failed to create conversation, please try again later.`,
      failed5: `❌ Failed to cancel broadcast: \${error instanceof Error ? error.message : String(error)}`,
      failed6: `❌ Failed to clear broadcast: \${error instanceof Error ? error.message : String(error)}`,
      failed7: `❌ Reset failed: \${errorMessage}

Please try again later.`,
      failed8: `❌ Failed to create broadcast, please try again later.`,
      failed9: `❌ Failed to refresh conversation history

`,
      mbti: `❌ Invalid MBTI type`,
      message: `❌ Filter format error

\\\${error instanceof Error ? error.message : String(error)}

`,
      message2: `❌ This command is not available in production.

This command is not available in production.`,
      message3: `❌ An error occurred, please try again later.

Error message: \\\${error instanceof Error ? error.message : String(error)}`,
      message4: `❌ We're sorry, you must be at least 18 years old to use this service.

Please come back when you're an adult!`,
      nickname: `❌ Unable to retrieve Telegram username`,
      nickname2: `❌ The username cannot contain a website link

`,
      nickname3: `❌ \\\${validation.error}

Please re-enter your username:`,
      quota: `❌ Today's message bottle quota has been used up (\\\${quotaDisplay})

💡 Ways to get more quota: 
`,
      quota2: `❌ Today's conversation message quota has been used up (\\\${usedToday}/\\\${dailyLimit})

`,
      quota3: `❌ Today's message bottle quota has been used up (\\\${quotaDisplay})

`,
      register: `❌ Please complete the registration process first.

Use /start to continue the registration.`,
      register2: `❌ User data not found, please use /start to register first.`,
      register3: `❌ You must complete the registration process to pick up a message bottle.

Use /start to continue the registration.`,
      settings: `❌ You can set a maximum of 5 interest tags.

Please re-enter or cancel editing:`,
      short: `❌ Invalid language code`,
      short10: `❌ Insufficient permissions`,
      short11: `❌ Let's talk later`,
      short12: `❌ Re-select`,
      short13: `❌ Re-enter`,
      short14: `❌ Close`,
      short15: `❌ Not enabled`,
      short2: `❌ User data not found`,
      short3: `❌ Unknown instructional step`,
      short4: `❌ A system error has occurred`,
      short5: `❌ Channel configuration error`,
      short6: `❌ Unknown operation`,
      short7: `❌ Incorrect`,
      short8: `❌ No`,
      short9: `❌ An error has occurred`,
      start: `❌ An error has occurred, please restart: /start`,
      stats: `❌ You do not have permission to view ad statistics`,
      task: `❌ A system error occurred while viewing the task center, please try again later.`,
      text: `❌ A system error occurred while calculating results, please try again later.

`,
      text10: `❌ Incorrect sender information.`,
      text11: `❌ You do not have permission to view analysis data`,
      text12: `❌ An error has occurred, please try again later.`,
      text13: `❌ You do not have permission to use this command.`,
      text14: `❌ Incorrect usage method

`,
      text15: `❌ Priority must be a non-negative integer`,
      text16: `❌ Duration must be a positive integer or`,
      text17: `❌ A system error occurred while processing the payment, please contact customer support.

`,
      text18: `❌ The refund reason must be at least 10 characters, please re-enter:`,
      text19: `❌ **Refund request has been denied**

`,
      text2: `❌ Profile contains disallowed links.

`,
      text20: `❌ Refund request exceeds the time limit

`,
      text21: `❌ Refund request does not exist or has been processed`,
      text22: `❌ Payment record not found.`,
      text23: `❌ We are sorry, you must be over 18 years old to use this service.

`,
      text24: `❌ An error occurred, please re-enter.`,
      text25: `❌ Please answer the question seriously

`,
      text3: `❌ No detection of your channel membership, please join first before retrying`,
      text4: `❌ Detected that you have left the channel, unable to claim rewards.`,
      text5: `❌ An error occurred while starting the tutorial, please try again later.`,
      text6: `❌ A system error occurred, please try again later.`,
      text7: `❌ Duration must be a number (in minutes).`,
      text8: `❌ An error occurred, please try again later.`,
      text9: `❌ Unable to retrieve maintenance mode status.`,
      userNotFound: `❌ User does not exist, please register first using /start.`,
      userNotFound2: `❌ User does not exist, please register first.`,
      userNotFound3: `❌ The other user does not exist.`,
      userNotFound4: `❌ User does not exist.`,
      userNotFound5: `❌ User does not exist: \\\\$\${userId}`,
      userNotFound6: `❌ User does not exist or is not registered.`,
      userNotFound7: `❌ User does not exist.`,
      vip: `❌ You do not have permission to view VIP data.`,
      vip2: `❌ You are not a VIP user and cannot apply for a refund.`,
    },
  },
  estimate: {
    immediate: `Send Now (approximately 1-2 seconds)`,
    minutes: `Approximately \${minutes} minutes`,
    seconds: `Approximately \${seconds} seconds`,
  },
  gender: {
    female: `Female`,
    label: `👤 Gender: {otherUser.gender}`,
    male: `Male`,
  },
  help: {
    ad: `• Watch ads: +1 quota each time (up to 20 times daily)
`,
    ad2: `/ad_performance - Ad performance report
`,
    ad3: `• Gain quota by watching ads (shown when quota is exhausted)
`,
    ad4: `• View official ads to gain permanent quota

`,
    ad5: `• Official ads: Permanent quota rewards
`,
    ad6: `• Ad-free experience

`,
    admin: `/admin_remove <user_id> - Remove administrator

`,
    admin2: `/admin_add <user_id> - Add administrator
`,
    admin3: `/admin_list - View administrator list
`,
    admin4: `🔱 **Super Administrator Features**

`,
    admin5: `👮 **Administrator Features**

`,
    admin6: `**Administrator Management**
`,
    appeal: `/admin_reject [remarks] - Reject appeal

`,
    appeal2: `/admin_approve [remarks] - Approve appeal
`,
    appeal3: `/appeal_status - Check appeal status

`,
    appeal4: `/admin_appeals - View pending appeals
`,
    appeal5: `🛡️ **Security and Appeals**
`,
    appeal6: `**Appeal Review**
`,
    ban: `/admin_ban <user_id> [hours|permanent] - Ban user
`,
    ban2: `/admin_bans <user_id> - View user ban history

`,
    ban3: `/admin_unban <user_id> - Lift ban
`,
    ban4: `/admin_bans - View ban records
`,
    ban5: `/appeal - Appeal ban
`,
    ban6: `• Violations will result in a ban

`,
    birthday: `• Today is a birthday: is_birthday=true

`,
    bottle: `• Complete tasks: Earn extra message bottles (use /tasks to view)
`,
    bottle2: `/tasks - Task center (complete tasks to earn extra message bottles)
`,
    bottle3: `• You can throw and catch a limited number of message bottles each day
`,
    bottle4: `• VIP users: 30 message bottles per day
`,
    bottle5: `• Message bottles are valid for 24 hours

`,
    bottle6: `• Free users: 3 message bottles per day
`,
    bottle7: `/throw - Throw message bottle
`,
    bottle8: `/catch - Catch message bottle
`,
    bottle9: `🍾 **Message Bottle System**
`,
    broadcast: `/broadcast_status - View broadcast details
`,
    broadcast2: `/broadcast_process - Manually process broadcast queue
`,
    broadcast3: `/broadcast_cleanup - Clean up stuck broadcasts
`,
    broadcast4: `/broadcast_status - View broadcast list
`,
    broadcast5: `**Broadcast Monitoring**
`,
    broadcast6: `**Broadcast Sending**
`,
    cancel: `/broadcast_cancel - Cancel broadcast

`,
    conversation: `/chats - My Conversations List

`,
    conversation2: `• All conversations are anonymous
`,
    help2: `💡 Use /help to view assistance`,
    invite: `• Invite friends: +1 quota per person (up to 10/100)
`,
    invite2: `/invite - Invite friends to gain quota
`,
    mbti: `• Filter by MBTI, Zodiac, Blood Type
`,
    mbti2: `/mbti - MBTI Management
`,
    message: `/maintenance_enable - Enable maintenance mode
`,
    message2: `/broadcast_non_vip - Send to non-VIP users in bulk
`,
    message3: `• Women aged 18-25: gender=female, age=18-25
`,
    message4: `/broadcast_filter - Precise broadcast
`,
    message5: `/broadcast_vip - Send to VIP users in bulk
`,
    message6: `/maintenance_disable - Disable maintenance mode

`,
    message7: `/maintenance_status - Check maintenance status
`,
    message8: `/broadcast - Send to all users in bulk
`,
    profile: `/edit_profile - Edit Profile
`,
    profile2: `/profile - View Profile
`,
    profile3: `👤 **Profile**
`,
    quota: `• Invite friends to increase quota (up to 10/100)
`,
    quota2: `• 30 message bottle quota per day
`,
    register: `/start - Start using / Continue registration
`,
    report: `/report - Report inappropriate content
`,
    settings: `/settings - Notification settings`,
    settings2: `📖 **Help & Settings**
`,
    stats: `/stats - My statistics

`,
    success: `└ Significantly increase matching success rate
`,
    text: `/maintenance_status - Check maintenance status`,
    text10: `📖 **XunNi Command List**

`,
    text11: `/analytics - Daily operation report
`,
    text12: `/dev_restart - Completely reset account`,
    text13: `📜 **XunNi Game Rules**

`,
    text14: `• Only text and official Emojis can be sent
`,
    text15: `/dev_info - System information
`,
    text16: `/quota - Check quota status
`,
    text17: `/rules - View game rules
`,
    text18: `/block - Block user
`,
    text19: `/help - Show this list
`,
    text2: `/refresh_avatar - Refresh avatar cache
`,
    text20: `• Respect others, communicate kindly

`,
    text21: `🎁 **How to obtain the quota**
`,
    text22: `• Do not share personal contact information
`,
    text23: `🛡️ **Safety rules**
`,
    text24: `🎮 **Core features**
`,
    text25: `/menu - Main menu
`,
    text26: `💬 **Anonymous chat**
`,
    text27: `• Harassment and abuse of others are prohibited
`,
    text28: `• Sending inappropriate content is prohibited
`,
    text29: `• Unlock the other party's clear avatar
`,
    text3: `• Only send to females: gender=female
`,
    text30: `• Fraud and phishing are prohibited
`,
    text31: `**User management**
`,
    text32: `**System maintenance**
`,
    text33: `**Data analysis**
`,
    text34: `**Development tools**
`,
    text4: `• 34 languages auto-translation (OpenAI priority)
`,
    text5: `/profile_card - View profile card
`,
    text6: `/dev_reset - Reset account (for testing)
`,
    text7: `• Sent only to male: gender=male
`,
    text8: `💡 Encountering issues? Use /help to see the command list`,
    text9: `• Use /quota to check your quota status

`,
    throw: `• 🆕 Triple exposure opportunity (1 message bottle = 3 targets)
`,
    vip: `• VIP in Taiwan: country=TW,vip=true
`,
    vip2: `• Daily free quota: 3 (VIP: 30)
`,
    vip3: `/funnel - VIP conversion funnel

`,
    vip4: `🎁 **Quota and VIP**
`,
    vip5: `/vip - VIP subscription
`,
    vip6: `💎 **VIP Benefits**
`,
  },
  history: {
    chatHistory: `💬 **Your Chat History**

`,
    continueChatButton: `💬 Continue Conversation`,
    continueConversation: `💬 Continue Conversation: /reply
`,
    conversationEnd: `• Last message: {time}
`,
    conversationNotFound: `❌ Conversation with identifier {identifier} not found

Use /history to see all conversations

🏠 Back to main menu: /menu`,
    conversationStart: `• Conversation started: {time}
`,
    conversationTitle: `📨 Conversation with {identifier} ({count} messages)
`,
    conversationWith: `💬 **Conversation with {identifier}**

`,
    daysAgo: `{days} days ago`,
    errorRetry: `❌ An error occurred, please try again later.`,
    hoursAgo: `{hours} hours ago`,
    justNow: `Just now`,
    lastMessage: `Last message: {preview}
`,
    messageSender: `{sender}: {content}

`,
    messageTime: `📨 {time}
`,
    minutesAgo: `{minutes} minutes ago`,
    noHistory: `💬 You have no conversation history yet

Go throw a message bottle to meet new friends! /throw

🏠 Return to Main Menu: /menu`,
    noMessages: `(No messages)`,
    partnerMessages: `• They sent: {count} 
`,
    recentMessages: `
📨 **Recent Conversations:**

`,
    returnToMenu: `🏠 Return to Main Menu: /menu`,
    returnToMenuButton: `🏠 Return to Main Menu`,
    stats: `📊 **Statistics:**
`,
    time: `Time: {time}

`,
    totalMessages: `• Total messages: {total} 
`,
    userMessages: `• You sent: {count} 
`,
    viewFull: `💡 Use /history {identifier} to view the full conversation

`,
    you: `You`,
  },
  invite: {
    codeAccepted: `✅ 邀請碼已接受！感謝 {inviterName} 的邀請`,
    inviteeSuccess: `[Needs translation: invite.inviteeSuccess]`,
    inviterSuccess: `✅ 邀請成功！你獲得了 +1 永久額度`,
    limitReached: `❌ 你已達到邀請上限（{max} 人）`,
    limitWarning: `⚠️ 你已邀請 {count} 人，還可邀請 {remaining} 人`,
    selfInviteError: `[Needs translation: invite.selfInviteError]`,
    upgradePrompt: `[Needs translation: invite.upgradePrompt]`,
    userType: `{type}`,
  },
  maintenance: {
    allFeaturesAvailable: `You can now use all features normally.`,
    completed: `✅ System maintenance completed`,
    completingSoon: `About to complete`,
    correctFormat: `**Correct Format:**
/maintenance_enable [maintenance message]

`,
    defaultMessage: `The system is undergoing maintenance and is temporarily unavailable.`,
    disableFailed: `❌ Failed to disable maintenance mode.`,
    disableSuccess: `✅ Maintenance mode has been disabled

Recovery notifications have been broadcast to all users.`,
    durationMax: `Maintenance duration cannot exceed 24 hours (1440 minutes)`,
    durationMin: `Minimum maintenance duration is 5 minutes`,
    durationMustBeNumber: `❌ Duration must be a number (in minutes)`,
    enableFailed: `❌ Failed to enable maintenance mode.`,
    enableSuccess: `✅ Maintenance mode enabled

Duration: {duration} minutes
Start: {startTime}
End: {endTime}

Maintenance notice has been broadcasted to all users.
Regular users will not be able to use the service; only administrators can log in.`,
    enabledBy: `Enabled by: {user}
`,
    estimatedDuration: `Estimated duration: {duration} minutes
`,
    estimatedEnd: `Estimated completion: {time}
`,
    example: `**Example:**
/maintenance_enable 60 system upgrade maintenance`,
    notificationTitle: `🛠️ System maintenance notice`,
    remainingHours: `About {hours} hours and {minutes} minutes`,
    remainingMinutes: `Approximately {minutes} minutes`,
    remainingTime: `Remaining time: {time}
`,
    serviceRestored: `Service has resumed normal operations, thank you for your patience!`,
    startTime: `Start time: {time}
`,
    status: `Status: {status}
`,
    statusActive: `✅ In maintenance`,
    statusFailed: `❌ Unable to retrieve maintenance mode status`,
    statusInactive: `❌ Not enabled`,
    statusTitle: `🛠️ Maintenance mode status`,
    thanks: `Thank you for your patience!`,
    unknown: `Unknown`,
    usageError: `❌ Incorrect usage

`,
  },
  mbti: {
    description: {
      ENFJ: `主人公 - 富有魅力且鼓舞人心的領導者，有能力使聽眾著迷。`,
      ENFP: `競選者 - 熱情、有創造力且社交能力強的自由精神，總能找到理由微笑。`,
      ENTJ: `指揮官 - 大膽、富有想像力且意志強大的領導者，總能找到或創造解決方法。`,
      ENTP: `辯論家 - 聰明好奇的思想家，無法抗拒智力上的挑戰。`,
      ESFJ: `執政官 - 極有同情心、受歡迎且樂於助人的人，總是渴望為社群做出貢獻。`,
      ESFP: `表演者 - 自發、精力充沛且熱情的表演者，生活在他們周圍從不無聊。`,
      ESTJ: `總經理 - 出色的管理者，在管理事務或人員方面無與倫比。`,
      ESTP: `企業家 - 聰明、精力充沛且善於洞察的人，真正享受生活在邊緣。`,
      INFJ: `提倡者 - 安靜而神秘，同時鼓舞人心且不知疲倦的理想主義者。`,
      INFP: `調停者 - 詩意、善良的利他主義者，總是熱情地為正義事業而努力。`,
      INTJ: `建築師 - 富有想像力和戰略性的思想家，一切皆在計劃之中。`,
      INTP: `邏輯學家 - 具有創新精神的發明家，對知識有著止不住的渴望。`,
      ISFJ: `守衛者 - 非常專注且溫暖的守護者，時刻準備著保護所愛之人。`,
      ISFP: `探險家 - 靈活且迷人的藝術家，時刻準備著探索和體驗新事物。`,
      ISTJ: `物流師 - 實際且注重事實的個人，可靠性不容懷疑。`,
      ISTP: `鑒賞家 - 大膽而實際的實驗者，擅長使用各種工具。`,
    },
    full: {
      question1: `在社交場合中，你通常：`,
      'question1.option1': `主動與他人交談`,
      'question1.option2': `等待他人來找我`,
      question10: `解決問題時，你更依賴：`,
      'question10.option1': `實際經驗和事實`,
      'question10.option2': `直覺和可能性`,
      question11: `你更喜歡：`,
      'question11.option1': `關注具體細節`,
      'question11.option2': `關注整體概念`,
      question12: `學習新事物時，你更喜歡：`,
      'question12.option1': `按部就班的方法`,
      'question12.option2': `探索創新的方式`,
      question13: `閱讀時，你更喜歡：`,
      'question13.option1': `實用的指南`,
      'question13.option2': `理論和概念`,
      question14: `你更關注：`,
      'question14.option1': `現在和過去`,
      'question14.option2': `未來和可能性`,
      question15: `描述事物時，你傾向於：`,
      'question15.option1': `使用具體例子`,
      'question15.option2': `使用比喻和類比`,
      question16: `工作中，你更重視：`,
      'question16.option1': `實際應用`,
      'question16.option2': `創新想法`,
      question17: `你更信任：`,
      'question17.option1': `已驗證的方法`,
      'question17.option2': `新的嘗試`,
      question18: `規劃未來時，你會：`,
      'question18.option1': `基於現實條件`,
      'question18.option2': `想像各種可能`,
      question19: `做決定時，你更重視：`,
      'question19.option1': `邏輯和客觀分析`,
      'question19.option2': `情感和人際和諧`,
      question2: `週末你更喜歡：`,
      'question2.option1': `和朋友出去玩`,
      'question2.option2': `在家獨處休息`,
      question20: `批評他人時，你會：`,
      'question20.option1': `直接指出問題`,
      'question20.option2': `考慮對方感受`,
      question21: `你更看重：`,
      'question21.option1': `公平和正義`,
      'question21.option2': `同情和理解`,
      question22: `評價一個想法時，你首先考慮：`,
      'question22.option1': `是否合理`,
      'question22.option2': `是否有益`,
      question23: `朋友向你傾訴時，你會：`,
      'question23.option1': `分析問題並提供建議`,
      'question23.option2': `傾聽並給予安慰`,
      question24: `衝突中，你更傾向於：`,
      'question24.option1': `堅持原則`,
      'question24.option2': `維持關係`,
      question25: `你更容易被說服通過：`,
      'question25.option1': `事實和數據`,
      'question25.option2': `情感和故事`,
      question26: `團隊決策時，你更關注：`,
      'question26.option1': `效率和結果`,
      'question26.option2': `共識和團結`,
      question27: `你認為好的領導者應該：`,
      'question27.option1': `公正果斷`,
      'question27.option2': `體貼關懷`,
      question28: `你的工作方式是：`,
      'question28.option1': `提前計劃和準備`,
      'question28.option2': `隨機應變和靈活`,
      question29: `你更喜歡：`,
      'question29.option1': `有明確的截止日期`,
      'question29.option2': `保持開放的選擇`,
      question3: `參加聚會後，你通常：`,
      'question3.option1': `感到充滿活力`,
      'question3.option2': `感到需要休息`,
      question30: `旅行時，你傾向於：`,
      'question30.option1': `制定詳細行程`,
      'question30.option2': `隨心所欲探索`,
      question31: `你的房間通常：`,
      'question31.option1': `整齊有序`,
      'question31.option2': `隨性自在`,
      question32: `處理任務時，你會：`,
      'question32.option1': `盡早完成`,
      'question32.option2': `接近截止日期才完成`,
      question33: `你更喜歡的生活方式：`,
      'question33.option1': `有規律和結構`,
      'question33.option2': `自由和彈性`,
      question34: `做決定時，你傾向於：`,
      'question34.option1': `快速決定`,
      'question34.option2': `保留選擇權`,
      question35: `購物時，你會：`,
      'question35.option1': `列清單按計劃購買`,
      'question35.option2': `隨意逛逛看到喜歡就買`,
      question36: `面對變化，你通常：`,
      'question36.option1': `感到不安`,
      'question36.option2': `感到興奮`,
      question4: `在團隊中，你更傾向於：`,
      'question4.option1': `積極發表意見`,
      'question4.option2': `先聽後說`,
      question5: `遇到新朋友時，你會：`,
      'question5.option1': `很快就能熟絡起來`,
      'question5.option2': `需要時間慢慢熟悉`,
      question6: `你的朋友圈：`,
      'question6.option1': `廣泛但不深入`,
      'question6.option2': `小而親密`,
      question7: `工作時，你更喜歡：`,
      'question7.option1': `團隊合作`,
      'question7.option2': `獨立工作`,
      question8: `思考問題時，你傾向於：`,
      'question8.option1': `邊說邊想`,
      'question8.option2': `先想好再說`,
      question9: `壓力大時，你會：`,
      'question9.option1': `找朋友聊天`,
      'question9.option2': `獨自消化`,
    },
    quick: {
      question1: `在社交場合中，你通常：`,
      'question1.option1': `主動與他人交談`,
      'question1.option2': `等待他人來找我`,
      question10: `你的工作方式是：`,
      'question10.option1': `提前計劃和準備`,
      'question10.option2': `隨機應變和靈活`,
      question11: `你更喜歡：`,
      'question11.option1': `有明確的截止日期`,
      'question11.option2': `保持開放的選擇`,
      question12: `旅行時，你傾向於：`,
      'question12.option1': `制定詳細行程`,
      'question12.option2': `隨心所欲探索`,
      question2: `週末你更喜歡：`,
      'question2.option1': `和朋友出去玩`,
      'question2.option2': `在家獨處休息`,
      question3: `參加聚會後，你通常：`,
      'question3.option1': `感到充滿活力`,
      'question3.option2': `感到需要休息`,
      question4: `解決問題時，你更依賴：`,
      'question4.option1': `實際經驗和事實`,
      'question4.option2': `直覺和可能性`,
      question5: `你更喜歡：`,
      'question5.option1': `關注具體細節`,
      'question5.option2': `關注整體概念`,
      question6: `學習新事物時，你更喜歡：`,
      'question6.option1': `按部就班的方法`,
      'question6.option2': `探索創新的方式`,
      question7: `做決定時，你更重視：`,
      'question7.option1': `邏輯和客觀分析`,
      'question7.option2': `情感和人際和諧`,
      question8: `批評他人時，你會：`,
      'question8.option1': `直接指出問題`,
      'question8.option2': `考慮對方感受`,
      question9: `你更看重：`,
      'question9.option1': `公平和正義`,
      'question9.option2': `同情和理解`,
    },
  },
  mbtiTest: {
    afterRegistration: `💡 After completing registration, you can:
`,
    answerRecorded: `✅ Recorded`,
    completion: `🎉 {testTitle} Completed!

`,
    fullAccuracy: `Results are more accurate`,
    fullQuestions: `36 questions`,
    fullTest: `Complete MBTI test`,
    fullTestInfo: `

💡 This is a complete test ({questions}), the result is more accurate.
After completing registration, you can use /mbti to retake the test.

`,
    fullTestTitle: `Full test`,
    manualModify: `• Manually modify your MBTI type`,
    moreDetailedTest: `• Take a more detailed test
`,
    note: `⚠️ Note: This is {testInfo}{testTitle}, {accuracy}.

`,
    questionOrderError: `⚠️ Incorrect question order`,
    questions12: `12 questions`,
    questions36: `36 questions`,
    quickAccuracy: `Results are for reference only`,
    quickQuestions: `12 questions`,
    quickTest: `Quick MBTI test`,
    quickTestInfo: `

💡 This is a quick test ({questions}), the result is for reference only.
After completing registration, you can use /mbti to retake the test.

`,
    quickTestTitle: `Quick test`,
    yourMbtiType: `Your MBTI type is: **{type}**

`,
  },
  menu: {
    bottle: `• Activated after friends throw their first message bottle
`,
    buttonCatch: `🎣 Pick up a message bottle`,
    buttonChats: `💬 My conversations`,
    buttonHelp: `❓ Help`,
    buttonInvite: `👥 Invite Friends`,
    buttonProfile: `👤 Profile`,
    buttonSettings: `⚙️ Settings`,
    buttonStats: `📊 Statistics`,
    buttonThrow: `🌊 Throw Message Bottle`,
    buttonVip: `💎 VIP`,
    invite: `🎁 **Invite Friends**

`,
    invite2: `📋 Your Invite Code：\\`,
    invite3: `📤 Share Invite Code`,
    levelFree: `🆓 Free Member`,
    levelVip: `💎 VIP Member`,
    message: `https://t.me/share/url?url=https://t.me/\${botUsername}?start=invite_\${inviteCode}&text=Come to XunNi and throw message bottles together!🍾 Use my invite code to join, and we can all get more quotas! https://t.me/share/url?url=https://t.me/\${botUsername}?start=invite_\${inviteCode}&text=來`,
    message2: `https://t.me/share/url?url=https://t.me/\${botUsername}?start=invite_\${inviteCode}&text=Come to XunNi and throw message bottles together https://t.me/share/url?url=https://t.me/\${botUsername}?start=invite_\${inviteCode}&text=來`,
    notRegistered: `Not Registered`,
    notSet: `Not Set`,
    quota: `• You both get a daily quota +1

`,
    register: `• Friends register using your invite code
`,
    selectFeature: `Please select a feature：`,
    settings: `• MBTI：\${mbti}
 \${mbti}`,
    settings2: `• Zodiac Sign：\${zodiac}

 \${zodiac}`,
    settings3: `Not Set`,
    settings4: `Not Set`,
    short: `Free Member`,
    stats: `📊 View Invitation Statistics: /profile`,
    stats2: `📊 View Invitation Statistics`,
    task: `🎯 **Next Task**
⏳ \${nextTask.name} (+\${nextTask.reward_amount} message bottles)
💡 \${nextTask.description}

`,
    text: `🏠 **Main Menu** \${vipBadge}

`,
    text2: `👋 Hi, \${user.nickname}!

`,
    text3: `💡 Click the button below to share with friends: 
`,
    text4: `💡 Choose the feature you want:`,
    text5: `📊 Your Status: 
`,
    title: `🏠 **Main Menu**`,
    userNotFound: `User does not exist`,
    vip: `• Level: \${isVip ? 'VIP Member 💎' : 'Free Member'}
 {isVip ? 'VIP 會員 💎' : '免費會員'} \${isVip ? 'VIP 會員 💎' : '免費會員'}`,
    vip2: `VIP Member 💎`,
    yourStatus: `Your Status`,
  },
  messageForward: {
    blockedUrls: `❌ 訊息包含被禁止的網址`,
    dailyQuota: `📊 Sent today: {used}/{limit} messages`,
    messageSent: `✅ Message has been sent to {identifier}

`,
    quotaExceeded: `❌ 今日訊息配額已用完`,
    removeLinks: `[Translation needed from zh-TW.ts]`,
    replyHint: `[Translation needed from zh-TW.ts]`,
    upgradeVip: `[Translation needed from zh-TW.ts]`,
    urlNotAllowed: `[Translation needed from zh-TW.ts]`,
    urlNotAllowedDesc: `[Translation needed from zh-TW.ts]`,
    vipDailyLimit: `[Translation needed from zh-TW.ts]`,
  },
  nickname: {
    cannotGetNickname: `❌ Unable to retrieve Telegram nickname`,
    customHint: `⚠️ Note:
• Nickname length limit is 36 characters
• The other party can see a maximum of 18 characters
• Please do not use nickname for advertising`,
    customPrompt: `✏️ Please enter your nickname:

`,
    genderHint: `⚠️ Note: Gender selection cannot be changed after it is set, please choose carefully!`,
    genderSelection: `Great! Your nickname is: {nickname}

Now please select your gender:

`,
    nicknameSet: `✅ Nickname has been set`,
    userNotFound: `❌ User does not exist`,
  },
  officialAd: {
    adNotFound: `❌ Advertisement does not exist`,
    allAdsViewed: `✅ You have seen all official advertisements`,
    alreadyViewed: `You have already seen this advertisement`,
    buttonClaimReward: `Claim Reward`,
    buttonJoinGroup: `Join Group`,
    buttonSubscribeChannel: `Subscribe to Channel`,
    buttonVerifyAndClaim: `✅ Verify and Claim`,
    buttonViewDetails: `View Details`,
    buttonVisitLink: `Visit Link`,
    cannotClaim: `❌ Unable to claim this advertisement`,
    claimReward: `✅ Claim Reward`,
    claimRewardButton: `✅ Reward claimed`,
    claimRewardSuccess: `✅ Reward claimed successfully! You have received +{quota} permanent quotas!`,
    communityBenefits: `💡 完成任務可獲得永久額度`,
    communityThanks: `🙏 感謝支持社群！`,
    errorRetry: `❌ An error occurred, please try again later`,
    moreAdsAvailable: `💡 There are more official advertisements to watch!`,
    nextAd: `➡️ Next advertisement`,
    noAdsAvailable: `❌ No available advertisements`,
    noVerificationRequired: `❌ This advertisement does not require verification`,
    quotaInfo: `📊 今日剩餘：**{remaining}/20** 次`,
    requiresVerification: `

✅ Verification required: Click the 'Verify' button after joining the group/channel`,
    reward: `🎁 Reward: +{quota} permanent quotas`,
    rewardPermanent: `🎁 完成任務可獲得 **+1 永久額度**`,
    statsAdNotFound: `❌ Advertisement does not exist`,
    statsClicks: `• Clicks: {count}
`,
    statsCtr: `• Click-through Rate (CTR): {rate}%
`,
    statsHint: `💡 Use /ad_stats {id} to view detailed statistics`,
    statsNoAds: `📊 No official ads available`,
    statsNoPermission: `❌ You do not have permission to view ad statistics`,
    statsRemainingViews: `• Remaining Displays: {remaining}/{total}
`,
    statsRewardGranted: `• Reward Distribution: {count}
`,
    statsRewardRate: `• Reward Rate: {rate}%
`,
    statsRewardSummary: `• Rewards: {rewards}

`,
    statsSummary: `• Displays: {views} | Clicks: {clicks} ({ctr}%)
`,
    statsTitle: `📊 **Official Ad Statistics**

`,
    statsVerificationCount: `• Verification Count: {count}
`,
    statsVerificationRate: `• Verification Rate: {rate}%
`,
    statsViews: `• Views: {count}
`,
    statusDisabled: `Disable`,
    statusEnabled: `Enable`,
    unlimited: `Unlimited`,
    userNotFound: `❌ User does not exist`,
    verifySuccess: `✅ Verification successful! You have received +{quota} permanent quotas!`,
  },
  onboarding: {
    age: `• Age: \${updatedUser.age} years old
`,
    age2: `Your Age: \${age} years old
`,
    age3: `Age: \${age} years old
`,
    ageRestriction: `❌ We're sorry, you must be at least 18 years old to use this service.

`,
    agreeTerms: `Click the button below to indicate that you have read and agreed to the above terms.`,
    antiFraudConfirm: `Please confirm:`,
    antiFraudFinalStep: `🛡️ Last step: Anti-fraud security confirmation

`,
    antiFraudLearn: `📚 I want to learn more about safety knowledge`,
    antiFraudPassed: `✅ Anti-fraud test passed!

`,
    antiFraudQuestion1: `1. Are you aware of the safety risks of online dating?
`,
    antiFraudQuestion2: `2. Will you protect your personal information?
`,
    antiFraudQuestion3: `3. When encountering suspicious messages, will you be vigilant?

`,
    antiFraudQuestions: `To protect the safety of all users, please confirm that you understand the following: 

`,
    antiFraudYes: `✅ Yes, I understand and will pay attention to safety`,
    back: `⬅️ Back`,
    birthday: `If you believe this is an error, please check if your birthday format is correct (YYYY-MM-DD).`,
    birthday2: `Please re-enter your birthday (format: YYYY-MM-DD):

`,
    birthday3: `Please enter your birthday (format: YYYY-MM-DD):

`,
    birthday4: `Birthday: \${birthday}
`,
    birthdayCheck: `If you think this is an error, please check if your birthday format is correct (YYYY-MM-DD).`,
    birthdayError: `❌ {error}

`,
    birthdayFormatError: `❌ Birthday format is incorrect

Please re-enter (format: YYYY-MM-DD):`,
    birthdayRetry: `Please re-enter your birthday (format: YYYY-MM-DD):`,
    birthdayWarning: `⚠️ The birthday cannot be modified after setting, please confirm it's correct!`,
    bloodTypeLabel: `🩸 **Please select your blood type**

`,
    complete: `Please enter 'yes' to complete the test:`,
    confirm: `To protect all users' safety, please confirm that you understand the risks of online dating.

`,
    confirm2: `🛡️ Now conducting anti-fraud safety confirmation

`,
    confirm3: `After understanding, please confirm:`,
    confirmBirthday: `⚠️ Please confirm your birthday information:

`,
    customNickname: `Custom Nickname`,
    enterYes: `Please enter 'yes' to complete the test:`,
    errorRetry: `❌ An error occurred, please re-enter.`,
    gender2: `• Gender: \${updatedUser.gender ===`,
    gender3: `Please select your gender:

`,
    genderFemale: `👩 Female`,
    genderMale: `👨 Male`,
    genderWarning: `⚠️ Note: Gender cannot be changed once set, please choose carefully!`,
    help: `This will help us find more suitable chat partners for you～

`,
    iHaveRead: `✅ I have read and agree`,
    languageSelection: `🌐 **Choose Language**

Please select your preferred language:`,
    lastStep: `Last step: Please read and agree to our Terms of Service

`,
    legalDocuments: `📋 Legal documents are provided in English only.

`,
    mbti: `Please select your MBTI type:

`,
    mbti2: `✍️ I already know my MBTI`,
    message: `2. 🚨 Identify scam messages
`,
    message2: `• Be cautious of messages requesting money
`,
    moreLanguages: `More Languages`,
    nickname: `• Nickname: \${updatedUser.nickname}
`,
    nickname2: `Great! Your nickname is: \${nickname}

`,
    nicknameError: `❌ {error}

Please re-enter your nickname:`,
    nicknameGood: `Great! Your nickname is: {nickname}

`,
    notCompleted: `[Translation needed: onboarding.notCompleted]`,
    nowSelectGender: `Now please select your gender:

`,
    otherUserNotFound: `❌ The other user does not exist.`,
    pleaseAnswer: `❌ Please answer the questions seriously

`,
    pleaseComeBack: `Please come back after you turn 18!

`,
    privacyPolicy: `📋 Privacy Policy
`,
    profile: `• Privacy policy: How we protect your personal data
`,
    profile2: `Your personal data:
`,
    retry: `❌ Re-enter`,
    senderInfoError: `❌ Sender information is incorrect.`,
    settings: `💡 Tip: You can use the /mbti command at any time to set or test your MBTI type.

`,
    settings2: `🧠 Now let's set your MBTI personality type!

`,
    settings3: `Okay, you can set your MBTI later.

`,
    settings4: `If you're unsure, you can take the test first or set it later.`,
    settings5: `🎉 Congratulations! You have completed all the settings!

`,
    settings6: `• Birthday cannot be modified after setting
`,
    settings7: `How would you like to set it?`,
    short: `⏭️ Talk later`,
    start: `Before you start using, please read and agree to our Terms of Service:

`,
    start2: `You can now start using XunNi!`,
    startRegistration: `Start Registration →`,
    stats: `📊 Statistics`,
    stepAntiFraud: `🛡️ Please click the button above to confirm anti-fraud safety matters`,
    stepBirthday: `📅 Please enter your birthday (format: YYYY-MM-DD, e.g., 1995-06-15)`,
    stepDefault: `Please complete the registration as prompted`,
    stepGender: `👤 Please click the button above to select your gender`,
    stepLanguageSelection: `🌍 Please click the button above to choose your language`,
    stepMbti: `🧠 Please click the button above to select your MBTI setting`,
    stepNickname: `✏️ Please enter your nickname`,
    stepTerms: `📜 Please click the button above to agree to the Terms of Service`,
    termsOfService: `📋 User Terms

`,
    text: `confirm_birthday_\${birthday}`,
    text10: `For example: 1995-06-15

`,
    text11: `🛡️ Online Dating Safety Tips

`,
    text12: `📋 Final Step: Terms of Service

`,
    text13: `• Choose a public place for the first meeting
`,
    text14: `1. 🔒 Protect personal information
`,
    text15: `• Do not share financial information

`,
    text16: `• Do not click on suspicious links

`,
    text17: `• Let friends know your itinerary

`,
    text18: `3. 🤝 Safe Dating
`,
    text19: `📋 User Agreement

`,
    text2: `💡 You can use the /mbti command at any time to retake the test or make changes.`,
    text20: `Please return after reaching adulthood!

`,
    text21: `📋 Privacy Policy
`,
    text3: `gender_confirm_\${gender}`,
    text4: `Final Step: Please read and agree to our Terms of Service

`,
    text5: `📝 Take a quick quiz (12 questions, for reference only)`,
    text6: `• User Terms: Guidelines for using this service

`,
    text7: `Click the button below to indicate that you have read and agreed to the terms above.`,
    text8: `• Do not disclose your real name, address, or phone number easily
`,
    text9: `• You must be at least 18 years old to use this service`,
    understandRisks: `To protect the safety of all users, please confirm that you understand the risks of online dating.

`,
    useTelegramNickname: `Use Telegram Nickname`,
    viewPrivacyPolicy: `📋 View Privacy Policy`,
    viewTermsOfService: `📋 View Terms of Service`,
    vip: `💡 Providing your blood type will be used for future blood type matching features (VIP exclusive)

`,
    welcome: `Welcome to XunNi!

Please select your language:`,
    yourAge: `Your age: {age} years old
`,
    zodiac: `• Zodiac sign: \${updatedUser.zodiac_sign}
`,
    zodiac2: `Zodiac sign: \${zodiacSign}

`,
    antiFraud: {
      confirm_button: `✅ Yes, I understand and will pay attention to safety`,
      learn_button: `📚 I want to learn more about safety knowledge`,
      question1: `1. Are you aware of the safety risks of online dating?
`,
      question2: `2. Will you protect your personal information?
`,
      question3: `3. When encountering suspicious messages, will you be vigilant?

`,
    },
    bloodType: {
      select: `[Translation Needed: onboarding.bloodType.select]`,
    },
    example: {
      birthday: `例如：1995-06-15`,
    },
    gender: {
      female: `Female`,
      label: `• Gender: \${gender}
 {updatedUser.gender === 'male' ? '男性' : '女性'} \${gender}`,
      male: `Male`,
    },
    info: {
      age18: `• 必須年滿 18 歲才能使用本服務`,
      city: `🌍 地區：{city}`,
    },
    prompt: {
      birthday: `請輸入你的生日（格式：YYYY-MM-DD）：`,
    },
    terms: {
      agree_button: `✅ I Agree`,
      english_only_note: `[Translation needed: onboarding.terms.english_only_note]`,
      privacy_policy_button: `🔒 Privacy Policy`,
      terms_of_service_button: `📋 Terms of Service`,
    },
    warning: {
      birthday: `⚠️ 生日設定後無法修改，請確認無誤！`,
    },
  },
  payments: {
    empty: `No payment records found.`,
    title: `💳 Payment History (Page {page} / {total})`,
    product: {
      VIP_MONTHLY: `💎 VIP Monthly Subscription`,
    },
    status: {
      failed: `❌ Payment Failed`,
      paid: `✅ Payment Successful`,
      pending: `⏳ Processing`,
      refunded: `↩️ Refunded`,
    },
  },
  profile: {
    activatedInvites: `✅ Activated invites: {successfulInvites} / {inviteLimit} people
`,
    age: `🎂 Age: \${age}
`,
    anonymousUser: `Anonymous User`,
    bloodType: `🩸 Blood type: \${bloodType}
`,
    bottle: `: permanentQuota} message bottles

`,
    cardAge: `{age} years old`,
    cardBio: `📝 Bio:
{bio}

`,
    cardFooter: `💡 This is the data card displayed to others in the conversation

`,
    cardGenderFemale: `♀️ Female`,
    cardGenderMale: `♂️ Male`,
    cardInterests: `🏷️ Interests: {interests}

`,
    cardLanguage: `🌍 Language: {language}

`,
    cardMbti: `🧠 MBTI: {mbti}
`,
    cardSeparator: `━━━━━━━━━━━━━━━━
`,
    cardTitle: `┌─────────────────────────┐
│ 📇 Profile Card │
└─────────────────────────┘

`,
    cardZodiac: `⭐ Zodiac: {zodiac}
`,
    completeOnboarding: `⚠️ Please complete the registration process first.

Use /start to continue registration.`,
    conversation: `💡 This is the data card you display to the other person in the conversation

`,
    editProfile: `📝 Edit Information`,
    gender: `👤 Gender: \${gender}
`,
    hints: `💡 Tip: 
`,
    invite: `⏳ Pending invitations to activate: \${inviteStats.pending} people
`,
    invite2: `🎁 **Invitation Information**

`,
    inviteCodeLabel: `📋 Your invite code: \`{inviteCode}\`
`,
    manual: `Manual Settings`,
    mbti: `• Use /mbti to retake or modify MBTI
`,
    mbtiWithSource: `🧠 MBTI: {mbti}{source}
`,
    message: `https://t.me/share/url?url=https://t.me/\${botUsername}?start=invite_\${inviteCode}&text=Let's throw message bottles together on XunNi! 🍾 Use my invitation code: \${inviteCode} https://t.me/share/url?url=https://t.me/\${botUsername}?start=invite_\${inviteCode}&text=來`,
    message2: `\${inviteLimitWarning}

`,
    message3: `🌍 Language: \${user.language_pref}

`,
    message4: `🌍 Language: \${user.language_pref}
`,
    message5: `📈 Conversion Rate: \${inviteStats.conversionRate}%
`,
    message6: `\${gender} • \${age} years old • \${city}

`,
    message7: `https://t.me/share/url?url=https://t.me/\${botUsername}?start=invite_\${inviteCode}&text=Let's throw message bottles together on XunNi https://t.me/share/url?url=https://t.me/\${botUsername}?start=invite_\${inviteCode}&text=來`,
    mysterious: `This person is quite mysterious, leaving nothing behind～`,
    nickname: `📛 Nickname: \${displayNickname}
`,
    notSet: `Not Set`,
    profile: `│ 📇 Profile Card │
`,
    profile2: `👤 **Profile**

`,
    quota: `💡 Complete tasks to earn additional daily quota (use /tasks to view)
`,
    quota2: `📦 Current Daily Quota: \${taskBonus > 0 ?`,
    quotaBottles: `{taskBonus} bottles`,
    quotaTotal: `📦 Current daily quota: {quota}

`,
    returnToMenu: `🏠 Back to main menu: /menu`,
    separator: `━━━━━━━━━━━━━━━━

`,
    settings: `Not set`,
    settings2: `Not set`,
    settings3: `Not set`,
    settings4: `Not set`,
    settings5: `Not set`,
    settings6: `Not set`,
    settings7: `Not set`,
    settings8: `Not Set`,
    shareInviteCode: `📤 Share invitation code`,
    short: `📝 Edit Profile`,
    short2: `Free Member`,
    stats: `• Use /stats to view statistics

`,
    success: `💡 For each successful invitation of 1 person, your daily quota increases by +1 permanently
`,
    systemError: `❌ An error occurred. Please try again later.`,
    test: `Test results`,
    text: `• Use /profile_card to view the complete profile card
`,
    text2: `🏷️ Interests: \${interests}

`,
    text3: `💎 Membership: \${vipStatus}

`,
    text4: `📝 Bio:
\${bio}

`,
    text5: `This person is very mysterious, leaving nothing behind～`,
    userNotFound: `⚠️ User does not exist. Please register using /start first.`,
    vip: `VIP Member (Expires: \${expireDate})`,
    vip2: `• Use /vip to upgrade to VIP Member
`,
    vipUpgrade: `• Upgrade to VIP member using /vip
`,
    zodiac: `⭐ Zodiac: \${zodiac}
`,
  },
  refreshAvatar: {
    failed: `❌ Failed to refresh avatar

Please try again later or contact the admin.`,
    processing: `🔄 Refreshing avatar...

This may take a few seconds.`,
    success: `✅ **Avatar updated!**

Your avatar cache has been refreshed. The latest avatar will be displayed in chat history next time you view it.

💡 **Tip:**
• The avatar updates automatically every 7 days
• If you change your Telegram avatar, it will be detected automatically
• You can also manually refresh using this command anytime`,
    userNotFound: `❌ User does not exist. Please register first.`,
  },
  refreshConversations: {
    clickButtonHint: `💡 **Tip**: Please click the button above to get started`,
    commandHelp: `• /help - View Help`,
    commandMenu: `• /menu - Main Menu`,
    commandTasks: `• /tasks - View Task Center`,
    failed: `❌ Failed to refresh chat history

Please try again later or contact the admin.`,
    noHistory: `💡 **No chat history found**

You haven't had any chat records yet.

Use /throw to throw a message bottle and start chatting!`,
    partialSuccess: `⚠️ **Partial Update of Conversation History**

Successfully refreshed: {updated}
Failed: {failed}

Some conversation history may not have updated; please try again later.`,
    processing: `🔄 Refreshing all chat history...

This may take some time, please wait.`,
    success: `✅ **Conversation History Updated!**

Successfully refreshed {updated} conversation history posts.

💡 **Tip:**
• VIP users can see clear profile pictures
• Free users see blurred profile pictures
• Upgrading to VIP will automatically refresh history posts`,
    userNotFound: `❌ User does not exist. Please register first.`,
  },
  report: {
    blockHint: `• Long press the other person's message to reply /block to block this user
`,
    cancel: `❌ Cancel`,
    cancelled: `Cancelled`,
    cannotIdentify: `⚠️ Cannot identify chat partner

`,
    catchHint: `• Use /catch to catch new message bottles`,
    completeOnboarding: `⚠️ Please complete the registration process first.

Use /start to continue registration.`,
    conversationInfoError: `⚠️ Conversation information is incorrect.`,
    conversationInfoError2: `⚠️ Conversation information is incorrect`,
    conversationNotExists: `⚠️ Conversation does not exist`,
    conversationNotFound: `⚠️ This conversation cannot be found

The conversation may have ended or does not exist.`,
    ensureReply: `Please ensure you are replying to the message sent by the other party (with the # identifier).`,
    hint: `💡 This allows you to accurately specify the target for reporting.`,
    multipleReports: `Multiple reports`,
    reasonHarassment: `😡 Harassment / Abuse`,
    reasonNsfw: `🔞 Adult content`,
    reasonOther: `⚠️ Other violations`,
    reasonScam: `💰 Fraud / Phishing`,
    reasonSpam: `📢 Spam`,
    replyRequired: `⚠️ Please long press the message you want to report and then reply with the command

`,
    selectReason: `Please select a reason for reporting:`,
    sessionExpired: `⚠️ The conversation has expired, please try again`,
    step1: `1️⃣ Long press the other party's message
`,
    step2: `2️⃣ Select 'Reply'
`,
    step3: `3️⃣ Enter /report

`,
    steps: `**Operation Steps:**
`,
    submitted: `✅ **Report Submitted** (#{identifier})

`,
    systemError: `❌ An error has occurred in the system`,
    thanks: `Thank you for your report, we will review it as soon as possible.

`,
    tips: `💡 Tip：
`,
    title: `🚨 **Report Inappropriate Content** (#{identifier})

`,
    userNotFound: `⚠️ User does not exist, please register first using /start.`,
  },
  risk: {
    containsSensitiveWords: `Contains sensitive words`,
  },
  router: {
    replyPrompt: `💬 Reply`,
    suggestCatch: `❓ Want to catch a message bottle?

Use /catch to pick up a message bottle

💡 **Common Commands**: 
• /throw - Throw a message bottle
• /catch - Pick up a message bottle
• /menu - Main menu
• /tasks - Task center`,
    suggestMenu: `❓ Command not found

💡 **Common Commands**：
• /throw - Throw a message bottle
• /catch - Catch a message bottle
• /menu - Main Menu
• /tasks - Task Center`,
    suggestThrow: `❓ Want to throw a message bottle?

Please long press the previous message or this message,
select 'Reply' from the menu,
then enter the content of the message bottle to send

💡 **Common Commands**：
• /throw - Throw a message bottle
• /catch - Catch a message bottle
• /menu - Main Menu
• /tasks - Task Center

#THROW`,
    throwPrompt: `📝 Please enter your message bottle content:`,
  },
  session: {
    timeoutCatchBottle: `⏰ Message bottle catching process has timed out

Please use /catch to restart.`,
    timeoutConversation: `⏰ Conversation has timed out

The other party may have left. Use /catch to catch new bottles!`,
    timeoutEditProfile: `⏰ Data editing process has timed out

Please restart editing.`,
    timeoutOnboarding: `⏰ Registration process has timed out

Please use /start to restart registration.`,
    timeoutThrowBottle: `⏰ Message bottle throwing process has timed out

Please use /throw to restart.`,
    typeCatchBottle: `Message bottle process`,
    typeConversation: `Conversation`,
    typeEditProfile: `Edit profile`,
    typeOnboarding: `Registration Process`,
    typeThrowBottle: `Message Bottle Throwing Process`,
  },
  settings: {
    back: `Back`,
    changeLanguage: `🌐 Change Language`,
    currentSettings: `⚙️ **Current Settings**`,
    languageLabel: `語言：{language}`,
    languageUpdated: `✅ Language updated to: {language}`,
    message: `🌐 **Choose Language / 选择语言**

Please select your preferred language:`,
    returnToMenu: `🏠 Return to Menu`,
    selectOption: `[Need Translation: settings.selectOption]`,
    settings: `💡 Choose the settings you want to modify:`,
    settings2: `⚙️ **Settings**

`,
    settings3: `🏠 Back to Settings`,
    settings4: `Current Settings：
`,
    text: `• Language：\${languageName} 🇹🇼

`,
    title: `🏠 **Main Menu**`,
  },
  stats: {
    activeUsers: `• Active Yesterday: {active}

`,
    age: `🎂 **Age**：\${age} years old
`,
    avgMatches: `• Average matches per pairing: \${avg} objects
`,
    bottle: `
💎 **VIP Triple Bottle Stats** (Last 30 Days)
`,
    bottle2: `🍾 **Message Bottle**
`,
    bottle3: `🎈 Message Bottle Stats
`,
    bottles: `🍾 **Message Bottle**
`,
    bottlesCaught: `• Found: \${count} items
`,
    bottlesThrown: `• Dispatched: \${count} items
`,
    catch: `• Caught Yesterday：\${stats.caughtBottles}

`,
    catch2: `• Caught：\${stats.bottlesCaught} bottles
`,
    caught: `• Caught Yesterday: {caught}

`,
    conversation: `• Active Conversations：\${stats.activeConversations}
`,
    conversation2: `• Total Conversations：\${stats.totalConversations}
`,
    conversation3: `• Total Conversations：\${stats.totalConversations}`,
    conversation4: `💬 **Conversations**
`,
    conversation5: `💬 Conversation Stats
`,
    conversations: `💬 **Conversations**
`,
    conversationsActive: `• Active conversations: \${count}
`,
    conversationsTotal: `• Total number of conversations: \${count}
`,
    date: `Date: {date}

`,
    dateFormatError: `Date format error, should be YYYY-MM-DD`,
    match: `🎯 **Matching**
`,
    matchRate: `• Matching success rate: \${rate}%
`,
    matchRateValue: `• Pairing rate: \${rate}%
`,
    matchedSlots: `• Successful matches: \${count}
`,
    mbti: `🧠 **MBTI**: \${mbti}
`,
    message: `• Expiration Time：\${expireDate}
`,
    message10: `• Total messages: \${stats.totalMessages}`,
    message2: `\${used}/\${permanentQuota}+\${taskBonus} (Remaining \${remaining})`,
    message3: `Report generation time: \${new Date().toLocaleString('zh-TW')}`,
    message4: `\${used}/\${permanentQuota} (Remaining \${remaining})`,
    message5: `• Total messages: \${stats.totalMessages}

`,
    message6: `• New messages yesterday: \${stats.newMessages}

`,
    message7: `• Total pairing slots: \${vipStats.totalSlots}
`,
    message8: `• Average reply rate: \${stats.replyRate}%

`,
    message9: `• Active users yesterday: \${stats.activeUsers}

`,
    messages: `💬 Conversation Statistics`,
    messagesTotal: `• Total messages: \${count}
`,
    new: `• New Yesterday: {new}`,
    newMessages: `• New Messages Yesterday: {new}

`,
    newUsers: `• New Yesterday: {new}`,
    newVip: `• New Yesterday: {new}

`,
    notSet: `Not set`,
    quota: `• Today's quota: \${stats.todayQuota.display}

`,
    register: `📅 **Registration time**: \${new Date(user.created_at).toLocaleDateString('zh-TW')}
`,
    register2: `• Total registrations: \${stats.totalUsers}`,
    registerTime: `📅 **Registration Time**: \${date}
`,
    replyRate: `• Average Reply Rate: \${rate}%
`,
    reportTime: `Report Generation Time: {time}`,
    separator: `---
`,
    settings: `🧠 **MBTI**: \${mbti}

 \${mbti}`,
    settings2: `Not set`,
    short: `Free member`,
    statDateEmpty: `Statistics date cannot be empty`,
    stats: `📊 **My statistics**

`,
    stats2: `💎 VIP statistics
`,
    stats3: `👥 User statistics
`,
    stats4: `Statistics date cannot be empty`,
    success: `• Successful match: \${vipStats.matchedSlots}
`,
    success2: `• Match success rate: \${stats.matchRate}%
`,
    text: `• Average matches per pairing: \${avgMatches} items
`,
    text10: `🎯 **Match**
`,
    text2: `• New yesterday: \${stats.newBottles}
`,
    text3: `• Total: \${stats.totalBottles}`,
    text4: `• New users yesterday: \${stats.newUsers}
`,
    text5: `• New VIPs yesterday: \${stats.newVip}

`,
    text6: `• Matching rate: \${matchRate}%
`,
    text7: `📊 XunNi Bot Daily Data Report
`,
    text8: `Date format error, should be YYYY-MM-DD`,
    text9: `Date: \${dateStr}

`,
    throw: `• Thrown: \${stats.bottlesThrown} items
`,
    throw2: `• Throw count: \${vipStats.throws}
`,
    throws: `• Sent Count: \${count}
`,
    timeLeftDaysHours: `\${days} days \${hours} hours`,
    timeLeftHours: `\${hours} hours`,
    title: `📊 **My Statistics**

`,
    todayQuota: `• Today's Quota: \${display}

`,
    total: `• Total: {total}`,
    totalConversations: `• Total Conversations: {total}`,
    totalMessages: `• Total Messages: {total}`,
    totalSlots: `• Total Matching Slots: \${count}
`,
    totalUsers: `• Total Registrations: {total}`,
    totalVip: `• Total VIP: {total}`,
    totalWithDiff: `• Total: {total} ({diff})`,
    users: `👥 User Statistics`,
    vip: `⭐ **VIP Status**
`,
    vip2: `⭐ **VIP Status**
`,
    vip3: `VIP Member 💎`,
    vipAvgMatches: `• Average Matches per Attempt: {avg} Objects`,
    vipExpire: `• Expiration Time: \${date}
`,
    vipFree: `Free Member`,
    vipMatchRate: `• Matching Rate: {rate}%`,
    vipMatchedSlots: `• Successful Matches: {count}`,
    vipMember: `VIP Member 💎`,
    vipThrows: `• Sent Count: {count}`,
    vipTotalSlots: `• Total Matching Slots: {count}`,
    vipTriple: `💎 **VIP Triple Message Bottle Statistics** (Last \${days} Days)`,
    vipTripleTitle: `💎 **VIP Triple Message Bottle Statistics** (Last {days} Days)`,
    zodiac: `🔮 **Zodiac**: \${zodiac}
`,
  },
  status: {
    cancelled: `Cancelled`,
    completed: `Completed`,
    failed: `Failed`,
    pending: `Pending`,
    sending: `Sending`,
  },
  subscription: {
    downgradedToFree: `Your account has been restored to free member level.`,
    expired: `😢 **VIP subscription has expired**`,
    expiredDate: `Your VIP subscription expired on \${date}.`,
    renewVipHint: `💡 You can resubscribe to VIP anytime: /vip`,
    thankYou: `Thank you for your support!❤️`,
  },
  success: {
    ad: `✅ You have already viewed all official ads!`,
    ad2: `✅ Ad provider enabled: \${providerName}

`,
    ad3: `✅ Ad provider disabled: \${providerName}

`,
    ad4: `✅ Official ad enabled #\${adId}

`,
    ad5: `✅ Official ad disabled #\${adId}

`,
    ad6: `✅ Ad provider priority set

`,
    ad7: `✅ Today's ad limit reached`,
    appeal: `✅ Appeal \${appealId} approved, user has been unblocked`,
    appeal2: `✅ Appeal \${appealId} denied`,
    appeal3: `✅ No pending appeals`,
    birthday: `✅ Birthday has been saved`,
    bloodType: `✅ Blood type has been updated to \${getBloodTypeDisplay(bloodType as any)}`,
    bloodType2: `✅ Blood type has been cleared`,
    bottle: `✅ Rewards distributed! +1 message bottle`,
    bottle2: `✅ Start a new message bottle`,
    bottle3: `✅ Message bottle has been created
`,
    broadcast: `✅ Cleared \${ids.length} stuck broadcasts

`,
    broadcast2: `✅ No broadcasts need clearing

`,
    broadcast3: `✅ Filtered broadcasts created

`,
    broadcast4: `✅ Broadcast created

`,
    cancel: `✅ Broadcast canceled

`,
    complete: `✅ Broadcast queue processing completed

`,
    complete2: `✅ System maintenance completed

`,
    complete3: `✅ Tutorial completed!`,
    complete4: `✅ **Batch refresh completed**

`,
    complete5: `✅ **Refresh completed**

`,
    complete6: `✅ Filtering completed, enter content`,
    complete7: `✅ Filtering complete`,
    confirm: `✅ Confirmed!`,
    confirm2: `✅ Security check completed`,
    confirm3: `✅ Confirm`,
    conversation: `✅ **Conversation history has been updated!**

`,
    gender: `✅ Gender has been saved`,
    invite: `✅ Invites activated: \${successfulInvites} / \${inviteLimit} people
`,
    mbti: `✅ Your MBTI type has been updated to: **\${mbtiType}**

`,
    mbti2: `✅ Your MBTI type has been cleared.

`,
    mbti3: `✅ MBTI has been cleared`,
    mbti4: `✅ MBTI selection has been cleared`,
    mbti5: `✅ Your MBTI type: \${mbtiType}

`,
    message: `✅ Message sent to \${formatIdentifier(receiverIdentifier)}

`,
    message2: `✅ Language has been updated to: \${getLanguageDisplay(languageCode)}`,
    message3: `✅ User blocked (#\${conversationIdentifier})

`,
    message4: `✅ Earned +\${ad.reward_quota} permanent quotas!`,
    message5: `✅ Selected \${gender} {gender === 'male' ? '男生' : gender === 'female' ? '女生' : '任何人'} \${gender}`,
    message6: `✅ Selected \${bloodTypeDisplay[bloodType]}`,
    message7: `✅ Selected \${ZODIAC_NAMES[zodiacSign]}`,
    message8: `You selected: \${gender}`,
    nickname: `✅ Using Telegram nickname: \${suggestedNickname.substring(0, 18)}`,
    nickname2: `✅ Nickname updated to: \${text}

`,
    register: `✅ Developer mode: Skip registration

`,
    register2: `✅ I understand, continue registration`,
    register3: `✅ Registration completed!`,
    report: `✅ **Report has been submitted** (#\${conversationIdentifier})

`,
    report2: `✅ Report has been submitted`,
    report3: `✅ **User has been reported**

`,
    report4: `✅ Confirm report`,
    report5: `✅ Reported`,
    reportSubmitted: `[Translation needed from zh-TW.ts]`,
    settings: `✅ MBTI has been set to \${mbtiType}`,
    settings2: `✅ Nickname has been set`,
    settings3: `✅ Filtering criteria have been set: 

`,
    settings4: `✅ Blood type has been set to \${getBloodTypeDisplay(bloodType as any)}`,
    settings5: `✅ MBTI type has been set: \${mbtiType}

`,
    settings6: `✅ Blood type setting skipped`,
    short: `✅ Sending...`,
    short10: `✅ Loading...`,
    short11: `✅ 🌈 Anyone`,
    short12: `✅ 👨 Male`,
    short13: `✅ 👩 Female`,
    short14: `✅ Continue editing`,
    short15: `✅ Confirm block`,
    short16: `✅ Blocked`,
    short17: `✅ I have read and agree`,
    short18: `✅ Skipped`,
    short19: `✅ Claim reward`,
    short2: `✅ Continue editing draft`,
    short20: `✅ Under maintenance`,
    short3: `✅ Draft has been deleted`,
    short4: `✅ Verify and claim`,
    short5: `✅ Send draft`,
    short6: `✅ Logged`,
    short7: `✅ Correct`,
    short8: `✅ Enabled`,
    short9: `✅ Yes`,
    start: `✅ Please click the button to start watching`,
    start2: `✅ Start quick version test`,
    start3: `✅ Start full version test`,
    start4: `✅ Start test`,
    success2: `🎉 **Verification successful!**

✅ Received **+\${ad.reward_quota} permanent quota**
💎 Thank you for joining our community!

📊 **Your quota:**
• Basic quota: \${user.is_vip ? 'Unlimited' : '10'}/day
• Permanent quota: +\${ad.reward_quota}

💡 In the community, you can:
• Communicate with other users
• Get the latest feature updates
• Participate in activities for more rewards {user.is_vip ? '無限' : '10'} \${user.is_vip ? '無限' : '10'}`,
    success3: `Successfully refreshed \${result.updated} historical posts in the conversation.

`,
    success4: `Successfully refreshed: \${result.updated}
`,
    text: `✅ Set to \${flag} \${countryName}`,
    text10: `✅ Yes, I understand and will pay attention to security`,
    text11: `✅ Maintenance mode has been enabled

`,
    text12: `✅ Maintenance mode has been disabled

`,
    text13: `✅ More accurate personality analysis
`,
    text14: `✅ Tutorial has been skipped

`,
    text15: `✅ All posts are up to date (free user status is correct)
`,
    text16: `✅ **No need to refresh**

`,
    text17: `✅ Selected \${gender ===`,
    text18: `✅ Selected \${mbtiType}`,
    text19: `✅ **Rules**:
`,
    text2: `✅ Interest tags updated: 

\${interestsStr}`,
    text20: `✅ **User has been blocked**

`,
    text21: `✅ **Refund request has been submitted**

`,
    text22: `✅ **Refund has been approved**

`,
    text23: `✅ No pending refund requests.`,
    text24: `✅ Preparing for payment...`,
    text25: `✅ Refund has been approved

`,
    text26: `✅ Refund has been denied

`,
    text27: `✅ I have joined and claimed the reward`,
    text28: `✅ You selected: \${gender ===`,
    text29: `✅ Anti-fraud test passed!

`,
    text3: `✅ Match preference updated to: \${prefText}

`,
    text30: `✅ Language has been changed to \${newLanguageName}`,
    text4: `✅ Profile updated!

\${text}`,
    text5: `✅ Development mode: Data has been reset

`,
    text6: `✅ Region has been updated to: \${text}`,
    text7: `✅ Quick understanding of basic personality types

`,
    text8: `✅ **Avatar has been updated!**

`,
    text9: `✅ Recommended for retesting

`,
    verify: `✅ Verification successful! Earned +\${ad.reward_quota} permanent credits!`,
    verify2: `✅ Verification Successful! You have received +\\\${ad.reward_quota} permanent credits!`,
    vip: `✅ All posts are up to date (VIP status is correct)
`,
    zodiac: `✅ Zodiac selection cleared`,
    success: {
      appeal: `✅ Appeal \\\${appealId} approved, user unblocked`,
      appeal2: `✅ Appeal \\\${appealId} denied`,
      appeal3: `✅ No pending appeals`,
      birthday: `✅ Birthday saved`,
      bloodType: `✅ Blood type updated to \\\${getBloodTypeDisplay(bloodType as any)}`,
      bloodType2: `✅ Blood type cleared`,
      bottle: `✅ Reward issued! +1 message bottle`,
      bottle2: `✅ Started a new message bottle`,
      bottle3: `✅ Message bottle created
`,
      broadcast: `✅ Cleared \\\${ids.length} stuck broadcasts

`,
      broadcast2: `✅ No broadcasts to clean up

`,
      broadcast3: `✅ Filtered broadcasts created

`,
      broadcast4: `✅ Broadcast created

`,
      cancel: `✅ Broadcast cancelled

`,
      complete: `✅ Broadcast queue processing completed

`,
      complete2: `✅ System maintenance completed

`,
      complete3: `✅ Tutorial completed!`,
      complete4: `✅ **Batch refresh completed**

`,
      complete5: `✅ **Refresh completed**

`,
      complete6: `✅ Filtering completed, enter content`,
      complete7: `✅ Filtering complete`,
      confirm: `✅ Confirmed!`,
      confirm2: `✅ Safety confirmation completed`,
      confirm3: `✅ Confirm`,
      conversation: `✅ **Chat history updated!**

`,
      gender: `✅ Gender has been saved`,
      invite: `✅ Invitation activated: \\\${successfulInvites} / \\\${inviteLimit} people
`,
      mbti: `✅ Your MBTI type has been updated to: **\\\${mbtiType}**

`,
      mbti2: `✅ Your MBTI type has been cleared.

`,
      mbti3: `✅ MBTI cleared`,
      mbti4: `✅ MBTI selection cleared`,
      mbti5: `✅ Your MBTI type: \\\${mbtiType}

`,
      message: `✅ Message sent to \\\${formatIdentifier(receiverIdentifier)}

`,
      message2: `✅ Language updated to: \\\${getLanguageDisplay(languageCode)}`,
      message3: `✅ This user has been blocked (#\\\${conversationIdentifier})

`,
      message4: `✅ Received +\\\${ad.reward_quota} permanent slots!`,
      message5: `✅ Selected \\\${gender} {gender === 'male' ? '男生' : gender === 'female' ? '女生' : '任何人'} \${gender}`,
      message6: `✅ Selected \\\${bloodTypeDisplay[bloodType]}`,
      message7: `✅ Selected \\\${ZODIAC_NAMES[zodiacSign]}`,
      message8: `✅ You selected: \\\${gender}

 {gender === 'male' ? '👨 男性' : '👩 女性'} \${gender}`,
      nickname: `✅ Using Telegram nickname: \\\${suggestedNickname.substring(0, 18)}`,
      nickname2: `✅ Nickname updated to: \\\${text}

`,
      register: `✅ Development mode: Skip registration

`,
      register2: `✅ I understand, continue registration`,
      register3: `✅ Registration completed!`,
      report: `✅ **Report submitted** (#\\\${conversationIdentifier})

`,
      report2: `✅ Report submitted`,
      report3: `✅ **User reported**

`,
      report4: `✅ Confirm report`,
      report5: `✅ Reported`,
      settings: `✅ MBTI set to \\\${mbtiType}`,
      settings2: `✅ Nickname set`,
      settings3: `✅ Filter criteria set: 

`,
      settings4: `✅ Blood type set to \\\${getBloodTypeDisplay(bloodType as any)}`,
      settings5: `✅ MBTI type set: \\\${mbtiType}

`,
      settings6: `✅ Blood type setting skipped`,
      short: `✅ Sending...`,
      short10: `✅ Loading...`,
      short11: `✅ 🌈 Anyone`,
      short12: `✅ 👨 Male`,
      short13: `✅ 👩 Female`,
      short14: `✅ Continue editing`,
      short15: `✅ Confirm block`,
      short16: `✅ Blocked`,
      short17: `✅ I have read and agree`,
      short18: `✅ Skipped`,
      short19: `✅ Claim Reward`,
      short2: `✅ Continue Editing Draft`,
      short20: `✅ Under Maintenance`,
      short3: `✅ Draft Deleted`,
      short4: `✅ Verify and Claim`,
      short5: `✅ Send Draft`,
      short6: `✅ Logged`,
      short7: `✅ Correct`,
      short8: `✅ Enabled`,
      short9: `✅ Yes`,
      start: `✅ Please click the button to start watching`,
      start2: `✅ Start Quick Test`,
      start3: `✅ Start Full Test`,
      start4: `✅ Start Test`,
      text: `✅ Set as \\\${flag} \\\${countryName}`,
      text10: `✅ Yes, I understand and will pay attention to safety`,
      text11: `✅ Maintenance Mode Enabled

`,
      text12: `✅ Maintenance Mode Disabled

`,
      text13: `✅ More accurate personality analysis
`,
      text14: `✅ Tutorial skipped

`,
      text15: `✅ All posts are up to date (free user status is correct)
`,
      text16: `✅ **No need to refresh**

`,
      text17: `✅ Selected \\\${gender ===`,
      text18: `✅ Selected \\\${mbtiType}`,
      text19: `✅ **Rules**：
`,
      text2: `✅ Interest tags updated: 

\\\${interestsStr}`,
      text20: `✅ **User has been blocked**

`,
      text21: `✅ **Refund request submitted**

`,
      text22: `✅ **Refund approved**

`,
      text23: `✅ No pending refund requests.`,
      text24: `✅ Preparing payment...`,
      text25: `✅ Refund approved

`,
      text26: `✅ Refund denied

`,
      text27: `✅ I have joined and claimed the reward`,
      text28: `✅ Your selection: \\\\$ {gender ===`,
      text29: `✅ Anti-fraud test passed!

`,
      text3: `✅ Matching preferences updated to: \${prefText}

`,
      text30: `✅ Language changed to \\\${newLanguageName}`,
      text4: `✅ Profile updated!

\\\${text}`,
      text5: `✅ Development mode: Data has been reset

`,
      text6: `✅ Region updated to: \\\${text}`,
      text7: `✅ Quick understanding of basic personality types

`,
      text8: `✅ **Avatar updated!**

`,
      text9: `✅ Recommended for retesting

`,
      vip: `✅ All posts are up to date (VIP status accurate)
`,
      zodiac: `✅ Zodiac selection cleared`,
    },
  },
  target: {
    all: `All Users`,
    nonVip: `Non-VIP Users`,
    unknown: `Unknown`,
    vip: `VIP Users`,
  },
  tasks: {
    bottle: `Reward: +\${task.reward_amount} message bottles (\${rewardTypeText})

 {task.reward_type === 'daily' ? '當天有效' : '永久有效'} \${rewardTypeText}`,
    bottle2: `Reward: +\${task.reward_amount} message bottles (\${task.reward_type ===`,
    bottle3: `\${icon} \${task.name} (+\${task.reward_amount} message bottles)
`,
    bottle4: `• Permanent reward: \${inviteProgress.current} message bottles (distributed daily)
`,
    bottle5: `• One-time reward: \${todayRewardCount} message bottles (valid for the day)
`,
    bottle6: `📋 **Task Center**

Complete tasks to earn extra message bottles!

`,
    invite: `🔄 Invite friends (\${inviteProgress.current}/\${inviteProgress.max})
`,
    invite2: `For each person invited → permanent daily quota +1
`,
    message: `\${icon} \${task.name} \${status} (+\${task.reward_amount} message bottles)
`,
    message2: `Click the button below to join the XunNi official channel for the latest news and events!

`,
    profile: `👤 **Profile Tasks** (\${completedCount}/\${profileTasks.length})
`,
    quota: `Current daily quota: \${calculateDailyQuota(user)} bottles
`,
    short: `(Pending collection)`,
    short2: `Valid for the day`,
    short3: `Permanent validity`,
    task: `• Invite Task: \${inviteProgress.current}/\${inviteProgress.max} in progress

`,
    task2: `📱 **Social Media Tasks** (\${completedCount}/\${socialTasks.length})
`,
    task3: `🎯 **Action Tasks** (\${completedCount}/\${actionTasks.length})
`,
    task4: `• One-time Tasks: \${oneTimeCompleted}/\${oneTimeTotal} completed
`,
    task5: `🎉 Congratulations on completing the task "\${task.name}"!

`,
    task6: `👥 **Invite Tasks** (Ongoing)
`,
    task7: `💡 Use /tasks to view the task center`,
    text: `After joining, click the 'I have joined' button to collect rewards 🎁`,
    text2: `📢 **Join the Official Channel**

`,
    text3: `📊 **Total Progress**
`,
    text4: `🎁 **Acquired**
`,
    description: {
      bio: `Share your story (at least 20 words)`,
      city: `Find friends in the same city`,
      first_bottle: `Start your social journey`,
      first_catch: `Check out others' stories`,
      first_conversation: `Make your first connection (long press message → select 'Reply')`,
      interests: `Let others get to know you better`,
      invite_progress: `For each person invited, permanent daily quota +1 (free for up to 10 people, VIP up to 100 people)`,
      join_channel: `Get the latest news and events`,
    },
    name: {
      bio: `Complete your profile`,
      city: `Set your area`,
      first_bottle: `Throw out the first message bottle`,
      first_catch: `Pick up the first message bottle`,
      first_conversation: `Start the first conversation`,
      interests: `Fill in interest tags`,
      invite_progress: `Invite friends`,
      join_channel: `Join the official channel`,
    },
  },
  throw: {
    age: `• Age range is similar ✓`,
    back: `↩️ Return to filter menu`,
    bloodType: `🩸 **Blood Type Filter**

`,
    bloodType2: `• Blood type: filter specific blood types
`,
    bloodType3: `Select the blood type you'd like to match with:`,
    bloodType4: `🩸 Blood type filter`,
    bloodType5: `🌈 Any blood type`,
    bottle: `
💡 This message bottle is a great match for you!

`,
    bottle10: `🍾 Message bottle has been thrown!

`,
    bottle11: `🍾 Throw Message Bottle`,
    bottle2: `🎯 Your message bottle has been sent to **3 recipients**: 
`,
    bottle3: `🍾 **Throwing your message bottle...**

`,
    bottle4: `🍾 **Throw Message Bottle** #THROW

`,
    bottle5: `Bottle ID: #\${bottleId}

`,
    bottle6: `📝 **Please enter the content of your message bottle**

`,
    bottle7: `1️⃣ Click the button below「🍾 Throw Message Bottle」
`,
    bottle8: `📝 Please enter the content of your message bottle: 

`,
    bottle9: `📝 Please enter the content of your message bottle:`,
    cancel: `💡 Click to select or cancel MBTI type:`,
    cancel2: `💡 Click to select or cancel zodiac sign:`,
    catch: `• Slot 3: Public pool (waiting to be picked up)

`,
    catch2: `• Slot 2: Public pool (waiting to be picked up)
`,
    catch3: `• Slot 1: Public pool (waiting to be picked up)
`,
    catch4: `🌊 Waiting for a fateful encounter...
`,
    complete: `⚙️ **Advanced Filter**

\${summary}
💡 Continue adjusting or complete the filter:`,
    complete2: `🎯 **Pairing #1 is complete:**
`,
    complete3: `📝 You have an unfinished draft

`,
    complete4: `⏳ Estimated completion in 3-5 seconds`,
    complete5: `⏳ Estimated completion in 2-3 seconds`,
    complete6: `⏳ Estimated completion in 1-2 seconds`,
    conversation: `💬 Conversation Identifier: \${vipMatchInfo.conversationIdentifier}

`,
    conversation2: `💡 Tip: Each conversation is independent and can occur simultaneously

`,
    conversation3: `💡 You may receive **up to 3 conversations**!
`,
    conversation4: `💬 You may receive **up to 3 conversations**!
`,
    conversation5: `Use /chats to view all conversations

`,
    conversation6: `📊 Use /chats to view all conversations`,
    conversation7: `Use /chats to view all conversations`,
    currentSelection: `Current selection: {genderText}`,
    friendlyContent: `[Translation needed from zh-TW.ts]`,
    gender: `• Gender: \${selectedGender === 'male' ? '👨 Male' : selectedGender === 'female' ? '👩 Female' : '🌈 Anyone'}
`,
    gender2: `👤 **Gender Filter**

`,
    gender3: `• Gender: Filter by gender

`,
    gender4: `💡 Choose your preferred gender:`,
    gender5: `👤 Gender Filter`,
    genderLabel: `• Gender: {gender}
`,
    mbti: `• MBTI: \${selectedMBTI.length > 0 ? selectedMBTI.join(', ') : 'No Limit'}
 {selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '無限制'} \${selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '無限制'}`,
    mbti2: `Selected: \${selectedMBTI.length > 0 ? selectedMBTI.join(', ') : 'None'}

 {selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '無'} \${selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '無'}`,
    mbti3: `Selected: \${selectedZodiac.length > 0 ? selectedZodiac.map((z) => ZODIAC_NAMES[z]).join(', ') : 'None'}

`,
    mbti4: `🧠 **MBTI Filter**

`,
    mbti5: `• MBTI: Filter by specific personality types
`,
    mbti6: `• High compatibility with MBTI ✓`,
    mbti7: `🧠 MBTI Filter`,
    mbtiLabel: `• MBTI: {mbti}
`,
    message: `Current selection: \${currentGender === 'male' ? '👨 Male' : currentGender === 'female' ? '👩 Female' : '🌈 Anyone'}

`,
    message2: `Selected: \${selectedZodiac.length > 0 ? selectedZodiac.map((z) => ZODIAC_NAMES[z]).join(`,
    message3: `) : 'None'}
Current selection: \${bloodTypeDisplay[currentBloodType]}

`,
    message4: `{bloodTypeDisplay[currentBloodType]} \${bloodTypeDisplay[currentBloodType]}`,
    message5: `👤 Opponent: \${vipMatchInfo.matcherNickname}
`,
    message6: `"Hello! I am someone who loves music and movies, and I hope to meet like-minded friends~"

`,
    message7: `💡 You can modify your matching preferences in /edit_profile

`,
    message8: `💬 Press /reply to start chatting
`,
    nickname: `📝 Opponent Nickname: \${matchedUserMaskedNickname}
`,
    quota: `• More quotas (30 per day)
`,
    quota2: `🎁 Invite friends to increase your quota:
`,
    selected: `已選擇：{selected}`,
    settings: `🧠 MBTI: \${mbti}
 \${mbti}`,
    settings2: `⭐ Zodiac: \${zodiac}
 \${zodiac}`,
    settings3: `🧠 MBTI: \${mbti}
 \${mbti}`,
    settings4: `⭐ Zodiac: \${zodiac}
 \${zodiac}`,
    settings5: `Not Set`,
    settings6: `Not Set`,
    settings7: `Not Set`,
    settings8: `Not Set`,
    short: `• Same language ✓`,
    short10: `♋ Cancer`,
    short11: `♌ Leo`,
    short12: `♍ Virgo`,
    short13: `♎ Libra`,
    short14: `♏ Scorpio`,
    short15: `♐ Sagittarius`,
    short16: `♑ Capricorn`,
    short17: `♒ Aquarius`,
    short18: `♓ Pisces`,
    short19: `Violation`,
    short2: `🩸 AB Type`,
    short20: `Unlimited`,
    short21: `Unlimited`,
    short22: `Unlimited`,
    short23: `Unlimited`,
    short3: `🌈 Anyone`,
    short4: `🩸 A Type`,
    short5: `🩸 B Type`,
    short6: `🩸 O Type`,
    short7: `♈ Aries`,
    short8: `♉ Taurus`,
    short9: `♊ Gemini`,
    start: `✍️ Restart`,
    success: `Throwing one message bottle = 3 objects, greatly enhancing matching success rate

`,
    success2: `✨ **VIP privileges activated! Intelligent matching successful!**

`,
    success3: `🎯 Your message bottle has been matched successfully!

`,
    text: `💝 Match Percentage: \${matchPercentage}%
`,
    text10: `🎯 Looking for the best match for you

`,
    text11: `
💬 Waiting for the other party's reply...
`,
    text12: `• Free users: up to +7
`,
    text13: `• Do not include personal contact information

`,
    text14: `💡 **Two input methods**:
`,
    text15: `📊 Free users: 3 per day
`,
    text16: `Choose the conditions you want to filter:

`,
    text17: `• Advanced filtering and translation

`,
    text18: `Creation Time: \${age}
`,
    text19: `Use /vip to upgrade immediately`,
    text2: `• 🆕 Three times the exposure opportunity (1 time = 3 objects)
`,
    text20: `💬 **Example**:
`,
    text21: `Use /vip to learn more`,
    text22: `Do you want to continue editing this draft?`,
    text23: `💡 You can combine multiple conditions`,
    text24: `Current filter conditions: 

`,
    text3: `💡 This may take a few seconds, we're finding the most suitable people for you`,
    text4: `Current Selection: \${currentGender ===`,
    text5: `🎯 Looking for: \${targetText}
`,
    text6: `🎯 We're looking for 3 best matches for you

`,
    text7: `📨 **2 additional slots are waiting:**
`,
    text8: `🔍 Smartly matching the best options...

`,
    text9: `Content Preview: \${preview}

`,
    throw: `📊 Today’s Sent: \${quotaDisplay}

`,
    tips: `[Translation needed from zh-TW.ts]`,
    unlimited: `Unlimited`,
    vip: `💎 VIP users: 30 per day (three times exposure)

`,
    vip2: `💎 **Upgrade to VIP for three times exposure!**
`,
    vip3: `⚙️ **Advanced filtering (VIP exclusive)**

`,
    vip4: `• VIP users: up to +70

`,
    vip5: `✨ **VIP privileges activated!**

`,
    vip6: `💡 Upgrade to VIP to get: 
`,
    vip7: `✨ VIP privileges activating
`,
    zodiac: `• Zodiac: \${selectedZodiac.length > 0 ? selectedZodiac.map((z) => ZODIAC_NAMES[z]).join(', ') : 'No Limit'}
`,
    zodiac2: `⭐ Zodiac: \${matchResult.user.zodiac ||`,
    zodiac3: `⭐ Zodiac: \${user.zodiac_sign ||`,
    zodiac4: `⭐ **Zodiac filter**

`,
    zodiac5: `• Zodiac: filter by specific zodiac signs
`,
    zodiac6: `• Highly compatible with zodiac ✓`,
    zodiac7: `⭐ Zodiac filter`,
    zodiacLabel: `• Zodiac: {zodiac}
`,
  },
  tutorial: {
    availableCommands: `You can use the following commands at any time:`,
    catchBottle: `🎣 **Pick Up Message Bottle**`,
    catchBottleDesc: `Check out others' message bottles and reply if you're interested to start chatting.`,
    clickButtonHint: `[Translation needed: tutorial.clickButtonHint]`,
    commandCatch: `• /catch - Pick up message bottle`,
    commandHelp: `• /help - View help`,
    commandMenu: `[Translation needed: tutorial.commandMenu]`,
    commandTasks: `• /tasks - View tasks`,
    commandThrow: `• /throw - Throw out message bottle`,
    completeTasksForBottles: `💡 Complete tasks to earn extra bottles`,
    completed: `✅ Tutorial completed!`,
    howToBecomeFriends: `💬 **How to make friends?**`,
    howToBecomeFriendsDesc: `You pick up a bottle and reply → They reply too → Start anonymous chatting`,
    readyToStart: `🎉 **Ready! Let's make friends～**`,
    skip: `Skip`,
    skipped: `✅ Tutorial skipped`,
    startUsing: `Start using →`,
    throwBottle: `📦 **Throw Out Message Bottle**`,
    throwBottleDesc: `Write down your feelings or thoughts, and the system will help you find the right person`,
    unknownStep: `❌ Unknown tutorial step`,
    viewTasks: `📋 View tasks`,
    welcome: `🎉 Congratulations on completing your registration!`,
    whatIsXunNi: `🌊 **What is XunNi?**`,
    whatIsXunNiDesc: `An anonymous message bottle social platform that helps you find like-minded friends through MBTI and zodiac signs.`,
  },
  vip: {
    admin: `⏳ You have a pending refund request. Please wait patiently for the admin to review it.`,
    bottle: `📝 Message bottle content: \${bottle.content.substring(0, 50)}\${bottle.content.length > 50 ? '...' : ''}

`,
    bottle2: `📝 Message bottle content: \${bottle.content.substring(0, 50)}\${bottle.content.length > 50 ?`,
    bottle3: `Your message bottle has been picked up by \${maskedMatcherNickname}!

`,
    bottle4: `The system has found a message bottle from \${maskedOwnerNickname}!

`,
    bottle5: `📝 Message bottle content: \${bottle.content}

`,
    bottle6: `• 🆕 Triple exposure opportunity! Throwing one message bottle triggers 3 targets
`,
    cancelReminderButton: `❌ Maybe later`,
    conversation: `💬 Conversation identifier: \${conversationIdentifier}
`,
    conversation2: `🔄 Updating your conversation history, clear avatar will be displayed soon...

`,
    mbti: `• Can filter matching candidates by MBTI, zodiac, and blood type
`,
    mbti2: `• Can filter matching candidates by MBTI and zodiac
`,
    mbti3: `• Can filter by MBTI and zodiac
`,
    message: `Expiration time: \${new Date(sub.expire_date).toLocaleDateString('zh-TW')}

`,
    message10: `Application number: #\${result.meta.last_row_id}
`,
    message11: `Refund amount: \${request.amount_stars} ⭐
`,
    message12: `💬 **Please long press this message, select 'Reply', and enter your content to start chatting with the other party**`,
    message13: `💡 Secure and convenient payment using Telegram Stars

`,
    message14: `💡 This is your 1st pairing, with 2 slots waiting

`,
    message2: `Application time: \${new Date(req.requested_at).toLocaleString('en-US')}
 {new Date(req.requested_at).toLocaleString('zh-TW')} \${new Date(req.requested_at).toLocaleString('zh-TW')}`,
    message3: `New expiration time: \${expireDate}

 {newExpire.toLocaleDateString('zh-TW')} \${expireDate}`,
    message4: `Expiration time: \${expireDate}

 {newExpire.toLocaleDateString('zh-TW')} \${expireDate}`,
    message5: `Payment time: \${paymentDate.toLocaleDateString('en-US')}
 {paymentDate.toLocaleDateString('zh-TW')} \${paymentDate.toLocaleDateString('zh-TW')}`,
    message6: `📋 **Pending refund requests** (\${requests.results.length})

`,
    message7: `Payment ID: \${payment.telegram_payment_charge_id}`,
    message8: `Price: \${priceStars} ⭐ Telegram Stars / month
`,
    message9: `Payment time: \${paymentDate.toLocaleDateString(`,
    purchaseCancelled: `✅ Purchase canceled`,
    quota: `• 30 message bottle quota per day (invite friends to increase, up to 100 per day)
`,
    quota2: `• 30 message bottle quota per day (up to 100 per day)
`,
    refundAdminCommands: `💡 Use the following commands to process: 
• Approve: \`/admin_approve_refund \`
• Reject: \`/admin_reject_refund \` \`/admin_approve_refund <ID>\` \`/admin_reject_refund <ID> <原因>\``,
    refundApproved: `✅ **Refund approved**

Refund amount: \${amount} ⭐
The refund will be credited within 1-3 business days.

Your VIP membership has been canceled.

Thank you for your understanding!`,
    refundApprovedAdmin: `✅ Refund approved

Request ID: #\${requestId}
User ID: \${userId}
Amount: \${amount} ⭐`,
    refundExpired: `❌ Refund request exceeded the time limit

Payment time: \${paymentDate}
Refund limit: within 7 days after payment

💡 For special circumstances, please contact customer support.`,
    refundFailed: `❌ Refund failed: \${error}`,
    refundNoPayment: `❌ Payment record not found.`,
    refundNoPending: `✅ No pending refund requests.`,
    refundPending: `⏳ You have pending refund requests, please be patient while the admin reviews.`,
    refundPendingList: `📋 **Pending refund requests** (\${count})`,
    refundReasonTooShort: `❌ The refund reason must be at least 10 characters, please re-enter:`,
    refundRejected: `❌ **Refund application has been rejected**

Reason: \${reason}

If you have any questions, please contact customer support.`,
    refundRejectedAdmin: `✅ Refund has been denied

Request ID: #\${requestId}
User ID: \${userId}`,
    refundRequestItem: `**#\${id}** - \${nickname}
User ID: \`\${userId}\`
Amount: \${amount} ⭐
Reason: \${reason}
Request time: \${requestedAt}`,
    refundRequestNotFound: `❌ Refund request does not exist or has been processed`,
    refundRequestReason: `📝 **Apply for refund**

Please enter the refund reason (at least 10 characters):`,
    refundSubmitFailed: `❌ Submission failed, please try again later.`,
    refundSubmitted: `✅ **Refund request submitted**

Request ID: #\${requestId}
Status: Pending review

We will process your request within 1-3 business days.
The result will be notified to you via Bot.

Thank you for your patience!`,
    reminderCancelled: `✅ Reminder cancelled`,
    reminderDaysLeft: `Your VIP membership will expire in \${days} days.`,
    reminderExpireDate: `Expiration time: \${date}`,
    reminderExpiringToday: `⚠️ **VIP expires today**`,
    reminderExpiringTodayDesc: `Your VIP membership expires today.`,
    reminderGracePeriod: `📌 Grace period: Renewal within 3 days after expiration will not interrupt service.`,
    reminderRenewHint: `💡 Renew now to enjoy uninterrupted VIP service!`,
    reminderRenewHint2: `💡 Renew now to continue enjoying VIP benefits!`,
    reminderTitle: `⏰ **VIP expiration reminder**`,
    renewButton: `💳 Renew now (\${stars} ⭐)`,
    renewalProcessing: `Processing renewal...`,
    settings: `💡 To cancel your subscription, please go to Telegram Settings > Subscription Management

`,
    settings2: `💡 To cancel your subscription, please go to Telegram Settings > Subscription Management`,
    settings3: `💡 You can cancel your subscription anytime in Telegram Settings`,
    short: `(approximately 5 USD)`,
    short2: `Thank you for your patience!`,
    short3: `Thank you for your understanding!`,
    short4: `• Approved:\\`,
    short5: `• Rejected:\\`,
    start: `🚀 Start using now: /throw`,
    success: `🎯 **VIP smart matching successful!**

`,
    success2: `🎉 **Automatic renewal successful!**

`,
    success3: `🎉 **Smart matching successful!**

`,
    success4: `🎉 **Subscription successful!**

`,
    text: `- Priority access to OpenAI GPT model translations (high quality)
`,
    text10: `We will process your application within 1-3 business days.
`,
    text11: `Expiration time: \${expireDate}

`,
    text12: `Refunds will be credited within 1-3 business days.

`,
    text13: `Request ID: #\${requestId}
`,
    text14: `└ 1 Smart Match + 2 Public Pools
`,
    text15: `You will be notified of the processing results via Bot.

`,
    text16: `Please enter the reason for the refund (at least 10 characters):`,
    text17: `Reason: \${req.reason}
`,
    text18: `Refund deadline: within 7 days after payment

`,
    text19: `Your account has been restored to a free user.

`,
    text2: `• 34 languages automatically translated (OpenAI GPT priority)
`,
    text20: `💡 Want to renew or upgrade?

`,
    text21: `💡 If there are special circumstances, please contact customer service.`,
    text22: `Reason: \${reason}

`,
    text23: `• Unlock clear profile picture of the other party 🆕
`,
    text24: `This may take a few seconds, please wait.`,
    text25: `📝 **Request Refund**

`,
    text26: `• 34 languages automatically translated
`,
    text27: `💡 Use the following command to process: 
`,
    text28: `(Staging test price)`,
    text29: `If you have any questions, please contact customer support.`,
    text3: `Amount: \${request.amount_stars} ⭐`,
    text30: `Status: Pending Review

`,
    text4: `🔄 **Auto-Renewal**: Automatically billed monthly, no manual renewal required
`,
    text5: `Amount: \${req.amount_stars} ⭐
`,
    text6: `User ID: \${request.user_id}
`,
    text7: `💳 Renew Now (\${priceStars} ⭐)`,
    text8: `User ID: \${request.user_id}`,
    text9: `📌 Grace Period: Service will not be interrupted if renewed within 3 days after expiration.`,
    viewVipCommand: `You can check your VIP benefits anytime using the /vip command.`,
    vip: `Your VIP membership expired on \${new Date(sub.expire_date).toLocaleDateString('zh-TW')}

`,
    vip10: `💎 **Upgrade to VIP Membership**

`,
    vip11: `😢 **VIP Membership has Expired**

`,
    vip12: `Upgrade to VIP Membership to enjoy the following benefits: 
`,
    vip13: `⏰ **VIP Expiration Reminder**

`,
    vip14: `Your VIP membership expires today.

`,
    vip15: `Your VIP subscription has been automatically renewed!
`,
    vip16: `Your VIP membership has been canceled.

`,
    vip17: `XunNi VIP Subscription (Monthly)`,
    vip18: `✨ VIP benefits remain active: 
`,
    vip19: `You have become a VIP member!
`,
    vip2: `Your VIP membership will expire on \${new Date(sub.expire_date).toLocaleDateString(`,
    vip20: `✨ VIP benefits are activated: 
`,
    vip21: `VIP member (30 days)`,
    vip22: `🎁 VIP benefits: 
`,
    vip23: `XunNi VIP renewal`,
    vip24: `XunNi VIP purchase`,
    vip25: `VIP subscription`,
    vip3: `Your VIP membership will expire in \${daysLeft} days.

`,
    vip4: `🔄 Renew VIP (\${priceStars} ⭐)`,
    vip5: `💳 Purchase VIP (\${priceStars} ⭐)`,
    vip6: `Subscribe to XunNi VIP membership with automatic renewal every month!

`,
    vip7: `💡 Renew now to enjoy uninterrupted VIP service!`,
    vip8: `💡 Renew now to continue enjoying VIP benefits!
`,
    vip9: `✨ **You are already a VIP member**

`,
  },
  vipTripleBottle: {
    bottleContent: `📝 Bottle Content: {content}

`,
    bottlePicked: `Your message bottle has been picked up by {maskedMatcherNickname}!

`,
    conversationIdentifier: `💬 Conversation Identifier: {conversationIdentifier}
`,
    firstMatch: `💡 This is your 1st match, with 2 slots remaining

`,
    foundBottle: `The system has found a bottle from {maskedOwnerNickname}!

`,
    matchSuccess: `🎯 **VIP smart pairing successful!**

`,
    replyHint: `💬 **Please long press this message, select 'Reply', and enter content to start chatting with the other party**`,
    slotsWaiting: `There are {remaining} slots remaining

`,
    smartMatch: `🎉 **Smart pairing successful!**

`,
    viewChats: `Use /chats to view all conversations

`,
  },
  warning: {
    ad: `⚠️ No ad providers are currently configured

`,
    ad2: `⚠️ No official ads available at the moment

`,
    ad3: `⚠️ No available ad providers`,
    ad4: `⚠️ Unable to select ad provider`,
    ad5: `⚠️ Unable to view more ads`,
    birthday: `⚠️ Currently not in birthday input step`,
    bloodType: `⚠️ Currently not in blood type selection step`,
    broadcast: `⚠️ Found \${stuckBroadcasts.results.length} stuck broadcasts

`,
    complete: `⚠️ Please complete the previous ad before starting a new one`,
    confirm: `⚠️ Please confirm your birthday information:

`,
    conversation: `⚠️ Conversation information is incorrect.`,
    conversation10: `⚠️ Conversation does not exist`,
    conversation2: `⚠️ Conversation information is incorrect`,
    conversation3: `⚠️ This user has no conversation history posts
`,
    conversation4: `⚠️ Cannot find the specified conversation, it may have ended or expired.`,
    conversation5: `⚠️ **Conversation history section updated**

`,
    conversation6: `⚠️ Unable to recognize conversation partner

`,
    conversation7: `⚠️ Conversation not found

`,
    conversation8: `⚠️ Conversation does not exist or has ended`,
    conversation9: `⚠️ This conversation has ended`,
    end: `⚠️ The test has ended or does not exist`,
    failed: `⚠️ Payment verification failed, please try again later`,
    gender: `⚠️ Currently not in the gender selection step`,
    invite: `⚠️ Unable to retrieve invitation code`,
    mbti: `⚠️ Currently not in the MBTI test step`,
    mbti2: `⚠️ Invalid MBTI type`,
    message: `⚠️ Found \${outdatedPosts.length} outdated posts that need refreshing
`,
    message2: `⚠️ Note: This is \${testInfo}\${testTitle}, \${accuracy}.

`,
    message3: `⚠️ Please long press the message you want to block and reply with the command

`,
    message4: `⚠️ Please long press the message you want to report and reply with the command

`,
    message5: `⚠️ **Message contains prohibited links**

`,
    register: `⚠️ User profile not found, please register first using /start.`,
    register2: `⚠️ Please complete the registration process first.

Use /start to continue registration.`,
    register3: `⚠️ There was a problem with the registration process, please restart: /start`,
    register4: `⚠️ Please complete the registration process first`,
    settings: `⚠️ Reminder: Gender setting will **never be able to be modified** after this!

`,
    settings2: `⚠️ Birthday setting cannot be modified, please confirm it is correct!`,
    settings3: `⚠️ Note: Gender setting cannot be modified, please choose carefully!`,
    short: `⚠️ Incorrect order of questions`,
    short2: `⚠️ Unknown option`,
    short3: `⚠️ Invalid request`,
    short4: `⚠️ Attention:
`,
    short5: `⚠️ Other violations`,
    start: `⚠️ Session has expired, please restart: /throw`,
    start2: `⚠️ Session has expired, please restart`,
    task: `⚠️ Unknown task type`,
    text: `⚠️ **Attention**

`,
    text10: `⚠️ **Read-only item**:
`,
    text11: `⚠️ Session has expired, please try again`,
    text12: `⚠️ Draft does not exist or has expired`,
    text2: `⚠️ Invalid payment type`,
    text3: `⚠️ Translation service is temporarily unavailable, here is the original text
`,
    text4: `⚠️ Security notice:
`,
    text5: `⚠️ Currently not in the anti-fraud quiz step`,
    text6: `⚠️ Currently not in the terms of service step`,
    text7: `⚠️ Note: This feature is only available in the Staging environment.`,
    text8: `⚠️ **Sending images, videos, or multimedia is not allowed**

`,
    text9: `⚠️ This feature is only available in the Staging environment.`,
    userNotFound: `⚠️ User does not exist, please register using /start first.`,
    userNotFound2: `⚠️ User does not exist`,
    vip: `⚠️ Reached the free user invitation limit, upgrade to VIP to unlock the limit of 100 users!`,
    vip2: `⚠️ This feature is for VIP members only`,
    vip3: `⚠️ **VIP expires today**

`,
  },
  warnings: {
    birthday: `⚠️ Birthday cannot be modified once set, please confirm it is correct!`,
    bloodType: `🩸 Blood Type`,
    gender: `👤 Gender: {otherUser.gender}`,
    mbti: `🧠 MBTI: \\\\\\\\\\\${mbti}`,
    register2: `[Needs translation: warnings.register2]`,
    register4: `[Needs translation: warnings.register4]`,
    settings: `🧠 MBTI: \\\\\\\\\\\\$`,
    text5: `📖 Bio: {otherUser.bio}`,
    text6: `[Needs translation: warnings.text6]`,
    userNotFound: `User does not exist`,
    warning: {
      ad: `⚠️ Currently no ad providers configured

`,
      ad2: `⚠️ Currently no official ads

`,
      ad3: `⚠️ No available ad providers at this time`,
      ad4: `⚠️ Unable to select ad provider`,
      ad5: `⚠️ Unable to watch more ads`,
      birthday: `⚠️ Currently not in birthday input step`,
      bloodType: `⚠️ Currently not in blood type selection step`,
      broadcast: `⚠️ Found \\\${stuckBroadcasts.results.length} stuck broadcasts

`,
      complete: `⚠️ Please complete the previous ad before starting a new one`,
      confirm: `⚠️ Please confirm your birthday information: 

`,
      conversation: `⚠️ Conversation information is incorrect.`,
      conversation10: `⚠️ Conversation does not exist`,
      conversation2: `⚠️ Conversation information is incorrect`,
      conversation3: `⚠️ This user has no conversation history posts
`,
      conversation4: `⚠️ Cannot find the specified conversation, it may have ended or expired.`,
      conversation5: `⚠️ **Conversation history partially updated**

`,
      conversation6: `⚠️ Unable to identify conversation partner

`,
      conversation7: `⚠️ Cannot find this conversation

`,
      conversation8: `⚠️ Conversation does not exist or has ended`,
      conversation9: `⚠️ This conversation has ended`,
      end: `⚠️ Quiz has ended or does not exist`,
      failed: `⚠️ Payment verification failed, please try again later`,
      gender: `⚠️ Currently not in the gender selection step`,
      invite: `⚠️ Unable to retrieve invitation code`,
      mbti: `⚠️ Currently not in the MBTI quiz step`,
      mbti2: `⚠️ Invalid MBTI type`,
      message: `⚠️ Found \\\${outdatedPosts.length} outdated posts needing refresh
`,
      message2: `⚠️ Note: This is \\\${testInfo}\\\${testTitle}, \\\${accuracy}.

`,
      message3: `⚠️ Please long-press the message you want to block and reply with the command

`,
      message4: `⚠️ Please long-press the message you want to report and reply with the command

`,
      message5: `⚠️ **Message contains prohibited links**

`,
      register: `⚠️ User data not found, please register first using /start.`,
      register2: `⚠️ Please complete the registration process first.

Continue registration using /start.`,
      register3: `⚠️ There was a problem with the registration process, please start over: /start`,
      register4: `⚠️ Please complete the registration process first.`,
      settings: `⚠️ Reminder: Once set, gender **cannot be modified** forever!

`,
      settings2: `⚠️ Birthday cannot be modified once set, please confirm it is correct!`,
      settings3: `⚠️ Note: Gender cannot be modified once set, please choose wisely!`,
      short: `⚠️ Incorrect question order`,
      short2: `⚠️ Unknown option`,
      short3: `⚠️ Invalid request`,
      short4: `⚠️ Nickname length limit: 36 characters`,
      short5: `⚠️ Other violations`,
      start: `⚠️ Session has expired, please start over: /throw`,
      start2: `⚠️ Session has expired, please restart`,
      task: `⚠️ Unknown task type`,
      text: `⚠️ **Note**

`,
      text10: `⚠️ **Non-modifiable items**: 
`,
      text11: `⚠️ Session has expired, please re-operate`,
      text12: `⚠️ Draft does not exist or has expired`,
      text2: `⚠️ Invalid payment type`,
      text3: `⚠️ Translation service is temporarily unavailable, showing original text below
`,
      text4: `⚠️ Safety reminder: 
`,
      text5: `⚠️ Currently not in the anti-fraud test step`,
      text6: `⚠️ Currently not in the terms of service step`,
      text7: `⚠️ Note: This feature is only available in the Staging environment.`,
      text8: `⚠️ **Sending images, videos, or multimedia is not allowed**

`,
      text9: `⚠️ This feature is only available in the Staging environment.`,
      userNotFound: `⚠️ User does not exist, please use /start to register first.`,
      userNotFound2: `⚠️ User does not exist`,
      vip: `⚠️ Reached the limit for free user invitations; upgrade to VIP to unlock a limit of 100 people!`,
      vip2: `⚠️ This feature is for VIP members only`,
      vip3: `⚠️ **VIP expires today**

`,
    },
  },
};
