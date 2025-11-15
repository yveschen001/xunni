# XunNi 專案規格書

## 1. 專案總覽

### 產品資訊
- **產品名稱**: XunNi
- **Telegram Bot**: @xunni_bot
- **類型**: MBTI + 星座心理測驗漂流瓶交友 Bot（匿名聊天）

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
- 每日 30 個漂流瓶，可透過邀請好友最高升級到 100 個
- 可指定星座／MBTI 目標篩選
- **34 種語言自動翻譯**：
  - 優先使用 **OpenAI GPT-4o-mini**（高品質）
  - 失敗時自動降級到 **Google Translate**（並提示）
  - 翻譯失敗時發送原文 + 提示
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
- 對外 HTTP API `/api/eligibility`，給 Moonpacket 紅包系統查資格
- 上帝 / 天使帳號：可按條件（性別、年齡、星座、語言等）群發訊息（隊列 + 限速）
- **使用者封鎖功能**：/block（不舉報，只是不想再聊）
- **避免重複匹配**：排除曾經封鎖/被封鎖/被舉報過的使用者
- **資料保留策略**：漂流瓶 90 天後軟刪除，聊天記錄最多 3650 筆（每對象）
- **使用者權利**：/delete_me（刪除帳號，保留安全審計記錄）

#### 互動通道分層與 Mini App 最佳實踐

**架構原則**：
- **Bot 僅處理通知/Deep Link**：短流程、即時回應、通知推送
- **長流程改走 WebApp**：註冊引導、個人資料編輯、MBTI 測驗、聊天界面

**Telegram Mini App**（當前階段）：
- 使用 `initData` 驗簽確保安全性
- 首屏載入 < 2 秒（性能要求）
- 支援 `WebApp.share` Deep Link（`startapp=share_mbti_{resultId}`）

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

### 2.2 專案目錄結構

```
src/
  worker.ts            -- Cloudflare Worker 入口
  router.ts            -- HTTP 路由 (Telegram webhook / api / cron)
  config/
    env.ts             -- 讀取 & 驗證環境變數
  db/
    schema.sql         -- D1 初始化腳本
    client.ts          -- DB 封裝 (users, bottles, ...)
  domain/
    user.ts            -- 使用者邏輯
    usage.ts            -- 每日漂流瓶 / 對話次數
    risk.ts             -- 風險分數 / 封禁
    matching.ts         -- 漂流瓶匹配
    horoscope.ts        -- 星座運勢工具
    eligibility.ts      -- 對外資格查詢
  telegram/
    types.ts            -- Telegram Update / Callback 型別
    handlers/
      start.ts
      profile.ts
      throw.ts
      catch.ts
      msg_forward.ts    -- 對話消息轉發
      report.ts
      appeal.ts
      vip.ts
      help.ts
      broadcast.ts      -- 上帝/天使
      admin.ts          -- 管理員工具

tests/
  domain/
    usage.test.ts
    risk.test.ts
    matching.test.ts
    eligibility.test.ts

wrangler.toml
package.json
```

---

## 3. 資料庫 Schema（D1）

### 3.1 users

