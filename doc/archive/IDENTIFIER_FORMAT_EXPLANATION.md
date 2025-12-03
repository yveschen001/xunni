# 對話標識符格式說明

**問題時間：** 2025-01-17 03:15 UTC  
**環境：** Staging

---

## 🔍 問題

**截圖顯示：**
```
來自匿名對話的訊息（來自 #A）
```

**預期格式：**
```
來自匿名對話的訊息（來自 #1117ABCD）
```

---

## 📊 根本原因

### 問題：資料庫中有舊格式的標識符

**舊格式（之前的設計）：**
- `A`, `B`, `C`, `D`, ...
- 簡單字母序列

**新格式（當前設計）：**
- `MMDDHHHH`（月日 + 4位隨機字母）
- 例如：`1117ABCD`（11月17日 + ABCD）

### 為什麼顯示舊格式？

**`getOrCreateIdentifier` 邏輯：**
```typescript
export async function getOrCreateIdentifier(...): Promise<string> {
  // 1. 先檢查是否已存在
  const existing = await db.d1
    .prepare('SELECT identifier FROM conversation_identifiers WHERE ...')
    .first<{ identifier: string }>();
  
  if (existing) {
    return existing.identifier;  // ← 返回舊格式 'A'
  }
  
  // 2. 如果不存在，生成新格式
  const newIdentifier = generateNextIdentifier(...);  // ← 新格式 '1117ABCD'
  
  return newIdentifier;
}
```

**問題：**
1. ✅ 用戶在之前的測試中創建了對話
2. ✅ 資料庫中保存的是舊格式標識符 `A`
3. ✅ `getOrCreateIdentifier` 發現已存在，直接返回 `A`
4. ❌ 新代碼無法更新舊標識符

---

## ✅ 解決方案

### 方案 A：使用 `/dev_restart` 重新開始（推薦）

**優點：**
- ✅ 快速簡單
- ✅ 適合 staging 環境
- ✅ 確保所有資料都是新格式

**步驟：**
```
1. 兩個測試帳號都執行 /dev_restart
2. 完成註冊
3. 丟瓶子 + 撿瓶子
4. 開始對話

預期：✅ 新對話標識符為 #1117ABCD 格式
```

---

### 方案 B：寫遷移腳本更新舊標識符（不推薦）

**優點：**
- ✅ 保留現有對話歷史

**缺點：**
- ❌ 需要寫遷移腳本
- ❌ 可能產生重複標識符
- ❌ 測試複雜

**為什麼不推薦：**
1. Staging 環境的資料不重要
2. 遷移邏輯複雜（需要確保唯一性）
3. `/dev_restart` 更快更安全

---

## 📋 新格式設計

### 格式：`#MMDDHHHH`

**結構：**
```
# + MM（月） + DD（日） + HHHH（4位隨機字母）

例如：
#1117ABCD  →  11月17日 + ABCD
#1225XYZW  →  12月25日 + XYZW
#0101QWER  →  01月01日 + QWER
```

**優點：**
1. ✅ **易於記憶**：包含日期信息
2. ✅ **不易重複**：4位隨機字母（26^4 = 456,976 種組合）
3. ✅ **可追溯**：知道對話大約何時開始
4. ✅ **固定長度**：10 個字符（含 `#`）

**與舊格式對比：**

| 項目 | 舊格式（A, B, C） | 新格式（MMDDHHHH） |
|------|------------------|-------------------|
| 長度 | 2 字符（`#A`） | 10 字符（`#1117ABCD`） |
| 容量 | 26 個（A-Z） | 456,976 個 |
| 可讀性 | 低 | 高（包含日期） |
| 易記性 | 低 | 高 |
| 唯一性 | 低 | 高 |

---

## 🧪 測試驗證

### 測試步驟

**用戶 A：**
```
1. /dev_restart
2. 完成註冊
3. /throw
4. 輸入瓶子內容（12+ 字符）
```

**用戶 B：**
```
1. /dev_restart
2. 完成註冊
3. /catch
4. 查看卡片
```

**預期結果：**
```
💬 來自匿名對話的訊息（來自 #1117ABCD）：
來自：OKOk******
MBTI：ENTP
星座：Virgo

是

💬 直接按 /reply 回覆訊息聊天
```

**驗證：**
- ✅ 標識符格式為 `#MMDDHHHH`（例如 `#1117ABCD`）
- ✅ 不是舊格式 `#A`

---

## 📂 相關文件

### 核心邏輯

1. **`src/domain/conversation_identifier.ts`**
   - `generateNextIdentifier()` - 生成新標識符
   - `formatIdentifier()` - 格式化顯示（加 `#` 前綴）

2. **`src/db/queries/conversation_identifiers.ts`**
   - `getOrCreateIdentifier()` - 取得或創建標識符
   - 先檢查資料庫，再生成新的

3. **`src/telegram/handlers/message_forward.ts`**
   - 第 210-211 行：呼叫 `getOrCreateIdentifier`
   - 第 226, 242 行：使用 `formatIdentifier` 顯示

---

## 🎯 建議

### 立即操作

**推薦方案 A：**
```
1. 兩個測試帳號都執行 /dev_restart
2. 重新測試完整流程
3. 驗證新標識符格式
```

**預計耗時：** 3-5 分鐘

---

### 未來考慮

如果需要在 Production 更新舊標識符：

**選項 1：自然遷移**
- 保留舊標識符，只有新對話使用新格式
- 用戶逐漸習慣新格式

**選項 2：強制遷移**
- 寫遷移腳本更新所有舊標識符
- 需要通知用戶標識符變更

**選項 3：混合顯示**
- 舊標識符顯示為 `#A (舊)`
- 新標識符顯示為 `#1117ABCD`

**建議：** 選項 1（自然遷移），因為：
1. ✅ 不影響現有用戶體驗
2. ✅ 無需複雜遷移邏輯
3. ✅ 新用戶自動使用新格式

---

## 🎉 總結

**問題：** 資料庫中有舊格式標識符 `A`  
**原因：** `getOrCreateIdentifier` 返回現有標識符  
**解決：** 使用 `/dev_restart` 清空資料，重新開始

**新格式優勢：**
- ✅ 易於記憶（包含日期）
- ✅ 不易重複（456,976 種組合）
- ✅ 更專業的使用者體驗

---

**建議操作：** 執行 `/dev_restart` 重新測試  
**預計效果：** ✅ 新對話標識符為 `#1117ABCD` 格式

