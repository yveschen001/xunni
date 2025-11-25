/**
 * 填入剩余的缺失翻译
 * 根据代码上下文智能填入
 */

import * as fs from 'fs';
import * as path from 'path';

// 剩余的翻译映射
const remainingTranslations: Record<string, string> = {
  // admin.analytics
  'admin.analytics.getAdDataFailed': '❌ 獲取廣告數據失敗',
  'admin.analytics.getDataFailed': '❌ 獲取分析數據失敗',
  'admin.analytics.getVipDataFailed': '❌ 獲取 VIP 數據失敗',
  'admin.analytics.noPermission': '❌ 你沒有權限查看分析數據',
  'admin.analytics.noPermissionAd': '❌ 你沒有權限查看廣告分析',
  'admin.analytics.noPermissionVip': '❌ 你沒有權限查看 VIP 分析',
  'admin.analytics.sendReportFailed': '❌ 發送每日報表失敗：{error}',

  // admin.ban
  'admin.ban.durationMustBePositive': '❌ 封禁時長必須是正整數',
  'admin.ban.noBanRecordsList': '📊 目前沒有封禁記錄',
  'admin.ban.permanent': '永久',
  'admin.ban.recentBans': '最近封禁',
  'admin.ban.userBanHistory': '用戶封禁歷史',
  'admin.ban.viewHistory': '查看歷史',
  'admin.ban.userNoBanRecords': '❌ 用戶 {userId} 沒有封禁記錄',
  'admin.ban.userBanHistoryTitle': '📊 用戶封禁歷史',
  'admin.ban.user': '用戶：{user}',
  'admin.ban.totalBans': '總封禁次數：{count}',
  'admin.ban.viewSpecificUserBanHistory': '💡 使用 /admin_bans <user_id> 查看特定用戶的封禁歷史',

  // admin.diagnose (注意：代码中使用的是 admin.diagnose.*，不是 admin.diagnoseAvatar.*)
  'admin.diagnose.allUpToDateFree': '✅ 所有帖子都是最新的（免費用戶狀態正確）',
  'admin.diagnose.allUpToDateVip': '✅ 所有帖子都是最新的（VIP 狀態正確）',
  'admin.diagnose.analysis': '🔎 **分析：**',
  'admin.diagnose.avatarCache': '📸 **頭像緩存：**',
  'admin.diagnose.failed': '❌ **診斷失敗**',
  'admin.diagnose.historyPosts': '💬 **對話歷史帖子：**',
  'admin.diagnose.historyPostsHint': '💡 對話歷史帖子只在有新消息時創建',
  'admin.diagnose.no': '❌ 否',
  'admin.diagnose.noCache': '• 無緩存',
  'admin.diagnose.noHistoryPosts': '• 無對話歷史帖子',
  'admin.diagnose.noHistoryPostsWarning': '⚠️ 此用戶沒有對話歷史帖子',
  'admin.diagnose.none': '無',
  'admin.diagnose.refreshHint': '💡 使用 /admin_refresh_vip_avatars 批量刷新',
  'admin.diagnose.title': '🔍 **頭像診斷報告**',
  'admin.diagnose.userInfo': '👤 **用戶信息：**',
  'admin.diagnose.yes': '✅ 是',

  // admin.refresh
  'admin.refresh.noRefreshNeeded': '✅ **無需刷新**',
  'admin.refresh.stats': '📊 **統計：**',
  'admin.refresh.totalVipUsers': '• 總 VIP 用戶：{count}',
  'admin.refresh.usersNeedingRefresh': '• 需要刷新：{count}',
  'admin.refresh.outdatedPosts': '• 過時帖子：{count}',
  'admin.refresh.allUpToDate': '所有 VIP 用戶的對話歷史都是最新的！',
  'admin.refresh.startingBatchRefresh': '🔄 **開始批量刷新 VIP 頭像**',
  'admin.refresh.processing': '⏳ 正在處理，請稍候...',
  'admin.refresh.batchComplete': '✅ **批量刷新完成**',
  'admin.refresh.duration': '⏱️ **耗時：** {duration} 秒',
  'admin.refresh.summary': '📊 **總結：**',
  'admin.refresh.processedUsers': '• 處理用戶：{count}',
  'admin.refresh.successUsers': '• 成功：{count}',
  'admin.refresh.failedUsers': '• 失敗：{count}',
  'admin.refresh.updatedPosts': '• 更新帖子：{count}',
  'admin.refresh.failedPosts': '• 失敗帖子：{count}',
  'admin.refresh.details': '📝 **詳細結果：**',
  'admin.refresh.userDetail': '• {username}: {updated} 更新, {failed} 失敗',
  'admin.refresh.moreUsers': '...還有 {count} 個用戶',
  'admin.refresh.failed': '❌ **刷新失敗**',
  'admin.refresh.errorOccurred': '處理過程中發生錯誤，請查看日誌。',
  'admin.refresh.error': '錯誤：{error}',
  'admin.refresh.startingRefresh': '🔄 開始刷新您的對話歷史...',
  'admin.refresh.complete': '✅ **刷新完成**',
  'admin.refresh.updated': '• 更新：{count} 個帖子',
  'admin.refresh.checkHint': '請檢查對話歷史是否已更新為清晰頭像。',

  // admin.insufficientPermission
  'admin.insufficientPermission': '❌ **權限不足**\n\n此命令僅限超級管理員使用。',

  // 其他缺失的 keys
  'admin.usageError': '❌ 使用方法錯誤',
  'admin.correctFormat': '**正確格式：**',
  'admin.addAdminCommand': '`/admin_add <user_id>`',
  'admin.addAdminExample': '`/admin_add 123456789`',
  'admin.removeAdminCommand': '`/admin_remove <user_id>`',
  'admin.removeAdminExample': '`/admin_remove 123456789`',
  'admin.example': '**示例：**',
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
        const translation = remainingTranslations[key];
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
  for (const [key, translation] of Object.entries(remainingTranslations)) {
    // 解析 key 路径
    const parts = key.split('.');
    const namespace = parts[0];
    const keyPath = parts.slice(1);
    
    // 构建匹配模式（匹配 [需要翻译: xxx]）
    let pattern: RegExp;
    let replacement: string;
    
    if (namespace === 'admin') {
      if (keyPath.length === 2) {
        // admin.analytics.*, admin.ban.*, admin.diagnose.*, admin.refresh.*
        const [subNamespace, actualKey] = keyPath;
        // 匹配格式：subNamespace.actualKey: `[需要翻译: ...]`
        pattern = new RegExp(
          `${subNamespace}\\.${actualKey.replace(/\./g, '\\.')}:\\s*\`\\[需要翻译:[^\\]]+\\]\``,
          'g'
        );
        replacement = `${subNamespace}.${actualKey}: \`${translation}\``;
      } else {
        // admin.usageError, admin.correctFormat, etc.
        const actualKey = keyPath[0];
        pattern = new RegExp(
          `${actualKey.replace(/\./g, '\\.')}:\\s*\`\\[需要翻译:[^\\]]+\\]\``,
          'g'
        );
        replacement = `${actualKey}: \`${translation}\``;
      }
      
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        updated++;
      }
    }
  }
  
  fs.writeFileSync(zhTWPath, content, 'utf-8');
  console.log(`✅ 已更新 zh-TW.ts 中的 ${updated} 个翻译`);
}

/**
 * 主函数
 */
function main(): void {
  console.log('🔍 开始填入剩余的缺失翻译...\n');
  
  updateCSV();
  updateZhTW();
  
  console.log('\n✅ 完成！');
}

main();

