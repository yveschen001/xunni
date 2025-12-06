/******************************************************
 * XunNi Smart Range Translator v5.1 (OpenAI Priority & Safe)
 ******************************************************/

/* ===================== 配置常數 ===================== */
var GEMINI_MODEL      = 'gemini-1.5-flash';
var OPENAI_MODEL      = 'gpt-4o-mini';
var OPENAI_MAX_TOKENS = 4096;
var BATCH_SIZE        = 50;
var MAX_PARALLEL_REQS = 40;
var SLEEP_MS          = 200;
var WORKING_COLOR     = '#fff2cc';
var CLEAR_COLOR       = null;
var QA_COLOR          = '#ffd7d7';
var CMD_COLOR         = '#E1D5E7'; 
var QA_NOTE_PREFIX    = '[QA] ';
var CMD_NOTE_PREFIX   = '[CMD] ';

/* ===================== 國家代碼映射表 ===================== */
var LANG_TO_COUNTRY_MAP = {
  'zh-TW': 'TW', 'zh-CN': 'CN', 'en': 'US', 'ja': 'JP', 'ko': 'KR',
  'th': 'TH', 'vi': 'VN', 'id': 'ID', 'ms': 'MY', 'tl': 'PH',
  'es': 'ES', 'pt': 'BR', 'fr': 'FR', 'de': 'DE', 'it': 'IT',
  'ru': 'RU', 'ar': 'SA', 'hi': 'IN', 'tr': 'TR', 'pl': 'PL',
  'nl': 'NL', 'uk': 'UA'
};

/* ===================== 語言顯示名稱 ===================== */
var LOCALE_PRETTY = {
  'zh-TW': 'Traditional Chinese (Taiwan)',
  'zh-CN': 'Simplified Chinese (China)',
  'en'   : 'English', 'ja': 'Japanese', 'ko': 'Korean',
  'th'   : 'Thai', 'vi': 'Vietnamese', 'id': 'Indonesian', 'ms': 'Malay',
  'tl'   : 'Filipino', 'es': 'Spanish', 'pt': 'Portuguese', 'fr': 'French',
  'de'   : 'German', 'it': 'Italian', 'ru': 'Russian', 'ar': 'Arabic',
  'hi'   : 'Hindi', 'tr': 'Turkish', 'pl': 'Polish', 'uk': 'Ukrainian',
  'nl'   : 'Dutch', 'sw': 'Swahili', 'ro': 'Romanian'
};

/* ===================== 漂流瓶術語表 ===================== */
var BOTTLE_TERM_MAP = {
  'zh-TW': '漂流瓶', 'zh-CN': '漂流瓶', 'en': 'message bottle',
  'ja': 'ボトルメール', 'ko': '메시지 병', 'th': 'ขวดข้อความ',
  'vi': 'chai thư', 'id': 'botol pesan', 'ms': 'botol mesej',
  'tl': 'bote ng mensahe', 'es': 'botella de mensajes', 'pt': 'garrafa de mensagem',
  'fr': 'bouteille à message', 'de': 'Nachrichtenflasche', 'it': 'bottiglia di messaggi',
  'ru': 'бутылка с сообщением', 'ar': 'زجاجة رسائل', 'tr': 'mesaj şişesi'
};

/* ===================== 算命瓶術語表 (新增) ===================== */
var FORTUNE_BOTTLE_TERM_MAP = {
  'zh-TW': '算命瓶', 'zh-CN': '算命瓶', 'en': 'fortune bottle',
  'ja': '占いボトル', 'ko': '운세 병', 'th': 'ขวดทำนาย',
  'vi': 'chai bói toán', 'id': 'botol ramalan', 'ms': 'botol nasib',
  'tl': 'botelyang panghuhula', 'es': 'botella de la fortuna', 'pt': 'garrafa da sorte',
  'fr': 'bouteille de bonne aventure', 'de': 'Glücksflasche', 'it': 'bottiglia della fortuna',
  'ru': 'бутылка с предсказанием', 'ar': 'زجاجة الحظ', 'tr': 'fal şişesi',
  'pl': 'butelka wróżby', 'nl': 'geluksfles', 'uk': 'пляшка долі'
};

function getBottleTerm_(code) {
  var t = BOTTLE_TERM_MAP[code];
  if (t) return t;
  var lang = String(code || '').split('-')[0];
  if (lang === 'zh') return '漂流瓶';
  return 'message bottle';
}

function getFortuneBottleTerm_(code) {
  var t = FORTUNE_BOTTLE_TERM_MAP[code];
  if (t) return t;
  var lang = String(code || '').split('-')[0];
  if (lang === 'zh') return '算命瓶';
  return 'fortune bottle';
}

/* ===================== 靈能算命術語表 (Psychic Fortune Telling) ===================== */
var PSYCHIC_FORTUNE_TERM_MAP = {
  'zh-TW': '靈能算命', 'zh-CN': '灵能算命', 'en': 'Psychic Reading',
  'ja': '霊能占い', 'ko': '영능 점술', 'th': 'ทำนายพลังจิต',
  'vi': 'Bói tâm linh', 'id': 'Ramalan Psikis', 'ms': 'Ramalan Psikik',
  'tl': 'Psychic Reading', 'es': 'Lectura Psíquica', 'pt': 'Leitura Psíquica',
  'fr': 'Voyance', 'de': 'Hellsehen', 'it': 'Lettura Psichica',
  'ru': 'Ясновидение', 'ar': 'قراءة نفسية', 'hi': 'मानसिक भविष्यवाणी',
  'tr': 'Psişik Okuma', 'pl': 'Wróżenie', 'nl': 'Paranormale Lezing',
  'uk': 'Ясновидіння', 'sw': 'Uchanganuzi wa Kiroho', 'ro': 'Citire Psihică'
};

function getPsychicFortuneTerm_(code) {
  var t = PSYCHIC_FORTUNE_TERM_MAP[code];
  if (t) return t;
  var lang = String(code || '').split('-')[0];
  if (lang === 'zh') return '靈能算命';
  return 'Psychic Reading';
}

/* ===================== 祝福漂流瓶術語表 (Blessing Bottle) ===================== */
var BLESSING_BOTTLE_TERM_MAP = {
  'zh-TW': '祝福漂流瓶', 'zh-CN': '祝福漂流瓶', 'en': 'Blessing Bottle',
  'ja': '祈りのボトル', 'ko': '축복의 병', 'th': 'ขวดอวยพร',
  'vi': 'Chai Cầu Nguyện', 'id': 'Botol Berkah', 'ms': 'Botol Restu',
  'tl': 'Bote ng Pagpapala', 'es': 'Botella de Bendición', 'pt': 'Garrafa de Bênção',
  'fr': 'Bouteille de Vœux', 'de': 'Segensflasche', 'it': 'Bottiglia dei Desideri',
  'ru': 'Бутылка Желаний', 'ar': 'زجاجة البركة', 'hi': 'आशीर्वाद की बोतल',
  'tr': 'Dilek Şişesi', 'pl': 'Butelka Życzeń', 'nl': 'Wensfles',
  'uk': 'Пляшка Бажань', 'sw': 'Chupa ya Baraka', 'ro': 'Sticla cu Dorințe'
};

function getBlessingBottleTerm_(code) {
  var t = BLESSING_BOTTLE_TERM_MAP[code];
  if (t) return t;
  var lang = String(code || '').split('-')[0];
  if (lang === 'zh') return '祝福漂流瓶';
  return 'Blessing Bottle';
}


/* ===================== 命理/塔羅術語表 (Fortune Terms) ===================== */
// 提供關鍵術語的參考，輔助 AI 進行更精準的翻譯
var FORTUNE_TERMS_REF = {
  'concepts': {
    'zh-TW': '正位, 逆位, 聖杯, 權杖, 寶劍, 錢幣, 大阿爾克那, 小阿爾克那, 命宮, 夫妻宮, 日主, 七殺, 正官, 偏財',
    'en': 'Upright, Reversed, Cups, Wands, Swords, Pentacles, Major Arcana, Minor Arcana, Life Palace, Spouse Palace, Day Master, Seven Killings, Direct Officer, Indirect Wealth',
    'ja': '正位置, 逆位置, 聖杯, 杖, 剣, 金貨, 大アルカナ, 小アルカナ, 命宮, 夫婦宮, 日主, 七殺, 正官, 偏財'
  },
  'tarot_cards_sample': {
    'zh-TW': '愚者, 魔術師, 女祭司, 皇后, 皇帝, 教皇, 戀人, 戰車, 力量, 隱士, 命運之輪, 正義, 倒吊人, 死神, 節制, 惡魔, 高塔, 星星, 月亮, 太陽, 審判, 世界',
    'en': 'The Fool, The Magician, The High Priestess, The Empress, The Emperor, The Hierophant, The Lovers, The Chariot, Strength, The Hermit, Wheel of Fortune, Justice, The Hanged Man, Death, Temperance, The Devil, The Tower, The Star, The Moon, The Sun, Judgement, The World'
  }
};

/* ===================== 菜單 ===================== */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('翻譯工具')
    .addItem('🚀 翻譯選取範圍 (zh-TW→多語)', 'runSmartTranslateSelection')
    .addItem('🚀 翻譯選取範圍 (命理/塔羅專用)', 'runFortuneTranslateSelection')
    .addItem('🚀 由英文翻譯選取範圍 (en→多語)', 'runTranslateFromEnSelection')
    .addSeparator()
    .addItem('清理選取範圍 HTML 標籤（<>）', 'cleanSelectionHtmlWrappers')
    .addItem('優化 zh-TW（客服語氣）', 'polishZhTwSelection')
    .addSeparator()
    .addItem('✅ 全表質檢（不耗 Token）', 'runQualityScanAll')
    .addItem('✅ 選取範圍質檢（不耗 Token）', 'runQualityScanSelection')
    .addItem('📊 診斷：錯誤類型統計（分析誤報原因）', 'runErrorTypeDiagnosis')
    .addItem('🔍 掃描選區遺失代碼 (Missing Codes)', 'scanMissingCodesInSelection')
    .addItem('🔍 掃描選區空白未翻譯', 'scanEmptyCellsInSelection')
    .addItem('🧹 清除選取範圍高亮', 'clearQaInSelection')
    .addSeparator()
    .addItem('🤖 AI 智能複核誤報（只查高亮格）', 'runAiReverifySelection')
    .addItem('🎯 AI 智能採樣檢查（評估誤報率）', 'runAiSamplingCheck')
    .addItem('📊 全表高亮分批 AI 複核（可中斷續傳）', 'runAiReverifyAllHighlighted')
    .addItem('🤖 AI 深度質檢（選取範圍 - 耗 Token）', 'runAiQualityScanSelection')
    .addItem('⚙ 自動翻譯高亮（選取範圍）', 'autoTranslateHighlightedSelection')
    .addItem('⚙ 自動翻譯高亮（全表）', 'autoTranslateHighlighted')
    .addItem('🧹 清除全表 QA 高亮', 'clearAllQaHighlights')
    .addSeparator()
    .addItem('🛠️ 測試 AI 連線', 'runTestConnection')
    .addItem('一鍵：質檢→修復→清除', 'oneClickQAAndFix')
    .addSeparator()
    .addItem('🔍 掃描：特殊指令與參數 (Highlight)', 'scanSpecialCommandsInSelection')
    .addItem('⚙ 執行：特殊指令適配修復 (Fix)', 'fixSpecialCommandsInSelection')
    .addSeparator()
    .addItem('🐞 切換除錯模式 (Log開關)', 'toggleDebugMode')
    .addToUi();
}

/* ===================== 除錯工具 ===================== */
function toggleDebugMode() {
  var userProps = PropertiesService.getUserProperties();
  var current = userProps.getProperty('DEBUG_MODE') === 'true';
  var newState = !current;
  userProps.setProperty('DEBUG_MODE', String(newState));
  SpreadsheetApp.getUi().alert('除錯模式已' + (newState ? '開啟 (將寫入執行紀錄)' : '關閉'));
}

function log_(msg) {
  var userProps = PropertiesService.getUserProperties();
  Logger.log('[Debug] ' + msg); 
}

/* ===================== 測試工具 ===================== */
function runTestConnection() {
  var ui = SpreadsheetApp.getUi();
  var apiKey = getApiKey_();
  if (!apiKey) { ui.alert('錯誤', '未設定 API Key', ui.ButtonSet.OK); return; }
  var testUser = "Translate to English: ['你好', '世界']";
  var testSys  = "Return strict JSON Array: [\"hello\", \"world\"]";
  try {
    var result = callAiApi_(testSys, testUser);
    ui.alert('API 測試成功', '回傳:\n' + result, ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('API 測試失敗', '錯誤詳情:\n' + e, ui.ButtonSet.OK);
  }
}

/* ===================== 工具：多重選區迭代器 ===================== */
function processRangeList_(processorFn) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getActiveSheet();
  var rangeList = sh.getActiveRangeList();
  if (!rangeList || rangeList.getRanges().length === 0) {
    ss.toast('請先選取範圍', '⚠ 沒有選區', 5);
    return;
  }
  var ranges = rangeList.getRanges();
  for (var k = 0; k < ranges.length; k++) {
    if (ranges[k].getRow() === 1) {
      ss.toast('選區不能包含表頭行（第1行），請只選內容行', '提示', 5);
      return;
    }
  }
  var lastCol = sh.getLastColumn();
  var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  for (var i = 0; i < ranges.length; i++) {
    var range = ranges[i];
    if (ranges.length > 1) ss.toast('正在處理第 ' + (i + 1) + ' / ' + ranges.length + ' 個選區...', '多重選區', 300);
    try { processorFn(sh, range, headers); } 
    catch (e) { Logger.log('處理選區 ' + (i + 1) + ' 失敗: ' + e); ss.toast('選區 ' + (i + 1) + ' 發生錯誤: ' + e.message, '錯誤', 5); }
  }
  if (ranges.length > 1) ss.toast('✅ 所有選區處理完成', '完成', 5);
}

/* ===================== 命理/塔羅專用翻譯流程 ===================== */
function runFortuneTranslateSelection() { processRangeList_(runFortuneTranslateCore_); }

function runFortuneTranslateCore_(sh, sel, headers) {
  // 設置模式標記，讓底層邏輯知道要使用命理 Prompt
  var props = PropertiesService.getUserProperties();
  props.setProperty('CURRENT_MODE', 'FORTUNE');
  
  try {
    runSmartTranslateCore_(sh, sel, headers);
  } finally {
    props.deleteProperty('CURRENT_MODE');
  }
}

/* ===================== 主要流程：zh-TW → 多語 ===================== */
function runSmartTranslateSelection() { processRangeList_(runSmartTranslateCore_); }

