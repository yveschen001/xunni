# 對話回覆按鈕功能 - 遺漏項目補充

> **發現日期**：2025-11-22  
> **狀態**：🔴 需要補充

---

## ❌ 問題分析

用戶反饋：**實際部署後發現按鈕並未出現在應該出現的地方**

### 已實施（但不完整）
1. ✅ VIP 智能配對成功通知 - 有回覆按鈕
2. ✅ 撿瓶通知（瓶主收到） - 有回覆按鈕

### ❌ 遺漏項目（需要補充）
1. ❌ **撿瓶子成功訊息**（撿瓶者看到的）- Line 404: `💬 直接按 /reply 回覆訊息聊天`
2. ❌ **新訊息通知**（updateNewMessagePost）- Line 385: 只有「👤 查看對方資料卡」按鈕
3. ❌ **查看對方資料卡**（conversation_actions.ts）- 需要添加回覆按鈕
4. ❌ **對話歷史記錄**（conversation_history.ts）- 需要添加回覆按鈕

---

## 🎯 需要補充的地方

### 1. 撿瓶子成功訊息（catch.ts）

**位置**：`src/telegram/handlers/catch.ts` Line 393-441

**現狀**：
```typescript
const catchMessage =
  `🧴 你撿到了一個漂流瓶！\n\n` +
  // ... 瓶子信息 ...
  `💬 直接按 /reply 回覆訊息聊天\n` +
  // ... 其他信息 ...

// 只有廣告/任務按鈕，沒有回覆按鈕
if (!isVip) {
  if (prompt.show_button) {
    await telegram.sendMessageWithButtons(chatId, catchMessage, [
      [{ text: prompt.button_text, callback_data: prompt.button_callback }],
    ]);
  }
} else {
  await telegram.sendMessage(chatId, catchMessage);
}
```

**應該改為**：
```typescript
const catchMessage =
  `🧴 你撿到了一個漂流瓶！\n\n` +
  // ... 瓶子信息 ...
  `💡 **兩種回覆方式**：\n` +
  `1️⃣ 點擊下方「💬 回覆訊息」按鈕\n` +
  `2️⃣ 長按此訊息，選擇「回覆」後輸入內容\n` +
  // ... 其他信息 ...

// 需要獲取 conversation identifier
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
  .bind(user.telegram_id, user.telegram_id, user.telegram_id)
  .first<{ id: number; identifier: string }>();

const conversationIdentifier = conversation?.identifier;

if (!isVip) {
  // 非 VIP：回覆按鈕 + 廣告/任務按鈕
  const buttons = [
    [{ text: '💬 回覆訊息', callback_data: `conv_reply_${conversationIdentifier}` }],
  ];
  
  if (prompt.show_button) {
    buttons.push([{ text: prompt.button_text, callback_data: prompt.button_callback }]);
  }
  
  await telegram.sendMessageWithButtons(chatId, catchMessage, buttons);
} else {
  // VIP：只有回覆按鈕
  await telegram.sendMessageWithButtons(chatId, catchMessage, [
    [{ text: '💬 回覆訊息', callback_data: `conv_reply_${conversationIdentifier}` }],
    [{ text: '📊 查看所有對話', callback_data: 'chats' }],
  ]);
}
```

---

### 2. 新訊息通知（conversation_history.ts）

**位置**：`src/services/conversation_history.ts` Line 381-386

**現狀**：
```typescript
// Send new message with button
const sentMessage = await telegram.sendMessageWithButtonsAndGetId(
  parseInt(userTelegramId),
  content,
  [[{ text: '👤 查看對方資料卡', callback_data: `conv_profile_${conversationId}` }]]
);
```

