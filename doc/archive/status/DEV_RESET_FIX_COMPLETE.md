# /dev_reset 命令修復完成

**修復時間：** 2025-01-16  
**Version ID：** ce70d920-4451-4b62-9d1f-8a98344b3663  
**Bot：** @xunni_dev_bot

---

## 🐛 問題描述

用戶報告：`/dev_reset` 應該全清空，從頭開始

**問題：** 缺少新增的表，導致數據沒有完全清空：
- ❌ `invites` 表（邀請數據）
- ❌ `conversation_identifiers` 表（對話標識符）

---

## ✅ 修復內容

### 添加缺失的表到清空列表

**文件：** `src/telegram/handlers/dev.ts`

**修復前：**
```typescript
const tables = [
  // 1. 先刪除依賴其他表的數據
  { sql: 'DELETE FROM conversation_messages WHERE sender_telegram_id = ? OR receiver_telegram_id = ?', params: [telegramId, telegramId] },
  { sql: 'DELETE FROM bottle_chat_history WHERE user_a_telegram_id = ? OR user_b_telegram_id = ?', params: [telegramId, telegramId] },
  // ❌ 缺少 conversation_identifiers
  
  // 2. 刪除對話和漂流瓶
  { sql: 'DELETE FROM conversations WHERE user_a_telegram_id = ? OR user_b_telegram_id = ?', params: [telegramId, telegramId] },
  { sql: 'DELETE FROM bottles WHERE owner_telegram_id = ? OR matched_with_telegram_id = ?', params: [telegramId, telegramId] },
  
  // ❌ 缺少 invites
  
  // 3. 刪除用戶相關數據
  // ...
];
```

**修復後：**
```typescript
const tables = [
  // 1. 先刪除依賴其他表的數據
  { sql: 'DELETE FROM conversation_messages WHERE sender_telegram_id = ? OR receiver_telegram_id = ?', params: [telegramId, telegramId] },
  { sql: 'DELETE FROM conversation_identifiers WHERE user_telegram_id = ? OR other_user_telegram_id = ?', params: [telegramId, telegramId] }, // ✅ 新增
  { sql: 'DELETE FROM bottle_chat_history WHERE user_a_telegram_id = ? OR user_b_telegram_id = ?', params: [telegramId, telegramId] },
  
  // 2. 刪除對話和漂流瓶
  { sql: 'DELETE FROM conversations WHERE user_a_telegram_id = ? OR user_b_telegram_id = ?', params: [telegramId, telegramId] },
  { sql: 'DELETE FROM bottles WHERE owner_telegram_id = ? OR matched_with_telegram_id = ?', params: [telegramId, telegramId] },
  
  // 3. 刪除邀請相關數據
  { sql: 'DELETE FROM invites WHERE inviter_telegram_id = ? OR invitee_telegram_id = ?', params: [telegramId, telegramId] }, // ✅ 新增
  
  // 4. 刪除用戶相關數據
  // ...
];
```

---

## 📋 完整的清空列表

### `/dev_reset` 現在會清空以下所有數據：

#### 1️⃣ 依賴其他表的數據
- ✅ `conversation_messages` - 對話訊息
- ✅ `conversation_identifiers` - 對話標識符（#A, #B 等）
- ✅ `bottle_chat_history` - 瓶子聊天歷史

#### 2️⃣ 對話和漂流瓶
- ✅ `conversations` - 對話記錄
- ✅ `bottles` - 漂流瓶

#### 3️⃣ 邀請相關數據
- ✅ `invites` - 邀請記錄

#### 4️⃣ 用戶相關數據
- ✅ `daily_usage` - 每日使用記錄
- ✅ `reports` - 舉報記錄
- ✅ `bans` - 封禁記錄
- ✅ `user_blocks` - 用戶封鎖
- ✅ `mbti_test_progress` - MBTI 測試進度
- ✅ `payments` - 付款記錄
- ✅ `user_sessions` - 用戶 session
- ✅ `bottle_drafts` - 瓶子草稿

#### 5️⃣ 用戶本身
- ✅ `users` - 用戶資料

---

## 🧪 測試步驟

### 測試場景：完整重置流程

**步驟 1：建立一些數據**
```
1. 完成註冊流程
2. 丟一個瓶子：/throw
3. 撿一個瓶子：/catch
4. 發送對話訊息
5. 查看個人資料：/profile
```

**步驟 2：執行重置**
```
發送：/dev_reset
```

**預期結果：**
```
✅ **開發模式：數據已重置**

你的所有數據已被刪除。

💡 現在可以重新開始測試註冊流程。

⚠️ 注意：此功能僅在 Staging 環境可用。
```

**步驟 3：驗證清空**
```
1. 發送任何訊息 → 應該觸發語言選擇（新用戶流程）
2. 或發送 /start → 開始註冊流程
3. 確認所有數據都已清空
```

---

## 🔒 安全機制

### 環境隔離
**只在 Staging/Development 環境可用：**

```typescript
function isDevCommandAllowed(env: Env): boolean {
  const environment = env.ENVIRONMENT || 'development';
  return environment === 'development' || environment === 'staging';
}
```

**在 Production 環境會拒絕：**
```
❌ 此命令在生產環境中不可用。

This command is not available in production.
```

---

## 📝 其他開發命令

### `/dev_info` - 查看用戶信息
顯示當前用戶的詳細信息和統計數據：
- Telegram ID
- 昵稱
- 註冊步驟
- VIP 狀態
- 語言偏好
- 漂流瓶數量
- 對話數量
- 訊息數量

### `/dev_skip` - 跳過註冊流程
自動完成註冊，直接進入核心功能測試：
- 創建測試用戶
- 設置默認資料（性別、生日、星座等）
- 標記為已完成註冊

---

## 🚀 部署狀態

**環境：** Staging  
**Bot：** @xunni_dev_bot  
**Version ID：** ce70d920-4451-4b62-9d1f-8a98344b3663  
**部署時間：** 2025-01-16  
**狀態：** ✅ 已部署並運行

---

## 🎯 使用建議

### 測試註冊流程
```
1. /dev_reset  （清空所有數據）
2. 發送任何訊息  （觸發語言選擇）
3. 完成註冊流程
```

### 測試核心功能
```
1. /dev_skip  （跳過註冊）
2. /throw  （丟瓶子）
3. /catch  （撿瓶子）
4. 發送訊息  （測試對話）
```

### 重新開始測試
```
1. /dev_reset  （清空所有數據）
2. /dev_skip  （快速設置）
3. 開始測試
```

---

## ✅ 修復完成

**現在 `/dev_reset` 會完全清空所有用戶數據，包括：**
- ✅ 所有對話和訊息
- ✅ 所有漂流瓶
- ✅ 所有邀請記錄
- ✅ 所有對話標識符
- ✅ 所有用戶相關數據
- ✅ 用戶本身

**可以從頭開始測試註冊流程！** 🎉

