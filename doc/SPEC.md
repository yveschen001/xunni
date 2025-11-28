# XunNi 專案規格書（AI 必讀）

> **這是 AI 代理在開始任何工作前必須閱讀的主要文檔。**  
> 本文檔包含專案概覽、技術棧、專案結構、完整業務邏輯和資料庫設計。

## 1. 專案總覽

### 產品資訊
- **產品名稱**: XunNi
- **Telegram Bot**: @xunnibot（生產環境）/ @xunni_dev_bot（測試環境）
- **類型**: MBTI + 星座心理測驗漂流瓶交友 Bot（匿名聊天）

### 專案定義

**XunNi** 是一個運行在 Cloudflare Workers 上的 Telegram Bot，提供 MBTI + 星座心理測驗漂流瓶匿名交友功能。

- **類型**: Telegram Bot（匿名聊天）
- **運行環境**: Cloudflare Workers + D1（SQLite）
- **語言**: TypeScript (ESM)
- **資料庫**: Cloudflare D1
- **快取**: Cloudflare KV（可選）

### 架構目標

- 運行在 **Cloudflare Workers**，搭配 **D1（SQL 資料庫）** + （可選）**KV**
- 成本極低，可長期運營
- 所有邏輯集中在一個 Worker 專案，透過 Telegram Webhook、HTTP API、Cron 觸發

### 核心特性

#### 全員必須完成
- 暱稱 & 頭像
- MBTI 測驗
- 反詐騙測驗
- 完成後才能丟瓶／撿瓶

#### 漂流瓶匿名配對
- 依 MBTI、年齡、性別等做匹配

#### 免費使用者
- 每日最多 3 個漂流瓶（可透過邀請好友，最高增加到 10 個）
- 只能設定「目標性別」，不能設定星座／MBTI 篩選
- 無翻譯功能

#### VIP 使用者
- 透過 Telegram Stars 付費訂閱（約 5 USD / 月）
- **解鎖對方清晰頭像**：對話歷史中顯示對方的清晰頭像（免費用戶看到的是模糊頭像）
- 每日 30 個漂流瓶，可透過邀請好友最高升級到 100 個
- 可指定星座／MBTI 目標篩選
- **34 種語言自動翻譯**：
  - 優先使用 **OpenAI GPT-4o-mini**（高品質）
  - 失敗時自動降級到 **Google Translate**（並提示）
  - 翻譯失敗時發送原文 + 提示
- **自定義安靜時段**：
  - VIP 可自由設定不被打擾的時段
  - 免費用戶固定為 00:00 - 08:00
- 無廣告

#### 所有聊天
- 只允許文字 + 官方 Emoji
- 嚴格 URL 白名單
- 透過中轉 bot 匿名轉發，不暴露真實 Telegram ID

#### 安全風控
- 反詐騙測驗 + risk_score + AI 審核
- 多人舉報 → 分級封禁
- 提供 `/appeal` 申訴機制

#### 其他功能
- 每週星座運勢推播，召回使用者來丟／撿瓶
- 對外 HTTP API：
  - `/api/eligibility`：給 Moonpacket 紅包系統查資格
  - `/api/public-stats`：公開營運統計（給行銷頁面使用）
- **平台管理員（angel）和平台所有者（god）**：可按條件（性別、年齡、星座、語言等）群發訊息（隊列 + 限速）
- **使用者封鎖功能**：/block（不舉報，只是不想再聊）
- **避免重複匹配**：排除曾經封鎖/被封鎖/被舉報過的使用者
- **資料保留策略**：漂流瓶 90 天後軟刪除，聊天記錄最多 3650 筆（每對象）
- **使用者權利**：/delete_me（刪除帳號，保留安全審計記錄）

#### 互動通道分層與 Mini App 最佳實踐

**架構原則**：
- **Bot 僅處理通知/Deep Link**：短流程、即時回應、通知推送
- **長流程改走 WebApp**：註冊引導、個人資料編輯、MBTI 測驗、聊天界面

**Telegram Mini App**（當前階段）：
- 使用 `initData` 驗簽確保安全性（見下方「Mini App 安全」章節）
- 首屏載入 < 2 秒（性能要求，見下方「Mini App 性能優化」章節）
- 支援 `WebApp.share` Deep Link（`startapp=share_mbti_{resultId}`）
- 使用 `themeParams` 適配深/淺色主題
- 使用 `MainButton`/`SecondaryButton` 減少自定義 UI 成本

**Bot Fallback 機制**（當 Mini App 無法使用時）：
- 提供極簡 Bot 指令維繫存量使用者：
  - `/start` - 註冊/查看資料
  - `/throw` - 丟漂流瓶
  - `/catch` - 撿漂流瓶
  - `/profile` - 查看個人資料
  - `/help` - 幫助
- 當檢測到 Mini App 無法載入時，自動提示使用者使用 Bot 指令
- Fallback 檢測：嘗試載入 Mini App，失敗時顯示「Mini App 暫時無法使用，請使用指令：/throw、/catch」

**未來擴展預留**（M2/M3，暫不實作）：
- WeChat / Line 插件
- App Store / Google Play 原生 App
- 詳細規劃請參考：ROADMAP.md

---

## 2. 技術棧與專案結構

### 2.1 技術棧
- **Runtime**: Cloudflare Workers
- **DB**: Cloudflare D1（SQLite 相容）
- **KV（可選）**: Cloudflare KV（風險分數、cache 用）
- **語言**: TypeScript（ESM 模組）
- **測試**: Vitest（或 Jest）

### 2.2 專案目錄結構（來源文件位置）

```
XunNi/
├── src/                          # 源代碼目錄（@src/）
│   ├── worker.ts                 # Worker 入口點（@src/worker.ts）
│   ├── router.ts                 # HTTP 路由處理器（@src/router.ts）
│   ├── config/                   # 配置模組（@src/config/）
│   │   ├── env.ts                # 環境變數驗證（@src/config/env.ts）
│   │   └── constants.ts          # 常量定義（@src/config/constants.ts）
│   ├── db/                       # 資料庫層（@src/db/）
│   │   ├── schema.sql            # 資料庫 Schema（@src/db/schema.sql）
│   │   ├── migrations/           # 遷移腳本（@src/db/migrations/）
│   │   └── client.ts             # D1 客戶端封裝（@src/db/client.ts）
│   ├── domain/                   # 業務邏輯層（純函數，無副作用）（@src/domain/）
│   │   ├── user.ts               # 使用者邏輯（@src/domain/user.ts）
│   │   ├── usage.ts              # 每日漂流瓶 / 對話次數（@src/domain/usage.ts）
│   │   ├── risk.ts               # 風險分數 / 封禁（@src/domain/risk.ts）
│   │   ├── matching.ts           # 漂流瓶匹配（@src/domain/matching.ts）
│   │   ├── horoscope.ts          # 星座運勢工具（@src/domain/horoscope.ts）
│   │   ├── eligibility.ts        # 對外資格查詢（@src/domain/eligibility.ts）
│   │   └── public_stats.ts       # 公開營運統計 API 聚合（@src/domain/public_stats.ts）
│   ├── telegram/                 # Telegram 相關（@src/telegram/）
│   │   ├── types.ts              # Telegram Update / Callback 型別（@src/telegram/types.ts）
│   │   └── handlers/             # 指令處理器（@src/telegram/handlers/）
│   │       ├── start.ts
│   │       ├── profile.ts
│   │       ├── throw.ts
│   │       ├── catch.ts
│   │       ├── msg_forward.ts    # 對話消息轉發
│   │       ├── report.ts
│   │       ├── appeal.ts
│   │       ├── vip.ts
│   │       ├── help.ts
│   │       ├── broadcast.ts      # 群發訊息（僅 angel/god）
│   │       └── admin.ts          # 管理員工具（僅 angel/god）
│   ├── services/                 # 外部服務整合（@src/services/）
│   │   └── openai.ts             # OpenAI API（@src/services/openai.ts）
│   ├── utils/                    # 通用工具（@src/utils/）
│   │   ├── url-whitelist.ts      # URL 白名單（@src/utils/url-whitelist.ts）
│   │   └── emoji.ts              # Emoji 處理（@src/utils/emoji.ts）
│   └── i18n/                     # 國際化（@src/i18n/）
│       ├── index.ts              # i18n 初始化（@src/i18n/index.ts）
│       ├── keys.ts               # 翻譯鍵值（@src/i18n/keys.ts）
│       └── locales/              # 語言包（@src/i18n/locales/）
├── tests/                        # 測試目錄（@tests/）
│   └── domain/                   # Domain 層測試（@tests/domain/）
│       ├── usage.test.ts
│       ├── risk.test.ts
│       ├── matching.test.ts
│       └── eligibility.test.ts
├── scripts/                      # 腳本目錄（@scripts/）
├── doc/                          # 文檔目錄（@doc/）
├── wrangler.toml                 # Cloudflare 配置（@wrangler.toml）
├── package.json                  # 依賴配置（@package.json）
└── tsconfig.json                 # TypeScript 配置（@tsconfig.json）
```

---

## 3. 資料庫 Schema（D1）

### 3.1 users

```sql
CREATE TABLE users (
  telegram_id TEXT PRIMARY KEY,
  role TEXT DEFAULT 'user',  -- user / group_admin / angel / god（預設為 'user'）
  nickname TEXT,
  avatar_url TEXT,        -- 頭像 URL 或 TG file_id 對應的 URL
  avatar_source TEXT,     -- telegram / ai / custom
  ai_gender_hint TEXT,    -- AI 推測性別提示文字

  gender TEXT,            -- male / female / other (設定後不可修改)
  birthday DATE,          -- 生日 YYYY-MM-DD (設定後不可修改，用於計算年齡和星座，未滿18歲不允許註冊)
  blood_type TEXT,        -- A / B / O / AB / unknown (設定後不可修改，VIP可用於配對篩選)
  age_range TEXT,         -- '18-22' / '23-30' / '31-40' / '40+' (由生日計算)
  country TEXT,           -- 'TW', 'JP' 等
  zodiac_sign TEXT,       -- aries / taurus / ... / pisces (由生日計算)
  mbti_type TEXT,         -- 16 型之一，完成測驗後寫入
  language_pref TEXT,     -- 介面 + 聊天偏好語言，如 zh-TW, en, ja

  prefer_gender TEXT,     -- 想認識的性別
  trust_level INTEGER,    -- 反詐測驗結果，>=1 視為通過

  -- 個人資料卡片
  bio TEXT,               -- 個人簡介（可選，最多 200 字）
  interests TEXT,         -- JSON array: ['音樂', '旅行', '閱讀', ...]（興趣標籤，最多 10 個）
  city TEXT,              -- 居住城市（可選，如 '台北', 'Tokyo'）

  is_vip INTEGER,         -- 0/1
  vip_expire_at DATETIME,

  invite_code TEXT,       -- 分配給此 user 的邀請碼
  invited_by TEXT,        -- 上游邀請人 telegram_id
  activated_invites INTEGER, -- 已激活的邀請好友數

  -- 註冊流程相關
  onboarding_state TEXT,  -- JSON: { step, data, last_updated }
  onboarding_started_at DATETIME,
  onboarding_completed_at DATETIME,
  
  -- 條款同意
  terms_accepted INTEGER DEFAULT 0,
  privacy_accepted INTEGER DEFAULT 0,
  terms_accepted_at DATETIME,
  privacy_accepted_at DATETIME,
  terms_version TEXT,    -- 接受的條款版本
  privacy_version TEXT,  -- 接受的隱私權版本

  risk_score INTEGER DEFAULT 0,
  created_at DATETIME,
  updated_at DATETIME
);
```

