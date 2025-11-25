# i18n 翻译工作流程

**日期**: 2025-01-18  
**目的**: 指导翻译团队如何使用 CSV 进行翻译和导入

---

## 📋 工作流程概览

```
1. 导出 CSV → 2. 在 Google Sheets + OpenAI 翻译 → 3. 导入翻译好的 CSV → 4. 检查进度
```

---

## 🔄 完整工作流程

### Step 1: 检查当前进度

在开始翻译前，先检查当前进度：

```bash
pnpm i18n:progress
```

这会显示：
- 每种语言的翻译进度
- 缺失翻译的 keys
- 总体统计

### Step 2: 导出 CSV（如果需要）

CSV 文件位置：`i18n_for_translation.csv`

如果需要在 Google Sheets 中编辑，可以直接打开这个文件。

**注意**：
- CSV 格式：`key,zh-TW,zh-CN,en,ja,ko,...`（34 种语言）
- `zh-TW` 列是源语言（繁体中文），不要修改
- 其他语言列为空，等待翻译

### Step 3: 在 Google Sheets + OpenAI 翻译

1. **上传 CSV 到 Google Sheets**
   - 打开 Google Sheets
   - 文件 → 导入 → 上传 `i18n_for_translation.csv`

2. **使用 OpenAI 翻译**
   - 可以使用 Google Sheets 的插件或脚本
   - 或者使用 OpenAI API 批量翻译

3. **翻译注意事项**：
   - ✅ 保持变量：`{variable}` 或 `${variable}` 必须保留
   - ✅ 保持格式：`\n` 换行符必须保留
   - ✅ 保持 emoji：源语言中的 emoji 应该保留
   - ✅ 保持结构：不要改变文本结构

4. **导出翻译好的 CSV**
   - 文件 → 下载 → CSV 格式
   - 保存为 `translated.csv`（或任何名称）

### Step 4: 导入翻译好的 CSV

```bash
# 普通导入（不更新源语言）
pnpm i18n:import translated.csv

# 导入并更新源语言（如果源语言有变更）
pnpm i18n:import translated.csv --update-source
```

**功能**：
- ✅ 自动更新 `i18n_for_translation.csv`
- ✅ 检查格式和变量
- ✅ 自动修复常见错误
- ✅ 生成进度报告
- ✅ 创建备份文件
- ✅ 可选择是否更新源语言 (zh-TW)

**选项说明**：
- **默认行为**：不更新源语言 (zh-TW)，只更新其他语言的翻译
- **`--update-source`**：允许更新源语言 (zh-TW)，适用于源语言有修正的情况

**示例**：
```bash
# 只更新翻译，不更新源语言
pnpm i18n:import translated.csv

# 更新翻译和源语言（如果源语言有修正）
pnpm i18n:import translated.csv --update-source

# 使用完整路径
pnpm i18n:import /path/to/translated.csv --update-source
```

### Step 5: 检查导入结果

导入完成后，脚本会显示：
- 📊 更新统计
- 📈 翻译进度
- ⚠️ 发现的错误（如果有）
- ✅ 自动修复的错误

### Step 6: 再次检查进度

```bash
pnpm i18n:progress
```

确认翻译进度已更新。

---

## 🔍 格式检查和自动修复

导入脚本会自动检查并修复以下问题：

### 1. 变量占位符检查

**问题**：源语言有 `{name}`，但翻译中缺失

**自动修复**：补充缺失的变量

**示例**：
```
源语言: "Hello {name}"
翻译: "Hola"  ❌
修复后: "Hola {name}"  ✅
```

### 2. 模板变量检查

**问题**：源语言有 `${count}`，但翻译中缺失

**自动修复**：补充缺失的模板变量

**示例**：
```
源语言: "Count: ${count}"
翻译: "Contador:"  ❌
修复后: "Contador: ${count}"  ✅
```

### 3. 错误报告

如果发现无法自动修复的错误，会在报告中列出：
- Key 名称
- 语言
- 错误描述
- 原始值
- 修复后的值（如果已修复）

---

## 📊 进度追踪

### 查看翻译进度

```bash
pnpm i18n:progress
```

**输出示例**：
```
📈 翻译进度:

   zh-TW    : ████████████████████████████████████████████████████ 100% (3742/3742)
   zh-CN    : ████████████████████████████████████████████████████ 100% (3742/3742)
   en       : ████████████████████████████████████████████████████ 100% (3742/3742)
   ja       : ████████████████████████████████████████████████████ 100% (3742/3742)
   ...
```

### 导出缺失翻译列表

```bash
pnpm i18n:progress --export-missing
```

这会生成 `missing-translations.csv`，包含所有缺失的翻译。

---

## ⚠️ 注意事项

### 1. 备份

导入脚本会自动创建备份：
- 备份文件：`i18n_for_translation.csv.backup-YYYY-MM-DDTHH-MM-SS`
- 每次导入前都会创建新备份

### 2. CSV 格式

- **必须包含 header**：`key,zh-TW,zh-CN,en,...`
- **key 列必须匹配**：导入时会根据 key 匹配记录
- **语言列名称必须正确**：必须使用标准的语言代码（如 `en`, `ja`, `ko`）

### 3. 源语言更新

- **默认行为**：`zh-TW` 列不会被覆盖（源语言保护）
- **使用 `--update-source` 选项**：允许更新源语言 (zh-TW)
- **使用场景**：当源语言有修正或改进时使用
- **警告**：更新源语言会影响所有翻译，请谨慎使用

### 4. 新增 Keys

如果翻译 CSV 中有新的 keys（现有 CSV 中没有的），会自动追加到末尾。

---

## 🎯 最佳实践

### 1. 分批翻译

建议分批翻译，每次翻译一部分语言：
- 第一批：`zh-CN`, `en`（最常用）
- 第二批：`ja`, `ko`（亚洲语言）
- 第三批：其他语言

### 2. 定期导入

不要等到全部翻译完才导入，建议：
- 每完成一种语言就导入一次
- 或者每完成 100-200 个 keys 就导入一次

### 3. 检查错误

每次导入后，检查错误报告：
- 如果有错误，修复后重新导入
- 确保所有变量都正确保留

### 4. 验证功能

导入后，运行测试确保功能正常：
```bash
pnpm test
pnpm smoke-test
```

---

## 📝 命令速查

```bash
# 检查翻译进度
pnpm i18n:progress

# 导入翻译好的 CSV
pnpm i18n:import translated.csv

# 导出缺失翻译列表
pnpm i18n:progress --export-missing

# 检查硬编码中文（验证 i18n 完整性）
pnpm check:i18n
```

---

## 🔧 故障排除

### 问题 1: 导入失败

**错误**: `文件不存在`

**解决**: 检查 CSV 文件路径是否正确

### 问题 2: 格式错误

**错误**: `变量数量不匹配`

**解决**: 
1. 检查翻译中是否保留了所有变量
2. 查看错误报告，手动修复后重新导入

### 问题 3: 进度没有更新

**原因**: 可能 CSV 格式不正确

**解决**:
1. 检查 CSV header 是否正确
2. 检查语言列名称是否正确
3. 检查 key 列是否匹配

---

## 📄 生成的文件

### 导入时生成

- `i18n_for_translation.csv.backup-*` - 备份文件
- `import-translation-report.json` - 导入报告

### 进度检查时生成

- `translation-progress-report.json` - 进度报告
- `missing-translations.csv` - 缺失翻译列表（使用 `--export-missing` 时）

---

**最后更新**: 2025-01-18

