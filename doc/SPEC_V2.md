# XunNi 專案規格書 v2.0

## 1. 專案總覽

### 產品資訊
產品名稱：XunNi
Telegram Bot：@xunni_bot
類型：MBTI + 星座心理測驗漂流瓶交友 Bot（匿名聊天）

### 架構目標
運行在 Cloudflare Workers，搭配 D1（SQL 資料庫）+ KV（可選）
成本極低，可長期運營
所有邏輯集中在一個 Worker 專案，透過 Telegram Webhook、HTTP API、Cron 觸發

### 核心特性

#### 全員必須完成
暱稱 & 頭像
MBTI 測驗
反詐騙測驗
完成後才能丟瓶／撿瓶

#### 漂流瓶匿名配對
依 MBTI、年齡、性別等做匹配
支援聊天記錄查看
支援漂流瓶歷史記錄

#### 免費使用者
每日最多 3 個漂流瓶（可透過邀請好友，最高增加到 10 個）
只能設定「目標性別」，不能設定星座／MBTI 篩選
無翻譯功能

#### VIP 使用者
透過 Telegram Stars 付費訂閱（約 5 USD / 月）
每日 30 個漂流瓶，可透過邀請好友最高升級到 100 個
可指定星座／MBTI 目標篩選
34 種語言自動翻譯對話，且無廣告

#### 所有聊天
只允許文字 + 官方 Emoji（不使用 HTML/Markdown）
嚴格 URL 白名單
透過中轉 bot 匿名轉發，不暴露真實 Telegram ID
完整聊天記錄保存

#### 安全風控
反詐騙測驗 + risk_score + AI 審核
多人舉報 → 分級封禁
提供 /appeal 申訴機制

#### 主動推送與召回
智能推送機制（丟瓶提醒、撿瓶提醒、對話提醒）
根據使用者活躍度調整推送頻率
避免打擾使用者
使用者可自訂推送偏好

#### 使用者數據統計
完整的使用統計（丟瓶數、撿瓶數、聊天次數）
充值記錄查詢
活躍度排名（全球百分比）
聊天記錄查看

#### 其他功能
每週星座運勢推播，召回使用者來丟／撿瓶
對外 HTTP API /api/eligibility，給 Moonpacket 紅包系統查資格
上帝 / 天使帳號：可按條件（性別、年齡、星座、語言等）群發訊息（隊列 + 限速）

---

## 2. 技術棧與專案結構

### 2.1 技術棧
Runtime：Cloudflare Workers
DB：Cloudflare D1（SQLite 相容）
KV（可選）：Cloudflare KV（風險分數、cache 用）
語言：TypeScript（ESM 模組）
測試：Vitest

### 2.2 專案目錄結構

src/
  worker.ts            -- Cloudflare Worker 入口
  router.ts            -- HTTP 路由 (Telegram webhook / api / cron)
  config/
    env.ts             -- 讀取 & 驗證環境變數
  db/
    schema.sql         -- D1 初始化腳本
    client.ts          -- DB 封裝
  domain/
    user.ts            -- 使用者邏輯
    usage.ts           -- 每日漂流瓶 / 對話次數
    risk.ts            -- 風險分數 / 封禁
    matching.ts         -- 漂流瓶匹配
    horoscope.ts       -- 星座運勢工具
    eligibility.ts     -- 對外資格查詢
    stats.ts           -- 運營數據統計
    user_stats.ts      -- 使用者數據統計
    push.ts            -- 推送邏輯
  telegram/
    types.ts           -- Telegram Update / Callback 型別
    handlers/
      start.ts         -- 註冊引導（10 步）
      profile.ts       -- 個人資料
      throw.ts         -- 丟漂流瓶
      catch.ts         -- 撿漂流瓶
      msg_forward.ts   -- 對話消息轉發
      report.ts        -- 舉報
      appeal.ts        -- 申訴
      vip.ts           -- VIP 購買
      help.ts          -- 幫助
      broadcast.ts     -- 上帝/天使群發
      admin.ts         -- 管理員工具
      stats.ts         -- 使用者統計
      chats.ts         -- 聊天記錄
      settings.ts      -- 推送設定
  services/
    openai.ts          -- OpenAI API
    gigapub.ts         -- 廣告 API
    telegram.ts        -- Telegram Bot API 封裝
  utils/
    date.ts            -- 日期處理
    validation.ts      -- 驗證
    url-whitelist.ts   -- URL 白名單
    emoji.ts           -- Emoji 處理
  i18n/
    index.ts           -- i18n 核心
    keys.ts            -- 翻譯鍵值
    locales/           -- 語言包

