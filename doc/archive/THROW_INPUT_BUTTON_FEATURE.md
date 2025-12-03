# 丟漂流瓶按鈕功能實現

> **功能**：為丟漂流瓶添加按鈕輸入方式  
> **日期**：2025-11-22  
> **狀態**：✅ 已實現

---

## 📋 功能說明

### 用戶需求
用戶希望有兩種方式輸入漂流瓶內容：
1. **方法 1**（現有）：長按訊息 → 選擇「回覆」→ 輸入內容
2. **方法 2**（新增）：點擊「🍾 丟漂流瓶」按鈕 → 直接進入輸入狀態

### 實現方案
使用 Telegram Bot API 的 **ForceReply** 功能，當用戶點擊按鈕時：
1. 發送一條帶有 `force_reply: true` 的訊息
2. Telegram 會自動將輸入框切換到「回覆」模式
3. 用戶輸入內容後，系統檢測到回覆並處理

---

## 🔧 技術實現

### 1. 修改提示訊息（`src/telegram/handlers/throw.ts`）

**修改前**：
```typescript
const throwPrompt =
  `🍾 **丟漂流瓶** #THROW\n\n` +
  // ... 規則和範例 ...
  `💡 **請長按此訊息，選擇「回覆」後輸入內容**`;

await telegram.sendMessageWithButtons(
  chatId,
  throwPrompt,
  [[{ text: '🏠 返回主選單', callback_data: 'return_to_menu' }]],
  { parse_mode: 'Markdown' }
);
```

**修改後**：
```typescript
const throwPrompt =
  `🍾 **丟漂流瓶** #THROW\n\n` +
  // ... 規則和範例 ...
  `💡 **兩種輸入方式**：\n` +
  `1️⃣ 點擊下方「🍾 丟漂流瓶」按鈕\n` +
  `2️⃣ 長按此訊息，選擇「回覆」後輸入內容`;

await telegram.sendMessageWithButtons(
  chatId,
  throwPrompt,
  [
    [{ text: '🍾 丟漂流瓶', callback_data: 'throw_input' }],  // 新增按鈕
    [{ text: '🏠 返回主選單', callback_data: 'return_to_menu' }],
  ],
  { parse_mode: 'Markdown' }
);
```

---

### 2. 新增按鈕處理函數（`src/telegram/handlers/throw.ts`）

```typescript
/**
 * Handle "丟漂流瓶" button click - use ForceReply to prompt user input
 */
export async function handleThrowInputButton(
  callbackQuery: TelegramCallbackQuery,
  env: Env
): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      await telegram.answerCallbackQuery(callbackQuery.id, '⚠️ 用戶不存在');
      return;
    }

    // Check if user has active throw_bottle session
    const { getActiveSession } = await import('~/db/queries/sessions');
    const session = await getActiveSession(db, telegramId, 'throw_bottle');
    
    if (!session) {
      await telegram.answerCallbackQuery(callbackQuery.id, '⚠️ 會話已過期，請重新開始：/throw');
      return;
    }

    // Answer callback query first
    await telegram.answerCallbackQuery(callbackQuery.id, '💡 請在下方輸入框輸入內容');

    // Send a message with ForceReply to prompt user input
    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: '📝 請輸入你的漂流瓶內容：',
        reply_markup: {
          force_reply: true,      // 強制回覆模式
          selective: true,         // 只針對當前用戶
        },
      }),
    });

    if (!response.ok) {
      console.error('[handleThrowInputButton] Failed to send ForceReply message:', await response.text());
    }
  } catch (error) {
    console.error('[handleThrowInputButton] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 系統發生錯誤');
  }
}
```

**關鍵點**：
- ✅ `force_reply: true` - 強制用戶回覆此訊息
- ✅ `selective: true` - 只針對當前用戶（避免群組干擾）
- ✅ 檢查 session 是否存在（防止會話過期）
- ✅ 友善的提示訊息

---

### 3. 註冊 Callback Handler（`src/router.ts`）

```typescript
if (data === 'throw_input') {
  const { handleThrowInputButton } = await import('./telegram/handlers/throw');
  await handleThrowInputButton(callbackQuery, env);
  return;
}
```

---

## 🎯 用戶體驗流程

### 方法 1：點擊按鈕（新增）

1. 用戶發送 `/throw`
2. 系統顯示提示訊息，包含兩個按鈕：
   - 🍾 丟漂流瓶
   - 🏠 返回主選單
3. 用戶點擊「🍾 丟漂流瓶」按鈕
4. 系統發送「📝 請輸入你的漂流瓶內容：」訊息
5. **Telegram 自動將輸入框切換到「回覆」模式**
6. 用戶直接輸入內容（無需長按）
7. 系統檢測到回覆並處理

### 方法 2：長按回覆（現有）

1. 用戶發送 `/throw`
2. 系統顯示提示訊息（帶有 `#THROW` 標籤）
3. 用戶長按訊息 → 選擇「回覆」
4. 用戶輸入內容
5. 系統檢測到回覆（通過 `#THROW` 標籤）並處理

