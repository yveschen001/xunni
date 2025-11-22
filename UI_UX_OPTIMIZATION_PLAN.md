# XunNi UI/UX Emoji 優化改善計劃

> **版本**：v1.0.0  
> **創建日期**：2025-11-21  
> **狀態**：✅ 待審核  
> **預估總工時**：6-9 小時

---

## 📋 執行摘要

### 🎯 目標
全面優化 XunNi Bot 的用戶介面訊息和 Emoji 使用，確保：
1. ✅ 所有用戶可見訊息使用正確的 Emoji
2. ✅ 「錯誤 ❌」和「警告 ⚠️」明確區分
3. ✅ 特定操作使用場景 Emoji
4. ✅ 用戶體驗一致且友好

### 📊 當前狀況
- **Callback Query Answer**：162 處使用 Emoji，約 30 處缺少
- **問題嚴重度**：
  - 🔴 P0（高優先級）：約 50 處「❌」應改為「⚠️」
  - 🟡 P1（中優先級）：約 20 處缺少場景 Emoji
  - 🟢 P2（低優先級）：約 30 處完全缺少 Emoji

### 🛡️ 安全保護
- ✅ 使用 Git 分支進行修改
- ✅ 每個 Phase 完成後執行 Smoke Test
- ✅ 漸進式部署，降低風險
- ✅ 發現問題立即回滾

---

## 📊 詳細分析

### 1. Callback Query Answer 使用情況

| Emoji 類型 | 當前數量 | 應該數量 | 差距 | 優先級 |
|-----------|---------|---------|------|--------|
| ✅ 成功 | 45 | 45 | 0 | - |
| ❌ 錯誤 | 117 | ~60 | -57 | 🔴 P0 |
| ⚠️ 警告 | 1 | ~50 | +49 | 🔴 P0 |
| 🚫 封鎖 | 0 | ~5 | +5 | 🟡 P1 |
| 🚨 舉報 | 0 | ~3 | +3 | 🟡 P1 |
| 🗑️ 刪除 | 0 | ~2 | +2 | 🟡 P1 |
| ⏳ 處理中 | 0 | ~5 | +5 | 🟡 P1 |
| 💳 支付 | 0 | ~2 | +2 | 🟡 P1 |
| ❓ 未知 | 0 | ~2 | +2 | 🟢 P2 |
| 無 Emoji | ~30 | 0 | -30 | 🟢 P2 |

---

## 🎯 Phase 1：區分錯誤和警告（P0）

### 目標
將約 50 處「❌ 錯誤」改為「⚠️ 警告」

### 預估時間
3-4 小時

### 修改範圍

#### 1.1 權限限制（約 10 處）

**文件**：
- `src/telegram/handlers/throw_advanced.ts`
- `src/telegram/handlers/edit_profile.ts`

**修改範例**：
```typescript
// 修改前
await telegram.answerCallbackQuery(callbackQuery.id, '❌ 此功能僅限 VIP 會員使用');

// 修改後
await telegram.answerCallbackQuery(callbackQuery.id, '⚠️ 此功能僅限 VIP 會員使用');
```

**影響範圍**：
- VIP 功能限制提示
- 權限檢查提示

---

#### 1.2 會話過期（約 15 處）

**文件**：
- `src/telegram/handlers/throw_advanced.ts`
- `src/telegram/handlers/draft.ts`
- `src/telegram/handlers/onboarding_callback.ts`

**修改範例**：
```typescript
// 修改前
await telegram.answerCallbackQuery(callbackQuery.id, '❌ 會話已過期');

// 修改後
await telegram.answerCallbackQuery(callbackQuery.id, '⚠️ 會話已過期，請重新開始');
```

**影響範圍**：
- 所有需要 session 的功能
- 草稿編輯
- 註冊流程

---

#### 1.3 流程提示（約 15 處）

**文件**：
- `src/telegram/handlers/onboarding_callback.ts`
- `src/telegram/handlers/edit_profile.ts`

