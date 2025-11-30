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
      const cleaned = result.trim().replace(/['"]/g, '');
      if (cleaned.toLowerCase() === 'null') return null;
      return cleaned;
    } catch (e) {
      console.warn('Smart City Correction (Gemini) Failed, trying OpenAI fallback...', e);
      // Fallback to OpenAI
      try {
        const result = await this.callOpenAI(prompt);
        const cleaned = result.trim().replace(/['"]/g, '');
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

  private async callOpenAI(prompt: string): Promise<string> {
    const apiKey = this.env.OPENAI_API_KEY;
    const model = this.env.OPENAI_MODEL || 'gpt-4o-mini';

    if (!apiKey) throw new Error('OpenAI API Key missing');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Return ONLY the requested output without formatting or markdown.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenAI API Error:', err);
      throw new Error(`OpenAI API Error: ${response.status}`);
    }

    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content?.trim() || '';
  }

  private async callGemini(prompt: string, model = 'gemini-1.5-pro'): Promise<string> {
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
    targetProfile?: FortuneProfile,
    targetUserId?: string, // Optional real user ID for matches
    context?: any // Extra data for specific types (e.g. Tarot cards)
  ): Promise<FortuneHistory> {
    // 1. Check Cache
    let query = `SELECT * FROM fortune_history WHERE telegram_id = ? AND type = ? AND target_date = ?`;
    const params: any[] = [user.telegram_id, type, targetDate];
    
    if (type === 'match' && targetProfile) {
      query += ` AND target_person_name = ?`;
      params.push(targetProfile.name);
    }
    
    const cached = await this.db.prepare(query).bind(...params).first<FortuneHistory>();
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
    const chart = await this.calculateChart(profile.birth_date, profile.birth_time, profile.birth_location_lat, profile.birth_location_lng);
    
    // 4. Build Prompt
    let systemPrompt = FORTUNE_PROMPTS.SYSTEM_ROLE;
    // Add User Language constraint to system prompt just in case
    systemPrompt += `\nLanguage: ${user.language_pref || 'zh-TW'}`;

    let userPrompt = `User Data: Gender=${profile.gender}, Birth=${profile.birth_date} ${profile.birth_time || 'Unknown'}.\n`;
    userPrompt += `Chart Data: ${JSON.stringify(chart)}\n`;
    userPrompt += `Target Date: ${targetDate}\n`;

    if ((type === 'match' || type === 'love_match') && targetProfile) {
      const targetChart = await this.calculateChart(targetProfile.birth_date, targetProfile.birth_time, targetProfile.birth_location_lat, targetProfile.birth_location_lng);
      userPrompt += `Target Person: Name=${targetProfile.name}, Gender=${targetProfile.gender}, Birth=${targetProfile.birth_date}.\n`;
      userPrompt += `Target Chart: ${JSON.stringify(targetChart)}\n`;
      userPrompt += type === 'love_match' ? FORTUNE_PROMPTS.LOVE_MATCH : FORTUNE_PROMPTS.MATCH;
    } else if (type === 'daily') {
      userPrompt += FORTUNE_PROMPTS.DAILY;
    } else if (type === 'deep' || type === 'weekly') {
      userPrompt += FORTUNE_PROMPTS.DEEP;
    } else if (type === 'celebrity') {
      userPrompt += FORTUNE_PROMPTS.CELEBRITY;
    } else if (type === 'ziwei') {
      userPrompt += FORTUNE_PROMPTS.ZIWEI;
    } else if (type === 'astrology') {
      userPrompt += FORTUNE_PROMPTS.ASTROLOGY;
    } else if (type === 'bazi') {
      userPrompt += FORTUNE_PROMPTS.BAZI;
    } else if (type === 'love_ideal') {
      userPrompt += FORTUNE_PROMPTS.LOVE_IDEAL;
    } else if (type === 'tarot') {
      if (!context || !context.cards) throw new Error('Tarot cards missing');
      const cardsStr = context.cards.map((c: any) => 
        `${c.card.name_en} (${c.reversed ? 'Reversed' : 'Upright'})`
      ).join(', ');
      userPrompt += `Cards Drawn: ${cardsStr}\n`;
      userPrompt += FORTUNE_PROMPTS.TAROT;
    }

    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    
    // 5. Call AI
    const content = await this.callGemini(fullPrompt);
    
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
      content, 'gemini', 'gemini-1.5-pro', 0,
      JSON.stringify(snapshot), targetUserId || null
    ).first<FortuneHistory>();
    
    if (!result) throw new Error('Failed to save fortune history');
    return result;
  }
}

