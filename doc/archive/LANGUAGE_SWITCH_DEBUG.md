# 语言切换问题调试报告

## 问题描述

用户报告：在英文版切换到个人页面时，看到的还是中文。

## 可能的原因

### 1. 用户语言偏好未正确保存

从日志看：
- 用户点击了 `menu_profile` callback
- 系统更新了用户活动
- 但 profile 页面显示的还是中文

**检查点**：
- 用户的语言偏好是否正确保存到数据库？
- `user.language_pref` 字段的值是什么？

### 2. Profile Handler 代码检查

**代码位置**: `src/telegram/handlers/profile.ts`

```typescript
// 第 39 行
const i18n = createI18n(user.language_pref || 'zh-TW');
```

**问题**：如果 `user.language_pref` 是 `null` 或 `undefined`，会 fallback 到 `'zh-TW'`。

### 3. 翻译 Key 检查

**已确认**：
- ✅ `en.ts` 中 `profile` 命名空间存在
- ✅ 所有需要的翻译 keys 都存在（profile2, nickname, age, gender, etc.）

### 4. 路由处理检查

**代码位置**: `src/router.ts` 和 `src/telegram/handlers/menu.ts`

从 `menu.ts` 第 166-170 行：
```typescript
case 'menu_profile': {
  fakeMessage.text = '/profile';
  const { handleProfile } = await import('./profile');
  await handleProfile(fakeMessage, env);
  break;
}
```

**问题**：`handleProfile` 会重新从数据库读取用户信息，如果用户的语言偏好没有正确保存，就会显示中文。

## 建议的调试步骤

### 1. 检查用户语言偏好

在 `handleProfile` 中添加日志：
```typescript
console.error('[handleProfile] User language_pref:', user.language_pref);
const i18n = createI18n(user.language_pref || 'zh-TW');
console.error('[handleProfile] Using i18n language:', user.language_pref || 'zh-TW');
```

### 2. 检查语言切换逻辑

在 `handleLanguageSelection` 中添加日志：
```typescript
console.error('[handleLanguageSelection] Setting language_pref to:', languageCode);
await updateUserProfile(db, telegramId, {
  language_pref: languageCode,
});
// 验证是否保存成功
const updatedUser = await findUserByTelegramId(db, telegramId);
console.error('[handleLanguageSelection] Updated user language_pref:', updatedUser?.language_pref);
```

### 3. 检查数据库

直接查询数据库确认用户的语言偏好：
```sql
SELECT telegram_id, language_pref FROM users WHERE telegram_id = '396943893';
```

## 可能的解决方案

### 方案 1: 确保语言偏好正确保存

检查 `updateUserProfile` 函数是否正确更新了 `language_pref` 字段。

### 方案 2: 添加语言偏好验证

在 `handleProfile` 中添加验证：
```typescript
if (!user.language_pref || user.language_pref === 'zh-TW') {
  console.error('[handleProfile] Warning: User language_pref is missing or default');
}
```

### 方案 3: 强制刷新用户信息

在调用 `handleProfile` 之前，强制从数据库重新读取用户信息：
```typescript
const user = await findUserByTelegramId(db, telegramId);
// 确保使用最新的语言偏好
const i18n = createI18n(user?.language_pref || 'zh-TW');
```

## 下一步行动

1. ✅ 确认翻译文件完整（已完成）
2. ⏳ 检查用户语言偏好是否正确保存
3. ⏳ 添加调试日志
4. ⏳ 验证语言切换功能

