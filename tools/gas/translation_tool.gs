/******************************************************
 * XunNi Smart Range Translator v5 (Parallel & Safe)
 * - 只翻「選取範圍」
 * - zh-TW → zh-CN 用 LanguageApp；其他語言用 OpenAI（pivot: en）
 * - 模型：gpt-4o-mini
 * - 🚀 平行處理：同一批次多語言同時請求，大幅提升速度
 * - ⏱️ 超時保護：5.5 分鐘自動暫停並提示進度
 * - 品牌字：XunNi 固定，不翻譯
 * - 「漂流瓶」功能：各語在地化詞彙固定
 * - 佔位符 / 變數 / emoji / URL 全面保護
 * - 高亮目前批次 + toast 進度
 * - 一鍵清除選區 HTML 標籤
 * - zh-TW 客服口吻潤飾（台灣用語）
 * - ✅ 全表質檢 & 選區質檢（不耗 Token）
 * - ⚙ 自動翻譯高亮（en→多語；無 en 則 zh-TW）
 * - 🧹 清除全表 QA 高亮與備註
 * - 一鍵流程：質檢→修復→清除
 ******************************************************/

/* ===================== 配置常數 ===================== */
var OPENAI_MODEL      = 'gpt-4o-mini';
var OPENAI_MAX_TOKENS = 4096;
var BATCH_SIZE        = 50;      // OpenAI 單次請求的行數 (保持 50 穩定)
var MAX_PARALLEL_REQS = 40;      // GAS UrlFetchApp 安全併發上限
var SLEEP_MS          = 200;
var WORKING_COLOR     = '#fff2cc';
var CLEAR_COLOR       = null;
var QA_COLOR          = '#ffd7d7';   // 質檢高亮（粉紅）
var QA_NOTE_PREFIX    = '[QA] ';

/* ===================== 語言顯示名稱 ===================== */
var LOCALE_PRETTY = {
  'zh-TW': 'Traditional Chinese (Taiwan)',
  'zh-CN': 'Simplified Chinese (China)',
  'en'   : 'English',
  'ja'   : 'Japanese',
  'ko'   : 'Korean',
  'th'   : 'Thai',
  'vi'   : 'Vietnamese',
  'id'   : 'Indonesian',
  'ms'   : 'Malay',
  'tl'   : 'Filipino',
  'es'   : 'Spanish',
  'pt'   : 'Portuguese',
  'fr'   : 'French',
  'de'   : 'German',
  'it'   : 'Italian',
  'ru'   : 'Russian',
  'ar'   : 'Arabic',
  'hi'   : 'Hindi',
  'bn'   : 'Bengali',
  'tr'   : 'Turkish',
  'pl'   : 'Polish',
  'uk'   : 'Ukrainian',
  'nl'   : 'Dutch',
  'sv'   : 'Swedish',
  'no'   : 'Norwegian',
  'da'   : 'Danish',
  'fi'   : 'Finnish',
  'cs'   : 'Czech',
  'el'   : 'Greek',
  'he'   : 'Hebrew',
  'fa'   : 'Persian',
  'ur'   : 'Urdu',
  'sw'   : 'Swahili',
  'ro'   : 'Romanian'
};

/* ========== 「漂流瓶」功能：各語固定術語 ========== */
var BOTTLE_TERM_MAP = {
  'zh-TW': '漂流瓶',
  'zh-CN': '漂流瓶',
  'en'   : 'message bottle',
  'ja'   : 'ボトルメール',
  'ko'   : '메시지 병',
  'th'   : 'ขวดข้อความ',
  'vi'   : 'chai thư',
  'id'   : 'botol pesan',
  'ms'   : 'botol mesej',
  'tl'   : 'bote ng mensahe',
  'es'   : 'botella de mensajes',
  'pt'   : 'garrafa de mensagem',
  'fr'   : 'bouteille à message',
  'de'   : 'Nachrichtenflasche',
  'it'   : 'bottiglia di messaggi',
  'ru'   : 'бутылка с сообщением',
  'ar'   : 'زجاجة رسائل',
  'hi'   : 'संदेश की बोतल',
  'bn'   : 'বার্তার বোতল',
  'tr'   : 'mesaj şişesi',
  'pl'   : 'butelka z wiadomością',
  'uk'   : 'пляшка з повідомленням',
  'nl'   : 'berichtfles',
  'sv'   : 'flaskpost',
  'no'   : 'flaskepost',
  'da'   : 'flaskepost',
  'fi'   : 'pulloposti',
  'cs'   : 'láhev se zprávou',
  'el'   : 'μπουκάλι μηνύματος',
  'he'   : 'בקבוק מסר',
  'fa'   : 'بطری پیام',
  'ur'   : 'پیغام کی بوتل',
  'sw'   : 'chupa ya ujumbe',
  'ro'   : 'sticlă cu mesaj'
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
    .addItem('🔍 掃描選區空白未翻譯', 'scanEmptyCellsInSelection')
    .addItem('🧹 清除選取範圍高亮', 'clearQaInSelection')
    .addSeparator()
    .addItem('🤖 AI 智能複核誤報（只查高亮格）', 'runAiReverifySelection')
    .addItem('🤖 AI 深度質檢（選取範圍 - 耗 Token）', 'runAiQualityScanSelection')
    .addItem('⚙ 自動翻譯高亮（選取範圍）', 'autoTranslateHighlightedSelection')
    .addItem('⚙ 自動翻譯高亮（全表）', 'autoTranslateHighlighted')
    .addItem('🧹 清除全表 QA 高亮', 'clearAllQaHighlights')
    .addSeparator()
    .addItem('一鍵：質檢→修復→清除', 'oneClickQAAndFix')
    .addToUi();
}

/* ===================== 工具：多重選區迭代器 ===================== */
function processRangeList_(processorFn) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getActiveSheet();
  var rangeList = sh.getActiveRangeList();
  
  if (!rangeList) {
    ss.toast('請先選取範圍', '⚠ 沒有選區', 5);
    return;
  }
  
  var ranges = rangeList.getRanges();
  if (ranges.length === 0) {
    ss.toast('請先選取範圍', '⚠ 沒有選區', 5);
    return;
  }

  // 預先檢查所有 Range 是否包含表頭
  for (var k = 0; k < ranges.length; k++) {
    if (ranges[k].getRow() === 1) {
      ss.toast('選區不能包含表頭行（第1行），請只選內容行', '提示', 5);
      return;
    }
  }

  // 取得表頭資訊 (共用)
  var lastCol = sh.getLastColumn();
  var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];

  for (var i = 0; i < ranges.length; i++) {
    var range = ranges[i];
    if (ranges.length > 1) {
      ss.toast('正在處理第 ' + (i + 1) + ' / ' + ranges.length + ' 個選區...', '多重選區', 300);
    }
    
    try {
      processorFn(sh, range, headers);
    } catch (e) {
      Logger.log('處理選區 ' + (i + 1) + ' 失敗: ' + e);
      ss.toast('選區 ' + (i + 1) + ' 發生錯誤: ' + e.message, '錯誤', 5);
    }
  }
  
  if (ranges.length > 1) {
    ss.toast('✅ 所有選區處理完成', '完成', 5);
  }
}

/* ===================== 主要流程：zh-TW → 多語（pivot: en, 平行處理） ===================== */
function runSmartTranslateSelection() {
  processRangeList_(runSmartTranslateCore_);
}

