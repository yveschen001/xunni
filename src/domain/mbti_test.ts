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
// MBTI Test Questions
// ============================================================================

/**
 * Quick MBTI test with 12 questions (3 per dimension)
 * This is a simplified test suitable for bot conversation flow.
 * 
 * ⚠️ DISCLAIMER: Results are for reference only. This is not a professional assessment.
 * 
 * For more accurate results:
 * - Standard test (36 questions): Available for retake
 * - Professional test (60 questions, 5 options): Planned for VIP users
 * 
 * Industry standard: 60-93 questions with 5-7 options per question
 */
export const MBTI_QUESTIONS_QUICK: MBTIQuestion[] = [
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
 * @param answers Array of answer indices
 * @param version Test version ('quick' or 'full'), defaults to auto-detect based on length
 */
export function calculateMBTIResult(answers: number[], version?: 'quick' | 'full'): MBTIResult {
  // Auto-detect version if not specified
  let questions: MBTIQuestion[];
  if (version) {
    questions = getMBTIQuestions(version);
  } else {
    // Auto-detect based on answer length
    if (answers.length === 12) {
      questions = MBTI_QUESTIONS_QUICK;
    } else if (answers.length === 36) {
      questions = MBTI_QUESTIONS_FULL;
    } else {
      throw new Error(`Invalid answers length: expected 12 or 36, got ${answers.length}`);
    }
  }

  if (answers.length !== questions.length) {
    throw new Error(`Invalid answers length for ${version || 'auto-detected'} version: expected ${questions.length}, got ${answers.length}`);
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
    const question = questions[questionIndex];
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
export function getProgressPercentage(currentQuestion: number, totalQuestions: number = MBTI_QUESTIONS.length): number {
  return Math.round((currentQuestion / totalQuestions) * 100);
}

// ============================================================================
// Backward Compatibility & Version Support
// ============================================================================

/**
 * Default MBTI questions (backward compatibility)
 * ⚠️ DO NOT MODIFY - Used by existing onboarding flow
 */
export const MBTI_QUESTIONS = MBTI_QUESTIONS_QUICK;

/**
 * Full MBTI test with 36 questions (9 per dimension)
 * More comprehensive test for retake functionality
 * 
 * ⚠️ DISCLAIMER: Results are for reference only. This is not a professional assessment.
 */
export const MBTI_QUESTIONS_FULL: MBTIQuestion[] = [
  // ========== E/I Questions (1-9) ==========
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
  {
    id: 4,
    dimension: 'EI',
    question_zh_TW: '在團隊中，你更傾向於：',
    question_en: 'In a team, you tend to:',
    options: [
      { text_zh_TW: '積極發表意見', text_en: 'Actively share opinions', score: 2 },
      { text_zh_TW: '先聽後說', text_en: 'Listen first, speak later', score: -2 },
    ],
  },
  {
    id: 5,
    dimension: 'EI',
    question_zh_TW: '遇到新朋友時，你會：',
    question_en: 'When meeting new people, you:',
    options: [
      { text_zh_TW: '很快就能熟絡起來', text_en: 'Quickly become familiar', score: 2 },
      { text_zh_TW: '需要時間慢慢熟悉', text_en: 'Need time to warm up', score: -2 },
    ],
  },
  {
    id: 6,
    dimension: 'EI',
    question_zh_TW: '你的朋友圈：',
    question_en: 'Your friend circle is:',
    options: [
      { text_zh_TW: '廣泛但不深入', text_en: 'Wide but not deep', score: 2 },
      { text_zh_TW: '小而親密', text_en: 'Small but intimate', score: -2 },
    ],
  },
  {
    id: 7,
    dimension: 'EI',
    question_zh_TW: '工作時，你更喜歡：',
    question_en: 'At work, you prefer:',
    options: [
      { text_zh_TW: '團隊合作', text_en: 'Team collaboration', score: 2 },
      { text_zh_TW: '獨立工作', text_en: 'Working independently', score: -2 },
    ],
  },
  {
    id: 8,
    dimension: 'EI',
    question_zh_TW: '思考問題時，你傾向於：',
    question_en: 'When thinking, you tend to:',
    options: [
      { text_zh_TW: '邊說邊想', text_en: 'Think out loud', score: 2 },
      { text_zh_TW: '先想好再說', text_en: 'Think first, speak later', score: -2 },
    ],
  },
  {
    id: 9,
    dimension: 'EI',
    question_zh_TW: '壓力大時，你會：',
    question_en: 'When stressed, you:',
    options: [
      { text_zh_TW: '找朋友聊天', text_en: 'Talk to friends', score: 2 },
      { text_zh_TW: '獨自消化', text_en: 'Process alone', score: -2 },
    ],
  },

  // ========== S/N Questions (10-18) ==========
  {
    id: 10,
    dimension: 'SN',
    question_zh_TW: '解決問題時，你更依賴：',
    question_en: 'When solving problems, you rely more on:',
    options: [
      { text_zh_TW: '實際經驗和事實', text_en: 'Practical experience and facts', score: 2 },
      { text_zh_TW: '直覺和可能性', text_en: 'Intuition and possibilities', score: -2 },
    ],
  },
  {
    id: 11,
    dimension: 'SN',
    question_zh_TW: '你更喜歡：',
    question_en: 'You prefer:',
    options: [
      { text_zh_TW: '關注具體細節', text_en: 'Focusing on concrete details', score: 2 },
      { text_zh_TW: '關注整體概念', text_en: 'Focusing on overall concepts', score: -2 },
    ],
  },
  {
    id: 12,
    dimension: 'SN',
    question_zh_TW: '學習新事物時，你更喜歡：',
    question_en: 'When learning something new, you prefer:',
    options: [
      { text_zh_TW: '按部就班的方法', text_en: 'Step-by-step methods', score: 2 },
      { text_zh_TW: '探索創新的方式', text_en: 'Exploring innovative ways', score: -2 },
    ],
  },
  {
    id: 13,
    dimension: 'SN',
    question_zh_TW: '閱讀時，你更喜歡：',
    question_en: 'When reading, you prefer:',
    options: [
      { text_zh_TW: '實用的指南', text_en: 'Practical guides', score: 2 },
      { text_zh_TW: '理論和概念', text_en: 'Theories and concepts', score: -2 },
    ],
  },
  {
    id: 14,
    dimension: 'SN',
    question_zh_TW: '你更關注：',
    question_en: 'You focus more on:',
    options: [
      { text_zh_TW: '現在和過去', text_en: 'Present and past', score: 2 },
      { text_zh_TW: '未來和可能性', text_en: 'Future and possibilities', score: -2 },
    ],
  },
  {
    id: 15,
    dimension: 'SN',
    question_zh_TW: '描述事物時，你傾向於：',
    question_en: 'When describing things, you tend to:',
    options: [
      { text_zh_TW: '使用具體例子', text_en: 'Use concrete examples', score: 2 },
      { text_zh_TW: '使用比喻和類比', text_en: 'Use metaphors and analogies', score: -2 },
    ],
  },
  {
    id: 16,
    dimension: 'SN',
    question_zh_TW: '工作中，你更重視：',
    question_en: 'At work, you value more:',
    options: [
      { text_zh_TW: '實際應用', text_en: 'Practical application', score: 2 },
      { text_zh_TW: '創新想法', text_en: 'Innovative ideas', score: -2 },
    ],
  },
  {
    id: 17,
    dimension: 'SN',
    question_zh_TW: '你更信任：',
    question_en: 'You trust more:',
    options: [
      { text_zh_TW: '已驗證的方法', text_en: 'Proven methods', score: 2 },
      { text_zh_TW: '新的嘗試', text_en: 'New attempts', score: -2 },
    ],
  },
  {
    id: 18,
    dimension: 'SN',
    question_zh_TW: '規劃未來時，你會：',
    question_en: 'When planning the future, you:',
    options: [
      { text_zh_TW: '基於現實條件', text_en: 'Base on realistic conditions', score: 2 },
      { text_zh_TW: '想像各種可能', text_en: 'Imagine various possibilities', score: -2 },
    ],
  },

  // ========== T/F Questions (19-27) ==========
  {
    id: 19,
    dimension: 'TF',
    question_zh_TW: '做決定時，你更重視：',
    question_en: 'When making decisions, you value more:',
    options: [
      { text_zh_TW: '邏輯和客觀分析', text_en: 'Logic and objective analysis', score: 2 },
      { text_zh_TW: '情感和人際和諧', text_en: 'Emotions and interpersonal harmony', score: -2 },
    ],
  },
  {
    id: 20,
    dimension: 'TF',
    question_zh_TW: '批評他人時，你會：',
    question_en: 'When criticizing others, you:',
    options: [
      { text_zh_TW: '直接指出問題', text_en: 'Point out problems directly', score: 2 },
      { text_zh_TW: '考慮對方感受', text_en: 'Consider their feelings', score: -2 },
    ],
  },
  {
    id: 21,
    dimension: 'TF',
    question_zh_TW: '你更看重：',
    question_en: 'You value more:',
    options: [
      { text_zh_TW: '公平和正義', text_en: 'Fairness and justice', score: 2 },
      { text_zh_TW: '同情和理解', text_en: 'Compassion and understanding', score: -2 },
    ],
  },
  {
    id: 22,
    dimension: 'TF',
    question_zh_TW: '評價一個想法時，你首先考慮：',
    question_en: 'When evaluating an idea, you first consider:',
    options: [
      { text_zh_TW: '是否合理', text_en: 'Whether it is logical', score: 2 },
      { text_zh_TW: '是否有益', text_en: 'Whether it is beneficial', score: -2 },
    ],
  },
  {
    id: 23,
    dimension: 'TF',
    question_zh_TW: '朋友向你傾訴時，你會：',
    question_en: 'When a friend confides in you, you:',
    options: [
      { text_zh_TW: '分析問題並提供建議', text_en: 'Analyze and give advice', score: 2 },
      { text_zh_TW: '傾聽並給予安慰', text_en: 'Listen and provide comfort', score: -2 },
    ],
  },
  {
    id: 24,
    dimension: 'TF',
    question_zh_TW: '衝突中，你更傾向於：',
    question_en: 'In conflicts, you tend to:',
    options: [
      { text_zh_TW: '堅持原則', text_en: 'Stick to principles', score: 2 },
      { text_zh_TW: '維持關係', text_en: 'Maintain relationships', score: -2 },
    ],
  },
  {
    id: 25,
    dimension: 'TF',
    question_zh_TW: '你更容易被說服通過：',
    question_en: 'You are more easily convinced by:',
    options: [
      { text_zh_TW: '事實和數據', text_en: 'Facts and data', score: 2 },
      { text_zh_TW: '情感和故事', text_en: 'Emotions and stories', score: -2 },
    ],
  },
  {
    id: 26,
    dimension: 'TF',
    question_zh_TW: '團隊決策時，你更關注：',
    question_en: 'In team decisions, you focus more on:',
    options: [
      { text_zh_TW: '效率和結果', text_en: 'Efficiency and results', score: 2 },
      { text_zh_TW: '共識和團結', text_en: 'Consensus and unity', score: -2 },
    ],
  },
  {
    id: 27,
    dimension: 'TF',
    question_zh_TW: '你認為好的領導者應該：',
    question_en: 'You think a good leader should:',
    options: [
      { text_zh_TW: '公正果斷', text_en: 'Be fair and decisive', score: 2 },
      { text_zh_TW: '體貼關懷', text_en: 'Be caring and considerate', score: -2 },
    ],
  },

  // ========== J/P Questions (28-36) ==========
  {
    id: 28,
    dimension: 'JP',
    question_zh_TW: '你的工作方式是：',
    question_en: 'Your work style is:',
    options: [
      { text_zh_TW: '提前計劃和準備', text_en: 'Planning and preparing in advance', score: 2 },
      { text_zh_TW: '隨機應變和靈活', text_en: 'Adapting and being flexible', score: -2 },
    ],
  },
  {
    id: 29,
    dimension: 'JP',
    question_zh_TW: '你更喜歡：',
    question_en: 'You prefer:',
    options: [
      { text_zh_TW: '有明確的截止日期', text_en: 'Having clear deadlines', score: 2 },
      { text_zh_TW: '保持開放的選擇', text_en: 'Keeping options open', score: -2 },
    ],
  },
  {
    id: 30,
    dimension: 'JP',
    question_zh_TW: '旅行時，你傾向於：',
    question_en: 'When traveling, you tend to:',
    options: [
      { text_zh_TW: '制定詳細行程', text_en: 'Make detailed itineraries', score: 2 },
      { text_zh_TW: '隨心所欲探索', text_en: 'Explore spontaneously', score: -2 },
    ],
  },
  {
    id: 31,
    dimension: 'JP',
    question_zh_TW: '你的房間通常：',
    question_en: 'Your room is usually:',
    options: [
      { text_zh_TW: '整齊有序', text_en: 'Neat and organized', score: 2 },
      { text_zh_TW: '隨性自在', text_en: 'Casual and comfortable', score: -2 },
    ],
  },
  {
    id: 32,
    dimension: 'JP',
    question_zh_TW: '處理任務時，你會：',
    question_en: 'When handling tasks, you:',
    options: [
      { text_zh_TW: '盡早完成', text_en: 'Finish early', score: 2 },
      { text_zh_TW: '接近截止日期才完成', text_en: 'Finish near deadline', score: -2 },
    ],
  },
  {
    id: 33,
    dimension: 'JP',
    question_zh_TW: '你更喜歡的生活方式：',
    question_en: 'Your preferred lifestyle:',
    options: [
      { text_zh_TW: '有規律和結構', text_en: 'Regular and structured', score: 2 },
      { text_zh_TW: '自由和彈性', text_en: 'Free and flexible', score: -2 },
    ],
  },
  {
    id: 34,
    dimension: 'JP',
    question_zh_TW: '做決定時，你傾向於：',
    question_en: 'When making decisions, you tend to:',
    options: [
      { text_zh_TW: '快速決定', text_en: 'Decide quickly', score: 2 },
      { text_zh_TW: '保留選擇權', text_en: 'Keep options open', score: -2 },
    ],
  },
  {
    id: 35,
    dimension: 'JP',
    question_zh_TW: '購物時，你會：',
    question_en: 'When shopping, you:',
    options: [
      { text_zh_TW: '列清單按計劃購買', text_en: 'Make a list and follow it', score: 2 },
      { text_zh_TW: '隨意逛逛看到喜歡就買', text_en: 'Browse and buy what you like', score: -2 },
    ],
  },
  {
    id: 36,
    dimension: 'JP',
    question_zh_TW: '面對變化，你通常：',
    question_en: 'Facing changes, you usually:',
    options: [
      { text_zh_TW: '感到不安', text_en: 'Feel uncomfortable', score: 2 },
      { text_zh_TW: '感到興奮', text_en: 'Feel excited', score: -2 },
    ],
  },
];

/**
 * Get questions by version
 */
export function getMBTIQuestions(version: 'quick' | 'full' = 'quick'): MBTIQuestion[] {
  return version === 'full' ? MBTI_QUESTIONS_FULL : MBTI_QUESTIONS_QUICK;
}

/**
 * Get total questions for a version
 */
export function getTotalQuestionsByVersion(version: 'quick' | 'full' = 'quick'): number {
  return getMBTIQuestions(version).length;
}

