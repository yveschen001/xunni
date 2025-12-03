# i18n 检查总结与修复结构

**最后更新**: 2025-01-15  
**检查命令**: `pnpm check:i18n`  
**脚本文件**: `scripts/check-hardcoded-chinese.ts`

## 当前检查方法

### ✅ 已实现的检查（机器检查）

`pnpm check:i18n` 使用 `scripts/check-hardcoded-chinese.ts`，包含：

1. **硬编码中文检查**
   - 扫描所有 `src/**/*.ts` 文件
   - 使用正则表达式匹配中文字符
   - 排除技术标识符、注释、console.log 等
   - 按文件分组显示问题

2. **i18n Keys 完整性检查**
   - 提取代码中所有 `i18n.t('key')` 调用的 keys
   - 提取 CSV 中的所有 keys
   - 对比找出缺失的 keys
   - 按命名空间分组显示

### ⚠️ AI 检查（需要人工或 Cursor AI 辅助）

AI 检查方法在 `doc/I18N_VERIFICATION_PLAN.md` 中定义，但**脚本中不包含 AI 检测**。这些检查需要：

1. **使用 Cursor AI** 进行代码审查
2. **人工审查** 代码和检查结果
3. **结合文档** `doc/I18N_VERIFICATION_PLAN.md` 中的 AI 检查清单

**AI 检查项**：

1. **语义检查**
   - i18n key 命名是否符合语义（如 `errors.userNotFound` 而不是 `error1`）
   - 相同含义是否使用相同 key
   - 动态内容是否正确使用参数

2. **上下文检查**
   - 错误消息是否在正确的命名空间（`errors.*`）
   - 成功消息是否在正确的命名空间（`success.*`）
   - 按钮文本是否在正确的命名空间（`buttons.*`）

3. **路由检查**
   - 路由回调是否都获取用户语言偏好
   - 路由错误处理是否都使用 i18n

4. **数据库检查**
   - 数据库读取是否正确处理 i18n keys
   - 迁移脚本是否完整

5. **网络/API 检查**
   - 外部 API 错误处理是否都使用 i18n

**如何执行 AI 检查**：
- 使用 Cursor AI 审查代码
- 参考 `doc/I18N_VERIFICATION_PLAN.md` 中的 AI 检查清单
- 人工审查检查结果

## 当前检查结果（2025-01-15）

### 1. 硬编码中文

**发现的问题**：
- **27,023 处**硬编码中文字符串（包含重复和模板字符串）
- **95+ 个文件**中有硬编码中文
- 主要分布在：
  - `src/router.ts` - 路由中的消息（约 15+ 处）
  - `src/telegram/handlers/stats.ts` - 统计消息模板
  - `src/telegram/handlers/throw_advanced.ts` - 高级筛选消息
  - `src/telegram/handlers/conversation_actions.ts` - 对话操作消息
  - `src/utils/mask.ts` - 工具函数
  - 其他 handlers 文件

**示例问题**：
- `router.ts`: 媒体消息拒绝提示、教程提示、管理员权限错误
- `stats.ts`: VIP 统计消息模板
- `throw_advanced.ts`: 筛选状态消息、血型按钮文本
- `mask.ts`: "未設定" 默认文本

### 2. 缺失的 i18n Keys

**发现的问题**：
- **262 个 keys** 在代码中使用但不在 CSV 中

**按命名空间分组**：
- `admin.*` - 14 个（管理员相关）
- `bottle.*` - 2 个（瓶子相关）
- `buttons.*` - 1 个（按钮文本）
- `catch.*` - 21 个（捡瓶子相关）
- `common.*` - 7 个（通用消息）
- 其他命名空间 - 217 个

**示例缺失的 keys**：
- `admin.banUsageError`
- `admin.banUserNotFound`
- `buttons.cancel`
- `catch.anonymousUser`
- `catch.back`
- `common.notSet`

## 修复结构

### 阶段 1: 添加缺失的 i18n Keys（优先级：高）

**目标**：将所有 262 个缺失的 keys 添加到 CSV 和 zh-TW.ts

**步骤**：
1. 从检查结果中提取所有缺失的 keys
2. 为每个 key 确定中文翻译
3. 添加到 `src/i18n/locales/zh-TW.ts`
4. 添加到 `i18n_for_translation.csv`
5. 更新 TypeScript 类型（如需要）

**预计工作量**：2-4 小时

### 阶段 2: 修复硬编码中文（优先级：高）

**目标**：将所有硬编码中文替换为 `i18n.t()` 调用

**步骤**：
1. 按文件分组修复（从问题最多的文件开始）
2. 为每个硬编码字符串创建或使用现有的 i18n key
3. 替换硬编码为 `i18n.t(key)`
4. 确保 `createI18n()` 使用正确的语言偏好
5. 运行 `pnpm check:i18n` 验证

**修复顺序**：
1. `src/router.ts` - 路由消息（约 15+ 处）
2. `src/telegram/handlers/stats.ts` - 统计消息
3. `src/telegram/handlers/throw_advanced.ts` - 高级筛选
4. `src/utils/mask.ts` - 工具函数
5. 其他文件

