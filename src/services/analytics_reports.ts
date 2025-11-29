/**
 * Analytics Reports Service
 *
 * Purpose:
 *   Generate analytics reports for admin/monitoring
 *   Daily operations report, ad performance, VIP funnel, etc.
 */

import type { D1Database } from '@cloudflare/workers-types';
import { getDailyAdStats, getAdStatsInRange } from '~/db/queries/ad_rewards';
import { getProviderPerformanceComparison } from '~/db/queries/ad_providers';
import { getDailyOfficialAdStats, getOfficialAdStatsInRange } from '~/db/queries/official_ads';
import { 
  getFunnelConversionRate, 
  getUserFunnelStats, 
  getSocialDepthStats 
} from '~/db/queries/analytics';
import { calculateDetailedDailyStats } from '~/services/stats';
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
  funnel_metrics: {
    today: {
      new_users: number;
      thrown_users: number;
      caught_users: number;
      throw_rate: number;
      catch_rate: number;
    };
    yesterday: {
      new_users: number;
      thrown_users: number;
      caught_users: number;
      throw_rate: number;
      catch_rate: number;
    };
  };
  social_depth_metrics: {
    total_conversations: number;
    avg_rounds: number;
    one_sided_count: number;
    one_sided_rate: number;
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
  fortune_metrics: {
    new_profiles: number;
    total_profiles: number;
    daily_readings: number;
    deep_readings: number;
    ad_rewards: number;
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
  const dailyStats = await calculateDetailedDailyStats(dbClient, date);

  // Calculate previous date for comparison
  const todayDate = new Date(date);
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  // Get new funnel & social depth stats
  const [funnelToday, funnelYesterday, socialDepth] = await Promise.all([
    getUserFunnelStats(db, date),
    getUserFunnelStats(db, yesterday),
    getSocialDepthStats(db, date)
  ]);

  // Fortune Metrics
  const fortuneStats = await db.batch([
    // New Profiles Today
    db.prepare("SELECT COUNT(*) as c FROM fortune_profiles WHERE created_at LIKE ?").bind(`${date}%`),
    // Total Profiles
    db.prepare("SELECT COUNT(*) as c FROM fortune_profiles"),
    // Daily Readings Today
    db.prepare("SELECT COUNT(*) as c FROM fortune_history WHERE created_at LIKE ? AND type = 'daily'").bind(`${date}%`),
    // Deep Readings Today
    db.prepare("SELECT COUNT(*) as c FROM fortune_history WHERE created_at LIKE ? AND type = 'deep'").bind(`${date}%`),
    // Ad Rewards for Fortune
    db.prepare("SELECT COUNT(*) as c FROM analytics_events WHERE event_type = 'ad_complete' AND event_date = ? AND event_data LIKE '%fortune%'").bind(date)
  ]);

  const newProfiles = (fortuneStats[0].results?.[0] as any)?.c || 0;
  const totalProfiles = (fortuneStats[1].results?.[0] as any)?.c || 0;
  const dailyReadings = (fortuneStats[2].results?.[0] as any)?.c || 0;
  const deepReadings = (fortuneStats[3].results?.[0] as any)?.c || 0;
  const adRewards = (fortuneStats[4].results?.[0] as any)?.c || 0;

  // Build report
  const report: DailyReport = {
    date,
    user_metrics: {
      new_users: dailyStats.newUsers,
      dau: dailyStats.activeUsers,
      d1_retention: dailyStats.d1Retention,
      avg_session_duration: dailyStats.avgSessionDuration,
    },
    funnel_metrics: {
      today: {
        new_users: funnelToday.newUsers,
        thrown_users: funnelToday.thrownUsers,
        caught_users: funnelToday.caughtUsers,
        throw_rate: funnelToday.newUsers > 0 ? (funnelToday.thrownUsers / funnelToday.newUsers) * 100 : 0,
        catch_rate: funnelToday.newUsers > 0 ? (funnelToday.caughtUsers / funnelToday.newUsers) * 100 : 0,
      },
      yesterday: {
        new_users: funnelYesterday.newUsers,
        thrown_users: funnelYesterday.thrownUsers,
        caught_users: funnelYesterday.caughtUsers,
        throw_rate: funnelYesterday.newUsers > 0 ? (funnelYesterday.thrownUsers / funnelYesterday.newUsers) * 100 : 0,
        catch_rate: funnelYesterday.newUsers > 0 ? (funnelYesterday.caughtUsers / funnelYesterday.newUsers) * 100 : 0,
      }
    },
    social_depth_metrics: {
      total_conversations: socialDepth.totalConversations,
      avg_rounds: socialDepth.avgRounds,
      one_sided_count: socialDepth.oneSidedCount,
      one_sided_rate: socialDepth.totalConversations > 0 ? (socialDepth.oneSidedCount / socialDepth.totalConversations) * 100 : 0,
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
      conversion_rate:
        dailyStats.activeUsers > 0 ? (dailyStats.newVip / dailyStats.activeUsers) * 100 : 0,
      revenue: dailyStats.revenue,
    },
    invite_metrics: {
      initiated: dailyStats.inviteInitiated,
      accepted: dailyStats.inviteAccepted,
      activated: dailyStats.inviteActivated,
      conversion_rate:
        dailyStats.inviteAccepted > 0
          ? (dailyStats.inviteActivated / dailyStats.inviteAccepted) * 100
          : 0,
    },
    content_metrics: {
      bottles_thrown: dailyStats.newBottles,
      bottles_caught: dailyStats.caughtBottles,
      conversations_started: dailyStats.newConversations,
      avg_conversation_rounds: socialDepth.avgRounds,
    },
    fortune_metrics: {
      new_profiles: newProfiles,
      total_profiles: totalProfiles,
      daily_readings: dailyReadings,
      deep_readings: deepReadings,
      ad_rewards: adRewards,
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
    report.content_metrics.bottles_thrown > 0 ||
    report.funnel_metrics.today.new_users > 0;

  if (!i18n) {
    const { createI18n } = await import('~/i18n');
    i18n = createI18n('zh-TW');
  }

  if (!hasActivity) {
    return i18n.t('analytics.message2', { date: report.date });
  }

  // Trend indicators
  const getTrend = (curr: number, prev: number) => {
    if (curr > prev) return '⬆️';
    if (curr < prev) return '⬇️';
    return '➡️';
  };

  const newUsersTrend = getTrend(report.funnel_metrics.today.new_users, report.funnel_metrics.yesterday.new_users);
  const throwRateTrend = getTrend(report.funnel_metrics.today.throw_rate, report.funnel_metrics.yesterday.throw_rate);
  const catchRateTrend = getTrend(report.funnel_metrics.today.catch_rate, report.funnel_metrics.yesterday.catch_rate);

  // Note: Using hardcoded format as requested in ADMIN_PANEL.md update
  // Ideally, these strings should move to i18n files later.
  
  let message = `📊 **運營數據統計** (${report.date})\n\n`;

  // 1. User Funnel
  message += `👥 **用戶漏斗 (今日 vs 昨日)**\n`;
  message += `├─ 總加入用戶：${report.funnel_metrics.today.new_users} (昨: ${report.funnel_metrics.yesterday.new_users}) ${newUsersTrend}\n`;
  message += `├─ 丟瓶轉化率：${report.funnel_metrics.today.throw_rate.toFixed(1)}% (${report.funnel_metrics.today.thrown_users}人)\n`;
  message += `│  └─ 昨日：${report.funnel_metrics.yesterday.throw_rate.toFixed(1)}% ${throwRateTrend}\n`;
  message += `└─ 撿瓶轉化率：${report.funnel_metrics.today.catch_rate.toFixed(1)}% (${report.funnel_metrics.today.caught_users}人)\n`;
  message += `   └─ 昨日：${report.funnel_metrics.yesterday.catch_rate.toFixed(1)}% ${catchRateTrend}\n\n`;

  // 2. Social Depth
  message += `💬 **社交深度 (平均)**\n`;
  message += `├─ 平均對話來回：${report.social_depth_metrics.avg_rounds.toFixed(1)} 回 (一來一往算1回)\n`;
  message += `├─ 總對話數：${report.social_depth_metrics.total_conversations}\n`;
  message += `└─ 單方發言佔比：${report.social_depth_metrics.one_sided_rate.toFixed(1)}% (${report.social_depth_metrics.one_sided_count}個)\n\n`;

  // 3. Revenue (Existing)
  message += `💰 **收入數據**\n`;
  message += `├─ 本月收入：${report.vip_metrics.revenue.toFixed(0)} Stars\n`; // Simplified for now
  message += `├─ 總收入：${report.vip_metrics.revenue.toFixed(0)} Stars\n`; 
  message += `└─ VIP轉化數：${report.vip_metrics.conversions}\n\n`;

  // 4. Usage (Existing)
  message += `📦 **使用數據**\n`;
  message += `├─ 今日丟瓶數：${report.content_metrics.bottles_thrown}\n`;
  message += `├─ 今日撿瓶數：${report.content_metrics.bottles_caught}\n`;
  message += `├─ 活躍對話數：${report.user_metrics.dau}\n`; // Approximation
  message += `└─ DAU：${report.user_metrics.dau}\n\n`;

  // 5. Fortune
  message += `🔮 **命理數據**\n`;
  message += `├─ 新增檔案：${report.fortune_metrics.new_profiles} (總: ${report.fortune_metrics.total_profiles})\n`;
  message += `├─ 每日運勢：${report.fortune_metrics.daily_readings}\n`;
  message += `├─ 深度分析：${report.fortune_metrics.deep_readings}\n`;
  message += `└─ 廣告換額度：${report.fortune_metrics.ad_rewards}\n`;

  return message;
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

  // Get aggregated stats for the range
  const thirdPartyStats = await getAdStatsInRange(db, startDate, endDate);
  const officialStats = await getOfficialAdStatsInRange(db, startDate, endDate);

  // Build report
  const report: AdPerformanceReport = {
    period: {
      start: startDate,
      end: endDate,
    },
    third_party: {
      total_impressions: thirdPartyStats.total_ad_views,
      total_completions: thirdPartyStats.total_ad_completions,
      completion_rate: thirdPartyStats.completion_rate,
      total_rewards: thirdPartyStats.total_quota_earned,
    },
    official: {
      total_impressions: officialStats.total_impressions,
      total_clicks: officialStats.total_clicks,
      ctr: officialStats.ctr,
      total_rewards: officialStats.total_rewards,
    },
    provider_comparison: providerComparison,
  };

  return report;
}

/**
 * Format ad performance report for Telegram
 */
export async function formatAdPerformanceReport(
  report: AdPerformanceReport,
  i18n?: any
): Promise<string> {
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
export function formatVIPFunnelReport(report: any, i18n?: any): string {
  // Check if i18n is provided, if not, try to load default (but this function is synchronous, so it might fail if not passed)
  // Best practice: Always pass i18n from caller
  if (!i18n) {
    // Fallback: throw error or try to load (but we can't await here without changing signature to async)
    // Changing to async would require updating all callers.
    // For now, let's assume it's passed or fail gracefully.
    // But wait, createI18n is synchronous if translations are loaded? No, it's usually async import in this project structure?
    // Looking at other files, createI18n seems to be synchronous factory: const i18n = createI18n(...)
    // So we can try to require it if needed, but better to enforce passing it.
    // Let's modify the signature to require it or handle it.
    // But for safety, we should update the caller to pass it.
    console.error('[formatVIPFunnelReport] i18n not provided!');
    return 'Error: i18n missing';
  }

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
