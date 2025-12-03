# XunNi 廣播系統設計文檔

> **最後更新**：2025-11-21  
> **版本**：v2.1（增強版 - 含自動化擴展接口）

---

## 📋 目錄

1. [系統概覽](#系統概覽)
2. [現有功能](#現有功能)
3. [資料庫設計](#資料庫設計)
4. [現有指令](#現有指令)
5. [新增需求：精準過濾](#新增需求精準過濾)
6. [實施方案](#實施方案)
7. [技術實現](#技術實現)
8. [測試計劃](#測試計劃)
9. [部署計劃](#部署計劃)
10. [限制與注意事項](#限制與注意事項)
11. [總結](#總結)
12. [未來擴展：自動化系統廣播](#未來擴展自動化系統廣播)

---

## 1. 系統概覽

### 1.1 功能定位

XunNi 廣播系統是一個**超級管理員專用**的訊息推送工具，同時也是整個平台的**通用通知基礎設施**。

### 1.1.1 作為基礎設施 (Shared Infrastructure)
本系統的核心模組必須設計為**可復用 (Reusable)**，以支援 [主動推送系統](./PUSH_NOTIFICATIONS.md)：

1.  **安全發送器 (SafeSender / NotificationService)**：
    *   負責 `Telegram API 調用` + `錯誤處理 (Error Handling)` + `用戶狀態更新 (Block Detection)`。
    *   **所有** 系統發出的訊息（包含漂流瓶通知、驗證碼等）都應最終調用此模組，以確保不會向已封鎖的用戶發送訊息。
2.  **過濾引擎 (FilterEngine)**：
    *   負責將 JSON 過濾條件轉換為 SQL 查詢。
    *   供主動推送系統篩選目標用戶（如：篩選 "30天未活躍" 用戶）。

### 1.2 核心特性

- ✅ **分批發送**：自動分批，避免觸發 Telegram 速率限制
- ✅ **進度追蹤**：實時查看發送進度和狀態
- ✅ **錯誤處理**：自動分類錯誤（封鎖、刪除、無效）
- ✅ **安全限制**：目前限制 ≤100 用戶（避免系統過載）
- ✅ **智能過濾**：只推送給 30 天內活躍用戶
- ✅ **動態過濾接口**：支援自動化任務調用（New）
- ✅ **自動翻譯**：根據目標用戶語言自動翻譯廣播內容（New）
- ⚠️ **Telegram 合規**：自動排除已封鎖/刪除 Bot 的用戶（**關鍵安全機制**）

### 1.3 自動翻譯機制 (New)

系統支援將管理員的廣播訊息自動翻譯成用戶的首選語言。

1.  **預處理翻譯**：
    *   廣播創建時，系統分析目標用戶群的語言分佈（如：en, ja, th）。
    *   預先調用翻譯服務，將原訊息（如 zh-TW）翻譯成目標語言。
    *   將翻譯結果存儲在 `broadcast_translations` 表中。
2.  **動態發送**：
    *   發送時，根據每個用戶的 `language_pref` 匹配對應的翻譯內容。
    *   若無對應翻譯，自動降級使用原訊息。
3.  **優勢**：
    *   只需翻譯一次（34種語言），而非發送時翻譯（N個用戶）。
    *   大幅節省 Token 成本和發送延遲。

### 1.4 ⚠️ Telegram 政策與安全規範

**重要**：向已封鎖 Bot 的用戶發送訊息違反 Telegram 政策，可能導致 Bot 被限制或封禁。

#### 1.3.1 用戶狀態管理

我們使用 `users.bot_status` 欄位追蹤用戶與 Bot 的互動狀態：

| 狀態 | 說明 | 是否可發送 | 如何產生 |
|------|------|-----------|---------|
| `active` | 正常用戶 | ✅ 可以 | 預設狀態 |
| `blocked` | 用戶已封鎖 Bot | ❌ **禁止** | Telegram 返回 403 錯誤 |
| `deleted` | 用戶帳號已刪除 | ❌ **禁止** | Telegram 返回 400 "user not found" |
| `deactivated` | 用戶帳號已停用 | ❌ **禁止** | Telegram 返回 400 "deactivated" |
| `invalid` | 無效用戶 ID | ❌ **禁止** | Telegram 返回其他無效錯誤 |

#### 1.3.2 自動錯誤處理機制

**實現位置**：`src/services/telegram_error_handler.ts`

當廣播發送失敗時，系統會：
1. 解析 Telegram API 錯誤碼和描述
2. 自動標記用戶的 `bot_status`
3. 記錄 `bot_status_updated_at` 時間戳
4. 增加 `failed_delivery_count` 計數器

**範例**：
```typescript
// 用戶封鎖 Bot 後，Telegram 返回：
// { error_code: 403, description: "Forbidden: bot was blocked by the user" }

// 系統自動執行：
UPDATE users 
SET bot_status = 'blocked',
    bot_status_updated_at = CURRENT_TIMESTAMP,
    failed_delivery_count = failed_delivery_count + 1
WHERE telegram_id = ?
```

#### 1.3.3 廣播查詢的強制過濾

**所有廣播查詢都必須包含以下條件**：

```sql
WHERE bot_status = 'active'      -- ⚠️ 關鍵：只查詢正常用戶
  AND deleted_at IS NULL         -- 排除已刪除帳號
  AND onboarding_step = 'completed'  -- 排除未完成註冊
```

**違反此規範的後果**：
- ❌ 向已封鎖用戶發送 → Telegram 可能限制 Bot
- ❌ 向已刪除用戶發送 → 浪費 API 配額
- ❌ 累積過多失敗 → 影響 Bot 信譽評分

### 1.3 權限控制

- **超級管理員**（`SUPER_ADMIN_USER_ID`）：擁有所有廣播權限
- **系統自動化任務**（Cron）：可調用廣播接口
- **普通用戶**：無法使用廣播功能

---

## 2. 現有功能

### 2.1 已實現的廣播類型

| 指令 | 目標用戶 | 說明 |
|------|---------|------|
| `/broadcast` | 所有用戶 | 推送給所有活躍用戶 |
| `/broadcast_vip` | VIP 用戶 | 僅推送給 VIP 會員 |
| `/broadcast_non_vip` | 非 VIP 用戶 | 僅推送給免費用戶 |

### 2.2 管理指令

| 指令 | 功能 | 說明 |
|------|------|------|
| `/broadcast_status` | 查看廣播狀態 | 查看最近 5 條廣播記錄 |
| `/broadcast_status <id>` | 查看特定廣播 | 查看某個廣播的詳細進度 |
| `/broadcast_process` | 手動觸發處理 | 手動處理卡住的廣播隊列 |
| `/broadcast_cancel <id>` | 取消廣播 | 取消待處理或發送中的廣播 |
| `/broadcast_cleanup` | 清理卡住廣播 | 標記卡住的廣播為失敗 |

### 2.3 智能過濾規則

**目前已實現的自動過濾**：

```sql
SELECT telegram_id 
FROM users 
WHERE onboarding_step = 'completed'      -- 已完成註冊
  AND deleted_at IS NULL                 -- 未刪除
  AND bot_status = 'active'              -- 未封鎖 bot
  AND last_active_at >= datetime('now', '-30 days')  -- 30 天內活躍
```

---

## 3. 資料庫設計

### 3.1 `broadcasts` 表結構

```sql
CREATE TABLE IF NOT EXISTS broadcasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 廣播內容
  message TEXT NOT NULL,                 -- 廣播訊息內容
  target_type TEXT NOT NULL              -- 目標類型：'all', 'vip', 'non_vip', 'system'
    CHECK(target_type IN ('all', 'vip', 'non_vip', 'system')),
  
  -- 透過 filters 欄位支援未來的擴展，無需頻繁修改 Schema
  filters TEXT DEFAULT NULL,             -- JSON 格式的過濾條件
  
  -- 發送狀態
  status TEXT DEFAULT 'pending'          -- 狀態：pending, sending, completed, failed, cancelled
    CHECK(status IN ('pending', 'sending', 'completed', 'failed', 'cancelled')),
  total_users INTEGER DEFAULT 0,         -- 目標用戶總數
  sent_count INTEGER DEFAULT 0,          -- 成功發送數
  failed_count INTEGER DEFAULT 0,        -- 失敗數
  blocked_count INTEGER DEFAULT 0,       -- 被封鎖數
  deleted_count INTEGER DEFAULT 0,       -- 已刪除數
  invalid_count INTEGER DEFAULT 0,       -- 無效用戶數
  
  -- 時間戳記
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  started_at TEXT,                       -- 開始發送時間
  completed_at TEXT,                     -- 完成時間
  
  -- 元數據
  created_by TEXT NOT NULL,              -- 創建者 telegram_id 或 'SYSTEM'
  error_message TEXT                     -- 錯誤訊息
);

CREATE INDEX IF NOT EXISTS idx_broadcasts_status ON broadcasts(status);
CREATE INDEX IF NOT EXISTS idx_broadcasts_created_at ON broadcasts(created_at);
CREATE INDEX IF NOT EXISTS idx_broadcasts_filters ON broadcasts(filters);
```

### 3.2 `users` 表相關欄位

**廣播系統會使用的欄位**：

```sql
-- 基本資訊
telegram_id TEXT PRIMARY KEY,
nickname TEXT,
gender TEXT,                    -- 'male', 'female', 'other'
birthday TEXT,                  -- 'YYYY-MM-DD' (用於自動化生日祝福)
country_code TEXT,              -- 'TW', 'US', 'JP', etc.

-- VIP 狀態
is_vip INTEGER DEFAULT 0,
vip_expires_at TEXT,

-- 註冊狀態
onboarding_step TEXT,           -- 'completed' 表示已完成註冊
deleted_at TEXT,                -- 刪除時間（軟刪除）
bot_status TEXT,                -- 'active', 'blocked'

-- 活躍度
last_active_at TEXT,            -- 最後活躍時間

-- MBTI 和星座
mbti_result TEXT,               -- 'INTJ', 'ENFP', etc.
zodiac_sign TEXT                -- 'Aries', 'Taurus', etc.
```

---

## 4. 現有指令

*(保持不變，詳見 v2.0)*

---

## 5. 新增需求：精準過濾

### 5.1 需求描述

超級管理員希望能夠**更精準地過濾目標用戶**，不僅限於 VIP 狀態，還可以根據以下維度進行過濾：

1. **性別**：只推送給男生、女生或其他性別
2. **星座**：只推送給特定星座（如：天蠍座、雙魚座）
3. **國家**：只推送給特定國家的用戶（如：台灣、美國、日本）
4. **年齡層**：只推送給特定年齡範圍的用戶（如：18-25 歲、26-35 歲）
5. **MBTI**：只推送給特定 MBTI 類型（如：INTJ、ENFP）

### 5.2 使用場景

#### 場景 1：針對女性用戶的活動
`/broadcast_filter gender=female 🌸 女生專屬活動：本週末匿名聊天配額加倍！`

#### 場景 2：針對特定星座的運勢推送
`/broadcast_filter zodiac=Scorpio 🦂 天蠍座本週運勢：愛情運勢旺盛，適合主動出擊！`

#### 場景 3：組合過濾
`/broadcast_filter gender=female,age=18-25,country=TW 🇹🇼 台灣 18-25 歲女生專屬活動！`

### 5.3 過濾維度詳細說明

*(保持不變，詳見 v2.0)*

---

## 6. 實施方案

**✅ 採用方案 A：`/broadcast_filter`**

**理由**：
1. 單一指令，易於維護
2. 支援組合過濾，靈活性高
3. **關鍵優勢**：JSON 格式的 Filter 設計為未來「自動化系統廣播」預留了完美的接口（見第 12 章）。

---

## 7. 技術實現

### 7.1 指令解析

*(保持不變，詳見 v2.0)*

### 7.2 過濾器解析函數 (`src/domain/broadcast_filters.ts`)

```typescript
export interface BroadcastFilters {
  gender?: 'male' | 'female' | 'other';
  zodiac?: string;
  country?: string;
  age?: { min: number; max: number };
  mbti?: string;
  vip?: boolean;
  
  // ✨ 新增：自動化擴展接口
  is_birthday?: boolean;    // 篩選當天生日的用戶
  last_active_days?: number; // 篩選 X 天內活躍/不活躍
}

/**
 * 解析過濾器字串
 */
export function parseFilters(filtersStr: string): BroadcastFilters {
  // ... (解析邏輯保持不變)
  // 新增對 is_birthday 的支援
  // case 'is_birthday':
  //   filters.is_birthday = value === 'true';
  //   break;
}

// ...
```

### 7.3 SQL 查詢建構 (`src/services/broadcast.ts`)

```typescript
async function getFilteredUserIds(
  db: ReturnType<typeof createDatabaseClient>,
  filters: BroadcastFilters
): Promise<string[]> {
  // ... (基礎查詢保持不變)
  
  // ✨ 新增：生日過濾（復用現有邏輯）
  if (filters.is_birthday) {
    // SQLite 語法：strftime('%m-%d', birthday) = strftime('%m-%d', 'now')
    query += ` AND strftime('%m-%d', birthday) = strftime('%m-%d', 'now')`;
  }
  
  // ... (執行查詢)
}
```

### 7.4 Handler 實現

*(保持不變，詳見 v2.0)*

---

## 8-11. 測試與部署

*(保持不變，詳見 v2.0)*

---

## 12. 未來擴展：自動化系統廣播

本章節說明如何**復用**上述設計，實現如「生日祝福」等自動化功能，而**無需重寫**發送邏輯。

### 12.1 設計理念

我們將廣播系統視為一個**通用推送服務**，不只是管理員的工具。透過 `BroadcastFilters` 的 JSON 結構，系統可以像管理員一樣「下達指令」。

### 12.2 實例：自動發送生日祝福

**實現步驟**：

1. **Cron Trigger**：Cloudflare Worker 的 Cron 每日觸發一次（例如 10:00 AM）。
2. **調用接口**：Worker 內部調用 `createFilteredBroadcast`，傳入特殊 Filter。
3. **復用發送器**：系統自動分批發送，處理錯誤。

**代碼示意**：

```typescript
// src/worker.ts (Cron Handler)

async function handleScheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
  // 1. 定義過濾條件：當天生日
  const birthdayFilter: BroadcastFilters = {
    is_birthday: true
  };
  
  // 2. 準備祝福訊息（支援 i18n 佔位符）
  // 注意：這裡可以進一步擴展為 "System Bottle" 格式
  const message = "🎂 祝你生日快樂！系統送給你一個專屬生日蛋糕瓶子 🎁";
  
  // 3. 調用廣播服務 (復用現有邏輯)
  await createFilteredBroadcast(
    env,
    message,
    birthdayFilter,
    'SYSTEM' // 標記為系統自動發送
  );
  
  console.log('已觸發每日生日祝福廣播');
}
```

### 12.3 實例：系統漂流瓶 (System Bottle)

如果想發送的不只是文字，而是一個「系統漂流瓶」（帶有特殊 UI 或獎勵）：

**方案**：
1. 在 `broadcasts` 表中擴展 `message_type` 欄位（text, bottle, gift）。
2. 在 `processBroadcast` 發送時，根據類型調用不同的 Telegram 方法（`sendMessage` 或 `sendPhoto`）。

**擴展性評估**：
- **資料庫**：✅ `broadcasts` 表足以支撐記錄。
- **Filter**：✅ `filters` JSON 欄位支援任意複雜的查詢條件。
- **發送器**：✅ 只需要在 `processBroadcast` 中增加一個 `switch(type)` 即可支援發送貼圖、圖片或特殊樣式。

### 12.4 為什麼這個設計是「方便追加」的？

1. **無需修改 Schema**：新增過濾條件（如「註冊滿週年」）只需修改 TypeScript 接口和 SQL 查詢，不用動資料庫結構。
2. **統一入口**：無論是管理員手動發，還是 Cron 自動發，都走同一個 `createFilteredBroadcast` -> `processBroadcast` 流程。
3. **集中監控**：所有的推送記錄（人工/自動）都在 `broadcasts` 表中，運營人員可以用 `/broadcast_status` 統一查看發送狀況。

---

**文檔維護者**：開發團隊  
**文檔位置**：`doc/BROADCAST_SYSTEM_DESIGN.md`  
**最後更新**：2025-11-21
