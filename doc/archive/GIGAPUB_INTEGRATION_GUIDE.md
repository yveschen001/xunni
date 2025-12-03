# GigaPub 廣告整合指南

## 📋 整合概覽

已成功整合 **GigaPub** (Project ID: 4406) 作為 XunNi 的主要視頻廣告提供商。

---

## ✅ 已完成的配置

### 1. **GigaPub Script 載入**

在 `public/ad.html` 中已添加：

```html
<!-- GigaPub Ad Script -->
<script src="https://ad.gigapub.tech/script?id=4406"></script>
```

### 2. **廣告播放邏輯**

實現了 `startGigaPubAd()` 函數：

```javascript
async function startGigaPubAd() {
  try {
    // Show loading state
    const container = document.getElementById('adContainer');
    container.innerHTML = `
      <div class="loading">
        <div class="loading-spinner"></div>
        <p>正在加載 GigaPub 廣告...</p>
      </div>
    `;

    // Call GigaPub showGiga()
    await window.showGiga();

    // Ad completed successfully
    onAdComplete();

  } catch (error) {
    console.error('GigaPub ad error:', error);
    showError('廣告加載失敗', error.message || '請稍後再試');
    reportError(`GigaPub error: ${error.message || 'Unknown'}`);
  }
}
```

### 3. **數據庫配置**

已在 `ad_providers` 表中添加 GigaPub 提供商：

| 欄位 | 值 |
|------|-----|
| `provider_name` | `gigapub` |
| `provider_display_name` | `GigaPub` |
| `is_enabled` | `1` (啟用) |
| `priority` | `100` (最高優先級) |
| `weight` | `100` (100% 權重) |
| `script_url` | `https://ad.gigapub.tech/script?id=4406` |
| `fallback_script_urls` | `["https://ru-ad.gigapub.tech/script?id=4406"]` |
| `config` | `{"project_id": "4406"}` |

---

## 🔄 工作流程

### 用戶觀看廣告流程

```
1. 用戶在 Bot 中點擊「觀看廣告」
   ↓
2. Bot 生成廣告 URL：
   https://xunni-bot-staging.yves221.workers.dev/ad.html?provider=gigapub&token={token}&user={userId}
   ↓
3. 用戶打開廣告頁面
   ↓
4. 頁面載入 GigaPub Script (id=4406)
   ↓
5. 調用 window.showGiga()
   ↓
6. GigaPub 顯示視頻廣告
   ↓
7. 用戶完成觀看
   ↓
8. 調用 onAdComplete()
   ↓
9. 發送 POST 請求到 /api/ad/complete
   ↓
10. Bot 驗證並發放獎勵 (+1 瓶子)
```

---

## 🧪 測試方法

### 方法 1：通過 Bot 測試（推薦）

1. 在 Telegram 中打開 Bot
2. 用完今日配額
3. 點擊「觀看廣告」按鈕
4. 完成廣告觀看
5. 確認獲得 +1 瓶子

### 方法 2：直接測試廣告頁面

1. 獲取測試 URL：
   ```
   https://xunni-bot-staging.yves221.workers.dev/ad.html?provider=gigapub&token=test_token_123&user=YOUR_TELEGRAM_ID
   ```

2. 在瀏覽器中打開 URL

3. 觀察：
   - ✅ GigaPub Script 是否成功載入
   - ✅ `window.showGiga` 是否可用
   - ✅ 廣告是否正常播放
   - ✅ 完成後是否顯示成功頁面

### 方法 3：檢查 Cloudflare Logs

```bash
# 查看廣告請求日誌
pnpm wrangler tail --env staging --format pretty
```

查找：
- `[Ad] Starting ad for user`
- `[Ad] Ad completed successfully`
- `[Ad] Reward granted`

---

## 📊 監控與分析

### 查看 GigaPub 統計

```sql
-- 查看 GigaPub 提供商統計
SELECT 
  provider_name,
  total_requests,
  total_views,
  total_completions,
  total_errors,
  completion_rate,
  last_success_at
FROM ad_providers 
WHERE provider_name = 'gigapub';
```

### 查看用戶廣告記錄

```sql
-- 查看最近的 GigaPub 廣告記錄
SELECT 
  user_id,
  provider_name,
  reward_granted,
  status,
  created_at
FROM ad_rewards 
WHERE provider_name = 'gigapub'
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 🔧 故障排除

### 問題 1：`window.showGiga is not a function`

**原因**：GigaPub Script 未成功載入

**解決方案**：
1. 檢查網絡連接
2. 確認 Project ID (4406) 是否正確
3. 嘗試使用備用 URL：`https://ru-ad.gigapub.tech/script?id=4406`

### 問題 2：廣告不顯示

**原因**：可能沒有可用的廣告庫存

**解決方案**：
1. 確認 GigaPub 帳號狀態
2. 檢查是否有地區限制
3. 聯繫 GigaPub 支援

### 問題 3：完成後沒有獎勵

**原因**：Token 驗證失敗或用戶不存在

**解決方案**：
1. 檢查 Cloudflare Logs
2. 確認 `AD_REWARD_SECRET` 配置正確
3. 驗證用戶 ID 是否存在於數據庫

---

## 📚 參考資料

- **GigaPub 官方文檔**：https://docs.giga.pub/integration-guide.html
- **XunNi 廣告系統設計**：`@AD_REWARD_SYSTEM_DESIGN.md`
- **廣告 API 文檔**：`@doc/SPEC.md` 第 12 節

---

## 🚀 下一步

### 可選優化

1. **增強可靠性腳本**
   - 使用 GigaPub 提供的增強版腳本（15秒超時 + 自動備用服務器）
   
2. **Fallback 機制**
   - 如果 GigaPub 失敗，自動切換到測試廣告

3. **A/B 測試**
   - 添加其他廣告提供商（Google AdSense, Unity Ads）
   - 使用加權隨機策略分配流量

4. **性能追蹤**
   - 記錄廣告載入時間
   - 追蹤完成率
   - 優化用戶體驗

---

## ✅ 驗收清單

- [x] GigaPub Script 已添加到 `public/ad.html`
- [x] `startGigaPubAd()` 函數已實現
- [x] 數據庫 migration 已執行
- [x] `gigapub` 提供商已配置（Priority 100）
- [x] 已部署到 Staging 環境
- [ ] 手動測試廣告播放
- [ ] 確認獎勵正確發放
- [ ] 檢查 Cloudflare Logs
- [ ] 部署到 Production 環境

---

**最後更新**：2025-11-19  
**狀態**：✅ 已完成整合，待測試

