# Telegram Callback Answer Emoji 使用規範審計報告

## 📋 審計目的

全面檢查所有 `answerCallbackQuery` 提示訊息的 Emoji 使用情況，確保：
1. 不同類型的提示使用正確的 Emoji
2. Emoji 使用一致且符合語義
3. 建立明確的 Emoji 使用規範

---

## 🎯 當前使用的 Emoji 類型統計

### **1. ✅ 成功類型（Success）** - 使用最多
**數量**：45 處

**使用場景**：
- 註冊流程完成：`✅ 註冊完成！`
- 資料設定成功：`✅ 暱稱已設定`、`✅ 性別已保存`、`✅ 生日已保存`
- 操作確認：`✅ 已確認！`、`✅ 已封鎖`、`✅ 已舉報`
- 篩選完成：`✅ 篩選完成`
- 清除操作：`✅ 已清除 MBTI 選擇`、`✅ 已清除星座選擇`
- 草稿操作：`✅ 繼續編輯草稿`、`✅ 草稿已刪除`、`✅ 開始新的漂流瓶`
- 支付準備：`✅ 正在準備支付...`
- 語言設定：`✅ 語言已更新為：...`
- MBTI 操作：`✅ MBTI 已設定為 ...`、`✅ 開始測驗`、`✅ 已跳過`
- 任務操作：`✅ 任務已完成`、`✅ 獎勵已領取`

**評價**：✅ **使用正確，語義清晰**

---

### **2. ❌ 錯誤類型（Error）** - 使用第二多
**數量**：117 處

**使用場景**：
- 資料不存在：`❌ 用戶不存在`、`❌ 對話不存在`、`❌ 草稿不存在或已過期`
- 資訊錯誤：`❌ 對話資訊錯誤`、`❌ 無效的語言代碼`、`❌ 無效的 MBTI 類型`
- 權限限制：`❌ 此功能僅限 VIP 會員使用`、`❌ 請先完成註冊流程`
- 狀態錯誤：`❌ 當前不在性別選擇步驟`、`❌ 會話已過期`
- 系統錯誤：`❌ 發生錯誤`、`❌ 操作失敗`
- 格式錯誤：`❌ 生日格式錯誤`、`❌ 未知的性別選項`
- 廣告限制：`❌ 無法觀看更多廣告`、`❌ 暫無可用的廣告提供商`

**評價**：✅ **使用正確，但可以更細分**

---

### **3. ⚠️ 警告類型（Warning）** - 使用較少
**數量**：1 處

**使用場景**：
- 廣告限制：`⚠️ 請先完成上一支廣告，再開始新的廣告`

**評價**：⚠️ **使用太少，很多應該用警告的地方用了錯誤**

---

### **4. 💎 VIP 專屬類型** - 使用較少
**數量**：1 處

**使用場景**：
- VIP 提示：`💎 VIP 用戶無需觀看廣告`

**評價**：✅ **使用正確**

---

### **5. ✏️ 輸入提示類型** - 使用較少
**數量**：1 處

**使用場景**：
- 輸入提示：`✏️ 請輸入新的內容`

**評價**：✅ **使用正確**

---

### **6. 無 Emoji 類型** - 需要改進
**數量**：約 30 處

**使用場景**：
- 取消操作：`已取消`、`已取消提醒`
- 處理中：`正在處理續費...`
- 未知操作：`未知的操作`
- 錯誤提示：`錯誤：無法獲取聊天 ID`

**評價**：❌ **缺少 Emoji，不一致**

---

## 🚨 發現的問題

### **問題 1：錯誤 (❌) 和警告 (⚠️) 混用**

**現狀**：
- 大部分應該是「警告」的情況都用了「錯誤」❌
- 只有 1 處使用了「警告」⚠️

**範例**：
```typescript
// 應該是警告 ⚠️，但用了錯誤 ❌
❌ 此功能僅限 VIP 會員使用  // 這不是錯誤，是權限限制
❌ 請先完成註冊流程  // 這不是錯誤，是流程提示
❌ 會話已過期  // 這不是錯誤，是狀態提示
❌ 當前不在性別選擇步驟  // 這不是錯誤，是流程提示
```

