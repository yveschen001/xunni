# i18n 修复清单

## 问题 1: 数据库硬编码

### 位置
- `src/db/migrations/0030_create_tasks_table.sql` - tasks 表的初始数据
- `src/telegram/handlers/menu.ts` - 第 70-72 行，使用 `nextTask.name` 和 `nextTask.description`
- `src/telegram/handlers/tasks.ts` - 多处使用 `task.name` 和 `task.description`
- `src/telegram/handlers/tasks.ts` - `checkAndCompleteTask` 函数中使用 `task.name`

### 解决方案
1. 数据库迁移：将 `tasks` 表的 `name` 和 `description` 改为 i18n keys
2. 代码修改：读取任务时使用 `i18n.t()` 翻译 keys

## 问题 2: 路由语言传递

### 位置
- `src/router.ts` 第 924 行：`lang_back` 使用硬编码 `createI18n('zh-TW')`
- `src/router.ts` 第 943 行：`lang_page_` 使用硬编码 `createI18n('zh-TW')`
- `src/telegram/handlers/settings.ts` 第 93 行：`user` 变量未定义
- `src/telegram/handlers/tasks.ts` - 多处硬编码中文
- `src/router.ts` - 很多 callback handler 没有先获取用户 `language_pref`

### 解决方案
1. 所有 callback handler 先获取用户 `language_pref`
2. 使用 `createI18n(user.language_pref || 'zh-TW')` 而不是硬编码

