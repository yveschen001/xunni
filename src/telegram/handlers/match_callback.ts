import type { Env, TelegramCallbackQuery } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { I18n } from '~/i18n';
import { MatchRequestService } from '~/services/match_request';

/**
 * Handle callbacks related to match requests (Attribute Diagnosis)
 */
export async function handleMatchConsent(callbackQuery: TelegramCallbackQuery, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const i18n = new I18n(callbackQuery.from.language_code || 'zh-TW');
  const matchRequestService = new MatchRequestService(env, db.d1, i18n, telegram);

  const data = callbackQuery.data!; // e.g., match_consent_accept:requestId
  const parts = data.split(':');
  const action = parts[0]; // match_consent_accept or match_consent_reject
  const requestId = parts[1];
  const targetId = callbackQuery.from.id.toString();

  console.log(`[MatchCallback] Handling consent for request ${requestId}, action: ${action}, target: ${targetId}`);

  if (!requestId) {
    await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('error.invalidRequest') || 'Invalid Request');
    return;
  }

  const result = await matchRequestService.handleConsent(requestId, targetId, action === 'match_consent_accept');

  if (result.success) {
    if (action === 'match_consent_accept') {
      // Success message update
      await telegram.editMessageText(
            callbackQuery.message!.chat.id, 
            callbackQuery.message!.message_id, 
            i18n.t('fortune.love.consent_accepted_msg') || '✅ Accepted. Generating report...'
      );
      // Report generation is triggered inside handleConsent -> MatchRequestService
    } else {
      // Reject message update
      await telegram.editMessageText(
            callbackQuery.message!.chat.id, 
            callbackQuery.message!.message_id, 
            i18n.t('fortune.love.consent_rejected_msg') || '❌ Request rejected.'
      );
    }
  } else {
    // Error message update
    await telegram.editMessageText(
        callbackQuery.message!.chat.id, 
        callbackQuery.message!.message_id, 
        result.message || 'Error processing request.'
    );
  }
  await telegram.answerCallbackQuery(callbackQuery.id);
}

/**
 * Handle VIP throw callback from push notification
 */
export async function handleMatchVip(callbackQuery: TelegramCallbackQuery, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  // Logic to handle "Throw Bottle to this match"
  // This typically redirects to the throw flow with a pre-filled target or topic
  // For now, just acknowledge
  await telegram.answerCallbackQuery(callbackQuery.id, 'VIP Match Throw not implemented yet');
}


/**
 * Handle generic Match Throw callback
 */
export async function handleMatchThrow(callbackQuery: TelegramCallbackQuery, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  // Logic to handle generic throw
  await telegram.answerCallbackQuery(callbackQuery.id, 'Match Throw not implemented yet');
}
