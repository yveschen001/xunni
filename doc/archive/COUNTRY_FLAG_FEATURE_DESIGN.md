# 國旗顯示功能設計文檔

## 📋 功能概述

在用戶暱稱前顯示國旗 Emoji，基於用戶的 Telegram `language_code` 推測國家/地區。

---

## 🎯 需求分析

### **用戶故事**
> 作為用戶，我希望在查看對方資料時，能看到對方的國旗，了解對方來自哪個國家/地區。

### **顯示位置**
1. ✅ 資料卡（`handleConversationProfile`）
2. ✅ 對話歷史帖子（`conversation_history.ts`）
3. ✅ 統計頁面（`/stats`）
4. ✅ 邀請列表（`/invite`）

### **顯示格式**
```
🇹🇼 張** (暱稱擾碼)
🇺🇸 John**
🇯🇵 田中**
🌍 未知 (無法判斷國家時)
```

---

## 🔍 技術可行性分析

### **❌ 方案 1：通過 IP 獲取國家（不可行）**

**問題**：
1. Telegram Bot 收到的 Webhook 請求來自 Telegram 服務器
2. `CF-Connecting-IP` 是 Telegram 服務器的 IP（`91.108.x.x`），不是用戶 IP
3. Telegram API 不提供用戶 IP（隱私保護）

**結論**：❌ 無法通過 IP 獲取用戶國家

---

### **✅ 方案 2：通過 Telegram `language_code` 推測國家（推薦）**

**數據來源**：
```typescript
// Telegram Update 中的 language_code
{
  "message": {
    "from": {
      "id": 123456789,
      "first_name": "張三",
      "language_code": "zh-TW"  // ← 這個！
    }
  }
}
```

**優勢**：
- ✅ **隱私友好**：不需要 IP，使用 Telegram 官方提供的信息
- ✅ **準確度高**：用戶主動設置的語言，比 IP 推測更準確
- ✅ **無額外 API 調用**：數據已經在 Telegram Update 中
- ✅ **符合 GDPR**：不收集敏感的 IP 信息

**局限性**：
- ⚠️ 語言 ≠ 國家（如 `en-US` vs `en-GB`）
- ⚠️ 部分用戶可能沒有設置 `language_code`
- ⚠️ 用戶可能使用非母語設置（如在美國的中國人設置 `zh-CN`）

**結論**：✅ **推薦使用此方案**

---

## 🗺️ 語言代碼到國家映射

### **映射邏輯**

```typescript
// 語言代碼 → 國家代碼 → 國旗 Emoji
'zh-TW' → 'TW' → '🇹🇼'
'zh-CN' → 'CN' → '🇨🇳'
'en-US' → 'US' → '🇺🇸'
'en-GB' → 'GB' → '🇬🇧'
'ja-JP' → 'JP' → '🇯🇵'
'ko-KR' → 'KR' → '🇰🇷'
```

### **國旗 Emoji 編碼**

國旗 Emoji 使用 **Regional Indicator Symbols**：
- 每個國家代碼的字母對應一個 Unicode 字符
- 例如：`TW` = `🇹` + `🇼` = `🇹🇼`

**實現方式**：
```typescript
function getCountryFlagEmoji(countryCode: string): string {
  // 將國家代碼轉換為國旗 Emoji
  // 'TW' → 🇹🇼
  const codePoints = [...countryCode.toUpperCase()].map(
    char => 127397 + char.charCodeAt(0)
  );
  return String.fromCodePoint(...codePoints);
}

// 示例
getCountryFlagEmoji('TW') // → 🇹🇼
getCountryFlagEmoji('US') // → 🇺🇸
getCountryFlagEmoji('JP') // → 🇯🇵
```

---

## 📊 支持的語言和國家

### **主要語言映射**

