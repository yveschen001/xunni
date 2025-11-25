/**
 * 填入所有剩余的缺失翻译
 */

import * as fs from 'fs';
import * as path from 'path';

// 所有剩余的翻译映射
const allRemainingTranslations: Record<string, string> = {
  // admin.ban
  'admin.ban.reason': '管理員封禁 / Admin ban',

  // broadcast
  'broadcast.statusTitle': '📊 廣播狀態',
  'broadcast.upgradeRequired': '💎 升級 VIP 以使用此功能',

  // common
  'common.anonymous': '匿名用戶',
  'common.none': '無',
  'common.userNotFound': '用戶不存在',

  // conversation
  'conversation.message77': '(無訊息)',

  // conversationHistory
  'conversationHistory.backToMenu': '🏠 返回主選單：/menu',
  'conversationHistory.viewAllConversations': '📊 查看所有對話',
  'conversationHistory.viewProfileCard': '👤 查看資料卡',

  // edit_profile
  'edit_profile.short19': '✏️ 編輯個人資料',

  // error
  'error.admin': '請稍後再試，或聯繫管理員。',
  'error.admin4': '❌ 只有管理員可以使用此命令。',
  'error.userNotFound4': '❌ 用戶不存在',
  'error.vip2': '❌ 只有 VIP 用戶可以使用此功能',

  // errors
  'errors.channelConfigError': '❌ 頻道配置錯誤',
  'errors.claimRewardFailed': '❌ 領取獎勵失敗',
  'errors.completeOnboarding': '⚠️ 請先完成註冊流程。',
  'errors.conversationInfoError': '❌ 對話資訊錯誤。',
  'errors.conversationNotFound': '❌ 找不到此對話',
  'errors.generic': '❌ 發生錯誤，請稍後再試。',
  'errors.invalidRequest': '❌ 無效的請求',
  'errors.processError': '❌ 處理過程中發生錯誤',
  'errors.sessionExpired': '❌ 會話已過期，請重新開始',
  'errors.systemErrorRetry': '❌ 系統發生錯誤，請稍後再試。',
  'errors.unknownAction': '❌ 未知的操作',
  'errors.userNotFound': '❌ 用戶不存在',
  'errors.userNotFoundRegister': '⚠️ 用戶不存在，請先使用 /start 註冊。',
  'errors.verificationFailed': '❌ 驗證失敗',

  // help
  'help.help2': '💡 使用 /help 查看幫助',

  // menu
  'menu.buttonCatch': '🎣 撿起漂流瓶',
  'menu.buttonChats': '💬 我的對話',
  'menu.buttonHelp': '❓ 幫助',
  'menu.buttonInvite': '👥 邀請好友',
  'menu.buttonProfile': '👤 個人資料',
  'menu.buttonSettings': '⚙️ 設定',
  'menu.buttonStats': '📊 統計',
  'menu.buttonThrow': '🌊 丟出漂流瓶',
  'menu.buttonVip': '💎 VIP',
  'menu.levelFree': '🆓 免費會員',
  'menu.levelVip': '💎 VIP 會員',
  'menu.selectFeature': '請選擇功能：',
  'menu.title': '🏠 **主選單**',
  'menu.userNotFound': '⚠️ 用戶不存在，請先使用 /start 註冊。',
  'menu.yourStatus': '你的狀態',

  // settings
  'settings.currentSettings': '⚙️ **當前設定**',
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
        const translation = allRemainingTranslations[key];
        if (translation) {
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
  for (const [key, translation] of Object.entries(allRemainingTranslations)) {
    // 解析 key 路径
    const parts = key.split('.');
    const namespace = parts[0];
    const keyName = parts.slice(1).join('.');
    
    // 构建匹配模式
    let pattern: RegExp;
    let replacement: string;
    
    // 匹配格式：keyName: `[需要翻译: ...]`
    // 注意：需要匹配可能的嵌套结构（如 common.anonymous 在 common 对象中）
    if (keyName.includes('.')) {
      // 嵌套 key（如 common.anonymous）
      const nestedParts = keyName.split('.');
      const lastPart = nestedParts[nestedParts.length - 1];
      pattern = new RegExp(
        `${lastPart.replace(/\./g, '\\.')}:\\s*\`\\[需要翻译:[^\\]]+\\]\``,
        'g'
      );
      replacement = `${lastPart}: \`${translation}\``;
    } else {
      // 简单 key（如 menu.title）
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
  console.log('🔍 开始填入所有剩余的缺失翻译...\n');
  
  updateCSV();
  updateZhTW();
  
  console.log('\n✅ 完成！');
}

main();

