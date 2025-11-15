# Staging 部署指南

## 📋 部署前准备

### 1. 环境变量
确保你有以下信息：
- ✅ Telegram Bot Token (Staging): `8226418094:AAE5wfp_AvKW36yqya502hUEJQIdSDrYJM`
- ✅ OpenAI API Key: 已提供

### 2. Cloudflare 账号
- 确保已登录 Cloudflare
- 确保有权限创建 D1 数据库和 Workers

---

## 🚀 部署步骤

### 第一步：创建 D1 数据库

```bash
# 创建数据库
wrangler d1 create xunni-db

# 记录输出的 database_id，更新到 wrangler.toml
```

**输出示例**：
```
✅ Successfully created DB 'xunni-db'!

[[d1_databases]]
binding = "DB"
database_name = "xunni-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 第二步：更新 wrangler.toml

确保 `wrangler.toml` 中有正确的 database_id：

```toml
[env.staging]
name = "xunni-bot-staging"
vars = { ENVIRONMENT = "staging" }

[[env.staging.d1_databases]]
binding = "DB"
database_name = "xunni-db"
database_id = "你的-database-id"
```

### 第三步：运行数据库迁移

```bash
# 运行所有迁移脚本
wrangler d1 migrations apply xunni-db --remote

# 确认迁移成功
wrangler d1 execute xunni-db --remote --command "SELECT name FROM sqlite_master WHERE type='table';"
```

**预期输出**：应该看到 11 个表：
- users
- bottles
- conversations
- conversation_messages
- bottle_chat_history
- daily_usage
- reports
- bans
- user_blocks
- mbti_test_progress
- payments

### 第四步：设置环境变量

```bash
# 设置 Telegram Bot Token
wrangler secret put TELEGRAM_BOT_TOKEN --env staging
# 输入: 8226418094:AAE5wfp_AvKW36yqya502hUEJQIdSDrYJM

