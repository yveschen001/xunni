# Telegram Markdown 解析錯誤 - 修復與防護總結

## 📋 問題描述

**錯誤訊息**：
```
Bad Request: can't parse entities: Can't find end of the entity starting at byte offset 510
```

**發生位置**：
- `src/telegram/handlers/conversation_actions.ts` - `handleConversationProfile` 函數
- 查看對方資料卡時發送照片

**觸發條件**：
- 使用者的個人資料（暱稱、簡介、興趣等）包含 Markdown 特殊字符（`_`、`*`、`[`、`]` 等）
- 發送訊息時使用了 `parse_mode: 'Markdown'`

## 🔍 根本原因

1. **錯誤認知**：以為顯示 emoji（如國旗 🇹🇼）需要 `parse_mode: 'Markdown'`
   - **事實**：Emoji 是 Unicode 字符，不需要 Markdown 也能正常顯示

2. **忽略風險**：在包含使用者輸入內容的訊息中使用 `parse_mode`
   - 使用者可以輸入任何字符，包括 Markdown 特殊字符
   - 如果這些字符沒有正確配對，Telegram 就會拋出解析錯誤

3. **反覆出現**：這個錯誤已經出現多次，每次修復後又被重新引入
   - 缺乏明確的規範和檢查機制
   - 沒有測試覆蓋這個場景

## ✅ 修復方案

### 代碼修復

```typescript
// ❌ 修復前
await telegram.sendPhoto(chatId, partnerAvatarUrl, {
  caption: profileMessage,
  parse_mode: 'Markdown'  // 💥 會導致錯誤
});

// ✅ 修復後
await telegram.sendPhoto(chatId, partnerAvatarUrl, {
  caption: profileMessage
  // Note: No parse_mode to avoid Markdown parsing errors from user-generated content
});
```

### 防護措施

#### 1. **Smoke Test 覆蓋**
在 `scripts/smoke-test.ts` 中新增測試：

```typescript
// Test: Profile card with special characters
await testEndpoint('History Posts', 'Profile card with special chars', async () => {
  // 確保使用者資料包含 Markdown 特殊字符時不會失敗
  const testProfile = {
    nickname: 'Test_User*123',  // Contains _ and *
    bio: 'I love C++ and Node.js!',  // Contains + and .
    interests: 'Gaming [PC], Music (Rock)',  // Contains [ ] ( )
  };
  // ...
});
```

#### 2. **創建防護文檔**
新增 `doc/TELEGRAM_API_SAFETY_GUIDE.md`：
- 詳細說明 Markdown parse_mode 的使用規則
- 列出常見錯誤案例和解決方案
- 提供檢查清單和測試策略

#### 3. **更新開發規範**
在 `doc/DEVELOPMENT_STANDARDS.md` 中新增「第 3 節：Telegram API 使用規範」：
- 明確規定何時可以/不可以使用 `parse_mode`
- 強調使用者內容的風險
- 提供正確和錯誤的範例

## 📊 影響範圍

### 已修復的文件
- ✅ `src/telegram/handlers/conversation_actions.ts` - 移除 `parse_mode: 'Markdown'`

### 需要檢查的其他位置
使用以下命令檢查是否還有其他潛在問題：

```bash
grep -r "parse_mode.*Markdown" src/
```

對於每個結果，檢查：
1. 訊息內容是否包含使用者輸入？
2. 如果包含，為什麼需要 parse_mode？
3. 能否移除 parse_mode？

## 🧪 測試驗證

### 手動測試步驟

1. **設定包含特殊字符的個人資料**：
   ```
   暱稱：Test_User*123
   簡介：I love C++ and Node.js!
   興趣：Gaming [PC], Music (Rock)
   ```

2. **觸發功能**：
   - 查看個人資料 (`/profile`)
   - 查看對方資料卡（對話中點擊「查看對方資料」）
   - 查看對話歷史記錄 (`/chats`)

3. **預期結果**：
   - 所有訊息都能正常發送
   - 不出現 "Can't parse entities" 錯誤
   - 國旗 emoji 正常顯示

### 自動化測試

```bash
# 執行 Smoke Test
pnpm run smoke-test

# 查看 "Profile card with special chars" 測試結果
```

## 📚 相關文檔

- `doc/TELEGRAM_API_SAFETY_GUIDE.md` - Telegram API 安全使用指南（新增）
- `doc/DEVELOPMENT_STANDARDS.md` - 第 3 節：Telegram API 使用規範（新增）
- `scripts/smoke-test.ts` - 新增特殊字符測試

## 🎯 防止再次發生的措施

### 開發時
1. ✅ 查看 `doc/TELEGRAM_API_SAFETY_GUIDE.md` 確認使用規則
2. ✅ 在發送訊息前使用檢查清單
3. ✅ 優先考慮不使用 `parse_mode`

### Code Review 時
1. ✅ 搜尋 `parse_mode` 關鍵字
2. ✅ 確認訊息內容是否包含使用者輸入
3. ✅ 如果包含，要求移除 `parse_mode` 或提供充分理由

### 部署前
1. ✅ 執行 Smoke Test
2. ✅ 手動測試包含特殊字符的場景
3. ✅ 確認所有資料卡功能正常

## 📝 經驗教訓

1. **Emoji 不需要 Markdown**
   - Unicode 字符可以直接發送
   - 不要為了 emoji 而加上 `parse_mode`

2. **使用者輸入永遠不可信**
   - 使用者可以輸入任何字符
   - 包含使用者內容的訊息不要使用 `parse_mode`

3. **需要完善的測試覆蓋**
   - 特殊字符場景必須在 Smoke Test 中覆蓋
   - 防止修復後又被重新引入

4. **需要明確的規範文檔**
   - 開發規範必須包含常見陷阱
   - 提供清晰的正確/錯誤範例

## ✅ 完成狀態

- [x] 修復代碼錯誤
- [x] 部署到 Staging
- [x] 新增 Smoke Test
- [x] 創建防護文檔
- [x] 更新開發規範
- [x] 記錄經驗教訓

---

**修復日期**：2025-11-21  
**修復版本**：Staging `814a4178-1b5d-441a-add7-d521cd96decc`  
**文檔維護者**：開發團隊

