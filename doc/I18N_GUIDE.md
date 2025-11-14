# XunNi i18n 國際化指南

## 1. 概述

本專案支援多語言，所有使用者可見的文字都應通過 i18n 系統管理。支援的語言包括但不限於：
- 繁體中文 (zh-TW)
- 英文 (en)
- 日文 (ja)
- 韓文 (ko)
- 泰文 (th)
- 越南文 (vi)
- 以及其他 34 種語言（VIP 翻譯功能）

## 2. 架構設計

### 2.1 目錄結構

```
src/i18n/
├── index.ts              # i18n 初始化與主要 API
├── keys.ts               # 翻譯鍵值常數定義
├── locales/              # 語言包目錄
│   ├── zh-TW.ts          # 繁體中文
│   ├── en.ts             # 英文
│   ├── ja.ts             # 日文
│   ├── ko.ts             # 韓文
│   ├── th.ts             # 泰文
│   ├── vi.ts             # 越南文
│   └── ...               # 其他語言
└── types.ts              # TypeScript 型別定義
```

### 2.2 翻譯鍵值命名規範

使用階層式命名，以點號分隔：

```
{模組}.{功能}.{具體項目}
```

範例：
- `onboarding.step1.title` - 引導步驟 1 標題
- `onboarding.step1.nickname_placeholder` - 暱稱輸入框提示
- `bottle.throw.success` - 丟瓶成功訊息
- `bottle.catch.not_found` - 撿瓶未找到
- `error.banned` - 被封禁錯誤
- `vip.features.translation` - VIP 功能：翻譯

### 2.3 翻譯鍵值定義 (keys.ts)

```typescript
// src/i18n/keys.ts

/**
 * 翻譯鍵值常數
 * 使用 const assertion 確保型別安全
 */
export const I18N_KEYS = {
  // Onboarding
  ONBOARDING: {
    STEP1: {
      TITLE: 'onboarding.step1.title',
      NICKNAME_PLACEHOLDER: 'onboarding.step1.nickname_placeholder',
      AVATAR_UPLOAD: 'onboarding.step1.avatar_upload',
    },
    STEP2: {
      TITLE: 'onboarding.step2.title',
      SELECT_LANGUAGE: 'onboarding.step2.select_language',
    },
    // ...
  },
  
  // Bottle
  BOTTLE: {
    THROW: {
      SUCCESS: 'bottle.throw.success',
      QUOTA_EXCEEDED: 'bottle.throw.quota_exceeded',
      CONTENT_TOO_LONG: 'bottle.throw.content_too_long',
    },
    CATCH: {
      FOUND: 'bottle.catch.found',
      NOT_FOUND: 'bottle.catch.not_found',
      SAFETY_REMINDER: 'bottle.catch.safety_reminder',
    },
  },
  
  // Error
  ERROR: {
    BANNED: 'error.banned',
    NOT_COMPLETED_ONBOARDING: 'error.not_completed_onboarding',
    INVALID_MESSAGE: 'error.invalid_message',
    URL_BLOCKED: 'error.url_blocked',
  },
  
  // VIP
  VIP: {
    FEATURES: {
      TRANSLATION: 'vip.features.translation',
      MORE_BOTTLES: 'vip.features.more_bottles',
      FILTERS: 'vip.features.filters',
    },
    PURCHASE: {
      TITLE: 'vip.purchase.title',
      PRICE: 'vip.purchase.price',
      SUCCESS: 'vip.purchase.success',
    },
  },
} as const;

// 型別輔助：提取所有鍵值
export type I18NKey = typeof I18N_KEYS extends Record<string, infer V>
  ? V extends string
    ? V
    : V extends Record<string, infer V2>
    ? V2 extends string
      ? V2
      : never
    : never
  : never;
```

### 2.4 語言包結構

