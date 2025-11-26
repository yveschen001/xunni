# 自动测试和修复 i18n 问题

## 概述

现在有了完整的自动测试和修复系统，可以：
1. **自动检测**所有占位符和错误使用
2. **自动修复**错误的 key 使用
3. **自动验证**修复结果
4. **集成到 Smoke Test**中

## 使用方法

### 快速测试和修复

```bash
# 一键测试并修复所有 i18n 问题
pnpm test:i18n-auto
```

这个命令会：
1. 扫描所有代码中使用的 key
2. 检测占位符和错误使用
3. 自动修复错误的 key 使用（如 `warnings.settings` → `onboarding.genderWarning`）
4. 重新导入 i18n
5. 验证所有关键 key

### 完整测试

```bash
# 测试所有注册流程 key
pnpm test:i18n-full
```

### 端到端测试（包含占位符检查）

```bash
# 真正模拟用户操作，检查占位符
pnpm test:onboarding-e2e
```

这个测试会：
- 真正发送请求到 staging 环境
- 模拟用户点击按钮和输入文本
- 检查所有响应中是否有占位符
- 自动报告问题

### Smoke Test（已集成）

```bash
# 运行完整的 smoke test（包含 i18n 检查）
pnpm smoke-test
```

现在 smoke test 包含：
1. 关键注册流程 key 检查
2. 自动检测和修复占位符
3. 所有 i18n key 存在性检查
4. Key 使用正确性检查

## 自动修复功能

### 1. 错误 Key 使用修复

自动修复脚本会检测并修复：
- `warnings.settings` 用于性别相关 → 改为 `onboarding.genderWarning`
- 其他错误的 key 使用

### 2. 占位符检测

自动检测所有占位符格式：
- `[需要翻译]`
- `[Translation needed]`
- `[onboarding.*]`
- `[nickname.*]`
- `[warnings.*]`
- `[success.*]`
- `[common.*]`
- `[errors.*]`

### 3. 缺失 Key 恢复

如果发现缺失的 key，会：
1. 从 CSV 中查找
2. 从 git 历史中查找
3. 提示需要手动添加

## 工作流程

### 开发时

```bash
# 1. 修改代码后
pnpm test:i18n-auto

# 2. 如果发现问题，会自动修复
# 3. 重新导入 i18n
# 4. 验证修复
```

### 提交前

Git pre-commit hook 会自动运行：
1. 关键 key 检查
2. Key 使用检查
3. 所有 key 存在性检查

### CI/CD

在 CI/CD 流程中运行：
```bash
pnpm smoke-test
```

## 脚本说明

### `scripts/auto-test-and-fix-i18n.ts`

主要的自动测试和修复脚本：
- 运行自动修复
- 重新导入
- 验证关键 key
- 检查 key 使用

### `scripts/auto-fix-i18n-placeholders.ts`

自动检测和修复占位符：
- 扫描所有代码中使用的 key
- 检查占位符和错误使用
- 自动修复错误的 key 使用
- 尝试从 CSV/git 历史恢复缺失的 key

### `scripts/test-onboarding-full-auto.ts`

完整的注册流程 key 测试：
- 测试所有注册流程 key
- 检测占位符
- 自动修复
- 验证修复

### `scripts/test-onboarding-with-placeholder-check.ts`

端到端测试（包含占位符检查）：
- 真正模拟用户操作
- 检查所有响应中的占位符
- 报告问题

## 注意事项

1. **自动修复会修改代码**：修复错误的 key 使用时会直接修改源文件
2. **需要重新导入**：修复后需要运行 `pnpm tsx scripts/i18n-import-from-csv-v2.ts`
3. **验证修复**：修复后会自动验证，确保问题已解决

## 故障排除

### 自动修复失败

如果自动修复失败：
1. 检查错误信息
2. 手动修复问题
3. 重新运行测试

### 占位符仍然存在

如果占位符仍然存在：
1. 检查 CSV 中是否有对应的 key
2. 检查 key 的值是否是占位符
3. 从 git 历史恢复正确的值
4. 重新导入

### Key 使用错误

如果 key 使用错误：
1. 查看 `doc/I18N_KEY_USAGE_RULES.md` 了解正确用法
2. 运行 `pnpm tsx scripts/verify-i18n-key-usage.ts` 检查
3. 手动修复

