# 代码质量指南

## 📋 目的

本文档定义代码质量标准和最佳实践，确保代码库的一致性和可维护性。

---

## ✅ ESLint 规则遵守

### 1. 未使用的导入和变量

**规则**: 所有导入和变量必须被使用，否则应删除。

**❌ 错误示例**:
```typescript
import { createI18n } from '~/i18n'; // 导入但未使用
import type { User } from '~/types'; // 导入但未使用

export async function handleCommand(message: TelegramMessage, env: Env): Promise<void> {
  const i18n = createI18n('zh-TW'); // 声明但未使用
  // ... 其他代码
}
```

**✅ 正确示例**:
```typescript
// 只导入实际使用的内容
import type { TelegramMessage, Env } from '~/types';

export async function handleCommand(message: TelegramMessage, env: Env): Promise<void> {
  // 不声明未使用的变量
  // ... 其他代码
}
```

**例外情况**: 如果参数必须存在但未使用（如接口要求），使用 `_` 前缀：
```typescript
export function getQuestion(index: number, _language: string = 'zh-TW'): MBTIQuestion | null {
  // language 参数预留给未来的 i18n 功能
  return MBTI_QUESTIONS[index];
}
```

---

### 2. TypeScript 类型使用

**规则**: 避免使用 `any` 类型，除非绝对必要。

#### 2.1 常见错误和修复方法

**❌ 错误 1: API 响应使用 `any`**
```typescript
const data = (await response.json()) as any;
const result = data.choices[0]?.message?.content;
```

**✅ 正确做法: 定义响应接口**
```typescript
interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}
const data = (await response.json()) as OpenAIResponse;
const result = data.choices?.[0]?.message?.content;
```

**❌ 错误 2: 回调参数使用 `any`**
```typescript
export async function handleCallback(callbackQuery: any, env: Env): Promise<void> {
  // ...
}
```

**✅ 正确做法: 使用已定义的类型**
```typescript
import type { CallbackQuery } from '~/types';

export async function handleCallback(callbackQuery: CallbackQuery, env: Env): Promise<void> {
  // ...
}
```

**❌ 错误 3: Record 使用 `any`**
```typescript
export interface SessionData {
  step?: string;
  data?: Record<string, any>;
}
```

**✅ 正确做法: 使用 `unknown` 或具体类型**
```typescript
export interface SessionData {
  step?: string;
  data?: Record<string, unknown>;
}
```

**❌ 错误 4: 类型断言使用 `any`**
```typescript
if (!MBTI_TYPES.includes(mbti as any)) {
  return { valid: false, error: 'Invalid MBTI type' };
}
```

**✅ 正确做法: 使用类型索引**
```typescript
if (!MBTI_TYPES.includes(mbti as (typeof MBTI_TYPES)[number])) {
  return { valid: false, error: 'Invalid MBTI type' };
}
```

#### 2.2 Switch Case 中的变量声明

**❌ 错误: 直接在 case 中声明变量**
```typescript
switch (action) {
  case 'action1':
    const result = await doSomething(); // ESLint 错误
    break;
}
```

**✅ 正确: 使用代码块**
```typescript
switch (action) {
  case 'action1': {
    const result = await doSomething();
    break;
  }
}
```

---

### 3. Console 语句

**规则**: 生产代码中不应有 `console.log`，使用结构化日志。

**❌ 错误示例**:
```typescript
export async function handleCommand(message: TelegramMessage, env: Env): Promise<void> {
  console.log('Received message:', message); // 不应使用
}
```

**✅ 正确示例**:
```typescript
export async function handleCommand(message: TelegramMessage, env: Env): Promise<void> {
  // 使用结构化错误处理
  try {
    // ... 处理逻辑
  } catch (error) {
    console.error('[handleCommand] Error:', error); // 错误日志可以保留
  }
}
```

**允许的 console 使用**:
- `console.error()` - 错误日志
- `console.warn()` - 警告日志
- 开发环境的调试代码（应在提交前删除）

---

### 4. Switch Case 声明

**规则**: 在 `case` 块中使用变量声明时，应使用花括号包裹。

**❌ 错误示例**:
```typescript
switch (action) {
  case 'create':
    const result = await createItem(); // 错误：未使用花括号
    break;
}
```

**✅ 正确示例**:
```typescript
switch (action) {
  case 'create': {
    const result = await createItem(); // 正确：使用花括号
    break;
  }
  case 'delete': {
    const success = await deleteItem();
    break;
  }
}
```

---

## 🔍 代码审查检查清单

### 提交前检查

