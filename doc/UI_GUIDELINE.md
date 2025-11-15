# XunNi UI 設計指南

> **本文檔定義 XunNi 專案的 UI 設計規範、動畫規範和互動體驗標準。**

## 1. 設計原則

### 1.1 核心原則

- **簡潔友好**：界面簡潔，避免過度設計
- **一致性**：所有頁面保持一致的視覺風格和互動模式
- **可訪問性**：支援深/淺色主題，符合 Telegram Mini App 最佳實踐
- **性能優先**：動畫流暢但不影響性能，首屏載入 < 2 秒

### 1.2 設計系統

**色彩系統**：
- 使用 Telegram `themeParams` 自動適配深/淺色主題
- 主色調：`themeParams.button_color`（預設 #3390ec）
- 背景色：`themeParams.bg_color`
- 文字色：`themeParams.text_color`
- 次要文字：`themeParams.hint_color`

**字體系統**：
- 標題：16-18px，粗體
- 正文：14-16px，常規
- 輔助文字：12-14px，常規
- 使用系統字體（San Francisco / Roboto）

**間距系統**：
- 基礎間距：8px
- 小間距：4px
- 大間距：16px、24px、32px
- 卡片內邊距：16px
- 卡片外邊距：12px

**圓角系統**：
- 小圓角：8px（按鈕、標籤）
- 中圓角：12px（卡片）
- 大圓角：16px（模態框）

---

## 2. 動畫規範

### 2.1 動畫原則

- **時長**：所有動畫時長控制在 200-400ms
- **緩動函數**：使用 `cubic-bezier(0.4, 0.0, 0.2, 1)`（Material Design 標準緩動）
- **性能**：優先使用 CSS `transform` 和 `opacity`，避免觸發重排
- **可訪問性**：支援 `prefers-reduced-motion`，為使用者提供關閉動畫選項

### 2.2 進頁面動畫（Page Enter）

**場景**：進入新頁面時

**動畫效果**：
```css
@keyframes pageEnter {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-enter {
  animation: pageEnter 300ms cubic-bezier(0.4, 0.0, 0.2, 1);
}
```

**使用場景**：
- 從列表進入詳情頁
- 從主頁進入功能頁面
- 從對話列表進入對話詳情

**實作範例**：
```typescript
// src/mini-app/components/PageTransition.tsx
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-enter">
      {children}
    </div>
  );
}
```

### 2.3 換頁動畫（Page Transition）

**場景**：頁面切換時

**動畫效果**：
```css
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOutLeft {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(-100%);
  }
}

.page-transition-enter {
  animation: slideInRight 300ms cubic-bezier(0.4, 0.0, 0.2, 1);
}

.page-transition-exit {
  animation: slideOutLeft 300ms cubic-bezier(0.4, 0.0, 0.2, 1);
}
```

**使用場景**：
- 前進到下一頁（從右滑入）
- 返回上一頁（從左滑出）
- 使用瀏覽器前進/後退按鈕

### 2.4 Loading 狀態動畫

#### 2.4.1 頁面載入 Loading（Skeleton UI）

**場景**：頁面首次載入時

**動畫效果**：
```css
@keyframes skeletonPulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--skeleton-bg) 0%,
    var(--skeleton-highlight) 50%,
    var(--skeleton-bg) 100%
  );
  background-size: 200% 100%;
  animation: skeletonPulse 1.5s ease-in-out infinite;
}

@keyframes skeletonShimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton-shimmer {
  animation: skeletonShimmer 1.5s linear infinite;
}
```

**實作範例**：
```typescript
// src/mini-app/components/SkeletonCard.tsx
export function SkeletonCard() {
  return (
    <div className="card skeleton">
      <div className="skeleton-avatar" />
      <div className="skeleton-text" style={{ width: '60%' }} />
      <div className="skeleton-text" style={{ width: '40%' }} />
    </div>
  );
}
```

**使用場景**：
- 首屏載入（MBTI 測驗題目、個人資料）
- 列表載入（對話列表、漂流瓶列表）
- 詳情頁載入（對話詳情、個人資料卡片）

#### 2.4.2 按鈕 Loading 狀態

**場景**：提交表單、發送訊息時

**動畫效果**：
```css
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.button-loading {
  position: relative;
  pointer-events: none;
}

.button-loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 16px;
  height: 16px;
  margin: -8px 0 0 -8px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
```