function runSmartTranslateCore_(sh, sel, headers) {
  var apiKey = getApiKey_();
  if (!apiKey) throw new Error('缺少 OPENAI_API_KEY');

  var colZhTw = getColIndexByHeader_(headers, 'zh-TW');
  if (colZhTw < 0) throw new Error('表頭必須包含 zh-TW');
  colZhTw += 1; // 1-based

  var startRow = sel.getRow();
  var startCol = sel.getColumn();
  var numRows  = sel.getNumRows();
  var numCols  = sel.getNumColumns();

  var totalRowsRemaining = numRows;
  var processedRows = 0;
  
  // ... (後續邏輯與原 runSmartTranslateSelection 相同，但變量來源改為參數) ...
  // 為了避免代碼重複過多，這裡直接將原函數內容搬移並適配
  
  // 計算實際需要調用 API 的目標欄位數量
  var activeTargetCount = 0;
  for (var cOff = 0; cOff < numCols; cOff++) {
    var h = String(headers[startCol + cOff - 1] || '').trim();
    if (h && h !== 'key' && h !== 'zh-TW' && h !== 'zh-CN') {
      activeTargetCount++;
    }
  }
  if (activeTargetCount < 1) activeTargetCount = 1;

  var concurrentBatches = Math.floor(MAX_PARALLEL_REQS / activeTargetCount);
  if (concurrentBatches < 1) concurrentBatches = 1;
  if (concurrentBatches > 5) concurrentBatches = 5;
  var dynamicChunkRows = concurrentBatches * BATCH_SIZE;

  var ss = SpreadsheetApp.getActiveSpreadsheet(); // 用於 toast

  while (totalRowsRemaining > 0) {
    var rowsThisChunk = Math.min(dynamicChunkRows, totalRowsRemaining);
    var chunkRowStart = startRow + processedRows;

    highlightRange_(sh, chunkRowStart, startCol, rowsThisChunk, numCols, WORKING_COLOR);
    ss.toast(
      '🚀 正在翻譯 ' + rowsThisChunk + ' 行 (並行優化)... (' +
      (processedRows + rowsThisChunk) + '/' + numRows + ')',
      '翻譯中', 120
    );

    var blockRange = sh.getRange(chunkRowStart, startCol, rowsThisChunk, numCols);
    var blockValues = blockRange.getValues();

    var zhTwVals = sh.getRange(chunkRowStart, colZhTw, rowsThisChunk, 1)
      .getValues()
      .map(function (r) { return String(r[0] || ''); });

    var pivotEnVals = null;
    var needsPivot = false;

    for (var cOff = 0; cOff < numCols; cOff++) {
      var sheetColIndex = startCol + cOff;
      var headerCode = String(headers[sheetColIndex - 1] || '').trim();
      if (!headerCode || headerCode === 'key' || headerCode === 'zh-TW') continue;
      if (headerCode !== 'zh-CN' && headerCode !== 'en') {
        needsPivot = true;
      }
    }

    if (needsPivot) {
      var enInSelectionIndex = -1;
      for (cOff = 0; cOff < numCols; cOff++) {
        var h = String(headers[startCol + cOff - 1] || '').trim();
        if (h === 'en') { enInSelectionIndex = cOff; break; }
      }

      if (enInSelectionIndex >= 0) {
        pivotEnVals = openAiBatchTranslate_(zhTwVals, 'zh-TW', 'en');
        for (var r = 0; r < rowsThisChunk; r++) {
          var out = processTranslationResult_(zhTwVals[r], pivotEnVals[r], 'en');
          blockValues[r][enInSelectionIndex] = out;
          pivotEnVals[r] = out;
        }
      } else {
        pivotEnVals = openAiBatchTranslate_(zhTwVals, 'zh-TW', 'en');
      }
    }

    var openAiTasks = []; 

    for (cOff = 0; cOff < numCols; cOff++) {
      var sheetColIndex = startCol + cOff;
      var headerCode = String(headers[sheetColIndex - 1] || '').trim();
      if (!headerCode || headerCode === 'key' || headerCode === 'zh-TW') continue;

      if (headerCode === 'en' && pivotEnVals) continue; 

      if (headerCode === 'zh-CN') {
        for (var r = 0; r < rowsThisChunk; r++) {
          var tw = zhTwVals[r];
          if (!tw) continue;
          try {
            var cn = LanguageApp.translate(tw, 'zh-TW', 'zh-CN');
            blockValues[r][cOff] = processTranslationResult_(tw, cn, 'zh-CN');
          } catch (e) { /* ignore */ }
        }
      } else {
        var srcDataFull = (headerCode === 'en') ? zhTwVals : (pivotEnVals || zhTwVals);
        var srcLang = (headerCode === 'en') ? 'zh-TW' : 'en';

        for (var offset = 0; offset < rowsThisChunk; offset += BATCH_SIZE) {
           var sliceLen = Math.min(BATCH_SIZE, rowsThisChunk - offset);
           var sliceData = srcDataFull.slice(offset, offset + sliceLen);
           var origZhTwSlice = zhTwVals.slice(offset, offset + sliceLen);

           var sysMsg  = buildSystemPrompt_(srcLang, headerCode);
           var userMsg = buildUserPrompt_(sliceData, srcLang, headerCode);
           var payload = {
             model: OPENAI_MODEL,
             messages: [
               { role: 'system', content: sysMsg },
               { role: 'user',   content: userMsg }
             ],
             max_completion_tokens: OPENAI_MAX_TOKENS
           };
           
           openAiTasks.push({
             payload: payload,
             colOffset: cOff,
             targetLang: headerCode,
             sourceVals: sliceData,
             origZhTwVals: origZhTwSlice,
             rowOffset: offset 
           });
        }
      }
    }

    if (openAiTasks.length > 0) {
      var requests = openAiTasks.map(function(task) {
        return {
          url: 'https://api.openai.com/v1/chat/completions',
          method: 'post',
          contentType: 'application/json',
          headers: { 'Authorization': 'Bearer ' + apiKey },
          muteHttpExceptions: true,
          payload: JSON.stringify(task.payload)
        };
      });

      try {
        var responses = UrlFetchApp.fetchAll(requests);
        
        for (var i = 0; i < responses.length; i++) {
          var task = openAiTasks[i];
          var res = responses[i];
          var code = res.getResponseCode();
          var text = res.getContentText();
          
          if (code >= 200 && code < 300) {
            try {
              var json = JSON.parse(text);
              var content = json.choices[0].message.content;
              var arr = parseJsonArrayResponse_(content, task.sourceVals.length);
              
              for (var subR = 0; subR < arr.length; subR++) {
                var actualR = task.rowOffset + subR;
                var src = task.sourceVals[subR]; 
                var rawTgt = arr[subR] || '';
                var out = processTranslationResult_(src, rawTgt, task.targetLang, task.origZhTwVals[subR]);
                blockValues[actualR][task.colOffset] = out;
              }
            } catch (e) {
              Logger.log('JSON Parse Error for ' + task.targetLang + ': ' + e);
            }
          } else {
            Logger.log('API Error for ' + task.targetLang + ': ' + code + ' ' + text);
          }
        }
      } catch (e) {
        Logger.log('FetchAll Error: ' + e);
      }
    }

    blockRange.setValues(blockValues);
    highlightRange_(sh, chunkRowStart, startCol, rowsThisChunk, numCols, CLEAR_COLOR);
    SpreadsheetApp.flush();

    processedRows      += rowsThisChunk;
    totalRowsRemaining -= rowsThisChunk;
    Utilities.sleep(SLEEP_MS);
  }
  ss.toast('✅ 此選區翻譯完成：' + processedRows + ' 行', '完成', 5);
}

/* ===================== 英文 → 多語（來源自動：en 優先，平行處理） ===================== */
/* ===================== 英文 → 多語（來源自動：en 優先，平行處理） ===================== */
function runTranslateFromEnSelection() {
  processRangeList_(runTranslateFromEnCore_);
}

