# 統一 ForceReply 按鈕功能實施計劃

> **目標**：為所有需要長按回覆的場景添加按鈕支援  
> **日期**：2025-11-22  
> **狀態**：📋 規劃中

---

## 📋 需要改進的場景

### 1. ✅ 丟漂流瓶（已完成）
**文件**：`src/telegram/handlers/throw.ts`  
**現狀**：✅ 已實現按鈕輸入  
**提示**：`💡 **兩種輸入方式**：1️⃣ 點擊下方「🍾 丟漂流瓶」按鈕 2️⃣ 長按此訊息，選擇「回覆」後輸入內容`

---

### 2. ⏳ 對話回覆（待實現）
**文件**：`src/telegram/handlers/message_forward.ts`  
**現狀**：需要長按對方訊息回覆  
**提示**：`💡 請長按你要回復的消息，在出現的選單中選擇「回覆」後，在聊天框中輸入回復內容。`

**改進方案**：
- 在配對成功通知中添加「💬 回覆訊息」按鈕
- 在對話歷史記錄中添加「💬 回覆訊息」按鈕
- 點擊按鈕後，使用 ForceReply 提示用戶輸入

**實現難點**：
- ⚠️ 需要在 ForceReply 訊息中包含對話標識符（conversation_identifier）
- ⚠️ 需要更新 router 檢測邏輯，識別回覆的是哪個對話

---

### 3. ⏳ 舉報（待實現）
**文件**：`src/telegram/handlers/report.ts`  
**現狀**：需要長按對方訊息回覆 `/report`  
**提示**：`⚠️ 請長按你要舉報的訊息後回覆指令`

**改進方案**：
- 在對話訊息下方添加「🚨 舉報」按鈕（inline button）
- 點擊後直接處理舉報邏輯，無需 ForceReply

**實現難點**：
- ⚠️ 需要在每條對話訊息中添加 inline keyboard
- ⚠️ 需要在 callback data 中包含對話標識符

---

### 4. ⏳ 封鎖（待實現）
**文件**：`src/telegram/handlers/block.ts`  
**現狀**：需要長按對方訊息回覆 `/block`  
**提示**：`⚠️ 請長按你要封鎖的訊息後回覆指令`

**改進方案**：
- 在對話訊息下方添加「🚫 封鎖」按鈕（inline button）
- 點擊後直接處理封鎖邏輯，無需 ForceReply

**實現難點**：
- ⚠️ 需要在每條對話訊息中添加 inline keyboard
- ⚠️ 需要在 callback data 中包含對話標識符

---

## 🎯 優先級排序

| 場景 | 優先級 | 原因 | 預估工時 |
|------|-------|------|---------|
| 1. 丟漂流瓶 | ✅ P0 | 已完成 | - |
| 2. 對話回覆 | 🔥 P1 | 最常用功能，用戶體驗影響最大 | 3-4 小時 |
| 3. 舉報/封鎖 | ⭐ P2 | 使用頻率較低，但可提升 UX | 2-3 小時 |

---

## 🔧 技術方案

### 方案 A：對話回覆（推薦）

#### 1. 在配對成功通知中添加按鈕

**位置**：`src/telegram/handlers/throw.ts` 和 `src/telegram/handlers/catch.ts`

**修改前**：
```typescript
await telegram.sendMessage(
  chatId,
  `🎯 你的漂流瓶已被配對成功！\n\n` +
  `📝 對方暱稱：${matchedUserMaskedNickname}\n` +
  // ... 其他信息 ...
  `\n💬 等待對方回覆中...\n` +
  `📊 使用 /chats 查看所有對話\n\n` +
  `💬 **請長按此訊息，選擇「回覆」後輸入內容和對方開始聊天**`
);
```

**修改後**：
```typescript
await telegram.sendMessageWithButtons(
  chatId,
  `🎯 你的漂流瓶已被配對成功！\n\n` +
  `📝 對方暱稱：${matchedUserMaskedNickname}\n` +
  // ... 其他信息 ...
  `\n💡 **兩種回覆方式**：\n` +
  `1️⃣ 點擊下方「💬 回覆訊息」按鈕\n` +
  `2️⃣ 長按此訊息，選擇「回覆」後輸入內容`,
  [
    [{ text: '💬 回覆訊息', callback_data: `conv_reply_${conversationIdentifier}` }],
    [{ text: '📊 查看所有對話', callback_data: 'chats' }],
  ]
);
```

