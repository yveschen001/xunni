/**
 * Development API Endpoints
 *
 * ⚠️ WARNING: These endpoints are for STAGING/DEVELOPMENT ONLY!
 * They should be disabled in production.
 */

import type { Env } from '~/types';
import { createDatabaseClient } from '~/db/client';

/**
 * Check if dev endpoints are allowed
 */
function isDevEndpointAllowed(env: Env): boolean {
  const environment = env.ENVIRONMENT || 'development';
  return environment === 'development' || environment === 'staging';
}

/**
 * Seed a fake user for testing
 */
export async function handleSeedUser(request: Request, env: Env): Promise<Response> {
  // Security check
  if (!isDevEndpointAllowed(env)) {
    return new Response(JSON.stringify({ error: 'Not available in production' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const user = (await request.json()) as any;
    const db = createDatabaseClient(env.DB);

    // Insert fake user
    const now = new Date().toISOString();
    await db.d1
      .prepare(
        `INSERT INTO users (
          telegram_id, username, first_name, nickname, gender, birthday, age,
          zodiac_sign, mbti_result, mbti_source, city, bio, interests,
          language_pref, onboarding_step, anti_fraud_score, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', 100, ?, ?)
        ON CONFLICT(telegram_id) DO UPDATE SET
          username = EXCLUDED.username,
          first_name = EXCLUDED.first_name,
          nickname = EXCLUDED.nickname,
          gender = EXCLUDED.gender,
          birthday = EXCLUDED.birthday,
          age = EXCLUDED.age,
          zodiac_sign = EXCLUDED.zodiac_sign,
          mbti_result = EXCLUDED.mbti_result,
          mbti_source = EXCLUDED.mbti_source,
          city = EXCLUDED.city,
          bio = EXCLUDED.bio,
          interests = EXCLUDED.interests,
          language_pref = EXCLUDED.language_pref,
          onboarding_step = 'completed',
          updated_at = EXCLUDED.updated_at`
      )
      .bind(
        user.telegram_id,
        user.username || null,
        user.first_name || null,
        user.nickname || null,
        user.gender || null,
        user.birthday || null,
        user.age || null,
        user.zodiac_sign || null,
        user.mbti_result || null,
        user.mbti_source || null,
        user.city || null,
        user.bio || null,
        user.interests || null,
        user.language_pref || 'zh-TW',
        now,
        now
      )
      .run();

    return new Response(JSON.stringify({ success: true, telegram_id: user.telegram_id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[handleSeedUser] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Delete all fake users (telegram_id starting with 9999999)
 */
export async function handleDeleteFakeUsers(request: Request, env: Env): Promise<Response> {
  // Security check
  if (!isDevEndpointAllowed(env)) {
    return new Response(JSON.stringify({ error: 'Not available in production' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const db = createDatabaseClient(env.DB);

    // Delete fake users (telegram_id starting with 9999999)
    const result = await db.d1.prepare(`DELETE FROM users WHERE telegram_id LIKE '9999999%'`).run();

    return new Response(
      JSON.stringify({
        success: true,
        deleted: result.meta?.changes || 0,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[handleDeleteFakeUsers] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
