# XunNi 翻譯策略設計

## 1. 概述

設計多層級翻譯策略，VIP 使用者使用 OpenAI，免費使用者使用 Google Translate，並提供失敗降級機制。

---

## 2. 翻譯供應商

### 2.1 支援的供應商

1. **OpenAI GPT-4o-mini**（VIP 優先）
   - 品質：高
   - 成本：中等
   - 速度：快
   - 語言：34+ 種

2. **Google Translate API**（免費 / 降級）
   - 品質：中等
   - 成本：低
   - 速度：快
   - 語言：100+ 種

### 2.2 語言列表（34 種）

```typescript
// src/config/languages.ts

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', cldr: 'en-US' },
  { code: 'zh-TW', name: '繁體中文', cldr: 'zh-TW' },
  { code: 'zh-CN', name: '简体中文', cldr: 'zh-CN' },
  { code: 'ja', name: '日本語', cldr: 'ja-JP' },
  { code: 'ko', name: '한국어', cldr: 'ko-KR' },
  { code: 'th', name: 'ไทย', cldr: 'th-TH' },
  { code: 'vi', name: 'Tiếng Việt', cldr: 'vi-VN' },
  { code: 'es', name: 'Español', cldr: 'es-ES' },
  { code: 'fr', name: 'Français', cldr: 'fr-FR' },
  { code: 'de', name: 'Deutsch', cldr: 'de-DE' },
  { code: 'it', name: 'Italiano', cldr: 'it-IT' },
  { code: 'pt', name: 'Português', cldr: 'pt-PT' },
  { code: 'ru', name: 'Русский', cldr: 'ru-RU' },
  { code: 'ar', name: 'العربية', cldr: 'ar-SA' },
  { code: 'hi', name: 'हिन्दी', cldr: 'hi-IN' },
  { code: 'id', name: 'Bahasa Indonesia', cldr: 'id-ID' },
  { code: 'ms', name: 'Bahasa Melayu', cldr: 'ms-MY' },
  { code: 'tr', name: 'Türkçe', cldr: 'tr-TR' },
  { code: 'pl', name: 'Polski', cldr: 'pl-PL' },
  { code: 'nl', name: 'Nederlands', cldr: 'nl-NL' },
  { code: 'sv', name: 'Svenska', cldr: 'sv-SE' },
  { code: 'da', name: 'Dansk', cldr: 'da-DK' },
  { code: 'no', name: 'Norsk', cldr: 'no-NO' },
  { code: 'fi', name: 'Suomi', cldr: 'fi-FI' },
  { code: 'cs', name: 'Čeština', cldr: 'cs-CZ' },
  { code: 'hu', name: 'Magyar', cldr: 'hu-HU' },
  { code: 'ro', name: 'Română', cldr: 'ro-RO' },
  { code: 'el', name: 'Ελληνικά', cldr: 'el-GR' },
  { code: 'he', name: 'עברית', cldr: 'he-IL' },
  { code: 'uk', name: 'Українська', cldr: 'uk-UA' },
  { code: 'bg', name: 'Български', cldr: 'bg-BG' },
  { code: 'hr', name: 'Hrvatski', cldr: 'hr-HR' },
  { code: 'sk', name: 'Slovenčina', cldr: 'sk-SK' },
  { code: 'sl', name: 'Slovenščina', cldr: 'sl-SI' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];
export type CLDRCode = typeof SUPPORTED_LANGUAGES[number]['cldr'];
```

**規範**：
- 使用 BCP 47 格式（如 zh-TW, en-US）
- 與 CLDR 對齊，便於未來對接其他服務
- 支援 34 種語言

---

## 3. 翻譯策略

### 3.1 VIP 使用者策略

**優先順序**：
1. **OpenAI GPT-4o-mini**（優先）
2. **Google Translate**（降級）

**流程**：
```
VIP 使用者發送訊息
→ 嘗試 OpenAI 翻譯（timeout: 5s）
→ 成功：使用 OpenAI 翻譯
→ 失敗（timeout/error）：降級到 Google Translate
→ 記錄降級事件（用於監控）
```

### 3.2 免費使用者策略

**僅使用**：
- **Google Translate API**

**流程**：
```
免費使用者發送訊息
→ 使用 Google Translate 翻譯
→ 成功：使用翻譯結果
→ 失敗：發送原文 + 提示
```

### 3.3 翻譯失敗處理

**策略**：
- 記錄日誌
- 發送原文 + 提示訊息
- 不阻擋使用者發言
- 僅依靠本地規則（URL、敏感詞）

**提示訊息**：
```
翻譯服務暫時有問題，請先看原文
Translation service temporarily unavailable, please see original text
```

---

## 4. 實作設計

### 4.1 翻譯調度邏輯