**预计工作量**：8-16 小时

### 阶段 3: AI 检查（优先级：中）

**目标**：使用 AI 或人工审查进行语义和上下文检查

**检查项**：
1. **语义检查**：
   - 检查 key 命名是否合理
   - 检查相同含义是否使用相同 key
   - 检查动态内容是否正确使用参数

2. **上下文检查**：
   - 检查命名空间是否正确
   - 检查错误消息是否在 `errors.*`
   - 检查成功消息是否在 `success.*`
   - 检查按钮文本是否在 `buttons.*`

3. **路由检查**：
   - 检查所有路由回调是否获取用户语言偏好
   - 检查路由错误处理是否使用 i18n

4. **数据库检查**：
   - 检查数据库读取是否正确处理 i18n keys
   - 检查迁移脚本是否完整

5. **网络/API 检查**：
   - 检查外部 API 错误处理是否使用 i18n

**预计工作量**：4-8 小时（人工审查）

## 修复建议总结

### 立即行动

1. **添加缺失的 keys**
   ```bash
   # 运行检查获取缺失的 keys 列表
   pnpm check:i18n > check_result.txt
   
   # 提取缺失的 keys
   grep "  - " check_result.txt | sed 's/    - //' > missing_keys.txt
   ```

2. **修复硬编码**
   ```bash
   # 运行检查查看硬编码问题
   pnpm check:i18n
   
   # 按文件逐个修复
   # 1. router.ts
   # 2. stats.ts
   # 3. throw_advanced.ts
   # 4. 其他文件
   ```

### 修复流程

对于每个硬编码字符串：

1. **识别字符串用途**
   - 错误消息 → `errors.*`
   - 成功消息 → `success.*`
   - 按钮文本 → `buttons.*`
   - 用户提示 → `common.*` 或相应命名空间

2. **创建或使用现有的 i18n key**
   - 检查是否已有相同含义的 key
   - 如果没有，创建新的 key（遵循命名规范）

3. **替换硬编码**
   ```typescript
   // 之前
   await telegram.sendMessage(chatId, '❌ 發生錯誤');
   
   // 之后
   await telegram.sendMessage(chatId, i18n.t('errors.systemError'));
   ```

4. **添加到文件**
   - `src/i18n/locales/zh-TW.ts` - 添加翻译
   - `i18n_for_translation.csv` - 添加 key 和翻译

5. **验证**
   ```bash
   pnpm check:i18n
   pnpm typecheck
   pnpm lint
   ```

## 检查命令总结

### 主要检查命令

```bash
# 完整检查（硬编码 + keys 完整性）
pnpm check:i18n

# 类型检查
pnpm typecheck

# Lint 检查
pnpm lint

# 自动修复 Lint
pnpm lint:fix
```

### 辅助检查命令

```bash
# 检查路由中的硬编码
pnpm check:i18n | grep "router.ts"

# 检查特定文件的硬编码
pnpm check:i18n | grep "filename.ts"

# 提取所有 i18n keys
grep -roh "i18n\.t('[^']*')" src --include="*.ts" | \
  sed "s/i18n\.t('//;s/')$//" | sort -u
```

## 检查命令总结

### 主要检查命令

```bash
# 完整检查（硬编码 + keys 完整性）
pnpm check:i18n

# 类型检查
pnpm typecheck

# Lint 检查
pnpm lint

# 自动修复 Lint
pnpm lint:fix
```

### 辅助检查命令

```bash
# 检查路由中的硬编码
pnpm check:i18n | grep "router.ts"

# 检查特定文件的硬编码
pnpm check:i18n | grep "filename.ts"

# 提取所有 i18n keys
grep -roh "i18n\.t('[^']*')" src --include="*.ts" | \
  sed "s/i18n\.t('//;s/')$//" | sort -u
```

## 参考文档

- `@doc/I18N_GUIDE.md` - i18n 使用指南
- `@doc/I18N_EXTRACTION_AND_REPLACEMENT_STANDARDS.md` - i18n 规范
- `@doc/I18N_VERIFICATION_PLAN.md` - 完整检查计划（包含 AI 检查方法）

## 下一步行动

### 立即行动

1. ✅ **运行检查**：`pnpm check:i18n`（已完成）
2. ⏳ **添加缺失的 keys**：262 个 keys 需要添加到 CSV
3. ⏳ **修复硬编码**：按文件逐个修复（从 router.ts 开始）
4. ⏳ **AI 检查**：使用 Cursor AI 审查代码，参考 `doc/I18N_VERIFICATION_PLAN.md`

### 修复优先级

1. **优先级 1**：添加缺失的 262 个 keys 到 CSV（2-4 小时）
2. **优先级 2**：修复 `router.ts` 中的硬编码（1-2 小时）
3. **优先级 3**：修复其他文件的硬编码（8-16 小时）
4. **优先级 4**：AI 检查（使用 Cursor AI 辅助，4-8 小时）

