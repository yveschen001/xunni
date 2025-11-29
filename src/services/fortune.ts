import { D1Database } from '@cloudflare/workers-types';
import { Env, FortuneHistory, FortuneProfile, FortuneQuota, FortuneType, User } from '../types';
import { Solar, Lunar, EightChar } from 'lunar-javascript';
import { Body, Equator, Observer, SearchBody } from 'astronomy-engine';
import { FORTUNE_PROMPTS } from '../prompts/fortune';

export class FortuneService {
  private db: D1Database;
  private env: Env;

  constructor(env: Env, db: D1Database) {
    this.env = env;
    this.db = db;
  }

  /**
   * Calculate Astrological Data (Western + Chinese)
   */
  async calculateChart(dateStr: string, timeStr: string | undefined, lat?: number, lng?: number) {
    // Parse Date
    const dateParts = dateStr.split('-').map(Number);
    const year = dateParts[0];
    const month = dateParts[1];
    const day = dateParts[2];
    
    // Parse Time (default to 12:00 if unknown)
    let hour = 12;
    let minute = 0;
    if (timeStr) {
      const timeParts = timeStr.split(':').map(Number);
      hour = timeParts[0];
      minute = timeParts[1];
    }
    
    // 1. Chinese BaZi (Lunar JavaScript)
    // Lunar.fromSolar(year, month, day)
    const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
    const lunar = solar.getLunar();
    const eightChar = lunar.getEightChar();
    
    const chineseChart = {
      lunar_date: lunar.toString(),
      eight_char: eightChar.toString(), // e.g. "甲子 乙丑 丙寅 丁卯"
      day_master: eightChar.getDayGan().toString(), // 日主 (Core self)
      wuxing: lunar.getBaZiWuXing(), // 五行
      animals: {
        year: lunar.getYearShengXiao(),
        month: lunar.getMonthShengXiao(),
        day: lunar.getDayShengXiao(),
        time: lunar.getTimeShengXiao(),
      }
    };

    // 2. Western Astrology (Astronomy Engine)
    // Need accurate Date object for astronomy-engine
    // Note: astronomy-engine uses JS Date object which might be UTC. 
    // We should treat input time as local time at the location if coordinates provided, 
    // but astronomy-engine usually takes UTC Date. 
    // For simplicity, we might assume user input time is local, convert to UTC approx or strict if we know timezone.
    // For now, let's assume the date/time is roughly correct for simple planetary positions.
    // If we have lat/lng, we can be more precise.
    
    const date = new Date(year, month - 1, day, hour, minute);
    // TODO: Handle Timezone properly. For now, using system local or UTC depending on runtime. 
    // Ideally we should ask Google Maps API for timezone of the city, store it in profile.
    
    const westernChart = {
      sun_sign: this.getSunSign(month, day), // Simple zodiac
      // TODO: Calculate Moon sign using astronomy-engine (requires robust timezone handling)
      moon_phase: 'Unknown', // lunar.getPhase() not available in this version
    };

    return {
      solar_date: `${year}-${month}-${day} ${hour}:${minute}`,
      chinese: chineseChart,
      western: westernChart,
    };
  }
  
  async updateProfileSubscription(id: number, status: number): Promise<void> {
    await this.db.prepare('UPDATE fortune_profiles SET is_subscribed = ? WHERE id = ?')
      .bind(status, id)
      .run();
  }

  private getSunSign(month: number, day: number): string {
    const signs = [
      'Aquarius', 'Pisces', 'Aries', 'Taurus', 'Gemini', 'Cancer', 
      'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn'
    ];
    const cutoff = [20, 19, 21, 20, 21, 21, 23, 23, 23, 23, 22, 22];
    let index = month - 1;
    if (day < cutoff[index]) {
      index = index - 1;
    }
    if (index < 0) index = 11;
    return signs[index];
  }

  // ==========================================================
  // Profile Management
  // ==========================================================

