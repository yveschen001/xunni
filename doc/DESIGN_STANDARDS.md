# XunNi 設計規範標準 (Design Standards)

> **⚠️ 重要：此文檔是專案的「設計憲法」。所有新功能開發、代碼審查與 AI 協作都必須嚴格遵守此文檔中的規範。**

本規範整合了隱私安全、國際化、使用者體驗 (UX) 與資料庫設計的核心原則。

---

## 1. 隱私與安全 (Privacy & Security)

### 1.1 暱稱去識別化 (Nickname Masking)
所有系統發送的通知、公告或公開顯示的介面中，若涉及他人暱稱，**必須**進行遮罩處理。

*   **規則**：使用 `maskNickname()` 函數處理。
*   **範例**：
    *   ❌ `Alice`
    *   ✅ `Alic***`
*   **適用場景**：
    *   邀請成功通知
    *   撿瓶通知（在未建立對話前）
    *   主動推送（如「未回覆喚醒」）
    *   公開排行榜（若有）

### 1.2 ID 隱藏原則
*   **絕對禁止**在 UI 上顯示真實的 `telegram_id`。
*   除管理員後台外，所有用戶 ID 應在內部流轉，對外不可見。

### 1.3 連結過濾 (URL Filtering)
*   所有用戶輸入的內容（漂流瓶、聊天訊息、個人簡介）若包含 URL，**必須**經過白名單檢查。
*   **工具**：`src/utils/url-whitelist.ts`

---

## 2. 國際化 (i18n & Content)

### 2.1 強制 i18n
*   **禁止硬編碼**：代碼中絕對不允許出現硬編碼的中文或其他語言字串（Log 除外）。
*   **鍵值規範**：使用 `i18n.t('category.key')`。
*   **同步要求**：新增 key 後，必須執行 `pnpm i18n:sync` 確保所有語言檔同步。

### 2.2 文案風格 (Tone & Voice)
*   **親切友善**：使用口語化、溫暖的語氣。
*   **Emoji 必備**：所有對用戶的訊息（Message）都應該包含至少一個相關的 Emoji，增加活潑感。
    *   ✅ `🎉 恭喜你配對成功！`
    *   ❌ `配對成功。`
*   **動態變數 Fallback**：所有插值變數（如 `{name}`）都必須有預設值（如「新朋友」），防止變數缺失導致顯示異常。

---

## 3. 使用者體驗 (UX / Interaction Design)

### 3.1 防死胡同原則 (No Dead Ends)
用戶在 Bot 中的任何操作，都不應該進入「無路可退」的狀態。

*   **規則**：每個層級的選單、錯誤提示、成功提示或表單流程中，**必須**提供導航按鈕。
*   **標準按鈕**：
    *   `[🔙 返回上頁]` (Back)
    *   `[🏠 回主選單]` (Main Menu)
*   **場景範例**：
    *   填寫表單到一半想放棄 -> 提供「取消並返回」按鈕。
    *   操作成功後 -> 提供「繼續操作」或「回主選單」按鈕。
    *   系統錯誤時 -> 提供「重試」或「回主選單」按鈕。

### 3.2 可操作通知 (Actionable Notifications)
所有推送通知不應只是單純的文字告知，必須包含「下一步動作」的按鈕。

*   **規則**：使用 Inline Keyboard 提供 Deep Link 或 Callback Action。
*   **範例**：
    *   通知：「你有未讀訊息」 -> 按鈕：`[💬 立即回覆]`
    *   通知：「撿到瓶子」 -> 按鈕：`[🔍 查看詳情]`

### 3.3 狀態反饋 (Feedback)
*   **即時響應**：用戶點擊按鈕後，必須立即給予反饋（`answerCallbackQuery` 或編輯訊息）。
*   **Toast 提示**：對於輕量操作（如切換開關），使用 `answerCallbackQuery` 顯示上方 Toast，不要發送新訊息干擾視線。

---

## 4. 資料庫設計 (Database Schema)

### 4.1 命名規範
*   **表名/欄位名**：統一使用 **蛇形命名法 (snake_case)**。
    *   ✅ `user_preferences`
    *   ❌ `UserPreferences`, `userPreferences`
*   **布林值**：使用 `is_` 或 `has_` 前綴（如 `is_vip`, `has_completed`），儲存為 `INTEGER` (0/1)。

### 4.2 必備欄位
所有資料表（除了關聯表外）都應包含：
*   `id` (PRIMARY KEY)
*   `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)
*   `updated_at` (DATETIME)

### 4.3 軟刪除 (Soft Delete)
*   **原則**：核心數據（用戶、瓶子、對話）**不進行物理刪除**。
*   **實作**：使用 `deleted_at` 欄位。若不為 NULL，視為已刪除。
*   **查詢**：所有查詢必須預設過濾 `WHERE deleted_at IS NULL`。

---

## 5. 相關文檔索引

*   **代碼規範**：詳見 [`@doc/DEVELOPMENT_STANDARDS.md`](./DEVELOPMENT_STANDARDS.md)
*   **UI 設計 (Mini App)**：詳見 [`@doc/UI_GUIDELINE.md`](./UI_GUIDELINE.md)
*   **i18n 技術指南**：詳見 [`@doc/I18N_GUIDE.md`](./I18N_GUIDE.md)
*   **業務規格**：詳見 [`@doc/SPEC.md`](./SPEC.md)

---

**最後更新**: 2025-11-21

