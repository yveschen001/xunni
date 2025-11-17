/**
 * Traditional Chinese (繁體中文) Translations
 * Complete implementation
 */

import type { Translations } from '../types';

export const translations: Translations = {
  common: {
    yes: '是',
    no: '否',
    cancel: '取消',
    confirm: '確認',
    back: '返回',
    next: '下一步',
    skip: '跳過',
    done: '完成',
    error: '錯誤',
    success: '成功',
    loading: '載入中...',
  },

  onboarding: {
    welcome:
      '🎉 歡迎來到 XunNi！\n' +
      'Welcome to XunNi!\n\n' +
      'XunNi 是一個匿名漂流瓶交友平台，透過 MBTI 和星座幫你找到志同道合的朋友！\n' +
      'XunNi is an anonymous bottle messaging platform that helps you find like-minded friends through MBTI and zodiac signs!\n\n' +
      '首先，請選擇你的語言：\n' +
      'First, please select your language:',
    languageSelection: '🌍 選擇你的語言 / Select your language:',
    languageSelected: '✅ 語言已設定為 {language}',
    startRegistration:
      '太好了！現在讓我們開始設定你的個人資料 ✨\n\n' +
      '這只需要 3-5 分鐘。\n' +
      '你可以隨時暫停，稍後繼續。',
    askNickname: '首先，你希望別人怎麼稱呼你？\n\n請輸入你的暱稱（顯示名稱）：',
    askGender: '請選擇你的性別：\n\n⚠️ 注意：性別設定後無法修改，請謹慎選擇！',
    genderWarning: '⚠️ 再次確認：性別設定後將**永遠不能修改**！\n\n請確認：',
    askBirthday:
      '請輸入你的生日（格式：YYYY-MM-DD）：\n\n' +
      '例如：1995-06-15\n\n' +
      '⚠️ 注意：\n' +
      '• 生日設定後無法修改\n' +
      '• 必須年滿 18 歲才能使用本服務',
    birthdayWarning: '⚠️ 再次確認：生日設定後將**永遠不能修改**！\n\n你輸入的生日是：{birthday}\n\n請確認：',
    birthdayFormat: '❌ 生日格式錯誤，請使用 YYYY-MM-DD 格式\n\n例如：1995-06-15',
    under18Error: '❌ 很抱歉，你必須年滿 18 歲才能使用本服務。\n\n請成年後再來！',
    askMBTI:
      '現在讓我們進行 MBTI 性格測驗！\n\n' +
      '這將幫助我們為你找到更合適的聊天對象～\n\n' +
      '準備好了嗎？',
    mbtiComplete: '🎉 測驗完成！\n\n你的 MBTI 類型是：{mbti}\n\n{description}',
    askAntiFraud:
      '最後一步：反詐騙測驗\n\n' +
      '為了保護所有使用者的安全，我們需要確認你了解基本的網路安全知識。\n\n' +
      '準備好了嗎？',
    antiFraudComplete: '✅ 反詐騙測驗通過！',
    askTerms:
      '在開始使用前，請閱讀並同意我們的服務條款：\n\n' +
      '📋 隱私權政策\n' +
      '📋 使用者條款\n\n' +
      '點擊下方按鈕表示你已閱讀並同意上述條款。',
    termsAgree: '✅ 我已閱讀並同意',
    registrationComplete:
      '🎉 恭喜！你已經完成所有設定！\n\n' +
      '你的個人資料：\n' +
      '• 暱稱：{nickname}\n' +
      '• 性別：{gender}\n' +
      '• 年齡：{age} 歲\n' +
      '• 星座：{zodiac}\n' +
      '• MBTI：{mbti}\n\n' +
      '現在你可以開始使用 XunNi 了！',
    profileSummary: '你的個人資料：\n• 暱稱：{nickname}\n• 性別：{gender}\n• 年齡：{age} 歲\n• 星座：{zodiac}\n• MBTI：{mbti}',
  },

  commands: {
    start: '開始使用',
    help: '幫助',
    throw: '丟出漂流瓶',
    catch: '撿起漂流瓶',
    profile: '個人資料',
    stats: '統計資料',
    vip: 'VIP 訂閱',
    block: '封鎖使用者',
    report: '舉報不當內容',
    appeal: '申訴封禁',
    rules: '查看規則',
  },

  help: {
    title: '📖 XunNi 指令列表',
    coreFeatures: '🎮 核心功能',
    safetyFeatures: '🛡️ 安全功能',
    helpSection: '📖 幫助',
  },

  bottle: {
    throw: {
      title: '🌊 丟出漂流瓶',
      askContent: '請輸入你想說的話：',
      success: '✅ 漂流瓶已丟出！',
      limitReached: '❌ 你今天的漂流瓶已用完。\n\n免費用戶每天 3 個，VIP 用戶每天 30 個。',
    },
    catch: {
      title: '🎣 撿起漂流瓶',
      found: '🎉 你撿到了一個漂流瓶！',
      notFound: '😔 目前沒有適合你的漂流瓶。\n\n稍後再試試吧！',
      accept: '✅ 接受',
      reject: '❌ 拒絕',
    },
  },

  profile: {
    title: '👤 個人資料',
    nickname: '暱稱',
    gender: '性別',
    age: '年齡',
    zodiac: '星座',
    mbti: 'MBTI',
    language: '語言',
    vipStatus: 'VIP 狀態',
    edit: '編輯資料',
  },

  vip: {
    title: '⭐ VIP 訂閱',
    benefits:
      '🎁 VIP 權益：\n' +
      '• 每日 30 個漂流瓶（免費 3 個）\n' +
      '• 可指定星座／MBTI 篩選\n' +
      '• 34 種語言自動翻譯\n' +
      '• 無廣告',
    price: '💰 價格：5 USD / 月',
    subscribe: '訂閱 VIP',
    alreadyVIP: '✅ 你已經是 VIP 會員！\n\n到期時間：{expireAt}',
    expired: '⚠️ 你的 VIP 已過期。\n\n點擊下方按鈕續訂：',
  },

  invite: {
    // 邀請激活通知（邀請人）
    inviterSuccess:
      '🎉 邀請成功！\n\n' +
      '你的好友 {nickname} 已完成註冊並激活！\n\n' +
      '🎁 獎勵：每日漂流瓶配額 +1\n' +
      '📊 已邀請：{count} 人\n' +
      '🎯 {userType}用戶上限：{maxInvites} 人\n' +
      '📦 當前每日配額：{quota} 個',
    
    // 邀請激活通知（被邀請人）
    inviteeSuccess:
      '🎊 恭喜完成激活！\n\n' +
      '你和邀請人都獲得了獎勵：\n' +
      '• 你的邀請者每日配額 +1 ✅\n' +
      '• 你可以開始使用 XunNi 了！✅\n\n' +
      '💡 想要更多配額？\n' +
      '邀請你的朋友加入 XunNi！\n' +
      '每成功邀請 1 人，你的每日配額 +1\n' +
      '（最多可邀請 10 人 = 13 個瓶子/天）\n\n' +
      '查看你的邀請碼 → /profile',
    
    // 邀請上限提醒（倒數第二個）
    limitWarning:
      '⚠️ 邀請名額即將用完\n\n' +
      '你已成功邀請 {count} 人，還剩最後 1 個名額！\n\n' +
      '💎 升級 VIP 可解鎖：\n' +
      '• 邀請上限：10 → 100 人\n' +
      '• 每日配額：13 → 130 個瓶子\n' +
      '• 更多專屬權益\n\n' +
      '立即升級 → /vip',
    
    // 邀請上限已滿
    limitReached:
      '🎊 恭喜！邀請名額已滿\n\n' +
      '你已成功邀請 {count} 人，獲得最大免費獎勵！\n\n' +
      '💎 想要解鎖更多邀請？\n' +
      '升級 VIP 可邀請最多 100 人\n\n' +
      '立即升級 → /vip',
    
    // 註冊時使用邀請碼
    codeAccepted:
      '✅ 已使用 {inviterName} 的邀請碼\n\n' +
      '完成註冊後，你們都將獲得獎勵！',
    
    // 邀請碼無效
    codeInvalid: '❌ 邀請碼無效，請檢查後重試',
    
    // 不能自我邀請
    selfInviteError: '❌ 不能使用自己的邀請碼',
    
    // VIP 升級提示
    upgradePrompt: '💡 想要無限邀請？升級 VIP 可解鎖 100 人上限！',
    
    // 邀請統計
    stats: {
      title: '📊 邀請統計',
      totalInvites: '總邀請數',
      activatedInvites: '已激活',
      pendingInvites: '待激活',
      conversionRate: '轉化率',
      yourInviteCode: '你的邀請碼',
      shareButton: '分享邀請碼',
    },
  },

  errors: {
    generic: '❌ 發生錯誤，請稍後再試。\n\n如果問題持續，請聯繫管理員。',
    notRegistered: '❌ 你還沒有註冊。\n\n請先完成註冊：/start',
    banned: '❌ 你的帳號已被封禁。\n\n原因：{reason}\n\n如有疑問，請使用 /appeal 申訴。',
    invalidInput: '❌ 輸入格式錯誤，請重新輸入。',
    networkError: '❌ 網路錯誤，請稍後再試。',
  },

  ban: {
    // 封禁通知（臨時封禁）- 友善版本
    temporaryBan:
      '⚠️ 帳號安全提醒\n\n' +
      '我們的系統偵測到你的帳號存在異常行為，為了保護社群安全，你的帳號暫時無法使用。\n\n' +
      '⏰ 預計恢復時間：{unbanTime}\n' +
      '🕐 暫停時長：約 {duration}\n\n' +
      '📖 在此期間，請查看我們的社群規範：/rules\n\n' +
      '💡 如果你認為這是誤判，歡迎使用 /appeal 提出申訴，我們會盡快審核。',
    
    // 封禁通知（永久封禁）- 友善版本
    permanentBan:
      '⚠️ 帳號安全提醒\n\n' +
      '我們的系統偵測到你的帳號存在嚴重違規行為，經過 AI 安全審核後，你的帳號已被停用。\n\n' +
      '📖 請查看社群規範了解詳情：/rules\n\n' +
      '💡 如果你認為這是誤判，歡迎使用 /appeal 提出申訴，我們會由人工審核你的情況。',
    
    // 封禁檢查（臨時封禁）- 友善版本
    bannedTemporary:
      '⚠️ 帳號暫時無法使用\n\n' +
      '你的帳號目前處於暫停狀態，這可能是因為系統偵測到異常行為。\n\n' +
      '⏰ 預計恢復時間：{unbanTime}\n' +
      '🕐 剩餘時間：約 {timeLeft}\n\n' +
      '📖 請查看社群規範：/rules\n' +
      '💡 如有疑問，歡迎使用 /appeal 申訴',
    
    // 封禁檢查（永久封禁）- 友善版本
    bannedPermanent:
      '⚠️ 帳號已停用\n\n' +
      '你的帳號因違反社群規範已被停用。\n\n' +
      '📖 請查看社群規範：/rules\n' +
      '💡 如有疑問，歡迎使用 /appeal 申訴',
  },
};

