# MBTI 测试 i18n 修复

**日期：** 2025-01-17  
**问题：** MBTI 测试的问题和答案硬编码为中文，没有根据用户语言选择

---

## 🔍 问题分析

### 发现的问题

1. **问题和答案硬编码：**
   - `question.question_zh_TW` - 总是显示中文问题
   - `option.text_zh_TW` - 总是显示中文答案
   - 即使数据中有 `question_en` 和 `text_en`，代码也没有使用

2. **结果描述硬编码：**
   - `result.description_zh_TW` - 总是显示中文描述
   - 即使数据中有 `description_en`，代码也没有使用

3. **CSV 中没有这些翻译：**
   - MBTI 问题和答案是硬编码在 `src/domain/mbti_test.ts` 中的
   - 不在 i18n 系统中，所以 CSV 中没有

---

## ✅ 已完成的修复

### 1. 修复问题和答案的语言选择

**修改前：**
```typescript
const answerButtons = question.options.map((option, index) => [
  {
    text: option.text_zh_TW,  // 硬编码中文
    callback_data: `mbti_answer_${questionIndex}_${index}`,
  },
]);

await telegram.sendMessageWithButtons(
  chatId,
  `${question.question_zh_TW}`,  // 硬编码中文
  answerButtons
);
```

**修改后：**
```typescript
// 根据用户语言选择
const userLang = user?.language_pref || 'zh-TW';
const useEnglish = userLang === 'en' || userLang.startsWith('en-');

const questionText = useEnglish ? question.question_en : question.question_zh_TW;

const answerButtons = question.options.map((option, index) => [
  {
    text: useEnglish ? option.text_en : option.text_zh_TW,
    callback_data: `mbti_answer_${questionIndex}_${index}`,
  },
]);

await telegram.sendMessageWithButtons(
  chatId,
  `${questionText}`,
  answerButtons
);
```

### 2. 修复结果描述的语言选择

**修改前：**
```typescript
`${result.description_zh_TW}\n\n` +
```

**修改后：**
```typescript
const userLang = user.language_pref || 'zh-TW';
const useEnglish = userLang === 'en' || userLang.startsWith('en-');
const description = useEnglish ? result.description_en : result.description_zh_TW;

`${description}\n\n` +
```

---

## 📊 当前支持的语言

### 已支持
- ✅ **中文（繁体）** - `zh-TW` - 完整支持
- ✅ **英文** - `en` - 完整支持

### 未支持（需要添加翻译）
- ❌ 其他 32 种语言 - 目前只有 zh-TW 和 en 的翻译

---

## 🎯 关于 CSV

**MBTI 问题和答案不在 CSV 中**，因为：
1. 它们是硬编码在 `src/domain/mbti_test.ts` 中的数据结构
2. 不是通过 i18n 系统管理的
3. 目前只有 zh-TW 和 en 两种语言的翻译

**如果需要支持更多语言：**
1. 需要在 `MBTIQuestion` 接口中添加更多语言字段（如 `question_ar`, `text_ar` 等）
2. 或者在 `src/domain/mbti_test.ts` 中为所有问题添加多语言翻译
3. 然后修改代码根据用户语言选择正确的字段

---

## 🚀 部署信息

- **环境：** Staging
- **Version ID：** 959acc6a-8348-46dd-a1d2-5b58c1a80571
- **状态：** ✅ 已部署

---

## ✅ 验证

请测试：
1. **英文用户** - 问题和答案应该显示英文
2. **中文用户** - 问题和答案应该显示中文
3. **其他语言用户** - 目前会显示中文（因为只有 zh-TW 和 en 的翻译）

---

**修复完成时间：** 2025-01-17  
**状态：** ✅ 已修复并部署（支持 zh-TW 和 en）

