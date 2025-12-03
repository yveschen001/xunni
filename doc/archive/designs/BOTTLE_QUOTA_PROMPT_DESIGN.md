# 漂流瓶額度提示優化設計

## 📋 **需求分析**

### **當前問題**
- ❌ 額度用完時提示過於簡單
- ❌ 沒有根據用戶狀態（免費/VIP）和剩餘額度提供個性化建議
- ❌ 沒有引導用戶邀請朋友或升級 VIP

### **優化目標**
- ✅ 根據用戶類型和剩餘額度提供個性化提示
- ✅ 在適當時機引導用戶邀請朋友
- ✅ 在適當時機引導用戶升級 VIP
- ✅ 提供快捷操作按鈕

---

## 🎯 **提示規則設計**

### **免費用戶（基礎額度 3，最大 10）**

#### **情況 1：額度不足（3-9 個）**
**觸發條件：** `throwsToday >= quota && quota < 10`

**提示內容：**
```
❌ 今日漂流瓶配額已用完（${throwsToday}/${quota}）

💡 想要更多配額嗎？

🎁 邀請朋友一起玩：
• 每位朋友成功送出漂流瓶
• 你可獲得 +1 配額（永久）
• 最多可增加到 10 個/天

[📲 去邀請朋友]

或者升級 VIP 獲得 30+ 配額：/vip
```

**按鈕：**
- `📲 去邀請朋友` → 跳轉到個人資料頁面（顯示邀請鏈接）

---

#### **情況 2：額度已滿（10 個）**
**觸發條件：** `throwsToday >= quota && quota >= 10`

**提示內容：**
```
❌ 今日漂流瓶配額已用完（${throwsToday}/10）

🌟 已達免費用戶最大配額！

想要更多配額？升級 VIP：
• 基礎配額：30 個/天
• 邀請獎勵：最多 100 個/天
• 更多專屬功能

[💎 立即升級 VIP]
```

**按鈕：**
- `💎 立即升級 VIP` → `/vip` 命令

---

### **VIP 用戶（基礎額度 30，最大 100）**

#### **情況 1：額度不足（30-99 個）**
**觸發條件：** `throwsToday >= quota && quota < 100`

**提示內容：**
```
❌ 今日漂流瓶配額已用完（${throwsToday}/${quota}）

💎 VIP 專屬提示：

🎁 邀請朋友獲得更多配額：
• 每位朋友成功送出漂流瓶
• 你和朋友都可獲得 +1 配額
• VIP 最多可增加到 100 個/天

[📲 去邀請朋友]
```

**按鈕：**
- `📲 去邀請朋友` → 跳轉到個人資料頁面（顯示邀請鏈接）

---

#### **情況 2：額度已滿（100 個）**
**觸發條件：** `throwsToday >= quota && quota >= 100`

**提示內容：**
```
❌ 今日漂流瓶配額已用完（${throwsToday}/100）

🎉 恭喜！你已達到 VIP 最大配額！

今天已經非常活躍了～
明天再來繼續尋找有緣人吧！

💡 你可以：
• 回覆現有對話：/chats
• 查看個人資料：/profile
```

**無按鈕**（已達最大值，無需引導）

---

## 📊 **提示時機**

### **時機 1：丟瓶子時額度不足**
**位置：** `src/telegram/handlers/throw.ts` - `handleThrow()` 函數

**當前代碼：**
```typescript
if (!canThrowBottle(throwsToday, isVip, inviteBonus)) {
  const { quota } = getBottleQuota(isVip, inviteBonus);
  await telegram.sendMessage(
    chatId,
    `❌ 今日漂流瓶配額已用完（${throwsToday}/${quota}）\n\n` +
      `💡 升級 VIP 可獲得更多配額：/vip`
  );
  return;
}
```

**優化為：**
```typescript
if (!canThrowBottle(throwsToday, isVip, inviteBonus)) {
  const { quota, maxQuota } = getBottleQuota(isVip, inviteBonus);
  const promptMessage = getQuotaExhaustedPrompt(isVip, throwsToday, quota, maxQuota);
  const buttons = getQuotaExhaustedButtons(isVip, quota, maxQuota);
  
  await telegram.sendMessageWithButtons(chatId, promptMessage, buttons);
  return;
}
```

