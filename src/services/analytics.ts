import type { Env } from '../types';
import { createDatabaseClient } from '../db/client';
import { createTelegramService } from './telegram';
import {
    getEventCategory, 
    type AllEventTypes, 
    type AnalyticsEvent, 
    type FunnelType 
} from '../domain/analytics_events';

interface ModelBreakdown {
  [model: string]: {
    requests: number;
    tokens_in: number;
    tokens_out: number;
    cost: number;
  };
}

interface FeatureBreakdown {
  [feature: string]: {
    requests: number;
    cost: number;
  };
}

export interface FinancialReportData {
    date: string;
    totalIncome: number;
    totalAiCost: number;
    grossProfit: number;
    dau: number;
    modelBreakdown: ModelBreakdown;
    featureBreakdown: FeatureBreakdown;
}

export interface TrackEventOptions {
    event_type: AllEventTypes;
    user_id: string;
    user_type?: 'free' | 'vip';
    user_age_days?: number;
    event_data?: Record<string, any>;
    ad_provider?: string;
    ad_id?: number;
    ad_type?: string;
    session_id?: string;
}

export class AnalyticsService {
  private db;
  private env: Env;

  constructor(d1: D1Database, env: Env) {
    this.env = env;
    this.db = createDatabaseClient(env.DB);
  }

  // ============================================================================
  // Behavioral Tracking (Restored)
  // ============================================================================

  /**
   * Track a generic analytics event
   */
  async trackEvent(options: TrackEventOptions): Promise<void> {
    try {
        const category = getEventCategory(options.event_type);
        const query = `
            INSERT INTO analytics_events (
                event_type, event_category, user_id, user_type, user_age_days, 
                event_data, ad_provider, ad_id, ad_type, session_id, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `;
        
        await this.db.d1.prepare(query).bind(
            options.event_type,
            category,
            options.user_id,
            options.user_type || null,
            options.user_age_days || 0,
            options.event_data ? JSON.stringify(options.event_data) : null,
            options.ad_provider || null,
            options.ad_id || null,
            options.ad_type || null,
            options.session_id || null
        ).run();
    } catch (e) {
        console.error('[Analytics] trackEvent failed:', e);
    }
  }

  /**
   * Track a funnel step
   */
  async trackFunnelStep(
    userId: string,
    funnelType: FunnelType, 
    stepName: string, 
    stepOrder: number,
    stepData?: Record<string, any>,
    completed: boolean = false
  ): Promise<void> {
    try {
        const query = `
            INSERT INTO funnel_events (
                user_id, funnel_type, funnel_step, step_order, step_data, completed, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `;
        await this.db.d1.prepare(query).bind(
            userId,
            funnelType,
            stepName,
            stepOrder,
            stepData ? JSON.stringify(stepData) : null,
            completed ? 1 : 0
        ).run();
    } catch (e) {
        console.error('[Analytics] trackFunnelStep failed:', e);
    }
  }

  // ============================================================================
  // Financial Reporting (New)
  // ============================================================================

