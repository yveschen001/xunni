# 🚀 部署流程與安全規範 (Deployment Workflow & Safety Guidelines)

本文檔詳細定義了 XunNi 專案從開發到生產環境的完整部署流程，以及確保數據安全的強制規範。

## 1. 部署流水線 (Deployment Pipeline)

我們採用嚴格的三階段部署流程，確保代碼在進入生產環境前經過充分驗證。

### 階段 1：本地開發 (Local Development)
*   **環境**: 本地機器 (Localhost) / Cloudflare Preview
*   **數據**: 本地 SQLite (`.wrangler/state/v3/d1`)
*   **目標**: 功能開發、單元測試、模擬測試
*   **驗證標準**:
    1.  `pnpm lint` 通過（無語法錯誤）
    2.  `pnpm test` 通過（單元測試）
    3.  `./scripts/run-local-sim.sh` 通過（本地全流程模擬）

### 階段 2：預備環境 (Staging)
*   **環境**: `xunni-bot-staging.yves221.workers.dev`
*   **數據**: Cloudflare D1 Staging (獨立資料庫)
*   **目標**: 集成測試、數據庫遷移測試、客戶驗收
*   **驗證標準**:
    1.  部署成功無錯誤
    2.  數據庫 Migration 執行成功
    3.  關鍵功能（註冊、VIP、廣播）在 Staging 真機測試通過
    4.  **Bot 響應速度正常 (無死循環或超時)**

### 階段 3：生產環境 (Production)
*   **環境**: `xunni-bot.yves221.workers.dev` (建議綁定自定義域名)
*   **數據**: Cloudflare D1 Production (⚠️ 真實用戶數據)
*   **目標**: 對外服務
*   **操作原則**: **數據安全第一，寧可停機不可丟數據**

---

## 2. 數據安全與備份策略 (Data Safety)

**⚠️ 核心原則：生產環境數據神聖不可侵犯。**

### 2.1 數據庫備份 (D1 Database)
**💰 成本說明**: 幾乎為零。
*   **Cloudflare 自動備份**: 包含在 D1 費用中，遵循平台默認保留期（通常 30 天）。
*   **手動導出 (R2)**: 我們設定**保留 10 天**的生命週期規則 (Lifecycle Rule)，過期自動刪除。這足以應對絕大多數回滾需求，且極大節省空間。

雖然 Cloudflare D1 提供時間點恢復 (PITR)，但我們執行額外的安全措施：

1.  **自動快照**: Cloudflare D1 每日自動備份。
2.  **部署前備份**:
    在執行任何涉及 Schema 變更 (`migrations`) 的部署前，**必須**手動導出數據備份。
    ```bash
    # 導出命令 (示例)
    pnpm backup:db
    ```
    *(需實作該腳本導出 SQL 或 JSON)*

### 2.2 遷移安全規範 (Migration Safety)
禁止執行破壞性遷移（Destructive Migrations）：

*   ❌ **禁止**: `DROP TABLE` (刪除表)
*   ❌ **禁止**: `DROP COLUMN` (刪除列) - 除非該列已棄用超過 3 個版本
*   ❌ **禁止**: 修改列類型導致數據截斷 (如 `TEXT` -> `INT`)

**正確做法**:
*   新增列 (`ADD COLUMN`) 是安全的。
*   如需刪除，先重命名為 `deprecated_column`，觀察一周後再刪除。

### 2.3 停機維護模式 (Maintenance Mode)
當進行高風險更新（如核心資料庫重構）時，**必須**開啟維護模式，暫停用戶寫入數據，防止數據不一致。

*   **開啟**: `/maintenance_enable` (超級管理員指令)
*   **效果**: Bot 回覆「系統維護中」，拒絕所有用戶操作，但允許管理員操作。
*   **關閉**: `/maintenance_disable`

---

## 3. 環境隔離規範 (Environment Isolation)

**⚠️ 核心原則：開發、預備、生產環境必須嚴格物理隔離，防止數據污染。**

### 3.1 配置文件隔離
我們使用 `wrangler.toml` 的環境功能進行嚴格區分：

*   **Development**: 使用本地 `.wrangler/state` 或 Preview D1。
*   **Staging**: 使用 `[env.staging]` 區塊，綁定測試資料庫 (`xunni-db-staging`)。
*   **Production**: 使用 `[env.production]` 區塊，綁定生產資料庫 (`xunni-db-production`)。

**✅ 驗證方法**:
每次部署時，`wrangler` 會自動檢查綁定。請確保 `package.json` 中的命令明確指定環境：
*   `pnpm deploy:staging` -> `--env staging`
*   `pnpm deploy:production` -> `--env production`

