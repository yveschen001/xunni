# 管理員封禁系統測試指南

**最後更新：** 2025-11-17  
**測試環境：** Staging (@xunni_dev_bot)

---

## 📋 測試目標

驗證三種角色的封鎖/封禁功能：
1. **普通用戶**：只能封鎖當前對話對方
2. **普通管理員**：可以封禁/解封/凍結任何用戶
3. **超級管理員**：所有管理員權限 + 配置管理

---

## 👥 測試角色

### 測試帳號設置

| 角色 | Telegram ID | 用戶名 | 說明 |
|------|-------------|--------|------|
| **超級管理員** | `396943893` | @你的用戶名 | 硬編碼，最高權限 |
| **普通管理員** | `待添加` | @test_admin | 通過 ADMIN_USER_IDS 配置 |
| **普通用戶 A** | `待確認` | @test_user_a | 測試封鎖功能 |
| **普通用戶 B** | `待確認` | @test_user_b | 被封鎖/封禁對象 |

---

## 🧪 測試用例

### 測試 1：普通用戶封鎖功能

**前置條件：**
- 用戶 A 和用戶 B 已完成註冊
- 用戶 A 和用戶 B 有活躍對話

**測試步驟：**
1. 用戶 A 在對話中發送 `/block`
2. 確認封鎖提示
3. 點擊 "✅ 確定封鎖" 按鈕

**預期結果：**
- ✅ 用戶 A 收到：`✅ 已封鎖此使用者`
- ✅ 用戶 B 收到：`💬 對話已結束`（不透露封鎖）
- ✅ 對話狀態變為 `blocked`
- ✅ `user_blocks` 表中創建記錄
- ✅ 雙方不會再被匹配到

**測試命令：**
```bash
# 用戶 A
/block

# 驗證：查詢數據庫
SELECT * FROM user_blocks WHERE blocker_telegram_id = 'USER_A_ID';
SELECT * FROM conversations WHERE id = <conversation_id>;
```

---

### 測試 2：超級管理員封禁用戶

**前置條件：**
- 使用超級管理員帳號（396943893）
- 用戶 B 已註冊

**測試步驟：**

#### 2.1 封禁 1 小時（默認）
```bash
/admin_ban USER_B_ID
```

**預期結果：**
- ✅ 管理員收到確認消息（用戶 ID、暱稱、封禁時長、解封時間）
- ✅ 用戶 B 收到友善的封禁通知
- ✅ `bans` 表中創建記錄
- ✅ `users` 表中 `is_banned = 1`
- ✅ 用戶 B 無法使用任何命令

#### 2.2 封禁 24 小時
```bash
/admin_ban USER_B_ID 24
```

**預期結果：**
- ✅ 封禁時長為 24 小時
- ✅ 解封時間正確計算

#### 2.3 永久封禁
```bash
/admin_ban USER_B_ID permanent
```

**預期結果：**
- ✅ `banned_until` 為 NULL
- ✅ 通知消息顯示 "永久"

**驗證命令：**
```bash
# 查詢封禁記錄
SELECT * FROM bans WHERE user_id = 'USER_B_ID' ORDER BY banned_at DESC;

# 查詢用戶狀態
SELECT telegram_id, nickname, is_banned, ban_reason, banned_until 
FROM users WHERE telegram_id = 'USER_B_ID';
```

---

### 測試 3：超級管理員解除封禁

**前置條件：**
- 用戶 B 已被封禁

**測試步驟：**
```bash
/admin_unban USER_B_ID
```

**預期結果：**
- ✅ 管理員收到確認消息
- ✅ 用戶 B 收到解封通知
- ✅ `users` 表中 `is_banned = 0`
- ✅ `bans` 表中相關記錄 `is_active = 0`
- ✅ 用戶 B 可以正常使用所有功能

**驗證命令：**
```bash
# 查詢用戶狀態
SELECT telegram_id, nickname, is_banned, ban_reason 
FROM users WHERE telegram_id = 'USER_B_ID';

# 查詢封禁記錄
SELECT * FROM bans WHERE user_id = 'USER_B_ID' ORDER BY banned_at DESC;
```

---

### 測試 4：超級管理員凍結用戶

**前置條件：**
- 用戶 B 未被封禁

**測試步驟：**
```bash
/admin_freeze USER_B_ID 48
```