| 語言代碼 | 國家代碼 | 國旗 | 說明 |
|---------|---------|------|------|
| `zh-TW` | `TW` | 🇹🇼 | 繁體中文（台灣） |
| `zh-HK` | `HK` | 🇭🇰 | 繁體中文（香港） |
| `zh-CN` | `CN` | 🇨🇳 | 簡體中文（中國） |
| `en-US` | `US` | 🇺🇸 | 英語（美國） |
| `en-GB` | `GB` | 🇬🇧 | 英語（英國） |
| `ja-JP` | `JP` | 🇯🇵 | 日語（日本） |
| `ko-KR` | `KR` | 🇰🇷 | 韓語（韓國） |
| `es-ES` | `ES` | 🇪🇸 | 西班牙語（西班牙） |
| `es-MX` | `MX` | 🇲🇽 | 西班牙語（墨西哥） |
| `fr-FR` | `FR` | 🇫🇷 | 法語（法國） |
| `de-DE` | `DE` | 🇩🇪 | 德語（德國） |
| `it-IT` | `IT` | 🇮🇹 | 意大利語（意大利） |
| `pt-BR` | `BR` | 🇧🇷 | 葡萄牙語（巴西） |
| `pt-PT` | `PT` | 🇵🇹 | 葡萄牙語（葡萄牙） |
| `ru-RU` | `RU` | 🇷🇺 | 俄語（俄羅斯） |
| `ar-SA` | `SA` | 🇸🇦 | 阿拉伯語（沙特） |
| `th-TH` | `TH` | 🇹🇭 | 泰語（泰國） |
| `vi-VN` | `VN` | 🇻🇳 | 越南語（越南） |
| `id-ID` | `ID` | 🇮🇩 | 印尼語（印尼） |
| `tr-TR` | `TR` | 🇹🇷 | 土耳其語（土耳其） |
| `pl-PL` | `PL` | 🇵🇱 | 波蘭語（波蘭） |
| `nl-NL` | `NL` | 🇳🇱 | 荷蘭語（荷蘭） |
| `sv-SE` | `SE` | 🇸🇪 | 瑞典語（瑞典） |
| `da-DK` | `DK` | 🇩🇰 | 丹麥語（丹麥） |
| `fi-FI` | `FI` | 🇫🇮 | 芬蘭語（芬蘭） |
| `no-NO` | `NO` | 🇳🇴 | 挪威語（挪威） |
| `cs-CZ` | `CZ` | 🇨🇿 | 捷克語（捷克） |
| `el-GR` | `GR` | 🇬🇷 | 希臘語（希臘） |
| `he-IL` | `IL` | 🇮🇱 | 希伯來語（以色列） |
| `hi-IN` | `IN` | 🇮🇳 | 印地語（印度） |
| `ms-MY` | `MY` | 🇲🇾 | 馬來語（馬來西亞） |
| `fa-IR` | `IR` | 🇮🇷 | 波斯語（伊朗） |
| `uk-UA` | `UA` | 🇺🇦 | 烏克蘭語（烏克蘭） |

### **降級處理**

1. **只有語言沒有地區**（如 `en`, `zh`）：
   - `en` → `GB` 🇬🇧（默認英國）
   - `zh` → `CN` 🇨🇳（默認中國）
   - `ja` → `JP` 🇯🇵
   - `ko` → `KR` 🇰🇷

2. **無法識別的語言代碼**：
   - 顯示 `🌍`（地球）表示「國際」

3. **沒有 `language_code`**：
   - 顯示 `🌍`（地球）

---

## 🔧 技術實現

### **1. 創建工具函數**

**文件位置**：`src/utils/country_flag.ts`