tests/
  domain/
  telegram/

wrangler.toml
package.json

---

## 3. 資料庫 Schema（D1）

### 3.1 users（使用者）

CREATE TABLE users (
  telegram_id TEXT PRIMARY KEY,
  role TEXT,              -- user / admin / god / angel
  nickname TEXT,
  avatar_url TEXT,
  avatar_source TEXT,     -- telegram / ai / custom
  ai_gender_hint TEXT,

  gender TEXT,            -- male / female / other (設定後不可修改)
  birthday DATE,          -- YYYY-MM-DD (設定後不可修改)
  age_range TEXT,         -- 由生日計算
  country TEXT,
  zodiac_sign TEXT,       -- 由生日計算
  mbti_type TEXT,
  language_pref TEXT,

  prefer_gender TEXT,
  trust_level INTEGER,

  is_vip INTEGER,
  vip_expire_at DATETIME,

  invite_code TEXT,
  invited_by TEXT,
  activated_invites INTEGER,

  onboarding_state TEXT,  -- JSON
  onboarding_started_at DATETIME,
  onboarding_completed_at DATETIME,
  
  terms_accepted INTEGER DEFAULT 0,
  privacy_accepted INTEGER DEFAULT 0,
  terms_accepted_at DATETIME,
  privacy_accepted_at DATETIME,
  terms_version TEXT,
  privacy_version TEXT,

  risk_score INTEGER DEFAULT 0,
  created_at DATETIME,
  updated_at DATETIME
);

### 3.2 bottles（漂流瓶）

CREATE TABLE bottles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id TEXT,
  content TEXT,
  mood_tag TEXT,
  created_at DATETIME,
  expires_at DATETIME,
  status TEXT,            -- pending / matched / expired / deleted

  target_gender TEXT,
  target_age_range TEXT,
  target_region TEXT,
  target_zodiac_filter TEXT,
  target_mbti_filter TEXT,
  language TEXT
);

### 3.3 conversations（對話）

CREATE TABLE conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bottle_id INTEGER,
  user_a_id TEXT,
  user_b_id TEXT,
  created_at DATETIME,
  last_message_at DATETIME,
  status TEXT,           -- active / closed / blocked

  max_rounds INTEGER,
  a_blocked INTEGER DEFAULT 0,
  b_blocked INTEGER DEFAULT 0
);

### 3.4 conversation_messages（聊天記錄）

CREATE TABLE conversation_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER,
  sender_id TEXT,
  receiver_id TEXT,
  message_text TEXT,
  is_translated INTEGER DEFAULT 0,
  original_language TEXT,
  translated_language TEXT,
  created_at DATETIME
);

### 3.5 bottle_chat_history（漂流瓶聊天記錄）

CREATE TABLE bottle_chat_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bottle_id INTEGER,
  conversation_id INTEGER,
  user_a_id TEXT,
  user_b_id TEXT,
  bottle_content TEXT,
  first_message_at DATETIME,
  last_message_at DATETIME,
  total_messages INTEGER DEFAULT 0,
  status TEXT,
  created_at DATETIME
);

### 3.6 user_statistics（使用者統計）

CREATE TABLE user_statistics (
  user_id TEXT PRIMARY KEY,
  total_throws INTEGER DEFAULT 0,
  total_catches INTEGER DEFAULT 0,
  successful_matches INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  unique_partners INTEGER DEFAULT 0,
  activity_score INTEGER DEFAULT 0,
  last_active_at DATETIME,
  updated_at DATETIME,
  last_calculated_at DATETIME
);

### 3.7 recharge_records（充值記錄）

CREATE TABLE recharge_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  payment_id INTEGER,
  stars_amount INTEGER,
  recharge_type TEXT,    -- 'vip_subscription' / 'direct_recharge' / 'gift'
  status TEXT,
  created_at DATETIME
);

### 3.8 push_notifications（推送記錄）

CREATE TABLE push_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  notification_type TEXT,
  content TEXT,
  status TEXT,          -- 'sent' / 'dismissed' / 'clicked'
  sent_at DATETIME,
  clicked_at DATETIME,
  dismissed_at DATETIME
);

### 3.9 push_schedule（推送排程）

CREATE TABLE push_schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  notification_type TEXT,
  scheduled_at DATETIME,
  status TEXT,          -- 'pending' / 'sent' / 'cancelled'
  created_at DATETIME
);

### 3.10 user_push_preferences（推送偏好）

