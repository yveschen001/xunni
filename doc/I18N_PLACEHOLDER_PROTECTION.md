# i18n 占位符保护机制

> **问题**: 每次导入新语言时，占位符会被破坏，显示代码表达式（如 `{completedCount}/{profileTasks.length}`）

## 问题根源分析

### 1. 当前问题

从截图可以看到，任务中心显示了原始代码表达式：
- `{completedCount}/{profileTasks.length}` 
- `{calculateDailyQuota(user)}`

这些应该是简单的占位符，如：
- `{completed}/{total}`
- `{quota}`

### 2. 根本原因

**问题发生在 `scripts/i18n-manager.ts` 的导入流程**：

1. **导入时没有验证占位符格式**
   - 当 CSV 中包含代码表达式时，这些会被直接写入 TypeScript 文件
   - `JSON.stringify` 会原样保留这些值

2. **翻译人员或批量翻译工具可能错误地复制代码**
   - 翻译人员可能看到代码中的调用，错误地将代码表达式写入 CSV
   - 批量翻译工具（如 Google Sheets 的翻译脚本）可能会错误地处理占位符

3. **导出时没有保护机制**
   - 如果代码中已经包含了错误的占位符，导出时会将这些错误写入 CSV
   - 然后导入时又会将这些错误写入所有语言文件

### 3. 问题流程

```
代码（正确） → 导出 CSV（正确） → 翻译人员/工具（可能错误） → CSV（包含代码表达式） → 导入（没有验证） → TypeScript 文件（错误） → UI（显示代码表达式）
```

## 解决方案

### 方案 1：导入时验证占位符格式（推荐）✅

在 `scripts/i18n-manager.ts` 的 `importCsv()` 函数中添加占位符验证：

```typescript
// 占位符验证规则
function isValidPlaceholder(text: string): boolean {
  if (!text) return true; // 空值允许
  
  // 允许的占位符格式：{variableName} 或 {variable.name}
  // 禁止：代码表达式、函数调用、逻辑运算符
  const invalidPatterns = [
    /\.length/g,           // 禁止 .length
    /\.join\(/g,           // 禁止 .join()
    /===|!==|==|!=/g,      // 禁止比较运算符
    /\?|:/g,               // 禁止三元运算符
    /&&|\|\|/g,            // 禁止逻辑运算符
    /\(/g,                 // 禁止函数调用（除非是 {variable}）
    /\[/g,                 // 禁止数组访问
  ];
  
  // 检查是否包含代码表达式
  for (const pattern of invalidPatterns) {
    if (pattern.test(text)) {
      return false;
    }
  }
  
  // 检查占位符格式：只允许 {variableName} 或 {variable.name}
  const placeholderPattern = /\{[a-zA-Z_][a-zA-Z0-9_.]*\}/g;
  const matches = text.match(/\{[^}]+\}/g) || [];
  
  for (const match of matches) {
    if (!placeholderPattern.test(match)) {
      return false; // 包含无效占位符
    }
  }
  
  return true;
}

// 在导入时使用
let finalValue = value;
if (value === '[需要翻译]' || value.trim() === '') {
  finalValue = ''; 
} else if (!isValidPlaceholder(value)) {
  // 如果包含代码表达式，使用 zh-TW 的值（作为参考）
  console.warn(`⚠️ Invalid placeholder in ${lang} for key ${key}: ${value}`);
  console.warn(`   Using zh-TW value as fallback: ${zhTwTranslations[key]}`);
  finalValue = zhTwTranslations[key] || value; // 使用参考语言的值
}
```

### 方案 2：导出时验证占位符格式

在 `scripts/i18n-manager.ts` 的 `exportCsv()` 函数中添加验证：

```typescript
// 在导出前验证 zh-TW 的占位符
function validateZhTWPlaceholders(translations: Record<string, string>): void {
  const issues: Array<{ key: string; value: string; issue: string }> = [];
  
  for (const [key, value] of Object.entries(translations)) {
    if (!isValidPlaceholder(value)) {
      issues.push({
        key,
        value,
        issue: 'Contains code expression instead of simple placeholder'
      });
    }
  }
  
  if (issues.length > 0) {
    console.error('❌ Found invalid placeholders in zh-TW:');
    issues.forEach(({ key, value, issue }) => {
      console.error(`  - ${key}: ${value.substring(0, 50)}... (${issue})`);
    });
    throw new Error('Cannot export CSV with invalid placeholders. Please fix zh-TW first.');
  }
}
```

### 方案 3：创建占位符修复脚本

创建一个脚本，自动修复所有语言文件中的无效占位符：

```typescript
// scripts/fix-placeholders.ts
// 扫描所有语言文件，修复无效占位符
// 使用 zh-TW 作为参考，修复其他语言
```

## 实施计划

### 阶段 1：立即修复（当前问题）

1. ✅ 检查并修复 `src/i18n/locales/*/tasks.ts` 中的无效占位符
2. ✅ 验证所有语言的 `tasks.profile`、`tasks.task2`、`tasks.task3`、`tasks.quota` 是否正确

### 阶段 2：添加保护机制（防止未来问题）

1. ✅ 在 `i18n-manager.ts` 中添加占位符验证函数
2. ✅ 在导入时验证并修复无效占位符
3. ✅ 在导出时验证 zh-TW 的占位符格式
4. ✅ 添加 CI/CD 检查，在部署前验证占位符

### 阶段 3：文档和规范

1. ✅ 更新 `MAINTENANCE_MODE.md`，添加占位符规范
2. ✅ 创建占位符使用指南
3. ✅ 在翻译工具中添加占位符提示

## 占位符规范

### ✅ 允许的格式

```typescript
// 简单变量
"{name}"
"{count}"
"{user.nickname}"

// 嵌套属性
"{task.reward_amount}"
"{inviteProgress.current}"
```

### ❌ 禁止的格式

```typescript
// 代码表达式
"{completedCount}/{profileTasks.length}"  // ❌ 包含 .length
"{calculateDailyQuota(user)}"             // ❌ 函数调用
"{task.reward_type === 'daily' ? '當天有效' : '永久有效'}"  // ❌ 三元运算符
"{highlights.join(', ')}"                 // ❌ 方法调用
```

## 检查清单

在每次导入新语言前：

- [ ] 验证 CSV 中的占位符格式
- [ ] 检查是否有代码表达式
- [ ] 确认所有占位符都是简单变量名
- [ ] 运行 `pnpm i18n:check` 验证
- [ ] 测试关键页面的 i18n 显示

## 相关文件

- `scripts/i18n-manager.ts` - 导入/导出逻辑
- `src/i18n/locales/*/tasks.ts` - 任务相关翻译
- `doc/MAINTENANCE_MODE.md` - 维护模式规范

---

**最后更新**: 2025-01-15  
**状态**: 需要实施保护机制

