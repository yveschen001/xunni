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
    if (h && h !== 'key' && h !== 'zh-TW' && h !== 'zh-CN') activeTargetCount++;
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
      if (!headerCode || headerCode === 'key' || headerCode === 'zh-TW') continue;
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
      if (!headerCode || headerCode === 'key' || headerCode === 'zh-TW') continue;
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
    if (h && h !== 'key' && h !== 'en' && h !== 'zh-TW') activeTargetCount++;
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
      if (!headerCode || headerCode === 'key' || headerCode === srcCode) continue;

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

