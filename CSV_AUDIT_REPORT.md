# CSV 审计报告

**日期**: 2025-01-18  
**CSV 文件**: `i18n_for_translation.csv`  
**总记录数**: 3742

---

## ✅ 1. 重复的 Keys

**结果**: ✅ **没有发现重复的 keys**

所有 3742 个 keys 都是唯一的，没有重复定义。

---

## ⚠️ 2. 过短的翻译（1-2个字）

**发现**: 105 个过短的翻译

这些主要是：
- 状态值：`"永久"`, `"無"`, `"未知"`, `"取消"`, `"男"`, `"女"`
- 按钮文本：`"取消"`, `"跳過"`
- 数据值：`"騙錢"`, `"投資"`, `"賺錢"`, `"匯款"`, `"轉帳"`, `"密碼"`, `"传销"`, `"金融"`

**建议**: 这些过短的翻译通常是合理的，因为它们是：
- 状态标识符（如"男"、"女"）
- 按钮文本（如"取消"）
- 数据值（如"投資"、"賺錢"）

**结论**: ✅ **这些过短的翻译是合理的，不需要修改**

---

## ✅ 3. 过长的翻译（超过500字符）

**结果**: ✅ **没有发现过长的翻译**

所有翻译都在合理长度范围内。

---

## ⚠️ 4. 相同字义的 Keys（需要合并）

**发现**: 656 组相同字义的翻译

### 🔴 最严重的问题（出现次数最多）

#### 1. "未設定" - 出现 **73 次**
```
admin.settings4, admin.settings5, admin.settings6,
bottle.catch.settings10, bottle.catch.settings11, bottle.catch.settings2-9,
bottle.throw.settings5-8, catch.settings2-11, throw.settings5-8,
common.notSet, common.settings12-35,
conversation.settings2-5, menu.settings3-4,
profile.settings, profile.settings2-8, profile.notSet,
stats.notSet, stats.settings2
```

**建议**: 统一使用 `common.notSet`，其他所有 keys 应该引用这个。

#### 2. "無限制" - 出现 **11 次**
```
bottle.throw.short20-23, throw.short20-23,
throw.unlimited, bottle.throw.unlimited, common.unlimited
```

**建议**: 统一使用 `common.unlimited`。

#### 3. "❌ 使用方法錯誤\n\n" - 出现 **8 次**
```
errors.error.text14, admin.addUsageError, admin.removeUsageError,
broadcast.cancelUsageError, broadcast.filterUsageError,
broadcast.usageError, maintenance.usageError, error.text14
```

**建议**: 统一使用 `errors.error.text14` 或创建 `common.usageError`。

#### 4. "未知" - 出现 **6 次**
```
admin.diagnose.unknown, broadcast.target.unknown, catch.unknown,
bottle.catch.unknown, maintenance.unknown, target.unknown
```

**建议**: 统一使用 `common.unknown`。

#### 5. "🏠 返回主選單：/menu" - 出现 **6 次**
```
bottle.catch.back, catch.back, conversation.backToMenuCommand,
conversationHistory.backToMenu, history.returnToMenu, profile.returnToMenu
```

**建议**: 统一使用 `common.backToMenu`。

#### 6. "匿名用戶" - 出现 **6 次**
```
bottle.catch.short3, catch.anonymousUser, catch.short3,
profile.anonymousUser, bottle.catch.anonymousUser, anonymous
```

**建议**: 统一使用 `common.anonymousUser`。

#### 7. "❌ 用戶不存在" - 出现 **6 次**
```
common.userNotFound, error.userNotFound4, errors.error.userNotFound4,
dev.userNotFound, nickname.userNotFound, officialAd.userNotFound
```

**建议**: 统一使用 `common.userNotFound`。

### 🟡 按钮文本重复（用户特别关注）

#### "确认"相关按钮 - 多个变体
```
✅ 已確認！: success.confirm, success.success.confirm, country.confirmed
✅ 確認: success.confirm3, success.success.confirm3
✅ 確定封鎖: conversation.blockConfirmButton, success.success.short15, success.short15
✅ 確定舉報: conversation.reportConfirmButton, success.success.report4, success.report4
```

**建议**: 
- 统一使用 `buttons.confirm` 表示"确认"按钮
- 统一使用 `buttons.confirmBlock` 表示"确定封鎖"
- 统一使用 `buttons.confirmReport` 表示"確定舉報"

#### "同意"相关按钮
```
✅ 我已閱讀並同意: success.short17, success.success.short17, onboarding.iHaveRead
```

**建议**: 统一使用 `buttons.agreeTerms`。

---

## ✅ 5. CSV 生成脚本逻辑检查

**脚本**: `scripts/generate-csv-complete.ts`

### 检查结果

✅ **新增 keys 会追加在末尾**
- 代码：`const allRecords = [...records, ...newRows];`
- 新 keys 会追加在现有记录之后

✅ **会创建备份文件**
- 代码：`writeFileSync(backupPath, csvContent, 'utf-8');`
- 每次更新前会创建 `.backup` 文件

✅ **保持现有记录顺序**
- 代码：`[...records, ...newRows]` 使用展开运算符，保持原有顺序

### 结论

✅ **脚本逻辑正确：新增 keys 只会追加在最下方，不会破坏顺序**

---

## 📊 总结

### ✅ 通过的项目
1. ✅ 没有重复的 keys
2. ✅ 没有过长的翻译
3. ✅ CSV 生成脚本逻辑正确，会保持顺序
4. ✅ 过短的翻译都是合理的（状态值、按钮文本等）

### ⚠️ 需要改进的项目
1. ⚠️ **656 组相同字义的翻译** - 建议合并为统一的 keys
2. ⚠️ **"未設定"出现 73 次** - 最严重，应该统一使用 `common.notSet`
3. ⚠️ **按钮文本重复** - "确认"、"同意"等按钮应该统一

### 💡 建议

1. **立即处理**: 将 "未設定" 的 73 个 keys 统一为 `common.notSet`
2. **优先处理**: 统一按钮文本（确认、同意、取消等）
3. **逐步优化**: 其他相同字义的 keys 可以逐步合并

### 🎯 关于 CSV 导出

**可以确定**：
- ✅ CSV 导出没问题
- ✅ 新增 keys 只会追加在最下方
- ✅ 不会破坏现有 keys 的顺序
- ✅ 会创建备份文件

**可以安全导出 CSV 进行翻译**。

---

**报告生成时间**: 2025-01-18