**實作範例**：
```typescript
// src/mini-app/components/LoadingButton.tsx
export function LoadingButton({ loading, children, ...props }) {
  return (
    <button
      className={loading ? 'button-loading' : ''}
      disabled={loading}
      {...props}
    >
      {loading ? '載入中...' : children}
    </button>
  );
}
```

#### 2.4.3 下拉刷新 Loading

**場景**：下拉刷新列表時

**動畫效果**：
```css
@keyframes pullRefresh {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(0);
  }
}

.pull-refresh-indicator {
  animation: pullRefresh 300ms cubic-bezier(0.4, 0.0, 0.2, 1);
}

@keyframes refreshSpinner {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.refresh-spinner {
  animation: refreshSpinner 1s linear infinite;
}
```

### 2.5 配對動畫（Matching Animation）

**場景**：撿到瓶子、匹配成功時

**動畫效果**：
```css
@keyframes matchSuccess {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes confetti {
  0% {
    opacity: 1;
    transform: translateY(0) rotate(0deg);
  }
  100% {
    opacity: 0;
    transform: translateY(-100vh) rotate(360deg);
  }
}

.match-success {
  animation: matchSuccess 600ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.confetti {
  position: fixed;
  width: 10px;
  height: 10px;
  background: var(--primary-color);
  animation: confetti 2s ease-out forwards;
}
```

**實作範例**：
```typescript
// src/mini-app/components/MatchAnimation.tsx
export function MatchAnimation({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    // 播放配對成功動畫
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  return (
    <div className="match-success">
      <div className="confetti" style={{ left: '10%', delay: '0s' }} />
      <div className="confetti" style={{ left: '30%', delay: '0.2s' }} />
      <div className="confetti" style={{ left: '50%', delay: '0.4s' }} />
      <div className="confetti" style={{ left: '70%', delay: '0.6s' }} />
      <div className="confetti" style={{ left: '90%', delay: '0.8s' }} />
      <h2>🎉 配對成功！</h2>
    </div>
  );
}
```

**使用場景**：
- 撿到瓶子時顯示配對成功動畫
- 匹配到符合條件的對象時
- 完成 MBTI 測驗時（可選）

### 2.6 訊息發送動畫

**場景**：發送對話訊息時

**動畫效果**：
```css
@keyframes messageSend {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.message-send {
  animation: messageSend 200ms cubic-bezier(0.4, 0.0, 0.2, 1);
}
```

### 2.7 卡片展開/收起動畫

**場景**：展開/收起個人資料卡片、詳情卡片時

**動畫效果**：
```css
@keyframes cardExpand {
  from {
    max-height: 0;
    opacity: 0;
  }
  to {
    max-height: 500px;
    opacity: 1;
  }
}

.card-expand {
  overflow: hidden;
  animation: cardExpand 300ms cubic-bezier(0.4, 0.0, 0.2, 1);
}
```

---

## 3. 互動反饋

### 3.1 按鈕點擊反饋

**場景**：點擊按鈕時

**動畫效果**：
```css
.button:active {
  transform: scale(0.95);
  transition: transform 100ms;
}
```

### 3.2 表單驗證反饋

**場景**：表單驗證錯誤時

**動畫效果**：
```css
@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-10px);
  }
  75% {
    transform: translateX(10px);
  }
}

.input-error {
  animation: shake 300ms;
  border-color: var(--error-color);
}
```

### 3.3 Toast 提示動畫

**場景**：顯示成功/錯誤提示時

**動畫效果**：
```css
@keyframes toastSlideIn {
  from {
    opacity: 0;
    transform: translateY(-100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes toastSlideOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-100%);
  }
}

.toast-enter {
  animation: toastSlideIn 300ms cubic-bezier(0.4, 0.0, 0.2, 1);
}

.toast-exit {
  animation: toastSlideOut 300ms cubic-bezier(0.4, 0.0, 0.2, 1);
}
```

---

## 4. 性能優化

### 4.1 動畫性能最佳實踐

- **使用 `transform` 和 `opacity`**：這兩個屬性不會觸發重排，性能最佳
- **避免使用 `width`、`height`、`top`、`left`**：這些屬性會觸發重排，影響性能
- **使用 `will-change`**：預告瀏覽器元素將發生變化
- **限制動畫數量**：同時運行的動畫不超過 5 個