```typescript
// src/domain/translation-policy.ts

export enum TranslationProvider {
  OPENAI = 'openai',
  GOOGLE = 'google',
}

export interface TranslationResult {
  text: string;
  provider: TranslationProvider;
  sourceLanguage: string;
  targetLanguage: string;
  fallback: boolean; // 是否使用降級
  cost?: number; // 成本（tokens 或 API 調用次數）
}

export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage: string | undefined,
  user: User,
  env: Env
): Promise<TranslationResult> {
  const isVip = isVipActive(user, new Date());
  
  if (isVip) {
    // VIP: 優先使用 OpenAI
    try {
      const result = await translateWithOpenAI(
        text,
        targetLanguage,
        sourceLanguage,
        env
      );
      
      // 記錄翻譯成本
      await recordTranslationCost(
        user.telegram_id,
        TranslationProvider.OPENAI,
        result.cost || 0,
        db
      );
      
      return {
        text: result.text,
        provider: TranslationProvider.OPENAI,
        sourceLanguage,
        targetLanguage,
        fallback: false,
        cost: result.cost,
      };
    } catch (error) {
      // OpenAI 失敗，降級到 Google
      console.error('OpenAI translation failed, falling back to Google:', error);
      
      // 記錄降級事件
      await recordTranslationFallback(
        user.telegram_id,
        TranslationProvider.OPENAI,
        error,
        db
      );
      
      // 發送告警（如需要）
      await sendFallbackAlert(env, user.telegram_id, error);
      
      // 降級到 Google
      return await translateWithGoogle(text, targetLanguage, sourceLanguage, env, user, true);
    }
  } else {
    // 免費：直接使用 Google
    return await translateWithGoogle(text, targetLanguage, sourceLanguage, env, user, false);
  }
}
```

### 4.2 OpenAI 翻譯實作

```typescript
// src/services/openai/translation.ts

export async function translateWithOpenAI(
  text: string,
  targetLanguage: string,
  sourceLanguage: string | undefined,
  env: Env
): Promise<{ text: string; cost: number }> {
  const apiKey = env.OPENAI_API_KEY;
  const timeout = 5000; // 5 秒超時
  
  const prompt = sourceLanguage
    ? `Translate the following text from ${sourceLanguage} to ${targetLanguage}. Only return the translated text, no explanations:\n\n${text}`
    : `Translate the following text to ${targetLanguage}. Only return the translated text, no explanations:\n\n${text}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    const translated = data.choices[0].message.content.trim();
    
    // 計算成本（簡化：tokens * 價格）
    const cost = estimateOpenAICost(data.usage.total_tokens);
    
    return { text: translated, cost };
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('OpenAI translation timeout');
    }
    
    throw error;
  }
}
```

### 4.3 Google Translate 實作

```typescript
// src/services/google/translation.ts

export async function translateWithGoogle(
  text: string,
  targetLanguage: string,
  sourceLanguage: string | undefined,
  env: Env,
  user: User,
  isFallback: boolean
): Promise<TranslationResult> {
  const apiKey = env.GOOGLE_TRANSLATE_API_KEY;
  
  try {
    const url = new URL('https://translation.googleapis.com/language/translate/v2');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('q', text);
    url.searchParams.set('target', targetLanguage);
    if (sourceLanguage) {
      url.searchParams.set('source', sourceLanguage);
    }
    
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Google Translate API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    const translated = data.data.translations[0].translatedText;
    
    // 記錄成本
    await recordTranslationCost(
      user.telegram_id,
      TranslationProvider.GOOGLE,
      1, // 1 API 調用
      db
    );
    
    // 如果是降級，記錄
    if (isFallback) {
      await recordTranslationFallback(
        user.telegram_id,
        TranslationProvider.GOOGLE,
        null,
        db
      );
    }
    
    return {
      text: translated,
      provider: TranslationProvider.GOOGLE,
      sourceLanguage,
      targetLanguage,
      fallback: isFallback,
      cost: 1,
    };
  } catch (error) {
    // Google 也失敗，發送原文 + 提示
    console.error('Google translation failed:', error);
    
    return {
      text: text, // 原文
      provider: TranslationProvider.GOOGLE,
      sourceLanguage,
      targetLanguage,
      fallback: true,
      cost: 0,
    };
  }
}
```

---

## 5. 成本監控

### 5.1 翻譯成本記錄

```sql
CREATE TABLE translation_costs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  provider TEXT,              -- 'openai' / 'google'
  source_language TEXT,
  target_language TEXT,
  cost_amount REAL,           -- 成本（tokens 或 API 調用次數）
  is_fallback INTEGER DEFAULT 0, -- 是否為降級
  created_at DATETIME
);

CREATE INDEX idx_translation_costs_user_id ON translation_costs(user_id);
CREATE INDEX idx_translation_costs_created_at ON translation_costs(created_at);
CREATE INDEX idx_translation_costs_provider ON translation_costs(provider);
```

### 5.2 成本統計

```typescript
// src/domain/translation-policy.ts

