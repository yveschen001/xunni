/**
 * Mask the tail of a string to protect user identity.
 */
export function maskSensitiveValue(
  value?: string | null,
  options?: { maskChar?: string; maskLength?: number }
): string {
  const maskChar = options?.maskChar ?? '*';
  const maskLength = options?.maskLength ?? 4;

  if (!value) {
    return '未設定';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '未設定';
  }

  const len = trimmed.length;
  const actualMask = Math.min(maskLength, len);
  const visiblePart = trimmed.slice(0, len - actualMask);

  return `${visiblePart}${maskChar.repeat(actualMask)}`;
}
