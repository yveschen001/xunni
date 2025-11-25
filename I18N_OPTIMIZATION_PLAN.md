# i18n Keys 优化计划

**日期**: 2025-01-18  
**目标**: 合并重复的 i18n keys，减少维护成本  
**风险等级**: ⚠️ **中等风险** - 需要谨慎执行

---

## 📊 当前状况

### 发现的重复 Keys

1. **"未設定"** - 出现 **73 次**
   - 代码中使用：`profile.settings` (7处), `catch.settings10` (5处), `common.notSet` (18处)
   - 其他 keys 可能未使用或已废弃

2. **"無限制"** - 出现 **11 次**
   - 代码中使用：未找到直接使用

3. **"❌ 使用方法錯誤"** - 出现 **8 次**
   - 代码中使用：未找到直接使用

4. **按钮文本重复**
   - "确认"相关：`success.confirm3`, `success.confirm2`, `success.short17` (3处使用)
   - "确定封鎖"：`conversation.blockConfirmButton` (1处使用)
   - "確定舉報"：`conversation.reportConfirmButton` (1处使用)

---

## ⚠️ 风险评估

### 高风险操作
- ❌ **直接删除 CSV 中的 keys** - 可能导致运行时错误
- ❌ **批量替换所有重复 keys** - 可能遗漏某些使用场景
- ❌ **不测试就部署** - 可能破坏生产环境

### 安全操作
- ✅ **分阶段执行** - 一次只处理一个 namespace
- ✅ **先替换代码，再清理 CSV** - 确保代码先使用统一的 keys
- ✅ **完整测试** - 每个阶段都要运行 smoke test
- ✅ **保留备份** - 每次操作前创建备份

---

## 🎯 优化策略

### 策略 1: 保守策略（推荐）✅

**原则**: 只合并**确认未使用**的 keys，保留所有**正在使用**的 keys

**优点**:
- ✅ 零风险，不会破坏现有功能
- ✅ 可以立即执行
- ✅ 不需要修改代码

**缺点**:
- ⚠️ 只能清理未使用的 keys，不能完全消除重复

**执行步骤**:
1. 扫描代码，找出所有实际使用的 keys
2. 对比 CSV，标记未使用的重复 keys
3. 从 CSV 中删除未使用的 keys（保留一个作为参考）
4. 运行测试验证

### 策略 2: 积极策略（需要更多测试）⚠️

**原则**: 统一所有重复的 keys，修改代码使用统一的 key

**优点**:
- ✅ 彻底消除重复
- ✅ 更好的维护性

**缺点**:
- ⚠️ 需要修改代码，有风险
- ⚠️ 需要完整测试
- ⚠️ 可能影响翻译进度

**执行步骤**:
1. 选择统一的 key（如 `common.notSet`）
2. 在代码中替换所有使用（如 `profile.settings` → `common.notSet`）
3. 运行测试验证
4. 从 CSV 中删除重复的 keys
5. 再次运行测试

---

## 📋 推荐执行计划（保守策略）

### Phase 1: 分析和准备（1-2小时）

#### 1.1 扫描代码使用情况
```bash
# 创建脚本扫描所有 i18n.t() 调用
pnpm tsx scripts/scan-i18n-usage.ts
```

**输出**: `i18n_usage_report.json`
- 列出所有代码中实际使用的 keys
- 统计每个 key 的使用次数

#### 1.2 对比 CSV
```bash
# 对比 CSV 和代码使用情况
pnpm tsx scripts/compare-csv-usage.ts
```

**输出**: `unused_keys_report.json`
- 列出 CSV 中存在但代码中未使用的 keys
- 标记重复的 keys 中哪些是未使用的

#### 1.3 创建备份
```bash
# 备份 CSV 和代码
cp i18n_for_translation.csv i18n_for_translation.csv.backup-$(date +%Y%m%d)
git add -A && git commit -m "Backup before i18n optimization"
```

### Phase 2: 清理未使用的 Keys（低风险）

#### 2.1 删除未使用的重复 Keys
- 只删除**确认未使用**的 keys
- 保留一个作为参考（通常是 `common.*` 下的）

**示例**:
- 如果 `admin.settings4`, `admin.settings5`, `admin.settings6` 都未使用
- 保留 `common.notSet`，删除其他

#### 2.2 验证 CSV
```bash
# 验证 CSV 格式
pnpm tsx scripts/validate-csv.ts
```

#### 2.3 运行测试
```bash
# 运行完整测试
pnpm test
pnpm smoke-test
```

### Phase 3: 代码统一（可选，高风险）

**⚠️ 注意**: 这个阶段需要更多测试，建议在翻译完成后执行