export async function getTranslationCosts(
  db: D1Database,
  startDate: string,
  endDate: string
): Promise<{
  openai: { count: number; totalCost: number };
  google: { count: number; totalCost: number };
  fallbacks: number;
}> {
  const costs = await db.prepare(`
    SELECT 
      provider,
      COUNT(*) as count,
      SUM(cost_amount) as total_cost,
      SUM(is_fallback) as fallback_count
    FROM translation_costs
    WHERE created_at >= ? AND created_at <= ?
    GROUP BY provider
  `).bind(startDate, endDate).all();
  
  const openai = costs.results.find(r => r.provider === 'openai') || { count: 0, total_cost: 0 };
  const google = costs.results.find(r => r.provider === 'google') || { count: 0, total_cost: 0 };
  
  return {
    openai: { count: openai.count, totalCost: openai.total_cost },
    google: { count: google.count, totalCost: google.total_cost },
    fallbacks: (openai.fallback_count || 0) + (google.fallback_count || 0),
  };
}
```

---

## 6. 告警機制

### 6.1 降級告警

當 OpenAI 失敗降級到 Google 時：
- 記錄日誌
- 發送告警到 Slack（如需要）
- 記錄降級次數（用於監控）

### 6.2 成本告警

當翻譯成本超過預算時：
- 每日成本告警
- 每月成本告警
- 自動暫停翻譯（可選）

---

## 7. 隱私要求

### 7.1 PII 清洗

**要求**：
- 翻譯前清洗個人識別資訊（PII）
- 移除電話號碼、Email、地址等
- 僅翻譯清洗後的文字

### 7.2 資料最小化

**原則**：
- 僅發送需要翻譯的內容
- 不發送使用者識別資訊
- 不發送對話上下文（除非必要）

---

## 8. 翻譯 Fallback 策略

### 8.1 Fallback 流程

```
翻譯請求
→ 嘗試主要供應商（OpenAI for VIP, Google for Free）
→ 成功：返回翻譯
→ 失敗：降級到次要供應商（Google）
→ 還是失敗：返回原文 + 提示
```

### 8.2 Fallback 提示

**VIP 使用者**（OpenAI 失敗時）：
```
翻譯服務暫時有問題，已使用備用翻譯
Translation service temporarily unavailable, using backup translation
```

**所有使用者**（Google 失敗時）：
```
翻譯服務暫時有問題，請先看原文
Translation service temporarily unavailable, please see original text

{原文內容}
```

---

## 9. 監控欄位

### 9.1 翻譯監控指標

- 翻譯請求總數
- 成功翻譯數
- 失敗翻譯數
- 降級次數
- OpenAI 成本
- Google 成本
- 平均翻譯時間
- 錯誤率

### 9.2 告警閾值

- OpenAI 失敗率 > 10%：告警
- Google 失敗率 > 5%：告警
- 每日成本超過預算：告警
- 降級次數 > 100/天：告警

---

## 10. 實作範例

### 10.1 在訊息轉發中使用

```typescript
// src/telegram/handlers/msg_forward.ts

export async function forwardMessageWithTranslation(
  conversationId: number,
  senderId: string,
  messageText: string,
  env: Env,
  db: D1Database
): Promise<void> {
  // ... 取得對話和使用者資訊 ...
  
  // 檢查是否需要翻譯
  const needsTranslation = 
    (senderIsVip || receiverIsVip) &&
    senderLang !== receiverLang;
  
  if (needsTranslation) {
    try {
      // 清洗 PII
      const cleanedText = sanitizePII(messageText);
      
      // 翻譯
      const result = await translateText(
        cleanedText,
        receiverLang,
        senderLang,
        receiver, // 使用接收者的 VIP 狀態決定策略
        env,
        db
      );
      
      // 格式化訊息
      let finalMessage = result.text;
      
      // 如果是降級，添加提示
      if (result.fallback) {
        finalMessage += '\n\n⚠️ 翻譯服務暫時有問題，請先看原文\n' + messageText;
      }
      
      await sendMessage(env, receiverId, finalMessage);
    } catch (error) {
      // 翻譯完全失敗，發送原文 + 提示
      await sendMessage(
        env,
        receiverId,
        messageText + '\n\n⚠️ 翻譯服務暫時有問題，請先看原文'
      );
    }
  } else {
    // 不需要翻譯，直接發送
    await sendMessage(env, receiverId, messageText);
  }
}
```

---

## 11. 注意事項

1. **成本控制**：監控翻譯成本，設定告警閾值
2. **性能優化**：快取常用翻譯（可選）
3. **隱私保護**：清洗 PII 後再翻譯
4. **錯誤處理**：妥善處理 timeout 和 API 錯誤
5. **降級策略**：確保有可靠的降級方案

---

**最後更新**：2025-01-15

