export interface TarotCard {
  id: number;
  name_en: string;
  name_zh: string;
  emoji: string; // Major Arcana or Suit emoji
}

export const MAJOR_ARCANA: TarotCard[] = [
  { id: 0, name_en: 'The Fool', name_zh: '愚者', emoji: '🃏' },
  { id: 1, name_en: 'The Magician', name_zh: '魔術師', emoji: '🪄' },
  { id: 2, name_en: 'The High Priestess', name_zh: '女祭司', emoji: '📜' },
  { id: 3, name_en: 'The Empress', name_zh: '皇后', emoji: '👑' },
  { id: 4, name_en: 'The Emperor', name_zh: '皇帝', emoji: '🤴' },
  { id: 5, name_en: 'The Hierophant', name_zh: '教皇', emoji: '⛪' },
  { id: 6, name_en: 'The Lovers', name_zh: '戀人', emoji: '💕' },
  { id: 7, name_en: 'The Chariot', name_zh: '戰車', emoji: '🛒' }, // Chariot emoji? 🛒 is shopping cart. 🛡️ or ⚔️ maybe? Let's use 🐎
  { id: 8, name_en: 'Strength', name_zh: '力量', emoji: '🦁' },
  { id: 9, name_en: 'The Hermit', name_zh: '隱士', emoji: '🕯️' },
  { id: 10, name_en: 'Wheel of Fortune', name_zh: '命運之輪', emoji: '🎡' },
  { id: 11, name_en: 'Justice', name_zh: '正義', emoji: '⚖️' },
  { id: 12, name_en: 'The Hanged Man', name_zh: '倒吊人', emoji: '🙃' },
  { id: 13, name_en: 'Death', name_zh: '死神', emoji: '💀' },
  { id: 14, name_en: 'Temperance', name_zh: '節制', emoji: '🍷' },
  { id: 15, name_en: 'The Devil', name_zh: '惡魔', emoji: '😈' },
  { id: 16, name_en: 'The Tower', name_zh: '高塔', emoji: '⚡' },
  { id: 17, name_en: 'The Star', name_zh: '星星', emoji: '⭐' },
  { id: 18, name_en: 'The Moon', name_zh: '月亮', emoji: '🌙' },
  { id: 19, name_en: 'The Sun', name_zh: '太陽', emoji: '☀️' },
  { id: 20, name_en: 'Judgement', name_zh: '審判', emoji: '🎺' },
  { id: 21, name_en: 'The World', name_zh: '世界', emoji: '🌍' }
];

// Simplified for now: Only Major Arcana or Full?
// Design doc says: "Emoji + Text (e.g. 🃏 愚者 (正位))"
// Let's stick to Major Arcana for MVP simplicity and better prompt quality, or mix?
// Usually full deck is better. Let's add suits briefly.

const SUITS = [
  { name: 'Wands', name_zh: '權杖', emoji: '🪵' },
  { name: 'Cups', name_zh: '聖杯', emoji: '🏆' },
  { name: 'Swords', name_zh: '寶劍', emoji: '⚔️' },
  { name: 'Pentacles', name_zh: '錢幣', emoji: '🪙' }
];

export const FULL_DECK: TarotCard[] = [...MAJOR_ARCANA];

let idCounter = 22;
for (const suit of SUITS) {
  for (let i = 1; i <= 14; i++) {
    let name = `${i}`;
    let name_zh = `${i}`;
    if (i === 1) { name = 'Ace'; name_zh = '王牌'; }
    if (i === 11) { name = 'Page'; name_zh = '侍大'; }
    if (i === 12) { name = 'Knight'; name_zh = '騎士'; }
    if (i === 13) { name = 'Queen'; name_zh = '王后'; }
    if (i === 14) { name = 'King'; name_zh = '國王'; }
    
    FULL_DECK.push({
      id: idCounter++,
      name_en: `${name} of ${suit.name}`,
      name_zh: `${suit.name_zh}${name_zh}`,
      emoji: suit.emoji
    });
  }
}

export function drawCards(count: number = 3): { card: TarotCard, reversed: boolean }[] {
  const deck = [...FULL_DECK];
  const result: { card: TarotCard, reversed: boolean }[] = [];
  
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * deck.length);
    const card = deck.splice(randomIndex, 1)[0];
    const reversed = Math.random() < 0.5; // 50% chance of reversal
    result.push({ card, reversed });
  }
  
  return result;
}

export function getCardDisplay(card: TarotCard, reversed: boolean, i18n?: any): string {
    // If i18n provided, try to translate? For now use static ZH/EN
    // Design doc: "Emoji + Text"
    const position = reversed ? '(逆位)' : '(正位)';
    return `${card.emoji} ${card.name_zh} ${position}`;
}

