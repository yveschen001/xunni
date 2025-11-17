# 邀請裂變系統設計文檔

**版本**: 1.0  
**日期**: 2025-11-16  
**狀態**: 設計完成，待開發

---

## 📋 目錄

1. [系統概述](#系統概述)
2. [邀請流程](#邀請流程)
3. [獎勵機制](#獎勵機制)
4. [通知系統](#通知系統)
5. [隱私保護](#隱私保護)
6. [數據庫設計](#數據庫設計)
7. [實現計劃](#實現計劃)

---

## 系統概述

### 設計目標

1. **用戶增長**: 通過邀請機制實現病毒式傳播
2. **用戶留存**: 通過配額獎勵提升用戶活躍度
3. **VIP 轉化**: 通過邀請上限引導用戶升級 VIP
4. **隱私保護**: 保護被邀請者的隱私信息

### 核心指標

| 指標 | 目標值 | 說明 |
|------|--------|------|
| 邀請轉化率 | > 20% | 點擊邀請連結後完成註冊並激活的比例 |
| 平均邀請數 | > 2 人/用戶 | 每個用戶平均成功邀請的人數 |
| VIP 轉化率 | > 5% | 達到免費邀請上限後升級 VIP 的比例 |

---

## 邀請流程

### 階段 1：邀請記錄（註冊時）

**觸發條件**: 新用戶通過邀請連結註冊

**支持格式**:
```
1. 命令格式：/start invite_XUNNI-ABC123
2. Deep Link：https://t.me/xunni_bot?start=invite_XUNNI-ABC123
```

**處理流程**:
```typescript
// 1. 提取邀請碼
const inviteCode = extractInviteCode(message.text);
// 格式：invite_XUNNI-ABC123

// 2. 驗證邀請碼
const inviter = await findUserByInviteCode(db, inviteCode);
if (!inviter) {
  // 邀請碼無效，繼續正常註冊
  return;
}

// 3. 防止自我邀請
if (inviter.telegram_id === newUser.telegram_id) {
  await telegram.sendMessage(chatId, '❌ 不能使用自己的邀請碼');
  return;
}

// 4. 記錄邀請關係
await createUser(db, {
  telegram_id: newUser.telegram_id,
  invited_by: inviter.telegram_id,
  // ... 其他字段
});

// 5. 創建邀請記錄
await db.d1.prepare(`
  INSERT INTO invites (
    inviter_telegram_id,
    invitee_telegram_id,
    invite_code,
    status,
    created_at
  ) VALUES (?, ?, ?, 'pending', datetime('now'))
`).bind(
  inviter.telegram_id,
  newUser.telegram_id,
  inviteCode
).run();

// 6. 通知新用戶
await telegram.sendMessage(
  chatId,
  `✅ 已使用 ${inviter.nickname} 的邀請碼\n\n` +
  `完成註冊後，你們都將獲得獎勵！`
);
```

### 階段 2：邀請激活（完成條件）

**激活條件** (必須全部滿足):
1. ✅ 完成 onboarding（包含 MBTI 測驗）
2. ✅ 至少丟過 1 個瓶子

**觸發時機**:
- 在首次成功丟瓶子後檢查激活條件
- 如果條件滿足，執行激活邏輯

**激活邏輯**:
```typescript
async function checkAndActivateInvite(user: User, db: DatabaseClient, telegram: TelegramService) {
  // 1. 檢查是否有邀請人
  if (!user.invited_by) return;
  
  // 2. 檢查是否已激活
  const existingInvite = await db.queryOne(
    'SELECT * FROM invites WHERE invitee_telegram_id = ? AND status = "activated"',
    [user.telegram_id]
  );
  if (existingInvite) return; // 已激活，不重複處理
  
  // 3. 檢查激活條件
  const hasCompletedOnboarding = user.onboarding_step === 'completed';
  const hasThrown = await db.queryOne(
    'SELECT COUNT(*) as count FROM bottles WHERE owner_telegram_id = ?',
    [user.telegram_id]
  );
  
  if (!hasCompletedOnboarding || !hasThrown || hasThrown.count === 0) {
    return; // 條件未滿足
  }
  
  // 4. 執行激活
  await activateInvite(user, db, telegram);
}
```

### 階段 3：邀請通知（激活後）

**通知邀請人**:
```
🎉 邀請成功！

你的好友 張** 已完成註冊並激活！

🎁 獎勵：每日漂流瓶配額 +1
📊 已邀請：5 人
🎯 免費用戶上限：10 人
📦 當前每日配額：8 個

💡 想要無限邀請？升級 VIP 可解鎖 100 人上限！
```

**通知被邀請人**:
```
🎊 恭喜完成激活！

你和邀請人都獲得了獎勵：
• 每日漂流瓶配額 +1

💡 邀請更多好友，獲得更多配額！
查看你的邀請碼 → /profile
```

### 階段 4：邀請上限提醒

**倒數第二個名額（9/10）**:
```
⚠️ 邀請名額即將用完

你已成功邀請 9 人，還剩最後 1 個名額！

💎 升級 VIP 可解鎖：
• 邀請上限：10 → 100 人
• 每日配額：13 → 130 個瓶子
• 更多專屬權益

立即升級 → /vip
```

**最後一個名額（10/10）**:
```
🎊 恭喜！邀請名額已滿

你已成功邀請 10 人，獲得最大免費獎勵！

💎 想要解鎖更多邀請？
升級 VIP 可邀請最多 100 人

立即升級 → /vip
```

---

## 獎勵機制

### 配額計算規則

| 用戶類型 | 基礎配額 | 邀請獎勵 | 邀請上限 | 最大配額 |
|---------|---------|---------|---------|---------|
| 免費用戶 | 3 個/天 | +1 個/人 | 10 人 | 13 個/天 |
| VIP 用戶 | 30 個/天 | +1 個/人 | 100 人 | 130 個/天 |

### 配額計算公式

```typescript
/**
 * 計算用戶每日漂流瓶配額
 */
export function calculateDailyQuota(user: User): number {
  const baseQuota = user.is_vip ? 30 : 3;
  const maxInvites = user.is_vip ? 100 : 10;
  const actualInvites = Math.min(user.successful_invites, maxInvites);
  
  return baseQuota + actualInvites;
}
```

### 獎勵規則

1. **永久有效**: 邀請獎勵不會過期
2. **累計計算**: 每成功邀請 1 人，配額永久 +1
3. **上限限制**: 
   - 免費用戶：最多計算 10 個邀請
   - VIP 用戶：最多計算 100 個邀請
4. **降級保護**: VIP 降級為免費用戶時，獎勵保留但受免費用戶上限限制

### 示例場景

**場景 1: 免費用戶邀請進度**
```
邀請 0 人 → 配額 3 個/天
邀請 1 人 → 配額 4 個/天
邀請 5 人 → 配額 8 個/天
邀請 10 人 → 配額 13 個/天（上限）
邀請 15 人 → 配額 13 個/天（仍為上限）
```

**場景 2: VIP 用戶邀請進度**
```
邀請 0 人 → 配額 30 個/天
邀請 10 人 → 配額 40 個/天
邀請 50 人 → 配額 80 個/天
邀請 100 人 → 配額 130 個/天（上限）
邀請 120 人 → 配額 130 個/天（仍為上限）
```

**場景 3: VIP 降級**
```
VIP 用戶邀請 50 人 → 配額 80 個/天
降級為免費用戶 → 配額 13 個/天（受免費上限限制）
重新升級 VIP → 配額 80 個/天（獎勵恢復）
```

---

## 通知系統

### 通知時機

| 事件 | 接收者 | 時機 | 優先級 |
|------|--------|------|--------|
| 邀請激活 | 邀請人 | 被邀請人首次丟瓶後 | 高 |
| 邀請激活 | 被邀請人 | 首次丟瓶後 | 中 |
| 邀請名額提醒 | 邀請人 | 達到 9/10 時 | 中 |
| 邀請名額已滿 | 邀請人 | 達到 10/10 時 | 中 |

### 通知內容模板

**邀請人通知（激活）**:
```typescript
function getInviterNotification(inviter: User, invitee: User): string {
  const maskedNickname = maskNickname(invitee.nickname || '新用戶');
  const currentInvites = inviter.successful_invites + 1;
  const maxInvites = inviter.is_vip ? 100 : 10;
  const newQuota = calculateDailyQuota({ ...inviter, successful_invites: currentInvites });
  
  let message = `🎉 邀請成功！\n\n`;
  message += `你的好友 ${maskedNickname} 已完成註冊並激活！\n\n`;
  message += `🎁 獎勵：每日漂流瓶配額 +1\n`;
  message += `📊 已邀請：${currentInvites} 人\n`;
  message += `🎯 ${inviter.is_vip ? 'VIP' : '免費'}用戶上限：${maxInvites} 人\n`;
  message += `📦 當前每日配額：${newQuota} 個\n\n`;
  
  // 邀請上限提醒
  if (!inviter.is_vip) {
    if (currentInvites === maxInvites - 1) {
      message += `⚠️ 還剩最後 1 個邀請名額！\n\n`;
      message += `💎 升級 VIP 可解鎖：\n`;
      message += `• 邀請上限：10 → 100 人\n`;
      message += `• 每日配額：13 → 130 個瓶子\n`;
      message += `• 更多專屬權益\n\n`;
      message += `立即升級 → /vip`;
    } else if (currentInvites === maxInvites) {
      message += `🎊 恭喜！邀請名額已滿\n\n`;
      message += `💎 想要解鎖更多邀請？\n`;
      message += `升級 VIP 可邀請最多 100 人\n\n`;
      message += `立即升級 → /vip`;
    } else {
      message += `💡 想要無限邀請？升級 VIP 可解鎖 100 人上限！`;
    }
  }
  
  return message;
}
```

**被邀請人通知（激活）**:
```typescript
function getInviteeNotification(invitee: User): string {
  return `🎊 恭喜完成激活！\n\n` +
    `你和邀請人都獲得了獎勵：\n` +
    `• 每日漂流瓶配額 +1\n\n` +
    `💡 邀請更多好友，獲得更多配額！\n` +
    `查看你的邀請碼 → /profile`;
}
```

---

## 隱私保護

### 暱稱遮蔽規則

**目的**: 保護被邀請者的隱私，避免暴露完整暱稱

**規則**:
```typescript
/**
 * 遮蔽暱稱，保護隱私
 * 
 * @param nickname 原始暱稱
 * @returns 遮蔽後的暱稱
 * 
 * @example
 * maskNickname('張小明') // '張**'
 * maskNickname('Alice') // 'Ali***'
 * maskNickname('王') // '王**'
 * maskNickname('AB') // 'A**'
 */
export function maskNickname(nickname: string): string {
  if (!nickname || nickname.length === 0) {
    return '新用戶';
  }
  
  if (nickname.length <= 2) {
    return nickname[0] + '**';
  }
  
  if (nickname.length === 3) {
    return nickname[0] + '**';
  }
  
  // 顯示前 3 個字符，其餘用 *** 代替
  return nickname.substring(0, 3) + '***';
}
```

**示例**:
| 原始暱稱 | 遮蔽後 | 說明 |
|---------|--------|------|
| 張小明 | 張** | 中文名 3 字 |
| 王五 | 王** | 中文名 2 字 |
| Alice | Ali*** | 英文名 5 字 |
| Bob | B** | 英文名 3 字 |
| 李 | 李** | 單字名 |

### 數據安全

1. **不暴露 Telegram ID**: 通知中不顯示被邀請者的 telegram_id
2. **不暴露完整暱稱**: 使用遮蔽規則保護隱私
3. **不暴露其他信息**: 不顯示性別、年齡、MBTI 等個人信息

---

## 數據庫設計

### invites 表

```sql
CREATE TABLE IF NOT EXISTS invites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inviter_telegram_id TEXT NOT NULL,
  invitee_telegram_id TEXT NOT NULL,
  invite_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'activated', 'expired')),
  activated_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (inviter_telegram_id) REFERENCES users(telegram_id),
  FOREIGN KEY (invitee_telegram_id) REFERENCES users(telegram_id)
);

CREATE INDEX idx_invites_inviter ON invites(inviter_telegram_id);
CREATE INDEX idx_invites_invitee ON invites(invitee_telegram_id);
CREATE INDEX idx_invites_status ON invites(status);
```

### 字段說明

| 字段 | 類型 | 說明 |
|------|------|------|
| id | INTEGER | 主鍵 |
| inviter_telegram_id | TEXT | 邀請人 telegram_id |
| invitee_telegram_id | TEXT | 被邀請人 telegram_id |
| invite_code | TEXT | 使用的邀請碼 |
| status | TEXT | 狀態：pending（待激活）、activated（已激活）、expired（已過期） |
| activated_at | TEXT | 激活時間 |
| created_at | TEXT | 創建時間 |

### 查詢示例

**查詢用戶的邀請統計**:
```sql
SELECT 
  COUNT(*) as total_invites,
  SUM(CASE WHEN status = 'activated' THEN 1 ELSE 0 END) as activated_invites,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_invites
FROM invites
WHERE inviter_telegram_id = ?
```

**查詢邀請轉化率**:
```sql
SELECT 
  inviter_telegram_id,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'activated' THEN 1 ELSE 0 END) as activated,
  ROUND(100.0 * SUM(CASE WHEN status = 'activated' THEN 1 ELSE 0 END) / COUNT(*), 2) as conversion_rate
FROM invites
GROUP BY inviter_telegram_id
HAVING total > 0
ORDER BY conversion_rate DESC
```

---

## 實現計劃

### 第一階段：基礎邀請功能（2-3 小時）

**優先級**: 高 ⭐⭐⭐

1. **邀請碼處理** (30 分鐘)
   - [ ] 在 `/start` 中提取邀請碼
   - [ ] 驗證邀請碼有效性
   - [ ] 防止自我邀請
   - [ ] 記錄到 `users.invited_by`
   - [ ] 創建 `invites` 記錄

2. **邀請激活** (1 小時)
   - [ ] 在首次丟瓶子後檢查激活條件
   - [ ] 更新 `invites.status` 為 'activated'
   - [ ] 更新 `successful_invites` 計數
   - [ ] 實現 `activateInvite` 函數

3. **邀請通知** (1 小時)
   - [ ] 實現 `maskNickname` 函數
   - [ ] 發送通知給邀請人
   - [ ] 發送通知給被邀請人
   - [ ] 實現邀請上限提醒邏輯

4. **配額計算** (30 分鐘)
   - [ ] 修復 `getBottleQuota` 函數
   - [ ] 從數據庫讀取 `successful_invites`
   - [ ] 應用邀請獎勵到配額計算

### 第二階段：進階功能（2-3 小時）

**優先級**: 中 ⭐⭐

5. **創建 invites 表** (30 分鐘)
   - [ ] 編寫 migration 腳本
   - [ ] 添加索引
   - [ ] 測試數據庫操作

6. **邀請統計** (1 小時)
   - [ ] 在 `/profile` 中顯示邀請統計
   - [ ] 顯示邀請轉化率
   - [ ] 添加"分享邀請碼"按鈕

7. **分享功能** (1.5 小時)
   - [ ] 實現邀請碼分享
   - [ ] 生成分享連結
   - [ ] 分享文案優化

### 第三階段：數據分析（1-2 小時）

**優先級**: 低 ⭐

8. **管理後台統計** (1 小時)
   - [ ] 邀請排行榜
   - [ ] 邀請轉化率分析
   - [ ] 邀請來源分析

9. **MBTI 結果分享** (1 小時)
   - [ ] MBTI 結果分享按鈕
   - [ ] Deep Link 處理
   - [ ] 分享統計

---

## 測試計劃

### 單元測試

```typescript
describe('Invite System', () => {
  describe('maskNickname', () => {
    it('should mask 3-character Chinese name', () => {
      expect(maskNickname('張小明')).toBe('張**');
    });
    
    it('should mask 5-character English name', () => {
      expect(maskNickname('Alice')).toBe('Ali***');
    });
    
    it('should mask single character name', () => {
      expect(maskNickname('李')).toBe('李**');
    });
  });
  
  describe('calculateDailyQuota', () => {
    it('should calculate free user quota correctly', () => {
      const user = { is_vip: false, successful_invites: 5 };
      expect(calculateDailyQuota(user)).toBe(8); // 3 + 5
    });
    
    it('should respect free user invite limit', () => {
      const user = { is_vip: false, successful_invites: 15 };
      expect(calculateDailyQuota(user)).toBe(13); // 3 + 10 (max)
    });
    
    it('should calculate VIP user quota correctly', () => {
      const user = { is_vip: true, successful_invites: 50 };
      expect(calculateDailyQuota(user)).toBe(80); // 30 + 50
    });
  });
});
```

### 集成測試

1. **邀請流程測試**
   - 用戶 A 分享邀請碼
   - 用戶 B 使用邀請碼註冊
   - 用戶 B 完成 onboarding
   - 用戶 B 首次丟瓶子
   - 驗證邀請激活
   - 驗證通知發送

2. **配額計算測試**
   - 驗證基礎配額
   - 驗證邀請獎勵
   - 驗證上限限制
   - 驗證 VIP 降級

3. **邊界測試**
   - 自我邀請
   - 重複激活
   - 無效邀請碼
   - 邀請上限

---

## 風險與緩解

### 風險 1：邀請濫用

**風險**: 用戶可能創建多個假賬號刷邀請獎勵

**緩解措施**:
1. 激活條件嚴格（完成 onboarding + 丟瓶子）
2. 監控異常邀請行為（同一 IP、同一設備）
3. 風險評分系統
4. 人工審核機制

### 風險 2：隱私洩露

**風險**: 被邀請者信息可能被暴露

**緩解措施**:
1. 暱稱遮蔽
2. 不顯示其他個人信息
3. 不暴露 telegram_id

### 風險 3：VIP 轉化不足

**風險**: 用戶達到免費上限後不升級 VIP

**緩解措施**:
1. 及時提醒（9/10 時）
2. 強調 VIP 價值
3. 限時優惠活動
4. 邀請排行榜激勵

---

**文檔版本**: 1.0  
**最後更新**: 2025-11-16  
**維護者**: XunNi 開發團隊