function runTranslateFromEnCore_(sh, sel, headers) {
  var apiKey = getApiKey_();
  if (!apiKey) throw new Error('缺少 OPENAI_API_KEY');

  var colEn = getColIndexByHeader_(headers, 'en');
  var colTw = getColIndexByHeader_(headers, 'zh-TW');
  if (colEn < 0 && colTw < 0) throw new Error('表頭至少要有 en 或 zh-TW');
  if (colEn >= 0) colEn += 1;
  if (colTw >= 0) colTw += 1;

  var startRow = sel.getRow();
  var startCol = sel.getColumn();
  var numRows  = sel.getNumRows();
  var numCols  = sel.getNumColumns();

  var totalRowsRemaining = numRows;
  var processedRows = 0;

  // 計算實際需要調用 API 的目標欄位數量
  var activeTargetCount = 0;
  for (var cOff = 0; cOff < numCols; cOff++) {
    var headerCode = String(headers[startCol + cOff - 1] || '').trim();
    var srcCodeForCheck = colEn ? 'en' : 'zh-TW';
    if (headerCode && headerCode !== 'key' && 
        headerCode !== srcCodeForCheck && 
        !(headerCode === 'zh-TW' && srcCodeForCheck === 'zh-TW')) {
        activeTargetCount++;
    }
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
    ss.toast(
      '🚀 正在平行翻譯 (Src: EN/TW) ' + rowsThisChunk + ' 行… (' + (processedRows + rowsThisChunk) + '/' + numRows + ')',
      '翻譯中', 120
    );

    var srcRange, srcCode;
    if (colEn) {
      srcRange = sh.getRange(chunkRowStart, colEn, rowsThisChunk, 1);
      srcCode  = 'en';
    } else {
      srcRange = sh.getRange(chunkRowStart, colTw, rowsThisChunk, 1);
      srcCode  = 'zh-TW';
    }
    var srcVals = srcRange.getValues().map(function (r) { return String(r[0] || ''); });

    var blockRange  = sh.getRange(chunkRowStart, startCol, rowsThisChunk, numCols);
    var blockValues = blockRange.getValues();

    var openAiTasks = [];

    for (var cOff = 0; cOff < numCols; cOff++) {
      var sheetColIndex = startCol + cOff;
      var headerCode = String(headers[sheetColIndex - 1] || '').trim();
      if (!headerCode || headerCode === 'key' ||
          headerCode === srcCode || (headerCode === 'zh-TW' && srcCode === 'zh-TW')) {
        continue;
      }

      for (var offset = 0; offset < rowsThisChunk; offset += BATCH_SIZE) {
         var sliceLen = Math.min(BATCH_SIZE, rowsThisChunk - offset);
         var sliceData = srcVals.slice(offset, offset + sliceLen);

         var sysMsg  = buildSystemPrompt_(srcCode, headerCode);
         var userMsg = buildUserPrompt_(sliceData, srcCode, headerCode);
         var payload = {
           model: OPENAI_MODEL,
           messages: [
             { role: 'system', content: sysMsg },
             { role: 'user',   content: userMsg }
           ],
           max_completion_tokens: OPENAI_MAX_TOKENS
         };

         openAiTasks.push({
           payload: payload,
           colOffset: cOff,
           targetLang: headerCode,
           sourceVals: sliceData,
           rowOffset: offset
         });
      }
    }

    if (openAiTasks.length > 0) {
      var requests = openAiTasks.map(function(task) {
        return {
          url: 'https://api.openai.com/v1/chat/completions',
          method: 'post',
          contentType: 'application/json',
          headers: { 'Authorization': 'Bearer ' + apiKey },
          muteHttpExceptions: true,
          payload: JSON.stringify(task.payload)
        };
      });

      try {
        var responses = UrlFetchApp.fetchAll(requests);
        for (var i = 0; i < responses.length; i++) {
          var task = openAiTasks[i];
          var res = responses[i];
          var code = res.getResponseCode();
          
          if (code >= 200 && code < 300) {
            try {
              var json = JSON.parse(res.getContentText());
              var arr = parseJsonArrayResponse_(json.choices[0].message.content, task.sourceVals.length);
              
              for (var subR = 0; subR < arr.length; subR++) {
                var actualR = task.rowOffset + subR;
                var src = task.sourceVals[subR];
                var out = processTranslationResult_(src, arr[subR], task.targetLang);
                blockValues[actualR][task.colOffset] = out;
              }
            } catch (e) {
              Logger.log('JSON Parse Error: ' + e);
            }
          }
        }
      } catch (e) {
        Logger.log('FetchAll Error: ' + e);
      }
    }

    blockRange.setValues(blockValues);
    highlightRange_(sh, chunkRowStart, startCol, rowsThisChunk, numCols, CLEAR_COLOR);
    SpreadsheetApp.flush();

    processedRows      += rowsThisChunk;
    totalRowsRemaining -= rowsThisChunk;
    Utilities.sleep(SLEEP_MS);
  }

  ss.toast('✅ 此選區翻譯完成：' + processedRows + ' 行', '完成', 5);
}

/* ===================== 後處理統一封裝 ===================== */
function processTranslationResult_(src, tgt, langCode, origZhTw) {
  var out = String(tgt || '');
  out = stripTags_(out);
  out = ensureKeepProtectedTokens_(src, out);
  // 如果有提供原始 zh-TW (例如從 pivot EN 翻過來的)，用 zh-TW 判斷術語比較準
  var termSrc = origZhTw || src;
  out = enforceBottleTerminologyOnPair_(termSrc, out, langCode);
  return out.trim();
}

/* ===================== OpenAI 批次封裝 (單次調用用) ===================== */
function openAiBatchTranslate_(srcArr, sourceCode, targetCode) {
  if (sourceCode === targetCode) {
    return srcArr.map(function (s) { return String(s || ''); });
  }

  var out = new Array(srcArr.length);
  for (var i = 0; i < out.length; i++) out[i] = '';

  var cursor = 0;
  while (cursor < srcArr.length) {
    var slice = srcArr.slice(cursor, cursor + BATCH_SIZE);
    var allEmpty = slice.every(function (t) { return String(t || '').trim() === ''; });
    if (allEmpty) {
      cursor += BATCH_SIZE;
      continue;
    }

    var attempt = translateChunkOnce_(slice, sourceCode, targetCode);
    if (attempt.ok && attempt.items.length === slice.length) {
      for (var i = 0; i < slice.length; i++) out[cursor + i] = attempt.items[i] || '';
      cursor += BATCH_SIZE;
      Utilities.sleep(SLEEP_MS);
      continue;
    }
    
    // 簡單重試邏輯 (這裡簡化，不拆分，避免複雜)
    cursor += BATCH_SIZE;
  }
  return out;
}

function translateChunkOnce_(slice, sourceCode, targetCode) {
  var sysMsg  = buildSystemPrompt_(sourceCode, targetCode);
  var userMsg = buildUserPrompt_(slice, sourceCode, targetCode);
  var rawResp = callOpenAIChat_(sysMsg, userMsg);
  var arr     = parseJsonArrayResponse_(rawResp, slice.length);
  var nonEmpty = arr.some(function (x) { return String(x || '').trim() !== ''; });
  var ok = (arr.length === slice.length) && nonEmpty;
  return { ok: ok, items: arr };
}

function callOpenAIChat_(systemText, userText) {
  var apiKey = getApiKey_();
  var url = 'https://api.openai.com/v1/chat/completions';
  var payload = {
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: systemText },
      { role: 'user',   content: userText }
    ],
    max_completion_tokens: OPENAI_MAX_TOKENS
  };
  var params = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + apiKey },
    muteHttpExceptions: true,
    payload: JSON.stringify(payload)
  };

  var res  = UrlFetchApp.fetch(url, params);
  var code = res.getResponseCode();
  var text = res.getContentText();
  if (code < 200 || code >= 300) {
    Logger.log('OpenAI HTTP ' + code + ' body: ' + text.slice(0, 400));
    return '';
  }
  try {
    var data = JSON.parse(text);
    return (data.choices &&
            data.choices[0] &&
            data.choices[0].message &&
            data.choices[0].message.content) || '';
  } catch (e) {
    Logger.log('OpenAI JSON parse fail: ' + e);
    return '';
  }
}

