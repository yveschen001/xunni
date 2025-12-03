# Domain 层 i18n 重构计划

## 问题分析

### 当前状态
- Domain 层（25 个文件）包含大量硬编码中文
- 主要类型：
  1. **错误消息**（validation errors）- 如 `bottle.ts` 中的 "瓶子內容不能為空"
  2. **显示文本**（display text）- 如 `blood_type.ts` 中的 "未設定"、"A 型"
  3. **按钮文本**（button text）- 如 `ad_prompt.ts` 中的 "看廣告獲取更多瓶子"
  4. **状态消息**（status messages）- 如 `ad_reward.ts` 中的 "VIP 用戶無需觀看廣告"

### 架构原则冲突
- Domain 层应该是**纯函数**，不依赖外部服务（包括 i18n）
- 但错误消息和显示文本需要国际化

## 重构策略

### 方案选择：**错误代码 + i18n 映射**

Domain 层返回**错误代码**（error codes），Handlers 层负责翻译。

**优点**：
- ✅ 保持 Domain 层的纯净性（纯函数）
- ✅ 符合架构设计原则
- ✅ 更容易测试
- ✅ 错误代码可以复用

**缺点**：
- ⚠️ 需要在 Handlers 层添加翻译逻辑
- ⚠️ 需要维护错误代码到 i18n key 的映射

### 实施步骤

#### Phase 1: 定义错误代码规范
```typescript
// src/domain/errors.ts
export const DOMAIN_ERROR_CODES = {
  BOTTLE_EMPTY: 'bottle.empty',
  BOTTLE_TOO_SHORT: 'bottle.tooShort',
  BOTTLE_TOO_LONG: 'bottle.tooLong',
  BOTTLE_CONTAINS_URL: 'bottle.containsUrl',
  BOTTLE_INAPPROPRIATE: 'bottle.inappropriate',
  // ...
} as const;
```

#### Phase 2: 重构 Domain 层函数
```typescript
// Before
export function validateBottleContent(content: string): {
  valid: boolean;
  error?: string;
} {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: '瓶子內容不能為空' };
  }
  // ...
}

// After
export function validateBottleContent(content: string): {
  valid: boolean;
  errorCode?: string;
  errorParams?: Record<string, any>;
} {
  if (!content || content.trim().length === 0) {
    return { valid: false, errorCode: DOMAIN_ERROR_CODES.BOTTLE_EMPTY };
  }
  // ...
}
```

#### Phase 3: 在 Handlers 层添加翻译
```typescript
// src/telegram/handlers/throw.ts
const result = validateBottleContent(content);
if (!result.valid) {
  const errorMessage = i18n.t(result.errorCode, result.errorParams);
  await telegram.sendMessage(chatId, errorMessage);
  return;
}
```

#### Phase 4: 处理显示文本
对于显示文本（如 `blood_type.ts`），有两种方案：

**方案 A**：Domain 层返回 key，Handlers 层翻译
```typescript
// Domain 层
export function getBloodTypeDisplay(bloodType: BloodType | null): string {
  if (!bloodType) {
    return 'common.notSet'; // 返回 i18n key
  }
  return `common.bloodType${bloodType}`; // 返回 i18n key
}

// Handlers 层
const displayText = i18n.t(getBloodTypeDisplay(bloodType));
```

**方案 B**：Domain 层接受 i18n 实例（可选参数）
```typescript
// Domain 层
export function getBloodTypeDisplay(
  bloodType: BloodType | null,
  i18n?: any
): string {
  if (!bloodType) {
    return i18n?.t('common.notSet') || '未設定';
  }
  return i18n?.t(`common.bloodType${bloodType}`) || `🩸 ${bloodType} 型`;
}
```

**推荐方案 B**，因为：
- 保持向后兼容（i18n 是可选参数）
- 更灵活（可以传入 i18n 或使用默认值）

## 文件优先级

### 高优先级（用户可见文本）
1. `src/domain/bottle.ts` - 瓶子验证错误
2. `src/domain/ad_prompt.ts` - 广告提示按钮文本
3. `src/domain/blood_type.ts` - 血型显示文本
4. `src/domain/ad_reward.ts` - 广告奖励状态消息

### 中优先级（内部使用）
5. `src/domain/broadcast.ts` - 广播验证错误
6. `src/domain/conversation_history.ts` - 对话历史显示
7. `src/domain/draft.ts` - 草稿显示文本

### 低优先级（技术文本）
8. `src/domain/ad_provider.ts` - 广告提供商状态（管理员可见）
9. `src/domain/broadcast_filters.ts` - 过滤器错误（管理员可见）
10. `src/domain/maintenance.ts` - 维护状态（管理员可见）

## 实施建议

### 选项 1：渐进式重构（推荐）
- 按优先级逐个文件重构
- 保持现有功能正常
- 每个文件重构后立即测试

### 选项 2：批量重构
- 一次性重构所有 Domain 层文件
- 风险较高，但更彻底

**建议采用选项 1**，因为：
- 风险可控
- 可以逐步验证
- 不影响现有功能

## 时间估算

- Phase 1（定义错误代码）：1 小时
- Phase 2（重构 Domain 层）：8-10 小时（25 个文件）
- Phase 3（更新 Handlers 层）：4-6 小时
- Phase 4（测试和验证）：2-3 小时

**总计**：15-20 小时

## 下一步

1. 确认重构策略
2. 开始 Phase 1：定义错误代码规范
3. 按优先级逐个文件重构

