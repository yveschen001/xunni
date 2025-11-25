/**
 * Mask the tail of a string to protect user identity.
 * @param value - The value to mask
 * @param options - Options including maskChar, maskLength, and notSetText for i18n
 * @returns Masked value or notSetText if value is empty
 */
export function maskSensitiveValue(
  value?: string | null,
  options?: { maskChar?: string; maskLength?: number; notSetText?: string }
): string {
  const maskChar = options?.maskChar ?? '*';
  const maskLength = options?.maskLength ?? 4;
  // Default to English if notSetText is not provided (should be passed from i18n)
  const notSetText = options?.notSetText ?? 'Not Set';

  if (!value) {
    return notSetText;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return notSetText;
  }

  const len = trimmed.length;
  const actualMask = Math.min(maskLength, len);
  const visiblePart = trimmed.slice(0, len - actualMask);

  return `${visiblePart}${maskChar.repeat(actualMask)}`;
}
