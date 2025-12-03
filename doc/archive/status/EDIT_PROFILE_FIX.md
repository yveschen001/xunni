# Edit Profile i18n 修复报告

**日期：** 2025-01-17  
**问题：** Edit Profile 页面显示模板字符串和 JavaScript 表达式

---

## 🔍 发现的问题

### 显示的模板字符串

1. `{updatedUser.bio || '未設定'} OKOKOKK`
2. `{user.bio || '未設定'} ${user.bio}`
3. `{updatedUser.interests || '未設定'} 開心`
4. `${updatedUser.gender === 'male' ? 'Male' : 'Female'}`
5. `{updatedUser.gender === 'male' ? '男' : '女'} ${updatedUser.gender === 'male' ? '男' : '女'}`
6. `{updatedUser.mbti_result || '未設定'} ESTJ`

### 根本原因

i18n 字符串中包含 JavaScript 表达式：
- 三元运算符：`${var === 'x' ? 'a' : 'b'}`
- 逻辑或：`${var || 'default'}`

i18n 系统不支持这些表达式，应该由代码处理默认值。

---

## ✅ 已完成的修复

### 1. 修复所有语言文件中的 JavaScript 表达式

**使用脚本：** `scripts/fix_all_js_expressions.cjs`

**修复统计：**
- ✅ **总共修复了 1474 处表达式**
- ✅ **34 种语言全部修复**

**修复的文件：**
- zh-TW.ts: 32 处
- zh-CN.ts: 17 处
- en.ts: 20 处
- ar.ts: 25 处
- 其他 30 种语言：各 46 处

### 2. 修复的关键 keys

**zh-TW.ts:**
- `common.gender` - 移除了三元运算符
- `common.gender3` - 移除了三元运算符
- `common.settings2` - 移除了 `|| '未設定'`
- `common.settings5` - 已修复
- `common.settings7` - 已修复

**en.ts:**
- `common.gender` - 移除了三元运算符和多余文本
- `common.settings2` - 移除了 `|| '未設定'` 和多余文本

### 3. 代码层面的处理

**edit_profile.ts 已经正确处理：**
```typescript
const bioDisplay = user.bio || notSetText;
const interestsDisplay = user.interests || notSetText;
const genderDisplay = user.gender === 'male' ? i18n.t('common.male') : i18n.t('common.female');
const mbtiDisplay = user.mbti_result || notSetText;
```

所以 i18n 字符串只需要 `${updatedUser.bio}` 即可，不需要 `|| '未設定'`。

---

## 📊 修复统计

- **修复的表达式类型：**
  - 三元运算符：`${var === 'x' ? 'a' : 'b'}`
  - 逻辑或：`${var || 'default'}`
  - 复杂三元运算符（嵌套）

- **修复的语言文件：** 34 个
- **修复的表达式总数：** 1474 处

---

## 🚀 部署信息

- **环境：** Staging
- **状态：** ✅ 已部署

---

## ✅ 验证

请测试 Edit Profile 页面：
- [ ] 不再显示 `{updatedUser.bio || '未設定'}`
- [ ] 不再显示 `${updatedUser.gender === 'male' ? 'Male' : 'Female'}`
- [ ] 不再显示 `{updatedUser.interests || '未設定'}`
- [ ] 不再显示 `{updatedUser.mbti_result || '未設定'}`
- [ ] 所有字段正确显示实际值

---

**修复完成时间：** 2025-01-17  
**状态：** ✅ 已修复并部署
