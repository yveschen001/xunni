/**
 * MBTI Test Service
 * 
 * Manages MBTI test progress state in database.
 * Provides functions to start, resume, save answers, and complete tests.
 */

import type { MBTITestProgress } from '~/domain/mbti_test';
import type { DatabaseClient } from '~/db/client';
import { calculateMBTIResult, getTotalQuestions } from '~/domain/mbti_test';

// ============================================================================
// Types
// ============================================================================

export interface MBTITestState {
  telegram_id: string;
  current_question: number;
  answers: number[];
  total_questions: number;
  started_at: string;
  updated_at: string;
}

// ============================================================================
// Test Progress Management
// ============================================================================

/**
 * Start a new MBTI test for a user
 */
export async function startMBTITest(
  db: DatabaseClient,
  telegramId: string
): Promise<MBTITestState> {
  // Delete any existing progress
  await db.d1
    .prepare('DELETE FROM mbti_test_progress WHERE telegram_id = ?')
    .bind(telegramId)
    .run();

  // Create new progress
  const now = new Date().toISOString();
  await db.d1
    .prepare(
      `INSERT INTO mbti_test_progress (telegram_id, current_question, answers, started_at, updated_at)
       VALUES (?, 0, '[]', ?, ?)`
    )
    .bind(telegramId, now, now)
    .run();

  return {
    telegram_id: telegramId,
    current_question: 0,
    answers: [],
    total_questions: getTotalQuestions(),
    started_at: now,
    updated_at: now,
  };
}

/**
 * Get current test progress for a user
 */
export async function getMBTITestProgress(
  db: DatabaseClient,
  telegramId: string
): Promise<MBTITestState | null> {
  const result = await db.d1
    .prepare('SELECT * FROM mbti_test_progress WHERE telegram_id = ? LIMIT 1')
    .bind(telegramId)
    .first<MBTITestProgress>();

  if (!result) {
    return null;
  }

  return {
    telegram_id: result.telegram_id,
    current_question: result.current_question,
    answers: JSON.parse(result.answers) as number[],
    total_questions: getTotalQuestions(),
    started_at: result.started_at,
    updated_at: result.updated_at,
  };
}

/**
 * Save answer and advance to next question
 */
export async function saveAnswerAndAdvance(
  db: DatabaseClient,
  telegramId: string,
  answerIndex: number
): Promise<MBTITestState> {
  // Get current progress
  const progress = await getMBTITestProgress(db, telegramId);
  if (!progress) {
    throw new Error('No test in progress');
  }

  // Add answer
  const answers = [...progress.answers, answerIndex];
  const nextQuestion = progress.current_question + 1;
  const now = new Date().toISOString();

  // Update progress
  await db.d1
    .prepare(
      `UPDATE mbti_test_progress
       SET current_question = ?, answers = ?, updated_at = ?
       WHERE telegram_id = ?`
    )
    .bind(nextQuestion, JSON.stringify(answers), now, telegramId)
    .run();

  return {
    telegram_id: telegramId,
    current_question: nextQuestion,
    answers,
    total_questions: getTotalQuestions(),
    started_at: progress.started_at,
    updated_at: now,
  };
}

/**
 * Complete test and calculate result
 */
export async function completeMBTITest(
  db: DatabaseClient,
  telegramId: string
): Promise<{ type: string; description_zh_TW: string; description_en: string }> {
  // Get final progress
  const progress = await getMBTITestProgress(db, telegramId);
  if (!progress) {
    throw new Error('No test in progress');
  }

  if (progress.answers.length !== getTotalQuestions()) {
    throw new Error('Test not completed');
  }

  // Calculate result
  const result = calculateMBTIResult(progress.answers);

  // Save to user profile
  const now = new Date().toISOString();
  await db.d1
    .prepare(
      `UPDATE users
       SET mbti_result = ?, mbti_source = 'test', mbti_completed_at = ?, updated_at = ?
       WHERE telegram_id = ?`
    )
    .bind(result.type, now, now, telegramId)
    .run();

  // Delete progress
  await db.d1
    .prepare('DELETE FROM mbti_test_progress WHERE telegram_id = ?')
    .bind(telegramId)
    .run();

  return {
    type: result.type,
    description_zh_TW: result.description_zh_TW,
    description_en: result.description_en,
  };
}

/**
 * Cancel/delete test progress
 */
export async function cancelMBTITest(
  db: DatabaseClient,
  telegramId: string
): Promise<void> {
  await db.d1
    .prepare('DELETE FROM mbti_test_progress WHERE telegram_id = ?')
    .bind(telegramId)
    .run();
}

/**
 * Check if user has test in progress
 */
export async function hasTestInProgress(
  db: DatabaseClient,
  telegramId: string
): Promise<boolean> {
  const progress = await getMBTITestProgress(db, telegramId);
  return progress !== null;
}

