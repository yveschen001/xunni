# 智慧配對推播系統 (Smart Match Push System)

> **⚠️ 開發前必讀：設計與開發規範引用**
>
> 本功能的設計與實作必須嚴格遵守以下專案規範，以確保系統的一致性與品質：
>
> 1.  **設計規範標準 (`@doc/DESIGN_STANDARDS.md`)**
>     *   **隱私 (Privacy)**: 所有用戶暱稱顯示必須使用 `maskNickname()` 進行去識別化（如 `Alic***`）。
>     *   **國際化 (i18n)**: 禁止硬編碼文字。所有文案必須提取為 Key，並支援 34 種語言 fallback 機制。
>     *   **防死胡同 (No Dead Ends)**: 推播訊息下方的按鈕必須包含明確的行動（Action），若進入流程（如 `/throw`），必須提供「取消/返回」選項。
>     *   **語氣 (Tone)**: 訊息必須包含 Emoji，保持親切友善的風格。
>
> 2.  **UI 設計指南 (`@doc/UI_GUIDELINE.md`)**
>     *   **按鈕風格**: Inline Keyboard 的按鈕文字應簡潔，並附帶 Emoji。
>     *   **互動反饋**: 點擊按鈕後需有即時響應（`answerCallbackQuery`）。
>
> 3.  **開發規範 (`@doc/DEVELOPMENT_STANDARDS.md`)**
>     *   **模組化**: 配對邏輯應封裝在 `src/domain/compatibility/` 下，保持 Domain 層純淨。
>     *   **測試**: 核心配對算法必須包含單元測試。

---

## 1. 系統概覽

**智慧配對推播** 取代了原本的「每週運勢」設計。不再依賴外部繁重的運勢內容維護，而是利用使用者既有的屬性（MBTI、星座、血型），結合 **固定配對演算法** 與 **i18n 模板**，進行週期性的「配對推薦」召回。

### 核心優勢
1.  **零內容維護成本**：不需要每週撰寫/翻譯 34 種語言的運勢，邏輯與文案一次寫好，永久複用。
2.  **更強的交友動機**：比起運勢，使用者更關心「我跟誰最配」、「我去哪裡找對象」。
3.  **VIP 轉化鉤子**：推薦適合的類型後，自然引導使用者「升級 VIP 來精準篩選該類型」。

---

## 2. 運作邏輯 (Rotation Strategy)

系統採用 **每週輪替 (Weekly Rotation)** 策略，每週一針對不同主題進行推播，避免疲勞。

### 輪替主題週期
1.  **Week 1: 星座配對 (Zodiac Match)**
    -   依據使用者的星座，推薦 1-2 個最速配的星座。
2.  **Week 2: MBTI 性格共鳴 (MBTI Resonance)**
    -   依據使用者的 MBTI，推薦最互補或共鳴的類型（如 E 人配 I 人）。
3.  **Week 3: 血型密碼 (Blood Type Code)** (若使用者未設定則跳過)
    -   依據血型分析性格優勢，推薦適合的對象。
4.  **Week 4: 綜合/隨機主題**
    -   如「尋找同城夥伴」、「你的性格關鍵字」等。

---

## 3. 資料來源與配對邏輯

所有配對邏輯均為 **靜態數據 (Static Data)**，寫死在代碼或配置中 (`src/domain/compatibility/rules.ts`)。

### 3.1 星座配對規則 (範例)
採用占星學中廣泛認可的 **四象限元素法 (Four Elements)**：
| 用戶星座 (Element) | 推薦星座 | 推薦理由 Key |
| :--- | :--- | :--- |
| 火象 (牡羊/獅子/射手) | 火象星座 | `match.reason.fire_fire` (熱情奔放，默契十足) |
| 土象 (金牛/處女/魔羯) | 水象星座 | `match.reason.earth_water` (溫柔互補，細水長流) |
| 風象 (雙子/天秤/水瓶) | 火象星座 | `match.reason.air_fire` (風助火勢，充滿靈感) |
| 水象 (巨蟹/天蠍/雙魚) | 土象星座 | `match.reason.water_earth` (互相依賴，穩定踏實) |

