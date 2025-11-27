// ISO 3166-1 alpha-2 country codes to emoji flags
export const countryFlags: Record<string, string> = {
  TW: '🇹🇼',
  CN: '🇨🇳',
  HK: '🇭🇰',
  MO: '🇲🇴',
  JP: '🇯🇵',
  KR: '🇰🇷',
  US: '🇺🇸',
  GB: '🇬🇧',
  FR: '🇫🇷',
  DE: '🇩🇪',
  IT: '🇮🇹',
  ES: '🇪🇸',
  PT: '🇵🇹',
  RU: '🇷🇺',
  UA: '🇺🇦',
  AU: '🇦🇺',
  CA: '🇨🇦',
  BR: '🇧🇷',
  AR: '🇦🇷',
  IN: '🇮🇳',
  ID: '🇮🇩',
  TH: '🇹🇭',
  VN: '🇻🇳',
  MY: '🇲🇾',
  PH: '🇵🇭',
  SG: '🇸🇬',
  TR: '🇹🇷',
  SA: '🇸🇦',
  AE: '🇦🇪',
  IR: '🇮🇷',
  IL: '🇮🇱',
  EG: '🇪🇬',
  ZA: '🇿🇦',
  NG: '🇳🇬',
  KE: '🇰🇪',
  MX: '🇲🇽',
  CO: '🇨🇴',
  CL: '🇨🇱',
  PE: '🇵🇪',
  NZ: '🇳🇿',
  // Add more as needed
};

export function getCountryFlag(code: string | null): string {
  if (!code) return '';
  return countryFlags[code.toUpperCase()] || '🌐';
}

export function isValidCountryCode(code: string): boolean {
  return !!countryFlags[code.toUpperCase()];
}

