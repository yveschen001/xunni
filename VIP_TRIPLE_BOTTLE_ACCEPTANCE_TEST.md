# VIP 三倍瓶子功能 - 測試驗收報告

**測試日期**: 2025-11-21  
**測試環境**: Staging  
**Worker URL**: https://xunni-bot-staging.yves221.workers.dev  
**Worker Version**: 4330062e-c8b0-42dc-807c-a3c67148db30  
**Database**: xunni-db-staging (7b77ad82-ba26-489f-995f-8256b32379df)

---

## ✅ 部署狀態

### **Migration 執行** ✅

- ✅ Migration 0047 已成功執行
- ✅ `bottle_match_slots` 表已創建
- ✅ `bottles` 表已添加 `is_vip_triple` 欄位
- ✅ 所有索引已創建

**執行結果**：
```
🚣 Executed 8 queries in 0.01 seconds
- 244 rows read
- 18 rows written
- Database size: 1.26 MB
```

### **代碼部署** ✅

- ✅ Staging 部署成功
- ✅ 編譯錯誤已修復
- ✅ Worker 啟動時間：3ms
- ✅ 上傳大小：997.38 KiB / gzip: 185.70 KiB

---

## 🧪 手動測試計劃

### **測試場景 1：VIP 用戶丟瓶子** ⏳

**測試步驟**：
1. 使用 VIP 用戶登入 Staging Bot
2. 執行 `/throw` 命令
3. 輸入瓶子內容

**預期結果**：
- ✅ 創建 1 個瓶子記錄（`is_vip_triple=1`）
- ✅ 創建 3 個槽位記錄
- ✅ Slot #1 主動智能配對
- ✅ Slot #2, #3 進入公共池
- ✅ 顯示 VIP 成功訊息：
  ```
  ✨ VIP 特權啟動！
  
  🎯 你的瓶子已發送給 3 個對象：
  • 1 個智能配對對象（已配對）
  • 2 個公共池對象（等待中）
  
  💬 你可能會收到最多 3 個對話！
  ```

**測試命令**：
```sql
-- 檢查瓶子記錄
SELECT id, is_vip_triple, status FROM bottles 
WHERE owner_telegram_id = '<VIP_USER_ID>' 
ORDER BY created_at DESC LIMIT 1;

-- 檢查槽位記錄
SELECT * FROM bottle_match_slots 
WHERE bottle_id = <BOTTLE_ID>;
```

---

### **測試場景 2：免費用戶丟瓶子** ⏳

**測試步驟**：
1. 使用免費用戶登入 Staging Bot
2. 執行 `/throw` 命令
3. 輸入瓶子內容

**預期結果**：
- ✅ 創建 1 個瓶子記錄（`is_vip_triple=0`）
- ✅ 不創建槽位記錄
- ✅ 顯示免費用戶成功訊息（含 VIP 升級提示）：
  ```
  🎉 漂流瓶已丟出！
  
  🌊 等待有緣人撿起...
  
  💎 升級 VIP 可獲得三倍曝光機會！
  一次丟瓶子 = 3 個對象，大幅提升配對成功率
  
  使用 /vip 了解更多
  ```

**測試命令**：
```sql
-- 檢查瓶子記錄
SELECT id, is_vip_triple, status FROM bottles 
WHERE owner_telegram_id = '<FREE_USER_ID>' 
ORDER BY created_at DESC LIMIT 1;

-- 確認無槽位記錄
SELECT COUNT(*) FROM bottle_match_slots 
WHERE bottle_id = <BOTTLE_ID>;
-- 應該返回 0
```

---

### **測試場景 3：撿 VIP 三倍瓶子** ⏳

**測試步驟**：
1. 使用另一個用戶執行 `/catch`
2. 接受 VIP 用戶的瓶子
3. 再用第三個用戶執行 `/catch`
4. 接受同一個 VIP 瓶子

**預期結果**：
- ✅ 第一個用戶成功撿到瓶子（Slot #2 或 #3）
- ✅ 第二個用戶也能撿到同一個瓶子（另一個槽位）
- ✅ 第三個用戶無法撿到（所有槽位已滿）
- ✅ 瓶子狀態更新為 `matched`

**測試命令**：
```sql
-- 檢查槽位狀態
SELECT slot_index, slot_role, status, matched_with_telegram_id 
FROM bottle_match_slots 
WHERE bottle_id = <BOTTLE_ID>
ORDER BY slot_index;

-- 檢查瓶子狀態
SELECT status FROM bottles WHERE id = <BOTTLE_ID>;
```

