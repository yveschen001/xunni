import * as AstronomyLib from 'astronomy-engine';
// Handle CJS/ESM interop
// @ts-ignore
const Astronomy = AstronomyLib.default || AstronomyLib;

import { D1Database } from '@cloudflare/workers-types';
import { Solar } from 'lunar-javascript';
import { Env, FortuneHistory, FortuneProfile, FortuneQuota, FortuneType, User } from '../types';
import { FORTUNE_PROMPTS } from '../prompts/fortune';

function getZodiacFromLon(lon: number): string {
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  // Normalize 0-360
  let norm = lon % 360;
  if (norm < 0) norm += 360;
  const index = Math.floor(norm / 30);
  return signs[index];
}

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
    let isExactTime = false;

    if (timeStr) {
      const timeParts = timeStr.split(':').map(Number);
      hour = timeParts[0];
      minute = timeParts[1];
      isExactTime = true;
    }
    
    // 1. Chinese BaZi (Lunar JavaScript)
    // Precise Solar Time Correction if longitude is available
    let solar: Solar;
    
    if (lng != null && isExactTime) {
      // Calculate Time Equation/Offset
      // Base assumption: Input is Local Mean Time or close to it? 
      // Actually, BaZi requires True Solar Time.
      // Solar.fromYmdHms creates an object. We can use `Solar.fromBaZi` logic if we had pillars, 
      // but here we go from Date -> Pillars.
      // Correct approach: Adjust the timestamp for Longitude before creating Solar object?
      // No, l6.js (lunar-javascript) works with standard dates.
      // However, for high precision, we should adjust the minutes passed to it.
      // Approx: 1 degree longitude = 4 minutes time difference from UTC? 
      // No, we need offset from the Timezone Center.
      // Assuming user input is "Wall Clock Time". We assume a standard timezone (e.g. +8 for CN/TW).
      // We don't know the timezone! This is a limitation.
      // But we can pretend input is UTC and shift it? No.
      // Let's rely on standard calculation for now but mark it as "Standard".
      solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
    } else {
      solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
    }

    const lunar = solar.getLunar();
    const eightChar = lunar.getEightChar();
    
    const chineseChart = {
      lunar_date: lunar.toString(),
      eight_char: eightChar.toString(), // e.g. "甲子 乙丑 丙寅 丁卯"
      day_master: eightChar.getDayGan().toString(), // 日主 (Core self)
      month_branch: eightChar.getMonthZhi().toString(), // 月支 (Season)
      wuxing: lunar.getBaZiWuXing(), // 五行
      animals: {
        year: lunar.getYearShengXiao(),
        month: lunar.getMonthShengXiao(),
        day: lunar.getDayShengXiao(),
        time: lunar.getTimeShengXiao(),
      },
      precision: (lng != null && isExactTime) ? 'high' : 'standard'
    };

    // 2. Western Astrology (Astronomy Engine)
    const westernChart: any = {
      precision: 'low',
      sun_sign: this.getSunSign(month, day), // Fallback
      moon_sign: 'Unknown',
      ascendant: 'Unknown',
      planets: {}
    };

    if (lat != null && lng != null) {
        try {
            // Assume Input Time is roughly correct local time.
            // Convert to UTC for Astronomy Engine.
            // Without Timezone lib, we approximate UTC = Local - (Lng/15).
            // This is "Mean Solar Time" approximation which is better than raw input if we assumed UTC.
            const tzOffsetHours = lng / 15;
            const dateObj = new Date(Date.UTC(year, month - 1, day, hour, minute));
            const utcTime = dateObj.getTime() - (tzOffsetHours * 3600 * 1000);
            const utcDate = new Date(utcTime);
            
            const observer = new Astronomy.Observer(lat, lng, 0);
            
            // Calculate Planets
            const bodies = [
                { name: 'Sun', body: Astronomy.Body.Sun },
                { name: 'Moon', body: Astronomy.Body.Moon },
                { name: 'Mercury', body: Astronomy.Body.Mercury },
                { name: 'Venus', body: Astronomy.Body.Venus },
                { name: 'Mars', body: Astronomy.Body.Mars },
                { name: 'Jupiter', body: Astronomy.Body.Jupiter },
                { name: 'Saturn', body: Astronomy.Body.Saturn }
            ];

            const planets: Record<string, string> = {};

            for (const item of bodies) {
                // GeoVector gives position relative to Earth center
                const vector = Astronomy.GeoVector(item.body, utcDate, true); // true = aberration correction
                // Ecliptic coordinates (Longitude/Latitude)
                // Use default J2000 equinox? Or of date? 
                // Ecliptic(vector) assumes J2000 equator input usually.
                // Let's use Heliocentric -> Geo -> Ecliptic proper flow if needed, 
                // but GeoVector output is Equator J2000.
                // Astronomy.Ecliptic converts Equator J2000 to Ecliptic J2000.
                const ecliptic = Astronomy.Ecliptic(vector);
                planets[item.name.toLowerCase()] = getZodiacFromLon(ecliptic.lon);
            }

            westernChart.planets = planets;
            westernChart.sun_sign = planets.sun;
            westernChart.moon_sign = planets.moon;
            
            if (isExactTime) {
                // Calculate Ascendant
                // Needs Sidereal Time
                const dateVal = utcDate; // Date object works
                const astroTime = Astronomy.MakeTime(dateVal);
                const sidereal = Astronomy.SiderealTime(astroTime);
                // RAMC = GST + Longitude (in hours)
                // Greenwich Sidereal Time (hours)
                // Local Sidereal Time = GST + Lng/15
                const lst = sidereal + (lng / 15);
                const ramc = lst * 15; // Convert to degrees
                
                // Obliquity of Ecliptic (Use e_tilt)
                const eps = Astronomy.e_tilt(astroTime);
                
                // Ascendant Formula: atan2(y, x)
                // y = -cos(RAMC)
                // x = sin(RAMC) * cos(eps) + tan(lat) * sin(eps)
                const rad = Math.PI / 180;
                const ramcRad = ramc * rad;
                // e_tilt returns { tobl, mobl, ... }. Use tobl (True Obliquity)
                const obliquityVal = typeof eps === 'number' ? eps : (eps as any).tobl || (eps as any).mobl || 23.44;
                const finalEpsRad = obliquityVal * rad;
                const latRad = lat * rad;

                const y = -Math.cos(ramcRad);
                const x = (Math.sin(ramcRad) * Math.cos(finalEpsRad)) + (Math.tan(latRad) * Math.sin(finalEpsRad));
                
                let asc = Math.atan2(y, x) / rad;
                if (asc < 0) asc += 360;
                
                westernChart.ascendant = getZodiacFromLon(asc);
                westernChart.precision = 'high';
            } else {
                westernChart.precision = 'medium'; // Has planets, no houses
            }

        } catch (e) {
            console.error('Astronomy calculation error:', e);
        }
    }

    return {
      solar_date: `${year}-${month}-${day} ${hour}:${minute}`,
      is_exact_time: isExactTime,
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

  async updateProfile(userId: string, profileId: number, data: Partial<FortuneProfile>): Promise<boolean> {
    const allowedFields = ['name', 'gender', 'birth_date', 'birth_time', 'is_birth_time_unknown', 'birth_city', 'birth_location_lat', 'birth_location_lng'];
    const updates: string[] = [];
    const params: any[] = [];

    for (const key of allowedFields) {
      if (data[key as keyof FortuneProfile] !== undefined) {
        updates.push(`${key} = ?`);
        params.push(data[key as keyof FortuneProfile]);
      }
    }

    if (updates.length === 0) return false;

    const query = `UPDATE fortune_profiles SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
    params.push(profileId, userId);

    try {
      const res = await this.db.prepare(query).bind(...params).run();
      return res.success;
    } catch (e) {
      console.error('Error updating profile:', e);
      return false;
    }
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

  async refundQuota(userId: string, isVip: boolean): Promise<void> {
    const quota = await this.getQuota(userId);
    if (!quota) return;

    // Refund policy: Attempt to restore weekly/daily quota first if it was used (not maxed)
    // VIP Daily Max = 1, Free Weekly Max = 1 (usually, defined in refreshQuota logic)
    // Actually, refreshQuota sets it to 1.
    // So if current < 1, we can increment it.
    
    const maxFree = 1; // Assuming 1 for now based on refreshQuota logic
    
    if (quota.weekly_free_quota < maxFree) {
        await this.db.prepare('UPDATE fortune_quota SET weekly_free_quota = weekly_free_quota + 1 WHERE id = ?').bind(quota.id).run();
    } else {
        // Otherwise refund to additional (stored) quota
        await this.db.prepare('UPDATE fortune_quota SET additional_quota = additional_quota + 1 WHERE id = ?').bind(quota.id).run();
    }
  }

  async isFortuneCached(userId: string, type: FortuneType, targetDate: string, targetName?: string): Promise<boolean> {
    let query = `SELECT 1 FROM fortune_history WHERE telegram_id = ? AND type = ? AND target_date = ?`;
    const params: any[] = [userId, type, targetDate];
    if (type === 'match' && targetName) {
      query += ` AND target_person_name = ?`;
      params.push(targetName);
    }
    const result = await this.db.prepare(query).bind(...params).first();
    return !!result;
  }
  
  // ==========================================================
  // Smart Helpers
  // ==========================================================

  async correctCityName(userInput: string, userLang: string): Promise<string | null> {
    const prompt = `
      User Input: "${userInput}"
      Task: Identify the city name from the input. Correct typos or translate to standard English or local name suitable for database search.
      Output: Return ONLY the corrected city name. If invalid or unknown, return "null".
      Examples:
      "Taipeu" -> "Taipei"
      "Taibei" -> "Taipei"
      "New York" -> "New York"
      "unknown123" -> "null"
    `;
    
    try {
      // Use 'gemini-pro' or 'gemini-1.5-pro' if 'gemini-1.5-flash' is not available
      // Try Gemini First
      const result = await this.callGemini(prompt, 'gemini-1.5-pro'); 
      const cleaned = result.content.trim().replace(/['"]/g, '');
      if (cleaned.toLowerCase() === 'null') return null;
      return cleaned;
    } catch (e) {
      console.warn('Smart City Correction (Gemini) Failed, trying OpenAI fallback...', e);
      // Fallback to OpenAI
      try {
        const result = await this.callOpenAI(prompt, 'gpt-4o-mini');
        const cleaned = result.content.trim().replace(/['"]/g, '');
        if (cleaned.toLowerCase() === 'null') return null;
        return cleaned;
      } catch (e2) {
        console.error('Smart City Correction (OpenAI) Failed:', e2);
        return null;
      }
    }
  }

  // ==========================================================
  // Fortune Generation
  // ==========================================================

  private async callOpenAI(prompt: string, model: string, systemInstruction?: string): Promise<{ content: string, usage?: any }> {
    const apiKey = this.env.OPENAI_API_KEY;
    
    if (!apiKey) throw new Error('OpenAI API Key missing');

    const messages = [];
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    } else {
        // Fallback generic system prompt if none provided (though we expect one now)
        messages.push({ role: 'system', content: 'You are a helpful assistant. Return ONLY the requested output without formatting or markdown.' });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`OpenAI API Error (${model}):`, err);
      throw new Error(`OpenAI API Error: ${response.status}`);
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content?.trim() || '';
    return { content, usage: data.usage };
  }

  private async callGemini(prompt: string, model = 'gemini-2.0-flash', systemInstruction?: string): Promise<{ content: string, usage?: any }> {
    const apiKey = this.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) throw new Error('Gemini API Key missing');
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const body: any = {
      contents: [{ parts: [{ text: prompt }] }]
    };

    if (systemInstruction) {
      body.system_instruction = {
        parts: [{ text: systemInstruction }]
      };
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini API Error:', err);
      throw new Error(`Gemini API Error: ${response.status}`);
    }
    
    const data = await response.json() as any;
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { content, usage: data.usageMetadata };
  }

  async generateFortune(
    user: User, 
    profile: FortuneProfile, 
    type: FortuneType, 
    targetDate: string, // YYYY-MM-DD
    targetProfile?: FortuneProfile,
    targetUserId?: string, // Optional real user ID for matches
    context?: any, // Extra data for specific types (e.g. Tarot cards)
    onProgress?: (message: string) => Promise<void> // UI Update Callback
  ): Promise<FortuneHistory> {
    // 1. Check Cache
    let query = `SELECT * FROM fortune_history WHERE telegram_id = ? AND type = ? AND target_date = ?`;
    const params: any[] = [user.telegram_id, type, targetDate];
    
    if ((type === 'match' || type === 'love_match') && targetProfile) {
      query += ` AND target_person_name = ?`;
      params.push(targetProfile.name);
    }
    
    // Fetch ALL candidates, then filter by context in JS
    const candidates = await this.db.prepare(query).bind(...params).all<FortuneHistory>();
    let cached: FortuneHistory | null = null;

    if (candidates.results && candidates.results.length > 0) {
        // If context sensitive (love_match), filter by relationship type
        if (type === 'love_match' && context && context.relationship_type) {
            for (const c of candidates.results) {
                if (c.profile_snapshot) {
                    try {
                        const snap = JSON.parse(c.profile_snapshot);
                        // Check if cached context matches current context
                        if (snap.context && 
                            snap.context.relationship_type === context.relationship_type &&
                            snap.context.family_role === context.family_role) {
                            cached = c;
                            break;
                        }
                    } catch (e) {
                        // ignore parse error
                    }
                }
            }
        } else {
            // Default behavior: take the first one (most recent usually if no order specified, but D1 order is undefined without ORDER BY)
            // Let's assume the first one is fine for non-context types
            cached = candidates.results[0];
        }
    }

    // TODO: Add strict snapshot check for cached items here too? 
    // For now, rely on "if inputs changed, key params might change" or Section 2.4 logic on retrieval.
    if (cached) return cached;

    // 2. Check Quota (if not cached)
    const isVip = !!(user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > new Date());
    const hasQuota = await this.deductQuota(user.telegram_id, isVip);
    if (!hasQuota) {
      throw new Error('QUOTA_EXCEEDED');
    }

    // 3. Calculate Chart
    try {
    const chart = await this.calculateChart(
      profile.birth_date, 
      profile.is_birth_time_unknown ? undefined : (profile.birth_time || undefined), 
      profile.birth_location_lat ?? undefined, 
      profile.birth_location_lng ?? undefined
    );
    
    // 4. Build Prompt Context (Data First, Query Last)
    let systemPrompt = FORTUNE_PROMPTS.SYSTEM_ROLE;
    
    // Inject Language into System Prompt (Optimized for Gemini 2.5)
    const userLang = user.language_pref || 'zh-TW';
    console.log(`[FortuneService] User Lang: ${userLang}`);
    
    // Create i18n instance for localized progress
    const { createI18n } = await import('../i18n');
    const i18n = createI18n(userLang);
    
    // Map code to natural language name for better adherence
    const LANG_NAMES: Record<string, string> = {
      'zh-TW': 'Traditional Chinese (Taiwan)',
      'zh-CN': 'Simplified Chinese',
      'en': 'English',
      'ja': 'Japanese',
      'ko': 'Korean',
      'vi': 'Vietnamese',
      'th': 'Thai',
      'id': 'Indonesian',
      // Add major languages as needed, fallback to code if missing
    };
    const langName = LANG_NAMES[userLang] || userLang;
    
    systemPrompt = systemPrompt.replace(/{LANGUAGE}/g, langName);
    systemPrompt += `\n\n⚠️ CRITICAL: You MUST respond in ${langName}. Even if the user data contains text in other languages, your analysis and output must be in ${langName}.`;

    // Get Localized Zodiac for Context
    let localizedZodiac = '';
    try {
      const { createI18n } = await import('../i18n');
      const i18n = createI18n(userLang);
      const { getZodiacDisplay, getZodiacSign } = await import('../domain/zodiac');
      // Calculate zodiac from birth date
      const birthDate = new Date(profile.birth_date);
      const zodiacSign = getZodiacSign(birthDate);
      localizedZodiac = getZodiacDisplay(zodiacSign, i18n);
      console.log(`[FortuneService] Zodiac: ${zodiacSign} -> ${localizedZodiac} (Lang: ${userLang})`);
    } catch (e) {
      console.warn('Failed to localize zodiac for prompt context', e);
    }

    // Format Interests (VIP Only)
    let interests = 'Not provided';
    let jobRole = 'Not provided';
    let industry = 'Not provided';

    // VIP Feature: Personalization Data
    if (isVip) {
      if (user.interests) {
        try {
          const interestsArray = JSON.parse(user.interests);
          if (Array.isArray(interestsArray) && interestsArray.length > 0) {
            interests = interestsArray.join(', ');
          } else {
            interests = user.interests; // Fallback
          }
        } catch (e) {
          interests = user.interests; // Fallback
        }
      }
      jobRole = user.job_role || 'Not provided';
      industry = user.industry || 'Not provided';
    } else {
      // Free User: Explicitly state data is unavailable due to tier
      interests = 'Not available (Standard Tier)';
      jobRole = 'Not available (Standard Tier)';
      industry = 'Not available (Standard Tier)';
    }

    // RE-INSERTING TARGET CHART CALCULATION
    let targetChartStr = '';
    if ((type === 'match' || type === 'love_match') && targetProfile) {
       const targetChart = await this.calculateChart(
          targetProfile.birth_date, 
          targetProfile.birth_time, 
          targetProfile.birth_location_lat, 
          targetProfile.birth_location_lng
       );
       targetChartStr = `Target Chart: ${JSON.stringify(targetChart)}`;
    }

    // Construct XML Context (Optimized for Gemini)
    const getYear = (dateStr: string) => parseInt(dateStr.split('-')[0]);
    const getDateObj = (dateStr: string) => new Date(dateStr);
    
    const userBirthYear = getYear(profile.birth_date);
    const targetBirthYear = targetProfile ? getYear(targetProfile.birth_date) : 0;
    
    // KINSHIP LOGIC
    let kinshipXml = '';
    if ((type === 'match' || type === 'love_match') && targetProfile) {
        const userDate = getDateObj(profile.birth_date);
        const targetDate = getDateObj(targetProfile.birth_date);
        const isUserOlder = userDate < targetDate;
        const ageGapYears = Math.abs(userDate.getFullYear() - targetDate.getFullYear());
        
        let userRole = 'Partner';
        let targetRole = 'Partner';
        const relType = context?.relationship_type || 'love';
        const userGender = profile.gender;
        const targetGender = targetProfile.gender;

        if (relType === 'family' || relType === 'siblings') {
            if (isUserOlder) {
                userRole = userGender === 'male' ? 'Older Brother (哥哥)' : 'Older Sister (姊姊)';
                targetRole = targetGender === 'male' ? 'Younger Brother (弟弟)' : 'Younger Sister (妹妹)';
            } else {
                userRole = userGender === 'male' ? 'Younger Brother (弟弟)' : 'Younger Sister (妹妹)';
                targetRole = targetGender === 'male' ? 'Older Brother (哥哥)' : 'Older Sister (姊姊)';
            }
        } else if (relType === 'love') {
             if (isUserOlder) {
                userRole = userGender === 'male' ? 'Older Boyfriend' : 'Older Girlfriend';
                targetRole = targetGender === 'male' ? 'Younger Boyfriend' : 'Younger Girlfriend';
             } else {
                userRole = userGender === 'male' ? 'Younger Boyfriend' : 'Younger Girlfriend';
                targetRole = targetGender === 'male' ? 'Older Boyfriend' : 'Older Girlfriend';
             }
        }

        kinshipXml = `
  <kinship_logic>
    <is_user_older>${isUserOlder}</is_user_older>
    <user_role>${userRole}</user_role>
    <target_role>${targetRole}</target_role>
    <age_gap>${ageGapYears} years</age_gap>
    <relationship_context>${relType}</relationship_context>
  </kinship_logic>`;
    }

    const contextXml = `
<context_data>
  <user_profile>
    <name>${profile.name}</name>
    <gender>${profile.gender}</gender>
    <birth>${profile.birth_date} ${(!profile.is_birth_time_unknown && profile.birth_time) ? profile.birth_time : 'Unknown Time'}</birth>
    <birth_year>${userBirthYear}</birth_year>
    <user_language>${langName}</user_language>
    <zodiac>${localizedZodiac}</zodiac>
    <location>${profile.birth_city || 'Unknown'}</location>
    <mbti>${user.mbti_result || 'Unknown'}</mbti>
    <blood_type>${user.blood_type || 'Unknown'}</blood_type>
    <job_role>${jobRole}</job_role>
    <industry>${industry}</industry>
    <interests>${interests}</interests>
  </user_profile>
  
  <request_info>
    <target_date>${targetDate}</target_date>
    <fortune_type>${type}</fortune_type>
  </request_info>

  <chart_data>
    ${JSON.stringify(chart)}
  </chart_data>

  ${targetProfile ? `<target_profile>
    <name>${targetProfile.name}</name>
    <birth>${targetProfile.birth_date} ${(!targetProfile.is_birth_time_unknown && targetProfile.birth_time) ? targetProfile.birth_time : 'Unknown Time'}</birth>
    <birth_year>${targetBirthYear}</birth_year>
    <gender>${targetProfile.gender}</gender>
    <location>${targetProfile.birth_city || 'Unknown'}</location>
  </target_profile>` : ''}
  
  ${targetChartStr ? `<target_chart>${targetChartStr}</target_chart>` : ''}
  
  ${kinshipXml}
  
  ${context ? `<extra_context>${JSON.stringify(context)}</extra_context>` : ''}
</context_data>
`;

    // --- CHAINED GENERATION LOGIC ---
    // Define chains for multi-step generation
    const CHAINED_PROMPTS: Record<string, (keyof typeof FORTUNE_PROMPTS)[]> = {
      'daily': ['DAILY_1', 'DAILY_2', 'DAILY_3'],
      'weekly': ['WEEKLY_1', 'WEEKLY_2', 'WEEKLY_3', 'WEEKLY_4', 'WEEKLY_5'],
      'love_match': ['LOVE_MATCH_1', 'LOVE_MATCH_2', 'LOVE_MATCH_3', 'LOVE_MATCH_4', 'LOVE_MATCH_5'],
      'love_ideal': ['LOVE_IDEAL_1', 'LOVE_IDEAL_2', 'LOVE_IDEAL_3'],
      'ziwei': ['ZIWEI_1', 'ZIWEI_2', 'ZIWEI_3', 'ZIWEI_4', 'ZIWEI_5'],
      'astrology': ['ASTROLOGY_1', 'ASTROLOGY_2', 'ASTROLOGY_3', 'ASTROLOGY_4', 'ASTROLOGY_5'],
      'bazi': ['BAZI_1', 'BAZI_2', 'BAZI_3', 'BAZI_4', 'BAZI_5'],
      'tarot': ['TAROT_1', 'TAROT_2', 'TAROT_3', 'TAROT_4', 'TAROT_5'],
      'celebrity': ['CELEBRITY_1', 'CELEBRITY_2', 'CELEBRITY_3', 'CELEBRITY_4', 'CELEBRITY_5'],
    };

    let content = '';
    let provider = 'gemini';
    let model = 'gemini-2.0-flash-lite'; 
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    const chain = CHAINED_PROMPTS[type];

    if (chain) {
      // Execute Chain
      console.log(`[FortuneService] Starting chained generation for ${type} (${chain.length} steps)`);
      const parts: string[] = [];
      
      for (let i = 0; i < chain.length; i++) {
        const promptKey = chain[i];
        
        // Progress Update
        if (onProgress) {
            // "Analyzing Part X/Y..." (Localized)
            const progressIcons = ['🌑', '🌒', '🌓', '🌔', '🌕'];
            const icon = progressIcons[Math.min(i, progressIcons.length - 1)];
            const stepNum = i + 1;
            const total = chain.length;
            const analyzingText = i18n.t('common.analyzing'); // "Analyzing..."
            await onProgress(`${icon} ${analyzingText} (${stepNum}/${total})`);
        }

        let taskPrompt = FORTUNE_PROMPTS[promptKey];
        
        // Inject Strong Language Directive (Crucial for multi-stage)
        taskPrompt += `\n\nIMPORTANT: You MUST answer in ${langName}.`;

        // Inject Relationship Context (for Match)
        if (type === 'love_match' && context && context.relationship_type) {
            const relType = context.relationship_type;
            const familyRole = context.family_role || 'Partner';
            
            // Simple replace for placeholders if they exist
            taskPrompt = taskPrompt.replace('{Relationship Type}', relType);
            taskPrompt = taskPrompt.replace('{Role}', familyRole);
            taskPrompt = taskPrompt.replace('{User Gender}', profile.gender);
            taskPrompt = taskPrompt.replace('{Target Gender}', targetProfile?.gender || 'Unknown');
        }

        // Inject Tarot Context
        if (type === 'tarot' && context && context.cards) {
            // Depending on step, pick specific card?
            // "Context: Card 1 (The Situation)." -> We need to verify if the prompt has this.
            // Or we just dump all cards?
            // User requested 5 parts. Let's assume we map cards to steps 1-5.
            // If cards array is < 5, we repeat or summarize.
            const cardIndex = parseInt(promptKey.split('_')[1]) - 1; // 0 for TAROT_1
            const card = context.cards[cardIndex];
            if (card) {
                const cardDesc = `${card.card.name_en} (${card.reversed ? 'Reversed' : 'Upright'})`;
                taskPrompt += `\n\n### DRAWN CARD FOR THIS STEP: ${cardDesc}`;
            } else {
                 // Fallback if less than 5 cards
                 const allCards = context.cards.map((c: any) => `${c.card.name_en} (${c.reversed ? 'Reversed' : 'Upright'})`).join(', ');
                 taskPrompt += `\n\n### ALL CARDS DRAWN: ${allCards}`;
            }
        }


        const fullPrompt = `${contextXml}\n\n<task_instruction>\n${taskPrompt}\n</task_instruction>`;
        
        // LOGGING FOR VERIFICATION (Temporary)
        if (i === 0) {
            console.log('[FortuneService] GENERATED PROMPT (Step 1):', fullPrompt);
        }

        // Call AI for this step
        let stepContent = '';
        let stepSuccess = false;
        let stepInputTokens = 0;
        let stepOutputTokens = 0;
        
        // Gemini Chain
        const geminiModels = ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-2.5-flash-lite'];
        for (const m of geminiModels) {
          try {
            model = m;
            // Use new callGemini with systemInstruction
            const result = await this.callGemini(fullPrompt, m, systemPrompt);
            stepContent = result.content;
            
            // Track Usage (Gemini format: { promptTokenCount, candidatesTokenCount, totalTokenCount })
            if (result.usage) {
                stepInputTokens = result.usage.promptTokenCount || 0;
                stepOutputTokens = result.usage.candidatesTokenCount || 0;
            }
            
            stepSuccess = true;
            break; 
          } catch (e) {
            console.warn(`[FortuneService] Gemini model ${m} failed for step ${promptKey}:`, e);
          }
        }

        // OpenAI Fallback (Legacy prompt structure)
        if (!stepSuccess) {
            const openAiModels = ['gpt-5-nano', 'gpt-4.1-nano', 'gpt-4o-mini'];
            
            for (const m of openAiModels) {
              try {
                provider = 'openai';
                model = m;
                // Pass systemPrompt explicitly
                const result = await this.callOpenAI(fullPrompt, m, systemPrompt);
                stepContent = result.content;
                
                // Track Usage (OpenAI format: { prompt_tokens, completion_tokens, total_tokens })
                if (result.usage) {
                    stepInputTokens = result.usage.prompt_tokens || 0;
                    stepOutputTokens = result.usage.completion_tokens || 0;
                }
                
                stepSuccess = true;
                break;
              } catch (e) {
                console.warn(`[FortuneService] OpenAI model ${m} failed for step ${promptKey}:`, e);
              }
            }
        }

        if (stepSuccess) {
            // ✨ CELEBRITY VALIDATION LOGIC
            if (type === 'celebrity' && promptKey === 'CELEBRITY_1') {
                try {
                    // Search for JSON block specifically using regex
                    // This handles cases where "Thinking" models output intro text before the JSON
                    const jsonRegex = /```json\s*(\{[\s\S]*?\})\s*```/;
                    const match = stepContent.match(jsonRegex);
                    
                    let data;
                    let jsonStr;
                    
                    if (match && match[1]) {
                        // Found clear JSON block
                        jsonStr = match[1];
                        data = JSON.parse(jsonStr);
                        // Clean Output (Remove JSON block)
                        stepContent = stepContent.replace(match[0], '').trim();
                    } else {
                        // Fallback: Try finding just the JSON object anywhere if no code blocks
                        // Note: Removed anchor ^ to allow intro text
                        const laxMatch = stepContent.match(/(\{[\s\S]*?\})/);
                        if (laxMatch && laxMatch[1]) {
                             jsonStr = laxMatch[1];
                             // Ensure it parses (it might match a partial object if not careful, but laxMatch captures first {})
                             // If multiple {} exist, it takes the first outer one.
                             try {
                                data = JSON.parse(jsonStr);
                                stepContent = stepContent.replace(laxMatch[0], '').trim();
                             } catch (e) {
                                // If first match failed, try to match specifically for "found" key
                                const retryMatch = stepContent.match(/(\{\s*"celebrity_name"[\s\S]*?\})/);
                                if (retryMatch) {
                                    jsonStr = retryMatch[1];
                                    data = JSON.parse(jsonStr);
                                    stepContent = stepContent.replace(retryMatch[0], '').trim();
                                }
                             }
                        }
                    }

                    if (data) {
                        // Check Found Status
                        if (data.found === false) {
                             throw new Error('NO_CELEBRITY_FOUND');
                        }
                        
                        // Check Date
                        if (data.birth_date) {
                             const birthDate = new Date(data.birth_date);
                             const userBirthDate = new Date(profile.birth_date);
                             // Compare Month (0-11) and Date (1-31)
                             // Note: Use UTC methods to avoid timezone shifts if inputs are ISO YYYY-MM-DD
                             if (birthDate.getUTCMonth() !== userBirthDate.getUTCMonth() || 
                                 birthDate.getUTCDate() !== userBirthDate.getUTCDate()) {
                                 console.error(`Celebrity mismatch: User ${profile.birth_date} vs Celeb ${data.birth_date}`);
                                 throw new Error('CELEBRITY_DATE_MISMATCH');
                             }
                        }
                        
                        // Final cleanup of any lingering artifacts
                        stepContent = stepContent.replace(/```json\s*|\s*```/g, '').trim();
                    } else {
                        console.warn('Celebrity JSON missing or malformed');
                        // If strict validation is needed, we could throw here, but sometimes partial success is better
                        // For now, let's just warn and proceed, assuming the text might be okay.
                        // However, prompt instructions say JSON is MANDATORY.
                    }
                } catch (e: any) {
                    if (e.message === 'NO_CELEBRITY_FOUND' || e.message === 'CELEBRITY_DATE_MISMATCH') {
                        stepSuccess = false; // Mark as failed to trigger refund
                        throw e;
                    }
                    console.warn('Celebrity Validation Error:', e);
                    // Other JSON errors ignored
                }
            }
        }

        if (!stepSuccess) {
           console.error(`[FortuneService] Step ${promptKey} failed entirely.`);
           throw new Error('AI_GENERATION_FAILED');
        }
        
        // Aggregate totals
        totalInputTokens += stepInputTokens;
        totalOutputTokens += stepOutputTokens;
        
        // Log this step to ai_cost_logs (async fire-and-forget)
        // We use a helper (implementation pending in this context, but conceptual)
        this.logAiCost(user.telegram_id, 'FORTUNE', `${type}_${promptKey}`, provider, model, stepInputTokens, stepOutputTokens).catch(console.error);

        parts.push(stepContent.trim());
      }
      
      content = parts.join('\n\n---\n\n');

    } else {
        // --- LEGACY SINGLE SHOT LOGIC ---
        let taskPrompt = '';
        switch (type) {
        case 'daily': taskPrompt = FORTUNE_PROMPTS.DAILY; break;
        case 'deep': taskPrompt = FORTUNE_PROMPTS.DEEP; break;
        case 'weekly': taskPrompt = FORTUNE_PROMPTS.DEEP; break;
        case 'match': taskPrompt = FORTUNE_PROMPTS.MATCH; break;
        case 'celebrity': taskPrompt = FORTUNE_PROMPTS.CELEBRITY; break;
        case 'ziwei': taskPrompt = FORTUNE_PROMPTS.ZIWEI; break;
        case 'astrology': taskPrompt = FORTUNE_PROMPTS.ASTROLOGY; break;
        case 'tarot': taskPrompt = FORTUNE_PROMPTS.TAROT; break;
        case 'bazi': taskPrompt = FORTUNE_PROMPTS.BAZI; break;
        case 'love_ideal': taskPrompt = FORTUNE_PROMPTS.LOVE_IDEAL; break;
        // love_match is handled by chain, but keep fallback just in case config changes
        case 'love_match': taskPrompt = FORTUNE_PROMPTS.LOVE_MATCH; break; 
        default: taskPrompt = FORTUNE_PROMPTS.DAILY;
        }
        
        // Inject Context logic (same as before)
        if (type === 'love_match' && context && context.relationship_type) {
            // Legacy injection for single shot
             const relType = context.relationship_type;
             const familyRole = context.family_role ? `(${context.family_role})` : '';
             taskPrompt = taskPrompt.replace('compatibility analysis between the user and their specific partner', 
                 `compatibility analysis for a ${relType} relationship ${familyRole}`);
             
             taskPrompt += `\n\n### RELATIONSHIP CONTEXT: ${relType.toUpperCase()} ${familyRole}
             - User Gender: ${profile.gender}
             - Target Gender: ${targetProfile?.gender || 'Unknown'}
             - Target Role: ${familyRole || 'Partner'}
             
             CRITICAL INSTRUCTION:
             - Adjust the tone and advice to strictly fit this relationship type.
             `;
        }
        
        // Additional Context for Tarot
        if (type === 'tarot') {
            if (!context || !context.cards) throw new Error('Tarot cards missing');
            const cardsStr = context.cards.map((c: any) => 
                `${c.card.name_en} (${c.reversed ? 'Reversed' : 'Upright'})`
            ).join(', ');
            taskPrompt += `\nCards Drawn: ${cardsStr}\n`;
        }

        const fullPrompt = `${systemPrompt}\n\n${taskPrompt}\n${targetChartStr}`;

        // Call AI Logic (Single Shot)
        let singleSuccess = false;
        let stepInputTokens = 0;
        let stepOutputTokens = 0;
        
        // Gemini Chain
        const geminiModels = ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-2.5-flash-lite'];
        for (const m of geminiModels) {
            try {
                model = m;
                const result = await this.callGemini(fullPrompt, m);
                content = result.content;
                if (result.usage) {
                    stepInputTokens = result.usage.promptTokenCount || 0;
                    stepOutputTokens = result.usage.candidatesTokenCount || 0;
                }
                singleSuccess = true;
                break; 
            } catch (e) {
                console.warn(`[FortuneService] Gemini model ${m} failed:`, e);
            }
        }

        if (!singleSuccess) {
            const openAiModels = ['gpt-5-nano', 'gpt-4.1-nano', 'gpt-4o-mini'];
            for (const m of openAiModels) {
                try {
                    provider = 'openai';
                    model = m;
                    const result = await this.callOpenAI(fullPrompt, m);
                    content = result.content;
                    if (result.usage) {
                        stepInputTokens = result.usage.prompt_tokens || 0;
                        stepOutputTokens = result.usage.completion_tokens || 0;
                    }
                    singleSuccess = true;
                    break;
                } catch (e) {
                    console.warn(`[FortuneService] OpenAI model ${m} failed:`, e);
                }
            }
        }

        if (!singleSuccess) {
            // Notify Admin (Reuse logic or throw)
            throw new Error('AI_GENERATION_FAILED');
        }
        
        totalInputTokens = stepInputTokens;
        totalOutputTokens = stepOutputTokens;
        this.logAiCost(user.telegram_id, 'FORTUNE', `${type}_single`, provider, model, stepInputTokens, stepOutputTokens).catch(console.error);
    }
    
    // 6. Save History with Snapshot
    // Create snapshot object (User Profile + Target Profile)
    const snapshot = {
      user: {
        birth_date: profile.birth_date,
        birth_time: profile.birth_time,
        gender: profile.gender,
        mbti: user.mbti_result, // Use User's MBTI from user record
        blood_type: user.blood_type // Use User's Blood from user record
      },
      target: targetProfile ? {
        birth_date: targetProfile.birth_date,
        birth_time: targetProfile.birth_time,
        gender: targetProfile.gender,
        // MBTI/Blood for target might need to be passed in if known
      } : null,
      context: context // Store extra context (e.g. Tarot cards)
    };

    const insertQuery = `
      INSERT INTO fortune_history (
        telegram_id, type, target_date, target_person_name, target_person_birth, 
        content, provider, model, tokens_used,
        profile_snapshot, target_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `;
    
    const result = await this.db.prepare(insertQuery).bind(
      user.telegram_id, type, targetDate, 
      targetProfile?.name || null, targetProfile?.birth_date || null,
      content, provider, model, totalInputTokens + totalOutputTokens,
      JSON.stringify(snapshot), targetUserId || null
    ).first<FortuneHistory>();
    
    if (!result) throw new Error('Failed to save fortune history');
    return result;
    } catch (e) {
      console.error('Fortune Generation Failed, refunding quota:', e);
      await this.refundQuota(user.telegram_id, isVip);
      throw e;
    }
  }

  private async logAiCost(userId: string, type: string, subType: string, provider: string, model: string, inputTokens: number, outputTokens: number): Promise<void> {
    try {
        const query = `
            INSERT INTO ai_cost_logs (
                user_id, feature_type, sub_type, provider, model, input_tokens, output_tokens, cost_usd
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        // Cost estimation (Basic, can be enhanced with a proper pricing service)
        let cost = 0;
        // Pricing table (Approximate per 1M tokens)
        // input: $/1M, output: $/1M
        const pricing: any = {
            'gpt-4o-mini': { in: 0.15, out: 0.60 },
            'gpt-4o': { in: 2.50, out: 10.00 },
            'gemini-1.5-pro': { in: 3.50, out: 10.50 },
            'gemini-1.5-flash': { in: 0.075, out: 0.30 },
            'gemini-2.0-flash-exp': { in: 0, out: 0 }, // Free preview
            'gemini-2.0-flash': { in: 0, out: 0 }, // Free preview
            'gemini-2.0-flash-lite': { in: 0, out: 0 },
            'gemini-2.5-flash-lite': { in: 0, out: 0 } 
        };
        
        // Find best match for model pricing
        let price = { in: 0, out: 0 };
        for (const k in pricing) {
            if (model.includes(k)) {
                price = pricing[k];
                break;
            }
        }
        
        cost = (inputTokens / 1_000_000 * price.in) + (outputTokens / 1_000_000 * price.out);

        await this.db.prepare(query).bind(userId, type, subType, provider, model, inputTokens, outputTokens, cost).run();
    } catch (e) {
        console.error('Failed to log AI cost:', e);
        // Do not throw, keep going
    }
  }
}

