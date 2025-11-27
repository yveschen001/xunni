# MoonPacket API 整合設計文檔 (MoonPacket Integration Design) v2

## 1. 專案背景

為了提高用戶活躍度、增加收入及促進社交裂變，我們計畫與外部「紅包應用 (MoonPacket)」進行整合。透過提供一個標準化的 API，讓 MoonPacket 能夠查詢我們用戶的狀態與成就，從而根據規則發放紅包獎勵給符合條件的活躍用戶。

## 2. 整合目標

1.  **數據驅動 (Data-Driven)**：API 僅返回用戶的**具體行為數據**（如：看了 5 個廣告），而不是判斷結果（如：是否達標）。判定邏輯完全由 MoonPacket 端配置。
2.  **彈性配置**：運營人員可以在 MoonPacket 後台隨時調整獎勵門檻（例如從「看 10 個廣告」降為「看 5 個」），無需我們重新部署代碼。
3.  **統一接口**：遵循 MoonPacket API v2.3 規格。

## 3. 活躍指標數據 (User Metrics)

API 將返回以下數值型數據，供 MoonPacket 進行 `gte` (大於等於) 或 `eq` (等於) 的判斷：

### 3.1 基礎指標 (Basic)
*   `level` (Int): 用戶等級。
*   `is_vip` (Bool): 是否為 VIP。
*   `is_active` (Bool): 帳號狀態是否正常。
*   `created_days` (Int): 註冊天數（可用於區分新老用戶）。

### 3.2 24小時活躍數據 (24h Rolling Window)
*   `ads_watched_24h` (Int): 24小時內觀看廣告的總次數。
    *   *應用*: 可配置 ">= 5" 或 ">= 10"。
*   `bottles_thrown_24h` (Int): 24小時內丟出漂流瓶的數量。
    *   *應用*: 可配置 ">= 3" 或 ">= 10"。
*   `bottles_picked_24h` (Int): 24小時內撿起漂流瓶的數量。
    *   *應用*: 可配置 ">= 5"。

### 3.3 社交裂變數據 (Social Viral)
*   `invite_count_24h` (Int): 24小時內邀請的新用戶總數。
*   `invite_active_count_24h` (Int): 24小時內邀請且**已活躍**（例如已發瓶子）的新用戶數。
    *   *說明*: 這是為了防止假量，只有被邀請者真的玩了才算。
*   `invite_viral_count_24h` (Int): 24小時內邀請且**也邀請了別人**的新用戶數（二級裂變）。

### 3.4 總量數據 (Lifetime Totals)
*   `invite_count_total` (Int): 累計邀請的好友總數。
    *   *應用*: 可配置 ">= 10" 或 ">= 50"。

### 3.5 深度參與數據 (Deep Engagement) - **NEW**
*   `is_channel_member` (Bool): 是否已加入官方頻道。
    *   *價值*: 用戶留存與長期觸達。
*   `profile_completeness` (Int): 個人資料完整度百分比 (0-100)。
    *   *計算*: 頭像、暱稱、性別、生日、Bio、城市、MBTI 各佔一定權重。
    *   *價值*: 真人驗證，提高社交質量。
*   `messages_sent_24h` (Int): 24小時內在對話中發送的訊息數。
    *   *價值*: 真實社交互動，比單純丟瓶子更具黏性。

## 4. API 規格實現方案 (Implementation Plan)

### 4.1 Endpoint Configuration
*   **URL**: `https://<worker-host>/api/moonpacket/check`
*   **Method**: `GET`
*   **Auth**: `Authorization: Bearer <API_KEY>`

### 4.2 數據結構範例 (Example)

#### A. 規則列表 (Rules Response)
*定義我們支援的數據字段及其含義。*

```json
{
  "data": [
    {
      "id": "daily_ad_watcher_easy",
      "claim_amount": "10",
      "currency": "BOTTLE", 
      "rule": {
        "ads_watched_24h": { "gte": 5 },  // 靈活配置：只要 > 5 即可
        "is_blacklist": { "eq": false }
      },
      "metadata": { "title": "廣告新手", "desc": "24小時內觀看 5 則廣告" }
    },
    {
      "id": "daily_ad_watcher_hard",
      "claim_amount": "50",
      "currency": "BOTTLE",
      "rule": {
        "ads_watched_24h": { "gte": 20 }, // 靈活配置：需要 > 20
        "is_blacklist": { "eq": false }
      },
      "metadata": { "title": "廣告達人", "desc": "24小時內觀看 20 則廣告" }
    }
  ]
}
```

#### B. 用戶畫像 (User Profile Response)
*返回純數據，不包含判斷結果。*

```json
{
  "data": {
    "level": 5,
    "is_vip": true,
    "status": "active",
    
    // 數值型數據，供規則比對
    "ads_watched_24h": 12,       // 用戶實際看了12個
    "bottles_thrown_24h": 8,
    "bottles_picked_24h": 3,
    "invite_active_count_24h": 2, // 邀請了2個有效用戶
    "invite_viral_count_24h": 0,
    "invite_count_total": 15,
    
    // 深度參與
    "is_channel_member": true,    // 已關注頻道
    "profile_completeness": 85,   // 資料完整度 85%
    "messages_sent_24h": 45       // 聊得很嗨
  }
}
```

**邏輯判斷示例**：
*   用戶 `ads_watched_24h` = 12。
*   規則 A (Easy) 要求 `>= 5` -> **符合**。
*   規則 B (Hard) 要求 `>= 20` -> **不符合**。
*   結果：用戶只能領取規則 A 的獎勵。

## 5. 安全性與性能

1.  **數據庫查詢優化**: 
    *   使用 `COUNT(*)` 聚合查詢，並建立適當索引。
    *   對於 `invite_active_count_24h` 這種複雜查詢，考慮使用定時任務預計算或緩存。
2.  **緩存策略**: 
    *   用戶數據緩存 1-3 分鐘，避免短時間內重複計算。

## 6. 開發步驟

1.  **配置**: 在 `wrangler.toml` 添加 `MOONPACKET_API_KEY` (已完成)。
2.  **Service**: 實作 `MoonPacketService`，返回上述數值型指標。
3.  **Handler**: 建立 API Handler。
4.  **Router**: 註冊路由。
