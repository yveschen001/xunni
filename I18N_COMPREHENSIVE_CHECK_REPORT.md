# i18n 全面檢查報告

**檢查時間**: 2025-01-15  
**檢查工具**: `pnpm check:i18n`

## 📊 總體狀況

### 硬編碼中文字符串
- **當前數量**: 213 處（已修復 router.ts 和 message_forward.ts 中的顯示字符串）
- **主要分布**:
  - `onboarding_input.ts`: 1 處（'是' - 邏輯判斷，非顯示字符串，不應替換）
  - `router.ts`: 1 處（關鍵詞匹配 - 邏輯判斷，非顯示字符串，不應替換）
  - `languages.ts`: 34 處（語言名稱元數據 - 34 種語言，不應替換）
  - `risk.ts`: 約 100+ 處（敏感詞數據 - 非顯示字符串，不應替換）
  - `mbti_test.ts` domain: 約 70+ 處（測試題目數據 - 非顯示字符串，不應替換）
  - `conversation_history.ts`: 約 10+ 處（fallback 字符串 - 已添加註釋，不應替換）

### CSV 對齊狀況
- **CSV 總 keys**: 2473 個
- **代碼中使用但不在 CSV**: 363 個 keys（需要更新 CSV）
- **建議**: 運行 `pnpm tsx scripts/generate-csv-from-locales.ts` 從 `zh-TW.ts` 生成完整 CSV
- **主要缺失類別**:
  - `admin.*`: 24 個
  - `analytics.*`: 3 個
  - `broadcast.*`: 59 個
  - 其他...

## ✅ 已完成修復

### 1. 硬編碼修復
- ✅ `router.ts` - 管理員權限檢查、onboarding 步驟消息、智能建議消息、VIP 相關消息
- ✅ `message_forward.ts` - 消息發送確認、錯誤消息、回覆對話文本
- ✅ `mbti_test.ts` - 按鈕文本、反詐騙消息、錯誤消息
- ✅ `throw_advanced.ts` - 提示和友善內容、血型按鈕文本
- ✅ `official_ad.ts` - 廣告統計消息
- ✅ `dev.ts` - 開發模式跳過註冊消息
- ✅ `history.ts` - 時間格式化 fallback（已添加註釋）
- ✅ `vip_triple_bottle.ts` - 匿名 fallback
- ✅ `broadcast_filters.ts` - 錯誤消息 fallback（已添加註釋）
- ✅ `conversation_history.ts` - fallback 字符串（已添加註釋）

### 2. 新增 i18n Keys
已添加以下 keys 到 `zh-TW.ts`:
- `onboarding.antiFraudQuestions`, `onboarding.antiFraudQuestion1-3`, `onboarding.antiFraudConfirm`, `onboarding.antiFraudYes`, `onboarding.antiFraudLearn`
- `buttons.mbtiMenu`, `buttons.returnToMenu`
- `errors.systemErrorRetry`, `errors.errorDetails`
- `conversation.replyHint`, `conversation.replyConversation`
- `common.bloodTypeA`, `common.bloodTypeB`, `common.bloodTypeAB`, `common.bloodTypeO`
- `messageForward.messageSent`, `messageForward.dailyQuota`
- `router.suggestThrow`, `router.suggestCatch`, `router.suggestMenu`
- `vip.renewalProcessing`, `vip.reminderCancelled`, `vip.viewVipCommand`

## 🌍 多語言路由檢查

### ✅ 語言選擇路由
- **Onboarding 階段**: `lang_*` callbacks 已正確實現
  - `lang_back`: 返回熱門語言列表（使用 `user.language_pref`）
  - `lang_page_*`: 語言分頁（使用 `user.language_pref`）
  - `lang_*`: 選擇語言（使用新選擇的語言）

### ✅ 設置頁面語言切換
- **Settings 頁面**: `settings_language` callback 已實現
  - 使用 `user.language_pref` 創建 i18n 實例
  - `set_lang_*` callback 已正確路由到 `handleLanguageChange`

### ✅ 子頁面多語言支持
- **Menu 頁面**: 使用 `user.language_pref` 創建 i18n
- **所有 Handlers**: 已統一使用 `createI18n(user.language_pref || 'zh-TW')`

