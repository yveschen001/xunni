# VIP 智能配對通知修復

**日期**: 2025-11-21  
**問題**: VIP 用戶丟瓶子後，不知道是否配對成功，也不知道如何開始聊天

---

## 🐛 問題描述

用戶反饋：
> "这个不是应该要提示我已经跟其他人配对了吗？那是不是应该有个提示的信息，我到底是配对到谁？这样我才可以跟他启动聊天呢？"

### 原有實現的問題

1. **通知不明確**：
   - 成功訊息只顯示 `• 1 個智能配對對象（已配對）`
   - 但**沒有告訴用戶是誰**
   - 也**沒有對話標識符**

2. **用戶不知道如何開始聊天**：
   - 沒有明確的 "點擊這裡開始聊天" 提示
   - 沒有對話標識符，用戶無法使用 `/chats` 查看

3. **配對信息丟失**：
   - `createVipTripleBottle` 只返回 `bottleId`
   - 配對信息在內部處理，但沒有返回給調用者

---

## ✅ 解決方案

### 1. 修改返回類型

**文件**: `src/domain/vip_triple_bottle.ts`

```typescript
// 新增返回類型
export interface VipTripleBottleResult {
  bottleId: number;
  primaryMatch: {
    matched: boolean;
    conversationId?: number;
    conversationIdentifier?: string;
    matcherNickname?: string;
  };
}

// 修改函數返回類型
export async function createVipTripleBottle(
  db: DatabaseClient,
  user: User,
  bottleInput: ThrowBottleInput,
  env: Env
): Promise<VipTripleBottleResult> {
  // ...
  return {
    bottleId,
    primaryMatch,
  };
}
```

### 2. 返回配對信息

**文件**: `src/domain/vip_triple_bottle.ts`

```typescript
async function matchPrimarySlot(
  db: DatabaseClient,
  env: Env,
  bottleId: number,
  bottleOwner: User
): Promise<VipTripleBottleResult['primaryMatch']> {
  // ...
  if (matchResult && matchResult.user) {
    // ... 創建對話、發送通知 ...
    
    // 返回配對信息
    return {
      matched: true,
      conversationId,
      conversationIdentifier: buildConversationIdentifier(conversationId),
      matcherNickname: formatNicknameWithFlag(
        maskNickname(matchResult.user.nickname || '匿名'),
        matchResult.user.country_code
      ),
    };
  } else {
    return { matched: false };
  }
}
```

### 3. 更新成功訊息

**文件**: `src/telegram/handlers/throw.ts`

```typescript
// 接收配對信息
let vipMatchInfo: { matched: boolean; conversationId?: number; conversationIdentifier?: string; matcherNickname?: string } | null = null;
if (isVip) {
  const result = await createVipTripleBottle(db, user, bottleInput, env);
  bottleId = result.bottleId;
  vipMatchInfo = result.primaryMatch;
}

// 根據配對結果顯示不同訊息
if (isVip) {
  if (vipMatchInfo && vipMatchInfo.matched) {
    // 有智能配對成功
    successMessage =
      `✨ **VIP 特權啟動！智能配對成功！**\n\n` +
      `🎯 **第 1 個配對已完成：**\n` +
      `👤 對方：${vipMatchInfo.matcherNickname}\n` +
      `💬 對話標識符：${vipMatchInfo.conversationIdentifier}\n\n` +
      `📨 **另外 2 個槽位等待中：**\n` +
      `• 槽位 2：公共池（等待撿起）\n` +
      `• 槽位 3：公共池（等待撿起）\n\n` +
      `💡 你可能會收到 **最多 3 個對話**！\n` +
      `📊 今日已丟：${quotaDisplay}\n\n` +
      `🚀 **立即開始聊天：**\n` +
      `使用 /chats 查看所有對話，或直接回覆對方的訊息`;
  } else {
    // 智能配對未成功，3 個槽位都進入公共池
    successMessage =
      `✨ **VIP 特權啟動！**\n\n` +
      `🎯 你的瓶子已發送給 **3 個對象**：\n` +
      `• 槽位 1：公共池（等待撿起）\n` +
      `• 槽位 2：公共池（等待撿起）\n` +
      `• 槽位 3：公共池（等待撿起）\n\n` +
      `💬 你可能會收到 **最多 3 個對話**！\n` +
      `📊 今日已丟：${quotaDisplay}\n\n` +
      `💡 提示：每個對話都是獨立的，可以同時進行\n\n` +
      `使用 /chats 查看所有對話`;
  }
}
```

---

## 🎯 改進效果

### 配對成功時

**原來**:
```
✨ VIP 特權啟動！

🎯 你的瓶子已發送給 3 個對象：
• 1 個智能配對對象（已配對）  ❌ 不知道是誰
• 2 個公共池對象（等待中）

使用 /chats 查看所有對話  ❌ 不知道對話標識符
```

