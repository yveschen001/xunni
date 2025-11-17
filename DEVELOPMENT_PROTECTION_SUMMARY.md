# 🛡️ 開發保護機制總結

**創建時間：** 2025-01-17 07:20 UTC  
**GitHub Commit：** bcd1c87

---

## ✅ 已完成

### 1. 代碼備份
- ✅ 所有變更已提交到 Git
- ✅ 代碼已推送到 GitHub
- ✅ Commit: `bcd1c87`

---

### 2. 文檔創建

#### 核心文檔
- ✅ **`doc/SAFE_DEVELOPMENT_WORKFLOW.md`** - 安全開發流程（15 個章節）
- ✅ **`CURRENT_STATUS.md`** - 當前狀態（標註受保護模組）
- ✅ **`PARTNER_INFO_RESTORATION.md`** - 對方資料修復文檔

---

## 🛡️ 開發保護機制

### 1. 模組化開發原則

**分層架構：**
```
Handlers 層 ← 優先修改（影響範圍最小）
    ↓
Services 層 ← 謹慎修改（可能影響多個 Handlers）
    ↓
Domain 層 ← 謹慎修改（必須有測試）
    ↓
DB Queries 層 ← 避免修改（除非必要）
```

**原則：**
- ✅ 單一職責原則
- ✅ 依賴隔離
- ✅ 向後兼容

---

### 2. 變更影響分析

**變更前必須分析：**
1. 修改哪些文件？
2. 影響哪些功能？
3. 風險等級？（綠燈/黃燈/紅燈）
4. 需要測試哪些功能？

**工具：**
```bash
# 查找函數使用
grep -r "functionName" src/

# 查找類型使用
grep -r "TypeName" src/
```

---

### 3. 測試保護機制

**三層測試：**
1. **單元測試** - Domain 層必須有測試
2. **Smoke Test** - 核心功能回歸測試
3. **手動測試** - 針對性測試受影響功能

**測試命令：**
```bash
pnpm test          # 所有測試
pnpm test:smoke    # Smoke Test
pnpm lint          # 代碼質量檢查
```

---

### 4. 部署前檢查清單

**必須通過：**
- [ ] ✅ `pnpm lint` - 0 errors
- [ ] ✅ `pnpm test` - 所有測試通過
- [ ] ✅ 新功能正常工作
- [ ] ✅ 受影響的現有功能正常工作
- [ ] ✅ 沒有破壞其他功能

---

### 5. 回滾機制

**快速回滾：**
```bash
# 查看最近的部署版本
wrangler deployments list --name xunni-bot-staging

# 回滾到上一個版本
wrangler rollback --name xunni-bot-staging
```

**代碼回滾：**
```bash
# 回滾到上一個提交
git revert HEAD

# 推送回滾
git push origin main
```

---

## 📋 開發流程

### 開發前
1. ✅ 閱讀 `@doc/SPEC.md` 相關章節
2. ✅ 閱讀 `CURRENT_STATUS.md`
3. ✅ 閱讀 `@doc/SAFE_DEVELOPMENT_WORKFLOW.md`
4. ✅ 分析變更影響範圍

### 開發中
1. ✅ 只修改必要的文件
2. ✅ 不修改不相關的代碼
3. ✅ 頻繁提交
4. ✅ 添加詳細註釋

### 開發後
1. ✅ 執行 `pnpm lint`
2. ✅ 執行 `pnpm test`
3. ✅ 手動測試新功能
4. ✅ 手動測試受影響的現有功能

### 部署前
1. ✅ 所有變更已提交
2. ✅ 代碼已推送到 GitHub
3. ✅ Staging 測試通過
4. ✅ 記錄 Version ID

---

## 🎯 核心原則

### 1. 專注於單一功能
**不要同時修改多個不相關的功能**

### 2. 保護現有功能
**修改前先理解，修改後必須測試**

### 3. 測試驅動
**Domain 層必須有測試**

### 4. 文檔同步
**代碼和文檔必須一致**

### 5. 頻繁提交
**小步快跑，方便回滾**

---

## 🚨 常見陷阱

### 陷阱 1：修改共享函數
**問題：** 修改 `maskNickname`，影響所有使用它的地方  
**解決：** 創建新函數或添加向後兼容的參數

### 陷阱 2：修改路由器邏輯
**問題：** 修改路由器優先級，破壞現有流程  
**解決：** 添加在正確的位置

### 陷阱 3：修改資料庫查詢
**問題：** 修改現有查詢，破壞依賴它的功能  
**解決：** 創建新查詢