```typescript
// src/i18n/locales/zh-TW.ts

import type { LocaleMessages } from '../types';

export const zhTW: LocaleMessages = {
  // Onboarding
  'onboarding.step1.title': '👋 歡迎來到 XunNi！\n\n讓我們先設定你的個人資料吧～',
  'onboarding.step1.nickname_placeholder': '請輸入你的暱稱',
  'onboarding.step1.avatar_upload': '上傳頭像',
  
  'onboarding.step2.title': '🌍 選擇你的主要使用語言',
  'onboarding.step2.select_language': '選擇語言',
  
  // Bottle
  'bottle.throw.success': '✨ 你的漂流瓶已經丟出去了！\n\n等待有緣人來撿起它吧～',
  'bottle.throw.quota_exceeded': '😅 今天的丟瓶次數已用完\n\n明天再來吧，或升級 VIP 獲得更多次數！',
  'bottle.throw.content_too_long': '❌ 瓶子內容太長了，最多 {maxLength} 字',
  
  'bottle.catch.found': '🎉 撿到一個漂流瓶！\n\n{content}',
  'bottle.catch.not_found': '😔 目前沒有適合你的瓶子\n\n稍後再試試吧～',
  'bottle.catch.safety_reminder': '⚠️ 這是匿名對話，請遵守安全守則\n\n如有不當內容，請使用 /report 舉報',
  
  // Error
  'error.banned': '🚫 你的帳號已被封禁\n\n封禁時間：{banEnd}\n原因：{reason}\n\n如需申訴，請使用 /appeal',
  'error.not_completed_onboarding': '❌ 請先完成個人資料設定\n\n使用 /start 開始設定',
  'error.invalid_message': '❌ 目前僅支援文字與官方表情符號',
  'error.url_blocked': '🚫 訊息包含不被允許的連結\n\n為保護使用者安全，我們限制了可分享的連結',
  
  // VIP
  'vip.features.translation': '🌐 34 種語言自動翻譯',
  'vip.features.more_bottles': '📦 每日 30 個漂流瓶（可升級至 100）',
  'vip.features.filters': '🎯 指定星座、MBTI 篩選',
  
  'vip.purchase.title': '⭐ VIP 會員',
  'vip.purchase.price': '每月 {price} Stars',
  'vip.purchase.success': '🎉 恭喜成為 VIP 會員！\n\n有效期至：{expireDate}',
};
```

```typescript
// src/i18n/locales/en.ts

import type { LocaleMessages } from '../types';

export const en: LocaleMessages = {
  'onboarding.step1.title': '👋 Welcome to XunNi!\n\nLet\'s set up your profile first~',
  'onboarding.step1.nickname_placeholder': 'Please enter your nickname',
  'onboarding.step1.avatar_upload': 'Upload avatar',
  
  'onboarding.step2.title': '🌍 Select your primary language',
  'onboarding.step2.select_language': 'Select language',
  
  'bottle.throw.success': '✨ Your bottle has been thrown!\n\nWaiting for someone to catch it~',
  'bottle.throw.quota_exceeded': '😅 You\'ve used up today\'s throw quota\n\nCome back tomorrow, or upgrade to VIP for more!',
  'bottle.throw.content_too_long': '❌ Bottle content is too long, maximum {maxLength} characters',
  
  'bottle.catch.found': '🎉 Found a bottle!\n\n{content}',
  'bottle.catch.not_found': '😔 No suitable bottles at the moment\n\nTry again later~',
  'bottle.catch.safety_reminder': '⚠️ This is an anonymous conversation, please follow safety guidelines\n\nUse /report to report inappropriate content',
  
  'error.banned': '🚫 Your account has been banned\n\nBan until: {banEnd}\nReason: {reason}\n\nUse /appeal to appeal',
  'error.not_completed_onboarding': '❌ Please complete your profile setup first\n\nUse /start to begin',
  'error.invalid_message': '❌ Only text and official emojis are supported',
  'error.url_blocked': '🚫 Message contains disallowed links\n\nTo protect users, we restrict shareable links',
  
  'vip.features.translation': '🌐 Auto-translate in 34 languages',
  'vip.features.more_bottles': '📦 30 bottles per day (upgradeable to 100)',
  'vip.features.filters': '🎯 Filter by zodiac and MBTI',
  
  'vip.purchase.title': '⭐ VIP Membership',
  'vip.purchase.price': '{price} Stars per month',
  'vip.purchase.success': '🎉 Congratulations on becoming a VIP member!\n\nValid until: {expireDate}',
};
```

### 2.5 i18n 核心 API

