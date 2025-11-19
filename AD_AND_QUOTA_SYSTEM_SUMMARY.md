# 廣告獎勵 & 額度提示系統總結

## ✅ **已完成的設計文檔**

### **1. BOTTLE_QUOTA_PROMPT_DESIGN.md**
- 📋 額度用完時的個性化提示設計
- 🎯 根據用戶類型（免費/VIP）和剩餘額度提供不同建議
- 🔘 快捷操作按鈕設計

### **2. AD_REWARD_SYSTEM_DESIGN.md**
- 📺 廣告獎勵系統完整設計
- 📊 廣告統計系統設計
- 🔌 GigaPub 廣告平台集成方案

---

## 🎯 **核心功能**

### **1. 額度提示優化**

#### **免費用戶（基礎 3，最大 10）**
| 額度狀態 | 提示內容 | 按鈕 |
|---------|---------|------|
| 3-9 個 | 邀請朋友 + 看廣告 | `[📲 邀請朋友]` `[📺 看廣告 +1]` |
| 10 個 | 邀請已滿 + 看廣告 + 升級 VIP | `[📺 看廣告 +1]` `[💎 升級 VIP]` |

#### **VIP 用戶（基礎 30，最大 100）**
| 額度狀態 | 提示內容 | 按鈕 |
|---------|---------|------|
| 30-99 個 | 邀請朋友 | `[📲 邀請朋友]` |
| 100 個 | 恭喜達到最大值 | 無按鈕 |

---

### **2. 廣告獎勵系統**

#### **核心規則**
- ✅ **免費用戶專屬**：只有免費用戶可以看廣告
- ✅ **臨時額度**：廣告獲得的額度只在當天有效
- ✅ **每日上限**：最多看 20 次廣告
- ✅ **即時獎勵**：每成功播放 +1 額度
- ✅ **VIP 不可用**：VIP 用戶不顯示看廣告選項

#### **額度計算公式**

**免費用戶：**
```typescript
當日總額度 = 基礎額度(3) + 邀請獎勵(永久) + 廣告獎勵(臨時)
最大額度 = 10 (基礎+邀請) + 20 (廣告) = 30

例如：
- 基礎：3 個
- 邀請朋友：2 個（永久）
- 看廣告：5 個（當天）
- 當日總額度：10 個
```

**VIP 用戶：**
```typescript
當日總額度 = 基礎額度(30) + 邀請獎勵(永久)
最大額度 = 100

無廣告選項
```

---

### **3. 邀請獎勵機制（重要修正）**

#### ✅ **正確的邀請獎勵規則**
- **只有邀請者獲得獎勵**：每成功邀請 1 人 → 邀請者每日配額 +1
- **被邀請者不獲得額外配額**：只獲得使用產品的機會
- **獎勵永久有效**：不會過期

#### ❌ **錯誤的提示（已修正）**
```
你和朋友都可獲得 +1 配額（永久）  ❌ 錯誤！
```

#### ✅ **正確的提示**
```
你可獲得 +1 配額（永久）  ✅ 正確！
```

---

### **4. 廣告統計系統**

#### **統計指標**
- 📊 **ad_views**：廣告開始播放次數
- 📊 **ad_completions**：廣告完整播放次數
- 📊 **ad_completion_rate**：廣告完成率
- 📊 **total_ad_quota_earned**：廣告獲得的總額度
- 📊 **unique_users**：參與用戶數

#### **報表功能**
- 📅 **每日統計報表**：自動推送給超級管理員
- 📺 **實時廣告統計**：`/ad_stats` 命令查看

---

## 🗄️ **數據庫設計**

### **新增表：ad_rewards**
```sql
CREATE TABLE IF NOT EXISTS ad_rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT NOT NULL,
  reward_date TEXT NOT NULL,  -- YYYY-MM-DD
  ads_watched INTEGER DEFAULT 0,  -- 當天已看廣告數 (0-20)
  quota_earned INTEGER DEFAULT 0,  -- 當天廣告獲得的額度 (0-20)
  ad_views INTEGER DEFAULT 0,  -- 廣告開始播放次數
  ad_completions INTEGER DEFAULT 0,  -- 廣告完整播放次數
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(telegram_id, reward_date)
);
```