# 设置 OpenAI API Key
wrangler secret put OPENAI_API_KEY --env staging
# 输入: 你的 OpenAI API Key
```

### 第五步：部署 Worker

```bash
# 部署到 Staging
pnpm deploy:staging
```

**预期输出**：
```
✨ Successfully published your Worker!
URL: https://xunni-bot-staging.your-subdomain.workers.dev
```

### 第六步：设置 Webhook

```bash
# 替换 <YOUR_WORKER_URL> 为实际的 Worker URL
curl -X POST "https://api.telegram.org/bot8226418094:AAE5wfp_AvKW36yqya502hUEJQIdSDrYJM/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://xunni-bot-staging.your-subdomain.workers.dev/webhook"}'
```

**预期输出**：
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

### 第七步：验证部署

```bash
# 检查 Webhook 状态
curl "https://api.telegram.org/bot8226418094:AAE5wfp_AvKW36yqya502hUEJQIdSDrYJM/getWebhookInfo"
```

**预期输出**：
```json
{
  "ok": true,
  "result": {
    "url": "https://xunni-bot-staging.your-subdomain.workers.dev/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

---

## 🧪 测试指令

### 开发专用指令（⚠️ 生产环境需移除）

#### 1. `/dev_reset` - 重置用户数据
- **功能**: 删除当前用户的所有数据
- **用途**: 重新测试注册流程
- **警告**: 会删除所有数据，不可恢复

#### 2. `/dev_info` - 查看用户信息
- **功能**: 显示当前用户的详细信息
- **用途**: 调试和验证数据

#### 3. `/dev_skip` - 跳过注册
- **功能**: 自动完成注册，直接进入核心功能
- **用途**: 快速测试核心功能

### 数据库重置脚本

```bash
# 重置整个数据库（需要确认）
pnpm reset-db
```

**警告**: 这会删除数据库中的所有数据！

---

## 📊 自动化测试

### 运行 Smoke Test

```bash
# 确保 Worker URL 正确
export WORKER_URL="https://xunni-bot-staging.your-subdomain.workers.dev"

# 运行测试
pnpm smoke-test
```

### 运行 Onboarding Test

```bash
# 测试完整注册流程
pnpm tsx scripts/comprehensive-test.ts
```

### 运行 MBTI Test

```bash
# 测试 MBTI 流程
pnpm tsx scripts/test-mbti-flow.ts
```

---

## 🎯 手动测试清单

### 1. 注册流程 ✅
- [ ] 发送任意消息触发欢迎
- [ ] 选择语言（繁体中文）
- [ ] 输入昵称
- [ ] 选择性别
- [ ] 输入生日（验证 18+ 限制）
- [ ] MBTI 测验（测试/手动/跳过）
- [ ] 反诈骗确认
- [ ] 服务条款同意
- [ ] 完成注册

### 2. 核心功能 ✅
- [ ] `/throw` - 丢漂流瓶
- [ ] `/catch` - 捡漂流瓶
- [ ] 发送消息（匿名聊天）
- [ ] 验证翻译功能
- [ ] `/profile` - 查看资料
- [ ] `/stats` - 查看统计
- [ ] `/chats` - 查看对话

### 3. VIP 功能 ✅
- [ ] `/vip` - 查看 VIP 信息
- [ ] 购买 VIP（Telegram Stars）
- [ ] 验证 VIP 权益

### 4. 安全功能 ✅
- [ ] `/block` - 封锁用户
- [ ] `/report` - 举报用户
- [ ] URL 白名单验证

### 5. 开发功能 ⚠️
- [ ] `/dev_reset` - 重置数据
- [ ] `/dev_info` - 查看信息
- [ ] `/dev_skip` - 跳过注册

---

## 🐛 常见问题

### 1. Webhook 设置失败
**问题**: `{"ok":false,"error_code":400,"description":"Bad Request: bad webhook..."}`

**解决**:
- 确保 Worker URL 是 HTTPS
- 确保 URL 可以公开访问
- 检查 Bot Token 是否正确

### 2. 数据库连接失败
**问题**: `D1_ERROR: no such table: users`

**解决**:
```bash
# 重新运行迁移
wrangler d1 migrations apply xunni-db --remote
```

### 3. 环境变量未设置
**问题**: `TELEGRAM_BOT_TOKEN is not defined`

**解决**:
```bash
# 重新设置 secrets
wrangler secret put TELEGRAM_BOT_TOKEN --env staging
wrangler secret put OPENAI_API_KEY --env staging
```

### 4. Bot 无响应
**检查清单**:
1. Webhook 是否正确设置？
2. Worker 是否成功部署？
3. 环境变量是否正确？
4. 数据库迁移是否完成？

**调试命令**:
```bash
# 查看 Worker 日志
wrangler tail --env staging

# 检查 Webhook
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

---

## 📝 测试报告模板

### 测试日期: ____

#### 功能测试
- [ ] 注册流程: ✅ / ❌
- [ ] 漂流瓶: ✅ / ❌
- [ ] 匿名聊天: ✅ / ❌
- [ ] 翻译功能: ✅ / ❌
- [ ] VIP 购买: ✅ / ❌
- [ ] 统计数据: ✅ / ❌

#### 发现的问题
1. 
2. 
3. 

#### 性能指标
- 响应时间: ____ ms
- 翻译延迟: ____ ms
- 数据库查询: ____ ms

#### 建议
1. 
2. 
3. 

---

## 🚀 下一步

### 测试通过后
1. 修复发现的问题
2. 优化用户体验
3. 准备 Production 部署

### Production 部署前
1. **移除开发命令**:
   - 删除 `/dev_reset`
   - 删除 `/dev_info`
   - 删除 `/dev_skip`
   - 删除 `scripts/reset-db.ts`

2. **更新文档**:
   - 移除开发指令说明
   - 更新部署指南

3. **安全检查**:
   - 确认所有 secrets 已设置
   - 确认数据库备份策略
   - 确认监控和日志

---

**文档生成时间**: 2025-11-16 04:00  
**状态**: ✅ 准备部署  
**环境**: Staging

