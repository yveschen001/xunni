# 封禁系統完整性分析報告

**生成時間：** 2025-11-17  
**分析範圍：** 封禁系統設計、實現、數據庫結構

---

## 📊 當前狀態總結

### ✅ 已實現的部分

#### 1. 數據庫設計（`users` 表）
- ✅ `is_banned` - 封禁狀態標記
- ✅ `ban_reason` - 封禁原因
- ✅ `banned_at` - 封禁時間
- ✅ `banned_until` - 封禁到期時間
- ✅ `ban_count` - 封禁次數
- ✅ `risk_score` - 風險分數

#### 2. Domain 層邏輯
**文件：** `src/domain/user.ts` (line 385-411)

```typescript
// ✅ 已實現
export function isBanned(user: User): boolean {
  if (!user.is_banned) return false;
  if (!user.banned_until) return true; // 永久封禁
  
  const now = new Date();
  const bannedUntil = new Date(user.banned_until);
  return now < bannedUntil; // 臨時封禁檢查
}

// ✅ 已實現
export function calculateBanDuration(banCount: number): number | null {
  if (banCount === 1) return 1;  // 1 天
  if (banCount === 2) return 7;  // 1 週
  if (banCount === 3) return 30; // 1 月
  return null; // 永久封禁
}
```

**文件：** `src/domain/risk.ts` (line 210-241)

```typescript
// ✅ 已實現
export function shouldBanFromReports(reportCount: number, riskScore: number): boolean
export function calculateBanDuration(banCount: number): number | null
export function calculateBanExpiration(durationDays: number | null): string | null
```

#### 3. 數據庫操作
**文件：** `src/db/queries/users.ts` (line 256-291)

```typescript
// ✅ 已實現
export async function banUser(
  db: DatabaseClient,
  telegramId: string,
  reason: string,
  bannedUntil?: string
): Promise<void>

// ✅ 已實現
export async function unbanUser(db: DatabaseClient, telegramId: string): Promise<void>
```

#### 4. 舉報自動封禁
**文件：** `src/telegram/handlers/report.ts` (line 207-232)

```typescript
// ✅ 已實現
async function autoBanUser(
  db: ReturnType<typeof createDatabaseClient>,
  userId: string,
  reason: string
): Promise<void> {
  // 更新 is_banned
  // 創建 bans 記錄（24 小時）
}
```

---

## ❌ 缺失的部分

### 1. 🔴 **`bans` 表不存在**

**問題：**
- SPEC.md 中設計了 `bans` 表（line 378-390）
- 但 `schema.sql` 和 migrations 中都**沒有創建**這個表
- `report.ts` 中的 `autoBanUser` 函數嘗試插入 `bans` 表，但表不存在

**影響：**
- 舉報功能中的自動封禁會失敗
- 無法記錄封禁歷史
- 無法追蹤封禁原因和時間

**SPEC.md 設計：**
```sql
CREATE TABLE bans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  reason TEXT,
  risk_snapshot INTEGER,
  ban_start DATETIME,
  ban_end DATETIME,
  created_at DATETIME
);
```

### 2. 🔴 **路由層沒有封禁檢查**

**問題：**
- `src/router.ts` line 109 有 TODO 標記
- 每次請求都應該檢查用戶是否被封禁
- 當前只在個別 handler 中檢查（不一致）

**代碼位置：**
```typescript
// src/router.ts line 109
// TODO: Implement ban check
```

**影響：**
- 被封禁用戶仍可能使用某些功能
- 封禁檢查不一致（有些 handler 檢查，有些不檢查）
- 安全漏洞

### 3. 🟡 **封禁通知不完整**

**問題：**
- 封禁時沒有統一的通知機制
- 用戶不知道為什麼被封禁、封禁多久

**缺少：**
- 封禁通知消息（告知原因、時長、申訴方式）
- 解封通知（臨時封禁到期時）

### 4. 🟡 **申訴系統不完整**

**問題：**
- `/appeal` 命令可能已實現，但缺少完整的申訴審核流程
- 管理員審核申訴的界面和流程

### 5. 🟢 **封禁歷史查詢**

**問題：**
- 沒有 `bans` 表，無法查詢封禁歷史
- 管理員無法查看用戶的封禁記錄

---

## 🎯 完善建議

### 第一階段：修復核心問題（必須完成）

#### 1. 創建 `bans` 表 ✅
**優先級：** 🔴 最高

**步驟：**
1. 創建 migration 腳本
2. 添加到 `schema.sql`
3. 在 staging 和 production 執行 migration

