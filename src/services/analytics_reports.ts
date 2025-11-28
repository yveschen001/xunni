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
import { calculateDailyStats } from '~/services/stats';
import { createDatabaseClient } from '~/db/client';

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

  // Get operational stats using the shared stats service
  // Create a wrapper for the stats service which expects createDatabaseClient return type
  const dbClient = createDatabaseClient(db);
  const dailyStats = await calculateDailyStats(dbClient, date);

  // Build report
  const report: DailyReport = {
    date,
    user_metrics: {
      new_users: dailyStats.newUsers,
      dau: dailyStats.activeUsers,
      d1_retention: 0, // TODO: Implement retention calculation logic in stats service
      avg_session_duration: 0, // TODO: Implement session tracking
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
      page_views: 0, // TODO: Add tracking for VIP page views
      purchase_intents: 0, // TODO: Add tracking for purchase intents
      conversions: dailyStats.newVip,
      conversion_rate: dailyStats.activeUsers > 0 ? (dailyStats.newVip / dailyStats.activeUsers) * 100 : 0,
      revenue: 0, // TODO: Calculate from payment history
    },
    invite_metrics: {
      initiated: 0, // TODO: Query from invites table
      accepted: 0, // TODO: Query from invites table
      activated: 0, // TODO: Query from invites table
      conversion_rate: 0,
    },
    content_metrics: {
      bottles_thrown: dailyStats.newBottles,
      bottles_caught: dailyStats.caughtBottles,
      conversations_started: dailyStats.newConversations,
      avg_conversation_rounds: 0, // TODO: Calculate
    },
  };

  return report;
}

/**
 * Format daily report for Telegram
 */
export async function formatDailyReport(report: DailyReport, i18n?: any): Promise<string> {
  // 檢查是否有任何活動
  const hasActivity =
    report.user_metrics.dau > 0 ||
    report.ad_metrics.third_party.impressions > 0 ||
    report.ad_metrics.official.impressions > 0 ||
    report.content_metrics.bottles_thrown > 0;

  if (!i18n) {
    const { createI18n } = await import('~/i18n');
    i18n = createI18n('zh-TW');
  }

  if (!hasActivity) {
    return i18n.t('analytics.message2', { date: report.date });
  }

  return i18n.t('analytics.message', {
    date: report.date,
    newUsers: report.user_metrics.new_users,
    dau: report.user_metrics.dau,
    d1Retention: report.user_metrics.d1_retention.toFixed(1),
    avgSessionDuration: report.user_metrics.avg_session_duration.toFixed(1),
    thirdPartyImpressions: report.ad_metrics.third_party.impressions,
    thirdPartyCompletions: report.ad_metrics.third_party.completions,
    thirdPartyCompletionRate: report.ad_metrics.third_party.completion_rate.toFixed(1),
    thirdPartyRewardsGranted: report.ad_metrics.third_party.rewards_granted,
    officialImpressions: report.ad_metrics.official.impressions,
    officialClicks: report.ad_metrics.official.clicks,
    officialCtr: report.ad_metrics.official.ctr.toFixed(1),
    officialRewardsGranted: report.ad_metrics.official.rewards_granted,
    vipPageViews: report.vip_metrics.page_views,
    vipPurchaseIntents: report.vip_metrics.purchase_intents,
    vipConversions: report.vip_metrics.conversions,
    vipConversionRate: report.vip_metrics.conversion_rate.toFixed(1),
    vipRevenue: report.vip_metrics.revenue.toFixed(2),
    inviteInitiated: report.invite_metrics.initiated,
    inviteAccepted: report.invite_metrics.accepted,
    inviteActivated: report.invite_metrics.activated,
    inviteConversionRate: report.invite_metrics.conversion_rate.toFixed(1),
    bottlesThrown: report.content_metrics.bottles_thrown,
    bottlesCaught: report.content_metrics.bottles_caught,
    conversationsStarted: report.content_metrics.conversations_started,
    avgConversationRounds: report.content_metrics.avg_conversation_rounds.toFixed(1),
  });
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
export async function formatAdPerformanceReport(report: AdPerformanceReport, i18n?: any): Promise<string> {
  // 檢查是否有廣告數據
  const hasAdData =
    report.third_party.total_impressions > 0 ||
    report.official.total_impressions > 0 ||
    (report.provider_comparison && report.provider_comparison.length > 0);

  if (!i18n) {
    const { createI18n } = await import('~/i18n');
    i18n = createI18n('zh-TW');
  }

  if (!hasAdData) {
    return i18n.t('analytics.ad3', {
      start: report.period.start,
      end: report.period.end,
    });
  }

  let message = i18n.t('analytics.ad2', {
    start: report.period.start,
    end: report.period.end,
    thirdPartyImpressions: report.third_party.total_impressions,
    thirdPartyCompletions: report.third_party.total_completions,
    thirdPartyCompletionRate: report.third_party.completion_rate.toFixed(1),
    thirdPartyRewardsGranted: report.third_party.total_rewards,
    officialImpressions: report.official.total_impressions,
    officialClicks: report.official.total_clicks,
    officialCtr: report.official.ctr.toFixed(1),
    officialRewardsGranted: report.official.total_rewards,
  });

  message += `\n\n${i18n.t('analytics.providerComparisonTitle')}`;

  for (const provider of report.provider_comparison) {
    message += `\n\n**${provider.provider_display_name}**`;
    message += i18n.t('analytics.message6', { requests: provider.total_requests });
    message += i18n.t('analytics.complete2', { completions: provider.total_completions });
    message += i18n.t('analytics.complete', { rate: provider.completion_rate.toFixed(1) });
    message += i18n.t('analytics.message5', { rate: provider.error_rate.toFixed(1) });
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

  let message = i18n.t('analytics.vip2', {
    start: report.period.start,
    end: report.period.end,
  });

  message += `\n\n${i18n.t('analytics.conversionStepsTitle')}`;

  const stepNames: Record<string, string> = {
    awareness: i18n.t('analytics.vip3'),
    interest: i18n.t('analytics.vip5'),
    consideration: i18n.t('analytics.vip4'),
    purchase_intent: i18n.t('analytics.text2'),
    purchase_success: i18n.t('analytics.purchaseSuccess'),
  };

  for (const step of report.funnel_steps) {
    const stepName = stepNames[step.step] || step.step;
    message += `\n\n**${step.step_order}. ${stepName}**`;
    message += i18n.t('analytics.text', { userCount: step.user_count });
    message += i18n.t('analytics.message4', { rate: step.conversion_rate.toFixed(1) });
  }

  message += i18n.t('analytics.message3', { rate: report.overall_conversion_rate.toFixed(1) });

  return message;
}
