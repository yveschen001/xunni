import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const CSV_PATH = resolve(process.cwd(), 'i18n_for_translation.csv');
const OUTPUT_PATH = resolve(process.cwd(), 'src/utils/intents.ts');

const LANG_COLUMNS = [
  'zh-TW', 'zh-CN', 'en', 'ja', 'ko', 'vi', 'th', 'id', 'ms', 'tl',
  'hi', 'ar', 'ur', 'fa', 'he', 'tr', 'ru', 'uk', 'pl', 'cs', 
  'ro', 'hu', 'bn', 'hr', 'sk', 'sl', 'sr', 'mk', 'sq', 'el', 
  'de', 'fr', 'es', 'it', 'pt', 'nl', 'sv', 'no', 'da', 'fi'
];

// Manual keywords to ensure are present (as requested by user)
const MANUAL_KEYWORDS: Record<string, { throw: string[], catch: string[] }> = {
  'zh-TW': { throw: ['丟', '瓶子', '漂流瓶', '祝福', '許願', '扔', '幸運', '祈福'], catch: ['撿', '撈', '看', '收'] },
  'zh-CN': { throw: ['丢', '瓶子', '漂流瓶', '祝福', '许愿', '扔', '幸运', '祈福'], catch: ['捡', '捞', '看', '收'] },
  'en': { throw: ['throw', 'bottle', 'drift', 'blessing', 'wish', 'lucky'], catch: ['catch', 'pick', 'get'] },
  'ja': { throw: ['投げる', 'ボトル', '漂流瓶', '祈り', '願い', '祝福', 'ラッキー', '幸運'], catch: ['拾う', 'キャッチ', '受け取る', '読む'] },
  'ko': { throw: ['던지기', '병', '표류병', '축복', '기도', '행운', '소원'], catch: ['줍기', '받기', '읽기'] },
  // ... others will be populated from CSV
};

function cleanText(text: string): string[] {
  if (!text) return [];
  // Remove emojis
  let clean = text.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
  // Remove punctuation and special chars
  clean = clean.replace(/[!.,;?\/\\|\[\](){}+=*&^%$#@~`"':<>_-]/g, ' ');
  // Split by space
  return clean.split(/\s+/).filter(w => w.length > 1).map(w => w.toLowerCase());
}

function main() {
  const content = readFileSync(CSV_PATH, 'utf-8');
  const lines = content.split('\n');
  const header = lines[0].split(',');
  
  const colMap: Record<string, number> = {};
  header.forEach((h, i) => {
    if (LANG_COLUMNS.includes(h.trim())) {
      colMap[h.trim()] = i;
    }
  });

  const intentData: Record<string, { throw: Set<string>, catch: Set<string> }> = {};
  
  // Initialize with manual keywords
  LANG_COLUMNS.forEach(lang => {
    intentData[lang] = { throw: new Set(), catch: new Set() };
    if (MANUAL_KEYWORDS[lang]) {
      MANUAL_KEYWORDS[lang].throw.forEach(k => intentData[lang].throw.add(k.toLowerCase()));
      MANUAL_KEYWORDS[lang].catch.forEach(k => intentData[lang].catch.add(k.toLowerCase()));
    }
  });

  // Parse CSV
  // Simple CSV parser that handles basic quotes (not perfect but sufficient for this specific file structure we saw)
  // Actually, let's just find lines starting with specific keys
  
  const targetKeysThrow = ['buttons.bottle3', 'common.bottle31']; // Throw keys
  const targetKeysCatch = ['buttons.bottle4', 'common.bottle28']; // Catch keys

  lines.forEach(line => {
    // Simple split might fail with commas in quotes, but let's try a smarter regex split or just simple match
    // Given the grep output, the relevant keys don't seem to have internal commas in the values for these specific keys
    // except maybe list separators in some langs?
    // Let's use a robust regex for CSV parsing line by line
    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g); 
    // This regex is flaky. Let's rely on the fact that keys are at the start.
    
    let key = '';
    if (line.startsWith('buttons.bottle3')) key = 'buttons.bottle3';
    else if (line.startsWith('buttons.bottle4')) key = 'buttons.bottle4';
    else if (line.startsWith('common.bottle31')) key = 'common.bottle31';
    else if (line.startsWith('common.bottle28')) key = 'common.bottle28';
    
    if (!key) return;

    // Split line by comma, handling quotes
    const cells: string[] = [];
    let currentCell = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cells.push(currentCell);
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell);

    // Process cells based on colMap
    LANG_COLUMNS.forEach(lang => {
      const colIdx = colMap[lang];
      if (colIdx !== undefined && cells[colIdx]) {
        let text = cells[colIdx];
        // Clean quotes
        if (text.startsWith('"') && text.endsWith('"')) text = text.slice(1, -1);
        text = text.replace(/""/g, '"'); // Unescape double quotes
        
        const words = cleanText(text);
        
        if (targetKeysThrow.includes(key)) {
          words.forEach(w => intentData[lang].throw.add(w));
        } else if (targetKeysCatch.includes(key)) {
          words.forEach(w => intentData[lang].catch.add(w));
        }
      }
    });
  });

  // Generate output file
  let output = `/**
 * Intent Recognition Keywords
 * 
 * Defines keywords for various user intents across ${LANG_COLUMNS.length} supported languages.
 * Generated from i18n_for_translation.csv and manual entries.
 */

export const INTENT_KEYWORDS: Record<string, Record<string, string[]>> = {
  THROW_BOTTLE: {
`;

  LANG_COLUMNS.forEach(lang => {
    const keywords = Array.from(intentData[lang].throw).filter(k => k.length > 0);
    if (keywords.length > 0) {
      output += `    // ${lang}\n`;
      output += `    '${lang}': ${JSON.stringify(keywords)},\n`;
    }
  });

  output += `    // General fallback\n    'general': ['throw', 'bottle', 'drift', 'blessing']
  },
  
  CATCH_BOTTLE: {
`;

  LANG_COLUMNS.forEach(lang => {
    const keywords = Array.from(intentData[lang].catch).filter(k => k.length > 0);
    if (keywords.length > 0) {
      output += `    // ${lang}\n`;
      output += `    '${lang}': ${JSON.stringify(keywords)},\n`;
    }
  });

  output += `    // General fallback\n    'general': ['catch', 'pick', 'get']
  }
};

/**
 * Check if text matches any keywords for a specific intent
 */
export function matchIntent(text: string, intent: keyof typeof INTENT_KEYWORDS): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  const keywordsMap = INTENT_KEYWORDS[intent];
  
  // 1. Check all specific language keywords
  // We prioritize iterating all because we don't know the user's input language for sure here
  // (User might type English even if setting is Chinese)
  for (const lang in keywordsMap) {
    const keywords = keywordsMap[lang];
    if (keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))) {
      return true;
    }
  }
  
  return false;
}
`;

  writeFileSync(OUTPUT_PATH, output);
  console.log(`Generated intents at ${OUTPUT_PATH}`);
}

main();