### 3.13 terms_versions（條款版本管理）

```sql
CREATE TABLE terms_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT,              -- 'terms' / 'privacy'
  version TEXT,           -- '1.0', '1.1', ...
  content TEXT,           -- Markdown 格式的條款內容
  effective_date DATE,    -- 生效日期
  created_at DATETIME
);
```

### 3.14 stats_cache（統計快取表，可選）

**用途**：快取公開統計數據，避免每次 API 請求都查詢資料庫

```sql
CREATE TABLE stats_cache (
  cache_key TEXT PRIMARY KEY,
  cache_value TEXT,        -- JSON 字串
  expires_at DATETIME,
  created_at DATETIME,
  updated_at DATETIME
);

CREATE INDEX idx_stats_cache_expires_at ON stats_cache(expires_at);
```

### 3.15 feature_flags（功能開關表）

**用途**：維護前端顯示開關，Worker 在處理 Mini App 輸出時查詢旗標來決定 UI 是否顯示（也方便未來擴平台）

```sql
CREATE TABLE feature_flags (
  flag_key TEXT PRIMARY KEY,  -- 如 'show_vip_badge', 'enable_invite_reward', 'show_translation_icon'
  flag_value INTEGER,         -- 0 = 關閉, 1 = 開啟
  description TEXT,           -- 功能說明
  platform TEXT,              -- 'all' / 'telegram' / 'wechat' / 'line' / 'mobile'（預留 M2/M3）
  updated_at DATETIME,
  updated_by TEXT             -- 更新者（admin_id 或 'system'）
);

CREATE INDEX idx_feature_flags_platform ON feature_flags(platform);
```

**使用場景**：
- Mini App 載入時查詢所有 `platform = 'telegram'` 或 `platform = 'all'` 的旗標
- 根據旗標決定 UI 元素顯示/隱藏
- 運營人員可透過管理後台動態開關功能
- 未來擴展到其他平台時，可根據 `platform` 欄位過濾

**範例查詢**：
```typescript
// 查詢 Telegram 平台的功能開關
const flags = await db.prepare(`
  SELECT flag_key, flag_value
  FROM feature_flags
  WHERE platform IN ('all', 'telegram')
    AND flag_value = 1
`).all<{ flag_key: string; flag_value: number }>();

// 轉換為物件
const featureFlags: Record<string, boolean> = {};
for (const flag of flags.results) {
  featureFlags[flag.flag_key] = flag.flag_value === 1;
}
```

### 3.16 admin_actions（管理操作記錄）

**用途**：記錄所有管理後台操作，用於審計和追蹤

```sql
CREATE TABLE admin_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id TEXT,              -- 執行操作的管理員 telegram_id
  action_type TEXT,           -- 'ban' / 'unban' / 'vip_add' / 'vip_remove' / 'broadcast' / 'appeal_approve' / 'appeal_reject' / etc.
  target_user_id TEXT,        -- 目標使用者 telegram_id（可選）
  details_json TEXT,          -- JSON 格式的操作詳情
  created_at DATETIME
);

CREATE INDEX idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_target_user_id ON admin_actions(target_user_id);
CREATE INDEX idx_admin_actions_action_type ON admin_actions(action_type);
CREATE INDEX idx_admin_actions_created_at ON admin_actions(created_at);
```

**使用場景**：
- 記錄所有管理後台操作（封禁、解封、VIP 升級、廣播等）
- 用於審計和追蹤管理員行為
- 可透過管理後台查詢操作歷史
- 詳細設計見 `@doc/ADMIN_PANEL.md`

### 3.17 user_push_preferences（推送偏好設定）

**用途**：儲存使用者的主動推送設定。
**注意**：前端 UI 不再提供細粒度開關，後端預設全部開啟，僅提供安靜時段設定。

```sql
CREATE TABLE user_push_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  throw_reminder_enabled INTEGER DEFAULT 1,   -- 後端預設開啟，UI 不顯示
  catch_reminder_enabled INTEGER DEFAULT 1,   -- 後端預設開啟，UI 不顯示
  message_reminder_enabled INTEGER DEFAULT 1, -- 後端預設開啟，UI 不顯示
  quiet_hours_start INTEGER DEFAULT 0,        -- UTC 小時 (0-23)，僅 VIP 可修改
  quiet_hours_end INTEGER DEFAULT 0,          -- UTC 小時 (0-23)，僅 VIP 可修改
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_push_preferences_user_id ON user_push_preferences(user_id);
```

### 3.18 push_notifications（推送記錄）

**用途**：記錄主動推送的歷史，用於頻率控制和分析

```sql
CREATE TABLE push_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,         -- 'throw_reminder', 'catch_reminder', 'onboarding_reminder'
  status TEXT DEFAULT 'sent', -- 'sent', 'failed', 'blocked'
  sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(telegram_id)
);

CREATE INDEX idx_push_notifications_user_id ON push_notifications(user_id);
CREATE INDEX idx_push_notifications_type ON push_notifications(type);
CREATE INDEX idx_push_notifications_sent_at ON push_notifications(sent_at);
```

### 3.2 bottles（漂流瓶）

```sql
CREATE TABLE bottles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id TEXT,           -- FK -> users.telegram_id
  content TEXT,
  mood_tag TEXT,
  created_at DATETIME,
  expires_at DATETIME,     -- 過期不再被撿起
  status TEXT,             -- pending / matched / expired / deleted

  target_gender TEXT,      -- 必填（一般 & VIP 共用）
  target_age_range TEXT,   -- 僅 VIP 可能填
  target_region TEXT,      -- 僅 VIP 可能填
  target_zodiac_filter TEXT, -- JSON array of zodiac (VIP)
  target_mbti_filter TEXT,   -- JSON array of MBTI types (VIP)
  language TEXT            -- 此瓶主要語言（可選）
);
```

### 3.3 conversations（對話）

```sql
CREATE TABLE conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bottle_id INTEGER,      -- FK -> bottles.id
  user_a_id TEXT,         -- FK -> users.telegram_id
  user_b_id TEXT,         -- FK -> users.telegram_id
  created_at DATETIME,
  last_message_at DATETIME,
  last_sender_id TEXT,    -- 用於追蹤「輪到誰回覆」 (Migration 0059)
  status TEXT,            -- active / closed / blocked

  max_rounds INTEGER,     -- 可選：限制對話壽命內總訊息數
  a_blocked INTEGER DEFAULT 0,
  b_blocked INTEGER DEFAULT 0
);
```

### 3.4 reports（舉報）

```sql
CREATE TABLE reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id TEXT,
  target_id TEXT,
  conversation_id INTEGER,
  reason TEXT,
  created_at DATETIME
);
```

### 3.5 bans（封禁）

```sql
CREATE TABLE bans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  reason TEXT,
  risk_snapshot INTEGER,
  ban_start DATETIME,
  ban_end DATETIME,
  created_at DATETIME
);
```

### 3.6 invites（邀請）

```sql
CREATE TABLE invites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inviter_id TEXT,
  invitee_id TEXT,
  status TEXT,           -- pending / activated
  created_at DATETIME,
  activated_at DATETIME
);
```

### 3.7 daily_usage（每日漂流瓶使用次數）

```sql
CREATE TABLE daily_usage (
  user_id TEXT,
  date TEXT,             -- YYYY-MM-DD
  throws_count INTEGER,
  PRIMARY KEY (user_id, date)
);
```

### 3.8 appeals（申訴）

```sql
CREATE TABLE appeals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  ban_start DATETIME,
  ban_end DATETIME,
  message TEXT,
  status TEXT,           -- pending / accepted / rejected
  created_at DATETIME,
  reviewed_at DATETIME,
  reviewer_id TEXT
);
```

### 3.9 conversation_daily_usage（每對象每日訊息數）

```sql
CREATE TABLE conversation_daily_usage (
  user_id TEXT,
  conversation_id INTEGER,
  date TEXT,             -- YYYY-MM-DD
  sent_count INTEGER,
  PRIMARY KEY (user_id, conversation_id, date)
);
```

### 3.10 horoscope_templates（星座運勢模板）

```sql
CREATE TABLE horoscope_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  zodiac_sign TEXT,      -- aries / ... / pisces
  week_start DATE,
  week_end DATE,
  message TEXT,
  source TEXT,
  created_at DATETIME
);
```

### 3.11 payments（VIP 付款）

```sql
CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  telegram_payment_id TEXT UNIQUE,  -- 唯一索引，防止重複支付
  stars_amount INTEGER,
  status TEXT,           -- pending / paid / refunded / failed
  product_code TEXT,     -- 'VIP_MONTHLY'
  created_at DATETIME,
  updated_at DATETIME
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE UNIQUE INDEX idx_payments_telegram_payment_id ON payments(telegram_payment_id);
```

**支付邊緣情況處理**：
- **支付成功但寫 DB 失敗**：使用 telegram_payment_id 唯一索引，重試安全（檢查是否已存在）
- **使用者重複買 VIP**：從當前 vip_expire_at 往後延 30 天，不是從現在算
- **退款**：暫不支持自動退款，僅手動處理

詳細設計請參考：TELEGRAM_STARS.md

### 3.12 broadcast_jobs / broadcast_queue（廣播）

```sql
CREATE TABLE broadcast_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_by TEXT,
  role TEXT,                -- 'god' / 'angel'
  filters_json TEXT,        -- JSON 條件，如 {"gender":"female", "country":"TW"}
  message TEXT,
  status TEXT,              -- pending / running / completed / cancelled
  total_targets INTEGER,
  sent_count INTEGER,
  failed_count INTEGER,
  created_at DATETIME,
  started_at DATETIME,
  completed_at DATETIME
);

CREATE TABLE broadcast_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER,
  user_id TEXT,
  status TEXT,              -- pending / sent / failed
  last_error TEXT,
  created_at DATETIME,
  sent_at DATETIME
);

CREATE INDEX idx_broadcast_queue_job_id_status ON broadcast_queue(job_id, status);
```

**Cron 任務冪等性設計**：
- **broadcast**：只發送 queue 裡 status='pending' 的項，狀態一旦變成 'sent' 就不再重發

### 3.12.1 ai_moderation_logs（AI 審核日誌）

```sql
CREATE TABLE ai_moderation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  conversation_id INTEGER,
  content_summary TEXT,        -- 內容摘要（前 100 字）
  full_content TEXT,           -- 完整內容（加密或脫敏）
  moderation_reason TEXT,      -- 審核原因
  moderation_result TEXT,      -- 'flagged' / 'safe' / 'failed'
  provider TEXT,               -- 'openai' / null（如果失敗）
  error_message TEXT,          -- 錯誤訊息（如果失敗）
  risk_score_added INTEGER,    -- 累加的風險分數
  created_at DATETIME
);

CREATE INDEX idx_ai_moderation_logs_user_id ON ai_moderation_logs(user_id);
CREATE INDEX idx_ai_moderation_logs_conversation_id ON ai_moderation_logs(conversation_id);
CREATE INDEX idx_ai_moderation_logs_created_at ON ai_moderation_logs(created_at);
CREATE INDEX idx_ai_moderation_logs_result ON ai_moderation_logs(moderation_result);
```

### 3.12.2 translation_costs（翻譯成本記錄）

```sql
CREATE TABLE translation_costs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  provider TEXT,              -- 'openai' / 'google'
  source_language TEXT,
  target_language TEXT,
  cost_amount REAL,           -- 成本（tokens 或 API 調用次數）
  is_fallback INTEGER DEFAULT 0, -- 是否為降級
  created_at DATETIME
);

CREATE INDEX idx_translation_costs_user_id ON translation_costs(user_id);
CREATE INDEX idx_translation_costs_created_at ON translation_costs(created_at);
CREATE INDEX idx_translation_costs_provider ON translation_costs(provider);
```

