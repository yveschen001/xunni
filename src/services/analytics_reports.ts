/**
 * Analytics Reports Service
 *
 * Purpose:
 *   Generate analytics reports for admin/monitoring
 *   Daily operations report, ad performance, VIP funnel, etc.
 */

import type { D1Database } from '@cloudflare/workers-types';
import { getDailyAdStats } from '~/db/queries/ad_rewards';
import { getProviderPerformanceComparison } from '~/db/queries/ad_providers';
import { getDailyOfficialAdStats } from '~/db/queries/official_ads';
import { getFunnelConversionRate } from '~/db/queries/analytics';

// ============================================================================
// Report Types
// ============================================================================

export interface DailyReport {
  date: string;
  user_metrics: {
    new_users: number;
    dau: number;
    d1_retention: number;
    avg_session_duration: number;
  };
  ad_metrics: {
    third_party: {
      impressions: number;
      completions: number;
      completion_rate: number;
      rewards_granted: number;
    };
    official: {
      impressions: number;
      clicks: number;
      ctr: number;
      rewards_granted: number;
    };
  };
  vip_metrics: {
    page_views: number;
    purchase_intents: number;
    conversions: number;
    conversion_rate: number;
    revenue: number;
  };
  invite_metrics: {
    initiated: number;
    accepted: number;
    activated: number;
    conversion_rate: number;
  };
  content_metrics: {
    bottles_thrown: number;
    bottles_caught: number;
    conversations_started: number;
    avg_conversation_rounds: number;
  };
}

export interface AdPerformanceReport {
  period: {
    start: string;
    end: string;
  };
  third_party: {
    total_impressions: number;
    total_completions: number;
    completion_rate: number;
    total_rewards: number;
  };
  official: {
    total_impressions: number;
    total_clicks: number;
    ctr: number;
    total_rewards: number;
  };
  provider_comparison: Array<{
    provider_name: string;
    provider_display_name: string;
    total_requests: number;
    total_completions: number;
    completion_rate: number;
    error_rate: number;
  }>;
}

// ============================================================================
// Daily Report
// ============================================================================

/**
 * Generate daily operations report
 */
export async function generateDailyReport(db: D1Database, date: string): Promise<DailyReport> {
  // Get ad metrics
  const thirdPartyAdStats = await getDailyAdStats(db, date);
  const officialAdStats = await getDailyOfficialAdStats(db, date);

  // Build report
  const report: DailyReport = {
    date,
    user_metrics: {
      new_users: 0, // TODO: Query from analytics_events
      dau: 0, // TODO: Query from daily_user_summary
      d1_retention: 0, // TODO: Calculate from daily_user_summary
      avg_session_duration: 0, // TODO: Query from user_sessions
    },
    ad_metrics: {
      third_party: {
        impressions: thirdPartyAdStats.total_ad_views,
        completions: thirdPartyAdStats.total_ad_completions,
        completion_rate: thirdPartyAdStats.completion_rate,
        rewards_granted: thirdPartyAdStats.total_quota_earned,
      },
      official: {
        impressions: officialAdStats.total_impressions,
        clicks: officialAdStats.total_clicks,
        ctr: officialAdStats.ctr,
        rewards_granted: officialAdStats.total_rewards,
      },
    },
    vip_metrics: {
      page_views: 0, // TODO: Query from analytics_events
      purchase_intents: 0, // TODO: Query from funnel_events
      conversions: 0, // TODO: Query from funnel_events
      conversion_rate: 0,
      revenue: 0, // TODO: Calculate from VIP purchases
    },
    invite_metrics: {
      initiated: 0, // TODO: Query from analytics_events
      accepted: 0, // TODO: Query from analytics_events
      activated: 0, // TODO: Query from analytics_events
      conversion_rate: 0,
    },
    content_metrics: {
      bottles_thrown: 0, // TODO: Query from bottles table
      bottles_caught: 0, // TODO: Query from bottles table
      conversations_started: 0, // TODO: Query from conversations table
      avg_conversation_rounds: 0, // TODO: Calculate from conversations
    },
  };

  return report;
}

/**
 * Format daily report for Telegram
 */
export function formatDailyReport(report: DailyReport): string {
  // 檢查是否有任何活動
  const hasActivity =
    report.user_metrics.dau > 0 ||
    report.ad_metrics.third_party.impressions > 0 ||
    report.ad_metrics.official.impressions > 0 ||
    report.content_metrics.bottles_thrown > 0;

  if (!hasActivity) {
    return `
📊 **每日運營報表**
📅 日期：${report.date}

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
• 或者在測試環境中模擬用戶行為
    `.trim();
  }

  return `
📊 **每日運營報表**
📅 日期：${report.date}

**👥 用戶數據**
• 新增用戶：${report.user_metrics.new_users} 人
• 活躍用戶（DAU）：${report.user_metrics.dau} 人
• 留存率（D1）：${report.user_metrics.d1_retention.toFixed(1)}%
• 平均使用時長：${report.user_metrics.avg_session_duration.toFixed(1)} 分鐘

**📺 廣告數據**
• 第三方廣告：
  - 展示：${report.ad_metrics.third_party.impressions} 次
  - 完成：${report.ad_metrics.third_party.completions} 次
  - 完成率：${report.ad_metrics.third_party.completion_rate.toFixed(1)}%
  - 獎勵發放：${report.ad_metrics.third_party.rewards_granted} 個額度

• 官方廣告：
  - 展示：${report.ad_metrics.official.impressions} 次
  - 點擊：${report.ad_metrics.official.clicks} 次
  - CTR：${report.ad_metrics.official.ctr.toFixed(1)}%
  - 獎勵發放：${report.ad_metrics.official.rewards_granted} 個額度

**💎 VIP 數據**
• VIP 頁面訪問：${report.vip_metrics.page_views} 次
• 購買意向：${report.vip_metrics.purchase_intents} 次
• 成功轉化：${report.vip_metrics.conversions} 次
• 轉化率：${report.vip_metrics.conversion_rate.toFixed(1)}%
• 收入：$${report.vip_metrics.revenue.toFixed(2)}

**📲 邀請數據**
• 發起邀請：${report.invite_metrics.initiated} 次
• 接受邀請：${report.invite_metrics.accepted} 次
• 激活邀請：${report.invite_metrics.activated} 次
• 轉化率：${report.invite_metrics.conversion_rate.toFixed(1)}%

**💬 內容互動**
• 丟瓶子：${report.content_metrics.bottles_thrown} 個
• 撿瓶子：${report.content_metrics.bottles_caught} 個
• 新對話：${report.content_metrics.conversations_started} 個
• 平均對話輪次：${report.content_metrics.avg_conversation_rounds.toFixed(1)}

💡 詳細數據：/analytics
  `.trim();
}

