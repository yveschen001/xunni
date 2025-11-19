# 新手教學「丟出漂流瓶」功能修復

**問題報告時間**: 2025-11-19 09:03 UTC  
**修復時間**: 2025-11-19 09:15 UTC  
**部署版本**: 881cb030-fce6-4682-af15-d67b9521780b

---

## 🐛 問題描述

### 用戶反饋
用戶完成註冊後，新手教學顯示：
1. ✅ 「準備好了！開始交朋友吧～」
2. ✅ 「完成任務可獲得額外瓶子」
3. ✅ 三個按鈕：「丟出漂流瓶」、「撿起漂流瓶」、「查看任務」

用戶點擊「丟出漂流瓶」後：
- ❌ 系統只顯示了提示文字
- ❌ **沒有啟動丟瓶流程**
- ❌ 用戶發送消息時，系統回覆「未知命令」

### 根本原因
在 `src/telegram/handlers/tutorial.ts` 的 `handleTutorialThrow` 函數中：
1. ✅ 完成教學（`completeTutorial`）
2. ✅ 發送提示消息
3. ❌ **但沒有調用 `handleThrow` 啟動丟瓶流程**
4. ❌ **沒有創建 throw session**

結果：用戶發送消息時，系統不知道這是瓶子內容，所以回覆「未知命令」。

---

## ✅ 修復方案

### 修改文件
- `src/telegram/handlers/tutorial.ts`

### 修改內容

#### 1. `handleTutorialThrow` 函數
**修改前**:
```typescript
async function handleTutorialThrow(
  chatId: number,
  telegram: ReturnType<typeof createTelegramService>,
  db: ReturnType<typeof createDatabaseClient>,
  telegramId: string
): Promise<void> {
  await completeTutorial(chatId, telegram, db, telegramId);
  await telegram.sendMessage(
    chatId,
    '🌊 **丟出漂流瓶**\n\n' +
    '請輸入你想說的話，我會幫你找到合適的人～\n\n' +
    '💡 提示：\n' +
    '• 真誠分享你的想法和感受\n' +
    '• 避免太短的訊息（如「嗨」）\n' +
    '• 禁止色情或不當內容'
  );
}
```

**修改後**:
```typescript
async function handleTutorialThrow(
  chatId: number,
  telegram: ReturnType<typeof createTelegramService>,
  db: ReturnType<typeof createDatabaseClient>,
  telegramId: string,
  env: Env
): Promise<void> {
  // Complete tutorial first
  await completeTutorial(chatId, telegram, db, telegramId);
  
  // Import and call handleThrow to start the throw flow
  const { handleThrow } = await import('./throw');
  
  // Create a mock message object for handleThrow
  const mockMessage = {
    chat: { id: chatId },
    from: { id: parseInt(telegramId) },
    text: '/throw',
  } as TelegramMessage;
  
  // Start throw flow
  await handleThrow(mockMessage, env);
}
```

**關鍵改進**:
1. ✅ 添加 `env` 參數
2. ✅ 導入 `handleThrow` 函數
3. ✅ 創建 mock message 對象
4. ✅ 調用 `handleThrow` 啟動丟瓶流程

#### 2. `handleTutorialCatch` 函數
同樣的修復邏輯，調用 `handleCatch` 啟動撿瓶流程。

#### 3. `handleTutorialViewTasks` 函數
同樣的修復邏輯，調用 `handleTasks` 顯示任務中心。

#### 4. 更新函數調用
在 `handleTutorialCallback` 中，傳入 `env` 參數：
```typescript
case 'tutorial_throw':
  await handleTutorialThrow(chatId, telegram, db, telegramId, env);
  break;

case 'tutorial_catch':
  await handleTutorialCatch(chatId, telegram, db, telegramId, env);
  break;

case 'tutorial_view_tasks':
  await handleTutorialViewTasks(chatId, telegram, db, telegramId, env);
  break;
```

---

## 🧪 測試驗證

### 自動化測試
- ✅ Lint 檢查通過（0 錯誤）
- ✅ 部署成功（Version: 881cb030）
- ✅ Worker 正常運行（HTTP 200）

### 手動測試清單
請使用新帳號測試以下流程：