**修改範例**：
```typescript
// 修改前
await telegram.answerCallbackQuery(callbackQuery.id, '❌ 當前不在性別選擇步驟');

// 修改後
await telegram.answerCallbackQuery(callbackQuery.id, '⚠️ 請先完成前面的步驟');
```

**影響範圍**：
- 註冊流程
- 個人資料編輯流程

---

#### 1.4 廣告限制（約 5 處）

**文件**：
- `src/telegram/handlers/ad_reward.ts`

**修改範例**：
```typescript
// 修改前
await telegram.answerCallbackQuery(callbackQuery.id, {
  text: '❌ 無法觀看更多廣告',
  show_alert: true,
});

// 修改後
await telegram.answerCallbackQuery(callbackQuery.id, {
  text: '⚠️ 今日廣告配額已用完',
  show_alert: true,
});
```

**影響範圍**：
- 廣告觀看限制
- 廣告配額檢查

---

#### 1.5 額度不足（約 5 處）

**文件**：
- `src/telegram/handlers/throw.ts`
- `src/telegram/handlers/catch.ts`

**修改範例**：
```typescript
// 修改前（如果有）
await telegram.sendMessage(chatId, '❌ 額度不足');

// 修改後
await telegram.sendMessage(chatId, '⚠️ 額度不足，請完成任務或觀看廣告獲得更多額度');
```

**影響範圍**：
- 丟瓶子額度檢查
- 撿瓶子額度檢查

---

### 測試計劃

#### 自動化測試
```typescript
describe('Phase 1: Error vs Warning', () => {
  it('should use warning emoji for VIP restrictions', () => {
    const message = '⚠️ 此功能僅限 VIP 會員使用';
    expect(message).toStartWith('⚠️');
  });

  it('should use warning emoji for session expiration', () => {
    const message = '⚠️ 會話已過期，請重新開始';
    expect(message).toStartWith('⚠️');
  });

  it('should use error emoji for real errors', () => {
    const message = '❌ 用戶不存在';
    expect(message).toStartWith('❌');
  });
});
```

#### 手動測試清單
- [ ] VIP 功能限制：顯示 ⚠️
- [ ] 會話過期：顯示 ⚠️
- [ ] 流程提示：顯示 ⚠️
- [ ] 廣告限制：顯示 ⚠️
- [ ] 真正的錯誤：仍顯示 ❌

---

## 🎯 Phase 2：添加場景 Emoji（P1）

### 目標
為特定操作添加場景 Emoji

### 預估時間
2-3 小時

### 修改範圍

#### 2.1 封鎖操作（約 3 處）

**文件**：
- `src/telegram/handlers/conversation_actions.ts`

**修改範例**：
```typescript
// 修改前
await telegram.answerCallbackQuery(callbackQuery.id, '✅ 已封鎖');

// 修改後
await telegram.answerCallbackQuery(callbackQuery.id, '🚫 已封鎖');
```

**影響範圍**：
- 對話中封鎖對方
- 封鎖確認

---

#### 2.2 舉報操作（約 3 處）

**文件**：
- `src/telegram/handlers/conversation_actions.ts`
- `src/telegram/handlers/report.ts`

**修改範例**：
```typescript
// 修改前
await telegram.answerCallbackQuery(callbackQuery.id, '✅ 已舉報');

// 修改後
await telegram.answerCallbackQuery(callbackQuery.id, '🚨 已舉報');
```

**影響範圍**：
- 對話中舉報對方
- 舉報確認

---

#### 2.3 刪除操作（約 2 處）

**文件**：
- `src/telegram/handlers/draft.ts`

**修改範例**：
```typescript
// 修改前
await telegram.answerCallbackQuery(callbackQuery.id, '✅ 草稿已刪除');

// 修改後
await telegram.answerCallbackQuery(callbackQuery.id, '🗑️ 草稿已刪除');
```

**影響範圍**：
- 草稿刪除

---

#### 2.4 支付操作（約 2 處）

