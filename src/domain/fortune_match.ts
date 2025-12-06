/**
 * Fortune Match Domain Logic
 *
 * Handles compatibility calculation and logic for fortune matching.
 */

interface MatchProfile {
  mbti: string;
  zodiac: string;
  bloodType: string;
  birthTime?: string; // Optional for basic match
  birthCity?: string; // Optional for basic match
}

interface MatchResult {
  score: number;
  compatibility: 'high' | 'medium' | 'low';
  description_key: string;
  details: {
    mbti_score: number;
    zodiac_score: number;
    blood_score: number;
  };
}

/**
 * Calculate compatibility score between two profiles
 *
 * Basic algorithm:
 * - MBTI: 40%
 * - Zodiac: 40%
 * - Blood Type: 20%
 *
 * TODO: Implement complex astrological calculation if birth time is available
 */
export function calculateMatchScore(userA: MatchProfile, userB: MatchProfile): MatchResult {
  // 1. MBTI Compatibility (Simplified)
  const mbtiScore = getMbtiCompatibility(userA.mbti, userB.mbti);

  // 2. Zodiac Compatibility
  const zodiacScore = getZodiacCompatibility(userA.zodiac, userB.zodiac);

  // 3. Blood Type Compatibility
  const bloodScore = getBloodTypeCompatibility(userA.bloodType, userB.bloodType);

  // Weighted Total
  const totalScore = (mbtiScore * 0.4) + (zodiacScore * 0.4) + (bloodScore * 0.2);

  let compatibility: 'high' | 'medium' | 'low' = 'medium';
  let description_key = 'match.medium';

  if (totalScore >= 80) {
    compatibility = 'high';
    description_key = 'match.high';
  } else if (totalScore < 50) {
    compatibility = 'low';
    description_key = 'match.low';
  }

  return {
    score: Math.round(totalScore),
    compatibility,
    description_key,
    details: {
      mbti_score: mbtiScore,
      zodiac_score: zodiacScore,
      blood_score: bloodScore,
    },
  };
}

// --- Helpers (Mock logic for now, replace with real astrological data later) ---

function getMbtiCompatibility(typeA: string, typeB: string): number {
  if (!typeA || !typeB) return 50;
  // Same type? Usually good understanding but potential conflict
  if (typeA === typeB) return 70;
  
  // Ideal matches (Example: INTJ + ENFP)
  // Simplified: Check if share 2 letters
  let shared = 0;
  for (let i = 0; i < 4; i++) {
    if (typeA[i] === typeB[i]) shared++;
  }
  
  // 2 shared is balanced (80), 0 shared is complementary (90), 4 shared is same (70)
  // 3 shared is often friction (60)
  if (shared === 0) return 90; // Opposites attract?
  if (shared === 1) return 85;
  if (shared === 2) return 80;
  if (shared === 3) return 60;
  
  return 70;
}

function getZodiacCompatibility(signA: string, signB: string): number {
  if (!signA || !signB) return 50;
  // Element check?
  // Fire: Aries, Leo, Sagittarius
  // Earth: Taurus, Virgo, Capricorn
  // Air: Gemini, Libra, Aquarius
  // Water: Cancer, Scorpio, Pisces
  
  const elements: Record<string, string> = {
    'Aries': 'Fire', 'Leo': 'Fire', 'Sagittarius': 'Fire',
    'Taurus': 'Earth', 'Virgo': 'Earth', 'Capricorn': 'Earth',
    'Gemini': 'Air', 'Libra': 'Air', 'Aquarius': 'Air',
    'Cancer': 'Water', 'Scorpio': 'Water', 'Pisces': 'Water'
  };

  const elemA = elements[signA];
  const elemB = elements[signB];

  if (elemA === elemB) return 90; // Same element
  
  // Compatible elements: Fire+Air, Earth+Water
  if ((elemA === 'Fire' && elemB === 'Air') || (elemA === 'Air' && elemB === 'Fire')) return 85;
  if ((elemA === 'Earth' && elemB === 'Water') || (elemA === 'Water' && elemB === 'Earth')) return 85;

  return 60; // Others
}

function getBloodTypeCompatibility(typeA: string, typeB: string): number {
  if (!typeA || !typeB) return 50;
  // A likes O, AB
  // B likes O, AB
  // O likes A, B
  // AB likes A, B
  if (typeA === 'O' && (typeB === 'A' || typeB === 'B')) return 90;
  if ((typeA === 'A' || typeA === 'B') && typeB === 'O') return 85;
  return 70;
}

