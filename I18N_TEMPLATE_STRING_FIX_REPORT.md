# i18n 模板字符串修复报告

**日期：** 2025-01-17  
**问题：** i18n 字符串中显示模板字符串而不是实际值

---

## 🔍 问题分析

### 发现的问题

1. **JavaScript 表达式在 i18n 字符串中**
   - `profile.message3`: `🌍 Language: ${user.language_pref || 'zh-TW'}`
   - `profile.message4`: `🌍 Language: ${user.language_pref || 'zh-TW'}`
   - i18n 系统无法处理 JavaScript 表达式（`||`, `&&`, `? :` 等）

2. **正则表达式无法匹配转义的 `${}`**
   - 原正则：`/\$\{([^}]+)\}/g` 无法匹配模板字符串中转义的 `\${}`
   - 需要同时匹配 `\${}` 和 `${}`

3. **参数传递格式错误**
   - 使用了带点的键名：`{ 'user.language_pref': value }`
   - 应该使用嵌套对象：`{ user: { language_pref: value } }`

---

## ✅ 已完成的修复

### 1. 修复 i18n 系统正则表达式 (`src/i18n/index.ts`)

**修改前：**
```typescript
result = result.replace(/\$\{([^}]+)\}/g, (match, expr) => {
```

**修改后：**
```typescript
result = result.replace(/(?:\\\$\{|\$\{)([^}]+)\}/g, (match, expr) => {
```

**说明：** 现在可以同时匹配 `\${}`（转义的）和 `${}`（字面量）

### 2. 修复代码中的参数传递 (`src/telegram/handlers/profile.ts`)

**修改前：**
```typescript
i18n.t('profile.message3', { 'user.language_pref': user.language_pref || 'zh-TW' })
i18n.t('profile.invite', { 'inviteStats.pending': inviteStats.pending })
i18n.t('profile.message5', { 'inviteStats.conversionRate': inviteStats.conversionRate })
```

**修改后：**
```typescript
i18n.t('profile.message3', { user: { language_pref: user.language_pref || 'zh-TW' } })
i18n.t('profile.invite', { inviteStats: { pending: inviteStats.pending } })
i18n.t('profile.message5', { inviteStats: { conversionRate: inviteStats.conversionRate } })
```

### 3. 修复所有语言文件中的 JavaScript 表达式

**修复的文件：** 33 个语言文件（除了 `en.ts` 已修复）

**修复内容：**
- `message3`: 移除 `|| 'zh-TW'` 表达式
- `message4`: 移除 `|| 'zh-TW'` 表达式

**修复前：**
```typescript
message3: `🌍 語言：\${user.language_pref || 'zh-TW'}\n\n`
```

**修复后：**
```typescript
message3: `🌍 語言：\${user.language_pref}\n\n`
```

---

## 📊 修复统计

- **修复的文件数：** 35 个（1 个代码文件 + 34 个语言文件）
- **修复的 key：** 
  - `profile.message3` (34 个语言文件)
  - `profile.message4` (34 个语言文件)
  - `profile.message5` (已在 `en.ts` 中修复)
  - `profile.invite` (已在 `en.ts` 中修复)
- **修复的代码位置：** `src/telegram/handlers/profile.ts` (3 处)

---

## 🧪 验证结果

### 测试用例

1. ✅ `profile.message3`: `🌍 Language: en` (而不是 `${user.language_pref || 'zh-TW'}`)
2. ✅ `profile.invite`: `⏳ Pending invitations to activate: 5 people` (而不是 `${inviteStats.pending} people`)
3. ✅ `profile.message5`: `📈 Conversion Rate: 80%` (而不是 `${inviteStats.conversionRate}%`)

### 测试脚本

已创建并运行测试脚本验证修复：
- `test_i18n_fix.cjs` - 所有测试通过 ✅

---

## ⚠️ 重要说明

### 为什么需要修复

1. **i18n 系统不支持 JavaScript 表达式**
   - 不能在 i18n 字符串中使用 `||`, `&&`, `? :` 等表达式
   - 默认值应该在代码中处理，而不是在 i18n 字符串中

2. **参数传递必须使用嵌套对象**
   - 错误：`{ 'user.language_pref': value }`
   - 正确：`{ user: { language_pref: value } }`

3. **正则表达式必须匹配转义的 `${}`**
   - 在模板字符串中，`\${}` 会被转义为 `${}`（字面量）
   - 正则表达式需要同时匹配两种情况

---

## 🚀 部署前检查

### 必须完成

- [x] 修复 i18n 系统正则表达式
- [x] 修复代码中的参数传递
- [x] 修复所有语言文件中的 JavaScript 表达式
- [x] 运行测试验证修复
- [ ] **部署到 Staging 环境**
- [ ] **实际测试验证**

### 部署命令

```bash
# 部署到 Staging
pnpm deploy:staging
```

---

## 📝 后续建议

1. **代码审查：** 检查是否还有其他地方使用了类似的模式
2. **全面扫描：** 运行 `scripts/scan_i18n_issues.cjs` 扫描所有潜在问题
3. **文档更新：** 更新开发规范，禁止在 i18n 字符串中使用 JavaScript 表达式

---

**修复完成时间：** 2025-01-17  
**状态：** ✅ 代码修复完成，待部署验证