  async createProfile(userId: string, data: Partial<FortuneProfile>): Promise<FortuneProfile | null> {
    const { 
      name, gender, birth_date, birth_time, is_birth_time_unknown, 
      birth_city, birth_location_lat, birth_location_lng 
    } = data;
    
    // Check if default exists
    const existing = await this.getProfiles(userId);
    const isDefault = existing.length === 0 ? 1 : 0;

    const query = `
      INSERT INTO fortune_profiles (
        user_id, name, gender, birth_date, birth_time, is_birth_time_unknown,
        birth_city, birth_location_lat, birth_location_lng, is_default
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `;
    
    try {
      const result = await this.db.prepare(query)
        .bind(
          userId, name, gender, birth_date, birth_time, is_birth_time_unknown || 0,
          birth_city, birth_location_lat, birth_location_lng, isDefault
        )
        .first<FortuneProfile>();
      return result;
    } catch (e) {
      console.error('Error creating profile:', e);
      return null;
    }
  }

  async getProfiles(userId: string): Promise<FortuneProfile[]> {
    const query = `SELECT * FROM fortune_profiles WHERE user_id = ? ORDER BY is_default DESC, created_at ASC`;
    const { results } = await this.db.prepare(query).bind(userId).all<FortuneProfile>();
    return results;
  }
  
  async deleteProfile(userId: string, profileId: number): Promise<boolean> {
    const query = `DELETE FROM fortune_profiles WHERE id = ? AND user_id = ?`;
    const res = await this.db.prepare(query).bind(profileId, userId).run();
    return res.success;
  }

  // ==========================================================
  // Quota Management
  // ==========================================================
  
  async ensureQuota(userId: string) {
    const query = `
      INSERT INTO fortune_quota (telegram_id, weekly_free_quota) 
      VALUES (?, 0) 
      ON CONFLICT(telegram_id) DO NOTHING
    `;
    await this.db.prepare(query).bind(userId).run();
  }
  
  async getQuota(userId: string): Promise<FortuneQuota | null> {
    return await this.db.prepare('SELECT * FROM fortune_quota WHERE telegram_id = ?').bind(userId).first<FortuneQuota>();
  }
  
  async refreshQuota(userId: string, isVip: boolean): Promise<FortuneQuota> {
    let quota = await this.getQuota(userId);
    if (!quota) {
      await this.ensureQuota(userId);
      quota = await this.getQuota(userId);
    }
    if (!quota) throw new Error('Failed to init quota');

    const now = new Date();
    let lastReset = new Date(0);
    try {
      lastReset = quota.last_reset_at ? new Date(quota.last_reset_at) : new Date(0);
      if (isNaN(lastReset.getTime())) lastReset = new Date(0);
    } catch (e) {
      console.error('[FortuneService] Error parsing last_reset_at:', e);
    }
    let shouldReset = false;
    const targetAmount = isVip ? 1 : 1; // VIP 1/day, Free 1/week

    if (isVip) {
      // Daily reset (UTC)
      const isSameDay = now.toISOString().split('T')[0] === lastReset.toISOString().split('T')[0];
      if (!isSameDay) shouldReset = true;
    } else {
      // Weekly reset (Monday)
      // Check if we entered a new week since last_reset
      const lastResetSolar = Solar.fromDate(lastReset);
      const nowSolar = Solar.fromDate(now);
      
      // Simple check: If year diff or week diff
      // Note: Lunar lib getWeek() might be ISO week?
      // Let's use simple JS logic for Monday reset
      // Calculate "Monday of the week" for both dates
      const getMonday = (d: Date) => {
        const date = new Date(d); // Clone to avoid side effect
        const day = date.getDay(); // 0-6 (Sun-Sat)
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        date.setDate(diff);
        date.setHours(0,0,0,0);
        return date.getTime();
      };
      
      if (getMonday(now) > getMonday(lastReset)) {
        shouldReset = true;
      }
    }

    if (shouldReset) {
      await this.db.prepare(`
        UPDATE fortune_quota 
        SET weekly_free_quota = ?, last_reset_at = ? 
        WHERE id = ?
      `).bind(targetAmount, now.toISOString(), quota.id).run();
      
      quota.weekly_free_quota = targetAmount;
      quota.last_reset_at = now.toISOString();
    }
    
    return quota;
  }
  
  async checkQuota(userId: string, isVip: boolean): Promise<boolean> {
    const quota = await this.refreshQuota(userId, isVip);
    return (quota.weekly_free_quota > 0 || quota.additional_quota > 0);
  }
  