### **更新表：daily_stats**
```sql
-- 添加廣告統計字段
ALTER TABLE daily_stats ADD COLUMN total_ad_views INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN total_ad_completions INTEGER DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN ad_completion_rate REAL DEFAULT 0.0;
ALTER TABLE daily_stats ADD COLUMN total_ad_quota_earned INTEGER DEFAULT 0;
```

---

## 🎬 **用戶體驗流程**

### **免費用戶看廣告**
```
1. 用戶：/throw（額度已用完）
   ↓
2. Bot：顯示額度用完提示
   • 邀請朋友（永久）
   • 看廣告 +1（當天）
   • 升級 VIP
   [📲 邀請朋友] [📺 看廣告 +1]
   ↓
3. 用戶：點擊 [📺 看廣告 +1]
   ↓
4. Bot：打開廣告頁面（Telegram Mini App）
   ↓
5. 用戶：觀看完整廣告
   ↓
6. 廣告頁面：調用 window.showGiga()
   ↓
7. 廣告完成：通知後端 /api/ad-complete
   ↓
8. 後端：+1 額度，記錄統計，發送成功通知
   ↓
9. Bot：✅ 你獲得了 +1 額度！
   今日廣告：5/20
   現在可以繼續丟瓶子了：/throw
```

---

## 📊 **統計報表示例**

### **每日統計報表（自動推送給超級管理員）**
```
📊 **每日數據報表**
📅 日期：2025-01-18

**用戶數據**
• 新增用戶：45 人
• 活躍用戶：328 人
• VIP 用戶：23 人

**漂流瓶數據**
• 丟出：892 個
• 撿起：856 個
• 對話訊息：1,234 則

**📺 廣告數據**
• 觀看次數：156 次
• 完成次數：142 次
• 完成率：91.03%
• 獲得額度：142 個

**邀請數據**
• 新增邀請：12 個
• 激活邀請：8 個

**風控數據**
• 舉報：3 次
• 封禁：1 人
```

### **實時廣告統計（`/ad_stats`）**
```
📺 **今日廣告統計**

**觀看數據**
• 觀看次數：156 次
• 完成次數：142 次
• 完成率：91.03%

**獎勵數據**
• 發放額度：142 個
• 參與用戶：89 人

**平均數據**
• 人均觀看：1.75 次
• 人均完成：1.60 次

💡 查看完整報表：/daily_stats
```

---

## 🛠️ **實現檢查清單**

### **Phase 1: 數據庫 & Domain**
- [ ] 創建 Migration `0022_create_ad_rewards_table.sql`
- [ ] 創建 Migration `0023_add_ad_statistics.sql`
- [ ] 執行 Migrations
- [ ] 創建 `src/domain/ad_reward.ts`
- [ ] 創建 `src/domain/bottle_quota_prompt.ts`
- [ ] 創建 `src/db/queries/ad_rewards.ts`
- [ ] 更新 `src/domain/bottle.ts` 添加 `getBottleQuotaWithAds()`
- [ ] 更新 `src/domain/stats.ts` 集成廣告統計

### **Phase 2: 提示優化**
- [ ] 更新 `src/telegram/handlers/throw.ts` 使用新提示
- [ ] 更新 `src/router.ts` 添加 callback 處理（`show_invite`, `show_vip`）

### **Phase 3: 廣告處理**
- [ ] 創建 `src/telegram/handlers/ad_reward.ts`
- [ ] 更新 `src/router.ts` 添加 callback 處理（`watch_ad`, `cancel_ad`）
- [ ] 更新 `src/router.ts` 添加 API 端點（`/api/ad-complete`）

### **Phase 4: 廣告統計**
- [ ] 創建 `src/telegram/handlers/admin_stats.ts`
- [ ] 更新 `src/router.ts` 添加 `/ad_stats` 路由
- [ ] 更新 `src/telegram/handlers/help.ts` 添加命令說明

### **Phase 5: 前端頁面**
- [ ] 創建 `public/ad.html`
- [ ] 配置 GigaPub Project ID
- [ ] 測試廣告播放流程

