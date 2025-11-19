# 廣告獎勵系統設計

## 📋 **需求分析**

### **核心需求**
1. **免費用戶專屬**：只有免費用戶可以看廣告增加額度
2. **臨時額度**：廣告獲得的額度只在當天有效，隔天重置
3. **每日上限**：每天最多看 20 次廣告
4. **即時獎勵**：每成功播放一次廣告，立即 +1 額度
5. **VIP 不可用**：VIP 用戶不顯示看廣告選項

### **額度計算公式**

#### **免費用戶**
```typescript
當日總額度 = 基礎額度(3) + 邀請獎勵(永久) + 廣告獎勵(臨時)
最大額度 = 10 + 20 = 30

例如：
- 基礎：3 個
- 邀請朋友：2 個（永久）
- 看廣告：5 個（當天）
- 當日總額度：10 個
```

#### **VIP 用戶**
```typescript
當日總額度 = 基礎額度(30) + 邀請獎勵(永久)
最大額度 = 100

無廣告選項
```

---

## 🎯 **廣告類型**

### **1. 第三方視頻廣告（Third-Party Video Ads）**
- **提供商**：GigaPub、Google AdSense、Unity Ads
- **特點**：需要觀看完整視頻
- **獎勵**：觀看完成後 +1 額度
- **限制**：每天最多 20 次

### **2. 官方文字廣告（Official Text Ads）** ⭐ **新增**
- **提供商**：XunNi 官方
- **類型**：
  - 文字公告（純文字）
  - 鏈接推廣（帶 URL）
  - 群組邀請（需加入群組）
  - 頻道訂閱（需訂閱頻道）
- **特點**：
  - ✅ 點擊即獎勵（無需等待）
  - ✅ 每個廣告只推送一次給每個用戶
  - ✅ 不計入每日 20 次限制
  - ✅ 未來支持加入群組後認證
- **獎勵**：點擊後立即 +1 額度

---

## 🎯 **廣告集成方案**

### **第三方廣告平台：GigaPub**
- **文檔**：https://docs.giga.pub/integration-guide.html
- **API**：`window.showGiga()`
- **特點**：Promise-based，支持獎勵回調

### **集成代碼**
```html
<!-- 添加到 HTML head -->
<script src="https://ad.gigapub.tech/script?id=YOUR_PROJECT_ID"></script>

<!-- 增強可靠性版本（推薦） -->
<script data-project-id="YOUR_PROJECT_ID">
  !function(){
    var s=document.currentScript,p=s.getAttribute('data-project-id')||'default';
    var d=['https://ad.gigapub.tech','https://ru-ad.gigapub.tech'],i=0,t,sc;
    function l(){
      sc=document.createElement('script');
      sc.async=true;
      sc.src=d[i]+'/script?id='+p;
      clearTimeout(t);
      t=setTimeout(function(){
        sc.onload=sc.onerror=null;
        sc.src='';
        if(++i<d.length)l();
      },15000);
      sc.onload=function(){clearTimeout(t)};
      sc.onerror=function(){clearTimeout(t);if(++i<d.length)l()};
      document.head.appendChild(sc);
    }
    l();
  }();
</script>
```

---

## 🗄️ **數據庫設計**

### **1. 廣告獎勵記錄表：ad_rewards**
```sql
CREATE TABLE IF NOT EXISTS ad_rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT NOT NULL,
  reward_date TEXT NOT NULL,  -- YYYY-MM-DD
  ads_watched INTEGER DEFAULT 0,  -- 當天已看第三方廣告數（最多 20）
  quota_earned INTEGER DEFAULT 0,  -- 當天第三方廣告獲得的額度
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(telegram_id, reward_date)
);

CREATE INDEX idx_ad_rewards_telegram_date ON ad_rewards(telegram_id, reward_date);
```

### **2. 官方廣告表：official_ads** ⭐ **新增**
```sql
CREATE TABLE IF NOT EXISTS official_ads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ad_type TEXT NOT NULL,  -- 'text' | 'link' | 'group' | 'channel'
  title TEXT NOT NULL,  -- 廣告標題
  content TEXT NOT NULL,  -- 廣告內容
  url TEXT,  -- 鏈接（link/group/channel 類型必填）
  target_entity_id TEXT,  -- 群組/頻道 ID（用於認證）
  reward_quota INTEGER DEFAULT 1,  -- 獎勵額度（默認 1）
  is_enabled INTEGER DEFAULT 1,  -- 是否啟用
  start_date TEXT,  -- 開始日期（可選）
  end_date TEXT,  -- 結束日期（可選）
  max_views INTEGER,  -- 最大觀看次數（可選）
  current_views INTEGER DEFAULT 0,  -- 當前觀看次數
  requires_verification INTEGER DEFAULT 0,  -- 是否需要認證（群組/頻道）
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_official_ads_enabled ON official_ads(is_enabled, start_date, end_date);
CREATE INDEX idx_official_ads_type ON official_ads(ad_type);
```

### **3. 官方廣告觀看記錄表：official_ad_views** ⭐ **新增**
```sql
CREATE TABLE IF NOT EXISTS official_ad_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT NOT NULL,
  ad_id INTEGER NOT NULL,
  viewed_at TEXT DEFAULT CURRENT_TIMESTAMP,
  clicked INTEGER DEFAULT 0,  -- 是否點擊
  clicked_at TEXT,  -- 點擊時間
  verified INTEGER DEFAULT 0,  -- 是否已認證（加入群組/頻道）
  verified_at TEXT,  -- 認證時間
  reward_granted INTEGER DEFAULT 0,  -- 是否已發放獎勵
  reward_granted_at TEXT,  -- 獎勵發放時間
  
  UNIQUE(telegram_id, ad_id),
  FOREIGN KEY (ad_id) REFERENCES official_ads(id) ON DELETE CASCADE
);

CREATE INDEX idx_official_ad_views_telegram ON official_ad_views(telegram_id);
CREATE INDEX idx_official_ad_views_ad ON official_ad_views(ad_id);
CREATE INDEX idx_official_ad_views_reward ON official_ad_views(reward_granted);
```

### **字段說明**

#### **ad_rewards 表**
- `telegram_id`: 用戶 Telegram ID
- `reward_date`: 獎勵日期（YYYY-MM-DD）
- `ads_watched`: 當天已看第三方廣告次數（0-20）
- `quota_earned`: 當天第三方廣告獲得的額度（0-20）

#### **official_ads 表**
- `ad_type`: 廣告類型（text/link/group/channel）
- `title`: 廣告標題
- `content`: 廣告內容（支持 Markdown）
- `url`: 鏈接地址（link/group/channel 類型必填）
- `target_entity_id`: 目標群組/頻道 ID（用於機器人認證）
- `reward_quota`: 獎勵額度（默認 1，可設置更高）
- `requires_verification`: 是否需要認證（群組/頻道加入後才發放獎勵）
- `max_views`: 最大觀看次數限制（達到後自動停用）

#### **official_ad_views 表**
- `telegram_id`: 用戶 Telegram ID
- `ad_id`: 廣告 ID
- `clicked`: 是否點擊（0/1）
- `verified`: 是否已認證（0/1，僅群組/頻道類型）
- `reward_granted`: 是否已發放獎勵（0/1）

---

## 📊 **Domain 邏輯**

### **文件：`src/domain/ad_reward.ts`**（新建）

```typescript
/**
 * Ad Reward Domain Logic
 * Manages daily ad watching and quota rewards
 */

export interface AdReward {
  id: number;
  telegram_id: string;
  reward_date: string;
  ads_watched: number;
  quota_earned: number;
  created_at: string;
  updated_at: string;
}

// Constants
export const MAX_DAILY_ADS = 20;
export const QUOTA_PER_AD = 1;
export const AD_COOLDOWN_HOURS = 24;

/**
 * Check if user can watch ad today
 */
export function canWatchAd(adsWatched: number): boolean {
  return adsWatched < MAX_DAILY_ADS;
}

/**
 * Get remaining ads for today
 */
export function getRemainingAds(adsWatched: number): number {
  return Math.max(0, MAX_DAILY_ADS - adsWatched);
}

/**
 * Calculate hours until next ad reset
 */
export function getHoursUntilReset(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const diffMs = tomorrow.getTime() - now.getTime();
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
  
  return diffHours;
}

/**
 * Get today's date string (YYYY-MM-DD)
 */
export function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Calculate total daily quota including ad rewards
 */
export function calculateDailyQuotaWithAds(
  baseQuota: number,
  inviteBonus: number,
  adBonus: number
): number {
  // Free user max: 10 (base+invite) + 20 (ads) = 30
  const maxBaseQuota = 10;
  const baseWithInvite = Math.min(baseQuota + inviteBonus, maxBaseQuota);
  
  return baseWithInvite + adBonus;
}
```

---

## 🔧 **數據庫查詢**

### **文件：`src/db/queries/ad_rewards.ts`**（新建）

```typescript
/**
 * Ad Rewards Database Queries
 */

import type { DatabaseClient } from '../client';
import type { AdReward } from '~/domain/ad_reward';
import { getTodayDateString } from '~/domain/ad_reward';

/**
 * Get today's ad reward record for user
 */
export async function getTodayAdReward(
  db: DatabaseClient,
  telegramId: string
): Promise<AdReward | null> {
  const today = getTodayDateString();
  
  const result = await db.d1
    .prepare(
      `SELECT * FROM ad_rewards 
       WHERE telegram_id = ? AND reward_date = ?`
    )
    .bind(telegramId, today)
    .first<AdReward>();
  
  return result || null;
}

/**
 * Create or get today's ad reward record
 */
export async function getOrCreateTodayAdReward(
  db: DatabaseClient,
  telegramId: string
): Promise<AdReward> {
  const existing = await getTodayAdReward(db, telegramId);
  if (existing) {
    return existing;
  }
  
  const today = getTodayDateString();
  
  await db.d1
    .prepare(
      `INSERT INTO ad_rewards (telegram_id, reward_date, ads_watched, quota_earned)
       VALUES (?, ?, 0, 0)`
    )
    .bind(telegramId, today)
    .run();
  
  const created = await getTodayAdReward(db, telegramId);
  if (!created) {
    throw new Error('Failed to create ad reward record');
  }
  
  return created;
}

/**
 * Increment ad watch count and quota
 */
export async function incrementAdReward(
  db: DatabaseClient,
  telegramId: string
): Promise<AdReward> {
  const today = getTodayDateString();
  
  await db.d1
    .prepare(
      `UPDATE ad_rewards 
       SET ads_watched = ads_watched + 1,
           quota_earned = quota_earned + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE telegram_id = ? AND reward_date = ?`
    )
    .bind(telegramId, today)
    .run();
  
  const updated = await getTodayAdReward(db, telegramId);
  if (!updated) {
    throw new Error('Failed to update ad reward');
  }
  
  return updated;
}
```

---

## 🎨 **提示訊息優化**

### **更新：`src/domain/bottle_quota_prompt.ts`**

```typescript
/**
 * Generate quota exhausted prompt with ad option
 */
export function getQuotaExhaustedPrompt(
  isVip: boolean,
  throwsToday: number,
  quota: number,
  maxQuota: number,
  adsWatched: number = 0  // ✨ NEW: 當天已看廣告數
): QuotaPromptResult {
  // Free user - quota not full (3-9)
  if (!isVip && quota < 10) {
    const remainingAds = MAX_DAILY_ADS - adsWatched;
    const adOption = remainingAds > 0
      ? `\n\n📺 或者看廣告增加額度：\n` +
        `• 每看一則廣告 +1 額度\n` +
        `• 今日剩餘：${remainingAds}/20 次\n` +
        `• 額度明天重置`
      : `\n\n📺 今日廣告已看完（20/20）\n` +
        `• 預計 ${getHoursUntilReset()} 小時後重置`;
    
    return {
      message:
        `❌ 今日漂流瓶配額已用完（${throwsToday}/${quota}）\n\n` +
        `💡 想要更多配額嗎？\n\n` +
        `🎁 邀請朋友一起玩：\n` +
        `• 每位朋友成功送出漂流瓶\n` +
        `• 你可獲得 +1 配額（永久）\n` +
        `• 最多可增加到 10 個/天` +
        adOption +
        `\n\n或者升級 VIP 獲得 30+ 配額：/vip`,
      buttons: [
        [{ text: '📲 邀請朋友', callback_data: 'show_invite' }],
        ...(remainingAds > 0 
          ? [[{ text: '📺 看廣告 +1', callback_data: 'watch_ad' }]]
          : []
        ),
      ],
    };
  }

  // Free user - quota full (10)
  if (!isVip && quota >= 10) {
    const remainingAds = MAX_DAILY_ADS - adsWatched;
    const adOption = remainingAds > 0
      ? {
          message: `\n\n📺 還可以看廣告增加額度：\n` +
                   `• 每看一則廣告 +1 額度\n` +
                   `• 今日剩餘：${remainingAds}/20 次`,
          button: [{ text: '📺 看廣告 +1', callback_data: 'watch_ad' }]
        }
      : {
          message: `\n\n📺 今日廣告已看完（20/20）\n` +
                   `• 預計 ${getHoursUntilReset()} 小時後重置`,
          button: null
        };
    
    return {
      message:
        `❌ 今日漂流瓶配額已用完（${throwsToday}/${quota}）\n\n` +
        `🌟 已達免費用戶基礎最大配額！` +
        adOption.message +
        `\n\n想要更多配額？升級 VIP：\n` +
        `• 基礎配額：30 個/天\n` +
        `• 邀請獎勵：最多 100 個/天\n` +
        `• 無需看廣告`,
      buttons: [
        ...(adOption.button ? [[adOption.button]] : []),
        [{ text: '💎 立即升級 VIP', callback_data: 'show_vip' }],
      ],
    };
  }

  // VIP user - no ad option
  // ... (保持原有 VIP 邏輯)
}
```

---

## 🎬 **廣告處理器**

### **文件：`src/telegram/handlers/ad_reward.ts`**（新建）