**應該改為**：
```typescript
// Get user to check VIP status
const { findUserByTelegramId } = await import('~/db/queries/users');
const user = await findUserByTelegramId(db, userTelegramId);
const isVip = !!(user?.is_vip && user?.vip_expire_at && new Date(user.vip_expire_at) > new Date());

// Build buttons based on VIP status
const buttons = [
  [{ text: '💬 回覆訊息', callback_data: `conv_reply_${identifier}` }],
  [{ text: '👤 查看對方資料卡', callback_data: `conv_profile_${conversationId}` }],
];

// Add ad/task button for non-VIP users
if (!isVip) {
  const { getNextIncompleteTask } = await import('../telegram/handlers/tasks');
  const { getAdPrompt } = await import('~/domain/ad_prompt');
  const { getTodayAdReward } = await import('~/db/queries/ad_rewards');
  
  const nextTask = await getNextIncompleteTask(db, user);
  const adReward = await getTodayAdReward(db.d1, userTelegramId);
  
  const prompt = getAdPrompt({
    user,
    ads_watched_today: adReward?.ads_watched || 0,
    has_incomplete_tasks: !!nextTask,
    next_task_name: nextTask?.name,
    next_task_id: nextTask?.id,
  });
  
  if (prompt.show_button) {
    buttons.push([{ text: prompt.button_text, callback_data: prompt.button_callback }]);
  }
}

// Send new message with buttons
const sentMessage = await telegram.sendMessageWithButtonsAndGetId(
  parseInt(userTelegramId),
  content,
  buttons
);
```

---

### 3. 查看對方資料卡（conversation_actions.ts）

**位置**：`src/telegram/handlers/conversation_actions.ts`

**需要檢查**：
- 資料卡訊息是否有提示回覆？
- 如果有，需要添加回覆按鈕

---

### 4. 對話歷史記錄（conversation_history.ts）

**位置**：`src/services/conversation_history.ts`

**需要檢查**：
- 歷史記錄訊息是否需要回覆按鈕？
- 如果需要，添加按鈕

---

## 📊 優先級

| 項目 | 優先級 | 原因 | 預估工時 |
|------|-------|------|---------|
| 1. 撿瓶子成功訊息 | 🔥 P0 | 最常用，用戶體驗影響最大 | 1 小時 |
| 2. 新訊息通知 | 🔥 P0 | 最常用，用戶體驗影響最大 | 1 小時 |
| 3. 查看對方資料卡 | ⭐ P1 | 使用頻率較高 | 30 分鐘 |
| 4. 對話歷史記錄 | ⭐ P2 | 使用頻率較低 | 30 分鐘 |

---

## ⚠️ 重要發現

### 廣告/任務按鈕邏輯
用戶提到：**「一般用戶的話，對話中還是有那個看廣告的按鈕在。（VIP不用）」**

這意味著：
- ✅ **非 VIP 用戶**：需要顯示「回覆按鈕」+「廣告/任務按鈕」
- ✅ **VIP 用戶**：只顯示「回覆按鈕」+「查看所有對話」

**現有邏輯**：
- `getAdPrompt` 函數會根據用戶狀態決定顯示什麼按鈕
- 需要確保回覆按鈕和廣告/任務按鈕可以同時顯示

---

## 🔧 實施計劃

### Phase 1：補充撿瓶子成功訊息（P0）
1. [ ] 修改 `src/telegram/handlers/catch.ts`
2. [ ] 添加對話標識符查詢
3. [ ] 更新按鈕邏輯（VIP vs 非 VIP）
4. [ ] 測試

### Phase 2：補充新訊息通知（P0）
1. [ ] 修改 `src/services/conversation_history.ts`
2. [ ] 添加回覆按鈕
3. [ ] 保留廣告/任務按鈕（非 VIP）
4. [ ] 測試

### Phase 3：補充查看對方資料卡（P1）
1. [ ] 檢查 `src/telegram/handlers/conversation_actions.ts`
2. [ ] 如需要，添加回覆按鈕
3. [ ] 測試

### Phase 4：補充對話歷史記錄（P2）
1. [ ] 檢查 `src/services/conversation_history.ts`
2. [ ] 如需要，添加回覆按鈕
3. [ ] 測試

---

## ✅ 驗收標準

### 功能完整性
- [ ] 所有提示「/reply」的地方都有回覆按鈕
- [ ] 非 VIP 用戶看到回覆按鈕 + 廣告/任務按鈕
- [ ] VIP 用戶只看到回覆按鈕
- [ ] 點擊按鈕後正確進入回覆模式
- [ ] 長按回覆功能仍然可用

### 用戶體驗
- [ ] 按鈕排列合理
- [ ] 提示文字清晰
- [ ] 操作流程順暢

---

**創建日期**：2025-11-22  
**創建人員**：AI Assistant  
**狀態**：🔴 需要補充