function parseJsonArrayResponse_(rawContent, expectLen) {
  var s = String(rawContent || '').trim();
  
  // [增強] 嘗試修復被截斷的 JSON (OpenAI 有時會因為 max_tokens 而截斷)
  if (s.lastIndexOf('}') === -1 && s.lastIndexOf(']') === -1) {
     // 如果完全沒有結尾符號，嘗試硬補
     s += '"]]}'; 
  } else if (s.lastIndexOf('}') < s.lastIndexOf('{')) {
     s += ']}';
  }

  var start = s.indexOf('{');
  var end   = s.lastIndexOf('}');
  if (start >= 0 && end > start) {
    s = s.substring(start, end + 1);
  }

  var obj = null;
  try {
    obj = JSON.parse(s);
  } catch (e) {
    try {
      // 二次嘗試：修復常見的結尾逗號或截斷問題
      s = s.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
      // 嘗試補全截斷的陣列
      if (s.slice(-1) !== '}') s += ']}';
      obj = JSON.parse(s);
    } catch (e2) {
      obj = null;
      Logger.log('JSON Parse Failed: ' + e2 + '\nContent: ' + s.slice(0, 100) + '...');
    }
  }

  // 確保 items 存在
  var items = (obj && Array.isArray(obj.items)) ? obj.items : [];

  // [修正] 如果回傳數量少於預期 (漏翻)，補空字串，確保後續索引對齊
  if (items.length < expectLen) {
    Logger.log('Warning: AI returned ' + items.length + ' items, expected ' + expectLen);
    while (items.length < expectLen) {
      items.push(''); // 補空
    }
  }
  
  // 如果回傳數量多於預期 (極少見)，截斷
  if (items.length > expectLen) {
     items = items.slice(0, expectLen);
  }

  var out = [];
  var i;
  for (i = 0; i < expectLen; i++) {
    out.push(typeof items[i] === 'string' ? items[i] : '');
  }
  return out;
}

/* ===================== Prompt 生成 ===================== */
function buildSystemPrompt_(sourceCode, targetCode) {
  var srcPretty   = LOCALE_PRETTY[sourceCode] || sourceCode;
  var tgtPretty   = LOCALE_PRETTY[targetCode] || targetCode;
  var bottleTerm  = getBottleTerm_(targetCode);

  var sys =
    "You are a localization engine for the XunNi drifting-bottle social app.\n" +
    "Translate short UI and customer-support strings from " + srcPretty +
    " to " + tgtPretty + ".\n" +
    "Tone: professional, friendly, reassuring; concise like real product UI.\n" +
    "Keep meaning consistent. No explanations.\n" +
    "BRAND: Keep the product name 'XunNi' exactly as written (case-sensitive), never translate it.\n" +
    "TICKERS/CHAINS: Keep SOL, TON, TRON, BEP, ETH, BTC, USDT, USDC, BNB, XRP, DOGE, SHIB, meme unchanged.\n" +
    "PLACEHOLDERS: Keep placeholders exactly as-is, including {{name}}, {name}, {0}, ${name}, %s, %d, %1$s, %02d, $VAR, :emoji:, <provider_id>, and similar.\n" +
    "URLs, emails, @mentions, IDs, inline code, HTML entities must be preserved.\n" +
    "SPECIAL RULE FOR URLs: If the text is a URL (starts with http/https), DO NOT TRANSLATE the URL structure itself. Only translate the value of the 'text=' or 'body=' query parameter if present. Ensure the output contains the URL EXACTLY ONCE. Do NOT duplicate the content.\n" +
    (bottleTerm
      ? "FEATURE TERMINOLOGY: When the drifting-bottle feature (漂流瓶 / bottle message) appears, render it as \"" +
        bottleTerm + "\" in the target language.\n"
      : "") +
    "OUTPUT FORMAT: Return ONLY strict JSON: {\"items\":[\"...\"]}. No HTML, Markdown, or code fences.";

  return sys;
}

function buildUserPrompt_(slice, sourceCode, targetCode) {
  return (
    "Translate each item from " + sourceCode + " to " + targetCode +
    " following the system rules.\n" +
    "Return JSON only.\n" +
    "Input array:\n" + JSON.stringify(slice)
  );
}

/* ===================== HTML 標籤處理（保留 <provider_id> 類型佔位符） ===================== */
function stripTags_(s) {
  if (s == null) return '';
  s = String(s);

  // 1) 暫存像 <provider_id> 或 <id> 這種變數佔位符 (包含 snake_case 或單字)
  var placeholderStore = {};
  var phIndex = 0;
  // 修改：支援無底線的單詞變數，如 <id>, <priority>
  var phRe = /<[a-zA-Z0-9_]+>/g;

  s = s.replace(phRe, function (m) {
    var key = '%%ANG' + (phIndex++) + '%%';
    placeholderStore[key] = m;
    return key;
  });

  // 2) 移除 ```code``` 區塊
  s = s.replace(/```[\s\S]*?```/g, '');

  // 3) 清掉一般 HTML 標籤
  s = s.replace(/<[^>]+>/g, '');

  // 4) 還原佔位符
  s = s.replace(/%%ANG\d+%%/g, function (m) {
    return placeholderStore[m] || '';
  });

  // 5) 收斂空白
  s = s.replace(/\u00A0/g, ' ');
  s = s.replace(/[ \t\r\f\v]+/g, ' ').trim();
  return s;
}

/* ===================== 清理選區 HTML 標籤 ===================== */
function cleanSelectionHtmlWrappers() {
  processRangeList_(cleanSelectionHtmlWrappersCore_);
}

function cleanSelectionHtmlWrappersCore_(sh, rng, headers) {
  highlightRange_(sh, rng.getRow(), rng.getColumn(), rng.getNumRows(), rng.getNumColumns(), WORKING_COLOR);

  var vals = rng.getValues();
  var r, c;
  for (r = 0; r < vals.length; r++) {
    for (c = 0; c < vals[0].length; c++) {
      if (typeof vals[r][c] === 'string') {
        vals[r][c] = stripTags_(vals[r][c]);
      }
    }
  }

  rng.setValues(vals);
  highlightRange_(sh, rng.getRow(), rng.getColumn(), rng.getNumRows(), rng.getNumColumns(), CLEAR_COLOR);
  SpreadsheetApp.flush();
  sh.getParent().toast('✅ 已清理所選範圍中的 HTML 標籤', '完成', 3);
}

/* ===================== zh-TW 客服口吻潤飾 ===================== */
function polishZhTwSelection() {
  processRangeList_(polishZhTwCore_);
}