### 3.12.3 translation_fallbacks（翻譯降級記錄）

```sql
CREATE TABLE translation_fallbacks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  from_provider TEXT,         -- 失敗的供應商（'openai'）
  to_provider TEXT,           -- 降級到的供應商（'google'）
  error_message TEXT,
  created_at DATETIME
);

CREATE INDEX idx_translation_fallbacks_user_id ON translation_fallbacks(user_id);
CREATE INDEX idx_translation_fallbacks_created_at ON translation_fallbacks(created_at);
```

---

## 4. 主要業務邏輯（Domain）

### 4.1 每日漂流瓶次數限制

#### 4.1.1 getDailyThrowLimit(user, today)

**規則**:

**免費使用者**:
- 基礎每日 3 個
- 每有 1 位「已激活」邀請好友（完成 MBTI 並至少丟 1 瓶） → +1
- 上限：10 個 / 日

**VIP 使用者（有效期內）**:
- 基礎每日 30 個
- 每有 1 位激活邀請 → +1
- 上限：100 個 / 日
- 最大激活邀請數只記到 70（總上限 100）

**若 VIP 到期**: 限制退回「免費邏輯」，但已激活邀請仍存在 → 上限為 10

**假碼**:

```typescript
function isVipActive(user: User, now: Date): boolean {
  return !!(user.is_vip && (!user.vip_expire_at || user.vip_expire_at > now));
}

function getDailyThrowLimit(user: User, today: string): number {
  const invites = user.activated_invites || 0;
  const now = new Date();

  if (isVipActive(user, now)) {
    const base = 30;
    const bonus = Math.min(invites, 70);
    return Math.min(base + bonus, 100);
  }

  // free
  const base = 3;
  const bonus = Math.min(invites, 7);
  return Math.min(base + bonus, 10);
}
```

#### 4.1.2 canThrowBottle(user, today, usage)

```typescript
function canThrowBottle(user: User, today: string, usage: DailyUsage | null): boolean {
  if (isBanned(user)) return false;
  if (!hasCompletedOnboarding(user)) return false;

  const limit = getDailyThrowLimit(user, today);
  const used = usage?.throws_count || 0;

  return used < limit;
}
```

### 4.2 每日對話訊息上限（每個對象）

- **免費使用者**: 對同一個 conversation_id，每日最多 10 則
- **VIP 使用者**: 對同一個 conversation_id，每日最多 100 則

```typescript
function getConversationDailyLimit(user: User): number {
  return isVipActive(user, new Date()) ? 100 : 10;
}

async function canSendConversationMessage(user: User, convoId: number, today: string): Promise<boolean> {
  const usage = await db.getConversationDailyUsage(user.telegram_id, convoId, today);
  const used = usage?.sent_count || 0;
  const limit = getConversationDailyLimit(user);
  return used < limit;
}

async function recordConversationMessage(user: User, convoId: number, today: string) {
  await db.incrementConversationDailyUsage(user.telegram_id, convoId, today);
}
```

### 4.3 風險分數與封禁

（邏輯由 `domain/risk.ts` 實作，包含：）

- `addRisk(userId, reason)`: 累計 risk_score
- `applyBan(userId, hours, reason)`: 寫入 bans 表
- `isBanned(user)`: 依 bans 檢查當前是否處於封禁期
- `maybeRunAiModeration(text, userId, conversationId, env, db)`: AI 內容審核（可選）

**舉報規則（24 小時內、不同舉報人數）**:
- 1 人舉報：封禁 1 小時
- 2 人舉報：封禁 6 小時
- 3 人舉報：封禁 24 小時
- 5 人以上：封禁 3 天

`/report` 提交後，系統檢查 24 小時內 unique reporters，計算封禁等級並 `applyBan`。

**AI 審核失敗處理**：
- 當 OpenAI 掛掉或超額時：
  - 記錄日誌（包含錯誤類型、使用者 ID、內容摘要）
  - **不阻擋發言**（不因為 AI 審核失敗而 block 使用者）
  - 僅依靠本地規則（URL 白名單、敏感詞過濾）
  - 發送告警（通知管理員）
- Audit 日誌：記錄被 AI 攔截的內容摘要、reason、user_id、conversation_id
- 資料庫表：`ai_moderation_logs`（見 3.12.1 節）

### 4.3.1 風控資料來源與觸發規則

**資料來源**：
1. **行為日誌**：
   - 每日丟瓶/撿瓶次數異常（超過正常範圍）
   - 短時間內大量訊息（疑似機器人）
   - 頻繁修改個人資料（疑似帳號買賣）

2. **舉報記錄**：
   - 其他使用者舉報（reports 表）
   - 24 小時內被舉報次數

3. **設備指紋**（可選，未來擴展）：
   - IP 地址
   - User-Agent
   - 設備識別資訊（Telegram 提供的 client info）

**觸發規則**：
- **風險分數累積規則**：
  - URL_BLOCKED：+10 分
  - SENSITIVE_WORD：+5 分
  - AI_FLAGGED：+15 分
  - 被舉報 1 次：+5 分
  - 被舉報 2 次：+15 分
  - 被舉報 3 次：+30 分
  - 被舉報 5 次以上：+50 分（直接封禁）

- **封禁規則**（基於風險分數）：
  - risk_score >= 50：封禁 3 天
  - risk_score >= 30：封禁 24 小時
  - risk_score >= 15：封禁 6 小時
  - risk_score >= 10：封禁 1 小時

- **自動封禁規則**（基於舉報）：
  - 24 小時內 1 人舉報：封禁 1 小時
  - 24 小時內 2 人舉報：封禁 6 小時
  - 24 小時內 3 人舉報：封禁 24 小時
  - 24 小時內 5 人以上舉報：封禁 3 天

**行為日誌記錄**：
```sql
CREATE TABLE behavior_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  action_type TEXT,          -- 'throw_bottle' / 'catch_bottle' / 'send_message' / 'modify_profile'
  action_data TEXT,          -- JSON：動作相關資料
  ip_address TEXT,           -- IP 地址（可選）
  user_agent TEXT,           -- User-Agent（可選）
  created_at DATETIME
);

CREATE INDEX idx_behavior_logs_user_id ON behavior_logs(user_id);
CREATE INDEX idx_behavior_logs_action_type ON behavior_logs(action_type);
CREATE INDEX idx_behavior_logs_created_at ON behavior_logs(created_at);
```

### 4.4 主動推送與召回機制

**核心目標**：在不打擾使用者的前提下，提升留存率（Retention）和活躍度（DAU）。

**架構組件**：
1. **UserPreferencesService**: 管理使用者偏好（`user_push_preferences`）。
2. **PushStrategyService**: 決策引擎，根據活躍度、頻率限制、安靜時段決定是否推送。
3. **Cron Job**: 定時觸發檢查（如 `/cron/push_reminders`）。

#### 4.4.1 使用者活躍度分級 (User Activity Level)
根據 `last_active_at` 計算：
- **VERY_ACTIVE**: < 24 小時
- **ACTIVE**: 1 - 3 天
- **MODERATE**: 3 - 7 天
- **INACTIVE**: 7 - 30 天
- **DORMANT**: > 30 天

**策略**：
- **活躍用戶**：適度提醒（如 "今日還沒丟瓶子"），頻率較高。
- **休眠用戶**：低頻召回（如 "好久不見"），避免騷擾導致封鎖 Bot。
- **Dormant 用戶**：暫不主動推送，或僅在重大活動時推送。

#### 4.4.2 推送類型與規則
| 類型 | 觸發條件 | 頻率限制 | 檢查邏輯 |
|------|---------|---------|---------|
| **throw_reminder** | 活躍用戶 > 24h 未丟瓶 | 24h 一次 | `!hasThrownBottleIn24h` AND `isActive` |
| **catch_reminder** | 活躍用戶 > 24h 未撿瓶 | 24h 一次 | `!hasCaughtBottleToday` AND `isActive` |
| **onboarding_reminder** | 註冊未完成 (Step != 'completed') | 24h 一次 (Max 3) | `created_at` 在 7 天內 |
| **message_reminder** | 有未讀訊息 (Future) | 視策略定 | (待實作) |

#### 4.4.3 安靜時段 (Quiet Hours)
- **VIP 使用者**：
  - 可在 `/settings` 中自定義開始與結束時間
  - 避免在休息時間收到非緊急通知
- **免費使用者**：
  - 強制固定：00:00 - 08:00 (UTC+8)
  - 不可修改（顯示鎖定圖標，引導升級 VIP）
- **強制執行**：除緊急通知（如帳號安全、申訴結果）外，安靜時段內不發送 Marketing 類推送。

---

## 5. 使用流程與 Telegram 指令

### 5.1 /start（初次引導）

**重要特性**：
- **智能對話式引導**：使用俏皮的對話風格，讓註冊過程更友好
- **中斷恢復機制**：支援中斷後從上次步驟繼續
- **深度確認**：性別、生日、血型設定後永遠不能修改，需二次確認
- **年齡限制**：未滿 18 歲不允許註冊（自動計算年齡）
- **暱稱規則**：不允許包含網址，長度 2-20 字符
- **條款同意**：必須同意使用者條款和隱私權政策

**詳細流程請參考**：[ONBOARDING_FLOW.md](./ONBOARDING_FLOW.md)

**流程概要**:

1. 建立或讀取 users 記錄
2. 檢查是否已完成 onboarding，未完成則進入以下 11 步：

#### Step 0：歡迎與條款同意

- 智能對話歡迎使用者
- 必須查看並同意**使用者條款**和**隱私權政策**
- 記錄同意時間和版本號

#### Step 1：暱稱 & 頭像

- 預設使用 Telegram first_name 或 username
- AI 生成 1–3 個暱稱建議（根據語言、產品主題）
- 支援上傳自訂頭像或使用 Telegram 頭像
- **暱稱驗證**：
  - 長度：2-20 個字符
  - 不允許包含網址（http://, https://, www., .com 等）
  - 可以使用 emoji
  - 暱稱可以重複（不強制唯一）

#### Step 2：主要使用語言

- 選擇介面語言（zh-TW / en / ja / ...）
- 後續翻譯功能以此為目標語言

#### Step 3：性別（深度確認）

- ⚠️ **重要**：性別設定後**永遠不能修改**
- 顯示 AI 性別提示（僅參考，不自動填寫）
- 選擇後需**二次確認**才能寫入
- 確認後記錄確認時間

#### Step 4：生日與年齡驗證

- ⚠️ **重要**：生日設定後**永遠不能修改**
- 輸入格式：YYYY-MM-DD
- **年齡驗證**：
  - 自動計算年齡：`當前年份 - 出生年份`
  - 未滿 18 歲拒絕註冊，提示「很抱歉，你必須年滿 18 歲才能使用本服務。請成年後再來！」
  - 立即終止註冊流程
- 計算年齡區間和星座
- 選擇後需**二次確認**才能寫入

#### Step 5：血型（深度確認）⭐ 新增

- ⚠️ **重要**：血型設定後**永遠不能修改**
- 選項：A / B / O / AB / 不願透露
- 選擇後需**二次確認**才能寫入
- **用途**：
  - VIP 用戶可以在丟瓶子時篩選特定血型
  - 增加配對的趣味性

#### Step 6：國家

- 選擇國家/地區代碼（TW, JP, KR, ...）

#### Step 7：喜好性向（目標對象）

- 想認識的性別：男 / 女 / 其他 / 不限
- 一般使用者只有「目標性別」會用到

#### Step 7.5：興趣標籤（可選）

