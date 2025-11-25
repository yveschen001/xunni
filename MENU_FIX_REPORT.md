# Menu i18n 修复报告

**日期：** 2025-01-17  
**问题：** 部署后 menu 页面显示 i18n key 而不是翻译值

---

## 🔍 问题分析

### 发现的问题

代码中使用的 i18n keys 与翻译文件中的 keys 不匹配：

1. **`menu.greeting`** → 应该是 `menu.text2`
2. **`menu.mbtiLabel`** → 应该是 `menu.settings`
3. **`menu.zodiacLabel`** → 应该是 `menu.settings2`
4. **`menu.nextTask`** → 应该是 `menu.task`

### 根本原因

- 代码使用了不存在的 i18n keys
- i18n 系统找不到 key 时返回 `[${key}]` 格式

---

## ✅ 已完成的修复

### 1. 修复 menu.ts 中的 i18n keys

**修改前：**
```typescript
`${i18n.t('menu.greeting', { nickname: user.nickname })}\n\n` +
`${i18n.t('menu.mbtiLabel', { mbti: user.mbti_result || i18n.t('menu.notSet') })}\n` +
`${i18n.t('menu.zodiacLabel', { zodiac: user.zodiac_sign || 'Virgo' })}\n\n`;
```

**修改后：**
```typescript
`${i18n.t('menu.text2', { user: { nickname: user.nickname } })}\n\n` +
`${i18n.t('menu.settings', { user: { mbti_result: user.mbti_result || i18n.t('menu.notSet') } })}\n` +
`${i18n.t('menu.settings2', { user: { zodiac_sign: user.zodiac_sign || i18n.t('menu.notSet') } })}\n\n`;
```

### 2. 修复 menu.task key

**修改前：**
```typescript
i18n.t('menu.nextTask', {
  taskName,
  reward: nextTask.reward_amount,
  description: taskDescription,
})
```

**修改后：**
```typescript
i18n.t('menu.task', {
  nextTask: {
    name: taskName,
    reward_amount: nextTask.reward_amount,
    description: taskDescription,
  },
})
```

### 3. 清理 i18n 字符串中的 JavaScript 表达式

**修复前（en.ts）：**
```typescript
settings: `• MBTI：\${user.mbti_result}
 {user.mbti_result || '未設定'} \${user.mbti_result}`,
```

**修复后（en.ts）：**
```typescript
settings: `• MBTI：\${user.mbti_result}
`,
```

**修复前（zh-TW.ts）：**
```typescript
settings: `• MBTI：\${user.mbti_result || '未設定'}
`,
```

**修复后（zh-TW.ts）：**
```typescript
settings: `• MBTI：\${user.mbti_result}
`,
```

---

## 📊 修复统计

- **修复的文件：** 3 个
  - `src/telegram/handlers/menu.ts`
  - `src/i18n/locales/en.ts`
  - `src/i18n/locales/zh-TW.ts`
- **修复的 keys：** 4 个
  - `menu.greeting` → `menu.text2`
  - `menu.mbtiLabel` → `menu.settings`
  - `menu.zodiacLabel` → `menu.settings2`
  - `menu.nextTask` → `menu.task`

---

## 🚀 部署信息

- **环境：** Staging
- **Version ID：** 100cd2cc-2cca-46d4-98dc-a1dfe6f8a841
- **状态：** ✅ 已部署

---

## ✅ 验证

部署后请验证：
- [ ] Menu 页面显示正确翻译（不是 `[menu.greeting]` 等）
- [ ] 问候语显示正确（`👋 Hi, {nickname}!`）
- [ ] MBTI 和星座显示正确
- [ ] 任务提醒显示正确

---

**修复完成时间：** 2025-01-17  
**状态：** ✅ 已修复并部署

