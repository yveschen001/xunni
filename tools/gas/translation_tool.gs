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

function getBottleTerm_(code) {
  var t = BOTTLE_TERM_MAP[code];
  if (t) return t;
  var lang = String(code || '').split('-')[0];
  if (lang === 'zh') return '漂流瓶';
  return 'message bottle';
}

/* ===================== 菜單 ===================== */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('翻譯工具')
    .addItem('🚀 翻譯選取範圍 (zh-TW→多語)', 'runSmartTranslateSelection')
    .addItem('🚀 由英文翻譯選取範圍 (en→多語)', 'runTranslateFromEnSelection')
    .addSeparator()
    .addItem('清理選取範圍 HTML 標籤（<>）', 'cleanSelectionHtmlWrappers')
    .addItem('優化 zh-TW（客服語氣）', 'polishZhTwSelection')
    .addSeparator()
    .addItem('✅ 全表質檢（不耗 Token）', 'runQualityScanAll')
    .addItem('✅ 選取範圍質檢（不耗 Token）', 'runQualityScanSelection')
    .addItem('🔍 掃描選區遺失代碼 (Missing Codes)', 'scanMissingCodesInSelection')
    .addItem('🔍 掃描選區空白未翻譯', 'scanEmptyCellsInSelection')
    .addItem('🧹 清除選取範圍高亮', 'clearQaInSelection')
    .addSeparator()
    .addItem('🤖 AI 智能複核誤報（只查高亮格）', 'runAiReverifySelection')
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
          var sysMsg  = buildSystemPrompt_(srcLang, headerCode);
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
  var term = getBottleTerm_(targetCode);
  if (!term) return out;
  if (/(漂流瓶|bottle)/i.test(src) && out.toLowerCase().indexOf(term.toLowerCase()) === -1) {
    out = out.replace(/bottle/gi, term);
  }
  return out;
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


/* ===================== 質檢核心工具 (增強版) ===================== */

