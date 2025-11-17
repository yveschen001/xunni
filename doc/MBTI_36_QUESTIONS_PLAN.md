# MBTI 36 題測試功能計劃

**狀態：** 待開發  
**優先級：** 高  
**預計工時：** 6-8 小時

---

## 📋 功能概述

開發完整的 MBTI 36 題測試，提供更準確的性格測試結果，取代目前的簡化版測試。

---

## 🎯 功能需求

### 1. 測試題目設計

**題目數量：** 36 題  
**測試維度：** 4 個維度，每個維度 9 題

#### 四個維度
1. **E/I (外向/內向)** - 9 題
2. **S/N (實感/直覺)** - 9 題
3. **T/F (思考/情感)** - 9 題
4. **J/P (判斷/感知)** - 9 題

#### 題目格式
- 每題提供兩個選項（A/B）
- 選項代表兩個極端傾向
- 無中立選項，強迫選擇

### 2. 測試流程

```
開始測試
  ↓
顯示說明（約 5 分鐘完成）
  ↓
第 1-9 題（E/I 維度）
  ↓
第 10-18 題（S/N 維度）
  ↓
第 19-27 題（T/F 維度）
  ↓
第 28-36 題（J/P 維度）
  ↓
計算結果
  ↓
顯示 MBTI 類型 + 詳細說明
```

### 3. 結果計算

**計分規則：**
- 每個維度統計 A/B 選項數量
- 多數選項決定該維度結果
- 如果平分（4.5），取第一個選項

**示例：**
```
E/I: 6 個 E, 3 個 I → E
S/N: 4 個 S, 5 個 N → N
T/F: 7 個 T, 2 個 F → T
J/P: 3 個 J, 6 個 P → P

結果：ENTP
```

### 4. 測試入口

**多個入口：**
1. 註冊流程中（替代現有簡化版）
2. `/mbti` 命令（重新測試）
3. `/profile` → 「✏️ 編輯資料」 → 「🧠 重新測試 MBTI」

---

## 📝 MBTI 36 題題庫

### E/I 維度（外向 vs 內向）

1. **題目 1**
   - A: 我喜歡參加大型聚會，認識新朋友
   - B: 我更喜歡小型聚會或一對一的深度交流

2. **題目 2**
   - A: 我在人群中感到充滿活力
   - B: 長時間社交後我需要獨處充電

3. **題目 3**
   - A: 我傾向於先說後想
   - B: 我傾向於先想後說

4. **題目 4**
   - A: 我喜歡成為注意力的焦點
   - B: 我更喜歡在幕後工作

5. **題目 5**
   - A: 我很容易與陌生人開啟對話
   - B: 我需要時間才能與陌生人熟絡

6. **題目 6**
   - A: 我有很多朋友和熟人
   - B: 我有少數幾個親密朋友

7. **題目 7**
   - A: 我喜歡邊說邊想，通過討論理清思路
   - B: 我喜歡獨自思考後再分享想法

8. **題目 8**
   - A: 我覺得獨處太久會感到無聊
   - B: 我享受長時間的獨處

9. **題目 9**
   - A: 我喜歡主動接觸他人
   - B: 我更喜歡等待他人來接觸我

### S/N 維度（實感 vs 直覺）

10. **題目 10**
    - A: 我注重實際和具體的細節
    - B: 我更關注整體概念和可能性

11. **題目 11**
    - A: 我相信經驗和已被證實的方法
    - B: 我喜歡嘗試新的、未經驗證的方法

12. **題目 12**
    - A: 我專注於當下和現實
    - B: 我經常思考未來和可能性

13. **題目 13**
    - A: 我喜歡按部就班地完成任務
    - B: 我喜歡跳躍式思考，同時處理多個想法

14. **題目 14**
    - A: 我更相信五感能感知到的事物
    - B: 我更相信直覺和預感

15. **題目 15**
    - A: 我喜歡具體的指示和明確的步驟
    - B: 我喜歡抽象的概念和理論

16. **題目 16**
    - A: 我記得具體的事實和細節
    - B: 我記得印象和整體感覺

17. **題目 17**
    - A: 我喜歡實用的、可立即應用的知識
    - B: 我喜歡理論的、探索性的知識

18. **題目 18**
    - A: 我傾向於按照傳統方式做事
    - B: 我傾向於尋找創新的方式

### T/F 維度（思考 vs 情感）

19. **題目 19**
    - A: 我做決定時主要基於邏輯和客觀分析
    - B: 我做決定時主要考慮人的感受和價值觀

20. **題目 20**
    - A: 我更看重公平和正義
    - B: 我更看重和諧和同理心

21. **題目 21**
    - A: 我能輕易指出事物的缺陷和問題
    - B: 我傾向於先看到事物的優點

22. **題目 22**
    - A: 我認為誠實比圓滑更重要
    - B: 我認為維護他人感受比直言更重要

23. **題目 23**
    - A: 我在爭論中保持客觀和理性
    - B: 我在爭論中容易受情緒影響

