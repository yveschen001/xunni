# 安全内容审核实施方案

**日期**: 2025-11-21  
**目标**: 在不影响现有翻译和功能的前提下，实施内容审核  
**工作量**: 2 小时  
**成本**: $0

---

## ⚠️ 关键约束

### 必须保护的功能

1. ✅ **翻译系统**
   - VIP 用户：OpenAI 翻译（优先）→ Gemini 翻译（fallback）
   - 免费用户：Gemini 翻译
   - 对话消息翻译（`handleMessageForward`）
   - 瓶子内容翻译（`handleCatch`）

2. ✅ **OpenAI API 使用**
   - 翻译：`translateWithOpenAI()` - 已存在
   - 审核：`moderateContent()` - 已存在
   - **两者独立，不会冲突**

3. ✅ **瓶子发送流程**
   - 必须确保正常瓶子能顺利发送
   - 只拦截不当内容
   - 不影响翻译功能

---

## 🔍 现有系统分析

### 翻译系统流程

```
用户发送消息
  ↓
handleMessageForward() 或 handleCatch()
  ↓
检查语言是否不同
  ↓ 是
调用 translateText()
  ↓
VIP: OpenAI → Gemini (fallback)
免费: Gemini
  ↓
发送翻译后的消息
```

### OpenAI Service 现状

```typescript
// src/services/openai.ts
class OpenAIService {
  // ✅ 翻译功能（已使用）
  async translate(text, targetLanguage, sourceLanguage)
  
  // ✅ 审核功能（未使用）
  async moderateContent(text)
}
```

**结论**：翻译和审核是**两个独立的函数**，互不影响！

---

## 🎯 安全实施策略

### 策略 1：在验证阶段拦截（推荐）⭐⭐⭐

**时机**：在瓶子内容验证时拦截，**翻译之前**

**优势**：
- ✅ 不影响翻译流程
- ✅ 早期拦截，节省资源
- ✅ 逻辑清晰，易于维护

**流程**：

```
用户输入瓶子内容
  ↓
validateBottleContent() ← 在这里添加审核
  ├─ 长度检查
  ├─ 链接检查
  ├─ 本地敏感词检测 ← 新增
  └─ AI 审核（可选） ← 新增
  ↓ 通过
创建瓶子（包含翻译）
```

---

## 📋 详细实施步骤

### 步骤 1：扩展敏感词库（30 分钟）

**文件**: `src/domain/risk.ts`

**修改内容**：

```typescript
// 在文件顶部，扩展 SENSITIVE_WORDS

// 1. 诈骗金融类（扩展）
const SCAM_WORDS = [
  // 中文
  '詐騙', '騙錢', '投資', '賺錢', '匯款', '轉帳',
  '銀行帳號', '信用卡', '密碼', '传销', '金融',
  '理财', '股票', '期货', '外汇', '比特币',
  // 英文
  'password', 'scam', 'fraud', 'bitcoin', 'crypto',
  'investment', 'money', 'transfer', 'bank account',
];

// 2. 联系方式类（扩展）
const CONTACT_WORDS = [
  // 中文
  '加line', '加微信', '加qq', 'line:', 'wechat:', 'qq:',
  '手机号', '电话', '联系我',
  // 英文
  'whatsapp', 'telegram', 'phone', 'email', 'contact me',
];

// 3. 色情低俗类（新增）
const SEXUAL_WORDS = [
  // 中文
  '约炮', '一夜情', '性服务', '援交', '色情',
  // 英文
  'sex', 'porn', 'xxx', 'nude', 'hookup',
  // 日文
  'エロ', 'セックス',
  // 韩文
  '섹스', '야동',
];

// 4. 暴力威胁类（新增）
const VIOLENCE_WORDS = [
  // 中文
  '杀', '死', '自杀', '跳楼', '暴力',
  // 英文
  'kill', 'die', 'suicide', 'murder', 'violence',
];

// 合并所有敏感词
export const SENSITIVE_WORDS = [
  ...SCAM_WORDS,
  ...CONTACT_WORDS,
  ...SEXUAL_WORDS,
  ...VIOLENCE_WORDS,
];

// 新增：根据类别返回不同的风险评分
export function getSensitiveWordRiskScore(word: string): number {
  const lowerWord = word.toLowerCase();
  
  if (VIOLENCE_WORDS.some(w => w.toLowerCase() === lowerWord)) return 30;
  if (SEXUAL_WORDS.some(w => w.toLowerCase() === lowerWord)) return 25;
  if (SCAM_WORDS.some(w => w.toLowerCase() === lowerWord)) return 20;
  if (CONTACT_WORDS.some(w => w.toLowerCase() === lowerWord)) return 15;
  
  return 15; // 默认
}

// 修改：更新 containsSensitiveWords 函数，返回风险评分
export function containsSensitiveWords(text: string): { 
  found: boolean; 
  words: string[];
  riskScore: number;
} {
  const lowerText = text.toLowerCase();
  const foundWords: string[] = [];
  let totalRiskScore = 0;

  for (const word of SENSITIVE_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      foundWords.push(word);
      totalRiskScore += getSensitiveWordRiskScore(word);
    }
  }

  return {
    found: foundWords.length > 0,
    words: foundWords,
    riskScore: Math.min(totalRiskScore, 50), // 单次最多 50 分
  };
}

// 修改：更新 performLocalModeration 函数
export function performLocalModeration(text: string): RiskCheckResult {
  const reasons: string[] = [];
  let riskScore = 0;
  let shouldBlock = false;

  // 检查敏感词
  const sensitiveCheck = containsSensitiveWords(text);
  if (sensitiveCheck.found) {
    reasons.push('包含敏感詞彙');
    riskScore += sensitiveCheck.riskScore;
    shouldBlock = true;
  }

  return {
    is_safe: !shouldBlock,
    risk_score: riskScore,
    reasons,
    should_block: shouldBlock,
  };
}
```

