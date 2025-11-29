/**
 * Zodiac Domain Logic
 *
 * Handles zodiac sign display and translation
 */

import type { I18n } from '~/i18n';

/**
 * Get display text for zodiac sign
 */
export function getZodiacDisplay(zodiac: string | null | undefined, i18n: I18n): string {
  if (!zodiac) {
    return i18n.t('common.notSet');
  }

  // Normalize input to PascalCase for map lookup, or handle lowercase map
  const normalizedZodiac = zodiac.charAt(0).toUpperCase() + zodiac.slice(1).toLowerCase();

  // Map English zodiac names to i18n keys
  // Using bottle.throw.short7 - short18 as they contain the zodiac names with emojis
  const zodiacMap: Record<string, string> = {
    Aries: i18n.t('bottle.throw.short7'),
    Taurus: i18n.t('bottle.throw.short8'),
    Gemini: i18n.t('bottle.throw.short9'),
    Cancer: i18n.t('bottle.throw.short10'),
    Leo: i18n.t('bottle.throw.short11'),
    Virgo: i18n.t('bottle.throw.short12'),
    Libra: i18n.t('bottle.throw.short13'),
    Scorpio: i18n.t('bottle.throw.short14'),
    Sagittarius: i18n.t('bottle.throw.short15'),
    Capricorn: i18n.t('bottle.throw.short16'),
    Aquarius: i18n.t('bottle.throw.short17'),
    Pisces: i18n.t('bottle.throw.short18'),
  };

  return zodiacMap[normalizedZodiac] || zodiac;
}