function runSmartTranslateCore_(sh, sel, headers) {
  var gKey = getApiKey_('GEMINI_API_KEY');
  var oKey = getApiKey_('OPENAI_API_KEY');
  var useGemini = (!oKey && !!gKey);
  var apiKey = oKey ? oKey : gKey;
  if (!apiKey) throw new Error('缺少 API Key');
  log_('Using Model: ' + (useGemini ? GEMINI_MODEL : OPENAI_MODEL));

  var colZhTw = getColIndexByHeader_(headers, 'zh-TW');
  if (colZhTw < 0) throw new Error('表頭必須包含 zh-TW');
  colZhTw += 1;

  var startRow = sel.getRow();
  var startCol = sel.getColumn();
  var numRows  = sel.getNumRows();
  var numCols  = sel.getNumColumns();
  var totalRowsRemaining = numRows;
  var processedRows = 0;
  
  var activeTargetCount = 0;
  for (var cOff = 0; cOff < numCols; cOff++) {
    var h = String(headers[startCol + cOff - 1] || '').trim();
      if (h && h !== 'key' && h !== 'module' && h !== 'zh-TW' && h !== 'zh-CN') activeTargetCount++;
  }
  if (activeTargetCount < 1) activeTargetCount = 1;

  var concurrentBatches = Math.floor(MAX_PARALLEL_REQS / activeTargetCount);
  if (concurrentBatches < 1) concurrentBatches = 1;
  if (concurrentBatches > 5) concurrentBatches = 5;
  var dynamicChunkRows = concurrentBatches * BATCH_SIZE;

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  while (totalRowsRemaining > 0) {
    var rowsThisChunk = Math.min(dynamicChunkRows, totalRowsRemaining);
    var chunkRowStart = startRow + processedRows;
    highlightRange_(sh, chunkRowStart, startCol, rowsThisChunk, numCols, WORKING_COLOR);
    ss.toast('🚀 翻譯 ' + rowsThisChunk + ' 行... (' + (processedRows + rowsThisChunk) + '/' + numRows + ')', '翻譯中', 120);

    var blockRange = sh.getRange(chunkRowStart, startCol, rowsThisChunk, numCols);
    var blockValues = blockRange.getValues();
    var zhTwVals = sh.getRange(chunkRowStart, colZhTw, rowsThisChunk, 1).getValues().map(function (r) { return String(r[0] || ''); });
    var pivotEnVals = null;
    var needsPivot = false;

    for (var cOff = 0; cOff < numCols; cOff++) {
      var headerCode = String(headers[startCol + cOff - 1] || '').trim();
      if (!headerCode || headerCode === 'key' || headerCode === 'module' || headerCode === 'zh-TW') continue;
      if (headerCode !== 'zh-CN' && headerCode !== 'en') needsPivot = true;
    }

    if (needsPivot) {
      var enIdx = -1;
      for (cOff = 0; cOff < numCols; cOff++) {
        if (String(headers[startCol + cOff - 1] || '').trim() === 'en') { enIdx = cOff; break; }
      }
      if (enIdx >= 0) {
        pivotEnVals = openAiBatchTranslate_(zhTwVals, 'zh-TW', 'en');
        for (var r = 0; r < rowsThisChunk; r++) {
          var out = processTranslationResult_(zhTwVals[r], pivotEnVals[r], 'en');
          blockValues[r][enIdx] = out;
          pivotEnVals[r] = out;
        }
      } else {
        pivotEnVals = openAiBatchTranslate_(zhTwVals, 'zh-TW', 'en');
      }
    }

    var aiTasks = []; 
    for (cOff = 0; cOff < numCols; cOff++) {
      var headerCode = String(headers[startCol + cOff - 1] || '').trim();
      if (!headerCode || headerCode === 'key' || headerCode === 'module' || headerCode === 'zh-TW') continue;
      if (headerCode === 'en' && pivotEnVals) continue; 

      var srcDataFull = (headerCode === 'en') ? zhTwVals : (pivotEnVals || zhTwVals);
      var srcLang = (headerCode === 'en') ? 'zh-TW' : 'en';
      if (headerCode === 'zh-CN') { srcDataFull = zhTwVals; srcLang = 'zh-TW'; }

      for (var offset = 0; offset < rowsThisChunk; offset += BATCH_SIZE) {
          var sliceLen = Math.min(BATCH_SIZE, rowsThisChunk - offset);
          var sliceData = srcDataFull.slice(offset, offset + sliceLen);
          var origZhTwSlice = zhTwVals.slice(offset, offset + sliceLen);
          
          // 檢查是否為命理模式
          var isFortuneMode = PropertiesService.getUserProperties().getProperty('CURRENT_MODE') === 'FORTUNE';
          var sysMsg = isFortuneMode 
            ? buildFortuneSystemPrompt_(srcLang, headerCode) 
            : buildSystemPrompt_(srcLang, headerCode);
            
          var userMsg = buildUserPrompt_(sliceData, srcLang, headerCode);
          
          var payload;
          if (useGemini) {
             payload = {
               "system_instruction": { "parts": { "text": sysMsg } },
               "contents": [{ "role": "user", "parts": [{ "text": userMsg }] }],
               "generationConfig": { "responseMimeType": "application/json", "responseSchema": { "type": "ARRAY", "items": { "type": "STRING" } } }
             };
          } else {
             payload = { model: OPENAI_MODEL, messages: [{ role: 'system', content: sysMsg }, { role: 'user', content: userMsg }], max_completion_tokens: OPENAI_MAX_TOKENS };
          }
          aiTasks.push({ payload: payload, colOffset: cOff, targetLang: headerCode, sourceVals: sliceData, origZhTwVals: origZhTwSlice, rowOffset: offset });
      }
    }

    if (aiTasks.length > 0) {
      var requests = aiTasks.map(function(task) {
        var url, headers;
        if (useGemini) {
           url = 'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent?key=' + apiKey;
           headers = {};
        } else {
           url = 'https://api.openai.com/v1/chat/completions';
           headers = { 'Authorization': 'Bearer ' + apiKey };
        }
        return { url: url, method: 'post', contentType: 'application/json', headers: headers, muteHttpExceptions: true, payload: JSON.stringify(task.payload) };
      });

      try {
        var responses = UrlFetchApp.fetchAll(requests);
        for (var i = 0; i < responses.length; i++) {
          var task = aiTasks[i];
          var res = responses[i];
          if (res.getResponseCode() >= 200 && res.getResponseCode() < 300) {
            try {
              var json = JSON.parse(res.getContentText());
              var content = useGemini ? (json.candidates?.[0]?.content?.parts?.[0]?.text || '') : json.choices[0].message.content;
              var arr = parseJsonArrayResponse_(content, task.sourceVals.length);
              for (var subR = 0; subR < arr.length; subR++) {
                var actualR = task.rowOffset + subR;
                var out = processTranslationResult_(task.sourceVals[subR], arr[subR], task.targetLang, task.origZhTwVals[subR]);
                blockValues[actualR][task.colOffset] = out;
              }
            } catch (e) { Logger.log('JSON Parse Error: ' + e); }
          } else { Logger.log('API Error: ' + res.getResponseCode()); }
        }
      } catch (e) { Logger.log('FetchAll Error: ' + e); }
    }

    blockRange.setValues(blockValues);
    highlightRange_(sh, chunkRowStart, startCol, rowsThisChunk, numCols, CLEAR_COLOR);
    SpreadsheetApp.flush();
    processedRows += rowsThisChunk;
    totalRowsRemaining -= rowsThisChunk;
    Utilities.sleep(SLEEP_MS);
  }
  ss.toast('✅ 完成', '完成', 5);
}

/* ===================== 英文 → 多語 ===================== */
function runTranslateFromEnSelection() { processRangeList_(runTranslateFromEnCore_); }

function runTranslateFromEnCore_(sh, sel, headers) {
  var gKey = getApiKey_('GEMINI_API_KEY');
  var oKey = getApiKey_('OPENAI_API_KEY');
  var useGemini = (!oKey && !!gKey);
  var apiKey = oKey ? oKey : gKey;
  if (!apiKey) throw new Error('缺少 API Key');

  var colEn = getColIndexByHeader_(headers, 'en');
  var colTw = getColIndexByHeader_(headers, 'zh-TW');
  if (colEn < 0 && colTw < 0) throw new Error('需 en 或 zh-TW');
  if (colEn >= 0) colEn += 1;
  if (colTw >= 0) colTw += 1;

  var startRow = sel.getRow();
  var startCol = sel.getColumn();
  var numRows  = sel.getNumRows();
  var numCols  = sel.getNumColumns();
  var totalRowsRemaining = numRows;
  var processedRows = 0;

  var activeTargetCount = 0;
  for (var cOff = 0; cOff < numCols; cOff++) {
    var h = String(headers[startCol + cOff - 1] || '').trim();
    if (h && h !== 'key' && h !== 'module' && h !== 'en' && h !== 'zh-TW') activeTargetCount++;
  }
  if (activeTargetCount < 1) activeTargetCount = 1;

  var concurrentBatches = Math.floor(MAX_PARALLEL_REQS / activeTargetCount);
  if (concurrentBatches < 1) concurrentBatches = 1;
  if (concurrentBatches > 5) concurrentBatches = 5;
  var dynamicChunkRows = concurrentBatches * BATCH_SIZE;

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  while (totalRowsRemaining > 0) {
    var rowsThisChunk = Math.min(dynamicChunkRows, totalRowsRemaining);
    var chunkRowStart = startRow + processedRows;
    highlightRange_(sh, chunkRowStart, startCol, rowsThisChunk, numCols, WORKING_COLOR);
    ss.toast('🚀 平行翻譯 ' + rowsThisChunk + ' 行...', '翻譯中', 120);

    var srcRange, srcCode;
    if (colEn) { srcRange = sh.getRange(chunkRowStart, colEn, rowsThisChunk, 1); srcCode = 'en'; } 
    else { srcRange = sh.getRange(chunkRowStart, colTw, rowsThisChunk, 1); srcCode = 'zh-TW'; }
    var srcVals = srcRange.getValues().map(function (r) { return String(r[0] || ''); });

    var blockRange  = sh.getRange(chunkRowStart, startCol, rowsThisChunk, numCols);
    var blockValues = blockRange.getValues();
    var aiTasks = [];

    for (var cOff = 0; cOff < numCols; cOff++) {
      var headerCode = String(headers[startCol + cOff - 1] || '').trim();
      if (!headerCode || headerCode === 'key' || headerCode === 'module' || headerCode === srcCode) continue;

      for (var offset = 0; offset < rowsThisChunk; offset += BATCH_SIZE) {
         var sliceLen = Math.min(BATCH_SIZE, rowsThisChunk - offset);
         var sliceData = srcVals.slice(offset, offset + sliceLen);
         var sysMsg  = buildSystemPrompt_(srcCode, headerCode);
         var userMsg = buildUserPrompt_(sliceData, srcCode, headerCode);
         var payload;
         if (useGemini) {
             payload = {
                "system_instruction": { "parts": { "text": sysMsg } },
                "contents": [{ "role": "user", "parts": [{ "text": userMsg }] }],
                "generationConfig": { "responseMimeType": "application/json", "responseSchema": { "type": "ARRAY", "items": { "type": "STRING" } } }
             };
         } else {
             payload = { model: OPENAI_MODEL, messages: [{ role: 'system', content: sysMsg }, { role: 'user', content: userMsg }], max_completion_tokens: OPENAI_MAX_TOKENS };
         }
         aiTasks.push({ payload: payload, colOffset: cOff, targetLang: headerCode, sourceVals: sliceData, rowOffset: offset });
      }
    }

    if (aiTasks.length > 0) {
      var requests = aiTasks.map(function(task) {
        var url, headers;
        if (useGemini) { url = 'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent?key=' + apiKey; headers = {}; } 
        else { url = 'https://api.openai.com/v1/chat/completions'; headers = { 'Authorization': 'Bearer ' + apiKey }; }
        return { url: url, method: 'post', contentType: 'application/json', headers: headers, muteHttpExceptions: true, payload: JSON.stringify(task.payload) };
      });

      try {
        var responses = UrlFetchApp.fetchAll(requests);
        for (var i = 0; i < responses.length; i++) {
          var task = aiTasks[i];
          var res = responses[i];
          if (res.getResponseCode() >= 200 && res.getResponseCode() < 300) {
            try {
              var json = JSON.parse(res.getContentText());
              var content = useGemini ? (json.candidates?.[0]?.content?.parts?.[0]?.text || '') : json.choices[0].message.content;
              var arr = parseJsonArrayResponse_(content, task.sourceVals.length);
              for (var subR = 0; subR < arr.length; subR++) {
                var actualR = task.rowOffset + subR;
                var out = processTranslationResult_(task.sourceVals[subR], arr[subR], task.targetLang);
                blockValues[actualR][task.colOffset] = out;
              }
            } catch (e) { Logger.log('JSON Parse Error: ' + e); }
            }
          }
      } catch (e) { Logger.log('FetchAll Error: ' + e); }
    }

    blockRange.setValues(blockValues);
    highlightRange_(sh, chunkRowStart, startCol, rowsThisChunk, numCols, CLEAR_COLOR);
    SpreadsheetApp.flush();
    processedRows += rowsThisChunk;
    totalRowsRemaining -= rowsThisChunk;
    Utilities.sleep(SLEEP_MS);
  }
  ss.toast('✅ 完成', '完成', 5);
}

/* ===================== 後處理 ===================== */
function processTranslationResult_(src, tgt, langCode, origZhTw) {
  var out = String(tgt || '');
  out = stripTags_(out);
  out = ensureKeepProtectedTokens_(src, out);
  var termSrc = origZhTw || src;
  out = enforceBottleTerminologyOnPair_(termSrc, out, langCode);
  return out.trim();
}

function openAiBatchTranslate_(srcArr, sourceCode, targetCode) {
  if (sourceCode === targetCode) return srcArr.map(function(s){return String(s||'');});
  var out = new Array(srcArr.length);
  for (var i=0; i<out.length; i++) out[i]='';
  var cursor = 0;
  while (cursor < srcArr.length) {
    var slice = srcArr.slice(cursor, cursor + BATCH_SIZE);
    var allEmpty = slice.every(function(t){return !String(t).trim();});
    if (allEmpty) { cursor += BATCH_SIZE; continue; }
    var attempt = translateChunkOnce_(slice, sourceCode, targetCode);
    if (attempt.ok && attempt.items.length === slice.length) {
      for (var i = 0; i < slice.length; i++) out[cursor + i] = attempt.items[i] || '';
    }
      cursor += BATCH_SIZE;
      Utilities.sleep(SLEEP_MS);
  }
  return out;
}

function translateChunkOnce_(slice, sourceCode, targetCode) {
  var sysMsg  = buildSystemPrompt_(sourceCode, targetCode);
  var userMsg = buildUserPrompt_(slice, sourceCode, targetCode);
    var rawResp = callAiApi_(sysMsg, userMsg);
  var arr     = parseJsonArrayResponse_(rawResp, slice.length);
  return { ok: arr.length === slice.length, items: arr };
}

/* ===================== API 調用統一入口 ===================== */
function callAiApi_(systemText, userText) {
  var openAiKey = getApiKey_('OPENAI_API_KEY');
  if (openAiKey) return callOpenAIChat_(systemText, userText);
  var geminiKey = getApiKey_('GEMINI_API_KEY');
  if (geminiKey) return callGeminiChat_(geminiKey, systemText, userText);
  Logger.log('無可用的 API Key');
  return '';
}

function callOpenAIChat_(systemText, userText) {
  var apiKey = getApiKey_('OPENAI_API_KEY');
  if (!apiKey) return '';
  var url = 'https://api.openai.com/v1/chat/completions';
  var payload = { model: OPENAI_MODEL, messages: [{ role: 'system', content: systemText }, { role: 'user', content: userText }], max_completion_tokens: OPENAI_MAX_TOKENS };
  var params = { method: 'post', contentType: 'application/json', headers: { 'Authorization': 'Bearer ' + apiKey }, muteHttpExceptions: true, payload: JSON.stringify(payload) };
  try {
  var res  = UrlFetchApp.fetch(url, params);
    if (res.getResponseCode() < 200 || res.getResponseCode() >= 300) { Logger.log('OpenAI Error: ' + res.getContentText()); return ''; }
    var data = JSON.parse(res.getContentText());
    return data.choices[0].message.content || '';
  } catch (e) { Logger.log('OpenAI Error: ' + e); return ''; }
}