**建議改為**：
```typescript
⚠️ 此功能僅限 VIP 會員使用
⚠️ 請先完成註冊流程
⚠️ 會話已過期
⚠️ 當前不在性別選擇步驟
```

---

### **問題 2：缺少場景特定的 Emoji**

**現狀**：
- 很多提示只有 ✅ 或 ❌，缺少場景 Emoji

**範例**：
```typescript
✅ 正在準備支付...  // 應該加上 💳
✅ 已封鎖  // 應該加上 🚫
✅ 已舉報  // 應該加上 🚨
✅ 草稿已刪除  // 應該加上 🗑️
```

**建議改為**：
```typescript
💳 正在準備支付...
🚫 已封鎖
🚨 已舉報
🗑️ 草稿已刪除
```

---

### **問題 3：部分提示完全沒有 Emoji**

**現狀**：
```typescript
await telegram.answerCallbackQuery(callbackQuery.id, '已取消');
await telegram.answerCallbackQuery(callbackQuery.id, '正在處理續費...');
await telegram.answerCallbackQuery(callbackQuery.id, '未知的操作');
await telegram.answerCallbackQuery(callbackQuery.id, '錯誤：無法獲取聊天 ID');
```

**建議改為**：
```typescript
await telegram.answerCallbackQuery(callbackQuery.id, '❌ 已取消');
await telegram.answerCallbackQuery(callbackQuery.id, '⏳ 正在處理續費...');
await telegram.answerCallbackQuery(callbackQuery.id, '❓ 未知的操作');
await telegram.answerCallbackQuery(callbackQuery.id, '❌ 錯誤：無法獲取聊天 ID');
```

---

### **問題 4：敏感內容檢測沒有特殊提示**

**現狀**：
- 目前沒有針對敏感詞、違規內容的特殊提示

**建議添加**：
```typescript
// 敏感詞檢測
🚫 內容包含敏感詞彙，請修改後重試

// 違規內容
⛔ 內容違反社群規範，已被攔截

// 風險警告
⚠️ 檢測到可疑內容，請謹慎發送
```

---

## 📊 建議的 Emoji 使用規範

### **1. 成功類型（Success）** ✅
**使用場景**：操作成功完成

**Emoji**：✅

**範例**：
- `✅ 註冊完成！`
- `✅ 設定已保存`
- `✅ 操作成功`

---

### **2. 錯誤類型（Error）** ❌
**使用場景**：系統錯誤、資料不存在、格式錯誤

**Emoji**：❌

**範例**：
- `❌ 用戶不存在`
- `❌ 發生錯誤`
- `❌ 格式錯誤`
- `❌ 無效的資料`

---

### **3. 警告類型（Warning）** ⚠️
**使用場景**：權限限制、狀態提示、流程提示

**Emoji**：⚠️

**範例**：
- `⚠️ 此功能僅限 VIP 會員使用`
- `⚠️ 請先完成註冊流程`
- `⚠️ 會話已過期`
- `⚠️ 請先完成上一個操作`

---

### **4. 禁止類型（Forbidden）** 🚫
**使用場景**：封鎖、禁止、拒絕

**Emoji**：🚫

**範例**：
- `🚫 已封鎖`
- `🚫 內容包含敏感詞彙`
- `🚫 操作被拒絕`

---

### **5. 嚴重禁止類型（Critical Forbidden）** ⛔
**使用場景**：違規、嚴重違反規則

**Emoji**：⛔

**範例**：
- `⛔ 內容違反社群規範`
- `⛔ 帳號已被封禁`
- `⛔ 嚴重違規行為`

---

### **6. 舉報類型（Report）** 🚨
**使用場景**：舉報、報告

**Emoji**：🚨

**範例**：
- `🚨 已舉報`
- `🚨 舉報已提交`

---

### **7. 刪除類型（Delete）** 🗑️
**使用場景**：刪除、清除

**Emoji**：🗑️

