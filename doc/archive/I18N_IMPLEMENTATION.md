# XunNi i18n 实现文档

> **状态**: Phase 1 完成（zh-TW + en）  
> **日期**: 2025-01-15

---

## 📋 概述

XunNi 的国际化（i18n）系统采用**分阶段实现**策略：

### Phase 1: 核心语言（已完成）✅
- ✅ **繁体中文 (zh-TW)**: 完整实现
- ✅ **英文 (en)**: 完整实现
- ✅ 其他 18 种语言：使用 key + zh-TW 占位

### Phase 2: 外部翻译（未来）⏳
- ⏳ CSV/Google Sheets 导入
- ⏳ 翻译管理系统
- ⏳ 自动同步机制

---

## 🌍 支持的语言

### 完整实现
1. 🇹🇼 **繁體中文 (zh-TW)** - Complete
2. 🇺🇸 **English (en)** - Complete

### 占位实现（使用 zh-TW fallback）
3. 🇨🇳 简体中文 (zh-CN)
4. 🇯🇵 日本語 (ja)
5. 🇰🇷 한국어 (ko)
6. 🇹🇭 ภาษาไทย (th)
7. 🇻🇳 Tiếng Việt (vi)
8. 🇮🇩 Bahasa Indonesia (id)
9. 🇲🇾 Bahasa Melayu (ms)
10. 🇵🇭 Filipino (tl)
11. 🇪🇸 Español (es)
12. 🇵🇹 Português (pt)
13. 🇫🇷 Français (fr)
14. 🇩🇪 Deutsch (de)
15. 🇮🇹 Italiano (it)
16. 🇷🇺 Русский (ru)
17. 🇸🇦 العربية (ar)
18. 🇮🇳 हिन्दी (hi)
19. 🇧🇩 বাংলা (bn)
20. 🇹🇷 Türkçe (tr)

---

## 📁 文件结构

```
src/i18n/
├── index.ts              # i18n 系统核心
├── types.ts              # TypeScript 类型定义
├── languages.ts          # 语言列表和工具函数
└── locales/
    ├── zh-TW.ts          # 繁体中文（完整）
    ├── en.ts             # 英文（完整）
    └── template.ts       # 其他语言占位
```

---

## 🔧 使用方法

### 1. 在 Handler 中使用

```typescript
import { createI18n } from '~/i18n';

// 创建 i18n 实例
const i18n = createI18n(user.language_pref);

// 使用翻译
await telegram.sendMessage(
  chatId,
  i18n.t('onboarding.welcome')
);

// 使用参数
await telegram.sendMessage(
  chatId,
  i18n.t('onboarding.profileSummary', {
    nickname: user.nickname,
    gender: user.gender,
    age: user.age,
    zodiac: user.zodiac_sign,
    mbti: user.mbti_result,
  })
);
```

### 2. 翻译 Key 结构

```typescript
// 通用
common.yes
common.no
common.cancel

// Onboarding
onboarding.welcome
onboarding.askNickname
onboarding.askGender

// 命令
commands.start
commands.help
commands.throw

// 错误
errors.generic
errors.notRegistered
errors.banned
```

### 3. 参数替换

使用 `{paramName}` 语法：

```typescript
// 翻译文本
"你的年龄是 {age} 岁"

// 使用
i18n.t('profile.age', { age: 25 })
// 输出: "你的年龄是 25 岁"
```

---

## 📝 翻译内容类别

### 1. Common（通用）
- 是/否
- 取消/确认
- 返回/下一步
- 跳过/完成
- 错误/成功

### 2. Onboarding（注册流程）
- 欢迎消息
- 语言选择
- 昵称输入
- 性别选择
- 生日输入
- MBTI 测验
- 反诈骗测验
- 服务条款
- 注册完成

### 3. Commands（命令）
- /start
- /help
- /throw
- /catch
- /profile
- /stats
- /vip
- /block
- /report
- /appeal
- /rules

### 4. Bottle（漂流瓶）
- 丢瓶
- 捡瓶
- 接受/拒绝

### 5. Profile（个人资料）
- 昵称
- 性别
- 年龄
- 星座
- MBTI
- 语言
- VIP 状态

### 6. VIP（订阅）
- 权益说明
- 价格
- 订阅按钮
- 已订阅提示
- 过期提示

