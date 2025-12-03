# 測試與驗收指南

## 📋 **目錄**

1. [自動化測試](#自動化測試)
2. [人工驗收清單](#人工驗收清單)
3. [部署前檢查](#部署前檢查)
4. [常見問題排查](#常見問題排查)

---

## 🤖 **自動化測試**

### **Step 1: 執行 Linter**

```bash
# 檢查代碼風格和錯誤
pnpm lint

# 預期結果：0 錯誤，0 警告
```

**如果有錯誤：**
- 查看錯誤訊息
- 修復代碼風格問題
- 重新執行 lint

### **Step 2: 執行單元測試**

```bash
# 執行所有測試
pnpm test

# 預期結果：所有測試通過
```

**測試覆蓋率目標：**
- Domain 層：90%+
- Utils 層：80%+
- Handlers 層：60%+

### **Step 3: 類型檢查**

```bash
# TypeScript 類型檢查
pnpm type-check

# 預期結果：0 類型錯誤
```

---

## 👨‍💼 **人工驗收清單**

### **A. 數據庫 Migrations（必須驗收）**

#### **A1. 執行 Migrations**

```bash
# 本地測試
wrangler d1 migrations apply DB --local

# 檢查表結構
wrangler d1 execute DB --local --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

**驗收標準：**
- ✅ 所有 11 個新表創建成功
- ✅ 沒有 SQL 錯誤
- ✅ 表結構正確

**需要驗證的表：**
1. `ad_rewards` - 廣告獎勵表
2. `ad_providers` - 廣告提供商表
3. `ad_provider_logs` - 廣告日誌表
4. `official_ads` - 官方廣告表
5. `official_ad_views` - 官方廣告觀看記錄
6. `analytics_events` - 分析事件表
7. `user_sessions` - 用戶會話表
8. `daily_user_summary` - 每日用戶摘要表
9. `funnel_events` - 漏斗事件表
10. `quota_prompt_variants` - 額度提示變體表（可選）
11. `quota_prompt_impressions` - 額度提示展示記錄（可選）

#### **A2. 初始化數據**

```bash
# 初始化廣告提供商
wrangler d1 execute DB --local --file=./scripts/init-ad-providers.sql

# 驗證數據
wrangler d1 execute DB --local --command "SELECT * FROM ad_providers;"
```

**驗收標準：**
- ✅ GigaPub 提供商創建成功
- ✅ is_enabled = 1
- ✅ priority = 100

---

### **B. 第三方視頻廣告系統（核心功能）**

#### **B1. 觀看廣告流程**

**測試步驟：**

1. **註冊測試用戶**
   ```
   發送：/start
   完成註冊流程
   ```

2. **觸發廣告提示**
   ```
   方式 1：用完每日額度後嘗試丟瓶子
   方式 2：直接點擊「觀看廣告」按鈕（如果有）
   ```

3. **點擊「觀看廣告」**
   ```
   預期：收到廣告頁面鏈接
   格式：{PUBLIC_URL}/ad.html?provider=gigapub&token={token}&user={userId}
   ```

4. **打開廣告頁面**
   ```
   預期：
   - 頁面正常顯示
   - 顯示「正在加載廣告...」
   - 開始 15 秒倒計時
   - 進度條動畫
   ```

5. **等待廣告完成**
   ```
   預期：
   - 15 秒後顯示「觀看完成！」
   - 顯示「恭喜你獲得 +1 個額度」
   - 可以關閉頁面
   ```

6. **返回 Telegram**
   ```
   預期：收到完成通知
   內容：
   - 🎉 廣告觀看完成！
   - ✅ 獲得 +1 個額度
   - 📊 今日已觀看：X/20 次
   - 🎁 今日已獲得：X 個額度
   ```

7. **驗證額度增加**
   ```
   發送：/throw
   預期：可以丟瓶子（額度 +1）
   ```

**驗收標準：**
- ✅ 廣告頁面正常顯示
- ✅ 倒計時正常運作
- ✅ 完成後收到通知
- ✅ 額度正確增加 +1
- ✅ 統計數據正確更新

#### **B2. 每日限制測試**

**測試步驟：**

1. **連續觀看 20 次廣告**
   ```
   重複 B1 步驟 20 次
   ```

2. **嘗試觀看第 21 次**
   ```
   點擊「觀看廣告」
   預期：收到提示「今日廣告已達上限（20/20）」
   ```

**驗收標準：**
- ✅ 可以觀看 20 次
- ✅ 第 21 次被阻止
- ✅ 提示訊息正確

#### **B3. VIP 用戶測試**

**測試步驟：**

1. **將測試用戶設為 VIP**
   ```sql
   UPDATE users SET is_vip = 1 WHERE telegram_id = '{test_user_id}';
   ```

2. **嘗試觀看廣告**
   ```
   點擊「觀看廣告」
   預期：收到提示「VIP 用戶無需觀看廣告」
   ```

**驗收標準：**
- ✅ VIP 用戶無法觀看廣告
- ✅ 提示訊息正確

---

### **C. 官方廣告系統（核心功能）**

#### **C1. 創建測試廣告**

```sql
-- 文字廣告
INSERT INTO official_ads (ad_type, title, content, reward_quota, is_enabled)
VALUES ('text', '測試文字廣告', '這是一個測試廣告，點擊領取 +1 永久額度！', 1, 1);

-- 鏈接廣告
INSERT INTO official_ads (ad_type, title, content, url, reward_quota, is_enabled)
VALUES ('link', '訪問官網', '訪問 XunNi 官網了解更多功能', 'https://example.com', 1, 1);

-- 群組廣告（需要驗證）
INSERT INTO official_ads (ad_type, title, content, url, target_entity_id, reward_quota, requires_verification, is_enabled)
VALUES ('group', '加入官方群組', '加入 XunNi 官方群組，與其他用戶交流', 'https://t.me/xunni_group', '-1001234567890', 2, 1, 1);
```

#### **C2. 文字廣告測試**

**測試步驟：**

1. **查看官方廣告**
   ```
   點擊「查看官方廣告」按鈕
   預期：顯示文字廣告內容
   ```

2. **領取獎勵**
   ```
   點擊「領取獎勵」按鈕
   預期：
   - 收到成功訊息
   - 顯示「獲得 +1 個永久額度」
   ```

3. **驗證額度**
   ```
   檢查用戶的 permanent_quota 字段
   預期：增加 1
   ```

4. **再次查看**
   ```
   再次點擊「查看官方廣告」
   預期：不再顯示已領取的廣告
   ```

**驗收標準：**
- ✅ 廣告正常顯示
- ✅ 獎勵正確發放
- ✅ 永久額度增加
- ✅ 不會重複顯示

#### **C3. 群組廣告測試（需要驗證）**

**測試步驟：**

1. **查看群組廣告**
   ```
   顯示群組廣告內容
   預期：有「加入群組」和「驗證並領取」按鈕
   ```

2. **點擊「加入群組」**
   ```
   預期：打開 Telegram 群組鏈接
   ```

3. **加入群組後點擊「驗證並領取」**
   ```
   預期：
   - Bot 驗證用戶是否在群組中
   - 如果在，發放獎勵
   - 如果不在，提示「請先加入群組」
   ```

**驗收標準：**
- ✅ 驗證機制正常運作
- ✅ 只有加入群組才能領取
- ✅ 獎勵正確發放

---

### **D. 數據追蹤系統（可選驗收）**

#### **D1. 事件追蹤測試**

**測試步驟：**

1. **執行用戶操作**
   ```
   - 註冊新用戶
   - 丟瓶子
   - 觀看廣告
   - 邀請朋友
   ```

2. **檢查事件記錄**
   ```sql
   SELECT * FROM analytics_events 
   WHERE user_id = '{test_user_id}' 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

**驗收標準：**
- ✅ 事件正確記錄
- ✅ event_type 正確
- ✅ event_data 完整

#### **D2. 會話追蹤測試**

**測試步驟：**

1. **檢查會話記錄**
   ```sql
   SELECT * FROM user_sessions 
   WHERE user_id = '{test_user_id}' 
   ORDER BY session_start DESC 
   LIMIT 5;
   ```

**驗收標準：**
- ✅ 會話正確創建
- ✅ 統計數據準確

---

### **E. 報表系統（管理員功能）**

#### **E1. 每日報表測試**

**測試步驟：**

1. **以管理員身份登入**
   ```sql
   UPDATE users SET is_super_admin = 1 WHERE telegram_id = '{admin_user_id}';
   ```

2. **查看報表**
   ```
   發送：/analytics
   預期：收到每日運營報表
   ```

**驗收標準：**
- ✅ 報表正常生成
- ✅ 數據格式正確
- ✅ 統計數據準確

#### **E2. 廣告效果報表**

**測試步驟：**

1. **查看廣告報表**
   ```
   發送：/ad_performance
   預期：收到廣告效果報表
   ```

**驗收標準：**
- ✅ 顯示第三方廣告數據
- ✅ 顯示官方廣告數據
- ✅ 顯示提供商對比

---

## 🚀 **部署前檢查**

### **1. 代碼檢查**

- [ ] 所有 Lint 錯誤已修復
- [ ] 所有測試通過
- [ ] 沒有 console.log（只允許 console.error）
- [ ] 沒有未使用的導入
- [ ] 沒有 TODO 註釋（或已記錄）

### **2. 環境變數檢查**

```bash
# 檢查 wrangler.toml
cat wrangler.toml

# 確認以下變數已設置：
# - TELEGRAM_BOT_TOKEN
# - PUBLIC_URL
# - ENABLE_ANALYTICS (可選，默認 true)
# - AD_PROVIDER_STRATEGY (可選，默認 priority)
```

### **3. 數據庫檢查**

```bash
# 檢查 Migrations 狀態
wrangler d1 migrations list DB --env staging

# 確認所有 Migrations 已執行
```

### **4. 依賴檢查**

```bash
# 檢查依賴是否最新
pnpm outdated

# 檢查安全漏洞
pnpm audit
```

---

## 🔧 **常見問題排查**

### **問題 1: Migrations 執行失敗**

**症狀：**
```
Error: table already exists
```

**解決方案：**
```bash
# 檢查表是否已存在
wrangler d1 execute DB --local --command "SELECT name FROM sqlite_master WHERE type='table';"

# 如果表已存在，跳過該 Migration
# 或刪除表後重新執行（謹慎！）
```

### **問題 2: 廣告頁面無法打開**

**症狀：**
- 點擊廣告鏈接後 404

**解決方案：**
```bash
# 檢查 PUBLIC_URL 設置
echo $PUBLIC_URL

# 檢查 ad.html 是否存在
ls -la public/ad.html

# 重新部署
pnpm deploy:staging
```

### **問題 3: 廣告完成後沒有收到通知**

**症狀：**
- 廣告播放完成，但沒有收到 Telegram 通知

**解決方案：**
```bash
# 檢查 API 端點
curl -X POST "{PUBLIC_URL}/api/ad/complete?user={userId}&token={token}&provider=gigapub"

# 檢查日誌
wrangler tail --env staging
```

### **問題 4: Token 驗證失敗**

**症狀：**
```
Invalid or expired token
```

**解決方案：**
- Token 有效期為 10 分鐘
- 檢查系統時間是否正確
- 重新生成 Token

---

## ✅ **最終驗收清單**

### **必須通過的測試：**

- [ ] **A. 數據庫 Migrations** - 所有表創建成功
- [ ] **B1. 觀看廣告流程** - 完整流程正常運作
- [ ] **B2. 每日限制** - 20 次限制正常
- [ ] **C1. 文字廣告** - 領取獎勵正常
- [ ] **C2. 永久額度** - 額度正確增加

### **建議通過的測試：**

- [ ] **B3. VIP 用戶** - VIP 無法看廣告
- [ ] **C3. 群組廣告** - 驗證機制正常
- [ ] **D1. 事件追蹤** - 事件正確記錄
- [ ] **E1. 每日報表** - 報表正常生成

### **可選的測試：**

- [ ] **D2. 會話追蹤** - 會話數據準確
- [ ] **E2. 廣告效果報表** - 報表數據完整

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

