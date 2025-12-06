import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

// ==========================================
// 1. CONFIGURATION & TERMINOLOGY MAPS
// ==========================================

const SOURCE_LANG = 'zh-TW';
const LOCALES_DIR = path.join(process.cwd(), 'src/i18n/locales');
const MAX_CONCURRENT_REQS = 15; // Concurrent request limit
const BATCH_SIZE = 50; // Keys per API call

// OFFICIAL SUPPORTED LANGUAGES (40 total)
const SUPPORTED_LANGS = new Set([
  'zh-TW', 'zh-CN', 'en', 'ja', 'ko', 'vi', 'th', 'id', 'ms', 'tl',
  'hi', 'ar', 'ur', 'fa', 'he', 'tr', 'ru', 'uk', 'pl', 'cs', 
  'ro', 'hu', 'bn', 'hr', 'sk', 'sl', 'sr', 'mk', 'sq', 'el', 
  'de', 'fr', 'es', 'it', 'pt', 'nl', 'sv', 'no', 'da', 'fi'
]);

// World View: "Message Bottle" is now "Blessing Bottle" (conceptually)
const BOTTLE_TERM_MAP: Record<string, string> = {
  'zh-TW': '祝福漂流瓶', 'zh-CN': '祝福漂流瓶', 'en': 'Blessing Bottle',
  'ja': '祈りのボトル', 'ko': '축복의 병', 'th': 'ขวดอวยพร',
  'vi': 'Chai Cầu Nguyện', 'id': 'Botol Berkah', 'ms': 'Botol Restu',
  'tl': 'Bote ng Pagpapala', 'es': 'Botella de Bendición', 'pt': 'Garrafa de Bênção',
  'fr': 'Bouteille de Vœux', 'de': 'Segensflasche', 'it': 'Bottiglia dei Desideri',
  'ru': 'Бутылка Желаний', 'ar': 'زجاجة البركة', 'tr': 'Dilek Şişesi',
  'pl': 'Butelka Życzeń', 'nl': 'Wensfles', 'uk': 'Пляшка Бажань',
  'cs': 'Láhev Přání', 'ro': 'Sticla cu Dorințe', 'hu': 'Kívánság Palack',
  'sv': 'Önskeflaska', 'da': 'Ønskeflaske', 'fi': 'Toivepullo', 'no': 'Ønskeflaske'
};

const FORTUNE_BOTTLE_TERM_MAP: Record<string, string> = {
  'zh-TW': '算命瓶', 'zh-CN': '算命瓶', 'en': 'Fortune Bottle',
  'ja': '占いボトル', 'ko': '운세 병', 'th': 'ขวดทำนาย',
  'vi': 'chai bói toán', 'id': 'botol ramalan', 'ms': 'botol nasib',
  'tl': 'botelyang panghuhula', 'es': 'botella de la fortuna', 'pt': 'garrafa da sorte',
  'fr': 'bouteille de bonne aventure', 'de': 'Glücksflasche', 'it': 'bottiglia della fortuna',
  'ru': 'бутылка с предсказанием', 'ar': 'زجاجة الحظ', 'tr': 'fal şişesi',
  'pl': 'butelka wróżby', 'nl': 'geluksfles', 'uk': 'пляшка долі',
  'cs': 'Věštecká Láhev', 'ro': 'Sticla de Ghicit', 'hu': 'Jós Palack',
  'sv': 'Spådomsflaska', 'da': 'Spådomsflaske', 'fi': 'Ennustuspullo', 'no': 'Spådomsflaske'
};

const LEGACY_TERMS_TO_AUDIT: Record<string, string[]> = {
  'en': ['message bottle', 'drifting bottle', 'drift bottle'],
  'ja': [
    'ボトルメール', 
    '漂流瓶', 
    'メッセージボトル',
    'お祝い祈りのボトル', 
    'ブレスイングボトル',
    '祈り祈りのボトル',
    '祝福漂流瓶'
  ],
  'ko': ['메시지 병', '표류 병'],
};

const LOCALE_PRETTY: Record<string, string> = {
  'zh-TW': 'Traditional Chinese (Taiwan)',
  'zh-CN': 'Simplified Chinese (China)',
  'en': 'English', 'ja': 'Japanese', 'ko': 'Korean',
  'th': 'Thai', 'vi': 'Vietnamese', 'id': 'Indonesian', 'ms': 'Malay',
  'tl': 'Filipino', 'es': 'Spanish', 'pt': 'Portuguese', 'fr': 'French',
  'de': 'German', 'it': 'Italian', 'ru': 'Russian', 'ar': 'Arabic',
  'hi': 'Hindi', 'tr': 'Turkish', 'pl': 'Polish', 'uk': 'Ukrainian',
  'nl': 'Dutch', 'sw': 'Swahili', 'ro': 'Romanian'
};