  /**
   * Aggregates yesterday's data into daily_financial_reports
   */
  async runDailySettlement(targetDate?: string): Promise<FinancialReportData> {
    // Default to yesterday if not provided
    const date = targetDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    console.log(`[Analytics] Running settlement for ${date}...`);

    // 1. AI Costs from ai_cost_logs (Fortune & New features)
    const aiLogs = await this.db.d1.prepare(`
      SELECT feature_type, model, SUM(cost_usd) as cost, COUNT(*) as count, SUM(input_tokens) as in_tok, SUM(output_tokens) as out_tok
      FROM ai_cost_logs
      WHERE date(created_at) = ?
      GROUP BY feature_type, model
    `).bind(date).all<any>();

    // 2. Translation Costs from legacy daily_translation_stats (if not yet migrated)
    const transLogs = await this.db.d1.prepare(`
      SELECT provider as model, SUM(cost_usd) as cost, SUM(request_count) as count
      FROM daily_translation_stats
      WHERE stat_date = ?
      GROUP BY provider
    `).bind(date).all<any>();

    // Aggregation Structures
    let totalAiCost = 0;
    const modelBreakdown: ModelBreakdown = {};
    const featureBreakdown: FeatureBreakdown = {};

    // Process AI Logs
    if (aiLogs.results) {
      for (const log of aiLogs.results) {
        totalAiCost += log.cost || 0;
        
        // Model breakdown
        if (!modelBreakdown[log.model]) modelBreakdown[log.model] = { requests: 0, tokens_in: 0, tokens_out: 0, cost: 0 };
        modelBreakdown[log.model].requests += log.count;
        modelBreakdown[log.model].tokens_in += log.in_tok;
        modelBreakdown[log.model].tokens_out += log.out_tok;
        modelBreakdown[log.model].cost += log.cost;

        // Feature breakdown
        const feature = log.feature_type || 'OTHER';
        if (!featureBreakdown[feature]) featureBreakdown[feature] = { requests: 0, cost: 0 };
        featureBreakdown[feature].requests += log.count;
        featureBreakdown[feature].cost += log.cost;
      }
    }

    // Process Translation Logs (Merge into breakdown)
    if (transLogs.results) {
      for (const log of transLogs.results) {
        const cost = log.cost || 0;
        totalAiCost += cost;
        
        // Treat provider as model for legacy stats
        const modelName = `translation-${log.model}`; 
        if (!modelBreakdown[modelName]) modelBreakdown[modelName] = { requests: 0, tokens_in: 0, tokens_out: 0, cost: 0 };
        modelBreakdown[modelName].requests += log.count;
        modelBreakdown[modelName].cost += cost;

        // Feature
        if (!featureBreakdown['TRANSLATION']) featureBreakdown['TRANSLATION'] = { requests: 0, cost: 0 };
        featureBreakdown['TRANSLATION'].requests += log.count;
        featureBreakdown['TRANSLATION'].cost += cost;
      }
    }

    // 3. Revenue (Stars)
    let totalRevenue = 0;
    try {
        const payments = await this.db.d1.prepare(`
            SELECT SUM(amount_stars) as stars FROM payment_transactions 
            WHERE date(created_at) = ? AND status = 'paid'
        `).bind(date).first<{ stars: number }>();
        // Approx 0.015 USD per Star 
        totalRevenue = (payments?.stars || 0) * 0.015; 
    } catch (e) {
        console.warn('[Analytics] Payment table query failed (table might not exist yet)', e);
    }

    // 4. Ad Revenue
    let adRevenue = 0;
    try {
        const ads = await this.db.d1.prepare(`
            SELECT COUNT(*) as count FROM ad_history WHERE date(created_at) = ?
        `).bind(date).first<{ count: number }>();
        // eCPM estimate: $10 per 1000 views => $0.01 per view
        adRevenue = (ads?.count || 0) * 0.01;
    } catch (e) {
        console.warn('[Analytics] Ad table query failed', e);
      }

    const totalIncome = totalRevenue + adRevenue;
    const grossProfit = totalIncome - totalAiCost;

    // 5. Activity (DAU)
    let dau = 0;
    try {
        const stats = await this.db.d1.prepare(`SELECT active_users FROM daily_stats WHERE stat_date = ?`).bind(date).first<{ active_users: number }>();
        dau = stats?.active_users || 0;
    } catch (e) { console.warn('[Analytics] DAU fetch failed', e); }

    // 6. Save to DB
    await this.db.d1.prepare(`
        INSERT OR REPLACE INTO daily_financial_reports 
        (date, total_revenue, total_cost, gross_profit, dau, fortune_count, fortune_cost, translation_cost, model_breakdown, feature_breakdown)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
        date, 
        totalIncome, 
        totalAiCost, 
        grossProfit, 
        dau, 
        featureBreakdown['FORTUNE']?.requests || 0,
        featureBreakdown['FORTUNE']?.cost || 0,
        featureBreakdown['TRANSLATION']?.cost || 0,
        JSON.stringify(modelBreakdown),
        JSON.stringify(featureBreakdown)
    ).run();

    return { date, totalIncome, totalAiCost, grossProfit, dau, modelBreakdown, featureBreakdown };
  }

  async sendReportToAdmin(reportData: FinancialReportData) {
    const telegram = createTelegramService(this.env);
    const { date, totalIncome, totalAiCost, grossProfit, dau, modelBreakdown, featureBreakdown } = reportData;

    let msg = `📊 **財務運營日報** (${date})\n\n`;
    
    msg += `💰 **營收概況**\n`;
    msg += `• 總收入: $${totalIncome.toFixed(2)}\n`;
    msg += `• 總成本: $${totalAiCost.toFixed(2)}\n`;
    msg += `• 毛利潤: $${grossProfit.toFixed(2)} (Margin: ${totalIncome > 0 ? ((grossProfit/totalIncome)*100).toFixed(1) : 0}%)\n\n`;

    msg += `💸 **成本分析 (Feature)**\n`;
    for (const [feature, data] of Object.entries(featureBreakdown) as [string, any][]) {
        const percent = totalAiCost > 0 ? ((data.cost / totalAiCost) * 100).toFixed(1) : 0;
        msg += `• ${feature}: $${data.cost.toFixed(3)} (${percent}%)\n`;
  }
    msg += `\n`;

    msg += `🤖 **模型消耗 Top 3**\n`;
    const sortedModels = Object.entries(modelBreakdown as ModelBreakdown)
        .sort(([, a], [, b]) => b.cost - a.cost)
        .slice(0, 3);
    
    for (const [model, data] of sortedModels) {
        msg += `• ${model}: $${data.cost.toFixed(3)} (${data.requests} reqs)\n`;
  }
    msg += `\n`;

    msg += `📈 **運營指標**\n`;
    msg += `• DAU: ${dau}\n`;
    if (dau > 0) {
        msg += `• ARPU: $${(totalIncome / dau).toFixed(3)}\n`;
        msg += `• CPU (Cost Per User): $${(totalAiCost / dau).toFixed(3)}\n`;
    }
    const fortuneReqs = featureBreakdown['FORTUNE']?.requests || 0;
    if (fortuneReqs > 0) {
        const costPerFortune = featureBreakdown['FORTUNE'].cost / fortuneReqs;
        msg += `• 單次算命成本: $${costPerFortune.toFixed(3)}\n`;
    }

    // Send to Admin Log Group (or Super Admins)
    const adminGroupId = this.env.ADMIN_LOG_GROUP_ID;
    if (adminGroupId) {
        await telegram.sendMessage(adminGroupId, msg);
    } else {
        // Fallback to Super Admin
        const superAdmin = this.env.SUPER_ADMIN_USER_ID;
        if (superAdmin) await telegram.sendMessage(superAdmin, msg);
    }
  }
}

// Factory function compatibility
export function createAnalyticsService(d1: D1Database, env: Env): AnalyticsService {
  return new AnalyticsService(d1, env);
}