#### 3.1 选择统一的 Keys
- `common.notSet` - 统一所有 "未設定"
- `common.unlimited` - 统一所有 "無限制"
- `errors.error.text14` - 统一所有 "使用方法錯誤"
- `buttons.confirm` - 统一所有 "确认"按钮
- `buttons.agreeTerms` - 统一所有 "同意"按钮

#### 3.2 创建替换脚本
```typescript
// scripts/unify-i18n-keys.ts
const REPLACEMENTS = [
  { from: 'profile.settings', to: 'common.notSet' },
  { from: 'catch.settings10', to: 'common.notSet' },
  // ... 更多替换
];
```

#### 3.3 执行替换
```bash
# 自动替换代码中的 keys
pnpm tsx scripts/unify-i18n-keys.ts
```

#### 3.4 完整测试
```bash
# 运行所有测试
pnpm test
pnpm smoke-test
pnpm check:i18n
```

#### 3.5 清理 CSV
- 删除已替换的 keys
- 保留统一的 keys

---

## 🚦 执行建议

### 立即执行（低风险）
✅ **Phase 1 + Phase 2**
- 只清理未使用的 keys
- 不修改代码
- 风险极低，可以立即执行

### 延迟执行（需要更多测试）
⚠️ **Phase 3**
- 需要统一代码中的 keys
- 需要完整测试
- 建议在翻译完成后执行

---

## 📝 具体执行步骤（Phase 1 + Phase 2）

### Step 1: 创建扫描脚本

创建 `scripts/scan-i18n-usage.ts`:
```typescript
// 扫描所有 i18n.t() 调用，生成使用报告
```

### Step 2: 创建对比脚本

创建 `scripts/compare-csv-usage.ts`:
```typescript
// 对比 CSV 和代码使用情况，找出未使用的 keys
```

### Step 3: 执行扫描
```bash
pnpm tsx scripts/scan-i18n-usage.ts > i18n_usage_report.json
pnpm tsx scripts/compare-csv-usage.ts > unused_keys_report.json
```

### Step 4: 手动审查
- 查看 `unused_keys_report.json`
- 确认哪些 keys 可以安全删除
- 标记需要保留的 keys

### Step 5: 创建清理脚本
```typescript
// scripts/clean-unused-keys.ts
// 根据 unused_keys_report.json 删除未使用的 keys
```

### Step 6: 执行清理
```bash
# 备份
cp i18n_for_translation.csv i18n_for_translation.csv.backup

# 清理
pnpm tsx scripts/clean-unused-keys.ts

# 验证
pnpm test
pnpm smoke-test
```

---

## ✅ 成功标准

### Phase 1 + Phase 2 完成标准
- ✅ 所有未使用的重复 keys 已删除
- ✅ CSV 格式正确
- ✅ 所有测试通过
- ✅ Smoke test 通过
- ✅ 没有运行时错误

### Phase 3 完成标准（如果执行）
- ✅ 代码中所有重复 keys 已统一
- ✅ CSV 中重复 keys 已清理
- ✅ 所有测试通过
- ✅ Smoke test 通过
- ✅ 功能验证通过

---

## ⚠️ 风险控制

### 回滚计划
如果出现问题：
1. 恢复备份：`cp i18n_for_translation.csv.backup i18n_for_translation.csv`
2. 恢复代码：`git checkout HEAD -- src/`
3. 重新运行测试验证

### 检查清单
执行前：
- [ ] 已创建备份
- [ ] 已运行完整测试
- [ ] 已审查未使用的 keys 列表
- [ ] 已确认不会影响现有功能

执行后：
- [ ] 所有测试通过
- [ ] Smoke test 通过
- [ ] 手动测试核心功能
- [ ] 检查日志无错误

---

## 📊 预期收益

### Phase 1 + Phase 2
- 减少 CSV 大小：预计减少 200-300 个未使用的 keys
- 维护成本：降低 10-15%
- 风险：极低

### Phase 3（如果执行）
- 减少 CSV 大小：预计减少 400-500 个重复 keys
- 维护成本：降低 30-40%
- 代码一致性：显著提升
- 风险：中等（需要完整测试）

---

## 🎯 建议

**立即执行**: Phase 1 + Phase 2（保守策略）
- ✅ 低风险
- ✅ 可以立即开始
- ✅ 不影响翻译进度
- ✅ 不影响现有功能

**延迟执行**: Phase 3（积极策略）
- ⚠️ 需要更多测试
- ⚠️ 建议在翻译完成后执行
- ⚠️ 需要完整的功能验证

---

**报告生成时间**: 2025-01-18