function validateTranslation_(src, tgt, headerCode) {
  src = String(src || '');
  tgt = String(tgt || '');
  var reasons = [];

  // 1. 空白檢查
  if (src.trim() && !tgt.trim()) {
    reasons.push('翻譯空白');
    return reasons;
  }
  if (!src.trim()) return [];

  // 判斷來源特質：是否為「純變數/代碼/符號/指令」
  var isSourceCodeLike = isPureVariableOrNumber_(src);

  // === 檢查邏輯分流 ===

  // 情況 A：來源是代碼/變數/指令 (e.g., "${taskName}", "123", "/admin_add", "-->")
  if (isSourceCodeLike) {
    // 1. 純代碼/指令：如果完全一樣，視為正確 (Pass)
    if (src.trim() === tgt.trim()) {
      return []; 
    }
    // 2. 如果不一樣，通常是變數被改壞了，或是多了空格，這裡交由後面的變數檢查來抓
  } 
  // 情況 B：來源是文字 (e.g., "Hello World", "Task: ${name}")
  else {
    // 1. 未翻譯檢查 (Source Leak)
    // 只有當它不是「純代碼」時，內容完全一樣才算錯誤
    if (src === tgt && src.length > 2) {
       reasons.push('未翻譯（與原文完全相同）');
    }
    
    // 2. 語言別檢測 (Language Mismatch)
    // 非中文語系 (en, ja...) 卻包含連續中文
    if (headerCode.indexOf('zh') === -1) {
      var shouldNotHaveHanzi = /^(en|vi|id|ms|th|fil|tl|fr|de|it|es|pt|ru|ar|hi|ur)$/i.test(headerCode);
      if (shouldNotHaveHanzi) {
        // 移除變數後檢查是否殘留中文
        var cleanTgt = tgt.replace(/\$\{[^}]+\}|\{\{[^}]+\}/g, '');
        if (/[\u4E00-\u9FFF\u3400-\u4DBF\u{20000}-\u{2A6DF}]{2,}/u.test(cleanTgt)) {
           reasons.push('非中文語系包含中文');
        }
      }
    }
  }

  // === 通用檢查 (無論類型) ===

  // 2. 品牌字檢查 (XunNi)
  if (src.indexOf('XunNi') !== -1 && tgt.indexOf('XunNi') === -1) {
    reasons.push('遺失品牌字 XunNi');
  }

  // 3. 換行符數量
  var srcLines = (src.match(/\n/g) || []).length;
  var tgtLines = (tgt.match(/\n/g) || []).length;
  if (Math.abs(srcLines - tgtLines) > 1) { 
    reasons.push('換行數差異過大');
  }

  // 4. 變數/佔位符檢查 (核心保護 - 增強版：忽略空格，內容必對)
  var tokensRegex = [
    // 優先匹配最長的模式，避免重疊匹配
    /\$\{[^}]+\}/g,                      // ${var}
    /\{\{[^}]+\}\}/g,                    // {{name}}
    /%(\d+\$)?[sdif]/g,                  // %s, %d
    /\$[A-Z_][A-Z0-9_]*/g,               // $VAR
    /:[a-z0-9_+-]+:/g,                   // :emoji:
    /<[^<>\n]+>/g,                       // <provider_id>, <訊息內容>, <message content>
    /`[^`]+`/g,                          // `code`
    /&[A-Za-z0-9#]+;/g                   // Entities
  ];
  
  // 針對 {var} 做特殊處理：如果它已經被 ${var} 或 {{var}} 匹配過，就不該再匹配
  // 這裡使用一個簡單策略：先將 src/tgt 中已匹配的高優先級變數「挖空」，再匹配低優先級
  
  var tempSrc = src;
  var tempTgt = tgt;
  
  for (var i = 0; i < tokensRegex.length; i++) {
    var re = tokensRegex[i];
    
    // 提取變數
    var srcTokens = tempSrc.match(re) || [];
    var tgtTokens = tempTgt.match(re) || [];
    
    // 挖空已匹配的變數，避免後續正則重複抓取
    if (srcTokens.length > 0) tempSrc = tempSrc.replace(re, '___TOKEN___');
    if (tgtTokens.length > 0) tempTgt = tempTgt.replace(re, '___TOKEN___');
    
    if (srcTokens.length > 0 || tgtTokens.length > 0) {
      // 規範化：移除所有空白後再比較
      var normSrc = srcTokens.map(normalizeToken_);
      var normTgt = tgtTokens.map(normalizeToken_);
      
      // 檢查數量
      if (normSrc.length !== normTgt.length) {
         var missing = findMissingToken_(normSrc, normTgt);
         if (missing) reasons.push('缺失變數 ' + missing);
         else reasons.push('變數數量不符');
      } else {
         // 數量相同，檢查內容是否一一對應
         var missingContent = findMissingToken_(normSrc, normTgt);
         if (missingContent) {
           reasons.push('變數內容錯誤或被竄改: ' + missingContent);
         }
      }
    }
  }

  // 補遺：檢查單大括號 {var} (排除已被挖空的)
  // 只有當剩下文本裡還有 {x} 結構時才檢查
  var braceRe = /\{[^{}]+ ?\}/g; // 簡單匹配 {code} 或 { code }
  var srcBraces = tempSrc.match(braceRe) || [];
  var tgtBraces = tempTgt.match(braceRe) || [];
  if (srcBraces.length !== tgtBraces.length) {
    // 再次確認這不是誤判（有些語言文本可能包含大括號）
    // 這裡做個寬容處理：只有當括號內看起來像變數（無空格或短單詞）才報錯
    var validSrcBraces = srcBraces.filter(isValidBraceVar_);
    var validTgtBraces = tgtBraces.filter(isValidBraceVar_);
    
    if (validSrcBraces.length !== validTgtBraces.length) {
        // 嘗試 Normalize 後比較
        var nSrc = validSrcBraces.map(normalizeToken_);
        var nTgt = validTgtBraces.map(normalizeToken_);
        var missingB = findMissingToken_(nSrc, nTgt);
        if (missingB) reasons.push('缺失變數 ' + missingB);
    }
  }

  // 5. 括號對稱性
  checkBraceBalance_(src, tgt, '{', '}', reasons);
  checkBraceBalance_(src, tgt, '(', ')', reasons);
  
  // 6. 數字檢查 (忽略變數內的數字)
  var cleanSrc = src.replace(/\$\{[^}]+\}|\{[^}]+\}/g, '');
  var cleanTgt = tgt.replace(/\$\{[^}]+\}|\{[^}]+\}/g, '');
  var srcNums = (cleanSrc.match(/\d+/g) || []).length;
  var tgtNums = (cleanTgt.match(/\d+/g) || []).length;
  if (srcNums > 0 && tgtNums === 0) {
    reasons.push('缺失數字');
  } else if (Math.abs(srcNums - tgtNums) > 1) {
    reasons.push('數字數量差異大');
  }

  // 7. 強制檢查佔位符文字
  if (tgt.indexOf('[需要翻譯]') !== -1 || tgt.indexOf('[需要翻译]') !== -1) {
    reasons.push('包含預設佔位符 [需要翻譯]');
  }

  // 8. URL/長度暴增檢查 (疑似重複翻譯)
  // 如果原文是 URL (http 開頭) 或包含長連結，且譯文長度超過原文 1.5 倍，極有可能是重複貼上
  // 排除純文字變長的狀況 (通常 URL 結構不該變長)
  if (src.indexOf('http') !== -1 && tgt.length > src.length * 1.5) {
     reasons.push('長度異常 (疑似重複翻譯)');
  }
  
  return reasons;
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

// [新增] 規範化 Token：移除空白
function normalizeToken_(t) {
  return String(t || '').replace(/\s+/g, '');
}

// [新增] 判斷是否為有效的大括號變數
function isValidBraceVar_(t) {
  var inner = t.substring(1, t.length - 1).trim();
  // 變數通常不含空格，或者很短
  // 如果內部包含大量空格或很長，可能是普通文本
  if (inner.indexOf(' ') !== -1 && inner.length > 20) return false;
  return true;
}

// 移除舊的 isSafeToKeepSame_ 和 isNumberOrSymbol_ 以免混淆
// function isSafeToKeepSame_(s) { ... }
// function isNumberOrSymbol_(s) { ... }

// 移除舊的 isNumberOrSymbol_ 以免混淆


function checkBraceBalance_(src, tgt, open, close, reasons) {
  var srcOpen = src.split(open).length - 1;
  var srcClose = src.split(close).length - 1;
  var tgtOpen = tgt.split(open).length - 1;
  var tgtClose = tgt.split(close).length - 1;

  if (srcOpen === srcClose && tgtOpen !== tgtClose) {
    reasons.push('括號不對稱 ' + open + close);
  }
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
      _sliceLen: slice.length
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
                aiContent = '';
             }
          } else {
             aiContent = json.choices[0].message.content;
          }
          
          var parsedArr = parseJsonArrayResponse_(aiContent, req._sliceLen);
          
          for (var subI = 0; subI < parsedArr.length; subI++) {
            var p = parsedArr[subI];
            // 轉換為標準格式
            var finalObj = { valid: false, reason: "AI 格式錯誤" };
            
            // 如果是空字串 (Padding)，代表 AI 沒回傳這筆，標記為 Skip
            if (p === '') {
               finalObj = { valid: false, reason: "AI漏答 (Skipped)", _skipped: true };
            } else if (p && typeof p === 'object') {
                finalObj = p;
                if (finalObj.valid === undefined) finalObj.valid = false;
            } else if (p === true || (typeof p === 'string' && p.toLowerCase().includes('valid'))) {
                finalObj = { valid: true };
            }

            // 後處理：確保 corrected 經過標準化 (如保留特殊符號)
            if (!finalObj.valid && finalObj.corrected) {
               var item = slice[subI];
               // 簡單的保護處理，避免 AI 修復時把變數搞壞
               // 這裡直接信賴 AI，但可以加一層 stripTags_ 或類似處理
               finalObj.corrected = String(finalObj.corrected).trim();
            }

            results[req._startIndex + subI] = finalObj;
          }
        } catch (e) {
          Logger.log('Reverify JSON Parse Error: ' + e);
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

/* ===================== THE END ===================== */
