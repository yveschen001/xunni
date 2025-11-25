# i18n 完整性检查报告

**生成时间**: 2025-01-15  
**检查范围**: 所有 `src/**/*.ts` 文件  
**CSV 文件**: `i18n_for_translation.csv`

## 执行摘要

### 总体状态

- ⚠️ **需要修复**: 262 个缺失的 i18n keys
- ⚠️ **需要修复**: 95 个文件中有硬编码中文
- ✅ **已完成**: 数据库迁移脚本已创建
- ✅ **已完成**: 代码中已实现向后兼容处理

### 关键指标

| 指标 | 数量 | 状态 |
|------|------|------|
| 代码中使用的 keys | 606 | ✅ |
| CSV 中存在的 keys | 2003 | ✅ |
| 缺失的 keys | 262 | ❌ |
| 有硬编码的文件 | 95 | ❌ |
| 数据库迁移脚本 | 1 | ✅ |

## 详细检查结果

### 1. i18n Keys 对应关系

#### 代码中使用但 CSV 中缺失的 keys（262 个）

**主要类别**：

1. **Admin 相关** (14 个)
   - `admin.banUsageError`
   - `admin.banUserNotFound`
   - `admin.cannotBanAdmin`
   - `admin.error`
   - `admin.listFooter`
   - `admin.listNotRegistered`
   - `admin.listRoleAdmin`
   - `admin.listRoleSuperAdmin`
   - `admin.listTitle`
   - `admin.onlyAdmin`
   - `admin.onlySuperAdmin`
   - `admin.unbanNotBanned`
   - `admin.unbanUsageError`
   - `admin.unbanUserNotFound`

2. **Bottle/Catch 相关** (20+ 个)
   - `bottle.bottle13`
   - `bottle.throw.aiModerationFailed`
   - `buttons.cancel`
   - `catch.anonymousUser`
   - `catch.back`
   - `catch.banned`
   - `catch.block`
   - `catch.bottle`
   - `catch.bottle2`
   - `catch.bottle4`
   - `catch.bottle5`
   - `catch.conversation2`
   - `catch.conversation3`
   - `catch.conversationError`
   - `catch.message4`
   - `catch.message5`
   - ... (更多)

3. **其他类别**
   - 各种错误消息
   - 按钮文本
   - 用户提示
   - 成功消息

**完整列表**: 见 `missing_keys.txt`

#### CSV 中存在但代码中未使用的 keys

- **数量**: 约 1400+ 个
- **说明**: 这些 keys 可能是：
  1. 为未来功能预留的
  2. 已废弃但未清理的
  3. 在其他地方使用的（如数据库）

### 2. 硬编码中文检查

#### 统计

- **有硬编码的文件**: 95 个
- **主要分布**:
  - `src/telegram/handlers/*.ts`
  - `src/services/*.ts`
  - `src/utils/*.ts`

#### 常见问题

1. **模板字符串中的中文**:
   ```typescript
   // ❌ 错误
   `已選擇：${selectedMBTI.join(', ')}`
   
   // ✅ 正确
   i18n.t('common.selected', { items: selectedMBTI.join(', ') })
   ```

2. **错误消息中的硬编码**:
   ```typescript
   // ❌ 错误
   await telegram.sendMessage(chatId, '❌ 發生錯誤');
   
   // ✅ 正确
   await telegram.sendMessage(chatId, i18n.t('errors.systemError'));
   ```

3. **按钮文本中的硬编码**:
   ```typescript
   // ❌ 错误
   [{ text: '返回', callback_data: 'back' }]
   
   // ✅ 正确
   [{ text: i18n.t('buttons.back'), callback_data: 'back' }]
   ```

### 3. 数据库迁移检查

#### 迁移脚本状态

✅ **已完成**:
- 文件: `src/db/migrations/0050_update_tasks_to_i18n_keys.sql`
- 包含 8 个任务的迁移:
  - `task_interests` → `tasks.name.interests` / `tasks.description.interests`
  - `task_bio` → `tasks.name.bio` / `tasks.description.bio`
  - `task_city` → `tasks.name.city` / `tasks.description.city`
  - `task_join_channel` → `tasks.name.join_channel` / `tasks.description.join_channel`
  - `task_first_bottle` → `tasks.name.first_bottle` / `tasks.description.first_bottle`
  - `task_first_catch` → `tasks.name.first_catch` / `tasks.description.first_catch`
  - `task_first_conversation` → `tasks.name.first_conversation` / `tasks.description.first_conversation`
  - `task_invite_progress` → `tasks.name.invite_progress` / `tasks.description.invite_progress`

