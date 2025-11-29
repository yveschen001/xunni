export interface UserPushPreferences {
  quiet_hours_start?: number;
  quiet_hours_end?: number;
  throw_reminder_enabled?: boolean;
  catch_reminder_enabled?: boolean;
  message_reminder_enabled?: boolean;
  onboarding_reminder_enabled?: boolean;
  mbti_share_reminder_enabled?: boolean;
  timezone?: string; // e.g. 'UTC', 'Asia/Taipei', '+08:00'
}

/**
 * Check if the current time falls within the user's quiet hours.
 *
 * @param now The current time (UTC)
 * @param prefs The user's push preferences
 * @param defaultTimezoneOffset Default timezone offset if user timezone is invalid/missing (default 8 for Taipei)
 */
export function isQuietHours(
  now: Date,
  prefs: UserPushPreferences,
  defaultTimezoneOffset: number = 8
): boolean {
  if (prefs.quiet_hours_start === undefined || prefs.quiet_hours_end === undefined) {
    return false;
  }

  // Determine timezone offset
  let offset = defaultTimezoneOffset;
  if (prefs.timezone) {
    // Basic parsing for offset strings like '+08:00' or '8' or '-5'
    // For full IANA support, we'd need a library, but for MVP we can support numeric offsets
    const numericOffset = parseFloat(prefs.timezone);
    if (!isNaN(numericOffset)) {
      offset = numericOffset;
    }
    // If it's a string like 'Asia/Taipei', we currently fallback to default because we don't have a timezone DB.
    // TODO: Add IANA timezone support if needed.
  }

  // Convert UTC time to User's local time
  const utcHours = now.getUTCHours();
  // Add offset and handle wrapping (can be negative or > 24)
  let localHours = (utcHours + offset) % 24;
  if (localHours < 0) localHours += 24;

  const start = prefs.quiet_hours_start;
  const end = prefs.quiet_hours_end;

  if (start === end) {
    return false;
  }

  if (start < end) {
    // Normal range (e.g. 23 to 7 is invalid here, must be 23 to 23? No.)
    // Normal: 09:00 to 18:00
    return localHours >= start && localHours < end;
  } else {
    // Overnight range (e.g. 23:00 to 07:00)
    return localHours >= start || localHours < end;
  }
}
