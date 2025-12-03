# 部署调试日志说明

## 问题

用户报告：在英文版切换到个人页面时，看到的还是中文。

## 已添加的调试日志

### 1. Profile Handler (`src/telegram/handlers/profile.ts`)

在 `handleProfile` 函数中添加了以下日志：

```typescript
// Debug: Log user language preference
console.error('[handleProfile] User language_pref:', user.language_pref);
const i18n = createI18n(user.language_pref || 'zh-TW');
console.error('[handleProfile] Using i18n language:', user.language_pref || 'zh-TW');
```

### 2. Language Change Handler (`src/telegram/handlers/settings.ts`)

在 `handleLanguageChange` 函数中添加了以下日志：

```typescript
// Debug: Verify language was saved
const { findUserByTelegramId } = await import('~/db/queries/users');
const updatedUser = await findUserByTelegramId(db, telegramId);
console.error('[handleLanguageChange] Updated user language_pref:', updatedUser?.language_pref);
```

## 部署步骤

1. **检查代码**：
   ```bash
   pnpm lint
   pnpm test
   ```

2. **部署到 Staging**：
   ```bash
   pnpm deploy:staging
   ```

3. **测试流程**：
   - 切换到英文版（`/settings` → 选择英文）
   - 点击菜单中的"个人资料"按钮
   - 查看 Cloudflare Logs

## 预期的日志输出

### 切换语言时：
```
[handleLanguageChange] Updated user language_pref: en
```

### 查看 Profile 时：
```
[handleProfile] User language_pref: en
[handleProfile] Using i18n language: en
```

## 问题诊断

### 如果日志显示 `language_pref` 是 `null` 或 `'zh-TW'`：
- 说明语言偏好没有正确保存
- 检查 `handleLanguageChange` 中的 UPDATE 语句是否成功执行

### 如果日志显示 `language_pref` 是 `'en'`，但页面还是显示中文：
- 说明翻译 key 可能有问题
- 检查 `en.ts` 中是否有对应的翻译
- 检查 `i18n.t()` 调用是否正确

## 下一步

1. 部署代码到 staging
2. 测试并查看日志
3. 根据日志结果进一步诊断问题