---

### **時機 2：成功丟出瓶子後（可選提醒）**
**位置：** `src/telegram/handlers/throw.ts` - 成功訊息

**當前代碼：**
```typescript
await telegram.sendMessage(
  chatId,
  `🎉 漂流瓶已丟出！\n\n` +
    `瓶子 ID：#${bottleId}\n` +
    `今日已丟：${throwsToday}/${quota}\n\n` +
    `💡 你的瓶子將在 24 小時內等待有緣人撿起～\n\n` +
    `想要撿別人的瓶子嗎？使用 /catch`
);
```

**優化建議：** 
- 當剩餘額度較少時（如剩 1-2 個），可以添加溫馨提示
- 但不要每次都提示，避免打擾

---

## 🛠️ **實現方案**

### **1. 創建提示生成函數**

**文件：** `src/domain/bottle_quota_prompt.ts`（新建）

```typescript
/**
 * Bottle Quota Prompt Domain Logic
 * Generates personalized quota exhausted prompts
 */

export interface QuotaPromptResult {
  message: string;
  buttons: Array<Array<{ text: string; callback_data?: string; url?: string }>>;
}

/**
 * Generate quota exhausted prompt based on user status
 */
export function getQuotaExhaustedPrompt(
  isVip: boolean,
  throwsToday: number,
  quota: number,
  maxQuota: number
): QuotaPromptResult {
  // Free user - quota not full (3-9)
  if (!isVip && quota < 10) {
    return {
      message:
        `❌ 今日漂流瓶配額已用完（${throwsToday}/${quota}）\n\n` +
        `💡 想要更多配額嗎？\n\n` +
        `🎁 邀請朋友一起玩：\n` +
        `• 每位朋友成功送出漂流瓶\n` +
        `• 你和朋友都可獲得 +1 配額\n` +
        `• 最多可增加到 10 個/天\n\n` +
        `或者升級 VIP 獲得 30+ 配額：/vip`,
      buttons: [
        [{ text: '📲 去邀請朋友', callback_data: 'show_invite' }],
      ],
    };
  }

  // Free user - quota full (10)
  if (!isVip && quota >= 10) {
    return {
      message:
        `❌ 今日漂流瓶配額已用完（${throwsToday}/10）\n\n` +
        `🌟 已達免費用戶最大配額！\n\n` +
        `想要更多配額？升級 VIP：\n` +
        `• 基礎配額：30 個/天\n` +
        `• 邀請獎勵：最多 100 個/天\n` +
        `• 更多專屬功能`,
      buttons: [
        [{ text: '💎 立即升級 VIP', callback_data: 'show_vip' }],
      ],
    };
  }

  // VIP user - quota not full (30-99)
  if (isVip && quota < 100) {
    return {
      message:
        `❌ 今日漂流瓶配額已用完（${throwsToday}/${quota}）\n\n` +
        `💎 VIP 專屬提示：\n\n` +
        `🎁 邀請朋友獲得更多配額：\n` +
        `• 每位朋友成功送出漂流瓶\n` +
        `• 你和朋友都可獲得 +1 配額\n` +
        `• VIP 最多可增加到 100 個/天`,
      buttons: [
        [{ text: '📲 去邀請朋友', callback_data: 'show_invite' }],
      ],
    };
  }

  // VIP user - quota full (100)
  return {
    message:
      `❌ 今日漂流瓶配額已用完（${throwsToday}/100）\n\n` +
      `🎉 恭喜！你已達到 VIP 最大配額！\n\n` +
      `今天已經非常活躍了～\n` +
      `明天再來繼續尋找有緣人吧！\n\n` +
      `💡 你可以：\n` +
      `• 回覆現有對話：/chats\n` +
      `• 查看個人資料：/profile`,
    buttons: [],
  };
}
```

---

### **2. 添加 Callback 處理**

**文件：** `src/router.ts`

**添加：**
```typescript
// Show invite link
if (callbackData === 'show_invite') {
  const { handleProfile } = await import('./telegram/handlers/profile');
  await handleProfile(
    {
      ...callbackQuery.message,
      from: callbackQuery.from,
    } as TelegramMessage,
    env
  );
  await telegram.answerCallbackQuery(callbackQuery.id, '查看你的邀請鏈接');
  return;
}

