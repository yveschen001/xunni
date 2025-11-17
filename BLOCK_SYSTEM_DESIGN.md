# 封鎖系統設計文檔

**最後更新：** 2025-11-17

---

## 📋 系統概覽

XunNi Bot 有兩種封鎖機制：
1. **普通用戶封鎖**：封鎖當前對話的對方
2. **管理員封鎖**：直接封鎖任何用戶（等同於臨時封禁）

---

## 👥 封鎖類型

### 1. 普通用戶封鎖（User Block）

**定義**：用戶封鎖當前對話的對方，防止再次匹配

**使用方式**：
```bash
# 方式 1：命令封鎖（需要有活躍對話）
/block

# 方式 2：通過對話卡片按鈕
點擊對話卡片上的 "🚫 封鎖" 按鈕
```

**效果**：
- ✅ 立即結束當前對話
- ✅ 雙方不會再被匹配到
- ✅ 對方收到 "對話已結束" 通知（不透露封鎖）
- ✅ 記錄在 `user_blocks` 表中

**限制**：
- ❌ 只能封鎖當前對話的對方
- ❌ 不能封鎖沒有對話過的用戶
- ❌ 不影響對方使用 Bot 的其他功能

---

### 2. 管理員封鎖（Admin Block/Ban）

**定義**：管理員直接封禁用戶，禁止其使用 Bot

**使用方式**：
```bash
# 封禁命令
/admin_ban <user_id> [hours|permanent]  # 封禁用戶
/admin_unban <user_id>                   # 解除封禁
/admin_freeze <user_id> <hours>          # 暫時凍結（必須指定時長）

# 示例
/admin_ban 123456789           # 封禁 1 小時
/admin_ban 123456789 24        # 封禁 24 小時
/admin_ban 123456789 permanent # 永久封禁
/admin_unban 123456789         # 解除封禁
/admin_freeze 123456789 48     # 凍結 48 小時
```

**效果**：
- ✅ 用戶無法使用任何 Bot 功能
- ✅ Router 層攔截所有命令
- ✅ 顯示友善的封禁通知
- ✅ 記錄在 `bans` 表中
- ✅ 用戶可以通過 `/appeal` 申訴

**權限**：
- ✅ 普通管理員可以使用
- ✅ 超級管理員可以使用
- ❌ 普通用戶不能使用

---

## 🔄 封鎖流程

### 普通用戶封鎖流程

```
1. 用戶在對話中發送 /block
   或點擊對話卡片的 "🚫 封鎖" 按鈕
   ↓
2. 系統檢查是否有活躍對話
   ↓
3. 顯示確認提示
   ↓
4. 用戶確認封鎖
   ↓
5. 創建 user_blocks 記錄
   ↓
6. 結束對話（status = 'blocked'）
   ↓
7. 通知封鎖者：✅ 已封鎖
   ↓
8. 通知對方：💬 對話已結束（不透露封鎖）
```

### 管理員封鎖流程

```
1. 管理員發送 /admin_ban <user_id> [hours|permanent]
   ↓
2. 系統驗證管理員權限
   ↓
3. 計算封禁時長
   ↓
4. 創建 bans 記錄
   ↓
5. 更新 users 表（is_banned = 1）
   ↓
6. 發送封禁通知給用戶
   ↓
7. 確認消息給管理員
```

---

## 📊 數據庫設計

### user_blocks 表（普通用戶封鎖）

```sql
CREATE TABLE user_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  blocker_telegram_id TEXT NOT NULL,     -- 封鎖者
  blocked_telegram_id TEXT NOT NULL,     -- 被封鎖者
  conversation_id INTEGER,               -- 相關對話
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(blocker_telegram_id, blocked_telegram_id)
);
```

### bans 表（管理員封禁）

```sql
CREATE TABLE bans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  banned_by TEXT,                        -- 管理員 ID
  banned_at TEXT DEFAULT CURRENT_TIMESTAMP,
  banned_until TEXT,                     -- NULL = 永久
  is_active INTEGER DEFAULT 1,
  notes TEXT
);
```

---

## 🎯 使用場景

### 場景 1：普通用戶不想再聊

**情況**：用戶覺得對話不合適，想結束並避免再次匹配

**操作**：
```bash
1. 在對話中發送 /block
2. 或點擊對話卡片的 "🚫 封鎖" 按鈕
3. 確認封鎖
```

**結果**：
- 對話立即結束
- 雙方不會再被匹配到
- 對方不知道被封鎖（只知道對話結束）

---

### 場景 2：用戶違規，需要封禁

**情況**：用戶發送不當內容，被多次舉報