// ==========================================
// 2. HELPER FUNCTIONS
// ==========================================

function getBottleTerm(code: string): string {
  if (BOTTLE_TERM_MAP[code]) return BOTTLE_TERM_MAP[code];
  return code.startsWith('zh') ? '祝福漂流瓶' : 'Blessing Bottle';
}

function getFortuneBottleTerm(code: string): string {
  if (FORTUNE_BOTTLE_TERM_MAP[code]) return FORTUNE_BOTTLE_TERM_MAP[code];
  return code.startsWith('zh') ? '算命瓶' : 'Fortune Bottle';
}

function needsTermMigration(key: string, sourceVal: string, targetVal: string, lang: string): boolean {
  if (!targetVal) return true; 
  
  const strSource = String(sourceVal || '');
  const strTarget = String(targetVal || '');
  const lowerSource = strSource.toLowerCase();
  const lowerTarget = strTarget.toLowerCase();

  // 1. FORTUNE BOTTLE CHECK
  if (lowerSource.includes('算命瓶')) {
    const expectedTerm = getFortuneBottleTerm(lang).toLowerCase();
    if (!lowerTarget.includes(expectedTerm)) return true;
  }

  // 2. BLESSING BOTTLE CHECK
  if ((lowerSource.includes('祝福漂流瓶') || lowerSource.includes('漂流瓶')) && !lowerSource.includes('算命')) {
    const expectedTerm = getBottleTerm(lang).toLowerCase();
    if (!lowerTarget.includes(expectedTerm)) return true;
    
    const legacyList = LEGACY_TERMS_TO_AUDIT[lang];
    if (legacyList) {
      for (const legacy of legacyList) {
        if (lowerTarget.includes(legacy.toLowerCase())) return true;
      }
    }
  }

  // 3. UI STANDARDIZATION CHECK
  const isButtonKey = key.toLowerCase().includes('btn') || 
                      key.toLowerCase().includes('button') || 
                      key.toLowerCase().includes('menu') ||
                      key === 'common.back' ||
                      key === 'common.back3' ||
                      key.includes('back');

  if (isButtonKey) {
    if (lowerTarget.includes('/menu') || lowerTarget.includes('/start')) {
        if (targetVal.length < 50) return true;
    }
  }

  // 4. FIX: Translation Service Unavailable Message
  // Context: The original text is shown ABOVE the warning, not below.
  // Old: "Translation service is temporarily unavailable, below is the original text"
  // New: "Translation service is temporarily unavailable (Original text shown above)"
  if (key === 'catch.translationServiceUnavailable') {
     // If target doesn't look like it has the new meaning (check for parens or lack of "below")
     // It's safer to just re-translate to ensure consistency with the new source
     // zh-TW source: "⚠️ 翻譯服務暫時無法使用（上方顯示原文）"
     // en source: "⚠️ Translation service is temporarily unavailable (Original text shown above)"
     const isNewFormat = targetVal.includes('(') || targetVal.includes('（');
     if (!isNewFormat) return true;
  }

  return false;
}