- 從預設興趣列表中選擇最多 10 個標籤
- 預設興趣列表：音樂、旅行、閱讀、電影、運動、美食、攝影、藝術、遊戲、科技、時尚、寵物、戶外、咖啡、寫作、舞蹈、瑜伽、健身、烹飪、學習等
- 支援搜尋興趣標籤
- 可跳過（非必填），後續可在 `/profile` 中編輯

#### Step 8：MBTI 測驗

- 問卷拆頁（每頁 3–5 題）
- 支援中斷恢復（保存已答題目）
- 每頁完成後回覆鼓勵文字
- 完成後計算 MBTI 類型

#### Step 9：反詐騙測驗

- 提供 5 題情境題
- 支援中斷恢復
- 得分 >= 3 分：通過
- 未達標：友善提示 + 允許重新測驗

#### Step 9.5：個人簡介與居住城市（可選）

- **個人簡介**：輸入一段簡短的自我介紹（最多 200 字）
- **居住城市**：選擇或輸入居住城市（可選）
- 可跳過（非必填），後續可在 `/profile` 中編輯

#### Step 10：完成註冊

- 顯示完整個人資料摘要
- 標記使用者為「可用狀態」
- 提供快速操作按鈕

**中斷恢復**：
- 使用 `onboarding_state` JSON 欄位記錄進度
- 下次 `/start` 自動從中斷處繼續
- 支援查看已填寫資料

**未完成提醒**：
- 如果使用者開始 onboarding 但超過 24 小時未完成：
  - 每 24 小時推送一次提醒
  - 最多推送 3 次
  - 超過 7 天不再提醒
  - 推送內容：「📝 你的註冊還沒完成呢！還差 {remaining_steps} 步就可以開始使用 XunNi 了」
  - 詳細設計請參考：`@doc/PUSH_NOTIFICATIONS.md` 2.2.5 節

### 5.2 /rules（遊戲規則說明）

**功能**：向使用者展示完整的遊戲規則和功能說明，幫助使用者了解如何使用 XunNi。

**顯示內容**：

```
📖 XunNi 遊戲規則

🎯 核心玩法
• 丟漂流瓶：寫下你的想法，等待有緣人撿起
• 撿漂流瓶：發現有趣的瓶子，開始匿名對話
• 匿名聊天：透過 Bot 中轉，保護隱私

📦 漂流瓶規則
• 免費使用者：每日最多 3 個（邀請好友最高 10 個）
• VIP 使用者：每日 30 個（邀請好友最高 100 個）
• 瓶子有效期：24 小時
• 匹配後建立匿名對話
• 瓶子內容：最短 12 字符，最多 500 字符
• 匹配偏好：默認異性（可在個人資料中修改）

💬 聊天規則
• 僅允許文字 + 官方 Emoji
• 禁止發送 URL（除非在白名單中：t.me, telegram.org, telegram.me）
• 免費使用者：每對象每日最多 10 條訊息
• VIP 使用者：每對象每日最多 100 條訊息

🛡️ 安全規則
• 必須完成 MBTI 測驗和反詐騙測驗
• 禁止發送不當內容（會被 AI 審核）
• 可舉報違規使用者（/report）
• 可封鎖不想再聊的使用者（/block）
• 多次違規會被自動封禁

🌐 翻譯功能（VIP 專屬）
• 34 種語言自動翻譯
• 優先使用 OpenAI 高品質翻譯
• 失敗時自動降級到 Google Translate

⚙️ 其他功能
• /profile：查看個人資料
• /stats：查看個人統計
• /settings：推送設定
• /vip：升級 VIP
• /appeal：申訴封禁

❓ 需要幫助？
如有問題，請使用 /help 查看指令列表
```

**使用場景**：
- 新使用者完成 onboarding 後，自動推送規則說明
- 使用者主動查詢規則時使用
- 在封禁/警告時，引導使用者查看規則

**技術實作**：
- 使用 i18n 系統，根據使用者的 `language_pref` 顯示對應語言版本
- 內容使用 `I18N_KEYS.RULES.*` 鍵值
- 可提供多語言版本（zh-TW、en、ja 等）

### 5.3 /help（指令幫助）

**功能**：根據使用者角色顯示對應的可用指令列表和簡要說明。

**權限分組**：

#### 5.3.1 一般使用者（role = 'user'）

**顯示內容**：

```
📋 XunNi 指令列表

🎮 核心功能
/start - 開始使用或繼續註冊
/throw - 丟漂流瓶
/catch - 撿漂流瓶
/profile - 查看個人資料
/profile_card - 查看個人資料卡片

💬 聊天相關
/block - 封鎖使用者（不舉報）
/report - 舉報違規使用者

📊 個人功能
/stats - 查看個人統計
/settings - 推送設定
/history - 查看聊天記錄

💎 VIP 功能
/vip - 升級 VIP 或查看 VIP 權益

🛡️ 安全功能
/appeal - 申訴封禁

📖 幫助
/rules - 查看完整遊戲規則
/help - 顯示此指令列表

💡 提示
• 所有指令都支援快捷按鈕
• 使用 /settings 可自訂推送偏好
• 遇到問題？使用 /appeal 申訴
```

**技術實作**：
- 僅顯示一般使用者可用的指令
- **不顯示**任何管理指令（`/admin*`、`/broadcast` 等）
- 使用 i18n 系統，根據使用者的 `language_pref` 顯示

#### 5.3.2 群組管理員（role = 'group_admin'）

**說明**：
- 此角色為**預留角色**，用於未來支援 Telegram 群組功能
- 當前階段（M1）為私聊 Bot，此角色暫不使用
- 如需使用，需在資料庫中手動設定 `users.role = 'group_admin'`

**顯示內容**（預留，當前不顯示）：

```
📋 XunNi 指令列表（群組管理員）

🎮 核心功能
[與一般使用者相同]

👥 群組管理功能（預留）
/admin_group_stats - 查看群組統計
/admin_group_settings - 群組設定

📖 幫助
/rules - 查看完整遊戲規則
/help - 顯示此指令列表
```

#### 5.3.3 平台管理員（role = 'angel'）

**顯示內容**：

```
📋 XunNi 指令列表（平台管理員）

🎮 核心功能
[與一般使用者相同]

🔧 管理功能
/admin - 管理主選單
/admin_stats - 運營數據統計
/admin_user - 使用者管理
/admin_ban - 封禁管理
/admin_vip - VIP 管理
/admin_appeal - 申訴審核
/broadcast_filter - 群發訊息（需指定篩選條件）

📖 幫助
/rules - 查看完整遊戲規則
/help - 顯示此指令列表

⚠️ 注意
• 群發訊息必須至少指定一項篩選條件
• 所有管理操作都會記錄到審計日誌
```

#### 5.3.4 平台所有者（role = 'god'）

**顯示內容**：

```
📋 XunNi 指令列表（平台所有者）

🎮 核心功能
[與一般使用者相同]

🔧 管理功能
/admin - 管理主選單
/admin_stats - 運營數據統計
/admin_user - 使用者管理（可查看所有使用者）
/admin_ban - 封禁管理
/admin_vip - VIP 管理
/admin_appeal - 申訴審核
/broadcast_filter - 群發訊息（可無條件群發）

📖 幫助
/rules - 查看完整遊戲規則
/help - 顯示此指令列表

⚠️ 注意
• 擁有最高權限，可無條件群發訊息
• 所有管理操作都會記錄到審計日誌
```

**技術實作**：

```typescript
// src/telegram/handlers/help.ts

export async function handleHelp(
  update: TelegramUpdate,
  env: Env,
  db: D1Database
): Promise<void> {
  const userId = String(update.message.from.id);
  
  // 1. 查詢使用者角色
  const user = await db.prepare(`
    SELECT role FROM users WHERE telegram_id = ?
  `).bind(userId).first<{ role: string }>();
  
  const role = user?.role || 'user';
  const language = user?.language_pref || 'zh-TW';
  
  // 2. 根據角色決定顯示的指令列表
  let commands: string[];
  
  switch (role) {
    case 'god':
      commands = [
        // 一般使用者指令
        '/start', '/throw', '/catch', '/profile', '/profile_card',
        '/block', '/report', '/stats', '/settings', '/history',
        '/vip', '/appeal', '/rules', '/help',
        // 管理指令（god 權限）
        '/admin', '/admin_stats', '/admin_user', '/admin_ban',
        '/admin_vip', '/admin_appeal', '/broadcast_filter'
      ];
      break;
      
    case 'angel':
      commands = [
        // 一般使用者指令
        '/start', '/throw', '/catch', '/profile', '/profile_card',
        '/block', '/report', '/stats', '/settings', '/history',
        '/vip', '/appeal', '/rules', '/help',
        // 管理指令（angel 權限）
        '/admin', '/admin_stats', '/admin_user', '/admin_ban',
        '        /admin_vip', '/admin_appeal', '/broadcast_filter'
      ];
      break;
      
    case 'group_admin':
      // 預留，當前不使用
      commands = [
        '/start', '/throw', '/catch', '/profile', '/profile_card',
        '/block', '/report', '/stats', '/settings', '/history',
        '/vip', '/appeal', '/rules', '/help'
      ];
      break;
      
    case 'user':
    default:
      // 一般使用者：僅顯示一般指令，不顯示管理指令
      commands = [
        '/start', '/throw', '/catch', '/profile', '/profile_card',
        '/block', '/report', '/stats', '/settings', '/history',
        '/vip', '/appeal', '/rules', '/help'
      ];
      break;
  }
  
  // 3. 使用 i18n 格式化訊息
  const message = formatHelpMessage(role, commands, language);
  
  // 4. 發送訊息
  await sendTelegramMessage(env, userId, message);
}
```

**使用場景**：
- 使用者不確定有哪些指令可用時
- 在錯誤訊息中引導使用者查看幫助
- 新使用者完成 onboarding 後自動推送（僅顯示一般使用者指令）
- 管理員首次使用管理功能時，顯示管理指令列表

**權限檢查原則**：
- **一般使用者（user）**：絕對看不到任何管理指令
- **平台管理員（angel）**：可以看到管理指令，但某些高權限功能受限（如無條件群發）
- **平台所有者（god）**：可以看到所有指令，擁有最高權限
- **群組管理員（group_admin）**：預留角色，當前不使用

### 5.4 /profile（個人資料）

顯示：暱稱、頭像、性別、年齡區間、國家、居住城市、MBTI、星座、語言、興趣標籤、個人簡介、邀請碼、是否 VIP、每日漂流瓶上限等。

**編輯限制**：
- **可編輯**：暱稱、頭像、語言、國家、居住城市、喜好性向、興趣標籤、個人簡介
- **不可編輯**：性別、生日（永遠不能修改，不顯示編輯按鈕）
- **管理員特殊權限**：god 角色可修改所有欄位（需記錄操作日誌）

### 5.2.1 /profile_card（查看個人資料卡片）

**功能說明**：
- 查看自己的完整個人資料卡片
- 查看對話對象的個人資料卡片（在對話中）
- 查看匹配對象的個人資料卡片（撿到瓶子後）

**卡片顯示內容**：
```
┌─────────────────────────┐
│  [頭像]                  │
│  {nickname}              │
│  {age_range} · {city}    │
│  {zodiac_sign} · {mbti_type} │
│                         │
│  {bio}                  │
│                         │
│  興趣標籤：              │
│  {interest1} {interest2} │
│  ...                    │
│                         │
│  語言：{language_pref}  │
│  國家：{country}        │
└─────────────────────────┘
```

**使用場景**：
1. **在對話中查看對方資料**：
   - 在對話界面中點擊「查看資料」按鈕
   - 顯示對話對象的個人資料卡片
   - 不顯示真實 Telegram ID（匿名保護）