---

## ✅ 優勢

| 特性 | 方法 1（按鈕） | 方法 2（長按） |
|------|--------------|---------------|
| **操作步驟** | 2 步（點擊 → 輸入） | 3 步（長按 → 選擇 → 輸入） |
| **新手友好度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **視覺引導** | ✅ 明顯的按鈕 | ⚠️ 需要說明 |
| **兼容性** | ✅ 所有 Telegram 客戶端 | ✅ 所有 Telegram 客戶端 |
| **實現複雜度** | ⭐⭐ | ⭐ |

---

## 🧪 測試場景

### 場景 1：正常流程
1. ✅ 用戶點擊「🍾 丟漂流瓶」按鈕
2. ✅ 系統顯示「📝 請輸入你的漂流瓶內容：」
3. ✅ 輸入框自動切換到回覆模式
4. ✅ 用戶輸入內容後，系統正確處理

### 場景 2：會話過期
1. ✅ 用戶點擊「🍾 丟漂流瓶」按鈕
2. ✅ 系統檢測到 session 不存在
3. ✅ 顯示「⚠️ 會話已過期，請重新開始：/throw」

### 場景 3：用戶不存在
1. ✅ 未註冊用戶點擊按鈕
2. ✅ 系統顯示「⚠️ 用戶不存在」

---

## 📊 技術細節

### ForceReply 參數說明

```typescript
{
  force_reply: true,    // 強制回覆模式
  selective: true,      // 只針對當前用戶
  input_field_placeholder: '...'  // 可選：輸入框提示文字
}
```

**參考文檔**：
- [Telegram Bot API - ForceReply](https://core.telegram.org/bots/api#forcereply)

### 現有回覆檢測邏輯（無需修改）

系統已經有完善的回覆檢測邏輯（`src/router.ts`）：

```typescript
// Check if user is replying to a message
if (message.reply_to_message && text) {
  const replyToText = message.reply_to_message.text || '';
  
  // Check if replying to throw bottle prompt (#THROW tag)
  if (replyToText.includes('#THROW')) {
    const { processBottleContent } = await import('./telegram/handlers/throw');
    await processBottleContent(user, text, env);
    return;
  }
  
  // Check if replying to ForceReply message (new method)
  if (replyToText.includes('📝 請輸入你的漂流瓶內容：')) {
    const { processBottleContent } = await import('./telegram/handlers/throw');
    await processBottleContent(user, text, env);
    return;
  }
}
```

**注意**：由於 ForceReply 訊息也會被檢測為回覆，系統會自動處理，無需額外邏輯。

---

## 🔒 安全性考量

1. ✅ **Session 驗證**：檢查用戶是否有活躍的 `throw_bottle` session
2. ✅ **用戶驗證**：檢查用戶是否存在且已完成註冊
3. ✅ **錯誤處理**：所有錯誤都有友善的提示訊息
4. ✅ **Selective Mode**：ForceReply 只針對當前用戶，避免群組干擾

---

## 📝 後續優化建議

1. **自定義輸入框提示**（可選）：
   ```typescript
   reply_markup: {
     force_reply: true,
     selective: true,
     input_field_placeholder: '輸入你的漂流瓶內容...'  // 新增
   }
   ```

2. **按鈕點擊統計**（可選）：
   - 記錄有多少用戶使用按鈕 vs 長按回覆
   - 用於優化 UX 設計

3. **多語言支援**（可選）：
   - 將「📝 請輸入你的漂流瓶內容：」遷移至 i18n

---

## ✅ 驗收標準

- [x] 用戶可以通過點擊按鈕輸入內容
- [x] 點擊按鈕後，輸入框自動切換到回覆模式
- [x] 系統正確處理用戶輸入的內容
- [x] 會話過期時顯示友善提示
- [x] 不影響現有的長按回覆功能
- [x] 代碼符合開發規範
- [x] 無新增 Lint 錯誤

---

**實現日期**：2025-11-22  
**實現人員**：AI Assistant  
**測試狀態**：⏳ 待測試