function buildSystemPrompt(sourceCode: string, targetCode: string, isFortuneMode: boolean = false): string {
  const srcPretty = LOCALE_PRETTY[sourceCode] || sourceCode;
  const tgtPretty = LOCALE_PRETTY[targetCode] || targetCode;
  const bottleTerm = getBottleTerm(targetCode);
  const fortuneBottleTerm = getFortuneBottleTerm(targetCode);

  let prompt = `You are a localization engine for the XunNi app.\nTranslate from ${srcPretty} to ${tgtPretty}.\n`;
  
  prompt += `\nCORE TERMINOLOGY (STRICT):
- "漂流瓶" (Generic/Blessing) -> "${bottleTerm}"
- "算命瓶" (Fortune) -> "${fortuneBottleTerm}"
`;

  prompt += `\nUI/UX STANDARDIZATION RULES:
1. **Clean Buttons**: Button text MUST NOT contain raw commands like "/menu", "/start".
   - Bad: "Back to /menu"
   - Good: "Main Menu" or "Back" (depending on context)
2. **Conciseness**: Keep buttons short (1-3 words preferred).
3. **Consistency**: 
   - "Back" -> Unified term for 'Return/Back'
   - "Main Menu" -> Unified term for 'Home/Menu'
4. **No Duplication**: Avoid "Blessing Blessing Bottle".
5. **No Explanations in Buttons**: Do not put "Click here to..." in a button. Just the action name.
`;

  if (isFortuneMode) {
    prompt += `\nTAROT RULES:\n`;
    const stdTarget = targetCode.toLowerCase();
    if (stdTarget === 'zh-cn') {
      prompt += `- Convert Traditional Chinese to Simplified Chinese (e.g. 權杖 -> 权杖).\n- Keep terminology consistent with Chinese Tarot standards.\n`;
    } else if (stdTarget === 'en') {
      prompt += `- Use standard Rider-Waite names: 'Ace of Wands', 'Page of Cups', 'The Fool'.\n- No Pinyin, No Chinese characters.\n`;
    } else if (stdTarget === 'ja') {
      prompt += `- Suits: Cups->カップ, Wands->ワンド, Swords->ソード, Pentacles->ペンタクル\n- Court: Page->ペイジ, Knight->ナイト, Queen->クイーン, King->キング\n- Format: 'Suit' + の + 'Rank' (e.g. ワンドのエース).\n- Major: Use standard names (愚者, 魔術師...).\n`;
    } else if (stdTarget === 'ko') {
      prompt += `- Suits: Cups->컵, Wands->완드, Swords->소드, Pentacles->펜타클\n- Court: Page->페이지, Knight->나이트, Queen->퀸, King->킹\n- Format: 'Suit' + ' ' + 'Rank' (e.g. 완드 에이스).\n`;
    } else {
      prompt += `- Use STANDARD Tarot terminology for ${tgtPretty}.\n- NO Chinese Characters.\n- Suits: Cups (Water), Wands (Fire), Swords (Air), Pentacles (Earth).\n`;
    }
  } else {
    prompt += `\nGENERAL RULES:
- Tone: professional, concise, friendly.
- Keep 'XunNi' and tickers unchanged.
- Preserve placeholders exactly: {name}, {count}, %s, $VAR, :emoji:.
- Action Verbs:
  - Throw/Send -> "${bottleTerm}" related verbs (e.g., Throw Blessing Bottle).
  - Catch/Pick -> "${bottleTerm}" related verbs (e.g., Catch Blessing Bottle).
`;
  }

  prompt += `\nOUTPUT: Only a valid JSON Object matching input keys. No markdown.`;
  return prompt;
}

// ==========================================
// 3. TASK QUEUE & CONCURRENCY
// ==========================================

interface TranslationTask {
  id: string;
  sourceKeys: Record<string, string>;
  targetLang: string;
  filename: string;
  isFortune: boolean;
  retryCount: number;
}

interface WorkerResult {
  taskId: string;
  success: boolean;
  translations?: Record<string, string>;
  error?: string;
}

const taskQueue: TranslationTask[] = [];
const retryQueue: TranslationTask[] = [];
const resultsMap: Map<string, Record<string, string>> = new Map(); // key: "lang/filename" -> translationObj

async function worker(task: TranslationTask, openai: OpenAI): Promise<WorkerResult> {
  const systemPrompt = buildSystemPrompt(SOURCE_LANG, task.targetLang, task.isFortune);
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(task.sourceKeys, null, 2) }
      ],
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('Empty response from OpenAI');
    return { taskId: task.id, success: true, translations: JSON.parse(content) };
  } catch (e: any) {
    return { taskId: task.id, success: false, error: e.message };
  }
}