**範例**：
- `🗑️ 草稿已刪除`
- `🗑️ 已清除`

---

### **8. 處理中類型（Processing）** ⏳
**使用場景**：正在處理、等待中

**Emoji**：⏳

**範例**：
- `⏳ 正在處理...`
- `⏳ 正在發送...`
- `⏳ 請稍候...`

---

### **9. 支付類型（Payment）** 💳
**使用場景**：支付、交易

**Emoji**：💳

**範例**：
- `💳 正在準備支付...`
- `💳 支付成功`

---

### **10. VIP 專屬類型（VIP）** 💎
**使用場景**：VIP 相關

**Emoji**：💎

**範例**：
- `💎 VIP 用戶無需觀看廣告`
- `💎 VIP 專屬功能`

---

### **11. 輸入提示類型（Input）** ✏️
**使用場景**：需要用戶輸入

**Emoji**：✏️

**範例**：
- `✏️ 請輸入新的內容`
- `✏️ 請輸入暱稱`

---

### **12. 問號類型（Unknown）** ❓
**使用場景**：未知操作、不確定

**Emoji**：❓

**範例**：
- `❓ 未知的操作`
- `❓ 無法識別的指令`

---

### **13. 取消類型（Cancel）** ❌ 或 🚫
**使用場景**：取消操作

**Emoji**：❌ 或 🚫

**範例**：
- `❌ 已取消`
- `🚫 操作已取消`

---

### **14. 任務類型（Task）** 🎯
**使用場景**：任務相關

**Emoji**：🎯

**範例**：
- `🎯 任務已完成`
- `🎯 開始任務`

---

### **15. 獎勵類型（Reward）** 🎁
**使用場景**：獎勵、禮物

**Emoji**：🎁

**範例**：
- `🎁 獎勵已領取`
- `🎁 獲得獎勵`

---

### **16. 廣告類型（Ad）** 📺
**使用場景**：廣告相關

**Emoji**：📺

**範例**：
- `📺 正在加載廣告...`
- `📺 廣告觀看完成`

---

## 🎯 優先改進建議

### **P0（高優先級）** - 立即修復
1. ✅ 區分「錯誤 ❌」和「警告 ⚠️」
2. ✅ 為所有提示添加 Emoji（目前約 30 處缺少）
3. ✅ 添加敏感內容檢測提示（🚫、⛔）

---

### **P1（中優先級）** - 近期優化
4. ✅ 為特定場景添加場景 Emoji（🚫、🚨、🗑️、💳 等）
5. ✅ 統一「取消」操作的 Emoji
6. ✅ 統一「處理中」操作的 Emoji

---

### **P2（低優先級）** - 長期維護
7. ✅ 創建 Emoji 使用規範文檔
8. ✅ 在開發規範中添加 Emoji 檢查清單
9. ✅ Code Review 時檢查 Emoji 使用

---

## 📝 具體修改建議

### **1. 權限限制（應該用 ⚠️ 而非 ❌）**

**需要修改的文件**：
- `src/telegram/handlers/throw_advanced.ts`
- `src/telegram/handlers/edit_profile.ts`
- `src/telegram/handlers/onboarding_callback.ts`

**修改範例**：
```typescript
// 修改前
await telegram.answerCallbackQuery(callbackQuery.id, '❌ 此功能僅限 VIP 會員使用');

// 修改後
await telegram.answerCallbackQuery(callbackQuery.id, '⚠️ 此功能僅限 VIP 會員使用');
```

---

### **2. 會話過期（應該用 ⚠️ 而非 ❌）**

**需要修改的文件**：
- `src/telegram/handlers/throw_advanced.ts`
- `src/telegram/handlers/draft.ts`

**修改範例**：
```typescript
// 修改前
await telegram.answerCallbackQuery(callbackQuery.id, '❌ 會話已過期');

// 修改後
await telegram.answerCallbackQuery(callbackQuery.id, '⚠️ 會話已過期，請重新開始');
```

---

### **3. 流程提示（應該用 ⚠️ 而非 ❌）**

