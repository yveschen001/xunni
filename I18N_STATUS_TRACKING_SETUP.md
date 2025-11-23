# i18n 状态跟踪机制设置完成报告

**完成时间**: 2025-01-23  
**状态**: ✅ 已完成

---

## ✅ 完成的工作

### 1. 为现有提取结果添加 status 字段

**脚本**: `scripts/add-status-to-extraction.ts`

**功能**:
- ✅ 分析现有提取结果（`i18n_complete_final.json`）
- ✅ 检查代码中是否已替换（通过检查 `i18n.t()` 调用）
- ✅ 为每个提取内容添加 `status` 字段
- ✅ 加载 key 映射（`i18n_keys_mapping_fixed.json`）

**输出文件**:
- `i18n_complete_final_with_status.json` - 带状态的提取结果
- `i18n_replacement_status.json` - 替换状态文件

---

## 📊 当前状态分析

### 提取结果统计

| 状态 | 数量 | 百分比 |
|------|------|--------|
| **extracted** (已提取但未替换) | 1925 | 98.97% |
| **replaced** (已替换) | 20 | 1.03% |
| **pending** (待处理) | 0 | 0% |
| **总计** | 1945 | 100% |

### 已替换的文件（20 处）

根据分析，以下文件已部分替换：
- `src/telegram/handlers/language_selection.ts` - 语言选择相关
- `src/telegram/handlers/settings.ts` - 设置相关
- `src/telegram/handlers/start.ts` - 启动相关
- 其他少量文件

### 未替换的文件（1925 处）

大部分文件仍包含硬编码中文，等待替换。

---

## 📁 生成的文件

### 1. `i18n_complete_final_with_status.json`

**格式**:
```json
{
  "meta": {
    "extractedAt": "2025-11-22T16:27:29.755Z",
    "totalFiles": 177,
    "totalContent": 1945,
    "statusAddedAt": "2025-01-23T...",
    "statusDistribution": {
      "extracted": 1925,
      "replaced": 20,
      "pending": 0
    }
  },
  "content": [
    {
      "text": "...",
      "file": "src/telegram/handlers/menu.ts",
      "line": 45,
      "type": "message",
      "status": "extracted",  // ✅ 新增
      "key": "menu.stats"     // ✅ 新增
    }
  ]
}
```

**用途**:
- 后续提取脚本可以读取此文件，跳过 `status: "replaced"` 的内容
- 替换脚本可以更新 `status` 字段

### 2. `i18n_replacement_status.json`

**格式**:
```json
{
  "createdAt": "2025-01-23T...",
  "totalExtracted": 1945,
  "totalReplaced": 20,
  "totalPending": 1925,
  "replaced": [
    {
      "file": "src/telegram/handlers/language_selection.ts",
      "line": 83,
      "original": "❌ 無效的語言代碼",
      "key": "errors.invalidLanguageCode",
      "replacedAt": "2025-01-23T..."
    }
  ],
  "pending": [
    {
      "file": "src/telegram/handlers/menu.ts",
      "line": 45,
      "original": "📊 統計數據",
      "key": "menu.stats",
      "extractedAt": "2025-11-22T16:27:29.755Z"
    }
  ]
}
```

**用途**:
- 替换脚本可以读取此文件，知道哪些已替换，哪些待替换
- 提取脚本可以读取此文件，跳过已替换的内容

---

## 🔧 后续使用

### 1. 提取脚本改进

**修改**: `scripts/extract-100-percent-coverage.ts`

**添加逻辑**:
```typescript
// 读取替换状态
const replacementStatus = loadReplacementStatus();

function shouldExtract(item: ExtractedContent): boolean {
  // 1. 检查是否已替换
  const isReplaced = replacementStatus.replaced.some(r => 
    r.file === item.file && r.line === item.line
  );
  if (isReplaced) {
    console.log(`⏭️  跳过已替换: ${item.file}:${item.line}`);
    return false;
  }
  
  // 2. 检查是否已提取（去重）
  const exists = extracted.some(e => e.text === item.text);
  if (exists) return false;
  
  return true;
}
```

### 2. 替换脚本改进

**修改**: `scripts/apply-i18n-replacements-final.ts`

**添加逻辑**:
```typescript
// 读取替换状态
const replacementStatus = loadReplacementStatus();

// 替换后更新状态
function updateReplacementStatus(file: string, line: number, key: string) {
  replacementStatus.replaced.push({
    file,
    line,
    original: originalText,
    key,
    replacedAt: new Date().toISOString(),
  });
  
  // 从 pending 中移除
  replacementStatus.pending = replacementStatus.pending.filter(
    p => !(p.file === file && p.line === line)
  );
  
  // 保存状态
  saveReplacementStatus(replacementStatus);
}
```

---

## ✅ 验证结果

### 当前状态确认

- ✅ **提取已完成**: 1945 个内容已提取
- ✅ **替换未开始**: 只有 20 处已替换（1.03%）
- ✅ **状态跟踪已设置**: 可以跟踪后续替换进度

### 文件确认

- ✅ `i18n_complete_final_with_status.json` - 已生成
- ✅ `i18n_replacement_status.json` - 已生成
- ✅ `scripts/add-status-to-extraction.ts` - 已创建

---

## 📋 下一步

### 选项 A: 现在开始替换（推荐）

1. 使用 `i18n_replacement_status.json` 中的 `pending` 列表
2. 逐个文件替换硬编码
3. 每次替换后更新状态文件
4. 提取脚本会自动跳过已替换的内容

### 选项 B: 先翻译 CSV

1. 翻译 `i18n_for_translation.csv`
2. 导入翻译后的 CSV
3. 然后开始替换

### 选项 C: 增量替换

1. 选择关键文件先替换（如 `menu.ts`, `catch.ts`）
2. 测试验证
3. 逐步扩展到所有文件

---

## 🎯 优势

### 1. 避免重复提取

- ✅ 提取脚本可以读取状态文件
- ✅ 自动跳过已替换的内容
- ✅ 只提取新的硬编码

### 2. 跟踪替换进度

- ✅ 实时知道替换了多少
- ✅ 知道哪些文件已替换
- ✅ 知道哪些文件待替换

### 3. 支持增量替换

- ✅ 可以分批替换
- ✅ 可以回滚
- ✅ 可以暂停和继续

---

**状态跟踪机制已设置完成** ✅