  async deductQuota(userId: string, isVip: boolean): Promise<boolean> {
    const quota = await this.refreshQuota(userId, isVip);
    
    if (quota.weekly_free_quota > 0) {
      await this.db.prepare('UPDATE fortune_quota SET weekly_free_quota = weekly_free_quota - 1 WHERE id = ?').bind(quota.id).run();
      return true;
    }
    
    if (quota.additional_quota > 0) {
      await this.db.prepare('UPDATE fortune_quota SET additional_quota = additional_quota - 1 WHERE id = ?').bind(quota.id).run();
      return true;
    }
    
    return false;
  }

  // ==========================================================
  // Fortune Generation
  // ==========================================================

  private async callGemini(prompt: string, model = 'gemini-1.5-pro-latest'): Promise<string> {
    const apiKey = this.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) throw new Error('Gemini API Key missing');
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    
    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini API Error:', err);
      throw new Error(`Gemini API Error: ${response.status}`);
    }
    
    const data = await response.json() as any;
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  async generateFortune(
    user: User, 
    profile: FortuneProfile, 
    type: FortuneType, 
    targetDate: string, // YYYY-MM-DD
    targetProfile?: FortuneProfile
  ): Promise<FortuneHistory> {
    // 1. Check Cache
    let query = `SELECT * FROM fortune_history WHERE telegram_id = ? AND type = ? AND target_date = ?`;
    const params: any[] = [user.telegram_id, type, targetDate];
    
    if (type === 'match' && targetProfile) {
      query += ` AND target_person_name = ?`;
      params.push(targetProfile.name);
    }
    
    const cached = await this.db.prepare(query).bind(...params).first<FortuneHistory>();
    if (cached) return cached;

    // 2. Check Quota (if not cached)
    const isVip = !!(user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > new Date());
    // For match/deep types, maybe we require more quota? 
    // For now, let's assume 1 token per request regardless of type, or maybe deep needs VIP?
    // Implementation: Deduct 1 quota.
    const hasQuota = await this.deductQuota(user.telegram_id, isVip);
    if (!hasQuota) {
      throw new Error('QUOTA_EXCEEDED');
    }

    // 3. Calculate Chart
    const chart = await this.calculateChart(profile.birth_date, profile.birth_time, profile.birth_location_lat, profile.birth_location_lng);
    
    // 4. Build Prompt
    let systemPrompt = FORTUNE_PROMPTS.SYSTEM_ROLE;
    // Add User Language constraint to system prompt just in case
    systemPrompt += `\nLanguage: ${user.language_pref || 'zh-TW'}`;

    let userPrompt = `User Data: Gender=${profile.gender}, Birth=${profile.birth_date} ${profile.birth_time || 'Unknown'}.\n`;
    userPrompt += `Chart Data: ${JSON.stringify(chart)}\n`;
    userPrompt += `Target Date: ${targetDate}\n`;

    if (type === 'match' && targetProfile) {
      const targetChart = await this.calculateChart(targetProfile.birth_date, targetProfile.birth_time, targetProfile.birth_location_lat, targetProfile.birth_location_lng);
      userPrompt += `Target Person: Name=${targetProfile.name}, Gender=${targetProfile.gender}, Birth=${targetProfile.birth_date}.\n`;
      userPrompt += `Target Chart: ${JSON.stringify(targetChart)}\n`;
      userPrompt += FORTUNE_PROMPTS.MATCH;
    } else if (type === 'daily') {
      userPrompt += FORTUNE_PROMPTS.DAILY;
    } else if (type === 'deep') {
      userPrompt += FORTUNE_PROMPTS.DEEP;
    }

    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    
    // 5. Call AI
    const content = await this.callGemini(fullPrompt);
    
    // 6. Save History
    const insertQuery = `
      INSERT INTO fortune_history (
        telegram_id, type, target_date, target_person_name, target_person_birth, 
        content, provider, model, tokens_used
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `;
    
    const result = await this.db.prepare(insertQuery).bind(
      user.telegram_id, type, targetDate, 
      targetProfile?.name || null, targetProfile?.birth_date || null,
      content, 'gemini', 'gemini-1.5-pro', 0
    ).first<FortuneHistory>();
    
    if (!result) throw new Error('Failed to save fortune history');
    return result;
  }
}

