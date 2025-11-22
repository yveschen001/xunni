# 對話回覆按鈕功能實施計劃

> **目標**：為對話回覆添加按鈕支援，簡化用戶操作  
> **日期**：2025-11-22  
> **狀態**：🚀 實施中

---

## 📋 現狀分析

### 需要添加按鈕的場景

經過代碼分析，發現以下 **2 個關鍵場景** 需要添加回覆按鈕：

#### 1. **丟瓶子成功通知**（VIP 智能配對）
**文件**：`src/telegram/handlers/throw.ts`  
**位置**：Line 687  
**現狀**：
```typescript
`💬 **請長按此訊息，選擇「回覆」後輸入內容和對方開始聊天**`
```

**改進**：添加「💬 回覆訊息」按鈕

---

#### 2. **撿瓶子成功通知**
**文件**：`src/telegram/handlers/catch.ts`  
**位置**：Line 486  
**現狀**：
```typescript
`💬 直接回覆訊息即可開始對話`
```

**改進**：添加「💬 回覆訊息」按鈕

---

## 🎯 設計原則

### 1. **向後兼容**
- ✅ 保留長按回覆功能
- ✅ 兩種方式都可以正常工作
- ✅ 提示文字說明兩種方式

### 2. **安全性**
- ✅ 驗證用戶是對話參與者
- ✅ 驗證對話存在且未結束
- ✅ 防止跨對話操作

### 3. **用戶體驗**
- ✅ 按鈕文字簡潔明瞭
- ✅ Emoji 使用一致
- ✅ 錯誤提示友善

### 4. **不破壞現有功能**
- ✅ 不修改現有的回覆檢測邏輯
- ✅ 只添加新的檢測分支
- ✅ 保持現有代碼結構

---

## 🔧 技術實現

### Step 1：修改配對成功通知（throw.ts）

**位置**：`src/telegram/handlers/throw.ts` Line 670-687

**修改前**：
```typescript
successMessage =
  `✨ **VIP 特權啟動！智能配對成功！**\n\n` +
  // ... 其他信息 ...
  `使用 /chats 查看所有對話\n\n` +
  `💬 **請長按此訊息，選擇「回覆」後輸入內容和對方開始聊天**`;

// 發送訊息（無按鈕）
await telegram.sendMessage(chatId, successMessage);
```

**修改後**：
```typescript
successMessage =
  `✨ **VIP 特權啟動！智能配對成功！**\n\n` +
  // ... 其他信息 ...
  `使用 /chats 查看所有對話\n\n` +
  `💡 **兩種回覆方式**：\n` +
  `1️⃣ 點擊下方「💬 回覆訊息」按鈕\n` +
  `2️⃣ 長按此訊息，選擇「回覆」後輸入內容`;

// 發送訊息（帶按鈕）
await telegram.sendMessageWithButtons(
  chatId,
  successMessage,
  [
    [{ text: '💬 回覆訊息', callback_data: `conv_reply_${vipMatchInfo.conversationIdentifier}` }],
    [{ text: '📊 查看所有對話', callback_data: 'chats' }],
  ]
);
```

**注意**：
- ⚠️ 只在 VIP 智能配對成功時添加按鈕（因為有明確的 `conversationIdentifier`）
- ⚠️ 智能配對未成功時，不添加按鈕（因為沒有明確的對話對象）

---

### Step 2：修改撿瓶通知（catch.ts）

**位置**：`src/telegram/handlers/catch.ts` Line 478-487

**修改前**：
```typescript
await telegram.sendMessage(
  parseInt(ownerId),
  `🎣 有人撿到你的漂流瓶了！\n\n` +
  `📝 暱稱：${catcherNickname}\n` +
  // ... 其他信息 ...
  `💬 直接回覆訊息即可開始對話`
);
```

