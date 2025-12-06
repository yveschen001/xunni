/**
 * Nickname Utility
 * 
 * Helper functions for nickname processing.
 */

/**
 * Mask nickname for privacy protection
 *
 * New rules:
 * - If nickname < 4 chars: nickname + **** (pad to 10 chars total)
 * - If nickname >= 4 chars: show first part + at least 4 * (total 10 chars)
 *
 * @param nickname Original nickname
 * @returns Masked nickname (always 10 chars)
 *
 * @example
 * maskNickname('張') // '張*********' (1 + 9 stars = 10)
 * maskNickname('王五') // '王五********' (2 + 8 stars = 10)
 * maskNickname('張小明') // '張小明*******' (3 + 7 stars = 10)
 * maskNickname('Alice') // 'Alice*****' (5 + 5 stars = 10)
 * maskNickname('Alexander') // 'Alexan****' (6 + 4 stars = 10)
 * maskNickname('VeryLongName') // 'VeryLo****' (6 + 4 stars = 10)
 */
export function maskNickname(nickname: string, i18n?: any): string {
  if (!nickname || nickname.length === 0) {
    return i18n?.t('common.newUser') + '******' || '新用戶******'; // 10 chars total
  }

  const TARGET_LENGTH = 10;
  const MIN_MASK_LENGTH = 4;

  // If nickname is less than 4 characters, show all + pad with stars to 10
  if (nickname.length < 4) {
    const starsNeeded = TARGET_LENGTH - nickname.length;
    return nickname + '*'.repeat(starsNeeded);
  }

  // If nickname is 4 or more characters
  // Show first part + at least 4 stars, total 10 chars
  const visibleLength = Math.min(nickname.length, TARGET_LENGTH - MIN_MASK_LENGTH); // Max 6 chars visible
  const visible = nickname.substring(0, visibleLength);
  const starsNeeded = TARGET_LENGTH - visible.length;
  return visible + '*'.repeat(starsNeeded);
}

