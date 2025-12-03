# XunNi Onboarding 流程重新设计

> **问题发现日期**: 2025-01-15  
> **问题来源**: 用户反馈  
> **状态**: 待实现

---

## 🐛 当前设计的问题

### 1. 语言选择缺失
- ❌ 没有在一开始让用户选择语言
- ❌ 直接使用 Telegram `language_code`，可能不准确
- ❌ 用户无法自主选择界面语言

### 2. /start 命令强制要求
- ❌ 要求用户必须输入 `/start` 才能开始
- ❌ 新用户可能不知道要输入什么
- ❌ 没有自动触发或明确引导

### 3. Bot vs Mini App 定位混乱
- ❌ **文档设计**: Bot 只处理通知/Deep Link，长流程走 Mini App
- ❌ **当前实现**: 在 Bot 端完成注册（违反设计原则）
- ❌ 注册流程在 Bot 中进行，体验不佳（多步骤对话）

---

## ✅ 重新设计方案

### 方案 A：Mini App 为主（推荐）

#### 设计原则

1. **Bot 只做引导和通知**
   - 欢迎消息
   - 语言选择
   - 引导用户打开 Mini App
   - 推送通知

2. **Mini App 完成所有长流程**
   - 用户注册
   - MBTI 测验
   - 个人资料编辑
   - 聊天界面

3. **自动触发，无需 /start**
   - 用户发送任何消息都触发欢迎流程
   - 不强制要求输入 `/start`

#### 完整流程

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 用户首次接触 Bot                                          │
│    - 发送任何消息（不限于 /start）                           │
│    - 或点击 Bot 链接                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Bot 自动响应（无需等待 /start）                           │
│                                                              │
│    🎉 歡迎來到 XunNi！                                       │
│                                                              │
│    XunNi 是一個匿名漂流瓶交友平台，透過 MBTI 和星座         │
│    幫你找到志同道合的朋友！                                  │
│                                                              │
│    首先，請選擇你的語言：                                    │
│                                                              │
│    [🇹🇼 繁體中文] [🇺🇸 English] [🇯🇵 日本語]              │
│    [🇰🇷 한국어] [🇹🇭 ภาษาไทย] [🇻🇳 Tiếng Việt]           │
│    [更多語言...]                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. 用户选择语言                                              │
│    - 点击语言按钮                                            │
│    - 保存到 users.language_pref                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Bot 引导打开 Mini App                                     │
│                                                              │
│    太好了！現在讓我們開始設定你的個人資料 ✨                 │
│                                                              │
│    為了提供更好的體驗，請點擊下方按鈕打開 XunNi App：        │
│                                                              │
│    [🚀 打開 XunNi App]  ← WebApp 按鈕                       │
│                                                              │
│    💡 提示：                                                 │
│    • 在 App 中完成註冊只需 3-5 分鐘                          │
│    • 支援中斷後繼續                                          │
│    • 更流暢的互動體驗                                        │
│                                                              │
│    如果無法打開 App，可以使用指令註冊：/start_bot            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. 用户在 Mini App 中完成注册                                │
│                                                              │
│    Mini App 流程：                                           │
│    ├─ 欢迎页面（显示产品介绍）                               │
│    ├─ 服务条款同意                                           │
│    ├─ 昵称设置                                               │
│    ├─ 性别选择（深度确认）                                   │
│    ├─ 生日输入（年龄验证）                                   │
│    ├─ 兴趣标签（可选）                                       │
│    ├─ MBTI 测验（分页，支持中断恢复）                        │
│    ├─ 反诈骗测验                                             │
│    ├─ 个人简介（可选）                                       │
│    └─ 完成注册                                               │
│                                                              │
│    特点：                                                    │
│    • 流畅的 UI/UX                                            │
│    • 进度条显示                                              │
│    • 支持返回修改（除了性别和生日）                          │
│    • 自动保存进度                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. 注册完成，Mini App 通知 Bot                               │
│    - Mini App 调用 Bot API                                   │
│    - 或用户关闭 Mini App 后自动检测                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Bot 发送欢迎消息                                          │
│                                                              │
│    🎉 註冊完成！歡迎加入 XunNi！                             │
│                                                              │
│    你的個人資料：                                            │
│    • 暱稱：{nickname}                                        │
│    • 性別：{gender}                                          │
│    • 年齡：{age} 歲                                          │
│    • 星座：{zodiac}                                          │
│    • MBTI：{mbti}                                            │
│                                                              │
│    現在你可以：                                              │
│    [🌊 丟漂流瓶] [🎣 撿漂流瓶] [👤 個人資料]                │
│                                                              │
│    使用 /help 查看所有指令                                   │
└─────────────────────────────────────────────────────────────┘
```

#### Bot Fallback 流程（当 Mini App 无法使用）

```
用户点击 [🚀 打開 XunNi App] 但失败
    ↓