```typescript
// src/i18n/index.ts

import type { LocaleMessages } from './types';
import { zhTW } from './locales/zh-TW';
import { en } from './locales/en';
import { ja } from './locales/ja';
// ... 其他語言

type SupportedLocale = 'zh-TW' | 'en' | 'ja' | 'ko' | 'th' | 'vi' | /* ... */;

const locales: Record<SupportedLocale, LocaleMessages> = {
  'zh-TW': zhTW,
  'en': en,
  'ja': ja,
  // ...
};

/**
 * 取得翻譯文字
 * @param key - 翻譯鍵值
 * @param locale - 語言代碼，預設 'zh-TW'
 * @param params - 參數替換物件
 * @returns 翻譯後的文字
 */
export function t(
  key: string,
  locale: SupportedLocale = 'zh-TW',
  params?: Record<string, string | number>
): string {
  const messages = locales[locale] || locales['zh-TW'];
  let message = messages[key] || key; // 找不到時回退到鍵值本身
  
  // 參數替換
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      message = message.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    });
  }
  
  return message;
}

/**
 * 根據使用者語言偏好取得翻譯
 */
export function tForUser(
  key: string,
  userLanguage: string | null | undefined,
  params?: Record<string, string | number>
): string {
  const locale = (userLanguage || 'zh-TW') as SupportedLocale;
  return t(key, locale, params);
}
```

### 2.6 型別定義

```typescript
// src/i18n/types.ts

export type LocaleMessages = Record<string, string>;
```

## 3. 使用範例

### 3.1 在 Handler 中使用

```typescript
// src/telegram/handlers/throw.ts
import { tForUser } from '../../../i18n';
import { I18N_KEYS } from '../../../i18n/keys';

export async function handleThrow(
  userId: string,
  userLanguage: string | null,
  // ...
) {
  // 使用翻譯
  const successMessage = tForUser(
    I18N_KEYS.BOTTLE.THROW.SUCCESS,
    userLanguage
  );
  
  // 帶參數的翻譯
  const quotaExceededMessage = tForUser(
    I18N_KEYS.BOTTLE.THROW.QUOTA_EXCEEDED,
    userLanguage,
    { used: 3, limit: 3 }
  );
  
  // ...
}
```

### 3.2 在 Domain 層使用（僅錯誤訊息）

```typescript
// src/domain/usage.ts
import { t } from '../i18n';

export function getQuotaExceededMessage(
  locale: string,
  used: number,
  limit: number
): string {
  return t('bottle.throw.quota_exceeded', locale as any, { used, limit });
}
```

## 4. 新增語言

### 4.1 步驟

1. 在 `src/i18n/locales/` 建立新語言檔案（如 `ko.ts`）
2. 實作所有翻譯鍵值
3. 在 `src/i18n/index.ts` 中匯入並註冊
4. 更新 `SupportedLocale` 型別

### 4.2 翻譯檢查清單

新增語言時，確保以下類別都有翻譯：
- [ ] Onboarding (7 個步驟)
- [ ] Bottle (throw/catch)
- [ ] Conversation (訊息轉發)
- [ ] Error (所有錯誤訊息)
- [ ] VIP (功能說明、購買)
- [ ] Report/Appeal
- [ ] Help
- [ ] Horoscope

## 5. 最佳實踐

1. **永遠不要硬編碼使用者可見文字**
   ```typescript
   // ❌ 不好的
   await sendMessage(userId, '你的漂流瓶已經丟出去了！');
   
   // ✅ 好的
   await sendMessage(userId, tForUser(I18N_KEYS.BOTTLE.THROW.SUCCESS, userLanguage));
   ```

2. **使用常數而非字串字面量**
   ```typescript
   // ❌ 不好的
   t('bottle.throw.success', locale);
   
   // ✅ 好的
   t(I18N_KEYS.BOTTLE.THROW.SUCCESS, locale);
   ```

3. **參數化動態內容**
   ```typescript
   // ✅ 好的：使用參數
   t(I18N_KEYS.BOTTLE.THROW.CONTENT_TOO_LONG, locale, { maxLength: 500 });
   ```

4. **保持翻譯鍵值的一致性**
   - 相同語義使用相同鍵值
   - 避免重複定義

5. **提供回退機制**
   - 找不到翻譯時回退到鍵值本身或預設語言（zh-TW）

