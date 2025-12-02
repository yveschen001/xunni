# XunNi 備份策略

## 1. 備份原則

### 1.1 單向備份原則

⚠️ **重要**：所有備份操作只從本地推送到遠程，**絕對不會修改、刪除或覆蓋本地任何文件**

### 1.2 禁止的操作

以下 Git 命令**禁止使用**：
- `git pull`
- `git fetch`
- `git merge`
- `git reset --hard`
- `git checkout -f`

### 1.3 允許的操作

- `git status`（讀取）
- `git ls-tree`（讀取遠程）
- `git add`（staging）
- `git commit`（提交）
- `git push`（推送）

---

## 2. 備份內容

### 2.1 代碼備份

- 所有源代碼檔案
- 配置文件（不含敏感資訊）
- 文檔

### 2.2 資料庫備份

- D1 資料庫完整導出
- 遷移腳本
- Schema 定義

### 2.3 配置備份

- 環境變數清單（不含實際值）
- Wrangler 配置
- 部署腳本

### 2.4 永久保存記錄 (Permanent Records)
   
   以下資料表涉及金流與用戶核心權益，必須**永久保存**，禁止物理刪除（Physical Delete）：
   
   *   `payment_transactions` (儲值/消費記錄)
   *   `fortune_history` (算命結果 - 承諾保存 3 年，但建議永久歸檔)
   *   `users` (核心用戶表 - 僅可標記 deleted_at)
   
   **策略**: 使用 `deleted_at` 欄位進行軟刪除 (Soft Delete)，而非 `DELETE FROM`。
   
   ---
   
   ## 3. 備份流程

### 3.1 本地備份

#### 3.1.1 智能備份腳本

建立 `scripts/backup.ts`：

```typescript
// scripts/backup.ts

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * 智能備份：只備份核心代碼，跳過構建產物和已存在於遠程的大文件
 */
async function backup() {
  console.log('🔄 開始備份...');
  
  // 1. 檢查 Git 狀態
  try {
    execSync('git status', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Git 狀態檢查失敗');
    process.exit(1);
  }
  
  // 2. 只添加核心文件
  const coreFiles = [
    'src/**/*.ts',
    'src/**/*.sql',
    'tests/**/*.ts',
    'doc/**/*.md',
    'package.json',
    'tsconfig.json',
    'wrangler.toml',
    '.gitignore',
  ];
  
  // 3. 排除構建產物
  const excludePatterns = [
    'node_modules',
    'dist',
    '.wrangler',
    'coverage',
    '*.log',
    '*.zip',
    '*.tar',
    '*.tar.gz',
    '*.rar',
    '*.7z',
    '*.tmp',
  ];
  
  // 4. 執行備份
  try {
    // 只添加變更的文件
    execSync('git add -u', { stdio: 'inherit' });
    
    // 添加新文件（但跳過大文件）
    execSync('git add src/ tests/ doc/ *.json *.toml', { stdio: 'inherit' });
    
    console.log('✅ 備份完成');
  } catch (error) {
    console.error('❌ 備份失敗:', error);
    process.exit(1);
  }
}

backup();
```

#### 3.1.2 使用備份腳本

```bash
# 本地備份
pnpm backup

# 或使用 npm
npm run backup
```

### 3.2 推送到 GitHub

#### 3.2.1 智能推送腳本

建立 `scripts/backup-push.ts`：

```typescript
// scripts/backup-push.ts

import { execSync } from 'child_process';

/**
 * 推送到遠程倉庫（私庫）
 */
async function backupPush() {
  console.log('🚀 開始推送到遠程...');
  
  try {
    // 1. 檢查是否有未提交的變更
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    if (status.trim()) {
      console.log('⚠️  發現未提交的變更，請先執行 pnpm backup');
      process.exit(1);
    }
    
    // 2. 檢查是否有未推送的提交
    const ahead = execSync('git rev-list --count @{u}..HEAD', { encoding: 'utf-8' }).trim();
    if (ahead === '0') {
      console.log('ℹ️  沒有需要推送的提交');
      return;
    }
    
    // 3. 推送到遠程
    execSync('git push origin main', { stdio: 'inherit' });
    
    console.log('✅ 推送完成');
  } catch (error) {
    console.error('❌ 推送失敗:', error);
    process.exit(1);
  }
}

backupPush();
```

#### 3.2.2 使用推送腳本

```bash
# 推送到私庫
pnpm backup:push
```

### 3.3 資料庫備份

#### 3.3.1 D1 資料庫導出

