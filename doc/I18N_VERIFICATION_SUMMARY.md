# i18n 全面检验总结

**生成时间**: 2025-01-15  
**文档版本**: v1.0

## 文档完整性确认

### ✅ 已包含的检查项

#### 1. 代码文件检查
- ✅ 所有 `*.ts` 文件的硬编码检查
- ✅ i18n keys 与 CSV 的对应关系检查
- ✅ TypeScript 类型检查
- ✅ `createI18n()` 使用检查

#### 2. 路由检查
- ✅ `src/router.ts` 中的硬编码检查
- ✅ Callback query 路由的语言偏好检查
- ✅ 命令路由的语言偏好检查
- ✅ Webhook 处理中的 i18n 使用检查
- ✅ 路由中的错误消息和按钮文本检查

#### 3. 数据库检查
- ✅ 迁移脚本检查
- ✅ SQL 文件中的硬编码检查
- ✅ 数据库查询中的 i18n keys 处理检查
- ✅ 向后兼容性检查
- ✅ 数据库写入时的 i18n keys 使用检查

#### 4. 网络/API 检查
- ✅ 外部 API 调用的错误处理检查
- ✅ HTTP 响应中的 i18n 使用检查
- ✅ Telegram API 调用的 i18n 使用检查
- ✅ 翻译服务的错误处理检查
- ✅ Webhook 回调中的 i18n 使用检查
- ✅ `fetch` 调用的错误处理检查
- ✅ 网络超时和错误处理检查

#### 5. CSV 完整性检查
- ✅ CSV 格式检查
- ✅ 所有语言列存在性检查
- ✅ Keys 完整性检查

## 检查工具

### 自动化脚本

1. **`scripts/verify-i18n-completeness.ts`**
   - 提取代码中使用的所有 i18n keys
   - 提取 CSV 中的所有 keys
   - 提取 zh-TW.ts 中的所有 keys
   - 检查硬编码中文
   - 检查数据库迁移
   - 检查路由中的 i18n 使用
   - 检查网络/API 调用中的 i18n 使用

2. **`pnpm check:i18n`**
   - 检查所有 `*.ts` 文件中的硬编码中文
   - 排除技术标识符、注释等

### 手动检查命令

所有检查命令都已记录在 `doc/I18N_VERIFICATION_PLAN.md` 中，包括：
- 硬编码检查命令
- i18n Key 存在性检查命令
- 类型检查命令
- 路由检查命令
- 数据库迁移检查命令
- 网络/API 检查命令

## 当前发现的问题

### 1. 路由中的硬编码（router.ts）

**发现的问题**：
- 第 99-101 行：媒体消息拒绝提示（硬编码中文）
- 第 259 行：回复检测中的硬编码（`📝 請輸入你的漂流瓶內容：`）
- 第 278-300 行：对话回复检测中的硬编码（`💬 回覆`、`💬 與 #`、`💬 來自 #`）
- 第 342-350 行：教程提示消息（硬编码中文）
- 第 431, 445, 500, 511, 522, 534, 545, 556, 568, 580, 592, 604, 621 行：管理员权限错误消息（硬编码中文）
- 第 1574 行：VIP 取消消息（硬编码中文）
- 第 1577 行：VIP 取消购买消息（硬编码中文）
- 第 1592 行：VIP 续费处理消息（硬编码中文）
- 第 1598, 1601 行：VIP 取消提醒消息（硬编码中文）
- 第 1608 行：未知操作消息（硬编码中文）

**需要修复**：
- 所有硬编码消息都需要替换为 `i18n.t()` 调用
- 确保所有路由处理都获取用户语言偏好

### 2. 数据库迁移

**已完成**：
- ✅ 迁移脚本已创建：`0050_update_tasks_to_i18n_keys.sql`
- ✅ 包含 8 个任务的迁移
- ✅ 所有 tasks keys 都在 CSV 中

**待处理**：
- ⚠️ `task_confirm_country` 未包含在迁移脚本中
- ⚠️ 需要检查其他表是否有硬编码中文

### 3. 网络/API 调用

**需要检查**：
- `src/services/gemini.ts` - Gemini API 错误处理
- `src/services/translation/google.ts` - Google Translate API 错误处理
- `src/services/translation/openai.ts` - OpenAI API 错误处理
- `src/api/*.ts` - API 端点的响应消息
- `src/worker.ts` - HTTP 路由的响应消息

## 检查流程

### 完整检查流程

1. **代码检查**
   ```bash
   pnpm check:i18n
   pnpm typecheck
   pnpm lint
   ```

2. **Keys 对应关系检查**
   ```bash
   pnpm tsx scripts/verify-i18n-completeness.ts
   ```

3. **路由检查**
   ```bash
   pnpm check:i18n | grep "router.ts"
   grep -r "createI18n" src/router.ts
   ```

4. **数据库检查**
   ```bash
   grep -E "tasks\.(name|description)\." src/db/migrations/*.sql
   grep -r "[\u4e00-\u9fa5]" src/db/migrations/*.sql
   ```

5. **网络/API 检查**
   ```bash
   pnpm check:i18n | grep -E "(services|api)/"
   grep -r "fetch\|axios\|http" src/services --include="*.ts" | grep -E "[\u4e00-\u9fa5]"
   ```

## 修复优先级

### 优先级 1：路由硬编码（高）
- 影响用户体验
- 需要立即修复
- 预计工作量：2-4 小时

### 优先级 2：缺失的 i18n keys（高）
- 262 个缺失的 keys
- 需要添加到 CSV 和 zh-TW.ts
- 预计工作量：4-6 小时

### 优先级 3：其他硬编码（中）
- 95 个文件中的硬编码
- 逐步修复
- 预计工作量：8-16 小时

### 优先级 4：数据库迁移完善（中）
- 添加 `task_confirm_country` 到迁移脚本
- 检查其他表的硬编码
- 预计工作量：1-2 小时

### 优先级 5：网络/API 检查（低）
- 主要是错误处理
- 影响较小
- 预计工作量：2-4 小时

## 结论

✅ **文档完整性**：
- 所有检查项都已记录在 `doc/I18N_VERIFICATION_PLAN.md`
- 包括代码、路由、数据库、网络/API 的全面检查
- 包含机器检查和 AI 检查方法
- 包含详细的检查清单和修复流程

✅ **检查工具**：
- 自动化检查脚本已创建
- 手动检查命令已记录
- 所有检查方法都已实现

⚠️ **待修复问题**：
- 路由中的硬编码（约 15+ 处）
- 缺失的 i18n keys（262 个）
- 其他文件中的硬编码（95 个文件）
- 数据库迁移完善（1 个任务）

**下一步**：
1. 修复路由中的硬编码
2. 添加缺失的 i18n keys
3. 逐步修复其他硬编码
4. 完善数据库迁移