**修改後**：
```typescript
// Get conversation identifier for this conversation
const conversation = await db.d1
  .prepare(
    `SELECT c.id, ci.identifier 
     FROM conversations c
     LEFT JOIN conversation_identifiers ci ON ci.conversation_id = c.id AND ci.user_telegram_id = ?
     WHERE (c.user1_telegram_id = ? OR c.user2_telegram_id = ?)
     AND c.status = 'active'
     ORDER BY c.created_at DESC
     LIMIT 1`
  )
  .bind(ownerId, ownerId, ownerId)
  .first<{ id: number; identifier: string }>();

const conversationIdentifier = conversation?.identifier;

const notificationMessage =
  `🎣 有人撿到你的漂流瓶了！\n\n` +
  `📝 暱稱：${catcherNickname}\n` +
  // ... 其他信息 ...
  `已為你們建立了匿名對話，快來開始聊天吧～\n\n` +
  `💡 **兩種回覆方式**：\n` +
  `1️⃣ 點擊下方「💬 回覆訊息」按鈕\n` +
  `2️⃣ 長按此訊息，選擇「回覆」後輸入內容`;

if (conversationIdentifier) {
  await telegram.sendMessageWithButtons(
    parseInt(ownerId),
    notificationMessage,
    [
      [{ text: '💬 回覆訊息', callback_data: `conv_reply_${conversationIdentifier}` }],
      [{ text: '📊 查看所有對話', callback_data: 'chats' }],
    ]
  );
} else {
  // Fallback: send without button if identifier not found
  await telegram.sendMessage(parseInt(ownerId), notificationMessage);
}
```

---

### Step 3：新增按鈕處理函數

**位置**：`src/telegram/handlers/message_forward.ts`（新增函數）