#### 2. 新增按鈕處理函數

**位置**：`src/telegram/handlers/message_forward.ts`

```typescript
/**
 * Handle conversation reply button click
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

    // Verify conversation exists and user is part of it
    const conversation = await db.d1
      .prepare(`SELECT * FROM conversations WHERE identifier = ?`)
      .bind(conversationIdentifier)
      .first();

    if (!conversation) {
      await telegram.answerCallbackQuery(callbackQuery.id, '⚠️ 對話不存在或已結束');
      return;
    }

    // Check if user is part of this conversation
    if (
      conversation.user1_telegram_id !== telegramId &&
      conversation.user2_telegram_id !== telegramId
    ) {
      await telegram.answerCallbackQuery(callbackQuery.id, '⚠️ 你不是此對話的參與者');
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
      console.error('[handleConversationReplyButton] Failed to send ForceReply:', await response.text());
    }
  } catch (error) {
    console.error('[handleConversationReplyButton] Error:', error);
    await telegram.answerCallbackQuery(callbackQuery.id, '❌ 系統發生錯誤');
  }
}
```

#### 3. 註冊 Callback Handler

**位置**：`src/router.ts`

```typescript
if (data.startsWith('conv_reply_')) {
  const conversationIdentifier = data.replace('conv_reply_', '');
  const { handleConversationReplyButton } = await import('./telegram/handlers/message_forward');
  await handleConversationReplyButton(callbackQuery, conversationIdentifier, env);
  return;
}
```

#### 4. 更新回覆檢測邏輯

**位置**：`src/router.ts`

```typescript
// Check if replying to conversation reply prompt
if (replyToText.includes('💬 回覆 #')) {
  const match = replyToText.match(/💬 回覆 #([A-Z0-9]+)：/);
  if (match) {
    const conversationIdentifier = match[1];
    // Process as conversation message
    const { handleMessageForward } = await import('./telegram/handlers/message_forward');
    const isConversationMessage = await handleMessageForward(message, env);
    if (isConversationMessage) {
      return;
    }
  }
}
```

---

### 方案 B：舉報/封鎖（推薦）

#### 1. 在對話訊息中添加 Inline Keyboard

**位置**：`src/telegram/handlers/message_forward.ts`

**修改前**：
```typescript
await telegram.sendMessage(
  receiverChatId,
  `💬 來自 ${senderMaskedNickname} (#${conversationIdentifier})：\n\n` +
  `${translatedContent}\n\n` +
  `━━━━━━━━━━━━━━━━\n` +
  `📊 今日已發送：${usedToday + 1}/${dailyLimit} 則`
);
```

**修改後**：
```typescript
await telegram.sendMessageWithButtons(
  receiverChatId,
  `💬 來自 ${senderMaskedNickname} (#${conversationIdentifier})：\n\n` +
  `${translatedContent}\n\n` +
  `━━━━━━━━━━━━━━━━\n` +
  `📊 今日已發送：${usedToday + 1}/${dailyLimit} 則`,
  [
    [
      { text: '💬 回覆', callback_data: `conv_reply_${conversationIdentifier}` },
      { text: '🚨 舉報', callback_data: `conv_report_${conversationIdentifier}` },
      { text: '🚫 封鎖', callback_data: `conv_block_${conversationIdentifier}` },
    ],
  ]
);
```

#### 2. 新增舉報/封鎖按鈕處理函數

**位置**：`src/telegram/handlers/report.ts` 和 `src/telegram/handlers/block.ts`

```typescript
/**
 * Handle report button click from conversation message
 */
export async function handleConversationReportButton(
  callbackQuery: TelegramCallbackQuery,
  conversationIdentifier: string,
  env: Env
): Promise<void> {
  // Similar to handleReport but without requiring reply_to_message
  // Use conversationIdentifier directly
}

/**
 * Handle block button click from conversation message
 */