Bot 检测到 Mini App 无法打开
    ↓
Bot 自动提示：
    「看起來 Mini App 暫時無法使用 😔
    
    沒關係！你可以使用 Bot 指令完成註冊：
    
    [💬 使用 Bot 指令註冊]
    
    或稍後再試：
    [🔄 重新打開 Mini App]」
    ↓
用户选择 Bot 指令注册
    ↓
进入当前的 Bot 注册流程
```

---

### 方案 B：Bot + Mini App 双轨（更灵活）

#### 设计原则

1. **给用户选择权**
   - 推荐使用 Mini App（体验更好）
   - 提供 Bot 指令作为备选（兼容性）

2. **两种方式都能完成注册**
   - Mini App：流畅的 UI/UX
   - Bot：简单的对话式

#### 完整流程

```
用户首次接触 Bot
    ↓
Bot 自动响应 + 语言选择
    ↓
Bot 显示两个选项：
    
    「請選擇註冊方式：
    
    [🚀 使用 Mini App]（推薦）
    • 更流暢的體驗
    • 視覺化界面
    • 進度條顯示
    
    [💬 使用 Bot 指令]
    • 簡單對話式
    • 無需打開 App
    • 適合網路較慢時」
    ↓
用户选择后进入对应流程
```

---

## 🎯 推荐方案：方案 A（Mini App 为主）

### 理由

1. **符合文档设计**
   - Bot 只做通知/Deep Link
   - 长流程走 Mini App

2. **更好的用户体验**
   - 流畅的 UI/UX
   - 视觉化进度显示
   - 更容易操作

3. **更易维护**
   - UI 逻辑在 Mini App 中
   - Bot 只处理简单逻辑
   - 代码更清晰

4. **符合 Telegram 最佳实践**
   - Telegram 推荐使用 Mini App 处理复杂流程
   - Bot 作为入口和通知渠道

### 实现要点

#### 1. 自动触发（无需 /start）

```typescript
// src/router.ts