CREATE TABLE user_push_preferences (
  user_id TEXT PRIMARY KEY,
  throw_reminder_enabled INTEGER DEFAULT 1,
  catch_reminder_enabled INTEGER DEFAULT 1,
  message_reminder_enabled INTEGER DEFAULT 1,
  quiet_hours_start INTEGER DEFAULT 22,
  quiet_hours_end INTEGER DEFAULT 8,
  timezone TEXT DEFAULT 'UTC',
  updated_at DATETIME
);

### 3.11 其他表
reports（舉報）
bans（封禁）
invites（邀請）
daily_usage（每日使用次數）
appeals（申訴）
conversation_daily_usage（每對象每日訊息數）
horoscope_templates（星座運勢模板）
payments（VIP 付款）
broadcast_jobs / broadcast_queue（廣播）
admin_actions（管理操作記錄）
terms_versions（條款版本管理）

---

## 4. 主要業務邏輯

### 4.1 每日漂流瓶次數限制

規則：
免費使用者：基礎 3 個，每邀請 1 人 +1，上限 10 個
VIP 使用者：基礎 30 個，每邀請 1 人 +1，上限 100 個

詳細邏輯請參考 SPEC.md 第 4.1 節

### 4.2 主動推送機制

推送類型：
丟瓶提醒：超過 24 小時未丟瓶時提醒
撿瓶提醒：超過 12 小時未撿瓶時提醒
對話提醒：有未讀訊息時提醒

推送策略：
根據使用者活躍度調整頻率
避免過度打擾（每日上限 3 條）
支援安靜時段設定
使用者可關閉特定類型推送

詳細設計請參考：PUSH_NOTIFICATIONS.md

### 4.3 使用者數據統計

統計內容：
漂流瓶統計（總數、最近 7 天、最近 30 天）
聊天統計（總次數、活躍對話、對話對象）
充值記錄（總金額、記錄列表）
活躍度排名（全球百分比）

詳細設計請參考：USER_STATS.md

### 4.4 聊天記錄功能

功能：
查看所有對話列表
查看單個對話完整記錄
查看漂流瓶原始內容
按時間排序

詳細設計請參考：CHAT_HISTORY.md

---

## 5. 使用流程與 Telegram 指令

### 5.1 /start（初次引導）

重要特性：
智能對話式引導：使用俏皮的對話風格
中斷恢復機制：支援中斷後從上次步驟繼續
深度確認：性別、生日設定後永遠不能修改，需二次確認
年齡限制：未滿 18 歲不允許註冊
條款同意：必須同意使用者條款和隱私權政策

流程概要（10 步）：
Step 0：歡迎與條款同意
Step 1：暱稱 & 頭像
Step 2：主要使用語言
Step 3：性別（深度確認）
Step 4：生日與年齡驗證（18 歲限制、深度確認）
Step 5：國家
Step 6：喜好性向
Step 7：MBTI 測驗（支援中斷恢復）
Step 8：反詐騙測驗（支援中斷恢復）
Step 9：完成註冊

詳細流程請參考：ONBOARDING_FLOW.md

### 5.2 /profile（個人資料）

顯示內容：
暱稱、性別、年齡區間、國家、MBTI、星座、語言、邀請碼、是否 VIP、每日漂流瓶上限等

編輯限制：
可編輯：暱稱、頭像、語言、國家、喜好性向
不可編輯：性別、生日（永遠不能修改，不顯示編輯按鈕）
管理員特殊權限：god 角色可修改所有欄位

### 5.3 /throw（丟漂流瓶）

流程：
檢查封禁與 onboarding
讀取 daily_usage，判斷是否還有 quota
一般使用者：顯示廣告（gigapub），必須設定 target_gender
VIP 使用者：不顯示廣告，可設定多種篩選條件
使用者輸入瓶子內容（純文字 + 官方 emoji，不使用 HTML/Markdown）
建立 bottles 記錄
更新 daily_usage

### 5.4 /catch（撿漂流瓶）

流程：
檢查封禁與 onboarding
用 matchBottleForUser 從 bottles 找符合條件
若找到：建立 conversations，回覆瓶子內容 + 安全提示
若沒找到：回覆「目前沒有適合你的瓶子，稍後再試」

### 5.5 對話消息轉發（匿名聊天）

流程：
驗證 conversation_id 是否存在且 status='active'
僅允許文字 + 官方 emoji（不使用 HTML/Markdown）
URL 白名單檢查
每對象每日訊息數檢查（免費 10 / VIP 100）
VIP 翻譯（若任一方為 VIP）
儲存訊息到 conversation_messages
更新 conversation_daily_usage

### 5.6 /stats（我的統計）