### **Phase 6: 測試**
- [ ] 測試免費用戶額度提示（3-9 個）
- [ ] 測試免費用戶額度提示（10 個）
- [ ] 測試 VIP 用戶額度提示（30-99 個）
- [ ] 測試 VIP 用戶額度提示（100 個）
- [ ] 測試免費用戶看廣告流程
- [ ] 測試每日上限（20 次）
- [ ] 測試隔天重置
- [ ] 測試 VIP 用戶無廣告選項
- [ ] 測試額度計算正確性
- [ ] 測試廣告統計記錄
- [ ] 測試 `/ad_stats` 命令
- [ ] 測試每日報表包含廣告數據

---

## 🔌 **技術集成**

### **GigaPub 廣告平台**
- **文檔**：https://docs.giga.pub/integration-guide.html
- **API**：`window.showGiga()`
- **集成方式**：Telegram Mini App + Web Page

### **增強可靠性腳本**
```html
<script data-project-id="YOUR_PROJECT_ID">
  !function(){
    var s=document.currentScript,p=s.getAttribute('data-project-id')||'default';
    var d=['https://ad.gigapub.tech','https://ru-ad.gigapub.tech'],i=0,t,sc;
    function l(){
      sc=document.createElement('script');
      sc.async=true;
      sc.src=d[i]+'/script?id='+p;
      clearTimeout(t);
      t=setTimeout(function(){
        sc.onload=sc.onerror=null;
        sc.src='';
        if(++i<d.length)l();
      },15000);
      sc.onload=function(){clearTimeout(t)};
      sc.onerror=function(){clearTimeout(t);if(++i<d.length)l()};
      document.head.appendChild(sc);
    }
    l();
  }();
</script>
```

---

## 🛡️ **安全考慮**

### **1. Token 驗證**
- ✅ 每個廣告鏈接包含唯一 token
- ✅ Token 有效期 5 分鐘
- ✅ Token 綁定特定用戶

### **2. 防刷機制**
- ✅ 每日上限 20 次
- ✅ 數據庫唯一約束（telegram_id + reward_date）
- ✅ 後端驗證用戶身份

### **3. VIP 保護**
- ✅ VIP 用戶無法看廣告
- ✅ 前端和後端雙重檢查

### **4. 統計準確性**
- ✅ 分別記錄觀看次數和完成次數
- ✅ 計算完成率
- ✅ 防止重複計數

---

## 📈 **預期效果**

### **用戶增長**
- ✅ 提供免費用戶更多選擇
- ✅ 降低 VIP 購買壓力
- ✅ 提高用戶留存率
- ✅ 增加邀請動力

### **收益平衡**
- ✅ 廣告收入補充
- ✅ 保持 VIP 吸引力（無廣告）
- ✅ 鼓勵邀請機制（永久額度）

### **數據驅動**
- ✅ 完整的廣告統計
- ✅ 每日自動報表
- ✅ 實時數據查詢
- ✅ 便於優化決策

---

## 📝 **重要修正**

### **邀請獎勵機制**
- ❌ **錯誤**：「你和朋友都可獲得 +1 配額」
- ✅ **正確**：「你可獲得 +1 配額（永久）」

**原因**：根據 `SPEC.md` 和實際代碼，只有邀請者獲得獎勵，被邀請者不獲得額外配額。

---

## 🚀 **部署步驟**

1. ✅ 執行數據庫 Migrations
2. ✅ 部署後端代碼
3. ✅ 部署廣告頁面（public/ad.html）
4. ✅ 配置 GigaPub Project ID
5. ✅ 測試完整流程
6. ✅ 監控廣告播放數據
7. ✅ 監控統計報表

---

## 📚 **相關文檔**

| 文檔 | 內容 |
|------|------|
| `BOTTLE_QUOTA_PROMPT_DESIGN.md` | 額度提示優化設計 |
| `AD_REWARD_SYSTEM_DESIGN.md` | 廣告獎勵 & 統計系統設計 |
| `SPEC.md` | 專案規格書（邀請機制） |
| `INVITE_SYSTEM_DESIGN.md` | 邀請系統設計 |

---

**設計完成！準備實現！** 🎉

**參考文檔：**
- GigaPub Integration: https://docs.giga.pub/integration-guide.html
- Telegram Mini Apps: https://core.telegram.org/bots/webapps