**現在**:
```
✨ VIP 特權啟動！智能配對成功！

🎯 第 1 個配對已完成：
👤 對方：🇹🇼 張**...  ✅ 知道是誰
💬 對話標識符：#1122ABCD  ✅ 有對話標識符

📨 另外 2 個槽位等待中：
• 槽位 2：公共池（等待撿起）
• 槽位 3：公共池（等待撿起）

💡 你可能會收到 最多 3 個對話！
📊 今日已丟：4/30+1

🚀 立即開始聊天：  ✅ 明確的行動指引
使用 /chats 查看所有對話，或直接回覆對方的訊息
```

### 配對未成功時

```
✨ VIP 特權啟動！

🎯 你的瓶子已發送給 3 個對象：
• 槽位 1：公共池（等待撿起）
• 槽位 2：公共池（等待撿起）
• 槽位 3：公共池（等待撿起）

💬 你可能會收到 最多 3 個對話！
📊 今日已丟：4/30+1

💡 提示：每個對話都是獨立的，可以同時進行

使用 /chats 查看所有對話
```

---

## ✅ 測試結果

```bash
pnpm vitest run tests/vip_triple_bottle.test.ts
```

**結果**: ✅ 16 tests passed

---

## 📝 相關文件

- `src/domain/vip_triple_bottle.ts` - 核心邏輯
- `src/telegram/handlers/throw.ts` - 成功訊息
- `tests/vip_triple_bottle.test.ts` - 單元測試

---

## 🐛 外鍵約束錯誤修復

### 問題
日誌顯示：
```
[VipTripleBottle] Smart match found: 6988195700
[VipTripleBottle] Failed to match primary slot: Error: D1_ERROR: FOREIGN KEY constraint failed: SQLITE_CONSTRAINT
```

### 根本原因
`updateSlotMatched` 更新 `bottle_match_slots` 表時，設置了外鍵字段：
- `matched_with_telegram_id` → 引用 `users.telegram_id`
- `conversation_id` → 引用 `conversations.id`

但沒有驗證：
1. 匹配用戶是否存在於數據庫中
2. 對話是否創建成功

### 解決方案

**文件**: `src/domain/vip_triple_bottle.ts`

```typescript
// 1. 驗證匹配用戶是否存在
const { findUserByTelegramId } = await import('~/db/queries/users');
const matchedUser = await findUserByTelegramId(db, matchResult.user.telegram_id);
if (!matchedUser) {
  console.error('[VipTripleBottle] Matched user not found in database:', matchResult.user.telegram_id);
  return { matched: false };
}

// 2. 創建對話
const conversationId = await createConversation(...);

// 3. 驗證對話創建成功
if (!conversationId) {
  console.error('[VipTripleBottle] Failed to create conversation');
  return { matched: false };
}

// 4. 更新槽位狀態（加上錯誤處理）
try {
  await updateSlotMatched(db, slot.id, matchResult.user.telegram_id, conversationId);
  console.error('[VipTripleBottle] Slot #1 matched');
} catch (updateError) {
  console.error('[VipTripleBottle] Failed to update slot status:', updateError);
  return { matched: false };
}

// 5. 發送通知（加上錯誤處理）
try {
  await sendMatchNotifications(db, env, bottleId, bottleOwner, matchedUser, conversationId);
  console.error('[VipTripleBottle] Notifications sent successfully');
} catch (notifyError) {
  console.error('[VipTripleBottle] Failed to send notifications:', notifyError);
  // 通知失敗不影響配對結果
}
```

---

## 🚀 部署狀態

1. ✅ 測試通過（16 tests）
2. ✅ Linter 無錯誤
3. ✅ 部署到 Staging 環境（Version: 8e057f0f-63e2-4fa5-af27-cbb829bad9cc）
4. ⏳ 手動測試配對成功和未成功兩種情況
5. ⏳ 部署到 Production

---

## 📝 測試指引

### 測試步驟
1. 在 Staging Bot 中丟一個 VIP 三倍瓶子
2. 觀察 Cloudflare Logs：
   - 應該看到 `[VipTripleBottle] Conversation created: XXX`
   - 應該看到 `[VipTripleBottle] Slot #1 matched`
   - 應該看到 `[VipTripleBottle] Notifications sent successfully`
3. 檢查成功訊息：
   - 應該顯示對方昵稱
   - 應該顯示對話標識符
   - 應該有明確的行動指引

### 預期結果
```
✨ VIP 特權啟動！智能配對成功！

🎯 第 1 個配對已完成：
👤 對方：🇹🇼 張**...
💬 對話標識符：#1122ABCD

📨 另外 2 個槽位等待中：
• 槽位 2：公共池（等待撿起）
• 槽位 3：公共池（等待撿起）

💡 你可能會收到 最多 3 個對話！
📊 今日已丟：4/30+1

🚀 立即開始聊天：
使用 /chats 查看所有對話，或直接回覆對方的訊息
```

---

**創建者**: AI Assistant  
**審核者**: 待審核  
**狀態**: ✅ 已部署到 Staging，等待測試