2. **匹配後查看對方資料**：
   - 撿到瓶子後，顯示「查看對方資料」按鈕
   - 顯示瓶子主人的個人資料卡片
   - 幫助使用者決定是否開始對話

3. **查看自己的資料卡片**：
   - 使用 `/profile_card` 指令
   - 顯示自己的完整資料卡片
   - 可點擊「編輯」進入編輯模式

**隱私保護**：
- 不顯示真實 Telegram ID
- 不顯示註冊時間、風險分數等敏感資訊
- 僅顯示公開的個人資料欄位

**資料庫欄位**：
- `users.bio`：個人簡介
- `users.interests`：興趣標籤（JSON array）
- `users.city`：居住城市

### 5.5 /throw（丟漂流瓶）

**流程**:

1. 檢查：`isBanned(user)`，未完成 onboarding 則拒絕
2. 讀取 daily_usage，使用 `canThrowBottle()` 判斷是否還有 quota
3. **自動確定匹配對象**：
   - 優先使用 `users.match_preference`（如果已設定）
   - 默認為異性：男生 → 女生，女生 → 男生
   - 顯示當前匹配對象，提示可在 `/edit_profile` 中修改
4. **直接進入內容輸入**（不再每次詢問對象）

**內容驗證規則**:
- **最短長度**：12 個字符
- **最長長度**：500 個字符
- **URL 白名單**：只允許 `t.me`, `telegram.org`, `telegram.me`
- **禁止內容**：個人聯絡方式、外部連結（YouTube 等）

**一般 vs VIP 行為**:

**一般使用者**:
- 使用默認匹配偏好（異性）
- 不可設定星座 / MBTI / 年齡 / 地區 篩選 → 對應欄位留空
- 顯示廣告：
  - 呼叫 `fetchAd(env)`（gigapub），並同時展示「升級 VIP」按鈕
  - 使用者點「先丟瓶子」才進入下一步

**VIP 使用者**:
- 可設定：target_gender + target_zodiac_filter + target_mbti_filter（可選）
- 可額外選擇目標年齡區間 / 地區（選配）
- 不顯示廣告

5. 建立 bottles 記錄，status='pending'、expires_at = created_at + 24h
6. daily_usage.throws_count += 1
7. **成功反饋**：顯示瓶子 ID、今日配額使用情況、24 小時有效期提示

### 5.6 /catch（撿漂流瓶）

1. 檢查封禁與 onboarding
2. 用 `matchBottleForUser(user)` 從 bottles 找符合條件：
   - 符合性別、年齡、反詐條件等
   - **排除自己丟的瓶子**
   - **排除曾經封鎖過的使用者**（blocker_id = user）
   - **排除曾經被封鎖的使用者**（blocked_id = user）
   - **排除曾被舉報過的使用者**（24 小時內）
 3. 若找到：
   - 建立 conversations（user 與 bottle.owner 的匿名對話）
   - 建立 bottle_chat_history 記錄
   - 回覆給使用者瓶子內容 + 提示：
     - 使用 `/report` 舉報不當內容
     - 使用 `/block` 封鎖不想再聊的使用者
     - 說明這是匿名對話，請遵守安全守則
   - **即時推送通知給瓶子主人**：
     - 告知有人撿到了他的瓶子
     - 推送內容使用使用者的 `language_pref`（i18n）
     - 推送內容：「🎉 有人撿到你的漂流瓶了！已為你們建立了匿名對話，快來開始聊天吧～」
     - 尊重使用者的推送偏好設定（如已關閉對話提醒，則不推送）
     - 詳細設計請參考：`@doc/PUSH_NOTIFICATIONS.md` 2.2.3 節
4. 若沒找到：
   - 回覆「目前沒有適合你的瓶子，稍後再試」

### 5.7 對話消息轉發（匿名聊天）

任何來自 conversations 雙方的訊息，都由 bot 中轉：

1. **驗證**: 對應 conversation_id 是否存在且 status='active'
2. **檢查封鎖狀態**：確認接收者未封鎖發送者
3. **對話界面功能**：
   - 在對話界面中提供「查看對方資料卡片」按鈕
   - 點擊後顯示對話對象的個人資料卡片（MBTI、星座、居住地區、語言、興趣、簡介等）
   - 不顯示真實 Telegram ID（匿名保護）
4. **僅允許文字 + 官方 emoji**（不使用 HTML/Markdown）:
   - 非文字 → 回覆「目前僅支援文字與官方表情符號」
5. **本地規則檢查**（必須通過）:
   - **URL 白名單檢查**：不在白名單 → 拒絕訊息，提示安全原因，並 `addRisk(URL_BLOCKED)`
   - **敏感詞過濾**：包含敏感詞 → 拒絕訊息，累加風險分數
   - **長度檢查**：超過 1000 字 → 拒絕訊息
   - **Emoji 驗證**：僅允許官方 Emoji
6. **AI 審核**（可選，失敗不阻擋）:
   - 嘗試 OpenAI 內容審核（timeout: 3s）
   - 失敗時：記錄日誌，**不阻擋發言**，僅依靠本地規則
   - 成功且標記違規時：根據風險分數決定是否阻擋
   - 記錄到 ai_moderation_logs（用於人工抽查）
7. **每對象每日訊息數**:
   - 用 `canSendConversationMessage()` 判斷是否超過 10（免費） / 100（VIP）
   - 超額則提示「今天對這位對象的發言已達上限，明天再聊」
8. **VIP 翻譯**:
   - 若對話任一方為 VIP：
     - 優先使用 **OpenAI GPT-4o-mini** 翻譯（高品質）
     - 失敗時自動降級到 **Google Translate**
     - 記錄降級事件（用於監控）
   - 免費使用者：
     - 僅使用 **Google Translate**
   - 翻譯失敗時：發送原文 + 提示「翻譯服務暫時有問題，請先看原文」
   - 詳細策略請參考：TRANSLATION_STRATEGY.md
9. **儲存訊息記錄**:
   - 儲存到 conversation_messages
   - 限制每個對話對象最多保留 3650 筆訊息
   - 超過時刪除最舊的，保留最後 100 筆
10. 使用 `recordConversationMessage()` 更新 conversation_daily_usage

### 5.8 /report（舉報）

1. 每個舉報記錄寫入 reports
2. 重新計算過去 24 小時內針對 target_id 的 unique reporters 數
3. 依前述規則封禁
4. 同時累加 risk_score
5. 回覆舉報者「已收到舉報，我們會審查」

### 5.9 /appeal（申訴）

使用者在被封期間可發 `/appeal`：

1. 輸入申訴內容，寫入 appeals
2. 管理員可在 `/admin` 介面查看並更新 status

### 5.10 /vip（VIP 購買）

1. 顯示 VIP 權益與目前狀態（是否有效、到期日）
2. 若非課中，提供「用 Stars 購買 VIP（月付）」按鈕：
   - 使用 `sendInvoice` 或 `createInvoiceLink`，currency='XTR'，價格對應 5 USD
3. 收到 `successful_payment` 後：
   - 寫入一筆 payments
   - 呼叫 `activateVip(userId, 30)`：is_vip=1、vip_expire_at=now+30d

### 5.11 /block（封鎖功能）

**功能說明**：
- 封鎖當前對話對象
- 不涉及舉報（與 `/report` 不同）
- 封鎖後不再匹配到該使用者
- 封鎖後該使用者無法再發送訊息

**流程**：
1. 使用者在對話中發送 `/block`
2. Bot 顯示確認提示：「確定要封鎖這位使用者嗎？」
3. 使用者確認封鎖
4. 建立 `user_blocks` 記錄（blocker_id, blocked_id, conversation_id）
5. 更新 `conversations` 狀態為 'blocked'（a_blocked=1 或 b_blocked=1）
6. 通知使用者「已封鎖」

**匹配排除邏輯**：
- 在 `matchBottleForUser` 中排除：
  - 已封鎖的使用者（blocker_id = user）
  - 被封鎖的使用者（blocked_id = user）
  - 被舉報過的使用者（24 小時內）
- 資料庫查詢時使用 `user_blocks` 表排除

**資料庫表**：`user_blocks`（見 3.4.1 節）

### 5.12 /delete_me（刪除帳號）

**功能說明**：
- 使用者可以要求刪除自己的資料
- 標記使用者為 'deleted'
- 清除個人資料欄位
- 保留安全審計記錄（脫敏）

**流程**：
1. 使用者發送 `/delete_me`
2. Bot 顯示刪除後果警告（不可逆操作）
3. 使用者深度確認（輸入「刪除」）
4. 標記使用者為刪除：
   - `nickname` → '[已刪除]'
   - `avatar_url` → NULL
   - `language_pref` → NULL
   - `prefer_gender` → NULL
   - `onboarding_state` → NULL
   - `deleted_at` = datetime('now')
5. 保留安全審計記錄（reports, bans, risk_score）
6. 通知使用者「帳號已刪除」

**資料保留策略**：
- 個人資料：清除
- 安全審計記錄：保留（脫敏）
- 統計資料：保留（不顯示個人資訊）

**資料庫欄位**：`users.deleted_at`、`users.anonymized_at`、`users.deletion_requested_at`

### 5.13 /broadcast_filter（精準廣播）

**權限要求**：僅 `role` 為 `angel` 或 `god` 的使用者可用。

**功能說明**：
支援基於多種條件篩選目標用戶，進行精準訊息推送。系統包含「乾跑模式 (Dry Run)」，可先預覽受眾人數。

**篩選條件 (Filters)**：
- **基本屬性**：性別 (`gender`)、年齡區間 (`age_range`)、國家 (`country`)
- **心理屬性**：MBTI 類型 (`mbti`)、星座 (`zodiac`)
- **系統屬性**：語言 (`language`)、是否 VIP (`is_vip`)
- **活躍度**：最後活躍時間 (`last_active_days`)

**流程**:
1. 管理員輸入 `/broadcast_filter`。
2. 系統引導輸入篩選條件（JSON 格式或互動式按鈕）。
3. **Dry Run**：系統計算符合條件的用戶數，回報給管理員（不發送）。
4. **確認發送**：管理員確認後，建立 `broadcast_job` 並寫入隊列。
5. **後台發送**：Worker 的 Cron Job 處理隊列，分批發送，避免觸發 Telegram 限流。

**權限差異**：
- **god**：可發送無條件全體廣播（filters 為空）。
- **angel**：必須指定至少一項篩選條件，避免誤操作全體廣播。

---

## 6. 星座運勢推播

### 外部流程（Google 表單 / Sheet + Apps Script）

每週產生 12 星座的下週運勢文字。

透過 HTTP POST 或外部 JSON，寫入 horoscope_templates。

### Cloudflare Cron

每週一 09:00（可調整）呼叫 `/cron/horoscope`

### /cron/horoscope handler

1. 找出本週對應的 horoscope_templates
2. 選出 users 中 horoscope_opt_in = 1 的使用者
3. 依 zodiac_sign 發送專屬運勢訊息，附上按鈕：
   - 「✨ 重新配對」→ `/throw`
   - 「🔍 撿個瓶子」→ `/catch`

---

## 7. Telegram Mini App 詳細設計

### 7.1 Mini App 性能優化

**首屏載入 < 2 秒策略**：

1. **多語言首屏資源切分**：
   - 按語言代碼拆分首屏資源（zh-TW、en、ja 等）
   - 僅載入當前語言的翻譯文件
   - 預載常用語言包到 CDN

2. **預載 MBTI 題目/結果 JSON**：
   - MBTI 題目 JSON 預先載入到 Service Worker 快取
   - MBTI 結果說明 JSON 預載到快取
   - 避免首屏載入時請求題目資料

