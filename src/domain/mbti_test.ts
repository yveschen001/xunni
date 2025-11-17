/**
 * MBTI Test Domain Logic
 * 
 * Provides conversational MBTI test questions, scoring, and result calculation.
 * This module is platform-agnostic and can be used by bot, mini-app, or other channels.
 * 
 * Based on simplified MBTI dimensions:
 * - E/I (Extraversion/Introversion)
 * - S/N (Sensing/Intuition)
 * - T/F (Thinking/Feeling)
 * - J/P (Judging/Perceiving)
 * 
 * Test Versions:
 * - Quick (12 questions): For bot onboarding, results are for reference only
 * - Standard (36 questions): For Mini App, more accurate results (FUTURE)
 * - Professional (60 questions): For VIP users, comprehensive analysis (FUTURE)
 */

import { MBTI_TYPES } from './user';

// ============================================================================
// Types
// ============================================================================

export type MBTIDimension = 'EI' | 'SN' | 'TF' | 'JP';

/**
 * MBTI Test Type
 * - quick: 12 questions, 2 options per question (Bot onboarding)
 * - standard: 36 questions, 5 options per question (Mini App) - FUTURE
 * - professional: 60 questions, 5 options per question (VIP) - FUTURE
 */
export type MBTITestType = 'quick' | 'standard' | 'professional';

export interface MBTIQuestion {
  id: number;
  dimension: MBTIDimension;
  question_zh_TW: string;
  question_en: string;
  options: {
    text_zh_TW: string;
    text_en: string;
    score: number;  // Positive for first letter (E/S/T/J), negative for second (I/N/F/P)
  }[];
}

export interface MBTITestProgress {
  telegram_id: string;
  current_question: number;
  answers: string;  // JSON string of number array
  started_at: string;
  updated_at: string;
}

export interface MBTIResult {
  type: string;  // e.g., "INTJ"
  dimensions: {
    EI: number;  // Positive = E, Negative = I
    SN: number;  // Positive = S, Negative = N
    TF: number;  // Positive = T, Negative = F
    JP: number;  // Positive = J, Negative = P
  };
  description_zh_TW: string;
  description_en: string;
}

// ============================================================================
// MBTI Test Questions (Quick 12-question test)
// ============================================================================

/**
 * Quick MBTI test with 12 questions (3 per dimension)
 * This is a simplified test suitable for bot conversation flow.
 * 
 * ⚠️ DISCLAIMER: Results are for reference only. This is not a professional assessment.
 * 
 * For more accurate results:
 * - Standard test (36 questions, 5 options): Planned for Mini App
 * - Professional test (60 questions, 5 options): Planned for VIP users
 * 
 * Industry standard: 60-93 questions with 5-7 options per question
 */
