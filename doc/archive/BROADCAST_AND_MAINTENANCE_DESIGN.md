# 廣播系統與維護模式設計文檔

**創建日期**: 2025-11-17  
**版本**: v1.0

---

## 📋 需求總覽

### 1. 廣播系統
- 管理員可以推送訊息給所有用戶
- 支持批量發送 + 限速
- 支持用戶篩選（VIP/非VIP/全部）

### 2. 維護模式
- 維護時阻止一般用戶登入
- 只允許管理員登入
- 自動推送維護通知（倒數計時）
- 維護結束後自動恢復

### 3. 每日統計
- 自動發送給管理員
- 包含：漂流瓶、對話、註冊、VIP 統計

### 4. 統計 API
- 提供 REST API 查詢統計數據
- 需要認證

---

## 🗄️ 數據庫設計

### 1. `broadcasts` 表（廣播記錄）

```sql
CREATE TABLE IF NOT EXISTS broadcasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 廣播內容
  message TEXT NOT NULL,
  target_type TEXT NOT NULL,  -- 'all', 'vip', 'non_vip'
  
  -- 發送狀態
  status TEXT DEFAULT 'pending',  -- 'pending', 'sending', 'completed', 'failed'
  total_users INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  
  -- 創建者
  created_by TEXT NOT NULL,  -- admin telegram_id
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  -- 完成時間
  started_at TEXT,
  completed_at TEXT
);
```

### 2. `maintenance_mode` 表（維護模式配置）

```sql
CREATE TABLE IF NOT EXISTS maintenance_mode (
  id INTEGER PRIMARY KEY CHECK (id = 1),  -- 單例表
  
  -- 維護狀態
  is_active INTEGER DEFAULT 0,  -- 1 = 維護中, 0 = 正常
  
  -- 維護時間
  start_time TEXT,
  end_time TEXT,
  estimated_duration INTEGER,  -- 預計維護時長（分鐘）
  
  -- 維護訊息
  maintenance_message TEXT,
  
  -- 創建者
  enabled_by TEXT,  -- admin telegram_id
  enabled_at TEXT,
  
  -- 更新時間
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### 3. `daily_stats` 表（每日統計）

```sql
CREATE TABLE IF NOT EXISTS daily_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stat_date TEXT NOT NULL UNIQUE,  -- YYYY-MM-DD
  
  -- 漂流瓶統計
  total_bottles INTEGER DEFAULT 0,
  new_bottles INTEGER DEFAULT 0,
  caught_bottles INTEGER DEFAULT 0,
  
  -- 對話統計
  total_conversations INTEGER DEFAULT 0,
  new_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  new_messages INTEGER DEFAULT 0,
  
  -- 用戶統計
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,  -- 當日活躍
  
  -- VIP 統計
  total_vip INTEGER DEFAULT 0,
  new_vip INTEGER DEFAULT 0,
  
  -- 生成時間
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔧 功能設計

### 1. 廣播系統

#### 管理員命令
```
/broadcast <message>          - 發送給所有用戶
/broadcast_vip <message>      - 只發送給 VIP
/broadcast_non_vip <message>  - 只發送給非 VIP
/broadcast_status             - 查看廣播狀態
```

#### 發送流程
1. 管理員發送廣播命令
2. 創建廣播記錄（status = 'pending'）
3. 查詢目標用戶列表
4. 批量發送（每批 25 個，間隔 1 秒）
5. 更新發送狀態
6. 完成後通知管理員

#### 限速策略
- 每批 25 個用戶
- 批次間隔 1 秒
- 失敗自動重試（最多 3 次）

---

### 2. 維護模式

#### 管理員命令
```
/maintenance_enable <duration> <message>  - 開啟維護模式
/maintenance_disable                      - 關閉維護模式
/maintenance_status                       - 查看維護狀態
```

#### 開啟流程
1. 管理員發送開啟命令
2. 更新 `maintenance_mode` 表
3. 廣播維護通知給所有用戶
4. 阻止一般用戶登入

#### Router 檢查
```typescript
// 在 router.ts 中添加維護模式檢查
if (isMaintenanceMode && !isAdmin) {
  await sendMaintenanceMessage(user);
  return;
}
```

#### 維護通知
```
🛠️ 系統維護通知

伺服器將於 {start_time} 開始維護
預計維護時長：{duration} 分鐘
預計恢復時間：{end_time}

維護期間將無法使用服務，請稍後再試。

感謝您的耐心等待！
```

---

### 3. 每日統計