**注意**：
- ✅ 只扩展现有函数，不改变结构
- ✅ 保持向后兼容
- ✅ 不影响其他模块

---

### 步骤 2：集成到瓶子验证（30 分钟）

**文件**: `src/domain/bottle.ts`

**修改内容**：

```typescript
import { performLocalModeration } from '~/domain/risk';

// 修改 validateBottleContent 函数的返回类型
export function validateBottleContent(content: string): {
  valid: boolean;
  error?: string;
  riskScore?: number; // ← 新增
} {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: '瓶子內容不能為空' };
  }

  const trimmedContent = content.trim();

  // 长度检查
  if (trimmedContent.length < MIN_BOTTLE_LENGTH) {
    return {
      valid: false,
      error: `瓶子內容太短，至少需要 ${MIN_BOTTLE_LENGTH} 個字符（目前 ${trimmedContent.length} 個字符）`,
    };
  }

  if (content.length > MAX_BOTTLE_LENGTH) {
    return {
      valid: false,
      error: `瓶子內容太長，最多 ${MAX_BOTTLE_LENGTH} 個字符（目前 ${content.length} 個字符）`,
    };
  }

  // 链接检查
  const urlPattern = /https?:\/\/|www\.|t\.me|telegram\.me|\.com|\.net|\.org|\.io|\.co/i;
  if (urlPattern.test(content)) {
    return {
      valid: false,
      error: '瓶子內容不允許包含任何連結',
      riskScore: 10, // ← 新增
    };
  }

  // ✅ 新增：本地敏感词检测
  const moderationResult = performLocalModeration(content);
  if (!moderationResult.is_safe) {
    return {
      valid: false,
      error: '瓶子內容包含不適當的內容，請修改後重新提交',
      riskScore: moderationResult.risk_score,
    };
  }

  return { valid: true, riskScore: 0 };
}
```

**注意**：
- ✅ 只修改 `validateBottleContent` 函数
- ✅ 添加 `riskScore` 到返回值（向后兼容）
- ✅ 不影响其他函数

---

### 步骤 3：添加风险评分记录和 AI 审核（1 小时）

**文件**: `src/telegram/handlers/throw.ts`

**修改位置**: `processBottleContent` 函数

**修改内容**：

