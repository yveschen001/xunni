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
}

export const createGeoService = (db: D1Database) => new GeoService(db);
