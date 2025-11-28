# MoonPacket API 整合設計文檔 (MoonPacket Integration Design) v2.3

## 1. 專案背景

為了提高用戶活躍度、增加收入及促進社交裂變，我們計畫與外部「紅包應用 (MoonPacket)」進行整合。透過提供一個標準化的 GET 查詢接口，讓 MoonPacket 能夠主動向我們的伺服器獲取「獎勵規則」與「用戶屬性」，所有的邏輯判斷由 MoonPacket 處理。

## 2. 整合目標

1.  **數據驅動 (Data-Driven)**：API 僅返回用戶的**具體行為數據**（如：看了 5 個廣告），而不是判斷結果（如：是否達標）。判定邏輯完全由 MoonPacket 端配置。
2.  **彈性配置**：運營人員可以在 MoonPacket 後台隨時調整獎勵門檻（例如從「看 10 個廣告」降為「看 5 個」），無需我們重新部署代碼。
3.  **統一接口**：遵循 MoonPacket API v2.3 規格。
4.  **安全驗證**：使用 HMAC-SHA256 簽名驗證請求的真實性。

## 3. 活躍指標數據 (User Metrics)

API 將返回以下數值型數據，供 MoonPacket 進行 `gte` (大於等於) 或 `eq` (等於) 的判斷：

### 3.1 基礎指標 (Basic)
*   `level` (Int): 用戶等級（預設為 1，VIP 可更高）。
*   `is_vip` (Bool): 是否為 VIP。
*   `status` (String): 帳號狀態 ('active', 'inactive', 'blocked')。
*   `is_blacklist` (Bool): 是否在黑名單中（例如被封鎖）。
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

### 3.5 深度參與數據 (Deep Engagement)
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
*   **Auth**: Custom Signature Headers (X-API-KEY, X-API-SIGNATURE, etc.)

### 4.2 Headers
*   `Content-Type`: `application/json`
*   `X-API-KEY`: 您的 API Key (用於識別客戶端)
*   `X-API-TIMESTAMP`: 時間戳 (秒或毫秒)
*   `X-API-NONCE`: 隨機字串
*   `X-API-SIGNATURE`: 簽名，算法 `HMAC_SHA256(secret, body + timestamp + nonce)` (GET 請求 body 為空字串或 query params 序列化，MoonPacket 規範 body 為空物件 `{}` 的 JSON 字串 `"{}"` 用於簽名計算，具體依賴其實現，此處假設 GET 請求 body 為空，Payload 為 `"{}" + timestamp + nonce`)。

### 4.3 模式與響應 (Modes & Responses)

#### Mode A: 定義規則 (Setup) - `GET /check` (無 `user_id`)
返回含運算符的規則定義 JSON，告訴 MoonPacket 我們支援哪些指標以及如何比較。

```json
{
  "data": {
    "level": { "gte": 1 },
    "is_vip": { "eq": true },
    "status": { "eq": "active" },
    "is_blacklist": { "eq": false },
    "ads_watched_24h": { "gte": 5 },
    "bottles_thrown_24h": { "gte": 3 },
    "bottles_picked_24h": { "gte": 3 },
    "invite_active_count_24h": { "gte": 1 },
    "is_channel_member": { "eq": true },
    "profile_completeness": { "gte": 80 },
    "messages_sent_24h": { "gte": 10 }
  }
}
```

#### Mode B: 查詢狀態 (Runtime) - `GET /check?user_id=...`
返回該特定用戶的實際屬性值 (純數值或字串)。

```json
{
  "data": {
    "level": 5,
    "is_vip": true,
    "status": "active",
    "is_blacklist": false,
    "ads_watched_24h": 12,
    "bottles_thrown_24h": 8,
    "bottles_picked_24h": 3,
    "invite_active_count_24h": 2,
    "is_channel_member": true,
    "profile_completeness": 85,
    "messages_sent_24h": 45
  }
}
```

### 4.4 狀態碼 (Status Codes)
*   `200 OK`: 請求成功
*   `400 Bad Request`: 請求參數錯誤
*   `401 Unauthorized`: 簽名驗證失敗或 Key 無效
*   `404 Not Found`: 用戶 ID 不存在 (針對查詢用戶狀態場景)
*   `500 Server Error`: 伺服器內部錯誤

## 5. 安全驗證 (Security)

為了確保請求的真實性，必須驗證 `X-API-SIGNATURE`。

**簽名算法**: `Signature = HMAC_SHA256(secret, payload)`
*   `payload = JSON.stringify(body) + timestamp + (nonce || "")`
*   對於 GET 請求，`body` 通常為空物件 `{}`，所以 `payload = "{}" + timestamp + nonce`。

**超時檢查**:
檢查 `X-API-TIMESTAMP` 與當前時間的差值，超過 5 分鐘 (300秒) 應拒絕請求，防止重放攻擊。

## 6. 開發步驟

1.  **配置**: 在 `wrangler.toml` 添加 `MOONPACKET_API_SECRET` (用於簽名驗證) 和 `MOONPACKET_API_KEY` (用於識別)。
2.  **Service**: 更新 `MoonPacketService`，適配新的 Response 格式 (Mode A 和 Mode B)。
3.  **Utils**: 實作 `verifySignature` 函數。
4.  **Handler**: 重構 `handleMoonPacketCheck`，移除 Bearer Token 驗證，改用 Header 簽名驗證。
