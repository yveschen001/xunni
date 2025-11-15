# XunNi 備份使用指南

> **本文檔已合併到 `@doc/BACKUP_STRATEGY.md`，請直接閱讀該文檔。**

**請閱讀**: `@doc/BACKUP_STRATEGY.md` - 完整的備份策略和使用指南

---

## 快速命令參考

```bash
# 本地備份
pnpm backup

# 推送到 GitHub
pnpm backup:push
```

---

## 原始內容（已遷移至 BACKUP_STRATEGY.md）

以下為原始內容，已整合到 `@doc/BACKUP_STRATEGY.md`：

## 1. 快速開始

### 1.1 本地備份

```bash
# 添加變更文件到暫存區
pnpm backup

# 或使用 npm
npm run backup
```

### 1.2 推送到 GitHub

```bash
# 推送到遠程倉庫
pnpm backup:push

# 或使用 npm
npm run backup:push
```

---

## 2. 備份原則

### 2.1 單向備份原則

⚠️ **重要**：所有備份操作只從本地推送到遠程，**絕對不會修改、刪除或覆蓋本地任何文件**

### 2.2 禁止的操作

以下 Git 命令**禁止使用**：
- `git pull`
- `git fetch`
- `git merge`
- `git reset --hard`
- `git checkout -f`

### 2.3 允許的操作

- `git status`（讀取）
- `git ls-tree`（讀取遠程）
- `git add`（staging）
- `git commit`（提交）
- `git push`（推送）

---

## 3. 備份腳本說明

### 3.1 backup.ts（本地備份）

**功能**：
- 檢查 Git 狀態
- 添加核心文件到暫存區
- 不執行提交（需要手動提交）

**使用**：
```bash
pnpm backup
```

**備份內容**：
- src/ 目錄（源代碼）
- tests/ 目錄（測試）
- doc/ 目錄（文檔）
- scripts/ 目錄（腳本）
- 配置文件（package.json, tsconfig.json, wrangler.toml）
- README.md

**排除內容**：
- node_modules/
- dist/
- .wrangler/
- coverage/
- *.log
- .env, .dev.vars（敏感資訊）

### 3.2 backup-push.ts（推送到遠程）

**功能**：
- 檢查是否有未提交的變更
- 檢查是否有未推送的提交
- 推送到遠程倉庫（單向，不拉取）

**使用**：
```bash
pnpm backup:push
```

**安全檢查**：
- 確保沒有未提交的變更
- 驗證遠程倉庫已設置
- 只推送，不拉取

### 3.3 backup-db.ts（資料庫備份）

**功能**：
- 導出 D1 資料庫
- 生成備份文件
- 壓縮備份（可選）

**使用**：
```bash
# 需要手動執行（因為需要 wrangler 配置）
wrangler d1 export xunni-db --output=backups/db-2025-01-15.sql
```

---

## 4. 備份流程

### 4.1 日常備份流程

```bash
# 1. 本地備份（添加文件到暫存區）
pnpm backup

# 2. 檢查變更（可選）
git status

# 3. 提交變更（如果需要）
git commit -m "feat: 新增功能"

# 4. 推送到遠程
pnpm backup:push
```

### 4.2 首次設置

```bash
# 1. 初始化 Git 倉庫（如果還沒有）
git init

# 2. 設置遠程倉庫
git remote add origin https://github.com/yveschen001/xunni.git

# 3. 設置分支
git branch -M main

# 4. 執行備份
pnpm backup

# 5. 提交
git commit -m "feat: 初始專案設置"

# 6. 推送
pnpm backup:push
```

---

## 5. 遠程倉庫信息

**倉庫 URL**：https://github.com/yveschen001/xunni

**分支**：main

**權限**：私有倉庫（只有 yveschen001 可以訪問）

---

## 6. 注意事項

### 6.1 敏感資訊

⚠️ **永遠不要提交以下文件**：
- .env
- .dev.vars
- *.key
- *.pem
- secrets/

這些文件已加入 .gitignore，但請確認不會意外提交。

### 6.2 大文件

如果檔案太大（> 100MB），GitHub 可能會拒絕。請：
- 使用 Git LFS（如果需要）
- 或排除大文件

### 6.3 備份頻率

建議：
- **開發中**：每次重要變更後立即備份
- **每日**：自動備份（可透過 GitHub Actions）

---

## 7. 故障排除

### 7.1 推送失敗

**問題**：推送被拒絕
**解決**：
1. 檢查是否有推送權限
2. 檢查遠程倉庫 URL 是否正確
3. 檢查網路連接

### 7.2 認證問題

**問題**：需要認證
**解決**：
1. 使用 GitHub Personal Access Token
2. 或使用 SSH 金鑰

### 7.3 衝突問題

**問題**：遠程有新的提交
**解決**：
⚠️ **不要使用 git pull**
- 檢查遠程提交：`git ls-remote origin main`
- 如果需要同步，手動處理（不在此備份策略範圍內）

---

## 8. GitHub Actions 自動備份（可選）

可以設置 GitHub Actions 自動備份：

```yaml
# .github/workflows/backup.yml
name: Backup

on:
  schedule:
    - cron: '0 2 * * *'  # 每天 02:00 UTC
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Backup database
        run: |
          # 備份資料庫邏輯
```

---

## 9. 驗證備份

### 9.1 檢查遠程倉庫

訪問：https://github.com/yveschen001/xunni

確認：
- 所有文件都已推送
- 提交記錄正確
- 分支正確

### 9.2 檢查本地狀態

```bash
# 檢查 Git 狀態
git status

# 檢查遠程狀態
git ls-remote origin main
```

---

## 10. 備份檢查清單

### 日常備份

- [ ] 執行 `pnpm backup`
- [ ] 檢查暫存區文件
- [ ] 提交變更（如需要）
- [ ] 執行 `pnpm backup:push`
- [ ] 驗證推送成功

### 定期備份

- [ ] 資料庫備份（每週）
- [ ] 檢查備份完整性
- [ ] 驗證遠程倉庫

---

**最後更新**：2025-01-15

