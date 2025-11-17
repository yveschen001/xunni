# 血型功能開發計劃

**狀態：** 待開發  
**優先級：** 高  
**預計工時：** 4-6 小時

---

## 📋 功能概述

開發完整的血型功能，包括註冊時填寫、編輯、以及 VIP 用戶的血型配對功能。

---

## 🎯 功能需求

### 1. 註冊流程中添加血型選擇

**位置：** 在生日確認之後，國家選擇之前

**流程：**
```
Step 3: 生日（二次確認）
  ↓
Step 4: 血型（新增）← 插入這裡
  ↓
Step 5: 國家
  ↓
...
```

**UI 設計：**

```
🩸 **請選擇你的血型**

💡 填寫血型可用於未來的血型配對功能（VIP 專屬）

請選擇你的血型：

[A 型]  [B 型]
[AB 型] [O 型]
[不確定/跳過]
```

**業務規則：**
- 可選填（允許跳過）
- 選擇後需要二次確認
- 儲存到 `users.blood_type` 欄位
- 可以選擇「不確定」（儲存為 NULL）

### 2. 資料庫設計

**已存在欄位：**
```sql
ALTER TABLE users ADD COLUMN blood_type TEXT; -- 已存在
```

**值範圍：**
- `'A'` - A 型
- `'B'` - B 型
- `'AB'` - AB 型
- `'O'` - O 型
- `NULL` - 未填寫或不確定

### 3. 編輯血型功能

**入口：**
- `/profile` → 「✏️ 編輯資料」 → 「🩸 編輯血型」

**流程：**
1. 顯示當前血型
2. 提供選項：A / B / AB / O / 不確定
3. 確認修改
4. 更新資料庫

**限制：**
- 可以隨時修改（不像性別和生日）
- 修改次數無限制

### 4. VIP 血型配對功能

**功能描述：**
- VIP 用戶在丟瓶子時可以選擇篩選血型
- 只會配對到指定血型的用戶

**UI 設計：**

```
🌊 **丟出漂流瓶**（VIP 篩選）

📝 請輸入瓶子內容...

🎯 **配對篩選**（VIP 專屬）

👤 性別偏好：女生
🧠 MBTI 偏好：任何
⭐ 星座偏好：任何
🩸 血型偏好：[選擇血型] ← 新增

[🌊 丟出瓶子]
```

**篩選選項：**
- 任何血型（預設）
- A 型
- B 型
- AB 型
- O 型

---

## 🛠️ 技術實現

### 1. 註冊流程修改

**文件：** `src/telegram/handlers/start.ts`

**修改位置：**
```typescript
// 在生日確認後添加血型步驟
if (user.onboarding_step === 'birthday_confirm') {
  // 跳轉到血型選擇
  await updateUser(db, telegramId, { onboarding_step: 'blood_type' });
  // 顯示血型選擇 UI
}

// 新增血型步驟處理
if (user.onboarding_step === 'blood_type') {
  // 處理血型選擇
  // 儲存到 users.blood_type
  // 跳轉到國家選擇
}
```

### 2. 編輯功能實現

**文件：** `src/telegram/handlers/edit_profile.ts`

**新增函數：**
```typescript
export async function handleEditBloodType(
  callbackQuery: TelegramCallbackQuery,
  env: Env
): Promise<void> {
  // 顯示血型選擇 UI
  // 儲存到 session
  // 等待用戶選擇
}

export async function handleBloodTypeSelection(
  callbackQuery: TelegramCallbackQuery,
  bloodType: 'A' | 'B' | 'AB' | 'O' | null,
  env: Env
): Promise<void> {
  // 確認選擇
  // 更新資料庫
  // 顯示成功訊息
}
```

**Router 添加：**
```typescript
// src/router.ts
if (data === 'edit_blood_type') {
  const { handleEditBloodType } = await import('./telegram/handlers/edit_profile');
  await handleEditBloodType(callbackQuery, env);
  return;
}

if (data.startsWith('blood_type_')) {
  const { handleBloodTypeSelection } = await import('./telegram/handlers/edit_profile');
  const bloodType = data.replace('blood_type_', '');
  await handleBloodTypeSelection(callbackQuery, bloodType as any, env);
  return;
}
```

### 3. VIP 配對功能實現

**文件：** `src/telegram/handlers/throw_advanced.ts`

**修改：**
```typescript
// 添加血型偏好到 session
interface ThrowAdvancedSession {
  gender_pref?: string;
  mbti_pref?: string;
  zodiac_pref?: string;
  blood_type_pref?: string; // 新增
}

// 在配對查詢中添加血型篩選
const matchingQuery = `
  SELECT * FROM bottles
  WHERE ...
  AND (? IS NULL OR blood_type = ?)
  ...
`;
```

---

## 📊 資料庫查詢

### 查詢有血型的用戶數量
```sql
SELECT blood_type, COUNT(*) as count
FROM users
WHERE blood_type IS NOT NULL
GROUP BY blood_type;
```

