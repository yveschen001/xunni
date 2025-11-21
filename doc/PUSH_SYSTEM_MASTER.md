# XunNi 推送系統總覽

> **最後更新**：2025-11-21  
> **版本**：v1.0  
> **目的**：統一管理所有推送相關功能的文檔索引

---

## 📋 系統架構

XunNi 的推送系統分為三大模組：

```
┌─────────────────────────────────────────────────────────────┐
│                    XunNi 推送系統架構                        │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼──────┐  ┌────────▼────────┐
│  人工廣播系統   │  │ 自動化推送   │  │  事件觸發推送    │
│  (Broadcast)   │  │ (Scheduled)  │  │  (Event-based)  │
└────────────────┘  └──────────────┘  └─────────────────┘
│                   │                   │
│ • 管理員手動發送   │ • Cron 定時觸發   │ • 匹配成功即時推送│
│ • 精準過濾用戶     │ • 丟瓶/撿瓶提醒   │ • VIP 到期提醒    │
│ • 支援組合條件     │ • 對話提醒        │ • 系統通知        │
│ • 生日祝福接口     │ • Onboarding 提醒 │                  │
└────────────────┘  └──────────────┘  └─────────────────┘
```

---

## 📚 文檔索引

### 1. 人工廣播系統（已實現 ✅）

**文檔位置**：[`doc/BROADCAST_SYSTEM_DESIGN.md`](./BROADCAST_SYSTEM_DESIGN.md)

**功能概述**：
- 超級管理員手動發送廣播訊息
- 支援精準過濾（性別、星座、國家、年齡、MBTI）
- 支援組合過濾（如：女生 + 18-25 歲 + 台灣）
- **預留自動化接口**（如：生日祝福）

**核心指令**：
```bash
/broadcast <message>                    # 推送給所有用戶
/broadcast_vip <message>                # 推送給 VIP 用戶
/broadcast_non_vip <message>            # 推送給非 VIP 用戶
/broadcast_filter <filters> <message>   # 精準過濾推送（新功能）
/broadcast_status [id]                  # 查看廣播狀態
```

**實現狀態**：
- ✅ 基礎廣播（all, vip, non_vip）
- ⏳ 精準過濾（待實施）
- ⏳ 自動化接口（待實施）

**相關檔案**：
- `src/telegram/handlers/broadcast.ts` - 指令處理
- `src/services/broadcast.ts` - 廣播服務
- `src/domain/broadcast.ts` - 業務邏輯
- `src/domain/broadcast_filters.ts` - 過濾器（待建立）

---

### 2. 自動化推送系統（部分實現 ⚠️）

**文檔位置**：[`doc/PUSH_NOTIFICATIONS.md`](./PUSH_NOTIFICATIONS.md)

**功能概述**：
- Cron 定時觸發的推送提醒
- 根據用戶活躍度智能調整推送頻率
- 尊重用戶的推送偏好設定（安靜時段）

**推送類型**：

| 推送類型 | 觸發條件 | 頻率 | 狀態 |
|---------|---------|------|------|
| 丟瓶提醒 | 24 小時未丟瓶 | 每天 1 次 | ❌ 未實現 |
| 撿瓶提醒 | 12 小時未撿瓶 | 每天 2 次 | ❌ 未實現 |
| 對話提醒 | 2 小時未回覆 | 每 4 小時 1 次 | ❌ 未實現 |
| Onboarding 提醒 | 24 小時未完成 | 每天 1 次 | ❌ 未實現 |
| 測驗分享提醒 | 完成測驗未分享 | 2 小時後 | ❌ 未實現 |

**實現狀態**：
- ❌ Cron 定時任務（未實現）
- ❌ 推送偏好設定（未實現）
- ❌ 活躍度分級（未實現）

**相關檔案**：
- `src/telegram/handlers/cron_push.ts` - Cron 處理（待建立）
- `src/services/push_notifications.ts` - 推送服務（待建立）
- `src/db/migrations/XXXX_create_push_tables.sql` - 資料表（待建立）

**與廣播系統的關係**：
- 💡 **可復用廣播系統的 Filter 引擎**：定時推送可以調用 `getFilteredUserIds` 函數
- 💡 **可復用發送器**：使用 `processBroadcast` 處理分批發送和錯誤處理

---

### 3. 事件觸發推送（已實現 ✅）

**功能概述**：
- 由特定事件即時觸發的推送
- 不受定時任務限制，立即發送

**推送類型**：

| 推送類型 | 觸發事件 | 實現位置 | 狀態 |
|---------|---------|---------|------|
| 匹配成功推送 | 有人撿到瓶子 | `src/telegram/handlers/catch.ts:444-492` | ✅ 已實現 |
| VIP 到期提醒 | VIP 即將到期 | `src/services/subscription_checker.ts:70-95` | ✅ 已實現 |
| 系統通知 | 管理員操作 | 各 handler 中 | ✅ 已實現 |

**實現狀態**：
- ✅ 匹配成功推送（已完成）
- ✅ VIP 到期提醒（已完成）

---

