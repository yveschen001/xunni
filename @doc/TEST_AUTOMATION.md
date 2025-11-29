# 測試自動化與本地模擬指南

本文檔說明如何使用專案中的自動化測試工具，特別是「本地模擬測試 (Local Simulation)」，以確保在部署前驗證關鍵功能。

## 1. 本地模擬測試 (Local Simulation)

`scripts/local-simulation.ts` 是一個深度集成測試腳本，它在本地啟動 Cloudflare Worker 和一個 Mock Telegram Server，模擬真實的用戶交互。

### 為什麼需要它？
*   **驗證內容**：不僅僅檢查 HTTP 200，還驗證 Bot 回覆的**實際文本內容**。
*   **模擬角色**：可以模擬一般用戶、管理員、超級管理員，驗證權限隔離。
*   **測試複雜流程**：如 Wizard（嚮導）流程、按鈕點擊、回調處理。
*   **無需部署**：完全在本地運行，速度快，不影響 Staging/Production。

### 如何運行

使用便捷腳本 `scripts/run-local-sim.sh`：

```bash
# 測試一般用戶流程
./scripts/run-local-sim.sh user

# 測試管理員流程 (含廣告/任務管理)
./scripts/run-local-sim.sh admin

# 測試超級管理員流程
./scripts/run-local-sim.sh super_admin
```

### 測試範圍
*   **/start**: 歡迎訊息、語言選擇。
*   **/profile, /stats**: 未註冊用戶的引導流程。
*   **/help**: 驗證指令列表是否根據角色正確顯示（隱藏/顯示管理員指令）。
*   **/admin_ads**: 廣告管理 Wizard 流程（創建、輸入驗證、日誌記錄）。
*   **日誌群通知**: 驗證管理員操作是否發送通知到指定群組。

## 2. 冒煙測試 (Smoke Test)

`scripts/smoke-test.ts` 用於對**已部署**的環境（Staging/Production）進行快速健康檢查。

### 用法

```bash
# 測試 Staging 環境 (默認)
pnpm smoke

# 僅運行管理員相關測試
pnpm smoke --filter "Admin"
```

## 3. 自動化流程 (Pre-push / Pre-deploy)

為了防止壞代碼進入倉庫，建議在 `git push` 前運行本地模擬測試。

### 配置 Git Pre-push Hook

您可以配置 Git 在每次 push 前自動運行檢查：

1. 創建/編輯 `.git/hooks/pre-push` 文件：
   ```bash
   #!/bin/sh
   ./scripts/pre-push-check.sh
   ```
2. 給予執行權限：
   ```bash
   chmod +x .git/hooks/pre-push
   ```

這樣每次 `git push` 時都會自動執行 `local-simulation` 和 `lint`，如果失敗則會阻止推送。

### 部署前檢查 (`scripts/pre-deploy-check.sh`)

目前的部署腳本已經集成了基本的檢查。建議將本地模擬測試加入其中。

**手動執行完整檢查：**

```bash
# 1. 運行本地模擬 (確保功能正常)
./scripts/run-local-sim.sh admin

# 2. 運行 Lint 和單元測試
pnpm lint
pnpm test

# 3. 部署並運行冒煙測試
pnpm deploy:staging
pnpm smoke
```

## 4. 故障排除

*   **Invalid time value / Session 錯誤**: 通常是因為 `src/domain/session.ts` 中缺少對應的 `SessionType` 定義。
*   **Database error**: 檢查 `src/api/dev.ts` 中的 Seed User 邏輯，確保與最新的資料庫 Schema 匹配。
*   **Timeout**: 如果測試超時，可能是 Worker 啟動慢，或者是邏輯錯誤導致 Bot 沒有回覆預期的訊息。

---
**最後更新**: 2025-11-29