**文件**：
- `src/telegram/handlers/vip.ts`

**修改範例**：
```typescript
// 修改前
await telegram.answerCallbackQuery(callbackQuery.id, '✅ 正在準備支付...');

// 修改後
await telegram.answerCallbackQuery(callbackQuery.id, '💳 正在準備支付...');
```

**影響範圍**：
- VIP 訂閱支付
- 支付準備

---

#### 2.5 處理中操作（約 5 處）

**文件**：
- `src/telegram/handlers/draft.ts`
- `src/router.ts`

**修改範例**：
```typescript
// 修改前
await telegram.answerCallbackQuery(callbackQuery.id, '✅ 正在發送...');

// 修改後
await telegram.answerCallbackQuery(callbackQuery.id, '⏳ 正在發送...');
```

**影響範圍**：
- 草稿發送
- 其他處理中狀態

---

### 測試計劃

#### 手動測試清單
- [ ] 封鎖對方：顯示 🚫
- [ ] 舉報對方：顯示 🚨
- [ ] 刪除草稿：顯示 🗑️
- [ ] 準備支付：顯示 💳
- [ ] 處理中狀態：顯示 ⏳

---

## 🎯 Phase 3：補充缺失 Emoji（P2）

### 目標
為約 30 處沒有 Emoji 的提示添加 Emoji

### 預估時間
1-2 小時

### 修改範圍

#### 3.1 取消操作（約 5 處）

**文件**：
- `src/router.ts`
- `src/telegram/handlers/conversation_actions.ts`

**修改範例**：
```typescript
// 修改前
await telegram.answerCallbackQuery(callbackQuery.id, '已取消');

// 修改後
await telegram.answerCallbackQuery(callbackQuery.id, '❌ 已取消');
```

---

#### 3.2 未知操作（約 2 處）

**文件**：
- `src/router.ts`

**修改範例**：
```typescript
// 修改前
await telegram.answerCallbackQuery(callbackQuery.id, '未知的操作');

// 修改後
await telegram.answerCallbackQuery(callbackQuery.id, '❓ 未知的操作');
```

---

#### 3.3 其他缺失 Emoji 的提示（約 23 處）

**文件**：
- 各個 handler 文件

**策略**：
- 逐一檢查
- 根據語義添加正確的 Emoji

---

### 測試計劃

#### 手動測試清單
- [ ] 所有 Callback Query Answer 都有 Emoji
- [ ] Emoji 使用正確且符合語義

---

## 🎯 Phase 4：敏感內容檢測（新功能）

### 目標
為敏感內容檢測添加專門的提示

### 預估時間
1 小時

### 修改範圍

#### 4.1 敏感詞檢測

**文件**：
- `src/telegram/handlers/throw.ts`
- `src/domain/bottle.ts`

**新增提示**：
```typescript
// 本地敏感詞檢測
if (localModerationResult.flagged) {
  await telegram.sendMessage(
    chatId,
    `🚫 **內容包含敏感詞彙**\n\n` +
    `💡 請修改後重試\n\n` +
    `📖 查看社群規範：/rules`
  );
  return;
}

// AI 內容審核
if (aiModerationResult.flagged) {
  await telegram.sendMessage(
    chatId,
    `⛔ **內容違反社群規範**\n\n` +
    `💡 請遵守社群規則\n\n` +
    `📖 查看規範：/rules`
  );
  return;
}
```

---

## 🎯 Phase 5：i18n 與 RTL 優化（P2）

### 目標
確保 Emoji 支援多語言和 RTL 排版

### 預估時間
2-3 小時

### 修改範圍

#### 5.1 遷移 Emoji 到 i18n 文件

**文件**：
- `src/i18n/locales/zh-TW.ts`
- `src/i18n/locales/en.ts`
- ...

**修改範例**：
```typescript
// ❌ 硬編碼（現狀）
await telegram.answerCallbackQuery(callbackQuery.id, '✅ ' + i18n.t('success'));

// ✅ i18n（目標）
// zh-TW.ts
success: '✅ 成功'

// ar.ts (RTL)
success: '✅ تم بنجاح'

// 代碼
await telegram.answerCallbackQuery(callbackQuery.id, i18n.t('success'));
```