export async function handleConversationBlockButton(
  callbackQuery: TelegramCallbackQuery,
  conversationIdentifier: string,
  env: Env
): Promise<void> {
  // Similar to handleBlock but without requiring reply_to_message
  // Use conversationIdentifier directly
}
```

---

## 🎨 用戶體驗對比

### 對話回覆

| 操作 | 修改前 | 修改後 |
|------|-------|-------|
| **步驟數** | 3 步（長按 → 選擇 → 輸入） | 2 步（點擊 → 輸入） |
| **新手友好度** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **視覺引導** | ⚠️ 需要文字說明 | ✅ 明顯的按鈕 |

### 舉報/封鎖

| 操作 | 修改前 | 修改後 |
|------|-------|-------|
| **步驟數** | 4 步（長按 → 選擇 → 輸入指令 → 發送） | 1 步（點擊按鈕） |
| **新手友好度** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **視覺引導** | ⚠️ 需要記住指令 | ✅ 明顯的按鈕 |

---

## 📊 實施計劃

### Phase 1：對話回覆按鈕（優先）

**預估工時**：3-4 小時

**任務清單**：
1. [ ] 修改配對成功通知，添加「💬 回覆訊息」按鈕
2. [ ] 新增 `handleConversationReplyButton` 函數
3. [ ] 註冊 `conv_reply_*` callback handler
4. [ ] 更新回覆檢測邏輯
5. [ ] 測試：按鈕回覆 vs 長按回覆
6. [ ] 測試：會話驗證（對話存在、用戶權限）
7. [ ] 更新文檔

---

### Phase 2：舉報/封鎖按鈕（次要）

**預估工時**：2-3 小時

**任務清單**：
1. [ ] 修改對話訊息，添加 inline keyboard
2. [ ] 新增 `handleConversationReportButton` 函數
3. [ ] 新增 `handleConversationBlockButton` 函數
4. [ ] 註冊 `conv_report_*` 和 `conv_block_*` callback handlers
5. [ ] 測試：按鈕舉報/封鎖 vs 指令舉報/封鎖
6. [ ] 測試：會話驗證
7. [ ] 更新文檔

---

## ⚠️ 注意事項

### 1. Callback Data 長度限制
- Telegram callback_data 最大 64 bytes
- `conv_reply_` (11) + identifier (8-10) = 19-21 bytes ✅
- `conv_report_` (12) + identifier (8-10) = 20-22 bytes ✅
- `conv_block_` (11) + identifier (8-10) = 19-21 bytes ✅

### 2. 兼容性考量
- 保留長按回覆功能（向後兼容）
- 兩種方式都應該正常工作
- 更新提示文字說明兩種方式

### 3. 安全性考量
- 驗證用戶是對話參與者
- 驗證對話存在且未結束
- 防止跨對話操作

### 4. UI/UX 考量
- 按鈕文字簡潔明瞭
- Emoji 使用一致
- 按鈕排列合理（常用功能在前）

---

## ✅ 驗收標準

### 對話回覆
- [ ] 用戶可以通過點擊按鈕回覆對話
- [ ] 點擊按鈕後，輸入框自動切換到回覆模式
- [ ] 系統正確識別對話標識符
- [ ] 長按回覆功能仍然可用
- [ ] 會話驗證正確（對話存在、用戶權限）
- [ ] 錯誤處理友善

### 舉報/封鎖
- [ ] 用戶可以通過點擊按鈕舉報/封鎖
- [ ] 按鈕點擊後立即處理，無需額外輸入
- [ ] 系統正確識別對話標識符
- [ ] 指令方式仍然可用（向後兼容）
- [ ] 會話驗證正確
- [ ] 錯誤處理友善

---

## 📝 後續優化建議

1. **統計分析**：
   - 記錄按鈕使用率 vs 長按回覆使用率
   - 用於優化 UX 設計

2. **A/B 測試**：
   - 測試不同按鈕文字的點擊率
   - 測試不同按鈕排列的用戶偏好

3. **多語言支援**：
   - 將按鈕文字遷移至 i18n
   - 支援更多語言

4. **快捷回覆**：
   - 添加常用回覆模板（如：「你好」、「謝謝」、「再見」）
   - 提升回覆效率

---

**創建日期**：2025-11-22  
**創建人員**：AI Assistant  
**狀態**：📋 規劃中，等待用戶確認

