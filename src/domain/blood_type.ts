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
 * @returns Display name with emoji
 */
export function getBloodTypeDisplay(bloodType: BloodType | null): string {
  if (!bloodType) {
    return '未設定';
  }

  const displays: Record<BloodType, string> = {
    A: '🩸 A 型',
    B: '🩸 B 型',
    AB: '🩸 AB 型',
    O: '🩸 O 型',
  };

  return displays[bloodType];
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
 * @returns Array of blood type options with display names
 */
export function getBloodTypeOptions(): Array<{ value: BloodType | null; display: string }> {
  return [
    { value: 'A', display: '🩸 A 型' },
    { value: 'B', display: '🩸 B 型' },
    { value: 'AB', display: '🩸 AB 型' },
    { value: 'O', display: '🩸 O 型' },
    { value: null, display: '❓ 不確定' },
  ];
}
