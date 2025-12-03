# i18n Key 保护机制

## 概述

为了防止再次出现 CSV key 丢失导致注册流程显示占位符的问题，我们建立了多层保护机制。

## 保护机制

### 1. 导入前检查 (`scripts/protect-csv-keys.ts`)

在运行 `i18n-import-from-csv-v2.ts` 前，会自动检查所有关键 key 是否存在。

**关键 key 列表**（56 个）：
- 注册流程核心 key（onboarding.*）
- 昵称相关 key（nickname.*）
- 性别相关 key（onboarding.gender.*, warnings.gender, success.message8, etc.）
- 生日相关 key
- MBTI 相关 key
- 反诈骗相关 key
- 条款相关 key
- 错误处理 key

**使用方法**：
```bash
# 手动检查
pnpm tsx scripts/protect-csv-keys.ts

# 导入脚本会自动调用（已集成到 i18n-import-from-csv-v2.ts）
pnpm tsx scripts/i18n-import-from-csv-v2.ts
```

### 2. 增强的 Smoke Test

#### 2.1 关键注册流程 key 检查 (`scripts/enhanced-onboarding-test.ts`)

检查所有注册流程中使用的关键 key（70+ 个），确保没有占位符。

**使用方法**：
```bash
pnpm tsx scripts/enhanced-onboarding-test.ts
```

#### 2.2 端到端测试增强 (`scripts/test-onboarding-e2e.ts`)

在 E2E 测试中增加了占位符检测模式，检查所有可能的占位符格式：
- `[需要翻译]`
- `[Translation needed]`
- `[onboarding.*]`
- `[nickname.*]`
- `[warnings.*]`
- `[success.*]`
- `[common.*]`
- `[errors.*]`

**使用方法**：
```bash
pnpm tsx scripts/test-onboarding-e2e.ts
```

#### 2.3 Smoke Test 集成

`scripts/smoke-test.ts` 现在包含：
1. 关键注册流程 key 检查（不跳过失败）
2. 所有 i18n key 检查（不跳过失败）

**使用方法**：
```bash
pnpm test:smoke
```

### 3. 全面功能检查 (`scripts/check-all-i18n-keys.ts`)

检查所有代码中使用的 i18n key 是否都在 CSV 中。

**使用方法**：
```bash
pnpm tsx scripts/check-all-i18n-keys.ts
```

### 4. 导入前检查脚本 (`scripts/pre-import-check.sh`)

Shell 脚本，可以在导入前手动运行。

**使用方法**：
```bash
./scripts/pre-import-check.sh
```

## 工作流程

### 正常导入流程

1. **修改 CSV** → 添加/修改翻译
2. **运行保护检查** → `pnpm tsx scripts/protect-csv-keys.ts`
3. **导入** → `pnpm tsx scripts/i18n-import-from-csv-v2.ts`（会自动运行保护检查）
4. **验证** → `pnpm tsx scripts/enhanced-onboarding-test.ts`
5. **全面检查** → `pnpm tsx scripts/check-all-i18n-keys.ts`
6. **运行测试** → `pnpm test:smoke`

### 恢复丢失的 key

如果发现 key 丢失：

1. **检查 HEAD 版本**：
   ```bash
   git show HEAD:i18n_for_translation.csv | grep "^key_name"
   ```

2. **恢复 key**：
   ```bash
   pnpm tsx scripts/restore-missing-csv-keys.ts
   ```

3. **重新导入**：
   ```bash
   pnpm tsx scripts/i18n-import-from-csv-v2.ts
   ```

## 关键 key 列表

所有关键 key 定义在 `scripts/protect-csv-keys.ts` 的 `CRITICAL_KEYS` 数组中。

## 注意事项

1. **不要跳过保护检查**：即使测试失败，也不要跳过保护检查
2. **定期运行检查**：在每次修改 CSV 后都要运行保护检查
3. **保持 CSV 完整性**：确保 CSV 中的 key 数量不会突然减少
4. **HEAD 版本对比**：保护机制会自动对比 HEAD 版本，发现丢失的 key

## 故障排除

### 保护检查失败

如果保护检查失败：
1. 检查缺失的 key 列表
2. 从 HEAD 版本恢复这些 key
3. 重新运行保护检查

### 导入失败

如果导入失败：
1. 检查 CSV 格式是否正确
2. 检查是否有语法错误
3. 运行 `pnpm tsx scripts/protect-csv-keys.ts` 查看详细信息

### 占位符显示

如果仍然显示占位符：
1. 运行 `pnpm tsx scripts/enhanced-onboarding-test.ts` 检查所有 key
2. 运行 `pnpm tsx scripts/check-all-i18n-keys.ts` 检查代码中使用的 key
3. 确认已重新导入：`pnpm tsx scripts/i18n-import-from-csv-v2.ts`