#### Test 1: 新手教學 → 丟出漂流瓶
- [ ] 使用新帳號發送 `/start`
- [ ] 完成註冊流程
- [ ] 驗證教學頁面自動顯示
- [ ] 點擊「開始使用 →」按鈕
- [ ] 點擊「🌊 丟出漂流瓶」按鈕
- [ ] **驗證系統提示輸入瓶子內容**
- [ ] 發送一條消息（如 "你好，我是新用戶"）
- [ ] **驗證瓶子成功創建**
- [ ] **驗證收到確認消息**

#### Test 2: 新手教學 → 撿起漂流瓶
- [ ] 使用新帳號發送 `/start`
- [ ] 完成註冊流程
- [ ] 點擊「開始使用 →」按鈕
- [ ] 點擊「🎣 撿起漂流瓶」按鈕
- [ ] **驗證系統開始撿瓶流程**
- [ ] **驗證顯示漂流瓶內容（如果有）**

#### Test 3: 新手教學 → 查看任務
- [ ] 使用新帳號發送 `/start`
- [ ] 完成註冊流程
- [ ] 點擊「開始使用 →」按鈕
- [ ] 點擊「📋 查看任務」按鈕
- [ ] **驗證顯示任務中心**
- [ ] **驗證顯示 8 個任務**

---

## 📊 預期行為

### 修復前
```
用戶: [點擊「丟出漂流瓶」]
Bot: 🌊 **丟出漂流瓶**
     請輸入你想說的話，我會幫你找到合適的人～
     💡 提示：...

用戶: 你好，我是新用戶
Bot: ❓ 未知命令
     請使用 /help 查看可用命令列表。
```

### 修復後
```
用戶: [點擊「丟出漂流瓶」]
Bot: 🌊 **丟出漂流瓶**
     請輸入你想說的話，我會幫你找到合適的人～
     💡 提示：...
     [系統創建 throw session]

用戶: 你好，我是新用戶
Bot: ✅ 漂流瓶已丟出！
     你的瓶子正在漂向合適的人...
     [瓶子成功創建]
     [檢查並完成「丟出第一個瓶子」任務]
```

---

## 🎯 影響範圍

### 受影響功能
- ✅ 新手教學「丟出漂流瓶」按鈕
- ✅ 新手教學「撿起漂流瓶」按鈕
- ✅ 新手教學「查看任務」按鈕

### 不受影響功能
- ✅ 註冊流程
- ✅ 教學頁面顯示
- ✅ 「跳過」按鈕
- ✅ 其他所有命令

---

## 📝 技術細節

### 設計模式
使用 **Mock Message Pattern** 來模擬用戶發送命令：
```typescript
const mockMessage = {
  chat: { id: chatId },
  from: { id: parseInt(telegramId) },
  text: '/throw',
} as TelegramMessage;

await handleThrow(mockMessage, env);
```

### 優點
1. ✅ 重用現有的 `handleThrow` 邏輯
2. ✅ 不需要重複實現 session 創建
3. ✅ 保持代碼 DRY（Don't Repeat Yourself）
4. ✅ 確保行為一致性

### 注意事項
- 必須傳入完整的 `Env` 對象
- Mock message 必須包含 `chat.id` 和 `from.id`
- 函數簽名需要添加 `env` 參數

---

## 🚀 部署信息

### 部署環境
- **環境**: Staging
- **URL**: https://xunni-bot-staging.yves221.workers.dev
- **Version ID**: 881cb030-fce6-4682-af15-d67b9521780b
- **部署時間**: 2025-11-19 09:15 UTC

### 部署狀態
- ✅ 代碼上傳成功（814.25 KiB）
- ✅ Worker 啟動成功（2 ms）
- ✅ Triggers 部署成功
- ✅ 健康檢查通過（HTTP 200）

---

## 📋 後續行動

### 立即執行
1. ✅ 手動測試新手教學流程
2. ✅ 驗證三個按鈕都能正常工作
3. ✅ 確認任務完成檢測正常

### 可選優化
1. 🔧 添加自動化測試覆蓋新手教學流程
2. 🔧 監控新用戶完成率
3. 🔧 收集用戶反饋

---

## 📊 測試結果

### 自動化測試
- ✅ Lint: 0 錯誤
- ✅ 部署: 成功
- ✅ Worker: 正常運行

### 手動測試
- ⚠️ 待執行（需要新帳號測試）

---

**修復者**: AI Assistant  
**審核者**: _待填寫_  
**批准日期**: _待確認_