**預期結果：**
- ✅ 管理員收到確認消息（凍結時長：2 天）
- ✅ 用戶 B 收到凍結通知
- ✅ `bans` 表中創建記錄（reason: "管理員凍結"）
- ✅ 凍結時長為 48 小時
- ✅ 用戶 B 無法使用任何命令

**驗證命令：**
```bash
# 查詢封禁記錄
SELECT * FROM bans WHERE user_id = 'USER_B_ID' ORDER BY banned_at DESC;
```

---

### 測試 5：查看封禁記錄

**測試步驟：**

#### 5.1 查看所有封禁記錄
```bash
/admin_bans
```

**預期結果：**
- ✅ 顯示最近 10 條封禁記錄
- ✅ 包含用戶 ID、原因、時間、狀態

#### 5.2 查看特定用戶封禁歷史
```bash
/admin_bans USER_B_ID
```

**預期結果：**
- ✅ 顯示該用戶的所有封禁記錄
- ✅ 包含封禁次數、當前狀態

---

### 測試 6：被封禁用戶嘗試使用 Bot

**前置條件：**
- 用戶 B 已被封禁

**測試步驟：**
```bash
# 用戶 B 嘗試各種命令
/menu
/throw
/catch
/profile
```

**預期結果：**
- ✅ 所有命令都被 Router 層攔截
- ✅ 顯示友善的封禁通知
- ✅ 臨時封禁顯示剩餘時間
- ✅ 永久封禁顯示申訴提示

---

### 測試 7：被封禁用戶申訴

**前置條件：**
- 用戶 B 已被封禁

**測試步驟：**
```bash
# 用戶 B
/appeal

# 輸入申訴理由
這是誤判，我沒有違規

# 管理員查看申訴
/admin_appeals

# 管理員批准申訴
/admin_approve 1 經審核確認為誤判
```

**預期結果：**
- ✅ 用戶 B 可以提交申訴
- ✅ 管理員可以看到待審核申訴
- ✅ 批准後用戶 B 自動解封
- ✅ 用戶 B 收到批准通知

---

### 測試 8：管理員無法封禁管理員

**前置條件：**
- 使用超級管理員帳號

**測試步驟：**
```bash
# 嘗試封禁自己
/admin_ban 396943893

# 嘗試封禁另一個管理員（如果有）
/admin_ban ADMIN_ID
```

**預期結果：**
- ✅ 顯示錯誤：`❌ 無法封禁管理員帳號。`
- ✅ 不創建任何封禁記錄

---

### 測試 9：普通管理員權限測試

**前置條件：**
- 添加一個普通管理員到 `ADMIN_USER_IDS`
- 重新部署

**測試步驟：**
```bash
# 普通管理員執行各種命令
/admin_ban USER_B_ID 1
/admin_unban USER_B_ID
/admin_freeze USER_B_ID 24
/admin_bans
/admin_appeals
```

**預期結果：**
- ✅ 所有管理員命令都可以使用
- ✅ 無法修改配置文件
- ✅ 無法使用超級管理員專屬命令（/dev_reset, /broadcast）

---

### 測試 10：錯誤處理

**測試步驟：**

#### 10.1 封禁不存在的用戶
```bash
/admin_ban 999999999
```

**預期結果：**
- ✅ 顯示：`❌ 用戶不存在。`

#### 10.2 解封未被封禁的用戶
```bash
/admin_unban USER_A_ID
```

**預期結果：**
- ✅ 顯示：`❌ 此用戶未被封禁。`

#### 10.3 錯誤的命令格式
```bash
/admin_ban
/admin_freeze USER_B_ID
/admin_freeze USER_B_ID abc
```

**預期結果：**
- ✅ 顯示使用方法錯誤提示
- ✅ 顯示正確格式和示例

---

## 📊 測試檢查清單

### 普通用戶功能
- [ ] `/block` 命令正常工作
- [ ] 封鎖確認流程正確
- [ ] 對話卡片封鎖按鈕可用
- [ ] 封鎖後雙方不再匹配
- [ ] 對方不知道被封鎖

