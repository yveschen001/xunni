export const JOB_ROLES = [
  'employee',
  'freelancer',
  'founder',
  'part_time',
  'student',
  'homemaker',
  'investor',
  'retired',
  'unemployed',
  'decline'
] as const;

export type JobRole = typeof JOB_ROLES[number];

export interface IndustryCategory {
  id: string;
  items: string[];
}

export const INDUSTRIES: IndustryCategory[] = [
  {
    id: 'tech',
    items: ['dev', 'ai', 'mis', 'security', 'network']
  },
  {
    id: 'internet',
    items: ['platform', 'productivity', 'community', 'web3']
  },
  {
    id: 'finance',
    items: ['bank', 'insurance', 'fintech', 'consultant']
  },
  {
    id: 'professional',
    items: ['accounting', 'legal', 'management', 'hr']
  },
  {
    id: 'marketing',
    items: ['digital', 'branding', 'ads', 'content']
  },
  {
    id: 'media',
    items: ['news', 'publishing', 'writing', 'podcast']
  },
  {
    id: 'entertainment',
    items: ['film', 'music', 'art', 'design']
  },
  {
    id: 'game_acg',
    items: ['game_dev', 'game_ops', 'esports', 'anime', 'streamer']
  },
  {
    id: 'manufacturing',
    items: ['general', 'machinery', 'electronics', 'automotive']
  },
  {
    id: 'energy',
    items: ['oil', 'power', 'chemical', 'mining']
  },
  {
    id: 'construction',
    items: ['architecture', 'civil', 'developer', 'real_estate']
  },
  {
    id: 'logistics',
    items: ['logistics_intl', 'warehouse', 'transport', 'supply_chain']
  },
  {
    id: 'retail',
    items: ['wholesale', 'department', 'retail_shop', 'trade']
  },
  {
    id: 'service', // Dining, Travel, Leisure
    items: ['restaurant', 'hotel', 'travel', 'leisure']
  },
  {
    id: 'medical',
    items: ['hospital', 'pharma', 'rehab', 'counseling', 'care']
  },
  {
    id: 'education',
    items: ['teacher', 'cram_school', 'online_edu', 'research', 'training']
  },
  {
    id: 'public',
    items: ['civil_servant', 'public_corp', 'military', 'ngo', 'religious']
  },
  {
    id: 'agriculture',
    items: ['farming', 'fishery', 'forestry', 'environment']
  },
  {
    id: 'beauty',
    items: ['beauty_spa', 'fitness', 'fashion', 'wedding', 'other_service']
  },
  {
    id: 'flexible',
    items: ['homemaker_full', 'student_full', 'investor_full', 'slasher', 'seeking', 'other_industry']
  }
];

export const INDUSTRY_CATEGORIES = INDUSTRIES.map(c => c.id);

