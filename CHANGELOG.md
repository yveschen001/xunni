# XunNi Bot - 變更日誌

## [未發布] - 2025-11-16

### 新增功能
- ✅ 整合 Gemini AI 翻譯服務（免費用戶使用）
- ✅ 多 model fallback 機制（gemini-2.0-flash-exp, gemini-2.5-flash-lite）
- ✅ 對話訊息自動翻譯功能
- ✅ 翻譯語言追蹤（original_language, translated_language）

### 改進
- ✅ 優化漂流瓶通知訊息格式，直接顯示撿瓶者資訊（暱稱、MBTI、星座、性別、年齡）
- ✅ 改進翻譯錯誤處理和日誌記錄
- ✅ 統一翻譯服務介面（VIP 用 OpenAI，免費用 Gemini）

### 修復
- ✅ 修復 Staging 環境缺少 GOOGLE_GEMINI_API_KEY 的問題
- ✅ 修復 conversation_messages 表缺少語言欄位的問題
- ✅ 修復 SQL INSERT 語句參數數量不匹配（8 vs 10）
- ✅ 修復 Gemini model 名稱錯誤（使用正確的 model 名稱）
- ✅ 修復資料庫 schema 與程式碼不一致的問題

### 技術細節
- 新增 `src/services/gemini.ts` - Gemini 翻譯服務
- 新增 `src/services/translation/index.ts` - 統一翻譯介面
- 新增 migration `0009_add_language_columns_to_conversation_messages.sql`
- 更新 `wrangler.toml` 添加 Gemini 相關環境變數
- 更新 `.dev.vars` 和 `.dev.vars.example` 配置範例
- 新增測試腳本：
  - `scripts/test-gemini-models.ts` - 測試可用的 Gemini models
  - `scripts/check-gemini-translation.ts` - 驗證翻譯功能
  - `scripts/test-catch-translation.ts` - 測試 /catch 翻譯流程

### 環境變數
新增以下環境變數到 Staging 環境：
- `GOOGLE_GEMINI_API_KEY` (secret)
- `GEMINI_PROJECT_ID`
- `GEMINI_LOCATION`
- `GEMINI_MODELS`
- `GEMINI_API_VERSION`

### 資料庫變更
- 添加 `conversation_messages.original_language` (TEXT)
- 添加 `conversation_messages.translated_language` (TEXT)

### 測試狀態
- ✅ 本地翻譯測試通過
- ✅ Staging 環境翻譯功能正常
- ✅ Smoke test 全部通過（28/28）
- ✅ 對話訊息翻譯功能正常
- ✅ 漂流瓶通知訊息格式正確

### 下一步計劃
- [ ] 部署到 Production 環境
- [ ] 監控翻譯服務使用情況
- [ ] 優化翻譯 prompt 以提高翻譯質量
- [ ] 添加翻譯快取機制以降低 API 成本

---

## 版本資訊
- **Staging Version**: 66457035-2088-402a-9ace-0e79425996e7
- **部署時間**: 2025-11-16 08:06 UTC
- **Worker URL**: https://xunni-bot-staging.yves221.workers.dev

