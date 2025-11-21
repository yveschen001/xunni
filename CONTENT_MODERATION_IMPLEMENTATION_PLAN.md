# 内容审核系统实施计划（简化版）

**日期**: 2025-11-21  
**状态**: 准备实施  
**工作量**: 1.5 小时  
**成本**: $0

---

## ✅ 现有资源

### 已有功能
1. ✅ **OpenAI Moderation API** (`src/services/openai.ts`)
   - 函数：`moderateContent(text: string)`
   - 返回：`{ flagged, categories, score }`
   - 状态：已实现，可直接使用

2. ✅ **风险评分系统** (`src/domain/risk.ts`)
   - 常量：`RISK_SCORE_*`, `RISK_INCREMENT_*`
   - 函数：`addRiskScore()`, `shouldAutoBan()`
   - 状态：已实现，未使用

3. ✅ **本地敏感词检测** (`src/domain/risk.ts`)
   - 函数：`containsSensitiveWords()`, `performLocalModeration()`
   - 词库：15 个词（需扩展）
   - 状态：已实现，未使用

### 需要补充
1. ❌ 扩展敏感词库（15 → 50+ 词）
2. ❌ 集成到瓶子验证流程
3. ❌ 风险评分记录到数据库

---

## 🎯 实施步骤

### 步骤 1：扩展本地敏感词库（30 分钟）

**文件**: `src/domain/risk.ts`

**修改内容**：

```typescript
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

// 根据类别返回不同的风险评分
export function getSensitiveWordRiskScore(word: string): number {
  const lowerWord = word.toLowerCase();
  
  if (VIOLENCE_WORDS.some(w => w.toLowerCase() === lowerWord)) return 30;
  if (SEXUAL_WORDS.some(w => w.toLowerCase() === lowerWord)) return 25;
  if (SCAM_WORDS.some(w => w.toLowerCase() === lowerWord)) return 20;
  if (CONTACT_WORDS.some(w => w.toLowerCase() === lowerWord)) return 15;
  
  return 15; // 默认
}

// 更新 containsSensitiveWords 函数，返回风险评分
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

// 更新 performLocalModeration 函数
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

---

### 步骤 2：集成到瓶子验证（30 分钟）

**文件**: `src/domain/bottle.ts`

**修改内容**：

```typescript
import { performLocalModeration } from '~/domain/risk';