顯示完整的使用者數據統計：
漂流瓶數據（總數、最近 7 天、今日）
聊天數據（總次數、活躍對話、對話對象）
充值記錄（總金額、記錄列表）
活躍度排名（全球百分比）

詳細設計請參考：USER_STATS.md

### 5.7 /chats（我的對話）

顯示所有對話列表：
當前活躍對話
歷史對話
每個對話顯示：漂流瓶 ID、開始時間、訊息數、狀態

詳細設計請參考：CHAT_HISTORY.md

### 5.8 /recharge_history（充值記錄）

顯示詳細的充值記錄：
總計金額
每筆記錄（時間、金額、狀態、訂單號）
分頁顯示

### 5.9 /settings（推送設定）

設定推送偏好：
丟瓶提醒：開啟/關閉
撿瓶提醒：開啟/關閉
對話提醒：開啟/關閉
安靜時段：自訂時間範圍

### 5.10 其他指令
/report（舉報）
/appeal（申訴）
/vip（VIP 購買）
/help（幫助）
/admin（管理後台，僅管理員）

---

## 6. 主動推送機制

### 6.1 推送時機

丟瓶提醒：
觸發條件：超過 24 小時未丟瓶，今日還有配額
推送頻率：每天最多 1 次
內容：提醒使用者還有配額，鼓勵丟瓶

撿瓶提醒：
觸發條件：超過 12 小時未撿瓶，系統中有符合條件的瓶子
推送頻率：每天最多 2 次
內容：告知有新瓶子可撿

對話提醒：
觸發條件：有未讀訊息的對話，超過 2 小時未回覆
推送頻率：每 4 小時最多 1 次
內容：提醒有未讀訊息

### 6.2 避免打擾機制

每日上限：每個使用者每天最多收到 3 條推送
間隔限制：同一類型推送間隔至少 4 小時
安靜時段：預設 22:00 - 08:00（使用者當地時間）
使用者控制：可關閉特定類型推送

詳細設計請參考：PUSH_NOTIFICATIONS.md

---

## 7. 使用者數據統計

### 7.1 統計內容

漂流瓶統計：
總丟瓶數
總撿瓶數
成功配對數
最近 7 天丟瓶數
最近 30 天丟瓶數
今日丟瓶數

聊天統計：
總聊天次數
活躍對話數
總對話對象數
最近 7 天聊天次數
最近 30 天聊天次數

充值記錄：
總充值金額（Telegram Stars）
充值次數
充值記錄列表

活躍度排名：
全球排名百分比
活躍度分數
排名變化趨勢

### 7.2 活躍度計算

公式：
activityScore = 
  (totalThrows * 10) +
  (totalCatches * 5) +
  (totalMessages * 1) +
  (activeDays7d * 20) +
  (uniquePartners * 15) +
  (isVip ? 100 : 0)

詳細設計請參考：USER_STATS.md

---

## 8. 聊天記錄功能

### 8.1 功能特性

查看所有對話列表
查看單個對話完整記錄
查看漂流瓶原始內容
按時間排序
匿名保護（不顯示真實 Telegram ID）

### 8.2 資料儲存

每條訊息都儲存到 conversation_messages
關聯漂流瓶和對話到 bottle_chat_history
支援分頁載入
永久保存（除非使用者刪除）

詳細設計請參考：CHAT_HISTORY.md

---

## 9. 外部資格查詢 API

HTTP 端點：POST /api/eligibility
Header：X-API-Key: <EXTERNAL_API_KEY>

詳細設計請參考 SPEC.md 第 7 節

---

## 10. 環境變數與配置

詳細配置請參考：ENV_CONFIG.md

---

## 11. 測試規範

詳細規範請參考：TESTING.md

---

## 12. 部署指南

詳細指南請參考：DEPLOYMENT.md

---

## 13. 備份策略

詳細策略請參考：BACKUP_STRATEGY.md

---

## 14. 商業化檢查清單

詳細清單請參考：COMMERCIAL_CHECKLIST.md

---

## 附錄：重要提醒

### 訊息格式
所有訊息使用純文字 + 官方 Emoji，不使用 HTML 或 Markdown 格式

### 安全規範
所有 URL 必須通過白名單檢查
匿名轉發不暴露真實 Telegram ID
風險分數累積機制需嚴格執行

### 性能考量
推送任務需使用隊列 + 限速
每日使用次數查詢需考慮快取
匹配算法需優化查詢效率

### 成本控制
合理使用 KV 快取，避免過度讀寫
D1 查詢需優化索引
翻譯 API 調用需控制頻率
推送頻率需控制，避免過度消耗 Telegram API 配額

---

最後更新：2025-01-15
版本：2.0

