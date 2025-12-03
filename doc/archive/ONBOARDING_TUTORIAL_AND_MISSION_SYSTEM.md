# XunNi 新手引導與任務系統設計

> **設計日期**: 2025-11-19  
> **狀態**: 規劃階段（待審核）  
> **參考**: Bottled App 新手引導流程

---

## 📋 目錄

1. [設計目標](#設計目標)
2. [現狀分析](#現狀分析)
3. [新手引導設計](#新手引導設計)
4. [任務中心設計](#任務中心設計)
5. [技術實現方案](#技術實現方案)
6. [資料庫設計](#資料庫設計)
7. [實施計劃](#實施計劃)

---

## 🎯 設計目標

### 核心目標
1. **循序漸進引導**：讓新用戶快速理解產品核心玩法（丟瓶、撿瓶）
2. **完善個人資料**：激勵用戶完成關鍵資料（興趣、地區、自我介紹）
3. **提升留存率**：通過任務獎勵（額外瓶子）增加用戶粘性
4. **社交媒體引流**：引導用戶關注官方頻道和社交媒體

### 設計原則
- ✅ **Bot 可實現**：所有功能都能在 Telegram Bot 中實現（不依賴 Mini App）
- ✅ **非強制**：不阻礙用戶使用核心功能
- ✅ **有獎勵**：完成任務有實質獎勵（額外瓶子）
- ✅ **一次性**：任務完成後不再顯示
- ✅ **智能提醒**：在適當時機提醒用戶完成任務

---

## 📊 現狀分析

### ✅ 已有的新手引導

#### 1. 註冊流程（Onboarding）
**位置**: `src/telegram/handlers/start.ts`, `src/telegram/handlers/onboarding_input.ts`

**流程步驟**:
1. ✅ 語言選擇 (`language_selection`)
2. ✅ 暱稱設置 (`nickname`)
3. ✅ 頭像上傳 (`avatar`) - **Bot 版本跳過，預留給 Mini App/App**
4. ✅ 性別選擇 (`gender`) - 不可修改
5. ✅ 生日輸入 (`birthday`) - 不可修改，18歲限制
6. ✅ 血型選擇 (`blood_type`) - 不可修改
7. ✅ MBTI 測驗 (`mbti`) - 可選或稍後
8. ✅ 反詐騙測驗 (`anti_fraud`)
9. ✅ 服務條款同意 (`terms`) - **包含社區規則**
10. ✅ 完成註冊 (`completed`)

**完成條件**: `user.onboarding_step === 'completed'`

**說明**：
- 註冊過程中已包含社區規則（服務條款中）
- 頭像上傳功能預留給未來的 Mini App/App 版本

#### 2. 個人資料編輯
**位置**: `src/telegram/handlers/edit_profile.ts`

**可編輯項目**:
- ✅ 暱稱 (`nickname`)
- ✅ 個人簡介 (`bio`) - 最多 200 字
- ✅ 地區 (`city`)
- ✅ 興趣標籤 (`interests`) - JSON array
- ✅ 匹配偏好 (`prefer_gender`)
- ✅ 血型 (`blood_type`)
- ✅ MBTI 重新測試

**不可修改項目**:
- ❌ 性別 (`gender`)
- ❌ 生日 (`birthday`)

### ❌ 缺少的功能

1. **新手教學**：註冊完成後沒有引導用戶如何丟瓶、撿瓶
2. **任務系統**：沒有激勵用戶完成個人資料（興趣、地區、簡介）
3. **社交媒體引導**：沒有引導用戶關注官方頻道
4. **進度追蹤**：沒有顯示用戶完成了哪些任務
5. **獎勵機制**：沒有完成任務的獎勵（額外瓶子）

---

## 🎓 新手引導設計

### 設計思路

參考 Bottled App 的設計，簡化為 **2 步快速引導**：
1. **歡迎介紹**：一頁說明核心玩法
2. **開始使用**：直接引導丟瓶或撿瓶

**說明**：社區規則已在註冊時說明，新手引導不需要重複

### 完整流程

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 註冊完成（onboarding_step = 'completed'）                 │
│    註冊過程已包含社區規則說明                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. 自動觸發新手教學                                          │
│                                                              │
│    🎉 恭喜完成註冊！                                         │
│                                                              │
│    🌊 **XunNi 是什麼？**                                     │
│    匿名漂流瓶交友平台，透過 MBTI 和星座幫你找到志同道合的朋友│
│                                                              │
│    📦 **丟出漂流瓶**                                         │
│    寫下你的心情或想法，系統會幫你找到合適的人               │
│                                                              │
│    🎣 **撿起漂流瓶**                                         │
│    看看別人的漂流瓶，有興趣就回覆開始聊天                   │
│                                                              │
│    💬 **如何成為朋友？**                                     │
│    你撿瓶回覆 → 對方也回覆 → 開始匿名聊天                   │
│                                                              │
│    [開始使用 →]  [跳過]                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. 開始使用                                                  │
│                                                              │
│    🎉 **準備好了！開始交朋友吧～**                           │
│                                                              │
│    [🌊 丟出漂流瓶]  [🎣 撿起漂流瓶]                         │
│                                                              │
│    💡 完成任務可獲得額外瓶子 → [📋 查看任務]                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. 教學完成（tutorial_completed = true）                     │
└─────────────────────────────────────────────────────────────┘
```

### 實現要點

#### 1. 自動觸發時機
- ✅ 註冊完成後立即觸發（`onboarding_step = 'completed'` 且 `tutorial_completed = false`）
- ✅ 用戶可以選擇跳過（設置 `tutorial_completed = true`）
- ✅ 跳過後不再自動觸發，但可以在 `/help` 中查看

#### 2. 簡化流程
- ✅ **只有 2 步**，極簡設計
- ✅ 社區規則已在註冊時說明，不重複
- ✅ 每步內容簡潔，一眼就懂
- ✅ 直接引導用戶開始使用

#### 3. 按鈕設計
- ✅ 使用 Inline Keyboard 提供清晰的導航
- ✅ 第一步提供「跳過」選項
- ✅ 最後一步直接提供「丟瓶」和「撿瓶」按鈕

---

## 📋 任務中心設計

### 任務類型

#### 1. 個人資料任務（Profile Tasks）

| 任務 ID | 任務名稱 | 描述 | 獎勵 | 完成條件 |
|---------|---------|------|------|----------|
| `task_interests` | 填寫興趣標籤 | 讓別人更了解你 | +1 瓶子 | `interests` 不為空 |
| `task_bio` | 完善自我介紹 | 寫下你的故事（至少 20 字） | +1 瓶子 | `bio` 不為空且 ≥ 20 字 |
| `task_city` | 設定地區 | 找到同城的朋友 | +1 瓶子 | `city` 不為空 |

**總獎勵**: 最多 3 個額外瓶子（**一次性追加**，當天有效）

#### 2. 社交媒體任務（Social Tasks）

| 任務 ID | 任務名稱 | 描述 | 獎勵 | 完成條件 | 驗證方式 |
|---------|---------|------|------|----------|----------|
| `task_join_channel` | 加入官方頻道 | 獲取最新消息和活動 | +1 瓶子 | 用戶加入 Telegram 頻道並確認領取 | ✅ 自動檢測 + 用戶確認 |

**總獎勵**: 1 個額外瓶子（**一次性追加**，當天有效）

**說明**：
- ✅ **只保留「加入頻道」任務**，因為只有這個能透過 Bot API 驗證
- ✅ **需要用戶確認領取**：系統檢測到用戶加入後，發送確認按鈕，用戶點擊後才發放獎勵
- ❌ 其他社交媒體（Twitter、Instagram、群組）無法可靠驗證，暫不加入

#### 3. 行為任務（Action Tasks）

| 任務 ID | 任務名稱 | 描述 | 獎勵 | 完成條件 | 提示 |
|---------|---------|------|------|----------|------|
| `task_first_bottle` | 丟出第一個瓶子 | 開始你的交友之旅 | +1 瓶子 | 丟出至少 1 個瓶子 | - |
| `task_first_catch` | 撿起第一個瓶子 | 看看別人的故事 | +1 瓶子 | 撿起至少 1 個瓶子 | - |
| `task_first_conversation` | 開始第一次對話 | 建立你的第一個連接 | +1 瓶子 | 至少 1 個對話 | **長按訊息 → 選擇「回覆」** |

**總獎勵**: 最多 3 個額外瓶子（**一次性追加**，當天有效）

**特別說明**：
- 「開始第一次對話」任務會提示用戶：**長按訊息，在彈出的選單上選擇「回覆」**

#### 4. 邀請任務（Invite Tasks）

| 任務 ID | 任務名稱 | 描述 | 獎勵 | 完成條件 | 任務類型 |
|---------|---------|------|------|----------|----------|
| `task_invite_progress` | 邀請好友 | 每邀請 1 人，每日額度永久 +1 | +1 瓶子/人 | 邀請好友並激活 | **持續性任務** |

**任務特性**：
- ✅ **持續性任務**：不是一次性完成，而是持續進行
- ✅ **每次邀請都有獎勵**：每成功邀請 1 人 → 每日配額永久 +1
- ✅ **按用戶級別有上限**：
  - 免費用戶：最多邀請 10 人（配額 3 → 13）
  - VIP 用戶：最多邀請 100 人（配額 30 → 130）
- ✅ **達到上限才完成**：邀請滿 10 人（免費）或 100 人（VIP）後任務完成
- ✅ **獎勵永久有效**：每天都會重新發放

**邀請成功通知範例**：
```
🎉 邀請成功！

你的好友 {nickname} 已完成註冊並激活！

🎁 獎勵：每日瓶子配額 +1
📊 總邀請數：{count}
🎯 {userType} 用戶上限：{maxInvites}
📦 當前每日配額：{quota}

💡 繼續邀請好友，獲得更多永久配額！
還可以邀請 {remaining} 人
```

**總獎勵**: 最多 10 個（免費）或 100 個（VIP）額外瓶子（**永久有效**，每天發放）

### 任務中心界面

```
┌─────────────────────────────────────────────────────────────┐
│ 📋 **任務中心**                                              │
│                                                              │
│ 完成任務獲得額外瓶子！                                      │
│                                                              │
│ ━━━━━━━━━━━━━━━━                                             │
│ 👤 **個人資料任務**（2/3 已完成）                            │
│ ━━━━━━━━━━━━━━━━                                             │
│                                                              │
│ ✅ 填寫興趣標籤 (+1 瓶子)                                    │
│ ✅ 完善自我介紹 (+1 瓶子)                                    │
│ ⏳ 設定地區 (+1 瓶子) [立即完成]                             │
│                                                              │
│ ━━━━━━━━━━━━━━━━                                             │
│ 📱 **社交媒體任務**（0/1 已完成）                            │
│ ━━━━━━━━━━━━━━━━                                             │
│                                                              │
│ ⏳ 加入官方頻道 (+1 瓶子) [立即加入]                         │
│                                                              │
│ ━━━━━━━━━━━━━━━━                                             │
│ 🎯 **行為任務**（2/3 已完成）                                │
│ ━━━━━━━━━━━━━━━━                                             │
│                                                              │
│ ✅ 丟出第一個瓶子 (+1 瓶子)                                  │
│ ✅ 撿起第一個瓶子 (+1 瓶子)                                  │
│ ⏳ 開始第一次對話 (+1 瓶子)                                  │
│    💡 長按訊息 → 選擇「回覆」                                │
│                                                              │
│ ━━━━━━━━━━━━━━━━                                             │
│ 👥 **邀請任務**（持續進行中）                                │
│ ━━━━━━━━━━━━━━━━                                             │
│                                                              │
│ 🔄 邀請好友 (2/10 已完成)                                    │
│    每邀請 1 人 → 每日額度永久 +1                            │
│    當前每日配額：5 個 (3 基礎 + 2 邀請)                     │
│    [📋 查看邀請碼]                                           │
│                                                              │
│ ━━━━━━━━━━━━━━━━                                             │
│ 📊 總進度：                                                  │
│ • 一次性任務：4/7 已完成                                     │
│ • 邀請任務：2/10 進行中                                      │
│                                                              │
│ 🎁 已獲得：                                                  │
│ • 一次性獎勵：4 個瓶子（當天有效）                           │
│ • 永久獎勵：2 個瓶子（每天發放）                             │
│                                                              │
│ [↩️ 返回]                                                    │
└─────────────────────────────────────────────────────────────┘
```

### 智能提醒機制

#### 1. 觸發時機

| 觸發場景 | 提醒內容 |
|---------|---------|
| 丟瓶子時額度不足 | 「💡 額度不足？完成任務可獲得額外瓶子！\n\n未完成任務：\n• 設定地區 (+1)\n• 加入官方頻道 (+1)\n• 開始第一次對話 (+1)\n\n[📋 查看任務]」 |
| 首次丟瓶成功 | 「🎉 完成任務：丟出第一個瓶子 (+1 瓶子)！\n\n💡 試試撿起別人的瓶子吧～ [🎣 撿起漂流瓶]」 |
| 首次撿瓶成功 | 「🎉 完成任務：撿起第一個瓶子 (+1 瓶子)！\n\n💡 長按訊息選擇「回覆」開始聊天可獲得 +1 瓶子獎勵！」 |
| 查看個人資料 | 「💡 完善個人資料可獲得額外瓶子：\n• 填寫興趣 (+1)\n• 寫自我介紹 (+1)\n• 設定地區 (+1)\n\n[📋 查看任務]」 |

#### 2. 提醒頻率
- ✅ **簡化提醒**：只在關鍵時刻提醒（額度不足、完成任務時）
- ✅ 每個任務每天最多提醒 1 次
- ✅ 用戶可以關閉任務提醒（在 `/settings` 中）

#### 3. 提醒樣式
- ✅ **簡潔明瞭**：直接顯示未完成任務和獎勵
- ✅ 使用 Inline Keyboard 提供快速操作
- ✅ 不要太多按鈕，避免選擇困難

### 獎勵發放機制

#### 1. 發放時機
- ✅ 任務完成後立即發放
- ✅ 發送確認訊息：「🎉 恭喜完成任務「{任務名稱}」！\n\n獎勵：+{數量} 瓶子（{類型}）\n\n[📋 查看任務中心]」

#### 2. 獎勵類型

**所有任務獎勵都是「一次性追加」**：

| 獎勵類型 | 說明 | 有效期 | 計算方式 |
|---------|------|--------|---------|
| 一次性追加 | 完成任務後立即追加到當天額度 | 當天 23:59:59 | 直接加到當天可用額度 |

**範例**：
- 用戶今天有 3 個瓶子額度
- 完成「填寫興趣標籤」任務 → 當天額度變成 4 個
- 完成「加入官方頻道」任務 → 當天額度變成 5 個
- 第二天重置為 3 個（基礎額度）

**總獎勵統計**：
- 個人資料任務：3 個瓶子（一次性）
- 社交媒體任務：1 個瓶子（一次性）
- 行為任務：3 個瓶子（一次性）
- 邀請任務：最多 10 個（免費）或 100 個（VIP）瓶子（永久，每天發放）
- **一次性任務總計**：7 個瓶子
- **持續性任務總計**：最多 10 個（免費）或 100 個（VIP）瓶子

**額度說明**：
- ✅ **每日基礎額度**：每天按基礎額度重置（免費 3 個，VIP 30 個）
- ✅ **任務獎勵**：一次性追加到當天額度，第二天不保留
- ✅ **邀請獎勵**：永久增加每日基礎額度（每個好友 +1，免費最多 10 人，VIP 最多 100 人）

#### 3. 額度計算

```typescript
// 用戶每日基礎額度 = 基礎額度 + 邀請獎勵
const baseQuota = user.is_vip ? 30 : 3;
const maxInvites = user.is_vip ? 100 : 10;
const actualInvites = Math.min(user.successful_invites || 0, maxInvites);
const dailyBaseLimit = baseQuota + actualInvites;  // 邀請獎勵（每個好友 +1，永久）

// 今天已用瓶子數
const usedToday = await getDailyUsage(userId, today);

// 今天完成的任務獎勵（一次性追加）
const todayTaskBonus = await getTodayCompletedTasksReward(userId, today);

// 今天剩餘瓶子數 = 基礎額度 - 已用 + 今天完成的任務獎勵
const remaining = dailyBaseLimit - usedToday + todayTaskBonus;
```

**額度計算範例**：
```
用戶狀態：免費用戶，邀請了 2 個好友
基礎額度：3 + 2 = 5 個/天（邀請獎勵永久有效）

第一天：
- 開始：5 個可用
- 丟了 3 個瓶子：剩 2 個
- 完成「填寫興趣」任務：+1，剩 3 個
- 完成「加入頻道」任務：+1，剩 4 個
- 再丟 4 個瓶子：剩 0 個

第二天：
- 重置為 5 個可用（邀請獎勵保留，任務獎勵不保留）

第三天（邀請了第 3 個好友）：
- 重置為 6 個可用（3 + 3 = 6）
```

---

## 🛠️ 技術實現方案

### 1. Bot 實現可行性分析

#### ✅ 可以實現的功能

| 功能 | 實現方式 | 難度 |
|------|---------|------|
| 新手教學流程 | Inline Keyboard + 狀態機 | ⭐ 簡單 |
| 任務進度追蹤 | 資料庫查詢 + 計算 | ⭐ 簡單 |
| 任務完成檢測 | 監聽用戶行為 + 更新狀態 | ⭐⭐ 中等 |
| 智能提醒 | 在特定場景插入提醒訊息 | ⭐⭐ 中等 |
| 獎勵發放 | 更新資料庫 + 發送確認訊息 | ⭐ 簡單 |
| 加入頻道檢測 | Telegram Bot API `getChatMember` | ⭐⭐ 中等 |
| 社交媒體連結 | URL 按鈕 + 點擊追蹤 | ⭐ 簡單 |

#### ❌ 無法實現的功能

| 功能 | 原因 | 替代方案 |
|------|------|---------|
| 驗證 Twitter 關注 | Twitter API 需要認證 | 點擊連結即視為完成 |
| 驗證 Instagram 關注 | Instagram API 限制 | 點擊連結即視為完成 |
| 複雜的動畫效果 | Bot 只支援靜態內容 | 使用 Emoji 和文字排版 |

### 2. 狀態機設計

#### 新手教學狀態機

```typescript
type TutorialStep = 
  | 'not_started'     // 未開始
  | 'welcome'         // 歡迎頁面
  | 'rules'           // 社區規則
  | 'matching'        // 配對機制
  | 'writing_tips'    // 寫作建議
  | 'first_bottle'    // 首次丟瓶引導
  | 'completed';      // 已完成

// 狀態轉換
const tutorialTransitions = {
  'not_started': 'welcome',
  'welcome': 'rules',
  'rules': 'matching',
  'matching': 'writing_tips',
  'writing_tips': 'first_bottle',
  'first_bottle': 'completed',
};
```

#### 任務狀態機

```typescript
type TaskStatus = 
  | 'locked'          // 未解鎖（前置條件未滿足）
  | 'available'       // 可完成
  | 'in_progress'     // 進行中（僅用於行為任務）
  | 'completed';      // 已完成

// 任務完成條件檢查
async function checkTaskCompletion(userId: string, taskId: string): Promise<boolean> {
  const user = await getUser(userId);
  
  switch (taskId) {
    case 'task_interests':
      return user.interests && user.interests.length > 0;
    
    case 'task_bio':
      return user.bio && user.bio.length >= 20;
    
    case 'task_city':
      return user.city && user.city.length > 0;
    
    case 'task_mbti':
      return user.mbti_result && user.mbti_result.length > 0;
    
    case 'task_join_channel':
      return await isUserInChannel(userId, env.OFFICIAL_CHANNEL_ID);
    
    case 'task_first_bottle':
      return await getBottleCount(userId) > 0;
    
    case 'task_first_catch':
      return await getCatchCount(userId) > 0;
    
    case 'task_first_conversation':
      return await getConversationCount(userId) > 0;
    
    default:
      return false;
  }
}
```

### 3. 智能提醒實現

```typescript
// 在特定場景插入任務提醒
async function showTaskReminderIfNeeded(
  userId: string,
  scenario: 'quota_low' | 'first_bottle' | 'first_catch' | 'view_profile' | 'daily_login',
  telegram: TelegramService
): Promise<void> {
  
  // 檢查用戶是否關閉任務提醒
  const settings = await getUserSettings(userId);
  if (!settings.task_reminders_enabled) {
    return;
  }
  
  // 檢查今天是否已提醒過
  const lastReminder = await getLastTaskReminder(userId);
  if (lastReminder && isSameDay(lastReminder, new Date())) {
    return;
  }
  
  // 獲取未完成的任務
  const incompleteTasks = await getIncompleteTasks(userId);
  if (incompleteTasks.length === 0) {
    return;
  }
  
  // 根據場景選擇要提醒的任務
  let tasksToRemind: Task[] = [];
  
  switch (scenario) {
    case 'quota_low':
      // 額度不足時，提醒所有未完成任務
      tasksToRemind = incompleteTasks;
      break;
    
    case 'first_bottle':
      // 首次丟瓶後，提醒撿瓶任務
      tasksToRemind = incompleteTasks.filter(t => t.id === 'task_first_catch');
      break;
    
    case 'first_catch':
      // 首次撿瓶後，提醒對話任務
      tasksToRemind = incompleteTasks.filter(t => t.id === 'task_first_conversation');
      break;
    
    case 'view_profile':
      // 查看個人資料時,提醒個人資料任務
      tasksToRemind = incompleteTasks.filter(t => 
        t.id.startsWith('task_') && 
        ['task_interests', 'task_bio', 'task_city'].includes(t.id)
      );
      break;
    
    case 'daily_login':
      // 每日首次登入，提醒所有未完成任務
      tasksToRemind = incompleteTasks;
      break;
  }
  
  if (tasksToRemind.length === 0) {
    return;
  }
  
  // 構建提醒訊息
  const totalReward = tasksToRemind.reduce((sum, task) => sum + task.reward, 0);
  let message = `💡 完成任務可以獲得額外瓶子！\n\n`;
  message += `你還有 ${tasksToRemind.length} 個任務未完成：\n`;
  
  for (const task of tasksToRemind) {
    message += `• ${task.name} (+${task.reward})\n`;
  }
  
  message += `\n總獎勵：${totalReward} 個瓶子`;
  
  // 發送提醒
  await telegram.sendMessageWithButtons(
    userId,
    message,
    [
      [{ text: '📋 查看任務中心', callback_data: 'view_tasks' }],
      [{ text: '🔕 不再提醒', callback_data: 'disable_task_reminders' }],
    ]
  );
  
  // 記錄提醒時間
  await recordTaskReminder(userId, new Date());
}
```

### 4. 加入頻道檢測

```typescript
// 檢查用戶是否在頻道中
async function isUserInChannel(userId: string, channelId: string): Promise<boolean> {
  try {
    const telegram = createTelegramService(env);
    const member = await telegram.getChatMember(channelId, userId);
    
    // 檢查用戶狀態
    return ['creator', 'administrator', 'member'].includes(member.status);
  } catch (error) {
    console.error('[isUserInChannel] Error:', error);
    return false;
  }
}

// 定期檢查用戶是否加入頻道（Cron Job - 每小時執行）
export async function checkChannelMembership(env: Env): Promise<void> {
  // 獲取所有未完成「加入頻道」任務的用戶
  const users = await getUsersWithIncompleteTask('task_join_channel');
  
  for (const user of users) {
    const isInChannel = await isUserInChannel(user.telegram_id, env.OFFICIAL_CHANNEL_ID);
    
    if (isInChannel) {
      // 標記任務為「待領取」狀態
      await markTaskAsPendingClaim(user.telegram_id, 'task_join_channel');
      
      // 發送確認領取通知
      await telegram.sendMessageWithButtons(
        user.telegram_id,
        '🎉 檢測到你已加入官方頻道！\n\n' +
        '點擊下方按鈕領取獎勵：+1 瓶子\n\n' +
        '💡 這是一次性獎勵，領取後會追加到今天的額度中。',
        [
          [{ text: '✅ 領取獎勵', callback_data: 'claim_task_join_channel' }]
        ]
      );
    }
  }
}

// 處理領取獎勵的回調
export async function handleClaimTaskReward(
  callbackQuery: CallbackQuery,
  taskId: string,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const userId = callbackQuery.from.id.toString();
  
  // 再次驗證用戶是否在頻道中
  const isInChannel = await isUserInChannel(userId, env.OFFICIAL_CHANNEL_ID);
  
  if (!isInChannel) {
    await telegram.answerCallbackQuery(
      callbackQuery.id,
      '❌ 檢測到你已離開頻道，無法領取獎勵。'
    );
    return;
  }
  
  // 完成任務並發放獎勵
  await completeTask(userId, taskId);
  
  await telegram.answerCallbackQuery(
    callbackQuery.id,
    '✅ 獎勵已發放！+1 瓶子'
  );
  
  await telegram.sendMessage(
    userId,
    '🎉 恭喜完成任務：加入官方頻道！\n\n' +
    '獎勵：+1 瓶子（已追加到今天的額度）\n\n' +
    '[📋 查看任務中心]'
  );
}
```

**Cron 配置**（`wrangler.toml`）：
```toml
[[env.production.triggers.crons]]
cron = "0 * * * *"  # 每小時檢查一次
```

---

## 💾 資料庫設計

### 1. 新增表：`user_tasks`（用戶任務進度）

```sql
CREATE TABLE user_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,                    -- FK -> users.telegram_id
  task_id TEXT NOT NULL,                    -- 任務 ID（如 'task_interests'）
  status TEXT DEFAULT 'available',          -- 'available' / 'pending_claim' / 'completed'
  completed_at DATETIME,                    -- 完成時間
  reward_claimed INTEGER DEFAULT 0,         -- 是否已領取獎勵（0/1）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, task_id),
  FOREIGN KEY (user_id) REFERENCES users(telegram_id)
);

CREATE INDEX idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX idx_user_tasks_status ON user_tasks(status);
CREATE INDEX idx_user_tasks_user_status ON user_tasks(user_id, status);
```

**狀態說明**：
- `available`: 任務可完成
- `pending_claim`: 任務已完成，等待用戶確認領取（僅用於「加入頻道」任務）
- `completed`: 任務已完成並領取獎勵

### 2. 新增表：`tasks`（任務定義）

```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,                      -- 任務 ID（如 'task_interests'）
  category TEXT NOT NULL,                   -- 'profile' / 'social' / 'action'
  name TEXT NOT NULL,                       -- 任務名稱
  description TEXT NOT NULL,                -- 任務描述
  reward_amount INTEGER NOT NULL,           -- 獎勵數量
  reward_type TEXT NOT NULL,                -- 'daily' / 'permanent'
  sort_order INTEGER DEFAULT 0,             -- 排序順序
  is_enabled INTEGER DEFAULT 1,             -- 是否啟用（0/1）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_tasks_enabled ON tasks(is_enabled);
```

**初始數據**：

```sql
-- 個人資料任務
INSERT INTO tasks (id, category, name, description, reward_amount, reward_type, sort_order) VALUES
('task_interests', 'profile', '填寫興趣標籤', '讓別人更了解你', 1, 'daily', 1),
('task_bio', 'profile', '完善自我介紹', '寫下你的故事（至少 20 字）', 1, 'daily', 2),
('task_city', 'profile', '設定地區', '找到同城的朋友', 1, 'daily', 3);

-- 社交媒體任務
INSERT INTO tasks (id, category, name, description, reward_amount, reward_type, sort_order) VALUES
('task_join_channel', 'social', '加入官方頻道', '獲取最新消息和活動', 1, 'daily', 4);

-- 行為任務
INSERT INTO tasks (id, category, name, description, reward_amount, reward_type, sort_order) VALUES
('task_first_bottle', 'action', '丟出第一個瓶子', '開始你的交友之旅', 1, 'daily', 5),
('task_first_catch', 'action', '撿起第一個瓶子', '看看別人的故事', 1, 'daily', 6),
('task_first_conversation', 'action', '開始第一次對話', '建立你的第一個連接（長按訊息 → 選擇「回覆」）', 1, 'daily', 7);

-- 邀請任務（持續性任務）
INSERT INTO tasks (id, category, name, description, reward_amount, reward_type, sort_order) VALUES
('task_invite_progress', 'invite', '邀請好友', '每邀請 1 人，每日額度永久 +1（免費最多 10 人，VIP 最多 100 人）', 1, 'permanent', 8);
```

### 3. 新增表：`task_reminders`（任務提醒記錄）

```sql
CREATE TABLE task_reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,                    -- FK -> users.telegram_id
  reminded_at DATETIME NOT NULL,            -- 提醒時間
  scenario TEXT NOT NULL,                   -- 提醒場景（如 'quota_low'）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(telegram_id)
);

CREATE INDEX idx_task_reminders_user_id ON task_reminders(user_id);
CREATE INDEX idx_task_reminders_reminded_at ON task_reminders(reminded_at);
```

**說明**：簡化為只記錄用戶和時間，不記錄具體任務（因為每次提醒可能涉及多個任務）

### 5. 擴充 `users` 表

```sql
-- 新增欄位到 users 表
ALTER TABLE users ADD COLUMN tutorial_step TEXT DEFAULT 'not_started';
ALTER TABLE users ADD COLUMN tutorial_completed INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN tutorial_completed_at DATETIME;
ALTER TABLE users ADD COLUMN task_reminders_enabled INTEGER DEFAULT 1;  -- 是否啟用任務提醒
```

**說明**：移除 `daily_bottle_bonus` 欄位，因為所有任務獎勵都是一次性追加

### 6. 擴充 `user_settings` 表（如果存在）

```sql
-- 如果有 user_settings 表，新增任務提醒設定
ALTER TABLE user_settings ADD COLUMN task_reminders_enabled INTEGER DEFAULT 1;
```

---

## 📅 實施計劃

### Phase 1：資料庫設計與基礎架構（1 天）

#### 任務清單
1. ✅ 創建 Migration 文件
   - `0030_create_tasks_table.sql`
   - `0031_create_user_tasks_table.sql`
   - `0032_create_task_reminders_table.sql`
   - `0033_alter_users_add_tutorial_fields.sql`

2. ✅ 插入初始任務數據
   - 個人資料任務（3 個）
   - 社交媒體任務（1 個）
   - 行為任務（3 個）

3. ✅ 創建 Domain 層函數
   - `src/domain/tutorial.ts` - 新手教學邏輯
   - `src/domain/task.ts` - 任務邏輯
   - `src/domain/task_reward.ts` - 獎勵計算邏輯

4. ✅ 創建 Database Queries
   - `src/db/queries/tasks.ts` - 任務查詢
   - `src/db/queries/user_tasks.ts` - 用戶任務進度查詢
   - `src/db/queries/task_reminders.ts` - 任務提醒查詢

### Phase 2：新手教學實現（1-2 天）

#### 任務清單
1. ✅ 創建新手教學 Handler
   - `src/telegram/handlers/tutorial.ts`
   - 實現 3 個教學步驟的內容和按鈕
   - 實現狀態轉換邏輯

2. ✅ 註冊完成後自動觸發
   - 修改 `src/telegram/handlers/start.ts`
   - 在 `onboarding_step = 'completed'` 後觸發教學

3. ✅ 實現中斷恢復
   - 用戶可以跳過教學
   - 用戶可以在 `/help` 中重新查看教學

4. ✅ 測試新手教學流程
   - 完整流程測試
   - 跳過測試
   - 中斷恢復測試

### Phase 3：任務系統實現（3-4 天）

#### 任務清單
1. ✅ 創建任務中心 Handler
   - `src/telegram/handlers/tasks.ts`
   - 實現 `/tasks` 命令
   - 實現任務列表顯示
   - 實現任務詳情顯示

2. ✅ 實現任務完成檢測
   - 監聽用戶行為（丟瓶、撿瓶、對話）
   - 監聽個人資料更新
   - 檢查頻道/群組成員資格
   - 追蹤社交媒體連結點擊

3. ✅ 實現獎勵發放
   - 任務完成後自動發放獎勵
   - 發送確認訊息
   - 更新用戶額度

4. ✅ 測試任務系統
   - 每個任務的完成檢測
   - 獎勵發放
   - 額度計算

### Phase 4：智能提醒實現（2-3 天）

#### 任務清單
1. ✅ 實現提醒邏輯
   - 在特定場景插入提醒
   - 檢查提醒頻率限制
   - 檢查用戶設定

2. ✅ 集成到現有 Handlers
   - 修改 `src/telegram/handlers/throw.ts`（額度不足時提醒）
   - 修改 `src/telegram/handlers/catch.ts`（首次撿瓶後提醒）
   - 修改 `src/telegram/handlers/profile.ts`（查看個人資料時提醒）
   - 修改 `src/router.ts`（每日首次登入提醒）

3. ✅ 實現提醒設定
   - 在 `/settings` 中新增「任務提醒」開關
   - 實現「不再提醒」按鈕

4. ✅ 測試智能提醒
   - 各場景提醒測試
   - 頻率限制測試
   - 設定開關測試

### Phase 5：社交媒體任務實現（1 天）

#### 任務清單
1. ✅ 實現頻道檢測
   - 使用 `getChatMember` API
   - 創建 Cron Job 定期檢查（每小時）
   - 任務完成後發送通知

2. ✅ 配置環境變數
   - `OFFICIAL_CHANNEL_ID`

3. ✅ 測試頻道任務
   - 頻道加入檢測
   - 獎勵發放（永久 +3 瓶子）
   - 通知訊息

### Phase 6：整合測試與優化（1-2 天）

#### 任務清單
1. ✅ 完整流程測試
   - 新用戶完整體驗（註冊 → 教學 → 任務）
   - 邊緣情況測試

2. ✅ 文案優化
   - 檢查所有文案簡潔明瞭
   - 確保 i18n 覆蓋

3. ✅ 文檔更新
   - 更新 `doc/SPEC.md`
   - 創建用戶指南

### Phase 7：部署與監控（1 天）

#### 任務清單
1. ✅ 部署到 Staging
   - 執行 Migrations
   - 配置環境變數（`OFFICIAL_CHANNEL_ID`）
   - 測試所有功能

2. ✅ 部署到 Production
   - 執行 Migrations
   - 配置環境變數
   - 配置 Cron Job（每小時檢查頻道成員）

3. ✅ 監控與調整
   - 監控任務完成率
   - 監控獎勵發放
   - 根據數據調整

---

## 📊 預期效果

### 關鍵指標

| 指標 | 當前 | 目標 | 提升 |
|------|------|------|------|
| 新用戶 7 日留存率 | 30% | 45% | +50% |
| 個人資料完成率 | 40% | 70% | +75% |
| 平均每日活躍度 | 1.5 次 | 2.5 次 | +67% |
| 官方頻道訂閱率 | 10% | 50% | +400% |
| 首日對話成功率 | 20% | 35% | +75% |

### 用戶體驗提升

1. **新用戶**：
   - ✅ 清晰的產品介紹和玩法引導
   - ✅ 循序漸進的學習曲線
   - ✅ 明確的任務目標和獎勵

2. **活躍用戶**：
   - ✅ 更多的互動機會（任務系統）
   - ✅ 更高的參與度（完成任務獲得獎勵）
   - ✅ 更強的社區歸屬感（加入官方頻道/群組）

3. **產品運營**：
   - ✅ 更高的用戶留存率
   - ✅ 更多的社交媒體關注者
   - ✅ 更完善的用戶資料（提升配對質量）

---

## 🎯 總結

### 核心價值

1. **新手引導**：
   - ✅ 參考 Bottled App 的優秀設計
   - ✅ **簡化為 2 步教學**，極簡設計
   - ✅ 社區規則已在註冊時說明，不重複
   - ✅ 清晰簡潔，一眼就懂

2. **任務系統**：
   - ✅ **8 個任務**，分為 4 大類
   - ✅ **一次性任務**：7 個瓶子（全部一次性追加）
   - ✅ **持續性任務**：邀請好友，最多 10 個（免費）或 100 個（VIP）瓶子（永久，每天發放）
   - ✅ 每個任務獎勵 1 個瓶子，不慷慨但有激勵
   - ✅ 智能提醒，只在關鍵時刻提醒

3. **社交媒體任務**：
   - ✅ **只保留「加入頻道」任務**
   - ✅ 自動檢測 + 用戶確認領取（確保真的加入）
   - ✅ +1 瓶子獎勵（一次性追加）

4. **額度機制**：
   - ✅ **每日基礎額度**：每天按基礎額度重置（免費 3 個，VIP 30 個）
   - ✅ **邀請獎勵**：永久增加每日基礎額度（每個好友 +1，免費最多 10 人，VIP 最多 100 人）
   - ✅ **任務獎勵**：一次性追加到當天額度，第二天不保留

5. **特別提示**：
   - ✅ 「開始第一次對話」任務會提示：**長按訊息 → 選擇「回覆」**
   - ✅ 頭像上傳功能預留給未來的 Mini App/App 版本

6. **技術實現**：
   - ✅ 完全可以在 Bot 中實現
   - ✅ 不依賴 Mini App
   - ✅ 使用 Cron Job 自動檢查頻道成員
   - ✅ 資料庫設計簡潔

7. **實施計劃**：
   - ✅ 7 個階段，預計 **8-12 天**
   - ✅ 循序漸進，逐步上線
   - ✅ 持續監控和優化

### 下一步

**請審核此設計方案，確認無誤後，我們即可開始實施！**

---

**設計者**: AI Assistant  
**審核者**: _待填寫_  
**批准日期**: _待填寫_  
**開始實施日期**: _待填寫_

