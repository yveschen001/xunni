export default {
  "admin": "إلغاء يدوي من المشرف",
  "admin2": "مسح يدوي من المشرف (البث معلق)",
  "allBroadcastsNormal": "جميع حالات البث طبيعية.",
  "broadcastNotFound": "❌ لم يتم العثور على سجل البث",
  "cancelCommand": "/broadcast_cancel\n\n",
  "cancelCorrectFormat": "**النمط الصحيح:**\n",
  "cancelExample": "**مثال:**\n",
  "cancelExampleCommand": "/broadcast_cancel 1",
  "cancelFailed": "❌ فشل في إلغاء البث: {error}",
  "cancelUsageError": "❌ استخدام غير صحيح\n\n",
  "cancelled": "✅ تم إلغاء البث\n\n",
  "cancelledId": "الرقم التعريفي: {id}",
  "cancelledStatus": "الحالة: ملغى\n\n",
  "checkProgressLater": "\nيرجى استخدام /broadcast_status لاحقًا للتحقق من التقدم.",
  "cleanupFailed": "❌ فشل في إزالة البث: {error}",
  "cleanupIds": "معرف البث: {ids}\n\n",
  "cleanupMarkedFailed": "تم وضع علامة على هذه البثوث كحالة 'فاشلة'\n",
  "cleanupSuccess": "✅ تمت إزالة {count} بثٍ عالق\n\n",
  "cleanupViewStatus": "استخدم /broadcast_status لرؤية السجلات المحدثة.",
  "completedAt": "وقت الانتهاء: {time}\n",
  "correctFormat": "**النمط الصحيح:**\n",
  "createFailed": "❌ فشل إنشاء البث، يرجى المحاولة مرة أخرى لاحقًا.",
  "createFailedShort": "❌ فشل إنشاء البث.",
  "created": "✅ تم إنشاء البث\n\n",
  "empty": "لا يمكن أن تكون زجاجة الرسائل فارغة",
  "error": "خطأ: {error}",
  "estimate": {
    "immediate": "أرسل الآن (تقريبًا 1-2 ثانية)",
    "minutes": "حوالي {minutes} دقائق",
    "seconds": "حوالي {seconds} ثواني"
  },
  "estimatedTime": "الوقت المقدر: {time}\n\n",
  "example": "**مثال:**\n",
  "exampleMessage": "سوف يخضع النظام للصيانة الليلة في الساعة 10:00 مساءً",
  "failed": "فشل: {count}\n",
  "filter": {
    "age": "العمر: {min}-{max} سنة",
    "atLeastOneRequired": "يجب أن يكون هناك فلتر واحد على الأقل",
    "birthdayToday": "عيد ميلاد اليوم",
    "country": "الدولة: {country}",
    "genderFemale": "أنثى",
    "genderMale": "ذكر",
    "genderOther": "آخر",
    "invalidAgeFormat": "نطاق العمر غير صالح: {value} (يجب أن يكون التنسيق min-max، مثل: 18-25)",
    "invalidAgeMinMax": "نطاق العمر غير صالح: {value} (يجب ألا يكون الحد الأدنى للعمر أكبر من الحد الأقصى)",
    "invalidAgeRange": "نطاق العمر غير صالح: {value} (يجب أن يكون العمر بين 18-99)",
    "invalidCountry": "رمز الدولة غير صالح: {value} (يجب أن يتكون من حرفين كبيرين، مثل TW، US، JP)",
    "invalidFormat": "تنسيق الفلتر غير صالح: {pair}",
    "invalidGender": "قيمة الجنس غير صالحة: {value} (يجب أن تكون ذكراً، أنثى، أو غير ذلك)",
    "invalidMbti": "نوع MBTI غير صالح: {value} (يجب أن يكون واحدًا من: {mbtis})",
    "invalidZodiac": "علامة برج زودياك غير صالحة: {value} (يجب أن تكون واحدة من: {zodiacs})",
    "mbti": "MBTI: {mbti}",
    "nonVipUsers": "مستخدم غير VIP",
    "unknownFilter": "فلتر غير معروف: {key}",
    "vipUsers": "مستخدم VIP",
    "zodiacAquarius": "الدلو",
    "zodiacAries": "الحمل",
    "zodiacCancer": "السرطان",
    "zodiacCapricorn": "الجدي",
    "zodiacGemini": "الجوزاء",
    "zodiacLeo": "الأسد",
    "zodiacLibra": "الميزان",
    "zodiacPisces": "الحوت",
    "zodiacSagittarius": "القوس",
    "zodiacScorpio": "العقرب",
    "zodiacTaurus": "الثور",
    "zodiacVirgo": "العذراء"
  },
  "filterAge": "• العمر=18-25\n",
  "filterCommand": "/broadcast_filter\n\n",
  "filterConfirmConditions": "**شروط الفلتر:**\n{conditions}\n\n",
  "filterConfirmMessage": "**محتوى الرسالة:**\n{message}\n\n",
  "filterConfirmTitle": "🔍 **أكد مرشح الإرسال**\n\n",
  "filterCorrectFormat": "**الصيغة الصحيحة:**\n",
  "filterCountry": "• الدولة=TW|US|JP|...",
  "filterCreateFailed": "❌ فشل في إنشاء بث مفلتر\n\n{error}",
  "filterCreated": "✅ تم إنشاء مرشح الإرسال\n\n",
  "filterCreatedConditions": "شروط الفلتر: {conditions}\n",
  "filterCreatedEstimatedTime": "الوقت المقدر: {time}\n\n",
  "filterCreatedId": "المعرف: {id}\n",
  "filterCreatedSending": "سيتم إرسال البث في الخلفية. استخدم /broadcast_status {id} للتحقق من التقدم.",
  "filterCreatedUserCount": "عدد المستخدمين المطابقين: {count}\n",
  "filterExample1": "/broadcast_filter gender=female,age=18-25,country=TW مرحبا بالجميع!\n",
  "filterExample2": "/broadcast_filter vip=true,mbti=INTJ إشعار حدث خاص لفي آي بي\n",
  "filterExample3": "/broadcast_filter zodiac=Scorpio رسالة خاصة لبرج العقرب",
  "filterExamples": "**مثال:**\n",
  "filterFormat": "**صيغة المرشح:**\n",
  "filterFormatError": "❌ خطأ في تنسيق الفلتر\n\n{error}\n\n",
  "filterGender": "• الجنس=ذكر|أنثى|آخر",
  "filterMbti": "• mbti=INTJ|ENFP|...",
  "filterQueryingUsers": "جارٍ البحث عن مستخدمين يستوفون المعايير...",
  "filterUsageError": "❌ استخدام غير صحيح\n\n",
  "filterViewFormat": "يرجى استخدام /broadcast_filter لرؤية الصيغة الصحيحة.",
  "filterVip": "• vip=true|false",
  "filterZodiac": "• البرج=الحمل|الثور|...",
  "foundStuckBroadcasts": "⚠️ تم اكتشاف {count} بث متعثر\n\n",
  "id": "الرقم التعريفي: {id}",
  "idMustBeNumber": "❌ يجب أن يكون معرف الإرسال رقمًا",
  "maxUsersExceeded": "❌ نظام البث الحالي يدعم فقط البث لغاية {max} مستخدمين.\n\nعدد المستخدمين المستهدفين: {current}",
  "messageContent": "محتوى الرسالة",
  "noPendingBroadcasts": "حالياً لا توجد أي إرساليات معلقة أو عالقة.\n\n",
  "noRecords": "📊 لا توجد سجلات للبث حالياً",
  "noStuckBroadcasts": "✅ لا توجد بثوث للتنظيف\n\n",
  "processQueueFailed": "❌ فشل في معالجة قائمة انتظار البث: {error}",
  "processingBroadcast": "معالجة البث رقم #{id}\n",
  "progress": "التقدم: {sent}/{total} ({percentage}%)\n",
  "queryStatusFailed": "❌ فشل في استعلام حالة البث: {error}",
  "queueProcessed": "✅ تمت معالجة قائمة البث\n\n",
  "queueRemaining": "\nيوجد {count} بث في الانتظار في قائمة الانتظار\n",
  "queueTriggered": "{emoji} تم تفعيل معالجة قائمة الانتظار للبث\n\n",
  "recentRecords": "📊 أحدث 5 سجلات للبث\n\n",
  "recordId": "ID: {id}",
  "recordProgress": "التقدم: {sent}/{total}\n",
  "recordStatus": "الحالة: {status}\n",
  "recordTarget": "الهدف: {type}\n",
  "recordTime": "الوقت: {time}\n\n",
  "sendingInBackground": "سيتم إرسال البث في الخلفية. استخدم /broadcast_status {id} للتحقق من التقدم.",
  "short": "قيد الانتظار",
  "short2": "في الانتظار",
  "startedAt": "وقت البدء: {time}\n",
  "status": {
    "cancelled": "ملغي",
    "completed": "مكتمل",
    "failed": "فشل",
    "pending": "انتظار",
    "sending": "جاري الإرسال"
  },
  "statusLabel": "الحالة: {status}\n",
  "statusPending": "معلق",
  "statusStuck": "معلقة (جارٍ المحاولة مرة أخرى)",
  "statusTitle": "📊 حالة البث",
  "stuckBroadcastConfirm": "**هل ترغب في تأكيد التنظيف؟**\n",
  "stuckBroadcastConfirmCommand": "أكد باستخدام `/broadcast_cleanup confirm`",
  "stuckBroadcastDivider": "━━━━━━━━━━━━━━━━\n",
  "stuckBroadcastId": "**المعرف: {id}**",
  "stuckBroadcastMessage": "الرسالة: {message}\n",
  "stuckBroadcastNoRetry": "لن تتم معالجتها تلقائياً أو إعادة إرسالها\n\n",
  "stuckBroadcastProgress": "التقدم: {sent}/{total}\n",
  "stuckBroadcastStartTime": "وقت البدء: {time}\n\n",
  "stuckBroadcastTarget": "الهدف: {type}\n",
  "stuckBroadcastWillMarkFailed": "ستُعتبر هذه البثوث في حالة 'فشلت'\n",
  "target": {
    "all": "جميع المستخدمين",
    "nonVip": "المستخدمين غير المميزين",
    "unknown": "غير معروف",
    "vip": "مستخدم VIP"
  },
  "targetAll": "جميع المستخدمين",
  "targetLabel": "الهدف: {target}\n",
  "targetNonVip": "المستخدمون غير VIP",
  "targetType": "الهدف: {type}\n",
  "targetVip": "المستخدمون VIP",
  "tooLong": "لا يمكن أن تتجاوز زجاجة الرسائل {max} حرفًا (حاليًا {current} حرفًا)",
  "upgradeRequired": "يتطلب البث الجماعي ترقية في بنية النظام، يرجى الرجوع إلى BROADCAST_SYSTEM_REDESIGN.md",
  "usageError": "❌ استخدام غير صحيح\n\n",
  "userCount": "عدد المستخدمين: {count} شخص\n",
  "userCount2": "عدد المستخدمين: {count} شخص\n",
  "viewAllRecords": "استخدم /broadcast_status لعرض جميع سجلات البث.",
  "viewDetailsHint": "💡 استخدم /broadcast_status <id> لعرض التفاصيل",
  "viewUpdatedStatus": "تحقق من الحالة المحدثة باستخدام /broadcast_status."
};
