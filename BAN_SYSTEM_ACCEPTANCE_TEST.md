# 封禁系統驗收測試指南

**測試環境：** Staging  
**Bot：** @xunni_dev_bot  
**測試時間：** 2025-11-17

---

## 📋 測試前準備

### 1. 準備測試帳號
- **帳號 A**：主測試帳號（將被封禁）
- **帳號 B**：舉報者帳號 1
- **帳號 C**：舉報者帳號 2（可選）

### 2. 確認環境
```bash
# 確認 staging 數據庫有 bans 表
pnpm wrangler d1 execute xunni-db-staging --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name='bans';"

# 確認最新代碼已部署
# Version ID: eeda2243-09a1-4a90-9517-f023f225a31c
```

---

## 🧪 測試案例

### 測試 1：封禁檢查（路由層）

**目的：** 驗證路由層統一封禁檢查是否正常工作

**步驟：**
1. 使用帳號 A 完成註冊
2. 手動在數據庫中封禁帳號 A：
   ```bash
   pnpm wrangler d1 execute xunni-db-staging --remote --command="
   UPDATE users 
   SET is_banned = 1, 
       ban_reason = '測試封禁', 
       banned_at = datetime('now'),
       banned_until = datetime('now', '+1 hour'),
       ban_count = 1
   WHERE telegram_id = 'YOUR_TELEGRAM_ID';
   "
   ```
3. 使用帳號 A 發送任何消息（如 `/menu`）

**預期結果：**
- ✅ 收到友善的封禁通知
- ✅ 通知內容包含：
  - "⚠️ 帳號安全提醒" 或 "Account Security Notice"
  - "系統偵測到你的帳號存在異常行為" 或 "unusual activity"
  - 預計恢復時間
  - 暫停時長
  - `/rules` 引導
  - `/appeal` 申訴選項
- ✅ **不包含**具體原因（如"多次被舉報"）
- ✅ 無法使用任何功能

**驗收標準：**
- [ ] 封禁通知文案友善、專業
- [ ] 不透露具體封禁原因
- [ ] 時間顯示正確
- [ ] 引導用戶查看規範和申訴

---

### 測試 2：臨時封禁通知（1 次舉報 = 1 小時）

**目的：** 驗證 1 次舉報自動封禁 1 小時

**步驟：**
1. 帳號 A 和帳號 B 都完成註冊
2. 帳號 A 丟瓶子，帳號 B 撿到
3. 帳號 B 舉報帳號 A（使用 `/report`）
4. 觀察帳號 A 是否收到封禁通知

**預期結果：**
- ✅ 帳號 A 收到封禁通知
- ✅ 通知顯示：
  - "⚠️ 帳號安全提醒"
  - "系統偵測到異常行為"
  - 暫停時長：約 1 小時
  - 預計恢復時間（當前時間 + 1 小時）
  - `/rules` 和 `/appeal` 引導
- ✅ 數據庫中創建 `bans` 記錄
- ✅ `users` 表中 `is_banned = 1`, `ban_count = 1`

**驗收標準：**
- [ ] 自動封禁觸發正常
- [ ] 封禁時長正確（1 小時）
- [ ] 通知發送成功
- [ ] 數據庫記錄正確

---

### 測試 3：多次舉報（2 次 = 6 小時）

**目的：** 驗證多次舉報增加封禁時長

**步驟：**
1. 解封帳號 A（或使用新帳號）
2. 帳號 B 舉報帳號 A（第 1 次）
3. 等待 1 小時後解封
4. 帳號 C 舉報帳號 A（第 2 次，24 小時內）
5. 觀察封禁時長

**預期結果：**
- ✅ 第 2 次封禁時長為 6 小時
- ✅ `ban_count` 增加到 2
- ✅ 通知顯示正確的時長

**驗收標準：**
- [ ] 封禁時長隨舉報次數增加
- [ ] 24 小時內舉報計數正確

---

### 測試 4：永久封禁通知

**目的：** 驗證永久封禁的通知

**步驟：**
1. 手動設置帳號 A 為永久封禁：
   ```bash
   pnpm wrangler d1 execute xunni-db-staging --remote --command="
   UPDATE users 
   SET is_banned = 1, 
       ban_reason = '嚴重違規', 
       banned_at = datetime('now'),
       banned_until = NULL,
       ban_count = 4
   WHERE telegram_id = 'YOUR_TELEGRAM_ID';
   "
   ```
2. 使用帳號 A 發送任何消息

**預期結果：**
- ✅ 收到永久封禁通知
- ✅ 通知內容：
  - "⚠️ 帳號安全提醒"
  - "系統偵測到嚴重違規行為"
  - "經過 AI 安全審核後，你的帳號已被停用"
  - **不顯示**恢復時間
  - 引導人工審核申訴

**驗收標準：**
- [ ] 永久封禁通知正確
- [ ] 不顯示恢復時間
- [ ] 引導人工審核

---

### 測試 5：封禁後無法使用功能

**目的：** 驗證被封禁用戶無法使用任何功能