**SQL：**
```sql
CREATE TABLE IF NOT EXISTS bans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  risk_snapshot INTEGER DEFAULT 0,
  ban_start TEXT NOT NULL,
  ban_end TEXT,  -- NULL = 永久封禁
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(telegram_id)
);

CREATE INDEX idx_bans_user_id ON bans(user_id);
CREATE INDEX idx_bans_ban_end ON bans(ban_end);
CREATE INDEX idx_bans_created_at ON bans(created_at);
```

#### 2. 實現路由層封禁檢查 ✅
**優先級：** 🔴 最高

**位置：** `src/router.ts` line 109

**實現：**
```typescript
// 在路由層統一檢查封禁
if (user && isBanned(user)) {
  const i18n = createI18n(user.language_pref || 'zh-TW');
  
  let message = i18n.t('errors.banned', { reason: user.ban_reason || '違規行為' });
  
  // 如果是臨時封禁，顯示到期時間
  if (user.banned_until) {
    const bannedUntil = new Date(user.banned_until);
    const now = new Date();
    const hoursLeft = Math.ceil((bannedUntil.getTime() - now.getTime()) / (1000 * 60 * 60));
    message += `\n\n⏰ 封禁將在 ${hoursLeft} 小時後解除`;
  } else {
    message += '\n\n⚠️ 這是永久封禁';
  }
  
  message += '\n\n如有疑問，請使用 /appeal 申訴';
  
  await telegram.sendMessage(chatId, message);
  return;
}
```

#### 3. 添加封禁通知 ✅
**優先級：** 🔴 高

**實現：**
- 在 `banUser` 函數中發送通知
- 在 `autoBanUser` 函數中發送通知
- 使用 i18n 系統

---

### 第二階段：完善功能（建議完成）

#### 4. 完善申訴系統 ✅
**優先級：** 🟡 中

**功能：**
- 用戶提交申訴（/appeal）
- 管理員審核申訴（/admin_appeal）
- 批准/拒絕申訴
- 通知用戶審核結果

#### 5. 封禁歷史查詢 ✅
**優先級：** 🟢 低

**功能：**
- 管理員查看用戶封禁歷史
- 統計封禁數據
- 分析封禁原因分佈

---

## 📋 實現檢查清單

### 必須完成（安全必須）
- [ ] 創建 `bans` 表（migration + schema）
- [ ] 在 staging 執行 migration
- [ ] 在 production 執行 migration
- [ ] 實現路由層封禁檢查
- [ ] 修復 `autoBanUser` 函數（確保 bans 表插入成功）
- [ ] 添加封禁通知（告知原因、時長、申訴方式）
- [ ] 測試封禁流程（舉報 → 自動封禁 → 通知 → 申訴）

### 建議完成（用戶體驗）
- [ ] 完善申訴系統
- [ ] 添加解封通知
- [ ] 管理員封禁歷史查詢
- [ ] 封禁統計數據

---

## 🔍 相關文件

### 設計文檔
- `doc/SPEC.md` line 378-390 (bans 表設計)
- `doc/SPEC.md` line 660-723 (風險分數與封禁規則)
- `doc/ADMIN_PANEL.md` (管理後台設計)

### 代碼文件
- `src/domain/user.ts` line 385-411 (isBanned, calculateBanDuration)
- `src/domain/risk.ts` line 210-241 (shouldBanFromReports, calculateBanDuration)
- `src/db/queries/users.ts` line 256-291 (banUser, unbanUser)
- `src/telegram/handlers/report.ts` line 207-232 (autoBanUser)
- `src/router.ts` line 109 (TODO: Implement ban check)

---

## 📊 風險評估

### 當前風險
- 🔴 **高風險**：被封禁用戶可能仍能使用部分功能（安全漏洞）
- 🔴 **高風險**：`autoBanUser` 函數會失敗（bans 表不存在）
- 🟡 **中風險**：用戶體驗差（不知道為什麼被封禁）
- 🟢 **低風險**：無法追蹤封禁歷史（運營數據缺失）

### 修復後
- ✅ 所有請求都會檢查封禁狀態
- ✅ 封禁記錄正確保存
- ✅ 用戶收到清晰的封禁通知
- ✅ 可以追蹤封禁歷史

---

**結論：** 封禁系統設計完善，但實現不完整。需要：
1. 創建 `bans` 表（最高優先級）
2. 實現路由層封禁檢查（最高優先級）
3. 添加封禁通知（高優先級）

**預計工時：** 2-3 小時

---

**維護者：** 開發團隊  
**最後更新：** 2025-11-17

