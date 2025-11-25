# i18n 同步指南

## ⚠️ 重要：這是開發流程的一部分

**i18n 同步不是可選步驟，而是開發流程的必須環節！**

當你：
- ✅ 完成新功能開發
- ✅ 修復 i18n 問題
- ✅ 添加新的 i18n key
- ✅ 修改現有的 i18n key

**都必須同步到所有 34 種語言！**

## 概述

当你修复一个语言的 i18n 问题后，可以使用以下工具自动同步到所有其他语言，避免手动逐个修复。

## 可用命令

### 1. `pnpm i18n:check`
**检查所有语言的 i18n 问题**

检查内容：
- ✅ 缺失的 key（与参考语言 zh-TW 对比）
- ✅ 未翻译的占位符（`[Translation needed: ...]`, `[需要翻译: ...]`）
- ✅ 模板字符串问题（`{var || 'default'} ${var}`）
- ✅ 空值或占位符值

**使用场景**：
- 修复 i18n 问题前，先检查当前状态
- 部署前验证所有语言的一致性

**示例输出**：
```
📊 Issue Summary:
   Missing keys: 263
   Untranslated placeholders: 799
   Template literal issues: 11
   Total issues: 1073
```

### 2. `pnpm i18n:sync`
**从参考语言（zh-TW）同步缺失的 key 到所有其他语言**

功能：
- 自动检测所有语言中缺失的 key
- 将缺失的 key 添加到其他语言文件
- 使用占位符 `[需要翻译]` 标记，方便后续翻译

**使用场景**：
- 修复了 zh-TW 的一个 key 后，需要同步到其他语言
- 添加了新的 i18n key 后，需要确保所有语言都有

**示例输出**：
```
📁 zh-CN: 8 missing keys
   ✅ Added 8 keys
📁 en: 4 missing keys
   ✅ Added 4 keys
```

### 3. `pnpm i18n:fix-templates`
**修复所有语言的模板字符串问题**

修复内容：
- 移除重复的模板表达式（如 `{user.mbti_result || '未設定'} ${user.mbti_result}`）
- 清理独立的模板字符串行

**使用场景**：
- 发现模板字符串显示问题时
- 批量清理所有语言文件中的模板问题

### 4. `pnpm i18n:consistency`
**检查所有语言的一致性**

功能：
- 对比所有语言与参考语言（zh-TW）的 key 结构
- 报告缺失和多余的 key

## 推荐工作流程

### 场景 1：修复了一个语言的 i18n 问题

```bash
# 1. 修复 zh-TW 的问题
# （编辑 src/i18n/locales/zh-TW.ts）

# 2. 检查当前状态
pnpm i18n:check

# 3. 同步缺失的 key 到所有语言
pnpm i18n:sync

# 4. 再次检查确认
pnpm i18n:check

# 5. 修复模板字符串问题（如果有）
pnpm i18n:fix-templates

# 6. 翻译占位符值（手动或使用 CSV）
# 或使用 CSV 导入：pnpm i18n:import
```

### 场景 2：添加了新的 i18n key

```bash
# 1. 在 zh-TW.ts 中添加新 key
# （编辑 src/i18n/locales/zh-TW.ts）

# 2. 同步到所有语言
pnpm i18n:sync

# 3. 翻译新 key（使用 CSV 或手动）
```

### 场景 3：部署前检查

```bash
# 1. 检查所有问题
pnpm i18n:check

# 2. 如果有缺失的 key，同步它们
pnpm i18n:sync

# 3. 修复模板字符串问题
pnpm i18n:fix-templates

# 4. 最终检查
pnpm i18n:consistency
```

## 注意事项

1. **参考语言**：默认使用 `zh-TW` 作为参考语言
2. **占位符**：同步的 key 会使用 `[需要翻译]` 作为占位符，需要后续翻译
3. **CSV 导入**：可以使用 `pnpm i18n:import` 批量导入翻译
4. **模板字符串**：修复模板字符串后，需要检查代码逻辑是否正确

## 常见问题

### Q: 为什么有些 key 无法自动添加？
A: 可能是文件结构问题。脚本会报告失败的 key，可以手动添加。

### Q: 同步后如何翻译占位符？
A: 可以使用 CSV 导入（`pnpm i18n:import`）或手动编辑语言文件。

### Q: 如何确保所有语言都正确？
A: 运行 `pnpm i18n:check` 和 `pnpm i18n:consistency` 进行全面检查。