```typescript
/**
 * Country Flag Utilities
 * 
 * Convert language codes to country flags based on Telegram user's language_code
 */

/**
 * Language code to country code mapping
 */
const LANGUAGE_TO_COUNTRY: Record<string, string> = {
  // Chinese
  'zh-TW': 'TW',
  'zh-HK': 'HK',
  'zh-CN': 'CN',
  'zh-SG': 'SG',
  'zh-MO': 'MO',
  
  // English
  'en-US': 'US',
  'en-GB': 'GB',
  'en-AU': 'AU',
  'en-CA': 'CA',
  'en-NZ': 'NZ',
  'en-IE': 'IE',
  'en-ZA': 'ZA',
  'en-IN': 'IN',
  'en-SG': 'SG',
  
  // Japanese
  'ja-JP': 'JP',
  'ja': 'JP',
  
  // Korean
  'ko-KR': 'KR',
  'ko': 'KR',
  
  // Spanish
  'es-ES': 'ES',
  'es-MX': 'MX',
  'es-AR': 'AR',
  'es-CL': 'CL',
  'es-CO': 'CO',
  
  // French
  'fr-FR': 'FR',
  'fr-CA': 'CA',
  'fr-BE': 'BE',
  'fr-CH': 'CH',
  
  // German
  'de-DE': 'DE',
  'de-AT': 'AT',
  'de-CH': 'CH',
  
  // Italian
  'it-IT': 'IT',
  'it-CH': 'CH',
  
  // Portuguese
  'pt-BR': 'BR',
  'pt-PT': 'PT',
  
  // Russian
  'ru-RU': 'RU',
  'ru': 'RU',
  
  // Arabic
  'ar-SA': 'SA',
  'ar-AE': 'AE',
  'ar-EG': 'EG',
  'ar': 'SA',
  
  // Other major languages
  'th-TH': 'TH',
  'th': 'TH',
  'vi-VN': 'VN',
  'vi': 'VN',
  'id-ID': 'ID',
  'id': 'ID',
  'tr-TR': 'TR',
  'tr': 'TR',
  'pl-PL': 'PL',
  'pl': 'PL',
  'nl-NL': 'NL',
  'nl': 'NL',
  'sv-SE': 'SE',
  'sv': 'SE',
  'da-DK': 'DK',
  'da': 'DK',
  'fi-FI': 'FI',
  'fi': 'FI',
  'no-NO': 'NO',
  'no': 'NO',
  'cs-CZ': 'CZ',
  'cs': 'CZ',
  'el-GR': 'GR',
  'el': 'GR',
  'he-IL': 'IL',
  'he': 'IL',
  'hi-IN': 'IN',
  'hi': 'IN',
  'ms-MY': 'MY',
  'ms': 'MY',
  'fa-IR': 'IR',
  'fa': 'IR',
  'uk-UA': 'UA',
  'uk': 'UA',
};

/**
 * Convert country code to flag emoji
 * 
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., 'TW', 'US', 'JP')
 * @returns Flag emoji (e.g., '🇹🇼', '🇺🇸', '🇯🇵')
 * 
 * @example
 * getCountryFlagEmoji('TW') // → '🇹🇼'
 * getCountryFlagEmoji('US') // → '🇺🇸'
 * getCountryFlagEmoji('JP') // → '🇯🇵'
 */
export function getCountryFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) {
    return '🌍'; // Earth emoji for unknown/invalid codes
  }
  
  // Convert country code to flag emoji using Regional Indicator Symbols
  // Each letter is converted to its corresponding Regional Indicator Symbol
  // A-Z → U+1F1E6 to U+1F1FF
  const codePoints = [...countryCode.toUpperCase()].map(
    char => 127397 + char.charCodeAt(0)
  );
  
  return String.fromCodePoint(...codePoints);
}

/**
 * Get country code from Telegram language code
 * 
 * @param languageCode - Telegram language code (e.g., 'zh-TW', 'en-US', 'ja')
 * @returns ISO 3166-1 alpha-2 country code (e.g., 'TW', 'US', 'JP')
 * 
 * @example
 * getCountryCodeFromLanguage('zh-TW') // → 'TW'
 * getCountryCodeFromLanguage('en-US') // → 'US'
 * getCountryCodeFromLanguage('ja') // → 'JP'
 * getCountryCodeFromLanguage('unknown') // → null
 */
export function getCountryCodeFromLanguage(languageCode: string | null | undefined): string | null {
  if (!languageCode) {
    return null;
  }
  
  // Normalize language code
  const normalized = languageCode.toLowerCase().trim();
  
  // Try exact match first
  if (LANGUAGE_TO_COUNTRY[normalized]) {
    return LANGUAGE_TO_COUNTRY[normalized];
  }
  
  // Try base language (e.g., 'zh-TW' → 'zh')
  const baseLanguage = normalized.split('-')[0];
  if (LANGUAGE_TO_COUNTRY[baseLanguage]) {
    return LANGUAGE_TO_COUNTRY[baseLanguage];
  }
  
  return null;
}

/**
 * Get country flag emoji from Telegram language code
 * 
 * @param languageCode - Telegram language code (e.g., 'zh-TW', 'en-US', 'ja')
 * @returns Flag emoji or earth emoji for unknown languages
 * 
 * @example
 * getCountryFlag('zh-TW') // → '🇹🇼'
 * getCountryFlag('en-US') // → '🇺🇸'
 * getCountryFlag('ja') // → '🇯🇵'
 * getCountryFlag('unknown') // → '🌍'
 * getCountryFlag(null) // → '🌍'
 */
export function getCountryFlag(languageCode: string | null | undefined): string {
  const countryCode = getCountryCodeFromLanguage(languageCode);
  
  if (!countryCode) {
    return '🌍'; // Earth emoji for unknown languages
  }
  
  return getCountryFlagEmoji(countryCode);
}

/**
 * Format nickname with country flag prefix
 * 
 * @param nickname - User's nickname
 * @param languageCode - Telegram language code
 * @returns Formatted nickname with flag prefix
 * 
 * @example
 * formatNicknameWithFlag('張三', 'zh-TW') // → '🇹🇼 張三'
 * formatNicknameWithFlag('John', 'en-US') // → '🇺🇸 John'
 * formatNicknameWithFlag('田中', null) // → '🌍 田中'
 */
export function formatNicknameWithFlag(
  nickname: string,
  languageCode: string | null | undefined
): string {
  const flag = getCountryFlag(languageCode);
  return `${flag} ${nickname}`;
}
```

