# 安全的 i18n 迁移方案

## 📅 关键时间点

### 纯中文繁体版本（干净版本）
- **Commit**: `5f021ab`
- **时间**: 2025-11-22 14:32
- **描述**: "fix: 優化 ForceReply UX - 移除 # 避免觸發搜索模式"
- **状态**: ✅ 确认为纯中文繁体，无 i18n

### 开始 i18n 的版本
- **Commit**: `257d11c`
- **时间**: 2025-11-22 23:35
- **描述**: "feat(i18n): 导入 4 种语言翻译"
- **状态**: ❌ 已经开始 i18n，但有问题

### 当前版本
- **Commit**: `e29648b`
- **时间**: 2025-11-23 00:07
- **描述**: "fix(i18n): 修复菜单 i18n 并缩短英文按钮文字"
- **状态**: ⚠️ i18n 不完整，有很多问题

## 🎯 安全迁移步骤

### Step 1: 备份当前工作（重要！）

```bash
# 1. 创建当前状态的备份分支
git branch backup-before-i18n-migration-$(date +%Y%m%d-%H%M)

# 2. 确认备份成功
git branch | grep backup
```

### Step 2: 恢复到纯中文版本

```bash
# 1. 创建新的工作分支
git checkout -b i18n-migration-clean

# 2. 重置到纯中文版本
git reset --hard 5f021ab

# 3. 确认当前状态
git log --oneline -1
# 应该显示: 5f021ab fix: 優化 ForceReply UX
```

### Step 3: 使用 AST 提取所有中文

```bash
# 1. 运行 AST 提取工具
npx tsx scripts/auto-i18n-migration.ts

# 输出:
# - i18n_extracted.csv (所有提取的中文字符串)
# - I18N_MIGRATION_REPORT.md (报告)
```

### Step 4: 检查提取结果

```bash
# 1. 查看提取的字符串数量
wc -l i18n_extracted.csv

# 2. 查看报告
cat I18N_MIGRATION_REPORT.md
```

### Step 5: 翻译

```bash
# 将 i18n_extracted.csv 发送给翻译
# 或使用 AI 工具翻译
```

### Step 6: 导入翻译

```bash
# 导入翻译后的 CSV
npx tsx scripts/i18n-import-from-csv.ts
```

### Step 7: 应用替换

```bash
# 自动替换所有硬编码字符串
npx tsx scripts/apply-i18n-final.ts
```

### Step 8: 测试

```bash
# Lint 检查
pnpm lint

# 测试
pnpm test

# 手动测试所有功能
```

### Step 9: 提交

```bash
# 提交完整的 i18n 迁移
git add .
git commit -m "feat(i18n): 完整的 i18n 迁移 - 使用 AST 自动化提取"
```

## ⚠️ 重要注意事项

### 1. 不要丢失现有功能

在恢复到 `5f021ab` 之前，确保：
- ✅ 所有重要的功能都已经在那个版本中
- ✅ 没有在之后的 commits 中添加新功能
- ✅ 如果有新功能，需要先 cherry-pick 到新分支

### 2. 检查是否有新功能

```bash
# 查看 5f021ab 之后的所有 commits
git log 5f021ab..HEAD --oneline

# 如果有重要功能，需要保留
```

### 3. 保留重要的 commits

如果 `5f021ab` 之后有重要功能，使用 cherry-pick：

```bash
# 1. 恢复到纯中文版本
git reset --hard 5f021ab

# 2. Cherry-pick 重要的 commits（跳过 i18n 相关的）
git cherry-pick <commit-hash>
```

## 📊 预期结果

### 提取结果
- **文件数**: ~44 个
- **字符串数**: ~1500-2000 个
- **唯一 keys**: ~1000-1500 个

### 时间估算
- 提取: 5 分钟
- 翻译: 2-4 小时（取决于方式）
- 导入: 5 分钟
- 替换: 10 分钟
- 测试: 1-2 小时
- **总计**: 4-7 小时

## 🔄 回滚方案

如果出现问题，可以随时回滚：

```bash
# 回到备份分支
git checkout backup-before-i18n-migration-YYYYMMDD-HHMM

# 或者回到当前的 main
git checkout main
git reset --hard e29648b
```

## ✅ 检查清单

在执行前，确认：
- [ ] 已创建备份分支
- [ ] 已确认 5f021ab 是纯中文版本
- [ ] 已确认没有重要功能在 5f021ab 之后
- [ ] 已准备好翻译工具/服务
- [ ] 已通知团队（如果有）

## 🚀 执行

准备好后，告诉我：
1. 是否要执行 Step 1-2（备份并恢复到纯中文版本）
2. 或者你想先检查 5f021ab 之后是否有重要功能

---

**创建时间**: 2025-01-22
**最后更新**: 2025-01-22
