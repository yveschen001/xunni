# 對話歷史帖子頭像顯示功能設計

> **狀態：設計評估中**  
> **創建時間：2025-11-21**  
> **最後更新：2025-11-21**

---

## 📋 目錄

1. [功能概述](#功能概述)
2. [需求分析](#需求分析)
3. [技術方案](#技術方案)
4. [實現細節](#實現細節)
5. [VIP 權益更新](#vip-權益更新)
6. [風險評估](#風險評估)
7. [開發計劃](#開發計劃)

---

## 1. 功能概述

### 1.1 核心功能

在對話歷史帖子中顯示對方的 Telegram 頭像，並根據用戶 VIP 狀態決定頭像清晰度：

- **免費用戶**：看到模糊的頭像（霧化濾鏡效果）
- **VIP 用戶**：看到清晰的頭像
- **顯示位置**：僅在對話歷史帖子中顯示，新訊息通知不顯示

### 1.2 業務目標

1. ✅ 增強用戶體驗：讓用戶更直觀地識別對話對象
2. ✅ VIP 增值服務：提供 VIP 專屬權益，提升付費轉化率
3. ✅ 隱私保護：尊重用戶隱私設置，無頭像用戶不強制顯示

---

## 2. 需求分析

### 2.1 功能需求

| 需求 | 描述 | 優先級 |
|------|------|--------|
| FR-1 | 獲取對方 Telegram 頭像 | P0 |
| FR-2 | 免費用戶看到模糊頭像 | P0 |
| FR-3 | VIP 用戶看到清晰頭像 | P0 |
| FR-4 | 僅在歷史帖子顯示頭像 | P0 |
| FR-5 | 處理無頭像情況 | P0 |
| FR-6 | 更新 VIP 權益說明 | P1 |

### 2.2 非功能需求

| 需求 | 描述 | 指標 |
|------|------|------|
| NFR-1 | 性能 | 頭像加載時間 < 2s |
| NFR-2 | 可用性 | 無頭像時優雅降級 |
| NFR-3 | 兼容性 | 支持所有 Telegram 客戶端 |
| NFR-4 | 隱私 | 尊重用戶隱私設置 |

### 2.3 約束條件

1. ⚠️ **Telegram Bot 限制**：純文字訊息無法直接嵌入圖片
2. ⚠️ **隱私限制**：無法獲取隱私設置為「不公開」的頭像
3. ⚠️ **消息編輯限制**：Telegram 消息編輯有 48 小時限制

---

## 3. 技術方案

### 3.1 方案對比

#### **方案 A：Telegram 內嵌照片（推薦）** ⭐

**實現方式：**
```typescript
// 發送帶照片的歷史帖子
await telegram.sendPhoto(chatId, photoUrl, {
  caption: historyPostContent,
  parse_mode: 'Markdown'
});
```

**優點：**
- ✅ 原生支持，無需額外開發
- ✅ 用戶體驗好，圖片直接顯示
- ✅ 支持所有 Telegram 客戶端

**缺點：**
- ❌ 無法直接應用 CSS 模糊濾鏡
- ❌ 需要服務器端處理圖片模糊

**模糊處理方案：**
1. 獲取原始頭像 URL
2. 對於免費用戶，使用 Cloudflare Images 或第三方服務處理模糊
3. 對於 VIP 用戶，直接使用原始 URL

---

#### **方案 B：Telegram Mini App**

**實現方式：**
```typescript
// 在歷史帖子中添加 Mini App 按鈕
await telegram.sendMessage(chatId, historyPostContent, {
  reply_markup: {
    inline_keyboard: [[
      { text: '📸 查看對方頭像', web_app: { url: 'https://your-app.com/avatar?id=...' } }
    ]]
  }
});
```

**優點：**
- ✅ 完全控制 UI，可使用 CSS 模糊濾鏡
- ✅ 可以實現更豐富的交互

**缺點：**
- ❌ 需要額外開發 Mini App 頁面
- ❌ 用戶需要點擊才能查看
- ❌ 體驗不如直接顯示

---

#### **方案 C：Inline Keyboard 連結**

**實現方式：**
```typescript
await telegram.sendMessage(chatId, historyPostContent, {
  reply_markup: {
    inline_keyboard: [[
      { text: '📸 查看對方頭像', url: photoUrl }
    ]]
  }
});
```

**優點：**
- ✅ 實現簡單
- ✅ 無需額外開發

**缺點：**
- ❌ 無法控制模糊效果
- ❌ 免費和 VIP 用戶看到的一樣
- ❌ 不符合需求

---

### 3.2 推薦方案

**推薦：方案 A（Telegram 內嵌照片 + Cloudflare Images 模糊處理）**

**理由：**
1. ✅ 用戶體驗最佳（圖片直接顯示）
2. ✅ 可以實現免費/VIP 差異化
3. ✅ Cloudflare 生態系統內解決方案

---

## 4. 實現細節

### 4.1 頭像獲取流程

```typescript
/**
 * 獲取用戶頭像 URL
 */
async function getUserAvatarUrl(
  telegram: TelegramService,
  userId: string
): Promise<string | null> {
  try {
    // 1. 獲取用戶頭像列表
    const photos = await telegram.getUserProfilePhotos(userId, { limit: 1 });
    
    if (photos.total_count === 0) {
      console.log(`[Avatar] User ${userId} has no profile photo`);
      return null;
    }
    
    // 2. 獲取最大尺寸的頭像
    const photo = photos.photos[0];
    const largestPhoto = photo[photo.length - 1]; // 最後一個是最大尺寸
    
    // 3. 獲取文件路徑
    const file = await telegram.getFile(largestPhoto.file_id);
    
    // 4. 構建 URL
    const photoUrl = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
    
    return photoUrl;
  } catch (error) {
    console.error('[Avatar] Error fetching avatar:', error);
    return null;
  }
}
```

---

### 4.2 圖片模糊處理

#### **選項 1：Cloudflare Images（推薦）** ⭐

```typescript
/**
 * 生成模糊頭像 URL（使用 Cloudflare Images）
 */
function getBlurredAvatarUrl(originalUrl: string): string {
  // Cloudflare Images 支持 blur 參數
  // https://developers.cloudflare.com/images/transform-images/
  return `${originalUrl}?blur=50`;
}
```

**優點：**
- ✅ Cloudflare 原生支持
- ✅ 無需額外處理
- ✅ 性能好

**缺點：**
- ⚠️ 需要先將圖片上傳到 Cloudflare Images
- ⚠️ 可能有額外費用

---

#### **選項 2：第三方圖片處理服務**

使用 imgproxy、thumbor 等服務：

```typescript
function getBlurredAvatarUrl(originalUrl: string): string {
  return `https://imgproxy.example.com/blur:50/${encodeURIComponent(originalUrl)}`;
}
```

**優點：**
- ✅ 功能強大
- ✅ 支持多種處理

**缺點：**
- ❌ 需要部署額外服務
- ❌ 增加維護成本

---

#### **選項 3：Cloudflare Workers + Canvas API**

```typescript
/**
 * 使用 Cloudflare Workers 處理圖片模糊
 */
async function blurImage(imageUrl: string): Promise<Blob> {
  // 1. 獲取原始圖片
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  
  // 2. 使用 Canvas API 模糊處理
  // 注意：Cloudflare Workers 不支持 Canvas API
  // 需要使用 wasm 或其他方案
  
  // ❌ 此方案不可行
}
```

**結論：此方案不可行**

---

#### **選項 4：簡化方案 - 降低圖片質量 + 縮小尺寸**

```typescript
/**
 * 生成低質量頭像 URL（模擬模糊效果）
 */
function getBlurredAvatarUrl(originalUrl: string): string {
  // Telegram Bot API 支持獲取不同尺寸的頭像
  // 使用最小尺寸 + 放大顯示 = 模糊效果
  return originalUrl; // 使用最小尺寸的頭像
}
```

**優點：**
- ✅ 實現簡單
- ✅ 無需額外服務

**缺點：**
- ⚠️ 模糊效果不理想
- ⚠️ 可能不符合「霧化濾鏡」的要求

---

### 4.3 推薦實現方案

**階段 1：MVP（最小可行產品）**
- 使用 Telegram 內嵌照片
- 免費用戶：使用最小尺寸頭像（模擬模糊）
- VIP 用戶：使用最大尺寸頭像

**階段 2：完整版**
- 集成 Cloudflare Images 或第三方服務
- 實現真正的模糊濾鏡效果

---

### 4.4 代碼實現位置

#### **新增文件：**
```
src/services/avatar.ts          # 頭像服務
src/domain/avatar.ts            # 頭像領域邏輯
```

#### **修改文件：**
```
src/services/conversation_history.ts    # 更新歷史帖子創建邏輯
src/domain/conversation_history.ts      # 更新內容構建函數
src/db/queries/conversation_history_posts.ts  # 添加頭像 URL 欄位
```

#### **數據庫變更：**
```sql
-- 添加頭像 URL 欄位到 conversation_history_posts 表
ALTER TABLE conversation_history_posts 
ADD COLUMN partner_avatar_url TEXT DEFAULT NULL;
```

---

## 5. VIP 權益更新

### 5.1 新增 VIP 權益

在所有 VIP 相關說明中添加：

```
✨ VIP 專屬權益：
• 解鎖對方清晰頭像 🆕
• 每日 30 個漂流瓶配額（免費 3 個）
• 邀請好友最多獲得 70 個額外配額（免費 7 個）
• 優先配對推薦
• 無廣告體驗
```

### 5.2 需要更新的位置

1. **VIP 購買頁面** (`src/telegram/handlers/vip.ts`)
2. **VIP 權益說明** (`/vip` 命令)
3. **對話歷史帖子提示** (免費用戶看到模糊頭像時)
4. **幫助文檔** (`/help` 命令)
5. **SPEC.md** (VIP 權益章節)

### 5.3 免費用戶提示

當免費用戶查看對話歷史時，在帖子中添加提示：

```
🔒 升級 VIP 解鎖對方清晰頭像
使用 /vip 了解更多
```

---

## 6. 風險評估

### 6.1 技術風險

| 風險 | 影響 | 可能性 | 緩解措施 |
|------|------|--------|----------|
| 無法獲取頭像（隱私設置） | 中 | 高 | 優雅降級，顯示默認頭像或不顯示 |
| 圖片處理服務不穩定 | 中 | 低 | 降級到原始圖片 |
| 消息編輯失敗 | 低 | 低 | 記錄日誌，不影響主流程 |

### 6.2 業務風險

| 風險 | 影響 | 可能性 | 緩解措施 |
|------|------|--------|----------|
| 用戶反感模糊效果 | 中 | 中 | 提供清晰的 VIP 升級提示 |
| VIP 轉化率未提升 | 低 | 低 | 結合其他 VIP 權益 |

### 6.3 隱私風險

| 風險 | 影響 | 可能性 | 緩解措施 |
|------|------|--------|----------|
| 侵犯用戶隱私 | 高 | 低 | 只顯示公開頭像，尊重隱私設置 |

---

## 7. 開發計劃

### 7.1 開發階段

#### **階段 1：基礎實現（3-4 小時）**
- [ ] 實現頭像獲取服務 (`src/services/avatar.ts`)
- [ ] 更新對話歷史帖子邏輯
- [ ] 數據庫遷移（添加 `partner_avatar_url` 欄位）
- [ ] 基礎測試

#### **階段 2：VIP 差異化（1-2 小時）**
- [ ] 實現免費/VIP 用戶頭像差異邏輯
- [ ] 添加模糊處理（MVP：使用小尺寸圖片）
- [ ] 更新 VIP 權益說明

#### **階段 3：測試與優化（1-2 小時）**
- [ ] 完整測試（有頭像、無頭像、免費、VIP）
- [ ] 性能優化
- [ ] 文檔更新

#### **階段 4：完整模糊濾鏡（可選，2-3 小時）**
- [ ] 集成 Cloudflare Images 或第三方服務
- [ ] 實現真正的模糊濾鏡效果

---

### 7.2 測試計劃

#### **單元測試**
- [ ] 頭像獲取邏輯
- [ ] 模糊 URL 生成邏輯
- [ ] VIP 狀態判斷邏輯

#### **集成測試**
- [ ] 有頭像用戶 + 免費用戶
- [ ] 有頭像用戶 + VIP 用戶
- [ ] 無頭像用戶 + 免費用戶
- [ ] 無頭像用戶 + VIP 用戶

#### **手動測試**
- [ ] 對話歷史帖子顯示正確
- [ ] 模糊效果符合預期
- [ ] VIP 升級後頭像變清晰
- [ ] 無頭像用戶優雅降級

---

## 8. 待決策問題

### 8.1 圖片模糊處理方案

**問題：** 使用哪種方案實現圖片模糊？

**選項：**
1. **MVP 方案**：使用小尺寸圖片（簡單，但效果一般）
2. **完整方案**：使用 Cloudflare Images 或第三方服務（效果好，但複雜）

**建議：** 先實現 MVP 方案，驗證用戶反饋後再決定是否升級

---

### 8.2 無頭像用戶處理

**問題：** 無頭像用戶如何處理？

**選項：**
1. 不顯示任何圖片
2. 顯示默認頭像（如 Telegram 默認頭像）
3. 顯示用戶暱稱首字母頭像

**建議：** 不顯示任何圖片（最簡單，符合隱私原則）

---

### 8.3 歷史帖子更新策略

**問題：** 已存在的歷史帖子是否需要更新？

**選項：**
1. 只對新創建的帖子添加頭像
2. 批量更新所有現有帖子（可能觸發 Telegram API 限制）

**建議：** 只對新創建的帖子添加頭像

---

## 9. 總結

### 9.1 可行性結論

✅ **技術可行**：Telegram Bot API 支持獲取頭像和發送照片  
✅ **業務可行**：符合 VIP 增值邏輯，提升用戶體驗  
⚠️ **需要權衡**：模糊處理方案需要在簡單性和效果之間權衡

### 9.2 推薦實施方案

1. **階段 1（MVP）**：使用小尺寸圖片模擬模糊效果
2. **階段 2（可選）**：根據用戶反饋決定是否升級到真正的模糊濾鏡

### 9.3 預估工作量

- **MVP 版本**：5-6 小時
- **完整版本**：8-10 小時

---

## 10. 附錄

### 10.1 相關文檔

- [Telegram Bot API - getUserProfilePhotos](https://core.telegram.org/bots/api#getuserprofilephotos)
- [Telegram Bot API - sendPhoto](https://core.telegram.org/bots/api#sendphoto)
- [Cloudflare Images - Transform Images](https://developers.cloudflare.com/images/transform-images/)

### 10.2 參考實現

```typescript
// 示例：獲取並發送頭像
const avatarUrl = await getUserAvatarUrl(telegram, partnerTelegramId);

if (avatarUrl) {
  const displayUrl = user.is_vip 
    ? avatarUrl  // VIP: 清晰
    : getBlurredAvatarUrl(avatarUrl);  // 免費: 模糊
  
  await telegram.sendPhoto(chatId, displayUrl, {
    caption: historyPostContent,
    parse_mode: 'Markdown'
  });
} else {
  // 無頭像，發送純文字
  await telegram.sendMessage(chatId, historyPostContent);
}
```

---

**文檔結束**