### 3.2 MBTI 配對規則 (範例)
採用 **Keirsey 氣質分類** 與 **Socionics Duality** 簡化版：
-   **SP (探險家)** 配 **SJ (社群人)**：互補（穩定 vs 刺激）。
-   **NF (理想主義者)** 配 **NT (理性者)**：靈魂共鳴。
-   **同類相吸**：特定情況下推薦相同類型。

### 3.3 血型配對規則 (範例)
採用日韓流行的血型性格分析：
-   **A型** 適合 **O型** (細心配包容)。
-   **B型** 適合 **O型** (自我配隨和)。
-   **AB型** 適合 **AB型** 或 **B型** (獨特頻率)。

---

## 4. 推播內容模板 (i18n)

使用固定的模板結構，只需翻譯一次。

### 訊息結構
```text
[Header Emoji] [標題]

[使用者屬性] 的你，
根據 [理論名稱] 分析，你與 [推薦屬性] 最有緣份！

💡 [推薦理由]

👇 試試運氣？
```

### 範例 (zh-TW)
```text
🌟 星座配對揭秘

♈️ 牡羊座 的你，
根據星象分析，你與 ♌️ 獅子座 是天生一對！

💡 推薦理由：
同樣身為火象星座的你們，熱情如火，在一起總是有聊不完的話題，默契十足！

👇 丟個瓶子，看看能不能遇到獅子座的 TA？
```

### 按鈕設計 (Inline Keyboard)
1.  **[🌊 丟個瓶子碰碰運氣]** (針對所有用戶)
    -   **行為**：觸發 `/throw` (標準流程)。
    -   **Upsell**：操作後提示「💡 升級 VIP 即可指定投遞給 [推薦屬性] 的對象，精準脫單！」。

2.  **[🎯 丟給獅子座 (VIP)]** (針對 VIP 用戶 / 或免費用戶的 Upsell 按鈕)
    -   **行為 (VIP)**：觸發帶參數 `/throw?target_zodiac=leo`，**自動略過篩選步驟**，直接進入內容輸入。
    -   **行為 (免費)**：彈出 VIP 介紹，「想只把瓶子丟給獅子座？升級 VIP 解鎖精準篩選！」。

---

## 5. 系統架構變更

### 5.1 資料庫
-   `user_push_preferences` 表保持不變，重用或新增 `match_push_enabled` 欄位（UI 顯示為「配對推薦」）。

### 5.2 新增模組 (`src/domain/compatibility/`)
-   `rules.ts`: 包含星座、MBTI、血型的靜態配對規則表。
-   `engine.ts`: 核心引擎，輸入 `User` 物件與 `Topic`，輸出推薦結果 `MatchRecommendation`。

### 5.3 Cron Job (`/cron/match_push`)
-   每週一執行。
-   計算本週是第幾週 (`weekNumber % 3`) 決定主題。
-   遍歷活躍使用者：
    1.  呼叫 `CompatibilityEngine.getRecommendation(user, topic)`。
    2.  組裝 i18n 訊息。
    3.  發送推播。

---

## 6. 開發計畫 (Checklist)

- [ ] **Step 1: Domain 邏輯**
    - [ ] 建立 `src/domain/compatibility/rules.ts` (定義靜態規則)。
    - [ ] 建立 `src/domain/compatibility/engine.ts` (實作配對引擎)。
    - [ ] 撰寫單元測試 `tests/domain/compatibility.test.ts`。

- [ ] **Step 2: i18n 資源**
    - [ ] 在 `src/i18n/locales/zh-TW.ts` 新增配對相關 Keys (`match.reason.*`, `match.template.*`)。
    - [ ] 執行 `pnpm i18n:sync` 同步到所有語言。

- [ ] **Step 3: Handler 改造**
    - [ ] 修改 `/throw` handler，支援 `target_zodiac` 等 Query 參數（實現 VIP 自動鎖定）。

- [ ] **Step 4: Cron Job**
    - [ ] 實作 `/cron/match_push` 邏輯。
    - [ ] 整合 `SafeSender` 進行發送。

- [ ] **Step 5: 驗收與測試**
    - [ ] 執行 Smoke Test。
    - [ ] 部署到 Staging 驗證 VIP 與免費用戶的行為差異。
