# 🛡️ 安全開發工作流程

**目的：** 保護已完成的功能，避免新開發破壞現有功能

**最後更新：** 2025-01-17  
**維護者：** 專案團隊

---

## 📋 目錄

1. [開發前準備](#開發前準備)
2. [模組化開發原則](#模組化開發原則)
3. [變更影響分析](#變更影響分析)
4. [測試保護機制](#測試保護機制)
5. [部署前檢查清單](#部署前檢查清單)
6. [回滾機制](#回滾機制)

---

## 1. 開發前準備

### 1.1 理解當前系統狀態

**必須閱讀：**
- [ ] `@doc/SPEC.md` - 完整的業務邏輯和資料庫設計
- [ ] `@doc/DEVELOPMENT_STANDARDS.md` - 開發規範
- [ ] `@doc/MODULE_DESIGN.md` - 模組架構
- [ ] `CURRENT_STATUS.md` - 當前功能狀態

**必須執行：**
```bash
# 確認所有測試通過
pnpm test

# 確認沒有 lint 錯誤
pnpm lint

# 確認本地開發環境正常
pnpm dev
```

---

### 1.2 創建功能分支（可選）

**對於大型功能：**
```bash
# 創建功能分支
git checkout -b feature/your-feature-name

# 定期同步主分支
git fetch origin main
git rebase origin/main
```

**對於小型修復：**
- 直接在 main 分支開發
- 但必須頻繁提交和推送

---

## 2. 模組化開發原則

### 2.1 分層架構

**遵循嚴格的分層設計：**

```
┌─────────────────────────────────┐
│   Handlers 層（Telegram 指令）   │  ← 只修改這一層
├─────────────────────────────────┤
│   Services 層（外部服務）        │  ← 謹慎修改
├─────────────────────────────────┤
│   Domain 層（業務邏輯）          │  ← 謹慎修改，必須有測試
├─────────────────────────────────┤
│   DB Queries 層（資料庫查詢）    │  ← 謹慎修改
└─────────────────────────────────┘
```

**原則：**
- ✅ **優先修改 Handlers 層** - 影響範圍最小
- ⚠️ **謹慎修改 Services 層** - 可能影響多個 Handlers
- ⚠️ **謹慎修改 Domain 層** - 必須先寫測試
- ❌ **避免修改 DB Queries 層** - 除非必要

---

### 2.2 單一職責原則

**每個模組只負責一個功能：**

**好的例子：**
```typescript
// ✅ 只處理邀請功能
src/telegram/handlers/invite_activation.ts

// ✅ 只處理對話歷史記錄
src/services/conversation_history.ts
```

**壞的例子：**
```typescript
// ❌ 在 message_forward.ts 中添加邀請邏輯
// ❌ 在 throw.ts 中添加 VIP 檢查邏輯
```

---

### 2.3 依賴隔離

**新功能不應該修改現有功能的核心邏輯：**

**好的例子：**
```typescript
// ✅ 創建新文件
src/telegram/handlers/blood_type_matching.ts

// ✅ 在現有文件中添加新函數
export async function handleBloodTypeEdit() { ... }
```

**壞的例子：**
```typescript
// ❌ 修改現有函數的核心邏輯
export async function handleMessageForward() {
  // 原有邏輯
  // ... 添加血型檢查 ← 不要這樣做！
}
```

---

## 3. 變更影響分析

### 3.1 變更前必須分析影響範圍

**使用工具分析：**
```bash
# 查找函數被哪些文件使用
grep -r "functionName" src/

# 查找類型被哪些文件使用
grep -r "TypeName" src/
```

**記錄影響範圍：**
```markdown
## 變更影響分析

**修改文件：** src/domain/conversation.ts
**修改函數：** validateMessageContent()

**影響範圍：**
- src/telegram/handlers/message_forward.ts
- src/telegram/handlers/throw.ts

**風險評估：** 🟡 中等
**需要測試：**
- 對話訊息驗證
- 瓶子內容驗證
```

---

### 3.2 變更類型分類

**低風險變更（綠燈）：**
- ✅ 添加新的 Handler 文件
- ✅ 添加新的 i18n 翻譯
- ✅ 修改 UI 文字（不改邏輯）
- ✅ 添加新的測試

**中等風險變更（黃燈）：**
- ⚠️ 修改現有 Handler 的部分邏輯
- ⚠️ 添加新的 Domain 函數
- ⚠️ 修改 Service 層函數簽名
- ⚠️ 添加新的資料庫欄位

**高風險變更（紅燈）：**
- 🔴 修改 Domain 層核心函數
- 🔴 修改資料庫 Schema
- 🔴 修改路由器邏輯
- 🔴 修改 i18n 系統

---

## 4. 測試保護機制

### 4.1 測試驅動開發（TDD）

**對於 Domain 層變更，必須先寫測試：**

```typescript
// 1. 先寫測試
describe('validateMessageContent', () => {
  it('should validate message length', () => {
    const result = validateMessageContent('test');
    expect(result.valid).toBe(true);
  });
});

// 2. 確認測試失敗
pnpm test

// 3. 實現功能
export function validateMessageContent(text: string) {
  // ...
}

// 4. 確認測試通過
pnpm test
```

---

### 4.2 回歸測試

**每次變更後必須執行：**

```bash
# 1. 執行所有測試
pnpm test

# 2. 執行 Smoke Test（針對核心功能）
pnpm test:smoke

# 3. 執行 Lint 檢查
pnpm lint
```

**Smoke Test 涵蓋的核心功能：**
- ✅ 用戶註冊流程
- ✅ 丟瓶子流程
- ✅ 撿瓶子流程
- ✅ 對話訊息流程
- ✅ VIP 功能
- ✅ 邀請功能
- ✅ 個人資料編輯

---

### 4.3 針對性測試

**只測試受影響的功能：**

**例如：修改對話訊息邏輯**
```bash
# 只測試對話相關的功能
pnpm test tests/domain/conversation.test.ts
pnpm test tests/telegram/handlers/message_forward.test.ts

# 手動測試
1. 建立對話
2. 發送訊息
3. 確認歷史記錄
4. 確認配額檢查
```

---

## 5. 部署前檢查清單

### 5.1 代碼質量檢查

**必須通過：**
- [ ] ✅ `pnpm lint` - 0 errors
- [ ] ✅ `pnpm test` - 所有測試通過
- [ ] ✅ 代碼審查 - 沒有明顯問題

---

### 5.2 功能測試檢查

**必須測試：**
- [ ] ✅ 新功能正常工作
- [ ] ✅ 受影響的現有功能正常工作
- [ ] ✅ 沒有破壞其他功能

---

### 5.3 資料庫檢查

**如果有資料庫變更：**
- [ ] ✅ Migration 文件已創建
- [ ] ✅ Migration 在本地測試通過
- [ ] ✅ Migration 在 Staging 執行
- [ ] ✅ 確認表和索引正確創建

---

### 5.4 部署檢查

**部署前：**
```bash
# 1. 確認所有變更已提交
git status

# 2. 確認沒有未追蹤的重要文件
git status | grep "Untracked"

# 3. 推送到 GitHub
git push origin main

# 4. 部署到 Staging
pnpm deploy:staging

# 5. 記錄 Version ID
# Current Version ID: XXXXXXXX
```

**部署後：**
- [ ] ✅ 檢查 Cloudflare 日誌（沒有錯誤）
- [ ] ✅ 手動測試新功能
- [ ] ✅ 手動測試受影響的現有功能

---

## 6. 回滾機制

### 6.1 快速回滾

**如果部署後發現問題：**

```bash
# 1. 查看最近的部署版本
wrangler deployments list --name xunni-bot-staging

# 2. 回滾到上一個版本
wrangler rollback --name xunni-bot-staging --message "回滾：修復 XXX 問題"

# 3. 確認回滾成功
# 檢查 Cloudflare Dashboard
```

---

### 6.2 代碼回滾

**如果需要回滾代碼：**

```bash
# 1. 查看提交歷史
git log --oneline -10

# 2. 回滾到上一個提交
git revert HEAD

# 3. 推送回滾
git push origin main

# 4. 重新部署
pnpm deploy:staging
```

---

## 7. 開發保護清單

### 7.1 開發前

**必須完成：**
- [ ] 閱讀 `@doc/SPEC.md` 了解業務邏輯
- [ ] 閱讀 `CURRENT_STATUS.md` 了解當前狀態
- [ ] 分析變更影響範圍
- [ ] 確認測試環境正常

---

### 7.2 開發中

**必須遵守：**
- [ ] 只修改必要的文件
- [ ] 不修改不相關的代碼
- [ ] 頻繁提交（每個小功能提交一次）
- [ ] 添加詳細的註釋和日誌

---

### 7.3 開發後

**必須執行：**
- [ ] 執行 `pnpm lint`（0 errors）
- [ ] 執行 `pnpm test`（所有測試通過）
- [ ] 執行針對性手動測試
- [ ] 檢查 Cloudflare 日誌（沒有錯誤）

---

### 7.4 部署前

**必須確認：**
- [ ] 所有變更已提交
- [ ] 代碼已推送到 GitHub
- [ ] Staging 環境測試通過
- [ ] 記錄 Version ID

---

## 8. 常見陷阱和避免方法

### 8.1 陷阱 1：修改共享函數

**問題：**
```typescript
// ❌ 修改了 maskNickname，影響所有使用它的地方
export function maskNickname(nickname: string): string {
  // 修改邏輯 ← 可能破壞現有功能
}
```

**解決方案：**
```typescript
// ✅ 創建新函數
export function maskNicknameV2(nickname: string): string {
  // 新邏輯
}

// ✅ 或者添加參數
export function maskNickname(nickname: string, options?: { minLength?: number }): string {
  // 向後兼容的邏輯
}
```

---

### 8.2 陷阱 2：修改路由器邏輯

**問題：**
```typescript
// ❌ 修改路由器優先級，可能破壞現有流程
if (handleNewFeature()) return;  // ← 添加在前面
if (handleMessageForward()) return;  // ← 被跳過了！
```

**解決方案：**
```typescript
// ✅ 添加在正確的位置
if (handleProfileEdit()) return;
if (handleMessageForward()) return;
if (handleNewFeature()) return;  // ← 添加在後面
```

---

### 8.3 陷阱 3：修改資料庫查詢

**問題：**
```typescript
// ❌ 修改現有查詢，可能破壞依賴它的功能
export async function getActiveConversation() {
  // 添加新的 WHERE 條件 ← 可能破壞現有邏輯
}
```

**解決方案：**
```typescript
// ✅ 創建新查詢
export async function getActiveConversationWithFilter() {
  // 新邏輯
}
```

---

### 8.4 陷阱 4：刪除"未使用"的代碼

**問題：**
```typescript
// ❌ IDE 顯示"未使用"，就刪除了
// 但實際上可能在其他地方動態導入
const { maskNickname } = await import('~/domain/invite');
```

**解決方案：**
```typescript
// ✅ 使用 grep 確認真的沒有使用
grep -r "maskNickname" src/

// ✅ 如果確定未使用，再刪除
```

---

## 9. 開發保護檢查表

### 9.1 每次開發前

```markdown
## 開發保護檢查表

**功能名稱：** _________________
**開發者：** _________________
**日期：** _________________

### 開發前檢查

- [ ] 已閱讀 SPEC.md 相關章節
- [ ] 已閱讀 CURRENT_STATUS.md
- [ ] 已分析變更影響範圍
- [ ] 已確認測試環境正常
- [ ] 已創建功能分支（如果是大型功能）

### 開發中檢查

- [ ] 只修改必要的文件
- [ ] 沒有修改不相關的代碼
- [ ] 已添加詳細註釋
- [ ] 已頻繁提交

### 開發後檢查

- [ ] pnpm lint - 0 errors
- [ ] pnpm test - 所有測試通過
- [ ] 針對性手動測試通過
- [ ] Cloudflare 日誌沒有錯誤

### 部署前檢查

- [ ] 所有變更已提交
- [ ] 代碼已推送到 GitHub
- [ ] Staging 測試通過
- [ ] 已記錄 Version ID
```

---

## 10. 實際案例

### 案例 1：添加血型功能

**變更範圍：**
- ✅ 新增：`src/domain/blood_type.ts`
- ✅ 新增：`src/db/migrations/0012_add_blood_type.sql`
- ⚠️ 修改：`src/telegram/handlers/onboarding_callback.ts`（添加血型步驟）
- ⚠️ 修改：`src/telegram/handlers/edit_profile.ts`（添加血型編輯）

**保護措施：**
1. 血型邏輯獨立在 `blood_type.ts`
2. 不修改現有的註冊流程邏輯
3. 只在適當的位置插入血型步驟
4. 添加完整的測試

**結果：** ✅ 沒有破壞現有功能

---

### 案例 2：對話歷史記錄系統（反面教材）

**變更範圍：**
- ✅ 新增：`src/services/conversation_history.ts`
- ✅ 新增：`src/domain/conversation_history.ts`
- ❌ 修改：`src/telegram/handlers/message_forward.ts`（移除舊邏輯）

**問題：**
1. 移除舊邏輯時，忘記保留對方資料卡顯示
2. 導致用戶看不到對方是誰

**教訓：**
- ⚠️ 移除舊代碼時，必須確認所有功能都已遷移
- ⚠️ 必須對比新舊版本的輸出
- ⚠️ 必須手動測試確認

**修復：**
- 恢復對方資料卡顯示
- 添加到歷史記錄帖子和新訊息帖子

---

## 11. 開發流程圖

```
開始新功能
    ↓
閱讀 SPEC.md + CURRENT_STATUS.md
    ↓
分析影響範圍
    ↓
創建功能分支（可選）
    ↓
編寫測試（Domain 層）
    ↓
實現功能
    ↓
執行測試（pnpm test）
    ↓
執行 Lint（pnpm lint）
    ↓
手動測試新功能
    ↓
手動測試受影響的現有功能 ← 重要！
    ↓
提交代碼
    ↓
推送到 GitHub
    ↓
部署到 Staging
    ↓
檢查 Cloudflare 日誌
    ↓
手動測試 Staging 環境
    ↓
完成 ✅
```

---

## 12. 緊急修復流程

**如果部署後發現問題：**

```
發現問題
    ↓
評估嚴重程度
    ↓
【嚴重】立即回滾 Cloudflare 部署
    ↓
【中等】在本地修復並快速部署
    ↓
【輕微】記錄問題，下次修復
    ↓
更新 HOTFIX_LOG.md
    ↓
完成
```

---

## 13. 開發保護工具

### 13.1 自動化工具

**創建保護腳本：**
```bash
# scripts/pre-deploy-check.sh
#!/bin/bash

echo "🔍 執行部署前檢查..."

# 1. Lint 檢查
echo "1. Lint 檢查..."
pnpm lint
if [ $? -ne 0 ]; then
  echo "❌ Lint 檢查失敗！"
  exit 1
fi

# 2. 測試檢查
echo "2. 測試檢查..."
pnpm test
if [ $? -ne 0 ]; then
  echo "❌ 測試失敗！"
  exit 1
fi

# 3. Git 狀態檢查
echo "3. Git 狀態檢查..."
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️ 有未提交的變更！"
  git status
  exit 1
fi

echo "✅ 所有檢查通過！可以部署。"
```

---

### 13.2 部署腳本增強

**修改 `package.json`：**
```json
{
  "scripts": {
    "deploy:staging": "pnpm pre-deploy-check && wrangler deploy --env staging",
    "pre-deploy-check": "pnpm lint && pnpm test"
  }
}
```

---

## 14. 文檔同步

### 14.1 必須更新的文檔

**當修改功能時，必須同步更新：**

| 變更類型 | 必須更新的文檔 |
|---------|--------------|
| 新增功能 | `SPEC.md`、`CURRENT_STATUS.md` |
| 修改業務邏輯 | `SPEC.md` |
| 修改資料庫 | `SPEC.md`（資料庫設計章節） |
| 修改開發流程 | `DEVELOPMENT_STANDARDS.md` |
| 修改測試 | `TESTING.md` |

---

### 14.2 文檔審查

**部署前必須確認：**
- [ ] 文檔與代碼一致
- [ ] 沒有過時的描述
- [ ] 新功能已記錄

---

## 15. 總結

### 核心原則

1. **🎯 專注於單一功能** - 不要同時修改多個不相關的功能
2. **🛡️ 保護現有功能** - 修改前先理解，修改後必須測試
3. **🧪 測試驅動** - Domain 層必須有測試
4. **📝 文檔同步** - 代碼和文檔必須一致
5. **🔄 頻繁提交** - 小步快跑，方便回滾

---

### 記住

> **"不要把已經做好的東西改壞了"**

**方法：**
1. 理解現有功能
2. 分析影響範圍
3. 只修改必要的部分
4. 測試新功能
5. 測試受影響的現有功能
6. 頻繁備份和推送

---

**遵循這個流程，可以最大程度保護已完成的功能！** 🛡️