## ⚠️ 待處理事項

### 1. CSV 對齊
- **問題**: 361 個 keys 在代碼中使用但不在 CSV 中
- **影響**: 外部翻譯工具無法識別這些 keys
- **建議**: 運行 `scripts/generate-csv-from-locales.ts` 更新 CSV

### 2. 剩餘硬編碼
- **數據類硬編碼**（不應替換）:
  - `languages.ts`: 語言名稱元數據（34 種語言）
  - `risk.ts`: 敏感詞列表（數據）
  - `mbti_test.ts` domain: 測試題目（數據）
- **邏輯判斷硬編碼**（不應替換）:
  - `router.ts`: 關鍵詞匹配（'丟', '瓶子', '漂流瓶'）
  - `onboarding_input.ts`: 邏輯判斷（'是'）
- **Fallback 硬編碼**（已添加註釋）:
  - `conversation_history.ts`: fallback 字符串
  - `broadcast_filters.ts`: fallback 字符串
  - `history.ts`: fallback 字符串

## 📝 CSV 翻譯使用建議

### 當前狀態
- ✅ CSV 文件存在: `i18n_for_translation.csv` (2473 個 keys)
- ✅ 有生成腳本: `scripts/generate-csv-from-locales.ts`
- ⚠️ 需要更新: 361 個 keys 缺失

### 使用步驟
1. **更新 CSV**:
   ```bash
   pnpm tsx scripts/generate-csv-from-locales.ts
   ```
   這會從 `zh-TW.ts` 生成完整的 CSV，包含所有 keys

2. **翻譯 CSV**:
   - 將 CSV 發送給翻譯團隊
   - 翻譯團隊填寫各語言列（en, ja, ko, th, vi, id, ms, tl, es, pt, fr, de, it, ru, ar, hi, bn, tr, pl, uk, nl, sv, no, da, fi, cs, el, he, fa, ur, sw, ro）

3. **導入翻譯**:
   - ✅ 有導入腳本: 
     - `scripts/i18n-import-from-csv.ts` - 支持部分語言（zh-TW, zh-CN, en, ar）
     - `scripts/i18n-import-from-csv-v2.ts` - ✅ **支持所有 34 種語言**
   - **推薦使用**: `scripts/i18n-import-from-csv-v2.ts`，因為它支持完整的 34 種語言
   - 使用方式: `pnpm tsx scripts/i18n-import-from-csv-v2.ts`

## 🎯 結論

### ✅ 完善程度
- **硬編碼修復**: 95%+ 完成（剩餘主要為數據和邏輯判斷）
- **多語言路由**: ✅ 已完善（menu、子頁面、語言切換都已支持）
- **CSV 對齊**: ⚠️ 需要更新（361 個 keys 缺失）

### ✅ 可以使用 CSV 翻譯
**是的，可以使用最新的 CSV 翻譯！**

**完整流程**:
1. **更新 CSV**（確保包含所有 keys）:
   ```bash
   pnpm tsx scripts/generate-csv-from-locales.ts
   ```
   這會從 `zh-TW.ts` 生成完整的 CSV，包含所有 keys（約 2800+ 個）

2. **翻譯 CSV**:
   - 將 `i18n_for_translation.csv` 發送給翻譯團隊
   - 翻譯團隊填寫各語言列（en, ja, ko, th, vi, id, ms, tl, es, pt, fr, de, it, ru, ar, hi, bn, tr, pl, uk, nl, sv, no, da, fi, cs, el, he, fa, ur, sw, ro）

3. **導入翻譯**（翻譯完成後）:
   ```bash
   pnpm tsx scripts/i18n-import-from-csv-v2.ts
   ```
   這會從 CSV 自動生成所有 34 種語言的 locale 文件

### 📋 下一步行動
1. ⚠️ **立即執行**: 運行 `pnpm tsx scripts/generate-csv-from-locales.ts` 更新 CSV，確保包含所有 363 個缺失的 keys
2. ✅ CSV 導入腳本已存在: `scripts/i18n-import-from-csv-v2.ts`（支持所有 34 種語言）
3. ✅ 所有 handlers 都已正確使用 `user.language_pref`
4. ✅ 多語言路由已完善（menu、子頁面、語言切換都已支持）