**步驟：**
1. 使用被封禁的帳號 A
2. 嘗試執行以下命令：
   - `/throw`
   - `/catch`
   - `/profile`
   - `/menu`
   - `/stats`
   - 發送普通消息

**預期結果：**
- ✅ 所有操作都被攔截
- ✅ 每次都收到封禁通知
- ✅ 無法使用任何功能

**驗收標準：**
- [ ] 所有功能都被正確攔截
- [ ] 統一顯示封禁通知

---

### 測試 6：封禁到期自動解除

**目的：** 驗證臨時封禁到期後自動解除

**步驟：**
1. 設置帳號 A 封禁 1 分鐘（測試用）：
   ```bash
   pnpm wrangler d1 execute xunni-db-staging --remote --command="
   UPDATE users 
   SET is_banned = 1, 
       banned_until = datetime('now', '+1 minute')
   WHERE telegram_id = 'YOUR_TELEGRAM_ID';
   "
   ```
2. 等待 1 分鐘
3. 使用帳號 A 發送消息

**預期結果：**
- ✅ 1 分鐘後可以正常使用
- ✅ 不再收到封禁通知
- ✅ 可以正常使用所有功能

**驗收標準：**
- [ ] 到期後自動解除
- [ ] 功能恢復正常

---

### 測試 7：多語言支援

**目的：** 驗證封禁通知的多語言支援

**步驟：**
1. 設置帳號 A 語言為英文：
   ```bash
   pnpm wrangler d1 execute xunni-db-staging --remote --command="
   UPDATE users 
   SET language_pref = 'en'
   WHERE telegram_id = 'YOUR_TELEGRAM_ID';
   "
   ```
2. 封禁帳號 A
3. 發送消息觸發封禁通知

**預期結果：**
- ✅ 收到英文封禁通知
- ✅ 內容包含：
  - "⚠️ Account Security Notice"
  - "unusual activity"
  - "Expected recovery time"
  - "/rules" and "/appeal"

**驗收標準：**
- [ ] 英文通知正確
- [ ] 時間格式正確（en-US）

---

## 📊 數據庫驗證

### 檢查 bans 表記錄

```bash
# 查詢所有封禁記錄
pnpm wrangler d1 execute xunni-db-staging --remote --command="
SELECT * FROM bans ORDER BY created_at DESC LIMIT 10;
"

# 查詢特定用戶的封禁記錄
pnpm wrangler d1 execute xunni-db-staging --remote --command="
SELECT * FROM bans WHERE user_id = 'YOUR_TELEGRAM_ID' ORDER BY created_at DESC;
"
```

**驗證項目：**
- [ ] `user_id` 正確
- [ ] `reason` 已記錄
- [ ] `risk_snapshot` 已記錄
- [ ] `ban_start` 時間正確
- [ ] `ban_end` 時間正確（臨時封禁）或 NULL（永久封禁）
- [ ] `created_at` 時間正確

### 檢查 users 表狀態

```bash
# 查詢用戶封禁狀態
pnpm wrangler d1 execute xunni-db-staging --remote --command="
SELECT telegram_id, is_banned, ban_reason, banned_at, banned_until, ban_count 
FROM users 
WHERE telegram_id = 'YOUR_TELEGRAM_ID';
"
```

**驗證項目：**
- [ ] `is_banned` 正確（1 = 封禁，0 = 正常）
- [ ] `ban_reason` 已記錄
- [ ] `banned_at` 時間正確
- [ ] `banned_until` 時間正確
- [ ] `ban_count` 正確累加

---

## ✅ 驗收檢查清單

### 功能完整性
- [ ] 路由層封禁檢查正常工作
- [ ] 自動封禁（基於舉報）正常觸發
- [ ] 封禁通知正確發送
- [ ] 封禁時長計算正確
- [ ] 臨時封禁到期自動解除
- [ ] 永久封禁無法自動解除
- [ ] 被封禁用戶無法使用任何功能

### 用戶體驗
- [ ] 封禁通知友善、專業
- [ ] 不透露具體封禁原因
- [ ] 引導用戶查看社群規範（/rules）
- [ ] 引導用戶申訴（/appeal）
- [ ] 多語言支援正常（zh-TW, en）

### 數據完整性
- [ ] `bans` 表記錄正確創建
- [ ] `users` 表狀態正確更新
- [ ] `ban_count` 正確累加
- [ ] 時間戳記錄正確

### 安全性
- [ ] 所有請求都經過封禁檢查
- [ ] 被封禁用戶無法繞過限制
- [ ] 封禁記錄完整追蹤

---

## 🐛 已知問題

（測試過程中發現的問題記錄在這裡）

---

## 📝 測試結果

**測試日期：** _____________  
**測試人員：** _____________  
**測試環境：** Staging  
**Bot Version：** eeda2243-09a1-4a90-9517-f023f225a31c

### 測試通過率
- 測試案例總數：7
- 通過：___
- 失敗：___
- 通過率：___%

### 問題總結
（記錄發現的問題和修復建議）

---

**維護者：** 開發團隊  
**最後更新：** 2025-11-17

