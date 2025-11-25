# i18n CSV 對齊狀況報告

**檢查時間**: 2025-01-15  
**檢查工具**: `pnpm check:i18n`

## 📊 總體狀況

### ❌ 不完美 - 需要更新 CSV

- **CSV 總 keys**: 2473 個
- **代碼中使用但不在 CSV**: **363 個 keys** ⚠️
- **硬編碼中文字符串**: 213 處（主要為數據和邏輯判斷，不應替換）

## 🔍 詳細分析

### 缺失的 Keys 分類

#### 1. Admin 相關 (24 個)
- `admin.ban.noPermission`
- `admin.addUsageError`
- `admin.addCommand`
- `admin.addExample`
- `admin.addAlreadySuperAdmin`
- `admin.addAlreadyAdmin`
- `admin.addUserNotFound`
- `admin.operationFailed`
- `admin.removeUsageError`
- `admin.removeCommand`
- ... 還有 14 個

#### 2. Analytics 相關 (3 個)
- `analytics.providerComparisonTitle`
- `analytics.conversionStepsTitle`
- `analytics.purchaseSuccess`

#### 3. Broadcast 相關 (59 個)
- `broadcast.filter.invalidZodiac`
- `broadcast.filter.invalidMbti`
- `broadcast.usageError`
- `broadcast.correctFormat`
- `broadcast.messageContent`
- `broadcast.example`
- `broadcast.exampleMessage`
- `broadcast.created`
- `broadcast.targetAll`
- `broadcast.createFailed`
- ... 還有 49 個

#### 4. Buttons 相關 (6 個)
- `buttons.targetMale`
- `buttons.targetFemale`
- `buttons.targetAny`
- `buttons.targetAdvanced`
- `buttons.mbtiMenu`
- `buttons.returnToMenu`

#### 5. Catch 相關 (2 個)
- `catch.translationServiceFallback`
- `catch.translationServiceUnavailable`

#### 6. Common 相關 (11 個)
- `common.anonymousUser`
- `common.unknownOption`
- `common.operationFailed`
- `common.newUser`
- `common.free`
- `common.loading`
- `common.close`
- `common.bloodTypeA`
- `common.bloodTypeB`
- `common.bloodTypeAB`
- `common.bloodTypeO`

#### 7. Conversation 相關 (4 個)
- `conversation.mediaRestriction`
- `conversation.conversationEnded`
- `conversation.conversationInfoError`
- `conversation.replyHint`

#### 8. ConversationHistory 相關 (8 個)
- `conversationHistory.title`
- `conversationHistory.nickname`
- `conversationHistory.mbti`
- `conversationHistory.bloodType`
- `conversationHistory.zodiac`
- `conversationHistory.matchScore`
- `conversationHistory.totalMessages`
- `conversationHistory.lastUpdated`

#### 9. Country 相關 (30 個)
- `country.confirmTitle`
- `country.confirmDetected`
- `country.confirmQuestion`
- `country.confirmHint`
- `country.confirmReward`
- `country.confirmButton`
- `country.notCorrectButton`
- `country.useUnFlagButton`
- `country.confirmed`
- `country.confirmFailed`
- ... 還有 20 個

#### 10. Dev 相關 (21 個)
- `dev.notAvailableInProduction`
- ... 還有 20 個

#### 11. 其他類別
- `errors.*`: 多個
- `history.*`: 多個
- `messageForward.*`: 多個
- `mbtiTest.*`: 多個
- `officialAd.*`: 多個
- `onboarding.*`: 多個
- `router.*`: 多個
- `vip.*`: 多個
- ... 等等

## ⚠️ 問題影響

1. **翻譯團隊無法識別這些 keys**：
   - 外部翻譯工具無法看到這些 keys
   - 翻譯團隊無法為這些 keys 提供翻譯

2. **多語言支持不完整**：
   - 這些 keys 在代碼中使用，但沒有對應的翻譯
   - 用戶切換語言時，這些 keys 會 fallback 到 zh-TW

3. **維護困難**：
   - 新增 keys 時容易遺漏更新 CSV
   - 無法追蹤哪些 keys 需要翻譯

## ✅ 解決方案

### 方案 1：使用保持順序的腳本（推薦）

由於 `zh-TW.ts` 包含變量引用，腳本暫時無法直接解析。建議：

1. **手動追加新 keys**：
   - 打開 `i18n_for_translation.csv`
   - 將 363 個缺失的 keys 追加到文件末尾
   - 保持格式：`key,zh-TW,zh-CN,en,...`（其他語言列留空）

2. **從 zh-TW.ts 獲取翻譯**：
   - 在 `src/i18n/locales/zh-TW.ts` 中找到對應的翻譯
   - 複製到 CSV 的 zh-TW 列

### 方案 2：修復變量引用後使用腳本

修復 `zh-TW.ts` 中的變量引用：
- `${vipRevenue}` → `{vipRevenue}`（使用模板參數）
- `${formatIdentifier(...)}` → `{identifier}`（使用模板參數）

修復後，可以使用 `scripts/generate-csv-preserve-order.ts` 自動更新 CSV。

### 方案 3：使用現有腳本（會重新排序）

如果不在意 CSV 順序，可以使用：

```bash
pnpm tsx scripts/generate-csv-from-locales.ts
```

⚠️ **注意**：這個腳本會完全重寫 CSV，會重新排序所有 keys，可能影響翻譯團隊的工作。

## 📋 建議的下一步

1. **立即執行**：
   - 手動將 363 個缺失的 keys 追加到 CSV 末尾
   - 從 `zh-TW.ts` 複製對應的翻譯

2. **長期解決**：
   - 修復 `zh-TW.ts` 中的變量引用
   - 使用 `scripts/generate-csv-preserve-order.ts` 自動保持 CSV 同步

3. **建立流程**：
   - 每次新增 i18n keys 時，同時更新 CSV
   - 使用 `pnpm check:i18n` 定期檢查對齊狀況

## 🎯 結論

**當前狀態**：❌ **不完美**

- CSV 中有 2473 個 keys
- 代碼中使用但不在 CSV 中：**363 個 keys**
- **對齊率**：約 87%（2473 / (2473 + 363)）

**建議**：立即更新 CSV，添加缺失的 363 個 keys，確保 100% 對齊。