3. **Service Worker 快取策略**：
   - 靜態資源（CSS、JS、圖片）：Cache First
   - API 資料（MBTI 題目、翻譯文件）：Network First，Fallback to Cache
   - 快取過期時間：24 小時（MBTI 題目）、1 小時（翻譯文件）

4. **Skeleton UI**：
   - 首屏顯示 Skeleton 載入狀態
   - 避免白屏，提升使用者體驗
   - 使用 Telegram `MainButton` 顯示載入狀態

**實作範例**：
```typescript
// src/mini-app/utils/cache.ts
export class ServiceWorkerCache {
  static async cacheMBTIQuestions(language: string): Promise<void> {
    const questions = await fetch(`/api/mbti/questions?lang=${language}`);
    await caches.open('mbti-cache').then(cache => {
      cache.put(`/api/mbti/questions?lang=${language}`, questions);
    });
  }
  
  static async getMBTIQuestions(language: string): Promise<any> {
    const cache = await caches.open('mbti-cache');
    const cached = await cache.match(`/api/mbti/questions?lang=${language}`);
    if (cached) return cached.json();
    
    // Network First
    const response = await fetch(`/api/mbti/questions?lang=${language}`);
    await cache.put(`/api/mbti/questions?lang=${language}`, response.clone());
    return response.json();
  }
}
```

### 7.2 Mini App 安全

**initData 驗簽流程**：

1. **接收 initData**：
   - Telegram Mini App 啟動時，從 `window.Telegram.WebApp.initData` 取得
   - `initData` 格式：`user=%7B%22id%22%3A123456789%7D&auth_date=1234567890&hash=...`

2. **驗簽步驟**：
   ```typescript
   // src/telegram/webapp/validate-initdata.ts
   
   import crypto from 'crypto';
   
   export function validateInitData(
     initData: string,
     botSecret: string
   ): boolean {
     const urlParams = new URLSearchParams(initData);
     const hash = urlParams.get('hash');
     urlParams.delete('hash');
     
     // 按鍵名排序
     const dataCheckString = Array.from(urlParams.entries())
       .sort(([a], [b]) => a.localeCompare(b))
       .map(([key, value]) => `${key}=${value}`)
       .join('\n');
     
     // 計算 HMAC-SHA256
     const secretKey = crypto
       .createHmac('sha256', 'WebAppData')
       .update(botSecret)
       .digest();
     
     const calculatedHash = crypto
       .createHmac('sha256', secretKey)
       .update(dataCheckString)
       .digest('hex');
     
     return calculatedHash === hash;
   }
   ```

3. **驗證 auth_date**：
   - 檢查 `auth_date` 是否在 24 小時內
   - 超過 24 小時需重新驗簽

4. **Token 失效策略**：
   - `initData` 中的 `auth_date` 超過 24 小時後失效
   - 失效時提示使用者重新啟動 Mini App
   - 記錄失效事件（用於安全監控）

**處理 web_app_data**：
- 當使用者點擊 Mini App 內的按鈕提交資料時，Telegram 會發送 `web_app_data` 到 Bot
- Bot 需要驗證 `web_app_data` 來源（檢查 user_id、timestamp）
- 格式：`update.message.web_app_data.data`（JSON 字串）

### 7.3 Mini App 社群實踐

**themeParams 適配**：
```typescript
// src/mini-app/utils/theme.ts
const tg = window.Telegram.WebApp;
tg.ready();

// 自動適配深/淺色主題
const theme = tg.themeParams;
document.documentElement.style.setProperty('--bg-color', theme.bg_color || '#ffffff');
document.documentElement.style.setProperty('--text-color', theme.text_color || '#000000');
document.documentElement.style.setProperty('--button-color', theme.button_color || '#3390ec');
```

**MainButton / SecondaryButton**：
```typescript
// 使用 Telegram 原生按鈕，減少自定義 UI
const tg = window.Telegram.WebApp;

// 主要按鈕（丟瓶子）
tg.MainButton.setText('📦 丟瓶子');
tg.MainButton.onClick(() => {
  // 處理丟瓶子邏輯
});
tg.MainButton.show();

// 次要按鈕（查看個人資料）
tg.SecondaryButton.setText('👤 個人資料');
tg.SecondaryButton.onClick(() => {
  // 處理個人資料邏輯
});
tg.SecondaryButton.show();
```

**WebApp.share 分享裂變**：
```typescript
// 分享 MBTI 測驗結果
tg.shareUrl('https://t.me/xunnibot?startapp=share_mbti_' + resultId, {
  text: `我的 MBTI 測驗結果是 ${mbtiType}！你也來測測吧～`,
});

// 分享邀請碼
tg.shareUrl('https://t.me/xunnibot?startapp=invite_' + inviteCode, {
  text: `來 XunNi 一起丟漂流瓶吧！使用我的邀請碼：${inviteCode}`,
});
```

---

## 8. 邀請與裂變機制

### 8.1 邀請碼生成

**邀請碼類型**：
- **永久邀請碼**（每個使用者 1 個）：
  - 格式：使用者 `telegram_id` 的 Base64 編碼或 8 位字母數字混合
  - 可無限次使用
  - 儲存在 `users.invite_code`

**生成邏輯**：
```typescript
// src/domain/invite.ts
export function generateInviteCode(telegramId: string): string {
  // 使用 telegram_id + salt 生成唯一邀請碼
  const hash = crypto.createHash('sha256')
    .update(telegramId + 'INVITE_SALT')
    .digest('hex');
  
  // 取前 8 位，轉換為字母數字混合
  return base64Encode(hash.substring(0, 8)).substring(0, 8);
}
```

### 8.2 邀請驗證流程

**觸發節點**：

**階段 1：邀請記錄（註冊時）**
1. 新使用者註冊時檢查 `/start` 參數：
   - 格式：`/start invite_XUNNI-ABC123`
   - 或 Deep Link：`https://t.me/bot?start=invite_XUNNI-ABC123`
   - 驗證邀請碼是否存在且有效
   - 記錄到 `users.invited_by`（邀請人的 telegram_id）
   - 建立 `invites` 記錄（status='pending'）

**階段 2：邀請激活（完成條件）**
2. 新使用者完成以下所有條件後激活：
   - ✅ 完成 onboarding（含 MBTI 測驗）
   - ✅ 至少丟過 1 個瓶子
   
3. 激活時執行：
   - 將 `invites.status` 更新為 'activated'
   - 更新邀請人的 `successful_invites` 計數 +1
   - 記錄激活時間 `invites.activated_at`

**階段 3：邀請通知（激活後）**
4. 發送通知給邀請人：
   ```
   🎉 邀請成功！
   
   你的好友 ***(隱私擾亂) 已完成註冊並激活！
   
   🎁 獎勵：每日漂流瓶配額 +1
   📊 已邀請：{successful_invites} 人
   🎯 免費用戶上限：10 人
   
   💡 想要無限邀請？升級 VIP 可解鎖 100 人上限！
   ```

5. 隱私保護規則：
   - 被邀請者暱稱：顯示前 3 個字符 + `***`
   - 例如：`張小明` → `張**`
   - 例如：`Alice` → `Ali***`

**階段 4：邀請上限提醒**
6. 當達到免費用戶邀請上限時（9/10）：
   ```
   ⚠️ 邀請名額即將用完
   
   你已成功邀請 9 人，還剩最後 1 個名額！
   
   💎 升級 VIP 可解鎖：
   • 邀請上限：10 → 100 人
   • 每日配額：13 → 130 個瓶子
   • 更多專屬權益
   
   立即升級 → /vip
   ```

7. 當達到免費用戶邀請上限時（10/10）：
   ```
   🎊 恭喜！邀請名額已滿
   
   你已成功邀請 10 人，獲得最大免費獎勵！
   
   💎 想要解鎖更多邀請？
   升級 VIP 可邀請最多 100 人
   
   立即升級 → /vip
   ```

**驗證條件**：
- 完成 onboarding（含 MBTI 測驗）
- 至少丟過 1 個瓶子
- 僅計算首次激活（同一邀請碼只能激活 1 次）
- 不能自我邀請（inviter ≠ invitee）

### 8.3 邀請獎勵規則

**設計決策**：
- ✅ **邀請者獲得獎勵**：每成功邀請 1 人 → 每日配額 +1
- ❌ **被邀請者不獲得額外配額**：只獲得使用產品的機會
- 📊 **理由**：
  1. 更強的病毒式增長動力（邀請者有明確的激勵）
  2. 更清晰的激勵機制（邀請越多，配額越多）
  3. 符合業界最佳實踐（Dropbox、Uber、Airbnb 等）
  4. 技術實現更簡單（無需額外欄位和邏輯）

**配額獎勵計算**：

| 用戶類型 | 基礎配額 | 邀請獎勵 | 上限 | 最大配額 |
|---------|---------|---------|------|---------|
| 免費用戶 | 3 個/天 | +1 個/人 | 10 人 | 13 個/天 |
| VIP 用戶 | 30 個/天 | +1 個/人 | 100 人 | 130 個/天 |

**獎勵規則**：
1. 每成功邀請 1 人（激活）→ **邀請者**每日配額 +1
2. 免費用戶最多邀請 10 人（配額 3 → 13）
3. VIP 用戶最多邀請 100 人（配額 30 → 130）
4. 獎勵永久有效（不會過期）
5. 降級為免費用戶時，獎勵保留但受免費用戶上限限制
6. **被邀請者**獲得的是使用產品的機會，並被引導去邀請他人

**配額計算公式**：
```typescript
function calculateDailyQuota(user: User): number {
  const baseQuota = user.is_vip ? 30 : 3;
  const maxInvites = user.is_vip ? 100 : 10;
  const actualInvites = Math.min(user.successful_invites, maxInvites);
  
  return baseQuota + actualInvites;
}
```

**示例**：
- 免費用戶 A 邀請 5 人 → 每日配額 = 3 + 5 = 8 個
- 免費用戶 B 邀請 15 人 → 每日配額 = 3 + 10 = 13 個（上限）
- VIP 用戶 C 邀請 50 人 → 每日配額 = 30 + 50 = 80 個
- VIP 用戶 D 邀請 120 人 → 每日配額 = 30 + 100 = 130 個（上限）

### 8.4 邀請數據統計

**統計維度**：
- 邀請碼點擊次數（有多少人點擊了邀請連結）
- 邀請碼激活次數（有多少人完成註冊並激活）
- 邀請轉化率（激活次數 / 點擊次數）
- 邀請來源分析（MBTI 分享、漂流瓶分享、個人資料分享）

**KPI 指標對照表**：

| 指標 | 定義 | 計算方式 | 用途 |
|------|------|---------|------|
| 邀請點擊數 | 點擊邀請連結的人數 | COUNT(DISTINCT invitee_id) WHERE status='pending' | 追蹤邀請傳播範圍 |
| 邀請激活數 | 完成激活的邀請數 | COUNT(*) WHERE status='activated' | 追蹤邀請效果 |
| 邀請轉化率 | 激活率 | 激活數 / 點擊數 * 100% | 優化邀請策略 |
| 分享轉化率 | 分享後註冊率 | 分享連結註冊數 / 分享次數 * 100% | 優化分享策略 |
| 平均邀請數 | 每位使用者平均邀請人數 | SUM(activated_invites) / COUNT(*) | 追蹤活躍度 |

### 8.4 分享流程設計

**MBTI 測驗結果分享**：
1. 使用者完成 MBTI 測驗後，顯示「分享結果」按鈕
2. 點擊後使用 `WebApp.share`：
   - Deep Link：`startapp=share_mbti_{resultId}`
   - 分享文案：「我的 MBTI 測驗結果是 {type}！你也來測測吧～」
   - 預覽圖片：MBTI 結果卡片（含類型、描述）

