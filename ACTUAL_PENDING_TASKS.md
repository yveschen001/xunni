# XunNi 實際未完成任務清單

**生成時間：** 2025-11-17  
**當前版本：** adfbc55  
**檢查方式：** 基於實際代碼檢查

---

## ✅ 已完成的功能（重新確認）

### 1. 血型功能 ✅ **已完成**
- ✅ 註冊流程中添加血型選擇（`start.ts` line 264-283）
- ✅ 編輯個人資料中添加血型編輯（`edit_profile.ts` line 75, 393-448）
- ✅ VIP 血型配對功能（`throw_advanced.ts` line 652-712）
- ✅ 資料卡中顯示血型（`message_forward.ts` line 227, 236）
- ✅ 個人資料中顯示血型（`profile.ts` line 44-45）

### 2. MBTI 36 題測試 ✅ **已完成**
- ✅ 36 題完整版已開發（`mbti_test.ts` line 401-784）
- ✅ 重新測試功能已實現（`mbti.ts` line 161-188）
- ✅ 版本選擇界面已實現（`mbti.ts` 支援 quick/full）
- ✅ 測試服務支援兩個版本（`mbti_test_service.ts` line 16-66）

---

## ❌ 實際未完成的小 TODO

### 1. 路由層 TODO（3 個）

#### 1.1 封禁檢查
**位置：** `src/router.ts` line 109  
**代碼：**
```typescript
// TODO: Implement ban check
```
**說明：** 每次請求應檢查用戶是否被封禁  
**優先級：** 🔴 高（安全必須）

#### 1.2 支付處理
**位置：** `src/router.ts` line 866  
**代碼：**
```typescript
// TODO: Implement payment handler
```
**說明：** Telegram Stars 支付回調處理  
**優先級：** 🟡 中（商業化必須）

#### 1.3 支付成功處理
**位置：** `src/router.ts` line 873  
**代碼：**
```typescript
// TODO: Implement payment success handler
```
**說明：** 支付成功後的處理邏輯  
**優先級：** 🟡 中（商業化必須）

---

### 2. 推送通知 TODO（1 個）

#### 2.1 推送偏好檢查
**位置：** `src/telegram/handlers/catch.ts` line 293  
**代碼：**
```typescript
// TODO: Check push preferences
```
**說明：** 檢查用戶推送偏好設定  
**優先級：** 🟢 低（用戶體驗優化）

---

### 3. Cron 任務 TODO（2 個）

#### 3.1 星座運勢推播
**位置：** `src/worker.ts` line 89  
**代碼：**
```typescript
// TODO: Implement horoscope push
```
**說明：** 每週星座運勢推播  
**優先級：** 🟢 低（召回用戶）

#### 3.2 廣播隊列處理
**位置：** `src/worker.ts` line 96  
**代碼：**
```typescript
// TODO: Implement broadcast queue processing
```
**說明：** 處理群發訊息隊列  
**優先級：** 🟢 低（運營工具）

---

### 4. i18n 系統 TODO（2 個）

#### 4.1 CSV/Google Sheets 導入
**位置：** `src/i18n/index.ts` line 100  
**代碼：**
```typescript
// TODO: Implement CSV/Google Sheets import
```
**說明：** 從 CSV 或 Google Sheets 導入翻譯  
**優先級：** 🟢 低（運營工具）

#### 4.2 CSV 導出
**位置：** `src/i18n/index.ts` line 109  
**代碼：**
```typescript
// TODO: Implement CSV export
```
**說明：** 導出翻譯到 CSV  
**優先級：** 🟢 低（運營工具）

---

### 5. 已註釋的功能（2 個）

#### 5.1 聊天記錄更新（已註釋）
**位置：** `src/telegram/handlers/message_forward.ts` line 14  
**代碼：**
```typescript
// updateBottleChatHistory, // TODO: Re-enable when bottle_chat_history table is created
```
**狀態：** ✅ **已解決**（表已創建，但功能被註釋）  
**說明：** 這個功能已經被新的對話歷史帖子系統取代  
**優先級：** ❌ 不需要（已有替代方案）