#### 統計內容
```
📊 XunNi Bot 每日數據報告
日期：{date}

🎈 漂流瓶統計
• 總數：{total_bottles}（+{new_bottles}）
• 昨日新增：{new_bottles}
• 昨日被撿：{caught_bottles}

💬 對話統計
• 總對話數：{total_conversations}（+{new_conversations}）
• 總訊息數：{total_messages}（+{new_messages}）
• 昨日新增訊息：{new_messages}

👥 用戶統計
• 總註冊數：{total_users}（+{new_users}）
• 昨日新增：{new_users}
• 昨日活躍：{active_users}

💎 VIP 統計
• 總 VIP 數：{total_vip}（+{new_vip}）
• 昨日新增：{new_vip}

---
報告生成時間：{timestamp}
```

#### 定時任務
- 每天 00:05 自動生成統計
- 發送給所有管理員
- 保存到 `daily_stats` 表

---

### 4. 統計 API

#### 端點設計
```
GET /api/stats/daily?date=YYYY-MM-DD    - 查詢每日統計
GET /api/stats/summary                  - 查詢總覽統計
GET /api/maintenance/status             - 查詢維護狀態
POST /api/maintenance/enable            - 開啟維護模式
POST /api/maintenance/disable           - 關閉維護模式
```

#### 認證方式
```
Header: X-API-Key: <secret_key>
```

#### 響應格式
```json
{
  "success": true,
  "data": {
    "date": "2025-11-17",
    "total_bottles": 1234,
    "new_bottles": 56,
    ...
  }
}
```

---

## 📁 文件結構

```
src/
├── domain/
│   ├── broadcast.ts          - 廣播業務邏輯
│   ├── maintenance.ts        - 維護模式邏輯
│   └── stats.ts              - 統計計算邏輯
├── services/
│   ├── broadcast.ts          - 廣播服務
│   └── stats.ts              - 統計服務
├── telegram/handlers/
│   ├── broadcast.ts          - 廣播命令處理
│   ├── maintenance.ts        - 維護命令處理
│   └── stats.ts              - 統計命令處理
├── api/
│   ├── stats.ts              - 統計 API
│   └── maintenance.ts        - 維護 API
└── db/migrations/
    └── 0020_create_broadcast_tables.sql
```

---

## 🔐 權限控制

### 廣播系統
- ✅ Super Admin - 可以發送所有類型廣播
- ✅ Admin - 可以發送所有類型廣播
- ❌ 一般用戶 - 無權限

### 維護模式
- ✅ Super Admin - 可以開啟/關閉維護模式
- ❌ Admin - 無權限
- ❌ 一般用戶 - 無權限

### 統計查詢
- ✅ Super Admin - 可以查看所有統計
- ✅ Admin - 可以查看所有統計
- ❌ 一般用戶 - 無權限

### API 訪問
- ✅ 需要 API Key
- ✅ API Key 存儲在環境變數中

---

## 🧪 測試計劃

### 廣播系統測試
1. 發送給所有用戶
2. 發送給 VIP 用戶
3. 發送給非 VIP 用戶
4. 查看廣播狀態
5. 驗證限速機制

### 維護模式測試
1. 開啟維護模式
2. 一般用戶無法登入
3. 管理員可以登入
4. 關閉維護模式
5. 一般用戶恢復登入

### 統計功能測試
1. 自動生成每日統計
2. 發送給管理員
3. API 查詢統計
4. 驗證數據準確性

---

## 📊 實現優先級

### Phase 1: 基礎設施（今天）
1. ✅ 創建數據庫表
2. ✅ 實現 domain 層邏輯
3. ✅ 實現廣播服務

### Phase 2: 管理員功能（今天）
4. ✅ 實現廣播命令
5. ✅ 實現維護模式命令
6. ✅ 實現統計命令

### Phase 3: 自動化（明天）
7. ⏸️ 實現定時任務
8. ⏸️ 實現 API 端點

### Phase 4: 測試與優化（明天）
9. ⏸️ 全面測試
10. ⏸️ 性能優化

---

## 🚀 部署注意事項

1. **環境變數**
   - `STATS_API_KEY` - 統計 API 密鑰
   - `MAINTENANCE_API_KEY` - 維護 API 密鑰

2. **Cron Trigger**
   - 配置每日統計定時任務
   - 時間：00:05 UTC

3. **數據庫遷移**
   - 執行 migration 創建新表

4. **監控**
   - 監控廣播發送成功率
   - 監控維護模式狀態

---

**最後更新**: 2025-11-17  
**作者**: AI Assistant

