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

  errors: {
    generic: '❌ 發生錯誤，請稍後再試。\n\n如果問題持續，請聯繫管理員。',
    notRegistered: '❌ 你還沒有註冊。\n\n請先完成註冊：/start',
    banned: '❌ 你的帳號已被封禁。\n\n原因：{reason}\n\n如有疑問，請使用 /appeal 申訴。',
    invalidInput: '❌ 輸入格式錯誤，請重新輸入。',
    networkError: '❌ 網路錯誤，請稍後再試。',
  },
};

