# Smoke Test 優化計畫：智慧自治版 (Smart Autonomous Smoke Test)

## 1. 核心目標：零維護、自我修復

除了基礎的速度優化外，本計畫旨在建立一個**「不需人工介入」**的測試系統。當測試失敗時，系統應具備自我診斷與修復能力，而非僅僅報錯。

### 關鍵承諾
1.  **絕對安全**：任何「寫入/修復」操作前，自動建立代碼快照。修復失敗自動回滾。
2.  **智慧重試**：區分「網絡抖動」與「代碼錯誤」，避免無意義的報錯。
3.  **閉環修復**：測試失敗 -> 生成診斷 -> AI Agent 執行修復 -> 重測驗證。

---

## 2. 架構升級 (Architecture Upgrade)

### A. 智慧執行器 (Smart Runner)

引入 `SmartRunner` 類別，具備以下能力：

*   **自適應超時 (Adaptive Timeout)**：
    *   檢測到 Staging 環境回應慢時，自動延長等待時間 (例如從 5s -> 15s)，避免誤報。
*   **智慧重試 (Smart Retry)**：
    *   **網絡錯誤 (502/504/Timeout)**：自動重試 3 次，指數退避 (1s, 2s, 4s)。
    *   **邏輯錯誤 (400/500/Assertion Fail)**：不重試，立即進入診斷模式。
    *   **Flaky Test 標記**：自動標記不穩定的測試項目，生成優化建議。

### B. 安全鎖機制 (Safety Lock)

為了防止「自動修復」把系統改壞，實施以下保護：

1.  **環境檢查 (Environment Check)**：
    *   啟動前檢查 `wrangler.toml` 和 Database Migration 狀態。
    *   若基礎環境異常，禁止執行任何寫入測試。
2.  **沙盒模式 (Sandbox Mode)**：
    *   所有測試產生的數據（User, Bottle, Order）帶有 `test_` 前綴。
    *   測試結束後自動清理 `test_*` 數據，確保不污染真實數據庫。

---

## 3. 自我修復工作流 (Self-Healing Workflow)

這是本計畫的核心，將測試與 AI Agent 深度整合。

### 階段一：自動診斷 (Auto-Diagnosis)
當測試失敗（且重試無效）時，Runner 自動生成 **`diagnosis_report.json`**：
*   **錯誤快照**：失敗時的 HTTP Response Body、Status Code。
*   **上下文代碼**：定位到失敗的測試代碼行，以及被測試的 API Handler 源碼路徑。
*   **最近日誌**：抓取 Cloudflare Worker 最近 30 秒的 Logs。

### 階段二：AI 代理修復 (AI Agent Repair) - *由 Cursor Agent 執行*
*   **輸入**：讀取 `diagnosis_report.json`。
*   **決策**：
    *   如果是 **測試腳本過時**（例如 API 欄位改了，但測試沒改） -> **更新測試腳本**。
    *   如果是 **業務代碼 Bug** -> **生成修復 Patch**。
*   **執行**：
    1.  `git stash` (備份當前狀態)。
    2.  應用修復。
    3.  重跑該單項測試。
    4.  **成功** -> `git commit`。
    5.  **失敗** -> `git stash pop` (回滾) 並通知人類。

### 階段三：文檔同步 (Doc Synchronization)
*   如果測試發現實際 API 行為與文檔不符（且該行為是正確的），自動標記 `doc/SPEC.md` 或相關文檔為「待更新」，並生成建議的 Markdown 變更內容。

---

## 4. 測試分組策略 (Grouping Strategy)

為了速度，我們將並行執行（Parallel Execution）：

### Group 1: 靜態與配置檢查 (Static Checks)
*   *目標*：確保代碼沒語法錯誤，配置沒遺漏。
*   *內容*：i18n 完整性、Migration 狀態、環境變數檢查。
*   *特點*：速度快，不需網絡。

### Group 2: 核心生命線 (Critical Path) - **Blocker**
*   *目標*：確保 App 能跑起來。
*   *內容*：Health Check, User Login, `/start` 指令。
*   *策略*：若此組失敗，**立刻停止**所有後續測試並報警。

### Group 3: 功能模組 (Feature Suites) - **並行執行**
*   **Admin System**: 用戶管理、數據報表。
*   **Task System**: 社交任務驗證。
*   **Ad System**: 廣告商、獎勵發放。
*   **MoonPacket API**: (新增) Mode A/B 規則與 HMAC 簽名驗證。
*   **Payment**: VIP 訂閱流程。

---

## 5. 實施路線圖 (Roadmap)

1.  **Phase 1: 基礎重構 (現階段)**
    *   建立 `SmartRunner` 架構。
    *   實現 `Group 1` (靜態) 與 `Group 2` (核心) 的分離。
    *   加入 MoonPacket API 測試。
    *   **交付物**：一個執行速度快、支援重試的 `smoke-test.ts`。

2.  **Phase 2: 診斷與修復接口**
    *   實作 `DiagnosisReporter`。
    *   定義 AI 修復的 Prompt 模板。
    *   **交付物**：測試失敗時會輸出詳細的「修復建議」。

3.  **Phase 3: 完全自治**
    *   整合 Agent 自動執行修復指令。

## 6. CLI 使用方式

```bash
# 執行所有測試（預設開啟重試）
pnpm smoke

# 僅執行 MoonPacket 相關測試
pnpm smoke --filter="MoonPacket"

# 本地開發模式（使用本地 Worker，不連外網）
pnpm smoke --local

# 自動修復模式（實驗性）
pnpm smoke --auto-fix
```
