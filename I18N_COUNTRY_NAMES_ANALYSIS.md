# 国家名称 i18n 分析报告

**检查时间**: 2025-01-23  
**问题**: 为什么有些国家名称有国旗 emoji，有些没有？是否需要 i18n？

---

## 🔍 发现

### 1. 两种不同的国家名称来源

#### A. `buttons.short7-17`（有国旗 emoji）
**来源**: `src/telegram/handlers/country_selection.ts`
- 这些是**用户可见的 UI 按钮文字**
- 包含国旗 emoji（如 `🇹🇼 台灣`）
- **需要 i18n** ✅

**使用位置**:
```typescript
// country_selection.ts
const buttons = [
  [
    { text: '🇹🇼 台灣', callback_data: 'country_set_TW' },
    { text: '🇨🇳 中國', callback_data: 'country_set_CN' },
    // ...
  ],
];
```

**覆盖范围**: 15 个热门国家
- 🇹🇼 台灣、🇨🇳 中國、🇭🇰 香港
- 🇺🇸 美國、🇯🇵 日本、🇰🇷 韓國
- 🇬🇧 英國、🇫🇷 法國、🇩🇪 德國
- 🇸🇬 新加坡、🇲🇾 馬來西亞、🇹🇭 泰國
- 🇦🇺 澳洲、🇨🇦 加拿大、🇳🇿 紐西蘭
- 🇺🇳 聯合國旗

---

#### B. `countries.short*`（无国旗 emoji）
**来源**: `src/utils/country_flag.ts` 中的 `COUNTRY_NAMES` 对象
- 这些是**内部映射表**，用于 `getCountryName()` 函数
- **不包含国旗 emoji**（如 `意大利`）
- **部分需要 i18n** ⚠️

**使用位置**:
```typescript
// country_flag.ts
const COUNTRY_NAMES: Record<string, string> = {
  'TW': '台灣',
  'CN': '中國',
  'IT': '意大利',  // ← 这个会被显示给用户
  'ES': '西班牙',  // ← 这个会被显示给用户
  // ... 100+ 个国家
};

export function getCountryName(countryCode: string): string {
  return COUNTRY_NAMES[countryCode] || countryCode;
}
```

**被调用的位置**:
1. `country_confirmation.ts` - 显示给用户：
   ```typescript
   const currentCountry = getCountryName(user.country_code || 'UN');
   const message = `${currentFlag} **${currentCountry}**`;  // ← 用户可见
   ```

2. `country_confirmation.ts` - callback 回复：
   ```typescript
   const countryName = getCountryName(countryCode);
   await telegram.answerCallbackQuery(..., `✅ 已設置為 ${flag} ${countryName}`);  // ← 用户可见
   ```

---

## ⚠️ 问题分析

### 问题 1: 为什么有些有国旗，有些没有？

**答案**:
- `country_selection.ts` 中的按钮是**手动硬编码**的，开发者手动添加了国旗 emoji
- `COUNTRY_NAMES` 是**内部映射表**，只包含国家名称，国旗通过 `getCountryFlagEmoji()` 函数动态生成

### 问题 2: 这些国家名称是否会被用户看到？

**答案**: **部分会，部分不会**

**会被用户看到的情况**:
1. ✅ `country_selection.ts` 中的 15 个按钮（`buttons.short7-17`）- **需要 i18n**
2. ✅ `country_confirmation.ts` 中显示的国家名称（通过 `getCountryName()`）- **需要 i18n**
3. ✅ Callback 回复中的国家名称 - **需要 i18n**

**不会被用户看到的情况**:
- `COUNTRY_NAMES` 中的其他 100+ 个国家名称，如果用户无法选择它们，就不会被显示

### 问题 3: 用户能否选择所有 100+ 个国家？

**答案**: **不能**

**实际情况**:
- `country_selection.ts` 只显示了 15 个热门国家
- 用户只能从这 15 个中选择
- 其他 100+ 个国家虽然存在于 `COUNTRY_NAMES` 中，但**用户无法直接选择**

**但是**:
- 如果通过其他方式（如数据库直接设置、API 调用等）设置了其他国家的 `country_code`
- `getCountryName()` 会返回对应的繁体中文名称
- 这些名称**会被显示给用户**（在确认对话框中）

---

## 📋 建议处理方案

### 方案 A: 完整 i18n（推荐）✅