```typescript
/**
 * Ad Reward Handler
 * Handles ad watching and quota rewards
 */

import type { Env, CallbackQuery } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { findUserByTelegramId } from '~/db/queries/users';
import { getOrCreateTodayAdReward, incrementAdReward } from '~/db/queries/ad_rewards';
import { canWatchAd, getRemainingAds, getHoursUntilReset } from '~/domain/ad_reward';

/**
 * Handle watch ad callback
 */
export async function handleWatchAd(
  callbackQuery: CallbackQuery,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ 用戶不存在');
      return;
    }

    // Check if VIP (VIP users cannot watch ads)
    const isVip = !!(user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > new Date());
    if (isVip) {
      await telegram.answerCallbackQuery(callbackQuery.id, '❌ VIP 用戶無需看廣告');
      await telegram.sendMessage(
        chatId,
        '💎 VIP 用戶已享有充足配額，無需看廣告！\n\n' +
        '查看你的配額：/profile'
      );
      return;
    }

    // Get today's ad reward record
    const adReward = await getOrCreateTodayAdReward(db, telegramId);

    // Check if can watch more ads today
    if (!canWatchAd(adReward.ads_watched)) {
      const hoursUntilReset = getHoursUntilReset();
      await telegram.answerCallbackQuery(
        callbackQuery.id,
        `❌ 今日廣告已看完（20/20）`
      );
      await telegram.sendMessage(
        chatId,
        `📺 今日廣告配額已用完\n\n` +
        `• 已觀看：20/20 次\n` +
        `• 預計 ${hoursUntilReset} 小時後重置\n\n` +
        `💡 你還可以：\n` +
        `• 邀請朋友獲得永久額度：/profile\n` +
        `• 升級 VIP 無限暢玩：/vip`
      );
      return;
    }

    // Answer callback first
    await telegram.answerCallbackQuery(callbackQuery.id, '📺 正在加載廣告...');

    // Send loading message
    const loadingMsg = await telegram.sendMessage(
      chatId,
      '📺 正在為你準備廣告...\n\n' +
      '請稍候，廣告加載中...'
    );

    // Trigger ad display via Telegram Mini App
    // Note: This requires Telegram Mini App integration
    // For now, we'll simulate the ad watch process
    
    // TODO: Integrate with GigaPub via Telegram Mini App
    // The actual implementation will need:
    // 1. A web page hosted on your domain
    // 2. The page includes GigaPub script
    // 3. Open the page in Telegram Mini App
    // 4. Call window.showGiga()
    // 5. On success, call your webhook to increment quota

    // For now, send instructions to user
    await telegram.editMessageText(
      chatId,
      loadingMsg.message_id,
      '📺 **觀看廣告獲得額度**\n\n' +
      '點擊下方按鈕開始觀看廣告：',
      [
        [
          {
            text: '▶️ 開始觀看廣告',
            url: `https://your-domain.com/ad?user=${telegramId}&token=${generateAdToken(telegramId, env)}`
          }
        ],
        [
          { text: '❌ 取消', callback_data: 'cancel_ad' }
        ]
      ]
    );

  } catch (error) {
    console.error('[handleWatchAd] Error:', error);
    await telegram.answerCallbackQuery(
      callbackQuery.id,
      '❌ 加載廣告失敗，請稍後再試'
    );
  }
}

/**
 * Handle ad completion webhook
 * Called by your ad page after successful ad watch
 */
