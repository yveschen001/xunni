/**
 * /start Handler
 * Based on @doc/SPEC.md and @doc/ONBOARDING_FLOW.md
 *
 * Handles user registration and onboarding flow.
 */

import type { Env, TelegramMessage, User } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { findUserByTelegramId, createUser } from '~/db/queries/users';
import { generateInviteCode, hasCompletedOnboarding } from '~/domain/user';
import { extractInviteCode, validateInviteCode, extractMbtiShareCode } from '~/domain/invite';
import { createInvite } from '~/db/queries/invites';
import { createReferralSource } from '~/db/queries/referral';
import { createTelegramService } from '~/services/telegram';
import { getPopularLanguageButtons } from '~/i18n/languages';
import { LEGAL_URLS } from '~/config/legal_urls';

// ============================================================================
// /start Handler
// ============================================================================

export async function handleStart(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // ✨ NEW: Update user activity (non-blocking)
    try {
      const { updateUserActivity } = await import('~/services/user_activity');
      await updateUserActivity(db, telegramId);
    } catch (activityError) {
      console.error('[handleStart] Failed to update user activity:', activityError);
    }

    // Extract codes from /start command
    const inviteCode = extractInviteCode(message.text || '');
    const mbtiShareCode = extractMbtiShareCode(message.text || '');
    let inviterTelegramId: string | null = null;

    console.error('[handleStart] Processing:', {
      telegramId,
      messageText: message.text,
      extractedInviteCode: inviteCode,
      extractedMbtiShareCode: mbtiShareCode,
    });

    // Validate and process invite code
    if (inviteCode) {
      console.error('[handleStart] Invite code found:', inviteCode);

      if (validateInviteCode(inviteCode)) {
        console.error('[handleStart] Invite code valid, looking for inviter');

        // Find inviter by invite code
        const inviter = await db.d1
          .prepare('SELECT telegram_id, nickname FROM users WHERE invite_code = ?')
          .bind(inviteCode)
          .first<{ telegram_id: string; nickname: string }>();

        if (inviter) {
          console.error('[handleStart] Inviter found:', inviter.telegram_id);

          // Prevent self-invitation
          if (inviter.telegram_id !== telegramId) {
            inviterTelegramId = inviter.telegram_id;
            console.error('[handleStart] Valid invitation, inviter:', inviterTelegramId);
          } else {
            console.error('[handleStart] Self-invitation detected - ignoring invite code and proceeding normally');
            // Silent fallback: Do not set inviterTelegramId, do not send error message.
            // Just treat it as a normal start command.
          }
        } else {
          console.error('[handleStart] Inviter not found for code:', inviteCode);
        }
      } else {
        console.error('[handleStart] Invalid invite code format:', inviteCode);
      }
    } else {
      console.error('[handleStart] No invite code in message');
    }

    // Check if user exists
    let user = await findUserByTelegramId(db, telegramId);

    if (!user) {
      // New user - create account
      // Get default country code from language
      const { getCountryCodeFromLanguage } = await import('~/utils/country_flag');
      const languageCode = message.from!.language_code || null;
      const countryCode = getCountryCodeFromLanguage(languageCode) || 'UN';

      user = await createUser(db, {
        telegram_id: telegramId,
        username: message.from!.username,
        first_name: message.from!.first_name,
        last_name: message.from!.last_name,
        language_pref: languageCode || 'en',
        country_code: countryCode,
        invite_code: generateInviteCode(),
        invited_by: inviterTelegramId || undefined,
      });

      // Create invite record if invited
      if (inviterTelegramId) {
        console.error('[handleStart] Creating invite record:', {
          inviterTelegramId,
          inviteeTelegramId: telegramId,
          inviteCode,
        });

        await createInvite(db, inviterTelegramId, telegramId, inviteCode!);
        console.error('[handleStart] Invite record created successfully');

        // Notify new user about invite
        const inviter = await findUserByTelegramId(db, inviterTelegramId);
        if (inviter) {
          const { createI18n } = await import('~/i18n');
          const i18n = createI18n(user.language_pref || 'en');
          await telegram.sendMessage(
            chatId,
            i18n.t('invite.codeAccepted', {
              inviterName: inviter.nickname || i18n.t('common.short2'),
            })
          );
        }
      } else {
        console.error('[handleStart] No inviter, skipping invite record creation');
      }

      const { createI18n } = await import('~/i18n');
      const i18n = createI18n(user.language_pref || 'en');

      // MBTI Share Link Handling (New User)
      if (mbtiShareCode) {
        await createReferralSource(db, user.telegram_id, 'mbti_share', mbtiShareCode, null);
        await telegram.sendMessageWithButtons(chatId, i18n.t('mbti.share.welcome'), [
          [{ text: i18n.t('mbti.share.startButton'), callback_data: 'mbti_test_full' }],
        ]);
        return;
      }

      await telegram.sendMessageWithButtons(
        chatId,
        i18n.t('onboarding.welcome'),
        getPopularLanguageButtons(i18n)
      );

      return;
    }

    // Existing user
    // MBTI Share Link Handling (Existing User)
    if (mbtiShareCode) {
      await createReferralSource(db, user.telegram_id, 'mbti_share', mbtiShareCode, null);
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n(user.language_pref || 'en');
      await telegram.sendMessageWithButtons(chatId, i18n.t('mbti.share.welcome'), [
        [{ text: i18n.t('mbti.share.startButton'), callback_data: 'mbti_test_full' }],
      ]);
      return;
    }

    if (hasCompletedOnboarding(user)) {
      // Already completed onboarding
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n(user.language_pref || 'en');
      await telegram.sendMessageWithButtons(
        chatId,
        i18n.t('common.text5', { user: { nickname: user.nickname } }) +
          '\n\n' +
          i18n.t('common.text4') +
          '\n' +
          i18n.t('buttons.bottle3') +
          ' - /throw\n' +
          i18n.t('buttons.bottle4') +
          ' - /catch\n' +
          i18n.t('buttons.profile2') +
          ' - /profile\n' +
          i18n.t('buttons.stats') +
          ' - /stats\n' +
          i18n.t('buttons.vip') +
          ' - /vip\n' +
          i18n.t('help.help2'),
        [
          [
            { text: i18n.t('buttons.bottle3'), callback_data: 'throw' },
            { text: i18n.t('buttons.bottle4'), callback_data: 'catch' },
          ],
          [
            { text: i18n.t('buttons.profile2'), callback_data: 'profile' },
            { text: i18n.t('buttons.stats'), callback_data: 'stats' },
          ],
        ]
      );
    } else {
      // User exists but hasn't completed onboarding
      // If they have an invite code and haven't been invited yet, update their invite info
      if (inviterTelegramId && !user.invited_by) {
        console.error('[handleStart] Updating incomplete user with invite:', {
          telegramId,
          inviterTelegramId,
          currentOnboardingStep: user.onboarding_step,
        });

        // Update user's invited_by
        await db.d1
          .prepare('UPDATE users SET invited_by = ? WHERE telegram_id = ?')
          .bind(inviterTelegramId, telegramId)
          .run();

        // Create invite record
        await createInvite(db, inviterTelegramId, telegramId, inviteCode!);
        console.error('[handleStart] Invite record created for incomplete user');

        // Notify user about invite
        const inviter = await findUserByTelegramId(db, inviterTelegramId);
        if (inviter) {
          const { createI18n } = await import('~/i18n');
          const i18n = createI18n(user.language_pref || 'en');
          await telegram.sendMessage(
            chatId,
            i18n.t('invite.codeAccepted', {
              inviterName: inviter.nickname || i18n.t('common.short2'),
            })
          );
        }

        // Refresh user data
        user = await findUserByTelegramId(db, telegramId);
        if (!user) {
          throw new Error('User not found after update');
        }
      }

      // Resume onboarding
      await resumeOnboarding(user, chatId, telegram, db, env);
    }
  } catch (error) {
    console.error('[handleStart] Error:', error);
    const { createI18n } = await import('~/i18n');
    const errorI18n = createI18n('en');
    await telegram.sendMessage(chatId, errorI18n.t('errors.systemErrorRetry'));
  }
}