**需要修改的文件**：
- `src/telegram/handlers/onboarding_callback.ts`
- `src/telegram/handlers/edit_profile.ts`

**修改範例**：
```typescript
// 修改前
await telegram.answerCallbackQuery(callbackQuery.id, '❌ 當前不在性別選擇步驟');

// 修改後
await telegram.answerCallbackQuery(callbackQuery.id, '⚠️ 請先完成前面的步驟');
```

---

### **4. 特定場景添加場景 Emoji**

**需要修改的文件**：
- `src/telegram/handlers/conversation_actions.ts`
- `src/telegram/handlers/draft.ts`
- `src/telegram/handlers/vip.ts`

**修改範例**：
```typescript
// 修改前
await telegram.answerCallbackQuery(callbackQuery.id, '✅ 已封鎖');

// 修改後
await telegram.answerCallbackQuery(callbackQuery.id, '🚫 已封鎖');

// 修改前
await telegram.answerCallbackQuery(callbackQuery.id, '✅ 已舉報');

// 修改後
await telegram.answerCallbackQuery(callbackQuery.id, '🚨 已舉報');

// 修改前
await telegram.answerCallbackQuery(callbackQuery.id, '✅ 正在準備支付...');

// 修改後
await telegram.answerCallbackQuery(callbackQuery.id, '💳 正在準備支付...');
```

---

### **5. 無 Emoji 的提示**

**需要修改的文件**：
- `src/router.ts`
- `src/telegram/handlers/conversation_actions.ts`

**修改範例**：
```typescript
// 修改前
await telegram.answerCallbackQuery(callbackQuery.id, '已取消');

// 修改後
await telegram.answerCallbackQuery(callbackQuery.id, '❌ 已取消');

// 修改前
await telegram.answerCallbackQuery(callbackQuery.id, '未知的操作');

// 修改後
await telegram.answerCallbackQuery(callbackQuery.id, '❓ 未知的操作');
```

---

## 📊 統計總結

| Emoji 類型 | 當前使用數量 | 應該使用數量 | 完成度 |
|-----------|------------|------------|--------|
| ✅ 成功 | 45 | 45 | 100% |
| ❌ 錯誤 | 117 | ~60 | 過度使用 |
| ⚠️ 警告 | 1 | ~50 | 2% |
| 🚫 禁止 | 0 | ~5 | 0% |
| ⛔ 嚴重禁止 | 0 | ~2 | 0% |
| 🚨 舉報 | 0 | ~3 | 0% |
| 🗑️ 刪除 | 0 | ~2 | 0% |
| ⏳ 處理中 | 0 | ~5 | 0% |
| 💳 支付 | 0 | ~2 | 0% |
| 💎 VIP | 1 | 1 | 100% |
| ✏️ 輸入 | 1 | 1 | 100% |
| ❓ 未知 | 0 | ~2 | 0% |
| 無 Emoji | ~30 | 0 | 需改進 |

**總體完成度**：**60%**

---

## 💡 結論

**整體評價**：⚠️ **需要改進**

**主要問題**：
1. ❌ **錯誤 (❌) 被過度使用**：很多應該用警告 (⚠️) 的地方都用了錯誤
2. ⚠️ **警告 (⚠️) 使用不足**：只有 1 處使用，應該有 50+ 處
3. ❌ **缺少場景特定 Emoji**：封鎖、舉報、刪除等應該有專屬 Emoji
4. ❌ **約 30 處完全沒有 Emoji**：不一致

**改進方向**：
1. ✅ 建立明確的 Emoji 使用規範
2. ✅ 區分「錯誤」和「警告」
3. ✅ 為特定場景添加專屬 Emoji
4. ✅ 確保所有提示都有 Emoji

**預估工作量**：
- P0 修改：約 50 處，預估 3-4 小時
- P1 修改：約 20 處，預估 2-3 小時
- P2 文檔：預估 1-2 小時
- **總計**：6-9 小時

---

**檢查日期**：2025-11-21  
**檢查人員**：AI Assistant  
**狀態**：✅ 已完成