function polishZhTwCore_(sh, sel, headers) {
  var apiKey = getApiKey_();
  if (!apiKey) throw new Error('缺少 OPENAI_API_KEY');

  var colZhTw = getColIndexByHeader_(headers, 'zh-TW');
  if (colZhTw < 0) throw new Error('表頭必須包含 zh-TW');
  colZhTw += 1;

  var startRow = sel.getRow();
  var startCol = sel.getColumn();
  var numRows  = sel.getNumRows();
  var numCols  = sel.getNumColumns();

  if (!(colZhTw >= startCol && colZhTw < startCol + numCols)) {
    return; // 沒選到 zh-TW 欄位就跳過
  }

  var totalRowsRemaining = numRows;
  var processedRows = 0;
  var ss = sh.getParent();

  while (totalRowsRemaining > 0) {
    var rowsThisChunk = Math.min(CHUNK_ROWS, totalRowsRemaining);
    var chunkRowStart = startRow + processedRows;

    highlightRange_(sh, chunkRowStart, startCol, rowsThisChunk, numCols, WORKING_COLOR);
    ss.toast(
      '正在優化 zh-TW：' + rowsThisChunk + ' 行… (' +
      (processedRows + rowsThisChunk) + '/' + numRows + ')',
      '優化中', 5
    );

    var zhTwRange = sh.getRange(chunkRowStart, colZhTw, rowsThisChunk, 1);
    var zhTwVals  = zhTwRange.getValues()
      .map(function (r) { return String(r[0] || ''); });

    var polished = openAiBatchPolishZhTw_(zhTwVals);

    var out = [];
    var i;
    for (i = 0; i < rowsThisChunk; i++) {
      var newText = String(polished[i] || '').trim();
      out.push([newText || zhTwVals[i]]);
    }

    zhTwRange.setValues(out);
    highlightRange_(sh, chunkRowStart, startCol, rowsThisChunk, numCols, CLEAR_COLOR);
    SpreadsheetApp.flush();

    processedRows      += rowsThisChunk;
    totalRowsRemaining -= rowsThisChunk;
    Utilities.sleep(SLEEP_MS);
  }
  ss.toast('✅ zh-TW 優化完成：' + numRows + ' 行', '完成', 3);
}

function openAiBatchPolishZhTw_(srcArr) {
  var out = new Array(srcArr.length);
  var i;
  for (i = 0; i < out.length; i++) out[i] = '';

  var cursor = 0;
  while (cursor < srcArr.length) {
    var slice = srcArr.slice(cursor, cursor + BATCH_SIZE);
    var allEmpty = slice.every(function (t) { return String(t || '').trim() === ''; });
    if (allEmpty) {
      cursor += BATCH_SIZE;
      continue;
    }

    var sysMsg  = buildSystemPromptPolishZhTw_();
    var userMsg = buildUserPromptPolishZhTw_(slice);
    var rawResp = callOpenAIChat_(sysMsg, userMsg);
    var arr     = parseJsonArrayResponse_(rawResp, slice.length);

    var j;
    for (j = 0; j < slice.length; j++) {
      var v = typeof arr[j] === 'string' ? arr[j] : '';
      v = ensureKeepProtectedTokens_(slice[j], v);
      v = collapseWhitespaceKeepLines_(v);
      out[cursor + j] = v;
    }

    cursor += BATCH_SIZE;
    Utilities.sleep(SLEEP_MS);
  }
  return out;
}

function buildSystemPromptPolishZhTw_() {
  return (
    "You are a professional Traditional Chinese (Taiwan) copy editor for the XunNi drifting-bottle app.\n" +
    "Polish zh-TW text to natural Taiwan wording, remove redundancy, clarify logic; do NOT over-shorten.\n" +
    "Tone: friendly and courteous like a female CS rep, addressing the user with「您」.\n" +
    "Taiwan word choices: 帳號 / 連結 / 下載 / 應用程式 / 客服專員 / 提領 / 匯出 / 餘額 / 加值 / 綁定 / 取消綁定。\n" +
    "Keep line breaks.\n" +
    "STRICTLY preserve brand 'XunNi', tickers (SOL, TON, TRON, BEP, ETH, BTC, USDT, USDC, BNB, XRP, DOGE, SHIB, meme), placeholders {{x}}, {x}, ${x}, %s, %d, %1$s, %02d, $VAR, :emoji:, <provider_id>, URLs, emails, IDs, @mentions, inline code, and HTML entities.\n" +
    "Return only JSON: {\"items\":[...]}."
  );
}

function buildUserPromptPolishZhTw_(slice) {
  return "Polish each item (zh-TW→zh-TW). Keep meaning & placeholders. Return JSON only. Input:\n" +
    JSON.stringify(slice);
}

