# 管理員設置指南

**最後更新：** 2025-11-17

---

## 📋 管理員系統概覽

XunNi Bot 有兩種管理員角色：

### 🔱 超級管理員（God/上帝）
- **Telegram ID**: `396943893`
- **權限**: 最高權限，包括：
  - ✅ 所有普通管理員權限
  - ✅ 管理配置文件
  - ✅ 添加/移除普通管理員
  - ✅ **永不被封禁**
  - ✅ 訪問所有系統功能

### 👮 普通管理員（Admin）
- **配置方式**: 通過環境變數 `ADMIN_USER_IDS`
- **權限**: 基本管理權限，包括：
  - ✅ 處理用戶申訴
  - ✅ 查看封禁記錄
  - ✅ 批准/拒絕申訴
  - ✅ **永不被封禁**
  - ❌ 不能修改配置

**注意**: 超級管理員 `396943893` 始終自動包含在管理員列表中，無需在 `ADMIN_USER_IDS` 中添加。

---

## 🔑 如何獲取你的 Telegram ID

### 方法 1：使用 Bot 命令（推薦）
1. 在 Telegram 中打開 @xunni_dev_bot（Staging）或 @xunni_bot（Production）
2. 發送 `/dev_info` 命令
3. Bot 會返回你的 Telegram ID

### 方法 2：使用第三方 Bot
1. 在 Telegram 中搜索 `@userinfobot`
2. 點擊 "Start"
3. Bot 會自動返回你的 ID

---

## ⚙️ 設置管理員

### Staging 環境

#### 方法 1：通過 wrangler.toml（當前方法）

編輯 `wrangler.toml` 文件：

```toml
[env.staging.vars]
# 添加普通管理員（超級管理員 396943893 自動包含，無需添加）
ADMIN_USER_IDS = ""  # 空字符串表示只有超級管理員
# 或
ADMIN_USER_IDS = "123456789"  # 單個普通管理員
# 或
ADMIN_USER_IDS = "123456789,987654321"  # 多個普通管理員（逗號分隔）
```

**添加新普通管理員：**
1. 獲取新管理員的 Telegram ID
2. 在 `ADMIN_USER_IDS` 中添加該 ID（逗號分隔）
3. **不要添加 `396943893`**（超級管理員自動包含）
4. 重新部署：`pnpm deploy:staging`

#### 方法 2：通過 Cloudflare Dashboard（推薦生產環境）

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 進入 Workers & Pages
3. 選擇 `xunni-bot-staging`
4. 點擊 "Settings" → "Variables"
5. 添加環境變數：
   - **Name**: `ADMIN_USER_IDS`
   - **Value**: `123456789,987654321` （普通管理員 ID，逗號分隔）
   - **注意**: 不要添加 `396943893`（超級管理員自動包含）
6. 點擊 "Save"
7. 重新部署 Worker

---

### Production 環境

**⚠️ 生產環境建議使用 Cloudflare Dashboard 設置，避免將管理員 ID 提交到 Git**

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 進入 Workers & Pages
3. 選擇 `xunni-bot`（生產環境）
4. 點擊 "Settings" → "Variables"
5. 添加環境變數：
   - **Name**: `ADMIN_USER_IDS`
   - **Value**: `123456789,987654321` （普通管理員 ID）
   - **注意**: 不要添加 `396943893`（超級管理員自動包含）
6. 點擊 "Save"
7. 重新部署：`pnpm deploy:production`

---

## 👥 管理員權限

管理員可以使用以下命令：

### 封禁管理
- `/admin_bans` - 查看最近 10 條封禁記錄
- `/admin_bans <user_id>` - 查看特定用戶的封禁歷史

### 申訴管理
- `/admin_appeals` - 查看待審核申訴列表
- `/admin_approve <appeal_id> [備註]` - 批准申訴並解封用戶
- `/admin_reject <appeal_id> [備註]` - 拒絕申訴

### 示例

```bash
# 查看所有待審核申訴
/admin_appeals

# 批准申訴 ID 1
/admin_approve 1 經審核確認為誤判

# 拒絕申訴 ID 2
/admin_reject 2 經審核確認原判定正確

# 查看用戶 123456789 的封禁歷史
/admin_bans 123456789
```

---

## 🔒 安全建議

### 1. 保護管理員 ID
- ❌ **不要**將管理員 ID 公開分享
- ❌ **不要**將生產環境的管理員 ID 提交到 Git
- ✅ **使用** Cloudflare Dashboard 設置生產環境管理員
- ✅ **定期審查**管理員列表

### 2. 管理員帳號安全
- ✅ 啟用 Telegram 兩步驗證
- ✅ 使用強密碼
- ✅ 不要在公共設備上登入

### 3. 權限管理
- ✅ 只授予信任的人管理員權限
- ✅ 定期審查管理員操作日誌
- ✅ 移除不再需要的管理員

---

## 📝 管理員操作日誌

所有管理員操作都會記錄在 `appeals` 表中：

```sql
-- 查詢管理員操作記錄
SELECT 
  a.id,
  a.user_id,
  a.status,
  a.reviewed_by,
  a.review_notes,
  a.reviewed_at
FROM appeals a
WHERE a.reviewed_by IS NOT NULL
ORDER BY a.reviewed_at DESC
LIMIT 50;
```

---

## 🚀 快速開始

### 1. 獲取你的 Telegram ID
```
發送 /dev_info 到 @xunni_dev_bot
```

### 2. 添加為管理員（Staging）
```bash
# 編輯 wrangler.toml
vim wrangler.toml

# 找到這一行並添加你的 ID（不要添加 396943893，它是超級管理員）
ADMIN_USER_IDS = "YOUR_TELEGRAM_ID"

# 部署
pnpm deploy:staging
```

### 3. 測試管理員權限
```
發送 /admin_appeals 到 @xunni_dev_bot
```

如果你看到申訴列表（或 "目前沒有待審核的申訴"），說明設置成功！

---

## ❓ 常見問題

### Q: 如何移除普通管理員？
A: 從 `ADMIN_USER_IDS` 中刪除對應的 ID，然後重新部署。**超級管理員 `396943893` 無法移除**。

### Q: 管理員可以互相管理嗎？
A: 
- **超級管理員**：可以添加/移除普通管理員（通過修改 `ADMIN_USER_IDS`）
- **普通管理員**：不能添加或移除其他管理員

### Q: 如何查看當前有哪些管理員？
A: 
- **超級管理員**: 始終是 `396943893`
- **普通管理員**: 
  - Staging: 查看 `wrangler.toml` 中的 `ADMIN_USER_IDS`
  - Production: 在 Cloudflare Dashboard 中查看環境變數

### Q: 管理員 ID 設置錯誤怎麼辦？
A: 重新編輯 `ADMIN_USER_IDS` 並重新部署即可。

### Q: 為什麼我的管理員命令不起作用？
A: 檢查：
1. 你的 ID 是否正確添加到 `ADMIN_USER_IDS`
2. 是否重新部署了 Worker
3. 是否在正確的環境（Staging/Production）

---

## 📊 管理員統計

查詢管理員活動統計：

```sql
-- 每個管理員的審核數量
SELECT 
  reviewed_by,
  COUNT(*) as total_reviews,
  SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
  SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
FROM appeals
WHERE reviewed_by IS NOT NULL
GROUP BY reviewed_by;
```

---

**維護者：** 開發團隊  
**聯繫方式：** 如有問題請聯繫主管理員