### 查詢可配對的血型用戶
```sql
SELECT COUNT(*) as count
FROM users
WHERE blood_type = 'A'
  AND gender = 'female'
  AND onboarding_step = 'completed';
```

---

## 🧪 測試計劃

### 單元測試
- [ ] 血型驗證函數測試
- [ ] 血型配對邏輯測試

### 集成測試
- [ ] 註冊流程測試（包含血型）
- [ ] 編輯血型功能測試
- [ ] VIP 血型配對測試

### 手動測試
- [ ] 註冊時填寫血型
- [ ] 註冊時跳過血型
- [ ] 編輯血型（A → B → O → 不確定）
- [ ] VIP 用戶血型配對
- [ ] 非 VIP 用戶看不到血型配對選項

---

## 📝 i18n 翻譯鍵

需要添加的翻譯鍵：

```typescript
// src/i18n/types.ts
export interface TranslationKeys {
  // ...
  bloodType: {
    prompt: string;           // "請選擇你的血型"
    description: string;      // "填寫血型可用於未來的血型配對功能（VIP 專屬）"
    typeA: string;            // "A 型"
    typeB: string;            // "B 型"
    typeAB: string;           // "AB 型"
    typeO: string;            // "O 型"
    unknown: string;          // "不確定/跳過"
    confirm: string;          // "確認血型"
    edit: string;             // "編輯血型"
    current: string;          // "當前血型"
    notSet: string;           // "未設定"
    updated: string;          // "血型已更新"
    vipFilter: string;        // "血型偏好（VIP）"
    any: string;              // "任何血型"
  };
}
```

---

## 🎨 UI 設計細節

### 註冊時的血型選擇

```
🩸 **請選擇你的血型**

💡 填寫血型可用於未來的血型配對功能（VIP 專屬）

請選擇你的血型：

┌─────────────────┐
│  [A 型]  [B 型]  │
│  [AB 型] [O 型]  │
│  [不確定/跳過]    │
└─────────────────┘
```

### 血型確認

```
🩸 **確認血型**

你選擇的血型是：A 型

⚠️ 血型可以在註冊後修改

[✅ 確認] [↩️ 重新選擇]
```

### 編輯血型

```
🩸 **編輯血型**

當前血型：A 型

請選擇新的血型：

[A 型] [B 型] [AB 型] [O 型]
[不確定]

[↩️ 返回]
```

### VIP 血型配對

```
🌊 **丟出漂流瓶**（VIP 篩選）

🎯 **配對篩選**（VIP 專屬）

👤 性別偏好：女生
🧠 MBTI 偏好：任何
⭐ 星座偏好：任何
🩸 血型偏好：A 型 ← 已選擇

💡 當前篩選條件下約有 15 個可配對用戶

[🌊 丟出瓶子] [🔄 重設篩選]
```

---

## 📅 開發時程

### Phase 1: 註冊流程（2 小時）
- [ ] 添加血型步驟到註冊流程
- [ ] UI 設計和實現
- [ ] 二次確認邏輯
- [ ] 測試

### Phase 2: 編輯功能（1 小時）
- [ ] 添加編輯血型入口
- [ ] 實現編輯邏輯
- [ ] 更新 UI
- [ ] 測試

### Phase 3: VIP 配對（2 小時）
- [ ] 添加血型篩選選項
- [ ] 修改配對查詢邏輯
- [ ] UI 更新
- [ ] 測試

### Phase 4: i18n 和文檔（1 小時）
- [ ] 添加所有翻譯
- [ ] 更新 SPEC.md
- [ ] 更新測試文檔
- [ ] 部署和驗證

---

## 🔗 相關文檔

- `doc/SPEC.md` - 更新註冊流程和資料庫 schema
- `doc/ONBOARDING_FLOW.md` - 更新註冊流程圖
- `doc/VIP_FEATURES.md` - 更新 VIP 功能列表
- `doc/I18N_GUIDE.md` - 添加血型相關翻譯

---

## ✅ 驗收標準

### 功能完整性
- [ ] 註冊時可以選擇血型
- [ ] 可以跳過血型選擇
- [ ] 可以編輯血型
- [ ] VIP 用戶可以使用血型配對
- [ ] 非 VIP 用戶看不到血型配對選項

### 資料正確性
- [ ] 血型正確儲存到資料庫
- [ ] 血型配對查詢正確
- [ ] 統計數據正確

### UI/UX
- [ ] UI 清晰易懂
- [ ] 提示訊息友好
- [ ] 按鈕排列合理
- [ ] 支援所有語言

### 測試
- [ ] 所有單元測試通過
- [ ] 集成測試通過
- [ ] 手動測試通過
- [ ] Smoke Test 更新並通過

---

**建立時間：** 2025-01-16  
**維護者：** 開發團隊  
**狀態：** 待開發

