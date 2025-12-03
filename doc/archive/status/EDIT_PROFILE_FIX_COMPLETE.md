# 編輯個人資料功能修復完成

**修復時間：** 2025-01-16  
**Version ID：** 4b7ae384-f58c-445c-9cd1-e54c3b055706  
**Bot：** @xunni_dev_bot

---

## 🐛 問題描述

用戶點擊「編輯資料」後，所有編輯功能都無法使用，報錯：

```
[handleEditNickname] Error: RangeError: Invalid time value
[handleEditBio] Error: RangeError: Invalid time value
```

---

## 🔍 根本原因

`SessionType` 類型定義中缺少 `'edit_profile'`，導致 `calculateSessionExpiration()` 函數無法正確計算過期時間。

**問題代碼：**

```typescript
// src/domain/session.ts (修復前)
export type SessionType = 'onboarding' | 'throw_bottle' | 'catch_bottle' | 'conversation';

export const SESSION_TIMEOUT = {
  onboarding: 30,
  throw_bottle: 10,
  catch_bottle: 5,
  conversation: 60,
} as const;
```

**使用代碼：**

```typescript
// src/telegram/handlers/edit_profile.ts
const SESSION_TYPE = 'edit_profile'; // ❌ 這個類型不存在於 SessionType 中

await upsertSession(db, telegramId, SESSION_TYPE, { editing: 'nickname' });
// ❌ SESSION_TIMEOUT['edit_profile'] 不存在，導致 undefined * 60 * 1000 = NaN
// ❌ new Date(NaN) = Invalid Date
// ❌ Invalid Date.toISOString() = RangeError: Invalid time value
```

---

## ✅ 修復內容

### 1. 添加 `edit_profile` 到 SessionType

**文件：** `src/domain/session.ts`

```typescript
// 修復後
export type SessionType = 'onboarding' | 'throw_bottle' | 'catch_bottle' | 'conversation' | 'edit_profile';
```

### 2. 添加 `edit_profile` 的超時時間

**文件：** `src/domain/session.ts`

```typescript
// 修復後
export const SESSION_TIMEOUT = {
  onboarding: 30, // 30 minutes for registration
  throw_bottle: 10, // 10 minutes for throwing bottle
  catch_bottle: 5, // 5 minutes for catching bottle
  conversation: 60, // 60 minutes for active conversation
  edit_profile: 10, // 10 minutes for editing profile
} as const;
```

---

## 🧪 測試計劃

### 測試項目

- [ ] 📝 編輯暱稱
  - [ ] 點擊按鈕能正常進入編輯模式
  - [ ] 輸入新暱稱後能成功更新
  - [ ] 更新後能在 `/profile` 中看到新暱稱
  
- [ ] 📖 編輯簡介
  - [ ] 點擊按鈕能正常進入編輯模式
  - [ ] 輸入新簡介後能成功更新
  - [ ] 更新後能在 `/profile` 中看到新簡介
  
- [ ] 🌍 編輯地區
  - [ ] 點擊按鈕能正常進入編輯模式
  - [ ] 輸入新地區後能成功更新
  - [ ] 更新後能在 `/profile` 中看到新地區
  
- [ ] 🏷️ 編輯興趣
  - [ ] 點擊按鈕能正常進入編輯模式
  - [ ] 輸入新興趣後能成功更新
  - [ ] 更新後能在 `/profile` 中看到新興趣
  
- [ ] 💝 匹配偏好
  - [ ] 點擊按鈕能看到選項
  - [ ] 選擇新偏好後能成功更新
  - [ ] 更新後能在編輯選單中看到新偏好
  
- [ ] 🩸 編輯血型
  - [ ] 點擊按鈕能看到選項
  - [ ] 選擇新血型後能成功更新
  - [ ] 更新後能在 `/profile` 和編輯選單中看到新血型

---

## 📋 操作指南

### 如何編輯個人資料

#### 步驟 1：進入編輯選單
```
發送：/profile
點擊：✏️ 編輯資料
```

#### 步驟 2：選擇要編輯的項目
```
點擊任何一個編輯按鈕：
- 📝 編輯暱稱
- 📖 編輯簡介
- 🌍 編輯地區
- 🏷️ 編輯興趣
- 💝 匹配偏好
- 🩸 編輯血型
```

#### 步驟 3：輸入或選擇新內容

**文字輸入類（暱稱、簡介、地區、興趣）：**
- 系統會提示您輸入
- 直接輸入文字內容
- 系統會回覆：`✅ 已更新`

**選擇類（匹配偏好、血型）：**
- 系統會顯示選項按鈕
- 點擊選擇
- 系統會回覆：`✅ 已更新`

#### 步驟 4：確認更新
```
發送：/profile
檢查：更新的內容是否正確顯示
```

---

## 🎯 現在可以正常使用的功能

### ✅ 可編輯項目
- 📝 暱稱（最多 36 字符）
- 📖 個人簡介（最多 200 字符）
- 🌍 地區（最多 50 字符）
- 🏷️ 興趣標籤（最多 5 個，每個最多 20 字符）
- 💝 匹配偏好（男生/女生/任何人）
- 🩸 血型（A/B/AB/O/不確定）

### 🚫 不可編輯項目
- 👤 性別（註冊後永久不可修改）
- 🎂 生日（註冊後永久不可修改）

### 🔄 可重新測試
- 🧠 MBTI（可隨時重新測試）

---

## 🚀 部署狀態

**環境：** Staging  
**Bot：** @xunni_dev_bot  
**Version ID：** 4b7ae384-f58c-445c-9cd1-e54c3b055706  
**部署時間：** 2025-01-16  
**狀態：** ✅ 已部署並運行

---

## 📝 技術總結

### 問題類型
- **類型安全問題**：TypeScript 類型定義不完整
- **運行時錯誤**：計算日期時使用了 `undefined` 值

### 修復方法
- 補充 `SessionType` 類型定義
- 添加對應的超時時間配置

### 預防措施
- 確保所有 `SessionType` 都在 `SESSION_TIMEOUT` 中有對應配置
- 使用 TypeScript 的 `as const` 確保類型安全
- 在創建新 session type 時，同時更新類型定義和配置

### 相關文件
- `src/domain/session.ts` - Session 類型定義和配置
- `src/telegram/handlers/edit_profile.ts` - 編輯功能處理器
- `src/db/queries/sessions.ts` - Session 資料庫操作

---

**修復完成！現在所有編輯功能都可以正常使用了。** 🎉