### 7. Errors（错误）
- 通用错误
- 未注册
- 已封禁
- 无效输入
- 网络错误

---

## 🔄 Fallback 机制

### 优先级

1. **精确匹配**: `zh-TW` → `zh-TW.ts`
2. **语言匹配**: `zh-CN` → `zh` (如果存在)
3. **默认语言**: 所有未匹配 → `zh-TW`

### 示例

```typescript
// 用户选择 ja (日本語)
getTranslations('ja')
// → 检查 ja.ts (不存在)
// → 返回 zh-TW.ts (fallback)

// 用户选择 en (English)
getTranslations('en')
// → 检查 en.ts (存在)
// → 返回 en.ts ✅
```

---

## 🚀 未来扩展

### Phase 2: CSV/Google Sheets 导入

#### 1. CSV 格式

```csv
key,zh-TW,en,ja,ko,th,vi,...
common.yes,是,Yes,はい,예,ใช่,Có,...
common.no,否,No,いいえ,아니요,ไม่,Không,...
onboarding.welcome,歡迎來到 XunNi！,Welcome to XunNi!,XunNiへようこそ！,...
```

#### 2. Google Sheets 集成

```typescript
// 未来实现
await loadExternalTranslations('ja', 'google-sheets', SHEET_URL);
```

#### 3. 自动同步

- 定期从 Google Sheets 拉取最新翻译
- 自动更新 translation cache
- 无需重新部署

---

## 📊 翻译统计

### Phase 1 完成度

| 语言 | 状态 | 翻译数 | 完成度 |
|------|------|--------|--------|
| zh-TW | ✅ Complete | ~100 | 100% |
| en | ✅ Complete | ~100 | 100% |
| 其他 18 种 | ⏳ Placeholder | 0 | 0% |

### 翻译 Key 统计

| 类别 | Key 数量 |
|------|----------|
| Common | 11 |
| Onboarding | 15 |
| Commands | 11 |
| Help | 3 |
| Bottle | 8 |
| Profile | 8 |
| VIP | 5 |
| Errors | 5 |
| **总计** | **~66** |

---

## 🔧 维护指南

### 添加新的翻译 Key

1. **更新类型定义** (`src/i18n/types.ts`)

```typescript
export interface Translations {
  // 添加新类别
  newCategory: {
    newKey: string;
  };
}
```

2. **更新 zh-TW** (`src/i18n/locales/zh-TW.ts`)

```typescript
export const translations: Translations = {
  // ...
  newCategory: {
    newKey: '新的翻译文本',
  },
};
```

3. **更新 en** (`src/i18n/locales/en.ts`)

```typescript
export const translations: Translations = {
  // ...
  newCategory: {
    newKey: 'New translation text',
  },
};
```

4. **使用新 Key**

```typescript
i18n.t('newCategory.newKey');
```

### 添加新语言（完整实现）

1. **创建语言文件** (`src/i18n/locales/ja.ts`)

```typescript
import type { Translations } from '../types';

export const translations: Translations = {
  common: {
    yes: 'はい',
    no: 'いいえ',
    // ...
  },
  // ...
};
```

2. **注册语言** (`src/i18n/index.ts`)

```typescript
import { translations as ja } from './locales/ja';

translationCache.set('ja', ja);
```

---

## 🧪 测试

### 测试翻译

```bash
# 运行 Onboarding 测试（会测试 i18n）
pnpm tsx scripts/test-onboarding.ts
```

### 手动测试

1. 在 Telegram 中选择不同语言
2. 验证消息是否正确显示
3. 检查参数替换是否正常

---

## 📚 参考资料

- [i18n 指南](./I18N_GUIDE.md)
- [开发规范](./DEVELOPMENT_STANDARDS.md)
- [SPEC 文档](./SPEC.md)

---

## 🎯 下一步

### 短期（Phase 1）
- ✅ 实现 zh-TW 和 en
- ✅ 其他语言使用占位
- ⏳ 在所有 Handler 中使用 i18n

### 中期（Phase 2）
- ⏳ 设计 CSV/Google Sheets 格式
- ⏳ 实现导入功能
- ⏳ 建立翻译管理流程

### 长期（Phase 3）
- ⏳ 自动同步机制
- ⏳ 翻译质量检查
- ⏳ 社区翻译贡献

---

**维护者**: XunNi Team  
**最后更新**: 2025-01-15  
**版本**: 1.0.0

