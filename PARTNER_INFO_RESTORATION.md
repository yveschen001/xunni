# ✅ 對方資料顯示修復完成

**修復時間：** 2025-01-17 07:10 UTC  
**部署版本：** bb519ca7-f334-468a-9945-a331f33e31aa  
**問題：** 歷史記錄和新訊息帖子缺少對方的資料卡信息

---

## 🐛 問題描述

**用戶反饋：**
> "现在这个问題是修好了，那你帮我把那个历史记录最上面噢，你还是要把对方的昵称mbti血型星座，还是要显示在最上面。不然不知道对方是谁。而且原本显示对方的新信息，是有昵称+****扰码的，现在都不见了，你要把他们找回来。"

**問題：**
1. 歷史記錄帖子沒有顯示對方的資料（昵稱、MBTI、血型、星座）
2. 新訊息帖子沒有顯示對方的資料
3. 昵稱沒有擾碼（例如：`張小明` → `張小****`）

---

## ✅ 修復方案

### 1. 修改 Domain 層函數簽名

**文件：** `src/domain/conversation_history.ts`

**添加 `partnerInfo` 參數：**
```typescript
export function buildHistoryPostContent(
  identifier: string,
  postNumber: number,
  messages: string[],
  totalMessages: number,
  partnerInfo?: {
    maskedNickname: string;
    mbti: string;
    bloodType: string;
    zodiac: string;
  }
): string {
  let content = `💬 與 #${identifier} 的對話記錄（第 ${postNumber} 頁）\n\n`;
  
  // Add partner info at the top
  if (partnerInfo) {
    content += `👤 對方資料：\n`;
    content += `📝 暱稱：${partnerInfo.maskedNickname}\n`;
    content += `🧠 MBTI：${partnerInfo.mbti}\n`;
    content += `🩸 血型：${partnerInfo.bloodType}\n`;
    content += `⭐ 星座：${partnerInfo.zodiac}\n\n`;
  }
  
  // ... rest of content
}
```

**同樣修改 `buildNewMessagePostContent`**

---

### 2. 修改 Service 層函數簽名

**文件：** `src/services/conversation_history.ts`

**添加 `partnerInfo` 參數到：**
- `updateConversationHistory()`
- `updateNewMessagePost()`

**在調用 `buildHistoryPostContent` 和 `buildNewMessagePostContent` 時傳遞 `partnerInfo`**

---

### 3. 修改 Handler 層傳遞對方資料

**文件：** `src/telegram/handlers/message_forward.ts`

**準備對方資料：**
```typescript
const { maskNickname } = await import('~/domain/invite');

// For sender's history: partner is receiver
const receiverNickname = receiver.nickname || receiver.username || '匿名用戶';
const receiverPartnerInfo = {
  maskedNickname: maskNickname(receiverNickname),
  mbti: receiver.mbti_result || '未設定',
  bloodType: receiver.blood_type || '未設定',
  zodiac: receiver.zodiac_sign || '未設定'
};

// For receiver's history: partner is sender
const senderNickname = sender.nickname || sender.username || '匿名用戶';
const senderPartnerInfo = {
  maskedNickname: maskNickname(senderNickname),
  mbti: sender.mbti_result || '未設定',
  bloodType: sender.blood_type || '未設定',
  zodiac: sender.zodiac_sign || '未設定'
};

// Pass to updateConversationHistory and updateNewMessagePost
await updateConversationHistory(..., receiverPartnerInfo);
await updateNewMessagePost(..., senderPartnerInfo);
```

---

### 4. 修改 Catch Handler

**文件：** `src/telegram/handlers/catch.ts`

**同樣準備對方資料並傳遞**

---

## 📊 修復效果

### Before（修復前）：

**歷史記錄帖子：**
```
💬 與 #1117XSWG 的對話記錄（第 1 頁）

━━━━━━━━━━━━━━━━

[06:51] 你：这是测试的第一泽信息
[06:52] 對方：刚刚好啊

━━━━━━━━━━━━━━━━

💡 這是對話的歷史記錄
📊 總訊息數：2 則
```

**新訊息帖子：**
```
💬 來自 #1117XSWG 的新訊息：

[06:52] 對方：
刚刚好啊

━━━━━━━━━━━━━━━━

💬 直接按 /reply 回覆訊息聊天
```

---

### After（修復後）：

**歷史記錄帖子：**
```
💬 與 #1117XSWG 的對話記錄（第 1 頁）

👤 對方資料：
📝 暱稱：yi0221****
🧠 MBTI：ENFP
🩸 血型：A
⭐ 星座：Cancer

━━━━━━━━━━━━━━━━

[06:51] 你：这是测试的第一泽信息
[06:52] 對方：刚刚好啊

━━━━━━━━━━━━━━━━

💡 這是對話的歷史記錄
📊 總訊息數：2 則
```

**新訊息帖子：**
```
💬 來自 #1117XSWG 的新訊息：

👤 對方資料：
📝 暱稱：yi0221****
🧠 MBTI：ENFP
🩸 血型：A
⭐ 星座：Cancer

[06:52] 對方：
刚刚好啊

━━━━━━━━━━━━━━━━

💬 直接按 /reply 回覆訊息聊天
📜 查看歷史記錄：#1117XSWG
🏠 返回主選單：/menu

[👤 查看對方資料卡]
```

---

## 🎯 關鍵改進

### 1. 對方資料顯示
- ✅ 歷史記錄帖子頂部顯示對方資料
- ✅ 新訊息帖子頂部顯示對方資料
- ✅ 包含：昵稱（擾碼）、MBTI、血型、星座

### 2. 昵稱擾碼
- ✅ 使用 `maskNickname()` 函數
- ✅ 格式：`張小****`（部分顯示 + 擾碼）

### 3. 資料完整性
- ✅ 如果資料未設定，顯示"未設定"
- ✅ 所有必要資料都顯示

---

## 📋 修改文件

**修改文件：** 3
- `src/domain/conversation_history.ts` - 添加 `partnerInfo` 參數
- `src/services/conversation_history.ts` - 傳遞 `partnerInfo`
- `src/telegram/handlers/message_forward.ts` - 準備對方資料
- `src/telegram/handlers/catch.ts` - 準備對方資料

**代碼變更：**
- ✅ 添加對方資料參數到 domain 函數
- ✅ 添加對方資料參數到 service 函數
- ✅ 在 handler 中準備並傳遞對方資料
- ✅ 使用 `maskNickname` 擾碼昵稱

---

## 🧪 測試步驟

1. **清空並重新開始**
   ```
   /dev_reset
   /start
   ```

2. **建立對話**
   ```
   /throw
   輸入瓶子內容
   
   另一帳號 /catch
   ```

3. **發送訊息並檢查**
   - 檢查歷史記錄帖子是否顯示對方資料
   - 檢查新訊息帖子是否顯示對方資料
   - 檢查昵稱是否正確擾碼

---

## 🚀 部署信息

- **Version ID:** `bb519ca7-f334-468a-9945-a331f33e31aa`
- **Bot:** `@xunni_dev_bot`
- **Environment:** Staging
- **Status:** ✅ Deployed
- **Lint:** 🟢 0 errors, ⚠️ 65 warnings

---

**準備好了！請測試並確認對方資料正確顯示！** 🎯