---

### **2. 數據庫變更**

**需要存儲 `language_code` 嗎？**

✅ **是的**，建議存儲到 `users` 表：

**原因**：
1. Telegram Update 中的 `language_code` 不是每次都有
2. 存儲後可以在任何地方使用，不需要每次從 Telegram 獲取
3. 可以追蹤用戶語言變更

**Migration**：
```sql
-- 0045_add_language_code_to_users.sql
ALTER TABLE users 
ADD COLUMN language_code TEXT DEFAULT NULL;

CREATE INDEX idx_users_language_code 
ON users(language_code);
```

**更新邏輯**：
- 用戶首次註冊時存儲
- 用戶更改語言設置時更新
- 每次收到 Telegram Update 時檢查並更新（如果變更）

---

### **3. 修改顯示邏輯**

#### **資料卡**（`src/telegram/handlers/conversation_actions.ts`）

```typescript
// 獲取對方用戶信息
const otherUser = await findUserByTelegramId(db, otherUserId);

// 獲取國旗
import { formatNicknameWithFlag } from '~/utils/country_flag';
const nickname = formatNicknameWithFlag(
  maskNickname(otherUser.nickname || '匿名'),
  otherUser.language_code
);

// 構建資料卡
profileMessage += `📝 暱稱：${nickname}\n`;
```

#### **對話歷史帖子**（`src/services/conversation_history.ts`）

```typescript
import { formatNicknameWithFlag } from '~/utils/country_flag';

// 格式化暱稱
const partnerNickname = formatNicknameWithFlag(
  maskNickname(partner.nickname || '匿名'),
  partner.language_code
);
```

#### **統計頁面**（`src/telegram/handlers/stats.ts`）

```typescript
import { getCountryFlag } from '~/utils/country_flag';

// 顯示用戶信息
const flag = getCountryFlag(user.language_code);
statsMessage += `${flag} ${user.nickname}\n`;
```

---

## 🧪 測試計劃

### **單元測試**（`tests/country_flag.test.ts`）

```typescript
import { describe, it, expect } from 'vitest';
import {
  getCountryFlagEmoji,
  getCountryCodeFromLanguage,
  getCountryFlag,
  formatNicknameWithFlag
} from '~/utils/country_flag';

describe('Country Flag Utils', () => {
  describe('getCountryFlagEmoji', () => {
    it('should convert country code to flag emoji', () => {
      expect(getCountryFlagEmoji('TW')).toBe('🇹🇼');
      expect(getCountryFlagEmoji('US')).toBe('🇺🇸');
      expect(getCountryFlagEmoji('JP')).toBe('🇯🇵');
      expect(getCountryFlagEmoji('GB')).toBe('🇬🇧');
    });
    
    it('should return earth emoji for invalid codes', () => {
      expect(getCountryFlagEmoji('')).toBe('🌍');
      expect(getCountryFlagEmoji('X')).toBe('🌍');
      expect(getCountryFlagEmoji('ABC')).toBe('🌍');
    });
  });
  
  describe('getCountryCodeFromLanguage', () => {
    it('should map language codes to country codes', () => {
      expect(getCountryCodeFromLanguage('zh-TW')).toBe('TW');
      expect(getCountryCodeFromLanguage('zh-CN')).toBe('CN');
      expect(getCountryCodeFromLanguage('en-US')).toBe('US');
      expect(getCountryCodeFromLanguage('ja-JP')).toBe('JP');
    });
    
    it('should handle base language codes', () => {
      expect(getCountryCodeFromLanguage('ja')).toBe('JP');
      expect(getCountryCodeFromLanguage('ko')).toBe('KR');
      expect(getCountryCodeFromLanguage('th')).toBe('TH');
    });
    
    it('should return null for unknown languages', () => {
      expect(getCountryCodeFromLanguage('unknown')).toBeNull();
      expect(getCountryCodeFromLanguage(null)).toBeNull();
      expect(getCountryCodeFromLanguage(undefined)).toBeNull();
    });
  });
  
  describe('getCountryFlag', () => {
    it('should get flag from language code', () => {
      expect(getCountryFlag('zh-TW')).toBe('🇹🇼');
      expect(getCountryFlag('en-US')).toBe('🇺🇸');
      expect(getCountryFlag('ja')).toBe('🇯🇵');
    });
    
    it('should return earth emoji for unknown languages', () => {
      expect(getCountryFlag('unknown')).toBe('🌍');
      expect(getCountryFlag(null)).toBe('🌍');
      expect(getCountryFlag(undefined)).toBe('🌍');
    });
  });
  
  describe('formatNicknameWithFlag', () => {
    it('should format nickname with flag prefix', () => {
      expect(formatNicknameWithFlag('張三', 'zh-TW')).toBe('🇹🇼 張三');
      expect(formatNicknameWithFlag('John', 'en-US')).toBe('🇺🇸 John');
      expect(formatNicknameWithFlag('田中', 'ja')).toBe('🇯🇵 田中');
    });
    
    it('should use earth emoji for unknown languages', () => {
      expect(formatNicknameWithFlag('匿名', null)).toBe('🌍 匿名');
      expect(formatNicknameWithFlag('Unknown', 'xyz')).toBe('🌍 Unknown');
    });
  });
});
```