// ============================================================================
// Onboarding Flow
// ============================================================================

/**
 * Resume onboarding from where user left off
 */
async function resumeOnboarding(
  user: User,
  chatId: number,
  telegram: ReturnType<typeof createTelegramService>,
  _db: ReturnType<typeof createDatabaseClient>,
  env: Env
): Promise<void> {
  const step = user.onboarding_step;

  switch (step) {
    case 'language_selection': {
      // Show language selection with buttons
      const { createI18n } = await import('~/i18n');
      const languageCode = user.language_pref || 'en';
      const i18n = createI18n(languageCode);
      await telegram.sendMessageWithButtons(
        chatId,
        i18n.t('onboarding.welcome'),
        getPopularLanguageButtons(i18n, languageCode)
      );
      break;
    }

    case 'region_selection':
    case 'country_selection':
    case 'city_search': {
      const { startGeoFlow } = await import('./onboarding_geo');
      // Pass env which contains DB
      await startGeoFlow(chatId, user.telegram_id, { ...env, DB: _db.d1 } as any);
      break;
    }

    case 'start':
    case 'nickname': {
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n(user.language_pref || 'en');
      await telegram.sendMessage(chatId, i18n.t('edit_profile.nickname'));
      break;
    }

    case 'avatar': {
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n(user.language_pref || 'en');
      await telegram.sendMessage(
        chatId,
        i18n.t('common.text51') + '\n\n' + i18n.t('common.text63')
      );
      break;
    }

    case 'gender': {
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n(user.language_pref || 'en');
      await telegram.sendMessageWithButtons(
        chatId,
        i18n.t('onboarding.gender3') + '\n\n' + i18n.t('warnings.gender'),
        [
          [
            { text: i18n.t('onboarding.gender.male'), callback_data: 'gender_male' },
            { text: i18n.t('onboarding.gender.female'), callback_data: 'gender_female' },
          ],
        ]
      );
      break;
    }

    case 'birthday': {
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n(user.language_pref || 'en');
      await telegram.sendMessage(
        chatId,
        i18n.t('onboarding.birthday3') +
          '\n\n' +
          i18n.t('onboarding.text10') +
          '\n\n' +
          i18n.t('warnings.birthday') +
          '\n' +
          i18n.t('onboarding.settings6') +
          '\n' +
          i18n.t('onboarding.text9')
      );
      break;
    }

    case 'blood_type': {
      const { getBloodTypeOptions } = await import('~/domain/blood_type');
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n(user.language_pref || 'en');
      const options = getBloodTypeOptions(i18n);

      await telegram.sendMessageWithButtons(
        chatId,
        i18n.t('onboarding.bloodTypeLabel') +
          '\n\n' +
          i18n.t('onboarding.vip') +
          '\n\n' +
          i18n.t('onboarding.bloodType.select'),
        [
          [
            { text: options[0].display, callback_data: 'blood_type_A' },
            { text: options[1].display, callback_data: 'blood_type_B' },
          ],
          [
            { text: options[2].display, callback_data: 'blood_type_AB' },
            { text: options[3].display, callback_data: 'blood_type_O' },
          ],
          [{ text: options[4].display, callback_data: 'blood_type_skip' }],
        ]
      );
      break;
    }

    case 'mbti': {
      // Show MBTI options: manual / test / skip
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n(user.language_pref || 'en');
      await telegram.sendMessageWithButtons(
        chatId,
        i18n.t('onboarding.settings2') +
          '\n\n' +
          i18n.t('onboarding.help') +
          '\n\n' +
          i18n.t('onboarding.settings7'),
        [
          [{ text: i18n.t('onboarding.mbti2'), callback_data: 'mbti_choice_manual' }],
          [{ text: i18n.t('onboarding.text5'), callback_data: 'mbti_choice_test' }],
          [{ text: i18n.t('onboarding.short'), callback_data: 'mbti_choice_skip' }],
        ]
      );
      break;
    }

    case 'anti_fraud': {
      // Show anti-fraud confirmation with buttons
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n(user.language_pref || 'en');
      await telegram.sendMessageWithButtons(
        chatId,
        i18n.t('onboarding.confirm2') +
          '\n\n' +
          i18n.t('onboarding.confirm') +
          '\n' +
          i18n.t('onboarding.antiFraud.question1') +
          '\n' +
          i18n.t('onboarding.antiFraud.question2') +
          '\n' +
          i18n.t('onboarding.antiFraud.question3') +
          '\n\n' +
          i18n.t('onboarding.confirm3'),
        [
          [
            {
              text: i18n.t('onboarding.antiFraud.confirm_button'),
              callback_data: 'anti_fraud_yes',
            },
          ],
          [
            {
              text: i18n.t('onboarding.antiFraud.learn_button'),
              callback_data: 'anti_fraud_learn',
            },
          ],
        ]
      );
      break;
    }

    case 'terms': {
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n(user.language_pref || 'en');
      await telegram.sendMessageWithButtons(
        chatId,
        i18n.t('onboarding.start') +
          '\n\n' +
          i18n.t('onboarding.text21') +
          '\n' +
          i18n.t('onboarding.text19') +
          '\n\n' +
          i18n.t('onboarding.terms.english_only_note') +
          '\n\n' +
          i18n.t('onboarding.text7'),
        [
          [{ text: i18n.t('onboarding.terms.agree_button'), callback_data: 'agree_terms' }],
          [
            {
              text: i18n.t('onboarding.terms.privacy_policy_button'),
              url: LEGAL_URLS.getPRIVACY_POLICY(env),
            },
          ],
          [
            {
              text: i18n.t('onboarding.terms.terms_of_service_button'),
              url: LEGAL_URLS.getTERMS_OF_SERVICE(env),
            },
          ],
        ]
      );
      break;
    }

    default: {
      const { createI18n } = await import('~/i18n');
      const i18n = createI18n(user.language_pref || 'en');
      await telegram.sendMessage(
        chatId,
        i18n.t('errors.error.short9') + '\n\n' + i18n.t('onboarding.start2') + '\n\n' + '/start'
      );
      break;
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

// Note: extractInviteCode and validateInviteCode are imported from ~/domain/invite
// Do not redefine them here to avoid conflicts
