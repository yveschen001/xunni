import type { Translations } from '../types';

/**
 * ar translations
 * Auto-generated from i18n_for_translation.csv
 */
export const translations: Translations = {
  ad: {
    ad: `💡 تابع مشاهدة الإعلانات للحصول على المزيد من الحصص! (ثابت)`,
    bottle: `[需要翻译]`,
    bottle2: `[需要翻译]`,
    bottle: `[需要翻译]`,
    bottle2: `[需要翻译]`,
  },
  adPrompt: {
    completeTask: `• ✨ أكمل المهام (احصل على حصة دائمة)`,
    inviteFriends: `• 🎁 ادعُ الأصدقاء (احصل على +1 حصة لكل شخص)`,
    quotaExhausted: `❌ تم استنفاد حصة زجاجة الرسائل اليوم (\${quotaDisplay})`,
    taskButton: `✨ \${taskName} 🎁`,
    upgradeVip: `• 💎 ترقية إلى VIP (30 حصة يوميًا)`,
    watchAd: `• 📺 مشاهدة الإعلانات (المتبقية \${remaining}/20 مرة)`,
    watchAdLimit: `• 📺 مشاهدة الإعلانات (تم الوصول إلى الحد اليومي)`,
    waysToGetMore: `💡 طرق للحصول على المزيد من الحصص:`,
  },
  adProvider: {
    'health.good': `جيد`,
    'health.needsAttention': `يحتاج إلى اهتمام`,
  },
  adReward: {
    adCompleted: `اكتمل الإعلان! تم كسب +\${quota} حصة`,
    cannotSelectProvider: `⚠️ غير قادر على اختيار مزود الإعلانات`,
    cannotWatchMore: `⚠️ غير قادر على مشاهدة المزيد من الإعلانات`,
    clickButtonHint: `✅ يرجى الضغط على زر البدء للمشاهدة`,
    completedEarned: `🎁 الأرباح اليوم: **\${earned}** رصيد`,
    completedRemaining: `📈 العد المتبقي: **\${remaining}** مرة`,
    completedReward: `✅ اربح **+1 حصة**`,
    completedTitle: `🎉 **تم الانتهاء من مشاهدة الإعلان!**`,
    completedWatched: `📊 مشاهدات اليوم: **\${watched}/20** مرة`,
    continueWatching: `💡 تابع مشاهدة الإعلانات للحصول على المزيد من الحصص!`,
    dailyLimitReached: `تم الوصول إلى الحد اليومي من الإعلانات (\${max}/\${max})`,
    getStatusFailed: `❌ فشل في استرداد حالة الإعلان`,
    noProviders: `⚠️ لا توجد مزودات إعلانات متاحة في الوقت الحالي`,
    pendingAd: `⚠️ يرجى إكمال الإعلان السابق قبل البدء بإعلان جديد`,
    startWatchButton: `📺 ابدأ مشاهدة الإعلانات`,
    vipNoAds: `💎 المستخدمون VIP ليسوا بحاجة لمشاهدة الإعلانات`,
    vipNoAdsReason: `لدى مستخدمي VIP حصة غير محدودة ولا يحتاجون لمشاهدة الإعلانات`,
    watchAdClickButton: `👇 اضغط على الزر أدناه للبدء بالمشاهدة`,
    watchAdRemaining: `📊 المتبقي اليوم: **\${remaining}/20** مرة`,
    watchAdReward: `🎁 إكمال المشاهدة يكسبك **+1 حصة**`,
    watchAdTitle: `📺 **شاهد الإعلانات لكسب الحصص**`,
  },
  admin: {
    ad: `استخدم /official_ads لعرض جميع الإعلانات`,
    ad2: `يرجى استخدام نص برمجي لقواعد البيانات لإضافة مقدمي الإعلانات:
`,
    ad3: `📺 **قائمة مقدمي الإعلانات**

`,
    ad4: `يرجى استخدام نص برمجي لقواعد البيانات لإضافة الإعلانات الرسمية:
`,
    ad5: `📢 **قائمة الإعلانات الرسمية**

`,
    'adConfig.adIdMustBeNumber': `❌ يجب أن يكون معرف الإعلان رقمًا`,
    'adConfig.addOfficialAdScript': `يرجى استخدام نص برمجي لقواعد البيانات لإضافة الإعلانات الرسمية:`,
    'adConfig.addProviderScript': `يرجى استخدام نص برمجي لقواعد البيانات لإضافة مقدمي الإعلانات:`,
    'adConfig.clicks': `• النقرات: \${count} مرات`,
    'adConfig.correctFormat': `**الصيغة الصحيحة:**`,
    'adConfig.disableCommand': `• \`/ad_provider_disable \` - تعطيل \`/ad_provider_disable <id>\``,
    'adConfig.disableFailed': `❌ فشل تعطيل مقدم الإعلانات`,
    'adConfig.disableOfficialAdCommand': `• \`/official_ad_disable \` - تعطيل \`/official_ad_disable <id>\``,
    'adConfig.disableOfficialAdFailed': `❌ فشل تعطيل الإعلان الرسمي`,
    'adConfig.disabled': `❌ تعطيل`,
    'adConfig.enableCommand': `• \`/ad_provider_enable \` - تفعيل \`/ad_provider_enable <id>\``,
    'adConfig.enableFailed': `❌ فشل تفعيل مقدم الإعلانات`,
    'adConfig.enableOfficialAdCommand': `• \`/official_ad_enable \` - تفعيل \`/official_ad_enable <id>\``,
    'adConfig.enableOfficialAdFailed': `❌ فشل تفعيل الإعلان الرسمي`,
    'adConfig.enabled': `✅ تفعيل`,
    'adConfig.example': `**مثال:**`,
    'adConfig.getListFailed': `❌ فشل في استرجاع قائمة مقدمي الإعلانات`,
    'adConfig.getOfficialAdListFailed': `❌ فشل في استرجاع القائمة الرسمية للإعلانات`,
    'adConfig.id': `• المعرف: \${id}`,
    'adConfig.impressions': `• العرض: \${count} مرات`,
    'adConfig.managementCommands': `**أمر المسؤول:**`,
    'adConfig.noOfficialAds': `⚠️ لا توجد إعلانات رسمية متاحة في الوقت الحالي`,
    'adConfig.noProviders': `⚠️ لا توجد مقدمي إعلانات تم تكوينهم في هذا الوقت`,
    'adConfig.officialAdDisabled': `✅ تم تعطيل الإعلان الرسمي #\${id}`,
    'adConfig.officialAdEnabled': `✅ تم تفعيل الإعلان الرسمي #\${id}`,
    'adConfig.officialAdList': `📢 **القائمة الرسمية للإعلانات**`,
    'adConfig.priority': `• الأولوية: \${priority}`,
    'adConfig.priorityCommand': `• \`/ad_provider_priority \` - تعيين الأولوية \`/ad_provider_priority <id> <priority>\``,
    'adConfig.priorityMustBeNonNegative': `❌ يجب أن تكون الأولوية عدداً صحيحاً غير سالب`,
    'adConfig.prioritySet': `✅ تم تعيين أولوية مقدم الإعلان`,
    'adConfig.priorityValue': `الأولوية: \${priority}`,
    'adConfig.provider': `مزود: \${name}`,
    'adConfig.providerDisabled': `✅ تم تعطيل مزود الإعلانات: \${name}`,
    'adConfig.providerEnabled': `✅ تم تمكين مزود الإعلانات: \${name}`,
    'adConfig.providerList': `📺 **قائمة مقدمي الإعلانات**`,
    'adConfig.reward': `• المكافأة: \${reward} المبلغ`,
    'adConfig.setPriorityFailed': `❌ فشل في تعيين الأولوية`,
    'adConfig.status': `• الحالة: \${status}`,
    'adConfig.testMode': `• 🧪 وضع الاختبار`,
    'adConfig.type': `• النوع: \${type}`,
    'adConfig.usageError': `❌ استخدام غير صحيح`,
    'adConfig.viewAllOfficialAds': `استخدم /official_ads لعرض جميع الإعلانات`,
    'adConfig.viewAllProviders': `استخدم /ad_providers لعرض جميع المقدميين`,
    'adConfig.viewStatsCommand': `• \`/ad_stats \` - عرض إحصائيات مفصلة \`/ad_stats <id>\``,
    'adConfig.weight': `• الوزن: \${weight}`,
    addAlreadyAdmin: `❌ هذا المستخدم هو بالفعل مشرف.`,
    addAlreadySuperAdmin: `❌ هذا المستخدم هو بالفعل مشرف سوبر، لا حاجة للإضافة.`,
    addCommand: `\`/admin_add <user_id>\`

`,
    addExample: `\`/admin_add 123456789\` - أضف كمشرف عادي

`,
    addInstructions: `⚠️ **تنبيه**

تتطلب هذه الوظيفة تعديلًا يدويًا لملف التكوين.

**الخطوات:**
1. تعديل \`wrangler.toml\`
2. العثور على متغير \`ADMIN_USER_IDS\`
3. إضافة معرف المستخدم: \`{userId}\`
4. الصيغة: \`ADMIN_USER_IDS = "ID1,ID2,{userId}"\`
5. إعادة النشر: \`pnpm deploy:staging\`

**معلومات المستخدم:**
• المعرف: \`{userId}\`
• اللقب: {nickname}
• اسم المستخدم: @{username}

💡 أو تعديل متغيرات البيئة في لوحة تحكم Cloudflare`,
    addUsageError: `❌ طريقة الاستخدام غير صحيحة

`,
    addUserNotFound: `❌ المستخدم غير موجود أو غير مسجل.`,
    admin: `💡 استخدم /admin_list لعرض قائمة المسؤولين الحالية`,
    admin2: `حظر المسؤول / حظر المدير`,
    admin3: `- إضافة كمسؤول عادي

`,
    admin4: `- إزالة مسؤول عادي

`,
    admin5: `\`/admin_add 123456789\` - إضافة كإداري عادي

`,
    admin6: `\`/admin_remove 123456789\` - إزالة إداري عادي

`,
    'analytics.getAdDataFailed': `❌ فشل في استرداد بيانات الإعلان`,
    'analytics.getDataFailed': `❌ فشل في استرداد بيانات التحليلات`,
    'analytics.getVipDataFailed': `❌ فشل في استرداد بيانات VIP`,
    'analytics.noPermission': `❌ ليس لديك الإذن لعرض بيانات التحليلات`,
    'analytics.noPermissionAd': `❌ ليس لديك الإذن لعرض بيانات الإعلان`,
    'analytics.noPermissionVip': `❌ ليس لديك الإذن لعرض بيانات VIP`,
    'analytics.onlySuperAdmin': `❌ فقط المشرفون الأعلى يمكنهم استخدام هذا الأمر.`,
    'analytics.sendReportFailed': `❌ فشل إرسال التقرير اليومي: \${error}`,
    'analytics.userNotFound': `❌ المستخدم غير موجود: \${userId}`,
    appeal: `معرّف الاستئناف: \${appeal.id}
`,
    appeal2: `💡 استخدم الأمر التالي لمراجعة الاستئناف: 
`,
    appeal3: `📋 قائمة الاستئنافات المعلقة

`,
    appeal4: `تمت الموافقة على الاستئناف`,
    appeal5: `تم رفض الاستئناف`,
    appealAlreadyReviewed: `❌ تم مراجعة الاستئناف {id} بالفعل`,
    appealApproveUsageError: `❌ يرجى تقديم معرف الاستئناف

الاستخدام: /admin_approve <appeal_id> [ملاحظات]`,
    appealApproved: `✅ تم قبول الاستئناف {id}، وتم رفع الحظر عن المستخدم`,
    appealApprovedDefault: `تم قبول الاستئناف`,
    appealDivider: `━━━━━━━━━━━━━━━━
`,
    appealId: `معرف الاستئناف: {id}
`,
    appealNotFound: `❌ لم يتم العثور على معرف الاستئناف: {id}`,
    appealReason: `السبب: {reason}
`,
    appealRejectUsageError: `❌ يرجى تقديم معرف الاستئناف

الاستخدام: /admin_reject <appeal_id> [remarks]`,
    appealRejected: `✅ تم رفض الاستئناف {id}`,
    appealRejectedDefault: `تم رفض الاستئناف`,
    appealReviewCommands: `/admin_approve <appeal_id> [notes]
/admin_reject <appeal_id> [notes]`,
    appealReviewHint: `💡 استخدم الأوامر التالية لمراجعة الطلبات: 
`,
    appealSubmittedAt: `وقت التقديم: {time}

`,
    appealUser: `المستخدم: {user}
`,
    appealsTitle: `📋 قائمة الاستئنافات المعلقة

`,
    ban: `💡 استخدم /admin_bans <user_id> لعرض تاريخ الحظر لمستخدم معين`,
    'ban.appealAlreadyReviewed': `❌ تم مراجعة الاستئناف {id} بالفعل`,
    'ban.appealApproved': `تمت الموافقة على الاستئناف`,
    'ban.appealApprovedUnbanned': `✅ تم اعتماد الاستئناف {id}، وقد تم رفع الحظر عن المستخدم`,
    'ban.appealId': `معرف الاستئناف: {id}
`,
    'ban.appealList': `📋 قائمة الاستئنافات المعلقة

`,
    'ban.appealNotFound': `❌ لا يمكن العثور على معرف الاستئناف: {id}`,
    'ban.appealReason': `السبب: {reason}
`,
    'ban.appealRejected': `تم رفض الاستئناف`,
    'ban.appealRejectedMessage': `✅ تم رفض الاستئناف {id}`,
    'ban.appealSubmittedAt': `وقت التقديم: {time}

`,
    'ban.appealUser': `المستخدم: {user}
`,
    'ban.banEnd': `النهاية: \${end}`,
    'ban.banId': `المعرف: \${id}`,
    'ban.banReason': `السبب: \${reason}`,
    'ban.banStart': `البداية: \${start}`,
    'ban.banUser': `المستخدم: \${user}`,
    'ban.durationDays': `{days} أيام`,
    'ban.durationHours': `{hours} ساعات`,
    'ban.durationMustBePositive': `❌ يجب أن تكون المدة عددًا صحيحًا موجبًا أو "دائمًا".`,
    'ban.noAppeals': `✅ لا توجد استئنافات معلقة حالياً`,
    'ban.noBanRecords': `❌ المستخدم \${userId} ليس لديه سجلات حظر`,
    'ban.noBanRecordsList': `📊 لا توجد سجلات حظر حالياً`,
    'ban.noPermission': `❌ ليس لديك الإذن لاستخدام هذا الأمر.`,
    'ban.notAdmin': `❌ هذا المستخدم ليس مسؤولاً.`,
    'ban.permanent': `دائم`,
    'ban.provideAppealId': `❌ يرجى تقديم معرف الاستئناف

`,
    'ban.reason': `حظر إداري`,
    'ban.recentBans': `📊 آخر 10 سجلات حظر`,
    'ban.riskScore': `درجة المخاطر: \${score}`,
    'ban.temporaryBan': `🚫 لقد تم حظرك مؤقتًا

مدة الحظر: {duration}
وقت الرفع عن الحظر: {unbanTime}

سبب الحظر: تقارير متعددة

إذا كان لديك أي أسئلة، يرجى استخدام /appeal لتقديم استئناف.`,
    'ban.totalBans': `إجمالي الحظرات: \${count}`,
    'ban.usageApprove': `الاستخدام: /admin_approve <appeal_id> [remarks]`,
    'ban.usageReject': `الاستخدام: /admin_reject <appeal_id> [remarks]`,
    'ban.user': `المستخدم: \${user}`,
    'ban.userBanHistory': `📊 تاريخ حظر المستخدم`,
    'ban.viewHistory': `💡 استخدم /admin_bans <user_id> لعرض تاريخ الحظر لمستخدم محدد`,
    ban2: `إجمالي عدد الحظرات: \${userBans.results.length}

`,
    ban3: `📊 آخر 10 سجلات حظر

`,
    ban4: `📊 تاريخ حظر المستخدم

`,
    ban5: `📊 لا توجد سجلات حظر حالياً`,
    banUsageError: `استخدام غير صحيح`,
    banUserNotFound: `المستخدم غير موجود`,
    cannotBanAdmin: `لا يمكن حظر المسؤولين`,
    conversation: `💡 يتم إنشاء منشورات تاريخ المحادثة فقط عند وجود رسائل جديدة
`,
    conversation2: `جميع المستخدمين المميزين لديهم أحدث تاريخ محادثة!`,
    conversation3: `
💬 **منشورات تاريخ المحادثة:**
`,
    conversation4: `يرجى التحقق مما إذا كان تاريخ المحادثة قد تم تحديثه مع صورة شخصية واضحة.`,
    conversation5: `🔄 جاري تحديث تاريخ محادثتك...`,
    conversation6: `• لا توجد منشورات لتاريخ المحادثة
`,
    'diagnose.allUpToDateFree': `✅ جميع المنشورات محدثة (حالة المستخدم المجاني صحيحة)`,
    'diagnose.allUpToDateVip': `✅ جميع المنشورات محدثة (حالة المستخدم المميز صحيحة)`,
    'diagnose.analysis': `🔎 **تحليل:**`,
    'diagnose.avatarCache': `📸 **ذاكرة التخزين المؤقت للصورة الشخصية:**`,
    'diagnose.blurredUrl': `• الرابط الغامض: \${status}`,
    'diagnose.createdWithVip': `• VIP عند الإنشاء: \${status}`,
    'diagnose.error': `خطأ: \${error}`,
    'diagnose.failed': `❌ **فشل التشخيص**`,
    'diagnose.fileId': `• معرف الملف: \${fileId}...`,
    'diagnose.hasAvatar': `• لديه صورة شخصية: \${status}`,
    'diagnose.historyPosts': `💬 **سجل المحادثات:**`,
    'diagnose.historyPostsHint': `💡 يتم إنشاء سجل المحادثات فقط عند وجود رسائل جديدة`,
    'diagnose.isLatest': `• الأحدث: \${status}`,
    'diagnose.morePosts': `...هناك \${count} منشورات`,
    'diagnose.nickname': `• الاسم المستعار: \${nickname}`,
    'diagnose.no': `❌ لا`,
    'diagnose.noCache': `• لا ذاكرة تخزين مؤقت`,
    'diagnose.noHistoryPosts': `• لا يوجد سجل محادثات`,
    'diagnose.noHistoryPostsWarning': `⚠️ هذا المستخدم ليس لديه سجل محادثات`,
    'diagnose.none': `لا شيء`,
    'diagnose.originalUrl': `• الرابط الأصلي: \${status}`,
    'diagnose.outdatedPostsFound': `⚠️ تم العثور على \${count} منشورات قديمة تحتاج إلى تحديث`,
    'diagnose.postId': `• المعرف: \${id}`,
    'diagnose.postTitle': `📝 **المنشور #\${identifier}-H\${postNumber}**`,
    'diagnose.postUpdatedAt': `• وقت التحديث: \${date}`,
    'diagnose.refreshHint': `💡 استخدم /admin_refresh_vip_avatars لتحديث الصور الرمزية بكميات كبيرة`,
    'diagnose.title': `🔍 **تقرير تشخيص الصورة الرمزية**`,
    'diagnose.totalPosts': `• المجموع: \${count}`,
    'diagnose.unknown': `غير معروف`,
    'diagnose.updatedAt': `• وقت التحديث: \${date}`,
    'diagnose.userId': `• المعرف: \${userId}`,
    'diagnose.userInfo': `👤 **معلومات المستخدم:**`,
    'diagnose.username': `• اسم المستخدم: @\${username}`,
    'diagnose.vipExpire': `• انتهاء VIP: \${date}`,
    'diagnose.vipStatus': `• حالة VIP: \${status}`,
    'diagnose.yes': `✅ نعم`,
    end: `انتهاء: \${banEnd}

`,
    error: `خطأ`,
    failed: `• المنشورات الفاشلة: \${results.totalPostsFailed}

`,
    failed2: `• الفشل: \${results.failedUsers}
`,
    failed3: `• فشل: \${result.failed} منشورات

`,
    insufficientPermission: `❌ **أذونات غير كافية**

هذه الأوامر مخصصة للمسؤولين الفائقين فقط.`,
    listFooter: `---`,
    listNotRegistered: `غير مسجل`,
    listRoleAdmin: `مسؤول`,
    listRoleSuperAdmin: `مدير عام`,
    listTitle: `قائمة المسؤولين`,
    message: `• تم التحديث في: \${new Date(post.updated_at).toLocaleString('en-US', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}

`,
    message10: `• لديه صورة شخصية: \${post.partner_avatar_url ? '✅' : '❌'}
`,
    message11: `...و \${historyPosts.results.length - 5} منشورات أخرى
`,
    message12: `المستخدم: \${targetUser?.nickname || targetUserId}
`,
    message13: `• اسم المستخدم: @\${targetUser?.username}

`,
    message14: `المستخدم: \${appeal.nickname || appeal.user_id}
`,
    message15: `
...و \${results.details.length - 10} مستخدمين آخرين`,
    message16: `• اسم المستخدم: @\${targetUser.username}

`,
    message17: `• المجموع: \${historyPosts.results.length}

`,
    message18: `💡 استخدم /admin_refresh_vip_avatars لتحديث الصور بشكل جماعي
`,
    message19: `• الأخيرة: \${post.is_latest ? '✅' : '❌'}
`,
    message2: `• تم التحديث في: \${avatarInfo.avatar_updated_at ? new Date(avatarInfo.avatar_updated_at).toLocaleString('en-US') : 'غير معروف'}
`,
    message20: `• المنشورات القديمة: \${stats.totalOutdatedPosts}

`,
    message21: `/ad_provider_priority`,
    message22: `• يحتاج إلى تحديث: \${stats.usersNeedingRefresh}
`,
    message23: `• المنشورات المحدثة: \${results.totalPostsUpdated}
`,
    message24: `المستخدم: \${ban.nickname || ban.user_id}
`,
    message25: `/ad_provider_disable <provider_id>`,
    message26: `💡 أو تعديل متغيرات البيئة في لوحة تحكم Cloudflare`,
    message27: `/ad_provider_enable <provider_id>`,
    message28: `• اسم المستخدم: @\${targetUser?.username ||`,
    message29: `/admin_approve <appeal_id> [ملاحظة]
`,
    message3: `• \${username}: \${detail.postsUpdated} تمت التحديث, \${detail.postsFailed} فشلت
`,
    message30: `• المشاهدات: \${ad.impression_count} مرات
`,
    message31: `• اسم المستخدم: @\${targetUser.username ||`,
    message32: `• اسم المستخدم: @\${user.username}
 {user.username || '無'} \${user.username}`,
    message33: `/admin_reject <appeal_id> [ملاحظة]`,
    message34: `• معالجة المستخدمين: \${results.totalUsers}
`,
    message35: `• \`/ad_provider_enable \` - تفعيل
 \`/ad_provider_enable <id>\``,
    message36: `• \`/ad_provider_disable \` - تعطيل
 \`/ad_provider_disable <id>\``,
    message37: `• \`/ad_provider_priority \` - تعيين الأولوية \`/ad_provider_priority <id> <priority>\``,
    message38: `• \`/official_ad_enable \` - تفعيل
 \`/official_ad_enable <id>\``,
    message39: `• \`/official_ad_disable \` - تعطيل
 \`/official_ad_disable <id>\``,
    message4: `تاريخ انتهاء جديد: \${new Date(data.expire_date).toLocaleDateString('en-US')}
 {new Date(data.expire_date).toLocaleDateString('zh-TW')} \${new Date(data.expire_date).toLocaleDateString('zh-TW')}`,
    message40: `• وقت التحديث: \${new Date(post.updated_at).toLocaleString('en-US', { month: '2-digit', day: '2-digit', hour:`,
    message5: `تاريخ الانتهاء: \${new Date(data.expire_date).toLocaleDateString('en-US')}
 {new Date(data.expire_date).toLocaleDateString('zh-TW')} \${new Date(data.expire_date).toLocaleDateString('zh-TW')}`,
    message6: `خطأ: \${error instanceof Error ? error.message : String(error)}`,
    message7: `• الرابط الأصلي: \${avatarInfo.avatar_original_url ? '✅' : '❌'}
`,
    message8: `• الرابط الضبابي: \${avatarInfo.avatar_blurred_url ? '✅' : '❌'}
`,
    message9: `📝 **المنشور #\${post.identifier}-H\${post.post_number}**
`,
    nickname: `• اللقب: \${targetUser?.nickname ||`,
    nickname2: `• اللقب: \${targetUser.nickname ||`,
    noPendingAppeals: `✅ لا توجد حاليًا أي استئنافات معلقة للمراجعة`,
    noPermission: `❌ ليس لديك الإذن لاستخدام هذا الأمر.`,
    onlyAdmin: `❌ يمكن فقط للمسؤولين استخدام هذا الأمر.`,
    onlySuperAdmin: `❌ يمكن فقط للمسؤولين الفائقين استخدام هذا الأمر.`,
    operationFailed: `❌ حدث خطأ، يرجى المحاولة مرة أخرى لاحقاً.`,
    'refresh.allUpToDate': `تاريخ محادثة جميع المستخدمين المميزين محدث!`,
    'refresh.batchComplete': `✅ **اكتمل تحديث جماعي**`,
    'refresh.checkHint': `يرجى التحقق مما إذا كانت محادثة التاريخ قد تم تحديثها لمسح الصور الرمزية.`,
    'refresh.complete': `✅ **اكتمل التحديث**`,
    'refresh.details': `📝 **النتائج التفصيلية:**`,
    'refresh.duration': `⏱️ **المدة:** \${duration} ثواني`,
    'refresh.error': `خطأ: \${error}`,
    'refresh.errorOccurred': `حدث خطأ أثناء المعالجة، يرجى التحقق من السجلات.`,
    'refresh.failed': `❌ **فشل التحديث**`,
    'refresh.failedPosts': `• المنشورات الفاشلة: \${count}`,
    'refresh.failedUsers': `• الفشل: \${count}`,
    'refresh.moreUsers': `
...و \${count} مستخدمين آخرين`,
    'refresh.noRefreshNeeded': `✅ **لا حاجة للتحديث**`,
    'refresh.outdatedPosts': `• المنشورات المنتهية: \${count}`,
    'refresh.processedUsers': `• معالجة المستخدمين: \${count}`,
    'refresh.processing': `⏳ جارٍ المعالجة، يرجى الانتظار...`,
    'refresh.startingBatchRefresh': `🔄 **بدء التحديث الجماعي للصور الرمزية للمستخدمين المميزين**`,
    'refresh.startingRefresh': `🔄 جارٍ تحديث سجل المحادثة الخاص بك...`,
    'refresh.stats': `📊 **الإحصائيات:**`,
    'refresh.successUsers': `• النجاح: \${count}`,
    'refresh.summary': `📊 **الملخص:**`,
    'refresh.totalVipUsers': `• إجمالي مستخدمي VIP: \${count}`,
    'refresh.updated': `• التحديثات: \${count} منشورات`,
    'refresh.updatedPosts': `• المنشورات المحدثة: \${count}`,
    'refresh.userDetail': `• \${username}: \${updated} تم التحديث, \${failed} فشل`,
    'refresh.usersNeedingRefresh': `• يحتاج إلى تحديث: \${count}`,
    removeCannotRemoveSuperAdmin: `❌ لا يمكن إزالة المدير الفائق.`,
    removeCommand: `\`/admin_remove <user_id>\`

`,
    removeExample: `\`/admin_remove 123456789\` - إزالة المدير العادي

`,
    removeInstructions: `⚠️ **تنبيه**

تتطلب هذه الوظيفة تعديلًا يدويًا لملف التكوين.

**الخطوات:**
1. تعديل \`wrangler.toml\`
2. العثور على متغير \`ADMIN_USER_IDS\`
3. إزالة معرف المستخدم: \`{userId}\`
4. الصيغة: \`ADMIN_USER_IDS = "ID1,ID2"\` (قم بإزالة {userId})
5. إعادة النشر: \`pnpm deploy:staging\`

**معلومات المستخدم:**
• المعرف: \`{userId}\`
• اللقب: {nickname}
• اسم المستخدم: @{username}

💡 أو تعديل متغيرات البيئة في لوحة تحكم Cloudflare`,
    removeNotAdmin: `❌ هذا المستخدم ليس مسؤولاً.`,
    removeUsageError: `❌ طريقة الاستخدام غير صحيحة

`,
    settings: `• الاسم المستعار: \${targetUser?.nickname}
 {targetUser?.nickname || '未設定'} \${targetUser?.nickname}`,
    settings2: `• الاسم المستعار: \${targetUser.nickname}
 {targetUser.nickname || '未設定'} \${targetUser.nickname}`,
    settings3: `• الاسم المستعار: \${user.nickname}
 {user.nickname || '未設定'} \${user.nickname}`,
    settings4: `غير محدد`,
    settings5: `غير محدد`,
    settings6: `غير محدد`,
    short: `**مثال:**
`,
    short10: `معرف الدفع: \\`,
    short11: `متغير
`,
    short12: `المستخدم: \\`,
    short2: `**عينة:**
`,
    short3: `**الخطوات:**
`,
    short4: `5. إعادة النشر: \\`,
    short5: `4. إعادة النشر: \\`,
    short6: `1. تعديل \\`,
    short7: `2. العثور على \\`,
    short8: `4. التنسيق: \\`,
    short9: `• لا يوجد ذاكرة تخزين مؤقت
`,
    start: `بدء: \${banStart}
`,
    stats: `📊 **الإحصائيات:**
`,
    stats2: `• \`/ad_stats \` - عرض إحصائيات مفصلة \`/ad_stats <id>\``,
    success: `• النجاح: \${results.successUsers}
`,
    text: `• الأولوية: \${provider.priority}
`,
    text10: `المبلغ: \${data.amount_stars} ⭐
`,
    text11: `معرف الطلب: #\${data.request_id}
`,
    text12: `• الوزن: \${provider.weight}
`,
    text13: `السبب: \${data.error_message}
`,
    text14: `/ad_provider_disable`,
    text15: `/official_ad_disable`,
    text16: `💡 استخدم /admin_refunds لرؤية التفاصيل`,
    text17: `/ad_provider_enable`,
    text18: `استخدم /ad_providers لرؤية جميع المزودين`,
    text19: `/official_ad_enable`,
    text2: `• المكافأة: \${ad.quota_reward} حصة
`,
    text20: `المتبقي: \${data.days_left} أيام
`,
    text21: `/admin_remove 123456789`,
    text22: `السبب: \${appeal.reason}
`,
    text23: `وقت التقديم: \${createdAt}

`,
    text24: `المزود: \${providerName}
`,
    text25: `• النوع: \${ad.ad_type}
`,
    text26: `/admin_add 123456789`,
    text27: `حدث خطأ أثناء العملية، يرجى التحقق من السجلات.

`,
    text28: `الأولوية: \${priority}

`,
    text29: `السبب: \${ban.reason}
`,
    text3: `/official_ad_disable <ad_id>`,
    text30: `السبب: \${data.reason}
`,
    text31: `الوقت: \${timestamp}

`,
    text32: `تتطلب هذه الأوامر تعديل ملف التكوين يدويًا.

`,
    text33: `• الحالة: \${status}
`,
    text34: `🔍 **تقرير تشخيص الصورة الرمزية**

`,
    text35: `
📸 **ذاكرة التخزين المؤقت للصورة الرمزية:**
`,
    text36: `الوقت: \${timestamp}`,
    text37: `🔴 **طلب استرداد**

`,
    text38: `📢 **إشعار النظام**

`,
    text39: `/ad_stats`,
    text4: `درجة المخاطرة: \${ban.risk_snapshot}
`,
    text40: `👤 **معلومات المستخدم:**
`,
    text41: `
🔎 **التحليل:**
`,
    text42: `📝 **النتائج التفصيلية:**
`,
    text43: `⏳ جار المعالجة، يرجى الانتظار...`,
    text44: `3. إضافة معرف المستخدم: \\`,
    text45: `3. إزالة معرف المستخدم: \\`,
    text46: `📊 **ملخص:**
`,
    text47: `النوع: \${type}
`,
    text48: `• 🧪 وضع الاختبار
`,
    text49: `**أوامر الإدارة:**
`,
    text5: `⏱️ **المدة:** \${duration} ثانية

`,
    text50: `**التنسيق الصحيح:**
`,
    text51: `\${hours} ساعات`,
    text52: `**معلومات المستخدم:**
`,
    text6: `• التحديثات: \${result.updated} منشورات
`,
    text7: `البيانات: \${JSON.stringify(data)}
`,
    text8: `• النقرات: \${ad.click_count} مرات
`,
    text9: `/official_ad_enable <ad_id>`,
    unbanNotBanned: `المستخدم غير محظور`,
    unbanUsageError: `خطأ في طريقة إزالة الحظر`,
    unbanUserNotFound: `المستخدم الذي تم إلغاء حظره لا يوجد`,
    userNotFound: `❌ المستخدم غير موجود.`,
    vip: `• انتهاء صلاحية VIP: \${new Date(user.vip_expire_at).toLocaleString('zh-TW')}
`,
    vip2: `• تم إنشاؤه مع VIP: \${post.created_with_vip_status ? '✅' : '❌'}
`,
    vip3: `• حالة VIP: \${isVip ? '✅ نعم' : '❌ لا'}
 {isVip ? '✅ 是' : '❌ 否'} \${isVip ? '✅ 是' : '❌ 否'}`,
    vip4: `• إجمالي مستخدمي VIP: \${stats.totalVipUsers}
`,
    vip5: `🔄 **بدء تحديث دفعة لصور مستخدمي VIP**

`,
    vip6: `⏰ **تم إرسال تذكير انتهاء صلاحية VIP**

`,
    vip7: `🎉 **شراء VIP جديد**

`,
    vip8: `⬇️ **تخفيض تلقائي لمستوى VIP**

`,
    vip9: `🔄 **تجديد VIP**

`,
  },
  adminNotification: {
    amount: `المبلغ: \${stars} ⭐`,
    data: `البيانات: \${data}`,
    daysLeft: `المتبقي: \${days} أيام`,
    expireDate: `تاريخ الانتهاء: \${date}`,
    newExpireDate: `تاريخ انتهاء جديد: \${date}`,
    paymentFailed: `❌ **فشل الدفع**`,
    paymentId: `معرّف الدفع: \`\${id}\``,
    reason: `السبب: \${reason}`,
    refundRequest: `🔴 **طلب استرداد**`,
    requestId: `معرّف الطلب: #\${id}`,
    systemNotification: `📢 **إشعار نظام**`,
    time: `الوقت: \${time}`,
    type: `النوع: \${type}`,
    user: `المستخدم: \`\${userId}\``,
    viewRefundsHint: `💡 استخدم /admin_refunds لعرض التفاصيل`,
    vipDowngraded: `⬇️ **VIP 自動降級**`,
    vipPurchased: `🎉 **新 VIP 購買**`,
    vipReminderSent: `⏰ **VIP 到期提醒已發送**`,
    vipRenewed: `🔄 **VIP 續費**`,
  },
  age: {
    daysAgo: `منذ \${days} يوم`,
    hoursAgo: `منذ \${hours} ساعة`,
    justNow: `الآن فقط`,
  },
  analytics: {
    ad: `{officialImpressions} {officialClicks} {officialCtr} {officialRewardsGranted} {vipPageViews} {vipPurchaseIntents} {vipConversions} {vipConversionRate} {vipRevenue} \${vipRevenue}`,
    ad2: `{start} {end} {thirdPartyImpressions} {thirdPartyCompletions} {thirdPartyCompletionRate} {thirdPartyRewardsGranted} {officialImpressions} {officialClicks} {officialCtr} {officialRewardsGranted}`,
    ad3: `{start} {end}`,
    complete: `{provider.completion_rate.toFixed(1)} \${provider.completion_rate.toFixed(1)}`,
    complete2: `{provider.total_completions} \${provider.total_completions}`,
    completion: `
• الاكتمالات: {completions} مرات`,
    completionRate: `
• معدل الاكتمال: {rate}%`,
    conversionStepsTitle: `[ترجمة مطلوبة من zh-TW.ts]`,
    invite: `{initiated} {accepted} {activated} {conversionRate} {bottlesThrown} {bottlesCaught} {conversationsStarted} {avgConversationRounds}`,
    message: `📊 **تقرير العمليات اليومية**
📅 التاريخ: {date}

**👥 بيانات المستخدمين**
• مستخدمون جدد: {newUsers} أفراد
• المستخدمون النشطون (DAU): {dau} أفراد
• معدل الاحتفاظ (D1): {d1Retention}%
• متوسط مدة الجلسة: {avgSessionDuration} دقائق

**📺 بيانات الإعلانات**
• إعلانات الطرف الثالث:
 - مرات الظهور: {thirdPartyImpressions} مرات
 - الإكمالات: {thirdPartyCompletions} مرات
 - معدل الإكمال: {thirdPartyCompletionRate}%
 - المكافآت الممنوحة: {thirdPartyRewardsGranted} رصيد`,
    message2: `📊 **تقرير العمليات اليومية**
📅 التاريخ: {date}

⚠️ **لا توجد بيانات متاحة اليوم**

قد يكون ذلك بسبب:
• تم نشر النظام للتو، مع عدم وجود نشاط للمستخدمين بعد
• لم يقم أي مستخدم باستخدام الروبوت اليوم
• لم يتم تفعيل ميزات تتبع البيانات بعد

💡 **متى ستظهر البيانات؟**
• يحتاج المستخدمون لأداء أي من الإجراءات التالية:
 - إرسال /start للتسجيل
 - رمي أو التقاط زجاجة رسائل
 - مشاهدة الإعلانات
 - شراء VIP

• يُنصح بالانتظار حتى يبدأ المستخدمون في استخدامها قبل التحقق
• أو محاكاة سلوك المستخدم في بيئة الاختبار`,
    message3: `

**📈 معدل التحويل الكلي: \${report.overall_conversion_rate.toFixed(1)}%**`,
    message4: `
• معدل التحويل: \${step.conversion_rate.toFixed(1)}%`,
    message5: `
• معدل الخطأ: \${provider.error_rate.toFixed(1)}%`,
    message6: `
• الطلبات: \${provider.total_requests} مرات`,
    providerComparisonTitle: `[ترجمة مطلوبة من zh-TW.ts]`,
    purchaseSuccess: `[ترجمة مطلوبة من zh-TW.ts]`,
    request: `
• الطلبات: {requests} مرات`,
    text: `
• عدد المستخدمين: \${step.user_count}`,
    text2: `نية الشراء (انقر للشراء)`,
    vip: `📊 **قمع التحويل VIP**
📅 الفترة: {start} ~ {end}

⚠️ **لا توجد بيانات متاحة بعد**

قد يكون ذلك بسبب:
• تم نشر النظام للتو، مع عدم وجود نشاط للمستخدمين بعد
• لا توجد أحداث متعلقة بـ VIP في الإطار الزمني المحدد
• لم يتم تفعيل ميزات تتبع البيانات بعد

💡 **متى ستظهر البيانات؟**
• تتطلب بيانات تحويل VIP من المستخدمين القيام بالإجراءات التالية:
 1. عرض مقدمة ميزة VIP
 2. النقر لشراء VIP
 3. إكمال شراء VIP

• يُنصح بالانتظار من 24 إلى 48 ساعة قبل التحقق
• أو محاكاة سلوك المستخدم في بيئة الاختبار`,
    vip2: `📊 **قمع التحويل VIP**
📅 الفترة: {start} ~ {end}`,
    vip3: `الوعي (رؤية تنبيه VIP)`,
    vip4: `الاعتبار (عرض تفاصيل VIP)`,
    vip5: `الاهتمام (النقر لعرض VIP)`,
  },
  appeal: {
    alreadyExists: `⏳ لديك استئناف معلّق (المعرف: #\${appealId})

الحالة: \${status}
تم التقديم: \${time}
\\نيرجى الانتظار بصبر لمراجعة الإدارة.`,
    notBanned: `✅ حسابك غير محظور، لا حاجة للاستئناف.`,
    notFound: `❌ تعذر العثور على سجل الاستئناف الخاص بك.`,
    notes: `ملاحظة:`,
    prompt: `📝 **تقديم استئناف**

يرجى شرح السبب الذي تعتقد أنه تسبب في حظر حسابك وكيف تود حل هذه القضية.

💡 يرجى وصف وضعك بالتفصيل لمساعدة الإدارة في معالجة استئنافك بشكل أسرع.`,
    reasonTooLong: `❌ سبب الاستئناف طويل جدًا. يرجى الحفاظ عليه ضمن 500 حرف.`,
    reasonTooShort: `❌ سبب الاستئناف قصير جدًا. يرجى إدخال ما لا يقل عن 10 أحرف.`,
    reviewedAt: `وقت المراجعة:`,
    status: `📋 **حالة الاستئناف**

معرّف الاستئناف: #\${appealId}
الحالة: \${status}
وقت التقديم: \${createdAt}\${reviewInfo ? '

' + reviewInfo : ''}`,
    statusApproved: `موافق`,
    statusPending: `قيد المراجعة`,
    statusRejected: `مرفوض`,
    submitted: `✅ **تم تقديم الاستئناف**

معرّف الاستئناف: #\${appealId}
الحالة: قيد المراجعة

سنعالج استئنافك في غضون 1-3 أيام عمل.
سوف يتم إبلاغك بالنتائج عبر البوت.`,
  },
  block: {
    cannotIdentify: `⚠️ غير قادر على تحديد شريك المحادثة`,
    catchNewBottle: `💡 استخدم /catch لالتقاط زجاجة رسائل جديدة وبدء محادثة جديدة.`,
    conversationInfoError: `⚠️ معلومات المحادثة غير صحيحة.`,
    conversationMayEnded: `قد تكون المحادثة قد انتهت أو لا existir.`,
    conversationNotFound: `⚠️ غير قادر على العثور على هذه المحادثة`,
    ensureReply: `يرجى التأكد من أنك ترد على الرسالة المرسلة من الطرف الآخر (مع المعرف #).`,
    hint: `💡 يساعد ذلك على تحديد الهدف بدقة لمنعه.`,
    replyRequired: `⚠️ يرجى الضغط مطولاً على الرسالة التي تريد حظرها ثم الرد بالأمر.`,
    step1: `1️⃣ اضغط مطولاً على رسالة الطرف الآخر`,
    step2: `2️⃣ اختر 'رد'`,
    step3: `3️⃣ ادخل /block`,
    steps: `**خطوات العملية:**`,
    success: `✅ تم حظر هذا المستخدم (#\${identifier})`,
    willNotMatch: `لن تتطابق بعد الآن مع زجاجات الرسائل الخاصة ببعضكما البعض.`,
  },
  bottle: {
    bottle13: `محتوى زجاجة الرسائل`,
    cancelled: `❌ تم الإلغاء \${zodiac}`,
    'catch.anonymousUser': `مستخدم مجهول`,
    'catch.back': `🏠 العودة إلى القائمة الرئيسية: /menu`,
    'catch.banned': `❌ تم حظر حسابك ولا يمكنك التقاط زجاجات الرسائل.

لأي أسئلة، يرجى استخدام /appeal لتقديم استئناف.`,
    'catch.block': `• لإيقاف الدردشة، استخدم /block للحظر
`,
    'catch.bottle': `😔 حالياً، لا توجد زجاجات رسائل مناسبة لك

`,
    'catch.bottle2': `• أو قم برمي زجاجة رسالة بنفسك: /throw`,
    'catch.bottle3': `🎣 شخص ما قد التقط زجاجة رسالتك!

`,
    'catch.bottle4': `🧴 لقد التقطت زجاجة رسالة!

`,
    'catch.bottle5': `💡 عد غداً لالتقاط مزيد من زجاجات الرسائل!`,
    'catch.bottleTaken': `❌ تم التقاط هذه الزجاجة الرسائل بالفعل من قبل شخص آخر، يرجى تجربة زجاجات رسائل أخرى!`,
    'catch.catch': `📊 اختيارات اليوم: \${newCatchesCount}/\${quota}

`,
    'catch.conversation': `تم إنشاء محادثة مجهولة لك، تعال ابدأ الدردشة～

`,
    'catch.conversation2': `• هذه محادثة مجهولة، يرجى حماية خصوصيتك
`,
    'catch.conversation3': `📊 عرض جميع المحادثات`,
    'catch.language': `🗣️ اللغة: \\\${language}

`,
    'catch.mbti': `🧠 MBTI: \\\${mbti}
`,
    'catch.message': `💫 درجة المطابقة: \${Math.round(matchScore)} نقاط (مطابقة ذكية)

`,
    'catch.message2': `\${catcherGender} | 📅 \${catcherAge} سنوات

`,
    'catch.message3': `conv_reply_\${conversationIdentifier}`,
    'catch.message4': `2️⃣ اضغط مطولاً على هذه الرسالة، اختر 'رد' وأدخل محتواك

`,
    'catch.message5': `1️⃣ انقر على زر '💬 رد على الرسالة' أدناه
`,
    'catch.message6': `2️⃣ اضغط مطولاً على هذه الرسالة، اختر 'رد' وأدخل محتواك`,
    'catch.nickname': `📝 اللقب: \${ownerMaskedNickname}
`,
    'catch.nickname2': `📝 اللقب: \${catcherNickname}
`,
    'catch.notRegistered': `❌ يرجى إكمال عملية التسجيل قبل التقاط زجاجات الرسائل.

استخدم /start لمتابعة التسجيل.`,
    'catch.originalContent': `أصلي: {content}`,
    'catch.originalLanguage': `اللغة الأصلية: {language}`,
    'catch.quotaExhausted': `❌ تم استنفاد حصة زجاجات الرسائل لليوم (\\\${quotaDisplay})`,
    'catch.replyButton': `💬 الرد على الرسالة`,
    'catch.replyMethods': `💡 **طريقتان للرد**: 
`,
    'catch.report': `• إذا واجهت محتوى غير مناسب، يرجى استخدام /report للإبلاغ
`,
    'catch.safetyTips': `⚠️ تذكير أمني: 
`,
    'catch.settings': `🧠 MBTI: \${bottle.mbti_result}
 {bottle.mbti_result || '未設定'} \${bottle.mbti_result}`,
    'catch.settings10': `غير محدد`,
    'catch.settings11': `غير محدد`,
    'catch.settings2': `غير محدد`,
    'catch.settings3': `غير محدد`,
    'catch.settings4': `غير محدد`,
    'catch.settings5': `غير محدد`,
    'catch.settings6': `غير محدد`,
    'catch.settings7': `غير محدد`,
    'catch.settings8': `غير مضبوط`,
    'catch.settings9': `غير مضبوط`,
    'catch.short': `💡 نصيحة:
`,
    'catch.short2': `• يرجى المحاولة لاحقًا
`,
    'catch.short3': `مستخدم مجهول`,
    'catch.short4': `♂️ ذكر`,
    'catch.short5': `♀️ أنثى`,
    'catch.text': `لغة الترجمة: \\\${catcherLangDisplay}
`,
    'catch.text2': `اللغة الأصلية: \\\${bottleLangDisplay}
`,
    'catch.text3': `🗣️ اللغة: \\\${ownerLanguage}

`,
    'catch.text4': `• لإيقاف الدردشة، يمكنك استخدام /block للحظر

`,
    'catch.text5': `النص الأصلي: \\\${bottle.content}
`,
    'catch.text6': `💬 خدمة الترجمة تواجه مشاكل مؤقتة؛ تم استخدام ترجمة احتياطية
`,
    'catch.text7': `الترجمة: \\\${bottleContent}
`,
    'catch.text8': `💡 **طريقتان للرد**:
`,
    'catch.translatedContent': `ترجمة: {content}`,
    'catch.translatedLanguage': `اللغة المترجمة: {language}`,
    'catch.translationServiceFallback': `💬 خدمة الترجمة تواجه مشاكل مؤقتة، تم استخدام ترجمة احتياطية`,
    'catch.translationServiceUnavailable': `⚠️ خدمة الترجمة غير متاحة مؤقتًا، النص الأصلي أدناه`,
    'catch.unknown': `غير معروف`,
    'catch.zodiac': `⭐ برج: \\\${bottle.zodiac}
 {bottle.zodiac || 'Virgo'} \${bottle.zodiac}`,
    'catch.zodiac2': `⭐ برج: \\\${catcherZodiac}
`,
    containsUrl: `لا يمكن أن تحتوي محتويات زجاجة الرسائل على أي روابط`,
    empty: `لا يمكن أن تكون محتويات زجاجة الرسائل فارغة`,
    friendlyContent: `• المحتوى الودود والمحترم من المرجح أن يتم اختياره!`,
    inappropriate: `تحتوي محتويات زجاجة الرسائل على محتوى غير ملائم، يرجى تعديلها وإعادة تقديمها`,
    selected: `المختار: \${selected}`,
    selectedItem: `✅ تم الاختيار \${zodiac}`,
    'throw.age': `• شريحة العمر متشابهة ✓`,
    'throw.aiModerationFailed': `فشل مراجعة محتوى الذكاء الاصطناعي`,
    'throw.back': `↩️ العودة إلى قائمة الفلاتر`,
    'throw.bloodType': `🩸 **فلتر فصيلة الدم**

`,
    'throw.bloodType2': `• فصيلة الدم: تصفية فصائل الدم المحددة
`,
    'throw.bloodType3': `اختر فصيلة الدم التي ترغب في مطابقتها:`,
    'throw.bloodType4': `🩸 فلتر فصيلة الدم`,
    'throw.bloodType5': `🌈 أي فصيلة دم`,
    'throw.bottle': `
💡 زجاجة الرسائل هذه تناسبك تمامًا!
\\\${highlights.join('
')}
`,
    'throw.bottle10': `🍾 تم إلقاء زجاجة الرسائل!

`,
    'throw.bottle11': `🍾 إلقاء زجاجة الرسائل`,
    'throw.bottle2': `🎯 تم إرسال زجاجتك إلى **3 مستلمين**: 
`,
    'throw.bottle3': `🍾 **إلقاء زجاجة رسالتك...**

`,
    'throw.bottle4': `🍾 **إلقاء زجاجة الرسائل** #THROW

`,
    'throw.bottle5': `معرف الزجاجة: #\\\${bottleId}

`,
    'throw.bottle6': `📝 **يرجى إدخال محتوى زجاجة الرسائل الخاصة بك**

`,
    'throw.bottle7': `1️⃣ انقر على الزر أدناه '🍾 إلقاء زجاجة الرسائل'
`,
    'throw.bottle8': `📝 يرجى إدخال محتوى زجاجة الرسائل: 

`,
    'throw.bottle9': `📝 يرجى إدخال محتوى زجاجة الرسائل:`,
    'throw.cancel': `💡 انقر للاختيار أو إلغاء اختيار نوع MBTI:`,
    'throw.cancel2': `💡 انقر للاختيار أو إلغاء اختيار علامة البروج:`,
    'throw.catch': `• الفتحة 3: حمام عام (بانتظار أن يتم استلامه)

`,
    'throw.catch2': `• الفتحة 2: حمام عام (بانتظار أن يتم استلامه)
`,
    'throw.catch3': `• فتحة 1: حوض عام (بانتظار الالتقاط)
`,
    'throw.catch4': `🌊 في انتظار شخص مقدر له أن يقوم بالتقاطها...
`,
    'throw.complete': `⚙️ **فلتر متقدم**

\\\${summary}
💡 تابع التعديل أو أكمل الفلتر:`,
    'throw.complete2': `🎯 **تم الانتهاء من المطابقة 1:**
`,
    'throw.complete3': `📝 لديك مسودة غير مكتملة واحدة

`,
    'throw.complete4': `⏳ الوقت المقدر للاكتمال هو 3-5 ثوانٍ`,
    'throw.complete5': `⏳ الوقت المقدر للاكتمال هو 2-3 ثوانٍ`,
    'throw.complete6': `⏳ الوقت المقدر للاكتمال هو 1-2 ثوانٍ`,
    'throw.conversation': `💬 معرف المحادثة: \\\${vipMatchInfo.conversationIdentifier}

`,
    'throw.conversation2': `💡 نصيحة: كل محادثة مستقلة ويمكن أن تحدث في نفس الوقت

`,
    'throw.conversation3': `💡 يمكنك تلقي **ما يصل إلى 3 محادثات**!
`,
    'throw.conversation4': `💬 يمكنك تلقي **ما يصل إلى 3 محادثات**!
`,
    'throw.conversation5': `استخدم /chats لرؤية جميع المحادثات

`,
    'throw.conversation6': `📊 استخدم /chats لرؤية جميع المحادثات`,
    'throw.conversation7': `استخدم /chats لرؤية جميع المحادثات`,
    'throw.currentSelection': `الاختيار الحالي: {genderText}`,
    'throw.gender': `• الجنس: \\\${selectedGender}
`,
    'throw.gender2': `👤 **فلتر الجنس**

`,
    'throw.gender3': `• الجنس: تصفية حسب الجنس

`,
    'throw.gender4': `💡 اختر الجنس الذي تريده:`,
    'throw.gender5': `👤 فلتر الجنس`,
    'throw.genderLabel': `• الجنس: {gender}
`,
    'throw.mbti': `• MBTI: \\\${selectedMBTI.length > 0 ? selectedMBTI.join(', ') : 'لا حدود'}
 {selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '無限制'} \${selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '無限制'}`,
    'throw.mbti2': `المحدد: \\\${selectedMBTI.length > 0 ? selectedMBTI.join(', ') : 'لا شيء'}

 {selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '無'} \${selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '無'}`,
    'throw.mbti3': `المحدد: \\\${selectedMBTI.length > 0 ? selectedMBTI.join(`,
    'throw.mbti4': `)}🧠 **فلتر MBTI**

`,
    'throw.mbti5': `• MBTI: تصفية أنواع الشخصية المحددة
`,
    'throw.mbti6': `• تطابق MBTI عالي ✓`,
    'throw.mbti7': `🧠 فلتر MBTI`,
    'throw.mbtiLabel': `• MBTI: {mbti}
`,
    'throw.message': `المحدد: \\\${selectedZodiac.length > 0 ? selectedZodiac.map((z) => ZODIAC_NAMES[z]).join(', ') : 'لا شيء'}

`,
    'throw.message2': `الاختيار الحالي: \\\${currentGender}

`,
    'throw.message3': `المحدد: \\\${selectedZodiac.length > 0 ? selectedZodiac.map((z) => ZODIAC_NAMES[z]).join(`,
    'throw.message4': `)}الاختيار الحالي: \\\${bloodTypeDisplay[currentBloodType]}

`,
    'throw.message5': `👤 الخصم: \\\${vipMatchInfo.matcherNickname}
`,
    'throw.message6': `"مرحبًا! أنا شخص يستمتع بالموسيقى والأفلام، وآمل أن ألتقي بأصدقاء ذوي اهتمامات مشابهة~"

`,
    'throw.message7': `💡 يمكنك تعديل تفضيلات المطابقة الخاصة بك في /edit_profile

`,
    'throw.message8': `💬 اضغط على /reply للرد على الرسائل وبدء الدردشة
`,
    'throw.nickname': `📝 لقب الخصم: \\\${matchedUserMaskedNickname}
`,
    'throw.quota': `• المزيد من الحصص (30 في اليوم)
`,
    'throw.quota2': `🎁 قم بدعوة الأصدقاء لزيادة حصتك:
`,
    'throw.settings': `🧠 MBTI: \\\${matchResult.user.mbti_result}
 {matchResult.user.mbti_result || '未設定'} \${matchResult.user.mbti_result}`,
    'throw.settings2': `⭐ الأبراج: \\\${matchResult.user.zodiac}
 {matchResult.user.zodiac || '未設定'} \${matchResult.user.zodiac}`,
    'throw.settings3': `🧠 MBTI: \${user.mbti_result}
 {user.mbti_result || '未設定'} \${user.mbti_result}`,
    'throw.settings4': `⭐ برج: \${user.zodiac_sign}
 {user.zodiac_sign || '未設定'} \${user.zodiac_sign}`,
    'throw.settings5': `لم يتم تعيينه`,
    'throw.settings6': `لم يتم تعيينه`,
    'throw.settings7': `لم يتم تعيينه`,
    'throw.settings8': `لم يتم تعيينه`,
    'throw.short': `• نفس اللغة ✓`,
    'throw.short10': `♋ السرطان`,
    'throw.short11': `♌ الأسد`,
    'throw.short12': `♍ العذراء`,
    'throw.short13': `♎ الميزان`,
    'throw.short14': `♏ العقرب`,
    'throw.short15': `♐ القوس`,
    'throw.short16': `♑ الجدي`,
    'throw.short17': `♒ الدلو`,
    'throw.short18': `♓ الحوت`,
    'throw.short19': `انتهاك`,
    'throw.short2': `🩸 فصيلة الدم AB`,
    'throw.short20': `غير محدود`,
    'throw.short21': `غير محدود`,
    'throw.short22': `لا حدود`,
    'throw.short23': `لا حدود`,
    'throw.short3': `🌈 أي شخص`,
    'throw.short4': `🩸 نوع A`,
    'throw.short5': `🩸 نوع B`,
    'throw.short6': `🩸 نوع O`,
    'throw.short7': `♈ برج الحمل`,
    'throw.short8': `♉ برج الثور`,
    'throw.short9': `♊ برج الجوزاء`,
    'throw.start': `✍️ إعادة تشغيل`,
    'throw.success': `زجاجة رسالة واحدة = 3 مستلمين، يحسن بشكل كبير معدل نجاح المطابقة

`,
    'throw.success2': `✨ **تم تفعيل امتيازات VIP! المطابقة الذكية ناجحة!**

`,
    'throw.success3': `🎯 تم مطابقة زجاجة رسالتك بنجاح!

`,
    'throw.text': `💝 نسبة المطابقة: \\\${matchPercentage}%
`,
    'throw.text10': `🎯 البحث عن أفضل مطابقة لك

`,
    'throw.text11': `
💬 في انتظار الرد...
`,
    'throw.text12': `• المستخدمون المجانيون: حتى +7
`,
    'throw.text13': `• لا تتضمن معلومات الاتصال الشخصية

`,
    'throw.text14': `💡 **طريقتان للإدخال**: 
`,
    'throw.text15': `📊 المستخدمون المجانيون: 3 يوميًا
`,
    'throw.text16': `اختر المعايير التي ترغب في تصفيتها:

`,
    'throw.text17': `• تصفية متقدمة وترجمة

`,
    'throw.text18': `وقت الإنشاء:\\\${age}
`,
    'throw.text19': `استخدم /vip للتحديث الآن`,
    'throw.text2': `• 🆕 فرصة تعريض ثلاثية (1 مرة = 3 أهداف)
`,
    'throw.text20': `💬 **مثال**:
`,
    'throw.text21': `استخدم /vip لمعرفة المزيد`,
    'throw.text22': `هل ترغب في متابعة تحرير هذا المسودة؟`,
    'throw.text23': `💡 يمكنك دمج معايير متعددة`,
    'throw.text24': `معايير التصفية الحالية:

`,
    'throw.text3': `💡 قد يستغرق هذا بضع ثوان، نحن نجد الأشخاص الأنسب لك`,
    'throw.text4': `الإختيار الحالي:\\\${currentGender ===`,
    'throw.text5': `🎯 البحث عن الأهداف:\\\${targetText}
`,
    'throw.text6': `🎯 العثور على 3 أهداف متطابقة لك

`,
    'throw.text7': `📨 **2 أماكن إضافية في الانتظار:**
`,
    'throw.text8': `🔍 مطابقة ذكية لأفضل الأهداف...

`,
    'throw.text9': `معاينة المحتوى:\\\${preview}

`,
    'throw.throw': `📊 اليوم لقد قمت بإسقاط:\\\${quotaDisplay}

`,
    'throw.unlimited': `غير محدود`,
    'throw.vip': `💎 المستخدمون المميزون: 30 في اليوم (تعريض ثلاثي)

`,
    'throw.vip2': `💎 **ترقية إلى VIP لفرصة تعريض ثلاثي!**
`,
    'throw.vip3': `⚙️ **تصفية متقدمة (حصري للمستخدمين المميزين)**

`,
    'throw.vip4': `• المستخدمين المميزين: حتى +70

`,
    'throw.vip5': `✨ **ت privileges المميزة فعالة!**

`,
    'throw.vip6': `💡 ترقية إلى VIP لتلقي: 
`,
    'throw.vip7': `✨ ت privileges المميزة قيد التفعيل
`,
    'throw.zodiac': `• برج: \\\\$\\{selectedZodiac.length > 0 ? selectedZodiac.map((z) => ZODIAC_NAMES[z]).join(', ') : 'لا حدود'}
`,
    'throw.zodiac2': `⭐ برج: \\\\$\\{matchResult.user.zodiac ||`,
    'throw.zodiac3': `⭐ برج: \\\\$\\{user.zodiac_sign ||`,
    'throw.zodiac4': `⭐ **تصفية الأبراج**

`,
    'throw.zodiac5': `• برج: تصفية علامات الأبراج المحددة
`,
    'throw.zodiac6': `• توافق الأبراج ✓`,
    'throw.zodiac7': `⭐ تصفية الأبراج`,
    'throw.zodiacLabel': `• برج: {zodiac}
`,
    tips: `💡 نصيحة:`,
    tooLong: `محتويات زجاجة الرسائل طويلة جداً، مسموح بحد أقصى \${max} حرف (حالياً \${current} حرف)`,
    tooShort: `محتويات زجاجة الرسائل قصيرة جداً، مطلوب على الأقل \${min} حرف (حالياً \${current} حرف)`,
  },
  broadcast: {
    admin: `إلغاء يدوي من المشرف`,
    admin2: `مسح يدوي من المشرف (البث معلق)`,
    allBroadcastsNormal: `جميع حالات البث طبيعية.`,
    broadcastNotFound: `❌ لم يتم العثور على سجل البث`,
    cancelCommand: `/broadcast_cancel <broadcast_id>

`,
    cancelCorrectFormat: `**النمط الصحيح:**
`,
    cancelExample: `**مثال:**
`,
    cancelExampleCommand: `/broadcast_cancel 1`,
    cancelFailed: `❌ فشل في إلغاء البث: {error}`,
    cancelUsageError: `❌ استخدام غير صحيح

`,
    cancelled: `✅ تم إلغاء البث

`,
    cancelledId: `ID: {id}
`,
    cancelledStatus: `الحالة: ملغى

`,
    checkProgressLater: `
يرجى استخدام /broadcast_status لاحقًا للتحقق من التقدم.`,
    cleanupFailed: `❌ فشل في إزالة البث: {error}`,
    cleanupIds: `معرف البث: {ids}

`,
    cleanupMarkedFailed: `تم وضع علامة على هذه البثوث كحالة 'فاشلة'
`,
    cleanupSuccess: `✅ تمت إزالة {count} بثٍ عالق

`,
    cleanupViewStatus: `استخدم /broadcast_status لرؤية السجلات المحدثة.`,
    completedAt: `وقت الانتهاء: {time}
`,
    correctFormat: `**النمط الصحيح:**
`,
    createFailed: `❌ فشل إنشاء البث، يرجى المحاولة مرة أخرى لاحقًا.`,
    createFailedShort: `❌ فشل إنشاء البث.`,
    created: `✅ تم إنشاء البث

`,
    empty: `لا يمكن أن تكون زجاجة الرسائل فارغة`,
    error: `خطأ: {error}`,
    'estimate.immediate': `أرسل الآن (تقريبًا 1-2 ثانية)`,
    'estimate.minutes': `حوالي \${minutes} دقائق`,
    'estimate.seconds': `حوالي \${seconds} ثواني`,
    estimatedTime: `الوقت المقدر: {time}

`,
    example: `**مثال:**
`,
    exampleMessage: `سوف يخضع النظام للصيانة الليلة في الساعة 10:00 مساءً`,
    failed: `فشل: {count}
`,
    'filter.age': `العمر: {min}-{max} سنة`,
    'filter.atLeastOneRequired': `يجب أن يكون هناك فلتر واحد على الأقل`,
    'filter.birthdayToday': `عيد ميلاد اليوم`,
    'filter.country': `الدولة: {country}`,
    'filter.genderFemale': `أنثى`,
    'filter.genderMale': `ذكر`,
    'filter.genderOther': `آخر`,
    'filter.invalidAgeFormat': `نطاق العمر غير صالح: {value} (يجب أن يكون التنسيق min-max، مثل: 18-25)`,
    'filter.invalidAgeMinMax': `نطاق العمر غير صالح: {value} (يجب ألا يكون الحد الأدنى للعمر أكبر من الحد الأقصى)`,
    'filter.invalidAgeRange': `نطاق العمر غير صالح: {value} (يجب أن يكون العمر بين 18-99)`,
    'filter.invalidCountry': `رمز البلد غير صالح: {value} (يجب أن يكون حرفين كبيرين، مثل: TW، US، JP)`,
    'filter.invalidFormat': `تنسيق الفلتر غير صالح: {pair}`,
    'filter.invalidGender': `قيمة الجنس غير صالحة: {value} (يجب أن تكون ذكراً، أنثى، أو غير ذلك)`,
    'filter.invalidMbti': `نوع MBTI غير صالح: {value} (يجب أن يكون واحدًا من: {mbtis})`,
    'filter.invalidZodiac': `علامة برج زودياك غير صالحة: {value} (يجب أن تكون واحدة من: {zodiacs})`,
    'filter.mbti': `MBTI: {mbti}`,
    'filter.nonVipUsers': `مستخدم غير VIP`,
    'filter.unknownFilter': `فلتر غير معروف: {key}`,
    'filter.vipUsers': `مستخدم VIP`,
    'filter.zodiacAquarius': `الدلو`,
    'filter.zodiacAries': `الحمل`,
    'filter.zodiacCancer': `السرطان`,
    'filter.zodiacCapricorn': `الجدي`,
    'filter.zodiacGemini': `الجوزاء`,
    'filter.zodiacLeo': `الأسد`,
    'filter.zodiacLibra': `الميزان`,
    'filter.zodiacPisces': `الحوت`,
    'filter.zodiacSagittarius': `القوس`,
    'filter.zodiacScorpio': `العقرب`,
    'filter.zodiacTaurus': `الثور`,
    'filter.zodiacVirgo': `العذراء`,
    filterAge: `• العمر=18-25
`,
    filterCommand: `/broadcast_filter 

`,
    filterConfirmConditions: `**شروط الفلتر:**
{conditions}

`,
    filterConfirmMessage: `**محتوى الرسالة:**
{message}

`,
    filterConfirmTitle: `🔍 **أكد مرشح الإرسال**

`,
    filterCorrectFormat: `**الصيغة الصحيحة:**
`,
    filterCountry: `• country=TW|US|JP|...
`,
    filterCreateFailed: `❌ فشل في إنشاء بث مفلتر

{error}`,
    filterCreated: `✅ تم إنشاء مرشح الإرسال

`,
    filterCreatedConditions: `شروط الفلتر: {conditions}
`,
    filterCreatedEstimatedTime: `الوقت المقدر: {time}

`,
    filterCreatedId: `المعرف: {id}
`,
    filterCreatedSending: `سيتم إرسال البث في الخلفية. استخدم /broadcast_status {id} للتحقق من التقدم.`,
    filterCreatedUserCount: `عدد المستخدمين المطابقين: {count}
`,
    filterExample1: `/broadcast_filter gender=female,age=18-25,country=TW مرحبا بالجميع!
`,
    filterExample2: `/broadcast_filter vip=true,mbti=INTJ إشعار حدث خاص لفي آي بي
`,
    filterExample3: `/broadcast_filter zodiac=Scorpio رسالة خاصة لبرج العقرب`,
    filterExamples: `**مثال:**
`,
    filterFormat: `**صيغة المرشح:**
`,
    filterFormatError: `❌ خطأ في تنسيق الفلتر

{error}

`,
    filterGender: `• gender=male|female|other
`,
    filterMbti: `• mbti=INTJ|ENFP|...
`,
    filterQueryingUsers: `جارٍ البحث عن مستخدمين يستوفون المعايير...`,
    filterUsageError: `❌ استخدام غير صحيح

`,
    filterViewFormat: `يرجى استخدام /broadcast_filter لرؤية الصيغة الصحيحة.`,
    filterVip: `• vip=true|false

`,
    filterZodiac: `• zodiac=Aries|Taurus|...
`,
    foundStuckBroadcasts: `⚠️ تم اكتشاف {count} بث متعثر

`,
    id: `ID: {id}
`,
    idMustBeNumber: `❌ يجب أن يكون معرف الإرسال رقمًا`,
    maxUsersExceeded: `❌ نظام البث الحالي يدعم فقط البث لغاية \${max} مستخدمين.

عدد المستخدمين المستهدفين: \${current}`,
    messageContent: `محتوى الرسالة`,
    noPendingBroadcasts: `حالياً لا توجد أي إرساليات معلقة أو عالقة.

`,
    noRecords: `📊 لا توجد سجلات للبث حالياً`,
    noStuckBroadcasts: `✅ لا توجد بثوث للتنظيف

`,
    processQueueFailed: `❌ فشل في معالجة قائمة انتظار البث: {error}`,
    processingBroadcast: `معالجة البث رقم #{id}
`,
    progress: `التقدم: {sent}/{total} ({percentage}%)
`,
    queryStatusFailed: `❌ فشل في استعلام حالة البث: {error}`,
    queueProcessed: `✅ تمت معالجة قائمة البث

`,
    queueRemaining: `
يوجد {count} بث في الانتظار في قائمة الانتظار
`,
    queueTriggered: `{emoji} تم تفعيل معالجة قائمة الانتظار للبث

`,
    recentRecords: `📊 أحدث 5 سجلات للبث

`,
    recordId: `ID: {id}
`,
    recordProgress: `التقدم: {sent}/{total}
`,
    recordStatus: `الحالة: {status}
`,
    recordTarget: `الهدف: {type}
`,
    recordTime: `الوقت: {time}

`,
    sendingInBackground: `سيتم إرسال البث في الخلفية. استخدم /broadcast_status {id} للتحقق من التقدم.`,
    short: `قيد الانتظار`,
    short2: `في الانتظار`,
    startedAt: `وقت البدء: {time}
`,
    status: `الحالة: {status}
`,
    'status.cancelled': `ملغي`,
    'status.completed': `مكتمل`,
    'status.failed': `فشل`,
    'status.pending': `انتظار`,
    'status.sending': `جاري الإرسال`,
    statusPending: `معلق`,
    statusStuck: `معلقة (جارٍ المحاولة مرة أخرى)`,
    statusTitle: `📊 حالة البث`,
    stuckBroadcastConfirm: `**هل ترغب في تأكيد التنظيف؟**
`,
    stuckBroadcastConfirmCommand: `أكد باستخدام \`/broadcast_cleanup confirm\``,
    stuckBroadcastDivider: `━━━━━━━━━━━━━━━━
`,
    stuckBroadcastId: `**ID: {id}**
`,
    stuckBroadcastMessage: `الرسالة: {message}
`,
    stuckBroadcastNoRetry: `لن تتم معالجتها تلقائياً أو إعادة إرسالها

`,
    stuckBroadcastProgress: `التقدم: {sent}/{total}
`,
    stuckBroadcastStartTime: `وقت البدء: {time}

`,
    stuckBroadcastTarget: `الهدف: {type}
`,
    stuckBroadcastWillMarkFailed: `ستُعتبر هذه البثوث في حالة 'فشلت'
`,
    target: `الهدف: {target}
`,
    'target.all': `جميع المستخدمين`,
    'target.nonVip': `المستخدمين غير المميزين`,
    'target.unknown': `غير معروف`,
    'target.vip': `مستخدم VIP`,
    targetAll: `جميع المستخدمين`,
    targetNonVip: `المستخدمون غير VIP`,
    targetType: `الهدف: {type}
`,
    targetVip: `المستخدمون VIP`,
    tooLong: `لا يمكن أن تتجاوز زجاجة الرسائل \${max} حرفًا (حاليًا \${current} حرفًا)`,
    upgradeRequired: `يتطلب البث الجماعي ترقية في بنية النظام، يرجى الرجوع إلى BROADCAST_SYSTEM_REDESIGN.md`,
    usageError: `❌ استخدام غير صحيح

`,
    userCount: `عدد المستخدمين: {count} شخص
`,
    userCount2: `عدد المستخدمين: {count} شخص
`,
    viewAllRecords: `استخدم /broadcast_status لعرض جميع سجلات البث.`,
    viewDetailsHint: `💡 استخدم /broadcast_status للحصول على التفاصيل`,
    viewUpdatedStatus: `تحقق من الحالة المحدثة باستخدام /broadcast_status.`,
  },
  buttons: {
    ad: `➡️ الإعلان التالي`,
    back: `⬅️ عاد`,
    bottle: `📺 شاهد الإعلانات للحصول على المزيد من زجاجات الرسائل 🎁 (\${remaining}/20)`,
    bottle2: `💎 ترقية إلى VIP للحصول على المزيد من زجاجات الرسائل`,
    bottle3: `🌊 أرسل زجاجة رسائل`,
    bottle4: `🎣 التقاط زجاجة رسائل`,
    cancel: `إلغاء`,
    help: `❓ مساعدة`,
    invite: `👥 عرض رمز الدعوة`,
    invite2: `🎁 دعوة الأصدقاء`,
    mbtiMenu: `🧠 قائمة MBTI`,
    message: `💬 الرد على الرسالة`,
    profile: `✏️ تعديل الملف الشخصي`,
    profile2: `👤 الملف الشخصي`,
    returnToMenu: `🏠 العودة إلى القائمة الرئيسية`,
    settings: `⚙️ الإعدادات`,
    short: `🇲🇾 ماليزيا`,
    short10: `🇺🇸 الولايات المتحدة`,
    short11: `🇯🇵 اليابان`,
    short12: `🇰🇷 كوريا الجنوبية`,
    short13: `🇬🇧 المملكة المتحدة`,
    short14: `🇫🇷 فرنسا`,
    short15: `🇩🇪 ألمانيا`,
    short16: `🇹🇭 تايلاند`,
    short17: `🇦🇺 أستراليا`,
    short18: `💬 سجل الدردشات`,
    short19: `🌐 تغيير اللغة`,
    short2: `🇺🇳 علم الأمم المتحدة`,
    short20: `🎁 احصل على المكافأة`,
    short21: `🔄 مسح الاختيار`,
    short22: `تخطي`,
    short3: `📢 انضم إلى القناة الرسمية`,
    short4: `🇸🇬 سنغافورة`,
    short5: `🇨🇦 كندا`,
    short6: `🇳🇿 نيوزيلندا`,
    short7: `🇹🇼 تايوان`,
    short8: `🇨🇳 الصين`,
    short9: `🇭🇰 هونغ كونغ`,
    stats: `📊 إحصائيات`,
    targetAdvanced: `⚙️ مرشح متقدم (MBTI/البرج)`,
    targetAny: `🌈 يمكن لأي شخص`,
    targetFemale: `👩 أنثى`,
    targetMale: `👨 ذكر`,
    text: `👤 عرض ملف المستخدم`,
    vip: `💎 ترقية إلى VIP`,
  },
  catch: {
    anonymousUser: `مستخدم مجهول`,
    back: `🏠 العودة إلى القائمة الرئيسية: /menu`,
    banned: `❌ تم حظر حسابك ولا يمكنه التقاط زجاجات رسائل.

إذا كان لديك أي استفسارات، يرجى استخدام /appeal للطعن.`,
    block: `• إذا كنت لا ترغب في الدردشة بعد الآن، يمكنك استخدام /block للحظر.
`,
    bottle: `😔 حالياً، لا توجد زجاجات رسائل مناسبة لك.

`,
    bottle2: `• أو قم بإلقاء واحدة بنفسك: /throw`,
    bottle3: `🎣 شخص ما عثر على زجاجة رسائلك!

`,
    bottle4: `🧴 لقد قمت بالتقاط زجاجة رسائل!

`,
    bottle5: `💡 عد غداً لالتقاط المزيد من الزجاجات!`,
    bottleTaken: `❌ تم التقاط هذه الزجاجة بواسطة شخص آخر، يرجى تجربة زجاجات أخرى!`,
    catch: `📊 عدد الرسائل التي تم العثور عليها اليوم: \${newCatchesCount}/\${quota}

`,
    conversation: `تم إنشاء محادثة مجهولة لك. تعال وابدأ الدردشة!～

`,
    conversation2: `• هذه محادثة مجهولة، يرجى حماية خصوصيتك.
`,
    conversation3: `📊 عرض جميع المحادثات`,
    conversationError: `فشل إنشاء المحادثة`,
    language: `🗣️ اللغة: \${language}

`,
    mbti: `🧠 MBTI: \${mbti}
`,
    message: `💫 درجة المطابقة: \${Math.round(matchScore)} نقطة (مطابقة ذكية)

`,
    message2: `\${catcherGender} | 📅 \${catcherAge} سنة

`,
    message3: `conv_reply_\${conversationIdentifier}`,
    message4: `2️⃣ اضغط طويلاً على هذه الرسالة، اختر 'رد' وأدخل محتواك.

`,
    message5: `1️⃣ انقر على زر '💬 رد على الرسالة' أدناه.
`,
    message6: `2️⃣ اضغط لفترة طويلة على هذه الرسالة، اختر 'رد', وأدخل محتواك`,
    nickname: `📝 اللقب: \${ownerMaskedNickname}
`,
    nickname2: `📝 اللقب: \${catcherNickname}
`,
    notRegistered: `❌ يرجى إكمال عملية التسجيل قبل التقاط زجاجات الرسائل.

استخدم /start لمتابعة التسجيل.`,
    originalContent: `النص الأصلي: {content}`,
    originalLanguage: `اللغة الأصلية: {language}`,
    quotaExhausted: `❌ تم استخدام حصة زجاجة الرسائل اليوم (\${quotaDisplay})`,
    replyButton: `💬 رد على الرسالة`,
    replyMethods: `💡 **طريقتان للرد**:
`,
    report: `• إذا واجهت محتوى غير مناسب، يرجى استخدام /report للإبلاغ.
`,
    safetyTips: `⚠️ نصائح السلامة: 
`,
    settings: `🧠 MBTI: \${bottle.mbti_result}
 {bottle.mbti_result || '未設定'} \${bottle.mbti_result}`,
    settings10: `غير محدد`,
    settings11: `غير محدد`,
    settings2: `غير محدد`,
    settings3: `غير محدد`,
    settings4: `غير محدد`,
    settings5: `غير محدد`,
    settings6: `غير محدد`,
    settings7: `غير محدد`,
    settings8: `غير محدد`,
    settings9: `غير محدد`,
    short: `💡 نصيحة:
`,
    short2: `• يرجى المحاولة لاحقًا
`,
    short3: `مستخدم مجهول`,
    short4: `♂️ ذكر`,
    short5: `♀️ أنثى`,
    text: `لغة الترجمة: \${catcherLangDisplay}
`,
    text2: `اللغة الأصلية: \${bottleLangDisplay}
`,
    text3: `🗣️ اللغة: \${ownerLanguage}

`,
    text4: `• إذا كنت لا ترغب في المحادثة بعد الآن، استخدم /block للحظر

`,
    text5: `النص الأصلي: \${bottle.content}
`,
    text6: `💬 خدمة الترجمة تعاني من مشاكل مؤقتة، باستخدام الترجمة الاحتياطية
`,
    text7: `الترجمة: \${bottleContent}
`,
    text8: `💡 **طريقتان للرد**:
`,
    translatedContent: `الترجمة: {content}`,
    translatedLanguage: `لغة الترجمة: {language}`,
    translationServiceFallback: `💬 خدمة الترجمة تواجه مشاكل مؤقتة، يتم استخدام ترجمة احتياطية`,
    translationServiceUnavailable: `⚠️ خدمة الترجمة غير متوفرة حالياً، فيما يلي النص الأصلي`,
    unknown: `غير معروف`,
    zodiac: `⭐ برجك: {zodiac}
`,
    zodiac2: `⭐ برج: \${catcherZodiac}
`,
  },
  channelMembership: {
    claimButton: `✅ استلم المكافأة`,
    claimReward: `اضغط على الزر أدناه لاستلام المكافأة: +1 زجاجة رسائل`,
    joined: `🎉 تم الكشف عن انضمامك للقناة الرسمية!`,
    leftChannel: `❌ تم الكشف عن مغادرتك للقناة، لا يمكن استلام المكافأة.`,
    notJoined: `❌ لم يتم الكشف عن عضويتك في القناة، يرجى الانضمام أولاً والمحاولة مرة أخرى`,
    oneTimeReward: `💡 هذه مكافأة لمرة واحدة وستضاف إلى حصة اليوم بعد الاستلام.`,
    rewardAdded: `المكافأة: +1 زجاجة رسائل (تم إضافتها لحصة اليوم)`,
    rewardGranted: `✅ تم إصدار المكافأة! +1 زجاجة رسائل`,
    taskCompleted: `🎉 تهانينا على إكمال المهمة: انضم إلى القناة الرسمية!`,
    viewMoreTasks: `💡 استخدم /tasks لرؤية المزيد من المهام`,
    viewTaskCenter: `[📋 مشاهدة مركز المهام] → /tasks`,
  },
  common: {
    ad: `📺 إعلانات اليوم: \${adsWatched}/\${AD_REWARD_CONSTANTS.MAX_ADS_PER_DAY} | earned \${quotaEarned} حصص | المتبقي \${remaining} مرة`,
    ad2: `📺 إعلانات اليوم: \${adsWatched}/\${AD_REWARD_CONSTANTS.MAX_ADS_PER_DAY} ✅ تم الوصول للحد الأقصى | earned \${quotaEarned} حصص`,
    ad3: `📺 إعلانات اليوم: 0/\${AD_REWARD_CONSTANTS.MAX_ADS_PER_DAY} | earned 0 حصص`,
    ad4: `• 📺 شاهد الإعلانات (المتبقي \${remaining}/20 مرة)
`,
    ad5: `• 📺 شاهد الإعلانات (تم الوصول للحد الأقصى اليوم)
`,
    ad6: `• تجنب الإعلانات أو المحتوى غير المناسب

`,
    ad7: `📊 لا توجد إعلانات رسمية متاحة`,
    ad8: `📢 إعلانات مزعجة`,
    ad9: `💡 المزيد من الإعلانات الرسمية متاحة للمشاهدة!`,
    admin: `يرجى المحاولة مرة أخرى لاحقًا أو الاتصال بالمسؤول.`,
    age: `نطاق العمر غير صالح: \${trimmedValue} (يجب أن يكون التنسيق min-max، على سبيل المثال، 18-25)`,
    age2: `العمر: \${filters.age.min}-\${filters.age.max} سنة`,
    age3: `نطاق العمر غير صالح: \${trimmedValue} (يجب أن يكون العمر بين 18-99)`,
    age4: `نطاق العمر غير صالح: \${trimmedValue} (يجب ألا يكون الحد الأدنى للعمر أكبر من الحد الأقصى للعمر)`,
    anonymous: `مجهول`,
    anonymousUser: `[ترجمة مطلوبة من zh-TW.ts]`,
    anyBloodType: `🌈 أي فصيلة دم`,
    anyone: `🌈 أي شخص`,
    back: `💡 أدخل /menu للعودة إلى القائمة الرئيسية في أي وقت`,
    back2: `↩️ العودة لتعديل الملف الشخصي`,
    back3: `🏠 العودة إلى القائمة الرئيسية`,
    prev: `⬅️ السابق`,
    next: `التالي ➡️`,
    back4: `↩️ العودة`,
    backToMainMenu: `العودة إلى القائمة الرئيسية`,
    birthday: `🎂 تاريخ الميلاد: \${updatedUser.birthday}
`,
    birthday2: `🎂 تاريخ الميلاد: \${user.birthday}
`,
    birthday3: `عيد ميلاد اليوم`,
    bloodType: `🩸 فصيلة الدم: \${bloodTypeText}

`,
    bloodType2: `🩸 **تعديل فصيلة الدم**

`,
    bloodType3: `يرجى اختيار فصيلة دمك:`,
    bloodType4: `🩸 تحرير فصيلة الدم`,
    bloodTypeA: `🩸 نوع A`,
    bloodTypeAB: `🩸 نوع AB`,
    bloodTypeB: `🩸 نوع B`,
    bloodTypeO: `🩸 نوع O`,
    bottle: `محتوى زجاجة الرسائل قصير جداً، يجب أن يكون هناك على الأقل \${MIN_BOTTLE_LENGTH} حرف (الحالي \${trimmedContent.length} حرف)`,
    bottle10: `مكافأة: +1 زجاجة رسائل (تمت إضافتها إلى حصة اليوم)

`,
    bottle11: `لن يتم مطابقتك بعد الآن مع زجاجات الرسائل لبعضكما البعض.

`,
    bottle12: `ما نوع الشخص الذي ترغب في العثور عليه عند رمي زجاجة رسائل؟

`,
    bottle13: `استخدم /throw لرمي زجاجة رسائل وبدء الدردشة!`,
    bottle14: `محتوى زجاجة الرسائل يحتوي على مواد غير مناسبة، يرجى التعديل وإعادة الإرسال`,
    bottle15: `انقر على الزر أدناه للمطالبة بالمكافأة: +1 زجاجة رسائل

`,
    bottle16: `💡 في المرة القادمة التي ترمي فيها زجاجة رسائل، سيتم استخدام هذا الإعداد تلقائيًا.`,
    bottle17: `🌊 ارمي زجاجة رسائل - /throw
`,
    bottle18: `🎣 التقط زجاجة رسائل - /catch
`,
    bottle19: `🎉 التأكيد سيكسبك مكافأة +1 زجاجة رسائل!`,
    bottle2: `محتوى زجاجة الرسائل طويل جداً، الحد الأقصى هو \${MAX_BOTTLE_LENGTH} حرف (الحالي \${content.length} حرف)`,
    bottle20: `✏️ يرجى إدخال محتوى زجاجة الرسائل الجديد: 

`,
    bottle21: `• استخدم /catch لالتقاط زجاجة رسائل جديدة`,
    bottle22: `• /throw - ارمي زجاجة رسائل
`,
    bottle23: `• /catch - التقط زجاجة رسائل
`,
    bottle24: `• /throw - ارمي زجاجة رسائل
`,
    bottle25: `• /catch - التقط زجاجة رسائل
`,
    bottle26: `• أرسل محتوى المسودة لرمي زجاجة رسائل`,
    bottle27: `📦 **أرسل زجاجة رسائل**
`,
    bottle28: `🎣 **التقط زجاجة رسائل**
`,
    bottle29: `💡 أكمل المهام لكسب زجاجات إضافية`,
    bottle3: `• زجاجات الرسائل: \${bottlesCount?.count || 0}
`,
    bottle30: `لا يمكن أن يحتوي محتوى الزجاجة على أي روابط`,
    bottle31: `🍾 أرسل زجاجة رسائل

`,
    bottle32: `لا يمكن أن تكون محتوى الزجاجة فارغاً`,
    bottle33: `أرسل زجاجتك الأولى`,
    bottle34: `التقط زجاجتك الأولى`,
    bottle4: `منصة صداقة زجاجات رسائل مجهولة تساعدك في العثور على أصدقاء متشابهين في التفكير من خلال MBTI وعلامات الأبراج

`,
    bottle5: `⏰ انتهت المحادثة

قد يكون الطرف الآخر قد غادر. استخدم /catch لالتقاط زجاجة جديدة!`,
    bottle6: `💡 استخدم /catch لالتقاط زجاجة رسائل جديدة لبدء محادثة جديدة.`,
    bottle7: `🍾 أرسل زجاجة رسائل

ما نوع شريك المحادثة الذي تبحث عنه؟`,
    bottle8: `اذهب وأرسل زجاجة وتعرف على أصدقاء جدد! /throw

`,
    bottle9: `تحقق من زجاجات الرسائل الأخرى، وإذا كنت مهتمًا، رد للبدء في الدردشة

`,
    broadcast: `سيتم إرسال البث في الخلفية. استخدم /broadcast_status \${broadcastId} للتحقق من التقدم.`,
    broadcast10: `📊 السجلات الخمسة الأخيرة للبث

`,
    broadcast11: `تم بث إشعار الصيانة لجميع المستخدمين.
`,
    broadcast12: `تم بث إشعار الاستعادة لجميع المستخدمين.`,
    broadcast13: `📊 حالياً لا توجد سجلات بث`,
    broadcast14: `📊 حالة البث

`,
    broadcast15: `جميع حالات البث طبيعية.`,
    broadcast2: `تتطلب البثوص الضخمة ترقية في بنية النظام، يرجى مراجعة BROADCAST_SYSTEM_REDESIGN.md`,
    broadcast3: `استخدم /broadcast_status لعرض جميع سجلات البث.`,
    broadcast4: `\${statusEmoji} تم تفعيل معالجة قائمة انتظار البث

`,
    broadcast5: `/broadcast_cancel 

`,
    broadcast6: `معرف البث: \${ids.join(', ')}

`,
    broadcast7: `جارٍ معالجة البث #\${broadcast.id}
`,
    broadcast8: `حالياً، لا توجد بثوص معلقة أو عالقة.

`,
    broadcast9: `معرف البث: \${ids.join(', ')} يرجى إزالة هذه الروابط وإعادة الإدخال أو إلغاء التحرير:`,
    cancel: `الحالة: ملغاة

`,
    cancel2: `يرجى إعادة الإدخال أو إلغاء التحرير:`,
    cancel3: `⏰ عملية زجاجة الرسائل قد انتهت مهلةها

يرجى استخدام /catch لإعادة التشغيل.`,
    cancelled: `ملغى`,
    catch: `لقد التقطت ردًا على زجاجة رسالة → الطرف الآخر رد → ابدأ دردشة مجهولة`,
    catch2: `• المحتوى الودي والاحترامي أكثر احتمالاً لأن يتم التقاطه!`,
    catch3: `عملية زجاجة الرسائل`,
    catch4: `🎉 **اكتمل عرض الإعلانات!**

✅ مكتسب **+1 حصة**
📊 عدد مرات المشاهدة اليوم: **\${updated.ads_watched}/20** مرة
🎁 ما تم كسبه اليوم: **\${updated.quota_earned}** حصص
📈 عدد مرات المتبقية: **\${result.remaining_ads}** مرة

\${result.remaining_ads > 0 ? '💡 تابع مشاهدة الإعلانات لكسب المزيد من الحصص!' : '✅ تم الوصول إلى حد الإعلان اليومي'}`,
    close: `❌ إغلاق`,
    complete: `📺 **اكسب حصصًا من خلال مشاهدة الإعلانات**

🎁 إكمال المشاهدة يكسب **+1 حصة**
📊 المتبقي اليوم: **\${remainingAds}/20** مرة

👇 اضغط على الزر أدناه لبدء المشاهدة {updated.ads_watched} {updated.quota_earned} {result.remaining_ads} {result.remaining_ads > 0 ? '💡 繼續觀看廣告可獲得更多額度！' : '✅ 今日廣告已達上限'} \${updated.ads_watched} \${updated.quota_earned} \${result.remaining_ads} \${result.remaining_ads > 0 ? '💡 繼續觀看廣告可獲得更多額度！' : '✅ 今日廣告已達上限'}`,
    complete2: `وقت الانتهاء: \${new Date(broadcast.completedAt).toLocaleString('zh-TW')}
 {remainingAds} \${remainingAds}`,
    complete3: `{new Date(broadcast.completedAt).toLocaleString('zh-TW')} \${new Date(broadcast.completedAt).toLocaleString('zh-TW')}`,
    complete4: `التاريخ المتوقع للإكمال: \${new Date(maintenance.endTime).toLocaleString('zh-TW')}
`,
    complete5: `🎉 \${testTitle} مكتمل!

`,
    complete6: `مكتمل قبل الموعد النهائي مباشرةً`,
    complete7: `على وشك الإكمال`,
    complete8: `يرجى الإكمال في أسرع وقت ممكن`,
    confirm: `لحماية سلامة جميع المستخدمين، يُرجى تأكيد أنك تفهم ما يلي: 

`,
    confirm2: `🌍 **تأكيد دولتك/منطقتك**

`,
    confirm3: `🛡️ الخطوة الأخيرة: تأكيد أمان مكافحة الاحتيال

`,
    confirm4: `🔍 **تأكيد فلتر البث**

`,
    confirm5: `🌍 أكد دولتك/منطقتك`,
    confirm6: `**هل تConfirm التنظيف؟**
`,
    confirm7: `يرجى التأكيد:`,
    conversation: `📨 \${formatIdentifier(conv.identifier)} محادثة (\${conv.message_count} رسائل)
`,
    conversation10: `💡 **لا توجد سجلات محادثة**

`,
    conversation11: `قد لا تكون بعض سجلات المحادثة قد تم تحديثها، يُرجى المحاولة لاحقاً.`,
    conversation12: `
📨 **المحادثات الأخيرة:**

`,
    conversation13: `💬 ليس لديك سجلات محادثة حتى الآن

`,
    conversation14: `💬 متابعة المحادثة: /reply
`,
    conversation15: `ليس لديك سجلات محادثة حتى الآن.

`,
    conversation16: `قد تكون المحادثة قد انتهت أو لا توجد.`,
    conversation17: `💬 متابعة المحادثة`,
    conversation18: `ابدأ المحادثة الأولى`,
    conversation2: `💬 **محادثة مع \${formatIdentifier(identifier)}**

`,
    conversation3: `• بدأت المحادثة: \${formatDate(stats.first_message_time)}
`,
    conversation4: `• المحادثات: \${conversationsCount?.count || 0}
`,
    conversation5: `💬 الرد على المحادثة \${conversationIdentifier}`,
    conversation6: `لقد تم تحديث ذاكرة الصورة الرمزية الخاصة بك. ستظهر الصورة الرمزية الأحدث في المرة التالية التي تعرض فيها سجل المحادثات.

`,
    conversation7: `💡 لحماية الخصوصية والأمان، يُسمح فقط برسائل النص العادي في المحادثات.

`,
    conversation8: `استخدم /history لعرض جميع المحادثات

`,
    conversation9: `🔄 جاري تحديث سجل المحادثات بالكامل...

`,
    country: `رمز الدولة غير صالح: \${trimmedValue} (يجب أن يتكون من حرفين كبيرين، على سبيل المثال، TW، US، JP)`,
    country2: `🌍 **يرجى اختيار بلدك/منطقتك**

`,
    country3: `البلد: \${filters.country}`,
    end: `ينتهي: \${endTime.toLocaleString('zh-TW')}

`,
    end2: `ينتهي: \${endTime.toLocaleString}
 {updatedUser.gender === 'male' ? '男' : '女'} \${updatedUser.gender}`,
    gender2: `قيمة الجنس غير صالحة: \${trimmedValue} (يجب أن تكون ذكر، أنثى، أو أخرى)`,
    gender3: `👤 الجنس: \${user.gender}
 {user.gender === 'male' ? '男' : '女'} \${user.gender}`,
    gender4: `👤 الجنس: \${updatedUser.gender ===`,
    gender5: `👤 الجنس: \${user.gender ===`,
    gender6: `يرجى تحديد جنسك الآن:

`,
    gender7: `جنسيات أخرى`,
    help: `يمكن أن تساعدنا اختبار شخصية MBTI في العثور على شركاء دردشة أكثر ملاءمة لك～

`,
    help2: `❓ عرض المساعدة - /help`,
    help3: `• /help - عرض المساعدة`,
    invite: `• إجمالي عدد الدعوات: \${inviteStats?.total || 0}
`,
    invite2: `رمز الدعوة: \${user.invite_code}
 {user.invite_code || '未生成'} \${user.invite_code}`,
    invite3: `تمت الدعوة بواسطة: \${user.invited_by}

 {user.invited_by || '無'} \${user.invited_by}`,
    loading: `✅ جاري التحميل......`,
    login: `المستخدمون العاديون لن يتمكنوا من الوصول إلى الخدمة، فقط الإدارة يمكنها تسجيل الدخول.`,
    male: `ذكر`,
    mbti: `نوع MBTI غير صالح: \${trimmedValue} (يجب أن يكون واحداً من: \${VALID_MBTI.join(', ')})`,
    mbti10: `✍️ أدخل MBTI يدوياً`,
    mbti11: `🧠 قائمة MBTI`,
    mbti12: `اختبار MBTI كامل`,
    mbti13: `اختبار MBTI سريع`,
    mbti2: `نوع MBTI لديك هو: **\${result.type}**

`,
    mbti3: `MBTI الحالي: **\${user.mbti_result}**
`,
    mbti4: `🧠 **حدد نسخة اختبار MBTI**

`,
    mbti5: `🧠 **إدارة أنواع شخصية MBTI**

`,
    mbti6: `⚙️ فلترة متقدمة (MBTI/برج)`,
    mbti7: `• تعديل نوع MBTI الخاص بك يدويًا`,
    mbti8: `يرجى اختيار نوع MBTI الخاص بك:`,
    mbti9: `🧠 إعادة اختبار MBTI`,
    message: `\${typeEmoji} **\${ad.title}**
\${statusEmoji} الحالة: \${ad.is_enabled ? 'ممكّن' : 'معطل'}

📊 **الإحصائيات**
• المشاهدات: \${stats.total_views}
• النقرات: \${stats.total_clicks}
• معدل النقر (CTR): \${stats.ctr}% {ad.is_enabled ? '啟用' : '停用'} \${ad.is_enabled ? '啟用' : '停用'}`,
    message10: `/broadcast_filter gender=female,age=18-25,country=TW مرحبًا للجميع!
`,
    message11: `\${banHours} \${user.language_pref} {user.language_pref === 'en' ? 'hours' : '小時'} \${user.language_pref}`,
    message12: `الوقت: \${new Date(b.created_at).toLocaleString('zh-TW')}

`,
    message13: `
يوجد \${pendingBroadcasts.results.length - 1} بث قيد الانتظار في القائمة
`,
    message14: `التقدم: \${broadcast.sent_count}/\${broadcast.total_users}
`,
    message15: `\${days} \${user.language_pref} {user.language_pref === 'en' ? 'days' : '天'} \${user.language_pref}`,
    message16: `الهدف: \${getBroadcastTargetName(broadcast.targetType)}
`,
    message17: `الحالة: \${maintenance.isActive ? '✅ تحت الصيانة' : '❌ غير مفعل'}
 {maintenance.isActive ? '✅ 維護中' : '❌ 未啟用'} \${maintenance.isActive ? '✅ 維護中' : '❌ 未啟用'}`,
    message18: `🚫 الروابط المحجوبة: 
\${urlCheck.blockedUrls?.map((url) =>`,
    message19: `• آخر رسالة: \${formatDate(stats.last_message_time)}
`,
    message2: `birthday = '2000-01-01',
 age = 25,
 zodiac_sign = 'Capricorn',
 anti_fraud_score = 100,
 terms_agreed = 1`,
    message20: `الوقت: \${formatDate(conv.last_message_time)}

`,
    message21: `المدة التقديرية: \${maintenance.estimatedDuration} دقيقة
`,
    message22: `استخدم /broadcast_status \${broadcastId} للتحقق من التقدم.`,
    message23: `💡 يرجى الضغط مطولاً على الرسالة التي ترغب في الرد عليها، اختر 'رد' من القائمة التي تظهر، ثم أدخل ردك في صندوق الدردشة.`,
    message24: `📊 الرسائل المرسلة اليوم: \${usedToday + 1}/\${dailyLimit}`,
    message25: `/broadcast_filter zodiac=Scorpio رسائل حصرية لبرج العقرب`,
    message26: `• مفعل: \${inviteStats?.activated || 0}
`,
    message27: `• قيد الانتظار: \${inviteStats?.pending || 0}

`,
    message28: `/maintenance_enable [رسالة الصيانة]

`,
    message29: `التقدم: \${b.sent_count}/\${b.total_users}
`,
    message3: `التقدم: \${broadcast.sentCount}/\${broadcast.totalUsers} (\${progress.percentage}%)
`,
    message30: `• الرسائل: \${messagesCount?.count || 0}

`,
    message31: `• الرسائل المرسلة من الشريك: \${stats.partner_messages} رسائل
`,
    message32: `القائد - قائد جريء وخيالي وإرادي يبتكر دائمًا أو يجد حلولًا.`,
    message33: `💡 استخدم /broadcast_status لعرض التفاصيل`,
    message34: `🏷️ علامات الاهتمام: \${updatedUser.interests ||`,
    message35: `الحاكم - شخص متعاطف للغاية وشعبي ومساعد يسعى دائمًا للمساهمة في المجتمع.`,
    message36: `/broadcast_filter 

`,
    message37: `**محتوى الرسالة:**
\${broadcastMessage}

`,
    message38: `• إجمالي الرسائل: \${stats.total_messages} رسائل
`,
    message39: `المروج - روح حماسية ومبدعة واجتماعية تجد دائمًا سببًا للابتسامة.`,
    message4: `💡 استخدم /history \${formatIdentifier(conversations[0].identifier)} لعرض المحادثة الكاملة

`,
    message40: `الوقت المتبقي: \${remaining.remainingText}
`,
    message41: `المنفذ - فنان عفوي وذو طاقة وشغف لا يجد الحياة مملة.`,
    message42: `إجمالي المستخدمين: \${broadcast.total_users} شخص
`,
    message43: `• لقد أرسلت: \${stats.user_messages} رسائل
`,
    message44: `وسيط - شخص شاعر ولطيف يعمل بلا كلل للدفاع عن العدالة.`,
    message45: `
يرجى استخدام /broadcast_status للتحقق من التقدم لاحقًا.`,
    message46: `اللقب: \${user.nickname}
 {user.nickname || '未設置'} \${user.nickname}`,
    message47: `• المكافآت: \${stats.total_rewards}

`,
    message48: `رائد أعمال - شخص ذكي ونشيط وذو بصيرة يستمتع حقًا بالعيش على الحافة.`,
    message49: `🎁 المكافأة: +\${ad.reward_quota} حصص دائمة`,
    message5: `الوقت: \${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
`,
    message50: `الوقت: \${new Date().toLocaleString(`,
    message51: `استخدم /broadcast_status للتحقق من الحالة المحدثة.`,
    message52: `الهدف: \${broadcast.target_type}
`,
    message53: `استخدم /broadcast_status للتحقق من السجلات المحدثة.`,
    message54: `• إذا قمت بتغيير صورة ملفك الشخصي على تيليجرام، سيكتشف النظام ذلك تلقائيًا
`,
    message55: `حوالي \${Math.ceil(totalSeconds)} ثواني`,
    message56: `مفعل بواسطة: \${maintenance.enabledBy}
`,
    message57: `منطقي - مخترع مبتكر لديه شغف لا يشبع بالمعرفة.`,
    message58: `مدافع - هادئ وغامض، لكنه ملهم ومثالي بلا كلل.`,
    message59: `حارس - حامي مركز ودافئ للغاية، دائمًا جاهز لحماية الأحباء.`,
    message6: `• العرض: \${stats.total_views} | النقرات: \${stats.total_clicks} (\${stats.ctr}%)
`,
    message60: `المستكشف - فنان مرن وجذاب، دائمًا مستعد لاستكشاف وتجربة أشياء جديدة.`,
    message61: `• اضغط مطولاً على رسالة الطرف الآخر للرد / الحظر لحظر هذا المستخدم
`,
    message62: `يرجى التأكد من أنك ترد على الرسالة المرسلة من الطرف الآخر (المحددة برمز #).`,
    message63: `/broadcast_non_vip`,
    message64: `أنشئ اتصالك الأول (اضغط مطولاً على الرسالة → اختر 'رد')`,
    message65: `الرسالة: \${messagePreview}
`,
    message66: `3. هل تصبح alert عند مواجهة رسائل مشبوهة؟

`,
    message67: `💡 يمكن لمستخدمي VIP إرسال 100 رسالة يوميًا.`,
    message68: `/broadcast 

`,
    message69: `/broadcast_vip`,
    message7: `
• محاولات التحقق: \${stats.total_verified}
• معدل التحقق: \${stats.verification_rate}%`,
    message70: `آخر رسالة: \${preview}
`,
    message71: `لا يمكن أن تتجاوز رسائل البث 4000 حرف`,
    message72: `1️⃣ اضغط مطولاً على رسالة الطرف الآخر
`,
    message73: `يرجى استخدام الرسائل النصية للتواصل مع الطرف الآخر.`,
    message74: `(لا توجد رسائل حتى الآن)

`,
    message75: `احصل على آخر الأخبار والفعاليات`,
    message76: `لا يمكن أن تكون رسائل البث فارغة`,
    message77: `(لا توجد رسالة)`,
    message8: `
• المكافآت الموزعة: \${stats.total_rewards}
• معدل المكافأة: \${stats.reward_rate}%`,
    message9: `
• العرض المتبقي: \${ad.max_views - ad.current_views}/\${ad.max_views}`,
    newUser: `مستخدم جديد`,
    nickname: `💡 يرجى إدخال اسم مستعار بسيط، بدون روابط مثل http:// أو https://.

`,
    nickname10: `يرجى إدخال اسم مستعار جديد: 

`,
    nickname11: `• لا تستخدم اسمك المستعار لإرسال الإعلانات`,
    nickname12: `📝 تعديل الاسم المستعار`,
    nickname13: `✍️ تخصيص الاسم المستعار`,
    nickname2: `رائع! اسمك المستعار هو: \${truncatedNickname}

`,
    nickname3: `📝 الاسم المستعار: \${updatedUser.nickname}
`,
    nickname4: `📝 الاسم المستعار: \${user.nickname}
`,
    nickname5: `• حد طول الاسم المستعار هو 36 حرفًا
`,
    nickname6: `📝 **تعديل الاسم المستعار**

`,
    nickname7: `✏️ يرجى اختيار اسمك المستعار: 

`,
    nickname8: `✏️ يرجى إدخال اسمك المستعار: 

`,
    nickname9: `يرجى إخباري باسمك المستعار (اسم العرض):`,
    no: `لا`,
    none: `لا شيء`,
    notRegistered: `غير مسجل`,
    notSet: `غير محدد`,
    operationFailed: `❌ حدث خطأ`,
    profile: `👤 عرض الملف الشخصي - /profile
`,
    profile2: `✏️ **تعديل الملف الشخصي**

`,
    profile3: `(يمكنك أيضًا تحديده لاحقًا في الملف الشخصي)`,
    quota: `💡 ترقية إلى VIP للحصول على المزيد من الحصص (100 رسالة/يوم): /vip`,
    quota2: `• 💎 ترقية VIP (30 حصة يوميًا)`,
    quota3: `• 🎁 دعوة الأصدقاء (+1 حصة لكل شخص)
`,
    quota4: `• ✨ إكمال المهام (كسب حصص دائمة)
`,
    register: `

💡 هذا اختبار سريع (\${testInfo})، النتائج للاستخدام كمرجع فقط.
بعد إكمال التسجيل، يمكنك إعادة إجراء الاختبار باستخدام /mbti.

`,
    register10: `🎉 تهانينا على إكمال تسجيلك!

`,
    register2: `

💡 هذا اختبار كامل (\${testInfo})، النتائج أكثر دقة.
بعد إكمال التسجيل، يمكنك إعادة إجراء الاختبار باستخدام /mbti.

`,
    register3: `خطوات التسجيل: \${user.onboarding_step}
`,
    register4: `⏰ عملية التسجيل انتهت مهلة

يرجى استخدام /start لإعادة بدء التسجيل.`,
    register5: `أو استخدم: /dev_restart (يبدأ التسجيل تلقائيًا)

`,
    register6: `💡 يمكنك الآن إعادة بدء عملية تسجيل الاختبار.

`,
    register7: `🔄 إعادة التسجيل: /start
`,
    register8: `💡 بعد إكمال التسجيل، يمكنك: 
`,
    register9: `عملية التسجيل اكتملت تلقائيًا.

`,
    report: `🚨 **الإبلاغ عن محتوى غير مناسب** (#\${conversationIdentifier})

`,
    report2: `تقارير متعددة`,
    report3: `💡 هذا يتيح لك تحديد الهدف بدقة للإبلاغ.`,
    report4: `يرجى اختيار سبب الإبلاغ:`,
    selected: `محدد`,
    settings: `🧠 MBTI: \${updatedUser.mbti_result} (يمكن إعادة الاختبار)`,
    settings10: `لم تقم بتحديد نوع الـ MBTI الخاص بك.

`,
    settings11: `قم بتعيين المنطقة`,
    settings12: `لم يتم تعيينها`,
    settings13: `لم يتم تعيينها`,
    settings14: `لم يتم تعيينها`,
    settings15: `لم يتم تعيينها`,
    settings16: `لم يتم تعيينها`,
    settings17: `لم يتم تعيينها`,
    settings18: `لم يتم تعيينها`,
    settings19: `لم يتم تعيينها`,
    settings2: `🏷️ علامات الاهتمام:\${updatedUser.interests}
 {updatedUser.interests || '未設定'} \${updatedUser.interests}`,
    settings20: `لم يتم تعيينها`,
    settings21: `لم يتم تعيينها`,
    settings22: `لم يتم تعيينها`,
    settings23: `لم يتم تعيينها`,
    settings24: `لم يتم تعيينها`,
    settings25: `لم يتم تعيينها`,
    settings26: `لم يتم تعيينها`,
    settings27: `لم يتم تعيينها`,
    settings28: `لم يتم تعيينها`,
    settings29: `لم يتم تعيينها`,
    settings3: `🧠 MBTI: \${user.mbti_result} (إعادة اختبار متاحة) {user.mbti_result || '未設定'} \${user.mbti_result}`,
    settings30: `لم يتم تعيينه`,
    settings31: `لم يتم تعيينه`,
    settings32: `لم يتم تعيينه`,
    settings33: `لم يتم تعيينه`,
    settings34: `لم يتم تعيينه`,
    settings35: `لم يتم تعيينه`,
    settings4: `🏷️ علامات الاهتمام: \${user.interests}
 {user.interests || '未設定'} \${user.interests}`,
    settings5: `📖 السيرة الذاتية الشخصية: \${updatedUser.bio}
`,
    settings6: `🌍 المنطقة: \${updatedUser.city}
 {updatedUser.city || '未設定'} \${updatedUser.city}`,
    settings7: `📖 السيرة الذاتية الشخصية: \${user.bio}
`,
    settings8: `🌍 المنطقة: \${user.city}
 {user.city || '未設定'} \${user.city}`,
    settings9: `يمكنك استخدام أمر /mbti لإعادة التعيين في أي وقت.`,
    short: `💡 يمكنك: 
`,
    short10: `عندما تعمل، تفضل:`,
    short100: `المشاعر والقصص`,
    short101: `الفاعلية والنتائج`,
    short102: `الإجماع والوحدة`,
    short103: `الحرية والمرونة`,
    short104: `الحفاظ على الخيارات`,
    short105: `إضافة خط`,
    short106: `اختبارات النتائج`,
    short107: `استمع أولاً، تحدث لاحقاً`,
    short108: `صغير وحميم`,
    short109: `العمل الجماعي`,
    short11: `عند القراءة، تفضل:`,
    short110: `العمل المستقل`,
    short111: `التفكير أثناء الكلام`,
    short112: `المعالجة بمفردك`,
    short113: `التطبيق العملي`,
    short114: `أفكار مبتكرة`,
    short115: `محاولات جديدة`,
    short116: `هل هو منطقي؟`,
    short117: `هل هو مفيد؟`,
    short118: `التزام بالمبادئ`,
    short119: `الحفاظ على العلاقات`,
    short12: `في العمل، تعتبر:`,
    short120: `عادل وحاسم`,
    short121: `مفكر ورؤوف`,
    short122: `مرتب ومنظم`,
    short123: `بلا هم`,
    short124: `قرار سريع`,
    short125: `شعور بعدم الارتياح`,
    short126: `شعور بالحماس`,
    short127: `زيارة الرابط`,
    short128: `الاشتراك في القناة`,
    short129: `حساب مصرفي`,
    short13: `عند التخطيط للمستقبل، ستقوم بـ:`,
    short130: `ملاحظات:`,
    short131: `إرسال`,
    short132: `بطاقة ائتمان`,
    short133: `بيتكوين`,
    short134: `إضافة ويتشات`,
    short135: `إضافة كيو كيو`,
    short136: `رقم الهاتف المحمول`,
    short137: `اتصل بي`,
    short138: `علاقة ليلة واحدة`,
    short139: `خدمات جنسية`,
    short14: `تحليل المشكلات وتقديم الاقتراحات`,
    short140: `خديعة للحصول على المال`,
    short141: `استثمار`,
    short142: `كسب المال`,
    short143: `تحويل الأموال`,
    short144: `نقل`,
    short145: `كلمة المرور`,
    short146: `مخطط هرم`,
    short147: `مالية`,
    short148: `إدارة الثروات`,
    short149: `أسهم`,
    short15: `عندما تواجه تغييرًا، عادةً:`,
    short150: `عقود الآجلة`,
    short151: `فوركس`,
    short152: `هاتف`,
    short153: `مواعدة`,
    short154: `مواعدة مدفوعة`,
    short155: `انتحار`,
    short156: `القفز من مبنى`,
    short157: `عنف`,
    short158: `غير محدد`,
    short159: `غير مُولد`,
    short16: `شكراً لدعمك! ❤️`,
    short160: `مستخدم تجريبي`,
    short161: `مستخدم تجريبي`,
    short162: `نتائج أكثر دقة`,
    short163: `يحتاج إلى انتباه`,
    short164: `انضم إلى المجموعة`,
    short165: `عرض التفاصيل`,
    short17: `ساعد المستخدمين الآخرين على فهمك بشكل أفضل`,
    short18: `هل هذا صحيح؟

`,
    short19: `🗑️ حذف المسودة`,
    short2: `🌈 يمكن لأي شخص`,
    short20: `🏷️ تعديل الاهتمامات`,
    short21: `يرجى اختيار نسخة الاختبار:`,
    short22: `نمط عملك هو:`,
    short23: `له موعد نهائي واضح`,
    short24: `سيتعرف بسرعة`,
    short25: `يحتاج إلى وقت للتعويد`,
    short26: `عندما تكون تحت الضغط، ستقوم بـ:`,
    short27: `عمل قائمة والشراء كما هو مخطط`,
    short28: `عالق (يعيد المحاولة)`,
    short29: `✏️ تعديل المحتوى`,
    short3: `✏️ متابعة تحرير المعلومات`,
    short30: `📖 تعديل الملف الشخصي`,
    short31: `🌍 تعديل الموقع`,
    short32: `💝 تفضيلات المطابقة`,
    short33: `تحديث...`,
    short34: `🔞 محتوى للبالغين`,
    short35: `ابدأ محادثة مع الآخرين`,
    short36: `انتظر ليصل إلي الآخرون`,
    short37: `ماذا تفضل في عطلات نهاية الأسبوع:`,
    short38: `تجربة عملية وحقائق`,
    short39: `نهج خطوة بخطوة`,
    short4: `📝 إعادة اختبار`,
    short40: `استكشاف طرق مبتكرة`,
    short41: `المنطق والتحليل الموضوعي`,
    short42: `التناغم العاطفي والاجتماعي`,
    short43: `التخطيط والتحضير مسبقًا`,
    short44: `التكيف والمرونة`,
    short45: `فتح الخيارات`,
    short46: `استخدام الاستعارات والتشبيهات`,
    short47: `استمع وقدم الراحة`,
    short48: `غرفتك عادةً:`,
    short49: `عند التسوق، ستقوم بـ:`,
    short5: `📝 قم بإجراء اختبار سريع`,
    short50: `ساعد الآخرين على فهمك بشكل أفضل`,
    short51: `ابحث عن أصدقاء في نفس المدينة`,
    short52: `شاهد قصص الآخرين`,
    short53: `على الأقل 20 حرفًا`,
    short54: `: المطابقة النشطة،`,
    short55: `أنثى (افتراضي)`,
    short56: `ذكر (افتراضي)`,
    short57: `النتائج للاستخدام المرجعي فقط`,
    short58: `يمكنك:
`,
    short59: `قضاء الوقت مع الأصدقاء`,
    short6: `مطلوب فلتر واحد على الأقل`,
    short60: `استرح بمفردك في المنزل`,
    short61: `اشعر بالطاقة`,
    short62: `اشعر بالحاجة إلى الراحة`,
    short63: `الحدس والاحتمالات`,
    short64: `ركز على تفاصيل محددة`,
    short65: `ركز على الفكرة العامة`,
    short66: `أشر مباشرة إلى المشكلة`,
    short67: `اعتبر مشاعر الشخص الآخر`,
    short68: `أنشئ خطة مفصلة`,
    short69: `استمتع بالتجوال بحرية`,
    short7: `المستخدمون الجدد******`,
    short70: `عبر عن آرائك بنشاط`,
    short71: `دائرتك من الأصدقاء:`,
    short72: `واسعة ولكن ليست عميقة`,
    short73: `المستقبل والاحتمالات`,
    short74: `استخدم أمثلة محددة`,
    short75: `طرق موثوقة`,
    short76: `استنادًا إلى الظروف الحقيقية`,
    short77: `تخيل إمكانيات متنوعة`,
    short78: `نظام وهيكل`,
    short79: `ضمن مفردات حساسة`,
    short8: `عند نقد الآخرين، كنت:`,
    short80: `املأ علامات الاهتمام`,
    short81: `أكمل تقديمك الذاتي`,
    short82: `انضم إلى القناة الرسمية`,
    short83: `شارك قصتك`,
    short84: `👨 ذكر`,
    short85: `👩 أنثى`,
    short86: `👨 رجل`,
    short87: `👩 امرأة`,
    short88: `مدة المراجعة:`,
    short89: `❓ غير متأكد`,
    short9: `عند السفر، تميل إلى:`,
    short90: `ما الأهم بالنسبة لك:`,
    short91: `العدالة والإنصاف`,
    short92: `التعاطف والتفهم`,
    short93: `فكر قبل أن تتحدث`,
    short94: `الدردشة مع الأصدقاء`,
    short95: `أدلة عملية`,
    short96: `نظريات ومفاهيم`,
    short97: `الحاضر والماضي`,
    short98: `مَن تثق به أكثر:`,
    short99: `الحقائق والبيانات`,
    start: `وقت البدء: \${new Date(maintenance.startTime).toLocaleString('zh-TW')}
`,
    start10: `ابدأ →`,
    start2: `وقت البدء: \${new Date(broadcast.startedAt).toLocaleString('en-US')}
 {new Date(broadcast.startedAt).toLocaleString('zh-TW')} \${new Date(broadcast.startedAt).toLocaleString('zh-TW')}`,
    start3: `بدء: \${startTime.toLocaleString('en-US')}
 {startTime.toLocaleString('zh-TW')} \${startTime.toLocaleString('zh-TW')}`,
    start4: `وقت البدء: \${broadcast.started_at}

`,
    start5: `بدء: \${startTime.toLocaleString('en-US')}
🎉 **جاهز! لنكوين أصدقاء!**

`,
    start6: `• استخدم /throw لإعادة التشغيل
`,
    start7: `📺 ابدأ مشاهدة الإعلانات`,
    start8: `ابدأ رحلتك في الصداقة`,
    start9: `💡 استخدم /ad_stats {id} لعرض الإحصائيات التفصيلية`,
    stats: `• /stats - عرض الإحصائيات

 {id}`,
    stats2: `📊 عرض الإحصائيات - /stats
`,
    stats3: `📊 **إحصائيات الإعلانات الرسمية**

`,
    stats4: `إحصائيات الدعوات:
`,
    stats5: `الإحصائيات:
`,
    stats6: `تم الشراء بنجاح`,
    success: `❌ حدث خطأ في النظام`,
    systemError: `🎉 تهانينا على إكمال المهمة: انضم إلى القناة الرسمية!

`,
    task: `[📋 عرض مركز المهام] → /tasks`,
    task2: `• /tasks - عرض مركز المهام
`,
    task3: `💡 استخدم /tasks لرؤية المزيد من المهام`,
    task4: `💡 使用 /tasks 查看更多任務`,
    task5: `أثناء معالجة المهام، ستقوم بـ:`,
    task6: `📋 عرض المهام`,
    text: `الهدف: \${broadcast.target_type}
`,
    text10: `📖 الملف الشخصي: \${updatedUser.bio ||`,
    text100: `💡 يرجى إدخال المحتوى في مربع الإدخال أدناه`,
    text101: `قد يستغرق هذا بعض الوقت، يرجى الانتظار.`,
    text102: `يمكنك استخدام الأوامر التالية في أي وقت: 
`,
    text103: `🛠️ إشعار صيانة النظام

`,
    text104: `🛠️ حالة وضع الصيانة

`,
    text105: `عند تقييم فكرة، يجب أن تفكر أولاً في:`,
    text106: `⏱️ حوالي 2-3 دقائق
`,
    text107: `⏱️ حوالي 5-8 دقائق
`,
    text108: `📚 أرغب في معرفة المزيد عن معرفة السلامة`,
    text109: `أرسل الآن (حوالي 1-2 ثانية)`,
    text11: `\${Math.floor(hours / 24)} يومًا مضت`,
    text110: `2️⃣ اختر 'رد' 
`,
    text111: `**صيغة الفلتر:**
`,
    text112: `• الحد الأدنى 5 أحرف
`,
    text113: `• لا يمكن أن تحتوي على روابط
`,
    text114: `يرجى إدخال منطقتك: 

`,
    text115: `• يمكنك تعديل هذا الإعداد في أي وقت`,
    text116: `• حتى 5 علامات
`,
    text117: `📋 النسخة السريعة (12 سؤال)`,
    text118: `📚 النسخة الكاملة (36 سؤال)`,
    text119: `• خذ اختبارًا أكثر تفصيلاً
`,
    text12: `المدير العام - قائد استثنائي، لا يوجد له نظير في إدارة الشؤون أو الأفراد.`,
    text120: `💡 **نصيحة:**
`,
    text121: `عند تعلم أشياء جديدة، تفضل:`,
    text122: `**الخطوات:**
`,
    text123: `🇺🇳 استخدم علم الأمم المتحدة`,
    text124: `هل تريد إرسال هذا المسودة مباشرة؟`,
    text125: `قد يستغرق هذا بضع ثوانٍ.`,
    text126: `
شكرًا على صبرك!`,
    text127: `مدة الصيانة الدنيا 5 دقائق`,
    text128: `في المواقف الاجتماعية، عادةً ما:`,
    text129: `عند حل المشكلات، تعتمد أكثر على:`,
    text13: `💡 سيتم عرض هذا على بطاقة ملفك الشخصي لمساعدة المستخدمين الآخرين على فهمك بشكل أفضل.
`,
    text130: `في فريق، تميل إلى:`,
    text131: `عند التفكير في المشكلات، تميل إلى:`,
    text132: `عند وصف الأشياء، تميل إلى:`,
    text133: `عندما يثق بك صديق، أنت:`,
    text134: `في اتخاذ قرارات الفريق، تركز أكثر على:`,
    text135: `يجب أن يكون القائد الجيد:`,
    text136: `الهدف: جميع المستخدمين
`,
    text137: `✏️ يرجى إدخال محتوى جديد`,
    text138: `💰 احتيال / تصيد`,
    text139: `😡 تحرش / إساءة`,
    text14: `اللغة: \${user.language_pref}
`,
    text140: `بعد حضور تجمع، عادةً ما:`,
    text141: `عند اتخاذ القرارات، تقدر:`,
    text142: `عند مقابلة أصدقاء جدد، أنت:`,
    text143: `في النزاعات، تميل إلى:`,
    text144: `أنت أكثر قابلية للإقناع بواسطة:`,
    text145: `أسلوب حياتك المفضل:`,
    text146: `عند اتخاذ القرارات، تميل إلى:`,
    text147: `التصفح والشراء بشكل عشوائي لما يعجبك`,
    text148: `} تنتهي.

`,
    text149: `📋 الوثائق القانونية متاحة باللغة الإنجليزية فقط.`,
    text15: `🌍 المنطقة: \${updatedUser.city ||`,
    text150: `📋 الوثائق القانونية متاحة باللغة الإنجليزية فقط.`,
    text16: `

✅ التحقق مطلوب: اضغط على زر 'التحقق' بعد الانضمام إلى المجموعة/القناة`,
    text17: `المستخدمون المستهدفون: \${userIds.length}

`,
    text18: `الوقت المقدر: \${estimatedTime}

`,
    text19: `/broadcast_cleanup confirm`,
    text2: `يرجى استخدام /broadcast_filter لرؤية التنسيق الصحيح.`,
    text20: `💝 تفضيل المطابقة: \${matchPrefText}
`,
    text21: `منازل - مفكر ذكي وفضولي لا يستطيع مقاومة التحديات الفكرية.`,
    text22: `اكتب مشاعرك أو أفكارك، وسيساعدك النظام في العثور على الشخص المناسب

`,
    text23: `أخصائي لوجستيات - شخص عملي وواقعي ذو موثوقية لا شك فيها.`,
    text24: `مقدر - مجرب جريء وعملي ماهر في استخدام أدوات متنوعة.`,
    text25: `💡 هذه مكافأة لمرة واحدة ستضاف إلى حصة اليوم بمجرد المطالبة بها.`,
    text26: `عدد المستخدمين المطابقين: \${totalUsers} شخص
`,
    text27: `• الافتراضي هو الجنس المعاكس (الذكور يبحثون عن إناث، والإناث يبحثن عن ذكور)
`,
    text28: `الحالة: \${progress.status}
`,
    text29: `\${Math.floor(hours)} ساعة مضت`,
    text3: `**شروط التصفية:**
\${filtersDesc}

`,
    text30: `حوالي \${remainingMinutes} دقيقة`,
    text31: `حوالي \${hours} ساعات \${mins} دقائق`,
    text32: `يجب ألا تتجاوز مدة الصيانة 24 ساعة (1440 دقيقة)`,
    text33: `عدد المستخدمين: \${totalUsers} شخص
`,
    text34: `الهدف: \${b.target_type}
`,
    text35: `شروط التصفية: \${filtersDesc}
`,
    text36: `• على الأقل 4 أحرف، حتى 36 حرفًا
`,
    text37: `🇺🇳 إذا لم يتم العثور عليها، يمكنك اختيار 'علم الأمم المتحدة'`,
    text38: `📖 الملف الشخصي: \${user.bio ||`,
    text39: `يرجى إدخال علامات اهتماماتك (مفصولة بفواصل):

`,
    text4: `/maintenance_enable 60 صيانة ترقية النظام`,
    text40: `• على سبيل المثال: موسيقى، أفلام، سفر، طعام
`,
    text41: `تم استئناف الخدمة بشكل طبيعي، شكرًا لصبرك!

`,
    text42: `🌍 الموقع: \${user.city ||`,
    text43: `المصدر: \${sourceText}

`,
    text44: `فلتر غير معروف: \${trimmedKey}`,
    text45: `النظام تحت الصيانة وغير متوفر مؤقتًا.

`,
    text46: `نفترض أنك من: 
`,
    text47: `• يمكن أن تحتوي كل علامة على ما يصل إلى 20 حرفًا

`,
    text48: `المدة: \${duration} دقيقة
`,
    text49: `1. هل تفهم مخاطر السلامة في المواعدة عبر الإنترنت؟
`,
    text5: `👋 مرحبًا بعودتك، \${user.nickname}!

`,
    text50: `2. هل ستحمي معلوماتك الشخصية جيدًا؟
`,
    text51: `رائع! الآن يرجى رفع صورة ملفك الشخصي: 

`,
    text52: `🌊 **ما هو XunNi؟**
`,
    text53: `🎉 لقد انضممت بنجاح إلى القناة الرسمية!

`,
    text54: `💡 هذا يحدد بدقة من يجب حظره.`,
    text55: `الحالة: \${statusText}
`,
    text56: `💡 يمكنك الآن اختبار الميزات الأساسية مباشرة: 
`,
    text57: `ما نوع شريك الدردشة الذي تبحث عنه؟

`,
    text58: `• قدم اهتماماتك، شخصيتك، أو أي شيء تود قوله
`,
    text59: `🏷️ **عدّل علامات الاهتمام**

`,
    text6: `مهندس معماري - مفكر خيالي واستراتيجي، كل شيء في الخطة.`,
    text60: `لضمان الأمان، يُسمح فقط بالروابط من المجالات التالية: 
`,
    text61: `📋 **نسخة سريعة (12 سؤال)**
`,
    text62: `📚 **نسخة كاملة (36 سؤال)**
`,
    text63: `• ستتحدث صورة الملف الشخصي تلقائيًا كل 7 أيام
`,
    text64: `3️⃣ اكتب /report

`,
    text65: `3️⃣ اكتب /block

`,
    text66: `الحالة: \${b.status}
`,
    text67: `لن تتم معالجته تلقائيًا أو إرساله مرة أخرى

`,
    text68: `📖 **عدل الملف الشخصي الشخصي**

`,
    text69: `💝 **حدد تفضيلات المطابقة**

`,
    text7: `بطل الرواية - قائد جذاب وملهم، قادر على جذب الجمهور.`,
    text70: `💬 **سجل محادثاتك**

`,
    text71: `• يمكنك أيضًا تحديث المحتوى يدويًا باستخدام هذه التعليمات في أي وقت`,
    text72: `📊 **تقرير تحليل البيانات اليومية**
`,
    text73: `تم استعادة حسابك إلى عضوية مجانية.

`,
    text74: `💡 سيتم عرض هذا على بطاقة ملفك الشخصي
`,
    text75: `🔧 وضع المطور: معلومات المستخدم

`,
    text76: `• أدخل محتوى جديد بديلاً عن المسودة مباشرة
`,
    text77: `• الروابط، الصور، ووسائط متعددة غير مسموحة
`,
    text78: `• سيتم عرض ما يصل إلى 18 حرفًا
`,
    text79: `• يمكن للطرف الآخر عرض 18 حرفًا كحد أقصى
`,
    text8: `/broadcast سيتخذ صيانة النظام الليلة في الساعة 10:00 مساءً`,
    text80: `💡 يرجى إزالة هذه الروابط وإعادة الإرسال.`,
    text81: `🔄 يجري تحديث الصورة الرمزية...

`,
    text82: `• يرى المستخدمون المجانيون صورة رمزية ضبابية
`,
    text83: `💬 **كيف تصبح أصدقاء؟**
`,
    text84: `صيغة الفلتر غير صالحة: \${pair}`,
    text85: `تم حذف جميع بياناتك.

`,
    text86: `📝 **محتوى المسودة**

`,
    text87: `🌍 **تعديل المنطقة**

`,
    text88: `• على سبيل المثال: تايبيه، هونغ كونغ، طوكيو
`,
    text89: `• حتى 50 حرف

`,
    text9: `🏷️ علامات الاهتمام: \${user.interests ||`,
    text90: `عن \${minutes} دقيقة`,
    text91: `اكتب قصتك (على الأقل 20 حرف)`,
    text92: `正在寻找匹配的用户...`,
    text93: `• حتى 250 حرف
`,
    text94: `• لا تتضمن معلومات الاتصال الشخصية
`,
    text95: `يرجى اختيار العنصر لتحريره: 

`,
    text96: `يرجى إدخال ملفك الشخصي الشخصي: 

`,
    text97: `• حتى 200 حرف
`,
    text98: `• تجنب تضمين معلومات الاتصال

`,
    text99: `جميع الميزات متاحة الآن للاستخدام.`,
    throw: `⏰ عملية زجاجة الرسائل قد انتهت مهلة

يرجى استخدام /throw لإعادة البدء.`,
    throw2: `عملية زجاجة الرسائل`,
    uncertain: `❓ غير مؤكد`,
    unknownOption: `⚠️ خيار غير معروف`,
    unlimited: `لا توجد قيود`,
    userNotFound: `❌ المستخدم غير موجود`,
    vip: `انتهت صلاحية اشتراك VIP الخاص بك في \${new Date(user.vip_expire_at).toLocaleDateString('zh-TW')} .

`,
    vip10: `😢 **انتهت صلاحية اشتراك VIP**

`,
    vip11: `• الترقية إلى VIP ستقوم تلقائياً بتحديث المشاركات التاريخية`,
    vip12: `⭐ الترقية إلى VIP - /vip
`,
    vip13: `💎 مستخدمو VIP لا يحتاجون لمشاهدة الإعلانات`,
    vip14: `الهدف: المستخدمون غير المميزون
`,
    vip15: `الهدف: المستخدمون المميزون
`,
    vip16: `المستخدمون غير المميزون`,
    vip17: `المستخدمون المميزون`,
    vip2: `ستنتهي فترة اشتراكك المميز في \${new Date(user.vip_expire_at).toLocaleDateString(`,
    vip3: `/broadcast_filter vip=true,mbti=INTJ إشعار حدث حصري للمستخدمين المميزين
`,
    vip4: `لكل شخص يتم دعوته، يزيد الحصة اليومية بشكل دائم بمقدار +1 (مجاني لما يصل إلى 10 أشخاص، للمستخدمين المميزين حتى 100 شخص)`,
    vip5: `المميز: \${user.is_vip ? 'نعم' : 'لا'}
 {user.is_vip ? '是' : '否'} \${user.is_vip ? '是' : '否'}`,
    vip6: `💡 ترقية إلى المميز للحصول على تصفية متقدمة (MBTI/برجك): /vip`,
    vip7: `💡 يمكنك إعادة الاشتراك في المميز في أي وقت: /vip

`,
    vip8: `💡 يمكن استخدام فصيلة الدم في ميزة المطابقة بفصيلة الدم للمستخدمين المميزين

`,
    vip9: `• يمكن للمستخدمين المميزين رؤية صور الملف الشخصي الواضحة للآخرين
`,
    yes: `نعم`,
    zodiac: `برج غير صالح: \${trimmedValue} (يجب أن يكون واحداً من: \${VALID_ZODIACS.join(', ')})`,
  },
  conversation: {
    age: `🎂 نطاق العمر: \${ageRange} سنة
`,
    anonymousCardHint: `💡 هذه بطاقة ملف شخصي مجهول ولن تعرض معلومات الهوية الحقيقية للشخص الآخر.`,
    backToMenuCommand: `🏠 العودة إلى القائمة الرئيسية: /menu`,
    ban: `• يمكن أن تؤدي التقارير المتعددة إلى حظر
`,
    blockConfirmButton: `✅ تأكيد الحظر`,
    blockConfirmMessage: `بعد الحظر:
• لن يتمكن الشخص الآخر من مراسلتك بعد الآن
• لن يتمmatch بينكما مرة أخرى
• ستنتهي هذه المحادثة على الفور

💡 هذا لا يعني الإبلاغ عن الشخص الآخر، بل يعني ببساطة أنك لا ترغب في الدردشة.`,
    blockConfirmTitle: `🚫 **هل أنت متأكد أنك ترغب في حظر هذا المستخدم؟**`,
    blockSuccessMessage: `تم حظر الطرف الآخر، ولن يتم المطابقة بينكما بعد الآن.

💡 هل ترغب في بدء محادثة جديدة؟
• استخدم /catch لالتقاط زجاجة رسائل جديدة.`,
    blockSuccessNewConversation: `💬 **انتهت المحادثة**

لقد أنهى الطرف الآخر هذه المحادثة.

💡 هل ترغب في بدء محادثة جديدة؟
• استخدم /catch لالتقاط زجاجة رسائل جديدة.`,
    blockSuccessTitle: `✅ **تم حظر المستخدم**`,
    blocked: `✅ محظور`,
    bloodType: `🩸 فصيلة الدم: \${partnerInfo.bloodType}
`,
    bloodType2: `🩸 فصيلة الدم: \${bloodTypeText}
`,
    bottle: `استخدم /catch لالتقاط زجاجة رسائل وبدء الدردشة!

`,
    bottle2: `• استخدم /catch لالتقاط زجاجة رسائل جديدة.`,
    cancelButton: `❌ إلغاء`,
    cancelSuccess: `تم الإلغاء`,
    conversation: `💬 سجل المحادثات مع #\${identifier} (الصفحة \${postNumber})

`,
    conversation10: `لا توجد محادثات حالياً.

`,
    conversation11: `• ستنتهي هذه المحادثة على الفور
`,
    conversation2: `💬 **قائمة محادثاتي** (\${conversations.length})

`,
    conversation3: `💡 انقر على زر 'رد' على رسالة الطرف الآخر لمتابعة المحادثة
`,
    conversation4: `💬 **انتهت المحادثة**

`,
    conversation5: `💬 **محادثاتي**

`,
    conversation6: `💡 هل ترغب في بدء محادثة جديدة؟
`,
    conversation7: `• ستنتهي هذه المحادثة على الفور

`,
    conversation8: `لقد أنهى الطرف الآخر هذه المحادثة.

`,
    conversation9: `💡 هذه هي سجل المحادثات
`,
    conversationEnded: `❌ انتهت هذه المحادثة.

استخدم /catch لالتقاط زجاجة رسالة جديدة وبدء محادثة جديدة.`,
    conversationInfoError: `[ترجمة مطلوبة من zh-TW.ts]`,
    editProfileCommand: `✏️ تحرير الملف الشخصي: /edit_profile`,
    endedMessage: `الطرف الآخر أنهى هذه المحادثة.

💡 هل ترغب في بدء محادثة جديدة؟
• استخدم /catch لالتقاط زجاجة رسائل جديدة`,
    endedNewConversation: `💬 **انتهت المحادثة**

الطرف الآخر أنهى هذه المحادثة.

💡 هل ترغب في بدء محادثة جديدة؟
• استخدم /catch لالتقاط زجاجة رسائل جديدة`,
    endedTitle: `💬 **انتهت المحادثة**`,
    gender: `👤 الجنس: \${otherUser.gender}
`,
    mediaRestriction: `⚠️ **إرسال الصور أو الفيديوهات أو الوسائط المتعددة غير مسموح به**

💡 لحماية الخصوصية والأمان، يُسمح فقط برسائل النصوص العادية في المحادثات.

يرجى استخدام رسائل النصوص للتواصل مع الآخرين.`,
    message: `💫 درجة المطابقة: \${Math.round(partnerInfo.matchScore)} نقاط
`,
    message10: `conv_profile_\${conversationId}`,
    message11: `• آخر رسالة: \${lastMessageTime}

`,
    message12: `📊 إجمالي الرسائل: \${totalMessages} رسائل
`,
    message13: `💬 رد على الرسالة مباشرةً من خلال الضغط على /reply
`,
    message14: `• الطرف الآخر لم يعد يستطيع إرسال رسائل لك
`,
    message2: `
📜 متابعة العرض: #\${identifier}-H\${newPostNumber}`,
    message3: `📅 آخر تحديث: \${formatDateTime(new Date())}

`,
    message4: `[\${timeStr}] من الطرف الآخر:
\${messageContent}

`,
    message5: `conv_report_confirm_\${conversationId}`,
    message6: `conv_block_confirm_\${conversationId}`,
    message7: `• عدد الرسائل: \${conv.message_count} رسائل
`,
    message77: `💬 استخدم /reply للرد على الرسائل`,
    message8: `🏷️ الاهتمامات: \${otherUser.interests}
`,
    message9: `💬 رسالة جديدة من #\${identifier}: 

`,
    nickname: `📝 الاسم المستعار: \${partnerInfo.maskedNickname}
`,
    nickname2: `📝 الاسم المستعار: \${displayNickname}
`,
    noHistory: `💬 ليس لديك سجل محادثات بعد

اذهب لرمي زجاجة رسائل للتعرف على أصدقاء جدد! /throw

🏠 العودة إلى القائمة الرئيسية: /menu`,
    profile: `✏️ تعديل الملف الشخصي: /edit_profile
`,
    profileCardTitle: `👤 **بطاقة ملف الشخص الآخر**`,
    replyButton: `💬 رد على الرسالة`,
    replyConversation: `💬 الرد على المحادثة {identifier}`,
    replyHint: `💡 يرجى إدخال المحتوى في الصندوق أدناه`,
    replyMethod1: `1️⃣ انقر على زر '💬 رد على الرسالة' أدناه`,
    replyMethod2: `2️⃣ اضغط مطولاً على هذه الرسالة، اختر 'رد' وأدخل محتواك`,
    replyMethodsTitle: `💡 **خيارات الرد من اثنين**:`,
    report: `🚨 **هل أنت متأكد أنك تريد الإبلاغ عن هذا المستخدم؟**

`,
    report2: `💡 هذا لن يقوم بالإبلاغ عن الشخص الآخر، فقط أنك لم تعد ترغب في الدردشة.`,
    report3: `شكرًا لبلاغك، سنقوم بمراجعته في أسرع وقت ممكن.

`,
    report4: `بعد الإبلاغ: 
`,
    reportConfirmButton: `✅ تأكيد البلاغ`,
    reportConfirmMessage: `بعد الإبلاغ: 
• سنراجع سلوك هذا المستخدم
• البلاغات المتعددة قد تؤدي إلى الحظر
• ستنتهي هذه المحادثة على الفور
• لن تتطابق مع هذا المستخدم لمدة 24 ساعة

💡 يرجى التأكد من أن الطرف الآخر لديه سلوك غير ملائم بالفعل.`,
    reportConfirmTitle: `🚨 **هل أنت متأكد أنك تريد الإبلاغ عن هذا المستخدم؟**`,
    reportSuccessMessage: `شكرًا لبلاغك، سنقوم بمراجعته في أسرع وقت ممكن.

💡 هل تريد بدء محادثة جديدة؟
• استخدم /catch لالتقاط زجاجة رسائل جديدة`,
    reportSuccessNewConversation: `💬 **انتهت المحادثة**

لقد أنهى الطرف الآخر هذه المحادثة.

💡 هل تريد بدء محادثة جديدة؟
• استخدم /catch لالتقاط زجاجة رسائل جديدة`,
    reportSuccessTitle: `✅ **تم الإبلاغ عن هذا المستخدم**`,
    reported: `✅ تم الإبلاغ`,
    separator: `━━━━━━━━━━━━━━━━`,
    settings: `🧠 MBTI: \${otherUser.mbti_result}
 {otherUser.mbti_result || '未設定'} \${otherUser.mbti_result}`,
    settings2: `غير محدد`,
    settings3: `غير محدد`,
    settings4: `غير محدد`,
    settings5: `غير محدد`,
    short: `بعد الحظر:
`,
    short2: `مستخدم غير معروف`,
    short3: `الآن فقط`,
    stats: `📊 استخدم /stats للحصول على إحصائيات تفصيلية
`,
    text: `💡 هذه بطاقة بيانات مجهولة، ولن تُظهر المعلومات الحقيقية للطرف الآخر.

`,
    text10: `💎 استخدم /vip لمعرفة المزيد

`,
    text11: `👤 **بطاقة بيانات الطرف الآخر**

`,
    text12: `\${diffHours} ساعة مضت`,
    text13: `💡 يرجى التأكد من أن الطرف الآخر لديه سلوك غير لائق.`,
    text14: `\${diffMins} دقيقة مضت`,
    text15: `• سنقوم بمراجعة سلوك هذا المستخدم
`,
    text16: `💎 استخدم /vip لمعرفة المزيد`,
    text17: `\${diffDays} يوم مضى`,
    text18: `• لن يتم المطابقة بينكما مجددًا
`,
    text19: `👤 معلومات الطرف الآخر:
`,
    text2: `📜 عرض التاريخ: #\${identifier}
`,
    text3: `🗣️ اللغة: \${languageLabel}
`,
    text4: `🌍 الموقع: \${otherUser.city}
`,
    text5: `📖 السيرة الذاتية: \${otherUser.bio}
`,
    text6: `conv_reply_\${identifier}`,
    text7: `🚫 **هل أنت متأكد أنك ترغب في حظر هذا المستخدم؟**

`,
    text8: `لقد تم حظر هذا المستخدم، ولن تتم مطابقتك به مرة أخرى.

`,
    text9: `• لن تتم مطابقتك مع هذا المستخدم لمدة 24 ساعة

`,
    vip: `
🔒 قم بالترقية إلى VIP لفتح صورة ملف تعريف أكثر وضوحًا للمستخدم الآخر
`,
    vip2: `🔒 قم بالترقية إلى VIP لفتح صورة ملف تعريف أكثر وضوحًا للمستخدم الآخر
`,
    vipLearnMore: `💎 استخدم /vip لمعرفة المزيد`,
    vipUnlockAvatar: `🔒 قم بالترقية إلى VIP لفتح صورة ملف تعريف أكثر وضوحًا للمستخدم الآخر`,
    zodiac: `⭐ برجك: \${partnerInfo.zodiac}
`,
    zodiac2: `⭐ برجك: \${zodiacLabel}
`,
  },
  conversationHistory: {
    backToMenu: `🏠 العودة إلى القائمة الرئيسية: /menu`,
    bloodType: `🩸 فصيلة الدم: \${bloodType}`,
    continueView: `📜 متابعة العرض: #\${identifier}-H\${postNumber}`,
    historyNote: `💡 هذه هي سجل المحادثات`,
    lastUpdated: `📅 آخر تحديث: \${time}`,
    matchScore: `💫 نتيجة التطابق: \${score} نقاط`,
    mbti: `🧠 MBTI: \${mbti}`,
    messageEntry: `[\${time}] الطرف الآخر:
\${content}`,
    newMessage: `💬 رسالة جديدة من #\${identifier}:`,
    nickname: `📝 اللقب: \${nickname}`,
    other: `الطرف الآخر`,
    partnerInfo: `👤 ملف تعريف الطرف الآخر:`,
    replyButton: `💬 الرد على الرسالة`,
    replyHint: `💬 اضغط /reply للرد في الدردشة`,
    title: `💬 سجل المحادثات مع #\${identifier} (الصفحة \${postNumber})`,
    totalMessages: `📊 إجمالي الرسائل: \${count}`,
    viewAllConversations: `📊 عرض جميع المحادثات`,
    viewHistory: `📜 عرض التاريخ: #\${identifier}`,
    viewProfileCard: `👤 عرض بطاقة ملف الطرف الآخر`,
    vipLearnMore: `💎 استخدم /vip لمعرفة المزيد`,
    vipUnlockAvatar: `🔒 ترقي إلى VIP لفتح صور شخصية أوضح`,
    you: `أنت`,
    zodiac: `⭐ برج zodiac: \${zodiac}`,
  },
  countries: {
    ae: `الإمارات العربية المتحدة`,
    al: `ألبانيا`,
    am: `أرمينيا`,
    ar: `الأرجنتين`,
    at: `النمسا`,
    au: `أستراليا`,
    az: `أذربيجان`,
    ba: `البوسنة`,
    bb: `باربادوس`,
    bd: `بنغلاديش`,
    be: `بلجيكا`,
    bg: `بلغاريا`,
    bh: `البحرين`,
    bo: `بوليفيا`,
    br: `البرازيل`,
    ca: `كندا`,
    ch: `سويسرا`,
    ci: `ساحل العاج`,
    cl: `شيلي`,
    cm: `الكاميرون`,
    cn: `الصين`,
    co: `كولومبيا`,
    cr: `كوستاريكا`,
    cu: `كوبا`,
    cz: `جمهورية التشيك`,
    de: `ألمانيا`,
    dk: `الدنمارك`,
    do: `جمهورية الدومينيكان`,
    dz: `الجزائر`,
    ec: `الإكوادور`,
    ee: `إستونيا`,
    eg: `مصر`,
    es: `إسبانيا`,
    et: `أثيوبيا`,
    fi: `فنلندا`,
    fr: `فرنسا`,
    gb: `المملكة المتحدة`,
    ge: `جورجيا`,
    gh: `غانا`,
    gr: `اليونان`,
    gt: `غواتيمالا`,
    hk: `هونغ كونغ`,
    hn: `هندوراس`,
    hr: `كرواتيا`,
    hu: `المجر`,
    id: `إندونيسيا`,
    ie: `أيرلندا`,
    il: `إسرائيل`,
    in: `الهند`,
    iq: `العراق`,
    ir: `إيران`,
    is: `آيسلندا`,
    it: `إيطاليا`,
    jm: `جامايكا`,
    jo: `الأردن`,
    jp: `اليابان`,
    ke: `كينيا`,
    kh: `كمبوديا`,
    kr: `كوريا الجنوبية`,
    kw: `الكويت`,
    kz: `كازاخستان`,
    la: `لاوس`,
    lb: `لبنان`,
    lk: `سريلانكا`,
    lt: `ليتوانيا`,
    lv: `لاتفيا`,
    ly: `ليبيا`,
    ma: `المغرب`,
    mk: `شمال مقدونيا`,
    mm: `ميانمار`,
    mn: `منغوليا`,
    mo: `ماكاو`,
    mt: `مالطا`,
    mx: `المكسيك`,
    my: `ماليزيا`,
    ng: `نيجيريا`,
    ni: `نيكاراغوا`,
    nl: `هولندا`,
    no: `النرويج`,
    np: `نيبال`,
    nz: `نيوزيلندا`,
    om: `عمان`,
    pa: `بنما`,
    pe: `بيرو`,
    ph: `الفلبين`,
    pk: `باكستان`,
    pl: `بولندا`,
    pt: `البرتغال`,
    py: `باراغواي`,
    qa: `قطر`,
    ro: `رومانيا`,
    rs: `صربيا`,
    ru: `روسيا`,
    rw: `رواندا`,
    sa: `المملكة العربية السعودية`,
    sd: `السودان`,
    se: `السويد`,
    sg: `سنغافورة`,
    si: `سلوفينيا`,
    sk: `سلوفاكيا`,
    sn: `السنغال`,
    sv: `السلفادور`,
    sy: `سوريا`,
    th: `تايلاند`,
    tn: `تونس`,
    tr: `تركيا`,
    tt: `ترينيداد`,
    tw: `تايوان`,
    tz: `تنزانيا`,
    ua: `أوكرانيا`,
    ug: `أوغندا`,
    un: `الأمم المتحدة`,
    us: `الولايات المتحدة`,
    uy: `أوروجواي`,
    uz: `أوزبكستان`,
    ve: `فنزويلا`,
    vn: `فيتنام`,
    ye: `اليمن`,
    za: `جنوب أفريقيا`,
    zw: `زيمبابوي`,
  },
  country: {
    buttonAU: `🇦🇺 أستراليا`,
    buttonCA: `🇨🇦 كندا`,
    buttonCN: `🇨🇳 الصين`,
    buttonDE: `🇩🇪 ألمانيا`,
    buttonFR: `🇫🇷 فرنسا`,
    buttonGB: `🇬🇧 المملكة المتحدة`,
    buttonHK: `🇭🇰 هونغ كونغ`,
    buttonJP: `🇯🇵 اليابان`,
    buttonKR: `🇰🇷 كوريا الجنوبية`,
    buttonMY: `🇲🇾 ماليزيا`,
    buttonNZ: `🇳🇿 نيوزيلندا`,
    buttonSG: `🇸🇬 سنغافورة`,
    buttonTH: `🇹🇭 تايلاند`,
    buttonTW: `🇹🇼 تايوان`,
    buttonUS: `🇺🇸 الولايات المتحدة`,
    confirmButton: `✅ صحيح`,
    confirmDetected: `لقد استنتجنا أنك من: 
`,
    confirmFailed: `❌ فشل التأكيد`,
    confirmHint: `💡 سيتم عرض هذا على بطاقة ملفك الشخصي لمساعدة المستخدمين الآخرين على فهمك بشكل أفضل.
`,
    confirmQuestion: `هل هذا صحيح؟

`,
    confirmReward: `🎉 التأكيد سيمنحك مكافأة +1 زجاجة رسائل!`,
    confirmTitle: `🌍 **قم بتأكيد بلدك/منطقتك**

`,
    confirmed: `✅ تم التأكيد!`,
    notCorrectButton: `❌ غير صحيح`,
    selectHint: `💡 سيتم عرض هذا على بطاقة ملفك الشخصي
`,
    selectTitle: `🌍 **يرجى اختيار بلدك/منطقتك**

`,
    selectUnFlagHint: `🇺🇳 إذا لم يتم العثور عليه، يمكنك اختيار 'علم الأمم المتحدة'`,
    setFailed: `❌ فشل الإعداد`,
    setTo: `✅ تم تعيينه كـ {flag} {country}`,
    unFlagButton: `🇺🇳 علم الأمم المتحدة`,
    useUnFlagButton: `🇺🇳 استخدم علم الأمم المتحدة`,
  },
  dailyReports: {
    header: `📊 **تقرير تحليل البيانات اليومية**`,
    time: `الوقت: \${time}`,
  },
  dev: {
    autoCompleted: `تم إتمام عملية التسجيل تلقائيًا.

`,
    bottles: `• زجاجة رسائل: {count}
`,
    catchCommand: `• /catch - التقاط زجاجة رسائل
`,
    conversations: `• المحادثات: {count}
`,
    dataReset: `✅ وضع التطوير: تم إعادة تعيين البيانات

تم حذف جميع بياناتك.

💡 يمكنك الآن إعادة بدء عملية التسجيل للاختبار.

🔄 إعادة التسجيل: /start
أو استخدم: /dev_restart (بدء التسجيل تلقائيًا)

⚠️ ملاحظة: هذه الميزة متاحة فقط في بيئة التجريب.`,
    getUserInfoFailed: `❌ فشل في استرداد المعلومات`,
    inviteActivated: `• مفعل: {count}
`,
    inviteCode: `رمز الدعوة: {code}
`,
    invitePending: `• في انتظار التفعيل: {count}

`,
    inviteStats: `إحصائيات الدعوة:
`,
    inviteTotal: `• إجمالي سجلات الدعوة: {count}
`,
    invitedBy: `تمت الدعوة بواسطة: {invitedBy}

`,
    language: `اللغة: {lang}
`,
    messages: `• الرسائل: {count}

`,
    nickname: `اللقب: {nickname}
`,
    no: `لا`,
    none: `لا شيء`,
    notAvailableInProduction: `❌ هذه الأوامر غير متاحة في الإنتاج.

هذه الأوامر غير متاحة في الإنتاج.`,
    notGenerated: `لم يتم إنشاؤه`,
    notSet: `لم يتم تعيينه`,
    onboardingStep: `خطوة التسجيل: {step}
`,
    resetFailed: `❌ إعادة تعيين فشلت: {error}

يرجى المحاولة مرة أخرى لاحقًا.`,
    skipFailed: `❌ تخطي الفاشل`,
    skipRegistration: `✅ وضع التطوير: تخطت التسجيل

`,
    stagingOnly: `⚠️ هذه الميزة متاحة فقط في بيئة التجريب.`,
    stats: `الإحصائيات:
`,
    statsCommand: `• /stats - عرض الإحصائيات

`,
    successfulInvites: `• الدعوات الناجحة: {count}
`,
    telegramId: `معرف تيليجرام: {id}
`,
    testCoreFeatures: `💡 يمكنك الآن اختبار الميزات الأساسية مباشرة: 
`,
    testUser: `مستخدم تجريبي`,
    throwCommand: `• /throw - رمي زجاجة رسائل
`,
    userInfo: `🔧 وضع التطوير: معلومات المستخدم

`,
    userNotFound: `❌ المستخدم غير موجود`,
    vip: `عضو مميز: {status}
`,
    yes: `نعم`,
  },
  draft: {
    'age.daysAgo': `\\\${days} أيام مضت`,
    'age.hoursAgo': `\\\${hours} ساعة مضت`,
    'age.justNow': `الآن`,
    contentHint: `💡 يمكنك:
• إدخال محتوى جديد مباشرة ليحل محل المسودة
• استخدام /throw لإعادة البدء
• إرسال محتوى المسودة لرمي زجاجة رسائل`,
    contentTitle: `📝 **محتوى المسودة**

`,
    continueEditing: `✅ متابعة تعديل المسودة`,
    deleteButton: `🗑️ حذف المسودة`,
    deleted: `✅ تم حذف المسودة`,
    editButton: `✏️ تعديل المحتوى`,
    editInput: `✏️ يرجى إدخال محتوى زجاجة الرسائل الجديد:

💡 نصائح:
• الحد الأدنى 5 أحرف
• الحد الأقصى 250 حرفًا
• لا يُسمح بالروابط أو الصور أو الوسائط المتعددة
• لا تتضمن معلومات الاتصال الشخصية
• المحتوى الودود والمحترم هو الأكثر احتمالًا أن يتم اختياره!`,
    editPrompt: `✏️ يرجى إدخال محتوى جديد`,
    newBottle: `✅ بدء زجاجة رسائل جديدة`,
    notFound: `⚠️ المسودة غير موجودة أو انتهت صلاحيتها`,
    sendButton: `✅ إرسال المسودة`,
    sendQuestion: `هل تريد إرسال هذه المسودة مباشرة؟`,
    sending: `✅ جاري الإرسال...`,
    targetGender: `ما نوع شريك الدردشة الذي تبحث عنه؟

`,
    targetGenderHint: `💡 ترقية إلى VIP للحصول على تصفية متقدمة (MBTI/البرج): /vip`,
    throwBottle: `🍾 رمي زجاجة رسائل

ما نوع شريك الدردشة الذي تبحث عنه؟`,
  },
  edit_profile: {
    nickname: `👤 الاسم المستعار:\\\\\\\\\\\\\\\${ownerMaskedNickname}`,
    short19: `✏️ تحرير الملف الشخصي`,
  },
  error: {
    ad: `❌ لا تتطلب هذه الإعلان تحقق`,
    ad2: `❌ لا توجد إعلانات متاحة في الوقت الحالي`,
    ad3: `❌ لا يمكن المطالبة بهذا الإعلان`,
    ad4: `❌ الإعلان غير موجود`,
    ad5: `❌ يجب أن يكون معرف الإعلان رقمًا`,
    ad6: `❌ ليس لديك إذن لعرض بيانات الإعلان.`,
    admin: `❌ حدث خطأ في النظام، يرجى المحاولة مرة أخرى لاحقًا.

إذا استمرت المشكلة، يرجى الاتصال بالمدير.`,
    admin2: `❌ **أذونات غير كافية**

هذا الأمر مخصص للمسؤولين الفائقين فقط.`,
    admin3: `❌ هذا المستخدم هو بالفعل مسؤول فائق ولا يحتاج إلى إضافة.`,
    admin4: `❌ فقط المسؤولون الفائقون يمكنهم استخدام هذا الأمر.`,
    admin5: `❌ هذا المستخدم هو بالفعل مسؤول.`,
    admin6: `❌ لا يمكن إزالة المسؤول الفائق.`,
    admin7: `❌ هذا المستخدم ليس مسؤولاً.`,
    appeal: `❌ يرجى تقديم معرف الاستئناف

الاستخدام: /admin_approve <appeal_id> [remarks]`,
    appeal2: `❌ يرجى تقديم معرف الاستئناف

الاستخدام: /admin_reject <appeal_id> [remarks]`,
    appeal3: `❌ الاستئناف \${appealId} قد تم مراجعته بالفعل.`,
    appeal4: `❌ معرف الاستئناف غير موجود: \${appealId}`,
    ban: `❌ المستخدم \${targetUserId} ليس لديه سجلات حظر.`,
    birthday: `❌ \${validation.error}

يرجى إعادة إدخال تاريخ ميلادك (التنسيق: YYYY-MM-DD):`,
    birthday2: `❌ تنسيق تاريخ الميلاد غير صحيح

يرجى إعادة الإدخال (التنسيق: YYYY-MM-DD):`,
    birthday3: `❌ تنسيق تاريخ الميلاد غير صحيح.`,
    bottle: `❌ انتهت هذه المحادثة.

استخدم /catch لاختيار زجاجة رسائل جديدة وبدء محادثة جديدة.`,
    bottle2: `❌ تم حظر حسابك ولا يمكنك اختيار زجاجات الرسائل.

إذا كانت لديك أسئلة، يرجى استخدام /appeal للاستئناف.`,
    bottle3: `❌ تم الحصول على زجاجة الرسائل هذه بالفعل من قبل شخص آخر، يرجى تجربة زجاجة أخرى!`,
    broadcast: `❌ نظام البث الحالي يدعم البث فقط لما يصل إلى \${MAX_SAFE_USERS} مستخدمين.

`,
    broadcast2: `❌ يجب أن يكون معرف البث رقمًا.`,
    broadcast3: `❌ لم يتم العثور على سجل البث.`,
    cancel: `❌ اسم المستخدم طويل جدًا، يرجى إدخال اسم مستخدم لا يزيد عن 36 حرفًا.

يرجى إعادة الإدخال أو إلغاء التعديل:`,
    cancel2: `❌ السيرة الشخصية طويلة جداً، يرجى إدخال 200 حرف كحد أقصى.

يرجى إعادة الإدخال أو إلغاء التعديل:`,
    cancel3: `❌ اسم المنطقة طويل جداً، يرجى إدخال 50 حرف كحد أقصى.

يرجى إعادة الإدخال أو إلغاء التعديل:`,
    cancel4: `❌ اللقب قصير جداً، يجب أن يكون على الأقل 4 أحرف.

يرجى إعادة الإدخال أو إلغاء التعديل:`,
    cancel5: `❌ يمكن أن يحتوي كل علامة على 20 حرف كحد أقصى.

يرجى إعادة الإدخال أو إلغاء التعديل:`,
    cancel6: `❌ إلغاء التعديل`,
    cancel7: `❌ تم الإلغاء \${ZODIAC_NAMES[zodiacSign]}`,
    cancel8: `❌ تم الإلغاء \${mbtiType}`,
    cancel9: `❌ إلغاء`,
    conversation: `❌ لم يتم العثور على محادثة بالمعرف \${formatIdentifier(identifier)}

`,
    conversation2: `❌ معلومات المحادثة غير صحيحة.`,
    conversation3: `❌ معلومات المحادثة غير صحيحة`,
    conversation4: `❌ المحادثة غير موجودة`,
    conversationInfoError: `❌ معلومات المحادثة غير صحيحة`,
    conversationNotFound: `❌ المحادثة غير موجودة`,
    failed: `❌ **فشل في تحميل الإعلان**

عذراً، لا يمكن للإعلان أن يعمل بشكل صحيح.

💡 **الأسباب المحتملة:**
• اتصال شبكة غير مستقر
• مزود الإعلان غير متاح مؤقتاً
• المتصفح غير مدعوم

🔄 **الاقتراحات:**
• تحقق من اتصال الشبكة
• حاول مرة أخرى لاحقاً
• أو استخدم طرق أخرى لكسب الاعتمادات (دعوة الأصدقاء)`,
    failed10: `❌ فشل في استعلام حالة وضع الصيانة.`,
    failed11: `❌ فشل في تحديث الصورة الرمزية

`,
    failed12: `❌ فشل التحقق، يرجى المحاولة مرة أخرى لاحقاً`,
    failed13: `❌ فشل في تمكين وضع الصيانة.`,
    failed14: `❌ فشل في تعطيل وضع الصيانة.`,
    failed15: `❌ فشل في استرجاع حالة الإعلان`,
    failed16: `❌ فشل في استرداد الإحصائيات.`,
    failed17: `❌ فشل في إنشاء البث.`,
    failed18: `❌ فشل في استرداد المعلومات.`,
    failed19: `❌ فشل في المطالبة بالمكافأة.`,
    failed2: `❌ فشل في إنشاء بث مفلتر
\${error instanceof Error ? error.message : String(error)}`,
    failed20: `❌ فشل التأكيد.`,
    failed21: `❌ فشل الإعداد.`,
    failed22: `❌ فشل في التجاوز.`,
    failed23: `❌ فشل العملية.`,
    failed24: `❌ فشل في إرسال التقرير اليومي: \${error instanceof Error ? error.message : String(error)}`,
    failed25: `❌ فشل في استرداد بيانات قمع VIP.`,
    failed26: `❌ **فشل التشخيص**

`,
    failed27: `❌ **فشل التحديث**

`,
    failed28: `❌ **فشل في الدفع**

`,
    failed29: `❌ فشل في استرداد قائمة مزودي الإعلانات.`,
    failed3: `❌ فشل في معالجة قائمة انتظار البث: \${error instanceof Error ? error.message : String(error)}`,
    failed30: `❌ فشل في استرداد قائمة الإعلانات الرسمية.`,
    failed31: `❌ فشل في تمكين مزود الإعلانات.`,
    failed32: `❌ فشل في تعطيل مزود الإعلانات.`,
    failed33: `❌ فشل في تمكين الإعلان الرسمي.`,
    failed34: `❌ فشل في تعطيل الإعلان الرسمي.`,
    failed35: `❌ فشل في استرداد بيانات التحليلات`,
    failed36: `❌ فشل في استرداد بيانات الإعلان`,
    failed37: `❌ فشل في تعيين الأولوية`,
    failed38: `❌ فشل الاسترداد: \${error instanceof Error ? error.message : String(error)}`,
    failed39: `❌ فشلت العملية: \${error instanceof Error ? error.message : String(error)}`,
    failed4: `❌ فشل في استعلام حالة البث: \${error instanceof Error ? error.message : String(error)}`,
    failed40: `❌ فشل الإرسال، يرجى المحاولة مرة أخرى لاحقًا.`,
    failed41: `❌ فشل في إنشاء المحادثة، يرجى المحاولة مرة أخرى لاحقًا.`,
    failed5: `❌ فشل في إلغاء البث: \${error instanceof Error ? error.message : String(error)}`,
    failed6: `❌ فشل في تنظيف البث: \${error instanceof Error ? error.message : String(error)}`,
    failed7: `❌ فشل إعادة الضبط: \${errorMessage}

يرجى المحاولة مرة أخرى لاحقًا.`,
    failed8: `❌ فشل في إنشاء البث، يرجى المحاولة مرة أخرى لاحقًا.`,
    failed9: `❌ فشل في تحديث سجل المحادثات

`,
    mbti: `❌ نوع MBTI غير صالح`,
    message: `❌ خطأ في تنسيق الفلتر

\${error instanceof Error ? error.message : String(error)}

`,
    message2: `❌ هذه الأوامر غير متاحة في الإنتاج.

هذه الأوامر غير متاحة في الإنتاج.`,
    message3: `❌ حدث خطأ، يرجى المحاولة مرة أخرى لاحقًا.

رسالة الخطأ: \${error instanceof Error ? error.message : String(error)}`,
    message4: `❌ عذرًا، يجب أن تكون في السن القانونية (18 عامًا) على الأقل لاستخدام هذه الخدمة.

يرجى العودة عندما تكون بالغًا!`,
    nickname: `❌ غير قادر على استرداد اسم المستخدم في تيليغرام`,
    nickname2: `❌ لا يمكن أن يحتوي الاسم المستعار على روابط URL

`,
    nickname3: `❌ \${validation.error}

يرجى إعادة إدخال اسم المستخدم الخاص بك:`,
    quota: `❌ لقد استهلكت حصة زجاجات الرسائل اليوم (\${quotaDisplay})

💡 طرق لكسب المزيد من الحصة: 
`,
    quota2: `❌ لقد استهلكت حصة رسائل المحادثة اليوم (\${usedToday}/\${dailyLimit})

`,
    quota3: `❌ لقد استهلكت حصة زجاجات الرسائل اليوم (\${quotaDisplay})

`,
    register: `❌ يرجى إكمال عملية التسجيل أولاً.

استخدم /start لمتابعة التسجيل.`,
    register2: `❌ لم يتم العثور على بيانات المستخدم، يرجى استخدام /start للتسجيل أولاً.`,
    register3: `❌ يجب عليك إكمال عملية التسجيل لالتقاط زجاجات الرسائل.

استخدم /start لمتابعة التسجيل.`,
    settings: `❌ يمكنك فقط تعيين حد أقصى من 5 علامات اهتمام.

يرجى إعادة الإدخال أو إلغاء التحرير:`,
    short: `❌ رمز اللغة غير صالح`,
    short10: `❌ ليس لديك الإذن الكافي`,
    short11: `❌ تحدث إلي لاحقاً`,
    short12: `❌ إعادة التحديد`,
    short13: `❌ إعادة الإدخال`,
    short14: `❌ إغلاق`,
    short15: `❌ غير مفعل`,
    short2: `❌ لم يتم العثور على بيانات المستخدم`,
    short3: `❌ خطوة تعليمية غير معروفة`,
    short4: `❌ حدث خطأ في النظام`,
    short5: `❌ خطأ في إعدادات القناة`,
    short6: `❌ عملية غير معروفة`,
    short7: `❌ غير صحيح`,
    short8: `❌ لا`,
    short9: `❌ حدث خطأ`,
    start: `❌ حدث خطأ، يرجى إعادة التشغيل: /start`,
    stats: `❌ ليس لديك إذن لعرض إحصائيات الإعلانات`,
    task: `❌ حدث خطأ أثناء عرض مركز المهام، يرجى المحاولة مرة أخرى لاحقاً.`,
    text: `❌ حدث خطأ أثناء حساب النتيجة، يرجى المحاولة مرة أخرى لاحقاً.

`,
    text10: `❌ خطأ في معلومات المرسل.`,
    text11: `❌ ليس لديك إذن لعرض بيانات التحليلات`,
    text12: `❌ حدث خطأ، يرجى المحاولة مرة أخرى لاحقاً.`,
    text13: `❌ ليس لديك إذن لاستخدام هذا الأمر.`,
    text14: `❌ استخدام غير صحيح

`,
    text15: `❌ يجب أن تكون الأولوية عدد صحيح غير سالب`,
    text16: `❌ يجب أن تكون المدة عدد صحيح موجب أو`,
    text17: `❌ حدث خطأ أثناء معالجة الدفع، يرجى الاتصال بخدمة العملاء.

`,
    text18: `❌ يجب أن يكون سبب الاسترداد 10 أحرف على الأقل، يرجى إعادة الإدخال:`,
    text19: `❌ **تم رفض طلب الاسترداد**

`,
    text2: `❌ يحتوي الملف الشخصي على روابط محظورة.

`,
    text20: `❌ طلب الاسترداد تجاوز الموعد النهائي

`,
    text21: `❌ طلب الاسترداد غير موجود أو تم معالجته`,
    text22: `❌ لم يتم العثور على سجل الدفع.`,
    text23: `❌ عذراً، يجب أن تكون 18 عاماً على الأقل لاستخدام هذه الخدمة.

`,
    text24: `❌ حدث خطأ، يرجى إعادة الإدخال.`,
    text25: `❌ يرجى الإجابة على السؤال بجدية

`,
    text3: `❌ لم يتم الكشف عن عضويتك في القناة، يرجى الانضمام أولاً ثم حاول مرة أخرى.`,
    text4: `❌ تم الكشف عن أنك تركت القناة، غير قادر على المطالبة بالمكافآت.`,
    text5: `❌ حدث خطأ أثناء بدء البرنامج التعليمي، يرجى المحاولة مرة أخرى لاحقاً.`,
    text6: `❌ حدث خطأ في النظام، يرجى المحاولة مرة أخرى لاحقًا.`,
    text7: `❌ يجب أن تكون المدة رقماً (دقائق)`,
    text8: `❌ حدث خطأ، يرجى المحاولة مرة أخرى لاحقاً.`,
    text9: `❌ غير قادر على استرجاع حالة وضع الصيانة.`,
    userNotFound: `❌ المستخدم غير موجود، يرجى التسجيل أولاً باستخدام /start.`,
    userNotFound2: `❌ المستخدم غير موجود، يرجى التسجيل أولاً.`,
    userNotFound3: `❌ المستخدم الآخر غير موجود.`,
    userNotFound4: `❌ المستخدم غير موجود`,
    userNotFound5: `❌ المستخدم غير موجود: \${userId}`,
    userNotFound6: `❌ المستخدم غير موجود أو غير مسجل.`,
    userNotFound7: `❌ المستخدم غير موجود.`,
    vip: `❌ ليس لديك إذن لعرض بيانات VIP.`,
    vip2: `❌ أنت مستخدم عادي ولا يمكنك طلب استرداد المبلغ.`,
  },
  errors: {
    channelConfigError: `❌ خطأ في تكوين القناة`,
    claimRewardFailed: `❌ فشل استحقاق المكافأة`,
    completeOnboarding: `⚠️ يرجى إكمال عملية التسجيل أولاً.`,
    conversationInfoError: `❌ خطأ في معلومات المحادثة.`,
    conversationNotFound: `❌ المحادثة غير موجودة`,
    'error.ad': `❌ لا تتطلب هذه الإعلانات التحقق`,
    'error.ad2': `❌ لا توجد إعلانات متاحة`,
    'error.ad3': `❌ لا يمكن استحقاق هذه الإعلان`,
    'error.ad4': `❌ الإعلان غير موجود`,
    'error.ad5': `❌ يجب أن يكون معرف الإعلان رقمًا`,
    'error.ad6': `❌ ليس لديك إذن لعرض بيانات الإعلان`,
    'error.admin': `❌ حدث خطأ في النظام، يرجى المحاولة مرة أخرى لاحقًا.

إذا استمر المشكلة، يرجى الاتصال بالمدير.`,
    'error.admin2': `❌ **أذونات غير كافية**

هذه الإجراء مقيد بالمديرين الفائقين.`,
    'error.admin3': `❌ هذا المستخدم هو بالفعل مديرًا فائقًا، لا حاجة للإضافة.`,
    'error.admin4': `❌ فقط المديرين الفائقين يمكنهم استخدام هذا الأمر.`,
    'error.admin5': `❌ هذا المستخدم هو بالفعل مديرًا.`,
    'error.admin6': `❌ لا يمكن إزالة المديرين الفائقين.`,
    'error.admin7': `❌ هذا المستخدم ليس مديرًا.`,
    'error.appeal': `❌ يرجى تقديم معرف الاستئناف

الاستخدام: /admin_approve <appeal_id> [ملاحظات]`,
    'error.appeal2': `<appeal_id>`,
    'error.appeal3': `{appealId} \${appealId}`,
    'error.appeal4': `{appealId} \${appealId}`,
    'error.ban': `{targetUserId} \${targetUserId}`,
    'error.birthday': `{validation.error} \${validation.error}`,
    'error.birthday2': `❌ 生日格式錯誤

請重新輸入（格式：YYYY-MM-DD）：`,
    'error.birthday3': `❌ 生日格式錯誤`,
    'error.bottle': `❌ 此對話已結束。

使用 /catch 撿新的漂流瓶開始新對話。`,
    'error.bottle2': `❌ 你的帳號已被封禁，無法撿漂流瓶。

如有疑問，請使用 /appeal 申訴。`,
    'error.bottle3': `❌ 這個瓶子已經被其他人撿走了，請試試其他瓶子！`,
    'error.broadcast': `❌ نظام البث الحالي يدعم فقط البث لغاية \\\\$MAX_SAFE_USERS مستخدمين.

 {MAX_SAFE_USERS} \${MAX_SAFE_USERS}`,
    'error.broadcast2': `❌ يجب أن يكون معرف البث رقمًا`,
    'error.broadcast3': `❌ لم يتم العثور على سجل البث`,
    'error.cancel': `❌ الاسم المستعار طويل جدًا؛ يرجى إدخال اسم مستعار لا يتجاوز 36 حرفًا.

يرجى إعادة الإدخال أو إلغاء التحرير:`,
    'error.cancel2': `❌ وصف الملف الشخصي طويل جدًا؛ يرجى إدخال وصف لا يتجاوز 200 حرف.

يرجى إعادة الإدخال أو إلغاء التحرير:`,
    'error.cancel3': `❌ اسم المنطقة طويل جدًا؛ يرجى إدخال اسم لا يتجاوز 50 حرفًا.

يرجى إعادة الإدخال أو إلغاء التحرير:`,
    'error.cancel4': `❌ الاسم المستعار قصير جدًا؛ يجب أن يتكون من 4 حروف على الأقل.

يرجى إعادة الإدخال أو إلغاء التحرير:`,
    'error.cancel5': `❌ يمكن أن يكون كل وسم بحد أقصى 20 حرفًا.

يرجى إعادة الإدخال أو إلغاء التحرير:`,
    'error.cancel6': `❌ إلغاء التحرير`,
    'error.cancel7': `❌ تم الإلغاء \\\\$ZODIAC_NAMES[zodiacSign] {ZODIAC_NAMES[zodiacSign]} \${ZODIAC_NAMES[zodiacSign]}`,
    'error.cancel8': `❌ تم الإلغاء \\\\$mbtiType {mbtiType} \${mbtiType}`,
    'error.cancel9': `❌ إلغاء`,
    'error.conversation': `❌ لم يتم العثور على محادثة بالمعرف \\\\$formatIdentifier(identifier)

 {formatIdentifier(identifier)} \${formatIdentifier(identifier)}`,
    'error.conversation2': `❌ خطأ في معلومات المحادثة.`,
    'error.conversation3': `❌ خطأ في معلومات المحادثة`,
    'error.conversation4': `❌ المحادثة غير موجودة`,
    'error.conversationInfoError': `❌ معلومات المحادثة غير صحيحة`,
    'error.conversationNotFound': `❌ المحادثة غير موجودة`,
    'error.failed': `❌ **فشل تحميل الإعلان**

نعتذر، لا يمكن تشغيل الإعلان بشكل صحيح.

💡 **الأسباب المحتملة:**
• اتصال شبكة غير مستقر
• مزود الإعلان غير متاح مؤقتًا
• المتصفح غير مدعوم

🔄 **الاقتراحات:**
• تحقق من اتصال الشبكة لديك
• جرب مرة أخرى لاحقًا
• أو استخدم طرقًا أخرى لكسب النقاط (دعوة الأصدقاء)`,
    'error.failed10': `❌ فشل في الاستعلام عن حالة وضع الصيانة.`,
    'error.failed11': `❌ فشل في تحديث الصورة الرمزية

`,
    'error.failed12': `❌ فشل التحقق، يرجى المحاولة مرة أخرى لاحقًا.`,
    'error.failed13': `❌ فشل في تفعيل وضع الصيانة.`,
    'error.failed14': `❌ فشل في تعطيل وضع الصيانة.`,
    'error.failed15': `❌ فشل في جلب حالة الإعلان.`,
    'error.failed16': `❌ فشل في جلب البيانات الإحصائية.`,
    'error.failed17': `❌ فشل في إنشاء البث.`,
    'error.failed18': `❌ فشل في جلب المعلومات.`,
    'error.failed19': `❌ فشل في المطالبة بالمكافأة.`,
    'error.failed2': `❌ فشل في إنشاء بث مفلتر

\\\${error instanceof Error ? error.message : String(error)}`,
    'error.failed20': `❌ فشل التأكيد.`,
    'error.failed21': `❌ فشل الإعداد.`,
    'error.failed22': `❌ فشل في التخطي.`,
    'error.failed23': `❌ فشل العملية.`,
    'error.failed24': `❌ فشل في إرسال التقرير اليومي: \\\${error instanceof Error ? error.message : String(error)}`,
    'error.failed25': `❌ فشل في جلب بيانات قمع VIP.`,
    'error.failed26': `❌ **فشل التشخيص**

`,
    'error.failed27': `❌ **فشل التحديث**

`,
    'error.failed28': `❌ **فشل الدفع**

`,
    'error.failed29': `❌ فشل في جلب قائمة مقدمي الإعلانات.`,
    'error.failed3': `❌ فشل في معالجة قائمة انتظار البث: \\\${error instanceof Error ? error.message : String(error)}`,
    'error.failed30': `❌ فشل في جلب قائمة الإعلانات الرسمية.`,
    'error.failed31': `❌ فشل في تفعيل مزود الإعلانات`,
    'error.failed32': `❌ فشل في تعطيل مزود الإعلانات`,
    'error.failed33': `❌ فشل في تفعيل الإعلانات الرسمية`,
    'error.failed34': `❌ فشل في تعطيل الإعلانات الرسمية`,
    'error.failed35': `❌ فشل في جلب بيانات التحليلات`,
    'error.failed36': `❌ فشل في جلب بيانات الإعلانات`,
    'error.failed37': `❌ فشل في تعيين الأولوية`,
    'error.failed38': `❌ فشل في استرداد المبلغ: \${error instanceof Error ? error.message : String(error)}`,
    'error.failed39': `❌ فشل العملية: \${error instanceof Error ? error.message : String(error)}`,
    'error.failed4': `❌ فشل في استعلام حالة البث: \${error instanceof Error ? error.message : String(error)}`,
    'error.failed40': `❌ فشلت عملية الإرسال، الرجاء المحاولة مرة أخرى لاحقاً.`,
    'error.failed41': `❌ فشل في إنشاء محادثة، الرجاء المحاولة مرة أخرى لاحقاً.`,
    'error.failed5': `❌ فشل في إلغاء البث: \${error instanceof Error ? error.message : String(error)}`,
    'error.failed6': `❌ فشل في تنظيف البث: \${error instanceof Error ? error.message : String(error)}`,
    'error.failed7': `❌ فشل في إعادة التعيين: \${errorMessage}

يرجى المحاولة مرة أخرى لاحقاً.`,
    'error.failed8': `❌ فشل في إنشاء البث، الرجاء المحاولة مرة أخرى لاحقاً.`,
    'error.failed9': `❌ فشل في تحديث تاريخ المحادثة

`,
    'error.mbti': `❌ نوع MBTI غير صالح`,
    'error.message': `❌ خطأ في تنسيق الفلتر

\\\${error instanceof Error ? error.message : String(error)}

`,
    'error.message2': `❌ هذا الأمر غير متاح في الإنتاج.

هذا الأمر غير متاح في الإنتاج.`,
    'error.message3': `❌ حدث خطأ، يرجى المحاولة مرة أخرى لاحقًا.

رسالة الخطأ: \\\\$\\{error instanceof Error ? error.message : String(error)} \${error instanceof Error ? error.message : String(error)}`,
    'error.message4': `❌ نعتذر، يجب أن تكون على الأقل 18 عامًا لاستخدام هذه الخدمة.

يرجى العودة عندما تكون بالغًا!`,
    'error.nickname': `❌ غير قادر على استرداد اسم مستخدم تيليجرام`,
    'error.nickname2': `❌ لا يمكن أن تحتوي أسماء المستخدمين على روابط مواقع الويب

`,
    'error.nickname3': `❌ \\\\$\\{validation.error}

يرجى إعادة إدخال اسم المستخدم الخاص بك: \${validation.error}`,
    'error.quota': `❌ تم استخدام حصة زجاجة الرسائل اليوم (\\\${quotaDisplay})

💡 طرق للحصول على المزيد من الحصة: 
`,
    'error.quota2': `❌ تم استخدام حصة رسالة المحادثة اليوم (\\\${usedToday}/\\\${dailyLimit})

`,
    'error.quota3': `❌ تم استخدام حصة زجاجة الرسائل اليوم (\\\${quotaDisplay})

`,
    'error.register': `❌ يرجى إكمال عملية التسجيل أولاً.

استخدم /start للمتابعة في التسجيل.`,
    'error.register2': `❌ لم يتم العثور على بيانات المستخدم، يرجى استخدام /start للتسجيل أولاً.`,
    'error.register3': `❌ يجب عليك إكمال عملية التسجيل لالتقاط زجاجات الرسائل.

استخدم /start للمتابعة في التسجيل.`,
    'error.settings': `❌ يمكنك تعيين حد أقصى من 5 علامات اهتمام.

يرجى إعادة الإدخال أو إلغاء التعديل:`,
    'error.short': `❌ رمز لغة غير صالح`,
    'error.short10': `❌ أذونات غير كافية`,
    'error.short11': `❌ دعنا نتحدث لاحقًا`,
    'error.short12': `❌ إعادة التحديد`,
    'error.short13': `❌ إعادة الإدخال`,
    'error.short14': `❌ إغلاق`,
    'error.short15': `❌ غير مفعل`,
    'error.short2': `❌ لم يتم العثور على بيانات المستخدم`,
    'error.short3': `❌ خطوة تعليمية غير معروفة`,
    'error.short4': `❌ خطأ في النظام`,
    'error.short5': `❌ خطأ في إعدادات القناة`,
    'error.short6': `❌ عملية غير معروفة`,
    'error.short7': `❌ غير صحيح`,
    'error.short8': `❌ لا`,
    'error.short9': `❌ حدث خطأ`,
    'error.start': `❌ حدث خطأ، يرجى إعادة التشغيل: /start`,
    'error.stats': `❌ ليس لديك إذن لعرض إحصائيات الإعلانات`,
    'error.task': `❌ حدث خطأ أثناء عرض مركز المهام، يرجى المحاولة مرة أخرى لاحقاً.`,
    'error.text': `❌ حدث خطأ أثناء حساب النتائج، يرجى المحاولة مرة أخرى لاحقاً.

`,
    'error.text10': `❌ خطأ في معلومات المرسل.`,
    'error.text11': `❌ ليس لديك إذن لعرض بيانات التحليلات.`,
    'error.text12': `❌ حدث خطأ، يرجى المحاولة مرة أخرى لاحقاً.`,
    'error.text13': `❌ ليس لديك إذن لاستخدام هذا الأمر.`,
    'error.text14': `❌ طريقة الاستخدام غير صحيحة

`,
    'error.text15': `❌ يجب أن تكون الأولوية عدد صحيح غير سالب`,
    'error.text16': `❌ يجب أن تكون المدة عدد صحيح موجب أو`,
    'error.text17': `❌ حدث خطأ أثناء معالجة الدفع، يرجى الاتصال بدعم العملاء.

`,
    'error.text18': `❌ يجب أن يكون سبب الاسترداد 10 أحرف على الأقل، يرجى إعادة الإدخال:`,
    'error.text19': `❌ **تم رفض طلب الاسترداد**

`,
    'error.text2': `❌ يحتوي الملف الشخصي على روابط غير مسموح بها.

`,
    'error.text20': `❌ يتجاوز طلب الاسترداد الحد الزمني

`,
    'error.text21': `❌ طلب الاسترداد غير موجود أو تم معالجته`,
    'error.text22': `❌ لم يتم العثور على سجل الدفع.`,
    'error.text23': `❌ نعتذر، يجب أن تكون على الأقل 18 عامًا لاستخدام هذه الخدمة.

`,
    'error.text24': `❌ حدث خطأ، يرجى إعادة الإدخال.`,
    'error.text25': `❌ يرجى الإجابة على السؤال بجدية

`,
    'error.text3': `❌ لم يتم اكتشاف عضويتك في القناة، يرجى الانضمام أولاً والمحاولة مرة أخرى`,
    'error.text4': `❌ تم الكشف عن أنك غادرت القناة، غير قادر على المطالبة بالمكافآت.`,
    'error.text5': `❌ حدث خطأ أثناء بدء البرنامج التعليمي، يرجى المحاولة مرة أخرى لاحقًا.`,
    'error.text6': `❌ حدث خطأ في النظام، يرجى المحاولة مرة أخرى لاحقًا.`,
    'error.text7': `❌ يجب أن تكون المدة رقمًا (بالدقائق)`,
    'error.text8': `❌ حدث خطأ، يرجى المحاولة مرة أخرى لاحقًا.`,
    'error.text9': `❌ غير قادر على استرجاع حالة وضع الصيانة.`,
    'error.userNotFound': `❌ المستخدم غير موجود، يرجى التسجيل أولاً باستخدام /start.`,
    'error.userNotFound2': `❌ المستخدم غير موجود، يرجى التسجيل أولاً.`,
    'error.userNotFound3': `❌ المستخدم الآخر غير موجود.`,
    'error.userNotFound4': `❌ المستخدم غير موجود.`,
    'error.userNotFound5': `❌ المستخدم غير موجود: \\\${userId}`,
    'error.userNotFound6': `❌ المستخدم غير موجود أو غير مسجل.`,
    'error.userNotFound7': `❌ المستخدم غير موجود.`,
    'error.vip': `❌ ليس لديك إذن لعرض بيانات VIP.`,
    'error.vip2': `❌ أنت لست مستخدم VIP ولا يمكنك طلب استرداد.`,
    errorDetails: `رسالة خطأ: {error}`,
    failed: `فشل: \${broadcast.failedCount}
`,
    failed2: `فشل: \${result.failed} عناصر

`,
    failed3: `ستُ marked هذه البثوث على أنها بحالة 'فشل'
`,
    failed4: `تم وسم هذه البثوث على أنها بحالة 'فشل'
`,
    generic: `❌ حدث خطأ، يرجى المحاولة مرة أخرى لاحقًا.`,
    invalidRequest: `❌ طلب غير صالح`,
    message: `\${statusEmoji} **\${provider.provider_display_name}**
\${healthEmoji} حالة الصحة: \${health.is_healthy ? 'جيد' : 'يحتاج إلى انتباه'}
📊 معدل الإنجاز: \${stats.completion_rate}%
❌ معدل الأخطاء: \${stats.error_rate}%
📈 إجمالي الطلبات: \${stats.total_requests}
✅ إجمالي الإنجازات: \${stats.total_completions}
💡 الاقتراح: \${health.recommendation} {health.is_healthy ? '良好' : '需要關注'} \${health.is_healthy ? '良好' : '需要關注'}`,
    message2: `رسالة الخطأ: \${error instanceof Error ? error.message : String(error)}`,
    message3: `
خطأ: \${broadcast.errorMessage}`,
    operationFailed: `❌ العملية فشلت.`,
    processError: `❌ حدث خطأ أثناء المعالجة`,
    sessionExpired: `❌ انتهت صلاحية الجلسة، يرجى البدء من جديد`,
    systemError: `خطأ في النظام`,
    systemErrorRetry: `❌ حدث خطأ في النظام، يرجى المحاولة مرة أخرى لاحقًا.`,
    unknownAction: `❌ عملية غير معروفة`,
    unknownError: `🎨 تجربة المستخدم: رسالة خطأ ودية`,
    userNotFound: `المستخدم غير موجود`,
    userNotFoundRegister: `⚠️ المستخدم غير موجود، يرجى التسجيل باستخدام /start أولاً.`,
    verificationFailed: `❌ فشلت عملية التحقق، يرجى المحاولة لاحقًا.`,
  },
  estimate: {
    immediate: `أرسل الآن (حوالي 1-2 ثانية)`,
    minutes: `حوالي \${minutes} دقيقة`,
    seconds: `حوالي \${seconds} ثانية`,
  },
  help: {
    ad: `• شاهد الإعلانات: +1 رصيد في كل مرة (حتى 20 مرة يوميًا)
`,
    ad2: `/ad_performance - تقرير أداء الإعلانات
`,
    ad3: `• كسب الرصيد من خلال مشاهدة الإعلانات (يظهر عند نفاد الرصيد)
`,
    ad4: `• عرض الإعلانات الرسمية لكسب رصيد دائم

`,
    ad5: `• الإعلانات الرسمية: مكافآت رصيد دائم
`,
    ad6: `• تجربة بدون إعلانات

`,
    admin: `/admin_remove <user_id> - إزالة مشرف

`,
    admin2: `/admin_add <user_id> - إضافة مشرف
`,
    admin3: `/admin_list - عرض قائمة المشرفين
`,
    admin4: `🔱 **ميزات المشرف الفائق**

`,
    admin5: `👮 **ميزات المشرف**

`,
    admin6: `**إدارة المشرفين**
`,
    appeal: `/admin_reject [note] - رفض الاستئناف

`,
    appeal2: `/admin_approve [note] - الموافقة على الاستئناف
`,
    appeal3: `/appeal_status - التحقق من حالة الاستئناف

`,
    appeal4: `/admin_appeals - عرض الاستئنافات المعلقة
`,
    appeal5: `🛡️ **السلامة والاعتراضات**
`,
    appeal6: `**مراجعة الاعتراضات**
`,
    ban: `/admin_ban <user_id> [ساعات|دائم] - حظر المستخدم
`,
    ban2: `/admin_bans <user_id> - عرض سجل حظر المستخدم

`,
    ban3: `/admin_unban <user_id> - رفع الحظر عن المستخدم
`,
    ban4: `/admin_bans - عرض سجلات الحظر
`,
    ban5: `/appeal - استئناف الحظر
`,
    ban6: `• ستؤدي الانتهاكات إلى حظر

`,
    birthday: `• اليوم عيد الميلاد: is_birthday=true

`,
    bottle: `• إكمال المهام: احصل على زجاجات رسائل إضافية (استخدم /tasks لعرضها)
`,
    bottle2: `/tasks - مركز المهام (أكمل المهام للحصول على زجاجات رسائل إضافية)
`,
    bottle3: `• يمكنك رمي والتقاط عدد محدود من زجاجات الرسائل كل يوم
`,
    bottle4: `• مستخدمو VIP: 30 زجاجة رسائل يومياً
`,
    bottle5: `• زجاجات الرسائل صالحة لمدة 24 ساعة

`,
    bottle6: `• المستخدمون المجانيون: 3 زجاجات رسائل يومياً
`,
    bottle7: `/throw - رمي زجاجة رسائل
`,
    bottle8: `/catch - التقاط زجاجة رسائل
`,
    bottle9: `🍾 **نظام زجاجة الرسائل**
`,
    broadcast: `/broadcast_status - عرض تفاصيل البث
`,
    broadcast2: `/broadcast_process - معالجة قائمة انتظار البث يدويًا
`,
    broadcast3: `/broadcast_cleanup - تنظيف البث العالق
`,
    broadcast4: `/broadcast_status - عرض قائمة البث
`,
    broadcast5: `**مراقبة البث**
`,
    broadcast6: `**إرسال البث**
`,
    cancel: `/broadcast_cancel - إلغاء البث

`,
    conversation: `/chats - قائمة الدردشات الخاصة بي

`,
    conversation2: `• جميع المحادثات مجهولة الهوية
`,
    help2: `💡 استخدم /help لعرض المساعدة`,
    invite: `• دعوة الأصدقاء: +1 حصة لكل شخص (حتى 10/100)
`,
    invite2: `/invite - دعوة الأصدقاء للحصول على حصة
`,
    mbti: `• تصفية حسب MBTI، علامة زودياك، نوع الدم
`,
    mbti2: `/mbti - إدارة MBTI
`,
    message: `/maintenance_enable - تفعيل وضع الصيانة
`,
    message2: `/broadcast_non_vip - بث للمستخدمين غير المميزين
`,
    message3: `• الإناث من 18-25 عامًا: الجنس=أنثى،العمر=18-25
`,
    message4: `/broadcast_filter - بث دقيق
`,
    message5: `/broadcast_vip - بث للمستخدمين المميزين
`,
    message6: `/maintenance_disable - تعطيل وضع الصيانة

`,
    message7: `/maintenance_status - عرض حالة الصيانة
`,
    message8: `/broadcast - بث لجميع المستخدمين
`,
    profile: `/edit_profile - تعديل الملف الشخصي
`,
    profile2: `/profile - عرض الملف الشخصي
`,
    profile3: `👤 **الملف الشخصي**
`,
    quota: `• ادعُ أصدقاءك لزيادة حصتك (حتى 10/100)
`,
    quota2: `• 30 زجاجة رسائل يومياً
`,
    register: `/start - ابدأ / تابع التسجيل
`,
    report: `/report - الإبلاغ عن محتوى غير مناسب
`,
    settings: `/settings - إعدادات الإشعارات`,
    settings2: `📖 **المساعدة والإعدادات**
`,
    stats: `/stats - إحصائياتي

`,
    success: `└ تحسين كبير في معدل نجاح المطابقة
`,
    text: `/maintenance_status - تحقق من حالة الصيانة`,
    text10: `📖 **قائمة أوامر XunNi**

`,
    text11: `/analytics - تقرير العمليات اليومية
`,
    text12: `/dev_restart - إعادة تعيين الحساب بالكامل`,
    text13: `📜 **قواعد لعبة XunNi**

`,
    text14: `• يمكن إرسال النصوص والإيموجي الرسمية فقط
`,
    text15: `/dev_info - معلومات النظام
`,
    text16: `/quota - تحقق من حالة الحصة
`,
    text17: `/rules - عرض قواعد اللعبة
`,
    text18: `/block - حظر المستخدم
`,
    text19: `/help - عرض هذه القائمة
`,
    text2: `/refresh_avatar - تحديث ذاكرة التخزين المؤقت للصورة الشخصية
`,
    text20: `• احترم الآخرين وتواصل بلطف

`,
    text21: `🎁 **طرق كسب الائتمانات**
`,
    text22: `• لا تشارك معلومات الاتصال الشخصية
`,
    text23: `🛡️ **قواعد السلامة**
`,
    text24: `🎮 **الميزات الأساسية**
`,
    text25: `/menu - القائمة الرئيسية
`,
    text26: `💬 **دردشة مجهولة**
`,
    text27: `• التحرش أو الإهانات محظورة
`,
    text28: `• إرسال محتوى غير مناسب محظور
`,
    text29: `• فتح صور واضحة للآخرين
`,
    text3: `• أرسل فقط للإناث: الجنس=female
`,
    text30: `• عمليات الاحتيال والتصيد محظورة
`,
    text31: `**إدارة المستخدمين**
`,
    text32: `**صيانة النظام**
`,
    text33: `**تحليل البيانات**
`,
    text34: `**أدوات التطوير**
`,
    text4: `• 34 لغة تترجم تلقائيًا (OpenAI مفضل)
`,
    text5: `/profile_card - عرض بطاقة الملف الشخصي
`,
    text6: `/dev_reset - إعادة ضبط الحساب (للاختبار)
`,
    text7: `• فقط للذكور: gender=male
`,
    text8: `💡 تواجه مشاكل؟ استخدم /help لعرض قائمة الأوامر`,
    text9: `• استخدم /quota للتحقق من حالة الحصة

`,
    throw: `• 🆕 فرصة ثلاثية التعرض (1 زجاجة رسائل = 3 أهداف)
`,
    vip: `• VIP في تايوان: country=TW,vip=true
`,
    vip2: `• الحصة اليومية المجانية: 3 (VIP: 30)
`,
    vip3: `/funnel - مسار تحويل VIP

`,
    vip4: `🎁 **الحصة وVIP**
`,
    vip5: `/vip - اشتراك VIP
`,
    vip6: `💎 **مزايا VIP**
`,
  },
  history: {
    chatHistory: `💬 **سجل الدردشة الخاص بك**

`,
    continueChatButton: `💬 متابعة الدردشة`,
    continueConversation: `💬 متابعة الدردشة: /reply
`,
    conversationEnd: `• آخر رسالة: {time}
`,
    conversationNotFound: `❌ لم يتم العثور على محادثة مع المعرف {identifier}

استخدم /history لعرض جميع المحادثات

🏠 العودة إلى القائمة الرئيسية: /menu`,
    conversationStart: `• بدأت المحادثة: {time}
`,
    conversationTitle: `📨 محادثة مع {identifier} ({count} رسالة)
`,
    conversationWith: `💬 **محادثة مع {identifier}**

`,
    daysAgo: `منذ {days} يوم`,
    errorRetry: `❌ حدث خطأ، يرجى المحاولة لاحقاً.`,
    hoursAgo: `منذ {hours} ساعة`,
    justNow: `الآن`,
    lastMessage: `آخر رسالة: {preview}
`,
    messageSender: `{sender}: {content}

`,
    messageTime: `📨 {time}
`,
    minutesAgo: `منذ {minutes} دقيقة`,
    noHistory: `💬 ليس لديك سجل دردشة حتى الآن

اذهب لرمي زجاجة رسائل للتعرف على أصدقاء جدد! /throw

🏠 العودة إلى القائمة الرئيسية: /menu`,
    noMessages: `(لا توجد رسائل)`,
    partnerMessages: `• الطرف الآخر أرسل: {count}
`,
    recentMessages: `
📨 **الدردشات الأخيرة:**

`,
    returnToMenu: `🏠 العودة إلى القائمة الرئيسية: /menu`,
    returnToMenuButton: `🏠 العودة إلى القائمة الرئيسية`,
    stats: `📊 **الإحصائيات:**
`,
    time: `الوقت: {time}

`,
    totalMessages: `• إجمالي الرسائل: {total}
`,
    userMessages: `• أرسلت: {count}
`,
    viewFull: `💡 استخدم /history {identifier} لعرض المحادثة الكاملة

`,
    you: `أنت`,
  },
  invite: {
    inviteeSuccess: `[يحتاج إلى ترجمة: invite.inviteeSuccess]`,
    selfInviteError: `[يحتاج إلى ترجمة: invite.selfInviteError]`,
    upgradePrompt: `[يحتاج إلى ترجمة: invite.upgradePrompt]`,
    userType: `{type}`,
  },
  maintenance: {
    allFeaturesAvailable: `جميع الميزات تعمل الآن بشكل كامل.`,
    completed: `✅ تمت صيانة النظام بنجاح`,
    completingSoon: `على وشك الانتهاء`,
    correctFormat: `**الصيغة الصحيحة:**
/maintenance_enable [رسالة الصيانة]

`,
    defaultMessage: `النظام يخضع للصيانة وغير متوفر مؤقتًا.`,
    disableFailed: `❌ فشل في تعطيل وضع الصيانة.`,
    disableSuccess: `✅ تم تعطيل وضع الصيانة

تم بث إشعارات الاستعادة لجميع المستخدمين.`,
    durationMax: `لا يمكن أن تتجاوز مدة الصيانة 24 ساعة (1440 دقيقة)`,
    durationMin: `الحد الأدنى لمدة الصيانة هو 5 دقائق`,
    durationMustBeNumber: `❌ يجب أن تكون المدة رقمًا (بالدقائق)`,
    enableFailed: `❌ فشل في تفعيل وضع الصيانة.`,
    enableSuccess: `✅ تم تفعيل وضع الصيانة

المدة: {duration} دقيقة
البداية: {startTime}
النهاية: {endTime}

تم بث إشعار الصيانة لجميع المستخدمين.
لن يتمكن المستخدمون العاديون من الوصول إلى الخدمة، فقط يمكن للمسؤولين تسجيل الدخول.`,
    enabledBy: `ممكن بواسطة: {user}
`,
    estimatedDuration: `المدة المقدرة: {duration} دقيقة
`,
    estimatedEnd: `الإنهاء المتوقع: {time}
`,
    example: `**مثال:**
/maintenance_enable 60 ترقية النظام للصيانة`,
    notificationTitle: `🛠️ إشعار صيانة النظام`,
    remainingHours: `حول {hours} ساعة و {minutes} دقيقة`,
    remainingMinutes: `تقريبًا {minutes} دقيقة`,
    remainingTime: `الوقت المتبقي: {time}
`,
    serviceRestored: `عادت الخدمات إلى طبيعتها، شكرًا على صبرك!`,
    startTime: `وقت البدء: {time}
`,
    status: `الحالة: {status}
`,
    statusActive: `✅ تحت الصيانة`,
    statusFailed: `❌ غير قادر على استرداد حالة وضع الصيانة`,
    statusInactive: `❌ غير مفعل`,
    statusTitle: `🛠️ حالة وضع الصيانة`,
    thanks: `شكرًا على صبرك!`,
    unknown: `غير معروف`,
    usageError: `❌ استخدام غير صحيح

`,
  },
  mbtiTest: {
    afterRegistration: `💡 بعد إكمال التسجيل، يمكنك: 
`,
    answerRecorded: `✅ تم التسجيل بنجاح`,
    completion: `🎉 {testTitle} تم الانتهاء منه!

`,
    fullAccuracy: `نتائج أكثر دقة`,
    fullQuestions: `36 سؤالاً`,
    fullTest: `أكمل اختبار MBTI`,
    fullTestInfo: `

💡 هذا اختبار شامل ({questions})، ستكون النتائج أكثر دقة.
بعد إكمال التسجيل، يمكنك إعادة الاختبار باستخدام /mbti.

`,
    fullTestTitle: `اختبار كامل`,
    manualModify: `• تعديل نوع MBTI الخاص بك يدويًا`,
    moreDetailedTest: `• خذ اختبارًا أكثر تفصيلًا
`,
    note: `⚠️ ملاحظة: هذا هو {testInfo}{testTitle}، {accuracy}.

`,
    questionOrderError: `⚠️ ترتيب الأسئلة غير صحيح`,
    questions12: `12 سؤالاً`,
    questions36: `36 سؤالاً`,
    quickAccuracy: `النتائج للرجوع إليها فقط`,
    quickQuestions: `12 سؤالاً`,
    quickTest: `اختبار MBTI سريع`,
    quickTestInfo: `

💡 هذا اختبار سريع ({questions})، النتائج للاستخدام المرجعي فقط.
بعد إكمال التسجيل، يمكنك إعادة الاختبار باستخدام /mbti.

`,
    quickTestTitle: `اختبار سريع`,
    yourMbtiType: `نوع MBTI الخاص بك هو: **{type}**

`,
  },
  menu: {
    bottle: `• يتم تفعيلها بعد أن يرمي الأصدقاء زجاجة الرسائل الأولى
`,
    buttonCatch: `🎣 التقاط زجاجة رسائل`,
    buttonChats: `💬 محادثاتي`,
    buttonHelp: `❓ مساعده`,
    buttonInvite: `👥 دعوة الأصدقاء`,
    buttonProfile: `👤 الملف الشخصي`,
    buttonSettings: `⚙️ الإعدادات`,
    buttonStats: `📊 الإحصائيات`,
    buttonThrow: `🌊 أرسل زجاجة رسائل`,
    buttonVip: `💎 العضوية المميزة`,
    invite: `🎁 **دعوة الأصدقاء**

`,
    invite2: `📋 رمز الدعوة الخاص بك: {inviteCode}`,
    invite3: `📤 شارك رمز الدعوة`,
    levelFree: `🆓 عضو مجاني`,
    levelVip: `💎 عضو مميز`,
    message: `https://t.me/share/url?url=https://t.me/\${botUsername}?start=invite_\${inviteCode}&text=تعال إلى XunNi وأرسل زجاجات الرسائل معًا!🍾 انضم باستخدام رمز الدعوة الخاص بي وسنحصل على مزيد من الحصص! https://t.me/share/url?url=https://t.me/\${botUsername}?start=invite_\${inviteCode}&text=來`,
    message2: `https://t.me/share/url?url=https://t.me/\${botUsername}?start=invite_\${inviteCode}&text=تعال إلى XunNi وأرسل زجاجات الرسائل معًا https://t.me/share/url?url=https://t.me/\${botUsername}?start=invite_\${inviteCode}&text=來`,
    notRegistered: `غير مسجل`,
    notSet: `غير محدد`,
    quota: `• تحصل كلاكما على حصة يومية +1

`,
    register: `• الأصدقاء يستخدمون رمز الدعوة الخاص بك للتسجيل
`,
    selectFeature: `يرجى اختيار ميزة:`,
    settings: `• MBTI: \${user.mbti_result}
`,
    settings2: `• برج: \${user.zodiac_sign}

`,
    settings3: `غير محدد`,
    settings4: `غير محدد`,
    short: `عضو مجاني`,
    stats: `📊 عرض إحصائيات الدعوات: /profile`,
    stats2: `📊 عرض إحصائيات الدعوات`,
    task: `🎯 **المهمة القادمة**
⏳ \${nextTask.name} (+\${nextTask.reward_amount} زجاجة رسائل)
💡 \${nextTask.description}

`,
    text: `🏠 **القائمة الرئيسية** \${vipBadge}

`,
    text2: `👋 مرحبًا، \${user.nickname}!

`,
    text3: `💡 انقر على الزر أدناه لمشاركة مع الأصدقاء: 
`,
    text4: `💡 اختر الميزة التي تريدها:`,
    text5: `📊 حالتك: 
`,
    title: `🏠 **القائمة الرئيسية**`,
    userNotFound: `المستخدم غير موجود`,
    vip: `• المستوى: \${isVip ? 'عضو VIP 💎' : 'عضو مجاني'}
 {isVip ? 'VIP 會員 💎' : '免費會員'} \${isVip ? 'VIP 會員 💎' : '免費會員'}`,
    vip2: `عضو VIP 💎`,
    yourStatus: `حالتك`,
  },
  messageForward: {
    dailyQuota: `📊 اليوم أُرسل: {used}/{limit} رسالة`,
    messageSent: `✅ تم إرسال الرسالة إلى {identifier}

`,
    removeLinks: `[الترجمة مطلوبة من zh-TW.ts]`,
    replyHint: `[الترجمة مطلوبة من zh-TW.ts]`,
    upgradeVip: `[متطلبات ترجمة من zh-TW.ts]`,
    urlNotAllowed: `[متطلبات ترجمة من zh-TW.ts]`,
    urlNotAllowedDesc: `[متطلبات ترجمة من zh-TW.ts]`,
    vipDailyLimit: `[متطلبات ترجمة من zh-TW.ts]`,
  },
  nickname: {
    cannotGetNickname: `❌ غير قادر على استرجاع الاسم المستعار في تيليجرام`,
    customHint: `⚠️ ملاحظة:
• حد طول الاسم المستعار: 36 حرفًا
• المعروض للآخرين: بحد أقصى 18 حرفًا
• يرجى عدم استخدام الاسم المستعار لإرسال الإعلانات`,
    customPrompt: `✏️ يرجى إدخال اسمك المستعار:

`,
    genderHint: `⚠️ ملاحظة: إعداد الجنس لا يمكن تعديله بعد الاختيار، يرجى الاختيار بعناية!`,
    genderSelection: `رائع! اسمك المستعار هو: {nickname}

يرجى اختيار جنسك الآن: 

`,
    nicknameSet: `✅ تم تعيين الاسم المستعار`,
    userNotFound: `❌ المستخدم غير موجود`,
  },
  officialAd: {
    adNotFound: `❌ الإعلان غير موجود`,
    allAdsViewed: `✅ لقد رأيت جميع الإعلانات الرسمية`,
    alreadyViewed: `لقد رأيت هذه الإعلان بالفعل`,
    buttonClaimReward: `استرداد الجائزة`,
    buttonJoinGroup: `انضم إلى المجموعة`,
    buttonSubscribeChannel: `اشترك في القناة`,
    buttonVerifyAndClaim: `✅ تحقق واسترداد`,
    buttonViewDetails: `عرض التفاصيل`,
    buttonVisitLink: `زيارة الرابط`,
    cannotClaim: `❌ غير قادر على استرداد هذا الإعلان`,
    claimReward: `✅ استرداد الجائزة`,
    claimRewardButton: `✅ تم استرداد المكافأة`,
    claimRewardSuccess: `✅ تم استرداد الجائزة بنجاح! حصلت على +{quota} حصص دائمة!`,
    errorRetry: `❌ حدث خطأ، يرجى المحاولة مرة أخرى لاحقًا`,
    moreAdsAvailable: `💡 هناك المزيد من الإعلانات الرسمية للمشاهدة!`,
    nextAd: `➡️ الإعلان التالي`,
    noAdsAvailable: `❌ لا توجد إعلانات متاحة في هذا الوقت`,
    noVerificationRequired: `❌ لا حاجة للتحقق من هذا الإعلان`,
    requiresVerification: `

✅ التحقق مطلوب: انقر على زر 'التحقق' بعد الانضمام إلى المجموعة/القناة`,
    reward: `🎁 الجائزة: +{quota} حصص دائمة`,
    statsAdNotFound: `❌ الإعلان غير موجود`,
    statsClicks: `• النقرات: {count}
`,
    statsCtr: `• معدل النقر (CTR): {rate}%
`,
    statsHint: `💡 استخدم /ad_stats {id} لعرض إحصائيات مفصلة`,
    statsNoAds: `📊 لا توجد إعلانات رسمية متاحة`,
    statsNoPermission: `❌ ليس لديك إذن لعرض إحصاءات الإعلانات`,
    statsRemainingViews: `• العروض المتبقية: {remaining}/{total}
`,
    statsRewardGranted: `• المكافآت الموزعة: {count}
`,
    statsRewardRate: `• معدل المكافأة: {rate}%
`,
    statsRewardSummary: `• المكافآت: {rewards}

`,
    statsSummary: `• العروض: {views} | النقرات: {clicks} ({ctr}%)
`,
    statsTitle: `📊 **إحصاءات الإعلان الرسمية**

`,
    statsVerificationCount: `• عدد التحقق: {count}
`,
    statsVerificationRate: `• معدل التحقق: {rate}%
`,
    statsViews: `• المشاهدات: {count}
`,
    statusDisabled: `تعطيل`,
    statusEnabled: `تفعيل`,
    unlimited: `غير محدود`,
    userNotFound: `❌ المستخدم غير موجود`,
    verifySuccess: `✅ التحقق ناجح! حصلت على +{quota} حصص دائمة!`,
  },
  onboarding: {
    age: `• العمر: \${updatedUser.age} سنوات
`,
    age2: `عمرك: \${age} سنوات
`,
    age3: `العمر: \${age} سنوات
`,
    ageRestriction: `❌ نأسف، يجب أن يكون عمرك على الأقل 18 عامًا لاستخدام هذه الخدمة.

`,
    agreeTerms: `اضغط على الزر أدناه لتوضيح أنك قد قرأت ووافقت على الشروط أعلاه.`,
    'antiFraud.confirm_button': `[Translation needed: onboarding.antiFraud.confirm_button]`,
    'antiFraud.learn_button': `[Translation needed: onboarding.antiFraud.learn_button]`,
    'antiFraud.question1': `[Translation needed: onboarding.antiFraud.question1]`,
    'antiFraud.question2': `[Translation needed: onboarding.antiFraud.question2]`,
    'antiFraud.question3': `[Translation needed: onboarding.antiFraud.question3]`,
    antiFraudConfirm: `يرجى التأكيد:`,
    antiFraudFinalStep: `🛡️ الخطوة النهائية: تأكيد أمان مكافحة الاحتيال

`,
    antiFraudLearn: `📚 أريد معرفة المزيد عن معارف السلامة`,
    antiFraudPassed: `✅ تم اجتياز اختبار مكافحة الاحتيال!

`,
    antiFraudQuestion1: `1. هل تفهم مخاطر السلامة في التعارف عبر الإنترنت؟
`,
    antiFraudQuestion2: `2. هل تحمي معلوماتك الشخصية؟
`,
    antiFraudQuestion3: `3. عند مواجهة رسائل مشبوهة، هل تبقى متيقظًا؟

`,
    antiFraudQuestions: `لضمان سلامة جميع المستخدمين، يرجى تأكيد أنك تفهم ما يلي: 

`,
    antiFraudYes: `✅ نعم، أفهم وسأولي اهتمامًا للسلامة`,
    back: `⬅️ العودة`,
    birthday: `إذا كنت تعتقد أن هذا خطأ، يرجى التحقق مما إذا كان تنسيق تاريخ ميلادك صحيحًا (YYYY-MM-DD).`,
    birthday2: `يرجى إعادة إدخال تاريخ ميلادك (التنسيق: YYYY-MM-DD):

`,
    birthday3: `يرجى إدخال تاريخ ميلادك (التنسيق: YYYY-MM-DD):

`,
    birthday4: `تاريخ الميلاد: \${birthday}
`,
    birthdayCheck: `إذا كنت تعتقد أن هذه خطأ، يرجى التحقق مما إذا كانت صيغة تاريخ ميلادك صحيحة (YYYY-MM-DD).`,
    birthdayError: `❌ {error}

`,
    birthdayFormatError: `❌ صيغة تاريخ الميلاد غير صحيحة

يرجى إعادة الإدخال (الصيغة: YYYY-MM-DD):`,
    birthdayRetry: `يرجى إعادة إدخال تاريخ ميلادك (الصيغة: YYYY-MM-DD):`,
    birthdayWarning: `⚠️ لا يمكن تعديل تاريخ الميلاد بمجرد تحديده، يرجى التأكد من أنه صحيح!`,
    bloodType: `🩸 **يرجى اختيار فصيلة دمك**

`,
    'bloodType.select': `[Translation needed: onboarding.bloodType.select]`,
    complete: `يرجى إدخال 'نعم' لاستكمال الاختبار:`,
    confirm: `لحماية سلامة جميع المستخدمين، يرجى تأكيد أنك تفهم مخاطر المواعدة عبر الإنترنت.

`,
    confirm2: `🛡️ الآن يتم إجراء تحقق من الأمان لمكافحة الاحتيال

`,
    confirm3: `بعد الفهم، يرجى التأكيد:`,
    confirmBirthday: `⚠️ يرجى تأكيد معلومات عيد ميلادك:

`,
    customNickname: `[Translation needed: onboarding.customNickname]`,
    enterYes: `يرجى إدخال 'نعم' لإكمال الاختبار:`,
    errorRetry: `❌ حدث خطأ، يرجى إعادة الإدخال.`,
    gender: `• الجنس: \${updatedUser.gender}
 {updatedUser.gender === 'male' ? '男性' : '女性'} \${updatedUser.gender}`,
    'gender.female': `أنثى`,
    'gender.male': `ذكر`,
    gender2: `• الجنس: \${updatedUser.gender ===`,
    gender3: `يرجى تحديد جنسيتك:

`,
    genderFemale: `👩 أنثى`,
    genderMale: `👨 ذكر`,
    genderWarning: `⚠️ ملاحظة: لا يمكن تغيير إعداد الجنس بعد الاختيار، يرجى الاختيار بعناية!`,
    help: `سيساعدنا ذلك في العثور على شركاء محادثة أكثر ملاءمة لك～

`,
    iHaveRead: `✅ لقد قرأت وأوافق`,
    languageSelection: `🌐 **اختر اللغة**

يرجى اختيار لغتك المفضلة：`,
    lastStep: `الخطوة الأخيرة: يرجى قراءة والموافقة على شروط الخدمة لدينا

`,
    legalDocuments: `📋 الوثائق القانونية متاحة باللغة الإنجليزية فقط.

`,
    mbti: `يرجى تحديد نوع MBTI الخاص بك:

`,
    mbti2: `✍️ أنا أعرف بالفعل نوع MBTI الخاص بي`,
    message: `2. 🚨 تحديد رسائل الاحتيال
`,
    message2: `• كن حذرًا من الرسائل التي تطلب المال
`,
    nickname: `• الاسم المستعار: \${updatedUser.nickname}
`,
    nickname2: `رائع! اسمك المستعار هو: \${nickname}

`,
    nicknameError: `❌ {error}

يرجى إعادة إدخال لقبك:`,
    nicknameGood: `رائع! لقبك هو: {nickname}

`,
    notCompleted: `[Need translation: onboarding.notCompleted]`,
    nowSelectGender: `الآن يرجى اختيار جنسك:

`,
    otherUserNotFound: `❌ المستخدم الآخر غير موجود.`,
    pleaseAnswer: `❌ يرجى الإجابة على الأسئلة بجدية

`,
    pleaseComeBack: `يرجى العودة عندما تكون بالغًا!

`,
    privacyPolicy: `📋 سياسة الخصوصية
`,
    profile: `• سياسة الخصوصية: كيف نحمي معلوماتك الشخصية
`,
    profile2: `معلوماتك الشخصية:
`,
    retry: `❌ إعادة الإدخال`,
    senderInfoError: `❌ معلومات المرسل غير صحيحة.`,
    settings: `💡 نصيحة: يمكنك دائمًا استخدام أمر /mbti لتحديد أو اختبار نوع MBTI الخاص بك.

`,
    settings2: `🧠 الآن دعنا نحدد نوع شخصية MBTI الخاص بك!

`,
    settings3: `حسنًا، يمكنك تحديد MBTI لاحقًا.

`,
    settings4: `إذا لم تكن متأكدًا، يمكنك إجراء الاختبار أولاً أو تحديده لاحقًا.`,
    settings5: `🎉 تهانينا! لقد أكملت جميع الإعدادات!

`,
    settings6: `• لا يمكن تغيير تاريخ الميلاد بعد الإعداد
`,
    settings7: `كيف تود تحديده؟`,
    short: `⏭️ تحدث لاحقًا`,
    start: `قبل أن تبدأ في الاستخدام، يرجى قراءة والموافقة على شروط الخدمة لدينا:

`,
    start2: `يمكنك الآن بدء استخدام XunNi!`,
    startRegistration: `[Translation needed: onboarding.startRegistration]`,
    stats: `📊 الإحصائيات`,
    stepAntiFraud: `🛡️ يرجى النقر على الزر أعلاه لتأكيد مسائل الأمان ضد الاحتيال`,
    stepBirthday: `📅 يرجى إدخال تاريخ ميلادك (بصيغة: YYYY-MM-DD، على سبيل المثال، 1995-06-15)`,
    stepDefault: `يرجى اتباع التعليمات لإكمال التسجيل`,
    stepGender: `👤 يرجى النقر على الزر أعلاه لاختيار جنسك.`,
    stepLanguageSelection: `🌍 يرجى النقر على الزر أعلاه لاختيار لغتك`,
    stepMbti: `🧠 يرجى النقر على الزر أعلاه لاختيار إعدادات MBTI الخاصة بك`,
    stepNickname: `✏️ يرجى إدخال اسم مستعار`,
    stepTerms: `📜 يرجى النقر على الزر أعلاه للموافقة على شروط الخدمة`,
    'terms.agree_button': `[Translation needed: onboarding.terms.agree_button]`,
    'terms.english_only_note': `[Translation needed: onboarding.terms.english_only_note]`,
    'terms.privacy_policy_button': `[Translation needed: onboarding.terms.privacy_policy_button]`,
    'terms.terms_of_service_button': `[Translation needed: onboarding.terms.terms_of_service_button]`,
    termsOfService: `📋 اتفاقية المستخدم

`,
    text: `تأكيد تاريخ الميلاد \${birthday}`,
    text10: `على سبيل المثال: 1995-06-15

`,
    text11: `🛡️ نصائح السلامة في المواعدة عبر الإنترنت

`,
    text12: `📋 الخطوة الأخيرة: شروط الخدمة

`,
    text13: `• اختر مكانًا عامًا للاجتماع الأول
`,
    text14: `1. 🔒 احمِ المعلومات الشخصية
`,
    text15: `• لا تشارك المعلومات المالية

`,
    text16: `• لا تنقر على الروابط المشبوهة

`,
    text17: `• أخبر صديقًا عن خططك

`,
    text18: `3. 🤝 مواعدة آمنة
`,
    text19: `📋 اتفاقية المستخدم

`,
    text2: `💡 يمكنك استخدام الأمر /mbti في أي وقت لإعادة إجراء الاختبار أو تعديله.`,
    text20: `يرجى العودة بعد الوصول لسن الرشد!

`,
    text21: `📋 سياسة الخصوصية
`,
    text3: `gender_confirm_\${gender}`,
    text4: `الخطوة النهائية: يرجى قراءة والموافقة على شروط الخدمة الخاصة بنا

`,
    text5: `📝 قم بإجراء اختبار سريع (12 سؤالاً، للرجوع إليه فقط)`,
    text6: `• شروط الاستخدام: لوائح استخدام هذه الخدمة

`,
    text7: `انقر على الزر أدناه للإشارة إلى أنك قرأت ووافقت على الشروط المذكورة أعلاه.`,
    text8: `• لا تفصح بسهولة عن اسمك الحقيقي أو عنوانك أو رقم هاتفك
`,
    text9: `• يجب أن تكون لديك 18 عامًا على الأقل لاستخدام هذه الخدمة`,
    understandRisks: `لحماية سلامة جميع المستخدمين، يرجى تأكيد أنك تفهم مخاطر المواعدة عبر الإنترنت.

`,
    viewPrivacyPolicy: `📋 عرض سياسة الخصوصية`,
    viewTermsOfService: `📋 عرض شروط الخدمة`,
    vip: `💡 ملء نوع دمك يمكن أن يُستخدم في ميزات المطابقة المستقبلية لأنواع الدم (حصري لعملاء VIP)

`,
    welcome: `[ترجمة مطلوبة: onboarding.welcome]`,
    yourAge: `عمرُك: {age} سنة
`,
    zodiac: `• علامة زودياك: \${updatedUser.zodiac_sign}
`,
    zodiac2: `علامة زودياك: \${zodiacSign}

`,
  },
  profile: {
    activatedInvites: `✅ الدعوات المُفعلة: {successfulInvites} / {inviteLimit} شخص
`,
    age: `🎂 العمر: \${age}
`,
    anonymousUser: `مستخدم مجهول`,
    bloodType: `🩸 نوع الدم: \${bloodType}
`,
    bottle: `: permanentQuota} زجاجات رسائل

`,
    cardAge: `{age} سنة`,
    cardBio: `📝 المقدمة:
{bio}

`,
    cardFooter: `💡 هذه هي بطاقة الملف الشخصي التي تعرضها للآخرين في الدردشة

`,
    cardGenderFemale: `♀️ أنثى`,
    cardGenderMale: `♂️ ذكر`,
    cardInterests: `🏷️ الاهتمامات: {interests}

`,
    cardLanguage: `🌍 اللغة: {language}

`,
    cardMbti: `🧠 MBTI: {mbti}
`,
    cardSeparator: `━━━━━━━━━━━━━━━━
`,
    cardTitle: `┌─────────────────────────┐
│ 📇 بطاقة الملف الشخصي │
└─────────────────────────┘

`,
    cardZodiac: `⭐ برج: {zodiac}
`,
    completeOnboarding: `⚠️ يرجى إكمال عملية التسجيل أولاً.

استخدم /start للمتابعة في التسجيل.`,
    conversation: `💡 هذه هي بطاقة المعلومات التي تُظهرها للآخرين في الحديث

`,
    editProfile: `📝 تعديل الملف الشخصي`,
    gender: `👤 الجنس: \${gender}
`,
    hints: `💡 نصيحة:
`,
    invite: `⏳ الدعوات في انتظار التفعيل: \${inviteStats.pending} شخص
`,
    invite2: `🎁 **معلومات الدعوة**

`,
    inviteCodeLabel: `📋 رمز دعوتك: \`{inviteCode}\`
`,
    manual: `الإعدادات اليدوية`,
    mbti: `• استخدم /mbti لإعادة أخذ أو تعديل MBTI
`,
    mbtiWithSource: `🧠 MBTI: {mbti}{source}
`,
    message: `https://t.me/share/url?url=https://t.me/\${botUsername}?start=invite_\${inviteCode}&text=تعال إلى XunNi وارمِ زجاجة رسائل معًا!🍾 استخدم رمز الدعوة الخاص بي: \${inviteCode} https://t.me/share/url?url=https://t.me/\${botUsername}?start=invite_\${inviteCode}&text=來`,
    message2: `\${!user.is_vip && successfulInvites >= inviteLimit ? '⚠️ تم الوصول إلى حد دعوات المستخدمين المجانيين، قم بالترقية إلى VIP لإلغاء قفل حد 100 دعوة!' : ''}

`,
    message3: `🌍 اللغة: \${user.language_pref}

`,
    message4: `🌍 اللغة: \${user.language_pref}
`,
    message5: `📈 معدل التحويل: \${inviteStats.conversionRate}%
`,
    message6: `\${gender} • \${age} سنوات • \${city}

`,
    message7: `https://t.me/share/url?url=https://t.me/\${botUsername}?start=invite_\${inviteCode}&text=تعال إلى XunNi وارمِ زجاجة رسائل معًا https://t.me/share/url?url=https://t.me/\${botUsername}?start=invite_\${inviteCode}&text=來`,
    mysterious: `هذه الشخص غامض جدًا، ولا يترك شيئًا وراءه～`,
    nickname: `📛 اللقب: \${displayNickname}
`,
    notSet: `غير مُحدد`,
    profile: `│ 📇 بطاقة الملف الشخصي │
`,
    profile2: `👤 **الملف الشخصي**

`,
    quota: `💡 أكمل المهام لكسب حصة يومية إضافية (استخدم /tasks للمشاهدة)
`,
    quota2: `📦 حصة يومية حالية: \${taskBonus > 0 ?`,
    quotaBottles: `{taskBonus} زجاجات`,
    quotaTotal: `📦 الحصة اليومية الحالية: {quota}

`,
    returnToMenu: `🏠 ارجع إلى القائمة الرئيسية: /menu`,
    separator: `━━━━━━━━━━━━━━━━

`,
    settings: `لم يتم تعيينه`,
    settings2: `لم يتم تعيينه`,
    settings3: `لم يتم تعيينه`,
    settings4: `لم يتم تعيينه`,
    settings5: `لم يتم تعيينه`,
    settings6: `لم يتم تعيينه`,
    settings7: `لم يتم تعيينه`,
    settings8: `غير مثبت`,
    shareInviteCode: `📤 شارك رمز الدعوة`,
    short: `📝 تحرير الملف الشخصي`,
    short2: `عضو مجاني`,
    stats: `• استخدم /stats لعرض الإحصائيات

`,
    success: `💡 مقابل كل دعوة ناجحة لشخص واحد، الحصة اليومية تزداد +1 بشكل دائم
`,
    systemError: `❌ حدث خطأ في النظام، يرجى المحاولة مرة أخرى لاحقًا.`,
    test: `نتائج الاختبار`,
    text: `• استخدم /profile_card لعرض بطاقة الملف الشخصي الكاملة
`,
    text2: `🏷️ الاهتمامات: \${interests}

`,
    text3: `💎 عضو: \${vipStatus}

`,
    text4: `📝 السيرة الذاتية:
\${bio}

`,
    text5: `هذه الشخص غامض جدًا، لا يترك شيئًا وراءه～`,
    userNotFound: `⚠️ المستخدم لا exists، يرجى التسجيل باستخدام /start أولاً.`,
    vip: `عضو VIP (تاريخ انتهاء الصلاحية: \${new Date(user.vip_expire_at).toLocaleDateString('en-US')}） {new Date(user.vip_expire_at).toLocaleDateString('zh-TW')} \${new Date(user.vip_expire_at).toLocaleDateString('zh-TW')}`,
    vip2: `• استخدم /vip لترقية إلى عضو VIP
`,
    vipUpgrade: `• قم بالترقية إلى عضو VIP باستخدام /vip
`,
    zodiac: `⭐ البرج: \${zodiac}
`,
  },
  refreshAvatar: {
    failed: `❌ فشل في تحديث الصورة الرمزية

يرجى المحاولة مرة أخرى لاحقًا أو الاتصال بالمسؤول.`,
    processing: `🔄 جارٍ تحديث الصورة الرمزية...

قد يستغرق هذا بضع ثوانٍ.`,
    success: `✅ **تم تحديث الصورة الرمزية!**

تم تحديث ذاكرة التخزين المؤقت للصورة الرمزية، وسيتم عرض الصورة الرمزية الأخيرة في المرة القادمة التي تعرض فيها سجل الدردشة.

💡 **نصيحة:**
• سيتم تحديث الصورة الرمزية تلقائيًا كل 7 أيام
• إذا قمت بتغيير صورتك الرمزية على Telegram، سيكتشف النظام ذلك تلقائيًا
• يمكنك أيضًا تحديثها يدويًا في أي وقت باستخدام هذا الأمر`,
    userNotFound: `❌ المستخدم لا exists، يرجى التسجيل أولاً`,
  },
  refreshConversations: {
    clickButtonHint: `💡 **نصيحة**: يرجى النقر على الزر أعلاه للبدء`,
    commandHelp: `• /help - عرض المساعدة`,
    commandMenu: `• /menu - القائمة الرئيسية`,
    commandTasks: `• /tasks - عرض مركز المهام`,
    failed: `❌ فشل في تحديث سجل الدردشة

يرجى المحاولة مرة أخرى لاحقًا أو الاتصال بالمسؤول.`,
    noHistory: `💡 **لم يتم العثور على سجل دردشة**

لا توجد لديك أي سجلات دردشة حتى الآن.

ابدأ الدردشة باستخدام /throw لرمي زجاجة رسائل!`,
    partialSuccess: `⚠️ **تحديث جزئي لتاريخ المحادثة**

تم التحديث بنجاح: {updated}
فشل: {failed}

قد لا يتم تحديث بعض سجلات المحادثة، يرجى المحاولة لاحقًا.`,
    processing: `🔄 جارٍ تحديث جميع سجلات الدردشة...

قد يستغرق هذا بعض الوقت، يرجى الانتظار.`,
    success: `✅ **تم تحديث تاريخ المحادثة!**

تم تحديث المنشورات التاريخية لـ {updated} محادثات بنجاح.

💡 **نصيحة:**
• يمكن لمستخدمي VIP رؤية صور الملف الشخصي الواضحة
• يرى المستخدمون المجانيون صور الملف الشخصي الضبابية
• ترقية الحساب إلى VIP ستقوم تلقائيًا بتحديث المنشورات التاريخية`,
    userNotFound: `❌ المستخدم لا exists، يرجى التسجيل أولاً`,
  },
  report: {
    blockHint: `• اضغط مطولاً على رسالة الطرف الآخر للرد /block لحظر هذا المستخدم
`,
    cancel: `❌ إلغاء`,
    cancelled: `تم الإلغاء`,
    cannotIdentify: `⚠️ غير قادر على تحديد شريك الدردشة

`,
    catchHint: `• استخدم /catch لالتقاط زجاجة رسائل جديدة`,
    completeOnboarding: `⚠️ يرجى إكمال عملية التسجيل أولاً.

استخدم /start لمتابعة التسجيل.`,
    conversationInfoError: `⚠️ معلومات المحادثة غير صحيحة.`,
    conversationInfoError2: `⚠️ معلومات المحادثة غير صحيحة`,
    conversationNotExists: `⚠️ المحادثة غير موجودة.`,
    conversationNotFound: `⚠️ لم يتم العثور على المحادثة

قد تكون المحادثة قد انتهت أو غير موجودة.`,
    ensureReply: `يرجى التأكد من أن الرد موجه إلى الرسالة المرسلة من الطرف الآخر (المعلمة برمز #).`,
    hint: `💡 سيوضح هذا الهدف بدقة للتقرير.`,
    multipleReports: `تقارير متعددة`,
    reasonHarassment: `😡 مضايقة / إساءة`,
    reasonNsfw: `🔞 محتوى للبالغين`,
    reasonOther: `⚠️ انتهاكات أخرى`,
    reasonScam: `💰 احتيال / تصيد`,
    reasonSpam: `📢 بريد عشوائي`,
    replyRequired: `⚠️ يرجى الضغط مطولاً على الرسالة التي ترغب في الإبلاغ عنها والرد بالأمر

`,
    selectReason: `يرجى اختيار سبب التقرير:`,
    sessionExpired: `⚠️ المحادثة منتهية، يرجى إجراء العملية مرة أخرى.`,
    step1: `1️⃣ اضغط مطولاً على رسالة الطرف الآخر
`,
    step2: `2️⃣ اختر 'رد'
`,
    step3: `3️⃣ أدخل /report

`,
    steps: `**خطوات العملية:**
`,
    submitted: `✅ **تم تقديم البلاغ** (#{identifier})

`,
    systemError: `❌ حدث خطأ في النظام`,
    thanks: `شكرًا على تقريرك. سنقوم بمراجعته في أقرب وقت ممكن.

`,
    tips: `💡 نصيحة:
`,
    title: `🚨 **الإبلاغ عن محتوى غير مناسب** (#{identifier})

`,
    userNotFound: `⚠️ المستخدم غير موجود. يرجى التسجيل أولاً باستخدام /start.`,
  },
  risk: {
    containsSensitiveWords: `يحتوي على كلمات حساسة`,
  },
  router: {
    replyPrompt: `💬 رد`,
    suggestCatch: `❓ هل ترغب في التقاط زجاجة رسالة؟

استخدم /catch لالتقاط زجاجة رسالة

💡 **الأوامر الشائعة**:
• /throw - رمي زجاجة رسالة
• /catch - التقاط زجاجة رسالة
• /menu - القائمة الرئيسية
• /tasks - مركز المهام`,
    suggestMenu: `❓ لم يتم العثور على الأمر

💡 **الأوامر الشائعة**: 
• /throw - إلقاء زجاجة رسائل
• /catch - التقاط زجاجة رسائل
• /menu - القائمة الرئيسية
• /tasks - مركز المهام`,
    suggestThrow: `❓ هل تريد إلقاء زجاجة رسائل؟

يرجى الضغط مطولاً على الرسالة السابقة أو هذه الرسالة،
اختر 'رد' من القائمة،
وأدخل محتوى زجاجة الرسائل لإرسالها.

💡 **الأوامر الشائعة**: 
• /throw - إلقاء زجاجة رسائل
• /catch - التقاط زجاجة رسائل
• /menu - القائمة الرئيسية
• /tasks - مركز المهام

#THROW`,
    throwPrompt: `📝 يرجى إدخال محتوى زجاجة رسائلك:`,
  },
  session: {
    timeoutCatchBottle: `⏰ انتهت مهلة عملية التقاط الزجاجة

يرجى استخدام /catch لإعادة بدء العملية.`,
    timeoutConversation: `⏰ انتهت محادثة

قد يكون الطرف الآخر قد غادر. استخدم /catch لالتقاط زجاجة جديدة!`,
    timeoutEditProfile: `⏰ انتهت مهلة عملية تعديل الملف الشخصي

يرجى إعادة بدء التعديل.`,
    timeoutOnboarding: `⏰ انتهت مهلة عملية التسجيل

يرجى استخدام /start لإعادة بدء التسجيل.`,
    timeoutThrowBottle: `⏰ انتهت مهلة عملية إلقاء الزجاجة

يرجى استخدام /throw لإعادة بدء العملية.`,
    typeCatchBottle: `عملية زجاجة الرسائل`,
    typeConversation: `المحادثة`,
    typeEditProfile: `تعديل الملف الشخصي`,
    typeOnboarding: `عملية التسجيل`,
    typeThrowBottle: `عملية إلقاء الزجاجة`,
  },
  settings: {
    back: `عودة`,
    changeLanguage: `🌐 تغيير اللغة`,
    languageLabel: `🌐 اللغة：{language}`,
    currentSettings: `⚙️ **الإعدادات الحالية**`,
    message: `🌐 **اختر اللغة / 選擇語言**

يرجى اختيار لغتك المفضلة:`,
    returnToMenu: `⬅️ العودة إلى القائمة الرئيسية`,
    selectOption: `يرجى اختيار خيار:`,
    languageUpdated: `✅ تم تحديث اللغة إلى {language}`,
    settings: `💡 اختر الإعداد الذي ترغب في تعديله:`,
    settings2: `⚙️ **الإعدادات**

`,
    settings3: `🏠 العودة إلى الإعدادات`,
    settings4: `الإعدادات الحالية：
`,
    text: `• اللغة：\${languageName} 🇹🇼

`,
    title: `🏠 **القائمة الرئيسية**`,
  },
  stats: {
    activeUsers: `• النشط بالأمس: {active}

`,
    age: `🎂 **العمر**：\${age} سنة
`,
    avgMatches: `• متوسط المطابقات لكل تجميع：\${avg} عنصر
`,
    bottle: `
💎 **إحصائيات زجاجة رسائل VIP الثلاثية** (آخر 30 يومًا)
`,
    bottle2: `🍾 **زجاجة رسائل**
`,
    bottle3: `🎈 إحصائيات زجاجة الرسائل
`,
    bottles: `🍾 **زجاجة رسائل**
`,
    bottlesCaught: `• الملتقط：\${count} عناصر
`,
    bottlesThrown: `• الملغى：\${count} عناصر
`,
    catch: `• تم اقتناصها أمس：\${stats.caughtBottles}

`,
    catch2: `• الزجاجات المقتنصة：\${stats.bottlesCaught}
`,
    caught: `• التقاط بالأمس: {caught}

`,
    conversation: `• المحادثات النشطة：\${stats.activeConversations}
`,
    conversation2: `• إجمالي المحادثات：\${stats.totalConversations}
`,
    conversation3: `• إجمالي المحادثات：\${stats.totalConversations}`,
    conversation4: `💬 **المحادثات**
`,
    conversation5: `💬 إحصائيات المحادثات
`,
    conversations: `💬 **المحادثات**
`,
    conversationsActive: `• المحادثات النشطة：\${count}
`,
    conversationsTotal: `• إجمالي المحادثات：\${count}
`,
    date: `التاريخ: {date}

`,
    dateFormatError: `خطأ في تنسيق التاريخ، يجب أن يكون YYYY-MM-DD`,
    match: `🎯 **المطابقة**
`,
    matchRate: `• معدل نجاح المطابقة：\${rate}%
`,
    matchRateValue: `• معدل التجميع：\${rate}%
`,
    matchedSlots: `• المطابقات الناجحة：\${count}
`,
    mbti: `🧠 **MBTI**：\${mbti}
`,
    message: `• تاريخ انتهاء الصلاحية：\${new Date(user.vip_expire_at!).toLocaleDateString('zh-TW')}
`,
    message10: `• إجمالي الرسائل: \${stats.totalMessages}`,
    message2: `\${used}/\${permanentQuota}+\${taskBonus} (المتبقي \${remaining})`,
    message3: `وقت إنشاء التقرير: \${new Date().toLocaleString('zh-TW')}`,
    message4: `\${used}/\${permanentQuota} (المتبقي \${remaining})`,
    message5: `• إجمالي الرسائل: \${stats.totalMessages}

`,
    message6: `• الرسائل الجديدة أمس: \${stats.newMessages}

`,
    message7: `• إجمالي الفتحات المطابقة: \${vipStats.totalSlots}
`,
    message8: `• متوسط نسبة الرد: \${stats.replyRate}%

`,
    message9: `• النشطون أمس: \${stats.activeUsers}

`,
    messages: `💬 إحصائيات المحادثة`,
    messagesTotal: `• إجمالي الرسائل：\${count}
`,
    new: `• الجديد بالأمس: {new}`,
    newMessages: `• الرسائل الجديدة بالأمس: {new}

`,
    newUsers: `• الجديد بالأمس: {new}`,
    newVip: `• الجديد بالأمس: {new}

`,
    notSet: `غير محدد`,
    quota: `• حصة اليوم: \${stats.todayQuota.display}

`,
    register: `📅 **وقت التسجيل**: \${new Date(user.created_at).toLocaleDateString('zh-TW')}
`,
    register2: `• إجمالي التسجيلات: \${stats.totalUsers}`,
    registerTime: `📅 **وقت التسجيل**: \${date}
`,
    replyRate: `• معدل الاستجابة المتوسط: \${rate}%
`,
    reportTime: `وقت إنشاء التقرير: {time}`,
    separator: `---
`,
    settings: `🧠 **MBTI**: \${user.mbti_result}

 {user.mbti_result || '未設定'} \${user.mbti_result}`,
    settings2: `غير محدد`,
    short: `عضو مجاني`,
    statDateEmpty: `لا يمكن أن يكون تاريخ الإحصائيات فارغًا`,
    stats: `📊 **إحصائياتي**

`,
    stats2: `💎 إحصائيات VIP
`,
    stats3: `👥 إحصائيات المستخدمين
`,
    stats4: `لا يمكن أن تكون تاريخ الإحصائيات فارغًا`,
    success: `• المطابقات الناجحة: \${vipStats.matchedSlots}
`,
    success2: `• معدل نجاح المطابقة: \${stats.matchRate}%
`,
    text: `• متوسط المطابقات لكل زوج: \${avgMatches} كائنات
`,
    text10: `🎯 **المطابقة**
`,
    text2: `• جديدة البارحة: \${stats.newBottles}
`,
    text3: `• الإجمالي: \${stats.totalBottles}`,
    text4: `• عدد المستخدمين الجدد البارحة: \${stats.newUsers}
`,
    text5: `• عدد الـ VIP الجدد البارحة: \${stats.newVip}

`,
    text6: `• معدل المطابقة: \${matchRate}%
`,
    text7: `📊 تقرير بيانات يومية لزجاجة رسائل XunNi
`,
    text8: `تنسيق التاريخ غير صحيح، يجب أن يكون YYYY-MM-DD`,
    text9: `التاريخ: \${dateStr}

`,
    throw: `• التي تم رميها: \${stats.bottlesThrown} زجاجة
`,
    throw2: `• عدد الرميات: \${vipStats.throws}
`,
    throws: `• عدد الرميات: \${count}
`,
    timeLeftDaysHours: `\${days} أيام \${hours} ساعات`,
    timeLeftHours: `\${hours} ساعات`,
    title: `📊 **إحصائياتي**

`,
    todayQuota: `• الحصة اليومية: \${display}

`,
    total: `• الإجمالي: {total}`,
    totalConversations: `• إجمالي المحادثات: {total}`,
    totalMessages: `• إجمالي الرسائل: {total}`,
    totalSlots: `• إجمالي الأماكن المتطابقة: \${count}
`,
    totalUsers: `• إجمالي التسجيلات: {total}`,
    totalVip: `• إجمالي النخبة: {total}`,
    totalWithDiff: `• الإجمالي: {total} ({diff})`,
    users: `👥 إحصائيات المستخدم`,
    vip: `⭐ **حالة VIP**
`,
    vip2: `⭐ **حالة VIP**
`,
    vip3: `عضو VIP 💎`,
    vipAvgMatches: `• متوسط المطابقات لكل اقتران: {avg}`,
    vipExpire: `• وقت انتهاء الصلاحية: \${date}
`,
    vipFree: `عضو مجاني`,
    vipMatchRate: `• معدل المطابقة: {rate}%`,
    vipMatchedSlots: `• المطابقات الناجحة: {count}`,
    vipMember: `عضو VIP 💎`,
    vipThrows: `• عدد الرميات: {count}`,
    vipTotalSlots: `• إجمالي الأماكن المتطابقة: {count}`,
    vipTriple: `💎 **إحصائيات زجاجة الرسائل الثلاثية VIP** (آخر \${days} أيام)`,
    vipTripleTitle: `💎 **إحصائيات زجاجة الرسائل الثلاثية VIP** (آخر {days} أيام)`,
    zodiac: `🔮 **برجك**: \${zodiac}
`,
  },
  status: {
    cancelled: `ملغاة`,
    completed: `تم`,
    failed: `فشل`,
    pending: `معلق`,
    sending: `إرسال`,
  },
  subscription: {
    downgradedToFree: `تم استعادة حسابك إلى عضوية مجانية.`,
    expired: `😢 **انتهت فترة اشتراك VIP**`,
    expiredDate: `انتهت صلاحية اشتراك VIP الخاص بك في \${date}.`,
    renewVipHint: `💡 يمكنك الاشتراك في VIP في أي وقت: /vip`,
    thankYou: `شكرًا لدعمك! ❤️`,
  },
  success: {
    ad: `✅ لقد قمت بمشاهدة جميع الإعلانات الرسمية!`,
    ad2: `✅ تم تفعيل مزود الإعلانات: \${providerName}

`,
    ad3: `✅ تم تعطيل مزود الإعلانات: \${providerName}

`,
    ad4: `✅ تم تفعيل الإعلان الرسمي #\${adId}

`,
    ad5: `✅ تم تعطيل الإعلان الرسمي #\${adId}

`,
    ad6: `✅ تم ضبط أولوية مزود الإعلان

`,
    ad7: `✅ تم الوصول إلى حد الإعلان اليومي`,
    appeal: `✅ تم الموافقة على الاستئناف \${appealId}، المستخدم غير محظور`,
    appeal2: `✅ تم رفض الاستئناف \${appealId}`,
    appeal3: `✅ لا توجد استئنافات معلقة`,
    birthday: `✅ تم حفظ تاريخ الميلاد`,
    bloodType: `✅ تم تحديث فصيلة الدم إلى \${getBloodTypeDisplay(bloodType as any)}`,
    bloodType2: `✅ تم مسح فصيلة الدم`,
    bottle: `✅ تم توزيع المكافآت! +1 زجاجة رسائل`,
    bottle2: `✅ ابدأ زجاجة رسائل جديدة`,
    bottle3: `✅ تم إنشاء زجاجة رسائل
`,
    broadcast: `✅ تم مسح \${ids.length} بث عالق

`,
    broadcast2: `✅ لا توجد بثوث لتنظيفها

`,
    broadcast3: `✅ تم إنشاء فلتر للبث

`,
    broadcast4: `✅ تم إنشاء البث

`,
    cancel: `✅ تم إلغاء البث

`,
    complete: `✅ اكتمل معالجة قائمة الانتظار للبث

`,
    complete2: `✅ تم الانتهاء من صيانة النظام

`,
    complete3: `✅ تم الانتهاء من البرنامج التعليمي!`,
    complete4: `✅ **اكتمل تحديث الدفعة**

`,
    complete5: `✅ **اكتمل التحديث**

`,
    complete6: `✅ تم الانتهاء من التصفية، يرجى إدخال المحتوى`,
    complete7: `✅ تم الانتهاء من التصفية`,
    confirm: `✅ تم التأكيد!`,
    confirm2: `✅ تم الانتهاء من فحص الأمان`,
    confirm3: `✅ تأكيد`,
    conversation: `✅ **تم تحديث سجل المحادثات!**

`,
    gender: `✅ تم حفظ الجنس`,
    invite: `✅ تم تفعيل الدعوات: \${successfulInvites} / \${inviteLimit} شخص
`,
    mbti: `✅ تم تحديث نوع MBTI الخاص بك إلى: **\${mbtiType}**

`,
    mbti2: `✅ تم مسح نوع MBTI الخاص بك.

`,
    mbti3: `✅ تم مسح MBTI`,
    mbti4: `✅ تم مسح اختيار MBTI`,
    mbti5: `✅ نوع MBTI الخاص بك: \${mbtiType}

`,
    message: `✅ تم إرسال الرسالة إلى \${formatIdentifier(receiverIdentifier)}

`,
    message2: `✅ تم تحديث اللغة إلى: \${getLanguageDisplay(languageCode)}`,
    message3: `✅ تم حظر المستخدم (#\${conversationIdentifier})

`,
    message4: `✅ حصلت على +\${ad.reward_quota} حصة دائمة!`,
    message5: `✅ تم اختيار \${gender} {gender === 'male' ? '男生' : gender === 'female' ? '女生' : '任何人'} \${gender}`,
    message6: `✅ تم اختيار \${bloodTypeDisplay[bloodType]}`,
    message7: `✅ تم اختيار \${ZODIAC_NAMES[zodiacSign]}`,
    message8: `✅ لقد اخترت: \${gender}

 {gender === 'male' ? '👨 男性' : '👩 女性'} \${gender}`,
    nickname: `✅ استخدام اسم Telegram المقترح: \${suggestedNickname.substring(0, 18)}`,
    nickname2: `✅ تم تحديث الاسم المستعار إلى: \${text}

`,
    register: `✅ وضع المطور: تخطي التسجيل

`,
    register2: `✅ أفهم، تابع مع التسجيل`,
    register3: `✅ تم التسجيل بنجاح!`,
    report: `✅ **تم تقديم التقرير** (#\${conversationIdentifier})

`,
    report2: `✅ تم تقديم التقرير`,
    report3: `✅ **تم الإبلاغ عن المستخدم**

`,
    report4: `✅ تأكيد التقرير`,
    report5: `✅ تم الإبلاغ`,
    reportSubmitted: `[ترجمة مطلوبة من zh-TW.ts]`,
    settings: `✅ تم تعيين MBTI إلى \${mbtiType}`,
    settings2: `✅ تم تعيين الاسم المستعار`,
    settings3: `✅ تم تعيين شروط التصفية: 

`,
    settings4: `✅ تم تعيين فصيلة الدم إلى \${getBloodTypeDisplay(bloodType as any)}`,
    settings5: `✅ تم تعيين نوع MBTI: \${mbtiType}

`,
    settings6: `✅ تم تخطي إعداد نوع الدم`,
    short: `✅ جارٍ الإرسال...`,
    short10: `✅ جارٍ التحميل...`,
    short11: `✅ 🌈 أي شخص`,
    short12: `✅ 👨 ذكر`,
    short13: `✅ 👩 أنثى`,
    short14: `✅ متابعة التعديل`,
    short15: `✅ تأكيد الحظر`,
    short16: `✅ محظور`,
    short17: `✅ لقد قرأت ووافقت`,
    short18: `✅ تم التخطي`,
    short19: `✅ استلام المكافأة`,
    short2: `✅ مواصلة تحرير المسودة`,
    short20: `✅ تحت الصيانة`,
    short3: `✅ تم حذف المسودة`,
    short4: `✅ تحقق واطلب`,
    short5: `✅ إرسال المسودة`,
    short6: `✅ تم التسجيل`,
    short7: `✅ صحيح`,
    short8: `✅ مفعل`,
    short9: `✅ نعم`,
    start: `✅ يرجى النقر على الزر لبدء المشاهدة`,
    start2: `✅ بدء اختبار سريع`,
    start3: `✅ بدء اختبار كامل`,
    start4: `✅ بدء الاختبار`,
    success: `✅ التحقق ناجح! لقد حصلت على +\${ad.reward_quota} حصص دائمة!`,
    'success.ad': `✅ لقد قمت بعرض جميع الإعلانات الرسمية!`,
    'success.ad2': `✅ تم تفعيل موفر الإعلان: \\\${providerName}

`,
    'success.ad3': `✅ تم تعطيل موفر الإعلان: \\\${providerName}

`,
    'success.ad4': `✅ تم تفعيل الإعلان الرسمي #\\\${adId}

`,
    'success.ad5': `✅ تم تعطيل الإعلان الرسمي #\\\${adId}

`,
    'success.ad6': `✅ تم تعيين أولوية موفر الإعلان

`,
    'success.ad7': `✅ تم الوصول إلى حد الإعلانات اليومي`,
    'success.appeal': `✅ تم الموافقة على الطعن \\\${appealId} ، وتم فك حظر المستخدم`,
    'success.appeal2': `✅ تم رفض الطعن \\\${appealId}`,
    'success.appeal3': `✅ لا توجد طعون قيد الانتظار`,
    'success.birthday': `✅ تم حفظ تاريخ الميلاد`,
    'success.bloodType': `✅ تم تحديث نوع الدم إلى \\\${getBloodTypeDisplay(bloodType as any)}`,
    'success.bloodType2': `✅ تم مسح فصيلة الدم`,
    'success.bottle': `✅ تم توزيع المكافأة! +1 زجاجة رسائل`,
    'success.bottle2': `✅ بدء زجاجة رسائل جديدة`,
    'success.bottle3': `✅ تم إنشاء زجاجة رسائل
`,
    'success.broadcast': `✅ تم مسح \\\${ids.length} بث متعثر

`,
    'success.broadcast2': `✅ لا توجد بثوث لمسحها

`,
    'success.broadcast3': `✅ تم إنشاء بث مرشح

`,
    'success.broadcast4': `✅ تم إنشاء بث

`,
    'success.cancel': `✅ تم إلغاء البث

`,
    'success.complete': `✅ تم الانتهاء من معالجة قائمة الانتظار للبث

`,
    'success.complete2': `✅ تم الانتهاء من صيانة النظام

`,
    'success.complete3': `✅ تم الانتهاء من الدليل!`,
    'success.complete4': `✅ **تم الانتهاء من التحديث الدفعي**

`,
    'success.complete5': `✅ **تم الانتهاء من التحديث**

`,
    'success.complete6': `✅ تم الانتهاء من التصفية، أدخل المحتوى`,
    'success.complete7': `✅ تم الإنتهاء من التصفية`,
    'success.confirm': `✅ تم التأكيد!`,
    'success.confirm2': `✅ اكتمل تأكيد الأمان`,
    'success.confirm3': `✅ تأكيد`,
    'success.conversation': `✅ **تم تحديث سجل الدردشة!**

`,
    'success.gender': `✅ تم حفظ الجنس`,
    'success.invite': `✅ تم تفعيل الدعوات: \\\${successfulInvites} / \\\${inviteLimit} شخص
`,
    'success.mbti': `✅ تم تحديث نوع MBTI الخاص بك إلى: **\\\${mbtiType}**

`,
    'success.mbti2': `✅ تم مسح نوع MBTI الخاص بك.

`,
    'success.mbti3': `✅ تم مسح MBTI`,
    'success.mbti4': `✅ تم مسح اختيار MBTI`,
    'success.mbti5': `✅ نوع MBTI الخاص بك: \\\${mbtiType}

`,
    'success.message': `✅ تم إرسال الرسالة إلى \\\${formatIdentifier(receiverIdentifier)}

`,
    'success.message2': `✅ تم تحديث اللغة إلى: \\\${getLanguageDisplay(languageCode)}`,
    'success.message3': `✅ تم حظر المستخدم (#\\\${conversationIdentifier})

`,
    'success.message4': `✅ تم كسب +\\\${ad.reward_quota} حصص دائمة!`,
    'success.message5': `✅ تم اختيار \\\\$\${gender} {gender === 'male' ? '男生' : gender === 'female' ? '女生' : '任何人'} \${gender}`,
    'success.message6': `✅ تم اختيار \\\\$\${bloodTypeDisplay[bloodType]}`,
    'success.message7': `✅ تم اختيار \\\\$\${ZODIAC_NAMES[zodiacSign]}`,
    'success.message8': `✅ لقد اخترت: \\\\$\${gender}

 {gender === 'male' ? '👨 男性' : '👩 女性'} \${gender}`,
    'success.nickname': `✅ باستخدام اسم مستخدم تلغرام: \\\\$\${suggestedNickname.substring(0, 18)}`,
    'success.nickname2': `✅ تم تحديث الاسم المستعار إلى: \\\\$\${text}

`,
    'success.register': `✅ وضع المطور: تم تخطي التسجيل

`,
    'success.register2': `✅ أفهم، متابعة التسجيل`,
    'success.register3': `✅ تم إكمال التسجيل!`,
    'success.report': `✅ **تم تقديم التقرير** (#\\\${conversationIdentifier})

`,
    'success.report2': `✅ تم تقديم التقرير`,
    'success.report3': `✅ **تم الإبلاغ عن المستخدم**

`,
    'success.report4': `✅ تأكيد التقرير`,
    'success.report5': `✅ تم الإبلاغ`,
    'success.settings': `✅ تم تعيين MBTI إلى \\\${mbtiType}`,
    'success.settings2': `✅ تم تعيين اللقب`,
    'success.settings3': `✅ تم تعيين معايير الفلترة: 

`,
    'success.settings4': `✅ تم تعيين فصيلة الدم إلى \\\${getBloodTypeDisplay(bloodType as any)}`,
    'success.settings5': `✅ تم تعيين نوع MBTI: \\\${mbtiType}

`,
    'success.settings6': `✅ تم تخطي إعداد فصيلة الدم`,
    'success.short': `✅ جارٍ الإرسال...`,
    'success.short10': `✅ جارٍ التحميل...`,
    'success.short11': `✅ 🌈 أي شخص`,
    'success.short12': `✅ 👨 ذكر`,
    'success.short13': `✅ 👩 أنثى`,
    'success.short14': `✅ متابعة التعديل`,
    'success.short15': `✅ تأكيد الحظر`,
    'success.short16': `✅ تم الحظر`,
    'success.short17': `✅ لقد قرأت ووافقت`,
    'success.short18': `✅ تم التخطي`,
    'success.short19': `✅ احصل على المكافأة`,
    'success.short2': `✅ تابع تعديل المسودة`,
    'success.short20': `✅ تحت الصيانة`,
    'success.short3': `✅ تم حذف المسودة`,
    'success.short4': `✅ تحقق واطلب`,
    'success.short5': `✅ أرسل المسودة`,
    'success.short6': `✅ مسجل`,
    'success.short7': `✅ صحيح`,
    'success.short8': `✅ مفعل`,
    'success.short9': `✅ نعم`,
    'success.start': `✅ يرجى النقر على الزر لبدء المشاهدة`,
    'success.start2': `✅ ابدأ الاختبار السريع`,
    'success.start3': `✅ ابدأ الاختبار الكامل`,
    'success.start4': `✅ ابدأ الاختبار`,
    'success.success': `✅ التحقق ناجح! لقد حصلت على +\\\${ad.reward_quota} حصص دائمة!`,
    'success.text': `✅ تعيين كـ \\\${flag} \\\${countryName}`,
    'success.text10': `✅ نعم، أفهم وسأولي اهتمامًا بالسلامة`,
    'success.text11': `✅ وضع الصيانة تم تفعيله

`,
    'success.text12': `✅ تم إيقاف وضع الصيانة

`,
    'success.text13': `✅ تحليل شخصية أكثر دقة
`,
    'success.text14': `✅ تم تخطي الدليل

`,
    'success.text15': `✅ جميع المشاركات محدثة (حالة المستخدم المجاني صحيحة)
`,
    'success.text16': `✅ **لا حاجة للتحديث**

`,
    'success.text17': `✅ تم اختيار \\\${gender ===`,
    'success.text18': `✅ تم اختيار \\\${mbtiType}`,
    'success.text19': `✅ **القواعد**:
`,
    'success.text2': `✅ تم تحديث علامات الاهتمام:

\\\${interestsStr}`,
    'success.text20': `✅ **تم حظر هذا المستخدم**

`,
    'success.text21': `✅ **تم تقديم طلب استرداد**

`,
    'success.text22': `✅ **تم الموافقة على الاسترداد**

`,
    'success.text23': `✅ لا توجد طلبات استرداد معلقة.`,
    'success.text24': `✅ جارٍ إعداد الدفع...`,
    'success.text25': `✅ تم الموافقة على الاسترداد

`,
    'success.text26': `✅ تم رفض الاسترداد

`,
    'success.text27': `✅ لقد انضممت وحصلت على مكافآتي.`,
    'success.text28': `✅ لقد اخترت:\\\${gender ===`,
    'success.text29': `✅ اختبار مكافحة الاحتيال تم بنجاح!

`,
    'success.text3': `✅ تم تحديث تفضيلات المطابقة إلى:\\\${prefText}

`,
    'success.text30': `✅ تم تغيير اللغة إلى \\\${newLanguageName}`,
    'success.text4': `✅ تم تحديث الملف الشخصي!

\\\${text}`,
    'success.text5': `✅ وضع التطوير: تم إعادة تعيين البيانات

`,
    'success.text6': `✅ تم تحديث المنطقة إلى: \\\${text}`,
    'success.text7': `✅ فهم أنماط الشخصية الأساسية بسرعة

`,
    'success.text8': `✅ **تم تحديث الصورة الرمزية!**

`,
    'success.text9': `✅ موصى به لإعادة الاختبار

`,
    'success.vip': `✅ جميع المنشورات محدثة (حالة VIP صحيحة)
`,
    'success.zodiac': `✅ تم مسح اختيار الابراج`,
    success2: `🎉 **التحقق ناجح!**

✅ تم استلام **+\${ad.reward_quota} حصة دائمة**
💎 شكرًا لانضمامك إلى مجتمعنا!

📊 **حصتك:**
• حصة أساسية: \${user.is_vip ? 'غير محدودة' : '10'}/يوم
• حصة دائمة: +\${ad.reward_quota}

💡 في المجتمع، يمكنك:
• التواصل مع المستخدمين الآخرين
• الحصول على آخر تحديثات الميزات
• المشاركة في الأنشطة لكسب المزيد من المكافآت {user.is_vip ? '無限' : '10'} \${user.is_vip ? '無限' : '10'}`,
    success3: `تم تحديث \${result.updated} منشورات سجلات المحادثات بنجاح.

`,
    success4: `تم تحديث: \${result.updated} منشورات بنجاح
`,
    text: `✅ تم تعيينها على \${flag} \${countryName}`,
    text10: `✅ نعم، أفهم وسأولي اهتمامًا للسلامة`,
    text11: `✅ وضع الصيانة مفعل

`,
    text12: `✅ وضع الصيانة معطل

`,
    text13: `✅ تحليل شخصية أكثر دقة
`,
    text14: `✅ تم تخطي البرنامج التعليمي

`,
    text15: `✅ جميع المنشورات محدثة (حالة المستخدم المجاني دقيقة)
`,
    text16: `✅ **لا داعي للتحديث**

`,
    text17: `✅ تم اختيار \${gender ===`,
    text18: `✅ تم اختيار \${mbtiType}`,
    text19: `✅ **القواعد**:
`,
    text2: `✅ تم تحديث علامات الاهتمام: 

\${interestsStr}`,
    text20: `✅ **تم حظر هذا المستخدم**

`,
    text21: `✅ **تم تقديم طلب استرداد**

`,
    text22: `✅ **تمت الموافقة على الاسترداد**

`,
    text23: `✅ لا توجد طلبات استرداد معلقة.`,
    text24: `✅ يتم التحضير للدفع...`,
    text25: `✅ تمت الموافقة على الاسترداد

`,
    text26: `✅ تم رفض الاسترداد

`,
    text27: `✅ لقد انضممت وحصلت على المكافأة`,
    text28: `✅ انت اخترت: \${gender ===`,
    text29: `✅ تم اجتياز اختبار مكافحة الاحتيال!

`,
    text3: `✅ تم تحديث تفضيلات المطابقة إلى: \${prefText}

`,
    text30: `✅ تم تغيير اللغة إلى \${newLanguageName}`,
    text4: `✅ تم تحديث الملف الشخصي!

\${text}`,
    text5: `✅ وضع المطور: تم إعادة تعيين البيانات

`,
    text6: `✅ تم تحديث المنطقة إلى: \${text}`,
    text7: `✅ فهم أنماط الشخصية الأساسية بسرعة

`,
    text8: `✅ **تم تحديث الصورة الشخصية!**

`,
    text9: `✅ موصى به لإعادة الاختبار

`,
    vip: `✅ جميع المنشورات محدثة (حالة VIP صحيحة)
`,
    zodiac: `✅ تم مسح اختيار الابراج`,
  },
  target: {
    all: `جميع المستخدمين`,
    nonVip: `المستخدمون غير VIP`,
    unknown: `غير معروف`,
    vip: `المستخدمون VIP`,
  },
  tasks: {
    bottle: `المكافأة: +\${task.reward_amount} زجاجة رسائل (\${task.reward_type})

 {task.reward_type === 'daily' ? '當天有效' : '永久有效'} \${task.reward_type}`,
    bottle2: `المكافأة: +\${task.reward_amount} زجاجة رسائل (\${task.reward_type ===`,
    bottle3: `\${icon} \${task.name} (+\${task.reward_amount} زجاجة رسائل)
`,
    bottle4: `• مكافأة دائمة: \${inviteProgress.current} زجاجة رسائل (تصدر يومياً)
`,
    bottle5: `• مكافأة لمرة واحدة: \${todayRewardCount} زجاجة رسائل (صالحة لليوم)
`,
    bottle6: `📋 **مركز المهام**

أكمل المهام لكسب زجاجات رسائل إضافية!

`,
    'description.bio': `اكتب قصتك (لا تقل عن 20 كلمة)`,
    'description.city': `ابحث عن أصدقاء في مدينتك`,
    'description.first_bottle': `ابدأ رحلتك الاجتماعية`,
    'description.first_catch': `شاهد قصص الآخرين`,
    'description.first_conversation': `قم بعمل اتصالك الأول (اضغط طويلاً على الرسالة → اختر 'رد')`,
    'description.interests': `دع الآخرين يعرفون المزيد عنك`,
    'description.invite_progress': `احصل على +1 حصة يومية دائمة لكل شخص تتم دعوته (مجانية حتى 10 أشخاص، VIP حتى 100 شخص)`,
    'description.join_channel': `احصل على آخر الأخبار والفعاليات`,
    invite: `🔄 ادعُ الأصدقاء (\${inviteProgress.current}/\${inviteProgress.max})
`,
    invite2: `احصل على +1 حصة يومية دائمة لكل شخص تتم دعوته
`,
    message: `\${icon} \${task.name} \${status} (+\${task.reward_amount} زجاجة رسائل)
`,
    message2: `اضغط على الزر أدناه للانضمام إلى القناة الرسمية لـ XunNi للحصول على آخر الأخبار والفعاليات!

`,
    'name.bio': `أكمل ملفك الشخصي`,
    'name.city': `حدد منطقتك`,
    'name.first_bottle': `ارسل زجاجة رسائل الأولى لك`,
    'name.first_catch': `التقط زجاجة رسائل الأولى لك`,
    'name.first_conversation': `ابدأ محادثتك الأولى`,
    'name.interests': `املأ علامات اهتماماتك`,
    'name.invite_progress': `دعوة الأصدقاء`,
    'name.join_channel': `انضم للقناة الرسمية`,
    profile: `👤 **مهام الملف الشخصي** (\${completedCount}/\${profileTasks.length})
`,
    quota: `الحصة اليومية الحالية: \${calculateDailyQuota(user)} عناصر
`,
    short: `(في انتظار الجمع)`,
    short2: `صالح لليوم`,
    short3: `صالح بشكل دائم`,
    task: `• مهام الدعوة: \${inviteProgress.current}/\${inviteProgress.max} قيد التقدم

`,
    task2: `📱 **مهام وسائل التواصل الاجتماعي** (\${completedCount}/\${socialTasks.length})
`,
    task3: `🎯 **مهام العمل** (\${completedCount}/\${actionTasks.length})
`,
    task4: `• مهام لمرة واحدة: \${oneTimeCompleted}/\${oneTimeTotal} مكتملة
`,
    task5: `🎉 تهانينا على إكمال المهمة "\${task.name}"!

`,
    task6: `👥 **مهام الدعوة** (جارية)
`,
    task7: `💡 استخدم /tasks لعرض مركز المهام`,
    text: `بعد الانضمام، انقر على زر "لقد انضممت" للمطالبة بمكافأتك 🎁`,
    text2: `📢 **انضم للقناة الرسمية**

`,
    text3: `📊 **التقدم العام**
`,
    text4: `🎁 **تم الحصول عليه**
`,
  },
  throw: {
    age: `• نطاق عمر مشابه ✓`,
    back: `↩️ العودة إلى قائمة الفلاتر`,
    bloodType: `🩸 **فلتر نوع الدم**

`,
    bloodType2: `• نوع الدم: تصفية حسب نوع الدم المحدد
`,
    bloodType3: `اختر نوع الدم الذي تريد المطابقة به:`,
    bloodType4: `🩸 تصفية نوع الدم`,
    bloodType5: `🌈 أي نوع من الدم`,
    bottle: `
💡 زجاجة الرسائل هذه تناسبك تماماً!
\${highlights.join('
')}
`,
    bottle10: `🍾 تم رمي زجاجة الرسائل!

`,
    bottle11: `🍾 أرسل زجاجة رسائل`,
    bottle2: `🎯 تم إرسال زجاجة الرسائل الخاصة بك إلى **3 مستلمين**: 
`,
    bottle3: `🍾 **يتم رمي زجاجة الرسائل الخاصة بك...**

`,
    bottle4: `🍾 **رم زجاجة الرسائل** #THROW

`,
    bottle5: `معرّف الزجاجة: #\${bottleId}

`,
    bottle6: `📝 **يرجى إدخال محتوى زجاجة الرسائل الخاصة بك**

`,
    bottle7: `1️⃣ انقر على الزر أدناه '🍾 رم زجاجة الرسائل'
`,
    bottle8: `📝 يرجى إدخال محتوى زجاجة الرسائل الخاصة بك: 

`,
    bottle9: `📝 يرجى إدخال محتوى زجاجة رسائلك:`,
    cancel: `💡 انقر للاختيار أو إلغاء نوع MBTI:`,
    cancel2: `💡 انقر للاختيار أو إلغاء برجك:`,
    catch: `• الفتحة 3: بركة عامة (في انتظار الالتقاط)

`,
    catch2: `• الفتحة 2: بركة عامة (في انتظار الالتقاط)
`,
    catch3: `• الفتحة 1: بركة عامة (في انتظار الالتقاط)
`,
    catch4: `🌊 في انتظار لقاء مصيري...
`,
    complete: `⚙️ **فلتر متقدم**

\${summary}
💡 تابع لضبط الفلتر أو إكماله:`,
    complete2: `🎯 **تم الانتهاء من المباراة الأولى:**
`,
    complete3: `📝 لديك مسودة غير مكتملة

`,
    complete4: `⏳ الوقت المتوقع للإكمال 3-5 ثواني`,
    complete5: `⏳ الوقت المتوقع للإكمال 2-3 ثواني`,
    complete6: `⏳ الوقت المتوقع للإكمال 1-2 ثواني`,
    conversation: `💬 معرّف المحادثة: \${vipMatchInfo.conversationIdentifier}

`,
    conversation2: `💡 نصيحة: كل محادثة مستقلة ويمكن أن تحدث في وقت واحد

`,
    conversation3: `💡 يمكنك تلقي **ما يصل إلى 3 محادثات**!
`,
    conversation4: `💬 يمكنك تلقي **ما يصل إلى 3 محادثات**!
`,
    conversation5: `استخدم /chats لعرض جميع المحادثات

`,
    conversation6: `📊 استخدم /chats لعرض جميع المحادثات`,
    conversation7: `استخدم /chats لعرض جميع المحادثات`,
    currentSelection: `الاختيار الحالي: {genderText}`,
    friendlyContent: `[ترجمة مطلوبة من zh-TW.ts]`,
    gender: `• الجنس: \${selectedGender}
`,
    gender2: `👤 **فلتر الجنس**

`,
    gender3: `• الجنس: تصفية حسب الجنس

`,
    gender4: `💡 اختر الجنس الذي تفضله:`,
    gender5: `👤 فلتر الجنس`,
    genderLabel: `• الجنس: {gender}
`,
    mbti: `• MBTI: \${selectedMBTI.length > 0 ? selectedMBTI.join(', ') : 'لا حدود'}
 {selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '無限制'} \${selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '無限制'}`,
    mbti2: `المحدد: \${selectedMBTI.length > 0 ? selectedMBTI.join(', ') : 'لا شيء'}

 {selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '無'} \${selectedMBTI.length > 0 ? selectedMBTI.join(', ') : '無'}`,
    mbti3: `المحدد: \${selectedMBTI.length > 0 ? selectedMBTI.join(`,
    mbti4: `🧠 **فلتر MBTI**

`,
    mbti5: `• MBTI: تصفية حسب أنواع الشخصية المحددة
`,
    mbti6: `• توافق عالي مع MBTI ✓`,
    mbti7: `🧠 فلتر MBTI`,
    mbtiLabel: `• MBTI: {mbti}
`,
    message: `المحدد: \${selectedZodiac.length > 0 ? selectedZodiac.map((z) => ZODIAC_NAMES[z]).join(', ') : 'لا شيء'}

`,
    message2: `الاختيار الحالي: \${currentGender}

`,
    message3: `المحدد: \${selectedZodiac.length > 0 ? selectedZodiac.map((z) => ZODIAC_NAMES[z]).join(`,
    message4: `الاختيار الحالي: \${bloodTypeDisplay[currentBloodType]}

`,
    message5: `👤 الخصم: \${vipMatchInfo.matcherNickname}
`,
    message6: `"مرحبًا! أنا أحب الموسيقى والأفلام، أبحث عن أصدقاء يشاركوني الاهتمامات~"

`,
    message7: `💡 يمكن تعديل تفضيلات المطابقة في /edit_profile

`,
    message8: `💬 اضغط /reply لبدء الدردشة
`,
    nickname: `📝 لقب الخصم: \${matchedUserMaskedNickname}
`,
    quota: `• المزيد من الحصص (30 في اليوم)
`,
    quota2: `🎁 ادعُ أصدقاءك لزيادة حصتك:
`,
    settings: `🧠 MBTI: \${matchResult.user.mbti_result}
 {matchResult.user.mbti_result || '未設定'} \${matchResult.user.mbti_result}`,
    settings2: `⭐ برج: \${matchResult.user.zodiac}
 {matchResult.user.zodiac || '未設定'} \${matchResult.user.zodiac}`,
    settings3: `🧠 MBTI: \${user.mbti_result}
 {user.mbti_result || '未設定'} \${user.mbti_result}`,
    settings4: `⭐ برج: \${user.zodiac_sign}
 {user.zodiac_sign || '未設定'} \${user.zodiac_sign}`,
    settings5: `غير محدد`,
    settings6: `غير محدد`,
    settings7: `غير محدد`,
    settings8: `غير محدد`,
    short: `• نفس اللغة ✓`,
    short10: `♋ سرطان`,
    short11: `♌ ليو`,
    short12: `♍ عذراء`,
    short13: `♎ ميزان`,
    short14: `♏ عقرب`,
    short15: `♐ قوس`,
    short16: `♑ جبل الجدي`,
    short17: `♒ دلو`,
    short18: `♓ حوت`,
    short19: `انتهاك`,
    short2: `🩸 نوع AB`,
    short20: `غير محدود`,
    short21: `غير محدود`,
    short22: `غير محدود`,
    short23: `غير محدود`,
    short3: `🌈 أي شخص`,
    short4: `🩸 نوع A`,
    short5: `🩸 نوع B`,
    short6: `🩸 نوع O`,
    short7: `♈ برج الحمل`,
    short8: `♉ برج الثور`,
    short9: `♊ برج الجوزاء`,
    start: `✍️ إعادة تشغيل`,
    success: `زجاجة رسالة واحدة = 3 أهداف، مما يزيد بشكل كبير من معدل النجاح في المطابقة

`,
    success2: `✨ **تم تفعيل امتيازات VIP! المطابقة الذكية ناجحة!**

`,
    success3: `🎯 تم مطابقة زجاجة رسالتك بنجاح!

`,
    text: `💝 معدل المطابقة: \${matchPercentage}%
`,
    text10: `🎯 البحث عن أفضل مطابقة لك

`,
    text11: `
💬 في انتظار رد من الطرف الآخر...
`,
    text12: `• المستخدمون المجانيون: حتى +7
`,
    text13: `• لا تتضمن معلومات الاتصال الشخصية

`,
    text14: `💡 **طريقتان للدخول**: 
`,
    text15: `📊 المستخدمون المجانيون: 3 في اليوم
`,
    text16: `اختر المعايير التي ترغب في تصفيتها: 

`,
    text17: `• تصفية متقدمة وترجمة

`,
    text18: `وقت الإنشاء: \${age}
`,
    text19: `استخدم /vip للترقية فورًا`,
    text2: `• 🆕 فرصة تعرض ثلاثية (1 مرة = 3 أهداف)
`,
    text20: `💬 **مثال**:
`,
    text21: `استخدم /vip لمعرفة المزيد`,
    text22: `هل تريد متابعة تحرير هذه المسودة؟`,
    text23: `💡 يمكنك دمج شروط متعددة`,
    text24: `شروط الفلترة الحالية:

`,
    text3: `💡 قد يستغرق ذلك بضع ثوان، نحن نبحث عن الأشخاص الأنسب لك`,
    text4: `الاختيار الحالي: \${currentGender ===`,
    text5: `🎯 البحث عن: \${targetText}
`,
    text6: `🎯 العثور على 3 تطابقات ممتازة لك

`,
    text7: `📨 **2 مواقع إضافية في الانتظار:**
`,
    text8: `🔍 مطابقة ذكية لأفضل المواضيع...

`,
    text9: `معاينة المحتوى: \${preview}

`,
    throw: `📊 الرسائل المرسلة اليوم: \${quotaDisplay}

`,
    tips: `[ترجمة مطلوبة من zh-TW.ts]`,
    unlimited: `غير محدود`,
    vip: `💎 مستخدمو VIP: 30 في اليوم (ثلاث مرات عرض)

`,
    vip2: `💎 **قم بالترقية إلى VIP للحصول على ثلاث مرات فرص العرض!**
`,
    vip3: `⚙️ **فلترة متقدمة (حصرية لمستخدمي VIP)**

`,
    vip4: `• مستخدمو VIP: حتى +70

`,
    vip5: `✨ **تم تفعيل امتيازات VIP!**

`,
    vip6: `💡 الترقية إلى VIP يمنحك: 
`,
    vip7: `✨ تفعيل امتيازات VIP
`,
    zodiac: `• البرج: \${selectedZodiac.length > 0 ? selectedZodiac.map((z) => ZODIAC_NAMES[z]).join(', ') : 'غير محدود'}
`,
    zodiac2: `⭐ البرج: \${matchResult.user.zodiac ||`,
    zodiac3: `⭐ البرج: \${user.zodiac_sign ||`,
    zodiac4: `⭐ **فلترة برجية**

`,
    zodiac5: `• برج: فلترة أبراج محددة
`,
    zodiac6: `• توافق الأبراج ✓`,
    zodiac7: `⭐ فلترة برجية`,
    zodiacLabel: `• برج: {zodiac}
`,
  },
  tutorial: {
    availableCommands: `يمكنك استخدام الأوامر التالية في أي وقت:`,
    catchBottle: `🎣 **التقط زجاجة رسائل**`,
    catchBottleDesc: `شاهد زجاجات رسائل الآخرين ورد إذا كنت مهتمًا لبدء المحادثة`,
    clickButtonHint: `[Needs translation: tutorial.clickButtonHint]`,
    commandCatch: `• /catch - التقاط زجاجة رسائل`,
    commandHelp: `• /help - عرض المساعدة`,
    commandMenu: `[Needs translation: tutorial.commandMenu]`,
    commandTasks: `• /tasks - عرض المهام`,
    commandThrow: `• /throw - إلقاء زجاجة رسائل`,
    completeTasksForBottles: `💡 أكمل المهام لكسب زجاجات إضافية`,
    completed: `✅ تم الانتهاء من البرنامج التعليمي!`,
    howToBecomeFriends: `💬 **كيف تصنع أصدقاء؟**`,
    howToBecomeFriendsDesc: `أنت تلتقط زجاجة وترد → الطرف الآخر يرد أيضًا → ابدأ المحادثة بشكل مجهول`,
    readyToStart: `🎉 **جاهز! دعنا نصنع أصدقاء～**`,
    skip: `تخطي`,
    skipped: `✅ تم تخطي البرنامج التعليمي`,
    startUsing: `ابدأ →`,
    throwBottle: `📦 **إلقاء زجاجة رسائل**`,
    throwBottleDesc: `اكتب مشاعرك أو أفكارك، وسيقوم النظام بمساعدتك في العثور على الأشخاص المناسبين`,
    unknownStep: `❌ خطوة البرنامج التعليمي غير معروفة`,
    viewTasks: `📋 عرض المهام`,
    welcome: `🎉 تهانينا على إكمال تسجيلك!`,
    whatIsXunNi: `🌊 **ما هو XunNi؟**`,
    whatIsXunNiDesc: `منصة زجاجة رسائل مجهولة تساعدك في العثور على أصدقاء يشاركونك الاهتمامات من خلال MBTI وعلامات الأبراج.`,
  },
  vip: {
    admin: `⏳ لديك طلب استرداد معلق. يرجى التحلي بالصبر بينما يقوم المدير بمراجعته.`,
    bottle: `📝 محتوى زجاجة الرسائل: \${bottle.content.substring(0, 50)}\${bottle.content.length > 50 ? '...' : ''}

`,
    bottle2: `📝 محتوى زجاجة الرسائل: \${bottle.content.substring(0, 50)}\${bottle.content.length > 50 ?`,
    bottle3: `تم التقاط زجاجة رسائلك من قبل \${maskedMatcherNickname}！

`,
    bottle4: `النظام وجد زجاجة رسائل من \${maskedOwnerNickname}！

`,
    bottle5: `📝 محتوى زجاجة الرسائل: \${bottle.content}

`,
    bottle6: `• 🆕 فرصة تعرض ثلاثية! إلقاء زجاجة رسائل واحدة يثير 3 أهداف
`,
    cancelReminderButton: `❌ ربما لاحقًا`,
    conversation: `💬 معرف المحادثة: \${conversationIdentifier}
`,
    conversation2: `🔄 تحديث محفوظات محادثتك، صورة الملف الشخصي الواضحة ستظهر قريبًا...

`,
    mbti: `• تصفية أهداف المطابقة حسب MBTI، علامة البرج، وفصيلة الدم
`,
    mbti2: `• تصفية أهداف المطابقة حسب MBTI وعلامة البرج
`,
    mbti3: `• تصفية حسب MBTI وعلامة البرج
`,
    message: `موعد الإنتهاء: \${new Date(sub.expire_date).toLocaleDateString('zh-TW')}

`,
    message10: `رقم الطلب: #\${result.meta.last_row_id}
`,
    message11: `مبلغ الاسترداد: \${request.amount_stars} ⭐
`,
    message12: `💬 **يرجى الضغط لمدة طويلة على هذه الرسالة، اختيار 'رد'، وإدخال محتواك لبدء المحادثة مع الطرف الآخر**`,
    message13: `💡 استخدم نجوم تلغرام للدفع بشكل آمن ومريح

`,
    message14: `💡 هذه هي المباراة الأولى لك، مع 2 مكان آخر في الانتظار

`,
    message2: `وقت الطلب: \${new Date(req.requested_at).toLocaleString('en-US')}
 {new Date(req.requested_at).toLocaleString('zh-TW')} \${new Date(req.requested_at).toLocaleString('zh-TW')}`,
    message3: `وقت الانتهاء الجديد: \${newExpire.toLocaleDateString('en-US')}

 {newExpire.toLocaleDateString('zh-TW')} \${newExpire.toLocaleDateString('zh-TW')}`,
    message4: `وقت الانتهاء: \${newExpire.toLocaleDateString('en-US')}

 {newExpire.toLocaleDateString('zh-TW')} \${newExpire.toLocaleDateString('zh-TW')}`,
    message5: `وقت الدفع: \${paymentDate.toLocaleDateString('en-US')}
 {paymentDate.toLocaleDateString('zh-TW')} \${paymentDate.toLocaleDateString('zh-TW')}`,
    message6: `📋 **طلبات الاسترداد المعلقة** (\${requests.results.length})

`,
    message7: `رقم الدفع: \${payment.telegram_payment_charge_id}`,
    message8: `السعر: \${priceStars} ⭐ نجوم تلغرام / شهر
`,
    message9: `وقت الدفع: \${paymentDate.toLocaleDateString(`,
    purchaseCancelled: `✅ تم إلغاء الشراء`,
    quota: `• حصة زجاجة رسائل واحدة 30 يومياً (ادعُ الأصدقاء لزيادة العدد، حتى 100 في اليوم)
`,
    quota2: `• حصة زجاجة رسائل واحدة 30 يومياً (حتى 100 في اليوم)
`,
    refundAdminCommands: `💡 استخدم الأوامر التالية للمعالجة: 
• الموافقة: \`/admin_approve_refund \`
• الرفض: \`/admin_reject_refund \` \`/admin_approve_refund <ID>\` \`/admin_reject_refund <ID> <原因>\``,
    refundApproved: `✅ **تمت الموافقة على الاسترداد**

المبلغ المسترد：\${amount} ⭐
سيتم إيداع الاسترداد خلال 1-3 أيام عمل.

تم إلغاء عضويتك كـ VIP.

شكرًا لتفهمك!`,
    refundApprovedAdmin: `✅ تمت الموافقة على الاسترداد

معرف الطلب：#\${requestId}
معرف المستخدم：\${userId}
المبلغ：\${amount} ⭐`,
    refundExpired: `❌ تجاوز طلب الاسترداد الحد الزمني

تاريخ الدفع: \${paymentDate}
الموعد النهائي للاسترداد: خلال 7 أيام بعد الدفع

💡 إذا كانت هناك ظروف خاصة، يرجى الاتصال بخدمة العملاء.`,
    refundFailed: `❌ فشل الاسترداد：\${error}`,
    refundNoPayment: `❌ لم يتم العثور على سجل الدفع.`,
    refundNoPending: `✅ لا توجد طلبات استرداد معلقة.`,
    refundPending: `⏳ لديك طلبات استرداد معلقة، يرجى الانتظار بصبر لمراجعة الإدارة.`,
    refundPendingList: `📋 **طلبات استرداد الأموال المعلقة** (\${count})`,
    refundReasonTooShort: `❌ يجب أن يكون سبب الاسترداد 10 أحرف على الأقل، يرجى إعادة الإدخال:`,
    refundRejected: `❌ **تم رفض طلب الاسترداد**

السبب：\${reason}

إذا كانت لديك أي أسئلة، يرجى الاتصال بخدمة العملاء.`,
    refundRejectedAdmin: `✅ تم رفض الاسترداد

معرف الطلب：#\${requestId}
معرف المستخدم：\${userId}`,
    refundRequestItem: `**#\${id}** - \${nickname}
معرف المستخدم：\`\${userId}\`
المبلغ：\${amount} ⭐
السبب：\${reason}
وقت الطلب：\${requestedAt}`,
    refundRequestNotFound: `❌ طلب الاسترداد غير موجود أو تمت معالجته`,
    refundRequestReason: `📝 **قم بتقديم طلب لاسترداد**

يرجى إدخال سبب الاسترداد (10 أحرف على الأقل):`,
    refundSubmitFailed: `❌ فشل الإرسال، يرجى المحاولة لاحقًا.`,
    refundSubmitted: `✅ **تم تقديم طلب الاسترداد**

معرف الطلب: #\${requestId}
الحالة: بانتظار المراجعة

سنعالج طلبك خلال 1-3 أيام عمل.
ستتلقى إشعاراً بالنتيجة عبر الروبوت.

شكراً لصبرك!`,
    reminderCancelled: `✅ تم إلغاء التذكير`,
    reminderDaysLeft: `ستنتهي عضويتك VIP في \${days} يوماً.`,
    reminderExpireDate: `وقت انتهاء الصلاحية: \${date}`,
    reminderExpiringToday: `⚠️ **انتهاء صلاحية VIP اليوم**`,
    reminderExpiringTodayDesc: `تنتهي عضويتك VIP اليوم.`,
    reminderGracePeriod: `📌 فترة السماح: تجديد الاشتراك خلال 3 أيام بعد انتهاء الصلاحية لن يقطع الخدمة.`,
    reminderRenewHint: `💡 جدد الآن للاستمتاع بخدمة VIP بدون انقطاع!`,
    reminderRenewHint2: `💡 جدد الآن لتواصل الاستمتاع بمزايا VIP!`,
    reminderTitle: `⏰ **تذكير بانتهاء صلاحية VIP**`,
    renewButton: `💳 قم بالتجديد الآن (\${stars} ⭐)`,
    renewalProcessing: `جارٍ معالجة التجديد...`,
    settings: `💡 لإلغاء اشتراكك، يرجى الذهاب إلى إعدادات Telegram > إدارة الاشتراكات

`,
    settings2: `💡 لإلغاء اشتراكك، يرجى الذهاب إلى إعدادات Telegram > إدارة الاشتراكات`,
    settings3: `💡 يمكنك إلغاء اشتراكك في أي وقت في إعدادات Telegram`,
    short: `(حوالي 5 دولارات أمريكية)`,
    short2: `شكراً على صبرك!`,
    short3: `شكراً لتفهمك!`,
    short4: `• معتمد: \\`,
    short5: `• مرفوض: \\`,
    start: `🚀 ابدأ الآن: /throw`,
    success: `🎯 **تمت المطابقة الذكية بنجاح!**

`,
    success2: `🎉 **تم تجديد الاشتراك تلقائيًا بنجاح!**

`,
    success3: `🎉 **تمت المطابقة الذكية بنجاح!**

`,
    success4: `🎉 **تم الاشتراك بنجاح!**

`,
    text: `- أولوية الوصول إلى ترجمة نموذج OpenAI GPT (عالية الجودة)
`,
    text10: `سنقوم بمعالجة طلبك خلال 1-3 أيام عمل.
`,
    text11: `وقت الانتهاء: \${expireDate}

`,
    text12: `سيتم استرداد المبالغ خلال 1-3 أيام عمل.

`,
    text13: `رقم الطلب: #\${requestId}
`,
    text14: `└ 1 ربط ذكي + 2 برك عامة
`,
    text15: `سيتم إبلاغك بنتيجة المعالجة عبر البوت.

`,
    text16: `يرجى إدخال سبب الاسترداد (على الأقل 10 أحرف):`,
    text17: `السبب: \${req.reason}
`,
    text18: `آخر موعد للاسترداد: خلال 7 أيام بعد الدفع

`,
    text19: `تم استعادة حسابك كمستخدم مجاني.

`,
    text2: `• ترجمة آلية بـ 34 لغة (يفضل OpenAI GPT)
`,
    text20: `💡 هل ترغب في تجديد أو ترقية؟

`,
    text21: `💡 إذا كانت هناك ظروف خاصة، يرجى الاتصال بخدمة العملاء.`,
    text22: `السبب: \${reason}

`,
    text23: `• فتح الصورة الواضحة للمستخدم الآخر 🆕
`,
    text24: `قد يستغرق هذا بضع ثوانٍ، يرجى الانتظار.`,
    text25: `📝 **طلب استرداد**

`,
    text26: `• ترجمة آلية بـ 34 لغة
`,
    text27: `💡 قم بالمعالجة باستخدام الأمر التالي: 
`,
    text28: `(سعر اختبار مرحلة التدريج)`,
    text29: `إذا كان لديك أي أسئلة، يرجى الاتصال بدعم العملاء.`,
    text3: `المبلغ: \${request.amount_stars} ⭐`,
    text30: `الحالة: بانتظار الموافقة

`,
    text4: `🔄 **التجديد التلقائي**: دفع شهري تلقائي، لا حاجة للتجديد اليدوي
`,
    text5: `المبلغ: \${req.amount_stars} ⭐
`,
    text6: `معرف المستخدم: \${request.user_id}
`,
    text7: `💳 جدد الآن (\${priceStars} ⭐)`,
    text8: `معرف المستخدم: \${request.user_id}`,
    text9: `📌 فترة السماح: التجديد خلال 3 أيام بعد انتهاء الصلاحية لن يقطع الخدمة.`,
    viewVipCommand: `يمكنك دائمًا التحقق من فوائد VIP باستخدام أمر /vip.`,
    vip: `انتهت عضويتك في VIP في \${new Date(sub.expire_date).toLocaleDateString('zh-TW')} .

`,
    vip10: `💎 **ترقية إلى عضوية VIP**

`,
    vip11: `😢 **انتهت عضوية VIP**

`,
    vip12: `ترقية إلى عضوية VIP للاستمتاع بالمزايا التالية: 
`,
    vip13: `⏰ **تذكير بإنتهاء صلاحية VIP**

`,
    vip14: `تنتهي عضويتك في VIP اليوم.

`,
    vip15: `تم تجديد اشتراكك في VIP تلقائيًا!
`,
    vip16: `تم إلغاء عضويتك في VIP.

`,
    vip17: `اشتراك XunNi VIP (شهري)`,
    vip18: `✨ تبقى مزايا VIP مفعلة: 
`,
    vip19: `لقد أصبحت عضوًا مميزًا!
`,
    vip2: `ستنتهي فترة عضويتك المميزة في \${new Date(sub.expire_date).toLocaleDateString(`,
    vip20: `✨ تم تفعيل مزايا العضوية المميزة: 
`,
    vip21: `عضوية مميزة (30 يومًا)`,
    vip22: `🎁 مزايا العضوية المميزة: 
`,
    vip23: `تجديد العضوية المميزة لـ XunNi`,
    vip24: `شراء العضوية المميزة لـ XunNi`,
    vip25: `اشتراك العضوية المميزة`,
    vip3: `ستنتهي فترة عضويتك المميزة في \${daysLeft} يومًا.

`,
    vip4: `🔄 تجديد العضوية المميزة (\${priceStars} ⭐)`,
    vip5: `💳 شراء العضوية المميزة (\${priceStars} ⭐)`,
    vip6: `اشترك في عضوية XunNi المميزة لتجديد تلقائي شهري!

`,
    vip7: `💡 جدد الآن للاستمتاع بخدمة مميزة غير منقطعة!`,
    vip8: `💡 جدد الآن لمتابعة الاستمتاع بمزايا العضوية المميزة!
`,
    vip9: `✨ **أنت بالفعل عضو مميز**

`,
  },
  vipTripleBottle: {
    bottleContent: `📝 محتوى زجاجة الرسائل: {content}

`,
    bottlePicked: `تم التقاط زجاجة رسائلك بواسطة {maskedMatcherNickname}!

`,
    conversationIdentifier: `💬 معرف المحادثة: {conversationIdentifier}
`,
    firstMatch: `💡 هذه هي المطابقة الأولى الخاصة بك، مع وجود 2 مكان آخرين في الانتظار

`,
    foundBottle: `لقد عثر النظام على زجاجة رسالة من {maskedOwnerNickname}!

`,
    matchSuccess: `🎯 **تم المطابقة الذكية بنجاح!**

`,
    replyHint: `💬 **يرجى الضغط مطولاً على هذه الرسالة، اختر 'رد', وأدخل محتواك لبدء الدردشة مع الطرف الآخر**`,
    slotsWaiting: `يوجد {remaining} مكان في الانتظار

`,
    smartMatch: `🎉 **تمت المطابقة الذكية بنجاح!**

`,
    viewChats: `استخدم /chats لعرض جميع المحادثات

`,
  },
  warning: {
    ad: `⚠️ حاليًا، لا يوجد مزودو إعلانات مُعدّون

`,
    ad2: `⚠️ حاليًا، لا توجد إعلانات رسمية

`,
    ad3: `⚠️ لا يوجد مزودو إعلانات متاحون في الوقت الحالي`,
    ad4: `⚠️ غير قادر على اختيار مزود الإعلانات`,
    ad5: `⚠️ غير قادر على عرض المزيد من الإعلانات`,
    birthday: `⚠️ حاليًا، لستم في خطوة إدخال تاريخ الميلاد`,
    bloodType: `⚠️ حاليًا، لستم في خطوة اختيار فصيلة الدم`,
    broadcast: `⚠️ تم العثور على \${stuckBroadcasts.results.length} بثوث عالقة

`,
    complete: `⚠️ يُرجى إكمال الإعلان السابق قبل البدء بإعلان جديد`,
    confirm: `⚠️ يرجى تأكيد معلومات عيد الميلاد الخاصة بك: 

`,
    conversation: `⚠️ خطأ في معلومات المحادثة.`,
    conversation10: `⚠️ المحادثة غير موجودة`,
    conversation2: `⚠️ خطأ في معلومات المحادثة`,
    conversation3: `⚠️ لا توجد لدى هذا المستخدم منشورات في سجل المحادثات
`,
    conversation4: `⚠️ لم يتم العثور على المحادثة المحددة. قد تكون قد انتهت أو انتهت صلاحيتها.`,
    conversation5: `⚠️ **تم تحديث قسم سجل المحادثات**

`,
    conversation6: `⚠️ غير قادر على التعرف على شريك المحادثة

`,
    conversation7: `⚠️ لم يتم العثور على المحادثة

`,
    conversation8: `⚠️ المحادثة غير موجودة أو انتهت`,
    conversation9: `⚠️ هذه المحادثة قد انتهت`,
    end: `⚠️ انتهت المسابقة أو لا توجد`,
    failed: `⚠️ فشل التحقق من الدفع، يرجى المحاولة مرة أخرى لاحقًا`,
    gender: `⚠️ حاليًا لست في خطوة اختيار الجنس`,
    invite: `⚠️ تعذر استرداد رمز الدعوة`,
    mbti: `⚠️ حاليًا لست في خطوة اختبار MBTI`,
    mbti2: `⚠️ نوع MBTI غير صالح`,
    message: `⚠️ تم العثور على \${outdatedPosts.length} منشورات قديمة تحتاج إلى تحديث
`,
    message2: `⚠️ ملاحظة: هذا هو \${testInfo}\${testTitle}، \${accuracy}.

`,
    message3: `⚠️ يرجى الضغط مطولًا على الرسالة التي ترغب في حظرها والرد بالأمر

`,
    message4: `⚠️ يرجى الضغط مطولًا على الرسالة التي ترغب في الإبلاغ عنها والرد بالأمر

`,
    message5: `⚠️ **الرسالة تحتوي على روابط محظورة**

`,
    register: `⚠️ لم يتم العثور على بيانات المستخدم، يرجى التسجيل أولاً باستخدام /start.`,
    register2: `⚠️ يرجى إكمال عملية التسجيل أولاً.

استخدم /start للمتابعة في التسجيل.`,
    register3: `⚠️ كانت هناك مشكلة في عملية التسجيل، يرجى إعادة التشغيل: /start`,
    register4: `⚠️ يرجى إكمال عملية التسجيل أولاً`,
    settings: `⚠️ تذكير: إعداد الجنس لن **يمكن تعديله أبدًا**!

`,
    settings2: `⚠️ تاريخ الميلاد لا يمكن تعديله بعد تحديده، يرجى التأكد من صحته!`,
    settings3: `⚠️ ملاحظة: إعداد الجنس لا يمكن تعديله بعد تحديده، يرجى الاختيار بعناية!`,
    short: `⚠️ تسلسل المشكلات غير صحيح`,
    short2: `⚠️ خيار غير معروف`,
    short3: `⚠️ طلب غير صالح`,
    short4: `⚠️ تحذير:
`,
    short5: `⚠️ انتهاكات أخرى`,
    start: `⚠️ انتهت الجلسة، يرجى إعادة البدء: /throw`,
    start2: `⚠️ انتهت فترة الجلسة، يرجى إعادة التشغيل`,
    task: `⚠️ نوع المهمة غير معروف`,
    text: `⚠️ **ملاحظة**

`,
    text10: `⚠️ **العناصر غير القابلة للتعديل**:
`,
    text11: `⚠️ انتهت فترة الجلسة، يرجى المحاولة مرة أخرى`,
    text12: `⚠️ المسودة غير موجودة أو انتهت صلاحيتها`,
    text2: `⚠️ نوع الدفع غير صالح`,
    text3: `⚠️ خدمة الترجمة غير متاحة مؤقتًا، النص الأصلي كالتالي:
`,
    text4: `⚠️ تنبيه أمني:
`,
    text5: `⚠️ حاليًا لست في خطوة اختبار مكافحة الاحتيال`,
    text6: `⚠️ حاليًا لست في خطوة شروط الخدمة`,
    text7: `⚠️ ملاحظة: هذه الميزة متاحة فقط في بيئة التجريب.`,
    text8: `⚠️ **لا يُسمح بإرسال الصور أو الفيديوهات أو المحتوى المتعدد الوسائط**

`,
    text9: `⚠️ هذه الميزة متاحة فقط في بيئة التجريب.`,
    userNotFound: `⚠️ المستخدم غير موجود، يرجى التسجيل باستخدام /start أولاً.`,
    userNotFound2: `⚠️ المستخدم غير موجود`,
    vip: `⚠️ حد دعوات المستخدم المجاني تم الوصول إليه، قم بالترقية إلى VIP لفتح الحد لـ 100 شخص!`,
    vip2: `⚠️ هذه الميزة مخصصة للأعضاء المميزين فقط`,
    vip3: `⚠️ **VIP تنتهي اليوم**`,
    pageInfo: `📄 Page {page}/{totalPages}`,
    cancel3: `[需要翻译]`,
    catch4: `[需要翻译]`,
    end2: `[需要翻译]`,
    female: `[需要翻译]`,
    free: `[需要翻译]`,
    start5: `[需要翻译]`,
    task2: `[需要翻译]`,
    rewardPermanent: `[需要翻译]`,
    communityThanks: `[需要翻译]`,
  },
  warnings: {
    birthday: `[Needs Translation: warnings.birthday]`,
    bloodType: `🩸 فصيلة الدم`,
    gender: `👤 الجنس: {otherUser.gender}`,
    mbti: `🧠 MBTI: \\\\\\\\\\\${mbti}`,
    register2: `[Translation needed: warnings.register2]`,
    register4: `[Translation needed: warnings.register4]`,
    settings: `🧠 MBTI: \\\\\\\\\\\${bottle.mbti_result}`,
    text5: `📖 السيرة الذاتية: {otherUser.bio}`,
    text6: `[Translation needed: warnings.text6]`,
    userNotFound: `المستخدم غير موجود`,
    'warning.ad': `⚠️ حالياً، لا توجد مزودات إعلانات مكونة

`,
    'warning.ad2': `⚠️ حالياً، لا توجد إعلانات رسمية متاحة

`,
    'warning.ad3': `⚠️ لا توجد مزودات إعلانات متاحة في الوقت الحالي`,
    'warning.ad4': `⚠️ غير قادر على اختيار مزود الإعلان`,
    'warning.ad5': `⚠️ غير قادر على عرض المزيد من الإعلانات`,
    'warning.birthday': `⚠️ حالياً لست في خطوة إدخال تاريخ الميلاد`,
    'warning.bloodType': `⚠️ حالياً لست في خطوة اختيار فصيلة الدم`,
    'warning.broadcast': `⚠️ تم اكتشاف \\\${stuckBroadcasts.results.length} بث عالق

`,
    'warning.complete': `⚠️ يرجى إكمال الإعلان السابق قبل البدء بآخر جديد`,
    'warning.confirm': `⚠️ يرجى التحقق من معلومات تاريخ الميلاد الخاصة بك:

`,
    'warning.conversation': `⚠️ معلومات المحادثة غير صحيحة.`,
    'warning.conversation10': `⚠️ المحادثة غير موجودة`,
    'warning.conversation2': `⚠️ معلومات المحادثة غير صحيحة`,
    'warning.conversation3': `⚠️ لا يملك هذا المستخدم أي منشورات في تاريخ المحادثة
`,
    'warning.conversation4': `⚠️ لا يمكن العثور على المحادثة المحددة، قد تكون قد انتهت أو expired.`,
    'warning.conversation5': `⚠️ **تم تحديث تاريخ المحادثة جزئيًا**

`,
    'warning.conversation6': `⚠️ غير قادر على تحديد شريك المحادثة

`,
    'warning.conversation7': `⚠️ لا يمكن العثور على هذه المحادثة

`,
    'warning.conversation8': `⚠️ المحادثة غير موجودة أو انتهت`,
    'warning.conversation9': `⚠️ انتهت هذه المحادثة`,
    'warning.end': `⚠️ انتهى الاختبار أو غير موجود`,
    'warning.failed': `⚠️ فشل التحقق من الدفع، يرجى المحاولة لاحقًا`,
    'warning.gender': `⚠️ حاليًا غير موجود في خطوة اختيار الجنس`,
    'warning.invite': `⚠️ غير قادر على استرداد رمز الدعوة`,
    'warning.mbti': `⚠️ حاليًا غير موجود في خطوة اختبار MBTI`,
    'warning.mbti2': `⚠️ نوع MBTI غير صالح`,
    'warning.message': `⚠️ تم اكتشاف \\\${outdatedPosts.length} منشورات قديمة تحتاج إلى تحديث
`,
    'warning.message2': `⚠️ ملاحظة: هذا هو \\\${testInfo}\\\${testTitle}, \\\${accuracy}.

`,
    'warning.message3': `⚠️ يرجى الضغط لفترة طويلة على الرسالة التي تريد حظرها والرد بالأمر

`,
    'warning.message4': `⚠️ يرجى الضغط لفترة طويلة على الرسالة التي تريد الإبلاغ عنها والرد بالأمر

`,
    'warning.message5': `⚠️ **الرسالة تحتوي على روابط محظورة**

`,
    'warning.register': `⚠️ لم يتم العثور على ملف التعريف الخاص بالمستخدم، يرجى التسجيل أولاً باستخدام /start.`,
    'warning.register2': `⚠️ يرجى إكمال عملية التسجيل أولاً.

استخدم /start للمتابعة في التسجيل.`,
    'warning.register3': `⚠️ حدثت مشكلة في عملية التسجيل، يرجى إعادة التشغيل: /start`,
    'warning.register4': `⚠️ يرجى إكمال عملية التسجيل أولاً.`,
    'warning.settings': `⚠️ تذكير: إعداد الجنس **لا يمكن تعديله** بمجرد تحديده!

`,
    'warning.settings2': `⚠️ لا يمكن تعديل إعداد تاريخ الميلاد، يرجى التحقق من دقته!`,
    'warning.settings3': `⚠️ ملاحظة: لا يمكن تعديل إعداد الجنس، يرجى الاختيار بعناية!`,
    'warning.short': `⚠️ ترتيب الأسئلة غير صحيح`,
    'warning.short2': `⚠️ خيار غير معروف`,
    'warning.short3': `⚠️ طلب غير صالح`,
    'warning.short4': `⚠️ انتباه: 
`,
    'warning.short5': `⚠️ انتهاكات أخرى`,
    'warning.start': `⚠️ انتهت الجلسة، يرجى إعادة التشغيل: /throw`,
    'warning.start2': `⚠️ انتهت الجلسة، يرجى إعادة التشغيل`,
    'warning.task': `⚠️ نوع المهمة غير معروف`,
    'warning.text': `⚠️ **انتباه**

`,
    'warning.text10': `⚠️ **العناصر غير القابلة للتعديل**: 
`,
    'warning.text11': `⚠️ انتهت الجلسة، يرجى إعادة إجراء العملية`,
    'warning.text12': `⚠️ المسودة غير موجودة أو قد انتهت صلاحيتها`,
    'warning.text2': `⚠️ نوع الدفع غير صالح`,
    'warning.text3': `⚠️ خدمة الترجمة غير متاحة مؤقتاً، النص التالي هو النص الأصلي
`,
    'warning.text4': `⚠️ نصيحة أمان: 
`,
    'warning.text5': `⚠️ حالياً لست في خطوة اختبار مكافحة الاحتيال`,
    'warning.text6': `⚠️ حالياً لست في خطوة شروط الخدمة`,
    'warning.text7': `⚠️ ملاحظة: هذه الميزة متاحة فقط في بيئة الاختبار.`,
    'warning.text8': `⚠️ **إرسال الصور، الفيديوهات، أو الوسائط المتعددة غير مسموح به**

`,
    'warning.text9': `⚠️ هذه الميزة متاحة فقط في بيئة الاختبار.`,
    'warning.userNotFound': `⚠️ المستخدم غير موجود، يرجى التسجيل أولاً باستخدام /start.`,
    'warning.userNotFound2': `⚠️ المستخدم غير موجود`,
    'warning.vip': `⚠️ لقد وصلت إلى حد دعوة المستخدمين المجانية، قم بالترقية إلى VIP لفتح حد 100 شخص!`,
    'warning.vip2': `⚠️ هذه الميزة مخصصة فقط للأعضاء VIP`,
    'warning.vip3': `⚠️ **ستنتهي صلاحية VIP اليوم**

`,
  },
};
