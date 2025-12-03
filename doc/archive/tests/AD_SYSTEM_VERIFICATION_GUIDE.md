# 🔍 廣告系統完整驗證指南

## 📋 **目錄**

1. [自動化檢查](#自動化檢查)
2. [人工驗收清單](#人工驗收清單)
3. [功能完整性檢查](#功能完整性檢查)
4. [常見問題排查](#常見問題排查)

---

## 🤖 **自動化檢查**

### **Step 1: 代碼質量檢查**

```bash
# 1. Lint 檢查（必須 0 錯誤）
pnpm lint

# 預期輸出：
# ✓ No linting errors found

# 2. TypeScript 類型檢查
pnpm type-check

# 預期輸出：
# ✓ No type errors found

# 3. 檢查未使用的導入
pnpm lint --fix
```

**✅ 通過標準：**
- 0 Lint 錯誤
- 0 TypeScript 類型錯誤
- 沒有未使用的導入

---

### **Step 2: 文件完整性檢查**

```bash
# 檢查所有必需文件是否存在
ls -la src/telegram/handlers/ad_reward.ts
ls -la src/telegram/handlers/official_ad.ts
ls -la src/domain/ad_reward.ts
ls -la src/domain/ad_provider.ts
ls -la src/domain/official_ad.ts
ls -la src/db/queries/ad_rewards.ts
ls -la src/db/queries/ad_providers.ts
ls -la src/db/queries/official_ads.ts
ls -la public/ad.html
ls -la scripts/init-ad-providers.sql
```

**✅ 通過標準：**
- 所有文件都存在
- 沒有 "No such file" 錯誤

---

### **Step 3: 數據庫 Migrations 檢查**

```bash
# 檢查 Migrations 文件
ls -la src/db/migrations/002*.sql

# 預期輸出（11 個文件）：
# 0022_create_ad_rewards_table.sql
# 0023_add_ad_statistics.sql
# 0024_create_ad_providers_table.sql
# 0025_create_ad_provider_logs.sql
# 0026_create_official_ads.sql
# 0027_create_quota_prompts.sql
# 0028_create_analytics_events.sql
# 0029_create_user_sessions.sql
# 0030_create_daily_user_summary.sql
# 0031_create_funnel_events.sql
# 0032_update_daily_stats_analytics.sql

# 執行 Migrations（本地測試）
wrangler d1 migrations apply DB --local

# 驗證表創建
wrangler d1 execute DB --local --command "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'ad_%' OR name LIKE '%_ad_%' OR name LIKE 'analytics_%' OR name LIKE 'user_sessions' OR name LIKE 'daily_user_summary' OR name LIKE 'funnel_events' ORDER BY name;"
```

**✅ 通過標準：**
- 所有 Migrations 執行成功
- 11 個新表全部創建
- 沒有 SQL 錯誤

**預期表列表：**
1. `ad_providers`
2. `ad_provider_logs`
3. `ad_rewards`
4. `official_ads`
5. `official_ad_views`
6. `analytics_events`
7. `user_sessions`
8. `daily_user_summary`
9. `funnel_events`
10. `quota_prompt_variants` (可選)
11. `quota_prompt_impressions` (可選)

---

### **Step 4: 初始化數據檢查**

```bash
# 執行初始化腳本
wrangler d1 execute DB --local --file=./scripts/init-ad-providers.sql

# 驗證數據
wrangler d1 execute DB --local --command "SELECT * FROM ad_providers;"

# 預期輸出：
# id | provider_name | display_name | is_enabled | priority | weight | ...
# 1  | gigapub       | GigaPub      | 1          | 100      | 70     | ...
```

**✅ 通過標準：**
- GigaPub 提供商創建成功
- is_enabled = 1
- priority = 100
- weight = 70

---

### **Step 5: 路由集成檢查**

```bash
# 檢查 router.ts 中的廣告回調
grep -n "watch_ad\|official_ad\|claim_ad\|verify_ad" src/router.ts

# 預期輸出（至少 4 個匹配）：
# 799:    if (data === 'watch_ad') {
# 806:    if (data === 'view_official_ad') {
# 812:    if (data.startsWith('claim_ad_')) {
# 819:    if (data.startsWith('verify_ad_')) {

# 檢查 worker.ts 中的 API 端點
grep -n "/api/ad/" src/worker.ts

# 預期輸出（至少 2 個匹配）：
# 52:        if (url.pathname === '/api/ad/complete' && request.method === 'POST') {
# 72:        if (url.pathname === '/api/ad/error' && request.method === 'POST') {
```

**✅ 通過標準：**
- router.ts 包含 4 個廣告回調
- worker.ts 包含 2 個 API 端點

---

## 👨‍💼 **人工驗收清單**

> **重要提示：** 以下測試需要在實際 Telegram Bot 中進行，無法自動化。

---

### **A. 第三方視頻廣告系統（核心功能）**

#### **A1. 基本觀看流程 ⭐⭐⭐⭐⭐ 必須驗收**

**前置條件：**
- Bot 已部署到 Staging 環境
- 數據庫 Migrations 已執行
- 廣告提供商已初始化

**測試步驟：**

1. **註冊測試用戶**
   ```
   操作：發送 /start
   預期：完成註冊流程
   ```

2. **查看額度狀態**
   ```
   操作：發送 /throw
   預期：顯示當前額度（新用戶應該有 3 個免費額度）
   ```

3. **用完免費額度**
   ```
   操作：連續丟 3 個瓶子
   預期：額度變為 0
   ```

4. **觸發廣告提示**
   ```
   操作：再次嘗試 /throw
   預期：
   - 顯示「額度不足」提示
   - 顯示「觀看廣告」按鈕
   - 顯示「邀請好友」按鈕
   ```

5. **點擊「觀看廣告」按鈕**
   ```
   操作：點擊 inline button
   預期：
   - 收到廣告頁面鏈接（Web App）
   - 格式：{PUBLIC_URL}/ad.html?user={userId}&token={token}&provider=gigapub
   ```

6. **打開廣告頁面**
   ```
   操作：點擊鏈接打開頁面
   預期：
   - 頁面正常顯示
   - 顯示「XunNi 廣告」標題
   - 顯示廣告容器
   - 顯示「正在載入廣告...」
   ```

7. **等待廣告載入**
   ```
   預期：
   - 15 秒倒計時開始
   - 顯示「剩餘 15 秒」
   - 進度條開始移動（0% → 100%）
   ```

8. **觀看廣告**
   ```
   操作：等待 15 秒
   預期：
   - 倒計時每秒更新：14, 13, 12...
   - 進度條平滑增長
   - 不能關閉頁面（如果關閉會失去獎勵）
   ```

9. **廣告完成**
   ```
   預期：
   - 倒計時顯示「觀看完成！」
   - 顯示「🎉 恭喜！」
   - 顯示「您獲得了 +1 個額度」
   - 「完成觀看」按鈕變為可點擊
   ```

10. **點擊「完成觀看」按鈕**
    ```
    操作：點擊按鈕
    預期：
    - 顯示「正在領取獎勵...」
    - 頁面自動關閉（如果是 Telegram Mini App）
    - 或顯示「獎勵已成功發放！您可以關閉此頁面」
    ```

11. **返回 Telegram**
    ```
    預期：收到 Bot 通知
    內容：
    - 🎉 廣告觀看完成！
    - ✅ 獲得 +1 個額度
    - 📊 今日已觀看：1/20 次
    - 🎁 今日已獲得：1 個額度
    ```

12. **驗證額度增加**
    ```
    操作：發送 /throw
    預期：可以丟瓶子（額度 = 1）
    ```

**✅ 驗收標準：**
- [ ] 廣告頁面正常顯示
- [ ] 15 秒倒計時正常運作
- [ ] 進度條動畫流暢
- [ ] 完成後收到通知
- [ ] 額度正確增加 +1
- [ ] 統計數據更新（1/20）

**❌ 常見問題：**
- 頁面 404：檢查 PUBLIC_URL 設置
- Token 無效：檢查系統時間，Token 有效期 10 分鐘
- 沒收到通知：檢查 API 端點和日誌

---

#### **A2. 每日限制測試 ⭐⭐⭐⭐ 必須驗收**

**測試步驟：**

1. **連續觀看廣告**
   ```
   操作：重複 A1 步驟 20 次
   預期：每次都能正常觀看並獲得獎勵
   ```

2. **檢查統計**
   ```
   操作：每次完成後查看通知
   預期：
   - 第 1 次：今日已觀看：1/20
   - 第 10 次：今日已觀看：10/20
   - 第 20 次：今日已觀看：20/20
   ```

3. **嘗試觀看第 21 次**
   ```
   操作：點擊「觀看廣告」按鈕
   預期：
   - 收到提示「🚫 今日廣告已達上限」
   - 顯示「已觀看：20/20 次」
   - 顯示「明天再來吧！」
   - 不會打開廣告頁面
   ```

4. **第二天測試**
   ```
   操作：等待 24 小時後再次嘗試
   預期：
   - 可以再次觀看廣告
   - 統計重置為 0/20
   ```

**✅ 驗收標準：**
- [ ] 可以觀看 20 次廣告
- [ ] 第 21 次被正確阻止
- [ ] 提示訊息正確
- [ ] 統計數據準確
- [ ] 第二天自動重置

---

#### **A3. VIP 用戶測試 ⭐⭐⭐ 建議驗收**

**前置條件：**
```sql
-- 將測試用戶設為 VIP
UPDATE users SET is_vip = 1 WHERE telegram_id = '{test_user_id}';
```

**測試步驟：**

1. **VIP 用戶嘗試觀看廣告**
   ```
   操作：點擊「觀看廣告」按鈕
   預期：
   - 收到提示「💎 VIP 用戶無需觀看廣告」
   - 顯示「您已享有無限額度」
   - 不會打開廣告頁面
   ```

2. **驗證 VIP 額度**
   ```
   操作：發送 /throw
   預期：可以無限丟瓶子（不消耗額度）
   ```

**✅ 驗收標準：**
- [ ] VIP 用戶無法觀看廣告
- [ ] 提示訊息正確
- [ ] VIP 額度無限

---

#### **A4. 錯誤處理測試 ⭐⭐ 可選驗收**

**測試場景 1：Token 過期**
```
操作：
1. 點擊「觀看廣告」獲取鏈接
2. 等待 11 分鐘（Token 有效期 10 分鐘）
3. 打開廣告頁面
4. 完成觀看並點擊「完成觀看」

預期：
- 顯示「Token 已過期」
- 不會發放獎勵
- 提示「請重新觀看廣告」
```

**測試場景 2：中途關閉頁面**
```
操作：
1. 打開廣告頁面
2. 觀看 5 秒後關閉頁面
3. 返回 Telegram

預期：
- 不會收到完成通知
- 額度不會增加
- 統計不會更新
```

**測試場景 3：網路錯誤**
```
操作：
1. 打開廣告頁面
2. 關閉網路
3. 等待 15 秒
4. 點擊「完成觀看」

預期：
- 顯示「網路錯誤」
- 提示「請檢查網路連接」
- 不會發放獎勵
```

**✅ 驗收標準：**
- [ ] Token 過期正確處理
- [ ] 中途關閉不發放獎勵
- [ ] 網路錯誤有友好提示

---

### **B. 官方廣告系統（核心功能）**

#### **B1. 創建測試廣告 ⭐⭐⭐⭐⭐ 必須驗收**

**前置條件：**
```sql
-- 創建文字廣告
INSERT INTO official_ads (
  ad_type, title, content, reward_quota, is_enabled
) VALUES (
  'text',
  '歡迎使用 XunNi',
  '感謝您使用 XunNi 漂流瓶！點擊領取 +1 個永久額度作為歡迎禮物！',
  1,
  1
);

-- 創建鏈接廣告
INSERT INTO official_ads (
  ad_type, title, content, target_url, reward_quota, is_enabled
) VALUES (
  'link',
  '訪問官方網站',
  '訪問 XunNi 官方網站了解更多功能和使用技巧',
  'https://example.com',
  1,
  1
);

-- 創建群組廣告（需要驗證）
INSERT INTO official_ads (
  ad_type, title, content, target_url, reward_quota, requires_verification, is_enabled
) VALUES (
  'group',
  '加入官方群組',
  '加入 XunNi 官方群組，與其他用戶交流，獲得 +2 個永久額度！',
  'https://t.me/xunni_group',
  2,
  1,
  1
);
```

**驗證數據：**
```sql
-- 檢查廣告是否創建成功
SELECT * FROM official_ads WHERE is_enabled = 1;
```

**✅ 驗收標準：**
- [ ] 3 個測試廣告創建成功
- [ ] is_enabled = 1
- [ ] reward_quota 正確設置

---

#### **B2. 文字廣告測試 ⭐⭐⭐⭐⭐ 必須驗收**

**測試步驟：**

1. **查看官方廣告列表**
   ```
   操作：點擊「查看官方廣告」按鈕（或發送 /official_ads）
   預期：
   - 顯示廣告列表
   - 顯示「歡迎使用 XunNi」廣告
   - 顯示獎勵：+1 個永久額度
   - 顯示「查看詳情」按鈕
   ```

2. **查看廣告詳情**
   ```
   操作：點擊「查看詳情」按鈕
   預期：
   - 顯示廣告標題
   - 顯示廣告內容
   - 顯示獎勵額度
   - 顯示「領取獎勵」按鈕
   ```

3. **領取獎勵**
   ```
   操作：點擊「領取獎勵」按鈕
   預期：
   - 收到成功訊息
   - 顯示「🎉 恭喜！」
   - 顯示「獲得 +1 個永久額度」
   - 顯示當前永久額度總數
   ```

4. **驗證永久額度**
   ```
   操作：檢查數據庫
   SQL: SELECT permanent_quota FROM users WHERE telegram_id = '{test_user_id}';
   預期：permanent_quota 增加 1
   ```

5. **再次查看廣告列表**
   ```
   操作：點擊「查看官方廣告」按鈕
   預期：
   - 已領取的廣告不再顯示
   - 或顯示「已領取」標記
   ```

6. **嘗試重複領取**
   ```
   操作：嘗試再次領取同一廣告
   預期：
   - 顯示「您已領取過此廣告」
   - 不會發放獎勵
   ```

**✅ 驗收標準：**
- [ ] 廣告正常顯示
- [ ] 獎勵正確發放
- [ ] 永久額度增加
- [ ] 不會重複顯示
- [ ] 不會重複領取

---

#### **B3. 鏈接廣告測試 ⭐⭐⭐⭐ 必須驗收**

**測試步驟：**

1. **查看鏈接廣告**
   ```
   操作：在廣告列表中找到「訪問官方網站」
   預期：
   - 顯示廣告標題和內容
   - 顯示「訪問網站」按鈕
   - 顯示獎勵：+1 個永久額度
   ```

2. **點擊訪問網站**
   ```
   操作：點擊「訪問網站」按鈕
   預期：
   - 打開外部鏈接（https://example.com）
   - 在新窗口/標籤頁打開
   ```

3. **返回並領取獎勵**
   ```
   操作：返回 Telegram，點擊「領取獎勵」按鈕
   預期：
   - 收到成功訊息
   - 獲得 +1 個永久額度
   ```

**✅ 驗收標準：**
- [ ] 鏈接正確打開
- [ ] 獎勵正確發放
- [ ] 永久額度增加

---

#### **B4. 群組廣告測試（需要驗證）⭐⭐⭐ 建議驗收**

**前置條件：**
- 需要一個測試 Telegram 群組
- Bot 必須是群組管理員（用於驗證成員）

**測試步驟：**

1. **查看群組廣告**
   ```
   操作：在廣告列表中找到「加入官方群組」
   預期：
   - 顯示廣告標題和內容
   - 顯示「加入群組」按鈕
   - 顯示「驗證並領取」按鈕
   - 顯示獎勵：+2 個永久額度
   ```

2. **點擊「加入群組」**
   ```
   操作：點擊按鈕
   預期：
   - 打開 Telegram 群組鏈接
   - 顯示群組資訊
   - 可以加入群組
   ```

3. **加入群組**
   ```
   操作：點擊「Join」加入群組
   預期：成功加入群組
   ```

4. **點擊「驗證並領取」（未加入時）**
   ```
   操作：在加入前點擊「驗證並領取」
   預期：
   - 顯示「請先加入群組」
   - 不會發放獎勵
   ```

5. **點擊「驗證並領取」（已加入後）**
   ```
   操作：加入群組後點擊「驗證並領取」
   預期：
   - Bot 驗證用戶是否在群組中
   - 顯示「驗證成功！」
   - 獲得 +2 個永久額度
   ```

**✅ 驗收標準：**
- [ ] 群組鏈接正確
- [ ] 驗證機制正常
- [ ] 未加入時無法領取
- [ ] 加入後可以領取
- [ ] 獎勵正確發放（+2）

**⚠️ 注意：**
- 群組驗證需要 Bot 有 `getChatMember` 權限
- 如果 Bot 不是管理員，驗證可能失敗
- 可以考慮簡化為「自動發放」模式（信任用戶）

---

#### **B5. 官方廣告統計 ⭐⭐ 可選驗收**

**測試步驟：**

1. **查看廣告統計**
   ```sql
   -- 檢查廣告觀看記錄
   SELECT * FROM official_ad_views ORDER BY created_at DESC LIMIT 10;
   
   -- 檢查廣告統計
   SELECT 
     oa.title,
     COUNT(oav.id) as view_count,
     SUM(CASE WHEN oav.is_claimed THEN 1 ELSE 0 END) as claim_count
   FROM official_ads oa
   LEFT JOIN official_ad_views oav ON oa.id = oav.official_ad_id
   GROUP BY oa.id;
   ```

2. **管理員查看統計**
   ```
   操作：以管理員身份發送 /ad_stats
   預期：
   - 顯示每個廣告的展示次數
   - 顯示每個廣告的領取次數
   - 顯示轉化率
   ```

**✅ 驗收標準：**
- [ ] 統計數據準確
- [ ] 管理員可以查看
- [ ] 數據格式清晰

---

### **C. 數據追蹤系統（可選驗收）**

#### **C1. 事件追蹤測試 ⭐⭐ 可選**

**測試步驟：**

1. **執行用戶操作**
   ```
   操作：
   - 註冊新用戶
   - 丟瓶子
   - 觀看廣告
   - 領取官方廣告
   ```

2. **檢查事件記錄**
   ```sql
   SELECT 
     event_type,
     event_category,
     user_id,
     event_data,
     created_at
   FROM analytics_events 
   WHERE user_id = '{test_user_id}' 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

**✅ 驗收標準：**
- [ ] 事件正確記錄
- [ ] event_type 正確
- [ ] event_category 正確
- [ ] event_data 完整

---

#### **C2. 會話追蹤測試 ⭐⭐ 可選**

**測試步驟：**

1. **檢查會話記錄**
   ```sql
   SELECT 
     session_id,
     user_id,
     session_start,
     session_end,
     session_duration_seconds,
     ads_watched,
     bottles_thrown
   FROM user_sessions 
   WHERE user_id = '{test_user_id}' 
   ORDER BY session_start DESC 
   LIMIT 5;
   ```

**✅ 驗收標準：**
- [ ] 會話正確創建
- [ ] 統計數據準確
- [ ] 會話時長計算正確

---

### **D. 報表系統（管理員功能）**

#### **D1. 每日報表測試 ⭐⭐ 可選**

**前置條件：**
```sql
-- 設置管理員權限
UPDATE users SET is_super_admin = 1 WHERE telegram_id = '{admin_user_id}';
```

**測試步驟：**

1. **查看每日報表**
   ```
   操作：以管理員身份發送 /analytics
   預期：
   - 收到每日運營報表
   - 顯示用戶數據
   - 顯示廣告數據
   - 顯示 VIP 數據
   - 顯示邀請數據
   ```

**✅ 驗收標準：**
- [ ] 報表正常生成
- [ ] 數據格式正確
- [ ] 統計數據準確

---

#### **D2. 廣告效果報表 ⭐⭐ 可選**

**測試步驟：**

1. **查看廣告報表**
   ```
   操作：發送 /ad_performance
   預期：
   - 顯示第三方廣告數據
   - 顯示官方廣告數據
   - 顯示提供商對比
   - 顯示完成率
   ```

**✅ 驗收標準：**
- [ ] 報表正常生成
- [ ] 數據完整
- [ ] 計算正確

---

## 📊 **功能完整性檢查**

### **已實現的功能清單**

#### **✅ 第三方視頻廣告系統**
- [x] 多提供商支持（GigaPub, Google, Unity）
- [x] 3 種選擇策略（priority, weighted_random, round_robin）
- [x] 每日 20 次限制
- [x] 每次 +1 臨時額度
- [x] 安全 Token 機制（10 分鐘有效期）
- [x] 完整的錯誤處理
- [x] 統計追蹤（展示、完成、錯誤）
- [x] 提供商性能監控
- [x] 自動 Fallback 機制
- [x] 精美的廣告播放頁面

#### **✅ 官方廣告系統**
- [x] 4 種廣告類型（text, link, group, channel）
- [x] 永久額度獎勵
- [x] 一次性展示（每用戶每廣告）
- [x] 群組/頻道驗證機制
- [x] 可配置獎勵額度（1-10）
- [x] 日期範圍控制
- [x] 最大展示次數限制
- [x] 統計追蹤（展示、點擊、轉化）
- [x] 管理員統計查看
- [x] 靈活的廣告管理

#### **✅ 數據追蹤系統**
- [x] 40+ 事件類型定義
- [x] 5 大事件類別（User, Ad, VIP, Invite, Content）
- [x] 完整的用戶生命週期追蹤
- [x] 會話管理和追蹤
- [x] 每日用戶摘要
- [x] 漏斗分析（VIP、廣告、邀請）
- [x] 靈活的事件數據結構（JSON）
- [x] 高性能查詢設計
- [x] 自動化數據聚合
- [x] 可擴展的架構

#### **✅ 報表系統**
- [x] 每日運營報表
- [x] 廣告效果報表
- [x] VIP 轉化漏斗報表
- [x] 提供商性能對比
- [x] 管理員命令支持
- [x] 格式化的 Telegram 訊息
- [x] 可配置的時間範圍
- [x] 詳細的統計數據

---

## 🔧 **常見問題排查**

### **問題 1: Migrations 執行失敗**

**症狀：**
```
Error: table already exists
```

**排查步驟：**
```bash
# 1. 檢查表是否已存在
wrangler d1 execute DB --local --command "SELECT name FROM sqlite_master WHERE type='table';"

# 2. 檢查 Migrations 狀態
wrangler d1 migrations list DB --local

# 3. 如果表已存在，跳過該 Migration
# 或刪除表後重新執行（謹慎！）
```

**解決方案：**
- 如果是本地測試，可以刪除 `.wrangler/state/v3/d1/` 目錄重新開始
- 如果是生產環境，需要手動調整 Migration 版本號

---

### **問題 2: 廣告頁面 404**

**症狀：**
- 點擊廣告鏈接後顯示 404

**排查步驟：**
```bash
# 1. 檢查 PUBLIC_URL 設置
echo $PUBLIC_URL

# 2. 檢查 ad.html 是否存在
ls -la public/ad.html

# 3. 檢查 wrangler.toml 配置
cat wrangler.toml | grep PUBLIC_URL
```

**解決方案：**
```bash
# 重新部署
pnpm deploy:staging
```

---

### **問題 3: Token 驗證失敗**

**症狀：**
```
Invalid or expired token
```

**排查步驟：**
```bash
# 1. 檢查系統時間
date

# 2. 檢查 Token 生成邏輯
grep -A 10 "generateAdToken" src/domain/ad_reward.ts

# 3. 檢查 Token 有效期
grep "AD_TOKEN_EXPIRY" src/telegram/handlers/ad_reward.ts
```

**解決方案：**
- Token 有效期為 10 分鐘
- 確保系統時間正確
- 如果超時，重新生成 Token

---

### **問題 4: 沒收到完成通知**

**症狀：**
- 廣告播放完成，但沒有收到 Telegram 通知

**排查步驟：**
```bash
# 1. 檢查 API 端點
curl -X POST "{PUBLIC_URL}/api/ad/complete?user={userId}&token={token}&provider=gigapub"

# 2. 查看日誌
wrangler tail --env staging

# 3. 檢查數據庫
wrangler d1 execute DB --env staging --command "SELECT * FROM ad_rewards WHERE user_id = '{userId}' ORDER BY created_at DESC LIMIT 1;"
```

**解決方案：**
- 檢查 API 端點是否正確
- 檢查 Token 是否有效
- 檢查日誌中的錯誤訊息

---

## ✅ **最終驗收清單**

### **必須通過的測試（核心功能）：**

- [ ] **A1. 基本觀看流程** - 完整流程正常運作
- [ ] **A2. 每日限制** - 20 次限制正常
- [ ] **B1. 創建測試廣告** - 廣告創建成功
- [ ] **B2. 文字廣告** - 領取獎勵正常
- [ ] **B3. 鏈接廣告** - 鏈接正確打開

### **建議通過的測試（重要功能）：**

- [ ] **A3. VIP 用戶** - VIP 無法看廣告
- [ ] **B4. 群組廣告** - 驗證機制正常
- [ ] **A4. 錯誤處理** - 錯誤正確處理

### **可選的測試（輔助功能）：**

- [ ] **C1. 事件追蹤** - 事件正確記錄
- [ ] **C2. 會話追蹤** - 會話數據準確
- [ ] **D1. 每日報表** - 報表正常生成
- [ ] **D2. 廣告效果報表** - 報表數據完整

---

## 📞 **需要幫助？**

如果遇到問題，請檢查：

1. **日誌輸出**
   ```bash
   wrangler tail --env staging
   ```

2. **數據庫狀態**
   ```bash
   wrangler d1 execute DB --env staging --command "SELECT * FROM ad_rewards ORDER BY created_at DESC LIMIT 5;"
   ```

3. **環境變數**
   ```bash
   wrangler secret list --env staging
   ```

---

**最後更新**: 2025-01-18  
**版本**: 1.0  
**作者**: XunNi Team

