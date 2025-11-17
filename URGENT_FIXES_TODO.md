# 緊急修復清單

**日期：** 2025-01-16  
**優先級：** 🔴 高

---

## ✅ 已完成

### 1. 暱稱擾碼規則修復
**狀態：** ✅ 完成  
**文件：** `src/domain/invite.ts`, `tests/domain/invite.test.ts`

**新規則：**
- 少於4字：原暱稱 + `****` 填充到10字
  - `張` → `張*********` (1+9=10)
  - `王五` → `王五********` (2+8=10)
  - `張小明` → `張小明*******` (3+7=10)
- 大於等於4字：顯示前6字 + 4個`*` 共10字
  - `Alice` → `Alice*****` (5+5=10)
  - `Alexander` → `Alexan****` (6+4=10)

---

## ⏳ 待修復

### 2. 星座顯示邏輯修復
**優先級：** 🔴 高  
**問題：** 星座從生日自動計算，不應該顯示「未設定」

**需要修改的文件：**
1. `src/telegram/handlers/catch.ts` (2處)
2. `src/telegram/handlers/profile.ts` (2處)
3. `src/telegram/handlers/menu.ts` (1處)
4. `src/telegram/handlers/conversation_actions.ts` (1處)

**修復方案：**
```typescript
// 錯誤：
const zodiac = user.zodiac_sign || '未設定';

// 正確：
const zodiac = user.zodiac_sign || '計算中';
// 或者如果有生日，應該總是有星座
```

---

### 3. 對話標識符改為時間戳+4位英文
**優先級：** 🔴 高  
**問題：** 當前 `#A`, `#B` 太短，容易重複

**新格式：** `#0723ABCD` (時間戳hhmm + 4位隨機英文)

**需要修改的文件：**
1. `src/domain/conversation_identifier.ts` - 修改生成邏輯
2. `src/db/migrations/0014_update_conversation_identifiers.sql` - 更新現有標識符
3. `tests/domain/conversation_identifier.test.ts` - 更新測試

**修復方案：**
```typescript
export function generateNextIdentifier(existingIdentifiers: string[]): string {
  const now = new Date();
  const hhmm = now.getHours().toString().padStart(2, '0') + 
               now.getMinutes().toString().padStart(2, '0');
  
  // Generate 4 random uppercase letters
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  const identifier = `#${hhmm}${randomPart}`;
  
  // Check if exists, regenerate if needed
  if (existingIdentifiers.includes(identifier)) {
    return generateNextIdentifier(existingIdentifiers);
  }
  
  return identifier;
}
```

---

### 4. Reply 提示文字修改
**優先級：** 🟡 中  

**需要修改的文件：**
1. `src/telegram/handlers/catch.ts`
2. `src/telegram/handlers/message_forward.ts`
3. 其他顯示 reply 提示的地方

**修改內容：**

**錯誤：**
```
💬 直接按 /reply 回覆訊息聊天
```

**正確：**
```
⚠️ 長按對方訊息，在子菜單中選擇"reply"，系統才會送出匿名聊天。
```

或

```
⚠️ 請在對方訊息下方直接回覆（或使用 /reply + 文字），系統才會送出匿名聊天。
```

---

### 5. 對話訊息翻譯功能
**優先級：** 🔴 高  
**問題：** 對方發送的訊息需要翻譯成接收者的語言

**需要修改的文件：**
1. `src/telegram/handlers/message_forward.ts`

**修復方案：**
```typescript
// 在轉發訊息時
const senderLanguage = sender.language_pref || 'zh-TW';
const receiverLanguage = receiver.language_pref || 'zh-TW';

if (senderLanguage !== receiverLanguage) {
  // 翻譯訊息
  const { translateMessage } = await import('~/services/translation');
  const translated = await translateMessage(
    originalText,
    senderLanguage,
    receiverLanguage,
    env
  );
  
  // 顯示原文 + 翻譯
  const messageToReceiver = 
    `📨 來自匿名對話的訊息（來自 ${formatIdentifier(receiverIdentifier)}）：\n\n` +
    `**原文 (${senderLanguage}):**\n${originalText}\n\n` +
    `**翻譯 (${receiverLanguage}):**\n${translated}`;
}
```

---

### 6. 資料卡添加血型信息
**優先級：** 🟡 中  

**需要修改的文件：**
1. `src/telegram/handlers/catch.ts` - 撿瓶子時顯示的資料卡
2. `src/telegram/handlers/conversation_actions.ts` - 對話中的資料卡

**修復方案：**
```typescript
// 添加血型顯示
const { getBloodTypeDisplay } = await import('~/domain/blood_type');
const bloodType = getBloodTypeDisplay(user.blood_type as any);

// 在資料卡中添加
`🩸 血型：${bloodType}\n` +
```

---

## 📋 修復順序建議

1. ✅ **暱稱擾碼規則** - 已完成
2. 🔴 **星座顯示邏輯** - 快速修復（5分鐘）
3. 🔴 **對話標識符** - 需要 migration（30分鐘）
4. 🔴 **訊息翻譯** - 重要功能（45分鐘）
5. 🟡 **Reply 提示** - UI 優化（10分鐘）
6. 🟡 **資料卡血型** - UI 優化（10分鐘）

---

## 🚀 快速部署計劃

### Phase 1: 立即部署（已完成）
- ✅ 暱稱擾碼規則

### Phase 2: 緊急修復（30分鐘）
- 星座顯示邏輯
- Reply 提示文字
- 資料卡血型

### Phase 3: 重要功能（1小時）
- 對話標識符更新
- 訊息翻譯功能

---

**建立時間：** 2025-01-16  
**狀態：** 🔴 進行中  
**預計完成時間：** 1.5 小時