```bash
# 導出資料庫
wrangler d1 export xunni-db --output=backups/db-$(date +%Y%m%d-%H%M%S).sql

# 壓縮備份
gzip backups/db-*.sql
```

#### 3.3.2 自動化資料庫備份腳本

建立 `scripts/backup-db.ts`：

```typescript
// scripts/backup-db.ts

import { execSync } from 'child_process';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

async function backupDatabase() {
  const backupDir = join(process.cwd(), 'backups');
  
  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `db-${timestamp}.sql`;
  const filepath = join(backupDir, filename);
  
  console.log(`📦 備份資料庫到 ${filepath}...`);
  
  try {
    execSync(`wrangler d1 export xunni-db --output=${filepath}`, {
      stdio: 'inherit',
    });
    
    console.log('✅ 資料庫備份完成');
  } catch (error) {
    console.error('❌ 資料庫備份失敗:', error);
    process.exit(1);
  }
}

backupDatabase();
```

---

## 4. 備份頻率

### 4.1 代碼備份

- **開發中**: 每次重要變更後立即備份
- **每日**: 自動備份（透過 Cron 或 CI/CD）

### 4.2 資料庫備份

- **每日**: 自動備份到本地和遠程
- **每週**: 完整備份歸檔
- **每月**: 長期歸檔備份

---

## 5. 備份存儲

### 5.1 本地存儲

```
backups/
├── db/
│   ├── db-20250115-120000.sql.gz
│   └── db-20250116-120000.sql.gz
└── code/
    └── snapshots/
```

### 5.2 遠程存儲

- **GitHub Private Repository**: 代碼備份
- **Cloudflare R2** (可選): 資料庫備份
- **本地硬碟**: 定期歸檔

---

## 6. 還原流程

### 6.1 代碼還原

```bash
# 從遠程倉庫還原
git clone <private-repo-url>
cd XunNi
npm install
```

### 6.2 資料庫還原

```bash
# 從備份還原
wrangler d1 execute xunni-db --file=backups/db-20250115-120000.sql
```

### 6.3 個人資料還原 (Individual User Restoration)
   
   ⚠️ **場景**: 當特定用戶資料損壞或被誤刪，需要單獨恢復而不影響其他用戶。
   
   **步驟**:
   1.  **定位備份**: 找到問題發生前的最近一份 `.sql` 備份檔。
   2.  **提取數據**: 使用 `grep` 或腳本從備份檔中提取該 `telegram_id` 相關的 INSERT 語句。
       ```bash
       grep "INSERT INTO users" backup.sql | grep "'12345678'" > restore_user.sql
       ```
   3.  **驗證 SQL**: 檢查提取出的 SQL 是否完整且安全。
   4.  **執行修復**:
       ```bash
       wrangler d1 execute xunni-db --file=restore_user.sql
       ```
   
   ---
   
   ## 7. 自動化備份

### 7.1 GitHub Actions

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
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Backup database
        run: |
          wrangler d1 export xunni-db --output=backup.sql
          gzip backup.sql
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      
      - name: Upload backup
        uses: actions/upload-artifact@v3
        with:
          name: db-backup
          path: backup.sql.gz
          retention-days: 30
```

### 7.2 Cloudflare Cron

```typescript
// src/telegram/handlers/cron_backup.ts

export async function handleBackupCron(env: Env, db: D1Database): Promise<void> {
  // 導出資料庫
  // 上傳到 R2 或發送到備份服務
}
```

---

## 8. 備份驗證

### 8.1 備份完整性檢查

```typescript
// scripts/verify-backup.ts

async function verifyBackup(backupFile: string): Promise<boolean> {
  // 1. 檢查檔案是否存在
  // 2. 檢查檔案大小
  // 3. 驗證 SQL 語法
  // 4. 測試還原（可選）
  return true;
}
```

---

## 9. 安全考量

1. **敏感資訊**: 永遠不要備份包含實際 API Key 的檔案
2. **加密**: 敏感備份應加密存儲
3. **權限**: 備份檔案應設定適當的讀取權限
4. **訪問控制**: 限制備份存儲的訪問權限

---

## 10. 備份檢查清單

### 每日檢查

- [ ] 代碼變更已提交
- [ ] 資料庫備份已執行
- [ ] 備份檔案完整性驗證

### 每週檢查

- [ ] 備份歸檔已建立
- [ ] 遠程備份已同步
- [ ] 還原測試已執行

### 每月檢查

- [ ] 長期歸檔已建立
- [ ] 備份策略檢討
- [ ] 備份存儲空間檢查