## 🔄 系統整合設計

### 統一推送接口

所有推送類型（人工、自動、事件）都可以復用以下核心模組：

```typescript
// 1. Filter 引擎（過濾目標用戶）
getFilteredUserIds(filters: BroadcastFilters): Promise<string[]>

// 2. Batch Sender（分批發送）
processBroadcast(broadcastId: number): Promise<void>

// 3. Error Handler（錯誤分類）
handleBroadcastError(userId: string, error: Error): Promise<void>
```

### 整合範例：生日祝福

**方案 A：使用廣播系統接口**（推薦）

```typescript
// src/worker.ts (Cron Handler)
async function handleBirthdayGreetings(env: Env) {
  // 調用廣播系統的 Filter 引擎
  const birthdayFilter: BroadcastFilters = {
    is_birthday: true
  };
  
  // 調用廣播系統的發送器
  await createFilteredBroadcast(
    env,
    "🎂 祝你生日快樂！",
    birthdayFilter,
    'SYSTEM'
  );
}
```

**方案 B：獨立實現**（不推薦，會重複造輪子）

```typescript
// ❌ 不推薦：重複實現過濾和發送邏輯
async function handleBirthdayGreetings(env: Env) {
  const users = await db.query(`SELECT * FROM users WHERE ...`);
  for (const user of users) {
    await telegram.sendMessage(user.telegram_id, "...");
  }
}
```

---

## 📊 功能狀態總覽

| 模組 | 功能 | 狀態 | 優先級 | 預估工時 |
|------|------|------|--------|---------|
| **人工廣播** | 基礎廣播（all/vip/non_vip） | ✅ 已實現 | - | - |
| **人工廣播** | 精準過濾（gender/age/country） | ⏳ 待實施 | P0 | 2-3 天 |
| **人工廣播** | 自動化接口（is_birthday） | ⏳ 待實施 | P1 | 1 天 |
| **自動化推送** | 丟瓶/撿瓶提醒 | ❌ 未實現 | P1 | 2 天 |
| **自動化推送** | 對話提醒 | ❌ 未實現 | P2 | 1 天 |
| **自動化推送** | Onboarding 提醒 | ❌ 未實現 | P2 | 1 天 |
| **事件推送** | 匹配成功推送 | ✅ 已實現 | - | - |
| **事件推送** | VIP 到期提醒 | ✅ 已實現 | - | - |

---

## 🚀 實施建議

### 階段 1：完善人工廣播（1 週）

1. ✅ 實現精準過濾（`/broadcast_filter`）
2. ✅ 實現過濾器解析（`broadcast_filters.ts`）
3. ✅ 測試所有過濾維度
4. ✅ 部署到 Production

### 階段 2：實現自動化接口（3 天）

1. ✅ 在 Filter 中新增 `is_birthday` 參數
2. ✅ 實現生日祝福 Cron Job
3. ✅ 測試自動化推送
4. ✅ 監控推送效果

### 階段 3：實現定時推送（1 週）

1. ⏳ 實現丟瓶/撿瓶提醒
2. ⏳ 實現推送偏好設定
3. ⏳ 實現活躍度分級
4. ⏳ 測試推送效果

### 階段 4：未來升級（待定）

1. ⏸️ 大規模廣播系統（>100 用戶）
2. ⏸️ 隊列系統（Cloudflare Queues）
3. ⏸️ 推送效果 A/B 測試

---

## 📖 相關文檔

### 核心文檔
- [`doc/BROADCAST_SYSTEM_DESIGN.md`](./BROADCAST_SYSTEM_DESIGN.md) - 人工廣播系統設計
- [`doc/PUSH_NOTIFICATIONS.md`](./PUSH_NOTIFICATIONS.md) - 自動化推送系統設計

### 參考文檔
- [`BROADCAST_SYSTEM_REDESIGN.md`](../BROADCAST_SYSTEM_REDESIGN.md) - 大規模廣播重構方案（未來參考）
- [`BROADCAST_AND_MAINTENANCE_DESIGN.md`](../BROADCAST_AND_MAINTENANCE_DESIGN.md) - 初版設計（已過時，可歸檔）

### 其他相關文檔
- [`doc/I18N_GUIDE.md`](./I18N_GUIDE.md) - 多語言推送必讀
- [`doc/DEVELOPMENT_STANDARDS.md`](./DEVELOPMENT_STANDARDS.md) - 開發規範
- [`doc/TESTING.md`](./TESTING.md) - 測試規範

---

## 🎯 設計原則

1. **復用優先**：新功能優先復用現有模組，避免重複造輪子
2. **分層清晰**：Domain -> Service -> Handler 三層分離
3. **可擴展性**：使用 JSON Filter 設計，無需頻繁修改 Schema
4. **可監控性**：所有推送記錄在 `broadcasts` 表，統一監控
5. **用戶友好**：尊重用戶偏好，避免過度打擾

---

**文檔維護者**：開發團隊  
**文檔位置**：`doc/PUSH_SYSTEM_MASTER.md`  
**最後更新**：2025-11-21