async function routeUpdate(update: TelegramUpdate, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env);

  // Handle message
  if (update.message) {
    const chatId = update.message.chat.id;
    const telegramId = update.message.from!.id.toString();
    const text = update.message.text || '';

    // Check if user exists
    const user = await findUserByTelegramId(db, telegramId);

    // 新用户：自动触发欢迎流程（无需 /start）
    if (!user) {
      await handleFirstContact(update.message, env);
      return;
    }

    // 已有用户但未完成注册：提示继续
    if (!hasCompletedOnboarding(user)) {
      await handleIncompleteOnboarding(user, chatId, telegram);
      return;
    }

    // 已完成注册：正常处理命令
    // ... 现有逻辑
  }
}
```

#### 2. 语言选择

```typescript
async function handleFirstContact(message: TelegramMessage, env: Env): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  // 创建用户记录（未完成注册）
  await createUser(db, {
    telegram_id: telegramId,
    username: message.from!.username,
    first_name: message.from!.first_name,
    onboarding_step: 'language_selection',
  });

  // 显示欢迎消息 + 语言选择
  await telegram.sendMessageWithButtons(
    chatId,
    `🎉 歡迎來到 XunNi！\n\n` +
    `XunNi 是一個匿名漂流瓶交友平台，透過 MBTI 和星座幫你找到志同道合的朋友！\n\n` +
    `首先，請選擇你的語言：`,
    [
      [
        { text: '🇹🇼 繁體中文', callback_data: 'lang_zh-TW' },
        { text: '🇺🇸 English', callback_data: 'lang_en' },
      ],
      [
        { text: '🇯🇵 日本語', callback_data: 'lang_ja' },
        { text: '🇰🇷 한국어', callback_data: 'lang_ko' },
      ],
      [
        { text: '🇹🇭 ภาษาไทย', callback_data: 'lang_th' },
        { text: '🇻🇳 Tiếng Việt', callback_data: 'lang_vi' },
      ],
      [
        { text: '🌍 更多語言...', callback_data: 'lang_more' },
      ],
    ]
  );
}
```

#### 3. 引导打开 Mini App

```typescript
async function handleLanguageSelected(
  callbackQuery: CallbackQuery,
  language: string,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  // 保存语言设置
  await updateUserProfile(db, telegramId, { language_pref: language });

  // 获取 i18n 文本
  const i18n = getI18n(language);

  // 引导打开 Mini App
  await telegram.sendMessageWithWebAppButton(
    chatId,
    i18n.onboarding.openMiniApp,
    {
      text: i18n.onboarding.openMiniAppButton,
      web_app: {
        url: `${env.MINI_APP_URL}?startapp=onboarding`,
      },
    }
  );

  // 同时提供 Bot Fallback
  await telegram.sendMessage(
    chatId,
    i18n.onboarding.botFallback,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: i18n.onboarding.useBotCommands, callback_data: 'use_bot_onboarding' }],
        ],
      },
    }
  );
}
```

---

## 📝 实现步骤

### Phase 1：修复当前问题（立即）

1. ✅ 添加语言选择
2. ✅ 移除 /start 强制要求
3. ✅ 自动触发欢迎流程

### Phase 2：Mini App 开发（短期）

1. ⏳ 开发 Mini App 注册流程
2. ⏳ 实现 initData 验签
3. ⏳ 实现进度保存和恢复
4. ⏳ 实现 Bot Fallback 机制

### Phase 3：优化体验（中期）

1. ⏳ 添加动画和过渡效果
2. ⏳ 优化加载性能
3. ⏳ 添加错误处理和重试

---

## 🎯 用户体验对比

### 当前方案（Bot 注册）

| 优点 | 缺点 |
|------|------|
| 简单，无需打开 App | 多步骤对话，体验不流畅 |
| 兼容性好 | 无法显示进度 |
| - | 难以返回修改 |
| - | UI 受限 |

### 新方案（Mini App 注册）

| 优点 | 缺点 |
|------|------|
| 流畅的 UI/UX | 需要开发 Mini App |
| 视觉化进度显示 | 需要额外的前端技能 |
| 易于返回修改 | - |
| 更好的表单体验 | - |
| 符合设计原则 | - |

---

## 📊 建议优先级

### 🔥 高优先级（立即实现）

1. **添加语言选择**
   - 在首次接触时让用户选择语言
   - 保存到 `users.language_pref`

2. **移除 /start 强制要求**
   - 任何消息都触发欢迎流程
   - 自动检测新用户

3. **添加 Bot Fallback 提示**
   - 如果用户不想用 /start，提供明确引导
   - 显示：「發送任何消息開始使用，或輸入 /start」

### 🔶 中优先级（短期实现）

4. **开发 Mini App 注册流程**
   - 实现完整的注册 UI
   - 实现进度保存和恢复

5. **实现 Bot 引导到 Mini App**
   - 添加 WebApp 按钮
   - 实现 Bot Fallback 机制

### 🔷 低优先级（长期优化）

6. **优化 Mini App 体验**
   - 添加动画
   - 优化性能
   - 完善错误处理

---

**建议**: 先实现高优先级的修复，让当前 Bot 可用性更好，然后再逐步开发 Mini App。

**问题**: 你希望我现在就开始实现这些改进吗？

