/**
 * Telegram Error Handler Service
 * Parses Telegram API errors and marks users accordingly
 */

// import type { Env } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { markUserBotStatus } from './user_activity';

/**
 * Parse Telegram error to determine user status
 */
export function parseErrorType(
  error: any
): 'blocked' | 'deleted' | 'deactivated' | 'invalid' | 'other' {
  const errorCode = error.error_code || error.code;
  const description = (error.description || error.message || '').toLowerCase();

  // 403: Bot was blocked by the user
  if (errorCode === 403) {
    if (description.includes('blocked') || description.includes('bot was blocked')) {
      return 'blocked';
    }
  }

  // 400: User not found / Chat not found / User is deactivated
  if (errorCode === 400) {
    if (
      description.includes('user not found') ||
      description.includes('chat not found') ||
      description.includes('user_id_invalid')
    ) {
      return 'deleted';
    }
    if (description.includes('deactivated')) {
      return 'deactivated';
    }
  }

  // 429: Too many requests (rate limit)
  if (errorCode === 429) {
    return 'other'; // Don't mark user as invalid
  }

  // Any other error that suggests the user is unreachable
  if (
    description.includes('not found') ||
    description.includes('deleted') ||
    description.includes('invalid')
  ) {
    return 'invalid';
  }

  return 'other';
}

/**
 * Handle broadcast error and mark user if necessary
 */
export async function handleBroadcastError(
  db: ReturnType<typeof createDatabaseClient>,
  telegramId: string,
  error: any
): Promise<{
  errorType: 'blocked' | 'deleted' | 'deactivated' | 'invalid' | 'other';
  shouldRetry: boolean;
}> {
  const errorType = parseErrorType(error);

  // Mark user if they're unreachable
  if (
    errorType === 'blocked' ||
    errorType === 'deleted' ||
    errorType === 'deactivated' ||
    errorType === 'invalid'
  ) {
    await markUserBotStatus(db, telegramId, errorType);
    console.log(`[handleBroadcastError] User ${telegramId} marked as ${errorType}`);
  }

  // Determine if we should retry
  const shouldRetry = errorType === 'other' || error.error_code === 429;

  return {
    errorType,
    shouldRetry,
  };
}

/**
 * Format error for logging
 */
export function formatBroadcastError(error: any): string {
  const errorCode = error.error_code || error.code || 'unknown';
  const description = error.description || error.message || 'Unknown error';
  return `[${errorCode}] ${description}`;
}

/**
 * Check if error is a rate limit error
 */
export function isRateLimitError(error: any): boolean {
  return error.error_code === 429 || error.code === 429;
}

/**
 * Get retry delay from rate limit error (in milliseconds)
 */
export function getRetryDelay(error: any): number {
  // Telegram usually includes retry_after in seconds
  const retryAfter = error.parameters?.retry_after || error.retry_after || 1;
  return retryAfter * 1000; // Convert to milliseconds
}
