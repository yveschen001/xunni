/**
 * Blood Type Domain Logic
 *
 * Pure functions for blood type validation and management.
 */

export type BloodType = 'A' | 'B' | 'AB' | 'O';

/**
 * Valid blood types
 */
export const BLOOD_TYPES: readonly BloodType[] = ['A', 'B', 'AB', 'O'] as const;

/**
 * Validate blood type
 *
 * @param bloodType - Blood type to validate
 * @returns True if valid
 */
export function isValidBloodType(bloodType: string): bloodType is BloodType {
  return BLOOD_TYPES.includes(bloodType as BloodType);
}

/**
 * Get blood type display name with emoji
 *
 * @param bloodType - Blood type
 * @param i18n - Optional i18n instance for translation
 * @returns Display name with emoji
 */
export function getBloodTypeDisplay(bloodType: BloodType | null, i18n?: any): string {
  if (!bloodType) {
    return i18n?.t('common.notSet') || '未設定';
  }

  const i18nKey = `common.bloodType${bloodType}`;
  const defaultDisplays: Record<BloodType, string> = {
    A: i18n?.t('common.bloodTypeA') || '🩸 A 型',
    B: i18n?.t('common.bloodTypeB') || '🩸 B 型',
    AB: i18n?.t('common.bloodTypeAB') || '🩸 AB 型',
    O: i18n?.t('common.bloodTypeO') || '🩸 O 型',
  };

  return i18n?.t(i18nKey) || defaultDisplays[bloodType];
}

/**
 * Get blood type emoji
 *
 * @param bloodType - Blood type
 * @returns Emoji representation
 */
export function getBloodTypeEmoji(bloodType: BloodType | null): string {
  if (!bloodType) {
    return '❓';
  }

  return '🩸';
}

/**
 * Parse blood type from user input
 *
 * @param input - User input (e.g., 'A', 'a', 'A型', 'A 型')
 * @returns Normalized blood type or null if invalid
 */
export function parseBloodType(input: string): BloodType | null {
  const normalized = input.toUpperCase().replace(/[型\s]/g, '');

  if (isValidBloodType(normalized)) {
    return normalized;
  }

  return null;
}

/**
 * Get blood type options for display
 *
 * @param i18n - Optional i18n instance for translation
 * @returns Array of blood type options with display names
 */
export function getBloodTypeOptions(i18n?: any): Array<{ value: BloodType | null; display: string }> {
  const getDisplay = (value: BloodType | null) => {
    if (value === null) {
      return i18n?.t('common.uncertain') || '❓ 不確定';
    }
    return getBloodTypeDisplay(value, i18n);
  };

  return [
    { value: 'A', display: getDisplay('A') },
    { value: 'B', display: getDisplay('B') },
    { value: 'AB', display: getDisplay('AB') },
    { value: 'O', display: getDisplay('O') },
    { value: null, display: getDisplay(null) },
  ];
}