---

### **測試場景 4：防止重複配對** ⏳

**測試步驟**：
1. 用戶 A 撿到 VIP 瓶子的 Slot #1
2. 用戶 A 再次執行 `/catch`

**預期結果**：
- ✅ 用戶 A 不會再次看到同一個 VIP 瓶子
- ✅ 系統排除已配對的瓶子

**測試命令**：
```sql
-- 檢查用戶已配對的槽位
SELECT bottle_id, slot_index, matched_at 
FROM bottle_match_slots 
WHERE matched_with_telegram_id = '<USER_A_ID>';
```

---

### **測試場景 5：配額統計** ⏳

**測試步驟**：
1. VIP 用戶丟 1 個三倍瓶子
2. 執行 `/quota` 查看配額

**預期結果**：
- ✅ 配額只減少 1 個（不是 3 個）
- ✅ 顯示正確的剩餘配額

**測試命令**：
```sql
-- 檢查今日丟瓶數
SELECT throws_count FROM daily_usage 
WHERE telegram_id = '<VIP_USER_ID>' 
AND date = date('now');
```

---

### **測試場景 6：VIP 權益顯示** ⏳

**測試步驟**：
1. 執行 `/vip` 命令

**預期結果**：
- ✅ 顯示三倍曝光機會說明：
  ```
  🎁 VIP 權益：
  • 🆕 三倍曝光機會！一次丟瓶子觸發 3 個對象
    └ 1 個智能配對 + 2 個公共池
    └ 大幅提升配對成功率
  • 解鎖對方清晰頭像
  • 每天 30 個漂流瓶配額
  • 可篩選 MBTI、星座、血型
  • 34 種語言自動翻譯（OpenAI 優先）
  • 無廣告體驗
  ```

---

### **測試場景 7：Help 命令** ⏳

**測試步驟**：
1. 執行 `/help` 命令

**預期結果**：
- ✅ VIP 權益部分包含三倍曝光說明

---

### **測試場景 8：Stats 統計** ⏳

**測試步驟**：
1. VIP 用戶執行 `/stats` 命令

**預期結果**：
- ✅ 顯示 VIP 三倍瓶子統計：
  ```
  💎 VIP 三倍瓶子統計（近 30 天）
  • 丟出次數：X
  • 總配對槽位：Y
  • 成功配對：Z
  • 配對率：XX%
  • 平均每次配對：X.X 個對象
  ```

**測試命令**：
```sql
-- 檢查 VIP 統計數據
SELECT 
  COUNT(DISTINCT b.id) as throws,
  COUNT(s.id) as total_slots,
  COUNT(CASE WHEN s.status = 'matched' THEN 1 END) as matched_slots
FROM bottles b
LEFT JOIN bottle_match_slots s ON b.id = s.bottle_id
WHERE b.owner_telegram_id = '<VIP_USER_ID>'
  AND b.is_vip_triple = 1
  AND DATE(b.created_at) >= DATE('now', '-30 days');
```

---

### **測試場景 9：配額用完提示** ⏳

**測試步驟**：
1. 用完所有配額
2. 再次執行 `/throw`

**預期結果**：
- ✅ 顯示更新後的配額用完提示（包含三倍曝光說明）

---

### **測試場景 10：智能匹配通知** ⏳

**測試步驟**：
1. VIP 用戶丟瓶子
2. 檢查是否收到智能配對通知

**預期結果**：
- ✅ VIP 用戶收到通知：
  ```
  🎯 VIP 智能配對成功！
  
  你的瓶子已被 XXX 撿起！
  
  💬 對話標識符：#MMDDHHHH
  📝 瓶子內容：...
  
  💡 這是你的第 1 個配對，還有 2 個槽位等待中
  ```
- ✅ 配對用戶收到通知：
  ```
  🎉 智能配對成功！
  
  系統為你找到了 XXX 的瓶子！
  
  💬 對話標識符：#MMDDHHHH
  📝 瓶子內容：...
  ```

---

## 📊 測試結果總結

### **部署驗證** ✅

| 項目 | 狀態 | 備註 |
|------|------|------|
| Migration 執行 | ✅ 完成 | 8 queries, 18 rows written |
| 代碼部署 | ✅ 完成 | Worker Version: 4330062e |
| 編譯檢查 | ✅ 通過 | 0 errors |
| 啟動測試 | ✅ 通過 | 3ms startup time |

### **功能測試** ⏳