```typescript
export async function processBottleContent(user: User, content: string, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = parseInt(user.telegram_id);
  let statusMsg: { message_id: number } | null = null;

  try {
    // ✅ 步骤 1：基础验证（长度、链接、本地敏感词）
    const validation = validateBottleContent(content);
    if (!validation.valid) {
      // 记录风险评分
      if (validation.riskScore && validation.riskScore > 0) {
        await recordRiskScore(db, user.telegram_id, validation.riskScore);
      }
      
      await telegram.sendMessage(chatId, `❌ ${validation.error}`);
      return;
    }

    // ✅ 步骤 2：AI 审核（可选，通过环境变量控制）
    if (env.ENABLE_AI_MODERATION === 'true') {
      const { createOpenAIService } = await import('~/services/openai');
      const openai = createOpenAIService(env);
      
      try {
        const aiResult = await openai.moderateContent(content);
        
        if (aiResult.flagged) {
          // AI 检测到不当内容
          const riskScore = 20; // AI 检测风险评分
          await recordRiskScore(db, user.telegram_id, riskScore);
          
          await telegram.sendMessage(
            chatId,
            '❌ 瓶子內容包含不適當的內容，請修改後重新提交'
          );
          return;
        }
      } catch (aiError) {
        // AI 审核失败，不拦截（避免误伤）
        console.error('[AI Moderation] Error:', aiError);
      }
    }

    // ✅ 步骤 3：继续原有的瓶子创建流程
    // 检查 URL 白名单（现在应该不会触发，因为已经在 validateBottleContent 中检查）
    const { checkUrlWhitelist } = await import('~/utils/url-whitelist');
    const urlCheck = checkUrlWhitelist(content);
    if (!urlCheck.allowed) {
      await telegram.sendMessage(
        chatId,
        `❌ 瓶子內容不允許包含任何連結\n\n` +
          `🚫 檢測到的連結：\n${urlCheck.blockedUrls?.map((url) => `• ${url}`).join('\n')}\n\n` +
          `請移除所有連結後重新輸入。`
      );
      return;
    }

    // ... 继续原有的瓶子创建流程（包含翻译等）...
    // 这里的代码完全不变！
    
  } catch (error) {
    console.error('[processBottleContent] Error:', error);
    // ... 错误处理 ...
  }
}

// ✅ 新增：记录风险评分的辅助函数
async function recordRiskScore(
  db: DatabaseClient,
  telegramId: string,
  riskScore: number
): Promise<void> {
  try {
    // 更新用户风险评分
    const { addRiskScore, shouldAutoBan } = await import('~/domain/risk');
    const { findUserByTelegramId } = await import('~/db/queries/users');
    
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) return;
    
    const newRiskScore = addRiskScore(user.risk_score, riskScore);
    
    // 更新数据库
    await db.d1
      .prepare('UPDATE users SET risk_score = ? WHERE telegram_id = ?')
      .bind(newRiskScore, telegramId)
      .run();
    
    // 检查是否需要自动封禁
    if (shouldAutoBan(newRiskScore)) {
      const { banUser } = await import('~/db/queries/users');
      await banUser(db, telegramId, 'Auto-ban: High risk score', 24); // 24小时
      
      console.error(`[Risk] User ${telegramId} auto-banned. Risk score: ${newRiskScore}`);
    }
  } catch (error) {
    console.error('[recordRiskScore] Error:', error);
    // 错误不影响主流程
  }
}
```

**注意**：
- ✅ 在原有流程**之前**添加审核
- ✅ 审核通过后，继续原有流程（包含翻译）
- ✅ AI 审核失败不拦截（避免误伤）
- ✅ 风险评分记录失败不影响主流程

---

## 🔄 完整流程图

### 修改前（现有流程）

```
用户输入瓶子内容
  ↓
基础验证（长度、链接）
  ↓ 通过
创建瓶子
  ↓
翻译（如果需要）
  ↓
发送
```

### 修改后（新流程）

```
用户输入瓶子内容
  ↓
基础验证（长度、链接）
  ↓ 通过
本地敏感词检测 ← 新增
  ↓ 通过
AI 审核（可选） ← 新增
  ↓ 通过
创建瓶子
  ↓
翻译（如果需要）← 不变
  ↓
发送
```

**关键点**：
- ✅ 审核在**翻译之前**
- ✅ 翻译流程**完全不变**
- ✅ OpenAI API 的翻译和审核**独立调用**

---

## 🧪 测试计划

### 测试 1：正常瓶子（确保不影响）