---

## 📋 實施步驟

### **Phase 1：基礎功能** ✅
1. [ ] 創建 `src/utils/country_flag.ts` 工具函數
2. [ ] 創建數據庫 Migration（`0045_add_language_code_to_users.sql`）
3. [ ] 更新用戶註冊邏輯，存儲 `language_code`
4. [ ] 編寫單元測試
5. [ ] 執行測試確保通過

### **Phase 2：UI 集成** ✅
6. [ ] 修改資料卡顯示邏輯
7. [ ] 修改對話歷史帖子顯示邏輯
8. [ ] 修改統計頁面顯示邏輯
9. [ ] 修改邀請列表顯示邏輯

### **Phase 3：測試和部署** ✅
10. [ ] Staging 環境測試
11. [ ] 檢查不同語言用戶的顯示效果
12. [ ] 檢查沒有 `language_code` 的用戶降級處理
13. [ ] Production 部署

---

## 🎯 預期效果

### **資料卡顯示**
```
👤 對方的資料卡

━━━━━━━━━━━━━━━━
📝 暱稱：🇹🇼 張**
🗣️ 語言：繁體中文
🧠 MBTI：INFP
⭐ 星座：處女座
🩸 血型：A型
👤 性別：女
🎂 年齡範圍：25-29 歲
━━━━━━━━━━━━━━━━
```

### **對話歷史帖子**
```
💬 與 🇯🇵 田中** 的對話記錄

[10:30] 你：你好！
[10:31] 對方：こんにちは！
[10:32] 你：很高興認識你
```

### **統計頁面**
```
📊 你的統計數據

👥 邀請的用戶：
1. 🇺🇸 John** (已激活)
2. 🇰🇷 김** (已激活)
3. 🇹🇭 สม** (未激活)
```

---

## 🔒 隱私考量

### **✅ 符合隱私規範**
1. **不收集 IP 地址**：只使用 Telegram 官方提供的 `language_code`
2. **用戶可控**：用戶可以在 Telegram 設置中更改語言
3. **非敏感信息**：語言偏好不是敏感個人信息
4. **符合 GDPR**：不涉及 IP 追蹤或地理位置

### **⚠️ 注意事項**
1. **不強制推測**：無法判斷時顯示 🌍，不強行猜測
2. **允許誤差**：語言 ≠ 國家，用戶可能使用非母語
3. **尊重隱私**：不顯示精確位置，只顯示國家/地區

---

## 📝 文檔更新

### **需要更新的文檔**
1. `doc/SPEC.md` - 添加國旗顯示功能說明
2. `doc/DEVELOPMENT_STANDARDS.md` - 添加國旗工具函數使用規範
3. `README.md` - 更新功能列表

---

## 🎉 總結

### **推薦方案**
✅ **使用 Telegram `language_code` 推測國家並顯示國旗**

### **優勢**
- 隱私友好，不需要 IP
- 準確度高，用戶主動設置
- 無額外 API 調用
- 符合 GDPR 規範

### **實施難度**
- ⭐⭐⭐☆☆（中等）
- 需要創建映射表和工具函數
- 需要數據庫 Migration
- 需要修改多個顯示邏輯

### **預計時間**
- 開發：2-3 小時
- 測試：1 小時
- 部署：30 分鐘
- **總計：3-4 小時**

---

**創建時間**：2025-11-21  
**狀態**：設計階段，待實施

