/**
 * Broadcast Filters Definition
 * 
 * Defines the structure for precise user targeting in broadcasts.
 * Supports both admin manual filters and automated system triggers.
 */

export interface BroadcastFilters {
  // Meta flags
  dry_run?: boolean; // If true, only count users, do not send

  // Basic Demographics
  gender?: 'male' | 'female' | 'other';
  country?: string; // ISO 3166-1 alpha-2 code (e.g. 'TW', 'US')
  
  // Advanced Targeting
  zodiac?: string; // e.g. 'Scorpio', 'Aries'
  mbti?: string;   // e.g. 'INTJ', 'ENFP'
  vip?: boolean;   // true = only VIP, false = only non-VIP, undefined = all
  
  // Age Range
  age?: {
    min?: number;
    max?: number;
  };
  
  // Automation Triggers (System Broadcasts)
  is_birthday?: boolean;      // Target users whose birthday is today
  last_active_days?: number;  // Target users active within X days (default 30)
}

/**
 * Parse filter string from command line
 * Format: key=value,key2=value2
 * Example: gender=female,age=18-25,country=TW
 */
export function parseFilters(filtersStr: string): BroadcastFilters {
  const filters: BroadcastFilters = {};
  
  if (!filtersStr) return filters;

  const parts = filtersStr.split(',');
  
  for (const part of parts) {
    const [key, value] = part.split('=').map(s => s.trim());
    
    // Handle dry_run flag (key only or key=true)
    if (key.toLowerCase() === 'dry_run') {
        filters.dry_run = value ? value.toLowerCase() === 'true' : true;
        continue;
    }

    if (!key || !value) continue;

    switch (key.toLowerCase()) {
      case 'gender':
        if (['male', 'female', 'other'].includes(value)) {
          filters.gender = value as 'male' | 'female' | 'other';
        }
        break;
        
      case 'country':
        filters.country = value.toUpperCase();
        break;
        
      case 'zodiac':
        // Simple validation or normalization could be added here
        filters.zodiac = value;
        break;
        
      case 'mbti':
        filters.mbti = value.toUpperCase();
        break;
        
      case 'vip':
        filters.vip = value.toLowerCase() === 'true';
        break;
        
      case 'age':
        // Format: 18-25 or 18+ or <25 (simplified to range)
        if (value.includes('-')) {
          const [min, max] = value.split('-').map(Number);
          filters.age = { min, max };
        } else if (value.endsWith('+')) {
          filters.age = { min: parseInt(value) };
        } else if (value.startsWith('<')) {
          filters.age = { max: parseInt(value.substring(1)) };
        } else {
            // Exact age
            const age = parseInt(value);
            filters.age = { min: age, max: age };
        }
        break;
    }
  }
  
  return filters;
}

/**
 * Convert filters to human-readable string for logging/display
 */
export function formatFilters(filters: BroadcastFilters): string {
    const parts: string[] = [];
    if (filters.dry_run) parts.push(`[DRY RUN]`);
    if (filters.gender) parts.push(`Gender: ${filters.gender}`);
    if (filters.country) parts.push(`Country: ${filters.country}`);
    if (filters.zodiac) parts.push(`Zodiac: ${filters.zodiac}`);
    if (filters.mbti) parts.push(`MBTI: ${filters.mbti}`);
    if (filters.vip !== undefined) parts.push(`VIP: ${filters.vip}`);
    if (filters.age) {
        if (filters.age.min && filters.age.max) parts.push(`Age: ${filters.age.min}-${filters.age.max}`);
        else if (filters.age.min) parts.push(`Age: ${filters.age.min}+`);
        else if (filters.age.max) parts.push(`Age: <${filters.age.max}`);
    }
    if (filters.is_birthday) parts.push(`Birthday: Today`);
    
    return parts.length > 0 ? parts.join(', ') : 'All Users';
}
