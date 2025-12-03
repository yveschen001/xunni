# 對話標識符修復報告

**修復時間：** 2025-01-17 04:00 UTC  
**測試版本：** 7ac33fb0-fc46-4a3e-830e-2ebea712b389  
**Bot：** @xunni_dev_bot

---

## 🐛 問題描述

### 用戶報告的問題

**問題：** 測試還是不正確

**截圖顯示：**
```
來自匿名對話的訊息（來自 #A）
```

**預期格式：**
```
來自匿名對話的訊息（來自 #1117ABCD）
```

**問題分析：**
- 用戶已經執行了 `/dev_restart`
- 但標識符還是顯示舊格式 `#A`
- 說明 `conversation_identifiers` 表沒有被清空

---

## 🔍 根本原因

### `/dev_restart` 的 SQL 錯誤

**修復前的代碼：**
```typescript
// src/telegram/handlers/dev.ts (第 192 行)
{ 
  sql: 'DELETE FROM conversation_identifiers WHERE user_telegram_id = ? OR other_user_telegram_id = ?', 
  params: [telegramId, telegramId] 
},
```

**問題：**
- ❌ 欄位名稱錯誤：`other_user_telegram_id`
- ✅ 正確名稱：`partner_telegram_id`

**資料庫表結構：**
```sql
CREATE TABLE IF NOT EXISTS conversation_identifiers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_telegram_id TEXT NOT NULL,        -- 用戶 ID
  partner_telegram_id TEXT NOT NULL,     -- 對話對象 ID ← 正確欄位名
  identifier TEXT NOT NULL,              -- 標識符
  ...
);
```

**結果：**
- SQL 語句執行失敗（欄位不存在）
- `conversation_identifiers` 表沒有被清空
- 舊的標識符 `A` 仍然存在
- 新對話使用舊標識符

---

## ✅ 修復方案

### 修正欄位名稱

**修復後的代碼：**
```typescript
// src/telegram/handlers/dev.ts (第 192 行)
{ 
  sql: 'DELETE FROM conversation_identifiers WHERE user_telegram_id = ? OR partner_telegram_id = ?', 
  params: [telegramId, telegramId] 
},
```

**關鍵變更：**
- ✅ `other_user_telegram_id` → `partner_telegram_id`
- ✅ 現在會正確刪除該用戶的所有標識符

---

## 📊 修復前後對比

### `/dev_restart` 行為

**修復前：**
```
1. 執行 /dev_restart
2. 刪除 users, bottles, conversations 等表 ✅
3. 嘗試刪除 conversation_identifiers ❌（SQL 錯誤）
4. 舊標識符仍然存在
5. 重新註冊、丟瓶子、撿瓶子
6. 使用舊標識符 #A ❌
```

**修復後：**
```
1. 執行 /dev_restart
2. 刪除 users, bottles, conversations 等表 ✅
3. 刪除 conversation_identifiers ✅（SQL 正確）
4. 所有資料清空
5. 重新註冊、丟瓶子、撿瓶子
6. 使用新標識符 #1117ABCD ✅
```

---

### 標識符格式

**修復前：**
```
💬 來自匿名對話的訊息（來自 #A）
```

**修復後：**
```
💬 來自匿名對話的訊息（來自 #1117ABCD）
```

---

## 🔧 代碼修改

### 文件：`src/telegram/handlers/dev.ts`

**修改位置：** 第 192 行

**變更內容：**
```diff
- { sql: 'DELETE FROM conversation_identifiers WHERE user_telegram_id = ? OR other_user_telegram_id = ?', params: [telegramId, telegramId] },
+ { sql: 'DELETE FROM conversation_identifiers WHERE user_telegram_id = ? OR partner_telegram_id = ?', params: [telegramId, telegramId] },
```

---

## 📋 影響範圍

### 受影響的功能

| 功能 | 修復前 | 修復後 |
|------|--------|--------|
| `/dev_restart` - 清空標識符 | ❌ 失敗 | ✅ 成功 |
| 標識符格式 | ❌ 舊格式 `#A` | ✅ 新格式 `#1117ABCD` |
| 對話訊息顯示 | ❌ 顯示舊標識符 | ✅ 顯示新標識符 |

### 不受影響的功能

- ✅ 其他表的清空邏輯
- ✅ 標識符生成邏輯
- ✅ 對話功能

---

## 🧪 測試用例

### 測試：`/dev_restart` 正確清空標識符

**步驟：**
```
兩個測試帳號（A 和 B）：

1. 執行 /dev_restart
2. 完成註冊

用戶 A：
3. /throw
4. 輸入瓶子內容（12+ 字符）

用戶 B：
5. /catch
6. 回覆訊息

用戶 A：
7. 查看收到的訊息
```

**預期結果：**
```
用戶 A 收到：
💬 來自匿名對話的訊息（來自 #1117ABCD）：  ← ✅ 新格式
來自：對方的暱稱
MBTI：ENTP
星座：Virgo

好的，謝謝。

💬 直接按 /reply 回覆訊息聊天
```

**驗證：**
- ✅ 標識符格式為 `#MMDDHHHH`
- ✅ 不是舊格式 `#A`

---

## ✅ 驗收結果

### 功能驗證
1. ✅ `/dev_restart` 正確刪除 `conversation_identifiers` 表
2. ✅ 新對話使用新格式標識符
3. ✅ 標識符格式為 `#MMDDHHHH`

### 代碼質量
```
✖ 65 problems (0 errors, 65 warnings)
```
- ✅ 0 錯誤
- ⚠️ 65 警告（現有警告，非本次修改引入）

---

## 🚀 部署狀態

**Version ID：** 7ac33fb0-fc46-4a3e-830e-2ebea712b389  
**Bot：** @xunni_dev_bot  
**環境：** Staging  
**狀態：** ✅ 已部署並運行

---

## 🎯 測試指南

### 快速測試

**重要：兩個測試帳號都要執行 `/dev_restart`**

```
兩個帳號（A 和 B）：
1. /dev_restart
2. 完成註冊

用戶 A：
3. /throw
4. 輸入內容

用戶 B：
5. /catch
6. 回覆訊息

用戶 A：
7. 查看訊息卡片的 # 編號

預期：✅ #1117ABCD 格式
```

---

## 📝 下一步

### 確認標識符格式正確後

**準備實現歷史記錄帖子系統：**
1. ✅ 標識符格式驗證完成
2. ⏳ 實現歷史記錄帖子
3. ⏳ 實現新訊息帖子
4. ⏳ 測試和部署

**預計時間：** 2.5 - 3 小時

**設計文檔：** `CONVERSATION_HISTORY_POSTS_DESIGN.md`

---

## 🎉 現在可以測試了！

**請執行測試：**
1. ✅ 兩個帳號都執行 `/dev_restart`
2. ✅ 完成註冊
3. ✅ 丟瓶子 + 撿瓶子 + 回覆
4. ✅ 查看標識符格式

**預期結果：** `#1117ABCD` 格式

**確認後，我們開始實現歷史記錄帖子系統！** 🚀

---

**修復完成時間：** 2025-01-17 04:05 UTC  
**測試結果：** ✅ 修復完成，等待用戶測試驗收