export const MBTI_QUESTIONS: MBTIQuestion[] = [
  // E/I Questions (1-3)
  {
    id: 1,
    dimension: 'EI',
    question_zh_TW: '在社交場合中，你通常：',
    question_en: 'In social situations, you usually:',
    options: [
      { text_zh_TW: '主動與他人交談', text_en: 'Actively talk to others', score: 2 },
      { text_zh_TW: '等待他人來找我', text_en: 'Wait for others to approach me', score: -2 },
    ],
  },
  {
    id: 2,
    dimension: 'EI',
    question_zh_TW: '週末你更喜歡：',
    question_en: 'On weekends, you prefer:',
    options: [
      { text_zh_TW: '和朋友出去玩', text_en: 'Going out with friends', score: 2 },
      { text_zh_TW: '在家獨處休息', text_en: 'Staying home alone to rest', score: -2 },
    ],
  },
  {
    id: 3,
    dimension: 'EI',
    question_zh_TW: '參加聚會後，你通常：',
    question_en: 'After attending a party, you usually:',
    options: [
      { text_zh_TW: '感到充滿活力', text_en: 'Feel energized', score: 2 },
      { text_zh_TW: '感到需要休息', text_en: 'Feel need to rest', score: -2 },
    ],
  },

  // S/N Questions (4-6)
  {
    id: 4,
    dimension: 'SN',
    question_zh_TW: '解決問題時，你更依賴：',
    question_en: 'When solving problems, you rely more on:',
    options: [
      { text_zh_TW: '實際經驗和事實', text_en: 'Practical experience and facts', score: 2 },
      { text_zh_TW: '直覺和可能性', text_en: 'Intuition and possibilities', score: -2 },
    ],
  },
  {
    id: 5,
    dimension: 'SN',
    question_zh_TW: '你更喜歡：',
    question_en: 'You prefer:',
    options: [
      { text_zh_TW: '關注具體細節', text_en: 'Focusing on concrete details', score: 2 },
      { text_zh_TW: '關注整體概念', text_en: 'Focusing on overall concepts', score: -2 },
    ],
  },
  {
    id: 6,
    dimension: 'SN',
    question_zh_TW: '學習新事物時，你更喜歡：',
    question_en: 'When learning something new, you prefer:',
    options: [
      { text_zh_TW: '按部就班的方法', text_en: 'Step-by-step methods', score: 2 },
      { text_zh_TW: '探索創新的方式', text_en: 'Exploring innovative ways', score: -2 },
    ],
  },

  // T/F Questions (7-9)
  {
    id: 7,
    dimension: 'TF',
    question_zh_TW: '做決定時，你更重視：',
    question_en: 'When making decisions, you value more:',
    options: [
      { text_zh_TW: '邏輯和客觀分析', text_en: 'Logic and objective analysis', score: 2 },
      { text_zh_TW: '情感和人際和諧', text_en: 'Emotions and interpersonal harmony', score: -2 },
    ],
  },
  {
    id: 8,
    dimension: 'TF',
    question_zh_TW: '批評他人時，你會：',
    question_en: 'When criticizing others, you:',
    options: [
      { text_zh_TW: '直接指出問題', text_en: 'Point out problems directly', score: 2 },
      { text_zh_TW: '考慮對方感受', text_en: 'Consider their feelings', score: -2 },
    ],
  },
  {
    id: 9,
    dimension: 'TF',
    question_zh_TW: '你更看重：',
    question_en: 'You value more:',
    options: [
      { text_zh_TW: '公平和正義', text_en: 'Fairness and justice', score: 2 },
      { text_zh_TW: '同情和理解', text_en: 'Compassion and understanding', score: -2 },
    ],
  },

  // J/P Questions (10-12)
  {
    id: 10,
    dimension: 'JP',
    question_zh_TW: '你的工作方式是：',
    question_en: 'Your work style is:',
    options: [
      { text_zh_TW: '提前計劃和準備', text_en: 'Planning and preparing in advance', score: 2 },
      { text_zh_TW: '隨機應變和靈活', text_en: 'Adapting and being flexible', score: -2 },
    ],
  },
  {
    id: 11,
    dimension: 'JP',
    question_zh_TW: '你更喜歡：',
    question_en: 'You prefer:',
    options: [
      { text_zh_TW: '有明確的截止日期', text_en: 'Having clear deadlines', score: 2 },
      { text_zh_TW: '保持開放的選擇', text_en: 'Keeping options open', score: -2 },
    ],
  },
  {
    id: 12,
    dimension: 'JP',
    question_zh_TW: '旅行時，你傾向於：',
    question_en: 'When traveling, you tend to:',
    options: [
      { text_zh_TW: '制定詳細行程', text_en: 'Make detailed itineraries', score: 2 },
      { text_zh_TW: '隨心所欲探索', text_en: 'Explore spontaneously', score: -2 },
    ],
  },
];

// ============================================================================
// MBTI Result Descriptions
// ============================================================================

