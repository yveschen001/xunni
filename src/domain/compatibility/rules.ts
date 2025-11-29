import type { User } from '../user';

/**
 * Zodiac (星座) - Four Elements Rule
 * 火象: Aries, Leo, Sagittarius
 * 土象: Taurus, Virgo, Capricorn
 * 風象: Gemini, Libra, Aquarius
 * 水象: Cancer, Scorpio, Pisces
 */
export type ZodiacSign =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

export type ZodiacElement = 'fire' | 'earth' | 'air' | 'water';

export const ZODIAC_ELEMENTS: Record<ZodiacSign, ZodiacElement> = {
  aries: 'fire',
  leo: 'fire',
  sagittarius: 'fire',
  taurus: 'earth',
  virgo: 'earth',
  capricorn: 'earth',
  gemini: 'air',
  libra: 'air',
  aquarius: 'air',
  cancer: 'water',
  scorpio: 'water',
  pisces: 'water',
};

/**
 * Zodiac Compatibility Rules
 * 基于四象限元素法的配对逻辑
 */
export const ZODIAC_MATCH_RULES: Record<
  ZodiacElement,
  {
    targets: ZodiacElement[];
    reasonKey: string;
  }
> = {
  fire: {
    targets: ['fire', 'air'],
    reasonKey: 'match.reason.zodiac.fire_affinity', // 火象+火象/风象: 热情奔放/风助火势
  },
  earth: {
    targets: ['earth', 'water'],
    reasonKey: 'match.reason.zodiac.earth_affinity', // 土象+土象/水象: 稳定踏实/细水长流
  },
  air: {
    targets: ['air', 'fire'],
    reasonKey: 'match.reason.zodiac.air_affinity', // 风象+风象/火象: 沟通无碍/充满灵感
  },
  water: {
    targets: ['water', 'earth'],
    reasonKey: 'match.reason.zodiac.water_affinity', // 水象+水象/土象: 情感共鸣/互相依赖
  },
};

/**
 * MBTI - Keirsey Temperament Sorter
 * SJ (Guardians): ESTJ, ISTJ, ESFJ, ISFJ
 * SP (Artisans): ESTP, ISTP, ESFP, ISFP
 * NF (Idealists): ENFJ, INFJ, ENFP, INFP
 * NT (Rationals): ENTJ, INTJ, ENTP, INTP
 */
export type MbtiType = string; // e.g., "INTJ"
export type MbtiTemperament = 'SJ' | 'SP' | 'NF' | 'NT';

export function getMbtiTemperament(type: string): MbtiTemperament | null {
  const t = type.toUpperCase();
  if (t.includes('S') && t.includes('J')) return 'SJ';
  if (t.includes('S') && t.includes('P')) return 'SP';
  if (t.includes('N') && t.includes('F')) return 'NF';
  if (t.includes('N') && t.includes('T')) return 'NT';
  return null;
}

/**
 * MBTI Compatibility Rules
 * 基于气质互补理论
 */
export const MBTI_MATCH_RULES: Record<
  MbtiTemperament,
  {
    targets: MbtiTemperament[];
    reasonKey: string;
  }
> = {
  SJ: {
    targets: ['SP', 'SJ'],
    reasonKey: 'match.reason.mbti.sj_affinity', // SJ+SP: 稳定与刺激互补
  },
  SP: {
    targets: ['SJ', 'SP'],
    reasonKey: 'match.reason.mbti.sp_affinity', // SP+SJ: 玩伴与照顾者
  },
  NF: {
    targets: ['NT', 'NF'],
    reasonKey: 'match.reason.mbti.nf_affinity', // NF+NT: 灵魂与理性的碰撞
  },
  NT: {
    targets: ['NF', 'NT'],
    reasonKey: 'match.reason.mbti.nt_affinity', // NT+NF: 思想与情感的共鸣
  },
};

/**
 * Blood Type Rules
 * 基于日韩流行的血型性格分析
 */
export type BloodType = 'A' | 'B' | 'O' | 'AB';

export const BLOOD_MATCH_RULES: Record<
  BloodType,
  {
    targets: BloodType[];
    reasonKey: string;
  }
> = {
  A: {
    targets: ['O', 'A'],
    reasonKey: 'match.reason.blood.a_affinity', // A+O: 细心被包容
  },
  B: {
    targets: ['O', 'AB'],
    reasonKey: 'match.reason.blood.b_affinity', // B+O: 自我配随和
  },
  O: {
    targets: ['B', 'A'],
    reasonKey: 'match.reason.blood.o_affinity', // O+B: 互补的最佳拍档
  },
  AB: {
    targets: ['AB', 'B'],
    reasonKey: 'match.reason.blood.ab_affinity', // AB+AB: 独特的频率
  },
};
