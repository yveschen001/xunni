# XunNi AI 內容審核設計

## 1. 概述

設計 AI 內容審核機制，在 OpenAI 服務異常時提供降級策略，確保系統穩定運行。

---

## 2. AI 審核策略

### 2.1 審核流程

**優先順序**：
1. **本地規則檢查**（URL 白名單、敏感詞）
2. **AI 審核**（OpenAI，可選）
3. **記錄與告警**

### 2.2 AI 審核失敗處理

**當 OpenAI 掛掉或超額時**：

**策略**：
1. **記錄日誌**：記錄失敗原因、時間、使用者 ID
2. **不阻擋發言**：不因為 AI 審核失敗而 block 使用者
3. **僅依靠本地規則**：URL 白名單、敏感詞過濾
4. **發送告警**：通知管理員 AI 審核服務異常

**錯誤處理**：
```typescript
// src/domain/risk.ts

export async function maybeRunAiModeration(
  text: string,
  userId: string,
  conversationId: number | null,
  env: Env,
  db: D1Database
): Promise<ModerationResult | null> {
  try {
    // 嘗試 AI 審核（timeout: 3s）
    const result = await moderateContentWithOpenAI(text, env, 3000);
    
    // 記錄審核結果
    await recordAiModeration(
      userId,
      conversationId,
      text,
      result,
      'openai',
      db
    );
    
    return result;
  } catch (error) {
    // AI 審核失敗處理
    console.error('AI moderation failed:', error);
    
    // 記錄失敗日誌
    await recordAiModerationFailure(
      userId,
      conversationId,
      text,
      error,
      db
    );
    
    // 發送告警（如需要）
    await sendModerationFailureAlert(env, userId, error);
    
    // 不阻擋發言，返回 null（表示未進行 AI 審核）
    return null;
  }
}
```

---

## 3. 本地規則優先

### 3.1 本地規則檢查

**檢查項目**：
1. **URL 白名單**：不在白名單的 URL 直接拒絕
2. **敏感詞過濾**：包含敏感詞的內容拒絕
3. **長度檢查**：超過長度限制拒絕
4. **Emoji 驗證**：僅允許官方 Emoji

**執行順序**：
```
訊息接收
→ URL 白名單檢查（必須通過）
→ 敏感詞檢查（必須通過）
→ 長度檢查（必須通過）
→ Emoji 驗證（必須通過）
→ AI 審核（可選，失敗不阻擋）
→ 發送訊息
```

### 3.2 本地規則失敗處理

**URL 不在白名單**：
- 直接拒絕訊息
- 累加風險分數
- 提示使用者

**包含敏感詞**：
- 直接拒絕訊息
- 累加風險分數
- 提示使用者

**AI 審核失敗**：
- **不阻擋發言**
- 僅記錄日誌
- 依靠本地規則保護

---

## 4. Audit 日誌

### 4.1 AI 審核記錄

```sql
CREATE TABLE ai_moderation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  conversation_id INTEGER,
  content_summary TEXT,        -- 內容摘要（前 100 字）
  full_content TEXT,           -- 完整內容（加密或脫敏）
  moderation_reason TEXT,      -- 審核原因
  moderation_result TEXT,      -- 'flagged' / 'safe' / 'failed'
  provider TEXT,               -- 'openai' / null（如果失敗）
  error_message TEXT,          -- 錯誤訊息（如果失敗）
  risk_score_added INTEGER,    -- 累加的風險分數
  created_at DATETIME
);

CREATE INDEX idx_ai_moderation_logs_user_id ON ai_moderation_logs(user_id);
CREATE INDEX idx_ai_moderation_logs_conversation_id ON ai_moderation_logs(conversation_id);
CREATE INDEX idx_ai_moderation_logs_created_at ON ai_moderation_logs(created_at);
CREATE INDEX idx_ai_moderation_logs_result ON ai_moderation_logs(moderation_result);
```

### 4.2 審核記錄查詢

**管理員查詢**：
```typescript
// src/domain/risk.ts

export async function getAiModerationLogs(
  db: D1Database,
  filters: {
    userId?: string;
    conversationId?: number;
    startDate?: string;
    endDate?: string;
    result?: 'flagged' | 'safe' | 'failed';
  }
): Promise<AiModerationLog[]> {
  let query = 'SELECT * FROM ai_moderation_logs WHERE 1=1';
  const params: any[] = [];
  
  if (filters.userId) {
    query += ' AND user_id = ?';
    params.push(filters.userId);
  }
  
  if (filters.conversationId) {
    query += ' AND conversation_id = ?';
    params.push(filters.conversationId);
  }
  
  if (filters.startDate) {
    query += ' AND created_at >= ?';
    params.push(filters.startDate);
  }
  
  if (filters.endDate) {
    query += ' AND created_at <= ?';
    params.push(filters.endDate);
  }
  
  if (filters.result) {
    query += ' AND moderation_result = ?';
    params.push(filters.result);
  }
  
  query += ' ORDER BY created_at DESC LIMIT 100';
  
  const logs = await db.prepare(query).bind(...params).all();
  return logs.results as AiModerationLog[];
}
```