```typescript
/**
 * Handle conversation reply button click
 * 
 * When user clicks "💬 回覆訊息" button, send a ForceReply message
 * to prompt them to input their reply.
 */
export async function handleConversationReplyButton(
  callbackQuery: TelegramCallbackQuery,
  conversationIdentifier: string,
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

    // Get conversation by identifier
    const conversation = await db.d1
      .prepare(
        `SELECT c.* 
         FROM conversations c
         INNER JOIN conversation_identifiers ci ON ci.conversation_id = c.id
         WHERE ci.identifier = ? AND ci.user_telegram_id = ?`
      )
      .bind(conversationIdentifier, telegramId)
      .first();

    if (!conversation) {
      await telegram.answerCallbackQuery(callbackQuery.id, '⚠️ 對話不存在或已結束');
      return;
    }

    // Check if conversation is active
    if (conversation.status !== 'active') {
      await telegram.answerCallbackQuery(callbackQuery.id, '⚠️ 此對話已結束');
      return;
    }

    // Answer callback query
    await telegram.answerCallbackQuery(callbackQuery.id, '💡 請在下方輸入框輸入內容');

    // Send ForceReply message with conversation identifier
    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: `💬 回覆 #${conversationIdentifier}：`,
        reply_markup: {
          force_reply: true,
          selective: true,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[handleConversationReplyButton] Failed to send ForceReply:', error);
    }
  } catch (error) {
    console.error('[handleConversationReplyButton] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 系統發生錯誤');
  }
}
```

---

### Step 4：註冊 Callback Handler

**位置**：`src/router.ts`（在 callback query 處理部分）

```typescript
// Handle conversation reply button
if (data.startsWith('conv_reply_')) {
  const conversationIdentifier = data.replace('conv_reply_', '');
  const { handleConversationReplyButton } = await import('./telegram/handlers/message_forward');
  await handleConversationReplyButton(callbackQuery, conversationIdentifier, env);
  return;
}
```

---

### Step 5：更新回覆檢測邏輯

**位置**：`src/router.ts`（在 reply_to_message 處理部分）

**修改前**：
```typescript
// Check if user is replying to a message (HIGHEST PRIORITY: explicit user action!)
if (message.reply_to_message && text) {
  const replyToText = message.reply_to_message.text || '';
  
  // Check if replying to throw bottle prompt (#THROW tag or ForceReply prompt)
  if (replyToText.includes('#THROW') || replyToText.includes('📝 請輸入你的漂流瓶內容：')) {
    // ... process bottle content ...
  }
  
  // Otherwise, check if it's a conversation reply
  const { handleMessageForward } = await import('./telegram/handlers/message_forward');
  const isConversationMessage = await handleMessageForward(message, env);
  if (isConversationMessage) {
    return;
  }
}
```

**修改後**：
```typescript
// Check if user is replying to a message (HIGHEST PRIORITY: explicit user action!)
if (message.reply_to_message && text) {
  const replyToText = message.reply_to_message.text || '';
  
  // Check if replying to throw bottle prompt (#THROW tag or ForceReply prompt)
  if (replyToText.includes('#THROW') || replyToText.includes('📝 請輸入你的漂流瓶內容：')) {
    // ... process bottle content ...
  }
  
  // Check if replying to conversation reply prompt (💬 回覆 #IDENTIFIER：)
  if (replyToText.includes('💬 回覆 #')) {
    const match = replyToText.match(/💬 回覆 #([A-Z0-9]+)：/);
    if (match) {
      const conversationIdentifier = match[1];
      console.error('[router] Detected reply to conversation prompt:', {
        userId: user.telegram_id,
        conversationIdentifier,
        method: 'button',
      });
      
      // Process as conversation message
      // The handleMessageForward will use the active conversation
      const { handleMessageForward } = await import('./telegram/handlers/message_forward');
      const isConversationMessage = await handleMessageForward(message, env);
      if (isConversationMessage) {
        return;
      }
    }
  }
  
  // Otherwise, check if it's a conversation reply (long-press method)
  const { handleMessageForward } = await import('./telegram/handlers/message_forward');
  const isConversationMessage = await handleMessageForward(message, env);
  if (isConversationMessage) {
    return;
  }
}
```

---

## 🎨 用戶體驗流程

### 方法 1：點擊按鈕（新增）

1. 用戶收到配對成功通知（或撿瓶通知）
2. 系統顯示兩個按鈕：
   - 💬 回覆訊息
   - 📊 查看所有對話
3. 用戶點擊「💬 回覆訊息」按鈕
4. 系統發送「💬 回覆 #IDENTIFIER：」訊息
5. **Telegram 自動將輸入框切換到「回覆」模式**
6. 用戶直接輸入內容（無需長按）
7. 系統檢測到回覆並處理

### 方法 2：長按回覆（現有）

1. 用戶收到配對成功通知（或撿瓶通知）
2. 用戶長按訊息 → 選擇「回覆」
3. 用戶輸入內容
4. 系統檢測到回覆並處理

---

## ✅ 驗收標準

### 功能測試
- [ ] 用戶可以通過點擊按鈕回覆對話
- [ ] 點擊按鈕後，輸入框自動切換到回覆模式
- [ ] 系統正確識別對話標識符
- [ ] 長按回覆功能仍然可用（向後兼容）
- [ ] 會話驗證正確（對話存在、狀態為 active）
- [ ] 錯誤處理友善

### 安全性測試
- [ ] 用戶只能回覆自己的對話
- [ ] 無法回覆已結束的對話
- [ ] 無法回覆不存在的對話

### 兼容性測試
- [ ] 兩種回覆方式都正常工作
- [ ] 不影響現有的對話功能
- [ ] 不影響其他回覆場景（丟瓶子、編輯資料等）

---

## ⚠️ 風險控制

### 1. 不修改現有核心邏輯
- ✅ `handleMessageForward` 函數保持不變
- ✅ 只添加新的檢測分支，不修改現有分支
- ✅ 保持現有的回覆檢測邏輯

### 2. 向後兼容
- ✅ 長按回覆功能保持不變
- ✅ 如果按鈕功能失敗，用戶仍可使用長按回覆

### 3. 錯誤處理
- ✅ 所有數據庫查詢都有錯誤處理
- ✅ 所有 Telegram API 調用都有錯誤處理
- ✅ 錯誤提示友善且具引導性

### 4. 性能影響
- ✅ 只在需要時查詢對話標識符
- ✅ 使用索引查詢（conversation_identifiers 表）
- ✅ 不增加額外的數據庫負擔

---

## 📊 實施步驟

1. ✅ **分析現有代碼**（已完成）
2. ⏳ **修改配對成功通知**（throw.ts）
3. ⏳ **修改撿瓶通知**（catch.ts）
4. ⏳ **新增按鈕處理函數**（message_forward.ts）
5. ⏳ **註冊 callback handler**（router.ts）
6. ⏳ **更新回覆檢測邏輯**（router.ts）
7. ⏳ **測試功能**
8. ⏳ **執行 lint 和 smoke test**
9. ⏳ **部署到 Staging**

---

**創建日期**：2025-11-22  
**創建人員**：AI Assistant  
**狀態**：🚀 實施中