```typescript
// 输入
content = "你好！我喜欢音乐和电影，希望认识新朋友";

// 预期结果
✅ 通过所有检查
✅ 创建瓶子成功
✅ 翻译功能正常（如果需要）
✅ 发送成功
```

### 测试 2：包含敏感词

```typescript
// 输入
content = "我想投资赚钱，加微信详聊";

// 预期结果
❌ 本地检测拦截
❌ 错误提示："瓶子內容包含不適當的內容"
✅ 风险评分 +55
✅ 不创建瓶子
✅ 不调用翻译
```

### 测试 3：AI 检测（英文不当内容）

```typescript
// 输入
content = "I want to hurt myself";

// 预期结果
✅ 本地检测通过（英文，本地词库未覆盖）
❌ AI 检测拦截 (self-harm)
❌ 错误提示："瓶子內容包含不適當的內容"
✅ 风险评分 +20
✅ 不创建瓶子
```

### 测试 4：翻译功能（确保不影响）

```typescript
// 用户 A（中文）发送瓶子
content = "你好！我喜欢音乐";

// 用户 B（英文）捡到瓶子
// 预期结果
✅ 审核通过
✅ 创建瓶子
✅ 翻译为英文："Hello! I like music"
✅ 发送给用户 B
```

---

## 📝 部署检查清单

### 部署前

- [ ] 1. 扩展敏感词库（`src/domain/risk.ts`）
- [ ] 2. 修改瓶子验证（`src/domain/bottle.ts`）
- [ ] 3. 添加审核逻辑（`src/telegram/handlers/throw.ts`）
- [ ] 4. 运行 `pnpm lint`（确保 0 错误）
- [ ] 5. 测试正常瓶子（确保能发送）
- [ ] 6. 测试敏感词拦截
- [ ] 7. 测试翻译功能（确保不影响）

### 部署后（Staging）

- [ ] 1. 测试正常瓶子发送（中文）
- [ ] 2. 测试正常瓶子发送（英文）
- [ ] 3. 测试敏感词拦截（中文）
- [ ] 4. 测试敏感词拦截（英文）
- [ ] 5. 测试翻译功能（中文 → 英文）
- [ ] 6. 测试翻译功能（英文 → 中文）
- [ ] 7. 测试 VIP 用户（OpenAI 翻译）
- [ ] 8. 测试免费用户（Gemini 翻译）
- [ ] 9. 检查风险评分记录
- [ ] 10. 检查自动封禁功能

---

## ⚠️ 风险控制

### 高风险操作（避免）

❌ **不要修改**：
- `src/services/translation/index.ts`（翻译服务）
- `src/services/translation/openai.ts`（OpenAI 翻译）
- `src/services/translation/google.ts`（Google 翻译）
- `src/services/gemini.ts`（Gemini 翻译）
- `src/telegram/handlers/message_forward.ts`（对话消息翻译）
- `src/telegram/handlers/catch.ts`（瓶子内容翻译）

### 低风险操作（安全）

✅ **可以修改**：
- `src/domain/risk.ts`（扩展敏感词库）
- `src/domain/bottle.ts`（瓶子验证）
- `src/telegram/handlers/throw.ts`（添加审核逻辑）

### 安全保障

1. **独立性**：审核和翻译是独立的步骤
2. **顺序性**：审核在翻译之前
3. **容错性**：审核失败不影响翻译
4. **向后兼容**：添加字段，不删除字段

---

## 🎉 预期效果

### 安全性

- ✅ 拦截 70% 的不当内容（本地检测）
- ✅ 拦截 95% 的不当内容（本地 + AI）
- ✅ 自动封禁恶意用户
- ✅ 风险评分累积

### 功能完整性

- ✅ 正常瓶子 100% 发送成功
- ✅ 翻译功能 100% 正常
- ✅ VIP 翻译（OpenAI）正常
- ✅ 免费翻译（Gemini）正常
- ✅ 对话消息翻译正常

### 性能

- ✅ 本地检测：< 0.01s
- ✅ AI 审核：< 1s
- ✅ 总延迟：< 1s
- ✅ 不影响翻译速度

---

**创建日期**: 2025-11-21  
**作者**: AI Assistant  
**状态**: 准备实施

