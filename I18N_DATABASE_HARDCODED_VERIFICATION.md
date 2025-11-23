# 数据库硬编码中文验证报告

**验证时间**: 2025-01-23  
**状态**: ✅ 已提取，但未替换

---

## 📊 数据库硬编码提取状态

### 1. 已扫描的数据库文件

**SQL 文件**（包含中文）：
- ✅ `src/db/migrations/0030_create_tasks_table.sql` - 任务表（任务名称和描述）
- ✅ `src/db/migrations/0034_update_task_bio_description.sql` - 任务描述更新
- ✅ `src/db/migrations/0046_add_country_confirmation_task.sql` - 国家确认任务
- ✅ `src/db/migrations/0041_create_matching_history.sql` - 匹配历史
- ✅ `src/db/migrations/0027_create_quota_prompts.sql` - 配额提示
- ✅ `src/db/migrations/0026_create_official_ads.sql` - 官方广告
- ✅ `src/db/migrations/0020_create_broadcast_and_maintenance_tables.sql` - 广播和维护
- ✅ `src/db/schema.sql` - 数据库结构

**TypeScript 查询文件**（包含中文）：
- ✅ `src/db/queries/bottles.ts` - 瓶子查询（SQL 注释中的中文）

### 2. 提取结果统计

**从 `i18n_complete_final.json` 中提取的数据库相关内容**：

| 文件 | 提取数量 | 示例内容 |
|------|---------|---------|
| `0030_create_tasks_table.sql` | ~15 个 | 任务名称、任务描述 |
| `0046_add_country_confirmation_task.sql` | 2 个 | 国家确认任务 |
| `bottles.ts` | 3 个 | SQL 注释中的中文 |

**示例提取内容**：
```
✅ "讓別人更了解你..." (任务描述)
✅ "丟出第一個瓶子..." (任务描述)
✅ "撿起第一個瓶子..." (任务描述)
✅ "開始第一次對話..." (任务描述)
✅ "🌍 確認你的國家/地區..." (任务描述)
```

### 3. 数据库硬编码位置

#### A. tasks 表

**字段**：
- `name` - 任务名称（中文）
- `description` - 任务描述（中文）

**示例数据**（从 `0030_create_tasks_table.sql`）：
```sql
INSERT INTO tasks (name, description, ...) VALUES
('讓別人更了解你', '寫下你的故事（至少 20 字）', ...),
('找到同城的朋友', '設定你的地區', ...),
('丟出第一個瓶子', '開始你的交友之旅', ...),
('撿起第一個瓶子', '看看別人的故事', ...),
('開始第一次對話', '建立你的第一個連接（長按訊息 → 選擇「回覆」）', ...),
('邀請好友', '每邀請 1 人，每日額度永久 +1（免費最多 10 人，VIP 最多 100 人）', ...);
```

**状态**：
- ✅ **已提取**：所有任务名称和描述都已提取到 `i18n_complete_final.json`
- ❌ **未替换**：数据库中的数据仍然是中文
- ❌ **未生成迁移脚本**：还没有生成更新数据库的迁移脚本

#### B. 其他表

**可能包含中文的表**：
- `quota_prompts` - 配额提示（`0027_create_quota_prompts.sql`）
- `official_ads` - 官方广告（`0026_create_official_ads.sql`）
- `broadcast_messages` - 广播消息（`0020_create_broadcast_and_maintenance_tables.sql`）

**状态**：
- ✅ **已提取**：相关 SQL 文件中的中文已提取
- ❌ **未替换**：数据库中的数据仍然是中文

---

## ⚠️ 当前状态

### 提取状态

- ✅ **SQL 文件已扫描**：所有包含中文的 SQL 文件都已扫描
- ✅ **中文内容已提取**：所有数据库中的中文硬编码都已提取到 `i18n_complete_final.json`
- ✅ **已生成 keys**：已为数据库内容生成 i18n keys

### 替换状态

- ❌ **数据库未更新**：数据库中的数据仍然是中文
- ❌ **未生成迁移脚本**：还没有生成更新数据库的迁移脚本
- ❌ **代码未更新**：读取数据库数据的代码还没有使用 `i18n.t()`

---

## 🔧 需要做的工作

### 1. 生成数据库迁移脚本

**需要创建迁移脚本**，将数据库中的中文替换为 i18n keys：

```sql
-- 示例：更新 tasks 表
UPDATE tasks 
SET name = 'tasks.name.invite_friends',
    description = 'tasks.description.invite_friends'
WHERE name = '邀請好友';
```

**脚本位置**：
- `scripts/generate-db-migration.ts` - 生成迁移脚本
- `src/db/migrations/XXXX_update_tasks_to_i18n_keys.sql` - 迁移脚本

### 2. 更新代码读取逻辑

**需要修改代码**，在显示数据库数据时使用 i18n：

```typescript
// 替换前
const taskName = task.name;  // 直接使用数据库中的中文

// 替换后
const taskName = i18n.t(task.name);  // 使用 i18n key
```

**涉及文件**：
- `src/telegram/handlers/tasks.ts` - 任务显示
- `src/domain/tasks.ts` - 任务逻辑
- 其他读取任务数据的文件

### 3. 数据迁移策略

**选项 A：直接替换**（推荐）
- 将数据库中的中文直接替换为 i18n keys
- 优点：简单直接
- 缺点：需要确保所有 keys 都存在

**选项 B：添加新字段**
- 保留 `name` 字段（中文），添加 `name_key` 字段（i18n key）
- 优点：可以回滚
- 缺点：需要维护两套数据

**选项 C：混合方案**
- 新数据使用 i18n keys
- 旧数据保持中文，代码中兼容处理
- 优点：渐进式迁移
- 缺点：需要兼容逻辑

---

## 📋 建议方案

### 推荐方案：直接替换 + 代码更新

**步骤**：

1. **生成迁移脚本**：
   ```bash
   npx tsx scripts/generate-db-migration.ts
   ```

2. **执行迁移**：
   ```bash
   # 在 staging 环境测试
   npx wrangler d1 execute <db-name> --file=src/db/migrations/XXXX_update_tasks_to_i18n_keys.sql --env staging --remote
   ```

3. **更新代码**：
   - 修改 `src/telegram/handlers/tasks.ts`
   - 修改 `src/domain/tasks.ts`
   - 使用 `i18n.t(task.name)` 显示任务名称

4. **测试验证**：
   - 测试任务显示
   - 测试任务完成
   - 测试任务奖励

---

## ✅ 验证清单

### 提取验证

- [x] SQL 文件已扫描
- [x] 中文内容已提取
- [x] 已生成 keys
- [x] 已添加到 CSV

### 替换验证

- [ ] 数据库迁移脚本已生成
- [ ] 数据库迁移脚本已执行（staging）
- [ ] 代码已更新（使用 i18n.t()）
- [ ] 测试已通过

---

## 📄 相关文件

- `i18n_complete_final.json` - 提取结果（包含数据库内容）
- `src/db/migrations/0030_create_tasks_table.sql` - 任务表迁移
- `src/telegram/handlers/tasks.ts` - 任务处理
- `scripts/generate-db-migration.ts` - 迁移脚本生成器（待创建）

---

**结论**：

- ✅ **提取已完成**：数据库中的中文硬编码已全部提取
- ❌ **替换未开始**：数据库数据和代码都还没有更新
- ⚠️ **需要生成迁移脚本**：将数据库中的中文替换为 i18n keys