/* ===================== 佔位符保護 + 空白收斂 ===================== */
function ensureKeepProtectedTokens_(src, out) {
  src = String(src || '');
  out = String(out || '');

  var patterns = [
    /\{\{[^}]+\}\}/g,                    // {{name}}
    /\{[^{][^}]*\}/g,                    // {name} / {0}
    /%(\d+\$)?[sdif]/g,                  // %s, %d, %1$s, %02d
    /\$\{[^}]+\}/g,                      // ${var}
    /\$[A-Z_][A-Z0-9_]*/g,               // $VAR
    /:[a-z0-9_+-]+:/gi,                  // :emoji:
    /<[a-zA-Z0-9_]+>/g                   // <provider_id>, <id> 佔位符
  ];

  var extras = [
    /\bhttps?:\/\/[^\s)]+/gi,            // URL
    /\bwww\.[^\s)]+/gi,
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, // email
    /@[A-Za-z0-9_.-]+/g,                 // @mention
    /`[^`]+`/g,                          // `inline code`
    /&[A-Za-z0-9#]+;/g                   // entities
  ];

  var tokens = [];

  function collect(arr) {
    var i, m, re;
    for (i = 0; i < arr.length; i++) {
      re = arr[i];
      re.lastIndex = 0;
      while ((m = re.exec(src)) !== null) {
        var token = m[0];
        // 避免把整段超長程式碼當作一個 token 補回去
        if ((token.charAt(0) === '{' || token.indexOf('${') === 0) &&
            token.length > 80) {
          continue;
        }

        // [FIX Enhanced] 防止重複添加：
        // 檢查是否為「複雜邏輯變數」或「可翻譯內容」
        // 如果 token 以 $ 或 { 開頭，且包含 ? (三元), = (賦值/比較), ' " (字串), 或中文
        // 則視為包含邏輯或可翻譯內容，翻譯後可能會變，因此不強制保留原始 token
        if (token.charAt(0) === '$' || token.charAt(0) === '{') {
           if (/[\?='"\u4e00-\u9fa5]/.test(token)) {
             continue;
           }
        }

        tokens.push(token);
      }
    }
  }

  collect(patterns);
  collect(extras);

  var seen = Object.create(null);
  var uniq = [];
  var i;
  for (i = 0; i < tokens.length; i++) {
    var t = tokens[i];
    if (!seen[t]) {
      seen[t] = true;
      uniq.push(t);
    }
  }

  for (i = 0; i < uniq.length; i++) {
    var tok = uniq[i];
    if (tok && out.indexOf(tok) === -1) {
      out += (out ? ' ' : '') + tok;
    }
  }

  return out;
}

function collapseWhitespaceKeepLines_(s) {
  if (s == null) return '';
  s = String(s);
  var parts = s.split('\n');
  var i;
  for (i = 0; i < parts.length; i++) {
    parts[i] = parts[i]
      .replace(/\u00A0/g, ' ')
      .replace(/[ \t\r\f\v]+/g, ' ')
      .trim();
  }
  s = parts.join('\n');
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

/* ===================== 漂流瓶術語：僅在源含意時落地 ===================== */
function enforceBottleTerminologyOnPair_(srcText, translated, targetCode) {
  try {
    var src = String(srcText || '');
    var out = String(translated || '');
    var term = getBottleTerm_(targetCode);
    if (!term) return out;

    var hasConcept = /(漂流瓶|drifting\s*bottle|message\s*bottle|bottle\s*message)/i.test(src);
    if (!hasConcept) return out;

    var lowerOut = out.toLowerCase();
    var lowerTerm = term.toLowerCase();
    if (lowerOut.indexOf(lowerTerm) >= 0) return out;

    out = out
      .replace(/drifting\s*bottle/gi, term)
      .replace(/message\s*bottle/gi, term)
      .replace(/bottle\s*message/gi, term)
      .replace(/漂流瓶/g, term);

    return out;
  } catch (e) {
    return translated;
  }
}

// [補回遺失的工具函數]
function getApiKey_() {
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty('OPENAI_API_KEY');
  if (!key) {
    // 如果沒有設置，嘗試從用戶屬性獲取
    key = PropertiesService.getUserProperties().getProperty('OPENAI_API_KEY');
  }
  if (!key) {
    // 如果還是沒有，提示用戶
    var ui = SpreadsheetApp.getUi();
    var response = ui.prompt('請輸入 OpenAI API Key', '首次使用需要設置 API Key：', ui.ButtonSet.OK_CANCEL);
    if (response.getSelectedButton() == ui.Button.OK) {
      key = response.getResponseText().trim();
      props.setProperty('OPENAI_API_KEY', key);
    }
  }
  return key;
}

// [補回遺失的工具函數]
function highlightRange_(sh, row, col, numRows, numCols, color) {
  try {
    sh.getRange(row, col, numRows, numCols).setBackground(color);
  } catch (e) {
    // 忽略錯誤 (例如範圍無效)
  }
}

function getColIndexByHeader_(headers, name) {
  var n = String(name || '').toLowerCase().trim();
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i] || '').toLowerCase().trim();
    if (h === n) {
      return i;
    }
  }
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

  // 判斷來源特質：是否為「純變數/代碼/符號」
  var isSourceCodeLike = isPureVariableOrNumber_(src);

  // === 檢查邏輯分流 ===

  // 情況 A：來源是代碼/變數 (e.g., "${taskName}", "123", "-->")
  if (isSourceCodeLike) {
    // 目標應該要跟來源一樣 (允許空白差異)
    if (src.trim() !== tgt.trim()) {
      // 除非是某些特殊符號轉換，否則通常這是不對的
      // 但為了避免誤報 (例如全形半形符號)，這裡我們主要檢查「變數是否完整」
      // 變數完整性檢查在下方第4點會涵蓋，這裡暫不強制報錯，
      // 除非內容完全變成了另一種東西
    }
  } 
  // 情況 B：來源是文字 (e.g., "Hello World", "Task: ${name}")
  else {
    // 1. 未翻譯檢查 (Source Leak) - 最常見錯誤
    // 如果內容跟原文完全一樣，且長度足夠，幾乎肯定是未翻譯
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
    /<[a-zA-Z0-9_]+>/g,                  // <provider_id>
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

// [修正] 嚴格版：只有「純」變數/數字/符號才允許不翻譯
// 混合了文字的 (例如 "Task: ${name}") 必須翻譯，不能保持原樣
function isPureVariableOrNumber_(s) {
  s = String(s || '').trim();
  // 1. 純數字/符號 (e.g. "123", "-->", "...")
  if (/^[\d\s\p{P}\p{S}]+$/u.test(s)) return true;
  
  // 2. 純變數 (e.g. "${taskName}", "{{user}}", "$VAR", "%s")
  // 不允許混合其他文字
  if (/^(\$\{[^}]+\}|\{\{[^}]+\}|%[\d\.]*[sdif]|\$[A-Z_][A-Z0-9_]*|<[a-zA-Z0-9_]+>)$/.test(s)) return true;
  
  // 3. 允許「純 Emoji」或「Emoji + 變數」 (e.g. "✨ ${taskName}")
  // 移除變數後，只剩下 Emoji 和空白/標點
  var stripped = s
    .replace(/\$\{[^}]+\}/g, '')
    .replace(/\{\{[^}]+\}/g, '')
    .replace(/%[\d\.]*[sdif]/g, '')
    .replace(/\$[A-Z_][A-Z0-9_]*/g, '')
    .replace(/<[a-zA-Z0-9_]+>/g, '');
    
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
      if (!header || header === 'key' || header === 'en' || header === 'zh-TW' || header === 'zh-CN') continue;

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

  clearQaInRange_(sel);

  var startRow = sel.getRow();
  var startCol = sel.getColumn();
  var numRows  = sel.getNumRows();
  var numCols  = sel.getNumColumns();

  var rng     = sel;
  var values  = rng.getValues();
  var notes   = rng.getNotes();
  var bgs     = rng.getBackgrounds();

  var enColVals = colEN
    ? sh.getRange(startRow, colEN, numRows, 1).getValues()
    : [];
  var twColVals = colTW
    ? sh.getRange(startRow, colTW, numRows, 1).getValues()
    : [];

  var r, c;
  var errorCount = 0;
  var firstErrorReason = '';

  for (r = 0; r < numRows; r++) {
    var en = colEN ? String(enColVals[r] ? enColVals[r][0] : '') : '';
    var tw = colTW ? String(twColVals[r] ? twColVals[r][0] : '') : '';

    for (var c = 0; c < numCols; c++) {
      var sheetColIndex = startCol + c;
      var header = String(headers[sheetColIndex - 1] || '').trim();
      
      // 跳過 key 和 zh-TW (zh-TW 是最終源頭，不需自檢)
      if (!header || header === 'key' || header === 'zh-TW') continue;

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
        errorCount++;
        
        if (!firstErrorReason) {
          firstErrorReason = msg;
        }
      }
    }
  }

  rng.setBackgrounds(bgs);
  rng.setNotes(notes);
  
  if (errorCount > 0) {
    sh.getParent().toast('此選區發現 ' + errorCount + ' 個問題。', '質檢結果', 5);
  }
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

  var rng     = sel;
  var values  = rng.getValues();
  var notes   = rng.getNotes();
  var bgs     = rng.getBackgrounds();

  var enColVals = colEN ? sh.getRange(startRow, colEN, numRows, 1).getValues() : [];
  var twColVals = colTW ? sh.getRange(startRow, colTW, numRows, 1).getValues() : [];

  var count = 0;
  for (var r = 0; r < numRows; r++) {
    var en = colEN ? String(enColVals[r] ? enColVals[r][0] : '') : '';
    var tw = colTW ? String(twColVals[r] ? twColVals[r][0] : '') : '';
    // 如果連原文都沒有，這行應該是廢棄或空白行，跳過
    if (!en && !tw) continue;

    for (var c = 0; c < numCols; c++) {
      var sheetColIndex = startCol + c;
      var header = String(headers[sheetColIndex - 1] || '').trim();
      
      // 跳過 key, en, zh-TW, zh-CN (這些通常是源頭，不視為漏翻，或者由其他邏輯處理)
      // 如果您希望連 en/zh-CN 空白也要標記，可以移除這裡的判斷
      if (!header || header === 'key' || header === 'zh-TW' || header === 'en' || header === 'zh-CN') continue;

      var txt = String(values[r][c] || '').trim();
      
      if (!txt) {
        bgs[r][c]   = QA_COLOR;
        notes[r][c] = QA_NOTE_PREFIX + '⚠️ 缺翻譯 (空白)';
        count++;
      }
    }
  }

  rng.setBackgrounds(bgs);
  rng.setNotes(notes);
  
  sh.getParent().toast('掃描完成，發現 ' + count + ' 個空白未翻譯格子。', '掃描結果', 5);
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
        if (!header || header === 'key' || header === 'en' || header === 'zh-TW' || header === 'zh-CN') continue;

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

  var rangeChunk = sel;
  var values     = rangeChunk.getValues();
  var bgs        = rangeChunk.getBackgrounds();
  var notes      = rangeChunk.getNotes();

  // 1. 收集所有「粉紅高亮」的格子
  var itemsToCheck = [];
  var itemIndices  = [];

  // 為了獲取源文，我們需要整行的數據，或者預先讀取 EN/TW 欄
  // 這裡簡單起見，直接讀取需要的欄位
  var enColVals = colEN ? sh.getRange(startRow, colEN, numRows, 1).getValues() : [];
  var twColVals = colTW ? sh.getRange(startRow, colTW, numRows, 1).getValues() : [];

  var r, c;
  for (r = 0; r < numRows; r++) {
    for (c = 0; c < numCols; c++) {
      // 只檢查被標記為 QA_COLOR 的格子
      if (bgs[r][c] === QA_COLOR) {
        var sheetColIndex = startCol + c;
        var header = String(headers[sheetColIndex - 1] || '').trim();
        if (!header || header === 'key') continue;

        var tgt = String(values[r][c] || '');
        var en  = colEN ? String(enColVals[r][0] || '') : '';
        var tw  = colTW ? String(twColVals[r][0] || '') : '';
        var src = en || tw; // 優先用 EN 對照，沒有則用 TW

        if (!src || !tgt) continue;

        itemsToCheck.push({
          src: src,
          tgt: tgt,
          lang: header,
          refTW: tw // [新增] 傳入 zh-TW 作為對照組，防止中文洩漏
        });
        itemIndices.push({ r: r, c: c });
      }
    }
  }

  if (itemsToCheck.length === 0) {
    sh.getParent().toast('選區內沒有需要複核的粉紅高亮格子', '提示', 3);
    return;
  }

  sh.getParent().toast('正在複核 ' + itemsToCheck.length + ' 個標記... (AI)', '複核中', 60);

  // 2. 批量發送給 OpenAI 進行評判
  var results = openAiBatchReverify_(itemsToCheck);

  // 3. 根據結果更新
  var clearedCount = 0;
  for (var i = 0; i < results.length; i++) {
    var res = results[i];
    var idx = itemIndices[i];

    if (res.valid) {
      // AI 認為翻譯沒問題 -> 清除高亮與備註 (視為誤報)
      bgs[idx.r][idx.c]   = CLEAR_COLOR;
      notes[idx.r][idx.c] = ''; // 清除備註
      clearedCount++;
    } else {
      // AI 確認有問題 -> 保持高亮，更新備註
      // 為了區分，可以加註 AI 的意見
      var existingNote = notes[idx.r][idx.c];
      notes[idx.r][idx.c] = QA_NOTE_PREFIX + 'AI複核不通過: ' + (res.reason || '語意錯誤');
    }
  }

  // 寫回 Sheet
  rangeChunk.setBackgrounds(bgs);
  rangeChunk.setNotes(notes);

  sh.getParent().toast('✅ 複核完成！移除了 ' + clearedCount + ' 個誤報。', '完成', 5);
}

function openAiBatchReverify_(items) {
  var results = [];
  // 預先填充結果陣列，預設為 false (若 AI 失敗則保留高亮，避免誤刪)
  for (var i = 0; i < items.length; i++) results.push({ valid: false, reason: "AI 未回應或解析失敗" });

  var requests = [];
  var BATCH = 15; 

  // 1. 構建平行請求
  for (var i = 0; i < items.length; i += BATCH) {
    var slice = items.slice(i, i + BATCH);
    
    var prompt = "You are a strict localization QA judge.\n" +
      "Task: Check if the translation from " + (slice[0].srcCode || 'source') + " to " + (slice[0].lang || 'target') + " is valid.\n" +
      "\n" +
      "CRITICAL RULES for INVALID (return valid: false):\n" +
      "1. NOT TRANSLATED: If target text is in the wrong language (e.g. English text in a Japanese column), it is FAIL. This is the most important rule.\n" +
      "2. WRONG MEANING: The meaning is opposite or unrelated.\n" +
      "3. BROKEN SYNTAX: Variables like ${name} are missing or broken.\n" +
      "4. DUPLICATION: The translation repeats the content or URL twice (e.g. 'http://... http://...'). This is FAIL.\n" +
      "\n" +
      "Rules for VALID (return valid: true):\n" +
      "- If meaning is correct and language is correct, even if length/style differs, it is PASS.\n" +
      "- Proper nouns (XunNi, SOL, USDT) can remain in English.\n" +
      "\n" +
      "Input JSON: " + JSON.stringify(slice) + "\n" +
      "Output JSON array: [{ \"valid\": boolean, \"reason\": \"short reason if false\" }]";

    var sysMsg = "Return JSON only. Strict on language match.";
    
    var payload = {
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: sysMsg },
        { role: 'user',   content: prompt }
      ],
      max_completion_tokens: OPENAI_MAX_TOKENS
    };

    requests.push({
      url: 'https://api.openai.com/v1/chat/completions',
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + getApiKey_() },
      muteHttpExceptions: true,
      payload: JSON.stringify(payload),
      // 標記這個請求對應原始陣列的哪個區段
      _startIndex: i,
      _sliceLen: slice.length
    });
  }

  if (requests.length === 0) return results;

  // 2. 平行發送請求 (大幅加速關鍵)
  try {
    var responses = UrlFetchApp.fetchAll(requests);

    // 3. 解析結果並填回對應位置
    for (var k = 0; k < responses.length; k++) {
      var req = requests[k];
      var res = responses[k];
      var code = res.getResponseCode();
      var content = res.getContentText();

      if (code >= 200 && code < 300) {
        try {
          var json = JSON.parse(content);
          var aiContent = json.choices[0].message.content;
          var parsedArr = parseJsonArrayResponse_(aiContent, req._sliceLen);
          
          // 將解析結果填入 results 對應位置
          for (var subI = 0; subI < parsedArr.length; subI++) {
            var p = parsedArr[subI];
            // 如果解析出空字串，視為 AI 沒給出明確 Pass，保留高亮 (valid: false)
            var finalObj = (typeof p === 'string' || !p) ? { valid: false, reason: "AI 回應格式無效" } : p;
            
            // [雙重保險 v2] 強制攔截「未翻譯」與「語言錯誤」
            var item = slice[subI];
            var s = String(item.src || '').trim();
            var t = String(item.tgt || '').trim();
            var tw = String(item.refTW || '').trim();
            var lang = String(item.lang || '').toLowerCase();

            // 0. 強制攔截佔位符
            if (t.indexOf('[需要翻譯]') !== -1 || t.indexOf('[需要翻译]') !== -1) {
               finalObj.valid = false;
               finalObj.reason = "強制判定：包含佔位符 [需要翻譯]";
            }

            // 1. 與來源 (EN/TW) 完全相同 (Source Leak)
            if (s.length > 3 && s === t && !isPureVariableOrNumber_(s)) {
               finalObj.valid = false;
               finalObj.reason = "強制判定：未翻譯 (與來源相同)";
            }
            
            // 2. 與 zh-TW 完全相同 (Chinese Leak) - 針對非中文欄位
            // 排除 zh-CN，因為它可能真的跟 TW 一樣
            if (lang !== 'zh-tw' && lang !== 'zh-cn' && tw.length > 3 && tw === t && !isPureVariableOrNumber_(tw)) {
               finalObj.valid = false;
               finalObj.reason = "強制判定：未翻譯 (顯示為中文)";
            }

            // 3. 非 CJK 語系卻包含中文字 (Hanzi Leak) - 擴大範圍
            // 只要不是 zh/ja/ko，都視為 Non-CJK，不該出現中文字
            var isCJK = /^(zh|ja|ko)/.test(lang);
            if (!isCJK) {
               // 移除變數後檢查
               var cleanT = t.replace(/\$\{[^}]+\}|\{\{[^}]+\}/g, '');
               if (/[\u4E00-\u9FFF]/.test(cleanT)) {
                 finalObj.valid = false;
                 finalObj.reason = "強制判定：語言錯誤 (非CJK語系包含中文)";
               }
            }
            
            results[req._startIndex + subI] = finalObj;
          }
        } catch (e) {
          Logger.log('Reverify JSON Parse Error: ' + e);
          // 解析失敗維持預設 (valid: true) 或視為失敗，這裡選寬容策略
        }
      } else {
        Logger.log('Reverify API Error: ' + code + ' ' + content);
      }
    }
  } catch (e) {
    Logger.log('Reverify FetchAll Error: ' + e);
    SpreadsheetApp.getActiveSpreadsheet().toast('AI 複核連線錯誤，請稍後再試', '錯誤', 5);
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
    var resp = callOpenAIChat_(sysMsg, prompt);
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
  // 復用核心邏輯 (核心函數內部會自己去抓範圍)
  autoTranslateHighlightedCore_(sh, startRow, numRows);
}

/* ===================== ⚙ 自動翻譯 QA 高亮（全表） ===================== */
function autoTranslateHighlighted() {
  var apiKey = getApiKey_();
  if (!apiKey) throw new Error('缺少 OPENAI_API_KEY');

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getActiveSheet();
  var lastRow = sh.getLastRow();
  
  if (lastRow < 2) return;
  
  autoTranslateHighlightedCore_(sh, 2, lastRow - 1);
  
  ss.toast('✅ 已自動翻譯全表的 QA 高亮欄位', '完成', 6);
}

function autoTranslateHighlightedCore_(sh, startRow, numRows) {
  var lastCol = sh.getLastColumn();
  var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  var colEN   = getColIndexByHeader_(headers, 'en');
  var colTW   = getColIndexByHeader_(headers, 'zh-TW');
  if (colEN >= 0) colEN += 1;
  if (colTW >= 0) colTW += 1;

  // 抓取指定範圍的資料
  var rng    = sh.getRange(startRow, 1, numRows, lastCol);
  var values = rng.getValues();
  var bgs    = rng.getBackgrounds();
  var notes  = rng.getNotes();

  // 1. 收集所有待修復任務
  // 結構扁平化以便平行處理: [{ r, c, src, lang, srcCode }, ...]
  var repairTasks = [];

  for (var r = 0; r < values.length; r++) {
    for (var c = 0; c < lastCol; c++) {
      // 只處理 QA 高亮 (忽略大小寫差異)
      var bg = String(bgs[r][c] || '').toLowerCase();
      var qaColor = String(QA_COLOR).toLowerCase();
      
      if (bg === qaColor) {
        var header = String(headers[c] || '').trim();
        if (!header || header === 'zh-TW' || header === 'key') continue;

        // 決定來源：修復 en 用 zh-TW；修復其他優先用 en，無 en 則用 zh-TW
        var srcCol = (header === 'en') ? colTW : (colEN || colTW);
        if (!srcCol) continue;

        var srcText = String(values[r][srcCol - 1] || '');
        if (!srcText) continue;

        // [新增] 只有當目標格子真的有內容或者是空字串但被標記才處理
        // 避免處理那些雖然被標記但其實是誤操作的無限遠格子
        // 這裡我們信任使用者只會對有意義的區域做 QA 標記
        
        repairTasks.push({
          r: r,
          c: c,
          src: srcText,
          lang: header,
          srcCode: (header === 'en') ? 'zh-TW' : (colEN ? 'en' : 'zh-TW')
        });
      }
    }
  }

  if (repairTasks.length === 0) {
    sh.getParent().toast('範圍內沒有需要修復的高亮格子', '提示', 3);
    return;
  }

  sh.getParent().toast('正在平行修復 ' + repairTasks.length + ' 個格子...', '修復中', 60);

  // 2. 將任務分組並平行請求
  var apiRequests = [];
  var apiKey = getApiKey_();
  
  // 為了效率，我們將相同語言的請求合併成一個 Batch
  // 但為了平行度，我們還是用 BATCH_SIZE 切分
  
  // 先按語言分組
  var tasksByLang = {};
  for (var i = 0; i < repairTasks.length; i++) {
    var t = repairTasks[i];
    if (!tasksByLang[t.lang]) tasksByLang[t.lang] = [];
    tasksByLang[t.lang].push(t);
  }

  for (var lang in tasksByLang) {
    var langTasks = tasksByLang[lang];
    var srcCode = langTasks[0].srcCode; // 同語言的來源碼應該是一樣的

    for (var i = 0; i < langTasks.length; i += BATCH_SIZE) {
      var slice = langTasks.slice(i, i + BATCH_SIZE);
      var srcArr = slice.map(function(item) { return item.src; });
      
      var sysMsg  = buildSystemPrompt_(srcCode, lang);
      var userMsg = buildUserPrompt_(srcArr, srcCode, lang);
      
      var payload = {
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: sysMsg },
          { role: 'user',   content: userMsg }
        ],
        max_completion_tokens: OPENAI_MAX_TOKENS
      };

      apiRequests.push({
        url: 'https://api.openai.com/v1/chat/completions',
        method: 'post',
        contentType: 'application/json',
        headers: { 'Authorization': 'Bearer ' + apiKey },
        muteHttpExceptions: true,
        payload: JSON.stringify(payload),
        // 自訂屬性，用於回調時對應
        _meta: {
          lang: lang,
          sliceItems: slice,
          srcCode: srcCode
        }
      });
    }
  }

  if (apiRequests.length === 0) return;

  // 3. 平行發送請求 (Parallel Fetch) - 速度關鍵
  try {
    var responses = UrlFetchApp.fetchAll(apiRequests);
    var successCount = 0;

    // 4. 處理回應並寫入暫存陣列
    for (var k = 0; k < responses.length; k++) {
      var req = apiRequests[k];
      var res = responses[k];
      var meta = req._meta;
      var code = res.getResponseCode();
      var respText = res.getContentText();

      if (code >= 200 && code < 300) {
        try {
          var json = JSON.parse(respText);
          var content = json.choices[0].message.content;
          var translatedArr = parseJsonArrayResponse_(content, meta.sliceItems.length);

          // 將翻譯結果填回 values
          for (var idx = 0; idx < translatedArr.length; idx++) {
            var item = meta.sliceItems[idx];
            var rawTgt = translatedArr[idx];
            
            // [修正] 只要 rawTgt 不是 undefined，就視為 AI 有回應 (即使是空字串或跟原文一樣)
            if (rawTgt !== undefined && rawTgt !== null) {
              // 後處理：保留變數、去標籤、術語強制
              var finalTgt = processTranslationResult_(item.src, rawTgt, meta.lang, item.src);
              
              // 更新內容
              values[item.r][item.c] = finalTgt;
              
              // [修正] 強制清除高亮 (設為白色)，代表「已嘗試修復」
              bgs[item.r][item.c]    = '#ffffff'; 
              
              // 清除 QA 備註
              var note = String(notes[item.r][item.c] || '');
              if (note.indexOf(QA_NOTE_PREFIX) === 0) {
                notes[item.r][item.c] = '';
              }
              successCount++;
            }
          }
        } catch (e) {
          Logger.log('修復解析失敗 (' + meta.lang + '): ' + e);
        }
      } else {
        Logger.log('修復請求失敗 (' + meta.lang + '): ' + code + ' ' + respText);
      }
    }
    sh.getParent().toast('✅ 修復完成！成功更新 ' + successCount + ' 個格子。', '完成', 5);

  } catch (e) {
    Logger.log('FetchAll Error in autoFix: ' + e);
    SpreadsheetApp.getActiveSpreadsheet().toast('平行修復發生錯誤，請查看 Log', '錯誤', 5);
  }

  // 5. 一次性寫回 (Batch Write)
  rng.setValues(values);
  rng.setBackgrounds(bgs);
  rng.setNotes(notes);
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

/* ===================== THE END ===================== */
