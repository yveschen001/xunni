# 廣告系統數據追蹤與分析設計

## 📋 **目錄**

1. [業務目標](#業務目標)
2. [核心追蹤指標](#核心追蹤指標)
3. [數據庫設計](#數據庫設計)
4. [追蹤點設計](#追蹤點設計)
5. [分析報表](#分析報表)
6. [運營決策指標](#運營決策指標)
7. [實現方案](#實現方案)

---

## 🎯 **業務目標**

### **核心問題**

作為運營者，我們需要回答以下問題：

1. **廣告效果**
   - 哪個廣告商效果最好？
   - 用戶更喜歡看哪種廣告？
   - 廣告完成率如何？

2. **用戶行為**
   - 用戶從哪裡來？（邀請 vs 自然增長）
   - 用戶活躍度如何？
   - 什麼時候用戶最活躍？

3. **轉化漏斗**
   - 有多少用戶看了廣告？
   - 有多少用戶完成了廣告？
   - 有多少用戶最終升級 VIP？

4. **收益分析**
   - 廣告收入 vs VIP 收入
   - 哪些用戶更可能付費？
   - ROI 如何？

---

## 📊 **核心追蹤指標**

### **1. 用戶生命週期指標**

#### **註冊階段**
```
用戶來源追蹤：
├─ 邀請註冊（記錄邀請者 ID）
├─ 自然註冊（搜索、群組等）
├─ 廣告引流（如果有外部廣告）
└─ 其他渠道

關鍵數據：
- 註冊時間
- 註冊來源
- 邀請者 ID（如果有）
- 註冊時的語言設置
- 註冊時的地理位置（從 Telegram 獲取）
```

#### **新手階段（0-7 天）**
```
行為追蹤：
├─ 首次丟瓶子時間（從註冊到首次丟瓶子的時長）
├─ 首次撿瓶子時間
├─ 首次對話時間
├─ 首次看廣告時間
├─ 首次邀請朋友時間
└─ 首次升級 VIP 時間

關鍵指標：
- 新手留存率（D1, D3, D7）
- 新手活躍度（每日丟瓶子次數）
- 新手轉化率（看廣告 → VIP）
```

#### **活躍階段（7-30 天）**
```
行為追蹤：
├─ 每日活躍時間
├─ 每日丟瓶子次數
├─ 每日對話次數
├─ 每日看廣告次數
├─ 邀請朋友數量
└─ VIP 轉化情況

關鍵指標：
- 日活躍用戶（DAU）
- 週活躍用戶（WAU）
- 月活躍用戶（MAU）
- 用戶粘性（DAU/MAU）
```

#### **忠誠階段（30+ 天）**
```
行為追蹤：
├─ VIP 續費情況
├─ 長期活躍度
├─ 邀請貢獻度
└─ 社區參與度

關鍵指標：
- 長期留存率
- VIP 續費率
- 用戶 LTV（生命週期價值）
```

---

### **2. 廣告系統指標**

#### **第三方視頻廣告**
```
追蹤點：
├─ 廣告展示（ad_impression）
│   ├─ 用戶點擊「看廣告」按鈕
│   ├─ 廣告提供商（GigaPub/Google/Unity）
│   ├─ 當前已看廣告數
│   └─ 剩餘廣告數
│
├─ 廣告開始播放（ad_start）
│   ├─ 廣告 ID
│   ├─ 廣告提供商
│   └─ 開始時間
│
├─ 廣告播放中（ad_progress）
│   ├─ 播放進度（25%, 50%, 75%）
│   └─ 播放時長
│
├─ 廣告完成（ad_complete）
│   ├─ 完成時間
│   ├─ 總播放時長
│   ├─ 獎勵發放狀態
│   └─ 用戶當前總額度
│
└─ 廣告錯誤（ad_error）
    ├─ 錯誤類型（加載失敗/播放中斷/網絡錯誤）
    ├─ 錯誤訊息
    ├─ 廣告提供商
    └─ 用戶網絡狀況

關鍵指標：
- 廣告展示次數（Impressions）
- 廣告開始率（Start Rate = Starts / Impressions）
- 廣告完成率（Completion Rate = Completions / Starts）
- 廣告錯誤率（Error Rate = Errors / Impressions）
- 平均播放時長
- 不同提供商的表現對比
```

#### **官方文字廣告**
```
追蹤點：
├─ 廣告展示（official_ad_impression）
│   ├─ 廣告 ID
│   ├─ 廣告類型（text/link/group/channel）
│   ├─ 展示位置（額度用完提示/主動查看）
│   └─ 展示時間
│
├─ 廣告點擊（official_ad_click）
│   ├─ 廣告 ID
│   ├─ 點擊時間
│   └─ 用戶當前狀態（額度、VIP 狀態）
│
├─ 廣告完成（official_ad_complete）
│   ├─ 完成類型（點擊領取/加入群組/訂閱頻道）
│   ├─ 是否需要認證
│   ├─ 認證結果
│   └─ 獎勵發放狀態
│
└─ 廣告轉化（official_ad_conversion）
    ├─ 轉化類型（加入群組/訂閱頻道/訪問鏈接）
    ├─ 轉化時間
    └─ 後續行為（是否繼續活躍）

關鍵指標：
- 官方廣告展示次數
- 官方廣告點擊率（CTR = Clicks / Impressions）
- 官方廣告完成率（Completion Rate）
- 不同廣告類型的表現對比
- 群組/頻道加入率
```

---

### **3. VIP 轉化漏斗**

#### **完整轉化路徑**
```
階段 1: 認知階段
├─ 用戶看到 VIP 提示（vip_awareness）
│   ├─ 觸發場景（額度用完/主動查看/廣告後）
│   ├─ 提示類型（彈窗/按鈕/命令）
│   └─ 用戶當前狀態
│
階段 2: 興趣階段
├─ 用戶點擊查看 VIP（vip_interest）
│   ├─ 點擊來源（額度提示/Profile/Help）
│   ├─ 查看時間
│   └─ 停留時長
│
階段 3: 考慮階段
├─ 用戶查看 VIP 詳情（vip_consideration）
│   ├─ 查看次數
│   ├─ 查看間隔
│   └─ 對比行為（是否先看廣告/邀請朋友）
│
階段 4: 購買階段
├─ 用戶點擊購買 VIP（vip_purchase_intent）
│   ├─ 選擇的套餐（月/季/年）
│   ├─ 支付方式選擇
│   └─ 是否完成支付
│
階段 5: 轉化完成
└─ VIP 購買成功（vip_purchase_success）
    ├─ 購買套餐
    ├─ 支付金額
    ├─ 支付方式
    ├─ 從註冊到購買的時長
    └─ 購買前的行為路徑

關鍵指標：
- 各階段轉化率
- 平均轉化時長（從註冊到購買）
- 流失點分析（在哪個階段流失最多）
- 不同來源用戶的轉化率對比
```

#### **VIP 用戶行為**
```
追蹤點：
├─ VIP 使用情況（vip_usage）
│   ├─ 每日丟瓶子次數（vs 免費用戶）
│   ├─ 每日對話次數
│   └─ 活躍時間分布
│
├─ VIP 續費行為（vip_renewal）
│   ├─ 續費時間（到期前/到期後）
│   ├─ 續費套餐（升級/降級/維持）
│   └─ 續費率
│
└─ VIP 流失（vip_churn）
    ├─ 流失時間（到期後多久）
    ├─ 流失原因（如果有反饋）
    └─ 流失前的活躍度變化

關鍵指標：
- VIP 活躍度 vs 免費用戶
- VIP 續費率
- VIP 流失率
- VIP LTV（生命週期價值）
```

---

### **4. 邀請系統指標**

#### **邀請行為追蹤**
```
追蹤點：
├─ 邀請發起（invite_initiated）
│   ├─ 邀請者 ID
│   ├─ 邀請方式（分享鏈接/直接邀請）
│   ├─ 邀請時機（額度用完/主動分享）
│   └─ 邀請者當前狀態（VIP/免費）
│
├─ 邀請成功（invite_accepted）
│   ├─ 被邀請者 ID
│   ├─ 註冊時間
│   ├─ 邀請鏈接點擊到註冊的時長
│   └─ 被邀請者來源地區
│
├─ 邀請激活（invite_activated）
│   ├─ 被邀請者首次丟瓶子
│   ├─ 邀請者獲得獎勵
│   └─ 激活時長（從註冊到激活）
│
└─ 邀請貢獻（invite_contribution）
    ├─ 被邀請者活躍度
    ├─ 被邀請者是否升級 VIP
    └─ 邀請者的總貢獻價值

關鍵指標：
- 邀請轉化率（接受/發起）
- 邀請激活率（激活/接受）
- 平均邀請數（每個用戶）
- 邀請質量（被邀請者的活躍度）
- 病毒係數（K-factor）
```

---

### **5. 內容互動指標**

#### **漂流瓶互動**
```
追蹤點：
├─ 丟瓶子行為（bottle_throw）
│   ├─ 丟瓶子時間
│   ├─ 內容類型（文字/圖片/語音）
│   ├─ 內容長度
│   ├─ 用戶當前額度
│   └─ 是否使用廣告額度
│
├─ 撿瓶子行為（bottle_catch）
│   ├─ 撿瓶子時間
│   ├─ 瓶子年齡（丟出到撿起的時長）
│   ├─ 是否回覆
│   └─ 回覆時長
│
├─ 對話互動（conversation）
│   ├─ 對話輪次
│   ├─ 對話時長
│   ├─ 訊息類型分布
│   └─ 對話結束原因（自然結束/被舉報/主動結束）
│
└─ 舉報行為（report）
    ├─ 舉報類型
    ├─ 舉報時機（對話中/對話後）
    ├─ 舉報處理結果
    └─ 舉報者歷史行為

關鍵指標：
- 每日丟瓶子總數
- 每日撿瓶子總數
- 瓶子匹配率（撿起/丟出）
- 平均對話輪次
- 平均對話時長
- 舉報率
```

---

## 🗄️ **數據庫設計**

### **1. 分析事件表（analytics_events）**

```sql
-- Migration: 0028_create_analytics_events.sql
-- 核心分析事件表，記錄所有用戶行為

CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 事件基本信息
  event_type TEXT NOT NULL,  -- 事件類型（見下方枚舉）
  event_category TEXT NOT NULL,  -- 事件分類（user/ad/vip/invite/content）
  
  -- 用戶信息
  user_id TEXT NOT NULL,  -- Telegram ID
  user_type TEXT,  -- 'free' | 'vip'
  user_age_days INTEGER,  -- 用戶註冊天數
  
  -- 事件詳情
  event_data TEXT,  -- JSON 格式的事件詳細數據
  
  -- 廣告相關（如果是廣告事件）
  ad_provider TEXT,  -- 廣告提供商
  ad_id INTEGER,  -- 廣告 ID
  ad_type TEXT,  -- 'third_party' | 'official'
  
  -- 會話信息
  session_id TEXT,  -- 會話 ID（用於追蹤用戶路徑）
  
  -- 設備和環境
  user_language TEXT,  -- 用戶語言
  user_timezone TEXT,  -- 用戶時區
  
  -- 時間戳
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  event_date TEXT,  -- YYYY-MM-DD（用於快速查詢）
  event_hour INTEGER  -- 0-23（用於時段分析）
);

-- 索引
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_category ON analytics_events(event_category);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_date ON analytics_events(event_date);
CREATE INDEX idx_analytics_events_hour ON analytics_events(event_hour);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_ad_provider ON analytics_events(ad_provider);
```

#### **事件類型枚舉**

```typescript
// 用戶生命週期事件
export enum UserLifecycleEvent {
  USER_REGISTERED = 'user_registered',
  USER_FIRST_THROW = 'user_first_throw',
  USER_FIRST_CATCH = 'user_first_catch',
  USER_FIRST_CONVERSATION = 'user_first_conversation',
  USER_FIRST_AD = 'user_first_ad',
  USER_FIRST_INVITE = 'user_first_invite',
  USER_BECAME_ACTIVE = 'user_became_active',  // 連續 3 天活躍
  USER_BECAME_INACTIVE = 'user_became_inactive',  // 7 天未活躍
  USER_RETURNED = 'user_returned',  // 流失後回歸
}

// 廣告事件
export enum AdEvent {
  AD_IMPRESSION = 'ad_impression',  // 廣告展示
  AD_CLICK = 'ad_click',  // 廣告點擊
  AD_START = 'ad_start',  // 廣告開始播放
  AD_PROGRESS_25 = 'ad_progress_25',  // 播放 25%
  AD_PROGRESS_50 = 'ad_progress_50',  // 播放 50%
  AD_PROGRESS_75 = 'ad_progress_75',  // 播放 75%
  AD_COMPLETE = 'ad_complete',  // 廣告完成
  AD_ERROR = 'ad_error',  // 廣告錯誤
  AD_SKIP = 'ad_skip',  // 廣告跳過（如果允許）
  
  // 官方廣告
  OFFICIAL_AD_IMPRESSION = 'official_ad_impression',
  OFFICIAL_AD_CLICK = 'official_ad_click',
  OFFICIAL_AD_COMPLETE = 'official_ad_complete',
  OFFICIAL_AD_VERIFY = 'official_ad_verify',  // 群組/頻道認證
}

// VIP 事件
export enum VIPEvent {
  VIP_AWARENESS = 'vip_awareness',  // 看到 VIP 提示
  VIP_INTEREST = 'vip_interest',  // 點擊查看 VIP
  VIP_CONSIDERATION = 'vip_consideration',  // 查看 VIP 詳情
  VIP_PURCHASE_INTENT = 'vip_purchase_intent',  // 點擊購買
  VIP_PURCHASE_SUCCESS = 'vip_purchase_success',  // 購買成功
  VIP_PURCHASE_FAILED = 'vip_purchase_failed',  // 購買失敗
  VIP_RENEWAL = 'vip_renewal',  // VIP 續費
  VIP_EXPIRED = 'vip_expired',  // VIP 過期
  VIP_CANCELLED = 'vip_cancelled',  // VIP 取消
}

// 邀請事件
export enum InviteEvent {
  INVITE_INITIATED = 'invite_initiated',  // 發起邀請
  INVITE_LINK_CLICKED = 'invite_link_clicked',  // 邀請鏈接被點擊
  INVITE_ACCEPTED = 'invite_accepted',  // 邀請被接受（註冊）
  INVITE_ACTIVATED = 'invite_activated',  // 邀請被激活（首次丟瓶子）
  INVITE_REWARD_GRANTED = 'invite_reward_granted',  // 邀請獎勵發放
}

// 內容互動事件
export enum ContentEvent {
  BOTTLE_THROW = 'bottle_throw',  // 丟瓶子
  BOTTLE_CATCH = 'bottle_catch',  // 撿瓶子
  CONVERSATION_START = 'conversation_start',  // 開始對話
  CONVERSATION_MESSAGE = 'conversation_message',  // 發送訊息
  CONVERSATION_END = 'conversation_end',  // 結束對話
  REPORT_SUBMITTED = 'report_submitted',  // 提交舉報
  USER_BANNED = 'user_banned',  // 用戶被封禁
}
```

---

### **2. 用戶會話表（user_sessions）**

```sql
-- Migration: 0029_create_user_sessions.sql
-- 追蹤用戶會話，用於分析用戶路徑

CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  
  -- 會話信息
  session_start TEXT DEFAULT CURRENT_TIMESTAMP,
  session_end TEXT,
  session_duration_seconds INTEGER,
  
  -- 會話統計
  events_count INTEGER DEFAULT 0,
  bottles_thrown INTEGER DEFAULT 0,
  bottles_caught INTEGER DEFAULT 0,
  ads_watched INTEGER DEFAULT 0,
  conversations_started INTEGER DEFAULT 0,
  
  -- 會話結果
  vip_converted INTEGER DEFAULT 0,  -- 是否在此會話中轉化為 VIP
  invite_sent INTEGER DEFAULT 0,  -- 是否發送邀請
  
  -- 設備信息
  user_language TEXT,
  user_timezone TEXT,
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_start ON user_sessions(session_start);
CREATE INDEX idx_user_sessions_vip_converted ON user_sessions(vip_converted);
```

---

### **3. 每日用戶摘要表（daily_user_summary）**

```sql
-- Migration: 0030_create_daily_user_summary.sql
-- 每日用戶行為摘要，用於快速查詢和分析

CREATE TABLE IF NOT EXISTS daily_user_summary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  summary_date TEXT NOT NULL,  -- YYYY-MM-DD
  
  -- 基本信息
  user_type TEXT,  -- 'free' | 'vip'
  user_age_days INTEGER,  -- 用戶註冊天數
  
  -- 活躍度
  is_active INTEGER DEFAULT 0,  -- 當天是否活躍
  session_count INTEGER DEFAULT 0,  -- 會話次數
  total_duration_seconds INTEGER DEFAULT 0,  -- 總使用時長
  
  -- 內容互動
  bottles_thrown INTEGER DEFAULT 0,
  bottles_caught INTEGER DEFAULT 0,
  conversations_started INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  
  -- 廣告互動
  ads_viewed INTEGER DEFAULT 0,
  ads_completed INTEGER DEFAULT 0,
  official_ads_clicked INTEGER DEFAULT 0,
  
  -- 邀請行為
  invites_sent INTEGER DEFAULT 0,
  invites_accepted INTEGER DEFAULT 0,
  
  -- VIP 相關
  vip_page_views INTEGER DEFAULT 0,
  vip_converted INTEGER DEFAULT 0,
  
  -- 額度使用
  quota_used INTEGER DEFAULT 0,
  quota_from_ads INTEGER DEFAULT 0,
  quota_from_invites INTEGER DEFAULT 0,
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, summary_date)
);

CREATE INDEX idx_daily_user_summary_user ON daily_user_summary(user_id);
CREATE INDEX idx_daily_user_summary_date ON daily_user_summary(summary_date);
CREATE INDEX idx_daily_user_summary_active ON daily_user_summary(is_active);
CREATE INDEX idx_daily_user_summary_type ON daily_user_summary(user_type);
```

---

### **4. 漏斗分析表（funnel_events）**

```sql
-- Migration: 0031_create_funnel_events.sql
-- 專門用於漏斗分析的表

CREATE TABLE IF NOT EXISTS funnel_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  funnel_type TEXT NOT NULL,  -- 'vip_conversion' | 'ad_completion' | 'invite_flow'
  funnel_step TEXT NOT NULL,  -- 漏斗步驟
  step_order INTEGER NOT NULL,  -- 步驟順序
  
  -- 步驟詳情
  step_data TEXT,  -- JSON 格式
  
  -- 時間信息
  step_timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
  time_from_previous_step_seconds INTEGER,  -- 距離上一步的時間
  time_from_funnel_start_seconds INTEGER,  -- 距離漏斗開始的時間
  
  -- 結果
  completed INTEGER DEFAULT 0,  -- 是否完成整個漏斗
  dropped_off INTEGER DEFAULT 0,  -- 是否在此步驟流失
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_funnel_events_user ON funnel_events(user_id);
CREATE INDEX idx_funnel_events_type ON funnel_events(funnel_type);
CREATE INDEX idx_funnel_events_step ON funnel_events(funnel_step);
CREATE INDEX idx_funnel_events_completed ON funnel_events(completed);
```

---

### **5. 更新現有的 daily_stats 表**

```sql
-- Migration: 0032_update_daily_stats_analytics.sql
-- 添加更多分析維度到每日統計表

ALTER TABLE daily_stats ADD COLUMN total_sessions INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN avg_session_duration_seconds INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN dau INTEGER DEFAULT 0;  -- Daily Active Users
ALTER TABLE daily_stats ADD COLUMN wau INTEGER DEFAULT 0;  -- Weekly Active Users
ALTER TABLE daily_stats ADD COLUMN mau INTEGER DEFAULT 0;  -- Monthly Active Users

-- 廣告數據（已有，確保完整）
ALTER TABLE daily_stats ADD COLUMN total_ad_impressions INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN total_ad_clicks INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN total_ad_starts INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN total_ad_completions INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN total_ad_errors INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN ad_ctr REAL DEFAULT 0.0;  -- Click-Through Rate
ALTER TABLE daily_stats ADD COLUMN ad_completion_rate REAL DEFAULT 0.0;

-- 官方廣告數據
ALTER TABLE daily_stats ADD COLUMN official_ad_impressions INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN official_ad_clicks INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN official_ad_completions INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN official_ad_ctr REAL DEFAULT 0.0;

-- VIP 轉化數據
ALTER TABLE daily_stats ADD COLUMN vip_page_views INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN vip_purchase_intents INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN vip_conversions INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN vip_conversion_rate REAL DEFAULT 0.0;
ALTER TABLE daily_stats ADD COLUMN vip_revenue REAL DEFAULT 0.0;

-- 邀請數據（已有，確保完整）
ALTER TABLE daily_stats ADD COLUMN invites_sent INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN invites_accepted INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN invites_activated INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN invite_conversion_rate REAL DEFAULT 0.0;

-- 內容互動數據（已有，確保完整）
ALTER TABLE daily_stats ADD COLUMN avg_bottles_per_user REAL DEFAULT 0.0;
ALTER TABLE daily_stats ADD COLUMN avg_conversations_per_user REAL DEFAULT 0.0;
ALTER TABLE daily_stats ADD COLUMN avg_messages_per_conversation REAL DEFAULT 0.0;

-- 留存數據
ALTER TABLE daily_stats ADD COLUMN d1_retention_rate REAL DEFAULT 0.0;  -- 次日留存
ALTER TABLE daily_stats ADD COLUMN d7_retention_rate REAL DEFAULT 0.0;  -- 7日留存
ALTER TABLE daily_stats ADD COLUMN d30_retention_rate REAL DEFAULT 0.0;  -- 30日留存
```

---

## 📍 **追蹤點設計**

### **1. 用戶註冊追蹤**

#### **位置：`src/telegram/handlers/start.ts`**

```typescript
/**
 * Track user registration
 */
async function trackUserRegistration(
  analytics: AnalyticsService,
  user: User,
  invitedBy?: string
) {
  await analytics.trackEvent({
    event_type: UserLifecycleEvent.USER_REGISTERED,
    event_category: 'user',
    user_id: user.telegram_id,
    user_type: 'free',
    user_age_days: 0,
    event_data: JSON.stringify({
      nickname: user.nickname,
      gender: user.gender,
      language: user.language_code,
      invited_by: invitedBy || null,
      registration_source: invitedBy ? 'invite' : 'organic',
    }),
  });
}
```

---

### **2. 廣告追蹤（第三方視頻廣告）**

#### **位置：`src/telegram/handlers/ad_reward.ts`**

```typescript
/**
 * Track ad impression (用戶點擊「看廣告」按鈕)
 */
async function trackAdImpression(
  analytics: AnalyticsService,
  userId: string,
  provider: AdProvider,
  remainingAds: number
) {
  await analytics.trackEvent({
    event_type: AdEvent.AD_IMPRESSION,
    event_category: 'ad',
    user_id: userId,
    ad_provider: provider.provider_name,
    ad_type: 'third_party',
    event_data: JSON.stringify({
      provider_display_name: provider.provider_display_name,
      remaining_ads: remainingAds,
      total_daily_limit: 20,
    }),
  });
}

/**
 * Track ad start (廣告開始播放)
 */
async function trackAdStart(
  analytics: AnalyticsService,
  userId: string,
  provider: string
) {
  await analytics.trackEvent({
    event_type: AdEvent.AD_START,
    event_category: 'ad',
    user_id: userId,
    ad_provider: provider,
    ad_type: 'third_party',
    event_data: JSON.stringify({
      start_time: new Date().toISOString(),
    }),
  });
}

/**
 * Track ad completion (廣告完成)
 */
async function trackAdCompletion(
  analytics: AnalyticsService,
  userId: string,
  provider: string,
  rewardGranted: boolean,
  totalAdsWatched: number
) {
  await analytics.trackEvent({
    event_type: AdEvent.AD_COMPLETE,
    event_category: 'ad',
    user_id: userId,
    ad_provider: provider,
    ad_type: 'third_party',
    event_data: JSON.stringify({
      reward_granted: rewardGranted,
      quota_earned: rewardGranted ? 1 : 0,
      total_ads_watched_today: totalAdsWatched,
      completion_time: new Date().toISOString(),
    }),
  });
}

/**
 * Track ad error (廣告錯誤)
 */
async function trackAdError(
  analytics: AnalyticsService,
  userId: string,
  provider: string,
  error: Error
) {
  await analytics.trackEvent({
    event_type: AdEvent.AD_ERROR,
    event_category: 'ad',
    user_id: userId,
    ad_provider: provider,
    ad_type: 'third_party',
    event_data: JSON.stringify({
      error_type: error.name,
      error_message: error.message,
      error_stack: error.stack?.substring(0, 500),  // 只記錄前 500 字符
    }),
  });
}
```

---

### **3. 官方廣告追蹤**

#### **位置：`src/telegram/handlers/ad_reward.ts`**

```typescript
/**
 * Track official ad impression
 */
async function trackOfficialAdImpression(
  analytics: AnalyticsService,
  userId: string,
  ad: OfficialAd,
  displayContext: string
) {
  await analytics.trackEvent({
    event_type: AdEvent.OFFICIAL_AD_IMPRESSION,
    event_category: 'ad',
    user_id: userId,
    ad_id: ad.id,
    ad_type: 'official',
    event_data: JSON.stringify({
      ad_title: ad.title,
      ad_type: ad.ad_type,
      reward_quota: ad.reward_quota,
      display_context: displayContext,  // 'quota_exhausted' | 'manual_view'
    }),
  });
}

/**
 * Track official ad click
 */
async function trackOfficialAdClick(
  analytics: AnalyticsService,
  userId: string,
  ad: OfficialAd
) {
  await analytics.trackEvent({
    event_type: AdEvent.OFFICIAL_AD_CLICK,
    event_category: 'ad',
    user_id: userId,
    ad_id: ad.id,
    ad_type: 'official',
    event_data: JSON.stringify({
      ad_title: ad.title,
      ad_type: ad.ad_type,
      has_url: !!ad.url,
      requires_verification: ad.requires_verification,
    }),
  });
}

/**
 * Track official ad completion
 */
async function trackOfficialAdCompletion(
  analytics: AnalyticsService,
  userId: string,
  ad: OfficialAd,
  verified: boolean
) {
  await analytics.trackEvent({
    event_type: AdEvent.OFFICIAL_AD_COMPLETE,
    event_category: 'ad',
    user_id: userId,
    ad_id: ad.id,
    ad_type: 'official',
    event_data: JSON.stringify({
      ad_title: ad.title,
      ad_type: ad.ad_type,
      reward_granted: true,
      reward_amount: ad.reward_quota,
      verified: verified,
    }),
  });
}
```

---

### **4. VIP 轉化漏斗追蹤**

#### **位置：`src/telegram/handlers/vip.ts` 和 `src/telegram/handlers/throw.ts`**

```typescript
/**
 * Track VIP awareness (用戶看到 VIP 提示)
 */
async function trackVIPAwareness(
  analytics: AnalyticsService,
  userId: string,
  context: string
) {
  await analytics.trackEvent({
    event_type: VIPEvent.VIP_AWARENESS,
    event_category: 'vip',
    user_id: userId,
    event_data: JSON.stringify({
      context: context,  // 'quota_exhausted' | 'profile' | 'help'
      timestamp: new Date().toISOString(),
    }),
  });
  
  // 同時記錄到漏斗表
  await analytics.trackFunnelStep({
    user_id: userId,
    funnel_type: 'vip_conversion',
    funnel_step: 'awareness',
    step_order: 1,
    step_data: JSON.stringify({ context }),
  });
}

/**
 * Track VIP interest (用戶點擊查看 VIP)
 */
async function trackVIPInterest(
  analytics: AnalyticsService,
  userId: string,
  source: string
) {
  await analytics.trackEvent({
    event_type: VIPEvent.VIP_INTEREST,
    event_category: 'vip',
    user_id: userId,
    event_data: JSON.stringify({
      source: source,  // 'button' | 'command' | 'link'
    }),
  });
  
  await analytics.trackFunnelStep({
    user_id: userId,
    funnel_type: 'vip_conversion',
    funnel_step: 'interest',
    step_order: 2,
    step_data: JSON.stringify({ source }),
  });
}

/**
 * Track VIP consideration (用戶查看 VIP 詳情)
 */
async function trackVIPConsideration(
  analytics: AnalyticsService,
  userId: string,
  viewCount: number
) {
  await analytics.trackEvent({
    event_type: VIPEvent.VIP_CONSIDERATION,
    event_category: 'vip',
    user_id: userId,
    event_data: JSON.stringify({
      view_count: viewCount,
      timestamp: new Date().toISOString(),
    }),
  });
  
  await analytics.trackFunnelStep({
    user_id: userId,
    funnel_type: 'vip_conversion',
    funnel_step: 'consideration',
    step_order: 3,
    step_data: JSON.stringify({ view_count: viewCount }),
  });
}

/**
 * Track VIP purchase intent (用戶點擊購買)
 */
async function trackVIPPurchaseIntent(
  analytics: AnalyticsService,
  userId: string,
  plan: string
) {
  await analytics.trackEvent({
    event_type: VIPEvent.VIP_PURCHASE_INTENT,
    event_category: 'vip',
    user_id: userId,
    event_data: JSON.stringify({
      plan: plan,  // 'monthly' | 'quarterly' | 'yearly'
      timestamp: new Date().toISOString(),
    }),
  });
  
  await analytics.trackFunnelStep({
    user_id: userId,
    funnel_type: 'vip_conversion',
    funnel_step: 'purchase_intent',
    step_order: 4,
    step_data: JSON.stringify({ plan }),
  });
}

/**
 * Track VIP purchase success (購買成功)
 */
async function trackVIPPurchaseSuccess(
  analytics: AnalyticsService,
  userId: string,
  plan: string,
  amount: number,
  userAgeDays: number
) {
  await analytics.trackEvent({
    event_type: VIPEvent.VIP_PURCHASE_SUCCESS,
    event_category: 'vip',
    user_id: userId,
    event_data: JSON.stringify({
      plan: plan,
      amount: amount,
      user_age_days: userAgeDays,
      timestamp: new Date().toISOString(),
    }),
  });
  
  await analytics.trackFunnelStep({
    user_id: userId,
    funnel_type: 'vip_conversion',
    funnel_step: 'purchase_success',
    step_order: 5,
    step_data: JSON.stringify({ plan, amount }),
    completed: true,
  });
}
```

---

### **5. 邀請系統追蹤**

#### **位置：`src/telegram/handlers/profile.ts` 和 `src/telegram/handlers/start.ts`**

```typescript
/**
 * Track invite initiated (發起邀請)
 */
async function trackInviteInitiated(
  analytics: AnalyticsService,
  userId: string,
  isVIP: boolean
) {
  await analytics.trackEvent({
    event_type: InviteEvent.INVITE_INITIATED,
    event_category: 'invite',
    user_id: userId,
    user_type: isVIP ? 'vip' : 'free',
    event_data: JSON.stringify({
      inviter_is_vip: isVIP,
      timestamp: new Date().toISOString(),
    }),
  });
}

/**
 * Track invite link clicked (邀請鏈接被點擊)
 */
async function trackInviteLinkClicked(
  analytics: AnalyticsService,
  inviterId: string,
  inviteCode: string
) {
  await analytics.trackEvent({
    event_type: InviteEvent.INVITE_LINK_CLICKED,
    event_category: 'invite',
    user_id: inviterId,  // 記錄在邀請者身上
    event_data: JSON.stringify({
      invite_code: inviteCode,
      timestamp: new Date().toISOString(),
    }),
  });
}

/**
 * Track invite accepted (邀請被接受 - 註冊)
 */
async function trackInviteAccepted(
  analytics: AnalyticsService,
  inviterId: string,
  inviteeId: string
) {
  // 記錄在邀請者身上
  await analytics.trackEvent({
    event_type: InviteEvent.INVITE_ACCEPTED,
    event_category: 'invite',
    user_id: inviterId,
    event_data: JSON.stringify({
      invitee_id: inviteeId,
      timestamp: new Date().toISOString(),
    }),
  });
  
  // 同時記錄在被邀請者身上（用於分析來源）
  await analytics.trackEvent({
    event_type: UserLifecycleEvent.USER_REGISTERED,
    event_category: 'user',
    user_id: inviteeId,
    event_data: JSON.stringify({
      registration_source: 'invite',
      invited_by: inviterId,
    }),
  });
}

/**
 * Track invite activated (邀請被激活 - 首次丟瓶子)
 */
async function trackInviteActivated(
  analytics: AnalyticsService,
  inviterId: string,
  inviteeId: string,
  timeSinceRegistration: number
) {
  await analytics.trackEvent({
    event_type: InviteEvent.INVITE_ACTIVATED,
    event_category: 'invite',
    user_id: inviterId,
    event_data: JSON.stringify({
      invitee_id: inviteeId,
      time_since_registration_seconds: timeSinceRegistration,
      timestamp: new Date().toISOString(),
    }),
  });
}
```

---

### **6. 內容互動追蹤**

#### **位置：`src/telegram/handlers/throw.ts` 和 `src/telegram/handlers/catch.ts`**

```typescript
/**
 * Track bottle throw (丟瓶子)
 */
async function trackBottleThrow(
  analytics: AnalyticsService,
  userId: string,
  contentType: string,
  quotaSource: string
) {
  await analytics.trackEvent({
    event_type: ContentEvent.BOTTLE_THROW,
    event_category: 'content',
    user_id: userId,
    event_data: JSON.stringify({
      content_type: contentType,  // 'text' | 'photo' | 'voice'
      quota_source: quotaSource,  // 'base' | 'invite' | 'ad'
      timestamp: new Date().toISOString(),
    }),
  });
}

/**
 * Track bottle catch (撿瓶子)
 */
async function trackBottleCatch(
  analytics: AnalyticsService,
  userId: string,
  bottleAge: number,
  replied: boolean
) {
  await analytics.trackEvent({
    event_type: ContentEvent.BOTTLE_CATCH,
    event_category: 'content',
    user_id: userId,
    event_data: JSON.stringify({
      bottle_age_seconds: bottleAge,
      replied: replied,
      timestamp: new Date().toISOString(),
    }),
  });
}

/**
 * Track conversation start (開始對話)
 */
async function trackConversationStart(
  analytics: AnalyticsService,
  userId: string,
  partnerId: string
) {
  await analytics.trackEvent({
    event_type: ContentEvent.CONVERSATION_START,
    event_category: 'content',
    user_id: userId,
    event_data: JSON.stringify({
      partner_id: partnerId,
      timestamp: new Date().toISOString(),
    }),
  });
}

/**
 * Track conversation end (結束對話)
 */
async function trackConversationEnd(
  analytics: AnalyticsService,
  userId: string,
  conversationDuration: number,
  messageCount: number,
  endReason: string
) {
  await analytics.trackEvent({
    event_type: ContentEvent.CONVERSATION_END,
    event_category: 'content',
    user_id: userId,
    event_data: JSON.stringify({
      duration_seconds: conversationDuration,
      message_count: messageCount,
      end_reason: endReason,  // 'natural' | 'reported' | 'manual'
      timestamp: new Date().toISOString(),
    }),
  });
}
```

---

## 📊 **分析報表**

### **1. 每日運營報表**

#### **文件：`src/services/analytics_reports.ts`**

```typescript
/**
 * Generate daily operations report
 */
export async function generateDailyReport(
  db: DatabaseClient,
  date: string
): Promise<DailyReport> {
  // 1. 用戶數據
  const userMetrics = await getUserMetrics(db, date);
  
  // 2. 廣告數據
  const adMetrics = await getAdMetrics(db, date);
  
  // 3. VIP 轉化數據
  const vipMetrics = await getVIPMetrics(db, date);
  
  // 4. 邀請數據
  const inviteMetrics = await getInviteMetrics(db, date);
  
  // 5. 內容互動數據
  const contentMetrics = await getContentMetrics(db, date);
  
  return {
    date,
    user_metrics: userMetrics,
    ad_metrics: adMetrics,
    vip_metrics: vipMetrics,
    invite_metrics: inviteMetrics,
    content_metrics: contentMetrics,
  };
}

/**
 * Format daily report for Telegram
 */
export function formatDailyReport(report: DailyReport): string {
  return `
📊 **每日運營報表**
📅 日期：${report.date}

**👥 用戶數據**
• 新增用戶：${report.user_metrics.new_users} 人
• 活躍用戶（DAU）：${report.user_metrics.dau} 人
• 留存率（D1）：${report.user_metrics.d1_retention}%
• 平均使用時長：${report.user_metrics.avg_session_duration} 分鐘

**📺 廣告數據**
• 第三方廣告：
  - 展示：${report.ad_metrics.third_party.impressions} 次
  - 完成：${report.ad_metrics.third_party.completions} 次
  - 完成率：${report.ad_metrics.third_party.completion_rate}%
  - 獎勵發放：${report.ad_metrics.third_party.rewards_granted} 個額度

• 官方廣告：
  - 展示：${report.ad_metrics.official.impressions} 次
  - 點擊：${report.ad_metrics.official.clicks} 次
  - CTR：${report.ad_metrics.official.ctr}%
  - 獎勵發放：${report.ad_metrics.official.rewards_granted} 個額度

**💎 VIP 數據**
• VIP 頁面訪問：${report.vip_metrics.page_views} 次
• 購買意向：${report.vip_metrics.purchase_intents} 次
• 成功轉化：${report.vip_metrics.conversions} 次
• 轉化率：${report.vip_metrics.conversion_rate}%
• 收入：$${report.vip_metrics.revenue}

**📲 邀請數據**
• 發起邀請：${report.invite_metrics.initiated} 次
• 接受邀請：${report.invite_metrics.accepted} 次
• 激活邀請：${report.invite_metrics.activated} 次
• 轉化率：${report.invite_metrics.conversion_rate}%

**💬 內容互動**
• 丟瓶子：${report.content_metrics.bottles_thrown} 個
• 撿瓶子：${report.content_metrics.bottles_caught} 個
• 新對話：${report.content_metrics.conversations_started} 個
• 平均對話輪次：${report.content_metrics.avg_conversation_rounds}

💡 詳細數據：/analytics
  `;
}
```

---

### **2. 廣告效果分析報表**

```typescript
/**
 * Generate ad performance report
 */
export async function generateAdPerformanceReport(
  db: DatabaseClient,
  startDate: string,
  endDate: string
): Promise<AdPerformanceReport> {
  // 1. 第三方廣告表現
  const thirdPartyPerformance = await getThirdPartyAdPerformance(db, startDate, endDate);
  
  // 2. 官方廣告表現
  const officialAdPerformance = await getOfficialAdPerformance(db, startDate, endDate);
  
  // 3. 不同提供商對比
  const providerComparison = await getProviderComparison(db, startDate, endDate);
  
  // 4. 時段分析
  const hourlyAnalysis = await getHourlyAdPerformance(db, startDate, endDate);
  
  return {
    period: { start: startDate, end: endDate },
    third_party: thirdPartyPerformance,
    official: officialAdPerformance,
    provider_comparison: providerComparison,
    hourly_analysis: hourlyAnalysis,
  };
}
```

---

### **3. VIP 轉化漏斗報表**

```typescript
/**
 * Generate VIP conversion funnel report
 */
export async function generateVIPFunnelReport(
  db: DatabaseClient,
  startDate: string,
  endDate: string
): Promise<VIPFunnelReport> {
  const funnelSteps = [
    'awareness',      // 看到 VIP 提示
    'interest',       // 點擊查看 VIP
    'consideration',  // 查看 VIP 詳情
    'purchase_intent',// 點擊購買
    'purchase_success'// 購買成功
  ];
  
  const funnelData = [];
  
  for (let i = 0; i < funnelSteps.length; i++) {
    const step = funnelSteps[i];
    const count = await getFunnelStepCount(db, 'vip_conversion', step, startDate, endDate);
    const dropOffRate = i > 0 ? await getDropOffRate(db, funnelSteps[i - 1], step, startDate, endDate) : 0;
    
    funnelData.push({
      step: step,
      step_order: i + 1,
      user_count: count,
      drop_off_rate: dropOffRate,
      conversion_rate: count / funnelData[0]?.user_count || 0,
    });
  }
  
  return {
    period: { start: startDate, end: endDate },
    funnel_steps: funnelData,
    overall_conversion_rate: funnelData[funnelData.length - 1].conversion_rate,
    avg_time_to_convert: await getAvgTimeToConvert(db, startDate, endDate),
  };
}
```

---

### **4. 用戶群組分析報表**

```typescript
/**
 * Generate user cohort analysis report
 */
export async function generateCohortReport(
  db: DatabaseClient,
  cohortDate: string
): Promise<CohortReport> {
  // 獲取該日註冊的用戶
  const cohortUsers = await getUsersRegisteredOn(db, cohortDate);
  
  // 計算各天的留存率
  const retentionData = [];
  for (let day = 1; day <= 30; day++) {
    const activeUsers = await getActiveUsersOnDay(db, cohortUsers, cohortDate, day);
    retentionData.push({
      day: day,
      active_users: activeUsers,
      retention_rate: (activeUsers / cohortUsers.length) * 100,
    });
  }
  
  // 計算 VIP 轉化情況
  const vipConversions = await getVIPConversionsForCohort(db, cohortUsers);
  
  return {
    cohort_date: cohortDate,
    cohort_size: cohortUsers.length,
    retention_data: retentionData,
    vip_conversions: vipConversions,
  };
}
```

---

## 🎯 **運營決策指標**

### **1. 核心 KPI Dashboard**

```typescript
/**
 * Core KPIs for business decisions
 */
export interface CoreKPIs {
  // 用戶增長
  dau: number;              // 日活躍用戶
  wau: number;              // 週活躍用戶
  mau: number;              // 月活躍用戶
  new_users_today: number;  // 今日新增
  d1_retention: number;     // 次日留存率
  d7_retention: number;     // 7日留存率
  
  // 廣告效果
  ad_impressions: number;   // 廣告展示
  ad_completion_rate: number; // 廣告完成率
  ad_revenue_estimate: number; // 預估廣告收入
  
  // VIP 轉化
  vip_conversion_rate: number; // VIP 轉化率
  vip_revenue_today: number;   // 今日 VIP 收入
  vip_mrr: number;             // 月度經常性收入
  
  // 邀請效果
  invite_k_factor: number;     // 病毒係數
  invite_conversion_rate: number; // 邀請轉化率
  
  // 內容互動
  bottles_per_user: number;    // 人均丟瓶子數
  conversation_rate: number;   // 對話率
  
  // 健康度指標
  report_rate: number;         // 舉報率
  ban_rate: number;            // 封禁率
  churn_rate: number;          // 流失率
}
```

---

### **2. 關鍵決策問題 & 對應指標**

#### **問題 1：廣告系統是否有效？**

**關鍵指標：**
- 廣告完成率 > 80%（健康）
- 廣告獎勵使用率 > 60%（用戶真的需要額度）
- 廣告後 VIP 轉化率 vs 未看廣告用戶的 VIP 轉化率

**決策邏輯：**
```typescript
if (ad_completion_rate > 80 && ad_reward_usage_rate > 60) {
  // 廣告系統有效，可以考慮：
  // 1. 增加廣告提供商
  // 2. 提高每日廣告上限
  // 3. 優化廣告獎勵額度
} else if (ad_completion_rate < 50) {
  // 廣告體驗不佳，需要：
  // 1. 檢查廣告提供商質量
  // 2. 優化廣告加載速度
  // 3. 考慮更換廣告商
}
```

---

#### **問題 2：應該優化免費用戶體驗還是推廣 VIP？**

**關鍵指標：**
- 免費用戶活躍度（DAU 中免費用戶佔比）
- VIP 轉化率
- VIP 收入 vs 廣告收入

**決策邏輯：**
```typescript
const free_user_ratio = free_dau / total_dau;
const vip_conversion_rate = vip_conversions / total_users;
const revenue_ratio = vip_revenue / (vip_revenue + ad_revenue);

if (free_user_ratio > 0.9 && vip_conversion_rate < 0.05) {
  // 大部分用戶是免費用戶，VIP 轉化低
  // 策略：優化免費用戶體驗，增加廣告收入
  // 1. 提高廣告質量
  // 2. 增加官方廣告（永久額度）
  // 3. 優化邀請機制
} else if (revenue_ratio > 0.7 && vip_conversion_rate > 0.1) {
  // VIP 是主要收入來源
  // 策略：專注 VIP 用戶體驗
  // 1. 增加 VIP 專屬功能
  // 2. 優化 VIP 續費流程
  // 3. VIP 用戶社群建設
}
```

---

#### **問題 3：邀請系統是否健康？**

**關鍵指標：**
- K-factor（病毒係數）> 1（自然增長）
- 邀請激活率 > 50%
- 被邀請用戶的留存率 vs 自然用戶

**決策邏輯：**
```typescript
const k_factor = (invites_sent / active_users) * (invites_accepted / invites_sent);
const invite_activation_rate = invites_activated / invites_accepted;

if (k_factor > 1 && invite_activation_rate > 0.5) {
  // 邀請系統非常健康
  // 策略：加大邀請獎勵
  // 1. 增加邀請者獎勵
  // 2. 給被邀請者首次獎勵
  // 3. 推出邀請排行榜
} else if (k_factor < 0.5) {
  // 邀請系統需要優化
  // 策略：降低邀請門檻
  // 1. 簡化邀請流程
  // 2. 增加邀請入口
  // 3. 優化邀請文案
}
```

---

#### **問題 4：用戶在哪個階段流失最多？**

**關鍵指標：**
- 新手流失率（D1, D3, D7）
- VIP 轉化漏斗各階段流失率
- 用戶最後一次活躍時間分布

**決策邏輯：**
```typescript
const d1_retention = 0.45;  // 45% 次日留存
const d7_retention = 0.25;  // 25% 7日留存

if (d1_retention < 0.4) {
  // 新手流失嚴重
  // 策略：優化新手體驗
  // 1. 新手引導優化
  // 2. 首次體驗獎勵
  // 3. 降低首次使用門檻
} else if (d7_retention / d1_retention < 0.5) {
  // D1-D7 流失嚴重
  // 策略：增加用戶粘性
  // 1. 每日簽到獎勵
  // 2. 連續使用獎勵
  // 3. 推送通知優化
}
```

---

## 🛠️ **實現方案**

### **Phase 1: 數據庫 & Domain（2-3 天）**

**任務清單：**
- [ ] 創建 Migration `0028_create_analytics_events.sql`
- [ ] 創建 Migration `0029_create_user_sessions.sql`
- [ ] 創建 Migration `0030_create_daily_user_summary.sql`
- [ ] 創建 Migration `0031_create_funnel_events.sql`
- [ ] 創建 Migration `0032_update_daily_stats_analytics.sql`
- [ ] 執行所有 Migrations
- [ ] 創建 `src/domain/analytics.ts`
- [ ] 創建 `src/domain/analytics_events.ts`（事件類型定義）
- [ ] 編寫單元測試

---

### **Phase 2: Analytics Service（2-3 天）**

**任務清單：**
- [ ] 創建 `src/services/analytics.ts`
- [ ] 實現 `trackEvent()` 方法
- [ ] 實現 `trackFunnelStep()` 方法
- [ ] 實現 `startSession()` 和 `endSession()` 方法
- [ ] 創建 `src/db/queries/analytics.ts`
- [ ] 實現各種查詢方法
- [ ] 編寫測試

---

### **Phase 3: 集成追蹤點（3-4 天）**

**任務清單：**
- [ ] 集成用戶註冊追蹤（`start.ts`）
- [ ] 集成廣告追蹤（`ad_reward.ts`）
- [ ] 集成 VIP 追蹤（`vip.ts`, `throw.ts`）
- [ ] 集成邀請追蹤（`profile.ts`, `start.ts`）
- [ ] 集成內容追蹤（`throw.ts`, `catch.ts`, `conversation.ts`）
- [ ] 測試所有追蹤點

---

### **Phase 4: 報表系統（2-3 天）**

**任務清單：**
- [ ] 創建 `src/services/analytics_reports.ts`
- [ ] 實現每日運營報表
- [ ] 實現廣告效果報表
- [ ] 實現 VIP 轉化漏斗報表
- [ ] 實現用戶群組分析報表
- [ ] 創建 `src/telegram/handlers/admin_analytics.ts`
- [ ] 實現 `/analytics` 命令
- [ ] 實現 `/ad_performance` 命令
- [ ] 實現 `/vip_funnel` 命令
- [ ] 實現 `/cohort_analysis` 命令

---

### **Phase 5: 自動化報表（1-2 天）**

**任務清單：**
- [ ] 創建 `src/cron/daily_report.ts`
- [ ] 實現每日自動報表生成
- [ ] 實現自動推送給超級管理員
- [ ] 配置 Cloudflare Cron Triggers
- [ ] 測試自動化流程

---

### **Phase 6: Dashboard & 可視化（可選，2-3 天）**

**任務清單：**
- [ ] 創建 `public/analytics-dashboard.html`
- [ ] 實現數據可視化（Chart.js）
- [ ] 實現實時數據更新
- [ ] 添加篩選和時間範圍選擇
- [ ] 部署到 Cloudflare Pages

---

## 📈 **預期效果**

### **1. 數據驅動決策**
- ✅ 每天自動收到運營報表
- ✅ 實時了解廣告效果
- ✅ 清楚知道 VIP 轉化情況
- ✅ 掌握用戶行為模式

### **2. 快速問題發現**
- ✅ 廣告完成率下降 → 立即切換廣告商
- ✅ 新手留存率低 → 優化新手引導
- ✅ VIP 轉化率低 → 調整定價或功能

### **3. 精準運營優化**
- ✅ 知道哪個時段用戶最活躍 → 優化推送時間
- ✅ 知道哪種廣告效果最好 → 調整廣告策略
- ✅ 知道用戶從哪裡來 → 優化推廣渠道

### **4. 收益最大化**
- ✅ 平衡廣告收入和 VIP 收入
- ✅ 優化 VIP 定價策略
- ✅ 提高用戶 LTV

---

## 🎯 **總結**

### **核心追蹤點（必須實現）**

1. ✅ **用戶註冊** - 追蹤來源和轉化
2. ✅ **廣告互動** - 完整的廣告漏斗
3. ✅ **VIP 轉化** - 5 步轉化漏斗
4. ✅ **邀請行為** - 病毒增長追蹤
5. ✅ **內容互動** - 用戶活躍度

### **核心報表（必須實現）**

1. ✅ **每日運營報表** - 自動推送
2. ✅ **廣告效果報表** - 優化廣告策略
3. ✅ **VIP 轉化報表** - 提高轉化率
4. ✅ **用戶留存報表** - 降低流失

### **技術方案**

- ✅ **Cloudflare Analytics + D1** - 無需額外依賴
- ✅ **完整的事件追蹤** - 記錄所有關鍵行為
- ✅ **自動化報表** - 每日推送，無需手動查詢
- ✅ **實時查詢** - SQL 查詢任何數據

---

**總開發時間：約 10-15 天**

**優先級：**
1. Phase 1-3（核心追蹤）- 必須
2. Phase 4（報表系統）- 必須
3. Phase 5（自動化）- 強烈推薦
4. Phase 6（Dashboard）- 可選

---

**準備好開始實現了嗎？** 🚀

**最後更新**: 2025-01-18  
**版本**: 1.0  
**作者**: XunNi Team