async function processQueue(openai: OpenAI) {
  const activePromises: Promise<void>[] = [];
  let completedCount = 0;
  let totalTasks = taskQueue.length;

  console.log(`🚀 Starting processing ${totalTasks} batches with ${MAX_CONCURRENT_REQS} concurrent workers...`);

  // Progress bar helper
  const updateProgress = () => {
    const percent = Math.floor((completedCount / totalTasks) * 100);
    process.stdout.write(`\r[${percent}%] ${completedCount}/${totalTasks} tasks completed. Active: ${activePromises.length} `);
  };

  while (taskQueue.length > 0 || activePromises.length > 0) {
    // Fill up active workers
    while (activePromises.length < MAX_CONCURRENT_REQS && taskQueue.length > 0) {
      const task = taskQueue.shift()!;
      
      const p = worker(task, openai).then(res => {
        if (res.success && res.translations) {
          // Store result
          const resultKey = `${task.targetLang}/${task.filename}`;
          if (!resultsMap.has(resultKey)) resultsMap.set(resultKey, {});
          const current = resultsMap.get(resultKey)!;
          Object.assign(current, res.translations);
          completedCount++;
        } else {
          // Handle failure
          if (task.retryCount < 2) {
            task.retryCount++;
            retryQueue.push(task); // Add to retry queue to be processed later
          } else {
            console.error(`\n❌ Task ${task.id} failed after retries: ${res.error}`);
            completedCount++; // Mark as completed (failed) to progress
          }
        }
        updateProgress();
      });

      activePromises.push(p);
      
      // Remove finished promise from active list
      p.finally(() => {
        const idx = activePromises.indexOf(p);
        if (idx > -1) activePromises.splice(idx, 1);
      });
    }

    if (activePromises.length > 0) {
      await Promise.race(activePromises);
    } else if (taskQueue.length === 0 && activePromises.length === 0) {
      break;
    }
  }
  
  // Retry Phase
  if (retryQueue.length > 0) {
    console.log(`\n\n🔄 Retrying ${retryQueue.length} failed tasks...`);
    taskQueue.push(...retryQueue);
    retryQueue.length = 0;
    // Recursive call for retries (simple approach)
    // For simplicity in this script, we just push back to queue and loop if we were inside a function, 
    // but here we just reconstructed the loop logic. 
    // To keep it simple, let's just re-run the logic by refilling taskQueue and NOT exiting if we added retries.
    // NOTE: The above 'while' loop logic actually handles this if we push back to taskQueue? 
    // No, I moved failed tasks to `retryQueue` first to prioritize new tasks. 
    // Let's iterate `processQueue` one more time if needed or structure differently.
    // For V2, let's just re-run queue processing for retries recursively.
    if (taskQueue.length > 0) await processQueue(openai);
  }
  
  console.log('\n✅ All tasks processed.');
}


// ==========================================
// 4. MAIN SCRIPT
// ==========================================

const IS_DRY_RUN = process.argv.includes('--dry-run');
let openai: OpenAI | null = null;

if (!process.env.OPENAI_API_KEY && !IS_DRY_RUN) {
  console.error('❌ Error: OPENAI_API_KEY is not set.');
  process.exit(1);
}

if (!IS_DRY_RUN) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function getAllTsFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith('.ts') && !file.endsWith('.d.ts') && file !== 'index.ts') {
      fileList.push(file);
    }
  }
  return fileList;
}

async function loadLocaleFile(lang: string, file: string): Promise<Record<string, string>> {
  const filePath = path.join(LOCALES_DIR, lang, file);
  try {
    const modulePath = `${filePath}?t=${Date.now()}`;
    const module = await import(modulePath);
    return module.default || {};
  } catch (e) {
    return {};
  }
}