export async function handleAdComplete(
  telegramId: string,
  token: string,
  env: Env
): Promise<{ success: boolean; message: string }> {
  const db = createDatabaseClient(env.DB);

  try {
    // Verify token
    if (!verifyAdToken(telegramId, token, env)) {
      return { success: false, message: 'Invalid token' };
    }

    // Get user
    const user = await findUserByTelegramId(db, telegramId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Check if VIP
    const isVip = !!(user.is_vip && user.vip_expire_at && new Date(user.vip_expire_at) > new Date());
    if (isVip) {
      return { success: false, message: 'VIP users cannot watch ads' };
    }

    // Get today's ad reward
    const adReward = await getOrCreateTodayAdReward(db, telegramId);

    // Check if can watch more ads
    if (!canWatchAd(adReward.ads_watched)) {
      return { success: false, message: 'Daily ad limit reached' };
    }

    // Increment ad reward
    const updated = await incrementAdReward(db, telegramId);

    // Send success notification
    const telegram = createTelegramService(env);
    const remaining = getRemainingAds(updated.ads_watched);
    
    await telegram.sendMessage(
      parseInt(telegramId),
      `✅ 廣告觀看成功！\n\n` +
      `🎁 你獲得了 +1 漂流瓶額度\n` +
      `📊 今日廣告：${updated.ads_watched}/20\n` +
      `📺 剩餘次數：${remaining} 次\n\n` +
      `現在可以繼續丟瓶子了：/throw`
    );

    return {
      success: true,
      message: 'Ad reward granted successfully'
    };

  } catch (error) {
    console.error('[handleAdComplete] Error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate ad token for verification
 */
function generateAdToken(telegramId: string, env: Env): string {
  // Simple token generation (you should use a more secure method in production)
  const secret = env.BOT_TOKEN || 'default-secret';
  const timestamp = Date.now();
  const data = `${telegramId}:${timestamp}`;
  
  // In production, use proper HMAC or JWT
  return Buffer.from(data).toString('base64');
}

/**
 * Verify ad token
 */
function verifyAdToken(telegramId: string, token: string, env: Env): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [id, timestamp] = decoded.split(':');
    
    // Check if token is for this user
    if (id !== telegramId) {
      return false;
    }
    
    // Check if token is not expired (5 minutes)
    const now = Date.now();
    const tokenTime = parseInt(timestamp);
    if (now - tokenTime > 5 * 60 * 1000) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}
```

---

## 🌐 **廣告頁面實現**

### **文件：`public/ad.html`**（新建）

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>觀看廣告 - XunNi</title>
  
  <!-- GigaPub Enhanced Script -->
  <script data-project-id="YOUR_PROJECT_ID">
    !function(){
      var s=document.currentScript,p=s.getAttribute('data-project-id')||'default';
      var d=['https://ad.gigapub.tech','https://ru-ad.gigapub.tech'],i=0,t,sc;
      function l(){
        sc=document.createElement('script');
        sc.async=true;
        sc.src=d[i]+'/script?id='+p;
        clearTimeout(t);
        t=setTimeout(function(){
          sc.onload=sc.onerror=null;
          sc.src='';
          if(++i<d.length)l();
        },15000);
        sc.onload=function(){clearTimeout(t)};
        sc.onerror=function(){clearTimeout(t);if(++i<d.length)l()};
        document.head.appendChild(sc);
      }
      l();
    }();
  </script>
  
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      text-align: center;
      max-width: 400px;
    }
    .icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 10px;
    }
    p {
      font-size: 16px;
      opacity: 0.9;
      margin-bottom: 30px;
    }
    button {
      background: white;
      color: #667eea;
      border: none;
      padding: 15px 40px;
      font-size: 18px;
      font-weight: bold;
      border-radius: 25px;
      cursor: pointer;
      transition: transform 0.2s;
    }
    button:hover {
      transform: scale(1.05);
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .status {
      margin-top: 20px;
      font-size: 14px;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📺</div>
    <h1>觀看廣告獲得額度</h1>
    <p>觀看完整廣告後，你將獲得 +1 漂流瓶額度</p>
    <button id="watchBtn" onclick="watchAd()">▶️ 開始觀看</button>
    <div id="status" class="status"></div>
  </div>

  <script>
    // Get URL parameters
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('user');
    const token = params.get('token');

    if (!userId || !token) {
      document.getElementById('status').textContent = '❌ 無效的鏈接';
      document.getElementById('watchBtn').disabled = true;
    }

    async function watchAd() {
      const btn = document.getElementById('watchBtn');
      const status = document.getElementById('status');
      
      btn.disabled = true;
      status.textContent = '📺 正在加載廣告...';

      try {
        // Check if showGiga is available
        if (typeof window.showGiga !== 'function') {
          throw new Error('廣告服務未就緒，請稍後再試');
        }

        // Show ad
        await window.showGiga();
        
        // Ad completed successfully
        status.textContent = '✅ 廣告播放完成，正在發放獎勵...';
        
        // Notify backend
        const response = await fetch('/api/ad-complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            token: token,
          }),
        });

        const result = await response.json();
        
        if (result.success) {
          status.textContent = '🎉 恭喜！你獲得了 +1 額度';
          setTimeout(() => {
            if (window.Telegram && window.Telegram.WebApp) {
              window.Telegram.WebApp.close();
            } else {
              window.close();
            }
          }, 2000);
        } else {
          throw new Error(result.message || '獎勵發放失敗');
        }

      } catch (error) {
        console.error('Ad error:', error);
        status.textContent = `❌ ${error.message || '廣告播放失敗，請稍後再試'}`;
        btn.disabled = false;
      }
    }
  </script>
</body>
</html>
```

---

## 🔌 **Router 集成**

### **更新：`src/router.ts`**

```typescript
// Watch ad callback
if (callbackData === 'watch_ad') {
  const { handleWatchAd } = await import('./telegram/handlers/ad_reward');
  await handleWatchAd(callbackQuery, env);
  return;
}

// Cancel ad callback
if (callbackData === 'cancel_ad') {
  await telegram.answerCallbackQuery(callbackQuery.id, '已取消');
  await telegram.deleteMessage(
    callbackQuery.message!.chat.id,
    callbackQuery.message!.message_id
  );
  return;
}
```

### **添加 API 端點**

```typescript
// Handle ad completion webhook
if (url.pathname === '/api/ad-complete') {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await request.json() as { user_id: string; token: string };
    const { handleAdComplete } = await import('./telegram/handlers/ad_reward');
    const result = await handleAdComplete(body.user_id, body.token, env);
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

---

## 🔄 **額度計算更新**

### **更新：`src/domain/bottle.ts`**

```typescript
/**
 * Get bottle quota including ad rewards
 */
export function getBottleQuotaWithAds(
  isVip: boolean,
  inviteBonus: number,
  adBonus: number = 0  // ✨ NEW: Ad reward bonus
): {
  quota: number;
  maxQuota: number;
} {
  if (isVip) {
    // VIP: no ad bonus
    const baseQuota = 30;
    const maxQuota = 100;
    const quota = Math.min(baseQuota + inviteBonus, maxQuota);
    return { quota, maxQuota };
  } else {
    // Free: base + invite (max 10) + ad (max 20)
    const baseQuota = 3;
    const maxInviteQuota = 10;
    const maxAdQuota = 20;
    
    const baseWithInvite = Math.min(baseQuota + inviteBonus, maxInviteQuota);
    const quota = baseWithInvite + Math.min(adBonus, maxAdQuota);
    const maxQuota = maxInviteQuota + maxAdQuota; // 30
    
    return { quota, maxQuota };
  }
}
```

---

## 📝 **Migration 腳本**

### **文件：`src/db/migrations/0022_create_ad_rewards_table.sql`**

```sql
-- Migration: 0022_create_ad_rewards_table.sql
-- Create ad_rewards table for daily ad watching rewards

CREATE TABLE IF NOT EXISTS ad_rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT NOT NULL,
  reward_date TEXT NOT NULL,  -- YYYY-MM-DD
  ads_watched INTEGER DEFAULT 0,  -- 當天已看廣告數 (0-20)
  quota_earned INTEGER DEFAULT 0,  -- 當天廣告獲得的額度 (0-20)
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(telegram_id, reward_date)
);

CREATE INDEX IF NOT EXISTS idx_ad_rewards_telegram_date 
  ON ad_rewards(telegram_id, reward_date);

CREATE INDEX IF NOT EXISTS idx_ad_rewards_date 
  ON ad_rewards(reward_date);
```

---

## ✅ **實現檢查清單**

### **Phase 1: 數據庫 & Domain**
- [ ] 創建 Migration `0022_create_ad_rewards_table.sql`
- [ ] 執行 Migration
- [ ] 創建 `src/domain/ad_reward.ts`
- [ ] 創建 `src/db/queries/ad_rewards.ts`
- [ ] 更新 `src/domain/bottle.ts` 添加 `getBottleQuotaWithAds()`

### **Phase 2: 提示優化**
- [ ] 更新 `src/domain/bottle_quota_prompt.ts`
- [ ] 添加廣告選項到提示訊息
- [ ] 更新 `src/telegram/handlers/throw.ts`

### **Phase 3: 廣告處理**
- [ ] 創建 `src/telegram/handlers/ad_reward.ts`
- [ ] 更新 `src/router.ts` 添加 callback 處理
- [ ] 更新 `src/router.ts` 添加 API 端點

### **Phase 4: 前端頁面**
- [ ] 創建 `public/ad.html`
- [ ] 配置 GigaPub Project ID
- [ ] 測試廣告播放流程

### **Phase 5: 測試**
- [ ] 測試免費用戶看廣告流程
- [ ] 測試每日上限（20 次）
- [ ] 測試隔天重置
- [ ] 測試 VIP 用戶無廣告選項
- [ ] 測試額度計算正確性

---

## 🎯 **用戶體驗流程**

### **免費用戶看廣告**
```
1. 用戶：/throw（額度已用完）
   ↓
2. Bot：顯示額度用完提示
   • 邀請朋友（永久）
   • 看廣告 +1（當天）
   • 升級 VIP
   [📲 邀請朋友] [📺 看廣告 +1]
   ↓
3. 用戶：點擊 [📺 看廣告 +1]
   ↓
4. Bot：打開廣告頁面（Telegram Mini App）
   ↓
5. 用戶：觀看完整廣告
   ↓
6. 廣告頁面：調用 window.showGiga()
   ↓
7. 廣告完成：通知後端 /api/ad-complete
   ↓
8. 後端：+1 額度，發送成功通知
   ↓
9. Bot：✅ 你獲得了 +1 額度！
   現在可以繼續丟瓶子了：/throw
```

---

## 🛡️ **安全考慮**

### **1. Token 驗證**
- ✅ 每個廣告鏈接包含唯一 token
- ✅ Token 有效期 5 分鐘
- ✅ Token 綁定特定用戶

### **2. 防刷機制**
- ✅ 每日上限 20 次
- ✅ 數據庫唯一約束（telegram_id + reward_date）
- ✅ 後端驗證用戶身份

### **3. VIP 保護**
- ✅ VIP 用戶無法看廣告
- ✅ 前端和後端雙重檢查

---

## 📊 **預期效果**

### **用戶增長**
- ✅ 提供免費用戶更多選擇
- ✅ 降低 VIP 購買壓力
- ✅ 提高用戶留存率

### **收益平衡**
- ✅ 廣告收入補充
- ✅ 保持 VIP 吸引力（無廣告）
- ✅ 鼓勵邀請機制（永久額度）

---

## 🚀 **部署步驟**

1. ✅ 執行數據庫 Migration
2. ✅ 部署後端代碼
3. ✅ 部署廣告頁面（public/ad.html）
4. ✅ 配置 GigaPub Project ID
5. ✅ 測試完整流程
6. ✅ 監控廣告播放數據

---

**設計完成！準備實現！** 🎉

**參考文檔：**
- GigaPub Integration: https://docs.giga.pub/integration-guide.html
- Telegram Mini Apps: https://core.telegram.org/bots/webapps

---

## 📊 **廣告統計系統**

### **需求**
- 統計廣告被觀看次數（ad_views）
- 統計廣告成功播放次數（ad_completions）
- 每日統計報表推送給超級管理員
- 集成到現有的 daily_stats 系統

---

### **數據庫設計**

#### **更新 ad_rewards 表**
```sql
-- 添加統計字段
ALTER TABLE ad_rewards ADD COLUMN ad_views INTEGER DEFAULT 0;  -- 廣告開始播放次數
ALTER TABLE ad_rewards ADD COLUMN ad_completions INTEGER DEFAULT 0;  -- 廣告完整播放次數
```

#### **更新 daily_stats 表**
```sql
-- 添加廣告統計字段到 daily_stats
ALTER TABLE daily_stats ADD COLUMN total_ad_views INTEGER DEFAULT 0;  -- 當日廣告觀看次數
ALTER TABLE daily_stats ADD COLUMN total_ad_completions INTEGER DEFAULT 0;  -- 當日廣告完成次數
ALTER TABLE daily_stats ADD COLUMN ad_completion_rate REAL DEFAULT 0.0;  -- 廣告完成率
ALTER TABLE daily_stats ADD COLUMN total_ad_quota_earned INTEGER DEFAULT 0;  -- 廣告獲得的總額度
```

---

### **Migration 腳本**

#### **文件：`src/db/migrations/0023_add_ad_statistics.sql`**

```sql
-- Migration: 0023_add_ad_statistics.sql
-- Add ad statistics tracking to ad_rewards and daily_stats tables

-- Add statistics to ad_rewards table
ALTER TABLE ad_rewards ADD COLUMN ad_views INTEGER DEFAULT 0;
ALTER TABLE ad_rewards ADD COLUMN ad_completions INTEGER DEFAULT 0;

-- Add ad statistics to daily_stats table
ALTER TABLE daily_stats ADD COLUMN total_ad_views INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN total_ad_completions INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN ad_completion_rate REAL DEFAULT 0.0;
ALTER TABLE daily_stats ADD COLUMN total_ad_quota_earned INTEGER DEFAULT 0;
```

---

### **Domain 邏輯更新**

#### **更新：`src/domain/ad_reward.ts`**

```typescript
/**
 * Calculate ad completion rate
 */
export function calculateAdCompletionRate(
  completions: number,
  views: number
): number {
  if (views === 0) return 0;
  return Math.round((completions / views) * 100 * 100) / 100; // 保留兩位小數
}

/**
 * Ad statistics interface
 */
export interface AdStatistics {
  total_views: number;
  total_completions: number;
  completion_rate: number;
  total_quota_earned: number;
  unique_users: number;
}
```

---

### **數據庫查詢更新**

#### **更新：`src/db/queries/ad_rewards.ts`**

```typescript
/**
 * Increment ad view count (when user clicks watch ad)
 */
export async function incrementAdView(
  db: DatabaseClient,
  telegramId: string
): Promise<void> {
  const today = getTodayDateString();
  
  await db.d1
    .prepare(
      `UPDATE ad_rewards 
       SET ad_views = ad_views + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE telegram_id = ? AND reward_date = ?`
    )
    .bind(telegramId, today)
    .run();
}

/**
 * Increment ad completion count (when ad finishes successfully)
 */
export async function incrementAdCompletion(
  db: DatabaseClient,
  telegramId: string
): Promise<void> {
  const today = getTodayDateString();
  
  await db.d1
    .prepare(
      `UPDATE ad_rewards 
       SET ad_completions = ad_completions + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE telegram_id = ? AND reward_date = ?`
    )
    .bind(telegramId, today)
    .run();
}

/**
 * Get today's ad statistics
 */
export async function getTodayAdStatistics(
  db: DatabaseClient
): Promise<AdStatistics> {
  const today = getTodayDateString();
  
  const result = await db.d1
    .prepare(
      `SELECT 
         SUM(ad_views) as total_views,
         SUM(ad_completions) as total_completions,
         SUM(quota_earned) as total_quota_earned,
         COUNT(DISTINCT telegram_id) as unique_users
       FROM ad_rewards
       WHERE reward_date = ?`
    )
    .bind(today)
    .first<{
      total_views: number;
      total_completions: number;
      total_quota_earned: number;
      unique_users: number;
    }>();
  
  const views = result?.total_views || 0;
  const completions = result?.total_completions || 0;
  const completionRate = calculateAdCompletionRate(completions, views);
  
  return {
    total_views: views,
    total_completions: completions,
    completion_rate: completionRate,
    total_quota_earned: result?.total_quota_earned || 0,
    unique_users: result?.unique_users || 0,
  };
}
```

---

### **Handler 更新**

#### **更新：`src/telegram/handlers/ad_reward.ts`**

```typescript
/**
 * Handle watch ad callback
 */
export async function handleWatchAd(
  callbackQuery: CallbackQuery,
  env: Env
): Promise<void> {
  // ... (existing code)

  try {
    // ... (existing checks)

    // ✨ NEW: Increment ad view count
    await incrementAdView(db, telegramId);

    // Answer callback first
    await telegram.answerCallbackQuery(callbackQuery.id, '📺 正在加載廣告...');

    // ... (rest of the code)
  } catch (error) {
    // ... (error handling)
  }
}

/**
 * Handle ad completion webhook
 */
export async function handleAdComplete(
  telegramId: string,
  token: string,
  env: Env
): Promise<{ success: boolean; message: string }> {
  const db = createDatabaseClient(env.DB);

  try {
    // ... (existing validation)

    // ✨ NEW: Increment ad completion count
    await incrementAdCompletion(db, telegramId);

    // Increment ad reward (quota)
    const updated = await incrementAdReward(db, telegramId);

    // ... (rest of the code)
  } catch (error) {
    // ... (error handling)
  }
}
```

---

### **每日統計報表更新**

#### **更新：`src/domain/stats.ts`**

```typescript
/**
 * Calculate daily stats including ad statistics
 */
export async function calculateDailyStats(db: DatabaseClient): Promise<DailyStats> {
  const yesterday = getYesterdayDateString();
  
  // ... (existing stats calculations)

  // ✨ NEW: Get ad statistics
  const adStats = await getTodayAdStatistics(db);
  
  return {
    // ... (existing fields)
    
    // Ad statistics
    total_ad_views: adStats.total_views,
    total_ad_completions: adStats.total_completions,
    ad_completion_rate: adStats.completion_rate,
    total_ad_quota_earned: adStats.total_quota_earned,
  };
}

/**
 * Format daily stats report with ad statistics
 */
export function formatDailyStatsReport(stats: DailyStats): string {
  return (
    `📊 **每日數據報表**\n` +
    `📅 日期：${stats.stat_date}\n\n` +
    
    `**用戶數據**\n` +
    `• 新增用戶：${stats.new_users} 人\n` +
    `• 活躍用戶：${stats.active_users} 人\n` +
    `• VIP 用戶：${stats.vip_users} 人\n\n` +
    
    `**漂流瓶數據**\n` +
    `• 丟出：${stats.bottles_thrown} 個\n` +
    `• 撿起：${stats.bottles_caught} 個\n` +
    `• 對話訊息：${stats.conversation_messages} 則\n\n` +
    
    `**📺 廣告數據**\n` +
    `• 觀看次數：${stats.total_ad_views} 次\n` +
    `• 完成次數：${stats.total_ad_completions} 次\n` +
    `• 完成率：${stats.ad_completion_rate}%\n` +
    `• 獲得額度：${stats.total_ad_quota_earned} 個\n\n` +
    
    `**邀請數據**\n` +
    `• 新增邀請：${stats.invites_created} 個\n` +
    `• 激活邀請：${stats.invites_activated} 個\n\n` +
    
    `**風控數據**\n` +
    `• 舉報：${stats.reports_created} 次\n` +
    `• 封禁：${stats.users_banned} 人`
  );
}
```

---

### **Schema 更新**

#### **更新：`src/db/schema.sql`**

```sql
-- ============================================================================
-- Ad Rewards Table (廣告獎勵)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ad_rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT NOT NULL,
  reward_date TEXT NOT NULL,  -- YYYY-MM-DD
  ads_watched INTEGER DEFAULT 0,  -- 當天已看廣告數 (0-20)
  quota_earned INTEGER DEFAULT 0,  -- 當天廣告獲得的額度 (0-20)
  ad_views INTEGER DEFAULT 0,  -- 廣告開始播放次數
  ad_completions INTEGER DEFAULT 0,  -- 廣告完整播放次數
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(telegram_id, reward_date)
);

CREATE INDEX IF NOT EXISTS idx_ad_rewards_telegram_date 
  ON ad_rewards(telegram_id, reward_date);
CREATE INDEX IF NOT EXISTS idx_ad_rewards_date 
  ON ad_rewards(reward_date);

-- ============================================================================
-- Daily Stats Table (每日統計)
-- ============================================================================
CREATE TABLE IF NOT EXISTS daily_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stat_date TEXT NOT NULL UNIQUE,  -- YYYY-MM-DD
  
  -- User stats
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  vip_users INTEGER DEFAULT 0,
  
  -- Bottle stats
  bottles_thrown INTEGER DEFAULT 0,
  bottles_caught INTEGER DEFAULT 0,
  conversation_messages INTEGER DEFAULT 0,
  
  -- Ad stats
  total_ad_views INTEGER DEFAULT 0,
  total_ad_completions INTEGER DEFAULT 0,
  ad_completion_rate REAL DEFAULT 0.0,
  total_ad_quota_earned INTEGER DEFAULT 0,
  
  -- Invite stats
  invites_created INTEGER DEFAULT 0,
  invites_activated INTEGER DEFAULT 0,
  
  -- Moderation stats
  reports_created INTEGER DEFAULT 0,
  users_banned INTEGER DEFAULT 0,
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(stat_date);
```

---

### **管理員命令**

#### **新增命令：`/ad_stats`**

**文件：`src/telegram/handlers/admin_stats.ts`**（新建）

```typescript
/**
 * Admin Stats Handler
 * Show ad statistics to super admin
 */

import type { Env, TelegramMessage } from '~/types';
import { createDatabaseClient } from '~/db/client';
import { createTelegramService } from '~/services/telegram';
import { getTodayAdStatistics } from '~/db/queries/ad_rewards';
import { isSuperAdmin } from './admin_ban';

/**
 * Handle /ad_stats command
 */
export async function handleAdStats(
  message: TelegramMessage,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // Check if super admin
    if (!isSuperAdmin(telegramId, env)) {
      await telegram.sendMessage(chatId, '❌ 只有超級管理員可以使用此命令。');
      return;
    }

    // Get today's ad statistics
    const stats = await getTodayAdStatistics(db);

    // Format message
    const message =
      `📺 **今日廣告統計**\n\n` +
      `**觀看數據**\n` +
      `• 觀看次數：${stats.total_views} 次\n` +
      `• 完成次數：${stats.total_completions} 次\n` +
      `• 完成率：${stats.completion_rate}%\n\n` +
      `**獎勵數據**\n` +
      `• 發放額度：${stats.total_quota_earned} 個\n` +
      `• 參與用戶：${stats.unique_users} 人\n\n` +
      `**平均數據**\n` +
      `• 人均觀看：${stats.unique_users > 0 ? (stats.total_views / stats.unique_users).toFixed(2) : 0} 次\n` +
      `• 人均完成：${stats.unique_users > 0 ? (stats.total_completions / stats.unique_users).toFixed(2) : 0} 次\n\n` +
      `💡 查看完整報表：/daily_stats`;

    await telegram.sendMessage(chatId, message);
  } catch (error) {
    console.error('[handleAdStats] Error:', error);
    await telegram.sendMessage(chatId, '❌ 獲取廣告統計失敗');
  }
}
```

---

### **Router 集成**

#### **更新：`src/router.ts`**

```typescript
// Ad stats command (Super Admin only)
if (text === '/ad_stats') {
  const adminBanModule = await import('./telegram/handlers/admin_ban');
  if (!adminBanModule.isSuperAdmin(telegramId, env)) {
    await telegram.sendMessage(chatId, '❌ 只有超級管理員可以使用此命令。');
    return;
  }
  const { handleAdStats } = await import('./telegram/handlers/admin_stats');
  await handleAdStats(message, env);
  return;
}
```

---

### **Help 命令更新**

#### **更新：`src/telegram/handlers/help.ts`**

```typescript
// Add super admin commands (only for super admin)
if (isUserSuperAdmin) {
  helpMessage += 
    `\n\n🔱 **超級管理員功能**\n` +
    `**管理員管理：**\n` +
    `/admin_list - 查看管理員列表\n` +
    `/admin_add <user_id> - 添加管理員\n` +
    `/admin_remove <user_id> - 移除管理員\n\n` +
    `**廣播系統：**\n` +
    `/broadcast <訊息> - 群發給所有用戶\n` +
    `/broadcast_vip <訊息> - 群發給 VIP 用戶\n` +
    `/broadcast_non_vip <訊息> - 群發給非 VIP 用戶\n\n` +
    `**統計報表：**\n` +
    `/daily_stats - 查看每日統計\n` +
    `/ad_stats - 查看廣告統計\n\n` +  // ✨ NEW
    `**維護模式：**\n` +
    `/maintenance_enable <分鐘> <訊息> - 啟用維護模式\n` +
    `/maintenance_disable - 關閉維護模式\n\n` +
    `**開發工具：**\n` +
    `/dev_info - 系統信息\n` +
    `/dev_reset - 重置帳號（測試用）\n` +
    `/dev_restart - 完全重置帳號`;
}
```

---

## ✅ **廣告統計實現檢查清單**

### **Phase 1: 數據庫**
- [ ] 創建 Migration `0023_add_ad_statistics.sql`
- [ ] 執行 Migration
- [ ] 更新 `src/db/schema.sql`

### **Phase 2: Domain & Queries**
- [ ] 更新 `src/domain/ad_reward.ts` 添加統計函數
- [ ] 更新 `src/db/queries/ad_rewards.ts` 添加統計查詢
- [ ] 更新 `src/domain/stats.ts` 集成廣告統計

### **Phase 3: Handler**
- [ ] 更新 `src/telegram/handlers/ad_reward.ts` 記錄統計
- [ ] 創建 `src/telegram/handlers/admin_stats.ts`
- [ ] 更新 `src/router.ts` 添加 `/ad_stats` 路由
- [ ] 更新 `src/telegram/handlers/help.ts`

### **Phase 4: 測試**
- [ ] 測試廣告觀看統計
- [ ] 測試廣告完成統計
- [ ] 測試每日報表包含廣告數據
- [ ] 測試 `/ad_stats` 命令

---

## 📊 **統計報表示例**

### **每日統計報表（發送給超級管理員）**
```
📊 **每日數據報表**
📅 日期：2025-01-18

**用戶數據**
• 新增用戶：45 人
• 活躍用戶：328 人
• VIP 用戶：23 人

**漂流瓶數據**
• 丟出：892 個
• 撿起：856 個
• 對話訊息：1,234 則

**📺 廣告數據**
• 觀看次數：156 次
• 完成次數：142 次
• 完成率：91.03%
• 獲得額度：142 個

**邀請數據**
• 新增邀請：12 個
• 激活邀請：8 個

**風控數據**
• 舉報：3 次
• 封禁：1 人
```

### **實時廣告統計（`/ad_stats`）**
```
📺 **今日廣告統計**

**觀看數據**
• 觀看次數：156 次
• 完成次數：142 次
• 完成率：91.03%