### 陷阱 4：刪除"未使用"的代碼
**問題：** IDE 顯示"未使用"，但實際上可能動態導入  
**解決：** 使用 `grep` 確認真的沒有使用

---

## 📊 受保護的模組

### Domain 層（🛡️ 高保護）
**不要輕易修改，必須有測試！**

- `bottle.ts`
- `conversation.ts`
- `conversation_history.ts`
- `conversation_identifier.ts`
- `user.ts`
- `invite.ts`（含 `maskNickname`）
- `blood_type.ts`
- `mbti_test.ts`
- `usage.ts`

### Services 層（⚠️ 中保護）
**謹慎修改，可能影響多個 Handlers！**

- `telegram.ts`
- `gemini.ts`
- `openai.ts`
- `conversation_history.ts`
- `translation/`

### Handlers 層（✅ 低保護）
**優先修改這一層，影響範圍最小！**

- `start.ts`
- `throw.ts`
- `catch.ts`
- `message_forward.ts`
- `edit_profile.ts`
- `vip.ts`
- `invite_activation.ts`
- `dev.ts`

---

## 📚 重要文檔

### 必讀（開發前）
1. **`@doc/SPEC.md`** - 專案規格書（最重要）
2. **`CURRENT_STATUS.md`** - 當前狀態
3. **`@doc/SAFE_DEVELOPMENT_WORKFLOW.md`** - 安全開發流程
4. **`@doc/DEVELOPMENT_STANDARDS.md`** - 開發規範

### 參考（開發中）
5. **`@doc/MODULE_DESIGN.md`** - 模組架構
6. **`@doc/I18N_GUIDE.md`** - 國際化指南
7. **`@doc/TESTING.md`** - 測試指南

---

## 🔄 開發流程圖

```
開始新功能
    ↓
閱讀文檔（SPEC.md + CURRENT_STATUS.md）
    ↓
分析影響範圍
    ↓
編寫測試（Domain 層）
    ↓
實現功能
    ↓
執行測試（pnpm test + pnpm lint）
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

## 💡 實際案例

### 案例 1：添加血型功能（成功）
**變更範圍：**
- ✅ 新增：`src/domain/blood_type.ts`
- ✅ 新增：`src/db/migrations/0012_add_blood_type.sql`
- ⚠️ 修改：`src/telegram/handlers/onboarding_callback.ts`

**保護措施：**
- 血型邏輯獨立在 `blood_type.ts`
- 不修改現有的註冊流程邏輯
- 只在適當的位置插入血型步驟

**結果：** ✅ 沒有破壞現有功能

---

### 案例 2：對話歷史記錄系統（教訓）
**變更範圍：**
- ✅ 新增：`src/services/conversation_history.ts`
- ❌ 修改：`src/telegram/handlers/message_forward.ts`

**問題：**
- 移除舊邏輯時，忘記保留對方資料卡顯示

**教訓：**
- ⚠️ 移除舊代碼時，必須確認所有功能都已遷移
- ⚠️ 必須對比新舊版本的輸出
- ⚠️ 必須手動測試確認

**修復：**
- 恢復對方資料卡顯示
- 添加到歷史記錄帖子和新訊息帖子

---

## 🎓 學到的教訓

### 1. 不要假設"未使用"
**教訓：** IDE 顯示"未使用"不代表真的未使用  
**方法：** 使用 `grep` 確認

### 2. 移除代碼要謹慎
**教訓：** 移除舊代碼時，可能遺漏某些功能  
**方法：** 對比新舊版本的輸出

### 3. 手動測試很重要
**教訓：** 自動化測試無法覆蓋所有情況  
**方法：** 手動測試受影響的現有功能

### 4. 頻繁提交和推送
**教訓：** 大量變更一次提交，難以回滾  
**方法：** 小步快跑，每個小功能提交一次

---

## 🚀 下一步

### 立即執行
1. **閱讀 `@doc/SAFE_DEVELOPMENT_WORKFLOW.md`** - 詳細了解安全開發流程

### 功能開發
2. **完成 MBTI 36 題測試** - 高優先級
3. **規劃 Mini App** - 高優先級

---

## 📞 快速參考

### 測試命令
```bash
pnpm test          # 所有測試
pnpm test:smoke    # Smoke Test
pnpm lint          # 代碼質量檢查
```

### 部署命令
```bash
pnpm deploy:staging     # 部署到 Staging
pnpm deploy:production  # 部署到 Production
```

### 備份命令
```bash
git add -A
git commit -m "feat: 描述"
git push origin main
```

---

## 🎯 記住

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

---

**最後更新：** 2025-01-17 07:20 UTC  
**GitHub Commit：** bcd1c87