### 3.2 Secrets 隔離
敏感資訊（如 API Keys）**不能**寫在代碼或 `wrangler.toml` 中，必須通過 Cloudflare Secrets 分別設置：

*   **Staging**: `wrangler secret put OPENAI_API_KEY --env staging`
*   **Production**: `wrangler secret put OPENAI_API_KEY --env production`

這確保了測試環境不會誤用生產環境的額度或密鑰。

---

## 4. 新功能開發規範 (Feature Development Norms)

為確保不影響線上環境，所有新功能必須遵循：

### 3.1 分支管理
*   `main`: 生產環境代碼（永遠保持可部署狀態）。
*   `develop`: 開發主分支。
*   `feat/xxx`: 新功能分支。

### 3.2 功能開關 (Feature Flags)
對於複雜或風險較高的新功能（如新版匹配算法），必須使用環境變數控制開關：

```toml
# wrangler.toml
[env.production.vars]
ENABLE_NEW_MATCHING = "false" # 默認關閉，觀察穩定後開啟
```

### 3.3 灰度發布 (Canary Release)
利用 VIP 或 Admin 群體先行測試：
*   代碼中判斷 `if (user.is_admin || user.is_vip)` 才啟用新邏輯。
*   確認無誤後再對全員開放。

---

## 4. 關於生產環境域名 (Production Domain)

**❓ 問：生產環境需要配置域名嗎？**

**✅ 答：強烈建議配置。**

雖然 `*.workers.dev` 可以使用，但自定義域名（如 `api.xunni.app` 或 `bot.xunni.app`）有以下決定性優勢：

1.  **抗風險能力**: 如果 Cloudflare Worker 子網域被污染或更換帳號（如您剛經歷的 GitHub 事件），自定義域名可以無縫切換到新 Worker，用戶無感。
2.  **品牌信任**: 用戶在授權頁面看到的網址更專業。
3.  **WAF 防護**: 可以配置更嚴格的 Cloudflare WAF 規則（DDoS 防護）。
4.  **法律合規**: 隱私條款連結使用 `xunni.app` 比 `workers.dev` 更符合合規要求。

**配置建議**:
*   在 Cloudflare Dashboard -> Workers -> Triggers -> Custom Domains 添加。
*   更新 `src/config/legal_urls.ts` 中的 `BASE_URL` 為新域名。

---

## 5. 部署檢查清單 (Deployment Checklist)

每次部署到 **Production** 前，必須勾選：

- [ ] ✅ **代碼凍結**: `main` 分支已合併所有測試過的代碼。
- [ ] ✅ **本地模擬**: `./scripts/run-local-sim.sh` 全部通過。
- [ ] ✅ **Staging 驗收**: 在 Staging Bot 上實際操作過新功能。
- [ ] ✅ **數據庫檢查**: `wrangler d1 migrations list --env production` 確認沒有未執行的破壞性遷移。
- [ ] ✅ **變更日誌**: 更新 `CHANGELOG.md`。
- [ ] ✅ **備份**: 確認 D1 備份狀態。

---

## 6. 快速迭代模式 (Streamlined Workflow)

**❓ 問：能否簡化流程，Staging 沒問題就直接上生產？**

**✅ 答：可以，前提是依賴自動化。**

我們設計了「最小可行安全路徑」，讓您在保持速度的同時不犧牲安全性：

1.  **本地自動化 (必做)**:
    *   執行 `./scripts/run-local-sim.sh` (全自動，耗時約 30秒)。
    *   **如果通過** 👉 代表邏輯 99% 正確。

2.  **Staging 快速驗收 (必做)**:
    *   執行 `pnpm deploy:staging`。
    *   **人工點測**: 只需測試**本次修改**的功能（例如改了 VIP 就只測 VIP）。
    *   **如果正常** 👉 視為「已完善」。

3.  **生產發布 (一鍵)**:
    *   執行 `pnpm deploy:production`。
    *   **最低健康測試**: 
        *   發送 `/stats` (確認資料庫連接正常)。
        *   發送 `/help` (確認 Bot 響應正常)。
        *   **完成**。

**核心理念**: 將 90% 的測試壓力放在「本地自動模擬」，Staging 只做最後的環境確認，Production 只做存活確認。

---

## 7. 相關文檔引用 (References)

在執行部署前，請參考以下文檔以獲取配置細節：

*   **`@doc/ENV_CONFIG.md`**: 詳細的環境變數與 Secrets 配置指南（包含如何設置隔離的環境變數）。
*   **`@doc/SPEC.md`**: 數據庫 Schema 定義與業務邏輯單一來源。
*   **`@doc/TESTING.md`**: 詳細的測試策略與本地模擬使用說明。

---

**文檔維護者**: DevOps Team
**最後更新**: 2025-01-23

