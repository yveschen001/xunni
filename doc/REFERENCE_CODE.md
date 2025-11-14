# 參考代碼分析：moonini_bot

## 1. 概述

參考專案：https://github.com/yveschen001/moonini_bot/tree/master/cloudflare-worker

本文件分析 moonini_bot 中的關鍵實作，特別是：
- 訊息轉發機制
- 翻譯功能
- 匿名聊天實現

---

## 2. 訊息轉發機制

### 2.1 核心概念

moonini_bot 使用 Telegram Bot 作為中轉站，實現匿名轉發：

```
使用者 A → Bot → 使用者 B
使用者 B → Bot → 使用者 A
```

**關鍵點**：
- Bot 不暴露真實 Telegram ID
- 使用 `conversation_id` 作為關聯
- 驗證訊息來源和目標

### 2.2 實作要點

```typescript
// 參考實作思路（需根據 XunNi 需求調整）

/**
 * 轉發訊息給對話另一方
 */
async function forwardMessage(
  conversationId: number,
  senderId: string,
  messageText: string,
  env: Env,
  db: D1Database
): Promise<void> {
  // 1. 取得對話資訊
  const conversation = await db.prepare(`
    SELECT * FROM conversations
    WHERE id = ? AND status = 'active'
  `).bind(conversationId).first();
  
  if (!conversation) {
    throw new Error('Conversation not found');
  }
  
  // 2. 確定接收者
  const receiverId = conversation.user_a_id === senderId
    ? conversation.user_b_id
    : conversation.user_a_id;
  
  // 3. 檢查是否被封鎖
  const isBlocked = conversation.user_a_id === senderId
    ? conversation.b_blocked === 1
    : conversation.a_blocked === 1;
  
  if (isBlocked) {
    throw new Error('User is blocked');
  }
  
  // 4. 驗證訊息內容（URL 白名單、長度等）
  validateMessage(messageText);
  
  // 5. 發送訊息（不暴露發送者 ID）
  await sendMessage(env, receiverId, messageText);
  
  // 6. 更新對話時間
  await db.prepare(`
    UPDATE conversations
    SET last_message_at = datetime('now')
    WHERE id = ?
  `).bind(conversationId).run();
}
```

### 2.3 訊息驗證

```typescript
/**
 * 驗證訊息內容
 */
function validateMessage(text: string): void {
  // 1. 檢查長度
  if (text.length > 1000) {
    throw new Error('Message too long');
  }
  
  // 2. 檢查 URL（白名單）
  const urlRegex = /https?:\/\/[^\s]+/g;
  const urls = text.match(urlRegex);
  
  if (urls) {
    const whitelist = [
      'telegram.org',
      't.me',
      // ... 其他允許的域名
    ];
    
    for (const url of urls) {
      const domain = new URL(url).hostname;
      if (!whitelist.some(allowed => domain.includes(allowed))) {
        throw new Error('URL not allowed');
      }
    }
  }
  
  // 3. 檢查 Emoji（僅允許官方 Emoji）
  // 實作 Emoji 驗證邏輯
}
```

---

## 3. 翻譯功能

### 3.1 翻譯流程

```
使用者 A (zh-TW) → Bot → 翻譯 → 使用者 B (en)
```

### 3.2 OpenAI 翻譯實作

```typescript
// src/services/openai/translation.ts

import type { Env } from '../../config/env';

/**
 * 翻譯文字
 */
export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage?: string,
  env: Env
): Promise<string> {
  const apiKey = env.OPENAI_API_KEY;
  
  const prompt = sourceLanguage
    ? `Translate the following text from ${sourceLanguage} to ${targetLanguage}. Only return the translated text, no explanations:\n\n${text}`
    : `Translate the following text to ${targetLanguage}. Only return the translated text, no explanations:\n\n${text}`;
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // 或 gpt-3.5-turbo（成本更低）
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // 降低隨機性，提高翻譯準確性
      max_tokens: 500,
    }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
  }
  
  return data.choices[0].message.content.trim();
}
```

### 3.3 在訊息轉發中整合翻譯