function callGeminiChat_(apiKey, systemText, userText) {
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent?key=' + apiKey;
  var payload = { "system_instruction": { "parts": { "text": systemText } }, "contents": [{ "role": "user", "parts": [{ "text": userText }] }], "generationConfig": { "responseMimeType": "application/json" } };
  try {
    var res = UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json', muteHttpExceptions: true, payload: JSON.stringify(payload) });
    if (res.getResponseCode() >= 200 && res.getResponseCode() < 300) {
      var json = JSON.parse(res.getContentText());
      return json.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else { Logger.log('Gemini Error: ' + res.getContentText()); }
  } catch (e) { Logger.log('Gemini Exception: ' + e); }
    return '';
}

function parseJsonArrayResponse_(rawContent, expectLen) {
  var s = String(rawContent || '').trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
  if (s.lastIndexOf('}') === -1 && s.lastIndexOf(']') === -1) s += '"]]}'; 
  else if (s.lastIndexOf('}') < s.lastIndexOf('{') && s.indexOf('[') === -1) s += ']}';
  var items = [];
  try {
    var obj = JSON.parse(s);
    if (Array.isArray(obj)) items = obj;
    else if (obj && Array.isArray(obj.items)) items = obj.items;
    else if (obj && typeof obj === 'object') { for (var key in obj) { if (Array.isArray(obj[key])) { items = obj[key]; break; } } }
  } catch (e) {
    try {
      var start = s.indexOf('['); var end = s.lastIndexOf(']');
      if (start >= 0 && end > start) items = JSON.parse(s.substring(start, end + 1));
    } catch (e2) { Logger.log('JSON Parse Failed: ' + e2); }
  }
  while (items.length < expectLen) items.push('');
  if (items.length > expectLen) items = items.slice(0, expectLen);
  return items.map(function(i){ return typeof i==='string' ? i : ''; });
}

/* ===================== Prompt 生成 ===================== */
function buildSystemPrompt_(sourceCode, targetCode) {
  var srcPretty = LOCALE_PRETTY[sourceCode] || sourceCode;
  var tgtPretty = LOCALE_PRETTY[targetCode] || targetCode;
  var bottleTerm = getBottleTerm_(targetCode);
  return "You are a localization engine for the XunNi app.\nTranslate from " + srcPretty + " to " + tgtPretty + ".\nTone: professional, concise.\nKeep 'XunNi' and tickers unchanged.\nPreserve placeholders: {{name}}, {0}, %s, $VAR, :emoji:, <provider_id>, <msg_content>.\nPreserve URLs, emails, @mentions, HTML entities.\n" + (bottleTerm ? "Translate 'drifting bottle' or '漂流瓶' as \"" + bottleTerm + "\".\n" : "") + "OUTPUT: Only a valid JSON Array of strings. No markdown. No overlap with source.";
}

function buildFortuneSystemPrompt_(sourceCode, targetCode) {
  // 1. 利用 LOCALE_PRETTY 映射表進行「標準化」查找 (Case-Insensitive)
  var stdTargetCode = targetCode; // 預設保留原樣
  var tgtPretty = targetCode;
  
  var keys = Object.keys(LOCALE_PRETTY);
  for (var i = 0; i < keys.length; i++) {
    if (keys[i].toLowerCase() === String(targetCode).toLowerCase()) {
      stdTargetCode = keys[i]; // 找到標準 Key (例如 'zh-CN')
      tgtPretty = LOCALE_PRETTY[keys[i]]; // 找到全稱 (例如 'Simplified Chinese (China)')
      break;
    }
  }

  var srcPretty = LOCALE_PRETTY[sourceCode] || sourceCode;
  
  // 基礎 Prompt
  var prompt = "You are an expert Tarot & Fortune Telling translator.\n" +
    "Translate from " + srcPretty + " to " + tgtPretty + ".\n" +
    "OUTPUT: Only a valid JSON Array of strings.\n\n";

  // === 針對不同目標語言的動態規則 (使用標準化後的代碼判斷) ===
  
  // 1. 目標是中文 (zh-CN) -> 轉簡體，保留漢字
  if (stdTargetCode === 'zh-CN') {
    prompt += "=== RULES FOR SIMPLIFIED CHINESE ===\n" +
      "- Convert Traditional Chinese to Simplified Chinese (e.g. 權杖 -> 权杖, 錢幣 -> 钱币).\n" +
      "- Keep terminology consistent with Chinese Tarot standards.\n";
    return prompt;
  }

  // 2. 目標是英文 (en) -> 使用標準英文術語
  if (stdTargetCode === 'en') {
    prompt += "=== RULES FOR ENGLISH ===\n" +
      "- Use standard Rider-Waite names: 'Ace of Wands', 'Page of Cups', 'The Fool'.\n" +
      "- No Pinyin, No Chinese characters.\n";
    return prompt;
  }

  // 3. 目標是日文 (ja) -> 使用片假名/日文漢字規則
  if (stdTargetCode === 'ja') {
    prompt += "=== RULES FOR JAPANESE ===\n" +
      "- **Suits**: Cups->カップ, Wands->ワンド, Swords->ソード, Pentacles->ペンタクル\n" +
      "- **Court**: Page->ペイジ, Knight->ナイト, Queen->クイーン, King->キング\n" +
      "- **Format**: 'Suit' + の + 'Rank' (e.g. ワンドのエース, カップの9).\n" +
      "- **Major**: Use standard names (愚者, 魔術師...).\n" +
      "- NO English (unless native), NO Chinese only characters.\n";
    return prompt;
  }

  // 4. 目標是韓文 (ko) -> 使用韓文規則
  if (stdTargetCode === 'ko') {
    prompt += "=== RULES FOR KOREAN ===\n" +
      "- **Suits**: Cups->컵, Wands->완드, Swords->소드, Pentacles->펜타클\n" +
      "- **Court**: Page->페이지, Knight->나이트, Queen->퀸, King->킹\n" +
      "- **Format**: 'Suit' + ' ' + 'Rank' (e.g. 완드 에이스, 컵 9).\n";
    return prompt;
  }

  // 5. 其他語言 (通則)
  prompt += "=== GENERAL RULES ===\n" +
    "- Use STANDARD Tarot terminology for " + tgtPretty + ".\n" +
    "- **NO Chinese Characters**: Output must be in " + tgtPretty + " script.\n" +
    "- **Suits Meaning**: \n" +
    "  * 聖杯 -> Cups/Water element\n" +
    "  * 權杖 -> Wands/Fire element\n" +
    "  * 寶劍 -> Swords/Air element\n" +
    "  * 錢幣 -> Pentacles/Coins/Earth element\n" +
    "- **Format**: Use the most common Tarot card naming convention in " + tgtPretty + ".\n";

  return prompt;
}

function buildUserPrompt_(slice, sourceCode, targetCode) {
  return "Translate array to JSON Array:\n" + JSON.stringify(slice);
}

/* ===================== 輔助工具 ===================== */
function stripTags_(s) {
  if (s == null) return '';
  s = String(s);
  var store = {};
  var idx = 0;
  s = s.replace(/<[^<>]+>/g, function (m) {
    if (/^<(br|div|span|p|b|i|strong|em|u|a|img|table|tr|td|th|ul|ol|li|code|pre)\b/i.test(m)) return m;
    var k = '%%ANG' + (idx++) + '%%';
    store[k] = m;
    return k;
  });
  s = s.replace(/```[\s\S]*?```/g, '').replace(/<[^>]+>/g, '');
  s = s.replace(/%%ANG\d+%%/g, function(m){ return store[m] || ''; });
  return s.replace(/\u00A0/g, ' ').replace(/[ \t\r\f\v]+/g, ' ').trim();
}

function ensureKeepProtectedTokens_(src, out) {
  src = String(src||''); out = String(out||'');
  var regexs = [ /\{\{[^}]+\}\}/g, /\{[^{][^}]*\}/g, /%(\d+\$)?[sdif]/g, /\$\{[^}]+\}/g, /\$[A-Z_][A-Z0-9_]*/g, /:[a-z0-9_+-]+:/gi, /<[^<>\n]+>/g, /\bhttps?:\/\/[^\s)]+/gi, /@[A-Za-z0-9_.-]+/g ];
  var tokens = [];
  regexs.forEach(function(re){
    var m = src.match(re);
    if(m) m.forEach(function(t){ if (t.length < 50 && out.indexOf(t) === -1) tokens.push(t); });
  });
  tokens.forEach(function(t){ if (out.indexOf(t) === -1) out += ' ' + t; });
  return out;
}

function enforceBottleTerminologyOnPair_(src, out, targetCode) {
  var msgTerm = getBottleTerm_(targetCode);
  var fortuneTerm = getFortuneBottleTerm_(targetCode);
  var psychicTerm = getPsychicFortuneTerm_(targetCode);
  var blessingTerm = getBlessingBottleTerm_(targetCode);
  
  // 0. 檢測是否為「靈能算命」 (Priority Highest)
  // 如果原文明確包含 "靈能算命" 或 "Psychic Reading"
  if (/(靈能算命|灵能算命|Psychic Reading)/i.test(src)) {
     // [修正] 移除之前的暴力覆蓋邏輯 (src.length < 15)，改用「精準替換」
     // 目標：保留 "Back to...", "...Menu" 等上下文，只替換核心術語
     
     if (psychicTerm && out.toLowerCase().indexOf(psychicTerm.toLowerCase()) === -1) {
        // 定義 AI 可能給出的「泛用/錯誤」翻譯 (Case Insensitive)
        // 優先替換長詞，再替換短詞
        var wrongPatterns = [
           // 1. 具體錯誤術語
           fortuneTerm ? escapeRegExp_(fortuneTerm) : null,
           msgTerm ? escapeRegExp_(msgTerm) : null,
           // 2. 常見 AI 幻覺詞 (英文/片假名/解釋性文字)
           'Spiritual Reading', 'Mental Reading', 'Fortune Telling', 'Divination', 
           'Psychic Reading', 'サイキック.?リーディング', 'スピリチュアル', 
           '精神分析', '心理分析', '超心理',
           // 3. 泛用詞 (放在最後)
           'Fortune', 'Spiritual', 'Mental', 'Psychic', '算命', '占い', '占卜'
        ].filter(Boolean);

        // 使用正則進行替換，確保不區分大小寫
        var re = new RegExp('(' + wrongPatterns.join('|') + ')', 'gi');
        
        // 執行替換：將泛用詞換成標準術語
        // 額外檢查：如果目標語言是日文，且替換後出現 "の霊能占い" (重複助詞)，則修正之
        out = out.replace(re, psychicTerm);
        
        // [修復] 日文/韓文語法微調
        if (targetCode === 'ja') {
           out = out.replace(/の霊能占い/g, '霊能占い'); // 移除多餘的 "の"
           out = out.replace(/霊能占いメニュー/g, '霊能占いメニュー'); // 確認複合詞連接順暢
        }
     }
     return out; 
  }

  // 0.5 檢測是否為「祝福漂流瓶」 (Priority High)
  if (/(祝福漂流瓶|Blessing Bottle|祈願漂流瓶)/i.test(src)) {
     if (blessingTerm && out.toLowerCase().indexOf(blessingTerm.toLowerCase()) === -1) {
        // 定義可能出現的錯誤翻譯
        var wrongPatterns = [
           msgTerm ? escapeRegExp_(msgTerm) : null,
           fortuneTerm ? escapeRegExp_(fortuneTerm) : null,
           'Drifting Bottle', 'Message Bottle', 'Wishing Bottle', 'Lucky Bottle',
           'Bottle of Blessing', 'Botol Harapan', '祝福のボトル', '願いのボトル'
        ].filter(Boolean);

        var re = new RegExp('(' + wrongPatterns.join('|') + ')', 'gi');
        out = out.replace(re, blessingTerm);
        
        // [修復] 日文/韓文語法微調
        if (targetCode === 'ja') {
           out = out.replace(/の祈りのボトル/g, '祈りのボトル'); 
           out = out.replace(/祈りのボトルメニュー/g, '祈りのボトルメニュー');
        }
     }
     return out;
  }
  
  // 1. 檢測是否為「算命瓶」 (Priority High)
  // 如果原文明確包含 "算命瓶" 或 "fortune bottle"，則目標必須是 "fortune bottle" 對應詞
  if (/(算命瓶|fortune bottle)/i.test(src)) {
     if (fortuneTerm && out.toLowerCase().indexOf(fortuneTerm.toLowerCase()) === -1) {
        // 如果翻譯結果錯誤地使用了 Message Bottle 的術語，強制修正
        if (msgTerm && out.toLowerCase().indexOf(msgTerm.toLowerCase()) !== -1) {
           var re = new RegExp(escapeRegExp_(msgTerm), 'gi');
           out = out.replace(re, fortuneTerm);
        } else if (/bottle/i.test(out)) {
           // 如果只是寫 generic bottle，嘗試替換
           // 注意：某些語言可能 fortune bottle 只是 bottle 的變體，這裡假設 fortuneTerm 是完整正確的
           out = out.replace(/bottle/gi, fortuneTerm);
        }
     }
     return out; // 處理完算命瓶就返回，避免被漂流瓶邏輯覆蓋
  }

  // 2. 檢測是否為「漂流瓶」
  // 只有當原文明確是 "漂流瓶" 或 "message bottle" 時才強制
  if (msgTerm && /(漂流瓶|message bottle)/i.test(src)) {
     if (out.toLowerCase().indexOf(msgTerm.toLowerCase()) === -1) {
        // 簡單替換 bottle -> message bottle term
        out = out.replace(/bottle/gi, msgTerm);
    }
  }

  return out;
}

function escapeRegExp_(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
}

function getApiKey_(keyName) {
  var props = PropertiesService.getScriptProperties();
  var userProps = PropertiesService.getUserProperties();
  if (keyName) return props.getProperty(keyName) || userProps.getProperty(keyName);
  var oKey = props.getProperty('OPENAI_API_KEY') || userProps.getProperty('OPENAI_API_KEY');
  if (oKey) return oKey;
  var gKey = props.getProperty('GEMINI_API_KEY') || userProps.getProperty('GEMINI_API_KEY');
  if (gKey) return gKey;
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt('API Key', '請輸入 OpenAI API Key (優先) 或 Gemini Key:', ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() == ui.Button.OK) {
    var k = response.getResponseText().trim();
    if (k.startsWith('sk-')) userProps.setProperty('OPENAI_API_KEY', k);
    else userProps.setProperty('GEMINI_API_KEY', k);
    return k;
  }
  return null;
}

function highlightRange_(sh, r, c, nr, nc, color) {
  try { sh.getRange(r, c, nr, nc).setBackground(color); } catch(e){}
}

function getColIndexByHeader_(headers, name) {
  name = String(name||'').toLowerCase().trim();
  for(var i=0; i<headers.length; i++) if(String(headers[i]).toLowerCase().trim()===name) return i;
  return -1;
}


/* ===================== 質檢核心工具 (優化版 v2.1) ===================== */

