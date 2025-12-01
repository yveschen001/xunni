export interface InterestCategory {
  id: string;
  items: string[];
}

export const INTEREST_STRUCTURE: InterestCategory[] = [
  {
    id: 'life',
    items: [
      'foodie', 'cafe_hopping', 'cooking', 'coffee', 'bar', 
      'shopping', 'diy', 'perfume', 'deco', 'pet', 'gardening'
    ]
  },
  {
    id: 'travel',
    items: [
      'domestic_travel', 'overseas_travel', 'backpacker', 'beach', 
      'hiking', 'camping', 'diving', 'cycling'
    ]
  },
  {
    id: 'sport',
    items: [
      'gym', 'jogging', 'yoga', 'swimming', 'basketball', 
      'football', 'badminton', 'dance', 'extreme_sports'
    ]
  },
  {
    id: 'art',
    items: [
      'painting', 'comics', 'photography', 'videography', 
      'handwriting', 'design', 'crafts', 'exhibition'
    ]
  },
  {
    id: 'music',
    items: [
      'listening_music', 'karaoke', 'instrument', 'dj', 
      'concert', 'theater'
    ]
  },
  {
    id: 'acg',
    items: [
      'mobile_games', 'pc_games', 'console_games', 'esports', 
      'party_games', 'board_games', 'anime', 'cosplay', 'figures'
    ]
  },
  {
    id: 'media',
    items: [
      'drama', 'movie', 'anime_movie', 'youtube', 'podcast', 
      'fandom', 'meme', 'social_media'
    ]
  },
  {
    id: 'learning',
    items: [
      'reading', 'business_book', 'online_course', 'language', 
      'coding', 'marketing', 'entrepreneurship', 'writing'
    ]
  },
  {
    id: 'finance',
    items: [
      'stock', 'crypto', 'finance_mgmt', 'gadgets', 'productivity'
    ]
  },
  {
    id: 'social',
    items: [
      'socializing', 'party', 'volunteer', 'psychology', 
      'self_growth', 'meditation', 'healing', 'spiritual'
    ]
  },
  {
    id: 'style',
    items: [
      'minimalism', 'slow_life', 'eco', 'vegetarian', 
      'career_focused', 'family'
    ]
  },
  {
    id: 'general',
    items: [
      'exploring'
    ]
  }
];

export const MAX_INTERESTS = 5;