// ============================================================================
// Ad Performance Report
// ============================================================================

/**
 * Generate ad performance report
 */
export async function generateAdPerformanceReport(
  db: D1Database,
  startDate: string,
  endDate: string
): Promise<AdPerformanceReport> {
  // Get provider comparison
  const providerComparison = await getProviderPerformanceComparison(db);

  // Build report
  const report: AdPerformanceReport = {
    period: {
      start: startDate,
      end: endDate,
    },
    third_party: {
      total_impressions: 0,
      total_completions: 0,
      completion_rate: 0,
      total_rewards: 0,
    },
    official: {
      total_impressions: 0,
      total_clicks: 0,
      ctr: 0,
      total_rewards: 0,
    },
    provider_comparison: providerComparison,
  };

  return report;
}

/**
 * Format ad performance report for Telegram
 */
export function formatAdPerformanceReport(report: AdPerformanceReport): string {
  // 檢查是否有廣告數據
  const hasAdData =
    report.third_party.total_impressions > 0 ||
    report.official.total_impressions > 0 ||
    (report.provider_comparison && report.provider_comparison.length > 0);

  if (!hasAdData) {
    return `
📊 **廣告效果報表**
📅 期間：${report.period.start} ~ ${report.period.end}

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
• 然後等待用戶開始使用廣告功能
    `.trim();
  }

  let message = `
📊 **廣告效果報表**
📅 期間：${report.period.start} ~ ${report.period.end}

**📺 第三方廣告**
• 總展示：${report.third_party.total_impressions} 次
• 總完成：${report.third_party.total_completions} 次
• 完成率：${report.third_party.completion_rate.toFixed(1)}%
• 總獎勵：${report.third_party.total_rewards} 個額度

**📢 官方廣告**
• 總展示：${report.official.total_impressions} 次
• 總點擊：${report.official.total_clicks} 次
• CTR：${report.official.ctr.toFixed(1)}%
• 總獎勵：${report.official.total_rewards} 個額度

**🏆 提供商對比**
  `.trim();

  for (const provider of report.provider_comparison) {
    message += `\n\n**${provider.provider_display_name}**`;
    message += `\n• 請求：${provider.total_requests} 次`;
    message += `\n• 完成：${provider.total_completions} 次`;
    message += `\n• 完成率：${provider.completion_rate.toFixed(1)}%`;
    message += `\n• 錯誤率：${provider.error_rate.toFixed(1)}%`;
  }

  return message;
}

// ============================================================================
// VIP Funnel Report
// ============================================================================

/**
 * Generate VIP conversion funnel report
 */
export async function generateVIPFunnelReport(
  db: D1Database,
  startDate: string,
  endDate: string
): Promise<any> {
  const funnelData = await getFunnelConversionRate(db, 'vip_conversion', startDate, endDate);

  return {
    period: {
      start: startDate,
      end: endDate,
    },
    funnel_steps: funnelData,
    overall_conversion_rate:
      funnelData.length > 0 ? funnelData[funnelData.length - 1].conversion_rate : 0,
  };
}

/**
 * Format VIP funnel report for Telegram
 */
export function formatVIPFunnelReport(report: any): string {
  // 檢查是否有數據
  if (!report.funnel_steps || report.funnel_steps.length === 0) {
    return `
📊 **VIP 轉化漏斗**
📅 期間：${report.period.start} ~ ${report.period.end}

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
• 或者先在測試環境中模擬用戶行為
    `.trim();
  }

  let message = `
📊 **VIP 轉化漏斗**
📅 期間：${report.period.start} ~ ${report.period.end}

**🎯 轉化步驟**
  `.trim();

  const stepNames: Record<string, string> = {
    awareness: '認知（看到 VIP 提示）',
    interest: '興趣（點擊查看 VIP）',
    consideration: '考慮（查看 VIP 詳情）',
    purchase_intent: '購買意向（點擊購買）',
    purchase_success: '購買成功',
  };

  for (const step of report.funnel_steps) {
    const stepName = stepNames[step.step] || step.step;
    message += `\n\n**${step.step_order}. ${stepName}**`;
    message += `\n• 用戶數：${step.user_count}`;
    message += `\n• 轉化率：${step.conversion_rate.toFixed(1)}%`;
  }

  message += `\n\n**📈 總轉化率：${report.overall_conversion_rate.toFixed(1)}%**`;

  return message;
}
