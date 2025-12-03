# GigaPub 廣告完成檢測分析

## 📋 問題描述

用戶反饋：廣告似乎在播放完成前就跳到下一則，懷疑完成檢測邏輯有問題。

---

## 🔍 當前實現分析

### **當前代碼邏輯**

```javascript
// public/ad.html line 302-336
const startTime = Date.now();
const result = await window.showGiga();
const duration = Date.now() - startTime;

if (duration < 3000) {
  // 警告：廣告完成太快
  showWarningAndComplete(durationSeconds);
  return;
}

// 正常完成
onAdComplete();
```

### **問題分析**

1. **`window.showGiga()` 的行為不明確**
   - 根據 GigaPub 文檔，`showGiga()` 應該返回一個 Promise
   - Promise 應該在廣告**完全播放完成**後 resolve
   - 但實際行為可能不同

2. **可能的原因**
   - GigaPub SDK 可能在廣告**開始播放**時就 resolve
   - 或者在廣告**可跳過**時就 resolve
   - 或者在**用戶關閉廣告**時就 resolve

3. **當前檢測方式的局限性**
   - 僅依賴時間檢測（< 3秒）
   - 沒有監聽 GigaPub 的具體事件
   - 無法區分「廣告播放完成」vs「廣告被跳過」

---

## 🎯 改進方案

### **方案 A：增強日誌記錄（已實現）**

**目的**：收集更多數據來診斷問題

**已添加的日誌**：
- ✅ 廣告開始時間戳
- ✅ 廣告完成時間戳
- ✅ 實際播放時長
- ✅ GigaPub 返回的 result 對象
- ✅ 警告標記（< 3秒）

**下一步**：
- 用戶測試並提供 Console 日誌
- 分析實際播放時長
- 確認 GigaPub result 對象內容

---

### **方案 B：添加手動確認按鈕**

**實現方式**：
```javascript
async function startGigaPubAd() {
  try {
    // 顯示廣告容器
    const container = document.getElementById('adContainer');
    container.innerHTML = `
      <div id="gigapub-ad-container"></div>
      <button id="confirm-btn" style="display: none;">
        ✅ 我已觀看完廣告
      </button>
    `;

    // 調用 GigaPub
    await window.showGiga();

    // 顯示確認按鈕
    document.getElementById('confirm-btn').style.display = 'block';
    
    // 等待用戶點擊
    await waitForUserConfirmation();
    
    // 完成
    onAdComplete();
  } catch (error) {
    showError('廣告加載失敗', error.message);
  }
}

function waitForUserConfirmation() {
  return new Promise((resolve) => {
    document.getElementById('confirm-btn').onclick = resolve;
  });
}
```

**優點**：
- ✅ 確保用戶真的看完廣告
- ✅ 避免誤判
- ✅ 用戶體驗清晰

**缺點**：
- ❌ 增加一個額外步驟
- ❌ 可能被濫用（不看廣告直接點按鈕）

---

### **方案 C：監聽 GigaPub 事件（推薦）**

**實現方式**：
```javascript
async function startGigaPubAd() {
  try {
    // 設置事件監聽器
    let adStarted = false;
    let adCompleted = false;

    // 監聽 GigaPub 事件（如果有提供）
    window.addEventListener('giga-ad-started', () => {
      console.log('[GigaPub] Ad started');
      adStarted = true;
    });

    window.addEventListener('giga-ad-completed', () => {
      console.log('[GigaPub] Ad completed');
      adCompleted = true;
    });

    // 調用 showGiga
    const startTime = Date.now();
    await window.showGiga();
    const duration = Date.now() - startTime;

    // 檢查事件
    if (!adStarted || !adCompleted) {
      console.warn('[GigaPub] Ad events not fired properly');
    }

    // 檢查時長
    if (duration < 3000) {
      showWarningAndComplete(duration / 1000);
      return;
    }

    onAdComplete();
  } catch (error) {
    showError('廣告加載失敗', error.message);
  }
}
```

**優點**：
- ✅ 更準確的完成檢測
- ✅ 可以區分不同狀態
- ✅ 不影響用戶體驗

**缺點**：
- ❌ 需要確認 GigaPub 是否提供這些事件
- ❌ 可能需要聯繫 GigaPub 技術支持

---

### **方案 D：結合時間和用戶行為**

