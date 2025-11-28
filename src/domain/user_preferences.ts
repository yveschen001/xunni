export interface UserPushPreferences {
  quiet_hours_start?: number;
  quiet_hours_end?: number;
  throw_reminder_enabled?: boolean;
  catch_reminder_enabled?: boolean;
  message_reminder_enabled?: boolean;
  onboarding_reminder_enabled?: boolean;
  mbti_share_reminder_enabled?: boolean;
}

/**
 * Check if the current time falls within the user's quiet hours.
 * 
 * @param now The current time (UTC)
 * @param prefs The user's push preferences
 * @param userTimezoneOffset The user's timezone offset in hours (default 8 for Taipei)
 */
export function isQuietHours(now: Date, prefs: UserPushPreferences, userTimezoneOffset: number = 8): boolean {
  if (prefs.quiet_hours_start === undefined || prefs.quiet_hours_end === undefined) {
    return false;
  }

  // Convert UTC time to User's local time
  const utcHours = now.getUTCHours();
  const localHours = (utcHours + userTimezoneOffset) % 24;

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