**實作範例**：
```css
.animated-element {
  will-change: transform, opacity;
  transform: translateZ(0); /* 觸發硬體加速 */
}
```

### 4.2 減少動畫時長

- **快速反饋**：按鈕點擊、表單驗證（100-200ms）
- **頁面轉場**：頁面切換（300ms）
- **複雜動畫**：配對成功、載入完成（500-600ms）

### 4.3 支援 `prefers-reduced-motion`

**實作範例**：
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 5. Telegram Mini App 特定規範

### 5.1 使用 Telegram 原生組件

**MainButton / SecondaryButton**：
```typescript
const tg = window.Telegram.WebApp;

// 主要按鈕
tg.MainButton.setText('發送');
tg.MainButton.onClick(() => {
  // 處理點擊
});
tg.MainButton.show();

// 次要按鈕
tg.SecondaryButton.setText('取消');
tg.SecondaryButton.onClick(() => {
  // 處理點擊
});
tg.SecondaryButton.show();
```

### 5.2 適配深/淺色主題

**實作範例**：
```typescript
// src/mini-app/utils/theme.ts
const tg = window.Telegram.WebApp;
tg.ready();

const theme = tg.themeParams;

// 設置 CSS 變數
document.documentElement.style.setProperty('--bg-color', theme.bg_color || '#ffffff');
document.documentElement.style.setProperty('--text-color', theme.text_color || '#000000');
document.documentElement.style.setProperty('--button-color', theme.button_color || '#3390ec');
document.documentElement.style.setProperty('--hint-color', theme.hint_color || '#999999');
```

### 5.3 首屏載入優化

**要求**：首屏載入 < 2 秒

**策略**：
1. 使用 Skeleton UI 顯示載入狀態
2. 預載關鍵資源（MBTI 題目、翻譯文件）
3. 使用 Service Worker 快取
4. 延遲載入非關鍵資源

**實作範例**：
```typescript
// src/mini-app/pages/Home.tsx
export function Home() {
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // 預載關鍵資源
    Promise.all([
      loadMBTIQuestions(),
      loadTranslations(),
    ]).then(() => {
      setLoading(false);
    });
  }, []);
  
  if (loading) {
    return <SkeletonHome />;
  }
  
  return <HomeContent />;
}
```

---

## 6. 組件規範

### 6.1 卡片組件

**樣式規範**：
```css
.card {
  background: var(--bg-color);
  border-radius: 12px;
  padding: 16px;
  margin: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 200ms, box-shadow 200ms;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

### 6.2 按鈕組件

**樣式規範**：
```css
.button {
  background: var(--button-color);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 100ms, opacity 100ms;
}

.button:active {
  transform: scale(0.95);
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### 6.3 輸入框組件

**樣式規範**：
```css
.input {
  background: var(--bg-color);
  border: 1px solid var(--hint-color);
  border-radius: 8px;
  padding: 12px;
  font-size: 16px;
  color: var(--text-color);
  transition: border-color 200ms;
}

.input:focus {
  outline: none;
  border-color: var(--button-color);
}
```

---

## 7. 響應式設計

### 7.1 斷點系統

- **手機**：< 768px（主要目標）
- **平板**：768px - 1024px（可選支援）
- **桌面**：> 1024px（不支援）

### 7.2 適配策略

- 使用 `vw` 和 `vh` 單位適配不同螢幕尺寸
- 使用 `flexbox` 和 `grid` 實現響應式佈局
- 測試不同設備的顯示效果

---

## 8. 無障礙設計

### 8.1 鍵盤導航

- 所有互動元素支援鍵盤導航
- 使用 `tabindex` 控制焦點順序
- 提供清晰的焦點指示

### 8.2 螢幕閱讀器支援

- 使用語義化 HTML 標籤
- 提供 `aria-label` 和 `aria-describedby`
- 確保所有圖片有 `alt` 文字

---

## 9. 參考資源

- [Telegram Mini App 文檔](https://core.telegram.org/bots/webapps)
- [Material Design 動畫指南](https://material.io/design/motion/)
- [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)
- [CSS Animations 最佳實踐](https://web.dev/animations/)

---

**最後更新**: 2025-01-15  
**維護者**: 專案團隊