```typescript
// src/telegram/handlers/msg_forward.ts

import { translateText } from '../../services/openai/translation';
import { tForUser } from '../../i18n';

/**
 * 轉發訊息（含翻譯）
 */
export async function forwardMessageWithTranslation(
  conversationId: number,
  senderId: string,
  messageText: string,
  env: Env,
  db: D1Database
): Promise<void> {
  // 1. 取得對話和使用者資訊
  const conversation = await db.prepare(`
    SELECT c.*, 
           ua.language_pref as sender_lang,
           ub.language_pref as receiver_lang,
           ua.is_vip as sender_is_vip,
           ub.is_vip as receiver_is_vip
    FROM conversations c
    JOIN users ua ON c.user_a_id = ua.telegram_id
    JOIN users ub ON c.user_b_id = ub.telegram_id
    WHERE c.id = ? AND c.status = 'active'
  `).bind(conversationId).first();
  
  if (!conversation) {
    throw new Error('Conversation not found');
  }
  
  const receiverId = conversation.user_a_id === senderId
    ? conversation.user_b_id
    : conversation.user_a_id;
  
  const senderLang = conversation.sender_lang || 'zh-TW';
  const receiverLang = conversation.receiver_lang || 'zh-TW';
  
  // 2. 檢查是否需要翻譯（任一方為 VIP 且語言不同）
  const needsTranslation = 
    (conversation.sender_is_vip === 1 || conversation.receiver_is_vip === 1) &&
    senderLang !== receiverLang;
  
  let finalMessage = messageText;
  
  if (needsTranslation) {
    try {
      // 翻譯訊息
      const translated = await translateText(
        messageText,
        receiverLang,
        senderLang,
        env
      );
      
      // 格式化訊息：第一行翻譯，第二行原文（小字）
      finalMessage = `${translated}\n\n<small>${messageText}</small>`;
    } catch (error) {
      console.error('Translation failed:', error);
      // 翻譯失敗時仍發送原文
      finalMessage = messageText;
    }
  }
  
  // 3. 發送訊息
  await sendMessage(env, receiverId, finalMessage, {
    parse_mode: 'HTML', // 支援 HTML 格式（小字）
  });
  
  // 4. 更新對話時間
  await db.prepare(`
    UPDATE conversations
    SET last_message_at = datetime('now')
    WHERE id = ?
  `).bind(conversationId).run();
}
```

---

## 4. 匿名聊天實現細節

### 4.1 對話建立

```typescript
/**
 * 建立匿名對話（撿到瓶子時）
 */
export async function createAnonymousConversation(
  bottleId: number,
  catcherId: string,
  db: D1Database
): Promise<number> {
  // 1. 取得瓶子資訊
  const bottle = await db.prepare(`
    SELECT * FROM bottles WHERE id = ?
  `).bind(bottleId).first();
  
  if (!bottle) {
    throw new Error('Bottle not found');
  }
  
  // 2. 建立對話
  const result = await db.prepare(`
    INSERT INTO conversations (
      bottle_id,
      user_a_id,
      user_b_id,
      created_at,
      last_message_at,
      status
    ) VALUES (?, ?, ?, datetime('now'), datetime('now'), 'active')
  `).bind(
    bottleId,
    bottle.owner_id,
    catcherId
  ).run();
  
  // 3. 更新瓶子狀態
  await db.prepare(`
    UPDATE bottles
    SET status = 'matched'
    WHERE id = ?
  `).bind(bottleId).run();
  
  return result.meta.last_row_id;
}
```

### 4.2 訊息路由

```typescript
/**
 * 處理使用者發送的訊息
 */
export async function handleUserMessage(
  userId: string,
  messageText: string,
  env: Env,
  db: D1Database
): Promise<void> {
  // 1. 找出使用者參與的活躍對話
  const conversations = await db.prepare(`
    SELECT id FROM conversations
    WHERE (user_a_id = ? OR user_b_id = ?)
      AND status = 'active'
    ORDER BY last_message_at DESC
    LIMIT 1
  `).bind(userId, userId).all();
  
  if (conversations.results.length === 0) {
    // 沒有活躍對話，提示使用者
    await sendMessage(
      env,
      userId,
      tForUser('error.no_active_conversation', await getUserLanguage(userId, db))
    );
    return;
  }
  
  const conversationId = conversations.results[0].id as number;
  
  // 2. 轉發訊息（含翻譯）
  await forwardMessageWithTranslation(
    conversationId,
    userId,
    messageText,
    env,
    db
  );
}
```

---

## 5. 最佳實踐總結

### 5.1 訊息轉發

1. **驗證對話狀態**：確保對話存在且為 active
2. **檢查封鎖狀態**：確認接收者未封鎖發送者
3. **內容驗證**：URL 白名單、長度限制、Emoji 檢查
4. **匿名保護**：不暴露真實 Telegram ID

### 5.2 翻譯功能

1. **VIP 專屬**：僅 VIP 使用者享有翻譯
2. **語言檢測**：自動檢測來源語言（可選）
3. **錯誤處理**：翻譯失敗時回退到原文
4. **成本控制**：使用較便宜的模型（gpt-4o-mini）

### 5.3 性能優化

1. **快取翻譯**：相同內容可快取翻譯結果（使用 KV）
2. **批次處理**：多條訊息可批次翻譯
3. **超時處理**：設定翻譯 API 超時時間

---

## 6. 與 XunNi 的整合

### 6.1 差異點

1. **每日訊息限制**：XunNi 需要實作每日訊息數限制
2. **URL 白名單**：XunNi 需要更嚴格的白名單
3. **風險分數**：違規訊息需累加風險分數

### 6.2 擴充功能

1. **訊息審核**：可選的 AI 內容審核
2. **敏感詞過濾**：過濾不當內容
3. **翻譯開關**：VIP 使用者可選擇是否開啟翻譯

---

## 7. 參考資源

- [Telegram Bot API - sendMessage](https://core.telegram.org/bots/api#sendmessage)
- [OpenAI API - Chat Completions](https://platform.openai.com/docs/api-reference/chat)
- [Cloudflare Workers - Fetch API](https://developers.cloudflare.com/workers/runtime-apis/fetch/)

