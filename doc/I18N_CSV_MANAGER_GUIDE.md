# i18n CSV 管理器使用指南

## 📋 概述

`scripts/i18n-csv-manager.ts` 是一个完整的 i18n CSV 导出/导入工具，使用 TypeScript 编译器 API 进行精确解析。

## ✨ 功能

### 1. 导出（Export）
从 `src/i18n/locales/zh-TW.ts` 提取所有翻译并生成/更新 CSV 文件。

**特点**：
- ✅ 使用 TypeScript 编译器 API，精确解析嵌套结构
- ✅ 自动保持现有 CSV 顺序（默认）
- ✅ 新 keys 追加到末尾
- ✅ 自动更新现有 keys 的翻译值
- ✅ 自动备份现有 CSV

### 2. 导入（Import）
从 CSV 文件读取翻译并更新 `zh-TW.ts`。

**特点**：
- ✅ 更新现有翻译值
- ✅ 保持文件结构不变
- ✅ 自动备份原文件

## 🚀 使用方法

### 导出到 CSV

```bash
# 导出并保持现有 CSV 顺序（推荐）
pnpm tsx scripts/i18n-csv-manager.ts export

# 导出但不保持顺序（完全重新生成）
pnpm tsx scripts/i18n-csv-manager.ts export --no-preserve-order
```

**输出**：
- 更新 `i18n_for_translation.csv`
- 备份文件：`i18n_for_translation.csv.backup.{timestamp}`

### 从 CSV 导入

```bash
pnpm tsx scripts/i18n-csv-manager.ts import
```

**输出**：
- 更新 `src/i18n/locales/zh-TW.ts`
- 备份文件：`src/i18n/locales/zh-TW.ts.backup.{timestamp}`

## 📊 工作流程

### 典型工作流程

1. **开发新功能**：
   ```bash
   # 在代码中添加新的 i18n keys
   # 在 zh-TW.ts 中添加翻译
   ```

2. **导出到 CSV**：
   ```bash
   pnpm tsx scripts/i18n-csv-manager.ts export
   ```

3. **翻译团队翻译**：
   - 在 CSV 中填写其他语言的翻译
   - 保持 CSV 顺序不变

4. **导入到代码**：
   ```bash
   pnpm tsx scripts/i18n-csv-manager.ts import
   ```

5. **验证**：
   ```bash
   pnpm check:i18n
   ```

## 🔧 技术细节

### 解析方法

使用 **TypeScript 编译器 API** (`typescript` 包)：
- ✅ 精确解析嵌套对象结构
- ✅ 正确处理模板字符串
- ✅ 处理变量引用（如 `${variable}`）
- ✅ 保持代码结构完整性

### CSV 格式

```
key,zh-TW,zh-CN,en,ja,ko,...
admin.addUsageError,"❌ 使用方法錯誤\n\n",,,,...
```

- 第一列：完整的 key（如 `admin.addUsageError`）
- 其他列：各语言的翻译
- 空值：留空（待翻译）

### 顺序保持

**默认行为**（`export` 命令）：
1. 读取现有 CSV
2. 提取现有 keys 的顺序
3. 新 keys 追加到末尾
4. 更新现有 keys 的翻译值

**完全重新生成**（`export --no-preserve-order`）：
- 按字母顺序重新排列所有 keys
- 不推荐使用（会打乱翻译团队的工作）

## ⚠️ 注意事项

1. **备份**：脚本会自动创建备份，但建议在重要操作前手动备份
2. **顺序**：默认保持 CSV 顺序，不要使用 `--no-preserve-order` 除非必要
3. **变量引用**：`zh-TW.ts` 中的变量引用（如 `${vipRevenue}`）会被保留
4. **验证**：导入后运行 `pnpm check:i18n` 验证

## 🐛 故障排除

### 问题：提取的翻译数量为 0

**原因**：TypeScript 编译器 API 解析失败

**解决**：
1. 检查 `zh-TW.ts` 语法是否正确
2. 运行 `pnpm typecheck` 检查类型错误
3. 查看脚本输出的错误信息

### 问题：导入后翻译没有更新

**原因**：key 路径不匹配或格式问题

**解决**：
1. 检查 CSV 中的 key 格式是否正确（如 `admin.addUsageError`）
2. 检查 `zh-TW.ts` 中对应的 key 是否存在
3. 查看脚本输出的更新数量

## 📚 相关文档

- `@doc/I18N_CSV_GENERATION_STANDARD.md` - CSV 生成标准
- `@doc/I18N_GUIDE.md` - i18n 使用指南
- `@doc/I18N_EXTRACTION_AND_REPLACEMENT_STANDARDS.md` - i18n 提取与替换规范