3. 被分享者點開連結後：
   - Bot 檢查 `startapp` 參數
   - 如果是 `share_mbti_{resultId}`：
     - 顯示：「你的好友邀請你來測 MBTI！快來看看你的性格類型吧～」
     - 按鈕：「📊 開始測驗」→ 啟動 Mini App 進入 MBTI 測驗
   - 記錄分享來源到 `referral_sources` 表：
     - `source_type`: 'mbti_share'
     - `source_id`: resultId
     - `shared_by`: 分享者的 telegram_id

**邀請碼分享**：
1. 使用者在 `/profile` 中點擊「分享邀請碼」
2. 使用 `WebApp.share`：
   - Deep Link：`startapp=invite_{inviteCode}`
   - 分享文案：「來 XunNi 一起丟漂流瓶吧！使用我的邀請碼：{inviteCode}」
3. 被分享者點開後：
   - Bot 檢查 `startapp=invite_{code}`
   - 如果是邀請碼，記錄到 `users.invited_by`
   - 啟動註冊流程時帶入邀請碼

---

## 9. 資料保留與清理策略

### 9.1 漂流瓶保留策略

**保留期限**：
- 正常狀態：24 小時（過期後不再被撿起）
- 軟刪除：90 天後標記為 'deleted'，內容匿名化
- 硬刪除：365 天後完全刪除（可選）

**清理流程**：
```
漂流瓶建立 → 24 小時內可被撿起
→ 24 小時後 expires_at 過期，status = 'expired'
→ 90 天後標記為 'deleted'，content 匿名化（保留統計用）
→ 365 天後完全刪除（可選）
```

### 9.2 聊天記錄保留策略

**保留限制**：
- 每個對話對象最多保留 3650 筆訊息
- 超過 3650 筆時，刪除最舊的訊息（FIFO）
- 永久保留最後 100 筆訊息（用於上下文）

### 9.3 使用者資料保留策略

**正常使用者**：
- 個人資料永久保留（除非使用者刪除）
- 統計資料永久保留

**已刪除使用者**：
- 標記為 'deleted'
- 清除個人資料欄位（nickname, avatar_url 等）
- 保留安全審計記錄（reports, bans, risk_score）
- 資料脫敏處理

### 9.4 資料清理 Cron 任務

**每日執行一次**：
- `/cron/cleanup_bottles`：標記 90 天前過期的漂流瓶為 'deleted'，內容匿名化
- `/cron/cleanup_messages`：清理所有對話的過多訊息（超過 3650 筆）

**資料庫欄位**：
- `bottles.deleted_at`、`bottles.anonymized_at`
- `users.deleted_at`、`users.anonymized_at`、`users.deletion_requested_at`

---

## 10. 外部資格查詢 API（給 Moonpacket）

### HTTP 端點

**POST** `/api/eligibility`

**Header**: `X-API-Key: <EXTERNAL_API_KEY>`

**Body**:
```json
{
  "telegram_id": "123456789",
  "program": "red_packet_2025_q1"
}
```

**回應**:
```json
{
  "eligible": true,
  "conditions": {
    "hasMbti": true,
    "passedAntiScam": true,
    "hasThrownBottle": true,
    "notBanned": true,
    "inviteCount": 3,
    "isVip": false
  },
  "reason": "OK"
}
```

### 判斷邏輯

```typescript
interface EligibilityConditions {
  hasMbti: boolean;
  passedAntiScam: boolean;
  hasThrownBottle: boolean;
  notBanned: boolean;
  inviteCount: number;
  isVip: boolean;
}

async function checkEligibility(telegramId: string): Promise<{ 
  eligible: boolean; 
  conditions: EligibilityConditions | null; 
  reason: string; 
}> {
  const user = await db.getUser(telegramId);
  if (!user) {
    return { eligible: false, conditions: null, reason: 'USER_NOT_FOUND' };
  }

  const hasMbti = !!user.mbti_type;
  const passedAntiScam = (user.trust_level || 0) >= 1;
  const hasThrownBottle = await db.userHasThrownBottle(telegramId);
  const notBanned = !isBanned(user);
  const inviteCount = user.activated_invites || 0;
  const isVip = isVipActive(user, new Date());

  const conditions: EligibilityConditions = {
    hasMbti,
    passedAntiScam,
    hasThrownBottle,
    notBanned,
    inviteCount,
    isVip,
  };

  const eligible = hasMbti && hasThrownBottle && notBanned;

  return {
    eligible,
    conditions,
    reason: eligible ? 'OK' : 'CONDITIONS_NOT_MET',
  };
}
```

**Moonpacket 後端可以根據 conditions 自行決定紅包規則**，例如：
- 必須 hasMbti && hasThrownBottle 才可領
- inviteCount 越多紅包越大
- isVip 有額外獎勵

---

## 11. 公開統計 API（給行銷頁面）

### 11.1 HTTP 端點

**GET** `/api/public-stats`

**無需認證**：開放匿名存取，但需速率限制

**回應格式**：
```json
{
  "timestamp": "2025-01-15T12:00:00Z",
  "cumulative": {
    "total_bottles": 12345,      // 累積總漂流瓶數
    "total_users": 5678,         // 累積總使用者數
    "total_messages": 98765,     // 累積總訊息數
    "total_conversations": 4321  // 累積總對話數
  },
  "yesterday": {
    "bottles": 234,              // 昨日新增漂流瓶數
    "users": 56,                 // 昨日新增使用者數
    "messages": 1234,            // 昨日新增訊息數
    "conversations": 89          // 昨日新增對話數
  },
  "active": {
    "active_users_7d": 1234,     // 最近 7 天活躍使用者數
    "active_users_30d": 3456     // 最近 30 天活躍使用者數
  }
}
```

### 11.2 資料聚合邏輯

**Domain 層函數**（`src/domain/public_stats.ts`）：
```typescript
export interface PublicStats {
  timestamp: string;
  cumulative: {
    total_bottles: number;
    total_users: number;
    total_messages: number;
    total_conversations: number;
  };
  yesterday: {
    bottles: number;
    users: number;
    messages: number;
    conversations: number;
  };
  active: {
    active_users_7d: number;
    active_users_30d: number;
  };
}

/**
 * 計算公開統計數據
 */
export async function getPublicStats(
  db: D1Database
): Promise<PublicStats> {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // 累積數據
  const totalBottles = await db.prepare(`
    SELECT COUNT(*) as count
    FROM bottles
    WHERE status != 'deleted'
  `).first();
  
  const totalUsers = await db.prepare(`
    SELECT COUNT(*) as count
    FROM users
    WHERE deleted_at IS NULL
  `).first();
  
  const totalMessages = await db.prepare(`
    SELECT COUNT(*) as count
    FROM conversation_messages
  `).first();
  
  const totalConversations = await db.prepare(`
    SELECT COUNT(*) as count
    FROM conversations
    WHERE status != 'closed'
  `).first();
  
  // 昨日新增
  const yesterdayBottles = await db.prepare(`
    SELECT COUNT(*) as count
    FROM bottles
    WHERE DATE(created_at) = ?
      AND status != 'deleted'
  `).bind(yesterday).first();
  
  const yesterdayUsers = await db.prepare(`
    SELECT COUNT(*) as count
    FROM users
    WHERE DATE(created_at) = ?
      AND deleted_at IS NULL
  `).bind(yesterday).first();
  
  const yesterdayMessages = await db.prepare(`
    SELECT COUNT(*) as count
    FROM conversation_messages
    WHERE DATE(created_at) = ?
  `).bind(yesterday).first();
  
  const yesterdayConversations = await db.prepare(`
    SELECT COUNT(*) as count
    FROM conversations
    WHERE DATE(created_at) = ?
      AND status != 'closed'
  `).bind(yesterday).first();
  
  // 活躍使用者（最近 7 天、30 天）
  const activeUsers7d = await db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count
    FROM behavior_logs
    WHERE DATE(created_at) >= ?
  `).bind(sevenDaysAgo).first();
  
  const activeUsers30d = await db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count
    FROM behavior_logs
    WHERE DATE(created_at) >= ?
  `).bind(thirtyDaysAgo).first();
  
  return {
    timestamp: new Date().toISOString(),
    cumulative: {
      total_bottles: (totalBottles as any).count,
      total_users: (totalUsers as any).count,
      total_messages: (totalMessages as any).count,
      total_conversations: (totalConversations as any).count,
    },
    yesterday: {
      bottles: (yesterdayBottles as any).count,
      users: (yesterdayUsers as any).count,
      messages: (yesterdayMessages as any).count,
      conversations: (yesterdayConversations as any).count,
    },
    active: {
      active_users_7d: (activeUsers7d as any).count,
      active_users_30d: (activeUsers30d as any).count,
    },
  };
}
```

### 11.3 快取策略

**快取機制**：
- 使用 Cloudflare KV 或 D1 表快取統計結果
- 快取時間：5 分鐘
- 避免頻繁查詢資料庫，降低負載

**快取實作**：
```typescript
// src/api/public-stats.ts

import { getPublicStats } from '../domain/public_stats';

const CACHE_KEY = 'public_stats';
const CACHE_TTL = 5 * 60; // 5 分鐘

export async function handlePublicStats(
  request: Request,
  env: Env
): Promise<Response> {
  // 速率限制（使用 Cloudflare Rate Limiting 或自定義邏輯）
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!await checkRateLimit(clientIP, env)) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // 檢查快取
  const cached = await env.STATS_CACHE?.get(CACHE_KEY, { type: 'json' });
  if (cached) {
    return new Response(JSON.stringify(cached), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // 5 分鐘
      },
    });
  }
  
  // 計算統計數據
  const stats = await getPublicStats(env.DB);
  
  // 寫入快取
  await env.STATS_CACHE?.put(
    CACHE_KEY,
    JSON.stringify(stats),
    { expirationTtl: CACHE_TTL }
  );
  
  return new Response(JSON.stringify(stats), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
    },
  });
}

// 速率限制檢查（每 IP 每分鐘最多 10 次請求）
async function checkRateLimit(
  clientIP: string,
  env: Env
): Promise<boolean> {
  const key = `rate_limit:public_stats:${clientIP}`;
  const count = await env.STATS_CACHE?.get(key, { type: 'json' });
  
  if (count && count >= 10) {
    return false;
  }
  
  await env.STATS_CACHE?.put(
    key,
    JSON.stringify((count || 0) + 1),
    { expirationTtl: 60 } // 1 分鐘
  );
  
  return true;
}
```

### 11.4 速率限制

**限制規則**：
- 每 IP 每分鐘最多 10 次請求
- 超過限制返回 429 狀態碼
- 使用 Cloudflare KV 記錄請求次數

**CORS 支援**（可選）：
- 如果行銷頁面在不同域名，需設定 CORS Header
- `Access-Control-Allow-Origin: *` 或指定域名

### 11.5 資料庫索引優化

為提升查詢性能，需確保以下索引存在：
```sql
-- bottles 表
CREATE INDEX IF NOT EXISTS idx_bottles_created_at ON bottles(created_at);
CREATE INDEX IF NOT EXISTS idx_bottles_status ON bottles(status);

-- users 表
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- conversation_messages 表
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON conversation_messages(created_at);

-- conversations 表
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);

-- behavior_logs 表（用於活躍使用者統計）
CREATE INDEX IF NOT EXISTS idx_behavior_logs_created_at ON behavior_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_behavior_logs_user_id ON behavior_logs(user_id);
```

### 11.6 路由實作

**router.ts**：
```typescript
// src/router.ts

router.get('/api/public-stats', async (request, env) => {
  return handlePublicStats(request, env);
});
```

