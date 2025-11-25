# i18n 未使用 Keys 安全分析报告

**日期**: 2025-01-18  
**目的**: 验证"未使用"的 keys 是否真的没有被使用

---

## ⚠️ 重要发现

### 1. 数据库中的 Keys（16 个）

**发现**: 有 16 个 `tasks.*` keys 存储在数据库中，但被标记为"未使用"

这些 keys 包括：
- `tasks.name.interests`
- `tasks.description.interests`
- `tasks.name.bio`
- `tasks.description.bio`
- `tasks.name.city`
- `tasks.description.city`
- `tasks.name.join_channel`
- `tasks.description.join_channel`
- `tasks.name.first_bottle`
- `tasks.description.first_bottle`
- `tasks.name.first_catch`
- `tasks.description.first_catch`
- `tasks.name.first_conversation`
- `tasks.description.first_conversation`
- `tasks.name.invite_progress`
- `tasks.description.invite_progress`

**使用方式**:
```typescript
// 代码从数据库读取 task.name，然后使用 i18n.t(task.name)
const task = await getTaskFromDB();
const translatedName = i18n.t(task.name);  // 动态使用，静态扫描无法检测
```

**结论**: ❌ **这些 keys 不能删除！它们通过数据库动态使用**

---

## 📊 扫描局限性

### 静态扫描无法检测的情况

1. **数据库存储的 keys**
   - Keys 存储在数据库表中
   - 代码从数据库读取后动态使用 `i18n.t(key)`
   - 示例: `tasks` 表的 `name` 和 `description` 字段

2. **动态拼接的 keys**
   - Keys 通过变量或字符串拼接生成
   - 示例: `i18n.t('prefix.' + variable)`

3. **配置文件中的 keys**
   - Keys 定义在配置文件中
   - 运行时从配置文件读取

4. **条件使用的 keys**
   - Keys 只在特定条件下使用
   - 示例: 只在 VIP 用户或特定功能中使用

---

## ✅ 验证结果

### 已验证在使用中的 Keys

- ✅ `catch.settings10` - 在代码中使用（6 处）
- ✅ `profile.settings` - 在代码中使用（7 处）
- ✅ `common.notSet` - 在代码中使用（21 处）

### 需要保留的 Keys（即使标记为未使用）

1. **所有 `tasks.*` keys** (16 个)
   - 存储在数据库中
   - 通过 `i18n.t(task.name)` 动态使用

2. **可能通过其他方式使用的 keys**
   - 需要进一步验证

---

## 🎯 安全清理建议

### ❌ 不建议删除

1. **所有 `tasks.*` keys** - 存储在数据库中
2. **所有 `admin.*` keys** - 可能只在管理员功能中使用
3. **所有 `broadcast.*` keys** - 可能只在广播功能中使用
4. **所有 `errors.*` keys** - 错误消息可能通过异常处理使用
5. **所有 `warnings.*` keys** - 警告消息可能通过条件判断使用

### ✅ 可以安全删除（需要进一步验证）

1. **完全重复的 keys**（如 `admin.settings4`, `admin.settings5`, `admin.settings6`）
   - 前提：确认它们真的没有被使用
   - 前提：有对应的 `common.notSet` 在使用

2. **旧的、已废弃的 keys**
   - 前提：确认功能已完全移除

---

## 📋 推荐的清理流程

### Phase 1: 保护关键 Keys（必须）

1. **创建白名单**
   ```typescript
   const PROTECTED_KEYS = [
     // Tasks keys (数据库中使用)
     ...Array.from({ length: 16 }, (_, i) => `tasks.name.${taskNames[i]}`),
     ...Array.from({ length: 16 }, (_, i) => `tasks.description.${taskNames[i]}`),
     
     // 其他关键 keys
     'catch.settings10',
     'profile.settings',
     // ...
   ];
   ```

2. **从"未使用"列表中排除白名单**
   - 确保这些 keys 不会被删除

### Phase 2: 手动验证（推荐）

1. **检查每个 namespace**
   - `admin.*` - 检查是否只在管理员功能中使用
   - `broadcast.*` - 检查是否只在广播功能中使用
   - `errors.*` - 检查是否通过异常处理使用

2. **检查重复的 keys**
   - 确认重复的 keys 中哪些真的没有被使用
   - 确认是否有对应的统一 key 在使用

### Phase 3: 保守清理（如果执行）

1. **只删除确认未使用的重复 keys**
   - 例如: `admin.settings4`, `admin.settings5`, `admin.settings6`
   - 前提: 确认 `common.notSet` 或 `catch.settings10` 在使用

2. **保留所有可能有用的 keys**
   - 宁可多保留，也不要误删

---

## ⚠️ 风险警告

### 高风险操作

- ❌ **批量删除"未使用"的 keys** - 可能删除正在使用的 keys
- ❌ **不验证就删除** - 可能导致运行时错误
- ❌ **删除数据库中的 keys** - 会导致功能完全失效

### 安全操作

- ✅ **创建白名单保护关键 keys**
- ✅ **手动验证每个 namespace**
- ✅ **分阶段执行，每次只处理一小部分**
- ✅ **完整测试后再删除**

---

## 🎯 最终建议

### 立即执行（低风险）

1. ✅ **创建白名单保护关键 keys**
   - 所有 `tasks.*` keys
   - 所有正在使用的 keys（如 `catch.settings10`, `profile.settings`）

2. ✅ **更新对比脚本**
   - 排除数据库中的 keys
   - 排除白名单中的 keys

### 延迟执行（需要更多验证）

1. ⚠️ **清理重复的 keys**
   - 需要逐个验证
   - 需要确认功能不受影响

2. ⚠️ **删除未使用的 keys**
   - 需要更全面的验证
   - 建议在翻译完成后执行

---

## 📝 结论

**当前状况**:
- 2550 个 keys 被标记为"未使用"
- 但其中至少 16 个（tasks keys）实际上在使用中（通过数据库）
- 可能还有更多 keys 通过其他方式使用

**建议**:
- ⚠️ **不要立即批量删除**
- ✅ **先创建白名单保护关键 keys**
- ✅ **手动验证每个 namespace**
- ✅ **保守清理，宁可多保留**

**最安全的做法**:
- 暂时不删除任何 keys
- 等翻译完成后，再考虑清理
- 或者只清理确认重复且未使用的 keys

---

**报告生成时间**: 2025-01-18