#### 5.2 檢查 RTL 顯示

**測試**：
- 使用阿拉伯文或希伯來文測試
- 確保 Emoji 位置正確
- 確保文字對齊正確

---

## 🛡️ 測試保護機制

### 1. Git 分支策略

```bash
# 創建優化分支
git checkout -b feature/ui-ux-emoji-optimization

# Phase 1
git checkout -b feature/ui-ux-emoji-p1-error-warning
# 完成後合併到主分支
git checkout feature/ui-ux-emoji-optimization
git merge feature/ui-ux-emoji-p1-error-warning

# Phase 2
git checkout -b feature/ui-ux-emoji-p2-scene-emoji
# ...

# Phase 3
git checkout -b feature/ui-ux-emoji-p3-missing-emoji
# ...

# 最後合併到 main
git checkout main
git merge feature/ui-ux-emoji-optimization
```

---

### 2. Smoke Test 執行計劃

**執行時機**：
- 每個 Phase 完成後
- 最終合併前

**測試範圍**：
- 註冊流程
- 丟瓶子
- 撿瓶子
- 對話管理
- VIP 功能
- 任務系統
- 廣告系統

**命令**：
```bash
pnpm test:smoke
```

---

### 3. 回歸測試清單

#### Phase 1 完成後
- [ ] 註冊流程：所有步驟正常
- [ ] VIP 限制：顯示警告而非錯誤
- [ ] 會話過期：顯示警告而非錯誤
- [ ] 真正的錯誤：仍顯示錯誤

#### Phase 2 完成後
- [ ] 封鎖功能：正常且顯示 🚫
- [ ] 舉報功能：正常且顯示 🚨
- [ ] 刪除功能：正常且顯示 🗑️
- [ ] 支付功能：正常且顯示 💳

#### Phase 3 完成後
- [ ] 所有 Callback Query Answer 都有 Emoji
- [ ] 所有功能正常運作

---

### 4. 漸進式部署

#### 部署策略
1. **Phase 1**：先部署到 Staging
2. **測試 24 小時**：觀察 Logs，確認無問題
3. **Phase 2**：部署到 Staging
4. **測試 24 小時**：觀察 Logs，確認無問題
5. **Phase 3**：部署到 Staging
6. **測試 24 小時**：觀察 Logs，確認無問題
7. **最終部署**：部署到 Production

#### 監控指標
- 錯誤率：應該保持不變
- 用戶投訴：應該減少
- 用戶滿意度：應該提升

---

## 📝 實施檢查清單

### 準備階段
- [x] 創建 `doc/UI_UX_EMOJI_STANDARDS.md`
- [x] 創建 `UI_UX_OPTIMIZATION_PLAN.md`
- [ ] 審核規範文檔
- [ ] 審核優化計劃
- [ ] 獲得批准

### Phase 1：區分錯誤和警告
- [ ] 創建 Git 分支
- [ ] 修改權限限制提示（約 10 處）
- [ ] 修改會話過期提示（約 15 處）
- [ ] 修改流程提示（約 15 處）
- [ ] 修改廣告限制提示（約 5 處）
- [ ] 修改額度不足提示（約 5 處）
- [ ] 執行 Lint 檢查
- [ ] 執行 Smoke Test
- [ ] 手動測試
- [ ] 提交並推送
- [ ] 部署到 Staging
- [ ] 觀察 24 小時

### Phase 2：添加場景 Emoji
- [ ] 創建 Git 分支
- [ ] 修改封鎖操作（約 3 處）
- [ ] 修改舉報操作（約 3 處）
- [ ] 修改刪除操作（約 2 處）
- [ ] 修改支付操作（約 2 處）
- [ ] 修改處理中操作（約 5 處）
- [ ] 執行 Lint 檢查
- [ ] 執行 Smoke Test
- [ ] 手動測試
- [ ] 提交並推送
- [ ] 部署到 Staging
- [ ] 觀察 24 小時