export const MBTI_DESCRIPTIONS: Record<string, { zh_TW: string; en: string }> = {
  INTJ: {
    zh_TW: '建築師 - 富有想像力和戰略性的思想家，一切皆在計劃之中。',
    en: 'Architect - Imaginative and strategic thinkers, with a plan for everything.',
  },
  INTP: {
    zh_TW: '邏輯學家 - 具有創新精神的發明家，對知識有著止不住的渴望。',
    en: 'Logician - Innovative inventors with an unquenchable thirst for knowledge.',
  },
  ENTJ: {
    zh_TW: '指揮官 - 大膽、富有想像力且意志強大的領導者，總能找到或創造解決方法。',
    en: 'Commander - Bold, imaginative and strong-willed leaders, always finding a way.',
  },
  ENTP: {
    zh_TW: '辯論家 - 聰明好奇的思想家，無法抗拒智力上的挑戰。',
    en: 'Debater - Smart and curious thinkers who cannot resist an intellectual challenge.',
  },
  INFJ: {
    zh_TW: '提倡者 - 安靜而神秘，同時鼓舞人心且不知疲倦的理想主義者。',
    en: 'Advocate - Quiet and mystical, yet very inspiring and tireless idealists.',
  },
  INFP: {
    zh_TW: '調停者 - 詩意、善良的利他主義者，總是熱情地為正義事業而努力。',
    en: 'Mediator - Poetic, kind and altruistic people, always eager to help a good cause.',
  },
  ENFJ: {
    zh_TW: '主人公 - 富有魅力且鼓舞人心的領導者，有能力使聽眾著迷。',
    en: 'Protagonist - Charismatic and inspiring leaders, able to mesmerize their listeners.',
  },
  ENFP: {
    zh_TW: '競選者 - 熱情、有創造力且社交能力強的自由精神，總能找到理由微笑。',
    en: 'Campaigner - Enthusiastic, creative and sociable free spirits, always finding a reason to smile.',
  },
  ISTJ: {
    zh_TW: '物流師 - 實際且注重事實的個人，可靠性不容懷疑。',
    en: 'Logistician - Practical and fact-minded individuals, whose reliability cannot be doubted.',
  },
  ISFJ: {
    zh_TW: '守衛者 - 非常專注且溫暖的守護者，時刻準備著保護所愛之人。',
    en: 'Defender - Very dedicated and warm protectors, always ready to defend their loved ones.',
  },
  ESTJ: {
    zh_TW: '總經理 - 出色的管理者，在管理事務或人員方面無與倫比。',
    en: 'Executive - Excellent administrators, unsurpassed at managing things or people.',
  },
  ESFJ: {
    zh_TW: '執政官 - 極有同情心、受歡迎且樂於助人的人，總是渴望為社群做出貢獻。',
    en: 'Consul - Extraordinarily caring, social and popular people, always eager to help.',
  },
  ISTP: {
    zh_TW: '鑒賞家 - 大膽而實際的實驗者，擅長使用各種工具。',
    en: 'Virtuoso - Bold and practical experimenters, masters of all kinds of tools.',
  },
  ISFP: {
    zh_TW: '探險家 - 靈活且迷人的藝術家，時刻準備著探索和體驗新事物。',
    en: 'Adventurer - Flexible and charming artists, always ready to explore and experience something new.',
  },
  ESTP: {
    zh_TW: '企業家 - 聰明、精力充沛且善於洞察的人，真正享受生活在邊緣。',
    en: 'Entrepreneur - Smart, energetic and very perceptive people, who truly enjoy living on the edge.',
  },
  ESFP: {
    zh_TW: '表演者 - 自發、精力充沛且熱情的表演者，生活在他們周圍從不無聊。',
    en: 'Entertainer - Spontaneous, energetic and enthusiastic people – life is never boring around them.',
  },
};

// ============================================================================
// Test Logic Functions
// ============================================================================

/**
 * Get question by index (0-based)
 */
export function getQuestion(index: number, _language: string = 'zh-TW'): MBTIQuestion | null {
  if (index < 0 || index >= MBTI_QUESTIONS.length) {
    return null;
  }
  return MBTI_QUESTIONS[index];
}

/**
 * Get total number of questions
 */
export function getTotalQuestions(): number {
  return MBTI_QUESTIONS.length;
}

/**
 * Calculate MBTI result from answers
 */
export function calculateMBTIResult(answers: number[]): MBTIResult {
  if (answers.length !== MBTI_QUESTIONS.length) {
    throw new Error(`Invalid answers length: expected ${MBTI_QUESTIONS.length}, got ${answers.length}`);
  }

  // Initialize dimension scores
  const scores = {
    EI: 0,
    SN: 0,
    TF: 0,
    JP: 0,
  };

  // Sum up scores for each dimension
  answers.forEach((answerIndex, questionIndex) => {
    const question = MBTI_QUESTIONS[questionIndex];
    const option = question.options[answerIndex];
    if (option) {
      scores[question.dimension] += option.score;
    }
  });

  // Determine MBTI type
  const type =
    (scores.EI >= 0 ? 'E' : 'I') +
    (scores.SN >= 0 ? 'S' : 'N') +
    (scores.TF >= 0 ? 'T' : 'F') +
    (scores.JP >= 0 ? 'J' : 'P');

  // Validate type
  if (!MBTI_TYPES.includes(type as (typeof MBTI_TYPES)[number])) {
    throw new Error(`Invalid MBTI type calculated: ${type}`);
  }

  const description = MBTI_DESCRIPTIONS[type];

  return {
    type,
    dimensions: scores,
    description_zh_TW: description.zh_TW,
    description_en: description.en,
  };
}

/**
 * Validate answer index for a question
 */
export function isValidAnswer(questionIndex: number, answerIndex: number): boolean {
  const question = getQuestion(questionIndex);
  if (!question) return false;
  return answerIndex >= 0 && answerIndex < question.options.length;
}

/**
 * Get progress percentage
 */
export function getProgressPercentage(currentQuestion: number): number {
  return Math.round((currentQuestion / MBTI_QUESTIONS.length) * 100);
}