```sql
CREATE TABLE users (
  telegram_id TEXT PRIMARY KEY,
  role TEXT,              -- user / admin / god / angel
  nickname TEXT,
  avatar_url TEXT,        -- 頭像 URL 或 TG file_id 對應的 URL
  avatar_source TEXT,     -- telegram / ai / custom
  ai_gender_hint TEXT,    -- AI 推測性別提示文字

  gender TEXT,            -- male / female / other (設定後不可修改)
  birthday DATE,          -- 生日 YYYY-MM-DD (設定後不可修改，用於計算年齡和星座)
  age_range TEXT,         -- '18-22' / '23-30' / '31-40' / '40+' (由生日計算)
  country TEXT,           -- 'TW', 'JP' 等
  zodiac_sign TEXT,       -- aries / taurus / ... / pisces (由生日計算)
  mbti_type TEXT,         -- 16 型之一，完成測驗後寫入
  language_pref TEXT,     -- 介面 + 聊天偏好語言，如 zh-TW, en, ja

  prefer_gender TEXT,     -- 想認識的性別
  trust_level INTEGER,    -- 反詐測驗結果，>=1 視為通過

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
  filters_json TEXT,        -- JSON 條件
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

---

## 5. 使用流程與 Telegram 指令

### 5.1 /start（初次引導）

**重要特性**：
- **智能對話式引導**：使用俏皮的對話風格，讓註冊過程更友好
- **中斷恢復機制**：支援中斷後從上次步驟繼續
- **深度確認**：性別、生日設定後永遠不能修改，需二次確認
- **年齡限制**：未滿 18 歲不允許註冊
- **條款同意**：必須同意使用者條款和隱私權政策

**詳細流程請參考**：[ONBOARDING_FLOW.md](./ONBOARDING_FLOW.md)

**流程概要**:

1. 建立或讀取 users 記錄
2. 檢查是否已完成 onboarding，未完成則進入以下 10 步：

#### Step 0：歡迎與條款同意

- 智能對話歡迎使用者
- 必須查看並同意**使用者條款**和**隱私權政策**
- 記錄同意時間和版本號

#### Step 1：暱稱 & 頭像

- 預設使用 Telegram first_name 或 username
- AI 生成 1–3 個暱稱建議（根據語言、產品主題）
- 支援上傳自訂頭像或使用 Telegram 頭像

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
- **年齡驗證**：未滿 18 歲拒絕註冊，提示「請成年後再來」
- 計算年齡區間和星座
- 選擇後需**二次確認**才能寫入

#### Step 5：國家

- 選擇國家/地區代碼（TW, JP, KR, ...）

#### Step 6：喜好性向（目標對象）

- 想認識的性別：男 / 女 / 其他 / 不限
- 一般使用者只有「目標性別」會用到

#### Step 7：MBTI 測驗

- 問卷拆頁（每頁 3–5 題）
- 支援中斷恢復（保存已答題目）
- 每頁完成後回覆鼓勵文字
- 完成後計算 MBTI 類型

#### Step 8：反詐騙測驗

- 提供 5 題情境題
- 支援中斷恢復
- 得分 >= 3 分：通過
- 未達標：友善提示 + 允許重新測驗

#### Step 9：完成註冊

- 顯示完整個人資料摘要
- 標記使用者為「可用狀態」
- 提供快速操作按鈕

**中斷恢復**：
- 使用 `onboarding_state` JSON 欄位記錄進度
- 下次 `/start` 自動從中斷處繼續
- 支援查看已填寫資料

### 5.2 /profile（個人資料）

顯示：暱稱、性別、年齡區間、國家、MBTI、星座、語言、邀請碼、是否 VIP、每日漂流瓶上限等。

**編輯限制**：
- **可編輯**：暱稱、頭像、語言、國家、喜好性向
- **不可編輯**：性別、生日（永遠不能修改，不顯示編輯按鈕）
- **管理員特殊權限**：god 角色可修改所有欄位（需記錄操作日誌）

### 5.3 /throw（丟漂流瓶）

**流程**:

1. 檢查：`isBanned(user)`，未完成 onboarding 則拒絕
2. 讀取 daily_usage，使用 `canThrowBottle()` 判斷是否還有 quota

**一般 vs VIP 行為**:

**一般使用者**:
- 必須設定 target_gender（從 /start 的喜好性向帶入，或丟瓶時再選）
- 不可設定星座 / MBTI / 年齡 / 地區 篩選 → 對應欄位留空
- 顯示廣告：
  - 呼叫 `fetchAd(env)`（gigapub），並同時展示「升級 VIP」按鈕
  - 使用者點「先丟瓶子」才進入下一步

**VIP 使用者**:
- 可設定：target_gender + target_zodiac_filter + target_mbti_filter（可選）
- 可額外選擇目標年齡區間 / 地區（選配）
- 不顯示廣告

3. 使用者輸入瓶子內容（文字 + 官方 emoji，檢查長度上限）
4. 建立 bottles 記錄，status='pending'、expires_at = created_at + 24h
5. daily_usage.throws_count += 1

### 5.4 /catch（撿漂流瓶）

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
4. 若沒找到：
   - 回覆「目前沒有適合你的瓶子，稍後再試」

### 5.5 對話消息轉發（匿名聊天）

任何來自 conversations 雙方的訊息，都由 bot 中轉：

1. **驗證**: 對應 conversation_id 是否存在且 status='active'
2. **檢查封鎖狀態**：確認接收者未封鎖發送者
3. **僅允許文字 + 官方 emoji**（不使用 HTML/Markdown）:
   - 非文字 → 回覆「目前僅支援文字與官方表情符號」
4. **本地規則檢查**（必須通過）:
   - **URL 白名單檢查**：不在白名單 → 拒絕訊息，提示安全原因，並 `addRisk(URL_BLOCKED)`
   - **敏感詞過濾**：包含敏感詞 → 拒絕訊息，累加風險分數
   - **長度檢查**：超過 1000 字 → 拒絕訊息
   - **Emoji 驗證**：僅允許官方 Emoji
5. **AI 審核**（可選，失敗不阻擋）:
   - 嘗試 OpenAI 內容審核（timeout: 3s）
   - 失敗時：記錄日誌，**不阻擋發言**，僅依靠本地規則
   - 成功且標記違規時：根據風險分數決定是否阻擋
   - 記錄到 ai_moderation_logs（用於人工抽查）
6. **每對象每日訊息數**:
   - 用 `canSendConversationMessage()` 判斷是否超過 10（免費） / 100（VIP）
   - 超額則提示「今天對這位對象的發言已達上限，明天再聊」
7. **VIP 翻譯**:
   - 若對話任一方為 VIP：
     - 優先使用 **OpenAI** 翻譯
     - 失敗時自動降級到 **Google Translate**
     - 記錄降級事件（用於監控）
   - 免費使用者：
     - 僅使用 **Google Translate**
   - 翻譯失敗時：發送原文 + 提示「翻譯服務暫時有問題，請先看原文」
   - 詳細策略請參考：TRANSLATION_STRATEGY.md
8. **儲存訊息記錄**:
   - 儲存到 conversation_messages
   - 限制每個對話對象最多保留 3650 筆訊息
   - 超過時刪除最舊的，保留最後 100 筆
9. 使用 `recordConversationMessage()` 更新 conversation_daily_usage

### 5.6 /report（舉報）

1. 每個舉報記錄寫入 reports
2. 重新計算過去 24 小時內針對 target_id 的 unique reporters 數
3. 依前述規則封禁
4. 同時累加 risk_score
5. 回覆舉報者「已收到舉報，我們會審查」

### 5.7 /appeal（申訴）

使用者在被封期間可發 `/appeal`：

1. 輸入申訴內容，寫入 appeals
2. 管理員可在 `/admin` 介面查看並更新 status

### 5.8 /vip（VIP 購買）

1. 顯示 VIP 權益與目前狀態（是否有效、到期日）
2. 若非課中，提供「用 Stars 購買 VIP（月付）」按鈕：
   - 使用 `sendInvoice` 或 `createInvoiceLink`，currency='XTR'，價格對應 5 USD
3. 收到 `successful_payment` 後：
   - 寫入一筆 payments
   - 呼叫 `activateVip(userId, 30)`：is_vip=1、vip_expire_at=now+30d

### 5.9 /help

說明：
- 如何丟瓶 / 撿瓶
- 舉報／封禁機制
- 邀請好友獎勵機制
- VIP 功能

### 5.10 /block（封鎖功能）

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

### 5.11 /delete_me（刪除帳號）

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

### 5.12 /broadcast（上帝 / 天使）

僅 role 為 god 或 angel 的使用者可用。

**流程**:

1. 選擇廣播文字內容（文字 + emoji）
2. 設定篩選條件：
   - 性別、年齡區間、星座、語言、VIP、邀請數、國家等
3. 寫入 broadcast_jobs + 對應的 broadcast_queue
4. god 可對所有人廣播（filters_json 可為空）
5. angel 必須至少指定一項篩選條件（程式層限制）

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

## 7. 外部資格查詢 API（給 Moonpacket）

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

## 8. 廣告播放（gigapub）

### 環境變數
- `GIGAPUB_API_KEY`
- `GIGAPUB_PLACEMENT_ID`

### 使用場景
僅在 `/throw` 丟瓶前顯示一次（非 VIP）。

### fetchAd(env)
- 呼叫 gigapub API 取得文案或素材
- 若無廣告資料，顯示內建 VIP 推廣文字

---

## 9. 環境變數與 wrangler 設定

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

## 10. 測試規範（Vitest）

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

## 11. 建議的 Cursor 開發順序

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
   - `/cron/horoscope`
   - `/cron/broadcast`
7. **配置 wrangler、初始化 D1、部署，測試與 Moonpacket 串接**

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