24. **題目 24**
    - A: 我更喜歡分析問題的原因
    - B: 我更關心問題對人的影響

25. **題目 25**
    - A: 我認為原則比人情更重要
    - B: 我認為人情比原則更重要

26. **題目 26**
    - A: 我能輕易做出艱難但正確的決定
    - B: 我很難做出可能傷害他人的決定

27. **題目 27**
    - A: 我喜歡辯論和理性討論
    - B: 我不喜歡衝突和對抗

### J/P 維度（判斷 vs 感知）

28. **題目 28**
    - A: 我喜歡事先計劃和安排
    - B: 我喜歡保持靈活和隨性

29. **題目 29**
    - A: 我喜歡提前完成任務
    - B: 我習慣在截止日期前完成

30. **題目 30**
    - A: 我喜歡有條理和結構化的生活
    - B: 我喜歡自發和開放式的生活

31. **題目 31**
    - A: 我傾向於快速做決定
    - B: 我傾向於保持選項開放

32. **題目 32**
    - A: 我喜歡列清單和制定計劃
    - B: 我不喜歡被計劃束縛

33. **題目 33**
    - A: 未完成的任務會讓我感到不安
    - B: 我能輕鬆應對多個未完成的任務

34. **題目 34**
    - A: 我喜歡事情按計劃進行
    - B: 我享受意外和驚喜

35. **題目 35**
    - A: 我的工作空間通常很整潔
    - B: 我的工作空間通常比較凌亂

36. **題目 36**
    - A: 我喜歡明確的規則和期限
    - B: 我喜歡靈活的規則和寬鬆的期限

---

## 🛠️ 技術實現

### 1. 資料結構

```typescript
// src/domain/mbti_test.ts

export interface MBTIQuestion {
  id: number;
  dimension: 'EI' | 'SN' | 'TF' | 'JP';
  questionZhTW: string;
  questionEn: string;
  optionA: {
    zhTW: string;
    en: string;
    value: 'E' | 'S' | 'T' | 'J';
  };
  optionB: {
    zhTW: string;
    en: string;
    value: 'I' | 'N' | 'F' | 'P';
  };
}

export interface MBTITestSession {
  currentQuestion: number;  // 1-36
  answers: Record<number, 'A' | 'B'>;  // 題號 -> 答案
  startTime: string;
}

export interface MBTIResult {
  type: string;  // e.g., 'ENTP'
  scores: {
    EI: { E: number; I: number };
    SN: { S: number; N: number };
    TF: { T: number; F: number };
    JP: { J: number; P: number };
  };
  description: string;
}
```

### 2. 核心函數

```typescript
// src/domain/mbti_test.ts

export function calculateMBTIResult(
  answers: Record<number, 'A' | 'B'>
): MBTIResult {
  const scores = {
    EI: { E: 0, I: 0 },
    SN: { S: 0, N: 0 },
    TF: { T: 0, F: 0 },
    JP: { J: 0, P: 0 },
  };

  // 統計每個維度的分數
  for (let i = 1; i <= 36; i++) {
    const answer = answers[i];
    const question = MBTI_QUESTIONS[i - 1];
    
    if (answer === 'A') {
      const value = question.optionA.value;
      scores[question.dimension][value]++;
    } else {
      const value = question.optionB.value;
      scores[question.dimension][value]++;
    }
  }

  // 決定每個維度的結果
  const type = 
    (scores.EI.E >= scores.EI.I ? 'E' : 'I') +
    (scores.SN.S >= scores.SN.N ? 'S' : 'N') +
    (scores.TF.T >= scores.TF.F ? 'T' : 'F') +
    (scores.JP.J >= scores.JP.P ? 'J' : 'P');

  return {
    type,
    scores,
    description: getMBTIDescription(type),
  };
}

export function getMBTIDescription(type: string): string {
  const descriptions: Record<string, string> = {
    'INTJ': '建築師 - 富有想像力和戰略性的思考者...',
    'INTP': '邏輯學家 - 創新的發明家...',
    'ENTJ': '指揮官 - 大膽、想像力豐富的領導者...',
    'ENTP': '辯論家 - 聰明好奇的思想家...',
    // ... 其他 12 種類型
  };
  return descriptions[type] || '未知類型';
}
```

### 3. Handler 實現

```typescript
// src/telegram/handlers/mbti_test.ts

export async function handleMBTITest(
  message: TelegramMessage,
  env: Env
): Promise<void> {
  // 1. 顯示測試說明
  // 2. 創建測試 session
  // 3. 顯示第一題
}

export async function handleMBTIAnswer(
  callbackQuery: CallbackQuery,
  env: Env
): Promise<void> {
  // 1. 保存答案
  // 2. 檢查是否完成
  // 3. 如果未完成，顯示下一題
  // 4. 如果完成，計算結果並顯示
}

async function showMBTIQuestion(
  telegram: TelegramService,
  chatId: number,
  questionNum: number,
  language: string
): Promise<void> {
  const question = MBTI_QUESTIONS[questionNum - 1];
  const progress = `${questionNum}/36`;
  
  await telegram.sendMessageWithButtons(
    chatId,
    `📊 MBTI 測試 (${progress})\n\n` +
      `${question.questionZhTW}\n\n` +
      `請選擇最符合你的選項：`,
    [
      [{ text: `A. ${question.optionA.zhTW}`, callback_data: `mbti_answer_${questionNum}_A` }],
      [{ text: `B. ${question.optionB.zhTW}`, callback_data: `mbti_answer_${questionNum}_B` }],
      [{ text: '⏸️ 暫停測試', callback_data: 'mbti_pause' }],
    ]
  );
}
```

