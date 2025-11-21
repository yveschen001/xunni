# Telegram API 安全使用指南

> **目的**：防止反覆出現的 Telegram API 錯誤，特別是 Markdown 解析錯誤

## 🚨 常見錯誤：Markdown 解析失敗

### 錯誤訊息
```
Bad Request: can't parse entities: Can't find end of the entity starting at byte offset XXX
```

### 根本原因
當使用 `parse_mode: 'Markdown'` 或 `parse_mode: 'MarkdownV2'` 時，Telegram 會嘗試解析訊息中的特殊字符：
- `_` - 斜體
- `*` - 粗體
- `[` `]` - 連結
- `` ` `` - 程式碼
- 等等...

如果這些字符**沒有正確配對**，就會拋出解析錯誤。

### 問題場景
**最危險的情況**：發送包含**使用者輸入內容**的訊息時使用 `parse_mode`

例如：
```typescript
// ❌ 危險：使用者的簡介可能包含 _ 或 *
await telegram.sendPhoto(chatId, avatarUrl, {
  caption: `簡介：${user.bio}`,  // user.bio = "I love C++"
  parse_mode: 'Markdown'  // 💥 如果 bio 包含特殊字符就會失敗
});
```

### 歷史錯誤記錄

#### 錯誤 #1 (2025-11-21)
- **位置**：`src/telegram/handlers/conversation_actions.ts` - `handleConversationProfile`
- **問題**：查看對方資料卡時，使用 `parse_mode: 'Markdown'` 發送包含使用者自訂內容（暱稱、簡介、興趣）的照片
- **觸發條件**：使用者的簡介或興趣包含 `_`、`*` 等特殊字符
- **修復**：移除 `parse_mode`，改用純文字模式

#### 錯誤 #2 (之前)
- **位置**：同上
- **問題**：同樣的錯誤，修復後又被重新引入
- **原因**：為了顯示國旗 emoji 而加上 `parse_mode: 'Markdown'`，但忘記 emoji 不需要 Markdown 也能正常顯示

## ✅ 安全使用規則

### 規則 1：區分系統文字和使用者內容

#### ✅ 可以使用 `parse_mode` 的情況
**只有系統生成的固定文字**，不包含任何使用者輸入：

```typescript
// ✅ 安全：純系統訊息
await telegram.sendMessage(chatId, 
  '🎉 *恭喜你完成註冊！*\n\n' +
  '使用 /help 查看指令',
  { parse_mode: 'Markdown' }
);
```

#### ❌ 不可使用 `parse_mode` 的情況
**包含任何使用者輸入的內容**：

```typescript
// ❌ 危險：包含使用者暱稱
await telegram.sendMessage(chatId, 
  `你好，*${user.nickname}*！`,  // user.nickname 可能包含特殊字符
  { parse_mode: 'Markdown' }
);

// ✅ 安全：不使用 parse_mode
await telegram.sendMessage(chatId, 
  `你好，${user.nickname}！`
);
```

### 規則 2：Emoji 不需要 Markdown

```typescript
// ❌ 錯誤認知：以為 emoji 需要 Markdown
await telegram.sendMessage(chatId, 
  `🇹🇼 ${user.nickname}`,
  { parse_mode: 'Markdown' }  // 不需要！
);

// ✅ 正確：emoji 是 Unicode 字符，直接發送即可
await telegram.sendMessage(chatId, 
  `🇹🇼 ${user.nickname}`
);
```

### 規則 3：照片 Caption 同樣適用

```typescript
// ❌ 危險：caption 包含使用者內容
await telegram.sendPhoto(chatId, photoUrl, {
  caption: `📝 暱稱：${user.nickname}\n📖 簡介：${user.bio}`,
  parse_mode: 'Markdown'  // 💥 可能失敗
});

// ✅ 安全：不使用 parse_mode
await telegram.sendPhoto(chatId, photoUrl, {
  caption: `📝 暱稱：${user.nickname}\n📖 簡介：${user.bio}`
});
```

### 規則 4：如果必須使用 Markdown，請轉義

如果確實需要在包含使用者內容的訊息中使用 Markdown：

```typescript
// ✅ 使用 MarkdownV2 並轉義所有特殊字符
function escapeMarkdownV2(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

await telegram.sendMessage(chatId, 
  `你好，*${escapeMarkdownV2(user.nickname)}*！`,
  { parse_mode: 'MarkdownV2' }
);
```

**但建議**：除非絕對必要，否則不要在包含使用者內容的訊息中使用 Markdown。

## 📋 檢查清單

在發送任何 Telegram 訊息前，請檢查：

- [ ] 訊息是否包含使用者輸入的內容？（暱稱、簡介、興趣、城市、自訂文字等）
- [ ] 如果包含使用者內容，是否**沒有**使用 `parse_mode`？
- [ ] 如果使用 `parse_mode`，是否確保訊息中**只有**系統固定文字？
- [ ] 是否誤以為 emoji 需要 Markdown？（不需要！）

## 🧪 測試策略

### Smoke Test 覆蓋
已在 `scripts/smoke-test.ts` 中加入測試：

```typescript
// Test: Profile card with special characters
// 確保使用者資料包含 Markdown 特殊字符時不會失敗
```

### 手動測試場景
1. **設定包含特殊字符的個人資料**：
   - 暱稱：`Test_User*123`
   - 簡介：`I love C++ and Node.js!`
   - 興趣：`Gaming [PC], Music (Rock)`

2. **觸發以下功能**：
   - 查看個人資料 (`/profile`)
   - 查看對方資料卡（對話中點擊「查看對方資料」）
   - 查看對話歷史記錄 (`/chats`)
   - 邀請通知
   - 任何顯示使用者資訊的地方

3. **預期結果**：
   - 所有訊息都能正常發送
   - 不出現 "Can't parse entities" 錯誤

## 🔍 程式碼審查重點

在 Code Review 時，特別注意：

```typescript
// 🚩 紅旗：搜尋這些模式
grep -r "parse_mode.*Markdown" src/

// 對於每個結果，檢查：
// 1. 訊息內容是否包含使用者輸入？
// 2. 如果包含，為什麼需要 parse_mode？
// 3. 能否移除 parse_mode？
```

## 📚 相關文檔

- [Telegram Bot API - Formatting Options](https://core.telegram.org/bots/api#formatting-options)
- [Telegram Bot API - sendMessage](https://core.telegram.org/bots/api#sendmessage)
- [Telegram Bot API - sendPhoto](https://core.telegram.org/bots/api#sendphoto)

## 🎯 總結

**黃金規則**：
> **使用者內容 + parse_mode = 💥 潛在錯誤**
> 
> **解決方案**：不要在包含使用者內容的訊息中使用 `parse_mode`

**記住**：
- Emoji 不需要 Markdown
- 使用者輸入永遠不可信（可能包含任何字符）
- 寧可少用格式，也不要冒險出錯

---

**最後更新**：2025-11-21  
**維護者**：開發團隊  
**相關問題**：已在 Staging 環境修復並測試