**操作**：
```bash
# 管理員查看舉報記錄
/admin_bans 123456789

# 封禁 24 小時
/admin_ban 123456789 24

# 或永久封禁
/admin_ban 123456789 permanent
```

**結果**：
- 用戶無法使用 Bot
- 收到友善的封禁通知
- 可以通過 `/appeal` 申訴

---

### 場景 3：管理員測試封禁功能

**情況**：管理員需要測試封禁系統

**操作**：
```bash
# 封禁測試帳號 1 小時
/admin_ban 7788737902 1

# 查看封禁記錄
/admin_bans 7788737902

# 批准申訴解封
/admin_approve 1
```

---

## 🔒 安全機制

### 1. 防止濫用封鎖
- ✅ 普通用戶只能封鎖有對話過的用戶
- ✅ 封鎖記錄不可刪除（只能查詢）
- ✅ 封鎖是單向的（A 封鎖 B，B 仍可使用 Bot）

### 2. 管理員權限保護
- ✅ 只有管理員可以使用 `/admin_ban`
- ✅ 管理員永不被封禁
- ✅ 超級管理員無法被移除

### 3. 用戶權益保護
- ✅ 封禁通知友善，不透露具體原因
- ✅ 用戶可以通過 `/appeal` 申訴
- ✅ 管理員需要審核申訴

---

## 📝 命令對比

| 命令 | 使用者 | 對象 | 效果 | 可申訴 |
|------|--------|------|------|--------|
| `/block` | 普通用戶 | 當前對話對方 | 雙方不再匹配 | ❌ |
| `/admin_ban <id> [hours]` | 管理員 | 任何用戶 | 禁止使用 Bot | ✅ |
| `/admin_unban <id>` | 管理員 | 被封禁用戶 | 立即解除封禁 | - |
| `/admin_freeze <id> <hours>` | 管理員 | 任何用戶 | 暫時凍結指定時長 | ✅ |
| `/admin_approve <id>` | 管理員 | 申訴用戶 | 批准申訴並解封 | - |

---

## 🎮 實現狀態

### ✅ 已實現
- [x] 普通用戶封鎖（`/block` 命令）
- [x] 對話卡片封鎖按鈕
- [x] 封鎖確認流程
- [x] `user_blocks` 表
- [x] 防止重複匹配邏輯

### ✅ 已實現（管理員）
- [x] 管理員封禁系統（`/admin_ban`）
- [x] 管理員解封系統（`/admin_unban`）
- [x] 管理員凍結系統（`/admin_freeze`）
- [x] `bans` 表
- [x] Router 層封禁檢查
- [x] 申訴系統（`/appeal`）
- [x] 管理員審核（`/admin_approve`, `/admin_reject`）

### 🔄 待優化
- [ ] 封鎖列表查詢（`/my_blocks`）
- [ ] 解除封鎖功能（`/unblock`）- 普通用戶解除自己的封鎖
- [ ] 封鎖統計（管理員查看）
- [ ] 批量封禁/解封功能

---

## 💡 使用建議

### 給普通用戶
1. **不合適就封鎖**：覺得對話不舒服，直接 `/block`
2. **不要濫用**：封鎖是永久的，無法解除
3. **舉報違規**：遇到違規內容，用 `/report` 而不是只封鎖

### 給管理員
1. **先警告**：首次違規可以警告，不要直接封禁
2. **查看記錄**：封禁前先用 `/admin_bans <id>` 查看歷史
3. **合理時長**：根據違規程度決定封禁時長
4. **及時審核**：定期查看 `/admin_appeals` 處理申訴

---

## 🔍 常見問題

### Q: 普通用戶如何封鎖？
A: 在對話中發送 `/block`，或點擊對話卡片的 "🚫 封鎖" 按鈕。

### Q: 封鎖後對方知道嗎？
A: 不知道。對方只會收到 "對話已結束" 的通知。

### Q: 可以解除封鎖嗎？
A: 目前不支持。封鎖是永久的。

### Q: 管理員如何封禁用戶？
A: 使用 `/admin_ban <user_id> [hours|permanent]`。

### Q: 被封禁的用戶可以申訴嗎？
A: 可以。使用 `/appeal` 提交申訴，管理員會審核。

### Q: 管理員會被封禁嗎？
A: 不會。管理員和超級管理員永不被封禁。

---

**維護者：** 開發團隊  
**相關文檔：**
- `ADMIN_SETUP_GUIDE.md` - 管理員設置
- `APPEAL_SYSTEM_MANUAL_TEST.md` - 申訴系統測試
- `BAN_SYSTEM_ACCEPTANCE_TEST.md` - 封禁系統測試