**獎勵數據**
• 發放額度：142 個
• 參與用戶：89 人

**平均數據**
• 人均觀看：1.75 次
• 人均完成：1.60 次

💡 查看完整報表：/daily_stats
```

---

**廣告統計系統設計完成！** 🎉

---

## 🔄 **多廣告商支持設計**

### **需求**
- 支持切換多個廣告商（GigaPub、Google AdSense、Unity Ads 等）
- 可配置廣告商優先級和權重
- 自動 Fallback 機制
- 統計不同廣告商的表現

---

### **數據庫設計**

#### **新增表：ad_providers**
```sql
-- Migration: 0024_create_ad_providers_table.sql
-- Support multiple ad providers with priority and fallback

CREATE TABLE IF NOT EXISTS ad_providers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_name TEXT NOT NULL UNIQUE,  -- 'gigapub', 'google_adsense', 'unity_ads', etc.
  provider_display_name TEXT NOT NULL,  -- 'GigaPub', 'Google AdSense', 'Unity Ads'
  is_enabled INTEGER DEFAULT 1,  -- 是否啟用
  priority INTEGER DEFAULT 0,  -- 優先級（數字越大越優先）
  weight INTEGER DEFAULT 100,  -- 權重（用於負載均衡）
  
  -- Configuration (JSON)
  config TEXT,  -- JSON string: {"project_id": "xxx", "api_key": "xxx", ...}
  
  -- Script URLs
  script_url TEXT,  -- 主要腳本 URL
  fallback_script_urls TEXT,  -- 備用腳本 URLs (JSON array)
  
  -- Statistics
  total_requests INTEGER DEFAULT 0,  -- 總請求次數
  total_views INTEGER DEFAULT 0,  -- 總觀看次數
  total_completions INTEGER DEFAULT 0,  -- 總完成次數
  total_errors INTEGER DEFAULT 0,  -- 總錯誤次數
  completion_rate REAL DEFAULT 0.0,  -- 完成率
  
  -- Status
  last_error TEXT,  -- 最後一次錯誤
  last_error_at TEXT,  -- 最後錯誤時間
  last_success_at TEXT,  -- 最後成功時間
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ad_providers_enabled ON ad_providers(is_enabled);
CREATE INDEX IF NOT EXISTS idx_ad_providers_priority ON ad_providers(priority DESC);
```

#### **更新表：ad_rewards**
```sql
-- Add provider tracking to ad_rewards
ALTER TABLE ad_rewards ADD COLUMN provider_name TEXT DEFAULT 'gigapub';  -- 記錄使用的廣告商
```

#### **新增表：ad_provider_logs**
```sql
-- Detailed logs for each ad request
CREATE TABLE IF NOT EXISTS ad_provider_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  request_date TEXT NOT NULL,  -- YYYY-MM-DD HH:MM:SS
  
  -- Request info
  request_type TEXT NOT NULL,  -- 'view' or 'completion'
  
  -- Result
  status TEXT NOT NULL,  -- 'success', 'error', 'timeout'
  error_message TEXT,
  response_time_ms INTEGER,  -- 響應時間（毫秒）
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ad_provider_logs_telegram ON ad_provider_logs(telegram_id);
CREATE INDEX IF NOT EXISTS idx_ad_provider_logs_provider ON ad_provider_logs(provider_name);
CREATE INDEX IF NOT EXISTS idx_ad_provider_logs_date ON ad_provider_logs(request_date);
```

---

### **Domain 邏輯**

#### **文件：`src/domain/ad_provider.ts`**（新建）

```typescript
/**
 * Ad Provider Domain Logic
 * Manages multiple ad providers with priority and fallback
 */

export interface AdProvider {
  id: number;
  provider_name: string;
  provider_display_name: string;
  is_enabled: boolean;
  priority: number;
  weight: number;
  config: string;
  script_url: string;
  fallback_script_urls: string;
  total_requests: number;
  total_views: number;
  total_completions: number;
  total_errors: number;
  completion_rate: number;
  last_error?: string;
  last_error_at?: string;
  last_success_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AdProviderConfig {
  project_id?: string;
  api_key?: string;
  app_id?: string;
  placement_id?: string;
  [key: string]: any;
}

export interface AdProviderSelection {
  provider: AdProvider;
  fallback_providers: AdProvider[];
}

/**
 * Provider selection strategy
 */
export type ProviderSelectionStrategy = 'priority' | 'weighted_random' | 'round_robin';

/**
 * Select ad provider based on strategy
 */
export function selectAdProvider(
  providers: AdProvider[],
  strategy: ProviderSelectionStrategy = 'weighted_random'
): AdProviderSelection | null {
  // Filter enabled providers
  const enabled = providers.filter(p => p.is_enabled);
  
  if (enabled.length === 0) {
    return null;
  }
  
  let primary: AdProvider;
  
  switch (strategy) {
    case 'priority':
      primary = selectByPriority(enabled);
      break;
    case 'weighted_random':
      primary = selectByWeightedRandom(enabled);
      break;
    case 'round_robin':
      primary = selectByRoundRobin(enabled);
      break;
    default:
      primary = selectByWeightedRandom(enabled);
  }
  
  // Fallback providers (rest of the list, sorted by priority)
  const fallbacks = enabled
    .filter(p => p.id !== primary.id)
    .sort((a, b) => b.priority - a.priority);
  
  return {
    provider: primary,
    fallback_providers: fallbacks,
  };
}

/**
 * Select provider by priority (highest priority first)
 */
function selectByPriority(providers: AdProvider[]): AdProvider {
  return providers.sort((a, b) => {
    // First by priority
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    // Then by completion rate
    return b.completion_rate - a.completion_rate;
  })[0];
}

/**
 * Select provider by weighted random (based on weight)
 * 
 * Example:
 * - Provider A: weight 70 → 70% chance
 * - Provider B: weight 20 → 20% chance
 * - Provider C: weight 10 → 10% chance
 */
function selectByWeightedRandom(providers: AdProvider[]): AdProvider {
  // Calculate total weight
  const totalWeight = providers.reduce((sum, p) => sum + p.weight, 0);
  
  if (totalWeight === 0) {
    // If all weights are 0, use priority
    return selectByPriority(providers);
  }
  
  // Generate random number between 0 and totalWeight
  const random = Math.random() * totalWeight;
  
  // Select provider based on weighted random
  let cumulativeWeight = 0;
  for (const provider of providers) {
    cumulativeWeight += provider.weight;
    if (random <= cumulativeWeight) {
      return provider;
    }
  }
  
  // Fallback (should never reach here)
  return providers[0];
}

/**
 * Select provider by round-robin (rotate through providers)
 * 
 * This requires tracking the last used provider index
 * For simplicity, we'll use a hash of current timestamp
 */
function selectByRoundRobin(providers: AdProvider[]): AdProvider {
  // Sort by priority to ensure consistent order
  const sorted = providers.sort((a, b) => b.priority - a.priority);
  
  // Use current second to rotate
  const index = Math.floor(Date.now() / 1000) % sorted.length;
  
  return sorted[index];
}

/**
 * Calculate provider completion rate
 */
export function calculateProviderCompletionRate(
  completions: number,
  views: number
): number {
  if (views === 0) return 0;
  return Math.round((completions / views) * 100 * 100) / 100;
}

/**
 * Parse provider config from JSON string
 */
export function parseProviderConfig(configJson: string): AdProviderConfig {
  try {
    return JSON.parse(configJson);
  } catch {
    return {};
  }
}

/**
 * Parse fallback URLs from JSON string
 */
export function parseFallbackUrls(urlsJson: string): string[] {
  try {
    return JSON.parse(urlsJson);
  } catch {
    return [];
  }
}

/**
 * Check if provider is healthy (low error rate)
 */
export function isProviderHealthy(provider: AdProvider): boolean {
  const totalAttempts = provider.total_views + provider.total_errors;
  if (totalAttempts === 0) return true;
  
  const errorRate = provider.total_errors / totalAttempts;
  
  // Healthy if error rate < 20%
  return errorRate < 0.2;
}
```

---

### **數據庫查詢**

#### **文件：`src/db/queries/ad_providers.ts`**（新建）

```typescript
/**
 * Ad Providers Database Queries
 */

import type { DatabaseClient } from '../client';
import type { AdProvider } from '~/domain/ad_provider';

/**
 * Get all ad providers
 */
export async function getAllAdProviders(
  db: DatabaseClient
): Promise<AdProvider[]> {
  const result = await db.d1
    .prepare(`SELECT * FROM ad_providers ORDER BY priority DESC, completion_rate DESC`)
    .all<AdProvider>();
  
  return result.results || [];
}

/**
 * Get enabled ad providers
 */
export async function getEnabledAdProviders(
  db: DatabaseClient
): Promise<AdProvider[]> {
  const result = await db.d1
    .prepare(`SELECT * FROM ad_providers WHERE is_enabled = 1 ORDER BY priority DESC`)
    .all<AdProvider>();
  
  return result.results || [];
}

/**
 * Get ad provider by name
 */
export async function getAdProviderByName(
  db: DatabaseClient,
  providerName: string
): Promise<AdProvider | null> {
  const result = await db.d1
    .prepare(`SELECT * FROM ad_providers WHERE provider_name = ?`)
    .bind(providerName)
    .first<AdProvider>();
  
  return result || null;
}

/**
 * Update provider statistics
 */
export async function updateProviderStats(
  db: DatabaseClient,
  providerName: string,
  stats: {
    total_requests?: number;
    total_views?: number;
    total_completions?: number;
    total_errors?: number;
  }
): Promise<void> {
  const updates: string[] = [];
  const bindings: any[] = [];
  
  if (stats.total_requests !== undefined) {
    updates.push('total_requests = total_requests + ?');
    bindings.push(stats.total_requests);
  }
  if (stats.total_views !== undefined) {
    updates.push('total_views = total_views + ?');
    bindings.push(stats.total_views);
  }
  if (stats.total_completions !== undefined) {
    updates.push('total_completions = total_completions + ?');
    bindings.push(stats.total_completions);
  }
  if (stats.total_errors !== undefined) {
    updates.push('total_errors = total_errors + ?');
    bindings.push(stats.total_errors);
  }
  
  if (updates.length === 0) return;
  
  // Calculate new completion rate
  updates.push('completion_rate = ROUND((total_completions * 1.0 / NULLIF(total_views, 0)) * 100, 2)');
  updates.push('updated_at = CURRENT_TIMESTAMP');
  
  bindings.push(providerName);
  
  await db.d1
    .prepare(
      `UPDATE ad_providers 
       SET ${updates.join(', ')}
       WHERE provider_name = ?`
    )
    .bind(...bindings)
    .run();
}

/**
 * Log provider request
 */
export async function logProviderRequest(
  db: DatabaseClient,
  log: {
    telegram_id: string;
    provider_name: string;
    request_type: 'view' | 'completion';
    status: 'success' | 'error' | 'timeout';
    error_message?: string;
    response_time_ms?: number;
  }
): Promise<void> {
  await db.d1
    .prepare(
      `INSERT INTO ad_provider_logs 
       (telegram_id, provider_name, request_date, request_type, status, error_message, response_time_ms)
       VALUES (?, ?, datetime('now'), ?, ?, ?, ?)`
    )
    .bind(
      log.telegram_id,
      log.provider_name,
      log.request_type,
      log.status,
      log.error_message || null,
      log.response_time_ms || null
    )
    .run();
}

/**
 * Update provider error status
 */
export async function updateProviderError(
  db: DatabaseClient,
  providerName: string,
  errorMessage: string
): Promise<void> {
  await db.d1
    .prepare(
      `UPDATE ad_providers 
       SET last_error = ?,
           last_error_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE provider_name = ?`
    )
    .bind(errorMessage, providerName)
    .run();
}

/**
 * Update provider success status
 */
export async function updateProviderSuccess(
  db: DatabaseClient,
  providerName: string
): Promise<void> {
  await db.d1
    .prepare(
      `UPDATE ad_providers 
       SET last_success_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE provider_name = ?`
    )
    .bind(providerName)
    .run();
}
```

---

### **廣告頁面更新**

#### **更新：`public/ad.html`**

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>觀看廣告 - XunNi</title>
  
  <!-- Dynamic Ad Provider Script Loading -->
  <script id="ad-loader">
    // Get provider info from URL
    const params = new URLSearchParams(window.location.search);
    const provider = params.get('provider') || 'gigapub';
    const config = params.get('config');
    
    // Load provider script dynamically
    async function loadAdProvider() {
      try {
        // Fetch provider configuration
        const response = await fetch(`/api/ad-provider/${provider}`);
        const providerData = await response.json();
        
        if (!providerData.success) {
          throw new Error(providerData.message || 'Failed to load provider');
        }
        
        // Load primary script
        await loadScript(providerData.script_url, providerData.config);
        
        // Store fallback scripts for later use
        window.adFallbackScripts = providerData.fallback_scripts || [];
        window.currentProviderIndex = 0;
        
      } catch (error) {
        console.error('Failed to load ad provider:', error);
        document.getElementById('status').textContent = '❌ 廣告服務加載失敗';
        document.getElementById('watchBtn').disabled = true;
      }
    }
    
    // Load script with timeout and fallback
    function loadScript(url, config) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        
        // Add configuration attributes
        if (config) {
          Object.keys(config).forEach(key => {
            script.setAttribute(`data-${key}`, config[key]);
          });
        }
        
        script.async = true;
        script.src = url;
        
        const timeout = setTimeout(() => {
          script.onload = script.onerror = null;
          reject(new Error('Script load timeout'));
        }, 15000);
        
        script.onload = () => {
          clearTimeout(timeout);
          resolve();
        };
        
        script.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Script load error'));
        };
        
        document.head.appendChild(script);
      });
    }
    
    // Initialize on page load
    loadAdProvider();
  </script>
  
  <style>
    /* ... (existing styles) ... */
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📺</div>
    <h1>觀看廣告獲得額度</h1>
    <p>觀看完整廣告後，你將獲得 +1 漂流瓶額度</p>
    <button id="watchBtn" onclick="watchAd()">▶️ 開始觀看</button>
    <div id="status" class="status"></div>
  </div>

  <script>
    // Get URL parameters
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('user');
    const token = params.get('token');
    const provider = params.get('provider') || 'gigapub';

    if (!userId || !token) {
      document.getElementById('status').textContent = '❌ 無效的鏈接';
      document.getElementById('watchBtn').disabled = true;
    }

    // Universal ad watch function with fallback support
    async function watchAd() {
      const btn = document.getElementById('watchBtn');
      const status = document.getElementById('status');
      
      btn.disabled = true;
      status.textContent = '📺 正在加載廣告...';

      try {
        // Try to show ad based on provider
        await showAdByProvider(provider);
        
        // Ad completed successfully
        status.textContent = '✅ 廣告播放完成，正在發放獎勵...';
        
        // Notify backend
        await notifyAdComplete(provider);
        
      } catch (error) {
        console.error('Ad error:', error);
        
        // Try fallback providers
        if (window.adFallbackScripts && window.adFallbackScripts.length > 0) {
          status.textContent = '⏳ 嘗試備用廣告源...';
          await tryFallbackProviders();
        } else {
          status.textContent = `❌ ${error.message || '廣告播放失敗，請稍後再試'}`;
          btn.disabled = false;
        }
      }
    }
    
    // Show ad based on provider type
    async function showAdByProvider(providerName) {
      switch (providerName) {
        case 'gigapub':
          if (typeof window.showGiga !== 'function') {
            throw new Error('GigaPub 廣告服務未就緒');
          }
          await window.showGiga();
          break;
          
        case 'google_adsense':
          // Google AdSense implementation
          if (typeof window.adsbygoogle === 'undefined') {
            throw new Error('Google AdSense 未就緒');
          }
          await showGoogleAd();
          break;
          
        case 'unity_ads':
          // Unity Ads implementation
          if (typeof window.unityShowAd !== 'function') {
            throw new Error('Unity Ads 未就緒');
          }
          await window.unityShowAd();
          break;
          
        default:
          throw new Error('不支持的廣告提供商');
      }
    }
    
    // Try fallback providers
    async function tryFallbackProviders() {
      for (let i = 0; i < window.adFallbackScripts.length; i++) {
        try {
          const fallback = window.adFallbackScripts[i];
          await showAdByProvider(fallback.provider_name);
          await notifyAdComplete(fallback.provider_name);
          return; // Success
        } catch (error) {
          console.error(`Fallback ${i + 1} failed:`, error);
        }
      }
      
      // All fallbacks failed
      document.getElementById('status').textContent = '❌ 所有廣告源都無法使用，請稍後再試';
      document.getElementById('watchBtn').disabled = false;
    }
    
    // Notify backend of ad completion
    async function notifyAdComplete(usedProvider) {
      const response = await fetch('/api/ad-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          token: token,
          provider: usedProvider,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        document.getElementById('status').textContent = '🎉 恭喜！你獲得了 +1 額度';
        setTimeout(() => {
          if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.close();
          } else {
            window.close();
          }
        }, 2000);
      } else {
        throw new Error(result.message || '獎勵發放失敗');
      }
    }
    
    // Google AdSense specific implementation
    async function showGoogleAd() {
      return new Promise((resolve, reject) => {
        // Implementation depends on Google AdSense setup
        // This is a placeholder
        setTimeout(() => {
          resolve();
        }, 3000);
      });
    }
  </script>
</body>
</html>
```

---

### **API 端點更新**

#### **新增端點：`/api/ad-provider/:provider`**

```typescript
// In src/router.ts

// Get ad provider configuration
if (url.pathname.startsWith('/api/ad-provider/')) {
  const provider = url.pathname.split('/').pop();
  
  try {
    const { getAdProviderByName } = await import('./db/queries/ad_providers');
    const { parseProviderConfig, parseFallbackUrls } = await import('./domain/ad_provider');
    
    const db = createDatabaseClient(env.DB);
    const providerData = await getAdProviderByName(db, provider || '');
    
    if (!providerData || !providerData.is_enabled) {
      return new Response(
        JSON.stringify({ success: false, message: 'Provider not found or disabled' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const config = parseProviderConfig(providerData.config);
    const fallbackUrls = parseFallbackUrls(providerData.fallback_script_urls);
    
    return new Response(
      JSON.stringify({
        success: true,
        provider_name: providerData.provider_name,
        script_url: providerData.script_url,
        config: config,
        fallback_scripts: fallbackUrls,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

#### **更新端點：`/api/ad-complete`**

```typescript
// Handle ad completion webhook with provider tracking
if (url.pathname === '/api/ad-complete') {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await request.json() as { 
      user_id: string; 
      token: string; 
      provider?: string;  // ✨ NEW: Track which provider was used
    };
    
    const { handleAdComplete } = await import('./telegram/handlers/ad_reward');
    const result = await handleAdComplete(
      body.user_id, 
      body.token, 
      body.provider || 'gigapub',  // ✨ NEW: Pass provider name
      env
    );
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

---

### **Handler 更新**

#### **更新：`src/telegram/handlers/ad_reward.ts`**

```typescript
/**
 * Handle watch ad callback with provider selection
 */
export async function handleWatchAd(
  callbackQuery: CallbackQuery,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = callbackQuery.message!.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  try {
    // ... (existing checks)

    // ✨ NEW: Select best ad provider
    const { getEnabledAdProviders } = await import('~/db/queries/ad_providers');
    const { selectAdProvider } = await import('~/domain/ad_provider');
    
    const providers = await getEnabledAdProviders(db);
    const selection = selectAdProvider(providers);
    
    if (!selection) {
      await telegram.answerCallbackQuery(
        callbackQuery.id,
        '❌ 廣告服務暫時不可用'
      );
      await telegram.sendMessage(
        chatId,
        '📺 廣告服務暫時不可用\n\n' +
        '請稍後再試，或聯繫客服。'
      );
      return;
    }

    // ✨ NEW: Increment ad view count with provider tracking
    await incrementAdView(db, telegramId);
    
    // ✨ NEW: Log provider request
    const { logProviderRequest } = await import('~/db/queries/ad_providers');
    await logProviderRequest(db, {
      telegram_id: telegramId,
      provider_name: selection.provider.provider_name,
      request_type: 'view',
      status: 'success',
    });

    // Answer callback first
    await telegram.answerCallbackQuery(callbackQuery.id, '📺 正在加載廣告...');

    // Send ad page URL with provider info
    await telegram.editMessageText(
      chatId,
      loadingMsg.message_id,
      '📺 **觀看廣告獲得額度**\n\n' +
      `廣告提供：${selection.provider.provider_display_name}\n\n` +
      '點擊下方按鈕開始觀看廣告：',
      [
        [
          {
            text: '▶️ 開始觀看廣告',
            url: `https://your-domain.com/ad?user=${telegramId}&token=${generateAdToken(telegramId, env)}&provider=${selection.provider.provider_name}`
          }
        ],
        [
          { text: '❌ 取消', callback_data: 'cancel_ad' }
        ]
      ]
    );

  } catch (error) {
    console.error('[handleWatchAd] Error:', error);
    await telegram.answerCallbackQuery(
      callbackQuery.id,
      '❌ 加載廣告失敗，請稍後再試'
    );
  }
}