### Phase 3：補充缺失 Emoji
- [ ] 創建 Git 分支
- [ ] 修改取消操作（約 5 處）
- [ ] 修改未知操作（約 2 處）
- [ ] 修改其他缺失 Emoji（約 23 處）
- [ ] 執行 Lint 檢查
- [ ] 執行 Smoke Test
- [ ] 手動測試
- [ ] 提交並推送
- [ ] 部署到 Staging
- [ ] 觀察 24 小時

### Phase 4：敏感內容檢測
- [ ] 創建 Git 分支
- [ ] 添加敏感詞檢測提示
- [ ] 添加 AI 審核提示
- [ ] 執行 Lint 檢查
- [ ] 執行 Smoke Test
- [ ] 手動測試
- [ ] 提交並推送
- [ ] 部署到 Staging
- [ ] 觀察 24 小時

### 最終部署
- [ ] 合併所有 Phase 到主分支
- [ ] 執行完整回歸測試
- [ ] 更新 `doc/DEVELOPMENT_STANDARDS.md`
- [ ] 創建 Code Review 檢查清單
- [ ] 部署到 Production
- [ ] 監控 48 小時
- [ ] 標記版本（v1.8.0-ui-ux-optimization）

---

## 📊 預期成果

### 量化指標
- ✅ Callback Query Answer Emoji 使用率：60% → 100%
- ✅ 「錯誤 ❌」和「警告 ⚠️」正確率：40% → 100%
- ✅ 場景 Emoji 使用率：10% → 100%
- ✅ 用戶體驗一致性：70% → 95%

### 質化成果
- ✅ 用戶更容易理解訊息類型
- ✅ 錯誤和警告明確區分
- ✅ 視覺體驗更友好
- ✅ 新功能開發有明確規範

---

## 🚨 風險評估

### 高風險項目
1. **大量修改 Callback Query Answer**
   - 風險：可能影響用戶體驗
   - 緩解：漸進式部署，每個 Phase 測試 24 小時

2. **修改錯誤訊息**
   - 風險：可能影響錯誤處理邏輯
   - 緩解：只修改訊息內容，不修改邏輯

### 中風險項目
1. **添加新的 Emoji**
   - 風險：可能不符合用戶習慣
   - 緩解：遵循通用 Emoji 語義

### 低風險項目
1. **文檔更新**
   - 風險：幾乎無風險
   - 緩解：無需緩解

---

## 📅 時間表

| Phase | 任務 | 預估時間 | 開始日期 | 結束日期 |
|-------|------|---------|---------|---------|
| 準備 | 審核和批准 | 0.5 小時 | TBD | TBD |
| Phase 1 | 區分錯誤和警告 | 3-4 小時 | TBD | TBD |
| 測試 1 | Staging 測試 | 24 小時 | TBD | TBD |
| Phase 2 | 添加場景 Emoji | 2-3 小時 | TBD | TBD |
| 測試 2 | Staging 測試 | 24 小時 | TBD | TBD |
| Phase 3 | 補充缺失 Emoji | 1-2 小時 | TBD | TBD |
| 測試 3 | Staging 測試 | 24 小時 | TBD | TBD |
| Phase 4 | 敏感內容檢測 | 1 小時 | TBD | TBD |
| 測試 4 | Staging 測試 | 24 小時 | TBD | TBD |
| 最終 | 部署到 Production | 1 小時 | TBD | TBD |
| 監控 | Production 監控 | 48 小時 | TBD | TBD |

**總預估時間**：7.5-10.5 小時（開發）+ 120 小時（測試和監控）

---

## 📞 聯絡資訊

**專案負責人**：XunNi 開發團隊  
**文檔維護**：AI Assistant  
**最後更新**：2025-11-21

---

**版本歷史**：
- v1.0.0 (2025-11-21)：初版發布