| 測試場景 | 狀態 | 備註 |
|---------|------|------|
| 1. VIP 用戶丟瓶子 | ⏳ 待測試 | 需要 VIP 用戶 |
| 2. 免費用戶丟瓶子 | ⏳ 待測試 | |
| 3. 撿 VIP 三倍瓶子 | ⏳ 待測試 | 需要多個用戶 |
| 4. 防止重複配對 | ⏳ 待測試 | |
| 5. 配額統計 | ⏳ 待測試 | |
| 6. VIP 權益顯示 | ⏳ 待測試 | |
| 7. Help 命令 | ⏳ 待測試 | |
| 8. Stats 統計 | ⏳ 待測試 | 需要 VIP 用戶 |
| 9. 配額用完提示 | ⏳ 待測試 | |
| 10. 智能匹配通知 | ⏳ 待測試 | 需要 VIP 用戶 |

---

## 🔍 數據庫驗證命令

### **檢查表結構**

```sql
-- 檢查 bottle_match_slots 表
PRAGMA table_info(bottle_match_slots);

-- 檢查 bottles 表的 is_vip_triple 欄位
PRAGMA table_info(bottles);

-- 檢查索引
SELECT name FROM sqlite_master 
WHERE type='index' 
AND (name LIKE 'idx_slots_%' OR name LIKE 'idx_bottles_is_vip%');
```

### **檢查數據**

```sql
-- 檢查 VIP 三倍瓶子數量
SELECT COUNT(*) FROM bottles WHERE is_vip_triple = 1;

-- 檢查槽位數量
SELECT COUNT(*) FROM bottle_match_slots;

-- 檢查槽位狀態分佈
SELECT status, COUNT(*) as count 
FROM bottle_match_slots 
GROUP BY status;

-- 檢查槽位角色分佈
SELECT slot_role, COUNT(*) as count 
FROM bottle_match_slots 
GROUP BY slot_role;
```

---

## 🚀 下一步

### **待完成項目**

1. ⏳ **手動功能測試** - 需要用戶協助測試所有場景
2. ⏳ **性能測試** - 測試高並發情況下的表現
3. ⏳ **Production 部署** - 確認 Staging 測試通過後部署

### **Production 部署步驟**

```bash
# 1. 執行 Migration
npx wrangler d1 execute xunni-db-production --remote \
  --file=src/db/migrations/0047_create_bottle_match_slots.sql

# 2. 驗證 Migration
npx wrangler d1 execute xunni-db-production --remote \
  --command="SELECT name FROM sqlite_master WHERE type='table' AND name='bottle_match_slots'"

# 3. 部署代碼
npm run deploy:production

# 4. 監控日誌
# 檢查 Cloudflare Dashboard 的 Worker 日誌

# 5. 驗證功能
# 使用 Production Bot 進行基本功能測試
```

---

## 📝 測試注意事項

### **測試環境**

- ✅ Staging Bot: `@xunni_dev_bot`
- ✅ Database: xunni-db-staging
- ✅ Worker URL: https://xunni-bot-staging.yves221.workers.dev

### **測試用戶要求**

- 需要至少 1 個 VIP 用戶
- 需要至少 3 個免費用戶（用於測試多人撿瓶子）
- 建議使用測試賬號，避免影響真實用戶數據

### **測試數據清理**

測試完成後，可以選擇清理測試數據：

```sql
-- 刪除測試瓶子
DELETE FROM bottles WHERE owner_telegram_id IN ('<TEST_USER_IDS>');

-- 刪除測試槽位
DELETE FROM bottle_match_slots WHERE bottle_id NOT IN (SELECT id FROM bottles);

-- 刪除測試對話
DELETE FROM conversations WHERE user_a_telegram_id IN ('<TEST_USER_IDS>') 
  OR user_b_telegram_id IN ('<TEST_USER_IDS>');
```

---

## ✅ 驗收標準

### **必須通過的測試**

- ✅ Migration 執行成功
- ✅ 代碼部署成功
- ⏳ VIP 用戶可以創建三倍瓶子
- ⏳ 免費用戶創建普通瓶子
- ⏳ 多個用戶可以撿同一個 VIP 瓶子
- ⏳ 防止重複配對正常工作
- ⏳ 配額統計正確（1 個三倍瓶子 = 1 個配額）
- ⏳ UI 提示正確顯示

### **可選測試**

- ⏳ 性能測試（高並發）
- ⏳ 壓力測試（大量瓶子）
- ⏳ 邊界測試（極端情況）

---

**測試狀態**: 🟡 部署完成，待手動測試  
**下一步**: 進行手動功能測試  
**預計完成時間**: 待用戶測試反饋