/**
 * Handle ad completion webhook with provider tracking
 */
export async function handleAdComplete(
  telegramId: string,
  token: string,
  providerName: string,  // ✨ NEW: Track provider
  env: Env
): Promise<{ success: boolean; message: string }> {
  const db = createDatabaseClient(env.DB);

  try {
    // ... (existing validation)

    // ✨ NEW: Increment ad completion count
    await incrementAdCompletion(db, telegramId);
    
    // ✨ NEW: Update provider statistics
    const { updateProviderStats, updateProviderSuccess, logProviderRequest } = 
      await import('~/db/queries/ad_providers');
    
    await updateProviderStats(db, providerName, {
      total_completions: 1,
    });
    
    await updateProviderSuccess(db, providerName);
    
    await logProviderRequest(db, {
      telegram_id: telegramId,
      provider_name: providerName,
      request_type: 'completion',
      status: 'success',
    });

    // Increment ad reward (quota)
    const updated = await incrementAdReward(db, telegramId);

    // ... (rest of the code)
  } catch (error) {
    // ✨ NEW: Log provider error
    const { updateProviderError, logProviderRequest } = 
      await import('~/db/queries/ad_providers');
    
    await updateProviderError(db, providerName, error instanceof Error ? error.message : 'Unknown error');
    
    await logProviderRequest(db, {
      telegram_id: telegramId,
      provider_name: providerName,
      request_type: 'completion',
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error',
    });
    
    // ... (error handling)
  }
}
```

---

### **管理員命令**

#### **新增命令：`/ad_providers`**

```typescript
/**
 * Handle /ad_providers command - List all ad providers
 */
export async function handleAdProviders(
  message: TelegramMessage,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();

  try {
    // Check if super admin
    if (!isSuperAdmin(telegramId, env)) {
      await telegram.sendMessage(chatId, '❌ 只有超級管理員可以使用此命令。');
      return;
    }

    // Get all providers
    const { getAllAdProviders } = await import('~/db/queries/ad_providers');
    const providers = await getAllAdProviders(db);

    if (providers.length === 0) {
      await telegram.sendMessage(chatId, '📺 尚未配置任何廣告提供商');
      return;
    }

    // Format message
    let message = '📺 **廣告提供商列表**\n\n';
    
    providers.forEach((provider, index) => {
      const status = provider.is_enabled ? '✅ 啟用' : '❌ 停用';
      const health = provider.completion_rate >= 80 ? '🟢' : provider.completion_rate >= 50 ? '🟡' : '🔴';
      
      message += 
        `**${index + 1}. ${provider.provider_display_name}** ${status}\n` +
        `• 優先級：${provider.priority}\n` +
        `• 完成率：${health} ${provider.completion_rate}%\n` +
        `• 總請求：${provider.total_requests} 次\n` +
        `• 總完成：${provider.total_completions} 次\n` +
        `• 總錯誤：${provider.total_errors} 次\n`;
      
      if (provider.last_success_at) {
        message += `• 最後成功：${provider.last_success_at}\n`;
      }
      
      if (provider.last_error_at) {
        message += `• 最後錯誤：${provider.last_error_at}\n`;
      }
      
      message += '\n';
    });

    await telegram.sendMessage(chatId, message);
  } catch (error) {
    console.error('[handleAdProviders] Error:', error);
    await telegram.sendMessage(chatId, '❌ 獲取廣告提供商列表失敗');
  }
}
```

---

### **初始化數據**

#### **文件：`scripts/init-ad-providers.sql`**

```sql
-- Initialize default ad providers

-- GigaPub (Primary)
INSERT INTO ad_providers (
  provider_name,
  provider_display_name,
  is_enabled,
  priority,
  weight,
  config,
  script_url,
  fallback_script_urls
) VALUES (
  'gigapub',
  'GigaPub',
  1,
  100,
  100,
  '{"project_id": "YOUR_PROJECT_ID"}',
  'https://ad.gigapub.tech/script',
  '["https://ru-ad.gigapub.tech/script"]'
);

-- Google AdSense (Fallback)
INSERT INTO ad_providers (
  provider_name,
  provider_display_name,
  is_enabled,
  0,  -- Disabled by default
  priority,
  80,
  weight,
  '{"client_id": "ca-pub-XXXXXXXXXXXXXXXX"}',
  'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
  '[]'
);

-- Unity Ads (Future)
INSERT INTO ad_providers (
  provider_name,
  provider_display_name,
  is_enabled,
  0,  -- Disabled by default
  priority,
  60,
  weight,
  '{"game_id": "YOUR_GAME_ID", "placement_id": "rewardedVideo"}',
  'https://cdn.unity3d.com/ads/webview/1.0/unity-ads.js',
  '[]'
);
```

---

## ✅ **多廣告商支持實現檢查清單**

### **Phase 1: 數據庫**
- [ ] 創建 Migration `0024_create_ad_providers_table.sql`
- [ ] 創建 Migration `0025_add_provider_to_ad_rewards.sql`
- [ ] 創建 Migration `0026_create_ad_provider_logs.sql`
- [ ] 執行 Migrations
- [ ] 初始化默認廣告提供商數據

### **Phase 2: Domain & Queries**
- [ ] 創建 `src/domain/ad_provider.ts`
- [ ] 創建 `src/db/queries/ad_providers.ts`

### **Phase 3: Handler & API**
- [ ] 更新 `src/telegram/handlers/ad_reward.ts` 支持多提供商
- [ ] 更新 `src/router.ts` 添加 `/api/ad-provider/:provider` 端點
- [ ] 更新 `src/router.ts` 更新 `/api/ad-complete` 支持提供商追蹤

### **Phase 4: 前端**
- [ ] 更新 `public/ad.html` 支持動態加載提供商
- [ ] 實現 Fallback 機制

### **Phase 5: 管理**
- [ ] 創建 `src/telegram/handlers/admin_ad_providers.ts`
- [ ] 添加 `/ad_providers` 命令
- [ ] 更新 `src/telegram/handlers/help.ts`

### **Phase 6: 測試**
- [ ] 測試 GigaPub 提供商
- [ ] 測試 Fallback 機制
- [ ] 測試提供商統計
- [ ] 測試提供商切換

---

## 📊 **多廣告商優勢**

### **1. 可靠性**
- ✅ 自動 Fallback 機制
- ✅ 多個備用廣告源
- ✅ 降低單點故障風險

### **2. 收益優化**
- ✅ 根據完成率選擇最佳提供商
- ✅ 支持 A/B 測試
- ✅ 最大化廣告收入

### **3. 靈活性**
- ✅ 輕鬆添加新廣告商
- ✅ 動態調整優先級
- ✅ 快速切換提供商

### **4. 數據驅動**
- ✅ 詳細的提供商統計
- ✅ 性能對比分析
- ✅ 錯誤追蹤

---

**多廣告商支持設計完成！** 🎉

---

## 🎯 **輪播和權重分配詳解**

### **三種選擇策略**

#### **1. Priority（優先級）**
- **邏輯**：始終選擇優先級最高的提供商
- **適用場景**：想要固定使用某個廣告商
- **示例**：
  ```
  Provider A: priority 100 → 始終選擇
  Provider B: priority 80  → 僅作為 Fallback
  Provider C: priority 60  → 僅作為 Fallback
  ```

#### **2. Weighted Random（權重隨機）** ⭐ **推薦**
- **邏輯**：根據權重隨機選擇，權重越高被選中機率越大
- **適用場景**：多個廣告商按比例輪播
- **示例**：
  ```
  Provider A: weight 70 → 70% 機率
  Provider B: weight 20 → 20% 機率
  Provider C: weight 10 → 10% 機率
  
  總權重 = 100
  每次隨機選擇，符合設定的比例
  ```

#### **3. Round Robin（輪詢）**
- **邏輯**：按順序輪流選擇提供商
- **適用場景**：平均分配流量
- **示例**：
  ```
  第 1 次請求 → Provider A
  第 2 次請求 → Provider B
  第 3 次請求 → Provider C
  第 4 次請求 → Provider A
  ...循環
  ```

---

### **配置示例**

#### **場景 1：主力 GigaPub，備用 Google**
```sql
-- GigaPub (主力 80%)
UPDATE ad_providers 
SET weight = 80, priority = 100, is_enabled = 1
WHERE provider_name = 'gigapub';

-- Google AdSense (備用 20%)
UPDATE ad_providers 
SET weight = 20, priority = 90, is_enabled = 1
WHERE provider_name = 'google_adsense';

-- 選擇策略：weighted_random
```

**效果**：
- 80% 的用戶看到 GigaPub 廣告
- 20% 的用戶看到 Google AdSense 廣告
- 如果 GigaPub 失敗，自動 Fallback 到 Google

---

#### **場景 2：三個廣告商平均輪播**
```sql
-- GigaPub
UPDATE ad_providers 
SET weight = 33, priority = 100, is_enabled = 1
WHERE provider_name = 'gigapub';