### 4. Session 管理

```typescript
// 使用 sessions 表儲存測試進度
const session = {
  telegram_id: '123456',
  session_type: 'mbti_test',
  session_data: JSON.stringify({
    currentQuestion: 15,
    answers: {
      1: 'A', 2: 'B', 3: 'A', // ...
    },
    startTime: '2025-01-16T10:00:00Z',
  }),
};
```

---

## 🎨 UI 設計

### 測試說明

```
🧠 **MBTI 性格測試**

這是一個 36 題的性格測試，幫助你了解自己的性格類型。

⏱️ 預計時間：5-10 分鐘
📊 題目數量：36 題
🎯 測試維度：外向/內向、實感/直覺、思考/情感、判斷/感知

💡 **答題建議：**
• 選擇最符合你的選項
• 不要過度思考
• 沒有對錯，只有適合與否

準備好了嗎？

[🚀 開始測試] [❌ 取消]
```

### 測試題目

```
📊 **MBTI 測試 (15/36)**

我喜歡參加大型聚會，認識新朋友

請選擇最符合你的選項：

[A. 非常同意]
[B. 不太同意]

[⏸️ 暫停測試]

進度：████████░░░░░░░░ 42%
```

### 測試結果

```
🎉 **測試完成！**

你的 MBTI 類型是：**ENTP**
（辯論家）

📊 **各維度得分：**
• 外向 (E) 67% vs 內向 (I) 33%
• 直覺 (N) 78% vs 實感 (S) 22%
• 思考 (T) 89% vs 情感 (F) 11%
• 感知 (P) 67% vs 判斷 (J) 33%

✨ **性格特點：**
辯論家型人格的人聰明好奇，是富有創造力的思想家。他們喜歡挑戰現狀，探索新的可能性。他們善於辯論，能夠從多個角度看待問題...

[📤 分享結果] [🔄 重新測試] [🏠 返回主選單]
```

---

## 📊 資料庫設計

### 測試結果記錄

```sql
-- 可選：記錄測試歷史
CREATE TABLE IF NOT EXISTS mbti_test_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT NOT NULL,
  mbti_type TEXT NOT NULL,
  scores TEXT NOT NULL, -- JSON: {"EI": {"E": 6, "I": 3}, ...}
  test_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
);

CREATE INDEX idx_mbti_history_user ON mbti_test_history(telegram_id);
```

---

## 🧪 測試計劃

### 單元測試
- [ ] 測試題目資料完整性（36 題，每個維度 9 題）
- [ ] 測試結果計算邏輯
- [ ] 測試邊界情況（平分情況）
- [ ] 測試 MBTI 描述獲取

### 集成測試
- [ ] 完整測試流程（36 題）
- [ ] 暫停和恢復測試
- [ ] 測試結果保存
- [ ] 重新測試功能

### 手動測試
- [ ] 註冊流程中的測試
- [ ] `/mbti` 命令測試
- [ ] 暫停和恢復
- [ ] 結果分享功能
- [ ] 多語言支援

---

## 📝 i18n 翻譯

需要翻譯：
- 36 題問題（每題 2 個選項）
- 16 種 MBTI 類型描述
- 測試說明和提示
- UI 文字

---

## 📅 開發時程

### Phase 1: 題庫準備（2 小時）
- [ ] 準備 36 題題目（中英文）
- [ ] 準備 16 種類型描述
- [ ] 資料結構設計

### Phase 2: 核心邏輯（2 小時）
- [ ] 實現計分邏輯
- [ ] 實現結果計算
- [ ] 單元測試

### Phase 3: Handler 實現（2 小時）
- [ ] 測試流程 Handler
- [ ] Session 管理
- [ ] UI 實現

### Phase 4: 整合和測試（2 小時）
- [ ] 整合到註冊流程
- [ ] 整合到 `/mbti` 命令
- [ ] 完整測試
- [ ] 文檔更新

---

## ✅ 驗收標準

- [ ] 36 題題目完整且有意義
- [ ] 計分邏輯正確
- [ ] 所有 16 種類型都有描述
- [ ] 可以暫停和恢復測試
- [ ] 測試結果正確保存
- [ ] UI 友好易用
- [ ] 支援多語言
- [ ] 所有測試通過

---

**建立時間：** 2025-01-16  
**維護者：** 開發團隊  
**狀態：** 待開發