#### CSV 中包含的 tasks keys

✅ **所有 16 个 keys 都在 CSV 中**:
- `tasks.name.*` (8 个)
- `tasks.description.*` (8 个)

#### 代码实现

✅ **向后兼容处理已实现**:
- `src/telegram/handlers/tasks.ts`: 检查 `task.name.startsWith('tasks.name.')`
- `src/telegram/handlers/menu.ts`: 检查 `task.name.startsWith('tasks.name.')` 和 `task.description.startsWith('tasks.description.')`

#### 待处理

⚠️ **`task_confirm_country` 未包含在迁移脚本中**:
- 该任务在 `0046_add_country_confirmation_task.sql` 中创建
- 需要添加到迁移脚本或创建新的迁移

## 修复计划

### 阶段 1: 添加缺失的 keys（优先级：高）

1. **提取所有缺失的 keys**
   ```bash
   comm -23 /tmp/code_keys.txt /tmp/csv_keys.txt > missing_keys.txt
   ```

2. **添加到 `src/i18n/locales/zh-TW.ts`**
   - 按命名空间组织
   - 使用正确的中文翻译

3. **添加到 `i18n_for_translation.csv`**
   - 确保格式正确
   - 至少填写 zh-TW 和 en 列

### 阶段 2: 修复硬编码（优先级：高）

1. **运行硬编码检查**
   ```bash
   pnpm check:i18n > hardcoded_issues.txt
   ```

2. **逐个文件修复**
   - 按文件分组问题
   - 创建或使用现有的 i18n key
   - 替换硬编码为 `i18n.t(key)`

3. **验证修复**
   ```bash
   pnpm check:i18n
   pnpm lint
   pnpm typecheck
   ```

### 阶段 3: 完善数据库迁移（优先级：中）

1. **添加 `task_confirm_country` 到迁移脚本**
   ```sql
   UPDATE tasks 
   SET name = 'tasks.name.confirm_country',
       description = 'tasks.description.confirm_country'
   WHERE id = 'task_confirm_country';
   ```

2. **添加对应的 keys 到 CSV**
   - `tasks.name.confirm_country`
   - `tasks.description.confirm_country`

3. **验证迁移脚本**
   - 在测试环境执行
   - 验证数据正确性

## 检查工具

### 自动化检查脚本

已创建: `scripts/verify-i18n-completeness.ts`

**功能**:
- 提取代码中使用的所有 i18n keys
- 提取 CSV 中的所有 keys
- 提取 zh-TW.ts 中的所有 keys
- 检查硬编码中文
- 检查数据库迁移

**使用方法**:
```bash
pnpm tsx scripts/verify-i18n-completeness.ts
```

### 手动检查命令

```bash
# 1. 提取代码中使用的 keys
grep -roh "i18n\.t('[^']*')" src --include="*.ts" | \
  sed "s/i18n\.t('//;s/')$//" | sort -u > code_keys.txt

# 2. 提取 CSV 中的 keys
tail -n +2 i18n_for_translation.csv | \
  cut -d',' -f1 | sort > csv_keys.txt

# 3. 找出缺失的 keys
comm -23 code_keys.txt csv_keys.txt > missing_keys.txt

# 4. 检查硬编码
pnpm check:i18n

# 5. 检查数据库迁移
grep -E "tasks\.(name|description)\." src/db/migrations/*.sql
```

## 结论

### 当前状态

- ✅ **数据库迁移**: 已完成（8/9 个任务）
- ⚠️ **i18n Keys**: 262 个缺失，需要添加到 CSV
- ⚠️ **硬编码**: 95 个文件需要修复

### 建议

1. **立即修复**: 添加缺失的 262 个 keys 到 CSV
2. **逐步修复**: 按文件修复硬编码问题
3. **完善迁移**: 添加 `task_confirm_country` 到迁移脚本

### 预计工作量

- **添加缺失 keys**: 2-4 小时
- **修复硬编码**: 8-16 小时（取决于文件数量）
- **完善迁移**: 30 分钟

**总计**: 约 10-20 小时