**KV 命名空間配置**：
- 在 `wrangler.toml` 中新增 `STATS_CACHE` KV 命名空間（或使用現有的 `RISK_CACHE`）：
```toml
[[kv_namespaces]]
binding = "STATS_CACHE"
id = "<KV_NAMESPACE_ID>"
```

**替代方案**（如果不想新增 KV）：
- 使用 `stats_cache` 表快取統計結果（見 3.14 節）
- 每 5 分鐘更新一次（透過 Cron 任務 `/cron/update_stats_cache`）
- API 直接查詢快取表，無需即時計算

### 11.7 Cron 任務更新快取（可選）

如果使用資料庫快取而非 KV：

```typescript
// src/telegram/handlers/cron_update_stats_cache.ts

/**
 * 每 5 分鐘更新公開統計快取
 */
export async function handleUpdateStatsCache(
  env: Env,
  db: D1Database
): Promise<void> {
  const stats = await getPublicStats(db);
  
  // 更新快取表
  await db.prepare(`
    INSERT INTO stats_cache (cache_key, cache_value, expires_at)
    VALUES ('public_stats', ?, datetime('now', '+5 minutes'))
    ON CONFLICT(cache_key) DO UPDATE SET
      cache_value = excluded.cache_value,
      expires_at = excluded.expires_at,
      updated_at = datetime('now')
  `).bind(JSON.stringify(stats)).run();
}
```

**Cron 配置**：
```toml
# wrangler.toml
[[triggers.crons]]
schedule = "*/5 * * * *"  # 每 5 分鐘
```

---

## 12. 廣告播放（gigapub）

### 環境變數
- `GIGAPUB_API_KEY`
- `GIGAPUB_PLACEMENT_ID`

### 使用場景
僅在 `/throw` 丟瓶前顯示一次（非 VIP）。

### fetchAd(env)
- 呼叫 gigapub API 取得文案或素材
- 若無廣告資料，顯示內建 VIP 推廣文字

---

## 13. 環境變數與 wrangler 設定

### wrangler.toml 範例

```toml
name = "xunni-bot"
main = "src/worker.ts"
compatibility_date = "2025-01-01"

[[d1_databases]]
binding = "DB"
database_name = "xunni-db"
database_id = "<D1_DATABASE_ID>"

[[kv_namespaces]]
binding = "RISK_CACHE"
id = "<KV_NAMESPACE_ID>"

[vars]
TELEGRAM_BOT_TOKEN = "..."
TELEGRAM_WEBHOOK_SECRET = "..."
OPENAI_API_KEY = "..."
GIGAPUB_API_KEY = "..."
GIGAPUB_PLACEMENT_ID = "..."
HOROSCOPE_SOURCE_URL = "..."    # 若使用外部 JSON
EXTERNAL_API_KEY = "..."        # 給 Moonpacket 用的 API key

BROADCAST_BATCH_SIZE = "25"
BROADCAST_MAX_JOBS = "3"
```

---

## 14. 測試規範（Vitest）

### 優先針對以下純函數寫單元測試

- `getDailyThrowLimit(user, today)`
- `canThrowBottle(user, today, usage)`
- `getConversationDailyLimit(user)`
- `canSendConversationMessage(user, convoId, today)`
- `addRisk(userId, reason)` / `applyBan` / `isBanned`
- `matchBottleForUser(options)`
- `checkEligibility(telegramId)`

### Handler 測試

- 模擬 Telegram Update JSON 呼叫 handler
- Mock `sendTelegramMessage`、`db.client`

---

## 15. 建議的 Cursor 開發順序

### 階段 1: 基礎架構
1. **建立 schema**: 根據本規格書的 SQL，生成 `db/schema.sql`
2. **實作 db/client.ts**: 對每個表提供基本 CRUD / 查詢函式

### 階段 2: Domain 邏輯
3. **實作 domain**:
   - `usage.ts`
   - `risk.ts`
   - `matching.ts`
   - `horoscope.ts`
   - `eligibility.ts`
4. **撰寫 tests/domain/*.test.ts**

### 階段 3: Telegram Handlers
5. **實作 Telegram handlers**:
   - `/start` → `/profile` → `/throw` → `/catch` → message forwarding → `/report` → `/appeal` → `/vip` → `/broadcast`

### 階段 4: 路由與部署
6. **實作 router.ts + worker.ts**:
   - 處理 Telegram webhook
   - `/api/eligibility`
   - `/api/public-stats`（公開統計 API）
   - `/cron/horoscope`
   - `/cron/broadcast`
7. **配置 wrangler、初始化 D1、部署，測試與 Moonpacket 串接**

---

## 附錄：術語表 / Glossary

### 核心詞彙定義

在本文檔和整個專案中，以下術語具有特定含義，請嚴格遵守：

- **User（使用者）**：註冊並使用本 Bot 的 Telegram 使用者。每個 User 有唯一的 `telegram_id`。不是 "member"、"player" 或其他術語。
- **Role（角色）**：使用者的權限角色，分為：
  - `user`（一般使用者）：預設角色，所有新註冊使用者
  - `group_admin`（群組管理員）：預留角色，用於未來支援 Telegram 群組功能（當前 M1 階段不使用）
  - `angel`（平台管理員）：平台運營管理員，可執行大部分管理操作
  - `god`（平台所有者）：最高權限，擁有所有管理權限
- **Bottle（漂流瓶）**：使用者丟出的匿名訊息。包含內容、匹配條件（MBTI、年齡、性別等）和狀態（pending/matched/expired/deleted）。
- **Conversation（對話）**：兩個 User 通過匹配漂流瓶建立的匿名聊天對話。每個對話有唯一的 `conversation_id`，最多保存 3650 筆訊息。
- **Match（匹配）**：將漂流瓶分配給符合條件的 User 的過程。匹配邏輯需排除已封鎖、被舉報的使用者。
- **MBTI Result（MBTI 結果）**：使用者完成 MBTI 測驗後的性格類型結果（如 INTJ、ENFP 等）。
- **Invite（邀請）**：使用者透過邀請碼邀請新使用者註冊。成功邀請可增加每日漂流瓶上限。
- **VIP（付費使用者）**：透過 Telegram Stars 付費訂閱的使用者。享有解鎖對方清晰頭像、更多漂流瓶數量、翻譯服務、無廣告等權益。
- **Trust Level（信任等級）**：基於反詐騙測驗和風險分數的使用者信任度評級。影響匹配優先順序。
- **Risk Score（風險分數）**：基於使用者行為（舉報、違規等）計算的風險評分。過高會導致自動封禁。
- **Ban（封禁）**：因違規行為或高風險分數導致使用者暫時或永久無法使用服務。
- **Block（封鎖）**：使用者主動封鎖另一個使用者，不想再與其聊天。不屬於舉報機制。
- **Report（舉報）**：使用者舉報其他使用者的違規行為。多次舉報會觸發自動封禁流程。
- **Appeal（申訴）**：被封禁的使用者申請解除封禁的流程。
- **Permission（權限）**：指令和功能的訪問控制。一般使用者（user）無法看到或使用管理指令（`/admin*`、`/broadcast` 等）。
- **Command Visibility（指令可見性）**：根據使用者角色決定在 `/help` 中顯示哪些指令。一般使用者（user）絕對看不到管理指令。
- **Active Push（主動推送）**：系統根據用戶行為主動發送的提醒（如未丟瓶提醒、召回通知），需遵守安靜時段和頻率限制。
- **Broadcast Filter（精準廣播篩選）**：管理員群發訊息時使用的過濾條件（如性別、MBTI、活躍度），用於精準觸達目標用戶。

**使用規範**：
- 在代碼、註釋和文檔中，統一使用上述術語
- 不要混用 "user"/"member"/"player"
- 不要使用 "message" 代替 "Bottle" 或 "Conversation Message"
- 參考本文檔的術語定義，保持一致

---

## 附錄：重要提醒

### 安全規範
- 所有 URL 必須通過白名單檢查
- 匿名轉發不暴露真實 Telegram ID
- 風險分數累積機制需嚴格執行

### 性能考量
- 廣播任務需使用隊列 + 限速
- 每日使用次數查詢需考慮快取
- 匹配算法需優化查詢效率

### 成本控制
- 合理使用 KV 快取，避免過度讀寫
- D1 查詢需優化索引
- 翻譯 API 調用需控制頻率

### 關鍵規則（必須遵守）

#### 訊息格式
- **所有 Telegram 訊息使用純文字 + 官方 Emoji**
- **不使用 HTML 或 Markdown 格式**

#### 不可修改的欄位
- **性別（gender）**: 設定後永遠不能修改（需二次確認）
- **生日（birthday）**: 設定後永遠不能修改（需二次確認）
- **實作位置**: `@src/telegram/handlers/profile.ts` 和 `@src/telegram/handlers/start.ts`

#### 年齡限制
- 未滿 18 歲不允許註冊
- 必須輸入真實生日驗證
- **實作位置**: `@src/domain/user.ts` 和 `@src/telegram/handlers/start.ts`

### 受保護的文件/目錄

**⚠️ 修改前必須謹慎，建議先與維護者確認：**

- `@wrangler.toml` - Cloudflare 配置（部署相關）
- `@src/db/schema.sql` - 資料庫 Schema（必須通過遷移腳本）
- `@src/db/migrations/` - 遷移腳本目錄（變更需審核）
- `@scripts/backup-*.ts` - 備份腳本（備份策略相關）
- `@doc/SPEC.md` - 核心規格書（重大變更需審核）

**🔒 絕對禁止修改：**

- `.dev.vars` - 包含敏感資訊（在 `.gitignore` 中）
- `node_modules/` - 依賴包
- `package-lock.json` / `pnpm-lock.yaml` - 鎖定文件（除非明確要求更新依賴）

### 重要文檔位置

在編輯任何代碼前，必須先閱讀：

1. **專案規格書**: `@doc/SPEC.md` - 本文檔（完整的業務邏輯和資料庫設計）
2. **開發規範**: `@doc/DEVELOPMENT_STANDARDS.md` - 代碼風格和命名規範
3. **模組設計**: `@doc/MODULE_DESIGN.md` - 架構原則和分層設計
4. **環境配置**: `@doc/ENV_CONFIG.md` - 環境變數配置和開發環境設置（包含**開發前檢查清單**）
5. **UI 設計指南**: `@doc/UI_GUIDELINE.md` - UI 設計規範、動畫規範和互動體驗標準（Mini App 開發必讀）

完整文檔索引見：`@doc/README.md`

### 命令速查

```bash
# 本地開發
pnpm dev

# 執行測試
pnpm test

# 執行 Lint
pnpm lint

# 本地備份
pnpm backup

# 推送到 GitHub
pnpm backup:push

# 部署到 Staging
pnpm deploy:staging

# 部署到 Production
pnpm deploy:production
```

### 故障排除

#### 問題：不知道從哪裡開始
**解決方案**: 先閱讀 `@doc/SPEC.md` 第 15 節「建議的 Cursor 開發順序」

#### 問題：不確定命名規範
**解決方案**: 查看 `@doc/DEVELOPMENT_STANDARDS.md` 第 2.2 節

#### 問題：不確定術語使用
**解決方案**: 查看本文檔附錄「術語表 / Glossary」，嚴格遵守術語定義

#### 問題：不知道如何測試
**解決方案**: 參考 `@doc/TESTING.md` 和現有測試文件 `@tests/domain/`

#### 問題：不確定架構設計
**解決方案**: 閱讀 `@doc/MODULE_DESIGN.md` 了解分層設計原則

---

**最後更新**: 2025-01-15  
**維護者**: 專案團隊

