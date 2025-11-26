# i18n Key 错误使用问题根源分析

## 问题描述

2025-01-15 发现代码中使用了错误的 i18n key：
- `warnings.settings` 被用于性别确认，但它的实际用途是 MBTI 显示
- 导致注册流程显示占位符 `[warnings.settings]`

## 根本原因

### 1. 历史原因（从 Git 历史分析）

在 commit `0a01fe9` (fix: 修复语言选择菜单的硬编码问题，全部使用 i18n) 中：

**之前的代码（硬编码）：**
```typescript
`✅ 你選擇了：${gender === 'male' ? '👨 男性' : '👩 女性'}\n\n` +
`⚠️ 再次提醒：性別設定後將**永遠不能修改**！\n\n` +
`請確認：`
```

**迁移后的代码（错误的 key）：**
```typescript
i18n.t('success.message8', { gender }) +
'\n\n' +
i18n.t('warnings.settings') +  // ❌ 错误！
'\n\n' +
i18n.t('common.confirm7'),
```

### 2. 为什么会选错 key？

1. **Key 命名不够明确**
   - `warnings.settings` 这个名字太通用了
   - 开发者可能搜索 "warning" 或 "settings" 相关的 key
   - 找到了 `warnings.settings`，但没有仔细检查它的实际用途

2. **没有使用规则文档**
   - 开发者不知道每个 key 的正确用途
   - 没有文档说明哪些 key 应该用于哪些场景

3. **保护机制不完整**
   - 只检查 key 是否存在（`protect-csv-keys.ts`）
   - 不检查 key 使用是否正确
   - 不检查 key 是否在正确的上下文中使用

4. **没有自动化检查**
   - 代码审查时没有自动检查 key 使用
   - 没有 pre-commit hook 检查
   - 没有 CI/CD 检查

### 3. 为什么保护机制没有发现？

**现有的保护机制：**
- ✅ `protect-csv-keys.ts` - 检查关键 key 是否存在
- ✅ `check-all-i18n-keys.ts` - 检查所有 key 是否在 CSV 中
- ✅ `enhanced-onboarding-test.ts` - 检查 key 是否存在

**缺失的保护机制：**
- ❌ 检查 key 使用是否正确
- ❌ 检查 key 是否在正确的上下文中使用
- ❌ 检查 key 的语义是否匹配

## 解决方案

### 1. 立即修复 ✅

- 修复了代码中的错误 key
- `warnings.settings` → `onboarding.genderWarning`

### 2. 新增保护机制 ✅

#### 2.1 Key 使用规则检查 (`scripts/verify-i18n-key-usage.ts`)

检查 key 是否在正确的上下文中使用：

```bash
pnpm tsx scripts/verify-i18n-key-usage.ts
```

**规则：**
- `warnings.settings` - 只能用于 MBTI 相关上下文，禁止用于性别相关
- `onboarding.genderWarning` - 只能用于性别相关上下文，禁止用于 MBTI 相关

#### 2.2 Pre-commit Hook (`scripts/pre-commit-i18n-check.sh`)

在提交前自动检查：
1. 关键 key 是否存在
2. Key 使用是否正确
3. 所有 key 是否都在 CSV 中

#### 2.3 使用规则文档 (`doc/I18N_KEY_USAGE_RULES.md`)

记录每个 key 的正确用途和禁止用途。

### 3. 长期改进建议

#### 3.1 Key 命名规范

**问题：** `warnings.settings` 太通用了

**建议：**
- 使用更具体的名称，如 `warnings.mbtiDisplay` 而不是 `warnings.settings`
- 或者使用命名空间，如 `mbti.displayWarning` 而不是 `warnings.settings`

#### 3.2 代码审查清单

在代码审查时检查：
- [ ] 使用的 key 名称是否明确？
- [ ] key 的用途是否与上下文匹配？
- [ ] 是否使用了错误的 key？
- [ ] 是否有更合适的 key？

#### 3.3 CI/CD 集成

在 CI/CD 流程中添加：
```yaml
- name: Check i18n key usage
  run: pnpm tsx scripts/verify-i18n-key-usage.ts
```

## 如何避免再次发生？

### 开发时

1. **查看文档**：使用 key 前先查看 `doc/I18N_KEY_USAGE_RULES.md`
2. **运行检查**：修改代码后运行 `verify-i18n-key-usage.ts`
3. **代码审查**：审查时特别注意 i18n key 的使用

### 添加新 Key 时

1. **命名要明确**：避免使用 `settings`、`warning` 等通用名称
2. **用途要单一**：一个 key 只用于一个明确的用途
3. **更新文档**：在 `KEY_USAGE_RULES` 中添加规则
4. **运行检查**：确保新 key 不会与现有 key 混淆

### 设置 Git Hook

```bash
# 设置 pre-commit hook
ln -s ../../scripts/pre-commit-i18n-check.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

## 总结

**问题根源：**
1. i18n 迁移时选错了 key（`warnings.settings` 用于性别）
2. Key 命名不够明确（`warnings.settings` 太通用）
3. 保护机制不完整（只检查存在，不检查使用）

**解决方案：**
1. ✅ 修复了代码中的错误
2. ✅ 新增了 key 使用规则检查
3. ✅ 创建了使用规则文档
4. ✅ 创建了 pre-commit hook

**下一步：**
1. 设置 git hook 自动检查
2. 考虑重构 key 命名（更明确的名称）
3. 在 CI/CD 中添加检查