### 管理員封禁功能
- [ ] `/admin_ban` 封禁 1 小時
- [ ] `/admin_ban` 封禁自定義時長
- [ ] `/admin_ban` 永久封禁
- [ ] `/admin_unban` 解除封禁
- [ ] `/admin_freeze` 暫時凍結
- [ ] `/admin_bans` 查看記錄
- [ ] `/admin_bans <user_id>` 查看用戶歷史

### 申訴系統
- [ ] 被封禁用戶可以申訴
- [ ] 管理員可以查看申訴
- [ ] 管理員可以批准申訴
- [ ] 管理員可以拒絕申訴
- [ ] 批准後自動解封

### 安全機制
- [ ] 管理員無法封禁管理員
- [ ] 被封禁用戶無法使用 Bot
- [ ] Router 層正確攔截
- [ ] 友善的封禁通知
- [ ] 完整的操作記錄

### 權限分離
- [ ] 普通用戶只能封鎖對話對方
- [ ] 普通管理員可以使用所有管理員命令
- [ ] 超級管理員有所有權限
- [ ] `/help` 顯示正確的命令列表

---

## 🔍 數據庫驗證

### 查詢封禁記錄
```sql
-- 查看所有活躍封禁
SELECT b.*, u.nickname 
FROM bans b
LEFT JOIN users u ON b.user_id = u.telegram_id
WHERE b.is_active = 1
ORDER BY b.banned_at DESC;

-- 查看特定用戶封禁歷史
SELECT * FROM bans 
WHERE user_id = 'USER_ID' 
ORDER BY banned_at DESC;
```

### 查詢用戶封鎖記錄
```sql
-- 查看用戶封鎖記錄
SELECT 
  ub.*,
  u1.nickname as blocker_nickname,
  u2.nickname as blocked_nickname
FROM user_blocks ub
LEFT JOIN users u1 ON ub.blocker_telegram_id = u1.telegram_id
LEFT JOIN users u2 ON ub.blocked_telegram_id = u2.telegram_id
ORDER BY ub.created_at DESC;
```

---

## 📝 測試記錄模板

```
測試日期：____________________
測試環境：[ ] Staging  [ ] Production
測試人員：____________________

測試 1：普通用戶封鎖
- 結果：[ ] 通過  [ ] 失敗
- 備註：____________________

測試 2：超級管理員封禁
- 2.1 封禁 1 小時：[ ] 通過  [ ] 失敗
- 2.2 封禁 24 小時：[ ] 通過  [ ] 失敗
- 2.3 永久封禁：[ ] 通過  [ ] 失敗
- 備註：____________________

測試 3：超級管理員解封
- 結果：[ ] 通過  [ ] 失敗
- 備註：____________________

測試 4：超級管理員凍結
- 結果：[ ] 通過  [ ] 失敗
- 備註：____________________

測試 5：查看封禁記錄
- 5.1 查看所有記錄：[ ] 通過  [ ] 失敗
- 5.2 查看用戶歷史：[ ] 通過  [ ] 失敗
- 備註：____________________

測試 6：被封禁用戶攔截
- 結果：[ ] 通過  [ ] 失敗
- 備註：____________________

測試 7：申訴流程
- 結果：[ ] 通過  [ ] 失敗
- 備註：____________________

測試 8：管理員保護
- 結果：[ ] 通過  [ ] 失敗
- 備註：____________________

測試 9：普通管理員權限
- 結果：[ ] 通過  [ ] 失敗
- 備註：____________________

測試 10：錯誤處理
- 10.1 不存在的用戶：[ ] 通過  [ ] 失敗
- 10.2 未封禁的用戶：[ ] 通過  [ ] 失敗
- 10.3 錯誤格式：[ ] 通過  [ ] 失敗
- 備註：____________________

總結：____________________
```

---

## 🚀 快速測試腳本

```bash
# 1. 封禁測試用戶
/admin_ban 7788737902 1

# 2. 查看封禁記錄
/admin_bans 7788737902

# 3. 解除封禁
/admin_unban 7788737902

# 4. 凍結 48 小時
/admin_freeze 7788737902 48

# 5. 再次解封
/admin_unban 7788737902
```

---

**維護者：** 開發團隊  
**相關文檔：**
- `BLOCK_SYSTEM_DESIGN.md` - 封鎖系統設計
- `ADMIN_SETUP_GUIDE.md` - 管理員設置
- `APPEAL_SYSTEM_MANUAL_TEST.md` - 申訴系統測試