在提交代码前，请确保：

- [ ] ✅ 运行 `pnpm lint` 无错误
- [ ] ✅ 运行 `pnpm typecheck` 无错误
- [ ] ✅ 运行 `pnpm vitest` 所有测试通过
- [ ] ✅ 删除所有未使用的导入
- [ ] ✅ 删除所有未使用的变量
- [ ] ✅ 删除所有调试用的 `console.log`
- [ ] ✅ 所有 `any` 类型都有充分理由
- [ ] ✅ 所有 switch case 使用花括号

### 自动修复

使用以下命令自动修复部分问题：

```bash
# 自动修复 ESLint 错误
pnpm lint:fix

# 格式化代码
pnpm format

# 检查类型
pnpm typecheck
```

---

## 📝 命名规范

### 变量命名

- **camelCase**: 变量、函数、参数
  ```typescript
  const userName = 'John';
  function getUserProfile() {}
  ```

- **PascalCase**: 类、接口、类型
  ```typescript
  interface UserProfile {}
  type MessageType = 'text' | 'image';
  ```

- **UPPER_SNAKE_CASE**: 常量
  ```typescript
  const MAX_RETRY_COUNT = 3;
  const API_BASE_URL = 'https://api.example.com';
  ```

- **_prefix**: 未使用但必须存在的参数
  ```typescript
  function handleEvent(_event: Event, data: Data) {
    // event 参数必须存在但未使用
    return processData(data);
  }
  ```

### 文件命名

- **小写 + 下划线**: 文件名
  ```
  user_profile.ts
  message_forward.ts
  mbti_test.ts
  ```

- **小写 + 连字符**: 测试文件
  ```
  user-profile.test.ts
  message-forward.test.ts
  ```

---

## 🎯 最佳实践

### 1. 导入顺序

按以下顺序组织导入：

```typescript
// 1. 类型导入
import type { Env, TelegramMessage } from '~/types';

// 2. 外部库
import { createClient } from 'external-lib';

// 3. 内部模块（按层级）
import { createDatabaseClient } from '~/db/client';
import { findUserByTelegramId } from '~/db/queries/users';
import { createTelegramService } from '~/services/telegram';
import { validateInput } from '~/domain/validation';
import { createI18n } from '~/i18n';
```

### 2. 错误处理

始终使用 try-catch 包裹可能失败的操作：

```typescript
export async function handleCommand(message: TelegramMessage, env: Env): Promise<void> {
  const db = createDatabaseClient(env);
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;

  try {
    // 主要逻辑
    const result = await processCommand(message);
    await telegram.sendMessage(chatId, result);
  } catch (error) {
    console.error('[handleCommand] Error:', error);
    await telegram.sendMessage(chatId, '❌ 發生錯誤，請稍後再試。');
  }
}
```

### 3. 类型安全

优先使用类型推断，但在公共 API 中明确声明类型：

```typescript
// ✅ 好：公共函数明确声明类型
export async function getUserProfile(userId: string): Promise<UserProfile> {
  const user = await findUser(userId); // 类型推断
  return transformToProfile(user); // 类型推断
}

// ❌ 差：内部变量不必要的类型声明
export async function getUserProfile(userId: string): Promise<UserProfile> {
  const user: User = await findUser(userId); // 不必要
  const profile: UserProfile = transformToProfile(user); // 不必要
  return profile;
}
```

### 4. 函数长度

保持函数简短且专注：

- **理想**: < 50 行
- **警告**: 50-100 行
- **需重构**: > 100 行

如果函数过长，考虑拆分为多个小函数。

---

## 🚀 持续改进

### 定期检查

每周运行完整的代码质量检查：

```bash
# 完整检查
pnpm lint
pnpm typecheck
pnpm vitest
pnpm format:check
```

### 技术债务

记录技术债务并定期清理：

1. 在代码中使用 `TODO:` 注释标记
2. 在 GitHub Issues 中跟踪
3. 每月回顾和清理

```typescript
// TODO: 添加 i18n 支持
// TODO: 优化查询性能
// TODO: 添加单元测试
```

---

## 📚 参考资源

- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [ESLint 规则](https://eslint.org/docs/rules/)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [Clean Code JavaScript](https://github.com/ryanmcdermott/clean-code-javascript)

---

## 🔄 更新记录

- **2025-01-16**: 初始版本
  - 定义 ESLint 规则遵守标准
  - 添加代码审查检查清单
  - 定义命名规范和最佳实践

---

**维护者**: 专案团队  
**最后更新**: 2025-01-16