function validateTranslation_(src, tgt, headerCode) {
  // 0. 預處理：移除不可見字符、標準化
  src = normalizeString_(src);
  tgt = normalizeString_(tgt);
  
  var reasons = [];

  // 1. 空白檢查 (Critical)
  if (src.trim() && !tgt.trim()) {
    reasons.push('翻譯空白');
    return reasons;
  }
  if (!src.trim()) return [];

  var isSrcPureCode = isPureVariableOrNumber_(src);

  // === 情況 A：來源是純代碼/變數/數字 ===
  if (isSrcPureCode) {
    // 忽略空白和全形半形差異後比較
    if (normalizeFullwidth_(src).trim() !== normalizeFullwidth_(tgt).trim()) {
      reasons.push('代碼/變數被修改');
    }
    return reasons;
  }

  // === 情況 B：一般文本 ===

  // 2. 未翻譯檢查 (Source Leak) - [優化：加入白名單]
  if (src === tgt && src.length > 0) {
    if (!isSafeToKeepSame_(src)) {
       reasons.push('未翻譯（與原文完全相同）');
    }
  }

  // 3. 語言別檢測 (Language Mismatch)
  // 非中文語系 (en, ja...) 卻包含連續中文
  if (headerCode.indexOf('zh') === -1) {
    // 排除 ja (日文漢字), ko (韓文偶爾有漢字), vi (越南文無漢字)
    // 這裡主要抓 歐美語系 殘留中文
    var shouldNotHaveHanzi = /^(en|fr|de|it|es|pt|ru|ar|hi|ur|pl|nl|tr|th|id|ms)$/i.test(headerCode);
    if (shouldNotHaveHanzi) {
      var cleanTgt = tgt.replace(/\$\{[^}]+\}|\{\{[^}]+\}/g, ''); // 移除變數
      // 檢查是否有連續2個以上漢字
      if (/[\u4E00-\u9FFF\u3400-\u4DBF]{2,}/u.test(cleanTgt)) {
         reasons.push('非中文語系包含中文');
      }
    }
  }

  // 4. 品牌字檢查 (XunNi) - 忽略大小寫檢查
  if (src.toLowerCase().indexOf('xunni') !== -1 && tgt.toLowerCase().indexOf('xunni') === -1) {
    reasons.push('遺失品牌字 XunNi');
  }

  // 5. 變數/佔位符檢查 (核心保護)
  var tokensRegex = [
    /\$\{[^}]+\}/g,                      // ${var}
    /\{\{[^}]+\}\}/g,                    // {{name}}
    /%(\d+\$)?[sdif]/g,                  // %s, %d
    /\$[A-Z_][A-Z0-9_]*/g,               // $VAR
    /:[a-z0-9_+-]+:/g,                   // :emoji:
    /<[^<>\n]+>/g,                       // <tag>
    /`[^`]+`/g,                          // `code`
    /&[A-Za-z0-9#]+;/g                   // HTML Entities
  ];

  var tempSrc = src;
  var tempTgt = tgt;

  for (var i = 0; i < tokensRegex.length; i++) {
    var re = tokensRegex[i];
    var srcTokens = tempSrc.match(re) || [];
    var tgtTokens = tempTgt.match(re) || [];

    // 挖空已匹配變數
    if (srcTokens.length > 0) tempSrc = tempSrc.replace(re, '___TOKEN___');
    if (tgtTokens.length > 0) tempTgt = tempTgt.replace(re, '___TOKEN___');

    if (srcTokens.length > 0 || tgtTokens.length > 0) {
      // [優化] 規範化：移除變數內的空白、轉小寫後比較 (忽略大小寫差異)
      var normSrc = srcTokens.map(normalizeToken_);
      var normTgt = tgtTokens.map(normalizeToken_);

      // 檢查數量與內容
      if (normSrc.length !== normTgt.length) {
         // [優化] 如果差異很小（1-2個），可能是格式問題而非遺失
         var diff = Math.abs(normSrc.length - normTgt.length);
         if (diff <= 2 && (normSrc.length > 3 || normTgt.length > 3)) {
           // 變數較多時，允許小差異（可能是格式問題）
           // 不報錯，繼續檢查內容
         } else {
           reasons.push('變數數量不符');
         }
      }
      
      // 檢查內容（即使數量不同也檢查，找出具體缺失的）
      if (normSrc.length > 0 && normTgt.length > 0) {
         var missingContent = findMissingToken_(normSrc, normTgt);
         if (missingContent) {
           // [優化] 如果只是大小寫或格式差異，不報錯
           var isFormatDiff = false;
           for (var sIdx = 0; sIdx < normSrc.length; sIdx++) {
             for (var tIdx = 0; tIdx < normTgt.length; tIdx++) {
               // 檢查是否只是格式差異（如 {name} vs { name }）
               if (normSrc[sIdx].replace(/[_\s]/g, '') === normTgt[tIdx].replace(/[_\s]/g, '')) {
                 isFormatDiff = true;
                 break;
               }
             }
             if (isFormatDiff) break;
           }
           if (!isFormatDiff) {
             reasons.push('變數內容錯誤: ' + missingContent);
           }
         }
      }
    }
  }

  // 6. 括號對稱性 - [優化：支援全形/半形混用檢查]
  // 將所有全形括號轉換為半形後再檢查平衡
  var normalizedSrcBrackets = normalizeBrackets_(tempSrc); // 使用 tempSrc (已移除變數)
  var normalizedTgtBrackets = normalizeBrackets_(tempTgt);
  
  checkBraceBalance_(normalizedSrcBrackets, normalizedTgtBrackets, '{', '}', reasons);
  checkBraceBalance_(normalizedSrcBrackets, normalizedTgtBrackets, '(', ')', reasons);
  checkBraceBalance_(normalizedSrcBrackets, normalizedTgtBrackets, '[', ']', reasons);

  // 7. 數字檢查 - [優化：進一步放寬，避免誤報]
  var cleanSrc = normalizeFullwidth_(src.replace(/\$\{[^}]+\}|\{\{[^}]+\}\}|<[^>]+>/g, ''));
  var cleanTgt = normalizeFullwidth_(tgt.replace(/\$\{[^}]+\}|\{\{[^}]+\}\}|<[^>]+>/g, ''));
  
  var srcNums = (cleanSrc.match(/\d+/g) || []);
  var tgtNums = (cleanTgt.match(/\d+/g) || []);
  
  // [優化] 進一步放寬：只有當原文有數字但譯文完全沒有，且原文長度>5時才報錯
  // 短文本（如 "OK"）可能不包含數字，這是正常的
  if (srcNums.length > 0 && tgtNums.length === 0 && src.trim().length > 5) {
    reasons.push('遺失數字');
  } else if (srcNums.length > 0 && tgtNums.length > 0) {
    // [優化] 只有當差異非常大（>3）且原文數字數量>2時才報錯
    // 避免單個數字的小差異被誤報（如 "1次" vs "1 次"）
    if (Math.abs(srcNums.length - tgtNums.length) > 3 && srcNums.length > 2) {
      reasons.push('數字數量差異過大');
    }
  }

  // 8. 預設佔位符檢查
  if (tgt.indexOf('[需要翻譯]') !== -1 || tgt.indexOf('[需要翻译]') !== -1) {
    reasons.push('包含預設佔位符');
  }

  // 9. 換行符數量 - [優化：進一步放寬]
  var srcLines = (src.match(/\n/g) || []).length;
  var tgtLines = (tgt.match(/\n/g) || []).length;
  // [優化] 只有當差異>2且原文有多行時才報錯（允許格式微調）
  if (Math.abs(srcLines - tgtLines) > 2 && srcLines > 1) { 
    reasons.push('換行數差異過大');
  }

  return reasons;
}

// [新增] 判斷是否為「保持原樣也安全」的文本
function isSafeToKeepSame_(s) {
  s = s.trim();
  if (!/[\p{L}\d]/u.test(s)) return true; // 純符號
  
  // [優化] 擴展白名單：技術術語、品牌名、常見縮寫
  var whitelist = /^(OK|ID|APP|IP|API|VIP|FAQ|S|M|L|XL|MBTI|URL|PDF|CSV|VS|vs\.?|HTTP|HTTPS|JSON|XML|HTML|CSS|JS|UI|UX|AI|ML|DL|iOS|Android|Windows|Mac|Linux|GitHub|GitLab|npm|yarn|pnpm)$/i;
  if (whitelist.test(s)) return true;
  
  if (/^[\d+\-.,%]+$/.test(s)) return true; // 純數字
  
  // 指令型 (e.g. /admin, /block, /appeal)
  if (/^\/[a-zA-Z0-9_]+/.test(s)) return true;
  
  // [新增] Emoji + 短文本（如 "✅ OK"）
  if (/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*[A-Z]{1,3}$/iu.test(s)) return true;
  
  // [新增] 純表情符號或表情+符號
  if (/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]+$/u.test(s)) return true;
  
  return false;
}

// [新增] 基礎字串清洗：移除不可見字符
function normalizeString_(s) {
  return String(s || '').replace(/[\u200B-\u200D\uFEFF]/g, '');
}

// [新增] 全形轉半形 (數字與符號)
function normalizeFullwidth_(s) {
  return s.replace(/[\uFF01-\uFF5E]/g, function(ch) {
      return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0);
  }).replace(/\u3000/g, ' ');
}

// [新增] 括號規範化
function normalizeBrackets_(s) {
  return s.replace(/【/g, '[').replace(/】/g, ']')
          .replace(/（/g, '(').replace(/）/g, ')')
          .replace(/｛/g, '{').replace(/｝/g, '}');
}

// [新增] 檢查括號平衡
function checkBraceBalance_(src, tgt, open, close, reasons) {
  // [優化] 先移除已識別的變數佔位符，避免干擾
  var cleanSrc = src.replace(/\$\{[^}]+\}/g, '').replace(/\{\{[^}]+\}\}/g, '');
  var cleanTgt = tgt.replace(/\$\{[^}]+\}/g, '').replace(/\{\{[^}]+\}\}/g, '');
  
  var srcOpen = cleanSrc.split(open).length - 1;
  var srcClose = cleanSrc.split(close).length - 1;
  var tgtOpen = cleanTgt.split(open).length - 1;
  var tgtClose = cleanTgt.split(close).length - 1;

  // [優化] 只有當原文括號明顯對稱（>1對）且譯文不對稱時才報錯
  // 單個括號可能是表情符號或其他用途，不應報錯
  if (srcOpen === srcClose && srcOpen > 1) {
    if (tgtOpen !== tgtClose) {
      reasons.push('括號不對稱 ' + open + close);
    }
  }
}

// [修正] 嚴格版：只有「純」變數/數字/符號/指令 才允許不翻譯
// 混合了文字的 (例如 "Task: ${name}") 必須翻譯，不能保持原樣
function isPureVariableOrNumber_(s) {
  s = String(s || '').trim();
  // 1. 純數字/符號 (e.g. "123", "-->", "...")
  if (/^[\d\s\p{P}\p{S}]+$/u.test(s)) return true;
  
  // 2. 純變數 (e.g. "${taskName}", "{{user}}", "$VAR", "%s", "<訊息內容>")
  // 不允許混合其他文字
  if (/^(\$\{[^}]+\}|\{\{[^}]+\}|%[\d\.]*[sdif]|\$[A-Z_][A-Z0-9_]*|<[^<>\s]+>)$/.test(s)) return true;
  
  // [新增] 純指令 (e.g. "/admin_add 123", "/set <id>", `admin_add`)
  // 1. 以 / 開頭，後續允許英數字、符號、空格及變數結構
  if (/^\/[A-Za-z0-9_\-\.]+(?:\s+(?:[A-Za-z0-9_\-\.=]+|(?:\$\{[^}]+\})|(?:<[^>]+>)|(?:\{\{[^}]+\})))*$/.test(s)) return true;

  // 2. 被反引號包圍的代碼塊 (e.g. `code`, `admin_add 123`)
  // 允許反引號內包含除換行外的任意字符，或者是簡單的指令形式
  if (/^`[^`\n]+`$/.test(s)) return true;

  // 3. 複合指令形式：可能包含反引號、斜線、變數 (e.g. `/admin_add <id>`, `/func `var``)
  // 如果整個字串看起來像是一段技術指令（包含 / 或 ` 或變數符號），且不含明顯的自然語言（CJK 或長句）
  // 這裡使用排除法：如果不包含中日韓字符，且包含特殊代碼符號
  if (!/[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/.test(s)) {
     // 必須包含至少一個代碼特徵符號 (/ 或 ` 或 ${} 或 <>)
     if (/[\/`\$\{\}<>]/.test(s)) return true;
  }
  
  // 4. 允許「純 Emoji」或「Emoji + 變數」 (e.g. "✨ ${taskName}")
  // 移除變數後，只剩下 Emoji 和空白/標點
  var stripped = s
    .replace(/\$\{[^}]+\}/g, '')
    .replace(/\{\{[^}]+\}/g, '')
    .replace(/%[\d\.]*[sdif]/g, '')
    .replace(/\$[A-Z_][A-Z0-9_]*/g, '')
    .replace(/<[^<>\s]+>/g, '')
    .replace(/^\/[A-Za-z0-9_]+/g, ''); // 移除指令頭
    
  // 如果剩下的內容只包含 Emoji、符號或空白，則視為「無需翻譯」
  // 注意：這裡不能放過一般字母或漢字
  // 使用排除法：如果剩下的內容包含「字母 (L)」或「數字 (N)」，則視為有可翻譯內容
  // 但 Emoji 也可能被歸類為 Symbol，所以這裡邏輯要小心
  
  // 簡單判斷：如果 stripped 還有一般文字 (英文/中文/日文等)，就是未翻譯
  // \p{L} 包含所有語言的字母/漢字
  if (/[\p{L}]/u.test(stripped)) {
    return false; // 還有文字，應該翻譯
  }
  
  return true; // 只剩符號/Emoji，可以保持原樣
}

// [優化] 規範化 Token：移除空白、轉小寫 (增加寬容度)
function normalizeToken_(t) {
  return String(t || '').replace(/\s+/g, '').toLowerCase();
}

// [優化] 判斷變數是否有效 (增加對 . 的支持)
function isValidBraceVar_(t) {
  var inner = t.substring(1, t.length - 1).trim();
  if (inner.indexOf(' ') !== -1 && inner.length > 35) return false;
  return true;
}


function findMissingToken_(srcArr, tgtArr) {
  var i;
  // 簡單檢查：src 有但 tgt 沒有的
  // 複製一份 tgtArr 以免影響後續
  var tgtTemp = tgtArr.slice();
  for (i = 0; i < srcArr.length; i++) {
    var idx = tgtTemp.indexOf(srcArr[i]);
    if (idx === -1) {
      return srcArr[i];
    } else {
      tgtTemp.splice(idx, 1); // 找到就移除，避免重複計數問題
    }
  }
  return null;
}

function tokenizeForScan_(s) {
  s = String(s || '').toLowerCase();
  var arr = s.match(/[\p{L}\p{N}]+/gu) || [];
  var out = [];
  var i;
  for (i = 0; i < arr.length; i++) {
    if (arr[i].length >= 2) out.push(arr[i]);
  }
  return out;
}

function diceSimilarity_(aTokens, bTokens) {
  if (!aTokens.length || !bTokens.length) return 0;
  var setA = Object.create(null);
  var setB = Object.create(null);
  var i;
  for (i = 0; i < aTokens.length; i++) {
    setA[aTokens[i]] = (setA[aTokens[i]] || 0) + 1;
  }
  for (i = 0; i < bTokens.length; i++) {
    setB[bTokens[i]] = (setB[bTokens[i]] || 0) + 1;
  }
  var inter = 0;
  for (var k in setA) {
    if (setB[k]) inter += Math.min(setA[k], setB[k]);
  }
  var total = aTokens.length + bTokens.length;
  return (2 * inter) / total;
}

/* ===================== ✅ 全表質檢（不耗 Token） ===================== */
function runQualityScanAll() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getActiveSheet();
  var lastRow = sh.getLastRow();
  var lastCol = sh.getLastColumn();
  if (lastRow < 2) { ss.toast('沒有資料可檢查', '提示', 4); return; }

  var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  var colEN = getColIndexByHeader_(headers, 'en');
  var colTW = getColIndexByHeader_(headers, 'zh-TW');
  if (colEN >= 0) colEN += 1;
  if (colTW >= 0) colTW += 1;

  clearAllQaHighlights();

  var rng    = sh.getRange(2, 1, lastRow - 1, lastCol);
  var values = rng.getValues();
  var notes  = rng.getNotes();
  var bgs    = rng.getBackgrounds();

  var r, c;
  for (r = 0; r < values.length; r++) {
    var en = colEN ? String(values[r][colEN - 1] || '') : '';
    var tw = colTW ? String(values[r][colTW - 1] || '') : '';

    for (c = 0; c < lastCol; c++) {
      var header = String(headers[c] || '').trim();
      if (!header || header === 'key' || header === 'module' || header === 'en' || header === 'zh-TW' || header === 'zh-CN') continue;

      var txt = String(values[r][c] || '');
      // 優先用英文做基準，沒有則用中文
      var srcRef = en || tw;
      var reasons = validateTranslation_(srcRef, txt, header);

      // [優化] 移除舊有的相似度與長度檢查，避免對日文/韓文等短文本造成誤判
      // 僅依賴 validateTranslation_ 的核心邏輯 (變數、括號、未翻譯檢測)
      
      if (reasons.length) {
        bgs[r][c]   = QA_COLOR;
        notes[r][c] = QA_NOTE_PREFIX + reasons.join('；');
      }
    }
  }

  rng.setBackgrounds(bgs);
  rng.setNotes(notes);
  ss.toast('✅ 全表質檢完成（不耗 Token）—查看粉紅高亮與備註原因。', '完成', 6);
}

/* ===================== ✅ 選取範圍質檢（不耗 Token） ===================== */
function runQualityScanSelection() {
  processRangeList_(runQualityScanSelectionCore_);
}

function runQualityScanSelectionCore_(sh, sel, headers) {
  var colEN   = getColIndexByHeader_(headers, 'en');
  var colTW   = getColIndexByHeader_(headers, 'zh-TW');
  if (colEN >= 0) colEN += 1;
  if (colTW >= 0) colTW += 1;

  var startRow = sel.getRow();
  var startCol = sel.getColumn();
  var numRows  = sel.getNumRows();
  var numCols  = sel.getNumColumns();

  var ss = sh.getParent();
  var processedRows = 0;
  var SCAN_CHUNK_SIZE = 2000; // 批次處理大小
  var totalErrors = 0;

  while (processedRows < numRows) {
    var rowsThisChunk = Math.min(SCAN_CHUNK_SIZE, numRows - processedRows);
    var currentStartRow = startRow + processedRows;

    ss.toast('正在質檢 ' + currentStartRow + ' - ' + (currentStartRow + rowsThisChunk - 1) + ' 行...', '質檢中', 60);

    var rngChunk = sh.getRange(currentStartRow, startCol, rowsThisChunk, numCols);
    var values = rngChunk.getValues();
    var notes  = rngChunk.getNotes();
    var bgs    = rngChunk.getBackgrounds();

  var enColVals = colEN
      ? sh.getRange(currentStartRow, colEN, rowsThisChunk, 1).getValues() 
    : [];
  var twColVals = colTW
      ? sh.getRange(currentStartRow, colTW, rowsThisChunk, 1).getValues() 
      : [];

    for (var r = 0; r < rowsThisChunk; r++) {
    var en = colEN ? String(enColVals[r] ? enColVals[r][0] : '') : '';
    var tw = colTW ? String(twColVals[r] ? twColVals[r][0] : '') : '';

    for (var c = 0; c < numCols; c++) {
      var sheetColIndex = startCol + c;
      var header = String(headers[sheetColIndex - 1] || '').trim();
      
        if (!header || header === 'key' || header === 'module' || header === 'zh-TW') continue;

        // 清除舊的 QA 高亮 (Reset)
        if (bgs[r][c] === QA_COLOR) {
             bgs[r][c] = CLEAR_COLOR;
             if (notes[r][c] && String(notes[r][c]).indexOf(QA_NOTE_PREFIX) === 0) {
                 notes[r][c] = '';
             }
        }

        var txt = String(values[r][c] || '');
      var currentSrcRef = en || tw;
      if (header === 'en' || header === 'zh-CN') {
         currentSrcRef = tw;
      }
      if (!currentSrcRef) currentSrcRef = '';

      var reasons = validateTranslation_(currentSrcRef, txt, header);

      if (reasons.length > 0) {
        var msg = reasons.join('；');
        bgs[r][c]   = QA_COLOR;
        notes[r][c] = QA_NOTE_PREFIX + msg;
          totalErrors++;
        }
      }
    }

    rngChunk.setBackgrounds(bgs);
    rngChunk.setNotes(notes);
    SpreadsheetApp.flush();
    processedRows += rowsThisChunk;
  }
  
  if (totalErrors > 0) {
    ss.toast('此選區發現 ' + totalErrors + ' 個問題。', '質檢結果', 5);
  } else {
    ss.toast('✅ 此選區質檢通過', '質檢結果', 5);
  }
}

/* ===================== 🔍 掃描空白未翻譯 ===================== */
function scanMissingCodesInSelection() {
  processRangeList_(scanMissingCodesInSelectionCore_);
}

function scanMissingCodesInSelectionCore_(sh, sel, headers) {
  var colTW = getColIndexByHeader_(headers, 'zh-TW');
  if (colTW < 0) {
    sh.getParent().toast('找不到 zh-TW 欄位，無法比對代碼', '錯誤', 5);
    return;
  }
  colTW += 1;

  var startRow = sel.getRow();
  var startCol = sel.getColumn();
  var numRows  = sel.getNumRows();
  var numCols  = sel.getNumColumns();

  var ss = sh.getParent();
  var processedRows = 0;
  var SCAN_CHUNK_SIZE = 2000; // 批次大小
  var totalErrors = 0;

  while (processedRows < numRows) {
    var rowsThisChunk = Math.min(SCAN_CHUNK_SIZE, numRows - processedRows);
    var currentStartRow = startRow + processedRows;

    ss.toast('正在掃描遺失代碼 ' + currentStartRow + ' - ' + (currentStartRow + rowsThisChunk - 1) + ' 行...', '掃描中', 60);

    var rngChunk = sh.getRange(currentStartRow, startCol, rowsThisChunk, numCols);
    var values = rngChunk.getValues();
    var notes  = rngChunk.getNotes();
    var bgs    = rngChunk.getBackgrounds();

    var twColVals = sh.getRange(currentStartRow, colTW, rowsThisChunk, 1).getValues();

    for (var r = 0; r < rowsThisChunk; r++) {
      var tw = String(twColVals[r][0] || '');
      if (!tw) continue;

      // 提取 zh-TW 中的關鍵代碼 (Angle brackets, braces, variables)
      var tokens = [];
      var patterns = [
        /<[^<>\n]+>/g,
        /\{\{[^}]+\}\}/g,
        /\$\{[^}]+\}/g,
        /%(\d+\$)?[sdif]/g
      ];
      
      for (var p = 0; p < patterns.length; p++) {
        var m = tw.match(patterns[p]);
        if (m) {
          for (var k = 0; k < m.length; k++) tokens.push(m[k]);
        }
      }

      // 過濾掉明顯的 HTML 標籤
      tokens = tokens.filter(function(t) {
        var inner = t.replace(/[<>]/g, '').toLowerCase().trim();
        return !/^(br|div|span|p|b|i|strong|em|u|a|img|table|tr|td|th|ul|ol|li|code|pre)$/.test(inner);
      });

      if (tokens.length === 0) continue;

      for (var c = 0; c < numCols; c++) {
        var sheetColIndex = startCol + c;
        var header = String(headers[sheetColIndex - 1] || '').trim();
        
        if (!header || header === 'key' || header === 'module' || header === 'zh-TW' || header === 'zh-CN') continue;

        // Reset previous QA highlight (Clean state)
        if (bgs[r][c] === QA_COLOR) {
             bgs[r][c] = CLEAR_COLOR;
             if (notes[r][c] && String(notes[r][c]).indexOf(QA_NOTE_PREFIX) === 0) {
                 notes[r][c] = '';
             }
        }

        var txt = String(values[r][c] || '');
        var missing = [];

        for (var i = 0; i < tokens.length; i++) {
          var token = tokens[i];
          if (txt.indexOf(token) === -1) {
             // 1. 檢查是否 token 本身含中文且目標非中文 -> 允許翻譯，但要檢查是否還有 <...>
             if (/[\u4e00-\u9fa5]/.test(token) && header.indexOf('zh') === -1) {
                var srcAngles = (tw.match(/<[^<>\n]+>/g) || []).length;
                var tgtAngles = (txt.match(/<[^<>\n]+>/g) || []).length;
                if (srcAngles !== tgtAngles) {
                   missing.push(token + ' (結構遺失)');
                }
             } else {
                // 2. 純 ASCII 或同語系 -> 應該保留原樣
                missing.push(token);
             }
          }
        }

        if (missing.length > 0) {
          bgs[r][c]   = QA_COLOR;
          notes[r][c] = QA_NOTE_PREFIX + '遺失代碼: ' + missing.join(', ');
          totalErrors++;
        }
      }
    }

    rngChunk.setBackgrounds(bgs);
    rngChunk.setNotes(notes);
    SpreadsheetApp.flush();
    processedRows += rowsThisChunk;
  }
  
  sh.getParent().toast('掃描完成，發現 ' + totalErrors + ' 個遺失代碼的格子。', '掃描結果', 5);
}

/* ===================== 🔍 掃描空白未翻譯 ===================== */
function scanEmptyCellsInSelection() {
  processRangeList_(scanEmptyCellsInSelectionCore_);
}

function scanEmptyCellsInSelectionCore_(sh, sel, headers) {
  var colEN = getColIndexByHeader_(headers, 'en');
  var colTW = getColIndexByHeader_(headers, 'zh-TW');
  if (colEN >= 0) colEN += 1;
  if (colTW >= 0) colTW += 1;

  var startRow = sel.getRow();
  var startCol = sel.getColumn();
  var numRows  = sel.getNumRows();
  var numCols  = sel.getNumColumns();

  var ss = sh.getParent();
  var processedRows = 0;
  var SCAN_CHUNK_SIZE = 2000; // 批次大小
  var totalErrors = 0;

  while (processedRows < numRows) {
    var rowsThisChunk = Math.min(SCAN_CHUNK_SIZE, numRows - processedRows);
    var currentStartRow = startRow + processedRows;

    ss.toast('正在掃描空白 ' + currentStartRow + ' - ' + (currentStartRow + rowsThisChunk - 1) + ' 行...', '掃描中', 60);

    var rngChunk = sh.getRange(currentStartRow, startCol, rowsThisChunk, numCols);
    var values = rngChunk.getValues();
    var notes  = rngChunk.getNotes();
    var bgs    = rngChunk.getBackgrounds();

    var enColVals = colEN 
      ? sh.getRange(currentStartRow, colEN, rowsThisChunk, 1).getValues() 
      : [];
    var twColVals = colTW 
      ? sh.getRange(currentStartRow, colTW, rowsThisChunk, 1).getValues() 
      : [];

    for (var r = 0; r < rowsThisChunk; r++) {
    var en = colEN ? String(enColVals[r] ? enColVals[r][0] : '') : '';
    var tw = colTW ? String(twColVals[r] ? twColVals[r][0] : '') : '';
    // 如果連原文都沒有，這行應該是廢棄或空白行，跳過
    if (!en && !tw) continue;

    for (var c = 0; c < numCols; c++) {
      var sheetColIndex = startCol + c;
      var header = String(headers[sheetColIndex - 1] || '').trim();
      
        // 跳過 key, module, en, zh-TW, zh-CN (這些通常是源頭，不視為漏翻，或者由其他邏輯處理)
        if (!header || header === 'key' || header === 'module' || header === 'zh-TW' || header === 'en' || header === 'zh-CN') continue;

        // Reset previous QA highlight (Clean state)
        if (bgs[r][c] === QA_COLOR) {
             bgs[r][c] = CLEAR_COLOR;
             if (notes[r][c] && String(notes[r][c]).indexOf(QA_NOTE_PREFIX) === 0) {
                 notes[r][c] = '';
             }
        }

      var txt = String(values[r][c] || '').trim();
      
      if (!txt) {
        bgs[r][c]   = QA_COLOR;
        notes[r][c] = QA_NOTE_PREFIX + '⚠️ 缺翻譯 (空白)';
          totalErrors++;
        }
      }
    }

    rngChunk.setBackgrounds(bgs);
    rngChunk.setNotes(notes);
    SpreadsheetApp.flush();
    processedRows += rowsThisChunk;
  }
  
  sh.getParent().toast('掃描完成，發現 ' + totalErrors + ' 個空白未翻譯格子。', '掃描結果', 5);
}

/* ===================== 🤖 AI 深度質檢（耗 Token） ===================== */
function runAiQualityScanSelection() {
  processRangeList_(runAiQualityScanCore_);
}

function runAiQualityScanCore_(sh, sel, headers) {
  var apiKey = getApiKey_();
  if (!apiKey) throw new Error('缺少 OPENAI_API_KEY');

  var colEN   = getColIndexByHeader_(headers, 'en');
  var colTW   = getColIndexByHeader_(headers, 'zh-TW');
  if (colEN >= 0) colEN += 1;
  if (colTW >= 0) colTW += 1;

  clearQaInRange_(sel);

  var startRow = sel.getRow();
  var startCol = sel.getColumn();
  var numRows  = sel.getNumRows();
  var numCols  = sel.getNumColumns();

  var totalRowsRemaining = numRows;
  var processedRows = 0;
  var ss = sh.getParent();

  while (totalRowsRemaining > 0) {
    var rowsThisChunk = Math.min(20, totalRowsRemaining); // AI 檢查批次較小
    var chunkRowStart = startRow + processedRows;

    highlightRange_(sh, chunkRowStart, startCol, rowsThisChunk, numCols, WORKING_COLOR);
    ss.toast(
      '🤖 AI 正在深度檢查... (' + (processedRows + rowsThisChunk) + '/' + numRows + ')',
      '質檢中', 30
    );

    var rangeChunk = sh.getRange(chunkRowStart, startCol, rowsThisChunk, numCols);
    var valuesChunk = rangeChunk.getValues();
    var bgChunk = rangeChunk.getBackgrounds();
    var noteChunk = rangeChunk.getNotes();

    var checkItems = [];
    var itemIndices = [];

    var enColVals = colEN
      ? sh.getRange(chunkRowStart, colEN, rowsThisChunk, 1).getValues()
      : [];
    var twColVals = colTW
      ? sh.getRange(chunkRowStart, colTW, rowsThisChunk, 1).getValues()
      : [];

    for (var r = 0; r < rowsThisChunk; r++) {
      var en = colEN ? String(enColVals[r][0] || '') : '';
      var tw = colTW ? String(twColVals[r][0] || '') : '';
      var src = en || tw; 

      for (var c = 0; c < numCols; c++) {
        var sheetColIndex = startCol + c;
        var header = String(headers[sheetColIndex - 1] || '').trim();
        if (!header || header === 'key' || header === 'module' || header === 'en' || header === 'zh-TW' || header === 'zh-CN') continue;

        var tgt = String(valuesChunk[r][c] || '');
        if (!tgt) continue;

        checkItems.push({
          id: r + '_' + c,
          src: src,
          tgt: tgt,
          lang: header
        });
        itemIndices.push({ r: r, c: c });
      }
    }

    if (checkItems.length > 0) {
      var results = openAiBatchCheck_(checkItems);
      for (var k = 0; k < results.length; k++) {
        var res = results[k];
        var idx = itemIndices[k];
        
        if (!res.valid) {
          bgChunk[idx.r][idx.c] = QA_COLOR;
          noteChunk[idx.r][idx.c] = QA_NOTE_PREFIX + 'AI: ' + (res.reason || 'Translation seems incorrect');
        }
      }
    }

    for (var r = 0; r < rowsThisChunk; r++) {
      for (var c = 0; c < numCols; c++) {
        if (bgChunk[r][c] !== QA_COLOR) {
          bgChunk[r][c] = CLEAR_COLOR;
        }
      }
    }

    rangeChunk.setBackgrounds(bgChunk);
    rangeChunk.setNotes(noteChunk);
    SpreadsheetApp.flush(); // 強制寫入，防止超時丟失進度
    
    processedRows += rowsThisChunk;
    totalRowsRemaining -= rowsThisChunk;
    Utilities.sleep(SLEEP_MS);
  }
  ss.toast('✅ AI 深度質檢完成', '完成', 5);
}

/* ===================== 🤖 AI 智能複核 (Re-verify) ===================== */
/* 針對已標記 QA_COLOR 的格子進行語意複核。如果是誤報(AI認為正確)，則清除高亮。 */
function runAiReverifySelection() {
  processRangeList_(runAiReverifyCore_);
}

function runAiReverifyCore_(sh, sel, headers) {
  var apiKey = getApiKey_();
  if (!apiKey) throw new Error('缺少 OPENAI_API_KEY');

  var colEN = getColIndexByHeader_(headers, 'en');
  var colTW = getColIndexByHeader_(headers, 'zh-TW');
  if (colEN >= 0) colEN += 1;
  if (colTW >= 0) colTW += 1;

  var startRow = sel.getRow();
  var startCol = sel.getColumn();
  var numRows  = sel.getNumRows();
  var numCols  = sel.getNumColumns();

  var totalProcessed = 0;
  var CHUNK_SIZE = 50; 
  var ss = sh.getParent();
  var totalCleared = 0;
  var totalFixed = 0;
  var totalFoundInSelection = 0; // 統計選區內發現的高亮數

  log_('Reverify Selection: R' + startRow + ' C' + startCol + ' ' + numRows + 'x' + numCols);

  while (totalProcessed < numRows) {
    var rowsThisChunk = Math.min(CHUNK_SIZE, numRows - totalProcessed);
    var currentStartRow = startRow + totalProcessed;

    ss.toast(
      '🤖 AI 正在複核並修復... (' + (totalProcessed + 1) + '/' + numRows + ')',
      '智能處理中', 60
    );

    var rangeChunk = sh.getRange(currentStartRow, startCol, rowsThisChunk, numCols);
    var values     = rangeChunk.getValues();
    var bgs        = rangeChunk.getBackgrounds();
    var notes      = rangeChunk.getNotes();

    var enColVals = colEN 
      ? sh.getRange(currentStartRow, colEN, rowsThisChunk, 1).getValues() 
      : [];
    var twColVals = colTW 
      ? sh.getRange(currentStartRow, colTW, rowsThisChunk, 1).getValues() 
      : [];

    var itemsToCheck = [];
    var itemIndices  = [];

    var r, c;
    for (r = 0; r < rowsThisChunk; r++) {
      for (c = 0; c < numCols; c++) {
        var bg = String(bgs[r][c] || '').toLowerCase();
        var qaColor = String(QA_COLOR).toLowerCase();

        if (bg === qaColor) {
          totalFoundInSelection++;
          var sheetColIndex = startCol + c;
          var header = String(headers[sheetColIndex - 1] || '').trim();
          if (!header || header === 'key' || header === 'module') continue;

          var tgt = String(values[r][c] || '');
          var en  = colEN ? String(enColVals[r] ? enColVals[r][0] : '') : '';
          var tw  = colTW ? String(twColVals[r] ? twColVals[r][0] : '') : '';
          var src = en || tw;

          if (!src) {
             log_('Skipping cell R:' + (currentStartRow + r) + ' C:' + sheetColIndex + ' (No Source)');
             continue;
          }

          itemsToCheck.push({
            src: src,
            tgt: tgt,
            lang: header,
            refTW: tw
          });
          itemIndices.push({ r: r, c: c });
        }
      }
    }

    log_('Chunk ' + currentStartRow + ': Found ' + itemsToCheck.length + ' QA items to verify.');

    if (itemsToCheck.length > 0) {
      var results = openAiBatchReverify_(itemsToCheck);

      for (var i = 0; i < results.length; i++) {
        var res = results[i];
        var idx = itemIndices[i];

        if (res.valid) {
          // AI 認為沒問題 -> 清除高亮
          bgs[idx.r][idx.c]   = CLEAR_COLOR;
          notes[idx.r][idx.c] = ''; 
          totalCleared++;
        } else if (res._skipped) {
          // AI 漏答，保持原狀，不清除也不報錯，但在 Log 警告
          log_('Item skipped by AI (Row ' + (idx.r+1) + ')');
        } else {
          // AI 認為有問題
          if (res.corrected && res.corrected !== values[idx.r][idx.c]) {
             // AI 提供了修正版本 -> 直接寫入修正值，清除高亮
             values[idx.r][idx.c] = res.corrected;
             bgs[idx.r][idx.c]    = CLEAR_COLOR; // 視為已修復，清除高亮
             notes[idx.r][idx.c]  = '';          // 清除備註
             totalFixed++;
          } else {
             // AI 沒給修正或無法修正 -> 保留高亮，更新備註
             notes[idx.r][idx.c] = QA_NOTE_PREFIX + 'AI: ' + (res.reason || '語意錯誤 (無法自動修復)');
          }
        }
      }

      // 4. 寫回 Sheet (包含值、背景、備註)
      rangeChunk.setValues(values); // 寫回修正後的值
      rangeChunk.setBackgrounds(bgs);
      rangeChunk.setNotes(notes);
      SpreadsheetApp.flush(); 
    }

    totalProcessed += rowsThisChunk;
    Utilities.sleep(100);
  }

  var msg = '✅ 處理完成！';
  if (totalFoundInSelection === 0) {
     msg += ' (選區內未發現 QA 高亮)';
  } else {
     msg += ' 發現 ' + totalFoundInSelection + ' 個高亮，確認 ' + totalCleared + ' 個，修復 ' + totalFixed + ' 個。';
  }
  
  log_(msg);
  ss.toast(msg, '完成', 8);
}

function openAiBatchReverify_(items) {
  var gKey = getApiKey_('GEMINI_API_KEY');
  var oKey = getApiKey_('OPENAI_API_KEY');
  var useGemini = (!oKey && !!gKey);
  var apiKey = oKey ? oKey : gKey;

  var results = [];
  for (var i = 0; i < items.length; i++) results.push({ valid: false, reason: "AI 未回應" });

  var requests = [];
  var BATCH = 15; 

  for (var i = 0; i < items.length; i += BATCH) {
    var slice = items.slice(i, i + BATCH);
    
    var prompt = "You are a strict localization QA judge.\n" +
      "Task: Check translation from " + (slice[0].srcCode || 'source') + " to " + (slice[0].lang || 'target') + ".\n" +
      "\n" +
      "1. If VALID (meaning correct, ignore style diffs): return { \"valid\": true }.\n" +
      "2. If INVALID (wrong meaning, not translated, broken syntax): return { \"valid\": false, \"reason\": \"error type\", \"corrected\": \"PUT_CORRECTED_TRANSLATION_HERE\" }.\n" +
      "   - IMPORTANT: You MUST provide 'corrected' text if valid is false.\n" +
      "\n" +
      "Input JSON (Array of " + slice.length + " items): " + JSON.stringify(slice) + "\n" +
      "Output JSON array: MUST contain exactly " + slice.length + " objects corresponding 1-to-1 to input.\n" +
      "Example: [{ \"valid\": true }, { \"valid\": false, \"reason\": \"...\", \"corrected\": \"...\" }, ...]";

    var sysMsg = "Return strictly a JSON Array of " + slice.length + " items. No markdown.";
    
    var payload;
    if (useGemini) {
        payload = {
           "system_instruction": { "parts": { "text": sysMsg } },
           "contents": [{ "role": "user", "parts": [{ "text": prompt }] }],
           "generationConfig": { 
             "responseMimeType": "application/json",
             "responseSchema": {
               "type": "ARRAY",
               "items": {
                 "type": "OBJECT",
                 "properties": {
                   "valid": { "type": "BOOLEAN" },
                   "reason": { "type": "STRING" },
                   "corrected": { "type": "STRING" }
                 },
                 "required": ["valid"]
               }
             }
           }
        };
    } else {
        payload = {
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: sysMsg },
        { role: 'user',   content: prompt }
      ],
      max_completion_tokens: OPENAI_MAX_TOKENS
    };
    }

    var url, headers;
    if (useGemini) {
        url = 'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent?key=' + apiKey;
        headers = {};
    } else {
        url = 'https://api.openai.com/v1/chat/completions';
        headers = { 'Authorization': 'Bearer ' + apiKey };
    }

    requests.push({
      url: url,
      method: 'post',
      contentType: 'application/json',
      headers: headers,
      muteHttpExceptions: true,
      payload: JSON.stringify(payload),
      _startIndex: i,
      _sliceLen: slice.length,
      _slice: slice // 保存 slice 以便後續使用
    });
  }

  if (requests.length === 0) return results;

  try {
    var responses = UrlFetchApp.fetchAll(requests);

    for (var k = 0; k < responses.length; k++) {
      var req = requests[k];
      var res = responses[k];
      var code = res.getResponseCode();
      var content = res.getContentText();

      if (code >= 200 && code < 300) {
        try {
          var json = JSON.parse(content);
          var aiContent;
          if (useGemini) {
             if (json.candidates && json.candidates[0] && json.candidates[0].content) {
                aiContent = json.candidates[0].content.parts[0].text;
             } else {
                Logger.log('Gemini: No candidates in response. Full response: ' + JSON.stringify(json).substring(0, 500));
                aiContent = '';
             }
          } else {
             if (json.choices && json.choices[0] && json.choices[0].message) {
                aiContent = json.choices[0].message.content;
             } else {
                Logger.log('OpenAI: No choices in response. Full response: ' + JSON.stringify(json).substring(0, 500));
                aiContent = '';
             }
          }
          
          if (!aiContent || aiContent.trim() === '') {
            Logger.log('Empty AI content. Marking all items in batch as API error.');
            for (var subI = 0; subI < req._sliceLen; subI++) {
              results[req._startIndex + subI] = { valid: false, reason: "API 返回空內容", _apiError: true };
            }
            continue;
          }
          
          var parsedArr = parseJsonArrayResponse_(aiContent, req._sliceLen);
          
          for (var subI = 0; subI < parsedArr.length; subI++) {
            var p = parsedArr[subI];
            // 轉換為標準格式
            var finalObj = { valid: false, reason: "AI 格式錯誤" };
            
            // 如果是空字串 (Padding)，代表 AI 沒回傳這筆，標記為 Skip
            if (p === '' || p === null || p === undefined) {
               finalObj = { valid: false, reason: "AI漏答 (Skipped)", _skipped: true };
            } else if (p && typeof p === 'object') {
                finalObj = p;
                if (finalObj.valid === undefined) finalObj.valid = false;
            } else if (p === true || (typeof p === 'string' && p.toLowerCase().includes('valid'))) {
                finalObj = { valid: true };
            }

            // 後處理：確保 corrected 經過標準化 (如保留特殊符號)
            if (!finalObj.valid && finalObj.corrected) {
               var item = req._slice[subI];
               // 簡單的保護處理，避免 AI 修復時把變數搞壞
               // 這裡直接信賴 AI，但可以加一層 stripTags_ 或類似處理
               finalObj.corrected = String(finalObj.corrected).trim();
            }

            results[req._startIndex + subI] = finalObj;
          }
        } catch (e) {
          Logger.log('Reverify JSON Parse Error: ' + e + '. Response code: ' + code + ', Content: ' + content.substring(0, 500));
          // 標記這批所有項目為解析錯誤
          for (var subI = 0; subI < req._sliceLen; subI++) {
            results[req._startIndex + subI] = { valid: false, reason: "JSON 解析失敗: " + e.message, _parseError: true };
          }
        }
      } else {
        // API 調用失敗
        Logger.log('API Error: Code ' + code + ', Response: ' + content.substring(0, 500));
        for (var subI = 0; subI < req._sliceLen; subI++) {
          results[req._startIndex + subI] = { valid: false, reason: "API 錯誤 (HTTP " + code + ")", _apiError: true };
        }
      }
    }
  } catch (e) {
    Logger.log('Reverify FetchAll Error: ' + e);
  }

  return results;
}

function openAiBatchCheck_(items) {
  // 分批處理，避免 Prompt 過長
  var results = [];
  var BATCH = 10;
  
  for (var i = 0; i < items.length; i += BATCH) {
    var slice = items.slice(i, i + BATCH);
    var prompt = "You are a localization QA assistant. Your goal is to find CRITICAL ERRORS only.\n" +
      "Do NOT flag stylistic differences. If the meaning is preserved, it is VALID.\n" +
      "\n" +
      "Rules for VALID (true):\n" +
      "- Meaning is accurate (even if phrased differently).\n" +
      "- Tone is acceptable.\n" +
      "\n" +
      "Rules for INVALID (false) - Flag ONLY these:\n" +
      "1. CRITICAL Mistranslation (meaning is wrong/opposite).\n" +
      "2. Not Translated (source text remains). This is VERY COMMON. If the target text looks identical or very similar to the source text (and is not a proper noun/English term), FLAG IT.\n" +
      "3. Hallucination (adds unrelated content).\n" +
      "4. Broken Syntax (broken {{vars}} or HTML).\n" +
      "\n" +
      "Input JSON: " + JSON.stringify(slice) + "\n\n" +
      "Output strictly JSON array of objects: [{ \"valid\": boolean, \"reason\": \"short error msg (if invalid)\" }]";

    var sysMsg = "Output JSON only. Be lenient on style, strict on meaning/syntax errors.";
    var resp = callAiApi_(sysMsg, prompt);
    var parsed = parseJsonArrayResponse_(resp, slice.length);
    
    // 轉換格式
    for (var j = 0; j < parsed.length; j++) {
      var p = parsed[j];
      // 如果 parse 出來是字串 (舊邏輯容錯)，嘗試轉物件，或是 default OK
      if (typeof p === 'string') {
         // 簡單容錯：如果 AI 回傳字串，假設它是在解釋錯誤
         if (p.toLowerCase().indexOf('valid') === -1) {
             results.push({ valid: true });
         } else {
             results.push({ valid: false, reason: p });
         }
      } else {
         results.push(p || { valid: true });
      }
    }
  }
  return results;
}

/* ===================== ⚙ 自動翻譯 QA 高亮（選取範圍） ===================== */
function autoTranslateHighlightedSelection() {
  processRangeList_(autoTranslateHighlightedCoreSelection_);
}

function autoTranslateHighlightedCoreSelection_(sh, sel, headers) {
  var startRow = sel.getRow();
  var numRows  = sel.getNumRows();
  var startCol = sel.getColumn();
  var numCols  = sel.getNumColumns();
  autoTranslateHighlightedCore_(sh, startRow, numRows, startCol, numCols);
}

/* ===================== ⚙ 自動翻譯 QA 高亮（全表） ===================== */
function autoTranslateHighlighted() {
  var apiKey = getApiKey_();
  if (!apiKey) throw new Error('缺少 OPENAI_API_KEY');

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getActiveSheet();
  var lastRow = sh.getLastRow();
  var lastCol = sh.getLastColumn();
  
  if (lastRow < 2) return;
  
  autoTranslateHighlightedCore_(sh, 2, lastRow - 1, 1, lastCol);
  
  ss.toast('✅ 已自動翻譯全表的 QA 高亮欄位', '完成', 6);
}

function autoTranslateHighlightedCore_(sh, startRow, numRows, limitStartCol, limitNumCols) {
  var lastCol = sh.getLastColumn();
  var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  var colEN   = getColIndexByHeader_(headers, 'en');
  var colTW   = getColIndexByHeader_(headers, 'zh-TW');
  if (colEN >= 0) colEN += 1;
  if (colTW >= 0) colTW += 1;

  // [優化] 分批處理配置
  var CHUNK_SIZE = 50; 
  var totalProcessed = 0;
  var ss = sh.getParent();
  
  // API Key Logic
  var gKey = getApiKey_('GEMINI_API_KEY');
  var oKey = getApiKey_('OPENAI_API_KEY');
  var useGemini = (!oKey && !!gKey);
  var apiKey = oKey ? oKey : gKey;

  // 計算實際要掃描的欄位範圍
  var scanStartCol = limitStartCol || 1;
  var scanNumCols  = limitNumCols || lastCol;

  while (totalProcessed < numRows) {
    var chunkRows = Math.min(CHUNK_SIZE, numRows - totalProcessed);
    var currentStartRow = startRow + totalProcessed;
    
    // 只讀取範圍內的資料
    var rng = sh.getRange(currentStartRow, scanStartCol, chunkRows, scanNumCols);
    var values = rng.getValues();
    var bgs = rng.getBackgrounds();
    var notes = rng.getNotes();

    log_('Chunk Range: Row ' + currentStartRow + ', ' + chunkRows + ' rows. Checking ' + scanNumCols + ' cols.');

    // 預讀取來源欄位 (Chunk)
    var enValsChunk = colEN ? sh.getRange(currentStartRow, colEN, chunkRows, 1).getValues() : [];
    var twValsChunk = colTW ? sh.getRange(currentStartRow, colTW, chunkRows, 1).getValues() : [];

    var repairTasks = [];

    for (var r = 0; r < values.length; r++) {
      for (var c = 0; c < scanNumCols; c++) {
        var bg = String(bgs[r][c] || '').toLowerCase();
        var qaColor = String(QA_COLOR).toLowerCase();
        
        if (bg === qaColor) {
          // 換算回 Sheet 的實際欄位索引 (1-based)
          var actualColIndex = scanStartCol + c;
          var header = String(headers[actualColIndex - 1] || '').trim();
          
          if (!header || header === 'zh-TW' || header === 'key' || header === 'module') continue;

          // 決定來源
          var srcCode = (header === 'en') ? 'zh-TW' : (colEN ? 'en' : 'zh-TW');
          var srcText = '';
          
          if (srcCode === 'en' && colEN) {
             srcText = String(enValsChunk[r] ? enValsChunk[r][0] : '');
          } else if (colTW) {
             srcText = String(twValsChunk[r] ? twValsChunk[r][0] : '');
          }

          if (!srcText) {
             log_('Skipping cell R:' + (currentStartRow + r) + ' C:' + actualColIndex + ' (No Source Text)');
             continue;
          }

          repairTasks.push({
            r: r,
            c: c,
            src: srcText,
            lang: header,
            srcCode: srcCode
          });
        }
      }
    }

    log_('Found ' + repairTasks.length + ' tasks in this chunk.');

    // 如果此批次有任務，執行修復並立即寫回
    if (repairTasks.length > 0) {
      ss.toast('正在修復第 ' + currentStartRow + ' - ' + (currentStartRow + chunkRows - 1) + ' 行...', '修復進度', 60);

      // 2. 將任務分組並平行請求
      var apiRequests = [];
      var tasksByLang = {};
      
      for (var i = 0; i < repairTasks.length; i++) {
        var t = repairTasks[i];
        if (!tasksByLang[t.lang]) tasksByLang[t.lang] = [];
        tasksByLang[t.lang].push(t);
      }

      for (var lang in tasksByLang) {
        var langTasks = tasksByLang[lang];
        var srcCode = langTasks[0].srcCode;

        for (var i = 0; i < langTasks.length; i += BATCH_SIZE) {
          var slice = langTasks.slice(i, i + BATCH_SIZE);
          var srcArr = slice.map(function(item) { return item.src; });
          
          var sysMsg  = buildSystemPrompt_(srcCode, lang);
          var userMsg = buildUserPrompt_(srcArr, srcCode, lang);
          
          var payload;
          if (useGemini) {
             payload = {
                "system_instruction": { "parts": { "text": sysMsg } },
                "contents": [{ "role": "user", "parts": [{ "text": userMsg }] }],
                "generationConfig": { 
                  "responseMimeType": "application/json",
                  "responseSchema": {
                    "type": "ARRAY",
                    "items": { "type": "STRING" }
                  }
                }
             };
          } else {
             payload = {
            model: OPENAI_MODEL,
            messages: [
              { role: 'system', content: sysMsg },
              { role: 'user',   content: userMsg }
            ],
            max_completion_tokens: OPENAI_MAX_TOKENS
          };
          }

          var url, headers;
          if (useGemini) {
              url = 'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent?key=' + apiKey;
              headers = {};
          } else {
              url = 'https://api.openai.com/v1/chat/completions';
              headers = { 'Authorization': 'Bearer ' + apiKey };
          }

          apiRequests.push({
            url: url,
            method: 'post',
            contentType: 'application/json',
            headers: headers,
            muteHttpExceptions: true,
            payload: JSON.stringify(payload),
            _meta: {
              lang: lang,
              sliceItems: slice,
              srcCode: srcCode
            }
          });
        }
      }

      // 3. 平行發送請求
      if (apiRequests.length > 0) {
        log_('Sending ' + apiRequests.length + ' API requests.');
        try {
          var responses = UrlFetchApp.fetchAll(apiRequests);
          var successCount = 0;

          // 4. 處理回應
          for (var k = 0; k < responses.length; k++) {
            var req = apiRequests[k];
            var res = responses[k];
            var meta = req._meta;
            var code = res.getResponseCode();
            var respText = res.getContentText();

            log_('Response ' + k + ' (' + meta.lang + ') Code: ' + code);

            if (code >= 200 && code < 300) {
              try {
                var json = JSON.parse(respText);
                var content;
                if (useGemini) {
                   if (json.candidates && json.candidates[0] && json.candidates[0].content) {
                      content = json.candidates[0].content.parts[0].text;
                   } else {
                      content = '';
                   }
                } else {
                   content = json.choices[0].message.content;
                }
                
                var translatedArr = parseJsonArrayResponse_(content, meta.sliceItems.length);
                log_('Parsed ' + translatedArr.length + ' items for ' + meta.lang);

                for (var idx = 0; idx < translatedArr.length; idx++) {
                  var item = meta.sliceItems[idx];
                  var rawTgt = translatedArr[idx];
                  
                  if (rawTgt !== undefined && rawTgt !== null) {
                    var finalTgt = processTranslationResult_(item.src, rawTgt, meta.lang, item.src);
                    values[item.r][item.c] = finalTgt;
                    bgs[item.r][item.c]    = '#ffffff'; 
                    
                    var note = String(notes[item.r][item.c] || '');
                    if (note.indexOf(QA_NOTE_PREFIX) === 0) {
                      notes[item.r][item.c] = '';
                    }
                    successCount++;
                  }
                }
              } catch (e) {
                Logger.log('修復解析失敗 (' + meta.lang + '): ' + e);
                log_('Parse Error ' + meta.lang + ': ' + e);
              }
            } else {
              Logger.log('修復請求失敗 (' + meta.lang + '): ' + code + ' ' + respText);
              log_('API Error ' + meta.lang + ': ' + code);
            }
          }
        } catch (e) {
          Logger.log('FetchAll Error in autoFix: ' + e);
          log_('FetchAll Error: ' + e);
          ss.toast('平行修復發生錯誤，請查看 Log', '錯誤', 5);
        }
      }

      // 5. 分批寫回 (Batch Write) - 關鍵修正：每批次處理完立即寫回
      rng.setValues(values);
      rng.setBackgrounds(bgs);
      rng.setNotes(notes);
      SpreadsheetApp.flush(); // 強制寫入
    }

    totalProcessed += chunkRows;
    Utilities.sleep(100); // 避免太快觸發限制
  }
  
  sh.getParent().toast('✅ 全數修復完成', '完成', 5);
}

/* ===================== 🧹 清除 QA 高亮 ===================== */
function clearQaInSelection() {
  processRangeList_(clearQaInSelectionCore_);
}

function clearQaInSelectionCore_(sh, sel, headers) {
  clearQaInRange_(sel);
  sh.getParent().toast('✅ 已清除此範圍的高亮', '完成', 2);
}

function clearQaInRange_(rng) {
  var bgs   = rng.getBackgrounds();
  var notes = rng.getNotes();
  var changed = false;
  var r, c;
  for (r = 0; r < bgs.length; r++) {
    for (c = 0; c < bgs[0].length; c++) {
      var bg = bgs[r][c];
      // 清除 QA 粉紅高亮 或 工作中的黃色高亮
      if (bg === QA_COLOR || bg === WORKING_COLOR) { 
        bgs[r][c] = CLEAR_COLOR; 
        changed = true; 
      }
      if (notes[r][c] && String(notes[r][c]).indexOf(QA_NOTE_PREFIX) === 0) {
        notes[r][c] = '';
        changed = true;
      }
    }
  }
  if (changed) {
    rng.setBackgrounds(bgs);
    rng.setNotes(notes);
  }
}

function clearAllQaHighlights() {
  var sh = SpreadsheetApp.getActiveSheet();
  var lastRow = sh.getLastRow();
  var lastCol = sh.getLastColumn();
  if (lastRow < 2) return;

  var rng = sh.getRange(2, 1, lastRow - 1, lastCol);
  clearQaInRange_(rng);
}

/* ===================== 一鍵：質檢 → 修復 → 清除 ===================== */
function oneClickQAAndFix() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.toast('正在進行全表質檢…', '步驟 1/3', 3);
  runQualityScanAll();

  ss.toast('正在自動翻譯高亮欄位…', '步驟 2/3', 3);
  autoTranslateHighlighted();

  ss.toast('清理餘下高亮與備註…', '步驟 3/3', 3);
  clearAllQaHighlights();

  ss.toast('✅ 已完成：質檢→修復→清除', '完成', 5);
}

/* ===================== 特殊指令處理 (Broadcast/Params) ===================== */

/* 1. 掃描特殊指令與參數 */
function scanSpecialCommandsInSelection() {
  processRangeList_(scanSpecialCommandsCore_);
}

function scanSpecialCommandsCore_(sh, sel, headers) {
  var colTW = getColIndexByHeader_(headers, 'zh-TW');
  if (colTW < 0) {
    sh.getParent().toast('找不到 zh-TW 欄位，無法比對指令', '錯誤', 5);
    return;
  }
  colTW += 1;

  var startRow = sel.getRow();
  var startCol = sel.getColumn();
  var numRows  = sel.getNumRows();
  var numCols  = sel.getNumColumns();

  var ss = sh.getParent();
  var processedRows = 0;
  var SCAN_CHUNK_SIZE = 2000;
  var totalIssues = 0;

  while (processedRows < numRows) {
    var rowsThisChunk = Math.min(SCAN_CHUNK_SIZE, numRows - processedRows);
    var currentStartRow = startRow + processedRows;

    ss.toast('正在掃描指令 ' + currentStartRow + ' - ' + (currentStartRow + rowsThisChunk - 1) + ' 行...', '掃描中', 60);

    var rngChunk = sh.getRange(currentStartRow, startCol, rowsThisChunk, numCols);
    var values = rngChunk.getValues();
    var notes  = rngChunk.getNotes();
    var bgs    = rngChunk.getBackgrounds();

    var twColVals = sh.getRange(currentStartRow, colTW, rowsThisChunk, 1).getValues();

    for (var r = 0; r < rowsThisChunk; r++) {
      var tw = String(twColVals[r][0] || '');
      // 判斷是否包含特殊指令特徵
      if (!isSpecialCommandRow_(tw)) continue;

      for (var c = 0; c < numCols; c++) {
        var sheetColIndex = startCol + c;
        var header = String(headers[sheetColIndex - 1] || '').trim();
        
        if (!header || header === 'key' || header === 'module' || header === 'zh-TW' || header === 'zh-CN') continue;

        var txt = String(values[r][c] || '');
        var issues = [];

        // 檢查 1: 參數 Key 是否被翻譯 (檢查常見的 country, gender, age)
        // 預期目標字串裡應該要有英文的 "country=", "gender="
        // 這裡做個簡單檢查：如果 source 有 country=，但 target 沒有，那就是錯了
        if (/country\s*=/i.test(tw) && !/country\s*=/i.test(txt)) {
          issues.push('Key被翻譯 (country)');
        }
        if (/gender\s*=/i.test(tw) && !/gender\s*=/i.test(txt)) {
          issues.push('Key被翻譯 (gender)');
        }

        // 檢查 2: 國家代碼適配
        // 預期：如果 source 有 country=TW，target 應該要是 country=對應代碼
        var targetCountryCode = LANG_TO_COUNTRY_MAP[header];
        if (targetCountryCode) {
           var countryMatch = txt.match(/country\s*=\s*([A-Za-z]+)/i);
           if (countryMatch) {
             var currentCode = countryMatch[1].toUpperCase();
             if (currentCode !== targetCountryCode && currentCode === 'TW') {
               issues.push('國家代碼未適配 (' + currentCode + '->' + targetCountryCode + ')');
             }
           }
        }

        if (issues.length > 0) {
           bgs[r][c] = CMD_COLOR;
           notes[r][c] = CMD_NOTE_PREFIX + issues.join('; ');
           totalIssues++;
        }
      }
    }

    rngChunk.setBackgrounds(bgs);
    rngChunk.setNotes(notes);
    SpreadsheetApp.flush();
    processedRows += rowsThisChunk;
  }

  if (totalIssues > 0) {
    ss.toast('掃描完成，發現 ' + totalIssues + ' 個指令適配問題。', '結果', 5);
  } else {
    ss.toast('✅ 未發現指令適配問題', '結果', 5);
  }
}

/* 2. 執行特殊指令適配修復 */
function fixSpecialCommandsInSelection() {
  processRangeList_(fixSpecialCommandsCore_);
}

function fixSpecialCommandsCore_(sh, sel, headers) {
  var colTW = getColIndexByHeader_(headers, 'zh-TW');
  if (colTW < 0) {
    sh.getParent().toast('找不到 zh-TW 欄位，無法修復指令', '錯誤', 5);
    return;
  }
  colTW += 1;

  var startRow = sel.getRow();
  var startCol = sel.getColumn();
  var numRows  = sel.getNumRows();
  var numCols  = sel.getNumColumns();

  var ss = sh.getParent();
  var processedRows = 0;
  var CHUNK_SIZE = 2000;
  var totalFixed = 0;

  while (processedRows < numRows) {
    var rowsThisChunk = Math.min(CHUNK_SIZE, numRows - processedRows);
    var currentStartRow = startRow + processedRows;

    ss.toast('正在修復指令 ' + currentStartRow + ' - ' + (currentStartRow + rowsThisChunk - 1) + ' 行...', '修復中', 60);

    var rngChunk = sh.getRange(currentStartRow, startCol, rowsThisChunk, numCols);
    var values = rngChunk.getValues();
    var bgs    = rngChunk.getBackgrounds();
    var notes  = rngChunk.getNotes();

    var twColVals = sh.getRange(currentStartRow, colTW, rowsThisChunk, 1).getValues();

    for (var r = 0; r < rowsThisChunk; r++) {
      var tw = String(twColVals[r][0] || '');
      if (!isSpecialCommandRow_(tw)) continue;

      // 解析 Source 的指令結構 (Header)
      // 假設指令/參數在前半部分，用換行或特定模式區分
      // 簡單策略：把所有包含 '/' 或 '=' 的行視為 Technical Header
      var twParts = splitCommandAndBody_(tw);

      for (var c = 0; c < numCols; c++) {
        var sheetColIndex = startCol + c;
        var header = String(headers[sheetColIndex - 1] || '').trim();
        if (!header || header === 'key' || header === 'module' || header === 'zh-TW' || header === 'zh-CN') continue;

        // 檢查是否被標記為 CMD 問題，或者我們強制對選區內所有指令行進行修復
        // 這裡策略：只要是指令行，都嘗試修復，確保格式統一
        
        var txt = String(values[r][c] || '');
        var txtParts = splitCommandAndBody_(txt);

        // 建構新的 Header
        var newHeader = twParts.header; // 以 zh-TW 的 Header 為模板 (確保 Key 是英文)
        
        // 置換國家代碼
        var targetCountryCode = LANG_TO_COUNTRY_MAP[header];
        if (targetCountryCode) {
           // 替換 country=TW 或 country=XX 為 country=TARGET_CODE
           // 這裡假設 source header 裡有 country=...
           newHeader = newHeader.replace(/(country\s*=\s*)([A-Za-z0-9]+)/gi, '$1' + targetCountryCode);
        }

        // 組合：新 Header + 原有翻譯 Body
        // 注意：如果 txtParts.body 是空的 (可能翻譯完全爛掉)，則勉強用 txt 本身，但通常 txtParts.body 應該是翻譯好的內容
        var newBody = txtParts.body;
        if (!newBody && !txtParts.header) {
           // 如果切分不出來，可能整句就是 body? 不太可能，因为是指令行
           newBody = txt; 
        }

        var finalVal = newHeader + (newHeader && newBody ? '\n' : '') + newBody;

        if (finalVal !== txt) {
           values[r][c] = finalVal;
           // 清除 CMD 高亮
           if (bgs[r][c] === CMD_COLOR) bgs[r][c] = CLEAR_COLOR;
           if (notes[r][c] && String(notes[r][c]).indexOf(CMD_NOTE_PREFIX) === 0) notes[r][c] = '';
           totalFixed++;
        }
      }
    }

    rngChunk.setValues(values);
    rngChunk.setBackgrounds(bgs);
    rngChunk.setNotes(notes);
    SpreadsheetApp.flush();
    processedRows += rowsThisChunk;
  }

  ss.toast('修復完成，更新了 ' + totalFixed + ' 個格子的指令參數。', '結果', 5);
}

// 輔助：判斷是否為特殊指令行
function isSpecialCommandRow_(text) {
  if (!text) return false;
  // 特徵：以 / 開頭，或者包含 country=, gender= 這種參數
  return /^\s*\//.test(text) || /(country|gender|age)\s*=/i.test(text);
}

// 輔助：切分 Header (指令參數) 與 Body (訊息內容)
function splitCommandAndBody_(text) {
  var lines = text.split('\n');
  var headerLines = [];
  var bodyLines = [];
  
  var collectingHeader = true;
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (collectingHeader) {
      // 判斷是否為 Header 行
      // 1. 以 / 開頭 (指令)
      // 2. 包含 = (參數賦值)
      // 3. 空行 (有時候分隔用)
      if (line.indexOf('/') === 0 || line.indexOf('=') !== -1 || line === '') {
        headerLines.push(lines[i]); // 保留原始縮排/格式
      } else {
        // 遇到第一行既不是指令也不是參數的，視為 Body 開始
        collectingHeader = false;
        bodyLines.push(lines[i]);
      }
    } else {
      bodyLines.push(lines[i]);
    }
  }
  
  return {
    header: headerLines.join('\n').trim(),
    body: bodyLines.join('\n').trim()
  };
}

/* ===================== 📊 診斷：錯誤類型統計（分析誤報原因） ===================== */
/* 掃描全表高亮，統計每種錯誤類型的數量，幫助找出導致大量誤報的規則 */
function runErrorTypeDiagnosis() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getActiveSheet();
  var lastRow = sh.getLastRow();
  var lastCol = sh.getLastColumn();
  
  if (lastRow < 2) {
    ss.toast('沒有資料可檢查', '提示', 4);
    return;
  }

  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    '錯誤類型診斷',
    '此功能將掃描全表高亮單元格，統計每種錯誤類型的數量。\n\n這可以幫助您找出哪些質檢規則產生了過多的誤報。\n\n是否繼續？',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.ButtonSet.YES) return;

  ss.toast('正在掃描全表高亮...', '診斷中', 10);

  var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  var colEN = getColIndexByHeader_(headers, 'en');
  var colTW = getColIndexByHeader_(headers, 'zh-TW');
  if (colEN >= 0) colEN += 1;
  if (colTW >= 0) colTW += 1;

  // 統計錯誤類型
  var errorStats = {};
  var totalHighlighted = 0;
  var sampleNotes = {}; // 保存每種錯誤類型的樣本

  var rng = sh.getRange(2, 1, lastRow - 1, lastCol);
  var bgs = rng.getBackgrounds();
  var notes = rng.getNotes();
  var values = rng.getValues();

  var enColVals = colEN ? sh.getRange(2, colEN, lastRow - 1, 1).getValues() : [];
  var twColVals = colTW ? sh.getRange(2, colTW, lastRow - 1, 1).getValues() : [];

  for (var r = 0; r < bgs.length; r++) {
    for (var c = 0; c < bgs[0].length; c++) {
      var bg = String(bgs[r][c] || '').toLowerCase();
      if (bg === String(QA_COLOR).toLowerCase()) {
        totalHighlighted++;
        var note = String(notes[r][c] || '');
        
        // 解析錯誤原因（從備註中提取）
        if (note.indexOf(QA_NOTE_PREFIX) === 0) {
          var reasonsStr = note.substring(QA_NOTE_PREFIX.length);
          var reasons = reasonsStr.split('；'); // 中文分號分隔
          
          for (var i = 0; i < reasons.length; i++) {
            var reason = reasons[i].trim();
            if (reason) {
              // 統計錯誤類型
              errorStats[reason] = (errorStats[reason] || 0) + 1;
              
              // 保存樣本（每種錯誤類型最多保存3個）
              if (!sampleNotes[reason]) {
                sampleNotes[reason] = [];
              }
              if (sampleNotes[reason].length < 3) {
                var en = colEN ? String(enColVals[r] ? enColVals[r][0] : '') : '';
                var tw = colTW ? String(twColVals[r] ? twColVals[r][0] : '') : '';
                var tgt = String(values[r][c] || '');
                var header = String(headers[c] || '').trim();
                sampleNotes[reason].push({
                  src: en || tw,
                  tgt: tgt,
                  lang: header,
                  row: r + 2
                });
              }
            }
          }
        }
      }
    }
  }

  if (totalHighlighted === 0) {
    ss.toast('未發現高亮單元格', '提示', 5);
    return;
  }

  // 排序錯誤類型（按數量降序）
  var sortedErrors = [];
  for (var reason in errorStats) {
    sortedErrors.push({
      reason: reason,
      count: errorStats[reason],
      percentage: ((errorStats[reason] / totalHighlighted) * 100).toFixed(1)
    });
  }
  sortedErrors.sort(function(a, b) { return b.count - a.count; });

  // 生成報告
  var report = '📊 錯誤類型診斷報告\n\n';
  report += '總高亮數: ' + totalHighlighted + '\n';
  report += '錯誤類型數: ' + sortedErrors.length + '\n\n';
  report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

  // 顯示前10種最常見的錯誤
  var topN = Math.min(10, sortedErrors.length);
  report += '🔝 前 ' + topN + ' 種最常見錯誤：\n\n';
  
  for (var i = 0; i < topN; i++) {
    var err = sortedErrors[i];
    report += (i + 1) + '. ' + err.reason + '\n';
    report += '   數量: ' + err.count + ' (' + err.percentage + '%)\n';
    
    // 顯示樣本
    if (sampleNotes[err.reason] && sampleNotes[err.reason].length > 0) {
      report += '   樣本：\n';
      for (var j = 0; j < sampleNotes[err.reason].length; j++) {
        var sample = sampleNotes[err.reason][j];
        var srcPreview = sample.src.length > 30 ? sample.src.substring(0, 30) + '...' : sample.src;
        var tgtPreview = sample.tgt.length > 30 ? sample.tgt.substring(0, 30) + '...' : sample.tgt;
        report += '     [' + sample.lang + '] 行' + sample.row + ': "' + srcPreview + '" → "' + tgtPreview + '"\n';
      }
    }
    report += '\n';
  }

  // 分析建議
  report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
  report += '💡 優化建議：\n\n';

  var topError = sortedErrors[0];
  if (topError && topError.percentage > 50) {
    report += '⚠️ 發現主要問題：\n';
    report += '   "' + topError.reason + '" 佔比 ' + topError.percentage + '%\n';
    report += '   這可能是導致大量誤報的主要原因。\n\n';
    
    // 針對特定錯誤類型給出建議
    if (topError.reason.indexOf('變數') !== -1) {
      report += '   建議：\n';
      report += '   - 檢查變數格式是否統一（如 {name} vs { name }）\n';
      report += '   - 確認變數名稱是否在不同語言中保持一致\n';
      report += '   - 考慮放寬變數檢查的嚴格度\n';
    } else if (topError.reason.indexOf('數字') !== -1) {
      report += '   建議：\n';
      report += '   - 數字檢查可能過於嚴格\n';
      report += '   - 某些語言可能用文字表達數字（如 "one" vs "1"）\n';
      report += '   - 考慮進一步放寬數字差異容忍度\n';
    } else if (topError.reason.indexOf('未翻譯') !== -1) {
      report += '   建議：\n';
      report += '   - 擴充「保持原樣安全」的白名單\n';
      report += '   - 某些技術術語、品牌名應保持原樣\n';
    } else if (topError.reason.indexOf('括號') !== -1) {
      report += '   建議：\n';
      report += '   - 某些語言習慣使用全形括號\n';
      report += '   - 檢查是否已正確處理全形/半形轉換\n';
    }
  } else {
    report += '✅ 錯誤類型分布較為均勻，沒有明顯的單一問題源頭。\n';
    report += '   建議使用「AI 智能採樣檢查」評估誤報率。\n';
  }

  // 顯示完整報告
  ui.alert('錯誤類型診斷報告', report, ui.ButtonSet.OK);

  // 可選：輸出到日誌（方便複製）
  Logger.log('=== 錯誤類型診斷報告 ===');
  Logger.log('總高亮數: ' + totalHighlighted);
  Logger.log('\n錯誤類型統計：');
  for (var i = 0; i < sortedErrors.length; i++) {
    Logger.log((i + 1) + '. ' + sortedErrors[i].reason + ': ' + sortedErrors[i].count + ' (' + sortedErrors[i].percentage + '%)');
  }

  ss.toast('診斷完成，請查看報告', '完成', 5);
}

/* ===================== 🎯 AI 智能採樣檢查（評估誤報率） ===================== */
/* 隨機採樣高亮單元格，用 AI 評估誤報率，幫助決定是否需要全量檢查 */
function runAiSamplingCheck() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getActiveSheet();
  var lastRow = sh.getLastRow();
  var lastCol = sh.getLastColumn();
  
  if (lastRow < 2) {
    ss.toast('沒有資料可檢查', '提示', 4);
    return;
  }

  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt(
    '智能採樣檢查',
    '請輸入採樣數量（建議 50-200，預設 100）：',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (response.getSelectedButton() !== ui.Button.OK) return;
  
  var sampleSize = parseInt(response.getResponseText()) || 100;
  if (sampleSize < 10 || sampleSize > 500) {
    ss.toast('採樣數量應在 10-500 之間', '錯誤', 5);
    return;
  }

  var apiKey = getApiKey_();
  if (!apiKey) {
    ss.toast('缺少 API Key', '錯誤', 5);
    return;
  }

  var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  var colEN = getColIndexByHeader_(headers, 'en');
  var colTW = getColIndexByHeader_(headers, 'zh-TW');
  if (colEN >= 0) colEN += 1;
  if (colTW >= 0) colTW += 1;

  ss.toast('正在掃描全表高亮單元格...', '採樣中', 10);

  // 1. 收集所有高亮單元格
  var allHighlighted = [];
  var rng = sh.getRange(2, 1, lastRow - 1, lastCol);
  var bgs = rng.getBackgrounds();
  var values = rng.getValues();
  var notes = rng.getNotes();

  var enColVals = colEN ? sh.getRange(2, colEN, lastRow - 1, 1).getValues() : [];
  var twColVals = colTW ? sh.getRange(2, colTW, lastRow - 1, 1).getValues() : [];

  for (var r = 0; r < bgs.length; r++) {
    for (var c = 0; c < bgs[0].length; c++) {
      var bg = String(bgs[r][c] || '').toLowerCase();
      if (bg === String(QA_COLOR).toLowerCase()) {
        var header = String(headers[c] || '').trim();
        if (!header || header === 'key' || header === 'module') continue;

        var tgt = String(values[r][c] || '');
        var en = colEN ? String(enColVals[r] ? enColVals[r][0] : '') : '';
        var tw = colTW ? String(twColVals[r] ? twColVals[r][0] : '') : '';
        var src = en || tw;

        if (src) {
          allHighlighted.push({
            row: r + 2,
            col: c + 1,
            src: src,
            tgt: tgt,
            lang: header,
            note: String(notes[r][c] || '')
          });
        }
      }
    }
  }

  if (allHighlighted.length === 0) {
    ss.toast('未發現高亮單元格', '提示', 5);
    return;
  }

  // 2. 隨機採樣
  var sampled = [];
  var actualSampleSize = Math.min(sampleSize, allHighlighted.length);
  
  // Fisher-Yates 洗牌算法
  var indices = [];
  for (var i = 0; i < allHighlighted.length; i++) indices.push(i);
  for (var i = indices.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = indices[i];
    indices[i] = indices[j];
    indices[j] = temp;
  }
  
  for (var i = 0; i < actualSampleSize; i++) {
    sampled.push(allHighlighted[indices[i]]);
  }

  ss.toast('正在用 AI 檢查 ' + actualSampleSize + ' 個採樣...', 'AI 檢查中', 30);

  // 3. AI 檢查採樣
  var itemsToCheck = sampled.map(function(item) {
    return {
      src: item.src,
      tgt: item.tgt,
      lang: item.lang
    };
  });

  var results = openAiBatchReverify_(itemsToCheck);

  // 4. 統計結果
  var validCount = 0;
  var invalidCount = 0;
  var fixedCount = 0;
  var skippedCount = 0;
  var apiErrorCount = 0;
  var parseErrorCount = 0;
  var successCount = 0; // 成功獲得 AI 判斷的數量

  for (var i = 0; i < results.length; i++) {
    var res = results[i];
    if (res._apiError) {
      apiErrorCount++;
    } else if (res._parseError) {
      parseErrorCount++;
    } else if (res._skipped) {
      skippedCount++;
    } else {
      successCount++;
      if (res.valid) {
        validCount++;
      } else {
        invalidCount++;
        if (res.corrected) fixedCount++;
      }
    }
  }

  // 5. 顯示結果
  var report = '📊 採樣檢查結果\n\n' +
    '採樣數量: ' + actualSampleSize + ' / ' + allHighlighted.length + '\n\n';
  
  if (successCount === 0) {
    // 如果全部失敗，顯示錯誤信息
    report += '⚠️ AI 檢查失敗！\n\n';
    report += '❌ API 錯誤: ' + apiErrorCount + '\n';
    report += '❌ 解析錯誤: ' + parseErrorCount + '\n';
    report += '⏭️ 跳過: ' + skippedCount + '\n\n';
    report += '💡 可能原因：\n';
    report += '1. API Key 無效或過期\n';
    report += '2. API 配額已用完\n';
    report += '3. 網絡連接問題\n';
    report += '4. AI 返回格式異常\n\n';
    report += '請檢查：\n';
    report += '- 查看 Apps Script 執行紀錄（執行 > 執行紀錄）\n';
    report += '- 確認 API Key 是否正確\n';
    report += '- 嘗試重新運行或減少採樣數量';
  } else {
    var falsePositiveRate = successCount > 0 ? (validCount / successCount * 100).toFixed(1) : '0.0';
    var estimatedTotal = allHighlighted.length;
    var estimatedFalsePositives = successCount > 0 ? Math.round(estimatedTotal * validCount / successCount) : 0;
    var estimatedCost = Math.ceil(estimatedTotal / 15) * 0.001; // 假設每批 15 個，每批成本約 0.001 USD

    report += '✅ 成功檢查: ' + successCount + ' 個\n';
    report += '✅ 正確（誤報）: ' + validCount + ' (' + falsePositiveRate + '%)\n';
    report += '❌ 確實有問題: ' + invalidCount + '\n';
    report += '🔧 可自動修復: ' + fixedCount + '\n';
    
    if (apiErrorCount > 0 || parseErrorCount > 0 || skippedCount > 0) {
      report += '\n⚠️ 檢查異常：\n';
      if (apiErrorCount > 0) report += '  ❌ API 錯誤: ' + apiErrorCount + '\n';
      if (parseErrorCount > 0) report += '  ❌ 解析錯誤: ' + parseErrorCount + '\n';
      if (skippedCount > 0) report += '  ⏭️ 跳過: ' + skippedCount + '\n';
    }
    
    report += '\n📈 預估全表：\n' +
      '  總高亮數: ' + estimatedTotal + '\n' +
      '  預估誤報: ~' + estimatedFalsePositives + '\n' +
      '  預估成本: ~$' + estimatedCost.toFixed(2) + '\n\n' +
      '💡 建議：\n';
    
    if (falsePositiveRate > 70) {
      report += '誤報率很高（>70%），建議先優化質檢規則，或直接清除大部分高亮。';
    } else if (falsePositiveRate > 40) {
      report += '誤報率較高（40-70%），建議分批處理，每次處理 1000-2000 行。';
    } else {
      report += '誤報率較低（<40%），可以進行全量 AI 複核。';
    }
  }

  ui.alert('採樣檢查報告', report, ui.ButtonSet.OK);

  // 6. 可選：自動清除採樣中的誤報（僅當有成功檢查的結果時）
  if (successCount > 0 && validCount > 0) {
    var clearResponse = ui.alert(
      '是否清除採樣中的誤報高亮？',
      '將清除 ' + validCount + ' 個確認無誤的高亮單元格。\n（僅清除成功檢查且確認無誤的項目）',
      ui.ButtonSet.YES_NO
    );

    if (clearResponse === ui.ButtonSet.YES) {
      var cleared = 0;
      for (var i = 0; i < sampled.length; i++) {
        var res = results[i];
        // 只清除成功檢查且確認無誤的
        if (res.valid && !res._apiError && !res._parseError && !res._skipped) {
          var item = sampled[i];
          sh.getRange(item.row, item.col).setBackground(CLEAR_COLOR);
          sh.getRange(item.row, item.col).setNote('');
          cleared++;
        }
      }
      SpreadsheetApp.flush();
      ss.toast('已清除 ' + cleared + ' 個誤報高亮', '完成', 5);
    }
  } else if (successCount === 0) {
    ui.alert(
      '無法清除誤報',
      '由於 AI 檢查全部失敗，無法確認哪些是誤報。\n請先解決 API 問題後再試。',
      ui.ButtonSet.OK
    );
  }
}

/* ===================== 📊 全表高亮分批 AI 複核（可中斷續傳） ===================== */
/* 智能分批處理全表高亮，支持中斷後續傳，避免重複檢查 */
function runAiReverifyAllHighlighted() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getActiveSheet();
  var lastRow = sh.getLastRow();
  var lastCol = sh.getLastColumn();

  if (lastRow < 2) {
    ss.toast('沒有資料可檢查', '提示', 4);
    return;
  }

  var ui = SpreadsheetApp.getUi();
  
  // 檢查是否有進度保存
  var userProps = PropertiesService.getUserProperties();
  var savedProgress = userProps.getProperty('AI_REVERIFY_PROGRESS');
  var continueFromSaved = false;
  var startRow = 2;
  
  if (savedProgress) {
    var response = ui.alert(
      '發現未完成的進度',
      '是否從上次中斷處繼續？\n（上次處理到第 ' + savedProgress + ' 行）',
      ui.ButtonSet.YES_NO_CANCEL
    );
    
    if (response === ui.ButtonSet.YES) {
      startRow = parseInt(savedProgress) + 1;
      continueFromSaved = true;
    } else if (response === ui.ButtonSet.CANCEL) {
      return;
    } else {
      userProps.deleteProperty('AI_REVERIFY_PROGRESS');
    }
  }

  var response = ui.prompt(
    '全表高亮分批 AI 複核',
    '請輸入每批處理的行數（建議 500-2000，預設 1000）：\n（處理過程中可隨時中斷，下次可續傳）',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  var batchSize = parseInt(response.getResponseText()) || 1000;
  if (batchSize < 100 || batchSize > 5000) {
    ss.toast('批次大小應在 100-5000 之間', '錯誤', 5);
    return;
  }

  var apiKey = getApiKey_();
  if (!apiKey) {
    ss.toast('缺少 API Key', '錯誤', 5);
    return;
  }

  var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  var colEN = getColIndexByHeader_(headers, 'en');
  var colTW = getColIndexByHeader_(headers, 'zh-TW');
  if (colEN >= 0) colEN += 1;
  if (colTW >= 0) colTW += 1;

  var totalProcessed = startRow - 2;
  var totalCleared = 0;
  var totalFixed = 0;
  var totalChecked = 0;
  var currentRow = startRow;

  try {
    while (currentRow <= lastRow) {
      var rowsThisBatch = Math.min(batchSize, lastRow - currentRow + 1);
      
      ss.toast(
        '🤖 正在處理第 ' + currentRow + '-' + (currentRow + rowsThisBatch - 1) + ' 行...\n' +
        '（已處理: ' + totalProcessed + ' 行，清除: ' + totalCleared + '，修復: ' + totalFixed + '）',
        '分批處理中', 120
      );

      var rangeBatch = sh.getRange(currentRow, 1, rowsThisBatch, lastCol);
      var values = rangeBatch.getValues();
      var bgs = rangeBatch.getBackgrounds();
      var notes = rangeBatch.getNotes();

      var enColVals = colEN ? sh.getRange(currentRow, colEN, rowsThisBatch, 1).getValues() : [];
      var twColVals = colTW ? sh.getRange(currentRow, colTW, rowsThisBatch, 1).getValues() : [];

      var itemsToCheck = [];
      var itemIndices = [];

      for (var r = 0; r < rowsThisBatch; r++) {
        for (var c = 0; c < lastCol; c++) {
          var bg = String(bgs[r][c] || '').toLowerCase();
          if (bg === String(QA_COLOR).toLowerCase()) {
            var header = String(headers[c] || '').trim();
            if (!header || header === 'key' || header === 'module') continue;

            var tgt = String(values[r][c] || '');
            var en = colEN ? String(enColVals[r] ? enColVals[r][0] : '') : '';
            var tw = colTW ? String(twColVals[r] ? twColVals[r][0] : '') : '';
            var src = en || tw;

            if (src) {
              itemsToCheck.push({
                src: src,
                tgt: tgt,
                lang: header
              });
              itemIndices.push({ r: r, c: c });
            }
          }
        }
      }

      if (itemsToCheck.length > 0) {
        totalChecked += itemsToCheck.length;
        var results = openAiBatchReverify_(itemsToCheck);

        for (var i = 0; i < results.length; i++) {
          var res = results[i];
          var idx = itemIndices[i];

          if (res.valid) {
            bgs[idx.r][idx.c] = CLEAR_COLOR;
            notes[idx.r][idx.c] = '';
            totalCleared++;
          } else if (res.corrected && res.corrected !== values[idx.r][idx.c]) {
            values[idx.r][idx.c] = res.corrected;
            bgs[idx.r][idx.c] = CLEAR_COLOR;
            notes[idx.r][idx.c] = '';
            totalFixed++;
          } else if (!res._skipped) {
            notes[idx.r][idx.c] = QA_NOTE_PREFIX + 'AI: ' + (res.reason || '語意錯誤');
          }
        }

        rangeBatch.setValues(values);
        rangeBatch.setBackgrounds(bgs);
        rangeBatch.setNotes(notes);
        SpreadsheetApp.flush();
      }

      // 保存進度
      currentRow += rowsThisBatch;
      totalProcessed += rowsThisBatch;
      userProps.setProperty('AI_REVERIFY_PROGRESS', String(currentRow - 1));

      // 批次間暫停，避免觸發限制
      Utilities.sleep(200);
    }

    // 完成後清除進度
    userProps.deleteProperty('AI_REVERIFY_PROGRESS');

    var msg = '✅ 全表處理完成！\n' +
      '總處理: ' + totalProcessed + ' 行\n' +
      '檢查: ' + totalChecked + ' 個高亮\n' +
      '清除誤報: ' + totalCleared + ' 個\n' +
      '自動修復: ' + totalFixed + ' 個';
    
    ss.toast(msg, '完成', 10);
    ui.alert('處理完成', msg, ui.ButtonSet.OK);

  } catch (e) {
    // 發生錯誤時保存進度
    userProps.setProperty('AI_REVERIFY_PROGRESS', String(currentRow - 1));
    Logger.log('Error in runAiReverifyAllHighlighted: ' + e);
    ss.toast('處理中斷，進度已保存。錯誤: ' + e.message, '錯誤', 10);
    throw e;
  }
}

/* ===================== THE END ===================== */
