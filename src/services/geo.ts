import { D1Database } from '@cloudflare/workers-types';

export interface GeoCity {
  id: number;
  name: string;
  ascii_name: string;
  lat: number;
  lng: number;
  country_code: string;
  timezone: string;
}

// Simple country code to timezone fallback map
const COUNTRY_TIMEZONES: Record<string, string> = {
  'TW': 'Asia/Taipei',
  'CN': 'Asia/Shanghai',
  'HK': 'Asia/Hong_Kong',
  'JP': 'Asia/Tokyo',
  'KR': 'Asia/Seoul',
  'US': 'America/New_York', // Default for US if city unknown
  'GB': 'Europe/London',
  'SG': 'Asia/Singapore',
  'MY': 'Asia/Kuala_Lumpur',
  'TH': 'Asia/Bangkok',
  'VN': 'Asia/Ho_Chi_Minh',
  'ID': 'Asia/Jakarta',
  'PH': 'Asia/Manila',
  'IN': 'Asia/Kolkata',
  'AU': 'Australia/Sydney',
  'NZ': 'Pacific/Auckland',
  'CA': 'America/Toronto',
  'FR': 'Europe/Paris',
  'DE': 'Europe/Berlin',
  'IT': 'Europe/Rome',
  'ES': 'Europe/Madrid',
  'NL': 'Europe/Amsterdam',
  'RU': 'Europe/Moscow',
  'BR': 'America/Sao_Paulo',
  'MX': 'America/Mexico_City',
};

export class GeoService {
  constructor(private db: D1Database) {}

  /**
   * Search cities by name (prefix match)
   * Prioritizes exact matches.
   */
  async searchCities(query: string, limit = 10): Promise<GeoCity[]> {
    if (!query || query.length < 2) return [];

    const sql = `
      SELECT * FROM geo_cities 
      WHERE name LIKE ? OR ascii_name LIKE ? 
      ORDER BY 
        CASE WHEN name = ? OR ascii_name = ? THEN 0 ELSE 1 END, 
        LENGTH(name) ASC 
      LIMIT ?
    `;
    const pattern = `${query}%`; // Prefix match
    
    // Safety: D1 bind handles escaping
    const { results } = await this.db.prepare(sql)
      .bind(pattern, pattern, query, query, limit)
      .all<GeoCity>();
      
    return results || [];
  }
  
  async getCityById(id: number): Promise<GeoCity | null> {
    return await this.db.prepare('SELECT * FROM geo_cities WHERE id = ?').bind(id).first<GeoCity>();
  }
  
  /**
   * Get cities by country code (useful for "Browse by Country" flow)
   */
  async getCitiesByCountry(countryCode: string, limit = 20): Promise<GeoCity[]> {
    const sql = `SELECT * FROM geo_cities WHERE country_code = ? ORDER BY name ASC LIMIT ?`;
    const { results } = await this.db.prepare(sql).bind(countryCode, limit).all<GeoCity>();
    return results || [];
  }

  /**
   * Get User's Timezone
   * Priority:
   * 1. Fortune Profile (Default) -> Birth City -> Timezone
   * 2. User Profile -> Country -> Default Timezone Map
   * 3. UTC (Fallback)
   */
  async getUserTimezone(userId: string): Promise<string> {
    // 1. Try Fortune Profile
    const profile = await this.db.prepare(`
      SELECT gc.timezone 
      FROM fortune_profiles fp
      JOIN geo_cities gc ON fp.birth_city_id = gc.id
      WHERE fp.user_id = ? AND fp.is_default = 1
    `).bind(userId).first<{ timezone: string }>();

    if (profile && profile.timezone) {
      return profile.timezone;
    }

    // 2. Try User Country
    const user = await this.db.prepare(`
      SELECT country 
      FROM users 
      WHERE telegram_id = ?
    `).bind(userId).first<{ country: string }>();

    if (user && user.country && COUNTRY_TIMEZONES[user.country]) {
      return COUNTRY_TIMEZONES[user.country];
    }

    // 3. Fallback
    return 'UTC';
  }

  /**
   * Check if it's currently a specific hour in the user's local time
   */
  async isUserLocalHour(userId: string, targetHour: number): Promise<boolean> {
    const timezone = await this.getUserTimezone(userId);
    
    try {
      // Get current time in user's timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        hour12: false
      });
      
      const localHourStr = formatter.format(new Date());
      const localHour = parseInt(localHourStr, 10); // 0-23
      
      // Handle '24' edge case if format returns it (unlikely with hour12: false, usually 0-23)
      const normalizedHour = localHour === 24 ? 0 : localHour;
      
      return normalizedHour === targetHour;
    } catch (e) {
      console.error(`[GeoService] Timezone error for ${userId} (${timezone}):`, e);
      // Fallback: check UTC
      const utcHour = new Date().getUTCHours();
      return utcHour === targetHour;
    }
  }
}

export const createGeoService = (db: D1Database) => new GeoService(db);