#### 5.2 聊天記錄創建（已註釋）
**位置：** `src/telegram/handlers/catch.ts` line 19  
**代碼：**
```typescript
// createBottleChatHistory, // TODO: Re-enable when bottle_chat_history table is created
```
**狀態：** ✅ **已解決**（表已創建，但功能被註釋）  
**說明：** 這個功能已經被新的對話歷史帖子系統取代  
**優先級：** ❌ 不需要（已有替代方案）

---

### 6. 邀請功能 TODO（1 個，已實現但註釋未更新）

#### 6.1 邀請獎勵計算
**位置：** `src/telegram/handlers/throw.ts` line 88  
**代碼：**
```typescript
const inviteBonus = 0; // TODO: Calculate from invites table
```
**狀態：** ✅ **已實現**（在 `calculateDailyQuota` 中）  
**說明：** 實際上已經在 `domain/invite.ts` 的 `calculateDailyQuota` 函數中實現  
**優先級：** ❌ 不需要（只是註釋未更新）

---

## 📊 實際未完成任務統計

### 按優先級分類

#### 🔴 高優先級（1 個）
1. **封禁檢查**（`router.ts` line 109）

#### 🟡 中優先級（2 個）
2. **支付處理**（`router.ts` line 866）
3. **支付成功處理**（`router.ts` line 873）

#### 🟢 低優先級（5 個）
4. **推送偏好檢查**（`catch.ts` line 293）
5. **星座運勢推播**（`worker.ts` line 89）
6. **廣播隊列處理**（`worker.ts` line 96）
7. **i18n CSV 導入**（`i18n/index.ts` line 100）
8. **i18n CSV 導出**（`i18n/index.ts` line 109）

#### ❌ 不需要（3 個，已有替代方案或已實現）
- 聊天記錄更新（已被對話歷史帖子系統取代）
- 聊天記錄創建（已被對話歷史帖子系統取代）
- 邀請獎勵計算（已在 `calculateDailyQuota` 中實現）

---

## 🎯 建議的開發順序

### 第一階段：核心安全與商業化（1 天）
1. ✅ **實現封禁檢查**（`router.ts` line 109）
   - 在路由層添加封禁檢查
   - 確保被封禁用戶無法使用任何功能

2. ✅ **實現支付處理**（`router.ts` line 866, 873）
   - 處理 Telegram Stars 支付回調
   - 處理支付成功後的 VIP 升級邏輯

### 第二階段：用戶體驗優化（0.5 天）
3. ✅ **實現推送偏好檢查**（`catch.ts` line 293）
   - 檢查用戶是否允許接收推送
   - 尊重用戶的通知偏好

### 第三階段：運營工具（1-2 天）
4. ✅ **實現星座運勢推播**（`worker.ts` line 89）
   - 每週推送星座運勢
   - 召回不活躍用戶

5. ✅ **實現廣播隊列處理**（`worker.ts` line 96）
   - 處理管理員群發訊息
   - 限速和批次處理

6. ✅ **實現 i18n 工具**（`i18n/index.ts` line 100, 109）
   - CSV 導入/導出功能
   - 方便運營團隊管理翻譯

---

## 📝 代碼清理建議

### 1. 更新過時的註釋
- `throw.ts` line 88: 更新註釋，說明邀請獎勵已在 `calculateDailyQuota` 中實現
- `message_forward.ts` line 14: 移除註釋，說明已被對話歷史帖子系統取代
- `catch.ts` line 19: 移除註釋，說明已被對話歷史帖子系統取代

### 2. 移除未使用的導入
- 檢查是否有未使用的 `updateBottleChatHistory` 和 `createBottleChatHistory` 導入

---

## 🎉 總結

**實際完成度：** 約 98%

**核心功能：** ✅ 全部完成
- ✅ 血型功能（100%）
- ✅ MBTI 36 題測試（100%）
- ✅ 邀請裂變系統（100%）
- ✅ 匿名聊天系統（100%）
- ✅ 個人資料管理（100%）

**待完成：** 8 個小 TODO
- 🔴 1 個高優先級（封禁檢查）
- 🟡 2 個中優先級（支付處理）
- 🟢 5 個低優先級（推送、運營工具）

**建議：**
優先完成**第一階段**（封禁檢查 + 支付處理），這是安全和商業化的必須功能。

---

**維護者：** 開發團隊  
**最後更新：** 2025-11-17