// Show VIP info
if (callbackData === 'show_vip') {
  const { handleVip } = await import('./telegram/handlers/vip');
  await handleVip(
    {
      ...callbackQuery.message,
      from: callbackQuery.from,
    } as TelegramMessage,
    env
  );
  await telegram.answerCallbackQuery(callbackQuery.id, '查看 VIP 方案');
  return;
}
```

---

### **3. 更新 throw.ts**

**文件：** `src/telegram/handlers/throw.ts`

**修改：**
```typescript
// Check daily quota
const throwsToday = await getDailyThrowCount(db, telegramId);
const inviteBonus = user.successful_invites || 0;
const isVip = !!(user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > new Date());

if (!canThrowBottle(throwsToday, isVip, inviteBonus)) {
  const { quota, maxQuota } = getBottleQuota(isVip, inviteBonus);
  
  // ✨ NEW: Use personalized prompt
  const { message, buttons } = getQuotaExhaustedPrompt(isVip, throwsToday, quota, maxQuota);
  
  if (buttons.length > 0) {
    await telegram.sendMessageWithButtons(chatId, message, buttons);
  } else {
    await telegram.sendMessage(chatId, message);
  }
  
  return;
}
```

---

## 🎨 **用戶體驗流程**

### **免費用戶（額度 5/5）**
```
用戶：/throw
  ↓
Bot：❌ 今日漂流瓶配額已用完（5/5）
     💡 想要更多配額嗎？
     🎁 邀請朋友一起玩...
     [📲 去邀請朋友]
  ↓
用戶點擊按鈕
  ↓
Bot：顯示個人資料和邀請鏈接
```

### **免費用戶（額度 10/10）**
```
用戶：/throw
  ↓
Bot：❌ 今日漂流瓶配額已用完（10/10）
     🌟 已達免費用戶最大配額！
     想要更多配額？升級 VIP...
     [💎 立即升級 VIP]
  ↓
用戶點擊按鈕
  ↓
Bot：顯示 VIP 購買頁面
```

### **VIP 用戶（額度 50/50）**
```
用戶：/throw
  ↓
Bot：❌ 今日漂流瓶配額已用完（50/50）
     💎 VIP 專屬提示：
     🎁 邀請朋友獲得更多配額...
     [📲 去邀請朋友]
  ↓
用戶點擊按鈕
  ↓
Bot：顯示個人資料和邀請鏈接
```

---

## ✅ **安全保證**

### **1. 不破壞現有功能**
- ✅ 只修改提示訊息和按鈕
- ✅ 不修改額度計算邏輯
- ✅ 不修改數據庫結構
- ✅ 使用 try-catch 包裹新代碼

### **2. 優雅降級**
```typescript
try {
  const { message, buttons } = getQuotaExhaustedPrompt(isVip, throwsToday, quota, maxQuota);
  if (buttons.length > 0) {
    await telegram.sendMessageWithButtons(chatId, message, buttons);
  } else {
    await telegram.sendMessage(chatId, message);
  }
} catch (error) {
  // Fallback to simple message
  console.error('[handleThrow] Failed to send quota prompt:', error);
  await telegram.sendMessage(
    chatId,
    `❌ 今日漂流瓶配額已用完（${throwsToday}/${quota}）`
  );
}
```

---

## 📊 **預期效果**

### **用戶增長**
- ✅ 提高邀請轉化率
- ✅ 增加 VIP 購買意願
- ✅ 提升用戶活躍度

### **用戶體驗**
- ✅ 清晰的額度說明
- ✅ 個性化的建議
- ✅ 便捷的操作按鈕

---

## 🚀 **實現步驟**

1. ✅ 創建 `src/domain/bottle_quota_prompt.ts`
2. ✅ 添加 Callback 處理到 `src/router.ts`
3. ✅ 更新 `src/telegram/handlers/throw.ts`
4. ✅ 測試所有情況
5. ✅ 部署到 Staging

---

**設計完成，準備實現！** 🎉