-- Google AdSense
UPDATE ad_providers 
SET weight = 33, priority = 100, is_enabled = 1
WHERE provider_name = 'google_adsense';

-- Unity Ads
UPDATE ad_providers 
SET weight = 34, priority = 100, is_enabled = 1
WHERE provider_name = 'unity_ads';

-- 選擇策略：weighted_random 或 round_robin
```

**效果**：
- 每個廣告商約 33% 流量
- 平均分配，測試不同廣告商效果

---

#### **場景 3：只用一個廣告商**
```sql
-- GigaPub (唯一啟用)
UPDATE ad_providers 
SET weight = 100, priority = 100, is_enabled = 1
WHERE provider_name = 'gigapub';

-- 其他全部停用
UPDATE ad_providers 
SET is_enabled = 0
WHERE provider_name != 'gigapub';

-- 選擇策略：任意
```

**效果**：
- 100% 使用 GigaPub
- 其他廣告商作為緊急備用

---

### **環境變數配置**

#### **添加到 `wrangler.toml`**
```toml
[env.staging.vars]
# ... existing vars ...
AD_PROVIDER_STRATEGY = "weighted_random"  # 'priority' | 'weighted_random' | 'round_robin'

[env.production.vars]
# ... existing vars ...
AD_PROVIDER_STRATEGY = "weighted_random"
```

---

### **Handler 更新**

#### **更新：`src/telegram/handlers/ad_reward.ts`**

```typescript
/**
 * Handle watch ad callback with configurable strategy
 */
export async function handleWatchAd(
  callbackQuery: CallbackQuery,
  env: Env
): Promise<void> {
  // ... (existing code)

  try {
    // ... (existing checks)

    // ✨ NEW: Get selection strategy from env
    const strategy = (env.AD_PROVIDER_STRATEGY || 'weighted_random') as ProviderSelectionStrategy;

    // ✨ NEW: Select best ad provider with strategy
    const { getEnabledAdProviders } = await import('~/db/queries/ad_providers');
    const { selectAdProvider } = await import('~/domain/ad_provider');
    
    const providers = await getEnabledAdProviders(db);
    const selection = selectAdProvider(providers, strategy);  // ✨ Pass strategy
    
    if (!selection) {
      await telegram.answerCallbackQuery(
        callbackQuery.id,
        '❌ 廣告服務暫時不可用'
      );
      return;
    }

    // Log selected provider and strategy
    console.log(`[handleWatchAd] Selected provider: ${selection.provider.provider_name} using strategy: ${strategy}`);

    // ... (rest of the code)
  } catch (error) {
    // ... (error handling)
  }
}
```

---

### **管理員命令更新**

#### **新增命令：`/ad_strategy <strategy>`**

```typescript
/**
 * Handle /ad_strategy command - Change provider selection strategy
 */
export async function handleAdStrategy(
  message: TelegramMessage,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();
  const text = message.text || '';

  try {
    // Check if super admin
    if (!isSuperAdmin(telegramId, env)) {
      await telegram.sendMessage(chatId, '❌ 只有超級管理員可以使用此命令。');
      return;
    }

    const parts = text.split(' ');
    
    // Show current strategy
    if (parts.length === 1) {
      const currentStrategy = env.AD_PROVIDER_STRATEGY || 'weighted_random';
      await telegram.sendMessage(
        chatId,
        `📺 **當前廣告選擇策略**\n\n` +
        `策略：${currentStrategy}\n\n` +
        `**可用策略：**\n` +
        `• \`priority\` - 優先級（固定選擇）\n` +
        `• \`weighted_random\` - 權重隨機（按比例）⭐\n` +
        `• \`round_robin\` - 輪詢（平均分配）\n\n` +
        `**修改策略：**\n` +
        `/ad_strategy <策略名稱>\n\n` +
        `**示例：**\n` +
        `/ad_strategy weighted_random`
      );
      return;
    }

    // Change strategy
    const newStrategy = parts[1];
    const validStrategies = ['priority', 'weighted_random', 'round_robin'];
    
    if (!validStrategies.includes(newStrategy)) {
      await telegram.sendMessage(
        chatId,
        `❌ 無效的策略：${newStrategy}\n\n` +
        `有效策略：priority, weighted_random, round_robin`
      );
      return;
    }

    // Note: Changing env vars at runtime is not directly supported
    // This would require updating wrangler.toml and redeploying
    await telegram.sendMessage(
      chatId,
      `⚠️ **策略修改說明**\n\n` +
      `要修改廣告選擇策略，請：\n\n` +
      `1. 更新 \`wrangler.toml\`：\n` +
      `\`\`\`\n` +
      `AD_PROVIDER_STRATEGY = "${newStrategy}"\n` +
      `\`\`\`\n\n` +
      `2. 重新部署：\n` +
      `\`\`\`\n` +
      `pnpm deploy:staging\n` +
      `\`\`\`\n\n` +
      `💡 未來可以考慮將策略存儲在數據庫中，實現動態切換。`
    );

  } catch (error) {
    console.error('[handleAdStrategy] Error:', error);
    await telegram.sendMessage(chatId, '❌ 處理命令失敗');
  }
}
```

---

### **權重調整命令**

#### **新增命令：`/ad_weight <provider> <weight>`**

```typescript
/**
 * Handle /ad_weight command - Adjust provider weight
 */
export async function handleAdWeight(
  message: TelegramMessage,
  env: Env
): Promise<void> {
  const telegram = createTelegramService(env);
  const db = createDatabaseClient(env.DB);
  const chatId = message.chat.id;
  const telegramId = message.from!.id.toString();
  const text = message.text || '';

  try {
    // Check if super admin
    if (!isSuperAdmin(telegramId, env)) {
      await telegram.sendMessage(chatId, '❌ 只有超級管理員可以使用此命令。');
      return;
    }

    const parts = text.split(' ');
    
    // Show usage
    if (parts.length < 3) {
      await telegram.sendMessage(
        chatId,
        `📺 **調整廣告商權重**\n\n` +
        `**使用方法：**\n` +
        `/ad_weight <提供商> <權重>\n\n` +
        `**示例：**\n` +
        `/ad_weight gigapub 70\n` +
        `/ad_weight google_adsense 30\n\n` +
        `💡 權重總和不需要等於 100，系統會自動計算比例。\n\n` +
        `**查看當前配置：**\n` +
        `/ad_providers`
      );
      return;
    }

    const providerName = parts[1];
    const weight = parseInt(parts[2]);

    if (isNaN(weight) || weight < 0 || weight > 1000) {
      await telegram.sendMessage(chatId, '❌ 權重必須是 0-1000 之間的數字');
      return;
    }

    // Update weight
    const result = await db.d1
      .prepare(
        `UPDATE ad_providers 
         SET weight = ?, updated_at = CURRENT_TIMESTAMP
         WHERE provider_name = ?`
      )
      .bind(weight, providerName)
      .run();

    if (result.meta.changes === 0) {
      await telegram.sendMessage(chatId, `❌ 找不到提供商：${providerName}`);
      return;
    }

    // Get updated provider info
    const { getAdProviderByName } = await import('~/db/queries/ad_providers');
    const provider = await getAdProviderByName(db, providerName);

    if (!provider) {
      await telegram.sendMessage(chatId, '❌ 更新失敗');
      return;
    }

    await telegram.sendMessage(
      chatId,
      `✅ **權重已更新**\n\n` +
      `提供商：${provider.provider_display_name}\n` +
      `新權重：${weight}\n\n` +
      `💡 新權重將在下次廣告請求時生效。\n\n` +
      `查看所有提供商：/ad_providers`
    );

  } catch (error) {
    console.error('[handleAdWeight] Error:', error);
    await telegram.sendMessage(chatId, '❌ 更新權重失敗');
  }
}
```

---

### **Router 集成**

```typescript
// In src/router.ts

// Ad strategy command (Super Admin only)
if (text === '/ad_strategy' || text.startsWith('/ad_strategy ')) {
  const adminBanModule = await import('./telegram/handlers/admin_ban');
  if (!adminBanModule.isSuperAdmin(telegramId, env)) {
    await telegram.sendMessage(chatId, '❌ 只有超級管理員可以使用此命令。');
    return;
  }
  const { handleAdStrategy } = await import('./telegram/handlers/admin_ad_providers');
  await handleAdStrategy(message, env);
  return;
}

// Ad weight command (Super Admin only)
if (text.startsWith('/ad_weight ')) {
  const adminBanModule = await import('./telegram/handlers/admin_ban');
  if (!adminBanModule.isSuperAdmin(telegramId, env)) {
    await telegram.sendMessage(chatId, '❌ 只有超級管理員可以使用此命令。');
    return;
  }
  const { handleAdWeight } = await import('./telegram/handlers/admin_ad_providers');
  await handleAdWeight(message, env);
  return;
}
```

---

### **Help 命令更新**

```typescript
// Add super admin commands
if (isUserSuperAdmin) {
  helpMessage += 
    `\n\n🔱 **超級管理員功能**\n` +
    // ... existing commands ...
    `**廣告管理：**\n` +
    `/ad_providers - 查看廣告商列表\n` +
    `/ad_stats - 查看廣告統計\n` +
    `/ad_strategy [策略] - 查看/修改選擇策略\n` +
    `/ad_weight <提供商> <權重> - 調整權重\n\n` +
    // ... other commands ...
}
```

---

## 📊 **實際效果演示**

### **測試 1：權重隨機（70:20:10）**

```sql
-- 配置
UPDATE ad_providers SET weight = 70 WHERE provider_name = 'gigapub';
UPDATE ad_providers SET weight = 20 WHERE provider_name = 'google_adsense';
UPDATE ad_providers SET weight = 10 WHERE provider_name = 'unity_ads';
```

**100 次請求結果（預期）：**
```
GigaPub:        █████████████████████████████████████████████████████████████████████ 70 次
Google AdSense: ████████████████████ 20 次
Unity Ads:      ██████████ 10 次
```

---

### **測試 2：輪詢（平均分配）**

```sql
-- 配置（權重不重要，因為使用 round_robin）
UPDATE ad_providers SET priority = 100 WHERE provider_name = 'gigapub';
UPDATE ad_providers SET priority = 100 WHERE provider_name = 'google_adsense';
UPDATE ad_providers SET priority = 100 WHERE provider_name = 'unity_ads';
```

**12 次請求結果：**
```
請求 1: GigaPub
請求 2: Google AdSense
請求 3: Unity Ads
請求 4: GigaPub
請求 5: Google AdSense
請求 6: Unity Ads
請求 7: GigaPub
請求 8: Google AdSense
請求 9: Unity Ads
請求 10: GigaPub
請求 11: Google AdSense
請求 12: Unity Ads
```

---

### **測試 3：優先級（固定選擇）**

```sql
-- 配置
UPDATE ad_providers SET priority = 100 WHERE provider_name = 'gigapub';
UPDATE ad_providers SET priority = 80 WHERE provider_name = 'google_adsense';
UPDATE ad_providers SET priority = 60 WHERE provider_name = 'unity_ads';
```

**100 次請求結果：**
```
GigaPub: ████████████████████████████████████████████████████████████████████████████████████████████████████ 100 次
Google AdSense: 0 次（僅作為 Fallback）
Unity Ads: 0 次（僅作為 Fallback）
```

---

## 🎯 **最佳實踐建議**

### **1. 初期測試階段**
```
策略：weighted_random
GigaPub: 50%
Google AdSense: 30%
Unity Ads: 20%

目的：測試不同廣告商的表現
```

### **2. 穩定運營階段**
```
策略：weighted_random
最佳廣告商: 70%
次佳廣告商: 20%
備用廣告商: 10%

目的：最大化收益，保留備用
```

### **3. 單一廣告商階段**
```
策略：priority
主力廣告商: priority 100
其他全部停用

目的：專注單一廣告商，簡化管理
```

---

## ✅ **更新的實現檢查清單**

### **Phase 1: Domain 邏輯**
- [ ] 更新 `src/domain/ad_provider.ts` 添加三種選擇策略
- [ ] 實現 `selectByPriority()`
- [ ] 實現 `selectByWeightedRandom()`
- [ ] 實現 `selectByRoundRobin()`

### **Phase 2: Handler**
- [ ] 更新 `src/telegram/handlers/ad_reward.ts` 支持策略參數
- [ ] 創建 `src/telegram/handlers/admin_ad_providers.ts`
- [ ] 實現 `/ad_strategy` 命令
- [ ] 實現 `/ad_weight` 命令

### **Phase 3: 配置**
- [ ] 添加 `AD_PROVIDER_STRATEGY` 到 `wrangler.toml`
- [ ] 更新 `src/router.ts` 添加新命令路由
- [ ] 更新 `src/telegram/handlers/help.ts`

### **Phase 4: 測試**
- [ ] 測試 Priority 策略
- [ ] 測試 Weighted Random 策略
- [ ] 測試 Round Robin 策略
- [ ] 測試權重調整命令
- [ ] 驗證統計數據準確性

---

**輪播和權重分配功能設計完成！** 🎉

---

## 🎯 **官方文字廣告系統** ⭐ **新增功能**

### **核心特點**

1. **點擊即獎勵**：無需等待視頻播放，點擊後立即 +1 額度
2. **一次性推送**：每個廣告只推送一次給每個用戶
3. **不計入限制**：不計入每日 20 次第三方廣告限制
4. **支持認證**：群組/頻道類型可要求加入後認證才發放獎勵
5. **靈活配置**：支持多種廣告類型和自定義獎勵額度
6. **永久額度**：官方廣告獎勵是永久額度（加到 invite_bonus），不是臨時的

---

### **廣告類型**

#### **1. Text（純文字公告）**
```typescript
{
  ad_type: 'text',
  title: '🎉 XunNi 新功能上線',
  content: '我們推出了全新的 VIP 功能，快來體驗吧！\n\n點擊此訊息即可獲得 +1 額度獎勵！',
  reward_quota: 1
}
```

**特點**：
- ✅ 純文字內容
- ✅ 點擊即獎勵
- ✅ 適合公告、活動通知

#### **2. Link（鏈接推廣）**
```typescript
{
  ad_type: 'link',
  title: '📱 下載 XunNi Mini App',
  content: '點擊下方按鈕下載我們的 Mini App，體驗更多功能！',
  url: 'https://t.me/xunni_bot/app',
  reward_quota: 1
}
```

**特點**：
- ✅ 帶鏈接按鈕
- ✅ 點擊鏈接後獎勵
- ✅ 適合推廣網站、Mini App

#### **3. Group（群組邀請）**
```typescript
{
  ad_type: 'group',
  title: '👥 加入 XunNi 官方群組',
  content: '加入我們的官方群組，與更多用戶交流！',
  url: 'https://t.me/xunni_group',
  target_entity_id: '-1001234567890',  // 群組 ID
  requires_verification: 1,  // 需要認證
  reward_quota: 2  // 加入群組獎勵 2 額度
}
```

**特點**：
- ✅ 邀請加入群組
- ✅ 可選認證（機器人檢查用戶是否在群組中）
- ✅ 獎勵更高（2 額度）

#### **4. Channel（頻道訂閱）**
```typescript
{
  ad_type: 'channel',
  title: '📢 訂閱 XunNi 官方頻道',
  content: '訂閱我們的官方頻道，第一時間獲取最新消息！',
  url: 'https://t.me/xunni_channel',
  target_entity_id: '@xunni_channel',  // 頻道 username
  requires_verification: 1,
  reward_quota: 2
}
```

**特點**：
- ✅ 邀請訂閱頻道
- ✅ 可選認證（機器人檢查用戶是否訂閱）
- ✅ 獎勵更高（2 額度）

---

### **數據庫 Migration**

#### **文件：`src/db/migrations/0027_create_official_ads.sql`**

```sql
-- Official Ads System
-- Allows XunNi to create text/link ads with instant rewards

