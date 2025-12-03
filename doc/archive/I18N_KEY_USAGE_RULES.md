# i18n Key 使用规则

## 问题根源

今天发现代码中使用了错误的 key：`warnings.settings` 被用于性别确认，但它的实际用途是 MBTI 显示。

## 为什么会发生？

1. **Key 命名不够明确**：`warnings.settings` 这个名字太通用了
2. **没有使用规则文档**：开发者不知道每个 key 的正确用途
3. **保护机制不完整**：只检查 key 是否存在，不检查使用是否正确
4. **没有自动化检查**：代码审查时没有自动检查 key 使用

## Key 使用规则

### ⚠️ 禁止混用的 Key

| Key | 正确用途 | 错误用途 | 应该使用 |
|-----|---------|---------|---------|
| `warnings.settings` | MBTI 显示 (`bottle.mbti_result`) | 性别确认 | `onboarding.genderWarning` |
| `onboarding.genderWarning` | 性别确认/选择 | MBTI 显示 | `warnings.settings` |

### 正确的 Key 映射

#### 性别相关
- **性别选择提示**：`onboarding.genderWarning` 或 `nickname.genderHint`
- **性别确认警告**：`onboarding.genderWarning`
- **性别显示**：`common.male` / `common.female`

#### MBTI 相关
- **MBTI 显示**：`warnings.settings` (用于 `bottle.mbti_result`)
- **MBTI 设置提示**：其他专门的 key

#### 生日相关
- **生日确认警告**：`warnings.birthday`
- **生日显示**：其他专门的 key

## 保护机制

### 1. 自动化检查

运行 `scripts/verify-i18n-key-usage.ts` 检查 key 使用是否正确：

```bash
pnpm tsx scripts/verify-i18n-key-usage.ts
```

### 2. Pre-commit Hook

在提交前自动检查（需要设置 git hook）：

```bash
# 设置 pre-commit hook
ln -s ../../scripts/pre-commit-i18n-check.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### 3. CI/CD 检查

在 CI/CD 流程中添加检查步骤。

## 如何避免再次发生？

### 开发时

1. **查看文档**：使用 key 前先查看此文档
2. **运行检查**：修改代码后运行 `verify-i18n-key-usage.ts`
3. **代码审查**：审查时特别注意 i18n key 的使用

### 代码审查清单

- [ ] 使用的 key 名称是否明确？
- [ ] key 的用途是否与上下文匹配？
- [ ] 是否使用了错误的 key（如 `warnings.settings` 用于性别）？
- [ ] 是否有更合适的 key？

### 添加新 Key 时

1. **命名要明确**：避免使用 `settings`、`warning` 等通用名称
2. **用途要单一**：一个 key 只用于一个明确的用途
3. **更新文档**：在 `KEY_USAGE_RULES` 中添加规则
4. **运行检查**：确保新 key 不会与现有 key 混淆

## 修复历史

- **2025-01-15**：发现 `warnings.settings` 被错误用于性别确认
- **修复**：改为使用 `onboarding.genderWarning`
- **预防**：添加 `verify-i18n-key-usage.ts` 检查脚本