---

## 5. 實作範例

### 5.1 內容審核流程

```typescript
// src/telegram/handlers/msg_forward.ts

export async function validateAndModerateMessage(
  text: string,
  userId: string,
  conversationId: number | null,
  env: Env,
  db: D1Database
): Promise<{ allowed: boolean; reason?: string }> {
  // 1. URL 白名單檢查（必須通過）
  const urlCheck = checkUrlWhitelist(text);
  if (!urlCheck.allowed) {
    await addRisk(userId, 'URL_BLOCKED', db);
    return { allowed: false, reason: 'URL not allowed' };
  }
  
  // 2. 敏感詞檢查（必須通過）
  const sensitiveCheck = checkSensitiveWords(text);
  if (!sensitiveCheck.allowed) {
    await addRisk(userId, 'SENSITIVE_WORD', db);
    return { allowed: false, reason: 'Sensitive content' };
  }
  
  // 3. 長度檢查（必須通過）
  if (text.length > 1000) {
    return { allowed: false, reason: 'Message too long' };
  }
  
  // 4. AI 審核（可選，失敗不阻擋）
  const aiResult = await maybeRunAiModeration(text, userId, conversationId, env, db);
  
  if (aiResult && aiResult.flagged) {
    // AI 審核標記為違規
    await addRisk(userId, 'AI_FLAGGED', db);
    await recordAiModeration(userId, conversationId, text, aiResult, 'openai', db);
    
    // 根據風險等級決定是否阻擋
    const user = await db.getUser(userId);
    if (user.risk_score >= 50) {
      return { allowed: false, reason: 'Content flagged by AI' };
    }
    // 風險分數較低，僅記錄，不阻擋
  }
  
  // 5. 所有檢查通過
  return { allowed: true };
}
```

### 5.2 AI 審核實作

```typescript
// src/services/openai/moderation.ts

export async function moderateContentWithOpenAI(
  text: string,
  env: Env,
  timeout: number = 3000
): Promise<ModerationResult> {
  const apiKey = env.OPENAI_API_KEY;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`OpenAI Moderation API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    const result = data.results[0];
    
    return {
      flagged: result.flagged,
      categories: result.categories,
      categoryScores: result.category_scores,
      reason: result.flagged ? 'Content flagged by OpenAI' : null,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('OpenAI moderation timeout');
    }
    
    throw error;
  }
}
```

---

## 6. 失敗處理策略

### 6.1 失敗類型

1. **Timeout**：超過 3 秒未回應
2. **API Error**：API 返回錯誤
3. **Network Error**：網路連接失敗
4. **Quota Exceeded**：API 配額用盡

### 6.2 失敗處理

**所有失敗情況**：
1. 記錄日誌（包含錯誤類型、使用者 ID、內容摘要）
2. **不阻擋發言**（僅依靠本地規則）
3. 發送告警（通知管理員）
4. 記錄到 audit_logs

### 6.3 告警機制

**告警條件**：
- OpenAI API 失敗率 > 10%（1 小時內）
- OpenAI API 連續失敗 > 5 次
- OpenAI API Quota 用盡

**告警方式**：
- 記錄到日誌
- 發送到 Slack（如配置）
- 記錄到監控系統

---

## 7. 審核記錄管理

### 7.1 人工抽查

**管理員可以**：
- 查看所有 AI 審核記錄
- 查看被標記的內容
- 查看審核失敗的內容
- 手動調整風險分數

### 7.2 審核記錄保留

**保留期限**：
- 正常記錄：90 天
- 被標記的記錄：365 天
- 審核失敗記錄：30 天

---

## 8. 注意事項

1. **不依賴 AI**：AI 審核是可選的，不應作為唯一防護
2. **本地規則優先**：本地規則檢查必須先執行
3. **錯誤容忍**：AI 失敗不應影響使用者體驗
4. **隱私保護**：審核記錄需脫敏處理
5. **成本控制**：監控 AI 審核成本，設定配額限制

---

**最後更新**：2025-01-15