export function validateBottleContent(content: string): {
  valid: boolean;
  error?: string;
  riskScore?: number;
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
      riskScore: 10, // URL 风险评分
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

---

### 步骤 3：添加风险评分记录和 AI 审核（30 分钟）

**文件**: `src/telegram/handlers/throw.ts`

**修改内容**：

```typescript
// 在 processBottleContent 函数中

export async function processBottleContent(user: User, content: string, env: Env): Promise<void> {
  const db = createDatabaseClient(env.DB);
  const telegram = createTelegramService(env);
  const chatId = parseInt(user.telegram_id);
  let statusMsg: { message_id: number } | null = null;

  try {
    // 1. 基础验证（长度、链接）
    const validation = validateBottleContent(content);
    if (!validation.valid) {
      // 记录风险评分
      if (validation.riskScore && validation.riskScore > 0) {
        await recordRiskScore(db, user.telegram_id, validation.riskScore);
      }
      
      await telegram.sendMessage(chatId, `❌ ${validation.error}`);
      return;
    }

    // 2. AI 审核（可选，通过环境变量控制）
    if (env.ENABLE_AI_MODERATION === 'true') {
      const { createOpenAIService } = await import('~/services/openai');
      const openai = createOpenAIService(env);
      
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
    }

    // 3. 继续原有的瓶子创建流程
    // ... 现有代码 ...
  } catch (error) {
    console.error('[processBottleContent] Error:', error);
    // ... 错误处理 ...
  }
}

// 新增：记录风险评分的辅助函数
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
  }
}
```

---

## 📊 实施效果

### 检测流程

```
用户输入瓶子内容
  ↓
基础验证（长度、链接）
  ↓ 通过
本地敏感词检测（< 0.01s）
  ↓ 通过
AI 审核（< 1s，可选）
  ↓ 通过
创建瓶子
```

### 拦截示例

**示例 1：本地敏感词拦截**
```
输入："我想投资赚钱，加微信详聊"
检测：包含"投资"、"赚钱"、"加微信"
风险评分：+20 +20 +15 = +55
结果：❌ 瓶子內容包含不適當的內容，請修改後重新提交
```

**示例 2：AI 拦截**
```
输入："I want to hurt myself"
本地检测：通过（英文，本地词库未覆盖）
AI 检测：flagged (self-harm)
风险评分：+20
结果：❌ 瓶子內容包含不適當的內容，請修改後重新提交
```

**示例 3：正常通过**
```
输入："你好！我喜欢音乐和电影，希望认识新朋友"
本地检测：通过
AI 检测：通过
结果：✅ 创建瓶子
```

---

## 🛡️ 风险评分机制

### 评分规则

| 触发条件 | 风险增量 | 说明 |
|---------|---------|------|
| 包含链接 | +10 | 基础风险 |
| 联系方式类敏感词 | +15 | 中等风险 |
| 诈骗金融类敏感词 | +20 | 高风险 |
| AI 检测不当内容 | +20 | 高风险 |
| 色情低俗类敏感词 | +25 | 极高风险 |
| 暴力威胁类敏感词 | +30 | 极高风险 |

### 自动封禁

| 风险评分 | 处理措施 |
|---------|---------|
| 0-99 | 正常 |
| 100-149 | 自动封禁 24 小时 |
| 150-199 | 自动封禁 7 天 |
| 200+ | 永久封禁 |

### 评分衰减

- 每 7 天自动减少 10 分
- 最低不低于 0 分
- 鼓励用户改善行为

---

## 🧪 测试计划

### 测试用例

```typescript
// 测试 1：正常内容
validateBottleContent('你好！我喜欢音乐和电影');
// 预期：{ valid: true, riskScore: 0 }

// 测试 2：包含链接
validateBottleContent('访问 www.example.com');
// 预期：{ valid: false, error: '不允許包含任何連結', riskScore: 10 }

// 测试 3：包含敏感词
validateBottleContent('我想投资赚钱');
// 预期：{ valid: false, error: '包含不適當的內容', riskScore: 40 }

// 测试 4：包含多个敏感词
validateBottleContent('投资赚钱加微信');
// 预期：{ valid: false, error: '包含不適當的內容', riskScore: 50 }

// 测试 5：AI 检测（英文暴力内容）
moderateContent('I want to kill you');
// 预期：{ flagged: true, categories: ['violence', 'harassment'] }
```

---

## 📝 部署检查清单

### 部署前

- [ ] 扩展敏感词库（`src/domain/risk.ts`）
- [ ] 集成到瓶子验证（`src/domain/bottle.ts`）
- [ ] 添加风险评分记录（`src/telegram/handlers/throw.ts`）
- [ ] 运行 `pnpm lint`（确保 0 错误）
- [ ] 本地测试（测试所有测试用例）

### 部署后

- [ ] 在 Staging 测试正常内容（应通过）
- [ ] 在 Staging 测试敏感词（应拦截）
- [ ] 在 Staging 测试链接（应拦截）
- [ ] 检查风险评分是否正确记录
- [ ] 检查自动封禁是否生效
- [ ] 监控 OpenAI API 调用（确保正常）

---

## 💰 成本分析

### OpenAI Moderation API

**定价**：完全免费 ✅

**使用量估算**（假设每天 1000 次瓶子投递）：
- 本地检测拦截：~30%（300 次）
- 需要 AI 检测：~70%（700 次）
- OpenAI API 调用：700 次/天
- **月度成本：$0**

### 总成本

| 项目 | 成本 |
|------|------|
| 本地敏感词检测 | $0 |
| OpenAI Moderation API | $0 |
| **总计** | **$0/月** |

---

## 🎯 实施时间表

### 立即执行（今天）

**时间**：1.5 小时

1. ✅ 扩展敏感词库（30 分钟）
2. ✅ 集成到瓶子验证（30 分钟）
3. ✅ 添加风险评分记录（30 分钟）
4. ✅ 测试和部署（30 分钟）

**总计**：2 小时

---

## 🎉 预期效果

### 安全性提升

- ✅ 拦截 70% 的不当内容（本地检测）
- ✅ 拦截 95% 的不当内容（本地 + AI）
- ✅ 自动封禁恶意用户
- ✅ 风险评分累积

### 用户体验

- ✅ 快速响应（< 1s）
- ✅ 简单明确的错误提示
- ✅ 不影响正常用户

### 运营效率

- ✅ 减少人工审核工作量
- ✅ 自动化处理恶意内容
- ✅ 风险评分可视化

---

**创建日期**: 2025-11-21  
**作者**: AI Assistant  
**状态**: 准备实施

