# Hotfix 記錄

本文檔記錄所有緊急修復（Hotfix）的問題、原因和解決方案，用於避免類似問題再次發生。

---

## Hotfix #001 - 2025-01-16

### 問題描述

部署到 Staging 後發現多個嚴重問題：

1. **資料庫錯誤** - `/profile` 命令失敗，錯誤：`D1_ERROR: no such table: invites`
2. **暱稱擾碼錯誤** - 對話中對方暱稱顯示為 `****` 而不是 `張**`
3. **語言映射不完整** - 只支援 20 種語言，應該是 34 種
4. **匹配成功率 200%** - 統計數據計算邏輯錯誤

### 根本原因

#### 1. 資料庫錯誤
- **原因**：Migration 只在本地執行，未在 remote 資料庫執行
- **影響**：所有依賴 `invites` 表的功能無法使用（`/profile`, 邀請系統）
- **教訓**：部署前必須確認 remote 資料庫 schema

#### 2. 暱稱擾碼錯誤
- **原因**：使用了錯誤的工具函數 `maskSensitiveValue` 而不是 `maskNickname`
- **影響**：用戶隱私保護失效，暱稱完全遮蔽無法識別
- **教訓**：工具函數命名要清晰，統一使用正確的函數

#### 3. 語言映射不完整
- **原因**：沒有仔細核對 SPEC.md 中的 34 種語言需求
- **影響**：部分語言無法正確翻譯
- **教訓**：修改前必須先查看 SPEC.md 確認完整需求

#### 4. 匹配成功率 200%
- **原因**：計算公式錯誤，未加上限檢查
- **影響**：統計數據不合理，影響用戶信任
- **教訓**：所有百分比計算都要加 `Math.min(100, ...)` 限制

### 修復方案

#### 1. 資料庫修復
```bash
# 在 remote 執行 migration
npx wrangler d1 execute xunni-db-staging --command="
CREATE TABLE IF NOT EXISTS invites (...);
CREATE INDEX IF NOT EXISTS idx_invites_inviter_id ON invites (inviter_telegram_id);
..." --env staging --remote
```

#### 2. 暱稱擾碼修復
```typescript
// 修復前
import { maskSensitiveValue } from '~/utils/mask';
const nickname = maskSensitiveValue(user.nickname);

// 修復後
import { maskNickname } from '~/domain/invite';
const nickname = maskNickname(user.nickname || '匿名');
```

#### 3. 語言映射修復
- 補齊 `src/i18n/languages.ts` 到 34 種語言
- 更新 `src/services/gemini.ts` 語言映射
- 更新 `src/services/translation/openai.ts` 語言映射
- 修正 `zh-TW` 為 "Traditional Chinese (Taiwan)"

#### 4. 匹配成功率修復
```typescript
// 修復前：可能超過 100%
const matchRate = thrown > 0 ? Math.round((caught / thrown) * 100) : 0;

// 修復後：限制在 100% 以內
const matchRate = thrown > 0 ? Math.min(100, Math.round((conversations / thrown) * 100)) : 0;
```

### 預防措施

已更新以下文檔以防止類似問題：

1. **`doc/DEVELOPMENT_STANDARDS.md`**
   - 新增第 6 節「安全開發與防止改壞」
   - 包含部署前檢查清單
   - 包含常見錯誤與預防措施
   - 包含安全修改流程

2. **`.cursorrules`**
   - 新增「安全開發原則」章節
   - 強調部署前檢查清單
   - 列出常見錯誤預防措施

3. **檢查清單**
   - [ ] 確認 remote 資料庫 schema 最新
   - [ ] 執行 `pnpm lint` 確保 0 錯誤
   - [ ] 執行 `pnpm test` 確保所有測試通過
   - [ ] 核對 SPEC.md 確認完整需求
   - [ ] 執行完整 Smoke Test
   - [ ] 檢查 UI 顯示正確性

### 影響範圍

- **受影響環境**：Staging
- **受影響功能**：
  - `/profile` 命令
  - 邀請系統
  - 對話資料卡片
  - 統計數據顯示
  - 翻譯功能（部分語言）

- **修復時間**：約 45 分鐘
- **停機時間**：無（Staging 環境）

### 修復驗證

- ✅ `/profile` 命令正常顯示
- ✅ 暱稱擾碼格式正確（`張小明` → `張**`）
- ✅ 支援 34 種語言
- ✅ 匹配成功率在 0-100% 範圍內
- ✅ 所有測試通過
- ✅ Lint 檢查通過

### 相關文件

- 修復報告：`CRITICAL_FIXES_COMPLETE.md`
- 修改文件：
  - `src/i18n/languages.ts`
  - `src/services/gemini.ts`
  - `src/services/translation/openai.ts`
  - `src/telegram/handlers/conversation_actions.ts`
  - `src/telegram/handlers/stats.ts`
  - `doc/DEVELOPMENT_STANDARDS.md`
  - `.cursorrules`

### 經驗教訓

1. **部署前必須確認 remote 資料庫 schema**
   - 不能只在本地測試
   - 必須在 remote 執行 migration

2. **Smoke Test 必須更完整**
   - 必須覆蓋所有核心功能
   - 每次新增功能都要更新測試

3. **修改前必須先查看 SPEC.md**
   - 確認完整需求
   - 不要憑記憶或假設

4. **計算邏輯必須符合業務定義**
   - 百分比必須有上限檢查
   - 確認公式正確

5. **工具函數要統一使用**
   - 避免有多個相似功能的函數
   - 命名要清晰明確

---

## Hotfix 模板

```markdown
## Hotfix #XXX - YYYY-MM-DD

### 問題描述
[描述問題現象]

### 根本原因
[分析問題根本原因]

### 修復方案
[描述修復方法]

### 預防措施
[列出預防措施]

### 影響範圍
- **受影響環境**：
- **受影響功能**：
- **修復時間**：
- **停機時間**：

### 修復驗證
[列出驗證結果]

### 相關文件
[列出相關文件]

### 經驗教訓
[總結經驗教訓]
```

---

**最後更新**：2025-01-16  
**維護者**：開發團隊