-- Official ads table
CREATE TABLE IF NOT EXISTS official_ads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ad_type TEXT NOT NULL CHECK(ad_type IN ('text', 'link', 'group', 'channel')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  url TEXT,
  target_entity_id TEXT,
  reward_quota INTEGER DEFAULT 1 CHECK(reward_quota >= 1 AND reward_quota <= 10),
  is_enabled INTEGER DEFAULT 1,
  start_date TEXT,
  end_date TEXT,
  max_views INTEGER,
  current_views INTEGER DEFAULT 0,
  requires_verification INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_official_ads_enabled ON official_ads(is_enabled, start_date, end_date);
CREATE INDEX idx_official_ads_type ON official_ads(ad_type);

-- Official ad views table
CREATE TABLE IF NOT EXISTS official_ad_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT NOT NULL,
  ad_id INTEGER NOT NULL,
  viewed_at TEXT DEFAULT CURRENT_TIMESTAMP,
  clicked INTEGER DEFAULT 0,
  clicked_at TEXT,
  verified INTEGER DEFAULT 0,
  verified_at TEXT,
  reward_granted INTEGER DEFAULT 0,
  reward_granted_at TEXT,
  
  UNIQUE(telegram_id, ad_id),
  FOREIGN KEY (ad_id) REFERENCES official_ads(id) ON DELETE CASCADE
);

CREATE INDEX idx_official_ad_views_telegram ON official_ad_views(telegram_id);
CREATE INDEX idx_official_ad_views_ad ON official_ad_views(ad_id);
CREATE INDEX idx_official_ad_views_reward ON official_ad_views(reward_granted);
```

---

### **Domain 邏輯**

#### **文件：`src/domain/official_ad.ts`**（新建）

```typescript
/**
 * Official Ad Domain Logic
 * Manages XunNi's own text/link ads
 */

export interface OfficialAd {
  id: number;
  ad_type: 'text' | 'link' | 'group' | 'channel';
  title: string;
  content: string;
  url?: string;
  target_entity_id?: string;
  reward_quota: number;
  is_enabled: number;
  start_date?: string;
  end_date?: string;
  max_views?: number;
  current_views: number;
  requires_verification: number;
  created_at: string;
  updated_at: string;
}

export interface OfficialAdView {
  id: number;
  telegram_id: string;
  ad_id: number;
  viewed_at: string;
  clicked: number;
  clicked_at?: string;
  verified: number;
  verified_at?: string;
  reward_granted: number;
  reward_granted_at?: string;
}

/**
 * Check if ad is currently active
 */
export function isAdActive(ad: OfficialAd): boolean {
  if (!ad.is_enabled) return false;
  
  const now = new Date();
  
  // Check start date
  if (ad.start_date) {
    const startDate = new Date(ad.start_date);
    if (now < startDate) return false;
  }
  
  // Check end date
  if (ad.end_date) {
    const endDate = new Date(ad.end_date);
    if (now > endDate) return false;
  }
  
  // Check max views
  if (ad.max_views && ad.current_views >= ad.max_views) {
    return false;
  }
  
  return true;
}

/**
 * Check if user has already viewed this ad
 */
export function hasUserViewedAd(
  views: OfficialAdView[],
  telegramId: string,
  adId: number
): boolean {
  return views.some(v => v.telegram_id === telegramId && v.ad_id === adId);
}

/**
 * Check if ad requires verification
 */
export function requiresVerification(ad: OfficialAd): boolean {
  return ad.requires_verification === 1 && 
         (ad.ad_type === 'group' || ad.ad_type === 'channel');
}

/**
 * Get ad button text based on type
 */
export function getAdButtonText(ad: OfficialAd): string {
  switch (ad.ad_type) {
    case 'text':
      return `✨ 點擊領取 +${ad.reward_quota} 額度`;
    case 'link':
      return `🔗 查看詳情 (+${ad.reward_quota} 額度)`;
    case 'group':
      return `👥 加入群組 (+${ad.reward_quota} 額度)`;
    case 'channel':
      return `📢 訂閱頻道 (+${ad.reward_quota} 額度)`;
    default:
      return `領取獎勵`;
  }
}
```

---

### **數據庫查詢**

#### **文件：`src/db/queries/official_ads.ts`**（新建）

```typescript
/**
 * Official Ads Database Queries
 */

import type { DatabaseClient } from '../client';
import type { OfficialAd, OfficialAdView } from '~/domain/official_ad';
import { isAdActive } from '~/domain/official_ad';

/**
 * Get all active official ads
 */
export async function getActiveOfficialAds(
  db: DatabaseClient
): Promise<OfficialAd[]> {
  const results = await db.d1
    .prepare(
      `SELECT * FROM official_ads 
       WHERE is_enabled = 1
       ORDER BY created_at DESC`
    )
    .all<OfficialAd>();
  
  // Filter by date and max views
  return (results.results || []).filter(ad => isAdActive(ad));
}

/**
 * Get official ad by ID
 */
export async function getOfficialAdById(
  db: DatabaseClient,
  adId: number
): Promise<OfficialAd | null> {
  const result = await db.d1
    .prepare(`SELECT * FROM official_ads WHERE id = ?`)
    .bind(adId)
    .first<OfficialAd>();
  
  return result || null;
}

/**
 * Get ads not viewed by user
 */
export async function getUnviewedAdsForUser(
  db: DatabaseClient,
  telegramId: string
): Promise<OfficialAd[]> {
  const results = await db.d1
    .prepare(
      `SELECT oa.* FROM official_ads oa
       LEFT JOIN official_ad_views oav 
         ON oa.id = oav.ad_id AND oav.telegram_id = ?
       WHERE oa.is_enabled = 1
         AND oav.id IS NULL
       ORDER BY oa.created_at DESC`
    )
    .bind(telegramId)
    .all<OfficialAd>();
  
  return (results.results || []).filter(ad => isAdActive(ad));
}

/**
 * Record ad view
 */
export async function recordAdView(
  db: DatabaseClient,
  telegramId: string,
  adId: number
): Promise<void> {
  await db.d1
    .prepare(
      `INSERT OR IGNORE INTO official_ad_views 
       (telegram_id, ad_id, viewed_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)`
    )
    .bind(telegramId, adId)
    .run();
  
  // Increment view count
  await db.d1
    .prepare(
      `UPDATE official_ads 
       SET current_views = current_views + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(adId)
    .run();
}

/**
 * Record ad click and grant reward (for text/link types)
 */
export async function recordAdClick(
  db: DatabaseClient,
  telegramId: string,
  adId: number
): Promise<void> {
  await db.d1
    .prepare(
      `UPDATE official_ad_views 
       SET clicked = 1,
           clicked_at = CURRENT_TIMESTAMP,
           reward_granted = 1,
           reward_granted_at = CURRENT_TIMESTAMP
       WHERE telegram_id = ? AND ad_id = ?`
    )
    .bind(telegramId, adId)
    .run();
}

/**
 * Record verification and grant reward (for group/channel types)
 */
export async function recordAdVerification(
  db: DatabaseClient,
  telegramId: string,
  adId: number
): Promise<void> {
  await db.d1
    .prepare(
      `UPDATE official_ad_views 
       SET verified = 1,
           verified_at = CURRENT_TIMESTAMP,
           reward_granted = 1,
           reward_granted_at = CURRENT_TIMESTAMP
       WHERE telegram_id = ? AND ad_id = ?`
    )
    .bind(telegramId, adId)
    .run();
}

/**
 * Get ad view record
 */
export async function getAdView(
  db: DatabaseClient,
  telegramId: string,
  adId: number
): Promise<OfficialAdView | null> {
  const result = await db.d1
    .prepare(
      `SELECT * FROM official_ad_views 
       WHERE telegram_id = ? AND ad_id = ?`
    )
    .bind(telegramId, adId)
    .first<OfficialAdView>();
  
  return result || null;
}

/**
 * Create official ad (admin only)
 */
export async function createOfficialAd(
  db: DatabaseClient,
  ad: Omit<OfficialAd, 'id' | 'current_views' | 'created_at' | 'updated_at'>
): Promise<number> {
  const result = await db.d1
    .prepare(
      `INSERT INTO official_ads 
       (ad_type, title, content, url, target_entity_id, reward_quota, 
        is_enabled, start_date, end_date, max_views, requires_verification)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      ad.ad_type,
      ad.title,
      ad.content,
      ad.url || null,
      ad.target_entity_id || null,
      ad.reward_quota,
      ad.is_enabled,
      ad.start_date || null,
      ad.end_date || null,
      ad.max_views || null,
      ad.requires_verification
    )
    .run();
  
  return result.meta.last_row_id as number;
}
```

---

### **廣告輪播邏輯（優先顯示官方廣告）**

#### **更新：`src/telegram/handlers/ad_reward.ts`**

在用戶點擊「看廣告增加額度」時，優先展示官方廣告（如果有未看過的），然後才是第三方視頻廣告。

```typescript
/**
 * Show ad options to user (official ads first, then third-party)
 */
export async function handleAdReward(
  telegram: TelegramService,
  db: DatabaseClient,
  chatId: number,
  telegramId: string
) {
  try {
    // Check if user is VIP
    const { getUser } = await import('~/db/queries/users');
    const user = await getUser(db, telegramId);
    
    if (!user) {
      await telegram.sendMessage(chatId, '❌ 用戶不存在');
      return;
    }
    
    if (user.is_vip) {
      await telegram.sendMessage(
        chatId,
        '💎 VIP 用戶無需觀看廣告\n\n您已擁有 30 個基礎額度 + 邀請獎勵！'
      );
      return;
    }
    
    // Get today's ad reward
    const { getOrCreateTodayAdReward } = await import('~/db/queries/ad_rewards');
    const adReward = await getOrCreateTodayAdReward(db, telegramId);
    
    // Get unviewed official ads
    const { getUnviewedAdsForUser } = await import('~/db/queries/official_ads');
    const officialAds = await getUnviewedAdsForUser(db, telegramId);
    
    // Calculate remaining third-party ads
    const { MAX_DAILY_ADS, getRemainingAds } = await import('~/domain/ad_reward');
    const remainingAds = getRemainingAds(adReward.ads_watched);
    
    // Build message
    let message = '📺 **增加額度方式**\n\n';
    
    // Official ads section (priority)
    if (officialAds.length > 0) {
      message += '🎯 **官方推廣**（點擊即獎勵，永久額度）\n';
      officialAds.slice(0, 3).forEach((ad, index) => {
        const icon = {
          text: '📝',
          link: '🔗',
          group: '👥',
          channel: '📢'
        }[ad.ad_type] || '✨';
        message += `${icon} ${ad.title} (+${ad.reward_quota} 額度)\n`;
      });
      message += '\n';
    }
    
    // Third-party ads section
    message += '📺 **第三方廣告**（臨時額度，明天重置）\n';
    if (remainingAds > 0) {
      message += 
        `• 每看一則廣告 +1 額度\n` +
        `• 今日剩餘：${remainingAds}/${MAX_DAILY_ADS} 次\n\n`;
    } else {
      message += `• 今日廣告已看完（${MAX_DAILY_ADS}/${MAX_DAILY_ADS}）\n\n`;
    }
    
    // Build inline keyboard
    const keyboard: InlineKeyboardButton[][] = [];
    
    // Add official ad buttons (max 3)
    const { getAdButtonText } = await import('~/domain/official_ad');
    officialAds.slice(0, 3).forEach(ad => {
      keyboard.push([{
        text: getAdButtonText(ad),
        callback_data: `official_ad:${ad.id}`
      }]);
    });
    
    // Add third-party ad button
    if (remainingAds > 0) {
      keyboard.push([{
        text: `📺 觀看第三方廣告 (+1 額度)`,
        url: `/ad?user=${telegramId}&token=${generateAdToken(telegramId)}`
      }]);
    }
    
    await telegram.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
    
  } catch (error) {
    console.error('[handleAdReward] Error:', error);
    await telegram.sendMessage(chatId, '❌ 獲取廣告失敗，請稍後再試');
  }
}

/**
 * Handle official ad click
 */
export async function handleOfficialAdClick(
  telegram: TelegramService,
  db: DatabaseClient,
  chatId: number,
  telegramId: string,
  adId: number
) {
  try {
    // Get ad details
    const { getOfficialAdById } = await import('~/db/queries/official_ads');
    const ad = await getOfficialAdById(db, adId);
    
    if (!ad) {
      await telegram.answerCallbackQuery(chatId, '❌ 廣告不存在');
      return;
    }
    
    // Check if already viewed
    const { getAdView } = await import('~/db/queries/official_ads');
    const view = await getAdView(db, telegramId, adId);
    
    if (view && view.reward_granted) {
      await telegram.answerCallbackQuery(chatId, '✅ 您已領取過此獎勵');
      return;
    }
    
    // Record view if first time
    if (!view) {
      const { recordAdView } = await import('~/db/queries/official_ads');
      await recordAdView(db, telegramId, adId);
    }
    
    // Handle different ad types
    const { requiresVerification } = await import('~/domain/official_ad');
    
    if (requiresVerification(ad)) {
      // Group/Channel with verification
      await handleVerificationAd(telegram, db, chatId, telegramId, ad);
    } else {
      // Text/Link - instant reward
      await handleInstantRewardAd(telegram, db, chatId, telegramId, ad);
    }
    
  } catch (error) {
    console.error('[handleOfficialAdClick] Error:', error);
    await telegram.answerCallbackQuery(chatId, '❌ 處理失敗，請稍後再試');
  }
}

/**
 * Handle instant reward ad (text/link)
 */