**實現方式**：
```javascript
async function startGigaPubAd() {
  try {
    const container = document.getElementById('adContainer');
    
    // 顯示廣告和倒計時
    container.innerHTML = `
      <div id="gigapub-ad-container"></div>
      <div class="countdown">
        <p>廣告播放中...</p>
        <p id="timer">剩餘時間：<span id="seconds">15</span> 秒</p>
      </div>
    `;

    // 開始倒計時
    let remainingSeconds = 15;
    const timerInterval = setInterval(() => {
      remainingSeconds--;
      document.getElementById('seconds').textContent = remainingSeconds;
      
      if (remainingSeconds <= 0) {
        clearInterval(timerInterval);
        // 時間到，顯示完成按鈕
        showCompleteButton();
      }
    }, 1000);

    // 調用 GigaPub
    const startTime = Date.now();
    await window.showGiga();
    const duration = Date.now() - startTime;

    console.log('[GigaPub] showGiga() resolved after', duration, 'ms');

    // 如果 showGiga 很快就返回，繼續等待倒計時
    if (duration < 15000 && remainingSeconds > 0) {
      console.log('[GigaPub] Waiting for countdown to finish...');
      // 繼續等待倒計時
    } else {
      clearInterval(timerInterval);
      onAdComplete();
    }
  } catch (error) {
    showError('廣告加載失敗', error.message);
  }
}

function showCompleteButton() {
  const container = document.getElementById('adContainer');
  container.innerHTML += `
    <button class="btn" onclick="onAdComplete()">
      ✅ 完成觀看
    </button>
  `;
}
```

**優點**：
- ✅ 確保最少播放時間（15秒）
- ✅ 即使 GigaPub 提前返回也能保證時長
- ✅ 用戶體驗友好

**缺點**：
- ❌ 如果廣告真的很短（< 15秒），用戶需要等待
- ❌ 增加了複雜度

---

## 📊 測試計劃

### **階段 1：數據收集（當前）**

1. ✅ 已添加詳細日誌
2. ⏳ 等待用戶測試
3. ⏳ 收集 Console 日誌
4. ⏳ 分析實際播放時長

### **階段 2：根據數據決定方案**

**如果發現**：
- `duration < 5秒` → 實施方案 D（強制最少時間）
- `duration 5-10秒` → 實施方案 C（監聽事件）
- `duration > 10秒` → 可能是用戶感覺問題，不需要修改

### **階段 3：實施和驗證**

1. 實施選定方案
2. 部署到 Staging
3. 用戶測試
4. 確認問題解決
5. 部署到 Production

---

## 🔧 臨時解決方案

**如果需要立即解決**，可以先實施簡單的強制等待：

```javascript
async function startGigaPubAd() {
  try {
    const container = document.getElementById('adContainer');
    container.innerHTML = `
      <div class="loading">
        <div class="loading-spinner"></div>
        <p>正在加載 GigaPub 廣告...</p>
        <p style="font-size: 12px; color: #999; margin-top: 10px;">
          請耐心等待廣告播放完成（約 15-30 秒）
        </p>
      </div>
    `;

    const startTime = Date.now();
    
    // 調用 GigaPub
    await window.showGiga();
    
    const duration = Date.now() - startTime;
    const minDuration = 10000; // 最少 10 秒

    // 如果完成太快，強制等待
    if (duration < minDuration) {
      const waitTime = minDuration - duration;
      console.log(`[GigaPub] Waiting additional ${waitTime}ms to ensure ad played`);
      
      container.innerHTML = `
        <div class="loading">
          <div class="loading-spinner"></div>
          <p>正在處理...</p>
        </div>
      `;
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    onAdComplete();
  } catch (error) {
    showError('廣告加載失敗', error.message);
  }
}
```

---

## 📝 建議

### **立即行動**：
1. ✅ 用戶測試當前版本
2. ✅ 收集 Console 日誌
3. ✅ 記錄實際播放時長

### **短期（1-2天）**：
- 根據測試數據決定實施哪個方案
- 實施並部署

### **長期**：
- 聯繫 GigaPub 技術支持
- 確認 `showGiga()` 的正確使用方式
- 詢問是否有事件監聽 API

---

## 📞 聯繫 GigaPub 支持

**問題清單**：
1. `window.showGiga()` 返回的 Promise 何時 resolve？
   - 廣告開始播放時？
   - 廣告播放完成時？
   - 用戶關閉廣告時？

2. 是否有事件監聽 API？
   - `giga-ad-started`
   - `giga-ad-completed`
   - `giga-ad-skipped`
   - `giga-ad-error`

3. 如何確保廣告完整播放？
   - 是否有最少播放時間要求？
   - 是否有完成度檢測？

4. 是否有測試模式？
   - 可以模擬不同長度的廣告
   - 可以測試完成檢測邏輯

---

**最後更新**：2025-11-20  
**狀態**：⏳ 等待用戶測試反饋  
**下一步**：根據測試數據決定實施方案