async function main() {
  console.log(`🔮 XunNi AI Translation Agent v2.0 (Concurrent) ${IS_DRY_RUN ? '(DRY RUN MODE)' : ''}`);
  console.log('✨ World View: "Message Bottle" -> "Blessing Bottle"');
  console.log('🛡️ Safety: Legacy Term Audit ACTIVE | Anti-Duplication ACTIVE | UI Clean ACTIVE');
  
  const sourceDir = path.join(LOCALES_DIR, SOURCE_LANG);
  if (!fs.existsSync(sourceDir)) {
    console.error(`Source dir not found: ${sourceDir}`);
    return;
  }
  
  const sourceFiles = getAllTsFiles(sourceDir);
  const allDirs = fs.readdirSync(LOCALES_DIR).filter(f => 
    fs.statSync(path.join(LOCALES_DIR, f)).isDirectory() && f !== SOURCE_LANG
  );
  
  const targetLangs = allDirs.filter(lang => SUPPORTED_LANGS.has(lang));
  console.log(`📝 Source: ${SOURCE_LANG} (${sourceFiles.length} files)`);
  console.log(`🎯 Targets: ${targetLangs.length} languages (Official Only)`);

  // ==========================
  // PHASE 1: SCAN & PLAN
  // ==========================
  console.log('\n🔍 Phase 1: Scanning for updates...');
  
  let auditReport: string[] = [];
  let totalKeysToUpdate = 0;

  for (const file of sourceFiles) {
    const sourceObj = await loadLocaleFile(SOURCE_LANG, file);
    if (Object.keys(sourceObj).length === 0) continue;

    for (const lang of targetLangs) {
      const targetObj = await loadLocaleFile(lang, file);
      const keysToUpdate: Record<string, string> = {};

      for (const [key, value] of Object.entries(sourceObj)) {
        const targetVal = targetObj[key];
        
        if (!targetVal || targetVal === '[需要翻译]' || targetVal === '') {
           keysToUpdate[key] = value;
           if (IS_DRY_RUN) auditReport.push(`[MISSING] [${lang}] ${file}:${key}`);
        } else if (needsTermMigration(key, value, targetVal, lang)) {
           keysToUpdate[key] = value;
           if (IS_DRY_RUN) {
             auditReport.push(`[UPDATE]  [${lang}] ${file}:${key} (Term/UI)`);
           }
        }
      }

      if (Object.keys(keysToUpdate).length > 0) {
        totalKeysToUpdate += Object.keys(keysToUpdate).length;
        
        if (!IS_DRY_RUN) {
          // Split into batches
          const keys = Object.keys(keysToUpdate);
          for (let i = 0; i < keys.length; i += BATCH_SIZE) {
            const chunkKeys = keys.slice(i, i + BATCH_SIZE);
            const chunkObj: Record<string, string> = {};
            chunkKeys.forEach(k => chunkObj[k] = keysToUpdate[k]);
            
            taskQueue.push({
              id: `${lang}_${file}_${i}`,
              sourceKeys: chunkObj,
              targetLang: lang,
              filename: file,
              isFortune: file.includes('fortune') || file.includes('tarot'),
              retryCount: 0
            });
          }
        }
      }
    }
  }

  // ==========================
  // PHASE 2: EXECUTE
  // ==========================
  
  if (IS_DRY_RUN) {
    console.log('\n================ AUDIT REPORT ================');
    if (auditReport.length === 0) console.log('✅ Clean! No updates needed.');
    else {
      // console.log(auditReport.join('\n')); // Too long for large updates
      console.log(`(Hiding ${auditReport.length} detailed lines in dry run summary)`);
      console.log('==============================================');
      console.log(`Found ${totalKeysToUpdate} keys to update across languages.`);
    }
    return;
  }

  if (taskQueue.length === 0) {
    console.log('\n✅ No updates needed.');
    return;
  }

  console.log(`\n⚡ Phase 2: Processing ${taskQueue.length} translation batches...`);
  await processQueue(openai!);

  // ==========================
  // PHASE 3: WRITE
  // ==========================
  console.log('\n💾 Phase 3: Writing changes to disk...');
  
  // Reload current files to merge (in case we only updated parts) - Actually we should have all 'resultsMap' populated with diffs
  // Logic: Iterate over resultsMap, load file (again to be safe), merge, write.
  
  // Group results by file/lang to minimize IO
  // resultsMap key is "lang/filename"
  for (const [key, translations] of resultsMap.entries()) {
    const [lang, filename] = key.split('/');
    const targetFilePath = path.join(LOCALES_DIR, lang, filename);
    
    // Load existing
    let targetObj = {};
    if (fs.existsSync(targetFilePath)) {
       targetObj = await loadLocaleFile(lang, filename);
    }
    
    // Read source order
    const sourceObj = await loadLocaleFile(SOURCE_LANG, filename);
    
    // Merge
    const finalObj = { ...targetObj, ...translations };
    
    // Sort by source key order
    const orderedObj: Record<string, string> = {};
    for (const sk of Object.keys(sourceObj)) {
      orderedObj[sk] = finalObj[sk] || sourceObj[sk]; // Fallback to source if somehow missing? Or keep target
    }
    // Add any extra keys from target that are not in source? (Optional, maybe cleanup?)
    // For now, keep strict to source keys
    
    const fileContent = `export default ${JSON.stringify(orderedObj, null, 2)};\n`;
    fs.mkdirSync(path.dirname(targetFilePath), { recursive: true });
    fs.writeFileSync(targetFilePath, fileContent);
  }

  console.log(`\n✨ Done! Updated ${totalKeysToUpdate} keys.`);
  console.log('👉 Please run `pnpm i18n:check` to verify integrity.');
}

main().catch(console.error);
