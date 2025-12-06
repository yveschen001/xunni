# UI 按鈕布局評估報告

> **評估日期**: 2025-01-15  
> **問題**: 多語言按鈕文字被截斷（如日文 "祈りのメ...ボトルを拾う"）

## 1. 問題分析

### 1.1 當前問題
- **截圖顯示**：日文按鈕 "🎣 祈りのメッセージボトルを拾う" 被截斷為 "祈りのメ...ボトルを拾う"
- **影響範圍**：34 種語言，每種語言的按鈕文字長度不同
- **根本原因**：Telegram Bot API 的按鈕寬度限制

### 1.2 Telegram Bot API 限制
根據 [Telegram Bot API 官方文檔](https://core.telegram.org/bots/api#inlinekeyboardmarkup)：

1. **按鈕寬度**：
   - 按鈕寬度會根據**同一行中按鈕的數量**和**文字長度**自動調整
   - 同一行的按鈕會**平分可用寬度**
   - 如果文字過長，Telegram 會**自動截斷**並顯示 "..."

2. **無法直接控制**：
   - ❌ 無法設置按鈕為「全寬」
   - ❌ 無法強制按鈕與聊天窗口同寬
   - ❌ 無法設置最小/最大按鈕寬度

3. **唯一解決方案**：
   - ✅ **每行只放一個按鈕**：這樣按鈕可以占滿整行寬度
   - ✅ **縮短按鈕文字**：使用更簡潔的文字
   - ✅ **使用圖標代替部分文字**：例如只用 emoji + 簡短文字

## 2. 當前按鈕布局分析

### 2.1 受影響的頁面

#### 主菜單 (`src/telegram/handlers/menu.ts`)
```typescript
[
  [
    { text: i18n.t('menu.buttonThrow'), callback_data: 'menu_throw' },
    { text: i18n.t('menu.buttonCatch'), callback_data: 'menu_catch' },
  ],
  // ... 其他按鈕
]
```
- **問題**：每行 2 個按鈕，長文字會被截斷

#### 註冊完成歡迎頁面 (`src/telegram/handlers/start.ts`)
```typescript
[
  [
    { text: i18n.t('buttons.bottle3'), callback_data: 'throw' },
    { text: i18n.t('buttons.bottle4'), callback_data: 'catch' },
  ],
  [
    { text: i18n.t('buttons.profile2'), callback_data: 'profile' },
    { text: i18n.t('buttons.stats'), callback_data: 'stats' },
  ],
]
```
- **問題**：`buttons.bottle4` 日文為 "🎣 祈りのメッセージボトルを拾う"（15 個字符），與 `bottle3` 並排時被截斷

#### 任務中心 (`src/telegram/handlers/tasks.ts`)
```typescript
actionRow.push({ text: i18n.t('buttons.bottle3'), callback_data: 'throw' });
actionRow.push({ text: i18n.t('buttons.bottle4'), callback_data: 'catch' });
```
- **問題**：同樣的並排布局

#### 其他頁面
- `onboarding_callback.ts` (line 1067-1068)
- `tutorial.ts` (line 157-158)

### 2.2 文字長度分析（34 種語言）

**關鍵按鈕文字長度對比**：

| 按鈕 Key | 繁體中文 | 日文 | 英文 | 韓文 | 最長 |
|---------|---------|------|------|------|------|
| `buttons.bottle3` | 🌊 祈りのボトルを送信 (11) | 🌊 祈りのボトルを送信 (11) | 🌊 Send Blessing Bottle (22) | 🌊 축복 병 보내기 (10) | 22 |
| `buttons.bottle4` | 🎣 祈りのメッセージボトルを拾う (15) | 🎣 祈りのメッセージボトルを拾う (15) | 🎣 Pick Up Blessing Bottle (23) | 🎣 축복 병 받기 (9) | 23 |
| `menu.buttonThrow` | 🌊 祈りのボトルメールを投げる (13) | 🌊 祈りのボトルメールを投げる (13) | 🌊 Throw Bottle (13) | - | 13 |
| `menu.buttonCatch` | 🎣 恩恵祈りのボトルを拾いました (14) | 🎣 恩恵祈りのボトルを拾いました (14) | 🎣 Catch Bottle (13) | - | 14 |

**結論**：英文和日文文字最長，最容易出現截斷問題。

## 3. 解決方案評估

### 方案 1：每行只放一個按鈕（推薦）✅

**優點**：
- ✅ 按鈕可以占滿整行寬度，文字不會被截斷
- ✅ 適用於所有 34 種語言
- ✅ 不需要修改 i18n 文字

**缺點**：
- ⚠️ 按鈕數量增加，頁面變長
- ⚠️ 需要修改 Handlers 代碼（違反維護模式規則）

**需要修改的文件**：
- `src/telegram/handlers/menu.ts`
- `src/telegram/handlers/start.ts`
- `src/telegram/handlers/tasks.ts`
- `src/telegram/handlers/onboarding_callback.ts`
- `src/telegram/handlers/tutorial.ts`

**修改示例**：
```typescript
// 修改前（每行 2 個）
[
  [
    { text: i18n.t('buttons.bottle3'), callback_data: 'throw' },
    { text: i18n.t('buttons.bottle4'), callback_data: 'catch' },
  ],
]

// 修改後（每行 1 個）
[
  [{ text: i18n.t('buttons.bottle3'), callback_data: 'throw' }],
  [{ text: i18n.t('buttons.bottle4'), callback_data: 'catch' }],
]
```

### 方案 2：縮短按鈕文字（不推薦）❌

**優點**：
- ✅ 不需要修改 Handlers 代碼
- ✅ 只修改 i18n 文件（符合維護模式）

**缺點**：
- ❌ 需要為 34 種語言都縮短文字，可能影響語義清晰度
- ❌ 日文 "祈りのメッセージボトルを拾う" 已經很簡潔，再縮短可能失去語義
- ❌ 違反「最小化修改原則」（不要改動已經正確的內容）

### 方案 3：混合方案（部分頁面改為單行）✅

**策略**：
- 對於**長文字按鈕**（如 `buttons.bottle4`），改為每行 1 個
- 對於**短文字按鈕**（如 `buttons.stats`），保持每行 2 個

**優點**：
- ✅ 平衡按鈕數量和文字完整性
- ✅ 只修改有問題的按鈕

**缺點**：
- ⚠️ 需要判斷哪些按鈕文字較長（需要檢查 34 種語言）

## 4. 維護模式合規性評估

### 4.1 是否符合維護模式規則？

**Frozen Zone 規則**：
- `src/telegram/handlers/*` 屬於 **Frozen Zone**
- UI Display Logic 屬於 **ABSOLUTELY FORBIDDEN**

**例外條件**：
- ✅ **Critical Bug Fixes**：按鈕文字被截斷屬於**用戶體驗問題**，可能影響功能使用
- ❌ 不屬於運行時錯誤或邏輯失敗

**結論**：
- ⚠️ **需要用戶明確授權**才能修改 Handlers
- ⚠️ 或者可以通過**縮短 i18n 文字**來解決（但違反「最小化修改原則」）

### 4.2 建議的處理方式

1. **優先方案**：修改 Handlers，將長文字按鈕改為每行 1 個
   - 需要用戶明確授權
   - 符合「Critical Bug Fixes」例外條件

2. **備選方案**：縮短 i18n 文字
   - 不需要修改 Handlers
   - 但需要為 34 種語言都調整文字
   - 可能影響語義清晰度

## 5. 實施計劃（如果獲得授權）

### 5.1 需要修改的文件清單

1. `src/telegram/handlers/menu.ts` (line 204-225)
2. `src/telegram/handlers/start.ts` (line 189-198)
3. `src/telegram/handlers/tasks.ts` (line 274-275)
4. `src/telegram/handlers/onboarding_callback.ts` (line 1066-1073)
5. `src/telegram/handlers/tutorial.ts` (line 157-158)

### 5.2 修改策略

**策略 A：全部改為單行**（最安全）
- 所有按鈕都改為每行 1 個
- 確保所有語言都不會被截斷

**策略 B：只改長文字按鈕**（平衡）
- 只將 `buttons.bottle3`、`buttons.bottle4` 等長文字按鈕改為單行
- 短文字按鈕（如 `buttons.stats`）保持每行 2 個

### 5.3 測試計劃

1. **視覺測試**：
   - 測試日文、英文、韓文、中文等長文字語言
   - 確認按鈕文字完整顯示，無截斷

2. **功能測試**：
   - 確認所有按鈕點擊功能正常
   - 確認 callback_data 正確傳遞

3. **跨語言測試**：
   - 測試所有 34 種語言
   - 確認按鈕布局在所有語言下都正常

## 6. 結論與建議

### 6.1 技術可行性
✅ **完全可行**：Telegram Bot API 支持每行 1 個按鈕，按鈕會自動占滿整行寬度。

### 6.2 維護模式合規性
⚠️ **需要授權**：修改 Handlers 需要用戶明確授權，但符合「Critical Bug Fixes」例外條件。

### 6.3 推薦方案
**推薦方案 1（全部改為單行）**：
- 最安全，適用於所有語言
- 需要修改 5 個 Handler 文件
- 按鈕數量增加，但文字完整

**推薦方案 2（混合方案）**：
- 只改長文字按鈕為單行
- 短文字按鈕保持每行 2 個
- 需要判斷哪些按鈕文字較長

### 6.4 下一步行動
1. **等待用戶授權**修改 Handlers
2. **或選擇縮短 i18n 文字**（不推薦，但符合維護模式）
3. **實施選定的方案**
4. **測試所有 34 種語言**

---

**報告生成時間**: 2025-01-15  
**評估者**: AI Assistant  
**狀態**: 等待用戶決策