**处理所有国家名称**:
- ✅ `buttons.short7-17`：需要 i18n（15 个按钮）
- ✅ `countries.short*`：需要 i18n（100+ 个国家名称）

**理由**:
1. `getCountryName()` 返回的名称会被显示给用户
2. 即使现在用户只能选择 15 个国家，未来可能会扩展
3. 如果通过其他方式设置了其他国家代码，名称会被显示
4. **完整性**：确保所有用户可见的内容都支持多语言

**实施**:
- 将 `COUNTRY_NAMES` 改为使用 `i18n.t()` 调用
- 在 locale 文件中添加所有国家名称的翻译

---

### 方案 B: 部分 i18n（不推荐）❌

**只处理按钮文字**:
- ✅ `buttons.short7-17`：需要 i18n
- ❌ `countries.short*`：不处理（假设用户只能选择 15 个国家）

**问题**:
- 如果用户通过其他方式设置了其他国家代码，名称仍然是繁体中文
- 未来扩展时需要重新处理
- 不完整

---

## 🎯 推荐方案：方案 A（完整 i18n）

### 实施步骤

1. **保留 `buttons.short7-17`**（已提取）
   - 这些是按钮文字，包含国旗 emoji
   - 需要 i18n

2. **处理 `countries.short*`**（已提取，但需要确认）
   - 这些是国家名称，不包含国旗 emoji
   - 需要 i18n（因为会被 `getCountryName()` 使用）

3. **修改 `country_flag.ts`**
   ```typescript
   // 修改前
   export function getCountryName(countryCode: string): string {
     return COUNTRY_NAMES[countryCode] || countryCode;
   }
   
   // 修改后
   export function getCountryName(
     countryCode: string,
     languageCode: string = 'zh-TW'
   ): string {
     const i18n = createI18n(languageCode);
     const key = `countries.${countryCode.toLowerCase()}`;
     return i18n.t(key) || countryCode;
   }
   ```

4. **更新调用位置**
   - `country_confirmation.ts` 中需要传递 `user.language_pref`

---

## 📊 当前提取状态

### 已提取的内容

1. **`buttons.short7-17`**（15 个）
   - ✅ 已提取到 CSV
   - ✅ 包含国旗 emoji
   - ✅ 需要 i18n

2. **`countries.short*`**（72 个）
   - ✅ 已提取到 CSV
   - ❌ 不包含国旗 emoji
   - ⚠️ 需要确认是否全部需要 i18n

### 缺失的内容

- `COUNTRY_NAMES` 中总共有 **120 个国家**
- CSV 中只提取了 **72 个**（`countries.short` 到 `countries.short72`）
- **还有 48 个国家没有被提取**，包括：
  - `'MO': '澳門'`（澳门）
  - `'BR': '巴西'`（巴西）
  - `'CL': '智利'`（智利）
  - `'PL': '波蘭'`（波兰）
  - `'VN': '越南'`（越南）
  - `'ID': '印尼'`（印尼）
  - `'IN': '印度'`（印度）
  - 等等...

**问题**：
- 如果这些国家的代码被设置（通过其他方式），`getCountryName()` 会返回繁体中文
- 这些名称会被显示给用户，但没有 i18n 支持

---

## ✅ 结论

1. **`buttons.short7-17`**：✅ **必须 i18n**（用户可见的按钮，15 个）
2. **`countries.short*`**：✅ **应该 i18n**（会被 `getCountryName()` 使用，用户可见，72 个已提取）
3. **缺失的 48 个国家**：⚠️ **需要补充提取**（`COUNTRY_NAMES` 中还有 48 个国家没有被提取）
4. **国旗 emoji**：✅ **应该保留**（通过 `getCountryFlagEmoji()` 动态生成，不需要 i18n）

**建议**：
- ✅ 保留所有已提取的国家名称（72 个）
- ⚠️ **补充提取缺失的 48 个国家**（确保 `COUNTRY_NAMES` 中的所有国家都有 i18n key）
- ✅ 在替换阶段，将 `getCountryName()` 改为使用 i18n
- ✅ 确保所有用户可见的国家名称都支持多语言

**关键发现**：
- 虽然用户只能从 15 个热门国家中选择，但 `COUNTRY_NAMES` 中的其他 105 个国家也可能被使用（通过其他方式设置）
- 为了完整性，**应该提取所有 120 个国家名称**

---

**检查完成** ✅