async function handleInstantRewardAd(
  telegram: TelegramService,
  db: DatabaseClient,
  chatId: number,
  telegramId: string,
  ad: OfficialAd
) {
  // Record click and grant reward
  const { recordAdClick } = await import('~/db/queries/official_ads');
  await recordAdClick(db, telegramId, ad.id);
  
  // Update user quota (add to permanent quota, not daily ad quota)
  const { updateUser, getUser } = await import('~/db/queries/users');
  const user = await getUser(db, telegramId);
  
  if (user) {
    // Add to invite_bonus (permanent quota)
    await updateUser(db, telegramId, {
      invite_bonus: user.invite_bonus + ad.reward_quota
    });
  }
  
  // Send message with link button if applicable
  let message = `✅ **獎勵已發放**\n\n`;
  message += `${ad.content}\n\n`;
  message += `🎁 您獲得了 +${ad.reward_quota} 額度（永久）`;
  
  const keyboard: InlineKeyboardButton[][] = [];
  
  if (ad.url) {
    keyboard.push([{
      text: ad.ad_type === 'link' ? '🔗 查看詳情' : '👥 加入',
      url: ad.url
    }]);
  }
  
  await telegram.sendMessage(chatId, message, {
    reply_markup: keyboard.length > 0 ? { inline_keyboard: keyboard } : undefined
  });
}

/**
 * Handle verification ad (group/channel)
 */
async function handleVerificationAd(
  telegram: TelegramService,
  db: DatabaseClient,
  chatId: number,
  telegramId: string,
  ad: OfficialAd
) {
  // Send message with join button
  let message = `📢 **${ad.title}**\n\n`;
  message += `${ad.content}\n\n`;
  message += `🎁 加入後獲得 +${ad.reward_quota} 額度（永久）\n`;
  message += `⏳ 加入後點擊「驗證」按鈕領取獎勵`;
  
  const keyboard: InlineKeyboardButton[][] = [
    [{
      text: ad.ad_type === 'group' ? '👥 加入群組' : '📢 訂閱頻道',
      url: ad.url!
    }],
    [{
      text: '✅ 我已加入，驗證領取',
      callback_data: `verify_ad:${ad.id}`
    }]
  ];
  
  await telegram.sendMessage(chatId, message, {
    reply_markup: { inline_keyboard: keyboard }
  });
}

/**
 * Handle ad verification
 */
export async function handleAdVerification(
  telegram: TelegramService,
  db: DatabaseClient,
  chatId: number,
  telegramId: string,
  adId: number
) {
  try {
    // Get ad details
    const { getOfficialAdById } = await import('~/db/queries/official_ads');
    const ad = await getOfficialAdById(db, adId);
    
    if (!ad || !ad.target_entity_id) {
      await telegram.answerCallbackQuery(chatId, '❌ 廣告不存在');
      return;
    }
    
    // Check if user is in group/channel
    const isMember = await telegram.checkUserMembership(
      ad.target_entity_id,
      telegramId
    );
    
    if (!isMember) {
      await telegram.answerCallbackQuery(
        chatId,
        '❌ 請先加入群組/頻道後再驗證'
      );
      return;
    }
    
    // Record verification and grant reward
    const { recordAdVerification } = await import('~/db/queries/official_ads');
    await recordAdVerification(db, telegramId, adId);
    
    // Update user quota
    const { updateUser, getUser } = await import('~/db/queries/users');
    const user = await getUser(db, telegramId);
    
    if (user) {
      await updateUser(db, telegramId, {
        invite_bonus: user.invite_bonus + ad.reward_quota
      });
    }
    
    await telegram.sendMessage(
      chatId,
      `✅ **驗證成功！**\n\n` +
      `🎁 您獲得了 +${ad.reward_quota} 額度（永久）\n` +
      `💬 感謝加入我們的社群！`
    );
    
  } catch (error) {
    console.error('[handleAdVerification] Error:', error);
    await telegram.answerCallbackQuery(chatId, '❌ 驗證失敗，請稍後再試');
  }
}
```

---

### **管理命令**

#### **文件：`src/telegram/handlers/admin_official_ads.ts`**（新建）

```typescript
/**
 * Admin Official Ads Management
 * Commands: /create_ad, /list_ads, /disable_ad
 */

import type { TelegramService } from '~/services/telegram';
import type { DatabaseClient } from '~/db/client';
import type { OfficialAd } from '~/domain/official_ad';

/**
 * Create official ad
 * Usage: /create_ad <type> <title> | <content> | [url] | [reward]
 */
export async function handleCreateAd(
  telegram: TelegramService,
  db: DatabaseClient,
  chatId: number,
  telegramId: string,
  args: string
) {
  try {
    // Check admin permission
    const { isAdmin } = await import('~/domain/admin');
    if (!await isAdmin(db, telegramId)) {
      await telegram.sendMessage(chatId, '❌ 無權限');
      return;
    }
    
    if (!args) {
      const message = 
        '📝 **創建官方廣告**\n\n' +
        '請按以下格式發送：\n\n' +
        '`/create_ad <類型> <標題> | <內容> | [URL] | [獎勵額度]`\n\n' +
        '**類型：**\n' +
        '• `text` - 純文字公告\n' +
        '• `link` - 鏈接推廣\n' +
        '• `group` - 群組邀請\n' +
        '• `channel` - 頻道訂閱\n\n' +
        '**示例：**\n' +
        '`/create_ad text 新功能上線 | 我們推出了全新的 VIP 功能！ | | 1`\n' +
        '`/create_ad link 下載 App | 點擊下載我們的 Mini App | https://t.me/bot/app | 1`\n' +
        '`/create_ad group 加入群組 | 加入官方群組交流 | https://t.me/group | 2`';
      
      await telegram.sendMessage(chatId, message);
      return;
    }
    
    // Parse arguments
    const parts = args.split('|').map(p => p.trim());
    const [typeAndTitle, content, url, reward] = parts;
    
    if (!typeAndTitle || !content) {
      await telegram.sendMessage(chatId, '❌ 格式錯誤，請提供類型、標題和內容');
      return;
    }
    
    const [type, ...titleParts] = typeAndTitle.split(' ');
    const title = titleParts.join(' ');
    
    if (!['text', 'link', 'group', 'channel'].includes(type)) {
      await telegram.sendMessage(chatId, '❌ 無效的廣告類型');
      return;
    }
    
    // Create ad
    const { createOfficialAd } = await import('~/db/queries/official_ads');
    const adId = await createOfficialAd(db, {
      ad_type: type as 'text' | 'link' | 'group' | 'channel',
      title,
      content,
      url: url || undefined,
      target_entity_id: undefined,
      reward_quota: reward ? parseInt(reward) : 1,
      is_enabled: 1,
      requires_verification: 0
    });
    
    await telegram.sendMessage(
      chatId,
      `✅ **廣告創建成功**\n\n` +
      `ID: ${adId}\n` +
      `類型: ${type}\n` +
      `標題: ${title}\n` +
      `獎勵: +${reward || 1} 額度`
    );
    
  } catch (error) {
    console.error('[handleCreateAd] Error:', error);
    await telegram.sendMessage(chatId, '❌ 創建失敗');
  }
}

/**
 * List official ads
 * Usage: /list_ads
 */
export async function handleListAds(
  telegram: TelegramService,
  db: DatabaseClient,
  chatId: number,
  telegramId: string
) {
  try {
    // Check admin permission
    const { isAdmin } = await import('~/domain/admin');
    if (!await isAdmin(db, telegramId)) {
      await telegram.sendMessage(chatId, '❌ 無權限');
      return;
    }
    
    // Get all ads
    const ads = await db.d1
      .prepare(`SELECT * FROM official_ads ORDER BY created_at DESC LIMIT 20`)
      .all<OfficialAd>();
    
    if (!ads.results || ads.results.length === 0) {
      await telegram.sendMessage(chatId, '📝 尚未創建任何官方廣告');
      return;
    }
    
    let message = '📝 **官方廣告列表**\n\n';
    
    ads.results.forEach((ad, index) => {
      const status = ad.is_enabled ? '✅ 啟用' : '❌ 停用';
      const type = {
        text: '📝 文字',
        link: '🔗 鏈接',
        group: '👥 群組',
        channel: '📢 頻道'
      }[ad.ad_type] || ad.ad_type;
      
      message += 
        `**${index + 1}. ${ad.title}** ${status}\n` +
        `• ID: ${ad.id}\n` +
        `• 類型: ${type}\n` +
        `• 獎勵: +${ad.reward_quota} 額度\n` +
        `• 觀看: ${ad.current_views}${ad.max_views ? `/${ad.max_views}` : ''} 次\n`;
      
      if (ad.requires_verification) {
        message += `• 需要認證: ✅\n`;
      }
      
      message += '\n';
    });
    
    message += '\n使用 `/disable_ad <ID>` 停用廣告';
    
    await telegram.sendMessage(chatId, message);
    
  } catch (error) {
    console.error('[handleListAds] Error:', error);
    await telegram.sendMessage(chatId, '❌ 獲取列表失敗');
  }
}

/**
 * Disable official ad
 * Usage: /disable_ad <ad_id>
 */
export async function handleDisableAd(
  telegram: TelegramService,
  db: DatabaseClient,
  chatId: number,
  telegramId: string,
  adId: number
) {
  try {
    // Check admin permission
    const { isAdmin } = await import('~/domain/admin');
    if (!await isAdmin(db, telegramId)) {
      await telegram.sendMessage(chatId, '❌ 無權限');
      return;
    }
    
    // Disable ad
    await db.d1
      .prepare(
        `UPDATE official_ads 
         SET is_enabled = 0, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
      .bind(adId)
      .run();
    
    await telegram.sendMessage(chatId, `✅ 廣告 #${adId} 已停用`);
    
  } catch (error) {
    console.error('[handleDisableAd] Error:', error);
    await telegram.sendMessage(chatId, '❌ 停用失敗');
  }
}
```

---

### **Router 更新**

#### **更新：`src/router.ts`**

```typescript
// Handle callback queries
if (update.callback_query) {
  const callbackData = update.callback_query.data;
  
  // Official ad click
  if (callbackData?.startsWith('official_ad:')) {
    const adId = parseInt(callbackData.split(':')[1]);
    const { handleOfficialAdClick } = await import('~/telegram/handlers/ad_reward');
    await handleOfficialAdClick(
      telegram,
      db,
      update.callback_query.message.chat.id,
      update.callback_query.from.id.toString(),
      adId
    );
    return new Response('OK');
  }
  
  // Ad verification
  if (callbackData?.startsWith('verify_ad:')) {
    const adId = parseInt(callbackData.split(':')[1]);
    const { handleAdVerification } = await import('~/telegram/handlers/ad_reward');
    await handleAdVerification(
      telegram,
      db,
      update.callback_query.message.chat.id,
      update.callback_query.from.id.toString(),
      adId
    );
    return new Response('OK');
  }
}

// Admin commands
if (text?.startsWith('/create_ad')) {
  const args = text.substring(11).trim();
  const { handleCreateAd } = await import('~/telegram/handlers/admin_official_ads');
  await handleCreateAd(telegram, db, chatId, telegramId, args);
  return new Response('OK');
}

if (text === '/list_ads') {
  const { handleListAds } = await import('~/telegram/handlers/admin_official_ads');
  await handleListAds(telegram, db, chatId, telegramId);
  return new Response('OK');
}

if (text?.startsWith('/disable_ad ')) {
  const adId = parseInt(text.split(' ')[1]);
  const { handleDisableAd } = await import('~/telegram/handlers/admin_official_ads');
  await handleDisableAd(telegram, db, chatId, telegramId, adId);
  return new Response('OK');
}
```

---

## ✅ **官方廣告系統實現檢查清單**

### **Phase 1: 數據庫**
- [ ] 創建 Migration `0027_create_official_ads.sql`
- [ ] 執行 Migration
- [ ] 驗證表結構

### **Phase 2: Domain & Queries**
- [ ] 創建 `src/domain/official_ad.ts`
- [ ] 創建 `src/db/queries/official_ads.ts`
- [ ] 編寫單元測試

### **Phase 3: Handlers**
- [ ] 更新 `src/telegram/handlers/ad_reward.ts` 支持官方廣告
- [ ] 創建 `src/telegram/handlers/admin_official_ads.ts`
- [ ] 實現廣告輪播邏輯（官方優先）

### **Phase 4: Router**
- [ ] 更新 `src/router.ts` 添加 callback 處理
- [ ] 添加管理命令路由

### **Phase 5: 測試**
- [ ] 測試文字廣告（點擊即獎勵）
- [ ] 測試鏈接廣告
- [ ] 測試群組邀請（無認證）
- [ ] 測試群組邀請（需認證）
- [ ] 測試頻道訂閱（需認證）
- [ ] 測試一次性推送邏輯
- [ ] 測試管理命令

### **Phase 6: 部署**
- [ ] 部署到 Staging
- [ ] 創建測試廣告
- [ ] 驗證功能正常
- [ ] 部署到 Production

---

## 🎯 **官方廣告系統優勢**

### **1. 靈活性**
- ✅ 支持多種廣告類型（text/link/group/channel）
- ✅ 可自定義獎勵額度（1-10 額度）
- ✅ 支持時間範圍限制（start_date/end_date）
- ✅ 支持觀看次數限制（max_views）

### **2. 用戶體驗**
- ✅ 點擊即獎勵（無需等待視頻）
- ✅ 一次性推送（不重複打擾）
- ✅ 獎勵永久（加到 invite_bonus，不是臨時額度）
- ✅ 不計入每日 20 次限制

### **3. 推廣效果**
- ✅ 直接推廣官方內容
- ✅ 增加群組/頻道成員
- ✅ 提高用戶參與度
- ✅ 可追蹤推廣效果（觀看次數、點擊率）

### **4. 管理便利**
- ✅ 簡單的管理命令（/create_ad, /list_ads, /disable_ad）
- ✅ 實時查看統計數據
- ✅ 隨時啟用/停用
- ✅ 支持未來擴展（認證系統、A/B 測試）

---

## 📊 **廣告輪播策略總結**

### **優先級順序**
1. **官方廣告**（最優先）
   - 點擊即獎勵
   - 永久額度
   - 一次性推送
   - 不計入限制

2. **第三方視頻廣告**（次優先）
   - 需要觀看完整視頻
   - 臨時額度（明天重置）
   - 每天最多 20 次

### **用戶看到的順序**
```
📺 增加額度方式

🎯 官方推廣（點擊即獎勵，永久額度）
📝 新功能上線 (+1 額度)
🔗 下載 Mini App (+1 額度)
👥 加入官方群組 (+2 額度)

📺 第三方廣告（臨時額度，明天重置）
• 每看一則廣告 +1 額度
• 今日剩餘：15/20 次

[按鈕: ✨ 點擊領取 +1 額度]
[按鈕: 🔗 查看詳情 (+1 額度)]
[按鈕: 👥 加入群組 (+2 額度)]
[按鈕: 📺 觀看第三方廣告 (+1 額度)]
```

---

**官方廣告系統設計完成！** 🎉

**最後更新**: 2025-01-18  
**版本**: 3.0（新增官方廣告系統）  
**作者**: XunNi Team


